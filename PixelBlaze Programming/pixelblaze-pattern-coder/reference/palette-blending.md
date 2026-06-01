# Palette Crossfading (Zack's signature effect)

Zack loves patterns that **slowly cross-fade between palettes**. Any time a
pattern would benefit from cycling through several of the house palettes (rather
than sitting on one), use this module. It's a house staple — reach for it by
default on ambient/long-running pieces unless the user wants a single fixed
palette.

Credit: palette-blending design by **zranger1** (Gradient Palette Blending Demo,
PixelBlaze pattern library); simplifications by **Zachary Reiss-Davis**.

## How it works (the key trick)

`setPalette(buffer)` keeps a **reference** to the array you pass, and `paint()`
samples it live each frame. So the technique is:

1. Allocate a `currentPalette` buffer once and `setPalette(currentPalette)` once.
2. Each frame *during a transition*, recompute the contents of `currentPalette`
   as a weighted blend of two source palettes. Because `paint()` reads the buffer
   live, the on-strip color cross-fades automatically — no repeated `setPalette`.
3. A small state machine holds on a palette for `PALETTE_HOLD_TIME` seconds, then
   blends to the next over `PALETTE_TRANSITION_TIME` seconds.

The per-pixel cost stays tiny (just `paint()`); the blend is only rebuilt during
transitions, over a fixed 16-entry palette.

## Drop-in module

Paste this block near the top of a pattern, set `palettes` to the source
palettes you want to cycle (use names from `reference/palettes.md`), then call
the palette-manager block at the **start of `beforeRender`** and use
`paint(h, v)` in your render function. The block already includes the three
required controls — `Auto Cycle` and `Random Palette` toggles plus a `Palette #`
number input — and keeps `autoCycle` and `randomStart` exported for debugging.

