'use strict';
// A single saved graduation transaction, followed by a resumable presentation.
const adoptionBaseReducer=reduceGameState;
function adoptionRunFor(state){const r=state.campaign.adoptionRun,cat=getCat(state);if(r?.catId===cat.id)return r;return state.campaign.phase==='result'&&['adopted','tnr'].includes(cat.status)?{catId:cat.id,status:'done',outcome:cat.status,grade:cat.heart>=80?'high':cat.heart>=CONFIG.graduation.adoptScoreGood?'mid':'low',startedAt:0}:null;}
function adoptionDuration(run){return run.outcome==='adopted'?33:25;}
reduceGameState=function(state,action){
 const run=adoptionRunFor(state),cat=getCat(state);
 if(run?.status==='playing'){
  if(action.type==='FINISH_ADOPTION'&&Date.now()-run.startedAt>=adoptionDuration(run)*1000)return {...state,campaign:{...state.campaign,phase:'result',adoptionRun:{...run,status:'done'}},ui:{...state.ui,modal:null}};
  return state;
 }
 if(['BEGIN_ADOPTION','SEND_EVENT'].includes(action.type)){
  if(state.campaign.phase!=='graduation'||cat.status!=='raising'||!isGraduationReady(state))return state;
  // Entering the event fulfils the visit; it must not be redirected by the clock wrapper.
  const entered={...state,cats:state.cats.map(c=>c.id===cat.id?{...c,eventVisitDay:c.body.days+1}:c),campaign:{...state.campaign,requiredVisit:null}};
  const next=adoptionBaseReducer(entered,{type:'SEND_EVENT'});
  if(next.campaign.phase!=='result'||next.album.length!==state.album.length+1)return next;
  return {...next,campaign:{...next.campaign,phase:'graduation',adoptionRun:{version:1,catId:cat.id,status:'playing',startedAt:Date.now(),outcome:next.campaign.outcome,grade:cat.heart>=80?'high':cat.heart>=CONFIG.graduation.adoptScoreGood?'mid':'low'}},ui:{...next.ui,modal:null,adoptionRecord:false}};
 }
 if(action.type==='ADOPTION_RECORD')return run?.status==='done'?{...state,ui:{...state.ui,adoptionRecord:true}}:state;
 if(action.type==='FINISH_ADOPTION')return state;
 const next=adoptionBaseReducer(state,action);
 return action.type==='NEXT_RESCUE'&&next!==state?{...next,campaign:{...next.campaign,adoptionRun:null},ui:{...next.ui,adoptionRecord:false}}:next;
};
function adoptionScene(state){const template=document.createElement('template');template.innerHTML=ADOPTION_MARKUP;const scene=template.content.firstElementChild;scene.dataset.catId=getCat(state).id;scene.append(scene.querySelector('#adoption-secondary'));return scene.outerHTML;}
const adoptionPreviousResult=renderResult;
renderResult=function(state,cat){return adoptionRunFor(state)?renderCampaignShell(state,'譲渡会',adoptionScene(state),''):adoptionPreviousResult(state,cat);};

