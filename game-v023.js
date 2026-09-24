'use strict';
for(const [id,svg] of Object.entries(LifeArt.icons))TOOL_META[id].emoji=bookImage(svg,'paper-menu-icon');
for(const id of ['starter_food','food_dry','water_refill']){
 const svg=LifeArt.bowl(id==='water_refill',100);bookIcons[id]=svg;getFood(id).emoji=bookImage(svg);
}
bookIcons.bowl=LifeArt.bowl(false,100);bookIcons.water=LifeArt.bowl(true,100);
const paperPlaced=renderPlacedItem;
renderPlacedItem=function(placed,state,...args){
 const html=paperPlaced(placed,state,...args),id=placed.itemId;
 if(!['bowl','water','litter'].includes(id))return html;
 const t=document.createElement('template');t.innerHTML=html;
 if(id==='litter'){const mark=t.content.querySelector('.book-litter-mark');if(mark)mark.innerHTML=bookImage(LifeArt.poop,'life-poop');}
 else{const img=t.content.querySelector('.book-furniture-art');if(img)img.src=bookURI(LifeArt.bowl(id==='water',getCat(state).body[id==='water'?'waterLevel':'foodLevel']||0));}
 return t.innerHTML;
};
const paperLife=renderRoomLife;
renderRoomLife=function(...args){const t=document.createElement('template');t.innerHTML=paperLife(...args);
 t.content.querySelectorAll('.shed-hair').forEach(node=>{let n=0;for(const c of node.dataset.hair)n=(n*31+c.charCodeAt(0))>>>0;node.innerHTML=bookImage(LifeArt.hair[n%6],'life-hair');node.style.setProperty('--hair-angle',`${n%360}deg`);node.style.setProperty('--hair-size',`${15+n%7}px`);});
 const mess=t.content.querySelector('.mess-object');if(mess)mess.innerHTML=bookImage(LifeArt.vomit,'life-vomit');return t.innerHTML;
};
const paperRender=render;
render=function(state){paperRender(state);
 // The cleaning renderer varies the opacity; keep the SVG instead of its old text dots.
 app.querySelectorAll('.book-litter-mark').forEach(mark=>mark.innerHTML=bookImage(LifeArt.poop,'life-poop'));
};
const paperStyle=document.createElement('style');paperStyle.textContent=`
.paper-menu-icon{width:32px;height:29px;object-fit:contain;display:block;pointer-events:none}
.bottom-menu .tool-icon{border:0;background:transparent;border-radius:38% 27% 34% 22%;height:52px;gap:0;box-shadow:none;color:#68563f}
.bottom-menu .tool-icon:nth-child(even){border-radius:24% 40% 26% 35%}
.bottom-menu .tool-icon.selected{border:0;background:#dfc49a;box-shadow:inset 0 -2px #b9966a55;transform:rotate(-2deg)}
.bottom-menu .tool-icon .label{font-size:9px;letter-spacing:.07em}
.bottom-menu{background:#f0e4c9;padding-top:5px;border-top:2px solid #c6b38e}
.menu-sheet,.release-sheet{background:#f7edd7;border:1px solid #c7b08a;border-radius:23px 15px 27px 12px;box-shadow:3px 5px 0 #8b745830,0 13px 30px #534a3825}
.sheet-head{border-bottom:2px solid #d4c19e!important;background:transparent!important}
.inventory-tabs{background:#eee0c1!important;border-bottom:1px solid #d3bd96!important;gap:7px}
.inventory-tab{border:1px solid #c6af88!important;border-radius:9px 5px 10px 6px!important;background:#f8efd9!important;color:#766044!important}
.inventory-tab.active{background:#d6b894!important;border-color:#b18c62!important}
.grid-cell{border:1px solid #d0bd99!important;border-radius:12px 8px 15px 7px!important;background:#faf1df!important;box-shadow:1px 2px 0 #baa07925!important}
.grid-cell.equipped{background:#e6d6b5!important;border-color:#ac805b!important;box-shadow:inset 0 0 0 1px #ac805b!important}
.sheet-close,.field-switch{border-color:#c8b18b!important;background:#f3e6cb!important;color:#755c45!important;border-radius:13px 8px 15px 9px!important}
.life-hair{width:var(--hair-size);height:auto;transform:rotate(var(--hair-angle));pointer-events:none}
.mess-object{background:none!important;border-radius:0!important;filter:none!important}
.life-vomit{width:100%;height:100%;display:block;pointer-events:none}
.book-litter-mark{left:35%;top:23%;width:32px;height:26px;line-height:0}
.life-poop{display:block;width:100%;height:100%;pointer-events:none}
`;document.head.appendChild(paperStyle);render(gameState);
