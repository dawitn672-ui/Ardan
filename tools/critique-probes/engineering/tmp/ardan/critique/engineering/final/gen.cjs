// Deciding critic: an independent long life (different seed, class, sex, from birth), states dumped every 10 years.
//   node gen.cjs <tag> <seed> <status> <sex> <startAge> <years>
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [tag, seed, status, sex, startAge, years] = [process.argv[2] || 'peasant', +(process.argv[3] || 7), process.argv[4] || 'peasant', process.argv[5] || 'F', +(process.argv[6] || 0), +(process.argv[7] || 60)];
const OUT = '/tmp/ardan/critique/engineering/final/out';
const log = (...a) => { const s = `[${new Date().toISOString().slice(11, 19)}] gen ${tag}: ` + a.join(' '); console.log(s); fs.appendFileSync(`${OUT}/gen-${tag}.log`, s + '\n'); };
(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + String(e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const t0 = Date.now();
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 600000 });
  const mb = await metrics();
  log('booted', Date.now() - t0, 'ms wall; ThreadTime', (mb.ThreadTime * 1000).toFixed(0), 'ms; script', (mb.ScriptDuration * 1000).toFixed(0));
  const st = await page.evaluate(o => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); const pc = A.pc(); return { year: A.S.year, name: pc.given, age: A.age(pc), keys: Object.keys(A.S).length }; }, { seed, race: 'human', realm: 'POL-01', status, sex, startAge });
  log('start', JSON.stringify(st));
  const dump = async off => {
    const d = await page.evaluate(() => ({ s: A.serialize(), j: JSON.stringify(A.J), year: A.S.year, age: A.pc() ? A.age(A.pc()) : null, alive: !!(A.pc() && A.pc().alive), name: A.pc() && A.pc().given, fp: A.fingerprint() }));
    fs.writeFileSync(`${OUT}/${tag}-y${off}-state.json`, d.s);
    fs.writeFileSync(`${OUT}/${tag}-y${off}-journal.json`, d.j);
    log(`dump +${off}: year ${d.year}, ${d.name} age ${d.age} alive ${d.alive}, state ${(d.s.length / 1e6).toFixed(2)} MB, journal ${(d.j.length / 1e3).toFixed(0)} KB, fp ${d.fp}`);
  };
  await dump(0);
  const notes = [];
  for (let off = 10; off <= years; off += 10) {
    const a = await metrics();
    const r = await page.evaluate(n => {
      const end = A.S.year + n; const notes = []; let cards = 0;
      for (let guard = 0; guard < 20000 && A.S.year < end; guard++) {
        const r = A.advance(400); let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); }
        const pc = A.pc();
        if (r.why === 'dead' || !pc || !pc.alive) {
          const P = id => A.S.people[id];
          const k2 = ((pc && pc.children) || []).map(P).filter(p => p && p.alive).sort((x, y) => A.age(y) - A.age(x))[0] || Object.values(A.S.people).find(p => p.alive && pc && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
          notes.push(`${A.S.year}: ${pc ? pc.given + ' (' + A.age(pc) + ')' : '?'} died; continued as ${k2 ? k2.given + ' (' + A.age(k2) + ')' : 'nobody'}`);
          if (k2) { A.continueAs(k2.id); UI.ov = null; } else return { notes, cards, dead: true };
        }
      }
      return { notes, cards };
    }, 10);
    const b = await metrics();
    for (const n of r.notes) { notes.push(n); log('note', n); }
    log(`+${off}: 10 years in ${((b.ThreadTime - a.ThreadTime)).toFixed(1)} s CPU, ${r.cards} cards; errors so far ${errs.length}`);
    await dump(off);
    if (r.dead) break;
  }
  fs.writeFileSync(`${OUT}/gen-${tag}-errors.json`, JSON.stringify({ errs, notes }, null, 1));
  log('done; errors', errs.length, errs.slice(0, 3).join(' | '));
  await browser.close();
})().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
