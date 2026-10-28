const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{const p=await b.newPage({viewport:{width:1450,height:850}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('cat-reaction-review.html')).href);await p.click('#labels');
for(const family of ['calico','tortie','tabby','tux','black','white']){
 await p.evaluate(family=>{for(let n=1;n<10000;n++){if(CatSVG.coats[CatSVG.sampleDNA(n).headCoat].family===family){seed=n;break;}}time=0;mount();},family);
 const initial=await p.evaluate(()=>rigs.map(({rig})=>rig.depthOriginalSkin));
 for(let frame=0;frame<3;frame++){await p.waitForTimeout(1100);await p.screenshot({path:`tests/screenshots/reaction-coat-${family}-${frame}.png`});}
 assert.deepEqual(await p.evaluate(()=>rigs.map(({rig})=>rig.depthOriginalSkin)),initial);
 assert(await p.evaluate(()=>rigs.every(({i,rig})=>{const f=reactionFrame(i,time,field('personality').value,field('operation').value);return Number.isFinite(f.faceTurn)&&rig.nodes.face.querySelectorAll('ellipse,circle').length===0&&!rig.nodes.face.innerHTML.includes('NaN');})));
 // The iris clip and eye contour are deformed by the same field, not separate transforms.
 assert(await p.evaluate(()=>rigs.every(({rig})=>[...rig.nodes.face.querySelectorAll('defs')].every(def=>def.querySelector('path').getAttribute('d')===def.nextElementSibling.getAttribute('d')))));
}
for(const width of [320,375]){await p.setViewportSize({width,height:width===320?568:812});await p.waitForTimeout(600);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:`tests/screenshots/reaction-depth-${width}.png`,fullPage:true});}
assert.deepEqual(errors,[]);console.log('PASS 6 coat families x 5 reactions, animated capture, immutable identity, matching eye clips, mobile sizes');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
