/*
 * Palette Comet — 1D strip
 * A bright head races along the strip leaving a fading tail, colored from an
 * "ice" palette. Demonstrates the correct way to keep a persistent per-pixel
 * buffer (allocate ONCE, never inside a frame) and the setPalette/paint system.
 * Verified against reference/language.md.
 */

// Palette: deep blue -> cyan -> white (position, r, g, b quads). Declared once.
var icePalette = [
  0,   0,   0,   0.2,
  0.5, 0,   0.6, 1,
  0.9, 0.6, 1,   1,
  1,   1,   1,   1
]

// Persistent brightness buffer — allocated a single time in global scope.
var pixels = array(pixelCount)

speed = 0.4         // head speed                 (0..1)
tailLife = 0.6      // tail length in seconds      (set via slider)

export function sliderSpeed(v) { speed = v }
export function sliderTailFade(v) { tailLife = 0.15 + v * 2 }   // ~0.15..2.15 s

export function beforeRender(delta) {
  setPalette(icePalette)

  // Frame-rate-INDEPENDENT fade: each pixel decays to ~2% over `tailLife`
  // seconds regardless of frame rate. A bare per-frame `* k` would make the
  // tail length depend on FPS (and on how many pixels you drive).
  fadeFactor = pow(0.02, (delta / 1000) / tailLife)
  for (i = 0; i < pixelCount; i++) {
    pixels[i] = pixels[i] * fadeFactor
  }

  // Light a bright head that sweeps along the strip.
  head = floor(time(0.1 * (1.01 - speed)) * pixelCount) % pixelCount
  pixels[head] = 1
}

export function render(index) {
  v = pixels[index]
  paint(v, v)        // palette color by brightness, scaled by brightness
}
