# Intelligence UI Museum v10 Stage 2-R2 最終報告
2026-10-27 日本時間。事実の分類は「実測」「資料」「推定」「未検証」を明記する。

1. **総合PARTIAL。A保存版PARTIAL、B公開版BLOCKED、C検証基盤PARTIAL。Stage 3公開・機能実装HOLD。** 設計検討のみ可。今回の成功を全保証へ拡大しない。
2. **Select：局所修正のChromium観測は限定PASS。** stableな公開TriggerViewでsr-only「表示モード：」＋現在option.labelを合成。16条件でAX名一致、一覧a/カードbを区別し確認。代表キーボード変更も成功。全条件キーボード・WebKit・SR読み上げは未検証。公式コード置換なし。
3. **runner：失敗検知の隔離process範囲は限定PASS、実CIはUNVERIFIED。** 実matrix runner入口へengine起動例外を注入し旧exit0→新exit1。同じ修正をsmokeにも適用。17テスト成功、空/欠落/偽GREEN/重複/未完了/想定外REDを拒否。独立レビューのP2偽GREENとP3 count境界/Range祖先を修正。意図的失敗を製品へ残していない。nativeブラウザrunner全経路再実行は未実施。元runnerのCI利用実績も未確認なので元指摘は条件付きP2を保持。
4. **focus：320/light/root200の外縁修正は限定PASS、全条件はPARTIAL。** 実測1.546875px超過→局所余白調整で0.453125px内側余白。active画像で確認。部品本体の完全遮蔽は観測せず、外縁欠けだけをWCAG2.4.11違反とは判定しない。最終focus未確認2条件を保持し追加試験timeoutを記録。
5. **保存版回帰：表示/状態の16条件と静的保全は限定PASS。** 幅320/375/390/1280×2theme×root100/200。AX名/値/count3/横超過/Range/全clip祖先/scrollLeft整合。全117は構造保持であり実操作完了ではない。v09 byte hash、117ID/名称/11分類、v08先頭105/viewer datasetを静的照合。最終distの同一場所での2回buildは8/8 byte一致。fresh公式tgzとinstalled2645/2645、配信map38/38照合。過去ZIPは外239/239・source234/234一致。依存lock不変。build警告はログに保持。
6. **公開版：BLOCKED。** 通常認証経路のアカウント選択まで。認証後部品/操作/JS/CSP/network/配信assetは未観測。公開version1/commitの管理情報は資料確認。認証回避・公開上書き・一般公開拡大なし。
7. **依存・license：HOLD。** 現監査6影響package/4Advisoryを再取得し個別整理。lodash4.17.21/KaTeX0.16.47の条件付き到達性は静的限定評価で、非該当断定なし。react-remove-scroll-bar2.3.8のMIT宣言とrelease本文対応は未解決。更新0、リスク承認なし。詳細security-license.md。
8. **Stage 3：HOLD。** 事前固定acceptance.mdの決定表を適用。残件は保存版focus2条件/全対象keyboard/WebKit、公開認証後asset/CSP/network、GitHub対象確定と実CI RED/GREEN、依存処置・license来歴、人間による公開保証範囲の決定。Safari実機/VoiceOverは今回保証対象外でNOT TESTED。B/C重要未完了のままGOにしない。
9. **GitHub運用：BLOCKED。** 接続アカウントの全28repo一覧、Museum/Intelligence関連repo・PR検索で管理先未特定。Issue/remote branch/push/Draft PR/実CIは作成していない。Sites GitをGitHubと呼ばない。無関係repoを代用せず、新repoを無断作成しない。ローカルbranchはfix/stage2r2-select-runner。commit/treeは同梱FINAL-STATE.jsonを正とする。Issue/PR本文案を作成し、管理先が確定した際に引き継げる状態にした。マージなし。
10. **成果物：本報告、ソース差分、Git履歴bundle、証拠、hash一覧、事前条件表、独立レビューを同梱。** 元証拠は改変せず新規evidence/stage2r2のみ追加。最終HEADとファイルの対応は同梱FINAL-STATE/manifest。実測はCUA・ローカルbuild/静的/process、資料確認は過去報告と公開管理情報、推定は依存到達性、未検証は上記の範囲。未取得過去証拠は取得済みとしない。

独立レビュー担当 /root/stage2r2_independent の報告はindependent-review.md。独立GUI再操作ではなく、ソース/隔離process試験/親の測定記録の算術照合。
