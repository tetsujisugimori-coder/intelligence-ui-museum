"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  crypto = require("node:crypto"),
  assert = require("node:assert/strict"),
  { execFileSync, spawn } = require("node:child_process");
const {
    validateCapture,
    compareCapture,
    validateComparisons,
  } = require("./kanban-contract.cjs"),
  { sha } = require("./kanban-image.cjs");
const repo = path.resolve(__dirname, "../.."),
  out = path.resolve(
    process.env.EVIDENCE_DIR || path.join(repo, ".work/kanban-ci"),
  ),
  baseline = path.resolve(
    process.env.KANBAN_BASELINE_DIR || path.join(__dirname, "kanban-baselines"),
  );
assert(!fs.existsSync(out), "Evidence directory must be new");
fs.mkdirSync(out, { recursive: true });
const work = path.join(repo, ".work");
fs.mkdirSync(work, { recursive: true });
const temp = fs.mkdtempSync(path.join(work, "kanban-")),
  old = "3b90ddbb77787b759c014a24d99f05ca98dda89f",
  fixed = "1b4befda87c97bd70da2c1d6065427034d12660a";
let site;
const git = (...args) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const server = http.createServer((req, res) => {
  const name =
    new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
  if (!["index.html", "exhibits.js", "exhibits.css", "wave1.js", "wave1.css", "wave2.js", "wave2.css"].includes(name) || !fs.existsSync(path.join(site,name))) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader(
    "Content-Type",
    name.endsWith(".js")
      ? "text/javascript; charset=utf-8"
      : name.endsWith(".css")
        ? "text/css; charset=utf-8"
        : "text/html; charset=utf-8",
  );
  res.end(fs.readFileSync(path.join(site, name)));
});
function source(head) {
  const dir = path.join(temp, head);
  fs.mkdirSync(dir);
  const files = {};
  const html = git("show", `${head}:apps/v11/index.html`);
  const required = ["index.html", "exhibits.js", "exhibits.css", ...(html.includes('src="wave1.js"') ? ["wave1.js", "wave1.css"] : []), ...(html.includes('src="wave2.js"') ? ["wave2.js", "wave2.css"] : [])];
  for (const name of required) {
    const data = execFileSync("git", ["show", `${head}:apps/v11/${name}`], {
      cwd: repo,
      maxBuffer: 5e6,
    });
    fs.writeFileSync(path.join(dir, name), data);
    files[name] = sha(data);
  }
  site = dir;
  return { head, tree: git("rev-parse", head + "^{tree}"), files };
}
async function child(script, dir, identity) {
  fs.mkdirSync(dir, { recursive: true });
  const log = fs.openSync(path.join(dir, "child.log"), "wx");
  let timedOut = false;
  try {
    return await new Promise((resolve, reject) => {
      const p = spawn(process.execPath, [path.join(__dirname, script)], {
        cwd: repo,
        env: {
          ...process.env,
          MUSEUM_URL: `http://127.0.0.1:${server.address().port}/`,
          EVIDENCE_DIR: dir,
          KANBAN_RUN_ID: identity.runId,
          KANBAN_TARGET_HEAD: identity.targetHead,
          KANBAN_TARGET_TREE: identity.targetTree,
        },
        stdio: ["ignore", log, log],
      });
      const timer = setTimeout(() => {
        timedOut = true;
        p.kill();
      }, 240000);
      p.on("error", (e) => {
        clearTimeout(timer);
        reject(e);
      });
      p.on("close", (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal, timedOut });
      });
    });
  } finally {
    fs.closeSync(log);
  }
}
(async () => {
  const summary = {
    started: new Date().toISOString(),
    harnessHead: git("rev-parse", "HEAD"),
    harnessTree: git("rev-parse", "HEAD^{tree}"),
    runId: crypto.randomUUID(),
    runs: [],
    comparisons: [],
  };
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const targets =
      process.env.KANBAN_BOOTSTRAP === "1"
        ? [["fixed", fixed]]
        : [
            ["current", git("rev-parse", "HEAD")],
            ["old", old],
          ];
    for (const [label, head] of targets) {
      const src = source(head),
        identity = {
          runId: crypto.randomUUID(),
          targetHead: head,
          targetTree: src.tree,
          started: Date.now(),
        };
      const dir = path.join(out, label);
      const result = await child("kanban-capture.cjs", dir, identity),
        capture = JSON.parse(fs.readFileSync(path.join(dir, "capture.json")));
      const run = { label, source: src, identity, child: result };
      summary.runs.push(run);
      if (label === "current" && process.env.KANBAN_INJECT_REVIEW_ERASURE === "1")
        require("./kanban-boundary-controls.cjs").injectReviewErasure(
          capture, dir, path.join(out, "intentional-review-erasure.json"),
        );
      validateCapture(capture, dir, identity, result);
      if (label === "old") {
        const legacy = path.join(out, "legacy-old"),
          r = await child("kanban-zoom-test.cjs", legacy, identity);
        run.legacyChild = r;
        assert.equal(r.code, 0);
        assert.equal(r.signal, null);
        assert.equal(r.timedOut, false);
        const rows = JSON.parse(
          fs.readFileSync(path.join(legacy, "results.json")),
        );
        assert.equal(rows.length, 24);
        assert(rows.every((r) => r.status === "PASS"));
      }
      if (label !== "fixed") {
        const comparisons = compareCapture(
          capture,
          dir,
          baseline,
          path.join(out, `${label}-diff`),
        );
        fs.writeFileSync(
          path.join(out, `${label}-comparisons.json`),
          JSON.stringify(comparisons, null, 2),
        );
        validateComparisons(comparisons);
        summary.comparisons.push({
          label,
          total: comparisons.length,
          failed: comparisons.filter((x) => x.status === "FAIL").length,
        });
        if (label === "current") {
          assert(
            comparisons.every((x) => x.status === "PASS"),
            "current label paint regression",
          );
          summary.controls = require("./kanban-controls.cjs").controls(
            capture,
            dir,
            identity,
            result,
            baseline,
            path.join(out, "controls"),
          ).length;
          summary.boundaryControls = require("./kanban-boundary-controls.cjs").boundaryControls(
            capture, dir, identity, result, baseline, path.join(out, "boundaries"),
          );
          summary.reviewReplay = require("./kanban-review-replay.cjs").replay(
            capture, dir, identity, result, baseline, path.join(out, "review-replay"),
          );
        } else
          for (const engine of ["chromium", "webkit"])
            for (const label of ["todo", "doing"])
              assert.equal(
                comparisons.find(
                  (c) =>
                    c.condition === `${engine}-375-dark-2` && c.label === label,
                )?.status,
                "FAIL",
                "real old clipping must be rejected",
              );
      }
    }
    summary.status =
      process.env.KANBAN_BOOTSTRAP === "1"
        ? "CAPTURE_ONLY_NOT_ACCEPTANCE"
        : "PASS";
    if (process.env.KANBAN_BOOTSTRAP === "1") process.exitCode = 2;
  } catch (e) {
    summary.status = "FAIL";
    summary.error = e.stack;
    console.error(e);
    process.exitCode = 1;
  } finally {
    if (server.listening) {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
    summary.finished = new Date().toISOString();
    summary.exitCode = process.exitCode || 0;
    fs.writeFileSync(
      path.join(out, "summary.json"),
      JSON.stringify(summary, null, 2),
    );
    console.log(JSON.stringify(summary, null, 2));
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
