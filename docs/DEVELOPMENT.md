# 開発手順

Node 22または24、Python 3、Gitを使用。Linux/macOS/WindowsのPowerShellから以下のコマンドを個別に実行できる。Windowsで`python3`が無い場合は`python`に置き換える。

## 依存不要の確認

```sh
python3 scripts/verify-migration.py
npm run test:runner
```

移行直後の全302ファイル一致を再確認する場合は`python3 scripts/verify-migration.py --check-import`。通常のCIは保存bundleの302ファイルと既存証拠・基準HTMLを保護する。製品ソースの継続的な変更は許可し、初回import-manifestを新しいコードに合わせて書き換えない。

## buildと静的試験

過去の証拠ファイルを上書きする既存試験があるため、必ず新しい作業コピーを作る。

```sh
python3 scripts/prepare-work.py
npm --prefix .work/v10 ci --ignore-scripts
npm --prefix .work/v10 run build
npm --prefix .work/v10 test
```

続いて作業ディレクトリを`.work/v10`へ変更して`node scripts/verify-baseline.mjs`を実行する。`npm run dev`はVite previewでbuild済みdistを配信する。ソース編集後はbuildが必要。`.work/v10`が既にあれば、必要な結果を別途保全してから作業コピーを片付ける。prepareスクリプトは既存作業を削除しない。

v09のみを見る場合はリポジトリルートで`python3 -m http.server 8000 --bind 127.0.0.1`を実行し、`http://127.0.0.1:8000/legacy/v09/`を開く。これはローカル閲覧でありSites更新ではない。

## ブラウザ試験

既存runnerは外部Playwrightと実行可能ブラウザを必要とする。runnerはPlaywrightの標準ブラウザを使い、必要に応じて`CHROMIUM_EXECUTABLE`で指定する。Issue #4のC-01/C-02修正を含むが、これを汎用GUI受入済みとして扱わない。`CODEX_PRIMARY_RUNTIME_NODE_MODULES`、`APP_ROOT`、`EVIDENCE_DIR`、WebKitパス等の実設定はapps/v10の旧手順を参照し、Windowsで無条件に動くとはしない。新しい結果は`.work/`などに出し、既存evidenceへ上書きしない。

## CIと変更の流れ

CIのpreservationジョブは原本・既存証拠・17 runner契約試験、buildジョブは固定lock導入・型検査・build・真正性静的試験・v08/v09照合を行う。ブラウザ全件・公開Site・最新依存auditはこのCIの対象外。定義を作成したこととGitHubで成功したことを区別する。

Issue→mainからブランチ→局所変更→該当試験→Draft PR→独立レビュー→修正→人間のマージ判断。軽微な残件はBACKLOG/Issueへ記録して先へ進む。Stage 3の公開や拡張は明示の解除判断が必要。公開設定、依存更新、ライセンス変更は移行作業に混ぜない。

## ライセンス

取り込みコードと公式パッケージ・第三者依存の権利を一括してMITなどと再宣言しない。既存の`apps/v10/public/THIRD_PARTY_NOTICES.txt`と`apps/v10/docs/stage2r2/security-license.md`を保持する。新規リポジトリ全体の配布ライセンスは未決定。

2026-10-30 JST
