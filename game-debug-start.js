'use strict';
// Separate namespace is selected before loading any save in index.html.
const debugPlayParams=new URLSearchParams(location.search);
const debugPlayActive=debugPlayParams.get('debug-play')==='1';
const debugStartArea=debugPlayParams.get('debug-start');
if(debugPlayActive)titleScreenOpen=false;
if(debugPlayActive && Object.hasOwn(STAGE_RULES,debugStartArea)){
 const s=gameState;
 s.album=[];
 for(const id of Object.keys(STAGE_RULES)){
  if(id===debugStartArea)break;
  for(let i=0;i<STAGE_RULES[id].total;i++)s.album.push({catId:`debug-${id}-${i}`,name:'確認用の記録',area:id,outcome:'adopted',day:7});
 }
 s.onboarding={...s.onboarding,status:'done',homeTour:'done',appIntro:null,guide:null,townStep:null,farewellSeen:true};
 s.alpha={...s.alpha,firstCatId:'debug-previous-cat',seen:{}};
 s.coins=100;
 for(const id of ['food_dry','food_wet','water_refill'])s.inventory[id]=10;
 s.flags={...s.flags,starterBought:true};
 gameState=reduceGameState(s,{type:'NEXT_RESCUE'});
 titleScreenOpen=false;
 gameState=reduceGameState(gameState,{type:'CHOOSE_AREA',area:debugStartArea});
 saveGameState(gameState);
 const url=new URL(location.href);url.searchParams.delete('debug-start');url.searchParams.delete('scenario');history.replaceState(null,'',url);
}
const householdDebugModes=['return','two-cats','renovated'];
if(debugPlayActive&&householdDebugModes.includes(debugStartArea)){
 const s=structuredClone(DEFAULT_GAME_STATE);gameState=normalizeLoadedState(migrateReleaseState(s));const c=getCat(gameState);Object.assign(c,{id:'debug-komugi',name:'こむぎ',status:'raising',named:true,heart:75,heartCap:100,permanentResident:true,age:'adult'});Object.assign(c.body,{weight:2600,foodLevel:35,waterLevel:55});
 const second={...structuredClone(c),id:'debug-sumi',name:'すみ',permanentResident:false,heart:35};second.phenotype={...phenotypeFor(c),bodyCoat:'black',headCoat:'black',legCoat:'black',tailCoat:'black'};
 gameState.cats=debugStartArea==='return'?[{...c,status:'candidate'}]:[c,second];gameState.household={renovation:debugStartArea==='renovated'?1:0,pendingReturn:debugStartArea==='return'?structuredClone(c):null};gameState.flags={...gameState.flags,returnedCat:debugStartArea!=='return',starterBought:true};gameState.coins=130;
 gameState.onboarding={...gameState.onboarding,status:'done',homeTour:'done',guide:null,appIntro:null};gameState.alpha={...gameState.alpha,firstCatId:'debug-previous',mail:[]};gameState.campaign={...gameState.campaign,phase:'room',requiredVisit:null};gameState.ui={...gameState.ui,modal:null,alphaNotice:null,alphaMailbox:false};gameState.dailyDiscovery={lastDay:discoveryDay()};
 saveGameState(gameState);const url=new URL(location.href);url.searchParams.delete('debug-start');url.searchParams.delete('scenario');history.replaceState(null,'',url);
}
const debugStyle=document.createElement('style');
debugStyle.textContent=`.clock-debug-bar .debug-start-button{font:11px var(--game-font);padding:0 6px;min-width:42px}.clock-debug-bar:has(.debug-start-button)>span{display:none}.debug-start-dialog{box-sizing:border-box;width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:22px;border:1px solid #cbb995;border-radius:20px;background:#fff8e9;color:#614e3f;font:14px var(--game-font)}.debug-start-dialog::backdrop{background:#30291e88}.debug-start-dialog h2{font-size:18px;margin:0 0 14px}.debug-start-dialog p{line-height:1.7}.debug-start-dialog select,.debug-start-dialog button{box-sizing:border-box;width:100%;min-height:44px;margin-top:10px;font:inherit;border-radius:10px;border:1px solid #b7a588;padding:8px;background:#fff}.debug-start-dialog .debug-launch{background:#667e59;color:white}.debug-start-dialog small{display:block;line-height:1.6;margin-top:10px}`;
document.head.append(debugStyle);
function openDebugStart(){
 if(document.querySelector('.debug-start-dialog'))return;
 const dialog=document.createElement('dialog');dialog.className='debug-start-dialog';dialog.setAttribute('aria-label','進行を省略');
 dialog.innerHTML=`<h2>進行を省略して確認</h2><p>選んだフィールドや、2匹のお世話から確認できます。</p><select aria-label="開始フィールド">${Object.keys(STAGE_RULES).map(id=>`<option value="${id}">${stageName(id)}</option>`).join('')}<option value="return">帰ってきたネコを迎える</option><option value="two-cats">2匹の部屋・改装前</option><option value="renovated">2匹の部屋・改装後</option></select><small>確認専用セーブを新しく作ります。フィールドは100コイン、2匹の確認は130コインを用意。元のプレイ記録は残ります。</small><button class="debug-launch">この場面で開始</button>${debugPlayActive?'<button class="debug-return">元のプレイに戻る</button>':''}<button class="debug-close">閉じる</button>`;
 document.body.append(dialog);dialog.showModal();
 dialog.querySelector('.debug-close').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
 dialog.querySelector('.debug-launch').onclick=()=>{
  const url=new URL(location.href);url.searchParams.delete('scenario');url.searchParams.set('debug-play','1');url.searchParams.set('debug-start',dialog.querySelector('select').value);location.assign(url);
 };
 dialog.querySelector('.debug-return')?.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.delete('debug-play');url.searchParams.delete('debug-start');location.assign(url);});
}
const debugStartButton=document.createElement('button');debugStartButton.className='debug-start-button';debugStartButton.textContent=debugPlayActive?'確認中':'省略';debugStartButton.onclick=openDebugStart;debugStartButton.setAttribute('aria-label','進行を省略するチェックメニュー');
document.querySelector('.clock-debug-bar')?.insertBefore(debugStartButton,document.querySelector('.clock-debug-actions'));
