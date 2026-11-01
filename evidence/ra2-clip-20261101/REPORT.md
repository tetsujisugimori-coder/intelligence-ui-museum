# PR #7 / Issue #11 R-A2-CLIP修正報告
2026-11-01 JST。総合PARTIAL、局所実装者自己検証PASS、独立P2閉鎖は保留、マージ推奨NO。Draft・未マージ・Stage 3 HOLD。
修正開始HEAD `1c45d45e2bc5abb7f2618e81b93a1bc32a921a67`、tree `d7737e38d50a494c617a2237b77264def2eca395`（正確な照合値は `protection.json` を正とする）。修正後HEAD/tree・CIはPR #7の提出コメントで固定する。自己参照するcommit hashは本ファイルに埋め込まない。

## 結果
|区分|結果|プロセス|
|---|---|---|
|旧HEAD・丸いclip故障|40/40でfocus true、全assert成功、validator拒否なし|原runner exit0。新harness自身は「negative control accepted」を検出しexit1（RED）|
|修正後・同じclip故障|40/40で旧style判定true、描画差0、focusだけFAIL、その他assert成功、validator拒否|原runner exit1、新harness PASS（GREEN）|
|正常smoke|既存12条件、両engine、validator成功|exit0|
|正常matrix|既存40条件、全必須assert成功|exit0|
|既存受入|9ケース期待どおり（正常smoke、正常matrix、150ms閉鎖遅延、閉鎖不能、枠消失、疑似要素非表示、後着pageerror、不完全cleanup、意図的1msプロセス期限）|正常は0、故障は1／期限切れはexit nullとSIGTERM等を別扱い|
|追加描画fixture|14種×2engine=28件、期待どおり|専用harness exit0|
|runner契約|既存25成功、failure/skip 0|exit0|
|型検査/build、npm test、baseline、保全|各成功|各exit0|

旧HEADで再現した40件と修正後で拒否した40件は同一条件の比較であり、40件の新しい自然発生製品障害を修正した意味ではない。runner契約25、既存受入9、新受入1、追加fixture28を合算した成功件数は示さない。
追加fixtureの正対照はafter、本体outline、shadow、無害clip、内側へ位置の異なるafter、祖先overflowでも枠を切らない条件の6種。負対照は描画なし、visibility:hidden、opacity:0、透明、丸いclip、祖先clip、flushな祖先overflowの7種。残り1種はfilter:brightness(1)をUNVERIFIEDとして拒否。各engineで6受理・7 FAIL・1 UNVERIFIED。

## 証拠と試行中の問題
- `old-head-clip/`：未変更旧runnerの生matrix、stdout/stderr、子exit0を含むharness記録。`protection.json`で開始HEADとのbyte一致を確認。
- `normal/` / `clip/`：生matrixとログ、390px/light/root100の両engineのON/OFF/ON2画像。両engineの正常画像に青いringがあり、clip画像では消えていることを目視確認。ローカル環境では日本語fontが欠けており、一部文字は代替字形。文字の外観適合は今回の判定外。
- `focus-controls/`：28件の全数値、代表画像。完全な4画像×全条件は実行時に生成し、CI artifactに保存する。
- `contracts.log` / `preservation.log` / `build.log` / `authenticity.log` / `baseline.log`：別々の検証ログ。
- `attempt-missing-libraries/`：最初のWebKit依存不足と、撮影余白がviewport外1pxになる判定で未完／誤FAIL。これを成功へ合算していない。box自体の可視性を要求し、撮影用余白はviewport内へ収めるよう修正。
- `attempt-transition-unverified/`：正常40のうち2条件で短いpseudo transform遷移をUNVERIFIEDとした試行。正常成功とは数えない。有限animation終了を状態待ちする修正後、正常40/40を再実測。
- `attempt-fixture-ua-outline/`：初版fixtureに残っていたUA本体focus枠のため、after非表示でも実際に別の枠が見えた。fixtureのbody outlineを明示noneとして条件を分離し、再測定。この試行を製品故障や検証器の見逃しとは扱わない。
- `protection.json`：R-A1/result/25契約byte不変、302/v09等は別ログ、Bの16blob・123連番・旧117完全datasetの静的照合。PR #8の実操作は行っていない。

## 再現
新規checkoutで `python3 scripts/prepare-work.py`、`.work/v10`で`npm ci --ignore-scripts`・`npm run build`。`tools/stage-a-browser`で`npm ci --ignore-scripts`・`npx playwright install --with-deps chromium webkit`。
`CODEX_PRIMARY_RUNTIME_NODE_MODULES=<repo>/tools/stage-a-browser/node_modules`と新しい`EVIDENCE_DIR`を設定し、`.work/v10`から`node scripts/stage2r-browser-acceptance.cjs`（既存9+追加clipの10ケース）、別の出力先で`node scripts/stage2r-focus-controls.cjs`（28fixture）。クリップだけなら`ACCEPTANCE_CASES=focus-clipped`。
旧HEAD再現には別の新規copyで開始HEADの原`stage2r-browser.cjs`/resultを使い、新しいharnessの同じclip注入を適用する。原runnerの期待assert・製品CSS・HEADは変更しない。新harnessが旧版の偽GREENを拒否するため、harness自身のexit1と原runnerのexit0を区別する。

## 限界・次工程
判定方法・閾値・未対応描画条件は `docs/R-A2-CLIP-20261101.md`。WCAGコントラストやフォーカス外観の完全適合、全117操作、任意CSS、実機iPhone Safari/Mac、VoiceOverは未検証。今回の実行はUbuntu 24.04 / Node 24.22.1 / Playwright 1.56.1 / Chromium 141.0.7390.37 / WebKit 26.0。Windows独立レビューの結果を今回の実行に含めない。
Issue #9/#10、旧Linux Modal根因UNKNOWNを維持。独立レビュー担当は、固定された新HEADの原正常40・同一clip40・正負対照・R-A1回帰を再確認し、P2閉鎖可否を判断する。PR #8取り込み・再レビュー、Ready化、merge/auto-merge、公開、新展示には進んでいない。
