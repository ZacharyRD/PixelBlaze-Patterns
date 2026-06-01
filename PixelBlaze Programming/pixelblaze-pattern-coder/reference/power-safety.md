# LED Power Safety

Patterns can command more current than the wiring or power supply can safely
deliver. This is a real fire/brownout risk on larger installs, and it shapes how
patterns should be written. Treat this as part of "never crash the hardware."

## The number that matters

A typical 5V addressable LED (WS2812/WS2812B/SK6812) draws up to **~60 mA at full
white** (≈20 mA per R/G/B channel). Brightness and color scale current roughly
linearly, so:

```
peak amps ≈ pixelCount × 0.06 A × (avg brightness 0..1) × (fraction of channels lit)
```

Examples at 5V:
- 150 LEDs, full white, full brightness → ~9 A (~45 W)
- 300 LEDs, full white → ~18 A (~90 W)
- 300 LEDs running a calm palette at ~40% brightness → ~3–5 A

APA102/SK9822 are similar per-LED; they just refresh faster.

## What this means for the supply and wiring

- The power supply must comfortably exceed the realistic peak (leave headroom;
  don't run a supply at 100%).
- **Inject power** every ~150–200 LEDs on 5V strips to fight voltage drop —
  otherwise the far end dims and shifts color (the classic "red tail").
- Use adequately gauged wire for the current. This is electrical work; if a run
  is large, verify against the strip and supply datasheets or get a second set of
  eyes. (Informational, not a substitute for an electrician on permanent installs.)

## What this means for patterns (write power-aware code)

- **Never default to all pixels at full white / `value = 1` simultaneously.** That
  is both the harshest look and the worst-case current draw. The house style
  already forbids full-white blasts and full-neon — that doubles as power safety.
- Modulate `value` across space and time so the *average* draw stays well below
  peak. Palette-based looks with dark regions (e.g. `nightAurora`) are naturally
  power-friendly.
- Offer a **brightness control** and consider a hard ceiling in code when the user
  flags a constrained supply:
  ```js
  maxBright = 0.6                      // cap overall output
  export function sliderBrightness(v) { maxBright = v * 0.6 }
  // ...then in render: hsv(h, s, val * maxBright)  // or paint(v, val * maxBright)
  ```
- PixelBlaze also has a **global brightness limit** in settings — mention it as the
  device-wide backstop, independent of the pattern.

## When to raise it with the user

If the user mentions a long run (roughly **150+ LEDs**), a wall-wart/USB supply, or
any "why does the end look dim/pink" symptom, surface power budget and injection
before blaming the pattern.
