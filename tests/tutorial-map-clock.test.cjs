const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs'),{touchGesture}=require('./helpers/touch-gesture.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'}),results=[];try{
 for(const guide of ['swipe','clinicScroll'])for(const when of ['drag','animation']){
  const p=await b.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true});await openGame(p,'event');
  await p.evaluate(guide=>{titleScreenOpen=false;getCat(gameState).status=guide==='swipe'?'candidate':'captured';
   gameState.campaign={...gameState.campaign,phase:'town',requiredVisit:null};
   gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:guide==='swipe'?null:guide,townStep:guide==='swipe'?'swipe':'done',guideEnteredAt:Date.now()-5000};
   gameState.ui={...gameState.ui,modal:null,alphaNotice:null};townScrollTop=null;render(gameState);
  },guide);await p.waitForTimeout(3800);
  const g=await touchGesture(p),r=await p.locator('.town-map-scroll').boundingBox(),x=r.x+30,y=r.y+r.height*.45;
  await g.move(x,y);await g.down();await g.move(x,y+(guide==='swipe'?120:-120),{steps:6});
  if(when==='animation'){await g.up();await p.waitForTimeout(120);}
  const kept=await p.evaluate(()=>{const map=app.querySelector('.town-map-scroll');dispatch({type:'SYNC_REAL_TIME',at:gameNow()});return map.isConnected;});
  if(when==='drag')await g.up();
  await p.waitForTimeout(1400);
  const step=await p.evaluate(guide=>guide==='swipe'?gameState.onboarding.townStep:gameState.onboarding.guide,guide);
  const passed=step===(guide==='swipe'?'area':'clinicBuilding');results.push(passed);console.log({guide,when,kept,step,passed});await p.close();
 }
 assert(results.every(Boolean));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1;});
