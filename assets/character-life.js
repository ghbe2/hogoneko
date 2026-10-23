'use strict';
// Art-local joints: never animate the layout box, feet, counters or speech panel.
// Each factory runs once per drawing; no observer or extra per-frame DOM work.
(()=>{
 const ns='http://www.w3.org/2000/svg';
 function joint(node,cls,origin){
  if(!node)return null;
  const g=document.createElementNS(ns,'g');g.setAttribute('class',cls);
  if(origin)g.style.transformOrigin=origin;
  node.before(g);g.append(node);return g;
 }
 function breathe(root,origin){
  if(!root)return;
  const g=document.createElementNS(ns,'g');g.classList.add('actor-breath');g.style.transformOrigin=origin;
  while(root.firstChild)g.append(root.firstChild);root.append(g);
 }
 function decorate(markup,kind,index=0){
  const t=document.createElement('template');t.innerHTML=markup;
  const svg=t.content.querySelector('svg');if(!svg)return markup;
  svg.dataset.characterLife=kind;svg.style.setProperty('--actor-delay',`${-(performance.now()/1000+index*1.37+1.1)}s`);
  if(kind==='senior'){
   const upper=svg.querySelector('.senior-upper');breathe(upper,'110px 200px');
   joint(svg.querySelector('.senior-head'),'actor-look','109px 96px');
  }else if(kind==='visitor'){
   breathe(svg.querySelector('.adoption-torso'),'60px 156px');
   joint(svg.querySelector('.adoption-head'),'actor-look','60px 83px');
  }else if(kind==='store'){
   breathe(svg.querySelector('.shop-clerk'),'0px 86px');
   joint(svg.querySelector('.store-clerk-head'),'actor-look','0px 16px');
   // The bird's feet stay on the shoulder. Head/wing move within its body.
   const bird=svg.querySelector('.shoulder-bird');
   if(bird){
    const parts=[...bird.children],head=document.createElementNS(ns,'g');head.classList.add('actor-bird-head');
    parts[2].before(head);parts.slice(2,8).forEach(n=>head.append(n));
    const eye=head.querySelector('ellipse');if(eye)joint(eye,'actor-bird-eye','30.5px -15px');
    const wing=bird.querySelector('.store-bird-wing');
    if(wing){const detail=wing.nextElementSibling,g=joint(wing,'actor-wing-detail');if(detail)g.append(detail);wing.classList.remove('store-bird-wing');g.classList.add('store-bird-wing');}
   }
   breathe(svg.querySelector('.store-rabbit-body'),'118px 392px');
   const head=svg.querySelector('.store-rabbit-head');
   if(head){const ear=head.querySelector('.store-rabbit-ear'),back=ear?.nextElementSibling,inner=back?.nextElementSibling;if(back&&inner){const g=joint(back,'actor-rabbit-ear-back','136px 339px');g.append(inner);}}
  }else{
   const staff=svg.querySelector('.reception-staff');
   // The examination scene extracts this group from the reception drawing.
   if(staff){staff.dataset.characterLife=kind;staff.style.setProperty('--actor-delay',svg.style.getPropertyValue('--actor-delay'));}
   breathe(staff,'320px 234px');
   joint(svg.querySelector('.reception-staff-head'),'actor-look','320px 147px');
  }
  return svg.outerHTML;
 }
 const senior=seniorArt;seniorArt=()=>decorate(senior(),'senior');
 const reception=receptionArt;receptionArt=kind=>decorate(reception(kind),kind);
 const store=storeBackground;storeBackground=state=>decorate(store(state),'store');
 const visitor=adoptionPerson;adoptionPerson=i=>decorate(visitor(i),'visitor',i);
})();
