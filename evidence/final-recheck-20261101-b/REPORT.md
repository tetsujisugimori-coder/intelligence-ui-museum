# Stage B 最終補強・再検証と証拠索引

2026-11-01 JST。修正担当による新規自己検証。開始時 #8 HEAD `274b56f12c7d2dd84cf345ac655eefb032bdfddf`、#7 HEAD `02673bdc290728bbc79c134b4f0e2cb8f7a7d04a`。#7 の新HEAD `98a2bf210c2347062419979393226cddcbf3df7a` を通常のGitマージで#8に反映。独立再レビューやマージ承認ではない。

## 新たな再現と修正

- **Shortcut Recorderのフォーカス**：記録開始後、実際に代替selectへフォーカスを移し `Shift+B` を送ると、旧実装はChromium/WebKit・375/390px・動き2条件すべてでtrustedイベントを抑止し候補化した（shortcut-focus-red.json、8/8）。記録ボタン以外では捕捉せず、フォーカス移動で中止する局所修正後は同じ実キーが8/8非抑止（shortcut-focus-green.json）。検索入力で実Ctrl+Aの選択、Shift+Bの通常入力、Shift押下→K→解放、記録終了後の連続入力、Escapeを regression.json で確認。実Ctrl/Meta+A/C/V/Xも各エンジンでtrusted・非抑止。その他予約キー・F5は合成イベント、実機Mac／OS予約の網羅は未検証。Shift+B/Kのみ登録できる制限は維持。
- **WebKit再クリックとタッチ**：上記修正途中、既にフォーカスされた記録ボタンの再クリックでfocusoutが先行し記録開始できない状態を再現（repeat-record-red.log）。初案のpointerdown抑止はWebKitのtapを妨げた（interim-touch-failure.json）。記録ボタンのmousedownだけを抑止する案で連続クリックが成立（repeat-record-green.log）、両エンジンで連続tap・実キー・別コントロールへのfocus移動を最終回帰で確認。未確認の支援技術や実機タッチはPASSに含めない。
- **Notification Center**：既読後の同通知の削除ボタン、最初／中間／最後の削除後の次・前・空時の追加ボタン、連続削除、Tab／Shift+Tab、全件既読、追加、Reset直後のfocusを両ブラウザで再確認（regression.json）。通知本文・既読／未読数・politeライブ領域の構造も確認。VoiceOver等の実読み上げは未検証。
- **不完全結果の偽GREEN**：旧CI runnerは子プロセスを合成し12個の `{status:"PASS"}` だけを返させても、条件・assert・エラー配列・画像が欠落したまま全体exit 0（incomplete-report-red-summary.json と red-example）。修正後は条件組合せ・固有性・必須検査名・SKIP／エラー・実キー証拠・対応PNGの寸法・チャンクCRC・IEND・展開済み画像データ／ログを検証し、同注入でexit 1（incomplete-report-green-summary.json）。旧契約は9-byteの不完全PNGを受け入れた（png-red-contract.log）。修正後は切断・CRC破損・寸法不一致を拒否。画像の視覚的品質そのものの保証ではない。契約8/8 PASS（result-contract-tests.log）。
- **結果と終了コード／後片付け**：合成cleanup失敗の旧runnerはprocess exit 1にもかかわらず先に保存したsummary exit 0（cleanup-error-red-summary.json）。修正後はサーバー停止・copy削除の成否を確定してからsummaryを書くため、同注入では両方1（cleanup-error-green-summary.json）。この実験はcleanup経路だけを切り分けるため子結果の契約検証を合成モックした。意図的に削除失敗させた自分の隔離copyは、workspace内・reparse pointなしを確認後に手動で削除した。summary自体の書込みが失敗・途中終了する場合のファイル完全性はUNKNOWNで、process非ゼロを優先する。
- **timeout／失敗後片付け**：自作の停止しない子プロセスとテスト専用タイマー短縮でtimeoutを合成。process／summaryともexit 1、timeout記録あり、追加tempなし、localhost server非待受（timeout-observation.json）。不完全結果失敗でも同様（incomplete-cleanup-observation.json）。本番の4分上限は延長・変更していない。自然発生したOS timeoutではない。
- **CIサーバー実体境界**：隔離copy後に無害なjunctionを注入して実HTTPでroot外マーカーを要求すると旧handlerは200、新handlerは403（junction-red/green.json）。Windowsで元sourceのjunctionをNodeがcopyする試みはEPERMで未実行のため、その結果と区別する。実pathの境界を検査するが、並行した悪意あるlink差替えの完全防止は未検証。

## Modal 初回Linux失敗の調査

初回Linux CI `41250087411` のWebKit 375pxでEscape直後の即時カウントが1だった原因は **UNKNOWN**。新規Windows Chromium/WebKit ×375/390×reduced/no-preference、各3回の24試行でkeydown・cancel・DOM除去、視覚状態、focus復帰を測定（modal-measure.json。修正前後24試行ずつはshortcut-focus-red/green.json）。いずれも即時open 0、最終DOM 0、computed animation none／0s、transition 0s。Windowsではアニメーション待ちの根拠は観測されず、元のLinux失敗の原因を証明しない。CIに同じ8条件・24試行の記録を追加し、keydown・cancel順、DOM完全除去、focus復帰と5秒以内を必須とする。5秒待機だけの成功をもって原因を断定しない。Linuxの新実測は最終CI artifactを参照。

