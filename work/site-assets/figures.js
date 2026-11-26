// Inline lesson diagrams. Every lesson gets a picture of its own subject, drawn
// as SVG so it scales, prints, and can be asserted against in the QA suite.
//
// Five primitives cover all twelve lessons:
//   keys      a piano keyboard, with keys marked and spans drawn over them
//   grid      a step grid with counted beats and named lanes
//   timeline  bars across a song, with sections above and parts below
//   contour   pitch against time, so a melody has a visible shape
//   meters    labelled horizontal levels, for comparing one balance to another
//
// A lesson names a figure as data; drawFigure dispatches on `kind`.

const FIG_TONE = {
 green:['#4e7357','#f4f8ef'], orange:['#e2954f','#2b3f31'], blue:['#5d868c','#f4f8ef'],
 rust:['#ab5530','#fdf3e8'], soft:['#c3d8c2','#24402f'], slate:['#8d9c8a','#f4f8ef'],
 pale:['#e4ebdc','#3c5143']
};
const FIG_INK='#22382e', FIG_MUTE='#5c6d61', FIG_LINE='#c0cbba', FIG_BG='#f0f3e9';
const SHARP_NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const WHITE_PC=[0,2,4,5,7,9,11];
const pc=n=>((n%12)+12)%12;
const isWhiteNote=n=>WHITE_PC.includes(pc(n));
const noteName=n=>SHARP_NAMES[pc(n)]+(Math.floor(n/12)-1);
const tone=t=>FIG_TONE[t]||FIG_TONE.green;

function figure(svg,caption,cls=''){
 return `<figure class="figure${cls?' '+cls:''}"><div class="fig-art">${svg}</div>${caption?`<figcaption>${caption}</figcaption>`:''}</figure>`;
}
// Capped at its natural width so text stays the same size from figure to figure,
// with a floor so the narrow ones do not look lost beside a full-width panel.
function svgTag(w,h,label,body){
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label||'')}" preserveAspectRatio="xMidYMid meet" style="max-width:${Math.round(w*1.25)}px">${body}</svg>`;
}

