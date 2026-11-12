# Issue 28 third diagnosis: independent initial review

Reviewed baseline PR29 d320cd246633420d48776d450a3e4d0f9fcd52ed. Original source compared: PR23 branch commit ea6f19ac, scripts/s3-reaccept/browser.cjs. Review is code reading and isolated validator mutation, not proof of original Windows reproduction.

## Exact-order divergences

1. Original page.goto uses default load, brings page to front, waits for Button and document.fonts.ready, checks document focus/visibility/font/theme. New diagnostic waits domcontentloaded, Select visible and only prelude fonts.ready, does not validate document.hasFocus, visibility, computed root font or theme.
2. Original layout scrolls every component and measures all text/control geometry. Approximate prelude only scrolls stage containers.
3. Original Button reads output, runs ring(): scrollIntoViewIfNeeded, data attribute, animation completion, geometry/style query, four clipped PNG captures with animations disabled and temporary focus CSS suppression. Prelude replaces ring with one scroll and omits most assertion reads and disabled synthetic clicks.
4. Original Badge queries output and visibility, scrolls then captures PNG. Prelude only selectOption and scroll.
5. Original Alert waits mounted, reads color, toggles, waits hidden/output, toggles, waits visible/output, queries clipping, scrolls, captures PNG. Prelude omits waits/reads/screenshots.
6. Original Switch checks aria/output, disabled status, synthetic disabled click, unchanged state. Prelude omits those reads and synthetic click.
7. Original Select installs event listeners, focus -> Tab -> Shift+Tab -> activeElement assertion -> Space -> immediate ordinary locator.click with 5000ms default timeout. New diagnostic installs much heavier probe, records start, records focus, Space then records state, waits option attached, records mounted, records beforeClick, then ordinary locator.click with 2400ms timeout. Rapid lane is not minimal instrumentation.
8. Original Select proceeds with value/focus return, two rAFs, keyboard re-open/ArrowUp/Enter, Escape, ring images, disabled interaction. Diagnostic only first click and return. The original disabled Select check contains force:true. This is AFTER the target first-click failure and must not be used to justify forced normal selection. Third-round prohibition and unmodified-original condition require explicitly documenting this historical line rather than silently describing the runner as force-free.
9. New tab route begins with direct locator.focus on preceding checkbox. It is real Tab delivery from a synthetic anchor, not full native navigation from page entry.
10. Original implicit colorScheme differs from diagnostic explicit dark colorScheme, notwithstanding URL data-theme. Keep context options identical for strict comparison.

## Measurement gaps

Current probe lacks document.hasFocus, visualViewport width/height/scale, recorded scrollIntoView calls, rAF-by-rAF series, explicit popup mount/unmount identity, node identity beyond descriptors, runner hash, build hash. Mutation observer emits selected records but is not equivalent to explicit lifecycle records. Its option lookup selects by substring text globally.

## Validator counterexample

oracle-probe.cjs evaluates the exact baseline verdict function without loading application or changing product. A valid-shaped row augmented with collectError returns no reasons. Code path can set collectError when final take fails while later collect succeeds; prior mandatory state snapshots remain. This violates the requested fail-closed measurement rule. Missing pageerrors and structurally empty snapshots also pass verdict. These are validator counterexamples, NOT observed product or Windows faults. screenshotError omission is not elevated independently: baseline records screenshotError only for an already-failed trial.

## Causal position

UNKNOWN. Missing PNG/style/query operations can alter scroll settling and rendering timing, and added roundtrips can erase a race. No present evidence uniquely attributes original fault to product, WebKit, or direct focus. Native Windows desktop is reported offline by parent; independent Windows execution NOT_TESTED so far. Do not count existing successful Linux or CI runs as new independent Windows reproduction.

## Historical evidence checked after initial comparison

Retrieved the preserved Git evidence ZIP, rather than relying on report prose. Outer ZIP SHA256 7f35d90d0be607c6d8d6a32be03c2372dda406ade94be7f0d81e43361cc77c97, 497 entries, CRC valid. Nested integrated Windows ZIP (830 entries) and baseline ZIP (232 entries) CRC valid; all referenced nested manifest hashes checked with no mismatches or missing files. Counts in old-evidence-verification.json include overlapping manifests and must not be added as unique file counts.

CRITICAL experimental mismatch: original failed condition was 375×1000, LIGHT, root100%, whereas round1/2 new diagnostic hard-codes DARK, root200%. Thus their success cannot be interpreted as matched non-reproduction.

The 2/20 and 1/20 observations came from saved derived 20-trial diagnostic runners, not byte-identical original runner execution. Derived scripts preserve original prefix and Select action sequence, add init-time geometry/event/rAF recording and final/failed collection, and narrow matrix to light100. Both declare sourceRunnerHash a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1, identical to PR23 source. Integrated diagnostic runner SHA256 94d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1; baseline runner e14501ab84be3c8c73848e856696cbed2ec528107ac6f52965c5410a5d57303d.

Original failed IDs: integrated fresh9/fresh14, baseline fresh2. Historical focusin→Space intervals 10/12/11 ms; return focus→Space 6/7/6 ms. In all three, scrollY3555 and trigger.top=-658 already held before Select focus and through Space. Popup focus follows 4–5ms later, still offscreen. This supports investigating focus-scroll/frame ordering but does not establish A/B causality.

## New independent browser smoke

9/9 Chromium141.0.7390.37 trials passed: tab/direct/legacy ×3, 375×1000/light/root100. Playwright1.56.1 explicitly loaded from repository browser tools. Isolated existing build, fresh page each. Actual Playwright keyboard/click, not physical keyboard. Preceding Switch checkbox actions only, not exact original prefix; per-step measurement roundtrips affect timing. All activeElement/value assertions satisfied. This is new independent focused smoke, not reproduction proof or full acceptance.

WebKit2215 launch failed before any trial because host lacks libgtk-4, graphene, woff2dec, harfbuzz-icu, hyphen, manette, GLESv2. Nine planned cases NOT_TESTED, not product FAIL. Script overall exit1 preserves incomplete matrix. Native Windows remains NOT_TESTED by this reviewer.

## Early third-run review (uncommitted, not final review)

Require non-null valid child exit, no signal, no spawn error. Current complete predicate ignores these, allowing a process crash after evidence writes to become wrapper exit0. Accept only documented original-suite exit1 due to policy-refused disabled-force check; unrelated exit codes must stop. Require unique exact expected condition IDs. Events lane currently reads geometry/style/hit-test on every event and uses MutationObserver, heavier than timestamp/id-only passive event recording; classify interventions accurately.
