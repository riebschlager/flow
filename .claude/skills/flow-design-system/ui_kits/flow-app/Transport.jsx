import React from 'react';

export function Transport({ playing, onPlay, chords, chord, progress, bpm, onBpm, recording, onRecord, recTime, loop, onLoop, note }) {
  const t = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  return (
    <div style={{ height: 76, flex: 'none', display: 'grid', gridTemplateColumns: 'auto minmax(220px,1fr) auto auto auto', alignItems: 'center', gap: 28, padding: '0 20px', borderTop: '1px solid var(--line)', background: 'var(--bg-app)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 190 }}>
        <IconButton size="lg" variant="primary" round label={playing ? 'Pause' : 'Play'} onClick={onPlay}>
          <Icon name={playing ? 'pause' : 'play'} size={18} strokeWidth={playing ? 2.25 : 1.5} />
        </IconButton>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: '500 13px/1 var(--font-sans)' }}>{playing ? 'Playing' : 'Play'}</span>
          <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-3)' }}>{playing ? 'Automatic droplets on' : 'When you’re ready'}</span>
        </div>
      </div>
      <div style={{ maxWidth: 420 }}><ChordStrip chords={chords} current={chord} progress={progress} /></div>
      <div style={{ width: 56, textAlign: 'center' }}>
        <div style={{ font: '400 18px/1 var(--font-mono)', color: note ? 'var(--text-1)' : 'var(--text-off)', transition: 'color var(--dur-3)' }}>{note ? note.pitch : '—'}</div>
        <div style={{ marginTop: 5, font: '400 11px/1 var(--font-sans)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{note ? note.voice : 'Note'}</div>
      </div>
      <Stepper value={bpm} onChange={onBpm} min={30} max={160} unit="BPM" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 24, borderLeft: '1px solid var(--line)', height: 40 }}>
        <Button variant="record" size="sm" icon={<span style={{ width: 8, height: 8, borderRadius: recording ? 2 : '50%', background: 'currentColor', animation: recording ? 'flowPulse 1.2s ease-in-out infinite' : 'none' }} />} onClick={onRecord}>
          {recording ? 'Finish at bar' : 'Record'}
        </Button>
        <span style={{ font: '400 13px/1 var(--font-mono)', color: recording ? 'var(--rec)' : 'var(--text-3)', width: 44, fontVariantNumeric: 'tabular-nums' }}>{t(recTime)}</span>
        <IconButton size="sm" label="Loop" active={loop} onClick={onLoop}><Icon name="loop" size={15} /></IconButton>
      </div>
    </div>
  );
}
