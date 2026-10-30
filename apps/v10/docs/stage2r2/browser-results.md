# 今回のブラウザ観測
CUA cloud Chromium / Sites managed preview。保存版のqa.html iframeをUIで320/375/390/1280×light/dark×root100/200へ切替。実clientはclassic scrollbar分10px小さい。最終 `cua-final-matrix.json` は16条件。
一覧AX role/name locator一致1、カードAX一致1、hidden input a/b、可視一覧/カード、Button click/Enter/Space後count3、操作後の他状態保持、ページ横超過0、control矩形clip0、可視文字Rangeと全overflow祖先clip0、祖先scrollLeft0。sr-only「表示モード：」はAX名に含み、可視文字の見切れ測定から除外した。
最終Button focusは14条件でactive/focus-visible、2条件（320/root200/dark、1280/root100/light）では操作後active=false/visible=false。後者をPASSへ補正しない。追加再試験ではruntime timeoutとなり未完了。製品のfocus欠陥か操作経路/環境の問題か未確定。`cua-final-summary.json`に2件を保存。通常の表示・操作16件成功とfocus14件の確認を区別する。
最終Selectキーボード代表1280/dark/root200でSpace展開→nativeUp→Returnによりカードb→一覧a、AX名「表示モード：一覧」、closed、Button count3維持（keyboard.json）。全16条件のkeyboard/focus反復は未完了。初回hidden inputをgetAttributeで取得しようとした際のtimeoutは測定経路の制限で、可視htmlから値をread-only測定して回復。途中の失敗試行も記録する。

## focus疑義
320/light/root200でButtonの3px outline＋4px offsetがclip端を1.546875px超える状態をactive/focus-visibleで再現した。部品本体が完全に隠れることはなく、橙色輪郭を画像で識別できた。狭幅Button paneのみ左右padding8→6pxに局所修正。修正後は外縁とclip端に0.453125pxの余白、輪郭画像も確認。公式内部CSSは変更していない。
当該320light条件の外縁修正は限定PASS。全条件focus保証は上記2未確認によりPARTIAL。WCAG 2.4.11は作者コンテンツでfocus対象が完全に隠れるかを扱い、今回の一部外縁欠けだけを違反と判定しない。2.4.7/1.4.11等の全面適合・コントラスト測定は未検証。
一次資料: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum/

## 公開版
2026-10-27の通常ブラウザ訪問でログイン壁を確認。「ChatGPTで続行」から通常認証経路のアカウント選択画面まで到達。アカウント選択/認証完了は行っていない。Site提供のbypass tokenは使用せず、認証情報は保存していない。本人の選択が未完了のため公開本文/部品操作/asset/CSP/networkはBLOCKED。管理version1/commit daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f は参照情報で配信確認の代替ではない。
公開Siteとその公開commit・アクセス範囲は変更なし。新しい修正版は保存版のみ。バナーはアプリindexに含まれる既存reviewバナー、SitesホストHTMLとは区別する。

## 保証外
WebKit今回再実行なし、native文字200%、実機Safari/VoiceOver、全117展示実操作、最終native runnerの40条件、公開CSP/通信は未検証。合成root200ではButton/Select実font14→28とRange増加を記録したが、全UI文字やiframeまで一律拡大した保証ではない。
