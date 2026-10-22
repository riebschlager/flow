import {canonicalDyes} from './palettes.js?rev=gestures-32';
export const TITLE_LIMIT=80;
export function normalizeDyeTitle(raw){
 if(typeof raw?.text!=='string'||!raw.text.trim()||raw.text.length>TITLE_LIMIT||/[\p{C}<>]/u.test(raw.text))throw new Error('Title cards need 1–80 visible characters.');
 const color=raw.color??0;if(!Number.isInteger(color)||color<0||color>3)throw new Error('Invalid title color.');
 return {text:raw.text.trim(),color};
}
export function titleLines(ctx,text,width){
 if(ctx.measureText(text).width<=width)return [text];
 const chars=Array.from(text),spaces=chars.map((c,i)=>c===' '?i+1:0).filter(Boolean);let split=Math.ceil(chars.length/2),best=Infinity;
 for(const i of spaces.length?spaces:chars.map((_,i)=>i).slice(1)){const a=chars.slice(0,i).join('').trim(),b=chars.slice(i).join('').trim(),score=Math.max(ctx.measureText(a).width,ctx.measureText(b).width)+(chars[i-1]===' '?0:2);if(score<best){split=i;best=score;}}
 return [chars.slice(0,split).join('').trim(),chars.slice(split).join('').trim()];
}
export function writeInDye(sim,text,{font='sans-serif',x=.5,y=.48,size=.14,color=0,frame={x:0,y:0,w:1,h:1},makeCanvas=()=>document.createElement('canvas')}={}){
 const title=normalizeDyeTitle({text,color}),canvas=makeCanvas();canvas.width=sim.w;canvas.height=sim.h;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Title cards need a 2D canvas.');
 const width=sim.w*frame.w*.86;let px=Math.max(8,Math.round(Math.min(sim.w*frame.w,sim.h*frame.h)*size));ctx.font=`600 ${px}px ${font}`;const lines=titleLines(ctx,title.text,width);
 while(px>8&&lines.some(line=>ctx.measureText(line).width>width)){px--;ctx.font=`600 ${px}px ${font}`;}
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.filter='blur(0.35px)';
 lines.forEach((line,i)=>ctx.fillText(line,(frame.x+Math.max(.07,Math.min(.93,x))*frame.w)*sim.w,(frame.y+y*frame.h)*sim.h+(i-(lines.length-1)/2)*px*1.2,width));
 const mask=ctx.getImageData(0,0,sim.w,sim.h).data,dye=canonicalDyes[color];let coverage=0;
 for(let j=1;j<sim.h-1;j++)for(let i=1;i<sim.w-1;i++){const k=i+j*sim.w,a=mask[k*4+3]/255*1.65;if(!a)continue;const r=sim.r[k]+dye[0]*a,g=sim.g[k]+dye[1]*a,b=sim.b[k]+dye[2]*a,scale=5/Math.max(5,r,g,b);sim.r[k]=r*scale;sim.g[k]=g*scale;sim.b[k]=b*scale;coverage++;}
 return {coverage,lines,fontSize:px};
}
