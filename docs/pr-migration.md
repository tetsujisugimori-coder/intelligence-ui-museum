# v09/v10とレビュー証拠を取り込み、GitHub開発基盤を整備

従来のHTML/ZIP中心の開発から、Issue・作業ブランチ・Draft PRで変更を追跡できる構成へ移行する。v09 finalをlegacy/v09へ、v10 Stage 2-R2をapps/v10へ配置し、元Git bundle・同定記録・最新独立レビューを保持した。旧hosting設定はarchiveへ移し、現行Site接続として自動利用しない。

原本302hashと既存証拠を保護する照合、作業コピーでのbuild手順、CI、開発方針、Issue/PRテンプレートを追加。移行後も製品ソースを変更でき、過去証拠を上書きしない。

検証：docs/MIGRATION.md参照。ローカルの保全照合・既存17試験は成功。今回のnpm ciはoffline cache不足で停止し再build未実施。GitHub実CI・ブラウザ・公開版は未検証。独立レビュー原文を移したが、今回の基盤に対する独立レビューは未実施。

Stage 3：HOLD。総合PARTIAL。runner既知課題C-01/C-02の修正は別タスク。本PRはDraft・未マージを維持する。

本ファイルはPR本文案でありPR作成済みではない。
2026-10-30 JST
