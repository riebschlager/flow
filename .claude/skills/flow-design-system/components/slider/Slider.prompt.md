Slider for levels and proportions (volume, mix, probability, pace); vertical orientation is the Mix fader.

```jsx
<Slider label="Swing" max={60} defaultValue={12} format={v => v + '%'} extents={['Straight', 'Laid back']} />
<Slider orientation="vertical" label="Drums" defaultValue={40} />
```

- Click the track to jump, drag the thumb relatively. Shift = fine.
- Default marked by a tick; double-click resets.
- Use `extents` instead of helper paragraphs.
