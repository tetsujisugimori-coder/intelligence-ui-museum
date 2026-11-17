# 第10便の提出・容量境界
2026-11-17 JST。main/PR65 GitHub実物照合済み。Public repo。権限APIはadmin/maintain/push/pull/triage=true。設定変更はしない。

既存workflowは21本。通常feature branch push単独のon.push該当はなく、PR作成・更新はCI、button、tooltip、select-return、v11 wave1〜9の13 workflowを起動する。wave10を加えて14 workflow想定。旧select診断7本とSDK parityは該当path外、dispatchしない。各workflowは既存範囲のブラウザ回帰。今回ユーザーは正式ブラウザ・旧回帰・新workflowを明示承認している。push安全性調査は起動を無条件禁止する別案件と混同しない。新workflowもPR起動のみでsource-onlyを含める。

旧workflowファイル/timeoutは変更しない。旧検査器は全展示数150→153、wave10.js/cssの配信closure追加だけを追随。登録数減少や既存操作/期待値の削除はしない。歴史HEADを検査する動的closureはwave10存在時だけ追加する。

容量：専用新clone約272MB、開始時空き17GB、inode空き約403万。共有/tmpへの大量出力なし、案件.workに限定。証拠旧原票は削除/移動しない。容量方針の独立した原文の所在は未確認であり、AGENTS・本人指示の既知制約を適用。原ZIPは専用正式分を優先し、不足時は新しいダウンロードを止める。GitHubの将来保持期限・Library ACLの独立管理確認はUNKNOWN。

外部App/Webhookの全数は未確認。今回許可された通常PR/CI以外の設定変更・dispatch・手動retry・公開・mergeは行わない。
