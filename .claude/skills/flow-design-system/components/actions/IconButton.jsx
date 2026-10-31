import React from 'react';

const SIZES = { sm: 28, md: 32, lg: 48 };

export function IconButton({ children, label, size = 'md', variant = 'ghost', round, active, disabled, onClick, style }) {
  const [h, setH] = React.useState(false), [p, setP] = React.useState(false);
  const d = SIZES[size] || size;
  const look = {
    ghost: { bg: h ? 'var(--bg-hover)' : 'transparent', fg: h ? 'var(--text-1)' : 'var(--text-2)', bd: 'transparent' },
    secondary: { bg: h ? 'var(--bg-hover)' : 'var(--bg-well)', fg: 'var(--text-1)', bd: 'var(--line-strong)' },
    primary: { bg: h ? '#fff' : 'var(--n-900)', fg: 'var(--n-50)', bd: 'transparent' },
  }[variant];
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active} disabled={disabled} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => { setH(false); setP(false); }} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)}
      style={{
        width: d, height: d, display: 'inline-grid', placeItems: 'center', padding: 0, flex: 'none',
        borderRadius: round ? '50%' : 'var(--r-2)', border: `1px solid ${look.bd}`,
        background: active ? 'var(--accent-dim)' : look.bg, color: active ? 'var(--accent-strong)' : look.fg,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
        transform: p ? 'scale(.94)' : 'none', transition: 'background var(--dur-1), color var(--dur-1), transform var(--dur-1) var(--ease-out)', ...style,
      }}>{children}</button>
  );
}
