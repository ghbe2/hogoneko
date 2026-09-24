const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.cats[0].status='raising';gameState.cats[0].types=['human','touch'];gameState.cats[0].heart=95;gameState.cats[0].heartCap=100;gameState.ui.modal=null;gameState.ui.equippedCleaner='starter_clean';gameState.cats[0].body.vomit=2;render(gameState);});
 await p.evaluate(()=>dispatch({type:'OPEN_SLOT_MENU',tab:'play'}));assert.equal(await p.locator('.inventory-tab[data-tab="touch"]').count(),0);await p.evaluate(()=>dispatch({type:'CLOSE_MODAL'}));
 await p.evaluate(()=>dispatch({type:'OPEN_SLOT_MENU',tab:'touch'}));assert.equal(await p.locator('[data-contact="pickup"]').count(),0);assert.equal(await p.locator('[data-action="contact-action"]').count(),3);await p.evaluate(()=>dispatch({type:'CLOSE_MODAL'}));
 const clean=p.locator('.main-command[data-command="clean"]'),target=p.locator('.mess-object');let c=await clean.boundingBox(),b=await target.boundingBox();
 await p.mouse.move(c.x+c.width/2,c.y+c.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});
 const before=await p.evaluate(()=>getCat(gameState).body.vomit);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>getCat(gameState).body.vomit),before);
 for(let n=0;n<16;n++){await p.mouse.move(b.x+b.width/2+(n%2?16:-16),b.y+b.height/2,{steps:4});await p.waitForTimeout(100);}
 assert.ok(await p.evaluate(()=>getCat(gameState).body.vomit)<before);await p.mouse.up();assert.equal(await p.locator('.command-ghost').count(),0);assert.equal(await p.evaluate(()=>gameState.inventory.starter_clean),1);
 const outcomes=await p.evaluate(()=>{let s=structuredClone(gameState);s.ui.careAnimation=null;s.cats[0].body.vomit=3;s.inventory.clean_spray=3;s=reduceGameState(s,{type:'RUB_CLEAN',cleanerId:'clean_spray',targets:[{problem:'vomit'}]});return [s.cats[0].body.vomit,s.inventory.clean_spray];});assert.deepEqual(outcomes,[0,2]);
 // A stationary hold invokes pickup; moving before the hold deadline invokes selected care.
 await p.evaluate(()=>{gameState.ui.touchMode='pet';gameState.ui.careAnimation=null;render(gameState);});
 b=await p.locator('.cat-object').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.waitForTimeout(750);await p.mouse.up();assert.ok(await p.evaluate(()=>gameState.ui.holdingCat||gameState.ui.pickupResult==='fled'));
 await p.evaluate(()=>{gameState=reduceGameState(gameState,{type:'RELEASE_CAT'});gameState.ui.careAnimation=null;gameState.ui.touchMode='pet';render(gameState);});
 b=await p.locator('.cat-object').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();for(let n=0;n<5;n++)await p.mouse.move(b.x+b.width/2+(n%2?13:-13),b.y+b.height/2,{steps:3});await p.mouse.up();assert.equal(await p.evaluate(()=>gameState.ui.careAnimation?.mode),'pet');assert.equal(await p.evaluate(()=>Boolean(gameState.ui.holdingCat)),false);
 await p.screenshot({path:'tests/screenshots/v022-room.png'});assert.deepEqual(errors,[]);console.log('PASS v022: continuous cleaning, no idle cleaning, stock, 3 touch methods, cat hold vs rub');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
