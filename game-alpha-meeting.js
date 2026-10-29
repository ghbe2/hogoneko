'use strict';
// Alpha meeting: progress-aware messages and daily center visits.
const ALPHA_DAY=()=>{const d=new Date(gameNow());return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;};
const PAW_COIN='<svg class="paw-coin" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#d5a744" stroke="#936a2b" stroke-width="2"/><circle cx="20" cy="20" r="14" fill="none" stroke="#f5d67f"/><g fill="#fff0bd"><ellipse cx="12" cy="16" rx="3" ry="4" transform="rotate(-25 12 16)"/><ellipse cx="19" cy="12" rx="3" ry="4"/><ellipse cx="27" cy="15" rx="3" ry="4" transform="rotate(25 27 15)"/><path d="M12 27Q10 23 15 21Q20 15 25 21Q31 24 27 28Q23 30 20 28Q15 30 12 27Z"/></g></svg>';
// Separate worn copies must never lower the durability of a purchased item.
for(const item of [...CONFIG.items].filter(i=>['placed','hand'].includes(i.kind)&&i.affinityType&&!i.essential&&!i.rescueOnly&&!i.unlimited)){
 const id='alpha_used_'+item.id;CONFIG.items.push({...item,id,label:item.label+'（おさがり）',durability:3,price:0,rescueOnly:true,wornFrom:item.id});
 bookIcons[id]=bookIcons[item.id];if(typeof TOY_EMOJI!=='undefined')TOY_EMOJI[id]=TOY_EMOJI[item.id];if(typeof TOOL_META!=='undefined'&&TOOL_META[item.id])TOOL_META[id]={...TOOL_META[item.id],label:item.label+'（おさがり）'};
 CONFIG.stage1[item.kind==='placed'?'placedItems':'handItems'].push(id);if(item.kind==='placed'){CONFIG.stage1.defaultLayout[id]={...CONFIG.stage1.defaultLayout[item.id]};FURNITURE_REACTIONS[id]=FURNITURE_REACTIONS[item.id]||'sit';}
}
for(const [source,type,label] of [[SENIOR_GIFT_ID,'familiar','なじみの形のマット'],['feather','first','変わった形のじゃらし']]){const base=getItem(source),id='alpha_used_'+type;CONFIG.items.push({...base,id,affinityType:type,label:label+'（おさがり）',wornFrom:source,durability:3,price:0,rescueOnly:true});bookIcons[id]=bookIcons[source];CONFIG.stage1[base.kind==='placed'?'placedItems':'handItems'].push(id);if(base.kind==='placed'){CONFIG.stage1.defaultLayout[id]={...CONFIG.stage1.defaultLayout[source]};FURNITURE_REACTIONS[id]='knead';}else{TOY_EMOJI[id]=TOY_EMOJI[source];TOOL_META[id]={...TOOL_META[source],label};}}
const alphaFurnitureHeight=furnitureHeight;furnitureHeight=id=>alphaFurnitureHeight(getItem(id)?.wornFrom||id);
function alphaFirst(s){return s.alpha?.firstCatId===getCat(s).id;}
function alphaGoal(s){
 const c=getCat(s),p=carePlan(c),day=c.body.days+1;if(c.status!=='raising'||c.permanentResident)return null;
 if(c.surgery?.status==='done'){const left=Math.max(0,p.eventDay-day);return {key:'event',text:left?`譲渡会まで あと ${left} 日`:'今日は譲渡会。保護センターへ',days:left,action:'alpha-event'};}
 if(p.surgeryDay)return {key:'surgery',text:p.surgeryDay===day?'今日は手術。動物病院へ':'明日は手術。ごはんはお休み',action:p.surgeryDay===day?'alpha-clinic':'alpha-app'};
 if(surgeryEligibility(s).canBook)return {key:'ready',text:'準備が整いました。手術を予約しよう',action:'alpha-app'};
 return {key:'weight',text:c.body.weight<2000?`目標 2,000g · あと ${Math.ceil(2000-c.body.weight)}g`:!careReady(c)?'体調を整えて、手術に備えよう':`おうちで慣れる時間を。手術は${earliestSurgeryDay(c)}日目から`,action:'alpha-app'};
}
// Read receipts and completed actions are deliberately separate, including old saves.
function alphaPracticeTask(s){
 if(!alphaFirst(s)||getCat(s).status!=='raising'||getCat(s).permanentResident)return null;
 const c=getCat(s),seen=s.alpha?.seen||{},done=s.alpha?.practice||{},p=carePlan(c),day=c.body.days+1;
 if(c.surgery?.status==='done'&&day>=p.eventDay||p.surgeryDay===day||seen.ready&&surgeryEligibility(s).canBook)return null;
 if(seen.food&&(!done.food||!done.water)&&c.body.surgeryFoodStored===undefined)return {key:'food',part:!done.food?'food':'water'};
 if(seen.taste&&!done.taste)return {key:'taste'};
 if(seen.reward&&!done.reward)return {key:'reward'};
 return null;
}
function alphaPracticeProgress(before,s,a){
 if(!alphaFirst(s)||getCat(s).id!==getCat(before).id)return s;
 const done={...s.alpha?.practice},seen=s.alpha?.seen||{},c=getCat(s);
 if(seen.food){if(c.body.foodLevel>0)done.food=true;if(c.body.waterLevel>0)done.water=true;}
 if(s.alpha?.taste?.catId===c.id&&s.alpha.taste.claimed)done.taste=true;
 // Closing the app is an explicit, valid alternative to viewing an optional ad.
 if(seen.reward&&a.type==='CLOSE_MODAL'&&before.ui.modal==='notebook')done.reward=true;
 if(seen.reward&&s.economy?.appRewardDay===ALPHA_DAY())done.reward=true;
 return {...s,alpha:{...s.alpha,practice:done}};
}
function alphaLesson(s){
 if(!alphaFirst(s)||s.campaign.phase!=='room'||getCat(s).status!=='raising'||s.onboarding.homeTour!=='done'||s.ui.modal||s.ui.layoutMode||pendingFamilyLetter(s))return null;
 const c=getCat(s),day=c.body.days+1,p=carePlan(c),seen=s.alpha?.seen||{};
 const cancelled=p.lastCancellation&&c.lifeLog?.filter(x=>x.kind==='appointment-cancelled').length;
 if(cancelled&&!seen['cancelled:'+cancelled])return ['cancelled:'+cancelled,true,'message',p.lastCancellation+' お水とごはんで体調を整えてから、スマホで予約し直しましょう。',null];
 const candidates=[
 ['event:'+p.eventDay,c.surgery?.status==='done'&&day>=p.eventDay,'visit','今日が譲渡会ですね。一緒に保護センターへ行きましょう。','alpha-event'],
 ['surgery:'+p.surgeryDay,c.surgery?.status!=='done'&&p.surgeryDay===day,'visit','迎えに来ました。今日は予約した手術の日ですね。体重と体調を確認して、動物病院へ行きましょう。','alpha-clinic'],
 ['eve:'+p.eventDay,c.surgery?.status==='done'&&day===p.eventDay-1,'message','明日は譲渡会です。今日はおうちでゆっくり過ごして、明日に備えましょう。',null],
 ['ready',surgeryEligibility(s).canBook,'visit','そろそろかなと思って、様子を見に来ました。しっかり大きくなっていますね。スマホから明日の手術を予約しましょう。予約すると、ごはんはお休みになりますよ。','alpha-app'],
 ['reward',day>=3,'message','スマホのミャオペイでは、広告を見てコインを受け取れます。お世話の助けにしてくださいね。広告を見るかは、自分で選べますよ。今回は見ない場合は、アプリを閉じて戻って大丈夫です。','alpha-app'],
 ['taste',day>=2,'message','保護センターで、この子の好みを一緒に探してみませんか。人に慣れるほど、譲渡会でご縁につながるかもしれません。ご縁がなければ、元いた場所へ戻して見守ります。','alpha-center'],
 ['food',day>=1&&c.body.surgeryFoodStored===undefined,'message','ごはんとお水を用意しましょう。お水は欠かさないようにね。好きなごはんはよく食べて、体重も増えやすくなりますよ。',null]
 ];
 const urgent=candidates.slice(0,4).find(([key,ok])=>ok&&!seen[key]);
 if(urgent)return urgent;
 if(alphaPracticeTask(s))return null;
 return ['food','taste','reward'].map(key=>candidates.find(c=>c[0]===key)).find(([key,ok])=>ok&&!seen[key]&&s.alpha?.lastMessageDay!==ALPHA_DAY());
}
function alphaTasteOptions(s){
 const c=getCat(s),items=CONFIG.items.filter(i=>i.wornFrom&&i.affinityType);
 const candidates=items.map(i=>({id:i.id,score:getAffinity(c,i).score,type:i.affinityType}));
 return [1,0,-1].map(sign=>{const matching=candidates.filter(i=>Math.sign(i.score)===sign);return matching.length?matching[Math.floor((c.seed||c.phenotype?.seed||0)+Number(ALPHA_DAY().split('-').at(-1)))%matching.length]:null;}).filter(Boolean);
}
const alphaReduce=reduceGameState;
reduceGameState=function(s,a){
 if(a.type==='ALPHA_NOTICE_NEXT'){const notice=s.ui.alphaNotice;if(!notice)return s;const pages=splitGuideText(notice.text,42);if((notice.page||0)+1<pages.length)return {...s,ui:{...s.ui,alphaNotice:{...notice,page:(notice.page||0)+1}}};const seen={...s.alpha?.seen,[notice.key]:true};let n={...s,alpha:{...s.alpha,seen,lastMessageDay:ALPHA_DAY()},ui:{...s.ui,alphaNotice:null}};n=alphaPracticeProgress(s,n,a);if(notice.action)n=reduceGameState(n,{type:'ALPHA_ROUTE',route:notice.action});return n;}
 if(a.type==='ALPHA_ROUTE'){const route=a.route;if(route==='alpha-practice'){const task=alphaPracticeTask(s);if(task?.key==='taste')return reduceGameState(s,{type:'ALPHA_ROUTE',route:'alpha-center'});if(task?.key==='reward')return alphaReduce(s,{type:'OPEN_NOTEBOOK'});return alphaReduce(s,{type:'CLOSE_MODAL'});}if(route==='alpha-app')return alphaReduce(s,{type:'OPEN_NOTEBOOK'});if(['alpha-clinic','alpha-center','alpha-event'].includes(route)){let n=alphaReduce(s,{type:'OPEN_OUTING'});return {...n,ui:{...n.ui,alphaDestination:route==='alpha-clinic'?'clinic':'event'}};}return s;}
 if(a.type==='ALPHA_TASTE_OPEN'){if(!['raising','intake'].includes(getCat(s).status))return {...s,ui:{...s.ui,alphaNotice:{key:'no-cat',kind:'message',text:'この子を迎えたら、一緒に好みを探しましょう。'}}};const old=s.alpha?.taste;const taste=old?.day===ALPHA_DAY()&&old.catId===getCat(s).id?old:{day:ALPHA_DAY(),catId:getCat(s).id,options:alphaTasteOptions(s),claimed:!!(old?.day===ALPHA_DAY()&&old.claimed)};return {...s,alpha:{...s.alpha,taste},ui:{...s.ui,centerReview:null,alphaTasteStarted:Date.now()}};}
 if(a.type==='ALPHA_TASTE_CLOSE')return {...s,ui:{...s.ui,alphaTasteStarted:null,alphaGift:null}};
 if(a.type==='ALPHA_TASTE_CLAIM'){const t=s.alpha?.taste;if(!t||t.day!==ALPHA_DAY()||t.claimed||!s.ui.alphaTasteStarted||Date.now()-s.ui.alphaTasteStarted<3500||t.catId!==getCat(s).id||!t.options.some(o=>o.id===a.itemId))return s;const item=getItem(a.itemId),n=Number(s.inventory[a.itemId])||0;return {...s,inventory:{...s.inventory,[a.itemId]:n+1},durability:{...s.durability,[a.itemId]:n?getDurability(s,a.itemId):Math.min(3,item.durability||3)},alpha:{...s.alpha,practice:{...s.alpha?.practice,taste:true},taste:{...t,claimed:true,chosen:a.itemId}},ui:{...s.ui,alphaGift:{itemId:a.itemId,at:Date.now()}}};}
 if(a.type==='ALPHA_ALBUM_DONE')return {...s,alpha:{...s.alpha,showAlbumHint:true},ui:{...s.ui,alphaAlbumPrompt:false,modal:'notebook'}};
 let n=alphaReduce(s,a);
 // A map cue belongs to the current trip, not every later outing.
 if(s.campaign.phase==='town'&&n.campaign.phase!=='town'&&n.ui.alphaDestination)n={...n,ui:{...n.ui,alphaDestination:null}};
 const beforeCat=getCat(s),afterCat=getCat(n);if(beforeCat.id===afterCat.id){const seen={...afterCat.alphaMessSeen};for(const [pose,key] of [['poop','litter'],['vomit','vomit']]){if(!afterCat.body[key])seen[pose]=0;else if(n.campaign.phase==='room'&&s.campaign.phase==='room'&&!s.ui.modal&&!s.ui.layoutMode&&afterCat.body[key]>beforeCat.body[key])seen[pose]=afterCat.body[key];}n={...n,cats:n.cats.map(c=>c.id===afterCat.id?{...c,alphaMessSeen:seen}:c)};}
 if(!n.alpha?.firstCatId&&getCat(n).status==='raising'&&!(n.album||[]).length)n={...n,alpha:{...n.alpha,firstCatId:getCat(n).id,seen:{}}};
 if(s.coins>=0&&n.coins<0&&(n.campaign.shopId==='clinic'||['clinic','surgery'].includes(n.campaign.phase)))n={...n,ui:{...n.ui,alphaNotice:{key:'debt',kind:'reception',text:'足りない医療費は未払いとして、お預かりします。治療もお世話も続けられますよ。これから受け取るコインで、自動的に未払いが減ります。お支払いのための来院は不要です。残高がマイナスの間は、スマホで広告を見て5コインまで戻すこともできます。残高が足りるまで、お買い物はお休みになります。'}}};
 if(n.ui.alphaNotice?.key==='debt'&&getCat(n).surgery?.status==='in_progress')n={...n,ui:{...n.ui,alphaPendingDebt:n.ui.alphaNotice,alphaNotice:null}};
 if(n.ui.alphaPendingDebt&&getCat(n).surgery?.status!=='in_progress')n={...n,ui:{...n.ui,alphaNotice:n.ui.alphaPendingDebt,alphaPendingDebt:null}};
 if(a.type==='FAMILY_CLOSE'&&pendingFamilyLetter(s)&&!pendingFamilyLetter(n))n={...n,ui:{...n.ui,alphaAlbumPrompt:true,alphaGift:null}};
 if(['FAMILY_CLAIM','FAMILY_AD_COMPLETE'].includes(a.type)&&n!==s&&n.coins>s.coins)n={...n,ui:{...n.ui,alphaGift:{coins:true,itemId:pendingFamilyLetter(n)?.[a.type==='FAMILY_CLAIM'?'itemId':'bonusItem'],at:Date.now()}}};
 if(a.type==='NEXT_RESCUE'||(getCat(n).id!==getCat(s).id&&(n.album||[]).length))n={...n,onboarding:{...n.onboarding,status:'done',homeTour:'done',appIntro:null,guide:null,farewellSeen:true}};
 n=alphaPracticeProgress(s,n,a);
 const lesson=alphaLesson(n);if(lesson&&!n.ui.alphaNotice)n={...n,ui:{...n.ui,alphaNotice:{key:lesson[0],kind:lesson[2],text:lesson[3],action:lesson[4],page:0}}};
 return n;
};
// Retain the delayed fallback only when buying a suitable furnishing is unaffordable.
const alphaCanHelp=seniorCanHelp;
seniorCanHelp=s=>alphaCanHelp(s)&&!!getCat(s).alphaLayoutTried&&s.coins<alphaFurnitureCost(s);
function alphaFurnitureCost(s){const prices=CONFIG.items.filter(p=>p.kind==='placed'&&!p.essential&&!p.rescueOnly&&(!s.inventory[p.id]||getDurability(s,p.id)<=0)&&getAffinity(getCat(s),p).score>0).map(p=>productById(p.id)?.price).filter(Number.isFinite)||[];return prices.length?Math.min(...prices):Infinity;}
const alphaHelpReduce=reduceGameState;
reduceGameState=function(s,a){let n=alphaHelpReduce(s,a);if(s.campaign.phase==='intake'&&s.ui.layoutMode&&!n.ui.layoutMode)n={...n,cats:n.cats.map(c=>c.id===getCat(n).id?{...c,alphaLayoutTried:true}:c)};return n;};
let alphaTimer=0,alphaRoomPrevious=null,alphaTownShown=null;
const alphaRender=render;
render=function(s){
 clearTimeout(alphaTimer);alphaRender(s);if(titleScreenOpen)return;
 const cat=getCat(s),stage=app.querySelector('.stage');
 app.querySelectorAll('[data-layout-item]').forEach(n=>{const base=getItem(n.dataset.layoutItem)?.wornFrom;if(base)n.classList.add('item-'+base)});
 app.querySelectorAll('.clinic-commands').forEach(n=>{n.classList.add('center-menu');n.querySelectorAll('.clinic-icon').forEach(i=>i.remove());n.querySelectorAll('button').forEach(b=>{if(!b.querySelector('b'))b.insertAdjacentHTML('beforeend','<b aria-hidden="true">›</b>');});});
 const coin=app.querySelector('.discovery-pickup span');if(coin){coin.innerHTML=PAW_COIN;coin.classList.add('alpha-coin');}
 const pay=app.querySelector('.app-pay strong');if(pay&&!pay.querySelector('.paw-coin'))pay.innerHTML=pay.innerHTML.replace('●',PAW_COIN);
 const intake=s.campaign.phase==='intake';if(intake){const call=app.querySelector('.intake-footer-call');if(call&&cat.named){call.classList.add('alpha-intake-call');call.innerHTML=RoomControlArt.call;call.setAttribute('aria-label','名前を呼ぶ');}if(cat.alphaLayoutTried&&cat.seniorHelpUnlocked&&!cat.seniorGift&&!s.ui.layoutMode&&!s.ui.modal&&s.coins>=alphaFurnitureCost(s)&&!s.campaign.intakeCalled){const n=document.createElement('button');n.className='alpha-buy-furniture';n.dataset.alphaRoute='alpha-center-shop';n.textContent='家具を買い足しにいこう';stage?.append(n);}}
 if(s.ui.layoutMode){const storage=app.querySelector('.layout-store-target'),add=app.querySelector('.layout-workbar [data-action="toggle-layout-tray"]');if(storage&&add&&storage.offsetParent){const r=add.getBoundingClientRect(),p=storage.offsetParent.getBoundingClientRect();Object.assign(storage.style,{left:r.left-p.left+'px',top:r.top-p.top+'px',bottom:'auto',width:r.width+'px',height:r.height+'px',transform:'none'});}}
 if(s.campaign.phase==='room'&&!s.ui.modal&&!s.ui.layoutMode&&cat.status==='raising'){app.querySelector('.room-care-status')?.remove();const goal=alphaGoal(s);if(goal){const n=document.createElement('button');n.className='room-care-status alpha-goal';n.dataset.alphaRoute=goal.action;n.innerHTML=goal.days>0?`譲渡会まで あと <b class="day-leaf">${goal.days}</b> 日`:goal.text;stage?.append(n);}if(!s.ui.alphaNotice&&!pendingFamilyLetter(s)&&s.onboarding.homeTour==='done'){const rewards=document.createElement('div');rewards.className='alpha-rewards';if(s.economy?.appRewardDay!==appRewardDay())rewards.innerHTML+='<button data-alpha-route="alpha-app" aria-label="ミャオペイの今日の報酬">'+PAW_COIN+'<i></i></button>';if(s.alpha?.taste?.day!==ALPHA_DAY()||!s.alpha.taste.claimed)rewards.innerHTML+='<button data-alpha-route="alpha-center" aria-label="保護センターのおさがり">✉<i></i></button>';stage?.append(rewards);}}
 if(s.campaign.phase!=='town')alphaTownShown=null;
 if(s.campaign.phase==='town'&&s.ui.alphaDestination){const target=app.querySelector('.town-destination.'+s.ui.alphaDestination);if(target){const scroll=app.querySelector('.town-map-scroll');if(scroll&&alphaTownShown!==s.ui.alphaDestination){const t=target.getBoundingClientRect(),r=scroll.getBoundingClientRect();scroll.scrollTop=Math.max(0,Math.min(scroll.scrollHeight-scroll.clientHeight,scroll.scrollTop+t.top-r.top-scroll.clientHeight*.5+t.height*.5));alphaTownShown=s.ui.alphaDestination;}target.classList.add('alpha-destination');const n=document.createElement('div');n.className='alpha-town-cue';n.innerHTML=guideHand();Object.assign(n.style,{left:'65%',top:'55%'});target.append(n);}}
 if(alphaFirst(s)&&s.alpha?.seen?.ready&&surgeryEligibility(s).canBook&&s.ui.modal==='notebook'&&!s.ui.careBookingOpen){const reserve=app.querySelector('[data-action="book-surgery"]');if(reserve){reserve.classList.add('alpha-reserve-target');reserve.insertAdjacentHTML('beforeend','<span class="alpha-reserve-cue">'+guideHand()+'</span>');}}


 if(alphaFirst(s)&&!s.ui.alphaNotice&&s.campaign.phase==='shop'){
  const selector=s.campaign.shopId==='clinic'&&s.alpha?.seen?.['surgery:'+carePlan(cat).surgeryDay]?(cat.surgery?.status==='done'?'[data-action="leave-surgery-clinic"]':app.querySelector('[data-action="start-surgery"]')?'[data-action="start-surgery"]':'[data-action="go-surgery"]'):s.campaign.shopId==='plaza'&&s.alpha?.seen?.['event:'+carePlan(cat).eventDay]?'[data-action="go-event"]':null;
  const target=selector&&app.querySelector(selector);if(target&&!target.disabled){target.classList.add('alpha-reserve-target');target.insertAdjacentHTML('beforeend','<span class="alpha-reserve-cue">'+guideHand()+'</span>');}
 }
 if(s.ui.alphaAlbumPrompt===false&&s.ui.modal==='notebook'&&s.alpha?.showAlbumHint){const album=app.querySelector('.home-phone [data-action="open-album"]');album?.classList.add('alpha-destination');}
 if(s.ui.alphaTasteStarted){const t=s.alpha?.taste,elapsed=Date.now()-s.ui.alphaTasteStarted,box=document.createElement('section');box.className='alpha-layer alpha-taste';box.setAttribute('role','dialog');box.innerHTML=`<article><h2>この子を、よく見てみましょう</h2><div class="alpha-observe">${seniorArt()}<div>${renderCatArt(cat)}</div></div>${elapsed<3500?'<p>目の動きや、しぐさを見ています…</p>':`<p>${t.claimed?'今日のおさがりは受け取りました。':'こんなものはどうかしら。傷みやすいおさがりですが、1つ選んで試してみてね。'}</p><div class="alpha-taste-options">${t.options.map(o=>{const i=getItem(o.id);return `<button data-alpha-gift="${i.id}" ${t.claimed?'disabled':''}>${bookIcons[i.id]?bookImage(bookIcons[i.id]):''}<strong>${surgeryText(i.label)}</strong><span>${o.score>0?'好きかもしれない':o.score<0?'苦手かもしれない':'ふつうの反応かも'}</span></button>`}).join('')}</div>`}<button data-alpha-taste-close>受付へ戻る</button></article>`;app.append(box);mountGameCats();if(elapsed<3500)alphaTimer=setTimeout(()=>render(gameState),3500-elapsed);}
 if(s.ui.alphaNotice){const n=s.ui.alphaNotice,pages=splitGuideText(n.text,42),box=document.createElement('section');box.className='alpha-layer alpha-notice '+n.kind;box.setAttribute('role','dialog');box.innerHTML=`<article>${n.kind==='visit'?'<div class="alpha-visitor">'+seniorArt()+'</div>':''}<h2>${n.kind==='reception'?'病院の受付より':n.kind==='visit'?'せんぱいが訪ねてきました':'せんぱいからのメッセージ'}</h2><p>${pages[n.page||0]}</p><button data-alpha-notice-next>${(n.page||0)<pages.length-1?'つぎへ':n.action?'確認しよう':'閉じる'}</button></article>`;app.append(box);}
 if(s.ui.alphaAlbumPrompt){const n=document.createElement('section');n.className='alpha-layer alpha-notice';n.innerHTML='<article><h2>思い出は、アルバムに</h2><p>'+ (cat.permanentResident?'スマホのアルバムから、この子との思い出を見られます。これからも、一緒の時間を重ねていきましょう。':'スマホのアルバムから、あの子の写真を見られます。次の出会いまで、お部屋でひと息つきましょう。')+'</p><button data-alpha-album>アプリを開く</button></article>';app.append(n);}
 const gift=s.ui.alphaGift;if(gift&&Date.now()-gift.at<2200){const n=document.createElement('div');n.className='alpha-gift-reveal';n.style.animationDelay=-(Date.now()-gift.at)+'ms';n.innerHTML=`<div class="gift-box">${furnitureStorageArt()}</div><div class="gift-prize">${gift.coins?PAW_COIN:''}${bookIcons[gift.itemId]?bookImage(bookIcons[gift.itemId]):''}</div>`;app.append(n);alphaTimer=setTimeout(()=>n.remove(),Math.max(0,2200-(Date.now()-gift.at)));}
 app.querySelectorAll('.family-ad-note').forEach(n=>n.remove());
 const entering=alphaRoomPrevious!=='room'&&s.campaign.phase==='room';alphaRoomPrevious=s.campaign.phase;
 if(s.campaign.phase==='room'&&cat.status==='raising'&&!s.ui.modal&&!s.ui.layoutMode&&!s.ui.alphaNotice&&!currentLifeCue()){
  const pending=['poop','vomit'].filter(p=>{const count=cat.body[p==='poop'?'litter':'vomit'];return count>0&&count>(Number(cat.alphaMessSeen?.[p])||0)});
  if(pending.length){const now=Date.now(),point=getCatPoint(s);cat.alphaMessSeen={...cat.alphaMessSeen};catLifeCues=pending.map((pose,i)=>{cat.alphaMessSeen[pose]=cat.body[pose==='poop'?'litter':'vomit'];const started=now+700+i*3700;return {catId:cat.id,pose,point:pose==='poop'?{...point,...getPlacedPoint(s,'litter',point)}:point,started,reveal:started+1800,until:started+3400,previous:0};});catLifeCues.forEach(scheduleLifeCueRefresh);saveGameState(s);for(const pending of catLifeCues){const node=app.querySelector(pending.pose==='vomit'?'.mess-object':'.book-litter-mark');if(node)node.style.visibility='hidden';}}
 }
 renderAlphaPractice(s);
};
window.addEventListener('click',e=>{
 if(e.target.closest('[data-center="taste"]')){e.preventDefault();e.stopImmediatePropagation();dispatch({type:'ALPHA_TASTE_OPEN'});return;}
 const route=e.target.closest('[data-alpha-route]');if(route){if(route.dataset.alphaRoute==='alpha-center-shop')dispatch({type:'OPEN_OUTING'});else dispatch({type:'ALPHA_ROUTE',route:route.dataset.alphaRoute});}
 if(e.target.closest('[data-alpha-notice-next]'))dispatch({type:'ALPHA_NOTICE_NEXT'});
 if(e.target.closest('[data-alpha-taste-close]'))dispatch({type:'ALPHA_TASTE_CLOSE'});
 const gift=e.target.closest('[data-alpha-gift]');if(gift&&!gift.disabled)dispatch({type:'ALPHA_TASTE_CLAIM',itemId:gift.dataset.alphaGift});
 if(e.target.closest('[data-alpha-album]'))dispatch({type:'ALPHA_ALBUM_DONE'});
},true);

