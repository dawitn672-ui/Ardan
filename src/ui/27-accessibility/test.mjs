// Accessibility: axe-core WCAG 2.2 AA plus best practice on the title, creation and three game screens.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export default {
  async accessibilityAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length})`));
    const found = [];
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); }); found.push(...(await scan()).map(v => 'title:' + v));
    await pg.evaluate(() => UI.A.newLife()); found.push(...(await scan()).map(v => 'create:' + v));
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); UI.crRandomize(); UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false; });
    for (const t of ['life', 'people', 'realm']) { await pg.evaluate(t => { UI.tab = t; UI.render(); }, t); found.push(...(await scan()).map(v => t + ':' + v)); }
    const h1 = await pg.evaluate(() => document.querySelectorAll('h1').length);
    // axe itself tries to fetch the font stylesheet to read it; the page's CSP refusing that is correct, not a page bug
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length && h1 === 1, detail: `${found.length} axe violations${found.length ? ': ' + found.slice(0, 6).join(', ') : ''}; h1 count on the game screen ${h1}` };
  },
};
