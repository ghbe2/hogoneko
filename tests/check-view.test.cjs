const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=process.env.TEST_HUB_URL||pathToFileURL(path.resolve('check.html')).href;await p.goto(url);
 if(await p.locator('#password').count()){await p.locator('#password').fill(process.env.MOCK_VIEW_PASSWORD);await p.locator('#enter').click();}
 await p.locator('a.card').first().waitFor();const count=await p.locator('a.card').count();assert.equal(count,23);
 for(let i=0;i<count;i++){
  await p.locator('a.card').nth(i).click();await p.locator('.check-toolbar a').waitFor();
  const frame=p.frameLocator('#preview');await frame.locator('body').waitFor();
  await frame.locator('.check-hub-link,svg,table').first().waitFor();
  const bar=await p.locator('.check-toolbar').boundingBox(),pane=await p.locator('#preview').boundingBox();assert(bar.y+bar.height<=pane.y+.5);
  if(i===6)await p.screenshot({path:'tests/screenshots/check-view-room.png'});
  await p.locator('.check-toolbar a').click();await p.locator('a.card').first().waitFor();
 }
 assert.deepEqual(errors,[]);console.log('PASS: all 23 check screens open and return through a separate non-overlapping toolbar');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
