# Select audit repair: final independent local review

Reviewed: 2026-11-07 18:23 JST. State: **CI_PENDING**. Working base HEAD: `8e52ebe049a74abf9f6a9f91f855a12488980f32`; final acceptance is tied to the file hashes below, not a future commit. Final commit/CI head/artifact association has not yet been independently checked.

## Decision and severity

Within the requested audit-repair scope, no remaining P1/P2 finding was identified after the final correction. The original defect is classified here as P2: failed or unverified diagnostic evidence could be accepted as COMPLETE/exit0. It is not a claim of product-code corruption, data loss, or general browser success.

The false-success cases reproduced by this reviewer are now rejected. Missing/failed/non-Boolean checks, duplicate/missing/out-of-order checks, row errors, unsupported console errors, status/exit contradictions, Select sentinel substring impostors, absent or malformed receipts, wrong callsites/nonces/times, missing or substituted paint evidence, and the tested malformed JSON types all fail closed with recorded reasons and a nonzero wrapper exit.

## Independent verification

1. Final submitted suite: **105/105 passed**, independently executed. This consists of 81 unit tests and 24 real-subprocess wrapper replay tests. Stdout, stderr and exit are preserved in this directory.
2. Independent 39-case matrix against the preceding second candidate: direct audit, VM wrapper, and a separately implemented **real-subprocess wrapper replay** all executed. The subprocess results were 37 INCOMPLETE/exit1 and two COMPLETE/exit0, with no missing result JSON. Accepted cases were the normal control and an empty original row.events array while the separate complete full trace remained intact; the latter is not treated as a failed product operation. Every other original review mutation was rejected. The replay deliberately rebinds HEAD/tree and per-invocation nonce; it is not a browser run or historical evidence of a new run.
3. Final three-line hardening delta was independently inspected. Ten final direct/real-subprocess regressions passed their expected outcomes: normal control accepted; Button failure, sentinel substring, incorrect callsite, receipt timestamp object, Select-start timestamp object, row-id object, check-name object, manifest-hash object and paint tampering all rejected with explicit reasons. All ten generated result JSON; no uncaught exception occurred.
4. Fresh independent **Chromium and WebKit** exact/legacy 375/light/100 browser runs, one each, completed on the second candidate. Both preserve original child exit1/product suite FAIL; the diagnostic wrapper alone reports COMPLETE/exit0, with traceValid true and explicit NOT_TESTED for the disabled Select force-click and subsequent Select assertions. Valid Node receipts and PNGs are preserved. The final delta changes only malformed-input guards; the final candidate was verified through the tests above rather than claiming the earlier live evidence used the final audit hash.
5. The original runner hash remains `a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1`. Reviewer performed no product, SDK, lock, historical evidence, merge or publication changes, and no force click or fixed sleep.

## Why the policy stop is now distinguishable

The accepted exception requires the exact Select error, a false Boolean Select result, and a Node-side receipt emitted before dispatch. The receipt must match the per-run token, expected page, exact selector/options, executed source hash and independently derived source callsite range. Its timestamp must be within the Select check's start/finish interval. Earlier Select paint must use the exact expected filenames, valid PNG content and geometry; the original pixel oracle is recomputed and compared. Earlier and subsequent required checks remain independently checked. A policy stop does not turn the original product suite into PASS and does not claim that the blocked action or later Select assertions ran.

The manifest checks evidence integrity consistency; it is not cryptographic authentication of an arbitrarily forged complete bundle. The old evidence lacking the new receipt was not retroactively blessed or rewritten.

## Residual P3 / limits

- Trace validation remains a collection-presence check rather than a complete schema/provenance proof. For example, the isolated `traceAudit` accepts `{level:'none', final:true}`. This was already present and is recorded as P3 hardening outside the corrected outcome/policy-stop gate; it must not be described as independent product acceptance.
- No independent Windows execution or 20-repeat/full-condition matrix was performed. Local WebKit used the provided existing browser cache, local library path and disabled Playwright host-discovery validation; actual browser execution was observed. This does not substitute for Windows or the CI matrix.
- Known Windows direct-focus FAIL and the older offscreen UNKNOWN are separate findings and remain unchanged. This repair does not clear Stage 3 HOLD.
- **CI_PENDING:** commit/head/tree, remote workflow result and downloaded CI artifact binding still require later independent verification. No CI or remote-publication success is claimed here.

## Reviewed final source hashes

- third-audit.cjs: `269b09f92763363804ae510539b756bd27e10b202a9476a6c97ddb7c48c56bee`
- third-run.cjs: `6b3f3f4efa528bb2bfc60baffdfebd8b06d4d8e8df82917eb0e3e28a75fd64b5`
- third-preload.cjs: `52bd780be9f84ae1a115feee5d87ff28b2e3bdfdd181777825e0844b8aa475e1`
- third-probe.cjs: `369518347154e8e3fc28e183a4472a77ab0a7c4e2f797689b258e09ce8545d02`

Full test/source hashes are in `reviewed-code-hashes.json`.

## Evidence locations

- Final delta, 105 submitted tests, ten independent final direct/subprocess regressions: this directory.
- Fresh independent Chromium/WebKit runs and 39-case direct/VM/subprocess outcomes: `.work/audit-review-repair2-20261107/`.
- Earlier candidate and original baseline findings remain preserved in their separate review directories. New results do not overwrite them.
