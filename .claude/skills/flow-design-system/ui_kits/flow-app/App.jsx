import React from 'react';

const NOTES = ['C4', 'E4', 'G4', 'B4', 'A3', 'C5', 'F4', 'D4'];

export function App() {
  const [s, setS] = React.useState(() => ({
    tab: 'sound', vibe: 'stillwater', prog: 'daydream', chordLen: 8, voices: ['Soft keys', 'Warm strings', 'Glass bell', 'Airy choir'],
    arp: true, perc: false, env: true, len: 85, atk: 20, dec: 120, sus: 65, envActive: null,
    tool: 'Paint', auto: true, pace: 35, quant: false, energy: 60, palette: 'classic', water: true, master: 70, bpm: 56,
    ...(JSON.parse(localStorage.getItem('flow-kit') || '{}')),
  }));
  const set = p => setS(o => ({ ...o, ...p }));
  React.useEffect(() => { const { envActive, ...keep } = s; localStorage.setItem('flow-kit', JSON.stringify(keep)); }, [s]);

  const [title, setTitle] = React.useState('Untitled session');
  const [playing, setPlaying] = React.useState(false);
  const [rail, setRail] = React.useState(true);
  const [voice, setVoice] = React.useState(null), [cycle, setCycle] = React.useState(true);
  const [dlg, setDlg] = React.useState(null), [zen, setZen] = React.useState(false), [titleCard, setTitleCard] = React.useState('');
  const [clock, setClock] = React.useState(0), [rec, setRec] = React.useState(false), [recT, setRecT] = React.useState(0), [loop, setLoop] = React.useState(true);

  React.useEffect(() => {
    if (!playing) return;
    let raf, last = performance.now();
    const tick = now => { const dt = (now - last) / 1000; last = now; setClock(c => c + dt * s.bpm / 60); if (rec) setRecT(t => t + dt); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, s.bpm, rec]);

  const chords = PROGRESSIONS[s.prog] ? PROGRESSIONS[s.prog][1] : PROGRESSIONS.daydream[1];
  const beatsPer = s.chordLen, chord = Math.floor(clock / beatsPer) % chords.length, progress = (clock % beatsPer) / beatsPer;
  const step = Math.floor(clock * 4) % 16;
  const noteIdx = Math.floor(clock * 1.5);
  const pal = PALETTES[s.palette].colors;
  const note = playing ? { pitch: NOTES[noteIdx % NOTES.length], voice: pal[noteIdx % 4][0] } : null;

  React.useEffect(() => { const k = e => { if (e.key === 'Escape' && zen) setZen(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [zen]);

  return (
    <div style={{ height: '100vh', minWidth: 1180, display: 'flex', flexDirection: 'column', background: 'var(--bg-app)' }}>
      {!zen && <TopBar title={title} onTitle={setTitle} saved onCommunity={() => setDlg('community')} onLibrary={() => setDlg('library')} railOpen={rail} onToggleRail={() => setRail(!rail)} onZen={() => setZen(true)} />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Canvas playing={playing} palette={s.palette} voice={voice} onVoice={setVoice} cycle={cycle} onCycle={setCycle} energy={s.energy} zen={zen} titleCard={zen && titleCard}>
            {zen && <ZenStrip playing={playing} onPlay={() => setPlaying(!playing)} energy={s.energy} onEnergy={v => set({ energy: v })} onExit={() => { setZen(false); setTitleCard(''); }} onTitle={setTitleCard} />}
            {!zen && <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', right: 14, top: 12 }}><Button variant="ghost" size="sm" iconRight={<Icon name="arrow-up-right" size={13} />} onClick={() => setZen(true)}>Zen view</Button></div>}
          </Canvas>
          {!zen && <Transport playing={playing} onPlay={() => setPlaying(!playing)} chords={chords} chord={chord} progress={progress} bpm={s.bpm} onBpm={v => set({ bpm: v })}
            recording={rec} onRecord={() => { if (!rec) { setRecT(0); setPlaying(true); setRec(true); } else { setRec(false); setDlg('library'); } }} recTime={recT} loop={loop} onLoop={() => setLoop(!loop)} note={note} />}
        </main>
        {!zen && rail && <ControlRail s={s} set={set} openBeats={() => setDlg('beats')} />}
      </div>
      <BeatStudio open={dlg === 'beats'} onClose={() => setDlg(null)} bpm={s.bpm} playing={playing} onPlay={() => setPlaying(!playing)} step={step} />
      <Library open={dlg === 'library'} onClose={() => setDlg(null)} palette={pal.map(c => c[1])} />
      <Community open={dlg === 'community'} onClose={() => setDlg(null)} />
    </div>
  );
}
