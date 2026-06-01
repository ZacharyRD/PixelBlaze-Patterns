/*
 * Breathing Rainbow — 1D strip
 * A smooth rainbow that scrolls along the strip and gently pulses in
 * brightness, like slow breathing. Good starter template for 1D patterns.
 * Verified against reference/language.md.
 */

// --- tunable globals (defaults; sliders re-apply saved values on load) ---
speed = 0.5         // animation speed              (0..1)
hueSpread = 1       // color-wheel turns across strip (set via slider, 0..2)
saturation = 1      // color saturation             (0..1)

export function sliderSpeed(v) { speed = v }
export function sliderHueSpread(v) { hueSpread = v * 2 }   // up to 2 full wraps
export function sliderSaturation(v) { saturation = v }

// --- per-frame math (cheap, runs once per frame) ---
export function beforeRender(delta) {
  scroll = time(0.1 * (1.01 - speed))          // master scroll phase, 0..1
  breath = wave(time(0.15)) * 0.5 + 0.5        // brightness pulse, 0.5..1
}

// --- per-pixel output ---
export function render(index) {
  pct = index / pixelCount                     // position along strip, 0..1
  hue = pct * hueSpread + scroll               // shifting rainbow (hue wraps)
  hsv(hue, saturation, breath)
}
