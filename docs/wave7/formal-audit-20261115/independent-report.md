# PR #61 第7便 正式原ZIPの独立照合

担当 `/root/independent_audit`。製品・監査器の作成、正式ZIPの取得・保管作業は担当していない。親 `/root` は取得・保全と監査器再実行を担当。本担当は保存先から再取得された実物を直接読み、独自のPython照合、既存固定契約の読取検証、画像実見を実施した。新ブラウザ起動・実験・CI操作・製品変更なし。

## 対象版・原ZIP

- HEAD `9c74d898fa534de6f5b380cc36b425fb854afa8c`
- tree `f9e2aacc7a4fe1e865fbeabf3db30531e6e721c4`
- run `43724015917` / attempt `1` / artifact `14166072555` / `v11-wave7-evidence`
- 107365453 bytes、SHA-256 `51d3ed7e79dc2b37a8c568781b2061906b1b7a43862dd79c2729fbbab9caa827`
- 再取得実物: `audit-pr61/archive-readback/14166072555-v11-wave7-evidence.zip`
- 保管先実物: `<WINDOWS_ARCHIVE_STORAGE_ID>\14166072555-v11-wave7-evidence.zip`

保存前download・保管先実物・保存先からのreadbackの3本をそれぞれ独立に全バイト読取り。3本のサイズ・SHA-256・全バイト一致、開始時GitHub metadataの公式digest一致を確認。原ZIP全668メンバーCRC正常、同名重複なし。独立展開先は `audit-pr61/independent-extracted`。既存PR46/49の原証拠をPR61の証拠へ流用していない。

manifestは667ファイルのサイズ・SHA-256を全件照合し一致。対象範囲は `all files except manifest itself`。manifest自身は対象外で、ZIP公式digestがmanifestを含むZIP全体を結ぶ。正式ZIP外の保全台帳・後作成報告・再実行出力・ソースbundleは当該内部manifestの対象外。内部manifestだけで外部保存先のACLや保持期限を証明しない。

## identity・実行source・実配信・trace

ローカルGitの対象HEADとtreeの対応、GitHub commit/run/artifact metadata、原票のHEAD/tree/runId/attemptを照合。`results.ci.eventSha` はPRイベント用merge SHA `82a70e7348710e92cb9a4d8dea0a81ad116e840e` であり、checkout HEADへ読み替えていない。正式workflowはPR headをcheckoutする設定を確認。局所版や同treeの別commitを正式HEADへ読み替えていない。

GitのHTMLから閉包を確認した17配信資源の全バイトSHAを、Git blob、14条件の保存応答ファイル、同context HARの応答実バイト（base64を必要時decode）で全件照合。6実行sourceはexecution内実体と対象Git blob・原票hashを照合した。42pairの84 modeについてwave7.jsの保存source、sourceHash、HAR応答を照合。resource故障だけ予定404を確認した。

98 trace ZIP（正常14、fault84）全CRC正常。31975 trace eventを読取り、engine、viewport、hasTouch、reducedMotion、条件query、goto pageIdとHAR page/pagerefを照合。

context optionsにcolorScheme明示値は存在しない。light/darkは製品のbody.light切替である。正常14条件のうちlight6は各traceでtheme click1回とBODY class lightを確認。dark通常6はclick0とBODY空class、dark2倍2はclick0とBODY reduce-motion。fault84はtheme click0で既定dark。Gitの`:root color-scheme:dark`、`body.light color-scheme:light`とtheme listenerを照合した。OSカラースキームを切り替えた検証とは呼ばない。

## 条件・状態・故障対照・監査器負対照

固定14条件はChromium/WebKitそれぞれ375/390/1280×light/darkの6条件＋375dark文字2倍/reduced-motionの1条件。重複・欠測なし、全14原票PASS・errors空。各26段階、計364 snapshotの段階名順序、状態、rendered表示、focusを固定契約と照合した。さらに製品関数を使用せず、Pythonで142のBFS経路/直接間接/件数、143の入力妥当性/整数費用/人日/日平均/差分、144のparent chain/ID/適用cursorからの状態を再計算して一致した。文字2倍は2条件×26段階の3788フォントサンプルをbaselineの実測2倍と照合。BUTTON/INPUT/LABEL/LI/OUTPUT/P/PRE/SELECT/SPAN/TD/THを含む。

