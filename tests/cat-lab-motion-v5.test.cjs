const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(__dirname,'../art/cat-directions/cat-lab.html')).href);
 if(await page.locator('#pause').getAttribute('aria-pressed')==='false')await page.locator('#pause').click();
 await page.locator('[data-preset="G"]').click();await page.selectOption('#age','adult');
 const checks=await page.evaluate(()=>{
  const sit=poseModel('sit',0),k=poseModel('knead',.3),jump=poseModel('jump',.55),dash=poseModel('dash',.157),punch=poseModel('punch',.365),walk=poseModel('walk',0),pull=poseModel('scratch',.4),reach=poseModel('scratch',0);
  return{sitStraight:sit.frontBend===0,kneadStraight:k.frontBend===0&&[1,3].every(i=>k.legs[i][0]===k.legs[i][2]),jumpStretch:jump.legs[1][2]<-105&&jump.legs[0][2]>95,folded:dash.frontBend<-.8,punchOpposite:punch.legs[1][2]<-100&&punch.legs[3][2]===sit.legs[3][2],rumpRaised:walk.rumpRaise>0,pullsBack:pull.legs[1][2]>reach.legs[1][2]&&pull.legs[1][3]===reach.legs[1][3]};
 });for(const [k,v]of Object.entries(checks))assert(v,k);
 for(const p of ['wall','knead','eat']){await page.locator(`[data-pose="${p}"]`).click();assert.equal(await page.locator('#hero [data-part="props"]').innerHTML(),'');}
 const shots=[];
 for(const [p,t]of [['sit',0],['walk',.15],['jump',.55],['dash',.157],['dash',.47],['punch',.365],['wall',.13],['scratch',0],['scratch',.4],['knead',.3],['eat',.5],['poop',2]]){
  await page.evaluate(({p,t})=>applyPose(rig,poseModel(p,t),t,p),{p,t});shots.push({label:p+' '+t,svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
 }
 for(const mood of ['happy','angry']){
  const paths=[];for(const eyes of ['round','slant','droop']){await page.selectOption('#eyes',eyes);await page.selectOption('#mood',mood);await page.locator('[data-pose="sit"]').click();
   paths.push(await page.locator('#hero [data-part="face"] clipPath path').first().getAttribute('d'));shots.push({label:eyes+' '+mood,svg:await page.locator('#hero').evaluate(n=>n.outerHTML)});
  }assert.equal(new Set(paths).size,3);
 }
 assert.equal(await page.locator('#hero [data-part="earL"] > g').evaluate(n=>getComputedStyle(n).display),'none');assert.equal(await page.locator('#hero [data-clip-ear]').count(),2);
 await page.setContent('<style>body{margin:0;display:grid;grid-template-columns:repeat(6,1fr);background:#ecefe4;font:12px sans-serif}article{text-align:center;border:1px solid #d4d9cc;padding:8px}svg{width:100%;height:300px}</style>'+shots.map(({label,svg},i)=>`<article>${label}${svg.replace('id="hero"',`id="shot${i}"`).replace(/hero-(\d+)/g,`shot${i}-hero-$1`)}</article>`).join(''));
 await page.screenshot({path:path.join(__dirname,'screenshots/cat-lab-motion-v5.png'),fullPage:true});assert.equal(errors.length,0);console.log('PASS motion v5',checks);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
