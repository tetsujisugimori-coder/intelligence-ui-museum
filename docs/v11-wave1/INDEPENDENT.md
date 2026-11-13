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

## 追記：第2実行の原artifact独立読戻し（2026-11-13 JST）

対象は提出 `5fac6af8ea4117d07a6fd5be25ee36fa9aeeec7f` の実行。後続修正への成功転用はしない。

- 原artifact `13975745040`：1,605,813 bytes、SHA-256 `3b1a3dc47aa8227b63fd6eee6c3e110d0c6d8f47bf190362ea0facafc0d23df2`。独立プロセスで原ZIPを読み、14 entries、ZIP CRC不一致0。
- 内訳は結果JSON1・PNG13。全13 PNGのSHA-256が結果JSONと一致。独自Python解析で各PNG chunk CRC、IHDR寸法、IEND、展開データ長を確認。欠けている14枚目を成功扱いしない。
- 作業用JSONは原ZIP内JSONと構造的に完全一致（整形差があるためbyte一致ではない）。14条件中13 PASS、WebKit 375/dark/文字2倍の1条件FAIL。出口値1を保持。
- 不合格条件はQuery Reset後に期待3件へ戻らず、OR/西の条件と2件のまま。後続Permission/Pivot等はこの条件では未完走。原因UNKNOWN、後続診断待ち。
- 故障注入10件（2 engine × Reset/Undo/権限表示/集計表示/Query表示）はそれぞれ意図したassertionでREDを検出し、clean contextでGREENという原票を確認。これはCI原票の独立照合であり、同担当の新規ブラウザ実行ではない。
- 正式auditを同JSONへ再実行し`execution did not succeed`、終了1。未完了結果をPASSにしないことを確認。
- GitHub Git commit APIで仮merge `04f9391f6a0c47c5c26a1ad06a23c308ddfab75c` のparentsを基準main `78e6e99…` と提出 `5fac6af…` と確認。仮mergeと提出のtreeは共に `f26b613a67dacd25fe254dfd49a6c71a512ba430`、原票treeと一致。mainへの実マージではない。
- 原票source hashのindex.html / wave1.jsは検査時の現作業コピーと一致。wave1.cssは後続修正が進行しており不一致。したがって本結果を後続CSS版の受入証拠にはしない。

現時点も総合PARTIAL、限定マージNO。最終HEAD、後続診断・修正後の14条件、文字拡大で数値が分断される表示の改善、最終原artifactを別途確認する。