両engine各21組、計42正常/故障pairを確認。全正常はACCEPT、全故障はREJECTかつassertion=trueでケースIDを含む意図した理由。起動失敗・timeout・予定外例外による拒否は存在せず、検出成功へ算入していない。cleanup/persistence errorなし。resource故障はpageerror0、予定404と対応する。

原ZIP内audit-negative.jsonの21件について、固有ID、正常ACCEPT、改変REJECT、拒否理由と対象欠測/条件/状態/hash/identity等の対応を読み取った。missing trace/HARのENOENTは意図した証拠欠測拒否であり、起動プログラム自体のENOENTとは区別。wrong-condition-traceはtrace内の条件assertionで拒否。正常監査PASS、originalUnchanged=true、originalFileCount=666（監査負対照出力とmanifest生成前）、監査器/負対照runnerのGit/source SHA一致を確認した。この原票内の不変記録を、現在の新しい再実行結果と混同しない。現在の監査器再実行・負対照再実行は親の別記録に委ねる。

## 代表画像の実見

次の12画像を画像として実際に閲覧した（ファイル存在/hashだけの確認ではない）。

- `chromium-375-dark-2-exhibit-142.png` / `143.png` / `144.png`（後2件も同prefix）
- `webkit-375-dark-2-exhibit-142.png` / `143.png` / `144.png`
- `chromium-1280-light-1-exhibit-142.png` / `143.png` / `144.png`
- `webkit-1280-light-1-exhibit-142.png` / `143.png` / `144.png`

両engineの142の説明・依存方向・ノード一覧・循環・初期結果、143の入力3欄・比較表・棒ラベル、144の操作ボタン・時点select・初期履歴とstateを認読でき、切れ・重なり・文字欠落は観測しなかった。広幅1280でもgalleryカード内は約310pxであり、展示単体が1280px幅であるとは扱わない。

375px文字2倍の143では総費用40000がセル内で40/00/0へ数字途中折返しし、列見出しも縦に分割される。値は残るが一覧性は低下する。別修正提案として、数値を一続きに読めるresponsive表/列構成を検討することを推奨する。固定契約に数値非改行の要件はなく、当該画像で欠字・誤値・遮蔽を観測しないため、今回の限定技術監査のblocking FAILとは判定しない。製品修正は今回行っていない。

12画像は操作完了・Reset後の最終画像。選択中・入力エラー中・分岐中の見た目をこの最終画像から推定していない。途中段階は364の状態/表示原票とtrace対応の読取検査であり、全途中状態の画像実見は未実施。

## 独立判定

原ZIP保存完全性・公式digest・CRC・manifest・identity・source/HAR/trace対応・固定14条件/364段階・42pair・原ZIP内21負対照記録は上記範囲でPASS。独立担当の読取り監査は実施済み。初回ネットワーク/実物未到着時のBLOCKED観測は、その時点の到達性であり、取得後の上記実物監査により解消した。

独立証拠監査としてPASS、残る親の監査器再実行/CI再確認/記録提出が全て成立すれば限定技術受入PASS・限定マージ推奨YESを支持する。実際のマージ・Draft解除はしない。

Stage 3 HOLD、v10製品受入NO、PR #46 SUSPENDED、既存原因UNKNOWNを維持。実機Safari、VoiceOver、物理touch、OS拡大はNOT_TESTED。保管先アクセス範囲・保持期限の最終事実認定は保全台帳を参照し、本報告から未確認のACLや保持を推定しない。

## 監査器再実行結果の独立読取り追補

親が新しい案件別`.work`コピー・専用TMPDIRで実行した `auditor-rerun-utf8.json` と `negative-rerun-unsandboxed.json` を独立読取りした。対象HEAD/tree、監査器/負対照runner SHAは原ZIPの記録と一致。監査器PASS（14条件・42pair）、負対照21件の正常ACCEPT・改変REJECT・全21の意図した拒否理由・originalUnchanged=trueを確認した。再実行のoriginalFileCount=667はmanifestを含み既存audit-negativeだけをwork側で別退避した入力、原ZIP実行時666はmanifest生成前であり相違を説明できる。

親から共有されたWindows既定文字コードによるUnicodeDecodeErrorとsandbox hardlink EPERMの初回環境失敗は保存されており、負対照の意味的拒否成功へ算入しない。監査器コードは変更せずUTF-8環境と必要なhardlink権限のある新コピーで完走した結果を上記再実行記録として区別する。独立検証集計は同ディレクトリの `independent-verification.json` に保存した。

2026-11-15 23:52 JST