/* ---------------------------------------------------------------- keyboard */
function keyLayout(low,high,kw){
 const keys=[]; let wi=0;
 for(let n=low;n<=high;n++){
  if(isWhiteNote(n)){keys.push({n,white:true,x:wi*kw,w:kw}); wi++;}
  else keys.push({n,white:false,x:wi*kw-kw*0.3,w:kw*0.6});
 }
 return {keys,width:wi*kw,centre:n=>{const k=keys.find(k=>k.n===n);return k?k.x+k.w/2:0;}};
}
function fKeys(o){
 const kw=o.kw||34, kh=o.h||116, bh=Math.round(kh*0.62);
 const lay=keyLayout(o.low,o.high,kw), mark=o.mark||{}, spans=o.spans||[];
 const brackets=spans.filter(s=>s.kind!=='step'), steps=spans.filter(s=>s.kind==='step');
 // Zones stacked above the keys: bracket labels, then step labels, then group bars.
 const gz=o.groups?24:0, sz=steps.length?20:0, bz=brackets.length?(brackets.length>1?58:28):0;
 const top=10+bz+sz+gz, bottom=o.labels?26:10;
 // Bracket text is far wider than the keys it spans, so reserve side room for it.
 const pad=brackets.length?62:10;
 const w=lay.width+pad*2, h=top+kh+bottom;
 let body=`<rect width="${w}" height="${h}" rx="7" fill="${FIG_BG}"/>`;
 const X=n=>pad+lay.centre(n);

 // white keys first so black keys sit on top of them
 for(const k of lay.keys.filter(k=>k.white)){
  const m=mark[k.n], [fill,ink]=m?tone(m.tone):['#fbf7ea','#3c5143'];
  body+=`<rect x="${(pad+k.x).toFixed(1)}" y="${top}" width="${k.w-1.5}" height="${kh}" rx="3" fill="${fill}" stroke="#aab39d" stroke-width="1.1" data-key="${k.n}"${m?' data-marked="1"':''}/>`;
  if(m&&m.text)body+=`<text x="${X(k.n).toFixed(1)}" y="${top+kh-13}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ink}">${esc(m.text)}</text>`;
  else if(o.labels==='all'||(o.labels==='c'&&pc(k.n)===0))
   body+=`<text x="${X(k.n).toFixed(1)}" y="${top+kh-13}" text-anchor="middle" font-size="11" fill="#6d7d6c">${o.labels==='c'?noteName(k.n):SHARP_NAMES[pc(k.n)]}</text>`;
 }
 for(const k of lay.keys.filter(k=>!k.white)){
  const m=mark[k.n], [fill,ink]=m?tone(m.tone):['#31412f','#fff'];
  body+=`<rect x="${(pad+k.x).toFixed(1)}" y="${top}" width="${k.w}" height="${bh}" rx="2.5" fill="${fill}" stroke="#242f24" stroke-width="1" data-key="${k.n}"${m?' data-marked="1"':''}/>`;
  if(m&&m.text)body+=`<text x="${X(k.n).toFixed(1)}" y="${top+bh-9}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${ink}">${esc(m.text)}</text>`;
 }
 // One bar per run of black keys, labelled 2 or 3, so the landmark pattern reads at a glance
 if(o.groups){
  let run=[];
  const flush=()=>{
   if(!run.length)return;
   const a=pad+run[0].x, b=pad+run[run.length-1].x+run[run.length-1].w, mid=(a+b)/2;
   body+=`<rect x="${a.toFixed(1)}" y="${top-10}" width="${(b-a).toFixed(1)}" height="5" rx="2.5" fill="${run.length===2?'#d08b3f':'#5d868c'}" data-group="${run.length}"/>`
       +`<text x="${mid.toFixed(1)}" y="${top-14}" text-anchor="middle" font-size="10" font-weight="700" fill="${run.length===2?'#9a5f23':'#44666b'}">${run.length}</text>`;
   run=[];
  };
  // Black keys are never adjacent in note order — a white key always sits between
  // them — so runs are found by pitch class: C♯/D♯ make the two, F♯/G♯/A♯ the three.
  const cluster=p=>[1,3].includes(p)?'two':'three';
  for(const k of lay.keys){
   if(k.white)continue;
   const prev=run[run.length-1];
   if(prev&&k.n-prev.n===2&&cluster(pc(prev.n))===cluster(pc(k.n)))run.push(k);
   else{flush();run=[k];}
  }
  flush();
 }
 steps.forEach(s=>{
  const mid=(X(s.from)+X(s.to))/2;
  body+=`<text x="${mid.toFixed(1)}" y="${top-gz-6}" text-anchor="middle" font-size="11" font-weight="700" fill="${s.tone==='half'?'#ab5530':FIG_MUTE}">${esc(s.text)}</text>`;
 });
 brackets.forEach((s,i)=>{
  const a=X(s.from), b=X(s.to), y=top-gz-sz-10-(i%2)*26, mid=(a+b)/2;
  body+=`<path d="M${a.toFixed(1)} ${y+6}v-5h${(b-a).toFixed(1)}v5" fill="none" stroke="#7d8f7c" stroke-width="1.4"/>`
      +`<text x="${mid.toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="${FIG_INK}">${esc(s.text)}</text>`;
 });
 return figure(svgTag(w,h,o.alt,body),o.caption,'fig-keys');
}

