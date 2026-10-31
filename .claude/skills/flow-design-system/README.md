# Flow Design System

Flow is an ambient-music instrument in the browser: infinite ambient music, authored by humans. You shape a live scene (sounds, chords, layers, a moving ink canvas) and either play it by hand or let Automatic droplets keep it unfolding. You can record loops, share them with the community, and leave it running for hours.

This system is a **ground-up redesign** of the Flow interface: minimal, elegant, dark, built around knobs and sliders that are a pleasure to use. It is not a copy of the current CSS. Structure, content and copy come from the source; visual language is new.

**Sources**
- Live app: https://flow.the816.com (about page: /about.html)
- Repo: github.com/riebschlager/flow @ main (also on the author's machine at `~/Projects/flow/`). Key files: `app/instrument.html` (all UI markup), `public/style.css`, `public/palettes.js`, `public/about.html`, `public/presentation.css`.
- The previous UI used DM Sans + Manrope, `--bg:#101316`, `--accent:#b7a0ff`. Those were replaced on purpose.

## Product surfaces
One product, one web app, desktop first:
- **Live session.** A full-bleed fluid canvas, the transport (play, chord progression, note readout, tempo, record), and a right-hand control rail with five tabs: Sound, Layers, Play, Scene, Mix.
- **Beat studio.** A dialog with a 4-voice × 16-step sequencer.
- **Recording library.** A dialog with your takes, loop playback and clip/WAV export.
- **Community.** A dialog of shared recordings with likes.
- **Zen / presentation.** Chrome hidden, a floating glass strip, an optional title card written into the water.
- **About.** The maker's note, with five numbered sections.

---

## CONTENT FUNDAMENTALS
- **Voice.** Calm, warm and unhurried. It invites rather than instructs. The maker speaks as "I" on the About page. The product addresses the listener as "you" ("Play your session when you're ready").
- **Casing.** Sentence case everywhere. Small caps eyebrows (11px, +8% tracking) are the only uppercase. Never use title case.
- **Signature phrasing.** "infinite ambient music / *in your browser.*" and "authored by humans." are lowercase, and the second line is set in the serif italic. Taglines: "Take your time", "Find your vibe", "Let it unfold", "Free · no ads, ever".
- **Labels are nouns from the music world:** Swing, Humanize, Portamento, Note probability, Echo spacing. Range ends get plain-language extents instead of explanations: Straight ↔ Laid back, Lights down ↔ Vivid, Warm ↔ Crisp.
- **Helper copy moves into HelpTips.** The old UI showed paragraphs under every control. Now a small **?** next to the section title holds that text, kept verbatim from source. Panels show one short line per tab at most.
- **Separators.** A middot (·) separates states and summaries ("Off · droplets land freely", "A 20 ms · D 120 ms · S 65%"). An arrow (→) shows progressions ("Cmaj7 → Am7 → Fmaj7 → G"). ↗ means "opens elsewhere".
- **No emoji.** Unicode musical glyphs (½, ⅛, ♫, ≈) are fine where they carry meaning.

## VISUAL FOUNDATIONS
- **Colors.** The chrome is fully neutral: a cool graphite ramp (`--n-0`…`--n-900`, hue ≈255). The **canvas and the voices are the only color.** There is one quiet accent, lilac `--accent #c9bcf5`. It marks focus, the active tab underline, a Switch's on state, and the value you are touching right now. Red `--rec` is used only for recording. Voice palettes (8 × 4 colors, from palettes.js) appear only on voice-specific UI: swatches, step grid rows, palette picker, track dots.
- **Type.** Instrument Sans for UI and display; display sizes use tight tracking (−3 to −4%). Instrument Serif *italic* is for the poetic half of a headline and title cards, and nothing else. Geist Mono, tabular, is for every live number: values, BPM, time, Hz, ms. Body text is 13px. Nothing is smaller than 11px.
- **Spacing.** 4px base, plus a 2px half-step. The rail is 380px with 24px gutters. Sections are separated by a 6% white hairline and 18px of vertical padding.
- **Surfaces.** App → panel → raised → well, separated by small value steps and hairlines. There are no colored borders, no gradients on chrome, and no left-accent cards.
- **Corners.** 4 (steps), 6 (inputs, buttons), 10 (cards, popovers), 16 (dialogs). Only knobs, swatches and transport play buttons are circles.
- **Shadows.** Flat hairline + soft drop. Knob bodies are the one exception: they get a lit top edge and a radial body, the only skeuomorphic touch. Popovers and dialogs use `--shadow-pop` / `--shadow-dialog`.
- **Transparency & blur.** Only for elements floating over the canvas: palette pill, gesture HUD, Zen strip. These use `--bg-glass` + `--blur-glass`. Dialog scrims blur by 6px.
- **Imagery.** Luminous ink ribbons on near-black (assets/*.jpg). They are cool and soft-edged, always masked into the dark with a radial fade, never boxed.
- **Motion.** Fast feedback, slow scene. 90ms for hover/press, 180ms for state changes (`--ease-settle` gives thumbs and knobs a slight overshoot when they return), 320ms for folds and tabs, 700ms for scene fades. Tab underlines slide. Folds animate grid-template-rows.
- **Hover.** Wells lighten one step (`--bg-hover`). Ghost text goes from ink-2 to ink-1. Control tracks brighten. Slider thumbs grow 8%.
- **Press.** Buttons scale to 0.98, icon buttons to 0.94, knob bodies to 0.97 while held.
- **Focus.** A 2px accent ring with a 2px app-colored gap.

### The control model (the heart of the system)
- **Knob** is for continuous *character* parameters: reverb, swirl, attack, glide, tone, intensity. It sweeps 270° with a 2px outer arc, a dot at the default, and a rotating pointer. Sizes are sm 32 / md 44 / lg 64; use at most one lg row per panel.
- **Slider** is for *levels and proportions*: master, probability, pace, energy. It turns vertical as the Mix fader.
- **Segmented** is for 2–7 discrete musical values. **Select** is for long or named lists. **Stepper** is for tempo.
- **One gesture vocabulary everywhere.** Drag is relative (vertical for knobs and steppers, 200px for the full range). **Shift** gives fine control at 1/10 speed without jumping. **Wheel** moves 1% per notch (0.2% with Shift). **Double-click** resets to the default. **Arrows** move 1% (Shift 0.1%), PgUp/PgDn 10%, Home/End. A **value chip** floats above while dragging, and the label's value turns accent.
- **Non-linear tapers** (`skew`) are used for ms and Hz, so the musical range gets most of the travel.
- **Bipolar** knobs fill from 12 o'clock (pan, tone).

## ICONOGRAPHY
- The source app ships an inline SVG sprite of 8 glyphs (drop, play, pause, reset, expand, volume, sliders, spark), drawn on a 24px grid with a 1.5 stroke and round caps. These are copied verbatim into `components/actions/Icon.jsx`.
- **Intentional additions:** stop, record, close, chevrons, plus/minus, arrow-up-right, help, heart, share, download and loop, as simple geometric glyphs in the same style. If you need more, use **Lucide** (same 24px / 1.5–2 stroke) and flag it.
- Unicode is used as typography, not as icons: ↗ for external links, → for progressions, · as a separator, ½ ⅛ for note values.
- No emoji. No icon font.
- **Brand mark:** `assets/flow-mark.svg`, a lilac droplet in a dark rounded square, taken from the repo. In the UI it appears as the droplet glyph in voice-1 lilac next to the wordmark "Flow" in Instrument Sans 500, −3% tracking.

---

## Index
- `styles.css` is the entry point. It only @imports `tokens/*` (fonts, colors, typography, spacing, effects, motion, base).
- `guidelines/` holds the foundation specimen cards (Colors, Type, Spacing, Controls, Brand).
- `components/`
  - `knob/Knob`
  - `slider/Slider`
  - `inputs/` Switch, Segmented, Select, Stepper
  - `actions/` Button, IconButton, Icon
  - `structure/` Tabs, Section, Fold, HelpTip, Dialog
  - `music/` Swatch, StepGrid, EnvelopeGraph, ChordStrip, TrackRow
  - `_loader.js` lets cards and kits load the .jsx sources without a bundler.
- `ui_kits/flow-app/` has `index.html` (live session + all dialogs + Zen) and `about.html`.
- `assets/` holds the mark and social artwork.
- `SKILL.md` is the agent skill entry point.

### Intentional additions
- **StepGrid, EnvelopeGraph, ChordStrip** replace bespoke markup that already exists in the source (beat studio grid, `#arpEnvelope`, `#chords`).
- **HelpTip** exists to hold the helper copy, per the brief.
- **Knob** is new. The source had only range inputs, and the brief asks for knob-first controls.
