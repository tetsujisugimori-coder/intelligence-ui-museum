# 第7回：Escape取消2要因・閉鎖経路の比較（2026-11-08 JST）

Issue #28 / Draft PR #29。開始 b9eeb552160c9fdd986bf17c181f312859b5fdc6、tree a97f5acaadece053bde2bcb8690876dcb7ae6281。main 615334d30b0673c786b12877bcec3d7e723be9b2。Stage 3 HOLD。製品・公式SDK原本・依存lock・第1〜6回証拠は変更しない。

## 探索条件

A：Select onEscapeKeyDown取消有効、useEscCloseStack取消有効。
B：Select有効、hook無効。
C：Select無効、hook有効。
D：両方無効。

Selectのプロパティだけを空handlerへ置換し、共有helpers、open/close autofocusは変更しない。hookは取消1行のみ。これは2要因探索であり4条件全体を単一要因と呼ばない。Radix fallbackが取消/onDismissを追加する可能性を測る。全取消falseでも閉鎖/値/復帰/イベント経路の同等性が成立しなければ因果UNKNOWN。

## 計測と母数

plain buildは2取消箇所以外不変。tapped buildは4条件共通のcallsite観測だけを追加。noneはplainとruntime observerなし、minimalはplain＋captureイベント、fullはtapped＋prototype/focus/MO/callsite観測。全条件Escapeはkeyboard.pressで配送しkeydown/up間のRPCを廃止。計測中立性は結果の比較であり無干渉の証明とはしない。

最初Linux WebKit direct各1 pilot、その後3環境×3経路×4条件×2反復（72）を探索。計測比較はdirectで3mode×4条件×2反復×3環境（72）を別母数。全取消あり／なしの比較が成立しない限り20回へ増量しない。fresh page/browser再利用、各反復A,B,C,D順を記録。順序効果未解明。

## 保全・検証

旧183試験と第6回fault24を保護。新検証器の変更前bytes/反例/実行結果を保存してから修正し、独立再実行。原JSON/PNG/hash/終了コード・HEAD/tree・全計画格子の照合。外部期待planを必須とする。既知輪郭FAILは診断COMPLETEと別記録。元runnerのFAIL/exit1、禁止force-click以降NOT_TESTEDは維持。

## 旧offscreenとの差

旧原票：Windows WK26、375×1000 light/root100、scrollY3555/trigger.top-658/option.top-583/popup.top-621、旧統合2/20・旧main1/20。第7回は旧前段environment/layout/Button/Badge/Alert/Switchを固定runnerから抽出して再利用するが、Selectのscoped順序・計測・隔離buildが異なる。元runnerと同一実験ではない。各試行rect/scrollを保存し、persistent失敗の非再現を解消扱いしない。

## 禁止と未検証

force-click、assert緩和、任意sleep増量、製品修正、公開、merge、HOLD解除は禁止。実機Safari・物理入力・VoiceOverはNOT_TESTED。独立レビューと原ZIP照合後に限定結果を提出する。
