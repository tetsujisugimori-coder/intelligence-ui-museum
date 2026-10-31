# 独立静的レビュー指摘への修正・自己検証

2026-11-01 JST。対象開始HEADは #7 `910b8c511674b3a1832531f521f94327adee679e`、#8 `23125bdd23ba1fff291f245a9f652dc44adee679e`。Stage Aの新HEAD `02673bdc290728bbc79c134b4f0e2cb8f7a7d04a` を通常のGitマージでStage Bへ取り込み、#8は引き続き#7を比較baseとする。独立担当は旧Stage A HEADをread-onlyで確認した。新修正に対する独立再レビューは未実施。

## RED → GREEN

- Stage A: 独立担当が旧matrix runnerでJavaScript errorsのPASS後にpageerrorが到着するとvalidatorがexit 0相当となる合成漏れを発見。実ブラウザで同タイミング到達は未実証。修正後、context終了後に収集結果を確定し、detail欠落・非空をvalidatorが拒否する。後着合成条件はexit 1相当、正常はexit 0、契約21/21 PASS。独立の旧HEAD実ブラウザでは正常exit 0、Alert再表示故障とpageerrorは各exit 1。詳しくは `../issue-4-independent-20261101/REPORT.md`。
- Shortcut Recorder: 修正前の新規隔離コピーで両ブラウザの実Ctrl+Aがtrusted・defaultPrevented=true、候補Ctrl+Aとなった（red-real-browser.json）。原因は予約キーの部分的な除外。修正後は安全側にShift+B／Shift+Kのみ記録し、Ctrl・Meta・Altを含む組合せと未確認キーを抑止しない。両ブラウザで実Ctrl/Meta+A/C/V/Xがtrusted・defaultPrevented=false。指定のCtrl/Meta文字群、Altと複合修飾、Tab/F5、無修飾、修飾キー単独は合成イベントで非抑止を確認。Escape、通常登録、重複、解除、タッチ代替を確認（green-regression.json）。Shift+B/K以外を登録できないことは意図的な制限。OS固有予約キーの網羅や実機Macは未検証。
- Notification Center: 修正前、個別既読後に再描画でフォーカスがbodyへ移った（red-real-browser.json）。修正後は既読時に同通知の削除へ、削除時に次・前・最後の削除後は追加ボタンへ移す。最初・中間・最後の削除、空、連続操作、Tab/Shift+Tab、一括既読、新規通知、リセットを両ブラウザで確認（green-regression.json）。新着のみpoliteのライブ領域を更新。実スクリーンリーダー読み上げは未検証。
- タイトルを `Intelligence UI Museum | v11 123 exhibits` に修正。ID、11分類、旧117データ全体・出自、123連番をverify.pyで確認。

## 自動検証とCI

Windows Node 24.20.0、Playwright 1.56.1、Chromium 151.0.7922.34、Playwright WebKit 26.0。新規の隔離コピーとOS割当てポートで実行。通常12画面条件（375/390/1280、ライト/ダーク、reduced motion、2エンジン）、追加4条件（375/390、両エンジン、200%ルート拡大、Tab、旧代表操作、不正入力、リセット）、JS無効2条件、予約キーと通知2条件の計20条件 PASS、FAIL 0、SKIP 0、各runner exit 0。Stage Bへ更新されたStage Aを取り込んだ後、別のv10コピーでもrunner契約21/21およびChromium/WebKit smoke 12/12、exit 0（stage-a-updated-smoke.json）。

`runner-summary.json` は通常4プロセスexit 0、pageerror故障注入プロセスexit 1を記録。注入2条件は意図的にFAILし、検出漏れ防止試験全体はexit 0。CIの新 `browser-v11` jobは固定lockfileのPlaywrightと両ブラウザを導入し、同じ隔離runnerを実行、失敗・未完了・pageerrorを非ゼロ伝播、JSON・画面・ログをartifactに保存。子試験4分、job 20分の上限と後片付けを設けた。CI最終URLとHEADはPR本文を参照。

修正前後の保全検査で302原本ハッシュ、保護証拠、v09 293948 bytesとSHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`、117件11分類を確認。全117件の実操作ではない。WindowsではGit autocrlf=falseを一時指定。過去証拠は変更していない。実機Safari・VoiceOver・スクリーンリーダー実読み上げ、Linux実機のStage Aブラウザ、symlink実体境界は未検証。CI緑と実装者自己確認は独立再レビューではない。#7→#8の順に独立再レビューへ引き渡し、両PRのマージ推奨はNO、Stage 3はHOLD。

## 変更ファイル

Stage Aは `apps/v10/scripts/stage2r-browser.cjs`、`stage2r-result.cjs`、`stage2r-runner.test.cjs` と新規 `evidence/issue-4-independent-20261101/`。Stage Bは `.github/workflows/ci.yml`、`apps/v11/exhibits.js`・`index.html`・`verify.py`・`README.md`、既存ブラウザ試験4本のPlaywright解決方法、専用 `package.json` / `package-lock.json`、新規 `regression-test.cjs` / `run-browser-ci.cjs`、本証拠ディレクトリ。CIはv10依存を更新せず、v11試験用にPlaywright 1.56.1を別lockで固定。
