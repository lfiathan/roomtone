(async function checkApp(){
 // Exercise the native Web Audio graph without requiring an output device on the test host.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){ const ctx=new Offline(1,48000*2,48000);return ctx; };
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(110);};
 const evt=(type,k,code,repeat=false)=>new KeyboardEvent(type,{key:k,code,repeat,bubbles:true,cancelable:true});
 const choose=(selector,value)=>{const b=$(selector);b.value=value;b.dispatchEvent(new Event('change',{bubbles:true}));};
 const action=s=>$(s).click();
 try{
  const keys=['q','2','w','3','e','r','5','t','6','y','7','u','z','a','x','s','c','v','d','b','f','n','g','m',','];
  const codeFor=k=>k===','?'Comma':/^\d$/.test(k)?'Digit'+k:'Key'+k.toUpperCase();
  const dispatch=(type,key,code,opts={})=>document.dispatchEvent(new KeyboardEvent(type,{key,code,bubbles:true,cancelable:true,...opts}));
  for(const route of ['home','practice/keys','freestyle']){
   await goto(route);
   check(route+' has both registers',$$('[data-note]').length===25);
   for(const [i,k] of keys.entries()){
    dispatch('keydown',k,codeFor(k));const note=$('[data-note="'+(48+i)+'"]');
    check(route+' '+k+' plays '+(48+i),note.classList.contains('held')&&activeKeys.size===1);
    dispatch('keyup',k,codeFor(k));check('Releases '+k,!activeKeys.size&&!note.classList.contains('held'));
   }
   for(const k of ['q','e','t','z','s'])dispatch('keydown',k,codeFor(k));
   check(route+' low chord and high notes',[...activeKeys.values()].map(x=>x.note).join(',')==='48,52,55,60,63');
   dispatch('keydown','q','KeyQ',{repeat:true});check('No retrigger',activeKeys.size===5);
   for(const k of ['q','e','t','z','s'])dispatch('keyup',k,codeFor(k));
   dispatch('keydown',']','BracketRight');check('Raise registers',octave===1&&!!$('[data-note="84"]'));
   dispatch('keydown','[','BracketLeft');check('Lower registers',octave===0&&!!$('[data-note="48"]'));
  }
  dispatch('keydown','2','Digit2');check('Plain digit only plays piano',$('[data-note="49"]').classList.contains('held')&&!$('[data-hit="snare"]').classList.contains('struck'));dispatch('keyup','2','Digit2');
  dispatch('keydown','@','Digit2',{shiftKey:true});check('Shift + 2 triggers only drum',$('[data-hit="snare"]').classList.contains('struck')&&!activeKeys.size);dispatch('keyup','2','Digit2');
  dispatch('keydown','9','Numpad9');check('Keypad 9 triggers ride',$('[data-hit="ride"]').classList.contains('struck')&&!activeKeys.size);
  dispatch('keydown','q','KeyQ',{metaKey:true});check('Command shortcut passes through',!activeKeys.size);
  dispatch('keydown','q','KeyQ');window.dispatchEvent(new Event('blur'));check('Blur releases held keys',!activeKeys.size);
  check('Mobile keyboard stays within viewport',document.documentElement.scrollWidth<=window.innerWidth+2);
  await goto('practice/beat');
  for(const factor of [.5,1,2,4]){choose('[data-grid-size]',String(factor));check('4/4 length '+factor,$$('[data-row="0"]').length===16*factor);}
  const cell=$('[data-row="0"][data-col="63"]');const orig=cell.getAttribute('aria-pressed');cell.click();
  choose('[data-grid-size]','1');choose('[data-grid-size]','4');check('Hidden steps retained',$('[data-row="0"][data-col="63"]').getAttribute('aria-pressed')!==orig);
  const before=snapshot();choose('[data-family]','Indonesian grooves');choose('[data-template]','koplo');action('[data-preview]');check('Audition without replacing beat',StudioAudio.current==='preview'&&bpm===before.bpm&&grooveName===before.grooveName);action('[data-preview]');
  action('[data-load]');check('Two-bar koplo',bpm===148&&getSteps()===32&&beat[5][28]===1);action('[data-undo-load]');check('Undo restores duration and edits',getSteps()===64&&JSON.stringify(beat)===JSON.stringify(before.beat));
  const distinct=new Set();
  for(const t of beatsLibrary){
   const rows=patternFrom(t),m=meters[t.meter],len=m.beats*m.div;
   check(t.name+' rows valid',rows.length===9&&rows.every(r=>r.length===4*len)&&rows.some(r=>r.some(Boolean)));
   for(const parts of [t.parts,t.next||{}])for(const [id,p]of Object.entries(parts))check(t.id+' valid '+id,kit.some(k=>k[0]===id)&&p.every(k=>Number.isInteger(k)&&k>=0&&k<len));
   const bytes=makeBeatMidi(rows,t.meter,t.bpm,t.swing,len*(t.next?2:1),1,t.name);check(t.id+' MIDI header',bytes[0]===77&&bytes[3]===100&&bytes.length>60);
   distinct.add(JSON.stringify(rows));
  }
  check('Distinct template patterns',distinct.size===beatsLibrary.length);
  choose('[data-family]','Jazz, folk & blues');choose('[data-template]','folk');action('[data-load]');check('Compound meter',meterName==='6/8'&&getSteps()===12&&bpm===76);
  choose('[data-family]','Club & electronic');choose('[data-template]','house');action('[data-load]');check('House in four',getSteps()===16&&bpm===124);
  await goto('freestyle');choose('[data-live-sound]','organ');action('[data-scene="Lift"]');check('Scene sets layers',mix.layers.every(Boolean));action('[data-layer="2"]');check('Channel mute',!mix.layers[2]);
  const f=$('[data-mix="blend"]');f.value='76';f.dispatchEvent(new Event('input',{bubbles:true}));check('Crossfader stored',mix.blend===76);
  choose('[data-progression="0"]','Dm');check('Custom chord progression',mix.chords[0]==='Dm');
  action('[data-deck-play]');await delay(220);check('Master transport',StudioAudio.current==='freestyle');action('[data-deck-play]');
  action('[data-record]');await delay(350);
  document.dispatchEvent(evt('keydown','a','KeyA'));await delay(400);document.dispatchEvent(evt('keyup','a','KeyA'));
  dispatch('keydown','#','Digit3',{shiftKey:true});const rendered=await StudioAudio.context.startRendering();await delay(100);action('[data-record]');
  const take=MusicEngine.take;check('Record and finish',!MusicEngine.recording&&StudioAudio.current===null);
  check('Captured audio PCM ('+StudioAudio.context.state+')',take?.seconds>.25);
  const raw=await take.blob.arrayBuffer(),v=new DataView(raw);let peak=0;for(let i=44;i<raw.byteLength;i+=2)peak=Math.max(peak,Math.abs(v.getInt16(i,true)));
  check('Audible WAV with correct length',peak>50&&v.getUint32(40,true)===raw.byteLength-44&&$('#last-take audio'));
  await goto('project');const note=$('#song-note');note.dispatchEvent(evt('keydown','a','KeyA'));check('Notebook can type',activeKeys.size===0);
  await goto('freestyle');check('Take survives navigation',!!$('#last-take audio'));
  check('Viewport fits',document.documentElement.scrollWidth<=window.innerWidth+2);check('No runtime errors',errors.length===0);
  window.qaResult=`PASS ${passed.length} checks, ${beatsLibrary.length} templates, WAV ${take.seconds.toFixed(2)}s peak ${peak}, viewport ${window.innerWidth}`;
 }catch(e){window.qaResult=`FAIL ${passed.length} checks; ${e.message}; errors ${errors.join('/')}; ctx ${StudioAudio.context?.state}`;}
})()
