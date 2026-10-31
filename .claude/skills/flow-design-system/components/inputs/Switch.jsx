import React from 'react';

export function Switch({ checked, defaultChecked = false, onChange, label, description, disabled, ariaLabel }) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked ?? inner;
  const toggle = () => { if (disabled) return; if (checked === undefined) setInner(!on); onChange && onChange(!on); };
  const sw = (
    <button type="button" role="switch" aria-checked={on} aria-label={ariaLabel || label} disabled={disabled} onClick={toggle}
      style={{ position: 'relative', width: 30, height: 18, flex: 'none', padding: 0, border: 0, borderRadius: 999, cursor: disabled ? 'default' : 'pointer',
        background: on ? 'var(--accent)' : 'var(--n-300)', transition: 'background var(--dur-2) var(--ease-out)', opacity: disabled ? 0.4 : 1 }}>
      <span style={{ position: 'absolute', top: 2, left: 2, width: 14, height: 14, borderRadius: '50%', background: on ? 'var(--n-50)' : 'var(--n-700)',
        transform: `translateX(${on ? 12 : 0}px)`, transition: 'transform var(--dur-2) var(--ease-settle), background var(--dur-2)' }} />
    </button>
  );
  if (!label) return sw;
  return (
    <label onClick={e => { e.preventDefault(); toggle(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: disabled ? 'default' : 'pointer' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ font: '500 13px/1.3 var(--font-sans)', color: 'var(--text-1)' }}>{label}</span>
        {description && <span style={{ font: '400 12px/1.35 var(--font-sans)', color: 'var(--text-3)' }}>{description}</span>}
      </span>
      {sw}
    </label>
  );
}
