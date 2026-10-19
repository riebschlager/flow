# 06 · Fluid feedback: let the ink play back

**Goal:** The fluid influences the music, not only the other way round. The music grows out of what the ink is doing, so it never sounds canned, especially during Drift.

**Why:** Today sound creates dye, and dye only moves. Closing the loop makes Flow feel alive: when you stop touching it, the piece keeps composing itself as the ink settles. It also gives Drift's long sessions variety that a random generator can't fake.

**Risk:** This is the most experimental brief. Everything in it must be subtle, bounded and easy to turn off. A single switch, **Fluid listens**, default on after QA approval (ship default **off** until the project owner listens and approves).

## Signals available

- `sim.r`, `sim.g` and `sim.b` (dye density per color basis), `sim.u` and `sim.v` (velocity), `sim.curl` (vorticity, computed during `step`).
- All are `Float32Array` with size `sim.w * sim.h`. Read them, never write them, in this brief.
- Build a small analysis function `analyzeFluid(sim, regions)` in a new module `public/fluid-listen.js` that returns, for each requested region (column band or point neighborhood): mean density per color slot, mean speed and mean absolute curl. Run it at most every 100 ms, not every frame, and allocate nothing per call. It must keep running when the tab is hidden only if the solver is running. Since [01](01-background-continuity.md) stops the solver when hidden, feedback simply holds its last values while hidden.

## Behaviors

Implement A and B. C is optional.

### A. Density shapes the arpeggio

- Each arpeggio note's x-position is known (see the pulse positions in `public/arpeggiator-ui.js`). Read the dye density in a column band at that position.
- Map it to velocity (±20% at most) and filter cutoff (gentle). Dense ink means fuller and warmer; empty water means quieter and airier.
- Map local speed to a small timing push (at most ±10 ms) for a breathing feel. Only apply this when quantize is off.
- Apply it when the note is **scheduled** (lookahead), using the most recent analysis.
- The resulting notes go through the existing arpeggio path, so the recorder captures the actual played velocity, and playback reproduces it without the fluid. No session format change for the notes; the switch itself is a new setting (see "Sessions" below).

### B. Collision shimmer

- When strong curl and high density of **two different color slots** coincide in a region (colors meeting and mixing), occasionally sound a very quiet, high, sustained harmonic of the current chord (a chord tone two octaves up, or a fifth), using the arpeggiator's voice or a soft voice from the current palette.
- Hard limits: at most one shimmer per 4 s, gain well below a normal droplet, a slow attack (≥ 400 ms), and no shimmer while the user is actively painting (it's for the settling phase).
- Its visual: a faint iridescent ring at the region (hook into [03](03-visible-sound.md)'s overlay and energy dial).
- Shimmers are emitted through the production synth wrappers, so the recorder captures them as notes.

### C. Optional: stillness resolves

- When overall fluid speed falls below a threshold for 10+ s after activity, gently encourage resolution: Drift (if on) favors the chord root and longer notes for the next phrase. This is a hint passed to Drift, not a direct note.

## Sessions

- Add `fluidListens: boolean` to the settings snapshot and timed settings automation. Older sessions default to `false`.
- Playback does **not** run the analysis: everything audible was recorded as notes. Keep it that way; it is what makes playback deterministic.
- Update the server canonicalizer and validators for the new field.

## Acceptance criteria

- `analyzeFluid` is tested on synthetic fields (uniform, a single blob, a vortex), returns the correct band statistics and allocates nothing per call (reuse buffers).
- Arpeggio velocity and filter changes stay within the stated bounds for any input field.
- Shimmer rate limits hold under adversarial fields (curl everywhere).
- With the switch off, note output is identical to the current behavior (test against the arpeggio engine with the same seed).
- Sessions recorded with the switch on play back identically without running analysis.

## Human QA checklist

- With Fluid listens on vs. off, play the same idea for five minutes each. Does "on" feel more alive, or just random?
- Let it settle after a busy passage: do the shimmers feel like the water singing, or like a glitch?
- Is anything ever too loud or too frequent?
