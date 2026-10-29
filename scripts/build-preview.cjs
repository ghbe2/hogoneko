// Usage: set MOCK_VIEW_PASSWORD, then node scripts/build-preview.cjs
// GitHub Pages receives only docs/. Source index.html remains local-development friendly.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
// Optional release snapshot: do not publish unrelated work-in-progress assets.
function readSource(file){return process.env.PREVIEW_COMMITTED==='1'&&path.relative(root,file).replace(/\\/g,'/')!=='TYPE_MATCHUP_v0.1.html'
 ?require('node:child_process').execFileSync('git',['-c','safe.directory='+root.replace(/\\/g,'/'),'show','HEAD:'+path.relative(root,file).replace(/\\/g,'/')],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})
 :fs.readFileSync(file,'utf8');}
const password = process.env.MOCK_VIEW_PASSWORD;
if (!password) throw new Error('MOCK_VIEW_PASSWORD is required. No unprotected build is produced.');
const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
const iterations = 210000;
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
// Inline local game modules before encryption; deployed preview remains self-contained.
function inlinePage(relativePage){
const base=path.dirname(path.join(root,relativePage));
let source = readSource(path.join(root, relativePage)).replace(/<script src="([^"]+)"><\/script>/g, (_, relative) => {
  const file = path.resolve(base, relative);
  if (!file.startsWith(root + path.sep)) throw new Error('External script not allowed: ' + relative);
  return '<script>\n' + readSource(file).replace(/<\/script/gi, '<\\/script') + '\n</script>';
});
// Embed the town artwork as well; encrypted releases must not depend on loose assets.
source=source.replaceAll('src="assets/tsuguneko-logo.png"','src="data:image/png;base64,'+fs.readFileSync(path.join(root,'assets/tsuguneko-logo.png')).toString('base64')+'"');
source=source.replaceAll('src="assets/town-map.svg"', 'src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(readSource(path.join(root,'assets/town-map.svg')))+'"');
source=source.replaceAll('href="assets/town-map.svg"', 'href="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(readSource(path.join(root,'assets/town-map.svg')))+'"');
source=source.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,relative)=>{
 const file=path.resolve(base,relative);if(!file.startsWith(root+path.sep))throw new Error('Invalid stylesheet');
 const css=readSource(file).replace(/url\(['"]?(\.\.?\/[^'"\)]+\.(?:otf|woff2?))['"]?\)/g,(_,asset)=>{
  const font=path.resolve(path.dirname(file),asset);if(!font.startsWith(root+path.sep))throw new Error('Invalid font path');
  const ext=path.extname(font).slice(1);return 'url("data:font/'+ext+';base64,'+fs.readFileSync(font).toString('base64')+'")';
 });
 return '<style>'+css+'</style>';
});
// Fonts are embedded above; a local-path preload would request a missing deployed file.
source=source.replace(/<link\b[^>]*\bas="font"[^>]*>/g,'');
if(relativePage!=='index.html'&&relativePage!=='check.html'&&relativePage!=='check-view.html'&&relativePage!=='heart-study.html'&&relativePage!=='heart-fall.html'){
 const back=relativePage.startsWith('art/')?'../../check.html':'check.html';
 source=source.replace('</body>',`<a href="${back}" target="_top" style="position:fixed;right:8px;bottom:8px;z-index:99999;background:#514940;color:#fff;padding:8px 12px;border-radius:24px;text-decoration:none;font:12px system-ui">チェック一覧へ</a></body>`);
}
return source;
}
const source=inlinePage('index.html');
const encrypted = Buffer.concat([cipher.update(source), cipher.final(), cipher.getAuthTag()]);
const payload = {salt:salt.toString('base64'),iv:iv.toString('base64'),data:encrypted.toString('base64'),iterations};
const template = fs.readFileSync(path.join(__dirname, 'preview-gate.html'), 'utf8');
fs.mkdirSync(path.join(root, 'docs'), {recursive:true});
fs.writeFileSync(path.join(root, 'docs/index.html'), template.replace('__PREVIEW_PAYLOAD__', JSON.stringify(payload)));
fs.writeFileSync(path.join(root, 'docs/.nojekyll'), '');
fs.writeFileSync(path.join(root, 'docs/robots.txt'), 'User-agent: *\nDisallow: /\n');
for(const page of ['heart-fall.html','heart-study.html','check.html','check-view.html','TYPE_MATCHUP_v0.1.html',...['cat-lab','toy-study','interior-toy-study','scene-study','room-study'].map(name=>'art/cat-directions/'+name+'.html')]){
 const pageIv=crypto.randomBytes(12),pageCipher=crypto.createCipheriv('aes-256-gcm',key,pageIv);
 const data=Buffer.concat([pageCipher.update(inlinePage(page)),pageCipher.final(),pageCipher.getAuthTag()]);
 const output=path.join(root,'docs',page);fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,template.replace('__PREVIEW_PAYLOAD__',JSON.stringify({salt:salt.toString('base64'),iv:pageIv.toString('base64'),data:data.toString('base64'),iterations})));
}
console.log('Password-protected preview built in docs/.');
