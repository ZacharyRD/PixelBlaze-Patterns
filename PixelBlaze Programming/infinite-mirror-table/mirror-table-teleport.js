/*
 * Infinite Mirror Table — "Teleport"
 * Light streaks race around the perimeter; the mirror's reflections turn them
 * into a tunnel rushing into infinity. Each 45-second cycle runs an intensity
 * envelope:
 *     0-20s  slow, ambient drift
 *    20-30s  gradually accelerates
 *    30-35s  fast "teleport" peak (rushing, but smooth — not a strobe)
 *    35-45s  calms back down WHILE crossfading to the next palette
 * Cycles through four palettes: BSS26 (no-red teal/gold), Rainbow Sherbet,
 * Sunset Real, and Soft Purple-Blue. Uses the SAME map (mirror-table-2D-map.js).
 * WS2815, 326 px.
 *
 * Controls: Speed, Brightness, Auto Cycle (off = hold palette, motion keeps
 * running), Random Palette (default ON = start on a random palette each run),
 * Palette # (0-3; used as the start palette when Random Palette is OFF).
 * Verified against the language reference.
 */

// ---- palettes (position, r, g, b) ----
var BSS26_no_red    = [0.0, 0.949, 0.616, 0.0, 0.111, 0.9, 0.692, 0.0, 0.222, 0.851, 0.791, 0.0, 0.333, 0.764, 0.787, 0.212, 0.444, 0.644, 0.765, 0.467, 0.556, 0.534, 0.749, 0.712, 0.667, 0.163, 0.634, 0.7, 0.778, 0.0, 0.558, 0.671, 0.889, 0.0, 0.532, 0.651, 1.0, 0.0, 0.352, 0.443]
var rainbowSherbet  = [0.0, 1.0, 0.129, 0.016, 0.169, 1.0, 0.267, 0.098, 0.337, 1.0, 0.027, 0.098, 0.498, 1.0, 0.322, 0.404, 0.667, 1.0, 1.0, 0.949, 0.82, 0.165, 1.0, 0.086, 1.0, 0.341, 1.0, 0.255]
// two more from the skill's reference/palettes.md, for easier testing:
var sunsetReal      = [0.0, 0.471, 0.0, 0.0, 0.086, 0.702, 0.086, 0.0, 0.2, 1.0, 0.408, 0.0, 0.333, 0.655, 0.086, 0.071, 0.529, 0.392, 0.0, 0.404, 0.776, 0.063, 0.0, 0.51, 1.0, 0.0, 0.0, 0.627]
var softPurpleBlue  = [0.0, 0.969, 0.69, 0.969, 0.188, 1.0, 0.533, 1.0, 0.349, 0.863, 0.114, 0.886, 0.627, 0.027, 0.322, 0.698, 0.847, 0.004, 0.486, 0.427, 1.0, 0.004, 0.486, 0.427]

var palettes = [ BSS26_no_red, rainbowSherbet, sunsetReal, softPurpleBlue ]

// ---- cycle timeline (seconds) ----
// Edit ONLY these four phase durations; the totals below auto-sum from them.
var T_SLOW = 20    // ambient
var T_RAMP = 10    // accelerate
var T_PEAK = 5     // fast peak
var T_CALM = 10    // calm down + palette crossfade
// derived — do not edit:
var CALM_START = T_SLOW + T_RAMP + T_PEAK   // when calm-down + crossfade begins
var CYCLE_LEN  = CALM_START + T_CALM         // full cycle length

// ---- palette + motion state ----
export var currentIndex = floor(random(palettes.length))  // random by default (kept readable)
export var autoCycle = 1       // exported for debugging; 1 = cycle palettes, 0 = hold
export var randomStart = 1     // exported for debugging; 1 = random palette each run, 0 = honor Palette #
started = 0                    // one-shot startup guard (runs once, on the first frame)
var nextIndex = (currentIndex + 1) % palettes.length
cycleT = 0                   // always-advancing envelope clock (seconds)
warpPhase = 0                // streak scroll position (wraps at 1, seamless)
speedEnv = 0                 // 0 = calm, 1 = teleport peak

var pixel1 = array(3)
var pixel2 = array(3)
var PALETTE_SIZE = 16
var currentPalette = array(4 * PALETTE_SIZE)

setPalette(currentPalette)
buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)

