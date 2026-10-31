import React from 'react';
import { HelpTip } from './HelpTip';

export function Section({ title, help, action, children, gap = 14, divider = true }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap, padding: '18px 0', borderTop: divider ? '1px solid var(--line)' : 0 }}>
      {(title || action) && (
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 16 }}>
          {title && <h3 style={{ margin: 0, font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)' }}>{title}</h3>}
          <span style={{ flex: 1 }} />
          {action}
          {help && <HelpTip align="right">{help}</HelpTip>}
        </header>
      )}
      {children}
    </section>
  );
}
