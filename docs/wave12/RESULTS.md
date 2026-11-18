> **現行判定（2026-11-18最終検証済み製品版 `c41ea995d36b2dfb6dc5a34e12bea39f210b0d3a`）:** **総合PARTIAL／第12便限定技術受入PASS／独立レビューPASS／限定マージ推奨YES**。正式CI 16 workflow・21最新checks成功、Chromium／WebKit 14条件×119操作・88意味対照・39監査負対照PASS。P1/P2残件なし、歴史原票の欠損P3は[Issue #72](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/72)でOPEN（非blocking）。Stage 3 HOLD・実機未検証などの境界は維持。**この検証結果は上記製品版に帰属し、後続の文書追補HEADのCI成功を先取りしない。** PRの最終判定・マージ状況は[PR #71最終報告](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71#issuecomment-6980876912)と最新PR状態を参照。以下は当時の未到達・失敗を含む版別履歴。

# 第12便 検証記録
2026-11-18 JST / Issue #70。これは初回提出時の進行記録。

開始main `db57a7bb068b5215425b2f845f7253dd1eb2af27` / tree `de72a58fb4a87f5c7ecdf0399917bc75d6f80e3c`、PR69は2026-11-18に正式マージ済み。契約は製品前local `8140fe4f8ecf1cdcdcb022d0462e3a28c1eb34b3`、同treeをGitHub `2bccc7676c4a73b8fa034e6ee293a59fee6b59b1`に提出。API commitのためIDは別、tree `1c361d34c4737fbe950482d68a1938215de5c9a1`一致。

157〜159は固定架空データで実装。実AI/送信なし。159展示11分類、既存156 metadata・2542保護pathは静的照合済み。合成単体104件PASSはローカル自己検査。14条件browser、正式CI、独立レビュー、原ZIP保全は進行中で未成立。最終判定は追補で確定する。

## 初回失敗・補訂履歴
旧回帰の初回広域起動はbrowserスクリプトを単体runnerへ含めてしまい、依存/URL/EVIDENCE_DIR不足で失敗した。未実施browserをPASSにはしない。対象単体728件は初回726 PASS/2 FAIL。未commit sourceのHEAD照合不足と新展示description辞書未登録を記録、後者を補訂。登録数159への旧closure期待変更は今回の許容差分であり旧原票を変更しない。

総合PARTIAL、Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、旧原因UNKNOWN。初回限定マージNO。実機Safari/VoiceOver/物理touch/OS zoom/実AI NOT_TESTED。

## 自己検査追補（2026-11-18 JST）
製品登録補訂後、旧回帰728/728 PASS、保護検査は正常1件受理・故障4件拒否でPASS。新単体104/104 PASS。別担当Bの独立追加20件はworking版20/20 PASS、正式提出版再取得は別途実施中。
ローカル初回browser診断はChromium7条件×119操作PASS、WebKitは起動依存不足でBLOCKED。条件を削除せず14列へ記録し、正式CI ubuntuの依存導入済み実行を別判定する。ローカル診断を正式14条件成功とは扱わない。
初回GitHub HEAD f8414fd146f707b8af1fabecf2621f96d56fa17c、tree9ca18ba583909ec8e28f05bfc09bd6fd7c339c6b、16 workflow進行中。次の監査追補は実themeObserved・開始終了時刻・操作期限を必須化し負対照2件を追加する。初回原票は保持し、最終版の実測とは区別する。

## 正式初回・第2版とWebKit補訂（2026-11-18 22:12 JST）
- 初回 `f8414fd146f707b8af1fabecf2621f96d56fa17c` 専用run44305250232/job134805008415/attempt1。新旧単体368 PASS、browser13条件PASS、WebKit375dark・computed-font2倍だけdocument overflow FAIL。監査はFAIL行を拒否し、監査負対照は未到達NOT_TESTED。全16 workflowは10成功/1失敗/5cancelled（concurrency停止と依存導入/実行期限到達を区別）。
- 第2版 `d1ce8211ee0dd480f2334635eaf104befe057057` 専用run44305532511/job134805985780/attempt1。368単体PASS、同13条件PASS/同1条件FAIL。正式原ZIPを双方保護し、保存後独立照合済み。既存workflowの全体終端状態はPR最終報告に帰属。
- trace上は158のunknown-destination選択直後。local Debianで公式署名検証付きDebian packageを専用領域へ展開し、変更していないPlaywright WPE26.0 binaryを局所launcherで起動（system設定/lock更新なし）。元の環境起動BLOCKED履歴は保持。
- local同条件118操作ではdocument幅超過自体は再現せず、6stepでnative SELECTの親scrollWidth超過を観測。unknown-destinationは323/client301、PRE301/301。text-overflowやoverflow単独では改善せず、select限定appearance:none＋省略表示＋CSS矢印で親301/301となった。全118操作の局所overflow0、ArrowDown/Enter・focus・選択全文current表示維持。正式Ubuntuとlocal Debianの環境差を残す。
- 修正はwave12 select描画のみに限定。document/rootのoverflowを隠さず、入力判定・旧timeout・反例・14条件を緩めない。P2-WEBKITは正式修正版14条件が確認されるまでOPEN。次の固定版の結果はPR #71へ追記する。

## 実原票の区分
158の派生results/stateの入力値と操作入力はredacted、payload/audit/current/historyは秘密原文を含めない。source/trace/HAR/画面は明示入力された固定架空原文を含む原実行証拠であり、開示payloadや匿名化済みexportとは呼ばない。実秘密・個人情報は使用していない。


## 最終検証済み製品版の追補（2026-11-18 23:07 JST時点、変更前後を分離）
- 対象固定HEAD `c41ea995d36b2dfb6dc5a34e12bea39f210b0d3a`、tree `b7ff69155704bb2e69822fb9e7150834b235b0c8`。初回・第2版のWebKit正式FAIL（13PASS/1FAIL）は履歴のまま保持。
- 同じ正式条件の修正版専用run `44311507240`：368単体・Chromium／WebKit各7条件の合計14条件×119操作・88意味対照・39監査負対照PASS。復旧後固定版の広域単体832/832 PASS。TMPDIR未設定だった初回831/832は旧記録として保持。
- 固定HEADのPR関連CIは16 workflow、最新21 checksすべて成功。Select returnとbuttonの初回依存導入cancelledは消さず、それぞれ同HEADのattempt 2で成功。初回の不成功を後からPASSに変更しない。
- 独立担当Bは固定GitHub版41変更pathの全byte・size・SHA・blobを照合。正式原ZIPをLibraryから独立再取得し、136,294,337 bytes・SHA-256・436 ZIP entries CRC・manifest 435件を照合。新独立RECOVERY-B-NEW20は未回収旧B20の再実行ではない。
- P2-SEMANTIC／P2-INPUT／P2-WEBKITは今回固定版の審査範囲でCLOSED。**P3-REVIEW-RECORD OPEN**（未回収旧B20原入力・局所CSS票・local14終端および予備画像置換）。[Issue #72](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/72)で分離追跡。手掛かりがない状態で無制限再探索しない。
- Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、旧原因UNKNOWN。実機Safari・VoiceOver・物理操作・OS文字拡大・実AIはNOT_TESTED。マージや公開はこの追補自体の効力ではなく、PRの別判断による。
- 本追補は旧結果の上書きや新CIの実測ではない。新しい**文書限定commit**が作成された場合、CI状態と対象HEADを改めて確認する。
