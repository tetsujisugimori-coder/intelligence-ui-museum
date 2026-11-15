# Intelligence UI Museum

UIを操作して、状態・仕組み・出自を比較する教材。OpenAIの公式製品ではありません。

Private GitHubへの取り込みと[Draft PR #2](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/2)提出まで完了。原本保全・buildの実CIと、隔離ブランチでのCI失敗伝播RED→GREENを確認しました。PRは未マージ。総合 **PARTIAL**、Stage 3の公開・機能拡張は **HOLD** を維持します。

開発管理先：[intelligence-ui-museum](https://github.com/tetsujisugimori-coder/intelligence-ui-museum)。mainは運用入口のみ、移行ソースは上記PRの`chore/github-migration`ブランチです。現在の契約ではPrivateリポジトリのmain保護は強制されないため、PR経由・force push禁止を運用規則として守ります。

## 構成

|場所|用途|
|---|---|
|`legacy/v09/index.html`|117展示・11カテゴリーの既存基準版。原本byte保持|
|`apps/v10/`|Stage 2-R2の公式UI比較実験。依存lockと既存証拠を保持|
|`archive/`|初期版、旧Git bundle、patch、同定記録。配信対象外|
|`reviews/stage2r2-20261030/`|最新の独立レビュー原文と証拠|
|`docs/`|移行記録、開発手順、残件、Issue・PR本文案|

開始は [開発手順](docs/DEVELOPMENT.md)、現在の判定は [GitHub移行報告](docs/MIGRATION-GITHUB.md)、初回準備記録は [移行準備報告](docs/MIGRATION.md)、残件は [BACKLOG](docs/BACKLOG.md) を参照。

```sh
python3 scripts/verify-migration.py
npm run test:runner
python3 scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
```

初回のmainは運用説明のみとし、ソース移行は `chore/github-migration` のDraft PRでレビューします。GitHub正式移行完了後は、Issue→作業ブランチ→検証→Draft PR→独立レビュー→人間のマージ判断を基本とします。

Issues #12 / #13 の文字拡大と Kanban 表示の自己検証は [記録](evidence/zoom-issues-12-13-20261103/README.md) を参照。合成文字拡大は OS 設定の代替ではありません。

Issue #15のKanban画像回帰検査は [設計・再現手順](docs/KANBAN-VISUAL.md) と [新規証拠](evidence/kanban-issue-15-20261104/README.md) を参照。独立レビュー前はDraft、Stage 3 HOLD。

## 2026-11-14 JST：第3便（PR #53マージ済み）

132展示・11カテゴリーの候補。130 Editable Data Grid、131 Schema Form、132 Gantt Editorと127–129説明登録の修正。基準はPR51マージ後main。旧記録は当時の結果として保持。仕様と受入条件は [計画](docs/v11-wave3/PLAN.md) を参照。正式結果は対象HEADの証拠照合後に記録する。Stage3 HOLD、v10受入NO、Draft提出まで。

## 2026-11-14 JST：第4便（PR #55マージ済み）

135展示・11カテゴリー。133 Calendar Scheduler、134 Faceted Search、135 Master–Detail Inspector、124–126説明登録の局所修正。基準main `d196ba9`（PR53統合後）。[固定契約](docs/v11-wave4/acceptance.md)・[試験計画](docs/v11-wave4/browser-plan.md)。旧結果と原本を保持し、今回の技術受入・CI・保全は別判定。Stage3 HOLD、v10受入NO、PR46 SUSPENDED。

## 第5便（PR #57マージ済み）
Issue #56: 136–138。最終HEAD345a44cの技術検証・正式CI・原証拠照合完了後PR57統合。旧記録は当時の判定。Stage 3 HOLDを維持。

## 第6便（PR #59：固定自動化範囲の技術受入PASS、限定マージ審査中）
Issue #58、139–141（Linked Views Explorer／Conflict Resolution Editor／Provenance Explorer）を追加し、全141展示・11カテゴリー。受入条件は事前固定の[契約](docs/wave6/ACCEPTANCE.md)を参照。
検証対象実装HEAD `c9ce4490db96148421f706d243e6a52bba39c50a` で正式10 workflowすべて成功。Chromium／WebKitの固定14条件、故障・正常対照34組、監査器負対照11件、別担当による監査器再実行と代表画像確認を完了。原ZIPはLibrary保存後に実物を再取得し、別担当の全バイト・SHA-256・CRC照合PASSを記録した。旧HEADの`E2BIG`失敗と旧原票の修正後再監査は保持し、新HEADの正式成功とは区別する。
第6便の限定技術受入PASS、限定マージ推奨YES。実機Safari・VoiceOver・物理touch・OS文字拡大はNOT_TESTED、Libraryのアクセス範囲・保持期限は未確認。Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNは維持。製品全体の受入・公開は許可していない。
