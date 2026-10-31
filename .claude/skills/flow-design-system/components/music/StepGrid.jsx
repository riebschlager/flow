import React from 'react';

const STATES = ['off', 'ghost', 'hit', 'accent'];

function Cell({ s, color, head, onClick }) {
  const [h, setH] = React.useState(false);
  const bg = s === 3 ? color : s === 2 ? `color-mix(in oklab, ${color} 55%, var(--n-150))` : h ? 'var(--bg-hover)' : 'var(--bg-well)';
  return (
    <button type="button" aria-label={STATES[s]} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ aspectRatio: '1', minWidth: 0, padding: 0, border: 0, borderRadius: 'var(--r-1)', cursor: 'pointer', position: 'relative', background: bg,
        boxShadow: s === 1 ? `inset 0 0 0 1px color-mix(in oklab, ${color} 60%, transparent)` : s === 3 ? `0 0 12px color-mix(in oklab, ${color} 45%, transparent)` : 'none',
        outline: head ? '1px solid rgba(255,255,255,.28)' : 'none', outlineOffset: 1,
        transform: head && s > 0 ? 'scale(1.06)' : 'none', transition: 'background var(--dur-1), transform var(--dur-1) var(--ease-out)' }} />
  );
}

export function StepGrid({ voices, playhead = -1, onStep, onMute, steps = 16 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {voices.map((v, vi) => (
        <div key={vi} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 12, opacity: v.muted ? 0.4 : 1, transition: 'opacity var(--dur-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button type="button" aria-pressed={!v.muted} aria-label={`${v.muted ? 'Unmute' : 'Mute'} ${v.name}`} onClick={() => onMute && onMute(vi)}
              style={{ width: 10, height: 10, flex: 'none', padding: 0, borderRadius: '50%', cursor: 'pointer', border: `1.5px solid ${v.color}`, background: v.muted ? 'transparent' : v.color }} />
            <span style={{ font: '500 12px/1.2 var(--font-sans)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${steps / 4}, 1fr)`, gap: 10 }}>
            {Array.from({ length: steps / 4 }, (_, g) => (
              <div key={g} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {Array.from({ length: 4 }, (_, k) => {
                  const i = g * 4 + k;
                  return <Cell key={i} s={v.steps[i] || 0} color={v.color} head={i === playhead} onClick={() => onStep && onStep(vi, i, ((v.steps[i] || 0) + 1) % 4)} />;
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
