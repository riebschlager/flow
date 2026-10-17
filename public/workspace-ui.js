// Presentation only: these helpers never change composition settings or audio.
const $=id=>document.getElementById(id);
const selected=id=>{const node=$(id);return node.selectedOptions?.[0]?.textContent||node.value;};
export function createWorkspaceController({switchTab}){
 const layers=[['arpEnabled','arpControls','arpCard'],['rhythmEnabled','rhythmControls','rhythmCard'],['environmentEnabled','environmentControls','environmentCard']];
 function sync(){
  $('arpOverview').textContent=selected('arpVoice')+' · '+selected('arpPattern');
  $('rhythmOverview').textContent=selected('rhythmKit')+' · '+selected('groove');
  $('environmentOverview').textContent=selected('environmentPreset');
  for(const [toggle,,card] of layers)$(card).classList.toggle('is-enabled',$(toggle).checked);
  for(const [toggle,id] of [['arpEnabled','arpMixStatus'],['rhythmEnabled','rhythmMixStatus'],['environmentEnabled','environmentMixStatus']])$(id).textContent=$(toggle).checked?'On':'Off';
 }
 for(const [toggle,editor] of layers)$(toggle).addEventListener('change',()=>{if($(toggle).checked)$(editor).open=true;sync();});
 for(const id of ['arpVoice','arpPattern','rhythmKit','groove','environmentPreset','studioKit','studioGroove','studioEnabled'])$(id).addEventListener('change',sync);
 $('mixFromLayers').onclick=()=>{switchTab('mix');$('mixTab').focus();};$('layersFromMix').onclick=()=>{switchTab('rhythm');$('rhythmTab').focus();};
 sync();return {sync};
}
