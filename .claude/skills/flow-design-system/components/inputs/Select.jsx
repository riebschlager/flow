import React from 'react';

const CHEV = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237c838d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ options = [], groups, value, defaultValue, onChange, label, inline, size = 'md', ariaLabel, full = true }) {
  const [h, setH] = React.useState(false);
  const renderOpt = o => { const x = typeof o === 'object' ? o : { value: o, label: o }; return <option key={x.value} value={x.value}>{x.label}</option>; };
  const sel = (
    <select value={value} defaultValue={value === undefined ? defaultValue : undefined} aria-label={ariaLabel || label}
      onChange={e => onChange && onChange(e.target.value)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ appearance: 'none', WebkitAppearance: 'none', width: full && !inline ? '100%' : 'auto', minWidth: inline ? 0 : undefined,
        height: size === 'sm' ? 28 : 32, padding: '0 30px 0 10px', font: `400 ${size === 'sm' ? 12 : 13}px/1 var(--font-sans)`, color: 'var(--text-1)',
        background: `${CHEV} no-repeat right 10px center, ${h ? 'var(--bg-hover)' : 'var(--bg-well)'}`,
        border: '1px solid var(--line)', borderRadius: 'var(--r-2)', cursor: 'pointer', textOverflow: 'ellipsis', transition: 'background-color var(--dur-1)' }}>
      {groups ? groups.map(g => g.label ? <optgroup key={g.label} label={g.label}>{g.options.map(renderOpt)}</optgroup> : g.options.map(renderOpt)) : options.map(renderOpt)}
    </select>
  );
  if (!label) return sel;
  if (inline) return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-2)' }}>{label}</span>{sel}
    </label>
  );
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: 'var(--type-label)', color: 'var(--text-2)' }}>{label}</span>{sel}
    </label>
  );
}
