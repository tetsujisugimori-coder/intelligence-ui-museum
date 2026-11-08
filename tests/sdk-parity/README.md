# Round 8: real SDK under explicit common interventions

2026-11-08 JST. Issue #32, related #28/#30 and PR #31/#29/#23. Stage 1 independent audit gate completed at PR31 HEAD1c24c3ed5c36235526641cd1bc5ae25599c7d094, review5817437179 and CI completion review5817468989. This separate branch does not modify that PR.

## Scope and causal limits

Real @openai/apps-sdk-ui 0.2.2 and its lock-pinned real Radix Popover/dismissable-layer are loaded. Select imports Radix's Popover, not the SDK's separate custom Popover component. The Museum focus-return function is copied byte-for-byte. No official package file, product code or lockfile is written by the transform: all intervention occurs in an isolated Vite build.

Two shared background interventions apply to BOTH paired A/B conditions:
1. Skip only useEscCloseStack's preventDefault, retain its original callback and closure.
2. Suppress the Radix Escape fallback gate, retain invocation of Select's Escape handler.

A paired-cancel and B paired-plain then differ ONLY in Select's preventDefault call. This is a single differential factor **within this shared-intervention system**, not a single-factor experiment against unmodified SDK behavior. It cannot establish the necessary/sufficient root cause of the unmodified SDK or old offscreen failure. Those remain UNKNOWN. The native condition follows original cancellation/fallback behavior in transformed code and is NOT described as an untouched package execution.

Explicitly retaining closure while preventing the alternate fallback is the reason for these common interventions. A matching result in this artificial background is evidence for an experimentally controlled mechanism, not a product defect diagnosis or permission to ship these modifications.

## Measurement and pilot gate

Three separate builds: none has no event observers, callsite logs or added layout effect; minimal has common browser-event/DOM observation; detail adds source-tagged callsites/stacks and a layout-effect observation after React commit. That layout effect is NOT the exact React internal commit timestamp. Source original/transformed bytes and hashes are retained; generated JS/CSS/maps are retained in every raw artifact. Callsite attribution uses explicit transformed source provenance and recorded runtime stack, not matching function names. No Event.prototype replacement, RPC instrumentation or arbitrary sleeps are used.

Fixed plan.json: each engine runs 36 pilots (2 fresh pages × 3 conditions × 2 routes × 3 measurements), native plus alternating A/B order, new browser per measurement. UI state and outline-pixel estimator must agree across all three modes; minimal/detail common event order must agree. none's internal events are NOT_OBSERVABLE. Only if all detailed comparisons and the neutrality gate pass, expand to 20 fresh pages per paired condition and input route in a new browser, alternating A/B (80 formal trials). If comparison fails, do not increase repetitions. No trial is discarded. Confidence from repeated pages is limited by shared engine/build/browser; no independence or population-effect claim.

Screenshot hash and DOM focus-visible remain separate outputs. The orange outer-margin pixel counter is an explicitly heuristic measurement, not a complete rendered-outline oracle. Raw PNGs permit independent pixel inspection. Formal outcome frequencies are descriptive, not an unqualified causal conclusion.

## Reproduction

From repo root:

1. node tests/sdk-parity/prepare.cjs
2. npm --prefix .work/sdk-parity ci --ignore-scripts --no-audit --no-fund
3. Install the existing tools/stage-a-browser lock and Playwright engine dependencies.
4. In .work/sdk-parity, build each none/minimal/detail using VITE_MEASURE=MODE node node_modules/vite/bin/vite.js build --config vite.config.mjs.
5. node --test tests/sdk-parity/compare.test.cjs
6. SDK_ENGINE=chromium SDK_OUT=.work/sdk-evidence/raw node tests/sdk-parity/run.cjs
7. node tests/sdk-parity/audit.cjs .work/sdk-evidence/raw

The workflow captures numeric runner/audit exit codes outside the raw manifest and checks product original hashes. Download original CI ZIPs and verify authenticated artifact API digest before trusting their internal manifest. Missing/failed/partial trials are never PASS. Plan/identity/source/build assets/row/PNG binding and equivalence are rederived by audit. Changing both local evidence and all hashes is outside internal manifest authenticity; the external ZIP digest is the boundary.

## Current status at submission

Implementation checks: 22 comparator tests PASS; current local Chromium116 rows (36pilot+80formal) and40 formal contrasts passed, with no observed UI/common-event neutrality difference. These are implementer results, not final remote CI or independent acceptance. Local WebKit lacks required shared libraries; Windows local execution NOT_TESTED. The CI matrix targets WindowsWebKit/LinuxWebKit/LinuxChromium. Final CI and independent artifacts/review are required before final acceptance.

PR31/29/23 remain Draft. No merge, no publication, Stage3 HOLD. Real Safari, physical input, VoiceOver NOT_TESTED. Official SDK necessity/sufficiency and old persistent offscreen root cause UNKNOWN.
