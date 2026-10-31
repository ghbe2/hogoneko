'use strict';
const CENTER_QUESTIONS={
 taste:[
  ['猫がごはんを食べてくれない','この子の好みに合わないのかも。別のごはんも試してみてね。'],
  ['なでると怒る','まだ触られるのが苦手なのかもしれないよ。あせらず、少しずつ距離を縮めていこう。'],
  ['おもちゃで遊ばない','おもちゃによって反応が違うこともあるよ。いろいろ試してみてね。'],
  ['家具を使ってくれない','家具の置き方を変えてみるのもいいかもしれないね。お気に入りの場所を探してみよう。'],
  ['どうしたら「こころ」が育つの？','猫のお世話を続けることが大切だよ。ごはんや遊びなど、この子が喜ぶことを見つけてあげてね。'],
  ['この子が好きそうなものは？',null]
 ],
 senior:[
  ['猫を保護するには、何が必要？','まずは初診に必要な10コインを用意してね。保護したら、動物病院で健康状態を確認してもらおう。'],
  ['病院でお金が足りなかったら？','足りない分は未払いになるけれど、治療もお世話も続けられるよ。病気やケガがあると、治療費が追加になることもあるからね。'],
  ['どうして不妊去勢手術をするの？','外で暮らす猫が増えすぎないようにするためなの。猫と人が一緒に暮らしていくための、大切な活動なんですよ。'],
  ['耳をカットするのはなぜ？','さくら耳といって、不妊去勢手術を受けた猫の目印です。何度も捕獲される負担を減らすための、大切な印なんですよ。'],
  ['猫を元の場所に戻すのはどうして？','お外で暮らす猫たちはその場所で生活しています。手術をして元の場所に戻し、これ以上子猫が生まれないようにして、今いる猫たちを見守るんだよ。'],
  ['手術はいつ予約できる？',()=>ACTIVITY_DIALOGUE.centerSurgery.copy],
  ['もう1匹迎えられる？',s=>s.flags.returnedCat?ACTIVITY_DIALOGUE.centerMultiple.copy:'複数の猫を同時に迎えると、感染症や相性、お世話の負担が増えることもあります。まずは、いまいる子のお世話を大切にしましょう。']
 ]
};
const centerShop=renderMapShop;
renderMapShop=function(state){
 if(state.campaign.shopId!=='plaza')return centerShop(state).replaceAll('ペットショップ','スーパーホームセンター');
 const cat=getCat(state),ready=cat.status==='raising'&&isGraduationReady(state)&&cat.body.days+1>=carePlan(cat).eventDay;
 return receptionShell(state,'plaza',ACTIVITY_DIALOGUE[cat.heart>=80?'centerHappy':'centerHello'].copy,`<div class="center-menu"><button data-center="senior"><strong>先輩からのアドバイス</strong><span>保護・お世話・病院について</span><b aria-hidden="true">›</b></button><button data-action="go-event" ${ready?'':'disabled'}><strong>譲渡会に申し込む</strong><span>${ready?'このまま会場へご案内します':carePlan(cat).eventDay?carePlan(cat).eventDay+'日目から参加できます':'手術を終えた２日後にご案内'}</span><b aria-hidden="true">›</b></button></div>`,'').replaceAll('ふれあい広場','保護センター');
};
const centerTown=renderTown;renderTown=state=>centerTown(state).replaceAll('ふれあい広場','保護センター').replaceAll('ペットショップ','スーパーホームセンター').replaceAll('まだ早い','調査中').replaceAll('保護に行く','保護しに行く');
const centerReviewReducer=reduceGameState;
reduceGameState=function(state,action){
 if(action.type==='CENTER_REVIEW_OPEN')return {...state,ui:{...state.ui,centerReview:{kind:action.kind,page:0}}};
 const review=state.ui.centerReview;
 if(action.type==='CENTER_REVIEW_CLOSE')return {...state,ui:{...state.ui,centerReview:null}};
 if(review&&action.type==='CENTER_QUESTION')return {...state,ui:{...state.ui,centerReview:{...review,question:action.index,page:0}}};
 if(review&&['CENTER_REVIEW_NEXT','CENTER_REVIEW_BACK'].includes(action.type)){
  const keys=centerReviewPages(review.kind,state),page=review.page+(action.type==='CENTER_REVIEW_NEXT'?1:-1);
  return {...state,ui:{...state.ui,centerReview:page>=keys.length?{kind:review.kind,page:0}:{...review,page:Math.max(0,page)}}};
 }
 const next=centerReviewReducer(state,action);
 return next.campaign.phase!=='shop'||next.campaign.shopId!=='plaza'?{...next,ui:{...next.ui,centerReview:null}}:next;
};
function centerReviewKeys(kind,state){return ['centerRescue','centerRoom','centerHeart','centerSurgery',...(state.flags.returnedCat?['centerMultiple','centerRenovation']:[])];}
function centerReviewPages(kind,state){
 const question=state.ui.centerReview?.question,row=CENTER_QUESTIONS[kind]?.[question];
 if(row){const copy=typeof row[1]==='function'?row[1](state):row[1];return splitGuideText(copy||'',40).map((text,i)=>({key:kind+':'+question+':'+i,text}));}
 return centerReviewKeys(kind,state).flatMap(key=>{
  const sentences=ACTIVITY_DIALOGUE[key].copy.match(/[^。]+。?/g)||[],pages=[];
  for(const sentence of sentences){if(pages.length&&pages[pages.length-1].length+sentence.length<=40)pages[pages.length-1]+=sentence;else pages.push(sentence);}
  return pages.map((text,i)=>({key:`${key}:${i}`,text}));
 });
}
let centerReviewFrame=0;
const centerReviewRender=render;
render=function(state){
 centerReviewRender(state);cancelAnimationFrame(centerReviewFrame);
 const review=state.ui.centerReview;if(!review||titleScreenOpen)return;
 if(review.question===undefined){
  const panel=document.createElement('div');panel.className='center-help modal-layer';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','相談する内容');
  panel.innerHTML=`<section class="center-questions"><h2>${review.kind==='taste'?'この子の好みを相談する':'先輩からのアドバイス'}</h2><div class="center-question-list">${CENTER_QUESTIONS[review.kind].map(([q],i)=>`<button data-center-question="${i}">${q}</button>`).join('')}</div><button data-center-close>受付へ戻る</button></section>`;app.append(panel);return;
 }
 const keys=centerReviewPages(review.kind,state),page=review.page,text=keys[page].text,key='center:'+keys[page].key,panel=document.createElement('div');
 panel.className='center-help modal-layer';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
 panel.setAttribute('aria-label','先輩からのアドバイス');
 panel.innerHTML=`<section class="shared-guide-note senior-review">${seniorDialogueContents('',`<button data-center-next>${page===keys.length-1?'質問へ':'つぎへ'}</button>`)}</section>`;
 app.append(panel);if(!guideSpeechCache.has(key))guideSpeechCache.set(key,performance.now());
 const tick=()=>{if(!panel.isConnected)return;const count=Math.min(text.length,Math.floor((performance.now()-guideSpeechCache.get(key))/18)),ready=count===text.length;panel.querySelector('p').textContent=text.slice(0,count);const button=panel.querySelector('[data-center-next]');button.disabled=!ready;button.classList.toggle('guide-next-ready',ready);if(!ready)centerReviewFrame=requestAnimationFrame(tick);};tick();
};
app.addEventListener('click',e=>{const button=e.target.closest('[data-center]');if(button){for(const {key} of centerReviewPages(button.dataset.center,gameState))guideSpeechCache.delete('center:'+key);dispatch({type:'CENTER_REVIEW_OPEN',kind:button.dataset.center})}if(e.target.closest('[data-center-next]'))dispatch({type:'CENTER_REVIEW_NEXT'});if(e.target.closest('[data-center-back]'))dispatch({type:'CENTER_REVIEW_BACK'});});
app.addEventListener('click',e=>{const q=e.target.closest('[data-center-question]');if(q){for(const key of guideSpeechCache.keys())if(key.startsWith('center:'))guideSpeechCache.delete(key);dispatch({type:'CENTER_QUESTION',index:Number(q.dataset.centerQuestion)});}if(e.target.closest('[data-center-close]'))dispatch({type:'CENTER_REVIEW_CLOSE'});});
