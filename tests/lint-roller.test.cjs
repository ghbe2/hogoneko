const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage();await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 const results=await p.evaluate(()=>{
  const base=()=>{const s=structuredClone(gameState);s.ui.modal=null;s.ui.layoutMode=false;s.ui.careAnimation=null;s.ui.equippedCleaner='starter_clean';s.cats[0].body.hair=Array.from({length:10},(_,i)=>({id:'h'+i,x:10+i*2,y:80}));s.cats[0].body.vomit=2;s.cats[0].body.litter=2;return s;};
  const clean=(s,problem,cleanerId='starter_clean')=>{s=reduceGameState(s,{type:'START_CARE',operation:'clean',problem,hairId:'h0',cleanerId});if(!s.ui.careAnimation)throw Error('no care '+problem);return reduceGameState(s,{type:'FINISH_CARE',id:s.ui.careAnimation.id});};
  let hair=clean(base(),'hair');const first=hair.cats[0].body.hair.map(h=>h.id);hair=clean(hair,'hair');
  return {label:getCleaner('starter_clean').label,first,last:hair.cats[0].body.hair.length,stock:hair.inventory.starter_clean,other:['litter','vomit'].map(problem=>{let s=base(),n=0;while(s.cats[0].body[problem]>0&&n<10){s=clean(s,problem);n++;}return n;}),paid:['clean_paper','clean_wipe','clean_spray'].map(id=>{let s=base();s.inventory[id]=10;return clean(s,'vomit',id).cats[0].body.vomit;})};
 });
 assert.equal(results.label,'コロコロ');assert.deepEqual(results.first,['h6','h7','h8','h9']);assert.equal(results.last,0);assert.equal(results.stock,1);assert.deepEqual(results.other,[4,4]);assert.deepEqual(results.paid,[1,0,0]);console.log('PASS',results);
 for(const [width,height] of [[320,520],[375,764]]){await p.setViewportSize({width,height});await p.evaluate(()=>{gameState.ui.modal='inventory';gameState.ui.inventoryTab='clean';render(gameState);});await p.waitForTimeout(700);await p.screenshot({path:`tests/screenshots/roller-${width}.png`});}
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
