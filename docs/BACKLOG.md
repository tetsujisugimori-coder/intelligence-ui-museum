# 移行時点の残件

|ID|対象|状態・次の確認|
|---|---|---|
|M-01|GitHub正式移行|未完了。private repo作成・同名調査・main初期化・branch push・Issue/Draft PR・設定読戻し|
|M-02|実CI|未実行。preservation/buildの実行と失敗伝播を確認。YAMLの存在を成功証拠にしない|
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

117展示の全操作、実機iPhone Safari、VoiceOverは未検証範囲として保持し、新たな一律必須ゲートにはしない。最新の判断原文は`reviews/stage2r2-20261030/FINAL-REVIEW.md`。

2026-10-30 JST
