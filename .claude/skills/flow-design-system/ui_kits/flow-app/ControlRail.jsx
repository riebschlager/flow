import React from 'react';

const pct = v => `${Math.round(v)}%`;
const ms = v => v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`;
const Knobs = ({ children, cols = 4 }) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, rowGap: 18, justifyItems: 'center' }}>{children}</div>;
const Field = ({ label, help, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ font: 'var(--type-label)', color: 'var(--text-2)', flex: 1 }}>{label}</span>{help && <HelpTip>{help}</HelpTip>}</div>
    {children}
  </div>
);
const Layer = ({ title, desc, on, onToggle, children }) => (
  <section style={{ borderTop: '1px solid var(--line)', padding: '18px 0' }}>
    <Switch label={title} description={desc} checked={on} onChange={onToggle} />
    <div style={{ display: 'grid', gridTemplateRows: on ? '1fr' : '0fr', transition: 'grid-template-rows var(--dur-3) var(--ease-out)' }}>
      <div style={{ overflow: 'hidden', minHeight: 0 }}><div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div></div>
    </div>
  </section>
);

const VIBES = [{ options: [{ value: 'stillwater', label: 'Still water' }, { value: 'glasshouse', label: 'Glass house' }, { value: 'nightgarden', label: 'Night garden' }, { value: 'softhorizon', label: 'Soft horizon' }, { value: 'breathingroom', label: 'Breathing room' }] },
  { label: 'Experimental', options: [{ value: 'glassorganisms', label: 'Glass organisms' }, { value: 'submergedcinema', label: 'Submerged cinema' }, { value: 'strangeattractor', label: 'Strange attractor' }, { value: 'orbitalrelay', label: 'Orbital relay' }] },
  { options: [{ value: 'custom', label: 'Your own atmosphere' }] }];
export const PROGRESSIONS = {
  daydream: ['Daydream', ['Cmaj7', 'Am7', 'Fmaj7', 'G'], 'Familiar major-seventh warmth with a gentle lift at the end.'],
  weightless: ['Weightless', ['Dmaj7', 'A', 'Bm7', 'Gmaj7']],
  afterhours: ['After hours', ['Am7', 'Fmaj7', 'Cmaj7', 'Em7']],
  openwater: ['Open water', ['Fmaj7', 'Cmaj7', 'Em7', 'Am7']],
  stilllight: ['Still light', ['Dbmaj9', 'Fm7', 'Bbm9', 'Gbmaj9']],
  bluehour: ['Blue hour', ['Dm9', 'G9', 'Cmaj9', 'Am9']],
  suspendedsky: ['Suspended sky', ['Csus2', 'Gsus4', 'Asus2', 'Fsus4']],
  duskturn: ['Dusk turn', ['Am', 'Bdim', 'E7', 'Am']],
};
const INSTRUMENTS = ['Soft keys', 'Warm strings', 'Airy choir', 'Glass bell', 'Celesta', 'Vibraphone', 'Pad · halo', 'Chaos'];

function SoundPanel({ s, set }) {
  const pal = PALETTES[s.palette].colors;
  return <>
    <Section title="Vibe" divider={false} help="Soft keys, warm strings, and a little shimmer.">
      <Select groups={VIBES} value={s.vibe} onChange={v => set({ vibe: v })} ariaLabel="Choose a vibe" />
    </Section>
    <Section title="Chord progression" help={PROGRESSIONS[s.prog][2] || 'A different path through the harmony.'}>
      <Select value={s.prog} onChange={v => set({ prog: v })} ariaLabel="Chord progression"
        options={Object.entries(PROGRESSIONS).map(([k, [n, c]]) => ({ value: k, label: `${n} · ${c.join(' → ')}` })).concat([{ value: 'custom', label: 'Custom progression…' }])} />
      <Field label="Chord length"><Segmented full value={s.chordLen} onChange={v => set({ chordLen: v })} options={[{ value: 4, label: '4 beats' }, { value: 8, label: '8 beats' }, { value: 16, label: '16 beats' }]} /></Field>
    </Section>
    <Section title="Color voices" help="28 voices, plus Chaos: a random instrument for each droplet of that color. Chaos loads all voices once; first use may take a moment.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pal.map(([n, c], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 76px 1fr', alignItems: 'center', gap: 10 }}>
            <i style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-2)' }}>{n}</span>
            <Select size="sm" value={s.voices[i]} onChange={v => set({ voices: s.voices.map((x, j) => j === i ? v : x) })} options={INSTRUMENTS} ariaLabel={`${n} instrument`} />
          </div>
        ))}
      </div>
    </Section>
  </>;
}

function LayersPanel({ s, set, openBeats }) {
  return <>
    <Layer title="Arpeggiator" desc="One voice, unfolding through chords or scales" on={s.arp} onToggle={v => set({ arp: v })}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Select size="sm" label="Voice" options={INSTRUMENTS} defaultValue="Celesta" />
        <Select size="sm" label="Notes from" options={['Current chord', 'Scale']} />
      </div>
      <Field label="Note rate"><Segmented full size="sm" defaultValue="1/8" options={['1', '½', '¼', '1/8', '1/16', '1/32', '⅛T'].map(x => ({ value: x === '⅛T' ? '1/8T' : x, label: x }))} /></Field>
      <Knobs cols={3}>
        <Knob label="Probability" min={0} max={100} step={1} defaultValue={100} format={pct} />
        <Knob label="Pool" min={1} max={16} step={1} defaultValue={8} format={v => `${v} notes`} />
        <Knob label="Glide" min={0} max={2000} skew={2.5} defaultValue={180} format={ms} />
      </Knobs>
      <Fold title="Note shape" summary="A 20 ms · D 120 ms · S 65%">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <EnvelopeGraph attack={s.atk} decay={s.dec} sustain={s.sus / 100} length={s.len / 100} active={s.envActive} />
          <Knobs>
            {[['Length', 'len', 10, 400, pct, 1], ['Attack', 'atk', 0, 2000, ms, 2.5], ['Decay', 'dec', 0, 2000, ms, 2.5], ['Sustain', 'sus', 0, 100, pct, 1]].map(([l, k, mn, mx, f, sk]) => (
              <div key={k} onPointerEnter={() => set({ envActive: { len: 'r', atk: 'a', dec: 'd', sus: 's' }[k] })} onPointerLeave={() => set({ envActive: null })}>
                <Knob size="sm" label={l} min={mn} max={mx} skew={sk} step={k === 'len' || k === 'sus' ? 1 : 0} value={s[k]} defaultValue={{ len: 85, atk: 20, dec: 120, sus: 65 }[k]} format={f} onChange={v => set({ [k]: v })} />
              </div>
            ))}
          </Knobs>
        </div>
      </Fold>
    </Layer>
    <Layer title="Percussion" desc="An optional heartbeat for the scene" on={s.perc} onToggle={v => set({ perc: v })}>
      <Field label="Start with a groove">
        <div style={{ display: 'flex', gap: 8 }}><div style={{ flex: 1 }}><Select options={['Heartbeat', 'Soft brushes', 'Glass tide', 'Slow pulse']} /></div><Button icon={<Icon name="spark" size={14} />}>Vary</Button></div>
      </Field>
      <Field label="Rhythm speed"><Segmented full defaultValue={1} options={[{ value: 0.5, label: '½×' }, { value: 1, label: '1×' }, { value: 2, label: '2×' }]} /></Field>
      <Knobs cols={3}>
        <Knob label="Swing" min={0} max={60} step={1} defaultValue={12} format={pct} />
        <Knob label="Humanize" min={0} max={100} step={1} defaultValue={15} format={pct} />
      </Knobs>
      <Button full iconRight={<Icon name="arrow-up-right" size={14} />} onClick={openBeats}>Open beat studio</Button>
    </Layer>
    <Layer title="Atmospherics" desc="A world behind the music" on={s.env} onToggle={v => set({ env: v })}>
      <Select options={['Soft rain', 'Tidal shore', 'Canopy wind', 'Summer night', 'Hearth']} ariaLabel="Environment" />
      <Knobs cols={3}>
        <Knob label="Activity" min={0} max={100} step={1} defaultValue={40} format={pct} />
        <Knob label="Tone" min={-50} max={50} step={1} bipolar defaultValue={0} format={v => v === 0 ? 'Even' : v < 0 ? `Warm ${-v}` : `Crisp ${v}`} />
      </Knobs>
    </Layer>
  </>;
}

const GESTURES = [['Touch & place', 'Left-click for a note. Height makes a clear change: bright and light at the top; warm, fuller and longer at the bottom.'], ['Silk ↔ rush', 'Slow strokes make soft attacks, long notes and broad ribbons. Fast strokes make short, bright attacks.'], ['Gather & bloom', 'Hold still to grow a ring. Release to fan out four current-chord tones.'], ['Orbit', 'Draw circles while painting to rotate the whole mix in stereo.'], ['Conduct · right-drag / Shift', 'Drag down to close the filter; up to open it. Left or right to pan.'], ['Space · Alt / Option', 'Drag up for more reverb and right for stronger tempo-synced echoes.']];

function PlayPanel({ s, set }) {
  return <>
    <Section title="Canvas tool" divider={false} help="Mouse shortcuts: right-drag or Shift + drag to Conduct; Alt / Option + drag for Space. Select a tool here for touch or trackpad.">
      <Segmented full value={s.tool} onChange={v => set({ tool: v })} options={['Paint', 'Conduct', 'Space', 'Orbit']} />
      <Knobs cols={3}><Knob label="Intensity" min={0} max={100} step={1} defaultValue={65} format={pct} /></Knobs>
    </Section>
    <Section title="Automatic droplets">
      <Switch label="Let the scene unfold" checked={s.auto} onChange={v => set({ auto: v })} />
      <Slider label="Droplet pace" value={s.pace} onChange={v => set({ pace: v })} defaultValue={35} format={v => v < 30 ? 'Unhurried' : v < 65 ? 'Steady' : 'Lively'} disabled={!s.auto} />
    </Section>
    <Section title="Quantize" help="Snaps every splash and note to the next grid line after its fall. Follows the percussion clock.">
      <Switch label="Let droplets fall into rhythm" checked={s.quant} onChange={v => set({ quant: v })} />
      {s.quant && <Segmented full size="sm" defaultValue="1/8" options={['¼', '1/8', '1/16', '1/32', '⅛T']} />}
    </Section>
    <Section title="Pitch range" help="Left to right chooses pitch and stereo position. Up high is lighter and brighter; down low is fuller, warmer, and longer.">
      <Field label="Octaves below"><Segmented full size="sm" defaultValue={0} options={[0, 1, 2, 3]} /></Field>
      <Field label="Octaves above"><Segmented full size="sm" defaultValue={1} options={[0, 1, 2, 3]} /></Field>
      <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>C3 → B4 · 8 notes</span>
    </Section>
    <Section title="Drift" help="A gentle performer after you let go. Drift plays when you leave the canvas alone.">
      <Switch label="Drift" description="A gentle performer after you let go" defaultChecked />
      <Switch label="Wander harmony" description="Related chords, slowly" defaultChecked />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Select size="sm" label="Style" options={['Free drift', 'Breathe · 4–4', 'Breathe · 4–7–8', 'Breathe · box 4–4–4–4']} />
          <Select size="sm" label="Sleep timer" options={['Off', '15 minutes', '30 minutes', '45 minutes', '60 minutes', '90 minutes']} />
        </div>
        <Knob label="Interval" min={1} max={12} step={1} defaultValue={3} format={v => `${v} s`} />
      </div>
    </Section>
    <Section title="Gestures" action={<Button size="sm" variant="ghost" icon={<Icon name="spark" size={13} />}>Release a bloom</Button>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GESTURES.map(([t, d], i) => (
          <div key={t} style={{ display: 'grid', gridTemplateColumns: '22px 1fr', gap: 8 }}>
            <span style={{ font: '400 11px/1.5 var(--font-mono)', color: 'var(--text-3)' }}>0{i + 1}</span>
            <div><div style={{ font: '500 12px/1.4 var(--font-sans)' }}>{t}</div><div style={{ font: '400 12px/1.45 var(--font-sans)', color: 'var(--text-3)' }}>{d}</div></div>
          </div>
        ))}
      </div>
    </Section>
  </>;
}

function ScenePanel({ s, set }) {
  return <>
    <Section title="Energy" divider={false} help="A softer glow or more visible currents. Your sound stays the same.">
      <Slider value={s.energy} onChange={v => set({ energy: v })} defaultValue={60} format={pct} extents={['Lights down', 'Vivid']} ariaLabel="Energy" />
    </Section>
    <Section title="Color palette" help="Recolors the whole scene. Your four voices stay in place.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {Object.entries(PALETTES).map(([k, p]) => {
          const on = s.palette === k;
          return (
            <button key={k} type="button" onClick={() => set({ palette: k })} aria-pressed={on}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--r-2)', border: 0, cursor: 'pointer', textAlign: 'left',
                background: on ? 'var(--bg-well)' : 'transparent', boxShadow: on ? 'inset 0 0 0 1px var(--line-strong)' : 'none' }}>
              <span style={{ display: 'flex' }}>{p.colors.map(([, c], i) => <i key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c, marginLeft: i ? -3 : 0, boxShadow: '0 0 0 1.5px var(--bg-panel)' }} />)}</span>
              <span style={{ font: '400 12px/1 var(--font-sans)', color: on ? 'var(--text-1)' : 'var(--text-2)' }}>{p.name}</span>
            </button>
          );
        })}
      </div>
    </Section>
    <Section title="The fluid">
      <Knobs cols={3}>
        <Knob label="Swirl" min={0} max={100} step={1} defaultValue={60} format={pct} />
        <Knob label="Persistence" min={0} max={100} step={1} defaultValue={70} format={pct} />
        <Knob label="Droplet size" min={0} max={100} step={1} defaultValue={45} format={pct} />
      </Knobs>
    </Section>
    <Section title="Living water" action={<Switch checked={s.water} onChange={v => set({ water: v })} ariaLabel="Living water" />}>
      <Segmented full size="sm" defaultValue="Gentle sea" options={['Gentle sea', 'Glassy water', 'Sunlit lagoon']} />
      <Knobs cols={3}>
        <Knob size="sm" label="Swell" min={0} max={100} step={1} defaultValue={45} format={pct} disabled={!s.water} />
        <Knob size="sm" label="Drift" min={0} max={100} step={1} defaultValue={30} format={pct} disabled={!s.water} />
        <Knob size="sm" label="Refraction" min={0} max={100} step={1} defaultValue={40} format={pct} disabled={!s.water} />
        <Knob size="sm" label="Caustics" min={0} max={100} step={1} defaultValue={35} format={pct} disabled={!s.water} />
        <Knob size="sm" label="Reflections" min={0} max={100} step={1} defaultValue={40} format={pct} disabled={!s.water} />
        <Knob size="sm" label="Chord glow" min={0} max={100} step={1} defaultValue={65} format={pct} />
      </Knobs>
    </Section>
    <Section title="Percussion response">
      <Segmented full size="sm" defaultValue="both" options={[{ value: 'both', label: 'Ripples + stir' }, { value: 'rip', label: 'Ripples' }, { value: 'stir', label: 'Stir' }]} />
      <Slider label="Visual strength" defaultValue={45} format={pct} extents={['Still', 'Tidal']} />
    </Section>
  </>;
}

function MixPanel({ s, set }) {
  return <>
    <Section title="Master" divider={false} help="The level of the whole composition. A balanced output with gentle peak protection.">
      <Slider label="Volume" value={s.master} onChange={v => set({ master: v })} defaultValue={70} format={pct} />
    </Section>
    <Section title="Layer levels">
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0' }}>
        {[['Droplets', 80, 'var(--voice-1)'], ['Arpeggio', 55], ['Percussion', 40], ['Atmos', 30]].map(([l, v]) => (
          <Slider key={l} orientation="vertical" length={150} label={l} defaultValue={v} format={pct} />
        ))}
      </div>
    </Section>
    <Section title="Melodic space" help="Reverb & delay for color voices and arpeggio.">
      <Knobs cols={3}>
        <Knob size="lg" label="Reverb" min={0} max={100} step={1} defaultValue={65} format={pct} />
        <Knob size="lg" label="Delay" min={0} max={100} step={1} defaultValue={35} format={pct} />
      </Knobs>
    </Section>
    <Section title="Percussion space">
      <Knobs cols={3}>
        <Knob label="Reverb" min={0} max={100} step={1} defaultValue={10} format={pct} />
        <Knob label="Delay" min={0} max={100} step={1} defaultValue={0} format={pct} />
      </Knobs>
    </Section>
    <Section title="Echo spacing" help="Shared by voices, drums and whole-scene echoes; amounts stay independent.">
      <Select defaultValue="Dotted ⅛" options={['1/16 note', '⅛ triplet', '⅛ note', 'Dotted ⅛', '¼ note', 'Dotted ¼', '½ note', 'Whole note · 1 bar']} ariaLabel="Echo spacing" />
      <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>804 ms at {s.bpm} BPM</span>
    </Section>
  </>;
}

const TABS = [['sound', 'Sound', 'Choose your sounds. Give the music a direction.'], ['layers', 'Layers', 'A soft pulse, a little rain, or just the notes.'], ['play', 'Play', 'Add a little of yourself.'], ['scene', 'Scene', 'Color, light and water.'], ['mix', 'Mix', 'Levels and space.']];

export function ControlRail({ s, set, openBeats }) {
  const P = { sound: SoundPanel, layers: LayersPanel, play: PlayPanel, scene: ScenePanel, mix: MixPanel }[s.tab];
  const desc = TABS.find(t => t[0] === s.tab)[2];
  return (
    <aside style={{ width: 'var(--rail-w)', flex: 'none', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-panel)', borderLeft: '1px solid var(--line)' }}>
      <div style={{ padding: '16px 24px 0' }}>
        <Tabs items={TABS.map(([id, label]) => ({ id, label }))} value={s.tab} onChange={t => set({ tab: t })} />
        <p style={{ margin: '14px 0 0', font: '400 13px/1.45 var(--font-sans)', color: 'var(--text-2)' }}>{desc}</p>
      </div>
      <div key={s.tab} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 24px 32px', animation: 'flowFadeIn var(--dur-3) var(--ease-out)' }}>
        <P s={s} set={set} openBeats={openBeats} />
      </div>
    </aside>
  );
}
