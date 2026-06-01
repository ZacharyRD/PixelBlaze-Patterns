/*
 * Palette Crossfade Field — 2D (works on any 2D map; 1D fallback included)
 * A calm drifting field that slowly cross-fades between house palettes using
 * zranger1's gradient-palette-blending technique (Zack's signature effect).
 * See reference/palette-blending.md for the standalone module + explanation.
 * Verified against reference/language.md.
 */

// ---- house palettes to cycle (from reference/palettes.md) ----
var softPurpleBlue = [0.0, 0.969, 0.69, 0.969,   0.188, 1.0, 0.533, 1.0,   0.349, 0.863, 0.114, 0.886,   0.627, 0.027, 0.322, 0.698,   0.847, 0.004, 0.486, 0.427,   1.0, 0.004, 0.486, 0.427]
var dryToWet       = [0.0, 0.184, 0.118, 0.008,   0.165, 0.835, 0.576, 0.094,   0.329, 0.404, 0.859, 0.204,   0.498, 0.012, 0.859, 0.812,   0.667, 0.004, 0.188, 0.839,   0.831, 0.004, 0.004, 0.435,   1.0, 0.004, 0.027, 0.129]
var blueCyanYellow = [0.0, 0.0, 0.0, 1.0,   0.247, 0.0, 0.216, 1.0,   0.498, 0.0, 1.0, 1.0,   0.749, 0.165, 1.0, 0.176,   1.0, 1.0, 1.0, 0.0]
var nightAurora    = [0.0, 0.0, 0.0, 0.0,   0.165, 0.0, 0.0, 0.176,   0.329, 0.0, 0.0, 1.0,   0.498, 0.165, 0.0, 1.0,   0.667, 1.0, 0.0, 1.0,   0.831, 1.0, 0.216, 1.0,   1.0, 1.0, 1.0, 1.0]

var palettes = [ softPurpleBlue, dryToWet, blueCyanYellow, nightAurora ]

// ---- transition timing (seconds) ----
var PALETTE_HOLD_TIME = 45
var PALETTE_TRANSITION_TIME = 5

// ---- palette-manager state ----
export var currentIndex = floor(random(palettes.length))
export var autoCycle = 1     // exported for debugging; 1 = auto-cycle, 0 = hold
export var randomStart = 1   // exported for debugging; 1 = random palette each run, 0 = honor Palette #
started = 0                  // one-shot startup guard
export var palette = 0       // backing var the "Palette #" widget binds to/displays (prevents uninitialized garbage like 8.175035e-41)
var nextIndex = (currentIndex + 1) % palettes.length
var inTransition = 0
var blendValue = 0
runTime = 0

// ---- scratch buffers (allocated once) ----
var pixel1 = array(3)
var pixel2 = array(3)
var PALETTE_SIZE = 16
var currentPalette = array(4 * PALETTE_SIZE)

setPalette(currentPalette)
buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)

speed = 0.4
export function sliderSpeed(v) { speed = v }
export function toggleAutoCycle(on) { autoCycle = on }       // OFF = hold current palette
export function toggleRandomPalette(on) { randomStart = on } // ON = random start each run; OFF = use Palette #

function paint2(v, rgbArray, pal) {
  var rows = pal.length / 4
  var i, k, l, u, pct
  for (i = 0; i < rows; i++) {
    k = pal[i * 4]
    if (k >= v) break
  }
  if ((i == 0) || (i >= rows) || (k == v)) {
    i = 4 * min(rows - 1, i)
    rgbArray[0] = pal[i + 1]
    rgbArray[1] = pal[i + 2]
    rgbArray[2] = pal[i + 3]
  } else {
    i = 4 * (i - 1)
    l = pal[i]
    u = pal[i + 4]
    pct = 1 - (u - v) / (u - l)
    rgbArray[0] = mix(pal[i + 1], pal[i + 5], pct)
    rgbArray[1] = mix(pal[i + 2], pal[i + 6], pct)
    rgbArray[2] = mix(pal[i + 3], pal[i + 7], pct)
  }
}

function buildBlendedPalette(pal1, pal2, blend) {
  var entry = 0
  var i, v
  for (i = 0; i < PALETTE_SIZE; i++) {
    v = i / (PALETTE_SIZE - 1)
    paint2(v, pixel1, pal1)
    paint2(v, pixel2, pal2)
    currentPalette[entry++] = v
    currentPalette[entry++] = mix(pixel1[0], pixel2[0], blend)
    currentPalette[entry++] = mix(pixel1[1], pixel2[1], blend)
    currentPalette[entry++] = mix(pixel1[2], pixel2[2], blend)
  }
}

function updatePaletteManager(delta) {
  if (!started) {                           // one-shot: random start beats the restored Palette #
    started = 1
    if (randomStart) currentIndex = floor(random(palettes.length))
    nextIndex = (currentIndex + 1) % palettes.length
    buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
  }
  if (autoCycle) {                          // OFF = hold the current palette
    runTime = (runTime + delta / 1000) % 3600
    if (inTransition) {
      if (runTime >= PALETTE_TRANSITION_TIME) {
        runTime = 0
        inTransition = 0
        blendValue = 0
        currentIndex = (currentIndex + 1) % palettes.length
        nextIndex = (nextIndex + 1) % palettes.length
      } else {
        blendValue = runTime / PALETTE_TRANSITION_TIME
      }
      buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)
    } else if (runTime >= PALETTE_HOLD_TIME) {
      runTime = 0
      inTransition = 1
    }
  }
}

// Jump straight to a palette index (0-based); turn Auto Cycle OFF to keep it there.
export function inputNumberPalette(v) {
  palette = floor(clamp(v, 0, palettes.length - 1)) // write the bound display var so the widget shows a clean integer
  currentIndex = palette
  nextIndex = (palette + 1) % palettes.length
  inTransition = 0
  blendValue = 0
  runTime = 0
  buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
}

export function beforeRender(delta) {
  updatePaletteManager(delta)
  t1 = time(0.06 * (1.01 - speed))   // drifting field phase
  t2 = time(0.09 * (1.01 - speed))
}

export function render2D(index, x, y) {
  v = wave((x + y) * 0.5 + t1)
  v = v * v * 0.8 + 0.2              // perceptual curve + min light (no blackout)
  h = wave(x * 0.5 - y * 0.3 + t2)  // palette position
  paint(h, v)
}

// 1D fallback if no map is installed.
export function render(index) {
  pct = index / pixelCount
  v = wave(pct + t1)
  v = v * v * 0.8 + 0.2
  paint(wave(pct + t2), v)
}
