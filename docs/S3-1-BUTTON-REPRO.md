# S3-1 button 最小再現（製品修正待ち）

2026-11-06 JST。Refs #25, #22, #18, Draft #23。

製品対象main 77d30ac54e35b8a6408fb5f56db4697adff8a452 / tree bae0835e1832cf569b71fd33816bb77acabf52c3。製品・SDK・依存・lockは変更なし。このDraftは再現プログラムと独立RED原票を別課題へ分離する提出であり、製品修正や解消済みの宣言ではない。修正範囲は原因調査後に別commitで明示し、独立再レビューを要する。

独立実測原JSONは evidence/s3-reaccept-20261106/independent/button-ring/results.json 。全原画像・イベントは[固定済み再受入archive](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/blob/68743f6ff857e55f107ec6c1dc7b8e94b8d71511/evidence/s3-reaccept-20261106/raw/independent-local.tar.gz) の同名内部フォルダに保全。JSON内の全画像をこのDraftの単独ディレクトリへ再複製したとは主張しない。

隔離 .work/v10 のfresh buildと tools/stage-a-browser のPlaywright1.56.1を準備し、REVIEW_OUT=<new directory> node tests/s3-reaccept-independent/button-ring.cjs を実行する。現製品ではexit1が再現結果であり、CIの成功を狙った検査緩和は行わない。

Stage3 HOLD維持。Draft解除・merge・auto-merge・公開なし。限定マージ推奨NO（修正未実装）。実Safari/VoiceOver/native拡大はNOT_TESTED。
