// Echo divisions use the percussion's effective tempo, including half/double speed.
export const echoDivisions=[
 {beats:0.0625,label:'1/64 note'},
 {beats:0.08333333333333333,label:'1/32 triplet'},
 {beats:0.09375,label:'Dotted 1/64'},
 {beats:0.125,label:'1/32 note'},
 {beats:0.16666666666666666,label:'1/16 triplet'},
 {beats:0.1875,label:'Dotted 1/32'},
 {beats:0.25,label:'1/16 note'},
 {beats:0.3333333333333333,label:'⅛ triplet'},
 {beats:0.375,label:'Dotted 1/16'},
 {beats:0.5,label:'⅛ note'},
 {beats:0.6666666666666666,label:'¼ triplet'},
 {beats:0.75,label:'Dotted ⅛'},
 {beats:1,label:'¼ note'},
 {beats:1.3333333333333333,label:'½ triplet'},
 {beats:1.5,label:'Dotted ¼'},
 {beats:2,label:'½ note'},
 {beats:2.6666666666666665,label:'Whole triplet'},
 {beats:3,label:'Dotted ½'},
 {beats:4,label:'Whole note · 1 bar'},
 {beats:6,label:'Dotted whole · 1½ bars'},
 {beats:8,label:'2 bars'}
];
export const maxDelaySeconds=32; // 8 beats at 30 BPM and half speed.
export const delayGlide=.04;
export function normalizeEchoBeats(beats){const value=Number(beats);return echoDivisions.some(option=>option.beats===value)?value:.75;}
export function delaySeconds(bpm=56,rate=1,beats=.75){const tempo=Number.isFinite(Number(bpm))&&Number(bpm)>0?Number(bpm):56;const speed=[.5,1,2].includes(Number(rate))?Number(rate):1;return 60/Math.max(30,Math.min(300,tempo))/speed*normalizeEchoBeats(beats);}
export function echoLabel(bpm,rate,beats){const division=echoDivisions.find(option=>option.beats===normalizeEchoBeats(beats));const seconds=delaySeconds(bpm,rate,beats);return `${division.label} · ${seconds>=1?`${Number(seconds.toFixed(2))} s`:`${Math.round(seconds*1000)} ms`} · shared by voices & drums`;}
