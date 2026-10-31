import React from 'react';

export function Tabs({ items, value, defaultValue, onChange, size = 'md' }) {
  const [inner, setInner] = React.useState(defaultValue ?? items[0].id);
  const v = value ?? inner;
  const refs = React.useRef({});
  const [bar, setBar] = React.useState({ left: 0, width: 0 });
  React.useLayoutEffect(() => { const el = refs.current[v]; if (el) setBar({ left: el.offsetLeft, width: el.offsetWidth }); }, [v, items.length]);
  const pick = id => { if (value === undefined) setInner(id); onChange && onChange(id); };
  const key = (e, i) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
    const n = items[(i + d + items.length) % items.length]; pick(n.id); refs.current[n.id]?.focus();
  };
  return (
    <div role="tablist" style={{ position: 'relative', display: 'flex', gap: size === 'sm' ? 16 : 22, borderBottom: '1px solid var(--line)' }}>
      {items.map((t, i) => {
        const on = t.id === v;
        return (
          <button key={t.id} ref={el => (refs.current[t.id] = el)} role="tab" aria-selected={on} tabIndex={on ? 0 : -1} type="button"
            onClick={() => pick(t.id)} onKeyDown={e => key(e, i)}
            onMouseEnter={e => !on && (e.currentTarget.style.color = 'var(--text-2)')} onMouseLeave={e => !on && (e.currentTarget.style.color = 'var(--text-3)')}
            style={{ position: 'relative', padding: size === 'sm' ? '8px 0 10px' : '10px 0 12px', border: 0, background: 'none', cursor: 'pointer',
              font: `500 ${size === 'sm' ? 12 : 13}px/1 var(--font-sans)`, color: on ? 'var(--text-1)' : 'var(--text-3)', transition: 'color var(--dur-1)' }}>
            {t.label}
          </button>
        );
      })}
      <span style={{ position: 'absolute', bottom: -1, height: 1, left: bar.left, width: bar.width, background: 'var(--accent)', transition: 'left var(--dur-3) var(--ease-out), width var(--dur-3) var(--ease-out)' }} />
    </div>
  );
}
