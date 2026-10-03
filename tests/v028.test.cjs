const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href);
await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding.status='done';gameState.campaign.phase='room';gameState.cats[0].status='raising';gameState.ui.modal=null;gameState.cats[0].age='adult';gameState.cats[0].phenotype={...phenotypeFor(getCat(gameState)),age:'adult'};gameState.cats[0].body.hair=Array.from({length:7},(_,i)=>({id:'texture'+i,x:18+i*9,y:66+i%3*6}));render(gameState);});
assert.equal(await p.evaluate(()=>[...svgRigs.values()][0].rig.scale),1.25);
assert.ok(await p.locator('[data-room-world]').evaluate(n=>decodeURIComponent(n.style.backgroundImage).includes('storybook-fibre-v026')));
assert.ok(await p.locator('.shed-hair').first().evaluate(n=>parseFloat(n.style.getPropertyValue('--hair-size'))>=27));
await p.screenshot({path:'tests/screenshots/v028-adult.png'});
await p.evaluate(()=>{gameState.cats[0].age='kitten';gameState.cats[0].phenotype.age='kitten';render(gameState);});assert.equal(await p.evaluate(()=>[...svgRigs.values()][0].rig.scale),1);
await p.screenshot({path:'tests/screenshots/v028-kitten.png'});
assert.equal(await p.evaluate(()=>texturedStorySVG(SB.rooms.spring_day,true)===texturedStorySVG(SB.rooms.spring_day,true)),true);
assert.deepEqual(errors,[]);console.log('PASS v028: adult 1.25, kitten unchanged, larger hair, cached static texture');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
