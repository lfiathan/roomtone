const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.resolve(__dirname,'..','repositories','music-learning')+'/',ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'site-assets','sound.js'),'utf8'),ctx);
const notes=vm.runInContext('score',ctx), ticks=480, end=64*ticks;
function variable(value){const bytes=[value&127];while(value>>=7)bytes.unshift((value&127)|128);return bytes;}
function named(t,name){const b=Buffer.from(name);return [0xff,t,...variable(b.length),...b];}
function track(name,events){let prev=0;const chunks=[0,...named(3,name)];
  events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]).forEach(([t,order,msg])=>{chunks.push(...variable(t-prev),...msg);prev=t;});
  chunks.push(...variable(end-prev),0xff,0x2f,0);
  const size=Buffer.alloc(4);size.writeUInt32BE(chunks.length);return Buffer.concat([Buffer.from('MTrk'),size,Buffer.from(chunks)]);
}
const conduct=[[0,0,[0xff,0x51,3,0x09,0x89,0x68]],[0,1,[0xff,0x58,4,4,2,24,8]],[0,2,[0xff,0x59,2,0,0]]];
['Intro','Verse','Hook','Outro'].forEach((section,i)=>conduct.push([i*16*ticks,3,named(6,section)]));
const tracks=[track('Window Seat',conduct)];
for(const [name,roles,ch,program] of [['Piano chords',['chords'],0,0],['Bass',['bass'],1,33],['Hook',['lead'],2,11],['Drum kit',['kick','snare','hat'],9,0]]){
 const events=ch===9?[]:[[0,-1,[0xc0|ch,program]]];
 notes.filter(n=>roles.includes(n.role)).forEach(n=>{events.push([Math.round(n.beat*ticks),1,[0x90|ch,n.pitch,n.velocity]],[Math.round((n.beat+n.length)*ticks),0,[0x80|ch,n.pitch,0]]);});
 tracks.push(track(name,events));
}
const header=Buffer.from([77,84,104,100,0,0,0,6,0,1,0,tracks.length,ticks>>8,ticks&255]);
fs.writeFileSync(base+'window-seat.mid',Buffer.concat([header,...tracks]));
console.log(notes.length+' note events; 16 bars, 96 BPM, 4 instrument tracks.');

