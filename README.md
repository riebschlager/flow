# Chromaflow

A browser-local ambient instrument combining an incompressible fluid solver and WebAudioFont sampled instruments. Static HTML, CSS and ES modules; no build step or server-side data.

Serve `dist/` with any static HTTP server. Audio starts only after pressing Begin listening. Click or drag to drop color, choose voices and progressions in the panel, or enable automatic rain. Selecting a palette swatch (or pressing 1–4) locks all new painting, rain, and bloom droplets to that color and voice. Enable Cycle colors beside the palette to restore automatic variety. The color mode and selected color are remembered. The horizontal impact location selects a chord tone and color chooses the instrument. Space toggles sound, 1–4 selects color, Enter drops when the canvas is focused, and Escape exits Zen view.

Controls include four editable chord slots (via a comma-separated progression), tempo, chord length, eight instruments assigned to four colors, three soundscape collections, reverb, tempo-synchronized delay, master volume, vorticity, color persistence, droplet size, color cycling, and rain density. Settings persist in localStorage.

The solver uses semi-Lagrangian advection, pressure projection (20 Gauss-Seidel iterations), and vorticity confinement. Desktop uses a 224×156 grid and narrow viewports use a 144×112 grid. Canvas2D renders the dye field plus impact ripples and falling droplets. Audio uses locally bundled WebAudioFont with FluidR3 samples, a filtered feedback delay and a stereo convolution impulse generated in the browser.

Chromaflow source is licensed under GPL-3.0. WebAudioFont is by Sergey Surikov under GPL-3.0; WebAudioFontData has its included notice; FluidR3 GM is by Frank Wen under its included MIT notice. The source download contains all runtime code and sample files. External Google Fonts are optional; system fonts work offline.
