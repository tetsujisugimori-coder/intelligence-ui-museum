# Select Escape cancellation: isolated model fixture (Issue #30)

**Scope: MODEL_ONLY_NOT_SDK_CAUSAL.** This fixture uses a real browser keyboard event and focus behavior, but **does not load Radix or Apps SDK UI**. The fallback branch is an explicitly labeled *model*, not an assertion about Radix implementation. A positive result proves only that this **model** can be configured for a cancel/no-cancel comparison with its close path held constant.

## What is tested

- controlled-cancel vs controlled-plain: same HTML/JS/CSS, same \`select-controlled\` close request, same MutationObserver focus-return; the single intended difference is whether the keyboard Escape handler calls \`preventDefault()\`.
- delegated-fallback: model substitute dismissal that also cancels Escape. It is deliberately NOT accepted as a controlled counterpart.
- delegated-open: negative control where there is neither an explicit close nor a fallback; it stays open.
- hook-cancel: separate hook-mode model that cancels and closes; never conflated with the controlled Select pair.
- Chromium/WebKit, direct focus and native Tab, repeated fresh pages in one browser. The browser's real \`keyboard.press('Escape')\` event is used.

## Evidence and boundaries

Raw per-trial JSON, focused button PNG, SHA256 manifest, runner plan, source digests, and comparison decisions are saved in a *fresh* \`.work/escape-minimal\` directory. Rows that have no genuine Escape event, complete transition, or correct close owner are rejected. Focus-visible and the cropped focus-ring PNG (16px margin outside the trigger) are **measured outcomes** and MAY differ between cancel/plain; rejecting such a difference as a confound would erase the effect being tested. Invariants are input method, event skeleton, close owner/request, value, focus-return mechanism, and source/config. Unit tests exercise false classification scenarios. The CI artifact contains raw evidence; the audit rederives its planned grid and hashes.

To execute in a prepared checkout:

1. \`cd tools/stage-a-browser && npm ci --ignore-scripts && npx playwright install chromium webkit\`
2. From repository root: \`node --test tests/select-escape-minimal/classify.test.cjs\`
3. \`MINIMAL_ENGINE=webkit MINIMAL_REPEATS=2 node tests/select-escape-minimal/run.cjs\`
4. \`MINIMAL_ENGINE=webkit MINIMAL_REPEATS=2 node tests/select-escape-minimal/audit.cjs .work/escape-minimal\`

Linux, Windows, browser installation and isolated work environments follow normal Actions runner policies. Do not overwrite an existing output directory.

## Non-claims / next gate

This model does not reproduce real Radix fallback, SDK callback routing, or the Museum's \`select-focus-return.ts\` implementation. It does not establish the cause of WebKit direct focus outline failures or historical persistent offscreen clicks; those remain **UNKNOWN** in Issue #28. The next step, under a separate reviewed change, is to run a parity experiment against **unaltered** official SDK and its actual Radix callsites and prove that the close/focus path is unchanged when cancellation differs. If parity cannot be shown, classification remains UNKNOWN.

PR #23/#29 stay Draft/merge NO. Stage 3 HOLD and the ban on product/official SDK edits are unchanged.

## Round 8 evidence-contract repair

The original fixed commit c65eea3 and its Actions ZIPs remain historical evidence. Before decoding an original ZIP, verify its SHA256 against the authenticated GitHub artifact API digest with `node tests/select-escape-minimal/verify-archive.cjs ZIP sha256:DIGEST`. An internal manifest is not an authenticity signature: replacing both an image and every local digest can evade internal consistency checks. This external check is required, not replaced by `audit.cjs`.

The repaired validator independently checks each trace's cancellation, closure source, counters, trusted key order, sequence, and focus return. Matching corruption on both sides cannot establish equivalence. PNG filenames bind to trial IDs, dimensions and inflated scanlines are checked; focus-visible and PNG differences remain outcomes, never equality prerequisites. PNG equality does not prove equal physical rendering.

`MINIMAL_SOURCE_DIR` permits re-auditing historical unchanged artifacts against a separately obtained, commit-pinned source snapshot. It is not permission to silently rewrite recorded source hashes. Explicit instrumentation is `fixture-events-v1`; absent instrumentation in the original artifact means the fixed original fixture, not verified instrumentation neutrality. Changes to instrumentation are rejected. Historical CI has shell-step success but no separate numeric exit-code sidecar, so that limitation remains.

## Focus observation presence (additional review 5817800901)

Both boolean values are valid, but `snapshot.focusVisible` must be an own boolean property on every complete row. Missing/null/invalid values are rejected; A/B boolean and PNG differences remain outcomes. Missing trials return NOT_COMPARABLE so interrupted runs can preserve their failure report. See `evidence/round8-comparator-repair-20261108/README.md` for the new, separate same-input RED/GREEN evidence and unchanged historical boundaries.
