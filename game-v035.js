'use strict';
// Separate affection feedback from actual growth: delight is not a fake heart gain.
const feelReduce=reduceGameState;
reduceGameState=function(state,action){
 const next=feelReduce(state,action);if(next===state||next.campaign.phase!=='room')return next;
 const care=state.ui.careAnimation;
 const completed=action.type==='FINISH_CARE'&&care&&!next.ui.careAnimation;
 const contact=action.type==='EXECUTE_CONTACT'&&action.contact==='call'||action.type==='TAP_CAT'&&!next.ui.careAnimation;
 if(!contact&&!completed&&action.type!=='FINISH_PLAY')return next;
 if(next.ui.modal)return next;
 const operation=completed?care.operation:action.type==='FINISH_PLAY'?'play':action.contact==='call'?'call':'pet';
 const delta=Math.round((getCat(next).heart-getCat(state).heart)*10)/10;
 let affinity=next.ui.lastAffinityLog?.affinity||'neutral';
 if(['food','water'].includes(operation))affinity=operation==='food'?interactionResult(getCat(next),'feed',getFood(care.foodId)).affinity:'neutral';
 if(['hair','clean'].includes(operation))affinity='neutral';
 return {...next,ui:{...next.ui,feel:{id:Date.now()+Math.random(),until:Date.now()+3600,operation,affinity,delta,before:getCat(state).heart},reaction:null}};
};
const feelPose=scenePose;
scenePose=function(svg){
 const original=feelPose(svg),f=gameState.ui.feel;
 if(!svg.closest('.cat-object')||!f||f.until<Date.now()||['walk','jump'].includes(original[0]))return original;
 if(f.affinity==='superDislike')return ['sit','angry'];
 if(f.affinity==='dislike')return ['sit','wary'];
 if(f.affinity==='superMatch')return [f.operation==='play'?'punch':'knead','happy'];
 if(f.affinity==='match')return [f.operation==='pet'||f.operation==='groom'?'knead':'sit','happy'];
 return ['sit','neutral'];
};
function showFeel(catElement,affinity){
 if(!catElement)return;
 const svg=catElement.querySelector('.game-cat-svg');if(!svg)return;
 const strength={superMatch:1,match:.65,neutral:.25,dislike:-.6,superDislike:-1}[affinity]||.25;
 // Animate the inner artwork, never the floor coordinates or movement controller.
 svg.animate([{translate:'0 0',rotate:'0deg'},{translate:`${strength<0?10:0}px ${strength>0?-9*strength:2}px`,rotate:`${strength*7}deg`},{translate:'0 0',rotate:'0deg'}],{duration:strength<0?450:700,iterations:2});
}
const feelRender=render;
let lastFeelId=null;
render=function(state){
 feelRender(state);const f=state.ui.feel,stage=app.querySelector('.stage');
 if(!stage||state.ui.modal||state.ui.layoutMode||!f||f.until<Date.now())return;
 const cat=app.querySelector('.cat-object');if(!cat)return;
 const b=cat.getBoundingClientRect(),s=stage.getBoundingClientRect();
 const cue=document.createElement('span');cue.className='feel-cue';cue.style.left=`${Math.max(25,Math.min(s.width-25,b.left+b.width/2-s.left))}px`;cue.style.top=`${Math.max(35,b.top-s.top)}px`;
 cue.textContent={superMatch:'♫ ♫',match:'♪',neutral:'！',dislike:'↶',superDislike:'💢'}[f.affinity];
 cue.setAttribute('role','status');cue.setAttribute('aria-label',{superMatch:'大喜び',match:'うれしそう',neutral:'気付いてこちらを見る',dislike:'身を引く',superDislike:'強く嫌がる'}[f.affinity]);stage.appendChild(cue);
 if(f.delta!==0){const meter=document.createElement('aside');meter.className='live-heart-meter care-heart-meter';meter.innerHTML=renderHeartVisual(getCat(state));stage.appendChild(meter);meter.classList.add(f.delta>0?'heart-growing':'heart-falling');}
 if(lastFeelId!==f.id){showFeel(cat,f.affinity);if(f.delta>0)spawnLiveFeedback(cat,f.affinity,true);lastFeelId=f.id;}
 setTimeout(()=>{cue.remove();stage.querySelector('.care-heart-meter')?.remove();},Math.max(0,f.until-Date.now()));
};
const feelSpawn=spawnLiveFeedback;
spawnLiveFeedback=function(cat,affinity,big=false,moodOnly=false){
 feelSpawn(cat,affinity,big,moodOnly);
 if(big||moodOnly)showFeel(cat,affinity);
 const stage=cat.closest('.stage');if(moodOnly){const cue=stage?.querySelector('.live-heart:last-child');if(cue)cue.textContent={superMatch:'♫',match:'♪',neutral:'！',dislike:'↶',superDislike:'💢'}[affinity];}
 if(!moodOnly){const meter=stage?.querySelector('.live-heart-meter');if(meter){meter.classList.remove('heart-growing');void meter.offsetWidth;meter.classList.add('heart-growing');}}
};
const feelMeter=updateLiveHeartMeter;
updateLiveHeartMeter=function(draft,stage){
 feelMeter(draft,stage);
 const meter=stage.querySelector('.live-heart-meter');if(!meter)return;
 // Magnify the currently filling heart; the ten-heart row remains the lifetime scale.
 const heart=getCat(gameState).heart+draft.heartEarned,fill=((heart%10)+10)%10*10;
 const zoom=document.createElement('div');zoom.className='heart-closeup';zoom.innerHTML=`<span class="heart-slot available" style="--fill:${fill}%">♥<i class="heart-fill">♥</i></span>`;meter.appendChild(zoom);
};
const feelStyle=document.createElement('style');feelStyle.textContent=`
.feel-cue{position:absolute;z-index:75;pointer-events:none;font-size:30px;color:#ad6c3e;text-shadow:0 2px #fff;transform:translate(-50%,-100%);animation:feel-pop .6s ease-out}
.heart-closeup{display:flex;justify-content:center;margin-top:5px}.live-heart-meter .heart-closeup .heart-slot,.live-heart-meter .heart-closeup .heart-fill{font-size:42px;height:45px;width:45px}
.heart-growing .heart-row{animation:feel-grow .65s ease-out}.heart-falling .heart-row{animation:feel-fall .6s ease-out}.live-heart.big{font-size:46px!important}
@keyframes feel-pop{from{opacity:0;translate:0 12px;scale:.4}to{opacity:1;translate:0 0;scale:1}}
@keyframes feel-grow{40%{filter:drop-shadow(0 0 5px #f28ba5);transform:scale(1.12)}}
@keyframes feel-fall{40%{opacity:.35;transform:translateY(3px)}}
@media(prefers-reduced-motion:reduce){.feel-cue,.heart-growing .heart-row,.heart-falling .heart-row{animation:none}}
`;document.head.appendChild(feelStyle);render(gameState);
