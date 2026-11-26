// 37-skills2 (the skills rebuild, docs/design/skills-v2.md §10 steps 3 to 5): since the switch the rungs hold the level;
// the save step 'skills2' turns every sample save's S1 tables into rungs with nothing read differently on load (the day
// of the switch), and over bot lives the rungs read what S1 read but for the player's even levels.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

export const limits = { sk5Lives: 3600, sk2Migrate: 2400 };
export default {
  // step 5, the switch: over three bot lives, month by month, what every check reads through the rungs (A.skill since
  // the switch) is compared with what S1 read of the same state (A.skill with A.SK2.on put false for the read). Anyone
  // but the player reads exactly the same. The player reads the same wherever his rung is an odd level; where it differs,
  // the rung is the even level of a C, B or A step (S1 read that step's value; the rung reads half way to the next) and
  // both reads stand in the same S1 step. The player's stored rungs are never stale at a month's end.
  async sk5Lives(pg) {
    const lives = [
      { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 },
      { seed: 7, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'F', startAge: 18 },
      { seed: 2024, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M', startAge: 14 },
    ];
    const r = await pg.evaluate((lives) => {
      const SK2 = A.SK2, keys = Object.keys(GD.SKILLS), out = { months: 0, pairs: 0, people: 0, bad: [], nBad: 0, even: 0, pcPairs: 0, stale: 0, staleAt: [], plays: [], on: !!(SK2 && SK2.on), ranks: {} };
      if (!SK2 || !SK2.read) return Object.assign(out, { none: true });
      const E = SK2.E();
      const s1Of = (p, k) => { SK2.on = false; try { return A.skill(p, k); } finally { SK2.on = true; } };
      const look = () => {
        out.months++;
        const pc = A.pc();
        for (const id in A.S.people) {
          const p = A.S.people[id]; if (!p || !p.alive) continue;
          out.people++;
          for (const k of keys) {
            out.pairs++; if (p === pc) out.pcPairs++;
            const a = A.skill(p, k), b = s1Of(p, k);
            if (a === b) continue;
            // the one allowed difference: the player's even level of a C, B or A step
            const rg = p === pc ? SK2.rungFor(p, k) : null, raw = A.SK.reads(p, k), raw1 = A.SK.s1reads(p, k);
            const ok = rg && rg.lv % 2 === 0 && 'CBA'.includes(rg.rank) && E.s1LevelOfValue(raw + 1e-9) === E.s1LevelOfValue(raw1 + 1e-9) && a > b;
            if (ok) { out.even++; continue; }
            out.nBad++; if (out.bad.length < 8) out.bad.push(`${A.S.year} ${id}${p === pc ? ' (pc)' : ''} ${k}: rungs ${a}, S1 ${b}${rg ? ' at ' + rg.rank + rg.lv : ''}`);
          }
        }
        if (pc && pc.alive) {
          const st = SK2.stale(pc); if (st.length) { out.stale++; if (out.staleAt.length < 4) out.staleAt.push(A.S.year + ':' + st.join(',')); }
          for (const id in pc.ks || {}) { const s = SK2.IX().BY[id]; if (s) out.ranks[s.rank] = (out.ranks[s.rank] || 0) + 1; }
        }
      };
      for (const o of lives) {
        T.enter(o);
        A.onMonth.push(look);
        try { out.plays.push(T.play(6)); } finally { const i = A.onMonth.indexOf(look); if (i >= 0) A.onMonth.splice(i, 1); }
      }
      return out;
    }, lives);
    if (r.none) return { ok: false, detail: 'no A.SK2 on the page' };
    const ok = r.on && r.nBad === 0 && r.stale === 0 && r.months >= 150 && r.pairs > 1e6;
    return { ok, detail: `SK2.on ${r.on ? 'true' : 'FALSE'}; ${r.months} months over three lives (${r.plays.join(', ')}), ${r.pairs} reads of ${r.people} person-months (${r.pcPairs} the player's): ` +
      `${r.nBad} differ from S1's read beyond the even level${r.nBad ? ' (' + r.bad.join('; ') + ')' : ''}; ${r.even} of the player's reads stand on an even level, half way up their S1 step; ` +
      `the player's rungs stale at ${r.stale} month ends${r.stale ? ' (' + r.staleAt.join('; ') + ')' : ''}; rungs held by rank, summed over months ${JSON.stringify(r.ranks)}` };
  },

  // step 4: every sample save loads through the step 'skills2' (save version 16); for the player and every living person
  // and each of the 38 keys, what a check reads through the rungs equals what S1 read before the step; every held rung
  // sits at a level from 1 to 10 in its rank's band; the step is the same on a second load and a no-op on the upgraded
  // state; the perks a person holds are those the release reads from his numbers
  async sk2Migrate(pg) {
    const out = [];
    for (const f of saveFiles()) {
      const res = await pg.evaluate(`(async () => {
        const b = ${JSON.stringify(b64(f))}, name = ${JSON.stringify(path.basename(f))};
        const bin = atob(b), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const SV = A.V2SAVE, SK2 = A.SK2, keys = Object.keys(GD.SKILLS), bad = [];
        // what S1 read before the step: run every upgrade step but 'skills2' on a copy
        const d0 = await SAVES.decode(bytes), ver0 = d0.S.ver;
        // (since the switch, S1's reads: the rungs off for the copy's load and its reads)
        const keep = SV.STEPS, on0 = SK2.on; SV.STEPS = keep.filter(s => s[0] !== 'skills2'); SK2.on = false;
        let before = {};
        try { UI.enterSaveSafe(d0); for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.alive) before[id] = keys.map(k => A.skill(p, k)); } }
        finally { SV.STEPS = keep; SK2.on = on0; }
        const s0 = JSON.stringify(A.S);
        // the real load
        const d = await SAVES.decode(bytes), ok = UI.enterSaveSafe(d);
        if (!ok) return { f: name, bad: ['did not load'] };
        const steps = (SV.last && SV.last.steps) || [];
        if (ver0 < SV.VER && !steps.includes('skills2')) bad.push('no skills2 step (' + steps.join(',') + ')');
        if (A.S.ver !== SV.VER || SV.VER < 17) bad.push('version ' + A.S.ver);
        if (!(A.S.sk2v >= 2)) bad.push('sk2v ' + A.S.sk2v);
        let n = 0, diff = 0;
        for (const id in before) {
          const p = A.S.people[id]; if (!p) { bad.push('lost ' + id); continue; }
          keys.forEach((k, i) => { n++; const v = SK2.read(p, k); if (v !== before[id][i]) { diff++; if (diff <= 4) bad.push(id + ' ' + k + ' ' + before[id][i] + ' -> ' + v); } });
        }
        // the player's rungs: whole, in band, fresh; everything else of the state as S1 left it
        const pc = A.pc(), E = SK2.E(), IX = SK2.IX();
        let rungs = 0, top = {};
        if (pc && pc.alive) {
          if (!pc.ks) bad.push('no pc.ks');
          for (const id in pc.ks || {}) {
            const s = IX.BY[id], e = pc.ks[id]; rungs++;
            if (!s) { bad.push('unknown rung ' + id); continue; }
            if (!(e.lv >= 1 && e.lv <= 10 && Number.isInteger(e.lv))) bad.push(id + ' level ' + e.lv);
            if (!(e.xp == null || (e.xp >= 0 && e.xp < E.cost(s.rank, e.lv)))) bad.push(id + ' xp ' + e.xp);
            top[s.family] = Math.max(top[s.family] || 0, E.value(s.rank, e.lv));
          }
          for (const c in pc.sk || {}) if (pc.sk[c].lv > 0 && top[c] !== A.SK.VALUES[pc.sk[c].lv]) bad.push('rung of ' + c + ' reads ' + top[c] + ' for ' + A.SK.VALUES[pc.sk[c].lv]);
          const st = SK2.stale(pc); if (st.length) bad.push('stale ' + st.join(','));
          // the perks the release reads from the numbers are the perk effects the held rungs carry (§7)
          const want = new Set(A.perkNames(pc).map(x => x[1])), have = new Set();
          for (const id in pc.ks || {}) for (const b of IX.BY[id].levels) if (b.at <= pc.ks[id].lv) for (const e of b.effects) if (e.type === 'perk') have.add(e.name);
          const pk = Object.keys(pc.skills || {}).filter(k => A.SK.LEG[k]);
          if (!pk.length) for (const w of want) if (!have.has(w)) bad.push('perk ' + w + ' on no rung');
        }
        // only the new fields changed: S1's table and every number are as the other steps left them
        const S1 = JSON.parse(s0), S2 = JSON.parse(JSON.stringify(A.S));
        // (the switch holds back the experience past an odd level's bar: s.hold, landed by the first month)
        // (and a season's ledger counts levels on the rungs since the switch, S1's steps with them off: its o0)
        const strip = S => { delete S.sk2v; delete S.ver; const q = S.people[S.pc]; if (q) { delete q.ks; delete q.kc; for (const c in q.sk || {}) { const e = q.sk[c]; e.xp = Math.round(((e.xp || 0) + (e.hold || 0)) * 100) / 100; delete e.hold; }
          const L = q.skl; for (const K of [L && L.k, L && L.prev && L.prev.k]) for (const c in K || {}) delete K[c].o0; } return S; };
        // the first path where two states differ (for the detail)
        const firstDiff = (a, b, at) => { if (JSON.stringify(a) === JSON.stringify(b)) return null; if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return at + ': ' + JSON.stringify(a).slice(0, 40) + ' / ' + JSON.stringify(b).slice(0, 40); for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = firstDiff(a[k], b[k], at + '.' + k); if (d) return d; } return at; };
        { const x1 = strip(S1), x2 = strip(S2); if (JSON.stringify(x1) !== JSON.stringify(x2)) bad.push('the step changed more than its own fields (' + firstDiff(x1, x2, 'S') + ')'); }
        // a second load is the same, and an upgrade of the upgraded state changes nothing
        const one = JSON.stringify(A.S);
        const d2 = await SAVES.decode(bytes); UI.enterSaveSafe(d2);
        if (JSON.stringify(A.S) !== one) bad.push('a second load differs');
        SV.upgrade(A.S); if (JSON.stringify(A.S) !== one) bad.push('upgrading again changed it');
        // the first month lands what the switch held back: each such family stands on its even level, and reads more
        let held = 0;
        if (pc && pc.alive && pc.sk) {
          const hs = Object.keys(pc.sk).filter(c => pc.sk[c].hold > 0), v0 = hs.map(c => A.skill(pc, c));
          SK2.land(pc); for (const c of hs) A.SK.mirror(pc, c); SK2.sync(pc);
          hs.forEach((c, i) => { const r = SK2.rungFor(pc, c); if (!(r && r.lv % 2 === 0 && 'CBA'.includes(r.rank))) bad.push('landed ' + c + ' at ' + (r ? r.rank + r.lv : 'none')); else if (!(A.skill(pc, c) >= v0[i])) bad.push('landed ' + c + ' reads less'); else held++; });
          if (SK2.stale(pc).length) bad.push('stale after landing');
        }
        return { f: name, ver0, n, rungs, held, bad };
      })()`);
      out.push(res);
    }
    const bad = out.filter(r => r.bad.length);
    const reads = out.reduce((t, r) => t + (r.n || 0), 0);
    const v16 = out.filter(r => r.ver0 === 16).length, held = out.reduce((t, r) => t + (r.held || 0), 0);
    return { ok: !bad.length && out.length >= 22 && v16 >= 1 && reads > 1e4, detail: `${out.length} saves (${v16} of version 16), ${reads} reads compared, ${out.reduce((t, r) => t + (r.rungs || 0), 0)} player rungs, ${held} families held back on load and landed on their even level; ` +
      (bad.length ? bad.map(r => `${r.f}: ${r.bad.slice(0, 4).join('; ')}`).join(' | ') : 'every read the same, every rung in band, the step idempotent') };
  },
};
