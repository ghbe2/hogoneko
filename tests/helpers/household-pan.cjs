const {touchGesture}=require('./touch-gesture.cjs');
async function swipeRoom(page,right){
 const g=await touchGesture(page),v=page.viewportSize(),y=v.height*.46;
 await g.move(right?v.width-45:40,y);await g.down();
 await g.move(right?40:v.width-45,y,{steps:12});await g.up();
 await page.waitForTimeout(500);
}
module.exports={swipeRoom};
