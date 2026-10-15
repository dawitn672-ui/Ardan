// The fight audit (Road to Ten, Power 1-3 and 5). For each build it reports:
//   audit    every event choice that is a fight or a beast encounter, the scale it assumes (one person, a party, an
//            army; an animal, a great beast, a titan), what decides it, what it can cost, and every clash with the
//            ladder (features/48-fight-ladder/audit.core.js; loaded into builds that lack it, so any build can be read);
//   duels    the duel screen's chance against what duels do (pairs of fighters of tiers 1-6, some foes unarmed until the
//            duel arms them, the player's seat at health 40-100, event duels and plain lethal ones by turns), and the
//            profile's odds (A.shownDuelOdds) against the plain lethal ones it was fitted on;
//   beasts   the duel screen's chance against beasts, alone and with a hunting party, at health 60-100;
//   honest   converted event choices: the odds shown against how often the roll comes up;
//   group    the group resolver against the tier texts of GD.TIERS and the plan's "3 Trained beat 1 Elite";
//   tiers    the beast tier texts of GD.TIER_INFO against duels.
//   node bench/fights-audit.mjs [built.html ...] [--json=reports/fights-audit.json] [--quick]
// FIGHTS_LAB is the in-page half; features/48-fight-ladder/test.mjs uses it too.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const FIGHTS_LAB = () => {
  const L = window.FLAB = {};
  // a seeded stream for the lab's own picks (pairs, health), so the game's stream is not the only source of order
  L.rng = seed => { let h = (seed >>> 0) || 1; return () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; }; };
  L.quiet = f => { const dc = A.duelConsequences; A.duelConsequences = () => []; try { return f(); } finally { A.duelConsequences = dc; } };
  // fighters of tiers 1 to 5 from A.makeFoe, and every ninth one raised toward Legend
  L.pool = function (seed, n) {
    A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
    const ids = [];
    for (let i = 0; i < n; i++) {
      const p = A.makeFoe({ realm: 'POL-01', tier: 1 + i % 5 });
      if (i % 9 === 8) { for (const k in p.skills) p.skills[k] = Math.min(100, p.skills[k] + 25); for (const s of ['str', 'spd', 'ins', 'sta']) p.st[s] += 15; }
      p.npcTemp = false; A.S.people[p.id] = p; ids.push(p.id);
    }
    return ids;
  };
  L.bins = function (rows, edges, minN) {
    edges = edges || [0, 10, 25, 40, 60, 75, 90, 101]; minN = minN || 40;
    const out = []; let maxErr = 0, wErr = 0, nAll = 0;
    for (let k = 0; k + 1 < edges.length; k++) {
      const r = rows.filter(x => x[0] >= edges[k] && x[0] < edges[k + 1]);
      if (!r.length) continue;
      const shown = r.reduce((a, x) => a + x[0], 0) / r.length, real = 100 * r.reduce((a, x) => a + x[1], 0) / r.length;
      out.push({ bin: `${edges[k]}-${edges[k + 1] - 1}`, n: r.length, shown: Math.round(shown * 10) / 10, real: Math.round(real * 10) / 10 });
      if (r.length >= minN) { maxErr = Math.max(maxErr, Math.abs(shown - real)); wErr += Math.abs(shown - real) * r.length; nAll += r.length; }
    }
    return { bins: out, maxErr: Math.round(maxErr * 10) / 10, meanErr: nAll ? Math.round(wErr / nAll * 10) / 10 : null, n: rows.length };
  };
  // duels between people: the duel screen's chance (D.measure) and the profile's (A.shownDuelOdds, or the release's
  // 1/(1+e^(-d/12))) against the result, the player's seat at varied health, a third of foes unarmed until the duel
  L.duels = function (n, seed) {
    const ids = L.pool(seed, 300), r = L.rng(seed), rows = [], prof = [];
    const profile = (a, b) => (A.shownDuelOdds ? A.shownDuelOdds(a, b) : 100 / (1 + Math.exp(-(A.fightWorth(a) - A.fightWorth(b)) / 12)));
    L.quiet(() => {
      for (let k = 0; k < n; k++) {
        const a = A.P(ids[Math.floor(r() * ids.length)]); let b = A.P(ids[Math.floor(r() * ids.length)]);
        if (a === b) continue;
        a.health = [100, 100, 85, 70, 55, 40][Math.floor(r() * 6)]; a.wounds = []; b.health = 100; b.wounds = [];
        const keep = b.gear.weapon; if (r() < 1 / 3) b.gear.weapon = null;
        const shownProfile = profile(a, b);
        A.S.pc = a.id; A.S.queue = [];
        // an event's duel (the foe may yield) and a plain lethal duel by turns; the profile is fitted on the plain one
        const yieldRule = k % 2 === 0, D = A.startDuel(a, b, { kind: 'duel', lethal: true, toYield: yieldRule });
        const shown = D && D.measure ? D.measure.pct : null;
        A.duelAuto(D); A.S.queue = [];
        const win = D.result === 'win' ? 1 : 0;
        if (shown != null) rows.push([shown, win]);
        if (!yieldRule) prof.push([shownProfile, win]);
        b.gear.weapon = keep;
      }
    });
    return { screen: rows.length ? L.bins(rows) : null, profile: L.bins(prof) };
  };
  // duels with beasts, alone and with a hunting party of 8
  L.beasts = function (n, seed) {
    const ids = L.pool(seed, 300), r = L.rng(seed + 1), rows = [], bs = Object.keys(A.BEASTS || {});
    L.quiet(() => {
      for (let k = 0; k < n; k++) {
        const a = A.P(ids[Math.floor(r() * ids.length)]), bid = bs[Math.floor(r() * bs.length)], party = r() < 0.5;
        a.health = [100, 100, 80, 60][Math.floor(r() * 4)]; a.wounds = [];
        A.S.pc = a.id; A.S.queue = [];
        const D = A.startDuel(a, { beastId: bid, mod: 1 }, { kind: 'beast', forceSolo: true, grounded: true, party: party ? { n: 8 } : undefined });
        if (!D || !D.a) continue;
        const shown = D.measure ? D.measure.pct : null;
        A.duelAuto(D); A.S.queue = [];
        if (shown != null) rows.push([shown, D.result === 'win' || D.result === 'beastfled' ? 1 : 0]);
      }
    });
    return rows.length ? L.bins(rows) : null;
  };
  // the converted event choices: the odds the choice shows against the roll. fx are held back so the life goes on.
  L.honest = function (n, seed) {
    const C = (A.FL && A.FL.CONVERTED) || [];
    if (!C.length) return null;
    const r = L.rng(seed), rows = [], byScale = {};
    const af = A.applyFx; A.applyFx = () => '';
    try {
      for (let k = 0; k < n; k++) {
        if (k % 40 === 0) {
          A.newGame({ seed: seed + k, race: 'human', realm: ['POL-01', 'POL-02', 'POL-05'][k % 3], status: ['peasant', 'noble', 'artisan', 'merchant'][(k / 40) % 4], sex: k % 80 ? 'M' : 'F', startAge: 18 + (k % 7) * 6 });
          const pc = A.pc();
          for (const s of ['melee', 'sword', 'spear', 'axe', 'unarmed', 'shield']) pc.skills[s] = Math.floor(r() * 70);
          pc.health = 40 + Math.floor(r() * 61);
        }
        const x = C[Math.floor(r() * C.length)], e = A.EV[x.id];
        if (!e) continue;
        const q = { type: 'event', ev: x.id, ctx: {} };
        A.S.queue = [q];
        let v; try { v = A.eventView(q); } catch (err) { continue; }
        if (!v || v.skip) continue;
        const vi = v.choices.findIndex(c => c.i === x.i);
        if (vi < 0 || v.choices[vi].odds == null) continue;
        const shown = v.choices[vi].odds;
        try { A.eventChoose(vi); } catch (err) { continue; }
        if (!q.result || q.result.success == null) continue;
        rows.push([shown, q.result.success ? 1 : 0]);
        (byScale[x.scale] = byScale[x.scale] || []).push([shown, q.result.success ? 1 : 0]);
        A.S.queue = [];
      }
    } finally { A.applyFx = af; A.S.queue = []; }
    const out = L.bins(rows, [0, 10, 25, 40, 60, 75, 90, 101], 60);
    out.byScale = Object.fromEntries(Object.entries(byScale).map(([k, v]) => [k, { n: v.length, shown: Math.round(v.reduce((a, y) => a + y[0], 0) / v.length * 10) / 10, real: Math.round(1000 * v.reduce((a, y) => a + y[1], 0) / v.length) / 10 }]));
    return out;
  };
  // the group resolver against the sentences of GD.TIERS, rolled (A.groupFight) and in closed form (A.groupOddsSides)
  L.group = function (n) {
    const T = k => ({ w: GD.CROWD[k].w, sta: GD.CROWD[k].sta, n: 1 }), many = (k, m) => Object.assign(T(k), { n: m });
    const claims = [
      ['Trained vs 2 Brawlers', 'Brawler: "two or three of them make one soldier"', [T(2)], [many(1, 2)]],
      ['Trained vs 3 Brawlers', '', [T(2)], [many(1, 3)]],
      ['Veteran vs 2 Trained', 'Veteran: "worth two or three regulars at once"', [T(3)], [many(2, 2)]],
      ['Veteran vs 3 Trained', '', [T(3)], [many(2, 3)]],
      ['Elite vs 7 Trained', 'Elite: "can take 7-10 regulars or about 4 veterans"', [T(4)], [many(2, 7)]],
      ['Elite vs 10 Trained', '', [T(4)], [many(2, 10)]],
      ['Elite vs 4 Veterans', '', [T(4)], [many(3, 4)]],
      ['Master vs 20 Trained', 'Master: "takes 20-30 regulars or 8-10 veterans"', [T(5)], [many(2, 20)]],
      ['Master vs 30 Trained', '', [T(5)], [many(2, 30)]],
      ['Master vs 8 Veterans', '', [T(5)], [many(3, 8)]],
      ['Master vs 10 Veterans', '', [T(5)], [many(3, 10)]],
      ['3 Trained vs Elite', 'Plan, Power 3: "3 Trained beat 1 Elite about two times in three"', [many(2, 3)], [T(4)]],
    ];
    const out = claims.map(([k, src, a, b]) => {
      const closed = A.groupOddsSides(A.groupSide(a), A.groupSide(b), {});
      let w = 0; for (let i = 0; i < n; i++) if (A.groupFight(a, b, {}).win) w++;
      return { k, src, closed: Math.round(closed * 1000) / 10, rolled: Math.round(1000 * w / n) / 10, n };
    });
    let twoThirds = null;
    for (let m = 3; m <= 30 && twoThirds == null; m++) if (A.groupOddsSides(A.groupSide([many(2, m)]), A.groupSide([T(4)]), {}) >= 2 / 3) twoThirds = m;
    return { claims: out, trainedToBeatEliteTwoInThree: twoThirds };
  };
  // the beast tier texts against duels: fighters bucketed by tier, against every beast of a tier, alone or in a party
  L.tiers = function (n, seed) {
    const ids = L.pool(seed, 460), r = L.rng(seed + 7), byT = {};
    for (const id of ids) { const t = A.tierOf(A.fightWorth(A.P(id))).k; (byT[t] = byT[t] || []).push(id); }
    const of = tier => Object.keys(A.BEASTS || {}).filter(b => A.beastTier(b) === tier);
    const run = (ft, tier, party) => {
      const fs = byT[ft] || [], bs = of(tier); if (!fs.length || !bs.length) return null;
      let w = 0, m = 0;
      L.quiet(() => {
        for (let k = 0; k < n; k++) {
          const a = A.P(fs[Math.floor(r() * fs.length)]); a.health = 100; a.wounds = [];
          A.S.pc = a.id; A.S.queue = [];
          const D = A.startDuel(a, { beastId: bs[k % bs.length], mod: 1 }, { kind: 'beast', forceSolo: true, grounded: true, party: party ? { n: 8 } : undefined });
          if (!D || !D.a) continue;
          A.duelAuto(D); A.S.queue = []; m++;
          if (D.result === 'win' || D.result === 'beastfled') w++;
        }
      });
      return m ? Math.round(1000 * w / m) / 10 : null;
    };
    return [
      { k: 'animal: Veteran alone', claim: 50, real: run('t3', 'animal', false) },
      { k: 'animal: Trained alone', claim: 25, real: run('t2', 'animal', false) },
      { k: 'animal: Trained with a party', claim: 90, real: run('t2', 'animal', true) },
      { k: 'great: Master with a party', claim: 50, real: run('t5', 'great', true) },
      { k: 'great: Elite with a party', claim: 10, real: run('t4', 'great', true) },
      { k: 'great: Master alone ("usually dies")', claim: 25, max: 50, real: run('t5', 'great', false) },
    ];
  };
};

