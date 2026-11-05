"use strict";
// Strict archived-evidence acceptance. No browser launch, no diagnostic PASS.
const fs = require("node:fs"), path = require("node:path");
const { compareCapture, validateComparisons } = require("./kanban-contract.cjs");
const { sha } = require("./kanban-image.cjs");
const C = require("./kanban-audit-contract.cjs");
const phases = ["summary-contract", "capture-evidence", "recorded-comparisons", "legacy-evidence", "original-control-records", "p3-records",
  "current-recalculation", "old-recalculation", "original-control-reexecution", "boundary-reexecution", "review-reexecution"];
const [input, output] = process.argv.slice(2);
const audit = { kind: "archived evidence acceptance; NOT new browser execution", contract: "kanban-audit-acceptance-v1",
  status: "FAIL", started: new Date().toISOString(), finished: null, runs: [], checks: phases.map(name => ({ name, status: "NOT_RUN" })) };
let out, active;
function save() { if (out) fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(audit, null, 2)); }
function phase(name, action) {
  active = audit.checks.find(c => c.name === name); active.status = "RUNNING"; save();
  const result = action(); active.status = "PASS"; active.result = result; save(); return result;
}
try {
  C.need(input && output && process.argv.length === 4, "ARGUMENTS", "artifact directory and NEW output directory required");
  const artifact = fs.realpathSync(path.resolve(input)), target = path.resolve(output);
  C.need(!fs.existsSync(target), "OUTPUT_EXISTS", "refusing to overwrite previous audit evidence");
  C.need(target !== artifact && !target.startsWith(artifact + path.sep), "OUTPUT_LOCATION", "output must be outside immutable input evidence");
  fs.mkdirSync(target, { recursive: true }); out = target; save();
  const baseline = path.join(__dirname, "kanban-baselines"), summary = C.json(artifact, "summary.json");
  audit.inputHarnessHead = summary?.harnessHead; audit.inputHarnessTree = summary?.harnessTree;
  audit.inputSummarySha256 = sha(fs.readFileSync(path.join(artifact, "summary.json")));
  const profile = phase("summary-contract", () => C.summaryContract(summary)); audit.profile = profile.profile;
  let caps;
  phase("capture-evidence", () => { caps = C.captures(summary, artifact); return { current: 24, old: 24, statesPerCondition: 4, labelsPerCondition: 2 }; });
  phase("recorded-comparisons", () => { C.inputComparisons(summary, artifact, baseline, out, profile.profile); return { current: 48, old: 48 }; });
  phase("legacy-evidence", () => ({ conditions: C.legacy(summary, artifact) }));
  phase("original-control-records", () => ({ controls: C.originalControls(artifact) }));
  phase("p3-records", () => C.p3Records(summary, artifact, baseline, out, profile.profile));
  for (const label of ["current", "old"]) phase(label + "-recalculation", () => {
    const rows = compareCapture(caps[label], path.join(artifact, label), baseline, path.join(out, label + "-diff")); validateComparisons(rows);
    if (label === "current") C.need(rows.every(r => r.status === "PASS" && r.differentPixels === 0), "CURRENT_IMAGES", "normal 48 images must be accepted");
    else C.priority(rows);
    fs.writeFileSync(path.join(out, label + "-comparisons.json"), JSON.stringify(rows, null, 2));
    const r = { label, source: summary.runs.find(r => r.label === label).source, accepted: rows.filter(r => r.status === "PASS").length, rejected: rows.filter(r => r.status === "FAIL").length };
    audit.runs.push(r); return r;
  });
  const current = summary.runs.find(r => r.label === "current");
  audit.existingControls = phase("original-control-reexecution", () => {
    const rows = require("./kanban-controls.cjs").controls(caps.current, path.join(artifact, "current"), current.identity, current.child, baseline, path.join(out, "existing-controls"));
    C.exact(rows.map(r => r.name), C.controlNames, "COMPLETION", "reexecuted original controls");
    C.need(rows.every(r => r.status === "PASS"), "COMPLETION", "original controls incomplete"); return rows.length;
  });
  audit.boundaries = phase("boundary-reexecution", () => {
    const r = require("./kanban-boundary-controls.cjs").boundaryControls(caps.current, path.join(artifact, "current"), current.identity, current.child, baseline, path.join(out, "boundaries"));
    C.exact(r, { normalAccepted: 48, suffixRejected: 48, edgeControls: 192 }, "COMPLETION", "reexecuted boundary counts"); return r;
  });
  audit.reviewReplay = phase("review-reexecution", () => {
    const r = require("./kanban-review-replay.cjs").replay(caps.current, path.join(artifact, "current"), current.identity, current.child, baseline, path.join(out, "review-replay"));
    C.exact(r, { status: "PASS", oldFalseAcceptances: 4, newImageRejections: 4 }, "COMPLETION", "reexecuted review counts"); return r;
  });
  C.need(audit.checks.length === phases.length && audit.checks.every(c => c.status === "PASS"), "COMPLETION", "a mandatory audit phase did not finish");
  audit.status = "PASS"; audit.exitCode = 0;
} catch (e) {
  audit.status = "FAIL"; audit.exitCode = 1; audit.error = { code: e.code || "AUDIT_FAILURE", phase: active?.name || "arguments/input", message: e.message, stack: e.stack };
  if (active?.status === "RUNNING") active.status = "FAIL";
  console.error(JSON.stringify(audit.error, null, 2)); process.exitCode = 1;
} finally {
  audit.finished = new Date().toISOString(); save();
  console.log(JSON.stringify({ status: audit.status, exitCode: audit.exitCode, error: audit.error,
    checks: audit.checks.map(c => ({ name: c.name, status: c.status })), runs: audit.runs, boundaries: audit.boundaries, reviewReplay: audit.reviewReplay }, null, 2));
}
