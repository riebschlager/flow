import {colorPalettes} from './palettes.js';

// Metadata alone determines the artwork, on every device. Keep this seed stable.
export function trackSeed(title,artist){
 const key=JSON.stringify([title,artist].map(value=>String(value||'').normalize('NFC').trim()));
 let hash=2166136261;
 for(const char of key){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
 return hash>>>0;
}
const families=['ribbons','contours','modular'];
const paletteIds=['classic','aurora','desert','tide','ember','garden','afterglow','porcelain'];
const number=value=>value.toFixed(2);

export function trackCover(title,artist){
 const initialSeed=trackSeed(title,artist);
 let seed=initialSeed;
 const random=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 const family=families[Math.floor(random()*families.length)];
 const palette=paletteIds[Math.floor(random()*paletteIds.length)];
 const colors=colorPalettes[palette].colors.map(c=>c.hex);
 const offset=Math.floor(random()*colors.length);
 colors.push(...colors.splice(0,offset));
 const background=random()<.28?'#eadfcf':'#202339';
 const gradient=`flow-cover-${initialSeed}-gradient`;
 const angle=Math.floor(random()*180);
 let marks='';
 if(family==='ribbons'){
  const count=3+Math.floor(random()*5),bend=45+random()*110;
  for(let k=0;k<count;k++){
   const y=-70+k*380/count,x=random()*120-60,width=18+random()*46;
   const curve=shift=>`M -100 ${number(y+shift)} C ${number(90+x)} ${number(y-bend+shift)}, ${number(100+x)} ${number(y+150+bend+shift)}, 410 ${number(y+65+shift)}`;
   marks+=`<path d="${curve(0)}" fill="none" stroke="${k%2===0?`url(#${gradient})`:colors[(k+1)%4]}" stroke-width="${number(width)}" stroke-linecap="round" opacity="${number(.65+random()*.35)}"/><path d="${curve(-width*.16)}" fill="none" stroke="${colors[2]}" stroke-width="1" opacity=".5"/>`;
  }
 }else if(family==='contours'){
  const count=15+Math.floor(random()*15),stretch=.65+random()*.8,phase=random()*7;
  const cx=50+random()*200,cy=40+random()*220;
  for(let k=count;k>0;k--){
   const points=[];
   for(let j=0;j<=72;j++){
    const a=j/72*Math.PI*2,radius=k*9*(1+.16*Math.sin(a*3+phase)+.1*Math.cos(a*5+phase));
    points.push(`${number(cx+Math.cos(a)*radius)},${number(cy+Math.sin(a)*radius*stretch)}`);
   }
   marks+=`<path d="M ${points.join(' L ')} Z" fill="${k%6===0?colors[Math.floor(k/6)%4]:'none'}" fill-opacity=".12" stroke="${colors[Math.floor(k/7)%4]}" stroke-width="${k%6===0?3:1.2}" opacity="${number(.45+random()*.5)}"/>`;
  }
 }else{
  const grid=random()<.5?2:3,step=300/grid;
  for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){
   const form=Math.floor(random()*4),color=colors[Math.floor(random()*4)],turn=Math.floor(random()*4)*90;
   const shape=form===0?`<circle cx="${step/2}" cy="${step/2}" r="${step*.44}" fill="${color}"/>`:form===1?`<path d="M 0 0 H ${step} A ${step} ${step} 0 0 1 0 ${step} Z" fill="${color}"/>`:form===2?`<path d="M 0 ${step} A ${step} ${step} 0 0 1 ${step} 0" fill="none" stroke="${color}" stroke-width="${step*.28}"/>`:`<rect x="${step*.12}" y="${step*.12}" width="${step*.76}" height="${step*.76}" rx="${step*.06}" fill="${color}"/>`;
   marks+=`<g transform="translate(${x*step} ${y*step}) rotate(${turn} ${step/2} ${step/2})">${shape}</g>`;
  }
 }
 // A light, shared printed texture without filters or external image assets.
 const grain=[];
 for(let i=0;i<100;i++)grain.push(`<circle cx="${number(random()*300)}" cy="${number(random()*300)}" r="${number(.2+random()*.5)}"/>`);
 // User-supplied text never enters SVG markup. No scripts or remote assets.
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" aria-hidden="true" focusable="false" data-family="${family}" data-palette="${palette}" style="stroke:none"><defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".55" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient></defs><rect width="300" height="300" fill="${background}"/><g transform="rotate(${family==='modular'?0:angle} 150 150)">${marks}</g><g fill="#eadfcf" opacity=".18">${grain.join('')}</g></svg>`;
}
