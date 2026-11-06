# S3-1研究版 再受入（2026-11-06 JST）

親Issue #18 / 再受入Issue #22 / Draft PR #23。製品対象はmain `77d30ac54e35b8a6408fb5f56db4697adff8a452`、tree `bae0835e1832cf569b71fd33816bb77acabf52c3`。提出ブランチは `test/s3-1-reaccept-20261106`。提出HEAD・tree・run・attempt・artifactの最終対応はPR #23の最終記録および当該CIの `identity.json` / `inspection.json` を正本とする（コミット自身のSHAを本文へ自己参照させない）。

**S3-1研究版：FAIL。Stage 3 HOLD継続。S3-2公開候補準備NO。公開・Draft解除・mergeなし。**

旧Select閉鎖後のBODY脱落は修正済みで、新規重点操作でも同じtriggerへ復帰した。しかし新規独立反例でTooltipのキーボード復帰後消失と狭幅Buttonのfocus輪郭欠損を確認した。旧FAILの原因が閉鎖されたことと、研究版全体のFAILは別の根拠である。製品コード・公式SDK・依存・lock・v09・v11は今回変更していない。

|ゲート|判定|根拠と限界|
|---|---|---|
|T1 対象固定|PASS|最新main/PR merge状態、5対象hash、公式SDK0.2.2固定・6import・fresh tar integrityと自身2645配布file一致、v09 117/11/byte保全。nested依存はlock/npm ciの別保証|
|T2 静的・build|PASS|隔離コピー2組、保全・既存runner単体・型/build・authenticity・baseline・dist全件diff、独立担当もSDK/2build再照合。最終CIの同名step/exitは原票を参照|
|T3 6部品|FAIL|実入力のButton/Badge/Alert/Switch/Select/Tooltipを新規確認。Tooltip復帰とButton輪郭に未解決製品P2。正常なDOM値だけでPASSとしない|
|T4 重点focus|PASS（Select限定）|A=320×1000 dark200/B=1280×1000 light100、両engine×3経路の正式12件。focusイベント、同DOM identity、値、PNG、画素対照。ローカルChromium6件は別件数|
|T5 32条件|FAIL|正式runnerは両engine×4幅×2theme×2root=32、高さ1000。条件ごとの各部品操作/画像を記録。Button狭幅欠損を正常扱いしない。最終の成功/失敗数はCI matrixを参照|
|T6 失敗検出|PARTIAL|縦clip、半輪郭clip、欠落・矛盾、SDK/engine集合の誤PASSを独立反例で発見・修正。正常synthetic契約と異常契約を分離。完全に正常な研究版のreal evidenceを用いたaudit-controlsは製品FAILのため未実施でありsynthetic成功で代替したと主張しない|
|T7 証拠・独立性|PARTIAL|別担当による独自browser・故障・コード読取、原票保全。元ZIPは別CI jobでCRC/内部hash/HEAD/treeを照合し、検査成功と製品PASSを分離。主担当ローカルへのZIP取得はネットワーク制限でBLOCKED。親担当の独立ダウンロード確認はPR最終記録を参照|
|T8 総合導出|FAIL|T3/T5の受入阻害P2が未解決。T4の旧Select問題解消やCIの局所成功で総合を格上げしない|

## 実行範囲

新runnerは全32条件でButton click/Enter/Space/disabled/loading、Badge 3labelと色、Alert danger/閉鎖/Enter再表示、Switch mouse/Space/ARIA/disabled、Select mouse/keyboard/Escape/再open/保持/disabled、Tooltip hover/keyboard/blur/viewportを実施。ButtonとSelectはon/off/off/onの画素差と幾何、部品テキストは両軸clipを確認する。全32条件と、重点12経路、Select追加32、14fault、4回帰setを混ぜて件数を増やさない。描画全体の人間による全画像目視やWCAG包括監査ではない。

Select再openでは可視DOMだけではmenuのkeyboard captureがまだ成立しない場合を初期診断で観測した。keyboard入力前にmenu focusを条件待ちし、close commit後の2frameを収束確認に使う。期待値は事前固定のa/bで、描画結果から逆算しない。失敗したv1〜v5も別原票として保全した。v5は製品Button欠損で狭幅12 FAIL/1280の4 PASS、Selectは16/16成立した。

既知KaTeX font-src self CSP blockは生consoleと実securitypolicyviolationを保存し、固定KaTeX URL・font-src・CSPイベントが一致するものだけ別分類する。未知console/pageerrorはFAIL。6部品にKaTeX数式を展示していない閉じた研究用途に限る分類であり、公開CSP問題の解消ではない。初期の一律console拒否とWebKit/Chromium版差の誤警報も保全する。

