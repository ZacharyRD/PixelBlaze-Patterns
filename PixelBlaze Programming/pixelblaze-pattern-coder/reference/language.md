# PixelBlaze V3 Language Reference (verified)

Source of truth for what exists. Transcribed from the official ElectroMage /
`simap/pixelblaze` (master) reference for PixelBlaze V3 with current firmware.
**If a function is not on this page, do not use it.**

## The model in one paragraph

PixelBlaze runs a restricted ES6-like language. Every number is **16.16
fixed-point**: range about **-32768 to +32768**, precision down to **1/65536**.
Pixels are rendered one at a time. You export a few functions and PixelBlaze
calls them. `pixelCount` is a global set from settings, available everywhere
including init.

## Entry-point functions (must be `export`ed)

- `beforeRender(delta)` — called once per frame before pixels are drawn. `delta`
  is elapsed milliseconds since the last call. Do per-frame and whole-strip math
  here.
- `render(index)` — called once per pixel for a 1D strip. Set the pixel color
  with `hsv`, `hsv24`, `rgb`, or `paint`.
- `render2D(index, x, y)` — used when a 2D map is installed. `x`,`y` are "world
  units" in 0.0–1.0.
- `render3D(index, x, y, z)` — used when a 3D map is installed. `x`,`y`,`z` in
  0.0–1.0.

You may define multiple render variants in one pattern; PixelBlaze selects the
one matching the installed map.

## Variables & scope

- `=` creates a variable. **Implicitly assigned variables are always global**,
  even if first written inside a function.
- `var x` inside a function creates a **local**; locals can shadow globals.
- `export var x` makes a global visible in the Var Watcher and the websocket API.
- No `let`, no `const`.

## Constants

`E`, `PI`, `PI2` (=2π), `PI3_4` (=3π/4), `PISQ` (=π²), `LN2`, `LN10`, `LOG2E`,
`LOG10E`, `SQRT1_2`, `SQRT2`.

## Operators

`= + - ! * / % >> << | & ~ ^ > < >= <= == != || &&` and ternary `?:`.
Logical operators carry the value, not just a boolean: `v = 0 || 42` → `42`.
Bitwise ops act on all 32 bits (16 integer + 16 fractional) except `~`, which
zeros the lower 16 bits.

## Math functions

`abs(v)`, `acos(x)`, `asin(x)`, `atan(x)`, `atan2(y,x)`, `ceil(v)`,
`clamp(value, low, hi)`, `cos(rad)`, `exp(x)`, `floor(v)`, `frac(v)`,
`hypot(x,y)`, `hypot3(x,y,z)`, `log(v)`, `log2(v)`, `max(a,b)`, `min(a,b)`,
`mod(x,y)` (floored remainder, sign of `y`; `mod(v,1)` is the "wrap" used by the
waveform functions), `pow(base,exp)`, `prng(max)` + `prngSeed(seed)` (seedable
pseudo-random), `random(max)` (true random, exclusive of `max`), `round(v)`,
`sin(rad)`, `sqrt(v)`, `tan(rad)`, `trunc(v)`.

No `lerp` (use `mix`), no `constrain` (use `clamp`), no `map()` range-remap
(write your own), no `noise()` (use `perlin`).

## Waveform & interpolation functions

- `time(interval)` — sawtooth 0..1 looping every ~`65.536*interval` seconds.
  Use `.015` for ~1s. This is your master clock; sync-able across devices.
- `wave(v)` — sine eased 0..1 from a 0..1 sawtooth (`v` wraps).
- `triangle(v)` — triangle 0..1 (`v` wraps).
- `square(v, duty)` — square wave, `duty` 0..1 (`v` wraps).
- `mix(low, high, weight)` — linear interpolation, `weight` 0..1.
- `smoothstep(low, high, v)` — smooth Hermite ease 0..1 as `v` crosses
  low→high (clamped). Great for soft edges and easing.
- `bezierQuadratic(t, p0, p1, p2)`, `bezierCubic(t, p0, p1, p2, p3)`.

## Perlin noise (organic texture)

