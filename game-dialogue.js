'use strict';
// Shared by the game and dialogue-review.html. Edit dialogue here, not in renderers.
const TOWN_TUTORIAL={
 home:{target:'.town-destination.home',copy:'ここが、あなたのおうちです。今はひとり暮らしですが、猫を迎えるには十分な広さですね。'},
 swipe:{target:'.town-scroll-hint.is-up',copy:'一緒に暮らす猫を探しに行きましょう。街はずれに、猫たちが暮らす空き地があるんですよ。',action:' '},
 area:{target:'.town-area-scene.field .town-area-art',copy:'街はずれの空き地です。'},
 goal:{target:'.town-area.field .town-cat-goal',copy:'住民の方のお話から、このあたりには4匹の猫がいることがわかっています。'},
 rescue:{target:'.town-area.field .town-area-go',copy:'それでは、猫たちを探してみましょう。',action:' '}
};

const FIRST_GUIDES={
 fieldHello:{target:'.encounter-trap',copy:'おや、猫の気配がしますね。無理に追いかけず、保護器を使って保護しましょう。',next:'bait'},
 bait:{target:'.bait-carousel',copy:'保護器の中に、ごはんを入れて誘います。私が用意した「ウェットフード」を選んでください。',hint:'餌を横にスワイプ'},
 trap:{target:'.encounter-trap',copy:'選べましたね。次は保護器をドラッグして、猫がいそうな場所に置いてみましょう。'},
 trapReady:{target:'.illustrated-trap',copy:'あっ、保護器が揺れていますよ！猫が入ったようですね。見に行ってみましょう。',hint:'保護器をタップ'},
 captured:{target:'.capture-message',copy:'猫が入ってくれましたね！驚いていることもあるので、落ち着いて対応してあげましょう。',next:'toClinic'},
 toClinic:{target:'[data-action="go-clinic"]',copy:'帰る前に、まずは健康状態を確認しましょう。見た目だけではわからない体調の変化もあります。'},
 clinicScroll:{target:'.town-scroll-hint.is-down',copy:'それでは、動物病院へ行きましょう。街まで戻りますよ。',hint:'地図を下へ進む'},
 clinicBuilding:{target:'.town-destination.clinic',copy:'動物病院はこちらです。'},
 clinicHello:{target:'.reception-heading',copy:'ここは動物病院です。健康状態を調べたり、必要な治療や不妊去勢手術を受けたりする場所です。',next:'healthCommand'},
 healthCommand:{target:'[data-clinic="examine"]',copy:'様子がいつもと違うと感じたら、早めに診てもらいましょう。小さな変化に気づくことも大切ですよ。',next:'surgeryCommand'},
 surgeryCommand:{target:'[data-action="go-surgery"]',copy:'条件が整えば、不妊去勢手術を受けられます。猫が増えすぎないようにする、大切な活動です。',next:'firstCommand'},
 firstCommand:{target:'[data-first="exam"]',copy:'今回は初めての診察です。体調や体の様子を診てもらいましょう。'},
 healthy:{target:'.first-diagnosis',copy:'性別や体重、健康状態がわかりました。カルテと明細を確認して、医療費を払って帰りましょう。',next:'chartReview'},
 chartReview:{target:'[data-first="pay"]',copy:''},
 stats:{target:'.first-chart-stats',copy:'性別や体重なども分かりました。',next:'receipt'},
 receipt:{target:'[data-first="pay"]',copy:'初診ではこのような検査をします。医療費を払って、連れて帰りましょう。',next:'chartReview'},
 pay:{target:'[data-first="pay"]',copy:'カルテと明細を確認して、医療費を払って帰りましょう。',next:'chartReview'},
 shopBuilding:{target:'.town-destination.petshop',copy:'帰る前に、猫との暮らしに必要なものをそろえましょう。安心して過ごせる環境を準備します。'},
 shopHello:{target:'.store-clerk-head',copy:'ここは、街のスーパーホームセンターです。',next:'shopHelloDetail'},
 shopHelloDetail:{target:'.store-clerk-head',copy:'猫との暮らしに必要なものが、たくさんそろっています。猫の好みを見ながら揃えてあげてね。',next:'tools'},
 tools:{target:'[data-tab="tools"]',copy:'まずは初心者セットがおすすめです。「どうぐ」から選んでみてください。'},
 starter:{target:'[data-item="starter_set"]',copy:'ごはんやおもちゃ、お掃除の道具、それからお部屋に必要な基本の道具が入っています。'},
 quantity:{target:'.store-detail .store-quantity',copy:'個数を選びます。今回は１セットで大丈夫です。',next:'addCart'},
 addCart:{target:'[data-store="add"]',copy:'カートに入れてください。'},
 purchase:{target:'[data-store="checkout"]',copy:'初心者セットは10コインです。金額を確認して購入しましょう。'},
 homeBuilding:{target:'.town-destination.home',copy:'猫を迎える準備ができましたね！おうちに帰りましょう。'},
 homeHello:{target:'.room-carrier',copy:'おじゃましますね。さあ、猫が安心して過ごせるお部屋をつくりましょう。',next:'roomExplain'},
 roomExplain:{target:'.room-carrier',copy:'猫は環境の変化に敏感な子もいます。お部屋を整えて、安心できる場所を用意してあげましょう。',next:'layout'},
 layout:{target:'[data-action="toggle-layout"]',copy:'初心者セットの家具を置きましょう。右上の家具のマークを押してくださいね。'},
 addFurniture:{target:'[data-action="toggle-layout-tray"]',copy:'「家具を追加」を押して、置きたいものを選んでくださいね。'},
 chooseFurniture:{target:()=>`[data-action="pick-furniture"][data-item="${FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box'}"]`,copy:()=>`次は${getItem(FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box').label}を置きましょう。`},
 placeFurniture:{target:'.room-world > .floor',copy:'選んだ家具を、お部屋に置きました。'},
 addMore:{target:'[data-action="toggle-layout-tray"]',copy:'続いて、水入れとトイレも置いてあげましょう。ひとつずつで大丈夫ですよ。'},
 roomReady:{target:'.intake-footer-call',copy:'お部屋の準備ができましたね！まだこの子の名前を決めていませんでしたね。どんな名前にしましょうか？',next:'name'},
 name:{target:'.intake-footer-call',copy:'あなたが呼んであげたい名前をつけてあげてください。'},
 essentials:{target:'[data-action="toggle-layout-tray"]',copy:'ごはんとお水をいつでも用意できて、トイレも安心して使えるようにしてあげましょうね。',next:'cardboard'},
 cardboard:{target:'[data-action="toggle-layout-tray"]',copy:'初心者セットの段ボールも、気に入るかもしれませんね。こういう箱が好きな猫も多いんですよ。',next:'cutCardboard'},
 cutCardboard:{target:'[data-action="toggle-layout-tray"]',copy:'ちょきちょき……入口を作ってみましたよ。猫の隠れ家になりそうですね。置いてみましょう。'},
 moveFurniture:{target:'.placed-item.item-box',copy:'段ボールに触れたまま、指を動かしてみましょう。指を離すと、その場所に置けますよ。'},
 callFirst:{target:'.intake-footer-call',copy:'名前が決まりましたね！さっそく呼んでみましょう。'},
 callWait:{target:'.room-carrier',copy:'……'},
 callAgain:{target:'.intake-footer-call',copy:'まだ少し警戒しているのかな？焦らなくて大丈夫。何度か、優しく名前を呼んでみましょう。'},
 farewell:{target:'.intake-emerging-cat',copy:'出てきてくれましたね！少しずつ、あなたの家を安心できる場所にしていきましょう。',next:'lifeStarts'},
 lifeStarts:{target:'.intake-emerging-cat',copy:()=>`今日から${getCat(gameState).name}${getCat(gameState).sex==='female'?'ちゃん':'くん'}との生活が始まります。`,next:'askSenior'},
 askSenior:{target:'.intake-emerging-cat',copy:'困ったことがあれば、いつでも保護センターへ。お世話や保護活動のこと、一緒に考えましょう。',next:'goodLuck'},
 goodLuck:{target:'.intake-emerging-cat',copy:'それでは、この子との暮らしを始めてみましょう！応援していますね。',finish:true}
};

