// The game with no network at all: every request off the page is refused, and the four typefaces (Literata, Atkinson
// Hyperlegible Next, Cinzel, Dela Gothic One) still load from the page itself in every style used, nothing fails to
// load, and the security policy blocks nothing.
import { pathToFileURL } from 'node:url';

export default {
  async ofOffline(pg, errs, { browser, file }) {
    const ctx = await browser.newContext({ offline: true });
    const p = await ctx.newPage(), failed = [], csp = [], outside = [];
    p.on('requestfailed', r => failed.push(r.url().slice(0, 120)));
    p.on('request', r => { if (!/^(file|data|blob):/.test(r.url())) outside.push(r.url().slice(0, 120)); });
    p.on('console', m => { if (/Content.Security.Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 200)); });
    p.on('pageerror', e => errs.push(String(e)));
    try {
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      const r = await p.evaluate(async () => {
        // every family in every style the page uses: prose (Literata, italic for asides), the interface (Atkinson), names
        // and titles (Cinzel), and the big moments (Dela Gothic One)
        const want = ['400 20px Literata', '700 20px Literata', 'italic 400 20px Literata', '400 20px "Atkinson Hyperlegible Next"',
          '700 20px "Atkinson Hyperlegible Next"', 'italic 400 20px "Atkinson Hyperlegible Next"', '600 20px Cinzel', '700 20px Cinzel', '400 20px "Dela Gothic One"'];
        const got = {};
        for (const f of want) { await document.fonts.load(f, 'Ardan Ēkapur'); got[f] = document.fonts.check(f, 'Ardan Ēkapur'); }
        const faces = [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.style} ${f.weight}`);
        return { got, faces };
      });
      // document.fonts.check is true for a font with no face at all (it falls back), so each family must be in use too
      const all = Object.values(r.got).every(Boolean) && ['Literata normal', 'Literata italic', 'Atkinson Hyperlegible Next normal', 'Atkinson Hyperlegible Next italic', 'Cinzel normal', 'Dela Gothic One normal'].every(f => r.faces.some(x => x.startsWith(f)));
      const ok = all && !failed.length && !csp.length && !outside.length;
      return { ok, detail: `offline: ${Object.entries(r.got).map(([k, v]) => `${k} ${v ? 'loaded' : 'MISSING'}`).join(', ')}; faces in use: ${r.faces.join('; ')}; requests off the page ${outside.length}${outside.length ? ' (' + outside.slice(0, 3).join(', ') + ')' : ''}; failed loads ${failed.length}; policy refusals ${csp.length}${csp.length ? ' (' + csp[0] + ')' : ''}` };
    } finally { await ctx.close(); }
  },
};
