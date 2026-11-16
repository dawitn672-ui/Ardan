// Deciding critic: load dumped states into the snapshot build and audit them: sizes, growth, and coherency of posts.
//   node analyze.cjs <out.json> <state.json> [<state.json> ...]
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUTF = process.argv[2], FILES = process.argv.slice(3);
const AUDIT = () => {
  const S = A.S, J = v => { try { const s = JSON.stringify(v); return s === undefined ? 0 : s.length; } catch (e) { return -1; } };
  const live = p => !!(p && p.alive), P = id => S.people[id];
  const out = { year: S.year, ver: S.ver, total: J(S) };
  const ppl = Object.values(S.people);
  out.people = { n: ppl.length, alive: ppl.filter(live).length };
  out.keys = Object.fromEntries(Object.keys(S).map(k => [k, J(S[k])]).filter(x => x[1] > 20000).sort((a, b) => b[1] - a[1]));
  // per-person fields, summed
  const fld = {}; for (const p of ppl) for (const k in p) fld[k] = (fld[k] || 0) + J(p[k]);
  out.personFields = Object.entries(fld).sort((a, b) => b[1] - a[1]).slice(0, 16);
  const rf = {}; for (const r of Object.values(S.realms)) for (const k in r) rf[k] = (rf[k] || 0) + J(r[k]);
  out.realmFields = Object.entries(rf).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const pc = A.pc();
  out.pc = pc ? { name: pc.given, age: A.age(pc), size: J(pc), keys: Object.keys(pc).length, top: Object.keys(pc).map(k => [k, J(pc[k])]).sort((a, b) => b[1] - a[1]).slice(0, 14), rel: Object.keys(pc.rel || {}).length, flags: Object.keys(pc.flags || {}).length, flagsEv: pc.flags && pc.flags.ev ? Object.keys(pc.flags.ev).length : 0,
    mil: pc.mil ? { rank: pc.mil.rank, title: GD.MIL[pc.mil.rank] && GD.MIL[pc.mil.rank].title } : null, office: pc.office || null } : null;
  out.log = { years: (S.log || []).length, lines: (S.log || []).reduce((a, e) => a + ((e && e.lines) ? e.lines.length : 0), 0) };
  // ---- coherency of posts
  const realms = Object.values(S.realms).filter(r => r && r.alive !== false && !r.isRebel);
  out.realms = realms.length;
  const C = out.council = { seats: 0, alive: 0, dead: 0, empty: 0, deadEx: [], foreign: 0, twoSeats: 0, officeDangling: 0 };
  const nSeats = Object.keys(A.COUNCIL).length, seatOf = {};
  for (const r of realms) for (const k of Object.keys(A.COUNCIL)) {
    C.seats++; const id = r.council && r.council[k], p = id ? P(id) : null;
    if (!id) { C.empty++; continue; }
    if (!live(p)) { C.dead++; if (C.deadEx.length < 6) C.deadEx.push(`${r.short} ${k}: ${p ? A.fullName(p, false) + ' died ' + p.died : id + ' missing'}`); continue; }
    C.alive++; if (p.realm !== r.id) C.foreign++;
    (seatOf[id] = seatOf[id] || []).push(r.short + ' ' + k);
  }
  C.twoSeats = Object.values(seatOf).filter(v => v.length > 1).length;
  for (const p of ppl) if (live(p) && p.office) { const r = S.realms[p.realm]; if (!r || !r.council || r.council[p.office] !== p.id) C.officeDangling++; }
  // how long the dead have sat: years since death, for seats held by the dead
  C.deadYears = []; for (const r of realms) for (const k in (r.council || {})) { const p = P(r.council[k]); if (p && !p.alive && p.died) C.deadYears.push(S.year - p.died); }
  C.deadYearsMax = C.deadYears.length ? Math.max(...C.deadYears) : 0; C.deadYearsMed = C.deadYears.length ? C.deadYears.sort((a, b) => a - b)[C.deadYears.length >> 1] : 0; delete C.deadYears;
  // rulers
  const R = out.rulers = { dead: 0, multi: 0, mismatch: 0 }, claim = {};
  for (const p of ppl) if (live(p) && p.ruler) (claim[p.ruler] = claim[p.ruler] || []).push(p.id);
  for (const r of realms) { if (!live(P(r.ruler))) R.dead++; const c = claim[r.id] || []; if (c.length > 1) R.multi++; else if (c.length === 1 && c[0] !== r.ruler) R.mismatch++; }
  // armies
  const AR = out.armies = { n: (S.armies || []).length, deadGen: 0, noGen: 0, twoArmies: 0 }, gens = {};
  for (const a of (S.armies || [])) { if (!a) continue; if (!a.gen) AR.noGen++; else { if (!live(P(a.gen))) AR.deadGen++; gens[a.gen] = (gens[a.gen] || 0) + 1; } }
  AR.twoArmies = Object.values(gens).filter(n => n > 1).length;
  // military top ranks: how many living Marshals (GD.MIL top) and High Generals a realm has, and is the council's marshal one of them
  const top = GD.MIL.length - 1, M = out.marshals = { topTitle: GD.MIL[top].title, realmsWithMoreThanOne: 0, total: 0, councilMarshalIsMilMarshal: 0, councilMarshalAlive: 0, milMarshalNotOnCouncil: 0, ex: [] };
  for (const r of realms) {
    const ms = ppl.filter(p => live(p) && p.realm === r.id && p.mil && p.mil.rank >= top);
    M.total += ms.length; if (ms.length > 1) { M.realmsWithMoreThanOne++; if (M.ex.length < 4) M.ex.push(`${r.short}: ${ms.length} of rank ${GD.MIL[top].title}`); }
    const cm = r.council && P(r.council.marshal);
    if (live(cm)) { M.councilMarshalAlive++; if (cm.mil && cm.mil.rank >= top) M.councilMarshalIsMilMarshal++; }
    for (const m of ms) if (!cm || cm.id !== m.id) M.milMarshalNotOnCouncil++;
  }
  // v2 court titles
  const T = out.titles = { n: 0, held: 0, holderDead: 0, vacant: 0, vacantOver2y: 0, vacantMaxYears: 0, noPid: 0, holderPointsElsewhere: 0 };
  if (S.court && S.court.realms) for (const rid in S.court.realms) for (const t of S.court.realms[rid].titles) {
    if (t.crown || t.heldWith || t.rank === 'king') continue;
    T.n++;
    const p = t.pid ? P(t.pid) : null;
    if (t.vacant) { T.vacant++; const y = S.year - t.vacant; if (y > 2) T.vacantOver2y++; if (y > T.vacantMaxYears) T.vacantMaxYears = y; }
    if (!t.pid) T.noPid++; else if (!live(p)) T.holderDead++; else { T.held++; if (!(p.noble && p.noble.court === t.k)) T.holderPointsElsewhere++; }
  }
  try { out.v2check = A.V2SAVE && A.V2SAVE.check ? A.V2SAVE.check() : null; } catch (e) { out.v2check = 'threw ' + e; }
  try { const au = A.V2F && A.V2F.audit ? A.V2F.audit() : []; out.v2audit = { n: au.length, ex: au.slice(0, 3) }; } catch (e) { out.v2audit = 'threw ' + e; }
  // the regrant pass: does it throw on this state? (run last: it changes the state)
  try { const N = A.V2N; const r = N.regrantMonth(); out.regrant = { ok: true, granted: r.length }; } catch (e) { out.regrant = { ok: false, err: String(e).slice(0, 200) }; }
  return out;
};
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage(); page.setDefaultTimeout(1800000);
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); }); page.on('pageerror', e => errs.push('pageerror ' + String(e).slice(0, 200)));
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 1800000 });
  const res = {};
  for (const f of FILES) {
    const s = fs.readFileSync(f, 'utf8');
    await page.evaluate(s => { A.deserialize(JSON.parse(s)); }, s);
    const r = await page.evaluate(AUDIT);
    res[f.split('/').pop()] = r;
    console.log(f.split('/').pop(), JSON.stringify({ year: r.year, MB: +(r.total / 1e6).toFixed(2), people: r.people, council: r.council, rulers: r.rulers, armies: r.armies, marshals: r.marshals, titles: r.titles, v2check: r.v2check, v2audit: r.v2audit, regrant: r.regrant }));
    fs.writeFileSync(OUTF, JSON.stringify({ res, errs }, null, 1));
  }
  console.log('console errors', errs.length, errs.slice(0, 3));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
