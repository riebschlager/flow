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

*Status: done (`rev=controls-1`).* The primitives live in `public/controls-kit.js` and are re-exported from `controls-ui.js`: `enhanceSegmented(select,{size,full})`, `enhanceSwatchGrid(select)`, `enhanceStepper(input,{label,unit})`, `enhanceLayer(switch,body,{status})` and `enhanceEnvelopeGraph(host)`. For a vertical fader, set `data-orientation="vertical"` on a range and use `--fader-length` to size it. Tempo now has a hidden `#bpm` number input (30–100, step 2) that mirrors `state.bpm` both ways through `showBpm()`/`setBpm()` in `app.js`. Property watchers chain, so a knob and the EnvelopeGraph can watch the same range.

### Phase 2 · Sound and Scene tabs
These two have the least coupling to other code. Apply Segmented to `chordLength`, `waterPreset` and `rhythmVisualMode`. Add the swatch grid, unfold Color voices, remove the Color behavior section, flatten the water and percussion-response folds, and group the fluid knobs. **Done when:** each tab matches its target table and neither tab has a nested fold.

*Status: done (`rev=controls-2`).* `enhanceRail()` in `controls-ui.js` runs at startup, after the HelpTips, knobs and sliders. It applies the components listed in `SEGMENTED` and `SWATCH_GRIDS`, and `DIM_WHEN_OFF` dims Percussion response (without disabling it) while `rhythmEnabled` is off. Later phases add their controls to these tables. Two small extensions: an option's `data-label` gives a shorter segment and keeps the full text as its title, and a helper with an id (a live description such as `scapeDescription`) moves into its section's HelpTip only when it has `data-help-tip`. The tabs now have no folds. The water knobs are `sm` knobs, and `chordAtmosphere` became a knob in The fluid. The Energy readout sits in its section title. `palettePreview` stays in the DOM for `app.js` but is hidden while the swatch grid is present. `fluidListens` is still in Play.

### Phase 3 · Layers tab
Replace the three `layer-card` + "Edit" structures with the Layer pattern. Flatten the arp folds into a single "Note shape" fold with the EnvelopeGraph. Remove `rhythmKit` and `#rhythmVoices` from the rail. Update `rhythm-ui.js` so beat studio is their only home, and check that session restore still sets the kit. Remove `mixFromLayers`. Update `checks/rhythm-ui.test.mjs`. **Done when:** Layers has no more than one fold level and no status paragraphs.

*Status: done (`rev=controls-3`).* Each layer is a `section.control-section.layer` (ids `arpCard`, `rhythmCard`, `environmentCard` kept) whose body div keeps the old editor id (`arpControls`, `rhythmControls`, `environmentControls`). `enhanceRail()` applies them from a new `LAYERS` table, and a layer's controls show only while it's on (decision 1). The status mirror is now its own kit export, `mirrorStatus(switch,status)`. `enhanceLayer` uses it, and the `SWITCH_STATUS` table applies it to `arpGlideEnabled` → `arpGlideSummary`. `ENVELOPE_GRAPHS` places the EnvelopeGraph in `#arpEnvelope`, which is now an empty host. `arpeggiator-ui.js` no longer draws the old SVG. It still writes the tempo-aware `arpEnvelopeSummary`, which is now the Note shape fold's summary line (`details#arpShape`). Glide stays inside that fold as a row (decision 4). `arpFollowingRoot` is a visually hidden live region, because the pool label already shows the current root. Beat studio is the only home for the kit and voices: `rhythm-ui.js` drops the rail kit, the voice summary and `open(lane)`. Session restore still sets the kit through `restore()` → `syncControls()`. `workspace-ui.js` now only syncs the Mix on/off labels and `layersFromMix`. A Segmented label's generated id now skips ids already in use (`rhythmRate` would have taken `rhythmRateLabel`). `controls-ui.test.mjs`'s fake DOM now parses real markup (text, bare attributes, void elements, `data-*`, selected options), so the Phase 3 test enhances the actual Layers panel. Orphaned `.layer-card`, `.layer-editor` and `.arp-shape` rules remain in `style.css` for Phase 8.

