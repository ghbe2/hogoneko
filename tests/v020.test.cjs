const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await p.goto(pathToFileURL(path.resolve('index.html')).href);
 assert.equal(await p.evaluate(()=>bookItems.length),30);assert.equal(await p.evaluate(()=>new Set(bookItems.filter(i=>i.kind==='placed').map(i=>i.affinityType)).size),14);
 await p.screenshot({path:'tests/screenshots/v020-title.png'});
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='town';render(gameState);});await p.screenshot({path:'tests/screenshots/v020-town.png'});assert.equal(await p.locator('[data-action="go-rescue"]').count(),1);
 for(const area of ['a1','a2','a3','a4'])for(const season of ['spring','summer','autumn','winter']){await p.evaluate(({area,season})=>{gameState.season=season;gameState.campaign.area=area;gameState.campaign.phase='field';render(gameState);},{area,season});assert.ok(await p.locator('.field-scene').evaluate(n=>n.style.backgroundImage.includes('data:image')));}
 for(const phase of ['field','clinic','graduation']){await p.evaluate(phase=>{gameState.campaign.phase=phase;gameState.campaign.area='a1';gameState.season='spring';render(gameState);},phase);await p.screenshot({path:`tests/screenshots/v020-${phase}.png`});}
 for(const shopId of ['super','petshop']){await p.evaluate(shopId=>{gameState.campaign.phase='shop';gameState.campaign.shopId=shopId;render(gameState);},shopId);await p.screenshot({path:`tests/screenshots/v020-${shopId}.png`});assert.equal(await p.locator('.book-shop-scene').count(),1);}
 const checked=await p.evaluate(()=>{gameState.coins=1000;gameState.campaign.phase='room';gameState.cats[0].status='raising';gameState.cats[0].name='もも';gameState.cats[0].types=['human','touch'];gameState.cats[0].heart=50;
  for(const item of bookItems){gameState=reduceGameState(gameState,{type:'BUY_SHOP_ITEM',itemId:item.id});if(!gameState.inventory[item.id])throw Error('purchase '+item.id);
   if(item.kind==='hand'){gameState=reduceGameState(gameState,{type:'SELECT_HAND',itemId:item.id});if(gameState.ui.equippedHand!==item.id)throw Error('equip '+item.id);const trial=reduceGameState(structuredClone(gameState),{type:'FINISH_PLAY',itemId:item.id});if(!trial.ui.lastAffinityLog||getDurability(trial,item.id)>=getDurability(gameState,item.id))throw Error('use '+item.id);}
   else{gameState.ui.layoutMode=true;gameState=reduceGameState(gameState,{type:'DROP_LAYOUT_ITEM',itemId:item.id,x:35,y:item.zone==='wall'?30:65});if(!getPlaced(getRoom(gameState)).some(p=>p.itemId===item.id))throw Error('place '+item.id);gameState=reduceGameState(gameState,{type:'DROP_LAYOUT_ITEM',itemId:item.id,store:true});}
  }gameState.ui.layoutMode=false;gameState.ui.equippedHand='mouse';gameState.campaign.phase='room';gameState.campaign.clinicStep='exam';render(gameState);saveGameState(gameState);return gameState.coins;});
 await p.screenshot({path:'tests/screenshots/v020-room.png'});
 await p.evaluate(()=>{gameState.ui.layoutMode=true;gameState.ui.layoutTrayOpen=true;render(gameState);});await p.screenshot({path:'tests/screenshots/v020-layout.png'});
 assert.equal(await p.locator('.layout-palette-item .book-icon').count(),await p.locator('.layout-palette-item').count());
 await p.reload();assert.equal(await p.evaluate(()=>gameState.coins),checked);assert.equal(await p.evaluate(()=>getCat(gameState).name),'もも');assert.equal(await p.evaluate(()=>bookItems.every(i=>gameState.inventory[i.id]>0)),true);
 await p.evaluate(()=>{titleScreenOpen=false;gameState.campaign.phase='room';gameState.ui.layoutMode=false;render(gameState);});
 for(const width of [320,375,430]){await p.setViewportSize({width,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 assert.deepEqual(errors,[]);console.log('PASS v020: 30 items, purchase/equip/place/store, 20 seasonal scenes, save reload, mobile');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
