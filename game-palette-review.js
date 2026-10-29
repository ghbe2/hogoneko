'use strict';
// Read-only fixtures use the real renderers and their real guide targets.
(() => {
 const params=new URLSearchParams(location.search),palette=params.get('palette-review');
 if(!['9d5341','926125','77516e'].includes(palette))return;
 const color='#'+palette,scene=params.get('palette-scene')||'room';
 const style=document.createElement('style');
 style.textContent=`:root{--action-green:${color}}#app .travel-frame polygon{fill:${color}!important}
 #app :is(.home-tour button,.clinic-commands button){background:${color}!important;color:#fff8e9}
 #app .town-scroll-hint{color:${color}!important}
 #app :is(.first-guide-ring,.tutorial-ring,.home-tour-focus){border-color:${color}!important}
 #app .guide-gesture [stroke="#584137"]{stroke:${color}}
 #app{pointer-events:none}`;
 document.head.append(style);
 titleScreenOpen=false;
 const s=gameState,cat=getCat(s);
 s.alpha={firstCatId:'palette-preview',seen:{}};
 s.onboarding={...s.onboarding,status:'done',homeTour:'done',appIntro:null,guide:null};
 s.ui={...s.ui,modal:null,layoutMode:false,alphaNotice:null,alphaDestination:null};
 s.campaign={...s.campaign,phase:'room',requiredVisit:null};
 cat.name='むぎ';cat.pattern='kiji';cat.body.litter=0;cat.body.vomit=0;
 if(scene==='guide')s.onboarding.homeTour='clean';
 if(scene==='map'){
  s.campaign.phase='town';townScrollTop=0;
  s.onboarding={...s.onboarding,status:'active',townStep:'swipe',flowVersion:1};
 }
 if(scene==='clinic'){
  cat.status='captured';s.campaign={...s.campaign,phase:'shop',shopId:'clinic',clinicReception:true};
  s.onboarding={...s.onboarding,status:'active',flowVersion:1,guide:'firstCommand'};
 }
 // No progression or saving from comparison frames; animation remains live.
 dispatch=function(){};
 document.documentElement.dataset.paletteReview=palette;
})();
