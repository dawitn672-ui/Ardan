// Does a save and load change the future? Two fresh pages play the same seed with the same bot; one saves and loads
// (the game's own SAVES.encode / SAVES.decode / A.deserialize) after Y1 years, then both play Y2 more years.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = '/tmp/ardan/critique/engineering/out';
const Y1 = +(process.argv[2] || 2), Y2 = +(process.argv[3] || 3), SEED = +(process.argv[4] || 42);
const PLAY = n => {
  const end = A.S.year + n;
  for (let g = 0; g < 20000 && A.S.year < end; g++) {
    const r = A.advance(400); let h, k = 0;
    while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
    if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
  }
  return 'ok';
};
async function run(browser, withLoad) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  const r = await page.evaluate(async ({ Y1, Y2, SEED, withLoad }) => {
    const play = n => {
      const end = A.S.year + n;
      for (let g = 0; g < 20000 && A.S.year < end; g++) {
        const r = A.advance(400); let h, k = 0;
        while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
      }
      return 'ok';
    };
    A.newGame({ seed: SEED, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
    const a = play(Y1);
    const mid = { fp: A.fingerprint(), rng: A.rngState, year: A.S.year, day: A.absDay() };
    let loaded = null;
    if (withLoad) {
      const enc = await SAVES.encode(A.S, A.J);
      const d = await SAVES.decode(enc.bytes);
      SAVES.clean && SAVES.clean(d);
      A.deserialize(d.S); A.journalResume && A.journalResume(d.J);
      loaded = { fp: A.fingerprint(), rng: A.rngState };
    }
    const b = play(Y2);
    return { a, b, mid, loaded, end: { fp: A.fingerprint(), rng: A.rngState, year: A.S.year, day: A.absDay(), people: Object.keys(A.S.people).length } };
  }, { Y1, Y2, SEED, withLoad });
  await ctx.close();
  return Object.assign(r, { errs });
}
(async () => {
  const browser = await chromium.launch();
  const [x, y] = await Promise.all([run(browser, false), run(browser, true)]);
  const out = { Y1, Y2, SEED, noLoad: x, withLoad: y, midSame: x.mid.fp === y.mid.fp, loadedSameAsMid: y.loaded && y.loaded.fp === y.mid.fp, endSame: x.end.fp === y.end.fp };
  console.log(JSON.stringify(out, null, 1));
  fs.writeFileSync(`${OUT}/exp4.json`, JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
