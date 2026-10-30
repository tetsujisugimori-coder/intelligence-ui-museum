# Latest independent conclusion — acceptance addendum

**PARTIAL; Stage3 HOLD.** The acceptance-matrix runner defects and transient keyboard observations described in the earlier review below are resolved in the final reviewed execution. They remain preserved as historical failed attempts and must not be silently erased. Current UI repairs pass within the documented synthetic-root/browser-font-preference scopes. Native WebKittextzoom and universal text200% remain unverified; dependency/source-tree risk approval and release license provenance remain HOLD.

## Final acceptance and independent retest

- Read final stage2r-evidence/acceptance/matrix.json:42records, completed2026-10-26T20:12:03.824Z.40post-repair records all recorded checksPASS:32root conditions (2engines×4widths×2themes×2root font sizes), plus8Chromiumbrowser-default-font32 conditions.2before records show both Button/Selectvisibility failures while pageoverflow check passes. These are40condition records, not40independent unit tests or proof of native WebKittextzoom.
- The earlier ButtonRED omission resulted from scrollIntoViewIfNeeded shifting clipped ancestors horizontally before measurement. Current runner uses vertical-only scroll plus ancestor scrollLeft=0 before unchanged visibility expectation. This corrects a measurement intervention, not product CSS.
- Reviewer independently reran before/after320/dark/syntheticroot32 for both engines using a separate script (reviewer/red-green-review.cjs).8component records:Button/Select both beforeRED and afterGREEN on eachengine. Saved8additional screenshots and independent-red-green.json. InspectedWebKitbefore/afterButton screenshots: old right edge visibly cut, new complete.
- Keyboard expectation remainsカード. Pointer moved away before keyboard use; wait for actual data-highlight=a, ArrowDown to b, Enter and closedmenu. These readiness assertions do not alter expected selection. All final40postrecords pass. Earlier4keyboard failures were not relabeled; final execution is a new run.
- Read smoke.json:8v09browser/widthcases pass structure/search/category/theme/Modal/Primary/Select;2sixcomponent operation groups pass;2noJS records retain117static cards and explanatory text. These are implementation-run evidence independently examined, not all117operations repeated by reviewer. The checked operation subset includes3v09exhibits. Offline case means already-loaded page after disabling network, not offline initial reload.

## Safety/provenance changes reviewed

- src/main.tsx/main.css,index.html,package.json,package-lock.json unchanged since prior repaired-source review; only browserrunner changed among prior hashed files. No dependency override or official package edit.
- docs/stage2r-license-review.md,noticegenerator and shippednotice now honestly flag master-derived react-remove-scroll-bar2.3.8 supplemental license as unproven release provenance, HOLD/unapproved. This fixes misleading labeling; it does NOT resolve missing release-matched evidence or grant publication approval.
- Current finalmatrix separates blockedfont attempts from externalresponses and labels only known20KaTeXfont URLs/directive, instead of claiming violationzero. Independent network evidence remains:Chromium20requests eachfailedcsp/externalresponses0;WebKit0requestevents/externalresponses0withfontviolations. LocalCSP application confirmed; productionheaderbehavior not tested.
- All6auditpackagefindings remainHOLD with approval pending. New code does not force upgrades, suppressaudit, or substituteofficialcomponents.

Final reviewed hashes are in reviewed-source-sha256-final.json. Initial findings and previous superseded observations follow for traceability.

---

# Stage 2-R independent security/provenance review (initial findings)

Reviewer: separate audit_review agent. Product source changes are owned by the parent implementation agent. No production, Sites, GitHub, package, lockfile, or official dependency edits by this reviewer. This is an independent source/security/provenance review, not an independent GUI review. Target: retrieved Stage0–2 source / installed lockfile. Final repaired-source review pending parent notification.

## Verified now

