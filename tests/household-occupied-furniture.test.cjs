const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('url'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{const p=await b.newPage({viewport:{width:375,height:812},hasTouch:true,isMobile:true});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&debug-play=1&debug-start=two-cats');await p.waitForSelector('.household-other-cat');
 await p.evaluate(()=>{for(const t of roomRoamTimers.values())clearTimeout(t);roomRoamTimers.clear();gameState.dailyDiscovery={lastDay:discoveryDay()};
  const ids=roomActorRuntime.ids();
  for(const id of ids)roomActorRuntime.run(id,()=>{catLifeCues=[];gameState.ui.catFocus=null;gameState.ui.playRestPoint=visibleRoomCatPoint(app.querySelector('.cat-object'));});
  const first=app.querySelector('.cat-object'),point=roomObjectCuePoint(gameState,'box','sit');first._travelAnimation?.cancel();first.style.left=point.x+'%';first.style.top=point.y+'%';gameState.ui.playRestPoint={...point,catId:ids[0]};
  roomActorRuntime.run(ids[1],()=>{queueObjectReaction(gameState,'box','sit');const node=app.querySelector('.cat-object'),from=visibleRoomCatPoint(node),to={...currentLifeCue().point};animateFelineTravel(node,from,to);});
 });await p.waitForTimeout(7000);
 const result=await p.evaluate(()=>{const s=HouseholdRuntime.snapshot();return{contexts:s.contexts,positions:[...app.querySelectorAll('[data-hh-cat]')].map(n=>({id:n.dataset.hhCat,p:visibleRoomCatPoint(n)}))}});
 console.log(JSON.stringify(result.positions));assert(Object.values(result.contexts).some(c=>c.cues?.some(q=>q.itemId===null&&q.point.surface==='floor')),'occupied furniture reaction must not re-anchor to the same box');
 for(let i=0;i<3;i++){
  await p.evaluate(()=>render(gameState));await p.waitForTimeout(300);
  const separation=await p.evaluate(()=>{const ns=[...app.querySelectorAll('[data-hh-cat]')],r=ns[0].parentElement.getBoundingClientRect(),a=visibleRoomCatPoint(ns[0]),b=visibleRoomCatPoint(ns[1]);return Math.hypot((a.x-b.x)*r.width/100,(a.y-b.y)*r.height/100)});
  assert(separation>50,'a redraw must not put the second cat back on occupied furniture');
 }
 await p.screenshot({path:'tests/screenshots/household-review/occupied-box.png'});
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
