'use strict';
// Install once, before every game scene. Scene-specific pose/ground adjustments
// remain intact; all callers share the same anatomy, coat and animation finish.
(()=>{
 const apply=CatSVG.applyPose;
 CatSVG.poseModel=CatLifeMotion.model;
 CatSVG.applyPose=function(r,m,t,p='sit'){
  const holder=r.svg.closest('.cat-object');
  if(holder)r.reviewDirection=getComputedStyle(holder).getPropertyValue('--cat-facing').trim()==='-1'?'right':'left';
  else r.reviewDirection=r.svg.closest('.tnr-cat')?'right':r.svg.dataset.catDirection||'left';
  // The family's walking figure may be mirrored; cancel that for the held cat.
  const figure=r.svg.closest('.adoption-figure');
  if(figure){
   // Reflect the drawing about its own viewBox centre. A CSS transform on a
   // nested SVG uses the parent's viewport and moves the cat out of the arms.
   r.svg.style.removeProperty('transform');r.svg.style.removeProperty('transform-origin');r.svg.style.removeProperty('transform-box');
   if(!r.identityFacing){const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.dataset.identityFacing='';for(const child of [...r.svg.children])if(child.tagName.toLowerCase()!=='defs')g.append(child);r.svg.append(g);r.identityFacing=g;}
   const v=r.svg.viewBox.baseVal;
   r.identityFacing.setAttribute('transform',figure.getAttribute('transform')?.includes('scale(-1')?'translate('+(v.x*2+v.width)+' 0) scale(-1 1)':'');
  }
  const drawingPose=p.startsWith('reaction')?p.split(':')[1]:p==='avoid'?'sit':p;
  CatLifeMotion.reset(r);apply(r,m,t,drawingPose);
  // Eyelids are animated in place; the original coat and eye positions do not move apart.
  const acting=CatLifeMotion.expression(p,t);
  for(const def of r.nodes.face.querySelectorAll('defs')){
   const eye=def.nextElementSibling,iris=eye.nextElementSibling,cy=r.d.head==='ruff'?0:-3;
   const tf=`translate(0 ${cy}) scale(1 ${acting.lid}) translate(0 ${-cy})`;
   eye.setAttribute('transform',tf);iris.setAttribute('transform',tf);
  }
  CatLifeMotion.finish(r,m,p,t);
  // Props and dirt belong to their scenes, never to the animal itself.
  r.nodes.props.replaceChildren();r.nodes.effects.replaceChildren();
  r.svg.dataset.catMotion='shared';
 };
})();
