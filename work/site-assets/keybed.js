'use strict';
// The typing keyboard: which computer key sounds which note, what is held
// down, and the pedal that keeps it held. Shared by the practice room, the
// Freestyle deck and the piano room, which each draw their own keybed.
let octave=0;
let pedalDown=false;
// Each bank is ordered by semitone, including the final C of the upper bank.
const pianoBanks=[
 ['Q','2','W','3','E','R','5','T','6','Y','7','U'],
 ['Z','A','X','S','C','V','D','B','F','N','G','M',',']
];
const mappedKeys=pianoBanks.flat();
const blackSteps=new Set([1,3,6,8,10]);
const keyboardBase=()=>48+12*octave;
const activeKeys=new Map();
const sustained=new Set();
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
