# 第9回 Select 単一要因 pilot

固定起点は PR #34 HEAD `5edb9c7bf5c24add6a238eec7ba2cd968384e357`。Issue #35。記録日 2026-11-09 JST。Stage 3 HOLD、製品原因 UNKNOWN、Draft 維持、マージ禁止。

## 固定計画

`tests/select-factor-pilot/plan.json` を採取前にcommitする。3因子×2群×3反復=18採取スロット、SDK隔離6スロットは明示NOT_TESTED。各OSを独立の母数とし、CI/実PCを合算しない。実PCでもPlaywright headlessであり物理入力ではない。通常option clickはこの短縮系列に存在しないため、旧持続画面外クリック失敗は全セルNOT_TESTED。

全実行群は同一Museum製品・DOMのソース・CSS・SDK 0.2.2、375×1000、light、文字100%、DPR1、Playwright1.56.1、WebKitを使う。fresh context/page、browser再利用。反復ごとAB/BAの順序を入れ替える。任意sleep・force click・DOM clickによる成功代替は使わない。

- history: 共通のSelect見出しcenter scroll/blur後、見出しへの通常pointer clickとShift key down/upを比較。その後どちらも同じlocator.focusでtriggerへ移る。これは操作として定義した入力履歴の比較であり、Shiftが全engineでmodalityを変えるとは仮定しない。実イベントと焦点状態から判定する。
- prelude: PR34保存原runnerのenvironment/layout/Button/Badge/Alert/Switch前段を実施する群と、省く群を比較。他展示の値・DOM状態は前段因子そのものにより異なる。同じ製品/build/CSSとSelect subtreeの同等性を実測するが、前段後の全document DOM完全一致は主張しない。比較の因果対象は「この前段一式」の有無であり、前段の個々の操作には分解していない。
- opening-key: その他を固定し、SpaceとArrowDownだけを変える。SDK内部で異なる分岐に入るとは仮定しない。

共通後続はtrigger.focus→開放キー→expanded/可視option待ち→Escape→閉鎖待ち→観測である。閉鎖後はfocus-visible、activeElement、rect、スクロール、4PNG輪郭差分を取得する。開放時PNGはtraceの近傍フレームのみで、exact直前/直後画像が必ずあるとは主張しない。閉鎖後画像を開放時の代替にしない。

## SDK隔離が未成立である理由

`tests/sdk-parity/vite.config.mjs`のnative→pairedは単一差ではない。`useEscCloseStack.js` のpreventDefault除去、Radix `onDismiss` fallback抑止、Select `onEscapeKeyDown` の取消条件変更が共変する。fixture.tsx/style.cssもMuseumとは異なる。既存fixtureの結果を同一Museum比較と呼ばない。

paired-cancel対paired-plainを同一Museum診断buildへ移す設計は可能性があるが、それは共通のhook/Radix介入下でのSelect取消効果であり「SDK隔離全体の効果」とは異なる。この版ではその新しい推定対象/変換を事前固定していないため、SDK隔離の両群をNOT_TESTEDとして保持する。公式SDK、既存fixture、製品、旧証拠は変更しない。

## 観測と同等性

capture-phase trusted/untrusted入力、focus/blur、mutation、scrollを同じperformance.now時計で記録。SDK合成イベントとPlaywright trustedイベントを区別する。locator.focusはprogrammatic。input-history直後からfocus獲得までを別seqで束縛する。最初の開放までにスクリーンショット待ちを挟まない。

pairごとにSelect subtree（React生成IDを正規化）、CSS hash、trigger style/rect、scroll、表示条件、SDK版を比較する。全document hashも保存するが、完全同等の条件とはしない。source/build同一でも実測対象が不一致ならUNCONFIRMED。追加試行は自動実施しない。同等性確認、独立レビュー、別の事前固定計画が揃うまで拡大NO。

4PNGのoutline suppressionは全操作が終わってからだけ行い、必ず戻す。観測probe/trace/rAF/PNGが元のタイミングに無干渉とは未証明。ring計測はscrollIntoViewを行うので、その直前final rect/scrollを原状態として保存する。outlineのVISIBLE/ABSENTは観測分類であり、focus-visible=falseを製品アクセシビリティ不具合と断定しない。製品PASS/Stage3解除と診断完備を分離する。

## 検証と再実行

既存手順で `.work/v10` をfresh作成し、固定lockのnpm ci/build、tools/stage-a-browser固定lockのnpm ciとWebKitインストールを行う。

```
node --test tests/select-factor-pilot/contract.test.cjs
FACTOR_OUT=.work/factor-raw node tests/select-factor-pilot/run.cjs
FACTOR_EXPECT_HEAD=<producer SHA> node tests/select-factor-pilot/audit.cjs .work/factor-raw
```

Windowsでは環境変数をPowerShell構文で設定する。auditorは`python`（またはPYTHON環境変数）でZIP CRCとtraceを検証する。raw JSON/PNG/traceとSHA256SUMSを保全。auditはmanifest、row binding、Gitのproducer source/plan/product bytes、PNG再計算、trace操作列、比較器再計算を確認。build hashはauditor実行環境の.work/v10/distと照合する。同じ取得buildを再利用した場合は独立再build同一性の証明ではない。期待producer HEADはFACTOR_EXPECT_HEADで必須指定する。dirty採取はsource commit照合でFAILとなり、原票は消去・上書きせず別出力でやり直す。

n=3非再現は低頻度故障の解消を意味しない。仮説は支持/反証/UNKNOWNに分け、3要因の結果からSDK隔離、物理入力、実Safari、VoiceOver、歴史的故障の根本原因へ一般化しない。
