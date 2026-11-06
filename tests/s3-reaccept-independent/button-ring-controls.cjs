// Real-product negative controls for the Button paint oracle. These are explicitly
// two-row probes, not entries in the formal 32-condition normal matrix.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const out = path.resolve(process.env.REVIEW_OUT || path.join(repo, '.work/button-ring-controls'));
assert(!fs.existsSync(out), 'fresh output directory required');
fs.mkdirSync(out, { recursive: true });
const file = path.join(__dirname, 'button-ring.cjs');
const cases = [
  ['half-stage-clip', '#Button .stage{clip-path:inset(-20px -20px -20px 80px)}', 'paint'],
  ['left-one-pixel', '#Button .stage{clip-path:inset(-20px -20px -20px -6px)}', 'paint'],
  ['outline-removed', '#Button .stage button,#Button .stage button::after{outline:none!important;box-shadow:none!important}', 'geometry'],
  ['opaque-left-overlay', '#Button .stage{position:relative}#Button .stage::after{content:"";position:absolute;left:-20px;top:-20px;bottom:-20px;width:100px;background:#fff;z-index:99;pointer-events:none}', 'cardinal'],
];
const results = [];
for (const [name, css, reason] of cases) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace('await p.bringToFront();', 'await p.bringToFront(); await p.evaluate(css=>{const style=document.createElement("style");style.textContent=css;document.head.append(style)},' + JSON.stringify(css) + ');');
  code = code.replace('for (const width of [320, 375, 390, 1280])', 'for (const width of [375])')
    .replace("for (const theme of ['light', 'dark'])", "for (const theme of ['light'])")
    .replace('for (const text of [100, 200])', 'for (const text of [100])')
    .replace('engines.length * 16', 'engines.length * 1');
  const runner = `const Module=require('node:module'),path=require('node:path');const file=${JSON.stringify(file)};const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(${JSON.stringify(code)},file);`;
  const child = spawnSync(process.execPath, ['-e', runner], {
    cwd: repo, encoding: 'utf8', timeout: 180000,
    env: { ...process.env, REVIEW_OUT: path.join(out, name), S3_ENGINES: 'chromium,webkit' },
  });
  fs.writeFileSync(path.join(out, name + '.stdout.txt'), child.stdout || '');
  fs.writeFileSync(path.join(out, name + '.stderr.txt'), child.stderr || '');
  const result = { name, exit: child.status, signal: child.signal, error: child.error?.message };
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(out, name, 'results.json'), 'utf8'));
    assert.equal(child.status, 1, 'the broken product must exit 1');
    assert.equal(raw.status, 'FAIL');
    assert.equal(raw.errors.length, 0);
    assert.equal(raw.rows.length, 2);
    for (const row of raw.rows) {
      if (reason === 'paint') {
        assert.equal(row.status, 'FAIL');
        assert(row.paint.missingAllClipPixels > 0, 'clipped pixels must be detected');
      } else if (reason === 'cardinal') {
        assert.equal(row.status, 'FAIL');
        assert.equal(row.paint.cardinal.left.painted, false, 'opaque left overlay must block original left paint');
      } else {
        assert.equal(row.status, 'UNKNOWN');
        assert(row.error.includes('preserve the original 3px outline and 4px offset'));
      }
    }
    result.status = 'PASS';
  } catch (error) { result.status = 'FAIL'; result.reason = String(error); }
  results.push(result);
}
const status = results.every(result => result.status === 'PASS') ? 'PASS' : 'FAIL';
fs.writeFileSync(path.join(out, 'controls.json'), JSON.stringify({ status, results, testedAt: new Date().toISOString(), scope: '4 real-product negative controls x 2 engines; not the normal matrix' }, null, 2));
console.log(JSON.stringify({ status, results }));
process.exitCode = status === 'PASS' ? 0 : 1;