/* ------------------------------------------------------------------- grid */
function fGrid(o){
 const beats=o.beats||4, div=o.div||2, cells=beats*div;
 const lanes=o.lanes||[], lw=o.laneWidth||92, cw=o.cw||40, rh=36, gap=5;
 const w=lw+cells*cw+14, h=30+lanes.length*(rh+gap)+8;
 const counts=o.counts||Array.from({length:cells},(_,i)=>i%div===0?String(i/div+1):(div===4?['','e','&','a'][i%div]:'&'));
 let body=`<rect width="${w}" height="${h}" rx="7" fill="${FIG_BG}"/>`;
 for(let i=0;i<cells;i++){
  const x=lw+i*cw;
  if(i%div===0)body+=`<rect x="${x-2}" y="6" width="${cw*div-1}" height="${h-12}" rx="4" fill="${(i/div)%2?'#e6ebdd':'#edf1e5'}"/>`;
  body+=`<text x="${x+cw/2-1}" y="23" text-anchor="middle" font-size="12" font-weight="${i%div===0?700:500}" fill="${i%div===0?FIG_INK:FIG_MUTE}" class="fm">${counts[i]}</text>`;
 }
 lanes.forEach((lane,r)=>{
  const y=30+r*(rh+gap), [fill,ink]=tone(lane.tone||'green'), on=new Set(lane.on||[]);
  body+=`<text x="${lw-10}" y="${y+rh/2+4}" text-anchor="end" font-size="12.5" font-weight="650" fill="${FIG_INK}">${esc(lane.name)}</text>`;
  for(let i=0;i<cells;i++){
   const x=lw+i*cw, hit=on.has(i), txt=lane.text&&lane.text[i];
   body+=`<rect x="${x}" y="${y}" width="${cw-4}" height="${rh}" rx="4" fill="${hit?fill:'#f7f9f1'}" stroke="${hit?fill:'#ccd6c6'}" stroke-width="1.2" data-cell="${lane.name}-${i}"${hit?' data-on="1"':''}/>`;
   if(txt)body+=`<text x="${x+(cw-4)/2}" y="${y+rh/2+4}" text-anchor="middle" font-size="${txt.length>4?9:10.5}" font-weight="700" fill="${hit?ink:'#6d7d6c'}">${esc(txt)}</text>`;
  }
 });
 return figure(svgTag(w,h,o.alt,body),o.caption,'fig-grid');
}

/* --------------------------------------------------------------- timeline */
function fTimeline(o){
 const bars=o.bars||16, lanes=o.lanes||[], sections=o.sections||[];
 const lw=o.laneWidth||96, bw=o.bw||32, rh=28, gap=6, marks=o.marks||[];
 // Marks get their own strip above the sections, or they land on top of them.
 const mz=marks.length?18:0;
 const top=(sections.length?48:22)+mz, w=lw+bars*bw+14, h=top+lanes.length*(rh+gap)+16;
 let body=`<rect width="${w}" height="${h}" rx="7" fill="${FIG_BG}"/>`;
 for(let b=0;b<bars;b++){
  const x=lw+b*bw;
  if(b%4===0)body+=`<path d="M${x} ${top-6}V${h-10}" stroke="${FIG_LINE}" stroke-width="1.2"/>`;
  if(b%4===0||bars<=8)body+=`<text x="${x+3}" y="${h-2}" font-size="9.5" fill="${FIG_MUTE}" class="fm">${b+1}</text>`;
 }
 sections.forEach(s=>{
  const x=lw+(s.from-1)*bw, wid=(s.to-s.from+1)*bw-4, [fill,ink]=tone(s.tone||'soft');
  body+=`<rect x="${x}" y="${8+mz}" width="${wid}" height="30" rx="5" fill="${fill}"/>`
      +`<text x="${x+wid/2}" y="${(s.sub?23:28)+mz}" text-anchor="middle" font-size="12" font-weight="700" fill="${ink}">${esc(s.name)}</text>`;
  if(s.sub)body+=`<text x="${x+wid/2}" y="${34+mz}" text-anchor="middle" font-size="9" fill="${ink}" opacity=".85" class="fm">${esc(s.sub)}</text>`;
 });
 lanes.forEach((lane,r)=>{
  const y=top+r*(rh+gap);
  body+=`<text x="${lw-10}" y="${y+rh/2+4}" text-anchor="end" font-size="12" font-weight="650" fill="${FIG_INK}">${esc(lane.name)}</text>`;
  body+=`<rect x="${lw}" y="${y}" width="${bars*bw-4}" height="${rh}" rx="4" fill="#f7f9f1" stroke="#dce3d6"/>`;
  (lane.spans||[]).forEach(s=>{
   const x=lw+(s.from-1)*bw, wid=(s.to-s.from+1)*bw-5, [fill,ink]=tone(s.tone||lane.tone||'green');
   body+=`<rect x="${x+1}" y="${y+3}" width="${wid}" height="${rh-6}" rx="3.5" fill="${fill}" data-span="${lane.name}-${s.from}"/>`;
   if(s.label)body+=`<text x="${x+1+wid/2}" y="${y+rh/2+4}" text-anchor="middle" font-size="10.5" font-weight="650" fill="${ink}">${esc(s.label)}</text>`;
  });
 });
 marks.forEach(m=>{
  const x=lw+(m.at-1)*bw, wide=m.label.length*5.9, flip=x+wide>w-6;
  body+=`<path d="M${x} ${14}V${h-12}" stroke="#ab5530" stroke-width="1.8" stroke-dasharray="4 3"/>`
      +`<text x="${flip?x-5:x+5}" y="12" text-anchor="${flip?'end':'start'}" font-size="10.5" font-weight="700" fill="#ab5530">${esc(m.label)}</text>`;
 });
 return figure(svgTag(w,h,o.alt,body),o.caption,'fig-timeline');
}

