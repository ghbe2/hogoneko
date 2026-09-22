const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
async function drag(p,from,to){const a=await p.locator(from).boundingBox(),b=await p.locator(to).boundingBox();await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(b.x+b.width/2,b.y+b.height*.65,{steps:14});await p.mouse.up();}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const initial=await p.evaluate(()=>({coins:gameState.coins,inventory:gameState.inventory,placed:getPlaced(getRoom(gameState)).map(p=>p.itemId)}));
  assert.equal(initial.coins,50);assert.equal(initial.inventory.feather,0);assert.equal(initial.inventory.groom_comb,0);assert(!initial.placed.includes('tower'));
  await p.locator('[data-action="start-game"]').click();for(let i=0;i<3;i++)await p.locator('[data-action="next-story"]').click();
  await p.locator('[data-action="toggle-guide"]').click();
  await drag(p,'[data-field-drag="trap"]','.field-scene');await drag(p,'[data-field-drag="bait"]','.trap');
  await p.locator('[data-action="finish-field-prep"]').click();await p.locator('[data-action="open-trap"]').waitFor({timeout:6000});await p.locator('[data-action="open-trap"]').click({force:true});
  await p.locator('[data-action="go-clinic"]').waitFor();
  const dna=await p.evaluate(()=>JSON.stringify(getCat(gameState).phenotype));assert.notEqual(dna,'null');
  await p.screenshot({path:'tests/screenshots/v017-capture.png'});
  await p.locator('[data-action="go-clinic"]').click();await p.locator('[data-action="start-naming"]').waitFor();
  assert((await p.locator('.clinic-summary-receipt').innerText()).includes('12 コイン'));
  await p.locator('[data-action="start-naming"]').click();await p.locator('#campaign-cat-name').fill('あずき');await p.locator('[data-action="start-intake"]').click();
  assert.equal(await p.evaluate(()=>gameState.coins),38);
  assert.equal(await p.locator('.layout-palette-item').count(),4);
  // Find the cheapest positive furniture set for each of all 136 one/two-type combinations.
  const analysis=await p.evaluate(()=>{
   const types=CONFIG.cat.types,combos=types.flatMap((a,i)=>[[a],...types.slice(i+1).map(b=>[a,b])]);
   const solutions=combos.map(types=>{
    const s=structuredClone(gameState);s.cats[0].types=types;
    const options=SHOP_CATALOG.filter(p=>p.category==='furniture');let best=null;
    for(let mask=0;mask<1<<options.length;mask++){
     const chosen=options.filter((_,i)=>mask>>i&1),cost=chosen.reduce((n,p)=>n+(owned(s,p.id)?0:p.price),0);
     if(best&&cost>=best.cost)continue;
     s.rooms[0].floor=['bowl','water','litter'].map(itemId=>({itemId,...CONFIG.stage1.defaultLayout[itemId]}));s.rooms[0].wall=[];
     for(const p of chosen){const item=getItem(p.id);s.rooms[0][item.zone].push({itemId:p.id,...CONFIG.stage1.defaultLayout[p.id]});}
     if(getRoomComfortBreakdown(s).canExit)best={types,cost,ids:chosen.map(p=>p.id)};
    }
    return best;
   });
   return {missing:solutions.filter(s=>!s).length,maxCost:Math.max(...solutions.map(s=>s?.cost||0)),current:solutions.find(s=>s.types.join(',')===[...getCat(gameState).types].sort((a,b)=>types.indexOf(a)-types.indexOf(b)).join(','))};
  });
  assert.equal(analysis.missing,0);assert(analysis.maxCost<=38);console.log('Intake all combinations',analysis);
  const choice=analysis.current;
  assert(choice);
  await p.locator('[data-action="open-supplies"]').click();
  assert(await p.locator('[aria-label="ショップ"]').count());
  await p.screenshot({path:'tests/screenshots/v017-shop.png'});
  for(const id of choice.ids){if(!await p.evaluate(id=>owned(gameState,id),id))await p.locator(`[data-action="buy-shop-item"][data-item="${id}"]`).click();}
  await p.locator('.release-sheet [data-action="close-modal"]').click();
  // Keep UI setup deterministic, without granting inventory or comfort.
  await p.evaluate(ids=>{for(const entry of [...getPlaced(getRoom(gameState))])if(!getItem(entry.itemId).essential&&!ids.includes(entry.itemId))dispatch({type:'TOGGLE_PLACED_ITEM',itemId:entry.itemId});for(const id of ids)if(!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))dispatch({type:'TOGGLE_PLACED_ITEM',itemId:id});},choice.ids);
  await p.locator('[data-action="call-intake-cat"]').click();await p.locator('[data-action="close-schedule-intro"]').waitFor();await p.locator('[data-action="close-schedule-intro"]').click();
  assert.equal(await p.evaluate(()=>JSON.stringify(getCat(gameState).phenotype)),dna);
  await p.locator('.wallet-open').click();const before=await p.evaluate(()=>gameState.coins);
  await p.locator('[data-action="reward-ad"]').click();await p.locator('[data-action="cancel-reward-ad"]').click();await p.waitForTimeout(3350);assert.equal(await p.evaluate(()=>gameState.coins),before);
  await p.locator('[data-action="reward-ad"]').click();await p.waitForTimeout(3350);assert.equal(await p.evaluate(()=>gameState.coins),before+50);
  await p.screenshot({path:'tests/screenshots/v017-wallet.png'});await p.locator('[data-action="close-wallet"]').click();
  const unit=await p.evaluate(()=>{
   const original=gameState.coins;
   let s=reduceGameState(gameState,{type:'BUY_SHOP_ITEM',itemId:'food_dry',price:0});
   const pack=s.inventory.food_dry-gameState.inventory.food_dry,price=original-s.coins;
   const forged=reduceGameState(s,{type:'BUY_SHOP_ITEM',itemId:'nonexistent',price:0})===s;
   const unowned=reduceGameState(s,{type:'DROP_LAYOUT_ITEM',itemId:'hammock',x:30,y:35})===s;
   s={...s,coins:0};const insufficient=reduceGameState(s,{type:'BUY_SHOP_ITEM',itemId:'ball'})===s;
   const duplicate=reduceGameState(s,{type:'COMPLETE_REWARD_AD',token:'old'})===s;
   return {pack,price,forged,unowned,insufficient,duplicate};
  });assert.deepEqual(unit,{pack:6,price:4,forged:true,unowned:true,insufficient:true,duplicate:true});
  await p.evaluate(()=>{dispatch({type:'OPEN_SUPPLIES',tab:'play'});});await p.locator('[data-item="peek_toy"][data-action="buy-shop-item"]').click();await p.locator('.release-sheet [data-action="close-modal"]').click();
  await p.locator('[data-action="open-slot-menu"][data-tab="play"]').click();assert(await p.locator('.bag-shop').count());await p.locator('[data-action="select-hand"][data-item="peek_toy"]').click();
  assert((await p.locator('[data-tab="play"][data-command="cat"]').innerText()).includes('かくれネズミ'));
  await p.evaluate(()=>{gameState.ui.reaction=null;gameState.ui.catFocus=null;gameState.cats[0].heart=85;render(gameState);});
  await p.screenshot({path:'tests/screenshots/v017-room.png'});
  await p.evaluate(()=>{gameState.ui.modal='test-motion';const el=document.querySelector('.cat-object');el._travelAnimation?.cancel();el.classList.remove('jumping');el.classList.add('walking');el.style.setProperty('--cat-facing','-1');});await p.waitForTimeout(150);assert.equal(await p.locator('.cat-object svg').getAttribute('data-pose'),'walk');await p.screenshot({path:'tests/screenshots/v017-walk.png'});
  const savedCoins=await p.evaluate(()=>gameState.coins);await p.reload();await p.locator('[data-action="start-game"]').click();
  assert.equal(await p.evaluate(()=>JSON.stringify(getCat(gameState).phenotype)),dna);assert.equal(await p.evaluate(()=>gameState.coins),savedCoins);assert.equal(await p.evaluate(()=>gameState.inventory.peek_toy),1);
  // Both outcomes charge once, and the next cat gets a different persistent phenotype.
  const outcomes=await p.evaluate(()=>{
   return [95,20].map(heart=>{let s=structuredClone(gameState);s.cats[0].heart=heart;s.cats[0].body.days=7;s.cats[0].body.weight=3500;s.cats[0].body.hunger=false;s.cats[0].body.sick=false;s.campaign.phase='graduation';s.coins=50;
    const n=reduceGameState(s,{type:'SEND_EVENT'});const twice=reduceGameState(n,{type:'SEND_EVENT'});
    const fresh=reduceGameState(n,{type:'NEXT_RESCUE'});return {outcome:n.campaign.outcome,coins:n.coins,once:twice===n,ear:n.cats[0].phenotype.earCut,reset:fresh.cats[0].phenotype===null};});
  });assert(outcomes.every(o=>o.coins===32&&o.once&&o.reset));assert.equal(outcomes[1].ear,'left');
  await p.setViewportSize({width:375,height:667});await p.evaluate(()=>dispatch({type:'OPEN_WALLET'}));
  assert(await p.locator('.wallet-sheet').evaluate(n=>n.scrollHeight<=n.clientHeight+2));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log('PASS v017',unit,outcomes);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
