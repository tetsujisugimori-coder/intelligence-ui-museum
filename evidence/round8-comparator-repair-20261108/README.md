# Stage 2 comparator observation and close-path contract repair

2026-11-08 JST. Refs #32, PR #33 review 5817801013. Old fixed HEAD: `0410dd4e3f51a94667a4ccacd4c0975d877885b8`.

## Outcome presence versus equality

`result.focusVisible` must be an own boolean property. true/false differences, PNG hash differences and outline pixel-count differences remain valid experimental outcomes. Missing/null/undefined/invalid types reject even on both sides. Missing or malformed PNG hashes also reject; the archive audit independently checks the actual PNG file and decoded pixels. The instrumentation, official SDK, copied product source, lockfile, input sequence and fixed plan are unchanged.

## Structural close path versus raw stack text

The stable identity is `(source, kind)` recorded by the existing, pinned Vite transform at specific source anchors. Source paths distinguish Select, useEscCloseStack, Radix dismissable-layer and Museum focus return. Owner attribution is trace evidence, not a claim that an arbitrary editable log authenticates execution; source/build provenance and the external archive digest remain required.

- Caller / close owner: Select's `useEscCloseStack` callback records `esc-stack-close`, immediately followed by `react-close-request(nextState=false)` from shared `handleOpenChange`. No competing `radix-on-open-change(false)` is allowed. A source-tagged marker is not interchangeable with a raw stack label.
- Callsite order: trusted Escape keydown, Radix Escape, Select before/after, fallback gate, SDK stack before/after, Select callback, React close request. Existing per-row source checks remain mandatory.
- React observation: exactly one closed `react-layout-after-commit` after the request and before DOM/Museum observation. This is layout-effect observation after commit, not React's exact internal commit timestamp. A later reopen request/layout cannot be hidden by a contradictory final snapshot.
- DOM/focus: after close, Museum MutationObserver precedes Museum focus call, which precedes actual focusin of the recorded trigger and Escape keyup. Final DOM observation must be popup absent / aria-expanded false; final focusin and keyup active element must agree with the final focused trigger. Extra unchanged observer notifications are allowed.
- Cancellation: exactly one Select call in paired-cancel, none in paired-plain; native additionally has one esc-stack call. Owner, location between before/after markers, defaultPrevented transition and counts are checked.
- Raw `Error.stack`: retained diagnostic context only. Hostnames, minified symbols, line/column offsets and equivalent text formatting are not equality conditions. The review's stack-only rewrite remains accepted before and after repair and does not prove a real path change. It is a contract clarification, not assigned the same severity as the verified missing-value false acceptance.

Both runner and audit call the same row validator/comparator. A pilot-stopped run is retained as diagnostic evidence but now exits 1 and cannot pass acceptance audit with formal trials NOT_RUN. No trial-count reduction is used to obtain success.

## Counterexamples and independent feedback

The preserved corpus contains 19 identical JSON pair inputs with old/new source SHA256, input SHA256, stdout and process exit codes. Missing focusVisible: old COMPARABLE_WITH_COMMON_INTERVENTIONS / [] / exit 0; new NOT_COMPARABLE / focus-visible-observation / exit 1. Null, invalid types, missing A or B likewise reject. Valid boolean and PNG/pixel differences remain accepted. Stack-only change stays accepted. Matching alternate close owner, missing actual focusin and duplicate closed-commit observation change from old accept to new reject. Existing incorrect callsite, incomplete and error-bearing rows continue to reject.

Independent pre-submit probes additionally exposed reopening after focus, contradictory keyup active element and contradictory final DOM state. These are rejected, with fixed-input probes retained by the independent reviewer. A duplicate unchanged MutationObserver notification remains a valid control.

Reproduction in the bundle uses `node evidence/compare-case.cjs evidence/old-source/pr33/compare.cjs evidence/cases/pr33/missing-both.json` and the identical input with `pr33/tests/sdk-parity/compare.cjs`. Classification acceptance maps to process exit 0, rejection to exit 1. Unit tests cover undefined/inherited fields that JSON cannot encode.

41 Node tests pass. All historical 348 raw rows satisfy the strengthened validator without altering them. Local three-mode build succeeds from fresh prepare and lock-based offline npm ci. New final browser results, exact-HEAD CI and independent archive review are separate gates; pending at submission, not inferred from an earlier local run. Local WebKit is environment-blocked by missing shared libraries. Windows local execution, real Safari, physical input and VoiceOver are NOT_TESTED.

## Evidence and causal boundaries

The historical 348 JSON/PNG, three original ZIP/API digests, original independent calculations, prior final five workflows and failed old fresh-prepare records remain unchanged. New runs have separate paths and denominators. Source-hash mismatches during development remain failures, never relabeled successful final runs.

Scope is COMMON_INTERVENTION_SDK_ONLY. The keyboard-open route is unchanged and is not the old click-open route. No new alternate-route experiment is mixed into the 348 trials. Old outline and offscreen product causes remain UNKNOWN. PR31/33 remain Draft and unmerged; PR29/23 acceptance unchanged; Stage 3 HOLD remains.
