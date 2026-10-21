const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 const result=await p.evaluate(()=>{
  let s=structuredClone(gameState);s.onboarding.status='done';s.campaign.requiredVisit=null;s.campaign.phase='room';s.cats[0]={...s.cats[0],age:'adult',status:'raising',surgery:null,carePlan:undefined,body:{...s.cats[0].body,days:4,weight:2000,sick:false}};
  const ready=surgeryEligibility(s).ready,changed=reduceGameState(s,{type:'CANCEL_CARE_SURGERY'}),plan=carePlan(getCat(changed));
  const kitten=carePlan({...getCat(s),age:'kitten'});
  const first=rollEncounter({...s,onboarding:{status:'active'},album:[],flags:{...s.flags,firstIntake:false}},'food_dry');
  const returning={...getCat(s),id:'returned',name:'もどり'};
  let h={...s,cats:[{...getCat(s),status:'candidate'}],household:{pendingReturn:returning},flags:{...s.flags,returnedCat:false}};
  h=reduceGameState(h,{type:'HOUSEHOLD_RETURN'});const capacity=householdCapacity(h);
  h={...h,coins:22000,campaign:{...h.campaign,phase:'shop',shopId:'petshop'}};h=reduceGameState(h,{type:'HOUSEHOLD_RENOVATE'});h=reduceGameState(h,{type:'HOUSEHOLD_RENOVATE'});const third=reduceGameState(h,{type:'HOUSEHOLD_RENOVATE'});
  return {ready,plan,kitten,firstWeight:first.cat.body.weight,capacity,finalCapacity:householdCapacity(h),coins:h.coins,duplicate:third===h};
 });
 assert(result.ready);assert.equal(result.plan.surgeryDay,7);assert.equal(result.plan.eventDay,9);assert.equal(result.kitten.surgeryDay,12);assert.equal(result.kitten.eventDay,14);assert(result.firstWeight>=1800&&result.firstWeight<=1900);assert.equal(result.capacity,2);assert.equal(result.finalCapacity,4);assert.equal(result.coins,1000);assert(result.duplicate);
 for(const [width,height]of [[320,568],[375,812]]){await p.setViewportSize({width,height});await p.evaluate(()=>{gameState.ui.modal='notebook';render(gameState)});await p.screenshot({path:`tests/screenshots/mtg-app-${width}.png`});assert(await p.evaluate(()=>{const n=document.querySelector('.home-phone');return n.scrollHeight<=n.clientHeight+1}),'app fits '+width);await p.click('.home-phone-close');await p.screenshot({path:`tests/screenshots/mtg-room-${width}.png`});assert.equal(await p.locator('.room-preparation').count(),1);}
 assert.deepEqual(errors,[]);console.log('PASS appointments, first weight, capacity/renovation transaction, app and room smoke');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
