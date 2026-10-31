import React from 'react';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function Stepper({ value, defaultValue = 56, min = 30, max = 160, step = 1, onChange, label, unit, size = 'md' }) {
  const [inner, setInner] = React.useState(defaultValue);
  const v = value ?? inner;
  const [drag, setDrag] = React.useState(false);
  const st = React.useRef({}), numRef = React.useRef(null);
  const commit = x => { x = clamp(Math.round(x / step) * step, min, max); if (value === undefined) setInner(x); onChange && onChange(x); };

  React.useEffect(() => {
    const el = numRef.current; if (!el) return;
    const w = e => { e.preventDefault(); commit(v + (e.deltaY < 0 ? step : -step)); };
    el.addEventListener('wheel', w, { passive: false });
    return () => el.removeEventListener('wheel', w);
  });

  const down = e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); st.current = { on: true, y: e.clientY, acc: v }; setDrag(true); };
  const move = e => { if (!st.current.on) return; st.current.acc += (st.current.y - e.clientY) / (e.shiftKey ? 20 : 4) * step; st.current.y = e.clientY; commit(st.current.acc); };
  const up = () => { st.current.on = false; setDrag(false); };

  const big = size === 'lg', fs = big ? 28 : 20;
  const btn = (d, txt, aria) => (
    <button type="button" aria-label={aria} onClick={() => commit(v + d)}
      style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: 0, borderRadius: 'var(--r-2)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', font: '400 16px/1 var(--font-sans)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}>{txt}</button>
  );
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4, userSelect: 'none' }}>
      {label && <span style={{ font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {btn(-step, '−', `Decrease ${label || ''}`)}
        <span ref={numRef} role="spinbutton" tabIndex={0} aria-valuenow={v} aria-valuemin={min} aria-valuemax={max} aria-label={label}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onKeyDown={e => { if (e.key === 'ArrowUp') { e.preventDefault(); commit(v + step); } if (e.key === 'ArrowDown') { e.preventDefault(); commit(v - step); } }}
          style={{ minWidth: fs * 1.9, textAlign: 'center', font: `400 ${fs}px/1 var(--font-mono)`, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', cursor: 'ns-resize', touchAction: 'none', outline: 'none', borderRadius: 4,
            color: drag ? 'var(--accent-strong)' : 'var(--text-1)', transition: 'color var(--dur-2)' }}>{v}</span>
        {btn(step, '+', `Increase ${label || ''}`)}
      </div>
      {unit && <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>{unit}</span>}
    </div>
  );
}
