"use strict";
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { conditions, key } = require("./kanban-scenarios.cjs");
const { validateCapture, validateComparisons } = require("./kanban-contract.cjs");
const { sha, read, compare, policy } = require("./kanban-image.cjs");
const repo = path.resolve(__dirname, "../..");
const oldHead = "3b90ddbb77787b759c014a24d99f05ca98dda89f";
const reviewHead = "e40d92bcc97fa1bf214b0d613aac2d144fd2138f";
const sourceFiles = ["exhibits.css", "exhibits.js", "index.html"];
// Recognize the immutable comparison contract, not equality with today's HEAD.
const profiles = {
  "7a55f06d2ee1d9a33e7fccb3f9031f949fcd02177de42164563f29286aa845ec": "legacy-crop-v1",
  "37e6f1c50302e01da50abde23a3244bcaed7677e395411e7c478b4ebc9017f18": "full-raster-v2",
};
const controlNames = ["valid current capture", "valid image comparison verdicts", "comparison not executed",
  "missing comparison", "duplicate comparison", "missing verdict", "actual child exit 7", "missing condition",
  "duplicate condition", "target HEAD mismatch", "target tree mismatch", "stale run token", "old result timestamp",
  "missing comparison image record", "font size changed after Undo", "missing", "corrupt", "stale-image",
  "clipped-suffix", "missing baseline"];
