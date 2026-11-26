(async function checkNarrow(){
 // The figures and the widget grids are the widest things on the site, so this
 // suite walks every route at a phone width and fails if anything pushes the
 // page sideways — or if a grid shrinks its cells instead of scrolling.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(100);};
 const fits=()=>document.documentElement.scrollWidth<=window.innerWidth+2;
 const w=window.innerWidth;

 try{
  check('running narrow',w<=480);

  for(let i=1;i<=course.length;i++){
   await goto('lesson/'+i);
   check(`lesson ${i} fits ${w}px`,fits());
   const art=$('.fig-art');
   check(`lesson ${i} figure can scroll if it must`,getComputedStyle(art).overflowX==='auto');
   const svg=$('.figure svg');
   check(`lesson ${i} figure is no wider than its column`,svg.getBoundingClientRect().width<=art.clientWidth+1);
   check(`lesson ${i} widgets stay inside the page`,
    $$('.widget').every(el=>el.getBoundingClientRect().right<=w+2));
   // A grid wider than the phone belongs in a scroller, not squeezed flat.
   $$('.w-grid,.w-contour,.w-matrix').forEach(g=>{
    const box=g.closest('.w-scroll');
    check(`lesson ${i} grid sits in a horizontal scroller`,!!box&&getComputedStyle(box).overflowX==='auto');
    check(`lesson ${i} grid scroller stays inside the page`,box.getBoundingClientRect().width<=w+2);
   });
   $$('.w-keys').forEach(k=>
    check(`lesson ${i} keyboard fits its widget`,k.getBoundingClientRect().width<=w+2));
   check(`lesson ${i} the lesson rail is not cut off`,
    !$('.lesson-rail')||$('.lesson-rail').scrollHeight<=$('.lesson-rail').clientHeight+1);
  }

  for(let j=1;j<=chapters.length;j++){
   await goto('chapter/'+j);
   check('chapter '+j+' fits '+w+'px',fits());
   check('chapter '+j+' stacks its cards in one column',
    $$('.cards .card').every(c=>Math.round(c.getBoundingClientRect().width)===Math.round($('.cards').clientWidth)));
  }

  for(const route of ['home','lessons','practice/beat','practice/keys','practice/ear','piano',
                      'freestyle','garageband','project','reference','sources']){
   await goto(route);
   check(route+' fits '+w+'px',fits());
  }
  await goto('lessons');
  check('the chapter cards stack rather than squeeze',
   $$('.chcard').every(c=>c.getBoundingClientRect().width>w*0.8));

  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' narrow checks at '+w+'px';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
