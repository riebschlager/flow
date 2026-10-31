# Controls reorganization

A phased plan for cleaning up and regrouping the instrument's controls so the app matches the layout in the Flow design system. Each phase fits in one working session and leaves the app shippable.

**Reference implementation:** `.claude/skills/flow-design-system/ui_kits/flow-app/` (`ControlRail.jsx`, `Transport.jsx`, `TopBar.jsx`, `Dialogs.jsx`). Control rules: `guidelines/control-choice.html` and `guidelines/interaction-model.html`. Component specs: `components/*/*.prompt.md`.

## Where we are

Commit `532ef71` changed the look but not the layout. It applied tokens and type, turned 26 ranges into knobs through `public/controls-ui.js`, and moved helper paragraphs into `?` tips. The markup, grouping and control types are unchanged. The rail still holds about 35 ranges, 13 switches and 32 selects, and the Layers tab alone has 6 folds and 21 helper lines.

### Problems, by kind

1. **Folds nested too deep.** Tab → layer card → "Edit arpeggiator" fold → "Note shape" fold, and "Portamento" sits in a fold of its own. Percussion puts "Groove feel" inside "Edit percussion". The design system allows one fold level.
2. **Wrong control type.** About ten short discrete lists are native selects but should be Segmented: chord length, note rate, rhythm speed, octaves ×2, landing grid, canvas tool, water character, beat motion, clip length and clip aspect. The palette is a select but should be a swatch grid. BPM uses −/+ buttons instead of a Stepper. Layer levels are horizontal, while the kit uses vertical faders. Drift interval is a slider but should be a knob.
3. **Duplicated controls without a reason.** Play appears five times (`start`, `quickPlay`, `mobilePlay`, `presentPlay`, `studioPlay`). The rail and beat studio each have their own groove, kit and vary controls. Echo spacing exists in both Mix and beat studio. There are three sleep timers. Recording is split across `quickRecord`, `recordStart` and `recordFinish`/`recordBarStop`.
4. **Navigation links standing in for structure.** `mixFromLayers` and `layersFromMix` jump between tabs. "Color behavior" in Scene is a section that contains only a helper paragraph.
5. **Status lines under every switch.** `arpStatus`, `environmentStatus`, `quantizeStatus` and others add a line each. In the kit, a Switch's `description` holds the live state ("Off · droplets land freely").
6. **A crowded transport.** It has two rows: a capture row with play, stop, use-setup, record, loop and a capture settings form, and a harmony row with a second play, chords, note, tempo and a take tray. A session header with back, title, download and new sits above both.
7. **The Library dialog is a wall of buttons.** It has 15 outline buttons and 5 selects around a single `takeSelect`.

## Principles for every phase

- **Native inputs stay the state.** Keep every `id`, storage key, session field and event. New components are progressive enhancements, as in `controls-ui.js`: hide the native input, write `.value`, and dispatch `input` and `change`. Sessions, presets, `app.js` and the 14 checks that load `instrument.html` keep working. Moving an element to a new place is fine. Renaming or removing an `id` needs a matching JS and test change in the same phase.
- **Each control has one home.** A second copy is allowed only when it appears in a different posture, and then it mirrors the same state rather than holding its own. Allowed mirrors are Zen energy and sleep, and beat studio drum reverb and delay. Everything else gets one home.
- **The control type comes from `control-choice`.** Knob for character, Slider for levels and proportions, Segmented for 2–7 values, Select for long or named lists, Stepper for tempo.
- **One fold level.** A layer's switch is its disclosure (the kit's `Layer` pattern). A Fold is only for the secondary detail inside a section, never a fold inside a fold.
- **Copy rules.** Helper copy goes in HelpTips, kept verbatim. Live status goes in the Switch description. Each panel gets one short line at the top.
- **Roadmap rule 4:** hide controls; don't delete them. If a control loses its visible home, give it another one or ask first.

## Target layout

### Rail · Sound
| Section | Controls | Change |
|---|---|---|
| Vibe | `soundscape` Select | Label becomes a section title with a HelpTip |
| Chord progression | `progression` Select, custom `chordInput` + `applyChords` (shown only for Custom), `chordLength` → **Segmented** | Description moves to a HelpTip |
| Color voices | `#voices`: dot · name · sm Select for each color | **Unfolded** (it's the tab's main content); helper → HelpTip |

### Rail · Layers
Three `Layer` blocks. Each has a Switch with a live description and reveals its controls when on. All "Edit …" folds and the status paragraphs go away.

| Layer | Controls |
|---|---|
| Arpeggiator | Row: `arpVoice` · `arpSource` (sm Selects). When the source is Scale: `arpRootMode` · `arpRoot` · `arpScale`. Row: `arpPattern` · `arpRestart`. `arpRate` → **Segmented** (7). Knobs: `arpProbability`, `arpCount`. **Fold "Note shape"**: EnvelopeGraph, then sm knobs `arpLength` `arpAttack` `arpDecay` `arpSustain`, then a Glide row: `arpGlideEnabled` Switch with `arpGlideTime` and `arpGlideAmount` sm knobs |
| Percussion | `groove` Select + Vary button, `rhythmRate` → **Segmented**, knobs `rhythmSwing` `rhythmHumanize` (no longer folded), "Open beat studio ↗" button. **Kit and the four voices move to beat studio only.** |
| Atmospherics | `environmentPreset` Select, knobs `environmentActivity` `environmentTone` (bipolar) |

