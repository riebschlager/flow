export const WAV_MEMORY_LIMIT=704*1024*1024;
export function wavHeader(frames,sampleRate){const bytes=new ArrayBuffer(44),v=new DataView(bytes),text=(at,s)=>Array.from(s).forEach((c,i)=>v.setUint8(at+i,c.charCodeAt(0)));text(0,'RIFF');v.setUint32(4,36+frames*4,true);text(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,sampleRate,true);v.setUint32(28,sampleRate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,frames*4,true);return bytes;}
export class WavChunks{
 constructor(sampleRate,seconds,{fades=false,limit=WAV_MEMORY_LIMIT}={}){if(!Number.isFinite(seconds)||seconds<=0||!Number.isFinite(sampleRate)||sampleRate<=0)throw new Error('Invalid audio render duration or sample rate.');this.sampleRate=sampleRate;this.frames=Math.round(seconds*sampleRate);if(this.frames*4+44>limit)throw new Error('This render exceeds the 704 MiB PCM ceiling. Choose fewer minutes or a lower device sample rate.');this.fades=fades;this.offset=0;this.parts=[];}
 add(channels){const length=Math.min(channels[0].length,this.frames-this.offset);if(length<=0)return;const pcm=new ArrayBuffer(length*4),view=new DataView(pcm);for(let i=0;i<length;i++){const frame=this.offset+i,gain=this.fades?Math.max(0,Math.min(1,frame/(this.sampleRate*3),(this.frames-1-frame)/(this.sampleRate*6))):1;for(let ch=0;ch<2;ch++)view.setInt16(i*4+ch*2,Math.round(Math.max(-1,Math.min(1,(channels[ch]?.[i]??channels[0][i])*gain))*32767),true);}this.parts.push(new Blob([pcm]));this.offset+=length;}
 finish(){if(this.offset!==this.frames)throw new Error('The audio render was interrupted.');const blob=new Blob([wavHeader(this.frames,this.sampleRate),...this.parts],{type:'audio/wav'});this.parts=[];return blob;}
 cancel(){this.parts=[];}
}
export const clipSizes={'9:16':[720,1280],'1:1':[1080,1080],'16:9':[1280,720]};
export function clipMime(Recorder=globalThis.MediaRecorder){if(!Recorder)throw new Error('Video export needs MediaRecorder support.');for(const mime of ['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'])if(Recorder.isTypeSupported(mime))return mime;throw new Error('This browser cannot record MP4 or WebM clips.');}
// Normalized source bounds keep fluid and overlay aligned even at different DPRs.
export function clipFrame(width,height,targetWidth,targetHeight,framing='fill'){
 const scale=(framing==='fit'?Math.min:Math.max)(targetWidth/width,targetHeight/height);
 const w=Math.min(1,targetWidth/(width*scale)),h=Math.min(1,targetHeight/(height*scale));
 return {x:(1-w)/2,y:(1-h)/2,w,h,dx:Math.max(0,(targetWidth-width*scale)/2),dy:Math.max(0,(targetHeight-height*scale)/2),dw:Math.min(targetWidth,width*scale),dh:Math.min(targetHeight,height*scale)};
}
export function compositeFrame(ctx,canvas,layers,{framing='fill'}={}){
 ctx.fillStyle='#070b11';ctx.fillRect(0,0,canvas.width,canvas.height);
 const source=layers.find(layer=>layer.width>0&&layer.height>0);if(!source)return;
 const f=clipFrame(source.width,source.height,canvas.width,canvas.height,framing);
 for(const layer of layers){if(layer.width>0&&layer.height>0)ctx.drawImage(layer,f.x*layer.width,f.y*layer.height,f.w*layer.width,f.h*layer.height,f.dx,f.dy,f.dw,f.dh);}
}
export class ClipCapture{
 constructor(audio,layers,{aspect='9:16',framing='fill',Recorder=globalThis.MediaRecorder,Stream=globalThis.MediaStream,makeCanvas=()=>document.createElement('canvas')}={}){this.audio=audio;this.layers=layers;this.framing=framing==='fit'?'fit':'fill';this.Recorder=Recorder;this.Stream=Stream;this.mime=clipMime(Recorder);this.canvas=makeCanvas();[this.canvas.width,this.canvas.height]=clipSizes[aspect]||clipSizes['9:16'];this.ctx=this.canvas.getContext('2d');this.parts=[];}
 start(){if(!this.canvas.captureStream||!this.audio.ctx.createMediaStreamDestination)throw new Error('This browser cannot capture canvas video with audio.');this.destination=this.audio.ctx.createMediaStreamDestination();this.audio.master.connect(this.destination);this.video=this.canvas.captureStream(30);this.stream=new this.Stream([...this.video.getVideoTracks(),...this.destination.stream.getAudioTracks()]);this.recorder=new this.Recorder(this.stream,{mimeType:this.mime,videoBitsPerSecond:4000000});this.done=new Promise((resolve,reject)=>{this.resolve=resolve;this.reject=reject;});this.recorder.ondataavailable=e=>{if(e.data?.size)this.parts.push(e.data);};this.recorder.onerror=()=>{this.reject(new Error('Video capture failed. Try another browser.'));this.cancel();};this.recorder.onstop=()=>{const blob=this.cancelled?null:new Blob(this.parts,{type:this.recorder.mimeType||this.mime});this.parts=[];this.cleanup();this.resolve(blob);};this.draw();this.recorder.start(1000);return this.done;}
 draw(){compositeFrame(this.ctx,this.canvas,this.layers,{framing:this.framing});}
 get frame(){const source=this.layers[0];return clipFrame(source.width,source.height,this.canvas.width,this.canvas.height,this.framing);}
 stop(){if(this.recorder?.state==='recording')this.recorder.stop();}
 cleanup(){if(this.cleaned)return;this.cleaned=true;try{this.audio.master.disconnect(this.destination);}catch{}for(const track of this.stream?.getTracks()||[])track.stop();this.destination?.disconnect();}
 cancel(){this.cancelled=true;this.parts=[];this.stop();this.cleanup();this.resolve?.(null);}
 get suffix(){return this.mime.startsWith('video/mp4')?'.mp4':'.webm';}
}