### Phase 4 · Play tab
Regroup into the six sections above. Apply Segmented to the canvas tool, quantize grid and octaves. Make `driftPace` a knob. Unfold the gesture guide and the pitch range. Move `fluidListens` to Scene. Update `checks/performance-ui.test.mjs`, `drift-ui`, `gesture-tools` and `octaves`. **Done when:** the tab matches its target table.

*Status: done (`rev=controls-4`).* Play is six `control-section`s with no folds. A new `.section-head` row holds a section title and its action: the `expressionEnabled` switch (named by `aria-label="Expressive canvas"`) for Canvas tool, and `#bloom` for Gestures. `#bloom` and `#resetPerformance` are now `.ghost-button`s. `SEGMENTED` adds `gestureTool` (options carry `data-label`, and the full "Paint · notes & gestures" text is the segment's title), `quantizeBeats`, `octavesDown` and `octavesUp`. `KNOBS` adds `driftPace`, which sits beside the Style and Sleep timer selects in `.drift-grid`. Quantize uses the Layer pattern (`LAYERS.quantizeEnabled` → `quantizeControls`, status `quantizeStatus`), and `app.js` still disables `quantizeBeats` while quantize is off. `SWITCH_STATUS.driftEnabled` mirrors `driftStatus`, so sleep timer messages show in the Drift description. The old static description is kept as a line in the Drift HelpTip. `pitchRangeValue` is now an `<output class="range-readout">`. The expression map (`#expressionDot`, written by `performance.js`) lives on in Pitch range, whose HelpTip already describes it. The Gestures section keeps the id `gestureGuide` and has `tabindex="-1"`. "Ways to play ↗" now switches to Play and focuses and scrolls to it. The Automatic droplets section keeps the `.autopour` class that `app.js` toggles. `select-ui.js` no longer shows a detail line under a select that has been enhanced, and `enhanceRail()` dispatches `flow:selects` so the line is dropped at startup. `enhanceSegmented` takes its title from the option text, because `select-ui.js` shortens `option.label`. `fluidListens` is a switch in Scene → The fluid, and its helper is in that section's HelpTip (decision 3). Fix: `quantizeBeats` option values are now canonical number strings (`0.5`, not `.5`), and `restore()` writes `String(Number(value))`. Before this, a saved grid came back as a number that matched no option, so the select (and now the Segmented) was blank after reload. `performance-ui`, `drift-ui`, `gesture-tools` and `octaves` pass unchanged because they find elements by id, not by structure. Orphaned `.performance-enable`, `.auto-title` and old `.gesture-guide` card rules remain in `style.css` for Phase 8.

### Phase 5 · Mix tab and dedupe
Add vertical faders that dim when their layer is off, unfold the lg knobs, and add the echo readout. Remove `layersFromMix` and `studioDelayBeats`, and make sure the studio drum knobs mirror the same state. Update `checks/delay-sync.test.mjs`. **Done when:** the layout matches the target, and echo spacing and drum space each have exactly one source of truth.

*Status: done (`rev=controls-5`).* Mix is five `control-section`s with no folds: Master, Layer levels, Melodic space, Percussion space and Echo spacing. `details#voiceEffects` and `details#drumEffects` became sections and kept their ids. The master label is now "Volume". The four level ranges carry `data-orientation="vertical"` in the markup. Each one sits in a `.fader` cell inside `.fader-row`, and its label's text (Droplets · Arpeggio · Percussion · Atmos) and `%` output join the cell's grid through `display:contents`. The controls-ui check now requires that only these four ranges are vertical, instead of requiring that no markup is. `DIM_WHEN_OFF` now accepts a range id as well as a section id, and it dims the range's `.fader` cell. `arpVolume`, `rhythmVolume` and `environmentVolume` follow their layer switches. Droplets has no switch, so its fader never dims. Because the dim replaces the `arpMixStatus`/`rhythmMixStatus`/`environmentMixStatus` On/Off labels, and `layersFromMix` is gone, `workspace-ui.js` had nothing left to do and was deleted along with its two uses in `app.js`. `dropletsMixHelp` has `data-help-tip`, so it moved into the Layer levels HelpTip and is still the droplets fader's `aria-describedby`. `KNOBS` gives `reverb` and `delay` `{lg:true}`. `buildKnob` now draws each size at its real geometry (sm 32, md 44, lg 64) instead of scaling the 44px SVG, which also gives sm knobs a true 2px stroke. `#mixPanel .knob-row` uses the kit's three columns. Echo spacing is the `voiceDelayBeats` Select plus `echoSyncLabel`, which is now an `<output class="range-readout">` written by `timing.js`'s new `echoReadout()` ("804 ms at 56 BPM", with "· 2×" or "· ½×" for rhythm speed). It replaces `echoLabel`, because the menu already names the division and the "shared by" copy is in the HelpTip. `rhythm-ui.js` writes it from `syncDelay()`, so it follows spacing, rhythm speed and tempo (`setBpm` → `resync`). `studioDelayBeats` is removed. `voiceDelayBeats` is the only spacing control, and `restore()` → `syncControls()` → `syncDelay()` writes saved `delayBeats` into it. `studioReverb`/`studioDelay` remain the allowed mirror of `rhythmReverb`/`rhythmDelay`, with `config.reverb`/`config.delay` as the single state. `syncControls()` now writes each `…Value` output before the range's value, so a mirrored knob's `aria-valuetext` no longer lags one step behind. The studio effects box is now two columns, and the orphaned `.studio-echo-spacing`, `.mix-state` and `.mini-row #voiceDelayBeats` rules were deleted.

### Phase 6 · Top bar, transport and canvas
This is the largest phase and touches the most state. Merge the two transport rows into one, add the Stepper and ChordStrip, move capture settings into a popover, and replace the take tray with a toast. Fold the session header into the top bar and remove the duplicate play buttons. Before starting, settle the **live vs take playback** open decision below. Update `app-smoke`, `recorder-ui`, `first-run` and `session-workspace`. **Done when:** one play button controls whatever is selected, and the canvas edge is clear apart from the palette pill.

Settled before starting (decisions 2 and 5, plus scope):
- **One Play button.** It acts on whatever is selected: a shared recording, then a selected take, then the live scene. While a take is selected, a chip by the ChordStrip says "Take · <name> ×", and × returns to live. `quickLive` goes away.
- **Mirrors.** `start` and `quickPlay` merge into the one transport button. `mobilePlay`, `presentPlay` and `studioPlay` stay as mirrors and call the same dispatcher, so none of them plays the live scene while a take is selected. Each is a different posture: on phones the transport sits behind the dock, Zen hides it, and beat studio is modal, which makes the transport inert while the dialog is open.
- **Sessions home.** The brand goes home (it already did, through `home()`), and `allSessions` keeps its id as the first item in the session menu ("All sessions").
- **Split.** 6a covers the top bar and canvas. 6b covers the one-row transport, the unified Play and take chip, ChordStrip, Stepper, Record with a capture popover, removal of the take tray, and the toast.

*Status: 6a done (`rev=controls-6`).* The session header is gone. `#sessionHeader` is now the top bar's title slot (`div.topbar-session`, same id, still toggled by `shell()`): the inline `sessionTitle`, then the session menu chevron, then `sessionSave` in mono. The chevron sits before the saved state on purpose. Blurring the title fires `change`, which flips the status from "Saved on this device" to "Saving…", and a chevron placed after the status jumped 86px mid-click, so the click landed on the slot instead. `sharedPreview` moved into the same slot (← Community · title · status). In Zen, the top bar stays visible with only that slot while a shared recording is open, which keeps the old "visible in Zen too" behavior. The session menu is a new kit primitive, `enhancePopover(trigger,panel,{menu})`: Escape, a click outside, or focus leaving closes it. As a menu, arrow keys, Home and End move between items, disabled items are skipped, and choosing an item runs its handler before the menu closes. `controls-ui.js` applies it from a new `POPOVERS` table in `enhanceChrome()`, which runs at startup after `enhanceRail()`. 6b's capture popover will reuse it. `allSessions`, `backupSession` and `newSession` are its `role=menuitem` buttons, with the same ids and handlers. `sessionOrigin` became the menu's eyebrow (`p.menu-note`) and the title's `aria-describedby`. The top bar reads brand · title slot · Community · Library · ? · Zen · Controls. On home, the edition tagline shows and the title slot and Zen are hidden. `#zen` is an expand icon button, and `toggleZen()` now sets its `aria-label`/`title` instead of rewriting its text. `#fullscreen` is a text button in the Zen strip before Exit Zen, labeled by `syncFullscreen()`, and hidden where the Fullscreen API is missing (the old fallback toggled Zen, which made no sense inside Zen). Leaving fullscreen still leaves Zen (`createPresentControls`). The canvas edge keeps the glass palette pill (swatches · Cycle colors) and `#clear` as a round glass icon button. `paletteHint` stays as an `sr-only` live region. Two `style.css` selectors used `.session-header~.workspace` to hide the legacy transport play group and `#recordBar`. They are re-anchored to `.topbar~.workspace`, because they would otherwise have reappeared, and 6b removes both. On mobile, the title slot is the top bar's third grid row, with the menu opening leftward. The Stepper, ChordStrip, the transport and the mirrors are untouched until 6b.

Settled before 6b:
- **Play keeps `#start`.** `quickPlay`, `quickLive` and `quickStop` are removed. `togglePlay()` in `app.js` is the one dispatcher for `start`, `mobilePlay`, `presentPlay` and `studioPlay`. It stops whatever is sounding, then plays a shared recording, else the selected take (looping per `quickLoop`), else the live scene.
- **Orphans.** `retryTakeSave` takes Record's slot while a take is unsaved, and an unsaved toast offers Retry. "Use this setup" is `recordBarFork` inside the take chip while a take or shared track plays. `quickUseSetup` is removed.
- **Placement.** The transport is one row under the canvas in every posture. `syncTransportLayout()` and `#zenTransportRow` are gone.
- **Zen toggles.** The row keeps the id `zenHarmonyRow`, and `zenHarmonyToggle` (now "Hide transport") collapses it. `zenTransportToggle` stays in the markup, hidden, for Phase 7 to delete.

*Status: 6b done (`rev=controls-6b`).*

**Transport row.** `#zenHarmonyRow` reads Play + status (`playLabel`, `audioState`, with `listeningHint` beside Play again) · ChordStrip + take chip · note readout · Stepper BPM · Record cluster. The cluster is `recordStart`, the capture chevron, the `recordBarTime` clock, `recordCancel` and the `quickLoop` icon toggle. On phones the dock owns Play, so the row is chords, then tempo and Record. The capture section, take tray and record bar are removed along with every `quick*` id except `quickLoop`.
- Also removed: `sessionTakes`, `captureLengthLabel`, `recordFinish`, `recordBarStop`, `recordBar`, `slower`, `faster` and `bpmLabel`.
- `recordProgress` is a 2px line under the cluster, and `recordBarStatus` stays as an sr-only live region.
- Both legacy hide rules (`.topbar~.workspace …`) are gone, and `.performance-playback #start` no longer dims, because Play now stops playback.

**New kit primitives** in `controls-kit.js`:
- `enhanceChordStrip(host)` decorates the chips `app.js` renders into `#chords`. Each chip is a grid column with `data-state` past/current/next and a 2px line, and there is one tab stop with arrow, Home and End navigation. It re-decorates on every re-render.
- `enhanceToast(host,{timeout})` treats `hidden` as the state. The toast hides after `data-timeout` (default 6000 ms, `0` keeps it). Hover or focus pauses it, and the action, × or Escape dismisses it.

**Wiring in `controls-ui.js`.** `enhanceChrome()` applies the new tables: `STEPPERS` (`bpm` with unit BPM, `recordCycles`), `CAPTURE_SEGMENTED` (`recordMode`), `CHORD_STRIPS`, `TOASTS`, and `POPOVERS.captureMenuButton` (a non-menu popover). `showBpm()` writes only `#bpm`.

**One Record control.** `recordStart` is the only Record control, and `recorder-ui.js` owns it. A press stops playback if needed, asks `workspace.beforeRecord()` and records. While recording, a press finishes on the next bar ("Finish at bar", then "Finishing…").
- The `r` key clicks it.
- `recordCancel` shows while a take is preparing, recording or saving, or during an export ("Cancel export").
- `beforeRecord()` names an unnamed take "<session> · Take n", and the name field's placeholder shows that default. A typed name wins and is cleared after the take saves. Without a session (a shared track), `kept()` still makes one from the take.

**Capture settings.** These sit in the popover with their ids unchanged. `recordMode`, `recordCycles` and `recordAutoLoop` now persist on this device under a new key, `flow-capture-v1`, because they had no persistence before.

**Toast and take chip.** After a take, `complete()` calls `workspace.takeFinished(take,saved)`. A saved take shows "Saved · Open in library", whose action clicks `recordLauncher`. An unsaved take shows a sticky "Take not saved · Retry".
- The take chip (`takeChip`, `takeChipName`, `takeChipClear`) names the playing track, else the session's selected take. A local selection is never shown while a shared track is open.
- On desktop the chip hangs under the ChordStrip, so the chords keep their width.
- × stops playback, clears the selection and drops `?take=`. Choosing a take in Library now also selects it for the session.
- "Play take" in the status follows the chip, so the label never promises a take you can't see.
- `recorder.playingTake` is new.

**Test updates.** `app-smoke` drives tempo through `#bpm` and checks that all four Play postures play a selected take. `recorder-ui` covers the retry slot and the hook. `session-workspace` covers the chip, ×, naming, toasts and capture persistence. `controls-ui` enhances the real transport markup.

**Left for Phase 8.** `.session-capture`, `.take-tray`, `.capture-options` and `.record-bar` rules remain in `style.css` as orphans.

### Phase 7 · Dialogs and Zen
Rebuild the Library as list + detail, port beat studio to StepGrid, switch Community to Tabs and TrackRows, and turn Zen and presentation into one glass strip. Update `recorder-ui`, `community-ui`, `presentation-*` and `rhythm-ui`. **Done when:** no dialog has more than 4 visible buttons before the overflow menu.

### Phase 8 · Mobile, accessibility, dead CSS
Check the rail at 375px. The mobile dock and `closeMobileControls` must still work, and Segmented controls with 7 options need a scroll fallback. Do a keyboard-only pass on every new component. Delete the CSS for removed structures from `style.css` (`.layer-editor`, `.nested-fold`, `.take-tray`, `.capture-options` and others). Run `benchmark-performance.mjs` to check that rendering cost didn't regress. **Done when:** an axe or keyboard pass is clean and `style.css` contains no orphaned selectors.

---

## Open decisions

Settle these before the phase that needs them.

1. **Layer editing while off (Phase 3).** The kit shows a layer's controls only when it's on. Today you can edit a layer while it's off. *Recommendation:* follow the kit. A layer you are tuning should be audible.
2. **Live vs take playback (Phase 6).** `start` plays the live scene, and `quickPlay` plays a selected take or the live scene. *Recommendation:* one Play button. When a take is selected, a chip by the ChordStrip says "Take · Morning, glass house ×" and clearing it returns to live. *Settled:* as recommended. The mobile, Zen and beat studio mirrors call the same dispatcher (see Phase 6).
3. **Fluid listens (Phase 4).** It is experimental and missing from the kit. *Recommendation:* a Switch in Scene → The fluid, with its helper text in a HelpTip.
4. **Glide (Phase 3).** The kit shows Glide as a main knob, but the source has a separate portamento switch and an amount control. *Recommendation:* keep all three inside the Note shape fold so the meaning of saved sessions doesn't change.
5. **Sessions home and new session (Phase 6).** Is the brand the right way back to the sessions list, or should the top bar keep an explicit "← Sessions"? *Settled:* the brand goes home, and "All sessions" (`allSessions`) is the first item in the session menu.
