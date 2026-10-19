# 08 · GPU display renderer

**Goal:** A WebGL display path that makes the fluid look like backlit ink in water (bloom, light bending through dye gradients, a faint thin-film shimmer where it swirls), while using less battery than the current CPU raster. The CPU solver is untouched.

**Why:** This is the largest visual upgrade available, and the biggest jump in perceived quality. Moving the per-pixel color work to the GPU also frees CPU time on phones for the solver and audio.

**Do this last.** It is the largest brief, and everything else should already look good on the Canvas2D path.

## Current state

- `Fluid` runs on the CPU (`public/fluid.js`). `renderFluidPixels` in `public/fluid-renderer.js` maps dye to palette sRGB on the CPU (pigment mapping inside the four-color palette polygon, one-cell Gaussian reconstruction, coverage over the `rgb(7,10,17)` background, gentle lighting) into an `ImageData`, which is drawn and scaled up to the canvas.
- `checks/performance-equivalence.test.mjs` and `checks/fluid-renderer.test.mjs` freeze the solver and renderer output against references in `checks/reference/`.
- Overlays (droplets, ripples, rings, motes) draw on a separate 2D canvas (`fx`).

## Requirements

1. **Keep the Canvas2D renderer** as the reference and fallback. Its tests stay unchanged. Use the GPU path only when WebGL2 is available and a quick capability check passes. Add a hidden setting or URL flag (`?renderer=cpu`) to force the CPU path.
2. **Upload, don't recompute.** Each frame, upload `sim.r`, `sim.g`, `sim.b` (and `sim.u`, `sim.v`, `sim.curl` if a pass needs them) as float or half-float textures at grid resolution. Use `R16F`/`RGBA16F` where supported, with an 8-bit fallback.
3. **Port the color mapping exactly first.** A fragment shader that reproduces `createFluidColorizer` and the Gaussian reconstruction, with the palette's four sRGB swatches as uniforms. Validate it against the CPU renderer: render both for the reference fields and compare. Allow a small per-channel tolerance (state it, for example ≤ 2/255) because of GPU float precision. Do this before adding any effect.
4. **Then add effects**, each scaled by the energy dial (see [03](03-visible-sound.md)) and individually testable:
   - **Bloom:** a downsampled blur of bright, dense regions, added back softly. Its strength rises a little with reverb wetness, tying it to the reverb haze.
   - **Refraction:** offset the sample position by the dye density gradient, as if light passes through ink in water, and sample a very subtle background light pattern (for example the chord atmosphere's light position as a soft gradient) through it.
   - **Thin-film shimmer:** in high-curl regions, a faint hue shift along a thin-film interference curve, staying close to the palette (do not introduce colors far outside the palette; the palette-faithful principle in the README still applies).
   - **Grain:** very fine, static-per-frame film grain at low amplitude to soften banding on dark gradients.
5. **Palettes.** All eight palettes must look like themselves. Muted and pastel palettes must not turn neon. Compare against swatch values like the existing renderer tests do.
6. **Overlays.** Keep the `fx` 2D overlay canvas on top, unchanged. Don't port overlays to WebGL in this brief.
7. **Exports.** Clip export (see [05](05-titles-and-exports.md)) must capture the GPU output. Use `preserveDrawingBuffer` or composite per frame, whichever is cheaper.
8. **Context loss.** Handle `webglcontextlost` and `webglcontextrestored`, falling back to the CPU renderer while the context is lost.
9. **Reduced motion.** Effects that move independently of the fluid (grain animation) are static or off.

## Non-goals

- Moving the solver to the GPU. That would break the bit-exact solver references, and it is a separate decision for the project owner.
- WebGPU. WebGL2 is enough and has wider support. Revisit later.

## Acceptance criteria

- GPU color mapping with all effects off matches the CPU renderer within the stated tolerance on every reference field and all eight palettes (test with headless WebGL if available; otherwise a shader logic port in JS that mirrors the GLSL, plus human verification).
- The CPU path, its tests and its reference outputs are unchanged.
- Frame time for the display path on the desktop grid is no worse than the CPU raster (measure and report; the human verifies on devices).
- Context loss falls back cleanly.
- Energy 0 disables all added effects.

## Human QA checklist

- Side by side, CPU vs. GPU at energy 0: identical?
- At default energy: does it look like light through ink, or like a filter?
- Check all eight palettes for neon drift.
- Phone battery and heat during a 30-minute session, compared with the CPU path.
