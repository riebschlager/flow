# Chromaflow

A browser-local ambient instrument combining an incompressible fluid solver and WebAudioFont sampled instruments. Static HTML, CSS and ES modules; no build step or server-side data.

Serve `dist/` with any static HTTP server. Audio starts only after pressing Begin listening. Click or drag to drop color, choose voices and progressions in the panel, or enable automatic rain. Selecting a palette swatch (or pressing 1–4) locks all new painting, rain, and bloom droplets to that color and voice. Enable Cycle colors beside the palette to restore automatic variety. The color mode and selected color are remembered. The horizontal impact location selects a chord tone and color chooses the instrument. Space toggles sound, 1–4 selects color, Enter drops when the canvas is focused, and Escape exits Zen view.

Controls include four editable chord slots (via a comma-separated progression), tempo, chord length, 20 instruments assigned to four colors, five soundscape collections, reverb, tempo-synchronized delay, master volume, vorticity, color persistence, droplet size, color cycling, and rain density. Settings persist in localStorage.

The solver uses semi-Lagrangian advection, pressure projection (20 Gauss-Seidel iterations), and vorticity confinement. Desktop uses a 224×156 grid and narrow viewports use a 144×112 grid. Canvas2D renders the dye field plus impact ripples and falling droplets. Audio uses locally bundled WebAudioFont with FluidR3 samples, a filtered feedback delay and a stereo convolution impulse generated in the browser.

Chromaflow source is licensed under GPL-3.0. WebAudioFont is by Sergey Surikov under GPL-3.0; WebAudioFontData has its included notice; FluidR3 GM is by Frank Wen under its included MIT notice. The source download contains all runtime code and sample files. External Google Fonts are optional; system fonts work offline.

The 12 added voices focus on soft attacks: slow strings, synth strings, choir aahs, voice oohs, flute, pan flute, ocarina, and new age, choir, bowed, halo, and sweep pads. Their custom WebAudioFont envelopes swell over 180–750 ms, sustain gently, and release over 1–1.7 seconds. Existing voices retain their original envelopes. The menu groups voices by family, and Soft horizon and Breathing room showcase the new palette. Instruments are loaded and decoded only when selected.

## Optional percussion

The Rhythm tab adds an optional four-lane, sixteen-step beat studio. Choose among warm kick, soft sub, soft snare, rim click, dusty clap, closed hat, shaker, low tom, muted conga, and wood block. Each voice can be muted, given an independent level, or set to No voice. Step buttons cycle off → hit → accent; arrow keys move through the steps. Ocean pulse, Half-time dust, Broken current, Handwoven, and Euclidean drift provide starting patterns. New variation works on the whole beat or a single lane. A lane's hit-count field generates an evenly distributed Euclidean pattern; Rotate shifts it one step. Pattern changes preserve voice choices.

Percussion follows the shared tempo at half, normal, or double speed, with swing, timing/velocity humanization, and its own mix. The Web Audio clock schedules sounds in advance, while animation consumes the corresponding timed hit events. Pausing or disabling percussion stops its scheduler and sources. The chord transport also follows the audio clock. Melody effects remain as before; percussion has a mostly dry path with a small room send, all through the shared limiter and master volume. These ten percussion voices are synthesized locally with Web Audio; they require no extra sample downloads.

Each rhythm voice sends a pulse from its own place in the canvas. Choose ripples, fluid stirring, or both, and set their strength independently from sound. Stirring adds local vortices to the velocity field without adding dye or triggering melodic notes. Color locking therefore continues to govern all melodic droplets. Percussion settings are saved separately in localStorage under `chromaflow-rhythm-v1`; it is off by default and never starts sound before the scene is played.
