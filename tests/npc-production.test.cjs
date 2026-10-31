const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('url'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.GAME_URL||pathToFileURL(path.resolve('index.html')).href)+'?check=1&scenario=room');
 if(await p.locator('#password').count()){await p.fill('#password',process.env.MOCK_VIEW_PASSWORD);await p.click('#enter');await p.waitForFunction(()=>typeof gameState!=='undefined');}
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'done',guide:null,appIntro:null,homeTour:'done'};gameState.ui={...gameState.ui,modal:null,alphaNotice:null};render(gameState);});
 assert(await p.evaluate(()=>seniorArt().includes('data-design="A+"')&&receptionArt('clinic').includes('reception-abdomen-study')&&receptionArt('doctor').includes('staff-abdomen-study')&&storeBackground(gameState).includes('store-abdomen-study')));
 for(const scene of ['senior','clinic','plaza','petshop','exam']){
  await p.evaluate(scene=>{
   gameState.ui.alphaNotice=null;
   gameState.campaign={...gameState.campaign,phase:scene==='senior'?'room':scene==='exam'?'clinic':'shop',shopId:scene==='exam'?'clinic':scene,clinicReception:true,clinicExamined:false,requiredVisit:null,clinicStep:'exam',firstExamAt:Date.now()+10000};
   if(scene==='senior')gameState.ui.alphaNotice={key:'npc-review',kind:'visit',text:'おじゃまします。元気にしていましたか？',page:0};
   render(gameState);
  },scene);
  await p.waitForTimeout(700);await p.screenshot({path:`tests/screenshots/npc-production-${width}-${scene}.png`});
  assert(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
 }
 assert.deepEqual(errors,[]);console.log('PASS',width,'approved senior, clinic, plaza, store, exam; no page errors or vertical overflow');await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
