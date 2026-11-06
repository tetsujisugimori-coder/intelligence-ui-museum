# S3-1 独立再レビュー（進行中）

2026-11-06 JST。担当: independent_review sub-agent。主担当と別の作成者によるレビュー・独自runner。ホスト/ブラウザ配布物/作業コピーは共有であり、独立した別マシンとは主張しない。

## 確認対象

- 初期main HEAD: `77d30ac54e35b8a6408fb5f56db4697adff8a452`
- 初期tree: `bae0835e1832cf569b71fd33816bb77acabf52c3`
- 受入契約: `docs/STAGE3-1-V10-RESEARCH-ACCEPTANCE.md`、ユーザーのT1〜T8契約
- 読取: AGENTS、`apps/v10/src/main.tsx` / `select-focus-return.ts` / main.css、既存browser/smoke/result/acceptance/focus-pixels、旧独立Select runner。

## 初期判断

1. 既存browser runnerは高さ900px・40条件（32root + Chromium font8）。今回高さ1000pxの32条件と同じ実施範囲とは呼べない。
2. six-components smokeは各engine390px代表1件。Button/Select以外の4部品について32条件の全操作を検証した証拠ではない。
3. 既存result validatorは条件とcheck名の完全性を検査するが、HEAD/tree/画像/hash/必須工程の結合は担当外。今回の証拠検証器で別途保護する必要がある。
4. Select helperは同一DOM、接続、有効性、departed・別focus先、doc focusを保護している。現時点、新製品P2は未確定。

上記1〜3は今回の受入証拠を設計する際の差異であり、既存runnerの契約外を製品P2としない。

## 独立新規実行

`tests/s3-reaccept-independent/run.cjs` は主担当の新runnerをimportしない独立コード。重点12focus（fresh page）、4代表条件の6部品、8独自fault/safety controls（focus抑止、別target、別focusへ移動、disabled opener）を予定。DOM identity・実キー・PNG・focus style・event・error・dist全hashを保存する。独立pixel oracleはNOT_TESTED。32条件の独立全件再実行とも呼ばない。

初回 `browser/results.json` はブラウザ未導入で起動失敗、rows0、exit1。環境障害であり製品FAILではない。記録を保全し、新しい出力先へ再実行する。

## 残るレビュー

主担当新runner/証拠検証器・最終HEAD・CI原ログ・artifact ZIP内部hash、独立故障注入と再レビューはまだNOT_TESTED。現段階で総合PASSを宣言しない。Stage 3 HOLD継続。

## 独立新規実行の追加（2026-11-06 JST）

- `source-readback.json`: main固定対象7ファイルをgitオブジェクトとbyte比較、v09 2原本hash一致、SDK manifest/lock 0.2.2。PASS。
- `chromium-local/results.json`: Chromiumで初回12row。Select復帰・値・safetyは成立したが既知KaTeX font CSP consoleと検証server favicon404を一律error扱いしFAIL。A Tooltipはscroll収束前の短い可視状態を採取し、後続isVisibleがfalse。内部時系列の因果はUNKNOWN。
- `chromium-local-classified/results.json`: raw consoleを保持し、厳密なKaTeX font-src self blockのみ既知残件として別分類、unexpected/pageerrorはFAILのまま。検証server favicon応答204、Tooltipをcenterへscrollして2frame後にkeyboard操作。Chromium 12row PASS（重点6、6部品代表2、fault/safety4）。WebKitローカルはbrowser配布domain403でBLOCKED。
- 主担当runnerのimportなしの独立実装。Playwright WebKitを実Safari扱いせず、独立pixel oracleはNOT_TESTED。
- `chromium-A-keyboard.png`を画像読取: 実Select「カード」の青い輪郭が左右を含め描画、カードの文字・状態値bを確認。全PNGを目視したとはしない。

## 独自反例とP2

