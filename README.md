# Intelligence UI Museum

UIを操作して、状態・仕組み・出自を比較する教材。OpenAIの公式製品ではありません。

移行状態は **PARTIAL**。GitHubの作成・push・Issue・Draft PR・Actions実行は未完了です。Stage 3の公開・機能拡張は **HOLD** を維持します。

## 構成

|場所|用途|
|---|---|
|`legacy/v09/index.html`|117展示・11カテゴリーの既存基準版。原本byte保持|
|`apps/v10/`|Stage 2-R2の公式UI比較実験。依存lockと既存証拠を保持|
|`archive/`|初期版、旧Git bundle、patch、同定記録。配信対象外|
|`reviews/stage2r2-20261030/`|最新の独立レビュー原文と証拠|
|`docs/`|移行記録、開発手順、残件、Issue・PR本文案|

開始は [開発手順](docs/DEVELOPMENT.md)、判定は [移行報告](docs/MIGRATION.md)、残件は [BACKLOG](docs/BACKLOG.md) を参照。

```sh
python3 scripts/verify-migration.py
npm run test:runner
python3 scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
```

初回のmainは運用説明のみとし、ソース移行は `chore/github-migration` のDraft PRでレビューします。GitHub正式移行完了後は、Issue→作業ブランチ→検証→Draft PR→独立レビュー→人間のマージ判断を基本とします。
