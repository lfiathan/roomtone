(async function checkPiano(){
 // Covers the piano room: the wide keybed, the typing window that slides across
 // it, the sustain pedal, touch, and MIDI input.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(130);};
 const codeFor=k=>k===','?'Comma':/^\d$/.test(k)?'Digit'+k:'Key'+k.toUpperCase();
 const press=(key,opts={})=>document.dispatchEvent(new KeyboardEvent('keydown',{key,code:codeFor(key),bubbles:true,cancelable:true,...opts}));
 const lift=(key,opts={})=>document.dispatchEvent(new KeyboardEvent('keyup',{key,code:codeFor(key),bubbles:true,cancelable:true,...opts}));
 const space=(type,repeat=false)=>document.dispatchEvent(new KeyboardEvent(type,{key:' ',code:'Space',repeat,bubbles:true,cancelable:true}));
 const midi=(...data)=>onMidiMessage({data});

 try{
  await goto('piano');
  check('the piano room renders',!!$('#piano-room'));
  check('it is reachable from the nav',!!document.querySelector('nav a[href="#piano"]'));

  // --- the keybed -------------------------------------------------------
  check('49 keys by default',$$('#piano-room [data-note]').length===49);
  check('the range starts on a C',piano.low%12===0);
  check('25 keys are mapped to the computer',$$('#piano-room .typed').length===25);
  check('the lowest key is C2',$('#piano-room [data-note]').dataset.note==='36');
  check('the window readout matches',$('#piano-window').textContent==='C3–C5');

  const sizeOf=n=>{const s=$('[data-piano-size]');s.value=String(n);s.dispatchEvent(new Event('change',{bubbles:true}));};
  sizeOf(61);check('61 keys redraws the keybed',$$('#piano-room [data-note]').length===61);
  check('the wider range still holds the typing window',$$('#piano-room .typed').length===25);
  sizeOf(25);check('25 keys redraws the keybed',$$('#piano-room [data-note]').length===25);
  check('at 25 keys the window fills the keybed',$$('#piano-room .typed').length===25);
  sizeOf(49);

  // --- typing -----------------------------------------------------------
  press('q');
  check('Q plays C3',activeKeys.size===1&&[...activeKeys.values()][0].note===48);
  check('the key lights up',$('[data-note="48"]').classList.contains('held'));
  check('it plays through the piano path',[...activeKeys.values()][0].pedal===true);
  lift('q');check('releasing Q stops it',!activeKeys.size);

  press('q');press('e');press('t');
  check('three keys make a chord',activeKeys.size===3);
  ['q','e','t'].forEach(k=>lift(k));check('the chord releases',!activeKeys.size);

  // --- the window slides across the keybed ------------------------------
  const before=piano.low;
  press(']');
  check('] moves the typing window up',octave===1&&$('#piano-window').textContent==='C4–C6');
  check('the keybed follows the window',piano.low>=before&&piano.low+piano.size-1>=keyboardBase()+24);
  check('the moved window is still 25 keys',$$('#piano-room .typed').length===25);
  press('[');check('[ moves it back',octave===0);
  for(let i=0;i<4;i++)press('[');
  check('the window stops at the bottom',octave===-2);
  check('the keybed reaches down to it',piano.low<=keyboardBase());
  check('no typed key falls off the keybed',$$('#piano-room .typed').length===25);
  for(let i=0;i<2;i++)press(']');
  check('back to the middle',octave===0);

  // --- the sustain pedal ------------------------------------------------
  check('the pedal starts up',pedalDown===false);
  space('keydown');
  check('Space presses the pedal',pedalDown===true);
  check('the pedal button shows it',$('[data-pedal]').getAttribute('aria-pressed')==='true');
  press('q');lift('q');
  check('a released key keeps ringing',!activeKeys.size&&sustained.size===1);
  press('w');lift('w');
  check('a second note rings too',sustained.size===2);
  space('keyup');
  check('lifting the pedal damps them',pedalDown===false&&sustained.size===0);
  check('the pedal button clears',$('[data-pedal]').getAttribute('aria-pressed')==='false');

  space('keydown');press('q');lift('q');
  check('notes are ringing before leaving',sustained.size===1);
  await goto('home');await goto('piano');
  check('leaving the room damps everything',!sustained.size&&!pedalDown&&!activeKeys.size);

  // --- touch ------------------------------------------------------------
  const touch=$('[data-touch]');touch.value='5';touch.dispatchEvent(new Event('change',{bubbles:true}));
  check('touch updates',piano.touch===5);
  check('harder touch is louder',touchLevels[4]>touchLevels[0]);
  check('harder touch is brighter',touchCutoffs[4]>touchCutoffs[0]);
  touch.value='3';touch.dispatchEvent(new Event('change',{bubbles:true}));

  const voice=$('[data-piano-voice]');
  check('the grand is the default voice',piano.voice==='grand');
  check('the grand is a real voice',!!voices.grand&&voices.grand.decay>2);
  voice.value='organ';voice.dispatchEvent(new Event('change',{bubbles:true}));
  check('the voice can be changed',piano.voice==='organ');
  voice.value='grand';voice.dispatchEvent(new Event('change',{bubbles:true}));

  // --- MIDI -------------------------------------------------------------
  midi(0x90,60,100);
  check('a MIDI note sounds',activeKeys.has('midi-60'));
  check('it lights the right key',$('[data-note="60"]').classList.contains('held'));
  midi(0x80,60,0);check('note-off stops it',!activeKeys.has('midi-60'));
  midi(0x90,62,88);midi(0x90,62,0);
  check('note-on at velocity zero counts as note-off',!activeKeys.has('midi-62'));
  midi(0xb0,64,127);check('CC64 presses the pedal',pedalDown===true);
  midi(0x90,64,90);midi(0x80,64,0);
  check('the pedal holds MIDI notes too',sustained.size===1);
  midi(0xb0,64,0);check('CC64 release damps them',pedalDown===false&&!sustained.size);
  midi(0x90,110,90);
  check('a note off the keybed still sounds',activeKeys.has('midi-110'));
  midi(0x80,110,0);
  check('and releases cleanly',!activeKeys.has('midi-110'));
  check('MIDI reports a status',typeof midiStatus==='string'&&midiStatus.length>0);

  // --- settings persist --------------------------------------------------
  $('[data-piano-size]').value='37';$('[data-piano-size]').dispatchEvent(new Event('change',{bubbles:true}));
  await goto('home');await goto('piano');
  check('the key count survives navigation',$$('#piano-room [data-note]').length===37);
  check('the stored settings round-trip',JSON.parse(localStorage.getItem('roomtone.v1.piano')).size===37);
  $('[data-piano-size]').value='49';$('[data-piano-size]').dispatchEvent(new Event('change',{bubbles:true}));

  // --- the rest of the site is untouched ---------------------------------
  await goto('freestyle');
  press('q');
  check('freestyle keys still work',activeKeys.size===1);
  check('the pedal does not reach freestyle',[...activeKeys.values()][0].pedal===false);
  lift('q');
  space('keydown');
  check('Space still drives the decks in freestyle',StudioAudio.current==='freestyle');
  space('keydown');await delay(60);
  check('and stops them again',StudioAudio.current!=='freestyle');

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' piano checks, '+piano.size+' keys, '+pianoVoices.length+' voices';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
