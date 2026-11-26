'use strict';
// Each bank is ordered by semitone, including the final C of the upper bank.
const pianoBanks=[
 ['Q','2','W','3','E','R','5','T','6','Y','7','U'],
 ['Z','A','X','S','C','V','D','B','F','N','G','M',',']
];
const mappedKeys=pianoBanks.flat();
const blackSteps=new Set([1,3,6,8,10]);
const keyboardBase=()=>48+12*octave;
const activeKeys=new Map();
const liveSounds=['piano','bass','pluck','pad','organ','bell','lead'];
const chordBook={...harmony,Dm:{notes:[57,62,65],bass:38},Em:{notes:[59,64,67],bass:40},Bdim:{notes:[59,62,65],bass:35}};
const layerNames=['Drums','Bass','Chords','Arpeggio'];
// Each melodic channel plays a selectable part, so a deck can be performed
// rather than only muted and unmuted. A style decides WHEN its layer speaks;
// density thins what it plays; transpose moves the whole harmony.
const bassStyles={
 roots:{name:'Roots',at:(b,o,div,inside,bar)=>inside===bar-2?{i:7,d:1.35/div}:(o===0&&b%2===0?{i:0,d:.76}:null)},
 octaves:{name:'Octave bounce',at:(b,o)=>o===0?{i:b%2?12:0,d:.6}:null},
 walking:{name:'Walking',at:(b,o)=>o===0?{i:[0,7,3,10][b%4],d:.58}:null},
 push:{name:'Offbeat push',at:(b,o,div)=>o===Math.round(div/2)?{i:0,d:.44}:null},
 driving:{name:'Driving eighths',at:(b,o,div)=>o%Math.max(1,Math.round(div/2))===0?{i:o?12:0,d:.3}:null}
};
const chordStyles={
 pad:{name:'Sustained pad',voice:'pad',level:.14,dur:(s,beats)=>s*beats-.10,at:(b,o,div,inside)=>inside===0},
 stabs:{name:'Backbeat stabs',voice:'organ',level:.17,dur:s=>s*.26,at:(b,o)=>o===0&&b%2===1},
 pulse:{name:'Eighth pulse',voice:'organ',level:.12,dur:s=>s*.2,at:(b,o,div)=>o%Math.max(1,Math.round(div/2))===0},
 skank:{name:'Offbeat skank',voice:'organ',level:.15,dur:s=>s*.18,at:(b,o,div)=>o===Math.round(div/2)}
};
const arpStyles={
 updown:{name:'Up & down',order:[0,1,2,1]},
 up:{name:'Climbing',order:[0,1,2,3]},
 down:{name:'Falling',order:[3,2,1,0]},
 wide:{name:'Wide leaps',order:[0,2,1,3]},
 pedal:{name:'Pedal tone',order:[0,1,0,2]}
};
const arpRates=[{v:1,name:'1 per beat'},{v:2,name:'2 per beat'},{v:4,name:'4 per beat'}];
const sceneSets={
 Intro:{layers:[1,0,1,0],styles:{bass:'roots',chords:'pad',arp:'updown'},density:[65,100,100,100],arpRate:1},
 Groove:{layers:[1,1,1,0],styles:{bass:'roots',chords:'stabs',arp:'updown'},density:[100,100,100,100],arpRate:2},
 Lift:{layers:[1,1,1,1],styles:{bass:'driving',chords:'pulse',arp:'up'},density:[100,100,100,100],arpRate:4},
 Break:{layers:[0,0,1,1],styles:{bass:'push',chords:'pad',arp:'down'},density:[100,100,70,100],arpRate:2}
};
// Deterministic spread, so a thinned part repeats the same way each loop
// instead of flickering at random.
const spread=(a,b)=>{let x=(a*73856093^b*19349663)>>>0;x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
const degrees=[.5,1,2,4];
const inRange=(v,lo,hi,fallback)=>Number.isFinite(v)&&v>=lo&&v<=hi?v:fallback;
const kept=read('freestyle',{})||{};
const mix={
 layers:layerNames.map((_,i)=>Array.isArray(kept.layers)?!!kept.layers[i]:!!sceneSets.Groove.layers[i]),
 levels:layerNames.map((_,i)=>inRange(kept.levels?.[i],0,100,[95,85,75,66][i])),
 chords:[0,1,2,3].map((_,i)=>Object.hasOwn(chordBook,kept.chords?.[i])?kept.chords[i]:['C','G','Am','F'][i]),
 blend:inRange(kept.blend,0,100,50),filter:inRange(kept.filter,0,100,100),
 sound:liveSounds.includes(kept.sound)?kept.sound:'pluck',
 styles:{
  bass:Object.hasOwn(bassStyles,kept.styles?.bass)?kept.styles.bass:'roots',
  chords:Object.hasOwn(chordStyles,kept.styles?.chords)?kept.styles.chords:'pad',
  arp:Object.hasOwn(arpStyles,kept.styles?.arp)?kept.styles.arp:'updown'
 },
 density:layerNames.map((_,i)=>inRange(kept.density?.[i],20,100,100)),
 arpRate:arpRates.some(r=>r.v===kept.arpRate)?kept.arpRate:2,
 transpose:inRange(kept.transpose,-12,12,0)
};
const thins=(layer,step)=>mix.density[layer]>=100||spread(step+7,layer+3)<mix.density[layer]/100;
// The kick and snare carry the pulse, so thinning only touches the rest of the kit.
const keepHit=(id,r,step)=>mix.density[0]>=100||id==='kick'||id==='snare'||spread(step*31+r,r+5)<mix.density[0]/100;
// ---- Piano room -------------------------------------------------------------
// A wider keyboard with a sustain pedal, touch control and MIDI input, for
// playing pieces rather than sketching loops. The typing window stays 25 keys;
// the displayed range is larger and follows it.
const pianoVoices=['grand','piano','organ','bell'];
const pianoSizes=[25,37,49,61];
const touchLevels=[.11,.17,.25,.33,.42], touchCutoffs=[1500,2200,3100,4300,5900];
const touchNames=['Pianissimo','Piano','Mezzo','Forte','Fortissimo'];
const keptPiano=read('piano',{})||{};
const piano={
 voice:pianoVoices.includes(keptPiano.voice)?keptPiano.voice:'grand',
 size:pianoSizes.includes(keptPiano.size)?keptPiano.size:49,
 low:inRange(keptPiano.low,12,96,36),
 touch:inRange(keptPiano.touch,1,5,3)
};
let pedalDown=false, midiStatus='Not connected.', midiBound=false;
const sustained=new Set();
function savePiano(){save('piano',piano);}
// Keep the 25 keys the computer maps inside the range actually on screen,
// otherwise typing would hit notes that have no key to light up.
function fitWindow(){
 const bottom=keyboardBase(), top=bottom+24;
 let low=piano.low;
 if(bottom<low)low=bottom;
 if(top>low+piano.size-1)low=top-piano.size+1;
 low=12*Math.floor(low/12);
 if(top>low+piano.size-1)low=12*Math.ceil((top-piano.size+1)/12);
 piano.low=Math.max(12,Math.min(108-piano.size,low));
}
const savedBeat=read('groove',{})||{};
let meterName=Object.hasOwn(meters,savedBeat.meter)?savedBeat.meter:'4/4';
let gridSize=degrees.includes(savedBeat.size)?savedBeat.size:1;
let swing=inRange(savedBeat.swing,50,67,50);
bpm=inRange(savedBeat.tempo,45,210,96);
const getBar=()=>meters[meterName].beats*meters[meterName].div;
const getSteps=()=>getBar()*gridSize;
const getStride=()=>gridSize===.5?2:1;
const validRows=Array.isArray(savedBeat.rows)&&savedBeat.rows.length===kit.length&&savedBeat.rows.every(row=>Array.isArray(row)&&row.length===getBar()*4&&row.every(x=>x===0||x===1));
let beat=validRows?savedBeat.rows:patternFrom({...basic,meter:meterName});
let grooveName=validRows&&typeof savedBeat.name==='string'?savedBeat.name.slice(0,85):'Backbeat';
let presetId=beatsLibrary.some(t=>t.id===savedBeat.preset)?savedBeat.preset:'house',previousGroove=null;
let octave=0,drawBar=0,drawBeat=0,captureDisplay='';
function saveBeat(){save('groove',{meter:meterName,size:gridSize,swing,tempo:bpm,rows:beat,name:grooveName,preset:presetId});}
function saveMix(){save('freestyle',mix);MusicEngine.setMix(mix);}
function clockLabel(seconds){const s=Math.floor(seconds);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function describeSize(steps,bar){
 const coarse=steps===bar/2,note=coarse?'eighths':'sixteenths',bars=coarse?1:steps/bar;
 return `${steps} steps · ${bars} ${bars===1?'bar':'bars'} · ${note}`;
}
function keyboard(mini=false){
 const first=keyboardBase();
 const banks=pianoBanks.map((bindings,bank)=>{
  const start=first+12*bank, whiteTotal=bank===0?7:8;
  let whiteCount=0;
  const buttons=bindings.map((key,step)=>{
   const note=start+step,black=blackSteps.has(step),label=pitchLabel(note);
   const scaleTone=scales[scaleKey].some(n=>n%12===note%12);
   const style=black?` style="left:${whiteCount/whiteTotal*100}%;width:${.64/whiteTotal*100}%"`:'';
   if(!black)whiteCount++;
   const face=mini||black?key:label;
   const badge=!mini&&!black?`<b class="letter-badge">${key}</b>`:'';
   return `<button type="button" class="${black?'blackkey':'whitekey'} ${!mini&&scaleTone?'inscale':''}" data-note="${note}" aria-label="Play ${label} with ${key}" aria-pressed="false" title="${label} · ${key}"${style}><span>${face}</span>${badge}</button>`;
  }).join('');
  return `<div class="piano-bank" role="group" aria-label="${bank===0?'Lower':'Higher'} register, ${pitchLabel(start)} to ${pitchLabel(start+bindings.length-1)}">${buttons}</div>`;
 });
 return `<div class="${mini?'mini-keys':'lab-keys'}" role="group" aria-label="Playable keyboard">${banks.join('')}</div>`;
}
function keyboardHelp(){
 const first=keyboardBase();
 const rows=pianoBanks.map((keys,i)=>{
  const whites=keys.filter((_,n)=>!blackSteps.has(n)).join(' ');
  const blacks=keys.filter((_,n)=>blackSteps.has(n)).join(' ');
  return `<tr><th scope="row">${pitchLabel(first+i*12)}–${pitchLabel(first+i*12+keys.length-1)}</th><td><kbd>${whites}</kbd></td><td><kbd>${blacks}</kbd></td></tr>`;
 });
 return `<div class="key-controls"><table class="key-map"><thead><tr><th>Register</th><th>White keys</th><th>Black keys</th></tr></thead><tbody>${rows.join('')}</tbody></table><div class="octaves"><span>Shift octaves</span><button data-oct="-1" aria-label="Lower both registers, left bracket" ${octave<=-2?'disabled':''}>[ −</button><output>${pitchLabel(first)}–${pitchLabel(first+24)}</output><button data-oct="1" aria-label="Raise both registers, right bracket" ${octave>=2?'disabled':''}>+ ]</button></div></div>`;
}
function playLive(id,note,el,velocity){
 if(activeKeys.has(id))return;
 const room=!!$('#piano-room');
 const stage=!!$('#freestyle-board'),patch=room?piano.voice:stage?mix.sound:$('.mini-keys')?'piano':wave;
 if(stage&&MusicEngine.setup())MusicEngine.setMix(mix);
 let options={bus:stage?'live':undefined};
 if(room){
  // A MIDI key reports how hard it was struck; a computer key cannot, so the
  // Touch control stands in for it.
  const v=Number.isFinite(velocity)?Math.max(1,Math.min(127,velocity)):null;
  options={level:v===null?touchLevels[piano.touch-1]:.06+(v/127)*.40,
           cutoff:v===null?touchCutoffs[piano.touch-1]:1200+(v/127)*5000};
 }
 const release=MusicEngine.play(note,patch,options);
 activeKeys.set(id,{note,release,el,pedal:room});el?.classList.add('held');el?.setAttribute('aria-pressed','true');
 const readout=$('#piano-note')||$('#synth-readout')||$('#key-feedback')||$('#live-note');
 if(readout)readout.textContent=[...new Set([...activeKeys.values()].map(k=>pitchLabel(k.note)))].join(' · ');
}
function releaseKey(id){
 const held=activeKeys.get(id);if(!held)return;
 // With the pedal down the damper stays off: hold the note and let it ring.
 if(pedalDown&&held.pedal)sustained.add(held.release);else held.release();
 activeKeys.delete(id);
 if(![...activeKeys.values()].some(k=>k.el===held.el)){held.el?.classList.remove('held');held.el?.setAttribute('aria-pressed','false');}
}
function releaseKeys(){
 for(const id of activeKeys.keys())releaseKey(id);
 for(const release of sustained)release();
 sustained.clear();pedalDown=false;
}
function setPedal(on){
 if(on===pedalDown)return;
 pedalDown=on;
 if(!on){for(const release of sustained)release();sustained.clear();}
 const b=$('[data-pedal]');
 if(b){b.setAttribute('aria-pressed',String(on));b.classList.toggle('down',on);}
}
function shiftOctave(amount){
 const next=Math.max(-2,Math.min(2,octave+amount));if(next===octave)return;
 releaseKeys();octave=next;
 const keys=$('.mini-keys,.lab-keys');if(keys)keys.outerHTML=keyboard(keys.classList.contains('mini-keys'));
 if($('#piano-room'))refreshPiano();
 const help=$('.key-controls');if(help)help.outerHTML=keyboardHelp();
 const display=$('#synth-readout')||$('#live-note')||$('#key-feedback');if(display)display.textContent='Keyboard starts on '+pitchLabel(keyboardBase());
}
function selectedPreset(){return beatsLibrary.find(t=>t.id===presetId)||beatsLibrary[0];}
function genrePicker(){
 const t=selectedPreset(),families=[...new Set(beatsLibrary.map(p=>p.family))];
 return `<section class="genre-box"><div class="genre-intro"><div><span class="micro">Groove library</span><h2>Genre templates</h2></div><span class="template-count">${beatsLibrary.length} patterns</span></div><div class="template-controls"><label>Style family<select data-family>${families.map(f=>`<option ${f===t.family?'selected':''}>${esc(f)}</option>`).join('')}</select></label><label>Template<select data-template>${beatsLibrary.filter(p=>p.family===t.family).map(p=>`<option value="${p.id}" ${p===t?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label></div><div class="audition-info"><b>${esc(t.name)} · ${t.bpm} BPM · ${t.meter}</b><p>${t.cue}</p></div><div class="pill-row"><button class="pill" data-preview ${MusicEngine.recording?'disabled':''}>${StudioAudio.current==='preview'?'■ Stop preview':'▷ Preview beat'}</button><button class="btn" data-load>Load template</button><button class="pill" data-pattern-midi>↓ Template MIDI</button>${previousGroove?'<button class="pill" data-undo-load>Undo load</button>':''}</div><p class="compact">Loading sets the tempo, meter and drum hits. Edit any hit in the beat grid.</p></section>`;
}
function replacePicker(){
 const old=$('.genre-box');if(old)old.outerHTML=genrePicker();
}
function tempoControl(){return `<label class="tempo-control">Tempo <input type="range" min="45" max="210" value="${bpm}" data-tempo><span><output data-bpm-output>${bpm}</output> BPM</span></label>`;}
function showGroove(){return `${esc(grooveName)} · ${meterName} · ${getSteps()} steps`;}
function gridContent(){
 const bar=getBar(),stride=getStride(),perBar=bar/stride,div=meters[meterName].div/stride;
 const names=div===2?['','&']:div===4?['','e','&','a']:div===3?['','tri','plet']:['','+','tri','+','plet','+'];
 let html='';
 for(let start=0;start<getSteps();start+=perBar){
  let cells='<span class="lane-label">Sound</span>';const barNumber=start/perBar+1;
  for(let i=0;i<perBar;i++){const label=i%div===0?1+Math.floor(i/div):names[i%div];cells+=`<span class="count ${i%div===0?'down':''}" data-column="${start+i}">${label}</span>`;}
  kit.forEach(([id,name],r)=>{
   cells+=`<button class="audition-lane" data-hit="${id}" title="Play ${name}">${name}</button>`;
   for(let i=0;i<perBar;i++){
    const col=start+i;
    cells+=`<button class="step ${id} ${i%div===0?'down':''}" data-row="${r}" data-col="${col}" aria-label="${name}, bar ${barNumber}, step ${i+1}" aria-pressed="${!!beat[r][col*stride]}"></button>`;
   }
  });
  html+=`<div class="grid-bar"><div class="micro">Bar ${barNumber}</div><div class="grid-scroll"><div class="beat-grid extended" style="--columns:${perBar};--grid-min:${70+perBar*30}px">${cells}</div></div></div>`;
 }
 return html;
}
function sequencerPanel(){
 return `<section class="panel sequencer"><div class="row-between"><h2>Beat grid</h2>${link('freestyle','Play in freestyle')}</div><p>Tap a cell to add a hit. Tap a drum name to hear it in isolation. Longer patterns give you room to write a second-bar fill.</p><div class="control-row"><button data-grid-play class="btn">▶ Play beat</button>${tempoControl()}<label><input type="checkbox" data-click ${clickOn?'checked':''}> Metronome</label></div><div class="control-row"><label>Pattern length <select data-grid-size>${degrees.map(x=>`<option value="${x}" ${gridSize===x?'selected':''}>${describeSize(getBar()*x,getBar())}</option>`).join('')}</select></label><span class="compact">${bpmUnit()}</span></div><div class="row-between"><p class="current-groove">${showGroove()}</p><button class="pill" data-edited-midi>↓ Beat MIDI</button></div><div data-grid-body>${gridContent()}</div><div class="pill-row"><button class="pill" data-pattern="base">Load backbeat</button><button class="pill" data-pattern="verse">Load verse</button><button class="pill" data-pattern="empty">Clear grid</button></div><p class="compact">Shorter views keep the hidden steps for when you expand again. Clear grid clears all four bars. Undo load restores the preceding pattern.</p></section>`;
}
function beatGrid(){return sequencerPanel()+genrePicker();}
function bpmUnit(){return `Count one ${meters[meterName].unit} per BPM pulse.`;}
function beatAt(rows,step,stride,t,bus,keep){
 kit.forEach(([id],r)=>{if(rows[r][step*stride]&&(!keep||keep(id,r)))MusicEngine.hit(id,t,step*stride%2?.63:.85,bus);});
}
function markGrid(i){
 $$('.beat-grid .now').forEach(b=>b.classList.remove('now'));$$(`[data-column="${i}"],[data-col="${i}"]`).forEach(b=>b.classList.add('now'));
}
function startGrid(){
 const stride=getStride(),div=meters[meterName].div/stride;
 StudioAudio.sequence('grid',getSteps(),()=>bpm,(i,t)=>{
  beatAt(beat,i,stride,t);if(clickOn&&i%div===0)MusicEngine.hit(i%(getBar()/stride)===0?'accent':'click',t,.62);
 },markGrid,true,div,i=>swingLength(i,div,swing));
}
function audition(){
 if(StudioAudio.current==='preview'){StudioAudio.stop();return;}
 if(MusicEngine.recording)return;
 const t=selectedPreset(),m=meters[t.meter],rows=patternFrom(t),bar=m.beats*m.div;
 StudioAudio.sequence('preview',2*bar,()=>t.bpm,(i,when)=>beatAt(rows,i,1,when),null,false,m.div,i=>swingLength(i,m.div,t.swing));
}
function snapshot(){return {meterName,gridSize,swing,bpm,beat:beat.map(r=>[...r]),grooveName};}
function syncGrooveUI(was){
 if($('.sequencer'))$('.sequencer').outerHTML=sequencerPanel();
 replacePicker();$$('[data-bpm-output]').forEach(o=>o.textContent=bpm);$$('[data-tempo]').forEach(e=>e.value=bpm);
 updateBoard();saveBeat();
 if(was==='grid')startGrid();else if(was==='freestyle')startDecks();else if(was==='preview')StudioAudio.stop();
}
function loadGroove(t,keepTempo=false){
 const was=StudioAudio.current;previousGroove=snapshot();
 meterName=t.meter;gridSize=t.next?2:1;swing=t.swing;if(!keepTempo)bpm=t.bpm;beat=patternFrom(t);grooveName=t.name;
 syncGrooveUI(was);
}
function revertLoad(){if(!previousGroove)return;const was=StudioAudio.current,p=previousGroove;previousGroove=null;
 meterName=p.meterName;gridSize=p.gridSize;swing=p.swing;bpm=p.bpm;beat=p.beat;grooveName=p.grooveName;syncGrooveUI(was);
}
function startDecks(){
 if(!MusicEngine.setup())return;MusicEngine.setMix(mix);
 const m=meters[meterName],barLength=getBar(),stride=getStride(),drumSpan=getSteps()*stride;
 StudioAudio.sequence('freestyle',barLength*4,()=>bpm,(step,t,sec)=>{
  const bar=Math.floor(step/barLength),inside=step%barLength,beatNo=Math.floor(inside/m.div),offset=inside%m.div,chord=chordBook[mix.chords[bar]],s=60/bpm;
  const shift=mix.transpose;
  if(step%stride===0)beatAt(beat,(step%drumSpan)/stride,stride,t,'drums',(id,r)=>keepHit(id,r,step));

  const bassMove=bassStyles[mix.styles.bass].at(beatNo,offset,m.div,inside,barLength);
  if(bassMove&&thins(1,step))
   MusicEngine.play(chord.bass+bassMove.i+shift,'bass',{at:t,duration:s*bassMove.d,level:bassMove.i?.26:.38,bus:'bass'});

  const chordPart=chordStyles[mix.styles.chords];
  if(chordPart.at(beatNo,offset,m.div,inside)&&thins(2,step))
   chord.notes.forEach(n=>MusicEngine.play(n+shift,chordPart.voice,{at:t,duration:Math.max(.08,chordPart.dur(s,m.beats)),level:chordPart.level,bus:'chords'}));

  const span=Math.max(1,Math.round(m.div/mix.arpRate));
  if(inside%span===0&&thins(3,step)){
   const order=arpStyles[mix.styles.arp].order, pool=[chord.notes[0],chord.notes[1],chord.notes[2],chord.notes[0]+12];
   MusicEngine.play(pool[order[Math.floor(inside/span)%order.length]]+12+shift,'bell',{at:t,duration:s*.3,level:.22,bus:'arp'});
  }
 },step=>{drawBar=Math.floor(step/barLength);drawBeat=Math.floor(step%barLength/m.div);updatePosition();},true,m.div,i=>swingLength(i,m.div,swing));
}
function updatePosition(){
 const p=$('#deck-position');if(p)p.textContent=StudioAudio.current==='freestyle'?`Bar ${drawBar+1} / 4 · beat ${drawBeat+1} · ${mix.chords[drawBar]}`:'Ready · 4-bar progression';
 $$('[data-bar-marker]').forEach((x,i)=>x.classList.toggle('active',StudioAudio.current==='freestyle'&&i===drawBar));
 if(MusicEngine.recording&&$('#capture-time'))$('#capture-time').textContent=clockLabel(MusicEngine.seconds);
}
function matchesScene(name){
 const sc=sceneSets[name];
 return sc.layers.every((v,i)=>!!v===mix.layers[i])&&sc.density.every((v,i)=>v===mix.density[i])
  &&Object.keys(sc.styles).every(k=>sc.styles[k]===mix.styles[k])&&sc.arpRate===mix.arpRate;
}
function applyScene(name){
 const sc=sceneSets[name];
 mix.layers=sc.layers.map(Boolean);mix.density=sc.density.slice();
 mix.styles={...sc.styles};mix.arpRate=sc.arpRate;
}
function updateBoard(){
 if(!$('#freestyle-board'))return;
 const on=StudioAudio.current==='freestyle';
 $('[data-deck-play]').textContent=on?'■ Stop decks':'▶ Start decks';
 $('[data-deck-play]').setAttribute('aria-pressed',String(on));
 $$('[data-layer]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(mix.layers[i]));b.querySelector('small').textContent=mix.layers[i]?'On':'Off';});
 $$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(matchesScene(b.dataset.scene))));
 $$('[data-style]').forEach(sel=>{sel.value=mix.styles[sel.dataset.style];});
 const rateSel=$('[data-arp-rate]');if(rateSel)rateSel.value=String(mix.arpRate);
 $$('[data-density]').forEach(r=>{const i=+r.dataset.density;r.value=String(mix.density[i]);const lab=$(`[data-density-label="${i}"]`);if(lab)lab.textContent=`Density ${mix.density[i]}%`;});
 const tr=$('#transpose-read');if(tr)tr.textContent=`${mix.transpose>0?'+':''}${mix.transpose} st`;
 const g=$('#board-groove');if(g)g.textContent=`${grooveName} · ${meterName} · ${getSteps()} steps`;
 $('[data-record]').textContent=MusicEngine.recording?'■ Finish take':'● Record take';
 $('[data-record]').classList.toggle('recording',MusicEngine.recording);
 if($('[data-preview]'))$('[data-preview]').disabled=MusicEngine.recording;
 if($('#take-status'))$('#take-status').textContent=captureDisplay;
 updatePosition();
}
function takePlayer(){
 const f=MusicEngine.take;
 return f?`<div class="take-player"><audio aria-label="Play your last performance" controls preload="metadata" src="${f.url}"></audio><a class="btn ghost" href="${f.url}" download="roomtone-freestyle.wav">↓ Download WAV</a><small>${clockLabel(f.seconds)} · mono WAV</small></div>`:'';
}
function finishTake(){
 const old=MusicEngine.take,finished=MusicEngine.endTake();
 captureDisplay=old===finished?'No audio was captured. Try recording a few beats.':'Take ready. Listen below or download it for GarageBand.';
 const slot=$('#last-take');if(slot)slot.innerHTML=takePlayer();updateBoard();
}
function stopDecks(){if(MusicEngine.recording)finishTake();StudioAudio.stop();releaseKeys();}
function recordToggle(){
 if(MusicEngine.recording){stopDecks();return;}
 try{
  $('audio')?.pause();
  if(!MusicEngine.beginTake(()=>{stopDecks();}))return;
  if(StudioAudio.current!=='freestyle')startDecks();
  captureDisplay='Recording the master mix. Play the keys, trigger pads, or change scenes.';
 }catch{captureDisplay='This browser could not start the recorder. Open the file in Safari, Chrome, or Firefox and try again.';}
 updateBoard();
}
function partControls(i){
 const dense=`<label class="dense"><span data-density-label="${i}">Density ${mix.density[i]}%</span><input type="range" min="20" max="100" step="5" value="${mix.density[i]}" data-density="${i}"></label>`;
 if(i===0)return `<div class="part-row">${dense}</div>`;
 const key=['','bass','chords','arp'][i], book=[null,bassStyles,chordStyles,arpStyles][i];
 const part=`<label><span>Part</span><select data-style="${key}">${Object.entries(book).map(([id,v])=>`<option value="${id}" ${mix.styles[key]===id?'selected':''}>${esc(v.name)}</option>`).join('')}</select></label>`;
 const rate=i===3?`<label><span>Rate</span><select data-arp-rate>${arpRates.map(r=>`<option value="${r.v}" ${mix.arpRate===r.v?'selected':''}>${r.name}</option>`).join('')}</select></label>`:'';
 return `<div class="part-row">${part}${rate}${dense}</div>`;
}
function mixerDeck(title,kind,indices){
 return `<section class="mix-deck ${kind}"><div class="deck-title"><span class="deck-letter" aria-hidden="true">${kind==='rhythm-deck'?'A':'B'}</span><div><div class="micro">Deck ${kind==='rhythm-deck'?'A':'B'}</div><h3>${title}</h3></div></div><div class="channel-list">${indices.map(i=>`<div class="channel"><button class="layer-key" data-layer="${i}" aria-pressed="${mix.layers[i]}"><i></i>${layerNames[i]}<small>${mix.layers[i]?'On':'Off'}</small></button><label><span>${layerNames[i]} level</span><input type="range" min="0" max="100" value="${mix.levels[i]}" data-level="${i}"></label>${partControls(i)}</div>`).join('')}</div></section>`;
}
function windowLabel(){return pitchLabel(keyboardBase())+'\u2013'+pitchLabel(keyboardBase()+24);}
function grandKeyboard(){
 fitWindow();
 const low=piano.low, count=piano.size, bottom=keyboardBase();
 let whiteTotal=0;
 for(let i=0;i<count;i++)if(!blackSteps.has((low+i)%12))whiteTotal++;
 let whiteCount=0;
 const keys=[];
 for(let i=0;i<count;i++){
  const note=low+i, black=blackSteps.has(note%12), label=pitchLabel(note);
  const typed=note>=bottom&&note<=bottom+24?mappedKeys[note-bottom]:'';
  const scaleTone=scales[scaleKey].some(n=>n%12===note%12);
  const style=black?` style="left:${whiteCount/whiteTotal*100}%;width:${.62/whiteTotal*100}%"`:'';
  if(!black)whiteCount++;
  const named=!black&&(count<=25||note%12===0);
  const badge=typed&&!black&&count<=37?`<b class="letter-badge">${typed}</b>`:'';
  keys.push(`<button type="button" class="${black?'blackkey':'whitekey'}${!black&&scaleTone?' inscale':''}${typed?' typed':''}" data-note="${note}" aria-label="Play ${label}${typed?' with '+typed:''}" aria-pressed="false" title="${label}${typed?' \u00b7 '+typed:''}"${style}><span>${named?label:''}</span>${badge}</button>`);
 }
 return `<div class="grand-keys" role="group" aria-label="Piano keyboard, ${pitchLabel(low)} to ${pitchLabel(low+count-1)}">${keys.join('')}</div>`;
}
function refreshPiano(){
 const board=$('.grand-keys');if(board)board.outerHTML=grandKeyboard();
 const w=$('#piano-window');if(w)w.textContent=windowLabel();
 const down=$('[data-oct="-1"]'),up=$('[data-oct="1"]');
 if(down)down.disabled=octave<=-2;
 if(up)up.disabled=octave>=2;
 const status=$('#midi-status');if(status)status.textContent=midiStatus;
}
function setMidiStatus(text){midiStatus=text;const el=$('#midi-status');if(el)el.textContent=text;}
function onMidiMessage(e){
 const [status,a,b]=e.data, type=status&0xf0;
 if(type===0x90&&b>0)playLive('midi-'+a,a,$(`[data-note="${a}"]`),b);
 else if(type===0x80||(type===0x90&&b===0))releaseKey('midi-'+a);
 else if(type===0xb0&&a===64)setPedal(b>=64);
 else if(type===0xb0&&a===123)releaseKeys();
}
function connectMidi(){
 if(!navigator.requestMIDIAccess){
  setMidiStatus('This browser has no Web MIDI. Chrome and Edge support it; Safari and Firefox do not.');return;
 }
 setMidiStatus('Asking for permission\u2026');
 navigator.requestMIDIAccess().then(access=>{
  const bind=()=>{
   const names=[];
   for(const input of access.inputs.values()){input.onmidimessage=onMidiMessage;names.push(input.name||'MIDI device');}
   setMidiStatus(names.length?'Connected: '+names.join(', '):'No MIDI device found. Plug one in and it will connect itself.');
  };
  if(!midiBound){access.onstatechange=bind;midiBound=true;}
  bind();
 }).catch(()=>setMidiStatus('MIDI permission was declined. Reload the page to ask again.'));
}
function pianoPage(){
 fitWindow();
 return bread('Piano room')+heading('Piano room','A wide keyboard with a sustain pedal, touch control and MIDI input. Built for playing pieces rather than sketching loops.')+
 `<section id="piano-room">
  <div class="room-top">
   <div><span class="micro">Now playing</span><h2 id="piano-note">Ready</h2></div>
   <div class="room-actions">
    <label>Voice <select data-piano-voice>${pianoVoices.map(v=>`<option value="${v}" ${piano.voice===v?'selected':''}>${esc(voices[v].name)}</option>`).join('')}</select></label>
    <label>Touch <select data-touch>${touchNames.map((n,i)=>`<option value="${i+1}" ${piano.touch===i+1?'selected':''}>${n}</option>`).join('')}</select></label>
    <button class="btn" data-pedal aria-pressed="false">Sustain <kbd>Space</kbd></button>
   </div>
  </div>
  ${grandKeyboard()}
  <div class="room-foot">
   <label>Keys <select data-piano-size>${pianoSizes.map(n=>`<option value="${n}" ${piano.size===n?'selected':''}>${n} keys</option>`).join('')}</select></label>
   <div class="octaves"><span>Typing window</span><button data-oct="-1" aria-label="Move the typing window down an octave" ${octave<=-2?'disabled':''}>[ \u2212</button><output id="piano-window">${windowLabel()}</output><button data-oct="1" aria-label="Move the typing window up an octave" ${octave>=2?'disabled':''}>+ ]</button></div>
   <div class="midi-box"><button class="pill" data-midi>Connect a MIDI keyboard</button><small id="midi-status">${esc(midiStatus)}</small></div>
  </div>
 </section>
 <div class="free-columns"><div class="stack"><section class="panel"><h2>Playing with a computer keyboard</h2>
  <p>The shaded keys are the ones your computer maps. White keys are <kbd>Q W E R T Y U</kbd> then <kbd>Z X C V B N M ,</kbd>; black keys are <kbd>2 3 5 6 7</kbd> and <kbd>A S D F G</kbd>. Use <kbd>[</kbd> and <kbd>]</kbd> to move that window across the full range, and hold <kbd>Space</kbd> for the sustain pedal.</p>
  <p>Two limits are worth knowing. A computer keyboard sends no velocity, so every note arrives at the same strength and the <b>Touch</b> control sets it for all of them. Most keyboards also report only about six keys at once, and cheaper ones drop to three, so a full chord under a melody will lose notes.</p>
  </section></div><div class="stack"><section class="panel"><h2>Playing with a real keyboard</h2>
  <p>Connect any USB or Bluetooth MIDI keyboard and press <b>Connect a MIDI keyboard</b>. Every key and its velocity come straight through, so dynamics work, and a sustain pedal on the controller is read as well.</p>
  <p>Web MIDI needs Chrome or Edge. Safari and Firefox do not support it yet.</p>
  ${link('practice/keys','Practice scales and intervals')}
  </section></div></div>`;
}
function freestylePage(){
 return bread('Freestyle studio')+heading('Freestyle studio','Build a groove on two decks. Fade between rhythm and harmony, play a melody with your keyboard, and capture the whole performance.')+
 `<section id="freestyle-board"><div class="booth-top"><div><span class="micro">Live mix</span><h2 id="board-groove">${showGroove()}</h2></div><div class="booth-actions"><button class="btn warm" data-deck-play>▶ Start decks</button><button class="record-btn" data-record>● Record take</button></div></div><div class="booth-clock"><span id="deck-position">Ready · 4-bar progression</span><div class="bar-markers" aria-hidden="true">${[1,2,3,4].map(()=>'<i data-bar-marker></i>').join('')}</div></div><div class="decks">${mixerDeck('Rhythm section','rhythm-deck',[0,1])}<div class="mix-center"><span class="micro">Mixer</span><label>Crossfader <input data-mix="blend" type="range" min="0" max="100" value="${mix.blend}"><span class="range-ends"><small>A · Rhythm</small><small>B · Harmony</small></span></label><label>Low-pass filter <input data-mix="filter" type="range" min="0" max="100" value="${mix.filter}"><span class="range-ends"><small>Dark</small><small>Open</small></span></label><label>Transpose <span id="transpose-read">${mix.transpose>0?'+':''}${mix.transpose} st</span><input data-mix="transpose" type="range" min="-12" max="12" value="${mix.transpose}"><span class="range-ends"><small>-12</small><small>+12</small></span></label></div>${mixerDeck('Harmony section','harmony-deck',[2,3])}</div><div class="scene-row"><span class="micro">Scenes</span>${Object.keys(sceneSets).map(s=>`<button class="scene" data-scene="${s}" aria-pressed="${matchesScene(s)}">${s}</button>`).join('')}</div></section>
 <div class="free-columns"><div class="stack"><section class="panel live-panel"><div class="row-between"><h2>Live instrument</h2><label>Voice <select data-live-sound>${liveSounds.map(k=>`<option value="${k}" ${mix.sound===k?'selected':''}>${voices[k].name}</option>`).join('')}</select></label></div><p>Play over the decks. Hold Q, E and T for a low C-major chord, then play Z, X and C over it with your other hand.</p>${keyboard()}${keyboardHelp()}<output id="live-note" class="compact">Ready for a note</output><div class="divider"></div><h3>Drum pads</h3><p class="compact">Hold Shift and press 1–9 for drum hits. A numeric keypad or a tap on a pad works too.</p><div class="hot-pads">${kit.map(([id,label],i)=>`<button data-hit="${id}" class="hot-pad"><kbd>⇧${i+1}</kbd>${label}</button>`).join('')}</div></section>
 <section class="panel progression"><h2>Write the chord loop</h2><p>Choose one chord per bar. Bass, chords and arpeggio follow the same changes. Changes are heard the next time each part plays.</p><div class="chord-strip">${mix.chords.map((name,i)=>`<label>Bar ${i+1}<select data-progression="${i}">${Object.keys(chordBook).map(c=>`<option ${c===name?'selected':''}>${c}</option>`).join('')}</select></label>`).join('')}</div>${tempoControl()}${link('practice/beat','Edit the drum pattern')}</section></div><div class="stack">${genrePicker()}<section class="panel recorder-panel"><div class="row-between"><h2>Your take</h2><output class="clock" id="capture-time">${clockLabel(MusicEngine.recording?MusicEngine.seconds:0)}</output></div><p>Record up to three minutes of the decks, live notes, drum pads and mixer moves. Download the WAV before closing the tab.</p><div id="last-take">${takePlayer()}</div><p id="take-status" role="status">${esc(captureDisplay)}</p></section></div></div>`;
}
function exportBeat(isTemplate){
 const t=selectedPreset();
 const meter=isTemplate?t.meter:meterName,m=meters[meter],name=isTemplate?t.name:grooveName;
 const bytes=makeBeatMidi(isTemplate?patternFrom(t):beat,meter,isTemplate?t.bpm:bpm,isTemplate?t.swing:swing,
  isTemplate?m.beats*m.div*(t.next?2:1):getSteps(),isTemplate?1:getStride(),name);
 const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'}));
 const a=document.createElement('a');a.href=url;a.download='roomtone-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'.mid';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function pressPad(id){
 const stage=!!$('#freestyle-board');if(stage&&MusicEngine.setup())MusicEngine.setMix(mix);MusicEngine.hit(id,undefined,.86,stage?'live':undefined);
 $$(`[data-hit="${id}"]`).forEach(b=>{b.classList.add('struck');clearTimeout(b.flash);b.flash=setTimeout(()=>b.classList.remove('struck'),140);});
}
function pianoShortcut(e){
 const code=e.code||'';
 if(/^Key[A-Z]$/.test(code))return code.slice(3);
 if(/^Digit[0-9]$/.test(code))return code.slice(5);
 if(code.startsWith('Numpad'))return code;
 if(code==='Comma')return ',';
 if(code==='BracketLeft')return '[';
 if(code==='BracketRight')return ']';
 const shiftedDigit='!@#$%^&*('.indexOf(e.key);
 return e.shiftKey&&shiftedDigit>=0?String(shiftedDigit+1):e.key.toUpperCase();
}
function typingTarget(el){return el?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');}
document.addEventListener('keydown',e=>{
 if(e.repeat||e.isComposing||e.metaKey||e.ctrlKey||e.altKey||typingTarget(e.target)||!$('.lab-keys,.mini-keys,.grand-keys'))return;
 const k=pianoShortcut(e),id='key-'+k,index=mappedKeys.indexOf(k);
 if(e.key===' '&&$('#freestyle-board')&&!e.target.closest?.('button,a,audio')){e.preventDefault();StudioAudio.current==='freestyle'?stopDecks():startDecks();return;}
 if(e.key===' '&&$('#piano-room')){e.preventDefault();if(!e.repeat)setPedal(true);return;}
 if(k==='['||k===']'){e.preventDefault();shiftOctave(k==='['?-1:1);return;}
 const pad=/^Numpad[1-9]$/.test(k)?Number(k.slice(6)):e.shiftKey&&/^[1-9]$/.test(k)?Number(k):0;
 if(pad){if($('#freestyle-board')){e.preventDefault();pressPad(kit[pad-1][0]);}return;}
 if(index<0)return;const n=keyboardBase()+index,btn=$(`[data-note="${n}"]`);
 if(btn){e.preventDefault();playLive(id,n,btn);}
});
document.addEventListener('keyup',e=>{
 if(e.key===' '&&$('#piano-room')){setPedal(false);return;}
 releaseKey('key-'+pianoShortcut(e));
});
window.addEventListener('blur',()=>setPedal(false));
document.addEventListener('pointerdown',e=>{
 const pedal=e.target.closest?.('[data-pedal]');
 if(pedal&&e.button===0){e.preventDefault();setPedal(true);
  const lift=()=>{setPedal(false);window.removeEventListener('pointerup',lift);window.removeEventListener('pointercancel',lift);};
  window.addEventListener('pointerup',lift);window.addEventListener('pointercancel',lift);return;}
 const b=e.target.closest?.('[data-note]');if(!b||e.button!==0)return;
 e.preventDefault();b.focus({preventScroll:true});try{b.setPointerCapture(e.pointerId);}catch{}
 playLive('pointer-'+e.pointerId,+b.dataset.note,b);
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(event,e=>releaseKey('pointer-'+e.pointerId));
window.addEventListener('blur',releaseKeys);
window.addEventListener('pagehide',()=>{releaseKeys();if(MusicEngine.recording)finishTake();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseKeys();if(MusicEngine.recording)finishTake();}});
document.addEventListener('transportchange',()=>{
 if(!StudioAudio.current){releaseKeys();MusicEngine.stopVoices();}
 const p=$('[data-preview]');if(p)p.textContent=StudioAudio.current==='preview'?'■ Stop preview':'▷ Preview beat';
 updateBoard();
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.note&&e.detail===0){const id='assist-'+d.note;releaseKey(id);playLive(id,+d.note,b);setTimeout(()=>releaseKey(id),430);}
 if(d.oct)shiftOctave(+d.oct);
 if(d.hit)pressPad(d.hit);
 if(b.hasAttribute('data-pattern-midi'))exportBeat(true);
 if(b.hasAttribute('data-edited-midi'))exportBeat(false);
 if(d.row!==undefined){
  const r=+d.row,idx=+d.col*getStride();beat[r][idx]=+!beat[r][idx];b.setAttribute('aria-pressed',String(!!beat[r][idx]));
  if(beat[r][idx]&&!StudioAudio.current)pressPad(kit[r][0]);
  if(!grooveName.endsWith(' · edited'))grooveName+=' · edited';$('.current-groove').textContent=`${grooveName} · ${meterName} · ${getSteps()} steps`;saveBeat();
 }
 if(b.hasAttribute('data-grid-play'))StudioAudio.current==='grid'?StudioAudio.stop():startGrid();
 if(d.pattern==='base'||d.pattern==='verse'){
  const oldSize=gridSize;loadGroove(d.pattern==='base'?basic:verse,true);
  if(oldSize===.5){const was=StudioAudio.current;gridSize=.5;syncGrooveUI(was);}
 }
 if(d.pattern==='empty'){
  const was=StudioAudio.current;previousGroove=snapshot();beat=beat.map(row=>row.map(()=>0));grooveName='Empty pattern';syncGrooveUI(was);
 }
 if(b.hasAttribute('data-load'))loadGroove(selectedPreset());
 if(b.hasAttribute('data-undo-load'))revertLoad();
 if(b.hasAttribute('data-preview'))audition();
 if(b.hasAttribute('data-deck-play'))StudioAudio.current==='freestyle'?stopDecks():startDecks();
 if(b.hasAttribute('data-record'))recordToggle();
 if(b.hasAttribute('data-midi'))connectMidi();
 if(b.hasAttribute('data-pedal')&&e.detail===0)setPedal(!pedalDown);
 if(d.layer!==undefined){const i=+d.layer;mix.layers[i]=!mix.layers[i];saveMix();updateBoard();}
 if(d.scene){applyScene(d.scene);saveMix();updateBoard();}
});
document.addEventListener('change',e=>{
 const b=e.target,d=b.dataset;
 if(b.hasAttribute('data-family')||b.hasAttribute('data-template')){
  const family=b.hasAttribute('data-family');presetId=family?beatsLibrary.find(t=>t.family===b.value).id:b.value;
  if(StudioAudio.current==='preview')StudioAudio.stop();replacePicker();$(family?'[data-family]':'[data-template]')?.focus({preventScroll:true});
 }
 if(b.hasAttribute('data-grid-size')){const was=StudioAudio.current;gridSize=Number(b.value);syncGrooveUI(was);$('[data-grid-size]')?.focus({preventScroll:true});}
 if(b.hasAttribute('data-live-sound')){releaseKeys();mix.sound=b.value;saveMix();}
 if(b.hasAttribute('data-piano-voice')){releaseKeys();piano.voice=b.value;savePiano();}
 if(b.hasAttribute('data-touch')){piano.touch=+b.value;savePiano();}
 if(b.hasAttribute('data-piano-size')){piano.size=+b.value;savePiano();refreshPiano();}
 if(d.progression!==undefined){mix.chords[+d.progression]=b.value;saveMix();}
 if(d.style){mix.styles[d.style]=b.value;saveMix();updateBoard();}
 if(b.hasAttribute('data-arp-rate')){mix.arpRate=+b.value;saveMix();updateBoard();}
});
document.addEventListener('input',e=>{
 const d=e.target.dataset;
 if(d.level!==undefined){mix.levels[+d.level]=+e.target.value;saveMix();}
 if(d.density!==undefined){const i=+d.density;mix.density[i]=+e.target.value;saveMix();
  const lab=$(`[data-density-label="${i}"]`);if(lab)lab.textContent=`Density ${mix.density[i]}%`;
  $$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(matchesScene(b.dataset.scene))));}
 if(d.mix){mix[d.mix]=+e.target.value;saveMix();
  if(d.mix==='transpose'){const tr=$('#transpose-read');if(tr)tr.textContent=`${mix.transpose>0?'+':''}${mix.transpose} st`;}}
});
render(false);