Remove `mixFromLayers`.

### Rail · Play
| Section | Controls |
|---|---|
| Canvas tool (action: `expressionEnabled` Switch) | `gestureTool` → **Segmented** (Paint · Conduct · Space · Orbit), knob `gestureAmount` |
| Automatic droplets | `autoPour` Switch, `rain` Slider with word readout (Unhurried / Steady / Lively) |
| Quantize | `quantizeEnabled` Switch, `quantizeBeats` → **Segmented**, shown when on |
| Pitch range | `octavesDown` and `octavesUp` → **Segmented** ×2, `pitchRangeValue` mono readout (no longer folded) |
| Drift | `driftEnabled` and `driftWander` Switches, `driftStyle` and `sleepTimer` sm Selects, `driftPace` → **Knob** |
| Gestures (action: Release a bloom) | Numbered gesture list (no longer folded), `conductScene` Switch, "Let the scene settle" ghost button |

`fluidListens` moves to Scene (see open decisions).

### Rail · Scene
| Section | Controls |
|---|---|
| Energy | `energy` Slider with extents Lights down ↔ Vivid |
| Color palette | `colorPalette` → **swatch grid** (2 columns, 8 palettes). The "Color behavior" copy goes into its HelpTip, and that section is deleted |
| The fluid | Knobs `swirl` `persistence` `dropSize` `chordAtmosphere` (Harmonic glow), plus the `fluidListens` Switch |
| Living water (action: `waterEnabled` Switch) | `waterPreset` → **Segmented** (4, including Custom), 5 sm knobs, no longer folded |
| Percussion response | `rhythmVisualMode` → **Segmented**, `rhythmVisual` Slider (Still ↔ Tidal). Dimmed when percussion is off. No longer folded |

### Rail · Mix
| Section | Controls |
|---|---|
| Master | `volume` Slider |
| Layer levels | `dropletsVolume` `arpVolume` `rhythmVolume` `environmentVolume` → **vertical faders**. A fader dims when its layer is off |
| Melodic space | `reverb` and `delay` as **lg** knobs, no longer folded |
| Percussion space | `rhythmReverb` and `rhythmDelay` knobs, no longer folded |
| Echo spacing | `voiceDelayBeats` Select + "804 ms at 72 BPM" mono readout |

Remove `layersFromMix`.

### Transport, top bar and canvas
- **Top bar:** brand (goes to sessions home, replacing `allSessions`) · inline `sessionTitle` + Saved state · Community · Library · `?` · Zen · rail toggle. `backupSession` and `newSession` move into a small session menu next to the title. `fullscreen` moves into the Zen strip.
- **Transport (one row):** Play + status · ChordStrip (`#chords`) · note readout · **Stepper** BPM (replaces `slower`/`faster`) · Record + timer + Loop. Capture settings (`recordName`, `recordMode`, `recordCycles`, `recordAutoLoop`) move to a popover on a chevron next to Record. The take tray and its quick buttons go away; after a take, a toast says "Saved · Open in library".
- **Canvas overlay:** a glass palette pill (4 swatches + Cycle colors) plus a Clear icon button. Zen moves to the top bar. "Ways to play ↗" stays for first-run and opens Play → Gestures.

### Dialogs
- **Beat studio:** header with `studioGroove`, Vary, Clear all, the legend and a HelpTip; StepGrid; footer with `studioKit` and knobs Swing, Humanize, Drum reverb, Drum delay. The swing and humanize knobs mirror the rail. `studioEnabled` becomes a Switch in the header actions. `studioDelayBeats` is removed (Mix owns echo spacing).
- **Library:** TrackRow list + detail card. The title is editable inline and replaces `takeName` + `takeRename`. Play loop / Play once, a `takeSeam` knob, clip export with Segmented `clipLength` `clipAspect` `clipFraming`, and a "Long renders" fold for `renderMinutes` and `renderSource`. Rarely used actions go in an overflow menu: load setup, fork, save file, import, delete.
- **Community:** the chart buttons become Tabs; tracks become TrackRows. The share form stays.
- **Zen / presentation:** one glass strip component with Play, Energy, Sleep, Title, fullscreen and Exit. The presentation variant adds Next and Auto-advance. The transport and harmony hide toggles are removed.

---

## Phases

Each phase follows the AGENTS.md workflow: install the sync hook, change and validate, commit, push to Sites, `node scripts/github-sync.mjs`, then publish. Use one `?rev=controls-<n>` revision name for the workstream, and bump it on every import a phase touches. Run all of `checks/` before committing.

