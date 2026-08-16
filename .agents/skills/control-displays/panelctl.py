#!/usr/bin/env python3
"""panelctl - talk to a running EspControl panel over its HTTP web server.

The panel runs ESPHome's web_server (v3) on port 80 with include_internal: true.
State is published on a Server-Sent-Events stream; control is done by POSTing to
per-entity REST endpoints. Two quirks discovered on-device and baked in here:

  * Entity state is only readable from GET /events (individual GETs 404 for the
    internal config entities). So we always read by sampling the SSE stream.
  * The REST control path keys on the entity's *friendly name* (URL-encoded,
    spaces as %20), NOT its sanitized object_id. `/text/button_1_config/set`
    404s; `/text/Button%201%20Config/set` works.

POST bodies are empty but must send Content-Length (urllib does this for us when
data=b'').

Host resolution: --host flag, else $ESPCONTROL_HOST.

Examples:
  panelctl.py dump                                  # every entity + state
  panelctl.py buttons                               # all Button/Subpage configs
  panelctl.py get "Screensaver Timeout"             # one entity's state
  panelctl.py button 1 "light.kitchen;Kitchen;;;;;light_brightness"
  panelctl.py set-text "Button On Color" 00A6FF
  panelctl.py number "Screen: Daytime Brightness" 80
  panelctl.py select "Home Assistant Artwork Protocol" https
  panelctl.py light "Display Backlight" on --brightness 200
  panelctl.py press "Apply Configuration"           # persists + reboots panel
  panelctl.py apply                                 # alias for the line above
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request

# Field order of a "Button N Config" / subpage-slot string, semicolon-delimited.
# Trailing empty fields may be omitted. From product/v2/card_contract.json.
CARD_FIELDS = ["entity", "label", "icon", "icon_on", "sensor", "unit", "type", "precision", "options"]


def base_url(host: str) -> str:
    host = host.strip()
    if not host.startswith("http"):
        host = "http://" + host
    return host.rstrip("/")


def read_states(host: str, timeout: float = 2.5) -> list[dict]:
    """Sample the SSE stream and return the latest state event per entity."""
    url = base_url(host) + "/events"
    states: dict[str, dict] = {}
    deadline = time.time() + timeout
    try:
        with urllib.request.urlopen(url, timeout=timeout + 2) as resp:
            event = None
            for raw in resp:
                if time.time() > deadline:
                    break
                line = raw.decode("utf-8", "replace").rstrip("\n")
                if line.startswith("event:"):
                    event = line.split(":", 1)[1].strip()
                elif line.startswith("data:") and event == "state":
                    try:
                        obj = json.loads(line.split(":", 1)[1].strip())
                    except json.JSONDecodeError:
                        continue
                    key = obj.get("id") or obj.get("name_id") or obj.get("name")
                    if key:
                        states[key] = obj
    except Exception as exc:  # noqa: BLE001 - surface any network error plainly
        sys.exit(f"error: could not read {url}: {exc}")
    return list(states.values())


def find_state(host: str, name: str) -> dict | None:
    want = name.lower()
    for st in read_states(host):
        if st.get("name", "").lower() == want:
            return st
    return None


def post(host: str, domain: str, name: str, action: str, params: dict | None = None) -> None:
    path = f"/{domain}/{urllib.parse.quote(name)}/{action}"
    query = ("?" + urllib.parse.urlencode(params)) if params else ""
    url = base_url(host) + path + query
    req = urllib.request.Request(url, data=b"", method="POST")  # empty body -> Content-Length: 0
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            code = resp.getcode()
    except urllib.error.HTTPError as exc:
        sys.exit(f"error: POST {url} -> HTTP {exc.code}")
    except Exception as exc:  # noqa: BLE001
        sys.exit(f"error: POST {url}: {exc}")
    if code != 200:
        sys.exit(f"error: POST {url} -> HTTP {code}")
    print(f"ok: {domain}/{name}/{action}{query}")


# ---- commands -------------------------------------------------------------

def cmd_dump(host, args):
    rows = sorted(read_states(host), key=lambda s: (s.get("domain", ""), s.get("name", "")))
    for st in rows:
        state = st.get("state", st.get("value", ""))
        print(f"{st.get('domain',''):14} {st.get('name',''):34} = {state}")


def cmd_buttons(host, args):
    rows = read_states(host)
    cfgs = {s["name"]: s.get("state", "") for s in rows if s.get("domain") == "text"
            and ("Config" in s.get("name", ""))}
    for name in sorted(cfgs, key=_button_sort_key):
        print(f"{name:26} = {cfgs[name]}")


def _button_sort_key(name: str):
    parts = name.split()
    num = next((int(p) for p in parts if p.isdigit()), 0)
    return (0 if name.startswith("Button") else 1, num, name)


def cmd_get(host, args):
    st = find_state(host, args.name)
    if not st:
        sys.exit(f"error: no entity named {args.name!r} (try: panelctl.py dump)")
    print(json.dumps(st, indent=2))


def cmd_set_text(host, args):
    post(host, "text", args.name, "set", {"value": args.value})


def cmd_number(host, args):
    post(host, "number", args.name, "set", {"value": args.value})


def cmd_select(host, args):
    post(host, "select", args.name, "set", {"option": args.option})


def cmd_light(host, args):
    action = {"on": "turn_on", "off": "turn_off", "toggle": "toggle"}[args.action]
    params = {}
    if args.brightness is not None and action != "turn_off":
        params["brightness"] = args.brightness
    post(host, "light", args.name, action, params or None)


def cmd_switch(host, args):
    action = {"on": "turn_on", "off": "turn_off", "toggle": "toggle"}[args.action]
    post(host, "switch", args.name, action)


def cmd_press(host, args):
    post(host, "button", args.name, "press")


def cmd_button(host, args):
    post(host, "text", f"Button {args.n} Config", "set", {"value": args.config})


def cmd_apply(host, args):
    post(host, "button", "Apply Configuration", "press")
    print("Applied: panel is flushing preferences and rebooting.")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Control a running EspControl panel over HTTP.")
    p.add_argument("--host", default=os.environ.get("ESPCONTROL_HOST", ""),
                   help="panel IP/hostname (or set $ESPCONTROL_HOST)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("dump", help="list every entity and its state").set_defaults(fn=cmd_dump)
    sub.add_parser("buttons", help="list all Button/Subpage config strings").set_defaults(fn=cmd_buttons)
    sub.add_parser("apply", help="press Apply Configuration (persist + reboot)").set_defaults(fn=cmd_apply)

    g = sub.add_parser("get", help="show one entity's full state JSON")
    g.add_argument("name"); g.set_defaults(fn=cmd_get)

    t = sub.add_parser("set-text", help="set a text entity")
    t.add_argument("name"); t.add_argument("value"); t.set_defaults(fn=cmd_set_text)

    n = sub.add_parser("number", help="set a number entity")
    n.add_argument("name"); n.add_argument("value"); n.set_defaults(fn=cmd_number)

    s = sub.add_parser("select", help="set a select entity")
    s.add_argument("name"); s.add_argument("option"); s.set_defaults(fn=cmd_select)

    li = sub.add_parser("light", help="control a light entity")
    li.add_argument("name"); li.add_argument("action", choices=["on", "off", "toggle"])
    li.add_argument("--brightness", type=int, default=None, help="0-255"); li.set_defaults(fn=cmd_light)

    sw = sub.add_parser("switch", help="control a switch entity")
    sw.add_argument("name"); sw.add_argument("action", choices=["on", "off", "toggle"])
    sw.set_defaults(fn=cmd_switch)

    pr = sub.add_parser("press", help="press a button entity")
    pr.add_argument("name"); pr.set_defaults(fn=cmd_press)

    b = sub.add_parser("button", help="set Button N Config (N = slot number)")
    b.add_argument("n", type=int); b.add_argument("config",
        help="entity;label;icon;icon_on;sensor;unit;type;precision;options")
    b.set_defaults(fn=cmd_button)

    return p


def main() -> None:
    args = build_parser().parse_args()
    if not args.host:
        sys.exit("error: no host. Pass --host <ip> or set $ESPCONTROL_HOST.")
    args.fn(args.host, args)


if __name__ == "__main__":
    main()
