const{chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{const p=await browser.newPage();for(const [width,height] of [[320,520],[375,764]]){
 await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');await p.evaluate(()=>dispatch({type:'TOGGLE_LAYOUT'}));
 const zones=await p.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom};};return {wall:rect('.wall-zone'),floor:rect('.floor-zone'),world:rect('[data-room-world]'),b:roomPlacementBounds()};});
 assert(zones.wall.bottom<zones.floor.top);assert(Math.abs(zones.wall.bottom-zones.world.top-zones.b.wallBottom)<1);assert(Math.abs(zones.floor.top-zones.world.top-zones.b.floorTop)<1);
 await p.evaluate(()=>{for(const id of CONFIG.stage1.placedItems){gameState.inventory[id]=1;dispatch({type:'DROP_LAYOUT_ITEM',itemId:id,x:30,y:getItem(id).zone==='wall'?99:0});}});
 const placements=await p.evaluate(()=>getPlaced(getRoom(gameState)).map(p=>({zone:getItem(p.itemId).zone,top:p.y*innerHeight/100,bottom:p.y*innerHeight/100+furnitureHeight(p.itemId)})));
 for(const r of placements){assert(r.top>=zones.b.wallTop-1);if(r.zone==='wall')assert(r.bottom<=zones.b.wallBottom+1);else{assert(r.bottom>=zones.b.floorTop-1);assert(r.bottom<=zones.b.floorBottom+1);}}
 await p.screenshot({path:`tests/screenshots/layout-boundaries-${width}.png`});
 }console.log('PASS disjoint guides, painted boundary alignment and furniture bounds at both sizes');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
