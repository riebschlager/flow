// Presentation only: these helpers never change composition settings or audio.
const $=id=>document.getElementById(id);
export function createWorkspaceController({switchTab}){
 function sync(){
  for(const [toggle,id] of [['arpEnabled','arpMixStatus'],['rhythmEnabled','rhythmMixStatus'],['environmentEnabled','environmentMixStatus']])$(id).textContent=$(toggle).checked?'On':'Off';
 }
 for(const id of ['arpEnabled','rhythmEnabled','environmentEnabled','studioEnabled'])$(id).addEventListener('change',sync);
 $('layersFromMix').onclick=()=>{switchTab('rhythm');$('rhythmTab').focus();};
 sync();return {sync};
}
