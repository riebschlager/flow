# Flow app — UI kit

A redesign of the Flow web app (repo `app/instrument.html` + `public/about.html`), composed from `components/`.

- `index.html` is the live session. Click **Play**, then:
  - Tap the canvas to drop color.
  - Switch rail tabs.
  - Turn knobs and sliders (drag, Shift for fine control, wheel, double-click to reset).
  - Open **Beat studio** (Layers → Percussion → Open beat studio).
  - Press **Record**. When you finish, the Library opens.
  - Open **Community**.
  - Press **Zen view** (Esc exits). In Zen, write a title card.
- `about.html` is the maker's note with five numbered tabs. Its copy is verbatim from source.

Files:
- `TopBar.jsx`
- `Canvas.jsx` (also exports PALETTES)
- `Transport.jsx`
- `ControlRail.jsx` (all five panels; also exports PROGRESSIONS)
- `Dialogs.jsx` (BeatStudio, Library, Community, ZenStrip)
- `App.jsx`
- `AboutPage.jsx`

The fluid canvas is represented by the masked social artwork plus tap ripples. The real canvas is WebGL.
