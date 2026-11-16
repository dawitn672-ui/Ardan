// Where the UI's time goes, year 0 against year 50: CPU profiles of drawing the places, of a real Next month (button
// handler, stepper, cards through the modal's actions) and of a save and a load. Also dumps the year-50 state.
//   node renderprof.cjs [seed=42] [years=50]
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const SEED = +(process.argv[2] || 42), YEARS = +(process.argv[3] || 50);
const OUT = '/tmp/ardan/critique/engineering/out';
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => { const s = `[${new Date().toISOString().slice(11, 19)}] rp: ` + a.join(' '); console.log(s); fs.appendFileSync(`${OUT}/renderprof.log`, s + '\n'); };

function aggregate(profile, scripts) {
  const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const self = new Map(); const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + (dt[i] || 0));
  const parent = new Map(); for (const n of profile.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
  const key = n => { const f = n.callFrame; return `${f.functionName || '(anon)'}|${f.scriptId}|${f.lineNumber}|${f.columnNumber}`; };
  const selfBy = new Map(), inclBy = new Map(); let total = 0;
  for (const [id, us] of self) {
    total += us; const k = key(byId.get(id)); selfBy.set(k, (selfBy.get(k) || 0) + us);
    const seen = new Set(); let cur = id;
    while (cur != null) { const kk = key(byId.get(cur)); if (!seen.has(kk)) { seen.add(kk); inclBy.set(kk, (inclBy.get(kk) || 0) + us); } cur = parent.get(cur); }
  }
  const where = k => {
    const [fn, sid, line, col] = k.split('|'); const s = scripts.get(sid);
    if (!s) return { fn, at: `script ${sid}:${line}:${col}` };
    let feat = s.name;
    if (s.lineStarts) { const off = (s.lineStarts[+line] || 0) + (+col); let m = null; for (const mk of s.markers) { if (mk.off <= off) m = mk; else break; } feat = m ? m.name : s.name; }
    return { fn, at: `${feat}:${line}:${col}` };
  };
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, us]) => Object.assign(where(k), { ms: Math.round(us / 1000), pct: +(100 * us / total).toFixed(1) }));
  return { totalMs: Math.round(total / 1000), self: top(selfBy, 30), incl: top(inclBy, 45) };
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'] });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  const cdp = await ctx.newCDPSession(page);
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 300000 });
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, { url: e.url, len: e.length }));
  await cdp.send('Debugger.enable'); await new Promise(r => setTimeout(r, 500));
  for (const [sid, s] of scripts) {
    if (s.url || s.len < 2000) { s.name = s.url ? path.basename(s.url) : 'inline'; continue; }
    const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: sid });
    const mm = scriptSource.slice(0, 200).match(/\/\/ features\/([^\n]+)/);
    s.name = mm ? mm[1].trim() : (scriptSource.length > 3e6 ? 'core' : 'pack');
    if (scriptSource.length > 3e6) {
      const ls = [0]; for (let i = 0; i < scriptSource.length; i++) if (scriptSource.charCodeAt(i) === 10) ls.push(i + 1);
      s.lineStarts = ls; s.markers = [{ off: 0, name: 'vendor' }];
      const re = /\/\/ features\/([^\n]+)/g; let m; while ((m = re.exec(scriptSource))) s.markers.push({ off: m.index, name: m[1].trim() });
    }
  }
  await cdp.send('Debugger.disable');
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const prof = async (tag, fn, arg) => {
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
    const m0 = await metrics(); const r = await page.evaluate(fn, arg); const m1 = await metrics();
    const { profile } = await cdp.send('Profiler.stop'); await cdp.send('Profiler.disable');
    fs.writeFileSync(`${OUT}/rp-${tag}.cpuprofile`, JSON.stringify(profile));
    const agg = aggregate(profile, scripts); agg.cpu = Math.round((m1.ThreadTime - m0.ThreadTime) * 1000); agg.r = r;
    res[tag] = agg;
    log(tag, 'cpu', agg.cpu, 'ms; self:', agg.self.slice(0, 8).map(x => `${x.fn}@${x.at} ${x.pct}%`).join(', '));
    fs.writeFileSync(`${OUT}/renderprof.json`, JSON.stringify(res, null, 1));
  };
  const res = {};
  await page.evaluate(seed => {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 }); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    window.__RP = {
      drawAll(n) { const tabs = UI.GROUPS.flatMap(g => g.subs.map(s => s[0])); for (let i = 0; i < n; i++) for (const t of tabs) { UI.ov = null; UI.tab = t; UI.render(); void document.body.offsetHeight; } UI.tab = 'life'; UI.render(); return tabs.length * n; },
      drawTab(t, n) { for (let i = 0; i < n; i++) { UI.ov = null; UI.tab = t; UI.render(); void document.body.offsetHeight; } UI.tab = 'life'; UI.render(); return n; },
      refresh(n) { UI.tab = 'life'; UI.ov = null; UI.render(); for (let i = 0; i < n; i++) { UI.refresh(); void document.body.offsetHeight; } return n; },
      carryOn() {
        const pc = A.pc(); if (pc && pc.alive) return;
        const P = id => A.S.people[id], alive = id => P(id) && P(id).alive;
        let pick = (pc.children || []).filter(alive).map(P).sort((a, b) => A.age(b) - A.age(a))[0] || (pc.siblings || []).filter(alive).map(P)[0] ||
          Object.values(A.S.people).find(p => p.alive && p.realm === pc.realm && A.age(p) >= 16 && A.age(p) <= 30);
        if (pick) { A.continueAs(pick.id); UI.ov = null; }
      },
      play(years) {
        const end = A.S.year + years;
        for (let g = 0; g < 20000 && A.S.year < end; g++) {
          const r = A.advance(400); let h, k = 0;
          while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
          if (r.why === 'dead' || !A.pc() || !A.pc().alive) __RP.carryOn();
        }
        return A.S.year;
      },
      // n real Next months through the button's handler, cards answered through the modal's own actions
      realMonths(n) {
        return new Promise(resolve => {
          let left = n, cards = 0; const t0 = performance.now();
          const one = () => {
            if (left-- <= 0) return resolve({ ms: performance.now() - t0, cards });
            UI.tab = 'life'; UI.ov = null;
            try { UI.A.v2Next(); } catch (e) {}
            const tick = () => {
              const pc = A.pc(); if (!pc || !pc.alive) { __RP.carryOn(); UI.render(); return setTimeout(one, 0); }
              if (A.S.queue.length && document.querySelector('#modal')) {
                const h = A.S.queue[0];
                try { if (h.type === 'event') { if (!h.result) { const v = A.eventView(h); UI.A.evChoose(String(Math.max(0, (v.choices || []).findIndex(c => !c.disabled && !c.locked)))); } else UI.A.evClose(); cards++; } else { A.skipPrompt(); UI.refresh(); } }
                catch (e) { try { A.eventAuto(); UI.refresh(); } catch (e2) { A.skipPrompt(); } }
                return setTimeout(tick, 0);
              }
              if (A.S.queue.length) { if (!A.headReady()) {} else UI.refresh(); if (A.S.queue.length && !document.querySelector('#modal')) { let h, k = 0; while ((h = A.headReady()) && k++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } } return setTimeout(tick, 0); }
              if (UI.stepper && UI.stepper.run) return setTimeout(tick, 5);
              setTimeout(one, 0);
            };
            setTimeout(tick, 0);
          };
          one();
        });
      },
      async save() { const t0 = performance.now(); const r = await SAVES.encode(A.S, A.J); const t1 = performance.now(); await UI.save(true); return { encode: t1 - t0, save: performance.now() - t1, bytes: r.bytes.length }; },
      load() { const txt = A.serialize(); const t0 = performance.now(); const S = JSON.parse(txt); const t1 = performance.now(); A.deserialize(S); const t2 = performance.now(); UI.render(); return { parse: t1 - t0, deserialize: t2 - t1, render: performance.now() - t2, len: txt.length }; },
    };
  }, SEED);
  const phase = async tag => {
    await prof(`${tag}-tabs`, () => __RP.drawAll(3));
    await prof(`${tag}-refresh`, () => __RP.refresh(10));
    await prof(`${tag}-people`, () => __RP.drawTab('people', 5));
    await prof(`${tag}-real`, () => __RP.realMonths(6));
    await prof(`${tag}-save`, () => __RP.save());
    await prof(`${tag}-load`, () => __RP.load());
  };
  await phase('y0');
  const t0 = Date.now();
  for (let y = 0; y < YEARS; y += 5) { const yr = await page.evaluate(n => __RP.play(n), 5); log('year', yr, ((Date.now() - t0) / 1000).toFixed(0), 's'); }
  // keep the year-50 world for later checks
  const dump = await page.evaluate(() => ({ S: A.serialize(), J: JSON.stringify(A.J) }));
  fs.writeFileSync(`${OUT}/noble-y50-state.json`, dump.S); fs.writeFileSync(`${OUT}/noble-y50-journal.json`, dump.J);
  log('dumped state', (dump.S.length / 1e6).toFixed(2), 'MB, journal', (dump.J.length / 1e6).toFixed(2), 'MB');
  await phase('y50');
  res.errors = errs;
  fs.writeFileSync(`${OUT}/renderprof.json`, JSON.stringify(res, null, 1));
  log('done; errors', errs.length);
  await browser.close();
})().catch(e => { log('FATAL', e.stack || e); process.exit(1); });
