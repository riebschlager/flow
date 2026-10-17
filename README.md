# Chromaflow

A browser-local ambient instrument combining an incompressible fluid solver and WebAudioFont sampled instruments. Static HTML, CSS and ES modules; no build step or server-side data.

Serve `dist/` with any static HTTP server. Audio starts only after pressing Begin listening. Click or drag to drop color, choose voices and progressions in the panel, or enable automatic rain. Selecting a palette swatch (or pressing 1–4) locks all new painting, rain, and bloom droplets to that color and voice. Enable Cycle colors beside the palette to shuffle all four colors and voices: each appears once per random round, with no consecutive repeats between rounds. This applies to painting, rain, and blooms. The color mode and selected color are remembered. The horizontal impact location selects a chord tone and color chooses the instrument. Space toggles sound, 1–4 selects color, Enter drops when the canvas is focused, and Escape exits Zen view.

Controls include four editable chord slots (via a comma-separated progression), tempo, chord length, 28 instruments assigned to four colors, nine soundscape collections, reverb, tempo-synchronized delay, master volume, vorticity, color persistence, droplet size, color cycling, and rain density. Settings persist in localStorage.

The solver uses semi-Lagrangian advection, pressure projection (20 Gauss-Seidel iterations), and vorticity confinement. Desktop uses a 224×156 grid and narrow viewports use a 144×112 grid. Canvas2D renders the dye field plus impact ripples and falling droplets. Audio uses locally bundled WebAudioFont with FluidR3 samples, a filtered feedback delay and a stereo convolution impulse generated in the browser.

Chromaflow source is licensed under GPL-3.0. WebAudioFont is by Sergey Surikov under GPL-3.0; WebAudioFontData has its included notice; FluidR3 GM is by Frank Wen under its included MIT notice. The source download contains all runtime code and sample files. External Google Fonts are optional; system fonts work offline.

The 12 added voices focus on soft attacks: slow strings, synth strings, choir aahs, voice oohs, flute, pan flute, ocarina, and new age, choir, bowed, halo, and sweep pads. Their custom WebAudioFont envelopes swell over 180–750 ms, sustain gently, and release over 1–1.7 seconds. Existing voices retain their original envelopes. The menu groups voices by family, and Soft horizon and Breathing room showcase the new palette. Instruments are loaded and decoded only when selected.

## Optional percussion

The Rhythm tab adds an optional four-lane, sixteen-step beat studio. Choose among warm kick, soft sub, soft snare, rim click, dusty clap, closed hat, shaker, low tom, muted conga, and wood block. Each voice can be muted, given an independent level, or set to No voice. Step buttons cycle off → hit → accent; arrow keys move through the steps. Ocean pulse, Half-time dust, Broken current, Handwoven, and Euclidean drift provide starting patterns. New variation works on the whole beat or a single lane. A lane's hit-count field generates an evenly distributed Euclidean pattern; Rotate shifts it one step. Pattern changes preserve voice choices.

Percussion follows the shared tempo at half, normal, or double speed, with swing, timing/velocity humanization, and its own mix. The Web Audio clock schedules sounds in advance, while animation consumes the corresponding timed hit events. Pausing or disabling percussion stops its scheduler and sources. The chord transport also follows the audio clock. Percussion has independent 0–100% reverb and delay amounts, with one shared eighth-note, dotted-eighth, or quarter-note echo spacing for voices and percussion. The spacing follows effective percussion tempo, including half/double rhythm speed. Change Shared echo spacing in Sound, Rhythm, or Beat studio; all three selectors mirror the saved setting. Voice and drum delay amounts remain independent. Its own convolver reuses the shared impulse buffer, and its own filtered feedback delay is separate from melodic effects. Dry and wet paths pass through the percussion mix control, shared limiter, and master volume, so zero mix and disabling percussion also mute effect tails. These ten percussion voices are synthesized locally with Web Audio; they require no extra sample downloads.

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

Quarter, eighth, sixteenth, thirty-second, and eighth-triplet rates follow the shared audio clock and effective percussion speed. The chord is computed at each scheduled note time, including progression boundaries; patterns restart on each chord. An independent Arpeggio mix controls its bus before the shared melodic reverb/delay and master effects. Per-note envelopes scale to the rhythmic spacing for bounded polyphony. Starting playback preloads the enabled voice. Pausing, disabling, or changing voice cancels pending notes; live timing/pattern/pool edits replace future events. Stalls skip missed notes rather than bursting them. Clear canvas clears the visual traces; transport and the arpeggiator continue. Settings persist under `chromaflow-arp-v1`, with the feature off by default.

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
