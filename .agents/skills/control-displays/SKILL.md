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
| `panelctl.py button <N> "<config>"` | write Button N Config |
| `panelctl.py apply` | press Apply Configuration (persist + reboot) |

Always `dump`/`buttons`/`get` first to learn the exact friendly names on *this*
device before writing — names come from `product/v2/entity_names.json` and can
differ per profile.

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
overflow spilling into `Subpage N Config Ext` … `Ext 7`. Related knobs:
`Button Order`, `Button On Color`.

## Applying changes (persist + reboot)

Individual writes take effect **live** (the panel refreshes the grid), but
ESPHome batches preference writes, so they may not survive a power cycle until
flushed. To persist:

- `panelctl.py apply` — presses **Apply Configuration**, which runs
  `global_preferences->sync()` then `safe_reboot()`. **The panel reboots.**
- Or `panelctl.py press "Restart"` for a plain restart.

Tell the user before you apply — it drops the display for a few seconds.

## Common mistakes

- Writing to the object_id path (`/text/button_1_config/...`) → 404. Use the
  friendly name, URL-encoded.
- Forgetting `Content-Length` on the POST → `411 Length Required`. The helper
  and the curl recipe send an empty body, which fixes this.
- Assuming individual `GET /<domain>/<name>` returns state → 404 for config
  entities. Read from `/events`.
- Guessing entity names. They vary by device profile; `dump` first.
- Persisting without warning — Apply/Restart reboots a display someone may be
  looking at.
