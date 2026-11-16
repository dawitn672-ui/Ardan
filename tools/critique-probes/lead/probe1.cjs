// Lead critic's cheap verification probe: state facts at day 0 of a new game (frozen snap build).
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text().slice(0, 200)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.A && A.newGame && window.UI && UI.render && A.defEvents && (A.EVENTS || []).length > 3000, null, { timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const out = await page.evaluate(() => {
    const res = {};
    const mk = (o) => { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.render(); };
    mk({ seed: 11, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 });
    const S = A.S, pc = A.pc();
    const ppl = Object.values(S.people);
    const alive = ppl.filter(p => p.alive);
    // class distribution
    const cls = {}; for (const p of alive) { const k = p.status || p.cls || 'none'; cls[k] = (cls[k] || 0) + 1; }
    res.alive = alive.length; res.cls = cls;
    // wounds
    res.withWounds = alive.filter(p => p.wounds && p.wounds.length).length;
    // relationships at birth
    res.relCount = Object.keys(pc.rel || {}).length;
    const kinds = {}; for (const [id, r] of Object.entries(pc.rel || {})) { const k = (r && (r.t || r.k || r.kind || r.type)) || JSON.stringify(r).slice(0, 40); kinds[k] = (kinds[k] || 0) + 1; }
    res.relKinds = kinds;
    // council seat ages
    const young = [];
    for (const r of Object.values(S.realms)) { if (!r.council) continue; for (const [seat, pid] of Object.entries(r.council)) { const p = S.people[pid]; if (!p) continue; const age = S.year - p.born; const adult = (GD.RACES[p.race] && GD.RACES[p.race].adult) || 16; if (age < adult) young.push(`${r.name} ${seat}: ${p.name} ${age} (${p.race}, adult ${adult})`); } }
    res.youngCouncil = young;
    // realm colours
    const cols = {}; for (const r of Object.values(S.realms)) { const c = r.color || r.col; (cols[c] = cols[c] || []).push(r.id); }
    res.dupColours = Object.entries(cols).filter(([c, a]) => a.length > 1).map(([c, a]) => c + ':' + a.join(','));
    // province fields
    const pr = Object.values(S.prov)[0];
    res.provKeys = Object.keys(pr);
    res.provCount = Object.keys(S.prov).length;
    const terr = {}; for (const p of Object.values(S.prov)) terr[p.terr] = (terr[p.terr] || 0) + 1; res.terr = terr;
    res.realms = Object.values(S.realms).length;
    // names: given-name pool sizes per culture
    try { const c = LORE.cultures || {}; res.cultures = Object.keys(c).length; res.namePools = Object.entries(c).slice(0, 40).map(([k, v]) => [k, v.name, (v.m || v.male || []).length, (v.f || v.female || []).length, (v.sur || v.surnames || []).length]); } catch (e) { res.cultErr = String(e); }
    // realm culture mix among living
    const mix = {}; for (const p of alive) { const k = p.realm; mix[k] = mix[k] || {}; const c = p.cult || p.culture || '?'; mix[k][c] = (mix[k][c] || 0) + 1; }
    res.mixSample = Object.entries(mix).slice(0, 12).map(([k, v]) => k + ' ' + JSON.stringify(v));
    res.groups = UI.GROUPS.map(g => [g.id || g[0], (g.subs || []).map(s => s[0])]);
    res.events = (A.EVENTS || []).length;
    res.mil = GD.MIL.map(m => [m.title, m.leads]);
    res.troopKeys = Object.keys(GD.TROOPS || {}).length; res.bnKeys = Object.keys(GD.BN || {}).length;
    res.festN = (GD.FESTIVALS || []).length;
    res.pcKeys = Object.keys(pc).length;
    res.appKeys = pc.app ? Object.keys(pc.app) : null;
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors', errs.slice(0, 10));
  await browser.close();
})();
