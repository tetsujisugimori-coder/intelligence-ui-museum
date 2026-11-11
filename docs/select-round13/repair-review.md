# 第13回 再レビュー修正の検証範囲

2026-11-11 JST。Issue #43 / Draft PR #44。着手時にGitHubとcheckoutで `b349eb0add15b5886dfa7ae4bfc4b9c2e66124bb` を照合した。製品、SDK、lock、過去の原票・レビューは変更しない。Stage 3 HOLD、PR #23の製品受入NO、根本原因UNKNOWN。

## P2-01: CIの終了値と原ZIPゲート

修正前のworkflowの実際のshell本文を抽出し、各コマンドの終了値だけを注入した。正常はexit 0・原ZIP許可。契約だけ失敗はexit 0・原ZIP許可となり、契約の終了値も保存されなかった。最終privacyだけ失敗はexit 17だが原ZIP許可のままで、最終privacyの終了値も未保存だった。

修正後はrunner、auditor、初回privacy、契約、最終privacyの5終了値を個別に保持する。すべて0になった後だけ `raw_upload=true` を出し、upload stepもevidence stepの成功を要求する。先行準備/保全検査が失敗した場合はevidence step自体が実行されず、ゲートは開かない。常時実行のstatus保存により準備/保全/evidenceのoutcome、各終了値またはNOT_RUNを残す。

`node --test tests/select-round13/ci-gate.test.cjs` は現在のworkflow本文をそのままbashで実行する。正常、runner、auditor、初回privacy、契約、最終privacyの単独故障を試す。これはexitとupload条件の契約試験で、実uploadや故障時のブラウザ採取ではない。正常の実uploadは4環境CIの原artifactで別途確認する。

## P2-02: 採取と監査の境界

旧schema 1にはtransition側の `afterOutline` / `afterShadow` はあるが、隣接snapshot側の独立採取値はない。旧原票に新しい観測値を補完しない。旧原票から独立した擬似CSS観測を遡及的に作ることはできない。

新schema 2は取得直後・Space直後・Escape直後の隣接snapshotで `getComputedStyle(e, '::after')` を独立採取する。transitionとsnapshotの輪郭/影を各時点で照合する。別のevaluateによる隣接観測の整合性であり、その間に未観測遷移がなかった証明ではない。不一致はFAIL。pairsは条件、反復、arm、試行ID、診断、各遷移のphase/focused/focusVisible/expanded、因果UNKNOWNを試行原票から再計算して完全照合する。

### 同一旧原票の反例と正常対照

元の最終Windows WebKit artifactはrun 42889345387 / artifact 13797368396。
https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42889345387/artifacts/13797368396

GitHub metadataと原ZIP実バイトのSHA-256は `d88e272f5f145c6ad420e79024d73225cddc8777c696de5d6c71e78c834b25b4` で一致した。

原票の複製で、afterSpaceの擬似輪郭、afterSpaceの擬似影、pairsのfocus-visibleをそれぞれ単独変更し、行JSON・results.json・SHA256SUMS.jsonを一致させた。b349eb0の完全auditは正常とこの3反例をすべてPASSとした。先行レビューのSpace focused、Space focusVisible、Escape focusVisibleの3反例は引き続きFAIL。

`archive-check.cjs` は認証済みの原ZIP digestと全抽出バイトを照合する保全検査である。正常の旧原票はPASS、上の3反例はFAILになるが、これは元runからの改変を検出するもので、新たな独立CSS観測の成功ではない。新しいauditはschema 1をschema 2として受け入れず、旧原票の隣接擬似CSS照合はNOT_TESTEDのままとする。この区別を失った「旧原票の独立CSS監査が修正後PASS」という主張はしない。

新schema 2の正常原票と同じ3反例、先行の3状態値反例を別途再実行する。新しい3反例は関連JSON/manifestを再計算しても、擬似CSSまたはpairsの意味照合でFAILすることを確認する。schema欠損やsource hash不一致だけのFAILを反例成功と数えない。

## 再現方法と最終提出

CIゲートは `node --test tests/select-round13/ci-gate.test.cjs`。比較用旧shellは `git show b349eb0:.github/workflows/select-round13.yml` で取得し、`node tests/select-round13/ci-gate.test.cjs --report <旧workflow>` を実行する。

schema 2の原票は当該HEADのcheckoutと同一buildを用い、`ROUND13_EVIDENCE=<原票dir> node --test tests/select-round13/evidence.test.cjs` とaudit CLIで検証する。過去原票のソース依存の完全監査には対応する旧HEADを使う。原ZIPはGitHub metadataのdigestと照合してから展開する。

最終4環境・72試行・36組、原ZIP hash、最終HEADの5 workflows、別担当の独立結果はPR #44とIssue #43へ証拠リンク付きで記録する。未実施をPASSとは記載しない。Draftを維持し、マージ・公開・Stage 3解除は実施しない。
