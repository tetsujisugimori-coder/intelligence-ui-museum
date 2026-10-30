# GitHub移行の準備結果

これは2026-10-30 21:55 JST時点の初回準備記録です。その後のGitHub作成・取込み・実CIの結果は[MIGRATION-GITHUB.md](MIGRATION-GITHUB.md)を参照してください。以下の未作成・未実行という記載は当時の状態を保持しています。

**総合PARTIAL。ローカル移行準備は完了、GitHub正式移行は未完了。Stage 3 HOLD。** 2026-10-30 JST。

## GitHub確認と操作の境界

認証ユーザーは指定のtetsujisugimori-coder。同名リポジトリへの照会は404、同名検索は0件。未作成とアクセス不可はこの結果だけでは確定できない。連携にリポジトリ作成・設定変更機能がなく、ローカルghも無い。権限不足を実証したのではなく、現在の操作経路が不足している。ブラウザ切替の承認は未取得で、操作していない。repo作成、private設定、push、Issue、Draft PR、Actions実行、main保護は未完了。具体的な次操作はGITHUB-SETUP.md。

受信した依頼文は「ファイル名だけで正本と」で終了している。続きの要件は未受信。今回の作業は提示済みの目的・初期設定・取得可能なv09/v10資産に基づく。

## 正本候補の照合

|資産|SHA-256|判断|
|---|---|---|
|v09初期HTML|17a02c1f914d98150910616e6b29c72a49bc2531a54a44e09ca2377e60e06dee|単体2件と初期ZIP内が一致。初期検証記録の値とも一致|
|v09 final HTML|327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97|v10 public/dist/保存HTTP応答とbyte一致。最新独立レビューの値と一致。既存基準版へ採用|
|v10 Stage 2-R2 ZIP|392da9aff33a05bc71a0bb4a823a199bb43fc3a9229308fe045aee72486f382a|最新レビューが対象とした18,720,777bytesのZIPと一致。CRC異常なし|

v10のFINAL-STATE.jsonに記載された302ファイルは全hash一致、source追加/欠落なし。HEAD 66032de7efa08eec999da14b1c62f3dec2f4adc0、tree f5f7d93899f2bc725620c3aba0fbdd9b9b786a54を保存Git bundleと照合する。これは過去のローカル履歴であり、GitHub push済みの証拠ではない。

v09 finalの117連続ID、117固有名、11カテゴリー、viewer dataset一致、v08先頭105件のID/名称/カテゴリー保持を静的確認。117件の全操作成功とは報告しない。ファイル名や更新日時だけで採用を決めていない。

Library由来のファイルを取得し、過去会話の添付を別途直接取得したとはしない。最新レビューはversion 1を取得。入力ファイルのサイズ・SHAはsource-assets.json、Library識別子と採用理由はsource-identities.jsonに記録。

## 配置と保全

v10の302ファイルはapps/v10へ移し、唯一、旧.openai/hosting.jsonをarchive/stage2r2/original-hosting.jsonへ退避した。内容は無改変。自動で旧Siteを接続・更新しないための配置変更。全302の新旧対応をimport-manifest.jsonに保持する。初期v09、旧Git bundle/patch/状態、独立レビュー58ファイルをarchive-manifestで保護する。

既存evidenceを上書きしないため、再build/真正性試験は.work/v10コピーで行う。履歴の全302hashと現在の保護対象を通常CIで照合し、初回ソース完全一致は--check-importで追加確認する。以後srcやscriptsの意図的変更で初回manifestを再生成しない。.gitattributesで改行の自動変換を止め、Windowsでも保全HTMLのbyteを維持する。

## 今回実行した確認

- 取得ZIPのCRC、FINAL-STATE 302/302hash、追加/欠落0。
- bundle verify成功、完全履歴を保持。保存bundleのGit treeから原302byteを再照合。
- v09原本一致・117ID/11分類・v08の105件保持・viewer dataset照合。
- 既存runner契約17/17成功、失敗0。これはsmokeのC-01/C-02を解決した証拠ではない。
- テキストのprivate-key/GitHub-token/OpenAI-key/AWS-key/JWTパターン点検で検出0。後述の限界あり。
- 全取り込み差分のgit diff --checkは既存HTML/CSV/patchの末尾空白等で警告。原本保持を優先し未修正。今回新規作成した基盤ファイルは別範囲で確認する。
- npm ci --offline --ignore-scripts --no-audit --no-fund --fetch-retries=0はENOTCACHEDで停止。zwitch-2.0.4.tgzのキャッシュ不足。許可範囲にnpm registryがないためオンライン取得せず、今回の型検査・build・新規auditは未実施。

最新独立レビューにある2build/8成果物一致とfresh SDK真正性は過去の独立検証結果として保持した。今回の再実行成功には数えない。移行基盤の独立レビュー、実GUI、公開Site、実CIは未実施。

秘密情報のパターン点検は完全な不存在証明ではない。画像は個人情報の自動検査対象外。既存資料に含まれる著者名・Gitメタデータ・ローカルパス等は来歴に関わる歴史資料として保持し、不要なアカウントprofile/emailの新規記録や認証情報の取得は行っていない。移行準備物はprivate運用向けで、一般公開許可は含まない。

## 引き継ぐ判断

最新独立レビュー総合PARTIAL。runnerのC-01 Alert再表示assert、C-02 sixComponents pageerror収集は条件付きP2として残る。製品故障の実証と区別する。focus2条件、公開版認証後、依存到達性、license来歴、外部font/CSPの残件をBACKLOGへ登録予定として整理した。

今回、製品コードの修正・依存更新・Stage 3実装・Sites更新・公開・マージは行っていない。main初回bootstrapと作業ブランチのローカル履歴を用意し、リモート作成後にIssueとDraft PRへ提出できる状態にする。
