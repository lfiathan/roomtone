'use strict';
/* ---------------------------------------------------------------------------
   Lesson widgets — the interactive half of a lesson.

   A lesson block carries a spec ({kind:'keys', mode:'interval', …}).
   drawWidget() turns it into markup and registers its live state under a
   fresh id, so the same widget can appear twice on a page without the two
   copies fighting over one variable.

   Every widget owns its state, redraws only its own body, and reaches the
   speakers only through MusicEngine / StudioAudio. Note names and pitch-class
   helpers come from figures.js, so the diagram above a widget and the widget
   itself always agree about what a key is called.

   render() in studio.js replaces the whole page, so it calls resetWidgets()
   first; ids are handed out again from one on every route change.
--------------------------------------------------------------------------- */

const W_STATE = new Map();
let wNext = 0;
function resetWidgets(){W_STATE.clear();wNext=0;}

const wHost=st=>document.querySelector(`[data-w="${st.id}"]`);
function wOwner(el){const host=el.closest('[data-w]');return host?W_STATE.get(host.dataset.w):null;}
function wSay(st,html,bad=false){
 const el=wHost(st)?.querySelector('[data-w-say]');
 if(!el)return;
 el.innerHTML=html;el.classList.toggle('incorrect',bad);
}
function wRedraw(st){
 const el=wHost(st)?.querySelector('.widget-body');
 if(el)el.innerHTML=W_KINDS[st.kind].body(st);
}
// The transport highlights a column rather than a cell, so a grid, a count
// row and a section header can all light up from the same step number.
function wMark(st,i){
 const host=wHost(st);if(!host)return;
 host.querySelectorAll('[data-wcol]').forEach(el=>el.classList.toggle('now',+el.dataset.wcol===i));
}
const wTrack=st=>'w:'+st.id;
const wPlaying=st=>StudioAudio.current===wTrack(st);
// Second press on a playing widget stops it, which is what the button says.
function wToggle(st,start){if(wPlaying(st)){StudioAudio.stop();return false;}start();return true;}

/* ------------------------------------------------------------------ sound */
const wTone=(pitch,patch='grand',dur=.8,level=.26,extra={})=>MusicEngine.play(pitch,patch,{duration:dur,level,...extra});
const wStack=(notes,patch='grand',dur=1.3,level=.16,extra={})=>notes.forEach(n=>MusicEngine.play(n,patch,{duration:dur,level,...extra}));
function wArp(notes,patch='grand',gap=.26){
 if(!MusicEngine.setup())return;
 const t=StudioAudio.context.currentTime+.04;
 notes.forEach((n,i)=>MusicEngine.play(n,patch,{at:t+i*gap,duration:gap*1.3,level:.26}));
}
// A short feedback delay standing in for room sound, so "add space" is
// audible without shipping an impulse response.
function wSpace(amount){
 const ctx=StudioAudio.context, inp=ctx.createGain(), d=ctx.createDelay(1),
       fb=ctx.createGain(), wet=ctx.createGain(), lp=ctx.createBiquadFilter();
 d.delayTime.value=.105;fb.gain.value=.44*amount;wet.gain.value=.85*amount;
 lp.type='lowpass';lp.frequency.value=2500;
 inp.connect(StudioAudio.output);inp.connect(d);
 d.connect(lp);lp.connect(fb);fb.connect(d);lp.connect(wet);wet.connect(StudioAudio.output);
 return inp;
}

/* ------------------------------------------------------------- vocabulary */
const W_PLAY_LABEL={steps:'Play the pattern',tempo:'Start the click',chords:'Play the loop',
 contour:'Play the phrase',arrange:'Play all 16 bars',mix:'Play the mix',tap:'Start the click',keys:'Play the scale'};
const W_IVAL=['unison','minor second','major second','minor third','major third',
 'perfect fourth','tritone','perfect fifth','minor sixth','major sixth',
 'minor seventh','major seventh','octave'];
