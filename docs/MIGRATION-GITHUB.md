# GitHub移行・開発基盤の提出結果

2026-10-30 JST。**Private GitHubへの取り込み・Issue・Draft PR提出まで完了。総合PARTIAL、未マージ・独立レビュー待ち。Stage 3 HOLD。** 初回準備記録MIGRATION.mdのGitHub未作成・実CI未検証状態を、この結果で更新する。

## GitHubと設定

- リポジトリ：https://github.com/tetsujisugimori-coder/intelligence-ui-museum
- 親Issue：https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/1
- 移行Draft PR：https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/2
- 作業ブランチ：chore/github-migration。mainは運用入口のみ。マージ・auto-mergeは行っていない。
- 所有者・認証アカウントはtetsujisugimori-coder。作成フォームで同名availableを確認して新規作成。API読戻しでvisibility private、default main、admin/push権限を確認。
- Settings画面でIssuesとPull requestsのチェック有効、Actions利用可、既定workflow権限はread、他repoへのActions公開はNot accessibleを確認。アクセス範囲の拡大なし。
- main保護の作成画面に「このPrivate repositoryではGitHub Team/Enterprise organizationへ移行するまで強制されない」と表示。強制できない設定を適用済みとせず、契約変更・公開化・課金操作は行っていない。PR経由・force push/履歴書換禁止はAGENTS.mdの運用規則として維持。

## 取り込みと来歴

381ファイル、重複を除いた313blobをAPIへ登録し、返却された全blob SHAがローカルと一致。初回取り込みtreeは9d4594166f59509ea0f264797abdf7c5c985c10bで、準備ローカルtreeと完全一致した。

初回remote HEAD：8bb1965b884ed340e94bc0c37ac61fd49155dedc。remote main bootstrap：632853445785ae949eb3dd08aa51a654397859d4。準備ZIPのlocal HEAD 74923bcd03ecf224837f33ffde875b135e62599fとは別のAPI作成履歴であり、commit SHA一致は主張しない。照合単位は全blobとtree。今回追加する報告ファイルは通常の追補commitとし、最終remote HEADはPRのhead_shaで確認する。

v09 finalの採用根拠、初期版との区別、v10原本302hash、旧bundle、独立レビューの原本は保持。src・公式依存lock・過去evidence・配布distは変更していない。旧hosting設定も退避内容のまま。

今後の継続開発ではGitHubからcloneして作業を始める。準備ZIPのローカル履歴をそのままGitHubへpush・force pushしない。準備ZIPは取込み前の固定記録であり、現在のGitHubブランチの代用品ではない。

## 実CI：GREEN

[初回CI run 41061693189](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/41061693189)、PR head 8bb1965、PR検証用merge ref 0a52e55bfe33de27d6f4fcb7e6b56d1c24b6478f。merge refはActions用の仮結合であり、PRをマージした証拠ではない。

- preservation：保存bundle302hash・既存証拠・v09 117ID/11分類・v08 105件保持、runner契約17/17成功。
- build：npm ci --ignore-scripts（251packages）、TypeScript型検査、Vite build、6公式import等の静的照合、v08/v09照合、成果物uploadが成功。
- npm ciの監査サマリーは6 vulnerabilities（high1/moderate1/low4）。個別の最新audit JSONと完全な到達性再評価は未実施。build成功をリスク承認としない。
- 既存use client等のbuild警告とActions側Node20非推奨警告を保持。未解決の保守事項として記録。

ローカルのoffline npm ciはキャッシュ不足で停止した一方、GitHub runnerでは通常の固定lock導入とbuildが成功した。環境と結果を区別する。ブラウザ実操作・公開Site・新しい独立レビューは今回実施していない。

## 実CI：隔離RED→GREEN

試験専用ブランチtest/ci-failure-propagation、[試験PR #3](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/3)。移行PRとmainから分離して実行した。

|状態|commit|run|観測|
|---|---|---|---|
|RED|5ab6165ffba9ac8308719f0ca1c74f12b78b71cc|41061920865|legacy/v09/index.htmlだけを故障モデルに置換。原本SHA検査でAssertionError・exit1。preservation FAIL、build PASS、CI全体failure|
|GREEN|7a31217af0bafef19dfd40abaede41e5a098de92|41062063257|通常の追加commitで元treeへ復元。CI全体success|

試験PRは未マージでclose済み。復元後treeは初回移行treeと一致し、移行PRやmainに故障モデルを残していない。これは新CIの検査失敗伝播の証拠であり、既存smoke runnerのC-01/C-02を解決した証拠ではない。

## 継続する残件

[Issue #4](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/4)：Alert再表示assert・sixComponents pageerror収集とrunner移植性。
[Issue #5](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/5)：重点focus2条件、公開認証後、依存/ライセンス/font/CSPとStage 3 HOLD。

取り込んだ最新独立レビューは過去成果のレビュー。今回の移行・CI追加に対する独立レビューは未実施であり、作成者による自己確認と区別する。次は移行PRの独立レビューへ渡す。
