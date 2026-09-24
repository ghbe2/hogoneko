'use strict';
// One stimulus type per proposal. These are not live game definitions.
const ideas=[
 {type:'human',label:'ひと',name:'いっしょのリボン',art:'ribbon',play:'飼い主が持って、近くでゆらゆら。目を合わせながら遊ぶ。',reason:'リボン自体は「おいかけ」に近い。「人と遊ぶこと」をどう判定するか要検討。',review:true},
 {type:'cat',label:'なかま',name:'ふたりのころころ',art:'duo',play:'両端から同じ玉に触れられる、ふたり用の木のレール。',reason:'同居猫と遊ぶ状況が必要。道具単体に「なかま」を付けるかは未決。',review:true},
 {type:'friend',label:'ともだち',name:'となりのぬいぐるみ',art:'dog',play:'犬のかたちの布人形。そっと隣に置く、付き添い役。',reason:'ぬいぐるみは本当の動物ではない。「ともだち」の代用にするのは要検討。',review:true},
 {type:'prey',label:'えもの',name:'布のねずみ',art:'mouse',play:'床をちょこちょこ動かす。捕まえたら、前足で押さえてけりけり。',reason:'狩りの対象を模した道具。既存のネズミを絵本のタッチに。'},
 {type:'touch',label:'ふれあい',name:'なでなでミトン',art:'mitten',play:'丸い布の手で、猫に触れる。動かす速さより、触れる間合い。',reason:'玩具というよりケア道具。あそぶ枠に入れるかを検討。',review:true},
 {type:'solo',label:'ひとり',name:'ころころ輪っか',art:'track',play:'輪の中の玉を、好きなときにひとりで転がす。',reason:'自分のペースで遊べる道具。部屋に置く玩具の候補。'},
 {type:'chase',label:'おいかけ',name:'ころんボール',art:'ball',play:'投げたり、床を転がしたり。転がる先へ走って追いかける。',reason:'ボールは「おいかけ」。新品でも「はじめて」は付けない。'},
 {type:'ambush',label:'まちぶせ',name:'ちらちら小箱',art:'peek',play:'穴から布のしっぽが出たり隠れたり。構えて、飛びつく。',reason:'隠れて待つ、飛びつくタイミングが遊びの中心。'},
 {type:'high',label:'たかいとこ',name:'ゆれる枝先',art:'perch',play:'足場に取り付ける吊り玉。高い場所から前足を伸ばす。',reason:'高さは設置場所の条件。吊り玉単体のタイプにするか要検討。',review:true},
 {type:'hide',label:'かくれが',name:'くぐり布トンネル',art:'tunnel',play:'もぐる、顔を出す、また隠れる。やわらかい布の遊び場。',reason:'隠れられる形そのものが道具の特徴。設置型玩具の候補。'},
 {type:'sun',label:'ひなた',name:'ひなたの遊びマット',art:'mat',play:'窓辺に広げて、布の葉っぱをちょいちょい。寝転んでも遊べる。',reason:'日当たりは部屋の条件。玩具への割り当てを無理に決めず保留寄り。',review:true},
 {type:'food',label:'ごはん',name:'おやつころん',art:'feeder',play:'転がすと少しずつおやつが出る、丸い知育玩具。',reason:'報酬がごはん。給餌量や消費のルールは本編実装時に決める。'},
 {type:'scent',label:'におい',name:'香りの小魚',art:'fish',play:'香り袋をくんくん。頬を寄せたり、抱えて転がったり。',reason:'形より香りが主役。魚の形でも「えもの」は重ねない。'},
 {type:'scratch',label:'つめとぎ',name:'ばりばり巻き玉',art:'scratch',play:'前足で押さえ、縄の面を手前に引っかく。',reason:'引っかく触感を楽しむ、台座つきの遊具。'}
];
const handheld=[
 {type:'human',label:'ひと',name:'こんにちは人形',art:'humanpuppet',play:'手にはめて、飼い主の声と一緒にこんにちは。近づけたり、おじぎしたり。',reason:'人の顔と呼びかけを楽しむ手人形。「ひと」を玩具に置き換える表現案。',review:true},
 {type:'cat',label:'なかま',name:'ねこパペット',art:'catpuppet',play:'指で耳と顔を動かして、猫同士のあいさつみたいに鼻先を寄せる。',reason:'猫の姿をした手人形。実際の同居猫とは別に、ゲーム内で「なかま」を表す案。',review:true},
 {type:'friend',label:'ともだち',name:'いぬパペット',art:'dogpuppet',play:'手にはめて、たれ耳をぴょこぴょこ。飛びかからせず、ゆっくりごあいさつ。',reason:'猫以外の動物との交流を手人形に。獲物ではなく友好的な相手として表現。',review:true},
 {type:'touch',label:'ふれあい',name:'なでなでミトン',art:'mitten',play:'手にはめて、頬や背中をそっとなでる。触れる・離すの間合いで遊ぶ。',reason:'触れ合うための手持ち道具。ケア寄りでも、今回の「あそぶ」候補に含める。'},
 {type:'solo',label:'ひとり',name:'けりけり枕',art:'kicker',play:'手で差し出したら、猫に渡す。抱えてける間は、こちらから動かさず見守る。',reason:'設置家具ではなく持ち運ぶ玩具。手渡した後、猫のペースに任せる遊び。'},
 {type:'high',label:'たかいとこ',name:'のびのびじゃらし',art:'highwand',play:'長い柄を持ち、足場の上へぽんぽんを差し出す。登った猫と目線を合わせる。',reason:'上へ誘う専用の手持ち玩具。到達できる足場を使う想定で、足場は付属しない。'},
 {type:'hide',label:'かくれが',name:'かくれんぼクロス',art:'hidecloth',play:'両端を持ってふわっと持ち上げる。猫が下にもぐったら、そっとめくってこんにちは。',reason:'手で屋根を作る布。床に常設するマットやトンネルとは分ける。'},
 {type:'sun',label:'ひなた',name:'ひだまりスティック',art:'sunwand',play:'太陽の先から、やわらかな光だまりを床へ。ゆっくり動かして、猫を誘う。',reason:'「ひなた」を持ち運ぶ架空の玩具案。レーザーの点ではなく、広い暖色の光で表現。',review:true},
 {type:'food',label:'ごはん',name:'おやつスプーン',art:'spoon',play:'ひと口分をのせて手で差し出す。近づくのを待って、ぺろりと食べてもらう。',reason:'ごはん補充とは別の、おやつで交流する手持ち道具。使用時のおやつ消費は別途設計。'},
 {type:'scratch',label:'つめとぎ',name:'ばりばりパドル',art:'paddle',play:'柄を持って縄の面を差し出す。猫が前足で引く間、しっかり支える。',reason:'爪を受ける面と持ち手を分けた手持ち玩具。設置台や柱は付けない。'},
 {type:'prey',label:'えもの',name:'布のねずみ',art:'mouse',play:'つまんで床すれすれを、ちょこちょこ。止めたり逃がしたりして誘う。',reason:'獲物らしい形を動かす。捕まえたら一度手を離す。'},
 {type:'prey',label:'えもの',name:'羽根じゃらし',art:'feather',play:'羽根の先をふわっと浮かせる。着地して、また飛び立つ。',reason:'羽根を獲物として見せる道具。相性タイプは「えもの」だけ。'},
 {type:'chase',label:'おいかけ',name:'ころんボール',art:'ball',play:'手で持ち、狙った方向へころんと転がす。追いついたら拾って、もう一度。',reason:'持って誘う玩具に加え、投げて遊ぶ玩具も含める。設置物ではない。'},
 {type:'chase',label:'おいかけ',name:'ひらひらリボン',art:'ribbon',play:'棒を持って左右へゆっくり振る。大きく走らせたり、ぴたりと止めたり。',reason:'「ひと」ではなく、動くものを追う「おいかけ」に分類。'},
 {type:'ambush',label:'まちぶせ',name:'ちら見せしっぽ',art:'tailwand',play:'手持ちの棒で、家具の陰からしっぽをちらり。構えた猫と間合いを取る。',reason:'隠す・見せる遊びが前提。「まちぶせ」用の候補。家具そのものは付属しない。'},
 {type:'scent',label:'におい',name:'香りの小魚',art:'fish',play:'手に持って鼻先へそっと近づけ、くんくんする時間を待つ。',reason:'追わせるより香りで誘う。魚の形でも「えもの」は重ねない。'}
];
const archive=new URLSearchParams(location.search).get('view')==='ideas';
const toys=window.interiorStudy?window.interiorStudy.items:archive?ideas:handheld;
const art={
 humanpuppet:'<path d="M79 178L86 113Q124 91 165 115L174 178Z" fill="#c88467"/><ellipse cx="125" cy="83" rx="39" ry="43" fill="#d6bb89"/><path d="M85 79Q75 35 124 34Q175 36 165 81L149 58 112 63 99 54Z" fill="#765639"/><path d="M111 96Q125 108 140 96" fill="none" stroke="#765639" stroke-width="3"/><g fill="#333c34"><circle cx="109" cy="82" r="3"/><circle cx="140" cy="82" r="3"/></g><path d="M101 130L150 131M95 150L158 151" stroke="#f6edda" stroke-width="5"/><ellipse cx="126" cy="177" rx="47" ry="7" fill="#ac6c53"/>',
 catpuppet:'<path d="M83 177L87 111 162 111 174 177Z" fill="#9fae85"/><path d="M84 80L85 35 112 58Q127 51 142 58L168 35 167 85Q176 125 126 129Q76 124 84 80Z" fill="#9fae85"/><path d="M91 51L105 64 93 71M160 51L147 65 160 71" fill="#c88467"/><path d="M120 97L131 97 126 104Z" fill="#765639"/><path d="M98 87L110 85M143 85L155 87" stroke="#333c34" stroke-width="4" stroke-linecap="round"/><path d="M119 117Q126 132 139 138L136 164 113 164 111 138Z" fill="#f6edda"/><ellipse cx="128" cy="177" rx="46" ry="7" fill="#6d8063"/>',
 kicker:'<path d="M71 153Q54 128 82 109L153 63Q179 47 190 76Q203 94 177 111L105 160Q84 175 71 153Z" fill="#c88467"/><path d="M86 108L111 154M113 91L140 135M145 70L170 115" stroke="#f6edda" stroke-width="8"/><path d="M76 151L82 153M91 143L96 144M163 82L169 83" stroke="#ac6c53" stroke-width="2"/>',
 highwand:'<path d="M84 185L140 48" stroke="#765639" stroke-width="8" stroke-linecap="round"/><path d="M95 158L118 103" stroke="#d6bb89" stroke-width="10"/><path d="M140 48Q172 28 181 58L177 82" fill="none" stroke="#b5824e" stroke-width="4"/><path d="M178 75L186 79 198 78 196 89 201 98 190 104 185 115 175 109 164 112 161 101 155 93 166 85 166 76Z" fill="#c88467"/>',
 hidecloth:'<path d="M47 94L80 80Q124 111 177 79L211 95Q177 107 165 153Q121 181 85 151Q78 111 47 94Z" fill="#9fae85"/><path d="M80 81Q93 125 85 151M177 80Q159 124 165 153M106 108L111 155M146 108L140 161" fill="none" stroke="#6d8063" stroke-width="3"/><path d="M48 94L80 80M178 80L210 95" stroke="#d6bb89" stroke-width="7" stroke-linecap="round"/>',
 sunwand:'<path d="M89 182L133 113" stroke="#765639" stroke-width="12" stroke-linecap="round"/><path d="M113 62L116 40 135 51 151 35 161 56 185 54 181 77 200 90 180 105 183 127 160 126 148 146 133 129 112 135 111 112 91 102 109 85 95 67Z" fill="#d6bb89"/><circle cx="146" cy="89" r="29" fill="#f1dda2"/><path d="M146 60A29 29 0 0 1 146 118Q166 93 146 60Z" fill="#c8a66f"/>',
 spoon:'<path d="M92 181L125 111Q103 90 121 63Q144 35 165 53Q186 74 156 105L137 118 107 185Z" fill="#b5824e"/><ellipse cx="145" cy="77" rx="18" ry="24" transform="rotate(30 145 77)" fill="#765639"/><path d="M130 89Q121 77 137 69Q153 55 161 74Q161 89 146 95Z" fill="#c88467"/>',
 paddle:'<path d="M86 182L112 126Q77 116 89 76Q102 43 144 55Q184 66 174 103Q169 130 133 136L104 190Z" fill="#765639"/><path d="M95 111Q77 59 124 52Q175 51 176 90Q178 136 133 142Z" fill="#b5824e"/><path d="M100 109Q87 72 116 65Q152 59 163 84Q179 120 135 129Z" fill="#d6bb89"/><path d="M102 80L157 88M99 94L164 102M106 110L155 116" stroke="#b5824e" stroke-width="4"/>' ,
 feather:'<path d="M66 181L142 77" stroke="#765639" stroke-width="9" stroke-linecap="round"/><path d="M139 82Q116 51 145 30Q166 46 151 79Z" fill="#c88467"/><path d="M144 80Q163 33 187 48Q190 75 151 89Z" fill="#9fae85"/><path d="M143 79Q105 69 108 43Q140 42 148 79Z" fill="#d6bb89"/><path d="M141 80L152 84" stroke="#f6edda" stroke-width="6"/>',
 tailwand:'<path d="M67 179L141 82" stroke="#765639" stroke-width="9" stroke-linecap="round"/><path d="M143 81Q188 79 179 119Q172 146 148 131" fill="none" stroke="#b5824e" stroke-width="22" stroke-linecap="round"/><path d="M169 86L167 102M181 109L162 107M174 129L159 119" stroke="#765639" stroke-width="7"/>',
 ribbon:'<path d="M73 171L101 65" stroke="#765639" stroke-width="11" stroke-linecap="round"/><path d="M101 65Q163 34 171 72T132 115Q101 145 181 145" fill="none" stroke="#c88467" stroke-width="12" stroke-linecap="round"/>',
 duo:'<path d="M40 118Q126 66 211 118L211 146Q122 101 40 146Z" fill="#b5824e"/><path d="M48 119Q126 80 203 119" fill="none" stroke="#765639" stroke-width="13"/><circle cx="133" cy="99" r="15" fill="#c88467"/><path d="M47 143L49 159M200 142L198 158" stroke="#765639" stroke-width="9"/>',
 dog:'<path d="M87 109Q72 140 89 158L162 158Q180 139 161 110Z" fill="#d6bb89"/><path d="M88 93Q77 54 125 54Q170 52 163 95L154 123 99 124Z" fill="#d6bb89"/><path d="M89 62Q62 61 67 104Q74 117 88 100M157 62Q185 61 181 104Q172 116 158 99" fill="#b5824e"/><ellipse cx="126" cy="99" rx="23" ry="16" fill="#f6edda"/><path d="M119 93Q126 88 134 93L127 101Z" fill="#333c34"/><g fill="#333c34"><circle cx="104" cy="84" r="3"/><circle cx="147" cy="84" r="3"/></g><path d="M100 131L99 158M153 132L153 158" stroke="#b5824e" stroke-width="3"/>',
 mouse:'<path d="M87 145Q27 155 43 109" fill="none" stroke="#c88467" stroke-width="6" stroke-linecap="round"/><path d="M72 140Q61 88 119 89Q154 88 187 132Q150 156 72 140Z" fill="#9fae85"/><path d="M105 97Q89 57 115 63Q140 69 126 101Z" fill="#6d8063"/><path d="M109 90Q99 67 115 71Q129 76 120 94Z" fill="#c88467"/><circle cx="158" cy="118" r="4" fill="#333c34"/><path d="M181 126L191 132 180 137Z" fill="#c88467"/><path d="M92 125L100 128M110 130L118 131" stroke="#f6edda" stroke-width="2"/>',
 mitten:'<path d="M82 154L76 103Q72 59 103 57Q130 45 148 68L158 99Q176 79 186 96Q193 113 160 138L151 166Z" fill="#c88467"/><path d="M81 148L153 156 148 180 84 172Z" fill="#d6bb89"/><path d="M99 81L104 122M122 78L126 118" stroke="#ac6c53" stroke-width="3" stroke-linecap="round"/>',
 track:'<ellipse cx="126" cy="132" rx="85" ry="38" fill="#765639"/><ellipse cx="126" cy="122" rx="85" ry="36" fill="#b5824e"/><ellipse cx="126" cy="120" rx="64" ry="22" fill="none" stroke="#765639" stroke-width="13"/><circle cx="178" cy="111" r="14" fill="#c88467"/><ellipse cx="122" cy="120" rx="40" ry="11" fill="#d6bb89"/>',
 ball:'<path d="M74 130Q54 78 110 63Q159 49 180 101Q193 158 140 168Q92 182 74 130Z" fill="#c88467"/><path d="M112 63Q74 120 142 167Q113 160 96 145Q59 103 112 63Z" fill="#f6edda"/><path d="M143 64Q161 102 177 125L178 139Q163 124 153 104Q144 84 135 61Z" fill="#b5824e"/>',
 peek:'<path d="M55 101L168 87 199 110 85 128Z" fill="#d6bb89"/><path d="M55 101L85 128 87 174 58 148Z" fill="#aa8056"/><path d="M85 128L199 110 195 158 87 174Z" fill="#b5824e"/><ellipse cx="143" cy="143" rx="20" ry="13" fill="#765639"/><path d="M143 144Q175 108 144 94Q130 81 151 66" fill="none" stroke="#9fae85" stroke-width="12" stroke-linecap="round"/>',
 perch:'<path d="M63 173L63 103 182 97" fill="none" stroke="#765639" stroke-width="12" stroke-linecap="round"/><path d="M58 106L74 96 188 90 188 104 62 116Z" fill="#b5824e"/><path d="M158 107L161 150" stroke="#d6bb89" stroke-width="4"/><circle cx="161" cy="160" r="19" fill="#c88467"/>',
 tunnel:'<path d="M77 85Q175 41 196 86L213 143 119 171Z" fill="#9fae85"/><ellipse cx="90" cy="128" rx="45" ry="49" fill="#6d8063"/><ellipse cx="90" cy="129" rx="34" ry="38" fill="#333c34"/><path d="M123 71Q157 91 156 161M158 64Q188 87 190 149" fill="none" stroke="#d6bb89" stroke-width="5"/><path d="M66 149Q87 160 112 150" fill="none" stroke="#b5824e" stroke-width="4"/>',
 mat:'<path d="M46 117Q109 76 179 86L211 144Q152 182 64 164Z" fill="#d6bb89"/><path d="M61 123Q120 91 174 99L194 139Q135 164 76 154Z" fill="#f6edda"/><path d="M115 141Q105 113 130 108Q148 128 115 141" fill="#9fae85"/><path d="M147 143Q146 118 169 123Q176 143 147 143" fill="#c88467"/>',
 feeder:'<path d="M79 148Q55 108 82 78Q114 46 155 78Q191 108 169 151Q123 173 79 148Z" fill="#d6bb89"/><path d="M79 148Q126 135 170 150Q125 176 79 148Z" fill="#b5824e"/><ellipse cx="147" cy="128" rx="12" ry="15" fill="#765639"/><path d="M85 84Q124 102 165 89" fill="none" stroke="#b5824e" stroke-width="4"/><g fill="#765639"><ellipse cx="180" cy="167" rx="5" ry="3"/><ellipse cx="196" cy="159" rx="4" ry="3"/></g>',
 fish:'<path d="M66 116Q113 64 171 109L204 89 195 145 169 128Q113 169 66 116Z" fill="#9fae85"/><path d="M110 84Q88 116 111 146" stroke="#6d8063" stroke-width="3" fill="none"/><circle cx="88" cy="114" r="3" fill="#333c34"/><path d="M133 105L141 108M130 122L139 125M154 113L162 116" stroke="#f6edda" stroke-width="3"/>',
 scratch:'<path d="M64 154L160 140 198 160 99 182Z" fill="#b5824e"/><path d="M99 182L198 160 198 169 99 190 64 163 64 154Z" fill="#765639"/><path d="M98 151Q66 118 96 87Q127 61 154 92Q180 128 148 155Z" fill="#d6bb89"/><path d="M91 96Q125 111 157 100M83 111Q126 128 164 117M86 130Q125 144 160 133M99 148Q127 158 148 148" fill="none" stroke="#b5824e" stroke-width="4"/>'
};
Object.assign(art,window.interiorStudy?.art||{});
art.dogpuppet=art.dog+'<path d="M91 149L86 177Q126 185 166 177L160 149Z" fill="#d6bb89"/><ellipse cx="126" cy="178" rx="40" ry="6" fill="#b5824e"/>';
handheld.sort((a,b)=>ideas.findIndex(t=>t.type===a.type)-ideas.findIndex(t=>t.type===b.type));
function picture(key){return `<svg viewBox="0 0 250 220" aria-hidden="true"><ellipse cx="126" cy="185" rx="74" ry="7" fill="#d9d7c6"/>${art[key]}</svg>`;}
const filters=document.querySelector('#filters');
filters.innerHTML='<button data-type="all" aria-pressed="true">すべて</button>'+toys.filter((t,i)=>toys.findIndex(x=>x.type===t.type)===i).map(t=>`<button data-type="${t.type}" aria-pressed="false">${t.label}</button>`).join('');
if(archive){document.querySelector('h1').textContent='設置・交流アイディアの控え。';document.querySelector('.intro>p').textContent='前回の14案を保存。設置型・ケア用品・分類検討中のものを含む、未確定のアイディア集です。';}
function render(type='all'){
 const items=toys.filter(t=>type==='all'||t.type===type);
 document.querySelector('#count').textContent=`${items.length} のおもちゃ案`;
 document.querySelector('#catalog').innerHTML=items.map(t=>`<article class="toy"><div class="art">${picture(t.art)}<span class="type">${t.label}</span><span class="number">${String(toys.indexOf(t)+1).padStart(2,'0')}</span><span class="slot">${picture(t.art)}</span></div><div class="details"><span class="status ${t.review?'review':''}">${t.review?'分類・用途を要検討':'単タイプ候補'}</span><h3>${t.name}</h3>${t.placement?`<p class="placement">設置：${t.placement}</p>`:''}<p>${t.play}</p><p class="reason">${t.reason}</p></div></article>`).join('');
 filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.type===type));
}
filters.addEventListener('click',e=>{const b=e.target.closest('button');if(b)render(b.dataset.type);});
document.querySelector('#small-preview').onchange=e=>document.body.classList.toggle('show-small',e.target.checked);
render();
