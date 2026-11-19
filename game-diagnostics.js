'use strict';
// Local, bounded operation history. No typed text, names or full save data.
window.GameDebugLog=(()=>{
 const key=SAVE_KEY+'_operation_trace';let events=[];
 try{events=JSON.parse(localStorage.getItem(key)||'[]').slice(-60)}catch{}
 function snapshot(){return {phase:gameState.campaign.phase,guide:gameState.onboarding.guide||gameState.onboarding.homeTour,modal:gameState.ui.modal,hidden:document.hidden,viewport:[innerWidth,innerHeight],navigationBusy:typeof guideNavigationBusy!=='undefined'&&!!guideNavigationBusy,drag:!!(typeof dragDraft!=='undefined'&&dragDraft),command:!!(typeof commandDraft!=='undefined'&&commandDraft),pan:!!(typeof panDraft!=='undefined'&&panDraft),holding:!!gameState.ui.holdingCat,overlays:[...document.querySelectorAll('.modal-layer,.first-guide,.alpha-layer,.guide-transition')].map(n=>n.className).slice(0,6)};}
 function add(type,detail){events.push({at:Date.now(),type,detail,state:snapshot()});if(events.length>100)events.shift();}
 function persist(){try{localStorage.setItem(key,JSON.stringify(events.slice(-60)))}catch{}}
 const previous=dispatch;dispatch=function(action){add('action',action.type);try{return previous(action)}catch(error){add('exception',String(error));persist();throw error}};
 for(const type of ['pointerdown','pointerup','pointercancel'])document.addEventListener(type,event=>{if(event.target.closest?.('.alpha-report,input,textarea'))return;const n=event.target.closest?.('[data-action],[data-first],[data-store],button');add(type,{pointer:event.pointerType,target:n?.dataset.action||n?.dataset.first||n?.dataset.store||n?.tagName||event.target.tagName,x:Math.round(event.clientX),y:Math.round(event.clientY)});},true);
 window.addEventListener('error',e=>{add('error',e.message);persist()});window.addEventListener('unhandledrejection',e=>{add('rejection',String(e.reason));persist()});
 window.addEventListener('blur',()=>{add('blur');persist()});window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{add('visibility');persist()});add('loaded');
 return {read:()=>events.slice(-80)};
})();
