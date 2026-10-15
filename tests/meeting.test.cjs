const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.join(root,relative);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/index.html?check=1&scenario=`;const browser=await chromium.launch({channel:'chrome',headless:true});try{
const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(base+'intake');await p.waitForTimeout(300);
 assert.equal(await p.evaluate(()=>gameState.ui.layoutMode),false);assert.equal(await p.locator('.layout-workbar').count(),0);
 assert.equal(await p.locator('.layout-zones').count(),0);
 await p.click('[data-action="toggle-layout"]');assert(await p.locator('.layout-workbar').isVisible());await p.click('.layout-done');assert.equal(await p.locator('.layout-workbar').count(),0);
 await p.screenshot({path:`tests/screenshots/meeting-intake-${width}.png`});
 assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
 await p.goto(base+'town');await p.waitForTimeout(300);
 assert.equal(await p.locator('.town-area').count(),4);assert.equal(await p.locator('[data-shop="super"]').count(),0);
 assert.equal(await p.locator('.town-map-world .town-ground').count(),1);
 await p.screenshot({path:`tests/screenshots/meeting-town-${width}.png`});
 await p.evaluate(()=>{const s=document.querySelector('.town-map-scroll');s.scrollTop=s.clientHeight;});await p.waitForTimeout(50);const mapScroll=await p.locator('.town-map-scroll').evaluate(e=>e.scrollTop);await p.evaluate(()=>render(gameState));assert.equal(await p.locator('.town-map-scroll').evaluate(e=>e.scrollTop),mapScroll);
 await p.screenshot({path:`tests/screenshots/meeting-stages-${width}.png`});
 await p.evaluate(()=>dispatch({type:'CHOOSE_AREA',area:'a2'}));assert(await p.locator('.stage-gate').isVisible());await p.click('.stage-gate [data-action="close-modal"]');
 await p.evaluate(()=>dispatch({type:'OPEN_MAP_SHOP',shopId:'petshop'}));assert(await p.locator('.release-shop-tabs').isVisible());await p.click('[data-action="shop-tab"][data-tab="food"]');assert(await p.locator('[data-item="food_dry"]').count());await p.screenshot({path:`tests/screenshots/meeting-shop-${width}.png`});
 assert(await p.locator('.shop-product').evaluateAll(cards=>cards.every(card=>Array.from(card.children).every(child=>child.getBoundingClientRect().bottom<=card.getBoundingClientRect().bottom+1))));
 const back=await p.locator('[data-action="back-town"]').boundingBox();assert(back.y+back.height<=height+1);
 await p.goto(base+'surgery');assert.equal(await p.evaluate(()=>gameState.campaign.requiredVisit),null);await p.evaluate(()=>dispatch({type:'OPEN_MAP_SHOP',shopId:'clinic'}));await p.click('[data-clinic="examine"]');
 await p.screenshot({path:`tests/screenshots/meeting-surgery-${width}.png`});
 const bounds=await p.locator('.clinic-reception').boundingBox();assert(bounds.y+bounds.height<=height+1);
 await p.click('[data-action="go-surgery"]');await p.click('[data-action="start-surgery"]');await p.waitForTimeout(2600);assert.equal(await p.evaluate(()=>getCat(gameState).surgery.status),'done');assert.equal(await p.evaluate(()=>phenotypeFor(getCat(gameState)).earCut),'left');
 await p.goto(base+'room');await p.evaluate(()=>{gameState.dailyDiscovery={day:new Date(gameNow()).toLocaleDateString('sv-SE')};gameState.ui.roamIndex=0;render(gameState);});
 await p.click('[data-action="touch-now"]');assert(await p.locator('[aria-label="さわる道具を選ぶ"]').isVisible());await p.click('[data-contact="pet"]');
 await p.locator('.cat-object').click({force:true});assert(await p.evaluate(()=>!!gameState.ui.careAnimation));
 await p.waitForTimeout(2200);await p.evaluate(()=>{getCat(gameState).body.waterLevel=0;render(gameState);});await p.locator('.item-water').click({force:true});assert.equal(await p.evaluate(()=>gameState.ui.careAnimation?.operation),'water');
 await p.waitForTimeout(2200);await p.click('[data-action="open-slot-menu"][data-tab="food"]');assert.equal(await p.locator('[data-item="water_refill"],[data-food="water_refill"]').count(),0);
}
const result=await p.evaluate(()=>{
 let s=structuredClone(gameState),c=getCat(s);const sizes=Object.keys(RESCUE_PROFILES).map(a=>stageCoats(a).length);
 const cats=Object.keys(RESCUE_PROFILES).map(a=>stageCat(c,a,()=>0));
 let n={...s,cats:[{...c,body:{...c.body,days:4,weight:100,sick:false}}],campaign:{...s.campaign,phase:'room',requiredVisit:null},ui:{...s.ui,modal:null}};
 const before=n;n=reduceGameState(n,{type:'GO_SURGERY'});
 return {sizes,ages:cats.map(c=>c.age),conditions:cats.map(c=>c.rescueProfile.condition),low:cats[2].heart<cats[0].heart,slower:updateHeart({...cats[2],heartCap:100},10)-cats[2].heart<10,blocked:n===before,shops:SHOP_CATALOG.every(p=>p.shop==='petshop')};
});
 assert(result.sizes.every((n,i,a)=>i===0||n>a[i-1]),JSON.stringify(result));assert.deepEqual(result.ages,['adult','kitten','kitten','kitten']);assert.deepEqual(result.conditions,[null,null,'injury','injury']);assert(result.low&&result.slower&&result.blocked&&result.shops);
 await p.goto(base+'capture');const capture=await p.evaluate(()=>{let s=structuredClone(gameState);s=reduceGameState(s,{type:'OPEN_TRAP'});const adult=getCat(s).age==='adult'&&!getCat(s).body.sick;s=reduceGameState(s,{type:'START_INTAKE',name:'テスト'});return {adult,layout:s.ui.layoutMode,heart:getCat(s).heart};});assert(capture.adult&&!capture.layout&&capture.heart===50);
 await p.goto(base+'event');await p.click('[data-action="open-outing"]');await p.click('[data-action="open-required-visit"]');assert.equal(await p.evaluate(()=>gameState.campaign.phase),'graduation');
 await p.goto(base+'room');await p.evaluate(()=>{gameState.cats=[stageCat(getCat(gameState),'a3',()=>0)];gameState.campaign.phase='clinic';gameState.campaign.clinicStep='naming';dispatch({type:'START_INTAKE',name:'怪我の子'});});assert.equal(await p.evaluate(()=>getCat(gameState).heart),30);assert.equal(await p.evaluate(()=>getCat(gameState).recoveryUntilDay),2);assert.equal(await p.evaluate(()=>surgeryEligibility(gameState).healthy),false);
 await p.evaluate(()=>dispatch({type:'OPEN_SUPPLIES',tab:'furniture'}));assert.equal(await p.evaluate(()=>gameState.campaign.shopId),'petshop');await p.click('[data-action="back-town"]');assert.equal(await p.evaluate(()=>gameState.campaign.phase),'intake');
 await p.reload();assert.equal(await p.evaluate(()=>getCat(gameState).rescueProfile.condition),'injury');assert.equal(await p.evaluate(()=>getCat(gameState).trustGainRate),.65);
 await p.goto(base+'room');await p.evaluate(()=>dispatch({type:'OPEN_MAP_SHOP',shopId:'clinic'}));assert.equal(await p.evaluate(()=>gameState.campaign.phase),'shop');assert(await p.locator('.clinic-reception').isVisible());
 for(const [width,height]of [[320,568],[375,812]]){
  await p.setViewportSize({width,height});await p.goto(base+'room');await p.click('[data-action="call-cat"]');assert(await p.locator('.call-speech').isVisible());assert.equal(await p.evaluate(()=>getCat(gameState).callStreak),1);
  await p.screenshot({path:`tests/screenshots/call-speech-${width}.png`});assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
  await p.click('[data-action="touch-now"]');assert(await p.locator('[aria-label="さわる道具を選ぶ"]').isVisible());await p.click('[data-action="close-modal"]');
  const changed=await p.evaluate(()=>{gameState.cats[0].name='たろう';gameState.cats[0].nickname=null;gameState.cats[0].callStreak=2;gameState.cats[0].lastCalledAt=Date.now();const random=Math.random;Math.random=()=>0;try{dispatch({type:'EXECUTE_CONTACT',contact:'call'});}finally{Math.random=random;}return getCallName(getCat(gameState));});assert.equal(changed,'たろうちゃん');await p.reload();assert.equal(await p.evaluate(()=>getCallName(getCat(gameState))),changed);
 }
 assert.deepEqual(errors,[]);console.log('PASS meeting requirements and call speech/tool selector/nickname persistence at both sizes',result);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
