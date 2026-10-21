'use strict';
let roomPreparationOpen=false;
function roomActionArt(kind){const art={play:'<path d="M18 49L41 16" stroke="#967853" stroke-width="4"/><path d="M41 16q15 7 6 17" fill="none" stroke="#967853"/><path d="M48 27q-17 0-13 18 14 0 17-13" fill="#bc886c"/><path d="M48 29L38 42" stroke="#f5dfb6" stroke-width="2"/>',clean:'<path d="M39 13L26 42" stroke="#967853" stroke-width="4"/><path d="M23 34L13 51q12 9 24 1l-4-16Z" fill="#c5a66d"/><path d="M23 41l-4 12m9-11-1 13" stroke="#967853"/><path d="M43 42h13l5 12H40Z" fill="#809481"/><path d="M49 42V29" stroke="#809481" stroke-width="4"/>',app:'<rect x="22" y="10" width="28" height="47" rx="6" fill="#526f63"/><rect x="25" y="15" width="22" height="34" rx="3" fill="#fffaf0"/><path d="M36 29c-8-10-16 3 0 13 16-10 8-23 0-13" fill="#c8878d"/><path d="M32 53h8" stroke="#e8eadb" stroke-width="2"/>',layout:'<path d="M17 34V24q0-5 6-5h25q6 0 6 5v10" fill="#9daa88"/><rect x="13" y="31" width="45" height="20" rx="5" fill="#829573"/><path d="M20 51v6m31-6v6M20 37h31" stroke="#6a7a5c" stroke-width="3"/>',food:'<ellipse cx="36" cy="33" rx="23" ry="9" fill="#e3d0a4"/><path d="M13 33l6 17q17 9 34 0l6-17q-23 13-46 0" fill="#b98570"/><ellipse cx="36" cy="32" rx="17" ry="5" fill="#8b7453"/>',items:'<path d="M24 24v-6q12-13 24 0v6" fill="none" stroke="#8c765b" stroke-width="4"/><path d="M18 23h36l3 32H15Z" fill="#c5a375"/><path d="M21 27h30v17H21Z" fill="#e9d7b0"/><path d="M31 32h10v8H31Z" fill="#81947c"/>'};return `<svg class="room-action-art" viewBox="0 0 72 72" aria-hidden="true"><path d="M8 25Q10 8 31 7Q57 3 64 25Q71 49 53 61Q30 72 12 55Q2 44 8 25Z" fill="#faf0d9"/><path d="M13 55q21 15 42 2" fill="none" stroke="#d6bf96" stroke-width="2"/>${art[kind]||art.items}</svg>`;}
const adoptedRoomInterfaceRender=render;
const callPerson='<svg viewBox="0 0 80 96" aria-hidden="true"><path d="M80 11Q58 5 55 22Q29 17 28 42Q9 51 20 74L19 96H80Z" fill="#faf0d9"/><path d="M73 83H30q1-23 17-27l-1-9q-10-4-10-15 0-16 16-16t15 15l4 7-7 3q-1 10-12 10v5q19 5 21 27" fill="#b98d70"/><path d="M49 69L32 43l-7 3 13 30" fill="#b98d70"/><path d="M27 29l-9-4m7 14H13m18-19-5-7" stroke="#6e8567" stroke-width="3" stroke-linecap="round"/></svg>';
function roomTravelArt(home){return `<svg viewBox="0 0 112 112" aria-hidden="true"><path d="M0 0H94Q108 13 88 27Q95 44 71 49Q67 70 43 66Q45 87 22 89Q9 98 0 101Z" fill="#bfcba7"/><path d="M0 75Q30 73 36 48T76 0M36 48Q59 60 77 39" fill="none" stroke="#f9ebcd" stroke-width="10"/><path d="M9 21l19-14 19 14-3 3H12Z" fill="#b77f62"/><path d="M14 23h28v25H14Z" fill="#fff4da"/><path d="M25 34h9v14h-9M18 28h5v6h-5" fill="#7a9584"/><path d="M56 29l15-12 16 12Z" fill="#8c9d7b"/><path d="M60 29h23v20H60Z" fill="#fff4da"/><path d="M64 34h6v7h-6m10-7h5v7h-5" fill="#a8c4b8"/><path d="M12 53v17M53 8v12" stroke="#8d8567" stroke-width="3"/><path d="M4 57q-3-15 8-17 13 0 11 16-9 9-19 1M44 11Q42 0 53 0q12 2 9 13-10 5-18-2" fill="#819775"/><path d="M2 85Q22 77 46 84l-4 18H0Z" fill="#faf0d9"/><text x="10" y="97" font-size="14" font-weight="bold" fill="#5c654b">${home?'家へ':'街へ'}</text></svg>`;}
render=function(state){
 adoptedRoomInterfaceRender(state);if(titleScreenOpen)return;
 const phase=state.campaign.phase,room=phase==='room',intake=phase==='intake';
 if(room||intake){
  const stage=app.querySelector('.stage,.intake-layout');if(!stage)return;stage.classList.add('new-room-ui');
  const menu=app.querySelector('.bottom-menu');
  const top=document.createElement('nav');top.className='room-icon-menu';top.setAttribute('aria-label','部屋のメニュー');
  const appButton=menu?.querySelector('[data-action="open-notebook"]');
  if(appButton&&!intake){appButton.innerHTML=roomActionArt('app')+'<span class="label">アプリ</span>';top.append(appButton);}
  const layout=app.querySelector('[data-action="toggle-layout"]');if(layout&&!state.ui.layoutMode){layout.classList.remove('layout-tray-toggle');layout.innerHTML=roomActionArt('layout')+'<span class="label">模様替え</span>';top.append(layout);}
  stage.append(top);if(menu)menu.remove();
  app.querySelector('.game-frame>.controls')?.remove();
  if(!state.ui.layoutMode){
   const call=app.querySelector('[data-action="call-cat"],.intake-footer-call');
   if(call&&(!intake||getCat(state).named)){call.classList.add('room-call-icon');call.innerHTML=callPerson+'<span>よぶ</span>';stage.append(call);}
   const dock=app.querySelector('.command-dock');if(dock){
    const food=dock.querySelector('[data-tab="food"]'),touch=dock.querySelector('[data-action="touch-now"]');
    dock.querySelector('.sub-command-row')?.remove();
    const tray=document.createElement('section');tray.className='room-preparation'+(roomPreparationOpen?'':' folded');
    const items=document.createElement('div');items.className='room-preparation-items';
    for(const kind of ['play','clean']){const control=dock.querySelector(`[data-tab="${kind}"]`);if(control)control.innerHTML='<span class="command-emoji">'+roomActionArt(kind)+'</span><strong>'+(kind==='play'?'あそぶ':'そうじ')+'</strong>';}
    if(food){food.classList.remove('main-command');food.innerHTML='<span class="command-emoji">'+roomActionArt('food')+'</span><strong>ごはん</strong>';items.append(food);}
    const belongings=document.createElement('button');belongings.dataset.action='open-slot-menu';belongings.dataset.tab='touch';belongings.className='command-slot';belongings.innerHTML=roomActionArt('items')+'<strong>もちもの</strong>';items.append(belongings);items.inert=!roomPreparationOpen;
    const toggle=document.createElement('button');toggle.dataset.roomFold='';toggle.innerHTML='<span>準備</span><b>'+(roomPreparationOpen?'‹':'›')+'</b>';toggle.setAttribute('aria-label','お世話の準備を開閉');toggle.setAttribute('aria-expanded',String(roomPreparationOpen));tray.append(items,toggle);stage.append(tray);
   }
  }
 }
 if(['room','town','shop'].includes(phase)&&!state.ui.modal&&!state.ui.layoutMode){
  const travel=document.createElement('button');travel.className='room-travel-icon';travel.dataset.action=phase==='town'?'go-home':phase==='room'?'open-outing':'back-town';travel.setAttribute('aria-label',phase==='town'?'家へ':'街へ');travel.innerHTML=roomTravelArt(phase==='town');app.append(travel);app.querySelectorAll('.reception-exit,.store-exit').forEach(n=>n.remove());
 }
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-room-fold]');if(!b)return;roomPreparationOpen=!roomPreparationOpen;const tray=b.parentElement;tray.classList.toggle('folded',!roomPreparationOpen);tray.querySelector('.room-preparation-items').inert=!roomPreparationOpen;b.querySelector('b').textContent=roomPreparationOpen?'‹':'›';b.setAttribute('aria-expanded',String(roomPreparationOpen));});
