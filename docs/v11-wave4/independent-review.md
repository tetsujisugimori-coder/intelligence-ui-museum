# 第4便 独立レビュー（2026-11-14 JST、進行中）
実装・監査器作成と別担当。対象は作業候補、基準main d196ba933a0c5c08aca45e3f9c563998df320d65。最終HEAD/CI/原artifactは未監査。

## 再現した指摘
- R4-P2-01 初期renderにwave4Initがなく、135cards/3sectionsに対し新展示input0。Chromium実ブラウザで確認。展示外側のResetでは初期化される。修正後同操作でinput9。初期化欠落は閉鎖（最終HEAD回帰待ち）。
- R4-P2-02 予約18列に対し背景目盛が14分割。実ブラウザcomputed style周期7.14286%、説明18枠。修正後5.55556%、18列と予約棒寸法維持。閉鎖（最終HEAD回帰待ち）。
- R4-P2-03 134の選択checkboxと選択状態の矛盾をobservationContractが誤受理。正常の選択・keyword・input集合を備える合成原票を受理、checkboxだけ全falseにした同入力を受理した。実製品不具合の主張ではなく監査器の見逃し。v2変異SHA256 `0c4094e0130f216aca1dcce67c61ab787be360b90f0ae855b6330d635b28a515`。修正後拒否と未変異受理の確認待ち。
- 測定範囲：実測2倍selectorが結果li、予約bar、詳細対象ID等を含まなかった。追加と再描画後の実測を要求。製品不具合として未再現、検証範囲不足。
- 小修正：静的fallback 117/132は135への更新漏れ。親へ通知し修正済み、正式no-JS回帰待ち。

## 既存保全と説明
独立実行で13製品単体とverify.py成功。旧132dataset、v09 byteの保全契約を通過。v10/legacy/archiveへの差分なし。124–126の説明は既存固定条件木、依存権限、集計設定に沿う登録追加で、操作コード変更は見当たらない。

## 証拠と限界
`.work/review/evidence/` に初期化/目盛のbefore/after JSON/PNG、合成反例と正常票、単体出力、サイズ/SHA manifestを保存。before側アプリコピーは別保持。合成反例v1（選択データ自体を省略した旧fixture由来）も別名保持しv2と区別。単体や合成反例の成功は実ブラウザ14条件、WebKit、最終CIの代替ではない。最終artifactとLibrary実読戻しは後続。

Stage3 HOLD、v10受入NO、PR46 SUSPENDED、原因UNKNOWN、Draft維持。現時点は独立レビューPARTIAL。

## 修正後の独立再確認（2026-11-14 JST）
R4-P2-03は固定v2ファイルを再取得せず同一バイトで再検査し、`facet checked/state mismatch`で拒否。SHA256 `0c4094e0130f216aca1dcce67c61ab787be360b90f0ae855b6330d635b28a515`不変。正常原票SHA256 `663aebf62550e0ded4979b1007e65edb2bf19ed8a36cca5e60fcfd2b75018971`は受理を維持。局所P2閉鎖。追加の独立候補件数列挙320比較も成功（自己分類除外・他分類AND・keywordを別計算）。2倍計測selectorはli、bar、detailID等へ拡張されたことをコード確認。20段階実ブラウザ結果の最終HEAD照合はCI原物で行う。

以上は実装候補の局所レビュー。未解決の既知P1/P2は現時点でなし。ただし最終HEADの全14条件・故障対照・CI原artifactを未照合のため、最終受入を先取りしない。
