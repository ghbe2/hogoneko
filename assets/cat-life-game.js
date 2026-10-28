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
  if(figure){r.svg.style.transformOrigin='50% 50%';r.svg.style.transformBox='view-box';r.svg.style.transform=figure.getAttribute('transform')?.includes('scale(-1')?'scaleX(-1)':'';}
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
