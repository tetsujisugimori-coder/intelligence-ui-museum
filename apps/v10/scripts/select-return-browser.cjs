// S3-1-SELECT-RETURN: real-browser identity, lifecycle and fault probes.
// Run against an isolated fresh build; never mutate preserved evidence or SDK.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const crypto = require('node:crypto');
const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const pw = require(path.join(modules, 'playwright'));
const { focusPixels } = require('./stage2r-focus-pixels.cjs');
const root = path.resolve(process.env.APP_ROOT || process.cwd());
const out = path.resolve(process.env.EVIDENCE_DIR || 'evidence/select-return');
if (fs.existsSync(out)) throw Error('Evidence directory must be new: ' + out);
fs.mkdirSync(out, { recursive: true });
const baseline = process.env.SELECT_EXPECT === 'red';
const engines = (process.env.SELECT_ENGINES || 'chromium,webkit').split(',');
const conditions = [{ id: 'A', width: 320, theme: 'dark', text: 200 }, { id: 'B', width: 1280, theme: 'light', text: 100 }];
const ways = ['mouse', 'keyboard', 'escape'];
const rows = [], regressions = [], faults = [], failures = [];
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sourceFiles = ['src/main.tsx', 'src/main.css', 'src/select-focus-return.ts', 'package.json', 'package-lock.json'];
const identity = Object.fromEntries(sourceFiles.filter(f => fs.existsSync(path.join(root, f))).map(f => [f, hash(path.join(root, f))]));
function requireThat(ok, message) { if (!ok) throw Error(message); }
const trigger = p => p.locator('#official-select').locator('xpath=ancestor::*[@role="button"]');
const option = p => p.getByRole('option', { name: 'カード', exact: true });
async function frames(p) { await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function instrument(p) {
  await p.evaluate(() => {
    const t = document.getElementById('official-select').closest('[role=button]');
    window.probe = { trigger: t, events: [], calls: [], armed: false, fault: '', opens: 0, closes: 0 };
    const desc = e => e ? { tag: e.tagName, id: e.id, role: e.getAttribute?.('role'), text: e.textContent?.slice(0, 60) } : null;
    for (const type of ['focusin', 'focusout', 'keydown', 'pointerdown', 'pointerup']) document.addEventListener(type, e => {
      window.probe.events.push({ time: performance.now(), type, key: e.key, target: desc(e.target), active: desc(document.activeElement) });
    }, true);
    let open = false;
    new MutationObserver(() => {
      const next = t.getAttribute('aria-expanded') === 'true';
      if (next !== open) {
        window.probe[next ? 'opens' : 'closes']++;
        window.probe.events.push({ time: performance.now(), type: next ? 'open' : 'close', active: desc(document.activeElement) });
        open = next;
      }
    }).observe(t, { attributes: true, attributeFilter: ['aria-expanded'] });
    const original = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function(...args) {
      if (window.probe.armed && this === t) {
        const call = { time: performance.now(), target: desc(this), args, fault: window.probe.fault };
        window.probe.calls.push(call);
        if (window.probe.fault === 'disabled-return') return;
        if (window.probe.fault === 'wrong-target') return original.call(document.querySelector('#Button button'), ...args);
        if (window.probe.fault === 'duplicate') {
          original.apply(this, args);
          window.probe.calls.push({ ...call, injectedDuplicate: true });
        }
        const result = original.apply(this, args);
        if (window.probe.fault === 'body-after-close') this.blur();
        return result;
      }
      return original.apply(this, args);
    };
  });
}
async function snapshot(p) {
  return p.evaluate(() => {
    const t = window.probe.trigger, active = document.activeElement;
    const s = getComputedStyle(t), after = getComputedStyle(t, '::after');
    return { active: { tag: active?.tagName, id: active?.id, role: active?.getAttribute('role') },
      sameOpener: active === t, body: active === document.body, connected: t.isConnected,
      focusVisible: t.matches(':focus-visible'), expanded: t.getAttribute('aria-expanded'),
      value: document.getElementById('official-select')?.value,
      hasFocus: document.hasFocus(), visibility: document.visibilityState,
      style: { outline: s.outline, boxShadow: s.boxShadow, afterOutline: after.outline, afterShadow: after.boxShadow },
      rect: t.getBoundingClientRect().toJSON(), opens: window.probe.opens, closes: window.probe.closes,
      calls: window.probe.calls, events: window.probe.events };
  });
}
async function fresh(browser, c, url) {
  const p = await browser.newPage({ viewport: { width: c.width, height: 900 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e)));
  await p.goto(`${url}/?theme=${c.theme}&text=${c.text}`); await p.bringToFront();
  await instrument(p); return { p, errors };
}
async function open(p) {
  await trigger(p).focus(); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab');
  requireThat(await trigger(p).evaluate(e => e === document.activeElement), 'opener identity before open');
  const before = await snapshot(p);
  await p.keyboard.press('Space'); await option(p).waitFor({ state: 'visible' });
  await p.evaluate(() => { window.probe.armed = true; window.probe.calls = []; });
  return before;
}
async function close(p, way) {
  if (way === 'mouse') await option(p).click();
  else if (way === 'keyboard') { await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); }
  else await p.keyboard.press('Escape');
  await option(p).waitFor({ state: 'hidden' });
}
function verdict(s, expectedValue, errors) {
  const issues = [];
  if (!s.sameOpener) issues.push('WRONG_FOCUS');
  if (s.body) issues.push('BODY_FOCUS');
  if (s.value !== expectedValue) issues.push('WRONG_VALUE');
  if (s.calls.length !== 1) issues.push('RESTORE_COUNT');
  if (s.opens !== 1 || s.closes !== 1 || s.expanded !== 'false') issues.push('CLOSE_COUNT');
  if (!s.hasFocus || s.visibility !== 'visible') issues.push('DOCUMENT_INACTIVE');
  if (errors.length) issues.push('PAGE_ERROR');
  return { pass: !issues.length, issues };
}
async function normal(browser, engine, c, way, url, detailed = false) {
  const { p, errors } = await fresh(browser, c, url);
  const row = { engine, browser: browser.version(), condition: c, way };
  try {
    row.before = await open(p); row.menu = await snapshot(p); await close(p, way);
    try { await p.waitForFunction(() => document.activeElement === window.probe.trigger, null, { timeout: 2000 }); }
    catch { /* Record a failed product contract; do not convert this into a pass. */ }
    await frames(p); row.after = await snapshot(p); row.errors = errors;
    row.verdict = verdict(row.after, way === 'escape' ? 'a' : 'b', errors);
    if (detailed) {
      await trigger(p).scrollIntoViewIfNeeded();
      await p.screenshot({ path: path.join(out, `${engine}-${c.id}-${way}.png`) });
      if (!baseline && way !== 'mouse') {
        row.pixels = await focusPixels(p, trigger(p), modules, path.join(out, `${engine}-${c.id}-${way}-ring`));
        requireThat(row.after.focusVisible && row.pixels.pass, 'keyboard return ring');
      }
    }
    row.expectationMatched = baseline ? !row.verdict.pass && row.after.body && row.after.value === (way === 'escape' ? 'a' : 'b') : row.verdict.pass;
    requireThat(row.expectationMatched, `${engine}/${c.id}/${way}: ${row.verdict.issues}`);
  } catch (e) { row.error = String(e); failures.push(row.error); }
  finally { rows.push(row); await p.close(); }
}
async function negative(browser, engine, fault, url) {
  const { p, errors } = await fresh(browser, conditions[1], url);
  const row = { engine, fault };
  try {
    await open(p);
    await p.evaluate(f => {
      window.probe.fault = f;
      if (f === 'removed-opener' || f === 'recreated-opener') {
        const t = window.probe.trigger;
        if (f === 'recreated-opener') t.replaceWith(t.cloneNode(true)); else t.remove();
      }
      if (f === 'disabled-opener') { window.probe.trigger.setAttribute('aria-disabled', 'true'); window.probe.trigger.tabIndex = -1; }
    }, fault);
    await close(p, 'escape'); await frames(p); row.after = await snapshot(p); row.errors = errors;
    row.verdict = verdict(row.after, 'a', errors);
    const safety = ['removed-opener', 'recreated-opener', 'disabled-opener'].includes(fault);
    row.expectationMatched = safety ? row.after.calls.length === 0 && !row.after.sameOpener && errors.length === 0 : !row.verdict.pass;
    if (fault === 'duplicate') row.expectationMatched &&= row.verdict.issues.includes('RESTORE_COUNT');
    if (['disabled-return', 'wrong-target', 'body-after-close'].includes(fault)) row.expectationMatched &&= row.verdict.issues.includes('WRONG_FOCUS');
    requireThat(row.expectationMatched, `${engine}/negative/${fault}`);
  } catch (e) { row.error = String(e); failures.push(row.error); }
  finally { faults.push(row); await p.close(); }
}
async function regression(browser, engine, c, url) {
  const { p, errors } = await fresh(browser, c, url); const row = { engine, condition: c, checks: {} };
  const check = (k, v) => { row.checks[k] = !!v; requireThat(v, `${engine}/${c.id}/${k}`); };
  try {
    await open(p); await close(p, 'keyboard'); await frames(p);
    check('value-and-return', (await snapshot(p)).sameOpener && await p.locator('#official-select').inputValue() === 'b');
    await p.keyboard.press('Tab'); check('tab-leaves', !(await snapshot(p)).sameOpener);
    await p.keyboard.press('Shift+Tab'); check('shift-tab-returns', (await snapshot(p)).sameOpener);
    await p.keyboard.press('Space'); await option(p).waitFor({ state: 'visible' }); await close(p, 'escape'); await frames(p);
    check('escape-retains-value', (await snapshot(p)).sameOpener && await p.locator('#official-select').inputValue() === 'b');
    for (let i = 0; i < 8; i++) { await p.keyboard.press('Space'); await option(p).waitFor({ state: 'visible' }); await p.keyboard.press('ArrowUp'); await close(p, 'escape'); }
    check('rapid-repeat', (await snapshot(p)).sameOpener && (await snapshot(p)).closes === 10 && (await snapshot(p)).opens === 10);
    await p.keyboard.press('Space'); await option(p).waitFor({ state: 'visible' });
    await p.locator('#Select h2').click(); await option(p).waitFor({ state: 'hidden' }); await frames(p);
    check('outside-dismiss-no-steal', !(await snapshot(p)).sameOpener);
    await trigger(p).focus(); await p.keyboard.press('Space'); await option(p).waitFor({ state: 'visible' });
    await p.keyboard.press('Tab'); await frames(p);
    check('tab-from-menu-no-steal', !(await snapshot(p)).sameOpener);
    await p.keyboard.press('Escape'); await option(p).waitFor({ state: 'hidden' });
    const button = p.locator('#Button .stage button'); await button.click(); await button.focus(); await p.keyboard.press('Enter'); await p.keyboard.press('Space');
    check('button-inputs', (await p.locator('#Button output').innerText()).includes('実行回数：3'));
    await p.locator('#Button input').first().check(); check('button-disabled', await button.isDisabled());
    await p.locator('#Button input').first().uncheck(); await p.locator('#Button input').nth(1).check(); check('button-loading', await button.isDisabled());
    await p.locator('#Select input[type=checkbox]').check(); check('select-disabled', await trigger(p).getAttribute('aria-disabled') === 'true');
    await p.locator('#Select input[type=checkbox]').uncheck(); check('select-enabled-value', await p.locator('#official-select').inputValue() === 'b');
    check('no-pageerror', errors.length === 0); row.errors = errors; row.after = await snapshot(p);
  } catch (e) { row.error = String(e); failures.push(row.error); }
  finally { regressions.push(row); await p.close(); }
}
(async () => {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, 'dist', '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(path.join(root, 'dist') + path.sep)) { res.writeHead(403).end(); return; }
    try { res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream'); res.end(fs.readFileSync(file)); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const engine of engines) {
      const browser = await pw[engine].launch({ headless: true, ...(engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
      try {
        for (const c of conditions) for (const way of ways) await normal(browser, engine, c, way, url, true);
        if (!baseline) {
          for (const width of [320, 375, 390, 1280]) for (const theme of ['light', 'dark']) for (const text of [100, 200]) {
            const c = { id: `${width}-${theme}-${text}`, width, theme, text }; await normal(browser, engine, c, 'keyboard', url);
          }
          for (const fault of ['disabled-return', 'wrong-target', 'removed-opener', 'body-after-close', 'duplicate', 'recreated-opener', 'disabled-opener']) await negative(browser, engine, fault, url);
          for (const c of conditions) await regression(browser, engine, c, url);
        }
      } finally { await browser.close(); }
    }
  } catch (e) { failures.push(String(e)); }
  finally {
    server.close();
    const expected = engines.length * (baseline ? 6 : 22);
    const complete = rows.length === expected && (baseline || faults.length === engines.length * 7 && regressions.length === engines.length * 2);
    const status = !failures.length && complete ? 'PASS' : 'FAIL';
    const result = { status, exitCode: status === 'PASS' ? 0 : 1, mode: baseline ? 'RED-reproduction' : 'GREEN-and-controls', testedAt: new Date().toISOString(), expected, identity, engines, rows, faults, regressions, failures, limitations: ['CSS root 200% is not native OS text scaling', 'Playwright WebKit is not real Safari or VoiceOver', 'No full v10 acceptance or Stage 3 release decision'] };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(out, 'SHA256SUMS.json'), JSON.stringify(Object.fromEntries(fs.readdirSync(out).filter(f => f !== 'SHA256SUMS.json').map(f => [f, hash(path.join(out, f))])), null, 2));
    console.log(JSON.stringify({ status, expected, rows: rows.length, faults: faults.length, regressions: regressions.length, failures }));
    process.exitCode = result.exitCode;
  }
})();
