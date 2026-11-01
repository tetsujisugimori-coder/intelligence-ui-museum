# Issue #4 実装者検証記録

2026-10-31 JST。対象 main 98698b0cf7442baef9d6169466ee06ed9de602ad、tree 632853445785ae949eb3dd08aa51a654397859d4。独立レビューではない。

- 旧 runner と合成ブラウザ API：Alert 再表示失敗は12条件・exit 0（smoke-reopen-fault.json）。six-components pageerror も12条件・exit 0（old-pageerror.json）。製品故障を意味しない。
- 修正後同モデル：Alert 故障 exit 1、pageerror exit 1、正常 exit 0（fixed-*.json）。pageerror はページごとに収集し、記録なしも失敗とする。各 context の close でリスナーは破棄される。
- 既存17と追加3の runner 契約試験 20/20。独立レビューの18プローブは正常 fixture に必須 errors 配列を追加したコピーで18/18。再実行者は実装者。
- Windows Node 24.20.0、Chromium および Playwright WebKit、320/375/390/1280px の smoke 12/12、exit 0（smoke.json）。実機 Safari、VoiceOver、全117展示操作は未検証。
- 保全検査：Git の core.autocrlf=false を一時指定して302原本ハッシュ、保護証拠、v09 117件・11分類を確認。Windows の global autocrlf=true では bundle archive の改行変換により検査失敗した。v09 293948 bytes、SHA256 327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97。
- 隔離コピーで npm ci、型検査/build、真正性試験、baseline 試験成功。npm audit は high 1、moderate 1、low 4。初回 npm ci は証明書エラー、システム CA を指定して成功。
- Chromium 実行ファイル固定パスを除去、明示変数または Playwright 標準を使用。Windows のパス境界を修正。
- CI・最終HEADはPR側で確認する。独立レビュー、実機Safari、VoiceOverは未実施。Stage 3 HOLD維持。
