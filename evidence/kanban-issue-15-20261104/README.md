# Issue #15 — 新規自己検証記録

2026-11-04 JST。実装者による検証。独立レビュー未実施、マージ推奨NO、Stage 3 HOLD。
最終提出HEADと最終CIの終端結果は [Draft PR #16](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/pull/16)
および [Issue #15](https://github.com/tetsujisugimori-coder/intelligence-ui-museum/issues/15) の提出記録を参照。
このフォルダは下記の実行時点を固定した証拠であり、後のcommitを実行した証拠へ読み替えない。

## 同定

開始mainは `1b4befda87c97bd70da2c1d6065427034d12660a`。PR #14はGitHub実データでmerged。
mainとPR提出HEAD `f012876fed8e08a3ad3cd23527c30598e2bd2561` のtreeは
`99d5f7f904f95fbd64d4ff4fb3aebf72511da29d` で完全一致。
旧main `3b90ddbb77787b759c014a24d99f05ca98dda89f` は両者の祖先で、treeは
`0b1714d642778e26507f8ba94b8be63c034deb5c`。index.html/exhibits.jsは旧新同一、exhibits.cssのみ表示差がある。
AGENTS.md・Issue・PRと関連レビュー・既存script・CIを読み、専用ブランチで開始。
リポジトリ内に追加AGENTS.md、`.agents/skills`、`.codex`の適用指示はなかった。

## 採用方式と結果

詳細・手順・限界は [検査設計](../../docs/KANBAN-VISUAL.md)。全24条件に画像判定を実施し、代表条件への限定はしていない。
固定公式Playwrightコンテナdigest、既存1.56.1 lock、ブラウザ・font inventory照合を使う。
正常PR #14の48基準画像を実装者が目視し、別commitで明示採用。通常CIは基準を書き換えない。
native select内の三文字分の実paintを比較。RGBA差12超を差分画素とし、許容2画素。
DOM文字・寸法はcrop特定用であり、可読性のPASS根拠にはしていない。

| 実行 | 自動判定・終了 | 意味 |
| --- | --- | --- |
| 旧版へ既存kanban-zoom-test | 24/24 PASS、child 0 | 旧検査の偽陰性を再現 |
| 正常版へ新画像判定（Linux 091a） | 48/48 PASS、runner 0 | 操作24条件も成功 |
| 実旧版へ同じ画像判定 | 46/48 FAIL、代表4画像すべてFAIL | 旧版操作検査は成功、画像を理由に拒否 |
| 正常CI run 41805089221 | 全6 job成功 | 保全・build・既存browser・新Kanban |
| 故障CI run 41805470747 | KanbanのみFAIL、他5 job成功 | 同じゲートが故障を実際に非zeroで伝播 |
| ローカルWindows診断 | 正常48受理、旧版48拒否 | Linux正式基準と分離した暫定診断 |
| 失敗経路対照 | 初期Linux14、補強後ローカル20対照成功 | 合成故障と実旧版を区別 |

Linux代表条件375px/dark/合成2倍のラベル差分数は、Chromium 未着手519/進行中852、
WebKit 未着手605/進行中208。正常版は0画素差。同じ基準・crop・許容差を使用した。
旧版の末尾欠けと正常版の全文表示は、両engineのPNGも目視確認した。自動判定と目視の併用を区別する。
46画像が拒否されたことを、46種類の文字欠けを目視確認したという意味には使わない。
このgateは可読性が保たれた描画差にも反応し得る視覚回帰検査である。

正常CI対象は `091a7e87ca5c33d06b3c019d39eb7e300f4c0d86`、tree
`797792e7854c574ac2cc39f197b9b905edb8419a`。
故障対照は別branch `test/issue-15-ci-fault` の `5067e7b9cca6855dc021715d222a699067c9c46f`、
tree `2ceb4cf3df26f4c6f411592c00c21e0271e6804d`。
そこへ旧CSSを意図的に再導入した以外、同じ正常基準と判定コードを使用した。
本PRの製品ファイルは変更していない。故障branchはマージ対象ではない。

## 証拠の配置

- `github-start.json`: 開始時のIssue/PR14/関連レビュー実データ。
- `baseline-acquisition/`: Linux基準候補24条件・48select・96card PNGとJSON。取得専用で受入成功ではない。
- `baseline-contact.png`: 48基準画像を並べた実装者目視用。並び順はcapture.json順、各行todo/doing。
- `linux-091a/`: 正常・実旧版のcapture、全24条件画像、48比較ずつ、差分、旧試験結果、child log、runner summary。
- `ci-fault-5067/`: 故障再導入で実際に失敗したCIの画像・JSON・差分・終了コード。原因は `current label paint regression`。
- `ci-*.json` / `logs/ci-*.log`: 実Actionsのjob終端とログ。初回bootstrap後、後続pushでrun全体はcancelledだが、候補撮影jobは意図したFAILで終端済み。
- `windows-diagnostic-summary.json`: 正式Linux検証と分離した初期診断。暫定harnessの結果で、最終HEAD実行とは扱わない。
- `controls-20-local.json`: 正常画像・比較を受理、比較未実行/欠測/重複/判定欠落、実子process exit7、条件欠落/重複、HEAD/tree/UUID/日時不一致、再生成font退行、PNG欠落/破損/古い日時、合成末尾消去、基準欠落を拒否。最終CIも同じ20対照を実行する。
- `logs/`: 保全、契約、buildのローカル実行。`SHA256SUMS.json`で今回bundleのファイルを列挙。

最終HEADのfresh CI artifactはPRで別途リンクする。証拠をcommitするとcommit自身のhashが変わるため、
過去実行の対象HEADを後の提出HEADへ書き換えず、最終CI artifactとGitHub提出記録で対応を示す。

## 回帰・失敗の扱い

302原本hash、v09 byte一致・117ID/11分類、現123ID、旧117dataset一致、runner25件、v11契約17件、
v10 build/test/baseline照合は成功。CIの既存Stage A・v11 browser検査も成功。
原本や過去証拠は上書きしていない。これは123展示の全操作成功という意味ではない。

ローカル保全の初回はWindows global `core.autocrlf=true` によるGit archiveの改行変換で `.gitignore` hash不一致。
同じ失敗をログへ保存し、プロセス環境だけ `core.autocrlf=false` とすると302件成功を確認した。
原本・global設定・保全assertは変更していない。Linux CIでも同じ保全検査は成功した。
別の初回契約試験はルートcwdからv10試験を直接呼び、相対scripts参照の6件がENOENTで失敗した。
正規の `npm run test:runner` は25/25成功。初回の42件中36成功6失敗を成功へ読み替えない。

## 未検証と独立レビュー重点

実機iPhone Safari、VoiceOver、OS文字拡大、実OS背景化、全123展示の完全操作はNOT_TESTED。
Issue #12/#13の表示修正と本件を分離し、#5/#9/#10、旧Linux Modal原因UNKNOWN、Stage 3 HOLDを維持。
Sites更新・公開拡大・一括依存更新・Issue閉鎖・Draft解除・マージは実施していない。

独立レビューでは、基準48画像の全文表示、cropが末尾全体を含むこと、許容差の妥当性、
実旧版拒否が環境失敗で代用されていないこと、失敗伝播と欠測/再利用拒否、baseline更新運用、
source HEAD/treeとartifactの一致を重点確認してほしい。
