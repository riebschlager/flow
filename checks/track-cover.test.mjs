import assert from 'node:assert/strict';
import {trackCover,trackSeed} from '../public/track-cover.js';
const svg=trackCover('Quiet water','River');
assert.equal(svg,trackCover('Quiet water','River'));
assert.notEqual(svg,trackCover('Other water','River'));
assert.notEqual(svg,trackCover('Quiet water','Other artist'));
assert.notEqual(trackSeed('ab','c'),trackSeed('a','bc'));
assert.equal(trackCover(' Café ','River'),trackCover('Cafe\u0301','River'));
assert(!trackCover('<script>alert(1)</script>','" onload="evil()').includes('script'));
assert(!svg.includes('NaN'));
assert.match(svg, /<linearGradient/);assert.match(svg, /<radialGradient/);
const ids=[...svg.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,2);
for(const id of ids)assert.match(id,/^flow-cover-\d+-(gradient|glow)$/);
for(const [,ref] of svg.matchAll(/url\(#([^)]*)\)/g))assert(ids.includes(ref));
const otherIds=[...trackCover('Other water','River').matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
assert(ids.every(id=>!otherIds.includes(id)));
const densities=new Set();
for(let i=0;i<200;i++){
 const cover=trackCover('Song '+i,'Artist');
 const dots=[...cover.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\/>/g)];
 const columns=Math.sqrt(dots.length);
 assert(Number.isInteger(columns)&&columns>=15&&columns<=35);
 densities.add(columns);
 for(const [,x,y,r] of dots){assert(+r>0&&+r<150/columns);assert(+x- +r>=0&&+x+ +r<=300);assert(+y- +r>=0&&+y+ +r<=300);}
}
assert(densities.size>=18,'Track metadata should produce a wide range of grid densities');
const allowed=new Set(['#202339','#b7a0ff','#73e2d0','#ff9e9e','#edca82']);
for(const color of svg.match(/#[a-f0-9]{6}/g))assert(allowed.has(color));
assert.equal(new Set(Array.from({length:200},(_,i)=>trackCover('Song '+i,'Artist'))).size,200);
console.log('PASS: reproducible, distinct, Unicode-normalized SVG covers, unambiguous metadata seeds, safe gradient markup, bounded halftone dots, varied per-track density, sketch palette.');
