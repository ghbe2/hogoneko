'use strict';
// Shared by the game and dialogue-review.html. Edit dialogue here, not in renderers.
const TOWN_TUTORIAL={
 home:{target:'.town-destination.home',copy:'ここが「あなたの家」です。いまはあなたしか住んでいませんが、ネコを迎え入れるには十分な広さです。'},
 swipe:{target:'.town-map-composition .town-scroll-hint',copy:'一緒に暮らすネコを保護しに行きましょう。街はずれに、空き地があります。',action:' '},
 area:{target:'.town-area-scene.field .town-area-art',copy:'街はずれの空き地です。'},
 goal:{target:'.town-area.field .town-cat-goal',copy:'住民の声を聴いて、ここには４匹の野良猫がいることが分かっています。'},
 rescue:{target:'.town-area.field .town-area-go',copy:'さっそく保護しに行ってみましょう。',action:' '}
};

const FIRST_GUIDES={
 fieldHello:{target:'.encounter-trap',copy:'ネコの気配がありますね。保護器を置いて捕獲をしてみましょう。',next:'bait'},
 bait:{target:'.bait-carousel',copy:'保護器に餌を入れておびき寄せます。私が用意した「いつものカリカリ」を選んでください。',hint:'餌を横にスワイプ'},
 trap:{target:'.encounter-trap',copy:'餌を選びましたね。保護器を持ち上げて、ネコがいそうなところに置いてみましょう。'},
 trapReady:{target:'.illustrated-trap',copy:'保護器が揺れています！ネコが入ったようです。見に行ってみましょう。',hint:'保護器をタップ'},
 captured:{target:'.capture-message',copy:'保護器にネコが入りました。',next:'toClinic'},
 toClinic:{target:'[data-action="go-clinic"]',copy:'おうちに連れて帰る前に、健康状態をチェックしましょう。'},
 clinicScroll:{target:'.first-down-hint',copy:'動物病院へ行きましょう。街まで戻ります。',hint:'下にスワイプ'},
 clinicBuilding:{target:'.town-destination.clinic',copy:'動物病院はこちらです。'},
 clinicHello:{target:'.reception-heading',copy:'動物病院では、保護したネコの体調を調べたり、必要な手術ができますよ。',next:'healthCommand'},
 healthCommand:{target:'[data-clinic="examine"]',copy:'これから育成する中でネコの体調が悪そうだと思ったら、すぐに受診しましょう。',next:'surgeryCommand'},
 surgeryCommand:{target:'[data-action="go-surgery"]',copy:'ネコがちゃんと育っていれば避妊手術ができます。これも保護活動の大きな目的の一つです。',next:'firstCommand'},
 firstCommand:{target:'[data-first="exam"]',copy:'今回は初診です。体調や様子をチェックしてもらいましょう。'},
 healthy:{target:'.first-diagnosis',copy:'健康な子でしたね。性別や体重も分かりました。カルテと明細を確認して、医療費を払って帰りましょう。',next:'chartReview'},
 chartReview:{target:'[data-first="pay"]',copy:''},
 stats:{target:'.first-chart-stats',copy:'性別や体重なども分かりました。',next:'receipt'},
 receipt:{target:'[data-first="pay"]',copy:'初診ではこのような検査をします。医療費を払って、連れて帰りましょう。',next:'chartReview'},
 pay:{target:'[data-first="pay"]',copy:'カルテと明細を確認して、医療費を払って帰りましょう。',next:'chartReview'},
 shopBuilding:{target:'.town-destination.petshop',copy:'ネコを飼育するために必要なものを買いに行きましょう。'},
 shopHello:{target:'.store-clerk-head',copy:'いろいろありますね。ここは街のスーパーホームセンター。',next:'shopHelloDetail'},
 shopHelloDetail:{target:'.store-clerk-head',copy:'ネコとの暮らしに必要なものが揃います。',next:'tools'},
 tools:{target:'[data-tab="tools"]',copy:'最初は初心者用のセットを買いましょう。「どうぐ」にあります。'},
 starter:{target:'[data-item="starter_set"]',copy:'餌とおもちゃ、掃除道具、それにお部屋の基本的な家具が揃います。'},
 quantity:{target:'.store-detail .store-quantity',copy:'個数を選びます。今回は１セットで大丈夫です。',next:'addCart'},
 addCart:{target:'[data-store="add"]',copy:'カートに入れてください。'},
 purchase:{target:'[data-store="checkout"]',copy:'金額を確認して購入しましょう。初心者セットは10コインです。'},
 homeBuilding:{target:'.town-destination.home',copy:'これでネコの飼育を始められます。おうちにいきましょう。'},
 homeHello:{target:'.room-carrier',copy:'おじゃまします。',next:'roomExplain'},
 roomExplain:{target:'.room-carrier',copy:'まずはお部屋を整えましょう。ネコは気に入ったお部屋じゃないと、かごから出てきてくれません。',next:'layout'},
 layout:{target:'[data-action="toggle-layout"]',copy:'初心者セットに家具が入っています。「模様替え」を開きましょう。'},
 addFurniture:{target:'[data-action="toggle-layout-tray"]',copy:'置く家具を選びます。「家具を追加」を押してください。'},
 chooseFurniture:{target:()=>`[data-action="pick-furniture"][data-item="${FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box'}"]`,copy:()=>`次は${getItem(FIRST_FURNITURE.find(id=>!getPlaced(getRoom(gameState)).some(p=>p.itemId===id))||'box').label}を置きましょう。`},
 placeFurniture:{target:'.room-world > .floor',copy:'選んだ家具を、お部屋に置きました。'},
 addMore:{target:'[data-action="toggle-layout-tray"]',copy:'水入れとトイレも、順番に置いてあげましょう。'},
 roomReady:{target:'.intake-footer-call',copy:'準備が整いました。あ！まだ名前を決めていませんでしたね。なんて呼ぶか決まっていますか？',next:'name'},
 name:{target:'.intake-footer-call',copy:'この子をなんて呼ぶか、名前を考えましょう。'},
 essentials:{target:'[data-action="toggle-layout-tray"]',copy:'エサ入れ、水入れ、トイレ。この３つは絶対に必要です。',next:'cardboard'},
 cardboard:{target:'[data-action="toggle-layout-tray"]',copy:'あ、そうだ。初心者セットが入っていた段ボールもネコは好きかもしれませんね。置いてみましょう。',next:'cutCardboard'},
 cutCardboard:{target:'[data-action="toggle-layout-tray"]',copy:'チョキチョキ……入口をつくってみました。できました。置いてみましょう。'},
 moveFurniture:{target:'[data-room-world]',copy:'設置した家具は掴んで好きな場所に置けます。ひとつ動かして、置き場所を試してみましょう。'},
 callFirst:{target:'.intake-footer-call',copy:'決まった名前で、呼んでみましょう。'},
 callWait:{target:'.room-carrier',copy:'……'},
 callAgain:{target:'.intake-footer-call',copy:'顔を出すまで、もう何度か呼んでみましょう。'},
 farewell:{target:'.intake-emerging-cat',copy:'お部屋が気に入ったようですね！',next:'lifeStarts'},
 lifeStarts:{target:'.intake-emerging-cat',copy:()=>`今日から${getCat(gameState).name}${getCat(gameState).sex==='female'?'ちゃん':'くん'}との生活が始まります。`,next:'askSenior'},
 askSenior:{target:'.intake-emerging-cat',copy:'分からないことがあったら、いつでも保護センターにたずねてきてくださいね！',next:'goodLuck'},
 goodLuck:{target:'.intake-emerging-cat',copy:'がんばってください。',finish:true}
};

