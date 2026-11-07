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

## 初期観測と比較の限界

Linux新規pilotはdirect各A/B5試行を完走。WebKitは双方5輪郭FAIL、Chromiumは双方5輪郭PASS。Aの取消2回のうち、helpers.js:97 ← Radix dismissable-layer:95 が先にfalse→trueへ変更し、useEscCloseStack.js:10は既にtrueのイベントを再度取消した。Bは後者だけを除去し、前者とMuseum select-focus-return.ts:40のMutationObserverによるfocus復帰を保持する。

この冗長取消が存在する限り試行を20へ増やしても「全取消の有無」という未成立の介入を成立させられない。今回主系列は各5とし、独立native対照と別入力系列で範囲を確認する。原因分類C/UNKNOWNを維持する。

計測用capture listenerでqueueMicrotaskした記録は、WebKit/Chromiumで後段listenerより先に走った。このため`keydown-microtask`をdispatch完了と解釈せず、Playwright keydown配送後の`keydown-settled`を別記録する。微小なタスク境界への影響は残り、未計測版と同等とは保証しない。

独立レビューで6つのtrace/証拠誤受理反例が見つかった。focus-return、MutationObserver、settled取消状態、PNG実在・再計算、条件ID、境界一意性を強化し、同じ反例を拒否する。PNG/hash不整合の成果物を製品PASS件数に数えない。製品修正は行わない。
