# 02 · Drift, sleep timer and breath pacing

**Goal:** When nobody is touching the canvas, Flow plays itself, beautifully and without repeating, for hours. The listener can set it to fade out and stop, or to breathe at a meditation pace.

**Why:** This is what makes the passive contexts (focus, meditation, sleep, installations, second-monitor ambience) possible. Without it, Flow is only for noodling. Drift is the "let go and it plays itself" half of the strategy.

**Depends on:** [01](01-background-continuity.md). Drift must create notes from an audio-clock scheduler, not from animation frames.

## Concept

Drift is a gentle generative performer that uses **only the existing gesture vocabulary**: taps, Silk strokes, occasional Blooms, rare Orbits, and Conduct sweeps of the scene filter. Its actions are fed through the same code paths a human uses, so sound, visuals, quantization, color mode and recording all just work.

Drift is **not** a separate mode with its own interface. It is a behavior: it takes over after idle time and backs off the moment someone touches the canvas.

## Requirements

### Drift performer (`public/drift.js`, new)

1. **Activation.**
   - A Drift switch, default **on**, persisted under `chromaflow-drift-v1`. Put it in Perform, beside Automatic droplets.
   - After `idleSeconds` without pointer or keyboard input on the canvas (default 20 s; 4 s when Zen view was entered with no recent input), Drift fades in over about 8 s by ramping its density from zero.
   - Any canvas input immediately stops new Drift actions. Actions already in flight finish naturally. Drift resumes after the idle timeout.
   - Drift is suspended during session playback and recording arming (respect `recorder.blocked` and `recorder.arming`, the same way rain does).
2. **Actions.** Drift emits a weighted stream of actions on the audio clock:
   - *Tap* (most common): a single `drop()` at a chosen position.
   - *Silk stroke*: a slow multi-point path. Use the same functions pointer painting uses so it creates Silk expression. Read `public/performance.js` and `public/gestures.js` to find the right entry point; you may need to factor out a function that accepts synthetic points.
   - *Bloom* (rare, at most about once per 60–90 s at default energy).
   - *Orbit* (rarer still).
   - *Conduct sweep*: a slow filter close and open over a phrase.
   Choose action positions with musical intent: favor chord tones that have not sounded recently (horizontal position picks the pitch), vary height (which controls warmth and length), and leave silence. Rests are as important as notes.
3. **Long-period variation.** Over 20–60 minute arcs, Drift slowly changes:
   - **Density**, following a smooth random walk with a hard maximum rate of change.
   - **Register**, by biasing positions left or right over minutes.
   - **Progression**, by choosing the next progression from a *related* set (shared key or common tones) at a phrase boundary, at most every 8–15 minutes. This is opt-in with a "Wander harmony" switch, default on when Drift is on. It must not change the user's saved progression permanently. Store Drift's current pick in state and restore the user's choice when Drift ends or the user touches the progression control.
   - **Voices**: optional, off by default. Explicit voice choices belong to the user.
4. **Determinism for tests.** Drift takes an injectable `random` and clock (same pattern as `ArpEngine` and `RhythmEngine`).
5. **Safety limits.**
   - Maximum notes per second.
   - Maximum Bloom frequency.
   - Density can change by at most a fixed amount per minute.
   - No action may raise the scene loudness suddenly. Accent-like actions (Rush) are excluded entirely.

### Sleep timer

1. Options: Off, 15, 30, 45, 60, 90 minutes. Reachable from Zen view (see [04](04-first-run.md)) and from Perform.
2. During the final 3–5 minutes Drift thins out, reverb opens slightly, the master fades out with an exponential ramp, and the canvas dims to near-black. Then the transport pauses and Wake Lock is released.
3. Touching the canvas during the fade cancels the timer, with a small visible confirmation (no sound).
4. Not recorded in sessions.

### Breath pacing

1. An optional Drift style: **Breathe**. Patterns: 4-4 (calm), 4-7-8 and box breathing (4-4-4-4).
2. Inhale is Gather: an inward pull with the charging ring and reverb building, using the existing Gather visuals and sound. Exhale is Bloom: release and outward wave. Holds are stillness.
3. Breath timing follows its own clock, not the musical tempo. Bloom tones still come from the current chord.
4. A subtle, optional on-canvas cue (the existing ring) is enough. No text counters.

## Interaction with recording

Drift actions go through `drop()` and the gesture paths, so a recorded session captures the resulting notes and visuals. Drift itself must **not** run during session playback. Add a test showing that recording while Drift plays produces a valid, replayable session.

## Non-goals

- Machine-learned composition, or any network calls.
- A separate meditation interface, guided voice or text instructions.

## Acceptance criteria

- With a seeded random source, 60 simulated minutes of Drift produce a note stream that stays within the rate limits, has measurable density variation and has no single 30-second window repeated exactly.
- Touching the canvas stops new Drift actions within one scheduler tick.
- The sleep timer fades to silence and pauses, with no clicks (exponential ramps, no abrupt gain steps), and touching cancels it.
- Breath pacing timing is accurate to within 50 ms over 10 minutes on the audio clock.
- Wander harmony never permanently overwrites the user's saved progression.
- All existing tests pass. New tests cover the scheduler, limits, activation, timer and breath timing.

## Human QA checklist

- Let Drift run for an hour with headphones on: does it stay interesting without demanding attention? Does anything startle?
- Is the 20 s idle timeout right? Too eager or too shy?
- Breath mode: does the visual pacing feel calming or mechanical?