const INTRODUCTION_PAGES=[
 ['この街にも、どの街にも','野良猫がいます。空き地や路地裏。外で生きるのは危険もいっぱい。それでもネコは増えていくのです。'],
 ['野良猫から地域猫に。','過酷な環境で生きるネコが増えないようにする。これが保護猫活動を通じたネコとヒトの共生です。'],
 ['あなたにできること','野良猫を保護して、育てて地域に戻し見守る。']
];

const ACTIVITY_DIALOGUE={
 firstScheduleSurgery:{copy:'５日目に手術ができます。しっかりごはんをあげて体重を維持しましょう。'},
 firstScheduleEvent:{copy:'７日目に譲渡会があります。たくさん遊んで人馴れさせれば、いい里親さんに巡り合えるかも。'},
 centerHello:{copy:'こんにちは。活動の相談に来てくれたんですね。'},
 centerHappy:{copy:'すっごい幸せそうだね。'},
 centerRescue:{copy:'保護したら、まずは病院へ。性別や体重、体調を確認してもらいましょう。'},
 centerRoom:{copy:'ごはん皿・水入れ・トイレは必ず用意して、ネコのペースで仲良くなっていきましょう。'},
 centerSurgery:{copy:'手術前は体重と体調を確認。予定を変更すると、手術と譲渡会が２日ずつ先になります。'},
 centerHeart:{copy:'一緒に遊ぶ時間は、人馴れにつながります。お世話を重ねて、この子のペースを知っていきましょう。'},
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
 ['food','.room-preparation [data-tab="food"]','ごはん','ごはんを選んで、お皿へドラッグして用意します。'],
 ['items','.room-preparation [data-tab="touch"]','もちもの','使いたいケア用品を選んで持ち替えられます。準備の引き出しは、必要なときに開きましょう。']
];
for(const [key,,title,copy]of HOME_TOUR)ACTIVITY_DIALOGUE['homeTour_'+key]={title,copy};
