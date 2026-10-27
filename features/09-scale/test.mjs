// Browser tests for 09-scale. Each test gets (page, pageErrors, {browser, file}).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unpack } from '../../tools/pack.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const CLONE = fs.readFileSync(path.join(here, 'clone.js'), 'utf8');

// play a game on each path, both ways, in the same page; the scale path with or without its check mode
const playBoth = (pg, starts, years, checkOn, months) => pg.evaluate(([starts, years, checkOn, months]) => {
  const SC = A.WSCALE, out = [];
  const playDays = n => {
    const d0 = A.S.year * 365 + (A.S.warClock || 0);
    for (let g = 0; g < 4000 && A.S.year * 365 + (A.S.warClock || 0) - d0 < n; g++) {
      const r = A.advance(n);
      let h, k = 0;
      while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
      if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
    }
    return 'ok';
  };
  const run = (o, off, chk) => {
    A.SCALE_OFF = off; A.SCALE_CHECK = chk;
    try {
      T.enter(o);
      const t = performance.now(), how = months ? playDays(30 * months) : T.play(years);
      return { h: T.hash(A.S), rng: A.rngState, year: A.S.year, how, ms: Math.round(performance.now() - t) };
    } finally { A.SCALE_OFF = false; A.SCALE_CHECK = false; }
  };
  for (const o of starts) {
    const c0 = SC.stats.checks, m0 = SC.stats.missed, b0 = SC.bad.length, by0 = Object.assign({}, SC.stats.by);
    const ref = run(o, true, false), fast = run(o, false, checkOn);
    const by = {}; for (const k in SC.stats.by) if (SC.stats.by[k] - (by0[k] || 0)) by[k] = SC.stats.by[k] - (by0[k] || 0);
    out.push({ seed: o.seed, ref, fast, same: ref.h === fast.h && ref.rng === fast.rng, span: months ? `${months} months` : `${years} years`, checks: SC.stats.checks - c0, by, missed: SC.stats.missed - m0, bad: SC.bad.slice(b0, b0 + 3) });
  }
  return out;
}, [starts, years, checkOn, months || 0]);
const report = res => res.map(r => `seed ${r.seed}: ${r.same ? 'identical' : `DIFFERENT (${r.ref.h}/${r.ref.rng} vs ${r.fast.h}/${r.fast.rng})`} after ${r.span}${r.fast.how === 'dead' ? ' (the life ended)' : ''}` +
  ` (${(r.ref.ms / 1000).toFixed(1)}s off, ${(r.fast.ms / 1000).toFixed(1)}s on${r.checks ? `, ${r.checks} answers checked` : ''}${r.missed ? `, ${r.missed} MISSED` : ''})${r.bad.length ? ' ' + r.bad.join(' | ') : ''}`).join('; ');

// the world K times over (docs/plan/world-expansion-architecture.md, appendix A), then months of play, timed by the
// wall clock and by the page's main-thread CPU time (Chrome's ThreadTime: what a loaded machine inflates least)
async function timeWorld(pg, K, months) {
  let cdp = null;
  try { cdp = await pg.context().newCDPSession(pg); await cdp.send('Performance.enable', { timeDomain: 'threadTicks' }); } catch (e) { cdp = null; }
  // null where the browser does not report thread time (the bounds then fall back to the wall clock)
  const cpu = async () => { if (!cdp) return null; const t = (await cdp.send('Performance.getMetrics')).metrics.find(m => m.name === 'ThreadTime'); return t ? t.value * 1000 : null; };
  const setup = await pg.evaluate(K => {
    __CLONE(K);
    const t0 = performance.now();
    A.newGame({ seed: 1234, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 16 });
    window.__scaleMonth = () => {
      const d0 = A.S.year * 365 + (A.S.warClock || 0), y0 = A.S.year, t = performance.now();
      for (let g = 0; g < 400 && A.S.year * 365 + (A.S.warClock || 0) - d0 < 30; g++) {
        const r = A.advance(30);
        let h, k = 0;
        while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return { ms: performance.now() - t, dead: true };
      }
      return { ms: performance.now() - t, year: A.S.year !== y0 };
    };
    return { provs: A.S.prov.length, realms: Object.keys(A.S.realms).length, ng: Math.round(performance.now() - t0) };
  }, K);
  const plain = [], plainC = [], year = [], yearC = [];
  for (let m = 0; m < months; m++) {
    const c0 = await cpu(), r = await pg.evaluate(() => __scaleMonth()), c1 = await cpu();
    if (m > 0) { (r.year ? year : plain).push(r.ms); if (c0 != null && c1 != null) (r.year ? yearC : plainC).push(c1 - c0); }   // the first month builds roads once
    if (r.dead) break;
  }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? Math.round(s[Math.floor(s.length / 2)]) : null; };
  const end = await pg.evaluate(() => ({ bad: A.WSCALE.bad.slice(0, 3), missed: A.WSCALE.stats.missed }));
  return { ...setup, month: med(plain), monthCpu: med(plainC), year: med(year), yearCpu: med(yearC), months: plain.length + year.length, ...end };
}

