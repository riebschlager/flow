# Chromaflow

An ambient instrument combining an incompressible fluid solver and WebAudioFont sampled instruments, with browser-local recording and an optional shared community library. The original HTML/CSS/ES-module instrument is preserved in `app/instrument.html` and `public/`; Vinext serves it alongside a Worker API backed by Sites-managed D1 and R2.

Install with the Sites dependency helper (or `npm run install:ci` standalone), generate schema changes with `npm run db:generate`, and build with the Sites build helper (or `npm run build` standalone). `dist/` is generated output. For local development, use the Sites preview workflow or `npm run dev` standalone; apply generated SQL migrations to local D1 before using Community. Audio starts only after pressing Begin listening. Click or drag to drop color, choose voices and progressions in the panel, or enable automatic rain. Selecting a palette swatch (or pressing 1–4) locks all new painting, rain, and bloom droplets to that color and voice. Enable Cycle colors beside the palette to shuffle all four colors and voices: each appears once per random round, with no consecutive repeats between rounds. This applies to painting, rain, and blooms. The color mode and selected color are remembered. The horizontal impact location selects a chord tone and color chooses the instrument. Space toggles sound, 1–4 selects color, Enter drops when the canvas is focused, and Escape exits Zen view.

Controls include four editable chord slots (via a comma-separated progression), tempo, chord length, 28 instruments assigned to four colors, nine soundscape collections, reverb, tempo-synchronized delay, master volume, vorticity, color persistence, droplet size, color cycling, and rain density. Settings persist in localStorage.

The solver uses semi-Lagrangian advection, pressure projection (20 Gauss-Seidel iterations), and vorticity confinement. Desktop uses a 224×156 grid and narrow viewports use a 144×112 grid. Canvas2D renders the dye field plus impact ripples and falling droplets. Audio uses locally bundled WebAudioFont with FluidR3 samples, a filtered feedback delay and a stereo convolution impulse generated in the browser.

Chromaflow source is licensed under GPL-3.0. WebAudioFont is by Sergey Surikov under GPL-3.0; WebAudioFontData has its included notice; FluidR3 GM is by Frank Wen under its included MIT notice. The source download contains all runtime code and sample files. External Google Fonts are optional; system fonts work offline.

The 12 added voices focus on soft attacks: slow strings, synth strings, choir aahs, voice oohs, flute, pan flute, ocarina, and new age, choir, bowed, halo, and sweep pads. Their custom WebAudioFont envelopes swell over 180–750 ms, sustain gently, and release over 1–1.7 seconds. Existing voices retain their original envelopes. The menu groups voices by family, and Soft horizon and Breathing room showcase the new palette. Instruments are loaded and decoded only when selected.

## Optional percussion

The Rhythm tab adds an optional four-lane, sixteen-step beat studio. Choose among warm kick, soft sub, soft snare, rim click, dusty clap, closed hat, shaker, low tom, muted conga, and wood block. Each voice can be muted, given an independent level, or set to No voice. Step buttons cycle off → ghost → hit → accent; arrow keys move through the steps. Ocean pulse, Half-time dust, Broken current, Handwoven, and Euclidean drift provide starting patterns. New variation works on the whole beat or a single lane. A lane's hit-count field generates an evenly distributed Euclidean pattern; Rotate shifts it one step. Pattern changes preserve voice choices.

Percussion follows the shared tempo at half, normal, or double speed, with swing, timing/velocity humanization, and its own mix. The Web Audio clock schedules sounds in advance, while animation consumes the corresponding timed hit events. Pausing or disabling percussion stops its scheduler and sources. The chord transport also follows the audio clock. Percussion has independent 0–100% reverb and delay amounts, with one shared eighth-note, dotted-eighth, or quarter-note echo spacing for voices and percussion. The spacing follows effective percussion tempo, including half/double rhythm speed. Change Shared echo spacing in Sound, Rhythm, or Beat studio; all three selectors mirror the saved setting. Voice and drum delay amounts remain independent. Its own convolver reuses the shared impulse buffer, and its own filtered feedback delay is separate from melodic effects. Dry and wet paths pass through the percussion mix control, shared limiter, and master volume, so zero mix and disabling percussion also mute effect tails. All twenty percussion voices are synthesized locally with Web Audio; they require no extra sample downloads.

Each rhythm voice sends a pulse from its own place in the canvas. Choose ripples, fluid stirring, or both, and set their strength independently from sound. Stirring now drives broad counter-rotating rolls for kicks and toms, sweeping currents for snares, claps, and clicks, and tighter eddies for hats and shakers. These stronger, wider impulses survive pressure projection and move existing dye without adding colors or triggering melodic notes. Hit velocity still shapes each impulse; the upper end of Visual strength adds extra drive. Larger double ripple rings mirror the stronger fluid motion. Percussion impulses cap local velocity at 180 grid cells/second to keep dense patterns stable. Color locking therefore continues to govern all melodic droplets. Percussion settings are saved separately in localStorage under `chromaflow-rhythm-v1`; it is off by default and never starts sound before the scene is played.

