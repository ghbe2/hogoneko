const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [width,height]of [[320,568],[375,812]]){
await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
let first;
for(const stage of ['ready','poor','unready','busy','done']){
await p.evaluate(stage=>{titleScreenOpen=false;let c=getCat(gameState);c.status='raising';c.body.days=5;c.age='adult';c.initialAge='adult';c.carePlan={version:2,surgeryDay:6,eventDay:null,notices:{}};gameState.alpha={firstCatId:'previous'};gameState.ui.alphaNotice=null;gameState.onboarding={status:'done',homeTour:'done',appIntro:null};c.body.weight=3100;c.body.sick=false;c.surgery=stage==='busy'?{status:'in_progress',startedAt:gameNow(),paid:10}:stage==='done'?{status:'done',completedDay:6,paid:12}:null;if(stage==='unready')c.body.weight=2000;gameState.coins=stage==='poor'?0:50;gameState.campaign={...gameState.campaign,phase:'shop',shopId:'clinic',medicalStage:stage==='done'?'receipt':'consult',requiredVisit:null};gameState.ui.modal=null;render(gameState);clearTimeout(surgeryTimer);},stage);
await p.waitForTimeout(100);
const geometry=await p.evaluate(()=>{
const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
const panel=document.querySelector('.surgery-sheet'),scene=document.querySelector('.surgery-scene');
return{parts:['.surgery-room','.surgery-cat','.surgery-sheet','.surgery-sheet header','.surgery-information','.surgery-actions'].map(rect),fits:[...panel.querySelectorAll('button,p,.surgery-price,.surgery-checks,.surgery-receipt')].every(n=>{const r=n.getBoundingClientRect(),p=panel.getBoundingClientRect();return r.bottom<=p.bottom+1&&r.top>=p.top}),full:Math.abs(scene.clientHeight-document.querySelector('.surgery-room').clientHeight)<1,overflow:scene.getBoundingClientRect().bottom>app.getBoundingClientRect().bottom+1};});
assert(geometry.fits&&geometry.full&&!geometry.overflow,stage+JSON.stringify(geometry));
assert(await p.evaluate(()=>{const body=document.querySelector('.surgery-information'),bottom=Math.max(...[...body.children].map(n=>n.getBoundingClientRect().bottom));return bottom<=document.querySelector('.surgery-actions').getBoundingClientRect().top;}),'Body must not overlap actions');
const stable=geometry.parts.filter((_,i)=>i!==1);if(!first)first=stable;else assert.deepEqual(stable,first,'All fixed layout coordinates stable: '+stage);
await p.screenshot({path:`tests/screenshots/surgery-overlay-${width}-${stage}.png`,animations:'disabled'});
}
await p.evaluate(()=>{getCat(gameState).surgery=null;getCat(gameState).carePlan={version:2,surgeryDay:6,eventDay:null,notices:{}};gameState.coins=50;gameState.campaign.medicalStage='consult';render(gameState)});
await p.click('[data-action="start-surgery"]');await p.waitForFunction(()=>gameState.coins===40);assert.equal(await p.evaluate(()=>gameState.coins),40);
await p.evaluate(()=>dispatch({type:'START_SURGERY'}));assert.equal(await p.evaluate(()=>gameState.coins),40);
await p.locator('.surgery-done').waitFor();assert.equal(await p.evaluate(()=>getCat(gameState).surgery.status),'done');
await p.click('[data-action="leave-surgery-clinic"]');assert.equal(await p.evaluate(()=>gameState.campaign.phase),'room');
}
assert.deepEqual(errors,[]);console.log('PASS surgery full background, stable six regions across five states, fixed actions and two viewport sizes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
