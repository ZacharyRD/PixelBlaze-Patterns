# PixelBlaze

LED patterns for the [ElectroMage PixelBlaze V3](https://electromage.com/) controller,
plus a Claude skill for writing more of them.

## Contents

- **`PixelBlaze Programming/pixelblaze-pattern-coder/`** — a Claude skill that writes,
  debugs, and explains PixelBlaze patterns (PixelBlaze expression language, not standard
  JS). Includes verified language reference, palette libraries, a palette-crossfade module,
  power-safety guidance, and worked examples. Packaged as `pixelblaze-pattern-coder.skill`.
- **`_honeycomb 2D_3D - ZRD palettes.epe`** — honeycomb pattern (2D/3D) with the
  signature slow palette-crossfade effect (45s hold / 5s blend).
- **`PixelBlaze Programming/infinite-mirror-table/`** — patterns for an infinite mirror table.

## Installing the skill

The skill is distributed as `PixelBlaze Programming/pixelblaze-pattern-coder.skill`
(a zipped skill bundle). Install it into a Claude environment that supports skills, or
copy the `pixelblaze-pattern-coder/` folder into your skills directory.

## Using a pattern

Open a `.epe` file's code in the PixelBlaze editor, or paste a `.js` pattern source
directly. Patterns that need a pixel map include map code for the Mapper tab.

## License

Copyright (C) 2026 Zachary Reiss-Davis

Licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
You may use, modify, and distribute this project — including commercially — but any
distributed derivative must remain open-source under the same license and preserve
this attribution. See [LICENSE](LICENSE) for the full text.
