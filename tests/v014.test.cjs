// NODE_PATH に Playwright のインストール先を指定して実行。
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path');
const assert = require('assert/strict');
const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

async function drag(page, source, destination) {
  const a = await page.locator(source).boundingBox();
  const b = await page.locator(destination).boundingBox();
  assert(a && b, `Missing drag target: ${source} / ${destination}`);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height * .7, { steps:16 });
  await page.mouse.up();
}

(async () => {
  const browser = await chromium.launch({ channel:'chrome', headless:true });
  try {
    const page = await browser.newPage({ viewport:{width:375,height:667}, hasTouch:true, isMobile:true });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url);
    assert.equal(await page.locator('.title-screen').count(), 1);
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.locator('.story-screen').count(), 1);
    for (let i=0;i<3;i++) await page.locator('[data-action="next-story"]').click();
    assert.equal(await page.locator('.field-scene').count(), 1);
    assert((await page.locator('.screen-guide').innerText()).includes('保護器を草地'));
    await drag(page, '[data-field-drag="trap"]', '.field-scene');
    assert((await page.locator('.screen-guide').innerText()).includes('ごはんを保護器'));
    await drag(page, '[data-food="food_dry"]', '.trap');
    await page.reload();
    assert.equal(await page.locator('.title-screen').count(), 1);
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.locator('.story-screen').count(), 0, 'Story replayed after reload');
    // E2E の個体を固定し、ランダム抽選にテスト結果を依存させない。
    await page.evaluate(() => { Math.random = () => .3; });
    await page.locator('[data-action="open-trap"]').waitFor({timeout:5000});
    await page.locator('[data-action="open-trap"]').click({force:true}); // 揺れる演出中の保護器。
    await page.locator('[data-action="go-clinic"]').waitFor({timeout:5000});
    await page.locator('[data-action="go-clinic"]').click();
    await page.locator('[data-action="start-naming"]').waitFor({timeout:5000});
    await page.locator('[data-action="start-naming"]').click();
    await page.locator('#campaign-cat-name').fill('はる');
    await page.locator('[data-action="toggle-guide"]').click();
    assert.equal(await page.locator('#campaign-cat-name').inputValue(), 'はる');
    await page.reload();
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.locator('#campaign-cat-name').inputValue(), 'はる');
    await page.locator('[data-action="start-intake"]').click();

    const feasibility = await page.evaluate(() => {
      const types = Object.keys(CONFIG.affinity.chart);
      const failures = [];
      let total=0;
      for (let a=0;a<types.length;a++) for (let b=a;b<types.length;b++) {
        const state = JSON.parse(JSON.stringify(gameState));
        state.cats[0].types = a === b ? [types[a]] : [types[a],types[b]];
        const room = state.rooms[0]; room.floor=[]; room.wall=[];
        for (const id of CONFIG.stage1.placedItems) {
          const item=getItem(id);
          if (!item.essential && isNegativeAffinity(getAffinity(state.cats[0],item).kind)) continue;
          room[item.zone].push({itemId:id,...CONFIG.stage1.defaultLayout[id]});
        }
        const result=getRoomComfortBreakdown(state); total++;
        if (!result.canExit) failures.push({types:state.cats[0].types,score:result.total});
      }
      return {total,failures};
    });
    console.log('starter feasibility', JSON.stringify(feasibility));
    assert.equal(feasibility.total,136);
    assert.equal(feasibility.failures.length,5,'Known intake balance limitations changed');
    // 相性は変えず、既存の家具の中で正の評価のものを選んで迎える。
    const choices = await page.evaluate(() => CONFIG.stage1.placedItems.filter(id => {
      const item=getItem(id), placed=getPlaced(getRoom(gameState)).some(p=>p.itemId===id);
      const wanted=item.essential || !isNegativeAffinity(getAffinity(getCat(gameState),item).kind);
      return placed !== wanted;
    }));
    for (const id of choices) {
      if (!await page.locator('.layout-edge-palette').count()) await page.locator('[data-action="toggle-layout-tray"]').click();
      // ガイドは折り畳んで家具を操作する。
      if (await page.locator('.guide-detail').count()) await page.locator('[data-action="toggle-guide"]').click();
      await page.locator(`.layout-palette-item[data-item="${id}"]`).click();
    }
    assert(await page.evaluate(() => getRoomComfortBreakdown(gameState).canExit), 'Drawn cat cannot finish intake');
    await page.locator('[data-action="call-intake-cat"]').click();
    await page.locator('[data-action="close-schedule-intro"]').waitFor({timeout:5000});
    await page.locator('[data-action="close-schedule-intro"]').click();
    assert.equal(await page.evaluate(() => gameState.onboarding.status), 'done');
    await page.reload();
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.evaluate(() => gameState.campaign.phase), 'room');
    assert.equal(await page.locator('.story-screen').count(), 0);

    const rates = await page.evaluate(() => {
      const types=Object.keys(CONFIG.affinity.chart), examples={};
      for(const a of types) for(const b of types) {
        if(a===b)continue;
        const kind=getAffinity({types:[a,b]},getItem('mouse')).kind;
        examples[kind] ||= [a,b];
      }
      return Object.entries(examples).map(([kind,pair]) => {
        gameState.cats[0]={...gameState.cats[0],types:pair,heart:50,heartCap:100};
        gameState.ui={...gameState.ui,modal:null,layoutMode:false,usedHandItems:{}};
        render(gameState);
        const catElement=document.querySelector('.cat-object');
        const draft={itemId:'mouse',heartEarned:0,heartProgressMs:0};
        const result=resolveInteraction(getCat(gameState),'play',getItem('mouse'));
        for(let i=0;i<100;i++) accrueLivePlayHeart(draft,catElement,result,3,100,.3);
        const small=document.querySelectorAll('.live-heart:not(.big)').length;
        const big=document.querySelectorAll('.live-heart.big').length;
        const gain=draft.heartEarned;
        const stopped={itemId:'mouse',heartEarned:0,heartProgressMs:0};
        accrueLivePlayHeart(stopped,catElement,result,0,10000,0);
        const applied=reduceGameState(gameState,{type:'FINISH_PLAY',live:true,itemId:'mouse',liveHeartGain:gain});
        return {kind,gain,small,big,stopped:stopped.heartEarned,committed:applied.cats[0].heart-50};
      });
    });
    for (const row of rates) {
      const expected={superMatch:2,match:1,neutral:.5,dislike:0,superDislike:0}[row.kind];
      assert.equal(row.gain,expected,JSON.stringify(row));
      assert.equal(row.small,expected*10); assert.equal(row.big,Math.floor(expected));
      assert.equal(row.stopped,0);
      if(row.kind!=='superDislike') assert.equal(row.committed,expected);
    }
    assert.equal(rates.length,5);
    console.log('10 seconds moving', JSON.stringify(rates));
    const legacy = await page.evaluate(() => {
      const save={version:1,state:JSON.parse(JSON.stringify(gameState))};
      delete save.state.onboarding;
      save.state.cats[0].status='raising';
      localStorage.setItem(SAVE_KEY,JSON.stringify(save));
      return save.state.cats[0].name;
    });
    await page.reload();
    await page.locator('[data-action="start-game"]').click();
    assert.equal(await page.evaluate(() => gameState.onboarding.status),'done');
    assert.equal(await page.evaluate(() => getCat(gameState).name),legacy);
    assert.equal(errors.length,0,errors.join('\n'));
    assert(await page.evaluate(() => document.body.scrollWidth <= innerWidth));
    console.log('PASS: first journey, reloads, migration, 5 affinities, no overflow');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
