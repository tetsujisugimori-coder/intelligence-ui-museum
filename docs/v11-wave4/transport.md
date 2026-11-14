# 提出・環境の区別
2026-11-14 JST。基準main d196ba933a0c5c08aca45e3f9c563998df320d65、tree266b3fa055a6fc654874395ce68a65a826afbc85。PR53 mergedをAPIとcheckoutで確認。
通常git push --dry-runはexit128、Usernameを取得できず。秘密情報の追加・保護設定変更はしない。認証済みGitHub接続で同じ親履歴・同じファイルtreeの通常commitを作成し、expected SHA付きforce=falseで専用branchを更新する。API commitをfetchしてローカルを非破壊fast-forwardする。CLI push成功とは報告しない。
ローカルChromium141.0.7390.37起動可。Playwright1.56.1の既存正規runtimeを再使用。WebKitは共有library7件不足でBLOCKED。正式CIはubuntu24.04と公式playwright install --with-depsで別環境として扱う。
入力約269MB、開始空き約44GB/inode余裕あり、新証拠見込み600MB。案件専用tmp、旧証拠削除なし。
