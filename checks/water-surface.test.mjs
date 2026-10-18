import assert from 'node:assert/strict';
import {WaterSurface} from '../public/water-surface.js';
import {sanitizeSnapshot,mainDefaults} from '../public/recording-state.js';
import {sessionFixture} from './session-fixture.mjs';
const w=80,h=60,source=new Uint8ClampedArray(w*h*4);for(let i=0;i<w*h;i++){source[i*4]=(i%w)*3;source[i*4+1]=(i/w|0)*3;source[i*4+2]=45;source[i*4+3]=255;}
const water=new WaterSurface(),render=(t,o)=>water.render(source.slice(),w,h,t,o);
assert.deepEqual(render(3,{enabled:false}),source);
assert.deepEqual(render(3,{swell:0}),source);
assert.deepEqual(render(0,{speed:0}),render(100,{speed:0}),'zero drift freezes waves');
assert.notDeepEqual(render(0),render(20),'water moves over time');
for(const option of ['refraction','caustics','reflection'])assert.notDeepEqual(render(3,{[option]:0}),render(3,{[option]:100}),option+' independently affects image');
const flow={u:new Float32Array(w*h).fill(10),v:new Float32Array(w*h).fill(-5)},before=flow.u.slice();assert.notDeepEqual(render(3),render(3,{flow}));assert.deepEqual(flow.u,before);
for(const options of [{},{swell:100,refraction:100,caustics:100,reflection:100}]){const result=render(3,options);for(let i=3;i<result.length;i+=4)assert.equal(result[i],255);}
water.render(new Uint8ClampedArray(8*8*4),8,8,0);assert.equal(water.source.length,256);
const snap=sessionFixture().snapshot;snap.main.settings.waterCaustics=150;snap.main.settings.waterSpeed=-4;let s=sanitizeSnapshot(snap).main.settings;assert.equal(s.waterCaustics,100);assert.equal(s.waterSpeed,0);assert.equal(s.waterEnabled,true);
for(const k of Object.keys(mainDefaults).filter(k=>k.startsWith('water')))delete snap.main.settings[k];s=sanitizeSnapshot(snap).main.settings;assert.equal(s.waterEnabled,false,'legacy sessions keep original ink');
console.log('PASS: water bypass, flat surface, frozen drift, independent optics, fluid response, resize, bounds, saved settings and legacy sessions.');
