---
name: control-displays
description: >-
  Talk to a running EspControl panel over its HTTP web server to read state and
  change settings or card layout live, without flashing firmware. Use when the
  user wants to inspect, configure, program, or control a physical display by
  IP/hostname — read entity state, set brightness/screensaver/schedule options,
  reorder buttons, write button/subpage card configs, or apply and reboot. Use
  when the user says "program the display", "configure the panel over HTTP",
  "set button N", "read the panel state", or gives a panel IP to change settings.
  For building and uploading firmware over OTA/USB, use flash-displays instead.
---

# Control Displays over HTTP

EspControl panels run ESPHome's `web_server` (v3) on **port 80** with
`include_internal: true` (see `common/device/core_infra.yaml`). That exposes the
whole device — display backlight, brightness, screensaver, schedule, and every
card/button config entity — for reading and control over plain HTTP. This skill
drives that surface. No flashing, no Home Assistant, no browser required.

**This changes a live physical panel.** Confirm the target IP with the user, and
never persist/reboot mid-session without saying so (see Applying changes).

## Prerequisites

- The panel's IP or hostname. Ask if not given. Set once:
  `export ESPCONTROL_HOST=<ip>` (the helper also takes `--host`).
- Network reachability. Verify: `curl -s -m5 -o /dev/null -w '%{http_code}\n' http://$ESPCONTROL_HOST/` → `200`.

## Quick reference (helper script)

Run `panelctl.py` from this skill directory (stdlib only, no deps):

| Command | Does |
|---|---|
| `panelctl.py dump` | list every entity + current state |
| `panelctl.py buttons` | list all Button/Subpage config strings |
| `panelctl.py get "<Name>"` | full state JSON for one entity |
| `panelctl.py set-text "<Name>" "<value>"` | set a text entity |
| `panelctl.py number "<Name>" <value>` | set a number entity |
| `panelctl.py select "<Name>" <option>` | set a select entity |
| `panelctl.py light "<Name>" on\|off\|toggle [--brightness 0-255]` | control a light |
| `panelctl.py switch "<Name>" on\|off\|toggle` | control a switch |
| `panelctl.py press "<Name>"` | press a button entity |
| `panelctl.py doc` | dump the **durable** PanelConfig document (buttons/subpages/settings) |
| `panelctl.py button <N> "<config>"` | set Button N **durably** (survives reboot) |
| `panelctl.py subpage <N> "<config>"` | set Subpage N **durably** (survives reboot) |
| `panelctl.py apply` | press Apply Configuration (reboot; see caveat below) |

Add `--live` to `button`/`subpage` for a preview-only write (lost on reboot).

Always `dump`/`buttons`/`get`/`doc` first to learn the exact friendly names /
current config on *this* device before writing — names come from
`product/v2/entity_names.json` and can differ per profile.

> **Live vs durable — read this before "programming" anything.** Card/button
> layout has TWO layers. A `POST /text/.../set` (what `set-text` and `--live`
> do) updates the tile **live for preview only** — on the next reboot the
> firmware reloads its durable binary document and **overwrites your change**.
> Pressing **Apply Configuration** / **Restart** just reboots; it does **not**
> rescue a live text-set into the durable doc. To make a card/button change
> **stick**, write the durable document (`panelctl.py button`/`subpage`/the
> `/api/v1/config` PUT below). Durable writes also apply live, so no reboot is
> needed.

## How the HTTP surface actually works (two quirks)

Both were verified on-device; they are not the textbook ESPHome behavior:

1. **Read state only via the SSE stream.** `GET /events` streams
   `event: state` / `data: {…}` lines for every entity. Individual GETs
   (`GET /text/button_1_config`) **404** for the internal config entities, so
   the helper always samples `/events` (~2.5s) to read.
2. **Control paths key on the friendly *name*, not the object_id.** The working
   endpoint is `POST /<domain>/<URL-encoded Name>/<action>` with an **empty body
   that still sends `Content-Length`**. Example — this returns 200:
   `POST /text/Button%201%20Config/set?value=...`
   while `POST /text/button_1_config/set?...` returns **404**.

### Manual curl fallback (if the helper can't run)

