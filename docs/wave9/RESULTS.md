# 第9便 結果・経過記録
2026-11-16 JST / tetsujisugimori-coder/intelligence-ui-museum / Issue #64

## 現在の判定
総合PARTIAL・限定マージ推奨NO。正式CI、最終原ZIPの保全・独立実再取得、独立最終レビューはPENDING。Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNを維持する。Draft解除・マージ・公開は行わない。

## 開始と契約
PR #63は2026-11-15T23:15:20Zにマージ済み。基準main HEAD `f5b1aefa3776dc7713a038cb597952a28f7912d6`、tree `f2e22a84c29a7842f20b903e37b67f9d4adeba14`。既存作業領域を変更せず専用cloneとTMPDIRを使用。開始時空き約38GB。
受入契約は実装前にlocal `1ab4fd84602d8110395af9a6ee61b06134f72e9f`／remote `080ce79aa32c71a490a09dfe7ea28f3f28143f61`（同tree `3990f443b05773ef1e91a584269d7cb15f511e42`）として固定。正規GitHub connectorによる親子commit／非force branch作成。独立レビューR1で根拠引用を強化する契約追補をlocal `3450008` に保存し、修正を後続commitに分離した。

## 実装
148 Structured Output Validatorは構文判定と限定schema、path・期待値・実値・理由、安全制限を分離。149 Evidence Coverage Matrixは固定の主張・引用・資料tupleと支持／反証／未判定、選択除外と再計算を扱う。150 Evaluation Rubric Comparatorは固定A/B回答の軸別重み、決定的総点、丸め前順位、欠測／不正／全ゼロを区別。全て架空教材・メモリ内で、実AI/APIや外部通信は行わない。
150展示・11分類、既存147展示の全metadataを基準JSONと比較。既存検査器の展示数と配信資源集合のみ新規JS/CSSへ追随。古いWave8の147展示HTMLを検査する回帰は、同版の固定契約 `787a057` を参照し、現在150展示の契約との混用を避ける。現在版は別の検査で確認する。既存の時間予算・操作期待値を緩めていない。

## 局所検証と失敗履歴
- 製品単体は初版29件、R1修正後32件PASS。既存回帰117件PASS。最初の誤cwd、次のTMPDIR未指定による失敗は記録を保持し、製品障害や意味的負対照検出とは扱わない。
- migration原bundle302件と保護対象検査、150/11登録、既存147全field比較を確認。保護対象366pathの集合・サイズ・SHA照合を最終差分時にも行う。
- local01は初版079f613のChromium4条件×56段階まで完了後、R1判明により中断exit130。残条件は未実施。旧source・原票・中断理由を保持し、後版の成功に置換しない。
- local02は `65e06f89cc0714a1396a879bca8a65e30501170e`／tree `3a6837ce2a9a2d23fbd168fe307a1434b15a18b1` の固定コピーでChromium7条件×56段階と18正常／故障pairがPASS。文字2倍はcomputed styleで確認。これは局所Chromiumのみであり正式14条件／36pairの代用ではない。
- local02ではsnapshot取得を11回の読取りから1回のpage.evaluateへ集約した。全56操作と検査項目を維持するが、観測タイミングが異なるためlocal01とは別試行として記録。
- WebKitの今回局所実行はNOT_TESTED。過去工程の共有library不足を今回実行結果と誤認しない。実機Safari、VoiceOver、物理touch、OS文字拡大はNOT_TESTED。

