import React from 'react';

const V = ['var(--voice-1)', 'var(--voice-2)', 'var(--voice-3)', 'var(--voice-4)'];
const pct = v => `${Math.round(v)}%`;

export function BeatStudio({ open, onClose, bpm, playing, onPlay, step }) {
  const [voices, setVoices] = React.useState([
    { name: 'Soft kick', color: V[0], steps: [3, 0, 0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0] },
    { name: 'Brush', color: V[1], steps: [0, 0, 2, 0, 0, 1, 2, 0, 0, 0, 2, 0, 0, 1, 2, 0] },
    { name: 'Glass bell', color: V[2], steps: [0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0] },
    { name: 'Shaker', color: V[3], steps: [1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 0, 1, 0, 2, 1] },
  ]);
  return (
    <Dialog open={open} onClose={onClose} width={960} eyebrow="The rhythm beneath the color" title="Beat studio" subtitle="A gentle pulse, if that’s your mood."
      actions={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ font: '400 13px/1 var(--font-mono)', color: 'var(--text-2)' }}>{bpm} BPM</span>
        <Button variant={playing ? 'secondary' : 'primary'} size="sm" icon={<Icon name={playing ? 'pause' : 'play'} size={12} strokeWidth={playing ? 2.5 : 1.5} />} onClick={onPlay}>{playing ? 'Pause scene' : 'Play scene'}</Button>
      </div>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0 18px' }}>
        <div style={{ width: 220 }}><Select size="sm" options={['Heartbeat', 'Soft brushes', 'Glass tide', 'Slow pulse']} ariaLabel="Groove" /></div>
        <Button size="sm" icon={<Icon name="spark" size={13} />}>New variation</Button>
        <Button size="sm" variant="ghost" onClick={() => setVoices(v => v.map(x => ({ ...x, steps: x.steps.map(() => 0) })))}>Clear all</Button>
        <span style={{ flex: 1 }} />
        {[['Ghost', 1], ['Hit', 2], ['Accent', 3]].map(([l, k]) => (
          <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, font: '400 11px/1 var(--font-sans)', color: 'var(--text-3)' }}>
            <i style={{ width: 10, height: 10, borderRadius: 2, background: k === 3 ? 'var(--n-800)' : k === 2 ? 'var(--n-500)' : 'transparent', boxShadow: k === 1 ? 'inset 0 0 0 1px var(--n-500)' : 'none' }} />{l}
          </span>
        ))}
        <HelpTip>Tap a step: off → ghost → hit → accent. Click a voice’s dot to mute it. Arrow keys move between steps.</HelpTip>
      </div>
      <StepGrid voices={voices} playhead={playing ? step : -1}
        onStep={(vi, i, s) => setVoices(o => o.map((x, j) => j !== vi ? x : { ...x, steps: x.steps.map((y, k) => k === i ? s : y) }))}
        onMute={vi => setVoices(o => o.map((x, j) => j !== vi ? x : { ...x, muted: !x.muted }))} />
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40, alignItems: 'center', marginTop: 26, paddingTop: 22, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Select size="sm" label="Percussion kit" options={['Felt & glass', 'Hand drums', 'Tuned objects', 'Rain stick']} />
          <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>One loop · 16 steps · follows the scene’s tempo</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 28 }}>
          <Knob label="Swing" min={0} max={60} step={1} defaultValue={12} format={pct} />
          <Knob label="Humanize" min={0} max={100} step={1} defaultValue={15} format={pct} />
          <Knob label="Drum reverb" min={0} max={100} step={1} defaultValue={10} format={pct} />
          <Knob label="Drum delay" min={0} max={100} step={1} defaultValue={0} format={pct} />
        </div>
      </div>
    </Dialog>
  );
}

const TAKES = [
  { title: 'Morning, glass house', duration: '2:16', meta: 'Today · 2 cycles' },
  { title: 'Low tide', duration: '4:02', meta: 'Yesterday · 4 cycles' },
  { title: 'Untitled take', duration: '0:48', meta: 'Oct 28 · manual' },
];

