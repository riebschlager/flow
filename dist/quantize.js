// A quarter note is one beat of the effective percussion tempo.
export const quantizeDivisions=[1,.5,.25,1/3];
export function landingTime(now,duration,{origin=0,bpm=56,rate=1,beats=.5,enabled=true}={}){
 const arrival=now+Math.max(.02,duration);
 if(!enabled)return arrival;
 const division=quantizeDivisions.includes(Number(beats))?Number(beats):.5;
 const step=60/Math.max(30,Math.min(100,Number(bpm)||56))/([.5,1,2].includes(Number(rate))?Number(rate):1)*division;
 // Snap forward from the natural arrival, preserving the visible fall.
 return origin+Math.ceil((arrival-origin)/step-1e-9)*step;
}