## 再実行結果・保全

Windows Node 24.20.0、Playwright 1.56.1、Chromium 151.0.7922.34／Playwright WebKit 26.0。動的ポート・新規隔離copyで、既存12表示条件、追加4条件、noJS 2条件、予約キー／通知2条件、Modal 8条件の **28/28 PASS、FAIL 0、SKIP 0、exit 0**。pageerrorの意図的故障注入2条件はそれぞれFAILを検出し子process exit 1、親検査exit 0（runner-summary.json / injected-pageerror.json）。200%はルート文字拡大の合成で、ネイティブの文字のみ拡大ではない。PNG完全性検査を追加した後に同じ28条件を再実行し、`final-browser.json`・`final-accessibility.json`・`final-nojs.json`・`final-regression.json`・`final-modal-measure.json`・`final-pageerror-injection.json` と `final-runner-summary.json` に保存。対応する `final-windows-*.log` と代表画像を本ディレクトリ、全16枚は最終CI artifactへ。結果validatorは期待条件と画像ファイル名・寸法・PNGチャンクCRC・終端・画像データを照合。

修正前後の `preservation.log` と `v11-identity.log`：保存bundle302ハッシュ、保護証拠、v09 293948 bytes・SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`、旧117の全データ・11分類・出自、新123連番を確認。これは旧117展示の全実操作成功ではない。Stage Aの新規実測とコマンドは `../final-recheck-20261101-a/REPORT.md`。

## 再実行コマンドとファイル

- 通常再現：v11の `npm ci` とPlaywright Chromium/WebKitを準備後、未使用の `EVIDENCE_DIR` を指定して `node apps/v11/run-browser-ci.cjs`。driverは子試験と隔離サーバーを管理。結果契約のみ `node --test apps/v11/result-contract.test.cjs`。新規 `modal-measure.cjs` と既存 `regression-test.cjs` はdriverから実行。
- 旧フォーカス問題：対象HEADのv11を新しい一時ディレクトリの `site/` に展開し、`RECHECK_DIR` と `CODEX_PRIMARY_RUNTIME_NODE_MODULES`／必要なブラウザ実行パスを指定して `node evidence/final-recheck-20261101-b/focus-modal-probe.cjs`。probeは実ブラウザ・localhost動的ポートを使い、その新しいディレクトリにresults.jsonを出力。
- incomplete-inject.cjs、timeout-inject.cjs、cleanup-error-inject.cjs、junction-inject.cjsは隔離Node processへ `NODE_OPTIONS=--require=<絶対パス>` で注入する再現用preload。既存証拠・他processを使わず、必要な環境変数と新規出力ディレクトリを与える。cleanup-injectは意図的に結果validatorをモックしてcleanup経路のみを試す。
- 主な変更：#7の4 runner／result/test、#8の `apps/v11/exhibits.js`、`regression-test.cjs`、新規 `modal-measure.cjs`、`result-contract.cjs`・そのtest、`run-browser-ci.cjs`、CI定義、README、両新規証拠ディレクトリ。既存証拠は上書きしていない。

Stage A Linuxの実symlink handlerを含む25/25契約試験はCI 41253223930で成功（stage-a-linux-contract-ci.log）。Stage A Linux実ブラウザsmokeと本候補の最終CI URL・HEAD・artifactはPR本文に記録する。実機Safari、VoiceOver、スクリーンリーダー実読み上げ、実機Mac予約キー、自然発生timeout/crash、並行link差替えは未検証。初回Linux Modal失敗原因はUNKNOWN。独立再レビュー未完了につき#7・#8ともマージ推奨NO、Stage 3 HOLD。

### 合成preloadの実行例（PowerShell）

次は不完全結果の検出例。`<repo>` は対象commitの独立checkout、`<new-output>` は未使用の書込み先。旧HEADと現HEADを別々に用い、preloadは本HEADから別の一時場所へコピーし、既存証拠には出力しない。

```powershell
Set-Location <repo>
$env:NODE_OPTIONS='--require='+'<preloadの絶対パス>'
$env:EVIDENCE_DIR='<new-output>'
node apps/v11/run-browser-ci.cjs
$LASTEXITCODE
Remove-Item Env:NODE_OPTIONS
```

`timeout-inject.cjs` は追加で `PORT_CAPTURE=<新規ファイル>`、`cleanup-error-inject.cjs` は `CONTRACT_MODULE=<対象checkoutのapps/v11/result-contract.cjs絶対パス>` と `CLEANUP_TARGET=<新規ファイル>` を要する。`junction-inject.cjs` は専用外側ディレクトリの `BOUNDARY_OUTSIDE`、新規 `PROBE_PATH` を要し、そこへ事前に無害な `marker.txt` を置く。これらは意図的な故障でexit非ゼロになる。実験用ディレクトリ以外へのリンクや他processの停止を行わない。
