# Intelligence UI Museum v10 Stage 2-R
判定：PARTIAL。Stage 3：HOLD推奨。既存Sites／新規公開／Stage3実装／remote GitHub変更は実施していない。

## 対象・再照合
入力ZIP SHA256 `2160095a81c757f9ed01d45bdbe71e4e9fe619d60802570eb15cb59d2d8925dc`、取得ZIP manifest54/54一致。独立レビューZIP SHA256 `0c1e7243ae3dbd06b234bd2aff3f04c6fece5e9beca34786cfe0b6e940107e1a`。原ソース再build dist8/8 byte一致。別取得v09 finalは同梱originalとbyte一致、SHA256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`。過去報告の転記とは別の今回実測。
Git upstream repository/HEADは取得不能。local snapshot-inputは取得ZIPをGit管理にした今回の便宜的な記録であり、先行開発のGit履歴ではない。最終local branch/HEADは同梱FINAL-STATE.json参照。

## 表示P2と変更理由
|項目|修正前|修正後|
|---|---|---|
|Button|320/root200で祖先exhibitに右端クリップ、両engineで再現|狭いpane padding16→8px＋公開gutterSize="xs"。全ラベル・輪郭・操作を確認|
|Select|320/root200で「表示モード：一覧」の一覧がTriggerText内でクリップ、両engineで再現|教材独自TriggerViewの接頭辞を削除し公式標準の選択名へ。外側の表示モードlabelを維持|
公式パッケージ内部CSS/JS・package.json・lockfileは変更していない。Button内部の独自上書きなし。選択値a/bの状態出力は教材側と明記。src/main.css、src/main.tsxが製品表示修正。
index.htmlにv10 shell用meta CSPを追加。scripts/verify-baseline.mjsの保存HTTP応答をliveと呼ぶ誤表記を修正。ライセンス通知と生成器にrelease来歴の例外を明記。ブラウザ回帰runner2本を追加。

## ブラウザ検証
Chromium153.0.8010.0（実際のversionはmatrix.jsonが正）、WebKit26.5、Linux native Playwright。日本語Noto CJKを導入。acceptance/matrix.jsonが正式集計。幅320/375/390/1280×light/dark×root100/200×両engine＝32条件、追加Chromiumブラウザ既定font32の8条件、修正前2条件の計42記録。修正後40条件の記録済みassertに失敗なし。
Button通常/hover/focus/disabled/loading/click/Enter/Space、Select初期/展開/マウス/タッチ相当/キーボード/選択結果/focus/disabledを各修正後条件で検査。ページ幅、祖先クリップ、text Rangeのclip、選択名、JS error、CSP違反、要求/失敗/応答を別記録。Button focus outline7pxの外側余白も検査。代表画像は実際に目視した。hoverは主に到達と可視性検査であり全色コントラスト適合の保証ではない。
**文字200%の限界**：root200は合成拡大。Chromium Page.setFontSizesはブラウザ設定による既定font拡大でroot16→32/Button14→28を実測したが、Selectなど明示pxの全文字を2倍にしない。WebKitのネイティブ文字のみ200%操作は未検証。指定の厳密なブラウザ文字200%受入を全面PASSとはしない。画像の単純拡大での代用はしていない。
初期runner失敗も保存：静的serverのroot判定、隠しinputをSelect triggerとした誤指定、scrollIntoViewによる祖先横スクロールが見切れを隠す問題、ポインター位置が選択肢highlightに影響する問題を修正。正式runnerはwindow縦移動＋祖先scrollLeft初期化、keyboard前にポインター退避し選択肢highlightと閉じる状態を待つ。期待値の緩和で成功にはしていない。正式RED→GREENはacceptance内で同一visibility関数を使用。古いmatrixは失敗履歴で正式集計と区別する。

## 公式6部品
Button/Badge/Select/Switch/Tooltip/Alertの直接importと公開exportを維持。別担当がfresh registry tarball integrityとinstalled2645/2645、公式bundle sourcesContent27/27を照合。package0.2.2、React19.0.0、lock integrityは不変。6部品の状態変更はmain matrix＋smokeで確認。独自ロジックは回数/色/ONOFF/状態出力/比較枠。ChatGPTホスト接続なし、公開React部品の単体実験であり内部非公開UIではない。

## 依存監査
今回npm audit再実行：high1/moderate1/low4、影響パッケージ6件・根本Advisory4件。FIX0、全体承認HOLD6。依存更新・強制fix・監査抑制は実施しない。下表のACCEPTは正式承認でなく静的6部品の範囲に限定する未承認提案。
|影響パッケージ|バージョン/経路|Advisory/修正版|包含・到達・推奨|
|---|---|---|---|
|@openai/apps-sdk-ui|0.2.2 直接/moderate|下記から伝播|6公式部品を配布。脆弱な関数の到達は別判断。source全体HOLD、静的限定ACCEPT提案は未承認|
|lodash|4.17.21 公式直下/high|GHSA-r5fr-rjxr-66jc/CVE-2026-4800、GHSA-f23m-r3pf-42rh/CVE-2026-2950→4.18.0。GHSA-xxjr-mmjv-4gpg/CVE-2025-13465→4.17.23（後続修正が別途必要）|template imports key injection、unset/omit prototype経路。公式はexact pin。現在entryで該当呼出しを特定せず、mapに本体不在。完全到達不能とはしない。HOLD|
|katex|0.16.47 rehype-katex/remark-math経由/low|GHSA-238p-pmpm-9mq7/CVE-2026-103923→0.18.2|汚染prototype/未信頼mathのrender等が前提。JS本体のbundle包含未確認、font CSSあり。math renderer入口なし。HOLD|
|micromark-extension-math|3.1.0 remark-math経由/low|KaTeX由来|独立した追加CVEではない。renderer JS不在のmap確認だけで安全としない。HOLD|
|rehype-katex|7.0.1 公式経由/low|KaTeX由来|同上HOLD|
|remark-math|6.0.0 公式経由/low|KaTeX由来|同上HOLD|
監査JSON、npm ls経路、Advisory API原文、到達条件は独立securityレビューに収録。静的配布の限定riskと開発/将来機能追加riskを分離。リスク承認者未指定、未承認。0.18.2の更新はsemver範囲外のため無検証overrideをしない。

## CSP・外部通信
v10 shellはdist/index.htmlのmeta CSPが実適用される。HTTP CSP headerはテストserverでは無し。default self/script self/style self+unsafe-inline/font self/img self+data/connect none/object none/base none/form none/frame self。ブラウザの実違反からfont-src強制を確認。metaでframe-ancestorsは設定できず本番headerは別審査。
公式CSSはKaTeX用20font URLを宣言。未使用画面でもCSP違反が生じる。Chromiumは20要求イベントとcspによる失敗、外部応答0。WebKitは外部要求イベント0でもfont違反あり（反復あり）。**宣言、読込試行、CSP遮断、応答0を混同しない**。独立GUIと正式matrixにネットワーク記録。ローカル配布はKaTeXのexact font assets＋license＋build時のURL書換を検証する次候補だが、公式CSS内部を無断編集してはいない。未使用CSSの任意削除もしていない。font参照解消はHOLD。
v09 original/viewerは独立iframe文書でshell meta CSPを継承するものとして扱わない。v09は保全のため無改変。全document統一の本番CSPはHOLD。既に読み込んだ状態のoffline Buttonは両engineで操作確認。初回offline配信やreload保証ではない。

## ライセンス
OpenAI MIT/取得tarball・lockバージョンを照合。配布mapの41パッケージすべてに通知見出しあり（今回再計算）。通知には依存名/版と取得本文を同梱。react-remove-scroll-bar2.3.8のMIT宣言と補足master本文のrelease対応が未証明。exact gitHead照会404/422は不存在の証明としない。例外を配布通知/生成器に追記しHOLD。詳細stage2r-license-review.mdおよび独立レビュー。公開許可の判断は未承認。

## v09保全
117連続ID・固有名・11分類、viewer datasetとoriginal同一、v08の105件保持。original HTML変更0。smokeは両engine×4幅の8条件で全117card描画、検索、カテゴリー、theme、Modal open/Escape、PrimaryとSelect操作。実操作対象は主要3展示であり全117件ではない。JS無効でも両engineで117静的cardを確認。保存HTTP応答との比較であり現在公開byte同一とは報告しない。

## Stage 3審査
|条件|今回の判断|
|---|---|
|Button/Select P2|同じroot200再現条件で局所修正・RED/GREEN・画像確認済み|
|Chromium/WebKit|root32条件と基本経路確認。厳密な全テキストnative200は未達|
|公式6部品|真正性保持確認|
|依存脆弱性|個別整理済み、全体リスク承認HOLD|
|CSP/外部通信|shell実適用確認、font遮断試行とlegacy iframe本番方針HOLD|
|license|release通知来歴HOLD|
|v09|構造117、主要3実操作、全117未実施|
|独立レビュー|別担当で実施、最終結論PARTIAL。別紙参照|
|実機Safari/VoiceOver|未検証。今回ローカル改善を否定するものではないが次公開前の対象範囲を決める|
|GitHub|接続repo一覧27件＋検索で管理先特定不能。Issue/push/Draft PR/remoteCIはBLOCKED|
必要阻害条件：厳密なnative text200検証、依存risk承認又は検証付き修正、font/CSP方針、license来歴、GitHub管理先。全117操作やVoiceOverなど全てを無条件阻害とせず、次工程範囲に応じた対象を決める。Stage3実装・承認は行わない。
