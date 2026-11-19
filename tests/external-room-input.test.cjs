const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
 for(const touch of [false,true]){
  const p=await b.newPage({viewport:{width:375,height:812},hasTouch:touch,isMobile:touch});
  await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&debug-play=1&debug-start=renovated');
  await p.waitForSelector('[data-alpha-route="alpha-app"]');
  const control=p.locator('[data-alpha-route="alpha-app"]');
  await control[touch?'tap':'click']();
  await p.waitForTimeout(300);
  const result=await p.evaluate(()=>({modal:gameState.ui.modal,pan:gameState.ui.roomPan}));
  console.log(touch?'touch':'mouse',result);
  assert.equal(result.modal,'notebook','reward button must open phone, not start room pan');
  await p.locator('.home-phone-close')[touch?'tap':'click']();
  await p.locator('[data-action="open-outing"]')[touch?'tap':'click']();
  await p.locator('[data-action="open-map-shop"][data-shop="petshop"]')[touch?'tap':'click']();
  // The renovated preset is used for the pan collision above. Return only the
  // renovation flag to pre-purchase state, then use the actual shop controls.
  await p.evaluate(()=>{gameState.household.renovation=0;gameState.coins=130;render(gameState)});
  await p.locator('.renovate-home')[touch?'tap':'click']();
  const r=await p.locator('[data-hh-buy]').boundingBox();
  if(touch){for(let i=0;i<3;i++)await p.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);}else await p.mouse.click(r.x+r.width/2,r.y+r.height/2,{clickCount:3,delay:35});
  assert.deepEqual(await p.evaluate(()=>[gameState.household.renovation,gameState.coins]),[1,30]);
  console.log('PASS triple purchase responds once',touch?'touch':'mouse');
  await p.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
