// Divergence-free vortex pairs survive pressure projection and carry existing dye.
// Keep this percussion-only so gesture and droplet forces retain their own feel.
export function stirPercussion(sim,hit){
 const strength=Math.max(0,Math.min(1.4,Number(hit.strength)||0));if(!strength)return;
 const bass=['kick','softkick','tom'].includes(hit.voice),light=['hat','shaker'].includes(hit.voice);
 const weight=Math.max(.25,Math.min(1,Number(hit.weight)||.5));
 const radius=light?.105:bass?(hit.voice==='softkick'?.25:.22):.165;
 const power=(light?145:bass?210:185)*strength*(.65+.35*weight);
 const angle=(hit.lane||0)*.7+(hit.step||0)/16*Math.PI*.75,cs=Math.cos(angle),sn=Math.sin(angle);
 const direction=(hit.lane||0)%2?-1:1,rad=radius*Math.min(sim.w,sim.h),cx=hit.x*sim.w,cy=hit.y*sim.h;
 for(let y=Math.max(1,Math.floor(cy-rad*3));y<Math.min(sim.h-1,cy+rad*3);y++)for(let x=Math.max(1,Math.floor(cx-rad*3));x<Math.min(sim.w-1,cx+rad*3);x++){
  const dx=(x-cx)/rad,dy=(y-cy)/rad,a=dx*cs+dy*sn,b=-dx*sn+dy*cs;
  let u,v;
  if(light){const f=Math.exp(-(a*a+b*b)*1.4);u=-b*f;v=a*f;}
  else if(bass){const left=Math.exp(-((a+.65)**2+b*b)*1.4),right=Math.exp(-((a-.65)**2+b*b)*1.4);u=-b*(left-right);v=(a+.65)*left-(a-.65)*right;}
  else{const top=Math.exp(-(a*a+(b+.6)**2)*1.6),bottom=Math.exp(-(a*a+(b-.6)**2)*1.6);u=-((b+.6)*top-(b-.6)*bottom);v=a*(top-bottom);}
  const k=x+y*sim.w,nextU=sim.u[k]+(u*cs-v*sn)*power*direction,nextV=sim.v[k]+(u*sn+v*cs)*power*direction;
  // Dense four-voice patterns remain energetic without accumulating runaway jets.
  const scale=Math.min(1,180/(Math.hypot(nextU,nextV)||1));sim.u[k]=nextU*scale;sim.v[k]=nextV*scale;
 }
}
