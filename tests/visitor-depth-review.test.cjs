const {chromium}=require('playwright');
const {pathToFileURL}=require('url');
const path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1200,height:760}});
 await page.goto(pathToFileURL(path.resolve('npc-design-review.html')).href);
 await page.click('#pause');
 await page.evaluate(()=>{
  const source=document.querySelector('.stage svg[data-visitor-hip]');
  const strip=document.createElement('div');strip.id='gait-strip';
  strip.style='display:grid;grid-template-columns:repeat(6,190px);gap:8px;background:#ece6d1;padding:10px';
  for(const dir of [1,-1])for(let i=0;i<6;i++){
   const cell=document.createElement('div'),svg=source.cloneNode(true);
   svg.setAttribute('viewBox','-20 0 160 370');svg.style='width:190px;height:300px;display:block';
   drawVisitorLegs(svg,i*.25,true,1);
   const rear=svg.querySelector('.visitor-rear-arm-layer'),legs=svg.querySelector('.visitor-shaped-legs'),torso=svg.querySelector('.adoption-torso');
   if(rear.parentNode!==legs.parentNode||rear.nextElementSibling!==legs||!(legs.compareDocumentPosition(torso)&Node.DOCUMENT_POSITION_FOLLOWING))throw Error('far arm must be behind legs and torso');
   if(!rear.contains(svg.querySelector('.visitor-arm-far'))||!torso.contains(svg.querySelector('.visitor-arm-near')))throw Error('arm depth ownership');
   svg.querySelector('.adoption-figure').setAttribute('transform',`translate(60 0) scale(${dir} 1) translate(-60 0)`);
   cell.append(svg);strip.append(cell);
  }
  document.body.replaceChildren(strip);
 });
 await page.locator('#gait-strip').screenshot({path:'tests/screenshots/visitor-depth-phases.png'});
 await browser.close();
 console.log('PASS: six gait phases in each direction rendered');
})().catch(e=>{console.error(e);process.exit(1)});
