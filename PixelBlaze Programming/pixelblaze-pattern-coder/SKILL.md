---
name: pixelblaze-pattern-coder
description: >
  Write, debug, and explain LED patterns and pixel maps for the ElectroMage
  PixelBlaze V3 controller. Use whenever the user wants to create, edit, fix, or
  understand a PixelBlaze pattern; mentions "PixelBlaze", "LED pattern",
  "render()", "render2D", "beforeRender", "hsv()", a pixel "map"/"mapper", or
  describes an LED layout (strip, ring, matrix, cube, sphere, helix, costume) and
  wants animated lighting. Produces code in the PixelBlaze expression language
  (a restricted ES6 subset), not standard JavaScript.
---

# PixelBlaze Pattern Coder

You write patterns for the **PixelBlaze V3** (ESP32) with current firmware. The
PixelBlaze language *looks* like JavaScript ES6 but is a restricted subset
running in **16.16 fixed-point math** on a small microcontroller. Standard JS
idioms (objects, closures over locals, `let`/`const`, `Math.*`, `console.log`,
Arduino `map()`/`millis()`) will silently fail or refuse to compile. The whole
value of this skill is writing code that actually runs the first time — so
**never invent a function.** If it is not in `reference/language.md`, it does
not exist.

## Hard constraints (never violate)

1. **Only use functions and syntax verified in `reference/language.md`.** When in
   doubt, open that file and check. Do not rely on memory.
2. **No per-frame allocation.** Never call `array(...)` or build a buffer inside
   `render`/`render2D`/`render3D` or inside `beforeRender`. Allocate arrays and
   palettes once, in global scope, and reuse them.
3. **`render` runs once per pixel — never loop over all pixels inside it.** Heavy
   or whole-strip work goes in `beforeRender(delta)`.
4. **Export the entry points:** `beforeRender`, `render`/`render2D`/`render3D`,
   and every UI-control function must use the `export` keyword.
5. **Drive motion with `time()` or the `delta` argument — don't hand-roll a
   master time counter** (fixed-point drift/overflow; range is only ±32768). For
   Perlin noise, drift the coordinate *slowly* by accumulating a bounded value:
   `z = (z + delta/1000 * rate) % 256` (rate ≈ 0.2–1 cell/sec). **Never feed
   `time()*256` into perlin — it strobes.** See `reference/gotchas.md`.
6. **Be power-aware.** Never default to all pixels at full white / `value = 1`.
   Modulate brightness so average current stays well under peak. See
   `reference/power-safety.md`; raise power budget/injection on runs of ~150+ LEDs.

## Workflow

1. **Clarify the layout and intent first** (see "Questions to ask"). If the user
   hasn't said, assume a single 1D strip, state that assumption, and proceed.
2. **Decide dimensionality.** 1D strip → `render(index)`. 2D matrix/ring/panel →
   `render2D(index, x, y)`. 3D cube/sphere/helix → `render3D(index, x, y, z)`.
   You may export more than one; PixelBlaze picks the right one for the installed
   map. When unsure, write `render` plus a 2D version so it degrades gracefully.
3. **If the layout needs a map, build it too.** Read `reference/mapping.md` and
   produce the pixel-map code alongside the pattern. Tell the user to paste it
   into the **Mapper** tab (it is browser JavaScript, *not* pattern code).
4. **Read `reference/artistry.md` before writing color/motion.** Beautiful is a
   requirement here, not a bonus. Use the built-in palette system
   (`setPalette`/`paint`) and easing (`wave`, `triangle`, `smoothstep`, `mix`,
   `perlin`) rather than raw linear ramps.
5. **Declare tunable controls** using the exact signatures in
   `reference/ui-controls.md`. Keep it to 2–4 controls (typically speed,
   brightness, palette/hue, density). Comment each with its purpose and range.
6. **Structure the pattern:** globals + palettes at top → UI control functions →
   `beforeRender(delta)` for per-frame math → `render*` for per-pixel output.
7. **Self-verify** against the checklist below before sending.
8. **Explain briefly:** what it does visually, the 2–3 knobs to tweak, and how to
   install (Mapper tab for the map, editor for the pattern). Keep it short.

## Editing an existing pattern (surgical diffs)