/* ---------------------------------------------------------------- contour */
function fContour(o){
 const bars=o.bars||[], beatW=o.beatW||44, h=o.h||190, top=22, floor=h-46;
 const all=bars.flatMap(b=>b.notes.map(n=>n.midi));
 const lo=Math.min(...all)-2, hi=Math.max(...all)+2, span=Math.max(hi-lo,6);
 const lw=14, totalBeats=bars.reduce((s,b)=>s+b.notes.reduce((t,n)=>t+n.beats,0),0);
 const w=lw*2+totalBeats*beatW;
 const Y=m=>floor-((m-lo)/span)*(floor-top);
 // Drawn in three passes so the dashed path connecting the notes sits behind them.
 let back=`<rect width="${w}" height="${h}" rx="7" fill="${FIG_BG}"/>`, joins='', front='';
 let beat=0, prev=null;
 bars.forEach((bar,bi)=>{
  const start=beat, len=bar.notes.reduce((t,n)=>t+n.beats,0), x0=lw+start*beatW;
  back+=`<path d="M${x0} ${top-10}V${floor+14}" stroke="${FIG_LINE}" stroke-width="1.2"/>`;
  if(bar.chord)back+=`<text x="${x0+len*beatW/2}" y="${h-10}" text-anchor="middle" font-size="12.5" font-weight="700" fill="${FIG_INK}">${esc(bar.chord)}</text>`;
  if(bar.bar)back+=`<text x="${x0+5}" y="${top-4}" font-size="9.5" fill="${FIG_MUTE}" class="fm">bar ${bar.bar}</text>`;
  bar.notes.forEach(n=>{
   const x=lw+beat*beatW, wid=n.beats*beatW-7, y=Y(n.midi), [fill,ink]=tone(n.tone||(bi%2?'blue':'green'));
   if(prev)joins+=`<path d="M${prev.x.toFixed(1)} ${prev.y.toFixed(1)}L${(x+wid/2).toFixed(1)} ${y.toFixed(1)}" stroke="#9aab97" stroke-width="1.3" stroke-dasharray="3 3"/>`;
   prev={x:x+wid/2,y};
   front+=`<rect x="${x}" y="${(y-8).toFixed(1)}" width="${wid}" height="16" rx="5" fill="${fill}" data-note="${n.midi}"/>`
        +`<text x="${(x+wid/2).toFixed(1)}" y="${(y+4.5).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${ink}">${noteName(n.midi)}</text>`
        +(n.beats>1?`<text x="${(x+wid/2).toFixed(1)}" y="${(y+22).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="${FIG_MUTE}" class="fm">held ${n.beats} beats</text>`:'');
   beat+=n.beats;
  });
 });
 back+=`<path d="M${lw+totalBeats*beatW} ${top-10}V${floor+14}" stroke="${FIG_LINE}" stroke-width="1.2"/>`;
 return figure(svgTag(w,h,o.alt,back+joins+front),o.caption,'fig-contour');
}

