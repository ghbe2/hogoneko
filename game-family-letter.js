'use strict';
const FAMILY_GIFT_POOL=['food_wet','food_chicken','food_fish','food_soup','clean_paper','clean_wipe','clean_spray','groom_comb','groom_wipe'];
function drawFamilyItem(random=Math.random){return FAMILY_GIFT_POOL[Math.min(FAMILY_GIFT_POOL.length-1,Math.floor(random()*FAMILY_GIFT_POOL.length))];}
function pendingFamilyLetter(state){return state.economy?.familyLetters?.[state.economy?.pendingFamilyLetter]||null;}
function grantFamilyGift(state,letter,bonus=false){const item=bonus?letter.bonusItem:letter.itemId;return {...state,coins:state.coins+letter.coins,inventory:{...state.inventory,[item]:(Number(state.inventory[item])||0)+1},economy:{...state.economy,ledger:[...(state.economy?.ledger||[]),{label:bonus?'家族からのお礼・広告追加':'家族からのお礼',amount:-letter.coins,catId:letter.catId}].slice(-100)}};}
const familyLetterReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='HOME_FROM_ADOPTION'){
  const run=adoptionRunFor(state);if(state.campaign.phase!=='result'||run?.status!=='done')return state;
  const cat=getCat(state),entry=state.album.find(e=>e.catId===cat.id),adopted=entry?.outcome==='adopted',letters={...state.economy?.familyLetters};
  if(adopted&&!letters[cat.id])letters[cat.id]={catId:cat.id,name:cat.name,coins:CARE_BALANCE.familyCoins,itemId:drawFamilyItem(),bonusItem:drawFamilyItem(),claimed:false,bonusClaimed:false};
  const next=familyLetterReducer(state,{type:'NEXT_RESCUE'});
  if(next.campaign.phase!=='room')return state;
  return {...next,economy:{...next.economy,familyLetters:letters,pendingFamilyLetter:null},ui:{...next.ui,modal:null,adoptionRecord:false,familyAd:null}};
 }
 const letter=pendingFamilyLetter(state);
 if(action.type.startsWith('FAMILY_')){
  if(!letter||state.campaign.phase!=='room')return state;
  const update=(next,changes)=>({...next,economy:{...next.economy,familyLetters:{...next.economy.familyLetters,[letter.catId]:{...letter,...changes}}}});
  if(action.type==='FAMILY_CLAIM')return letter.claimed?state:update(grantFamilyGift(state,letter),{claimed:true});
  if(action.type==='FAMILY_AD_START')return !letter.claimed||letter.bonusClaimed||state.ui.familyAd?state:{...state,ui:{...state.ui,familyAd:{token:action.token,catId:letter.catId,startedAt:Date.now()}}};
  if(action.type==='FAMILY_AD_CANCEL')return {...state,ui:{...state.ui,familyAd:null}};
  if(action.type==='FAMILY_AD_COMPLETE'){
   const ad=state.ui.familyAd;if(!letter.claimed||letter.bonusClaimed||!ad||ad.token!==action.token||ad.catId!==letter.catId||Date.now()-ad.startedAt<3200)return state;
   return update({...grantFamilyGift(state,letter,true),ui:{...state.ui,familyAd:null}},{bonusClaimed:true});
  }
  if(action.type==='FAMILY_CLOSE')return state.ui.familyAd?state:{...state,economy:{...state.economy,pendingFamilyLetter:null},ui:{...state.ui,familyLetterOpen:false,alphaMailbox:true}};
  return state;
 }
 // While reading the letter, background clicks and queued care cannot spend items.
 if(letter&&state.campaign.phase==='room'&&!['SYNC_REAL_TIME','CLEAR_REACTION','CLEAR_MESSAGE'].includes(action.type))return state;
 return familyLetterReducer(state,action);
};
fadeActions.add('HOME_FROM_ADOPTION');
// An interrupted mock ad never grants a reward on startup. It can be retried.
gameState={...gameState,ui:{...gameState.ui,familyAd:null}};
const familyNormalize=normalizeLoadedState;
normalizeLoadedState=function(...args){const s=familyNormalize(...args);return s?{...s,ui:{...s.ui,familyAd:null}}:s;};
let familyAdTimer=0,familyInertNodes=[];
const familyLetterRender=render;
render=function(state){
 clearTimeout(familyAdTimer);familyInertNodes.forEach(n=>n.inert=false);familyInertNodes=[];familyLetterRender(state);
 const letter=pendingFamilyLetter(state);if(titleScreenOpen||state.campaign.phase!=='room'||!letter)return;
 if(letter.kind==='return'&&Date.now()-(letter.arrivedAt||0)<1800){familyAdTimer=setTimeout(()=>render(gameState),1800-(Date.now()-letter.arrivedAt));return;}
 const returned=letter.kind==='return',gift=productById(letter.bonusClaimed&&!returned?letter.bonusItem:letter.itemId),busy=!!state.ui.familyAd,overlay=document.createElement('section');overlay.className='family-letter-layer';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',returned?'戻ってきたネコのお土産':'新しい家族からのお礼');
 const art=bookIcons[gift.id]?bookImage(bookIcons[gift.id]):gift.emoji;
 overlay.innerHTML=`<article class="family-letter"><div class="family-postmark" aria-hidden="true">THANK YOU</div><small>新しい家族から、お便りです</small><h2>${surgeryText(letter.name)}の家族より</h2><p>この子と出会わせてくれて、ありがとう。<br>これからの保護活動に、役立ててください。</p><div class="family-gifts ${letter.claimed?'opened':'sealed'}"><div><i class="family-coin" aria-hidden="true">●</i><strong>${letter.coins}<small> コイン</small></strong></div><div><span class="family-item-art">${art}</span><strong>${surgeryText(gift.label)}<small> ×1${gift.category==='food'?'皿分':'回分'}</small></strong></div></div><p class="family-receipt" role="status">${letter.bonusClaimed?'追加の1セットも、受け取りました。':letter.claimed?'お礼を受け取りました。': 'コインと、消耗品を1つお届け。'}</p><div class="family-letter-actions">${!letter.claimed?'<button data-family="claim">プレゼントを開く</button>':busy?'<button disabled>広告の再生中…（モック）</button><button class="secondary" data-family="cancel">中止する</button>':`${letter.bonusClaimed?'<button disabled>追加分も受取済み ✓</button>':'<button data-family="ad">広告を見て、もう1セット</button>'}<button class="secondary" data-family="close">閉じる</button>`}</div><small class="family-ad-note">${busy?'現在は広告の動作確認用です。':letter.claimed&&!letter.bonusClaimed?'追加は今回のお礼につき1回。受け取らず閉じてもOK。':'この子の命がつながったように、次の子の未来にもつながりますように。'}</small></article>`;
 if(returned){overlay.querySelector('.family-postmark').textContent='WELCOME HOME';overlay.querySelector('article>small').textContent='窓の向こうに、見覚えのある姿。';overlay.querySelector('h2').textContent=letter.name+'が帰ってきました';overlay.querySelector('article>p').innerHTML='おかえり。何か持ってきてくれたんだね。<br>小さなお土産が、そっと置かれています。';overlay.querySelector('.family-receipt').textContent=letter.claimed?'お土産を受け取りました。':'コインと、消耗品を１つ持ってきてくれました。';overlay.querySelector('[data-family="claim"]')?.replaceChildren(document.createTextNode('お土産を開く'));overlay.querySelector('.family-letter-actions button:disabled')?.remove();overlay.querySelector('.family-ad-note').textContent='これからは一緒に。保護センターで相談しましょう。';}
 familyInertNodes=[...app.children];familyInertNodes.forEach(n=>n.inert=true);app.append(overlay);
 if(busy){const ad=state.ui.familyAd;familyAdTimer=setTimeout(()=>dispatch({type:'FAMILY_AD_COMPLETE',token:ad.token}),Math.max(0,3200-(Date.now()-ad.startedAt)));}
};
app.addEventListener('click',e=>{const b=e.target.closest('[data-family]');if(!b||b.disabled)return;const type={claim:'FAMILY_CLAIM',ad:'FAMILY_AD_START',cancel:'FAMILY_AD_CANCEL',close:'FAMILY_CLOSE'}[b.dataset.family];if(type)dispatch({type,token:b.dataset.family==='ad'?crypto.randomUUID():undefined});});
