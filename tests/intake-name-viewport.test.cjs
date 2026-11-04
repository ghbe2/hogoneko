const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {openGame} = require('./helpers/game-page.cjs');

(async () => {
  const browser = await chromium.launch({channel:'chrome'});
  try {
    for (const [width,height] of [[320,568],[375,812]]) {
      for (const round of [2,3]) {
        const page = await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await openGame(page,'naming');
        await page.evaluate(round => {
          gameState.album = Array.from({length:round-1}, (_,i) => ({catId:'prior-'+i,name:'はな',outcome:'adopted'}));
          gameState.onboarding = {status:'done',guide:null,homeTour:'done'};
          gameState.flags.firstCatWelcomed = true;
          gameState.ui.firstName = true;
          titleScreenOpen = false;
          saveGameState(gameState);
          render(gameState);
        },round);
        await page.reload();
        await page.evaluate(()=>{titleScreenOpen=false;render(gameState)});
        const input=page.locator('.first-name input');
        const frame=()=>page.evaluate(()=>['#app','.stage','.room-carrier'].map(q=>{
          const n=document.querySelector(q), r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];
        }));
        const original=await frame();
        await input.tap();
        await input.fill('こはく');
        await page.evaluate(()=>{
          Object.defineProperty(visualViewport,'height',{configurable:true,value:innerHeight-235});
          visualViewport.dispatchEvent(new Event('resize'));
          render(gameState);
        });
        assert(await input.evaluate(n=>n===document.activeElement));
        assert.deepEqual(await frame(),original);
        const confirm=page.locator('[data-first="name"]');
        const button=await confirm.boundingBox();
        assert(button.y+button.height<=height-235+1,JSON.stringify(button));
        await page.screenshot({path:'tests/screenshots/name-keyboard-'+width+'-'+round+'.png'});
        await confirm.tap();
        await page.evaluate(()=>{
          delete visualViewport.height;
          visualViewport.dispatchEvent(new Event('resize'));
        });
        assert.equal(await page.evaluate(()=>getCat(gameState).name),'こはく');
        const first=await frame();
        await page.waitForTimeout(2500);
        assert.deepEqual(await frame(),first);
        await page.screenshot({path:'tests/screenshots/name-return-'+width+'-'+round+'.png'});
        assert.deepEqual(errors,[]);
        await page.close();
        console.log('PASS simulated keyboard, saved intake round',round,width);
      }
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
