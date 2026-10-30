# Intelligence UI Museum v10 Stage 2 R2 独立レビュー

## 1 総合判定
**PARTIAL。A 保存版 PARTIAL、B 公開版 BLOCKED、C 検証基盤 PARTIAL（fail-closed受入はFAIL、実CI未検証）。Stage 3 の公開・機能追加は HOLD。** 製品を全面的に不良と判断したものではない。ソース同定と静的保全は確認したが、独立GUIは環境起動前に止まった。

## 2 推奨
**部分修正**。Selectの局所修正は静的・提供証拠上妥当。runnerのAlert再表示assertとsixComponentsのpageerror収集を補い、限定RED/GREEN後に実browser・正式CIへ接続する。未確認focus2条件と固定されたA/B/C受入条件を解消する。実機Safari・VoiceOverや117展示全操作を新たな必須ゲートに拡大しない。

## 3 同定
独立実測：ZIP 18,720,777 bytes、SHA256 `392da9aff33a05bc71a0bb4a823a199bb43fc3a9229308fe045aee72486f382a`、CRC異常なし。FINAL-STATEの302ファイルhash全一致、追加sourceなし。bundle検証成功、HEAD `66032de7efa08eec999da14b1c62f3dec2f4adc0`、tree `f5f7d93899f2bc725620c3aba0fbdd9b9b786a54`。base `daa42f25dfadd22a1deb5fcbe8c6f98c75a2397f` から旧evidence192件は不変。Git tree302件とsourceは全byte一致。付属patchはscripts/srcの6ファイル限定diffと完全一致（全74変更ファイルを含むpatchではない）。原本・製品は改変していない。

## 4 Select 名前と値とキーボード
`src/main.tsx:20–23,29` のmodule-scope TriggerViewはvisually-hidden「表示モード：」と現在option.labelを組み合わせ、固定aria-labelで値を覆わない。公式Selectのvalue/onChangeとa/bを維持。提供matrixの独立再集計は16独立条件、list/cardのAX一致各1、a→b、document横overflowなし各16。これは提供資料の整合確認であり独立GUI PASSではない。keyboard.jsonは代表1280 dark root200のSpace→Up→Return、b→a、closed、count3のみ。全keyboard矩陣・WebKit・スクリーンリーダーは未検証。

## 5 Runner と実CI
既存17テストは独立実行17/17 PASS。独立18プローブもPASS、保存不能・engine例外は両runnerでexit1を確認。しかし無変更smoke runnerに合成browser APIを接続し、Alert再表示不成立およびsixComponents pageerror相当を注入してもexit0・12条件PASSを再現した。製品の実不具合や実browser成功ではなく、検証器の偽GREENである。正式browser全40条件と実CI失敗伝播は未実施。

## 6 Focus 2条件
提供16条件のactiveかつfocus-visibleは14/16。320 dark root200、1280 light root100はactive=false/visible=falseのまま。今回の既設Chromium起動はsocket拒否でSIGABRT、正規escalationもbwrap環境起動失敗。ページ読込み0、追加実測0なので二条件は**未検証**。製品focus不具合とも成功とも分類しない。最小再検証は許可済み実行環境でTab/ShiftTabにより実focus取得し、activeElement・focus-visible・outline幾何・画像・例外時刻を同時採取すること。

## 7 レイアウトと展示保全とbuild
提供active/fixed記録では320 light root200の右outline切れ1.546875pxがpadding8→6で内側余裕0.453125pxへ改善。提供画像も輪郭を確認できる。focus-before.json単独は非activeなので前状態の証明にしない。輪郭の部分clipを本体全遮蔽やWCAG2.4.11違反と自動同一視しない。root200はCSS合成拡大でnativezoomではない。
独立静的確認：v09原本SHA256 `327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97`、117連番ID・117固有名・11カテゴリ、viewer dataset一致、publicとdistの両HTML一致。全展示実操作成功とは言わない。
独立dist8hashは提供2buildの両リストと一致。21:33 JSTの本人明示承認後、正規1回のnpm ci --ignore-scriptsが成功。同一出力先で独立2buildとも成功（型検査を含む）、8/8 byte一致、同梱最終dist8/8とも一致した。初回拒否と当時の未検証判断は末尾履歴およびINITIAL-REVIEWに保存。

