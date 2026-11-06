# Issue #28 third diagnosis

2026-11-07 JST. Investigation only. Draft #29 / Stage 3 HOLD retained; cause UNKNOWN, #23 not accepted.

## Fixed provenance

Original PR23 runner: ea6f19acfd60b37e9b147daa92e79838fd2f3070, scripts/s3-reaccept/browser.cjs, SHA256 a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1. `original-browser.cjs` is byte-identical. Historical Windows integrated 20-run derivative retrieved from previously preserved independent raw ZIP: SHA256 94d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1, saved separately without rewriting it.

Independent examination of old raw evidence found the failed condition was **375x1000, light, root100%**, not dark/root200 used by round1/2. This is an experimental mismatch, not proof of defect cause. Original failure coordinates remain scrollY3555, trigger.top−658, option.top−583, popup.top−621. Old counts are not new trials.

## Lanes

- original: byte-identical full16 original runner, no browser-side added instrumentation.
- events: identical runner + timestamp/target/activeElement/scroll event records, no geometry reads or rAF/MutationObserver in events. Listener installation itself is an intervention.
- historical: byte-identical previously saved Windows20 diagnostic with its existing rAF/events.
- exact: original prefix/check/ring/PNG code retained, condition narrowed to375/light100; full timeline probe. No additional awaits are inserted into Space→ordinary click. Three focus routes; Tab lane starts by explicit focus of preceding checkbox and is not pure keyboard navigation from document start.
- minimal: same original prefix and375/light100, original Select event listeners removed; no new browser hooks. Existing opener assignment, awaits and original prelude PNG remain.

Original runner includes a later force-click on the disabled control. Current request forbids force click, so a Node-side guard rejects that call with THIRD_POLICY_FORCED_CLICK_NOT_TESTED in every lane. This is a disclosed partial execution, not an unmodified full-suite PASS. It occurs after mouse selection, keyboard selection, Escape and ring checks; those preceding checks can be distinguished from the forbidden trailing disabled test. Original suite exit1 is preserved. Diagnostic COMPLETE means all expected records exist, not product PASS.

## Fail-closed controls

Audit rejects missing/duplicate/wrong condition IDs, missing checks, source/HEAD/tree/runner mismatch, pageerror, missing JSON, launch failure and subprocess signal/error/exit>1. All raw subprocess exits are preserved. Existing diagnostic now rejects collectError and missing error arrays, following independent negative control. No product/SDK/dependency/lock changes.

## Environment limits

User Windows computer reported offline at start. Fresh Linux build succeeded with pinned lock. Initial npm cache and browser-path setup failures are separate environment errors. WebKit local launch lacks shared libraries and is NOT_TESTED; Windows Actions execution is requested in the workflow and not assumed successful. Playwright WebKit is not Safari.

## Preflight findings and corrections

Independent review found the legacy verdict accepted collectError. The new audit initially accepted an events-only object as a full trace even with no rAF/final state. Both synthetic RED counterexamples are preserved; corrected validators reject them. A local live full-probe run then exposed an init-time null documentElement error before DOM creation. Observing document instead fixes this instrumentation bug; the failing run had pageerror and INCOMPLETE, not a product failure. Corrected local Linux WebKit smoke reached all normal Select paths before the explicit disabled force-click policy stop. These preliminary runs are not final-HEAD Windows evidence.
