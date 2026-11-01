# CIブラウザ実行環境の固定
2026-11-02 JST。HEAD 201494bbfd96978985f373387edf5a1839cd4ddd のCI run 41357300768でbuild/保全は成功、両browserジョブは試験開始前に失敗。
ログはubuntu26.04-x64 / Playwright 1.56.1非対応を明示。回帰失敗・描画失敗とは数えない。artifact未生成もこの導入失敗の結果であり、試験成功とは扱わない。
固定Playwright/lockを保つため、browser-stage-aだけubuntu-latestからubuntu-24.04に固定する。上限15分、検証項目・assert・browser版は不変更。build/preservationジョブは元の指定を保持。
新HEADのCI成功確認前はブラウザ回帰未確認。旧失敗runは削除・再実行による置換をせず、新commitの別runで再測定する。
