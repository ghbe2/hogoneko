// Runs actual browser regressions; a green report is not a substitute for visual review.
const {spawnSync,execFileSync} = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const suites = {
 encounter:[
  ['餌選択・保護器の設置・開封までの100通りの座標タッチ', 'encounter-transition-matrix.test.cjs']
 ],
 operations:[
  ['通信切断・再接続・タブ再開とセーブ保持', 'audit-network-recovery.test.cjs'],
  ['パスワード入力・再読み込み', 'audit-login-touch.test.cjs'],
  ['保護器の終了通知欠落・指番号再利用', 'trap-missing-end.test.cjs'],
  ['病院の受付・診察・未払い', 'audit-clinic-touch.test.cjs'],
  ['保護センターの相談・子猫の案内', 'audit-center-touch.test.cjs'],
  ['複数飼育・部屋移動・収納棚との重なり', 'audit-household-touch.test.cjs'],
  ['α報告の入力・保存・送信失敗と再送（模擬応答）', 'audit-report-touch.test.cjs'],
  ['道具操作中の報告画面と復帰', 'audit-report-interrupt.test.cjs'],
  ['2匹目の呼びかけと救済', 'second-cat-help.test.cjs'],
  ['子猫と成猫の育成条件', 'care-balance-nov.test.cjs'],
  ['好みのおさがり・演出と受け取り', 'center-gift-flow.test.cjs'],
  ['周回後の基本チュートリアル抑制', 'first-activity-repeat.test.cjs'],
  ['6時間・24時間進める', 'debug-clock.test.cjs']
 ],
 critical:[
  ['コイン取得と撫でる操作、移動中の模様替え、抱っこ後の表示', 'room-continuity.test.cjs'],
  ['壁の足場へ玩具で誘導・抱いて降ろす操作', 'room-perch.test.cjs'],
  ['周回の命名とキーボード相当の表示範囲', 'intake-name-viewport.test.cjs'],
  ['部屋の抱っこ・相性と心・中断復帰', 'room-hold.test.cjs'],
  ['連打・ドラッグ中断・購入・報酬・再読み込み', 'interruption-recovery.test.cjs'],
  ['マップの進行停止', 'town-blocker-shared.test.cjs'],
  ['餌選択・操作中断／ChromeとWebKit', 'bait-mobile-recovery.test.cjs'],
  ['餌選択のTouch経路・保存再開・中断復帰', 'bait-touch-input.test.cjs'],
  ['道具の残留・複数指操作', 'tool-multitouch-cleanup.test.cjs'],
  ['案内枠の追従', 'home-tour-focus.test.cjs'],
  ['先輩と抱き猫の継続表示', 'senior-continuity.test.cjs']
 ],
 journey:[
  ['タッチのみで冒頭・保護・診察・購入・家具・命名・育成まで', 'first-journey-touch.test.cjs'],
  ['育成開始後のタップ補充・道具選択・呼びかけ／ChromeとWebKit', 'care-entry-touch.test.cjs'],
  ['一覧スクロール・家具収納・写真スワイプと中断', 'touch-surfaces.test.cjs'],
  ['最初から買い物・家具・育成まで', 'published-alpha-flow.test.cjs'],
  ['場面転換と会話の間', 'scene-beat.test.cjs'],
  ['譲渡会の入場と来場者の動き', 'adoption-beat.test.cjs'],
  ['育成4日目から予約・手術・譲渡・帰宅までのタッチ操作', 'published-alpha-lifecycle.test.cjs'],
  ['家族への受け渡し、中央での別れ、メールの報酬', 'adoption-farewell-nov.test.cjs'],
  ['通知・報酬・アルバム・再読込', 'mail-album-journey.test.cjs'],
  ['TNRと帰還・報酬の重複防止', 'tnr-return-journey.test.cjs'],
  ['手術の見出しと余白', 'surgery-heading-layout.test.cjs']
 ]
};
const mode = process.argv[2] || 'all';
if (!['all', ...Object.keys(suites)].includes(mode)) throw new Error('指定は all / critical / journey / operations / encounter');
const cases = mode === 'all' ? Object.values(suites).flat() : suites[mode];
const selected = process.argv[3] ? cases.filter(([,file]) => file===process.argv[3]) : cases;
if (!selected.length) throw new Error('指定した確認項目がありません');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(root, 'tests/screenshots/release-check', stamp);
fs.mkdirSync(out, {recursive:true});
function fingerprint() {
 const files = execFileSync('git', ['-c','safe.directory='+root.replace(/\\/g,'/'),'ls-files','--cached','--others','--exclude-standard','-z'], {encoding:'utf8'}).split('\0').filter(Boolean);
 const hash = crypto.createHash('sha256');
 for (const file of files.filter(f => /\.(js|css|html|cjs)$/.test(f) && !f.startsWith('docs/')).sort()) {
  hash.update(file);hash.update(fs.readFileSync(file));
 }
 return hash.digest('hex');
}
const report = {startedAt:new Date().toISOString(),target:process.env.GAME_URL||'local index.html',selection:selected.map(([,file])=>file),sourceBefore:fingerprint(),results:[],visualReview:'別途、保存画像と動作を確認すること'};
for (const [label,file] of selected) {
 console.log('\n確認中：'+label);
 const start = Date.now();
 const run = spawnSync(process.execPath, [path.join('tests',file)], {encoding:'utf8',env:process.env,timeout:file==='encounter-transition-matrix.test.cjs'?1200000:480000,maxBuffer:12*1024*1024});
 const log = (run.stdout||'')+(run.stderr||'')+(run.error?'\n'+run.error.stack:'');
 fs.writeFileSync(path.join(out,file+'.log'),log);
 const result = {label,file,passed:run.status===0,seconds:Math.round((Date.now()-start)/1000)};
 report.results.push(result);
 console.log((result.passed?'確認済み：':'失敗：')+label);
 if (!result.passed) console.log(log.slice(-4500));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
}
report.sourceAfter = fingerprint();
report.passed = report.results.every(r=>r.passed) && report.sourceBefore===report.sourceAfter;
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log('\n結果：'+(report.passed?'対象項目通過':'公開前に修正が必要')+'\n記録：'+out);
if (!report.passed) process.exitCode=1;