- Original ZIP SHA256 2160095a81c757f9ed01d45bdbe71e4e9fe619d60802570eb15cb59d2d8925dc. Original manifest54/54 verified.
- Fresh official npm registry metadata/tarball obtained. SHA512 integrity matches lock. Installed official package2645/2645 files byte equal registry tarball. Bundle sourcesContent27/27 official dist sources equal installed official code (nested Radix packages excluded from official source count). See official-integrity.json and official-bundle-content.json.
- Separate Library v09 final and source public/v09-original.html byte equal; SHA256327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97. Dataset117 continuous unique IDs,117 unique names,11 categories. Full117 operations not performed.
- Fresh npm audit exited1 for findings, not build failure. high1/moderate1/low4 retained. Six affected package entries; four underlying advisory records, not six distinct CVEs.
- Registry package @openai/apps-sdk-ui0.2.2 directly pins lodash4.17.21; remark-math6.0.0 and rehype-katex7.0.1 reach KaTeX0.16.47; micromark-extension-math3.1.0 is another propagated package. npm ls paths saved.
- Current dist sourcemap contains lodash.debounce, a separate package. lodash proper and KaTeX JavaScript are not present in this map. Official CSS includes KaTeX font rules and external CDN URLs. Map absence alone is not a proof of safety.

## Advisory particulars (fresh GitHub Advisory API JSON)

| Package | Advisory/CVE | First patch | Trigger relevant to reachability |
|---|---|---|---|
| lodash4.17.21 | GHSA-r5fr-rjxr-66jc / CVE-2026-4800 |4.18.0|Untrusted options.imports key names or inherited polluted keys flowing into _.template compilation/Function constructor|
| lodash4.17.21 | GHSA-f23m-r3pf-42rh / CVE-2026-2950 |4.18.0|Crafted array-wrapped path segments to unset/omit delete built-in prototype properties|
| lodash4.17.21 | GHSA-xxjr-mmjv-4gpg / CVE-2025-13465 |4.17.23|Crafted paths to unset/omit delete built-in prototype properties;4.17.23 is still affected by the follow-up above|
| katex0.16.47 | GHSA-238p-pmpm-9mq7 / CVE-2026-103923 |0.18.2|Prior prototype pollution or attacker-controlled options prototypes, untrusted math expressions, unsanitized inserted rendered HTML; interaction XSS or resource loads possible|

## Individual package dispositions

| Package/version | Severity/path | Runtime inclusion / reachability | Disposition |
|---|---|---|---|
|@openai/apps-sdk-ui0.2.2|moderate, direct; propagates lodash/rehype-katex/remark-math|27 official code sources included for six components; existence of a propagated finding does not show a vulnerable call|HOLD: source tree approval; narrow static-bundle ACCEPT proposal remains unapproved|
|lodash4.17.21|high, via official package|JavaScript absent from existing bundle map, official Slider source imports clamp/round but Slider not imported. No template/unset/omit call identified in app sources; complete exclusion not proved by name search|HOLD;4.18.0 override would need compatibility validation and should not be forced|
|katex0.16.47|low, via rehype-katex and remark-math→micromark-extension-math|JS absent from map; official CSS font declarations included. No Markdown/renderMath app entrypoint; browser network evidence still needed|HOLD;0.18.2 requires explicit semver-breaking override/updated upstream dependencies|
|micromark-extension-math3.1.0|low propagated KaTeX, via remark-math|No renderer JS source identified in bundle map, not an independent additional flaw|HOLD with KaTeX|
|rehype-katex7.0.1|low propagated KaTeX, via official|No renderer JS source identified in bundle map|HOLD with KaTeX|
|remark-math6.0.0|low propagated KaTeX, via official|No renderer JS source identified in bundle map|HOLD with KaTeX|

None is FIX. No owner/approver has formally accepted risk. Static six-component nonpublic experimentation can be narrower than enabling future Markdown/Slider/imported content; widening scope requires re-audit.

## CSP/font/license findings and recommendations

- Initial original index/vite config has no CSP configuration. A future config file is insufficient evidence: capture HTTP response policy and browser securitypolicyviolation events under actual serving conditions. Original v09 contains inline scripts/styles; use resource-specific CSP hashes or a documented separate policy rather than silently allowing arbitrary scripts globally.
- KaTeX font @font-face declarations alone do not prove actual HTTP requests. Six displayed components do not render math; capture normal and offline request lists, click Select/Tooltip portals, and state blocked-vs-absent requests distinctly. Local font distribution requires exact-version files+license and reproducible path rewriting; package-internal CSS should stay immutable.
- Official0.2.2 tarball contains MIT LICENSE. Production notices cover dependency metadata, but npm react-remove-scroll-bar2.3.8 omits a LICENSE file. Registry gitHead is b3b1287aad81def2e2ae707274b74531b61ddbaf. Fetching LICENSE at that exact commit returned404; GitHub tree at commit returned422. These failures do not prove upstream absence; provenance remains unresolved. Existing supplemental notice was from master and declares2025; do not relabel it exact2.3.8 without evidence. Keep supplemental status plus explicit HOLD for release provenance/required notice assessment.
- Initial verify-baseline.mjs says public/live equality although it only compares saved response. Correct wording to captured HTTP-response equality; do not fetch/change current published site for this task.

