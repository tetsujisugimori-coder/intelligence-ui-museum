# Chromium実ブラウザ検証ログ

対象：Vite previewが配信するdist、http://terminal.local:4173/。cua_replによる実ブラウザ操作。WebKit実行機能は提供されず未実施、実機Safari/VoiceOver未実施。

## 成功した操作

- Button クリック→Enter→Spaceで回数0→3。disabled trueでisEnabled=false。loading trueの表示状態を確認し解除。
- Badge 色success→warning、output=選択色：warning、3バリエーション表示。
- Switch Spaceで通知OFF→ON。disabled時isEnabled=false。
- Select マウスで展開しカードを選択、選択値a→b。Spaceで展開、フォーカスされたmenu divにArrowDown→Enterでa→b、Escapeでaria-expanded=false。disabled時isEnabled=false。
- Select Enter単独はaria-expanded=false。公式コードが意図してEnterを除外していることを照合し教材説明を修正。
- Tooltip トリガーへキーボードフォーカス、role=tooltipを1件確認。Escape後0件。focus観察表示更新。aria-describedbyの安定確認・hover単独・タッチは未検証。
- Alert success→dangerを選択、Enterで閉じる、output=非表示。
- 比較側iframe Button主操作、Select詳細、Switch Space、Alert通知表示を操作。比較側操作後の公式Switch ONを保持。
- Tab/Shift+Tab移動を一部確認。全Tab順序・全コントラスト・スクリーンリーダー読み上げは未検証。

## 表示

qa.htmlでiframe viewport 320/375/390/1280 × light/dark × root font 16/32px=16条件。viewport・theme・fontをDOM計測し条件一致。6 section保持、scrollWidth<=clientWidth、モバイル1列/デスクトップ2列を確認。browser-layout-matrix.jsonに実測。スクロールバーでclientWidthはviewportより10px狭い。200%はroot fontであり、OS/Safari文字拡大や比較側v09の200%試験ではない。

画像：desktop-comparison.jpg、mobile-dark-text200.jpg。200%画像は最初のキャプチャが前の画面だったため、条件を別途照合して同ファイルを正しい表示で置き換えた。

## 検出・修正と未達

教材の素のcheckboxは公式resetにより見えずクリックtimeout。独自CSSにappearance:autoと寸法を指定して修正。修正後disabled/loading操作成功。

getByLabelによるnative selectの完全一致探索や、非focusable optionへのpressは自動操作が失敗した。表示済みDOMに基づくselect locator、実際にフォーカスされるmenu divへの操作で再検証。公式APIへキー処理を追加していない。

コンソール取得ではchrome-extension起点のmetadata送信errorがあった。アプリ起点のJavaScript errorは取得範囲で確認なし。ただしログ件数上限やブラウザ拡張由来ノイズがあり、完全なエラーゼロ保証ではない。

## 再現

READMEの手順でdistを配信しqa.htmlを開く。幅/テーマ/文字欄を切替、フレーム内htmlのviewport、data-theme、computed font-size、scroll/client幅、section件数、.compareの列数を計測する。機能操作は上記入力順序と期待値で繰り返す。自動静的検証はnpm test、buildはnpm run build。ブラウザ操作ログを単体テストの成功件数として加算しない。