1. **新visible()の垂直文字欠け誤PASS**。`clip-red/results.json`で正常pass=true、Badge `.samples{height:1px;overflow:hidden}`で文字rectが上下から逸脱、primary pass=true、独立probe exit1。clipped.pngではラベルが細線だけになることを画像読取。主担当がoverflowYとtext縦clipを追加、`clip-green/results.json`は正常true/故障false、exit0。製品変更なしで閉鎖PASS。
2. **新auditの未結合証拠/画像/矛盾誤PASS**。`audit-red/results.json`は合成契約fixture（ブラウザ実行の証拠ではない）。正例exit0、result JSONのmanifest項目欠落、stage log欠落、必須ring画像を重複画像で代替、focus44行目のfalse verdictをsummary PASSで隠す4反例はいずれもactual exit0/expected1。独立probe exit1。主担当へ修正依頼、再レビュー待ち。
3. **新ring()の輪郭半分欠落誤PASS**。`partial-ring-red-2/results.json`で正常true、Select clip-path inset右半分のみ残すと輪郭欠損でもprimary pass=true。独立probe exit1。初回`partial-ring-red`はprobe closureのrequire不足で失敗したため検査器REDとは区別。主担当へ修正依頼、再レビュー待ち。

これらは検査器のP2であり、新しい製品不具合とは主張しない。修正前原票を保全する。未修正の誤PASSがある段階で研究版総合PASSへ昇格しない。

独立runnerの代表操作行はButton/Badge/Alert/Switch/Tooltipの5部品、Selectは同じA/Bのfresh focus行で別に実施。初期JSONのkind名six-componentsは行内で6部品すべてを操作した意味ではなく、集計時に分ける。最終runnerはkind=five-component-operationsに明確化。

## 独立P2修正後の再レビュー（2026-11-06 JST）

- `partial-ring-green/results.json`: primary ringがancestorのclip-path/mask/transform/filter、haloのoverflow欠けをfail-closed化。正常true / 半分欠損false、独立probe exit0。半輪郭P2閉鎖PASS。
- `audit-green/results.json`: primary gateが必須JSON/SDK/全stageログをmanifestへ結合し、matrix画像11件の正確な名前とunique、focus各行・fault・regression内部整合を検査。合成正常fixture exit0、4反例すべてexit1・正しい理由で拒否。証拠gate P2閉鎖PASS。
- `audit-green-attempt`は更新後schemaへ合成fixtureが未追従だった正常対照失敗を保全。ここを正式GREENに数えず、fixtureを完全化し理由照合を加えた`audit-green`を採用。

新3件の検査器P2の局所修正は独立RED→GREENで確認済み。最終HEADでの正式CI実ブラウザ32件とZIP内部照合は引き続き未確認。研究版総合PASS判断は保留する。

## 新たな製品不具合の独立再現（2026-11-06 JST）

### Tooltip keyboard復帰時の消失

`tooltip-return/results.json`、`tests/s3-reaccept-independent/tooltip-return.cjs`。Chromium、375×1000 / dark / root200、fresh20ページ。center scroll→2frame→focusでTooltip表示→Tab→2frame→Shift+Tab→visible待ち→2frameの最終状態は **20/20で同じtriggerがfocus-visible/documentFocusを保持したままTooltip消失**（exit1）。row0はfocus412.6ms→tip追加415.6ms→scroll419ms→tip除去438.1ms。Shift+Tab後に一度visibleを観測したのは14/20、残り6/20は2秒内に可視を観測できずtimeout後も同focus/noTip。row0では表示待ちが成立し、その後に正常なキー入力由来のscrollと消失が続く。初期の短い可視状態だけを成功判定に使えない。

これは別条件・別手順の独立新規反例。A/Bの初期単純操作成功やSelect focus復帰修正と混同しない。SDKのscroll-close内部原因は別Issueでの確定調査が必要。製品を変更しておらず未解消。

### Buttonの狭幅outer outline欠損

`button-ring/results.json`、`tests/s3-reaccept-independent/button-ring.cjs`。16 Chromium条件で原本on/offと、SECTIONのoverflowだけvisibleにした診断対照on/offを比較（64PNG）。Button期待extentはcomputed outlineWidth3px + offset4pxで独立に定義した。

- 320/375/390×light/dark×root100/200の12条件: Button x21→outline左端14、SECTION padding clip edge15。元のoutline左側1column x14がroot100で12画素、root200で16画素欠け、overflowのみ解除した対照では描画される。
- 1280の4条件: 追加paint0、欠損なし。
- geometryだけの推測ではなく、on/off差分の差でactual paint差を確認。320/light/100のoriginal/unclipped画像を読取し左側外輪郭の差を確認した。全64PNG目視とは主張しない。

製品source/SDKを変更していない。本probe exit1。新ring検査の不当なFAILではなく、本物の描画欠損を検出している。新製品問題として別Issue・修正Draftへ分離し、今回の検査PRで期待を緩めない。