const INTRODUCTION_PAGES=[
 ['この街で暮らす猫たち','この街には、外で暮らす猫たちがいます。空き地や路地裏……お外で暮らすのは危険もいっぱい。'],
 ['生まれてくる命','それでも猫たちは生きていて、子どもも生まれていくんです。'],
 ['人と猫が一緒に暮らすために','過酷な環境で猫が増え続けないようにすること。人と猫が無理なく一緒に暮らせる環境をつくること。'],
 ['大切な保護活動','それも、大切な保護活動のひとつなんです。'],
 ['TNRという活動','猫を捕まえて、不妊去勢手術をして、元いた場所へ戻し、地域で見守る。そんな活動を「TNR」といいます。'],
 ['命をつなぐ','新しい家族を探すために保護することも、命をつなぐ大切な活動です。'],
 ['あなたにできること','さあ、猫たちと人が一緒に暮らしていくための一歩を、踏み出してみましょう。']
];

const ACTIVITY_DIALOGUE={
 firstScheduleSurgery:{copy:'体重2,000g以上で体調が整い、おうちに慣れたらアプリで手術を予約できます。ごはんをあげて育てましょう。'},
 firstScheduleEvent:{copy:'手術を終えた２日後が譲渡会です。たくさん遊んで人馴れさせれば、いい里親さんに巡り合えるかも。'},
 careNotice_ready:{copy:'目標の2,000gに届きましたね！右上のスマホのマークから、手術の予定を確認しましょう。'},
 careNotice_surgery:{copy:'今日は予約した手術の日です。ごはんはお休み中。左上の地図から動物病院へ行きましょう。'},
 careNotice_event:{copy:'譲渡会に参加できる日になりました。左上の地図から保護センターを訪ねましょう。'},
 centerHello:{copy:'こんにちは！猫との暮らしや保護活動について、何でも相談してね。'},
 centerHappy:{copy:'こんにちは！猫との暮らしや保護活動について、何でも相談してね。'},
 centerRescue:{copy:'保護には初診の10コインを用意しましょう。病気やケガがあると、治療費が追加になることもあります。足りない分は未払いになりますが、治療とお世話は続けられます。'},
 centerRoom:{copy:'ごはん皿・水入れ・トイレは暮らしの基本です。収納棚からごはんや道具を選べます。いつものカリカリと基本の道具は、何度でも使えますよ。'},
 centerSurgery:{copy:'大人は５日目、子猫は12日目から手術できます。体重2,000gと体調を整え、前日にアプリで予約しましょう。予約するとごはんはお休み。体重ぎりぎりなら、もう１日育てても大丈夫です。手術の２日後から譲渡会に参加できます。'},
 centerHeart:{copy:'玩具への反応を見て、好きな遊びを探しましょう。得意な玩具なら、短い時間でも仲良くなれます。苦手そうなときは、無理せず持ち替えてみてくださいね。'},
 centerMultiple:{copy:'戻ってきた子と暮らしながら、もう１匹を保護できます。それぞれのごはんと体調を見てあげてくださいね。'},
 centerRenovation:{copy:'部屋が手狭になったら、スーパーホームセンターで改装の相談ができます。１回の改装で、もう１匹を迎えられますよ。'}
};

