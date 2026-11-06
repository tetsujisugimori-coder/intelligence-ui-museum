# 独立 Select フォーカス復帰検証

2026-11-06 JST。実装者runnerから独立して作成。製品/SDKは変更しない。

各実行には未存在の EVIDENCE_DIR が必要。既存directoryがあれば拒否する。

- CODEX_PRIMARY_RUNTIME_NODE_MODULES: Playwrightを含むnode_modulesの絶対path（CIでは明示必須）。
- SELECT_ENGINE: chromium または webkit。1実行1engine。
- RED_ROOT: 旧版のbuild済みアプリroot（run.cjsのみ）。
- GREEN_ROOT: 修正版のbuild済みアプリroot。
- EVIDENCE_DIR: 新規出力directory。run/faults/engineごとに別directory。

実行: node tests/select-return-independent/run.cjs
24件（RED/GREEN × A/B × mouse/Enter/Escape/Tab/outside/repeat）。期待focus・値・開閉状態・pageerror・件数を検査。REDは失敗再現が期待値。全期待一致でexit0、契約不一致/実行障害はexit1。

実行: node tests/select-return-independent/faults.cjs
正常対照1件と故障4件（復帰無効/誤target/BODY強制/二重focus）。正常は契約受理、故障は拒否が期待値。全期待一致でexit0、不一致/実行障害はexit1。

ChromiumとWebKitを各々実行する。Playwright WebKitは実Safari/VoiceOverの代用ではない。root200%は実OS文字拡大ではない。v10全体FAILおよびStage3 HOLDの変更根拠にはしない。
