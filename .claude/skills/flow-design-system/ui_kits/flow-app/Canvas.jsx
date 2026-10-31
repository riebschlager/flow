import React from 'react';

export const PALETTES = {
  classic: { name: 'Original glow', colors: [['Lilac', '#b7a0ff'], ['Sea glass', '#73e2d0'], ['Coral', '#ff9e9e'], ['Amber', '#edca82']] },
  aurora: { name: 'Aurora', colors: [['Orchid', '#c89bff'], ['Glacier', '#70e8ff'], ['Pink', '#ff87c8'], ['Jade', '#81f4bd']] },
  desert: { name: 'Desert dusk', colors: [['Plum', '#a69bd8'], ['Sage', '#a6c7b0'], ['Terracotta', '#f18f76'], ['Sand', '#efd4a2']] },
  tide: { name: 'Tidal blue', colors: [['Periwinkle', '#879fe8'], ['Aqua', '#62d9dc'], ['Deep blue', '#5b92d5'], ['Seafoam', '#c1ebd8']] },
  ember: { name: 'Ember', colors: [['Wine', '#c27699'], ['Bronze', '#d1a263'], ['Vermilion', '#ff8763'], ['Apricot', '#ffd18b']] },
  garden: { name: 'Botanical', colors: [['Iris', '#ae9bd5'], ['Mint', '#7fd0aa'], ['Rose', '#e4a7ae'], ['Lime', '#c4d685']] },
  afterglow: { name: 'Afterglow', colors: [['Violet', '#b187ff'], ['Cyan', '#5cddff'], ['Magenta', '#ff6bad'], ['Lemon', '#edee85']] },
  porcelain: { name: 'Porcelain', colors: [['Lavender', '#c5bedc'], ['Celadon', '#b8d8d3'], ['Blush', '#e4c5c5'], ['Cream', '#e9dbbc']] },
};

