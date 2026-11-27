'use strict';
/* Widgets for chapter 1: naming notes, intervals, scales, chords, tempo,
   chord loops and melodic contour. Loads after widgets.js, which creates
   the W_KINDS registry each block below assigns itself into. */
/* --- keys: name a note, measure an interval, see a scale, build a chord - */
W_KINDS.keys={
 init(spec){return {picked:[],key:spec.key??0,scale:spec.scale||'major',
  root:spec.root??60,quality:spec.quality||'major',inv:0};},
 body(st){
  const m=st.spec.mode;
  if(m==='interval'){
   const lit={};st.picked.forEach((n,i)=>lit[n]=i?'high':'low');
   return wKeybed(st,lit,'c')
    +`<div class="w-controls"><button type="button" class="btn ghost" data-wclear>Start over</button>`
    +`<span class="compact">${st.picked.length?st.picked.map(noteName).join(' → '):'Press one key, then a second.'}</span></div>`;
  }
  if(m==='scale'){
   const set=W_SCALES[st.scale].map(s=>(st.key+s)%12), lit={};
   for(let n=st.spec.low;n<=st.spec.high;n++){
    if(pc(n)===st.key)lit[n]='root';else if(set.includes(pc(n)))lit[n]='scale';
   }
   const steps=W_SCALES[st.scale].concat(12);
   const strip=steps.map((s,i)=>{
    const nm=SHARP_NAMES[(st.key+s)%12];
    return i?`<i>${steps[i]-steps[i-1]===2?'W':'H'}</i>${nm}`:nm;
   }).join('');
   return [wKeybed(st,lit,'all'),
    `<div class="w-controls">${wSelect('key',SHARP_NAMES.map((n,i)=>[i,n]),st.key,'Starting note')}`
    +`${wSelect('scale',Object.keys(W_SCALES).map(k=>[k,k]),st.scale,'Scale')}${wPlayBtn(st,'Play the scale')}</div>`,
    `<div class="chart w-strip">${strip}</div>`].join('');
  }
  if(m==='chord'){
   const shape=W_CHORDS[st.quality];
   let notes=shape.map(s=>st.root+s);
   for(let i=0;i<st.inv;i++)notes=[...notes.slice(1),notes[0]+12];
   // Each sounding key is tinted by its place in the stack. An inversion moves
   // a note up an octave, so the interval is read modulo twelve to keep the
   // third tinted as the third wherever it now sits.
   const lit={};
   notes.forEach(n=>{const k=shape.indexOf(((n-st.root)%12+12)%12);lit[n]=k>=0?W_VOICE[k]:'scale';});
   return [wKeybed(st,lit,'all'),
    `<div class="w-controls">${wSelect('root',SHARP_NAMES.map((n,i)=>[60+i,n]),st.root,'Root')}`
    +`${wSelect('quality',Object.keys(W_CHORDS).map(k=>[k,k]),st.quality,'Quality')}`
    +`<button type="button" class="btn" data-wplay>▶ Play the chord</button></div>`,
    wPills('inv',[[0,'Root position'],[1,'1st inversion'],[2,'2nd inversion']],st.inv),
    `<div class="chart">${notes.map(noteName).join('  ·  ')} &nbsp; — &nbsp; ${shape.map((s,i)=>`${W_VOICE[i]} +${s}`).join(', ')}</div>`].join('');
  }
  const lit={};st.picked.forEach(n=>lit[n]='low');
  return wKeybed(st,lit,st.spec.labels||'c');
 },
 click(st,btn,d){
  const m=st.spec.mode;
  if(d.wclear!==undefined){st.picked=[];wRedraw(st);wSay(st,'Press one key, then a second one.');return;}
  if(d.wpill==='inv'){st.inv=+btn.dataset.wval;wRedraw(st);W_KINDS.keys.play(st);return;}
  if(d.wplay!==undefined){
   if(m==='scale'){
    const set=W_SCALES[st.scale].concat(12).map(s=>60+st.key+s);
    wArp(set);wSay(st,`${SHARP_NAMES[st.key]} ${st.scale} — ${set.map(wLetter).join(' ')}. Eight notes, and the last is the first one again, an octave up.`);
   }else W_KINDS.keys.play(st);
   return;
  }
  if(d.wkey===undefined)return;
  const n=+d.wkey;
  if(m==='interval'){
   if(st.picked.length>=2)st.picked=[];
   st.picked.push(n);
   if(st.picked.length===1){wTone(n);wRedraw(st);wSay(st,`${noteName(n)}. Now press a second key — higher or lower, it does not matter.`);return;}
   const [a,b]=[...st.picked].sort((x,y)=>x-y), gap=b-a;
   wArp([a,b],'grand',.42);wRedraw(st);
   wSay(st,gap===0?`Both presses landed on ${noteName(a)} — that is a unison, a gap of nothing.`
    :`<b>${noteName(a)} up to ${noteName(b)}</b> is ${gap} semitone${gap===1?'':'s'} — ${gap===12?'an':'a'} <b>${wIval(gap)}</b>. Count the keys between them, black ones included, and you get the same number.`);
   return;
  }
  if(m==='scale'){
   const set=W_SCALES[st.scale].map(s=>(st.key+s)%12), i=set.indexOf(pc(n));
   wTone(n);
   wSay(st,i<0?`${noteName(n)} is <b>not</b> in ${SHARP_NAMES[st.key]} ${st.scale}. It will sound like a visitor — useful on purpose, jarring by accident.`
    :`${noteName(n)} is degree <b>${i+1}</b> of ${SHARP_NAMES[st.key]} ${st.scale}${i?'':' — the home note'}.`);
   return;
  }
  st.picked=[n];wTone(n);wRedraw(st);
  wSay(st,`<b>${noteName(n)}</b> — ${isWhiteNote(n)?'a white key':'a black key'}. The number is the octave; ${wLetter(n)} appears again twelve keys up and twelve keys down.`
   +(pc(n)===0?' This is a C, so a group of two black keys sits immediately to its right.':''));
 },
 play(st){
  const shape=W_CHORDS[st.quality];
  let notes=shape.map(s=>st.root+s);
  for(let i=0;i<st.inv;i++)notes=[...notes.slice(1),notes[0]+12];
  wStack(notes);
  wSay(st,`<b>${wLetter(st.root)} ${st.quality}</b>${st.inv?` · ${['root position','1st inversion','2nd inversion'][st.inv]}` :''} — ${notes.map(noteName).join(', ')}. ${st.inv?'Same three notes, different lowest one. The chord keeps its name.':'Stacked from the root upward.'}`);
 },
 select(st,el,name){
  st[name]=name==='root'||name==='key'?+el.value:el.value;
  if(name==='quality')st.inv=0;
  wRedraw(st);
  if(st.spec.mode==='chord')W_KINDS.keys.play(st);
 }
};

