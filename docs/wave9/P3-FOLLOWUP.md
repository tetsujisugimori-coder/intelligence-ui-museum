# 第9便 P3局所追補（2026-11-16 JST）
対象PR #65、Issue #64。事前受入契約・原ZIP・過去の中間失敗資料は変更しない。既存PR枝で最小差分を扱い、正式CIと独立確認前はマージ判断を確定しない。

## W9-P3-01
150の製品実装は空重みをINVALID、空点数を欠測、数字0を有効な点と区別していた。独立oracle側の Number('')===0 による誤解釈を修正。oracleは製品コードをimportせず、入力の型・桁を独自に解釈する。新しい差分対照は空文字、null、空白、boolean、0重み、全0、正重み欠測、重み0の欠測、0点、非法スコア。双方の戻り値の一致とstatusを検査する。

## W9-P3-02
149の固定資料はs1〜s3、固定関係はe1〜e4の**全4件が常に存在**する契約とする。完全性確認は外部から変更できる公開RELATIONS配列ではなく、非公開ALLOWED_RELATIONS正本の最初の4件で照合する。許可されたe5は正常conflict教材用の任意追加である。資料チェックボックスでの「集計からの除外」は固定資料・関係そのものを削除する操作ではない。固定関係が1件でも欠ける入力は選択状態にかかわらずINVALIDとし、部分集計のrowsを返さない。既知のrelation tuple不一致、重複、追加の不正も従来どおり拒否。関係配列の順番は意味に影響しない。空選択、正常conflict、引用inspectは保持する。任意の自然言語の真偽や証拠十分性の自動保証ではない。

## 差分検証と受入ゲート
- wave9-test.cjsにW9-P3-01およびW9-P3-02の境界・正常・故障対照を追加。
- 旧14ブラウザ条件／36故障正常組／27監査負対照／既存回帰・保護対象のチェックを弱化しない。新たなブラウザ条件へのすり替えをしない。
- 旧原ZIP18件は**旧HEADの歴史的原票**としてのみ保持し、新HEADのCIや原証拠と混同しない。
- 新HEADの正式CI完了、実行識別と新原票の利用可能性、差分の独立評価を確認するまで限定マージ判断はHOLD。何らかの失敗・未実施は明記。
- Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWN、実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTEDを継続する。


## P2-IR65-01 修正候補追補（2026-11-16 JST）
旧判定・原票は履歴として保持。開始HEAD d46b2fba66d735a5160802be37029ea78c7025a3、tree e20e1516b9ae23ca0819643847bed05864c3fe99。main/base f5b1aefa3776dc7713a038cb597952a28f7912d6。対象branch feat/v11-wave9-148-150。
長さ4だけの検査とmap/forEachの穴飛ばしが原因。製品はown-propertyを全4位置で検査し、oracleは独立した数値契約の前で各軸のown descriptorを照合する。欠損はINVALID/winner:null/totals:null、補完しない。既存のエラー形を維持しUI/正常算術を変更しない。
baselineの同一24疎配列拒否期待は全RED（正常対照VALID）、修正候補は24全GREEN。新しい単体は既存34＋疎配列24＋Array.prototype経由24＋密配列境界2＝84件PASS。既存独立261対照も同じ入力・期待値でPASS。261対照と単体は入力目的に重複があり独立条件数として加算しない。
既存P3-01/P3-02の試験・私有canonical関係・契約は不変。公開関数の拒否契約を修正するもので、通常UI障害と断定しない。ソース上の初期値・編集・Resetは密配列を保持するが、今回の通常UI疎配列到達性はブラウザ実操作未確認のためUNKNOWN。
verify.pyで147metadata保持確認。既存保護/ワークフロー/依存/timeout/browser/fault/audit/negative条件は変更しない。
提出時は既存pull_request経路13 workflow（一般CI、button、tooltip、select-return、Wave1〜9）が対象。pushはmain限定のためこのbranchのpush単独では起動せずPR同期イベントが起動する。workflow_dispatch/reusable/event経路を追加しない。既存の正式回帰は今回の依頼範囲、別のselect実験等のpathsは不一致。容量は着手時23GB空き、原ZIPは専用領域で無改変保全。正式CI・独立レビュー・新原ZIP保存後独立照合は提出後に別記録し、完了前は総合PARTIAL・マージNO。
Stage 3 HOLD、v10製品受入NO、PR46 SUSPENDED、実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTEDを維持。Draft解除・マージ・公開はしない。
