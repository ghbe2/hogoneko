'use strict';
// Durable action checkpoints, independent of presentation/dialogue cursors.
const FIRST_ACTIVITY = Object.freeze({version:1, starterSetPrice:10});
function tutorialProgress(state){
 const old=state.onboarding?.progress;
 if(old?.version===FIRST_ACTIVITY.version)return old;
 return {version:1,completed:{},status:state.onboarding?.status==='done'?'done':'active'};
}
function tutorialCheckpoint(state,key){
 const progress=tutorialProgress(state);
 if(progress.status==='done'||progress.completed[key])return state;
 return {...state,onboarding:{...state.onboarding,progress:{...progress,completed:{...progress.completed,[key]:true}}}};
}
function isFirstActivity(state){return state.onboarding?.status!=='done'&&!state.flags.firstIntake&&!state.album.length;}
const tutorialRollEncounter=rollEncounter;
rollEncounter=function(state,foodId,random=Math.random){
 const encounter=tutorialRollEncounter(state,foodId,random);
 if(!isFirstActivity(state))return encounter;
 const cat=encounter.cat;
 const base=['slim','skinny'].includes(cat.phenotype?.body)?1780:cat.phenotype?.body==='round'?1900:1840;
 const sampled=base+Math.floor(random()*80),weight=sampled%10===0?sampled+3:sampled;
 return {...encounter,cat:{...cat,age:'adult',estimatedAgeMonths:24,
  phenotype:{...cat.phenotype,age:'adult'},recoveryUntilDay:0,trustGainRate:1,
  rescueProfile:{...cat.rescueProfile,condition:null},body:{...cat.body,sick:false,weight}}};
};
const tutorialReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='CHOOSE_AREA'&&state.onboarding?.townStep==='rescue'&&state.onboarding.status==='active'&&canStartStage(state,action.area)){
  const selected={...state,ui:{...state.ui,modal:'stageGate',stageChoice:action.area}};
  const next=tutorialReducer(selected,{type:'ENTER_STAGE'});
  return {...next,onboarding:{...next.onboarding,townStep:'done'}};
 }
 if(action.type==='TUTORIAL_TOWN_NEXT'){
  const step=state.onboarding?.townStep;
  if(state.campaign.phase!=='town'||!['home','area','goal','swipe'].includes(step))return state;
  if(step==='swipe'&&!action.arrived)return state;
  const nextStep={home:'swipe',swipe:'area',area:'goal',goal:'rescue'}[step];
  return {...state,onboarding:{...state.onboarding,townStep:nextStep}};
 }
 if(action.type==='NEXT_STORY'&&state.campaign.phase==='story'&&state.onboarding.storyIndex===2){
  townScrollTop=null;
  return tutorialCheckpoint({...state,onboarding:{...state.onboarding,townStep:'home'},campaign:{...state.campaign,phase:'town'}},'introduction');
 }
 let next=tutorialReducer(state,action);
 if(next===state)return state;
 if(action.type==='START_GAME'&&state.onboarding.status==='new')next={...next,onboarding:{...next.onboarding,progress:{version:1,status:'active',completed:{}}}};
 if(state.onboarding?.status!=='active'&&next.onboarding?.status!=='active')return next;
 const c=next.campaign;
 if(action.type==='NEXT_STORY'&&state.campaign.phase==='story'&&c.phase!=='story')next=tutorialCheckpoint(next,'introduction');
 if(action.type==='FIELD_PLACE_TRAP'&&!state.campaign.trapPlaced&&c.trapPlaced)next=tutorialCheckpoint(next,'trapPlaced');
 if(action.type==='OPEN_TRAP'&&!state.campaign.captured&&c.captured)next=tutorialCheckpoint(next,'captured');
 if(action.type==='FINISH_EXAM'&&state.campaign.clinicStep==='exam'&&c.clinicStep==='summary')next=tutorialCheckpoint(next,'examined');
 if(action.type==='START_INTAKE'&&state.campaign.phase!=='intake'&&c.phase==='intake')next=tutorialCheckpoint(next,'legacyIntake');
 if(action.type==='ACCEPT_CAT'&&next.onboarding.status==='done')next={...next,onboarding:{...next.onboarding,progress:{...tutorialProgress(next),status:'done'}}};
 return next;
};

// Dialogue is centrally maintained in game-dialogue.js.
function currentTownTutorial(state){return !titleScreenOpen&&state.onboarding?.status==='active'&&state.campaign.phase==='town'&&!state.campaign.captured?TOWN_TUTORIAL[state.onboarding.townStep]:null;}
let tutorialFrame=0;
const tutorialRender=render;
render=function(state){
 cancelAnimationFrame(tutorialFrame);
 tutorialRender(state);
 const spec=currentTownTutorial(state);if(!spec)return;
 const target=app.querySelector(spec.target);if(!target)return;
 const layer=document.createElement('section');layer.className='tutorial-focus';
 layer.innerHTML='<div class="tutorial-ring"></div><aside class="tutorial-note shared-guide-note" aria-label="せんぱいの案内"><strong class="senior-dialogue-name">保護主のせんぱい</strong><p></p><button type="button">つぎへ</button><span></span></aside>';
 layer.querySelector('p').textContent=spec.copy;
 const button=layer.querySelector('button');button.hidden=!!spec.action;
 layer.querySelector('span').textContent=spec.action||'';
 button.onclick=()=>dispatch({type:'TUTORIAL_TOWN_NEXT'});
 app.append(layer);
 const scroller=app.querySelector('.town-map-scroll');
 if(['area','goal','rescue'].includes(state.onboarding.townStep))scroller.scrollTop=scroller.clientHeight*1.5;
 const place=()=>{
  if(!layer.isConnected)return;
  if(state.onboarding.townStep==='swipe'&&Math.abs(scroller.scrollTop/scroller.clientHeight-1.5)<.012){dispatch({type:'TUTORIAL_TOWN_NEXT',arrived:true});return;}
  tutorialFrame=requestAnimationFrame(place);
 };place();
};
// Explanatory steps cannot accidentally navigate away; swipe remains a real gesture.
app.addEventListener('click',event=>{
 const spec=currentTownTutorial(gameState);if(!spec||event.target.closest('.tutorial-note'))return;
 if(gameState.onboarding.townStep==='rescue'&&event.target.closest(spec.target))return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
const tutorialStyle=document.createElement('style');
tutorialStyle.textContent=`
section.tutorial-focus{position:absolute;inset:0;z-index:90;pointer-events:none;overflow:hidden;--guide-paper:#fff7e5;--guide-ink:#514b37}
.tutorial-ring{position:absolute;border:2px solid #fff4c5;border-radius:50%;box-shadow:0 0 0 2000px #202d25a6;box-sizing:border-box;pointer-events:none}
.tutorial-note{position:absolute;left:12px;right:12px;padding:16px;background:var(--guide-paper);color:var(--guide-ink);border:1px solid #cdbf9c;border-radius:20px;box-shadow:0 3px 0 #252d2526;pointer-events:auto;font-size:14px;line-height:1.7}
.tutorial-note strong{font-size:13px;color:#657d57}.tutorial-note p{margin:6px 0 12px}.tutorial-note button{display:block;margin-left:auto;min-height:44px;min-width:100px;border:0;border-radius:24px;background:#657d57;color:#fff7e5;font-size:14px;padding:8px 18px}.tutorial-note button[hidden]{display:none}.tutorial-note>span{display:block;text-align:right;font-size:13px;color:#657d57}
`;
document.head.append(tutorialStyle);