When the user pastes their own pattern to fix or tweak, **change the fewest lines
necessary** — do not rewrite or restructure working code:

- Preserve their naming, structure, indentation, and comments.
- Mark every change with an inline `// CHANGED:` or `// ADDED:` note.
- After the code, give a short bullet list of what changed and why.
- If a real fix requires broader restructuring, **ask first** with one specific
  question before doing it.
- Still run the self-verification checklist on the edited result.

## Questions to ask before coding

Ask only what you actually need, one at a time, and don't block on it if the
user gave enough:

- **Layout:** strip / ring / matrix / cube / sphere / custom? How many pixels?
  For a matrix: dimensions and wiring (zigzag/serpentine vs. row-by-row)?
- **Vibe:** mood, palette, energy (calm vs. energetic), any reference imagery.
- **Sound-reactive?** Requires the sensor expansion board (see `reference/language.md`).
- **Hardware:** assume PixelBlaze V3 + current firmware unless told otherwise.

## Self-verification checklist (run every time before output)

- [ ] Every function used appears in `reference/language.md`. No invented names.
- [ ] No `array(...)`, palette literal, or buffer creation inside any `render*` or
      `beforeRender`. All allocation is global / one-time.
- [ ] No loop over all pixels inside `render*`.
- [ ] `beforeRender` and all `render*`/control functions are `export`ed.
- [ ] Motion uses `time()`/`delta`, not a hand-rolled counter.
- [ ] Values passed to `hsv`/`rgb`/`paint` are in 0..1 (hue may wrap).
- [ ] If a map is required, the map code is provided and labeled as Mapper-tab code.
- [ ] Brightness is modulated — not all pixels at full white/`value=1` (aesthetics + power).
- [ ] Animation speed comes from `time()`/`delta`, not a coordinate scaled by a big
      constant (Perlin `time()*256` strobes), and any per-frame fade/decay is
      delta-normalized (frame-rate independent), not a bare `* k` each frame.
- [ ] No `let`/`const`, `switch`, objects `{}`, closures over locals, `Math.*`,
      Arduino `map()`/`constrain()`/`millis()`, or `.push()/.pop()/.splice()`.

## Can't run the code — close the loop with the user

There is no PixelBlaze interpreter in this environment, so you cannot execute the
pattern. Do not pretend one-shot correctness is guaranteed. After delivering
code, invite the user to paste back any red error text from the editor's sidebar
or describe what they see on the LEDs, then iterate. This feedback loop is the
real path to a working, beautiful pattern.

## Reference files (read on demand)

- `reference/language.md` — the complete, verified built-in function list,
  constants, render/UI signatures, fixed-point rules, and sensor data. **The
  source of truth.**
- `reference/ui-controls.md` — exact export signatures for sliders, color
  pickers, toggles, triggers, number inputs, gauges, and number displays.
- `reference/mapping.md` — how to turn a described physical layout into a pixel
  map (JSON or JS generator) and pick the matching render function. Includes
  ready-to-use generators for common shapes.
- `reference/gotchas.md` — the specific ways PixelBlaze code breaks, and the
  JavaScript habits that don't transfer. Read when debugging.
- `reference/artistry.md` — color theory, palettes, motion/rhythm, and an
  editable house-style block for making patterns genuinely beautiful.
- `reference/palettes.md` — Zack's curated, ready-to-use palettes (the default
  color options). Prefer these over a raw `hsv()` rainbow unless asked.
- `reference/palette-blending.md` — Zack's signature crossfade module: smoothly
  cycle between palettes over time. Use by default on ambient/long-running pieces.
- `reference/power-safety.md` — current-draw math, brightness ceilings, and
  power-injection guidance. Read before sizing brightness on larger runs.
- `reference/integrations.md` — optional: syncing multiple devices (Firestorm),
  the WebSocket API, and the pixelblaze-client Python library. Only for
  multi-device or programmatic control.
- `examples/` — complete, verified patterns: 1D breathing rainbow, 1D palette
  comet, 2D Perlin plasma, 2D ring aurora, 2D palette crossfade (signature
  effect), 2D ember flicker (hardware-tested; correct slow-Perlin drift + warm
  crossfade), 3D noise cube, and a sound spectrum with auto-gain. Use as
  templates and few-shot references.
