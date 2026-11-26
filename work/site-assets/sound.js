'use strict';
const tones = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const pitchLabel = n => tones[n % 12] + (Math.floor(n / 12) - 1);
const harmony = {
 C:{notes:[60,64,67],bass:36}, G:{notes:[59,62,67],bass:31},
 Am:{notes:[57,60,64],bass:33}, F:{notes:[57,60,65],bass:29}
};
const songChords = ['C','G','Am','F','C','G','Am','F','C','G','Am','F','C','G','F','C'];
const hook = [[[64,1],[67,1],[69,1],[67,1]],[[67,1],[71,1],[74,2]],[[72,1],[76,1],[69,2]],[[69,1],[67,1],[65,2]]];
const partName = bar => ['Intro','Verse','Hook','Outro'][Math.floor(bar/4)];
function makeScore(){
 const events=[];
 const add=(beat,role,pitch,length,velocity)=>events.push({beat,role,pitch,length,velocity});
 songChords.forEach((chord,bar)=>{
  const start=bar*4, {notes,bass}=harmony[chord];
  notes.forEach(pitch=>add(start,'chords',pitch,bar===15?3.95:3.7,64));
  if(bar>=4 && bar<12){
   add(start,'bass',bass,bar<8?2.8:1.55,82);
   if(bar>=8) add(start+2,'bass',bass,1.55,76);
   add(start,'kick',36,0.25,90);
   if(bar>=8) add(start+2,'kick',36,0.25,83);
   add(start+3,'snare',38,0.22,75);
   if(bar>=8) add(start+1,'snare',38,0.22,76);
   for(let t=0;t<4;t+=bar>=8?0.5:1) add(start+t,'hat',42,0.12,t%1?42:57);
  }
  if(bar>=8 && bar<12){
   let pos=start;
   hook[bar-8].forEach(([pitch,beats])=>{add(pos,'lead',pitch,beats*0.88,86);pos+=beats;});
  }
 });
 return events.sort((a,b)=>a.beat-b.beat);
}
const score=makeScore();
const StudioAudio=(()=>{
 let ctx, master, noise, current=null, interval, volume=0.68;
 const pending=new Set(), live=new Set();
 function ready(){
  if(!ctx){
   const Type=window.AudioContext||window.webkitAudioContext;
   if(!Type){document.getElementById('status').classList.remove('sr-only'); document.getElementById('status').textContent='Sound requires a browser with Web Audio support.';return false;}
   ctx=new Type();master=ctx.createGain();master.gain.value=volume*0.7;master.connect(ctx.destination);
   noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.4),ctx.sampleRate);
   const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  if(ctx.state==='suspended'||ctx.state==='interrupted')ctx.resume().catch(()=>{});
  return true;
 }
 function setVolume(v){volume=v; if(master)master.gain.setTargetAtTime(volume*0.7,ctx.currentTime,0.015);}
 function voice(src,end,nodes){
  live.add(src);src.onended=()=>{live.delete(src);src.disconnect();nodes.forEach(n=>n.disconnect());};src.stop(end);
 }
 function note(pitch,at,length,role='keys',strength=0.8,type='triangle'){
  const osc=ctx.createOscillator(),env=ctx.createGain(), lp=ctx.createBiquadFilter();
  osc.type=role==='bass'?'sine':type;
  osc.frequency.value=440*2**((pitch-69)/12);
  lp.type='lowpass';lp.frequency.value=role==='bass'?680:role==='chords'?1650:2900;
  const level=(role==='chords'?0.095:role==='bass'?0.30:0.20)*strength;
  const attack=role==='chords'?0.029:0.009;
  env.gain.setValueAtTime(0.0001,at);env.gain.exponentialRampToValueAtTime(Math.max(0.001,level),at+attack);
  env.gain.exponentialRampToValueAtTime(Math.max(0.001,level*0.5),at+Math.max(attack+0.02,length*0.8));
  env.gain.exponentialRampToValueAtTime(0.0001,at+length+0.09);
  osc.connect(lp);lp.connect(env);env.connect(master);osc.start(at);voice(osc,at+length+0.11,[lp,env]);
 }
 function drum(kind,t,strength=0.8,output=master){
  if(kind==='kick'||kind==='click'||kind==='accent'){
   const o=ctx.createOscillator(),e=ctx.createGain();const kick=kind==='kick';
   o.frequency.setValueAtTime(kick?145:kind==='accent'?1200:820,t);if(kick)o.frequency.exponentialRampToValueAtTime(46,t+0.11);
   const d=kick?0.26:0.045;e.gain.setValueAtTime((kick?0.55:0.25)*strength,t);e.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(e);e.connect(output);o.start(t);voice(o,t+d+0.01,[e]);return;
  }
  const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),e=ctx.createGain();
  src.buffer=noise;f.type=kind==='hat'?'highpass':'bandpass';f.frequency.value=kind==='hat'?7000:1750;f.Q.value=0.7;
  const dur=kind==='hat'?0.065:0.16;e.gain.setValueAtTime((kind==='hat'?0.18:0.57)*strength,t);e.gain.exponentialRampToValueAtTime(0.0001,t+dur);src.connect(f);f.connect(e);e.connect(output);src.start(t);voice(src,t+dur+0.015,[f,e]);
 }
 function stop(){
  clearInterval(interval);pending.forEach(clearTimeout);pending.clear();current=null;
  for(const src of live){try{src.stop();}catch{}}
  document.dispatchEvent(new Event('transportchange'));
 }
 function later(fn,time){const id=setTimeout(()=>{pending.delete(id);fn();},Math.max(0,(time-ctx.currentTime)*1000));pending.add(id);}
 function sequence(name,total,tempo,onStep,onShow,loop=false,subdivision=2,stepLength=()=>1){
  stop();if(!ready())return;
  let step=0,next=ctx.currentTime+0.06;current=name;
  document.dispatchEvent(new Event('transportchange'));
  const tick=()=>{
   while(next<ctx.currentTime+0.13){
    if(!loop && step>=total){clearInterval(interval);later(stop,next+0.1);return;}
    const i=step%total;const secs=60/tempo()/subdivision;
    onStep(i,next,secs);if(onShow)later(()=>onShow(i),next);next+=secs*stepLength(i);step++;
   }
  };
  interval=setInterval(tick,24);tick();
 }
 function playSong(show){
  let pos=0;
  sequence('song',128,()=>96,(step,t,half)=>{
    while(pos<score.length && score[pos].beat===step/2){
     const e=score[pos++];if(['kick','hat','snare'].includes(e.role))drum(e.role,t,e.velocity/100);else note(e.pitch,t,e.length*half*2,e.role,e.velocity/100);
    }
  },i=>show(Math.floor(i/8),Math.floor(i/2)%4));
 }
 function playNotes(notes,arpeggiate=false,type='triangle'){
  if(!ready())return;const t=ctx.currentTime+0.015;
  notes.forEach((n,i)=>note(n,t+(arpeggiate?i*0.27:0),arpeggiate?0.23:0.64,notes.length>1&&!arpeggiate?'chords':'keys',0.9,type));
 }
 return {get context(){return ctx;},get output(){return master;},ready,stop,sequence,playSong,playNotes,drum,setVolume,get volume(){return volume;},get current(){return current;}};
})();
