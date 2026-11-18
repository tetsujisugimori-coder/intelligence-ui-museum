# 第12便 検証記録
2026-11-18 JST / Issue #70。これは初回提出時の進行記録。

開始main `db57a7bb068b5215425b2f845f7253dd1eb2af27` / tree `de72a58fb4a87f5c7ecdf0399917bc75d6f80e3c`、PR69は2026-11-18に正式マージ済み。契約は製品前local `8140fe4f8ecf1cdcdcb022d0462e3a28c1eb34b3`、同treeをGitHub `2bccc7676c4a73b8fa034e6ee293a59fee6b59b1`に提出。API commitのためIDは別、tree `1c361d34c4737fbe950482d68a1938215de5c9a1`一致。

157〜159は固定架空データで実装。実AI/送信なし。159展示11分類、既存156 metadata・2542保護pathは静的照合済み。合成単体104件PASSはローカル自己検査。14条件browser、正式CI、独立レビュー、原ZIP保全は進行中で未成立。最終判定は追補で確定する。

## 初回失敗・補訂履歴
旧回帰の初回広域起動はbrowserスクリプトを単体runnerへ含めてしまい、依存/URL/EVIDENCE_DIR不足で失敗した。未実施browserをPASSにはしない。対象単体728件は初回726 PASS/2 FAIL。未commit sourceのHEAD照合不足と新展示description辞書未登録を記録、後者を補訂。登録数159への旧closure期待変更は今回の許容差分であり旧原票を変更しない。

総合PARTIAL、Stage3 HOLD、v10製品受入NO、PR46 SUSPENDED、旧原因UNKNOWN。初回限定マージNO。実機Safari/VoiceOver/物理touch/OS zoom/実AI NOT_TESTED。
