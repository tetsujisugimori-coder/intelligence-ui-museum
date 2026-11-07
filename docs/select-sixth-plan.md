# 第6回 Escape 単一要因比較

開始HEAD: 64853bd8ebd8b1ad441c982eae2c7da2848e9f93。Issue #28 / Draft PR #29。

## 識別対象

SDK 0.2.2 の useEscCloseStack.js の Escape handler 内 `evt.preventDefault()` の1行だけをBでコメントへ置換する。Aは元モジュールのまま。Viteの実験専用transformは隔離したbuildにだけ適用し、SDKインストール内容・製品src・依存・lockは変更しない。両buildのmodule本文とhashを保存し、1置換のみで一致するか検査する。

SDK Select の onEscapeKeyDown と Radix document capture 経路にも取消がある。これらを同時に変えない。Bで最終defaultPreventedがtrueなら、主比較は「特定callsiteの寄与」であり「Escape全体の取消有無」ではない。結果が同じでも他の取消が冗長である可能性が残り、製品根本原因を否定できない。

## 実験

各OS/engine、各route内でA/Bを交互実行。fresh page、browser再利用、375×1000/light/root100%。最初5回。directを主比較、その後real Tabとlegacyを別系列。元runnerのenvironment/layout/Button/Badge/Alert/Switch前段とring計算を固定hashから再利用する。Selectは元のmouse/keyboard/Escapeまでの操作を再実行し、disabled force-click以降は実行しない。これは新しい限定診断であり、元runnerのexit1を書き換えたものではない。

preventDefault/focus/MutationObserverの計測は両条件共通。performance.now同一時計でcallstack、keydown/up、defaultPrevented、focus-visible、scrollと矩形を保存する。計測中立性は未証明。PNGはon/off/off2/on2で実描画差を判定。輪郭FAILは観測結果として残し、診断COMPLETEと製品PASSを分離する。

## 限界と安全境界

既存第1〜5回、製品・SDK・lock・公開版は不変。旧persistent offscreenをこの限定実験で解消したとはしない。実機Safari、物理入力、VoiceOverはNOT_TESTED。Windows hosted CIを実機独立操作と呼ばない。PR #23/#29マージNO、Stage 3 HOLD。
