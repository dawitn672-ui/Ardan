const { chromium } = require('/opt/node-tools/node_modules/playwright');
const SHOTS = '/tmp/ardan/critique/art/shots/';
async function open(width = 1366, height = 768, opts = {}) {
  const b = opts.browser || await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: opts.reducedMotion || 'no-preference', hasTouch: width < 600, isMobile: false });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e).slice(0, 300)));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
  await pg.goto('file:///tmp/ardan/snap/index.html');
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  return { b, ctx, pg, errs };
}
async function enter(pg, o) {
  await pg.evaluate((o) => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, o);
}
async function shot(pg, name, opts = {}) { await pg.screenshot(Object.assign({ path: SHOTS + name + '.png' }, opts)); return SHOTS + name + '.png'; }
module.exports = { open, enter, shot, SHOTS, chromium };
