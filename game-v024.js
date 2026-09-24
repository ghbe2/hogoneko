'use strict';
const paperGlyph=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">${body}</svg>`;
const careArt={
 hand:paperGlyph('<path d="M24 68L18 46Q14 36 20 35L28 44 26 19Q26 12 31 15L36 36 36 11Q39 5 42 13L44 35 48 15Q53 10 54 18L52 39 59 25Q65 22 63 31L59 56Q51 75 24 68Z" fill="#bf9872"/><path d="M32 48q9-5 16 1" stroke="#8f6e51" stroke-width="2" fill="none"/>'),
 comb:paperGlyph('<path d="M14 17Q40 10 64 17L63 31 14 32Z" fill="#81927d"/><path d="M18 29v31m8-31v33m8-33v32m8-32v33m8-33v32m8-32v29" stroke="#a2a88b" stroke-width="4" stroke-linecap="round"/>'),
 wipe:paperGlyph('<path d="M14 29L58 22 70 62 23 70Z" fill="#9eaa91"/><path d="M26 32L48 13 61 21 53 40Z" fill="#f2e4c8"/><path d="M25 50l30-5" stroke="#e1d6b7" stroke-width="5"/>'),
 call:paperGlyph('<path d="M18 39L44 26 53 52 22 49Z" fill="#ba8c6b"/><path d="M24 49l7 17 9-5-7-15" fill="#86765b"/><path d="M57 24l7-7m-5 22 12-1m-14 16 9 7" stroke="#ab8b5e" stroke-width="3" stroke-linecap="round"/>'),
 roll:paperGlyph('<path d="M20 19Q41 10 59 19L60 59Q38 69 21 58Z" fill="#e7d8b6"/><ellipse cx="40" cy="20" rx="20" ry="10" fill="#f4ead1"/><ellipse cx="40" cy="20" rx="8" ry="4" fill="#aa9270"/><path d="M53 30l13-4 2 37-15 3Z" fill="#f4ead1"/>'),
 spray:paperGlyph('<path d="M29 34L50 34 60 66Q41 74 20 65Z" fill="#899e96"/><path d="M28 16L57 14 61 25 44 28 43 37 32 36 33 27 24 26Z" fill="#aa8066"/><path d="M29 48l22-1 3 13-27 1Z" fill="#eaddbb"/>'),
 tin:paperGlyph('<path d="M19 22L61 22 62 62Q42 72 18 62Z" fill="#a58d72"/><ellipse cx="40" cy="22" rx="22" ry="8" fill="#ddd1b2"/><path d="M20 34h41v21H20Z" fill="#82937b"/><path d="M29 44q10-10 17 0l8-6v13l-8-7q-9 10-17 0" fill="#e9d8ac"/>'),
 fish:paperGlyph('<path d="M10 42Q35 12 55 37L71 26 68 59 55 47Q31 67 10 42Z" fill="#899e96"/><circle cx="24" cy="39" r="2" fill="#514b3b"/><path d="M38 34l-5 9 5 8" fill="none" stroke="#cbd0b4" stroke-width="2"/>'),
 coin:paperGlyph('<path d="M39 10Q65 8 68 37Q71 66 42 69Q12 70 11 42Q9 14 39 10" fill="#c2a269"/><path d="M38 22Q56 19 57 41Q56 57 39 57Q23 55 23 39Q23 25 38 22" fill="none" stroke="#e5cc94" stroke-width="3"/>'),
 heart:paperGlyph('<path d="M40 68Q0 41 14 20Q26 7 40 25Q54 6 67 23Q79 43 40 68" fill="#b98278"/>')
};
for(const t of TOUCH_TOOLS)t.emoji=bookImage(careArt[t.id==='pet'?'hand':t.id==='comb'?'comb':'wipe']);
for(const [id,key] of Object.entries({clean_paper:'roll',clean_wipe:'wipe',clean_spray:'spray'})){getCleaner(id).emoji=bookImage(careArt[key]);bookIcons[id]=careArt[key];}
for(const [id,key] of Object.entries({food_wet:'tin',food_fish:'fish',food_chicken:'tin',food_soup:'tin'})){getFood(id).emoji=bookImage(careArt[key]);bookIcons[id]=careArt[key];}
for(const [id,key] of Object.entries({groom_comb:'comb',groom_wipe:'wipe'}))bookIcons[id]=careArt[key];
for(const product of SHOP_CATALOG)if(bookIcons[product.id])product.emoji=bookImage(bookIcons[product.id]);
const faceSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');faceSvg.setAttribute('xmlns','http://www.w3.org/2000/svg');faceSvg.setAttribute('viewBox','280 112 160 130');
const faceRig=CatSVG.buildCat(faceSvg,'paper-cat-icon',{...CatSVG.defaults,headCoat:'cream',bodyCoat:'cream',ears:'tall'},375,1);CatSVG.applyPose(faceRig,CatSVG.poseModel('sit',0),0,'sit');
const paperCatIcon=new XMLSerializer().serializeToString(faceSvg);
const paperEmojiMap={'📣':careArt.call,'✋':careArt.hand,'🤲':careArt.hand,'🪮':careArt.comb,'🧴':careArt.wipe,'🧻':careArt.roll,'🧼':careArt.wipe,'🫧':careArt.spray,'🥫':careArt.tin,'🐟':careArt.fish,'🐱':paperCatIcon,'🐈':paperCatIcon,'😺':paperCatIcon,'🐾':paperCatIcon,'💰':careArt.coin,'🪙':careArt.coin,'🎒':LifeArt.icons.inventoryMenu,'📅':LifeArt.icons.schedule,'📒':LifeArt.icons.notebook,'🏠':LifeArt.icons.layout,'👜':LifeArt.icons.inventoryMenu};
const paperV024Render=render;
render=function(state){paperV024Render(state);
 app.querySelectorAll('.lift-tip').forEach(n=>n.innerHTML='<svg viewBox="0 0 32 18" width="26" height="16"><path d="M6 15Q4 3 15 3Q27 2 25 15M11 10l1 4m8-5-1 5" fill="none" stroke="#8b7657" stroke-width="1.5" stroke-linecap="round"/></svg>');
 const walker=document.createTreeWalker(app,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const pattern=new RegExp('('+Object.keys(paperEmojiMap).join('|')+')','gu');
 for(const node of nodes){if(node.parentElement.closest('svg,script,style,textarea,input'))continue;const chunks=node.textContent.split(pattern);if(chunks.length===1)continue;const frag=document.createDocumentFragment();for(const chunk of chunks){if(paperEmojiMap[chunk]){const span=document.createElement('span');span.className='paper-inline';span.innerHTML=bookImage(paperEmojiMap[chunk]);span.setAttribute('aria-hidden','true');frag.append(span);}else frag.append(document.createTextNode(chunk));}node.replaceWith(frag);}
 for(const node of app.querySelectorAll('.shed-hair')){const h=getCat(state).body.hair.find(h=>h.id===node.dataset.hair);const image=node.querySelector('img');if(image)image.style.opacity=String(1-(h?.wipeProgress||0)*.65);}
};
const worldPaper=document.createElement('style');worldPaper.textContent=`
body,button,input,textarea,select{font-family:"Yu Mincho","Hiragino Mincho ProN","BIZ UDPMincho",serif;letter-spacing:.035em}
button,input,select,.label,.touch-switch-hint{font-weight:600}
.place-chip,.room-chip{background:#e5d6b7!important;color:#7b664b!important;border-radius:10px 6px 12px 7px!important}
.command-slot .command-emoji>.book-icon{max-width:29px;max-height:29px}
.command-slot.main-command .command-emoji>.book-icon{max-width:38px;max-height:38px}
.storybook{--pink:#ac826b;--pink-dark:#87664b;--line:#ccb997;--ink:#594e3e}
.tiered-dock .main-command{border:0;border-radius:44% 51% 43% 48%;background:#eedfc1;box-shadow:1px 3px 0 #876e4433,inset 0 0 0 1px #ba9d6f77}
.tiered-dock .main-command:nth-child(2){border-radius:50% 43% 49% 41%;background:#e8dbb9}
.tiered-dock .main-command:nth-child(3){border-radius:43% 49% 41% 50%;background:#e0dcc0}
.tiered-dock .main-command::after{background:#e9d7b3;color:#72583f;border-radius:3px 7px 2px 5px;box-shadow:0 1px #a88b5e44;letter-spacing:.05em;font-weight:600}
.tiered-dock .main-command small{background:#9b835f;color:#fff1d3;border-radius:4px 6px 3px 5px;font-weight:400}
.lift-tip{top:-15px;left:calc(50% - 13px);text-shadow:none}
.tiered-dock .sub-command{border:0;background:#eaddbe;border-radius:48% 39% 43% 36%;box-shadow:1px 2px 0 #80694733;color:#6a573e}
.tiered-dock .sub-command::before{background:#c3b084}
.command-ghost,.field-drag-ghost{border:0!important;background:none!important;box-shadow:none!important;filter:drop-shadow(1px 5px 2px #57472c44);border-radius:0}
.command-ghost.invalid{filter:drop-shadow(1px 5px 2px #57472c33);opacity:.65}
.drop-ready,.drop-hover,.field-scene.drop-ready,.trap.drop-ready{outline:none!important;box-shadow:none!important}
.drop-hover{filter:drop-shadow(0 2px 3px #f5e5ad)!important}
.rub-tool::before{border:0;background:radial-gradient(ellipse,#ede2ba2b,transparent 70%)}
.paper-inline{display:inline-flex;vertical-align:middle;width:1.3em;height:1.3em;line-height:1}
.paper-inline .book-icon{width:100%;height:100%}
.command-emoji .paper-inline{width:24px;height:24px}
.campaign-button,.primary-button,.bag-shop,.palette-shop{background:#b88f70;color:#fff5dc;border-color:#a17a58;border-radius:14px 8px 17px 10px;box-shadow:0 3px 0 #826345}
.screen-guide,.touch-gesture-guide{background:#f3e6cb;border-color:#c3aa82;color:#796347;border-radius:13px 8px 15px 9px}
.sheet-head h2,.naming-question h1{font-weight:600;letter-spacing:.1em}
.stock{color:#8f7250!important}
`;document.head.appendChild(worldPaper);render(gameState);
