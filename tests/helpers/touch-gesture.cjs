// Browser-generated touch input, not dispatchEvent and not mouse emulation.
// Chromium's CDP input is useful for regression checks; it is not an iPhone device test.
async function touchGesture(page) {
 const client = await page.context().newCDPSession(page);
 let point = {x:0,y:0}, held = false, secondary = null;
 const counts = {starts:0,moves:0,ends:0};
 const send = async type => {
  await client.send('Input.dispatchTouchEvent', {type, touchPoints:['touchEnd','touchCancel'].includes(type)?[]:[{id:1,...point},...(secondary?[secondary]:[])]});
 };
 const gesture = {
  counts,
  async move(x,y,{steps=1}={}) {
   const from={...point};
   for(let i=1;i<=steps;i++) {
    point={x:from.x+(x-from.x)*i/steps,y:from.y+(y-from.y)*i/steps};
    if(held){await send('touchMove');counts.moves++;await page.waitForTimeout(25);}
   }
  },
  async down(){if(held)throw new Error('Touch already active');held=true;await send('touchStart');counts.starts++;},
  async up(){if(!held)throw new Error('No active touch');await send('touchEnd');held=false;counts.ends++;},
  async cancel(){if(!held)throw new Error('No active touch');await send('touchCancel');held=false;},
  async addFinger(x,y){secondary={id:2,x,y};await send('touchStart');},
  async removeFinger(){secondary=null;await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{id:1,...point}]});},
  async wheel(dx,dy){
   // Existing map tests use wheel direction; a finger moves in the opposite direction.
   await gesture.down();await gesture.move(point.x-dx,point.y-dy,{steps:12});await gesture.up();
  }
 };
 return gesture;
}
module.exports={touchGesture};
