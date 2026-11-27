'use strict';
// The drums & bass editor behind the deck: a step grid for whichever part
// is being edited, with one level of undo per part.
let rhythmOpen=false,rhythmPart='drums',rhythmBar=0,rhythmTarget='both';
const rhythmUndo={};

function rememberRhythm(){
 rhythmUndo[activeScene]={
  drums:mix.drums&&copyDrums(mix.drums),bassLine:{...mix.bassLine},
  bassStyle:mix.styles.bass,bassVoice:mix.bassVoice,layers:mix.layers.slice(0,2)
 };
}
function setDeckDrums(drums){
 const oldBar=stepsPerBar(deckDrums().meter),newBar=stepsPerBar(drums.meter);
 if(oldBar!==newBar){
  // Keep each bass note in its bar and move it to the nearest step in the new meter.
  mix.bassLine=Object.fromEntries(Object.entries(mix.bassLine).map(([step,note])=>[
   Math.floor(step/oldBar)*newBar+Math.min(newBar-1,Math.round(step%oldBar*newBar/oldBar)),note
  ]));
 }
 mix.drums=drums;
}
function syncDeckRhythm(previousMeter){
 saveMix();
 refreshRhythmEditor();
 if(StudioAudio.current==='freestyle'&&previousMeter!==deckDrums().meter)startDecks();
 else updateBoard();
}
function changeRhythm(change){
 const meter=deckDrums().meter;
 rememberRhythm();
 change();
 syncDeckRhythm(meter);
}
function undoRhythm(){
 const undo=rhythmUndo[activeScene];
 if(!undo)return;
 const meter=deckDrums().meter;
 mix.drums=undo.drums;
 mix.bassLine=undo.bassLine;
 mix.styles.bass=undo.bassStyle;
 mix.bassVoice=undo.bassVoice;
 mix.layers.splice(0,2,...undo.layers);
 delete rhythmUndo[activeScene];
 syncDeckRhythm(meter);
}
function loadDeckTemplate(target){
 const t=selectedPreset(true);
 changeRhythm(()=>{
  if(target!=='bass'){
   setDeckDrums({meter:t.meter,size:t.next?2:1,swing:t.swing,rows:patternFrom(t),name:t.name,templateId:t.id});
   mix.layers[0]=true;
  }
  if(target!=='drums'){
   mix.styles.bass=genreBassParts[t.family];
   mix.bassVoice='bass';
   mix.layers[1]=true;
  }
 });
}
function rhythmGrid(drums){
 const bar=stepsPerBar(drums.meter),stride=drumStride(drums),div=meters[drums.meter].div;
 const steps=Array.from({length:bar/stride},(_,i)=>i*stride);
 const bass=rhythmPart==='bass',line=bass?shownBassLine(drums):null;
 const lanes=bass?Object.entries(bassNotes):kit;
 const count=steps.map(step=>`<span class="count${step%div===0?' down':''}">${step%div===0?1+step/div:'·'}</span>`).join('');
 const rows=lanes.map(([id,label],row)=>{
  const header=bass?`<span class="lane-label">${label}</span>`
   :`<button class="audition-lane" data-hit="${id}" title="Play ${label}">${label}</button>`;
  const cells=steps.map((step,i)=>{
   const offset=rhythmBar*bar+step;
   const on=bass?line[offset]===id:Boolean(drums.rows[row][offset]);
   return `<button class="step ${bass?'bass-note':id}${step%div===0?' down':''}"
    ${bass?`data-edit-bass="${id}"`:`data-edit-drum="${row}"`} data-rhythm-step="${offset}"
    aria-label="${label}, bar ${rhythmBar+1}, step ${i+1}" aria-pressed="${on}"></button>`;
  }).join('');
  return header+cells;
 }).join('');
 return `<div class="grid-scroll" tabindex="0" role="region" aria-label="${bass?'Bass':'Drum'} grid, bar ${rhythmBar+1}">
  <div class="beat-grid extended rhythm-grid" style="--columns:${steps.length};--grid-min:${84+steps.length*29}px">
   <span class="lane-label">${bass?'Note':'Sound'}</span>${count}${rows}
  </div></div>`;
}
function rhythmEditorBody(templatesOpen=false){
 const drums=deckDrums(),barLength=stepsPerBar(drums.meter),bars=Math.max(1,drums.size);
 rhythmBar=Math.min(rhythmBar,bars-1);
 const bass=rhythmPart==='bass';
 return `<div class="rhythm-editor-head">
   <div><h3>${activeScene} rhythm</h3><p data-rhythm-save>${storageOK?`Edits save to ${activeScene}.`:'Edits are kept for this visit.'}</p></div>
   <button class="pill" data-rhythm-undo ${rhythmUndo[activeScene]?'':'disabled'}>Undo rhythm edit</button>
  </div>
  <details class="deck-template-menu" ${templatesOpen?'open':''}><summary>Genre templates</summary>${genrePicker(true)}</details>
  <div class="rhythm-toolbar">
   <div class="rhythm-tabs" role="group" aria-label="Part to edit">
    <button data-rhythm-part="drums" aria-pressed="${!bass}">Drums</button>
    <button data-rhythm-part="bass" aria-pressed="${bass}">Bass</button>
   </div>
   <label>Loop length<select data-rhythm-size>${degrees.map(size=>`<option value="${size}" ${drums.size===size?'selected':''}>${describeSize(barLength*size,barLength)}</option>`).join('')}</select></label>
   <label>Edit bar<select data-rhythm-bar>${Array.from({length:bars},(_,i)=>`<option value="${i}" ${i===rhythmBar?'selected':''}>Bar ${i+1}</option>`).join('')}</select></label>
  </div>
  <p class="rhythm-hint">${bass?'Choose one note per step. The root, third and fifth follow the chord in each bar.':'Tap a cell to add or remove a hit. Tap a drum name to hear it.'}
   <span data-rhythm-muted ${mix.layers[bass?1:0]?'hidden':''}>Turn on ${bass?'Bass':'Drums'} in Deck A to hear this part in the mix.</span></p>
  ${rhythmGrid(drums)}
  <div class="pill-row">
   ${bass?'':'<button class="pill" data-copy-practice>Copy Practice beat</button>'}
   <button class="pill" data-clear-rhythm>Clear ${bass?'bass':'drums'}</button>
  </div>`;
}
function refreshRhythmEditor(){
 const editor=$('#rhythm-editor');
 if(!editor)return;
 const open=editor.querySelector('details')?.open;
 editor.hidden=!rhythmOpen;
 editor.innerHTML=rhythmOpen?rhythmEditorBody(open):'';
}
function editRhythmCell(button){
 rememberRhythm();
 const step=+button.dataset.rhythmStep;
 mix.drums||=copyDrums(practiceDrums());
 if(Object.hasOwn(button.dataset,'editDrum')){
  const row=+button.dataset.editDrum;
  mix.drums.rows[row][step]=Number(!mix.drums.rows[row][step]);
  if(!mix.drums.name.endsWith(' · edited'))mix.drums.name=mix.drums.name.slice(0,76)+' · edited';
  button.setAttribute('aria-pressed',String(Boolean(mix.drums.rows[row][step])));
  if(mix.drums.rows[row][step]&&!StudioAudio.current)pressPad(kit[row][0]);
 }else{
  const note=button.dataset.editBass;
  if(mix.styles.bass!=='custom')mix.bassLine=shownBassLine(mix.drums);
  mix.styles.bass='custom';
  if(mix.bassLine[step]===note)delete mix.bassLine[step];
  else mix.bassLine[step]=note;
  $$('[data-edit-bass][data-rhythm-step="'+step+'"]').forEach(cell=>
   cell.setAttribute('aria-pressed',String(cell.dataset.editBass===mix.bassLine[step])));
  if(mix.bassLine[step]&&!StudioAudio.current){
   const chord=chordBook[mix.chords[rhythmBar]];
   MusicEngine.play(chord.bass+bassInterval(chord,note)+mix.transpose,mix.bassVoice,{duration:.25,level:.32});
  }
 }
 saveMix();
 updateBoard();
}
function clearRhythmPart(){
 changeRhythm(()=>{
  mix.drums||=copyDrums(practiceDrums());
  if(rhythmPart==='bass'){
   mix.bassLine={};
   mix.styles.bass='custom';
  }else{
   mix.drums.rows.forEach(row=>row.fill(0));
   mix.drums.name='Empty pattern';
   mix.drums.templateId=null;
  }
 });
}
