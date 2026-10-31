import React from 'react';

export function Segmented({ options, value, defaultValue, onChange, size = 'md', full, ariaLabel }) {
  const opts = options.map(o => typeof o === 'object' ? o : { value: o, label: String(o) });
  const [inner, setInner] = React.useState(defaultValue ?? opts[0].value);
  const v = value ?? inner;
  const h = size === 'sm' ? 24 : 28;
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: full ? 'flex' : 'inline-flex', gap: 2, padding: 2, background: 'var(--bg-well)', borderRadius: 'var(--r-2)', border: '1px solid var(--line)' }}>
      {opts.map(o => {
        const on = o.value === v;
        return (
          <button key={String(o.value)} type="button" role="radio" aria-checked={on} onClick={() => { if (value === undefined) setInner(o.value); onChange && onChange(o.value); }}
            style={{ flex: full ? 1 : 'none', height: h, padding: '0 10px', border: 0, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap',
              font: `500 ${size === 'sm' ? 11 : 12}px/1 var(--font-sans)`, fontVariantNumeric: 'tabular-nums',
              color: on ? 'var(--text-1)' : 'var(--text-3)', background: on ? 'var(--n-300)' : 'transparent', boxShadow: on ? 'var(--hl-top)' : 'none',
              transition: 'background var(--dur-2) var(--ease-out), color var(--dur-1)' }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
