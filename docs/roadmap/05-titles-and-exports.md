# 05 · Titles in dye and shareable exports

**Goal:** People can share what they make. A track's title can be written in dye and dissolved by the current. A performance can be exported as a short video clip with sound, sized for social posts, or as a long audio render for use under someone's own content.

**Why:** Clips are how other people discover Flow. Long renders serve creators who want background music. Both turn usage into sharing without changing the instrument.

## Part A · Text written in dye

1. A function `writeInDye(sim, text, {font, x, y, size, color})` in a new module `public/dye-text.js`:
   - Rasterize the text into an offscreen canvas at the solver's grid resolution (`sim.w × sim.h`), with a slightly blurred alpha.
   - Add dye into `sim.r`, `sim.g`, `sim.b` from the alpha mask, using the palette color's dye basis (see `canonicalDyes` and `createDyeMapper` in `palettes.js`) and respecting the same shared density cap `splat` uses. You may add a `Fluid.prototype` method or a standalone function, **but the existing `splat` and `step` output must not change**.
   - No velocity is added. The existing currents and chord atmosphere dissolve it naturally.
2. Uses:
   - **Community playback:** when a shared track starts, write its title (and the artist name smaller, beneath it) into the opening canvas, centered, then let it dissolve. A setting to turn it off is not required.
   - **Present mode:** an optional "title card" field in the Zen control strip (see [04](04-first-run.md)) that writes custom text on demand.
   - **End card** for exported clips (Part B).
3. Respect the mobile grid budget. Text must stay legible at the phone grid size; set a minimum size and wrap long titles to two lines.
4. Recording: a title written live is a visual event. Record it as a visual action with its text so playback reproduces it. Add this action type to the session validators and the server canonicalizer, with a length limit and the same text gates used for public titles when shared.

## Part B · Postcard video export

1. In Record / Library, add **Export clip** for a version-2 session: renders 15 s (also offer 30 s and 60 s) of session playback to video with audio.
2. Implementation: `canvas.captureStream(30)` from a compositing canvas that draws the fluid and overlay layers together, plus audio from a `MediaStreamAudioDestinationNode` tapped after the master output stage. Combine them into one `MediaStream` and record with `MediaRecorder`. Prefer `video/mp4` where supported (Safari, recent Chrome); fall back to `video/webm`. Name the file after the session title.
3. Aspect options: 9:16 (vertical), 1:1 and 16:9. Render the composited frame at the chosen aspect by cropping or letterboxing the canvas. Do **not** resize the solver mid-session for the export.
4. End card: the last 2 s write "Flow" plus the track title in dye (Part A). Keep it subtle.
5. Like WAV export, it runs in real time and can be cancelled. Show progress on the audio clock. Local only; nothing is uploaded.

## Part C · Long audio renders

1. Extend WAV export with "Render for N minutes" (5, 15, 30, 60): plays the session loop repeatedly, or, with Drift (see [02](02-drift.md)), lets Drift play live from the session's opening setup, and captures the master output to a WAV file using the existing capture worklet.
2. Memory: 60 minutes of 16-bit stereo audio at 48 kHz is about 690 MB. Stream the WAV in chunks (for example, collect `Blob` parts every few seconds and assemble the file at the end) instead of holding one big buffer. If that isn't feasible in all browsers, cap the length per browser and say so in the UI.
3. Fades: 3 s fade-in, 6 s fade-out.

## Part D · Usage note for creators

Add a short, plain-language "Using your music" note to `public/about.html`. **Do not write any licensing claims yourself.** Draft the text, list exactly which licenses apply (GPL-3.0 code; WebAudioFont GPL-3.0; WebAudioFontData notice; FluidR3 MIT) and flag the draft for the project owner to review before publishing.

## Non-goals

- Uploading video to Community or any third-party platform.
- Server-side rendering.

## Acceptance criteria

- `writeInDye` produces legible text at desktop and phone grid sizes (test by rasterizing and checking dye coverage inside and outside the glyph mask) and doesn't change `splat` or `step` reference outputs.
- Community playback writes the title once at the start of each loop's first cycle (not every loop).
- Clip export produces a playable file with audio in Chrome and Safari. The test can cover the pipeline with fakes; the human verifies the real file.
- Long renders don't exceed a stated memory ceiling.

## Human QA checklist

- Does the dissolving title look beautiful or gimmicky? Is the timing right?
- Export a 9:16 clip and post it privately to your phone: does it look and sound right?
- Render 30 minutes: does it play cleanly in a standard audio player?
- Review the "Using your music" draft.
