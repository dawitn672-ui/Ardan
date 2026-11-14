// Long-life growth and slowdown measurement for Ardan (engineering critique).
//   node measure.cjs <scenario: noble|soldier> [years=50] [every=5] [seed=42]
// Writes /tmp/ardan/critique/engineering/out/<scenario>.json and .cpuprofile files.
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const SCEN = process.argv[2] || 'noble';
const YEARS = +(process.argv[3] || 50);
const EVERY = +(process.argv[4] || 5);
const SEED = +(process.argv[5] || 42);
const FILE = process.env.ARDAN_HTML || '/tmp/ardan/snap/index.html';
const OUT = '/tmp/ardan/critique/engineering/out';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => { const s = `[${new Date().toISOString().slice(11, 19)}] ${SCEN}: ` + a.join(' '); console.log(s); fs.appendFileSync(`${OUT}/${SCEN}.log`, s + '\n'); };

// ---------------------------------------------------------------- in-page helpers
const INSTALL = () => {
  const now = () => performance.now();
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : null; };
  const J = v => { try { const s = JSON.stringify(v); return s === undefined ? 0 : s.length; } catch (e) { return -1; } };
  const M = window.__EM = {
    notes: [],
    // keep the world going past a death: the eldest living child, else kin, else anyone of the house or realm
    carryOn() {
      const pc = A.pc(); if (pc && pc.alive) return null;
      const P = id => A.S.people[id];
      const alive = id => P(id) && P(id).alive;
      let pick = null;
      const kids = (pc && pc.children || []).filter(alive).map(P).sort((a, b) => A.age(b) - A.age(a));
      if (kids.length) pick = kids[0];
      const sib = [].concat(pc && pc.siblings || []).filter(alive).map(P);
      if (!pick && sib.length) pick = sib[0];
      if (!pick && pc && pc.spouse && alive(pc.spouse)) pick = P(pc.spouse);
      if (!pick) pick = Object.values(A.S.people).find(p => p.alive && pc && p.house && p.house === pc.house && A.age(p) >= 14);
      if (!pick) pick = Object.values(A.S.people).find(p => p.alive && pc && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
      if (!pick) return 'none';
      const was = pc ? `${pc.given} (${A.age(pc)})` : '?';
      A.continueAs(pick.id); UI.ov = null;
      M.notes.push(`${A.S.year}: ${was} died; continued as ${pick.given} (${A.age(pick)})`);
      return pick.id;
    },
    drain() {
      let h, g = 0, n = 0;
      while ((h = A.headReady()) && g++ < 500) {
        if (h.type === 'event') { A.eventView(h); A.eventAuto(); n++; } else A.skipPrompt();
      }
      return n;
    },
    // T.play from tests/helpers.mjs, with a carry-on at death and per-year timing
    play(years) {
      const end = A.S.year + years, per = [];
      let y0 = A.S.year, t0 = now(), adv = 0, ev = 0, cards = 0;
      for (let guard = 0; guard < 20000 && A.S.year < end; guard++) {
        const a0 = now(); const r = A.advance(400); adv += now() - a0;
        const e0 = now(); cards += M.drain(); ev += now() - e0;
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) { if (M.carryOn() === 'none') return { per, dead: true }; }
        if (A.S.year !== y0) { per.push({ year: y0, ms: Math.round(now() - t0), adv: Math.round(adv), ev: Math.round(ev), cards }); y0 = A.S.year; t0 = now(); adv = 0; ev = 0; cards = 0; }
      }
      return { per };
    },
    // one in-game month the way Next month ends it (V2T.nextTurn), timing the engine and the card answering apart
    month() {
      const target = A.V2T && A.V2T.nextTurn ? A.V2T.nextTurn() : A.absDay() + 30;
      let adv = 0, ev = 0, cards = 0, calls = 0;
      for (let g = 0; g < 400 && A.absDay() < target; g++) {
        const a0 = now(); const r = A.advance(Math.max(1, target - A.absDay())); adv += now() - a0; calls++;
        const e0 = now(); cards += M.drain(); ev += now() - e0;
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) { M.carryOn(); break; }
      }
      return { adv, ev, cards, calls };
    },
    months(n) {
      const L = [];
      for (let i = 0; i < n; i++) L.push(M.month());
      return { advMed: med(L.map(x => x.adv)), evMed: med(L.map(x => x.ev)), totMed: med(L.map(x => x.adv + x.ev)), advMax: Math.max(...L.map(x => x.adv)), advSum: L.reduce((a, x) => a + x.adv, 0), cards: L.reduce((a, x) => a + x.cards, 0), raw: L.map(x => Math.round(x.adv)) };
    },
    calib() {
      // fixed CPU work, to read the machine's load at the moment (the box is shared)
      const t0 = now(); let s = 0; const o = []; for (let i = 0; i < 20000; i++) o.push({ a: i, b: 'x' + i, c: [i, i * 2] });
      for (let k = 0; k < 4; k++) s += JSON.parse(JSON.stringify(o)).length;
      for (let i = 0; i < 3e6; i++) s = (s * 31 + i) | 0;
      return now() - t0;
    },
    stateSizes() {
      const S = A.S, out = { total: J(S), keys: {} };
      for (const k of Object.keys(S)) out.keys[k] = J(S[k]);
      const ppl = Object.values(S.people);
      out.people = ppl.length; out.alive = ppl.filter(p => p.alive).length; out.dead = out.people - out.alive;
      // which person fields carry the weight, summed over everyone
      const fld = {};
      for (const p of ppl) for (const k in p) fld[k] = (fld[k] || 0) + J(p[k]);
      out.personFields = Object.entries(fld).sort((a, b) => b[1] - a[1]).slice(0, 20);
      const pc = A.pc();
      out.pc = pc ? { size: J(pc), flags: pc.flags ? Object.keys(pc.flags).length : 0, flagsEv: pc.flags && pc.flags.ev ? Object.keys(pc.flags.ev).length : 0, fields: Object.keys(pc).map(k => [k, J(pc[k])]).sort((a, b) => b[1] - a[1]).slice(0, 12) } : null;
      out.deadAvg = out.dead ? Math.round(ppl.filter(p => !p.alive).reduce((a, p) => a + J(p), 0) / out.dead) : 0;
      out.aliveAvg = out.alive ? Math.round(ppl.filter(p => p.alive).reduce((a, p) => a + J(p), 0) / out.alive) : 0;
      // array-ish things in the state and their lengths
      const lens = {};
      for (const k of Object.keys(S)) { const v = S[k]; if (Array.isArray(v)) lens[k] = v.length; else if (v && typeof v === 'object') lens[k] = Object.keys(v).length; }
      out.lens = lens;
      out.logLines = (S.log || []).reduce((a, e) => a + ((e && e.lines) ? e.lines.length : 0), 0);
      out.evShown = S.evShown ? Object.keys(S.evShown).length : 0;
      out.realms = S.realms ? Object.keys(S.realms).length : 0;
      out.houses = S.houses ? Object.keys(S.houses).length : 0;
      // relation records over all people (rel maps grow with every acquaintance)
      let rel = 0, relMax = 0; for (const p of ppl) { const r = p.rel ? Object.keys(p.rel).length : 0; rel += r; if (r > relMax) relMax = r; }
      out.rel = { total: rel, max: relMax, pc: pc && pc.rel ? Object.keys(pc.rel).length : 0 };
      return out;
    },
    packSizes() {
      const t0 = now(); const ser = A.serialize(); const t1 = now();
      let packed = -1, tp = 0; try { const p0 = now(); packed = JSON.stringify(A.packState ? A.packState(A.S) : A.S).length; tp = now() - p0; } catch (e) {}
      const f0 = now(); A.fingerprint(ser); const tf = now() - f0;
      return { serLen: ser.length, serMs: t1 - t0, packedLen: packed, packMs: tp, fingerprintMs: tf, journalEntries: A.J ? A.J.e.length : null, journalLen: A.J ? J(A.J) : null };
    },
    async saveCost() {
      const out = {};
      try { const t0 = now(); const r = await SAVES.encode(A.S, A.J); out.encodeMs = now() - t0; out.bytes = r.bytes.length; } catch (e) { out.encodeErr = String(e); }
      try { const t0 = now(); const ok = await UI.save(true); out.saveMs = now() - t0; out.saveOk = ok; } catch (e) { out.saveErr = String(e); }
      try { const t0 = now(); const L = await SAVES.list(); out.listMs = now() - t0; out.slots = L.map(x => x.kb); } catch (e) {}
      return out;
    },
    // every place's draw time: UI.render (string building + innerHTML), then the forced layout
    renders() {
      const keep = { tab: UI.tab, ov: UI.ov };
      const tabs = UI.GROUPS.flatMap(g => g.subs.map(s => s[0]));
      const res = {};
      const md0 = MAP.draw; let mapMs = 0, mapN = 0;
      MAP.draw = function () { const t = now(); try { return md0.apply(this, arguments); } finally { mapMs += now() - t; mapN++; } };
      try {
        for (const t of tabs) {
          const r = [], l = [], m = []; let nodes = 0, html = 0;
          for (let i = 0; i < 3; i++) {
            UI.ov = null; UI.tab = t; mapMs = 0; mapN = 0;
            const t0 = now(); UI.render(); const t1 = now(); void document.body.offsetHeight; const t2 = now();
            r.push(t1 - t0); l.push(t2 - t1); m.push(mapMs);
            nodes = document.getElementsByTagName('*').length; const tb = document.getElementById('tabbody'); html = tb ? tb.innerHTML.length : 0;
          }
          res[t] = { render: med(r), layout: med(l), map: med(m), mapN, nodes, html };
        }
        // UI.refresh is what each card and each step end calls
        UI.tab = 'life'; UI.ov = null; UI.render();
        const rf = []; for (let i = 0; i < 5; i++) { const t0 = now(); UI.refresh(); void document.body.offsetHeight; rf.push(now() - t0); }
        res._refreshLife = med(rf);
        // a person's sheet (the overlay most clicked)
        const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc).slice(0, 5);
        const ov = []; for (const p of ppl) { const t0 = now(); try { UI.A.ov && UI.A.ov(p.id); } catch (e) {} void document.body.offsetHeight; ov.push(now() - t0); }
        res._personSheet = med(ov); UI.ov = null;
      } finally { MAP.draw = md0; UI.tab = keep.tab; UI.ov = null; UI.render(); }
      return res;
    },
    dom() {
      return { nodes: document.getElementsByTagName('*').length, bodyKids: document.body.children.length, styles: document.querySelectorAll('style').length, scripts: document.querySelectorAll('script').length };
    },
    // sizes of the engine's and UI's own caches and tables (not in A.S): anything that grows here is a leak or a cache
    caches() {
      const out = {};
      const look = (name, o) => {
        if (!o) return;
        for (const k of Object.keys(o)) {
          let v; try { v = o[k]; } catch (e) { continue; }
          if (!v || typeof v !== 'object' || v === A.S || v === window || (typeof Node !== 'undefined' && v instanceof Node)) continue;
          let n = null;
          if (Array.isArray(v)) n = v.length; else if (v instanceof Map || v instanceof Set) n = v.size; else if (Object.getPrototypeOf(v) === Object.prototype) n = Object.keys(v).length;
          if (n != null) out[name + '.' + k] = n;
        }
      };
      look('A', A); look('UI', UI); look('MAP', window.MAP); look('SAVES', window.SAVES);
      for (const g of ['V2T', 'LF', 'CO', 'NM', 'SV', 'PH', 'AT', 'BM', 'MODS', 'GD', 'LORE']) if (window[g] && window[g] !== A) look(g, window[g]);
      return out;
    },
    async heap() {
      if (window.gc) { window.gc(); window.gc(); }
      await new Promise(r => setTimeout(r, 50));
      return performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize } : null;
    },
    // a real Next month, through the button's own handler: the stepper's slices, the cards answered through the
    // modal's own actions (UI.A.evChoose / evClose), every refresh it triggers
    realMonth() {
      return new Promise(resolve => {
        const ST = UI.stepper; const t0 = now(); let cards = 0, renders = 0, rms = 0, refreshes = 0;
        const r0 = UI.render, f0 = UI.refresh;
        UI.render = function () { const t = now(); try { return r0.apply(this, arguments); } finally { renders++; rms += now() - t; } };
        UI.refresh = function () { const t = now(); try { return f0.apply(this, arguments); } finally { refreshes++; rms += now() - t; } };
        const done = why => { UI.render = r0; UI.refresh = f0; resolve({ ms: now() - t0, cards, renders, refreshes, renderMs: rms, why }); };
        try { UI.A.v2Next(); } catch (e) { return done('err ' + e); }
        let guard = 0;
        const tick = () => {
          guard++;
          if (guard > 4000) return done('timeout');
          const pc = A.pc();
          if (!pc || !pc.alive) return done('dead');
          if (A.S.queue.length && document.querySelector('#modal')) {
            const h = A.S.queue[0];
            try {
              if (h.type === 'event') {
                if (!h.result) { const v = A.eventView(h); const i = Math.max(0, (v.choices || []).findIndex(c => !c.disabled && !c.locked)); UI.A.evChoose(String(i)); }
                else UI.A.evClose();
                cards++;
              } else { A.skipPrompt(); UI.refresh(); }
            } catch (e) { try { A.eventAuto(); UI.refresh(); } catch (e2) { A.skipPrompt(); } }
            return setTimeout(tick, 0);
          }
          if (A.S.queue.length) { try { A.headReady() ? UI.refresh() : null; } catch (e) {} if (A.S.queue.length && !document.querySelector('#modal')) { M.drain(); } return setTimeout(tick, 0); }
          if (ST && ST.run) return setTimeout(tick, 5);
          return done('ok');
        };
        setTimeout(tick, 0);
      });
    },
  };
};

