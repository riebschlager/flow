Rotary control for continuous character parameters (reverb, swirl, attack, glide, tone). Vertical drag, Shift for fine, wheel, double-click to reset, arrow keys.

```jsx
<Knob label="Reverb" defaultValue={0.65} />
<Knob label="Attack" min={0} max={2000} skew={2.5} defaultValue={20} format={v => Math.round(v) + ' ms'} />
<Knob label="Pan" min={-1} max={1} defaultValue={0} bipolar />
```

- `size`: sm 32 / md 44 / lg 64. One lg per panel, max.
- `bipolar` fills from 12 o'clock (pan, detune).
- `skew` gives a log-like taper for ms and Hz.
- Fill turns accent while touched/focused; value chip floats above while dragging.