const W_SCALES={major:[0,2,4,5,7,9,11],'natural minor':[0,2,3,5,7,8,10]};
const W_CHORDS={major:[0,4,7],minor:[0,3,7],diminished:[0,3,6],augmented:[0,4,8],'dominant seventh':[0,4,7,10]};
const W_VOICE=['root','third','fifth','seventh'];
const W_DEGREE=[
 {name:'C',roman:'I',notes:[60,64,67],bass:36},
 {name:'Dm',roman:'ii',notes:[62,65,69],bass:38},
 {name:'Em',roman:'iii',notes:[64,67,71],bass:40},
 {name:'F',roman:'IV',notes:[65,69,72],bass:41},
 {name:'G',roman:'V',notes:[67,71,74],bass:43},
 {name:'Am',roman:'vi',notes:[69,72,76],bass:45},
 {name:'Bdim',roman:'vii°',notes:[71,74,77],bass:47}
];
const wIval=n=>n<=12?W_IVAL[n]:`${n} semitones`;
const wLetter=n=>SHARP_NAMES[pc(n)];
const W_SUB={1:['%'],2:['%','&'],4:['%','e','&','a']};
function wCount(i,div){
 const sub=i%div, pat=W_SUB[div]||W_SUB[2];
 return sub===0?String(Math.floor(i/div)+1):pat[sub];
}

