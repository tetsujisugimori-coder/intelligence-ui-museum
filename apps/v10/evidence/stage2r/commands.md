# Commands and evidence index
Run timestamps: acceptance/matrix.json and smoke/smoke.json (UTC). Reports use JST.
npm ci --ignore-scripts --cache <scratch npm-cache>
npm run build (original then repaired)
npm test
node scripts/verify-baseline.mjs
npm audit --json (separate reviewer, exit1 means findings)
Browser: APP_ROOT=<absolute dist> BEFORE_ROOT=<original dist> EVIDENCE_DIR=<out> CHROMIUM_EXECUTABLE=/tmp/chromium WEBKIT_EXECUTABLE=<scratch wrapper> node scripts/stage2r-browser.cjs
Smoke: APP_ROOT=<absolute dist> EVIDENCE_DIR=<out> WEBKIT_EXECUTABLE=<scratch wrapper> node scripts/stage2r-smoke.cjs
Independent GUI: independent-security-review/gui-review.cjs and red-green-review.cjs; acquisition commands in review-commands.md.
Definitive40post+2before: acceptance/matrix.json. Root200 and browser-font are different modes; native WebKit text200 UNVERIFIED.
Failed/initial attempts are under failed-attempts/ and setup logs; not accepted product successes. Other original records are historical Stage0–2.
GitHub: searched museum/intelligence repositories and v10/apps-sdk-ui PRs; listed27 connected owner repos. No project upstream identified, no unrelated repo writes/new repo creation.
