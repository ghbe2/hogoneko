const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8'),source=html.slice(html.indexOf('function renderTitle(state)'),html.indexOf('function renderOpeningStory(state)'));
const ctx={initialCat:{id:'default'},getCat:s=>s.cats[0],renderCatArt:c=>`CAT:${c.id}`};vm.createContext(ctx);vm.runInContext(source,ctx);
for(const [status,onboarding,expected]of[['raising','done','home'],['raising','new','default'],['candidate','done','default'],['adopted','done','default']])assert(ctx.renderTitle({onboarding:{status:onboarding},cats:[{id:'home',status}]}).includes('CAT:'+expected));
const css=fs.readFileSync('game-v026.js','utf8');assert(css.includes('top:calc(148px + 12.7%)'));assert(css.includes('#app .game-frame.required-visit>.controls{z-index:142}'));assert(css.includes("notice.className='visit-notice system-message'"));
console.log('PASS title cat follows raising state and shared notice placement/control layer rules');
