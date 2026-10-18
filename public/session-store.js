// Working documents are independent of immutable captured performances.
export class SessionStore {
 async open(){
  if(!this.pending)this.pending=new Promise((resolve,reject)=>{
   const r=indexedDB.open('flow-working-sessions',1);
   r.onupgradeneeded=()=>r.result.createObjectStore('sessions',{keyPath:'id'});
   r.onsuccess=()=>resolve(r.result);
   r.onerror=()=>{this.pending=null;reject(new Error('Session storage is unavailable.'));};
  });
  return this.pending;
 }
 async transaction(mode,action){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('sessions',mode);const r=action(tx.objectStore('sessions'));let value;r.onsuccess=()=>value=r.result;tx.oncomplete=()=>resolve(value);tx.onerror=tx.onabort=()=>reject(new Error('Session could not be saved. Download a backup before leaving.'));});}
 get(id){return this.transaction('readonly',s=>s.get(id));}
 put(session){return this.transaction('readwrite',s=>s.put(session));}
 async list(){return (await this.transaction('readonly',s=>s.getAll())).sort((a,b)=>b.updated.localeCompare(a.updated));}
}
export function sessionRoute(path){const match=path.match(/^\/sessions\/([^/]+)\/?$/);return match?decodeURIComponent(match[1]):null;}
