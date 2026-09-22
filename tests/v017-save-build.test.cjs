const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'..'),url=pathToFileURL(path.join(root,'index.html')).href;
 await p.goto(url);
 await p.evaluate(()=>{const old=structuredClone(gameState);delete old.flags.economyV017;delete old.economy;old.coins=1100;old.cats[0].status='raising';old.cats[0].name='以前のねこ';old.cats[0].types=['human'];old.cats[0].phenotype=null;old.campaign.phase='room';old.onboarding.status='done';old.inventory.feather=3;localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,state:old}));});
 await p.reload();assert.equal(await p.evaluate(()=>gameState.coins),31);assert.equal(await p.evaluate(()=>getCat(gameState).name),'以前のねこ');assert.equal(await p.evaluate(()=>gameState.inventory.feather),3);
 const dna=await p.evaluate(()=>JSON.stringify(getCat(gameState).phenotype));await p.reload();assert.equal(await p.evaluate(()=>gameState.coins),31);assert.equal(await p.evaluate(()=>JSON.stringify(getCat(gameState).phenotype)),dna);
 const checks=await p.evaluate(()=>{
  let s=structuredClone(gameState);s.ui.modal=null;s.ui.layoutMode=false;s.campaign.phase='room';s.coins=50;
  s.inventory.peek_toy=0;s.durability.peek_toy=0;let next=reduceGameState(s,{type:'BUY_SHOP_ITEM',itemId:'peek_toy'});
  const repairedToy=next.inventory.peek_toy===1&&next.durability.peek_toy===18;
  s.inventory.tunnel=1;s.durability.tunnel=0;s.cats[0].body.broken={itemId:'tunnel',level:3};next=reduceGameState(s,{type:'BUY_SHOP_ITEM',itemId:'tunnel'});
  const repairedFurniture=next.durability.tunnel===20&&!next.cats[0].body.broken;
  s.ui.layoutMode=true;next=reduceGameState(s,{type:'BUY_SHOP_ITEM',itemId:'hammock'});next=reduceGameState(next,{type:'DROP_LAYOUT_ITEM',itemId:'hammock',x:35,y:38});
  const platform=getAvailableRoamPoints(next).some(p=>p.id==='hammock');
  const allPoses=['sit','walk','jump','sleep','punch','dash','wall','scratch','knead','eat','poop','vomit'];
  for(const age of ['adult','kitten'])for(const pose of allPoses){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),rig=CatSVG.buildCat(svg,'test',{...getCat(s).phenotype,age});CatSVG.applyPose(rig,CatSVG.poseModel(pose,.6),.6,pose);if(/NaN|undefined/.test(svg.innerHTML))throw Error(age+' '+pose);}
  return {repairedToy,repairedFurniture,platform};
 });assert.deepEqual(checks,{repairedToy:true,repairedFurniture:true,platform:true});
 // Same inlining step as the password build; check both scripts execute in a standalone document.
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,file)=>'<script>\n'+fs.readFileSync(path.join(root,file),'utf8').replace(/<\/script/gi,'<\\/script')+'\n</script>');
 assert(!html.includes('<script src='));
 const bundle=await b.newPage({viewport:{width:375,height:667}});bundle.on('pageerror',e=>errors.push(e.message));await bundle.setContent(html);await bundle.waitForTimeout(250);assert.equal(await bundle.locator('.game-cat-svg').count(),1);
 assert.deepEqual(errors,[]);console.log('PASS v017 migration, replacement, platform, 24 pose/age checks, standalone preview bundle');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
