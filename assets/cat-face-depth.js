'use strict';
// Shared continuous surface deformation. Paint and anatomy use the SAME
// coordinate field, including eye clipping paths. Never resample a coat.
window.CatFaceDepth=(()=>{
 const cache=new Map(),ns='http://www.w3.org/2000/svg';
 function project(x,y,turn){
  const cheek=Math.max(0,1-(x/66)**2),forehead=Math.max(0,Math.min(1,(y+65)/28));
  const muzzle=Math.exp(-((x/23)**2)-((y-20)/14)**2);
  return [x*(1-.045*turn*turn)+turn*(23*cheek*forehead+9*muzzle),y+turn*x*.025*forehead];
 }
 function samples(node){
  const tag=node.tagName,attrs=tag==='path'?['d']:tag==='circle'?['cx','cy','r']:['cx','cy','rx','ry'];
  const key=tag+attrs.map(a=>node.getAttribute(a)).join('|');if(cache.has(key))return cache.get(key);
  let parts=[];
  if(tag==='path'){
   for(const d of (node.getAttribute('d')||'').split(/(?=M)/).filter(Boolean)){
    const path=document.createElementNS(ns,'path');path.setAttribute('d',d);const len=path.getTotalLength(),n=Math.max(4,Math.ceil(len/2));
    parts.push({closed:/z\s*$/i.test(d),pts:Array.from({length:n+1},(_,i)=>{const p=path.getPointAtLength(len*i/n);return[p.x,p.y];})});
   }
  }else{const x=+node.getAttribute('cx'),y=+node.getAttribute('cy'),rx=+node.getAttribute(tag==='circle'?'r':'rx'),ry=+node.getAttribute(tag==='circle'?'r':'ry');parts=[{closed:true,pts:Array.from({length:49},(_,i)=>[x+rx*Math.cos(i*Math.PI/24),y+ry*Math.sin(i*Math.PI/24)])}];}
  if(cache.size>900)cache.clear();cache.set(key,parts);return parts;
 }
 function warp(root,turn){for(const node of [...root.querySelectorAll('path,ellipse,circle')]){
  const parts=samples(node),p=document.createElementNS(ns,'path');for(const a of node.attributes)if(!['d','cx','cy','r','rx','ry'].includes(a.name))p.setAttribute(a.name,a.value);
  p.setAttribute('d',parts.map(part=>part.pts.map(([x,y],i)=>{const q=project(x,y,turn);return(i?'L':'M')+q[0].toFixed(3)+' '+q[1].toFixed(3);}).join('')+(part.closed?'Z':'')).join(''));node.replaceWith(p);
 }}
 function apply(r,turn){
  r.depthOriginalSkin??=r.nodes.headSkin.innerHTML;
  r.nodes.headSkin.innerHTML=r.depthOriginalSkin;
  r.nodes.headSkin.removeAttribute('transform');r.nodes.face.removeAttribute('transform');
  if(turn===null)return;
  warp(r.nodes.headSkin,turn);warp(r.nodes.face,turn);
  // Ear attachment is farther behind the muzzle: only a small parallax shift.
  for(const side of ['L','R'])for(const node of [r.nodes['ear'+side],r.nodes['inner'+side],r.svg.querySelector(`[data-clip-ear="${side}"]`)])node.setAttribute('transform',`translate(${turn*1.5} 0) `+(node.getAttribute('transform')||''));
 }
 return{apply,project};
})();
