const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const [width,height] of [[320,568],[375,812]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 await page.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',homeTour:'done',appIntro:null};gameState.alpha={firstCatId:'previous-cat',seen:{}};gameState.ui={...gameState.ui,alphaNotice:null,modal:null,layoutMode:false};gameState.campaign.phase='room';gameState.campaign.requiredVisit=null;getCat(gameState).status='raising';render(gameState)});
 await page.screenshot({path:`tests/screenshots/alpha-room-${width}.png`});
 // Real hit target, screenshot taken before the report UI appears. Tutorial gates must allow it.
 await page.evaluate(()=>{gameState.onboarding.homeTour='play';render(gameState)});
 await page.click('[data-alpha-report]');await page.locator('.alpha-report img').waitFor();
 assert(await page.locator('.alpha-report img').evaluate(n=>n.naturalWidth>100));
 await page.screenshot({path:`tests/screenshots/alpha-report-${width}.png`});
 await page.click('[data-report-close]');
 await page.evaluate(()=>{gameState.onboarding.homeTour='done';gameState.campaign={...gameState.campaign,phase:'shop',shopId:'plaza'};render(gameState)});
 await page.waitForTimeout(500);await page.screenshot({path:`tests/screenshots/alpha-center-${width}.png`});
 await page.click('[data-center="taste"]');
 await page.waitForTimeout(3650);
 assert.equal(await page.locator('[data-alpha-gift]').count(),3);
 assert(await page.evaluate(()=>CONFIG.cat.types.every(a=>CONFIG.cat.types.every(b=>{const s=structuredClone(gameState);getCat(s).types=[a,b];return alphaTasteOptions(s).length===3}))), 'Every personality pair has three distinct affinity bands');
 assert(await page.evaluate(()=>CONFIG.items.filter(i=>i.wornFrom).every(i=>{let s=structuredClone(gameState);s.campaign={...s.campaign,phase:'room',shopId:null};s.ui={...s.ui,alphaNotice:null,alphaTasteStarted:null,layoutMode:i.kind==='placed'};s.inventory[i.id]=1;s.durability[i.id]=3;if(i.kind==='hand'){s=reduceGameState(s,{type:'SELECT_HAND',itemId:i.id});return s.ui.equippedHand===i.id;}s=reduceGameState(s,{type:'PICK_FURNITURE',itemId:i.id});return getPlaced(getRoom(s)).some(p=>p.itemId===i.id);})), 'Every worn gift can be placed or equipped');
 const choices=await page.evaluate(()=>gameState.alpha.taste.options);
 assert.deepEqual(choices.map(o=>Math.sign(o.score)).sort(),[-1,0,1]);
 assert(await page.evaluate(()=>gameState.alpha.taste.options.every(o=>!getItem(o.id).unlimited&&getItem(o.id).wornFrom&&getItem(o.id).durability===3)));
 await page.screenshot({path:`tests/screenshots/alpha-taste-${width}.png`});
 const bounds=await page.locator('.alpha-taste article').boundingBox();assert(bounds.y>=48&&bounds.y+bounds.height<=height);
 const id=choices[0].id,before=await page.evaluate(id=>Number(gameState.inventory[id])||0,id);
 await page.click(`[data-alpha-gift="${id}"]`);assert.equal(await page.evaluate(id=>gameState.inventory[id],id),before+1);
 await page.evaluate(id=>dispatch({type:'ALPHA_TASTE_CLAIM',itemId:id}),id);assert.equal(await page.evaluate(id=>gameState.inventory[id],id),before+1);
 await page.click('[data-alpha-taste-close]');await page.click('[data-center="taste"]');await page.waitForTimeout(3650);
 assert.equal(await page.locator('[data-alpha-gift]:enabled').count(),0);await page.click('[data-alpha-taste-close]');
 await page.evaluate(()=>{gameState.campaign.shopId='clinic';gameState.campaign.clinicReception=true;gameState.campaign.clinicExamined=false;render(gameState)});
 await page.locator('.is-clinic').waitFor();await page.waitForTimeout(450);await page.screenshot({path:`tests/screenshots/alpha-clinic-${width}.png`});
 assert(await page.evaluate(()=>{const ns=[...app.querySelectorAll('.clinic-commands button')];return ns.length>0&&ns.every(n=>n.getBoundingClientRect().height>=44)}));
 const result=await page.evaluate(()=>{const s=structuredClone(gameState),c=getCat(s);s.campaign.phase='room';s.campaign.shopId=null;s.alpha={firstCatId:c.id,seen:{},lastMessageDay:null};s.ui={...s.ui,modal:null,alphaNotice:null};c.body.days=3;c.body.weight=2200;c.body.sick=false;c.age='adult';c.initialAge='adult';c.recoveryUntilDay=0;c.surgery=null;c.carePlan={version:2,surgeryDay:null,eventDay:null,notices:{}};const ready=alphaLesson(s);c.body.days=4;c.carePlan.surgeryDay=5;const surgery=alphaLesson(s);c.surgery={status:'done',completedDay:5};c.carePlan.eventDay=7;c.body.days=5;const eve=alphaLesson(s);c.body.days=6;const event=alphaLesson(s);s.alpha.firstCatId='old';return {ready:ready?.[0],surgery:surgery?.[0],eve:eve?.[0],event:event?.[0],second:alphaLesson(s)}});
 assert.deepEqual({...result,price:undefined},{ready:'ready',surgery:'surgery:5',eve:'eve:7',event:'event:7',second:null,price:undefined});
 assert.deepEqual(errors,[]);await page.close();
}
console.log('PASS alpha report capture/gate, daily center reward and replay guard, state-based first rescue visits, both phone sizes');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});


