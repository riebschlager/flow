import React from 'react';

export function EnvelopeGraph({ attack = 20, decay = 120, sustain = 0.65, length = 0.85, active, height = 72 }) {
  const W = 280, H = height, pad = 6, base = H - pad, top = pad;
  const total = Math.max(attack + decay, 1) / 2000;
  const a = Math.min(attack / 2000, 1) * 0.3 * W, d = Math.min(decay / 2000, 1) * 0.3 * W;
  const end = pad + Math.min(Math.max(length, 0.1), 4) / 4 * (W - pad * 2) * 0.9 + 20;
  const x0 = pad, x1 = x0 + Math.max(a, 2), x2 = x1 + Math.max(d, 2), x4 = Math.max(end, x2 + 20), x3 = x4 - 18;
  const sy = base - (base - top) * sustain;
  const pts = [[x0, base], [x1, top], [x2, sy], [x3, sy], [x4, base]];
  const seg = { a: [0, 1], d: [1, 2], s: [2, 3], r: [3, 4] }[active];
  const line = pts.map(p => p.join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" role="img" aria-label="Note envelope" style={{ display: 'block' }}>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1={W * f} x2={W * f} y1={top} y2={base} stroke="var(--line)" vectorEffect="non-scaling-stroke" />)}
      <line x1={0} x2={W} y1={base} y2={base} stroke="var(--line-strong)" vectorEffect="non-scaling-stroke" />
      <polygon points={line} fill="rgba(255,255,255,.035)" />
      <polyline points={line} fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {seg && <polyline points={[pts[seg[0]], pts[seg[1]]].map(p => p.join(',')).join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}
