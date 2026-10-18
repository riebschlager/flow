// Native pickers keep mobile interaction and keyboard behavior familiar.
// Menus carry names; the selected option's supporting detail lives below.
export function optionPresentation(text, limit=32){
 const full=text.trim(), separator=full.indexOf(' · ');
 const name=separator<0?full:full.slice(0,separator);
 const label=Array.from(name).length>limit?Array.from(name).slice(0,limit-1).join('').trimEnd()+'…':name;
 return {label, detail:separator<0?(label===full?'':full):(label===name?'':name+' · ')+full.slice(separator+3)};
}
export function enhanceSelects(root=document){
 const entries=new Map();let next=0;
 function sync(select){
  let entry=entries.get(select);
  if(!entry){entry={details:new Map(),node:null};entries.set(select,entry);}
  entry.details.clear();
  for(const option of select.options){const view=optionPresentation(option.textContent);if(option.label!==view.label)option.label=view.label;entry.details.set(option,view.detail);}
  const detail=entry.details.get(select.selectedOptions[0])||'';
  if(!detail&&!entry.node)return;
  if(!entry.node){
   const node=document.createElement('p');node.className='select-detail helper';
   do{node.id='select-detail-'+(++next);}while(document.getElementById(node.id));
   select.after(node);entry.node=node;
   const ids=new Set((select.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(node.id);select.setAttribute('aria-describedby',[...ids].join(' '));
  }
  if(entry.node.textContent!==detail)entry.node.textContent=detail;
  entry.node.hidden=!detail;
 }
 function refresh(){root.querySelectorAll('select').forEach(sync);for(const [select,entry] of entries)if(!select.isConnected){entry.node?.remove();entries.delete(select);}}
 const observer=new MutationObserver(records=>{if(records.some(record=>record.target.closest?.('select')||[...record.addedNodes,...record.removedNodes].some(node=>node.nodeType===1&&(node.matches('select')||node.querySelector('select')))))refresh();});
 observer.observe(root.body||root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['selected','disabled']});
 root.addEventListener('change',()=>queueMicrotask(refresh));root.addEventListener('focusin',event=>{if(event.target.matches?.('select'))sync(event.target);});root.addEventListener('flow:selects',refresh);
 refresh();return refresh;
}
if(typeof document!=='undefined')enhanceSelects();
