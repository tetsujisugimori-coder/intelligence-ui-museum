# v11 第2次部品収集・第1便（2026-11-13 JST）

Refs #48, #5, #6, #17. Base `78e6e99fa46274cae9435dae4483c5266ad6b021`.

## Scope frozen before implementation
124 Query Builder（入力）、125 Permission Matrix、126 Pivot Table（データ表示）。固定架空データ、独自HTML/CSS/JS、追加依存なし。旧123データのcanonical JSON SHA-256を基準HEADから固定し、v09 byte、v10全体、過去証拠を保護。PR46へ介入しない。

Queryの最大2階層（root＋子group）、空groupは無効。権限継承なし、read拒否時はwrite/delete設定が許可でも実効拒否。Pivotはレコード件数と数値集計の分母を区別し、平均の総計は元レコードから再計算する。

## Fixed acceptance matrix
Chromium/WebKit × 375/390/1280px × light/dark = 12条件。各engine 375 dark＋reduced motion＋実測文字2倍 = 追加2条件。全14条件で主要操作・keyboard・focus・状態・console/pageerror・横overflowを検証。実機Safari、VoiceOver、物理タッチ、OS文字拡大はNOT_TESTED。未実施を成功扱いしない。

静的保全、旧展示代表回帰、純粋状態関数とUIの一致、Reset/Undo、AND/OR、Pivot totalsを検査。ID/件数/旧データ改変・誤論理・権限不一致・誤集計・reset/undo・証拠欠落/実行失敗の負対照は非ゼロ拒否を確認する。

## Environment / evidence
新規案件領域と`.work/`試験コピーを使いTMPDIR/TMP/TEMPを子プロセス単位で設定。共有/tmpや他案件のcache/evidenceは変更しない。ローカルNode24とCI Node22、ローカルブラウザと固定CIブラウザを区別。原ログ/PNG/JSONは作業領域に非公開保全し、公開文書には集計とハッシュのみ。CI artifactはGitHub repositoryの可視性に従うため個人パスや秘密を収録しない。

Stage3 HOLD維持。Draft PRのみ、独立レビューと人間判断前は限定merge NO。公開・Draft解除・mergeなし。
