import React from 'react';

const SWEEP = 270, START = -135;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const polar = (cx, cy, r, deg) => { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const arc = (cx, cy, r, a0, a1) => {
  if (Math.abs(a1 - a0) < 0.01) return '';
  const [x0, y0] = polar(cx, cy, r, Math.min(a0, a1)), [x1, y1] = polar(cx, cy, r, Math.max(a0, a1));
  return `M${x0} ${y0}A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};
const SIZES = { sm: 32, md: 44, lg: 64 };

export function Knob({
  value, defaultValue = 0, min = 0, max = 1, step = 0, skew = 1,
  onChange, label, format, size = 'md', bipolar = false, disabled = false,
  showValue = true, color, dragRange = 200, ariaLabel,
}) {
  const [inner, setInner] = React.useState(value ?? defaultValue);
  const v = value ?? inner;
  const [drag, setDrag] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const ref = React.useRef(null), st = React.useRef({});

  const toNorm = x => Math.pow(clamp((x - min) / (max - min), 0, 1), 1 / skew);
  const fromNorm = n => { let x = min + (max - min) * Math.pow(clamp(n, 0, 1), skew); if (step) x = Math.round(x / step) * step; return clamp(x, min, max); };
  const commit = x => { if (value === undefined) setInner(x); onChange && onChange(x); };
  const fmt = format || (x => step >= 1 ? String(Math.round(x)) : `${Math.round(toNorm(x) * 100)}%`);

  st.current.norm = st.current.dragging ? st.current.norm : toNorm(v);
  const nudge = (dn) => { st.current.norm = clamp(st.current.norm + dn, 0, 1); commit(fromNorm(st.current.norm)); };

  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const onWheel = e => { if (disabled) return; e.preventDefault(); nudge((e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.002 : 0.01)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const down = e => {
    if (disabled || e.button > 0) return;
    e.preventDefault(); ref.current.focus();
    ref.current.setPointerCapture(e.pointerId);
    st.current = { dragging: true, lastY: e.clientY, norm: toNorm(v) };
    setDrag(true);
  };
  const move = e => {
    if (!st.current.dragging) return;
    const dy = st.current.lastY - e.clientY; st.current.lastY = e.clientY;
    nudge(dy / dragRange * (e.shiftKey ? 0.1 : 1));
  };
  const up = e => { if (!st.current.dragging) return; st.current.dragging = false; setDrag(false); };
  const key = e => {
    const k = e.key, f = e.shiftKey ? 0.001 : 0.01;
    const map = { ArrowUp: f, ArrowRight: f, ArrowDown: -f, ArrowLeft: -f, PageUp: 0.1, PageDown: -0.1 };
    if (k in map) { e.preventDefault(); nudge(map[k]); }
    else if (k === 'Home') { e.preventDefault(); commit(min); }
    else if (k === 'End') { e.preventDefault(); commit(max); }
  };

  const S = SIZES[size] || size, pad = 7, W = S + pad * 2, c = W / 2, r = S / 2 + 4;
  const n = toNorm(v), ang = START + n * SWEEP;
  const from = bipolar ? 0 : START;
  const dAng = START + toNorm(defaultValue) * SWEEP;
  const [tx, ty] = polar(c, c, r + 3.5, dAng);
  const live = drag || focus;
  const fill = color || (live ? 'var(--accent)' : 'var(--control-fill)');

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: disabled ? 0.4 : 1, userSelect: 'none', fontFamily: 'var(--font-sans)' }}>
      <div
        ref={ref} role="slider" tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel || label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={v} aria-valuetext={fmt(v)} aria-disabled={disabled}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onDoubleClick={() => !disabled && commit(defaultValue)} onKeyDown={key}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ position: 'relative', width: W, height: W, cursor: disabled ? 'default' : drag ? 'grabbing' : 'ns-resize', outline: 'none', touchAction: 'none' }}
      >
        <svg width={W} height={W} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <path d={arc(c, c, r, START, START + SWEEP)} fill="none" stroke={hover || live ? 'var(--control-track-hover)' : 'var(--control-track)'} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke var(--dur-2)' }} />
          <path d={arc(c, c, r, from, ang)} fill="none" stroke={fill} strokeWidth="2" strokeLinecap="round" style={{ transition: 'stroke var(--dur-2)' }} />
          <circle cx={tx} cy={ty} r="1.25" fill="var(--n-500)" />
        </svg>
        <div style={{
          position: 'absolute', left: pad, top: pad, width: S, height: S, borderRadius: '50%',
          background: 'radial-gradient(120% 120% at 50% 0%, var(--n-250) 0%, var(--n-150) 55%, var(--n-100) 100%)',
          boxShadow: focus && !drag ? 'var(--shadow-knob), 0 0 0 2px var(--accent-ring)' : 'var(--shadow-knob)',
          transform: `rotate(${ang}deg) scale(${drag ? 0.97 : 1})`,
          transition: drag ? 'transform 60ms linear, box-shadow var(--dur-2)' : 'transform var(--dur-2) var(--ease-settle), box-shadow var(--dur-2)',
        }}>
          <span style={{ position: 'absolute', left: '50%', top: Math.max(3, S * 0.09), width: 2, height: Math.max(6, S * 0.26), marginLeft: -1, borderRadius: 1, background: live ? 'var(--accent-strong)' : 'var(--text-1)' }} />
        </div>
        {drag && (
          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)', padding: '4px 7px', borderRadius: 'var(--r-1)', background: 'var(--n-900)', color: 'var(--n-50)', font: '500 11px/1 var(--font-mono)', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}>{fmt(v)}</div>
        )}
      </div>
      {label != null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: W }}>
          <span style={{ font: 'var(--type-label)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{label}</span>
          {showValue && <span style={{ font: 'var(--type-value)', color: live ? 'var(--accent-strong)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transition: 'color var(--dur-2)' }}>{fmt(v)}</span>}
        </div>
      )}
    </div>
  );
}
