/*
 * Ember Flicker — 2D (any 2D map; 1D fallback included)
 * A bed of glowing coals: soft warm cells brighten and fade with organic Perlin
 * motion (no strobe), hotter spots glowing yellow, cooler ones deep red, with a
 * slow crossfade between warm palettes. Demonstrates: correct SLOW Perlin drift
 * (accumulate + wrap, never time()*256), heat -> palette-position mapping, and a
 * brightness floor so it never fully blacks out.
 *
 * Hardware-validated on a 326-pixel WS2815 edge-lit table (rectangle perimeter
 * map — see reference/mapping.md). Verified against reference/language.md.
 */

// Warm palettes (position, r, g, b). Low end = deep ember red (not black) so the
// scene always glows; high end = hot yellow. paint() maps "heat" onto this ramp.
var emberGlow   = [0.0, 0.25, 0.0,  0.0,   0.30, 0.70, 0.10, 0.0,   0.60, 1.0, 0.40, 0.0,   0.85, 1.0, 0.70, 0.10,   1.0, 1.0, 0.90, 0.50]
var sunsetWarm  = [0.0, 0.30, 0.0,  0.02,  0.35, 0.80, 0.10, 0.0,   0.70, 1.0, 0.45, 0.05,   1.0, 1.0, 0.80, 0.25]
var amberHearth = [0.0, 0.20, 0.03, 0.0,   0.40, 0.85, 0.25, 0.0,   0.75, 1.0, 0.60, 0.10,   1.0, 1.0, 0.95, 0.60]

var palettes = [ emberGlow, sunsetWarm, amberHearth ]

var PALETTE_HOLD_TIME = 45        // seconds on each palette
var PALETTE_TRANSITION_TIME = 8   // seconds to crossfade

export var currentIndex = floor(random(palettes.length))
export var autoCycle = 1     // exported for debugging; 1 = auto-cycle, 0 = hold
export var randomStart = 1   // exported for debugging; 1 = random palette each run, 0 = honor Palette #
started = 0                  // one-shot startup guard
export var palette = 0       // backing var the "Palette #" widget binds to/displays (prevents uninitialized garbage like 8.175035e-41)
var nextIndex = (currentIndex + 1) % palettes.length
var inTransition = 0
var blendValue = 0
runTime = 0

var pixel1 = array(3)
var pixel2 = array(3)
var PALETTE_SIZE = 16
var currentPalette = array(4 * PALETTE_SIZE)

setPalette(currentPalette)
buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)

zBase = 0          // noise drift coordinates (accumulated slowly; perlin wraps at 256)
zShim = 0

speed = 0.5
maxBright = 0.9    // also your power throttle on big installs
emberScale = 3.5
export function sliderSpeed(v) { speed = v }
export function sliderBrightness(v) { maxBright = v }
export function sliderEmberSize(v) { emberScale = 1.5 + v * 5 }
export function toggleAutoCycle(on) { autoCycle = on }       // OFF = hold current palette
export function toggleRandomPalette(on) { randomStart = on } // ON = random start each run; OFF = use Palette #

// ---- palette blending module (zranger1 technique; see reference/palette-blending.md) ----
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
  // Drift the noise SLOWLY: a fraction of a cell per second. Accumulate with
  // delta and wrap at 256 (seamless). NOT time()*256 — that strobes.
  sec = delta / 1000
  speedMul = 0.2 + speed * 1.6
  zBase = (zBase + sec * 0.25 * speedMul) % 256
  zShim = (zShim + sec * 0.70 * speedMul) % 256
}

export function render2D(index, x, y) {
  heat = perlinFbm(x * emberScale, y * emberScale, zBase, 2, 0.6, 3)
  heat = heat * 0.5 + 0.5
  heat = heat + perlin(x * emberScale * 2.5 + 5, y * emberScale * 2.5, zShim, 3) * 0.15
  heat = clamp(heat, 0, 1)
  heat = smoothstep(0.15, 0.95, heat)   // ember contrast
  v = heat * 0.92 + 0.08                // brightness floor: coals never fully die
  paint(heat, v * maxBright)            // hotter = brighter + more yellow
}

export function render(index) {
  pct = index / pixelCount
  heat = perlinFbm(pct * emberScale, 0, zBase, 2, 0.6, 3) * 0.5 + 0.5
  heat = heat + perlin(pct * emberScale * 2.5 + 5, 0, zShim, 3) * 0.15
  heat = clamp(heat, 0, 1)
  heat = smoothstep(0.15, 0.95, heat)
  v = heat * 0.92 + 0.08
  paint(heat, v * maxBright)
}