/* -------------------------------------------------------------- keyboard */
// Black keys are absolutely positioned on the boundary between the two white
// keys they sit between, which is why the white count is read after it has
// been advanced for the key just emitted.
function wKeybed(st,lit={},labels='none'){
 const {low,high}=st.spec;
 let total=0;
 for(let n=low;n<=high;n++)if(isWhiteNote(n))total++;
 let wi=0, html='';
 for(let n=low;n<=high;n++){
  const black=!isWhiteNote(n), name=noteName(n), hit=lit[n];
  const show=hit||labels==='all'||(labels==='white'&&!black)||(labels==='c'&&pc(n)===0);
  const face=show?wLetter(n):'';
  const cls=(black?'blackkey':'whitekey')+(hit?' lit-'+hit:'');
  const attrs=`data-wkey="${n}" aria-label="${name}" title="${name}" aria-pressed="${hit?'true':'false'}"`;
  if(black){
   html+=`<button type="button" class="${cls}" ${attrs} style="left:${wi/total*100}%;width:${.62/total*100}%"><span>${face}</span></button>`;
  }else{
   wi++;
   html+=`<button type="button" class="${cls}" ${attrs}><span>${face}</span></button>`;
  }
 }
 return `<div class="w-keys">${html}</div>`;
}
function wSelect(name,options,value,label){
 return `<label>${label} <select data-wsel="${name}">${options.map(([v,t])=>
  `<option value="${esc(String(v))}"${String(v)===String(value)?' selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
}
function wPills(name,options,value){
 return `<div class="w-pills">${options.map(([v,t])=>
  `<button type="button" class="pill" data-wpill="${name}" data-wval="${esc(String(v))}" aria-pressed="${String(v)===String(value)}">${esc(t)}</button>`).join('')}</div>`;
}
const wPlayBtn=(st,label='Play')=>`<button type="button" class="btn" data-wplay aria-pressed="${wPlaying(st)}">${wPlaying(st)?'■ Stop':'▶ '+label}</button>`;

/* =========================================================== the widgets */
const W_KINDS={};

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

/* --- steps: a pattern you can edit and hear ---------------------------- */
W_KINDS.steps={
 init(spec){
  const total=spec.beats*spec.div;
  return {tempo:spec.tempo||96,
   rows:spec.lanes.map(l=>{const a=Array(total).fill(0);(l.on||[]).forEach(i=>{if(i<total)a[i]=1;});return a;})};
 },
 body(st){
  const {lanes,beats,div}=st.spec, total=beats*div;
  const cols=`grid-template-columns:76px repeat(${total},minmax(26px,1fr))`;
  let html=`<div class="w-scroll"><div class="w-grid" style="${cols}"><span></span>`;
  for(let i=0;i<total;i++)html+=`<span class="count" data-wcol="${i}">${wCount(i,div)}</span>`;
  st.spec.lanes.forEach((l,li)=>{
   html+=`<span class="lane">${esc(l.name)}</span>`;
   for(let i=0;i<total;i++)html+=`<button type="button" class="step ${l.id}" data-wstep="${li},${i}" data-wcol="${i}" aria-pressed="${!!st.rows[li][i]}" aria-label="${esc(l.name)} on count ${wCount(i,div)}"></button>`;
  });
  html+='</div></div>';
  return html+`<div class="w-controls">${wPlayBtn(st,'Play the pattern')}`
   +`<label>Tempo <input type="range" min="${st.spec.min||60}" max="${st.spec.max||150}" value="${st.tempo}" data-wrange="tempo"></label>`
   +`<span class="w-read"><output>${st.tempo}</output> BPM</span>`
   +`<button type="button" class="btn ghost" data-wclear>Clear</button></div>`;
 },
 click(st,btn,d){
  if(d.wclear!==undefined){st.rows=st.rows.map(r=>r.fill(0).slice());wRedraw(st);wSay(st,'Empty. Click cells to build a pattern of your own, then press play.');return;}
  if(d.wplay!==undefined){
   wToggle(st,()=>{
    const total=st.spec.beats*st.spec.div;
    StudioAudio.sequence(wTrack(st),total,()=>st.tempo,(i,t)=>{
     st.rows.forEach((row,li)=>{if(row[i])MusicEngine.hit(st.spec.lanes[li].id,t,st.spec.lanes[li].level??.85);});
    },i=>wMark(st,i),true,st.spec.div);
   });
   return;
  }
  if(d.wstep===undefined)return;
  const [li,i]=d.wstep.split(',').map(Number);
  st.rows[li][i]=st.rows[li][i]?0:1;
  btn.setAttribute('aria-pressed',String(!!st.rows[li][i]));
  if(st.rows[li][i])MusicEngine.hit(st.spec.lanes[li].id,undefined,.9);
  const hits=st.rows.reduce((n,r)=>n+r.reduce((a,b)=>a+b,0),0);
  wSay(st,`${esc(st.spec.lanes[li].name)} ${st.rows[li][i]?'on':'off'} at count ${wCount(i,st.spec.div)} · ${hits} hit${hits===1?'':'s'} in the bar.`);
 },
 range(st,el){st.tempo=+el.value;const o=wHost(st)?.querySelector('.w-read output');if(o)o.textContent=st.tempo;}
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

/* --- arrange: which layers play in which section ---------------------- */
const W_LAYERS=[
 {name:'Drums',id:'drums'},{name:'Bass',id:'bass'},
 {name:'Chords',id:'chords'},{name:'Lead',id:'lead'}
];
W_KINDS.arrange={
 init(spec){
  const secs=(spec.sections||['Intro','Verse','Hook','Outro']).length;
  const on=W_LAYERS.map((_,l)=>Array.from({length:secs},(_,s)=>!!(spec.on&&spec.on[l]&&spec.on[l][s])));
  return {on,tempo:spec.tempo||96};
 },
 body(st){
  const secs=st.spec.sections||['Intro','Verse','Hook','Outro'];
  let html=`<div class="w-scroll"><div class="w-matrix" style="grid-template-columns:74px repeat(${secs.length},minmax(48px,1fr))"><span></span>`;
  secs.forEach((s,i)=>html+=`<span class="count" data-wcol="${i}">${esc(s)}<small>bars ${i*4+1}–${i*4+4}</small></span>`);
  W_LAYERS.forEach((l,li)=>{
   html+=`<span class="lane">${l.name}</span>`;
   secs.forEach((s,si)=>html+=`<button type="button" class="cell ${l.id}" data-wtoggle="${li},${si}" data-wcol="${si}" aria-pressed="${st.on[li][si]}" aria-label="${l.name} in ${esc(s)}"></button>`);
  });
  html+='</div></div>';
  const count=st.on.map(r=>r.filter(Boolean).length);
  return html+`<div class="w-controls">${wPlayBtn(st,'Play all 16 bars')}`
   +`<span class="compact">${W_LAYERS.map((l,i)=>`${l.name} ${count[i]}/${secs.length}`).join(' · ')}</span></div>`;
 },
 click(st,btn,d){
  if(d.wplay!==undefined){
   wToggle(st,()=>{
    const secs=(st.spec.sections||['Intro','Verse','Hook','Outro']).length, beat=60/st.tempo;
    StudioAudio.sequence(wTrack(st),secs*4*2,()=>st.tempo,(i,t)=>{
     const bar=Math.floor(i/2), sec=Math.floor(bar/4), half=i%2, chord=harmony[songChords[bar%16]];
     if(st.on[0][sec]){
      if(half===0&&bar%2===0)MusicEngine.hit('kick',t,.85);
      if(half===0&&bar%2===1)MusicEngine.hit('snare',t,.7);
      MusicEngine.hit('hat',t,half?.4:.55);
     }
     if(st.on[1][sec]&&half===0)MusicEngine.play(chord.bass,'bass',{at:t,duration:beat*1.7,level:.3});
     if(st.on[2][sec]&&half===0)chord.notes.forEach(n=>MusicEngine.play(n,'grand',{at:t,duration:beat*3.6,level:.13}));
     if(st.on[3][sec]&&half===0){
      const phrase=hook[bar%4];let pos=0;
      phrase.forEach(([pitch,beats])=>{MusicEngine.play(pitch,'lead',{at:t+pos*beat,duration:beats*beat*.85,level:.24});pos+=beats;});
     }
    },i=>wMark(st,Math.floor(i/8)),true,2);
   });
   return;
  }
  if(d.wtoggle===undefined)return;
  const [li,si]=d.wtoggle.split(',').map(Number);
  st.on[li][si]=!st.on[li][si];wRedraw(st);
  const secs=st.spec.sections||['Intro','Verse','Hook','Outro'];
  const live=W_LAYERS.filter((_,l)=>st.on[l][si]).map(l=>l.name);
  wSay(st,`<b>${esc(secs[si])}</b> now plays ${live.length?live.join(', ').toLowerCase():'nothing at all'}. `
   +(live.length>=4?'Everything at once — fine for a chorus, but there is nothing left to add.'
    :live.length?'An entrance you take away is an entrance you can make again.'
    :'Silence is a legitimate section. It makes whatever follows feel louder.'));
 }
};

/* --- mix: faders and pan over a looping bed --------------------------- */
W_KINDS.mix={
 init(spec){return {tracks:spec.tracks.map(t=>({...t})),tempo:spec.tempo||96};},
 body(st){
  let html='<div class="w-faders">';
  st.tracks.forEach((t,i)=>{
   html+=`<div class="w-fader"><b>${esc(t.name)}</b>`
    +`<label><span>Level</span><input type="range" min="0" max="100" value="${t.level}" data-wrange="level${i}"></label>`
    +`<label><span>Pan</span><input type="range" min="-100" max="100" value="${t.pan||0}" data-wrange="pan${i}"></label>`
    +`<span class="w-read">${t.level} · ${t.pan>0?'R'+t.pan:t.pan<0?'L'+(-t.pan):'centre'}</span></div>`;
  });
  html+='</div>';
  return html+`<div class="w-controls">${wPlayBtn(st,'Play the mix')}`
   +`<button type="button" class="btn ghost" data-wclear>Reset</button>`
   +`<span class="compact">Change a fader while it plays.</span></div>`;
 },
 chain(st){
  const ctx=StudioAudio.context;
  if(st.nodes&&st.nodes.ctx===ctx)return st.nodes.list;
  const list=st.tracks.map(t=>{
   const g=ctx.createGain(), p=ctx.createStereoPanner();
   g.gain.value=t.level/100;p.pan.value=(t.pan||0)/100;
   g.connect(p);p.connect(StudioAudio.output);return {g,p};
  });
  st.nodes={ctx,list};return list;
 },
 click(st,btn,d){
  if(d.wclear!==undefined){
   st.tracks=st.spec.tracks.map(t=>({...t}));
   if(st.nodes)st.nodes.list.forEach((n,i)=>{n.g.gain.value=st.tracks[i].level/100;n.p.pan.value=(st.tracks[i].pan||0)/100;});
   wRedraw(st);wSay(st,'Back to the starting mix.');return;
  }
  if(d.wplay===undefined)return;
  wToggle(st,()=>{
   if(!MusicEngine.setup())return;
   const nodes=W_KINDS.mix.chain(st), beat=60/st.tempo;
   StudioAudio.sequence(wTrack(st),16,()=>st.tempo,(i,t)=>{
    const bar=Math.floor(i/8), half=i%2, chord=harmony[['C','G'][bar]];
    st.tracks.forEach((tr,ti)=>{
     const dest=nodes[ti].g;
     if(tr.role==='drums'){
      if(half===0&&i%4===0)MusicEngine.hit('kick',t,.9,dest);
      if(half===0&&i%4===2)MusicEngine.hit('snare',t,.8,dest);
      MusicEngine.hit('hat',t,half?.35:.5,dest);
     }
     if(tr.role==='bass'&&i%4===0)MusicEngine.play(chord.bass,'bass',{at:t,duration:beat*1.7,level:.34,dest});
     if(tr.role==='chords'&&i%8===0)chord.notes.forEach(n=>MusicEngine.play(n,'grand',{at:t,duration:beat*3.6,level:.15,dest}));
     if(tr.role==='lead'&&i%8===0){
      let pos=0;hook[bar].forEach(([pitch,beats])=>{MusicEngine.play(pitch,'lead',{at:t+pos*beat,duration:beats*beat*.85,level:.26,dest});pos+=beats;});
     }
    });
   },i=>wMark(st,i),true,2);
  });
 },
 range(st,el,name){
  const i=+name.replace(/\D/g,''), pan=name.startsWith('pan');
  st.tracks[i][pan?'pan':'level']=+el.value;
  if(st.nodes){
   const n=st.nodes.list[i];
   if(pan)n.p.pan.value=+el.value/100;else n.g.gain.value=+el.value/100;
  }
  const read=wHost(st)?.querySelectorAll('.w-fader .w-read')[i];
  const t=st.tracks[i];
  if(read)read.textContent=`${t.level} · ${t.pan>0?'R'+t.pan:t.pan<0?'L'+(-t.pan):'centre'}`;
  if(pan)wSay(st,`${esc(t.name)} sits ${t.pan===0?'in the middle':Math.abs(t.pan)+'% to the '+(t.pan>0?'right':'left')}. Two things in the same spot fight; move one and both are audible.`);
  else wSay(st,`${esc(t.name)} at ${t.level}. ${t.level===0?'Muted — notice what you stop hearing.':t.level>88?'Loud enough to push everything else down.':'Balanced against the rest.'}`);
 }
};

/* --- compare: hear two versions of the same thing --------------------- */
W_KINDS.compare={
 init(){return {at:-1};},
 body(st){
  return `<div class="w-ab">${st.spec.items.map((it,i)=>
   `<button type="button" class="w-abbtn" data-wab="${i}" aria-pressed="${st.at===i}">`
   +`<span class="micro">${String.fromCharCode(65+i)}</span><b>${esc(it.label)}</b>`
   +(it.note?`<small>${esc(it.note)}</small>`:'')+'</button>').join('')}</div>`;
 },
 click(st,btn,d){
  if(d.wab===undefined)return;
  const i=+d.wab, it=st.spec.items[i];
  st.at=i;
  wHost(st)?.querySelectorAll('[data-wab]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.wab===i)));
  if(!MusicEngine.setup())return;
  StudioAudio.stop();
  const ctx=StudioAudio.context, t0=ctx.currentTime+.05;
  const dest=it.space?wSpace(it.space):undefined;
  const extra={};if(dest)extra.dest=dest;if(it.cutoff)extra.cutoff=it.cutoff;
  if(it.notes)it.notes.forEach(n=>MusicEngine.play(n,it.patch||'grand',{at:t0,duration:it.hold||1.6,level:it.level||.18,...extra}));
  if(it.arp)it.arp.forEach((n,k)=>MusicEngine.play(n,it.patch||'grand',{at:t0+k*.26,duration:.4,level:.26,...extra}));
  if(it.hits){
   const beat=60/(it.tempo||96);
   it.hits.forEach(h=>MusicEngine.hit(h.id,t0+h.at*beat,h.level??.85,dest));
  }
  wSay(st,it.say||`<b>${esc(it.label)}</b>`);
 }
};

/* --- tap: how steady are you, in milliseconds ------------------------- */
W_KINDS.tap={
 init(spec){return {tempo:spec.tempo||96,beats:(spec.bars||4)*4,taps:[],start:0};},
 body(st){
  const n=st.taps.length;
  const avg=n?st.taps.reduce((a,b)=>a+Math.abs(b),0)/n:0;
  const drift=n?st.taps.reduce((a,b)=>a+b,0)/n:0;
  return `<div class="w-tapzone"><button type="button" class="w-tapbtn" data-wtap ${wPlaying(st)?'':'disabled'}>Tap</button>`
   +`<div class="w-tapread"><b>${n}</b> tap${n===1?'':'s'}`
   +(n?`<span>average ${Math.round(avg)} ms off · ${Math.abs(drift)<8?'dead centre':drift<0?Math.round(-drift)+' ms early on balance':Math.round(drift)+' ms late on balance'}</span>`
     :'<span>press start, then tap along with the click</span>')+'</div></div>'
   +`<div class="w-scatter" aria-hidden="true">${st.taps.map(ms=>
     `<i style="left:${Math.max(2,Math.min(98,50+ms/4))}%" class="${Math.abs(ms)<40?'good':''}"></i>`).join('')}<span class="w-zero"></span></div>`
   +`<div class="w-scale" aria-hidden="true"><span>−200 ms · early</span><span>on the beat</span><span>late · +200 ms</span></div>`
   +`<div class="w-controls">${wPlayBtn(st,'Start the click')}`
   +`<label>Tempo <input type="range" min="50" max="160" value="${st.tempo}" data-wrange="tempo"></label>`
   +`<span class="w-read"><output>${st.tempo}</output> BPM</span></div>`;
 },
 click(st,btn,d){
  if(d.wtap!==undefined){
   if(!wPlaying(st)||!StudioAudio.context)return;
   const beat=60/st.tempo, since=StudioAudio.context.currentTime-st.start;
   const off=(since/beat-Math.round(since/beat))*beat*1000;
   st.taps=[...st.taps.slice(-31),off];
   wRedraw(st);
   return;
  }
  if(d.wplay===undefined)return;
  const started=wToggle(st,()=>{
   st.taps=[];
   if(!MusicEngine.setup())return;
   st.start=StudioAudio.context.currentTime+.06;
   StudioAudio.sequence(wTrack(st),4,()=>st.tempo,
    (i,t)=>MusicEngine.hit(i===0?'accent':'click',t,i===0?.9:.45),
    i=>wMark(st,i),true,1);
  });
  wRedraw(st);
  wSay(st,started?'Tap on every click. Being consistently late is a far smaller problem than drifting.'
   :st.taps.length?`Stopped after ${st.taps.length} taps. Under 40 ms off is tight enough that nobody will hear it.`:'Stopped.');
 },
 range(st,el){st.tempo=+el.value;const o=wHost(st)?.querySelector('.w-read output');if(o)o.textContent=st.tempo;}
};

/* ========================================================= plumbing */
function drawWidget(spec){
 if(!spec||!Object.hasOwn(W_KINDS,spec.kind))return '';
 const kind=W_KINDS[spec.kind], id='w'+(++wNext);
 const st=Object.assign({id,spec,kind:spec.kind},kind.init?kind.init(spec):{});
 W_STATE.set(id,st);
 return `<section class="widget" data-w="${id}" data-wkind="${esc(spec.kind)}" aria-label="${esc(spec.title||'Interactive')}">`
  +`<div class="widget-top"><span class="micro">${esc(spec.eyebrow||'Try it here')}</span><h3>${esc(spec.title||'')}</h3></div>`
  +(spec.hint?`<p class="widget-hint">${spec.hint}</p>`:'')
  +`<div class="widget-body">${kind.body(st)}</div>`
  +`<p class="widget-say" data-w-say role="status">${spec.say||''}</p></section>`;
}

const W_CLICK='[data-wkey],[data-wstep],[data-wplay],[data-wpill],[data-wcell],[data-wtoggle],[data-wtap],[data-wab],[data-wclear]';
document.addEventListener('click',e=>{
 const btn=e.target.closest(W_CLICK);if(!btn||btn.disabled)return;
 const st=wOwner(btn);if(!st)return;
 W_KINDS[st.kind].click?.(st,btn,btn.dataset);
});
document.addEventListener('input',e=>{
 const el=e.target.closest('[data-wrange]');if(!el)return;
 const st=wOwner(el);if(!st)return;
 W_KINDS[st.kind].range?.(st,el,el.dataset.wrange);
});
document.addEventListener('change',e=>{
 const el=e.target.closest('[data-wsel]');if(!el)return;
 const st=wOwner(el);if(!st)return;
 W_KINDS[st.kind].select?.(st,el,el.dataset.wsel);
});
// One transport serves the whole page, so when anything starts or stops every
// widget's play button has to agree about what it is now offering.
document.addEventListener('transportchange',()=>{
 for(const st of W_STATE.values()){
  const btn=wHost(st)?.querySelector('[data-wplay]');
  if(!btn)continue;
  const on=wPlaying(st);
  btn.textContent=on?'■ Stop':'▶ '+(st.spec.playLabel||W_PLAY_LABEL[st.kind]||'Play');
  btn.setAttribute('aria-pressed',String(on));
  const tap=wHost(st)?.querySelector('[data-wtap]');
  if(tap)tap.disabled=!on;
 }
});
