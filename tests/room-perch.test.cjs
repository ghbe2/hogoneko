const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs'),{touchGesture}=require('./helpers/touch-gesture.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{for(const [width,height] of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height},hasTouch:true,isMobile:true});p.setDefaultTimeout(5000);
 await openGame(p,'room');await p.evaluate(()=>{
  titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done'};gameState.dailyDiscovery={lastDay:discoveryDay()};catLifeCues=[];
  const cat=getCat(gameState);cat.types=['prey','chase'];cat.heart=95;gameState.inventory.shelf=1;
  Object.assign(gameState.ui,{modal:null,layoutMode:true,alphaNotice:null,alphaMailbox:false,equippedHand:'starter_toy'});
  getRoom(gameState).wall=[];render(gameState);dispatch({type:'PICK_FURNITURE',itemId:'shelf'});
 });
 assert(await p.locator('.item-shelf').first().isVisible());
 const pos=()=>p.evaluate(()=>getPlaced(getRoom(gameState)).find(n=>n.itemId==='shelf'));
 const start=await pos();await p.evaluate(()=>dispatch({type:'DROP_LAYOUT_ITEM',itemId:'shelf',x:25,y:32}));assert.deepEqual(await pos(),start);
 await p.locator('.layout-done').tap();await p.evaluate(()=>{catLifeCues=[];gameState.ui.playRestPoint={x:28,y:71,scale:.65,surface:'floor',catId:getCat(gameState).id};render(gameState)});
 await p.waitForTimeout(1200);
 const shelf=await p.locator('.item-shelf').first().boundingBox(),x=shelf.x+shelf.width*.5,y=shelf.y+shelf.height*.45;
 const g=await touchGesture(p),toy=await p.locator('[data-command="cat"]').boundingBox();
 await g.move(toy.x+toy.width/2,toy.y+toy.height/2);await g.down();await g.move(x,y,{steps:8});
 for(let i=0;i<22;i++){await g.move(x+(i%2?5:-5),y);await p.waitForTimeout(130);if(await p.evaluate(()=>commandDraft?.livePlayPoint?.surface==='shelf'))break;}
 assert.equal(await p.evaluate(()=>commandDraft?.livePlayPoint?.surface),'shelf');await p.waitForTimeout(900);await g.up();
 await p.evaluate(()=>{gameState.ui.playRestPoint={x:28,y:73,scale:.65,surface:'floor',catId:getCat(gameState).id};catLifeCues=[];render(gameState)});await p.waitForTimeout(1100);
 await p.evaluate(()=>{window.perchLandings=[];let lastPhase='';function sample(){const phase=CatRoomHold.active?.phase||'idle';if(phase!==lastPhase){lastPhase=phase;perchLandings.push([phase,gameState.ui.playRestPoint?.surface,CatRoomHold.active?.destination?.surface]);}requestAnimationFrame(sample)}sample()});
 const cat=await p.locator('.cat-object').boundingBox();await g.move(cat.x+cat.width/2,cat.y+cat.height*.45);await g.down();await g.move(x,y,{steps:12});await p.waitForTimeout(350);await g.up();await p.waitForFunction(()=>perchLandings.some(([phase,surface])=>phase==='idle'&&surface==='shelf'));
 assert(await p.evaluate(()=>perchLandings.some(([phase,,dest])=>phase==='land'&&dest==='shelf')));await p.screenshot({path:'tests/screenshots/room-perch-'+width+'.png'});console.log('PASS',width,'window exclusion, toy and carry to shelf');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
