// Tests for src/people/9999975-level (D-181): a person's level is the power ladder's, earned by defeats; each level brings
// stat points, bounded by the race's ceiling and the body's room at this age; placed points never move. World-robust
// (H-082): the duels and the NPCs are read over several worlds with a seed fallback, the rules over pooled numbers, and
// the bars come from the rule (a weak foe's share of a level is the formula's, not one world's luck).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

const GATE = () => typeof A !== 'undefined' && !!A.LV && !!A.POWER && !!A.DATA.level;
const NO = { ok: false, detail: 'A.LV not in this build' };

export const limits = { statMigrate: 2400, statNpc: 1800 };
export default {
  // a duel won raises the level's experience by exactly what the ladder says for that foe; a hunt's beast killed does too;
  // a far weaker foe gives little: under a fiftieth of a level for a foe forty levels down, nothing at thirty past it
  async lvFromDefeats(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = { duels: [], beasts: [], tried: [] };
      const stand = p => p.lv.L + p.lv.f;
      const res = T.trySeeds(T.seedRun(9751, 6), seed => {
        out.tried.push(seed);
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
        const pc = A.pc(); LV.seed(pc);
        // foes about his match or above: the sturdiest grown men of the world, by the ladder
        const foes = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 18 && A.age(p) < 45 && !p.ruler)
          .sort((a, b) => LV.level(b) - LV.level(a) || (a.id < b.id ? -1 : 1)).slice(0, 40);
        for (const foe of foes) {
          if (out.duels.length >= 3) break;
          pc.health = 100; pc.alive = true; foe.health = 100;
          const before = stand(pc), L = pc.lv.L, F = LV.level(foe);
          A.S.queue = []; A.startDuel(pc, foe, { kind: 'duel', lethal: false });
          const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue;
          A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
          if (q.d.result !== 'win' || !pc.alive) continue;
          const want = LV.xpFor(F, L) * LV.D.xp.how.defeat / LV.need(L);
          out.duels.push({ seed, L, F, f0: Math.round((before - L) * 1000) / 1000, gain: Math.round((stand(pc) - before) * 1000) / 1000, want: Math.round(Math.min(want, 99) * 1000) / 1000 });
        }
        // a beast of the release, alone (a hunt's fight): a kill raises him by its level on the ladder
        for (let i = 0; i < 12 && out.beasts.length < 1; i++) {
          pc.health = 100; pc.alive = true;
          const before = stand(pc);
          A.S.queue = []; const D = A.startDuel(pc, { beastId: 'CRE-21' }, { kind: 'beast', lethal: true, forceSolo: true });
          const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue;
          A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
          if (q.d.result === 'win' && pc.alive) out.beasts.push({ seed, F: LV.foeLevel(q.d.b, null), gain: Math.round((stand(pc) - before) * 1000) / 1000 });
          else if (!pc.alive) break;
        }
        return out.duels.length >= 3 ? seed : null;
      });
      // the rule, read at three levels of the ladder: a foe forty levels down, and one thirty levels down past the line
      out.weak = [24, 100, 175].map(L => [L, LV.xpFor(L - 40, L) / LV.need(L), LV.xpFor(L - 30, L), LV.xpFor(L + 20, L) / LV.need(L)]);
      out.seed = res.seed;
      return out;
    });
    // within the level he stood in, the gain is the rule's to the rounding; across a level it is less (the next asks more)
    const fit = r.duels.every(d => (d.want === 0 ? d.gain === 0 : d.gain > 0 && d.gain <= d.want + 0.002 && (d.f0 + d.want >= 1 || Math.abs(d.gain - d.want) <= 0.002)));
    const beast = r.beasts.length === 0 || r.beasts.every(b => b.gain > 0 || b.F + 30 <= 0);
    const weak = r.weak.every(([L, w40, w30, up20]) => w40 < 0.02 && w30 === 0 && up20 > 0.5);
    const ok = r.duels.length >= 3 && r.duels.some(d => d.gain > 0) && fit && beast && weak;
    return { ok, detail: `worlds tried ${r.tried.join(', ')}; duels won ${r.duels.map(d => `at ${d.L} over ${d.F}: +${d.gain} of a level (rule ${d.want})`).join('; ')}; beasts killed ${r.beasts.map(b => `level ${b.F}: +${b.gain}`).join('; ') || 'none won in 12 tries'}; a foe 40 levels down gives ${r.weak.map(x => `${x[1].toFixed(4)} of a level at ${x[0]}`).join(', ')}; 30 down: ${r.weak.map(x => x[2]).join(', ')}; 20 up: ${r.weak.map(x => x[3].toFixed(2)).join(', ')} of a level` };
  },

  // no farming: a thousand defeats of men twenty-five levels below him lift a grown man no further than the line (the
  // foe's level and xp.ceilAbove), the last five hundred add nothing, and twenty defeats of soldiers give more
  async lvNoFarm(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = [];
      for (const seed of [9761, 9762, 9763]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
        const pc = A.pc(); LV.seed(pc);
        const L0 = pc.lv.L, weak = Math.max(1, L0 - 20), line = LV.D.xp.ceilAbove;
        for (let i = 0; i < 500; i++) LV.defeat(pc, weak, 'kill');
        const mid = pc.lv.L + pc.lv.f;
        for (let i = 0; i < 500; i++) LV.defeat(pc, weak, 'kill');
        const grind = pc.lv.L;
        // a second man of the same level: twenty soldiers
        const q = Object.values(A.S.people).find(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 20 && A.age(p) < 40);
        q.lv = { L: L0, f: 0, pts: 0 };
        for (let i = 0; i < 20; i++) LV.defeat(q, 100, 'kill');
        // and none at all from a foe far below
        const far = LV.defeat(q, Math.max(1, q.lv.L - 40), 'kill');
        out.push({ seed, L0, weak, line, mid: Math.round(mid * 100) / 100, grind, end: pc.lv.L + pc.lv.f, soldiers: q.lv.L, far });
      }
      return out;
    });
    const ok = r.every(x => x.grind <= x.weak + x.line && x.end >= x.mid - 1e-9 && x.end - x.mid <= 1 && x.soldiers > x.grind && x.far === 0);
    return { ok, detail: r.map(x => `world ${x.seed}: from ${x.L0}, 1,000 defeats at ${x.weak} reach ${x.grind} (${x.mid} after 500); 20 soldiers take a man from ${x.L0} to ${x.soldiers}; a foe 40 down then gives ${x.far} levels`).join('; ') };
  },

  // no placed stat passes the race's ceiling or the body's room at this age; a wound and old age lower what is read, not
  // what is placed; a child's room is smaller than a grown man's
  async statBounds(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = { n: 0, placed: 0, over: [], child: 0, wound: 0, old: 0, kept: 0, potOver: 0, rng: 0 };
      for (const seed of [9771, 9772, 9773]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
        const rng0 = JSON.stringify(A.rngState);
        const people = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== A.S.pc).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 60);
        for (const p of people) {
          LV.seed(p); p.lv.pts = 400;
          LV.placeByWhy(p, A.age(p) < 12 ? 'household' : 'post');
          out.n++; out.placed += LV.placed(p);
          for (const s of GD.STATS) {
            const e = LV.eff(p, s), room = LV.room(p, s), cap = LV.cap(p, s);
            if (e > room + 1e-6 && e > LV.base(p, s) + 1e-6) out.over.push(`${p.id} ${s} ${e.toFixed(1)} > ${room.toFixed(1)}`);
            if (room > cap + 1e-6 || cap > p.pot[s] * 1.02 + 1e-6) out.potOver++;
          }
          if (A.age(p) < 12) out.child += LV.room(p, 'str') < LV.cap(p, 'str') - 1e-6 ? 1 : 0;
          // a wound and forty more years: the read falls, the points placed stay
          const put = JSON.stringify(p.lv.put || {}), spd0 = A.stat(p, 'spd'), grownNot = A.age(p) < (GD.RACES[p.race].grown || 20);
          p.wounds.push({ k: 'limp', y: A.S.year });
          const spd1 = A.stat(p, 'spd');
          p.born -= 45;
          const spd2 = A.stat(p, 'spd');
          if (spd1 <= spd0) out.wound++;
          if (spd2 <= spd1 || grownNot) out.old++;
          if (JSON.stringify(p.lv.put || {}) === put) out.kept++;
          p.wounds.pop(); p.born += 45;
        }
        if (JSON.stringify(A.rngState) !== rng0) out.rng++;
      }
      out.kids = Object.values(A.S.people).filter(p => p.alive && p.st && A.age(p) < 12).length;
      return out;
    });
    const ok = r.n >= 150 && r.placed > r.n * 5 && !r.over.length && !r.potOver && r.wound === r.n && r.old === r.n && r.kept === r.n && r.rng === 0;
    return { ok, detail: `${r.n} people given 400 points each placed ${r.placed} in all; over the room ${r.over.length} ${r.over.slice(0, 3).join('; ')}; room or ceiling past the potential ${r.potOver}; a child's room below the ceiling ${r.child}; a limp lowered or kept speed for ${r.wound}, forty-five more years for ${r.old}, points kept for ${r.kept}; main stream moved in ${r.rng} worlds` };
  },

  // every sample save loads with the same A.stat for everyone, the player at his held level with nothing waiting and
  // nothing placed, and a second load the same
  async statMigrate(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const out = [];
    for (const f of saveFiles()) {
      const res = await pg.evaluate(`(async () => {
        const b = ${JSON.stringify(b64(f))}, name = ${JSON.stringify(path.basename(f))};
        const bin = atob(b), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const SV = A.V2SAVE, LV = A.LV, bad = [];
        const read = () => { const o = {}; for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.alive && p.st) o[id] = GD.STATS.map(s => A.stat(p, s)).join(','); } return o; };
        // the same save loaded without the step 'level'
        const keep = SV.STEPS; SV.STEPS = keep.filter(s => s[0] !== 'level');
        let before;
        try { const d0 = await SAVES.decode(bytes); if (!UI.enterSaveSafe(d0)) return { f: name, bad: ['did not load without the step'] }; before = read(); }
        finally { SV.STEPS = keep; }
        const d = await SAVES.decode(bytes), ver0 = d.S.ver;
        // a save made at version 18 or later may already hold the player's level (earned in its life): it loads as it was (H-146)
        const pc0 = d.S.people && d.S.people[d.S.pc], held0 = pc0 && pc0.lv && pc0.lv.L != null ? JSON.stringify(pc0.lv) : null;
        if (!UI.enterSaveSafe(d)) return { f: name, bad: ['did not load'] };
        if (A.S.ver !== SV.VER || SV.VER < 18) bad.push('version ' + A.S.ver);
        const steps = (SV.last && SV.last.steps) || [];
        if (ver0 < 18 && !steps.includes('level')) bad.push('no level step (' + steps.join(',') + ')');
        const after = read(); let n = 0, diff = 0;
        for (const id in before) { n++; if (after[id] !== before[id]) { diff++; if (diff <= 3) bad.push(id + ' ' + before[id] + ' -> ' + after[id]); } }
        const pc = A.pc();
        if (pc && pc.alive) {
          if (!pc.lv || !(pc.lv.L >= 1)) bad.push('no held level');
          else if (held0) { if (JSON.stringify(pc.lv) !== held0) bad.push('the held level changed on load'); }
          else {
            if (pc.lv.pts) bad.push('points waiting ' + pc.lv.pts);
            if (pc.lv.put) bad.push('points placed');
            const want = Math.max(LV.computed(pc), LV.floor(pc));
            if (pc.lv.L !== Math.min(1000, want)) bad.push('level ' + pc.lv.L + ' not ' + want);
          }
        }
        const one = JSON.stringify(A.S.people[A.S.pc] && A.S.people[A.S.pc].lv);
        const d2 = await SAVES.decode(bytes); UI.enterSaveSafe(d2);
        if (JSON.stringify(A.S.people[A.S.pc] && A.S.people[A.S.pc].lv) !== one) bad.push('a second load differs');
        return { f: name, n, L: pc && pc.lv ? pc.lv.L : null, bad };
      })()`);
      out.push(res);
    }
    const bad = out.filter(x => x.bad.length);
    return { ok: out.length >= 20 && !bad.length, detail: `${out.length} saves: ${out.map(x => `${x.f.replace(/\.ardan$/, '')} ${x.n} people, level ${x.L}`).join('; ')}${bad.length ? ' | BAD ' + bad.map(x => x.f + ': ' + x.bad.join(', ')).join(' | ') : ''}` };
  },

  // NPCs place their points by their post and temper: the same on a replay of the same years, and fitting their posts
  // (fighting men lean to strength and endurance, clerks and traders to wits); the main stream does not move for it
  async statNpc(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV;
      const run = seed => {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
        const people = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== A.S.pc && A.age(p) >= 16).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 120);
        for (const p of people) { LV.seed(p); p.lv.pts = 12; LV.queue(p); }
        const rng0 = JSON.stringify(A.rngState);
        for (const f of A.onYear) if (f.toString().includes('npcYear')) f();
        const placed = {};
        for (const p of people) placed[p.id] = [LV.wayOf(p), JSON.stringify(p.lv.put || {}), p.lv.pts, (p.lv.why || []).map(x => x[2]).join('|')];
        return { placed, moved: JSON.stringify(A.rngState) !== rng0, queue: (A.S.lvq || []).length };
      };
      const out = { worlds: [], fit: { way: 0, all: 0, ways: {} } };
      for (const seed of [9781, 9782]) {
        const a = run(seed), b = run(seed);
        const same = JSON.stringify(a.placed) === JSON.stringify(b.placed);
        let n = 0, none = 0;
        for (const id in a.placed) {
          const [way, put] = a.placed[id], o = JSON.parse(put), tot = Object.values(o).reduce((x, y) => x + y, 0);
          n++; if (!tot) none++;
          const W = LV.D.ways[way]; out.fit.all += tot; out.fit.way += (o[W[0]] || 0) + (o[W[1]] || 0); out.fit.ways[way] = (out.fit.ways[way] || 0) + 1;
        }
        out.worlds.push({ seed, same, n, none, moved: a.moved, queue: a.queue, sample: Object.values(a.placed).slice(0, 2).map(x => x[0] + ' ' + x[1] + ' (' + x[3].split('|')[0] + ')') });
      }
      return out;
    });
    // the post's own two stats take well over the third of the points that chance would give them
    const F = r.fit, share = F.way / Math.max(1, F.all);
    const ok = r.worlds.every(w => w.same && !w.moved && w.queue === 0 && w.none < w.n / 2) && share > 0.5;
    return { ok, detail: `${r.worlds.map(w => `world ${w.seed}: ${w.n} NPCs, the same on a replay ${w.same}, none placed ${w.none}, main stream moved ${w.moved}; e.g. ${w.sample.join('; ')}`).join(' | ')}; ${F.way} of ${F.all} points went to the two stats of the person's own way of life (${Object.entries(F.ways).map(([k, n]) => k + ' ' + n).join(', ')})` };
  },

  // the phone: at 375 x 667 the profile's button and the allocation sheet fit, every control is 44 points, no percentage,
  // a stat's note opens on a press (not a hover), and + then Keep places a point that stays placed
  async lvPhone(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(() => { T.enter({ seed: 9791, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 }); A.S.queue = []; const pc = A.pc(); A.LV.seed(pc); pc.lv.pts = 5; UI.tab = 'profile'; UI.ov = null; UI.render(); });
    const btn = await pg.evaluate(() => { const b = document.querySelector('.lv-place'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, t: b.textContent }; });
    await pg.click('.lv-place');
    const sheet = await pg.evaluate(() => {
      const m = document.querySelector('.lv-sheet'); if (!m) return null;
      const r = m.getBoundingClientRect(), small = [...m.querySelectorAll('button')].filter(b => { const q = b.getBoundingClientRect(); return q.width > 0 && (q.width < 44 || q.height < 44); }).map(b => b.className + ':' + b.textContent.trim());
      return { rows: m.querySelectorAll('.lv-row').length, left: r.left, right: r.right, vw: innerWidth, small, pct: /\d\s?%/.test(m.textContent), sideways: document.documentElement.scrollWidth > innerWidth, hoverAttrs: m.querySelectorAll('[onmouseover],[onmouseenter],[title]').length };
    });
    await pg.hover('.lv-sheet .lv-row[data-s="str"] .lv-name .tt'); const hov = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0));
    await pg.click('.lv-sheet .lv-row[data-s="str"] .lv-name .tt'); const open = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0));
    await pg.keyboard.press('Escape');
    const placed = await pg.evaluate(() => {
      const pc = A.pc(), s = GD.STATS.find(k => A.LV.canPlace(pc, k)); if (!s) return { none: true };
      const st0 = A.stat(pc, s), pts0 = pc.lv.pts;
      UI.A.lvPlus(s); UI.A.lvKeep();
      return { s, put: (pc.lv.put || {})[s] || 0, pts0, pts: pc.lv.pts, st0, st: A.stat(pc, s), closed: !UI.ov };
    });
    await pg.setViewportSize({ width: 1366, height: 768 });
    const ok = !!btn && btn.h >= 44 && btn.w >= 44 && !/\d/.test(btn.t) && !!sheet && sheet.rows === 6 && sheet.left >= 0 && sheet.right <= sheet.vw + 0.5 && !sheet.small.length && !sheet.pct && !sheet.sideways && !sheet.hoverAttrs &&
      hov === 0 && open > 0 && placed.put === 1 && placed.pts < placed.pts0 && placed.st >= placed.st0 && placed.closed;
    return { ok, detail: `button ${btn ? `"${btn.t}" ${Math.round(btn.w)}x${Math.round(btn.h)}` : 'missing'}; sheet ${sheet ? `${sheet.rows} rows, ${Math.round(sheet.left)}-${Math.round(sheet.right)} of ${sheet.vw}, small controls ${sheet.small.length} ${sheet.small.slice(0, 3).join(' ')}, percentages ${sheet.pct}, sideways ${sheet.sideways}` : 'missing'}; hover opened ${hov}, a press ${open}; placed ${JSON.stringify(placed)}` };
  },
};
