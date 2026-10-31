// Review snapshot extracted from production factories; refresh with scripts/build-npc-review.cjs.
'use strict';
// A single authored companion: the same body, face, coat and limb parts as playable cats.
const SENIOR_CAT_DNA=Object.freeze({age:'adult',body:'round',head:'oval',eyes:'droop',ears:'small',earCut:'none',tail:'short',eyeColor:'green',mood:'neutral',muzzle:'none',whiskers:'short',headCoat:'tux_gray_0',bodyCoat:'tux_gray_0',legCoat:'tux_gray_0',tailCoat:'tux_gray_0',seed:4107});
let seniorCatTemplate='',seniorCatInstance=0;
function seniorCompanionArt(){
 if(!seniorCatTemplate){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),rig=CatSVG.buildCat(svg,'senior-companion',SENIOR_CAT_DNA);
  CatSVG.applyPose(rig,{...CatSVG.poseModel('sit',0),hy:-150,hs:1.15,by:-65,bh:.75},0,'sit');
  svg.querySelector('.floor')?.remove();svg.querySelectorAll('.part-outline').forEach(n=>n.remove());seniorCatTemplate=svg.innerHTML;
 }
 const content=seniorCatTemplate.replaceAll('senior-companion','senior-companion-'+(++seniorCatInstance));
 return `<svg class="senior-held-cat" data-instance="${seniorCatInstance}" x="60" y="91" width="104" height="105" viewBox="290 150 165 230" preserveAspectRatio="xMidYMax meet" data-companion="senior-gray-tux-v1" aria-hidden="true">${content}</svg>`;
}
function seniorArt(){return `<svg viewBox="0 0 220 270" aria-label="ネコを抱いた保護主のせんぱい" role="img">
<ellipse cx="113" cy="258" rx="65" ry="9" fill="#6c705b22"/>
<path d="M70 187h81l5 66h-34l-10-48-9 48H70Z" fill="#777b68"/>
<g class="senior-upper">
<path d="M91 98Q77 101 68 110Q56 122 55 142L48 200H173L165 141Q164 122 152 111Q141 101 126 98Z" fill="#b98466"/>
<path d="M91 95l18 22 19-22 11 105H78Z" fill="#f4ead2"/>
<path d="M91 87h34v20q-17 17-34 0" fill="#d9b38d"/>
<g class="senior-head">
<g transform="translate(109 96) scale(.88) translate(-109 -96)">
<path d="M68 63Q60 14 105 12q48-4 49 51l-7 35H72Z" fill="#655d4d"/>
<ellipse cx="109" cy="65" rx="35" ry="40" fill="#e3bd98"/>
<path d="M73 57Q62 18 104 14q39-4 46 38l-24-18-14 10-13-9Z" fill="#655d4d"/>
<g class="senior-face-features"><g class="senior-eye-left"><path d="M85 57q5-3 10-1" fill="none" stroke="#88725b" stroke-width="1.5" stroke-linecap="round"/><path d="M86 65q5 3 10-1" fill="none" stroke="#615a49" stroke-width="2.5" stroke-linecap="round"/></g><g class="senior-eye-right"><path d="M124 56q5-2 10 1" fill="none" stroke="#88725b" stroke-width="1.5" stroke-linecap="round"/><path d="M122 64q5 4 10 1" fill="none" stroke="#615a49" stroke-width="2.5" stroke-linecap="round"/></g>
<g class="senior-nose-mouth"><path d="M110 68l-2 6h4" fill="none" stroke="#bb8f71" stroke-width="1.6" stroke-linecap="round"/><path d="M100 83q10 7 19-1" fill="none" stroke="#a57660" stroke-width="2.5" stroke-linecap="round"/></g>
<ellipse cx="86" cy="76" rx="7" ry="3" fill="#dca58c"/><ellipse cx="133" cy="76" rx="7" ry="3" fill="#dca58c"/></g>
</g></g>
${seniorCompanionArt()}<path d="M66 129Q58 152 69 169Q77 181 94 187M153 129Q163 154 148 170Q138 180 124 186" fill="none" stroke="#b98466" stroke-width="18" stroke-linecap="round"/>
<path d="M92 185Q102 190 111 189M125 185Q118 190 110 190" fill="none" stroke="#e3bd98" stroke-width="10" stroke-linecap="round"/>
</g>
</svg>`;}
function receptionArt(kind){
 const clinic=kind==='clinic'||kind==='doctor',doctor=kind==='doctor',coat=doctor?'#f6f1e2':clinic?'#91a69a':'#839575',wall=clinic?'#d7ddcc':'#e5ddc4';
 const art=`<svg viewBox="0 0 450 300" preserveAspectRatio="${clinic?'xMidYMid meet':'xMidYMin slice'}" aria-hidden="true"><rect width="450" height="300" fill="${wall}"/><path d="M0 220H450V300H0Z" fill="#cfb58c"/>
 <rect x="24" y="29" width="150" height="158" rx="3" fill="#b4a17b"/><rect x="31" y="36" width="136" height="144" fill="#f7edd7"/>
 ${clinic?'<path d="M90 53H108V72H127V90H108V109H90V90H71V72H90Z" fill="#90a9a0"/><path d="M56 133H144M56 146H130M56 159H137" stroke="#c2c8b3" stroke-width="4" stroke-linecap="round"/>':'<rect x="38" y="43" width="122" height="130" fill="#b8ccd0"/><path d="M38 138Q78 89 111 135Q137 112 160 139V173H38Z" fill="#a3b38c"/><path d="M97 43V174M38 108H160" stroke="#f6eed9" stroke-width="7"/><path d="M195 28Q291 66 443 28" fill="none" stroke="#ac9776" stroke-width="2"/><path d="M212 33L242 40 224 59Z" fill="#c78e74"/><path d="M270 44L300 44 288 64Z" fill="#96a582"/><path d="M332 41L363 36 350 58Z" fill="#d1b57b"/>'}
 <rect x="385" y="104" width="42" height="121" fill="#b9c3aa"/><path d="M390 146H422M390 185H422" stroke="#e5e9d5" stroke-width="3"/>
 <g class="reception-staff" ${clinic?'transform="translate(-82 -58.75) scale(1.25)"':''}><path d="M272 233L279 163Q285 148 328 148Q371 151 377 173L386 234Z" fill="${coat}"/><path d="M306 147L314 175 330 148" fill="#c19376"/>
 ${doctor?'<path d="M300 152L307 184 286 168M338 152L329 184 350 169" fill="#e0e3d7"/><path d="M299 156Q290 195 308 196M339 156Q345 194 325 196" fill="none" stroke="#78958d" stroke-width="3"/><circle cx="317" cy="198" r="8" fill="#849c91"/><circle cx="317" cy="198" r="4" fill="#d9dfce"/>':clinic?'<path d="M300 151l14 24 19-24-5 38h-20Z" fill="#fff7e5"/><rect x="344" y="179" width="23" height="13" rx="2" fill="#fff7e5"/><path d="M348 184h14m-14 4h8" stroke="#60796c" stroke-width="1.5"/>':'<path d="M295 160L291 233H358L347 159 337 173 306 172Z" fill="#657d57"/><rect x="317" y="184" width="26" height="15" rx="2" fill="#f1e5cd"/><path d="M323 191H336" stroke="#9ea68b" stroke-width="2"/>'}
 <g class="reception-staff-head">${clinic?'<path d="M281 111Q272 62 316 63Q354 57 361 102L350 153 291 154Z" fill="#6c6252"/><path d="M289 100Q292 76 324 80Q352 85 348 117L342 140Q326 159 304 143Q289 136 289 100Z" fill="#cea487"/><path d="M283 109Q278 76 301 73Q318 58 342 76Q360 88 349 111L337 93 319 89 298 104 296 123Z" fill="#6c6252"/>':'<path d="M350 103Q377 80 379 114L370 152 350 139Z" fill="#ac7950"/><path d="M290 100Q286 78 320 77Q351 78 354 105L350 131Q339 153 316 149Q291 143 290 119Z" fill="#dfb596"/><path d="M286 113Q272 91 288 78Q286 64 307 64Q328 51 347 71Q367 73 360 107L345 99 337 82 325 99 312 86 300 107 294 119Z" fill="#ac7950"/><path d="M349 104L360 100" stroke="#708969" stroke-width="5"/><ellipse cx="300" cy="128" rx="6" ry="3" fill="#d69f83"/><ellipse cx="339" cy="129" rx="6" ry="3" fill="#d69f83"/>'}
 <g class="reception-staff-eyes"><path d="M303 115L310 114M329 114L336 115" fill="none" stroke="#514a3c" stroke-width="2.5" stroke-linecap="round"/></g>
 ${clinic?'<g fill="none" stroke="#8e8268" stroke-width="1.5"><rect x="298" y="107" width="17" height="15" rx="6"/><rect x="325" y="107" width="17" height="15" rx="6"/><path d="M315 113H325"/></g>':''}
 <path d="M311 133Q319 139 328 132" fill="none" stroke="#956e59" stroke-width="2" stroke-linecap="round"/></g>
 <g class="reception-staff-hand"><path d="M284 202L309 219 297 230 269 219Z" fill="${coat}"/><path d="M298 218Q308 213 318 220L329 224Q333 232 319 234L298 231Z" fill="#cea487"/></g></g>
 <path d="M192 226L450 221V239L188 245Z" fill="#98734f"/><path d="M193 241L450 235V300H193Z" fill="#c7a779"/><path d="M202 246H443" stroke="#dec49a" stroke-width="3"/>
 <path d="M231 219L267 219 274 233 226 234Z" fill="#f1e6cd"/><text x="250" y="230" text-anchor="middle" fill="#736449" font-size="10" font-family="Meiryo,sans-serif">受付</text><rect x="346" y="222" width="41" height="7" rx="1" fill="#e8dbc1"/><path d="M351 218L382 221" stroke="#738776" stroke-width="3" stroke-linecap="round"/>
 </svg>`;
 const doc=new DOMParser().parseFromString(art,'image/svg+xml'),svg=doc.documentElement,staff=svg.querySelector('.reception-staff'),head=svg.querySelector('.reception-staff-head');
 // Rear hair belongs behind the neck and uniform, never in front of the collar.
 if(clinic)staff.prepend(head.firstElementChild);
 if(doctor){
  staff.firstElementChild.remove();
  head.innerHTML='<path d="M286 98Q282 69 310 66Q343 60 353 85L350 121 342 141Q321 157 302 141L289 122Z" fill="#cda081"/><path d="M285 109L282 85Q285 66 306 63L329 62 350 75 355 92 346 108 342 84 326 78 308 84 293 80 293 111Z" fill="#7d8073"/><path d="M289 100L294 117M346 99L345 117" stroke="#ddd7c3" stroke-width="4"/><g class="reception-staff-eyes"><path d="M302 111h8m19 0h8" stroke="#514a3c" stroke-width="2.5" stroke-linecap="round"/></g><path d="M320 111l-3 12 6 1M310 134q10 5 19-1" fill="none" stroke="#8e6650" stroke-width="1.7"/><path d="M304 143l8 5 17-1 11-7" fill="none" stroke="#a09a85" stroke-width="3"/>';
 }
 if(!doctor){
  const group=doc.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('transform','translate(0 180)');
  while(svg.firstChild)group.append(svg.firstChild);svg.append(group);
  svg.setAttribute('viewBox','0 0 450 750');svg.setAttribute('preserveAspectRatio','xMidYMax slice');
  const background=doc.createElementNS('http://www.w3.org/2000/svg','path');background.setAttribute('d','M0 0H450V750H0Z');background.setAttribute('fill',wall);svg.prepend(background);
  const floor=doc.createElementNS('http://www.w3.org/2000/svg','path');floor.setAttribute('d','M0 410H450V750H0Z');floor.setAttribute('fill','#cfb58c');group.before(floor);
 }
 return new XMLSerializer().serializeToString(svg);
}
function storeBackground(state){
 const t=document.createElement('template');t.innerHTML=bookScene('petshop',state);const svg=t.content.querySelector('svg');
 const ns='http://www.w3.org/2000/svg',group=cls=>{const g=document.createElementNS(ns,'g');g.setAttribute('class',cls);return g};
 const rabbit=svg.querySelector('ellipse[cx="113"][cy="370"]');
 if(rabbit){const g=group('store-rabbit');g.setAttribute('transform','translate(37 117) scale(.7)');g.setAttribute('aria-label','耳を動かすウサギ');g.innerHTML=`<ellipse cx="118" cy="392" rx="39" ry="4" fill="#aa9671" opacity=".22"/>
 <g class="store-rabbit-body"><path d="M88 371L78 367 74 375 80 384 91 382Z" fill="#eee4cc"/>
 <path d="M84 376L91 356 109 347 130 352 142 375 137 389 96 391 84 384Z" fill="#b7ad8f"/><path d="M91 357L106 351 117 355 108 364 91 369Z" fill="#c9c0a3"/>
 <path d="M104 370L97 380 102 390 124 390 128 386 112 383" fill="#a49b80"/><path d="M125 363L135 367 141 387 135 392 120 391 119 387 129 385Z" fill="#e6dcc2"/>
 <g class="store-rabbit-head"><g class="store-rabbit-ear"><path d="M120 341L109 313 110 297 116 294 122 302 130 337Z" fill="#b7ad8f"/><path d="M119 330L114 311 114 302 117 308 124 333Z" fill="#c99d8e"/></g>
 <path d="M130 337L132 306 138 297 143 299 145 310 139 342Z" fill="#d1c7aa"/><path d="M135 331L136 311 140 304 140 316 138 334Z" fill="#c99d8e"/>
 <path d="M113 339L129 332 145 336 151 348 160 357 151 366 131 369 117 360 111 350Z" fill="#d1c7aa"/><path d="M145 350L160 357 151 366 136 365 138 357Z" fill="#eee4cc"/>
 <g class="store-rabbit-eye"><path d="M135 344Q141 341 146 345L144 350Q138 351 135 347Z" fill="#ede5c9"/><ellipse cx="141" cy="346" rx="2.6" ry="3.5" fill="#303b33"/></g>
 <path class="store-rabbit-nose" d="M155 354L161 356 157 359Z" fill="#bd8b7d"/><path d="M156 359L154 363 150 363" fill="none" stroke="#786d5d" stroke-width="1"/><path d="M148 357L137 354M148 361L136 363" stroke="#9b9e91" stroke-width="1"/></g></g>`;
 rabbit.before(g);svg.querySelectorAll('ellipse[cx="113"][cy="370"],ellipse[cx="129"][cy="344"],ellipse[cx="123"][cy="318"],ellipse[cx="139"][cy="321"],circle[cx="138"][cy="344"]').forEach(n=>n.remove());}
 // Match the reception staff's head/torso proportions; keep the shoulders above the counter.
 const clerk=svg.querySelector('.shop-clerk');if(clerk){clerk.setAttribute('transform','translate(305 350)');clerk.innerHTML=`
 <path class="store-clerk-torso" d="M-44 86L-38 34Q-33 20-13 19L15 19Q35 21 40 34L46 86Z" fill="#9eae95"/>
 <path d="M-10 11L-10 24 1 35 12 23 12 10Z" fill="#bd916d"/>
 <path d="M-24 23L-17 43 18 43 26 24 33 86-30 86Z" fill="#667d59"/>
 <path d="M-18 58H20V77H-17Z" fill="#788c68"/><rect x="-11" y="48" width="24" height="9" rx="1" fill="#eee4c9"/><path d="M-6 52H7" stroke="#9c9d7b" stroke-width="1.5"/>
 <g class="store-clerk-head"><path d="M-26-19Q-29-42-5-45Q21-46 27-24L25-4 17 11Q3 24-13 12L-24-2Z" fill="#c59c78"/>
 <path d="M-25-6L-31-22-27-38-15-45-4-44 5-49 22-43 29-31 28-12 19-24 11-20 0-31-10-23-19-27Z" fill="#505344"/>
 <path class="store-clerk-eyes" d="M-17-8L-9-9M8-9L16-8" fill="none" stroke="#505344" stroke-width="2.3" stroke-linecap="round"/>
 <path d="M-2-6L-4 1 1 2" fill="none" stroke="#ad7e5e" stroke-width="1.3"/><path d="M-7 7Q1 13 9 6" fill="none" stroke="#765640" stroke-width="1.7" stroke-linecap="round"/></g>
 <g class="store-bird-perch"><g class="shoulder-bird">
 <path d="M38 20L52 44 46 42 43 46 32 23Z" fill="#697e55"/><path d="M27-5L40-7 48 4 46 20 38 27 28 21 24 10Z" fill="#b4bc7d"/>
 <path d="M26-7L25-17 29-23 38-25 44-18 43-8 36-1Z" fill="#e5ce84"/><path d="M29-21L28-29 33-24 36-30 38-24" fill="#d8c277"/>
 <path d="M26-14L20-10 25-6 28-9Z" fill="#b58d58"/><path d="M28-16Q31-19 34-16L33-12 29-12Z" fill="#ede6c9"/><ellipse cx="30.5" cy="-15" rx="1.5" ry="2" fill="#303b33"/>
 <path d="M35-10L40-11 42-6 38-4 34-6Z" fill="#c98e66"/>
 <path class="store-bird-wing" d="M40 1L47 6 45 24 36 16 34 5Z" fill="#7c9163"/><path d="M38 9L42 17M40 6L44 13" stroke="#a5b27d" stroke-width="1.2"/>
 </g><path d="M32 24L31 29 27 29M39 25L39 30 35 30" fill="none" stroke="#8f7954" stroke-width="1.6" stroke-linecap="round"/></g>`;
 const hand=group('store-clerk-hand');hand.innerHTML='<path d="M-25 88Q-44 87 -49 105L-30 105 -10 90" fill="#9eae95"/><path d="M-49 104Q-42 96 -31 102L-17 106Q-12 112 -22 115L-46 114Z" fill="#bd916d"/>';clerk.append(hand);}
 const register=svg.querySelector('.register');if(register){const hand=clerk?.querySelector('.store-clerk-hand');if(hand){const arm=group('store-counter-arm');arm.setAttribute('transform','translate(305 322)');arm.append(hand);register.before(arm);}register.querySelectorAll('text').forEach(n=>n.remove());const face=group('store-register-face');face.innerHTML='<circle cx="-19" cy="-44" r="5" fill="#edd083" stroke="#b48b40" stroke-width="1.5"/><text class="store-register-total" x="5" y="-40" text-anchor="middle" font-family="Meiryo,sans-serif" font-size="10" fill="#40513a">—</text><path class="store-register-receipt" d="M13 5V-11L16-9 19-11 22-9 25-11 28-9V5Z" fill="#fff3d7"/><g class="store-register-drawer"><path d="M-35 14L30 12 32 20 -36 22Z" fill="#55614e"/><path d="M-11 17L7 16" stroke="#c6d1b8" stroke-width="2"/></g>';register.append(face);}
 // The authored shop ends at y=760. Do not include empty coordinates below its floor.
 svg.setAttribute('viewBox','0 200 450 560');svg.setAttribute('preserveAspectRatio','xMidYMin slice');return svg.outerHTML;
}

const ADOPTION_COLORS=["#7f927f","#b99179","#9e9b7e","#7e9699","#9c879a","#b49b72"];
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



function bookScene(){return `<svg xmlns="http://www.w3.org/2000/svg"><g class="shop-clerk"></g><ellipse cx="113" cy="370"/></svg>`}
