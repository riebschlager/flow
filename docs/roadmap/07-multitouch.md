# 07 · Multi-touch

**Goal:** On tablets and phones, each finger plays its own voice. Pinching performs Gather, and spreading releases a Bloom. Flow becomes an instrument you play with your hands, not a canvas you poke.

**Why:** Phones and tablets are where most noodling happens. Today, additional pointers are ignored (the README states "Additional pointers are ignored"), so a second finger does nothing.

## Current state

- `GestureTracker` in `public/gestures.js` and `createPerformanceController` in `public/performance.js` handle a single active pointer with pointer capture, cancellation, focus loss and reset.
- Gesture recognition picks a tool per gesture (Paint, Silk, Rush, Gather → Bloom, Orbit, Conduct, Space).

Read both modules thoroughly before designing. The single-pointer assumption may be spread across several places.

## Requirements

1. **Per-pointer tracking.** Track up to 5 simultaneous pointers by `pointerId`. Each pointer gets its own `GestureTracker` instance (or equivalent state) so that each finger can independently Paint, Silk or Rush. Mouse and pen behavior must not change.
2. **Pitch and color per finger.** Horizontal position still picks the pitch and height still shapes warmth and length. Color follows the current color mode (locked, or Cycle colors, where each new finger takes the next color in the cycle, which is a natural way to play chords).
3. **Pinch → Gather, spread → Bloom.** When exactly two pointers move toward each other past a threshold, cancel their individual strokes (without a release accent) and run Gather at their midpoint, with the charge following pinch progress. Spreading apart past a threshold, or lifting both fingers after a pinch, releases a Bloom, with four chord tones as today.
4. **Two-finger Conduct (optional).** Two fingers moving together vertically could drive Conduct (scene filter). Only implement this if it doesn't conflict with pinch detection. Document the decision either way.
5. **Polyphony safety.** With five fingers painting, the note rate must stay within the existing polyphony limit (64 voices, oldest stolen). Add a per-finger rate limit so that dense multi-finger painting doesn't steal voices every frame.
6. **Browser gestures.** Set `touch-action: none` on the canvas (check whether it is already set) and prevent page zoom from the pinch. The rest of the page must keep normal zoom for accessibility.
7. **Recording.** Multi-pointer gestures produce the same note, gesture and visual events as single-pointer ones, so the session format shouldn't need changes. If the recorded gesture events assume a single pointer (for example one active tool at a time), extend them in a backward-compatible way and update the validators.

## Non-goals

- More than 5 pointers.
- MPE or MIDI controller support.

## Acceptance criteria

- Tests with synthetic pointer events: two independent strokes produce two independent note streams. A pinch produces Gather at the midpoint and no accidental stroke notes. Spreading produces a Bloom. Cancel, blur or reset on any pointer cleans up only that pointer, and reset cleans up all of them.
- Single-pointer and mouse behavior are unchanged (all existing gesture tests pass).
- Note rate under five-finger painting stays within the stated limit.

## Human QA checklist

- iPad: play chords with three fingers. Does it feel like an instrument?
- Pinch and release: is the Bloom satisfying? Is pinch ever triggered by accident while painting with two fingers?
- Phone: does the page ever zoom or scroll while playing?
