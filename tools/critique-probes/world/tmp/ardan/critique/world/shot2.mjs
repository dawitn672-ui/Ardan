import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
const page = await ctx.newPage(); page.setDefaultTimeout(600000);
await page.goto('file:///tmp/ardan/snap/index.html');
await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
await page.evaluate(() => {
  A.newGame({ seed: 71, race: 'human', realm: 'POL-14', status: 'peasant', sex: 'M', startAge: 18 });
  const pc = A.pc(); A.enlist(pc); A.advance(31);
  let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
  UI.screen = 'game'; UI.tab = 'people'; UI.ov = null; UI.render();
});
await page.waitForTimeout(800);
const el = page.locator('text=Former superior').first();
if (await el.count()) await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/ardan/critique/world/shots/soldier-captain-former-superior-420.png' });
// codex peoples
await page.evaluate(() => { UI.tab = 'codex'; UI.render(); });
await page.waitForTimeout(500);
const t = await page.evaluate(() => document.body.innerText);
console.log(t.includes('Leaf People') ? 'codex shows Leaf People' : 'codex no Leaf People on first page');
await browser.close();
