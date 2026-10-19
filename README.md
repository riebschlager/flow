# Flow

Created by [Chris Riebschlager](https://the816.com).

An ambient instrument combining an incompressible fluid solver and WebAudioFont sampled instruments, with browser-local recording and an optional shared community library. The original HTML/CSS/ES-module instrument is preserved in `app/instrument.html` and `public/`; Vinext serves it alongside a Worker API backed by Sites-managed D1 and R2.

Install with the Sites dependency helper (or `npm run install:ci` standalone), generate schema changes with `npm run db:generate`, and build with the Sites build helper (or `npm run build` standalone). `dist/` is generated output. For local development, use the Sites preview workflow or `npm run dev` standalone; apply generated SQL migrations to local D1 before using Community. Audio starts only after pressing Begin listening. Click or drag to drop color, choose voices and progressions in the panel, or enable automatic rain. Selecting a palette swatch (or pressing 1–4) locks all new painting, rain, and bloom droplets to that color and voice. Enable Cycle colors beside the palette to shuffle all four colors and voices: each appears once per random round, with no consecutive repeats between rounds. This applies to painting, rain, and blooms. The color mode and selected color are remembered. The horizontal impact location selects a chord tone and color chooses the instrument. Space toggles sound, 1–4 selects color, Enter drops when the canvas is focused, and Escape exits Zen view.

Controls include four editable chord slots (via a comma-separated progression), tempo, chord length, 28 instruments assigned to four colors, nine soundscape collections, reverb, tempo-synchronized delay, master volume, independent droplets level, vorticity, color persistence, droplet size, color cycling, and rain density. Settings persist in localStorage.

The solver uses semi-Lagrangian advection, pressure projection (20 Gauss-Seidel iterations), and vorticity confinement. The grid follows the canvas aspect ratio with approximately square cells. Desktop uses at most 35,000 cells and coarse-pointer/narrow devices use at most 16,128; the longer side is capped at 384/224 cells respectively. Canvas2D renders the dye field plus impact ripples and falling droplets. Audio uses locally bundled WebAudioFont with FluidR3 samples, a filtered feedback delay and a stereo convolution impulse generated in the browser.

Flow source is licensed under GPL-3.0. WebAudioFont is by Sergey Surikov under GPL-3.0; WebAudioFontData has its included notice; FluidR3 GM is by Frank Wen under its included MIT notice. The [GitHub repository](https://github.com/riebschlager/flow) contains all runtime code and sample files. External Google Fonts are optional; system fonts work offline.

The 12 added voices focus on soft attacks: slow strings, synth strings, choir aahs, voice oohs, flute, pan flute, ocarina, and new age, choir, bowed, halo, and sweep pads. Their custom WebAudioFont envelopes swell over 180–750 ms, sustain gently, and release over 1–1.7 seconds. Existing voices retain their original envelopes. The menu groups voices by family, and Soft horizon and Breathing room showcase the new palette. Instruments are loaded and decoded only when selected.

## Workspace navigation

The UI audit found that Sound had grown into a long stack of harmony, voices, arpeggio, atmosphere and effects; Perform mixed controls with a long guide; layer levels and shared echo settings were scattered. The workspace now separates five tasks:

| Tab | Controls |
| --- | --- |
| Sound | Soundscape, progression, chord length and an expandable four-color voice editor. |
| Layers | Arpeggiator, percussion and atmospherics, each with a visible switch, status and expandable editor. |
| Perform | Canvas tool, quantize, pitch/touch range, expression settings, automatic droplets, bloom and the gesture guide. |
| Scene | Color palette, fluid behavior, chord glow, color guidance and percussion visual response. |
| Mix | Master level, droplets/arpeggio/percussion/atmosphere levels, shared echo spacing, melodic effects and drum effects. |

The panel keeps its navigation visible on desktop while controls scroll independently. Desktop destinations retain their scroll positions during the session; mobile navigation sticks above the controls. Tabs support Left/Right and Home/End. Optional layer editors begin compact and open when that layer is enabled by its switch. Color voices, pitch settings, gesture instructions, note shape and portamento use native keyboard-accessible disclosures. The canvas’s How to perform button opens the gesture guide directly. Space on a focused button, link or disclosure retains its native interaction rather than also toggling the audio transport.

Mix consolidates the sidebar’s two duplicate shared-echo selectors into one; Beat studio retains its contextual synchronized selector. The existing independent effect sends and all audio timing are unchanged. Automatic droplets now belongs to Perform and is named separately from the synthesized Soft rain environment. Record / Library, Community, transport, the session format, storage keys, defaults, synthesis and fluid algorithms are unchanged. The audit retained every parameter and its bounds; only a redundant sidebar selector was removed.

Structural checks cover unique IDs, label and ARIA references, valid nesting, and preserved control values/ranges/defaults. The full app smoke test exercises navigation, focus, scrolling, disclosures and the existing recording/playback/fork workflow. Full browser interaction and visual QA were unavailable in this environment.

## Orbit ring motion

Orbit’s three ellipses fade into view over a few tenths of a second and fade away at their last pose when the gesture ends or recognition switches to another tool. Rotation follows a short exponential ease on an unwrapped heading, so crossing −π/π no longer flips the rings. The smoothing uses elapsed time, works during recorded playback and is local to the visualization; musical expression, fluid forces and session data are unchanged. Conduct and Space keep their existing visuals. Checks cover onset/release opacity, angle wrapping, live controller dismissal and frame-rate independence. Browser visual QA was unavailable.

## Performance audit (version 39)

The audit profiled the solver, palette raster, animation loop, instrument loading, audio scheduling and playback resource lifetimes. Pressure projection remains the largest solver cost; its 20 iterations and all fluid equations, grid budgets, DPR, colors, effects, note envelopes and scheduler intervals are preserved.

- Velocity components now share one advection backtrace, and the three dye channels share another. Existing scratch arrays hold the previous dye values, with no extra solver allocations. Interpolation arithmetic, Float32 rounding and boundary order match version 38 exactly.
- Larger rasters cache exact Float64 spatial lighting phases and integer neighbor offsets between resizes. The cache is weakly keyed to the simulation, replaces itself after resize and uses about 0.53 MiB at the measured desktop grid. Phone-sized grids retain the original compact renderer and allocate no geometry cache. Color mapping, Gaussian reconstruction and lighting math are unchanged.
- The canvas vignette is built on resize rather than every frame. Empty droplet queues skip clock/key work; recorder status/time text changes only when its content changes. Animation cadence, counters and progress motion are unchanged.
- Completed sampled notes detach their abort hooks, while preserving filter/panner cleanup and recorded cancellation behavior. Session stop retires WebAudioFont envelopes belonging to the discarded arpeggio bus. The 64-voice policy still selects the same oldest voice, using a single scan instead of an allocated filter/sort.
- Deterministic atmosphere sample buffers are shared lazily per AudioContext across live and session engines (at most five preset pairs). Voice sources, gain automation, crossfades and phase remain independent. Disposing one player does not invalidate another player's buffers. Existing instruments were already loaded/decoded lazily and cached; audio scheduling remains on its existing audio clock with the same lookahead and stall recovery.

A paired Node CPU benchmark alternates the version-38 reference and current implementations, with warmup and nine median batches of 24 frames. Representative results from this environment:

| CPU operation | Grid | Before | After |
| --- | --- | --- | --- |
| Fluid step | 241 × 144 | 8.15 ms | 7.52 ms |
| Palette raster | 241 × 144 | 2.78 ms | 2.22 ms |
| Fluid step | 111 × 145 | 3.99 ms | 3.76 ms |

These are CPU microbenchmarks, not browser/device FPS claims. Run `node checks/benchmark-performance.mjs` to repeat them; timings vary with the machine and load. Twelve warm atmosphere preparations dropped from 767 ms total to 0.34 ms in a separate native-audio check. First use still synthesizes the exact original bed.

Regression checks compare 176 fluid frames bit for bit and 80 palette renders byte for byte against frozen version-38 references, including turbulent splats/forces, settings changes, resize, clear and both renderer paths. A native 24 kHz stereo render using actual WebAudioFont samples, arpeggio notes, synthesized drums, effects and atmosphere had zero PCM difference from version 38. Its completed-note abort-hook count fell from 24 to zero. Lifecycle stress tests cover 500 note completions and 100 discarded arpeggio buses; the full musical/session/community suite and TypeScript checks pass. Browser profiling, device FPS, native Canvas visual QA and subjective listening were unavailable in this environment.

## Output level and dynamics

Fresh setups start at 70% master (previously 55%). The master now maps directly to 0–100% gain, removing the old hidden 0.65 multiplier. A calibrated +4.1 dB makeup stage follows scene expression, then a fast peak compressor and an emergency sample guard before the final master. All droplets, arpeggio, percussion, atmospherics, effects and gestures pass through this output path. It is fixed gain compensation, not automatic gain riding: quiet passages, natural decays, layer balance and Conduct gestures remain expressive.

Explicit browser and session master values, including zero, are retained. Existing 55% setups benefit from the corrected output path without silently changing their stored slider. Live performance, session/community playback and new local WAV exports use the same master mapping and protected signal. Older PCM takes keep their already-rendered audio.

Native offline measurements used actual WebAudioFont samples and the production effect graph across five representative soundscapes, a dense four-layer stress mix and a muted mix. Typical examples moved from roughly −29…−26 LUFS into roughly −18…−15 LUFS; this is calibration evidence, not a guarantee that every performance has identical loudness. Checks also cover finite bounded peaks, master mute, independent layer routing and timed session automation. Browser listening/visual QA was unavailable.

## Droplets mix

Mix → Layer levels includes a 0–100% Droplets mix slider for painting, automatic droplets and blooms. A dedicated smoothed input gain feeds the shared melodic effects; arpeggio, percussion and atmospherics retain their independent levels. Turning droplets down also reduces their new reverb/delay sends, while existing shared effect tails fade naturally. Visual droplets continue at zero volume. Master still controls the entire composition.

The level persists locally and in opening snapshots, recorded settings automation, session file roundtrips, forks, community uploads/playback and WAV exports. Playback schedules changes on the audio clock, restores the opening level at each loop, and cancels queued automation on stop. Older sessions default to 100%, preserving their original balance; no format or database migration is needed.

## Canvas aspect and responsive simulation

The old solver grid stayed at a fixed landscape ratio even when mobile CSS made the canvas portrait. Stretching that raster to fill the canvas distorted splats and currents. Resize previously changed only the output backing buffers.

The solver now follows the actual canvas CSS bounds (excluding the container border), with near-square cells and bounded desktop/mobile work budgets. Coarse-pointer devices keep the mobile budget in landscape too. Both drawing canvases use the same DPR-scaled backing dimensions, with exact per-axis transforms for fractional CSS sizes. Hidden/zero-size transitions are ignored. A small aspect hysteresis avoids resampling on every one-pixel browser-toolbar change.

Resizing preserves the existing solver object, bilinearly resamples its dye and velocities, scales velocity components to preserve normalized motion, and rebuilds the offscreen ink raster and scratch fields. It does not reset the canvas or musical transport. Saved-session opening fields use the same smooth resampling and velocity mapping; existing file dimensions remain valid. Palette rendering and sound behavior are unchanged.

Checks cover portrait/landscape phones, desktop, full-screen shapes, fractional DPR, circular splat geometry, cell/workload limits, preserved pigment ratios and dye position, velocity units, stable post-resize stepping and legacy opening scenes. The complete app test exercises ResizeObserver-driven raster/backing-buffer updates and the existing record/playback/fork bridge. Browser/device visual QA was unavailable in this environment.

## Optional synthesized atmospherics

Layers → Atmospherics adds an independent environmental bed, off by default. Soft rain combines a noise curtain with scattered patter; Tidal shore uses slow surf and foam; Canopy wind adds broad gusts and rustling leaves; Summer night layers quiet air and irregular insect chirps; Hearth combines low fire and small crackles. Mix controls overall level, Activity blends in close-up details, and Tone moves a low-pass filter from warm to crisp. The textures suggest environments rather than reproduce field recordings.

All five are generated locally from seeded stereo noise, filtered motion and short procedural grains. No recordings, remote assets, new samples or dependencies are used. Each preset has separate base/detail buffers, generated only when needed and cached for reuse; initial session textures are prepared before the transport clock starts. Twelve-second native audio loops have smoothed joins. Texture changes and session boundaries use equal-power fades; rapid edits have bounded source counts. Live playback resumes at the composition position. Disabling, muting, pausing and stopping release the bed; one-shot playback fades it at the musical end while the composition’s effects can trail off.

The layer feeds the existing scene input, shared limiter and master. Whole-scene Conduct, Orbit, Space and Gather affect it, including shared rhythmic gesture echoes, without changing the instrument or percussion effect amounts. Atmospherics has its own mix and tone; the existing voice reverb/delay controls continue to address the voices. Its controls persist under `chromaflow-environment-v1`.

Session snapshots and settings automation contain only enabled state, preset, mix, activity and tone. Playback rebuilds the same seeded textures, seeks their phase after background-tab recovery and crossfades back to the opening atmosphere on every session loop. Browser saves, exported session files, Community shares and forks carry these settings; local WAV export renders the audio. Older sessions default to atmospherics off. The server clamps values, permits only known presets and discards unsupported media fields. No database migration is required.

Validation covers deterministic, bounded stereo buffers; distinct profiles and periodic joins; audio-clock source offsets and crossfades; mix/activity/tone and transport cleanup; actual app capture/playback/fork behavior; and Community roundtrips without embedded audio. Native offline Web Audio renders verify audible output for every preset, detail/tone dynamics, rapid switching, loop joins and disable/stop silence. Full browser interaction and subjective listening QA were unavailable in this environment.

## Optional percussion

Layers → Percussion adds an optional four-lane, sixteen-step beat studio. Choose among warm kick, soft sub, soft snare, rim click, dusty clap, closed hat, shaker, low tom, muted conga, and wood block. Each voice can be muted, given an independent level, or set to No voice. Step buttons cycle off → ghost → hit → accent; arrow keys move through the steps. Ocean pulse, Half-time dust, Broken current, Handwoven, and Euclidean drift provide starting patterns. New variation works on the whole beat or a single lane. A lane's hit-count field generates an evenly distributed Euclidean pattern; Rotate shifts it one step. Pattern changes preserve voice choices.

Percussion follows the shared tempo at half, normal, or double speed, with swing, timing/velocity humanization, and its own mix. The Web Audio clock schedules sounds in advance, while animation consumes the corresponding timed hit events. Pausing or disabling percussion stops its scheduler and sources. The chord transport also follows the audio clock. Percussion has independent 0–100% reverb and delay amounts, with 21 shared echo spacings from a 1/64 note to two bars, including straight, dotted, and triplet intervals for voices and percussion. The spacing follows effective percussion tempo, including half/double rhythm speed. Change Shared echo spacing in Mix or Beat studio; both selectors mirror the saved setting. Delay buffers support the full range up to 32 seconds at the slowest tempo and half speed. Recordings, shared sessions, and restored setups retain every spacing. Voice and drum delay amounts remain independent. Its own convolver reuses the shared impulse buffer, and its own filtered feedback delay is separate from melodic effects. Dry and wet paths pass through the percussion mix control, shared limiter, and master volume, so zero mix and disabling percussion also mute effect tails. All twenty percussion voices are synthesized locally with Web Audio; they require no extra sample downloads.

Each rhythm voice sends a pulse from its own place in the canvas. Choose ripples, fluid stirring, or both, and set their strength independently from sound. Stirring now drives broad counter-rotating rolls for kicks and toms, sweeping currents for snares, claps, and clicks, and tighter eddies for hats and shakers. These stronger, wider impulses survive pressure projection and move existing dye without adding colors or triggering melodic notes. Hit velocity still shapes each impulse; the upper end of Visual strength adds extra drive. Larger double ripple rings mirror the stronger fluid motion. Percussion impulses cap local velocity at 180 grid cells/second to keep dense patterns stable. Color locking therefore continues to govern all melodic droplets. Percussion settings are saved separately in localStorage under `chromaflow-rhythm-v1`; it is off by default and never starts sound before the scene is played.

Both melodic and percussion delay lines use the same timing function and transition speed. Delay capacity covers the slowest half-time quarter-note setting (four seconds at 30 BPM). Timing remains shared when percussion is switched off.

## Expressive canvas and gesture audit

The Perform tab has an expression switch (default on), intensity (default 65%), a Canvas tool selector, a guide, and live filter/reverb/echo readouts. Paint is the default. Conduct, Space and Orbit are available as explicit tools for mouse, trackpad, touch and pen. Choose a mouse shortcut before beginning a drag: right-button or Shift-left-drag selects Conduct; Alt/Option-left-drag selects Space. A canvas-only context-menu handler enables right-button performance while expression is on. Pointer capture, cancellation, focus loss and reset all end the active gesture cleanly. Additional pointers are ignored.

The audit found that the previous Orbit pan was narrow, its filter changes happened mostly above the melodic bus’s existing low-pass cutoff, and its small fluid pulse was easy to miss. Gather had no audible action until release. Slow/fast painting modified new notes but left the ongoing arrangement mostly unchanged. The revised gestures give each action a distinct role:

| Action | Sound | Visual response |
| --- | --- | --- |
| Touch | Height changes warmth, weight and length; horizontal position chooses chord pitch and per-note pan. | A palette-colored droplet with depth-dependent size and impulse. |
| Slow paint / Silk | Soft attacks, quieter long notes and a lower per-note filter. | Broad lingering ribbons and smooth directional currents. |
| Rush / flick | Quicker attacks, shorter brighter notes; release adds one crisp final accent. | Stronger jets, thicker fast trails and an outward spark. |
| Hold / Gather → Bloom | Reverb builds around the playing composition before release. Release resolves four current-chord tones, rather than relying on four nearby canvas positions to happen to choose different notes. | Inward pull, a charging ring, then a broad outward wave and three expanding rings. |
| Circle / Orbit tool | Wide whole-mix stereo motion plus temporary rhythmic echoes and room. Explicit Orbit is available without automatic circle recognition. | Larger paired whirlpools and rotating concentric traces. |
| Right-drag / Shift-drag / Conduct tool | Down closes the whole mix’s low-pass filter; up opens it. Horizontal position pans the mix. Ordinary vertical painting retains the previous Conduct mapping. | Broad hand-following currents, a moving horizontal guide and orbiting outlines. |
| Alt/Option-drag / Space tool | Up increases whole-scene reverb; right increases echoes at the shared percussion division. Bottom-left returns sends to zero. | Wide rings and broad slow eddies. |

Whole-scene gestures controls the shared filter, pan and temporary effects; switching it off retains per-note expression and visual gestures. Conduct, Space and explicit Orbit do not create droplets or notes. Releasing a gesture returns the shared parameters toward neutral smoothly. The temporary room/echo sends do not overwrite the saved instrument/drum effect amounts. All melodic voices, arpeggio and percussion feed a common pre-limiter input; the new convolver and filtered feedback delay return through that limiter. Gesture delay follows the same BPM, rhythm-speed multiplier and echo division as the existing voices and percussion. Feedback remains bounded at 0.42.

Per-note attack overrides fit inside the note envelope, scale with gesture intensity and are captured with resolved pitches, duration, velocity, filter and pan. Notes remain bounded at nine seconds and existing polyphony management remains active. Fluid forces are bounded; the gesture overlay uses the selected palette with source-over blending. Arrow keys move the virtual canvas cursor, Enter taps, and Shift+Enter blooms. Let the scene settle resets the transient performance parameters. Gesture settings persist under the compatible `chromaflow-expression-v1` key.

Recording captures the selected tool, temporary room/echo/filter/pan automation, note articulation, and fluid/gesture visuals. The player schedules sends and delay timing on the audio clock, including loop boundaries, background-tab recovery and local WAV export. Older sessions default to Paint with zero added performance sends. The server validates these fields and strips unsupported properties before storing shared JSON sessions.

Validation includes all 28 voice-envelope profiles, mouse/modifier/touch tools, no accidental painting in control modes, sound-before-release Gather, four-tone Bloom, reset/blur/cancel behavior, shared delay timing, actual audio-node routing, community roundtrips and the real app recording/playback bridge. Native offline Web Audio renders verified audible Conduct attenuation, stereo energy movement, reverb/echo tails on melodic and percussion paths, and distinct Silk/Rush attack and tail behavior using the bundled Grand piano, New age pad and Slow strings samples. Full browser interaction/visual QA was unavailable in this environment.

## Quantized droplets

The Perform tab has an optional Quantize switch and Landing grid selector: quarter, eighth (default), sixteenth, thirty-second, or eighth-note triplet. Every droplet source shares this setting, including painting, rain, blooms, and keyboard. The fall stretches to the first grid line at or after its natural arrival, so the splash and note share one landing time. This changes note onset, not sustain. It follows effective percussion tempo (including half/double speed) on a straight grid; swing and humanize remain drum settings. With percussion off it follows the composition clock, and silent visual play still uses the tempo. It is off by default; the switch and division persist with composition settings.

Quantized notes are scheduled ahead on the Web Audio clock, with the visual splash consumed at that same time. Tempo, rhythm-speed, grid, and transport changes replan pending droplets while preserving their visible progress; clearing or removing pending droplets cancels their scheduled audio. A resumed background tab skips missed grid points without releasing a burst of late notes.

## Horizontal octave range

Perform → Pitch & touch offers Octaves below and Octaves above, independently from 0–3. These add lower/higher copies of the current chord around its base register, which is always included. The default is 0 below and 1 above, matching the original two-register canvas. A live note-range preview follows chord and selected color changes; in Cycle colors mode it shows the base range. Coral retains its one-octave-lower voicing. Setting both values to zero confines the canvas to the base chord.

The horizontal note pool is sorted and deduplicated so extended chords also ascend smoothly. All melodic sources share the range: taps, strokes, rain, blooms, keyboard, and quantized notes. Changing the range cancels/replaces future scheduled notes while preserving already sounding notes. Settings are saved with the composition; drum voices and patterns are unchanged.

## Single-voice arpeggiator

Layers → Arpeggiator adds an optional, separately chosen WebAudioFont voice. Patterns: ascending, descending, up/down, down/up, outside-in, or shuffled random with no consecutive repeats. Choose 1–16 notes in the pool; chord tones expand upward from the base register to fill it. This independent pool does not change the canvas octave range or color voices. The note chips preview the pool and highlight timed notes, while neutral ripples trace their positions in the scene without adding dye or extra melodic droplets.

Whole, half, quarter, eighth, sixteenth, thirty-second, and eighth-triplet rates follow the shared audio clock and effective percussion speed. The chord is computed at each scheduled note time, including progression boundaries; patterns restart on each chord. An independent Arpeggio mix controls its bus before the shared melodic reverb/delay and master effects. Per-note envelopes scale to the rhythmic spacing for bounded polyphony. Starting playback preloads the enabled voice. Pausing, disabling, or changing voice cancels pending notes; live timing/pattern/pool edits replace future events. Stalls skip missed notes rather than bursting them. Clear canvas clears the visual traces; transport and the arpeggiator continue. Settings persist under `chromaflow-arp-v1`, with the feature off by default.

### Arpeggio note probability

Note probability is the chance each grid step plays: 100% (the default, including older sessions) plays all steps, 50% plays roughly half and 0% rests. A skipped step still advances the selected pitch pattern and shared rhythm clock; it does not consume a voice or create a note ripple. The preview clears its current-note highlight on rests. Probability uses a separate random stream from random pitch ordering, so changing density does not change that pattern’s random choices. Portamento connects the notes actually scheduled, without using skipped pitches.

Live changes apply to steps not yet scheduled by the 120 ms lookahead, with no pattern or transport reset; sounding notes and effect tails continue. Probability persists in browser settings and session snapshots/automation, including forks and community files. Recordings retain the actual played-note events and visual rest events, so loop playback and WAV export reproduce the same result without rolling probability again.

## Visual chord atmosphere

Every chord has a repeatable atmosphere based on its root and quality: a soft color cast, broad light source, brightness, and direction of slow current. Chord transitions crossfade over a few seconds with a feathered bloom rather than text or hard flashes. Major/minor/suspended qualities shape the mood; natural progression changes, manual chord jumps, and custom progression edits use the same transition. Pausing holds the current harmony and stops its added currents.

Fluid → Chord atmosphere → Harmonic glow sets the effect from 0–100% (default 65%) and persists with the composition. Zero restores the original lighting and stops this added motion. Lighting does not change the solver's dye or palette assignments; the current only moves existing dye. Percussion, gestures, note timing, and sound are independent. Reduced-motion preferences retain color crossfades while disabling atmospheric currents, drift, and expanding blooms.

## Experimental soundscapes

Four additional soundscapes keep the existing five intact:

- Glass organisms: Crystal bloom, Prism rain, Bowed pad, Halo pad; reverb 86%, delay 63%.
- Submerged cinema: Distant soundtrack, Deep atmosphere, Choir pad, Slow strings; reverb 91%, delay 32%.
- Strange attractor: Alien chorus, Orbital signal, Sweep pad, Synth strings; reverb 75%, delay 57%.
- Orbital relay: Echo fragments, Prismatic air, New age pad, Voice oohs; reverb 72%, delay 84%.

Eight new FluidR3 GM FX voices (programs 96–103, zero-based) are bundled locally with the existing notices, under Experimental textures in both color-voice and arpeggiator menus. They have individual soft envelopes and gentle low-pass or band-pass sweeps, applied per note before its envelope. Gesture tone changes scale the sweep, and arpeggiated notes shorten it to their note length. Temporary nodes disconnect when notes end. Selecting a soundscape changes its four voices and reverb/delay amounts; shared rhythmic spacing, progression, percussion, arpeggiator, and canvas settings stay as set. Samples load only when selected.

## New age pad balance

New age pad keeps its existing sample and voice key, with a lower gain (0.075, previously 0.22), a slower 0.75-second swell, a shorter 3.8-second natural note, and a 1.15-second release. A gentle low-pass sweep from 2.8 kHz to 1.7 kHz reduces its upper-frequency presence. This avoids the earlier sustained dominance and reduces overlap in dense performances, including Orbital relay. The same adjustment applies when the voice is assigned manually or used in the arpeggiator. Existing saved voice assignments remain valid.

## Arpeggio note shape

Layers → Arpeggiator → Note shape exposes four independent controls with a live amplitude-envelope preview:

- Note length: 10–400% of one rate step; above 100% allows overlap. Actual note duration is bounded to 20 ms–8 s.
- Attack: 0–2000 ms to rise to peak level.
- Decay: 0–2000 ms to settle from peak to the sustain level.
- Sustain: 0–100% held amplitude, rather than a time setting.

Attack and decay proportionally fit the available duration when necessary; the caption shows their actual timings. A short automatic release ends each note smoothly, and very short ramps avoid clicks. Defaults are 85% length, 20 ms attack, 120 ms decay, and 65% sustain. Old saved arpeggios gain these defaults; all four controls persist in the existing arpeggio settings. Tempo/rhythm-speed changes update the preview and total duration. Shape edits affect newly scheduled notes without resetting the melodic pattern; already sounding notes finish their envelopes. The custom amplitude envelope is per note and retains each voice's gain, tone sweep, stereo, and shared effects. Canvas/drop envelopes are unchanged.

## Arpeggio portamento

Layers → Arpeggiator → Portamento adds optional pitch glide, off by default. Glide time is 0–2000 ms (default 180 ms); glide amount is 0–100% (default 100%). A full-interval glide starts each note at the previous arpeggio pitch, then reaches the current chord tone. Smaller amounts start closer to the target. The first note after starting or changing voice begins at its own pitch. Zero time or amount bypasses bending.

Glides use exponential playback-rate ramps for even movement in semitones, keeping the selected WebAudioFont sample zone, note envelope, voice balance, stereo position, and shared effects. Effective time fits before the automatic release; the caption shows actual milliseconds and updates with note length, tempo, rate, and percussion speed. Notes retain their rhythmic onset and may overlap according to Note length. Natural chord changes carry the previous pitch into the next chord. Live glide edits affect newly scheduled notes without restarting the pattern. Timing/pattern replans use the last started pitch, never a cancelled future note; stop/voice changes clear that history. Settings persist with the existing arpeggio configuration, and older settings migrate to glide off.

## Additional harmonic palettes

Eight original four-chord loops are available under New · Ambient & exploratory in Sound → Chord progression. A short caption explains the harmonic character and suggests an existing soundscape and 8/16-beat chord length; these are listening suggestions, not automatic setting changes. All original progressions and saved selections remain available. The new loops persist through the existing progression setting and feed droplets, quantized impacts, the arpeggiator, octave mapping, and chord atmosphere.

| Loop | Chords | Approach |
| --- | --- | --- |
| Still light | Dbmaj9 → Fm7 → Bbm9 → Gbmaj9 | Warm ninths and shared tones, with a soft return to the beginning. |
| Tidal glass | Dsus2 → Aadd9 → Gmaj7 → Esus4 | Open, suspended harmony; the last chord leaves a little air in the loop. |
| Blue hour | Dm9 → G9 → Cmaj9 → Am9 | A jazz-rooted ii–V–I–vi turnaround, softened with ninths. |
| Dorian bloom | Dm9 → G6 → Em7 → G6 | Minor warmth with a bright Dorian sixth, circling without a strong cadence. |
| Velvet undertow | Am9 → Fmaj9 → Dm9 → Em7 | A darker minor loop with warm extensions and a gentle pull back home. |
| Borrowed light | Cmaj9 → Em7 → Fmaj9 → Fm6 | A borrowed minor-IV chord brings a wistful turn before the loop opens again. |
| Chromatic orbit | Cmaj9 → Abmaj9 → Emaj9 → Abmaj9 | Parallel major ninths travel through distant keys. Expect deliberate tension in long echoes. |
| Slow descent | Fmaj9 → Em7 → Dm9 → C6 | A falling IV–iii–ii–I bass outline, settling into an open major-sixth color. |

The chord parser now accepts maj9, m9, dominant 9, major 6 and minor 6 in presets and custom loops, in addition to the previous vocabulary. Ninths use the actual 14-semitone extension above the root. The same MIDI range bounds and deduplicated ascending pools still apply. No automatic inversion or voice-leading engine is added: these are chord-tone pools for the generative performance, with shared pitch classes chosen to soften most transitions. Chromatic orbit intentionally makes a more unsettled alternative.

Design references (the loops are our own compositions, not endorsements by the authors):
- Ableton / Dennis DeSantis, Parallel Harmony: https://makingmusic.ableton.com/parallel-harmony — common-tone connections and parallel chord movement in electronic music.
- Native Instruments / Dean Salant, How to use authentic lo-fi chord progressions: https://blog.native-instruments.com/lo-fi-chord-progressions/ — cyclical harmony, unresolved loops, seventh/ninth extensions.
- Native Instruments, How to add depth to your music with textures and patterns: https://blog.native-instruments.com/depth-in-music/ — extended harmony in a slow ambient production.

## Expanded rhythm library and percussion kits

Rhythm and Beat studio now each offer independently synced groove and kit selectors. A kit replaces the four lane voices and levels; it preserves steps, rotations, mute states, mix, swing, humanize, tempo/rhythm speed, effects, visual settings, and transport phase. Manual voice/level edits label the kit Your own kit. Pattern edits label the groove Your own beat while preserving the kit. Kits include suggested grooves in their captions; suggestions never apply themselves. Settings persist under the existing rhythm key. Older beats keep all their voices, steps, levels and effects, and migrate to Your own kit unless they already carry a matching kit key.

Eight kit choices:

| Kit | Four voices |
| --- | --- |
| Shoreline | Warm kick · Rim click · Closed hat · Shaker |
| Velvet room | Soft sub · Soft snare · Shaker · Felt mallet |
| Glass garden | Soft sub · Glass tap · Pebble tick · Bottle ping |
| Paper machine | Muted synth pulse · Paper brush · Metal seed · Breath puff |
| Woodland | Low tom · Muted conga · Wood block · Thumb pluck |
| Rain objects | Water plip · Pebble tick · Paper brush · Glass tap |
| Orbital clock | Muted synth pulse · Metal seed · Closed hat · Bottle ping |
| Soft ceremony | Soft sub · Rim click · Breath puff · Felt mallet |

Eight new sixteen-step grooves join the original five: Still point (sparse), Velvet pocket (ghost-note backbeat), Skipping stones (two-step-inspired syncopation), Threefold tide (3–3–2 eighth-note accents within 4/4), Lantern steps (light four-on-the-floor and offbeats), Interlocking reeds (alternating replies), Slow orbit (open half-time backbeat), and Fractured rain (quiet clustered details). Humanize and swing still use the shared clock; patterns never silently change those values. Grid steps now cycle off → ghost (0.3) → hit (0.65) → accent (1), with distinct visual states and accessible state labels. Existing fractional velocities remain intact until edited.

Ten added object-like voices use short oscillator/noise envelopes, not recordings or extra sample files: Felt mallet, Glass tap, Water plip, Thumb pluck, Bottle ping, Muted synth pulse, Paper brush, Pebble tick, Metal seed and Breath puff. The six Tuned objects derive a stable chord degree/octave from the chord at the scheduled hit time, so lookahead across progression boundaries uses the arriving chord. Pitched partials and brief plip sweeps provide color; inharmonic pebble/metal and filtered paper/breath add untuned texture. They use the existing independent percussion delay/reverb, mix, master processing and stop path. Nodes disconnect when each hit ends. They drive the existing visual pulse system; low pulses produce broad rolls, glass/water/paper/metal tight eddies, and mallets/pebbles/breath lateral sweeps. No new dye or melodic droplets are generated.

Production references informing our own patterns and synthesis:
- Ableton / Matt Ridgway, Making Music with Found Sounds: https://www.ableton.com/en/classroom/support/making-music-found-sounds/ — unconventional sources as drum-kit material. Our object-like sounds are synthesized rather than field recordings.
- Native Instruments, How to make MIDI drums sound realistic: https://blog.native-instruments.com/midi-drums/ — ghost notes, accents, timing and velocity variation.
- Native Instruments, Behind the beats: https://blog.native-instruments.com/behind-the-beats/ — human feel and unusual textures in beat production.

## Visual palettes

In Fluid → Color palette, choose Original glow, Aurora, Desert dusk, Tidal blue, Ember, Botanical, Afterglow or Porcelain. The four-color preview and descriptions make the choices visible. A palette updates the existing fluid, droplets, voice swatches and labels, gesture marks, percussion rings and arpeggio accents; the harmonic glow blends into the chosen colors. Color lock and shuffled non-repeating cycling retain the same four voice slots. Changing palettes does not clear or disturb the simulation, restart music, or change instruments.

The solver and session visual events retain their original dye basis. The renderer interprets dye chromaticity inside the four-color palette polygon, projects outlying mixtures onto its nearest edge, and blends supported palette colors without extrapolating negative channels. All eight palettes use their original display-ready swatches, including their intended pastel or muted saturation. The selected palette is saved locally and in the opening session, captured in timed settings changes, validated by the server, and retained by setup forks. Older sessions without a palette use Original glow. Existing short gesture trails fade naturally during a switch; chord lighting eases over roughly one second.

## Palette-faithful fluid rendering

`public/fluid-renderer.js` blends the palette’s original sRGB swatches directly. It does not apply gamma darkening, a saturation floor, channel normalization, a neutral-color hue bias, or RGB tint multiplication. Dye density controls bounded coverage over the dark canvas; lighting and highlights scale brightness gently, without adding white or changing the swatch’s saturation. This prevents both dense RGB washout and the neon hue shifts introduced by the preceding renderer. Mixed areas interpolate between palette colors; muted and pastel palettes retain their intended character.

A one-cell Gaussian reconstruction filters dye before color conversion, with smooth canvas upscaling afterward. This softens visible grid boundaries without changing the solver resolution, velocities or saved fields. New splats use a shared RGB density cap instead of three independent caps, preserving a locked color’s proportions when many droplets land in the same place. The chord atmosphere retains its brightness/motion behavior and uses restrained soft-light compositing to limit hue shifts.

Existing local and community sessions use the updated display automatically. No session migration or new setting is needed. Tests check all 32 swatches against their actual RGB/saturation, bounded dense/mixed rendering, stable neutral mixtures, locked-color hue at the density cap, smooth grid reconstruction, unchanged uniform color and unmodified rendering inputs. Numerical before/after image comparisons were inspected against visible palette swatches; full browser visual QA was unavailable in the current environment.

## Playable session loops

Use Record / Library to capture a session loop. New `.chromaflow` files use `format: chromaflow-session`, version 2, encoded as UTF-8 JSON. They contain no audio buffers, samples, embedded media or PCM. They store loop duration and musical beat counts, the opening composition settings and fluid field, and timed musical/visual/settings events. The instrument samples remain bundled application assets, referenced by supported voice names.

Choose 1–16 progression cycles or a manual recording ending at the next four-beat bar. Both modes begin on chord one and track musical beats through tempo changes independently of chord jumps. The maximum loop length is ten minutes. Record your performance normally, including color/voice changes, gestures, rain, rhythm pattern/kit edits, octave ranges, arpeggio shape/glide/rate changes, tempo, effects and fluid controls. Recording needs only the audio clock; it does not create an AudioWorklet or capture master audio.

The production synth wrappers capture actual emitted melodic and arpeggio notes, resolved pitches, expression, envelope and note length, portamento and level variation, plus percussion voice, pitch, velocity and humanized hit times. Future notes cancelled by editing are removed; cancellations after onset become note/drum release events. Settings, gestures and fluid/drop/percussion/arpeggio visual actions have independent timestamps. This retains the notes selected by random generators without needing to rerun those generators during playback.

Play loop preloads the session’s referenced voices and uses a 25 ms scheduler with 120 ms of audio-clock lookahead. It schedules stored notes and drums through the native WebAudioFont and percussion engines, with timed mix, delay, reverb, arpeggiator bus and whole-scene expression automation. Each repeat uses the original loop duration without adding an effect tail or silence. Reverb/delay continue running through boundaries. Fluid motion continues evolving while replaying the recorded actions. The app suspends live rain/note/drum/arpeggio generators during playback to prevent duplicate sound. Background-tab recovery skips stale musical/visual actions and resumes the current loop phase instead of bursting old events.

Save session file downloads the data-only `.chromaflow` file. Load session file validates it and saves an independent browser copy. Load opening setup restores its settings and canvas for a new live performance. Stop playback returns to the preceding live setup and local library selection. Sessions use the existing IndexedDB database and atomic metadata/data transactions. Storage failure retains the current session in memory for downloading. Local session files can be up to 24 MiB, with 80,000 total events and 500 events in one second.

Export loop WAV is an explicit, local-only audio render. It plays one cycle through the synth in real time, captures the master mix and its half-second tail with AudioWorklet, and downloads a stereo 16-bit WAV. The export progress follows the audio clock and can be cancelled using Cancel audio export. The tail is blended into the opening over 80 ms while preserving the exact cycle length. Audio rendering requests no microphone permission and sends no audio to the backend. AudioWorklet is needed only for WAV export, not session recording or playback.

Compatibility: previous version-1 `CFLOOP01` files and existing browser takes still import, play from their stored PCM and export WAV locally. Their 0–500 ms seam blend remains available. They are identified as Legacy audio takes and cannot be shared as new community sessions, because those earlier files did not capture a complete musical event stream. Record a new session to share the performance data. No existing browser recordings are deleted or silently approximated.

## Forking a track

While listening, choose Fork track beside Stop playback. It is also available in the local library and on Community track cards. Forking creates an independent browser-local setup draft with a fresh ID and a title ending in “— fork”. It copies the original opening instruments, chord progression, effects, tempo, percussion kit and patterns, arpeggiator, expression/fluid/color/rain settings, and opening canvas. Transport resets to chord one. All recorded notes, drum hits, gestures, fluid actions, releases and timed setting changes are removed; any legacy PCM is omitted. The original track is unchanged. Forking uses the opening setup rather than the current moment’s automation.

The fork’s setup is loaded for editing and its name fills the recorder. Close the library to adjust the controls and perform, then record your version. A completed recording updates that same fork draft, instead of creating an additional draft or changing the source track. Setup-only drafts can be renamed, downloaded and imported; use Edit fork setup to return to one later. Playback, WAV export and publication become available once a new performance has been recorded. Forking itself needs no sign-in and does not publish anything. If browser storage is full, the new draft remains available in memory for downloading.

## Shared community library

Community offers Today, This week, All time, New discoveries and My shared tracks. Anyone can open, follow a track link and play a session’s notes with its opening canvas and settings/visual automation. Save copy creates an independent IndexedDB copy. Publication and likes require Sign in with ChatGPT; browsing and listening remain public. Artist names and titles are entered separately from account identity, and emails are never returned by the API. Creators can remove their public tracks without changing browser originals.

Sharing requires selecting a version-2 session, entering a public artist name and title, and checking explicit public-sharing consent. The upload endpoint accepts bounded `application/json` session data only, up to 8 MiB. It rejects older audio formats, malformed notes/envelopes/timing/actions and embedded-media fields. It canonicalizes the settings and every supported event payload, strips unknown nested/event fields, and replaces the file’s name, ID and creation timestamp with moderated/server-owned values. R2 stores only canonical JSON under `sessions/<uuid>.chromaflow`; the database stores metadata, owner IDs and timestamped likes. A failed database insert deletes the uploaded object.

`.openai/hosting.json` keeps Sites-managed D1 `DB` and R2 `BUCKET`. The existing Drizzle migration creates tracks, likes and atomic write-limit counters. No new schema migration is needed for session storage. Same-origin authenticated writes protect publication, votes and owner removal. Quotas remain four upload attempts per account/hour, fifty active shared tracks, sixty vote actions/minute and twenty removals/minute. Public artist names (2–40 characters) and titles (2–80) pass Unicode/diacritic/confusable/leet normalization and basic English profanity, slur and abusive-phrase checks. Hidden characters, markup and links are rejected. These are basic deterministic text gates, not comprehensive semantic or multilingual moderation. Public UI metadata is escaped.

Each person has one active like per track, enforced by the database primary key. Unlike removes its contribution; re-liking preserves its original date. Today counts active likes received since midnight UTC; This week covers the preceding seven days; All time counts all active likes. Ties use lifetime likes, publication date and track ID. Results paginate twenty at a time; discoveries and owned tracks sort newest first.

## Validation

After a current build, run `for test_file in checks/*.test.mjs; do node "$test_file" || exit 1; done` and `npx tsc --noEmit`. Tests cover the full live app/recorder bridge, worklet-free session capture, cancelled/ended musical events, data-file roundtrips, loop scheduling, voice preloading, expression/glide/FX automation, tab recovery, local WAV export controls/cancellation, legacy PCM file compatibility, IndexedDB atomicity, and all existing musical features. Community tests exercise actual SQLite queries and ephemeral native D1/R2 bindings, session-only storage and audio rejection, ownership, text gates, votes/charts and failure cleanup. A native offline Web Audio check also verified production WebAudioFont/percussion synthesis over three repeated cycles and an explicit WAV export through the actual capture worklet and encoder.

## GitHub source sync

The source is mirrored to https://github.com/riebschlager/flow on `main`, preserving Sites history. In every fresh checkout run `node scripts/github-sync-install.mjs` once. The tracked post-commit hook then pushes each new commit to GitHub using your existing Git credentials. Verify or retry manually with `node scripts/github-sync.mjs`. The installer preserves any different existing hooks configuration by stopping for integration.

Sites remains the deployment source. Complete the normal Sites workflow and verify GitHub sync after each update. Sync never force-pushes. A failed hook leaves the local commit intact and must be retried; it does not undo the commit. New clones need the installer because Git does not clone local hook configuration. This is commit-based sync, not a background file watcher.


## Diminished and suspended chords

Sound → Chord progression includes a Diminished & suspended group: Suspended sky (Csus2 → Gsus4 → Asus2 → Fsus4), Passing cloud (Cmaj7 → C#dim7 → Dm7 → G7), and Dusk turn (Am → Bdim → E7 → Am). Custom progression accepts dim (0, 3, 6 semitones), dim7 (0, 3, 6, 9), sus2 (0, 2, 7), and sus4 (0, 5, 7). The aliases ° / °7 mean dim / dim7; sus means sus4. Naturals, sharps and flats work with every quality. These chords use the shared parser for canvas notes, arpeggios, tuned percussion, saved sessions and harmonic glow.
