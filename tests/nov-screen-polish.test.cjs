const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {openGame}=require('./helpers/game-page.cjs'),{touchGesture}=require('./helpers/touch-gesture.cjs');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{for(const [width,height] of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await openGame(p,'town');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={status:'done',guide:null,homeTour:'done'};render(gameState)});
 const map=p.locator('.town-map-scroll'),g=await touchGesture(p);
 const drag=async steps=>{
  await map.evaluate(s=>s.scrollTop=0);const r=await map.boundingBox();
  await g.move(r.x+r.width*.65,r.y+r.height*.65);await g.down();await g.move(r.x+r.width*.65,r.y+r.height*.42,{steps});assert.equal(await map.evaluate(s=>s.scrollTop),0);
  await g.up();await p.waitForTimeout(700);return map.evaluate(s=>s.scrollTop/s.clientHeight);
 };
 assert(Math.abs(await drag(2)-.5)<.01);assert(Math.abs(await drag(9)-.5)<.01);
 await p.evaluate(()=>{gameState.campaign.phase='room';gameState.ui.modal='notebook';gameState.alpha={...gameState.alpha,showAlbumHint:true,mail:[{key:'early',receivedAt:100,text:'先のお便り',read:true},{key:'latest',receivedAt:300,text:'新しいお便り',read:false}]};gameState.economy={...gameState.economy,familyLetters:{family:{name:'ミケ',receivedAt:200,claimed:false}}};const c=getCat(gameState);gameState.album=[{...c,catId:'past',phenotype:phenotypeFor(c)}];render(gameState)});
 assert(await p.locator('.album-guide-cue').evaluate(n=>n.parentElement.classList.contains('home-phone')));
 await p.waitForTimeout(1200);await p.screenshot({path:'tests/screenshots/polish-phone-'+width+'.png'});
 await p.evaluate(()=>dispatch({type:'ALPHA_MAIL_OPEN'}));
 assert.deepEqual(await p.locator('.alpha-mail-list button').evaluateAll(nodes=>nodes.map(n=>n.dataset.alphaMailRead||n.dataset.alphaFamilyRead)),['latest','family','early']);
 assert.equal(await p.locator('.alpha-mail-list .is-unread').count(),2);await p.screenshot({path:'tests/screenshots/polish-mail-'+width+'.png'});
 assert.deepEqual(errors,[]);console.log('PASS',width,'fast/slow touch swipe, album cue, mixed mail order');await p.close();
 }}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
