// 37-skills2 (the skills rebuild, docs/design/skills-v2.md §10 steps 3 and 4): the adapter computes beside S1, and the
// save step 'skills2' turns every sample save's S1 tables into rungs with nothing read differently.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

export const limits = { sk2Shadow: 3600, sk2Migrate: 2400 };
export default {
  // step 3: over three bot lives, month by month, SK2.read(p, k) equals A.skill(p, k) for every living person and each
  // of the 38 keys a check may name; the player's stored rungs are never behind S1's table at a month's end
  async sk2Shadow(pg) {
    const lives = [
      { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 },
      { seed: 7, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'F', startAge: 18 },
      { seed: 2024, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M', startAge: 14 },
    ];
    const r = await pg.evaluate((lives) => {
      const SK2 = A.SK2, keys = Object.keys(GD.SKILLS), out = { months: 0, pairs: 0, people: 0, bad: [], nBad: 0, stale: 0, staleAt: [], plays: [], off: SK2 && SK2.on === false, ranks: {} };
      if (!SK2 || !SK2.read) return Object.assign(out, { none: true });
      const look = () => {
        out.months++;
        for (const id in A.S.people) {
          const p = A.S.people[id]; if (!p || !p.alive) continue;
          out.people++;
          for (const k of keys) {
            out.pairs++;
            const a = A.skill(p, k), b = SK2.read(p, k);
            if (a !== b) { out.nBad++; if (out.bad.length < 8) out.bad.push(`${A.S.year} ${id} ${k}: ${a} vs ${b}`); }
          }
        }
        const pc = A.pc();
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
    const ok = r.off && r.nBad === 0 && r.stale === 0 && r.months >= 150 && r.pairs > 1e6;
    return { ok, detail: `SK2.on ${r.off ? 'false' : 'TRUE'}; ${r.months} months over three lives (${r.plays.join(', ')}), ${r.pairs} reads of ${r.people} person-months: ` +
      `${r.nBad} differ from A.skill${r.nBad ? ' (' + r.bad.join('; ') + ')' : ''}; the player's rungs behind S1's table at ${r.stale} month ends${r.stale ? ' (' + r.staleAt.join('; ') + ')' : ''}; rungs held by rank, summed over months ${JSON.stringify(r.ranks)}` };
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
        const keep = SV.STEPS; SV.STEPS = keep.filter(s => s[0] !== 'skills2');
        let before = {};
        try { UI.enterSaveSafe(d0); for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.alive) before[id] = keys.map(k => A.skill(p, k)); } }
        finally { SV.STEPS = keep; }
        const s0 = JSON.stringify(A.S);
        // the real load
        const d = await SAVES.decode(bytes), ok = UI.enterSaveSafe(d);
        if (!ok) return { f: name, bad: ['did not load'] };
        const steps = (SV.last && SV.last.steps) || [];
        if (ver0 < SV.VER && !steps.includes('skills2')) bad.push('no skills2 step (' + steps.join(',') + ')');
        if (A.S.ver !== 16) bad.push('version ' + A.S.ver);
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
        const strip = S => { delete S.sk2v; delete S.ver; const q = S.people[S.pc]; if (q) { delete q.ks; delete q.kc; } return JSON.stringify(S); };
        if (strip(S1) !== strip(S2)) bad.push('the step changed more than its own fields');
        // a second load is the same, and an upgrade of the upgraded state changes nothing
        const one = JSON.stringify(A.S);
        const d2 = await SAVES.decode(bytes); UI.enterSaveSafe(d2);
        if (JSON.stringify(A.S) !== one) bad.push('a second load differs');
        SV.upgrade(A.S); if (JSON.stringify(A.S) !== one) bad.push('upgrading again changed it');
        return { f: name, ver0, n, rungs, bad };
      })()`);
      out.push(res);
    }
    const bad = out.filter(r => r.bad.length);
    const reads = out.reduce((t, r) => t + (r.n || 0), 0);
    return { ok: !bad.length && out.length >= 21 && reads > 1e4, detail: `${out.length} saves, ${reads} reads compared, ${out.reduce((t, r) => t + (r.rungs || 0), 0)} player rungs; ` +
      (bad.length ? bad.map(r => `${r.f}: ${r.bad.slice(0, 4).join('; ')}`).join(' | ') : 'every read the same, every rung in band, the step idempotent') };
  },
};
