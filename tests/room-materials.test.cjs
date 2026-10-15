const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.campaign.requiredVisit=null;gameState.cats[0].status='raising';gameState.cats[0].body.days=0;gameState.ui.modal=null;render(gameState);});
 const art=await p.evaluate(()=>{const raw=SB.rooms.spring_day,out=RoomMaterials.decorate(raw),doc=new DOMParser().parseFromString(out,'image/svg+xml');return {groups:doc.querySelectorAll('[data-room-material]').length,windowSame:doc.querySelector('#outside').outerHTML===new DOMParser().parseFromString(raw,'image/svg+xml').querySelector('#outside').outerHTML,stable:out===RoomMaterials.decorate(raw),plain:RoomMaterials.decorate(raw,'plain').includes('data-room-material='),background:decodeURIComponent(document.querySelector('[data-room-world]').style.backgroundImage)};});
 assert.equal(art.groups,4);assert.equal(art.windowSame,true);assert.equal(art.stable,true);assert.equal(art.plain,false);assert.ok(!art.background.includes('storybook-fibre-v026'));assert.ok(art.background.includes('data-room-material'));
 for(const [width,height] of [[320,520],[375,764]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(250);
  const bounds=await p.evaluate(()=>({w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,buttons:[...document.querySelectorAll('.bottom-menu button')].map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom};})}));
  assert.ok(bounds.sw<=width&&bounds.sh<=height,JSON.stringify(bounds));assert.ok(bounds.buttons.every(b=>b.b<=height&&b.x>=0));console.log('Measured',JSON.stringify(bounds));
  await p.screenshot({path:`tests/screenshots/materials-room-${width}.png`});
  await p.evaluate(()=>{gameState.cats[0].body.lifeTicks=5;render(gameState);});await p.screenshot({path:`tests/screenshots/materials-night-${width}.png`});await p.evaluate(()=>{gameState.cats[0].body.lifeTicks=0;render(gameState);});
 }
 await p.goto(pathToFileURL(path.resolve('art/cat-directions/room-study.html')).href);await p.selectOption('#daytime','night');assert.equal(await p.locator('[data-room-material]').count(),4);await p.selectOption('#season','winter');assert.equal(await p.locator('#outside circle').count()>0,true);
 assert.deepEqual(errors,[]);console.log('PASS: clipped room materials, outside untouched, plain preset, day/night, responsive layout, shared study');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