// ---- user controls ----
export var speed = 0.5        // matches sliderSpeed; exported so the widget seeds correctly
export var brightness = 0.85  // matches sliderBrightness (was maxBright); also your power throttle
export var palette = 0        // matches inputNumberPalette; without it the widget shows garbage
var bandCount = 5   // brightness bands around the loop — integer keeps the closed loop seamless
var colorFreq = 2   // palette sweeps around the loop — integer keeps it seamless
export function sliderSpeed(v) { speed = v }
export function sliderBrightness(v) { brightness = v }
export function toggleAutoCycle(on) { autoCycle = on }   // OFF = hold palette (motion still runs)
export function toggleRandomPalette(on) { randomStart = on }  // ON = random start each run; OFF = use Palette #

// ---- palette blending helpers (zranger1 technique) ----
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

// Jump straight to a palette index (0-based); restarts the cycle. Turn Auto
// Cycle OFF to keep it there. Defined after buildBlendedPalette.
export function inputNumberPalette(v) {
  palette = floor(clamp(v, 0, palettes.length - 1))   // back the widget with its matching exported var
  currentIndex = palette
  nextIndex = (currentIndex + 1) % palettes.length
  cycleT = 0
  buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
}

export function beforeRender(delta) {
  // One-shot startup (runs once, after the controls restore their saved values).
  // If Random Palette is ON, the random pick wins over the restored Palette #.
  // Cost after the first frame is a single boolean check — never per pixel.
  if (!started) {
    started = 1
    if (randomStart) currentIndex = floor(random(palettes.length))
    nextIndex = (currentIndex + 1) % palettes.length
    buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], 0)
  }

  sec = delta / 1000

  // Always-advancing envelope clock so motion never freezes (even when holding).
  cycleT = cycleT + sec
  if (cycleT >= CYCLE_LEN) {
    cycleT = cycleT - CYCLE_LEN
    if (autoCycle) {                       // advance palettes only when cycling
      currentIndex = (currentIndex + 1) % palettes.length
      nextIndex = (nextIndex + 1) % palettes.length
    }
  }

  // Intensity envelope: slow -> accelerate -> peak -> calm.
  if (cycleT < T_SLOW) {
    speedEnv = 0
  } else if (cycleT < T_SLOW + T_RAMP) {
    speedEnv = smoothstep(T_SLOW, T_SLOW + T_RAMP, cycleT)        // 0 -> 1
  } else if (cycleT < CALM_START) {
    speedEnv = 1
  } else {
    speedEnv = 1 - smoothstep(CALM_START, CYCLE_LEN, cycleT)      // 1 -> 0
  }

  // Palette crossfade happens during the calm window (autoCycle on); otherwise
  // hold the current palette so you can inspect it while motion continues.
  if (autoCycle) {
    blend = 0
    if (cycleT >= CALM_START) blend = (cycleT - CALM_START) / T_CALM   // 0 -> 1
    buildBlendedPalette(palettes[currentIndex], palettes[nextIndex], blend)
  } else {
    buildBlendedPalette(palettes[currentIndex], palettes[currentIndex], 0)
  }

  // Drive the motion. Both brightness and color use `- warpPhase` with a
  // coefficient of 1, and warpPhase wraps at 1, so scrolling is seamless. (An
  // earlier version scaled the color phase, so it jumped each wrap = flicker.)
  speedMul = 0.6 + speed * 0.8                 // 0.6 .. 1.4
  warpRate = 0.03 + speedEnv * 1.8 * speedMul  // scroll speed (cells/sec)
  warpPhase = (warpPhase + sec * warpRate) % 1
  // Brightness modulation goes SHALLOWER as it speeds up, so the fast section is
  // a steady color-rush instead of flashing crests (the old pow() sharpening
  // flickered at speed).
  bandDepth = 0.8 - speedEnv * 0.45            // 0.8 deep (slow) -> 0.35 shallow (fast)
}

export function render2D(index, x, y) {
  loopPos = index / pixelCount                 // position around the closed perimeter
  // Brightness: smooth bands; modulation depth shrinks with speed (no flicker).
  vMod = wave(loopPos * bandCount - warpPhase)
  v = (1 - bandDepth) + bandDepth * vMod * vMod    // gentle gamma + glow floor (no blackout)
  // Color: triangle sweeps the palette out AND back, so its end never jumps to
  // its start — no hard seam on these non-cyclic palettes.
  colorPos = triangle(loopPos * colorFreq - warpPhase)
  paint(colorPos, v * brightness)
}

// 1D fallback (same effect along the strip order).
export function render(index) {
  loopPos = index / pixelCount
  vMod = wave(loopPos * bandCount - warpPhase)
  v = (1 - bandDepth) + bandDepth * vMod * vMod
  paint(triangle(loopPos * colorFreq - warpPhase), v * brightness)
}
