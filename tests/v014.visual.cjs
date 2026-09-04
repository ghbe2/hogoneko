const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const assert = require('assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true});
  const out = path.join(__dirname,'screenshots'); fs.mkdirSync(out,{recursive:true});
  try {
    const page = await browser.newPage({viewport:{width:375,height:667},hasTouch:true,isMobile:true});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
    await page.screenshot({path:path.join(out,'v014-title.png')});
    await page.locator('[data-action="start-game"]').click();
    await page.screenshot({path:path.join(out,'v014-story.png')});
    for(let i=0;i<3;i++)await page.locator('[data-action="next-story"]').click();
    await page.screenshot({path:path.join(out,'v014-field.png')});
    await page.evaluate(() => {
      gameState.campaign.phase='room'; gameState.cats[0].status='raising';
      gameState.cats[0].types=['chase','ambush'];gameState.cats[0].heart=75;
      gameState.cats[0].heartCap=100;gameState.ui.equippedHand='mouse';
      gameState.onboarding.status='done';render(gameState);
    });
    await page.screenshot({path:path.join(out,'v014-room.png')});
    assert.equal(await page.locator('.live-heart-meter').count(),0);
    const slot = await page.locator('[data-command="cat"]').boundingBox();
    await page.mouse.move(slot.x+slot.width/2,slot.y+slot.height/2);
    await page.mouse.down();
    for(let i=0;i<60;i++) {
      await page.mouse.move(100+(i%2)*110,400+(i%3)*15);
      await page.waitForTimeout(40);
    }
    assert(await page.evaluate(() => commandDraft.heartEarned>0),'Live dragging did not earn hearts');
    assert.equal(await page.locator('.live-heart-meter .heart-slot').count(),10);
    assert(await page.evaluate(() => {
      const meter=document.querySelector('.live-heart-meter').getBoundingClientRect();
      return [...document.querySelectorAll('.live-heart-meter .heart-slot')].every(slot => {
        const box=slot.getBoundingClientRect(); return box.left>=meter.left && box.right<=meter.right;
      });
    }),'Hearts overflow meter');
    assert(await page.evaluate(() => document.querySelector('.live-heart-meter').innerHTML === renderHeartVisual({...getCat(gameState),heart:Math.round((getCat(gameState).heart+commandDraft.heartEarned)*10)/10})), 'Play meter must match notebook including live gains');
    await page.screenshot({path:path.join(out,'v014-playing.png')});
    await page.mouse.up();
    assert.equal(await page.locator('.live-heart-meter').count(),0,'Meter remained after release');
    assert(await page.evaluate(() => getCat(gameState).heart>75),'Live growth was not committed');
    await page.waitForTimeout(350);
    const slotAgain=await page.locator('[data-command="cat"]').boundingBox();
    await page.mouse.move(slotAgain.x+slotAgain.width/2,slotAgain.y+slotAgain.height/2);
    await page.mouse.down(); await page.mouse.move(170,410,{steps:8});
    assert.equal(await page.locator('.live-heart-meter').count(),1);
    await page.locator('#app').dispatchEvent('pointercancel'); await page.mouse.up();
    assert.equal(await page.locator('.live-heart-meter').count(),0,'Meter remained after cancel');
    await page.locator('[data-action="open-notebook"]').click();
    await page.waitForTimeout(500);
    await page.screenshot({path:path.join(out,'v014-notebook.png')});
    await page.evaluate(() => {gameState.ui.modal=null;gameState.ui.layoutMode=true;gameState.ui.layoutTrayOpen=true;render(gameState);});
    await page.screenshot({path:path.join(out,'v014-layout.png')});
    const moves = await page.evaluate(() => {
      gameState.ui.layoutMode=false;gameState.ui.layoutTrayOpen=false;render(gameState);
      const cat=document.querySelector('.cat-object'),rows=[];
      for(const affinity of Object.keys(CONFIG.playFeel)) {
        const from=CONFIG.stage1.roamPoints[0], to=CONFIG.stage1.roamPoints[1];
        const draft={affinity};
        cat.style.left=from.x+'%';cat.style.top=from.y+'%';
        animateLiveCatMove(draft,cat,from,to,.3);
        rows.push({affinity,duration:draft.catAnimation.effect.getTiming().duration});
        draft.catAnimation.cancel();
      }
      return rows;
    });
    assert(moves[0].duration < moves[1].duration && moves[1].duration < moves[2].duration);
    console.log('Movement durations',moves);
    for(const [width,height] of [[320,568],[375,667],[390,844]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(() => {titleScreenOpen=true;render(gameState);});
      assert(await page.evaluate(() => document.querySelector('.title-screen').scrollHeight<=document.querySelector('.title-screen').clientHeight));
      await page.evaluate(() => {titleScreenOpen=false;gameState.campaign.phase='story';gameState.onboarding.storyIndex=2;render(gameState);});
      assert(await page.evaluate(() => document.querySelector('.story-screen').scrollHeight<=document.querySelector('.story-screen').clientHeight));
    }
    console.log('PASS visual sizes and movement speeds');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
