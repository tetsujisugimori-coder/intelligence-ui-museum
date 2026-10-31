# Stage A 最終補強・実測

2026-11-01 JST。開始HEAD `02673bdc290728bbc79c134b4f0e2cb8f7a7d04a`。本記録は修正担当の新規自己検証であり、独立再レビューではない。以前の独立確認は `../issue-4-independent-20261101/independent/README.md` に別途保存。

- 合成結果を用いた `skip-probe.cjs` では、旧validatorはnoJS条件に `status: SKIP` または `skipped: true` が付いても成功とした（red-skip.json、検出プローブexit 1）。正常runnerがSKIPを生成した事実はない。修正後は条件のSKIP／非PASS、matrix内のSKIP付きassertを拒否し、同一プローブexit 0（green-skip.json）。正常fixture成功、欠落・未完走も失敗。
- 新規隔離コピーで配信root内にWindows junctionを作り、root外の無害なマーカーへの実HTTP要求を注入。修正前200とマーカー内容（junction-red.json）、修正後403と空body（junction-green.json）。両runnerのHTTP handlerを実在junctionと正常ファイルでテスト。実パス解決を行いroot外を拒否。並行した悪意あるlink差替えの完全防止は検証していない。Linux実機のlink境界はCIで同じ契約試験を行う。再現用wrapperはjunction-probe-playwright.cjs。隔離rootに `escape` junctionを作り、`REAL_PLAYWRIGHT`、`SYMLINK_RESULT`、`APP_ROOT`、`CODEX_PRIMARY_RUNTIME_NODE_MODULES` と新規 `EVIDENCE_DIR` を指定してsmoke runnerを実行する。対象は自作マーカーのみ。
- Windows Node 24、Chromium 151 / Playwright WebKit 26。修正後、実ブラウザ正常12条件exit 0、Alert再表示失敗とpageerror注入は各12条件exit 1。timeoutはPlaywright TimeoutErrorの合成注入、ブラウザ異常はlaunch後の強制closeで代替し、ともにexit 1。real-summary.jsonにJSON validatorとprocess終了コードの照合、real-*.jsonに各report。OSの自然発生timeout／crashではない。
- 判定後のpageerrorは `late-probe.cjs` で旧HEAD 910b8c5の見逃し（red-late.json、プローブexit 2）と現修正の検出（green-late.json、exit 0）を同一合成条件で今回再実行。以前の独立証拠は別に保持。契約25/25、FAIL 0、SKIP 0、exit 0（contracts.log）。`node --test scripts/stage2r-runner.test.cjs` はv10の新規コピーで実施。
- 保全はpreservation.log、v09 293948 bytes、SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`。保存bundle302ハッシュ・保護証拠・117件11分類PASS。展示全操作を意味しない。

Linuxの実ブラウザとlink境界はCI結果を参照。Stage 3 HOLD。新HEADの独立再レビュー待ち、マージ推奨NO。
