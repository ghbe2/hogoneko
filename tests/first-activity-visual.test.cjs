const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),url=pathToFileURL(path.resolve('index.html')).href;
for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(url+'?check=1&scenario=clinic');await p.evaluate(()=>{titleScreenOpen=false;getCat(gameState).status='captured';gameState.campaign.clinicStep='exam';gameState.campaign.firstExamAt=Date.now();render(gameState)});await p.waitForTimeout(300);
 assert(await p.evaluate(()=>{const svg=document.querySelector('.first-exam-cat svg'),bed=document.querySelector('.first-exam-bed').getBoundingClientRect(),r=svg.getBoundingClientRect();return svg.getAttribute('viewBox')==='190 245 310 160'&&Math.abs(r.bottom-bed.top)<2&&r.width>=app.clientWidth*.75;}));await p.screenshot({path:`tests/screenshots/first-exam-final-${width}.png`});
 await p.goto(url+'?check=1&scenario=town');await p.screenshot({path:`tests/screenshots/first-town-final-${width}.png`});
 const overlap=await p.evaluate(()=>{const nodes=[...document.querySelectorAll('.town-destination,.town-house-three,.town-tree')],pairs=[];for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i].getBoundingClientRect(),b=nodes[j].getBoundingClientRect();if(Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top))pairs.push([nodes[i].className,nodes[j].className]);}return pairs});assert.deepEqual(overlap,[]);
}console.log('PASS town building/decor bounds at both sizes');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
