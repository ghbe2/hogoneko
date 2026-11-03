const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{pathToFileURL}=require('url');
const tag=process.env.AUDIT_TAG||'before',out='tests/screenshots/typography-'+tag;fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const results=[];try{
 for(const [width,height]of [[320,568],[375,812]]){
  const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  async function shot(name){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(650);
   const data=await p.evaluate(()=>{
    const visible=e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&!e.closest('.navigation-snapshot')&&e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})};
    const buttons=[...app.querySelectorAll('button')].filter(visible).map((e,i)=>({key:e.id||JSON.stringify({...e.dataset})+'-'+i,text:e.textContent.trim(),rect:e.getBoundingClientRect().toJSON()}));
    const issues=[];for(const e of app.querySelectorAll('h1,h2,h3,p,small,strong,label,button')){
     if(!visible(e)||!e.textContent.trim()||e.closest('svg'))continue;
     const r=e.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(e);const text=range.getBoundingClientRect();
     if(text.width&&((text.right>r.right+3)||(text.left<r.left-3)||(text.bottom>r.bottom+3)))issues.push({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,90),box:[r.x,r.y,r.width,r.height],ink:[text.x,text.y,text.width,text.height]});
    }
    return {buttons,issues,screenScroll:document.documentElement.scrollHeight>innerHeight+1};
   });results.push({width,height,name,...data});await p.screenshot({path:`${out}/${width}-${name}.png`});if(data.issues.length)console.log(width,name,JSON.stringify(data.issues));
  }
  for(const scenario of ['intro','field','capture','clinic','naming','intake','room','surgery','event','result','tnr-result','town']){
   await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario='+scenario);
   await shot(scenario);
   if(scenario==='intro'){await p.evaluate(()=>{titleScreenOpen=false;gameState.campaign.phase='story';gameState.onboarding.storyIndex=0;gameState.onboarding.introStartedAt=Date.now()-10000;render(gameState)});for(let i=0;i<3;i++){await p.evaluate(i=>{gameState.onboarding.storyIndex=i;render(gameState)},i);await shot('story-'+i);}}
   if(scenario==='room'){
    for(const modal of ['notebook','schedule','inventory','touchTools','nickname','wallet','album']){await p.evaluate(modal=>{gameState.ui={...gameState.ui,modal,alphaNotice:null};render(gameState)},modal);await shot(modal);}
    await p.evaluate(()=>{gameState.ui={...gameState.ui,modal:null,alphaMailbox:true};render(gameState)});await shot('mailbox');
    for(const step of ['profile','vitals','calendar','pay','play','clean','food','items']){
     await p.evaluate(step=>{gameState.onboarding.homeTour=step;gameState.ui={...gameState.ui,alphaMailbox:false,modal:['profile','vitals','calendar','pay'].includes(step)?'notebook':null};render(gameState)},step);await shot('home-guide-'+step);
    }
   }
   if(scenario==='town')for(const shop of ['super','petshop','clinic','plaza']){
    await p.evaluate(shop=>{gameState.campaign={...gameState.campaign,phase:'shop',shopId:shop,clinicReception:true,clinicExamined:false};render(gameState)},shop);await shot('shop-'+shop);
    if(shop==='petshop')for(const mode of ['detail','cart','confirm']){await p.evaluate(mode=>{gameState.ui={...gameState.ui,storeDetail:mode==='detail'?'food_wet':null,storeCartOpen:mode!=='detail',storeConfirm:mode==='confirm',shopCart:{food_wet:2}};render(gameState)},mode);await shot('store-'+mode);}
   }
  }
  await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
  const guideKeys=await p.evaluate(()=>Object.keys(FIRST_GUIDES));
  for(const key of guideKeys){
   await p.evaluate(key=>{
    const keys=Object.keys(FIRST_GUIDES),i=keys.indexOf(key);
    const phase=i<=3?'field':i<=5?'trapInspect':i<=7||key==='shopBuilding'||key==='homeBuilding'?'town':i<=11?'shop':i<=16?'clinic':i<=24?'shop':'intake';
    gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,guide:key,homeTour:'done',appIntro:null};
    gameState.campaign={...gameState.campaign,phase,shopId:i<17?'clinic':'petshop',clinicStep:'summary',clinicReception:true,trapReady:key==='trapReady',trapPlaced:key==='trapReady',trapWaiting:false,captureStartedAt:Date.now()-9000,trapRevealDone:true,requiredVisit:null};
    gameState.ui={...gameState.ui,modal:null,alphaNotice:null,layoutMode:['addFurniture','chooseFurniture','addMore','moveFurniture'].includes(key),layoutTrayOpen:key==='chooseFurniture',storeDetail:key==='addCart'?'starter_set':null,storeCartOpen:key==='purchase',shopCart:key==='purchase'?{starter_set:1}:{}};
    getCat(gameState).status=i<4?'candidate':i<25?'captured':'intake';render(gameState);
    for(const k of guideSpeechCache.keys())guideSpeechCache.set(k,-100000);
   },key);await shot('guide-'+key);
  }
  console.log('SIZE DONE',width,'errors',JSON.stringify(errors));await p.close();
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify(results,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