## 8 保存版と公開版
保存版Stage2R2と既存公開Stage2Rを区別。通常Web取得で旧公開URLへ到達できずHTML/assets/CSP/network/実操作はBLOCKED。認証迂回、token探索、Site更新、公開はしていない。旧版metadataを新版公開成功の代わりにしない。

## 9 依存とライセンスと解除条件
独立確認：6公式import、本人承認後のfresh公式SDK0.2.2 tgz2645filesのSHA512とlock一致、installed2645/2645 byte一致、HTML→JS→map参照一致、SDK配下38/38 sourcesContentがinstalledと一致。SDK本体27とnested依存11を区別したうえでfresh真正性・配置の照合を完了。
lock lodash4.17.21/KaTeX0.16.47は4 GHSAの影響版。公式原文の条件・修正版は資料と一致。mapにlodash/KaTeX JSが見えないことは完全非到達証明ではなく、外部KaTeX font参照は脆弱math実行と同一でない。
- [GHSA r5fr rjxr 66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc): lodash template imports等、修正版4.18.0。
- [GHSA f23m r3pf 42rh](https://github.com/advisories/GHSA-f23m-r3pf-42rh): unset/omit array path、修正版4.18.0。
- [GHSA xxjr mmjv 4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg): unset/omit path、修正版4.17.23（後続問題は別）。
- [GHSA 238p pmpm 9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7): 既存prototype汚染等とuntrusted math/unsafe insertion、修正版0.18.2。
react-remove-scroll-bar2.3.8はMIT宣言あり、配布LICENSE/該当release来歴未証明。gitHead404は不存在の証拠ではない。Stage3解除は固定受入の公開版確認、runner局所修正と実CI、依存到達性・release-licenseの説明と必要な人間のリスク受入による。

## 10 指摘と証拠と未検証
**P2 C-01 `scripts/stage2r-smoke.cjs:12`**：Alertをclose後reopen操作しても非表示のままの合成応答を注入。期待exit非0、実際exit0/12条件PASS。再表示のrole/statusとoutputのassert追加を最小案とする。
**P2 C-02 同sixComponents経路**：pageerror相当を注入。期待収集・失敗、実際listenerなしで未捕捉exit0。v09同様errors listenerをsixComponentsにも付ける最小案。両項目は同一fault記録にまとめており件数を製品不具合数としない。
独立証拠はidentity.json、git-identity.json、exhibit-preservation.json、runnerのtests/probes/faultログ、browser/review.md、provenance/REVIEW.md等。未検証：新規GUI全件、重点focus2条件、WebKit、native拡大、実機iPhone/VoiceOver、公開資産/実操作、正式CI。原資料の成功を独立成功へ置換していない。

確認 2026年10月30日21:31 JST。製品修正、公開、GitHub投稿、merge、Stage3実装は未実施。


## 追記 21時35分 JST 明示承認後の追加検証

21:31時点はinstall拒否のためfresh真正性/build未検証だった。21:33の本人返信「いいよ」により固定lock依存の公式npm取得、install時scriptなし、隔離フォルダ限定導入が許可された。同操作を正規に1回再試行し成功（251packages、exit0）。fresh SDK2645files・installed一致、map38/38一致、2build8/8同一かつ同梱dist同一を実測した。これらの未検証状態のみを解消し、全体PARTIALとA/B/C評価・Stage3HOLDは維持する。scroll-bar installed27filesにLICENSEなしを確認したが該当release来歴はなお未証明。GUI環境問題の迂回や再試行は行っていない。初回判定はINITIAL-REVIEW-2131JST.mdに保持。
