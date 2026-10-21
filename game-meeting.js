'use strict';
function nextCallName(cat,random=Math.random){
 const name=String(cat.name||'ネコ'),letters=Array.from(name),short=letters.slice(0,Math.max(1,letters.length-1)).join('');
 const choices=[name,name+'ちゃん',name+'くん',short,short+'ちゃん',short+'くん',letters[0]+letters[0],short+short].filter((v,i,a)=>v!==getCallName(cat)&&a.indexOf(v)===i&&v.length<=8);
 return choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]||name;
}
// October client review. Spawn tuning is only applied when a new trap is opened.
const RESCUE_PROFILES={
 a1:{kitten:0,condition:0,families:['tabby','black','white'],variants:0,rare:false},
 a2:{kitten:.35,condition:0,families:['tabby','black','white','tux','cream'],variants:1,rare:false},
 a3:{kitten:.35,condition:.4,families:['tabby','black','white','tux','cream','tortie','calico'],variants:2,rare:false},
 a4:{kitten:.35,condition:.4,families:null,variants:Infinity,rare:true}
};
function stageCoats(area){const rule=RESCUE_PROFILES[area]||RESCUE_PROFILES.a1;return Object.keys(CatSVG.coats).filter(id=>{const c=CatSVG.coats[id];return (!rule.families||rule.families.includes(c.family))&&c.variant<=rule.variants&&(rule.rare||!c.rare);});}
function stageCat(cat,area,random=Math.random,coatPool=stageCoats(area)){
 const rule=RESCUE_PROFILES[area]||RESCUE_PROFILES.a1,pool=coatPool,pick=()=>pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];
 const age=random()<rule.kitten?'kitten':'adult',condition=random()<rule.condition?(random()<.5?'injury':'illness'):null;
 const base=phenotypeFor(cat),bodyCoat=pick(),phenotype={...base,age,earCut:'none',bodyCoat};
 for(const part of ['headCoat','legCoat','tailCoat'])phenotype[part]=random()<.9?bodyCoat:pick();
 const meta=CatSVG.coats[bodyCoat],heart=condition?30:50;
 return {...cat,age,estimatedAgeMonths:age==='kitten'?4:24,rescueArea:area,phenotype,coatLabel:meta.label,eyeColor:phenotype.eyeColor,
  sex:Object.values(phenotype).some(id=>['calico','tortie'].includes(CatSVG.coats[id]?.family))?'female':cat.sex,
  pattern:({tabby:'kiji',tortie:'sabi',calico:'mike',tux:'hachiware',black:'kuro',white:'shiro',cream:'cha'})[meta.family],
  rescueProfile:{condition,heart},trustGainRate:condition ? .65 : 1,heart,body:{...cat.body,sick:!!condition,weight:age==='kitten'?(condition?650:680):(condition?2800:3100)}};
}
// Keep the water item for old saves and pouring animation, but never in food choices.
if(gameState.ui.equippedFood==='water_refill')gameState.ui.equippedFood='starter_food';
SHOP_CATALOG.forEach(p=>p.shop='petshop');
CONFIG.town.areas.find(a=>a.id==='a3').label='路地裏';
const meetingInventory=renderInventory;
renderInventory=function(state){const foods=CONFIG.stage1.foods;CONFIG.stage1.foods=foods.filter(f=>!f.water);try{return meetingInventory(state);}finally{CONFIG.stage1.foods=foods;}};
const meetingReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='EXECUTE_CONTACT'&&action.contact==='call'&&state.campaign.phase==='room'&&!state.ui.modal){
  const cat=getCat(state),now=Date.now(),streak=now-(cat.lastCalledAt||0)<10000?(cat.callStreak||0)+1:1;
  const nickname=streak>=3&&Math.random()<.3?nextCallName(cat):cat.nickname;
  const named={...state,cats:state.cats.map(c=>c===cat?{...c,nickname,callStreak:streak,lastCalledAt:now}:c)};
  const next=meetingReducer(named,action);
  return next;
 }
 if(state.ui.equippedFood==='water_refill')state={...state,ui:{...state.ui,equippedFood:'starter_food'}};
 if(action.type==='OPEN_SUPPLIES')return meetingReducer({...state,campaign:{...state.campaign,phase:'shop',shopId:'petshop',shopReturnPhase:state.campaign.phase},ui:{...state.ui,modal:null,layoutMode:false,shopTab:action.tab||'food'}},{type:'CLEAR_MESSAGE'});
 if(action.type==='BACK_TO_TOWN'&&state.campaign.phase==='shop'&&['room','intake'].includes(state.campaign.shopReturnPhase))return {...state,campaign:{...state.campaign,phase:state.campaign.shopReturnPhase,shopReturnPhase:null},ui:{...state.ui,modal:null,layoutMode:false}};
 if(action.type==='OPEN_MAP_SHOP'){
  const cat=getCat(state);
  state={...state,campaign:{...state.campaign,shopReturnPhase:null}};
 }
 if(action.type==='OPEN_MAP_SHOP'&&action.shopId==='super')action={...action,shopId:'petshop'};
 if(action.type==='GO_SURGERY'){
  if(getCat(state).status!=='raising'||!surgeryEligibility(state).ready||getCat(state).surgery?.status==='done')return state;
  return {...state,campaign:{...state.campaign,phase:'shop',shopId:'clinic',medicalStage:'consult',requiredVisit:null},ui:{...state.ui,modal:null,layoutMode:false}};
 }
 if(action.type==='TREAT_CAT'){
  if(state.campaign.phase!=='shop'||state.campaign.shopId!=='clinic'||!getCat(state).body.sick)return state;
  if(state.coins<CONFIG.care.clinic.cost)return {...state,ui:{...state.ui,modal:'wallet'}};
  const charged=spendCoins(state,CONFIG.care.clinic.cost,'診察・治療');return {...charged,cats:charged.cats.map((c,i)=>i?c:{...c,body:{...c.body,sick:false}})};
 }
 let next=meetingReducer(state,action);
 if(action.type==='OPEN_TRAP'&&state.campaign.phase==='field'&&next.campaign.phase==='trapInspect')next={...next,cats:[state.campaign.encounter?.cat||stageCat(getCat(next),state.campaign.area||'a1')]};
 if(action.type==='START_INTAKE'&&next.campaign.phase==='intake'){
  const prior=getCat(state);next={...next,cats:next.cats.map(c=>({...c,heart:prior.rescueProfile?.heart??c.heart,recoveryUntilDay:prior.rescueProfile?.condition?2:0})),ui:{...next.ui,layoutMode:false,layoutTrayOpen:false}};
 }
 if(action.type==='NEXT_RESCUE'&&next!==state)next={...next,cats:next.cats.map(c=>({...c,rescueProfile:null,trustGainRate:1,recoveryUntilDay:0}))};
 return next;
};
const meetingClinic=renderClinic;
renderClinic=function(state,cat){let html=meetingClinic(state,cat);if(cat.rescueProfile?.condition)html=html.replace('大きな異常はありません',cat.rescueProfile.condition==='injury'?'怪我の手当てをしました':'体調のケアをしました').replace('少し緊張しています。静かな部屋で、キャリーから自分で出てくるのを待ちます。','初診で治療済み。おうちで2日間、静かに回復を見守ろう。');return html;};
const meetingShop=renderMapShop;
renderMapShop=function(state){
 return meetingShop(state);
};
const meetingRender=render;
render=function(state){
 meetingRender(state);
 if(titleScreenOpen)return;
 const touchButton=app.querySelector('[data-action="touch-now"]'),callButton=app.querySelector('[data-action="call-cat"]');
 if(touchButton){touchButton.setAttribute('aria-label','手に持つ道具を選ぶ');touchButton.querySelector('strong').textContent='どうぐ';}
 if(callButton)callButton.setAttribute('aria-label',getCallName(getCat(state))+'を呼ぶ');
 app.querySelectorAll('.touch-switch-hint').forEach(n=>n.remove());
 if(state.campaign.shopId==='petshop'&&state.campaign.phase==='shop'){
  app.querySelector('.campaign-place>strong')?.remove();
  const back=app.querySelector('[data-action="back-town"]');if(back&&['intake','room'].includes(state.campaign.shopReturnPhase))back.textContent='おうちへ戻る';
 }
 app.querySelectorAll('.home-surgery-status,[aria-label="手術の準備"].release-overlay').forEach(n=>n.remove());
};
app.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(!b||b.disabled)return;const type={'open-surgery-check':'OPEN_SURGERY_CHECK','go-surgery':'GO_SURGERY','treat-cat':'TREAT_CAT'}[b.dataset.action];if(type)dispatch({type});});
const meetingStyle=document.createElement('style');meetingStyle.textContent=`

`;document.head.append(meetingStyle);
