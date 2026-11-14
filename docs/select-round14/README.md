# 第14回 Select診断

2026-11-11 JST。Issue #45、親 #28、前回 #43 / merged #44。基準main 78e6e99、第13回 e05c91f、同一tree 9dbbb1e905575e2415e3db68a8ce195193e4f5a2。

実験の正本は `tests/select-round14/plan.json`。実行前commitとSHA-256で固定する。4 hosted環境それぞれpilot 8試行→正式72試行（各群3回）、別母数。時間制御W0を含むA0〜A4と、別実験caller OFF/ON。追加介入はEscape後、共通最終read前だけ。A4はtrace全体を介入する。共通最終read/画像も介入であり、A0を無観測とは呼ばない。

200msの残余host待機で時間を揃える。実時間超過・DOM/幾何/scroll不一致は同等性未確認。3反復でゼロ効果を証明しない。最終輪郭の4枚画像は主snapshot後の共通画像測定で、一時的な輪郭CSS抑制を含む。最初の画像と後続測定を区別する。

probe ONだけがJS focus呼出し、stack、keyboard/focus/DOMイベント、Escape後のmicrotask/task/frame標識を採る。React commitはDOM変化からのproxy。SDK/Museum/browserの帰属をstackなしで断定しない。caller無効化、React直接hook、browser内部はNOT_TESTED。

正常時に限りhosted合成原票を公開ゲート後artifact保存。必須工程失敗なら非機密status/終了値のみ。90日保持で無期限ではない。承認済み永続保存先は未確認。製品・SDK・lock・旧証拠は不変。総合PARTIAL、Stage3 HOLD、PR23 NO、根本原因UNKNOWNを維持。Draft解除・マージ・Sites公開は禁止。
