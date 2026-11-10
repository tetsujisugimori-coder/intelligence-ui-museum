# 第13回 Select診断: 観測副作用とfocus-visible遷移

親Issue #28 / 本件 #43 / 第12回 merged PR #42。2026-11-11 JST。事前登録は `tests/select-round13/plan.json` を正本とする。

## 仮説と比較の基準

対象は前段なし A、Switch disabled ON B、Switch disabled ON→OFF D。各条件ごとにイベント/MutationObserver常駐probe ONとOFFを、3組の交替順・新規ページで比較する。Windows/Linux × WebKit/Chromiumは独立母数。OFFは常駐observer OFFに過ぎず、Playwright trace・最小snapshot・スクリーンショットの影響は残る。

focusを取得した直後、Spaceでメニューが開いた直後、Escapeで閉じた直後について `document.hasFocus()`、対象のfocus、`:focus-visible`、擬似要素CSS、展開状態と時刻を同じ方法で採取する。中間のスクリーンショットを外し、操作と観測を挟む順序を固定する。DOM/幾何・scrollが一致しない比較はUNCONFIRMED。ブラウザ内部状態の完全一致は主張しない。

## 実行と検証

既存の `python scripts/prepare-work.py`、固定lockによる `.work/v10` npm ci/build、`tools/stage-a-browser` npm ciとPlaywright 1.56.1ブラウザを準備する。新規出力ディレクトリで `ROUND13_ENGINE=webkit ROUND13_OUT=.work/select-round13 node tests/select-round13/run.cjs`。検証は `ROUND13_RUNNER_EXIT=<実際の終了値> ROUND13_EXPECT_HEAD=<実行時HEAD> ROUND13_EXPECT_PLATFORM=<OS> ROUND13_ENGINE=webkit node tests/select-round13/audit.cjs .work/select-round13`。原票は上書きしない。

正式CIは4 OS×browser jobsでステータスと合否だけを確認する。原JSON/PNG/traceをGitHub artifactへ送信するのは独立プライバシーゲートができてからとし、現段階ではアップロード禁止。原票をCI外で長期保全できるとは主張しない。途中の不成功・runner異常・失敗対照はFAIL/NOT_TESTEDとして記録する。

## 範囲と判断

製品コード・SDK・依存lock・旧証拠は不変。製品のStage 3 HOLD、#23未受入、根本原因UNKNOWN。実機Safari、VoiceOver、物理操作、他幅、reduced motion、旧画面外optionクリックはNOT_TESTED。独立レビュー/全CI成功なしでマージ推奨しない。
