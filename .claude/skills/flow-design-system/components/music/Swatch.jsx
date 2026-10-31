import React from 'react';

export function Swatch({ color, name, selected, onClick, size = 20 }) {
  const [h, setH] = React.useState(false);
  return (
    <button type="button" aria-label={name} aria-pressed={selected} title={name} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ width: size + 8, height: size + 8, padding: 0, border: 0, background: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', borderRadius: '50%' }}>
      <span style={{ width: size, height: size, borderRadius: '50%', background: color,
        boxShadow: selected ? `0 0 0 2px var(--bg-app), 0 0 0 3.5px ${color}` : 'inset 0 0 0 1px rgba(0,0,0,.15)',
        transform: `scale(${h && !selected ? 1.12 : 1})`, transition: 'transform var(--dur-1) var(--ease-out), box-shadow var(--dur-2)' }} />
    </button>
  );
}
