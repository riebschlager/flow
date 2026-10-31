import React from 'react';

export function TrackRow({ title, author, duration, likes, liked, playing, colors = [], selected, onPlay, onLike, onSelect, meta }) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onSelect} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) auto auto auto', alignItems: 'center', gap: 16, padding: '10px 12px', margin: '0 -12px',
        borderRadius: 'var(--r-3)', cursor: onSelect ? 'pointer' : 'default', background: selected ? 'var(--bg-well)' : h ? 'rgba(255,255,255,.025)' : 'transparent', transition: 'background var(--dur-1)' }}>
      <button type="button" aria-label={playing ? `Pause ${title}` : `Play ${title}`} onClick={e => { e.stopPropagation(); onPlay && onPlay(); }}
        style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', padding: 0, cursor: 'pointer',
          border: `1px solid ${playing ? 'transparent' : 'var(--line-strong)'}`, background: playing ? 'var(--n-900)' : h ? 'var(--bg-hover)' : 'transparent', color: playing ? 'var(--n-50)' : 'var(--text-1)', transition: 'background var(--dur-1)' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">{playing ? <path d="M8 5v14M16 5v14" fill="none" strokeWidth="3" /> : <path d="m8 5 12 7-12 7Z" />}</svg>
      </button>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: '500 14px/1.25 var(--font-sans)', color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        <span style={{ font: '400 12px/1.3 var(--font-sans)', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[author, meta].filter(Boolean).join(' · ')}</span>
      </div>
      <span style={{ display: 'flex', gap: 3 }}>{colors.map((c, i) => <i key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />)}</span>
      <span style={{ font: 'var(--type-value)', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>{duration}</span>
      {likes != null ? (
        <button type="button" aria-pressed={liked} aria-label="Like" onClick={e => { e.stopPropagation(); onLike && onLike(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 48, justifyContent: 'flex-end', padding: '4px 0', border: 0, background: 'none', cursor: 'pointer', color: liked ? 'var(--rec)' : 'var(--text-3)', font: 'var(--type-value)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
          {likes}
        </button>
      ) : <span />}
    </div>
  );
}
