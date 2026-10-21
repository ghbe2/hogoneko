const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const [width,height] of [[320,568],[375,812]]){
  const p=await b.newPage({viewport:{width,height}});
  await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
  const results=await p.evaluate(()=>{
   const rows=[...Object.entries(TOWN_TUTORIAL),...Object.entries(FIRST_GUIDES),...Object.entries(ACTIVITY_DIALOGUE).filter(([k])=>k.startsWith('firstSchedule'))];
   return rows.map(([key,spec])=>{
    const copy=typeof spec.copy==='function'?spec.copy():spec.copy;
    const layer=document.createElement('section');layer.className='first-guide';layer.dataset.context=['captured','toClinic'].includes(key)?'trapInspect':['shopHello','shopHelloDetail','tools','starter','quantity','addCart','purchase'].includes(key)?'shop':'field';
    layer.innerHTML=`<aside class="first-guide-note shared-guide-note" style="top:30px">${seniorDialogueContents(copy,'<button>つぎへ</button>')}</aside>`;app.append(layer);
    const n=layer.querySelector('aside'),text=n.querySelector('p'),name=n.querySelector('strong'),svg=n.querySelector('.first-senior>svg'),btn=n.querySelector('button'),r=n.getBoundingClientRect(),t=text.getBoundingClientRect(),h=name.getBoundingClientRect(),s=svg.getBoundingClientRect(),c=btn.getBoundingClientRect();
    const result={key,overflow:text.scrollHeight>text.clientHeight+1,gap:t.top-h.bottom,font:parseFloat(getComputedStyle(name).fontSize),weight:Number(getComputedStyle(name).fontWeight),ratio:s.width/s.height,inside:c.right<=r.right&&c.bottom<=r.bottom,extension:getComputedStyle(n.querySelector('.first-senior'),'::before').content};layer.remove();return result;
   });
  });
  for(const r of results){assert(!r.overflow,`${width} ${r.key} long copy fits`);assert(r.gap>=8&&r.font>=15&&r.weight>=700,`${r.key} name hierarchy`);assert(Math.abs(r.ratio-135/190)<.005,`${r.key} natural proportions`);assert(r.inside,`${r.key} next inside bubble`);assert.equal(r.extension,'none');}
  await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'active',townStep:'home',guide:null};gameState.campaign={...gameState.campaign,phase:'town',captured:null};render(gameState)});
  await p.waitForFunction(()=>app.querySelector('.tutorial-note button')&&!app.querySelector('.tutorial-note button').disabled);await p.waitForTimeout(450);
  assert(await p.evaluate(()=>{const name=app.querySelector('.tutorial-note strong');return name.textContent==='保護主のせんぱい'&&getComputedStyle(name).fontSize==='15px'&&getComputedStyle(name).fontWeight==='700';}),'actual town uses shared speaker hierarchy');
  await p.screenshot({path:`tests/screenshots/senior-town-${width}.png`});
  console.log('PASS',width,results.length,'dialogue copies, names, portrait proportions and controls');await p.close();
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
