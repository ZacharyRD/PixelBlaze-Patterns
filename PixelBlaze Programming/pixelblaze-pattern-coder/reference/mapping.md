# Building Pixel Maps from a Described Layout

A pixel map tells PixelBlaze where each LED physically sits, so patterns can be
shape-aware. With a map installed you write `render2D(index, x, y)` or
`render3D(index, x, y, z)` and receive coordinates in **world units (0.0–1.0)**,
auto-scaled from whatever units you used in the map.

## Two critical rules

1. **Map code is browser JavaScript, NOT pattern code.** It runs once in the
   editor's **Mapper** tab to generate coordinates. Here you *may* use `Math.*`,
   array literals, and `.push()` — none of which exist in the pattern language.
   Never mix the two.
2. **Map order = wiring order.** Element 0 of the map is the first LED in the
   data chain, element 1 the next, and so on. Getting this order right (e.g.
   serpentine vs. row-by-row) is the whole game.

A map is either a **JSON array of `[x,y]` or `[x,y,z]` points**, or a
**`function(pixelCount){ ... return map }`** that generates one. Use any
consistent unit (inches, mm, pixel counts) — the editor normalizes to world
units based on the map's extents.

## Translating a description → map + render function

| User says | Dimensions | Map | Render |
|---|---|---|---|
| "strip", "string", "1 line of N" | 1D | none needed | `render(index)` |
| "N×M matrix/panel", "grid" | 2D | matrix generator (check zigzag!) | `render2D` |
| "ring", "circle", "halo" | 2D | ring generator | `render2D` |
| "spiral", "disc of rings" | 2D | spiral/concentric generator | `render2D` |
| "edge-lit table", "infinity mirror", "outline", "border/sign" | 2D | rectangle-perimeter generator | `render2D` |
| "cube", "3D grid", "LED volume" | 3D | cube generator | `render3D` |
| "cylinder", "helix", "tube", "tree" | 3D | helix generator | `render3D` |
| "sphere", "globe", "ball" | 3D | fibonacci-sphere generator | `render3D` |

Always confirm **pixel count** and, for matrices, **row width** and **wiring
pattern (serpentine/zigzag vs. progressive/row-by-row)** — this is the single
most common source of "my matrix is scrambled" complaints.

## Ready-to-use generators (paste into the Mapper tab)

### 2D matrix — serpentine / zigzag wiring (rows alternate direction)
```js
function (pixelCount) {
  width = 16                    // LEDs per row — set to your panel width
  var map = []
  for (i = 0; i < pixelCount; i++) {
    y = Math.floor(i / width)
    x = i % width
    if (y % 2 == 1) x = width - 1 - x   // reverse every other row
    map.push([x, y])
  }
  return map
}
```

### 2D matrix — progressive wiring (every row left→right)
```js
function (pixelCount) {
  width = 16
  var map = []
  for (i = 0; i < pixelCount; i++) {
    map.push([i % width, Math.floor(i / width)])
  }
  return map
}
```

### 2D ring (single circle)
```js
function (pixelCount) {
  var map = []
  for (i = 0; i < pixelCount; i++) {
    a = i / pixelCount * Math.PI * 2
    map.push([Math.cos(a), Math.sin(a)])
  }
  return map
}
```

### 2D spiral / concentric disc
```js
function (pixelCount) {
  turns = 5                     // how many times it winds to the edge
  var map = []
  for (i = 0; i < pixelCount; i++) {
    t = i / pixelCount
    a = t * Math.PI * 2 * turns
    r = t                       // radius grows outward
    map.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return map
}
```

### 2D rectangle perimeter (edge-lit tables, infinity mirrors, signs, borders)
LEDs run around the *outline* of a rectangle (nothing in the middle). Set the four
side lengths in LED counts, in wiring order starting at LED 0. Coordinates are
proportional to LED counts, so the aspect ratio comes out correct automatically.
Confirm the start corner and direction with the user (this version starts on a
long side, clockwise). Field-style patterns (e.g. an ambient wash) look coherent
across all four sides; `render2D` is the right entry point.
```js
function (pixelCount) {
  // wiring order from LED 0, clockwise: top (long), right (short), bottom, left
  var top = 106, right = 57, bottom = 106, left = 57
  var W = Math.max(top, bottom)      // browser JS here — Math.* is fine in the Mapper
  var H = Math.max(left, right)
  var map = []
  var i
  for (i = 0; i < top; i++)    map.push([W * (i / top), 0])           // top    L -> R
  for (i = 0; i < right; i++)  map.push([W, H * (i / right)])         // right  T -> B
  for (i = 0; i < bottom; i++) map.push([W * (1 - i / bottom), H])    // bottom R -> L
  for (i = 0; i < left; i++)   map.push([0, H * (1 - i / left)])      // left   B -> T
  return map
}
```

### 3D cube / regular volume
```js
function (pixelCount) {
  side = Math.round(Math.cbrt(pixelCount))   // e.g. 512 -> 8x8x8
  var map = []
  for (i = 0; i < pixelCount; i++) {
    x = i % side
    y = Math.floor(i / side) % side
    z = Math.floor(i / (side * side))
    map.push([x, y, z])
  }
  return map
}
```

### 3D cylinder / helix (strip wound around a tube or tree)
```js
function (pixelCount) {
  turns = 12                    // number of wraps from bottom to top
  var map = []
  for (i = 0; i < pixelCount; i++) {
    t = i / pixelCount
    a = t * Math.PI * 2 * turns
    map.push([Math.cos(a), Math.sin(a), t])   // z climbs 0..1
  }
  return map
}
```

### 3D sphere (even spacing via Fibonacci lattice)
```js
function (pixelCount) {
  var map = []
  phi = Math.PI * (3 - Math.sqrt(5))          // golden angle
  for (i = 0; i < pixelCount; i++) {
    y = 1 - (i / (pixelCount - 1)) * 2         // 1 .. -1
    r = Math.sqrt(1 - y * y)
    th = phi * i
    map.push([Math.cos(th) * r, y, Math.sin(th) * r])
  }
  return map
}
```

### Explicit JSON map (irregular / hand-measured layouts)
For sculptures or signs, list real measured coordinates in wiring order:
```json
[
  [0,0], [10,0], [20,0],
  [20,10], [10,10], [0,10]
]
```

## Using the map in the pattern

```js
export function render2D(index, x, y) {
  // x, y are 0..1 across the actual extents of your map
  hsv(x, 1, y)            // a diagonal rainbow gradient
}
```

To rotate, zoom, or scroll the world, apply coordinate transforms in
`beforeRender` (`rotate`, `scale`, `translate`, `translate3D`, etc.) — see
`reference/language.md`. Center-based effects often want coordinates remapped to
-1..1: `cx = x*2 - 1`.

## Sanity checks before handing off

- Map element count should equal `pixelCount`.
- For matrices, confirm wiring direction with the user; offer both serpentine and
  progressive if unsure.
- Remind the user the map goes in the **Mapper** tab and the pattern in the code
  editor — they are different languages.
