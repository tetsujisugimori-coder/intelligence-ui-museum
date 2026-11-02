# PR #8 Stage B 統合後・独立受入レビュー

**総合判定：FAIL。PR #8 マージ推奨：NO。** 固定HEADのStage A保護、既存CI、通常runnerは成立しましたが、要求されたTransfer Listの選択状態保持にP2を独立再現しました。CI成功を6展示すべての要求充足へ読み替えません。製品修正は行っていません。

記録：2026-11-02 JST。最終remote照合 09:28:37 JST。実装担当の自己検証と過去レビューの実行件数は、今回の独立実行に合算していません。

## 1. 対象の同一性

- HEAD：`b9d3b840162c8d03fa5d2f62c89793ea55ce7d03`
- tree：`502b90b0d62c9b0dd9d1b30c8531f0a12bcfc565`
- PR base：`main`、`6477d0bc3fcd207210524abeaace97d0e506e886`
- PR #7：merged=true、merge commitは上記mainと一致。
- PR #8：open、Draft=true、merged=false。開始時／最終時のPR・remote refs・取得ソースで一致。新規detached worktree `review-pr8-b9d3b84` を使用し、最終 `git status --porcelain=v1` は空。
- CI #41365082150：head_shaは対象HEAD。5ジョブの実checkoutは `657105507b6273863fc5beb52ae3ea2f1e6ba1e2`。その両親はmainと対象HEAD、treeは対象HEADと一致。仮mergeとHEADの取り違えはありません。

## 2. CI全ジョブと環境障害の区別

[対象CI](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/41365082150) は preservation、build、browser-stage-a regression、browser-stage-a clip、browser-v11 の5ジョブすべてsuccess。ログのcheckout5件と、提供artifact4個を取得・照合しました。

artifactのB通常28条件、PNG16枚、pageerror負対照2件、親summary exit0を現validatorで再照合し、A smoke12のvalidator成功、A regression9件・clip1件・描画fixture34件も照合しました。これは**既存Linux CI証拠の検査**であり、独立Linux再実行ではありません。

初回統合HEAD `597fcd3a7a1f2ca6ebcfe66ce4bd78bff7e2805b` のrun #41364955775は全体cancelled、browser-v11はfailure。他のAジョブもcancelledを保持します。失敗ログはUbuntu26.04へのPlaywright1.56.1導入時に `Cannot install dependencies` / `Playwright does not support chromium on ubuntu26.04-x64`、exit1。B製品試験前の環境障害で、製品回帰や負対照の成功ではありません。597fcd3→対象HEADの差分は **browser-v11のruns-onをubuntu-latestからubuntu-24.04へ変更した1行のみ**。依存lock、assert、20分上限は不変。A側ubuntu-24.04／15分上限も保持されています。

## 3. 今回の独立実行

Windows x64、Node v24.20.0、Python3.14.7、固定Playwright1.56.1、Chromium141.0.7390.37／WebKit26.0。各runnerは専用動的ポート・新規copy・新規出力を使用。他作業のserver／browserを停止していません。

|範囲|今回の実測|終了コード|
|---|---|---|
|A既存runner契約|25/25、fail0、skip0|0|
|B既存結果契約|8/8、fail0、skip0|0|
|A受入9ケース|正常smoke12、正常matrix40、150ms閉鎖遅延、閉鎖不能、枠消失、疑似要素非表示、後着pageerror、cleanup失敗、意図的1ms期限切れ。全9ケース期待成立|harness0|
|A clip負対照|matrix40/40でfocusを拒否。style判定の前提を保ち、描画差0、他assert完走をharnessが検査|子1／harness0|
|A描画fixture|34件：正常18 PASS、故障14 FAIL、未対応2 UNVERIFIED。全件期待一致|harness0|
|B通常runner|12 browser＋4 accessibility＋2 no-JS＋2 focused regression＋8 Modal＝28条件すべてPASS。PNG16枚検査成功|正常子5本すべて0|
|B pageerror負対照|2エンジンとも必須checks完走後、注入したpageerrorだけでFAIL|故障子1、全体runner0（期待した拒否）|
|別の6展示操作probe|6表示context×6基本操作群＝36群PASS。別の選択保持群6件は6/6 FAIL、raw観測6件を別記|収集器0、失敗はJSONに記録|
|選択保持の最小再現|2エンジンともno-op正対照成功、実移送で既存選択消失|製品受入test1|
|実測CSS文字2倍＋focus＋editable|6表示context成功。本文14→28px、36フォーカス観測、文書／各新cardに横overflowなし|収集器0|
|独自B timeout／不完全結果／cleanup|3ケースすべて親・summaryとも1、専用server閉鎖確認|各1、収集器0|
|独自validator観測|今回の正常出力からJSON30観測・PNG5観測。下記参照|収集器0|
|build・型・真正性・baseline・静的保全|build内tsc --noEmit、build、npm test、baseline、302原本、v11検査、JS構文を成功確認|各0|

