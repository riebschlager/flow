import {performance} from 'node:perf_hooks';
import {Fluid} from '../public/fluid.js';
import {createFluidColorizer} from '../public/fluid-renderer.js';
import {VisibleSound} from '../public/visible-sound.js';
const gradient={addColorStop(){}},ctx={save(){},restore(){},fillRect(){},beginPath(){},ellipse(){},stroke(){},moveTo(){},lineTo(){},arc(){},fill(){},createRadialGradient:()=>gradient};
for(const [name,w,h,mobile] of [['desktop',241,144,false],['phone',111,145,true]]){
 const sim=new Fluid(w,h),color=createFluidColorizer('aurora'),fx=new VisibleSound({energy:100,mobile});for(let i=0;i<28;i++)sim.splat(.18+(i%7)*.1,.22+Math.floor(i/7)*.15,[.4,.3,1],.04,Math.sin(i)*10,Math.cos(i)*8);for(let i=0;i<30;i++)sim.step();
 for(let i=0;i<48;i++)fx.halos.push({x:.5,y:.5,at:0,level:1,color:'#abcdef',curve:[{time:0,volume:1},{time:1e6,volume:1}]});for(let i=0;i<384;i++)fx.echoes.push({x:.5,y:.5,at:0,gain:.3,color:'#abcdef'});
 const updates=[],draws=[];for(let run=0;run<10;run++){let start=performance.now();for(let i=0;i<120;i++)fx.update(1/60,1,sim,color,.8);updates.push((performance.now()-start)/120);start=performance.now();for(let i=0;i<120;i++)fx.draw(ctx,1000,600,1,[.5,.5,.7]);draws.push((performance.now()-start)/120);}
 const median=a=>a.sort((a,b)=>a-b)[a.length>>1];console.log(JSON.stringify({name,grid:[w,h],motes:mobile?220:600,halos:48,echoes:384,updateMs:median(updates),drawSubmissionMs:median(draws),cpuBudgetMs:2,note:'Draw uses a no-op canvas; excludes browser raster/compositing and is not phone hardware timing.'}));
}
