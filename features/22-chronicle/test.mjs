// The Chronicle: a readable book of the life, pure to render, exportable.
export default {
  async chronicleBook(pg) {
    const r = await pg.evaluate(() => {
      // a book needs a life with years in it: a noble baby can die of a fever in her first winter, and which seed does
      // turns on the whole world's random stream, so take the first of a few seeds whose life lasts 20 years
      let seed = 5150;
      for (; seed < 5160; seed++) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 0 });
        T.play(32);
        const pc = A.P(A.S.pc); if (pc && A.age(pc) >= 20) break;
      }
      const before = A.rngState, h0 = T.hash(A.S);
      UI.tab = 'book'; UI.render();
      const html = document.querySelector('#tabbody').innerHTML, text = A.chronicleText();
      const book = A.chronicleBook(), life = book[0] || { chapters: [] };
      return { pure: A.rngState === before && T.hash(A.S) === h0, chapters: life.chapters.length, lines: life.chapters.reduce((a, c) => a + c.lines.length, 0),
        named: html.includes(UI.esc(life.name || '???')), raw: /\{[A-Za-z0-9_.]+\}/.test(text), sample: (life.chapters[1] || life.chapters[0] || { lines: [''] }).lines.slice(0, 2).join(' / ').slice(0, 220),
        seed, sig: !!(A.SIGNATURE && A.SIGNATURE.chronicle), tab: UI.GROUPS.find(g => g.k === 'chronicle').subs[0][0] };
    });
    return { ok: r.pure && r.chapters >= 2 && r.named && !r.raw && r.sig && r.tab === 'book',
      detail: `seed ${r.seed}: ${r.chapters} chapters, ${r.lines} entries; names the life ${r.named}; pure ${r.pure}; raw tokens ${r.raw}; e.g. "${r.sample}"` };
  },
  async chronicleEscapes(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.log('You meet a man called <b data-pwn="1">Trouble</b>.', 'big');
      UI.tab = 'book'; UI.render();
      return { injected: document.querySelectorAll('#tabbody [data-pwn]').length, shown: document.querySelector('#tabbody').textContent.includes('<b data-pwn') };
    });
    return { ok: r.injected === 0 && r.shown, detail: `markup in a log line is shown as text: ${r.shown}; injected elements ${r.injected}` };
  },
  async chronicleExport(pg) {
    await pg.evaluate(() => { T.enter({ seed: 9, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'F', startAge: 0 }); T.play(12); UI.tab = 'book'; UI.render(); });
    // wait for the download from the click, not from before the twelve years of play (they take longer than 8s on the full world)
    const dl = pg.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await pg.click('[data-a="chronicleExport"]');
    const d = await dl;
    let text = '';
    if (d) { const p = await d.path(); text = (await import('node:fs')).readFileSync(p, 'utf8'); }
    return { ok: !!d && /THE CHRONICLE OF ARDAN/.test(text) && /Chapter/.test(text), detail: d ? `downloaded ${d.suggestedFilename()}, ${text.length} chars` : 'no download' };
  },
};
