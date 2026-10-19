# Flow roadmap: one instrument, two postures

This folder holds task briefs for coding agents. Each numbered file is one self-contained workstream. Work them roughly in order. Later briefs assume the earlier ones exist.

## The idea we are protecting

Flow is an ambient instrument. Where you touch decides the note, the color decides the instrument, and an incompressible fluid gives each sound a body. Every change in this roadmap should make that idea stronger. None of it should add a new kind of product.

The strategy: **touch it and you are playing; let go and it plays itself.** Most people will find Flow by playing it (noodling, composing, sharing a clip). Most of the hours will be spent listening (focus, meditation, sleep, background music for content). Both postures use the same canvas, sound and fluid.

### The test for every change

> Does it make Flow better to **watch**, or make touching it feel more **alive**?

If the answer is neither, do not build it. In particular, do not add more instruments, kits, progressions, settings tabs, account features or a separate "sleep app" interface.

### Design principles

1. **Show sound for its whole life.** A note should be visible while it sustains, echoes and decays, not only when it lands.
2. **Calm by default; never startle.** A sudden loud accent or bright flash at 3 a.m. gets the app deleted. All new motion and sound has bounded rates of change.
3. **One energy dial, not twenty switches.** New flourishes scale with a single `energy` value (see [03](03-visible-sound.md)). Avoid adding a separate toggle per effect.
4. **Hide controls; don't delete them.** Power users keep every control. Newcomers see a canvas.
5. **Cheap on battery.** Passive sessions last hours. Do no rendering work when no one can see it.

## Workstreams

| # | Brief | What it delivers | Size |
|---|---|---|---|
| 01 | [Background continuity](01-background-continuity.md) | Sound keeps going in hidden tabs; Wake Lock; Media Session; no rendering when hidden | S |
| 02 | [Drift and timers](02-drift.md) | Autopilot performer with long-period variation, sleep timer, breath pacing | L |
| 03 | [Visible sound](03-visible-sound.md) | Echo ripples, note halos, reverb haze, flow-carried light motes, the energy dial | M |
| 04 | [First run and intents](04-first-run.md) | Full-bleed first impression; Play / Focus / Unwind / Sleep intents; panel hidden by default | M |
| 05 | [Titles and exports](05-titles-and-exports.md) | Text written in dye; postcard video export; long audio renders | M |
| 06 | [Fluid feedback](06-fluid-feedback.md) | The fluid shapes the music: density-driven arpeggio dynamics, collision shimmer | M |
| 07 | [Multi-touch](07-multitouch.md) | Each finger its own voice; pinch to Gather | M |
| 08 | [GPU renderer](08-gpu-renderer.md) | WebGL display path: bloom, refraction, thin-film shimmer; the CPU solver is unchanged | L |

Recommended order: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08. Workstream 01 is a prerequisite for the focus and sleep use cases. Workstreams 03 and 06 can run in parallel with 02 once 01 lands.

## Orientation for agents

Read this section before touching code.

### Where things live

- `app/instrument.html` is the instrument's markup. `public/*.js` are plain browser ES modules with no bundler step for the instrument itself. `public/style.css` holds all instrument styles.
- `public/app.js` is the hub. It owns `state`, the `tick(now)` animation loop, `drop()`, `serviceDrops()` (also run on a 25 ms `setInterval`), `drawFluid`, `drawOverlay`, `toggleZen` and persistence.
- `public/fluid.js` is the `Fluid` solver. Fields: `u`, `v` (velocity), `r`, `g`, `b` (dye), `curl`, `p`, `div` and others, all `Float32Array` of size `w*h`. Key methods: `splat(x, y, color, size, dx, dy)`, `step(dt)`, `clear()`, `resize(w, h)`. Coordinates passed to `splat` are normalized 0–1.
- `public/fluid-renderer.js` maps dye to palette colors (`createFluidColorizer`, `renderFluidPixels`).
- `public/music.js` contains `AmbientAudio`: the melodic graph (`bus`, `droplets`, `dry`, `wet`, `verb`, `echo`, `feedback`, `echoWet`, `gestureVerb`, `gestureEcho`, `sceneFilter`, `sceneGain`, `sceneInput`, `limiter`, `master`), plus instruments, progressions, soundscapes and `parseChord`.
- `public/output.js` contains the output stage (makeup gain, limiter).
- `public/rhythm.js` and `public/arpeggiator.js` are audio-clock schedulers. They default to `setInterval` timers with a 120 ms lookahead.
- `public/chord-atmosphere.js` controls chord-driven lighting and currents. `public/orbit-rings.js` and `public/percussion-visuals.js` are small visual modules and good templates for new ones.
- `public/gestures.js` and `public/performance.js` handle the gesture vocabulary (Paint, Silk, Rush, Gather → Bloom, Orbit, Conduct, Space).
- `public/recorder-*.js`, `public/session-player.js` and `public/recording-state.js` handle session capture, playback and validation. `app/api/` and `db/` hold the Community backend.

