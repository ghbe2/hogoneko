'use strict';
function householdCapacity(state){return state.flags.returnedCat?2+(state.household?.renovation||0):1;}
function residentCats(state){return state.cats.filter(c=>['raising','intake','captured'].includes(c.status));}
function resetHouseholdCandidate(cat){const next={...cat};for(const key of ['carePlan','initialAge','permanentResident','returnTutorial','previousDayHeart','seniorGift','seniorHelpUnlocked','seniorPromptDismissed','alphaLayoutTried','alphaMessSeen'])delete next[key];return next;}
const householdRoll=rollEncounter;
rollEncounter=function(state,food,random=Math.random){let e=householdRoll(state,food,random);if(e.cat.age==='adult'&&!isFirstActivity(state)){const base=['slim','skinny'].includes(e.cat.phenotype?.body)?1780:e.cat.phenotype?.body==='round'?1900:1840,sampled=base+Math.floor(random()*80);e={...e,cat:{...e.cat,body:{...e.cat.body,weight:sampled%10?sampled:sampled+3}}};}if(state.campaign.area==='a2'&&!state.flags.parkFirstRescue)e={...e,cat:{...e.cat,age:'kitten',initialAge:'kitten',returnTutorial:true,estimatedAgeMonths:3,phenotype:{...e.cat.phenotype,age:'kitten'},body:{...e.cat.body,weight:883+Math.floor(random()*70)}}};return e;};
function returnChance(cat){return cat.returnTutorial?1:cat.heart>=90?Math.min(.55,(Math.floor(cat.heart)-89)*.05):0;}
const householdWidth=getWorldWidth;
getWorldWidth=state=>Math.max(householdWidth(state),1+(state.household?.renovation||0)*.55);
const householdReduce=reduceGameState;
reduceGameState=function(state,action){
 const cat=getCat(state),others=state.cats.slice(1).filter(c=>['raising','intake','captured'].includes(c.status));
 if(action.type==='GO_HOME'&&cat.status==='candidate'&&state.album.length)return {...state,campaign:{...state.campaign,phase:'room'},ui:{...state.ui,modal:null}};
 if(action.type==='HOUSEHOLD_SELECT'){const selected=state.cats.find(c=>c.id===action.id);return selected?{...state,cats:[selected,...state.cats.filter(c=>c.id!==selected.id)],ui:{...state.ui,modal:null}}:state;}
 if(action.type==='HOUSEHOLD_RETURN'){
  const returning=state.household?.pendingReturn;if(!returning||state.campaign.phase!=='room'||residentCats(state).length>=2)return state;
  const restored={...returning,status:'raising',permanentResident:true};
  return {...state,flags:{...state.flags,returnedCat:true},household:{...state.household,pendingReturn:null},cats:[restored,...residentCats(state)],rooms:state.rooms.map(r=>({...r,cats:[restored.id,...residentCats(state).map(c=>c.id)]})),ui:{...state.ui,message:'戻ってきてくれたんだね。保護センターで相談しよう。'}};
 }
 if(action.type==='HOUSEHOLD_RENOVATE'){
  const level=state.household?.renovation||0,cost=level===0?1000:20000;
  if(!state.flags.returnedCat||level>=2||state.coins<cost||state.campaign.shopId!=='petshop')return state;
  const paid=spendCoins(state,cost,'おうちの改装');return {...paid,household:{...state.household,renovation:level+1},ui:{...paid.ui,message:'部屋が広くなり、もう１匹迎えられるようになりました。'}};
 }
 if(['GO_EVENT','BEGIN_ADOPTION','SEND_EVENT'].includes(action.type)&&cat.permanentResident)return state;
 if(action.type==='CHOOSE_AREA'&&cat.status==='raising'&&residentCats(state).length<householdCapacity(state)){
  if(state.coins<RELEASE_ECONOMY.clinic)return rescueFundsNotice(state);
  let prepared=householdReduce({...state,campaign:{...state.campaign,phase:'result',requiredVisit:null}},{type:'NEXT_RESCUE'});prepared={...prepared,cats:[resetHouseholdCandidate(getCat(prepared))]};
  const next=householdReduce({...prepared,cats:[getCat(prepared),...residentCats(state)],campaign:{...prepared.campaign,phase:'town'}},action);
  return {...next,cats:[getCat(next),...residentCats(state)]};
 }
 // Legacy reducers intentionally operate on one cat. Keep other residents out of single-cat resets.
 const graduation=['BEGIN_ADOPTION','SEND_EVENT'].includes(action.type)&&state.campaign.phase==='graduation'&&state.campaign.adoptionRun?.status!=='playing'&&isGraduationReady(state);
 const returning=graduation&&stageAccess(state,'a2').unlocked&&!state.flags.returnedCat&&(cat.returnTutorial||Math.random()<returnChance(cat));
 let next=householdReduce({...state,cats:[cat]},action);
 if(action.type==='NEXT_RESCUE'&&getCat(next).status==='candidate')next={...next,cats:[resetHouseholdCandidate(getCat(next))]};
 if(next.cats[0])next={...next,cats:[next.cats[0],...others.filter(c=>c.id!==next.cats[0].id)]};
 if(['ADVANCE_THREE_HOURS','NEXT_DAY','SYNC_REAL_TIME'].includes(action.type)&&others.length){const updated=others.map(c=>{const isolated={...state,cats:[c],campaign:{...state.campaign,phase:'room',requiredVisit:null},ui:{...state.ui,modal:null}};return getCat(householdReduce(isolated,action));});next={...next,cats:[getCat(next),...updated]};}
 next={...next,rooms:next.rooms.map(r=>({...r,cats:residentCats(next).map(c=>c.id)}))};
 if(action.type==='OPEN_TRAP'&&state.campaign.area==='a2'&&next.campaign.captured)next={...next,flags:{...next.flags,parkFirstRescue:true}};
 if(returning&&next.album.length>state.album.length)next={...next,cats:next.cats.map(c=>c.id===cat.id?{...c,status:'tnr'}:c),album:next.album.map((e,i)=>i===next.album.length-1?{...e,outcome:'tnr',returnsHome:true}:e),campaign:{...next.campaign,outcome:'tnr',adoptionRun:next.campaign.adoptionRun?{...next.campaign.adoptionRun,outcome:'tnr'}:null},household:{...next.household,pendingReturn:structuredClone(cat)}};
 if(action.type==='NEXT_RESCUE'&&next.campaign.phase==='town')next={...next,cats:others.length?others:next.cats,campaign:{...next.campaign,phase:'room'},ui:{...next.ui,modal:null}};
 return next;
};
const householdRender=render;
render=function(state){const oldResidents=new Map([...app.querySelectorAll('.resident-cat svg')].map(svg=>[svg.dataset.catId,{svg,entry:svgRigs.get(svg)}]));householdRender(state);const cat=getCat(state);
 // Keep the room empty underneath every overlay, including the app and layout.
 if(state.campaign.phase==='room'&&cat.status==='candidate')app.querySelectorAll('.cat-object,.room-preparation,.command-dock,.room-call-icon,.room-call-feedback').forEach(n=>n.remove());
 if(state.campaign.phase==='room'&&!state.ui.modal){
  if(state.household?.renovation&&!app.querySelector('.pan-guide')){const nav=document.createElement('nav');nav.className='household-pan';nav.setAttribute('aria-label','広くなった部屋の移動');nav.innerHTML=`<button data-action="pan-room" data-pan="0" aria-label="部屋の左へ">‹</button><button data-action="pan-room" data-pan="${getMaxPan(state)}" aria-label="部屋の右へ">›</button>`;app.querySelector('.stage')?.append(nav);}
  if(cat.status==='candidate'){
   if(state.household?.pendingReturn){const b=document.createElement('button');b.className='return-window';b.dataset.household='return';b.textContent='窓が、カタカタ……';app.querySelector('.stage')?.append(b);}
  }
  if(state.cats.length>1){const nav=document.createElement('nav');nav.className='resident-selector';nav.innerHTML=residentCats(state).map(c=>`<button data-resident="${surgeryText(c.id)}" aria-pressed="${c.id===cat.id}">${surgeryText(c.name||'保護したネコ')}</button>`).join('');app.querySelector('.stage')?.append(nav);residentCats(state).filter(c=>c.id!==cat.id).forEach((c,i)=>{const n=document.createElement('button');n.className='resident-cat';n.dataset.resident=c.id;n.setAttribute('aria-label',c.name+'のお世話に切り替える');n.style.left=(12+i*24)+'%';n.innerHTML=renderCatArt(c);app.querySelector('[data-room-world]')?.append(n);const prior=oldResidents.get(c.id.replace(/[^a-zA-Z0-9_-]/g,''));if(prior){n.querySelector('svg').replaceWith(prior.svg);if(prior.entry)svgRigs.set(prior.svg,prior.entry);}});mountGameCats();}
 }
 if(state.campaign.phase==='town'&&cat.status==='candidate'&&state.album.length)app.querySelectorAll('.town-destination.home').forEach(b=>{b.disabled=false;b.removeAttribute('aria-disabled')});
 if(state.campaign.phase==='shop'&&state.campaign.shopId==='petshop'&&state.flags.returnedCat){const b=document.createElement('button');b.className='renovate-home';b.dataset.household='renovate';const level=state.household?.renovation||0;b.textContent=level>=2?'改装済み・４匹のおうち':`おうちを改装 ${level===0?'1,000':'20,000'}コイン`;b.disabled=level>=2||state.coins<(level===0?1000:20000);app.querySelector('.store-panel')?.append(b);}
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-household],[data-resident]');if(!b)return;dispatch(b.dataset.resident?{type:'HOUSEHOLD_SELECT',id:b.dataset.resident}:{type:b.dataset.household==='return'?'HOUSEHOLD_RETURN':'HOUSEHOLD_RENOVATE'});});
