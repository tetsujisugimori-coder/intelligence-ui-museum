# PR #8 P2 Transfer List 局所修正・自己検証

2026-11-02 JST。実装担当の自己検証。独立再レビュー未実施、マージ推奨NO、Draft、Stage 3 HOLD。

## 原因と仕様
119のdraw()は両一覧のcheckboxをinnerHTMLで再生成し、選択状態を保持しなかった。項目の安定IDと左右別Setへ選択を保持し、残存項目をcheckedへ復元。移送した項目は従来通り未選択。所属履歴だけを保存するUndoも従来通り全選択解除。最終Undoでボタンがdisabledになる場合は移送ボタンへfocusしBODY退避を防ぐ。通常移送も操作ボタンにfocusを維持する。native checkboxのcheckedがアクセシビリティ状態であり、冗長aria-checked属性は追加しない。

## 同じ試験によるRED→GREEN
旧HEAD b9d3b840162c8d03fa5d2f62c89793ea55ce7d03の隔離worktreeをGit履歴から取得。元のWindows原環境の再利用ではなく、同一ソースをLinuxで再実行した対照。
`transfer-test.cjs` / `transfer-scenarios.cjs` を旧・新のURLだけ替えて実行。375/390/1280px、reduced motion、390 light・他dark。ローカルはChromium154で3条件（18検査群）。旧A/B/C/E失敗・D/F成功、exit1。新18/18成功、exit0。設計before checked=true、移送後は旧false→新true。実装の移送後checked=false。console error/pageerrorは正規比較の全条件0。

`red-corrected/`と`green-corrected/`が正規比較。JSONに選択、checked属性、ARIA属性、activeElement、outline・focus-visibleを保存。before/after/keyboard-focus画像を保存。oldには既存設計選択が消えるためkeyboard-focus画像はなくfailure画像となる。

初回試行も保全：`red-local/`はP2の失敗に加え最初のfavicon404が1件。`green-local/`はシナリオBで既存の設計も移送対象へ含めてしまう試験不備があり3件失敗。Bの逆移送前に設計をuncheckし、再移送前に再選択する対照へ訂正。faviconを専用serverで204応答。製品assertを緩和せず、同じ訂正版を旧・新両方へ適用し正規比較を保存した。

## CIゲート
従来28条件・pageerror2・契約8は変更しない。6条件のTransfer検査を追加。旧HEADの全served fileをgit blobから新規tempへ展開し、同じ試験が全6条件で正しくexit1となる負対照を追加。負対照harnessは無関係な失敗、pageerror、console error、欠落check、誤PASSを拒否。新契約5件は欠落・SKIP・選択の偽PASS・focus欠落等を拒否。browser-v11のみ履歴取得をfull checkoutへ変更。Stage Aの実装と検証器は無変更。

## 未検証
ローカル固定Playwrightブラウザのdownloadは通信ポリシー403で不可。固定Chromium141/WebKit26と全6条件の最終判定はCIと後続報告で確認する。物理Safari/Mac、VoiceOver、実タッチ、OS文字拡大はNOT_TESTED。旧Linux Modal原因UNKNOWN、Issue #9/#10は未解消。全123展示の全操作を保証しない。
