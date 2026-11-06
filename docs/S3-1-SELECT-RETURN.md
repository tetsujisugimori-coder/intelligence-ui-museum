# S3-1-SELECT-RETURN 局所修正

2026-11-06 JST。Issue #20。v10研究版全体 **FAIL**、限定受入 **NO**、Stage 3 **HOLD** を維持。Draft PRで提示し、マージ・Sites/Pages公開は行わない。

## 対象と旧証拠

base/main `a5766c4dae9bcda791b57bb06c263a5036249343` / tree `e1f1604a8db5d62d5c713407f30511bb8ab5e30f`。PR #19は計画文書1ファイルの限定マージ済みで、本修正差分に再収載しない。旧独立対象 `401c554ae87a6d846b1655bc9af12a92d7002633` とtreeが同じ。

[旧独立レビュー](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/19#issuecomment-6669806106)で重点条件を確定した。A=320px/dark/root200%、B=1280px/light/root100%。fresh page/bringToFront → triggerへfocus → Tab/Shift+Tab → Spaceで開く → mouseのカード選択 / ArrowDown・Enter / Escape。元レビューは6/6がBODY。

旧archiveのBUNDLEは347ファイル、3,570,510 bytes、SHA256 `f2807499f61672b6d2608ad8011a3efac1deb7945f498ae28c6ba996f9a23b96`。今回のconnectorは大容量binary contentsを空で返し、blob取得はUTF8 decode error。**旧archive内部の再読取は未完了**。旧レビュー本文とBUNDLEの照合、新規RED実行を区別する。

## 原因と公開API境界

固定`@openai/apps-sdk-ui@0.2.2`の公開SelectPropsにはstable `TriggerView`はあるが、利用側のopen/close callback・onCloseAutoFocusはない。公開slotで表示ラベルを包み、標準DOM/ARIAを観測する。SDK内部の関数、生成ID規則、class名、contextは利用しない。

SDKを読取確認すると、CustomSelectはtriggerの生成IDを保持し、close時にsetTimeoutでselectContentRef内のactiveElementを確認してtriggerをfocusする。しかし同じrenderのTransitionGroupはdisableAnimations=true、menuは先にunmountする。refがnullならSDKは復帰せずreturnする。RadixのonCloseAutoFocusもSDKがpreventDefaultするため、menu撤去でBODYになったfocusが残る。mouse/Enter/Escapeはいずれもこの閉鎖経路へ入り、旧6件の記録でBODYを再現した。標準openerは削除・再生成されていない。

教材の補助はclose属性変化のMutationObserverでReactのcommit後にだけ判定する。同期keyup/onChangeで先走ってfocusする処理、固定sleep、追加timerはない。SDKがすでにfocusを選んだ場合は触らない。元SDKの遅延callbackも、補助後は元menu内focusでないため二重復帰しない。

## 最小修正

`src/main.tsx`のstable DisplayModeTriggerへref/effectを追加し、`src/select-focus-return.ts`で補助を分離。公式SDK配布物・型・依存package/lock・CSSを変更しない。

- 適用: この教材の公式SelectのTriggerViewだけ。モーダル・Popover等の別展示には適用しない。
- 開始: aria-expandedがtrueになった同じDOM triggerの1セッション。公開aria-controls先のpopup内操作を観測。
- 復帰: popup内Enter/Space/Escape、または内側pointer操作で閉じた後、documentがactive、元triggerがconnected/enabled/focusable/visibleで、focusがBODY/documentElementへ失われた場合のみ。
- 外側pointer/focus、Tab、window blurはそのセッションの復帰を取り消す。他overlayや別controlのfocusを奪わない。
- 終了: closeでtokenを消費。StrictMode再effect/slot unmountではobserverと全listenerをcleanup。
- 削除/再生成: 古いDOM identityへは復帰しない。同じIDの別要素を検索して復帰しない。無効化/inert/hiddenも復帰しない。

## 新規ローカルRED→GREEN

実装担当: Debian13、Node24.22.1、Playwright1.56.1 / Chromium141.0.7390.37。GitHubの必要ファイルをblob SHA照合して部分snapshotへ取得。cloneや完全checkoutとは称しない。

|条件|旧版|修正後|値|
|---|---|---|---|
|A mouse|BODY / FAIL|同じtrigger / PASS|b|
|A keyboard|BODY / FAIL|同じtrigger / PASS|b|
|A Escape|BODY / FAIL|同じtrigger / PASS|a|
|B mouse|BODY / FAIL|同じtrigger / PASS|b|
|B keyboard|BODY / FAIL|同じtrigger / PASS|b|
|B Escape|BODY / FAIL|同じtrigger / PASS|a|

同じ正式harnessを旧新へ実行。6件のbefore/menu/after activeElement、BODY、focus-visible/style/rect、focus call、keydown/pointer/focus/expandedイベント順をJSONへ保存。旧版は最大2秒の状態待ちでもBODY、修正後は1回のfocus・1回のclose。A/B keyboard/Escapeの4件はON/OFF/OFF/ONの画素差と幾何を検証しPASS。

追加: Chromium16条件（4幅×2theme×root100/200）の選択・復帰PASS、A/BでTab/Shift+Tab、Escape後再操作、8連続open/close、値保持、外側dismiss、Button click/Enter/Space/disabled/loading、Select disabled/再有効化の回帰PASS。Tabでpopupから移動するSDK既存動作は閉鎖を保証しない。全117展示/読み上げ成功とはしない。

## 負対照

実ブラウザでfocus関数を試験時だけ観測/注入し、製品の公開hookは追加しない。

|対照|期待|ローカルChromium|
|---|---|---|
|復帰無効|WRONG_FOCUS/BODYで拒否|PASS（故障を検出）|
|誤った復帰先|DOM identity不一致で拒否|PASS（故障を検出）|
|閉鎖前opener削除|focus呼出0、誤復帰なし|PASS（安全動作）|
|復帰直後BODYへ強制|WRONG_FOCUS/BODYで拒否|PASS（故障を検出）|
|復帰を二重実行|RESTORE_COUNTで拒否|PASS（故障を検出）|
|同じIDでopener再生成|新要素を勝手に復帰先にしない|PASS（安全動作）|
|opener無効化|focus呼出0|PASS（安全動作）|

故障プローブ全体のexit0は期待故障がすべて検出された意味であり、故障製品が正常という意味ではない。正常契約はactiveElementの**厳密な同一性**、値、focus回数、open/close回数、文書focus、pageerrorを要求。

## 失敗・環境差も保全

最初の探索probeは `activeElement.contains(input)` という不適切な判定で、BODYもtrueにした。生afterはBODYだったため誤りを発見し、厳密DOM identityへ変更して6件を再実行。誤判定JSONはinvalid-observer-firstとして保存し、正式件数に数えない。正式harnessは負対照でこの故障を拒否する。

offline npm cache不足→通常registry取得成功。部分snapshotの初回静的試験はcwd/歴史証拠ファイル不足で失敗し、Git blob同定した必要入力を補完して再実行。runner25/25、型/build、公式import真正性、v08/v09照合は再実行成功。完全原本保全はGitHub CIで別途確認する。

ローカルWebKit26本体は取得したがOS共有library不足で起動未実施。aptの通常downloadはpackage catalog不足で失敗。環境改変・denial回避は行わず、Ubuntu24.04 CIで両engineを実行する。最終CIとHEAD/treeの結果は後続記録に記載する。未実施をPASSにしない。

## 独立レビューと最終判断

別担当の独自harnessで旧6/6BODY→新6/6同じtrigger、24実ケースpageerror0、合成guard13件、SDK同一性と独立build成功。ローカル指定P2限定PASS。実装者の自己試験は代用にしていない。独立全文はevidence/select-return-20261106/INDEPENDENT-REVIEW.md。

最終HEAD/tree/CI、WebKit、旧archive内部はこの初回記録では未確認。**P2閉鎖 UNKNOWN、マージ推奨 NO**。v10全体FAIL/限定受入NO/Stage3 HOLDを維持する。実Safari/VoiceOver/OS native文字拡大、依存reachability/CSP/ライセンス、既存別Issueの残件は対象外/NOT_TESTED。

## 再現

新しい.workコピーへ固定lockでnpm ci --ignore-scriptsとnpm run build。tools/stage-a-browserへ固定Playwrightを導入し、必要engineをinstallする。

`CODEX_PRIMARY_RUNTIME_NODE_MODULES=/absolute/tools/stage-a-browser/node_modules APP_ROOT=/absolute/.work/v10 EVIDENCE_DIR=/new/output node apps/v10/scripts/select-return-browser.cjs`

旧HEAD fresh buildへ同じコマンドを向けSELECT_EXPECT=redを追加。各outputは未存在を要求。SELECT_ENGINES=chromiumはローカル限定実行用で、両engine成功とは報告しない。CIは両engine・RED/GREEN・独立2build/SDK不変を実行し、全生JSON/PNG/hashをartifactへ保存。

## 追補: CI両engineと旧原票の回収

初回HEAD5601a18の専用CI42135548280と既存CI42135548325は成功。artifactのZIP digestと内部全hash・HEAD/treeをダウンロード後に照合した。Chromium141/WebKit26の重点各6件は旧全BODY→新全同一trigger。追加32件、focus画素8件、負対照14件、回帰4条件も期待一致。詳細はevidence/select-return-20261106/README.md。

旧独立archiveも通常のCI checkoutから既知commit98b4c22のblobを取り出せた。元BUNDLEのSHA256に完全一致。展開したbrowser/front-check/focus-return.json/.cjsを実読し、A/Bとmouse/keyboard/Escapeの6件、BODY、値b/b/a、active document/visibleを照合した。旧archive内部NOT_READの留保はこの追補で解消。元Chromium154と今回141/WebKit26の環境差は明記し、旧資料を新規件数へ加算しない。原票をraw/original-front-check.*へ保全した。

追補HEAD3004ed2のCI42152699198では、WebKitでReact初回mount前に観測器を取り付けてinput nullとなり、RED7件後にFAIL/exit1。GREEN/独立stepはSKIPPED。この失敗原票をraw/ci-3004ed2-red-failure.jsonへ保存した。正式harnessにinput attached/trigger visibleの状態待ちを追加し、製品やSDKを変更せず再試験する。旧件数を成功に読み替えない。

独立担当harnessの150/100ms固定待ちは、closed/option hidden/期待focusの最大2秒状態待ちと2 paint frameへ置き換えた。REDは元レビュー同様に最大2秒の復帰待ちがTimeoutErrorとなることを要求し、別errorを握りつぶさない。独立版をChromium/WebKit CIへ接続。最終の独立判定・CI・HEAD/treeはPR最終追記で照合し、ここに未来の成功は記入しない。

元script再読取でviewport高さ1000を確認。初期ローカル/CIの900とは区別し、最終harnessはA/B幅・theme・rootに加えて高さ1000も揃えた。元Chromium154と今回Chromium141/Playwright WebKit26は同一環境とは称しない。
