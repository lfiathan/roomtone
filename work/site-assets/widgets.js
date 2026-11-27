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
