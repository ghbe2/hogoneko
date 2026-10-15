const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 for(const origin of ['room','intake','town']){
  await p.evaluate(origin=>{gameState.campaign.phase=origin;dispatch(origin==='town'?{type:'OPEN_MAP_SHOP',shopId:'petshop'}:{type:'OPEN_SUPPLIES'});dispatch({type:'STORE_QUANTITY',id:'food_dry',delta:1});dispatch({type:'STORE_QUANTITY',id:'groom_comb',delta:1});dispatch({type:'STORE_QUANTITY',id:'groom_comb',delta:-1});},origin);
  assert.equal(await p.evaluate(()=>storeCount(gameState)),1);await p.click('[data-action="back-town"]');assert.deepEqual(await p.evaluate(()=>storeCart(gameState)),{});
  await p.evaluate(origin=>dispatch(origin==='town'?{type:'OPEN_MAP_SHOP',shopId:'petshop'}:{type:'OPEN_SUPPLIES'}),origin);assert.equal(await p.evaluate(()=>storeCount(gameState)),0);await p.click('[data-action="back-town"]');
 }
 const snapshot=()=>p.evaluate(()=>Object.fromEntries(['.reception-hero','.reception-heading','.reception-content','.reception-actions'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return[sel,[r.x,r.y,r.width,r.height]]})));
 const bases={};
 for(const kind of ['clinic','plaza'])for(const status of ['no-cat','welcome','sick','healthy','ready','done']){
  await p.evaluate(({kind,status})=>{const cat=getCat(gameState);cat.status=status==='no-cat'?'waiting':'raising';cat.body.sick=status==='sick';cat.body.days=status==='ready'||status==='done'?10:0;cat.body.weight=status==='ready'||status==='done'?4000:700;cat.surgery={...cat.surgery,status:status==='done'||(kind==='plaza'&&status==='ready')?'done':'none'};gameState.ui.modal=null;gameState.coins=50;dispatch(kind==='clinic'?{type:'OPEN_MAP_SHOP',shopId:'clinic'}:{type:'OPEN_PLAZA'});if(kind==='clinic'&&!['no-cat','welcome'].includes(status))dispatch({type:'EXAMINE_CAT'});}, {kind,status});
  const layout=await snapshot();if(!bases[kind])bases[kind]=layout;assert.deepEqual(layout,bases[kind],'stable layout across all states of each facility');
  const failures=await p.evaluate(()=>{const fail=[];for(const selector of ['.reception-panel','.reception-content','.reception-speech']){const e=document.querySelector(selector);if(e.scrollHeight>e.clientHeight+1)fail.push(selector)}const footer=document.querySelector('.reception-actions').getBoundingClientRect();if(footer.bottom>innerHeight-18)fail.push('footer');if(document.documentElement.scrollHeight>innerHeight)fail.push('page');return fail});assert.deepEqual(failures,[],kind+status);
  if(status==='welcome'||status==='sick'||status==='ready')await p.screenshot({path:`tests/screenshots/reception-${kind}-${status}-${width}.png`});
  if(kind==='clinic'&&status==='ready'){await p.click('[data-clinic="menu"]');assert(await p.locator('[data-action="go-surgery"]').isEnabled());}
  if(kind==='plaza')assert.equal(await p.locator('[data-action="go-event"]').isEnabled(),status==='ready'||status==='done');
 }
 await p.evaluate(()=>{dispatch({type:'OPEN_MAP_SHOP',shopId:'clinic'});});const before=await snapshot();await p.evaluate(()=>render(gameState));assert.deepEqual(await snapshot(),before);
 await p.reload();assert.deepEqual(await p.evaluate(()=>storeCart(gameState)),{});
 }assert.deepEqual(errors,[]);console.log('PASS cart reset for town/room/intake, zero rows cleared, all reception states fit and align, eligibility and redraw stability.');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
