const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),server=http.createServer((q,r)=>{try{const f=path.join(root,decodeURIComponent(new URL(q.url,'http://local').pathname));r.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.svg')?'image/svg+xml':'text/html');r.end(fs.readFileSync(f));}catch{r.writeHead(404).end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage();for(const [width,height] of [[320,568],[375,812],[440,940]]){await p.setViewportSize({width,height});await p.goto(`http://127.0.0.1:${server.address().port}/index.html?check=1&scenario=town`);for(const shop of ['petshop','clinic','plaza']){await p.click(shop==='plaza'?'[data-action="open-plaza"]':`[data-shop="${shop}"]`);assert(await p.evaluate(()=>{const app=document.querySelector('#app').getBoundingClientRect(),frame=document.querySelector('.campaign-frame').getBoundingClientRect(),screen=document.querySelector('.campaign-screen');return Math.abs(app.top-frame.top)<1&&Math.abs(app.bottom-frame.bottom)<1&&screen.scrollHeight<=screen.clientHeight+1;}),shop+' must fit without extra height');if(shop==='petshop'){
 await p.click('[data-tab="food"]');
 await p.evaluate(()=>{gameState.ui.shopCart={food_dry:7};render(gameState);});
 assert(await p.locator('.store-footer').evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('#app').getBoundingClientRect().bottom-18));
 await p.screenshot({path:`tests/screenshots/shop-food-fit-${width}.png`});
 // Reproduce an embedded preview whose clipping region is shorter than its layout viewport.
 await p.evaluate(()=>{const wrapper=document.createElement('div');wrapper.id='test-clip';wrapper.style.cssText='position:relative;width:100%;flex:none;overflow:hidden;height:'+(app.clientHeight-40)+'px';app.before(wrapper);wrapper.append(app);app.style.height=(innerHeight-48)+'px';render(gameState);});
 await p.waitForTimeout(100);
 assert(await p.locator('.store-footer').evaluate(e=>e.getBoundingClientRect().bottom<=document.querySelector('#test-clip').getBoundingClientRect().bottom-18),'cart must fit clipped preview');
 await p.screenshot({path:`tests/screenshots/shop-clipped-fit-${width}.png`});
 await p.evaluate(()=>{const wrapper=document.querySelector('#test-clip');wrapper.before(app);wrapper.remove();app.style.removeProperty('height');render(gameState);});
 }
 await p.screenshot({path:`tests/screenshots/facility-${shop}-${width}.png`});await p.click('[data-action="back-town"]');}}}finally{await b.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
