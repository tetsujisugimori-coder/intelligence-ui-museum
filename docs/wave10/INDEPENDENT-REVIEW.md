# 第10便 独立レビュー履歴
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
