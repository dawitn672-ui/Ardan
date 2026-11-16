// Deciding critic: where the engine's month goes, by feature file (self time) and for named functions (inclusive).
// Bot-played months (A.advance + A.eventAuto), no drawing.   node engprof.cjs --tag=x --state=file --months=36
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const TAG = arg('tag', 'eng'), STATE = arg('state', null), MONTHS = +arg('months', 36), NEW = arg('new', null);
const OUT = '/tmp/ardan/critique/engineering/final/out';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await ctx.newPage(); page.setDefaultTimeout(3600000);
  const cdp = await ctx.newCDPSession(page);
  const scripts = new Map();
  cdp.on('Debugger.scriptParsed', e => scripts.set(e.scriptId, { url: e.url, len: e.length }));
  await cdp.send('Debugger.enable');
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  await new Promise(r => setTimeout(r, 300));
  for (const [sid, s] of scripts) {
    if (s.len < 20000) { s.name = 'small'; continue; }
    const { scriptSource } = await cdp.send('Debugger.getScriptSource', { scriptId: sid });
    const ls = [0]; for (let i = 0; i < scriptSource.length; i++) if (scriptSource.charCodeAt(i) === 10) ls.push(i + 1);
    s.lineStarts = ls; s.markers = [{ off: 0, name: s.len > 2e6 ? 'vendor core' : 'event pack' }];
    const re = /\/\/ features\/([^\n]+)/g; let m; while ((m = re.exec(scriptSource))) s.markers.push({ off: m.index, name: m[1].trim() });
  }
  await cdp.send('Debugger.disable');
  const featOf = f => { const s = scripts.get(String(f.scriptId)); if (!s) return '(native)'; if (!s.markers) return s.name || '?'; const off = (s.lineStarts[f.lineNumber] || 0) + f.columnNumber; let m = s.markers[0]; for (const mk of s.markers) { if (mk.off <= off) m = mk; else break; } return m.name.split('/')[0]; };
  if (STATE) { const s = fs.readFileSync(STATE, 'utf8'); await page.evaluate(s => { A.deserialize(JSON.parse(s)); }, s); }
  else { const [seed, status, sex, age] = (NEW || '42:noble:M:16').split(':'); await page.evaluate(o => { A.newGame(o); }, { seed: +seed, race: 'human', realm: 'POL-01', status, sex, startAge: +age }); }
  const info = await page.evaluate(() => ({ year: A.S.year, onMonth: A.onMonth.length, onDay: (A.onDay || []).length, onYear: (A.onYear || []).length, hooks: A._on ? Object.fromEntries(Object.entries(A._on).map(([k, v]) => [k, v.length])) : null, wars: (A.S.wars || []).length, armies: (A.S.armies || []).length, people: Object.keys(A.S.people).length, events: Object.keys(A.EV).length }));
  await cdp.send('Performance.enable', { timeDomain: 'threadTicks' });
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
  const m0 = await metrics();
  await cdp.send('Profiler.start');
  const played = await page.evaluate(n => { let cards = 0; const d0 = A.absDay(); for (let i = 0; i < n; i++) { const target = A.V2T.nextTurn(); for (let g = 0; g < 400 && A.absDay() < target; g++) { A.advance(Math.max(1, target - A.absDay())); let h, k = 0; while ((h = A.headReady()) && k++ < 200) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); cards++; } else A.skipPrompt(); } if (!A.pc() || !A.pc().alive) break; } } return { cards, days: A.absDay() - d0, year: A.S.year }; }, MONTHS);
  const { profile } = await cdp.send('Profiler.stop');
  const m1 = await metrics();
  const byId = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of profile.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
  const self = new Map(); let total = 0;
  for (let i = 0; i < profile.samples.length; i++) { const d = profile.timeDeltas[i] || 0; self.set(profile.samples[i], (self.get(profile.samples[i]) || 0) + d); total += d; }
  const byFeat = {}, byFn = {}, incl = {};
  const WANT = ['A.dayTick', 'A.monthTick', 'A.yearTurn', 'A.wsDay', 'DV.tick', 'A.diploMonth', 'A.diploAI', 'A.diplomacyYear', 'CO.day', 'CO.month', 'E.caravans', 'MT.month', 'A.armyThink', 'A.rollEventsN', 'A.memSum', 'A.monthEvents', 'A.mktMonth', 'A.supplyMap', 'A.eventAuto', 'A.eventView', 'A.eventChoose', 'A.applyFx', 'A.gcPeople', 'A.aiMonth', 'A.aiYear', 'A.realmMonth', 'N.regrantMonth', 'buildWorld', 'gameFactors', 'loadPair', 'A.advance', 'A.headReady'];
  for (const [id, us] of self) {
    const n = byId.get(id), f = n.callFrame, feat = f.scriptId === '0' ? (f.functionName || '(native)') : featOf(f);
    byFeat[feat] = (byFeat[feat] || 0) + us;
    const fk = (f.functionName || '(anon)') + ' @ ' + feat; byFn[fk] = (byFn[fk] || 0) + us;
    const seen = new Set(); let cur = id;
    while (cur != null) { const nm = byId.get(cur).callFrame.functionName; if (WANT.includes(nm) && !seen.has(nm)) { seen.add(nm); incl[nm] = (incl[nm] || 0) + us; } cur = parent.get(cur); }
  }
  const pct = us => +(100 * us / total).toFixed(1);
  const res = { tag: TAG, info, played, months: MONTHS, cpuMsPerMonth: Math.round((m1.ThreadTime - m0.ThreadTime) * 1000 / MONTHS), profMs: Math.round(total / 1000),
    selfByFeature: Object.entries(byFeat).sort((a, b) => b[1] - a[1]).slice(0, 28).map(([k, v]) => [k, pct(v)]),
    selfByFunction: Object.entries(byFn).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => [k, pct(v)]),
    inclusive: Object.entries(incl).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, pct(v)]) };
  console.log(JSON.stringify(res, null, 1));
  fs.writeFileSync(`${OUT}/engprof-${TAG}.json`, JSON.stringify(res, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
