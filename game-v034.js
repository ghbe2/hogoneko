'use strict';
// AND-combined, data-driven unlock rules. Mountain never has a completion percentage.
const STAGE_RULES={
 a1:{total:8,previous:null,percent:0,adoptions:0},
 a2:{total:12,previous:'a1',percent:100,adoptions:0},
 a3:{total:16,previous:'a2',percent:100,adoptions:0},
 a4:{total:null,previous:'a3',percent:100,adoptions:0}
};
for(const area of CONFIG.town.areas)if(STAGE_RULES[area.id])area.totalCats=STAGE_RULES[area.id].total;
function stageRecords(state){const seen=new Set();return state.album.filter(e=>{if(!['adopted','tnr'].includes(e.outcome)||seen.has(e.catId))return false;seen.add(e.catId);return true;});}
function stageProgress(state,id){const rule=STAGE_RULES[id];if(!rule)return null;const done=stageRecords(state).filter(e=>(e.area||'a1')===id).length;return {done,total:rule.total,remaining:rule.total===null?null:Math.max(0,rule.total-done),percent:rule.total===null?null:Math.min(100,done/rule.total*100)};}
function stageAccess(state,id){
 const rule=STAGE_RULES[id];if(!rule)return {unlocked:false};
 const previous=rule.previous?stageProgress(state,rule.previous):null,adoptions=stageRecords(state).filter(e=>e.outcome==='adopted').length;
 return {unlocked:(!previous||previous.percent>=rule.percent)&&adoptions>=rule.adoptions,previous,adoptions,rule};
}
function stageName(id){return CONFIG.town.areas.find(a=>a.id===id)?.label||id;}
parkUnlocked=state=>stageAccess(state,'a2').unlocked;
function canStartStage(state,id){return getCat(state).status==='candidate'&&!state.campaign.requiredVisit&&stageAccess(state,id).unlocked&&stageProgress(state,id)?.remaining!==0;}
const beforeStageReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='CHOOSE_AREA')return !STAGE_RULES[action.area]||state.campaign.requiredVisit?state:{...state,ui:{...state.ui,modal:'stageGate',stageChoice:action.area}};
 if(['ENTER_STAGE','ENTER_PARK'].includes(action.type)){
  const id=action.type==='ENTER_PARK'?'a2':state.ui.stageChoice;
  if(state.ui.modal!=='stageGate'||!canStartStage(state,id))return state;
  // Enter through the existing field reducer without the old first-area shortcut.
  return beforeAreaReducer({...state,campaign:{...state.campaign,area:id}},{type:'GO_RESCUE'});
 }
 if(action.type==='GO_RESCUE'&&!canStartStage(state,'a1'))return {...state,ui:{...state.ui,modal:'stageGate',stageChoice:'a1'}};
 if(action.type==='OPEN_TRAP'&&!canStartStage(state,state.campaign.area||'a1'))return {...state,ui:{...state.ui,modal:'stageGate',stageChoice:state.campaign.area||'a1'}};
 return beforeStageReducer(state,action);
};
const beforeStageTown=renderTown;
renderTown=function(state){
 const t=document.createElement('template');t.innerHTML=beforeStageTown(state);
 for(const [id,cls] of [['a1','field'],['a2','park'],['a3','alley'],['a4','mountain']]){
  const old=t.content.querySelector('.book-map-hotspot.'+cls);if(!old)continue;
  const p=stageProgress(state,id),access=stageAccess(state,id),node=document.createElement('button');node.className=old.className;node.dataset.action='choose-area';node.dataset.area=id;node.disabled=!!state.campaign.requiredVisit;
  node.innerHTML=`<strong>${stageName(id)}</strong><small>${access.unlocked?(p.total===null?'無制限':`${Math.min(p.done,p.total)}/${p.total}匹・${Math.floor(p.percent)}%`):'🔒 解放条件'}</small>`;old.replaceWith(node);
 }
 return t.innerHTML;
};
const beforeStageField=renderField;
renderField=function(state){const html=beforeStageField(state),id=state.campaign.area||'a1';return html.replace(/(<span class="place-chip">)(空き地|公園)(<\/span>)/,`$1${stageName(id)}$3`);};
const beforeStageResult=renderResult;
renderResult=function(state,cat){
 const t=document.createElement('template');t.innerHTML=beforeStageResult(state,cat);t.content.querySelectorAll('.area-unlock-note').forEach(n=>n.remove());
 const id=cat.rescueArea||state.campaign.area||'a1',p=stageProgress(state,id),copy=t.content.querySelector('.result-copy');
 if(copy){const note=document.createElement('small');note.className='area-unlock-note';note.textContent=p.total===null?`${stageName(id)}で${p.done}匹を見送りました`:`${stageName(id)} ${Math.min(p.done,p.total)}/${p.total}匹・${Math.floor(p.percent)}%`;
 const previous={...state,album:state.album.slice(0,-1)},newAreas=Object.keys(STAGE_RULES).filter(key=>!stageAccess(previous,key).unlocked&&stageAccess(state,key).unlocked);
 if(newAreas.length)note.textContent+=' ／ '+newAreas.map(stageName).join('・')+'が解放';copy.append(note);}
 if(state.campaign.outcome==='tnr'){const lead=copy?.querySelector('p');if(lead)lead.textContent=`${cat.name}は、見守られている${stageName(id)}へ戻ります。これもひとつの卒業です。`;const chip=t.content.querySelector('.place-chip');if(chip)chip.textContent=stageName(id);}
 return t.innerHTML;
};
function renderStageGate(state){
 const id=state.ui.stageChoice,access=stageAccess(state,id),p=stageProgress(state,id);if(!p)return '';
 const row=(label,text,ok)=>`<div class="stage-rule"><span>${ok?'✓':'○'} ${label}</span><strong>${text}</strong></div>`;
 const checks=(access.previous?row(stageName(access.rule.previous),`${Math.floor(access.previous.percent)}% / 必要${access.rule.percent}%`,access.previous.percent>=access.rule.percent):'')+(access.rule.adoptions?row('累計の譲渡',`${access.adoptions}回 / 必要${access.rule.adoptions}回`,access.adoptions>=access.rule.adoptions):'');
 const busy=getCat(state).status!=='candidate',finished=p.remaining===0;
 const text=!access.unlocked?'条件をすべて満たすと、保護に行けます。':finished?'このエリアのネコは、全頭を見送りました。':busy?'今いるネコを見送ってから、次の保護へ。':id==='a2'?'子猫のケア。680gから手術の目標700gへ。':id==='a4'?'ここからは頭数の上限なし。何度でも保護を続けられます。':'部屋と道具を引き継いで、次の出会いへ。';
 return `<div class="release-overlay" role="dialog" aria-modal="true" aria-label="エリアの解放条件"><section class="release-sheet stage-gate"><header><small>ステージ${id.slice(1)}</small><h2>${stageName(id)}</h2></header><div class="stage-total">${p.total===null?'∞ 無制限':`${Math.min(p.done,p.total)} / ${p.total}匹`}<small>${p.total===null?`${p.done}匹を見送りました`:`達成率 ${Math.floor(p.percent)}%・残り${p.remaining}匹`}</small></div>${checks?`<div class="stage-checks">${checks}</div>`:''}<p>${text}</p>${canStartStage(state,id)?`<button class="campaign-button" data-action="enter-stage">${stageName(id)}で保護する</button>`:''}<button class="campaign-button secondary" data-action="close-modal">戻る</button></section></div>`;
}
const beforeStageRender=render;
render=function(state){beforeStageRender(state);if(state.ui.modal==='stageGate')app.insertAdjacentHTML('beforeend',renderStageGate(state));};
app.addEventListener('click',event=>{if(event.target.closest('[data-action]')?.dataset.action==='enter-stage')dispatch({type:'ENTER_STAGE'});});
const stageStyle=document.createElement('style');stageStyle.textContent=`.stage-gate{text-align:center;gap:14px}.stage-gate header{padding:0}.stage-total{padding:18px;background:#e3ead8;border-radius:16px;font-size:28px}.stage-total small{display:block;font-size:12px;margin-top:6px}.stage-rule{display:flex;justify-content:space-between;gap:8px;padding:10px 0;font-size:12px;border-bottom:1px solid #dfd5c6}.stage-gate p{font-size:14px;line-height:1.7;margin:0}@media(max-height:650px){.stage-gate{gap:10px}.stage-total{padding:14px}}`;document.head.append(stageStyle);
