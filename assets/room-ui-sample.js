(()=>{
 const svg=body=>`<svg viewBox="0 0 40 40" aria-hidden="true">${body}</svg>`;
 const phone=svg('<rect x="11" y="3" width="20" height="34" rx="5" fill="#829681"/><rect x="14" y="7" width="14" height="23" rx="2" fill="#fff6dd"/><path d="M18 34h6" stroke="#fff6dd" stroke-width="2"/>');
 const chair=svg('<path d="M8 21V8q12-6 24 0v13" fill="#c59b76"/><rect x="5" y="19" width="30" height="12" rx="4" fill="#a58364"/><path d="M10 30v7m20-7v7" stroke="#786b4e" stroke-width="3"/>');
 const bowl=svg('<ellipse cx="20" cy="18" rx="17" ry="6" fill="#e4cdb0"/><path d="M3 18l5 15h24l5-15q-17 9-34 0" fill="#bd9476"/><ellipse cx="20" cy="18" rx="13" ry="4" fill="#826c4d"/>');
 const comb=svg('<path d="M7 14h26v10H7Z" fill="#8b9c7b"/><path d="M9 24v11m5-11v11m6-11v11m6-11v11m5-11v11" stroke="#8b9c7b" stroke-width="2"/><path d="M5 17L13 7q3-3 5 0l-4 10" fill="#d9b798"/>');
 const toy=svg('<path d="M8 36L27 6" stroke="#967e58" stroke-width="2.5"/><path d="M27 6q13 4 4 16l-9-6Z" fill="#ba8572"/>');
 const brush=svg('<path d="M20 4v16" stroke="#8e7858" stroke-width="5"/><path d="M10 18h20l5 16H5Z" fill="#bdab7c"/><path d="M12 24l-2 10m10-10v10m8-10l2 10" stroke="#8f855e" stroke-width="2"/>');
 q('#launch-app').innerHTML=phone+'<span>アプリ</span>';q('#layout').innerHTML=chair+'<span>模様替え</span>';
 q('#play').innerHTML=toy+'<span>あそぶ</span>';q('#clean').innerHTML=brush+'<span>そうじ</span>';
 function organicTravel(){const art=q('#travel svg');art.querySelector('path').setAttribute('d','M0 0H90Q104 8 84 22Q87 37 62 39Q66 58 39 63Q45 80 23 84Q25 101 0 108Z');art.lastElementChild.remove();}
 const originalTravel=q('#travel').onclick;q('#travel').onclick=()=>{originalTravel();organicTravel();};organicTravel();
 q('#call').innerHTML='<svg viewBox="0 0 80 96" aria-hidden="true"><g fill="#f7efda" stroke="#7b806a" stroke-width="2.5" stroke-linejoin="round"><circle cx="48" cy="29" r="13"/><path d="M29 73V60q0-16 19-16t19 16v13"/><path d="M33 58L24 38q-2-5-6-2t0 9l10 22"/></g><path d="M15 26l-7-4m6 14H5m15-18-4-7" stroke="#7b806a" stroke-width="2.5" stroke-linecap="round"/><text x="34" y="90" font-size="12" fill="#655840">よぶ</text></svg>';
 const tray=document.createElement('div');tray.className='preparation-tray';q('#prepared').before(tray);tray.append(q('#prepared'),q('#prepare'));q('#prepared').hidden=false;
 q('#prepare').innerHTML='‹';q('#prepare').setAttribute('aria-label','お世話の準備を閉じる');q('#prepare').setAttribute('aria-expanded','true');q('#prepare').onclick=()=>{const folded=tray.classList.toggle('folded');q('#prepared').inert=folded;q('#prepare').textContent=folded?'›':'‹';q('#prepare').setAttribute('aria-expanded',String(!folded));q('#prepare').setAttribute('aria-label',folded?'お世話の準備を開く':'お世話の準備を閉じる');};
 let food='いつものカリカリ',tool='コーム';
 function refresh(){q('#prepared').innerHTML=`<button data-food>${bowl}<div><strong>ごはん</strong><small>${food}</small></div></button><button data-tool>${comb}<div><strong>もちもの</strong><small>${tool}</small></div></button>`;}
 refresh();
 document.addEventListener('click',e=>{if(e.target.closest('[data-food]'))show('<h2>ごはんを選ぶ</h2><button data-food-choice="いつものカリカリ">いつものカリカリ</button><button data-food-choice="ウェットフード">ウェットフード</button><button data-dismiss>もどる</button>');if(e.target.closest('[data-tool]'))show('<h2>持ち替える</h2><button data-tool-choice="コーム">コーム</button><button data-tool-choice="ねこじゃらし">ねこじゃらし</button><button data-dismiss>もどる</button>');const f=e.target.closest('[data-food-choice]'),t=e.target.closest('[data-tool-choice]');if(f||t){if(f)food=f.dataset.foodChoice;if(t)tool=t.dataset.toolChoice;refresh();dismiss();say(f?'ごはんをセットしました':`${tool}に持ち替えました`);}});
 for(const id of ['play','clean']){
  const button=q('#'+id);let drag=null;
  button.onpointerdown=e=>{const r=button.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top,moved:false};button.setPointerCapture(e.pointerId);};
  button.onpointermove=e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8&&!drag.moved)return;drag.moved=true;button.classList.add('dragging');button.style.left=(e.clientX-31)+'px';button.style.top=(e.clientY-31)+'px';};
  const end=e=>{if(!drag)return;const moved=drag.moved;button.classList.remove('dragging');button.style.left='';button.style.top='';drag=null;if(moved){say(id==='play'?'こむぎ、あそぼう':'ここをおそうじ');q('.room-cat svg').dataset.pose=id==='play'?'punch':'sit';setTimeout(()=>q('.room-cat svg').dataset.pose='sit',1800);}};
  button.onpointerup=end;button.onpointercancel=end;button.onclick=()=>say('長押しせず、そのまま部屋へドラッグ');
 }
 q('#layout').onclick=()=>say('今回はお世話UIの配置サンプルです');
 q('#design-label').textContent='部屋UI';
})();
