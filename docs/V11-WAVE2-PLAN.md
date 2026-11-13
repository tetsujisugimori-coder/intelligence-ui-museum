# 第2便 127–129 固定契約 (2026-11-14 JST)

基準 main `ccc94cb181f2fdc9358fe12e1b6adfd4c3673e0f`, tree `5734e649bdad6e1e069913cb8847478805662466`。Issue #50。PR #49 mergedをAPI確認。旧branchへのopen PR head/base参照は0（open #46/#29/#23はいずれもmainベース）。旧branch削除は実行前審査で拒否されたため未実施・再送しない。新規実装と切離す。

## 独立展示の価値
- 127 Tree Grid: #56 Treeの階層だけ、#50 Tableの行列だけ、#111 Sortable Tableの順序変更と異なり、階層行・選択・子孫集計を同じ表で操作する。
- 128 Visual Rule Editor: #124 Query Builderは検索。本展示は固定データに対するIF/THEN処理と競合・優先順位を扱う。先に一致したruleが勝つ。全一致と候補処理を説明し、値の異なる一致を競合とする。外部効果なし。
- 129 Dependency Graph: #120 Kanbanは状態移動。本展示は有向依存辺と循環・影響・実行可能順。循環時は順序を生成しない。

## 固定受入
Chromium/WebKit、375/390/1280 px、light/dark の12条件、および各engine 375 dark reduced motion・実測文字2倍の2条件、計14。主要操作、native keyboard/mouse/touchエミュレーション、入力拒否、Resetとfocus、前後状態、文書overflow、console/pageerror。各工程で再描画後の文字倍率測定。故障注入は別実行、意図した不整合が検出されなければFAIL。

127 親子・集計・展開、128誤判定・優先・競合、129循環・順序・影響、共通Reset・focus・証拠欠落・監査対象不一致を検査。正常証拠や過去FAILを改変しない。故障用コピーと原本を区別する。

## 保護・実行
既存126件の正規化dataset SHAをwave2-baseline.jsonへ固定。旧123 baseline/v09 bytesの検査も継続。v10/legacy/archive/evidence/reviewsの既存原本は変更しない。既存testの件数期待・配信資源・source closureだけを必要最小更新、旧fixtureはメモリで互換化。

新依存なし。Playwright1.56.1を既存lockで専用.workコピーへ導入。共用temp/他案件cacheの清掃なし。初期free 58 GiB、free inode 4,144,898。見込み: browser/test dependencies <2 GiB、原PNG/trace/JSON <500 MiB。実増分は最終記録。

最終HEAD/tree・実資源・実行コード・原証拠hashを結び付ける。GitHub原artifact ZIPのdigest/SHA/size/CRCと内部manifestを照合。本人限定SpaceまたはWindowsへの保存と独立readbackが未完ならARCHIVE PENDING。

## 判定の境界
Stage 3 HOLD / v10製品受入NO / PR #46 SUSPENDED / 既存原因UNKNOWNを維持。実機Safari、VoiceOver、物理touch、OS文字拡大はNOT_TESTED。旧126全操作を保全検査だけでPASSにしない。CI、技術受入、保全を独立判定。Draft解除・merge・公開なし。
