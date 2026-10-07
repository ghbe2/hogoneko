const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const [width,height] of [[320,520],[375,764]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.prematureFrames=[];
    new MutationObserver(()=>{
     const app=document.getElementById('app');
     if(document.readyState==='loading'&&app?.textContent.trim())window.prematureFrames.push(app.textContent);
    }).observe(document,{subtree:true,childList:true});
   });
   await page.goto(pathToFileURL(path.resolve('index.html')).href);
   for(let attempt=0;attempt<2;attempt++){
    await page.waitForTimeout(700);
    assert.deepEqual(await page.evaluate(()=>window.prematureFrames),[],'No intermediate version may render during parsing');
    assert.equal(await page.locator('.title-screen').count(),1);
    assert.equal(await page.locator('.title-kicker,.title-screen>p,.title-actions small').count(),0);
    await page.evaluate(()=>dispatch({type:'SYNC_REAL_TIME',at:Date.now()}));
    assert.equal(await page.locator('.title-kicker,.title-screen>p,.title-actions small').count(),0);
    await page.screenshot({path:`tests/screenshots/startup-${width}-${attempt}.png`});
    if(!attempt)await page.reload();
   }
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS no intermediate startup text; reload and timer update preserve current title at both sizes');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
