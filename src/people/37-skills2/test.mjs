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

export const limits = { sk2Shadow: 3600 };
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
};
