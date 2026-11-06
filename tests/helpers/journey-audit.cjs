const fs = require('node:fs');
const path = require('node:path');

function journeyAudit(page, input, mode) {
  if (!['redraw', 'interrupt', 'viewport', 'resume'].includes(mode)) throw Error('Unknown journey audit mode');
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
    async before(selector) {log('before',{selector,...await state()});await perturb();},
    async after(selector) {log('after',{selector,...await state()});},
    async care() {
      await page.locator('[data-room-fold]').tap();
      await page.locator('[data-command="food"]').tap();
      await page.locator('[data-action="equip-food"][data-food="food_dry"]').tap();
      const before=await page.evaluate(()=>getCat(gameState).body.foodLevel);
      await page.locator('.item-bowl').tap();
      await page.waitForFunction(level=>getCat(gameState).body.foodLevel>level,before);
      log('fed cat',await state());
    }
  };
}
module.exports={journeyAudit};
