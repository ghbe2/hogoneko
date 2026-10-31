'use strict';
// Share the approved review rig with the event, including accompanying family.
const nativeAdoptionPerson=adoptionPerson;
adoptionPerson=function(i){
 const template=document.createElement('template');template.innerHTML=nativeAdoptionPerson(i);
 const svg=template.content.firstElementChild,companions=[...svg.querySelectorAll('.adoption-companion')];
 companions.forEach(n=>n.remove());
 fitVisitorBody(svg);svg.setAttribute('viewBox','-29.516 0 179.032 370');
 for(const companion of companions){
  const child=i===0;
  fitVisitorBody(companion,child);
  companion.setAttribute('viewBox',child?'-11.613 0 143.226 296':'-29.516 0 179.032 370');
  for(const key of ['x','y','width','height'])companion.setAttribute(key,Number(companion.getAttribute(key))*370/248);
  svg.prepend(companion);
 }
 return svg.outerHTML;
};
