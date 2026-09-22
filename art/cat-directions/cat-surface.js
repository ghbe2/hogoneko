'use strict';
// Fixed cylindrical coat map: u is an angle around the torso, v runs neck to rump.
// Only the view angle changes. No new patches are sampled during a pose change.
window.CatSurface=(()=>{
 const rad=Math.PI/180,cache=new Map();
 function random(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let v=Math.imul(seed^seed>>>15,1|seed);v^=v+Math.imul(v^v>>>7,61|v);return((v^v>>>14)>>>0)/4294967296;};}
 function make(meta,seed){
  const {family,color,variant:v}=meta,r=random(seed+v*1709),shapes=[];
  const base={tabby:{black:'#595650',white:'#e9e5db',brown:'#a9793c',gray:'#a4aaa9'}[color],tortie:color==='yellow'?'#d2a14d':color==='gray'?'#727981':'#302d29',calico:'#f4f0e7',tux:{black:'#292d2d',gray:'#858e92',brown:'#95603d'}[color],black:'#292d2d',white:'#f5f2e8',cream:'#e8c78a'}[family];
  function add(fill,points){shapes.push({id:shapes.length,fill,points});}
  function oval(fill,u,y,ru,ry,wobble=0){const pts=[];const phase=r()*6.28;for(let i=0;i<40;i++){const a=i/40*Math.PI*2,k=1+wobble*Math.sin(a*3+phase);pts.push([u+Math.cos(a)*ru*k,y+Math.sin(a)*ry*k]);}add(fill,pts);}
  if(family==='tabby'){
   const ink=color==='brown'?'#4f3826':color==='black'?'#232627':'#62686b';
   add(ink,[[170,-120],[190,-120],[187,115],[174,115]]);
   for(let y=-91;y<108;y+=v===1?32:24){
    for(const side of [1,-1]){
     if(v===2){for(let j=0;j<4;j++)oval(ink,180+side*(25+j*29),y+j*2,7,6,.15);}
     else{
      const pts=[],thick=v===1?12:6,jitter=r()*6;
      for(let a=24;a<=158;a+=5)pts.push([180+side*a,y+Math.sin(a*rad)*13+jitter]);
      for(let a=158;a>=24;a-=5)pts.push([180+side*a,y+Math.sin(a*rad)*13+jitter+thick*Math.sin(a/180*Math.PI)]);
      add(ink,pts);
     }
    }
   }
  }
  if(family==='tortie'||family==='calico'){
   // A few authored, well-separated color islands instead of scattered noise.
   const layouts=[[[18,-48,39,43],[83,49,43,39],[151,-48,40,44],[221,47,43,39],[287,-49,40,43],[346,60,32,30]],[[5,-36,49,60],[98,48,45,44],[185,-34,48,60],[278,48,45,44]],[[22,-61,41,32],[83,31,39,48],[149,-47,41,38],[218,43,40,46],[285,-51,41,39],[345,65,30,29]]];
   for(const [i,spot] of layouts[v].entries()){
    const fill=family==='tortie'?(color==='yellow'?'#514234':color==='gray'?'#c7b5a0':'#bd702d'):i%2?'#c7803a':'#292d2d';
    const [u,y,ru,ry]=spot;
    oval(fill,u+(r()-.5)*8,y+(r()-.5)*8,ru,ry,.045);
   }
  }
  if(family==='tux'||family==='calico'&&v===2){
   // The white bib belongs to the front, never the spine. At 90° it wraps to the belly edge.
   const width=v===1?37:v===2?26:48,pts=[];
   for(let y=-112;y<=116;y+=4)pts.push([-width*(.68+.32*Math.cos(y/110)),y]);
   for(let y=116;y>=-112;y-=4)pts.push([width*(.68+.32*Math.cos(y/110)),y]);
   add('#f6f2e8',pts);
  }
  return{base,shapes};
 }
 function clip(poly,edge,keepGreater){
  const out=[];for(let i=0;i<poly.length;i++){
   const a=poly[i],b=poly[(i+1)%poly.length],inA=keepGreater?a[0]>=edge:a[0]<=edge,inB=keepGreater?b[0]>=edge:b[0]<=edge;
   if(inA)out.push(a);if(inA!==inB){const t=(edge-a[0])/(b[0]-a[0]);out.push([edge,a[1]+(b[1]-a[1])*t]);}
  }return out;
 }
 function radius(y){const t=Math.max(0,Math.min(1,(y+85)/130));return 33+26*Math.sin(t*Math.PI/2);}
 function project(surface,yaw){
  let svg=`<rect x="-180" y="-180" width="360" height="360" fill="${surface.base}"/>`;
  for(const shape of surface.shapes)for(const turn of [-360,0,360]){
   let pts=shape.points.map(([u,v])=>[u+turn,v]);pts=clip(clip(pts,yaw-90,true),yaw+90,false);if(pts.length<3)continue;
   // Subdivide straight UV edges before non-linear projection (especially the bib).
   const dense=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],n=Math.max(1,Math.ceil(Math.abs(b[0]-a[0])/5));for(let j=0;j<n;j++)dense.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);}
   const d=dense.map(([u,v],i)=>`${i?'L':'M'}${(Math.sin((u-yaw)*rad)*radius(v)).toFixed(2)} ${v.toFixed(2)}`).join('')+'Z';
   svg+=`<path data-mark="${shape.id}" d="${d}" fill="${shape.fill}"/>`;
  }return svg;
 }
 function get(meta,seed){const key=JSON.stringify([meta,seed]);if(!cache.has(key)){if(cache.size>120)cache.clear();cache.set(key,make(meta,seed));}return cache.get(key);}
 return{get,project};
})();
