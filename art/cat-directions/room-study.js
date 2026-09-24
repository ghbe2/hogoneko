'use strict';
const embedParams=new URLSearchParams(location.search);
if(embedParams.has('embed')){document.documentElement.classList.add('embedded-room');if(embedParams.has('controls'))document.documentElement.classList.add('embed-controls');}
if(embedParams.has('embed'))window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='scene-cast')return;document.querySelector('#room-cat').style.display=e.data.visible?'':'none';});
const palettes={oat:{},sage:{wall:'#cbd2ba',floor:'#c5a779',skirting:'#9c7e53',cloth:'#e3d2ae','cloth-line':'#bdab84',ceramic:'#b97a60',sky:'#cad9d2',leaf:'#657558'},rose:{wall:'#e2cfc1',floor:'#c4a777',skirting:'#a48560',cloth:'#849681','cloth-line':'#697d68',ceramic:'#b47559',sky:'#c3d4d4',leaf:'#697958'}};
document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{document.documentElement.removeAttribute('style');Object.entries(palettes[b.dataset.theme]).forEach(([k,v])=>document.documentElement.style.setProperty('--'+k,v));document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
document.querySelector('#furniture').onchange=e=>document.querySelectorAll('.furnishing').forEach(n=>n.style.display=e.target.checked?'':'none');
document.querySelector('#cat-visible').onchange=e=>document.querySelector('#room-cat').style.display=e.target.checked?'':'none';
document.querySelector('#cat-choice').onchange=e=>document.querySelector('#cat-image').setAttribute('href','room-assets/'+e.target.value+'.svg');
const viewport=document.querySelector('#viewport'),room=document.querySelector('#room');let pan=0,drag=null;
function move(value){pan=Math.max(0,Math.min(450,value));room.setAttribute('viewBox',`${pan} 0 450 760`);document.querySelectorAll('[data-pan]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.pan)===(pan<225?0:450)));}
document.querySelectorAll('[data-pan]').forEach(b=>b.onclick=()=>move(Number(b.dataset.pan)));
viewport.onpointerdown=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,start:pan};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging');};
viewport.onpointermove=e=>{if(drag?.id===e.pointerId)move(drag.start-(e.clientX-drag.x)*450/viewport.clientWidth);};
function end(){drag=null;viewport.classList.remove('dragging');}viewport.onpointerup=end;viewport.onpointercancel=end;viewport.onlostpointercapture=end;

// Outdoor color is independent of the interior palette. One view, four seasons.
const seasons={
 spring:{label:'春',back:'#b6c59b',front:'#94ae83',leaf:'#849b72',accent:'#e5b2ab'},
 summer:{label:'夏',back:'#90af8d',front:'#688e70',leaf:'#56765b',accent:'#b4c183'},
 autumn:{label:'秋',back:'#cbb07a',front:'#b99261',leaf:'#b9794d',accent:'#d7a453'},
 winter:{label:'冬',back:'#c7d4ce',front:'#e4e6d9',leaf:'#889a90',accent:'#f6f0df'}
};
const times={morning:{label:'朝',sky:'#d9dfcd',sun:'#f2dca8'},day:{label:'昼',sky:'#b6cdd1',sun:'#f0d69b'},evening:{label:'夕方',sky:'#c39891',sun:'#f4dfab'},night:{label:'夜',sky:'#566776',sun:'#e6d7ad'}};
function updateScenery(){
 const season=document.querySelector('#season').value,time=document.querySelector('#daytime').value,s=seasons[season],t=times[time];
 const moon=time==='evening'||time==='night';
 const celestial=moon?`<g aria-label="二色の月"><circle cx="251" cy="137" r="24" fill="#c3bfa5"/><path d="M251 113A24 24 0 0 1 251 161Q270 140 251 113Z" fill="#f4e5b7"/></g>`:`<circle cx="${time==='morning'?234:252}" cy="${time==='morning'?179:131}" r="24" fill="${t.sun}"/>`;
 const branches='<path d="M115 322Q132 252 153 191M130 262L109 229M139 232L164 220M150 207L143 174" stroke="#765f46" stroke-width="4" stroke-linecap="round" fill="none"/>';
 const leaves=season==='winter'?'':`<path d="M147 229Q145 193 170 190Q177 216 147 229M128 259Q100 244 103 221Q132 222 128 259M151 203Q131 180 143 165Q166 179 151 203" fill="${s.leaf}"/>`;
 const details={spring:`<g fill="${s.accent}"><path d="M138 185Q125 176 136 171Q139 159 146 170Q159 172 150 181Q149 193 138 185Z M164 215Q151 209 160 201Q163 191 171 201Q183 202 176 211Q175 224 164 215Z"/><ellipse cx="212" cy="280" rx="5" ry="3"/></g>`,summer:`<path d="M193 252Q189 230 204 222Q223 226 216 243Q232 230 241 244Q240 260 217 263Z" fill="${s.leaf}"/><path d="M111 129Q122 117 135 127Q146 121 153 133L110 136Z" fill="#e4e8d8"/>`,autumn:`<g fill="${s.accent}"><path d="M164 194L176 201 173 219 160 212Z M177 260Q195 262 185 275Q174 275 177 260Z M124 290Q142 281 143 294Q132 303 124 290Z"/></g>`,winter:`<g fill="${s.accent}"><path d="M101 228Q106 218 113 227L125 247Q109 242 101 228M137 179Q138 168 145 169L153 181Z"/><circle cx="187" cy="157" r="3"/><circle cx="274" cy="220" r="3"/><circle cx="225" cy="242" r="2"/><circle cx="119" cy="146" r="2"/></g>`}[season];
 document.querySelector('#outside').innerHTML=`<path fill="${t.sky}" d="M90 80H310V320H90Z"/>${celestial}<path fill="${s.back}" d="M86 263Q145 233 192 261Q243 234 313 250V325H86Z"/><path fill="${s.front}" d="M93 294Q142 263 208 288T310 279V326H93Z"/>${branches}${leaves}${details}`;
 document.querySelector('#closed-curtains').style.display=time==='night'?'':'none';
 document.querySelector('#open-curtains').style.display=time==='night'?'none':'';
 room.classList.toggle('night',time==='night');
 document.querySelector('#scene-caption').textContent=`${s.label}の${t.label} · ${time==='night'?'カーテンを閉めて、おやすみ':moon?'二色の月がのぼる空':'窓の向こうにも、季節'}`;
}
document.querySelector('#season').onchange=updateScenery;
document.querySelector('#daytime').onchange=updateScenery;
document.querySelector('#daytime option[value="night"]').textContent='夜・カーテンを閉める';
updateScenery();
