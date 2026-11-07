# Issue #28 fourth diagnostic plan

2026-11-07 JST. Investigation only; old cause UNKNOWN, #29/#23 merge NO,
Stage 3 HOLD. Prior e04578c/tree3817a2e and all prior failures remain immutable.

## Fixed comparison and intentional differences

Original runner ea6f19a SHA256 a2dab597ff18fb5708a5b12d0b1628b59a50d29774aa18c7dd59b114edb30bf1.
Historical integrated20 derivative SHA25694d6111fb59f4c7b192dc20759d1dbad63913efc084f4f8678236f229adb1ee1.
Old integrated2/20 and oldmain1/20 are independent historical observations, not
new failures. Condition375x1000/light/root100%, WebKit26, Windows.

New derivative uses the original prefix byte-for-byte, including layout
scrolls, Button ring4PNG, Badge/Alert PNG, Switch operations, frames and
normal Select click/keyboard/Escape/ring checks. Identical generated runner
for measurement none/events/full. One fresh browser for each series with20
fresh page/context calls, matching the historical derivative lifecycle.
Third-round exact used20 separate browsers and is not the same experiment.
None means no EXTRA browser hooks; original runner has its own listeners and
screenshots. It is not literally zero measurement. Final extra PNG occurs
after original checks and does not precede the failing click.

Primary WindowsWebKit: none/legacy20, events/legacy20, full/legacy20,
full/direct20, full/pureTab20. LinuxWebKit and LinuxChromium: the same5series.
Original legacy focus→Tab→ShiftTab unchanged. Direct only locator.focus.
PureTab verifies the currently focused preceding Switch checkbox left by
original prefix, then keyboard Shift+Tab backward to Select and its preceding checkbox,
then a final actual Tab to the trigger. It never calls focus on this route. This is not Tab navigation from document start.
Full probe includes trusted input coordinates and hit tests, activeElement,
focus-visible, geometry, scroll, viewport, DOM changes and rAF. Minimal events
omit geometry/rAF. Compare series independently without claiming timing
causality from non-reproduction or limited20samples.

The original disabled force-click is intercepted before dispatch, with a
nonce/hash/callsite receipt. Its original FAIL/exit1 and subsequent Select
NOT_TESTED stay intact. Prior strict audit is reused without relaxation.
Direct outline FAIL is retained; full probe does not redefine focus-visible.
Negative controls cover persistent offscreen, lost focus, outline missing/
clipped,pageerror, incomplete trace, failed mandatory checks, child exit and
hash contradictions. No product/SDK/lock edits, arbitrary sleep, or forceclick.

Windows hosted CI is not an independent physical Windows machine. Physical
Safari, touch, VoiceOver NOT_TESTED. OS/browser/Node, sourceHEAD/tree/hash,
trial denominators and diagnosticCOMPLETE vs productPASS remain separate.

## Preflight observations, kept separately

Initial local host validation could not locate GLES despite a resolvable private
library path. Local browser launch uses the already installed pinned browser,
private LD_LIBRARY_PATH and skips only Playwright's host-package check. This
is not an assertion that host packages are globally installed.

PureTab initially went forward from Switch although Select is earlier in DOM;
it failed its bounded navigation assertion. Corrected route uses keyboard-only
reverse navigation to Select, then preceding checkbox→Tab. Old smoke retained.
The SDK consumes pointerup and unmounts the option before a click event can
bubble. Actual option pointerup with client coordinates/hit test is therefore
required, not a nonexistent post-unmount option click. A new end-of-test
screenshot originally ran during page.close AFTER original console classification
and caused late font-CSP messages to be counted as unexpected. It now runs before
final collection/classification. Same-origin frame CSP events are also collected
at this final stage, without loosening exact font URL/directive validation.
These are fourth-round diagnostic preflight defects, not explanations of the old
Windows offscreen failure. Failed runs are retained under fourth-smoke and never
included as final-head successes.
