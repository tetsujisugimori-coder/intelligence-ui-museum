# PR #19 / Stage 3-1 独立受入レビュー

2026-11-06 03:15 JST。実装に参加していない統合担当と独立子担当A（保全・出自）、B（ブラウザ）、C（runner）が新規に検査した。製品、公式パッケージ、原テスト、過去証拠を変更していない。通常コメントによるレビュー記録であり正式APPROVEではない。

**A. 総合判定：FAIL。** 必須のSelect閉鎖後フォーカス復帰で実故障を再現した。保全・再現ビルドは成功したが、WebKit新規独立実行とCI成果物ZIP内部検査にも不足がある。これを研究版PASSへ繰り上げない。

**B. T1〜T7**

| 検査 | 独立判定 | 根拠と限界 |
|---|---|---|
| T1 対象・原本・SDK | PASS | HEAD/tree、117展示/11分類、原本byte、保護履歴、fresh SDKとinstalled、6 importを独立照合 |
| T2 再現性 | PASS | 保全、25 runner契約、型/build/test/baseline全exit0。別々にnpm ciした2出力でdist8/8 SHA-256一致 |
| T3 公式6部品 | FAIL | 状態・値の主要操作は成立。Selectのmouse確定/keyboard確定/Escape後にtriggerへ復帰しない |
| T4 重点focus | PARTIAL | Chromium重点2条件のButton/Select枠をactive/focus-visible/幾何/PNG/負対照で確認。WebKit新規0条件 |
| T5 32条件 | FAIL | Chromium root16条件を新規操作。Select復帰16/16失敗。focus/layoutは16/16成功。WebKit16条件はNOT_TESTED |
| T6 検証器 | PARTIAL | 25契約、独自8対照、旧新モデル、実Chromium故障検出を確認。両engine原entryのclean正常0/故障非0の独立再現はBLOCKED |
| T7 証拠 | PARTIAL | HEAD/tree/日時/env/終了値/生JSON/log/PNG/hashを新規保存。6 CIログを読取。ZIP内部・WebKit独立証拠は未確認 |

対象HEADは `401c554ae87a6d846b1655bc9af12a92d7002633`、treeは `e1f1604a8db5d62d5c713407f30511bb8ab5e30f`。base/main `aa744be94e0e03efb31439f339361ccc859ad656` に対し0 behind/1 ahead、差分は `docs/STAGE3-1-V10-RESEARCH-ACCEPTANCE.md` の92行追加だけ。着手時と投稿前に同一HEAD・open/Draft・未マージを確認する。

