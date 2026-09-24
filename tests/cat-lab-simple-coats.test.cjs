const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 if(await page.locator('#pause').getAttribute('aria-pressed')==='false')await page.locator('#pause').click();
 await page.locator('[data-preset="G"]').click();await page.selectOption('#age','adult');
 const shots=[];
 for(const coat of ['calico','calico_B','calico_split','tortie','tortie_black_1','tortie_gray_2']){
  await page.selectOption('#bodyCoat',coat);await page.selectOption('#legCoat',coat);await page.selectOption('#tailCoat',coat);
  assert(await page.evaluate(c=>CatSurface.get(catLab.coats[c],123).shapes.length<=7,coat));
  for(const pose of ['sit','walk']){await page.locator(`[data-pose="${pose}"]`).click();shots.push({name:coat+' '+pose,svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});}
 }
 await page.setContent('<style>body{margin:0;display:grid;grid-template-columns:repeat(6,1fr);background:#ecefe4;font:12px sans-serif}article{text-align:center;border:1px solid #d4d9cc;padding:8px}svg{width:100%;height:270px}</style>'+shots.map(({name,svg},i)=>`<article>${name}${svg.replace('id="hero"',`id="shot${i}"`).replace(/hero-(\d+)/g,`shot${i}-hero-$1`)}</article>`).join(''));
 await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-simple-coats.png'),fullPage:true});assert.equal(errors.length,0);console.log('PASS: simplified calico / tortie A B C, <= 7 surface shapes, front and side rendering');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