// ---------------------------------------------------------------- CPU profile aggregation
function aggregate(profile, scripts) {
  const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = profile.timeDeltas; const samples = profile.samples;
  const self = new Map();
  for (let i = 0; i < samples.length; i++) self.set(samples[i], (self.get(samples[i]) || 0) + (dt[i] || 0));
  // inclusive time: walk parents
  const parent = new Map(); for (const n of profile.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
  const key = n => { const f = n.callFrame; return `${f.functionName || '(anon)'}|${f.scriptId}|${f.lineNumber}|${f.columnNumber}`; };
  const selfBy = new Map(), inclBy = new Map();
  let total = 0;
  for (const [id, us] of self) {
    total += us;
    const n = byId.get(id); const k = key(n);
    selfBy.set(k, (selfBy.get(k) || 0) + us);
    // inclusive: every distinct ancestor key once
    const seen = new Set(); let cur = id;
    while (cur != null) { const kk = key(byId.get(cur)); if (!seen.has(kk)) { seen.add(kk); inclBy.set(kk, (inclBy.get(kk) || 0) + us); } cur = parent.get(cur); }
  }
  const where = k => {
    const [fn, sid, line, col] = k.split('|');
    const s = scripts.get(sid);
    if (!s) return { fn, at: `script ${sid}:${line}:${col}` };
    let feat = s.name;
    if (s.lineStarts && s.markers) {
      const off = (s.lineStarts[+line] || 0) + (+col);
      let m = null; for (const mk of s.markers) { if (mk.off <= off) m = mk; else break; }
      feat = m ? m.name : s.name;
    }
    return { fn, at: `${feat}:${line}:${col}` };
  };
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, us]) => Object.assign(where(k), { ms: Math.round(us / 1000), pct: +(100 * us / total).toFixed(1) }));
  return { totalMs: Math.round(total / 1000), self: top(selfBy, 30), incl: top(inclBy, 40) };
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  const t0 = Date.now();
  await page.goto('file://' + FILE);
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  const boot = await page.evaluate(() => window.ARDAN_BOOT);
  log('booted in', Date.now() - t0, 'ms', JSON.stringify(boot));
  await page.evaluate(INSTALL);

  // script map for the profiler: the core blob (one script, features appended with markers) and the event packs
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, { url: e.url, len: e.length }));
  await cdp.send('Debugger.enable');
  await new Promise(r => setTimeout(r, 500));
  for (const [sid, s] of scripts) {
    if (s.url || s.len < 2000) { s.name = s.url ? path.basename(s.url) : 'inline'; continue; }
    const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: sid });
    const head = scriptSource.slice(0, 200);
    const mm = head.match(/\/\/ features\/([^\n]+)/);
    s.name = mm ? mm[1].trim() : (scriptSource.length > 3e6 ? 'core' : head.slice(0, 40).replace(/\s+/g, ' '));
    if (scriptSource.length > 3e6 || /\/\/ features\//.test(scriptSource.slice(200))) {
      const ls = [0]; for (let i = 0; i < scriptSource.length; i++) if (scriptSource.charCodeAt(i) === 10) ls.push(i + 1);
      s.lineStarts = ls;
      s.markers = [{ off: 0, name: 'vendor' }];
      const re = /\/\/ features\/([^\n]+)/g; let m; while ((m = re.exec(scriptSource))) s.markers.push({ off: m.index, name: m[1].trim() });
    }
  }
  await cdp.send('Debugger.disable');
  log('scripts', scripts.size);

  const start = SCEN === 'soldier'
    ? { seed: SEED, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 }
    : { seed: SEED, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 };
  const st = await page.evaluate(o => {
    A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    let enl = null;
    if (o.status === 'peasant') { try { A.enlist(A.pc()); enl = A.pc().mil ? { rank: A.pc().mil.rank, unit: A.pc().mil.unit } : 'no mil'; } catch (e) { enl = 'err ' + e; } UI.render(); }
    return { year: A.S.year, pc: A.pc().given, enl, autosave: UI.set && UI.set.autosave };
  }, start);
  log('start', JSON.stringify(st));

  const result = { scen: SCEN, start, boot, checkpoints: [], years: [], profiles: {}, errors: errs, notes: [] };
  const save = () => fs.writeFileSync(`${OUT}/${SCEN}.json`, JSON.stringify(result, null, 1));

  async function profileMonths(tag) {
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
    await cdp.send('Profiler.start');
    const r = await page.evaluate(() => __EM.months(24));
    const { profile } = await cdp.send('Profiler.stop');
    await cdp.send('Profiler.disable');
    fs.writeFileSync(`${OUT}/${SCEN}-${tag}.cpuprofile`, JSON.stringify(profile));
    const agg = aggregate(profile, scripts);
    agg.months = r;
    result.profiles[tag] = agg;
    log('profile', tag, 'total', agg.totalMs, 'ms; top self:', agg.self.slice(0, 6).map(x => `${x.fn}@${x.at} ${x.pct}%`).join(', '));
    save();
  }

  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  // CPU time of the renderer's main thread around one page call (the box is shared: wall time is not trustworthy)
  const cpu = async (fn, arg) => { const a = await metrics(); const r = await page.evaluate(fn, arg); const b = await metrics(); return { r, cpu: (b.ThreadTime - a.ThreadTime) * 1000, task: (b.TaskDuration - a.TaskDuration) * 1000 }; };
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? (b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2) : null; };
  const tabs = await page.evaluate(() => UI.GROUPS.flatMap(g => g.subs.map(s => s[0])));

  const y0 = await page.evaluate(() => A.S.year);
  for (let off = 0; off <= YEARS; off += EVERY) {
    const cur = await page.evaluate(() => A.S.year);
    const want = y0 + off;
    if (cur < want) {
      const r = await cpu(n => __EM.play(n), want - cur);
      result.years.push(Object.assign({ to: want, cpu: Math.round(r.cpu) }, { per: r.r.per }));
      if (r.r.dead) { log('world ended (no one to continue as)'); break; }
    }
    const cp = { off, year: await page.evaluate(() => A.S.year) };
    const tA = Date.now();
    const c1 = await cpu(() => __EM.calib()); cp.calib = { wall: c1.r, cpu: c1.cpu };
    cp.heap = await page.evaluate(() => __EM.heap());
    try { cp.heapCdp = await cdp.send('Runtime.getHeapUsage'); } catch (e) {}
    cp.metrics = await metrics();
    cp.state = await page.evaluate(() => __EM.stateSizes());
    const pk = await cpu(() => __EM.packSizes()); cp.pack = Object.assign(pk.r, { cpu: pk.cpu });
    cp.caches = await page.evaluate(() => __EM.caches());
    const rng0 = await page.evaluate(() => [A.rngState, JSON.stringify(A.S).length]);
    // each place drawn three times; CPU per draw
    cp.render = {};
    for (const t of tabs) {
      const r = await cpu(t => { const out = []; let nodes = 0, html = 0, map = 0; const md0 = MAP.draw; let mapMs = 0;
        MAP.draw = function () { const t0 = performance.now(); try { return md0.apply(this, arguments); } finally { mapMs += performance.now() - t0; } };
        try { for (let i = 0; i < 3; i++) { UI.ov = null; UI.tab = t; const t0 = performance.now(); UI.render(); void document.body.offsetHeight; out.push(performance.now() - t0); }
          nodes = document.getElementsByTagName('*').length; const tb = document.getElementById('tabbody'); html = tb ? tb.innerHTML.length : 0; }
        finally { MAP.draw = md0; }
        return { wall: out, nodes, html, map: mapMs / 3 }; }, t);
      cp.render[t] = { cpu: r.cpu / 3, wallMed: med(r.r.wall), nodes: r.r.nodes, html: r.r.html, map: r.r.map };
    }
    await page.evaluate(() => { UI.tab = 'life'; UI.ov = null; UI.render(); });
    const rf = await cpu(() => { const w = []; for (let i = 0; i < 5; i++) { const t0 = performance.now(); UI.refresh(); void document.body.offsetHeight; w.push(performance.now() - t0); } return w; });
    cp.render._refreshLife = { cpu: rf.cpu / 5, wallMed: med(rf.r) };
    const ps = await cpu(() => { const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc).slice(0, 5); for (const p of ppl) { try { UI.A.ov && UI.A.ov(p.id); } catch (e) {} void document.body.offsetHeight; } UI.ov = null; UI.render(); return ppl.length; });
    cp.render._personSheet = { cpu: ps.cpu / Math.max(1, ps.r) };
    const rng1 = await page.evaluate(() => [A.rngState, JSON.stringify(A.S).length]);
    cp.renderPure = { rngSame: rng0[0] === rng1[0], lenBefore: rng0[1], lenAfter: rng1[1] };
    cp.dom = await page.evaluate(() => __EM.dom());
    const sv = await cpu(() => __EM.saveCost()); cp.save = Object.assign(sv.r, { cpu: sv.cpu });
    // 12 months the way Next month ends them, each timed by the main thread's CPU
    cp.months = [];
    for (let i = 0; i < 12; i++) { const r = await cpu(() => __EM.month()); cp.months.push({ cpu: r.cpu, adv: r.r.adv, ev: r.r.ev, cards: r.r.cards }); }
    cp.monthCpuMed = med(cp.months.map(x => x.cpu)); cp.monthWallMed = med(cp.months.map(x => x.adv)); cp.monthCpuMax = Math.max(...cp.months.map(x => x.cpu));
    // three real Next month presses through the button's handler
    cp.real = [];
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { UI.tab = 'life'; UI.ov = null; UI.render(); __EM.drain(); });
      const r = await cpu(() => __EM.realMonth());
      cp.real.push(Object.assign(r.r, { cpu: r.cpu }));
    }
    const c2 = await cpu(() => __EM.calib()); cp.calib2 = { wall: c2.r, cpu: c2.cpu };
    cp.notes = await page.evaluate(() => __EM.notes.splice(0));
    cp.secs = (Date.now() - tA) / 1000;
    cp.errors = errs.length;
    result.checkpoints.push(cp);
    save();
    log(`year ${cp.year} (+${off}): month CPU med ${cp.monthCpuMed.toFixed(0)} ms (max ${cp.monthCpuMax.toFixed(0)}; wall med ${cp.monthWallMed.toFixed(0)}); ` +
      `real month CPU ${cp.real.map(r => r.cpu.toFixed(0)).join('/')} ms; life render CPU ${cp.render.life.cpu.toFixed(0)} ms, people ${cp.render.people.cpu.toFixed(0)}, world ${cp.render.world.cpu.toFixed(0)}; ` +
      `A.S ${(cp.state.total / 1e6).toFixed(2)} MB, people ${cp.state.people} (${cp.state.alive} alive); heap ${(cp.heap.used / 1e6).toFixed(0)} MB; nodes ${cp.metrics.Nodes} listeners ${cp.metrics.JSEventListeners}; ` +
      `journal ${cp.pack.journalEntries}; save ${cp.save.bytes} B, CPU ${cp.save.cpu.toFixed(0)} ms; calib CPU ${cp.calib.cpu.toFixed(0)}/${cp.calib2.cpu.toFixed(0)}`);
    if (off === 0) await profileMonths('y1');
  }
  await profileMonths('y' + YEARS);
  result.errors = errs;
  save();
  log('done; page errors', errs.length);
  await browser.close();
})().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
