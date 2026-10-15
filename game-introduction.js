'use strict';
function seniorArt(){return `<svg viewBox="0 0 220 270" aria-label="ネコを抱いた保護主のせんぱい" role="img">
<ellipse cx="113" cy="258" rx="65" ry="9" fill="#6c705b22"/>
<path d="M70 187h81l5 66h-34l-10-48-9 48H70Z" fill="#777b68"/>
<path d="M62 114Q77 94 109 96Q143 95 160 116l13 84H48Z" fill="#b98466"/>
<path d="M91 95l18 22 19-22 11 105H78Z" fill="#f4ead2"/>
<path d="M91 87h34v20q-17 17-34 0" fill="#d9b38d"/>
<path d="M68 63Q60 14 105 12q48-4 49 51l-7 35H72Z" fill="#655d4d"/>
<ellipse cx="109" cy="65" rx="35" ry="40" fill="#e3bd98"/>
<path d="M73 57Q62 18 104 14q39-4 46 38l-24-18-14 10-13-9Z" fill="#655d4d"/>
<path d="M87 64l9-1m26 0 9 1" stroke="#615a49" stroke-width="3" stroke-linecap="round"/>
<path d="M100 83q10 7 19-1" fill="none" stroke="#a57660" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="86" cy="76" rx="7" ry="3" fill="#dca58c"/><ellipse cx="133" cy="76" rx="7" ry="3" fill="#dca58c"/>
<g class="senior-held-cat"><path d="M86 155q-20 22 3 38h52q26-8 10-33" fill="#d7bf8e"/><path d="M148 177q31 6 23-16q-4-10-11-4" fill="none" stroke="#d7bf8e" stroke-width="10" stroke-linecap="round"/>
<path d="M82 148l-1-29 18 13q12-5 22 0l18-14-2 30q6 26-27 27-34-1-28-27" fill="#e1c99a"/>
<path d="M85 126l3 16 8-7m38-8-3 15-7-7" fill="#bd947d"/>
<path d="M93 148q4 4 8 0m18 0q4 4 8 0" fill="none" stroke="#70674e" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="110" cy="158" rx="10" ry="6" fill="#f5ead1"/><path d="M107 155h6l-3 4Z" fill="#af8870"/>
<path d="M104 133l3 8m8-8-2 8" stroke="#b49a68" stroke-width="3"/>
</g><path d="M63 134q-7 34 31 49m64-45q10 34-39 49" fill="none" stroke="#b98466" stroke-width="22" stroke-linecap="round"/>
<path d="M91 181l19 4m11 1-15 4" stroke="#e3bd98" stroke-width="12" stroke-linecap="round"/>
</svg>`;}
const INTRODUCTION_PAGES=[
 ['この街にも、どの街にも','野良猫がいます。空き地や路地裏。外で生きるのは危険もいっぱい。それでもネコは増えていくのです。'],
 ['野良猫から地域猫に。','過酷な環境で生きるネコが増えないようにする。これが保護猫活動を通じたネコとヒトの共生です。'],
 ['あなたにできること','野良猫を保護して、育てて地域に戻し見守る。']
];
function introductionLandscape(){return `<svg class="introduction-landscape" viewBox="0 0 375 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<path fill="#dce2cf" d="M0 0h375v400H0z"/><circle cx="300" cy="65" r="27" fill="#f4e6b3"/>
<path fill="#f6efdb" d="M22 54q10-17 27-6 23-13 31 8H22m166 39q16-26 36-8 19-10 30 10h-66"/>
<path fill="#bdc8af" d="M0 196q77-38 161 8t214-18v214H0"/>
<path fill="#e5d9bb" d="M0 134h92v119H0m287-89h88v99h-88"/><path fill="#a49178" d="M0 127h98v9H0m281 29h94v9h-94"/>
<path fill="#a9c4bd" stroke="#f6edda" stroke-width="4" d="M16 157h25v31H16zm38 0h24v31H54zm253 24h24v27h-24"/>
<path fill="#d6c19a" d="M177 233q-24 70-79 167h172q-43-75-63-167"/>
<path d="M0 259l99-11m-82-12v45m39-49v44m38-48v43" stroke="#9b8d6e" stroke-width="5"/>
<g fill="#929c78"><ellipse cx="40" cy="310" rx="22" ry="16"/><path d="M26 301l-2-26 13 8 13-9 4 27Z"/><path d="M59 309q24-22 24-5" fill="none" stroke="#929c78" stroke-width="8" stroke-linecap="round"/></g>
<g fill="#a98d6d"><ellipse cx="315" cy="278" rx="20" ry="13"/><path d="M303 271l-2-23 12 7 13-9 2 24Z"/></g>
<g fill="#64735c"><path d="M58 297h3v3h-3zm11-1h3v3h-3"/><path d="M306 263h3v3h-3zm13-1h3v3h-3"/></g>
<path fill="#a8b58b" d="M0 355q24-31 67 0 33-17 57 22H0m253-54q32-28 62-3 41-21 60 18v62H253Z"/>
</svg>`;}
renderOpeningStory=function(state){
 const i=Math.max(0,Math.min(2,state.onboarding.storyIndex)),[heading,copy]=INTRODUCTION_PAGES[i];
 return `<section class="introduction-scene" aria-label="保護猫活動のはじまり"><div class="introduction-picture">${introductionLandscape()}<div class="introduction-senior">${seniorArt()}</div></div><section class="introduction-dialogue"><small>保護主のせんぱい</small><h1>${heading}</h1><p>${copy}</p><nav aria-label="導入ページ"><button class="introduction-back" data-action="previous-story" aria-label="ひとつ前へ" ${i?'':'disabled'}>←</button><button class="introduction-next" data-action="next-story">${i===2?'活動をはじめる':'つぎへ'} <span aria-hidden="true">→</span></button></nav><div class="introduction-pages" aria-label="${i+1} / 3">${INTRODUCTION_PAGES.map((_,n)=>`<i class="${i===n?'current':''}"></i>`).join('')}</div></section></section>`;
};
