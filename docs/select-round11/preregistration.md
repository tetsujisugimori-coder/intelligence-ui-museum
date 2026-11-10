# 第11回A 事前登録（2026-11-10 JST）

Issue #39 / parent #28. Baseline main a373160f9d7e1b726b51d3a3f6de3e65024699c7, merged round10 #38. Stage 3 HOLD; product and SDK not changed. This document and plan.json must be committed before any round11 trial.

Six separate paired comparisons: no operation group versus layout / Button / Badge / Alert / Switch / full frozen prelude. Environment checks run in every arm. Three pairs each, AB/BA/AB, fresh context/page, 36 trials per OS population. Full prelude remains positive control. Run exact frozen group callbacks, without injecting missing dependencies. If a group fails alone, record incomplete, do not silently add setup or increase repeats.

All arms use the round10 shared Select h2 scroll/blur, empty-style-only normalization, real h2 click, locator focus, Space, Escape and four-PNG observer. Preserve before/after normalization evidence; normalization itself is an intervention. Check exact checkbox and hidden value input identities. Capture target snapshot before and after each operation group, pre-focus, acquisition, menu, closed and paint. Freeze source hash, target build, runtime and manifest. Timing uses page performance clock within snapshots; wall-clock steps are not subtracted from page times.

Groups preserve original order and side effects. Layout scrolls all six exhibits. Button includes click, keyboard history, focus/ring screenshots and disabled/loading toggles; Badge changes variant and photographs; Alert toggles visibility and photographs; Switch changes value, keyboard and disabled state. These are not statistically independent factors. Original disabled DOM-click no-op assertions in Button/Switch remain historical controls, never an alternative successful click. No force-click is introduced.

Target equivalence is limited to Select subtree, attributes, viewport, scroll, computed style and geometry. Record active element and focus before/acquisition; document-wide state and internal browser modality are not proven equal. A mismatch means UNCONFIRMED; no causal claim or automatic larger sample. Fixed observer/probe could affect results and remains a limitation.

B is not preregistered or run yet. Only candidate groups with reproducible differential and confirmed observed target conditions qualify for a separately committed minimal individual-operation plan. If A does not isolate candidates, B remains NOT_TESTED pending independent interpretation.

Validate intentional missing/reordered group, snapshot, focus contradiction, source/version, PNG/trace/manifest corruption, wrong pairing, incomplete status and exit discrepancy. Independent reviewer must inspect raw artifacts and independently compute pixel evidence. CI success is diagnostic infrastructure, not product acceptance. Windows actual PC, hosted Windows/Linux and local Linux are separate populations. Physical keyboard, iPhone Safari and VoiceOver remain NOT_TESTED. No external actual-PC evidence upload without explicit permission.
