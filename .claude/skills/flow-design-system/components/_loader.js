/* Card/kit helper: loads component .jsx sources as globals (strips import/export), then runs cb.
   Requires React, ReactDOM and @babel/standalone already on the page. */
window.loadFlowComponents = async function (paths) {
  const srcs = await Promise.all(paths.map(p => fetch(p).then(r => { if (!r.ok) throw new Error(p); return r.text(); })));
  const code = srcs.map(s => {
    const names = [...s.matchAll(/^export\s+(?:function|const|let)\s+(\w+)/gm)].map(m => m[1]);
    const body = s.replace(/^\s*import[^;]*;?\s*$/gm, '').replace(/^export\s+(default\s+)?/gm, '');
    return `(function(){\n${body}\n${names.map(n => `window.${n}=${n};`).join('')}\n})();`;
  }).join('\n');
  const out = Babel.transform(code, { presets: ['react'] }).code;
  const el = document.createElement('script');
  el.textContent = out;
  document.head.appendChild(el);
};
window.FLOW_COMPONENTS = (base) => [
  'actions/Icon', 'actions/Button', 'actions/IconButton',
  'knob/Knob', 'slider/Slider',
  'inputs/Switch', 'inputs/Segmented', 'inputs/Select', 'inputs/Stepper',
  'structure/Tabs', 'structure/Fold', 'structure/HelpTip', 'structure/Section', 'structure/Dialog',
  'music/Swatch', 'music/StepGrid', 'music/EnvelopeGraph', 'music/ChordStrip', 'music/TrackRow'
].map(p => base + p + '.jsx');