```bash
H=http://$ESPCONTROL_HOST
# read: sample the event stream
curl -s -m4 -N "$H/events" | grep 'event: state' -A1
# write: friendly name, url-encoded, empty POST body (Content-Length: 0)
curl -s -X POST -H "Content-Length: 0" \
  "$H/number/Screensaver%20Timeout/set?value=1800"
```

Actions by domain: `light` → `turn_on`/`turn_off`/`toggle` (`?brightness=0-255`),
`switch` → same, `number` → `set?value=`, `select` → `set?option=`,
`text` → `set?value=`, `button` → `press`.

## Programming cards (buttons & subpages)

Each grid slot is a **text entity** `Button N Config` holding a semicolon-
delimited string. Field order (from `product/v2/card_contract.json`, trailing
empties may be dropped):

```
entity;label;icon;icon_on;sensor;unit;type;precision;options
```

Live examples from a real panel:

```
weather.forecast_home;;Auto;Auto;;;weather;today
camera.front_door...;Door;Auto;Auto;;;image;;image_label
light.lobby_dimmer;Lights;Lightbulb;Auto;indicator;;subpage;;subpage_kind=lights
```

Set one: `panelctl.py button 1 "light.kitchen;Kitchen;;;;;light_brightness"`
(empty `type` = the default Switch card).

**Common `type` values:** `light_brightness`, `light_switch`, `light_control`,
`cover`, `garage`, `gate`, `climate`, `climate_control`, `media`, `weather`,
`weather_forecast`, `image` (camera), `sensor`, `action`, `alarm`, `lock`,
`vacuum`, `option_select`, `subpage`, `push`. Empty = Switch. Full list +
options: `python3 -c "import json;print(list(json.load(open('product/v2/card_contract.json'))['cards']))"`.

**Subpages:** a `subpage` button's children live in `Subpage N Config`, with
overflow spilling into `Subpage N Config Ext` … `Ext 7`. See the compact codec
below. Related knobs: `Button Order`, `Button On Color`.

## Home-grid layout (`Button Order` text entity)

`Button N Config` defines *what* each tile is; the **`Button Order`** text
entity defines *where* each tile sits and *how big* it is. It is a comma list,
one token per grid cell, in **row-major order** (0 = top-left). Grid dimensions
come from `product/v2/device_catalog.json` (`layout.cols`/`layout.rows`); the
7-inch jc1060p470 is **5 cols × 3 rows = 15 cells** (bottom-right = index 14).

Each token is a 1-based button number plus an optional **size suffix**:

| Suffix | Size (rows×cols) | | Suffix | Size |
|---|---|---|---|---|
| (none) | 1×1 | | `x` | 1×3 extra-wide |
| `d` | 2×1 tall | | `t` | 3×1 extra-tall |
| `w` | 1×2 wide | | `h` | 2×3 |
| `b` | 2×2 | | `v` | 3×2 |

Empty token = blank cell. A multi-cell tile occupies its origin cell **plus the
cells its span covers** (to the right / below); those covered cells MUST be left
empty in the string, or firmware zeroes them (`clear_spanned_cells`). A tile
whose span would run off the grid edge is clipped — don't place a `d` (tall) in
the last row or a `w` (wide) in the last column.

Example (real 7-inch): `2,3,,4w,,5d,6d,,7w,,,,,1w` →
```
[2 ][3 ][  ][4 wide → ][=4]
[5↕][6↕][  ][7 wide → ][=7]
[5 ][6 ][  ][1 wide → ][=1]
```
Read/set with `panelctl.py get "Button Order"` / `set-text "Button Order" "..."`.
Firmware parser: `components/espcontrol/button_grid_layout.h` (`parse_order_string`).

## Subpage config compact codec

`Subpage N Config` (+ `Ext`…`Ext 7` overflow, 255 bytes/field) uses a compact
format when it starts with `~`:

```
~<order>|<card1>|<card2>|...
```
- `<order>` = comma list, same row-major cell mapping as `Button Order`, but the
  values are **1-based indices into the card list** that follows (not button
  numbers). A back-button token (`B`, optionally `B=Label`) marks the Back tile.