```js
// ---- source palettes to cycle through (position, r, g, b quads) ----
var palettes = [ softPurpleBlue, dryToWet, nightAurora, blueCyanYellow ]  // define these arrays above

// ---- transition timing (seconds) ----
var PALETTE_HOLD_TIME = 45        // dwell on each palette
var PALETTE_TRANSITION_TIME = 5   // crossfade duration

// ---- palette-manager state (rarely need to touch) ----
export var currentIndex = floor(random(palettes.length))   // random by default (floor, not round)
export var autoCycle = 1     // exported for debugging; 1 = cycle palettes, 0 = hold
export var randomStart = 1   // exported for debugging; 1 = random palette each run, 0 = honor Palette #
started = 0                  // one-shot startup guard (runs once on the first frame)
export var palette = 0       // REQUIRED: backing var the "Palette #" widget binds to and displays. PixelBlaze seeds a control's shown value from the exported global whose name matches the control (inputNumberPalette -> palette). Missing it, the widget reads uninitialized memory and shows garbage like 8.175035e-41. Init to a clean 0-based index.
var nextIndex = (currentIndex + 1) % palettes.length
var inTransition = 0
var blendValue = 0
runTime = 0

// ---- scratch buffers (allocated ONCE) ----
var pixel1 = array(3)
var pixel2 = array(3)
var PALETTE_SIZE = 16
var currentPalette = array(4 * PALETTE_SIZE)

// ---- init: bind the live buffer once, seed the first blend ----
setPalette(currentPalette)
buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)

// Userspace palette sampler: interpolate palette `pal` at position `v`,
// storing the resulting r,g,b into rgbArray (length 3).
function paint2(v, rgbArray, pal) {
  var rows = pal.length / 4
  var i, k, l, u, pct
  for (i = 0; i < rows; i++) {
    k = pal[i * 4]
    if (k >= v) break
  }
  if ((i == 0) || (i >= rows) || (k == v)) {        // endpoints / exact hit
    i = 4 * min(rows - 1, i)
    rgbArray[0] = pal[i + 1]
    rgbArray[1] = pal[i + 2]
    rgbArray[2] = pal[i + 3]
  } else {                                          // interpolate between two stops
    i = 4 * (i - 1)
    l = pal[i]
    u = pal[i + 4]
    pct = 1 - (u - v) / (u - l)
    rgbArray[0] = mix(pal[i + 1], pal[i + 5], pct)
    rgbArray[1] = mix(pal[i + 2], pal[i + 6], pct)
    rgbArray[2] = mix(pal[i + 3], pal[i + 7], pct)
  }
}

// Rebuild currentPalette as a `blend` (0..1) mix of pal1 and pal2.
function buildBlendedPalette(pal1, pal2, blend) {
  var entry = 0
  var i, v
  for (i = 0; i < PALETTE_SIZE; i++) {
    v = i / (PALETTE_SIZE - 1)
    paint2(v, pixel1, pal1)
    paint2(v, pixel2, pal2)
    currentPalette[entry++] = v
    currentPalette[entry++] = mix(pixel1[0], pixel2[0], blend)
    currentPalette[entry++] = mix(pixel1[1], pixel2[1], blend)
    currentPalette[entry++] = mix(pixel1[2], pixel2[2], blend)
  }
}

// Call this at the START of beforeRender(delta).
function updatePaletteManager(delta) {
  if (!started) {                                    // one-shot: runs AFTER controls restore,
    started = 1                                       // so a random start beats the saved Palette #
    if (randomStart) currentIndex = floor(random(palettes.length))
    nextIndex = (currentIndex + 1) % palettes.length
    buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
  }
  if (autoCycle) {                                   // OFF = hold the current palette
    runTime = (runTime + delta / 1000) % 3600
    if (inTransition) {
      if (runTime >= PALETTE_TRANSITION_TIME) {      // transition complete
        runTime = 0
        inTransition = 0
        blendValue = 0
        currentIndex = (currentIndex + 1) % palettes.length
        nextIndex = (nextIndex + 1) % palettes.length
      } else {
        blendValue = runTime / PALETTE_TRANSITION_TIME
      }
      buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)
    } else if (runTime >= PALETTE_HOLD_TIME) {        // hold finished -> start fade
      runTime = 0
      inTransition = 1
    }
  }
}

// ---- standard controls — ALWAYS include these whenever you use palette blending ----
export function toggleAutoCycle(on) { autoCycle = on }       // OFF = hold the current palette
export function toggleRandomPalette(on) { randomStart = on } // ON = random start each run; OFF = use Palette #

// Jump straight to palette index v (0-based), skipping the crossfade. Turn Auto
// Cycle OFF to keep it there. Defined after buildBlendedPalette so it exists when
// the control is restored on load.
export function inputNumberPalette(v) {
  palette = floor(clamp(v, 0, palettes.length - 1)) // write the bound display var so the widget shows a clean integer, not uninitialized memory
  currentIndex = palette
  nextIndex = (palette + 1) % palettes.length
  inTransition = 0
  blendValue = 0
  runTime = 0
  buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
}
```

Then:

```js
export function beforeRender(delta) {
  updatePaletteManager(delta)
  // ... your per-frame field math ...
}

export function render2D(index, x, y) {
  // compute h (0..1 palette position) and v (0..1 brightness) from your field
  paint(h, v)
}
```

## Optional: continuous blend without a buffer

If you want a smooth (non-quantized) blend and don't mind a bit more per-pixel
cost, skip `setPalette`/`paint` and interpolate directly in render:

```js
// sets the LED to a blend of two palettes at colorPct, mixed by palettePct
function paletteMix(pal1, pal2, colorPct, palettePct) {
  paint2(colorPct, pixel1, pal1)
  paint2(colorPct, pixel2, pal2)
  rgb(mix(pixel1[0], pixel2[0], palettePct),
      mix(pixel1[1], pixel2[1], palettePct),
      mix(pixel1[2], pixel2[2], palettePct))
}
```

## Notes & guardrails

