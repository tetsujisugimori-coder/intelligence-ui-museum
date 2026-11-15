# 第7便 独立レビュー（途中）

確認日：2026-11-15 JST  
対象：`tetsujisugimori-coder/intelligence-ui-museum` Issue #60  
役割：実装担当と別の独立製品レビュー担当。製品実装・監査器作成・修正は担当していない。

## 対象と実施方法

- 実装候補 `495a6c7`、説明登録修正版 `9d1a7db`。
- `wave7.js` / `wave7.css`、gallery 統合、`verify.py`、事前受入契約を確認。
- 基準 main `d454ce561cc3d4e9fbd01efe0598cb32a07ae5f6` の141展示データ全項目と候補の先頭141件を直接比較。144連番・11分類、旧141一致を確認。
- Git差分で v09 / v10 / archive / lock の変更なしを確認。過去原証拠の全バイト再監査とは別。
- 製品単体28件を再実行。加えて製品関数から期待値を計算せず、BigIntで143の72組の費用・割合を別計算し、144の200遷移を独立したイベント列で検算した。すべてPASS。合成データによるモデル検査であり実ブラウザ証拠ではない。
- Chromium の375pxで独立した局所探索を実施。専用の `.work` 配信コピー・一時領域を使用。正式14条件の代替ではない。

## R7-1 — P2：gallery説明登録欠落（局所確認CLOSED）

### 修正前
初回読込で `説明未登録：Dependency Impact Explorer`、検索144で `説明未登録：Interaction Replay Timeline` のpageerrorが発生。既存 `museumDescription` の登録要件を満たさずgallery描画が中断した。wave7.js内部の説明文だけでは統合登録を満たさない。
後段の操作待機timeoutは検出成功に数えていない。製品が描画されない段階で独立探索を停止し、その後の操作は未実施として保存した。

### 修正と同じ入力による確認
`9d1a7db` で3展示のgallery説明登録と欠落検査が追加された。新しい配信コピーで、同じURL読込→検索144→操作を再実行し、描画・検索・操作への到達、pageerror0を確認した。

修正後に確認できた内容：
- count=10での追加increment拒否、履歴維持。
- 20イベントでの追加toggle拒否、履歴維持。
- 容量上限から時点1へ戻り、新ID21で分岐し将来を破棄。
- 内部Resetでevents/cursor/nextId/count/flagを初期化し、incrementへfocus復帰。
- 143の無効入力で表・グラフを消去し入力未確定を表示。
- 文書全体の横溢れなし（scrollWidth=clientWidth=375）。局所画像を実見。

原票対応：`R7-1-before.json` / `R7-1-before.log` と `R7-1-after.json` / `R7-1-after.log`。旧・新の配信ファイルSHA台帳を別記録した。本人限定保管先の取得URLはここへ掲載しない。原票の永続保存・保存後再取得は親の保全結果で別判定する。

## R7-2 — P3：入力エラーの過大表示（PENDING）
143の人数だけに `NaN` を入力しても、正常な日数・単価を含む3入力すべてが `aria-invalid=true` になる。フォーム全体の計算不可と、各入力自身の妥当性が区別されていない。
修正前観測は `R7-1-after.json` の `invalid scenario`（invalidFields=3）。最小修正と同一反例での再確認はPENDING。正式なVoiceOver実機検査は行っていない。

## 共通Resetの区別
既存galleryの外側Resetは外側buttonにfocusを維持する。第7便の内部Resetは展示別の事前定義先へ戻る。144では内部increment、外側gallery Reset buttonという差を実測した。外側Resetを第7便内部Resetの結果へ読み替えず、既存gallery契約として区別する。いずれも観測した範囲でfocus喪失はない。

## 検査器自身の失敗履歴
独立探索runner初回は `server.address().port()` の誤記で停止。製品障害ではない。原票を `initial-fail.json` / `initial-fail.log` として保持し、修正後に探索を行った。意味的な製品故障検出の件数へ算入していない。

## 暫定判定と未実施
- R7-1：局所Chromium同一操作でCLOSED。
- R7-2：修正・同一入力再確認PENDING。
- モデル・旧141登録保全・局所操作の確認は上記範囲でPASS。
- 正式固定14条件、通常画像全体の監査、故障/正常対照の正式結果、監査器負対照、最終HEADのCI、原ZIPの保存後実再取得・独立照合は本レビュー時点で未実施。
- WebKit、実機Safari、VoiceOver、物理touch、OS文字拡大はこの担当ではNOT_TESTED。

**総合PARTIAL。最終独立受入PENDING。限定マージ推奨NO。**
Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNを維持する。Draft解除・マージ・公開は実施していない。

## 追補：R7-2 原票独立照合（2026-11-15 JST）
実装担当が保存した単独展示の実Chromium原票を、別担当が読取り照合した。独立担当による新ブラウザ試行とは区別する。
- 同じ入力：people=`NaN`、days=`5`、cost=`2000`。
- 旧source SHA-256 `cd65b54b0cef12e688e43522ca1bc49d1b2e6f0b78d2c62507a00fae9a98ea52`：3欄すべてinvalidで固定期待に対しFAIL。
- 新source SHA-256 `a1e5ad5fedbaddf379b1b735696e6ed7e8b1997b75dea6909c66a1868560b901`：peopleのみinvalid、days/costはfalseでPASS。無効state・comparison=nullは維持。
- 原source bytesのhashとJSONを照合。前後trace ZIPの全entry CRCが正常、同入力の操作記録を確認。pageerrorは前後とも0。
- 個別照合原票 `R7-2-independent-audit.json`。保存後のLibrary再取得検査ではない。

