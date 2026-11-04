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

The image verdict compares the **entire native select raster** with each of the
48 committed normal-source images in `apps/v11/kanban-baselines/`. The fixed ROI
is `(0, 0, approved PNG width, approved PNG height)`. It includes all four text
edges, arrow and widget chrome. The current image, DOM metrics, Canvas metrics
and detected ink never determine or shrink it. PNG dimension changes fail, and
missing pixels inside the approved raster are magenta differences. No image is
resized or aligned. Chrome differences may also require review; this is a
deliberately strict regression gate, not a claim of a new product defect.

P3-01 supersedes the original CSS border/padding + Canvas measureText crop:
native select paints are offset from that estimate (including text beyond its
right edge in all 48 approved images). Historical manifest `roi` fields and
baseline PNGs remain unchanged as provenance; those fields are no longer used
by the production comparator. Capture retains that historical Canvas estimate
only as diagnostic metadata for old-harness replay and baseline compatibility;
it does not determine the current comparison region.

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

Every normal run now also requires 48 normal images accepted, 48 real suffix
erasures rejected, and 144 prefix/top/bottom erasures rejected. Erasure bands
start at each approved raster's actual glyph edge; each must change more than
2 pixels by more than 12/255 and be rejected for an image difference, with no
dimension change. A complete capture copy with updated SHA-256 is validated
before comparing its 48 erased suffixes. Diagnostic glyph masks are generated
from approved images only, in a visually reviewed chrome-free interior window;
they select synthetic controls and overlays, **never** the production ROI.

The exact review four controls erase x=106..111 and the historical ROI's vertical
range in 375/dark/2× images. The runner loads the unmodified reviewed comparator
sources from Git at `e40d92bcc97fa1bf214b0d613aac2d144fd2138f`: all 48 verdicts
must be PASS before the fix (four false acceptances), while the current gate must
reject exactly those four with 12/13/19/26 differing pixels. The same images,
baseline PNGs, dimensions and 12/2 tolerance are used. Captures retain their
diagnostic historical ROI metadata; legacy replay can also supply it from the
historical manifest when absent. Current acceptance ignores that estimate.

To recalculate a downloaded historical CI artifact without launching browsers:

```sh
node apps/v11/kanban-audit.cjs ARTIFACT_DIRECTORY .work/NEW-audit
```

This validates capture/HEAD/tree/source hashes, PNG identity, 20 existing
controls, 192 edge erasures, the four RED→GREEN controls and real old images.
It is explicitly archived-image recalculation, not fresh browser execution.
All audit/runner output directories must be new.

For intentional end-to-end failure propagation, manually dispatch CI on this
branch with `kanban_failure_control=true`. After fresh capture, the runner
erases the exact four review regions, updates PNG SHA-256 and capture metadata,
and proceeds through capture validation to the normal image comparison. The
Kanban runner/job must fail with `current label paint regression`; its artifact
contains `intentional-review-erasure.json`, updated capture and difference PNGs.
Default/PR runs never inject this fault. This modifies no product source or
approved image. The failure job and normal job use the same submitted HEAD.

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