/* --- tempo: the same bar at different speeds --------------------------- */
W_KINDS.tempo={
 init(spec){return {tempo:spec.tempo||96,beats:spec.beats||4};},
 body(st){
  const beat=60/st.tempo, bar=beat*st.beats;
  let strip='<div class="w-beats">';
  for(let i=0;i<st.beats;i++)strip+=`<i data-wcol="${i}"${i?'':' class="one"'}>${i+1}</i>`;
  strip+='</div>';
  return strip
   +(st.spec.meters?wPills('beats',st.spec.meters.map(m=>[m,m+'/4']),st.beats):'')
   +`<div class="w-controls">${wPlayBtn(st,'Start the click')}`
   +`<label>Tempo <input type="range" min="40" max="200" value="${st.tempo}" data-wrange="tempo"></label></div>`
   +`<div class="chart"><b><output>${st.tempo}</output> BPM</b> → one beat lasts 60 ÷ ${st.tempo} = <b>${beat.toFixed(3)} s</b>`
   +` · a bar of ${st.beats} takes <b>${bar.toFixed(2)} s</b> · ${(60/bar).toFixed(1)} bars a minute</div>`;
 },
 click(st,btn,d){
  if(d.wpill==='beats'){st.beats=+btn.dataset.wval;wRedraw(st);wSay(st,`${st.beats}/4 — count to ${st.beats} and start again. The accent marks where the bar begins.`);return;}
  if(d.wplay===undefined)return;
  wToggle(st,()=>StudioAudio.sequence(wTrack(st),st.beats,()=>st.tempo,
   (i,t)=>MusicEngine.hit(i===0?'accent':'click',t,i===0?.95:.5),
   i=>wMark(st,i),true,1));
 },
 range(st,el){st.tempo=+el.value;wRedraw(st);}
};