A9ケースでは正常smoke／matrix／150ms遅延は子0。閉鎖不能・枠消失・疑似要素非表示・後着pageerror・cleanup失敗は子1。意図的1ms期限切れは子exit=null／SIGTERM／ETIMEDOUTであり、正常成功には含めません。

## 4. 新規6展示の独立受入

独自操作contextは両engine×375／390／1280px。375と1280はdark、390はlight、すべてreduced-motion。両theme×全3幅の12組は別途既存browser-testを今回再実行しています。独自試験を全組合せの網羅保証とは呼びません。

|展示|独立操作と判定|
|---|---|
|118 Time Picker|PASS（評価範囲）。23:59＋1→00:00、00:00/12:00の12h表示、min>max・空時刻のaria-invalid、Enter／Space／tap、Reset12:30/09:00–17:00。既存試験で通常範囲外も確認。|
|119 Transfer List|**FAIL（P2）**。複数移送、全件移送、空時エラー、2段Undo、Resetは成功。移送先に残る別の既存選択が消える。詳細は次節。|
|120 Kanban Board|PASS（評価範囲）。Spaceで移動、移動後card focus、同列no-op、Undo、実browser pointerのdragTo、tap可能な代替select/button、Resetを確認。物理タッチ実機ではない。|
|121 Heatmap|PASS（評価範囲）。データ3→5→Reset3、強度変更による実computed色変化、セル数値、座標を含むaccessible name、凡例、Enter選択、強度Reset2。色だけに依存しない情報を確認。|
|122 Shortcut Recorder|PASS（評価範囲）。Shift+B/K、登録・重複・解除、Escape、Tabによる記録中止、Shift+Tab、連続操作、Reset。Ctrl/Meta+A/C/V/Xは各engineでtrusted=true／prevented=false。検索inputのCtrl+Aによる4文字選択と、記録停止後contenteditableのCtrl+A選択も成功。クリップボードの実内容／OS予約キー全網羅は保証しない。|
|123 Notification Center|PASS（評価範囲）。新着とpolite status、個別既読後の同通知delete focus、削除後next／previous、最後の通知削除後Add focus、未読0/全0、再追加、一括既読、Tab／Shift+Tab、連続削除、Resetの未読1/全2。実読み上げの成功とは区別する。|

Playwright keyboard／pointer／tapによる実ブラウザ入力と、既存回帰に含まれる合成dispatchを区別しました。物理キーボード・実機タッチ・実Macで実行したとは主張しません。

## 5. 新規所見

### B119-STATE：P2、移送先の既存選択が別の移送で消える

