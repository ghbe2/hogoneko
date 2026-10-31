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

