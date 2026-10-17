// Echo divisions use the percussion's effective tempo, including half/double speed.
export const delayGlide=.04;
export function delaySeconds(bpm=56,rate=1,beats=.75){const tempo=Number.isFinite(Number(bpm))&&Number(bpm)>0?Number(bpm):56;const speed=[.5,1,2].includes(Number(rate))?Number(rate):1;const division=[.5,.75,1].includes(Number(beats))?Number(beats):.75;return 60/Math.max(30,Math.min(300,tempo))/speed*division;}
export function echoLabel(bpm,rate,beats){const names={'.5':'⅛ note','0.5':'⅛ note','.75':'Dotted ⅛','0.75':'Dotted ⅛','1':'¼ note'};return `${names[String(beats)]||'Dotted ⅛'} · ${Math.round(delaySeconds(bpm,rate,beats)*1000)} ms · shared by voices & drums`;}