const alphaNormalize=normalizeLoadedState;
normalizeLoadedState=function(s){const n=alphaNormalize(s);if(!n)return n;return {...n,ui:{...n.ui,alphaTasteStarted:null,alphaGift:null,alphaNotice:null,alphaAlbumPrompt:false}};};

gameState=reduceGameState({...gameState,ui:{...gameState.ui,alphaTasteStarted:null,alphaGift:null}},{type:'ALPHA_BOOT'});

for(const type of ['pointerdown','click','keydown'])window.addEventListener(type,e=>{if(e.target.closest('[data-alpha-report],.alpha-report,.alpha-layer'))return;if(app.querySelector('.alpha-layer')){e.preventDefault();e.stopImmediatePropagation();}},true);


function renderAlphaPractice(s){
 if(titleScreenOpen||s.ui.alphaNotice||s.ui.layoutMode||s.ui.alphaTasteStarted||s.ui.alphaAlbumPrompt||s.onboarding.homeTour!=='done')return;
 const task=alphaPracticeTask(s);if(!task)return;
 const phase=s.campaign.phase;
 let selector=null,text='';
 if(task.key==='food'){
  text=task.part==='food'?'ごはん皿をタップして、ごはんを用意しよう':'水入れをタップして、お水を用意しよう';
  if(phase==='room'&&!s.ui.modal)selector=task.part==='food'?'.placed-item.item-bowl':'.placed-item.item-water';
 }else if(task.key==='taste'){
  text='保護センターで好みを相談し、おさがりを選ぼう';
  selector=phase==='room'&&!s.ui.modal?'.room-travel-icon':phase==='town'?'.town-destination.event':phase==='shop'&&s.campaign.shopId==='plaza'?'[data-center="taste"]':null;
 }else{
  text='スマホでミャオペイを確認しよう（広告は任意）';
  selector=s.ui.modal==='notebook'?'[data-app-reward]':phase==='room'&&!s.ui.modal?'[data-action="open-notebook"]':null;
 }
 const goal=app.querySelector('.alpha-goal');if(goal&&!carePlan(getCat(s)).surgeryDay&&getCat(s).surgery?.status!=='done'){goal.textContent=text;goal.dataset.alphaRoute='alpha-practice';}
 const target=selector&&app.querySelector(selector);if(!target||target.disabled||target.getBoundingClientRect().width===0)return;
 // Preserve the established destination cue; never stack two hands on one target.
 if(target.querySelector('.guide-gesture'))return;
 if(task.key!=='food')target.classList.add('alpha-practice-target');
 const cue=document.createElement('span');cue.className='alpha-practice-cue';cue.dataset.lesson=task.key;cue.innerHTML=guideHand();app.append(cue);
 const a=app.getBoundingClientRect(),r=target.getBoundingClientRect();
 const x=task.key==='food'?r.left-a.left+r.width/2-22:r.right-a.left-28;
 const y=task.key==='food'?r.top-a.top+r.height/2-20:r.top-a.top+r.height*.6;
 Object.assign(cue.style,{left:Math.max(4,Math.min(a.width-52,x))+'px',top:Math.max(4,Math.min(a.height-66,y))+'px'});
}
