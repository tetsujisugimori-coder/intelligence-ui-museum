# 第1便 独立レビュー（2026-11-13 JST）

対象：Issue #48 / Draft PR #49、v11展示124–126。実装者・検査器作成者と別担当による読取レビュー。製品コード・検査器は編集していない。本書だけを新規追加。

## 判定

**PARTIAL / 限定マージ推奨 NO（受入証拠未完了）**。このレビューは最終CIの独立照合を含まない。Stage 3 HOLDとPR46の独立した保留状態を維持。

- 独自に作成した純粋関数検査21 assertionsを新規実行しPASS。QueryのAND/OR・複数グループ・無効値、権限全8通り、Pivotの軸転置・件数/合計/平均・空/欠損を照合。
- `verify.py`の新規実行PASS。126連番、旧123データcanonical hash、v09 byte、名称/分類を確認。これは旧123全操作のPASSではない。
- 製品ロジックの確定したP1/P2は現時点で見つけていない。実UIの成功を意味しない。
- 独立ブラウザ試行は起動段階でBLOCKED。Chromiumが`socket() failed: Operation not permitted`およびcrashpadエラーでSIGABRT。アプリ操作0。専用TMPDIRを使用し、保護を緩和した再試行はしていない。WebKit、Safari、VoiceOver、物理タッチは本担当未実行。

## 検査器の指摘と対応

1. **P2：PNG構造検査不足**。初版はsignature/長さ/自己申告SHAのみで、壊れた画像の排除が不十分だった。CRC、IHDR寸法/形式、IEND、展開データ長/行filterを検証するよう修正された。中間版のCRC表定義欠落も訂正済み。
2. **P2：文字2倍の条件維持**。初版は初期DOMのinlineサイズだけ変更し、innerHTML再描画後を測らなかった。現在は展示別・タグ別の永続CSSルールで実測初期値の2倍を設定し、各シナリオ後に新DOMを再測定する。非一様な初期値は検査失敗として停止する。コード上の是正を確認したが、独立実ブラウザでのGREENは未実行。
3. HEAD/tree期待値引数の照合、faultの検出をassertion失敗に限定しインフラ例外と区別する修正も読取確認。

修正後の提出単体試験6件を別担当として新規実行：6 PASS / 0 FAIL / 0 SKIP、終了0。正常synthetic PNGのaudit CLI終了0、偽PNGの終了1、正常へ戻した終了0を含む。これはfixture検証であり、実ブラウザ画像や最終CI artifactを独立検証したという意味ではない。

## 残る検証範囲

- 現行browser scenarioの主経路はclick/fill/selectOptionで、一部だけ実Enter/Space・Tab往復。全主要操作のキーボードのみの完走とは呼べない。完全keyboard経路を追加するか、未検証として受入残件に保持する。
- 14条件の実実行、表示・画像の目視、各ブラウザのエラー、原artifactの最終HEAD/hash一致、最終CI結果は本レビューでは未確認。
- 上記P2の実ブラウザGREENと最終証拠を独立照合するまでは、全受入PASSやマージYESへ更新しない。

## レビュー時ファイル固定値（SHA-256）

- wave1.js: `3fdf083bf28c2c1702b3acf891a96fc7d16f0528ce37316fba166b036858cd2c`
- wave1-audit.cjs: `372e4fd5f62dfa4906c01168886bc86cf775d9be8c34975d45721873c1570d42`
- wave1-browser.cjs: `fec32195834e1398f797534e100b2291a386cdbc6c69226c571ff11d4b92adec`
- wave1-test.cjs: `7dcc844b086c8baefb694428f60857dab089eb691c1766cc6d2e04cc75e5883a`

後続変更時は本記録の検証対象と区別し、必要差分を再レビューする。
