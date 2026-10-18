const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
function selectTab(id, { focus = false, updateHash = true } = {}) {
  const selected = tabs.find(tab => tab.getAttribute('aria-controls') === id);
  if (!selected) return;
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  for (const panel of panels) panel.hidden = panel.id !== id;
  if (focus) selected.focus();
  if (updateHash) history.replaceState(null, '', `#${id}`);
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(tab.getAttribute('aria-controls')));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectTab(tabs[next].getAttribute('aria-controls'), { focus: true });
  });
}
function readHash() { selectTab(location.hash.slice(1), { updateHash: false }); }
readHash();
window.addEventListener('hashchange', readHash);
