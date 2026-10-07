'use strict';
// A real milestone, with a single persistent charge and resumable presentation.
RELEASE_ECONOMY.surgery=12;
RELEASE_ECONOMY.graduation=6;
const SURGERY_MS=2200;
const surgeryText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function surgeryEligibility(state){
 const cat=getCat(state),goal=cat.age==='kitten'?CONFIG.cat.weightGoal.kitten:CONFIG.stage1.campaign.bodyGoal;
 return {goal,day:cat.body.days+1,dayReady:cat.body.days+1>=5,weightReady:cat.body.weight>=goal,healthy:!cat.body.sick,ready:cat.body.days+1>=5&&cat.body.weight>=goal&&!cat.body.sick};
}
const beforeSurgeryReady=isGraduationReady;
isGraduationReady=state=>getCat(state).surgery?.status==='done'&&beforeSurgeryReady(state);
function finishSurgery(state,now=Date.now()){
 const cat=getCat(state),surgery=cat.surgery;
 if(surgery?.status!=='in_progress'||now-surgery.startedAt<SURGERY_MS)return state;
 const day=cat.body.days+1;
 return {...state,cats:state.cats.map(c=>c.id!==cat.id?c:{...c,surgery:{...surgery,status:'done',completedDay:day,completedAt:now},lifeLog:[...(c.lifeLog||[]).filter(log=>log.kind!=='surgery'),{day,kind:'surgery',title:'手術を終えた',note:'卒業へ、ひとつ前進'}]}),campaign:{...state.campaign,phase:'shop',shopId:'clinic',medicalStage:'receipt',requiredVisit:null},ui:{...state.ui,modal:null}};
}
const beforeSurgeryReducer=reduceGameState;
reduceGameState=function(state,action){
 state=finishSurgery(syncRealTime(state));
 const cat=getCat(state),atClinic=state.campaign.phase==='shop'&&state.campaign.shopId==='clinic';
 if(cat.surgery?.status==='in_progress')return state;
 if(action.type==='FINISH_SURGERY')return state;
 if(action.type==='START_SURGERY'){
  if(!atClinic||cat.status!=='raising'||cat.surgery?.status==='done'||!surgeryEligibility(state).ready)return state;
  if(state.coins<RELEASE_ECONOMY.surgery)return {...state,ui:{...state.ui,modal:'wallet',walletReturn:null}};
  const charged=spendCoins(state,RELEASE_ECONOMY.surgery,'手術');
  return {...charged,cats:charged.cats.map(c=>c.id!==cat.id?c:{...c,surgery:{status:'in_progress',startedAt:Date.now(),startedDay:c.body.days+1,paid:RELEASE_ECONOMY.surgery}}),campaign:{...state.campaign,medicalStage:'procedure'},ui:{...state.ui,modal:null}};
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
 if(state.campaign.shopId!=='clinic'||cat.status!=='raising')return beforeSurgeryShop(state).replace('手術・卒業ケア　<strong>18 コイン</strong>','手術 <strong>12</strong> ／ 卒業ケア <strong>6 コイン</strong>');
 const e=surgeryEligibility(state),medical=cat.surgery,done=medical?.status==='done',busy=medical?.status==='in_progress',poor=state.coins<RELEASE_ECONOMY.surgery;
 const title=busy?'待合室で、少し待とう':done?'ひとつ、乗り越えたね':'卒業への、ひとつの準備';
 const hint=done?'記録を手帳と予定に残しました。':!e.dayReady?'手術の相談は5日目から。今はおうちで過ごそう。':!e.weightReady?`あと${Math.ceil(e.goal-cat.body.weight).toLocaleString('ja-JP')}g。ごはんを食べて、もう少し育とう。`:!e.healthy?'体調が整ってから、もう一度相談しよう。':poor?'準備はできています。足りないコインは広告の支援で補えます。':'からだの準備が整いました。手術をお願いできます。';
 const row=(label,value,ok)=>`<div class="surgery-check"><span class="medical-check ${ok?'ok':''}">${ok?'✓':'○'}</span><span>${label}</span><strong>${value}</strong></div>`;
 const body=`<section class="surgery-sheet ${done?'surgery-done':''} ${busy?'surgery-busy':''}"><div class="surgery-room"><div class="surgery-cat">${renderCatArt(cat)}</div>${busy?'<div class="surgery-curtain"></div><span class="surgery-wait" role="status">手術をお願いしています…</span>':done?'<span class="surgery-stamp">手術済み ✓</span>':''}</div><header><small>${surgeryText(cat.name||'この子')}・保護生活${e.day}日目</small><h1>${title}</h1></header>${busy?'<p class="surgery-copy">ここで待っていよう。</p><div class="surgery-progress"><i></i></div>':done?`<div class="surgery-receipt"><span>手術の記録</span><strong>${medical.completedDay}日目</strong><span>お支払い済み</span><strong>${medical.paid} コイン</strong></div><p class="surgery-copy">${hint}<br>おうちでゆっくり過ごそう。</p>`:`<div class="surgery-checks">${row('日程',e.dayReady?'5日目を迎えました':'5日目から',e.dayReady)}${row('体重',`${Math.round(cat.body.weight).toLocaleString('ja-JP')} / ${e.goal.toLocaleString('ja-JP')}g`,e.weightReady)}${row('体調',e.healthy?'落ち着いています':'準備中',e.healthy)}</div><p class="surgery-copy" role="status">${hint}</p><div class="surgery-price"><span>手術</span><strong>12 コイン</strong><small>所持 ${state.coins} コイン</small></div>`}<small class="medical-footnote">このゲーム内の目安です。現実の手術は獣医師が判断します。</small></section>`;
 const returnHome=state.campaign.requiredVisit||state.campaign.medicalStage;
 const actions=busy?'':done?`<button class="campaign-button" data-action="leave-surgery-clinic">${returnHome?'おうちへ帰ろう':'街へ戻る'}</button>`:`${e.ready?`<button class="campaign-button" data-action="${poor?'open-wallet':'start-surgery'}">${poor?'広告で支援を受け取る':'12コインで手術をお願いする'}</button>`:''}<button class="campaign-button secondary" data-action="leave-surgery-clinic">${!returnHome?'街へ戻る':e.ready?'今日は見送って、おうちへ':'おうちで準備を続ける'}</button>`;
 return renderCampaignShell(state,'動物病院',body,actions);
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
 const identity=template.content.querySelector('.identity-chips');
 if(identity){const chip=document.createElement('span');chip.className='medical-notebook-chip';chip.textContent=cat.surgery?.status==='done'?'手術済み ✓':'手術はこれから';identity.append(chip);}
 return template.innerHTML;
};
const beforeSurgeryGuide=getScreenGuide;
getScreenGuide=function(state){
 if(state.campaign.phase==='shop'&&state.campaign.shopId==='clinic'&&getCat(state).status==='raising')return {title:'からだの準備を確認しよう',detail:'5日目から相談。条件が整えば手術をお願いできます。難しいときは、おうちへ戻って準備できます。'};
 return beforeSurgeryGuide(state);
};
let surgeryTimer=null,surgeryTimerKey=null;
const beforeSurgeryRender=render;
render=function(state){
 beforeSurgeryRender(state);
 const medical=getCat(state).surgery;
 const key=medical?.status==='in_progress'?`${getCat(state).id}:${medical.startedAt}`:null;
 if(key!==surgeryTimerKey){clearTimeout(surgeryTimer);surgeryTimerKey=key;if(key)surgeryTimer=setTimeout(()=>dispatch({type:'FINISH_SURGERY'}),Math.max(0,SURGERY_MS-(Date.now()-medical.startedAt))+50);}
 const room=app.querySelector('.surgery-room');if(room)bookBackground(room,bookCrop(bookScene('clinic',state),'0 100 450 410'));
 if(medical?.status==='in_progress'&&room){const frame=room.closest('.campaign-frame');frame.querySelectorAll('button').forEach(button=>button.disabled=true);}
};
app.addEventListener('click',event=>{
 const action=event.target.closest('[data-action]')?.dataset.action;
 if(action==='start-surgery')dispatch({type:'START_SURGERY'});
 if(action==='leave-surgery-clinic')dispatch({type:'LEAVE_SURGERY_CLINIC'});
});
const surgeryStyle=document.createElement('style');surgeryStyle.textContent=`
.campaign-frame:has(.surgery-sheet) .screen-guide,.campaign-frame:has(.surgery-sheet) .debug-quickbar{display:none}
.campaign-frame:has(.surgery-sheet) .campaign-scroll{padding:12px 18px;display:flex;min-height:0}.surgery-sheet{display:flex;flex-direction:column;gap:10px;width:100%;margin:auto 0;color:#574a38}.surgery-room{position:relative;flex:none;height:clamp(105px,20dvh,180px);background-size:cover;background-position:center;border-radius:20px 16px 24px 12px;overflow:hidden}.surgery-cat{position:absolute;width:125px;height:120px;left:50%;bottom:-2px;transform:translateX(-50%)}.surgery-sheet h1{font-size:clamp(18px,5vw,23px);margin:4px 0;line-height:1.4}.surgery-sheet header>small{color:#8f8069;font-size:11px}.surgery-checks{background:#fffaf0;border-radius:14px;padding:6px 12px}.surgery-check{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px dashed #ded1bd;font-size:12px}.surgery-check:last-child{border:0}.surgery-check strong{margin-left:auto;font-weight:500;font-size:12px}.medical-check{color:#ad9980}.medical-check.ok{color:#6c8869}.surgery-copy{font-size:12px;line-height:1.8;margin:0}.surgery-price{display:flex;gap:12px;align-items:center;font-size:13px}.surgery-price small{margin-left:auto;font-size:11px;color:#8d7d65}.medical-footnote{font-size:9px;color:#9d907e;line-height:1.5}.surgery-stamp{position:absolute;right:12px;top:12px;border:2px solid #6d8667;color:#536e51;background:#fffaf0eb;border-radius:50%;padding:18px 8px;font-size:12px;transform:rotate(8deg);animation:stamp-arrival .4s ease-out}.surgery-receipt{display:grid;grid-template-columns:1fr auto;gap:10px;padding:16px;background:#fffaf0;border-radius:12px;border-bottom:2px dashed #d8c9b4;font-size:13px}.surgery-curtain{position:absolute;inset:0;background:repeating-linear-gradient(90deg,#bac3ac 0 22px,#a4b394 22px 29px);animation:curtain-close .5s ease-out}.surgery-wait{position:absolute;inset:0;display:grid;place-items:center;color:#465c43;font-size:14px}.surgery-progress{height:5px;border-radius:10px;background:#e4dcca;overflow:hidden}.surgery-progress i{display:block;height:100%;background:#8da080;animation:surgery-progress 2.2s linear forwards}.medical-notebook-chip{background:#e2eadb!important;color:#52704c!important}
@keyframes curtain-close{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes surgery-progress{from{width:0}to{width:100%}}@keyframes stamp-arrival{from{opacity:0;transform:scale(1.3) rotate(8deg)}to{opacity:1;transform:scale(1) rotate(8deg)}}
@media(max-height:700px){.surgery-sheet{gap:7px}.surgery-room{height:100px}.surgery-check{padding:6px 0}.campaign-frame:has(.surgery-sheet) .campaign-actions{gap:5px;padding-top:5px}.campaign-frame:has(.surgery-sheet) .campaign-button{padding:10px;min-height:42px;font-size:13px}}
`;document.head.append(surgeryStyle);
// Previous visits were only consultations, not completed operations. Do not invent completion.
gameState=finishSurgery(gameState);gameState=reconcileVisit(gameState);saveGameState(gameState);