function need(ok, code, message) {
  if (!ok) { const e = new Error(`[${code}] ${message}`); e.code = code; throw e; }
}
function object(v, name) { need(v !== null && typeof v === "object" && !Array.isArray(v), "STRUCTURE", name + " must be an object"); }
function hash(v, name, n = 40) { need(typeof v === "string" && new RegExp(`^[0-9a-f]{${n}}$`).test(v), "IDENTITY", name + " must be a complete hash"); }
function uuid(v, name) { need(typeof v === "string" && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(v), "IDENTITY", name + " must be a UUID"); }
function time(v, name) { need(typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v)), "TIME", name + " must be an ISO timestamp"); return Date.parse(v); }
function exact(actual, expected, code, name) {
  try { assert.deepEqual(actual, expected); } catch { need(false, code, name + " does not match the required complete set/value"); }
}
function git(...args) { return execFileSync("git", args, { cwd: repo, maxBuffer: 8e6 }); }
function commit(head, tree, name) {
  hash(head, name + " HEAD"); hash(tree, name + " tree");
  try {
    need(git("cat-file", "-t", head).toString().trim() === "commit", "GIT_IDENTITY", name + " is not a commit");
    need(git("rev-parse", head + "^{tree}").toString().trim() === tree, "GIT_IDENTITY", name + " tree mismatch");
  } catch (e) { if (e.code === "GIT_IDENTITY") throw e; need(false, "GIT_IDENTITY", name + " is unavailable in local Git history"); }
}
function json(dir, file) {
  const target = path.join(dir, file);
  need(fs.existsSync(target) && fs.statSync(target).isFile(), "MISSING_EVIDENCE", "required file missing: " + file);
  try { return JSON.parse(fs.readFileSync(target, "utf8")); }
  catch { need(false, "EVIDENCE_JSON", "invalid JSON: " + file); }
}
function png(file) {
  need(fs.existsSync(file) && fs.statSync(file).isFile(), "MISSING_EVIDENCE", "required PNG missing: " + file);
  try { return read(file); } catch (e) { need(false, "PNG_EVIDENCE", "corrupt PNG: " + file + "; " + e.message); }
}
function child(v, name) {
  object(v, name);
  exact(Object.keys(v).sort(), ["code", "signal", "timedOut"], "CHILD_RESULT", name + " completion fields");
  need(v.code === 0 && v.signal === null && v.timedOut === false && !v.error, "CHILD_RESULT", name + " must record successful completion, no signal/timeout/error");
}
function labels(rows, expected, name) {
  need(Array.isArray(rows), "STRUCTURE", name + " must be an array");
  exact(rows.map(r => r && r.label).sort(), [...expected].sort(), "RUN_SET", name + " requires each known label exactly once");
}
function summaryContract(s) {
  object(s, "summary");
  need(s.status === "PASS", "SUMMARY_STATUS", "input summary is not successful acceptance evidence");
  need(s.exitCode === 0 && !s.error, "SUMMARY_EXIT", "PASS summary requires exitCode 0 and no error");
  const start = time(s.started, "summary.started"), end = time(s.finished, "summary.finished");
  need(end >= start, "TIME", "summary finishes before it starts");
  uuid(s.runId, "summary.runId"); commit(s.harnessHead, s.harnessTree, "harness");
  const contractHash = sha(git("show", `${s.harnessHead}:apps/v11/kanban-contract.cjs`)), profile = profiles[contractHash];
  need(profile, "UNSUPPORTED_PROFILE", "archived comparison contract is not a supported immutable profile");
  labels(s.runs, ["current", "old"], "summary.runs");
  const ids = [s.runId];
  for (const run of s.runs) {
    object(run, "run"); object(run.source, run.label + ".source"); object(run.identity, run.label + ".identity");
    commit(run.source.head, run.source.tree, run.label + " source");
    const required = [...sourceFiles, ...(git("show", `${run.source.head}:apps/v11/index.html`).toString().includes('src="wave1.js"') ? ["wave1.css", "wave1.js"] : []), ...(git("show", `${run.source.head}:apps/v11/index.html`).toString().includes('src="wave2.js"') ? ["wave2.css", "wave2.js"] : [])].sort();
    exact(Object.keys(run.source.files || {}).sort(), required, "SOURCE_FILES", run.label + " target file set");
    for (const name of required) {
      hash(run.source.files[name], name + " SHA256", 64);
      need(sha(git("show", `${run.source.head}:apps/v11/${name}`)) === run.source.files[name], "SOURCE_FILES", run.label + " source checksum mismatch: " + name);
    }
    exact([run.identity.targetHead, run.identity.targetTree], [run.source.head, run.source.tree], "IDENTITY", run.label + " source/identity");
    uuid(run.identity.runId, run.label + " identity.runId"); ids.push(run.identity.runId);
    need(Number.isSafeInteger(run.identity.started) && run.identity.started >= start && run.identity.started <= end, "TIME", run.label + " identity.start outside parent interval");
    child(run.child, run.label + " capture child");
    if (run.label === "current") exact([run.source.head, run.source.tree], [s.harnessHead, s.harnessTree], "IDENTITY", "current source/harness");
    else { need(run.source.head === oldHead, "IDENTITY", "old source is not the fixed real defect commit"); child(run.legacyChild, "old legacy child"); }
  }
  need(new Set(ids).size === 3, "IDENTITY", "parent/current/old run UUIDs must be distinct");
  labels(s.comparisons, ["current", "old"], "summary.comparisons");
  for (const r of s.comparisons) need(r.total === 48 && Number.isInteger(r.failed) && r.failed >= (r.label === "old" ? 4 : 0) && r.failed <= 48 && (r.label !== "current" || r.failed === 0), "COMPARISON_COUNT", "summary comparison counts are inconsistent");
  need(s.controls === 20, "CONTROL_COUNT", "summary must record all 20 original controls");
  if (profile === "full-raster-v2") {
    exact(s.boundaryControls, { normalAccepted: 48, suffixRejected: 48, edgeControls: 192 }, "BOUNDARY_COUNT", "summary boundary completion");
    exact(s.reviewReplay, { status: "PASS", oldFalseAcceptances: 4, newImageRejections: 4 }, "REPLAY_COUNT", "summary review completion");
  }
  return { profile, start, end, contractHash };
}
function captures(s, dir) {
  const result = {};
  for (const label of ["current", "old"]) {
    const run = s.runs.find(r => r.label === label), cap = json(dir, label + "/capture.json"), log = path.join(dir, label, "child.log");
    need(fs.existsSync(log) && fs.statSync(log).size > 0, "CHILD_LOG", label + " child log missing/empty");
    try { validateCapture(cap, path.join(dir, label), run.identity, run.child); }
    catch (e) { need(false, "CAPTURE", label + " invalid capture: " + e.message); }
    need(Date.parse(cap.finished) <= Date.parse(s.finished), "TIME", label + " capture finishes after parent");
    result[label] = cap;
  }
  need(Date.parse(result.current.finished) <= s.runs.find(r => r.label === "old").identity.started,
    "TIME", "old run starts before the sequential current capture finishes");
  return result;
}
function priority(rows) {
  for (const engine of ["chromium", "webkit"]) for (const label of ["todo", "doing"])
    need(rows.find(r => r.condition === `${engine}-375-dark-2` && r.label === label)?.status === "FAIL", "OLD_PRIORITY", "real old priority image must be rejected");
}
function recordedRows(rows, actualDir, diffDir, baseline, temp, legacy = false) {
  try { validateComparisons(rows); } catch (e) { need(false, "COMPARISON_RECORD", e.message); }
  fs.mkdirSync(temp, { recursive: true });
  const base = json(baseline, "manifest.json");
  for (const row of rows) {
    const file = `${row.condition}-${row.label}.png`, b = base.images.find(i => i.file === file);
    need(b, "COMPARISON_RECORD", "comparison image not in approved reference");
    const p = png(path.join(baseline, file)).png, roi = legacy ? b.roi : { x: 0, y: 0, width: p.width, height: p.height };
    exact(row.roi, roi, "COMPARISON_RECORD", file + " recorded ROI");
    const r = compare(path.join(actualDir, file), path.join(baseline, file), roi, path.join(temp, file));
    const status = (legacy ? r.differentPixels <= policy.maxDifferentPixels : r.status === "PASS") ? "PASS" : "FAIL";
    for (const field of ["differentPixels", "actualSha256", "baselineSha256", "diffSha256"])
      need(row[field] === r[field], "COMPARISON_RECORD", file + " stale/contradictory " + field);
    need(row.status === status, "COMPARISON_RECORD", file + " contradictory verdict");
    if (!legacy) {
      for (const field of ["dimensionMismatch", "actualDimensions", "baselineDimensions", "reason"])
        exact(row[field], r[field], "COMPARISON_RECORD", file + " " + field);
    }
    need(sha(png(path.join(diffDir, file)).bytes) === row.diffSha256, "COMPARISON_RECORD", file + " stale stored diff");
  }
}
function inputComparisons(s, dir, baseline, out, profile) {
  for (const label of ["current", "old"]) {
    const rows = json(dir, label + "-comparisons.json");
    recordedRows(rows, path.join(dir, label), path.join(dir, label + "-diff"), baseline, path.join(out, "recorded-" + label), profile === "legacy-crop-v1");
    const count = s.comparisons.find(r => r.label === label);
    need(rows.length === count.total && rows.filter(r => r.status === "FAIL").length === count.failed, "COMPARISON_COUNT", label + " summary/verdict count mismatch");
    if (label === "current") need(rows.every(r => r.status === "PASS" && r.differentPixels === 0), "CURRENT_IMAGES", "recorded current images are not all normal");
    else priority(rows);
  }
}
function legacy(s, dir) {
  const rows = json(dir, "legacy-old/results.json"); need(Array.isArray(rows), "LEGACY_RESULTS", "legacy results must be an array");
  rows.forEach(r => object(r, "legacy result"));
  exact(rows.map(r => key({ ...r, engine: r.name })), conditions.map(key), "LEGACY_RESULTS", "legacy 24 condition keys");
  const start = s.runs.find(r => r.label === "old").identity.started;
  for (const r of rows) {
    need(r.status === "PASS" && r.font === (r.zoom === 2 ? "32px" : "16px") && r.page?.client === r.width && r.page.scroll <= r.page.client, "LEGACY_RESULTS", "legacy verdict/font/overflow mismatch");
    const file = path.join(dir, "legacy-old", `${key({ ...r, engine: r.name })}.png`);
    need(fs.existsSync(file) && fs.statSync(file).mtimeMs >= start - 2, "LEGACY_RESULTS", "legacy screenshot missing/stale"); png(file);
  }
  const log = path.join(dir, "legacy-old/child.log"); need(fs.existsSync(log) && fs.statSync(log).size > 0, "CHILD_LOG", "legacy child log missing/empty");
  return rows.length;
}
function originalControls(dir) {
  const rows = json(dir, "controls/results.json"); need(Array.isArray(rows), "CONTROL_RESULTS", "controls must be an array");
  rows.forEach(r => object(r, "control result"));
  exact(rows.map(r => r.name), controlNames, "CONTROL_RESULTS", "original 20 control names");
  for (let i = 0; i < rows.length; i++) {
    const expected = i < 2 ? "accepted" : "rejected", r = rows[i];
    need(r.expected === expected && r.observed === expected && r.status === "PASS" && (expected !== "rejected" || typeof r.error === "string" && r.error.length > 0), "CONTROL_RESULTS", r.name + " incomplete/contradictory outcome");
  }
  return rows.length;
}
function p3Records(s, dir, baseline, out, profile) {
  if (profile === "legacy-crop-v1") return { historical: "predates P3 records; their mandatory reexecution below still required" };
  const b = json(dir, "boundaries/results.json"), base = json(baseline, "manifest.json");
  need(b.status === "PASS" && b.normalAccepted === 48 && b.suffixRejected === 48 && b.edgeControls === 192, "BOUNDARY_RESULTS", "boundary result completion mismatch");
  need(Array.isArray(b.audits), "BOUNDARY_RESULTS", "boundary image records missing");
  b.audits.forEach(r => object(r, "boundary image record"));
  exact(b.audits.map(a => a.file), base.images.map(a => a.file), "BOUNDARY_RESULTS", "48 audited image keys");
  for (const a of b.audits) {
    const p = png(path.join(baseline, a.file)).png;
    exact(a.fullRegion, { x: 0, y: 0, width: p.width, height: p.height }, "BOUNDARY_RESULTS", a.file + " full region");
    need(a.sha256 === base.images.find(i => i.file === a.file).sha256, "BOUNDARY_RESULTS", "boundary reference identity mismatch");
    png(path.join(dir, "boundaries", "overlay-" + a.file));
  }
  const edges = ["suffix", "prefix", "top", "bottom"];
  const { layout, regions, erase } = require("./kanban-boundary-controls.cjs");
  need(Array.isArray(b.controls), "BOUNDARY_RESULTS", "192 boundary verdicts missing");
  b.controls.forEach(r => object(r, "boundary verdict"));
  exact(b.controls.map(c => `${c.file}|${c.edge}`), base.images.flatMap(i => edges.map(e => `${i.file}|${e}`)), "BOUNDARY_RESULTS", "192 edge keys");
  for (const c of b.controls) {
    need(c.status === "FAIL" && c.dimensionMismatch === false && c.changedPixels > 2 && c.differentPixels === c.changedPixels, "BOUNDARY_RESULTS", c.file + " erasure lacks meaningful image difference");
    exact(c.roi, b.audits.find(a => a.file === c.file).fullRegion, "BOUNDARY_RESULTS", "boundary comparison must use full raster");
    const reference = layout(png(path.join(baseline, c.file)).png), region = regions(reference.bounds)[c.edge];
    exact(c.region, region, "BOUNDARY_RESULTS", c.file + " erased edge region");
    const expected = erase(path.join(dir, "current", c.file), path.join(out, "expected-" + c.edge + "-" + c.file), region, reference.background);
    for (const field of ["sha256", "changedPixels", "changedPixelsAnyChannel", "background"])
      exact(c[field], expected[field], "BOUNDARY_RESULTS", c.file + " erased pixels/" + field);
    png(path.join(dir, "boundaries", c.edge, c.file));
    const r = compare(path.join(dir, "boundaries", c.edge, c.file), path.join(baseline, c.file), c.roi, path.join(out, c.edge + "-" + c.file));
    need(!r.dimensionMismatch, "BOUNDARY_RESULTS", "boundary control changed PNG dimensions");
    for (const field of ["status", "differentPixels", "actualSha256", "baselineSha256", "diffSha256"])
      need(c[field] === r[field], "BOUNDARY_RESULTS", c.file + " stale boundary " + field);
    need(sha(png(path.join(dir, "boundaries", c.edge, "diff-" + c.file)).bytes) === c.diffSha256, "BOUNDARY_RESULTS", "stored boundary diff mismatch");
  }
  recordedRows(b.normal, path.join(dir, "current"), path.join(dir, "boundaries/normal-diff"), baseline, path.join(out, "boundary-normal"));
  const run = s.runs.find(r => r.label === "current"), suffix = json(dir, "boundaries/suffix-capture/capture.json");
  validateCapture(suffix, path.join(dir, "boundaries/suffix-capture"), run.identity, run.child);
  recordedRows(b.suffixResults, path.join(dir, "boundaries/suffix-capture"), path.join(dir, "boundaries/suffix-capture-diff"), baseline, path.join(out, "boundary-suffix"));
  need(b.suffixResults.every(r => r.status === "FAIL" && !r.dimensionMismatch && r.differentPixels > 2), "BOUNDARY_RESULTS", "all 48 suffixes must fail");
  const replay = json(dir, "review-replay/results.json");
  need(replay.status === "PASS" && replay.reviewedHead === reviewHead, "REPLAY_RESULTS", "review replay source/status mismatch");
  exact(Object.keys(replay.sourceHashes || {}).sort(), ["kanban-contract.cjs", "kanban-image.cjs", "kanban-scenarios.cjs"], "REPLAY_RESULTS", "reviewed source set");
  for (const [file, hash] of Object.entries(replay.sourceHashes)) need(sha(git("show", `${reviewHead}:apps/v11/${file}`)) === hash, "REPLAY_RESULTS", "reviewed source hash mismatch");
  const replayCap = json(dir, "review-replay/capture/capture.json"); validateCapture(replayCap, path.join(dir, "review-replay/capture"), run.identity, run.child);
  const mutations = json(dir, "review-replay/mutation.json");
  need(Array.isArray(mutations.mutations) && mutations.mutations.length === 4, "REPLAY_RESULTS", "four review mutation records required");
  exact(mutations.mutations.map(m => m.file), ["chromium-375-dark-2-todo.png", "chromium-375-dark-2-doing.png", "webkit-375-dark-2-todo.png", "webkit-375-dark-2-doing.png"], "REPLAY_RESULTS", "review mutation keys");
  for (const m of mutations.mutations) {
    const ref = base.images.find(i => i.file === m.file), source = path.join(dir, "current", m.file);
    const region = { x: 106, y: ref.roi.y, width: 6, height: ref.roi.height };
    const expected = erase(source, path.join(out, "expected-review-" + m.file), region, layout(png(source).png).background);
    for (const field of ["region", "sha256", "changedPixels", "changedPixelsAnyChannel", "background"])
      exact(m[field], expected[field], "REPLAY_RESULTS", "exact review mutation " + field);
    need(sha(png(path.join(dir, "review-replay/capture", m.file)).bytes) === m.sha256, "REPLAY_RESULTS", "review mutated PNG identity mismatch");
  }
  recordedRows(replay.before, path.join(dir, "review-replay/capture"), path.join(dir, "review-replay/before-diff"), baseline, path.join(out, "review-before"), true);
  recordedRows(replay.after, path.join(dir, "review-replay/capture"), path.join(dir, "review-replay/after-diff"), baseline, path.join(out, "review-after"));
  need(replay.before.every(r => r.status === "PASS" && r.differentPixels === 0), "REPLAY_RESULTS", "old review false acceptance missing");
  exact(replay.after.filter(r => r.status === "FAIL").map(r => [r.condition, r.label, r.differentPixels]), [["chromium-375-dark-2", "todo", 12], ["chromium-375-dark-2", "doing", 13], ["webkit-375-dark-2", "todo", 19], ["webkit-375-dark-2", "doing", 26]], "REPLAY_RESULTS", "exact four review rejections");
  return { auditedImages: 48, edgeVerdicts: 192, reviewRejections: 4 };
}
module.exports = { need, exact, json, summaryContract, captures, inputComparisons, legacy, originalControls, p3Records, priority, controlNames };
