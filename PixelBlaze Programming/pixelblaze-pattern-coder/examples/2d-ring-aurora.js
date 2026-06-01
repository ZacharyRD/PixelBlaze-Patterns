/*
 * Ring Aurora — 2D ring map (see reference/mapping.md "2D ring")
 * A calm palette rotates smoothly around a ring with a gentle brightness breath.
 * Matches the house style: palette-based color (no rainbow), slow and soft.
 * Verified against reference/language.md.
 */

// House palette "softPurpleBlue" (pink -> magenta -> blue -> teal). See palettes.md.
var pal = [0.0, 0.969, 0.69, 0.969,   0.188, 1.0, 0.533, 1.0,   0.349, 0.863, 0.114, 0.886,   0.627, 0.027, 0.322, 0.698,   0.847, 0.004, 0.486, 0.427,   1.0, 0.004, 0.486, 0.427]

speed = 0.4

export function sliderSpeed(v) { speed = v }

export function beforeRender(delta) {
  setPalette(pal)
  rot = time(0.1 * (1.01 - speed))            // rotation phase, 0..1
  breath = wave(time(0.25)) * 0.35 + 0.6      // gentle brightness pulse, 0.6..0.95
}

export function render2D(index, x, y) {
  // Angle around the ring's center (ring maps are centered near 0.5, 0.5).
  ang = atan2(y - 0.5, x - 0.5) / PI2 + 0.5   // 0..1 around the circle
  paint(ang + rot, breath)
}

// 1D fallback if no map is installed.
export function render(index) {
  paint(index / pixelCount + rot, breath)
}
