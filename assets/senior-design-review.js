'use strict';
// Review only. The production character factory is never replaced.
const designs=[
 {id:'A',name:'気さくな先輩',note:'短い外はね髪・丸みのある目・動きやすい上着。',hair:'#655d4d',cloth:'#b98466',back:'M69 64Q60 19 91 15Q138 1 153 48L153 84L164 98L140 95L133 82H84L66 99L56 96L67 81Z',face:'M76 49Q80 28 109 28Q143 28 144 54L140 80Q130 99 110 101Q89 98 79 81Z',front:'M69 60L70 37L85 20L115 16L140 28L151 53L130 46L117 33L104 47L99 36L83 54Z',eyes:3.2},
 {id:'B',name:'頼れる先輩',note:'横分けの短髪・まっすぐな眉・ポケット付きベスト。',hair:'#55584a',cloth:'#788064',back:'M71 77L66 48Q66 18 94 14L127 14L149 31L151 64L141 83Z',face:'M77 45L99 29L126 32L143 49L140 79L127 96L104 101L86 88L78 71Z',front:'M68 56L70 29L95 15L126 13L147 30L153 52L131 44L119 29L99 46L82 54Z',eyes:2.5},
 {id:'C',name:'穏やかな先輩',note:'低いおだんご・たれ目・丸い襟のエプロン。',hair:'#70624f',cloth:'#8c9a83',back:'M69 70Q57 34 80 20Q105 6 133 21Q155 35 150 77L140 92H76Z M145 65Q170 57 174 77Q176 96 153 98L140 87Z',face:'M76 48Q81 29 108 29Q136 29 144 50L141 80Q134 102 110 102Q86 99 79 81Z',front:'M68 58Q65 22 98 15Q136 11 150 46L148 58L132 49L118 32Q102 51 78 56Z',eyes:2.8}
];
const ns='http://www.w3.org/2000/svg';
function path(d,fill){const n=document.createElementNS(ns,'path');n.setAttribute('d',d);n.setAttribute('fill',fill);return n;}
function art(design){const t=document.createElement('template');t.innerHTML=seniorArt();const svg=t.content.firstElementChild,head=svg.querySelector('.senior-head>g'),parts=[...head.children];
 parts[0].replaceWith(path(design.back,design.hair));parts[1].replaceWith(path(design.face,'#e3bd98'));parts[2].replaceWith(path(design.front,design.hair));
 const upper=svg.querySelector('.senior-upper');upper.children[0].setAttribute('fill',design.cloth);
 upper.querySelectorAll('path[stroke="#b98466"]').forEach(n=>n.setAttribute('stroke',design.cloth));
 if(design.id==='B'){upper.children[1].setAttribute('fill','#e3cd9c');const pockets=path('M67 146H84V169H64Z M140 146H158L161 169H141Z','#647358');upper.insertBefore(pockets,upper.querySelector('.senior-held-cat'));}
 if(design.id==='C'){upper.children[0].setAttribute('fill','#eee2c7');upper.querySelectorAll('path[stroke]').forEach(n=>{if(n.getAttribute('stroke')===design.cloth)n.setAttribute('stroke','#eee2c7')});upper.children[1].setAttribute('d','M87 105L99 115H120L132 104L144 200H75Z');upper.children[1].setAttribute('fill',design.cloth);}
 for(const [cls,cx]of [['senior-eye-left',91],['senior-eye-right',127]]){const g=svg.querySelector('.'+cls);g.innerHTML=`<path d="M${cx-5} 56q5 ${design.id==='B'?-1:-3} 10 0" fill="none" stroke="${design.hair}" stroke-width="2" stroke-linecap="round"/><g class="lid" style="transform-origin:${cx}px 65px"><ellipse cx="${cx}" cy="65" rx="${design.eyes}" ry="${design.id==='C'?2.8:3.6}" fill="#615a49"/></g>`;}
 svg.dataset.design=design.id;svg.setAttribute('aria-label',design.name);return svg.outerHTML;
}
for(const d of designs){const card=document.createElement('article');card.innerHTML=`<header><b>${d.id}</b><div><h2>${d.name}</h2><p>${d.note}</p></div></header><div class="stage"><div class="window"><i></i></div><div class="full">${art(d)}</div></div><div class="dialogue"><div class="portrait">${art(d)}</div><div class="copy"><strong>保護主のせんぱい</strong><p>おじゃまします。<br>元気にしていましたか？</p><button class="next">つぎへ <span>›</span></button></div></div>`;document.querySelector('main').append(card);card.querySelector('.portrait svg').setAttribute('viewBox','45 5 135 190');}
let paused=false,elapsed=0,last=performance.now();document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'動きを再開':'動きを止める'};
function animate(now){if(!paused)elapsed+=(now-last)/1000;last=now;const turn=Math.sin(elapsed*.65),breath=Math.sin(elapsed*1.5),blink=(elapsed%4.6)>4.43?.12:1;
 document.querySelectorAll('article svg[data-design]').forEach(svg=>{svg.querySelector('.senior-upper').setAttribute('transform',`translate(0 ${-breath*.35})`);svg.querySelector('.senior-head').setAttribute('transform',`rotate(${turn*1.6} 109 96)`);svg.querySelector('.senior-face-features').setAttribute('transform',`translate(${turn*3.8} 0)`);svg.querySelector('.senior-nose-mouth').setAttribute('transform',`translate(${turn*1.8} 0)`);svg.querySelectorAll('.lid').forEach(n=>n.style.transform=`scaleY(${blink})`);svg.querySelector('.senior-held-cat').style.transform=`translateY(${breath*.45}px)`;});requestAnimationFrame(animate);}
requestAnimationFrame(animate);
