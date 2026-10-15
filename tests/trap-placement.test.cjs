const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),url=pathToFileURL(path.resolve('index.html')).href;
for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(url+'?check=1&scenario=event');await p.evaluate(()=>{titleScreenOpen=false;getCat(gameState).status='candidate';gameState.onboarding.status='done';gameState.campaign={...gameState.campaign,phase:'field',area:'a1',requiredVisit:null,trapPlaced:false,trapWaiting:false,trapReady:false};render(gameState)});
 const source=await p.locator('.encounter-trap').boundingBox();await p.mouse.move(source.x+source.width/2,source.y+source.height/2);await p.mouse.down();
 const bounds=await p.evaluate(()=>fieldDragDraft.bounds);await p.mouse.move(1,1);
 assert(await p.evaluate(()=>{const r=fieldDragDraft.ghost.getBoundingClientRect(),b=fieldDragDraft.bounds;return Math.abs(r.x+r.width/2-b.left)<1&&Math.abs(r.y+r.height/2-b.top)<1&&getComputedStyle(fieldDragDraft.source).visibility==='hidden'}));
 const x=bounds.left+12,y=(bounds.top+bounds.bottom)/2;await p.mouse.move(x,y);await p.screenshot({path:`tests/screenshots/trap-placement-${width}-drag.png`});await p.mouse.up();
 assert(await p.evaluate(()=>gameState.campaign.trapWaiting));const r=await p.locator('.illustrated-trap').boundingBox();assert(Math.abs(r.x+r.width/2-x)<2);assert(Math.abs(r.y+r.height/2-y)<2);await p.screenshot({path:`tests/screenshots/trap-placement-${width}-placed.png`});
 await p.evaluate(()=>saveGameState(gameState));await p.goto(url+'?check=1');await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});const saved=await p.locator('.illustrated-trap').boundingBox();assert(Math.abs(saved.x+saved.width/2-x)<2);
}console.log('PASS trap bounded preview, single source, exact drop and persisted position at both sizes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
