# Sync & Programmatic Control (optional)

Only relevant when the user wants to **sync multiple Pixelblazes**, or **control
patterns/variables from outside the web editor** (a script, home automation, a
show controller). If they're just authoring patterns in the editor, ignore this
file.

Exact frame formats and library method names evolve — use the in-pattern hooks
below (which are verified in `reference/language.md`), and for the external APIs
point the user to the authoritative docs rather than hardcoding details from
memory.

## In-pattern hooks (verified)

- **`export var name`** makes a global readable/writable over the API and visible
  in the Var Watcher. This is how external tools read pattern state (e.g.
  `energyAverage`) and push values in.
- **UI control functions** (`sliderX`, `toggleX`, etc.) are also settable
  remotely — driving the control sets the same value the UI would.
- **Sync group / sequencer functions:** `nodeId()`, `sequencerNext()`,
  `sequencerGetMode()`, `playlistGetPosition()`, `playlistSetPosition()`,
  `playlistGetLength()`. Use `nodeId()` to vary behavior per device within a
  synchronized group.

`time()` is designed to stay phase-aligned across devices when synced, so
time-based patterns line up without extra work.

## Three external paths

1. **Firestorm** — Ben Hencke's helper that discovers Pixelblazes on the LAN and
   keeps them time-synchronized so the same pattern animates in phase across
   many controllers. Repo: https://github.com/simap/Firestorm
2. **WebSocket API** — each Pixelblaze serves a WebSocket (port 81) accepting JSON
   and binary frames: read/write exported vars and controls (`getVars`/`setVars`),
   switch patterns, manage the playlist, stream previews. Authoritative reference:
   https://www.bhencke.com/pixelblaze-advanced (Websocket API section). Verify
   frame shapes there before coding against them.
3. **pixelblaze-client (Python)** — `pip install pixelblaze-client`; a high-level
   synchronous wrapper for the WebSocket API (list/activate patterns, get/set
   variables and controls, manage settings). Maintained by zranger1:
   https://github.com/zranger1/pixelblaze-client

## Guidance

- Prefer the maintained `pixelblaze-client` over hand-rolling WebSocket frames for
  scripting tasks — less brittle.
- For "all my props show the same effect together," reach for Firestorm + sync
  groups, not custom networking.
- When the user asks for exact API calls, confirm against the linked docs/library
  version; don't assert a frame format or method signature from memory.
