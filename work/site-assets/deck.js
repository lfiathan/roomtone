'use strict';
// The Freestyle deck: four layers over a chord loop, the scenes that recall
// a whole mix, and recording the result. Loads after groove.js, because
// deckPresetId falls back to the practice room's own selection.
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
 Break:{layers:[0,0,1,1],styles:{bass:'push',chords:'pad',arp:'down'},density:[100,100,70,100],arpRate:2},
 Outro:{layers:[1,0,1,0],styles:{bass:'roots',chords:'pad',arp:'down'},density:[40,100,100,100],arpRate:1}
};
const bassVoices=['bass','sine','pluck','sawtooth'];
const bassNotes={root:'Root',third:'Third',fifth:'Fifth',seventh:'Flat seventh',octave:'Octave'};
const bassStyleNotes={0:'root',3:'third',7:'fifth',10:'seventh',12:'octave'};
const genreBassParts={
 'Pop & soul':'octaves','Hip-hop & bass':'roots','Club & electronic':'push','Rock & guitar':'driving',
 'Jazz, folk & blues':'walking','Caribbean & Latin':'push','African grooves':'octaves','Indonesian grooves':'driving'
};
// Deterministic spread, so a thinned part repeats the same way each loop
// instead of flickering at random.
const spread=(a,b)=>{let x=(a*73856093^b*19349663)>>>0;x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
const knownBassStyle=id=>id==='custom'||Object.hasOwn(bassStyles,id);

function readScene(saved,preset){
 const layerLevels=[95,85,75,66];
 const drum=saved.drums;
 const drums=drum&&Object.hasOwn(meters,drum.meter)&&validDrumRows(drum.rows,stepsPerBar(drum.meter))
  ?{meter:drum.meter,size:degrees.includes(drum.size)?drum.size:1,swing:inRange(drum.swing,50,67,50),
    rows:drum.rows,name:typeof drum.name==='string'?drum.name.slice(0,85):'Custom beat',
    templateId:beatsLibrary.some(t=>t.id===drum.templateId)?drum.templateId:null}
  :null;
 const limit=drums?stepsPerBar(drums.meter)*4:0;
 const bassLine=Object.fromEntries(Object.entries(saved.bassLine||{}).filter(([step,note])=>
  /^\d+$/.test(step)&&+step<limit&&Object.hasOwn(bassNotes,note)));
 return {
  layers:preset.layers.map((on,i)=>Boolean(saved.layers?.[i]??on)),
  levels:layerLevels.map((level,i)=>inRange(saved.levels?.[i],0,100,level)),
  styles:{
   bass:knownBassStyle(saved.styles?.bass)?saved.styles.bass:preset.styles.bass,
   chords:Object.hasOwn(chordStyles,saved.styles?.chords)?saved.styles.chords:preset.styles.chords,
   arp:Object.hasOwn(arpStyles,saved.styles?.arp)?saved.styles.arp:preset.styles.arp
  },
  density:preset.density.map((density,i)=>inRange(saved.density?.[i],20,100,density)),
  arpRate:arpRates.some(r=>r.v===saved.arpRate)?saved.arpRate:preset.arpRate,
  drums,bassLine,bassVoice:bassVoices.includes(saved.bassVoice)?saved.bassVoice:'bass'
 };
}

const kept=read('freestyle',{})||{};
const previousScene=Object.keys(sceneSets).find(name=>{
 const preset=sceneSets[name];
 return preset.arpRate===kept.arpRate&&preset.layers.every((on,i)=>Boolean(on)===kept.layers?.[i])
  &&preset.density.every((density,i)=>density===kept.density?.[i])
  &&Object.entries(preset.styles).every(([part,style])=>kept.styles?.[part]===style);
});
let activeScene=Object.hasOwn(sceneSets,kept.activeScene)?kept.activeScene:previousScene||'Groove';
const sceneBank=Object.fromEntries(Object.entries(sceneSets).map(([name,preset])=>[
 name,readScene(kept.scenes?.[name]??(name===activeScene&&!kept.scenes?kept:{}),preset)
]));
const mix={
 ...sceneBank[activeScene],
 chords:[0,1,2,3].map((_,i)=>Object.hasOwn(chordBook,kept.chords?.[i])?kept.chords[i]:['C','G','Am','F'][i]),
 blend:inRange(kept.blend,0,100,50),filter:inRange(kept.filter,0,100,100),
 sound:liveSounds.includes(kept.sound)?kept.sound:'pluck',
 transpose:inRange(kept.transpose,-12,12,0)
};
const thins=(layer,step)=>mix.density[layer]>=100||spread(step+7,layer+3)<mix.density[layer]/100;
// The kick and snare carry the pulse, so thinning only touches the rest of the kit.
const keepHit=(id,r,step)=>mix.density[0]>=100||id==='kick'||id==='snare'||spread(step*31+r,r+5)<mix.density[0]/100;
let deckPresetId=mix.drums?.templateId||presetId;
let drawBar=0,drawBeat=0,captureDisplay='';
function saveMix(){
 const {layers,levels,styles,density,arpRate,drums,bassLine,bassVoice}=mix;
 sceneBank[activeScene]={layers,levels,styles,density,arpRate,drums,bassLine,bassVoice};
 save('freestyle',{...mix,activeScene,scenes:sceneBank});
 MusicEngine.setMix(mix);
}
const deckDrums=()=>mix.drums||practiceDrums();
const copyDrums=drums=>({...drums,rows:drums.rows.map(row=>row.slice())});
const drumStride=drums=>drums.size===.5?2:1;
const loopSpan=drums=>stepsPerBar(drums.meter)*Math.max(1,drums.size);
function shownBassLine(drums){
 if(mix.styles.bass==='custom')return mix.bassLine;
 const m=meters[drums.meter],bar=stepsPerBar(drums.meter),style=bassStyles[mix.styles.bass],notes={};
 for(let step=0;step<bar*4;step++){
  const inside=step%bar,hit=style.at(Math.floor(inside/m.div),inside%m.div,m.div,inside,bar);
  if(hit)notes[step]=bassStyleNotes[hit.i];
 }
 return notes;
}
function bassInterval(chord,note){
 if(note==='third'||note==='fifth'){
  const intervals=chord.notes.map(pitch=>(pitch-chord.bass)%12).sort((a,b)=>a-b);
  return intervals[note==='third'?1:2];
 }
 return {root:0,seventh:10,octave:12}[note];
}

function startDecks(){
 if(!MusicEngine.setup())return;MusicEngine.setMix(mix);
 const m=meters[deckDrums().meter],barLength=m.beats*m.div;
 drawBar=drawBeat=0;
 StudioAudio.sequence('freestyle',barLength*4,()=>bpm,(step,t,sec)=>{
  const bar=Math.floor(step/barLength),inside=step%barLength,beatNo=Math.floor(inside/m.div),offset=inside%m.div,chord=chordBook[mix.chords[bar]],s=60/bpm;
  const shift=mix.transpose;
  const drums=deckDrums(),stride=drumStride(drums),patternStep=step%loopSpan(drums);
  if(patternStep%stride===0)beatAt(drums.rows,patternStep/stride,stride,t,'drums',(id,r)=>keepHit(id,r,patternStep));

  const bassNote=patternStep%stride===0&&mix.bassLine[patternStep];
  const bassMove=mix.styles.bass==='custom'
   ?(bassNote&&{i:bassInterval(chord,bassNote),d:.36})
   :bassStyles[mix.styles.bass].at(beatNo,offset,m.div,inside,barLength);
  if(bassMove&&thins(1,step))
   MusicEngine.play(chord.bass+bassMove.i+shift,mix.bassVoice,{at:t,duration:s*bassMove.d,level:bassMove.i?.26:.38,bus:'bass'});

  const chordPart=chordStyles[mix.styles.chords];
  if(chordPart.at(beatNo,offset,m.div,inside)&&thins(2,step))
   chord.notes.forEach(n=>MusicEngine.play(n+shift,chordPart.voice,{at:t,duration:Math.max(.08,chordPart.dur(s,m.beats)),level:chordPart.level,bus:'chords'}));

  const span=Math.max(1,Math.round(m.div/mix.arpRate));
  if(inside%span===0&&thins(3,step)){
   const order=arpStyles[mix.styles.arp].order, pool=[chord.notes[0],chord.notes[1],chord.notes[2],chord.notes[0]+12];
   MusicEngine.play(pool[order[Math.floor(inside/span)%order.length]]+12+shift,'bell',{at:t,duration:s*.3,level:.22,bus:'arp'});
  }
 },step=>{drawBar=Math.floor(step/barLength);drawBeat=Math.floor(step%barLength/m.div);updatePosition();},true,m.div,i=>swingLength(i,m.div,deckDrums().swing));
}
function updatePosition(){
 const p=$('#deck-position');if(p)p.textContent=StudioAudio.current==='freestyle'?`Bar ${drawBar+1} / 4 · beat ${drawBeat+1} · ${mix.chords[drawBar]}`:'Ready · 4-bar progression';
 $$('[data-bar-marker]').forEach((x,i)=>x.classList.toggle('active',StudioAudio.current==='freestyle'&&i===drawBar));
 if(MusicEngine.recording&&$('#capture-time'))$('#capture-time').textContent=clockLabel(MusicEngine.seconds);
}
function applyScene(name){
 if(name===activeScene)return;
 const meter=deckDrums().meter;
 activeScene=name;
 Object.assign(mix,sceneBank[name]);
 deckPresetId=mix.drums?.templateId||deckPresetId;
 rhythmBar=0;
 syncDeckRhythm(meter);
}
function updateBoard(){
 if(!$('#freestyle-board'))return;
 const on=StudioAudio.current==='freestyle';
 $('[data-deck-play]').textContent=on?'■ Stop decks':'▶ Start decks';
 $('[data-deck-play]').setAttribute('aria-pressed',String(on));
 $$('[data-layer]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(mix.layers[i]));b.querySelector('small').textContent=mix.layers[i]?'On':'Off';});
 $$('[data-level]').forEach(input=>input.value=String(mix.levels[+input.dataset.level]));
 $$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===activeScene)));
 $$('[data-style]').forEach(sel=>{sel.value=mix.styles[sel.dataset.style];});
 $('[data-bass-voice]').value=mix.bassVoice;
 const rateSel=$('[data-arp-rate]');if(rateSel)rateSel.value=String(mix.arpRate);
 $$('[data-density]').forEach(r=>{const i=+r.dataset.density;r.value=String(mix.density[i]);const lab=$(`[data-density-label="${i}"]`);if(lab)lab.textContent=`Density ${mix.density[i]}%`;});
 const tr=$('#transpose-read');if(tr)tr.textContent=`${mix.transpose>0?'+':''}${mix.transpose} st`;
 $('#board-groove').textContent=showDeckGroove();
 const status=$('[data-rhythm-save]');
 if(status)status.textContent=storageOK?`Edits save to ${activeScene}.`:'Edits are kept for this visit.';
 const mute=$('[data-rhythm-muted]');
 if(mute)mute.hidden=mix.layers[rhythmPart==='bass'?1:0];
 const undo=$('[data-rhythm-undo]');
 if(undo)undo.disabled=!rhythmUndo[activeScene];
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
 const custom=i===1?`<option value="custom" ${mix.styles.bass==='custom'?'selected':''}>Custom pattern</option>`:'';
 const part=`<label><span>Part</span><select data-style="${key}">${Object.entries(book).map(([id,v])=>`<option value="${id}" ${mix.styles[key]===id?'selected':''}>${esc(v.name)}</option>`).join('')}${custom}</select></label>`;
 const voice=i===1?`<label><span>Voice</span><select data-bass-voice>${bassVoices.map(id=>`<option value="${id}" ${mix.bassVoice===id?'selected':''}>${esc(voices[id].name)}</option>`).join('')}</select></label>`:'';
 const rate=i===3?`<label><span>Rate</span><select data-arp-rate>${arpRates.map(r=>`<option value="${r.v}" ${mix.arpRate===r.v?'selected':''}>${r.name}</option>`).join('')}</select></label>`:'';
 return `<div class="part-row">${part}${voice}${rate}${dense}</div>`;
}
function mixerDeck(title,kind,indices){
 const rhythm=kind==='rhythm-deck',letter=rhythm?'A':'B';
 return `<section class="mix-deck ${kind}"><div class="deck-title"><span class="deck-letter" aria-hidden="true">${letter}</span><div><div class="micro">Deck ${letter}</div><h3>${title}</h3></div></div><div class="channel-list">${indices.map(i=>`<div class="channel"><button class="layer-key" data-layer="${i}" aria-pressed="${mix.layers[i]}"><i></i>${layerNames[i]}<small>${mix.layers[i]?'On':'Off'}</small></button><label><span>${layerNames[i]} level</span><input type="range" min="0" max="100" value="${mix.levels[i]}" data-level="${i}"></label>${partControls(i)}</div>`).join('')}</div>
 ${rhythm?`<button class="deck-edit" data-rhythm-edit aria-controls="rhythm-editor" aria-expanded="${rhythmOpen}">${rhythmOpen?'Close rhythm editor':'Edit drums &amp; bass'}</button>`:''}</section>`;
}
function freestylePage(){
 return bread('Freestyle studio')+heading('Freestyle studio','Build a groove on two decks. Fade between rhythm and harmony, play a melody with your keyboard, and capture the whole performance.')+
 `<section id="freestyle-board">
 <div class="booth-top"><div><span class="micro">Live mix</span><h2 id="board-groove">${esc(showDeckGroove())}</h2></div>
  <div class="booth-actions"><button class="btn warm" data-deck-play>▶ Start decks</button><button class="record-btn" data-record>● Record take</button></div></div>
 <div class="booth-clock"><span id="deck-position">Ready · 4-bar progression</span><div class="bar-markers" aria-hidden="true">${[1,2,3,4].map(()=>'<i data-bar-marker></i>').join('')}</div></div>
 <div class="scene-row" role="group" aria-label="Scenes"><span class="micro" aria-hidden="true">Scenes</span>
  ${Object.keys(sceneSets).map(name=>`<button class="scene" data-scene="${name}" aria-pressed="${name===activeScene}">${name}</button>`).join('')}</div>
 <div class="decks">
  ${mixerDeck('Rhythm section','rhythm-deck',[0,1])}
  <div class="mix-center"><span class="micro">Mixer</span>
   <label>Crossfader <input data-mix="blend" type="range" min="0" max="100" value="${mix.blend}"><span class="range-ends"><small>A · Rhythm</small><small>B · Harmony</small></span></label>
   ${tempoControl('Tempo for all scenes')}
   <label>Low-pass filter <input data-mix="filter" type="range" min="0" max="100" value="${mix.filter}"><span class="range-ends"><small>Dark</small><small>Open</small></span></label>
   <label>Transpose <span id="transpose-read">${mix.transpose>0?'+':''}${mix.transpose} st</span><input data-mix="transpose" type="range" min="-12" max="12" value="${mix.transpose}"><span class="range-ends"><small>-12</small><small>+12</small></span></label>
  </div>
  ${mixerDeck('Harmony section','harmony-deck',[2,3])}
 </div>
 <section id="rhythm-editor" class="rhythm-editor" aria-label="Deck A rhythm editor" ${rhythmOpen?'':'hidden'}>${rhythmOpen?rhythmEditorBody():''}</section>
 </section>
 <div class="free-columns"><div class="stack"><section class="panel live-panel"><div class="row-between"><h2>Live instrument</h2><label>Voice <select data-live-sound>${liveSounds.map(k=>`<option value="${k}" ${mix.sound===k?'selected':''}>${voices[k].name}</option>`).join('')}</select></label></div><p>Play over the decks. Hold Q, E and T for a low C-major chord, then play Z, X and C over it with your other hand.</p>${keyboard()}${keyboardHelp()}<output id="live-note" class="compact">Ready for a note</output><div class="divider"></div><h3>Drum pads</h3><p class="compact">Hold Shift and press 1–9 for drum hits. A numeric keypad or a tap on a pad works too.</p><div class="hot-pads">${kit.map(([id,label],i)=>`<button data-hit="${id}" class="hot-pad"><kbd>⇧${i+1}</kbd>${label}</button>`).join('')}</div></section>
 <section class="panel progression"><h2>Write the chord loop</h2><p>Choose one chord per bar. Bass, chords and arpeggio follow the same changes. Changes are heard the next time each part plays.</p><div class="chord-strip">${mix.chords.map((name,i)=>`<label>Bar ${i+1}<select data-progression="${i}">${Object.keys(chordBook).map(c=>`<option ${c===name?'selected':''}>${c}</option>`).join('')}</select></label>`).join('')}</div>${link('practice/beat','Open Practice beat grid')}</section></div><div class="stack"><section class="panel recorder-panel"><div class="row-between"><h2>Your take</h2><output class="clock" id="capture-time">${clockLabel(MusicEngine.recording?MusicEngine.seconds:0)}</output></div><p>Record up to three minutes of the decks, live notes, drum pads and mixer moves. Download the WAV before closing the tab.</p><div id="last-take">${takePlayer()}</div><p id="take-status" role="status">${esc(captureDisplay)}</p></section></div></div>`;
}
function pressPad(id){
 const stage=!!$('#freestyle-board');if(stage&&MusicEngine.setup())MusicEngine.setMix(mix);MusicEngine.hit(id,undefined,.86,stage?'live':undefined);
 $$(`[data-hit="${id}"]`).forEach(b=>{b.classList.add('struck');clearTimeout(b.flash);b.flash=setTimeout(()=>b.classList.remove('struck'),140);});
}
