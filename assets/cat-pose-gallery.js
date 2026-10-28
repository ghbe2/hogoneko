'use strict';
const poses={sniff:'匂いを確かめる',settle:'静かに安心する',disengage:'接触を外して離れる',sit:'正面 · すわる',sit_left:'左斜め',sit_right:'右斜め',walk:'左への歩行',walk_right:'右への歩行',hunt:'玩具で遊ぶ',stalk:'低く狙う',bat:'前足で連打',pin:'両手で押さえる',dash:'走る',jump:'ジャンプ',rest:'伏せる',sleep:'眠る',cower:'身をすくめる',alert:'身構える',punch:'ネコパンチ',knead:'ふみふみ',wall:'壁をひっかく',scratch:'床をひっかく',eat:'食べる',poop:'トイレ',vomit:'吐く'};
let stopped=matchMedia('(prefers-reduced-motion: reduce)').matches;
let coatSeed=null;
const detail=document.querySelector('#detail'),toggle=document.querySelector('#toggle');
function send(frame,extra={}){frame.contentWindow.postMessage({type:'cat-gallery',paused:stopped,coatSeed,...extra},'*');}
function makeFrame(pose){const frame=document.createElement('iframe');const query={sit:'pose=sit&head-turn=0',sit_left:'pose=sit&head-turn=-0.85',sit_right:'pose=sit&head-turn=0.85',walk_right:'pose=walk&direction=right'}[pose]||`pose=${pose}`;frame.src=`cat-life-sample.html?embed=1&${query}`;frame.title=poses[pose];frame.addEventListener('load',()=>send(frame));return frame;}
for(const [pose,label]of Object.entries(poses)){
 const card=document.createElement('article');card.dataset.pose=pose;card.append(makeFrame(pose));
 const caption=document.createElement('div');caption.className='caption';const title=document.createElement('h2');title.textContent=label;
 const button=document.createElement('button');button.textContent='拡大 ›';button.setAttribute('aria-label',label+'を拡大');button.onclick=()=>{document.querySelector('#detail-title').textContent=label;detail.append(makeFrame(pose));detail.showModal();};
 caption.append(title,button);card.append(caption);document.querySelector('#gallery').append(card);
}
function label(){toggle.textContent=stopped?'全体を再生 ▶':'一時停止 Ⅱ';toggle.setAttribute('aria-pressed',String(stopped));}
toggle.onclick=()=>{stopped=!stopped;label();document.querySelectorAll('iframe').forEach(f=>send(f));};
document.querySelector('#restart').onclick=()=>{stopped=false;label();document.querySelectorAll('iframe').forEach(f=>send(f,{restart:true}));};
document.querySelector('#random-coat').onclick=()=>{coatSeed=crypto.getRandomValues(new Uint32Array(1))[0];document.querySelectorAll('iframe').forEach(f=>send(f));};
document.querySelector('#close').onclick=()=>detail.close();detail.addEventListener('close',()=>detail.querySelector('iframe')?.remove());label();
