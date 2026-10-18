import {getPalette} from './palettes.js';

// FNV-1a + a seeded PRNG: metadata alone determines the artwork, on every device.
export function trackSeed(title,artist){
 const key=JSON.stringify([title,artist].map(value=>String(value||'').normalize('NFC').trim()));
 let hash=2166136261;
 for(const char of key){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
 return hash>>>0;
}
export function trackCover(title,artist){
 let seed=trackSeed(title,artist);
 const random=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 const n=(min,max)=>Math.round(min+random()*(max-min));
 const colors=getPalette('classic').colors.map(c=>c.hex);
 // Shuffle without changing the palette shared by the live sketch.
 for(let i=colors.length-1;i>0;i--){const j=n(0,i);[colors[i],colors[j]]=[colors[j],colors[i]];}
 const shapes=[];
 shapes.push(`<circle cx="${n(60,190)}" cy="${n(45,170)}" r="${n(65,125)}" fill="${colors[0]}"/>`);
 shapes.push(`<path d="M -30 ${n(30,170)} Q ${n(50,160)} ${n(-90,50)} 286 ${n(80,220)} L 286 286 L -30 286 Z" fill="${colors[1]}" opacity=".85"/>`);
 shapes.push(`<rect x="${n(30,150)}" y="${n(30,100)}" width="${n(35,80)}" height="${n(110,200)}" rx="${n(18,40)}" fill="${colors[2]}" transform="rotate(${n(-65,65)} 128 128)"/>`);
 const x=n(65,190),y=n(65,190);
 for(let i=0;i<4;i++)shapes.push(`<circle cx="${x}" cy="${y}" r="${30+i*14}" fill="none" stroke="${colors[3]}" stroke-width="2" opacity=".8"/>`);
 for(let i=0;i<7;i++)shapes.push(`<circle cx="${n(18,238)}" cy="${n(18,238)}" r="${n(2,6)}" fill="${colors[i%4]}"/>`);
 // No public metadata is interpolated into markup; no IDs, scripts or remote assets.
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><rect width="256" height="256" fill="#141a20"/>${shapes.join('')}<rect x="10" y="10" width="236" height="236" rx="2" fill="none" stroke="#ffffff" stroke-opacity=".18"/></svg>`;
}
