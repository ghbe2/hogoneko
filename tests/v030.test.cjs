const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage({viewport:{width:375,height:812}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});
 const url=process.env.TEST_CHECK_URL||pathToFileURL(path.resolve('index.html')).href;
 async function open(target){await p.goto(target);await p.waitForFunction(()=>document.querySelector('.check-hub-link')||document.querySelector('#enter:not(:disabled)'));if(await p.locator('#password').count()){await p.locator('#password').fill(process.env.MOCK_VIEW_PASSWORD||'hogohogo');await p.locator('#enter').click();}await p.locator('.check-hub-link').waitFor();}
 await open(url+'?check=1&scenario=room');await p.evaluate(()=>localStorage.setItem('hogoneko_mock_save','NORMAL_SAVE_SENTINEL'));
 const scenarios={intro:'town',field:'field',capture:'field',clinic:'clinic',naming:'clinic',intake:'intake',room:'room',surgery:'room',underweight:'room',poor:'room',event:'room',tnr:'room',result:'result','tnr-result':'result',town:'town'};
 for(const [scenario,phase] of Object.entries(scenarios)){
  console.log('CHECK',scenario);
  await open(url+'?check=1&scenario='+scenario);
  assert.equal(await p.evaluate(()=>gameState.campaign.phase),phase,scenario);
  assert.equal(await p.evaluate(()=>localStorage.getItem('hogoneko_mock_save')),'NORMAL_SAVE_SENTINEL',scenario+' isolated');
  assert.equal(await p.evaluate(()=>location.search),'?check=1');
  if(scenario==='result'||scenario==='tnr-result')assert.equal(await p.evaluate(()=>gameState.campaign.outcome),scenario==='result'?'adopted':'tnr');
  if(scenario==='capture'){await p.locator('[data-action="open-trap"]').click({force:true});await p.locator('[data-action="go-clinic"]').waitFor({timeout:10000});}
  if(scenario==='surgery'){await p.locator('[data-action="open-outing"]').click();await p.locator('[data-action="open-required-visit"]').click();await p.locator('[data-action="start-surgery"]').waitFor();}
 }
 await open(url+'?check=1&scenario=room');await p.evaluate(()=>{gameState.coins=123;dispatch({type:'CLEAR_MESSAGE'});});await p.reload();await p.locator('.check-hub-link').waitFor();assert.equal(await p.evaluate(()=>gameState.coins),123);
 await p.locator('.check-hub-link').click();await p.locator('#phases a').first().waitFor();
 assert.equal(await p.locator('#phases a').count(),11);assert.equal(await p.locator('#branches a').count(),4);
 const hub=p.url();const links=await p.locator('a.card').evaluateAll(nodes=>nodes.filter(n=>!n.href.includes('?')).map(n=>n.href));
 for(const link of links){await p.goto(link);await p.waitForTimeout(500);assert.equal(await p.locator('#password').count(),0,'session unlock '+link);assert(await p.locator('svg,table').count()>0,'rendered '+link);}
 await p.goto(hub);await p.screenshot({path:'tests/screenshots/v030-hub.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS v030: 15 scenarios, actual reveal/surgery, normal save isolation, reload, six design pages');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
