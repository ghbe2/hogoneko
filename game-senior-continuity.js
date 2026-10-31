'use strict';
// Keep the actual portrait and companion rig across dialogue rerenders.
// Install after all render decorators, including visits and shared guides.
const renderBeforeSeniorContinuity=render;
function liveSeniorPortraits(){
 return [...app.querySelectorAll('.senior-held-cat')]
  .filter(cat=>!cat.closest('.navigation-snapshot'))
  .map(cat=>({cat,portrait:cat.parentElement.closest('svg'),rig:svgRigs.get(cat)}));
}
render=function(state){
 const previous=liveSeniorPortraits().map(item=>({...item,motion:storeCaptureMotion(item.portrait)}));
 renderBeforeSeniorContinuity(state);
 const current=liveSeniorPortraits();
 current.forEach((fresh,index)=>{
  const old=previous[index];
  if(!old?.portrait||!old.rig||old.cat.dataset.companion!==fresh.cat.dataset.companion||old.portrait.dataset.design!==fresh.portrait.dataset.design)return;
  // Scene-specific framing can change; the animated contents must not.
  for(const attr of [...old.portrait.attributes])if(!fresh.portrait.hasAttribute(attr.name))old.portrait.removeAttribute(attr.name);
  for(const attr of fresh.portrait.attributes)old.portrait.setAttribute(attr.name,attr.value);
  svgRigs.delete(fresh.cat);fresh.portrait.replaceWith(old.portrait);
  svgRigs.set(old.cat,old.rig);storeRestoreMotion(old.motion);
 });
 mountGameCats();
};
