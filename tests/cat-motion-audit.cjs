const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
// Capture live RAF playback, not manually positioned keyframes. Keep evidence per pose.
(async()=>{
 const label=process.argv[2]||'final',out=path.resolve('tests/screenshots/life-audit-'+label);fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await b.newPage({viewport:{width:375,height:764}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve('cat-life-sample.html')).href);const names=process.argv[3]?process.argv[3].split(','):await p.evaluate(()=>Object.keys(poseLabels));
  for(const name of names){
   await p.click('#pose-open');await p.click(`button[data-pose="${name}"]`);await p.waitForTimeout(550);const tiles=[],times=[];
   for(let i=0;i<12;i++){
    await p.waitForTimeout(650);times.push(await p.locator('#cat').getAttribute('data-time'));
    const shot=await p.screenshot({clip:{x:0,y:150,width:375,height:410}}),tile=await sharp(shot).resize(225,246).png().toBuffer();
    tiles.push({input:tile,left:(i%4)*225,top:Math.floor(i/4)*246});
   }
   await sharp({create:{width:900,height:738,channels:3,background:'#eee'}}).composite(tiles).png().toFile(path.join(out,name+'.png'));
   if(Number(times.at(-1))-Number(times[0])<7)throw Error('Incomplete playback: '+name);
   console.log(name,times[0],times.at(-1));
  }
  if(errors.length)throw Error(errors.join('\n'));console.log('DONE',out);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
