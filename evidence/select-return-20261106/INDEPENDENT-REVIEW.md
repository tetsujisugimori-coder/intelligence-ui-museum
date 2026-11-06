# S3-1-SELECT-RETURN 独立再レビュー

2026-11-06 JST。実装者とは別のレビュー担当が独自 harness を作成し再実行。

## 判定

ローカル候補の指定 P2 フォーカス復帰は限定 PASS。修正を妨げる指摘なし。v10 研究版全体の FAIL および Stage 3 HOLD は変更しない。リモート最終 HEAD/tree/CI との結合は未実施。

## 対象

- ベース main a5766c4dae9bcda791b57bb06c263a5036249343 / tree e1f1604a8db5d62d5c713407f30511bb8ab5e30f は依頼元提示値。独立リモート再照合待ち。
- main.tsx SHA256 56252779287a5b304d0e75345c89045ddd7f59c692bd41f859d0a1d4215d6910。
- select-focus-return.ts SHA256 0138534d5d40e1f8c033f9ea08a55c3d93255f26897121b2375a1a25bea12c61。
- 上記は apps/v10 と .work/v10-green/src で一致。

## 独立実測

Chromium 141、Playwright 1.56.1、各ケース fresh page + bringToFront。
A=320px/dark/root200%、B=1280px/light/root100%。trigger focus → Tab → Shift+Tab → Space で開く。

- RED: mouse カード / ArrowDown Enter / Escape × A/B = 6/6 BODY。修正前の失敗を独立再現。
- GREEN: 同 6/6 が実 trigger へ復帰。activeElement と trigger の厳密同一性。focus-visible も6/6 true。
- mouse / Enter は b、Escape は a を維持。
- 再開閉→選択 A/B 2/2 復帰。
- 外側 heading クリック A/B 2/2 閉じるが BODY を奪取しない。
- Tab A/B は修正前後とも popup 内 DIV に focus、popup は開いたまま。これは Tab 閉鎖成功ではなく同等性の確認。
- 24ケースの pageerror は0。
- 実 helper を TypeScript transpile して isolated DOM に適用: positive 1 + negative 12 全期待一致。noIntent、outsidePointer、outsideFocus、Tab、disabled、hidden、inert、negativeTabindex、detached、existingFocus、cleanup、windowBlur。これは合成 guard 検証であり全ケースの実ユーザー操作ではない。
- A/Enter screenshot を目視。フォーカス輪郭と選択値表示を確認。

## コードと SDK

Select.d.ts の公開 stable TriggerView slot を使用。helper は document / aria-expanded / aria-controls と標準 focus のみで構成。SDK が既に選んだ activeElement を上書きせず、lost focus 時のみ復帰。cleanup は observer と全 listener を解除。StrictMode の再 effect に対応。SDK 内部モジュールの import、patch、依存変更は見つからない。

apps/v10 と red/green の package.json / package-lock.json はそれぞれ完全一致。SDK dist red-green の recursive diff は0。これは同一性の確認であり registry tarball と独立再取得照合したとはしない。

## 証拠と限界

run.cjs / results.json / 24 PNG / guards.cjs / guards.json。実装者の probe/evidence は結果の代用にしない。元資料は上書きしていない。

WebKit、実Safari、実OS文字拡大、スクリーンリーダーは未実施。root200% は合成拡大。旧履歴の独立レビュー archive は今回こちらでは未取得・未評価。docs/DEVELOPMENT.md は部分snapshotに存在せず参照不可を記録。ルート AGENTS.md、README、docs/MIGRATION.md は確認。

## 追補: 独立故障注入

2026-11-06 JST。実装者の正式runnerとは別に faults.cjs を作り、実ブラウザで open 後の HTMLElement.focus を局所的に差し替えた。normal は契約PASS。復帰無効化は WRONG_FOCUS / BODY_FOCUS、誤った別ボタンへの復帰は WRONG_FOCUS、復帰直後BODYへ強制は WRONG_FOCUS / BODY_FOCUS、二重focusは RESTORE_COUNT により全4件で契約拒否。rawは faults.json。合成DOM guard と区別して実アプリに対して実施。

独立scratchの tsc --noEmit + vite build は exit 0。use-client / sourcemap の警告あり。build.logに保存。

