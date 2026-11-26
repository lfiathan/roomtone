'use strict';
const voices={
 piano:{name:'Electric piano',waves:[['triangle',1,.82],['sine',2,.18]],attack:.008,decay:.75,sustain:.26,release:.2,cutoff:3900},
 bass:{name:'Analog bass',waves:[['sawtooth',1,.38],['sine',1,.62]],attack:.008,decay:.18,sustain:.60,release:.09,cutoff:640},
 pluck:{name:'Plucked strings',waves:[['sawtooth',1,.43],['triangle',2,.30],['sine',1,.27]],attack:.004,decay:.28,sustain:.035,release:.12,cutoff:3100},
 pad:{name:'String pad',waves:[['sawtooth',1,.46,-8],['sawtooth',1,.36,7],['triangle',2,.18]],attack:.16,decay:.8,sustain:.84,release:.32,cutoff:1380},
 organ:{name:'Drawbar organ',waves:[['sine',1,.50],['sine',2,.25],['sine',3,.16],['sine',4,.09]],attack:.012,decay:.11,sustain:.94,release:.09,cutoff:6500},
 bell:{name:'Mallet bells',waves:[['sine',1,.68],['sine',2.76,.21],['sine',5.4,.11]],attack:.003,decay:.45,sustain:.025,release:.30,cutoff:8000},
 lead:{name:'Synth lead',waves:[['square',1,.42],['triangle',1,.58,6]],attack:.025,decay:.18,sustain:.64,release:.15,cutoff:1830},
 triangle:{name:'Soft keys',waves:[['triangle',1,1]],attack:.01,decay:.45,sustain:.60,release:.11,cutoff:3300},
 sine:{name:'Pure tone',waves:[['sine',1,1]],attack:.01,decay:.25,sustain:.8,release:.1,cutoff:9000},
 sawtooth:{name:'Bright synth',waves:[['sawtooth',1,1]],attack:.012,decay:.25,sustain:.58,release:.1,cutoff:2350}
};
const MusicEngine=(()=>{
 let mixer, takes=null, finished=null;
 const sounding=new Set();
 function setup(){
  if(!StudioAudio.ready())return false;
  if(mixer)return true;
  const ctx=StudioAudio.context, filter=ctx.createBiquadFilter(), deckA=ctx.createGain(),deckB=ctx.createGain();
  filter.type='lowpass';filter.Q.value=.72;filter.frequency.value=18000;
  deckA.connect(filter);deckB.connect(filter);filter.connect(StudioAudio.output);
  mixer={filter,deckA,deckB,bus:{}};
  for(const [name,parent] of Object.entries({drums:deckA,bass:deckA,chords:deckB,arp:deckB,live:filter})){
   const g=ctx.createGain();g.connect(parent);mixer.bus[name]=g;
  }
  return true;
 }
 function setMix(settings){
  if(!mixer)return;
  const time=StudioAudio.context.currentTime;
  const target=(gain,value)=>gain.setTargetAtTime(value,time,.012);
  const angle=settings.blend*Math.PI/200;
  target(mixer.deckA.gain,Math.cos(angle));target(mixer.deckB.gain,Math.sin(angle));
  for(const [i,name] of ['drums','bass','chords','arp'].entries())target(mixer.bus[name].gain,settings.layers[i]?settings.levels[i]/100:0);
  target(mixer.filter.frequency,180*100**(settings.filter/100));
 }
 function play(pitch,patch,options={}){
  if(!setup())return ()=>{};
  const ctx=StudioAudio.context, cfg=voices[patch]||voices.piano, at=options.at??ctx.currentTime;
  const limit=options.duration, strength=options.level??.24;
  const env=ctx.createGain(), filter=ctx.createBiquadFilter();
  filter.type='lowpass';filter.frequency.value=cfg.cutoff;
  env.connect(filter);filter.connect(options.bus?mixer.bus[options.bus]:StudioAudio.output);
  const peak=Math.max(.0002,strength), floor=.0001, sustain=Math.max(floor,peak*cfg.sustain);
  const envelope=(age)=>age<=0?floor:age<cfg.attack?floor+(peak-floor)*age/cfg.attack:age<cfg.attack+cfg.decay?peak*(sustain/peak)**((age-cfg.attack)/cfg.decay):sustain;
  env.gain.setValueAtTime(floor,at);env.gain.linearRampToValueAtTime(peak,at+cfg.attack);env.gain.exponentialRampToValueAtTime(sustain,at+cfg.attack+cfg.decay);
  let remaining=cfg.waves.length;
  const oscillators=cfg.waves.map(([type,ratio,weight,detune=0])=>{
   const osc=ctx.createOscillator(),level=ctx.createGain();
   osc.type=type;osc.frequency.value=440*2**((pitch-69)/12)*ratio;osc.detune.value=detune;level.gain.value=weight;
   osc.connect(level);level.connect(env);osc.onended=()=>{osc.disconnect();level.disconnect();if(!--remaining){filter.disconnect();env.disconnect();sounding.delete(silence);}};
   osc.start(at);return osc;
  });
  let releaseAt=Infinity;
  function release(when=ctx.currentTime,tail=cfg.release){
   if(when>=releaseAt)return;
   releaseAt=when;
   const t=Math.max(when,at+.003);
   env.gain.cancelScheduledValues(t);
   // Restore the truncated attack or decay ramp before beginning the release.
   const val=Math.max(floor,envelope(t-at));
   if(t<=at+cfg.attack)env.gain.linearRampToValueAtTime(val,t);else if(t<=at+cfg.attack+cfg.decay)env.gain.exponentialRampToValueAtTime(val,t);else env.gain.setValueAtTime(val,t);
   env.gain.exponentialRampToValueAtTime(floor,t+tail);
   oscillators.forEach(osc=>osc.stop(t+tail+.01));
  }
  function silence(){oscillators.forEach(o=>{try{o.stop();}catch{}});}
  sounding.add(silence);if(limit!==undefined)release(at+limit);return ()=>release();
 }
 function hit(id,t,strength=.85,bus){
  if(!setup())return;const ctx=StudioAudio.context,dest=bus?mixer.bus[bus]:StudioAudio.output;
  t=t??ctx.currentTime;
  if(['kick','snare','hat','click','accent'].includes(id)){StudioAudio.drum(id,t,strength,dest);return;}
  if(id==='tom'||id==='rim'){
   const tom=id==='tom',o=ctx.createOscillator(),env=ctx.createGain();
   o.type=tom?'sine':'triangle';o.frequency.setValueAtTime(tom?211:1220,t);o.frequency.exponentialRampToValueAtTime(tom?75:720,t+(tom?.18:.035));
   env.gain.setValueAtTime(strength*(tom?.48:.37),t);env.gain.exponentialRampToValueAtTime(.0001,t+(tom?.25:.06));o.connect(env);env.connect(dest);
   const kill=()=>{try{o.stop();}catch{}};sounding.add(kill);o.onended=()=>{sounding.delete(kill);env.disconnect();o.disconnect();};o.start(t);o.stop(t+.29);return;
  }
  if(id==='ride')play(85,'bell',{at:t,duration:.20,level:.05*strength,bus});
  const dur={openhat:.29,clap:.19,shaker:.10,ride:.28}[id];if(!dur)return;
  if(!mixer.noise){
   mixer.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.35),ctx.sampleRate);const arr=mixer.noise.getChannelData(0);
   for(let i=0;i<arr.length;i++)arr[i]=Math.random()*2-1;
  }
  const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
  src.buffer=mixer.noise;f.type=id==='openhat'?'highpass':'bandpass';f.frequency.value={openhat:6500,clap:1250,shaker:4800,ride:5600}[id];f.Q.value=id==='shaker'?1.6:.8;
  const level=strength*(id==='clap'?.6:.27);g.gain.setValueAtTime(id==='shaker'?.001:level,t);
  if(id==='clap')for(const dt of [.012,.025]){g.gain.exponentialRampToValueAtTime(.001,t+dt-.002);g.gain.setValueAtTime(level,t+dt);}
  if(id==='shaker')g.gain.linearRampToValueAtTime(level,t+.026);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);src.connect(f);f.connect(g);g.connect(dest);
  const kill=()=>{try{src.stop();}catch{}};sounding.add(kill);src.onended=()=>{sounding.delete(kill);src.disconnect();f.disconnect();g.disconnect();};
  src.start(t);src.stop(t+dur+.01);
 }
 function stopVoices(){for(const stop of sounding)stop();}
 function wav(chunks,samples,rate){
  const bytes=new ArrayBuffer(44+samples*2),v=new DataView(bytes);
  function tag(i,s){for(let j=0;j<s.length;j++)v.setUint8(i+j,s.charCodeAt(j));}
  tag(0,'RIFF');v.setUint32(4,bytes.byteLength-8,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);
  v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);
  v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,samples*2,true);
  let off=44;for(const chunk of chunks)for(const s of chunk){const x=Math.max(-1,Math.min(1,s));v.setInt16(off,x<0?x*32768:x*32767,true);off+=2;}
  return new Blob([bytes],{type:'audio/wav'});
 }
 function beginTake(onLimit){
  if(!setup()||takes)return false;
  const ctx=StudioAudio.context, tap=ctx.createScriptProcessor(1024,1,1),silent=ctx.createGain();silent.gain.value=0;
  const session={chunks:[],samples:0,tap,silent,rate:ctx.sampleRate};takes=session;
  // An inaudible output keeps the input tap processing in local-file browsers.
  StudioAudio.output.connect(tap);tap.connect(silent);silent.connect(ctx.destination);
  tap.onaudioprocess=e=>{
   if(takes!==session)return;
   const limit=180*session.rate-session.samples,arr=e.inputBuffer.getChannelData(0);
   if(limit>0){const copy=arr.slice(0,Math.min(limit,arr.length));session.chunks.push(copy);session.samples+=copy.length;}
   if(session.samples>=180*session.rate)onLimit();
  };
  return true;
 }
 function endTake(){
  if(!takes)return finished;const session=takes;takes=null;
  session.tap.onaudioprocess=null;StudioAudio.output.disconnect(session.tap);session.tap.disconnect();session.silent.disconnect();
  if(!session.samples)return finished;
  const blob=wav(session.chunks,session.samples,session.rate);
  if(finished)URL.revokeObjectURL(finished.url);
  finished={url:URL.createObjectURL(blob),seconds:session.samples/session.rate,blob};
  return finished;
 }
 return {setup,setMix,play,hit,stopVoices,wav,beginTake,endTake,get take(){return finished;},get recording(){return !!takes;},get seconds(){return takes?takes.samples/takes.rate:0;}};
})();
