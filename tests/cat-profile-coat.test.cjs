const{chromium}=require('playwright'),sharp=require('sharp'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:375,height:764}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('cat-life-sample.html')).href);
 for(const coat of ['calico','calico_split','tux']){
  await p.evaluate(coat=>{const d={...rig.d,headCoat:coat,bodyCoat:coat,legCoat:coat,tailCoat:coat};rig=CatSVG.buildCat(svg,'profile-test',d,390,1);draw(0)},coat);
  const tiles=[];
  for(const [row,name]of ['walk','dash','jump','poop'].entries()){
   await p.click('#pose-open');await p.click(`button[data-pose="${name}"]`);await p.waitForTimeout(600);
   for(let col=0;col<3;col++){
    await p.waitForTimeout(900);
    assert(await p.evaluate(()=>!rig.nodes.face.querySelector('[data-profile-features]')&&!rig.nodes.headSkin.hasAttribute('transform')&&rig.lifeAnatomy.outline.getAttribute('d')===rig.lifeAnatomy.path));
    const shot=await p.screenshot({clip:{x:0,y:150,width:375,height:410}});tiles.push({input:await sharp(shot).resize(225,246).png().toBuffer(),left:col*225,top:row*246});
   }
  }
  await sharp({create:{width:675,height:984,channels:3,background:'#eee'}}).composite(tiles).png().toFile(`tests/screenshots/profile-coat-${coat}.png`);
 }
 assert.deepEqual(errors,[]);console.log('PASS 3 patterned coats × 4 profile poses: shared eye/coat projection, live playback');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
