# Select / keyboard / focus independent review

## Result
PARTIAL. Source and supplied evidence support the Select TriggerView change and narrow Button focus-padding repair. No new P1/P2 product defect was established. The 2 previously unconfirmed focus conditions remain UNVERIFIED; no new browser condition ran successfully in this review.

## Directly inspected
- `src/main.tsx:20–23`: stable module-scope `DisplayModeTrigger` returns visually hidden field prefix and the supplied current label; no fixed aria-label masking the selected label.
- `src/main.tsx:29`: official Select receives TriggerView, a/b labels, `value`, `onChange`, disabled option c. This statically supports visible label and internal value synchronization, not an empirical runtime guarantee.
- `src/main.css:8–10`: max400 general pane padding8 overridden only for Button horizontal padding6. No official package style editing observed in these lines.
- Supplied `button-focus-fixed-visible.jpg` visually inspected: orange outline remains identifiable around the entire visible button in a narrow classic-scrollbar iframe. This is historical supplied evidence, not a current screenshot.

## Supplied evidence recalculated
`cua-final-matrix.json` has 16 unique width/theme/root-size conditions. All16 have listAX=1/cardAX=1, value a→b, and document scrollWidth<=clientWidth before/after. Active+visible Button focus14/16 only. Two exceptions are320darkroot200 and1280lightroot100 (both active=false, visible=false). No inference that these are product failures; insufficient evidence of focus acquisition versus browser/tool failure.
`keyboard.json` supports one representative1280darkroot200 Space→Up→Return b→a case, closed state, AX match1 and buttoncount3; it does not establish the whole keyboard matrix.
`focus-active.json` (prior8px) and `focus-fixed.json` (6px) both show active/focus-visible, orange3px outline+4pxoffset. Recorded right-edge clipping1.546875px becomes positive clearance0.453125px, exactly a2px improvement. `focus-before.json` itself is not active, so do not use that alone as active-outline before evidence. Partial outline clipping alone is not proof that the focused component is entirely hidden or that WCAG2.4.11 fails.

## Current execution attempt / environment blocker
Prepared isolated `browser-work` copy from `package/source`; no original changed. Prepared independent `results/browser/verify.cjs` for16 Chromium conditions, a/b accessible snapshot/value checks, representative keyboard flow, all horizontal clip ancestors/text rectangles, two priority focus cases and diagnostic prior-padding overlay. This script is NOT validated and is not a test result.
1. Existing `/usr/bin/chromium` with preinstalled runtime Playwright, normal sandbox: browser launch aborted, `process_singleton_posix.cc:297 ... socket() failed: Operation not permitted (1)`, SIGABRT. No page loaded.
2. One formal require_escalated request solely for local socket/browser execution: environment startup failed with `bwrap: Can't create file at /home/agent/.codex/sessions: Read-only file system`. This was not a read of that path. No further launch, workaround, install, or alternate-browser route attempted.
No fresh screenshots, DOM/AX results, keyboard outcomes or WebKit results were produced. WebKit availability probe was after Chromium and therefore was never reached.

## Findings / next minimum verification
- Evidence gap, not established product P2: `evidence/stage2r2/cua-final-matrix.json` two specified focus cases. Minimum: in an authorized working browser serve the isolated immutable final dist, acquire focus via real keyboard Tab/ShiftTab, record activeElement and :focus-visible plus outline geometry/screenshot; preserve failure timing. Do not mark whole16 PASS from14.
- Evidence gap: remaining keyboard matrix, native text enlargement, WebKit current artifact, native iPhone/VoiceOver. Keep UNVERIFIED rather than inventing a new mandatory product gate.
- No product repair recommended from this limited review. No Site/GitHub/publication change performed. Stage3 release judgment deferred to parent integrating A/B/C.

2026-10-30 21:30 JST
