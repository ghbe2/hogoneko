const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path'),sharp=require('sharp');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const [width,height]of [[320,568],[375,812]]){
 await p.setViewportSize({width,height});await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=room');
 await p.evaluate(()=>{titleScreenOpen=false;gameState.onboarding={...gameState.onboarding,status:'active',flowVersion:1,appIntro:null};gameState.cats[0]={...getCat(gameState),status:'captured',coatLabel:'きじ・白 A',body:{...getCat(gameState).body,weight:1867},types:['shy']};gameState.campaign={...gameState.campaign,requiredVisit:null,captureStartedAt:Date.now()-5000,trapRevealDone:true};gameState.ui={...gameState.ui,modal:null};});
 const shots=[];
 for(const [name,phase,guide]of [['clinic','shop','clinicHello'],['result','clinic','stats'],['invoice','clinic','receipt'],['capture','trapInspect','toClinic'],['exam','clinic',null]]){
  await p.evaluate(({phase,guide})=>{gameState.campaign={...gameState.campaign,phase,shopId:'clinic',clinicStep:guide===null?'exam':'summary',firstExamAt:Date.now()+10000};gameState.onboarding.guide=guide;const spec=FIRST_GUIDES[guide];if(spec)guideSpeechCache.set('first:'+guide+':'+spec.copy,-10000);render(gameState);},{phase,guide});await p.waitForTimeout(700);
  const file=`tests/screenshots/feedback-${width}-${name}.png`;await p.screenshot({path:file});shots.push(file);
  const geometry=await p.evaluate(()=>{const svg=app.querySelector('.first-exam-cat svg,.capture-portrait svg'),r=svg&&svgRigs.get(svg),note=app.querySelector('.shared-guide-note');return {note:note?.getBoundingClientRect().toJSON(),svg:svg?.getBoundingClientRect().toJSON(),view:svg?.getAttribute('viewBox'),ground:r?new DOMPoint(360,r.rig.ground).matrixTransform(svg.getScreenCTM()).toJSON():null,bed:app.querySelector('.first-exam-bed')?.getBoundingClientRect().toJSON(),scroll:app.scrollHeight,client:app.clientHeight}});console.log(width,name,JSON.stringify(geometry));
  if(geometry.note)assert.equal(geometry.note.height,210);assert(geometry.scroll<=geometry.client+1);
  assert(await p.evaluate(()=>[...app.querySelectorAll('[data-first="pay"],.first-chart,.first-exam-bed,.capture-cage-front')].every(n=>{const r=n.getBoundingClientRect(),a=app.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom&&r.left>=a.left&&r.right<=a.right;})),name+' actual content and action fit, not merely clipped');
  if(geometry.bed)assert(geometry.ground.y>geometry.bed.top+8 && geometry.ground.y<geometry.bed.bottom-5,'feet rest on the mattress surface');
 }
 await sharp({create:{width:width*shots.length,height,channels:3,background:'#fff'}}).composite(shots.map((input,i)=>({input,left:i*width,top:0}))).png().toFile(`tests/screenshots/feedback-${width}-review.png`);
}assert.deepEqual(errors,[]);console.log('PASS feedback scenes');}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
