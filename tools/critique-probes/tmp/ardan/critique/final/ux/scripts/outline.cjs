// A compact outline of every page for an adult noble on a phone: section headings, words, screens, controls.
const { chromium, open, measure, HELPERS } = require('./lib.cjs');
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, 420, 900, { touch: true, mobile: true });
  await page.evaluate(HELPERS);
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); T.play(4); T.show('life'); const c = document.querySelector('#mo-cut'); if (c) c.remove(); });
  await page.waitForTimeout(500);
  const groups = await page.evaluate(() => UI.GROUPS.map(g => ({ k: g.k, subs: g.subs.map(s => s[0] + '=' + s[1]) })));
  console.log('GROUPS', JSON.stringify(groups));
  const tabs = await page.evaluate(() => ['life', 'story', 'goals', 'you', 'path', 'holdings', 'war', 'people', 'legacy', 'realm', 'world', 'book', 'atlas', 'codex']);
  for (const t of tabs) {
    const ok = await page.evaluate(t => { try { UI.ov = null; UI.tab = t; UI.render(); const c = document.querySelector('#mo-cut'); if (c) c.remove(); return UI.tab; } catch (e) { return 'err'; } }, t);
    await page.waitForTimeout(350);
    const m = await measure(page);
    const o = await page.evaluate(() => {
      const tb = document.querySelector('#tabbody');
      const heads = [...tb.querySelectorAll('h2,h3,h4,summary,.sec-h,.card-h,.fold-h')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.innerText.replace(/\s+/g, ' ').trim().slice(0, 34)).filter(Boolean);
      const closed = [...tb.querySelectorAll('details')].filter(d => !d.open).length, opened = [...tb.querySelectorAll('details')].filter(d => d.open).length;
      return { heads: [...new Set(heads)].slice(0, 26), closed, opened, first: tb.innerText.replace(/\s+/g, ' ').slice(0, 150) };
    });
    console.log(`\n[${t}→${ok}] screens ${m.docScreens} words ${m.wordsSeen}/${m.wordsPage} controls ${m.controlsSeen}/${m.controls} folds open ${o.opened} closed ${o.closed} long titles ${m.longTitles}\n  heads: ${o.heads.join(' | ')}\n  first: ${o.first}`);
  }
  await browser.close();
})();