Both melodic and percussion delay lines use the same timing function and transition speed. Delay capacity covers the slowest half-time quarter-note setting (four seconds at 30 BPM). Timing remains shared when percussion is switched off.

## Expressive canvas

The Perform tab adds optional expression (on by default at 65% intensity) with a gesture guide, playing-field map, live gesture readout, and an independent Conduct the whole scene switch.

- Position: horizontal placement still chooses a chord tone and now also places it in stereo. High placement is light/bright; low placement adds weight, a warmer low-pass tone, longer sustain, and a larger ink bloom.
- Silk: slow strokes make softer, longer notes and connected fluid ribbons.
- Rush / Spark: speed adds velocity, brighter filtering, shorter envelopes, larger splats, and stronger jets. A fast release sends one final accented droplet.
- Orbit: coherent circular movement creates local vortices. With whole-scene conducting on, it also opens the master filter and moves the composition in stereo.
- Gather / Bloom: hold nearly still for about a second, then release four long, soft chord tones across a small cloud of droplets.
- Conduct: vertical sweeps shape a low-pass filter across both voices and percussion. Downward sweeps warm/darken the composition; upward sweeps open it. Filter, stereo motion, and a gentle level response settle back after release.

Gesture intensity controls the response depth; turning expression off restores basic painting. Reset gesture effects with Let the scene settle. Arrow keys move the canvas's virtual cursor; Enter taps and Shift+Enter releases a bloom. Pointer cancel does not release a bloom; additional concurrent pointers are ignored. Gesture settings persist separately as `chromaflow-expression-v1`.

Manual expressive notes use per-note envelopes, low-pass filters, and stereo positioning, while automatic droplets keep their original note behavior. Filters are inserted before the reusable WebAudioFont gain envelope so its target bus remains stable, and temporary nodes are disconnected when the source ends. Note lengths are bounded at nine seconds; excess polyphony fades older notes. Master gesture filters are separate from the user's volume/effect settings and do not alter the shared delay clock or percussion patterns. Fluid forces are bounded and add no dye. Color locking still applies to every newly launched droplet, including blooms and flicks.

## Quantized droplets

The Perform tab has an optional Quantize switch and Landing grid selector: quarter, eighth (default), sixteenth, thirty-second, or eighth-note triplet. Every droplet source shares this setting, including painting, rain, blooms, and keyboard. The fall stretches to the first grid line at or after its natural arrival, so the splash and note share one landing time. This changes note onset, not sustain. It follows effective percussion tempo (including half/double speed) on a straight grid; swing and humanize remain drum settings. With percussion off it follows the composition clock, and silent visual play still uses the tempo. It is off by default; the switch and division persist with composition settings.

Quantized notes are scheduled ahead on the Web Audio clock, with the visual splash consumed at that same time. Tempo, rhythm-speed, grid, and transport changes replan pending droplets while preserving their visible progress; clearing or removing pending droplets cancels their scheduled audio. A resumed background tab skips missed grid points without releasing a burst of late notes.

## Horizontal octave range

Perform → Place the sound offers Octaves below and Octaves above, independently from 0–3. These add lower/higher copies of the current chord around its base register, which is always included. The default is 0 below and 1 above, matching the original two-register canvas. A live note-range preview follows chord and selected color changes; in Cycle colors mode it shows the base range. Coral retains its one-octave-lower voicing. Setting both values to zero confines the canvas to the base chord.

The horizontal note pool is sorted and deduplicated so extended chords also ascend smoothly. All melodic sources share the range: taps, strokes, rain, blooms, keyboard, and quantized notes. Changing the range cancels/replaces future scheduled notes while preserving already sounding notes. Settings are saved with the composition; drum voices and patterns are unchanged.

## Single-voice arpeggiator

Sound → Arpeggiator adds an optional, separately chosen WebAudioFont voice. Patterns: ascending, descending, up/down, down/up, outside-in, or shuffled random with no consecutive repeats. Choose 1–16 notes in the pool; chord tones expand upward from the base register to fill it. This independent pool does not change the canvas octave range or color voices. The note chips preview the pool and highlight timed notes, while neutral ripples trace their positions in the scene without adding dye or extra melodic droplets.