### Phase 1 · Primitives (no layout changes)
Add these enhancers to `controls-ui.js`, or to a new `controls-kit.js` that it imports:
- `enhanceSegmented(select)` renders a radio-group Segmented from a native select. The select stays hidden as the state, and arrow keys move the selection.
- `enhanceSwatchGrid(select)` builds the palette grid from `public/palettes.js`.
- `enhanceStepper(input)` provides the BPM Stepper with the shared gesture model. Wrap the existing tempo state in a hidden number input if none exists.
- A vertical slider variant (CSS plus an `orientation` data attribute).
- `Layer` behavior: a switch reveals or hides its sibling body by animating `grid-template-rows`, and the description mirrors the existing status element's text.
- An EnvelopeGraph that reads the four arp ranges and highlights the segment being adjusted.

Add tests to `checks/controls-ui.test.mjs`. Each enhancer must keep `.value`, events and `disabled` in sync both ways. **Done when:** no visible change unless a component is applied to an element. All checks pass.

### Phase 2 · Sound and Scene tabs
These two have the least coupling to other code. Apply Segmented to `chordLength`, `waterPreset` and `rhythmVisualMode`. Add the swatch grid, unfold Color voices, remove the Color behavior section, flatten the water and percussion-response folds, and group the fluid knobs. **Done when:** each tab matches its target table and neither tab has a nested fold.

### Phase 3 · Layers tab
Replace the three `layer-card` + "Edit" structures with the Layer pattern. Flatten the arp folds into a single "Note shape" fold with the EnvelopeGraph. Remove `rhythmKit` and `#rhythmVoices` from the rail. Update `rhythm-ui.js` so beat studio is their only home, and check that session restore still sets the kit. Remove `mixFromLayers`. Update `checks/rhythm-ui.test.mjs`. **Done when:** Layers has no more than one fold level and no status paragraphs.

### Phase 4 · Play tab
Regroup into the six sections above. Apply Segmented to the canvas tool, quantize grid and octaves. Make `driftPace` a knob. Unfold the gesture guide and the pitch range. Move `fluidListens` to Scene. Update `checks/performance-ui.test.mjs`, `drift-ui`, `gesture-tools` and `octaves`. **Done when:** the tab matches its target table.

### Phase 5 · Mix tab and dedupe
Add vertical faders that dim when their layer is off, unfold the lg knobs, and add the echo readout. Remove `layersFromMix` and `studioDelayBeats`, and make sure the studio drum knobs mirror the same state. Update `checks/delay-sync.test.mjs`. **Done when:** the layout matches the target, and echo spacing and drum space each have exactly one source of truth.

### Phase 6 · Top bar, transport and canvas
This is the largest phase and touches the most state. Merge the two transport rows into one, add the Stepper and ChordStrip, move capture settings into a popover, and replace the take tray with a toast. Fold the session header into the top bar and remove the duplicate play buttons. Before starting, settle the **live vs take playback** open decision below. Update `app-smoke`, `recorder-ui`, `first-run` and `session-workspace`. **Done when:** one play button controls whatever is selected, and the canvas edge is clear apart from the palette pill.

### Phase 7 · Dialogs and Zen
Rebuild the Library as list + detail, port beat studio to StepGrid, switch Community to Tabs and TrackRows, and turn Zen and presentation into one glass strip. Update `recorder-ui`, `community-ui`, `presentation-*` and `rhythm-ui`. **Done when:** no dialog has more than 4 visible buttons before the overflow menu.

### Phase 8 · Mobile, accessibility, dead CSS
Check the rail at 375px. The mobile dock and `closeMobileControls` must still work, and Segmented controls with 7 options need a scroll fallback. Do a keyboard-only pass on every new component. Delete the CSS for removed structures from `style.css` (`.layer-editor`, `.nested-fold`, `.take-tray`, `.capture-options` and others). Run `benchmark-performance.mjs` to check that rendering cost didn't regress. **Done when:** an axe or keyboard pass is clean and `style.css` contains no orphaned selectors.

---

## Open decisions

Settle these before the phase that needs them.

1. **Layer editing while off (Phase 3).** The kit shows a layer's controls only when it's on. Today you can edit a layer while it's off. *Recommendation:* follow the kit. A layer you are tuning should be audible.
2. **Live vs take playback (Phase 6).** `start` plays the live scene, and `quickPlay` plays a selected take or the live scene. *Recommendation:* one Play button. When a take is selected, a chip by the ChordStrip says "Take · Morning, glass house ×" and clearing it returns to live.
3. **Fluid listens (Phase 4).** It is experimental and missing from the kit. *Recommendation:* a Switch in Scene → The fluid, with its helper text in a HelpTip.
4. **Glide (Phase 3).** The kit shows Glide as a main knob, but the source has a separate portamento switch and an amount control. *Recommendation:* keep all three inside the Note shape fold so the meaning of saved sessions doesn't change.
5. **Sessions home and new session (Phase 6).** Is the brand the right way back to the sessions list, or should the top bar keep an explicit "← Sessions"?