T1の直接検査：v09は293,948 bytes、SHA-256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`。117連番ID/117名称/11分類、public/dist原本、viewer dataset、v08先頭105件が一致。原bundle302件、保護履歴等252件、archive/review台帳58件のGit/hash不一致0。全117展示の実操作成功を意味しない。

SDK `@openai/apps-sdk-ui@0.2.2` fresh npm tgzのintegrityがlockと一致し、公式2,645ファイルがinstalledとbyte一致。Button/Badge/Alert/Switch/Select/Tooltipの実importと公開exportを確認。registry gitHead `0f00143c7a639906f1621fe58e1b6be7b5bea46d` とprovenance一致。新規build mapの公式本体27 sourceはfresh tgz、nested依存11 sourceはinstalledと一致。署名/SLSA検証はNOT_TESTED。

T2の新規実行環境はDebian 13/Linux x86_64、Node v24.19.0、npm11.9.0、Playwright1.56.1。`python3 scripts/verify-migration.py`、`npm run test:runner`（25/25）、`.work/v10`で`tsc --noEmit`、`npm run build`、`npm test`、`node scripts/verify-baseline.mjs`はいずれも最終exit0。別`.work/build2`へ独立npm ci/buildして8/8一致。初回npm cache ENOENT、そのための型/build未実行失敗、node_modules symlinkを使った不適切な最初の2build比較不一致も原票保全し、成功件数に含めない。cacheを`/tmp`へ移し、依存を別々に導入して再現した。

historical `apps/v10/dist` とfresh distのasset hashは一致しない。この点も追加検証した。map89 sourcesContent/sources/names/mappingsは全一致、JS差はsourceMappingURL、CSS差は新しい検証scriptをTailwind4自動scannerが拾った3 utility（571 bytes）だった。別copyでscriptsのみ初期import版へ戻すと歴史CSS/JS/index.htmlのbyte一致を再現した。旧distや証拠を修正していない。現在コードの独立2build一致と、過去成果物の保全を区別する。

**C. 重点フォーカス2条件**

| 条件 | Chromium154.0.8037.57 新規実行 | WebKit 新規実行 |
|---|---|---|
| 320px / dark / root200% | Button/SelectへTab・Shift+Tabで取得、active/focus-visible=true、枠の幾何とON/OFF/RETURN PNGを確認 | NOT_TESTED / BLOCKED |
| 1280px / light / root100% | 同上 | NOT_TESTED / BLOCKED |

Buttonの橙/青枠、Selectの青枠をB担当と統合担当がPNGで確認。2条件×2部品×消去/完全clipの8負対照を独自pixel検査が8/8拒否（probe exit0）。RGB差24以上、正常ON/RETURN安定差8以内、最低変化画素数を要求する。任意CSS・部分クリップ・WCAG完全適合を保証しない。最初のinset(0)では内側枠が残ったため対照の期待が不適切だった（probe exit1）。その失敗を残し、inset(4px round 999px)による全枠消失をPNGと画素で確認した。

旧レビューのactive=falseから製品不良を推定したのではない。今回の通常focus取得は成功し、下記の操作後復帰は別の失敗である。root200%はCSS合成拡大であり、OS/native文字拡大ではない。

**D. 公式6部品の独立操作**

- Button：click/Enter/Spaceで実行回数3、disabled時不変、loading時disabledと出力、focusをChromium16/16で確認。
- Select：名前「表示モード」と現在ラベル、mouse/keyboardのa/b値、開閉、hidden input整合、通常focus枠は16/16成功。確定後とEscape後の復帰は各16/16失敗。
- Badge：success/warning/danger表示と教材出力、variantsを16条件で確認。
- Switch：click ON、Space OFF、aria-checked/出力、disabledを16条件で確認。
- Alert：閉鎖、Enter再表示、色とstatus/出力を追加独自probeで16/16確認。main順次probeは先行Tooltip待ちで5条件が未到達だったため、別probeで補完した。
- Tooltip：main順次probeは11/16で表示/hover/Escape/保持を確認、5条件は待ちtimeout。scroll直後focusの順序依存を切り分け、pending scrollを2 RAFで配送し、直前のtemporary sentinelから実Tabで入る別probeは16/16成功・exit0。これは部品への局所到達で、ページ先頭から全Tab順を通過した保証ではない。scroll/focus順依存の詳細原因はUNKNOWN。

独立layout probeは16条件で文字range、clip祖先、control bounds、document横幅を確認し16/16成功・exit0。全ラベルの画素完全検証ではない。JS pageerrorは通常probeの保存記録で0。console errorは既知KaTeX外部fontのCSP拒否20件/条件を観測し、無エラーとは記録しない。その他console errorから分離した。

入力は実ブラウザに対するPlaywright mouse/keyboard API。原matrixにはtap API経路もあるが、実機タッチや物理入力試験ではない。新規ブラウザはsystem Chromium154であり、CI固定Playwright Chromium141と同じ実行ではない。

**E. CI #41991830999と独立実行の対応**

6ジョブのcompleted/successに加えて全ログを取得した。preservation/build/browser-stage-a regression/clip/browser-v11は仮merge `d6fdccb4d55f5a2c89993b9e975b604395d84e1e`、Kanbanは提出HEADをcheckout。merge treeも `e1f1604a8db5d62d5c713407f30511bb8ab5e30f` で提出treeと一致し、`git diff`は空。

- preservation：原本302等の保全、runner25件、v11静的123展示と契約17件の成功ログ。
- build：隔離build/教材検査/baseline成功、build artifact9ファイル。
- kanban-visual：提出HEAD/tree、current/old-head/negative controlsとaudit CLIのexit0記録。artifact4625/1452ファイル。v11側でありS3-1公式6部品の受入に転用しない。
- browser-stage-a regression：normal-smoke/normal-matrix/modal-delayedは子0、modal-stuck/focus-missing/focus-hidden/late-pageerrorは子1、cleanup失敗拒否・1ms process timeout検出のログ。artifact597ファイル。
- browser-stage-a clip：focus-clipped子1を期待どおり確認、fixture実行stepも成功。artifact323ファイル。
- browser-v11：Stage A smokeとv11 regression、旧HEAD拒否等の成功ログ。artifact146ファイル。v11の個別受入は対象外。

matrix40件はroot32条件（両engine×4幅×2theme×2root）＋Chromium CDP browser-font200の8件。後者をnative文字拡大と呼ばない。重点2条件はroot32に含まれるが、今回の独立WebKit focus確認の代わりにはしない。

成果物一覧/size/digest/expiryを取得しregression/clipのZIP取得toolはfile参照を返した。しかしexecutorで参照先取得が403となり、**ZIP内の生JSON/PNGはNOT_READ**。ログ上の契約完了とartifactの存在を確認した範囲であり、全archiveを独立再計算したとは主張しない。ログ・artifact metadataの照合を新規操作件数に加算しない。

T6の新規独立結果：

| 経路 | 実測 |
|---|---|
| 原runner契約 | 25/25、exit0 |
| 独自acceptance fixture8件 | 正常0、欠落/JSON切断/未完走/11条件/子1+valid/子0+FAIL/JS errorsの7故障は各1 |
| 保存処理失敗 | exit1、capture0 |
| 旧8bb1965 runner+validator→現行、controlled browser model | 正常0→0、Alert故障0→1、pageerror0→1 |
| 原browser正常 | Chromium smoke6条件、matrix24条件のassert成立。ただし原entry/acceptanceはWebKit欠落で1/1、全体BLOCKED |
| focus missing/hidden/clip | 各Chromium24件でfocusのみFAIL、他check成功。clipはactive/focus-visible/style paintedがtrueでも画素差0を拒否 |
| Modal閉鎖不能 | Chromium4幅で状態待ち5000ms timeoutを検出 |
| 遅延pageerror | Chromium JS有効5条件でclose直前errorを保持 |
| cleanup / process timeout | cleanup子1・外側0、timeout子status null/ETIMEDOUT・外側0。外側0は期待故障を確認したharness成功 |

独自の実Chromium faultも追加した。Alertの2回目click遮断は別observerでDOM不在/非表示を確認し、旧版のsixComponents偽PASS→新版assert FAIL。Button click時のpageerrorは別observerでも発生を記録し、旧版未記録→新版errors保持・validator拒否。両entryの最終exit1にはWebKit環境失敗が混じるため、実ブラウザのclean exit RED→GREENとは呼ばない。controlled modelの終了値比較と実描画/実状態の比較を分離した。

**F. 新規指摘**

**P2 S3-1-SELECT-RETURN：公式Selectを閉じた後、triggerへfocusが戻らない。** 観測を確認したもので、根因候補は未修正。

最小再現：固定HEADからfresh buildを127.0.0.1で開く。重点2条件それぞれfresh page/bringToFront→triggerへfocus→Tab/Shift+Tab→Spaceでmenu→(a)mouseでカード、(b)ArrowDown/Enter、(c)Escape。optionがhiddenになった後、最大2秒の状態待ちでもactiveElement=BODY。document.hasFocus=true/visibility=visibleを維持。**2条件×3経路=6/6失敗**。値a/bは正しい。通常root16条件でも復帰失敗。`browser/front-check/focus-return.json`、PNG、focusin履歴が根拠。

候補は固定SDK0.2.2の `Select/Select.js` CustomSelect.handleOpenChange（閉鎖後setTimeoutでselectContentRefがnullならreturn）と、disableAnimations:trueのTransitionGroupによる先行unmountの組合せ。公式本体を改変して根因確定したわけではない。名前/値の誤りや旧active=falseとは別問題。既存matrixは選択後に再びtriggerへ能動的にfocusするため、この復帰契約を検査していない。runnerの既存契約内での偽PASSと、この未収載の製品契約を区別する。

修正条件：別branch/PRで、固定0.2.2を維持した局所補助または公式既知挙動の扱いを検討し、mouse確定/keyboard確定/Escape後のactiveElement・focus-visible・次Tabを独立検査する。修正前証拠を保ち、両engineで再レビューする。今回製品修正は行っていない。新規P1なし、確定した新規P3なし。Tooltip順序依存はUNKNOWNとして残す。

**G. 未検証・残存リスク**

WebKit新規16条件と重点2条件、実機Safari/VoiceOver、OS/native文字拡大、全117展示の操作、一般公開assets/CSP/network/認証後操作、最新依存audit/reachability、release LICENSE来歴はNOT_TESTEDまたは対象外。Playwright browser CDNは環境policyで403 Domain forbidden、install exit1。迂回していない。CI ZIPのexecutor取得は403/curl exit22、内部未読。これらはdeniedされた取得と未実施範囲であり、実行済みとはしない。Issue #9信頼外rootのTOCTOUと#10 v11の合成PASS/error矛盾、#5依存・KaTeX font・ライセンスのHOLD事項を維持する。

**H. S3-1研究版の限定受入推奨：NO。** Select復帰とWebKit等の不足を解消して再判定する。

**I. PR #19の文書変更に限るマージ推奨：YES。** 受入計画とNOT_TESTED表記は正直で、研究版PASSや公開許可を主張していない。この92行の計画文書を取り込む判断に限る。新しいレビュー結果は本記録から追跡する。製品受入・HOLD解除の承認へ転用しない。実際のマージ、Draft解除、auto-mergeは行わない。

**J. 次工程**：Select復帰契約を別Issue/修正PRで扱い、WebKitを実行できる許可環境で重点4条件/32条件と原runner正常・負対照を再実行する。CI ZIPの生結果/画像を読んで証拠を補う。研究受入後もS3-2公開候補審査は別工程。Stage 3 HOLD解除：NO、一般公開/Sites更新：NO。

証拠は独立作業branch `review/s3-1-independent-20261106` に選択した原票・代表PNGのarchiveと本報告を新規保存する。全ローカル証拠は `/workspace/ium-review-evidence/` に保存し、既存証拠は上書きしない。archive選択一覧と全ローカルhash manifestで公開保存範囲を区別する。対象コードのHEADと証拠保存commitを混同しない。PRコメントURL/内容の読み戻しと最終Draft確認は投稿後に別途記録する。