- `perlin(x, y, z, seed)` — 3D Perlin noise; smooth, repeats every 256.
- `perlinFbm(x, y, z, lacunarity, gain, octaves)` — fractal noise.
- `perlinRidge(x, y, z, lacunarity, gain, offset, octaves)` — ridged.
- `perlinTurbulence(x, y, z, lacunarity, gain, octaves)` — turbulent.
- `setPerlinWrap(x, y, z)` — wrap interval 2..256 for seamless tiling.
Tip: `gain` ~0.5–0.8, `lacunarity` = 2 for clean wrapping. **Animate by drifting a
coordinate SLOWLY** (~0.2–1 cell/sec): `z = (z + delta/1000 * rate) % 256`. Never
feed `time()*256` into perlin — it sweeps hundreds of cells/sec and strobes (see
`gotchas.md`).

## Color / pixel functions (call inside `render*` to set the pixel)

- `hsv(hue, saturation, value)` — HDR HSV. Hue wraps; negatives wrap backward.
  Preferred for smooth low-light gradients.
- `hsv24(hue, saturation, value)` — 24-bit only; can reduce flicker on some LEDs.
- `rgb(red, green, blue)` — all 0..1.
- `setPalette(array)` — define a gradient palette from an array of
  `position, r, g, b` quads (see `reference/artistry.md`). Set it once (global
  init or `beforeRender`), not per pixel.
- `paint(value, [brightness=1])` — set the current pixel from the active palette
  at `value` (0..1, wraps); optional brightness 0..1. The fastest route to
  harmonious color.

## Arrays

- `array(n)` — create an array of `n` elements. Array literals `[...]` are also
  supported (current firmware) and are how you write palettes.
- Read-only `.length`; bracket access `a[i]`.
- Methods (also callable as functions): `arrayForEach/forEach`,
  `arrayMapTo/mapTo`, `arrayMutate/mutate`, `arrayReduce/reduce`,
  `arrayReplace/replace`, `arrayReplaceAt`, `arraySort/sort`,
  `arraySortBy/sortBy`, `arraySum/sum`, `arrayLength/length`.
- **No `push`/`pop`/`shift`/`splice`/`concat`** — arrays are fixed-size. Write
  by index. **Allocate once, never inside a render frame.**
- Callbacks passed to array methods cannot close over the caller's locals (no
  closures); they see globals and their own params only.

## Coordinate transforms (affect the next render; call in `beforeRender` or body)

`resetTransform()`, `translate(x,y)`, `scale(x,y)`, `rotate(rad)`,
`translate3D(x,y,z)`, `scale3D(x,y,z)`, `rotateX/Y/Z(rad)`,
`transform(... 16 matrix values ...)`. Up to 31 transforms. `scale(2,2)` makes
features appear half as large (denser coordinates).

## Pixel map introspection

`pixelMapDimensions()` (0/2/3), `has2DMap()`, `has3DMap()`,
`mapPixels(fn)` where `fn(index, x, y, z)` walks transformed map coordinates.

## Input / output (V3)

`analogRead(pin)` (0..1), `pinMode(pin, mode)` with `INPUT`, `INPUT_PULLUP`,
`INPUT_PULLDOWN`, `OUTPUT`, `OUTPUT_OPEN_DRAIN`, `ANALOG`;
`digitalWrite(pin, state)`, `digitalRead(pin)`, `touchRead(pin)` (also accepts
`T0, T2, T4, T6, T7`). Note: `readAdc()` is V2-only — do not use on V3.

## Clock (needs internet + discovery enabled)

`clockYear()`, `clockMonth()`, `clockDay()`, `clockHour()` (24h),
`clockMinute()`, `clockSecond()`, `clockWeekday()` (Sun=1).

## Sound / sensor expansion board

Declare with `export var` (each defaults gracefully if no board is attached, but
patterns that index these **require the board** to do anything):

- `frequencyData` — 32-element FFT magnitudes (12.5Hz–10kHz).
- `energyAverage` — overall volume.
- `maxFrequency`, `maxFrequencyMagnitude` — strongest tone (~39Hz resolution).
- `accelerometer` — `[x, y, z]`, 16G.
- `light` — ambient light (good for auto-dimming).
- `analogInputs` — `[A0..A4]`.

## Sequencer / sync

`nodeId()`; `sequencerNext()`, `sequencerGetMode()` (`SEQ_OFF`=0,
`SEQ_SHUFFLE_ALL`=1, `SEQ_PLAYLIST`=2, `SEQ_SYNCHRONIZED`=3);
`playlistGetPosition()`, `playlistSetPosition(pos)`, `playlistGetLength()`.
