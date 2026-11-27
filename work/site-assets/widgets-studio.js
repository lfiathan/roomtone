'use strict';
/* Widgets for chapters 2 and 3: drum patterns, arrangement, the mixer,
   A/B comparison and timing. */
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
