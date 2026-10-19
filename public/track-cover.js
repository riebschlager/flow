import {getPalette} from './palettes.js';

// FNV-1a + a seeded PRNG: metadata alone determines the artwork, on every device.
export function trackSeed(title,artist){
 const key=JSON.stringify([title,artist].map(value=>String(value||'').normalize('NFC').trim()));
 let hash=2166136261;
 for(const char of key){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
 return hash>>>0;
}
export function trackCover(title,artist){
 const initialSeed=trackSeed(title,artist);
 let seed=initialSeed;
 const random=()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
 const colors=getPalette('classic').colors.map(c=>c.hex);
 const offset=Math.floor(random()*4);
 colors.push(...colors.splice(0,offset));
 // A coarse-to-fine grid is part of each piece's stable visual identity.
 const columns=15+Math.floor(random()*21),step=300/columns;
 const x=40+random()*110,y=90+random()*110;
 // Namespaced, numeric IDs keep gradients independent across different covers.
 const gradient=`flow-cover-${initialSeed}-gradient`,glow=`flow-cover-${initialSeed}-glow`;
 const dots=[];
 for(let row=0;row<columns;row++)for(let col=0;col<columns;col++){
  const cx=(col+.5)*step,cy=(row+.5)*step;
  const swell=(Math.sin(cx/70+random()*.1)+Math.cos(cy/85+cx/100)+2)/4;
  const radius=step*(.09+.34*swell);
  dots.push(`<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${radius.toFixed(3)}"/>`);
 }
 // User-supplied text never enters SVG markup. No scripts or remote assets.
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" aria-hidden="true" focusable="false" style="stroke:none"><defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".52" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient><radialGradient id="${glow}"><stop stop-color="${colors[3]}"/><stop offset="1" stop-color="${colors[3]}" stop-opacity="0"/></radialGradient></defs><rect width="300" height="300" fill="url(#${gradient})"/><circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="220" fill="url(#${glow})"/><g fill="#202339" opacity=".84">${dots.join('')}</g></svg>`;
}
