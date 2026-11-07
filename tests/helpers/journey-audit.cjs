const fs = require('node:fs');
const path = require('node:path');

function journeyAudit(page, input, mode) {
  if (!['redraw', 'interrupt', 'viewport', 'resume', 'early', 'edge', 'abandon'].includes(mode)) throw Error('Unknown journey audit mode');
  const out = path.resolve('tests/screenshots/tutorial-audit', mode);
  fs.mkdirSync(out, {recursive:true});
  const log = (phase, data) => fs.appendFileSync(path.join(out, 'steps.jsonl'), JSON.stringify({phase,...data})+'\n');
  fs.writeFileSync(path.join(out, 'steps.jsonl'), '');
  async function state() {
    return page.evaluate(()=>({scene:gameState.campaign.phase,
      guide:gameState.onboarding.guide, tour:gameState.onboarding.homeTour,
      screen:document.querySelector('.first-name')?'naming':null}));
  }
  async function perturb() {
    if(mode==='redraw') await page.evaluate(()=>render(gameState));
    if(mode==='interrupt') await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    if(mode==='viewport') {
      const {width,height}=page.viewportSize();
      await page.setViewportSize({width,height:height-30});
      await page.waitForTimeout(75);
      await page.setViewportSize({width,height});
      await page.waitForTimeout(75);
    }
  }
  const down=input.down.bind(input), up=input.up.bind(input);
  input.down=async()=>{
    log('gesture start',await state());
    await down();
    if(mode==='interrupt') {
      await input.cancel();
      await perturb();
      await down();
    }
  };
  input.up=async()=>{
    if(mode==='redraw') await perturb();
    await up();
    log('gesture end',await state());
  };
  return {
    earlyTap: mode!=='early'?null:async function(selector) {
      const button=page.locator(selector).first();
      if(!await button.isVisible())return false;
      const box=await button.boundingBox();
      if(!box||box.width<1||box.height<1)return false;
      const x=box.x+box.width/2,y=box.y+box.height/2;
      const signature=()=>page.evaluate(()=>JSON.stringify([
        titleScreenOpen,gameState.campaign,gameState.onboarding,gameState.coins,
        gameState.ui.modal,gameState.ui.storeDetail,gameState.ui.storeCartOpen,
        gameState.ui.firstName,gameState.ui.layoutMode,gameState.ui.layoutTrayOpen,
        getPlaced(getRoom(gameState))
      ]));
      const prior=await signature();
      const reading=await page.locator('[data-reading="true"]').count()>0;
      const busy=await page.evaluate(()=>guideNavigationBusy);
      await page.touchscreen.tap(x,y);
      const repeat=['[data-first="pay"]','[data-store="add"]','[data-store="checkout"]','[data-first="name"]'].includes(selector);
      if(repeat)await page.touchscreen.tap(x,y);
      await page.waitForTimeout(120);
      await page.waitForFunction(()=>!guideNavigationBusy);
      const advanced=prior!==await signature();
      log('early tap',{selector,reading,busy,repeat,advanced,...await state()});
      return advanced;
    },
    touchButton: ['edge','abandon'].includes(mode)?async function(selector) {
      const node=page.locator(selector).first();
      await node.waitFor({state:'visible'});
      if(selector==='#enter'){await node.tap();return;}
      await page.waitForFunction(s=>{const e=document.querySelector(s);return e&&!e.disabled;},selector);
      const r=await node.boundingBox(), x=r.x+r.width*(mode==='edge'?.8:.5),y=r.y+r.height*.5;
      if(selector==='[data-item="starter_set"]'||selector==='[data-action="pick-furniture"][data-item="box"]'){
        const hit=await node.evaluate((card,point)=>{
          const list=card.closest('.store-list,.furniture-grid').getBoundingClientRect(),r=card.getBoundingClientRect();
          return {target:card.contains(document.elementFromPoint(point.x,point.y)),top:r.top,bottom:r.bottom,listTop:list.top,listBottom:list.bottom};
        },{x,y});
        const item=selector.includes('starter_set')?'starter':'box';
        await page.screenshot({path:path.join(out,item+'.png')});
        log('guided item',{item,...hit});
        if(!hit.target||hit.top<hit.listTop-1||hit.bottom>hit.listBottom+1)throw Error('Guided card is clipped or covered: '+JSON.stringify(hit));
      }
      if(mode==='abandon') {
        const values=()=>page.evaluate(()=>JSON.stringify([gameState.coins,gameState.inventory,gameState.campaign.phase,gameState.onboarding.guide,gameState.onboarding.townStep]));
        const before=await values();await input.move(x,y);await down();await input.cancel();
        if(before!==await values())throw Error('Cancelled press changed progress or inventory: '+selector);
      }
      await page.touchscreen.tap(x,y);
    }:null,
    async before(selector) {log('before',{selector,...await state()});await perturb();},
    async after(selector) {log('after',{selector,...await state()});},
    async care() {
      await page.locator('[data-room-fold]').tap();
      await page.locator('[data-command="food"]').tap();
      await page.locator('[data-action="equip-food"][data-food="food_dry"]').tap();
      const before=await page.evaluate(()=>getCat(gameState).body.foodLevel);
      const bowl=page.locator('.item-bowl');
      const coinCoversBowl=await bowl.evaluate(e=>{
        const r=e.getBoundingClientRect();
        return !!document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.discovery-pickup');
      });
      if(coinCoversBowl){
        const coins=await page.evaluate(()=>gameState.coins);
        await page.locator('.discovery-pickup').tap();
        await page.waitForFunction(previous=>gameState.coins>previous,coins);
        log('picked up coin covering bowl',await state());
      }
      await bowl.tap();
      await page.waitForFunction(level=>getCat(gameState).body.foodLevel>level,before);
      log('fed cat',await state());
    }
  };
}
module.exports={journeyAudit};
