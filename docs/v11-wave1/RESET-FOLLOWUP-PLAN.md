# Reset follow-up pre-registration — 2026-11-13 JST

Target product: 16d10c830a284f0f432f013a9efd79e518d00d94, tree da7e5a18385b50aa9bc0d22ea0cd26c43958cbff.
Windows WebKit 26.5, viewport 375x1000, dark, reduced motion, measured 2x CSS text.
This browser/OS differs from the old Ubuntu CI; absence here does not disprove the old failure.

Hypothesis: focus/blur-associated native layout changes can change ancestor/control height between down/up without a product state update. This is a hypothesis, not an established cause.
Keep the original Query sequence (including the separately labelled synthetic no-op check), native single Reset click and existing 2-second assertion deadline. No force, dispatch replacement, retry-to-green or new waits.
Three fresh contexts per condition: original event instrumentation, expanded geometry/style instrumentation, no event instrumentation. The only changed factor is observation. Each records result, initial/final state, screenshot and failures; expanded records host children/ancestors/controls, rect, computed size/font/padding/margin/line-height/display, active element, scroll, state and before text around pointer/blur/change events.
No product change until evidence supports a cause. If not reproduced, record NOT_REPRODUCED, do not label it resolved. Synthetic auditor controls are distinct from browser observations.

Audit contract: five static assets index.html/exhibits.js/exhibits.css/wave1.js/wave1.css; index.html contains inline code, and references those four local assets. Stage set initial/query/permission/pivot/keyboard; fixed selectors in wave1-contract.cjs; every selector must have >=1 element, baseline finite positive, doubled size within <0.1 CSS px, reduced-motion media query true and measured no animation/zero transition. All stage evidence retained.
