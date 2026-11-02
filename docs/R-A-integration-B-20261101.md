# PR #8: R-A1 / R-A2 修正取り込みの自己検証

2026-11-01 JST。基準B `31b99a457e6532ae98ed62bda3b1dd0748eed8d4`、取り込みA `1c45d45e2bc5abb7f2618e81b93a1bc32a921a67`。
B製品への新しい問題は今回再現せず、製品・既存テスト・過去証拠は変更しない。PR #8のbaseは`fix/issue-4-runner`を維持し、B旧HEADと新Aを親とするmerge commitで系譜を保持する。

CIの唯一の重複編集ファイルは`.github/workflows/ci.yml`。Bのpreservation追加、browser-v11、既存Stage A Linux smokeを保持し、Aの正常smoke12/matrix40と負対照を実行する`browser-stage-a`ジョブを追加する。force pushなし。

Linux Debian 13 / Node 24.22.1 / Playwright 1.56.1 / Ch141 / WK26で、Bの不変ソース16 blobを照合して再実行。通常28条件（12 browser、4 accessibility、2 no-JS、2 focused regression、8 Modal）、契約8、pageerror負対照2が成立。正常child exit0、負対照child exit1、親summary exit0。PNG/JSON/log構造検査も原runnerで成功。
全123 ID連番、旧117データ全体一致、11分類、追加6の名前・分類・独自出自、v11 titleを確認。全117操作の保証ではない。B変更後も旧製品blob不変をtree照合し、CI full checkoutで保全とbuildを再確認する。

初回契約試験は取得対象に過去fixtureがなかったためENOENT。その失敗を保存し、認可済GitHubから5 JSON・3 PNGを取得して8/8 PASS。PNGは132729/59155/58199 bytesとGit blob SHAが原本に一致。fixtureや期待値を書き換えた成功ではない。

証拠 `evidence/ra-integration-b-20261101/` の原JSON/log圧縮、summary、全証拠hash索引、代表Ch/WK PNGを参照。最終HEADに紐付くCI終端はPRコメントに追記する。B本体の未修正P3（矛盾error JSON）はIssue #10、研究serverのTOCTOU残余はIssue #9。公開・敵対的可変rootの安全性を主張しない。

これは実装担当の自己検証であり独立再レビュー完了ではない。Draft/未マージ、Stage 3 HOLD維持。Windows再実行・実機Safari/VoiceOver未実施。独立再レビューへ提出する段階で、正式APPROVE・マージ・公開を行わない。