PR #21 初回HEAD 5601a18b019de0d674088cfac38ed6b142e66e55 / tree 9f8804fef4f79875e49dda1e968d7b7b9259384f は依頼元提示。証拠追補によるHEAD更新予定のため最終リモート照合は未実施。

## 追補: 初回CI原票と可搬独立runner

2026-11-06 JST。CI42135548280の取得済みartifact .work/ci-5601a18 を独立点検。red/SHA256SUMS.jsonの13ファイル、green同45ファイルはすべてhash一致。redの4 source hashとgreenの5 source hashは検証済みローカルsourceに一致。git-identityは5601a18b019de0d674088cfac38ed6b142e66e55 / 9f8804fef4f79875e49dda1e968d7b7b9259384f。GitHub connectorから当該commitの製品2ファイルを独立取得し、既報SHA256と一致を確認。

原票はRED12件、GREEN44件、failures空。実装者runnerの両engine結果を原票から確認したもので、これをこちらの独立WebKit実行と呼ばない。WebKit A-keyboardとB-Escape PNGを目視し、表示値と青いfocus輪郭を確認。

独自run/faults harnessを tests/select-return-independent/ へ移し、engine/root/output/module pathの環境変数対応、既存出力directoryの拒否、非0終了の契約を追加。製品/SDKは無変更。Chromiumで可搬版を再実行しrun24件とfaults5件が期待一致、exit0。独立WebKitは次のCI接続待ち。最終HEADはまだ未確定。

## 追補: 固定sleep除去後の独立再実行

2026-11-06 JST。可搬版run/faultsからwaitForTimeoutを全除去。製品は変更せず、close属性とoption hiddenの状態待ち、復帰先identity最大2秒待ち、2 paint frameの観測へ変更した。REDはTimeoutErrorによる復帰未観測とBODYの両方を要求。GREENはidentity一致を要求。Tabは閉鎖を期待せず既存open挙動を維持。faultsは各故障のfocus先/call数を状態待ちで確認。

Chromiumで新規state-run/state-faultsへ実行。run24ケース（RED12/GREEN12）期待一致、faults5件（正常1/故障4）期待一致、双方exit0。runの指定主経路は旧6件/新6件。repeatの初回/二回目を含む復帰対象の観測は各variant10回で、REDは10回すべて最大2000msのidentity待ちがtimeout、GREENは10回すべて一致。Tab/outsideはidentity復帰を待たない。以前の固定sleep版原票は上書きせず保持。

## 追補: 旧archive内部の独立照合完了

2026-11-06 JST。CI経由で取得されたoriginal-review.tar.gzをこちらでSHA256計算し、既知BUNDLEの f2807499f61672b6d2608ad8011a3efac1deb7945f498ae28c6ba996f9a23b96 と一致。展開済みbrowser/front-check/focus-return.cjsおよび.jsonを自分で読取確認した。

旧HEAD401c554ae87a6d846b1655bc9af12a92d7002633、開始2026-11-05T18:08:22.254Z（JST 11月6日03:08）。Chromium154.0.8037.57。Selectのみ抽出するとA=320/dark/root200、B=1280/light/root100のmouse-select / keyboard-select / Escapeで6件。すべてafter BODY、hasFocus=true、visibility=visible、returned=false、pageerrorなし。mouse/keyboard値b、Escape値a。別のTooltip4件をSelect件数に混ぜない。

元scriptはfresh context/page、bringToFront、trigger focus→Tab→Shift+Tab→Space、option hidden後に厳密DOM identityを最大2000ms待つ。旧scriptの最終returnedはid比較だが、BODY/空idの生観測とbefore trigger idから失敗は確認できる。今回の独立版は厳密DOM identityを直接判定する。元height1000に対して今回ローカル独立版height900で、ブラウザversionも異なる。幅/theme/root/キー手順/最大復帰待ちを揃えた再現であり全環境完全同一とはしない。

historical-verification.jsonに元ファイルhashと6件の抜粋を保存。旧archive未確認という前段の時点注記はこの追補で解消。最終HEAD/CIの結合は引き続き待ち。

## 最終CI前のviewport整合

2026-11-06 JST。依頼元との原script照合を受け、独立run.cjsのheightだけ900→1000へ変更。これは元front-checkのviewportに揃える試験条件の変更であり、製品変更ではない。過去ローカル900pxの原票は保全。1000pxの実行結果は次のCIで別途評価し、既存900px結果をその成功証拠に置換しない。browser版差は残る。
