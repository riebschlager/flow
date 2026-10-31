import React from 'react';

export function TopBar({ title, onTitle, saved, onCommunity, onLibrary, railOpen, onToggleRail, onZen }) {
  return (
    <header style={{ height: 'var(--topbar-h)', display: 'flex', alignItems: 'center', gap: 20, padding: '0 16px 0 20px', borderBottom: '1px solid var(--line)', background: 'var(--bg-app)' }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'var(--text-1)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--voice-1)"><path d="M12 3C10 6 5 11 5 15a7 7 0 0 0 14 0c0-4-5-9-7-12Z" /></svg>
        <span style={{ font: '500 17px/1 var(--font-sans)', letterSpacing: '-0.03em' }}>Flow</span>
      </a>
      <span style={{ width: 1, height: 18, background: 'var(--line-strong)' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, flex: 1 }}>
        <input value={title} onChange={e => onTitle(e.target.value)} aria-label="Session name"
          style={{ minWidth: 0, width: Math.max(8, title.length) + 'ch', maxWidth: 360, background: 'transparent', border: 0, padding: '4px 0', color: 'var(--text-1)', font: '500 13px/1 var(--font-sans)', outline: 'none' }} />
        <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>{saved ? 'Saved' : 'Saving…'}</span>
      </div>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button variant="ghost" size="sm" onClick={onCommunity}>Community</Button>
        <Button variant="ghost" size="sm" onClick={onLibrary}>Library</Button>
        <span style={{ width: 1, height: 18, background: 'var(--line-strong)', margin: '0 8px' }} />
        <IconButton size="sm" label="About Flow" onClick={() => (location.href = 'about.html')}><Icon name="help" size={16} /></IconButton>
        <IconButton size="sm" label="Zen view" onClick={onZen}><Icon name="expand" size={15} /></IconButton>
        <IconButton size="sm" label="Toggle controls" active={railOpen} onClick={onToggleRail}><Icon name="sliders" size={16} /></IconButton>
      </nav>
    </header>
  );
}
