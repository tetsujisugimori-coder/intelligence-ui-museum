# Stage A 再確認と後着pageerror修正

2026-11-01 JST。独立 read-only 担当が PR #7 の旧 HEAD 910b8c5 を別ディレクトリで確認。詳細・環境・未確認事項は independent/README.md。実Chromium/WebKitの正常12条件はexit 0、Alert失敗とpageerror注入は各exit 1。合成の起動失敗・保存失敗・errors/条件/finished欠落は非ゼロ。固定Chromiumパスなし、Windows/POSIXの字句境界を合成確認。Linux実ブラウザとsymlink実体境界は未検証。

独立担当は matrix のJavaScript errors判定後の後着エラーがvalidatorを通過する故障を合成再現（red.log、プローブexit 2、validator exit 0相当）。実ブラウザで同タイミングの発火は未実証。修正担当はcontext終了後に最終errorsを評価して固定し、validatorもdetail欠落・非空を失敗にする局所修正を実施。同じ後着合成条件でvalidator exit 1相当、プローブ自体 exit 0（green.log）。正常フィクスチャは成功し、runner契約21/21、独立レビュー由来18プローブは新しいerrors detail必須契約にfixtureを適合させ18/18（実行者は修正担当）。

独立担当の確認は旧HEADへの結果であり、この修正後HEADの独立再レビュー完了を意味しない。smokeのpageerror時は個別statusがPASSでもerrorsと全体終了コードで失敗判定する点に注意。Stage 3 HOLD。
