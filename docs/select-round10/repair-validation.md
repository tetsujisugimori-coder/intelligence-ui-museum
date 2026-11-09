# Round 10 repair and validation protocol

Recorded 2026-11-10 JST. Issue #37, parent #28, Draft PR #38.

## Identity correction

Fresh WebKit DOM inspection at original HEAD `f4914a5ee45bcf886600e627509ddfcc6c917228` found one enabled, unchecked checkbox in `#Select .controls`. The SDK's `#official-select` is a visually hidden value input, **not** `input[type=hidden]`: its type attribute is absent, DOM type is text, `aria-hidden=true`, `tabindex=-1`, and its fixed SDK classes hide its geometry. Requiring type=hidden would introduce another target error.

The original snapshot queried `input:disabled` and therefore captured zero checkbox markers. The old string-only contract did not exercise snapshot's actual query. A separate clean original worktree and its original auditor reproduce exactly 30 marker-identity errors (runner exit 0, auditor exit 1) from the local 30-slot baseline. Two earlier launch attempts were NOT_TESTED due to missing system libraries; they are separate preserved directories and are not diagnostic trials. Extracted Debian libraries were placed in a new local browser cache, preserving the original cache; this local Debian environment is distinct from Ubuntu CI and Windows populations.

The repair uses one target definition for capture and intervention. Counts, distinctness, containment, input attributes/state, absent/empty/nonempty style, geometry, computed style, activeElement and focus-visible consistency are checked at every phase, including acquisition and final. Only the two target markers are normalized in the comparison HTML. Checkbox and value-input geometry/computed styles participate in equivalence, not just the trigger.

## Amendment before repaired trials

The five registered comparisons, two arms and three pairs remain unchanged. No product, SDK, dependency lock, old evidence or Stage 3 decision changes.

Every repaired trial uses a new context whose initial cookies and storage origins are recorded as empty. A common route allows only the newly started localhost server's exact origin; other requests are aborted and counted. This privacy instrumentation is identical in all arms. It can affect caching/network timing, so old/new runs are diagnostic infrastructure comparisons, not evidence that instrumentation is behaviorally neutral. No single-factor causal claim is made about the multi-operation prelude.

Development runs validate code while the checkout is dirty and are never represented as final-head acceptance. A final clean-head run is required; raw directories are never overwritten. Repeated validation does not add experimental arms or enter a pooled population.

## Fault controls and acceptance

`node --test tests/select-round10/contract.test.cjs tests/select-round10/privacy.test.cjs` checks positive synthetic evidence and rejects missing/duplicate/swapped elements, invalid attributes/styles, absent phase snapshots, inconsistent focus, duplicated comparisons, marker and pre-photo geometry/computed differences, changed pixel metrics, invalid PNG/ZIP bytes, exchanged valid traces, omitted manifest entries, absent/unrun steps, cleanup failures, and claimed/observed exit mismatches.

`node tests/select-round10/regression-proof.cjs` runs the **same** fixed synthetic counterexamples against the original and repaired auditor code, using the current positive fixture and unchanged mutation. RED means the original validator incorrectly accepted a fault; GREEN means the repaired validator rejects it. These are synthetic validation tests, never product trials. The original marker failure is separately shown by real browser evidence.

The auditor recomputes PNG differential metrics and classification; the independent reviewer implements its own pixel check. Trace titles bind a trace to its registered row, preventing valid traces from being silently exchanged. Manifest entries must cover every required image, trace and row JSON and match all local files. An observed runner process exit is mandatory (`ROUND10_RUNNER_EXIT`), separate from self-reported JSON exit.

The actual repaired-run report, source HEAD, hashes, CI OS populations and independent review must be attached to final coordination. This protocol alone is not PASS. Root cause remains UNKNOWN, Stage 3 remains HOLD, and the PR remains Draft without merge.

## Provenance correction before final run

Independent inspection found that 25 of the 30 local baseline traces attached runner source bytes edited after the original Node process started (Playwright reads source files during export). Preserve these files unchanged, but label this local baseline **mixed trace provenance** and exclude it from a complete baseline evidence claim. Its original in-memory runner and original auditor support the marker error diagnosis; the original Windows/Linux CI summaries separately establish the 30 errors. The development run also is not final evidence. The final clean-head run is therefore necessary, and all tracked source files must remain frozen until every trace is exported. Do not revise code or contract files during that run. Any required revision gets a new commit and separate full final run; do not silently overwrite or pool prior runs.
