'use strict';
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
let midiStatus='Not connected.', midiBound=false;
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
