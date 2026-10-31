import React from 'react';

const SIZES = { sm: { h: 28, px: 10, fs: 12 }, md: { h: 32, px: 12, fs: 13 }, lg: { h: 40, px: 16, fs: 14 } };
const VARIANTS = {
  primary:   { bg: 'var(--n-900)', bgH: '#ffffff', fg: 'var(--n-50)', bd: 'transparent' },
  secondary: { bg: 'var(--bg-well)', bgH: 'var(--bg-hover)', fg: 'var(--text-1)', bd: 'var(--line-strong)' },
  ghost:     { bg: 'transparent', bgH: 'var(--bg-hover)', fg: 'var(--text-2)', fgH: 'var(--text-1)', bd: 'transparent' },
  record:    { bg: 'var(--rec-dim)', bgH: 'rgba(239,122,116,.24)', fg: 'var(--rec)', bd: 'transparent' },
};

export function Button({ variant = 'secondary', size = 'md', icon, iconRight, children, disabled, active, full, onClick, type = 'button', title, style }) {
  const [h, setH] = React.useState(false), [p, setP] = React.useState(false);
  const s = SIZES[size], v = VARIANTS[variant];
  return (
    <button type={type} title={title} disabled={disabled} onClick={onClick} aria-pressed={active}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: s.h, padding: `0 ${s.px}px`, width: full ? '100%' : undefined,
        font: `500 ${s.fs}px/1 var(--font-sans)`, letterSpacing: '-0.005em', whiteSpace: 'nowrap',
        color: active ? 'var(--accent-strong)' : (h && v.fgH) || v.fg, background: active ? 'var(--accent-dim)' : h && !disabled ? v.bgH : v.bg,
        border: `1px solid ${v.bd}`, borderRadius: 'var(--r-2)', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
        transform: p && !disabled ? 'scale(.98)' : 'none', transition: 'background var(--dur-1), color var(--dur-1), transform var(--dur-1)', ...style,
      }}>
      {icon}{children}{iconRight}
    </button>
  );
}