Whole, half, quarter, eighth, sixteenth, thirty-second, and eighth-triplet rates follow the shared audio clock and effective percussion speed. The chord is computed at each scheduled note time, including progression boundaries; patterns restart on each chord. An independent Arpeggio mix controls its bus before the shared melodic reverb/delay and master effects. Per-note envelopes scale to the rhythmic spacing for bounded polyphony. Starting playback preloads the enabled voice. Pausing, disabling, or changing voice cancels pending notes; live timing/pattern/pool edits replace future events. Stalls skip missed notes rather than bursting them. Clear canvas clears the visual traces; transport and the arpeggiator continue. Settings persist under `chromaflow-arp-v1`, with the feature off by default.

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

Sound → Arpeggiator → Note shape exposes four independent controls with a live amplitude-envelope preview:

- Note length: 10–400% of one rate step; above 100% allows overlap. Actual note duration is bounded to 20 ms–8 s.
- Attack: 0–2000 ms to rise to peak level.
- Decay: 0–2000 ms to settle from peak to the sustain level.
- Sustain: 0–100% held amplitude, rather than a time setting.

Attack and decay proportionally fit the available duration when necessary; the caption shows their actual timings. A short automatic release ends each note smoothly, and very short ramps avoid clicks. Defaults are 85% length, 20 ms attack, 120 ms decay, and 65% sustain. Old saved arpeggios gain these defaults; all four controls persist in the existing arpeggio settings. Tempo/rhythm-speed changes update the preview and total duration. Shape edits affect newly scheduled notes without resetting the melodic pattern; already sounding notes finish their envelopes. The custom amplitude envelope is per note and retains each voice's gain, tone sweep, stereo, and shared effects. Canvas/drop envelopes are unchanged.

## Arpeggio portamento

Sound → Arpeggiator → Portamento adds optional pitch glide, off by default. Glide time is 0–2000 ms (default 180 ms); glide amount is 0–100% (default 100%). A full-interval glide starts each note at the previous arpeggio pitch, then reaches the current chord tone. Smaller amounts start closer to the target. The first note after starting or changing voice begins at its own pitch. Zero time or amount bypasses bending.

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

## Performance recorder and loop library

Use Record / Library in the header. A take contains the actual stereo master output, the complete opening composition setup, the starting fluid field, and a timestamped performance timeline. Recording uses a local AudioWorklet tap after the master mix; it requests no microphone or screen permission and sends no recordings to a server. Captured audio includes melodic and percussion FX, random voice/color choices, rhythm humanization, arpeggios, performance dynamics, and all the sound as it was actually rendered. Playback is a faithful recorded performance, not a re-run of random generators.

1. Set up voices, harmony, percussion and the arpeggiator; name the take.
2. Choose any whole number of progression cycles from 1–16, or Manual. Record starts at chord one after instruments are ready. Fixed cycles count the opening progression's beat length through BPM changes. If progression or chord-length controls are changed during the take, that change is captured; the planned beat count still uses the opening progression. Manual Finish ends at the next four-beat bar and continues recording until that boundary.
3. Perform normally: gestures, taps, rain, blooms, color choices, custom chords, chord jumps, effects, kit and pattern edits, tempo, octave range, fluid controls, expression, and all arpeggiator controls are captured. The recorder maintains its own musical beat count independently from transport jumps.
4. At the boundary, new notes are gated and future scheduled notes are cancelled. Existing note/effect tails are allowed to render for another half second. The take is saved automatically in the browser; Loop the take when it is ready is on by default. Cancel discards only the in-progress take.
5. Play loop or Play once from the library. Playback uses one AudioBufferSourceNode with exact loop sample boundaries. The live generators and editing inputs are suspended during playback, preventing extra notes. Recorded settings and visual actions follow the audio clock; stop returns to the setup present before playback. Load opening setup intentionally restores and saves the take's initial settings for a new live performance.

Seam blend is adjustable from 0–500 ms (80 ms default), limited to a quarter of very short takes. It blends the recorded post-boundary tail into the opening with a smooth curve without changing the loop's number of samples or bar length. Zero gives the original cut. This is an audible seam treatment, not an added pause or lossy-codec loop. Audio repeats exactly; fluid motion continues evolving across repeats while replaying the recorded actions, avoiding a hard canvas reset. Visual scheduling skips stale actions when a hidden/throttled tab returns, while applying the latest settings and keeping audio-loop phase. Canvas simulation pixels can vary with viewport and rendering frame rate; audio timing remains on the Web Audio clock.

Takes are stored in IndexedDB, with a separate metadata index so opening the library does not load every take's audio. Audio and index saves/deletes use atomic transactions. The library supports selecting, renaming, deleting, importing and exporting. Storage errors leave the current take in memory with working download actions. Storage is specific to this browser and origin; clearing site data removes its library, so a downloaded copy is the portable backup.

