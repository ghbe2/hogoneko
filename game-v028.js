'use strict';
// Static vector fibres: seeded once, cached, no animated noise/filter or new network fetch.
const textureBackground=bookBackground,textureCache=new Map();
function texturedStorySVG(svg,wood){
 const key=(wood?'wood:':'paper:')+svg;if(textureCache.has(key))return textureCache.get(key);
 let seed=261;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let flecks='';for(let i=0;i<180;i++){const x=(rand()*180).toFixed(1),y=(rand()*180).toFixed(1),dx=(rand()*2+.3).toFixed(1);flecks+=`<path d="M${x} ${y}l${dx} -.4" stroke="${i%3?'#766744':'#fff7df'}" stroke-width="${i%4?'.55':'1.1'}" opacity="${i%3?'.12':'.32'}"/>`;}
 const defs=`<defs><pattern id="storybook-fibre-v026" width="180" height="180" patternUnits="userSpaceOnUse">${flecks}</pattern><pattern id="storybook-wood-v026" width="270" height="135" patternUnits="userSpaceOnUse"><path d="M8 31q45-5 95-1t68-2M140 91q49-5 101-1M22 113q21-3 39-1M174 54q26-5 55 0" fill="none" stroke="#85683e" stroke-width=".7" opacity=".15"/><path d="M16 34q32-3 63-1M145 95q36-3 78-1" fill="none" stroke="#eddbb4" stroke-width="1.2" opacity=".25"/></pattern></defs>`;
 const view=svg.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number)||[0,0,450,760];
 const [x,y,w,h]=view;
 const overlay=`${defs}<g pointer-events="none" aria-hidden="true"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#storybook-fibre-v026)"/>${wood?`<rect x="${x}" y="${y+h*.57}" width="${w}" height="${h*.43}" fill="url(#storybook-wood-v026)"/>`:''}</g>`;
 const out=svg.replace(/<\/svg>\s*$/,overlay+'</svg>');textureCache.set(key,out);return out;
}
bookBackground=function(node,svg){
 // Limit texture to scenery; keep icons, cat coats and readable UI paper clean.
 if(node&&svg&&node.matches('.book-room,.field-scene,.capture-inspect,.title-screen,.book-shop-scene'))svg=texturedStorySVG(svg,node.matches('.book-room'));
 return textureBackground(node,svg);
};
render(gameState);
