# 第9回 Select 単一要因pilot（2026-11-09 JST）

## 判定

総合 **PARTIAL**。製品原因UNKNOWN、Stage 3 HOLD。製品修正・PR23再受入・根本原因確定ではない。新規試行は各環境18件とSDK隔離6未実施枠で固定し、取得後の追加試行は行わない。診断実装・原票整合の受入と製品の受入を分離する。

Issue #35、親Issue #28、Draft PR #36。PR34固定 `5edb9c7bf5c24add6a238eec7ba2cd968384e357` をbaseにしたstacked PRで、PR34の限定統合判断と第9回実験は別。原取得producer `fc8228fcc0104c66e89318158980ec24d945de8e` / tree `3128d26550399b0053402f8c551c5fb236d85665`。公式SDK、製品、依存lock、過去証拠は不変。

## 原証拠確認

PR34の固定HEAD・独立COMMENTレビュー5820093253・5 workflows SUCCESSを確認。独立担当は旧Windows/Linux CI ZIPを再取得し、API digest/SHA256/CRC、全原票、72 trace・288 Select PNGを再検算。今回は別checkoutのfresh npm ciからMuseum/SDK fixtureを再buildして一致。112既存単体・302原本保全成功。旧Windows実PC ZIPは別途原hash照合し、CIとは別の転送整合境界として扱う。

## 事前固定した比較

全群は同一Museum source/build/CSS、SDK0.2.2、Playwright1.56.1、WebKit26.0、375×1000/light/文字100%/DPR1。毎回fresh context/page、browser再使用、headless自動入力。実PCも物理入力ではない。

1. history：共通の見出し位置合わせとblur後、非操作要素のSelect h2へ普通pointer click、またはShift down/up。その後のtrigger.focus→Space→Escapeは共通。
2. prelude：凍結旧runnerのenvironment/layout/Button/Badge/Alert/Switch前段あり／なし。その後のpointer履歴、direct focus、Space→Escapeは共通。
3. opening-key：共通pointer/direct-focusからSpaceまたはArrowDownで開き、Escapeで閉じる。
4. SDK isolation：旧fixtureはDOM/CSS変更とuseEscCloseStack取消除去・Radix dismiss抑止・Select取消切替を共有する複合介入。単一因子として移植・検証できていないため、両arm計6枠をNOT_TESTEDとした。未検証の比較を成立と数えない。

普通option clickは今回の固定列に含まれず、旧持続画面外click失敗の再現率はNOT_TESTED。輪郭の有無と別症状にする。

## 環境別結果

Windows実PC（10.0.26300、Node24.20.0）、Windows CI（10.0.26100、Node22.23.4）、Linux CI（7.0.0-1017-azure、Node22.23.4）は**別母数**。3環境とも同じセル結果を観測した。以下の分母は各環境ごとで、合算しない。

|比較|arm|n|acquisition/final focus-visible|輪郭|差分画素|
|---|---|---:|---|---|---:|
|history|pointer|3|true / true|VISIBLE 3/3|1465|
|history|keyboard Shift|3|true / true|VISIBLE 3/3|1465|
|prelude|なし|3|true / true|VISIBLE 3/3|1465|
|prelude|あり|3|false / false|ABSENT 3/3|0|
|opening-key|Space|3|true / true|VISIBLE 3/3|1465|
|opening-key|ArrowDown|3|true / true|VISIBLE 3/3|1465|
|SDK isolation|native / paired|各3枠|NOT_TESTED|NOT_TESTED|NOT_TESTED|

全18取得行でtrigger焦点復帰を観測。輪郭ABSENTかつfocus-visible=falseは観測事実であり、その状態だけで製品不具合と判定しない。製品適否はUNKNOWN。

## 同等性ゲート

history/opening-keyは各3pairのSelect subtree、CSS hash、computed style、geometry、scroll、viewport等の固定条件を確認。full-document同一性は主張しない。

