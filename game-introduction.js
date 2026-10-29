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
 return `<svg class="senior-held-cat" x="60" y="91" width="104" height="105" viewBox="290 150 165 230" preserveAspectRatio="xMidYMax meet" data-companion="senior-gray-tux-v1" aria-hidden="true">${content}</svg>`;
}
function seniorArt(){return `<svg viewBox="0 0 220 270" aria-label="ネコを抱いた保護主のせんぱい" role="img">
<ellipse cx="113" cy="258" rx="65" ry="9" fill="#6c705b22"/>
<path d="M70 187h81l5 66h-34l-10-48-9 48H70Z" fill="#777b68"/>
<g class="senior-upper">
<path d="M91 98Q77 101 68 110Q56 122 55 142L48 200H173L165 141Q164 122 152 111Q141 101 126 98Z" fill="#b98466"/>
<path d="M91 95l18 22 19-22 11 105H78Z" fill="#f4ead2"/>
<path d="M91 87h34v20q-17 17-34 0" fill="#d9b38d"/>
<g class="senior-head">
<path d="M68 63Q60 14 105 12q48-4 49 51l-7 35H72Z" fill="#655d4d"/>
<ellipse cx="109" cy="65" rx="35" ry="40" fill="#e3bd98"/>
<path d="M73 57Q62 18 104 14q39-4 46 38l-24-18-14 10-13-9Z" fill="#655d4d"/>
<g class="senior-face-features"><path d="M87 64l9-1m26 0 9 1" stroke="#615a49" stroke-width="3" stroke-linecap="round"/>
<path d="M100 83q10 7 19-1" fill="none" stroke="#a57660" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="86" cy="76" rx="7" ry="3" fill="#dca58c"/><ellipse cx="133" cy="76" rx="7" ry="3" fill="#dca58c"/></g>
</g>
${seniorCompanionArt()}<path d="M66 129Q58 152 69 169Q77 181 94 187M153 129Q163 154 148 170Q138 180 124 186" fill="none" stroke="#b98466" stroke-width="18" stroke-linecap="round"/>
<path d="M92 185Q102 190 111 189M125 185Q118 190 110 190" fill="none" stroke="#e3bd98" stroke-width="10" stroke-linecap="round"/>
</g>
</svg>`;}
// Dialogue is centrally maintained in game-dialogue.js.
function introductionLandscape(){return `<svg class="introduction-landscape" viewBox="0 0 375 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<path fill="#dce2cf" d="M0 0h375v700H0z"/><circle cx="300" cy="65" r="27" fill="#f4e6b3"/>
<path fill="#f6efdb" d="M22 54q10-17 27-6 23-13 31 8H22m166 39q16-26 36-8 19-10 30 10h-66"/>
<path fill="#71876e" d="M0 156q77-38 161 8t214-18V700H0Z"/>
<g transform="translate(0 -35)">
<path fill="#e5d9bb" d="M0 134H92V253H0Z M287 174H375V263H287Z"/><path fill="#a49178" d="M0 127H98V136H0Z M281 165H375V174H281Z"/>
<path fill="#a9c4bd" stroke="#f6edda" stroke-width="4" d="M16 157H41V188H16Z M54 157H78V188H54Z M307 183H331V210H307Z"/>
<path d="M0 259l99-11m-82-12v45m39-49v44m38-48v43" stroke="#9b8d6e" stroke-width="5"/>
</g>
<path fill="#637d5c" d="M-12 355Q24 324 67 355Q100 338 124 377Q73 388-12 384Z"/>
</svg>`;}
function introductionForeground(){return `<svg class="introduction-foreground" viewBox="0 0 375 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path fill="#637d5c" d="M239 700Q270 580 251 500Q242 474 275 464Q296 456 315 470Q356 449 387 488V710Z"/></svg>`;}
renderOpeningStory=function(state){
 const i=Math.max(0,Math.min(INTRODUCTION_PAGES.length-1,state.onboarding.storyIndex)),[,copy]=INTRODUCTION_PAGES[i];
 return `<section class="introduction-scene" aria-label="保護猫活動のはじまり"><div class="introduction-picture">${introductionLandscape()}${introductionForeground()}</div><section class="introduction-dialogue"><div class="introduction-speech shared-guide-note">${seniorDialogueContents(copy,`<button class="introduction-back" data-action="previous-story" aria-label="ひとつ前へ" ${i?'':'disabled'}>←</button><button class="introduction-next" data-action="next-story">${i===INTRODUCTION_PAGES.length-1?'はじめる':'つぎへ <span aria-hidden="true">›</span>'}</button>`).replace('class="first-senior"','class="first-senior introduction-senior"')}</div><div class="introduction-pages" aria-label="${i+1} / ${INTRODUCTION_PAGES.length}">${INTRODUCTION_PAGES.map((_,n)=>`<i class="${i===n?'current':''}"></i>`).join('')}</div></section></section>`;
};
