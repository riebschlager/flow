import assert from 'node:assert/strict';
import {canonicalDyes,colorPalettes,createDyeMapper,normalizePalette,hexRGB} from '../public/palettes.js';
import {sanitizeSnapshot} from '../public/recording-state.js';
import {chordMood,ChordAtmosphere} from '../public/chord-atmosphere.js';
assert.equal(Object.keys(colorPalettes).length,8);
assert.equal(normalizePalette('unknown'),'classic');assert.equal(normalizePalette('__proto__'),'classic');assert.equal(normalizePalette({}),'classic');
const out=[0,0,0];
for(const palette of Object.values(colorPalettes)){
 assert.equal(palette.colors.length,4);assert.equal(new Set(palette.colors.map(c=>c.hex)).size,4);
 const mapper=createDyeMapper(palette.id);
 for(let i=0;i<4;i++){
  assert.match(palette.colors[i].hex,/^#[a-f0-9]{6}$/);assert.deepEqual(palette.colors[i].rgb,canonicalDyes[i]);
  mapper(...canonicalDyes[i],out);const expected=palette.id==='classic'?canonicalDyes[i]:hexRGB(palette.colors[i].hex).map(v=>v**2.2);
  out.forEach((v,j)=>assert(Math.abs(v-expected[j])<1e-6,`${palette.id} anchor ${i}/${j}`));
 }
 // Both cone transforms agree on their shared violet-to-amber boundary.
 for(let t=0;t<=1;t+=.05){const dye=canonicalDyes[0].map((v,j)=>v*(1-t)+canonicalDyes[3][j]*t),a=mapper(...dye.map((v,j)=>v+canonicalDyes[1][j]*1e-6),[]),b=mapper(...dye.map((v,j)=>v+canonicalDyes[2][j]*1e-6),[]);a.forEach((v,j)=>assert(Math.abs(v-b[j])<1e-5));}
 for(let i=0;i<500;i++){const dye=[0,1,2].map(j=>Math.abs(Math.sin(i*1.618+j))*12);mapper(...dye,out);assert(out.every(v=>Number.isFinite(v)&&v>=0));if(palette.id==='classic')assert.deepEqual(out,dye);}
 assert.notDeepEqual(chordMood('Cmaj7',palette.id).color,chordMood('Am7',palette.id).color);
}
const snapshot={main:{settings:{},voices:['piano','piano','piano','piano'],custom:['C','Am','F','G']}};
// Use an actual supported voice without coupling to an instrument label.
const {instruments}=await import('../public/music.js?rev=fluid-feedback-82');snapshot.main.voices.fill(Object.keys(instruments)[0]);
assert.equal(sanitizeSnapshot(snapshot).main.settings.colorPalette,'classic');snapshot.main.settings.colorPalette='ember';assert.equal(sanitizeSnapshot(snapshot).main.settings.colorPalette,'ember');snapshot.main.settings.colorPalette='data:text/html';assert.equal(sanitizeSnapshot(snapshot).main.settings.colorPalette,'classic');
const atmosphere=new ChordAtmosphere();atmosphere.frame(0,{chord:'Cmaj7',palette:'tide'});assert.deepEqual(atmosphere.current.color,hexRGB(colorPalettes.tide.colors[0].hex));
const before=structuredClone(atmosphere.current),age=atmosphere.age;atmosphere.frame(0,{chord:'Cmaj7',palette:'ember'});assert.deepEqual(atmosphere.current,before);assert.equal(atmosphere.age,age,'a palette edit does not restart the chord pulse');for(let i=0;i<120;i++)atmosphere.frame(.1,{chord:'Cmaj7',palette:'ember'});assert(atmosphere.current.color.every((v,i)=>Math.abs(v-hexRGB(colorPalettes.ember.colors[0].hex)[i])<1e-4));
console.log('PASS: eight palettes, backward-compatible canonical dye, four exact remapped anchors, continuous dye blending, bounded mapping, validated session state and gently palette-aware chord atmosphere.');
