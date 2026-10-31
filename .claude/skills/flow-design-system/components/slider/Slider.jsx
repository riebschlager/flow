import React from 'react';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function Slider({
  value, defaultValue = 0, min = 0, max = 100, step = 1,
  onChange, label, format, orientation = 'horizontal', length = 148,
  extents, color, disabled = false, showValue = true, ariaLabel,
}) {
  const [inner, setInner] = React.useState(value ?? defaultValue);
  const v = value ?? inner;
  const [drag, setDrag] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const track = React.useRef(null), root = React.useRef(null), st = React.useRef({});
  const vert = orientation === 'vertical';

  const norm = x => clamp((x - min) / (max - min), 0, 1);
  const snap = x => clamp(step ? Math.round(x / step) * step : x, min, max);
  const commit = x => { if (value === undefined) setInner(x); onChange && onChange(x); };
  const fmt = format || (x => `${Math.round(x)}`);
  const setNorm = n => { st.current.raw = clamp(n, 0, 1); commit(snap(min + st.current.raw * (max - min))); };

  React.useEffect(() => {
    const el = root.current; if (!el) return;
    const onWheel = e => { if (disabled) return; e.preventDefault(); setNorm(norm(v) + (e.deltaY < 0 ? 1 : -1) * (e.shiftKey ? 0.002 : 0.01) * (max - min) / (max - min)); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const posNorm = e => {
    const r = track.current.getBoundingClientRect();
    return vert ? 1 - (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
  };
  const down = e => {
    if (disabled || e.button > 0) return;
    e.preventDefault(); root.current.focus();
    root.current.setPointerCapture(e.pointerId);
    const onThumb = e.target.dataset && e.target.dataset.thumb;
    st.current = { dragging: true, last: vert ? e.clientY : e.clientX, raw: onThumb ? norm(v) : clamp(posNorm(e), 0, 1) };
    if (!onThumb) setNorm(st.current.raw);
    setDrag(true);
  };
  const move = e => {
    if (!st.current.dragging) return;
    const p = vert ? e.clientY : e.clientX, d = (vert ? st.current.last - p : p - st.current.last);
    st.current.last = p;
    const len = track.current.getBoundingClientRect()[vert ? 'height' : 'width'];
    setNorm(st.current.raw + d / len * (e.shiftKey ? 0.1 : 1));
  };
  const up = () => { st.current.dragging = false; setDrag(false); };
  const key = e => {
    const s = step || (max - min) / 100, f = e.shiftKey ? s : s * (step ? 1 : 1);
    const map = { ArrowUp: f, ArrowRight: f, ArrowDown: -f, ArrowLeft: -f, PageUp: (max - min) / 10, PageDown: -(max - min) / 10 };
    if (e.key in map) { e.preventDefault(); commit(snap(v + map[e.key])); }
    else if (e.key === 'Home') { e.preventDefault(); commit(min); }
    else if (e.key === 'End') { e.preventDefault(); commit(max); }
  };

  const n = norm(v), dn = norm(defaultValue), live = drag || focus;
  const fill = color || (live ? 'var(--accent)' : 'var(--control-fill)');
  const thumbScale = drag ? 1.1 : hover ? 1.08 : 1;
  const thumb = vert
    ? { width: 22, height: 10, borderRadius: 3, left: '50%', bottom: `calc(${n * 100}% - 5px)`, marginLeft: -11 }
    : { width: 14, height: 14, borderRadius: '50%', top: '50%', left: `calc(${n * 100}% - 7px)`, marginTop: -7 };

  const valueEl = showValue && <span style={{ font: 'var(--type-value)', color: live ? 'var(--accent-strong)' : 'var(--text-1)', fontVariantNumeric: 'tabular-nums', transition: 'color var(--dur-2)', whiteSpace: 'nowrap' }}>{fmt(v)}</span>;
  const labelEl = label != null && <span style={{ font: 'var(--type-label)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{label}</span>;

  const body = (
    <div
      ref={root} role="slider" tabIndex={disabled ? -1 : 0} aria-orientation={orientation}
      aria-label={ariaLabel || label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={v} aria-valuetext={fmt(v)}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onDoubleClick={() => !disabled && commit(defaultValue)} onKeyDown={key}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ position: 'relative', outline: 'none', touchAction: 'none', cursor: disabled ? 'default' : drag ? 'grabbing' : 'pointer',
        ...(vert ? { width: 28, height: length } : { height: 20, width: '100%' }) }}
    >
      <div ref={track} style={{ position: 'absolute', background: hover || live ? 'var(--control-track-hover)' : 'var(--control-track)', borderRadius: 2, transition: 'background var(--dur-2)',
        ...(vert ? { left: 13, width: 2, top: 5, bottom: 5 } : { top: 9, height: 2, left: 0, right: 0 }) }}>
        <div style={{ position: 'absolute', background: fill, borderRadius: 2, transition: 'background var(--dur-2)',
          ...(vert ? { left: 0, right: 0, bottom: 0, height: `${n * 100}%` } : { top: 0, bottom: 0, left: 0, width: `${n * 100}%` }) }} />
        <div style={{ position: 'absolute', background: 'var(--n-500)',
          ...(vert ? { left: -4, width: 10, height: 1, bottom: `${dn * 100}%` } : { top: -4, height: 10, width: 1, left: `${dn * 100}%` }) }} />
        <div data-thumb="1" style={{ position: 'absolute', background: 'var(--control-thumb)', boxShadow: focus && !drag ? 'var(--shadow-thumb), 0 0 0 3px var(--accent-ring)' : drag ? 'var(--shadow-thumb), 0 0 0 6px var(--accent-dim)' : 'var(--shadow-thumb)',
          transform: `scale(${thumbScale})`, transition: 'transform var(--dur-1) var(--ease-out), box-shadow var(--dur-2)', ...thumb }} />
      </div>
      {drag && (
        <div style={{ position: 'absolute', pointerEvents: 'none', padding: '4px 7px', borderRadius: 'var(--r-1)', background: 'var(--n-900)', color: 'var(--n-50)', font: '500 11px/1 var(--font-mono)', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,.4)',
          ...(vert ? { left: '100%', marginLeft: 6, bottom: `calc(${n * 100}% - 4px)` } : { bottom: '100%', left: `${n * 100}%`, transform: 'translate(-50%, 0)' }) }}>{fmt(v)}</div>
      )}
    </div>
  );

  if (vert) return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: disabled ? 0.4 : 1, userSelect: 'none' }}>
      {valueEl}{body}{labelEl}
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', opacity: disabled ? 0.4 : 1, userSelect: 'none' }}>
      {(labelEl || valueEl) && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>{labelEl}{valueEl}</div>}
      {body}
      {extents && <div style={{ display: 'flex', justifyContent: 'space-between', font: '400 11px/1 var(--font-sans)', color: 'var(--text-3)', marginTop: -2 }}><span>{extents[0]}</span><span>{extents[1]}</span></div>}
    </div>
  );
}
