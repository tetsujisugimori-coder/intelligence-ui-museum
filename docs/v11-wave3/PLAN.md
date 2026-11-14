# 第3便130–132：固定受入計画

2026-11-14 JST。Issue #52。基準main `260173fd9e07159846c82f73f8fe40a8cedd1243`、tree `1ee834dc2dd0d28aae3aae5c811e696591e81d6b`。PR #51 mergedをAPIとGitで確認。接続アカウントと対象owner一致。

## 範囲と差分
- 130 Editable Data Grid（データ表示）：3行の名前・数量・単価をdraftとして編集。必須名40字以内、数量1–999整数、単価0–99999.99（小数2桁以内）を整数銭へ変換して正確に集計。未確定の値を合計へ混ぜず、行単位確定・取消、直前確定のUndo、Reset。Sortable Tableの順序、Inline Editの単一値、Tree Gridの階層と区別。
- 131 Schema Form（入力）：6項目以下の独自JSON形式でstring/number/select/booleanとrequired/min/max/showWhenを定義。許可属性・型・参照先を検査。成功適用で初期入力へ戻す。失敗では旧有効定義・入力を保持。非表示値は保持するが検証・出力に含めない。JSON Schema準拠ではない。Form Wizardの順序・Validationの単一検証・JSON Inspectorの閲覧とは別。
- 132 Gantt Editor（データ表示）：固定5作業、2026-11-01〜14の14日。開始日・整数期間を入力、終了日は開始+期間−1。期間1日は開始=終了。範囲外・0・負数・不正日付を拒否し確定値を保持。取消・Undo・Reset。Timelineの出来事順、Kanbanの状態、Dependency Graphの依存とは別。自動調整・クリティカルパス・129連動・ドラッグは対象外。
- 127–129の説明欠落は`descriptions[x.name]`に登録がないのが原因。3件の必要な説明を登録し、130–132も同じ名前対応へ登録。未登録・空説明を検出する契約と実画面確認を追加。単にundefinedの文字を隠さない。

## 操作・保護
Tab/Shift+Tabで標準input/buttonを移動しEnter/Spaceでボタン。130/132は確定・取消・Undo・Reset後に対象行先頭入力、131適用成功は先頭入力・失敗とResetは定義editorへ戻す。全て固定架空データ・メモリ内のみ。HTML/任意コード評価・外部通信なし。旧129のdatasetをhash固定しv09/v10/SDK/旧証拠は変更しない。132連番/11分類を検証。

## 正式14条件
Chromium/WebKit × 375/390/1280 px × light/dark = 12。各engineで375px/dark/reduced motion/実測文字2倍 = 2。主要操作、拒否、確定/取消/Undo/Reset、focus、計算・条件表示・日付と棒、文書overflow、console/pageerror、PNG/trace。文字拡大は入力・表・結果を含め工程ごとに再描画後実測し、root設定だけで成功扱いしない。

故障用コピーで誤集計、不正値誤受理、条件表示、Gantt位置/期間、Reset/focusを改変。正常対照と故障検出を分離し、意図したassertion拒否のみ検出とする。timeout/起動失敗は検出成功ではない。原票欠落・改ざん・対象hash不一致も監査器で拒否。

## 実行・証拠
新規`.work/`へコピーして実行。開始空き52,440,862,720 bytes、inode3,984,948、repo約275MB、見込み1GB以内（容量を継続記録）。共有Temp/他案件の削除なし。新依存なし、既存Playwright1.56.1。実行HEAD/treeと提出HEAD/PR仮mergeを区別。原artifactを再圧縮せず公式digest/サイズ/SHA/CRC/内部証拠を独立監査。Library保存後に実バイト再取得・別担当照合。ACL未確認は完全性とは別、Windows/追加Spaceコピー不要。

Stage3 HOLD、v10受入NO、PR46 SUSPENDED、既存原因UNKNOWN維持。実機Safari/VoiceOver/物理touch/OS文字拡大NOT_TESTED。Draft提出まで、マージ・解除・公開なし。

### Preflight findings (kept separate from final acceptance)
The original main renders the descriptions for 127–129 as `undefined` (Chromium raw JSON/PNG retained). Applying strict description lookup globally initially exposed pre-existing missing descriptions for 124–126 and stopped rendering. The strict lookup is now scoped to 127–132, preserving prior exhibits' behavior. Missing explanations for 124–126 remain a separately disclosed legacy issue, not silently fixed in this wave. The failed preflight and independent counterexample are retained, not counted as successful browser acceptance.
