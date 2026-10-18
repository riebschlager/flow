// A snapshot of the launching chart keeps "next" predictable even if likes change.
export class PresentationQueue{
 constructor({tracks=[],page=-1,hasMore=true,fetchPage,load,prepare,currentId}){
  Object.assign(this,{tracks:[...tracks],page,hasMore,fetchPage,load,prepare});
  const current=this.tracks.findIndex(t=>t.id===currentId);
  if(current>=0)this.tracks=[...this.tracks.slice(current+1),...this.tracks.slice(0,current)];
  this.index=0;
  this.seen=new Set([currentId]);this.pending=null;this.closed=false;
 }
 warm(){if(!this.pending)this.pending=this.find();return this.pending;}
 async find(){
  let failures=0;
  while(!this.closed){
   if(this.index>=this.tracks.length){
    if(!this.hasMore)return null;
    const result=await this.fetchPage(this.page+1);if(this.closed)return null;
    const known=new Set(this.tracks.map(t=>t.id));this.tracks.push(...result.tracks.filter(t=>!known.has(t.id)));
    this.page=result.page;this.hasMore=result.hasMore;
    // Avoid unbounded paging through an empty or concurrently changing chart.
    if(this.index>=this.tracks.length)return null;
   }
   const track=this.tracks[this.index++];if(this.seen.has(track.id))continue;
   this.seen.add(track.id);
   try{const take=await this.load(track);if(this.closed)return null;await this.prepare(take);return this.closed?null:take;}
   catch(error){if(++failures>=5)throw error;}
  }
  return null;
 }
 async next(){try{return await this.warm();}finally{this.pending=null;}}
 close(){this.closed=true;this.pending=null;}
}