// ---- the runner ------------------------------------------------------------------------------------------------------
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_SRC = path.join(root, 'features/48-fight-ladder/audit.core.js');
async function main() {
  const require = createRequire(import.meta.url);
  let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
  const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
  const files = args.filter(a => !a.startsWith('--')).map(f => path.resolve(f));
  if (!files.length) files.push(path.join(root, 'index.html'));
  const quick = args.includes('--quick'), N = quick ? 0.25 : 1;
  const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
  const out = { date: new Date().toISOString().slice(0, 10), builds: [] };
  for (const file of files) {
    const page = await browser.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
    await page.goto(pathToFileURL(file).href);
    await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    const has = await page.evaluate(() => !!(window.A && A.FL && A.FL.audit));
    if (!has) await page.evaluate(`(function(){\n${fs.readFileSync(AUDIT_SRC, 'utf8')}\n})()`);   // a build without the feature: read it with the same tagger
    await page.evaluate(FIGHTS_LAB);
    const R = { file: path.relative(root, file), build: await page.evaluate(() => window.ARDAN_BUILD), featureBuilt: has };
    R.audit = await page.evaluate(() => {
      const a = A.FL.audit(); a.converted = a.converted || 0;
      // what is left behind plain checks in scenes where blows fall, and why it is not a fight on the ladder
      const left = {};
      for (const id in A.EV) { const e = A.EV[id]; (e.choices || []).forEach((c, i) => {
        if (!c.check || c.check.fight) return; const t = A.FL.tag(e, i); if (!t || !(A.FL.deadly(A.FL.cost(c.lose && c.lose.fx)))) return;
        if (!A.FL.RX.scene.test((A.FL.words(e.text) + ' ' + A.FL.words(c.t)).toLowerCase())) return;
        const why = t.fight ? (t.ranged ? 'a shot (bow, crossbow, thrown)' : t.child ? 'children scuffling' : 'other') : t.why === 'not a fight' ? 'running, hiding, talking or paying' : 'no blow traded (an accident, a climb, a storm)';
        left[why] = (left[why] || 0) + 1; }); }
      a.deadlyPlainInFightScenes = left;
      a.convertedList = ((A.FL.CONVERTED) || []).map(x => { const c = A.EV[x.id].choices[x.i]; return { id: x.id, i: x.i, label: A.FL.words(c.t).slice(0, 70), skill: c.check.s, s2: c.check.s2, d: c.check.d, deadly: x.deadly, made: x.made, spec: c.check.fight }; });
      return a;
    });
    console.log(`${R.file}: ${R.audit.events} events, ${R.audit.choices} choices, ${R.audit.fights} fights (${JSON.stringify(R.audit.byScale)})`);
    console.log(`  decided by: ${JSON.stringify(R.audit.byDecided)}; clashes ${JSON.stringify(R.audit.clashes)} (total ${R.audit.clashTotal}); converted ${R.audit.converted} (${R.audit.convertedDeadly} that can kill or maim)`);
    R.group = await page.evaluate(n => FLAB.group(n), Math.round(3000 * N));
    console.log('  group: ' + R.group.claims.map(c => `${c.k} ${c.closed}% (rolled ${c.rolled}%)`).join('; ') + `; Trained needed to beat an Elite 2 in 3: ${R.group.trainedToBeatEliteTwoInThree}`);
    R.tiers = await page.evaluate(([n, s]) => FLAB.tiers(n, s), [Math.round(500 * N), 4101]);
    console.log('  beast tiers: ' + R.tiers.map(t => `${t.k} ${t.real}% (text ${t.claim}%)`).join('; '));
    R.duels = await page.evaluate(([n, s]) => FLAB.duels(n, s), [Math.round(2400 * N), 4201]);
    console.log(`  duels: screen ${R.duels.screen ? `max bin error ${R.duels.screen.maxErr}, mean ${R.duels.screen.meanErr}` : 'not shown'}; profile max bin error ${R.duels.profile.maxErr}, mean ${R.duels.profile.meanErr}`);
    R.beasts = await page.evaluate(([n, s]) => FLAB.beasts(n, s), [Math.round(1600 * N), 4301]);
    if (R.beasts) console.log(`  beasts: screen max bin error ${R.beasts.maxErr}, mean ${R.beasts.meanErr}`);
    R.honest = await page.evaluate(([n, s]) => FLAB.honest(n, s), [Math.round(4000 * N), 4401]);
    if (R.honest) console.log(`  converted choices: ${R.honest.n} rolls, max bin error ${R.honest.maxErr}, mean ${R.honest.meanErr}`);
    R.pageErrors = errs.slice(0, 5);
    out.builds.push(R);
    await page.close();
  }
  await browser.close();
  const dest = path.resolve(root, opt('json') || 'reports/fights-audit.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 1));
  console.log('wrote ' + path.relative(root, dest));
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(e => { console.error(e); process.exit(1); });