export default {
  async scaleIdentical(pg) {
    // the same seed reaches the same world, bit for bit, with the scale path on and off
    const starts = [
      { seed: 1234, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 },
      { seed: 777, race: 'human', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 18 },
      { seed: 90210, race: 'human', realm: 'POL-02', status: 'royal', sex: 'M', startAge: 20 },
    ];
    const res = await playBoth(pg, starts, 10, false);
    return { ok: res.every(r => r.same && !r.missed && !r.bad.length), detail: report(res) };
  },

  async scaleCheckMode(pg) {
    // every memoised answer worked out again the original way: none may differ, and no write may go unnoticed
    const starts = [
      { seed: 4242, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'M', startAge: 17 },
      { seed: 31337, race: 'dwarf', realm: 'POL-10', status: 'artisan', sex: 'F', startAge: 20 },
    ];
    const res = await playBoth(pg, starts, 5, true);
    // and a world ten times as large, for a season: more realms, more wars, more of every path
    await pg.evaluate(CLONE);
    await pg.evaluate(() => __CLONE(10));
    res.push(...await playBoth(pg, [{ seed: 2024, race: 'human', realm: 'POL-04', status: 'noble', sex: 'M', startAge: 22 }], 0, true, 4));
    const kinds = {}; for (const r of res) for (const k in r.by) kinds[k] = (kinds[k] || 0) + r.by[k];
    return { ok: res.every(r => r.same && !r.missed && !r.bad.length && r.checks > 1000), detail: report(res) + '; checked: ' + Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ') };
  },

  async scaleSites(pg, errs, { file }) {
    // every place in the built game that writes a province's owner, or puts a house into S.houses, must tell the
    // indexes (A.scaleLand / A.scaleHouse), or be one of the world-building writes the indexes never see
    const core = unpack(fs.readFileSync(file, 'utf8'))['ardan-core'], content = unpack(fs.readFileSync(file, 'utf8'))['ardan-content'];
    const BUILD_TIME = [
      [/T\.owner = win; T\.occ = null;/, '43 W.vary, inside A.initWorld'],
      [/P\.owner = nid; P\.occ = null;/, '70 FR.make, inside A.initWorld'],
      [/S\.houses\[id\]=Object\.assign\(\{op:A\.ri\(30,70\)/, 'A.initWorld'],
      [/S\.houses\[id\]=\{id,name:F\.name/, 'A.initFamilies, inside A.initWorld'],
      [/S\.houses\[id\]=r\}else S\.houses\[id\]=o\}return delete S\.packed/, 'A.unpackState, on load'],
      [/S\.houses\[id\]=o\}return delete S\.packed/, 'A.unpackState, on load'],
      [/S\.houses\[hid\] = \{ id: hid, name: \/\^\(of /, '70 FR.make (a new house for a fresh realm), inside A.initWorld'],
      [/A\.S\.houses\[hid\]=\{id:hid,name:houseName,realm:null,kind:"royal"/, 'the player founds a realm: a royal house never counts in A.realmHouses, and its realm is set (and told) two statements on'],
    ];
    const bad = [], seen = { owner: 0, house: 0, adj: 0 };
    const scan = (src, re, kind, told) => {
      let m;
      while ((m = re.exec(src))) {
        seen[kind]++;
        const at = src.slice(Math.max(0, m.index - 160), m.index + 200);
        if (told && told.test(src.slice(m.index, m.index + 1200))) continue;
        if (BUILD_TIME.some(([r]) => r.test(at))) continue;
        bad.push(`${kind}: …${src.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, ' ')}…`);
      }
    };
    for (const src of [core, content]) {
      scan(src, /\.owner\s*=(?![=>])/g, 'owner', /^[^;{}]*?A\.scaleLand\(\)|^\.owner=to,A\.scaleLand/);
      scan(src, /houses\[[^\]]+\]\s*=(?![=>])/g, 'house', /^houses\[hid\]=\{id:hid,name:"House "\+sur,[^;]*?members:\[pc\.id\]\},A\.scaleHouse/);
      scan(src, /\.adj\s*=(?![=>])|\.(adj|sea)\.(push|splice|unshift)\(/g, 'adj', null);
    }
    // ctx.owner in events is a token, not a province; AK.adj is a helper
    const real = bad.filter(b => !/ctx\.owner|AK\.adj/.test(b));
    return { ok: !real.length, detail: real.length ? real.slice(0, 4).join(' || ') : `${seen.owner} owner writes, ${seen.house} house writes, ${seen.adj} adjacency writes: all accounted for` };
  },

  async scaleTiming(pg) {
    // a world ten times as large: 3,060 provinces, about 340 realms. On this project's 4-core machine (Oct 2026, loaded)
    // the month took about 800 ms of CPU (1.1-2.3 s wall) and the month holding the New Year about 1.6 s of CPU
    // (2.3-5 s wall), against 1.2-1.5 s and 15-20 s of CPU without 09-scale. The bounds are three times that, so they
    // hold on a slow CI runner and still catch the year turn going quadratic again.
    await pg.evaluate(CLONE);
    const r = await timeWorld(pg, 10, 14);
    const cpuOk = r.monthCpu != null ? r.monthCpu <= 2400 && r.yearCpu <= 5000 : r.month <= 6000 && r.year <= 15000;
    const ok = r.provs === 3060 && r.month != null && r.year != null && cpuOk && !r.bad.length && !r.missed;
    const c = v => v == null ? 'n/a' : Math.round(v);
    return { ok, detail: `10x world (${r.provs} provinces, ${r.realms} realms): new game ${r.ng} ms; month median ${r.month} ms wall, ${c(r.monthCpu)} ms CPU;` +
      ` year-turn month ${r.year} ms wall, ${c(r.yearCpu)} ms CPU, over ${r.months} months${r.bad.length ? '; ' + r.bad.join(' | ') : ''}`, data: r };
  },

  async scaleOneWorld(pg) {
    // the Great Continent for ten years (world.core.js): wars are joined only within reach, each land keeps to its
    // share of the war cap, the lore's tributes are made and hold, far news comes late and seldom; and the far world
    // stays plausible: realms survive, treasuries do not run away, wars end
    const r = await pg.evaluate(() => {
      const W = A.WORLD1;
      A.newGame({ seed: 9090, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, lands: 'great' });
      const S0 = A.S, far = Object.keys(A.FAR.D.realms), ties0 = Object.keys(S0.loreTies || {}).length;
      const tie = id => S0.loreTies[id];
      const outReach = [], overCap = [];
      // after every war day: no side holds a realm out of reach of the other side's leader
      const seen = new Set();
      A.onDay.push(() => {
        for (const w of A.S.wars) for (const [side, foe] of [['att', w.leadD], ['def', w.leadA]]) for (const x of w[side]) {
          const k = w.id + side + x; if (seen.has(k)) continue; seen.add(k);
          if (x !== foe && A.realm(x) && A.realm(foe) && W.reachKm(x, foe) > W.REACH && x !== w.leadA && x !== w.leadD) outReach.push(`${x} in ${w.name} (${Math.round(W.reachKm(x, foe))} km)`);
        }
      });
      const startY = A.S.year; let farNews = 0, nearNews = 0, lateOk = true;
      T.play(5);
      const tiesHeld5 = Object.entries(S0.loreTies || {}).filter(([id, t]) => A.realm(id) && A.realm(id).alive && A.realm(t.o) && A.realm(t.o).alive && A.realm(id).overlord === t.o).length;
      const tiesAlive5 = Object.entries(S0.loreTies || {}).filter(([id, t]) => A.realm(id) && A.realm(id).alive && A.realm(t.o) && A.realm(t.o).alive).length;
      T.play(5);
      for (const n of A.S.news) /^Word from the /.test(n.t) ? farNews++ : nearNews++;
      const alive = far.filter(id => A.realm(id) && A.realm(id).alive).length;
      const tr = far.map(id => A.realm(id)).filter(r => r && r.alive).map(r => r.treasury / Math.max(1, r.income || 1)).sort((a, b) => a - b);
      const oldWars = A.S.wars.filter(w => A.S.year - w.start > 8 && w.cb !== 'throne').length;
      return { ties0, tiesHeld5, tiesAlive5, outReach: outReach.slice(0, 5), nOut: outReach.length, farNews, nearNews, years: A.S.year - startY, alive, nFar: far.length,
        trMed: tr[Math.floor(tr.length / 2)], trMax: tr[tr.length - 1], oldWars, stats: W.stats, ended: (A.S.history || []).length };
    });
    const ok = r.ties0 >= 40 && r.tiesHeld5 >= r.tiesAlive5 * 0.9 && r.nOut === 0 && r.farNews <= 30 * 3 && r.stats.dropped > r.stats.held &&
      r.alive >= r.nFar * 0.85 && r.trMax < 200 && r.oldWars === 0;
    return { ok, detail: `${r.years} years: ${r.ties0} lore tributes made, ${r.tiesHeld5} of ${r.tiesAlive5} standing pairs still paying at year 5; ` +
      `${r.nOut} realms at war out of reach${r.nOut ? ' (' + r.outReach.join('; ') + ')' : ''}; news kept ${r.nearNews} near and ${r.farNews} far lines (far: ${r.stats.held} held, ${r.stats.told} told, ${r.stats.dropped} not heard of); ` +
      `${r.alive} of ${r.nFar} far realms standing; treasury against a year's income: median ${r.trMed && r.trMed.toFixed(1)}, highest ${r.trMax && r.trMax.toFixed(1)}; wars older than 8 years: ${r.oldWars}` };
  },
};

