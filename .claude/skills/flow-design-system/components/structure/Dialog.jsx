import React from 'react';

export function Dialog({ open = true, onClose, eyebrow, title, subtitle, actions, children, width = 720, inline = false }) {
  React.useEffect(() => {
    if (!open || inline) return;
    const k = e => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [open, inline]);
  if (!open) return null;
  const sheet = (
    <div role="dialog" aria-modal={!inline} aria-label={title} onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: width, maxHeight: inline ? 'none' : 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-panel)', borderRadius: 'var(--r-4)', boxShadow: 'var(--shadow-dialog)', overflow: 'hidden', animation: inline ? 'none' : 'flowDialogIn var(--dur-3) var(--ease-out)' }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '24px 28px 20px' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {eyebrow && <span style={{ font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)' }}>{eyebrow}</span>}
          <h2 style={{ margin: 0, font: '400 24px/1.2 var(--font-sans)', letterSpacing: 'var(--tracking-tight)', color: 'var(--text-1)' }}>{title}</h2>
          {subtitle && <p style={{ margin: 0, font: '400 13px/1.5 var(--font-sans)', color: 'var(--text-2)' }}>{subtitle}</p>}
        </div>
        {actions}
        {onClose && (
          <button type="button" aria-label="Close" onClick={onClose}
            style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: 0, borderRadius: 'var(--r-2)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        )}
      </header>
      <div style={{ padding: '0 28px 28px', overflowX: 'hidden', overflowY: 'auto', minHeight: 0 }}>{children}</div>
    </div>
  );
  if (inline) return sheet;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', padding: 40, background: 'var(--bg-scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'flowFade var(--dur-3) var(--ease-out)' }}>
      <style>{'@keyframes flowFade{from{opacity:0}}@keyframes flowDialogIn{from{opacity:0;transform:translateY(8px) scale(.99)}}'}</style>
      {sheet}
    </div>
  );
}
