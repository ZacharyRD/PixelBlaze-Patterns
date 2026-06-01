# House-Style Palettes (Zack's preferred set)

Zack's curated palettes — use these as the **default color options** for any
pattern unless the user asks for something specific. They pair with the built-in
`setPalette()` / `paint()` system (see `reference/language.md`).

How to use: declare the chosen palette **once** in global scope, call
`setPalette(thePalette)` in init or `beforeRender`, then `paint(value)` per pixel.
Never declare a palette inside a render frame.

```js
var pal = lavaFire          // pick one below
export function beforeRender(delta) { setPalette(pal) }
export function render(index) { paint(time(0.1) + index/pixelCount) }
```

Palette arrays are `position, r, g, b` quads, all 0..1. Two palettes
(`infernoEmber`, `goldToNavy`) self-normalize from 0–255 source values at load —
that arithmetic runs once at init and is safe.

Provenance: most palettes are from cpt-city
(http://soliton.vm.bytemark.co.uk/pub/cpt-city/), several surfaced via Mark
Kriegsman's ColorWavesWithPalettes
(https://gist.github.com/kriegsman/8281905786e8b2632aeb). Original names kept in
comments so they're traceable. "Battery saver" = lots of dark, lower power draw.

---

## Warm / fire

```js
// lavaFire — black → red → orange → yellow → white. Classic, convincing fire.
// Feel: excellent fire look; battery saver (heavy black, so dim overall).
// cpt-city: lava — http://soliton.vm.bytemark.co.uk/pub/cpt-city/neota/elem/tn/lava.png.index.html
var lavaFire = [0.0, 0.0, 0.0, 0.0,   0.18, 0.071, 0.0, 0.0,    0.376, 0.443, 0.0, 0.0,   0.424, 0.557, 0.012, 0.004,   0.467, 0.686, 0.067, 0.004,   0.573, 0.835, 0.173, 0.008,   0.682, 1.0, 0.322, 0.016,   0.737, 1.0, 0.451, 0.016,   0.792, 1.0, 0.612, 0.016,   0.855, 1.0, 0.796, 0.016,   0.918, 1.0, 1.0, 0.016,   0.957, 1.0, 1.0, 0.278,   1.0, 1.0, 1.0, 1.0]

// magentaFire — black → magenta → red → yellow. Hotter, more electric than lava.
// Feel: battery saver (starts black). Better than plain black-magenta-red.
// cpt-city: BlacK_Red_Magenta_Yellow — http://soliton.vm.bytemark.co.uk/pub/cpt-city/nd/basic/tn/BlacK_Red_Magenta_Yellow.png.index.html
var magentaFire = [0.0, 0.0, 0.0, 0.0,   0.165, 0.165, 0.0, 0.0,   0.329, 1.0, 0.0, 0.0,   0.498, 1.0, 0.0, 0.176,   0.667, 1.0, 0.0, 1.0,   0.831, 1.0, 0.216, 0.176,   1.0, 1.0, 1.0, 0.0]

// infernoEmber — black → deep purple → magenta → orange → pale yellow. Smooth, rich.
// Feel: balanced warm gradient with a cool dark base. (matplotlib "Inferno".)
// No cpt-city URL (matplotlib colormap).
var infernoEmber = [ 0.0, 0/255, 0/255, 4/255, 0.1, 22/255, 11/255, 57/255, 0.2, 66/255, 10/255, 104/255, 0.3, 106/255, 23/255, 110/255, 0.4, 147/255, 38/255, 103/255, 0.5, 188/255, 55/255, 84/255, 0.6, 221/255, 81/255, 58/255, 0.7, 243/255, 120/255, 25/255, 0.8, 252/255, 165/255, 10/255, 0.9, 246/255, 215/255, 70/255, 1.0, 252/255, 255/255, 164/255 ]

// goldToNavy — gold/yellow → orange → purple → navy. Warm-to-cool sweep.
// Feel: rich sunset-into-night; source values are 0–255 and normalized at load.
// cpt-city: bhw1_04 — http://soliton.vm.bytemark.co.uk/pub/cpt-city/bhw/bhw1/tn/bhw1_04.png.index.html
var goldToNavy = [0, 229,227,1,   15, 227,101,3,   142, 40,1,80,   198, 17,1,79,   255, 0,0,45]
arrayMutate(goldToNavy, (v, i, a) => v / 255)
```

## Sunset / mixed warm

```js
// sunsetReal — red → orange → yellow → purple → blue. No black; bright throughout.
// Feel: full warm-to-cool sunset; lush and saturated.
// cpt-city: Sunset_Real — http://soliton.vm.bytemark.co.uk/pub/cpt-city/nd/atmospheric/tn/Sunset_Real.png.index.html
var sunsetReal = [0.0, 0.471, 0.0, 0.0,    0.086, 0.702, 0.086, 0.0,   0.2, 1.0, 0.408, 0.0,   0.333, 0.655, 0.086, 0.071,   0.529, 0.392, 0.0, 0.404,   0.776, 0.063, 0.0, 0.51,    1.0, 0.0, 0.0, 0.627]

// bluePurpleRed — blue → purple → red. Warm-cool analogous tension.
// Feel: moody, simple, reads well in motion.
// cpt-city: Analogous_1 — http://soliton.vm.bytemark.co.uk/pub/cpt-city/nd/red/tn/Analogous_1.png.index.html
var bluePurpleRed = [0.0, 0.012, 0.0, 1.0,    0.247, 0.09, 0.0, 1.0,    0.498, 0.263, 0.0, 1.0,   0.749, 0.557, 0.0, 0.176,   1.0, 1.0, 0.0, 0.0]
```

## Cool / calm

```js
// dryToWet — yellow → greens → blues. Almost no red; natural, earthy-to-aquatic.
// Feel: calm, organic; pairs beautifully with perlin noise.
// cpt-city: GMT_drywet — http://soliton.vm.bytemark.co.uk/pub/cpt-city/gmt/tn/GMT_drywet.png.index.html
var dryToWet = [0.0, 0.184, 0.118, 0.008,   0.165, 0.835, 0.576, 0.094,   0.329, 0.404, 0.859, 0.204,   0.498, 0.012, 0.859, 0.812,   0.667, 0.004, 0.188, 0.839,   0.831, 0.004, 0.004, 0.435,   1.0, 0.004, 0.027, 0.129]

// blueCyanYellow — blue → cyan → yellow, slightly blue-biased. Crisp and clean.
// Feel: fresh, high-clarity; good for water/sky and data-style looks.
// cpt-city: Blue_Cyan_Yellow — http://soliton.vm.bytemark.co.uk/pub/cpt-city/nd/basic/tn/Blue_Cyan_Yellow.png.index.html
var blueCyanYellow = [0.0, 0.0, 0.0, 1.0,   0.247, 0.0, 0.216, 1.0,   0.498, 0.0, 1.0, 1.0,   0.749, 0.165, 1.0, 0.176,   1.0, 1.0, 1.0, 0.0]

// softPurpleBlue — pink → magenta → blue → teal. Gentle, well-blended.
// Feel: mild but lovely; soft transitions, easy on the eyes.
// cpt-city: gr65_hult — http://soliton.vm.bytemark.co.uk/pub/cpt-city/hult/tn/gr65_hult.png.index.html
var softPurpleBlue = [0.0, 0.969, 0.69, 0.969,   0.188, 1.0, 0.533, 1.0,   0.349, 0.863, 0.114, 0.886,   0.627, 0.027, 0.322, 0.698,   0.847, 0.004, 0.486, 0.427,   1.0, 0.004, 0.486, 0.427]
```

## Vibrant / playful

```js
// rainbowSherbet — orange → pink → green → white. Should be garish but isn't.
// Feel: bright and joyful; a standout pick for fun, energetic pieces.
// cpt-city: rainbowsherbet — http://soliton.vm.bytemark.co.uk/pub/cpt-city/ma/icecream/tn/rainbowsherbet.png.index.html
var rainbowSherbet = [0.0, 1.0, 0.129, 0.016,   0.169, 1.0, 0.267, 0.098,   0.337, 1.0, 0.027, 0.098,   0.498, 1.0, 0.322, 0.404,   0.667, 1.0, 1.0, 0.949,   0.82, 0.165, 1.0, 0.086,    1.0, 0.341, 1.0, 0.255]

// nightAurora — black → blue → magenta → pink → white. TOP PICK.
// Feel: smooth, high-contrast, dramatic; battery saver (lots of dark).
// cpt-city: BlacK_Blue_Magenta_White — http://soliton.vm.bytemark.co.uk/pub/cpt-city/nd/basic/tn/BlacK_Blue_Magenta_White.png.index.html
var nightAurora = [0.0, 0.0, 0.0, 0.0,   0.165, 0.0, 0.0, 0.176,   0.329, 0.0, 0.0, 1.0,   0.498, 0.165, 0.0, 1.0,   0.667, 1.0, 0.0, 1.0,   0.831, 1.0, 0.216, 1.0,   1.0, 1.0, 1.0, 1.0]
```

---

## Defaults for the house style

When no palette is specified, default to one of these by mood:

- Calm / ambient → `softPurpleBlue`, `dryToWet`, or `blueCyanYellow`
- Energetic / fun → `rainbowSherbet` or `nightAurora`
- Fire / warm → `lavaFire`, `magentaFire`, or `infernoEmber`
- Sunset / rich → `sunsetReal` or `goldToNavy`
- Low power / high contrast → `nightAurora`, `magentaFire`, `lavaFire` (battery savers)

Overall top pick when truly unsure: **`nightAurora`**.
