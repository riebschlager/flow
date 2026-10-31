import React from 'react';

// First 8 glyphs copied from app/instrument.html <symbol>s. The rest are intentional geometric additions in the same 24px / 1.5 stroke style.
const PATHS = {
  drop: ['M12 3C10 6 5 11 5 15a7 7 0 0 0 14 0c0-4-5-9-7-12Z', 'M8 15a4 4 0 0 0 4 4'],
  play: ['m9 5 11 7-11 7Z'],
  pause: ['M8 5v14M16 5v14'],
  reset: ['M3 10a9 9 0 1 1 2 8M3 4v6h6'],
  expand: ['M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5'],
  volume: ['m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14'],
  sliders: ['M4 7h16M4 17h16M9 4v6m7 4v6'],
  spark: ['m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z'],
  stop: ['M7 7h10v10H7Z'],
  record: ['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z'],
  close: ['M6 6l12 12M18 6 6 18'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-up': ['m6 15 6-6 6 6'],
  'chevron-right': ['m9 6 6 6-6 6'],
  'chevron-left': ['m15 6-6 6 6 6'],
  plus: ['M12 5v14M5 12h14'],
  minus: ['M5 12h14'],
  'arrow-up-right': ['M7 17 17 7M8 7h9v9'],
  help: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7', 'M12 17h.01'],
  heart: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z'],
  share: ['M12 15V3M8 7l4-4 4 4M5 13v7h14v-7'],
  download: ['M12 3v12M8 11l4 4 4-4M5 17v3h14v-3'],
  loop: ['M17 3l3 3-3 3M4 12v-2a4 4 0 0 1 4-4h12M7 21l-3-3 3-3M20 12v2a4 4 0 0 1-4 4H4'],
};
const FILLED = { play: 1, stop: 1, record: 1, drop: 0 };

export function Icon({ name, size = 16, strokeWidth = 1.5, filled, style, title }) {
  const d = PATHS[name] || [];
  const fill = (filled ?? FILLED[name]) ? 'currentColor' : 'none';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} style={{ flex: 'none', display: 'block', ...style }}>
      {title && <title>{title}</title>}
      {d.map((p, i) => <path key={i} d={p} fill={i === 0 ? fill : 'none'} />)}
    </svg>
  );
}
Icon.names = Object.keys(PATHS);
