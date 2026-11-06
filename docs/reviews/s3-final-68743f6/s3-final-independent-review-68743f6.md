# S3-1 最終候補 独立再レビュー

2026-11-06 20:10 JST。担当 independent_review sub-agent。別作成者による独自操作・反例・再実行であり、ローカルのホスト/ブラウザ配布物は共有。

対象: `68743f6ff857e55f107ec6c1dc7b8e94b8d71511` / tree `bb7b9b2e5346ea748eea9d45997b61d4d2f1228d`、Draft PR #23。製品 main `77d30ac54e35b8a6408fb5f56db4697adff8a452` との差分は apps/v10、apps/v11、archive の全対象で空。製品・SDK・依存・v09原本を今回変更していない。

**S3-1研究版 FAIL。検証用PRの限定マージ推奨 NO。S3-2準備 NO。Stage 3 HOLD継続。** 根拠は未解決の製品P2 #24 Tooltip、#25 Buttonと、正常な製品による完全pipeline正例が未達なこと。旧Select P2閉鎖を研究版全体のPASSと混同しない。

|項目|独立判定|根拠・限界|
|---|---|---|
|T1|PASS|Gitオブジェクト、対象byte/hash、0.2.2固定/official配布物、v09保全。製品diffなし|
|T2|PASS|独立SDK再実行/2dist比較、最終CI保全/unit/2build/型/authenticity/baselineの成功。通常CIのclip jobのみ取得時点でin_progress|
|T3|FAIL|実操作を確認。Tooltip復帰後消失とButton輪郭欠損が未修正|
|T4|PASS（Select限定）|最終CI focus44row PASSのうち重点12、追加32を分離。独立local最終6重点操作も全PASS、同DOM・値・focusを確認|
|T5|FAIL|最終CI32条件=8PASS/24FAIL/未実施0。各engine狭幅12件ずつButton ring欠損、1280は各4PASS|
|T6|PARTIAL|live6fault PASS、独立縦clip/半輪郭/正常synthetic+9負対照すべて正理由で拒否。製品FAILによりreal正常artifactのaudit-controlsはskipped。syntheticを実正常製品証拠とは呼ばない|
|T7|PARTIAL|CI原ログと別inspectjobのCRC/digest/715file/569内部hash/HEAD/tree読取確認。独立担当自身のZIP取得はこのworkspaceでNOT_TESTED。親担当の別環境ZIP実読取は別分類で追記が必要|
|T8|FAIL|未解決受入阻害P2があるため。上記未完了を格上げしない|

最終専用CI run `42207105868` attempt1はfailure、matrix32=8/24、focus44PASS、livefault6PASS。別作成の独立runner24rowは23PASS/1Tooltip timeout、3独立probeはPASS。独立製品反例はChromium141でTooltip20/20 focused/noTip、Button16条件中12欠損/4正常を再現。Playwright WebKit26を実Safariと呼ばない。

主担当新検査器の縦clip・半輪郭・manifest未結合/画像重複/矛盾・SDK/engine/fault集合・source/runnerの自己申告hash受理について、独立REDから同反例GREENを保全した。最終候補でも独立再実行し、縦clip/半輪郭は正常true・故障false、auditはsynthetic正常exit0・9負対照exit1で正しい理由を確認。これらの検査器P2は閉鎖。製品P2は未解決。

最終候補localはChromium154で独立12rowを新規実行し11PASS/1FAIL。重点Select6、fault/safety4、B他5部品は成功。A320dark200はTooltip hover成功後keyboard表示待ち5秒timeout。原因はこの単独rowではUNKNOWN、前のPASSを最終HEAD成功へ流用しない。原票4実行archive `/tmp/s3-final-independent-68743f6.tar.gz`、SHA256 `66d4a0134115f652e0a796893bfa0f5826d62474069650a33ff3249c232a873d`。

元artifact `13497426548` は25,946,090bytes、ZIP SHA256 `5ac207cdabe90375349d2ed2165d5bd2e29b240211046b282d328280337a8037`。inspectjob `127859200642` はsuccess、715files/内部manifest569hash一致、HEAD/tree一致、sourceComplete=false/auditExit=1を保持。inspectionartifact `13497168015` のZIP SHA256 `c7e86bc1940df8c14479c0ba27ee1487386bcf77cc27aab3d1eef1180adc3dbd`。これはCI検査報告の読取であり、私自身のZIPダウンロード確認と混同しない。readback `/tmp/s3-final-independent-ci-68743f6.json`。

旧Select専用run `42207106111` はsuccess。artifact `13497656127` / ZIP SHA256 `629fc3c9cbbbcb08ac35ab5ae2a7dda258ed2ef49c19422d6af4535a968203c5`。過去PR21の成功件数ではなく今回のrunである。通常CI `42207105652` は取得時点で5job成功・clip browser install job継続中。これを全CI成功とは記さない。

残存: 製品P2 #24/#25、正常artifactによるaudit-controls、通常CI clip完了、独立自己取得ZIP。別工程のTOCTOU#9、依存/到達性、LICENSE、KaTeX/CSP、本配信asset、実機Safari/VoiceOver/native文字拡大/全117展示完全操作を解消扱いしない。

workflow permissionsの旧読取混同によるactions:read不足候補は撤回。最終68743f6の7行目でactions:readを確認し、実inspectjobも成功した。新しい実失敗とは主張しない。

製品修正・再受入の別工程を進め、同じ32条件・重点focus・反例で独立再検証が必要。今回はDraft維持、merge/公開/HOLD解除なし。
