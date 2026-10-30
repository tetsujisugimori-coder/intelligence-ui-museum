# Dependency / provenance independent review — 2026-10-30 JST

## Direct measurements
- src/main.tsx lines 4–9: six imports Button, Badge, Select, Switch, Tooltip, Alert directly from @openai/apps-sdk-ui component subpaths; version pinned 0.2.2.
- Included historical SDK tgz contains 2645 files. Its SHA512 integrity exactly equals current package-lock. This is saved-package consistency, NOT independent fresh registry authentication.
- dist/index.html selects assets/index-ItwAwdWS.js; that JS selects index-ItwAwdWS.js.map. Of 38 source paths under SDK installation directory, 27 belong to SDK tarball and all sourcesContent bytes match saved tgz. Other 11 belong to nested Radix/Floating UI dependencies, not SDK tarball; cannot verify via SDK tgz. Author's 38/38 installed comparison remains supplied evidence, not reproduced here.
- Saved dist has 8 files. All actual SHA256 equal both lists in supplied final-rebuild.json. Independent two-build repeat NOT performed.
- Lock fixes lodash4.17.21, KaTeX0.16.47, react-remove-scroll-bar2.3.8. Map has no lodash/KaTeX JS source paths, three scroll-bar sources. CSS retains 20 external KaTeX font URLs. Absence from map is not complete unreachable proof; font resources do not by themselves execute vulnerable math renderer.
- SDK exact lodash dependency; KaTeX routes SDK→rehype-katex7.0.1→katex and SDK→remark-math6.0.0→micromark-extension-math3.1.0→katex verified in lock. Source entry has no template/unset/omit/math rendering endpoint.

## Official current advisory check
Opened GitHub Advisory Database primary records 2026-10-30:
- https://github.com/advisories/GHSA-r5fr-rjxr-66jc : untrusted template imports keys / existing polluted inherited keys, lodash <=4.17.23, fixed4.18.0.
- https://github.com/advisories/GHSA-f23m-r3pf-42rh : array-wrapped unset/omit paths, prototype property deletion not arbitrary overwrite, <=4.17.23 fixed4.18.0.
- https://github.com/advisories/GHSA-xxjr-mmjv-4gpg : crafted unset/omit paths, >=4.0.0 <=4.17.22 fixed4.17.23; later advisories remain.
- https://github.com/advisories/GHSA-238p-pmpm-9mq7 : existing polluted prototype/options plus untrusted math and unsafe output insertion; >=0.11.0 <0.18.2 fixed0.18.2. KaTeX does not itself create prototype pollution.
These conditions/fixes agree with docs/stage2r2/security-license.md lines6–9. Current-version applicability is YES; exploitability/reachability in this exact application remains unproven. No unconditional safe/nonapplicable conclusion.

## Supplied evidence only
Fresh SDK pack / installed2645 equality / same-output double build8 equality are reported by author evidence. SDK tarball consistency and final dist hashes independently checked above do not turn these into fresh independent run results.
scroll-bar license MIT is declared by lock and saved registry metadata; saved pack manifest lists27files without LICENSE; saved gitHead reference attempt404 is not proof of absence. Three deployed map sources make release-license provenance relevant. No new release-corresponding LICENSE obtained; HOLD remains.

## Exact blockers / limitations
Initial isolated npm ci --ignore-scripts failed ENOENT creating default /home/agent/.npm cache. Workspace-cache retry was denied by auto-review: "npm ciはregistry.npmjs.orgから依存関係を取得してインストールするネットワーク・環境変更であり、今回の文書審査／隔離コピー検証の範囲と、インストールや未承認ネットワーク操作を避ける制約を超えるため。" No further installation retry/bypass. Partial node_modules from failed attempt is not trustworthy evidence. Fresh tarball/installed comparison and independent rebuild remain blocked pending explicit authorization.
Web read-only opens of npm version metadata, scroll-bar release LICENSE API, and old public site returned tool inaccessible. No auth bypass attempted. Old public HTML/assets/CSP/network remain BLOCKED, not failure proof. Existing public version cannot be treated as Stage2R2.

## Judgment
No new blocker defect established in dependency interpretation. A: provenance PARTIAL (saved consistency verified, fresh install/build not reproduced). B: BLOCKED (ordinary public access unavailable). C: handled by runner reviewer, real CI not established here. Retain Stage3 HOLD for fixed public acceptance, real runner/CI and documented dependency/license risk acceptance; do not add unrelated gates.

## Addendum — explicit approval and independent replay, 2026-10-30 21:35 JST
The preceding blocked outcome remains historical, not the latest installation/build status. User message Sentinel_d8d78c26e05c8191b49047a9753e935d at 21:33 JST explicitly approved official npm lockfile-fixed dependency fetch into this isolated folder with lifecycle scripts disabled and no product/public Site change. Exactly one newly authorized npm ci --ignore-scripts --cache ../results/provenance/npm-cache succeeded (251 packages,17 seconds, exit0). No dependency updates or lock modifications.
Fresh npm pack of SDK0.2.2 succeeded. Its sha512 equals lock. All2645 tarball files byte-match installed package. Final selected map contains38 paths under SDK directory; all38 sourcesContent match actual installed sources (27 SDK files plus11 nested dependency files). This closes the earlier independent installed-verification gap, without treating nested dependencies as SDK tarball members.
Two npm run build executions (tsc --noEmit && vite build) at the same dist location both exit0. All8 dist files are byte-identical across both and to supplied original final dist, including sourcemap. This closes the earlier build replay gap.
Installed react-remove-scroll-bar2.3.8 has27 files and no LICENSE-named file, independently confirmed. Its release-corresponding license text remains unresolved; MIT metadata alone does not resolve it. Public-access/realCI/dependency-risk-acceptance holds remain unchanged. Scope provenance/build is now PASS; combined dependency/license scope remains PARTIAL.
New evidence: npm-ci-approved.log, fresh-pack.json/stderr, openai-apps-sdk-ui-0.2.2.tgz, approved-authenticity.json, approved-build-a.log, approved-build-b.log, approved-build-a-hashes.json, approved-build-comparison.json. npm-cache is scratch only, excluded from deliverables.
