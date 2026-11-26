(()=>{
 const results=[], errors=[];
 window.addEventListener('error',e=>errors.push(e.message));
 const check=(name,ok)=>{if(!ok)throw Error(name);results.push(name);};
 const page=(p)=>{location.hash=p;render(false);};
 const click=s=>{const el=document.querySelector(s);if(!el)throw Error('Missing '+s);el.click();};
 try{
  check('Home keys',document.querySelectorAll('[data-note]').length>=20);
  click('[data-chord="C"]');check('Chord pad readout',document.querySelector('#synth-readout').textContent==='C');
  click('[data-song]');check('Song starts',StudioAudio.current==='song');click('[data-song]');check('Song stops',StudioAudio.current===null);
  page('lessons');check('All 12 lessons linked',document.querySelectorAll('.card').length===12);
  for(let i=0;i<course.length;i++){
   page('lesson/'+(i+1));check('Lesson '+(i+1),document.querySelector('h1').textContent===course[i].title);
   click('[data-quiz="'+course[i].correct+'"]');check('Quiz '+(i+1),document.querySelector('#quiz-result').textContent.startsWith('Correct.'));
  }
  page('lesson/2');check('Staff diagram',!!document.querySelector('.staff-panel svg'));click('[data-complete]');check('Completion toggles',done.has(1));click('[data-complete]');
  page('practice/beat');click('[data-pattern="empty"]');check('Empty grid',document.querySelectorAll('.step[aria-pressed="true"]').length===0);click('[data-row="0"][data-col="3"]');check('Grid toggle',beat[0][3]===1);click('[data-pattern="base"]');
  click('[data-grid-play]');check('Grid plays',StudioAudio.current==='grid');click('[data-grid-play]');check('Grid stops',StudioAudio.current===null);
  page('practice/keys');const sel=document.querySelector('[data-scale]');sel.value='G major';sel.dispatchEvent(new Event('change',{bubbles:true}));check('Changes scale',document.querySelector('.chart').textContent.includes('F♯5'));
  click('[data-triad="0,3,7"]');check('Minor triad note display',document.querySelector('#key-feedback').textContent.includes('E♭4'));
  page('practice/ear');click('[data-ear-new]');check('Ear pair generated',ear&&ear.n>0);click('[data-interval="'+ear.n+'"]');check('Ear answer',document.querySelector('#ear-feedback').textContent.startsWith('Correct.'));click('[data-ear-repeat]');
  page('garageband');click('[data-device="Touch"]');check('Touch guide',document.querySelector('.guide-step').textContent.includes('Song Sections'));click('[data-device="Mac"]');check('Mac guide',document.querySelector('.guide-step').textContent.includes('Empty Project'));
  page('project');const n=document.querySelector('#song-note');n.value='Train at dusk';n.dispatchEvent(new Event('input',{bubbles:true}));check('Notebook',notebook==='Train at dusk');click('[data-plan="0"]');check('Song checklist',plan.has(0));click('[data-plan="0"]');
  check('Embedded MIDI',document.querySelector('[download]').href.startsWith('data:audio/midi;base64,TVRoZA'));page('reference');check('Embedded PDF',document.querySelector('[download]').href.startsWith('data:application/pdf;base64,JVBER'));
  for(const slug of ['home','lessons','lesson/1','lesson/2','lesson/5','practice/beat','practice/keys','practice/ear','garageband','reference','project','sources']){
    page(slug);check('Fits viewport '+slug,document.documentElement.scrollWidth<=window.innerWidth+2);
  }
  page('home');return JSON.stringify({pass:results.length,errors:errors,width:window.innerWidth});
 }catch(e){return JSON.stringify({pass:results.length,failed:e.message,last:results.slice(-3),errors:errors});}
})()
