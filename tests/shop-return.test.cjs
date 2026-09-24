const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve('index.html')).href);
  for(const status of ['unrescued','raising']){
   await p.evaluate(status=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.cats[0].status=status;gameState.campaign.phase='town';gameState.coins=100;gameState.ui.modal=null;render(gameState);},status);
   for(const shop of ['clinic','super','petshop']){
    await p.locator(`[data-action="open-map-shop"][data-shop="${shop}"]`).tap();
    assert.equal(await p.evaluate(()=>gameState.campaign.phase),'shop');
    assert.equal(await p.evaluate(()=>gameState.campaign.shopId),shop);
    // Also test returning after purchase, and after closing the wallet overlay.
    if(shop!=='clinic')await p.locator('[data-action="buy-shop-item"]:not([disabled])').first().tap();
    await p.locator('.release-shop-heading [data-action="open-wallet"]').tap();
    await p.locator('[data-action="close-wallet"]').tap();
    const saved=await p.evaluate(()=>JSON.stringify({coins:gameState.coins,inventory:gameState.inventory,cats:gameState.cats}));
    await p.getByRole('button',{name:'街へ戻る',exact:true}).tap();
    assert.equal(await p.evaluate(()=>gameState.campaign.phase),'town');
    await p.locator('.town-full-map').waitFor();
    assert.equal(await p.locator('.shop-sheet').count(),0);
    assert.equal(await p.evaluate(()=>JSON.stringify({coins:gameState.coins,inventory:gameState.inventory,cats:gameState.cats})),saved);
   }
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: all 3 shops return to town by touch, before/after rescue, purchases and wallet preserved');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
