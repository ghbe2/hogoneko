const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..');
const source=process.env.GAME_URL||pathToFileURL(path.join(root,'index.html')).href;
const output=path.join(root,'tests/screenshots/tutorial-runs',new Date().toISOString().replace(/[:.]/g,'-'));
const sizes=process.env.TOUCH_SIZE?[process.env.TOUCH_SIZE]:['320x568','375x812'];
const profiles=process.env.JOURNEY_AUDIT?[process.env.JOURNEY_AUDIT]:['redraw','interrupt','viewport','resume','early','edge','abandon'];
const queue=profiles.flatMap(mode=>sizes.map(size=>({mode,size})));
const results=[];
async function run({mode,size}){
  const dir=path.join(output,mode+'-'+size);
  fs.mkdirSync(path.join(dir,'tests/screenshots'),{recursive:true});
  const stream=fs.createWriteStream(path.join(dir,'console.log'));
  const child=spawn(process.execPath,[path.join(root,'tests/first-journey-touch.test.cjs')],{
    cwd:dir,env:{...process.env,TOUCH_SIZE:size,JOURNEY_AUDIT:mode,GAME_URL:source},
    stdio:['ignore','pipe','pipe']
  });
  child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  await new Promise(resolve=>stream.end(resolve));
  const events=fs.readFileSync(path.join(dir,'tests/screenshots/tutorial-audit',mode,'steps.jsonl'),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  const result={mode,size,passed:code===0&&events.some(e=>e.phase==='fed cat'),last:events.at(-1),buttons:events.filter(e=>e.phase==='after').length,gestures:events.filter(e=>e.phase==='gesture end').length};
  results.push(result);console.log(result.passed?'PASS':'FAIL',mode,size,result.last);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({source,results},null,2));
}
async function worker(){for(let task;(task=queue.shift());)await run(task);}
console.log(output);Promise.all(Array.from({length:Math.max(1,Math.min(4,Number(process.env.JOURNEY_WORKERS)||4))},worker)).then(()=>{if(results.some(r=>!r.passed))process.exitCode=1;}).catch(e=>{console.error(e);process.exitCode=1;});
