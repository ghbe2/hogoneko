const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');let clinicArt;
 for(const kind of ['clinic','plaza','petshop']){
  await p.evaluate(kind=>dispatch(kind==='plaza'?{type:'OPEN_PLAZA'}:{type:'OPEN_MAP_SHOP',shopId:kind}),kind);
  const selectors=kind==='petshop'?['.store-clerk-head','.shoulder-bird','.store-rabbit-ear']:['.reception-staff-head','.reception-staff-eyes','.reception-staff-hand'];
  if(kind!=='petshop'){const art=await p.locator('.reception-staff-head').innerHTML();if(kind==='clinic')clinicArt=art;else assert.notEqual(art,clinicArt);}
  const base=await p.evaluate(selectors=>selectors.map(s=>getComputedStyle(document.querySelector(s)).transform),selectors);
  await p.evaluate(selectors=>{window.motionNodes=selectors.map(s=>document.querySelector(s));window.motionValues=selectors.map(()=>new Set());},selectors);
  // Exercise real elapsed time and repeated whole-screen updates, not just animation declarations.
  for(let i=0;i<12;i++){await p.waitForTimeout(300);await p.evaluate(selectors=>{render(gameState);selectors.forEach((s,j)=>{const n=document.querySelector(s);if(n!==window.motionNodes[j])throw Error('Actor was recreated: '+s);window.motionValues[j].add(getComputedStyle(n).transform)});},selectors);}
  assert((await p.evaluate(()=>window.motionValues.map(s=>s.size))).every(n=>n>1),kind+' must visibly move');
  await p.screenshot({path:`tests/screenshots/facility-motion-${kind}-${width}.png`});
  assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));
  await p.emulateMedia({reducedMotion:'reduce'});assert(await p.evaluate(selectors=>selectors.every(s=>document.querySelector(s).getAnimations().length===0),selectors));await p.emulateMedia({reducedMotion:'no-preference'});
 }
 }assert.deepEqual(errors,[]);console.log('PASS distinct staff, real-time motion for all humans/parrot/rabbit despite rerenders, both sizes, reduced motion.');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
