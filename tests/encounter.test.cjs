const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.setHeader('Content-Type',file.endsWith('.svg')?'image/svg+xml':file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'chrome',headless:true}),base=`http://127.0.0.1:${server.address().port}/index.html?check=1&scenario=field`;try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [width,height]of [[320,568],[375,812]]){
  await p.setViewportSize({width,height});await p.goto(base);await p.waitForTimeout(250);
  await p.evaluate(()=>{encounterFoods().forEach(f=>gameState.inventory[f.id]=3);gameState.campaign.fieldFood='starter_food';render(gameState);});
  assert.equal(await p.locator('.field-tail,.field-eyes').count(),0);assert.equal(await p.locator('.bait-option').count(),6);
  assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
  const center=await p.evaluate(()=>{const r=document.querySelector('.bait-carousel').getBoundingClientRect(),o=document.querySelector('.bait-option.chosen').getBoundingClientRect(),c=document.querySelector('.encounter-trap').getBoundingClientRect();return [Math.abs(r.left+r.width/2-o.left-o.width/2),Math.abs(c.left+c.width/2-o.left-o.width/2)];});assert(center.every(n=>n<2),JSON.stringify(center));
  await p.screenshot({path:`tests/screenshots/encounter-select-${width}.png`});
  const before=await p.evaluate(()=>gameState.campaign.fieldFood);await p.locator('.bait-carousel').click({position:{x:width-25,y:35}});assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),before);
  assert.equal(await p.locator('.bait-center-mark').count(),0);
  const railBox=await p.locator('.bait-carousel').boundingBox();await p.mouse.move(width/2,railBox.y+30);await p.mouse.wheel(0,130);await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_dry');
  await p.mouse.move(width/2,railBox.y+30);await p.mouse.down();await p.mouse.move(width/2-118,railBox.y+30,{steps:10});await p.evaluate(()=>render(gameState));await p.waitForTimeout(1100);await p.mouse.up();await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_wet');
  const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:railBox.y+30}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2-118*i/8,y:railBox.y+30}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(450);assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_fish');await cdp.detach();
  await p.locator('.bait-carousel').focus();for(let i=0;i<2;i++){await p.keyboard.press('ArrowRight');await p.waitForTimeout(400);}
  assert.equal(await p.evaluate(()=>gameState.campaign.fieldFood),'food_soup');
  assert(!/%|[０-９]％/.test(await p.locator('.encounter-picker').innerText()));await p.screenshot({path:`tests/screenshots/encounter-bait-${width}.png`});
  const cage=await p.locator('.encounter-trap').boundingBox(),scene=await p.locator('.field-scene').boundingBox();await p.mouse.move(cage.x+cage.width/2,cage.y+30);await p.mouse.down();await p.mouse.move(scene.x+scene.width/2,scene.y+scene.height*.5,{steps:8});await p.mouse.up();
  const rolled=await p.evaluate(()=>({e:gameState.campaign.encounter,waiting:gameState.campaign.trapWaiting,stock:gameState.inventory.food_soup,bait:gameState.campaign.bait}));assert(rolled.waiting&&rolled.e);assert.equal(rolled.stock,2);assert.deepEqual(rolled.bait,['food_soup']);assert.equal(rolled.e.cat.status,'captured');
  await p.evaluate(()=>dispatch({type:'FIELD_PLACE_TRAP',trapId:'trap_standard',foodId:'food_dry'}));assert.deepEqual(await p.evaluate(()=>gameState.campaign.encounter),rolled.e);
  await p.reload();assert.deepEqual(await p.evaluate(()=>gameState.campaign.encounter),rolled.e);if(await p.locator('[data-action="start-game"]').count())await p.click('[data-action="start-game"]');await p.waitForTimeout(4500);await p.click('[data-action="open-trap"]');assert.deepEqual(await p.evaluate(()=>getCat(gameState).phenotype),rolled.e.cat.phenotype);assert.equal(await p.evaluate(()=>gameState.inventory.food_soup),2);
 }
 await p.goto(base);
 const pools=await p.evaluate(()=>Object.keys(RESCUE_PROFILES).map(a=>{const p=encounterPools(a);return p.rare.length>0&&p.common.length>0&&p.rare.every(c=>!p.common.includes(c));}));assert(pools.every(Boolean));
 const rate=await p.evaluate(()=>{const s=gameState;let low=0,high=0;for(let i=0;i<1000;i++){const make=()=>{let first=true;return ()=>{if(first){first=false;return i/1000;}return .5;};};low+=rollEncounter(s,'starter_food',make()).rare;high+=rollEncounter(s,'food_soup',make()).rare;}return {low,high};});assert.deepEqual(rate,{low:30,high:40});
 for(const effect of ['rainbow','moon','breeze']){
  await p.evaluate(effect=>{const e=rollEncounter(gameState,'food_soup',()=>effect==='breeze'?.5:0);e.scene=effect;e.readyAt=gameNow()+60000;gameState.campaign={...gameState.campaign,trapPlaced:true,trapWaiting:true,trapReady:false,trapPosition:{x:50,y:68},encounter:e};render(gameState);},effect);
  await p.screenshot({path:`tests/screenshots/encounter-${effect}.png`});
 }
 const building=await p.locator('.encounter-landscape rect[x="183"][y="143"]').first().getAttribute('height');assert.equal(building,'295');assert.deepEqual(errors,[]);console.log('PASS carousel centering, keyboard/mouse, single bait, pinned result and reload, hidden odds, rare 30/40 per 1000, scenery at both sizes');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