let adoptionView=null;
function createAdoptionView(root){
 const find=id=>root.querySelector('#adoption-'+id),cat=getCat(gameState),dna=phenotypeFor(cat),svg=find('cat');
 const rig=CatSVG.buildCat(svg,'adoption',dna,375,dna.age==='adult'?1.25:1);svg.querySelector('.floor')?.remove();
 const walkers=ADOPTION_COLORS.map((_,i)=>{const n=document.createElement('div');n.className='adoption-person';n.innerHTML=adoptionPerson(i);find('walkway').append(n);return n});
 const speech=document.createElement('p');speech.className='adoption-request-speech';speech.style.whiteSpace='pre-line';root.querySelector('.adoption-stage').append(speech);
 return {root,find,rig,walkers,speech,key:null};
}
function adoptionPosition(n,x,stopped,left=false){n.style.visibility='visible';n.classList.toggle('adoption-stopped',stopped);n.dataset.stopped=String(stopped);n.style.transform=`translateX(${x}px)`;n.querySelector('.adoption-figure').setAttribute('transform',left?'translate(120 0) scale(-1 1)':'');}
function adoptionVisitors(view,seconds,grade){
 const w=view.find('walkway').clientWidth,sets={high:[0,1,3,4,5],mid:[1,4,5],low:[4]};
 view.walkers.forEach((n,i)=>{const t=seconds-i*2.6,left=i%2===1,pw=n.clientWidth,speed=(w+200)/6.4,target=left?w-pw-8:8,origin=left?w+100:-100,at=Math.abs(target-origin)/speed,stop=sets[grade].includes(i),pause=stop?2.8:0,stopped=stop&&t>=at&&t<at+pause,travel=stopped?at:t>=at+pause?t-pause:t;
  adoptionPosition(n,origin+(left?-1:1)*speed*travel,stopped,left);if(t<0||t>6.4+pause)n.style.visibility='hidden';
 });
}
function adoptionPhase(run,seconds){if(!run)return 'ready';if(run.status==='done')return 'result';if(seconds<23)return 'walking';if(seconds<25)return 'suspense';if(run.outcome==='tnr')return 'result';if(seconds<28)return 'approach';if(seconds<33)return 'request';return 'result';}
function paintAdoption(view,time){
 const state=gameState,cat=getCat(state),run=adoptionRunFor(state),seconds=run?Math.max(0,(Date.now()-run.startedAt)/1000):0,phase=adoptionPhase(run,seconds),record=phase==='result'&&state.ui.adoptionRecord,adopted=run?.outcome==='adopted',name=cat.name||'この子',find=view.find;
 const key=[phase,record,name,state.coins,isGraduationReady(state)].join('|');
 if(key!==view.key){
  view.key=key;view.root.className='adoption-scene'+(phase==='suspense'?' adoption-suspense':'')+(phase==='request'?' adoption-requesting':'')+(phase==='result'?' adoption-revealed'+(adopted?'':' adoption-tnr'):'')+(record?' adoption-record':'');
  view.root.dataset.phase=record?'record':phase;
  view.root.querySelector('.adoption-basket-tag').textContent=name;
  view.root.querySelector('.adoption-basket').setAttribute('aria-label',`かごの中の${name}`);find('cat').setAttribute('aria-label',name);
  view.speech.textContent=`あの……${name}を、\n家族に迎えたいんです。`;
  const ready=isGraduationReady(state),cost=RELEASE_ECONOMY.graduation;
  let text=['最後の挑戦','この子の、これからへ。',ready?'育ててきた日々を、この出会いへ。\n準備ができたら、譲渡会をはじめよう。':'もう少し、おうちで準備を続けよう。\n体調と手術の記録は病院で確認できます。',`譲渡会をはじめる · ${cost} コイン`,'BEGIN_ADOPTION',!ready];
  if(phase==='walking')text=['譲渡会・見守る時間','どんな出会いがあるだろう。','会場を、人が行き交う。\n気づいて、足を止める人もいる。','見守っています','',true];
  if(phase==='suspense')text=['譲渡会・閉会','人の流れが、落ち着いた。','かごの中で、静かに待つこの子。\n今日の出会いは、どうだっただろう。','見守っています','',true];
  if(phase==='approach')text=['譲渡会・帰り際','こちらへ、歩いてくる人。','さっき、足を止めていた人が\nこの子のところへ戻ってきました。','見守っています','',true];
  if(phase==='request')text=['来場者の声','「この子を、家族に。」','かごのそばに、もう一度。\nその人は、あなたに声をかけました。','話を聞いています','',true];
  if(phase==='result')text=['結果発表',adopted?'新しい家族ができました。':'元いた街へ、返そう。',adopted?'立ち止まった人との、小さな出会い。\n家族へつなぐことができました。':'今回は、ご縁にはつながりませんでした。\n元いた場所へ返し、これからも見守ります。','活動の記録へ','ADOPTION_RECORD',false];
  if(record)text=['活動の記録',adopted?'家族へつないだ命。':'守って、街へ返した命。',`${stageName(cat.rescueArea||state.campaign.area||'a1')}で保護 → 育成 → ${adopted?'譲渡成立':'TNR'}\nこの子の姿を、記録に残しました。`,'次の保護の準備へ','PREPARE_NEXT',false];
  find('step').textContent=text[0];find('heading').textContent=text[1];find('copy').textContent=text[2];find('copy').style.whiteSpace='pre-line';find('next').textContent=text[3];find('next').dataset.adoptionAction=text[4];find('next').disabled=text[5];
  const secondary=find('secondary');secondary.hidden=phase!=='ready'&&!record;secondary.disabled=false;secondary.textContent=record?'育成の記録':'← おうちへ';secondary.dataset.adoptionAction=record?'OPEN_FAREWELL':'POSTPONE_EVENT';
  find('aside').textContent=phase==='ready'?'育ててきた日々を、この出会いへ。':phase==='result'?(adopted?'「この子と、一緒に暮らしたいです。」':'返したあとも、見守りは続く。'):'';
  find('result-kicker').textContent=adopted?'この出会いが、未来になった':'保護活動の、ひとつの区切り';find('result-word').textContent=adopted?'譲渡成立':'元いた街へ';
 }
 if(phase==='walking')adoptionVisitors(view,seconds,run.grade);
 else {view.walkers.forEach(n=>n.style.visibility='hidden');if(['approach','request','result'].includes(phase)&&adopted){const n=view.walkers[4],w=find('walkway').clientWidth,p=phase==='approach'?Math.min(1,Math.max(0,(seconds-25)/3)):1,ease=p*p*(3-2*p);adoptionPosition(n,w+30+(w-n.clientWidth-8-w-30)*ease,p>=1,true);}}
 if(phase==='request'){const head=view.walkers[4].querySelector('.adoption-head').getBoundingClientRect(),stage=view.root.querySelector('.adoption-stage').getBoundingClientRect();view.speech.style.top=Math.max(8,head.top-stage.top-view.speech.offsetHeight-18)+'px';}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:time/1000,model=CatSVG.poseModel('sit',t);if(phase==='walking'&&!reduced){model.hr=Math.sin(t*.65)*4;model.hx=Math.sin(t*.65)*5;}if(['approach','request','result'].includes(phase)&&adopted){model.hr=5;model.hx=8;}CatSVG.applyPose(view.rig,model,t,'sit');
 if(run?.status==='playing'&&seconds>=adoptionDuration(run))dispatch({type:'FINISH_ADOPTION'});
}
const adoptionPreviousRender=render;
render=function(state){const old=adoptionView?.root,motion=storeCaptureMotion(old);adoptionPreviousRender(state);let root=app.querySelector('.adoption-scene');if(root){if(old&&old.dataset.catId===root.dataset.catId){root.replaceWith(old);root=old;storeRestoreMotion(motion);}else adoptionView=createAdoptionView(root);paintAdoption(adoptionView,performance.now());}else adoptionView=null;
 if(adoptionRunFor(gameState)?.status==='playing')app.querySelectorAll('button').forEach(button=>{if(!button.closest('.adoption-scene'))button.disabled=true;});
};
app.addEventListener('click',event=>{const button=event.target.closest('[data-adoption-action]');if(button&&!button.disabled&&button.dataset.adoptionAction)dispatch({type:button.dataset.adoptionAction});});
function adoptionAnimationFrame(time){if(adoptionView?.root.isConnected)paintAdoption(adoptionView,time);requestAnimationFrame(adoptionAnimationFrame);}requestAnimationFrame(adoptionAnimationFrame);
