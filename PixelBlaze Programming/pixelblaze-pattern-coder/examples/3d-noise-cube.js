/*
 * Noise Cube — 3D map (see reference/mapping.md "3D cube")
 * Slow volumetric clouds drifting through a cube/sphere of LEDs, colored from a
 * calm house palette. Organic and atmospheric — the default house mood.
 * Verified against reference/language.md.
 */

// House palette "nightAurora" (black -> blue -> magenta -> pink -> white). See palettes.md.
var pal = [0.0, 0.0, 0.0, 0.0,   0.165, 0.0, 0.0, 0.176,   0.329, 0.0, 0.0, 1.0,   0.498, 0.165, 0.0, 1.0,   0.667, 1.0, 0.0, 1.0,   0.831, 1.0, 0.216, 1.0,   1.0, 1.0, 1.0, 1.0]

scale = 2          // spatial frequency of the clouds (set via slider)
speed = 0.3
maxBright = 0.7    // brightness ceiling — also keeps power draw in check
t = 0              // noise drift coordinate (accumulated; perlin wraps at 256)

export function sliderScale(v) { scale = 0.5 + v * 4 }
export function sliderSpeed(v) { speed = v }
export function sliderBrightness(v) { maxBright = v }

export function beforeRender(delta) {
  setPalette(pal)
  // Drift the noise coordinate SLOWLY (fraction of a cell/sec); perlin wraps at 256.
  t = (t + delta / 1000 * (0.2 + speed * 1.2)) % 256
}

export function render3D(index, x, y, z) {
  // Fractal Perlin noise for richer, more organic texture than plain perlin.
  n = perlinFbm(x * scale, y * scale, z * scale + t, 2, 0.5, 3)
  v = n * 0.5 + 0.5                        // map to ~0..1
  paint(v, maxBright)
}

// 2D and 1D fallbacks so it still looks good without a 3D map.
export function render2D(index, x, y) {
  n = perlinFbm(x * scale, y * scale, t, 2, 0.5, 3)
  paint(n * 0.5 + 0.5, maxBright)
}
export function render(index) {
  n = perlin(index / pixelCount * scale, 0, t, 0)
  paint(n * 0.5 + 0.5, maxBright)
}
