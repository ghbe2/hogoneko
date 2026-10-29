'use strict';
// A real milestone, with a single persistent charge and resumable presentation.
RELEASE_ECONOMY.surgery=12;
RELEASE_ECONOMY.graduation=0;
const SURGERY_MS=2200;
const surgeryText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function surgeryEligibility(state){
 const cat=getCat(state),goal=cat.age==='kitten'?CONFIG.cat.weightGoal.kitten:CONFIG.stage1.campaign.bodyGoal;
 const healthy=!cat.body.sick&&cat.body.days>=(cat.recoveryUntilDay||0);
 return {goal,day:cat.body.days+1,dayReady:cat.body.days+1>=5,weightReady:cat.body.weight>=goal,healthy,ready:cat.body.days+1>=5&&cat.body.weight>=goal&&healthy};
}
const beforeSurgeryReady=isGraduationReady;
isGraduationReady=state=>getCat(state).surgery?.status==='done'&&beforeSurgeryReady(state);
function finishSurgery(state,now=gameNow()){
 const cat=getCat(state),surgery=cat.surgery;
 if(surgery?.status!=='in_progress'||now-surgery.startedAt<SURGERY_MS)return state;
 const day=cat.body.days+1;
 return {...state,cats:state.cats.map(c=>c.id!==cat.id?c:{...c,phenotype:{...phenotypeFor(c),earCut:c.sex==='male'?'right':'left'},surgery:{...surgery,status:'done',completedDay:day,completedAt:now},lifeLog:[...(c.lifeLog||[]).filter(log=>log.kind!=='surgery'),{day,kind:'surgery',title:'手術を終えた',note:'耳カット済み'}]}),campaign:{...state.campaign,phase:'shop',shopId:'clinic',medicalStage:'receipt',requiredVisit:null},ui:{...state.ui,modal:null}};
}
const beforeSurgeryReducer=reduceGameState;
reduceGameState=function(state,action){
 state=finishSurgery(syncRealTime(state));
 const cat=getCat(state),atClinic=state.campaign.phase==='shop'&&state.campaign.shopId==='clinic';
 if(cat.surgery?.status==='in_progress')return state;
 if(action.type==='FINISH_SURGERY')return state;
 if(action.type==='START_SURGERY'){
  if(!atClinic||cat.status!=='raising'||cat.surgery?.status==='done'||!surgeryEligibility(state).ready)return state;
  const charged=spendCoins(state,RELEASE_ECONOMY.surgery,'手術');
  return {...charged,cats:charged.cats.map(c=>c.id!==cat.id?c:{...c,surgery:{status:'in_progress',startedAt:gameNow(),startedDay:c.body.days+1,paid:RELEASE_ECONOMY.surgery}}),campaign:{...state.campaign,medicalStage:'procedure'},ui:{...state.ui,modal:null}};
 }
 if(['LEAVE_SURGERY_CLINIC','CONFIRM_CLINIC_VISIT'].includes(action.type)){
  if(!atClinic||cat.status!=='raising')return state;
  const day=cat.body.days+1;
  const phase=state.campaign.requiredVisit||state.campaign.medicalStage?'room':'town';
  const next={...state,cats:state.cats.map(c=>c.id===cat.id&&day>=5&&c.surgery?.status!=='done'?{...c,surgery:{...c.surgery,checkedDay:day},surgeryVisitDay:day}:c),campaign:{...state.campaign,phase,requiredVisit:null,medicalStage:null},ui:{...state.ui,modal:null}};
  return reconcileVisit(next);
 }
 let next=beforeSurgeryReducer(state,action);
 if(action.type==='NEXT_RESCUE'&&next!==state)next={...next,cats:next.cats.map(c=>({...c,surgery:null,lifeLog:[]})),campaign:{...next.campaign,medicalStage:null}};
 return next;
};
const beforeSurgeryShop=renderMapShop;
renderMapShop=function(state){
 const cat=getCat(state);
 if(state.campaign.shopId!=='clinic'||cat.status!=='raising')return beforeSurgeryShop(state);
 const e=surgeryEligibility(state),medical=cat.surgery,done=medical?.status==='done',busy=medical?.status==='in_progress',poor=state.coins<RELEASE_ECONOMY.surgery;
 const title=busy?'耳に、小さな目印を':done?'不妊去勢手術が終わりました':'TNRへ、不妊去勢手術の準備';
 const plan=carePlan(cat),booked=!!plan.surgeryDay;
 const hint=done?`譲渡会は${medical.completedDay+2}日目。おうちでゆっくり過ごそう。`:!e.healthy?'体調が整ってから申し込みましょう。':!e.weightReady?`目標は2,000g。あと${Math.ceil(e.goal-cat.body.weight).toLocaleString('ja-JP')}gです。`:cat.age==='kitten'?'まずは最初の１週間、子猫の成長を見守りましょう。':e.dayReady?'今日は手術の日。ごはんをお休みして来院できました。':booked?`${plan.surgeryDay}日目の手術を予約しました。予約中は、ごはんをお休みします。`:e.day+1<e.minDay?`手術は最短${e.minDay}日目。おうちで落ち着く時間も必要です。`:'アプリから翌日の手術を予約できます。予約後はごはんを休み、当日も2,000g以上・体調良好が条件です。';
 const row=(label,value,ok)=>`<div class="surgery-check"><span class="medical-check ${ok?'ok':''}">${ok?'✓':'○'}</span><span>${label}</span><strong>${value}</strong></div>`;
const body=`<section class="surgery-sheet ${done?'surgery-done':''} ${busy?'surgery-busy':''}"><div class="surgery-room"><div class="surgery-cat">${renderCatArt(cat)}</div>${busy?'<span class="surgery-snip" aria-hidden="true"><i></i><b>ぱっちん</b></span>':done?'<span class="surgery-stamp">手術済み ✓</span>':''}</div><header><small>${surgeryText(cat.name||'この子')}・保護生活${e.day}日目</small><h1>${title}</h1></header>${busy?'<p class="surgery-copy" role="status">不妊去勢手術を終えた目印に、<br>耳に小さなカットを。</p>':done?`<div class="surgery-receipt"><span>手術の記録</span><strong>${medical.completedDay}日目</strong><span>${state.coins<0?'医療費（未払いあり）':'お支払い済み'}</span><strong>${medical.paid} コイン</strong></div><p class="surgery-copy">${hint}</p>`:`<div class="surgery-checks">${row('体重',`${Math.round(cat.body.weight).toLocaleString('ja-JP')} / ${e.goal.toLocaleString('ja-JP')}g`,e.weightReady)}${row('体調',e.healthy?'落ち着いています':'準備中',e.healthy)}</div><p class="surgery-copy" role="status">${hint}</p><div class="surgery-price"><span>手術</span><strong>12 コイン</strong><small>所持 ${state.coins} コイン</small></div>`}<small class="medical-footnote">このゲーム内の目安です。現実の手術は獣医師が判断します。</small></section>`;
 const returnHome=state.campaign.requiredVisit||state.campaign.medicalStage;
 const primary=e.canBook?'<button class="campaign-button" data-action="book-surgery">明日の手術を予約する</button>':e.dayReady?`<button class="campaign-button" data-action="start-surgery">${!e.ready?'今日は見合わせる':poor?'手術する（不足分は未払い）':'コイン12枚で手術する'}</button>`:'';
 const actions=busy?'':done?'<button class="campaign-button" data-action="leave-surgery-clinic">おうちへ帰ろう</button>':primary+'<button class="campaign-button secondary" data-action="leave-surgery-clinic">おうちへ戻る</button>';
 const template=document.createElement('template');template.innerHTML=body;
 const sheet=template.content.firstElementChild,room=sheet.querySelector('.surgery-room');room.remove();
 const heading=sheet.querySelector('header');heading.remove();
 const footnote=sheet.querySelector('.medical-footnote');footnote.remove();
 sheet.querySelector('.surgery-price')?.remove();
 const content=sheet.innerHTML;
 sheet.innerHTML=`${heading.outerHTML}<div class="surgery-information">${content}</div><div class="surgery-actions">${actions||'<p role="status">そのままお待ちください</p>'}</div>`;
 return renderCampaignShell(state,'動物病院',`<div class="surgery-scene">${room.outerHTML}${sheet.outerHTML}</div>`,'');
};
const beforeSurgerySchedule=renderSchedule;
renderSchedule=function(state,cat){
 const template=document.createElement('template');template.innerHTML=beforeSurgerySchedule(state,cat);
 const day5=[...template.content.querySelectorAll('.timeline-card')].find(n=>n.querySelector('small')?.textContent.match(/^5日目/));
 if(day5){day5.querySelector('strong').textContent=cat.surgery?.status==='done'?'手術の準備・確認':'手術の目標';day5.querySelector('span').textContent=cat.surgery?.status==='done'?`${cat.surgery.completedDay}日目に手術済み`:`体重${surgeryEligibility(state).goal}g以上・12コイン`;}
 const completed=[...template.content.querySelectorAll('.timeline-card')].find(n=>n.querySelector('small')?.textContent.match(new RegExp(`^${cat.surgery?.completedDay}日目`)));
 if(cat.surgery?.status==='done'&&completed){completed.querySelector('strong').textContent=cat.surgery.completedDay===CONFIG.stage1.adoptionEventDay?'手術完了・譲渡会':'手術を終えた ✓';completed.querySelector('span').textContent='卒業へ、ひとつ前進';completed.classList.remove('quiet');}
 const go=template.content.querySelector('[data-action="go-event"]');
 if(go&&cat.surgery?.status!=='done'){go.disabled=true;go.textContent='先に病院で手術を終えよう';}
 return template.innerHTML;
};
const beforeSurgeryNotebook=renderNotebook;
renderNotebook=function(state,cat){
 const template=document.createElement('template');template.innerHTML=beforeSurgeryNotebook(state,cat);
 const header=template.content.querySelector('.notebook-head');
 if(header){header.style.cssText='display:flex;align-items:center;justify-content:space-between;flex:none;min-height:52px;padding:4px 12px 4px 38px';header.insertAdjacentHTML('beforeend','<button class="notebook-close" data-action="close-modal" style="min-height:44px;min-width:64px;border:0;border-radius:22px;background:#637d59;color:white">閉じる</button>');}
 const identity=template.content.querySelector('.identity-chips');
 if(identity){const chip=document.createElement('span');chip.className='medical-notebook-chip';chip.textContent=cat.surgery?.status==='done'?'手術済み ✓':'手術はこれから';identity.append(chip);}
 return template.innerHTML;
};
const beforeSurgeryGuide=getScreenGuide;
getScreenGuide=function(state){
 if(state.campaign.phase==='shop'&&state.campaign.shopId==='clinic'&&getCat(state).status==='raising')return {title:'からだの準備を確認しよう',detail:'体重2,000g以上・体調良好になったら、翌日の手術を申し込めます。'};
 return beforeSurgeryGuide(state);
};
let surgeryTimer=null,surgeryTimerKey=null;
const beforeSurgeryRender=render;
render=function(state){
 beforeSurgeryRender(state);
 const medical=getCat(state).surgery;
 const key=medical?.status==='in_progress'?`${getCat(state).id}:${medical.startedAt}`:null;
 if(key!==surgeryTimerKey){clearTimeout(surgeryTimer);surgeryTimerKey=key;if(key)surgeryTimer=setTimeout(()=>dispatch({type:'FINISH_SURGERY'}),Math.max(0,SURGERY_MS-(gameNow()-medical.startedAt))+50);}
 const room=app.querySelector('.surgery-room');
 if(room){room.style.setProperty('--clinic-wall',state.season==='winter'?'#d6ddd0':'#d4dcc6');room.insertAdjacentHTML('afterbegin','<div class="surgery-setting" aria-hidden="true"><span class="surgery-poster">診察室<i></i><i></i><i></i></span><span class="surgery-window"></span><span class="surgery-table"></span></div>');}
 const snip=app.querySelector('.surgery-snip');
 if(snip&&medical?.startedAt){
  // Cat's left ear is viewer-right in the front-facing rig (earCut:'left').
  const ear=room.querySelector(getCat(state).sex==='male'?'[data-part="innerL"]':'[data-part="innerR"]')||room.querySelector('.surgery-cat');
  const r=room.getBoundingClientRect(),e=ear.getBoundingClientRect();
  snip.style.left=(e.left+e.width/2-r.left)+'px';snip.style.top=(e.top+e.height/3-r.top)+'px';
  snip.querySelector('b').style.top=Math.max(-28,8-parseFloat(snip.style.top))+'px';
  snip.style.animationDelay=`-${Math.max(0,gameNow()-medical.startedAt)}ms`;
 }
 if(medical?.status==='in_progress'&&room){const frame=room.closest('.campaign-frame');frame.querySelectorAll('button').forEach(button=>button.disabled=true);}
};
app.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='start-surgery')dispatch({type:'START_SURGERY'});
 if(action==='leave-surgery-clinic')dispatch({type:'LEAVE_SURGERY_CLINIC'});
});
const surgeryStyle=document.createElement('style');surgeryStyle.textContent=`
.campaign-frame:has(.surgery-sheet) .screen-guide,.campaign-frame:has(.surgery-sheet) .debug-quickbar{display:none}
#app .campaign-screen:has(.surgery-scene){position:relative;min-height:0;padding:0}
#app .campaign-scroll:has(>.surgery-scene){position:absolute;inset:0;padding:0;display:block}
#app .campaign-screen:has(.surgery-scene)>.campaign-actions{display:none}
.surgery-scene{position:absolute;inset:0;--surgery-panel:280px;background:#d4dcc6;color:#574a38}
.surgery-room{position:absolute;inset:0;border-radius:0;overflow:hidden;background:linear-gradient(var(--clinic-wall) 0 64%,#cbb493 64%)}
.surgery-setting{position:absolute;left:0;right:0;top:0;height:calc(100% - var(--surgery-panel) - 14px)}
.surgery-poster{position:absolute;left:7%;top:14%;width:23%;padding:10px 8px;background:#f4efd9;color:#7c8969;font-size:12px;transform:rotate(-2deg)}.surgery-poster i{display:block;height:3px;margin-top:8px;background:#bbc6a7;width:80%}.surgery-poster i:last-child{width:55%}
.surgery-window{position:absolute;right:7%;top:10%;width:29%;height:38%;border:7px solid #efe8ce;background:linear-gradient(90deg,transparent 47%,#efe8ce 47% 53%,transparent 53%),#aac6bd}
.surgery-table{position:absolute;left:14%;right:14%;bottom:0;height:18%;border-top:12px solid #71866c;background:linear-gradient(90deg,transparent 5%,#8f8467 5% 9%,transparent 9% 91%,#8f8467 91% 95%,transparent 95%)}
.surgery-cat{position:absolute;left:50%;bottom:calc(var(--surgery-panel) + 14px + (100% - var(--surgery-panel) - 14px)*.18);width:160px;height:calc((100% - var(--surgery-panel) - 14px)*.72);max-height:230px;transform:translateX(-50%)}
.surgery-cat .game-cat-svg{width:100%;height:100%!important}
.surgery-sheet{position:absolute;left:10px;right:10px;bottom:14px;height:var(--surgery-panel);padding:14px;display:grid;grid-template-rows:52px minmax(0,1fr) 48px;gap:8px;margin:0;background:#fff8e9f5;border:1px solid #fffaf0;border-radius:22px;box-shadow:0 4px 14px #63513620}
.surgery-sheet h1{font-size:20px;line-height:1.4;margin:4px 0}.surgery-sheet header>small{font-size:11px;color:#89765c}
.surgery-information{display:flex;flex-direction:column;gap:8px;min-height:0}
.surgery-checks{background:#ecefdc;border-radius:12px;padding:4px 10px}
.surgery-check{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px dashed #c9cbb6;font-size:12px;line-height:18px}
.surgery-check:last-child{border:0}.surgery-check strong{margin-left:auto;font-size:12px;font-weight:500}
.medical-check{color:#ad9980}.medical-check.ok{color:#637c52}
.surgery-copy{font-size:12px;line-height:1.5;margin:0}
.surgery-price{display:flex;align-items:center;gap:10px;font-size:13px}.surgery-price small{margin-left:auto;font-size:11px}
.surgery-actions{display:flex;gap:8px;align-items:stretch}
#app .surgery-actions>.campaign-button{flex:1;min-width:0}
.surgery-actions>p{width:100%;font-size:13px;text-align:center;margin:auto 0}
.surgery-receipt{display:grid;grid-template-columns:1fr auto;gap:10px;padding:12px;background:#ecefdc;border-radius:12px;font-size:13px}
.surgery-stamp{position:absolute;right:14px;top:14px;background:#fff8e9e8;padding:8px 14px;border:1px solid #829373;border-radius:18px;color:#526b46;font-size:12px}
.surgery-snip{position:absolute;pointer-events:none;z-index:3;animation:ear-snip 2.2s linear both;transform-origin:center}.surgery-snip i{display:block;width:26px;height:26px;background:#fff6cf;clip-path:polygon(50% 0,60% 35%,100% 25%,72% 54%,100% 85%,60% 69%,43% 100%,38% 65%,0 75%,26% 49%,0 20%,38% 32%);transform:translate(-50%,-50%)}.surgery-snip b{position:absolute;left:12px;top:-28px;white-space:nowrap;background:#fff8e9;color:#806442;padding:5px 10px;border-radius:14px;font-size:14px;font-weight:500;box-shadow:0 2px 0 #b6a98255}
.medical-notebook-chip{background:#e2eadb!important;color:#52704c!important}
@keyframes ear-snip{0%,53%{opacity:0;scale:.7}59%{opacity:1;scale:1.16}68%,96%{opacity:1;scale:1}100%{opacity:0;scale:1}}
@media(prefers-reduced-motion:reduce){.surgery-snip{animation:none;opacity:1}}
@media(max-height:650px){.surgery-sheet{padding:12px;gap:6px}.surgery-information{gap:6px}.surgery-sheet h1{font-size:18px}}
`;document.head.append(surgeryStyle);
// Previous visits were only consultations, not completed operations. Do not invent completion.
gameState=finishSurgery(gameState);gameState=reconcileVisit(gameState);saveGameState(gameState);
