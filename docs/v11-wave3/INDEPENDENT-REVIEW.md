# 第3便 独立レビュー（途中判定）

確認日: 2026-11-14 JST。実装担当とは別の担当による読み取り・独立部分実行。

## 対象と判定の境界

- 基準 main: `260173fd9e07159846c82f73f8fe40a8cedd1243`。
- 第1候補: `69ad5901806f03841d00d2a776c227f021960de4`、tree `bfb6a32ad9d6d89095e9c139c5d07a35d5e04307`。
- 今回の監査補強確認対象: `a0f46f5be4f1b7b0c8c02a44fb220855cc104656`、tree `37ae7398f303242521582928c90a89ea8f9f71b5`。
- 総合 **PARTIAL**。局所的な修正・合成反例の閉鎖は確認したが、最終14条件・正式CI・原artifact独立取得・Library読戻しは本記録時点で未完了。限定マージ推奨 **NO**。
- Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDEDを維持。Draft解除・マージ・公開は行わない。

## 独立して確認したこと

1. 基準mainのJSON datasetと現行先頭129件を直接比較し、全項目一致。132連番・11カテゴリー。v09/v10対象の差分なし。
2. 初期の厳格な説明参照は、旧 `Query Builder` の未登録説明により `説明未登録：Query Builder` を発生させ、Chromium上で117件までで描画が停止した（P2）。厳格参照を今回対象127〜132へ限定した修正後、同じ独立操作probeが完走した。旧124〜126の説明欠落は今回の局所修正で解消したとは扱わない。
3. 独立Chromium部分試験では、0.10×3の整数銭集計、他行draftの確定/Undo後の保持、HTML文字列の非実行、非表示値の保持と出力除外、可視必須項目の拒否、不正schema属性の適用時の入力保持、11月14日・期間1日の確定と期間2日の範囲外拒否を確認した。
4. 旧ヘッダの129 EXHIBITS残存（P3）は132へ訂正済み。

これらは全14条件の受入や実機Safariの確認ではない。部分試験・初期失敗は `.work/independent-review/` として別管理し、最終成功へ混ぜない。

## 監査器のP2: 同じ流用反例によるRED→GREEN

合成正常fixtureを構築し、旧候補69ad590の監査器と現行監査器へ**同じ変異済みreportとtrace実物**を渡した。旧監査コードはGitから読み出し、製品・履歴を変更していない。

| 固定変異 | 旧監査69ad590 | 現行監査 | 意味的な拒否理由 |
|---|---|---|---|
| Chromium 375 lightのtraceをWebKit 390 darkのtraceへ置換し、hashも置換 | PASS（誤受理） | 拒否 | `AssertionError: trace engine mismatch` |
| 故障対照のfault traceを同対照のnormal traceへ置換し、hashも置換 | PASS（誤受理） | 拒否 | `AssertionError: trace condition identity mismatch` |

未改変fixtureの受理も確認した。拒否は起動失敗・timeoutではなく、監査対象の意味的な不一致である。この2反例に対する局所的P2は閉鎖。ただし合成監査fixtureの結果を実ブラウザ14条件成功とは呼ばない。

現行監査はraw traceのengine・viewport・touch・motion、条件query、故障URL prefix、network収録9資源の実バイトSHA-256を照合する。配信hashの自己申告のみには依存しない。PNG構造・CRC、故障変異の実バイトと元/結合hash、操作stage、フォーカス、Ganttの14分割pixel位置/長さも検査対象になった。

確認時のSHA-256:

- wave3-audit.cjs: `a1989b475c5300cc3c63aa1210c94de34c73df1fe70d8efe0a7be14472a62d6c`
- wave3-audit-test.cjs: `ab383c83dd672000baf728b9cc78406181c16da7ddc2b9ac788c96ccb177a5b5`
- wave3-contract.cjs: `4cad09f0195c7864b12795845bdd20fad585f31af9da53c1a31fd228c379d29c`
- wave3-browser.cjs: `b9bf10266f831232ebbf09db9d55198a1de84e30205b8427747d5953a5cb0d0d`

## 未完了・限界

- 文字2倍条件での横溢れは第1候補で発見され、製品担当が修正。最終候補の両engine実測再確認を完了するまで**未閉鎖**。
- Schema Formの拒否検査は以前「状態文が非空」だけで不十分だった。現行は出力statusを直接検査するが、最終CI原票で確認が必要。
- 全操作の意味をraw traceから独立再構築する万能監査ではない。traceとJSON/PNGの整合、故障対照、提出ソースとの一致を最終原artifactで追加確認する。
- 正式CI、原ZIPの公式digest/全byte SHA/CRC/内部証拠、Library保存後の実再取得は後続追記対象。保存応答だけで保全PASSとしない。アクセス範囲の確認結果は完全性と分ける。
- 実機Safari、VoiceOver、物理タッチ、OS文字拡大はNOT_TESTED。
