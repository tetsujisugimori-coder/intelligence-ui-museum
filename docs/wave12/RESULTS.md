> 現行判定: [PR #71](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/71) の最新HEADに対応する本文・最終報告を参照。以下は各版の実測履歴であり、未到達・失敗を保持する。後続CIの結果を先取りしない。

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
