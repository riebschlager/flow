# 04 · First run, intents and present mode

**Goal:** A newcomer sees a full-bleed canvas, and their first touch is beautiful within ten seconds. With one tap they can tell Flow what they're here for (Play, Focus, Unwind, Sleep), and Flow sets sensible defaults. Zen view becomes a proper present mode.

**Why:** The first ten seconds decide whether someone stays. A five-tab control panel on first load reads as "complicated tool," and that is where the concept gets diluted. The controls are still valuable; they just shouldn't be the first impression.

**Depends on:** [02](02-drift.md) (Drift, sleep timer) and [03](03-visible-sound.md) (energy dial).

## Current state

- `app/instrument.html` has an `#intro` overlay and a **Begin listening** button (`#playLabel`). Audio cannot start before a user gesture.
- The panel is visible by default on desktop. `body.panel-hidden` hides it; `togglePanel()` toggles it.
- `toggleZen()` toggles `body.zen`, which hides the top bar, panel, transport, footer and canvas header (see `public/style.css`). Escape exits.

## Requirements

### First run

1. On first visit (no stored settings), the panel is hidden and the canvas fills the window. A minimal top bar shows only: the Flow name, an intent picker, a "Controls" toggle and the Begin button.
2. Before audio starts, the canvas is already alive: a slow, silent fluid scene with motes and a little dye, so the page is never a black rectangle.
3. **The first touch starts audio.** A tap anywhere on the canvas counts as the required user gesture: it starts the AudioContext and plays that drop. The explicit Begin button stays for keyboard and screen reader users. Make sure the first note isn't lost while instruments load. Preload the default soundscape's voices on first pointer down, and if a note arrives before its voice is ready, either delay the drop's landing until it is (the quantize landing machinery can help) or play it when ready. Never drop it silently.
4. Returning users get their saved layout, including panel visibility.

### Intents

1. Four intents: **Play**, **Focus**, **Unwind**, **Sleep**. Each one is just a bundle of defaults:

   | Intent | Soundscape (suggestion) | Energy | Drift | Rain | Timer | Notes |
   |---|---|---|---|---|---|---|
   | Play | current/default | 70 | on, 20 s idle | off | off | panel reachable |
   | Focus | a steady, low-contrast soundscape | 45 | on, long idle, lower density | light | off | no Blooms above a low rate |
   | Unwind | a warm, spacious soundscape | 35 | on, Breathe style available | off | off | |
   | Sleep | the darkest, softest soundscape | 10 | on, very low density | off | 45 min | master a little lower |

   Pick the soundscapes from the existing nine by listening to them, and justify each choice in the PR. Do not create new soundscapes.
2. Choosing an intent applies its defaults **without** overwriting the user's custom voices or progressions. Store it as an overlay: the intent's values apply; if the user changes a control afterwards, their change wins and is saved as usual. Persist the selected intent under `chromaflow-intent-v1`.
3. Changing intent mid-performance crossfades the relevant parameters over a few seconds. Nothing jumps.

### Present mode (upgraded Zen view)

1. Entering Zen view hides the cursor after 3 s of stillness and shows a soft **performer's light trail** following the pointer while it moves or paints, so an audience can see the gesture behind each sound. Scale it with energy; turn it off with energy 0.
2. A minimal auto-hiding control strip appears at the bottom edge on mouse movement or tap: play/pause, energy, intent, sleep timer and exit. It disappears after 3 s of no movement. Fully keyboard accessible.
3. Request fullscreen on entry (`requestFullscreen`), where allowed. Exiting fullscreen exits Zen view.
4. Acquire Wake Lock on entry (see [01](01-background-continuity.md)).

## Non-goals

- Removing any existing control.
- A tutorial, coach marks or modal walkthrough. The canvas should teach by responding.

## Acceptance criteria

- First load with empty storage: panel hidden, live silent scene, first canvas tap produces sound from that tap (verified in the app smoke harness by checking the drop is played once the voice resolves).
- Intent defaults apply without overwriting user-chosen voices or progressions (test).
- Intent changes ramp parameters smoothly (no immediate value jumps on audio params).
- Zen control strip auto-hides and is keyboard reachable. Escape still exits.
- Existing users' settings and layout are untouched after upgrade.

## Human QA checklist

- Open in a private window: what do you see in the first second? Does the first tap feel instant?
- Try each intent for five minutes. Does each feel like what it claims?
- Present mode on a projector or TV: is the light trail legible from across a room?
