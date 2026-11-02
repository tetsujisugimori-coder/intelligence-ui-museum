# 開発LOG

## 2026-11-02 JST — PR #8 / Issue #6 P2

独立レビューB119-STATEを局所修正。残存項目の選択を安定ID・左右別Setで保持。移送先の新項目は未選択、Undoは所属復元＋全選択解除という既存仕様を保護。実キーfocusと最終Undo後focusを確認する新規回帰と、同一試験の旧HEAD負対照をCIへ追加。旧・新Chromium154×3幅でRED exit1→GREEN exit0。初回試験不備も新規証拠へ保全。固定Chromium/WebKit全6条件は最終CIで確認予定。Stage A・過去証拠は変更せず、独立再レビュー前マージ推奨NO、Draft、Stage 3 HOLD。

詳細・生データ：evidence/pr8-transfer-20261102/REPORT.md。

## 2026-11-02 JST — PR #8 / Issue #6 P3

旧root CSS200%条件の本文14→14pxを測定し、そのscopeを明記。別の実文字拡大試験でdescription14→28px・全子要素2倍を設定し、6展示の文字/操作部品clip・横超過・可視focusと移送/Undo操作を検証。ローカルChromium3幅成功（固定2engine全6条件はCIで確認）。セレクタと段落サイズの初回試験誤りを別記録で保存。P2製品修正とは別commit。Stage 3 HOLD・独立再レビュー前マージ推奨NO。
