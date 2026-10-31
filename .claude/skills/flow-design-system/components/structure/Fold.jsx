import React from 'react';

export function Fold({ title, summary, defaultOpen = false, open, onToggle, children, trailing }) {
  const [inner, setInner] = React.useState(defaultOpen);
  const o = open ?? inner;
  const [h, setH] = React.useState(false);
  const toggle = () => { if (open === undefined) setInner(!o); onToggle && onToggle(!o); };
  return (
    <div style={{ borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" aria-expanded={o} onClick={toggle} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ font: '500 13px/1.3 var(--font-sans)', color: 'var(--text-1)' }}>{title}</span>
            {summary && !o && <span style={{ font: '400 12px/1.3 var(--font-sans)', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{summary}</span>}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ color: h ? 'var(--text-1)' : 'var(--text-3)', transform: `rotate(${o ? 180 : 0}deg)`, transition: 'transform var(--dur-3) var(--ease-out), color var(--dur-1)', flex: 'none' }}><path d="m6 9 6 6 6-6" /></svg>
        </button>
        {trailing}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: o ? '1fr' : '0fr', transition: 'grid-template-rows var(--dur-3) var(--ease-out)' }}>
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div style={{ paddingBottom: 18, opacity: o ? 1 : 0, transition: 'opacity var(--dur-3)' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
