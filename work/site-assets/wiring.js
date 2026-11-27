'use strict';
// The switchboard. These listeners are delegated and keyed on data-*
// attributes, so they stay in one file on purpose: splitting them per
// feature would duplicate the shared guards and change the order in which
// a single keystroke is offered around. Loads last, so render() runs once
// every feature above has initialised its state.
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
 const inDeckTemplates=Boolean(b.closest('[data-deck-templates]'));
 if(d.note&&e.detail===0){const id='assist-'+d.note;releaseKey(id);playLive(id,+d.note,b);setTimeout(()=>releaseKey(id),430);}
 if(d.oct)shiftOctave(+d.oct);
 if(d.hit)pressPad(d.hit);
 if(b.hasAttribute('data-pattern-midi'))exportBeat(true,inDeckTemplates);
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
 if(b.hasAttribute('data-preview'))audition(inDeckTemplates);
 if(b.hasAttribute('data-deck-play'))StudioAudio.current==='freestyle'?stopDecks():startDecks();
 if(b.hasAttribute('data-record'))recordToggle();
 if(b.hasAttribute('data-midi'))connectMidi();
 if(b.hasAttribute('data-pedal')&&e.detail===0)setPedal(!pedalDown);
 if(d.layer!==undefined){
  const i=+d.layer;
  if(i<2)rememberRhythm();
  mix.layers[i]=!mix.layers[i];
  saveMix();updateBoard();
 }
 if(d.scene)applyScene(d.scene);
 if(b.hasAttribute('data-rhythm-edit')){
  rhythmOpen=!rhythmOpen;
  refreshRhythmEditor();
  b.setAttribute('aria-expanded',String(rhythmOpen));
  b.textContent=rhythmOpen?'Close rhythm editor':'Edit drums & bass';
  if(rhythmOpen)$('[data-rhythm-part][aria-pressed="true"]').focus();
 }
 if(d.rhythmPart){
  rhythmPart=d.rhythmPart;
  refreshRhythmEditor();
  $('[data-rhythm-part][aria-pressed="true"]').focus({preventScroll:true});
 }
 if(d.rhythmStep!==undefined)editRhythmCell(b);
 if(b.hasAttribute('data-copy-practice')){
  changeRhythm(()=>{
   setDeckDrums(copyDrums(practiceDrums()));
   mix.layers[0]=true;
  });
  $('[data-copy-practice]').focus({preventScroll:true});
 }
 if(b.hasAttribute('data-clear-rhythm')){
  clearRhythmPart();
  $('[data-clear-rhythm]').focus({preventScroll:true});
 }
 if(b.hasAttribute('data-rhythm-undo')){
  undoRhythm();
  $('[data-rhythm-part][aria-pressed="true"]').focus({preventScroll:true});
 }
 if(b.hasAttribute('data-load-rhythm')){
  loadDeckTemplate(rhythmTarget);
  $('[data-load-rhythm]').focus({preventScroll:true});
 }
});
document.addEventListener('change',e=>{
 const b=e.target,d=b.dataset;
 if(b.hasAttribute('data-family')||b.hasAttribute('data-template')){
  const family=b.hasAttribute('data-family'),deck=Boolean(b.closest('[data-deck-templates]'));
  const id=family?beatsLibrary.find(t=>t.family===b.value).id:b.value;
  if(deck)deckPresetId=id;else presetId=id;
  if(StudioAudio.current==='preview')StudioAudio.stop();
  replacePicker(deck);$(family?'[data-family]':'[data-template]')?.focus({preventScroll:true});
 }
 if(b.hasAttribute('data-grid-size')){const was=StudioAudio.current;gridSize=Number(b.value);syncGrooveUI(was);$('[data-grid-size]')?.focus({preventScroll:true});}
 if(b.hasAttribute('data-live-sound')){releaseKeys();mix.sound=b.value;saveMix();}
 if(b.hasAttribute('data-piano-voice')){releaseKeys();piano.voice=b.value;savePiano();}
 if(b.hasAttribute('data-touch')){piano.touch=+b.value;savePiano();}
 if(b.hasAttribute('data-piano-size')){piano.size=+b.value;savePiano();refreshPiano();}
 if(d.progression!==undefined){mix.chords[+d.progression]=b.value;saveMix();}
 if(d.style){
  if(d.style==='bass'){
   rememberRhythm();
   if(b.value==='custom')mix.drums||=copyDrums(practiceDrums());
  }
  mix.styles[d.style]=b.value;
  saveMix();updateBoard();
  if(d.style==='bass'&&rhythmPart==='bass')refreshRhythmEditor();
 }
 if(b.hasAttribute('data-bass-voice')){
  rememberRhythm();
  mix.bassVoice=b.value;saveMix();updateBoard();
 }
 if(b.hasAttribute('data-load-target'))rhythmTarget=b.value;
 if(b.hasAttribute('data-rhythm-size')){
  const size=+b.value;
  changeRhythm(()=>{mix.drums||=copyDrums(practiceDrums());mix.drums.size=size;});
  $('[data-rhythm-size]').focus({preventScroll:true});
 }
 if(b.hasAttribute('data-rhythm-bar')){
  rhythmBar=+b.value;
  refreshRhythmEditor();
  $('[data-rhythm-bar]').focus({preventScroll:true});
 }
 if(b.hasAttribute('data-arp-rate')){mix.arpRate=+b.value;saveMix();updateBoard();}
});
document.addEventListener('input',e=>{
 const d=e.target.dataset;
 if(d.level!==undefined){mix.levels[+d.level]=+e.target.value;saveMix();}
 if(d.density!==undefined){const i=+d.density;mix.density[i]=+e.target.value;saveMix();
  const lab=$(`[data-density-label="${i}"]`);if(lab)lab.textContent=`Density ${mix.density[i]}%`;}
 if(d.mix){mix[d.mix]=+e.target.value;saveMix();
  if(d.mix==='transpose'){const tr=$('#transpose-read');if(tr)tr.textContent=`${mix.transpose>0?'+':''}${mix.transpose} st`;}}
});
render(false);
