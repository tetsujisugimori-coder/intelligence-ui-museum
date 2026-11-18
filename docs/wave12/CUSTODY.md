> 最新追加原ZIPの保全結果は[PR #71](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71)最終報告の版別台帳を参照。以下は確認済み原物のみ。

# 第12便 証拠保全台帳
2026-11-18 JST。原証拠と監査補助束を分離。既存のZIP/原票/保護原物を削除・移動・上書きしない。

初回提出時：正式CI原ZIPはまだ未取得、保存/独立再取得はNOT_TESTED。Windows指定先の現在アクセスと同repo承認範囲を確認中。保存先のACL全体・長期保持保証はUNKNOWN。生成し直したZIPを正式原ZIPに代用しない。

## 保存後独立照合済み（2026-11-18 JST）
Windows指定先は今回別担当が存在・列挙を確認したが、現在の実行sandbox read-onlyにより通常書込みBLOCKED。書込みprobe/権限変更/迂回なし。同repo既存受入契約と本依頼の許可範囲で本人限定Libraryへ代替保存した。一般的な全repo承認へ拡張していない。中央規約案や来歴柔軟化承認を理由に、この案件の原物・直接再取得・内容照合を省略していない。

|原物|bytes|SHA-256|CRC entries / manifest files|結果|
|---|---:|---|---|---|
|local診断生成原ZIP（正式CIではない）|78873260|2aed1466c9352faecd95e681e0e9235173ad6de83c302d2aa6f34651dab4fe25|444 / 443|全byte・size・SHA・安全名・CRC・集合/各size/hash一致|
|公式run44305250232原ZIP|131962565|11fa570b183f41fda897187c6909e62fe080ff37ad4844ab2ef5c82c0fa946f9|428 / 427|上記＋source Git一致、13PASS/1FAILを保持|
|公式run44305532511原ZIP|131537208|a97606abb2a9ed623596ea6192fc0cdafcf4deab5278b1989a31e77991fcebb5|428 / 427|上記＋source Git一致、13PASS/1FAILを保持|

公式原ZIPは再生成せず保存。保存とBのLibrary実再取得は別工程。別担当・別取得・別領域、同一基盤/アカウント/filesystemの限界あり。Library全ACL・厳密な長期保持保証はUNKNOWN。失敗原票保全PASSは製品合格を意味しない。正式成功原票が得られた場合は追加保存・再取得し、この失敗束を置換しない。
