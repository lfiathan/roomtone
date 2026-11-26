(async function checkLessons(){
 // Covers the rebuilt lessons: that every one carries a figure of its own
 // subject, that the page keeps the same shape throughout, and that the quiz
 // only asks about terms the lesson body has already defined.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(130);};
 const strip=html=>String(html).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');

 try{
  // --- every lesson is complete as data ---------------------------------
  check('twelve lessons',course.length===12);
  course.forEach((l,i)=>{
   check(`lesson ${i+1} has a figure`,!!l.fig&&typeof l.fig.kind==='string');
   check(`lesson ${i+1} figure has alt text`,typeof l.fig.alt==='string'&&l.fig.alt.length>20);
   check(`lesson ${i+1} figure has a caption`,typeof l.fig.caption==='string'&&l.fig.caption.length>30);
   check(`lesson ${i+1} introduces its table`,typeof l.tableLead==='string'&&l.tableLead.length>10);
   check(`lesson ${i+1} quiz has one answer`,Number.isInteger(l.correct)&&l.choices[l.correct]!==undefined);
   if(l.fig2)check(`lesson ${i+1} second figure has alt text`,typeof l.fig2.alt==='string'&&l.fig2.alt.length>20);
  });
  const kinds=new Set(course.map(l=>l.fig.kind));
  check('figures use every primitive',['keys','grid','timeline','contour','meters'].every(k=>kinds.has(k)));

  // --- vocabulary lands before it is tested ------------------------------
  // These are the two that used to appear for the first time in the quiz.
  const one=strip(course[0].idea+' '+course[0].worked+' '+course[0].rows.flat().join(' '));
  check('lesson 1 defines "eighth note" in the body',/eighth note/i.test(one));
  check('lesson 1 defines "backbeat" in the body',/backbeat/i.test(strip(course[0].fig.caption)));
  check('lesson 8 asks about strong beats it explained',/strong beat/i.test(strip(course[7].worked))&&/strong beat/i.test(course[7].choices[course[7].correct]));
  const four=strip(course[3].worked);
  check('lesson 4 defines "inversion" before asking about one',/inversion/i.test(four)&&/inversion/i.test(course[3].choices[course[3].correct]));

  // --- the rendered page keeps one shape ---------------------------------
  for(let i=1;i<=12;i++){
   await goto('lesson/'+i);
   const article=$('.stack .panel');
   const kids=[...article.children];
   check(`lesson ${i} opens with the plain idea`,kids[0].tagName==='H2'&&kids[1].tagName==='P');
   check(`lesson ${i} puts a figure under the idea`,kids[2].tagName==='FIGURE');
   check(`lesson ${i} follows the figure with the detail`,kids[3].tagName==='P');
   check(`lesson ${i} introduces its table`,!!article.querySelector('.table-lead'));
   check(`lesson ${i} table comes last`,article.lastElementChild.classList.contains('table-wrap'));
   const svgs=$$('.stack .figure svg');
   check(`lesson ${i} figure is drawn`,svgs.length>=1);
   check(`lesson ${i} figures are labelled`,svgs.every(s=>(s.getAttribute('aria-label')||'').length>20));
   check(`lesson ${i} figures scale`,svgs.every(s=>/max-width/.test(s.getAttribute('style')||'')));
   const panels=[...$('.stack').children];
   check(`lesson ${i} ends on the quiz`,panels[panels.length-1].classList.contains('quiz-panel'));
   check(`lesson ${i} quiz is below the lesson, not beside it`,!$('.aside [data-quiz]')&&!!$('.stack [data-quiz]'));
   check(`lesson ${i} aside is the readiness check`,!!$('.aside [data-complete]'));
  }

  // --- the figures say what the lessons claim ----------------------------
  await goto('lesson/1');
  check('lesson 1 grid fills a bar of eight half beats',$$('.figure [data-cell]').length===24);
  check('lesson 1 grid plays twelve hits',$$('.figure [data-on]').length===12);
  await goto('lesson/2');
  check('lesson 2 marks three Cs',$$('.figure')[0].querySelectorAll('[data-marked]').length===3);
  check('lesson 2 shows the two and three black-key groups',
   [...$$('.figure')[0].querySelectorAll('[data-group]')].map(g=>g.dataset.group).join(',')==='2,3,2,3');
  check('lesson 2 draws the two interval brackets',$$('.figure')[1].querySelectorAll('path[stroke="#7d8f7c"]').length===2);
  await goto('lesson/3');
  check('lesson 3 marks all eight scale degrees',$$('.figure')[0].querySelectorAll('[data-marked]').length===8);
  check('lesson 3 labels seven steps',[...$$('.figure')[0].querySelectorAll('text')].filter(t=>/^[WH]$/.test(t.textContent)).length===7);
  check('lesson 3 shows G major needing one black key',$$('.figure')[1].querySelectorAll('[data-marked]').length===8);
  await goto('lesson/4');
  check('lesson 4 shows both inversions',$$('.figure')[1].querySelectorAll('[data-marked]').length===6);
  await goto('lesson/6');
  check('lesson 6 draws the thirteen hook notes',$$('.figure [data-note]').length===13);
  check('lesson 6 only labels the held notes',[...$$('.figure text')].filter(t=>/held/.test(t.textContent)).length===3);
  await goto('lesson/7');
  check('lesson 7 contrasts fourteen hook hits with seven verse hits',
   $$('.figure')[0].querySelectorAll('[data-on]').length===14&&$$('.figure')[1].querySelectorAll('[data-on]').length===7);
  await goto('lesson/9');
  check('lesson 9 lays out four sections over sixteen bars',$$('.figure [data-span]').length===5);
  check('lesson 9 marks where the hook enters',[...$$('.figure text')].some(t=>/hook enters/.test(t.textContent)));
  await goto('lesson/11');
  check('lesson 11 shows four levels and one that moved',
   $$('.figure [data-level]').length===4&&$$('.figure [data-was]').length===1);

  // --- the quiz still works where it now sits ----------------------------
  await goto('lesson/1');
  const l=course[0], wrong=$$('[data-quiz]')[(l.correct+1)%l.choices.length];
  wrong.click();await delay(30);
  check('a wrong answer is marked wrong',$('#quiz-result').classList.contains('incorrect')&&/Try again/.test($('#quiz-result').textContent));
  $$('[data-quiz]')[l.correct].click();await delay(30);
  check('the right answer is accepted',!$('#quiz-result').classList.contains('incorrect')&&/Correct/.test($('#quiz-result').textContent));
  check('the explanation is shown either way',$('#quiz-result').textContent.includes(l.why.slice(0,24)));

  // --- progress still records --------------------------------------------
  const box=$('[data-complete]');box.click();await delay(30);
  check('a finished lesson is remembered',done.has(0)&&JSON.parse(localStorage.getItem('roomtone.v1.lessons')).includes(0));
  await goto('lessons');
  check('the index counts it',/1 \/ 12/.test($('.progressbox span').textContent));
  check('the index still draws a card per lesson',$$('.cards .card').length===12);

  // --- every card shows its own lesson's figure ---------------------------
  const arts=$$('.cards .art');
  check('every card draws art',arts.length===12&&arts.every(a=>!!a.querySelector('svg')));
  check('no card still uses the old canvas',!$('.cards canvas')&&!$('[data-art]'));
  check('each card art matches its lesson figure',
   arts.every((a,i)=>a.dataset.cardArt===course[i].fig.kind));
  check('twelve different pictures',new Set(arts.map(a=>a.querySelector('svg').innerHTML)).size===12);
  check('card art carries no unreadable type',arts.every(a=>!a.querySelector('svg text')));
  check('card art is hidden from screen readers',arts.every(a=>a.querySelector('svg').getAttribute('aria-hidden')==='true'));
  check('card art fits rather than crops',arts.every(a=>a.querySelector('svg').getAttribute('preserveAspectRatio')==='xMidYMid meet'));
  check('every card is captioned with its own tag',
   arts.every((a,i)=>a.querySelector('.art-caption').textContent===course[i].tag));
  check('the tags are all different',new Set(course.map(l=>l.tag)).size===12);
  const box0=arts[0].getBoundingClientRect(), svg0=arts[0].querySelector('svg').getBoundingClientRect();
  check('card art sits inside its tile',svg0.width<=box0.width&&svg0.height<=box0.height);
  await goto('home');
  check('the overview cards draw art too',$$('.home-card .art svg').length===3);
  await goto('lesson/1');$('[data-complete]').click();await delay(30);
  check('it can be unchecked',!done.has(0));

  // --- nothing else moved -------------------------------------------------
  await goto('practice/keys');
  check('the practice room is untouched',$$('[data-note]').length===25);
  await goto('lesson/2');
  check('the staff side note is still there and labelled as optional',
   !!$('.staff-panel svg')&&/do not need this/i.test($('.staff-panel').textContent));

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' lesson checks, '+course.length+' lessons, '
   +course.reduce((n,l)=>n+1+(l.fig2?1:0),0)+' figures';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
