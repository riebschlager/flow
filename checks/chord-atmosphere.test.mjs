import assert from 'node:assert/strict';
import {ChordAtmosphere,chordMood} from '../public/chord-atmosphere.js';
import {Fluid} from '../public/fluid.js';
assert.deepEqual(chordMood('C#maj7'),chordMood('Dbmaj7'));assert(chordMood('Cm').brightness<chordMood('C').brightness);
const colors=['C','D','E','F','G','A','B'].map(chord=>chordMood(chord).color.join(','));assert.equal(new Set(colors).size,7);
const atmosphere=new ChordAtmosphere();atmosphere.frame(0,{chord:'Cmaj7',amount:65});const before=atmosphere.light;
atmosphere.frame(0,{chord:'Am7',index:1,amount:65});assert.deepEqual(atmosphere.light,before,'a chord change must start without a jump');
let previous=atmosphere.light;
for(let i=0;i<240;i++){atmosphere.frame(1/60,{chord:'Am7',index:1,playing:true,amount:65});const light=atmosphere.light;assert(Math.abs(light.brightness-previous.brightness)<.015);assert(light.tint.every((value,j)=>Math.abs(value-previous.tint[j])<.006));previous=light;}
assert.notDeepEqual(atmosphere.light,before);assert(atmosphere.pulse<.01);assert(atmosphere.current.spin<0);
const fluid=new Fluid(96,64);fluid.splat(.5,.5,[.6,.3,.8],.08);const dye=[fluid.r.slice(),fluid.g.slice(),fluid.b.slice()];
for(let i=0;i<60;i++){atmosphere.frame(1/60,{chord:'Fmaj7',index:2,playing:true,amount:100});atmosphere.stir(fluid,1/60);}
const midTransition=atmosphere.light;atmosphere.frame(0,{chord:'G',index:3,playing:true,amount:100});assert.deepEqual(atmosphere.light,midTransition,'interrupting an active bloom must remain continuous');
assert(fluid.u.some(v=>Math.abs(v)>.05));assert.deepEqual(fluid.r,dye[0]);assert.deepEqual(fluid.g,dye[1]);assert.deepEqual(fluid.b,dye[2]);
const unchanged=[fluid.u.slice(),fluid.v.slice()];atmosphere.frame(.1,{chord:'G',index:3,playing:false,amount:100});atmosphere.stir(fluid,.1);assert.deepEqual(fluid.u,unchanged[0]);assert.deepEqual(fluid.v,unchanged[1]);
atmosphere.frame(.1,{chord:'G',index:3,playing:true,amount:0});atmosphere.stir(fluid,.1);assert.deepEqual(atmosphere.light,{brightness:1,tint:[1,1,1]});assert.deepEqual(fluid.u,unchanged[0]);
let draws=0,waves=0,colorsSeen=[];const ctx={save(){},restore(){},translate(){waves++;},scale(){},createRadialGradient(){return {addColorStop(position,color){colorsSeen.push(color);}};},fillRect(){draws++;},fillText(){throw new Error('Atmosphere must not draw chord labels');}};
atmosphere.draw(ctx,900,600);assert.equal(draws,0);
atmosphere.frame(.1,{chord:'Cmaj7',index:0,playing:true,amount:65});atmosphere.draw(ctx,900,600);assert(draws>0);assert.equal(ctx.globalCompositeOperation,'soft-light','atmosphere must not screen pale light over the fluid');assert(waves>0);assert(colorsSeen.every(color=>color.startsWith('rgba(')));
const still=new ChordAtmosphere({reducedMotion:true});still.frame(0,{chord:'Cmaj7',amount:65});still.frame(.1,{chord:'Am7',index:1,playing:true,amount:65});const initialU=fluid.u.slice();still.stir(fluid,.1);assert.deepEqual(fluid.u,initialU);assert.deepEqual(still.center,{x:.5,y:.48});waves=0;still.draw(ctx,900,600);assert.equal(waves,0);
for(let i=0;i<300;i++){const chords=['Cmaj7','Am7','Fmaj7','G'],index=Math.floor(i/75)%4;atmosphere.frame(1/30,{chord:chords[index],index,playing:true,amount:100});atmosphere.stir(fluid,1/30);fluid.step(1/30);}
assert([...fluid.u,...fluid.v,...fluid.r,...fluid.g,...fluid.b].every(Number.isFinite));
console.log('PASS: distinct repeatable chord moods, enharmonic consistency, continuous fades, bounded brightness, dye-free currents, pause/zero settings, abstract light rendering, reduced-motion behavior, and fluid stability across progression cycles.');
