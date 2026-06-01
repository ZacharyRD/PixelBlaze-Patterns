/*
 * Infinite Mirror Table — "Ember Flicker"
 * A bed of glowing coals: soft warm cells brighten and fade with organic Perlin
 * motion (no harsh strobe), hotter spots glowing yellow, cooler ones deep red.
 * Same warm-palette crossfade as the Warm Wash variant, just a livelier, cozier
 * motion. Uses the SAME map (mirror-table-2D-map.js) — install it in the Mapper
 * tab first. WS2815, 326 px.
 *
 * Sliders: Speed, Brightness (your power throttle), Ember Size.
 * Verified against the PixelBlaze V3 language reference.
 */

// ---- warm palettes (position, r, g, b). Low end = deep ember red, not black;
//      high end = hot yellow. paint() maps "heat" 0..1 onto this red->yellow ramp.
var emberGlow  = [0.0, 0.25, 0.0,  0.0,   0.30, 0.70, 0.10, 0.0,   0.60, 1.0, 0.40, 0.0,   0.85, 1.0, 0.70, 0.10,   1.0, 1.0, 0.90, 0.50]
var sunsetWarm = [0.0, 0.30, 0.0,  0.02,  0.35, 0.80, 0.10, 0.0,   0.70, 1.0, 0.45, 0.05,   1.0, 1.0, 0.80, 0.25]
var amberHearth= [0.0, 0.20, 0.03, 0.0,   0.40, 0.85, 0.25, 0.0,   0.75, 1.0, 0.60, 0.10,   1.0, 1.0, 0.95, 0.60]

var palettes = [ emberGlow, sunsetWarm, amberHearth ]

// ---- crossfade timing (seconds) ----
var PALETTE_HOLD_TIME = 45
var PALETTE_TRANSITION_TIME = 8

// ---- palette-manager state ----
export var currentIndex = floor(random(palettes.length))
export var autoCycle = 1   // exported for debugging; 1 = auto-cycle, 0 = hold
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

// ---- noise drift coordinates (accumulated slowly; perlin wraps at 256) ----
zBase = 0
zShim = 0

// ---- user controls ----
speed = 0.5         // flicker speed (0..1)
maxBright = 0.9     // bright by default; lower if power is tight
emberScale = 3.5    // ember cell size / density (set via slider)
export function sliderSpeed(v) { speed = v }
export function sliderBrightness(v) { maxBright = v }
export function sliderEmberSize(v) { emberScale = 1.5 + v * 5 }
export function toggleAutoCycle(on) { autoCycle = on }   // OFF = hold current palette   // smaller v = bigger coals

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
  pi = floor(clamp(v, 0, palettes.length - 1))
  currentIndex = pi
  nextIndex = (pi + 1) % palettes.length
  inTransition = 0
  blendValue = 0
  runTime = 0
  buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
}

// ---- per-frame math ----
export function beforeRender(delta) {
  updatePaletteManager(delta)
  // Drift the noise SLOWLY: a fraction of a cell per second. Accumulate with
  // delta (seconds = delta/1000) and wrap at 256, where perlin tiles seamlessly.
  // (Multiplying time() by a big number here is what caused the strobing.)
  sec = delta / 1000
  speedMul = 0.2 + speed * 1.6                 // 0.2 .. 1.8
  zBase = (zBase + sec * 0.25 * speedMul) % 256  // ~0.25 cells/sec at speed 0.5
  zShim = (zShim + sec * 0.70 * speedMul) % 256  // shimmer drifts a bit faster
}

// ---- ember field ----
export function render2D(index, x, y) {
  // Fractal noise for an organic bed of coals...
  heat = perlinFbm(x * emberScale, y * emberScale, zBase, 2, 0.6, 3)
  heat = heat * 0.5 + 0.5                                   // ~0..1
  // ...plus a finer, slower-drifting layer so individual embers shimmer.
  heat = heat + perlin(x * emberScale * 2.5 + 5, y * emberScale * 2.5, zShim, 3) * 0.15
  heat = clamp(heat, 0, 1)
  // Ember contrast: deepen the lows, let hot spots flare.
  heat = smoothstep(0.15, 0.95, heat)
  // Brightness tracks heat, with a faint floor so coals never fully die.
  v = heat * 0.92 + 0.08
  paint(heat, v * maxBright)                                // hotter = brighter + more yellow
}

// 1D fallback (if the map isn't installed): embers along the strip.
export function render(index) {
  pct = index / pixelCount
  heat = perlinFbm(pct * emberScale, 0, zBase, 2, 0.6, 3) * 0.5 + 0.5
  heat = heat + perlin(pct * emberScale * 2.5 + 5, 0, zShim, 3) * 0.15
  heat = clamp(heat, 0, 1)
  heat = smoothstep(0.15, 0.95, heat)
  v = heat * 0.92 + 0.08
  paint(heat, v * maxBright)
}
