# Kanban native select image gate — Issue #15

2026-11-04 JST. Stage 3 HOLD. Independent review is required before merge.

## What is measured

`run-kanban-ci.cjs` runs Chromium/WebKit × 375/390/1280 CSS pixels ×
dark/light × normal/synthetic 2× text: all 24 conditions. Each condition saves
the actual native select PNGs for **未着手** and **進行中**, four full-card PNGs,
and initial/moved/Undo/Reset operation and computed font measurements. All four
selects must remain 16px or 32px at every state. Selection, move, Undo, Reset,
keyboard focus restoration/visible outline, document overflow and pageerror are
asserted. The original `kanban-zoom-test.cjs` remains unchanged and runs on the
real old source as a demonstration of its 24/24 false acceptance.

The image verdict compares the actual rasterized label area with 48 committed
normal-source images in `apps/v11/kanban-baselines/`. DOM text, canvas text
metrics and geometry only identify the crop; they do **not** decide readability.
The crop starts after the native select border and padding, covers the full
measured three-character label width and the interior line height, and excludes
the arrow and most unrelated chrome. The committed manifest fixes that crop;
the current run cannot shrink it. Out-of-image crop pixels are magenta failures.
No image is resized or aligned to hide a missing suffix.

For each RGBA pixel, any channel difference greater than **12/255** counts as
different; at most **2 pixels** are allowed. The same policy and crop apply to
old, current and synthetic controls. Every comparison saves a red difference
image, pixel count and actual/baseline/diff SHA-256. This is a visual regression
gate, not OCR or a general proof of legibility. Changes in label rendering can
require review even when still readable. It covers these two labels at initial
state in all 24 combinations; later states retain operation/font/focus checks
and saved card images, rather than claiming automatic image coverage of every
task and state. The short 完了 label and native popup menu are outside the pixel
oracle. Real old 375/dark/2× must fail **both labels in both engines**.

## Environment and provenance

The CI job uses the official Playwright 1.56.1 Noble container pinned to
`sha256:42f02d323c310069b4d54c94bd91a608966a486c3492c48ae0b1cea747ec5ca2`.
Playwright stays at the existing lockfile version. No new package or font was
added. The existing bundled PNG codec is used, so a Playwright update must also
review this internal import. Chromium is 141.0.7390.37; WebKit is 26.0.
Device scale is 1, locale ja-JP, timezone UTC, reduced motion, 900px viewport
height, and the product's system-ui/sans-serif font cascade is retained.
The font file inventory, hashes, browser versions, OS and runtime are recorded.
A browser/font fingerprint mismatch fails rather than silently changing a
baseline. Windows diagnostic images use their own local baseline and are
never used as the Linux CI oracle.

Initial baseline source is merged PR #14 main
`1b4befda87c97bd70da2c1d6065427034d12660a`, tree
`99d5f7f904f95fbd64d4ff4fb3aebf72511da29d`, identical to submitted PR #14
HEAD `f012876fed8e08a3ad3cd23527c30598e2bd2561`. Candidate images were
captured by CI run 41804471118. Its baseline acquisition job deliberately
failed acceptance. All 48 select images were inspected by the implementer;
independent baseline review is still pending. See manifest review provenance.

The real defect source is `3b90ddbb77787b759c014a24d99f05ca98dda89f`, tree
`0b1714d642778e26507f8ba94b8be63c034deb5c`. The old source is extracted
directly from Git into a fresh `.work/` server directory. No original checkout
or historical evidence is changed. The server serves exactly index.html,
exhibits.js and exhibits.css and records their hashes. The source and test
harness HEAD/tree are distinguished. The new CI job checks out the PR head
explicitly; the pre-existing jobs retain their original checkout behavior.

## Reproduction and baseline changes

In the pinned container, after `npm ci --ignore-scripts` in `apps/v11`:

```sh
EVIDENCE_DIR=.work/kanban-fresh node apps/v11/run-kanban-ci.cjs
```

The output directory must not exist. A fresh run UUID, parent-controlled target
HEAD/tree, child exit/signal/timeout, timestamps, complete condition/state sets,
PNG decoding/CRC, checksums and all 48 comparison verdicts are required.
No missing or skipped step can become a successful empty list. Failure attempts
and child logs are retained, with no retry-until-green loop. The CI artifact is
uploaded even on failure, with `if-no-files-found: error`.

There is **no baseline update in CI**. The separate acquisition mode
`KANBAN_BOOTSTRAP=1` captures the exact fixed-source commit only, labels its
output `CAPTURE_ONLY_NOT_ACCEPTANCE`, and returns nonzero. It is not acceptance.
After inspecting every candidate, this explicit command writes a **new**
directory and refuses overwrites:

```sh
node apps/v11/kanban-approve-baseline.cjs CAPTURE_DIR NEW_DIR REVIEWER REASON
```

Commit the proposed images, manifest, reason and before/after diff in a reviewed
PR. Do not replace images merely to make a failure pass. A future legitimate
source or environment change must explicitly revise the currently pinned
source policy and demonstrate old-defect rejection with unchanged tolerances.
Neither baseline approval nor implementer self-review closes Issue #15.

## Limits

This is synthetic CSS text enlargement in Playwright. Actual iPhone Safari,
VoiceOver, physical OS text enlargement/backgrounding and exhaustive interaction
with all 123 exhibits are NOT_TESTED. Issues #5/#9/#10, old Linux Modal cause
UNKNOWN, and Stage 3 HOLD remain separate. Sites are not updated.
