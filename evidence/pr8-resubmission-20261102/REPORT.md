# PR #8 P2/P3 修正・独立再レビューへの再提出

2026-11-02 JST。実装者の自己検証。独立再レビュー未実施、マージ推奨NO、Draft維持、Stage 3 HOLD。

## 固定基準と変更

GitHubのPR・原レビュー全文・HEAD・CI・Issue #6/#9/#10を取得。開始HEAD `b9d3b840162c8d03fa5d2f62c89793ea55ce7d03`、tree `502b90b0d62c9b0dd9d1b30c8531f0a12bcfc565`、main `6477d0bc3fcd207210524abeaace97d0e506e886` は申告一致。Git clone成功、履歴を含む隔離worktreeで対照を作成。初期Codex-Cloud-Labは変更していない。

- P2 commit `e56bc67a1e68f0d9a6f621830307119ebfebc598`：119だけを製品修正。stable ID / 左右別選択Set、残る既存選択の復元、移送対象は未選択、Undoは全選択解除という従来仕様、操作ボタンと最終Undo後のfocus。
- P3 commit `e3679d199d845f854e7378fdf0b983d3a65e238f`、tree `f56d1617dfa108ce6401044aafae344f30da4576`：root CSS200%と実文字2倍を分離。実測・クリッピング・focus・選択/移送/Undoを追加。製品CSSや他展示は無変更。
- 新規試験は `transfer-{test,scenarios,red,contract,contract.test}.cjs` と `text-zoom-{test,contract,contract.test}.cjs`。既存runnerへ追加し、旧HEAD拒否も必須。旧assert/28条件/pageerror2/契約8を削除せず緩和しない。
- CIの追加は新契約8件（P2 5＋P3 3）とbrowser-v11の履歴取得。実行OS・依存lock・timeoutは不変。最終証拠commitでは新試験結果JSONのstdout出力を追加し、ログ経由で全6条件を再取得できるようにする。合否条件は変更しない。

## RED→GREENと受入

`../pr8-transfer-20261102/REPORT.md` と `../pr8-text-zoom-20261102/REPORT.md` にコマンド・初回の試験不備・訂正・生JSON・画像を保存。初回を消去していない。原Windows環境の再利用ではなく、原HEADをLinuxで実行した対照。

ローカルDebian13.6 / Node24.19 / Python3.12.14 / Playwright1.56.1制御・導入済みChromium154。375/390/1280、390light・他dark、reduced-motion。

- 同じP2試験：旧3条件すべてFAIL/exit1（A/B/C/E失敗、D/F成功）、新3条件18/18検査群成功/exit0。設計checked before=true、旧after=false、新after=true。新規移送実装はfalse。DOM property/属性/ARIA属性/native type、activeElement、outline、focus-visibleをJSON化。
- P3実文字3条件成功。全6説明文14→28px、root CSSのみは14→14px。全子要素も採取済み基準の2倍。カード6×3のgeometry/文字range clipping/Tab・Shift+Tab focus18件成功。操作6×3群成功、pageerror/console error0、横超過0。代表画像を開いて目視確認。
- Stage A runner単体25/25。Stage B従来8＋P2 5＋P3 3＝16/16。SKIP0。型検査を含むv10 build、真正性静的検査、baseline、JS構文、保全検査成功。独立のlint script/設定は存在しないため架空のlint成功件数は記載しない。

## 固定両ブラウザのCI

実装HEAD e3679d1の[CI 41384821901](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/41384821901)でbrowser-v11は成功済み。実checkout `ca3dc64e247a9aa10b198d14488ecb07b114851e`（mainと当該HEADの仮merge）。

- 固定Chromium141.0.7390.37/WebKit26.0×375/390/1280のTransfer6条件、実文字6条件と、旧HEADが全6条件で必須パターンのFAIL/child exit1となる負対照を新ゲートが検査。
- 従来通常28条件、pageerror2意図的FAIL/child exit1、PNG16の旧厳格validatorも成功。新旧証拠は別directory。新正常suiteにconsole/pageerrorは0必須。原28の実行を6展示全要求や全123の全操作保証へ読み替えない。
- artifact metadata・checksum・成功ログ抜粋は本folder。6条件のraw JSONと全screenshotは[artifact 13115450073](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/actions/runs/41384821901/artifacts/13115450073)、期限2027-01-31 UTC。CI自身が全JSONの条件・assert・観測値と原16PNGを照合したことと、作業者がZIPを展開し画像を全部目視したことは区別する。
- ローカル固定ブラウザ配布先は403 Domain forbidden。artifact connectorの取得自体は成功したが、発行URLをクラウドfilesystemへ転送するcurlは403。ZIPのローカル展開照合は未実施。proxy/認証/通信制限は変更・回避していない。最終CIでは新JSONをjob logにも出し、数値の読戻しを可能にする。
- P2のみの中間CI41384575661は次pushでcancelled。失敗を隠すretryではなく別commit提出によるconcurrency cancel。全成功と扱わない。最終証拠commitのCIも別途終端確認し、最終HEAD/tree/base/CIはPR本文・報告コメントを正とする。

## 保全の範囲

`preservation-pre-final.json`と`python3 scripts/verify-pr8-local-fix.py`がGit blobの比較記録/再現手段。固定基準→現在でStage A97/97不変、main非CI532/532不変。Stage B122中118不変・4変更、製品16中12不変・同4変更（README/accessibility-test/exhibits/run-browser-ci）。共通CI1ファイルは追加ゲートと履歴取得を意図した変更。変更したblobを不変とは報告しない。

302原本bundle、v09全117 ID/名称/分類・11分類、v10 Apps SDK lock/真正性環境、123連番と出自、過去レビュー/証拠、Stage AのR-A1/R-A2-CLIP・失敗伝播コードを保護。新規runtime依存/外部送信/ライセンス変更なし。新規証拠だけを追加。

## 独立再レビュー引継ぎ

A既存選択保持、B連続・複数移送、C逆方向、D Undo（従来通り選択解除）、E実キーとfocus/ネイティブchecked、F全件移送/空/Resetを再確認。14→28px実測条件とroot CSS条件を混同しない。最終版の全CI・旧HEAD負対照・pageerror負対照、Stage A/B blob例外を再取得して確認する。

NOT_TESTED：実機Safari/Mac、VoiceOver/実スクリーンリーダー、物理タッチ、OS文字拡大、全123展示の網羅操作。旧Linux Modal根因UNKNOWN、Issue #9/#10未解消。新規P1/P2は今回の自己検証範囲で未確認。P2閉鎖は候補であり最終判断は独立再レビュー。Draft・Stage 3 HOLD・マージ推奨NO。