export function Library({ open, onClose, palette }) {
  const [sel, setSel] = React.useState(0), [pl, setPl] = React.useState(-1);
  const t = TAKES[sel];
  return (
    <Dialog open={open} onClose={onClose} width={900} eyebrow="Found something you love?" title="Recording library" subtitle="Keep a favorite stretch of music as a replayable loop. Saved in this browser; no account needed.">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 32 }}>
        <div>
          <div style={{ font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)', margin: '4px 0 8px' }}>Saved recordings</div>
          {TAKES.map((x, i) => <TrackRow key={i} {...x} author="" selected={sel === i} playing={pl === i} colors={palette} onSelect={() => setSel(i)} onPlay={() => setPl(pl === i ? -1 : i)} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: 20, borderRadius: 'var(--r-3)', background: 'var(--bg-raised)', boxShadow: 'inset 0 0 0 1px var(--line)' }}>
          <input defaultValue={t.title} key={t.title} aria-label="Take name" style={{ background: 'transparent', border: 0, borderBottom: '1px solid var(--line-strong)', padding: '4px 0 8px', color: 'var(--text-1)', font: '400 18px/1.2 var(--font-sans)', letterSpacing: '-0.01em', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="primary" size="sm" icon={<Icon name="loop" size={13} />} onClick={() => setPl(sel)}>Play loop</Button>
            <Button size="sm" icon={<Icon name="play" size={11} />}>Play once</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Knob size="sm" label="Seam blend" min={0} max={400} step={5} defaultValue={80} format={v => `${v} ms`} />
            <p style={{ margin: 0, font: '400 12px/1.45 var(--font-sans)', color: 'var(--text-3)' }}>For earlier audio takes: blend the recorded tail into the opening.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <span style={{ font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)' }}>Export clip</span>
            <Segmented full size="sm" defaultValue={30} options={[{ value: 15, label: '15 s' }, { value: 30, label: '30 s' }, { value: 60, label: '60 s' }]} />
            <Segmented full size="sm" defaultValue="9:16" options={['9:16', '1:1', '16:9']} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" full icon={<Icon name="download" size={13} />}>Export clip</Button>
              <Button size="sm" full icon={<Icon name="download" size={13} />}>Loop WAV</Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" icon={<Icon name="share" size={13} />}>Share selected take</Button>
        </div>
      </div>
    </Dialog>
  );
}

const SHARED = [
  { title: 'Low tide at the glass house', author: 'mara', meta: 'Glass house', duration: '3:12', likes: 48, p: 'tide' },
  { title: 'four a.m. kettle', author: 'ollie_w', meta: 'Night garden', duration: '5:40', likes: 31, p: 'ember' },
  { title: 'Breathing room, slower', author: 'jun', meta: 'Breathing room', duration: '8:02', likes: 27, p: 'porcelain' },
  { title: 'Submerged', author: 'teodora', meta: 'Submerged cinema', duration: '2:58', likes: 19, p: 'afterglow' },
  { title: 'Botanical study no. 3', author: 'fern', meta: 'Soft horizon', duration: '4:21', likes: 12, p: 'garden' },
];

export function Community({ open, onClose }) {
  const [tab, setTab] = React.useState('today'), [pl, setPl] = React.useState(-1), [liked, setLiked] = React.useState({ 0: true });
  return (
    <Dialog open={open} onClose={onClose} width={820} eyebrow="Authored by humans" title="Made by people. Shared with you."
      subtitle="Explore ambient music shaped and shared by the people who use Flow. Listening is free, no account needed."
      actions={<Button size="sm" variant="ghost" iconRight={<Icon name="arrow-up-right" size={13} />}>Sign in to share</Button>}>
      <Tabs size="sm" value={tab} onChange={setTab} items={[{ id: 'today', label: 'Today' }, { id: 'week', label: 'This week' }, { id: 'all', label: 'All time' }, { id: 'new', label: 'New discoveries' }, { id: 'mine', label: 'My shared tracks' }]} />
      <div style={{ paddingTop: 10 }}>
        {SHARED.map((x, i) => (
          <TrackRow key={i} {...x} colors={PALETTES[x.p].colors.map(c => c[1])} playing={pl === i} liked={!!liked[i]} likes={x.likes + (liked[i] && i ? 1 : 0)}
            onPlay={() => setPl(pl === i ? -1 : i)} onLike={() => setLiked(l => ({ ...l, [i]: !l[i] }))} />
        ))}
      </div>
      <div style={{ marginTop: 14, font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>Ranked by likes received since midnight UTC</div>
    </Dialog>
  );
}

export function ZenStrip({ playing, onPlay, energy, onEnergy, onExit, onTitle }) {
  const [shown, setShown] = React.useState(true), [title, setTitle] = React.useState('');
  React.useEffect(() => { const t = setTimeout(() => setShown(false), 2600); return () => clearTimeout(t); }, []);
  return (
    <div onPointerDown={e => e.stopPropagation()} onMouseEnter={() => setShown(true)} onMouseLeave={() => setShown(false)}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '8px 10px 8px 8px', borderRadius: 999, background: 'var(--bg-glass)', backdropFilter: 'var(--blur-glass)', WebkitBackdropFilter: 'var(--blur-glass)', boxShadow: '0 0 0 1px var(--line), 0 12px 40px rgba(0,0,0,.4)',
        opacity: shown ? 1 : 0, transform: `translateY(${shown ? 0 : 8}px)`, transition: 'opacity var(--dur-3) var(--ease-out), transform var(--dur-3) var(--ease-out)' }}>
        <IconButton variant="primary" round label={playing ? 'Pause' : 'Play'} onClick={onPlay}><Icon name={playing ? 'pause' : 'play'} size={14} strokeWidth={playing ? 2.5 : 1.5} /></IconButton>
        <div style={{ width: 160 }}><Slider value={energy} onChange={onEnergy} label="Energy" format={pct} defaultValue={60} /></div>
        <Select size="sm" inline full={false} options={['Sleep off', '15 min', '30 min', '60 min', '90 min']} ariaLabel="Sleep timer" />
        <form onSubmit={e => { e.preventDefault(); onTitle(title); }} style={{ display: 'flex', gap: 6 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Write in the water" style={{ width: 170, height: 28, padding: '0 10px', background: 'var(--bg-well)', border: '1px solid var(--line)', borderRadius: 'var(--r-2)', color: 'var(--text-1)', font: '400 12px/1 var(--font-sans)', outline: 'none' }} />
          <Button size="sm" type="submit">Write title</Button>
        </form>
        <Button size="sm" variant="ghost" onClick={onExit}>Exit Zen</Button>
      </div>
    </div>
  );
}
