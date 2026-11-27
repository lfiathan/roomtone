'use strict';
// The practice room: one drum pattern you can edit, time, swing and hear,
// plus the genre library it can be loaded from and exported to.
const savedBeat=read('groove',{})||{};
let meterName=Object.hasOwn(meters,savedBeat.meter)?savedBeat.meter:'4/4';
let gridSize=degrees.includes(savedBeat.size)?savedBeat.size:1;
let swing=inRange(savedBeat.swing,50,67,50);
bpm=inRange(savedBeat.tempo,45,210,96);
const getBar=()=>stepsPerBar(meterName);
const getSteps=()=>getBar()*gridSize;
const getStride=()=>gridSize===.5?2:1;
const validRows=validDrumRows(savedBeat.rows,getBar());
let beat=validRows?savedBeat.rows:patternFrom({...basic,meter:meterName});
let grooveName=validRows&&typeof savedBeat.name==='string'?savedBeat.name.slice(0,85):'Backbeat';
let presetId=beatsLibrary.some(t=>t.id===savedBeat.preset)?savedBeat.preset:'house',previousGroove=null;
function saveBeat(){save('groove',{meter:meterName,size:gridSize,swing,tempo:bpm,rows:beat,name:grooveName,preset:presetId});}
function clockLabel(seconds){const s=Math.floor(seconds);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function describeSize(steps,bar){
 const coarse=steps===bar/2,note=coarse?'eighths':'sixteenths',bars=coarse?1:steps/bar;
 return `${steps} steps · ${bars} ${bars===1?'bar':'bars'} · ${note}`;
}
function selectedPreset(deck=false){return beatsLibrary.find(t=>t.id===(deck?deckPresetId:presetId))||beatsLibrary[0];}
function genrePicker(deck=false){
 const t=selectedPreset(deck),families=[...new Set(beatsLibrary.map(p=>p.family))];
 const actions=deck
  ?`<label>Parts to load<select data-load-target>${Object.entries({both:'Drums + bass',drums:'Drums only',bass:'Bass only'}).map(([id,label])=>`<option value="${id}" ${rhythmTarget===id?'selected':''}>${label}</option>`).join('')}</select></label><button class="btn" data-load-rhythm>Load into ${activeScene}</button>`
  :'<button class="btn" data-load>Load template</button>';
 const hint=deck
  ?`Suggested bass part · ${bassStyles[genreBassParts[t.family]].name}. Loading keeps the current tempo.`
  :'Loading sets the tempo, meter and drum hits. Edit any hit in the beat grid.';
 return `<section class="genre-box${deck?' deck-genres':''}" ${deck?'data-deck-templates':''}>
  ${deck?'':`<div class="genre-intro"><div><span class="micro">Groove library</span><h2>Genre templates</h2></div><span class="template-count">${beatsLibrary.length} patterns</span></div>`}
  <div class="template-controls"><label>Style family<select data-family>${families.map(f=>`<option ${f===t.family?'selected':''}>${esc(f)}</option>`).join('')}</select></label>
   <label>Template<select data-template>${beatsLibrary.filter(p=>p.family===t.family).map(p=>`<option value="${p.id}" ${p===t?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label></div>
  <div class="audition-info"><b>${esc(t.name)} · ${t.bpm} BPM · ${t.meter}</b><p>${t.cue}</p></div>
  <div class="pill-row"><button class="pill" data-preview ${MusicEngine.recording?'disabled':''}>${StudioAudio.current==='preview'?'■ Stop preview':'▷ Preview beat'}</button>
   ${actions}<button class="pill" data-pattern-midi>↓ Template MIDI</button>${!deck&&previousGroove?'<button class="pill" data-undo-load>Undo load</button>':''}</div>
  <p class="compact">${hint}</p></section>`;
}
function replacePicker(deck=false){
 const old=$(deck?'[data-deck-templates]':'.genre-box:not([data-deck-templates])');
 if(old)old.outerHTML=genrePicker(deck);
}
function tempoControl(label='Tempo'){return `<label class="tempo-control">${label} <input type="range" min="45" max="210" value="${bpm}" data-tempo><span><output data-bpm-output>${bpm}</output> BPM</span></label>`;}
function showGroove(){return `${esc(grooveName)} · ${meterName} · ${getSteps()} steps`;}
function showDeckGroove(){
 const drums=deckDrums();
 return `${activeScene} · ${drums.name} · ${drums.meter} · ${loopSpan(drums)/drumStride(drums)} steps`;
}
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
function audition(deck=false){
 if(StudioAudio.current==='preview'){StudioAudio.stop();return;}
 if(MusicEngine.recording)return;
 const t=selectedPreset(deck),m=meters[t.meter],rows=patternFrom(t),bar=m.beats*m.div;
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
const practiceDrums=()=>({meter:meterName,size:gridSize,swing,rows:beat,name:grooveName,templateId:null});
function exportBeat(isTemplate,deck=false){
 const t=selectedPreset(deck);
 const meter=isTemplate?t.meter:meterName,m=meters[meter],name=isTemplate?t.name:grooveName;
 const bytes=makeBeatMidi(isTemplate?patternFrom(t):beat,meter,isTemplate?t.bpm:bpm,isTemplate?t.swing:swing,
  isTemplate?m.beats*m.div*(t.next?2:1):getSteps(),isTemplate?1:getStride(),name);
 const url=URL.createObjectURL(new Blob([bytes],{type:'audio/midi'}));
 const a=document.createElement('a');a.href=url;a.download='roomtone-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')+'.mid';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
