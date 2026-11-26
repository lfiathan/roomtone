'use strict';
const kit=[
 ['kick','Kick',36],['snare','Snare',38],['hat','Closed hat',42],['openhat','Open hat',46],['clap','Clap',39],['tom','Low tom',45],['rim','Rim',37],['shaker','Shaker',82],['ride','Ride',51]
];
const meters={
 '4/4':{beats:4,div:4,unit:'quarter note'},'3/4':{beats:3,div:4,unit:'quarter note'},
 '6/8':{beats:2,div:6,unit:'dotted quarter'},'12/8':{beats:4,div:6,unit:'dotted quarter'}
};
const quarters=[0,4,8,12], eighths=[0,2,4,6,8,10,12,14], offbeats=[2,6,10,14], back=[4,12], sixteenths=Array.from({length:16},(_,i)=>i);
function template(id,family,name,bpm,cue,parts,options={}){
 return {id,family,name,bpm,cue,parts,meter:'4/4',swing:50,...options};
}
const beatsLibrary=[
 template('pop','Pop & soul','Pop backbeat',104,'Follow the snare on 2 and 4. The extra kick at the end leads into the next bar.',{kick:[0,8,14],snare:back,hat:eighths,clap:[12]}),
 template('synthpop','Pop & soul','Synth-pop',116,'A steady kick and clipped claps leave room for a bright synth hook.',{kick:quarters,clap:back,hat:[0,2,6,8,10,14],tom:[15]}),
 template('funk','Pop & soul','Funk',104,'Count the sixteenth-note hats while the kick and short snare pickups skip across them.',{kick:[0,3,6,10],snare:[4,11,12],hat:sixteenths,openhat:[14]}),
 template('soul','Pop & soul','Soul',94,'Tap the backbeat, then listen for the shaker answering each snare.',{kick:[0,7,8,10],snare:back,hat:quarters,shaker:[2,5,6,10,13,14]}, {swing:55}),
 template('rnb','Pop & soul','Contemporary R&B',78,'Give the vocal space. The rim carries beats 2 and 4 while the kick slips around them.',{kick:[0,6,11],rim:back,hat:[0,2,6,8,10,14,15],shaker:[7]}, {swing:57}),
 template('disco','Pop & soul','Disco',118,'Each quarter-note kick is answered by an open hat on the “and”.',{kick:quarters,snare:back,openhat:offbeats,hat:quarters,shaker:[1,5,9,13]}),
 template('boom','Hip-hop & bass','Boom bap',90,'The snare stays on 2 and 4 while the swung hats lean behind the pulse.',{kick:[0,3,8,10],snare:back,hat:eighths},{swing:59}),
 template('trap','Hip-hop & bass','Trap',144,'Count at 144 or nod at 72. Listen for the half-time clap and the hat flurry.',{kick:[0,5,14],clap:[8],hat:[0,2,4,6,8,10,12,13,14,15],openhat:[7]},{next:{kick:[0,3,6,13,15],hat:[0,2,4,5,6,7,8,10,12,14]}}),
 template('drill','Hip-hop & bass','UK drill',142,'A half-time snare shifts in the second bar. Sing a sliding bass line against the gaps.',{kick:[0,6,11],snare:[8],hat:[0,3,6,8,11,14],openhat:[15]},{next:{kick:[2,7,13],snare:[10]}}),
 template('lofi','Hip-hop & bass','Lo-fi hip-hop',78,'The late offbeat and dry rim make a relaxed pocket. Try a soft electric-piano phrase.',{kick:[0,7,10],rim:back,hat:[0,2,4,6,8,10,12],shaker:[15]},{swing:63}),
 template('dubstep','Hip-hop & bass','Dubstep',140,'A heavy snare on beat 3 divides the bar in half. Leave the low end open for bass.',{kick:[0,3,12],snare:[8],hat:[0,2,6,10,14],openhat:[4]}),
 template('house','Club & electronic','House',124,'The kick plays every beat. Offbeat open hats give the loop its lift.',{kick:quarters,clap:back,openhat:offbeats,hat:quarters}),
 template('deep','Club & electronic','Deep house',120,'Compare the steady kick against the slightly swung shaker. Try a sustained pad.',{kick:quarters,clap:back,openhat:[2,10,14],shaker:[1,3,6,9,11,14],rim:[7]},{swing:55}),
 template('techno','Club & electronic','Techno',132,'Keep the four kicks fixed. Sweep the filter while the metallic percussion repeats.',{kick:quarters,hat:[0,2,4,6,8,10,12,14,15],rim:[3,7,11],openhat:[14]}),
 template('trance','Club & electronic','Trance',136,'Even kicks and open hats leave a predictable space for a running arpeggio.',{kick:quarters,clap:back,openhat:offbeats,shaker:[1,3,5,7,9,11,13,15]}),
 template('garage','Club & electronic','UK garage / two-step',132,'The missing quarter-note kicks create gaps. Listen for the swung hats between snares.',{kick:[0,7,10],snare:back,hat:[0,2,5,6,9,10,14],rim:[3,15]},{swing:62}),
 template('dnb','Club & electronic','Drum & bass',174,'Hear the fast hats and the second kick on the “and” of 3.',{kick:[0,10],snare:back,hat:eighths,openhat:[14]}),
 template('jungle','Club & electronic','Jungle break',166,'Follow the two-bar snare edits. A short second-bar fill turns the loop around.',{kick:[0,6,10],snare:[4,7,12,15],ride:eighths},{next:{kick:[0,9,14],snare:[4,10,12,13,15],ride:[0,2,4,6,8,10]}}),
 template('breaks','Club & electronic','Breakbeat',127,'The kick skips two straight pulses, and a rim pickup leads into the next snare.',{kick:[0,3,10,14],snare:back,hat:[0,2,6,8,10,14],rim:[11]}),
 template('rock','Rock & guitar','Rock',112,'Anchor the snare on 2 and 4. Listen for the extra bass-drum hit before beat 3.',{kick:[0,6,8],snare:back,hat:eighths}),
 template('indie','Rock & guitar','Indie rock',126,'The open hat answers the snare. A tom pickup signals the end of the second bar.',{kick:[0,8,10],snare:back,hat:[0,2,4,6,8,10,12],openhat:[14]},{next:{tom:[13,15]}}),
 template('punk','Rock & guitar','Punk rock',178,'Fast, even eighths drive this loop. Hear the extra kicks between the backbeats.',{kick:[0,2,6,8,10,14],snare:back,hat:eighths}),
 template('metal','Rock & guitar','Metal double-kick',154,'Count four beats over the rapid pairs of kick strokes. The snare still marks 2 and 4.',{kick:[0,1,2,3,6,7,8,9,10,11,14,15],snare:back,ride:eighths}),
 template('country','Rock & guitar','Country train beat',110,'A rim and snare alternate like wheels on a track. Try short bass notes on 1 and 3.',{kick:[0,8],snare:[2,4,6,10,12,14],rim:[1,5,9,13],hat:quarters},{swing:55}),
 template('waltz','Jazz, folk & blues','Jazz waltz',138,'Count ONE two three. The kick marks one and the ride carries the three-beat phrase.',{kick:[0],ride:[0,4,6,8,10],rim:[8]},{meter:'3/4',swing:59}),
 template('swing','Jazz, folk & blues','Jazz swing',132,'Say “ding ding-a ding ding-a.” The ride lands on the late triplet of beats 2 and 4.',{ride:[0,6,10,12,18,22],hat:[6,18],kick:[0,12],rim:[16]},{meter:'12/8'}),
 template('blues','Jazz, folk & blues','Blues shuffle',86,'Count triplets in fours. Long and short hat gaps make the shuffle audible.',{kick:[0,12,16],snare:[6,18],hat:[0,4,6,10,12,16,18,22]},{meter:'12/8'}),
 template('folk','Jazz, folk & blues','Folk in six',76,'Count ONE two three FOUR five six. Hear two large pulses in each bar.',{kick:[0],rim:[6],shaker:[0,2,4,6,8,10]},{meter:'6/8'}),
 template('reggae','Caribbean & Latin','Reggae one drop',76,'Leave beat 1 open. Kick and rim land together on beat 3.',{kick:[8],rim:[8],hat:offbeats,shaker:[0,4,12]}),
 template('dembow','Caribbean & Latin','Reggaeton / dembow',96,'A steady kick runs underneath a rim-and-clap pattern. Follow the accents between pulses.',{kick:quarters,rim:[6,12,14],clap:[6,12],hat:[2,10]}),
 template('dancehall','Caribbean & Latin','Dancehall',100,'The low drum leaves space for syncopated rims and a short shaker answer.',{kick:[0,8,14],rim:[6,12],hat:[2,6,10,14],shaker:[3,11,15]}),
 template('bossa','Caribbean & Latin','Bossa nova',124,'Trace the five rim taps over two bars while the low drum keeps a repeating pulse.',{kick:[0,6,8,14],rim:[0,6,12],shaker:eighths},{next:{rim:[4,10]}}),
 template('samba','Caribbean & Latin','Samba-inspired batucada',106,'A low drum answers the kick. Fast shaker notes fill the spaces around the rim.',{kick:[0,8],tom:[4,12],shaker:sixteenths,rim:[3,6,10,13,15]}),
 template('afropop','African grooves','Afrobeats',104,'Sing along with the interlocking rim, shaker and low drum. Try taking the kick out for a bar.',{kick:[0,6,8],rim:[3,6,10,12],shaker:[0,2,3,6,8,10,11,14],tom:[15]}),
 template('amapiano','African grooves','Amapiano-inspired groove',112,'Listen for low toms moving around the shaker. Use the bass voice to answer the tom phrase.',{kick:[0,4,8,12],tom:[3,7,10,15],shaker:[0,2,3,5,6,8,10,11,13,14],rim:[12]},{next:{tom:[2,6,11,13,15]}}),
 template('dangdut','Indonesian grooves','Dangdut-inspired groove',102,'Use the low tom and rim as a drum-machine sketch of a kendang conversation.',{kick:[0,8],tom:[2,7,10,14],rim:[4,6,12],hat:[0,4,8,12]}),
 template('koplo','Indonesian grooves','Dangdut koplo-inspired fill',148,'Alternate low toms and high rim taps, then listen for the busier second-bar turnaround.',{kick:[0,6,8,14],tom:[0,3,8,11,14],rim:[2,5,7,10,13,15],hat:offbeats},{next:{tom:[0,6,8,10,12,14],rim:[3,5,9,11,13,15]}})
];
const basic=template('base','Practice','Backbeat',96,'Kick on 1 and 3, snare on 2 and 4, and steady eighth-note hats.',{kick:[0,8],snare:back,hat:eighths});
const verse=template('verse','Practice','Verse',96,'A lighter version with a single kick and a snare on beat 4.',{kick:[0],snare:[12],hat:quarters});
function patternFrom(template){
 const meter=meters[template.meter], bar=meter.beats*meter.div;
 return kit.map(([id])=>Array.from({length:bar*4},(_,i)=>{
  const pattern=(Math.floor(i/bar)%2 && template.next?.[id])||template.parts[id]||[];
  return Number(pattern.includes(i%bar));
 }));
}

