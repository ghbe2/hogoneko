'use strict';
const ADOPTION_COLORS=['#7f927f','#b99179','#9e9b7e','#7e9699','#9c879a','#b49b72'];
// A quiet community hall. All figures share one floor and tabletop baseline.
const ADOPTION_MARKUP=`<div class="adoption-scene" id="adoption-scene">
 <div class="adoption-stage">
  <div class="adoption-wall" aria-hidden="true">
   <div class="adoption-window"><i></i></div>
   <div class="adoption-hall-sign"><small>保護センター</small><span>ネコの譲渡会</span><i>あたらしい家族との出会い</i></div>
   <div class="adoption-noticeboard"><i></i><i></i><i></i></div>
   <svg class="adoption-garland" viewBox="0 0 300 35"><path d="M0 3Q150 38 300 3" fill="none" stroke="#a59b7b" stroke-width="1.5"/><path d="M26 9l18 3-11 16zM143 20h18l-9 14zM251 12l18-3-7 19z" fill="#b8bf9b"/><path d="M83 17l18 2-10 15zM201 19l18-2-8 17z" fill="#d6b48d"/></svg>
  </div>
  <div class="adoption-floor" aria-hidden="true"></div>
  <div class="adoption-walkway" id="adoption-walkway" aria-label="会場を歩く来場者"></div>
  <div class="adoption-display" aria-hidden="true"><i class="adoption-table-leg left"></i><i class="adoption-table-leg right"></i><div class="adoption-table-top"></div><div class="adoption-table-cloth"></div></div>
  <div class="adoption-basket" aria-label="かごの中のこむぎ"><svg class="adoption-basket-back" viewBox="0 0 212 174" aria-hidden="true"><path d="M78 34V20Q106 3 134 20V34" fill="none" stroke="#967b53" stroke-width="6"/><path d="M13 57Q13 32 39 32H173Q199 32 199 57V150H13Z" fill="#c5b086"/><path d="M23 58Q23 43 40 43H172Q189 43 189 58V140H23Z" fill="#e8ddbf"/></svg><div class="adoption-cat"><svg id="adoption-cat" viewBox="200 55 320 320" preserveAspectRatio="xMidYMax meet" role="img" aria-label="こむぎ"></svg></div><svg class="adoption-basket-front" viewBox="0 0 212 174" aria-hidden="true"><path d="M13 58V145Q13 162 30 162H182Q199 162 199 145V58" fill="none" stroke="#a88c5e" stroke-width="8"/><path d="M15 135H197V153Q197 164 183 164H29Q15 164 15 153Z" fill="#bba172"/><path d="M22 142H190M26 154H186" stroke="#dfc797" stroke-width="3"/><path d="M40 49V135M77 43V135M135 43V135M172 49V135" stroke="#af9a7166" stroke-width="3"/><path d="M16 51H196" stroke="#c7b38d" stroke-width="3"/></svg><span class="adoption-basket-tag">こむぎ</span></div>

  <div class="adoption-result-title" id="adoption-result-title"><small id="adoption-result-kicker"></small><strong id="adoption-result-word"></strong></div>
  <p class="adoption-visitor-comment" aria-live="polite"></p>
  <div class="adoption-aside" id="adoption-aside"></div>
 </div>
 <section class="adoption-panel" aria-live="polite"><div class="adoption-eyebrow" id="adoption-step"></div><h1 id="adoption-heading"></h1><p id="adoption-copy"></p><div class="adoption-actions"><button id="adoption-next"></button><button id="adoption-secondary" class="adoption-secondary"></button></div></section>
</div>`;
function adoptionSinglePerson(i){
 const hair=i===2||i===3?'#b5afa0':['#685b4c','#514d43','#8b8170'][i%3],coat=ADOPTION_COLORS[i],skin=i%3===1?'#d8ad8b':'#e0bd9c';
 const leg=(side,x,color)=>`<g class="adoption-leg-${side}"><path class="adoption-leg-line" d="M${x} 154L${x} 193L${x} 232" fill="none" stroke="${color}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/><path class="adoption-shoe" d="M${x-8} 230h15l8 7q0 4-6 4h-19z" fill="#645e52"/></g>`;
 return `<svg viewBox="0 0 120 248" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <ellipse cx="60" cy="242" rx="29" ry="4" fill="#655b4820"/>
  <g class="adoption-figure">
   ${leg('b',67,'#777970')}${leg('a',53,'#686d64')}
   <g class="adoption-torso">
    <path d="M38 93Q56 86 77 94L83 157Q62 164 34 157Z" fill="${coat}"/>
    <path d="M52 81v13q9 9 17-1V80" fill="${skin}"/>
    <path d="M48 92l12 15 12-15-5 26H55Z" fill="#f3ecdc"/><path d="M60 107v43" stroke="#f0e8d7" opacity=".4"/>
    <path d="M38 137h12v12H38m28-12h12v12H66" fill="#ffffff16"/>
    <g class="adoption-head">
     ${i===4?`<path d="M38 29Q15 34 25 63L36 79 43 52Z" fill="${hair}"/>`:''}
     <path d="M34 34Q35 9 62 10Q87 11 86 39L89 54 82 59Q80 83 61 85Q36 79 34 55Z" fill="${skin}"/>
     <path d="M34 55Q23 28 36 15Q57-1 79 11Q91 17 86 37L71 29 62 21 44 36 42 57Z" fill="${hair}"/>
     ${i===2?'<path d="M28 26Q42 3 68 9L87 28H28" fill="#b8aa85"/><path d="M26 30h68" stroke="#9e9170" stroke-width="4"/>':''}
     <ellipse cx="40" cy="53" rx="5" ry="7" fill="${skin}"/>
     <g class="adoption-face-profile"><path d="M73 46l4 1m-3 20 5-1" stroke="#75614d" stroke-width="2" stroke-linecap="round"/></g>
     <g class="adoption-face-front"><path d="M48 48l5-1m15 0 5 1m-18 19q7 5 14-1" fill="none" stroke="#75614d" stroke-width="2" stroke-linecap="round"/>${i%2?'<g stroke="#8c816d" stroke-width="1.3" fill="none"><rect x="44" y="41" width="15" height="13" rx="5"/><rect x="65" y="41" width="15" height="13" rx="5"/><path d="M59 46h6"/></g>':''}</g>
     <ellipse cx="73" cy="60" rx="4" ry="2" fill="#c58d78" opacity=".45"/>
     ${i===2||i===3?'<path d="M45 56l6 2m20 0 6-2M53 73q10 5 18-1" stroke="#b18c73" stroke-width="1" fill="none"/>':''}
    </g>
    <g class="adoption-arm"><path d="M75 101Q85 123 78 144" fill="none" stroke="${coat}" stroke-width="14" stroke-linecap="round"/><path d="M78 143l-2 9" stroke="${skin}" stroke-width="8" stroke-linecap="round"/></g>
    ${i===4?'<path d="M44 94l29 49" stroke="#b89c74" stroke-width="3"/><path d="M63 140h23l3 27H62Z" fill="#c7ae86"/><path d="M67 142q7-11 15 0" stroke="#9c8562" fill="none" stroke-width="2"/>':''}
   </g>
  </g>
 </svg>`;
}
function adoptionPerson(i){
 const markup=adoptionSinglePerson(i),t=document.createElement('template');t.innerHTML=markup;
 const svg=t.content.firstElementChild;svg.style.overflow='visible';svg.querySelector('.adoption-figure').classList.add('adoption-main');
 if(i===0||i===1){
  const c=document.createElement('template');c.innerHTML=adoptionSinglePerson(i===0?5:4);
  const companion=c.content.firstElementChild;companion.classList.add('adoption-companion');
  const child=i===0;for(const [key,value]of Object.entries({x:child?-47:-62,y:child?96:12,width:child?74:112,height:child?151:235}))companion.setAttribute(key,value);
  if(child){companion.querySelector('.adoption-head').setAttribute('transform','translate(60 83) scale(1.12) translate(-60 -83)');}
  svg.insertBefore(companion,svg.firstChild);
 }
 return svg.outerHTML;
}