/* ----------------------------------------------------------------- meters */
function fMeters(o){
 const rows=o.rows||[], lw=o.laneWidth||104, track=o.track||300, rh=26, gap=11;
 // Right margin sized to the longest trailing note so nothing gets cut off.
 const noteRoom=Math.max(16,...rows.map(r=>r.note?r.note.length*5.9+22:0));
 const w=lw+track+noteRoom, h=14+rows.length*(rh+gap);
 let body=`<rect width="${w}" height="${h}" rx="7" fill="${FIG_BG}"/>`;
 rows.forEach((r,i)=>{
  const y=10+i*(rh+gap), [fill,ink]=tone(r.tone||'green'), val=Math.max(0,Math.min(100,r.value));
  body+=`<text x="${lw-12}" y="${y+rh/2+4}" text-anchor="end" font-size="12.5" font-weight="650" fill="${FIG_INK}">${esc(r.name)}</text>`
      +`<rect x="${lw}" y="${y}" width="${track}" height="${rh}" rx="5" fill="#f7f9f1" stroke="#d3dccc"/>`;
  if(Number.isFinite(r.was))body+=`<rect x="${lw}" y="${y}" width="${track*r.was/100}" height="${rh}" rx="5" fill="none" stroke="#ab5530" stroke-width="1.4" stroke-dasharray="4 3" data-was="${r.name}"/>`;
  body+=`<rect x="${lw}" y="${y}" width="${(track*val/100).toFixed(1)}" height="${rh}" rx="5" fill="${fill}" data-level="${esc(r.name)}"/>`;
  if(r.label)body+=`<text x="${lw+10}" y="${y+rh/2+4}" font-size="11" font-weight="700" fill="${ink}">${esc(r.label)}</text>`;
  if(r.note)body+=`<text x="${lw+track+10}" y="${y+rh/2+4}" font-size="11" fill="${FIG_MUTE}">${esc(r.note)}</text>`;
 });
 return figure(svgTag(w,h,o.alt,body),o.caption,'fig-meters');
}

function drawFigure(spec){
 if(!spec)return '';
 const kinds={keys:fKeys,grid:fGrid,timeline:fTimeline,contour:fContour,meters:fMeters};
 return Object.hasOwn(kinds,spec.kind)?kinds[spec.kind](spec):'';
}

/* -------------------------------------------------------------- thumbnails */
// A lesson card is about 400×112, so the figure's own type would come out at
// seven pixels. The card therefore shows the same drawing with every label
// removed and the name gutter closed up: the shapes still identify the lesson,
// and the card's heading carries the words.
const FIG_TINT={keys:'keys',grid:'rhythm',timeline:'arrange',contour:'wave',meters:'wave'};
function thumbSpec(f){
 const s={...f,labels:false,alt:'',caption:''};
 delete s.spans; delete s.marks;
 if(['grid','timeline','meters'].includes(s.kind))s.laneWidth=6;
 if(s.sections)s.sections=s.sections.map(x=>({...x,sub:null}));
 if(s.lanes)s.lanes=s.lanes.map(l=>({...l,text:null,spans:l.spans&&l.spans.map(sp=>({...sp,label:null}))}));
 if(s.rows)s.rows=s.rows.map(r=>({...r,label:null,note:null}));
 if(s.mark)s.mark=Object.fromEntries(Object.entries(s.mark).map(([k,v])=>[k,{...v,text:null}]));
 if(Array.isArray(s.bars))s.bars=s.bars.map(b=>({...b,chord:null,bar:null}));
 return s;
}
function figureThumb(spec){
 const svg=(drawFigure(thumbSpec(spec)).match(/<svg[\s\S]*<\/svg>/)||[''])[0];
 return svg
  .replace(/<text[\s\S]*?<\/text>/g,'')            // no type at this size
  .replace(/<rect [^>]*fill="#f0f3e9"\/>/,'')      // let the card's tint show through
  .replace(/ style="[^"]*"/,'')
  .replace(/ aria-label="[^"]*"/,'')
  .replace('role="img"','aria-hidden="true"')
  .replace('xMidYMid meet','xMidYMid meet');   // fit whole, never crop
}
