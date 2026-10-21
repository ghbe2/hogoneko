const {chromium}=require('playwright'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await b.newContext({viewport:{width:375,height:812}}),p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 require('node:fs').mkdirSync('tests/videos',{recursive:true});
 const encoder=require('node:child_process').spawn('C:/Users/user/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe',['-y','-loglevel','error','-f','image2pipe','-framerate','5','-i','pipe:0','-vf','pad=ceil(iw/2)*2:ceil(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart','tests/videos/introduction-review.mp4'],{windowsHide:true,stdio:['pipe','ignore','inherit']});
 const encoded=new Promise((resolve,reject)=>{encoder.on('error',reject);encoder.on('exit',code=>code===0?resolve():reject(Error('video encoding '+code)))});
 await p.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await p.click('[data-action="start-game"]');await p.waitForSelector('.introduction-dialogue');await p.waitForTimeout(3000);
 const samples=[];for(let i=0;i<33;i++){
  samples.push(await p.evaluate(()=>[...app.querySelectorAll('.intro-neighbor-cat')].map(svg=>{const r=svg.getBoundingClientRect(),a=app.getBoundingClientRect(),holder=svg.parentElement.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,pose:svg.dataset.pose,visible:r.left>=a.left&&r.right<=a.right&&r.top>=a.top&&r.bottom<=a.bottom,holderY:holder.y,paths:svg.querySelectorAll('path').length};})));
  if([0,4,9,15,23,30].includes(i))await p.screenshot({path:`tests/screenshots/intro-motion-${i}.png`});
  if(i===13)await p.evaluate(()=>dispatch({type:'SYNC_REAL_TIME'}));
  if(i===17){await p.click('[data-action="next-story"]');}
  if(i===27){await p.click('[data-action="previous-story"]');}
  for(let f=0;f<5;f++){const start=Date.now();encoder.stdin.write(await p.screenshot());await p.waitForTimeout(Math.max(1,200-(Date.now()-start)));}
 }
 for(let n=0;n<2;n++){assert(samples.every(s=>s.length===2&&s[n].visible&&s[n].paths>0),'cats never disappear or leave viewport');assert(samples.every(s=>Math.abs(s[n].holderY-samples[0][n].holderY)<.1),'horizontal travel only');assert(new Set(samples.map(s=>s[n].pose)).size>=2,'individual walk/rest states');assert(Math.max(...samples.map(s=>s[n].x))-Math.min(...samples.map(s=>s[n].x))>8,'moves visibly');}
 assert(samples.filter(s=>s[0].pose!==s[1].pose).length>12,'independent behavior');assert.deepEqual(errors,[]);
 encoder.stdin.end();await encoded;await context.close();console.log('PASS 33 seconds of visible independent walk/rest motion, horizontal bounds, live redraw and page changes; video saved');
 const reduced=await b.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'});await reduced.goto(pathToFileURL(path.resolve('index.html')).href+'?check=1&scenario=intro');await reduced.click('[data-action="start-game"]');await reduced.waitForTimeout(3000);assert(await reduced.evaluate(()=>[...app.querySelectorAll('.intro-neighbor')].every(n=>getComputedStyle(n).transform==='matrix(1, 0, 0, 1, 0, 0)')));await reduced.close();
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
