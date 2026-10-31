const{chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('path'),{pathToFileURL}=require('url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.cats[0].status='candidate';gameState.inventory.food_dry=12;gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:'trap',appIntro:null};gameState.campaign={...gameState.campaign,phase:'field',area:'a1',fieldFood:'food_dry',requiredVisit:null,trapWaiting:false,trapReady:false,trapPlaced:false};gameState.ui.modal=null;render(gameState)});
 for(let i=0;i<4;i++){await p.waitForTimeout(1600);if(!await p.locator('[data-copy-page]').count())break;await p.click('[data-copy-page]');}
 const hand=p.locator('.guide-gesture[data-kind="move-furniture"]');await hand.waitFor({state:'visible'});
 await p.screenshot({path:`tests/screenshots/trap-hand-${width}.png`});
 const r=await p.locator('.encounter-trap').boundingBox();await p.mouse.move(r.x+r.width/2,r.y+r.height/2);await p.mouse.down();
 const dest=await p.evaluate(()=>({x:(fieldDragDraft.bounds.left+fieldDragDraft.bounds.right)/2,y:(fieldDragDraft.bounds.top+fieldDragDraft.bounds.bottom)/2}));
 await p.mouse.move(dest.x,dest.y,{steps:8});await p.waitForTimeout(100);assert(await hand.evaluate(n=>n.hidden));await p.mouse.up();assert(await p.evaluate(()=>gameState.campaign.trapWaiting));
 console.log('PASS',width,'shared back-of-hand cue, hidden while dragging, cage placed');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
