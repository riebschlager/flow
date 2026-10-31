import assert from 'node:assert/strict';import fs from 'node:fs';
import {KNOBS,toNorm,fromNorm} from '../public/controls-ui.js';
const html=fs.readFileSync(new URL('../app/instrument.html',import.meta.url),'utf8');
for(const id of Object.keys(KNOBS)){assert.match(html,new RegExp(`<input id="${id}" type="range"`),`${id} is a range input`);assert.match(html,new RegExp(`<label class="slider-label" for="${id}">`),`${id} has a slider label`);}
for(const level of ['volume','dropletsVolume','arpVolume','rhythmVolume','environmentVolume','rain','energy'])assert.ok(!(level in KNOBS),`${level} stays a slider`);
const ms={min:'0',max:'2000',step:'5'},pct={min:'0',max:'100',step:''};
assert.equal(fromNorm(pct,toNorm(pct,65)),65);
for(const x of [0,20,120,180,2000])assert.equal(fromNorm(ms,toNorm(ms,x,3),3),x);
assert.ok(toNorm(ms,200,3)>.45,'skewed taper gives the musical range most of the travel');
assert.equal(fromNorm(ms,.5,3)%5,0,'values snap to the input step');
assert.equal(fromNorm(pct,1.4),100);assert.equal(fromNorm(pct,-1),0);
console.log('PASS: knob ids match the markup, levels stay sliders, tapers round-trip, snap to step and clamp.');