ローカル：Debian13 / Node24.19.0 / npm11.9.0 / system Chromium154、Playwright1.56.1。CI：Ubuntu24.04 / Node22指定 / Playwright1.56.1 Chromium141・WebKit26。ブラウザ版差を同一環境再現と呼ばない。ローカルWebKit配布先は403で停止、ポリシーを回避せずCIで実行する。root200は合成拡大で、実OSの文字拡大ではない。

## 新規製品問題（本PRで修正しない）

- **P2 #24 Tooltip**：独立Chromium375/dark/root200のfresh20件で、Tab→2rAF→Shift+Tab後、正しいtriggerにfocus-visible/document focusがあるのに説明が最終消失。うち14件は途中visibleも観測、6件は可視待ち2秒内に観測できず、最終状態は20件とも消失。focus→open→ancestor scroll→removeの順序を保存。固定Radixのscroll close listenerと整合する因果推論だが、修正介入・実Safariでの証明は未実施。別環境の純Tab10件/他20件は別原票・別件数。
- **P2 #25 Button**：独立Chromium16条件の原本on/offとSECTION overflowだけvisibleにした診断対照on/offを比較。320/375/390の12条件で左1columnの12画素(root100)/16画素(root200)が復帰、1280の4条件は差0。computed outline3+offset4、左x21→outer14に対しSECTION padding clipedge15。単なる7px仮定による誤FAILではなく、原画像の欠損を確認した。診断DOM変更を製品修正と呼ばない。

両件の再現用Draftは #24/#25からリンクする。製品の修正受入は別工程。今回の検証PRを取り込めるかと、研究版を受け入れられるかも別判断であり、最終独立レビューまで限定マージ推奨はNO。

## 検査器RED→GREENと証拠分類

独立担当は主担当runnerをimportしない実操作、独自clip/paint対照、synthetic監査器fixtureを作成した。縦の文字欠け、輪郭の半分欠落、必須JSONがhash対象外、stage log欠落、画像重複、追加focus rowのfalse、SDK FAIL、engine重複、focus fault集合重複の誤PASSを実測した。各修正で同反例を再実行し、正しい理由による非0へ変化を確認する。fixture更新不足や初期probe実装失敗は独立した失敗履歴として保全し、正式GREENに加算しない。

|分類|保存先/意味|
|---|---|
|今回新規・主担当local|`evidence/s3-reaccept-20261106/setup/` と `raw/local-*.json.gz`。製品sourceは固定main、runner改訂ごとのhashを含む|
|独立担当の新規実行|`raw/independent-local.tar.gz` はUTC10:47頃までのスナップショット。内部の実UTC日時を正本とする。後追加の原票は別JSON/原票として保存|
|今回CIのみ|最終runのsource ZIP、`identity.json`、`steps.json`、32条件/重点/fault原票。通常CIはPR用merge SHAと実headのtree一致を区別して確認|
|CI ZIP照合|別jobの`inspection.json`/`inventory.json`。元ZIP digest・CRC・全内部一覧/hash・manifestを検査。製品FAILのZIPが完全でも研究版FAILを維持|
|過去参考|PR #19旧BODYのRED、PR #21の局所RED→GREEN。今回の実行件数へ加えない|
|NOT_TESTED|実Safari、VoiceOver、OS native文字拡大、全117展示の完全操作、認証後の本配信asset。公開審査で別途扱う|

初回専用CI `42204503942` / `0b3aead` はSDK自身とnpm nested依存を混ぜた検査器エラーでexit1。元artifact `13495604060` / SHA256 `d2ab4dfb2385f2f74c6dcc4e946b46bcf0d194bcf76d95fff7c603bfb0871d92` を保全。次の `42205120241` / `655cb29` はmatrix1/focus0/faults1、独立3probe成功。過去成功HEADを最終HEADの成功と呼ばない。

## 残存リスクと引継ぎ

Issue #9の逐次TOCTOUは未解決。HTTPは信頼する隔離rootと127.0.0.1限定。敵対rootや公開serverに安全と主張しない。依存の脆弱性/到達性、release LICENSE、KaTeX font/CSP、認証後配信asset、実機Safari/VoiceOver/OS native拡大、全117完全操作はS3-2以降へ引継ぎ、解消扱いしない。

S3-1は現状FAIL。新P2の別修正→独立再レビュー→同一32条件と重点/反例の再受入が必要。S3-2移行の承認はNO、Stage3 HOLDは継続する。
