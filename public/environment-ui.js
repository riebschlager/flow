import {environmentPresets,normalizeEnvironment,EnvironmentSynth} from './environment.js?rev=environment-34';
const $=id=>document.getElementById(id);
export function createEnvironmentController({audio,getOrigin=()=>0,onChange=()=>{},readOnly=()=>false}){
 let config;try{config=normalizeEnvironment(JSON.parse(localStorage.getItem('chromaflow-environment-v1')));}catch{config=normalizeEnvironment();}
 const synth=new EnvironmentSynth(audio);
 function sync(){
  $('environmentEnabled').checked=config.enabled;$('environmentPreset').value=config.preset;$('environmentDescription').textContent=environmentPresets[config.preset].description;
  for(const [id,key] of [['environmentVolume','volume'],['environmentActivity','activity'],['environmentTone','tone']]){$(id).value=config[key];$(id+'Value').textContent=Math.round(config[key])+'%';$(id).style.setProperty('--pct',config[key]+'%');}
  $('environmentStatus').textContent=!config.enabled?'Off · an optional world behind the music':config.volume===0?'Muted · raise the atmosphere mix':audio.replaying?'Recorded atmosphere · follows this session':audio.playing?'Playing · '+environmentPresets[config.preset].name:'Ready · press Begin listening';
 }
 function persist(){try{localStorage.setItem('chromaflow-environment-v1',JSON.stringify(config));}catch{}onChange();}
 function update(){config=normalizeEnvironment(config);sync();if(audio.playing&&!readOnly())synth.apply(config,audio.ctx.currentTime,{origin:getOrigin()});persist();}
 $('environmentEnabled').addEventListener('change',()=>{config.enabled=$('environmentEnabled').checked;update();});$('environmentPreset').addEventListener('change',()=>{config.preset=$('environmentPreset').value;update();});
 for(const [id,key] of [['environmentVolume','volume'],['environmentActivity','activity'],['environmentTone','tone']])$(id).addEventListener('input',()=>{config[key]=Number($(id).value);update();});
 sync();return {getState:()=>({...config}),prepare:()=>synth.prepare(config),start(origin=getOrigin()){synth.apply(config,Math.max(audio.ctx?.currentTime||0,origin),{origin,restart:true});sync();},stop(){synth.stop();sync();},restore(raw,persistSettings=false){config=normalizeEnvironment(raw);sync();if(audio.playing&&!readOnly())synth.apply(config,audio.ctx.currentTime,{origin:getOrigin()});if(persistSettings)persist();},transportChanged:sync};
}