## Limits

No UI repairs or GUI pass/fail issued by this reviewer yet. No live public-site equality checked. No iPhone Safari/VoiceOver or全117操作. No Stage3 approval. Initial recommendation: PARTIAL; Stage3 HOLD pending repaired UI evidence, serving CSP/network checks, license provenance disposition, source-dependency risk owner decision, and GitHub management target.

Additional exact-release license attempts: raw README at npm gitHead404; v2.3.8/LICENSE404; GitHub tags API succeeded with latest returned tagv2.3.7, not2.3.8 (19tags, all returned). These are acquisition facts only, not an absence proof. See release-license-attempts.json and repo-tags.txt.


## Independent repaired-source review and targeted GUI (Stage2-R)

Read repaired src/main.tsx/main.css,index.html,verify-baseline.mjs and implementation browser runner. Source repair is local: narrow panepadding8px, Button public gutterSize=xs, Select official default TriggerView instead of redundant custom prefix. No official package edit/replacement found; six direct imports retained. Existing v09 original remains immutable. Historical HTTP capture wording corrected. MetaCSP now present in index and generated dist.

Independently executed reviewer/gui-review.cjs against own local HTTP server/native browser processes, not implementation runner. Four targeted conditions:320px×light/dark×Chromium browser-default-font32 or WebKit synthetic-root32. Button full Japanese label visible,7px keyboard outline extent clear of clipping ancestors; touch click increments1. Select initially一覧, touch changesカード, keyboard Space/ArrowUp/Enter returns一覧. Four cases completed with zero JavaScript pageerrors. Inspected screenshots: WebKitdark Button/Select and Chromiumlight Select; eight screenshots preserved. This is targeted verification, not fullmatrix verification or native WebKittextzoom.

Native Chromium Page.setFontSizes standard32 changed rootfont32/Button28, but Select trigger remained14px. Therefore this browser-default-font preference is NOT evidence every text label is enlarged200%. WebKitroot32 Select28. Browser-native text-only200% remains incompletely verified. Screenshot scaling was not used.

Network/CSP result: current metaCSP is observed by browser. Chromium emitted20external KaTeX request events, ALL failed with errorText=csp, successful external responses0. WebKit emitted0external request events but100font-src violations (20URLs×5observations). No claim of zero external references/zero policy violations is valid. These are blocked source references, not observed successful external font transfers; six current component labels stayed visible. Production serving headers are untested.

Implementation finalmatrix completed42records (32syntheticroot afterconditions +8Chromiumbrowserfont +2before). Its current post-fix failure names include expected CSP/network checks AND4Selectkeyboard failures. These may be runner timing but remain failed observations until diagnosed. Before Select clipping RED captured both engines; before Button visibility check PASSED both engines, so do not claim same-check ButtonRED/GREEN from this matrix. Current Button visibility function omits outline extent and tolerates1px; targeted reviewer test measured7px focus extent only afterrepair.

Independent review exposed testserver rootpath bug (path.resolve strips trailing slash), reported to parent; parent already corrected current runner and preserved failed attempt. Parent also identified #official-select hiddeninput and corrected target to visible rolebutton. Reviewer test corrected same issue before completion; aborted attempts are noted in reviewer commands history.

Final current independent recommendation: PARTIAL; Stage3HOLD. UI source repair is appropriate and targeted visible paths PASS within stated scope. Native zoom coverage, implementation keyboard failures, retained dependency approvals/licenseprovenance and externalfont/CSP deployment decisions remain explicit limitations. No P0/P1 identified in this bounded source/targetedGUI review; no general absence guarantee.
