'use strict';
const captureJourneyReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='FINISH_TRAP_REVEAL'&&state.campaign.captureStartedAt&&Date.now()-state.campaign.captureStartedAt<2800)return state;
 const next=captureJourneyReducer(state,action);
 if(action.type==='OPEN_TRAP'&&state.campaign.phase==='field'&&next.campaign.phase==='trapInspect')return {...next,campaign:{...next.campaign,captureStartedAt:Date.now()}};
 return next;
};
renderTrapInspect=function(state,cat){
 const done=state.campaign.trapRevealDone,elapsed=done?2800:Math.max(0,Date.now()-(state.campaign.captureStartedAt||Date.now())),p=state.campaign.trapPosition||{x:50,y:72};
 const eyes='<svg viewBox="0 0 120 36" aria-hidden="true"><path d="M9 18Q24 1 44 15Q28 34 9 18m67-3q20-14 35 3-19 16-35-3" fill="#e2d98a"/><path d="M28 10v15m64-15v15" stroke="#18291d" stroke-width="5" stroke-linecap="round"/></svg>';
 return renderCampaignShell(state,'保護器',`<section class="capture-journey ${done?'finished':''}" style="--capture-delay:-${elapsed}ms;--capture-x:${p.x}%;--capture-y:${p.y}%"><div class="capture-approach">${fieldBackdrop(state)}<div class="capture-distant-trap" style="left:${p.x}%;top:${p.y}%">${encounterTrapArt()}</div></div><div class="capture-night"></div><div class="capture-first-eyes">${eyes}</div><div class="capture-portrait">${renderCatArt(cat)}</div><div class="capture-message">保護器にネコが入りました</div></section>`,done?'<button class="campaign-button" data-action="go-clinic">動物病院へ連れていく</button>':'');
};
let captureFinishTimer,captureAnimationFrame;
function captureCageFront(){return '<svg viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true"><rect x="5" y="5" width="290" height="290" rx="9" fill="none" stroke="#92866a" stroke-width="9"/><path d="M52 8V292M101 8V292M199 8V292M248 8V292M8 65H292M8 238H292" fill="none" stroke="#a79c7f" stroke-opacity=".65" stroke-width="3"/><path d="M8 286H292" stroke="#b7a482" stroke-width="14"/></svg>';}
const captureJourneyRender=render;
render=function(state){
 captureJourneyRender(state);clearTimeout(captureFinishTimer);cancelAnimationFrame(captureAnimationFrame);
 const journey=app.querySelector('.capture-journey');
 if(journey)journey.classList.toggle('is-first-capture',firstActive(state));
 if(journey){const portrait=journey.querySelector('.capture-portrait');portrait.insertAdjacentHTML('beforebegin','<div class="capture-cage-back"></div>');portrait.insertAdjacentHTML('afterend',`<div class="capture-cage-front">${captureCageFront()}</div>`);}
 if(journey&&state.campaign.captureStartedAt){journey.style.setProperty('--capture-delay','0ms');const sync=()=>{if(!journey.isConnected)return;journey.getAnimations({subtree:true}).filter(a=>a.animationName?.startsWith('capture-')).forEach(a=>{a.pause();a.currentTime=Math.min(2800,Date.now()-state.campaign.captureStartedAt)});if(!state.campaign.trapRevealDone)captureAnimationFrame=requestAnimationFrame(sync);};sync();}
 if(state.campaign.phase==='trapInspect'&&!state.campaign.trapRevealDone)captureFinishTimer=setTimeout(()=>dispatch({type:'FINISH_TRAP_REVEAL'}),Math.max(0,2800-(Date.now()-(state.campaign.captureStartedAt||Date.now()))));
};
