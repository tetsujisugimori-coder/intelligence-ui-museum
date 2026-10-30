# GitHub操作の残手順

2026-10-30 JST時点、GitHub連携の認証ユーザーはtetsujisugimori-coderと確認。同名repoへの直接照会は404、同名検索は0件。非存在の確証や作成権限の実証ではない。連携にrepository作成・設定変更の機能はなく、ローカルghも無い。ブラウザへの切替は連携不足時の利用者承認が必要なため未実施。

## 作成と読戻し

指定アカウントのRepositoriesから同名を確認。存在すれば内容と権限を調査し、上書き・初期化・強制pushを行わない。無ければprivate、名前intelligence-ui-museumで空のrepoを作成する。空repoにはREADME/ライセンス/.gitignoreをGitHub側で自動生成せず、準備済みmainを初回pushする。

private、default main、Issues有効、Actions利用可を読戻す。PRはGitHub標準の機能。可能ならmainにPR経由・force push禁止・削除禁止の保護を設定し、契約/権限制限で使えなければ未適用と報告する。1名運用で独立レビュー不能な必須人数や、未実行の必須checkを不用意に設定しない。実CIが成功してからcheck名を設定する。

## push・Issue・Draft PR

同名repoが存在しないと確認して新規作成した場合に限り、準備済みローカルmainを初回pushし、chore/github-migrationをpushする。forceは使わない。docs/issue-migration.mdを本文にIssueを作成し、その番号をPR本文へ反映。docs/pr-migration.mdを本文にmain向けDraft PRを作成する。main/branchのremote SHAとlocal SHA、PR head SHA、privateとDraft状態を読戻す。

CIを確認し、失敗は記録して修正する。通信/権限エラーをテスト失敗や製品不具合と混同しない。実CIの失敗伝播は、専用の一時PRブランチで既存の保全対象を意図的に改変して失敗を観測し、通常commitで復元して成功を観測するなど、成果物本体の履歴改変を伴わない方法で別途確認する。意図的な故障をmainや移行PRに残さない。

本手順は未実行。作成済みURLやIssue/PR番号、適用済み保護設定を推測で埋めない。マージ、既存Sites更新、新規公開、visibility変更は行わない。
