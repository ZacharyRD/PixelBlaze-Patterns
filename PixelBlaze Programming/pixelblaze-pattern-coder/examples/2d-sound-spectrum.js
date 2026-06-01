/*
 * Sound Spectrum w/ Auto-Gain — 2D matrix (REQUIRES sensor expansion board + 2D map)
 * Frequency bars that adapt to volume: a decaying peak tracker (AGC) keeps the
 * display well-scaled whether the room is quiet or loud, instead of a guessed
 * fixed multiplier. x selects a frequency bin; bar height tracks its magnitude.
 * Verified against reference/language.md.
 */

export var frequencyData    // 32-element FFT magnitudes from the sensor board
export var energyAverage     // overall volume (handy in the Var Watcher)

var spectrumPalette = [
  0,   0,   0,   0.2,
  0.4, 0,   0.7, 1,
  0.7, 0.2, 1,   0.4,
  1,   1,   0.9, 0
]

var peak = 0.0001          // running peak magnitude for auto-gain (avoids /0)
decayPerSec = 0.4          // peak falls toward this fraction per SECOND when quiet
sensitivity = 0.5          // user trim on top of the AGC

export function sliderSensitivity(v) { sensitivity = 0.25 + v * 3 }

export function beforeRender(delta) {
  setPalette(spectrumPalette)

  // Find the loudest bin this frame (32 bins — small fixed loop, fine here).
  frameMax = 0
  for (i = 0; i < 32; i++) {
    if (frequencyData[i] > frameMax) frameMax = frequencyData[i]
  }
  // Decaying peak: loud transients raise it instantly, quiet passages let it
  // fall so the display re-gains up. Decay is delta-normalized so the AGC
  // response is the same regardless of frame rate.
  peak = max(peak * pow(decayPerSec, delta / 1000), frameMax)
  peak = max(peak, 0.0001)
  gain = sensitivity / peak
}

export function render2D(index, x, y) {
  bin = floor(x * 31)                      // map x (0..1) to bins 0..31
  mag = clamp(frequencyData[bin] * gain, 0, 1)
  // Light this pixel only if the bar reaches this row (y=0 top, y=1 bottom).
  if ((1 - y) <= mag) {
    paint(1 - y, 1)                        // taller = hotter palette color
  } else {
    rgb(0, 0, 0)
  }
}

export function gaugeEnergy() { return clamp(energyAverage * gain, 0, 1) }
