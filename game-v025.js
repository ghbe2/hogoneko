'use strict';
// Simulation continues behind a sheet. Unchanged visible data keeps the live DOM.
const beforeStableSheets=render;
let stableSheetKey=null,stableSheetContent=null;
function sheetKey(state){return !titleScreenOpen&&state.ui.modal?`${state.campaign.phase}:${state.ui.modal}:${state.ui.modal==='inventory'?state.ui.inventoryTab||'play':''}`:null;}
function sheetContent(state){
 const cat=getCat(state),ui=state.ui;
 if(!['inventory','touchTools','nickname'].includes(ui.modal))return null;
 return JSON.stringify({modal:ui.modal,inventory:state.inventory,durability:state.durability,coins:state.coins,week:state.week,
  cat:{id:cat.id,name:cat.name,nickname:cat.nickname,heart:cat.heart,types:cat.types,status:cat.status},
  selection:[ui.inventoryTab,ui.equippedHand,ui.equippedFood,ui.equippedCleaner,ui.touchMode,ui.equippedContact],layout:ui.layoutMode,holding:ui.holdingCat,care:ui.careAnimation?.id,
  guide:[state.onboarding,ui.guideExpanded],debug:[ui.debugOpen,ui.debugIntakeOpen]});
}
render=function(state){
 const key=sheetKey(state),content=key?sheetContent(state):null;
 const same=!!key&&key===stableSheetKey;
 if(same&&content!==null&&content===stableSheetContent&&app.querySelector('.modal-layer,.release-overlay'))return;
 const root=same?app.querySelector('.modal-layer,.release-overlay'):null;
 const scroll=root?[root,...root.querySelectorAll('*')].filter(n=>n.scrollTop||n.scrollLeft).map(n=>({id:n.id,classes:n.className,top:n.scrollTop,left:n.scrollLeft})):[];
 const inputs=root?[...root.querySelectorAll('input[id],textarea[id]')].map(n=>({id:n.id,value:n.value,focused:n===document.activeElement,start:n.selectionStart,end:n.selectionEnd})):[];
 app.classList.toggle('updating-open-sheet',same);
 beforeStableSheets(state);
 stableSheetKey=key;stableSheetContent=content;
 const newRoot=app.querySelector('.modal-layer,.release-overlay');
 function restoreScroll(){if(!newRoot?.isConnected)return;const nodes=[newRoot,...newRoot.querySelectorAll('*')];for(const item of scroll){const node=item.id?document.getElementById(item.id):nodes.find(n=>n.className===item.classes);if(node){node.scrollTop=item.top;node.scrollLeft=item.left;}}}
 restoreScroll();if(scroll.length)requestAnimationFrame(restoreScroll);
 for(const item of inputs){const node=document.getElementById(item.id);if(!node)continue;node.value=item.value;if(item.focused){node.focus({preventScroll:true});if(item.start!==null)node.setSelectionRange(item.start,item.end);}}
};
const stableSheetStyle=document.createElement('style');stableSheetStyle.textContent=`
.updating-open-sheet .modal-layer .menu-sheet,
.updating-open-sheet .modal-layer .notebook,
.updating-open-sheet .modal-layer .simple-panel,
.updating-open-sheet .release-overlay .release-sheet{animation:none!important}
`;document.head.appendChild(stableSheetStyle);render(gameState);