**R7-2はこの同一反例・局所Chromium範囲でCLOSED。** 正式14条件への結果流用はしない。

## 追補：通常原票の読取り（2026-11-15 JST）
候補 `9d1a7db0c88664412cc17d9e08a3f2da71127abc` / tree `24e4afd95df3d7f55b0f18c3e981969585392709` の局所結果を読取り確認。
- Chromium通常6条件は原票上PASS。
- Chromium375px/dark/文字2倍は最初のsnapshot前にdocument overflowでFAIL。表示のblocking残件として親へ即時報告した。共有ライブラリ不足とは別。
- WebKit7条件は共有ライブラリ不足で起動できず、製品操作NOT_TESTED。
これらは局所実行であり正式CIではない。通常原画像の網羅監査は未実施。総合PARTIAL・限定マージNOを維持する。

## R7-3 — P2：文字拡大時の文書横溢れ（局所表示反例CLOSED、全段階回帰PENDING）
2026-11-15 JST。製品担当の保存済み375px/dark/reduced-motion文字拡大probe原票を独立読取り照合した。
- before：文書幅375pxに対しscrollWidth437px、右端超過32要素。
- 最初の修正after：依然437px、input3要素超過。この失敗を保持している。
- after2と最小化した最終after3：文書375px、scrollWidth375px、右端超過0要素。
- 最終CSSは `.wave7` と `label` のgrid列へ `minmax(0,1fr)` を指定し、min-contentによる入力の押し広げを止める変更。内容や期待値の緩和・overflow非表示による隠蔽ではない。
- 各原票cssHashと保存CSS実バイトを照合。最終after3 SHA-256 `dd66e209beff483563d464e3ef31a5251736192c46763664d6bebff1d08413a9` は製品commit `3fc95dd6c9147330cc0b4dfb56e340b32a0b2f02` のCSSと一致。
- 独立照合票 `R7-3-independent-audit.json`。副次の画像はページ上部だけで、対象展示の可読性を画像から確認したとは扱わない。

probeは初期文字サイズ値を固定して拡大しており、各文字の実測2倍・再描画後の全段階検査の代替ではない。局所14条件再検証03はこの追補時点で進行中。新HEAD正式CIではない。現状は全体PARTIAL・限定マージNOを維持。

## R7-resource — 予定外例外を伴う資源欠測対照の局所修正（2026-11-15 23:14 JST）
保存済み前後原票を独立照合。対象はwave7.jsにHTTP404を返す同一反例と、資源正常配信の対。
- before正常：initialized=3、欠測表示0、pageerror/consoleerror0、正常受理。
- before故障：故障自体はresource理由で拒否されたが、wave7Init未定義pageerror1とconsoleerror4を伴い工程FAIL。予定故障検出を工程成功へ混同していない。
- after正常：initialized=3、欠測表示0、pageerror/consoleerror0、正常受理維持。
- after故障：initialized=0、欠測表示3、pageerror0、予定404consoleerror1。resource理由の意味的拒否で、工程PASS。

前後index実バイトSHAとJSONを照合し、4本のtrace ZIP全entry CRCと同context HARのwave7.jsステータス（正常200、故障404）を確認。個別票はR7-resource-independent.json。
差分は第7便demo/initの関数存在確認と欠測メッセージ表示だけで、広範なcatch追加やerrorイベント抑制ではない。既存関数が存在して内部で例外を出す場合はこのguardで握り潰さない。pageerror許容リスト拡張はない。古いresource対照の未定義Init例外許容は残るが、新実行では発生していない。

局所同反例の修正結果は確認済み。正式CI・最終HEADの原ZIP監査はまだ未実施。正常ブラウザ全14条件の成功へ読み替えない。


## 2026-11-15 23:54 JST 正式CI・Windows原ZIP保全・独立監査追補

提出当時のPENDING/局所失敗は上記履歴として保持する。正式対象HEAD `9c74d898fa534de6f5b380cc36b425fb854afa8c` / tree `f9e2aacc7a4fe1e865fbeabf3db30531e6e721c4`、run43724015917/attempt1/artifact14166072555をGitHubで再確認。対象HEADの11 workflowは全てsuccess。

正式原ZIP107365453 bytesをWindows本人指定保管先へ無改変保存し、その保存先から実再取得。保存前/保管先/再取得の3実物は全byte・公式SHA-256一致。668メンバーCRC、manifest667対象全件PASS。作成/保全担当と別の独立担当が再取得実物の14条件×26段階、42pair、原ZIP内21負対照、実行source/配信/HAR/trace、代表画像12枚を実照合。既存監査器も新規workコピーで14/42および21負対照を再実行PASS。初回環境失敗は別保持。

**固定自動化範囲の限定技術受入PASS／原ZIP保全PASS／独立監査PASS／総合PARTIAL／限定マージ推奨YES（提案のみ）。** 143狭幅文字2倍の数値途中折返しは別改善提案。明示6実行sourceの全依存閉包収録、全途中画像の実見、実機全般は保証しない。並行担当のLibrary16原ZIP保全・最終レビューを保持し、今回のWindows1原ZIP追加保全と区別する。

Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、既存原因UNKNOWN、実機Safari/VoiceOver/物理touch/OS拡大NOT_TESTEDを維持。文書commit後のHEAD/CIは正式実行対象版と別記録。[正式保全・独立監査報告](formal-audit-20261115/REPORT.md)、[独立報告](formal-audit-20261115/independent-report.md)。Draft維持、マージ・公開なし。
