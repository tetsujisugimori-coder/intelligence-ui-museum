# Pre-registration second single-factor candidate, 2026-11-13 JST

Candidate1 (fieldset direct button display:block) failed9/9 and did not change the42px fieldset shrink. Do not adopt it or describe its inline-line hypothesis as supported.

Refined hypothesis: WebKit26.0 fieldset/legend intrinsic height in a flex-column parent is stale before root select loses focus. Existing evidence isolates the height change to the fieldset itself; descendants do not move, and state/before/scroll are unchanged. Internal engine cause still unproven.

Candidate2 consists solely of `.wave1 fieldset { display:grid; }`, using explicit grid rows for the fieldset contents while retaining fieldset/legend semantics. Starting from original product, not candidate1. Same three observer modes × three fresh contexts, same native operation sequence/deadline. If all pass with stable fieldset/Reset rects, verify fixed14 and HTTP CI, including real controls. No retry-to-green. Preserve candidate1 and baseline failures.