対象：[exhibits.js L19](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/blob/b9d3b840162c8d03fa5d2f62c89793ea55ce7d03/apps/v11/exhibits.js#L19)。`draw()`が両側のcheckboxをchecked情報なしでinnerHTML再生成します。履歴もleft/right配列だけを保持します。

最小再現（無注入、両engineで成立）：

1. 119をReset。「設計」を左で選択し「選択→」。右へ移る。
2. 右の「設計」をチェック。
3. 左に選択がない状態で「選択→」を押すno-opでは、右「設計」のチェックはtrueのまま（正対照）。
4. 左の「実装」をチェックして「選択→」。
5. 期待：右に既にあった「設計」は選択trueを保持。移送した「実装」の選択方針とは独立した要求。
6. 実測：右の「設計」「実装」は両方checked=false、表示は選択0件。設計のbefore=true／after=false。

本試験は故障注入ではなく、ユーザー操作による自然な機能欠落です。6表示contextで6回再現、最小再現2engineでも再現。移送済み項目を次の操作のために選択しておく順序が成立せず、要求「選択状態の保持」を満たしません。データ項目自体の消失は確認していません。影響は119に限定されますが、今回の明示受入項目のためP2・マージ前必須と判断します。B製品16blobは旧B基準から不変なので、統合によって新たに導入された変更とは判断せず、今回初めて独立確認したBの機能欠落として扱います。

証拠：`transfer-minimal.json`、`transfer-before-{chromium,webkit}.png`、`transfer-after-{chromium,webkit}.png`、`independent-ui.json`。`node transfer-minimal.cjs` はexit1。画像でも前後のチェックを確認しました。

[既存browser-test L10](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/blob/b9d3b840162c8d03fa5d2f62c89793ea55ce7d03/apps/v11/browser-test.cjs#L10) は移送先の存在・件数・Undoを検査し、残る選択を検査していません。したがって既存CIとの相違原因は**検査範囲の不足と確定**しており、環境差や不安定失敗ではありません。

提案：項目IDごとの選択状態を明示保持し、移送対象と無関係な既存選択を再描画後に復元する。Undoの選択復元方針も定義し、両側に選択がある連続移送を回帰条件へ追加する。今回コード修正はしていません。

### B-ZOOM-TEST：P3、既存「文字拡大」試験の検証範囲不足

[accessibility-test.cjs L7](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/blob/b9d3b840162c8d03fa5d2f62c89793ea55ce7d03/apps/v11/accessibility-test.cjs#L7) はhtmlのfont-size:200%と文書overflowだけを確認します。今回両engine全3幅で新展示本文は14→14pxであり、本文2倍を検証していません。

独立試験では拡大前のcomputed font-sizeを採取し、新6cardの各子要素へ2倍pxを適用して本文14→28pxを確認。6contextで文書・各cardの横overflow、focus、editable操作が成功し、実画像の代表focus枠も確認しました。製品の文字拡大失敗を確認した所見ではありません。既存試験の測定／ラベル改善は後続P3へ送れます。

初期独自probeの「html200%が本文2倍になる」という前提違反6件と、追加probe初版のoutline shorthand解析ミス6件はrawログを保存し、製品失敗へ数えていません。後者はoutlineWidthによる測定へ訂正して6件再実行。さらに撮影時のfocus対象スクロールを加えたQA画像を別保存しました。QAの再撮影6件を受入成功件数へ加算しません。

新規P1は未確認。新規P2は上記1件、新規P3は上記試験範囲の1件。既知Issue #9／#10を新規所見として数えていません。

## 6. Stage A・異常系・validator

PR7受入済みHEADに対してmain treeは一致。targetではmainのCI以外532blobすべて不変。R-A1、R-A2-CLIP、result validator、既存25契約は保全され、今回の正常12/40・遅延／閉鎖不能・後着pageerror・clip／描画fixtureで再確認しました。R-A1の最大5000ms条件待ち、DOM除去とopener focus条件も不変です。固定sleepや上限延長で今回の成功にしていません。

B独自timeoutは、停止しない実子processとprobe専用1.2秒期限を使用。親timedOut=true、SIGTERM、exit1／summary1、server閉鎖・temp削除を確認。製品の通常4分期限を変更したものではありません。不完全JSONは最初の正常browser子12条件が完走した後の読み取り時にchecksを欠落させ、validator拒否→親1／summary1。cleanupは正常28＋pageerror2の全子完走後に一時削除例外を注入し、親1／summary1。専用serverは閉鎖済み、残ったreview生成tempだけをcontainment／symlink非存在確認後に手動削除しました。

独自JSON30観測では5種すべて正常受理、欠落record／duplicate／SKIP／必須check・count・trial欠落を拒否。status:PASSのままerrorだけを足す5観測は受理され、**既知Issue #10のP3を再確認**しました。現子testのcatchはFAILへ変更し、親は子exit・全条件・必須assertも検査するため、今回それによる到達可能な偽GREENは再現していません。

PNGは完全版受理、切断／CRC破損／末尾付加を拒否。未知critical chunk追加版はvalidatorと両ブラウザdecoderとも受理し画像読込も成功したので、表示不能な壊れた画像を通した不具合とは判定しません。全証拠の意味内容や任意PNG仕様への完全対応を保証するものではありません。

今回Windows Modal24試行中、WebKit375px/no-preferenceの1試行でEscape直後immediateCount=1。その後は24/24でDOM除去・focus復帰が成立。今回取得した対象CI artifactは24試行中即時残留0、最終条件24/24成功です。この差から旧Linux Modal失敗の根因を断定せず、**旧根因UNKNOWNを維持**します。

## 7. 保全・出自・依存

- 独自git blob照合：Aは1c45d45→256cc1dの差分からCIを除く97ファイル、Bは1c45d45→9aa70a3の差分からCIを除く122ファイルを抽出。両集合は重複0、targetで不一致0。mainの非CI532blobも不一致0。Stage B製品16blobは9aa70a32基準で不一致0。
- main→targetは123ファイル差分、CI以外の削除／既存main資産の変更なし。共通変更CI1ファイルを静的点検し、A regression／clipとB browserの共存を確認。
- 302原本は保存bundleを展開して全件hash照合。過去証拠保持、v09 byte equality、旧117のID／名称／分類、11分類・出自、v11旧117全dataset一致、118〜123の連番・名称・分類・独自出自が成功。
- `legacy/v09/index.html`、v10 public/distの原本は293948bytes、SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97` をgit生byteで確認。
- v10公式Apps SDK UIの依存／lockはmainから不変。追加展示は独自HTML/CSS/JS、外部runtime依存なし。BのPlaywright1.56.1は検証用devDependency。既存license／第三者表示のblob保持を確認。独自6contextの要求記録では外部URL要求0、pageerror0。新たな外部送信コードは確認しませんでした。

これらは静的保全と今回の限定操作結果です。全123展示・旧117展示の全操作成功という意味ではありません。

## 8. マージ前必須と後続対応

**必須：B119-STATEの選択保持修正と、今回の最小再現・両engine・連続移送／Undo／Resetの回帰確認。** 修正後のHEAD/treeを再固定し、B通常28・pageerror2・契約8と、CI全ジョブの成功を再確認する必要があります。A source／validator／保護資産やCIを変更する場合は、該当A受入も再実行してください。今回のStage A成功を新HEADへ自動適用しません。

後続対応可能：B-ZOOM-TESTの実測サイズ確認追加、Issue #9のtrusted loopback test server TOCTOU hardening、Issue #10の矛盾error拒否、ネイティブSafari/Mac・VoiceOver等の支援技術評価。現在の限定教材・隔離serverの範囲では、これらを無期限の必須ゲートにはしません。公開・低信頼の可変rootへの利用承認ではありません。

## 9. 未検証・限界

Linux独立再実行はNOT_TESTED。今回 `wsl --list --quiet` はWSL未インストールを示しexit1、Dockerコマンドも利用できません。環境を新規導入せず、既存Linux CIのログ／artifact照合と区別しました。Windows再実行は今回実施済みです。OS edition/buildのCIM読取はアクセス拒否で未確認、Windows x64という実行platform以上を補っていません。

実機Safari／Mac、VoiceOver・実スクリーンリーダーの読み上げ、物理タッチ、OS予約キー全網羅、全123展示の網羅操作、並行symlink差替えはNOT_TESTED／UNKNOWN。旧Linux Modal根因UNKNOWN、Issue #9／#10 P3は維持。今回の範囲では新たな解消主張をしません。

## 10. 再現コマンドと独立証拠

checkoutは `git worktree add --detach review-pr8-b9d3b84 b9d3b840162c8d03fa5d2f62c89793ea55ce7d03`。`python scripts/prepare-work.py` 後の `.work/v10` でbuild／型／真正性／baselineを検査。原ソースを変更せず、新規 `EVIDENCE_DIR` を割り当てました。

主要コマンド：

```text
npm run test:runner
node --test apps/v11/result-contract.test.cjs
python scripts/verify-migration.py
python apps/v11/verify.py
node --check apps/v11/exhibits.js
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
(cd .work/v10; node scripts/verify-baseline.mjs)
(cd .work/v10; node scripts/stage2r-browser-acceptance.cjs)
(cd .work/v10; node scripts/stage2r-focus-controls.cjs)
node apps/v11/run-browser-ci.cjs
node ../review-evidence-b9d3b84/independent-ui.cjs
node ../review-evidence-b9d3b84/zoom-focus.cjs
node ../review-evidence-b9d3b84/transfer-minimal.cjs
node ../review-evidence-b9d3b84/b-fault-driver.cjs
node ../review-evidence-b9d3b84/contract-independent.cjs
python ../review-evidence-b9d3b84/preservation-independent.py
python ../review-evidence-b9d3b84/final-check.py
```

Aには `CODEX_PRIMARY_RUNTIME_NODE_MODULES=<checkout>/tools/stage-a-browser/node_modules`、regressionには `ACCEPTANCE_CASES=normal-smoke,normal-matrix,modal-delayed,modal-stuck,focus-missing,focus-hidden,late-pageerror,cleanup-failure,runner-timeout`、clipは `ACCEPTANCE_CASES=focus-clipped` を指定。出力先はそれぞれ `a-regression`、`a-clip`、`a-fixtures`、B原runnerは `b-original`。Windowsの原本bundle検査は `GIT_CONFIG_COUNT=1 / GIT_CONFIG_KEY_0=core.autocrlf / GIT_CONFIG_VALUE_0=false / PYTHONUTF8=1` で生byteを保護しました。

独立証拠ルート：`C:\Users\tetsu\Documents\Codex\2026-11-01\task-4\review-evidence-b9d3b84`。`summary.json`、`preservation-independent.json`、`final-remote-check.json`、`EVIDENCE-INDEX-JA.md` とSHA-256索引を保存。原本・過去レビュー証拠は編集していません。

## 11. GitHub記録と次工程

この原報告を親側で統合し、投稿直前に最新HEAD・base・Draft・未マージ状態と重複なしを再確認しました。本コメントは通常の独立レビュー記録であり、正式APPROVE／REQUEST_CHANGESではありません。

Stage Aの保護は今回の固定HEADで受け入れ可能ですが、Stage BはP2の選択保持欠落があるため、**総合FAIL／PR #8マージ推奨NO**。修正と独立再確認後にのみ更新してください。Draft・未マージを確認し、Stage 3 HOLDを維持。製品修正、commit/push、正式APPROVE／REQUEST_CHANGES、Ready、merge／auto-merge、公開、Stage 3移行は実行していません。

### 証拠の保存・投稿時照合

投稿前照合は2026-11-02 09:31 JST。対象HEAD `b9d3b840162c8d03fa5d2f62c89793ea55ce7d03`、base main `6477d0bc3fcd207210524abeaace97d0e506e886`、Draft・未マージ、同レビュー重複なし。

独立証拠2056ファイルはローカル保存であり、上記ローカルpathをGitHubでアクセス可能な証拠リンクとは扱いません。本コメントに最小再現・期待/実測・試験範囲・コマンドと制限を残します。
- 保存原報告 `PR8-REVIEW-JA.md`（投稿用追記前19,498 bytes）：SHA-256 `4c9853e08524be6c63f33c3ae5a572a61dbfde62156de63d785037d582bfc1d0`
- `EVIDENCE-INDEX-JA.md`：`48f5711f31661765b3b0b2331465e719713d0d536781ddbf2ed142ba8c805ab7`
- `evidence-sha256.json`：`e9b408e63ce6830b14314a6a3d74c28ce2fbbff481f05fc5e3a6ccf5bbc4ab1c`

