// At four desktop widths, with a long home, a large purse and a debt: the purse and the debt are whole, and the place
// is on screen (the longest name in the world may end in an ellipsis: at least 60 px of it).
export default {
  async tbFits(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const { HELPERS } = await import('../../tests/helpers.mjs');
    const out = [];
    for (const w of [1024, 1180, 1280, 1440]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      await p.evaluate(HELPERS);
      out.push(Object.assign({ w }, await p.evaluate(() => {
        T.enter({ seed: 5150, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'M', startAge: 30 });
        const pc = A.pc(); pc.coin = 1234567; pc.debt = 12345;
        pc.home = A.S.prov.reduce((a, P) => (A.provName(P.id).length > A.provName(a.id).length ? P : a)).id;
        UI.render();
        const info = document.querySelector('#topbar .top-info'), coin = info && info.lastElementChild, home = info && info.querySelector('.top-home');
        const whole = el => !!el && el.scrollWidth <= el.clientWidth + 1 && el.getBoundingClientRect().width > 0;
        return { coin: whole(coin), coinText: coin ? coin.textContent.trim() : '', home: home ? Math.round(home.getBoundingClientRect().width) : 0, bar: Math.round(document.getElementById('topbar').getBoundingClientRect().height) };
      })));
      await ctx.close();
    }
    const ok = out.every(o => o.coin && o.home >= 60 && /owes 12,345/.test(o.coinText));
    return { ok, detail: out.map(o => `${o.w}px: purse "${o.coinText}" ${o.coin ? 'whole' : 'CUT'}, place ${o.home}px, bar ${o.bar}px tall`).join('; ') };
  },
};
