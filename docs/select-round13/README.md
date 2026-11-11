# 第13回 Select診断: 観測副作用とfocus-visible遷移

親Issue #28 / 本件 #43 / 第12回 merged PR #42。2026-11-11 JST。事前登録は `tests/select-round13/plan.json` を正本とする。

## 仮説と比較の基準

対象は前段なし A、Switch disabled ON B、Switch disabled ON→OFF D。各条件ごとにイベント/MutationObserver常駐probe ONとOFFを、3組の交替順・新規ページで比較する。Windows/Linux × WebKit/Chromiumは独立母数。OFFは常駐observer OFFに過ぎず、Playwright trace・最小snapshot・スクリーンショットの影響は残る。

focusを取得した直後、Spaceでメニューが開いた直後、Escapeで閉じた直後について `document.hasFocus()`、対象のfocus、`:focus-visible`、擬似要素CSS、展開状態と時刻を同じ方法で採取する。中間のスクリーンショットを外し、操作と観測を挟む順序を固定する。DOM/幾何・scrollが一致しない比較はUNCONFIRMED。ブラウザ内部状態の完全一致は主張しない。

## 実行と検証

既存の `python scripts/prepare-work.py`、固定lockによる `.work/v10` npm ci/build、`tools/stage-a-browser` npm ciとPlaywright 1.56.1ブラウザを準備する。新規出力ディレクトリで `ROUND13_ENGINE=webkit ROUND13_OUT=.work/select-round13 node tests/select-round13/run.cjs`。検証は `ROUND13_RUNNER_EXIT=<実際の終了値> ROUND13_EXPECT_HEAD=<実行時HEAD> ROUND13_EXPECT_PLATFORM=<OS> ROUND13_ENGINE=webkit node tests/select-round13/audit.cjs .work/select-round13`。原票は上書きしない。

### 事前計画と現在のCI

初期の事前計画では、独立プライバシーゲートがないため原JSON/PNG/traceのアップロードを禁止し、合否/statusだけを保存する方針だった。この段落は当時の計画であり、現在の条件は次のとおり。

現在はGitHub-hosted Windows/Linux × WebKit/Chromiumの4 jobs。固定build/ブラウザ準備、既存証拠保全・契約事前検査を通り、runner、原票auditor、初回privacy、evidence契約、最終privacyの全工程が成功した場合だけ原ZIPを許可する。最終検査の前に許可を出さない。原票は当該run/attempt/HEAD、freshな空context、loopbackの合成入力、固定公開ソースに限定する。ローカルPC、self-hosted、実ユーザー入力は許可しない。privacy PASSだけでは診断PASSも製品受入も意味しない。

失敗時は原ZIPを送信せず、`runner-exit.txt`、`auditor-exit.txt`、`privacy-exit.txt`、`contracts-exit.txt`、`final-privacy-exit.txt`を保存する。未到達はNOT_RUN。準備、保全検査、evidence stepのoutcomeもstatus artifactへ保存する。生ログや未承認原票はstatusに含めない。正常時もstatusを保存する。raw artifactの保持期間は90日で、無期限保管ではない。

### 新旧原票の監査範囲

schema 2では隣接snapshotの独立した::after輪郭/影と、3時点のtransition値を照合する。pairsも試行原票から再計算する。旧schema 1は独立した擬似CSS採取値を持たず、対応旧HEADでの既存監査と原ZIP保全検査のみが可能。この不足を値の補完や一律FAILで解消したとは扱わない。詳細と再現手順は [再レビュー修正の検証範囲](repair-review.md) を参照。

## 範囲と判断

製品コード・SDK・依存lock・旧証拠は不変。製品のStage 3 HOLD、#23未受入、根本原因UNKNOWN。実機Safari、VoiceOver、物理操作、他幅、reduced motion、旧画面外optionクリックはNOT_TESTED。独立レビュー/全CI成功なしでマージ推奨しない。
