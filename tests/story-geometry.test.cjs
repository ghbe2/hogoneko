const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage();
 for(const [width,height]of[[320,520],[375,764],[330,720]]){
  await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await p.waitForTimeout(600);await p.click('[data-action="start-game"]');let first;
  async function measure(){return p.locator('.story-screen').evaluate(el=>{
   const selectors=['.story-eyebrow','.intro-illustration','.game-cat-svg','h1',':scope>p','.story-pages','.title-actions','[data-action="next-story"]'];
   const boxes=selectors.map(s=>{const n=el.querySelector(s),r=n.getBoundingClientRect();if(n.scrollHeight>n.clientHeight+1)throw Error('Content overflow: '+s);return [s,r.x,r.y,r.width,r.height];});
   const w=getComputedStyle(el.querySelector('.intro-illustration'),'::before');boxes.push(['window',w.left,w.top,w.width,w.height]);
   if(el.scrollHeight>el.clientHeight+1)throw Error('Screen overflow');return boxes;
  });}
  for(let i=0;i<3;i++){await p.waitForTimeout(500);const boxes=await measure();if(!first)first=boxes;assert.deepEqual(boxes,first,'Every story element must retain identical geometry');await p.screenshot({path:`tests/screenshots/story-geometry-${width}-${i}.png`});if(i<2)await p.click('[data-action="next-story"]');}
  await p.click('[data-action="previous-story"]');assert.deepEqual(await measure(),first);
 }
 console.log('PASS all story artwork, window, headings, text and controls keep identical geometry; no overflow at three sizes');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