preludeは全3pairで厳密Select HTML同一性が不成立。具体的にはSelect disabled checkboxとhidden #official-select inputに空の `style=""` 属性が残る。Playwright screenshotterがinputのcaret-colorを一時変更して空へ戻す実装に由来する可能性があるが、発生源は未確定。属性セレクタ・観測処理を含む完全無影響は未証明。CSS/computed style/geometry一致を理由に結果後の正規化で合格へ変えない。**UNCONFIRMEDを維持し、前段の単一因子効果とは断定しない。追加試行NO。**

同等性snapshotは共通before-history PNGの撮影前で、focus直前のDOMを証明するものではない。共通撮影が空style属性を残す可能性があるため、差分がfocus時点にも残るとは断言しない。次回は共通撮影後・介入直前の同等性測定を事前設計する。

## 原因仮説

- **支持（限定）**：今回の前段操作列とdirect-focus輪郭不表示には3環境で対応がある。focus-visible=falseは開放前のacquisition時点ですでに観測され、閉鎖時だけに初めて生じるという説明には反する。ただし前段の厳密DOM同等性が未成立のため、原因・必要十分性はUNKNOWN。
- **反証（狭い命題のみ）**：今回の「見出しpointer click対Shift入力」だけで最終輪郭が分かれるという予測は観測されなかった。両群はacquisitionからfocus-visible=trueだったため、pointer/keyboard一般や他の入力履歴の寄与を否定しない。
- **反証（狭い命題のみ）**：前段なしの同一MuseumでSpaceだけが欠落、ArrowDownなら表示という予測は観測されなかった。n=3の非再現は一般的な同等性の証明ではない。
- **UNKNOWN**：前段のどの操作・タイミング・DOM残存が寄与するか、画面構成差とSDK隔離処理の寄与、旧持続画面外click故障、物理入力/Safari/VoiceOver、低頻度現象と旧OS/browserへの外挿。

## 検証・失敗履歴

新比較器は欠測・不正型・矛盾・イベント欠落・paint矛盾を拒否する。独立担当の初期4誤受理反例は修正前後コードと同一変異結果を保存。実原票を改変してrow/manifestを再生成した独立16負対照では、producerの6誤受理を確認・修正し、同一16入力すべて拒否。期待platformとOS/Node/browser、trustedのboolean型、activeElement、trace resource参照を厳格照合。171単体と302原本保全に成功。採取runner/plan/probeは初回producerから変更せず、解析器の修正で原JSON/PNG/trace/exitを上書きしない。

原取得CI run42616269440のWindows/Linux両jobでrunner0/audit0。後続CIは同じ固定原artifactの再解析専用で、新規samplingではない。最終HEADのchecksおよび独立レビューはPR36に紐付ける。成功した診断CIを製品PASSとは呼ばない。

ローカルcloudではWebKit host依存不足によりブラウザ起動不能。Windows実PC・CIとは区別し、実行できたように数えない。Windows実PCは専用新規checkoutで実施し、旧checkoutと他作業は変更していない。

## 原ZIP

- Windows CI artifact13672547843 / 20,631,524bytes / SHA256 `7ff130e4602bdfc2b8560502fe48507beebc11bebc0acda989da5e7c10e7dd24`
- Linux CI artifact13672617535 / 30,640,441bytes / SHA256 `d510d095569b472bf58b4d11d7b1682e8588c9a857c55ea7beb969fea00a9424`
- 原取得 [run42616269440](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/42616269440)。API digest一致、各ZIP170 entries。CI原artifact期限2027-02-07 UTC。Windows実PC原ZIPは19,400,747bytes、SHA256 `f73b3ce2df3a3537a60c076b2e1d5a7606d1450ef20ce236c5a66ae405afe248`、CRC正常170 files。Space保存はユーザー承認済みだが保存機能が利用できず未完了。実PC上での独立再監査を別途行い、CI2環境と区別する。

マージ・Draft解除・公開・Stage3 HOLD解除は行っていない。
