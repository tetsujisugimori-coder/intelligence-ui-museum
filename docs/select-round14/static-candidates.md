# Escape focus復帰の静的候補

2026-11-11 JST。基準78e6e99、SDK 0.2.2、製品変更なし。

- Museum `apps/v10/src/select-focus-return.ts`：capture keydownでEscape close intentを記録。MutationObserverでaria-expanded true→falseを観測し、document.hasFocus、BODY/HTML脱落等の条件を満たすと40行trigger.focus({preventScroll:true})。存在だけでは実行証明にしない。
- SDK実経路 `@openai/apps-sdk-ui/dist/es/components/Select/Select.js` 247〜290行はCustomSelect。`useEscCloseStack`からhandleOpenChange(false)→setOpen(false)、258行setTimeoutでfocus復帰を検討する。content refがnull、またはactiveElementがcontent外ならreturn。269行trigger.focus()が候補。
- 同SDKのCustomSelectMenu 454〜479行：useEffectでmenuまたはsearchへfocus({preventScroll:true})。requestAnimationFrame側は選択項目のscrollIntoView。open時のfocusとEscape後復帰を混同しない。
- Radixはこの経路では **Popover**。onOpenAutoFocus、onCloseAutoFocus、onEscapeKeyDownにpreventDefaultHandlerを渡している。単に同梱されるRadix Selectのfocus復帰コードを実経路の証拠にしてはならない。
- React state更新とcommitはライブラリ内部。MutationObserverはDOM commitの代理観測でありReact commit時刻そのものではない。
- ブラウザ既定focus、prototype経由でないfocus、非同期処理は候補。JS hookに呼出しがないだけでbrowser原因とは判定しない。

本来のVite buildが出力するJS sourcemapを使い、stackの生成line/columnから元sourceへ対応づける。call直近の有効frameをMUSEUM / SDK_DEPENDENCY / UNKNOWNに分類する。SDK_DEPENDENCYはSDK本体とその依存を包含し、各frameのsource名で区別する。raw stack、全mapped frames、mapのbuild hashを保持。browser内部stackは取得しない。

初期文書は同梱Radix Selectを実経路候補として記載したが、実際に使用するCustomSelect→Popoverと区別する必要があった。コード/実験操作は変更せず、静的候補の説明を訂正した。