const HOME_TOUR=[
 ['profile','.app-profile','基本情報','毛柄・性別・年齢を、ここで確認できます。'],
 ['vitals','.app-vitals','バイタル','こころは人馴れの目安。体重の変化も見ながら、毎日のお世話を続けましょう。'],
 ['calendar','.app-calendar','スケジュール','手術と譲渡会の予定です。手術に向けて、ごはんをあげて体重と体調を整えましょう。'],
 ['pay','.app-pay','ミャオペイ','持っているコインを確認できます。広告を見てコインを受け取ることもできます。'],
 ['close','.home-phone-close','お部屋にもどろう','右上の×でアプリを閉じて、お世話の道具を見てみましょう。'],
 ['play','.main-command-row [data-tab="play"]','あそぶ','おもちゃをネコの近くへドラッグして、一緒に遊びましょう。'],
 ['clean','.main-command-row [data-tab="clean"]','そうじ','掃除道具を汚れのところへドラッグ。お部屋をきれいに保ちましょう。'],
 ['food','.room-preparation [data-tab="food"]','ごはん','ごはんを選んで、お皿をタップしましょう。好みや体調を見ながら用意してあげてくださいね。'],
 ['items','.room-preparation [data-tab="touch"]','もちもの','使いたいケア用品を選んで持ち替えられます。左端の引き出しを押すと、収納棚を開けますよ。']
];
for(const [key,,title,copy]of HOME_TOUR)ACTIVITY_DIALOGUE['homeTour_'+key]={title,copy};
Object.assign(ACTIVITY_DIALOGUE,{
 seniorGiftOffer:{title:'受け入れの相談・おさがり',copy:'このマット、よかったら使ってくださいね。少し古くて傷みやすいけれど、猫を迎えるときにも役立ちますよ。'},
 seniorGiftPlace:{title:'おさがりを置く',copy:'「家具を追加」からマットを置いてあげてね。必要なものが揃うと、安心して出てきてくれるかもしれません。'},
 seniorTasteEmpty:{title:'好みの相談・ネコがいない',copy:'次の子を迎えたら、いっしょに好みを探してみましょう。'},
 seniorTaste:{title:'好みの候補（差し込み）',copy:'{分野}なら、{候補}あたりが気になるみたい。どれが好きか、反応を見ながら試してみてね。'},
 seniorMissing:{title:'生活必需品（差し込み）',copy:'{家具}は必要です。持っている家具から置いてみましょう。'}
});

