function makeBeatMidi(rows,meter,tempo,amount,steps,stride,title){
 const ppq=480, m=meters[meter], div=m.div/stride;
 const quarterMicros=Math.round(60e6/tempo/(m.div/4));
 const [numerator,denominator]=meter.split('/').map(Number);
 const events=[],push=(tick,order,bytes)=>events.push({tick,order,bytes});
 const label=new TextEncoder().encode(title);
 function vlq(num){const b=[num&127];while(num>>=7)b.unshift((num&127)|128);return b;}
 push(0,0,[255,3,...vlq(label.length),...label]);
 push(0,0,[255,81,3,(quarterMicros>>16)&255,(quarterMicros>>8)&255,quarterMicros&255]);
 push(0,0,[255,88,4,numerator,Math.log2(denominator),denominator===8?36:24,8]);
 let pos=0;
 for(let s=0;s<steps;s++){
  const next=pos+ppq/4*stride*swingLength(s,div,amount);
  kit.forEach(([_,name,pitch],r)=>{
   if(!rows[r][s*stride])return;
   push(Math.round(pos),2,[0x99,pitch,s*stride%2?68:94]);
   push(Math.round(pos+(next-pos)*.52),1,[0x89,pitch,0]);
  });
  pos=next;
 }
 push(Math.round(pos),3,[255,47,0]);events.sort((a,b)=>a.tick-b.tick||a.order-b.order);
 let prev=0;const bytes=[];
 for(const e of events){bytes.push(...vlq(e.tick-prev),...e.bytes);prev=e.tick;}
 const n=bytes.length;
 return new Uint8Array([77,84,104,100,0,0,0,6,0,0,0,1,ppq>>8,ppq&255,77,84,114,107,n>>>24,(n>>>16)&255,(n>>>8)&255,n&255,...bytes]);
}
