# Escape focus復帰の静的候補

2026-11-11 JST。基準78e6e99、SDK 0.2.2、変更なし。

- Museum `apps/v10/src/select-focus-return.ts`：capture keydownでEscape close intentを記録。MutationObserverでaria-expanded true→falseを観測し、document.hasFocus、BODY/HTML脱落等の条件を満たすとtrigger.focus({preventScroll:true})。コードの存在は実行証明ではない。
- SDK SelectはRadix Selectを利用。SDK同梱 `@radix-ui/react-select/dist/index.mjs` 499〜501行付近のFocusScope onUnmountAutoFocusはtrigger.focus({preventScroll:true})。focus-scopeのunmount cleanupはsetTimeoutでauto-focus eventをdispatchする。Selectのkeydown EscapeはDismissableLayerからopen=falseへ進む。
- React state更新とcommitはライブラリ内部。今回のMutationObserverはDOM commitの代理観測であり、React commit時刻そのものではない。
- ブラウザ既定のfocus移動、prototype経由でないfocus、非同期処理は候補。JS hookに呼出しがないだけでbrowser原因とは判定しない。

本来のVite buildが出力するJS sourcemapを使い、stackの生成line/columnから元sourceの位置へ対応づける。call直近の有効frameをMUSEUM / SDK_DEPENDENCY / UNKNOWNに分類する。SDK依存にはRadixを含み、OpenAI独自実装との混同を避ける。raw stack、全mapped frames、mapのbuild hashを保持する。browser内部のstackは取得しない。
