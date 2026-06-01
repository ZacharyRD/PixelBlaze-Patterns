/*
 * Infinite Mirror Table — 2D Pixel Map
 * PASTE THIS INTO THE MAPPER TAB (it is browser JavaScript, not pattern code).
 *
 * Layout: a rectangle perimeter, 326 LEDs total, 144 LEDs/m strip.
 *   Side 1 (long)  = 106 LEDs   (~0.74 m)
 *   Side 2 (short) =  57 LEDs   (~0.40 m)
 *   Side 3 (long)  = 106 LEDs
 *   Side 4 (short) =  57 LEDs
 *
 * Wiring: LED 0 starts at the beginning of a long side and runs CLOCKWISE.
 * Path: top edge (L->R) -> right edge (top->bottom) -> bottom edge (R->L) ->
 *       left edge (bottom->top), closing the loop.
 *
 * Coordinates are proportional to LED counts (uniform pitch), so the rectangle
 * keeps its true ~1.86:1 aspect ratio. The editor normalizes to world units 0..1.
 */
function (pixelCount) {
  var longSide = 106
  var shortSide = 57
  var W = 106            // width  (long sides), in LED-pitch units
  var H = 57             // height (short sides)
  var map = []
  var i

  // Side 1 — long, top edge, left -> right
  for (i = 0; i < longSide; i++) map.push([W * (i / longSide), 0])

  // Side 2 — short, right edge, top -> bottom
  for (i = 0; i < shortSide; i++) map.push([W, H * (i / shortSide)])

  // Side 3 — long, bottom edge, right -> left
  for (i = 0; i < longSide; i++) map.push([W * (1 - i / longSide), H])

  // Side 4 — short, left edge, bottom -> top
  for (i = 0; i < shortSide; i++) map.push([0, H * (1 - i / shortSide)])

  return map   // 326 points
}
