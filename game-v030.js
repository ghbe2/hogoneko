'use strict';
// The check namespace is selected before any save is read in index.html.
// Fixtures use a fresh, migrated release state, never a copy of the player's save.
const checkMode = new URLSearchParams(location.search).get('check') === '1';
const checkScenario = new URLSearchParams(location.search).get('scenario');
if(checkMode && checkScenario){
  const cat=getCat(gameState),c=gameState.campaign;
  gameState.onboarding.status='done';titleScreenOpen=false;
  gameState.realClock={version:1,processedAt:Date.now(),dayTicks:0};
  Object.assign(c,{requiredVisit:null,medicalStage:null,phase:'room'});
  Object.assign(cat,{name:'チェックねこ',status:'raising',heart:50,heartCap:60,surgery:null,eventVisitDay:null,surgeryVisitDay:null});
  cat.types=drawShuffledTypes({...cat,types:[]});
  Object.assign(cat.body,{days:0,weight:3100,sick:false});cat.age='adult';
  cat.lifeLog=[{day:1,title:'チェックねこと生活開始'}];
  gameState.ui.modal=null;gameState.ui.layoutMode=false;
  if(['intro','field','capture'].includes(checkScenario)){
   cat.name='';cat.types=[];cat.status='candidate';c.phase=checkScenario==='intro'?'town':'field';
   if(checkScenario==='intro'){gameState.onboarding.status='new';titleScreenOpen=true;}
   if(checkScenario==='capture')Object.assign(c,{trapPlaced:true,trapId:'trap_standard',bait:['food_dry'],trapReady:true,trapWaiting:true,waitTicks:3,trapToken:Date.now()});
  }
  if(['clinic','naming','intake'].includes(checkScenario)){
   cat.status='captured';cat.name='';c.captured=true;c.phase='clinic';c.clinicStep=checkScenario==='clinic'?'exam':'naming';
   if(checkScenario==='intake')gameState=reduceGameState(gameState,{type:'START_INTAKE',name:'チェックねこ'});
  }
  if(['surgery','underweight','poor'].includes(checkScenario)){
   cat.body.days=4;cat.heart=70;cat.heartCap=100;
   if(checkScenario==='underweight'){cat.age='kitten';cat.body.weight=690;}
   if(checkScenario==='poor')gameState.coins=0;
  }
  if(['event','tnr','result','tnr-result'].includes(checkScenario)){
   cat.body.days=6;cat.heart=checkScenario.startsWith('tnr')?20:95;cat.heartCap=100;
   cat.surgery={status:'done',completedDay:5,paid:12};
   cat.lifeLog.push({day:5,kind:'surgery',title:'手術を終えた'});
  }
  if(checkScenario==='town')c.phase='town';
  if(checkScenario==='park'){cat.status='candidate';cat.name='';cat.types=[];c.phase='field';c.area='a2';gameState.album=Array.from({length:8},(_,i)=>({catId:'check-graduate-'+i,name:'見送り済みのネコ',outcome:'adopted',day:7,area:'a1'}));}
  if(checkScenario==='mountain'){cat.status='candidate';cat.name='';cat.types=[];c.phase='field';c.area='a4';gameState.album=['a1','a2','a3'].flatMap((area,k)=>Array.from({length:[8,12,16][k]},(_,i)=>({catId:`check-${area}-${i}`,name:'見送り済みのネコ',outcome:'adopted',day:7,area})));}
  gameState=reconcileVisit(gameState);
  if(['result','tnr-result'].includes(checkScenario))for(const type of ['OPEN_OUTING','OPEN_REQUIRED_VISIT','SEND_EVENT'])gameState=reduceGameState(gameState,{type});
  history.replaceState(null,'',location.pathname+'?check=1');
  dispatch({type:'CLEAR_MESSAGE'});
}
const checkStyle=document.createElement('style');checkStyle.textContent='.check-hub-link{display:inline-block;flex-shrink:0;background:#514940;color:white;padding:6px 8px;border-radius:20px;font:10px system-ui;text-decoration:none;margin-left:5px}.check-hub-link.floating{position:fixed;left:12px;top:12px;z-index:20000}';document.head.append(checkStyle);
function mountCheckLink(){
 document.querySelectorAll('.check-hub-link').forEach(node=>node.remove());
 const link=document.createElement('a');link.className='check-hub-link';link.href='check.html';link.target='_top';link.textContent=checkMode?'試用中・一覧へ':'チェック室';
 const host=document.querySelector('.hud-main,.campaign-place');
 if(host)host.append(link);else{link.classList.add('floating');document.body.append(link);}
}
const beforeCheckRender=render;render=function(state){beforeCheckRender(state);mountCheckLink();};mountCheckLink();
