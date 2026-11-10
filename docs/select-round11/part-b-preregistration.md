# 第11回B 事前登録（2026-11-10 JST）

A balanced-observer v2 local Linux: HEAD 7af62ba, 36/36 complete; all 18 observed-target pairs equivalent. Button, Switch and full yielded 3/3 visible-to-absent differences; layout, Badge and Alert yielded none. This is not root-cause proof. Hosted A audit passed but privacy release inventory rejected the legacy slot count, so its raw data was not released and is not used to select B.

Following independent design review, decompose the shorter Switch group. Three paired comparisons, 3 repeats, AB/BA/AB, 18 trials per population:
1. None vs prefix (normal click, focus, Space). Switch ends OFF.
2. None vs disabled bundle (check, disabled DOM no-op assertion, uncheck). Switch ends OFF/enabled.
3. Prefix vs prefix+disabled bundle. Both end OFF/enabled; this tests addition of the disabled bundle.

Both arms traverse and observe both subgroup boundaries even when a callback is skipped. The split introduces an observer boundary compared with frozen original Switch. A retains that original positive control; B recomposed full must reproduce before reduction is claimed. Preserve the exact actions/assertions, selectors and state checks; no forced click or arbitrary wait. Target Select equality is not whole-page/browser-internal equality.

B is a staged decomposition, not yet individual-operation attribution. A positive disabled bundle permits a separately committed comparison omitting only its disabled DOM no-op. A positive prefix permits a subsequent activation-method comparison with matched final OFF state, with input history as explicit treatment. Do not add these trials before B results and a new registration. If subgroup results are inconclusive, retain UNKNOWN and propose the next minimum contrast.

Same fixed runtime, fresh contexts, raw snapshots, trace operation sequence, four-PNG measurement, privacy checks and separate OS populations as A. Actual Windows PC is currently unavailable; no claim of testing it or Safari/physical keyboard. Product, SDK, historical evidence and HOLD unchanged.
