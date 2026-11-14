// Deciding critic: reproduce the decade in which "v2-nobility regrant TypeError" was swallowed, and find what it left behind.
// Loads peasant-y50, wraps A.V2N.regrant to record each throw (title, house, head), audits one-holder-per-title monthly.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage(); page.setDefaultTimeout(3600000);
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const s = fs.readFileSync('/tmp/ardan/critique/engineering/final/out/peasant-y50-state.json', 'utf8');
  const r = await page.evaluate(s => {
    A.deserialize(JSON.parse(s));
    const N = A.V2N, F = A.V2F, S = A.S, out = { throws: [], audits: [], monthsWithThrow: 0, skipped: [] };
    const rg = N.regrant;
    N.regrant = function (t) {
      try { return rg.apply(this, arguments); }
      catch (e) {
        const oh = t.house && A.S.houses[t.house];
        if (out.throws.length < 40) out.throws.push({ y: A.S.year, d: A.S.warClock, title: t.k, name: t.name, rank: t.rank, seat: t.seat, vacant: t.vacant, vacN: t.vacN, house: t.house, houseHead: oh ? oh.headPid : null, headExists: !!(oh && A.P(oh.headPid)), houseExtinct: oh ? !!oh.extinct : null, people: Object.keys(A.S.people).length, houses: Object.keys(A.S.houses).length, err: String(e).slice(0, 120) });
        throw e;
      }
    };
    // how many titles the pass leaves unprocessed after a throw: titles after the failing one, in iteration order
    const rm = N.regrantMonth;
    N.regrantMonth = function () {
      const before = Object.keys(A.S.people).length, hb = Object.keys(A.S.houses).length;
      try { return rm.apply(this, arguments); }
      catch (e) {
        out.monthsWithThrow++;
        const all = []; for (const c of Object.values(A.S.court.realms)) for (const t of c.titles) if (!(t.crown || t.heldWith || t.rank === 'king')) all.push(t);
        const last = out.throws[out.throws.length - 1], i = all.findIndex(t => t.k === (last && last.title));
        const after = all.slice(i + 1), vac = after.filter(t => !N.holderOf(t)).length;
        if (out.skipped.length < 40) out.skipped.push({ y: A.S.year, titlesAfter: after.length, vacantAfter: vac, peopleMade: Object.keys(A.S.people).length - before, housesMade: Object.keys(A.S.houses).length - hb });
        throw e;
      }
    };
    A.onMonth.push(function () {
      const k0 = A.rngState; let au = []; try { au = F.audit(); } catch (e) { au = [{ k: 'audit threw ' + e }]; }
      if (A.rngState !== k0) { out.impure = true; A.rngState = k0; }
      if (au.length) { const key = au.map(b => b.k + ' ' + b.id + ' ' + (b.holders || []).join('/')).join('; '); if (!out.audits.length || out.audits[out.audits.length - 1].key !== key) out.audits.push({ y: A.S.year, d: A.S.warClock, key }); }
    });
    const end = A.S.year + 10; let cards = 0;
    for (let guard = 0; guard < 20000 && A.S.year < end; guard++) {
      const r = A.advance(400); let h, g = 0;
      while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); }
      const pc = A.pc(); if (r.why === 'dead' || !pc || !pc.alive) break;
    }
    // what the world looks like at the end
    const dup = F.audit();
    const info = dup.map(b => ({ b, holders: (b.holders || []).map(id => { const p = A.P(id); return p ? { id, name: A.fullName(p, false), born: p.born, alive: p.alive, noble: p.noble, house: p.house, houseSeat: p.house && A.S.houses[p.house] ? [A.S.houses[p.house].seat, A.S.houses[p.house].seatId, A.S.houses[p.house].headPid, A.S.houses[p.house].created || null] : null } : id; }) }));
    const vac = []; for (const c of Object.values(A.S.court.realms)) for (const t of c.titles) if (t.vacant) vac.push({ k: t.k, name: t.name, vacant: t.vacant, vacN: t.vacN });
    return { out, year: A.S.year, fp: A.fingerprint(), info, vac, cards };
  }, s);
  console.log(JSON.stringify(r, null, 1).slice(0, 9000));
  console.log('console errors', errs.length);
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/regrant.json', JSON.stringify({ r, errs }, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
