'use strict';
// A single saved graduation transaction, followed by a resumable presentation.
const adoptionBaseReducer=reduceGameState;
function adoptionRunFor(state){const r=state.campaign.adoptionRun,cat=getCat(state);if(r?.catId===cat.id)return r;return state.campaign.phase==='result'&&['adopted','tnr'].includes(cat.status)?{catId:cat.id,status:'done',outcome:cat.status,grade:cat.heart>=80?'high':cat.heart>=CONFIG.graduation.adoptScoreGood?'mid':'low',startedAt:0}:null;}
function adoptionDuration(run){return run.outcome==='adopted'?42:25;}
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
function adoptionScene(state){const template=document.createElement('template');template.innerHTML=ADOPTION_MARKUP;const scene=template.content.firstElementChild;scene.dataset.catId=getCat(state).id;return scene.outerHTML;}
const adoptionPreviousResult=renderResult;
renderResult=function(state,cat){return adoptionRunFor(state)?renderCampaignShell(state,'譲渡会',adoptionScene(state),''):adoptionPreviousResult(state,cat);};

let adoptionView=null;
function createAdoptionView(root){
 const find=id=>root.querySelector('#adoption-'+id),cat=getCat(gameState),dna=phenotypeFor(cat),svg=find('cat');
 const rig=CatSVG.buildCat(svg,'adoption',dna,375,dna.age==='adult'?1.25:1);svg.querySelector('.floor')?.remove();
 const neighbors=[0,1].map(i=>{const basket=root.querySelector('.adoption-basket').cloneNode(true);basket.classList.add('adoption-neighbor',i?'is-right':'is-left');basket.setAttribute('aria-hidden','true');basket.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));basket.querySelector('.adoption-basket-tag')?.remove();const image=basket.querySelector('.adoption-cat svg'),neighborDNA={...CatSVG.sampleDNA(401+i*83),age:'adult',earCut:'none',mood:'neutral'};const neighborRig=CatSVG.buildCat(image,'adoption-neighbor-'+i,neighborDNA,375,1.25);image.querySelector('.floor')?.remove();root.querySelector('.adoption-stage').append(basket);return neighborRig;});
 for(const side of ['left','right']){const table=root.querySelector('.adoption-display').cloneNode(true);table.classList.add('is-neighbor','is-'+side);root.querySelector('.adoption-stage').append(table);}
 const walkers=ADOPTION_COLORS.map((_,i)=>{const n=document.createElement('div');n.className='adoption-person';n.innerHTML=adoptionPerson(i);find('walkway').append(n);return n});
 const family=walkers[4],held=document.createElementNS('http://www.w3.org/2000/svg','g');held.classList.add('adoption-held');held.innerHTML='<path d="M37 104Q22 127 45 144M78 104Q94 127 80 144" fill="none" stroke="'+ADOPTION_COLORS[4]+'" stroke-width="15" stroke-linecap="round"/><svg class="adoption-held-cat" x="23" y="70" width="76" height="78" viewBox="200 55 320 320" preserveAspectRatio="xMidYMax meet"></svg><path d="M44 144Q56 150 67 144M80 143L71 145" fill="none" stroke="#dfbb98" stroke-width="8" stroke-linecap="round"/>';
 (family.querySelector('.adoption-torso > .actor-breath')||family.querySelector('.adoption-torso')).append(held);const heldRig=CatSVG.buildCat(held.querySelector('svg'),'adoption-held',dna,375,dna.age==='adult'?1.25:1);held.querySelector('.floor')?.remove();
 const speech=document.createElement('p');speech.className='adoption-request-speech';speech.style.whiteSpace='pre-line';root.querySelector('.adoption-stage').append(speech);
 return {root,find,rig,heldRig,neighbors,walkers,speech,comment:root.querySelector('.adoption-visitor-comment'),key:null};
}
function adoptionPosition(n,x,stopped,left=false,distance=0,amount=1,lane=0){
 n.style.visibility='visible';n.classList.toggle('adoption-stopped',stopped);n.dataset.stopped=String(stopped);n.style.transform=`translate(${x}px,${lane}px)`;n.style.zIndex=String(30+lane);n.querySelector('.adoption-figure').setAttribute('transform',left?'translate(120 0) scale(-1 1)':'');
 // Facing-local stance moves backward on the ground; the forward return stroke lifts.
 // There are no independent CSS leg timers to drift or restart on a redraw.
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,m=stopped||reduced?0:amount,phase=distance/33*Math.PI;
 for(const [side,hip,offset] of [['a',53,0],['b',67,Math.PI]]){const p=phase+offset,footX=hip+Math.cos(p)*15*m,footY=233-Math.max(0,-Math.sin(p))*8*m,kneeX=(hip+footX)/2+Math.max(0,-Math.sin(p))*8*m;
  n.querySelector('.adoption-leg-'+side+' .adoption-leg-line').setAttribute('d',`M${hip} 154Q${kneeX} 192 ${footX} ${footY}`);
  n.querySelector('.adoption-leg-'+side+' .adoption-shoe').setAttribute('d',`M${footX-8} ${footY-3}h15l8 7q0 4-6 4h-19z`);
 }
 n.querySelector('.adoption-arm').setAttribute('transform',`rotate(${Math.sin(phase)*7*m} 75 101)`);
}
function adoptionShowComment(view,node,text){
 const bubble=view.comment;if(bubble.textContent!==text)bubble.textContent=text;
 const head=node.querySelector('.adoption-head').getBoundingClientRect(),stage=view.root.getBoundingClientRect(),width=bubble.offsetWidth;
 const x=Math.max(12,Math.min(stage.width-width-12,head.left-stage.left+head.width/2-width/2));
 bubble.style.left=x+'px';bubble.style.top=Math.max(12,head.top-stage.top-bubble.offsetHeight-13)+'px';bubble.style.setProperty('--tail',Math.max(14,Math.min(width-23,head.left-stage.left+head.width/2-x))+'px');bubble.classList.add('is-visible');
}
function adoptionVisitors(view,seconds,grade){
 const w=view.find('walkway').clientWidth,sets={high:[0,1,3,4,5],mid:[1,4,5],low:[4]},comments=['こっちを見てくれた。','きれいな毛並みだね。','どんな子なんだろう。','ちょっと、見ていこうか。','この子、気になるなあ。','いい出会いがあるといいね。'];let speaker=null;
 const smooth=p=>p*p*(3-2*p);
 view.walkers.forEach((n,i)=>{const t=seconds-([-1.3,1.5,4.3,7.1,10.5,13.3][i]),left=i%2===1,pw=n.clientWidth,origin=left?w+pw:-pw,end=left?-pw:w+pw,target=w*(left?.87:.13)-pw/2,stop=sets[grade].includes(i),arrive=2.3,pause=2.6,depart=5.5,stopped=stop&&t>=arrive&&t<arrive+pause;
  let x,amount=1;if(!stop){x=origin+(end-origin)*t/8;}else if(t<arrive){const p=Math.max(0,t/arrive);x=origin+(target-origin)*(2*p-p*p);amount=Math.min(1,(1-p)*5);}else if(stopped){x=target;amount=0;}else{const p=Math.min(1,(t-arrive-pause)/depart);x=target+(end-target)*smooth(p);amount=Math.min(1,p*7);}
  adoptionPosition(n,x,stopped,left,Math.abs(x-origin),amount,(i%3)*6-6);if(t<0||t>(stop?arrive+pause+depart:8))n.style.visibility='hidden';
  if(stopped&&t>arrive+.25&&t<arrive+pause-.2)speaker={n,text:comments[i]};
 });
 if(speaker)adoptionShowComment(view,speaker.n,speaker.text);else view.comment.classList.remove('is-visible');
}
function adoptionPhase(run,seconds){if(!run)return 'ready';if(run.status==='done')return 'result';if(seconds<23)return 'walking';if(seconds<25)return 'suspense';if(run.outcome==='tnr')return 'result';if(seconds<28)return 'approach';if(seconds<32)return 'request';if(seconds<34)return 'handover';if(seconds<38)return 'thanks';if(seconds<42)return 'departure';return 'result';}
function paintAdoption(view,time){
 const state=gameState,cat=getCat(state),run=adoptionRunFor(state),seconds=run?Math.max(0,(Date.now()-run.startedAt)/1000):0,phase=adoptionPhase(run,seconds),adopted=run?.outcome==='adopted',name=cat.name||'この子',find=view.find;
 const key=[phase,name,state.coins,isGraduationReady(state)].join('|');
 if(key!==view.key){
  view.key=key;view.root.className='adoption-scene'+(phase==='suspense'?' adoption-suspense':'')+(['request','thanks'].includes(phase)?' adoption-requesting':'')+(['handover','thanks','departure'].includes(phase)||phase==='result'&&adopted?' adoption-handover':'')+(phase==='result'?' adoption-revealed'+(adopted?'':' adoption-tnr'):'');
  view.root.dataset.phase=phase;
  view.root.querySelector('.adoption-basket-tag').textContent=name;
  view.root.querySelector('.adoption-basket').setAttribute('aria-label',`かごの中の${name}`);find('cat').setAttribute('aria-label',name);
  view.speech.textContent=phase==='thanks'?`大切に、一緒に暮らします。\n${name}を育ててくれて、ありがとう。`:`あの……${name}を、\n家族に迎えたいんです。`;
  const ready=isGraduationReady(state);
  let text=['最後の挑戦','この子の、これからへ。',ready?'育ててきた日々を、この出会いへ。\n準備ができたら、譲渡会をはじめよう。':'もう少し、おうちで準備を続けよう。\n体調と手術の記録を確認しましょう。','譲渡会をはじめる','BEGIN_ADOPTION',!ready];
  if(phase==='walking')text=['譲渡会・見守る時間','どんな出会いがあるだろう。','会場を、人が行き交う。\n気づいて、足を止める人もいる。','見守っています','',true];
  if(phase==='suspense')text=['譲渡会・閉会','人の流れが、落ち着いた。','かごの中で、静かに待つこの子。\n今日の出会いは、どうだっただろう。','見守っています','',true];
  if(phase==='approach')text=['譲渡会・帰り際','こちらへ、歩いてくる人。','さっき、足を止めていた人が\nこの子のところへ戻ってきました。','見守っています','',true];
  if(phase==='request')text=['来場者の声','「この子を、家族に。」','かごのそばに、もう一度。\nその人は、あなたに声をかけました。','話を聞いています','',true];
  if(phase==='result')text=['これからの暮らしへ',adopted?'新しい家族と、出発。':'これからの暮らしへ。',adopted?'足を止めてくれた人との出会い。\n大切な命を、新しい家族へ。':'今回は、ご縁がありませんでした。\n元いた街で、この子を見守りましょう。',adopted?'自宅へ帰る':'元いた場所へ戻る','HOME_FROM_ADOPTION',false];
  find('step').textContent=text[0];find('heading').textContent=text[1];find('copy').textContent=text[2];find('copy').style.whiteSpace='pre-line';find('next').textContent=text[3];find('next').dataset.adoptionAction=text[4];find('next').disabled=text[5];
  view.root.querySelector('.adoption-panel').inert=!['ready','result'].includes(phase);
  const secondary=find('secondary');secondary.hidden=phase!=='ready';secondary.disabled=false;secondary.textContent='←';secondary.setAttribute('aria-label','おうちへ戻る');secondary.dataset.adoptionAction='POSTPONE_EVENT';
  find('aside').textContent=phase==='ready'?'育ててきた日々を、この出会いへ。':phase==='result'?(adopted?'「この子と、一緒に暮らしたいです。」':'返したあとも、見守りは続く。'):'';
  find('result-kicker').textContent=adopted?'この出会いが、未来になった':'保護活動の、ひとつの区切り';find('result-word').textContent=adopted?'譲渡成立':'元いた街へ';
 }
 if(phase==='walking')adoptionVisitors(view,seconds,run.grade);
 else {view.comment.classList.remove('is-visible');view.walkers.forEach(n=>n.style.visibility='hidden');if(['approach','request','handover','thanks','departure'].includes(phase)&&adopted){const n=view.walkers[4],w=find('walkway').clientWidth,target=w*.87-n.clientWidth/2,leaving=phase==='departure',p=leaving?Math.min(1,(seconds-38)/4):phase==='approach'?Math.min(1,Math.max(0,(seconds-25)/3)):1,ease=p*p*(3-2*p),origin=leaving?target:w+30,x=leaving?target+(w+n.clientWidth-target)*ease:origin+(target-origin)*ease;adoptionPosition(n,x,!leaving&&p>=1,!leaving,Math.abs(x-origin),leaving?Math.min(1,p*5):Math.min(1,(1-p)*6));}}
 if(['request','thanks'].includes(phase)){const head=view.walkers[4].querySelector('.adoption-head').getBoundingClientRect(),stage=view.root.querySelector('.adoption-stage').getBoundingClientRect();view.speech.style.top=Math.max(8,head.top-stage.top-view.speech.offsetHeight-18)+'px';}
 const carrier=view.walkers[4],carrying=adopted&&['thanks','departure','result'].includes(phase),source=view.root.querySelector('.adoption-basket:not(.adoption-neighbor) .adoption-cat');carrier.classList.toggle('adoption-carrying',carrying);
 source.style.opacity=carrying?'0':'1';source.style.transform='';
 if(phase==='handover'){
  // Nested SVG bounds include invisible rig parts, not just its viewport. Map the
  // shared drawing coordinates instead, so the cat never grows during transfer.
  const p=Math.min(1,Math.max(0,(seconds-32)/2)),ease=p*p*(3-2*p),a=source.querySelector('svg').getScreenCTM(),b=carrier.querySelector('.adoption-held-cat').getScreenCTM(),from=new DOMPoint(360,215).matrixTransform(a),to=new DOMPoint(360,215).matrixTransform(b),scale=Math.hypot(b.a,b.b)/Math.hypot(a.a,a.b);
  source.style.transform=`translate(${(to.x-from.x)*ease}px,${(to.y-from.y)*ease}px) scale(${1+(scale-1)*ease})`;
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,t=reduced?0:time/1000,model=CatSVG.poseModel('sit',t);if(phase==='walking'&&!reduced){model.hr=Math.sin(t*.65)*4;model.hx=Math.sin(t*.65)*5;}if(['approach','request','result'].includes(phase)&&adopted){model.hr=5;model.hx=8;}CatSVG.applyPose(view.rig,model,t,'sit');
 if(run?.status==='playing'&&seconds>=adoptionDuration(run))dispatch({type:'FINISH_ADOPTION'});
 view.neighbors.forEach((rig,i)=>CatSVG.applyPose(rig,CatSVG.poseModel('sit',t+i),t+i,'sit'));
 CatSVG.applyPose(view.heldRig,CatSVG.poseModel('sit',t),t,'sit');
}
const adoptionPreviousRender=render;
render=function(state){const old=adoptionView?.root,motion=storeCaptureMotion(old);adoptionPreviousRender(state);let root=app.querySelector('.adoption-scene');if(root){if(old&&old.dataset.catId===root.dataset.catId){root.replaceWith(old);root=old;storeRestoreMotion(motion);}else adoptionView=createAdoptionView(root);paintAdoption(adoptionView,performance.now());}else adoptionView=null;
 if(adoptionRunFor(gameState)?.status==='playing')app.querySelectorAll('button').forEach(button=>{if(!button.closest('.adoption-scene'))button.disabled=true;});
};
app.addEventListener('click',event=>{const button=event.target.closest('[data-adoption-action]');if(button&&!button.disabled&&button.dataset.adoptionAction)dispatch({type:button.dataset.adoptionAction});});
function adoptionAnimationFrame(time){if(adoptionView?.root.isConnected)paintAdoption(adoptionView,time);requestAnimationFrame(adoptionAnimationFrame);}requestAnimationFrame(adoptionAnimationFrame);
