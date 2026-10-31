'use strict';
// Approved artwork shared with the comparison pages; retain scene framing.
const nativeSeniorArt=seniorArt;
seniorArt=function(){
 const source=nativeSeniorArt(),template=document.createElement('template');
 template.innerHTML=source;const framing=template.content.firstElementChild.getAttribute('viewBox');
 template.innerHTML=faceArt(faces[1],source);
 const svg=template.content.firstElementChild;svg.setAttribute('viewBox',framing);
 svg.setAttribute('aria-label','ネコを抱いた保護主のせんぱい');return svg.outerHTML;
};
const nativeReceptionArt=receptionArt;
receptionArt=function(kind){
 const template=document.createElement('template');template.innerHTML=nativeReceptionArt(kind);
 const svg=template.content.firstElementChild;
 if(kind==='clinic')completeReceptionBody(svg);else completeOtherReception(svg,kind);
 return svg.outerHTML;
};
const nativeStoreBackground=storeBackground;
storeBackground=function(state){
 const template=document.createElement('template');template.innerHTML=nativeStoreBackground(state);
 const svg=template.content.firstElementChild;if(svg.querySelector('.shop-clerk'))completeStoreClerk(svg);
 return svg.outerHTML;
};
