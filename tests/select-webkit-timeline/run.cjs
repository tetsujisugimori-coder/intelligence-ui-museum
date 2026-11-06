// Read-only investigation for Issue #28. No SDK or product mutations.
// Distinguish native keyboard Tab, direct locator.focus(), and the legacy
// focus -> Tab -> Shift+Tab sequence. Never force-click or hide a failure.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');

const repo = path.resolve(__dirname, '../..');
const mode = process.env.DIAG_MODE || 'tab';
const engine = process.env.DIAG_ENGINE || 'webkit';
const repeats = Number(process.env.DIAG_REPEATS || '20');
const root = path.resolve(process.env.APP_ROOT || path.join(repo, '.work/v10'));
const out = path.resolve(process.env.DIAG_OUT || path.join(repo, '.work/select-webkit-timeline'));
const sourceFiles = ['src/main.tsx', 'src/main.css', 'src/select-focus-return.ts', 'package.json', 'package-lock.json'];
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const focusModes = ['tab', 'direct', 'legacy'];
const prelude = process.env.DIAG_PRELUDE || 'none';
const views = prelude === 's3' ? ['inherited'] : ['visible', 'offscreen'];
const paces = ['rapid', 'settled'];

function verdict(row) {
  const reasons = [];
  if (!row.states || !row.states.focus || !row.states.focus.focusOnTrigger) reasons.push('FOCUS_NOT_ON_TRIGGER');
  if (!row.states || !row.states.beforeClick || !row.states.beforeClick.option?.exists) reasons.push('OPTION_NOT_MOUNTED');
  else {
    if (!row.states.beforeClick.option.inViewport) reasons.push('OPTION_OUTSIDE_VIEWPORT');
    if (!row.states.beforeClick.option.hitTest) reasons.push('OPTION_NOT_HIT_TESTABLE');
  }
  if (!row.states?.beforeClick?.popup?.exists) reasons.push('POPUP_GEOMETRY_MISSING');
  if (row.error) reasons.push('ACTION_FAILED');
  if (!row.states || !row.states.afterClick || row.states.afterClick.value !== 'b') reasons.push('VALUE_NOT_UPDATED');
  if (!row.states || !row.states.afterClick || !row.states.afterClick.focusOnTrigger) reasons.push('FOCUS_NOT_RETURNED');
  if (!Array.isArray(row.timeline?.events) || row.timeline.events.length === 0 ||
      !Array.isArray(row.timeline?.snapshots) || row.timeline.snapshots.length < 4 ||
      row.timeline.overflow) reasons.push('TIMELINE_INCOMPLETE');
  if (row.pageerrors?.length) reasons.push('PAGE_ERROR');
  if (row.unexpectedConsole?.length) reasons.push('UNEXPECTED_CONSOLE');
  return reasons;
}
if (process.argv.includes('--selftest')) {
  const example = {
    states: { focus: { focusOnTrigger: true },
      beforeClick: { option: { exists: true, inViewport: true, hitTest: true }, popup: { exists: true } },
      afterClick: { value: 'b', focusOnTrigger: true } },
    timeline: { events: [{ type: 'focusin' }], snapshots: [{},{},{},{}], overflow: false },
    pageerrors: [], unexpectedConsole: []
  };
  assert.deepEqual(verdict(example), [], 'valid fully visible run');
  for (const [name, mutate, expected] of [
    ['offscreen', x => { x.states.beforeClick.option.inViewport = false; }, 'OPTION_OUTSIDE_VIEWPORT'],
    ['obscured', x => { x.states.beforeClick.option.hitTest = false; }, 'OPTION_NOT_HIT_TESTABLE'],
    ['focus-lost', x => { x.states.focus.focusOnTrigger = false; }, 'FOCUS_NOT_ON_TRIGGER'],
    ['empty', x => { x.timeline.events = []; }, 'TIMELINE_INCOMPLETE'],
    ['no-click', x => { x.error = 'Timeout'; }, 'ACTION_FAILED'],
    ['pageerror', x => { x.pageerrors.push('uncaught'); }, 'PAGE_ERROR'],
    ['missing-popup', x => { x.states.beforeClick.popup.exists = false; }, 'POPUP_GEOMETRY_MISSING']
  ]) {
    const copy = structuredClone(example);
    mutate(copy);
    assert(verdict(copy).includes(expected), name + ' must be rejected');
  }
  console.log('Issue #28 diagnostic oracle: normal + 6 negative controls PASS');
  process.exit(0);
}
assert(focusModes.includes(mode), 'DIAG_MODE must be tab/direct/legacy');
assert(['none', 's3'].includes(prelude), 'DIAG_PRELUDE must be none/s3');
assert(['webkit','chromium'].includes(engine), 'DIAG_ENGINE must be webkit/chromium');
assert(Number.isSafeInteger(repeats) && repeats > 0 && repeats <= 50, 'positive bounded DIAG_REPEATS required');
assert(!fs.existsSync(out), 'evidence destination must be fresh');
fs.mkdirSync(out, { recursive: true });
const pw = require(path.join(repo, 'tools/stage-a-browser/node_modules/playwright'));
const dist = path.join(root, 'dist');
assert(fs.existsSync(path.join(dist, 'index.html')), 'isolated built product required');
const identity = {
  head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
  tree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: repo, encoding: 'utf8' }).trim(),
  sourceRef: process.env.DIAG_SOURCE_REF || 'current',
  sourceSha256: Object.fromEntries(sourceFiles.map(file => [
    file, sha(fs.readFileSync(path.join(root, file)))
  ])),
  platform: os.platform(), release: os.release(), node: process.version,
  mode, engine, repeats, views, paces, prelude,
};
const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const filename = path.resolve(dist, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
    if (!filename.startsWith(dist + path.sep)) { response.writeHead(403).end(); return; }
    response.setHeader('Content-Type', filename.endsWith('.js') ? 'text/javascript' : filename.endsWith('.css') ? 'text/css' : filename.endsWith('.html') ? 'text/html' : 'application/octet-stream');
    response.end(fs.readFileSync(filename));
  } catch { response.writeHead(404).end(); }
});
const rows = [];
const timeout = 2400;
function addProbe() {
  const trigger = document.querySelector('#official-select')?.closest('[role=button]');
  if (!trigger) throw Error('Select trigger not mounted');
  const events = [], snapshots = [];
  let overflow = false;
  const emit = (type, data = {}) => {
    if (events.length >= 3500) { overflow = true; return; }
    events.push({ ms: performance.now(), type, ...data });
  };
  const descriptor = el => el ? {
    tag: el.tagName || String(el.nodeName), id: el.id || '',
    role: el.getAttribute?.('role') || '', text: el.textContent?.trim().slice(0, 42) || ''
  } : null;
  const info = el => {
    if (!el) return { exists: false };
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const inViewport = r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 &&
      r.right <= innerWidth && r.bottom <= innerHeight;
    const hit = x >= 0 && x < innerWidth && y >= 0 && y < innerHeight ? document.elementFromPoint(x, y) : null;
    return { exists: true, rect: r.toJSON(), inViewport,
      hitTest: !!hit && (hit === el || el.contains(hit)),
      hit: descriptor(hit),
      style: { position: s.position, transform: s.transform, visibility: s.visibility,
        display: s.display, overflowX: s.overflowX, overflowY: s.overflowY,
        pointerEvents: s.pointerEvents }
    };
  };
  const take = phase => {
    const option = [...document.querySelectorAll('[role=option]')]
      .find(el => el.textContent?.includes('カード')) || null;
    let popup = option?.closest('[role=listbox]') || document.querySelector('[role=listbox]');
    let popupLocator = popup ? 'role=listbox' : 'none';
    if (!popup && option) {
      for (let parent = option.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const computed = getComputedStyle(parent);
        if (parent.hasAttribute('data-radix-popper-content-wrapper') ||
            computed.position === 'fixed' || computed.position === 'absolute') {
          popup = parent;
          popupLocator = 'positioned-ancestor';
          break;
        }
      }
    }
    if (!popup && option?.parentElement) {
      popup = option.parentElement;
      popupLocator = 'parent-fallback';
    }
    const state = { phase, ms: performance.now(), scrollX, scrollY,
      documentScroll: { top: document.documentElement.scrollTop, height: document.documentElement.scrollHeight },
      viewport: { width: innerWidth, height: innerHeight,
        vvOffsetTop: visualViewport?.offsetTop ?? null, vvPageTop: visualViewport?.pageTop ?? null },
      active: descriptor(document.activeElement), focusOnTrigger: document.activeElement === trigger,
      focusVisible: trigger.matches(':focus-visible'), expanded: trigger.getAttribute('aria-expanded'),
      value: document.querySelector('#official-select')?.value,
      trigger: info(trigger), option: info(option), popup: info(popup), popupLocator };
    snapshots.push(state);
    return state;
  };
  for (const type of ['focusin', 'focusout', 'keydown', 'keyup', 'pointerdown', 'pointerup']) {
    document.addEventListener(type, ev => emit(type, { key: ev.key, target: descriptor(ev.target),
      active: descriptor(document.activeElement), scrollY }), true);
  }
  document.addEventListener('scroll', ev => emit('scroll', { target: descriptor(ev.target), scrollY }), true);
  window.addEventListener('scroll', () => emit('window-scroll', { scrollY }), { passive: true });
  window.addEventListener('resize', () => emit('window-resize', { w: innerWidth, h: innerHeight }));
  new MutationObserver(records => {
    for (const record of records) {
      const el = record.target;
      const selectRelated = el === trigger || el.closest?.('#Select') ||
        el.closest?.('[role=listbox]') || el.closest?.('[role=option]') ||
        el.querySelector?.('[role=option]') || el.querySelector?.('[role=listbox]');
      if (selectRelated) emit('mutation', {
        kind: record.type, attr: record.attributeName || null,
        node: descriptor(el), expanded: trigger.getAttribute('aria-expanded'), scrollY
      });
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true,
    attributeFilter: ['aria-expanded', 'aria-activedescendant', 'style', 'class', 'data-highlight', 'data-state'] });
  window.__selectTimeline = { events, snapshots, take,
    collect: () => ({ events, snapshots, overflow }) };
  emit('installed', { trigger: descriptor(trigger) });
  take('installed');
}
const raf2 = p => p.evaluate(() => new Promise(done =>
  requestAnimationFrame(() => requestAnimationFrame(done))));
async function trial(browser, id, view, pace, baseUrl) {
  const row = { id, mode, view, pace, states: {}, images: [], pageerrors: [], unexpectedConsole: [],
    knownConsole: [], browserVersion: browser.version(), created: new Date().toISOString() };
  const context = await browser.newContext({ viewport: { width: 375, height: 1000 }, colorScheme: 'dark' });
  const page = await context.newPage();
  page.setDefaultTimeout(4500);
  page.on('pageerror', error => row.pageerrors.push({ utc: new Date().toISOString(), error: String(error) }));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const entry = { utc: new Date().toISOString(), text: msg.text() };
    // Never erase known CSP warnings; record them separately from unrelated errors.
    if (/KaTeX_[A-Za-z0-9_-]+\.woff2?/.test(msg.text()) && /font-src/.test(msg.text())) row.knownConsole.push(entry);
    else row.unexpectedConsole.push(entry);
  });
  const filename = prefix => path.join(out, id + '-' + prefix + '.png');
  const take = async phase => {
    const snapshot = await page.evaluate(label => window.__selectTimeline.take(label), phase);
    row.states[phase] = snapshot;
    return snapshot;
  };
  try {
    await page.goto(baseUrl + '/?theme=dark&text=200', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const t = page.locator('#Select .stage [role=button]');
    const option = page.getByRole('option', { name: 'カード', exact: true });
    await t.waitFor({ state: 'visible', timeout: 5000 });
    if (prelude === 's3') row.preludeState = await require('./replay-prelude.cjs').priorS3Actions(page);
    await page.evaluate(addProbe);
    await page.evaluate(where => {
      const trigger = document.querySelector('#official-select').closest('[role=button]');
      if (where === 'visible') trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
      else if (where === 'offscreen') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
    }, view);
    await take('start');
    if (mode === 'tab') {
      // An explicit preceding focus anchor, then a genuine keyboard Tab to Select.
      await page.locator('#Select input[type=checkbox]').focus();
      await take('anchor');
      await page.keyboard.press('Tab');
    } else {
      await t.focus();
      if (mode === 'legacy') {
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
      }
    }
    row.states.focus = await take('focus');
    if (pace === 'settled') { await raf2(page); await take('focus-settled'); }
    await page.keyboard.press('Space');
    await take('space');
    await option.waitFor({ state: 'attached', timeout });
    await take('mounted');
    if (pace === 'settled') { await raf2(page); await take('popup-settled'); }
    const before = await take('beforeClick');
    // A screenshot can delay or settle a race. Keep rapid trials unmodified;
    // capture a representative frame only in the separately marked settled lane.
    if (pace === 'settled' && id.endsWith('-01')) {
      await page.screenshot({ path: filename('pre-click') });
      row.images.push(path.basename(filename('pre-click')));
    }
    try { await option.click({ timeout }); }
    catch (error) { row.error = String(error); }
    await take('after-click-immediate');
    await raf2(page);
    row.states.afterClick = await take('afterClick');
  } catch (error) {
    row.error = [row.error, String(error)].filter(Boolean).join('; ');
  } finally {
    try { row.states.final = await take('final'); } catch (e) { row.collectError = String(e); }
    try { row.timeline = await page.evaluate(() => window.__selectTimeline.collect()); }
    catch (e) { row.timeline = null; row.collectError = String(e); }
    row.reasons = verdict(row);
    row.status = row.reasons.length ? 'FAIL' : 'PASS';
    if (row.status !== 'PASS') {
      try {
        await page.screenshot({ path: filename('failure') });
        row.images.push(path.basename(filename('failure')));
      } catch (e) { row.screenshotError = String(e); }
    }
    fs.writeFileSync(path.join(out, id + '.json'), JSON.stringify(row, null, 2));
    await context.close();
  }
  return row;
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let browser, launchError = null;
  try {
    browser = await pw[engine].launch({ headless: true });
    for (const view of views) for (const pace of paces) for (let n = 1; n <= repeats; n++) {
      const id = [mode, view, pace, String(n).padStart(2, '0')].join('-');
      try { rows.push(await trial(browser, id, view, pace, base)); }
      catch (e) { rows.push({ id, mode, view, pace, status: 'UNKNOWN', error: String(e), reasons: ['UNHANDLED'] }); }
      console.log(JSON.stringify({ id, status: rows.at(-1).status, reasons: rows.at(-1).reasons }));
    }
  } catch (e) { launchError = String(e); }
  finally {
    if (browser) await browser.close();
    server.close();
    const expected = views.length * paces.length * repeats;
    const counts = { pass: rows.filter(r => r.status === 'PASS').length,
      fail: rows.filter(r => r.status === 'FAIL').length,
      unknown: rows.filter(r => r.status === 'UNKNOWN').length };
    const complete = !launchError && rows.length === expected;
    const status = !complete ? 'INCOMPLETE' : (counts.fail || counts.unknown ? 'FAIL' : 'PASS');
    const result = { status, issue: 28, identity, expected, actual: rows.length,
      counts, launchError, ended: new Date().toISOString(),
      conditions: { viewport: '375x1000', theme: 'dark', rootScale: '200%',
        focusMode: mode, prelude, origin: 'native app lab; Playwright WebKit is not Safari' },
      rows: rows.map(r => ({ id: r.id, status: r.status, reasons: r.reasons, error: r.error,
        focus: r.states?.focus?.focusOnTrigger,
        beforeClick: { scrollY: r.states?.beforeClick?.scrollY,
          trigger: r.states?.beforeClick?.trigger?.rect,
          option: r.states?.beforeClick?.option?.rect,
          popup: r.states?.beforeClick?.popup?.rect,
          inViewport: r.states?.beforeClick?.option?.inViewport,
          hitTest: r.states?.beforeClick?.option?.hitTest } })),
      limits: ['This is diagnostic, not full S3-1 acceptance', 'Playwright WebKit is not native Safari',
        'Failed and incomplete cases remain failed; no forced click or arbitrary sleep'] };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
    const sums = {};
    for (const file of fs.readdirSync(out).sort()) if (fs.statSync(path.join(out,file)).isFile()) sums[file] = sha(fs.readFileSync(path.join(out,file)));
    fs.writeFileSync(path.join(out, 'SHA256SUMS.json'), JSON.stringify(sums, null, 2));
    console.log(JSON.stringify({ status, expected, actual: rows.length, counts, launchError }));
    process.exitCode = status === 'PASS' ? 0 : 1;
  }
})().catch(e => { console.error(e); process.exitCode = 1; });