/* --- chords: four slots, roman numerals, and a loop ------------------- */
W_KINDS.chords={
 init(spec){return {slots:[...(spec.slots||[0,4,5,3])],tempo:spec.tempo||88};},
 body(st){
  const pool=W_DEGREE.map((d,i)=>[i,d.name]);
  let html='<div class="w-slots">';
  st.slots.forEach((s,i)=>{
   html+=`<div class="w-slot" data-wcol="${i}"><span class="micro">Bar ${i+1}</span>`
    +`<select data-wsel="slot${i}">${pool.map(([v,t])=>`<option value="${v}"${v===s?' selected':''}>${t}</option>`).join('')}</select>`
    +`<b>${W_DEGREE[s].roman}</b></div>`;
  });
  html+='</div>';
  return html+`<div class="w-controls">${wPlayBtn(st,'Play the loop')}`
   +`<span class="compact">${st.slots.map(s=>W_DEGREE[s].roman).join(' – ')}</span></div>`;
 },
 click(st,btn,d){
  if(d.wplay===undefined)return;
  wToggle(st,()=>{
   const bars=st.slots.length;
   StudioAudio.sequence(wTrack(st),bars*4,()=>st.tempo,(i,t)=>{
    const bar=Math.floor(i/4), deg=W_DEGREE[st.slots[bar]];
    if(i%4===0){
     deg.notes.forEach(n=>MusicEngine.play(n,'grand',{at:t,duration:60/st.tempo*3.5,level:.14}));
     MusicEngine.play(deg.bass,'bass',{at:t,duration:60/st.tempo*1.8,level:.3});
    }
    if(i%4===0||i%4===2)MusicEngine.hit('kick',t,.6);
    if(i%4===1||i%4===3)MusicEngine.hit('snare',t,.5);
   },i=>wMark(st,Math.floor(i/4)),true,1);
  });
 },
 select(st,el,name){
  const i=+name.slice(4);st.slots[i]=+el.value;wRedraw(st);
  const last=W_DEGREE[st.slots.at(-1)].roman, first=W_DEGREE[st.slots[0]].roman;
  wSay(st,`${st.slots.map(s=>W_DEGREE[s].roman).join(' – ')}. `+(
   last==='V'&&first==='I'?'Ending on V and looping back to I is a <b>half cadence</b> — it will not let you stop.'
   :last==='V'?'Ending on V leaves the phrase hanging. Put I after it to close.'
   :last==='I'?'Ending on I is a <b>full close</b>. The loop sounds finished here.'
   :'Press play and listen for whether the last bar wants to go somewhere.'));
 }
};

/* --- contour: draw a melody on the scale ------------------------------ */
W_KINDS.contour={
 init(spec){
  const total=spec.steps||8, notes=Array(total).fill(-1);
  (spec.notes||[]).forEach(([s,d])=>{if(s<total)notes[s]=d;});
  return {notes,tempo:spec.tempo||92,bed:spec.bed!==false};
 },
 body(st){
  const scale=st.spec.scale||[60,62,64,65,67,69,71,72], total=st.notes.length;
  let html=`<div class="w-scroll"><div class="w-contour" style="grid-template-columns:52px repeat(${total},minmax(24px,1fr))">`;
  for(let r=scale.length-1;r>=0;r--){
   html+=`<span class="lane">${noteName(scale[r])}</span>`;
   for(let s=0;s<total;s++)
    html+=`<button type="button" class="cell" data-wcell="${s},${r}" data-wcol="${s}" aria-pressed="${st.notes[s]===r}" aria-label="${noteName(scale[r])} at step ${s+1}"></button>`;
  }
  html+='<span></span>';
  for(let s=0;s<total;s++)html+=`<span class="count" data-wcol="${s}">${wCount(s,2)}</span>`;
  html+='</div></div>';
  return html+`<div class="w-controls">${wPlayBtn(st,'Play the phrase')}`
   +`<button type="button" class="btn ghost" data-wclear>Clear</button>`
   +`<span class="compact">One note per column. Click a filled square to rub it out.</span></div>`;
 },
 click(st,btn,d){
  if(d.wclear!==undefined){st.notes=st.notes.map(()=>-1);wRedraw(st);wSay(st,'Empty staff. Try four notes that rise, then four that come back down.');return;}
  if(d.wplay!==undefined){
   wToggle(st,()=>{
    const scale=st.spec.scale||[60,62,64,65,67,69,71,72];
    StudioAudio.sequence(wTrack(st),st.notes.length,()=>st.tempo,(i,t)=>{
     if(st.notes[i]>=0)MusicEngine.play(scale[st.notes[i]],'lead',{at:t,duration:60/st.tempo*.55,level:.26});
     if(st.bed&&i%4===0){
      const deg=W_DEGREE[i<st.notes.length/2?0:4];
      deg.notes.forEach(n=>MusicEngine.play(n-12,'pad',{at:t,duration:60/st.tempo*1.9,level:.1}));
     }
    },i=>wMark(st,i),true,2);
   });
   return;
  }
  if(d.wcell===undefined)return;
  const [s,r]=d.wcell.split(',').map(Number);
  const scale=st.spec.scale||[60,62,64,65,67,69,71,72];
  st.notes[s]=st.notes[s]===r?-1:r;
  wRedraw(st);
  if(st.notes[s]>=0)wTone(scale[r],'lead',.5);
  const filled=st.notes.filter(n=>n>=0);
  const span=filled.length>1?Math.max(...filled)-Math.min(...filled):0;
  wSay(st,`${filled.length} note${filled.length===1?'':'s'} placed`
   +(filled.length>1?` · the phrase covers ${span+1} scale degrees. ${span<=2?'A narrow shape like this is easy to sing.':span>=6?'That is a wide leap — singable, but it will need breath.':'A comfortable range for a sung hook.'}`:'. Keep going — a hook is usually four to eight notes.'));
 }
};
