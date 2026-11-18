> **現行判定（2026-11-18最終製品版 `c41ea995`）：** 第12便の原ZIP・最終補助束のLibrary保存と別担当による実物再取得／全byte・SHA・CRC・manifest照合は、[PR #71の最終報告・追補](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71#issuecomment-6980944796)にPASSとして記録。歴史的な旧局所原票欠損は[Issue #72](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/72)で**P3 OPEN**。全体のStage 3 HOLDと長期保持・ACL全体UNKNOWNを維持。下記「初回提出時」等は当時の記録であり現行の未保存判定ではない。

# 第12便 証拠保全台帳
2026-11-18 JST。原証拠と監査補助束を分離。既存のZIP/原票/保護原物を削除・移動・上書きしない。

初回提出時：正式CI原ZIPはまだ未取得、保存/独立再取得はNOT_TESTED。Windows指定先の現在アクセスと同repo承認範囲を確認中。保存先のACL全体・長期保持保証はUNKNOWN。生成し直したZIPを正式原ZIPに代用しない。

## 保存後独立照合済み（2026-11-18 JST）
Windows指定先は今回別担当が存在・列挙を確認したが、現在の実行sandbox read-onlyにより通常書込みBLOCKED。書込みprobe/権限変更/迂回なし。同repo既存受入契約と本依頼の許可範囲で本人限定Libraryへ代替保存した。一般的な全repo承認へ拡張していない。中央保全・監査統合規約[v0.2.0（2026-11-18正式採用・発効）](https://github.com/tetsujisugimori-coder/git-preservation-gate/blob/main/docs/v0.2.0/policy.md)の採用と、本案件における分類・保存操作の個別承認・実運用ゲート受入は別判断である。本案件は既存の適用範囲内でLibraryを使用したとの報告に基づき、原物・実保存・直接再取得・内容照合を省略していない。中央Stage 1の合成検証を本件の保存permitと混同しない。

|原物|bytes|SHA-256|CRC entries / manifest files|結果|
|---|---:|---|---|---|
|local診断生成原ZIP（正式CIではない）|78873260|2aed1466c9352faecd95e681e0e9235173ad6de83c302d2aa6f34651dab4fe25|444 / 443|全byte・size・SHA・安全名・CRC・集合/各size/hash一致|
|公式run44305250232原ZIP|131962565|11fa570b183f41fda897187c6909e62fe080ff37ad4844ab2ef5c82c0fa946f9|428 / 427|上記＋source Git一致、13PASS/1FAILを保持|
|公式run44305532511原ZIP|131537208|a97606abb2a9ed623596ea6192fc0cdafcf4deab5278b1989a31e77991fcebb5|428 / 427|上記＋source Git一致、13PASS/1FAILを保持|

公式原ZIPは再生成せず保存。保存とBのLibrary実再取得は別工程。別担当・別取得・別領域、同一基盤/アカウント/filesystemの限界あり。Library全ACL・厳密な長期保持保証はUNKNOWN。失敗原票保全PASSは製品合格を意味しない。正式成功原票が得られた場合は追加保存・再取得し、この失敗束を置換しない。


## 最終成功原ZIP・補助束の追加記録（2026-11-18 23:07 JST時点）
以下の値は[PR #71最終報告](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71#issuecomment-6980876912)および[補助束追補](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71#issuecomment-6980944796)で別担当が保存先実物から直接再取得・照合したと記録したもの。旧失敗ZIP3本の置換ではない。

|原物|bytes|SHA-256|CRC entries / manifest files|保存・検証状況|
|---|---:|---|---|---|
|最終正式run44311507240原ZIP|136294337|`a69e753e2b8455a302a817eeb43f8520ff8bb7f2826e77b0d6b912ff53647720`|436 / 435|Library保存・別担当直接再取得／全byte・size・SHA・CRC・manifest一致（報告上PASS）|
|復旧checkpoint（正式原ZIPの代用品ではない）|367636|`5323a72c85e4912ddaa4d1d65e3caae20ea7d54747fc9a48f9f1ef96a43e3472`|56 / 55|補助原票として直接再取得・検証PASSを別記録|
|最終補助ZIP（正式原ZIPの代用品ではない）|363136|`4304c9f7f772aa17003a867e21ada1f377761859d51350b3e762b1d036bc1fdc`|109 / 108|Library保存・別担当直接再取得／全byte・size・SHA・CRC・manifest一致（報告上PASS）|

中央規約v0.2.0上、通常のGit管理文書と重要な非機密原ZIPは同じ保存要件で一括評価しない。原証拠は重要性・再生成困難性からLevel 2相当として扱うべき対象だが、今回の追補だけで案件の分類票・承認票が新規成立したと主張しない。独立性は別AI枠・取得経路・作業領域を分離した限定的なもの（同基盤・同アカウント・同filesystem）。Library全ACL・長期保持保証はUNKNOWNのまま。

旧B20原入力／局所CSS詳細票／未完local14終端／予備B画像などの欠損は**P3 OPEN**。新しい試験・補助束を旧原物の回収や再生成と扱わず、[Issue #72](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/72)で具体的手掛かりが出た場合だけ限定探索する。ここでの記載は文書追補であって新たな保存・再取得の実行記録ではない。
