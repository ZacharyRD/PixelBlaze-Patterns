# Making Patterns Beautiful (not just functional)

Functional correctness is the floor. The goal is light that feels alive,
balanced, and intentional. Apply this every time — beauty is a requirement.

## Color

- **Lead with the palette system.** `setPalette(grad)` once, then `paint(v)` per
  pixel. Palettes give you hand-tuned, harmonious color for free and read better
  than raw rainbow `hsv(hue,1,1)`.
- **Avoid the "full neon" trap.** `hsv(h, 1, 1)` everywhere looks flat and harsh.
  Modulate **value** (and sometimes saturation) across space and time to create
  depth and glow. Darkness is part of the composition — dark gaps make highlights
  pop.
- **Choose relationships deliberately:** analogous hues (neighbors on the wheel)
  feel calm and cohesive; complementary or triadic pairs feel energetic. Narrow
  hue range = elegant; wide = playful.
- **Warm vs. cool** sets emotional temperature. Fire/sunset = warm and active;
  ocean/frost/aurora = cool and serene.
- **Transitions should be smooth.** Use `mix` and `smoothstep` for eases; avoid
  abrupt high-frequency hue jumps unless you specifically want strobe/glitch.

### Ready-made palettes (palette arrays = `position, r, g, b` quads)
Declare once in global scope, `setPalette(...)` in init or `beforeRender`.
```js
var firePalette    = [0,0,0,0, 0.3,0.5,0,0, 0.6,1,0.4,0, 0.9,1,1,0.3, 1,1,1,1]
var oceanPalette   = [0,0,0,0.1, 0.4,0,0.3,0.6, 0.7,0,0.7,0.9, 1,0.6,1,1]
var auroraPalette  = [0,0,0,0.05, 0.35,0,0.7,0.4, 0.6,0.1,1,0.6, 0.85,0.6,0.3,1, 1,1,1,1]
var sunsetPalette  = [0,0.05,0,0.15, 0.4,0.8,0.1,0.3, 0.7,1,0.5,0.1, 1,1,0.9,0.4]
var frostPalette   = [0,0,0,0.2, 0.5,0,0.6,1, 0.9,0.6,1,1, 1,1,1,1]
var neonPalette    = [0,1,0,0.6, 0.33,0,1,0.8, 0.66,1,0.9,0, 1,1,0,0.6]
```
Tune by ear: shift positions to spend more "space" in the colors you love.

## Motion & rhythm

- **Layer two timescales:** a slow global drift (`time` with a large interval)
  plus faster local detail. Single-speed motion reads as mechanical.
- **Ease, don't ramp.** Prefer `wave`/`triangle`/`smoothstep` over raw linear
  `time()` for anything meant to feel organic or breathing.
- **Breathe.** A gentle `wave(time(...))` on overall brightness gives life even to
  simple gradients.
- **Match scale to the layout.** A 5m strip wants slower, larger motion than a
  small ring. In 2D/3D, tie speed/scale to world units, not pixel counts.
- **Use `perlin` for organic texture** (smoke, water, clouds, fire). Drift the `z`
  axis with `time()` to animate a still noise field.
- **Reserve randomness.** `random()` jitter is great for sparkle/texture, bad as a
  base motion — uncorrelated noise everywhere looks like static.

## Composition checklist

- Is there contrast (bright vs. dark), or is everything one mid-level wash?
- Is there a focal rhythm, or is it uniform?
- Does motion speed suit the physical size?
- Would a viewer in a normal room find it pleasant for minutes, not just seconds?

## Controls for taste

Expose 2–4 high-level knobs so the look can be tuned without editing code —
typically **speed, brightness, palette/hue shift, density**. See
`reference/ui-controls.md`.

---

## HOUSE STYLE — edit me

Zack's aesthetic defaults. Honor these unless the user asks otherwise.

- **Default palettes / signature colors:** always use the curated set in
  `reference/palettes.md` — never a full `hsv()` rainbow (see avoid list). Given
  the calm/organic default mood, lean on `softPurpleBlue`, `dryToWet`,
  `blueCyanYellow`, and `infernoEmber`/`lavaFire` for fire. **Top pick when
  unsure: `nightAurora`.** Use `setPalette`/`paint`, not raw hue ramps.
- **Signature effect — palette crossfading:** Zack loves patterns that slowly
  cross-fade between several palettes. For ambient/long-running pieces, default
  to cycling 3–4 house palettes using the module in
  `reference/palette-blending.md` rather than locking to one palette (unless the
  user asks for a fixed palette).
- **Default mood:** calm & ambient + organic/natural. Favor slow, flowing,
  noise-based looks (`perlin`/`perlinFbm` drifting over time), smooth eased
  motion (`wave`, `smoothstep`), and a gentle brightness breath. Default to
  understated and atmospheric rather than punchy — unless asked otherwise.
- **Default speed / brightness:** medium / balanced. Start speed and brightness
  sliders around **0.5**.
- **Things to avoid (HARD RULES):**
  - No strobing or fast flicker — keep transitions smooth (also photosensitivity-safe).
  - No harsh full-neon — never park everything at full saturation + full value;
    modulate value/saturation for depth.
  - No large pure-white blasts — keep color in the mix.
  - Never let the whole scene go dark at once — always keep some light visible.
    (Palettes that include black, like `nightAurora`, are fine — that's spatial
    contrast, not a full blackout.)
  - No full-rainbow / whole-hue-wheel patterns — use curated palettes instead.
- **Go-to layouts:** Zack runs all of these — 1D strips, 2D matrices/panels, LED
  rings, and 3D props (cube/sphere/helix). Write the matching `render*` and
  generate the pixel map (see `reference/mapping.md`). For matrices, always
  confirm zigzag vs. row-by-row wiring.