## 独立レビューと同一反例
R1：149の既知IDを持つrelationの内容改変と、未確認という資料文を反証へ昇格させる誤受理。元入力を固定し、正常は旧新版とも受理、claim改変・type改変・ID改変・根拠のないconflictを新版で拒否。正しい反証を架空資料s3の別行「開館は10時です。」とe5の完全tupleで契約化し、正常CONFLICTを確認。source本文とquoteを同時改変した偽造も拒否。一般の文章意味理解を保証するものではない。
R2：local02原票の149引用表示・資料inspect表示・150未確定時の旧順位表示を改変しても旧監査が受理した。製品障害とは未認定で、表示oracleの不足として修正。独立担当が同じ旧3反例を再実行し、正常受理を維持しながら全て意図した rendered exact text のERR_ASSERTIONで拒否した。旧3反例範囲は閉鎖。新renderSchema=2で引用・inspect・資料本文・総点を構造記録し、未確定時の順位・総点残存を拒否する。新schema実測と正式27監査checkの完走は別途確認する。

## 証拠と未完了
local01/02、原source、R1/R2の原反例を専用領域に保持。Windows保全先のギャラリアは環境一覧でofflineであり、現在容量・保存可否は未確認。接続待機や旧容量の流用は行わない。承認済みLibrary代替の保全と実再取得を予定するが、操作受付だけを保全完了と数えない。ACL・保持期限UNKNOWN。本人限定URL・内部識別子は公開しない。
最終HEADの正式CI、原ZIPの公式digest・CRC・manifest・実行sourceと配信資源結合・代表画像独立確認は別途追補する。局所の結果や旧HEAD成功を転用しない。

## R2修正後の局所03
固定HEAD `050cb77180c5c785790430806d5fc27ac705b3a4`／tree `bb5ab38e59c7998ee647253480954292adbc90fa` の別コピーでChromium7条件×56段階、18正常／故障pairがexit0で完走。renderSchema=2を実測し、固定表示oracleを含め全条件PASS。これは局所7条件であり、正式14条件と監査27checkの完了を意味しない。原票sourceはこの固定HEAD、提出文書追加後のHEADとは区別する。


## P2-IR65-01 修正候補追補（2026-11-16 JST）
旧判定・原票は履歴として保持。開始HEAD d46b2fba66d735a5160802be37029ea78c7025a3、tree e20e1516b9ae23ca0819643847bed05864c3fe99。main/base f5b1aefa3776dc7713a038cb597952a28f7912d6。対象branch feat/v11-wave9-148-150。
長さ4だけの検査とmap/forEachの穴飛ばしが原因。製品はown-propertyを全4位置で検査し、oracleは独立した数値契約の前で各軸のown descriptorを照合する。欠損はINVALID/winner:null/totals:null、補完しない。既存のエラー形を維持しUI/正常算術を変更しない。
baselineの同一24疎配列拒否期待は全RED（正常対照VALID）、修正候補は24全GREEN。新しい単体は既存34＋疎配列24＋Array.prototype経由24＋密配列境界2＝84件PASS。既存独立261対照も同じ入力・期待値でPASS。261対照と単体は入力目的に重複があり独立条件数として加算しない。
既存P3-01/P3-02の試験・私有canonical関係・契約は不変。公開関数の拒否契約を修正するもので、通常UI障害と断定しない。ソース上の初期値・編集・Resetは密配列を保持するが、今回の通常UI疎配列到達性はブラウザ実操作未確認のためUNKNOWN。
verify.pyで147metadata保持確認。既存保護/ワークフロー/依存/timeout/browser/fault/audit/negative条件は変更しない。
提出時は既存pull_request経路13 workflow（一般CI、button、tooltip、select-return、Wave1〜9）が対象。pushはmain限定のためこのbranchのpush単独では起動せずPR同期イベントが起動する。workflow_dispatch/reusable/event経路を追加しない。既存の正式回帰は今回の依頼範囲、別のselect実験等のpathsは不一致。容量は着手時23GB空き、原ZIPは専用領域で無改変保全。正式CI・独立レビュー・新原ZIP保存後独立照合は提出後に別記録し、完了前は総合PARTIAL・マージNO。
Stage 3 HOLD、v10製品受入NO、PR46 SUSPENDED、実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTEDを維持。Draft解除・マージ・公開はしない。
