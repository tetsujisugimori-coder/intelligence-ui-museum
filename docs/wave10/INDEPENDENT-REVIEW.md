# 第10便 独立レビュー履歴

## 最終追補：第10便の限定受入（2026-11-17 JST）

**総合PARTIAL、第10便限定技術PASS・独立レビューPASS・専用2原ZIPの保全PASS、第10便に限るマージ推奨YES。** 実マージは行っていません。
判定対象は `7e4cd0b2fb1340d8fe96de33c43005b0aabd0c09` / tree `e6cb5ace0f9f86479064da3eaef77bb4eb0e8e83`、Issue #66 / Draft PR #67です。

### 前回P2三件の限定閉鎖
[レビュー #5930182776](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5930182776)は旧 `c26af501` に対する指摘を現対象版で再確認しています。
1. 旧runnerの総数150固定：wave1〜9を153へ追随、no-JS117/153・静的117枚保持。CLOSED。
2. wave5〜9の配信/収集資源不足：wave10.js/cssを含む実HTML資源集合との統合照合。CLOSED。
3. 保全fixtureの正常例失敗：baselineと2,529保護原物の独立コピー、fresh checkoutで正常exit0・既存4改変exit非0。CLOSED。
これらは下記IR01〜IR05とは別の統合追随指摘です。IR01〜IR05も既存独立レビューでCLOSED、今回の確認範囲で新規未解決P1/P2はありません。

### 実施の区別
レビュー #5930182776の担当は対象版の単体355件・保護/migrationを再実行し、GitHubの14 workflow・19 checks成功を確認しています。正式14条件・各71操作・40正常/故障組・40監査負対照と、専用2原ZIPの保存後再取得照合は、先行するレビュー #5929842327の監査記録を参照しています。今回の文書追補は公開記録と数値・版・リンクの照合であり、独立ブラウザ再実行や原ZIPの新たな再取得ではありません。
専用2原ZIPと6代表画像の範囲を他13workflow原ZIP保全・実機・全画像へ一般化しません。局所/正式/独立の重複試験数は合算しません。

### 公開根拠
- [閉鎖確認レビュー #5930182776](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5930182776)
- [独立レビュー・専用原ZIP保存後再取得監査 #5929842327](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#pullrequestreview-5929842327)
- [提出最終報告（A〜O）](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/67#issuecomment-6932718774)
- [対象版の専用CI run 43978814869](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/43978814869)

### 版と今回の作業境界
この追補は上記対象版の確定結果を文書へ反映するものです。製品・oracle・監査器・workflow・lock・保護原物は変更しません。追補を含む新HEAD/treeと自動CIはPR #67の追補報告で別に記録します。上記版の実行・原ZIPを新HEADの実行証明へ読み替えず、今回原ZIPを再取得した、独立ブラウザを再実行したとも主張しません。
Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN、実機Safari・VoiceOver・物理touch・OS文字拡大NOT_TESTED、Sites公開NOを維持します。以下の失敗・PENDING・browser BLOCKED・途中判定は過去時点の履歴です。

---

## 以下は実装・検証途中の履歴（上記の最終追補と区別）
2026-11-17 JST。製品/oracle/browser実装担当とは別の審査担当がfresh checkout11e7efbで確認。

- P2 W10-IR01：153 oracleが固定label改変・余分fieldを受理。同一2拒否反例RED→GREEN。固定契約検証を追加。
- P3 W10-IR02：正当なcase順序変更を誤不一致。同一反例RED→GREEN、固定ID順へ整列。
- P2 W10-IR03：監査器がReset budget/priority/tool/args/epoch、initial counterの6変異を誤受理。実ブラウザではなく正常合成原票と同6変異でACCEPT→REJECT、正常ACCEPT維持。独立した64段階×3展示の全入力/版/epoch/counter/result照合を追加。監査負対照27→33。
- 独自10148判定（capacity10100+その他48）を修正後再実行PASS。製品255単体の件数とは別集合。
- fresh版で旧150全metadata/2529path/migration302確認PASS。

最終HEAD、正式CI、原ZIPの保存後独立再取得は記録時点PENDING。最終受入・マージ推奨はまだNO。GitHub最終報告で確定する。

## 追加審査（提出前）
- P2 IR04：151優先順位の実入力操作が未検査。実fillによるc3 priority9、使用13/残3/c4採用、同値再選択維持、Resetを全14条件へ追加。純関数の10100対照をUI配線の代替にしない。旧実ブラウザREDは環境BLOCKEDでNOT_TESTED。
- P3 IR05：153の条件別説明理由の逆転を監査器が見逃す合成反例。表示全文を独立照合する修正対象。正常・同変異の再検査で閉鎖する。

IR05は同じ理由改変で旧ACCEPT→新REJECT、正常両版ACCEPTを確認。153固定資料detailsの実開閉・期待条件と旧新版表示全文も正式試験へ追加。最終操作71段階/条件、意味対照40組（14条件内から抽出）、監査負対照40件。修正後の正式証拠はこれから取得する。
