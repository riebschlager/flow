# 03 · Visible sound and the energy dial

**Goal:** Every sound is visible for its whole life: its attack, sustain, echoes and reverb tail. Fluid motion is readable even where dye has blended into one flat color. All of it scales with a single **energy** dial, so the same flourishes suit both a lively noodle session and a dark bedroom.

**Why:** Today a note appears as dye plus a ripple at the moment it lands, then the picture forgets it. What a viewer hears and what they see drift apart within a second. Closing that gap is the single cheapest way to make Flow delightful to watch.

## Current state

- `drawOverlay(dt, t)` in `public/app.js` draws on the `fx` 2D context: drifting `dust` particles (positions animated with sine wobble, **not** carried by the fluid), falling droplets with radial halos, `ripples` and `glows` arrays pushed in `impact`, plus the rhythm, arpeggio and performance overlays.
- The delay time is tempo-synced. See `public/timing.js` (`delaySeconds`) and the `echo`, `feedback` and `echoWet` nodes in `AmbientAudio`.
- Per-note envelopes are known when each note is scheduled (instrument envelopes in `music.js`; expression from `noteExpression` and `shapeExpression` in `gestures.js`).

## Requirements

### A. The energy dial

1. One setting, `energy`, 0–100, default 60, persisted with Scene settings and included in session snapshots (visual only, so older sessions default to 60).
2. Location: Scene tab, top. Also reachable in Zen view (see [04](04-first-run.md)).
3. Expose a single function, for example `energyScale(kind)`, that returns multipliers for opacity, count and motion per effect kind. Every effect in this brief, and later visual briefs, reads from it. Energy 0 means "lights down": only the dye field, dimmed. Energy 100 is the most vivid setting, but still calm.
4. Energy never changes sound. (Drift may read it as a density hint; that's a separate decision in [02](02-drift.md).)

### B. Echo ripples

1. For each melodic impact, schedule fainter ripples at the same position at each delay repeat: `t0 + k * delaySeconds(...)`, for k = 1, 2, … while the repeat gain `delay * feedback^k` stays above a small threshold. Ripple opacity follows that gain.
2. Use the *current* delay amount, feedback and timing, and keep them correct when tempo changes (repeats already in flight may keep their original spacing; that matches what you hear).
3. Gesture echoes (Orbit and Space temporary sends) also produce ripples, using the gesture echo parameters.
4. Visual only. During session playback, derive them again from the recorded impact events and settings automation. Do not record them.

### C. Note halos

1. At each impact point, draw a soft glow whose brightness follows that note's amplitude envelope (attack, sustain and release, from the parameters the note was scheduled with), in the voice's palette color. A pad visibly swells; a pluck flashes and fades.
2. The halo is carried by the fluid: sample `sim.u` and `sim.v` at its position each frame and move it gently, so it travels with its dye.
3. Bound the work: at most N live halos (for example 48). Merge or drop the oldest.

### D. Reverb haze

1. As effective reverb wetness rises (base reverb plus gesture room), apply a very soft, slowly decaying, full-canvas luminous haze over the dye, tinted by the chord atmosphere color.
2. Its decay time roughly matches the reverb tail. A Bloom with high reverb leaves a visible afterglow that fades as the tail fades.
3. Implement it as an overlay pass, not a change to `renderFluidPixels`. Renderer byte-equality tests must keep passing.

### E. Flow motes (replacing or upgrading `dust`)

1. A sparse field of small points of light (desktop around 300–600, phones around 150–250, scaled by energy). Each frame, advect each mote through the fluid by bilinearly sampling `sim.u` and `sim.v`. Respawn motes that leave the canvas or go stale.
2. Brightness follows local speed slightly, so currents become visible. Motes in dense dye take on that dye's palette color.
3. On percussion hits, motes near the hit's canvas position flare briefly (reuse the hit positions from `percussion-visuals.js` and `rhythmUI`).
4. Small motion trails at high energy only.
5. Reduced motion: motes are static (no advection) and only fade, or are hidden. Pick one and document it.
6. Performance: one bilinear sample per mote per frame. No allocations per frame. Measure and report the per-frame cost on the desktop and phone grid sizes using the existing benchmark style (`checks/benchmark-performance.mjs`).

### F. Harmonic light bands (optional, low energy cost)

1. Faint vertical bands at the canvas x-positions that map to the current chord's tones (use `pitchesForRange` and `pitchForPosition` in `music.js`), drawn very subtly near the bottom edge.
2. On a chord change the bands slide to their new positions over the chord atmosphere's crossfade time.
3. Off below energy 30. Hidden during Drift's Breathe style.

## Non-goals

- Changing solver behavior or adding forces (except existing stirs).
- New settings beyond `energy` (and at most a single "Harmonic bands" switch if that feature needs one).

## Acceptance criteria

- Echo ripple times match the scheduled delay repeats within one frame, including after a tempo change.
- A halo's brightness curve correlates with the note's scheduled envelope (unit test that samples the curve).
- Motes are advected correctly: in a test with a uniform velocity field, a mote moves at the expected rate. Motes respawn, and their count stays bounded.
- Energy 0 hides all new effects. Energy changes take effect immediately with no visible pop (fade over about 300 ms).
- Fluid and renderer equivalence tests pass unchanged. Overlay work per frame stays within a stated budget on the benchmark grids.
- Session playback shows the same derived ripples and halos as the live performance.

## Human QA checklist

- With delay high, do the echo ripples read as "that's the echo I'm hearing"?
- Pad vs. pluck: can you tell instruments apart by their halos alone?
- Energy at 10 in a dark room: calm enough to sleep beside?
- Motes on a phone: smooth frame rate? Do they make the current readable?
