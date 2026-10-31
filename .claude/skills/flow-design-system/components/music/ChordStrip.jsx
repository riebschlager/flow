import React from 'react';

export function ChordStrip({ chords, current = 0, progress = 0 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${chords.length}, minmax(0, 1fr))`, gap: 4 }} aria-label="Chord progression">
      {chords.map((c, i) => {
        const on = i === current;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 2px' }}>
            <span style={{ font: `${on ? 500 : 400} 15px/1 var(--font-sans)`, letterSpacing: '-0.01em', color: on ? 'var(--text-1)' : 'var(--text-3)', transition: 'color var(--dur-3)', whiteSpace: 'nowrap' }}>{c}</span>
            <span style={{ height: 2, borderRadius: 1, background: 'var(--n-300)', overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: on ? `${progress * 100}%` : i < current ? '100%' : '0%', background: on ? 'var(--accent)' : 'var(--n-500)' }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
