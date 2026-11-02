# 移行時点の残件

|ID|対象|状態・次の確認|
|---|---|---|
|M-01|GitHub正式移行|Issue #1 / Draft PR #2へ提出済み。Private/main/Issues/PR/Actions読戻し済み。未マージ・独立レビュー待ち|
|M-02|実CI|初回41061693189で2ジョブ成功。隔離試験PR #3で失敗41061920865→復元成功41062063257、未マージclose|
|C-01|Alert再表示assert|最新独立レビューの条件付きP2。合成故障でexit0。製品故障の実証とは別|
|C-02|sixComponents pageerror|最新独立レビューの条件付きP2。listener不足。収集と判定の接続が必要|
|R-01|runner移植性|smokeの/tmp/chromium、外部Playwright依存。OS別に確認し汎用化|
|A-01|focus2条件|320 dark root200 / 1280 light root100は未確認。製品不具合とは断定しない|
|A-02|キーボード等|全対象keyboard/WebKit/native文字拡大は保証範囲を決めて追加確認|
|B-01|公開版|認証後assets/CSP/network/実操作はBLOCKED。旧metadataを新版配信証明にしない|
|D-01|依存リスク|過去監査の影響6package/4Advisoryと到達性評価を保持。今回は最新audit未取得|
|D-02|license来歴|react-remove-scroll-bar 2.3.8のrelease対応本文は未確認|
|D-03|外部font/CSP|KaTeX font参照とshell/iframeの配信方針。遮断を参照解消と呼ばない|
|S-03|Stage 3|HOLD。GitHub移行だけで解除しない|
|M-03|main保護|Privateでは契約上強制されないとGitHub画面に表示。運用規則としてPR経由・force push禁止を維持。契約変更は実施しない|
|M-04|CI action runtime|Actions実行時のNode20非推奨警告を記録。ジョブは成功。更新は別の保守変更で検証する|

117展示の全操作、実機iPhone Safari、VoiceOverは未検証範囲として保持し、新たな一律必須ゲートにはしない。最新の判断原文は`reviews/stage2r2-20261030/FINAL-REVIEW.md`。C-01/C-02はIssue #4、Stage 3の残件はIssue #5でも管理する。

2026-10-30 JST

2026-11-01 JST: Issue #11 / PR #7 R-A2-CLIPを局所補強。画素差・正負対照・全matrix負対照を追加。実装者自己検証と独立判定を区別し、独立再レビューまでP2閉鎖保留・マージNO。詳細は `docs/R-A2-CLIP-20261101.md`。Issue #9/#10・旧Linux Modal原因UNKNOWN・Stage 3 HOLDは維持。

2026-11-02 JST: R-A2追加点検で、本体枠が正常でも非描画::afterの寸法解決で誤拒否する経路を発見。両engineで旧6条件4成功/2失敗→6成功、既存28と追加6の34fixture成功。追補は evidence/ra2-followup-20261102/REPORT.md。自己点検であり独立閉鎖ではない。
