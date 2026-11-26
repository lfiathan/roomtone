(async function checkLessons(){
 // Covers the three-chapter course: that the chapters really are separated by
 // subject, that every lesson is a progression of numbered blocks rather than
 // two paragraphs, that each block's picture belongs to it, and that no term
 // is tested before the body has defined it.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(130);};
 const strip=html=>String(html).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
 const bodyOf=l=>strip([l.opens,...l.blocks.flatMap(b=>[b.h,...b.p,b.fig&&b.fig.caption,b.widget&&b.widget.hint]),
  l.tableLead,...l.rows.flat(),...l.recap].filter(Boolean).join(' '));
 const quizOf=l=>strip(l.question+' '+l.choices.join(' '));

 try{
  // --- the course is three chapters, in subject order ---------------------
  check('three chapters',chapters.length===3);
  check('the chapters are theory, writing and the studio',
   chapters.map(c=>c.name).join('|')==='Music theory|Writing a song|The studio');
  check('nineteen lessons',course.length===19);
  check('lessons are stored in chapter order',course.every((l,i)=>!i||l.chapter>=course[i-1].chapter));
  check('theory is the longest chapter',chapterLessons(0).length===11);
  check('chapter 2 and chapter 3 are present',chapterLessons(1).length===4&&chapterLessons(2).length===4);
  check('every lesson names a module its chapter declares',
   course.every(l=>chapters[l.chapter].modules.includes(l.module)));
  check('every declared module has at least one lesson',
   chapters.every((c,j)=>c.modules.every(m=>chapterLessons(j).some(([l])=>l.module===m))));
  check('modules do not interleave inside a chapter',
   chapters.every((c,j)=>{
    const seen=[];
    for(const [l] of chapterLessons(j))if(seen[seen.length-1]!==l.module)seen.push(l.module);
    return new Set(seen).size===seen.length;
   }));

  // --- every lesson is complete as data -----------------------------------
  course.forEach((l,i)=>{
   const n=i+1;
   check(`lesson ${n} promises what it gives you`,typeof l.opens==='string'&&l.opens.length>40);
   check(`lesson ${n} is at least four blocks`,Array.isArray(l.blocks)&&l.blocks.length>=4);
   check(`lesson ${n} blocks each have a heading and prose`,
    l.blocks.every(b=>b.h&&b.h.length>6&&Array.isArray(b.p)&&b.p.length>=1&&b.p.every(p=>p.length>60)));
   check(`lesson ${n} carries a figure`,l.figs.length>=1);
   check(`lesson ${n} figures are described for screen readers`,
    l.figs.every(f=>typeof f.alt==='string'&&f.alt.length>20));
   check(`lesson ${n} figures are captioned`,l.figs.every(f=>typeof f.caption==='string'&&f.caption.length>40));
   check(`lesson ${n} introduces its table`,typeof l.tableLead==='string'&&l.tableLead.length>10);
   check(`lesson ${n} recaps itself`,Array.isArray(l.recap)&&l.recap.length>=3);
   check(`lesson ${n} quiz has exactly one answer`,Number.isInteger(l.correct)&&l.choices[l.correct]!==undefined);
   check(`lesson ${n} sets a task and a readiness check`,l.steps.length>=3&&l.test.length>20);
  });
  const kinds=new Set(course.flatMap(l=>l.figs.map(f=>f.kind)));
  check('the figures use every drawing primitive',
   ['keys','grid','timeline','contour','meters'].every(k=>kinds.has(k)));

  // --- the lessons are substantially longer than the old ones -------------
  const words=course.reduce((n,l)=>n+bodyOf(l).split(' ').length,0);
  check('the course carries well over ten thousand words',words>10000);
  check('no lesson is thinner than four hundred words',course.every(l=>bodyOf(l).split(' ').length>400));

  // --- nothing is tested before it is explained ---------------------------
  // The original complaint: "eighth note" first appeared in lesson 1's quiz and
  // was only defined in the answer. This pins the general rule.
  // The two terms the old course got wrong: "eighth note" first appeared in
  // lesson 1's quiz, and "backbeat" was in the title but undefined until the
  // groove lesson. Both now land in the body of the lesson that uses them.
  check('“backbeat” is defined in lesson 1’s own body',/backbeat/i.test(bodyOf(course[0])));
  check('lesson 1 does not test eighth notes before lesson 2 teaches them',
   !/eighth note/i.test(quizOf(course[0]))&&/eighth note/i.test(bodyOf(course[1])));
  // The list of terms is taken from the course itself: anything the prose bolds
  // is a definition, so the rule generalises without a list to maintain.
  const boldIn=l=>[...l.blocks.flatMap(b=>[...b.p,b.fig&&b.fig.caption]).filter(Boolean).join(' ')
   .matchAll(/<b>([^<]+)<\/b>/g)].map(m=>strip(m[1]).toLowerCase().trim());
  const allTerms=[...new Set(course.flatMap(boldIn))].filter(t=>t.length>3);
  check('the course defines at least sixty terms in bold',allTerms.length>=60);
  const late=allTerms.filter(t=>{
   const rx=new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i');
   const body=course.findIndex(l=>rx.test(bodyOf(l)));
   const quiz=course.findIndex(l=>rx.test(quizOf(l)));
   return quiz>=0&&(body<0||body>quiz);
  });
  check('no bolded term is tested before the lesson that defines it — '+late.join(', '),!late.length);
  const twice=allTerms.filter(t=>course.filter(l=>boldIn(l).includes(t)).length>1);
  check('no term is introduced as new twice — '+twice.join(', '),!twice.length);

  // --- the index and the chapter pages ------------------------------------
  await goto('lessons');
  check('the index offers three chapters, not a flat list',
   $$('.chcard').length===3&&!$('.cards .card'));
  check('each chapter card lists its modules',
   $$('.chcard').every((c,j)=>c.querySelectorAll('.tag-chip').length===chapters[j].modules.length));
  check('each chapter card counts its own lessons',
   $$('.chcard').map(c=>c.querySelector('.chcard-foot span').textContent.trim()).join('|')==='0 / 11 done|0 / 4 done|0 / 4 done');
  for(let j=0;j<3;j++){
   await goto('chapter/'+(j+1));
   check(`chapter ${j+1} names itself`,$('h1').textContent===chapters[j].name);
   check(`chapter ${j+1} shows only its own lessons`,$$('.cards .card').length===chapterLessons(j).length);
   check(`chapter ${j+1} groups them under module headings`,
    $$('.chapter[data-module]').length===chapters[j].modules.length);
   check(`chapter ${j+1} offers a way in`,!!$('.chapter-bar .btn'));
  }

  // --- a lesson keeps one shape, all the way down -------------------------
  for(let i=1;i<=course.length;i++){
   await goto('lesson/'+i);
   const l=course[i-1];
   check(`lesson ${i} opens with the promise`,!!$('.lesson-opens'));
   const blocks=$$('.lesson-read .lblock');
   check(`lesson ${i} renders every block`,blocks.length===l.blocks.length);
   check(`lesson ${i} numbers its blocks in order`,
    blocks.map(b=>b.querySelector('.lblock-no').textContent).join()===l.blocks.map((_,n)=>num(n+1)).join());
   check(`lesson ${i} gives every block a heading`,blocks.every(b=>!!b.querySelector('h3')));
   check(`lesson ${i} puts each picture inside the block that describes it`,
    $$('.figure').every(f=>!!f.closest('.lblock')));
   check(`lesson ${i} puts each widget inside a block too`,
    $$('.widget').every(w=>!!w.closest('.lblock')));
   const panels=[...$('.stack').children];
   check(`lesson ${i} ends on the quiz`,panels[panels.length-1].classList.contains('quiz-panel'));
   check(`lesson ${i} recaps before the exercises`,
    panels.findIndex(p=>/In short/.test(p.textContent))<panels.findIndex(p=>/Try it yourself/.test(p.textContent)));
   check(`lesson ${i} keeps the quiz below the lesson, not beside it`,
    !$('.aside [data-quiz]')&&!!$('.stack [data-quiz]'));
   check(`lesson ${i} aside is the readiness check`,!!$('.aside [data-complete]'));
   check(`lesson ${i} shows where it sits in its chapter`,
    $$('.lesson-rail .rail-item').length===chapterLessons(l.chapter).length
    &&$('.rail-item.here a').textContent.includes(l.title));
   check(`lesson ${i} links back to its chapter`,!!$(`.bread a[href="#chapter/${l.chapter+1}"]`));
   const svgs=$$('.figure svg');
   check(`lesson ${i} draws its figures`,svgs.length===l.figs.length);
   check(`lesson ${i} figures are labelled`,svgs.every(s=>(s.getAttribute('aria-label')||'').length>20));
   check(`lesson ${i} figures scale`,svgs.every(s=>/max-width/.test(s.getAttribute('style')||'')));
   check(`lesson ${i} draws its widgets`,$$('.widget').length===l.widgets.length);
  }

  // --- the figures say what the lessons claim -----------------------------
  await goto('lesson/1');
  check('lesson 1 draws a bar of eight half beats across three lanes',$$('.figure [data-cell]').length===24);
  check('lesson 1 plays twelve hits',$$('.figure [data-on]').length===12);
  await goto('lesson/2');
  check('lesson 2 shows the same bar cut five ways',$$('.figure [data-cell]').length===80);
  await goto('lesson/4');
  check('lesson 4 marks three Cs',$$('.figure')[0].querySelectorAll('[data-marked]').length===3);
  check('lesson 4 shows the two and three black-key groups',
   [...$$('.figure')[0].querySelectorAll('[data-group]')].map(g=>g.dataset.group).join(',')==='2,3,2,3');
  check('lesson 4 labels all five black keys',$$('.figure')[1].querySelectorAll('[data-marked]').length===5);
  await goto('lesson/5');
  check('lesson 5 brackets the two intervals it compares',
   $$('.figure')[0].querySelectorAll('path[stroke="#7d8f7c"]').length===2);
  await goto('lesson/6');
  check('lesson 6 marks all eight scale degrees',$$('.figure')[0].querySelectorAll('[data-marked]').length===8);
  check('lesson 6 labels seven steps',
   [...$$('.figure')[0].querySelectorAll('text')].filter(t=>/^[WH]$/.test(t.textContent)).length===7);
  await goto('lesson/7');
  check('lesson 7 shows G major needing one black key',$$('.figure')[0].querySelectorAll('[data-marked]').length===8);
  await goto('lesson/8');
  check('lesson 8 marks the three notes of a triad',$$('.figure')[0].querySelectorAll('[data-marked]').length===3);
  check('lesson 8 lays out the seven chords of the key',$$('.figure')[1].querySelectorAll('[data-cell]').length===14);
  await goto('lesson/9');
  check('lesson 9 shows the chord twice over',$$('.figure')[0].querySelectorAll('[data-marked]').length===6);
  await goto('lesson/10');
  check('lesson 10 lays the loop out over eight bars',$$('.figure [data-span]').length===16);
  await goto('lesson/11');
  check('lesson 11 draws the thirteen hook notes',$$('.figure [data-note]').length===13);
  check('lesson 11 only labels the held notes',
   [...$$('.figure text')].filter(t=>/held/.test(t.textContent)).length===3);
  await goto('lesson/12');
  check('lesson 12 puts the bass on the kick positions',
   [...$$('.figure')[0].querySelectorAll('[data-cell][data-on]')].filter(c=>/^Bass/.test(c.dataset.cell)).length===3);
  await goto('lesson/14');
  const sectionNames=[...$$('.figure')[0].querySelectorAll('text')]
   .filter(t=>/^(Intro|Verse|Pre|Chorus|Bridge|Outro)$/.test(t.textContent)).map(t=>t.textContent);
  check('lesson 14 lays out the ten sections of a pop song',sectionNames.length===10);
  check('lesson 14 shows the chorus three times and the bridge once',
   sectionNames.filter(n=>n==='Chorus').length===3&&sectionNames.filter(n=>n==='Bridge').length===1);
  check('lesson 14 says the bridge happens once',
   [...$$('.figure text')].some(t=>/happens once/.test(t.textContent)));
  check('lesson 14 draws AABA as four eight-bar sections',
   $$('.figure')[1].querySelectorAll('[data-span]').length===4);
  await goto('lesson/15');
  check('lesson 15 lays out four sections over sixteen bars',$$('.figure [data-span]').length===4);
  check('lesson 15 marks where the hook enters',
   [...$$('.figure text')].some(t=>/hook enters/.test(t.textContent)));
  await goto('lesson/16');
  check('lesson 16 contrasts three input levels',$$('.figure [data-level]').length===3);
  await goto('lesson/18');
  check('lesson 18 shows four faders and one that moved',
   $$('.figure [data-level]').length===4&&$$('.figure [data-was]').length===1);
  await goto('lesson/19');
  check('lesson 19 shows four tracks summing to one file',$$('.figure')[0].querySelectorAll('[data-span]').length===5);

  // --- the quiz still works where it now sits -----------------------------
  await goto('lesson/1');
  const l=course[0], wrong=$$('[data-quiz]')[(l.correct+1)%l.choices.length];
  wrong.click();await delay(30);
  check('a wrong answer is marked wrong',
   $('#quiz-result').classList.contains('incorrect')&&/Try again/.test($('#quiz-result').textContent));
  $$('[data-quiz]')[l.correct].click();await delay(30);
  check('the right answer is accepted',
   !$('#quiz-result').classList.contains('incorrect')&&/Correct/.test($('#quiz-result').textContent));
  check('the explanation is shown either way',$('#quiz-result').textContent.includes(l.why.slice(0,24)));

  // --- progress is recorded per lesson and summed per chapter -------------
  $('[data-complete]').click();await delay(30);
  check('a finished lesson is remembered',
   done.has(0)&&JSON.parse(localStorage.getItem('roomtone.v1.lessons')).includes(0));
  await goto('lessons');
  check('the overall count moves',/1 \/ 19/.test($('.progressbox span').textContent));
  check('the chapter card counts it too',/1 \/ 11/.test($('.chcard .chcard-foot span').textContent));
  await goto('lesson/2');
  check('the rail ticks off what is done',!!$('.rail-item.got'));
  await goto('lesson/1');$('[data-complete]').click();await delay(30);
  check('it can be unchecked',!done.has(0));

  // --- the cards still come from the lessons ------------------------------
  await goto('chapter/1');
  const arts=$$('.cards .art');
  check('every card draws art',arts.length===11&&arts.every(a=>!!a.querySelector('svg')));
  check('each card art matches its lesson’s first figure',
   arts.every((a,k)=>a.dataset.cardArt===chapterLessons(0)[k][0].figs[0].kind));
  check('card art carries no unreadable type',arts.every(a=>!a.querySelector('svg text')));
  check('card art fits rather than crops',
   arts.every(a=>a.querySelector('svg').getAttribute('preserveAspectRatio')==='xMidYMid meet'));
  check('every card is captioned with its own tag',
   arts.every((a,k)=>a.querySelector('.art-caption').textContent===chapterLessons(0)[k][0].tag));
  check('the tags are all different across the course',new Set(course.map(l=>l.tag)).size===course.length);
  check('no card still uses the old canvas',!$('.cards canvas'));

  // --- nothing else moved --------------------------------------------------
  await goto('practice/keys');
  check('the practice room is untouched',$$('[data-note]').length===25);
  await goto('lesson/4');
  check('the staff side note moved to the lesson about note names',
   !!$('.staff-panel svg')&&/do not need this/i.test($('.staff-panel').textContent));
  await goto('project');
  check('the song project still shows the hook table',/E4 \(1\)/.test($('.stack').textContent));

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' course checks · '+course.length+' lessons in '
   +chapters.length+' chapters · '+course.reduce((n,l)=>n+l.figs.length,0)+' figures · '+words+' words';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
