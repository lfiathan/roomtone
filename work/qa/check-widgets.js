(async function checkWidgets(){
 // Exercises all nine widget kinds the way a reader would: press the keys,
 // toggle the cells, drag the sliders, start and stop the transport. A widget
 // that renders but does nothing is the failure mode this suite exists for.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*4,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim+' — last message: '+say());passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(110);};
 // Lesson 1 carries three widgets, so a page-wide '[data-w-say]' lookup would
 // read the wrong one. Each section points `focus` at the widget it exercises,
 // and re-points it after a redraw replaces the element.
 let focus=null;
 const look=el=>{focus=el;return el;};
 const say=()=>((focus||document).querySelector('[data-w-say]')||{}).textContent||'';
 const sayIn=el=>(el.querySelector('[data-w-say]')||{}).textContent||'';
 const kind=k=>$('.widget[data-wkind='+k+']');
 const kinds=k=>$$('.widget[data-wkind='+k+']');
 const press=n=>$$('.widget [data-wkey]').find(b=>+b.dataset.wkey===n).click();
 const set=(el,v,ev)=>{el.value=String(v);el.dispatchEvent(new Event(ev,{bubbles:true}));};

 try{
  // --- every widget kind is actually used by the course -------------------
  const used=new Set(course.flatMap(l=>l.widgets.map(w=>w.kind)));
  check('the course uses all nine widget kinds',
   ['keys','steps','tempo','chords','contour','arrange','mix','compare','tap'].every(k=>used.has(k)));
  check('every lesson carries at least one widget',course.every(l=>l.widgets.length>=1));
  check('every widget is titled and hinted',
   course.every(l=>l.widgets.every(w=>w.title&&w.title.length>8&&w.hint&&w.hint.length>20)));

  // --- keys · naming a note ----------------------------------------------
  await goto('lesson/4');
  look(kind('keys'));
  press(60);await delay(30);
  check('pressing a key names it and gives the landmark',/C4/.test(say())&&/two black keys/.test(say()));
  press(61);await delay(30);
  check('a black key is reported as a black key',/C♯/.test(say())&&/black key/.test(say()));

  // --- keys · measuring an interval --------------------------------------
  await goto('lesson/5');
  look(kind('keys'));
  press(60);await delay(25);
  check('the interval widget asks for a second key',/second key/.test(say()));
  press(64);await delay(25);
  check('it reports four semitones and names the major third',/4 semitones/.test(say())&&/major third/.test(say()));
  look(kind('keys')).querySelector('[data-wclear]').click();await delay(25);
  check('start over empties the selection',/press one key/i.test(say()));
  press(67);press(60);await delay(25);
  check('the lower note is reported first whichever order you press',
   /C4 up to G4/.test(say())&&/perfect fifth/.test(say()));

  // --- compare -----------------------------------------------------------
  look(kinds('compare')[0]).querySelectorAll('[data-wab]')[2].click();await delay(30);
  check('a comparison button plays and explains its item',/[Mm]inor third/.test(say()));
  check('only the chosen item reads as pressed',
   kinds('compare')[0].querySelectorAll('[data-wab][aria-pressed=true]').length===1);

  // --- keys · scales ------------------------------------------------------
  await goto('lesson/6');
  look(kind('keys'));
  // The scale widget spans two octaves so you can watch the pattern recur,
  // which makes distinct pitch classes the meaningful count, not lit keys.
  const pcsLit=sel=>new Set($$('.widget[data-wkind=keys] '+sel+'[aria-pressed=true]').map(b=>pc(+b.dataset.wkey)));
  check('C major lights seven different notes',pcsLit('[data-wkey]').size===7);
  check('the scale repeats across both octaves',$$('.widget[data-wkind=keys] [data-wkey][aria-pressed=true]').length>8);
  check('C major needs no black keys',pcsLit('.blackkey').size===0);
  check('the root is tinted apart from the rest',$$('.widget[data-wkind=keys] .lit-root').length>=2);
  check('the step strip spells out W W H W W W H',
   $('.widget .w-strip').textContent.replace(/[^WH]/g,'')==='WWHWWWH');
  set($('.widget select[data-wsel=key]'),7,'change');await delay(40);
  look(kind('keys'));
  check('moving to G still lights seven different notes',pcsLit('[data-wkey]').size===7);
  check('G major needs exactly one black note',pcsLit('.blackkey').size===1);
  check('and that black note is F♯',[...pcsLit('.blackkey')][0]===6);
  set($('.widget select[data-wsel=scale]'),'natural minor','change');await delay(40);
  look(kind('keys'));
  check('minor is seven different notes too',pcsLit('[data-wkey]').size===7);
  check('G natural minor needs two black notes, B♭ and E♭',
   [...pcsLit('.blackkey')].sort((a,b)=>a-b).join()==='3,10');

  // --- keys · chords and inversions --------------------------------------
  await goto('lesson/8');
  look(kind('keys'));
  check('a triad lights three keys',$$('.widget[data-wkind=keys] [data-wkey][aria-pressed=true]').length===3);
  check('each key is tinted by its job in the stack',
   !!$('.widget .lit-root')&&!!$('.widget .lit-third')&&!!$('.widget .lit-fifth'));
  $$('.widget [data-wpill=inv]')[1].click();await delay(40);
  look(kind('keys'));
  check('the first inversion names itself',/1st inversion/.test(say()));
  check('an inversion is still three notes',$$('.widget[data-wkind=keys] [data-wkey][aria-pressed=true]').length===3);
  check('an inversion keeps the chord name',/C major/.test(say()));
  check('the third stays tinted as the third after inverting',!!$('.widget .lit-third'));
  set($('.widget select[data-wsel=quality]'),'minor','change');await delay(40);
  look(kind('keys'));
  check('changing quality returns to root position',/C minor/.test(say())&&!/inversion/.test(say()));
  set($('.widget select[data-wsel=root]'),65,'change');await delay(40);
  look(kind('keys'));
  check('the root selector moves the chord',/F minor/.test(say()));

  // --- steps -------------------------------------------------------------
  await goto('lesson/1');
  const grid=look(kind('steps')), lit=grid.querySelectorAll('[data-wstep][aria-pressed=true]').length;
  grid.querySelector('[data-wstep="2,2"]').click();await delay(25);
  check('clicking a cell switches a hit on',
   grid.querySelectorAll('[data-wstep][aria-pressed=true]').length===lit+1&&/Kick on at count/.test(say()));
  grid.querySelector('[data-wstep="2,2"]').click();await delay(25);
  check('clicking it again switches it off',grid.querySelectorAll('[data-wstep][aria-pressed=true]').length===lit);
  grid.querySelector('[data-wplay]').click();await delay(130);
  check('play starts this widget’s own transport',String(StudioAudio.current).startsWith('w:'));
  check('the playhead lights a column',grid.querySelectorAll('.now').length>0);
  check('the button now offers to stop',/Stop/.test(grid.querySelector('[data-wplay]').textContent));
  grid.querySelector('[data-wplay]').click();await delay(40);
  check('pressing it again stops',!StudioAudio.current);
  set(grid.querySelector('[data-wrange=tempo]'),132,'input');await delay(30);
  check('the tempo read-out follows the slider',grid.querySelector('.w-read output').textContent==='132');
  look(kind('steps')).querySelector('[data-wclear]').click();await delay(30);
  check('clear empties the grid',!kind('steps').querySelector('[data-wstep][aria-pressed=true]'));

  // --- tap ---------------------------------------------------------------
  const tap=look(kind('tap'));
  check('the tap pad is disabled until the click runs',tap.querySelector('[data-wtap]').disabled);
  tap.querySelector('[data-wplay]').click();await delay(130);
  look(kind('tap'));
  check('starting the click enables the pad',!kind('tap').querySelector('[data-wtap]').disabled);
  look(kind('tap')).querySelector('[data-wtap]').click();await delay(30);
  look(kind('tap'));
  check('a tap is counted and measured',/1 tap/.test(kind('tap').textContent)&&/ms/.test(kind('tap').textContent));
  check('the tap is plotted on the strip',kind('tap').querySelectorAll('.w-scatter i').length===1);
  kind('tap').querySelector('[data-wplay]').click();await delay(40);
  check('stopping the click disables the pad again',kind('tap').querySelector('[data-wtap]').disabled);

  // --- tempo -------------------------------------------------------------
  await goto('lesson/3');
  look(kind('tempo'));
  check('the tempo widget shows the division it describes',
   /60 ÷ 96/.test(kind('tempo').textContent)&&/0\.625/.test(kind('tempo').textContent));
  check('a bar of four is four beats wide',kind('tempo').querySelectorAll('.w-beats i').length===4);
  kind('tempo').querySelector('[data-wpill=beats][data-wval="3"]').click();await delay(40);
  look(kind('tempo'));
  check('switching metre redraws the bar in three',kind('tempo').querySelectorAll('.w-beats i').length===3);
  set(kind('tempo').querySelector('[data-wrange=tempo]'),120,'input');await delay(40);
  check('the arithmetic follows the tempo',/0\.500/.test(kind('tempo').textContent));

  // --- chords ------------------------------------------------------------
  await goto('lesson/10');
  look(kind('chords'));
  check('four slots show I V vi IV',
   $$('.widget[data-wkind=chords] .w-slot b').map(b=>b.textContent).join('-')==='I-V-vi-IV');
  set($('.widget select[data-wsel=slot3]'),0,'change');await delay(40);
  look(kind('chords'));
  check('ending on I is reported as a full close',/full close/.test(say()));
  check('the numerals update with the slot',
   $$('.widget[data-wkind=chords] .w-slot b').map(b=>b.textContent).join('-')==='I-V-vi-I');
  set($('.widget select[data-wsel=slot3]'),4,'change');await delay(40);
  look(kind('chords'));
  check('ending on V is reported as leaving the phrase open',/hanging|half cadence/.test(say()));

  // --- contour -----------------------------------------------------------
  await goto('lesson/11');
  look(kind('contour'));
  check('the melody grid starts with the example phrase',
   kind('contour').querySelectorAll('[data-wcell][aria-pressed=true]').length===8);
  look(kind('contour')).querySelector('[data-wclear]').click();await delay(40);
  look(kind('contour'));
  check('clear empties the melody',!kind('contour').querySelector('[data-wcell][aria-pressed=true]'));
  kind('contour').querySelector('[data-wcell="0,7"]').click();await delay(40);
  look(kind('contour'));
  check('clicking a square places one note',/1 note placed/.test(say()));
  kind('contour').querySelector('[data-wcell="1,0"]').click();await delay(40);
  look(kind('contour'));
  check('the widget measures the range it now spans',/8 scale degrees/.test(say()));
  kind('contour').querySelector('[data-wcell="1,0"]').click();await delay(40);
  check('clicking a filled square rubs it out',
   kind('contour').querySelectorAll('[data-wcell][aria-pressed=true]').length===1);

  // --- arrange -----------------------------------------------------------
  await goto('lesson/15');
  look(kind('arrange'));
  check('the arrangement is four layers by four sections',
   kind('arrange').querySelectorAll('[data-wtoggle]').length===16);
  kind('arrange').querySelector('[data-wtoggle="0,0"]').click();await delay(40);
  look(kind('arrange'));
  check('a toggle reports what that section now plays',/Intro/.test(say()));
  kind('arrange').querySelector('[data-wplay]').click();await delay(150);
  check('the arrangement plays',String(StudioAudio.current).startsWith('w:'));
  check('the playing section is highlighted',kind('arrange').querySelectorAll('.now').length>0);
  StudioAudio.stop();await delay(40);

  // --- mix ---------------------------------------------------------------
  await goto('lesson/18');
  look(kind('mix'));
  check('the mixer has a fader and a pan per track',
   kind('mix').querySelectorAll('[data-wrange^=level]').length===4&&kind('mix').querySelectorAll('[data-wrange^=pan]').length===4);
  kind('mix').querySelector('[data-wplay]').click();await delay(150);
  check('the mix plays',String(StudioAudio.current).startsWith('w:'));
  set(kind('mix').querySelector('[data-wrange=level2]'),0,'input');await delay(40);
  check('a fader at zero is reported as muted',/Muted/.test(say()));
  set(kind('mix').querySelector('[data-wrange=pan3]'),-80,'input');await delay(40);
  check('panning reports which side',/to the left/.test(say()));
  StudioAudio.stop();await delay(40);
  kind('mix').querySelector('[data-wclear]').click();await delay(40);
  check('reset restores the starting mix',kind('mix').querySelector('[data-wrange=level2]').value==='54');

  // --- compare · rhythms and a reverb send -------------------------------
  await goto('lesson/17');
  look(kinds('compare')[0]);
  kinds('compare')[0].querySelectorAll('[data-wab]')[0].click();await delay(60);
  check('a comparison can play a rhythm rather than notes',/As played/.test(say()));
  kinds('compare')[0].querySelectorAll('[data-wab]')[2].click();await delay(60);
  check('the fully quantised version is offered too',/[Ff]ull strength/.test(say()));
  await goto('lesson/18');
  const space=look(kinds('compare')[1]);
  space.querySelectorAll('[data-wab]')[2].click();await delay(60);
  check('a comparison can route through the space send',/Far away/.test(sayIn(space)));

  // --- state is per render, not per page load ----------------------------
  await goto('lesson/1');
  focus=null;
  check('widget ids restart on every render',!!$('[data-w="w1"]'));
  const ids=$$('.widget').map(el=>el.dataset.w);
  check('two widgets on one page never share an id',new Set(ids).size===ids.length);
  await goto('home');
  check('leaving the page clears the widget registry',!$('.widget'));

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' widget checks across '
   +new Set(course.flatMap(l=>l.widgets.map(w=>w.kind))).size+' kinds, '
   +course.reduce((n,l)=>n+l.widgets.length,0)+' widgets in the course';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
