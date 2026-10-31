'use strict';
// A-only design exploration; no production factory or other NPC is changed.
window.seniorFaceRefinement={
 id:'A+',name:'A・髪と肩の調整',note:'大きく流す前髪・片側の外はね。肩はなだらかに。',
 back:'M65 62Q58 22 96 12Q132 5 148 32Q157 49 149 75L146 84Q149 91 157 94Q147 102 136 94L131 74H84L83 89Q77 104 60 101L67 94Q58 95 55 90Q65 85 65 62Z',
 front:'M65 65Q57 25 93 13Q127 5 145 28L150 45L145 58L137 59L133 43L125 30Q119 48 103 52L108 43Q93 54 77 55L78 76L70 86Q64 78 65 65Z',
 detail:'<path d="M139 59Q150 54 149 66Q147 75 140 73Z" fill="#e3bd98"/><path d="M140 64Q145 60 145 66" fill="none" stroke="#bb8f71" stroke-width="1.3"/><path d="M136 40L147 48" fill="none" stroke="#c58c66" stroke-width="5" stroke-linecap="round"/><path d="M137 40L146 46" fill="none" stroke="#e3c49a" stroke-width="1.5" stroke-linecap="round"/>'
};
window.seniorFaceRefinement.adjustBody=svg=>{
 const root=svg.querySelector('.senior-upper'),upper=root.querySelector('.actor-breath')||root;
 upper.children[0].setAttribute('d','M91 98Q82 103 76 113L70 137L66 175Q65 195 64 211L61 225Q82 231 109 225Q136 231 159 225L156 211Q155 193 154 175L150 137L143 113Q136 103 126 98Z');
 const sleeves=upper.querySelector('path[stroke="#b98466"]');
 sleeves.setAttribute('d','M75 127Q69 147 75 164Q81 179 94 187M144 127Q151 147 144 164Q137 179 124 186');
 sleeves.setAttribute('stroke-width','14');
};
