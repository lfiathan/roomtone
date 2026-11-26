(async function checkFreestyle(){
 // Proves the deck channels are playable parts rather than mute buttons:
 // each style has to place different notes, and the controls have to drive it.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(130);};

 // One 4/4 bar at sixteenth resolution, the grid the deck loop runs on.
 const DIV=4,BAR=16,BEATS=4;
 const bassOnsets=id=>{const out=[];for(let i=0;i<BAR;i++){
   const hit=bassStyles[id].at(Math.floor(i/DIV),i%DIV,DIV,i,BAR);if(hit)out.push(i+':'+hit.i);}return out.join(',');};
 const chordOnsets=id=>{const out=[];for(let i=0;i<BAR;i++){
   if(chordStyles[id].at(Math.floor(i/DIV),i%DIV,DIV,i))out.push(i);}return out.join(',');};
 const arpNotes=(id,rate)=>{const span=Math.max(1,Math.round(DIV/rate)),order=arpStyles[id].order,out=[];
   for(let i=0;i<BAR;i+=span)out.push(order[Math.floor(i/span)%order.length]);return out.join(',');};

 try{
  await goto('freestyle');

  // --- the controls exist -----------------------------------------------
  check('three part selectors',$$('[data-style]').length===3);
  check('four density sliders',$$('[data-density]').length===4);
  check('an arpeggio rate selector',$$('[data-arp-rate]').length===1);
  check('a transpose control',!!$('[data-mix="transpose"]'));

  // --- every style is musically distinct --------------------------------
  const bassIds=Object.keys(bassStyles),bassSigs=bassIds.map(bassOnsets);
  check('five bass parts',bassIds.length===5);
  check('each bass part places different notes',new Set(bassSigs).size===bassIds.length);
  check('roots keeps the original figure',bassOnsets('roots')==='0:0,8:0,14:7');
  check('driving eighths is busier than roots',
    bassOnsets('driving').split(',').length>bassOnsets('roots').split(',').length);

  const chordIds=Object.keys(chordStyles),chordSigs=chordIds.map(chordOnsets);
  check('four chord parts',chordIds.length===4);
  check('each chord part places different notes',new Set(chordSigs).size===chordIds.length);
  check('pad still hits once a bar',chordOnsets('pad')==='0');
  check('skank lands off the beat',chordOnsets('skank')==='2,6,10,14');

  const arpIds=Object.keys(arpStyles);
  check('five arpeggio shapes',arpIds.length===5);
  check('each arpeggio shape differs',new Set(arpIds.map(id=>arpNotes(id,2))).size===arpIds.length);
  check('rate changes the note count',
    arpNotes('up',1).split(',').length===4&&arpNotes('up',2).split(',').length===8&&arpNotes('up',4).split(',').length===16);
  check('default arp matches the original figure',arpNotes('updown',2)==='0,1,2,1,0,1,2,1');

  // --- density thins, deterministically ---------------------------------
  mix.density[1]=100;check('full density keeps every note',[...Array(64).keys()].every(s=>thins(1,s)));
  mix.density[1]=20;
  const thin=[...Array(64).keys()].filter(s=>thins(1,s)).join(',');
  check('low density drops notes',thin.split(',').length<64);
  check('density repeats the same way each loop',[...Array(64).keys()].filter(s=>thins(1,s)).join(',')===thin);
  mix.density[1]=100;
  mix.density[0]=20;
  check('thinning never drops the kick or snare',
    [...Array(64).keys()].every(s=>keepHit('kick',0,s)&&keepHit('snare',1,s)));
  check('thinning does reach the hats',[...Array(64).keys()].some(s=>!keepHit('hat',2,s)));
  mix.density[0]=100;

  // --- the UI drives the state ------------------------------------------
  const pick=(sel,value)=>{const el=$(sel);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  pick('[data-style="bass"]','walking');check('choosing a bass part updates the mix',mix.styles.bass==='walking');
  pick('[data-style="chords"]','stabs');check('choosing a chord part updates the mix',mix.styles.chords==='stabs');
  pick('[data-arp-rate]','4');check('choosing a rate updates the mix',mix.arpRate===4);

  const slide=(sel,value)=>{const el=$(sel);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
  slide('[data-density="3"]','45');check('a density slider updates the mix',mix.density[3]===45);
  check('the density label follows',$('[data-density-label="3"]').textContent==='Density 45%');
  slide('[data-mix="transpose"]','-5');
  check('transpose updates the mix',mix.transpose===-5);
  check('the transpose readout follows',$('#transpose-read').textContent==='-5 st');

  // --- scenes recall a whole arrangement, not just on/off ---------------
  $('[data-scene="Lift"]').click();
  check('Lift turns on every layer',mix.layers.every(Boolean));
  check('Lift recalls its bass part',mix.styles.bass==='driving');
  check('Lift recalls its chord part',mix.styles.chords==='pulse');
  check('Lift recalls its arp rate',mix.arpRate===4);
  check('the selectors redraw with the scene',$('[data-style="bass"]').value==='driving'&&$('[data-arp-rate]').value==='4');
  check('Lift reads as the active scene',$('[data-scene="Lift"]').getAttribute('aria-pressed')==='true');

  $('[data-scene="Break"]').click();
  check('Break drops the rhythm section',!mix.layers[0]&&!mix.layers[1]);
  check('Break recalls its own density',mix.density[2]===70);
  check('the density label redrew',$('[data-density-label="2"]').textContent==='Density 70%');
  check('Lift is no longer the active scene',$('[data-scene="Lift"]').getAttribute('aria-pressed')==='false');

  // Editing a part by hand has to leave the scene no longer matching.
  pick('[data-style="bass"]','octaves');
  check('an edited part clears the scene light',$('[data-scene="Break"]').getAttribute('aria-pressed')==='false');

  // --- state survives a reload ------------------------------------------
  $('[data-scene="Groove"]').click();
  await goto('home');await goto('freestyle');
  check('the part selection survives navigation',$('[data-style="chords"]').value===mix.styles.chords);
  check('the stored mix round-trips',JSON.parse(localStorage.getItem('roomtone.v1.freestyle')).styles.bass==='roots');

  // --- the decks still run ----------------------------------------------
  $('[data-deck-play]').click();await delay(160);
  check('the decks start',StudioAudio.current==='freestyle');
  $('[data-deck-play]').click();await delay(60);
  check('the decks stop',StudioAudio.current!=='freestyle');

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' freestyle checks, '
   +Object.keys(bassStyles).length+' bass / '+Object.keys(chordStyles).length+' chord / '
   +Object.keys(arpStyles).length+' arp parts';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
