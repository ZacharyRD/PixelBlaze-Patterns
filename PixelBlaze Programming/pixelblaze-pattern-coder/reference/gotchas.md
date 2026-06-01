# PixelBlaze Gotchas & Failure Modes

Read this when code won't compile, the PixelBlaze stutters, or output looks
wrong. These are the specific ways PixelBlaze diverges from JavaScript and from
intuition.

## What actually crashes or stalls the device

- **Allocating inside a frame.** `array(...)`, building a palette literal, or
  growing a buffer inside `render*`/`beforeRender` leaks/fragments memory (arrays
  can't be freed). Allocate once in global scope. This is the #1 cause of a
  PixelBlaze that runs fine then dies after minutes.
- **Looping over all pixels inside `render*`.** `render` is *already* called once
  per pixel — an inner whole-strip loop makes it O(n²) and tanks the frame rate.
  Whole-strip work belongs in `beforeRender`.
- **Manual time accumulation.** `t = t + delta` overflows fast (range ±32768) and
  drifts in fixed point. Use `time(interval)` or scale by `delta`.
- **Per-frame decay/fade is frame-rate dependent.** `x = x * 0.9` every frame
  fades faster on a fast controller and slower on a big/slow strip — the tail
  length or smoothing time silently changes with FPS. Normalize to wall-clock
  with `delta`: `x = x * pow(retainPerSec, delta/1000)`, or target a time
  constant (fade to ~2% over `T` seconds with `pow(0.02, (delta/1000)/T)`). Same
  applies to running averages, AGC peak trackers, and trails.
- **Huge intermediate values.** Fixed-point overflows past ~32768. Keep
  multiplications bounded; normalize to 0..1 early.

## JavaScript habits that don't transfer

- **No closures over locals.** A function (including a lambda passed to
  `arrayMutate`, etc.) cannot see the enclosing function's locals or params — only
  globals and its own params. Pass state via globals.
- **No objects / named properties / classes / `{}` literals.** Use parallel
  arrays or globals.
- **No `let` / `const`.** Use `var` (local in a function) or bare assignment
  (always global).
- **No `switch`/`case`.** Use `else if` chains, or an array of lambdas indexed by
  mode: `modes[currentMode]()`.
- **No `Math.*` in pattern code.** It's `sin`, `cos`, `sqrt`, `pow`, `abs`, not
  `Math.sin`. (`Math.*` exists *only* in the Mapper tab, which is browser JS.)
- **No `.push()/.pop()/.shift()/.splice()/.concat()`.** Arrays are fixed-size;
  assign by index. `.length` is read-only.
- **No `console.log` / `print` / `alert`.** To inspect a value, `export var` it
  and read it in the Var Watcher (`if (index == 42) dbg = something`).

## Functions people expect but that DON'T exist (use the alternative)

- `lerp` → `mix(low, high, weight)`
- `constrain` → `clamp(value, low, hi)`
- Arduino `map(v, inLo, inHi, outLo, outHi)` → write it: `outLo + (v-inLo)*(outHi-outLo)/(inHi-inLo)`
- `millis()` → use `delta` in `beforeRender`, or `time()`
- `noise()` / `simplex()` → `perlin(x, y, z, seed)`
- `sawtooth()` → `time(interval)` is the sawtooth; or build a ramp with `mod(v,1)`
- `random(min, max)` (two-arg) → `random(range)` is single-arg, exclusive of max;
  add your own offset

## Subtle behavior

- **Hue and palette values wrap** at 1.0; negatives wrap backward. You rarely need
  to clamp hue — but DO clamp brightness/value to avoid surprises.
- **`mod` vs `%`:** `mod(x, y)` floors and takes the sign of `y` (use for clean
  wrapping); `%` keeps the dividend's sign. `mod(-3.5, 3) == 2.5` but `-3.5 % 3 == -0.5`.
- **`random()` is true random**, so it differs every boot. For reproducible
  layouts/sparkle seeds use `prngSeed(seed)` + `prng(max)`.
- **`time(interval)` period** ≈ `65.536 * interval` seconds. Smaller interval =
  faster. `time(0.015)` ≈ 1s loop.
- **Perlin that strobes = its coordinate is moving too fast.** `perlin`/
  `perlinFbm` return a new random value at every integer step, so the *rate* you
  change a coordinate sets the animation speed. `time(...) * 256` sweeps ~all 256
  cells per loop (hundreds of cells/second) → pure static/strobe, and makes
  speed/scale sliders look dead because every setting is equally scrambled. Drift
  slowly instead: accumulate a coordinate and wrap at 256 —
  `z = (z + delta/1000 * RATE) % 256` with `RATE` ≈ 0.2–1.0 cells/sec. The `% 256`
  is seamless because perlin tiles at 256.
- **Scrolling a palette shows a hard seam where it wraps.** `paint()` wraps
  position 1.0→0.0, but most palettes aren't cyclic (end color ≠ start color), so
  a linear scroll jumps at every wrap. Sweep with `triangle()` instead (the
  palette goes out-and-back — no jump), or mirror the palette to make it cyclic.
- **Closed-loop patterns (rings, perimeters) need integer spatial frequencies.**
  A strip wired in a loop has LED 0 adjacent to the last LED, so any
  `wave(loopPos * N - phase)` is only seamless around that joint when `N` is an
  integer. Use integer band/color counts, and keep the SAME coefficient-1 `phase`
  on every term (brightness and color) so the scroll wrap is seamless too —
  scaling one term's phase (e.g. `phase * 0.5`) makes it jump each wrap = flicker.
- **Implicit globals are sneaky:** a bare `x = ...` inside a function is global,
  which can cause two render calls to clobber each other. Use `var` for true
  per-call scratch values when it matters.
- **Sensor variables need the board.** `frequencyData`, `energyAverage`, etc. are
  zero/empty without the sensor expansion board; guard or document the dependency.
- **`readAdc()` is V2-only.** On V3 use `analogRead(pin)`.
