const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 const setup=async(day,visited=null)=>p.evaluate(({day,visited})=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.cats[0].status='raising';gameState.cats[0].body.days=day-1;gameState.cats[0].body.weight=2400;gameState.cats[0].surgeryVisitDay=visited;gameState.cats[0].eventVisitDay=null;gameState.campaign.phase='room';gameState.campaign.requiredVisit=null;gameState.ui.modal=null;dispatch({type:'CLEAR_MESSAGE'});},{day,visited});
 await setup(5);
 assert.deepEqual(await p.locator('button:enabled').evaluateAll(nodes=>nodes.map(n=>n.dataset.action)),['open-outing']);
 await p.screenshot({path:'tests/screenshots/v026-outing.png'});
 await p.locator('[data-action="open-outing"]').tap();
 assert.deepEqual(await p.locator('button:enabled').evaluateAll(nodes=>nodes.map(n=>n.dataset.action)),['open-required-visit']);
 await p.locator('[data-action="open-required-visit"]').tap();
 assert.equal(await p.getByText('手術予定の確認',{exact:true}).count(),1);
 await p.locator('[data-action="confirm-clinic-visit"]').tap();
 assert.equal(await p.evaluate(()=>getCat(gameState).surgeryVisitDay),5);
 assert.equal(await p.locator('.visit-shade').count(),0);
 await setup(7,5);await p.locator('[data-action="open-outing"]').tap();
 await p.screenshot({path:'tests/screenshots/v026-map.png'});
 // Reload must keep the destination restriction.
 await p.reload();await p.locator('[data-action="start-game"]').tap();
 assert.equal(await p.evaluate(()=>gameState.campaign.requiredVisit.step),'destination');
 await p.locator('[data-action="open-required-visit"]').tap();
 assert.equal(await p.evaluate(()=>gameState.campaign.phase),'graduation');
 assert.equal(await p.locator('.visit-shade').count(),0);
 // Not ready: postponing returns home without skipping real time; tomorrow guides again.
 await p.locator('[data-action="postpone-event"]').tap();
 assert.equal(await p.evaluate(()=>gameState.campaign.phase),'room');
 await p.evaluate(()=>dispatch({type:'NEXT_DAY'}));
 assert.equal(await p.evaluate(()=>gameState.campaign.requiredVisit.kind),'event');
 // A due save from a store starts at the outing instruction, hospital takes priority.
 await setup(8);assert.equal(await p.evaluate(()=>gameState.campaign.requiredVisit.kind),'clinic');
 await p.evaluate(()=>dispatch({type:'OPEN_NOTEBOOK'}));assert.equal(await p.evaluate(()=>gameState.ui.modal),null);
 await setup(4);assert.equal(await p.locator('.visit-shade').count(),0);await p.evaluate(()=>dispatch({type:'NEXT_DAY'}));assert.equal(await p.evaluate(()=>gameState.campaign.requiredVisit.kind),'clinic');
 assert.deepEqual(errors,[]);console.log('PASS v026: due-day outing lock, sole destination, low-weight exit, event postpone, reload and overdue priority');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