## 現段階の独立結論

旧Select BODY脱落は修正済み対象で再現せず、同DOMへの復帰を新規に確認。検査器3件のP2は独立RED→GREENで閉鎖した。一方、上記新製品2件は未解消であり、研究版の受入阻害条件を満たさない。**研究版総合FAIL維持、公開移行準備NO、Stage 3 HOLD継続**。検査用PRの限定マージ推奨は、最終HEADとCI/原artifactの独立照合後に別判断する。

独立補助再実行: `sdk-rerun/sdk.json`は主担当sdk.cjsを別担当が再実行（別oracleとは主張しない）、fresh registry tarのintegrityと2installのSDK自身2645ファイル一致、exit0。nested依存はSDKファイル比較から分離されlock/npm ciの保証範囲。2つのdistコピーのdiff-rもexit0。

## 最終候補freeze前の独立再レビュー（2026-11-06 JST）

主担当の`docs/S3-1-REACCEPTANCE-20261106.md`、原票README/IDENTITY、最新audit/browser/sdk/run/workflow、独立runnerを読取。研究版FAIL、T3/T5の製品P2、T6/T7の未完了、Stage3 HOLD継続という暫定結論を支持する。検証PRと製品修正・公開を分離する方針は妥当。

- 追加audit反例（SDK statusFAIL、同engine重複、focus fault集合重複）は655cb29版で実測RED、`audit-additional-red/results.json`。修正後はlocked SDK version/integrity/resolved/2645hash、engine集合、追加focus32条件、回帰13名を独立照合するgateへ変更。`audit-additional-green-final/results.json`は正例exit0、7負対照exit1・正しい理由でPASS。`audit-additional-green`は期待reason文言の不一致だけでprobeFAILになった中間記録として保全。
- CI2では独立Badgeの実innerTextが保存されておらず、改行差が原因だとの断定はできない。次のrunnerはinnerText/textContent/children3件/html/PNG/hashをassert前に保存し、各子要素の厳密期待配列と比較する。表示の実欠損はprimary矩形/画像検査で引き続き検出する。
- 独立CSP分類は生console全件と実securitypolicyviolation（blockedURI/effectiveDirective/time等）を結び、固定KaTeX URL・font-src・CSP文言・イベントがすべて一致する場合のみknown扱い。`chromium-csp-events/results.json`は12rowすべてCSP20件/console20件を対応付け、unexpected0でPASS。未知console/pageerrorを免除しない。WebKitでのこの改訂分類の新規実行は最終CI待ち。
- WebKitでpage.addStyleTagが既知font CSP errorに巻込まれる補助側の問題に合わせ、独立probeのfault/suppressionはDOMへのstyle挿入に変更。Button suppressionはcomputed outline/shadowを確認。縦clipは`clip-green-dom-style`、半輪郭は`partial-ring-green-dom-style-2`で正常true/故障false、exit0を再確認。途中のclosure assert不足ReferenceErrorは保全し正式GREENへ加算しない。
- 製品P2 #24 Tooltip / #25 Buttonは今回無修正。関連Draftは最小再現の別提出であり、製品改善のGREENとは主張しない。独立Tooltip20/20最終消失、Button12/16欠損の結論を維持。

**暫定総合: S3-1研究版FAIL。検証PR限定マージ推奨は最終HEAD/正式CI/原ZIPの独立照合待ちでNO。S3-2準備NO、Stage3 HOLD継続。** 最新headでの32条件・focus12・全故障結果とinspection/inventoryが揃った後に最終再レビューする。中間655cb29 CIのreadbackは最終HEADの成功証拠として流用しない。

信頼anchor追加の最終独立反例: `audit-anchor-red/results.json`（655cb29 gate）ではsourceをidentity/matrix/focusの全報告で同時に古い値へ変更、runner hashだけ変更の2反例をexit0で誤受理。`audit-anchor-green/results.json`は期待HEAD/treeをGitオブジェクトで解決し、source5fileとrunner全件をgit show/ls-treeのbyte SHAへ結合したgateで、正常fixture exit0、累計9負対照すべてexit1・正理由に変化。fixture自身も架空SHAから実Git HEAD/tree/hashへ修正したが、実ブラウザを実行した証拠と主張するものではない。最終candidateの独立code変更はここでfreezeする。