export function Canvas({ playing, palette, voice, onVoice, cycle, onCycle, energy = 60, zen, titleCard, children }) {
  const cols = PALETTES[palette].colors;
  const [hud, setHud] = React.useState(null);
  const ref = React.useRef(null);
  const [drops, setDrops] = React.useState([]);
  const tap = e => {
    const r = ref.current.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const c = voice ?? Math.floor(Math.random() * 4), id = Math.random();
    setDrops(d => [...d.slice(-14), { id, x, y, c: cols[c][1] }]);
    setHud({ name: 'Touch', detail: y < r.height / 2 ? 'Bright · light' : 'Warm · long', read: `Filter ${(18 - y / r.height * 12).toFixed(1)} kHz · Room ${Math.round(x / r.width * 40)}%` });
    clearTimeout(ref.current._t); ref.current._t = setTimeout(() => setHud(null), 1600);
  };
  const tint = `radial-gradient(40% 50% at 70% 50%, ${cols[0][1]}22, transparent 70%), radial-gradient(35% 45% at 30% 60%, ${cols[1][1]}14, transparent 70%)`;
  return (
    <div ref={ref} onPointerDown={tap} style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--bg-void)', cursor: 'crosshair', userSelect: 'none' }}>
      <div style={{ position: 'absolute', inset: 0, background: tint, opacity: energy / 100, transition: 'opacity var(--dur-4)' }} />
      <div style={{ position: 'absolute', top: 0, bottom: 0, right: '6%', aspectRatio: '0.9',
        background: 'url(../../assets/flow-ambient.jpg) right center / auto 100% no-repeat',
        WebkitMaskImage: 'radial-gradient(44% 46% at 50% 47%, #000 35%, transparent 100%)', maskImage: 'radial-gradient(44% 46% at 50% 47%, #000 35%, transparent 100%)',
        opacity: 0.35 + energy / 160, filter: palette === 'classic' ? 'none' : `hue-rotate(${Object.keys(PALETTES).indexOf(palette) * 40}deg)`,
        animation: playing ? 'flowDrift 18s var(--ease-in-out) infinite alternate' : 'none', transition: 'opacity var(--dur-4), filter var(--dur-4)' }} />
      {drops.map(d => <span key={d.id} style={{ position: 'absolute', left: d.x - 40, top: d.y - 40, width: 80, height: 80, borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${d.c}cc 0%, ${d.c}33 40%, transparent 70%)`, animation: 'flowDrop 2.4s var(--ease-out) forwards' }} />)}

      {!playing && !zen && (
        <div style={{ position: 'absolute', left: 48, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', animation: 'flowFadeIn var(--dur-4) var(--ease-out)' }}>
          <div style={{ font: '400 52px/1.04 var(--font-sans)', letterSpacing: '-0.035em', color: 'var(--text-1)' }}>infinite ambient music<br /><em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)', letterSpacing: '-0.01em' }}>in your browser.</em></div>
          <div style={{ marginTop: 18, font: '400 14px/1.5 var(--font-sans)', color: 'var(--text-2)' }}>authored by humans.<br /><span style={{ color: 'var(--text-3)' }}>Touch anywhere. Let a little color become sound.</span></div>
        </div>
      )}
      {titleCard && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ font: '400 72px/1 var(--font-serif)', fontStyle: 'italic', color: 'var(--text-1)', letterSpacing: '-0.01em', textShadow: '0 0 40px rgba(0,0,0,.6)', animation: 'flowFadeIn 1.6s var(--ease-out)' }}>{titleCard}</div>
        </div>
      )}

      {!zen && <>
        <div style={{ position: 'absolute', top: 18, left: 20, font: 'var(--type-eyebrow)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i style={{ width: 6, height: 6, borderRadius: '50%', background: playing ? 'var(--live)' : 'var(--n-500)', boxShadow: playing ? '0 0 8px var(--live)' : 'none', transition: 'all var(--dur-3)' }} />
          {playing ? 'Live' : 'Take your time'}
        </div>
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', left: 14, bottom: 14, display: 'flex', alignItems: 'center', gap: 14, padding: '4px 12px 4px 6px', borderRadius: 999, background: 'var(--bg-glass)', backdropFilter: 'var(--blur-glass)', WebkitBackdropFilter: 'var(--blur-glass)', boxShadow: '0 0 0 1px var(--line)' }}>
          <div style={{ display: 'flex' }}>{cols.map(([n, c], i) => <Swatch key={i} color={c} name={`Use only ${n.toLowerCase()}`} size={14} selected={voice === i} onClick={() => onVoice(voice === i ? null : i)} />)}</div>
          <span style={{ width: 1, height: 14, background: 'var(--line-strong)' }} />
          <Switch checked={cycle} onChange={onCycle} ariaLabel="Cycle colors" />
          <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-2)' }}>Cycle colors</span>
        </div>
        <div onPointerDown={e => e.stopPropagation()} style={{ position: 'absolute', right: 14, bottom: 14, display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" icon={<Icon name="reset" size={14} />} onClick={() => setDrops([])}>Clear</Button>
        </div>
        {hud && (
          <div style={{ position: 'absolute', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', gap: 14, alignItems: 'baseline', padding: '8px 14px', borderRadius: 'var(--r-3)', background: 'var(--bg-glass)', backdropFilter: 'var(--blur-glass)', boxShadow: '0 0 0 1px var(--line)', pointerEvents: 'none' }}>
            <span style={{ font: '500 12px/1 var(--font-sans)', color: 'var(--text-1)' }}>{hud.name}</span>
            <span style={{ font: '400 12px/1 var(--font-sans)', color: 'var(--text-2)' }}>{hud.detail}</span>
            <span style={{ font: '400 11px/1 var(--font-mono)', color: 'var(--text-3)' }}>{hud.read}</span>
          </div>
        )}
      </>}
      {children}
    </div>
  );
}
