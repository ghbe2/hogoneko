const {chromium}=require('playwright');
const {openGame}=require('./helpers/game-page.cjs');
const {touchGesture}=require('./helpers/touch-gesture.cjs');
const fs=require('fs'),nativeAssert=require('assert/strict');
const baseline=process.env.FEEDBACK_BASELINE==='1',failures=[];
if(baseline)process.env.GAME_URL=require('./helpers/feedback-baseline.cjs')();
const assert=baseline?Object.assign((...args)=>{try{nativeAssert(...args);}catch(e){failures.push(e.message);}},Object.fromEntries(['equal','deepEqual'].map(name=>[name,(...args)=>{try{nativeAssert[name](...args);}catch(e){failures.push(e.message);}}]))):nativeAssert;
const dir='tests/screenshots/feedback-nov10'+(baseline?'/before':'');fs.mkdirSync(dir,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome'});const results=[];try{
for(const [width,height] of [[320,568],[375,812],[411,703]]){
 const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));await openGame(p,'room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.homeTour='done';dispatch({type:'OPEN_OUTING'});});await p.waitForFunction(()=>!guideNavigationBusy&&gameState.campaign.phase==='town');
 assert.equal(await p.locator('.loop-album-open').count(),0);
 await p.evaluate(()=>dispatch({type:'OPEN_ALBUM'}));await p.locator('[data-app-album-close]').tap();
 assert(await p.locator('.room-travel-icon').isVisible(),'album returns to the map with the home button');
 assert.equal(await p.evaluate(()=>gameState.ui.modal),null);
 await p.screenshot({path:`${dir}/home-icon-${width}.png`});
 if(baseline)await p.evaluate(()=>dispatch({type:'CLOSE_MODAL'}));await p.locator('.room-travel-icon').tap();await p.waitForFunction(()=>!guideNavigationBusy&&gameState.campaign.phase==='room');
 await p.locator('[data-action="open-notebook"]').tap();await p.locator('.app-album [data-action="open-album"]').tap();await p.locator('[data-app-album-close]').tap();assert(await p.locator('.home-phone').isVisible(),'phone album returns to phone');
 // Legacy/stale town cursor must not revive the initial rescue after shopping.
 for(const townStep of ['rescue','area','swipe']){const failureStart=failures.length;
 await p.evaluate(step=>{const s=gameState;getCat(s).status='intake';s.campaign={...s.campaign,phase:'town',captured:false,requiredVisit:null};s.flags.starterBought=true;s.flags.firstIntake=true;s.onboarding={...s.onboarding,status:'active',flowVersion:1,guide:'homeBuilding',townStep:step,guideEnteredAt:Date.now()-10000};s.ui={...s.ui,modal:null,alphaNotice:null,layoutMode:false};s.album=[];s.alpha.firstCatId=getCat(s).id;townScrollTop=100;render(s);},townStep);
 await p.waitForTimeout(2400);
 assert.equal(await p.locator('.tutorial-focus').count(),0,'no competing initial rescue guide');
 const coords=await p.locator('.town-destination.home').boundingBox();
 assert(coords.y>=48&&coords.y+coords.height<=height,'home destination is visible without scrolling');
 await p.screenshot({path:`${dir}/home-guide-${width}-${townStep}.png`});
 await p.touchscreen.tap(coords.x+coords.width*.5,coords.y+coords.height*.5);
 await p.waitForFunction(()=>gameState.campaign.phase==='intake',{},{timeout:3000}).catch(e=>{if(!baseline)throw e;failures.push('homeBuilding tap blocked '+width+' '+townStep);});results.push({width,test:'homeGuide',townStep,pass:failures.length===failureStart});
 }
 // Start from the actual first-placement planner, but choose destinations from
 // the drawn floor edges, not from the implementation's accepted-position list.
 await p.evaluate(()=>{const s=gameState;s.campaign.phase='intake';s.campaign.intakeCalled=false;getCat(s).status='intake';s.onboarding={...s.onboarding,status:'active',flowVersion:1,guide:'moveFurniture',guideEnteredAt:Date.now()-10000};s.ui={...s.ui,modal:null,layoutMode:true,layoutTrayOpen:false};for(const id of FIRST_FURNITURE){s.inventory[id]=1;s.durability[id]=getItem(id).durability||100;}getRoom(s).floor=planIntakeFurniture(s,[],FIRST_FURNITURE,false);getRoom(s).wall=[];render(s);window.testIntakeState=structuredClone(gameState);});
 await p.waitForTimeout(2400);while(await p.locator('[data-copy-page]').count()){await p.locator('[data-copy-page]:enabled').tap();await p.waitForTimeout(700);}const touch=await touchGesture(p);
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){const failureStart=failures.length;
  await p.evaluate(()=>{gameState=structuredClone(window.testIntakeState);render(gameState);});await p.waitForTimeout(80);
  const original=await p.evaluate(()=>getRoom(gameState).floor.find(n=>n.itemId==='box'));const r=await p.locator('.placed-item.item-box').boundingBox();
  const floor=await p.locator('.floor-zone').boundingBox(),world=await p.locator('[data-room-world]').boundingBox();
  const left=world.x+12+(world.width-24-r.width)*col/4;
  const top=floor.y-r.height+(floor.height)*row/3;
  const dest={x:left+r.width/2,y:top+r.height/2};
  if(Math.hypot(dest.x-r.x-r.width/2,dest.y-r.y-r.height/2)<9){dest.x+=12;}
  await touch.move(r.x+r.width/2,r.y+r.height/2);await touch.down();await touch.move(dest.x,dest.y,{steps:5});
  const preview=await p.evaluate(()=>dragDraft&&({valid:dragDraft.valid,x:dragDraft.x,y:dragDraft.y}));
  assert.equal(await p.locator('.first-guide-note').evaluate(n=>getComputedStyle(n).visibility),'hidden','guide must not cover the dragged box');if(row===0&&col===0)await p.screenshot({path:`${dir}/drag-${width}.png`});
  await touch.up();
  const after=await p.evaluate(()=>({p:getRoom(gameState).floor.find(n=>n.itemId==='box'),guide:gameState.onboarding.guide}));
  assert(preview?.valid,`floor ${width} ${row},${col} must accept placement`);
  if(!baseline&&(Math.abs(preview.x-after.p.x)>=.01||Math.abs(preview.y-after.p.y)>=.01))console.log('PLACEMENT DETAIL',{width,row,col,r,floor,world,dest,original,preview,after},await p.evaluate(()=>({frame:intakePlacementFrame(gameState),drag:!!dragDraft,stage:app.querySelector('.stage').getBoundingClientRect().toJSON()})));assert(Math.abs(preview.x-after.p.x)<.01&&Math.abs(preview.y-after.p.y)<.01,`preview persists ${width} ${row},${col}`);
  const unchanged=Math.abs(original.x-preview.x)<.01&&Math.abs(original.y-preview.y)<.01;assert.equal(after.guide,unchanged?'moveFurniture':'roomReady');results.push({width,test:'box',row,col,pass:failures.length===failureStart});
 }
 await p.evaluate(()=>saveGameState(gameState));const box=await p.evaluate(()=>getRoom(gameState).floor.find(n=>n.itemId==='box'));await p.reload();await p.waitForTimeout(300);assert.deepEqual(await p.evaluate(()=>getRoom(gameState).floor.find(n=>n.itemId==='box')),box,'reload keeps placement');
 assert.deepEqual(errors,[]);await p.close();console.log('PASS',width);
}
fs.writeFileSync(`${dir}/results.json`,JSON.stringify({baseline,results,failures},null,2));console.log(baseline?'BASELINE':'PASS',results.length,'map/placement cases, failures:',failures.length);if(baseline)console.log(failures.join('\n')); 
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
