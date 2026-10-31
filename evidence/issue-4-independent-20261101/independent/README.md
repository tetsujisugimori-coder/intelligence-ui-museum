# Stage A 独立 read-only 再確認（2026-11-01 JST）

対象 PR #7 HEAD 910b8c511674b3a1832531f521f94327adee679e。実行担当は修正担当とは別の Stage A read-only レビュー担当。Git の対象 commit から対象5スクリプトを新規ディレクトリに抽出し実行、作業ツリーと既存証拠は未変更。Windows、Node v24.20.0、Chromium 151.0.7922.34、Playwright WebKit 26.0。v10の既存distを読取専用で使用。

- contract.log: 20/20、exit 0。ブラウザ起動失敗2件を含む。
- synthetic-exit-summary.json: 合成正常 exit 0、Alert失敗、pageerror、goto時pageerror、保存失敗は各 exit 1。errors欠落、条件欠落、finished欠落は各 exit 1。これらは合成ブラウザ／結果検証であり、製品不具合の実証ではない。
- real-normal.json / real-alert.json / real-pageerror.json: 実ChromiumとWebKitを起動した実ブラウザ上の独立故障注入。正常12条件 exit 0。Alert再表示のクリックをcapture段階で止めると両エンジンのsix-componentsで可視assert失敗、exit 1。six-componentsのButtonクリック時にmicrotaskで例外を投げると両エンジンのerrors配列へ記録されexit 1。ただし個別レコードstatusはPASSのままで、全体失敗とerrors配列を見ないと誤解する。正常の画面操作は製品全体の品質保証ではない。
- path-check.cjs と path-check.log: Node path.posix / path.win32の通常子要素・親脱出・名前共通prefixの兄弟をローカルで検査、両方PASS。Linux実機ではない。パス検査は字句上であり、シンボリックリンクを辿る場合の実体境界は未検証。
- late-matrix-probe.cjs / late-matrix-result.json: matrixの `JavaScript errors` のpassを記録後、同じerrors配列へ後着例外を追加する合成再現。配列には例外が存在してもpassはtrue、validatorは失敗0、exit 0相当。プローブ自身は欠陥確認を示しexit 2。stage2r-browser.cjsではpass記録後にもawaitがあり後着の観測窓がある。実ブラウザでの発火タイミング自体は未実証。

初期PR #7 CIは成功済みだが、独立再レビュー全体の完了や新修正HEADの検証ではない。未検証の事項をPASS扱いしない。
