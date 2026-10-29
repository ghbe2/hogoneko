'use strict';
// Read-only fixtures use the real renderers and their real guide targets.
(() => {
 const params=new URLSearchParams(location.search),palette=params.get('palette-review');
 if(!['9d5341','926125','77516e'].includes(palette))return;
 const color='#'+palette;
 const style=document.createElement('style');
 style.textContent=`:root{--guide-accent:${color};--action-green:${color}}#app .travel-frame polygon{fill:${color}!important}
 #app :is(.home-tour button,.clinic-commands button,.shared-guide-note button){background:${color}!important;color:#fff8e9}
 #app .town-scroll-hint{color:${color}!important}
 #app .town-swipe-arrows i{border-color:${color}!important}
 #app :is(.first-guide-ring,.tutorial-ring,.home-tour-focus){border-color:${color}!important}
 #app{pointer-events:none}`;
 document.head.append(style);
 const baseline=JSON.stringify(gameState);
 function setScene(scene){
 titleScreenOpen=false;
 const s=JSON.parse(baseline),cat=getCat(s);
 s.alpha={firstCatId:'palette-preview',seen:{}};
 s.onboarding={...s.onboarding,status:'done',homeTour:'done',appIntro:null,guide:null};
 s.ui={...s.ui,modal:null,layoutMode:false,alphaNotice:null,alphaDestination:null};
 s.campaign={...s.campaign,phase:'room',requiredVisit:null};
 cat.name='むぎ';cat.pattern='kiji';cat.body.litter=0;cat.body.vomit=0;
 if(scene==='guide')s.onboarding.homeTour='clean';
 if(scene==='map'){
  s.campaign.phase='town';townScrollTop=1e6;
  s.onboarding={...s.onboarding,status:'active',townStep:'swipe',flowVersion:1};
 }
 if(scene==='clinic'){
  cat.status='captured';s.campaign={...s.campaign,phase:'shop',shopId:'clinic',clinicReception:true};
  s.onboarding={...s.onboarding,status:'active',flowVersion:1,guide:'firstCommand'};
 }
 gameState=s;
 document.documentElement.dataset.paletteScene=scene;
 }
 setScene(params.get('palette-scene')||'room');
 // No progression or saving from comparison frames; animation remains live.
 dispatch=function(){};
 document.documentElement.dataset.paletteReview=palette;
 window.addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='palette-scene'||!['room','guide','map','clinic'].includes(e.data.scene))return;
  // Remove the previous scroller before the town renderer remembers its position.
  app.replaceChildren();setScene(e.data.scene);render(gameState);
 });
})();

