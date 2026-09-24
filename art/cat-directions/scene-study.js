'use strict';
const C={paper:'#eee6d1',cream:'#f6edda',wood:'#b5824e',dark:'#765639',green:'#6d8063',sage:'#9fae85',sky:'#b6cdd1',rose:'#c88467',ink:'#343d35',floor:'#c9a776'};
const path=(d,c)=>`<path d="${d}" fill="${c}"/>`;
const line=(d,c=C.dark,w=4)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const text=(x,y,s,size=17,c=C.ink)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${c}" font-family="Meiryo,sans-serif" font-size="${size}">${s}</text>`;
const tree=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${line('M0 20L-3 -87',C.dark,9)}${path('M-4 -157Q-72 -153 -64 -103Q-94 -45 -30 -40Q30 -10 65 -59Q95 -106 37 -124Q27 -162 -4 -157Z',C.green)}${line('M-3 -10L-5 -102M-5 -61L-29 -80',C.dark,4)}</g>`;
const windowArt=(x,y,w=55,h=75)=>`<g transform="translate(${x} ${y})">${rect(-5,-5,w+10,h+10,C.dark)}${rect(0,0,w,h,C.sky)}${rect(w/2-3,0,6,h,C.cream)}${rect(0,h/2-3,w,6,C.cream)}</g>`;
const house=(x,y,s=1,color=C.rose)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M-54 0L-50 -86 0 -122 56 -84 53 0Z',C.cream)}${path('M-67 -83L-3 -139 68 -89 58 -79 -1 -121 -58 -75Z',color)}${windowArt(-32,-78,24,30)}${path('M16 -1L15 -52 40 -51 41 0Z',C.dark)}</g>`;
const interior=(wall=C.paper)=>rect(0,0,450,760,wall)+path('M0 475Q212 470 450 476V760H0Z',C.floor)+rect(0,473,450,9,C.wood)+line('M0 575L450 577M0 689L450 685M94 482L100 575M319 577L325 687', '#af8b5d',2);
const cat=(x,y,w=120)=>`<image class="cat-sample" href="room-assets/tortie.svg" x="${x}" y="${y}" width="${w}" height="${w*320/280}"/>`;
const guide=(x,y,w,h,label)=>`<g class="layout-guide"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff7db" fill-opacity=".55" stroke="#a06453" stroke-width="2" stroke-dasharray="7 6"/>${text(x+w/2,y+h/2,label,15,'#735a42')}</g>`;
const shelf=(y,things)=>path(`M37 ${y}L411 ${y-4} 414 ${y+11} 39 ${y+15}Z`,C.wood)+things;
const packet=(x,y,c)=>path(`M${x} ${y}L${x+36} ${y-2} ${x+40} ${y+55} ${x-2} ${y+54}Z`,c)+rect(x+6,y+17,24,17,C.cream);
const mapSpot=(x,y,label,icon,locked=false)=>`<g opacity="${locked?.62:1}">${icon}${text(x,y+23,label,16)}${locked?text(x,y+43,'未解放',11,'#787f6d'):''}</g>`;
const scenes=[
 {id:'opening',title:'01 / オープニング',sub:'街と、まだ出会っていない猫',note:'タイトルと開始ボタンは余白へ。家に続く道と手前の大きな猫で、静かに物語を始める。文字は背景に焼き込まず、ここでは表示見本。',art:rect(0,0,450,760,C.paper)+path('M0 369Q111 322 238 363T450 345V760H0Z','#b8c2a0')+path('M-40 760Q143 637 211 475Q240 411 292 388L325 404Q271 500 256 570Q223 686 164 760Z','#d8c4a3')+house(302,418,1.3)+tree(43,439,1.15)+tree(420,448,.8)+text(225,135,'ホゴネコ',51)+text(225,181,'ちいさな出会い、つづく暮らし。',14)+cat(74,389,242)+guide(90,665,270,56,'はじめる / つづきから')},
 {id:'map',title:'02 / 街のマップ',sub:'おうち・空き地・買い物エリア',note:'おうち、空き地、スーパー、ペットショップ、動物病院を直接タップする構成。2は公園、3は商店街の裏路地。4は山。未解放表示は維持。',art:rect(0,0,450,760,'#c8d1b4')+path('M309 0Q251 162 309 287T333 521Q285 642 301 760H372Q352 661 395 565Q460 414 380 264Q328 164 382 0Z','#b5cdd0')+path('M84 -10L138 0 168 187 130 341 174 507 243 760 181 760 113 535 71 343 111 184Z','#dfcfb1')+line('M135 510L324 444M137 211L270 175M161 638L348 652','#dfcfb1',33)+mapSpot(95,640,'おうち',house(95,615,.59))+mapSpot(247,480,'空き地',path('M211 446L263 437 284 457 224 466Z','#d8bd91')+line('M215 433L217 449M231 430L232 446M247 427L248 443M211 438L255 430',C.dark,3))+mapSpot(277,196,'公園',tree(277,167,.43),true)+mapSpot(108,301,'商店街の裏路地',rect( 75,229,67, 40,C.cream)+path('M70 230L147 230 140 216 77 216Z',C.rose),true)+mapSpot(114,111,'山',path('M70 85L103  30 124 61 140 39 167 85Z',C.green),true)+mapSpot(330,656,'動物病院',rect(301,592,58,41,C.cream)+text(330,621,'VET',13,C.green))+mapSpot(65,467,'スーパー',rect(35,405,60,41,C.cream)+path('M30 406L100 406 94 393 36 393Z',C.rose))+mapSpot(236,338,'ペットショップ',rect(204,275,64,39,C.cream)+path('M199 276L273 276 263 258 210 258Z',C.green))+text(225,724,'いつもの街',14)},
 {id:'field',title:'03-1 / 空き地',sub:'ステージ1・住宅街の空き地',note:'手前の土の部分を保護器の設置場所に。植え込みと塀の向こうに猫の気配を出す。保護器・餌は背景に含めない。',art:rect(0,0,450,760,C.sky)+rect(183,143,270,268,'#c4b6a1')+rect(174,134,276,15,'#817e6e')+windowArt(208,174,57,64)+windowArt(325,174,57,64)+windowArt(208,286,57,64)+windowArt(325,286,57,64)+line('M190 261L450 261M294 147L294 398','#9d927e',5)+path('M0 207L118 196 125 468 0 484Z','#d8c9ad')+windowArt(30,251,56,79)+path('M0 429L450 405 450 505 0 520Z','#b8ae95')+line('M0 472L450 451M95 427L95 466M279 416L280 455M180 467L182 510','#a29881',3)+path('M0 506Q170 481 450 500V760H0Z','#d8bd91')+path('M-20 511Q-29 367 79 396Q133 347 188 424Q211 486 166 522Z',C.green)+path('M334 504Q278 434 340 403Q415 357 463 445L465 541Z',C.sage)+line('M9 634Q168 627 301 638M298 546L347 549M45 701L84 703','#bda47d',3)+guide(104,546,229,121,'保護器・餌を置く場所')},
 {id:'clinic',title:'04 / 動物病院',sub:'診察と領収書をひとつの場所で',note:'猫は診察台の上。下側に診察結果・領収書を重ねる余白。医療器具は描き込みすぎず、穏やかな色で統一。',art:interior('#d7ddc8')+rect(39,83,107,150,C.cream)+text(92,118,'診察室',18,C.green)+line('M59 146L122 146M59 169L111 169M59 192L119 192','#b7bea8',4)+rect(244,73,126,99,C.cream)+text(307,130,'動物病院',20,C.green)+path('M294 320L407 317 407 489 296 493Z',C.cream)+line('M305 377L396 376M307 428L396 427', '#b7bea8',3)+rect(337,349,23,5,C.dark)+rect(337,401,23,5,C.dark)+line('M91 413L86 575M324 415L332 574',C.dark,12)+path('M55 380L343 378 366 410 70 424Z',C.green)+path('M70 414L365 400 365 418 72 435Z','#566e58')+cat(92,106,270)+guide(38,593,374,137,'診察結果・領収書')},
 {id:'naming',title:'05 / 名前を贈る',sub:'診察のあと、静かな一幕',note:'新しい猫だけに視線を集める、布の撮影背景のような一枚。下に名前入力と連れ帰る操作を置く。',art:rect(0,0,450,760,C.paper)+path('M47 88Q225 64 403 89L389 484Q225 503 60 480Z','#e2cfbd')+path('M62 480Q220 466 389 484L414 579Q222 609 37 577Z','#ceb397')+line('M73 106Q86 245 67 406M376 112Q359 270 377 422','#d5bfac',3)+cat(113,265,232)+text(225,167,'これから、よろしくね。',18)+guide(58,637,334, 66,'名前・連れ帰る')},
 {id:'room',title:'06 / おうち',sub:'承認済みの部屋・季節と時間',note:'部屋の既存SVGをそのまま表示。拡大画面では季節・時間を切り替えられます。猫と家具の位置関係も同じ基準に。'},
 {id:'super',title:'07 / スーパー',sub:'ごはんと日用品の買い物',note:'棚は背景の陳列見本。商品を選ぶカードと価格は下側に重ねる想定。',art:interior('#e7dfc7')+text(225,63,'まちのスーパー',24)+shelf(192,packet(61,127,C.rose)+packet(113,127,C.sage)+packet(168,125,C.rose)+packet(251,126,C.sage)+packet(305,124,C.rose)+packet(360,126,C.sage))+shelf(310,packet(74,246,'#d6bb89')+packet(128,245,'#d6bb89')+packet(224,246,C.sage)+packet(278,245,C.sage)+packet(342,245,'#d6bb89'))+path('M29 395L414 389 419 522 31 529Z',C.wood)+path('M20 378L423 375 428 397 22 404Z',C.dark)+rect(64,427,119,57,C.cream)+text(125,460,'ごはん・日用品',14)+guide(30,550,390,177,'商品一覧・価格')},
 {id:'petshop',title:'08 / ペットショップ',sub:'玩具・インテリアのお店',note:'猫の販売ではなく、暮らしの道具を買う店。部屋と同じ素材・配色の玩具を陳列。商品一覧は下側へ。',art:interior('#d8d9bf')+text(225,64,'ねこの道具店',25)+shelf(241,line('M77 224L79 138M142 222L142 132',C.dark,7)+path('M79 141Q49 110 77 92Q103 111 79 141M142 137Q171 118 161 94Q137 91 142 137Z',C.rose)+rect(230,167,123,65,C.wood)+path('M248 233L250 197Q285 168 314 195L324 233Z',C.dark))+shelf(379,`<circle cx="82" cy="347" r="26" fill="${C.rose}"/><circle cx="154" cy="348" r="24" fill="${C.sage}"/>`+path('M265 373L262 286 308 283 321 374Z','#d6bb89')+line('M266 306L309 302M268 330L313 326M268 351L316 348',C.wood,4))+path('M30 431L414 423 418 520 34 532Z',C.wood)+path('M22 416L423 411 429 434 24 442Z',C.dark)+guide(30,550,390,177,'道具一覧・価格')},
 {id:'adoption',title:'09 / 譲渡会',sub:'次の暮らしにつながる場所',note:'人やキャリーは別レイヤーで配置する想定。猫の紹介と譲渡の操作を手前へ。TNRは住宅街フィールドを再利用する。',art:interior('#e4e0cb')+windowArt(35,87,111,176)+windowArt(304,84,111,179)+line('M16 67Q232 140 437 66',C.dark,3)+path('M57 80L93 87 71 117Z',C.rose)+path('M131 97L167 105 144 134Z',C.sage)+path('M213 107L248 106 231 140Z','#d6bb89')+path('M293 101L327 93 314 128Z',C.rose)+path('M368 84L400 75 390 111Z',C.sage)+text(225,215,'譲渡会',30)+text(225,248,'新しい家族と、こんにちは。',12)+path('M42 367L409 364 422 398 31 403Z',C.wood)+path('M38 402L415 398 406 484Q346 497 286 485Q215 503 154 489Q90 502 42 485Z',C.cream)+line('M69 487L65 540M379 486L383 539',C.dark,10)+cat(172,242,129)+guide(37,561,376,158,'猫の紹介・譲渡の操作')}
];
// Shared clinic setting: naming is the next moment, not a new location.
const clinic=scenes.find(s=>s.id==='clinic'),naming=scenes.find(s=>s.id==='naming');
naming.art=clinic.art.replace(cat(92,106,270),cat(72,63,310)).replace(guide(38,593,374,137,'診察結果・領収書'),guide(38,593,374,137,'名前・連れ帰る'));
naming.sub='診察室で、そのまま名前を';naming.note='04と同じ診察室・診察台。猫への寄りだけを変え、診察から名前を付ける時間へつなぐ。';
const fieldGuide=guide(90,550,270,125,'保護器・餌を置く場所');
scenes.splice(scenes.findIndex(s=>s.id==='field')+1,0,
 {id:'park',title:'03-2 / 公園',sub:'ステージ2案・木陰とベンチ',note:'住宅街の次は公園。低い植え込み、ベンチの下、木陰を猫の気配を出す場所に。猫は背景に描かない。',art:rect(0,0,450,760,C.sky)+path('M0 280Q215 200 450 280V760H0Z','#aebd93')+path('M116 760Q199 545 290 457Q350 394 450 404V465Q352 449 309 517L237 760Z','#d8c4a3')+tree(53,415,1.5)+tree(417,369,1.1)+line('M96 434L93 508M253 436L256 505',C.dark,10)+path('M80 359L267 356 266 409 85 413Z',C.wood)+line('M84 383L267 380',C.dark,4)+path('M75 427L274 423 282 439 79 449Z',C.wood)+path('M-10 535Q-5 452 63 480Q99 455 124 503L114 560Z',C.green)+fieldGuide},
 {id:'harbor',title:'03-3 / 港',sub:'ステージ3案・波止場の倉庫裏',note:'3は港を提案。水面と係留船、木箱や倉庫で、公園と異なる奥行きに。保護器は水際から離れた手前の広場へ。',art:rect(0,0,450,760,C.sky)+rect(0,291,450,249,'#86aeb1')+line('M39 335L113 335M220 374L337 374M12 420L89 420','#c8d9cf',4)+path('M0 427L178 430 450 528V760H0Z','#bdb4a0')+path('M289 299L416 297 393 333 311 334Z',C.cream)+line('M349 293L349 200',C.dark,5)+path('M357 210L401 282 357 279Z',C.rose)+path('M-12 394L-10 148 137 138 165 388Z','#9ba79b')+path('M-15 150L54 102 151 132 166 150Z',C.dark)+rect(43,234,68,161,'#65776b')+path('M302 489L365 475 407 499 344 518Z',C.wood)+path('M302 489L344 518 407 499 405 561 343 583 302 549Z','#aa8056')+line('M309 511L338 531M350 537L397 523',C.dark,4)+fieldGuide},
 {id:'mountain',title:'03-4 / 山',sub:'ステージ4・林道のひらけた場所',note:'山は深い緑と稜線。手前に広い土の地面を残し、茂みや岩陰から保護の演出を重ねる。背景の猫はなし。',art:rect(0,0,450,760,'#c4d1cc')+path('M-45 356L109 135 222 303 342 101 501 355V600H0Z','#9fab99')+path('M-37 442L86 230 238 434 374 238 479 431V760H0Z','#73896f')+path('M-20 760Q90 505 246 456Q355 430 460 519V760Z','#c7b18b')+tree(39,461,1.4)+tree(418,499,1.65)+path('M29 582L56 530 113 531 142 572 113 598Z','#92988a')+path('M320 589Q328 502 383 541Q445 500 464 580V670H330Z',C.green)+line('M178 463L233 451M170 705L219 699','#a88f6e',3)+fieldGuide}
);
const clerk=(x,y,color)=>{
 const petShop=color===C.green;
 const body=petShop?path('M-35 116L-33 44Q0 31 35 44L41 116Z','#9eae95')+path('M-19 46L-15 67 18 67 22 45 30 116 -26 116Z',C.green):path('M-47 116L-45 44Q0 26 45 44L51 116Z',C.cream)+path('M-28 41L-22 62 23 62 29 41 37 116 -34 116Z',C.rose);
 const head=petShop?
 path('M-25 -12Q-23 -39 3 -35Q29 -30 27 -3L22 25Q8 42 -12 29Q-26 14 -25 -12Z','#bd916d')+
 path('M-29 3Q-42 -14 -29 -28Q-34 -44 -16 -44Q-5 -57 9 -45Q30 -51 35 -32Q46 -16 28 4L21 -15 9 -9 -3 -19 -15 -8 -21 -13Z','#49493d')+
 line('M-13 2L-5 1M10 1L18 3',C.ink,3)+line('M-6 20Q5 26 14 17',C.ink,2):
 '<circle cx="-26" cy="-30" r="17" fill="#777362"/><ellipse cx="0" cy="2" rx="34" ry="34" fill="#d6bb89"/>'+
 path('M-34 1Q-43 -36 1 -38Q39 -36 35 0L21 -11Q-3 -9 -15 -21L-25 1Z','#777362')+
 '<g fill="none" stroke="#765639" stroke-width="2.5"><circle cx="-13" cy="3" r="10"/><circle cx="13" cy="3" r="10"/><path d="M-3 3H3"/></g>'+
 '<circle cx="-13" cy="3" r="2" fill="#343d35"/><circle cx="13" cy="3" r="2" fill="#343d35"/>'+
 line('M-11 20Q0 28 12 19',C.dark,2);
 const bird=petShop?'<g class="shoulder-bird" aria-label="肩の小鳥">'+
 path('M35 28L52 47 60 44 51 22Z',C.green)+
 '<ellipse cx="38" cy="19" rx="15" ry="19" fill="#c8c58c"/>'+
 '<circle cx="33" cy="0" r="12" fill="#e6d6a0"/>'+
 path('M33 -9L35 -22 39 -10', '#e6d6a0')+
 path('M23 0L15 5 24 9Z',C.rose)+
 path('M40 12Q58 22 45 33Q31 30 40 12Z',C.green)+
 '<circle cx="29" cy="-1" r="2.5" fill="#343d35"/><circle cx="35" cy="7" r="4" fill="#c88467"/>'+
 line('M33 36L31 42M41 36L40 44',C.dark,2)+'</g>':'';
 return '<g class="shop-clerk" data-person="'+(petShop?'pet-specialist':'market-cashier')+'" transform="translate('+x+' '+y+')">'+body+head+rect(6,77,18,10,C.cream)+bird+'</g>';
};
const register=(x,y)=>`<g class="register" transform="translate(${x} ${y})">${path('M-36 0L27 -2 39 19 -42 21Z','#737e6b')}${rect(-11,-35,9,35,C.dark)}${rect(-36,-62,65,39,C.dark)}${rect(-30,-56,53,25,'#c6d1b8')}${text(-3,-38,'¥ 1,280',9)}${rect(15,3,16,6,C.cream)}</g>`;
const market=scenes.find(s=>s.id==='super');
market.sub='青果・食品棚・有人レジ';market.note='青果の木箱、食品棚、冷蔵ケース、買い物かご、エプロンの店員とレジ。下部に商品選択UIを重ねる。店員・商品は将来別レイヤーに分ける。';
market.art=interior('#e7dfc7')+text(225,57,'まちのスーパー',25)+rect(24,91,244,207,C.cream)+shelf(177,[44,94,144,194].map((x,i)=>packet(x,119,i%2?C.sage:C.rose)).join(''))+shelf(285,[44,94,144,194].map(x=>packet(x,226,'#d6bb89')).join(''))+rect(302,92,124,225,'#8e9f94')+rect(310,101,107,188,'#c4d6ce')+line('M364 105L364 283M311 166L415 166M311 226L415 226','#eef0db',4)+[321,348,374,397].map(x=>rect(x,131,10,30,C.cream)+rect(x,193,10,29,C.rose)).join('')+path('M23 337L194 324 207 409 31 424Z',C.wood)+[53,85,118,151].map((x,i)=>`<circle cx="${x}" cy="350" r="14" fill="${i%2?C.sage:C.rose}"/>`).join('')+text(115,397,'新鮮やさい',14,C.cream)+clerk(319,309,C.rose)+path('M217 415L433 410 438 528 220 532Z',C.wood)+rect(210,404,232,19,C.dark)+register(270,399)+path('M33 467L155 465 146 524 44 526Z',C.green)+line('M53 470Q91 424 133 469',C.dark,5)+line('M59 483L63 512M88 483L88 512M119 483L116 512',C.sage,5)+guide(30,557,390,170,'商品一覧・価格');
const pet=scenes.find(s=>s.id==='petshop');pet.sub='水槽・小動物・用品・有人レジ';pet.note='水槽の魚と小動物の展示ケース、用品棚、店員とレジを配置。生体も扱う総合ペットショップの見た目。購入機能はまだ追加しない。';
pet.art=interior('#d8d9bf')+text(225,57,'まちのペットショップ',24)+rect(26,98,200,154,C.dark)+rect(34,108,183,133,'#a9c6c5')+path('M34 224L217 219 217 241 34 241Z','#d6bb89')+line('M60 229Q82 180 65 160M180 228Q162 185 185 153',C.green,8)+[85,155].map((x,i)=>path(`M${x} ${148+i*42}Q${x+20} ${132+i*42} ${x+37} ${148+i*42}L${x+50} ${137+i*42} ${x+50} ${160+i*42} ${x+37} ${150+i*42}Q${x+20} ${166+i*42} ${x} ${148+i*42}Z`,C.rose)).join('')+rect(26,273,200,148,C.wood)+rect(34,282,183,127,C.cream)+path('M36 385L215 381 215 409 36 409Z','#d6bb89')+`<ellipse cx="113" cy="370" rx="32" ry="21" fill="${C.sage}"/><ellipse cx="129" cy="344" rx="17" ry="21" fill="${C.sage}"/><ellipse cx="123" cy="318" rx="7" ry="22" fill="${C.sage}"/><ellipse cx="139" cy="321" rx="7" ry="20" fill="${C.sage}"/><circle cx="138" cy="344" r="3" fill="${C.ink}"/>`+line('M39 282L39 403M212 282L212 403','#a7b5a2',3)+[278,332,384].map(x=>packet(x,129,C.sage)).join('')+rect(264,188,165,12,C.wood)+line('M280 272L300 217M332 271L348 216',C.dark,5)+path('M299 221Q280 195 303 195Q324 204 299 221M350 220Q335 197 355 195Q374 210 350 220Z',C.rose)+clerk(339,322,C.green)+path('M234 436L433 430 440 536 235 543Z',C.wood)+rect(229,421,214,18,C.dark)+register(283,414)+guide(30,566,390,162,'生体・用品売り場 / 商品操作');
const alley=scenes.find(s=>s.id==='harbor');alley.id='alley';alley.title='03-3 / 商店街の裏路地';alley.sub='ステージ3・お店の勝手口';alley.note='商店街の裏側。看板、室外機、木箱の陰と手前の保護器エリア。猫は背景に描かない。';
alley.art=rect(0,0,450,760,C.sky)+path('M0 109L154 148 162 493 0 560Z','#cbbda5')+path('M302 153L450 105V563L290 489Z','#b6bdac')+path('M162 426L290 426 450 565V760H0V562Z','#c6b59a')+rect(174,286,108,148,'#d4c7ae')+path('M167 285L289 285 282 265 174 265Z',C.rose)+path('M28 291L102 305 107 477 31 499Z',C.dark)+line('M42 309L89 319M43 339L90 348M44 369L91 378','#95866e',3)+path('M310 288L413 263 413 326 308 346Z',C.cream)+`<ellipse cx="353" cy="306" rx="22" ry="24" fill="#a6b0a0"/>`+line('M353 286L353 327M335 306L371 306',C.cream,4)+path('M310 165L382 147 382 216 309 233Z',C.rose)+text(345,198,'喫茶',18,C.cream)+path('M42 521L107 499 144 522 80 548Z',C.wood)+path('M42 521L80 548 144 522 145 582 81 607 42 575Z','#aa8056')+line('M49 540L74 557M88 565L136 546',C.dark,3)+path('M325 498L382 491 377 543 334 548Z',C.wood)+path('M353 500Q315 463 345 444Q363 451 356 478Q378 449 393 469Q393 490 353 500Z',C.green)+fieldGuide;
const seasonalIds=new Set(['map','field','park','alley','mountain']);
const seasonNames={spring:'春',summer:'夏',autumn:'秋',winter:'冬'};
let currentSeason='spring';
const seasonalColors={
 spring:{'#6d8063':'#8caa7c','#9fae85':'#b7c99d','#73896f':'#91a486','#9fab99':'#b1c1a7'},
 summer:{'#6d8063':'#557954','#9fae85':'#83a468','#b6cdd1':'#a8cdd6','#c4d1cc':'#b0ccd2','#c8d1b4':'#a9c095'},
 autumn:{'#6d8063':'#a87649','#9fae85':'#c3a365','#73896f':'#96764d','#9fab99':'#bba37a','#aebd93':'#c3b187','#c8d1b4':'#cbbd96','#b6cdd1':'#c5d0c8'},
 winter:{'#6d8063':'#7a9087','#9fae85':'#bdccc2','#73896f':'#91a39b','#9fab99':'#c3cfc8','#aebd93':'#d6ddd0','#c8d1b4':'#d9dfd2','#b6cdd1':'#d0dbdc','#c4d1cc':'#d0dbdc','#d8bd91':'#e4e1d0','#c7b18b':'#d8d6c6'}
};
function seasonalArt(s){
 if(!seasonalIds.has(s.id))return s.art;
 let a=s.art.replace(/#[0-9a-f]{6}/gi,c=>seasonalColors[currentSeason][c.toLowerCase()]||c);
 const points={map:[[100,76],[280,162],[200,510],[64,584]],field:[[55,417],[109,443],[362,451],[389,491]],park:[[28,278],[60,306],[415,248],[77,491]],alley:[[344,467],[376,475],[168,512],[271,488]],mountain:[[21,315],[55,346],[403,335],[369,562]]}[s.id];
 const decor=points.map(([x,y],i)=>{
  const size=s.id==='map'?.48:1;
  let motif='';
  if(currentSeason==='spring')motif='<g fill="#e2b3af"><circle cx="-6" cy="0" r="6"/><circle cx="5" cy="-4" r="6"/><circle cx="4" cy="7" r="6"/></g><circle cx="0" cy="2" r="3" fill="#f6edda"/>';
  if(currentSeason==='summer')motif=path('M-10 4Q-14 -16 3 -16Q17 -1 -10 4M2 8Q5 -12 19 -6Q22 9 2 8Z','#769b60');
  if(currentSeason==='autumn')motif=path('M-10 -9L3 -4 13 -10 10 4 2 11 -9 5Z',i%2?'#bd794f':'#d6b364');
  if(currentSeason==='winter')motif=path('M-23 4Q-20 -5 -10 -1Q0 -14 10 -4Q24 -6 26 6Q4 13 -23 4Z','#f5f3e5');
  return `<g transform="translate(${x} ${y}) scale(${size})">${motif}</g>`;
 }).join('');
 const snow=currentSeason==='winter'?path(s.id==='map'?'M83 45L102 30 113 46 103 42 96 49Z':'M14 700Q42 681 64 697L95 706Q53 715 14 700Z','#f5f3e5'):'';
 return a+`<g class="season-details" data-season="${currentSeason}">${decor}${snow}</g>`;
}
function svg(s){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 760" role="img" aria-label="${s.title}${seasonalIds.has(s.id)?'・'+seasonNames[currentSeason]:''}">${seasonalArt(s)}</svg>`;}
const main=document.querySelector('#scenes');
main.innerHTML=scenes.map(s=>`<button class="scene" data-id="${s.id}" aria-label="${s.title}を拡大"><span class="preview">${s.id==='room'?'<iframe title="部屋の背景見本" tabindex="-1" src="room-study.html?embed=1"></iframe><span class="layout-guide room-guide">猫・世話のエリア</span>':svg(s)}</span><span class="caption"><strong>${s.title}</strong><small>${s.sub}</small></span></button>`).join('');
const detail=document.querySelector('#detail');let lastButton;
main.onclick=e=>{const b=e.target.closest('button');if(!b)return;lastButton=b;const s=scenes.find(x=>x.id===b.dataset.id);detail.querySelector('h2').textContent=s.title;document.querySelector('#detail-art').innerHTML=s.id==='room'?'<iframe title="部屋の背景・季節切替" src="room-study.html?embed=1&controls=1"></iframe>':svg(s);document.querySelector('#detail-note').textContent=s.note;document.querySelector('#source').hidden=s.id!=='room';detail.showModal();};
document.querySelector('#close').onclick=()=>detail.close();detail.onclose=()=>lastButton?.focus();
document.querySelector('#guides').onchange=e=>document.body.classList.toggle('show-guides',e.target.checked);
function syncRoomCast(){document.querySelectorAll('iframe').forEach(f=>f.contentWindow.postMessage({type:'scene-cast',visible:document.querySelector('#cast').checked},'*'));}
document.querySelector('#cast').onchange=e=>{document.body.classList.toggle('hide-cast',!e.target.checked);syncRoomCast();};
document.addEventListener('load',e=>{if(e.target.tagName==='IFRAME')syncRoomCast();},true);
document.querySelector('#field-season').onchange=e=>{currentSeason=e.target.value;scenes.filter(s=>seasonalIds.has(s.id)).forEach(s=>document.querySelector(`[data-id="${s.id}"] .preview`).innerHTML=svg(s));};
