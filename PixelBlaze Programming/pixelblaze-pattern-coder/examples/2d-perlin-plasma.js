/*
 * Perlin Plasma — 2D matrix (needs a 2D pixel map; see reference/mapping.md)
 * Slow, organic clouds of fire-colored light drifting across the panel.
 * Demonstrates render2D, built-in Perlin noise, and a palette.
 * Verified against reference/language.md.
 */

var firePalette = [
  0,   0,   0,   0,
  0.3, 0.5, 0,   0,
  0.6, 1,   0.4, 0,
  0.9, 1,   1,   0.3,
  1,   1,   1,   1
]

scale = 2.5         // spatial frequency of the clouds (set via slider)
speed = 0.3         // drift speed                     (0..1)
z = 0               // noise drift coordinate (accumulated; perlin wraps at 256)

export function sliderScale(v) { scale = 0.5 + v * 5 }
export function sliderSpeed(v) { speed = v }

export function beforeRender(delta) {
  setPalette(firePalette)
  // Drift the noise coordinate SLOWLY (fraction of a cell/sec); perlin wraps at 256.
  z = (z + delta / 1000 * (0.2 + speed * 1.2)) % 256
}

export function render2D(index, x, y) {
  n = perlin(x * scale, y * scale, z, 0)  // smooth noise, roughly -1..1
  v = n * 0.5 + 0.5                        // map to 0..1
  paint(v)
}

// Optional 1D fallback so the pattern still looks decent with no map installed.
export function render(index) {
  n = perlin(index / pixelCount * scale, 0, z, 0)
  paint(n * 0.5 + 0.5)
}
