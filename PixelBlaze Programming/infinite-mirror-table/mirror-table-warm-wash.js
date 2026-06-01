/*
 * Infinite Mirror Table — "Warm Wash"
 * A slow, mellow ambient field of yellows, oranges, and reds drifting across the
 * whole table, with a graceful crossfade between four DISTINCT warm palettes.
 * Paste into the pattern editor; install mirror-table-2D-map.js in the Mapper tab.
 *
 * Controls:
 *   Speed       - motion speed
 *   Brightness  - overall brightness (also your power throttle)
 *   Auto Cycle  - ON = auto crossfade through palettes; OFF = hold current one
 *   Palette #   - jump straight to a palette (0..3). Turn Auto Cycle OFF to lock it.
 *
 * Verified against the PixelBlaze V3 language reference.
 *
 * Note: each palette is intentionally a DIFFERENT warm character (red / orange /
 * gold / full-fire). Near-identical palettes make the crossfade look like muddy
 * "mixing" instead of a visible fade — distinctness is what makes the fade read.
 */

// ---- four distinct warm palettes (position, r, g, b). Low end is a deep ember,
//      never full black, so the table always glows. ----
var deepEmber    = [0.0, 0.12, 0.0,  0.0,   0.45, 0.50, 0.05, 0.0,   0.80, 0.80, 0.15, 0.0,   1.0, 1.0, 0.30, 0.02]  // RED-dominant
var amberOrange  = [0.0, 0.35, 0.04, 0.0,   0.45, 0.75, 0.22, 0.0,   0.80, 1.00, 0.45, 0.0,    1.0, 1.0, 0.60, 0.08]  // ORANGE
var goldenYellow = [0.0, 0.45, 0.12, 0.0,   0.45, 0.85, 0.45, 0.0,   0.80, 1.00, 0.75, 0.08,   1.0, 1.0, 0.92, 0.40]  // GOLD/YELLOW
var fireBright   = [0.0, 0.20, 0.0,  0.0,   0.30, 0.70, 0.08, 0.0,   0.60, 1.00, 0.40, 0.0,    0.85, 1.0, 0.80, 0.15,   1.0, 1.0, 1.0, 0.70]  // full fire

var palettes = [ deepEmber, amberOrange, goldenYellow, fireBright ]

// ---- crossfade timing (seconds) — long and gentle ----
var PALETTE_HOLD_TIME = 45
var PALETTE_TRANSITION_TIME = 8

// ---- palette-manager state ----
export var currentIndex = floor(random(palettes.length))
var nextIndex = (currentIndex + 1) % palettes.length
var inTransition = 0
var blendValue = 0
export var autoCycle = 1
runTime = 0

// ---- scratch buffers (allocated once) ----
var pixel1 = array(3)
var pixel2 = array(3)
var PALETTE_SIZE = 16
var currentPalette = array(4 * PALETTE_SIZE)

setPalette(currentPalette)
buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blendValue)

// ---- user controls ----
export var speed = 0.5        // matches sliderSpeed; exported so the widget seeds correctly
export var brightness = 0.9   // matches sliderBrightness (was maxBright); lower if power is tight
export var palette = 0        // matches inputNumberPalette; without it the widget shows garbage
export function sliderSpeed(v) { speed = v }
export function sliderBrightness(v) { brightness = v }
export function toggleAutoCycle(on) { autoCycle = on }   // OFF = hold current palette

// ---- palette blending module (zranger1 technique) ----
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
  if (autoCycle) {                       // when OFF, freeze on the current palette
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

// Manually jump straight to a palette index (0..palettes.length-1), no crossfade.
// Turn Auto Cycle OFF first if you want it to stay there.
export function inputNumberPalette(v) {
  palette = floor(clamp(v, 0, palettes.length - 1))   // back the widget with its matching exported var
  currentIndex = palette
  nextIndex = (currentIndex + 1) % palettes.length
  inTransition = 0
  blendValue = 0
  runTime = 0
  buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
}

// ---- per-frame math ----
export function beforeRender(delta) {
  updatePaletteManager(delta)
  t1 = time(0.15 * (1.01 - speed))   // slow palette-position drift (~10s)
  t2 = time(0.22 * (1.01 - speed))   // slower brightness undulation (~14s)
}

// ---- ambient wash across the whole table ----
export function render2D(index, x, y) {
  // Broad, low-frequency gradient so all four sides stay color-coherent.
  h = wave((x * 0.6 + y * 0.4) * 0.5 + t1)        // palette position 0..1
  // Gentle brightness swell, floored high so it stays warmly lit (no blackout).
  v = wave((x * 0.3 - y * 0.5) * 0.5 + t2) * 0.25 + 0.75   // 0.75..1.0
  paint(h, v * brightness)
}

// 1D fallback (e.g. if the map isn't installed yet): wash along the strip.
export function render(index) {
  pct = index / pixelCount
  h = wave(pct * 0.5 + t1)
  v = wave(pct + t2) * 0.25 + 0.75
  paint(h, v * brightness)
}
