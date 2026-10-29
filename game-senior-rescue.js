'use strict';
// Rescue furniture is separate from purchased furniture and survives save/reload.
const SENIOR_GIFT_ID='senior_mat';
CONFIG.items.push({id:SENIOR_GIFT_ID,label:'先輩のおさがりマット',kind:'placed',zone:'floor',affinityType:'familiar',durability:3,price:0,body:{},rescueOnly:true});
CONFIG.stage1.placedItems.push(SENIOR_GIFT_ID);
CONFIG.stage1.defaultLayout[SENIOR_GIFT_ID]={x:42,y:62,zone:'floor'};
bookIcons[SENIOR_GIFT_ID]=bookIcons.blanket||bookIcons.sunmat||bookIcons.box;
const seniorAffinity=getAffinity;
getAffinity=function(cat,subject){return subject?.id===SENIOR_GIFT_ID&&cat.seniorGift?{kind:'superMatch',score:2,tags:['familiar'],affinityType:'familiar'}:seniorAffinity(cat,subject);};
const seniorComfort=getRoomComfortBreakdown;
getRoomComfortBreakdown=function(s){const r=seniorComfort(s),cat=getCat(s);if(cat.seniorGift&&r.entries.some(e=>e.itemId===SENIOR_GIFT_ID)&&!r.missingEssential.length)return {...r,canExit:true};return r;};
const seniorWear=changeDurability;
changeDurability=function(s,id,n){if(id===SENIOR_GIFT_ID&&n<0&&s.cats.some(c=>c.status==='intake'&&c.seniorGift))return {...s.durability};return seniorWear(s,id,n);};
function seniorCanHelp(s){return s.campaign.phase==='intake'&&!firstActive(s)&&!!getCat(s).seniorHelpUnlocked&&!getCat(s).seniorGift&&!s.campaign.intakeCalled&&!getRoomComfortBreakdown(s).canExit;}
function seniorHintPages(s){
 const cat=getCat(s);if(!['intake','raising','captured'].includes(cat.status))return [{key:'no-cat',text:ACTIVITY_DIALOGUE.seniorTasteEmpty.copy}];
 const groups=[['家具',CONFIG.items.filter(i=>i.kind==='placed'&&!i.essential&&!i.rescueOnly)],['遊び',CONFIG.items.filter(i=>i.kind==='hand')]];
 return groups.flatMap(([label,items],i)=>{const kinds=[...new Set(items.map(x=>x.affinityType).filter(Boolean))];kinds.sort((a,b)=>seniorAffinity(cat,b).score-seniorAffinity(cat,a).score||a.localeCompare(b));const words=kinds.slice(0,3).map(t=>TYPE_LABELS[t]||t).join('・');return ACTIVITY_DIALOGUE.seniorTaste.copy.replace('{分野}',label).replace('{候補}',words).match(/[^。]+。?/g).map((text,j)=>({key:'taste-'+cat.id+'-'+i+'-'+j,text}));});
}
const seniorPages=centerReviewPages;
centerReviewPages=function(kind,s){return kind==='taste'&&s.ui.centerReview?.question===5?seniorHintPages(s):seniorPages(kind,s);};
const seniorReducer=reduceGameState;
reduceGameState=function(s,a){
 const c=getCat(s);
 if(a.type==='CALL_INTAKE_CAT'&&s.campaign.phase==='intake'&&!firstActive(s)&&c.named&&!s.campaign.intakeCalled){
  const next=seniorReducer(s,a);
  if(!next.campaign.intakeCalled)return {...next,cats:next.cats.map(n=>n.id===c.id?{...n,seniorHelpUnlocked:true,seniorPromptDismissed:false}:n)};
  return next;
 }
 if(a.type==='SENIOR_HELP_OPEN'&&seniorCanHelp(s))return {...s,cats:s.cats.map(n=>n.id===c.id?{...n,seniorPromptDismissed:true}:n),ui:{...s.ui,seniorHelp:true,seniorHelpPage:0}};
 if(a.type==='SENIOR_HELP_NEXT'&&s.ui.seniorHelp)return {...s,ui:{...s.ui,seniorHelpPage:(s.ui.seniorHelpPage||0)+1}};
 if(a.type==='SENIOR_HELP_CLOSE')return {...s,ui:{...s.ui,seniorHelp:false}};
 if(a.type==='SENIOR_GIFT'&&s.ui.seniorHelp&&seniorCanHelp(s)&&!c.seniorGift){return {...s,cats:s.cats.map(n=>n.id===c.id?{...n,seniorGift:true}:n),inventory:{...s.inventory,[SENIOR_GIFT_ID]:1},durability:{...s.durability,[SENIOR_GIFT_ID]:3},ui:{...s.ui,seniorHelp:true}};}
 // Recovery rewards are independent of the regular daily reward. Never replay a claim.
 if(a.type==='APP_REWARD_START'&&s.coins<0&&!s.ui.appRewardStarted&&!s.ui.adToken)return {...s,ui:{...s.ui,appRewardStarted:Date.now(),debtReward:true}};
 if(a.type==='APP_REWARD_FINISH'&&s.ui.debtReward&&s.ui.appRewardStarted&&Date.now()-s.ui.appRewardStarted>=3200)return {...s,coins:Math.max(s.coins,5),economy:{...s.economy,adClaims:(s.economy?.adClaims||0)+1},ui:{...s.ui,appRewardStarted:null,debtReward:false}};
 if(a.type==='START_REWARD_AD'&&s.coins<0&&s.ui.modal==='wallet'&&!s.ui.adToken&&!s.ui.appRewardStarted)return {...s,ui:{...s.ui,adToken:a.token,adStartedAt:Date.now(),debtReward:true}};
 if(a.type==='COMPLETE_REWARD_AD'&&s.ui.debtReward&&s.ui.modal==='wallet'&&s.ui.adToken===a.token&&s.ui.adToken&&Date.now()-s.ui.adStartedAt>=3000)return {...s,coins:Math.max(s.coins,5),economy:{...s.economy,adClaims:(s.economy?.adClaims||0)+1},ui:{...s.ui,adToken:null,adStartedAt:null,debtReward:false,adNotice:'未払いを解消し、残高が5コインになりました'}};
 if(a.type==='SENIOR_AD_CANCEL')return {...s,ui:{...s.ui,appRewardStarted:null,debtReward:false}};
 const next=seniorReducer(s,a);
 if(['CANCEL_REWARD_AD','CLOSE_WALLET'].includes(a.type))return {...next,ui:{...next.ui,debtReward:false}};
 return next;
};
const seniorNormalize=normalizeLoadedState;
normalizeLoadedState=function(s){const n=seniorNormalize(s);return {...n,ui:{...n.ui,appRewardStarted:null,debtReward:false,seniorHelp:false}};};
const seniorWallet=renderWallet;
renderWallet=function(s){let html=seniorWallet(s);if(s.coins<0)html=html.replace('data-action="reward-ad" disabled','data-action="reward-ad"').replace(/(data-action="reward-ad"[^>]*>)[^<]*/,'$1広告で未払い解消＋5コイン');return html;};
const seniorIntake=renderIntake;
renderIntake=function(s,c){let html=seniorIntake(s,c);if(seniorCanHelp(s)&&!c.seniorPromptDismissed&&!s.ui.layoutMode&&!s.ui.modal&&!s.ui.firstName&&!s.ui.seniorHelp)html+='<button class="senior-help-trigger" data-senior-help>先輩に相談する</button>';return html;};
const seniorShop=renderMapShop;
renderMapShop=function(s){let html=seniorShop(s);if(s.campaign.shopId==='plaza')html=html.replace('<div class="center-menu">','<div class="center-menu"><button data-center="taste"><strong>この子の好みを相談する</strong><span>好きそうなもののヒント</span><b aria-hidden="true">›</b></button>');return html;};
const seniorRender=render;
render=function(s){seniorRender(s);
 const reward=app.querySelector('[data-app-reward]');if(reward&&(s.coins<0||s.ui.debtReward)){reward.disabled=!!s.ui.appRewardStarted;reward.classList.remove('reward-viewed');reward.innerHTML='広告で未払い解消<br>＋5コイン';}
 if(s.ui.appRewardStarted&&reward){reward.removeAttribute('data-app-reward');reward.dataset.seniorCancel='';reward.disabled=false;reward.innerHTML='広告再生中（モック）<br>中止する';}
 if(!s.ui.seniorHelp||s.campaign.phase!=='intake')return;
 const c=getCat(s),missing=getRoomComfortBreakdown(s).missingEssential.map(id=>getItem(id).label),text=missing.length?ACTIVITY_DIALOGUE.seniorMissing.copy.replace('{家具}',missing.join('・')):ACTIVITY_DIALOGUE[c.seniorGift?'seniorGiftPlace':'seniorGiftOffer'].copy;
 const ready=!c.seniorGift&&!missing.length;const page=s.ui.seniorHelpPage||0;const offer=ready&&page>=2;const words=ready&&page<2?['まだ、少し緊張しているみたいですね。急がなくても大丈夫。一緒に、お部屋を見てみましょう。','落ち着ける場所を探しているのかもしれませんね。うちで使っていたマットがあるので、試してみませんか。'][page]:text;
 const panel=document.createElement('div');panel.className='center-help modal-layer';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','先輩に相談');panel.innerHTML=`${offer?'<button class="senior-dialog-close" data-senior-close aria-label="相談を閉じる">×</button>':''}<section class="shared-guide-note senior-review">${seniorDialogueContents(words,ready&&page<2?'<button data-senior-next>つぎへ</button>':offer?'<button data-senior-gift>受け取る</button>':'<button data-senior-close>閉じる</button>')}</section>`;app.append(panel);
};
app.addEventListener('click',e=>{if(e.target.closest('[data-senior-next]'))dispatch({type:'SENIOR_HELP_NEXT'});if(e.target.closest('[data-senior-help]'))dispatch({type:'SENIOR_HELP_OPEN'});if(e.target.closest('[data-senior-close]'))dispatch({type:'SENIOR_HELP_CLOSE'});if(e.target.closest('[data-senior-gift]'))dispatch({type:'SENIOR_GIFT'});if(e.target.closest('[data-senior-cancel]'))dispatch({type:'SENIOR_AD_CANCEL'});});
