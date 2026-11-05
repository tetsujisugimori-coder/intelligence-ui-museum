"use strict";
// Black-box CLI acceptance tests. Inputs are copies; the base artifact is immutable.
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto"), assert = require("node:assert/strict");
const { spawnSync, execFileSync } = require("node:child_process");
const { sha } = require("./kanban-image.cjs");
const [input, output] = process.argv.slice(2), repo = path.resolve(__dirname, "../..");
assert(input && output, "complete artifact and NEW test evidence directory required");
const base = path.resolve(input), out = path.resolve(output), cli = path.join(__dirname, "kanban-audit.cjs");
assert(!fs.existsSync(out)); fs.mkdirSync(out, { recursive: true });
const fixtures = fs.mkdtempSync(path.join(repo, ".work/audit-cli-fixtures-"));
const original = fs.readFileSync(path.join(base, "summary.json")), summary = JSON.parse(original);
const results = { kind: "CLI tests on copied evidence; synthetic negatives; NOT browser execution", status: "FAIL",
  started: new Date().toISOString(), baseHarnessHead: summary.harnessHead, baseHarnessTree: summary.harnessTree,
  baseSummarySha256: sha(original), fixtureRoot: fixtures, cases: [] };
function save() { fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2)); }
function invoke(name, executable, fixture) {
  const dir = path.join(out, name); fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(fixture, "summary.json"), path.join(dir, "input-summary.json"));
  const r = spawnSync(process.execPath, [executable, fixture, path.join(dir, "output")], { cwd: repo, encoding: "utf8", timeout: 180000, maxBuffer: 5e6 });
  fs.writeFileSync(path.join(dir, "stdout.log"), r.stdout || ""); fs.writeFileSync(path.join(dir, "stderr.log"), r.stderr || "");
  const file = path.join(dir, "output/audit.json"), report = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : null;
  const row = { name, code: r.status, signal: r.signal, spawnError: r.error?.message, inputSummarySha256: sha(fs.readFileSync(path.join(fixture, "summary.json"))),
    reportStatus: report?.status, reason: report?.error, executedChecks: report?.checks?.filter(c => c.status !== "NOT_RUN").map(c => ({ name: c.name, status: c.status })),
    notRunChecks: report?.checks?.filter(c => c.status === "NOT_RUN").map(c => c.name) };
  fs.writeFileSync(path.join(dir, "exit.json"), JSON.stringify(row, null, 2)); return { row, report };
}
function recorded(row, expected) { row.expected = expected; row.status = "PASS"; results.cases.push(row); save(); }
function fixture(name, s, full = false) {
  const dir = path.join(fixtures, name); fs.mkdirSync(dir);
  if (full) fs.cpSync(base, dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(s, null, 2)); return dir;
}
try {
  // Frozen unmodified old CLI, with the SAME locked PNG codec via a resolution proxy.
  const old = path.join(out, "old-harness/apps/v11"); fs.mkdirSync(old, { recursive: true });
  const hashes = {};
  for (const name of ["kanban-audit.cjs", "kanban-contract.cjs", "kanban-image.cjs", "kanban-scenarios.cjs"]) {
    const bytes = execFileSync("git", ["show", `f9db21c4da541a20d416011bb3f866f69302e402:apps/v11/${name}`], { cwd: repo });
    fs.writeFileSync(path.join(old, name), bytes); hashes[name] = sha(bytes);
  }
  results.oldCliSourceHashes = hashes;
  const proxy = path.join(old, "node_modules/playwright-core/lib"); fs.mkdirSync(proxy, { recursive: true });
  fs.writeFileSync(path.join(proxy, "utilsBundle.js"), `module.exports=require(${JSON.stringify(require.resolve("./node_modules/playwright-core/lib/utilsBundle.js"))});\n`);
  fs.cpSync(path.join(__dirname, "kanban-baselines"), path.join(old, "kanban-baselines"), { recursive: true });
  for (const name of ["A-empty-failed", "B-old-only"]) {
    const s = JSON.parse(original);
    if (name.startsWith("A")) { s.status = "FAIL"; s.exitCode = 1; s.runs = []; }
    else s.runs = s.runs.filter(r => r.label === "old");
    const dir = fixture(name, s, name.startsWith("B"));
    const before = invoke(name + "-before", path.join(old, "kanban-audit.cjs"), dir);
    assert.equal(before.row.code, 0); assert.equal(before.report.status, "PASS");
    recorded(before.row, "old false acceptance, exit 0");
    const after = invoke(name + "-after", cli, dir);
    assert.equal(after.row.code, 1); assert.equal(after.report.status, "FAIL");
    assert.equal(after.report.error.code, name.startsWith("A") ? "SUMMARY_STATUS" : "RUN_SET");
    assert.equal(after.row.inputSummarySha256, before.row.inputSummarySha256);
    assert(after.report.checks.slice(1).every(c => c.status === "NOT_RUN"));
    recorded(after.row, "new semantic rejection, exit 1");
  }
  const positive = invoke("complete-normal", cli, base);
  assert.equal(positive.row.code, 0, positive.report?.error?.message); assert.equal(positive.report.status, "PASS");
  assert.equal(positive.report.checks.length, 11); assert(positive.report.checks.every(c => c.status === "PASS"));
  assert.equal(positive.report.runs.find(r => r.label === "current").accepted, 48);
  assert.equal(positive.report.existingControls, 20);
  assert.deepEqual(positive.report.boundaries, { normalAccepted: 48, suffixRejected: 48, edgeControls: 192 });
  assert.deepEqual(positive.report.reviewReplay, { status: "PASS", oldFalseAcceptances: 4, newImageRejections: 4 });
  recorded(positive.row, "complete evidence accepted only after all 11 phases, exit 0");
  const summaryCases = [
    ["current-only", s => s.runs = s.runs.filter(r => r.label === "current"), "RUN_SET"],
    ["both-missing", s => s.runs = [], "RUN_SET"],
    ["runs-absent", s => delete s.runs, "STRUCTURE"],
    ["duplicate-current", s => s.runs[1] = s.runs[0], "RUN_SET"],
    ["duplicate-old", s => s.runs.push(s.runs[1]), "RUN_SET"],
    ["unknown-label", s => s.runs[0].label = "fixed", "RUN_SET"],
    ["failed-summary", s => s.status = "FAIL", "SUMMARY_STATUS"],
    ["capture-only-summary", s => s.status = "CAPTURE_ONLY_NOT_ACCEPTANCE", "SUMMARY_STATUS"],
    ["nonzero-summary", s => s.exitCode = 1, "SUMMARY_EXIT"],
    ["missing-exit", s => delete s.exitCode, "SUMMARY_EXIT"],
    ["pass-with-error", s => s.error = "interrupted", "SUMMARY_EXIT"],
    ["missing-finish", s => delete s.finished, "TIME"],
    ["missing-harness-head", s => delete s.harnessHead, "IDENTITY"],
    ["wrong-harness-tree", s => s.harnessTree = "0".repeat(40), "GIT_IDENTITY"],
    ["missing-source", s => delete s.runs[0].source, "STRUCTURE"],
    ["missing-target-file", s => delete s.runs[0].source.files['exhibits.css'], "SOURCE_FILES"],
    ["extra-target-file", s => s.runs[0].source.files.extra = "0".repeat(64), "SOURCE_FILES"],
    ["wrong-target-hash", s => s.runs[0].source.files['exhibits.css'] = "0".repeat(64), "SOURCE_FILES"],
    ["missing-identity", s => delete s.runs[0].identity, "STRUCTURE"],
    ["identity-head-mismatch", s => s.runs[0].identity.targetHead = s.runs[1].source.head, "IDENTITY"],
    ["reused-run-uuid", s => s.runs[0].identity.runId = s.runId, "IDENTITY"],
    ["child-exit-7", s => s.runs[0].child.code = 7, "CHILD_RESULT"],
    ["child-timeout", s => s.runs[0].child.timedOut = true, "CHILD_RESULT"],
    ["child-signal", s => s.runs[0].child.signal = "SIGTERM", "CHILD_RESULT"],
    ["contradictory-child-fields", s => s.runs[0].child.status = "FAIL", "CHILD_RESULT"],
    ["missing-legacy-child", s => delete s.runs[1].legacyChild, "STRUCTURE"],
    ["missing-comparison-summary", s => s.comparisons.pop(), "RUN_SET"],
    ["incomplete-comparison-count", s => s.comparisons[0].total = 47, "COMPARISON_COUNT"],
    ["current-failure-summary", s => s.comparisons[0].failed = 1, "COMPARISON_COUNT"],
    ["missing-control-count", s => delete s.controls, "CONTROL_COUNT"],
    ["incomplete-boundary-count", s => s.boundaryControls.edgeControls = 191, "BOUNDARY_COUNT"],
    ["missing-review-count", s => delete s.reviewReplay, "REPLAY_COUNT"],
  ];
  for (const [name, mutate, code] of summaryCases) {
    const s = JSON.parse(original); mutate(s); const dir = fixture(name, s);
    const { row, report } = invoke(name, cli, dir);
    assert.equal(row.code, 1); assert.equal(report.status, "FAIL"); assert.equal(report.error.code, code, name);
    assert(!report.error.message.includes("ENOENT"), name + " must reject summary semantically before opening images");
    recorded(row, `semantic rejection ${code}, exit 1`);
  }
  const image = "chromium-375-dark-1-todo.png";
  const artifactCases = [
    ["missing-image", d => fs.unlinkSync(path.join(d, "current", image)), "CAPTURE"],
    ["corrupt-image", d => fs.writeFileSync(path.join(d, "current", image), "not a PNG"), "CAPTURE"],
    ["stale-image", d => fs.utimesSync(path.join(d, "current", image), new Date(0), new Date(0)), "CAPTURE"],
    ["stale-capture-id", d => edit(d, "current/capture.json", r => r.runId = crypto.randomUUID()), "CAPTURE"],
    ["missing-comparison-file", d => fs.unlinkSync(path.join(d, "current-comparisons.json")), "MISSING_EVIDENCE"],
    ["incomplete-comparison-verdicts", d => edit(d, "current-comparisons.json", r => r.pop()), "COMPARISON_RECORD"],
    ["contradictory-pixel-count", d => edit(d, "current-comparisons.json", r => r[0].differentPixels = 1), "COMPARISON_RECORD"],
    ["missing-diff-image", d => fs.unlinkSync(path.join(d, "current-diff", image)), "MISSING_EVIDENCE"],
    ["missing-legacy-results", d => fs.unlinkSync(path.join(d, "legacy-old/results.json")), "MISSING_EVIDENCE"],
    ["duplicate-legacy-condition", d => edit(d, "legacy-old/results.json", r => r[1] = r[0]), "LEGACY_RESULTS"],
    ["missing-control-results", d => fs.unlinkSync(path.join(d, "controls/results.json")), "MISSING_EVIDENCE"],
    ["failed-control", d => edit(d, "controls/results.json", r => r[2].status = "FAIL"), "CONTROL_RESULTS"],
    ["missing-boundary-results", d => fs.unlinkSync(path.join(d, "boundaries/results.json")), "MISSING_EVIDENCE"],
    ["incomplete-boundary-verdicts", d => edit(d, "boundaries/results.json", r => r.controls.pop()), "BOUNDARY_RESULTS"],
    ["missing-review-results", d => fs.unlinkSync(path.join(d, "review-replay/results.json")), "MISSING_EVIDENCE"],
    ["failed-review", d => edit(d, "review-replay/results.json", r => r.status = "FAIL"), "REPLAY_RESULTS"],
    ["capture-after-parent", d => edit(d, "current/capture.json", r => r.finished = new Date(Date.parse(summary.finished) + 1000).toISOString()), "TIME"],
    ["relabelled-edge-region", d => edit(d, "boundaries/results.json", r => r.controls[0].region.x++), "BOUNDARY_RESULTS"],
    ["missing-review-mutation", d => fs.unlinkSync(path.join(d, "review-replay/mutation.json")), "MISSING_EVIDENCE"],
  ];
  function edit(dir, file, mutate) { const target = path.join(dir, file), r = JSON.parse(fs.readFileSync(target)); mutate(r); fs.writeFileSync(target, JSON.stringify(r, null, 2)); }
  for (const [name, mutate, code] of artifactCases) {
    const dir = fixture(name, JSON.parse(original), true); mutate(dir);
    const modified = {
      "missing-image": "current/" + image, "corrupt-image": "current/" + image, "stale-image": "current/" + image,
      "stale-capture-id": "current/capture.json", "missing-comparison-file": "current-comparisons.json",
      "incomplete-comparison-verdicts": "current-comparisons.json", "contradictory-pixel-count": "current-comparisons.json",
      "missing-diff-image": "current-diff/" + image, "missing-legacy-results": "legacy-old/results.json",
      "duplicate-legacy-condition": "legacy-old/results.json", "missing-control-results": "controls/results.json",
      "failed-control": "controls/results.json", "missing-boundary-results": "boundaries/results.json",
      "incomplete-boundary-verdicts": "boundaries/results.json", "missing-review-results": "review-replay/results.json",
      "failed-review": "review-replay/results.json",
      "capture-after-parent": "current/capture.json", "relabelled-edge-region": "boundaries/results.json",
      "missing-review-mutation": "review-replay/mutation.json",
    }[name];
    const caseOut = path.join(out, name); fs.mkdirSync(caseOut, { recursive: true });
    const file = path.join(dir, modified), exists = fs.existsSync(file);
    const recipe = { baseSummarySha256: results.baseSummarySha256,
      reconstruction: "Copy the complete base artifact; use input-summary.json; replace/delete the listed path and apply recorded mtime. This overlay is not standalone complete evidence.",
      modifiedPath: modified, exists, sha256: exists ? sha(fs.readFileSync(file)) : null, mtimeMs: exists ? fs.statSync(file).mtimeMs : null };
    if (exists) { const target = path.join(caseOut, "input-overrides", modified); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(file, target); }
    fs.writeFileSync(path.join(caseOut, "input-recipe.json"), JSON.stringify(recipe, null, 2));
    const { row, report } = invoke(name, cli, dir);
    assert.equal(row.code, 1); assert.equal(report.status, "FAIL"); assert.equal(report.error.code, code, name + ": " + report.error.message);
    assert(report.checks.some(c => c.status === "FAIL") && report.checks.some(c => c.status === "NOT_RUN"));
    recorded(row, `incomplete/interrupted evidence rejected ${code}, exit 1`);
  }
  assert.equal(sha(fs.readFileSync(path.join(base, "summary.json"))), results.baseSummarySha256, "base input must remain unchanged");
  // Explicit workflow-only countercontrol: prove a CLI test assertion failure
  // reaches the real CI step, without modifying product or accepted evidence.
  if (process.env.KANBAN_AUDIT_TEST_FORCE_FAILURE === "1") throw new Error("intentional audit CLI test failure for CI propagation");
  results.status = "PASS"; results.exitCode = 0;
} catch (error) {
  results.status = "FAIL"; results.exitCode = 1; results.error = error.stack; console.error(error); process.exitCode = 1;
} finally {
  results.finished = new Date().toISOString(); save();
  console.log(JSON.stringify({ status: results.status, cases: results.cases.length, exitCode: results.exitCode, error: results.error }, null, 2));
}
