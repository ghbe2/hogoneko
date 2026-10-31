'use strict';
const entries=[];
const parse=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content.querySelector('svg')};
const ns='http://www.w3.org/2000/svg';
function isolated(html,selector){const full=parse(html),part=full.querySelector(selector);part.removeAttribute('transform');const svg=document.createElementNS(ns,'svg');svg.append(part);return svg;}
entries.push({name:'保護主のせんぱい',svg:parse(faceArt(faces[1])),head:'.senior-head',note:'採用した先輩・髪留めと外はね'});
for(const [kind,name]of [['clinic','病院の受付'],['doctor','獣医師'],['plaza','保護センターの受付']]){const svg=isolated(receptionArt(kind),'.reception-staff');entries.push({name,svg:kind==='clinic'?completeReceptionBody(svg):completeOtherReception(svg,kind),head:'.reception-staff-head',note:kind==='clinic'?'下半身の追加案・上半身は本編のまま':'全身追加案・顔と上半身は維持'});}
entries.push({name:'ホームセンター・ペットショップ店員',svg:completeStoreClerk(isolated(storeBackground({}),'.shop-clerk')),head:'.store-clerk-head',note:'両店舗共通・全身追加案'});
for(let i=0;i<6;i++)entries.push({name:['来場者・家族の大人','来場者・若い家族','来場者・帽子の年配者','来場者・眼鏡の年配者','来場者・バッグの女性','来場者・眼鏡の大人'][i],svg:fitVisitorBody(parse(adoptionPerson(i))),head:'.adoption-main .adoption-head',note:'既存の服・顔を保ち、胴と脚を調整',visitor:true});
const child=parse(adoptionPerson(0)).querySelector('.adoption-companion');child.removeAttribute('x');child.removeAttribute('y');entries.push({name:'譲渡会・子ども',svg:fitVisitorBody(child,true),head:'.adoption-head',note:'子どもの比率で胴と脚を調整',visitor:true});
const shop=parse(storeBackground({}));for(const [selector,name]of [['.shoulder-bird','店員の肩のインコ'],['.store-rabbit','店内のウサギ']])entries.push({name,svg:isolated(shop.outerHTML,selector),head:null,note:'動物・人とは別縮尺'});

let serial=0;
for(const e of entries){e.svg.querySelectorAll('.adoption-companion').forEach(n=>n.remove());const card=document.createElement('article');card.innerHTML=`<header><h2>${e.name}</h2><small>${e.note}</small></header><div class="stage"><div class="grid">${[1,2,3,4,5].map((x,i)=>`<span style="top:${i*48+2}px">${x}</span>`).join('')}</div></div><div class="face"></div><div class="caption"></div>`;document.querySelector('main').append(card);
 // Keep native groups and their joint animation; normalize only their outer viewport.
 const stage=card.querySelector('.stage');stage.append(e.svg);e.svg.removeAttribute('width');e.svg.removeAttribute('height');e.svg.querySelectorAll('ellipse[fill="#655b4820"],ellipse[fill="#6c705b22"]').forEach(n=>n.remove());
 const bounds=e.svg.getBBox(),head=e.head?e.svg.querySelector(e.head):null;let h=head?.getBBox();if(head){const m=e.svg.getCTM().inverse().multiply(head.getCTM()),pts=[[h.x,h.y],[h.x+h.width,h.y],[h.x,h.y+h.height],[h.x+h.width,h.y+h.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(m));h={x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),width:Math.max(...pts.map(p=>p.x))-Math.min(...pts.map(p=>p.x)),height:Math.max(...pts.map(p=>p.y))-Math.min(...pts.map(p=>p.y))};}
 const scale=h?48/h.height:260/(bounds.height*1.25),viewHeight=260/scale,viewWidth=stage.clientWidth/scale,top=(h?h.y:bounds.y)-20/scale;e.svg.setAttribute('viewBox',`${bounds.x+bounds.width/2-viewWidth/2} ${top} ${viewWidth} ${viewHeight}`);e.svg.setAttribute('preserveAspectRatio','xMidYMin meet');new ResizeObserver(()=>{const w=stage.clientWidth/scale;e.svg.setAttribute('viewBox',[bounds.x+bounds.width/2-w/2,top,w,viewHeight].join(' '))}).observe(stage);
 const close=e.svg.cloneNode(true);close.querySelectorAll('[id]').forEach(n=>{const old=n.id,id=old+'-close-'+serial;close.innerHTML=close.innerHTML.replaceAll(old,id)});serial++;
 if(h){close.setAttribute('viewBox',`${h.x-15} ${h.y-10} ${h.width+30} ${h.height+20}`);card.querySelector('.caption').textContent=e.note.includes('未作画')?'頭と肩・胸までの比率を比較':`描画全高 ÷ 頭の高さ：約${(bounds.height/h.height).toFixed(1)}頭身`;}else{close.setAttribute('viewBox',`${bounds.x-8} ${bounds.y-8} ${bounds.width+16} ${bounds.height+16}`);card.querySelector('.grid').remove();card.querySelector('.caption').textContent='動物のシルエット確認';}
 close.style.overflow='hidden';close.setAttribute('preserveAspectRatio','xMidYMid meet');card.querySelector('.face').append(close);
}
document.querySelector('#pause').onclick=()=>{const stop=document.body.classList.toggle('paused');document.querySelector('#pause').textContent=stop?'動きを再開':'動きを止める'};
document.querySelector('#guides').onclick=()=>{const hide=document.body.classList.toggle('no-guides');document.querySelector('#guides').setAttribute('aria-pressed',String(!hide))};
let visitorWalking=false,visitorTime=0,visitorLast=performance.now();
const walkButton=document.querySelector('#walk');
walkButton.onclick=()=>{visitorWalking=!visitorWalking;visitorTime=0;walkButton.setAttribute('aria-pressed',String(visitorWalking));walkButton.textContent=visitorWalking?'来場者を立ち姿に戻す':'来場者の歩行を見る';};
function visitorReviewFrame(now){
 if(!document.body.classList.contains('paused'))visitorTime+=(now-visitorLast)/1000;
 visitorLast=now;
 const elapsed=visitorTime%12,dir=elapsed<6?1:-1,offset=elapsed<6?-144+elapsed*48:144-(elapsed-6)*48;
 document.querySelectorAll('.stage svg[data-visitor-hip]').forEach((svg,index)=>{
  drawVisitorLegs(svg,visitorTime+index*.19,visitorWalking,1);
  const figure=svg.querySelector('.adoption-figure');figure.setAttribute('transform',visitorWalking?`translate(${offset} 0) translate(60 0) scale(${dir} 1) translate(-60 0)`:'');
 });requestAnimationFrame(visitorReviewFrame);
}requestAnimationFrame(visitorReviewFrame);





