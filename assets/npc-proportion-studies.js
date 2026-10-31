'use strict';
// Full-body proposals based on the approved receptionist, retaining native heads.
function studyGroup(svg,cls,markup){const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class',cls);g.innerHTML=markup;return g;}
function completeOtherReception(svg,kind){
 const staff=svg.querySelector('.reception-staff'),upper=staff.querySelector('.actor-breath')||staff,doctor=kind==='doctor';
 const coat=doctor?'#f6f1e2':'#839575',trousers=doctor?'#82877a':'#8c8067';
 const lower=studyGroup(svg,'staff-lower-study',`<path d="M285 273H374L377 314L364 424H338L331 317L322 424H295L282 314Z" fill="${trousers}"/><path d="M331 299V317M296 420H322M338 420H364" stroke="${doctor?'#71776b':'#7b7059'}" fill="none" stroke-width="1.5"/><path d="M295 421Q308 426 322 421L322 435H286Q281 430 295 421Z M338 421Q351 426 364 421L375 429Q378 435 369 435H338Z" fill="#655f51"/>`);
 staff.prepend(lower);
 if(!doctor){const legs=studyGroup(svg,'plaza-leg-length','');lower.before(legs);legs.append(lower);legs.setAttribute('transform','translate(0 273) scale(1 1.2) translate(0 -273)');}
 upper.prepend(studyGroup(svg,'staff-abdomen-study',doctor?`<path d="M274 220H383L386 234L377 272L381 310Q356 315 333 310L329 283L325 310Q302 315 278 310L282 272L272 233Z" fill="${coat}"/><path d="M329 230V282" stroke="#d5d7c9" stroke-width="1.8"/><circle cx="329" cy="249" r="1.8" fill="#97a292"/><circle cx="329" cy="269" r="1.8" fill="#97a292"/><path d="M288 275H308V293H288Z M350 275H371V293H350Z" fill="#e4e6d9"/>`:`<path d="M274 220H383L386 234L376 270L378 285Q330 291 280 285L283 267L272 233Z" fill="${coat}"/><path d="M291 220H358L363 315Q328 322 286 315Z" fill="#657d57"/><path d="M304 273H346V297Q324 302 304 297Z" fill="#738a63"/><path d="M306 276H344" stroke="#8a9e79" stroke-width="1.5"/>`));
 return svg;
}
function completeStoreClerk(svg){
 const clerk=svg.querySelector('.shop-clerk'),upper=clerk.querySelector('.actor-breath')||clerk;
 // The original hand was laid on the counter. Connect that hand to the sleeve,
 // without changing the clerk's face, shoulder bird or working pose.
 const hand=upper.querySelector('.store-clerk-hand');if(hand)hand.setAttribute('transform','translate(0 -5)');
 clerk.prepend(studyGroup(svg,'store-lower-study','<path d="M-32 125H33L36 158L27 267H7L1 162L-6 267H-27L-36 158Z" fill="#918364"/><path d="M1 145V162M-27 264H-6M7 264H27" stroke="#7f7358" stroke-width="1.5" fill="none"/><path d="M-27 264Q-17 268-6 264V276H-35Q-39 271-27 264Z M7 264Q17 268 27 264L37 271Q39 276 31 276H7Z" fill="#615e4c"/>'));
 upper.prepend(studyGroup(svg,'store-abdomen-study','<path d="M-43 78H43L46 87L36 120L38 142Q0 148-37 142L-35 120L-44 86Z" fill="#9eae95"/><path d="M-30 77H33L31 114L33 160Q0 167-34 160L-32 114Z" fill="#667d59"/><path d="M-20 119H20V143Q0 147-20 143Z" fill="#788c68"/><path d="M-17 123H17" stroke="#94a385" stroke-width="1.3"/>'));
 for(const part of svg.querySelectorAll('.store-lower-study,.store-abdomen-study'))part.setAttribute('transform','translate(0 86) scale(1 .83) translate(0 -86)');
 return svg;
}
