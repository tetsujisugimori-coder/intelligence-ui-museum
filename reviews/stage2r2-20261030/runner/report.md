# Runner最終短報
2026-10-30 21:31 JST

**C検証基盤：PARTIAL、受入PASSにはできない。条件付きP2の偽GREEN経路が残る。** 製品不具合・実ブラウザ不具合を断定していない。実CI伝播は未検証。

- 既存17/17、独立18/18 PASS。旧matrix入口のengine例外exit0→現版exit1再現。両現runnerでengine例外/保存例外は非0。
- smoke.cjs:12のAlert再表示はclick後のassertなし。提出runnerを無変更で合成ブラウザAPIに接続し、再表示がfalseのまま12条件PASS/exit0を再現。`Alert color/close/reopen`というcheckが期待範囲を満たさない。CI gateでの利用実態は未確認だが、受入検証器として偽GREENを残すため条件付きP2。最小修正はreopen後の可視・状態assert。
- 同12行のsixComponentsはpageerror listener/errors配列がなく、validatorに届かない。v09にはlistenerあり。最小修正は同様の収集追加。
- 固定±7px/closest exhibitのみのfocus外縁checkは、全clip祖先やcomputed outline外縁保証ではない。別focus2条件測定と分離する。
- 実CI・nativeブラウザ全runner再実行は未実施。製品修正・元証拠書換なし。

## 再現と証拠
- `existing-tests.log`: 既存17テスト
- `independent-probes.cjs`, `independent-probes.json`, `independent-probes.log`: 独立18プローブ。scriptはrunner-workから実行（./scripts参照）。
- `legacy-exit-probe.log`: bundle baseから旧入口取得、旧0/現1
- `stage2r-browser.cjs-launch.log`, `stage2r-smoke.cjs-launch.log`: 起動例外
- `stage2r-browser.cjs-save.log`, `stage2r-smoke.cjs-save.log`: 起動例外＋保存例外
- `smoke-reopen-probe.cjs`, `smoke-reopen-fault.json`, `smoke-reopen-fault.log`: Alert再表示故障モデル→exit0
- `smoke-save-fault.json`, `smoke-save-fault.log`: 同合成runnerで最後の保存のみ失敗→exit1（SAVE_FAILURE=1 node smoke-reopen-probe.cjs）。実ブラウザ正常完走の証明ではない。
- `REVIEW.md`: 詳細の箇所・期待/実結果・最小案・範囲
