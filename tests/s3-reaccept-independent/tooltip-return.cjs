// Independent S3-1 Tooltip keyboard return regression. No product/SDK mutation.
// Each engine uses fresh pages. Keep the initial RED JSON in evidence unchanged.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '../..');
const root = path.join(repo, '.work/v10/dist');
const out = path.resolve(process.env.REVIEW_OUT || path.join(repo, '.work/s3-tooltip-regression'));
const pw = require(path.join(repo, 'tools/stage-a-browser/node_modules/playwright'));
const engines = (process.env.S3_ENGINES || 'chromium,webkit').split(',');
const repeats = Number(process.env.S3_REPEATS || 20);
if (!Number.isSafeInteger(repeats) || repeats < 1 ||
    !engines.length || new Set(engines).size !== engines.length ||
    engines.some(engine => !['chromium', 'webkit'].includes(engine))) {
  throw Error('S3_REPEATS must be a positive safe integer and S3_ENGINES must contain unique supported engines');
}
if (fs.existsSync(out)) throw Error('fresh review output required');
fs.mkdirSync(out, { recursive: true });
const frames = p => p.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
const serve = http.createServer((request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
    response.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    response.end(fs.readFileSync(file));
  } catch { response.writeHead(404).end(); }
});
const snapshot = (p, selector) => p.locator(selector).evaluate(element => ({
  active: document.activeElement === element,
  focusVisible: element.matches(':focus-visible'),
  hasFocus: document.hasFocus(),
  scrollY: window.scrollY,
  tipVisible: (() => {
    const tooltip = document.querySelector('[role="tooltip"]');
    if (!tooltip) return false;
    const style = getComputedStyle(tooltip), rect = tooltip.getBoundingClientRect();
    return style.display !== 'none' && style.visibility === 'visible' && rect.width > 0 && rect.height > 0;
  })(),
  events: window.__tipEvents,
}));
(async () => {
  await new Promise(done => serve.listen(0, '127.0.0.1', done));
  const rows = [], errors = [];
  try {
    for (const engine of engines) {
      const opts = engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE ?
        { headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE } : { headless: true };
      let browser;
      try {
        browser = await pw[engine].launch(opts);
        for (let i = 0; i < repeats; i++) {
          const row = { engine, browserVersion: browser.version(), index: i, errors: [] };
          const page = await browser.newPage({ viewport: { width: 375, height: 1000 } });
          page.on('pageerror', error => row.errors.push(String(error)));
          try {
            await page.goto('http://127.0.0.1:' + serve.address().port + '/?theme=dark&text=200');
            await page.bringToFront();
            const trigger = page.locator('#Tooltip .stage button');
            const tip = page.getByRole('tooltip');
            await trigger.waitFor({ state: 'visible' });
            await page.evaluate(() => {
              window.__tipEvents = [];
              for (const type of ['scroll', 'focusin', 'focusout', 'keydown']) {
                document.addEventListener(type, event =>
                  window.__tipEvents.push({
                    type, time: performance.now(), key: event.key,
                    active: document.activeElement.tagName, scrollY: window.scrollY,
                  }), true);
              }
              new MutationObserver(() => window.__tipEvents.push({
                type: 'mutation', time: performance.now(),
                tip: !!document.querySelector('[role=tooltip]'), scrollY: window.scrollY,
              })).observe(document.body, { subtree: true, childList: true });
            });
            await trigger.evaluate(element => element.scrollIntoView({ block: 'center' }));
            await frames(page);
            await trigger.focus();
            await tip.waitFor({ state: 'visible' });
            row.initialVisible = true;
            await page.keyboard.press('Tab');
            await tip.waitFor({ state: 'hidden' });
            await frames(page);
            row.afterTab = await page.evaluate(() => ({
              activeTag: document.activeElement.tagName,
              tipVisible: !!document.querySelector('[role=tooltip]'),
            }));
            await page.keyboard.press('Shift+Tab');
            await tip.waitFor({ state: 'visible', timeout: 2000 });
            await frames(page);
            row.return = await snapshot(page, '#Tooltip .stage button');
            row.returnPass = row.return.active && row.return.focusVisible &&
              row.return.hasFocus && row.return.tipVisible;
            if (i === 0) await page.screenshot({ path: path.join(out, engine + '-return.png') });
            // Escape must still close when focus remains on the trigger.
            await page.keyboard.press('Escape');
            await tip.waitFor({ state: 'hidden' });
            row.afterEscape = await snapshot(page, '#Tooltip .stage button');
            row.escapePass = row.afterEscape.active && !row.afterEscape.tipVisible;
            if (i === 0) await page.screenshot({ path: path.join(out, engine + '-escape.png') });
            // A fresh focus cycle must reopen, without a fixed sleep.
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            await tip.waitFor({ state: 'visible', timeout: 2000 });
            await frames(page);
            row.afterRefocus = await snapshot(page, '#Tooltip .stage button');
            row.refocusPass = row.afterRefocus.active && row.afterRefocus.tipVisible;
            await page.keyboard.press('Tab');
            await tip.waitFor({ state: 'hidden' });
            row.blurPass = !await tip.isVisible();
            await trigger.hover();
            await tip.waitFor({ state: 'visible', timeout: 2000 });
            row.hoverPass = await tip.isVisible();
            await page.mouse.move(0, 0);
            await tip.waitFor({ state: 'hidden' });
            row.hoverExitPass = !await tip.isVisible();
            // Pointer focus/activation must retain the SDK's normal click dismissal.
            await trigger.click();
            await frames(page);
            row.afterPointerClick = await snapshot(page, '#Tooltip .stage button');
            await page.mouse.move(0, 0);
            await frames(page);
            row.afterPointerLeave = await snapshot(page, '#Tooltip .stage button');
            row.pointerPass = !row.afterPointerClick.tipVisible && !row.afterPointerLeave.tipVisible;
            // Native keyboard activation dismisses without removing trigger focus.
            row.activationPass = true;
            for (const key of ['Enter', 'Space']) {
              await page.keyboard.press('Tab');
              await page.keyboard.press('Shift+Tab');
              await tip.waitFor({ state: 'visible', timeout: 2000 });
              await page.keyboard.press(key);
              await tip.waitFor({ state: 'hidden', timeout: 2000 });
              const afterActivation = await snapshot(page, '#Tooltip .stage button');
              row.activationPass &&= afterActivation.active && !afterActivation.tipVisible;
            }
            // Escape may be followed by a normal, new hover interaction.
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            await tip.waitFor({ state: 'visible', timeout: 2000 });
            await page.keyboard.press('Escape');
            await tip.waitFor({ state: 'hidden', timeout: 2000 });
            await trigger.hover();
            await tip.waitFor({ state: 'visible', timeout: 2000 });
            row.escapeHoverPass = await tip.isVisible();
            await page.mouse.move(0, 0);
            await tip.waitFor({ state: 'hidden', timeout: 2000 });
            row.escapeHoverPass &&= !await tip.isVisible();
            row.pass = row.returnPass && row.escapePass && row.refocusPass &&
              row.blurPass && row.hoverPass && row.hoverExitPass && row.pointerPass &&
              row.activationPass && row.escapeHoverPass && row.errors.length === 0;
            if (i === 0 || !row.pass) {
              row.image = engine + '-' + i + '.png';
              await page.screenshot({ path: path.join(out, row.image) });
            }
          } catch (error) {
            row.pass = false;
            row.error = String(error);
          } finally {
            rows.push(row);
            await page.close();
          }
        }
      } catch (error) {
        errors.push({ engine, error: String(error) });
      } finally {
        if (browser) await browser.close();
      }
    }
  } finally {
    serve.close();
    const status = !errors.length && rows.length === engines.length * repeats &&
      rows.every(row => row.pass) ? 'PASS' : 'FAIL';
    const result = {
      status, engines, repeats, rows, errors, testedAt: new Date().toISOString(),
      checkoutHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
      sourceHashes: Object.fromEntries(['src/main.tsx', 'src/main.css', 'src/select-focus-return.ts', 'package.json', 'package-lock.json'].map(file =>
        [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(repo, '.work/v10', file))).digest('hex')])),
      scope: 'fresh pages; keyboard return after scroll, Escape, blur, refocus, hover, pointer click, Enter/Space activation and Escape-to-hover; no SDK mutation',
    };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ status, engines, count: rows.length,
      success: rows.filter(row => row.pass).length, errors }));
    process.exitCode = status === 'PASS' ? 0 : 1;
  }
})();
