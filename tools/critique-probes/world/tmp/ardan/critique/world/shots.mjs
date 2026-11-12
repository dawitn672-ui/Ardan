import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const browser = await chromium.launch();
const out = {};
for (const [w, h] of [[420, 900], [1366, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.setDefaultTimeout(600000);
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 180000 });
  for (const [tag, status] of [['peasant', 'peasant'], ['noble', 'noble']]) {
    await page.evaluate(([st]) => { A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: st, sex: 'M', startAge: 0 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, [status]);
    await page.waitForTimeout(500);
    // real UI: open the Family place
    const fam = page.locator('[data-a="group"][data-v="family"]:visible').first();
    if (await fam.count()) await fam.click(); else await page.evaluate(() => { UI.tab = 'people'; UI.render(); });
    await page.waitForTimeout(600);
    const tab = await page.evaluate(() => UI.tab);
    if (tab !== 'people') await page.evaluate(() => { UI.tab = 'people'; UI.render(); });
    await page.waitForTimeout(400);
    const txt = await page.evaluate(() => document.body.innerText);
    out[`${tag}-${w}`] = { tab, len: txt.length, text: txt.slice(0, 6000) };
    await page.screenshot({ path: `/tmp/ardan/critique/world/shots/newborn-${tag}-people-${w}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
const fs = await import('node:fs');
fs.writeFileSync('/tmp/ardan/critique/world/out/shots.json', JSON.stringify(out, null, 1));
console.log('ok', Object.keys(out));
