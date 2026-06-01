# PixelBlaze UI Controls (verified signatures)

Controls appear automatically when you `export` a function whose name **starts
with a reserved prefix** followed by a label in CamelCase or snake_case. The
label becomes the on-screen name. Input controls are also called with the saved
value when the pattern loads, so initialize a default global too. **Name that global
to match the control and `export` it** (`inputNumberScale` <-> `export var scale`):
PixelBlaze seeds the control's displayed value from the matching exported var, and if
it's missing the widget reads uninitialized memory and shows garbage (e.g.
`8.175035e-41`).

Keep it to **2–4 controls** for most patterns: usually speed, brightness,
palette/hue, and density. Comment each with purpose and range.

## Input controls

### Slider — value 0.0..1.0
```js
var mySetting = 0.5            // default; control re-applies saved value on load
export function sliderMySetting(v) {
  mySetting = v                // remap here if you need another range, e.g. v*5
}
```

### Toggle — boolean (1 / 0)
```js
var enabled = 1
export function toggleEnabled(isOn) {
  enabled = isOn               // true(1) when on, false(0) when off
}
```

### Trigger button — momentary, no argument, NOT called on load
```js
export function triggerFireLasers() {
  // kick off a one-shot effect, e.g. set a phase variable
}
```

### Number input — any positive/negative whole or decimal value
```js
export var scale = 1            // export + matching name so the widget displays it (no uninitialized garbage)
export function inputNumberScale(v) {
  scale = v
}
```

### Color pickers — components are 0.0..1.0, ready for hsv()/rgb()
```js
var ph = 0, ps = 1, pv = 1
export function hsvPickerPrimaryColor(h, s, v) {
  ph = h; ps = s; pv = v
}

var pr = 1, pg = 0, pb = 0
export function rgbPickerAccent(r, g, b) {
  pr = r; pg = g; pb = b
}
```

## Output controls (display only — return a value, called frequently)

### Show a number (displayed with 4 decimals)
```js
export function showNumberEnergyAverage() {
  return energyAverage
}
```

### Gauge (returns 0.0..1.0, shown as a percentage bar; out-of-range is clamped)
```js
export function gaugeLightLevel() {
  return light
}
```

## Notes

- Prefixes are case-sensitive at the start: `slider`, `toggle`, `trigger`,
  `inputNumber`, `hsvPicker`, `rgbPicker`, `showNumber`, `gauge`.
- Control settings persist across restarts and pattern switches.
- Store the incoming value in a global; do the math where you use it, not inside
  the control function, so the control stays cheap.
