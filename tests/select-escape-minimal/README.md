# Select Escape cancellation: isolated model fixture (Issue #30)

**Scope: MODEL_ONLY_NOT_SDK_CAUSAL.** This fixture uses a real browser keyboard event and focus behavior, but **does not load Radix or Apps SDK UI**. The fallback branch is an explicitly labeled *model*, not an assertion about Radix implementation. A positive result proves only that this **model** can be configured for a cancel/no-cancel comparison with its close path held constant.

## What is tested

- controlled-cancel vs controlled-plain: same HTML/JS/CSS, same \`select-controlled\` close request, same MutationObserver focus-return; the single intended difference is whether the keyboard Escape handler calls \`preventDefault()\`.
- delegated-fallback: model substitute dismissal that also cancels Escape. It is deliberately NOT accepted as a controlled counterpart.
- delegated-open: negative control where there is neither an explicit close nor a fallback; it stays open.
- hook-cancel: separate hook-mode model that cancels and closes; never conflated with the controlled Select pair.
- Chromium/WebKit, direct focus and native Tab, repeated fresh pages in one browser. The browser's real \`keyboard.press('Escape')\` event is used.

## Evidence and boundaries

Raw per-trial JSON, focused button PNG, SHA256 manifest, runner plan, source digests, and comparison decisions are saved in a *fresh* \`.work/escape-minimal\` directory. Rows that have no genuine Escape event, complete transition, correct close owner, or independent rendered-state match are rejected. Unit tests exercise false classification scenarios. The CI artifact contains raw evidence; the audit rederives its planned grid and hashes.

To execute in a prepared checkout:

1. \`cd tools/stage-a-browser && npm ci --ignore-scripts && npx playwright install chromium webkit\`
2. From repository root: \`node --test tests/select-escape-minimal/classify.test.cjs\`
3. \`MINIMAL_ENGINE=webkit MINIMAL_REPEATS=2 node tests/select-escape-minimal/run.cjs\`
4. \`MINIMAL_ENGINE=webkit MINIMAL_REPEATS=2 node tests/select-escape-minimal/audit.cjs .work/escape-minimal\`

Linux, Windows, browser installation and isolated work environments follow normal Actions runner policies. Do not overwrite an existing output directory.

## Non-claims / next gate

This model does not reproduce real Radix fallback, SDK callback routing, or the Museum's \`select-focus-return.ts\` implementation. It does not establish the cause of WebKit direct focus outline failures or historical persistent offscreen clicks; those remain **UNKNOWN** in Issue #28. The next step, under a separate reviewed change, is to run a parity experiment against **unaltered** official SDK and its actual Radix callsites and prove that the close/focus path is unchanged when cancellation differs. If parity cannot be shown, classification remains UNKNOWN.

PR #23/#29 stay Draft/merge NO. Stage 3 HOLD and the ban on product/official SDK edits are unchanged.