function swingLength(step,div,amount){
 if(div!==2&&div!==4)return 1;const late=amount/50;
 return step%div<div/2?late:2-late;
}

function makeBeatMidi(rows,meter,tempo,amount,steps,stride,title){
 const ppq=480, m=meters[meter], div=m.div/stride;
 const quarterMicros=Math.round(60e6/tempo/(m.div/4));
 const [numerator,denominator]=meter.split('/').map(Number);
 const events=[],push=(tick,order,bytes)=>events.push({tick,order,bytes});
 const label=new TextEncoder().encode(title);
 function vlq(num){const b=[num&127];while(num>>=7)b.unshift((num&127)|128);return b;}
 push(0,0,[255,3,...vlq(label.length),...label]);
 push(0,0,[255,81,3,(quarterMicros>>16)&255,(quarterMicros>>8)&255,quarterMicros&255]);
 push(0,0,[255,88,4,numerator,Math.log2(denominator),denominator===8?36:24,8]);
 let pos=0;
 for(let s=0;s<steps;s++){
  const next=pos+ppq/4*stride*swingLength(s,div,amount);
  kit.forEach(([_,name,pitch],r)=>{
   if(!rows[r][s*stride])return;
   push(Math.round(pos),2,[0x99,pitch,s*stride%2?68:94]);
   push(Math.round(pos+(next-pos)*.52),1,[0x89,pitch,0]);
  });
  pos=next;
 }
 push(Math.round(pos),3,[255,47,0]);events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 let prev=0;const bytes=[];
 for(const e of events){bytes.push(...vlq(e.tick-prev),...e.bytes);prev=e.tick;}
 const n=bytes.length;
 return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,ppq>>8,ppq&255,77,84,114,107,n>>>24,(n>>>16)&255,(n>>>8)&255,n&255,...bytes]);
}

