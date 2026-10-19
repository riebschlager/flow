# 01 · Background continuity

**Goal:** Flow keeps making music when the tab is hidden, the laptop screen is on a different app, or (as far as the web allows) the phone screen is locked. It stops spending CPU on visuals nobody can see.

**Why:** Study, focus and sleep sessions run for hours with the tab in the background. If the music thins out or stops when someone switches to their notes, those use cases don't exist.

## Current state (verify before changing)

These come from reading the code, not from running it in a browser. Confirm each one first.

- **Automatic droplets ("rain") are created inside `tick`** in `public/app.js`: `rainTimer+=dt; … if(autoPour && rainTimer>interval){ drop(...) }`. `tick` runs on `requestAnimationFrame`, which browsers pause in hidden tabs. **Expected result: rain stops in a background tab.**
- **The displayed chord index is also advanced inside `tick`** (`state.chordIndex` from `audio.ctx.currentTime - clockOrigin`). Anything that reads `state.chordIndex` to choose pitches while the tab is hidden may use a stale chord. Check which note paths read it and which compute the chord from the audio clock.
- `serviceDrops` also runs on `setInterval(serviceDrops, 25)`. That's good, but browsers may throttle intervals in hidden tabs (Chrome generally exempts tabs that are playing audio; Safari and Firefox behave differently).
- The rhythm and arpeggio schedulers use `setInterval` with a 120 ms lookahead. If a browser throttles the interval to 1 s, notes will be skipped (the README notes that stalls skip missed notes rather than bursting).
- There is no Wake Lock, no Media Session integration and no `visibilitychange` handling.

Write a short script or test that simulates a hidden tab (no animation frames, timers fired at 1 s intervals) and record what plays. Put your findings at the top of your PR description.

## Requirements

1. **Separate musical time from frames.** Everything that creates notes (rain, chord advance used for pitch, Drift once it exists) must run on a scheduler driven by the audio clock, not by `requestAnimationFrame`. `tick` keeps only visual work.
   - Rain scheduling: compute the next rain time on the audio clock. When it is due, call the same `drop()` path so the sound, quantization and recording are unchanged.
   - Use a lookahead long enough to survive 1 s timer throttling while the tab is hidden, so notes are scheduled ahead on the audio clock. Rhythm and arpeggio are **not** to be rewritten. Only widen their lookahead while hidden, if that is safe, and test it.
   - Visual splashes for drops that landed while hidden should not all play at once on return. Skip stale visuals the way background-tab recovery already does for sessions.
2. **Stop visual work when hidden.** On `document.hidden`, skip `sim.step`, `drawFluid` and `drawOverlay`. On return, resume smoothly without a large `dt` jump (`tick` already clamps `dt` to 0.033).
3. **Screen Wake Lock** (`navigator.wakeLock.request('screen')`) while playing in Zen view, so a watched screen doesn't sleep. Release it on pause, exit Zen or hide. Re-acquire it on `visibilitychange` when visible again. Feature-detect, and fail silently.
4. **Media Session.** Set `navigator.mediaSession.metadata` (title: soundscape name; artist: "Flow"; artwork: `public/icon.svg` or a PNG). Wire `play` and `pause` handlers to `togglePlay`. Keep `playbackState` in sync.
5. **Locked phone screens (investigation, then implementation if it works).** iOS Safari tends to suspend `AudioContext` when the screen locks. Try routing the final output through a `MediaStreamAudioDestinationNode` into an `<audio>` element and playing that, with Media Session set. Test on a real iPhone and Android device and report what happens. If it works, make it the default on coarse-pointer devices. If not, document the limitation in the README and stop. Do not ship a half-working path.

## Non-goals

- Rewriting the rhythm or arpeggio engines.
- Native app wrappers.

## Acceptance criteria

- With automatic droplets on, hiding the tab for 10 minutes and returning shows continuous rain notes in a recorded session (or in a test with fake timers and no animation frames).
- The chord used for pitch selection matches the audio clock while hidden.
- No visual burst on return.
- CPU use in a hidden tab is close to audio-only (no solver steps; verify by counting `sim.step` calls in the test).
- Wake Lock and Media Session work where supported and are silently absent elsewhere.
- Recording and session playback are unchanged (the existing tests pass).

## Human QA checklist (include in your final message)

- Chrome, Safari and Firefox on desktop: play with rain on, switch tabs for 5+ minutes, listen.
- iPhone and Android: lock the screen while playing and report whether sound continues.
- Zen view on a laptop: confirm the screen doesn't dim.
