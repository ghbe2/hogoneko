'use strict';
// The approved window return sequence uses the player's room and returning cat.
window.HouseholdReturn=(()=>{
 let active=false,stage,world,bg,returning,modeToken=0,model={};
 function mount(state,forceNight=false){
  if(active||titleScreenOpen||state.campaign.phase!=='room'||state.ui.modal||!state.household?.pendingReturn||residentCats(state).length>=2)return;
  stage=app.querySelector('.stage');world=stage?.querySelector('[data-room-world]');if(!world)return;
  returning=state.household.pendingReturn;bg=world.style.backgroundImage;
  if(!bg||!bg.includes('svg'))return;
  active=true;app.classList.add('household-cinema');modeToken++;model={};stage.classList.add('household-returning');prepareReturn(forceNight);
 }
 function prepareReturn(forceNight=false){
  const original=world,ns='http://www.w3.org/2000/svg';
  const xml=decodeURIComponent(bg.slice(bg.indexOf(',')+1).replace(/["']?\)$/,''));
  const svg=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;svg.classList.add('hh-return-room');svg.setAttribute('preserveAspectRatio','none');original.style.backgroundImage='none';original.prepend(svg);
  const win=svg.querySelector('[data-room-window]'),outside=win.querySelector('#outside'),closed=win.querySelector('#closed-curtains'),open=win.querySelector('#open-curtains');
  const night=forceNight||closed.style.display!=='none';model.returnNight=night;closed.style.display=night?'':'none';open.style.display=night?'none':'';
  // Keep a clean, closed-window room before adding any return-scene parts.
  const normalRoomBackground='url("'+bookURI(new XMLSerializer().serializeToString(svg))+'")';
  const cross=[...win.children].find(n=>n.tagName.toLowerCase()==='path'&&n.getAttribute('d')?.startsWith('M193 86'));cross?.remove();
  const sash=document.createElementNS(ns,'g');sash.classList.add('hh-sashes');sash.setAttribute('clip-path','url(#window-view)');sash.innerHTML='<g class="hh-sash-left"><path d="M101 93H199V315H101ZM101 215H199" fill="none" stroke="#f6edda" stroke-width="7"/></g><g class="hh-sash-right"><path d="M199 93H298V315H199ZM199 215H298" fill="none" stroke="#f6edda" stroke-width="7"/></g>';outside.after(sash);
  const moving=night?closed:sash;moving.classList.add(night?'hh-curtain-rustle':'hh-sash-rattle');
  const b=document.createElement('button');b.className='hh-window';b.setAttribute('aria-label',night?'揺れているカーテンを確かめる':'揺れている窓を確かめる');stage.append(b);
  requestAnimationFrame(()=>{if(!b.isConnected)return;const r=win.getBoundingClientRect(),s=stage.getBoundingClientRect();Object.assign(b.style,{left:r.left-s.left+'px',top:r.top-s.top+'px',width:r.width+'px',height:r.height+'px'});});
  model.returnPhase='waiting';
  b.onclick=()=>{
   if(model.returnPhase!=='waiting')return;model.returnPhase='approach';b.remove();moving.classList.remove('hh-curtain-rustle','hh-sash-rattle');
   const token=modeToken,s=stage.getBoundingClientRect(),r=win.getBoundingClientRect(),x=r.left-s.left+r.width/2,y=r.top-s.top+r.height/2;
   world.style.transformOrigin=x+'px '+y+'px';const zoom=`translate(${s.width/2-x}px,${s.height*.40-y}px) scale(2.1)`;
   const camera=world.animate([{transform:'translate(0,0) scale(1)'},{transform:zoom}],{duration:1200,easing:'cubic-bezier(.3,0,.2,1)',fill:'forwards'});
   const holder=document.createElementNS(ns,'g');holder.classList.add('hh-outside-cat');holder.style.opacity='0';holder.innerHTML=renderCatArt(returning);outside.append(holder);
   const catSvg=holder.querySelector('svg');catSvg.setAttribute('x','100');catSvg.setAttribute('y','95');catSvg.setAttribute('width','155');catSvg.setAttribute('height','225');catSvg.setAttribute('viewBox','175 25 370 375');catSvg.style.overflow='hidden';mountGameCats();catSvg.dataset.staticPhoto='true';const rig=svgRigs.get(catSvg).rig;CatSVG.applyPose(rig,CatSVG.poseModel('sit',0),0,'sit');
   if(night)outside.style.filter='brightness(.72)';
   holder.animate([{opacity:0},{opacity:1}],{duration:1000,delay:3000,fill:'both'});
   const cinema=document.createElement('section');cinema.className='hh-entry-cinema';cinema.setAttribute('aria-label',returning.name+'との再会');cinema.innerHTML='<div class="hh-entry-dark"></div><div class="hh-entry-eyes"></div>';stage.append(cinema);
   const start=performance.now();let opening=false,openAt=0,flight=null,flightStart=null,back=null,eyesPlaced=false,announced=false,lastScratch=null,openFrom=null,curtainsOpened=false;
   const ease=u=>{u=Math.max(0,Math.min(1,u));return u*u*(3-2*u)};
   function scratch(t){
    const u=t%4.6,m=CatSVG.poseModel('sit',0);let lift=u<.35?ease(u/.35):u<1.25?1:u<1.65?1-ease((u-1.25)/.4):0;
    const stroke=u>=.35&&u<1.25?(1-Math.cos((u-.35)/.3*Math.PI*2))/2:0;
    m.legs[1]=[-19,-110,-19-48*lift,(-145+23*stroke)*lift];
    m.hr=lift?-3:Math.sin(Math.max(0,u-1.65)*1.8)*2;m.hx=lift?-2:0;
    m.hy=-195;m.tr=3+Math.sin(t*.7)*3;m.headTurn=1;
    model.returnGesture=lift>.9?'scratch':lift>0?'paw-moving':u<3?'look':'wait';
    return m;
   }
   const finish=()=>{flight?.remove();camera.cancel();back?.cancel();world.style.transformOrigin='';world.style.transform='';model.returnPhase='landed';const landed=document.createElement('div');landed.className='cat-object household-arrived-cat';landed.style.cssText='left:45%;top:70%;transform:translate(-50%,-50%) scale(.65)';landed.innerHTML=renderCatArt(returning);world.append(landed);mountGameCats();cinema.innerHTML=`<div class="hh-entry-welcome"><p>おかえり、${surgeryText(returning.name)}。</p><button>おかえり</button></div>`;cinema.querySelector('button').onclick=()=>{
    if(model.returnPhase!=='landed')return;model.returnPhase='transition';cinema.querySelector('button').disabled=true;
    const curtain=document.createElement('div');curtain.className='hh-return-reset';curtain.setAttribute('aria-label','部屋へ戻っています');stage.append(curtain);
    const fade=curtain.animate([{opacity:0},{opacity:1}],{duration:180,fill:'forwards'});
    fade.finished.then(()=>{if(token!==modeToken||!curtain.isConnected)return;active=false;app.classList.remove('household-cinema');dispatch({type:'HOUSEHOLD_RETURN'});app.querySelector('.stage')?.append(curtain);return curtain.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'}).finished;}).then(()=>{if(token===modeToken)model.returnPhase='accepted';}).catch(()=>{}).finally(()=>curtain.remove());
   };};
   function confirmWelcome(openWindow){
    if(cinema.querySelector('.hh-welcome-confirm'))return;
    const panel=document.createElement('section');panel.className='hh-welcome-confirm';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','迎え入れる前の確認');cinema.append(panel);
    const show=step=>{panel.innerHTML=`<small>${step+1} / 2</small><p>${step===0?'迎え入れると、この子の譲渡や地域へのリリースはできなくなります。最後まで飼う覚悟はありますか？':'これから新しく保護猫を迎えると、2匹のお世話になります。部屋が手狭になり、ごはん代なども多くかかります。育てづらくなりますが、迎え入れますか？'}</p><button data-welcome-yes>${step===0?'最後まで飼う':'それでも窓を開ける'}</button><button data-welcome-no>地域に帰す</button>`;
     panel.querySelector('[data-welcome-yes]').onclick=()=>step===0?show(1):(panel.remove(),openWindow());
     panel.querySelector('[data-welcome-no]').onclick=()=>{modeToken++;camera.cancel();active=false;app.classList.remove('household-cinema');dispatch({type:'HOUSEHOLD_DECLINE'});};
    };show(0);
   }
   function tick(now){if(token!==modeToken||!cinema.isConnected)return;const elapsed=now-start;
    if(!opening){model.returnPhase=elapsed<1300?'approach':elapsed<1700?'dark':elapsed<3000?'eyes':elapsed<4100?'reveal':'outside';}
    // Change curtain state only behind the fully opaque blackout; never overlap
    // the open and closed fabrics during the camera approach.
    if(night&&elapsed>=1700&&!curtainsOpened){curtainsOpened=true;closed.style.display='none';open.style.display='';}
    if(elapsed>=1300&&!eyesPlaced){eyesPlaced=true;const base=stage.getBoundingClientRect(),eyeBox=cinema.querySelector('.hh-entry-eyes'),copy=actualEyes(catSvg),outer=document.createElementNS(ns,'svg'),g=document.createElementNS(ns,'g'),m=catSvg.getScreenCTM();outer.setAttribute('viewBox','0 0 '+base.width+' '+base.height);outer.setAttribute('preserveAspectRatio','none');g.setAttribute('data-eye-matrix','');g.setAttribute('transform','matrix('+[m.a,m.b,m.c,m.d,m.e-base.left,m.f-base.top].join(' ')+')');while(copy.firstChild)g.append(copy.firstChild);outer.append(g);eyeBox.append(outer);Object.assign(eyeBox.style,{inset:'0',width:'100%',height:'100%'});}
    if(!opening&&elapsed>4100&&!announced){announced=true;cinema.insertAdjacentHTML('beforeend',`<div class="hh-return-announcement"><p>${surgeryText(returning.name)}が帰ってきた！</p><button class="hh-open-window" disabled>窓を開ける</button></div>`);cinema.querySelector('button').onclick=()=>confirmWelcome(()=>{if(opening)return;opening=true;openAt=performance.now();openFrom=lastScratch||CatSVG.poseModel('sit',0);model.returnPhase='opening';model.returnGesture='withdrawing';cinema.replaceChildren();sash.querySelector('.hh-sash-left').animate([{transform:'translateX(0)'},{transform:'translateX(-98px)'}],{duration:650,delay:240,fill:'forwards',easing:'ease-in-out'});sash.querySelector('.hh-sash-right').animate([{transform:'translateX(0)'},{transform:'translateX(98px)'}],{duration:650,delay:240,fill:'forwards',easing:'ease-in-out'});});}
    if(!opening&&elapsed>5100){const t=(elapsed-5100)/1000;lastScratch=scratch(t);CatSVG.applyPose(rig,lastScratch,t,'sit');if(elapsed>5700)cinema.querySelector('button').disabled=false;}
    if(opening&&!flight){const m=CatSVG.mixModel(openFrom,CatSVG.poseModel('sit',0),ease((now-openAt)/220));CatSVG.applyPose(rig,m,0,'sit');}
    if(opening&&now-openAt>=930&&!flight){model.returnPhase='jump';model.returnGesture=null;const a=catSvg.getBoundingClientRect(),base=stage.getBoundingClientRect();flight=document.createElement('div');flight.className='hh-entry-flight';Object.assign(flight.style,{left:a.left-base.left+'px',top:a.top-base.top+'px',width:a.width+'px',height:a.height+'px'});catSvg.removeAttribute('x');catSvg.removeAttribute('y');catSvg.setAttribute('width','100%');catSvg.setAttribute('height','100%');flight.append(catSvg);holder.remove();cinema.append(flight);flightStart=now;
     const end={left:stage.clientWidth*(.45-.29/2),top:stage.clientHeight*(.70-.29),width:stage.clientWidth*.29,height:stage.clientHeight*.29};const begin={left:a.left-base.left,top:a.top-base.top,width:a.width,height:a.height};
     const mid={left:(begin.left+end.left)/2,top:Math.min(begin.top,end.top)-stage.clientHeight*.09,width:(begin.width+end.width)/2,height:(begin.height+end.height)/2};flight.animate([begin,mid,end].map(frame=>Object.fromEntries(Object.entries(frame).map(([k,v])=>[k,v+'px']))),{duration:1150,easing:'linear',fill:'forwards'});
     back=world.animate([{transform:zoom},{transform:'translate(0,0) scale(1)'}],{duration:1150,fill:'forwards',easing:'ease-in-out'});
    }
    if(flight){const u=Math.min(1,(now-flightStart)/1150),sit=CatSVG.poseModel('sit',0),hop=structuredClone(sit);Object.assign(hop,{by:-92,bh:.80,hy:-164,hr:0,hx:0,yaw:0,headTurn:1,tx:36,ty:-48,tr:-18});hop.legs=[[-31,-44,-30,-42],[-19,-110,-29,12],[32,-42,31,-42],[18,-108,29,12]];const strength=ease(u/.18)*(1-ease((u-.73)/.27));const m=CatSVG.mixModel(sit,hop,strength);m.lift=0;catSvg.dataset.catDirection='left';CatSVG.applyPose(rig,m,0,'sit');if(u===1){finish();return;}}
    requestAnimationFrame(tick);
   }requestAnimationFrame(tick);
  };
 }
 return {mount,cancel(){active=false;modeToken++;app.classList.remove('household-cinema');},snapshot:()=>structuredClone(model),get active(){return active}};
})();