### Conventions

- **Match the existing code style.** Modules are dense: long lines, short names, arrow functions, few comments. A comment explains *why*, never *what*. New code should look like it was always there.
- **Cache-busting revisions.** Imports carry a `?rev=<name>-<n>` query (for example `palettes.js?rev=gestures-32`). When you change a module, bump the revision on every import of it, in both `app/instrument.html` and the importing modules, using a new name for your workstream (for example `?rev=drift-41`). Use one revision name per workstream.
- **Settings persistence.** Each feature area stores settings in `localStorage` under its own versioned key (`chromaflow-rhythm-v1`, `chromaflow-arp-v1`, `chromaflow-environment-v1`, `chromaflow-expression-v1`). New areas follow the same pattern and must have a `normalize*` function that tolerates missing or garbage input. Wrap every storage access in try/catch.
- **Sessions and recordings.** Anything that *produces sound* must go through the existing production synth paths so the recorder captures the emitted notes. Purely visual effects that can be derived from recorded events (for example echo ripples derived from drop events plus delay settings) should be derived again during playback rather than recorded. If you add a setting that changes sound, it must appear in session snapshots and timed settings automation, the server validators (`recording-state.js` and the `app/api` canonicalizer), and fork handling. Older sessions must default to the previous behavior.
- **Reduced motion.** Respect `prefers-reduced-motion` the way `ChordAtmosphere` does: keep color and opacity changes, drop drift, expansion and added currents.
- **No new runtime dependencies** for the instrument unless a brief explicitly allows one.
- **Docs.** Add one short section to the root `README.md` per workstream: what it does, how to use it, what is persisted. Keep it short. The README is already long.

### Checks

- Run `for test_file in checks/*.test.mjs; do node "$test_file" || exit 1; done` and `npx tsc --noEmit`. Both must pass.
- Tests are plain Node scripts using `node:assert/strict` with hand-rolled fakes for the canvas context, DOM and audio (see `checks/orbit-rings.test.mjs` for a small example and `checks/app-smoke.test.mjs` for the whole-app harness). New modules get a matching `checks/<module>.test.mjs`.
- `checks/performance-equivalence.test.mjs` compares the solver and renderer bit for bit against frozen references in `checks/reference/`. **Do not change solver output.** New visuals belong in the overlay layer or in a new rendering path, not inside `Fluid.step`. If a brief needs new solver forces, apply them through the existing public methods (`splat`) or a separate function, the way `atmosphere.stir(sim, dt)` and `stirPercussion` already do.
- **Visual and listening QA.** Previous work could not be checked in a browser. For every workstream, finish with a short "please look at / listen for" list for the human in your final message, and do not claim a visual or audio result you have not observed.

### Definition of done for any brief

- All acceptance criteria in the brief are met.
- Tests and `tsc` pass. New logic has unit tests.
- Recording, playback, fork and Community round trips still work, and older sessions keep their old behavior.
- Reduced-motion and the energy dial (once it exists) are respected.
- A root README section is added, and a human QA checklist is in the final message.
