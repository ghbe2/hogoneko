const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const errors=[];for(const [width,height]of [[320,568],[375,812],[655,872]]){
 const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await p.click('[data-action="start-game"]');await p.waitForSelector('.introduction-dialogue');await p.waitForFunction(()=>!document.querySelector('.introduction-next').disabled);let reference,dna;
 for(let i=0;i<3;i++){
  if(i){await p.click('[data-action="next-story"]');await p.waitForFunction(()=>!document.querySelector('.introduction-next').disabled);}
  const r=await p.evaluate(()=>{const note=document.querySelector('.introduction-dialogue'),speech=note.querySelector('.introduction-speech'),senior=note.querySelector('.introduction-senior'),rect=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};return {boxes:[speech,senior,note.querySelector('p'),note.querySelector('nav'),document.querySelector('.introduction-picture')].map(rect),dna:[...document.querySelectorAll('.intro-neighbor-cat')].map(n=>n.dataset.dna),overflow:note.querySelector('p').scrollHeight>note.querySelector('p').clientHeight+1,bottom:note.getBoundingClientRect().bottom,appBottom:app.getBoundingClientRect().bottom,extension:getComputedStyle(senior,':before').content};});
  assert.equal(r.dna.length,2);assert(!r.overflow,'full copy fits');assert.equal(r.extension,'none','no fake body');assert.equal(r.boxes[1][1],r.boxes[0][1]-11,'portrait rises slightly above bubble');assert(Math.abs(r.boxes[1][1]+r.boxes[1][3]-(r.boxes[0][1]+r.boxes[0][3]))<=1);assert(r.bottom<=r.appBottom);
  const contrast=await p.evaluate(()=>{const b=app.querySelector('.introduction-next'),s=getComputedStyle(b),rgb=s.backgroundColor.match(/\d+/g).map(Number),ink=s.color.match(/\d+/g).map(Number),lum=a=>a.map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((v,x,i)=>v+x*[.2126,.7152,.0722][i],0),r=b.getBoundingClientRect(),n=b.closest('.introduction-speech').getBoundingClientRect();return {text:(lum(ink)+.05)/(lum(rgb)+.05),height:r.height,inside:r.top>=n.top&&r.bottom<=n.bottom&&r.right<=n.right-8};});
  assert(contrast.inside&&contrast.text>=4.5&&contrast.height>=44,'primary action is inside the speech bubble and readable');
  assert(await p.evaluate(()=>{const a=app.querySelector('.introduction-scene').getBoundingClientRect(),b=app.querySelector('.introduction-picture').getBoundingClientRect();return !app.querySelector('.introduction-dialogue h1')&&['x','y','width','height'].every(k=>a[k]===b[k]);}),'full-screen field with overlay, no heading');
  if(reference){assert.deepEqual(r.boxes,reference);assert.deepEqual(r.dna,dna)}reference=r.boxes;dna=r.dna;
  const shot=await p.screenshot({path:`tests/screenshots/intro-finished-${width}-${i}.png`});
  const {data,info}=await require('sharp')(shot).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const [sx,sy,sw,sh]=r.boxes[0];let leaks=0;
  for(let y=Math.ceil(sy+sh-20);y<sy+sh;y++)for(let x=Math.ceil(sx);x<sx+20;x++){
   if(Math.hypot(x+.5-(sx+20),y+.5-(sy+sh-20))<21)continue;
   const k=(y*info.width+x)*info.channels;if(Math.abs(data[k]-185)<8&&Math.abs(data[k+1]-132)<8&&Math.abs(data[k+2]-102)<8)leaks++;
  }
  assert.equal(leaks,0,'no coat pixels outside bubble corner');
 }
 await p.evaluate(()=>{window.introPictureBefore=app.querySelector('.introduction-picture');window.introRigBefore=[...svgRigs].find(([s])=>s.classList.contains('intro-neighbor-cat'))[1];dispatch({type:'SYNC_REAL_TIME'});});
 assert(await p.evaluate(()=>introPictureBefore===app.querySelector('.introduction-picture')&&[...svgRigs].some(([,rig])=>rig===introRigBefore)),'redraw preserves picture and rig');
 await p.click('[data-action="previous-story"]');await p.waitForFunction(()=>!document.querySelector('.introduction-next').disabled);
 await p.evaluate(()=>saveGameState(gameState));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1');await p.evaluate(()=>{titleScreenOpen=false;render(gameState)});await p.waitForFunction(()=>!document.querySelector('.introduction-next').disabled);
 assert.deepEqual(await p.evaluate(()=>[...app.querySelectorAll('.intro-neighbor-cat')].map(n=>n.dataset.dna)),dna,'coats survive reload');
 await p.close();
}
assert.deepEqual(errors,[]);console.log('PASS 3-page geometry, natural portrait, copy, buttons, redraw and back navigation at 3 sizes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
