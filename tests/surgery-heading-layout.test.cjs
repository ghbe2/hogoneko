const {openGame}=require('./helpers/game-page.cjs');
const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('url'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{for(const [width,height]of [[320,568],[375,812]]){
 const p=await b.newPage({viewport:{width,height}});await openGame(p,'room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'done',guide:null};gameState.campaign={...gameState.campaign,phase:'shop',shopId:'clinic',clinicReception:false,requiredVisit:null};gameState.ui={...gameState.ui,modal:null,alphaNotice:null};getCat(gameState).surgery=null;render(gameState);});
 await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(2200);
 const bounds=await p.evaluate(()=>{const sheet=app.querySelector('.surgery-sheet'),header=sheet.querySelector('header'),info=sheet.querySelector('.surgery-information'),actions=sheet.querySelector('.surgery-actions');return {heading:header.getBoundingClientRect().toJSON(),title:header.querySelector('h1').getBoundingClientRect().toJSON(),info:info.getBoundingClientRect().toJSON(),actions:actions.getBoundingClientRect().toJSON(),overflow:info.scrollHeight>info.clientHeight+1}});
 console.log(width,bounds);assert(bounds.title.bottom<=bounds.info.top);assert(bounds.info.bottom<=bounds.actions.top);assert(!bounds.overflow);
 await p.screenshot({path:`tests/screenshots/surgery-heading-${width}.png`});await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});

