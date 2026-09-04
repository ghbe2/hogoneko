const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const doc=fs.readFileSync(path.resolve(__dirname,'../docs/index.html'));
(async()=>{
  assert(process.env.MOCK_VIEW_PASSWORD,'Set MOCK_VIEW_PASSWORD for the test');
  assert(!doc.toString().includes(process.env.MOCK_VIEW_PASSWORD),'Password leaked in deployment');
  const server=http.createServer((req,res)=>{if(req.url!=='/hogoneko/'&&req.url!=='/hogoneko/index.html'){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(doc);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const previewUrl=process.env.TEST_PREVIEW_URL || `http://127.0.0.1:${server.address().port}/hogoneko/`;
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(previewUrl);
    assert.equal(await page.locator('#app').count(),0);
    await page.locator('#password').fill('wrong-password');await page.locator('#enter').click();
    await page.locator('#error').filter({hasText:'パスワードが違います'}).waitFor();
    assert.equal(await page.locator('#app').count(),0);
    await page.locator('#password').fill(process.env.MOCK_VIEW_PASSWORD);await page.locator('#enter').click();
    await page.locator('.title-screen').waitFor();
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.locator('.story-screen').count(),1);
    await page.reload();assert.equal(await page.locator('#password').count(),1);
    await page.locator('#password').fill(process.env.MOCK_VIEW_PASSWORD);await page.locator('#enter').click();
    await page.locator('.title-screen').waitFor();
    assert.equal(await page.locator('[data-action="start-game"]').innerText(),'つづきから');
    assert.equal(errors.length,0,errors.join('\n'));
    const response=await page.request.get(new URL('game.html',previewUrl).href);assert.equal(response.status(),404);
    console.log('PASS: locked entry, wrong/correct password, mobile startup, save across reload, no game.html');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
