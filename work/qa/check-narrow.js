(async function checkNarrow(){
 // The lesson figures are the widest things on the site, so this suite walks
 // every route at a phone width and fails if anything pushes the page sideways.
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 window.AudioContext=function(){return new Offline(1,48000*2,48000);};
 const passed=[],errors=[];
 const check=(claim,ok)=>{if(!ok)throw new Error(claim);passed.push(claim);};
 window.addEventListener('error',e=>errors.push(e.message));
 const delay=t=>new Promise(r=>setTimeout(r,t));
 const goto=async hash=>{location.hash=hash;await delay(90);};
 const fits=()=>document.documentElement.scrollWidth<=window.innerWidth+2;
 const w=window.innerWidth;

 try{
  check('running narrow',w<=480);
  for(let i=1;i<=12;i++){
   await goto('lesson/'+i);
   check(`lesson ${i} fits ${w}px`,fits());
   const art=$('.fig-art');
   check(`lesson ${i} figure can scroll if it must`,getComputedStyle(art).overflowX==='auto');
   const svg=$('.figure svg');
   check(`lesson ${i} figure is no wider than its column`,svg.getBoundingClientRect().width<=art.clientWidth+1);
  }
  for(const route of ['home','lessons','practice/beat','practice/keys','practice/ear','piano','freestyle','garageband','project','reference','sources']){
   await goto(route);
   check(route+' fits '+w+'px',fits());
  }
  check('no uncaught errors',!errors.length);
  window.qaResult='PASS '+passed.length+' narrow checks at '+w+'px';
 }catch(err){
  window.qaResult='FAIL '+err.message+' (after '+passed.length+' checks)'
   +(errors.length?' | page errors: '+errors.join(' ; '):'');
 }
})();
