'use strict';
// Hand-authored vector cut-paper pieces. No emoji or font dependencies.
window.LifeArt=(()=>{
 const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80">${body}</svg>`;
 const grain='<path d="M32 42l5 -1m13 8 4 -2m10 -12 3 1" fill="none" stroke="#f5ebd3" stroke-width="1.2" opacity=".45"/>';
 const hair=[
 'M17 48Q10 36 28 39Q15 22 37 32Q33 12 49 29Q63 12 61 32Q88 24 74 42Q94 53 70 54Q55 68 44 55Q20 65 17 48Z',
 'M12 46Q19 33 30 40Q18 18 42 33Q50 8 57 32Q82 17 70 40Q94 41 78 54Q55 60 46 52Q24 67 12 46Z',
 'M18 54Q3 40 28 39Q22 21 43 34Q41 15 54 31Q77 14 66 37Q89 28 79 47Q89 60 62 54Q33 65 18 54Z',
 'M10 50Q7 35 28 40Q28 20 43 35Q58 10 61 36Q76 28 72 43Q96 48 73 58Q56 53 42 59Q22 62 10 50Z',
 'M21 53Q4 42 30 36Q13 20 42 30Q49 17 55 35Q86 13 69 41Q97 47 76 55Q46 65 21 53Z',
 'M13 47Q12 29 32 38Q36 17 47 35Q67 18 64 38Q87 32 80 49Q88 60 65 55Q38 67 13 47Z'
 ].map(d=>svg(`<path d="${d}" fill="#b6a58a" opacity=".7"/><path d="M29 45q13-12 21-5m-9 13q13-14 22-9" fill="none" stroke="#8d7c65" stroke-width="1.6" stroke-linecap="round"/>`));
 const poop=svg('<path d="M17 54Q10 42 26 37Q22 24 37 24Q40 12 50 16Q59 12 66 26Q81 23 79 38Q93 44 81 56Q50 68 17 54Z" fill="#796044"/><path d="M28 38q17 9 34 0M40 26q11 6 20 1" fill="none" stroke="#a28a62" stroke-width="3" stroke-linecap="round"/>'+grain);
 const vomit=svg('<path d="M10 49Q3 33 26 34Q27 21 44 29Q67 17 73 32Q98 29 89 48Q100 61 74 61Q62 72 47 61Q22 70 21 59Q7 62 10 49Z" fill="#c3ad79"/><path d="M24 46Q31 36 42 42Q62 30 76 44Q81 52 64 54Q37 60 24 46" fill="#dcc795"/><path d="M32 41l8 2-3 6-7-2zm24 9 5-7 6 4-4 7z" fill="#a68b5c"/><path d="M15 25l4-2m69 37 3 2" stroke="#c3ad79" stroke-width="4" stroke-linecap="round"/>');
 function bowl(water,level){const filled=level>0;return svg(`<path d="M9 32Q47 19 93 31L82 62Q48 74 20 61Z" fill="${water?'#7f9380':'#bd856b'}"/><path d="M11 31Q50 14 91 30Q98 42 54 47Q9 47 11 31Z" fill="#eee3c7"/><path d="M19 32Q48 22 84 31Q87 40 52 40Q22 41 19 32Z" fill="${filled?(water?'#abc8c6':'#a48861'):'#c2ad88'}"/>${filled?(water?'<path d="M28 33q10-4 19-1m9 1 13-2" fill="none" stroke="#e9eddb" stroke-width="2" stroke-linecap="round"/>':[[28,32],[43,29],[58,33],[72,30],[38,36],[64,37]].slice(0,Math.max(1,Math.ceil(level/100*6))).map(([x,y],i)=>`<path d="M${x-4} ${y-2}q3-4 7 0l-1 5-6-1Z" fill="${i%2?'#705a3e':'#816c46'}"/>`).join('')):''}<path d="M25 56q25 7 50-1" stroke="#eee3c7" stroke-width="2" fill="none" opacity=".45"/>`);}
 const icons={
 inventoryMenu:svg('<path d="M35 25Q31 5 52 8Q71 7 67 27" fill="none" stroke="#785e4c" stroke-width="5"/><path d="M20 24L78 22 84 70Q47 77 16 68Z" fill="#b58269"/><path d="M22 26L77 24 68 45 30 43Z" fill="#d6ad84"/><path d="M47 37l10-1 1 15-10 1Z" fill="#eee0b7"/><path d="M30 58l37-2" stroke="#795e4c" stroke-width="2"/>'),
 layout:svg('<path d="M8 36L49 6 91 34 81 41 48 18 17 44Z" fill="#b57861"/><path d="M22 37L49 21 77 39 75 72 23 70Z" fill="#dbbd8f"/><path d="M43 71V47h17v25" fill="#7f8f78"/><path d="M29 40h10v12H29Z" fill="#f4e8c9"/>'),
 outing:svg('<path d="M49 75Q14 43 24 21Q36 0 59 10Q91 23 65 52Z" fill="#82927d"/><path d="M36 28Q38 15 52 20Q65 22 58 36Q46 45 36 28" fill="#eee2c3"/><path d="M13 72q14-9 25-3m26 2 22-5" fill="none" stroke="#c5ac82" stroke-width="3" stroke-linecap="round"/>'),
 schedule:svg('<path d="M18 15L83 18 79 73 15 70Z" fill="#ece0be"/><path d="M18 15L83 18 81 34 17 30Z" fill="#ad7b68"/><path d="M32 10v15m35-13-1 14" stroke="#6f705b" stroke-width="5" stroke-linecap="round"/><path d="M28 43h10m10 1h10m10 0h5M28 56h10m10 1h10" stroke="#a59671" stroke-width="4"/><path d="M65 57l4 4 8-10" fill="none" stroke="#a96552" stroke-width="3"/>'),
 notebook:svg('<path d="M14 13Q32 8 49 17Q68 8 87 14L84 70Q65 64 49 73Q31 65 12 69Z" fill="#d3bc90"/><path d="M19 17Q34 15 47 21L47 65Q33 60 18 63Z" fill="#f4e8cb"/><path d="M52 21Q67 14 82 18L79 63Q65 59 52 65Z" fill="#e8dab8"/><path d="M27 29l12 2m-12 8 12 2m21-10 12-2m-12 10 12-2" stroke="#ae9b78" stroke-width="2"/>')};
 return {hair,poop,vomit,bowl,icons};
})();
