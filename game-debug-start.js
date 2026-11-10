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
const debugStyle=document.createElement('style');
debugStyle.textContent=`.clock-debug-bar .debug-start-button{font:11px var(--game-font);padding:0 6px;min-width:42px}.clock-debug-bar:has(.debug-start-button)>span{display:none}.debug-start-dialog{box-sizing:border-box;width:min(340px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:22px;border:1px solid #cbb995;border-radius:20px;background:#fff8e9;color:#614e3f;font:14px var(--game-font)}.debug-start-dialog::backdrop{background:#30291e88}.debug-start-dialog h2{font-size:18px;margin:0 0 14px}.debug-start-dialog p{line-height:1.7}.debug-start-dialog select,.debug-start-dialog button{box-sizing:border-box;width:100%;min-height:44px;margin-top:10px;font:inherit;border-radius:10px;border:1px solid #b7a588;padding:8px;background:#fff}.debug-start-dialog .debug-launch{background:#667e59;color:white}.debug-start-dialog small{display:block;line-height:1.6;margin-top:10px}`;
document.head.append(debugStyle);
function openDebugStart(){
 if(document.querySelector('.debug-start-dialog'))return;
 const dialog=document.createElement('dialog');dialog.className='debug-start-dialog';dialog.setAttribute('aria-label','進行を省略');
 dialog.innerHTML=`<h2>進行を省略して確認</h2><p>チュートリアル完了後、選んだ場所で保護を始めます。</p><select aria-label="開始フィールド">${Object.keys(STAGE_RULES).map(id=>`<option value="${id}">${stageName(id)}</option>`).join('')}</select><small>確認専用セーブを新しく作ります。コイン100枚・餌などを用意。元のプレイ記録は残ります。</small><button class="debug-launch">このフィールドで開始</button>${debugPlayActive?'<button class="debug-return">元のプレイに戻る</button>':''}<button class="debug-close">閉じる</button>`;
 document.body.append(dialog);dialog.showModal();
 dialog.querySelector('.debug-close').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
 dialog.querySelector('.debug-launch').onclick=()=>{
  const url=new URL(location.href);url.searchParams.delete('scenario');url.searchParams.set('debug-play','1');url.searchParams.set('debug-start',dialog.querySelector('select').value);location.assign(url);
 };
 dialog.querySelector('.debug-return')?.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.delete('debug-play');url.searchParams.delete('debug-start');location.assign(url);});
}
const debugStartButton=document.createElement('button');debugStartButton.className='debug-start-button';debugStartButton.textContent=debugPlayActive?'確認中':'省略';debugStartButton.onclick=openDebugStart;debugStartButton.setAttribute('aria-label','進行を省略するチェックメニュー');
document.querySelector('.clock-debug-bar')?.insertBefore(debugStartButton,document.querySelector('.clock-debug-actions'));
