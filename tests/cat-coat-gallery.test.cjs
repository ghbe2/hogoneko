const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url'),sharp=require('sharp');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1200,height:900}}),errors=[];p.on('pageerror',e=>{errors.push(e.message);console.error(e.message)});
 await p.goto(pathToFileURL(path.resolve('cat-pose-gallery.html')).href);
 await Promise.all(p.frames().slice(1).map(f=>f.waitForFunction(()=>typeof rig!=='undefined'&&rig?.lifeAnatomy)));
 for(let i=0;i<3;i++){
  const before=await p.frames()[1].evaluate(()=>rig.d.seed);await p.click('#random-coat');
  await p.frames()[1].waitForFunction(v=>rig.d.seed!==v,before,{polling:100});
  const dna=await Promise.all(p.frames().slice(1).map(f=>f.evaluate(()=>JSON.stringify(rig.d))));assert.equal(new Set(dna).size,1);
  await p.locator('article[data-pose="alert"] button').click();const f=p.frames().at(-1);await f.waitForFunction(()=>typeof rig!=='undefined'&&rig?.lifeAnatomy);await f.waitForFunction(d=>JSON.stringify(rig.d)===d,dna[0]);
  const tiles=[];for(let j=0;j<4;j++){await p.waitForTimeout(1700);const shot=await p.locator('#detail iframe').screenshot();tiles.push({input:await sharp(shot).resize(270,300,{fit:'contain'}).png().toBuffer(),left:j*270,top:0});}
  await sharp({create:{width:1080,height:300,channels:3,background:'#eee'}}).composite(tiles).png().toFile(`tests/screenshots/coat-turn-${i}.png`);
  // The complete original face turns as one unit; no independent coat transform.
  await f.evaluate(()=>{paused=true;const paint=rig.nodes.headSkin.innerHTML;for(const t of [2.2,4.5]){pose='alert';poseTime=t;poseTransition=null;draw(0);if(rig.nodes.headSkin.innerHTML!==paint||rig.nodes.headSkin.hasAttribute('transform'))throw Error('Coat moved independently of the face');}});
  await p.click('#close');
 }
 for(const [width,height]of [[320,520],[375,764]]){await p.setViewportSize({width,height});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`tests/screenshots/coat-controls-${width}.png`});}
 assert.deepEqual(errors,[]);console.log('PASS random coats shared across 19 poses/detail; forehead turn; mobile controls');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
