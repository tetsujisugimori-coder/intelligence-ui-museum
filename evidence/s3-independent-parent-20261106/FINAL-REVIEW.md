# 最終候補68743f6の別環境独立照合

対象HEAD `68743f6ff857e55f107ec6c1dc7b8e94b8d71511`、tree `bb7b9b2e5346ea748eea9d45997b61d4d2f1228d`。製品main `77d30ac54e35b8a6408fb5f56db4697adff8a452` と提出branchをgit ls-remoteで再確認。main、製品、SDK、依存は変更しない。

## 結論
S3-1研究版FAIL。旧SelectのBODY脱落は今回の重点12操作で解消を確認。新しい製品P2 #24 Tooltip / #25 Buttonは未解消で、限定受入NO、検証PRの限定マージ推奨NO、S3-2準備NO、Stage3 HOLDを維持する。新検査器の独立反例は修正再確認済みだが、正常な製品全工程の原artifactによる正例対照は未達である。

## 独立の新規実行
この別環境でmainの保全、型・build・test・baselineと2回のdist byte比較を実行。Chromium141で16条件と重点6Select操作を実行し、後者は全PASS。Tooltipは自然なTab移動から10/10、Tab/Shift+Tabを使う追加20/20でfocusedなのに説明が消えることを再現。先行実行と最終候補のCI件数を合算しない。実行原票、失敗した環境準備の履歴、画像、SDK自身2645ファイルのbyte比較は同branchのreview.bundleに保全済み。

最終68743f6でaudit-probeを別実行し、synthetic正例exit0/9負対照exit1を確認。さらに独自の3反例（SDK状態FAIL、engine配列重複、14focus faultが同一ケース）を同じCLIで再実行した。旧655cb29は誤PASS/exit0だったが、68743f6は3件すべて正しい理由でFAIL/exit1となった。結果はaudit-green-counterexamples.json。synthetic正例を実製品の全工程成功と呼ばない。

## 最終CI原ZIPの独立実取得
専用run42207105868 attempt1、artifact13497426548をGitHubから直接ダウンロードし、ZIP全体SHA256、展開、CRC、manifest参照569ファイルのSHA256、HEAD/treeを照合した。715entry、CRCエラー0、欠落/hash不一致0。元ZIP digestは `5ac207cdabe90375349d2ed2165d5bd2e29b240211046b282d328280337a8037`。別jobのinspectionartifact13497168015も実取得し、CRC、digest `c7e86bc1940df8c14479c0ba27ee1487386bcf77cc27aab3d1eef1180adc3dbd`、内容が自身の照合と一致した。単にZIPが存在することを確認したのではない。

- matrix32:8PASS/24FAIL/未実行0。各engine狭幅12件でButton輪郭チェックだけがFAIL。
- focus44:全PASS。要求12と追加32を区別。fault14と回帰4setも全PASS。
- live故障6種×2engine:すべて意図した理由でexit1、suite PASS。
- 別作成independent runner24row:23PASS/1FAIL。WebKit AのTooltip keyboard表示待ちtimeout。直前のhoverと他部品はPASS。
- Tooltip反例20は0PASS。Button反例16は4PASS/12FAIL。
- WebKit A keyboard PNGを実際に目視し、Select青い輪郭と選択bを確認。
- 通常CI42207105652は初回clip依存取得中cancelledを保持し、同HEAD attempt2で6/6job成功。Select CI42207106111成功。専用CIの製品P2によるfailureとは分ける。

## 限界と分類
この環境のWebKit起動はOSライブラリ不足でNOT_TESTED。WebKitについて上記はCI新規実行の原票・画像の独立照合であり、このホストの新規実操作ではない。別担当の独立Chromium実操作と合算しない。

sourceComplete=false/auditExit=1を改変せず保持した。失敗cellの後半subassertは未実施であり、32条件を動かしたことと全操作成功を混同しない。正常実製品full artifactのaudit-controlsは未実施。T1/T2 PASS、T3 FAIL、T4 Select限定PASS、T5 FAIL、T6/T7 PARTIAL、T8 FAILを支持する。

実機Safari、VoiceOver、OS native文字拡大、全117展示完全操作、依存到達性、release LICENSE、KaTeX/CSP、本配信asset、Issue9 TOCTOUは未解決/未検証のまま。修正は別Issue/Draftへ分離し、この証拠保存で解消扱いしない。
