const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 for(const [width,height] of [[320,568],[375,812]])for(const scenario of ['intro','field','capture','clinic','naming','intake','room','surgery','event','result','tnr-result','town','petshop','plaza']){
  await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario='+(['petshop','plaza'].includes(scenario)?'town':scenario));
  if(scenario==='petshop')await p.evaluate(()=>dispatch({type:'OPEN_MAP_SHOP',shopId:'petshop'}));
  if(scenario==='plaza')await p.evaluate(()=>dispatch({type:'OPEN_PLAZA'}));
  await p.waitForTimeout(150);
  await p.evaluate(()=>{const host=document.createElement('div');host.id='short-host';host.style.cssText='position:relative;overflow:hidden;flex:none;width:100%;height:'+(app.clientHeight-40)+'px';app.before(host);host.append(app);render(gameState);});
  await p.waitForTimeout(150);
  const report=await p.evaluate(()=>{
   const host=document.querySelector('#short-host').getBoundingClientRect(),frame=app.getBoundingClientRect();
   const selectors='.command-dock button,.campaign-actions button,.store-footer button,.reception-footer button,.layout-done';
   const hidden=[...app.querySelectorAll(selectors)].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.height&&(r.bottom>host.bottom+.5||r.top<frame.top-.5)}).map(n=>n.textContent);
   return{host:host.bottom,frame:frame.bottom,hidden};
  });
  assert(Math.abs(report.frame-report.host)<1,scenario+' root fits host '+JSON.stringify(report));assert.deepEqual(report.hidden,[],scenario+' controls');
  await p.screenshot({path:`tests/screenshots/host-${width}-${scenario}.png`});
  await p.evaluate(()=>{const host=document.querySelector('#short-host');host.style.height=(parseFloat(host.style.height)+20)+'px';});
  await p.waitForTimeout(50);assert(await p.evaluate(()=>Math.abs(app.getBoundingClientRect().bottom-document.querySelector('#short-host').getBoundingClientRect().bottom)<1),scenario+' expands after resize');
  console.log('PASS host',width,scenario);
 }
 assert.deepEqual(errors,[]);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