Save performance file exports a versioned `.chromaflow` binary package: magic `CFLOOP01`, little-endian 32-bit JSON header length, UTF-8 metadata/setup/scene/event header, followed by two planar float32 PCM channel blocks including their effect tails. Import validates the format, dimensions, finite audio, timeline, safe actions and supported voices/chords before use, then saves an independent library copy. Export loop WAV produces a stereo 16-bit PCM WAV with the selected seam treatment and no metadata timeline. A `.chromaflow` file can replay its captured audio without downloading its original soundfonts; loading its setup for a new live performance loads selected voices normally.

Limits: 10 minutes per take, 80,000 timeline events, 500 actions in one second, a 24 MB metadata header and 300 MB import files. Planned cycle takes exceeding ten minutes are rejected before capture. AudioWorklet support is required for recording; library files and audio playback do not need microphone permission. If timeline capacity is reached, the take finishes on the next bar. The worklet's chunk messages carry capture IDs so a cancelled take cannot contaminate a later capture.

Validation includes exact non-quantum-aligned worklet frames, cancellation, fixed and manual musical timing with BPM changes, complete file and typed-audio storage roundtrips, abort/quota recovery, automation and visual playback across loop seams, the live app bridge, and native offline DSP capture/playback with exact repeated sample positions.


## Shared community library

The Community button opens public performances and Today, This week, All time, New discoveries, and My shared tracks views. Anyone can browse, follow a track link and play the captured stereo audio with its opening canvas, visual actions and settings automation. Listen uses the existing loop player and suspends live generators. Stopping restores the listener’s previous live setup and local library selection. Save copy explicitly saves an independent performance to the listener’s IndexedDB library.

To publish, select a browser take in Record / Library and choose Share selected take. Sign in with ChatGPT, enter a public artist name (2–40 characters) and title (2–80), and explicitly check the public-sharing consent. Only then is that selected take uploaded. The stable, site-scoped authenticated user ID owns tracks and votes; account emails and identity headers are never returned by the community API. Anonymous visitors can listen; publishing, liking/unliking and removing an owned track require dispatch-provided identity and a same-origin write request. Platform sign-in/out starts through top-level anchors. Users can copy a direct track link and remove their own public tracks, leaving local takes intact.

`.openai/hosting.json` declares D1 `DB` and R2 `BUCKET`. The generated Drizzle migration creates tracks, timestamped likes and atomic request-limit counters. D1 stores public metadata and ownership; R2 stores canonical validated `.chromaflow` recordings under server-generated UUID keys. No table is created during a request. New migration SQL and Drizzle metadata must be committed together. The Sites deployment applies schema migrations before publishing the Worker.

Public metadata passes server-side Unicode/diacritic/confusable/leet normalization and common profanity, slur and abusive-phrase checks, including punctuation and letter-spacing evasions. Markup, links and hidden control characters are rejected. This is a deterministic basic English text gate, not comprehensive semantic or multilingual moderation. Public titles overwrite the uploaded file’s original take name. Uploaded audio and all supported settings/visual actions are validated before a track becomes visible. Arbitrary metadata cannot set public ownership, likes or timestamps. All UI metadata is escaped.

Shared files are limited to 90 MiB, with an 8 MiB metadata header (browser-local imports retain their 300 MiB / 24 MiB limits). Request bodies are consumed in bounded chunks, Float32 samples checked incrementally, and R2 multipart parts uploaded in 5 MiB blocks. Interrupted/invalid multipart uploads are aborted; a failed database insert removes the completed object. Failed publishing keeps the local original and permits retry. Current simple quotas are four upload attempts per account per hour, fifty active shared tracks per account, sixty vote actions per minute and twenty removal actions per minute. These counters use atomic SQL upserts.

A person has at most one active like per track, enforced by the database primary key. Unlike removes its contribution. Re-liking retains the original vote date, preventing toggles from refreshing the vote into today’s chart. Today counts active likes first received since midnight UTC; This week uses the preceding seven days; All time counts every active like. Ties use lifetime likes, newest publication, then track ID. An old track can rank today when it receives new listeners’ likes. Upload date does not determine chart eligibility. Results paginate in pages of twenty. New discoveries and My shared tracks sort by publication date.

Validation: `checks/community-server.test.mjs` runs the exact migrations and SQL against SQLite and verifies authorization, CSRF/origin checks, public text gates, streaming boundaries, malformed samples, multipart cleanup, chart windows, vote uniqueness and timestamps, creator removal and quotas. `checks/community-bindings.test.mjs` (after a current build) uses ephemeral native local D1/R2 bindings to verify a multipart upload larger than 5 MiB, exact PCM roundtrip, voting and cleanup. `checks/community-ui.test.mjs` covers public metadata escaping, sign-in gates, sharing consent, upload errors/retry, playback/copy, chart controls and removal. Existing recorder/app tests cover shared playback restoration alongside all prior musical features. Run `for test_file in checks/*.test.mjs; do node "$test_file" || exit 1; done` after a build, plus `npx tsc --noEmit`.
