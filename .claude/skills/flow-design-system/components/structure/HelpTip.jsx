import React from 'react';

export function HelpTip({ children, align = 'right', side = 'bottom', width = 248, label = 'More about this' }) {
  const [open, setOpen] = React.useState(false);
  const t = React.useRef();
  const show = () => { clearTimeout(t.current); setOpen(true); };
  const hide = () => { t.current = setTimeout(() => setOpen(false), 80); };
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={show} onMouseLeave={hide}>
      <button type="button" aria-label={label} aria-expanded={open} onFocus={show} onBlur={hide} onClick={() => setOpen(!open)}
        style={{ width: 16, height: 16, padding: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'help',
          border: `1px solid ${open ? 'var(--text-3)' : 'var(--line-strong)'}`, background: 'transparent', color: open ? 'var(--text-1)' : 'var(--text-3)',
          font: '500 10px/1 var(--font-sans)', transition: 'color var(--dur-1), border-color var(--dur-1)' }}>?</button>
      <span role="tooltip" style={{
        position: 'absolute', zIndex: 20, width, [side === 'bottom' ? 'top' : 'bottom']: 'calc(100% + 8px)', [align === 'right' ? 'right' : 'left']: -8,
        padding: '10px 12px', borderRadius: 'var(--r-3)', background: 'var(--n-150)', boxShadow: 'var(--shadow-pop)',
        font: '400 12px/1.5 var(--font-sans)', color: 'var(--text-2)', textWrap: 'pretty', textTransform: 'none', letterSpacing: 0,
        opacity: open ? 1 : 0, transform: `translateY(${open ? 0 : side === 'bottom' ? -4 : 4}px)`, pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity var(--dur-2) var(--ease-out), transform var(--dur-2) var(--ease-out)' }}>{children}</span>
    </span>
  );
}