- each `<cardN>` = `CODE,entity,label,icon,icon_on,sensor,unit,precision,options`
  — **type comes from CODE, not a field**. Fields after `entity` map to the same
  card fields as a button (icon/icon_on default to `Auto`). Commas/pipes inside a
  value must be encoded; plain spaces are fine.

A subpage string longer than 255 bytes is fine: the firmware chunks it across
`Subpage N Config` + `Ext`…`Ext 7` (8×255). The durable doc stores it as one
record. **Gotcha:** writing an *active* subpage (one a button points at) can race
the panel's live re-render, which round-trips through the 255-byte primary text
entity and truncates the stored doc — so `panelctl.py subpage` verifies the
round-trip and retries; if it still truncates, write when that subpage isn't
on-screen, or reboot after writing (the boot restore path chunks it correctly).

CODE is the subpage type code from `card_contract.json` `subpageTypeCodes`
(e.g. `LC`=light_control, `Q`=light_switch, `V`=light_brightness, `W`=weather,
`S`=sensor, `A`=action, `CK`=clock). Example:
```
~B,1,,,,2|LC,light.lobby_door_dl,Lobby,Lightbulb Outline,Lightbulb|LC,light.front_yard_downlights,Front Yard,Lightbulb Outline,Lightbulb
```
= Back tile, card 1 in cell 1, card 2 in cell 5. Codec:
`src/webserver/model/subpage.ts` (`parseCompactSubpageConfig`/`serializeCompactSubpageConfig`).

## Durable config document (`/api/v1/config`) — the persistence path

The authoritative store is a binary **PanelConfig document** the firmware
reloads on every boot. This is what the web configurator writes, and the only
way a card/button/subpage change survives a reboot.

- `GET /api/v1/capabilities` → `{configuration:{read,write,document_versions}}`
- `GET /api/v1/config` → the document, `Content-Type
  application/vnd.espcontrol.panel-config`, with an **`ETag`** (generation).
- `PUT /api/v1/config` with body = new document and **`If-Match: <ETag>`**
  (a stale ETag → **412**, meaning someone else changed it — re-GET and retry).
  The PUT applies to the **live runtime** *and* persists — no reboot needed.

Format (`EPCF`, v1; codec mirrors `src/webserver/model/panel_config.ts`, ported
into `panelctl.py` as `pc_decode`/`pc_encode`): 16-byte header
(`magic[4]`, `u16 version=1`, `u16 headerSize=16`, `u32 payloadLen`,
`u16 recordCount`, `u16 reserved=0`) then records `type(1) | u16 len | body`.
Record types: `1`=deviceProfile, `2`=button `slot(1)+string`,
`3`=subpage `slot(1)+string`, `4`=setting `keyLen(1)+key+value`. No in-document
checksum (that lives in the firmware's two-slot store, not the payload).

`panelctl.py button/subpage/doc` do the GET→decode→modify→PUT round-trip for you.

## Rebooting (Apply Configuration / Restart)

Rebooting is **only** for reloading the durable doc or applying firmware-level
settings — it does **not** persist live text-sets. After a durable `/api/v1/config`
PUT you do **not** need to reboot.

- `panelctl.py apply` — presses **Apply Configuration**
  (`global_preferences->sync()` then `safe_reboot()`). **The panel reboots.**
- `panelctl.py press "Restart"` — plain restart.

Tell the user before you reboot — it drops the display for a few seconds.

## Common mistakes

- **Expecting a live text-set to stick.** `set-text`/`--live` are preview-only;
  the durable doc overwrites them on reboot. Use `button`/`subpage`/the
  `/api/v1/config` PUT for changes that must persist. (This is the #1 trap.)
- Writing to the object_id path (`/text/button_1_config/...`) → 404. Use the
  friendly name, URL-encoded.
- Forgetting `Content-Length` on the POST → `411 Length Required`. The helper
  and the curl recipe send an empty body, which fixes this.
- Assuming individual `GET /<domain>/<name>` returns state → 404 for config
  entities. Read from `/events`.
- Guessing entity names. They vary by device profile; `dump` first.
- Persisting without warning — Apply/Restart reboots a display someone may be
  looking at.
