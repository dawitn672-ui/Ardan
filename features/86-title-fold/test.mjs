// On the commonest laptop screens the title's "Begin a new life" is on screen without scrolling, and the map keeps its
// shape (on desktop; a phone crops it on purpose); the full-HD and phone layouts are as they were.
export default {
  async tfInSight(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const out = [];
    for (const [w, h] of [[1280, 800], [1366, 768], [1440, 900], [1920, 1080], [390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      out.push(Object.assign({ w, h }, await p.evaluate(() => {
        // cycle 2 (visual F1): the map left the title for How to play; where a strip is still drawn it keeps its shape
        const b = document.querySelector('[data-a="newLife"]').getBoundingClientRect(), cv = document.querySelector('#title canvas.mapstrip'), r = cv ? cv.getBoundingClientRect() : null;
        return { bottom: Math.round(b.bottom), vh: innerHeight, mapH: r ? Math.round(r.height) : 0, shape: r ? Math.abs((r.width / r.height) / (cv.width / cv.height) - 1) : 0 };
      })));
      await ctx.close();
    }
    // on a phone 71-phone crops the strip on purpose (object-fit: cover), so its box is not the map's shape
    const ok = out.every(o => o.bottom <= o.vh && (o.w < 761 || o.shape < 0.02));
    return { ok, detail: out.map(o => `${o.w}x${o.h}: button ends at ${o.bottom} of ${o.vh}, map ${o.mapH}px tall, shape off by ${(o.shape * 100).toFixed(1)}%`).join('; ') };
  },

  // first-hour B3, visual I4: the title said "Thirty-four realms" and showed the Known World; five buttons of one
  // weight. Now it pitches the Great Continent with its counts and its map, under the dawn sky, with one primary button.
  // v2: this test returned a pass with nothing checked when A.FAR was missing, which is every v2 build (the owner
  // dropped the Far Lands, docs/v2/LANES.md). The Great Continent pitch and its map in How to play were the Far Lands'
  // (TF.facts reads A.FAR) and went with them, so without A.FAR the pitch is the release's and must name the realm
  // count of the world it opens on (LORE.realms, the realms the generated v2 continent carries), in words; the rest
  // (no Known World strip, no map in the title, the dawn sky, one primary button, the Your lives shelf) is checked
  // either way.
  async tfGreat(pg) {
    const r = await pg.evaluate(() => {
      const far = !!(typeof A.FAR !== 'undefined' && A.FAR);
      UI.screen = 'title'; UI.render();
      const t = document.getElementById('title');
      // the continent's map now opens How to play (cycle 2, visual F1)
      const text = t.textContent, inTitle = !!t.querySelector('canvas');
      UI.A.help(); const cv = document.getElementById('helpgc');
      let colours = 0;
      if (cv) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, seen = new Set(); for (let i = 0; i < d.length; i += 4 * 97) seen.add(d[i] << 16 | d[i + 1] << 8 | d[i + 2]); colours = seen.size; }
      const D = far ? A.FAR.D : { realms: {} }, n = Object.keys(D.realms).length + Object.keys(LORE.realms).filter(id => !D.realms[id]).length;
      // v2: the release's pitch writes the count in words ("Thirty-four realms")
      const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'], TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
      const word = k => (k >= 20 && k < 100 ? TENS[Math.floor(k / 10)] + (k % 10 ? '-' + ONES[k % 10] : '') : String(k)), said = new RegExp(`\\b${word(n)} realms`, 'i');
      UI.ov = null; UI.renderModal();
      return { far, said: far ? text.includes(`${n} realms`) : said.test(text), text, inTitle, n, old: !!document.getElementById('titlemap'), colours, sky: !!t.querySelector('.tt-sky svg[data-hour="dawn"]'),
        primary: [...t.querySelectorAll('.btns button.primary')].map(b => b.dataset.a), buttons: t.querySelectorAll('.btns button').length,
        // 995-hall-of-lives' shelf takes the slot left under the buttons, once
        shelf: (() => { if (!UI.HALL || !UI.HALL.KEY) return 'none';
          localStorage.setItem(UI.HALL.KEY, JSON.stringify({ v: 1, n: 1, endings: {}, manners: {}, ach: {}, lives: [{ k: 'a', name: 'Edda', realm: 'POL-01', realmName: 'Aldmark', born: 1100, died: 1131, ending: 'cut_short', seed: '1' }] }));
          UI.render(); const T2 = document.getElementById('title'), sh = T2.querySelectorAll('.hl-shelf'), b = T2.querySelector('.btns');
          const ok = sh.length === 1 && !!(b.compareDocumentPosition(sh[0]) & Node.DOCUMENT_POSITION_FOLLOWING); localStorage.removeItem(UI.HALL.KEY); return ok ? 'under the buttons' : 'MISPLACED'; })() };
    });
    // v2: without the Far Lands, "Thirty-four" is the true count, and How to play has no continent map to draw
    const ok = (r.far ? !/Thirty-four/.test(r.text) && r.colours > 20 : true) && r.said && !r.old && !r.inTitle && r.sky && r.primary.length === 1 && r.primary[0] === 'newLife' && r.buttons >= 4 && r.shelf !== 'MISPLACED';
    return { ok, detail: `${r.far ? 'the Far Lands' : 'v2, no Far Lands'}: ${r.n} realms named in the pitch ${r.said}, "Thirty-four" gone ${!/Thirty-four/.test(r.text)}; the Known World strip gone ${!r.old}, the title free of the map ${!r.inTitle}, the continent drawn in How to play in ${r.colours} colours; dawn sky ${r.sky}; primary buttons: ${r.primary.join(', ')} of ${r.buttons}; Your lives shelf ${r.shelf}` };
  },
};