- `palettes` entries must be defined (the actual quad arrays) before the
  `palettes = [...]` line. Pull them from `reference/palettes.md`.
- Keep `PALETTE_SIZE` at 16 unless you have a reason; larger = smoother fade but
  more work per transition frame.
- `currentPalette`, `pixel1`, `pixel2` are allocated once — never inside render.
- **Make the palettes distinct enough to perceive.** Crossfading between two
  near-identical palettes (e.g. several similar warm red→orange→yellow ramps)
  looks like muddy "mixing," not a visible fade — the blended midpoint is just
  the same gradient. Give each palette a different overall character so each hold
  reads as its own look and the transitions are obvious.
- **Always ship the three controls (built into the module above).** Every
  palette-blending pattern must include the `Auto Cycle` and `Random Palette`
  toggles and the `Palette #` number input — a standing requirement, not
  optional. Keep `autoCycle` and `randomStart` **exported** so their state shows
  in the Var Watcher. `Random Palette` defaults ON (start on a random palette each
  run); turn it OFF to start on `Palette #`. `Auto Cycle` OFF + a chosen
  `Palette #` lets you lock and inspect a single palette.
- **Give the `Palette #` control a matching exported backing var (`palette`).**
  PixelBlaze seeds a control's *displayed* value from the exported global whose name
  matches the control (`inputNumberPalette` <-> `palette`). Without that var the widget
  reads an uninitialized slot and shows garbage like `8.175035e-41` on first load.
  Declare `export var palette = 0` and have `inputNumberPalette` write to it. This is
  the same naming rule as every other input control (see `reference/ui-controls.md`).
- **Why the one-shot `started` guard:** PixelBlaze re-applies every control's
  saved value *after* init code runs, so a bare `currentIndex = floor(random(...))`
  at init is overwritten by the restored `Palette #` and never "wins." The
  first-frame guard runs after the restore, so the random start actually takes
  effect. Its cost is one boolean check per frame (never per pixel).
- Respect the house no-blackout rule: floor brightness (`v`) a little so fades
  between dark-heavy palettes (e.g. `nightAurora`) never go fully black.

## Migrating an existing palette-blending pattern

Bring an older pattern up to this canonical form by **adding the scaffolding
below and nothing else**. Do not touch the render functions, field math, palette
arrays, timing constants, or anything unrelated — this is a surgical change.

1. **State vars** — near the existing palette-manager state, add any of these
   that are missing (don't duplicate ones already there). If `currentIndex` was a
   fixed number, change just that initializer to the random form:
   ```js
   export var currentIndex = floor(random(palettes.length))
   export var autoCycle = 1
   export var randomStart = 1
   started = 0
   export var palette = 0   // backing var the "Palette #" widget displays
   ```
2. **One-shot startup** — add this at the very top of `updatePaletteManager` (or,
   if there's no manager, the very top of `beforeRender`):
   ```js
   if (!started) {
     started = 1
     if (randomStart) currentIndex = floor(random(palettes.length))
     nextIndex = (currentIndex + 1) % palettes.length
     buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
   }
   ```
3. **Manager gate** — make sure the manager's cycling/transition body is wrapped
   in `if (autoCycle) { ... }` so OFF holds the current palette.
4. **Controls** — add any that are missing (define `inputNumberPalette` after
   `buildBlendedPalette`):
   ```js
   export function toggleAutoCycle(on) { autoCycle = on }
   export function toggleRandomPalette(on) { randomStart = on }
   export function inputNumberPalette(v) {
     palette = floor(clamp(v, 0, palettes.length - 1)) // bound display var (name matches the control)
     currentIndex = palette
     nextIndex = (currentIndex + 1) % palettes.length
     buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
     // also reset the pattern's own cycle clock if it has one (e.g. runTime = 0)
   }
   ```

Leave the render path, palettes, field math, and timing exactly as they were.
After migrating, sanity-check: `autoCycle` and `randomStart` show as exported
vars, three controls appear in the UI, and the render still calls `paint(...)`.
