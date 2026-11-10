const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process'),{pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../..');
module.exports=function(){
 const folder=path.join(root,'tests/screenshots/feedback-nov10/before');fs.mkdirSync(folder,{recursive:true});
 const old=name=>execFileSync('git',['-c','safe.directory='+root.replace(/\\/g,'/'),'show','a493c0d8d46083b6c55ecafc752529d1bfe10819:'+name],{cwd:root,encoding:'utf8',maxBuffer:15e6});
 let html=old('index.html').replace('<head>','<head><base href="'+pathToFileURL(root+path.sep).href+'">');
 for(const name of ['game-v032.js','game-app-services.js','game-tutorial.js','game-first-activity.js','game-v037.js','game-room-ui.js','assets/room-ui.css']){
  const dest=path.join(folder,path.basename(name));fs.writeFileSync(dest,old(name));html=html.replaceAll('"'+name+'"','"'+pathToFileURL(dest).href+'"');
 }
 const entry=path.join(folder,'index.html');fs.writeFileSync(entry,html);return pathToFileURL(entry).href;
};
