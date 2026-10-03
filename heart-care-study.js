'use strict';
// Prototype only: no game state, inventories or saves are touched.
document.title='共通ハート演出・試作 r3';$('h1').textContent='共通ハート演出 r3';
const style=document.createElement('style');style.textContent=`
.gauge{position:absolute;padding:0;background:none;gap:2px;pointer-events:none;opacity:0;z-index:8;transform:translateX(-50%);width:max-content;max-width:100%}.gauge .slot{font-size:22px;text-shadow:0 1px #fff9}.gauge.appear{opacity:1}.gauge.appear .slot{animation:heart-pop .3s both;animation-delay:calc(var(--i)*60ms)}
.hearts{opacity:0;transition:opacity .4s}.hearts.visible{opacity:1}.care-controls{display:flex;gap:5px}.care-controls select{min-width:0;flex:1}.care-object{position:absolute;bottom:40px;left:65%;font-size:32px;pointer-events:none}.care-object.working{animation:care-work .5s alternate infinite}.gauge.glow{animation:none}
@keyframes heart-pop{from{opacity:0;scale:.3;translate:0 8px}to{opacity:1;scale:1;translate:0 0}}@keyframes care-work{to{rotate:12deg;translate:0 -5px}}
@media(max-height:600px){.phone{min-height:190px}.care-object{bottom:30px}}
`;document.head.appendChild(style);
$('.room').appendChild($('.gauge'));
const controls=document.createElement('div');controls.className='care-controls';controls.innerHTML='<select aria-label="試す世話" id="care-kind"><option value="fill">ごはんを入れる</option><option value="eat">ごはんを食べる</option><option value="clean">掃除する</option><option value="comb">コームで撫でる</option></select><button id="care-go">世話を試す</button>';
$('.phone').after(controls);
const prop=document.createElement('span');prop.className='care-object';$('.room').appendChild(prop);
$('.note').textContent='表示確認用：世話1回で心1を加算（仮）。遊び・世話中だけ浮遊し、10個合体時だけ頭上にゲージ。本編・セーブは変わりません。';
let care=null,gaugeUntil=0;
function locateGauge(){const c=$('.cat').getBoundingClientRect(),r=$('.room').getBoundingClientRect();$('.gauge').style.left=(c.left-r.left+c.width/2)+'px';$('.gauge').style.top=Math.max(8,c.top-r.top-20)+'px';}
const previousGauge=gauge;
gauge=function(){previousGauge();$('.gauge').querySelectorAll('.slot').forEach((node,i)=>node.style.setProperty('--i',i));locateGauge();};
const previousAnimate=animate;
animate=async function(el,frames,options){
 if(el.classList.contains('big')){
  gauge();$('.gauge').classList.add('appear');gaugeUntil=performance.now()+2800;
  const r=$('.room').getBoundingClientRect(),g=$('.gauge').getBoundingClientRect();
  frames=frames.map((f,i)=>i===frames.length-1?{...f,translate:`0 ${g.top-r.top+g.height/2-r.height*.55}px`}:f);
 }
 return previousAnimate(el,frames,options);
};
const previousReset=reset;
reset=function(){care=null;auto=false;held=false;gaugeUntil=0;$('#auto').textContent='自動で遊ぶ';$('#auto').setAttribute('aria-pressed','false');$('.gauge').classList.remove('appear');prop.textContent='';previousReset();};
$('#reset').onclick=reset;$('#start').onchange=$('#cap').onchange=reset;
$('#care-go').onclick=()=>{if(busy||care)return;auto=false;held=false;$('#auto').textContent='自動で遊ぶ';$('#auto').setAttribute('aria-pressed','false');care={kind:$('#care-kind').value,target:Math.min(+$('#cap').value,heart+1),elapsed:0,last:performance.now()};};
const previousFrame=frame;
frame=function(now){
 const originalHeld=held,originalAuto=auto;let caring=!!care;
 if(care){held=false;auto=false;const dt=Math.min(100,now-care.last)/1000;care.last=now;if(!document.hidden&&!busy){care.elapsed+=dt;const before=Math.floor(heart);heart=Math.min(care.target,heart+dt/2);if(Math.floor(heart)>before)drop();else shown=heart;}
 prop.textContent={fill:'🥣',eat:'🥣',clean:'🧹',comb:'🪮'}[care.kind];prop.classList.add('working');
 if(care.elapsed>=2&&heart>=care.target&&!busy){care=null;caring=false;prop.classList.remove('working');prop.textContent='';}}
 previousFrame(now);held=originalHeld;auto=originalAuto;
 const visible=((held||auto||caring)&&!document.hidden)||busy;
 $('.hearts').classList.toggle('visible',visible);
 if(!visible)$('.spark').textContent='';
 if(caring){$('.spark').textContent=!busy&&heart<+$('#cap').value?'♥':'';const pose=care?.kind==='eat'?'eat':care?.kind==='comb'?'knead':'sit';CatSVG.applyPose(rig,CatSVG.poseModel(pose,now/1000),now/1000,pose);}
 if(now>gaugeUntil)$('.gauge').classList.remove('appear');
 locateGauge();$('#care-go').disabled=busy||caring;$('.play').disabled=caring;$('#auto').disabled=caring;
};
reset();
