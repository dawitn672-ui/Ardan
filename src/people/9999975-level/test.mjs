// Tests for src/people/9999975-level (D-181): a person's level is the power ladder's, earned by defeats; each level brings
// stat points, bounded by the race's ceiling and the body's room at this age; placed points never move. World-robust
// (H-082): the duels and the NPCs are read over several worlds with a seed fallback, the rules over pooled numbers, and
// the bars come from the rule (a weak foe's share of a level is the formula's, not one world's luck).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOT } from '../../../tools/bench/bot.mjs';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

const GATE = () => typeof A !== 'undefined' && !!A.LV && !!A.POWER && !!A.DATA.level;
const NO = { ok: false, detail: 'A.LV not in this build' };

export const limits = { statMigrate: 2400, statNpc: 1800, lvAnchors: 3600 };
export default {
  // a duel won raises the level's experience by exactly what the ladder says for that foe; a hunt's beast killed does too;
  // a far weaker foe gives little but never nothing (order 91, D-184): a foe forty levels down gives under a tenth of a
  // fiftieth of a level (the rule: about 0.0054 at 60, 0.0036 at 100, 0.0017 at 175), one thirty down (where D-181's line
  // gave nothing) some
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
          // (crossing into the next level, the rest is measured against that level's need: a wall's step is dearer than the next)
          const f0 = before - L, cross = f0 + want >= 1 ? (1 - f0) + (want - (1 - f0)) * LV.need(L) / LV.need(L + 1) : want;
          out.duels.push({ seed, L, F, f0: Math.round(f0 * 1000) / 1000, gain: Math.round((stand(pc) - before) * 1000) / 1000, want: Math.round(Math.min(want, 99) * 1000) / 1000, cross: Math.round(Math.min(cross, 99) * 1000) / 1000 });
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
      out.weak = [60, 100, 175].map(L => [L, LV.xpFor(L - 40, L) / LV.need(L), LV.xpFor(L - 30, L), LV.xpFor(L + 20, L) / LV.need(L)]);
      out.seed = res.seed;
      return out;
    });
    // within the level he stood in, the gain is the rule's to the rounding; across a level it is less (the next asks more)
    // within his level the gain is the rule's to the rounding; crossing into the next, at least the rest of his level and at
    // most the rule's with the next level's need (more levels after it ask more again)
    const fit = r.duels.every(d => (d.want === 0 ? d.gain === 0 : d.gain > 0 && (d.f0 + d.want >= 1 ? d.gain >= 1 - d.f0 - 0.002 && d.gain <= d.cross + 0.01 : Math.abs(d.gain - d.want) <= 0.002)));
    const beast = r.beasts.length === 0 || r.beasts.every(b => b.gain > 0 || b.F + 30 <= 0);
    const weak = r.weak.every(([L, w40, w30, up20]) => w40 > 0 && w40 < 0.02 && w30 > 0 && up20 > 0.25 && up20 > w40 * 50);
    const ok = r.duels.length >= 3 && r.duels.some(d => d.gain > 0) && fit && beast && weak;
    return { ok, detail: `worlds tried ${r.tried.join(', ')}; duels won ${r.duels.map(d => `at ${d.L} over ${d.F}: +${d.gain} of a level (rule ${d.want})`).join('; ')}; beasts killed ${r.beasts.map(b => `level ${b.F}: +${b.gain}`).join('; ') || 'none won in 12 tries'}; a foe 40 levels down gives ${r.weak.map(x => `${x[1].toFixed(4)} of a level at ${x[0]}`).join(', ')}; 30 down: ${r.weak.map(x => x[2]).join(', ')}; 20 up: ${r.weak.map(x => x[3].toFixed(2)).join(', ')} of a level` };
  },

  // farming is slow, never nothing (order 91, D-184): a thousand defeats of men twenty levels below him lift a grown man
  // some way, slower and slower (the rule: from 30, some fifteen levels, the second five hundred adding less than the
  // first; the bar twenty-five), each of them gives something, and twenty defeats of soldiers take a man of the same level
  // further than the thousand
  async lvNoFarm(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = [];
      for (const seed of [9761, 9762, 9763]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
        // (from a grown man's 30, not the seeded level: on D-185's curve a seeded man may stand at the wall of 100 already)
        const pc = A.pc(); LV.seed(pc); pc.lv.L = 30; pc.lv.f = 0; pc.lv.ct = 0;
        const L0 = pc.lv.L, weak = Math.max(1, L0 - 20);
        const one = LV.xpFor(weak, L0);
        for (let i = 0; i < 500; i++) LV.defeat(pc, weak, 'kill');
        const mid = pc.lv.L + pc.lv.f;
        for (let i = 0; i < 500; i++) LV.defeat(pc, weak, 'kill');
        const end = pc.lv.L + pc.lv.f;
        // a second man of the same level: twenty soldiers
        const q = Object.values(A.S.people).find(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 20 && A.age(p) < 40);
        q.lv = { L: L0, f: 0, pts: 0 };
        for (let i = 0; i < 20; i++) LV.defeat(q, 100, 'kill');
        // and a little from a foe forty levels below him
        const f0 = q.lv.L + q.lv.f; LV.defeat(q, Math.max(1, q.lv.L - 40), 'kill');
        out.push({ seed, L0, weak, one, mid: Math.round(mid * 100) / 100, end: Math.round(end * 100) / 100, soldiers: q.lv.L, far: Math.round((q.lv.L + q.lv.f - f0) * 1e4) / 1e4 });
      }
      return out;
    });
    const ok = r.every(x => x.one > 0 && x.mid > x.L0 && x.end > x.mid && x.end - x.mid < x.mid - x.L0 && x.end - x.L0 <= 25 && x.soldiers > x.end && x.far > 0);
    return { ok, detail: r.map(x => `world ${x.seed}: from ${x.L0}, 1,000 defeats at ${x.weak} reach ${x.end} (${x.mid} after 500); 20 soldiers take a man from ${x.L0} to ${x.soldiers}; a foe 40 down then gives ${x.far} of a level`).join('; ') };
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
        // a save made since the level (version 18 and on) keeps the level it held, earned in play: only an older one is seeded
        // (save version 21, D-184): everyone with a held level has his walls settled, the classes worn, nothing paid
        for (const id in A.S.people) {
          const q = A.S.people[id]; if (!q || !q.lv || q.lv.L == null || !q.st) continue;
          if (q.lv.ct !== Math.floor(q.lv.L / 100) && ver0 < 21) { bad.push(id + ' walls ' + q.lv.ct + ' at ' + q.lv.L); break; }
          if (ver0 < 21 && ((q.lv.cr || []).some(x => x[2]) || q.lv.wp)) { bad.push(id + ' a class paid on load'); break; }
        }
        if (ver0 < 21 && !steps.includes('classes')) bad.push('no classes step (' + steps.join(',') + ')');
        if (pc && pc.alive && ver0 >= 18) { if (!pc.lv || !(pc.lv.L >= 1)) bad.push('no held level'); }
        else if (pc && pc.alive) {
          if (!pc.lv || !(pc.lv.L >= 1)) bad.push('no held level');
          else if (held0) { if (JSON.stringify(pc.lv) !== held0) bad.push('the held level changed on load'); }
          else {
            if (pc.lv.pts) bad.push('points waiting ' + pc.lv.pts);
            if (pc.lv.put) bad.push('points placed');
            const want = LV.seedLevel(pc);   // (D-184 addendum: the player's seed, the computed level a ceiling)
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
  // the walls (orders 91-94, D-184): the step into each hundredth level asks many times the steps either side of it (six
  // to fifteen: thresholds, not ceilings); every other step asks more than the one before and the gaps widen (exponential:
  // orders 87, 89); a man fighting foes at the wall's own level takes the wall's step in several times the defeats of the
  // step before it, and a knight fighting knights (265) crosses 200 the same way, and does cross it
  async lvWalls(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = { walls: [], bad: [] };
      for (const W of [100, 200, 300, 400, 500]) out.walls.push([W, LV.need(W - 1) / LV.need(W - 2), LV.need(W - 1) / LV.need(W), LV.need(W - 1) / LV.need(W + 1)]);
      const wall = L => (L + 1) % 100 === 0;
      for (let L = 1; L < 990; L++) {
        if (wall(L) || wall(L + 1) || wall(L - 1)) continue;
        if (!(LV.need(L + 1) > LV.need(L))) out.bad.push('not rising at ' + L);
        if (!wall(L + 2) && !(LV.need(L + 2) - LV.need(L + 1) > LV.need(L + 1) - LV.need(L))) out.bad.push('gap not widening at ' + L);
      }
      // a man at 95 and soldiers (the data's soldier): defeats from 95 to 99, and to cross the wall to 100; and a man at 195
      // against the same soldiers and knights (265): the wall at 200 holds him
      const count = (L0, F, to) => { const p = { st: { str: 40 }, lv: { L: L0, f: 0, pts: 0 } }; let n = 0; const keep = A.S.pc; while (p.lv.L < to && n < 1e5) { LV.defeat(p, F, 'kill'); n++; } return n; };
      out.soldier = LV.D.foes.soldier;
      out.below = count(98, 100, 99); out.cross = count(99, 100, 100); out.after = count(100, 100, 101);
      out.knightBelow = count(198, 265, 199); out.knightCross = count(199, 265, 200);
      out.knight300 = count(299, 320, 300);
      return out;
    });
    const ok = r.walls.every(([W, a, b, c]) => a >= 5 && b >= 5 && c >= 5 && a <= 20) && !r.bad.length &&
      r.cross >= r.below * 4 && r.cross >= r.after * 4 && r.knightCross >= r.knightBelow * 4 && r.knight300 < 1e5;
    return { ok, detail: `the step into the wall over the step before, after, and the one after that: ${r.walls.map(([W, a, b, c]) => `${W}: ${a.toFixed(1)}, ${b.toFixed(1)}, ${c.toFixed(1)}`).join('; ')}; ${r.bad.length} faults ${r.bad.slice(0, 3).join(', ')}; ` +
      `against men of 100: 98 to 99 in ${r.below} defeats, 99 to 100 in ${r.cross}, 100 to 101 in ${r.after}; against knights (265): 198 to 199 in ${r.knightBelow}, 199 to 200 in ${r.knightCross}; against the best (320) 299 to 300 in ${r.knight300}` };
  },

  // the reward at the wall (orders 91, 92 and 95, D-184): every wall is a breakthrough (points for the body); a swordsman
  // reaching 100 is offered the blade's road first and takes it on the card; a man with no art of arms gets the card that
  // places his points; anyone else decides by his reasons (a class or none), the same on a replay, without moving the main
  // stream; the Sword Saint is shut while Cael Vardan lives
  async lvClass(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, CL = LV.CL, out = { tried: [] };
      const arms = ['sword', 'spear', 'shield', 'bow', 'melee', 'riding', 'unarmed', 'survival', 'tracking'];
      const setArms = (p, v) => { for (const c of arms) for (const k of CL.D.keys[c] || [c]) { if (p.sk) delete p.sk[k]; p.skills[k] = typeof v === 'function' ? v(c) : v; } };
      const toWall = p => { p.lv.L = 99; p.lv.f = 0.999; p.lv.ct = 0; delete p.lv.cr; delete p.lv.wp; A.S.queue = []; for (let i = 0; i < 400 && p.lv.L < 100; i++) LV.defeat(p, 130, 'kill'); };
      // the player: a swordsman
      T.enter({ seed: 9801, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      let pc = A.pc(); LV.seed(pc); setArms(pc, c => (c === 'sword' ? 62 : 20));
      toWall(pc);
      const q = A.S.queue.find(x => x.ev === 'lv_wall');
      out.card = q ? { o: [q.ctx.o1, q.ctx.o2, q.ctx.o3].filter(Boolean), view: A.eventView(q) } : null;
      if (q) { A.S.queue = [q]; A.eventChoose(0); }
      out.took = (pc.lv.cr || []).map(x => x.join(':'));
      out.techs = A.techsOf(pc).map(x => x.t.name);
      out.src = (A.SK2.held(pc) || []).map(h => h.id).filter(id => /^class:/.test(id));
      // the player with no art of arms: the boost card
      T.enter({ seed: 9802, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 });
      pc = A.pc(); LV.seed(pc); setArms(pc, 8);
      const gx0 = pc.lv.gx || 0;
      toWall(pc);
      const qb = A.S.queue.find(x => x.ev === 'lv_boost');
      const st0 = A.stat(pc, 'str') + A.stat(pc, 'sta');
      if (qb) { A.S.queue = [qb]; A.eventChoose(0); }
      out.boost = { card: !!qb, words: qb ? A.eventView(qb).text.split(/\s+/).length : 0, gx: (pc.lv.gx || 0) - gx0, cr: (pc.lv.cr || []).length, wp: pc.lv.wp || 0, put: JSON.stringify(pc.lv.put || {}), stUp: A.stat(pc, 'str') + A.stat(pc, 'sta') - st0 };
      // NPCs with the sword their best: their own reasons, twice over one seed
      const npcRun = seed => {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
        const rng0 = JSON.stringify(A.rngState);
        const ppl = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== A.S.pc && A.age(p) >= 18 && A.age(p) < 50).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 40);
        const res = {};
        for (const p of ppl) { LV.seed(p); setArms(p, c => (c === 'sword' ? 60 : 25)); toWall(p); res[p.id] = [(p.lv.cr || []).map(x => x[0] + x[2]).join('>'), p.lv.gx || 0]; }
        return { res, moved: JSON.stringify(A.rngState) !== rng0 };
      };
      const a = npcRun(9803), b = npcRun(9803);
      out.npc = { n: Object.keys(a.res).length, same: JSON.stringify(a.res) === JSON.stringify(b.res), moved: a.moved, cls: Object.values(a.res).filter(x => x[0]).length, blade: Object.values(a.res).filter(x => /^(swordsman|warrior)1$/.test(x[0])).length, boost: Object.values(a.res).filter(x => x[1] >= 6).length, other: Object.values(a.res).filter(x => x[0] && !/^(swordsman|warrior)1$/.test(x[0])).map(x => x[0]) };
      // the Sword Saint: shut to a Sword Master at the third wall until he bears the title, which is Cael's while he lives
      const p = Object.values(A.S.people).find(x => x.alive && x.st && x.id !== A.S.pc && A.age(x) > 25);
      LV.seed(p); setArms(p, c => (c === 'sword' ? 90 : 30)); p.lv.cr = [['swordsman', 1, 1], ['sword-master', 2, 1]];
      const saint = CL.BY.get('sword-saint');
      out.saint = { open: CL.open(p, saint), holder: A.TT ? A.TT.holder('sword-saint') : null, opts: CL.options(p).map(o => o.c.id) };
      p.tt = { h: { 'sword-saint': { y: A.S.year } } };
      out.saint.withTitle = CL.open(p, saint);
      return out;
    });
    const c = r.card, n = r.npc, b = r.boost;
    const ok = !!c && c.o[0] === 'swordsman' && c.o.length >= 2 && c.view.choices.length === c.o.length + 1 && c.view.choices.length <= 4 && c.view.text.split(/\s+/).length <= 80 &&
      r.took.length === 1 && /^swordsman:\d+:1$/.test(r.took[0]) && r.techs.includes('Rising Cut') && r.src.includes('class:swordsman') &&
      b.card && b.gx === 6 && b.cr === 0 && !b.wp && b.put !== '{}' && b.words <= 80 &&
      n.n >= 30 && n.same && !n.moved && n.cls >= n.n / 2 && n.blade === n.cls && n.boost === n.n &&
      !r.saint.open && r.saint.holder === 'sword-saint' && !r.saint.opts.includes('sword-saint') && r.saint.withTitle;
    return { ok, detail: `the swordsman's card offers ${c ? c.o.join(', ') : 'nothing'} (${c ? c.view.choices.map(x => x.t).join(' | ') : ''}); took ${r.techs && r.took.join(', ')}, techniques ${r.techs.join(', ')}, the adapter's ${r.src.join(', ')}; ` +
      `no art of arms: the boost card ${b.card} (${b.words} words), ${b.gx} points, placed ${b.put}, strength and endurance up ${b.stUp.toFixed(1)}; ${n.n} NPCs with the sword at 100: the same on a replay ${n.same}, main stream moved ${n.moved}, ${n.cls} took a class (${n.blade} the blade's or a warrior's), ${n.boost} with the breakthrough's points${n.other.length ? ', other ' + n.other.join(' ') : ''}; ` +
      `the Sword Saint open ${r.saint.open} (holder ${r.saint.holder}; the Sword Master's options ${r.saint.opts.join(', ')}), with the title ${r.saint.withTitle}` };
  },

  // what a class adds to play (order 92): a technique in the duel's bar, a passive that fires once under its condition, an
  // activity held to the class (hidden from others), a buff that raises a stat for its months and then ends, the class
  // beside the level on the profile with a note opened by a press; and the class data: a tree, every class adding a part
  // its parents lack, effects in the adapter's vocabulary, small stats, simple names with no retired word
  async lvClassParts(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      const LV = A.LV, CL = LV.CL, out = {};
      // the data
      const V = A.SK2 && A.SK2.DATA && A.SK2.DATA.vocab ? A.SK2.DATA.vocab : (A.DATA['skills/vocab'] || {});
      const types = Object.keys(V.effects || {}), bad = [];
      for (const c of CL.LIST) {
        if (!/^[A-Z][A-Za-z' -]{2,26}$/.test(c.name) || /marshal|levy/i.test(JSON.stringify(c))) bad.push('name ' + c.id);
        for (const e of c.effects || []) { if (!types.includes(e.type)) bad.push(c.id + ' effect ' + e.type); if (e.type === 'stat' && e.v > 3) bad.push(c.id + ' stat ' + e.v); }
        if (!(CL.D.rarities || []).includes(c.rarity)) bad.push(c.id + ' rarity ' + c.rarity);
        // order 95: a class's rarity never changes along its line (an advancement keeps it)
        for (const f of c.from) if (f && CL.BY.get(f) && CL.BY.get(f).line === c.line && CL.BY.get(f).rarity !== c.rarity) bad.push(c.id + ' changes rarity on its line');
        for (const f of c.from) if (f !== null && !CL.BY.has(f)) bad.push(c.id + ' from ' + f);
        if (c.step > 1 && !c.from.every(f => f && CL.BY.get(f).step === c.step - 1)) bad.push(c.id + ' step');
        const parts = x => [x.tech && x.tech.id, x.passive && x.passive.name, x.act && x.act.key, x.buff && x.buff.key].filter(Boolean);
        for (const f of c.from) if (f) { const mine = parts(c), theirs = parts(CL.BY.get(f)); if (!mine.some(k => !theirs.includes(k))) bad.push(c.id + ' adds nothing to ' + f); }
        if (!parts(c).length) bad.push(c.id + ' no part');
      }
      const leads = {}; for (const c of CL.LIST) for (const f of c.from) if (f) leads[f] = (leads[f] || 0) + 1;
      const names = new Set(CL.LIST.map(c => c.name)), uniq = CL.LIST.filter(c => c.rarity === 'unique');
      if (names.size !== CL.LIST.length) bad.push('names repeat');
      if (uniq.some(c => !c.unique && !c.title)) bad.push('a unique class with no single holder');
      const rar = {}; for (const c of CL.LIST) rar[c.rarity] = (rar[c.rarity] || 0) + 1;
      out.data = { n: CL.LIST.length, bad, branching: Object.values(leads).filter(n => n >= 2).length, steps: [1, 2, 3].map(s => CL.LIST.filter(c => c.step === s).length), rar, hidden: CL.LIST.filter(c => c.req).length };
      // a duel: the player a Berserker (Warrior before him): his techniques in the bar, the passive fires once when he bleeds
      T.enter({ seed: 9811, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      const pc = A.pc(); LV.seed(pc); pc.lv.cr = [['warrior', A.S.year, 1], ['berserker', A.S.year, 1]];
      const foe = Object.values(A.S.people).find(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 20 && A.age(p) < 40);
      A.S.queue = []; A.startDuel(pc, foe, { kind: 'duel', lethal: false });
      const dq = A.S.queue.find(x => x.type === 'duel');
      const f = dq.d.a;
      out.duel = { techs: (f.techs || []).map(x => x.id), lvp: (f.lvp || []).map(x => x.name) };
      f.hp = 10; const e1 = LV.passiveEdge(dq.d, f, dq.d.b, 'strike', 'strike'), fury = f.st.fury, logs1 = dq.d.log.filter(l => /Blood Rage/.test(l)).length;
      const e2 = LV.passiveEdge(dq.d, f, dq.d.b, 'strike', 'strike'), logs2 = dq.d.log.filter(l => /Blood Rage/.test(l)).length;
      f.hp = f.maxHp; const e3 = LV.passiveEdge(dq.d, f, dq.d.b, 'strike', 'strike');
      out.passive = { e1, e2, e3, fury, logs1, logs2 };
      A.S.queue = [];
      // the activities: the berserker's buff is his, the others' hidden; the buff raises strength for two months, then ends
      out.acts = { mine: A.canAct('lvc_war_cry'), theirs: A.canAct('lvc_teach_sword') };
      A.S.time = Math.max(A.S.time || 0, 5);
      const s0 = A.stat(pc, 'str'); const res = A.doActivity('lvc_war_cry'); const s1 = A.stat(pc, 'str');
      for (const fn of A.onMonth) if (fn.toString().includes('CL.month')) fn(pc);
      const s2 = A.stat(pc, 'str');
      for (const fn of A.onMonth) if (fn.toString().includes('CL.month')) fn(pc);
      const s3 = A.stat(pc, 'str');
      out.buff = { ok: res && res.ok, s0, s1, s2, s3, left: pc.lv.bf || null };
      // an earning activity, for a Guardian
      pc.lv.cr.push(['guardian', A.S.year, 1]); A.S.time = Math.max(A.S.time || 0, 5);
      const c0 = pc.coin, h0 = pc.health; const er = A.doActivity('lvc_guard_road');
      out.earn = { ok: er && er.ok, coin: pc.coin - c0, health: pc.health - h0, msg: er && er.msg };
      // the profile
      UI.tab = 'profile'; UI.ov = null; UI.render();
      const cls = document.querySelector('.lv-line .lv-cls .tt'), line = document.querySelector('.lv-line');
      out.prof = { cls: cls ? cls.textContent : null, note: cls ? cls.getAttribute('data-v') || '' : '', title: line ? line.querySelectorAll('[title]').length : -1, width: line ? line.getBoundingClientRect().right : 0, vw: innerWidth };
      return out;
    });
    await pg.click('.lv-line .lv-cls .tt'); const open = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0)); await pg.keyboard.press('Escape');
    await pg.setViewportSize({ width: 1366, height: 768 });
    const d = r.data, p = r.passive, bf = r.buff;
    const ok = !d.bad.length && d.n >= 100 && d.branching >= 15 && d.steps.every(n => n >= 5) && d.hidden >= 50 && ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'].every(k => d.rar[k] > 0) &&
      r.duel.techs.includes('cl-heavy-blow') && r.duel.lvp.includes('Blood Rage') && p.e1 > 0 && p.fury > 0 && p.logs1 === 1 && p.logs2 === 1 && p.e2 === p.e1 && p.e3 === 0 &&
      r.acts.mine[0] && !r.acts.theirs[0] && /position/.test(r.acts.theirs[1]) && bf.ok && bf.s1 > bf.s0 && bf.s2 > bf.s0 && Math.abs(bf.s3 - bf.s0) < 1e-9 && !bf.left &&
      r.earn.ok && (r.earn.coin > 0 || r.earn.health < 0) && r.prof.cls === 'Guardian' && r.prof.note.length > 40 && !/\d\s?%/.test(r.prof.note) && r.prof.title === 0 && r.prof.width <= r.prof.vw + 0.5 && open > 0;
    return { ok, detail: `data: ${d.n} classes (${d.steps.join('/')} by step; ${Object.entries(d.rar).map(([k, n]) => k + ' ' + n).join(', ')}; ${d.hidden} hidden branches), ${d.branching} leading to two or more, faults ${d.bad.length} ${d.bad.slice(0, 4).join('; ')}; duel: techniques ${r.duel.techs.join(', ')}, passives ${r.duel.lvp.join(', ')}; ` +
      `low on blood +${p.e1} (fury ${p.fury}, said ${p.logs1} then ${p.logs2} times), again +${p.e2}, whole +${p.e3}; activities: his ${r.acts.mine.join('|')}, another's ${r.acts.theirs.join('|')}; buff: strength ${bf.s0.toFixed(1)} -> ${bf.s1.toFixed(1)} -> ${bf.s2.toFixed(1)} -> ${bf.s3.toFixed(1)}; ` +
      `earning: ${r.earn.msg}; profile at 375: "${r.prof.cls}", a note of ${r.prof.note.length} characters, opened by a press ${open}, right edge ${Math.round(r.prof.width)} of ${r.prof.vw}` };
  },

  // the legends grow too (orders 92 and 95): a great being's level is its data's plus what it has gained; a hundred
  // defeats of its equal give an archdemon one or two levels, a thousand of soldiers nothing to speak of; a fresh world
  // reads every legend at the data's level; and the yearly refinement of their arts raises them all alike, so a matchup
  // reads as before
  async lvLegends(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, PW = A.POWER;
      T.enter({ seed: 9821, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const ids = [...PW.LEG.keys()].sort(), fresh = ids.every(id => LV.legendGain(id) === 0);
      const id = ids[0], L0 = PW.being(id).level;
      let n = 0; for (let i = 0; i < 100; i++) n += LV.legendDefeat(id, L0, 'kill');
      const g1 = A.S.pw.leg[id].lg.slice(), L1 = PW.being(id).level;
      for (let i = 0; i < 1000; i++) LV.legendDefeat(id, LV.D.foes.soldier, 'kill');
      const g2 = A.S.pw.leg[id].lg.slice();
      // the yearly refinement (order 95): ten years for all alike; Sarnavoth against an archdemon reads as before
      T.enter({ seed: 9822, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const arch = ids.find(x => /ghazrul|morvane/.test(x)) || ids[1];
      const p0 = PW.compare('sarnavoth', arch).p, w0 = PW.being('sarnavoth').power;
      for (let y = 0; y < 10; y++) LV.legendYear();
      const p1 = PW.compare('sarnavoth', arch).p, w1 = PW.being('sarnavoth').power, rf = ids.map(x => LV.legendRefine(x));
      return { id, fresh, L0, L1, n, g1, g2, p0, p1, w0, w1, rf: [Math.min(...rf), Math.max(...rf)] };
    });
    const ok = r.fresh && r.n >= 1 && r.n <= 2 && r.L1 === r.L0 + r.n && r.g2[0] === r.g1[0] && r.g2[1] - r.g1[1] < 0.001 && r.w1 > r.w0 && Math.abs(r.p1 - r.p0) < 0.02 && r.rf[0] === r.rf[1] && r.rf[0] > 1;
    return { ok, detail: `a fresh world: every legend at its data's level ${r.fresh}; ${r.id} at ${r.L0}: a hundred defeats of its equal give ${r.n} levels and ${r.g1[1]} of the next; a thousand soldiers then add ${(r.g2[1] - r.g1[1]).toFixed(6)} of a level; ten years of refinement: Sarnavoth's power ${Math.round(r.w0)} -> ${Math.round(r.w1)}, every legend x${r.rf[0].toFixed(3)}, against an archdemon ${r.p0.toFixed(3)} -> ${r.p1.toFixed(3)}` };
  },
  // the owner's anchors as the typical outcome of ordinary lives (orders 91-94, D-184; long tier): pooled bot lives, half
  // born peasants and half nobles, played 35 years. A life that never fought (three kills or fewer, at most one duel won)
  // ends among average people (20-50); one that killed thirty or more ends among soldiers (80-180); nobody stands piled at
  // a wall (99, 199, 299: thresholds, not ceilings); everyone past a hundred has his walls settled (a class, the boost or a
  // card waiting when crossed by experience; worn when he was seeded past it, which may leave none if no class fits).
  // Readings (2026-11-26, the walls 6/10/12/12/15, on the rescaled curve of D-185): see the HISTORY entry H-148.
  async lvAnchors(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    await pg.evaluate(BOT);
    const lives = [];
    for (const st of ['peasant', 'noble']) for (let i = 0; i < 6; i++) {
      lives.push(await pg.evaluate(([st, i]) => {
        const pers = ['careful', 'reckless', 'greedy', 'random'][i % 4];
        B.life({ seed: 8101 + i * 7919 + st.length, race: 'human', realm: 'POL-01', status: st, sex: 'M', startAge: 16 }, pers, i % 2 === 0, 35);
        const pc = A.P(A.S.pc), lv = pc.lv || {};
        return { st, i, L: lv.L || A.LV.level(pc), kills: pc.kills || 0, duels: pc.dl && pc.dl.duel_won ? pc.dl.duel_won[0] : 0, ct: lv.ct, cr: (lv.cr || []).map(x => x[0] + (x[2] ? '' : '~')).join('>'), gx: lv.gx || 0, wp: lv.wp || 0 };
      }, [st, i]));
    }
    const quiet = lives.filter(l => l.kills <= 3 && l.duels <= 1 && l.st === 'peasant'), fought = lives.filter(l => l.kills >= 30);
    const med = a => { const s = a.map(l => l.L).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : null; };
    const piled = lives.filter(l => [99, 199, 299].includes(l.L));
    const unsettled = lives.filter(l => l.L >= 100 && l.ct !== Math.floor(l.L / 100));
    const ok = quiet.length >= 2 && quiet.every(l => l.L >= 20 && l.L <= 50) && (!fought.length || (med(fought) >= 80 && med(fought) <= 180 && fought.every(l => l.L <= 199))) &&
      piled.length <= Math.max(1, lives.length / 6) && !unsettled.length;
    return { ok, detail: `${lives.length} lives: ${lives.map(l => `${l.st} ${l.i}: level ${l.L}, ${l.kills} kills, ${l.duels} duels${l.cr ? ', ' + l.cr : ''}${l.gx ? ', +' + l.gx + ' points' : ''}`).join('; ')} | quiet ${quiet.length} (median ${med(quiet)}), fought ${fought.length} (median ${med(fought)}), at a wall ${piled.length}, unsettled ${unsettled.length}` };
  },
  // the seed respects the owner's anchors (orders 93, 95, 96; D-184 addenda): an untried commoner of sixteen stands with
  // the average people (20-50), an untrained noble 50-99 by upbringing, royals on average no lower, wherever his fighting
  // worth would read (readings, 2026-11-26: commoners 21-48, nobles 58-81, royals 68-96, their computed levels 10-131); a
  // veteran is seeded in his rank's band (the band's low end a floor: his life); kills outside service count from the floor; a stored level stays; a named
  // figure's level from data wins
  async lvSeed(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = { youths: [], comp: [] };
      out.by = {};
      for (const st of ['peasant', 'noble', 'royal', 'merchant']) for (let i = 0; i < 4; i++) {
        A.newGame({ seed: 9831 + i * 7919 + st.length, race: 'human', realm: 'POL-01', status: st, sex: i % 2 ? 'F' : 'M', startAge: 16 });
        const pc = A.pc(); LV.seed(pc); out.youths.push(pc.lv.L); out.comp.push(LV.computed(pc)); (out.by[st] = out.by[st] || []).push(pc.lv.L);
      }
      // a named figure's level from data (the figures registry's hook)
      LV.fromData = q => (q.id === A.S.pc ? 444 : null); const pcF = A.pc(); delete pcF.lv; out.fig = LV.level(pcF); LV.fromData = null;
      A.newGame({ seed: 9861, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(), fl = LV.floor(pc), c30 = LV.computed(pc);
      pc.veteran = { rank: 2, years: 8, battles: 10 }; const vet = LV.seedLevel(pc);
      pc.veteran = { rank: 6, years: 25, battles: 60 }; const gen = LV.seedLevel(pc);
      pc.veteran = null; pc.kills = 12; const brawl = LV.seedLevel(pc);
      pc.kills = 0; pc.lv = { L: 333, f: 0.5, pts: 0 }; LV.seed(pc); const kept = pc.lv.L;
      return Object.assign(out, { fl, c30, vet, gen, brawl, kept });
    });
    const mean = a => a.reduce((x, y) => x + y, 0) / a.length, B = r.by;
    const ok = r.youths.length === 16 && B.peasant.concat(B.merchant).every(L => L >= 20 && L <= 50) && B.noble.concat(B.royal).every(L => L >= 50 && L <= 99) && mean(B.royal) >= mean(B.noble) - 3 && r.comp.some(c => c >= 80) && r.fig === 444 &&
      r.vet <= 180 && r.vet >= 80 && r.gen >= Math.max(r.vet, 230) && r.gen <= 420 && r.gen >= r.vet && r.brawl > r.fl && r.brawl <= 50 && r.kept === 333;
    return { ok, detail: `untried youths of sixteen: ${Object.entries(r.by).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ')} (computed ${Math.min(...r.comp)}-${Math.max(...r.comp)}); a figure from data ${r.fig}; at thirty (floor ${r.fl}, computed ${r.c30}): a veteran sergeant ${r.vet}, a general of 25 years ${r.gen}, a man with 12 kills and no service ${r.brawl}; a stored level kept ${r.kept}` };
  },
  // the breakthrough at every hundredth level (order 95): the body's points come with it (six at the first wall), it is
  // recorded, a skill jumps one rank only where its conditions allow (talent at the next rank's letter, the route's deeds,
  // at most one concept missing): with every talent at F nothing jumps; and a replay of the same world gives the same
  async lvBreak(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const LV = A.LV, out = {};
      const run = (seed, tal) => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
        const pc = A.pc(); LV.seed(pc);
        if (tal) { pc.tal = {}; for (const k of A.SK.IDS) pc.tal[k] = tal; }
        const before = {}; for (const k of A.SK.IDS) { const rr = A.SK2.rungFor(pc, k); before[k] = rr ? rr.rank : null; }
        pc.lv.L = 99; pc.lv.f = 0.999; pc.lv.ct = 0; delete pc.lv.cr; A.S.queue = [];
        const pts0 = pc.lv.pts, gx0 = pc.lv.gx || 0;
        for (let i = 0; i < 400 && pc.lv.L < 100; i++) LV.defeat(pc, 130, 'kill');
        const bt = pc.lv.bt && pc.lv.bt[pc.lv.bt.length - 1];
        const jumped = []; for (const k of A.SK.IDS) { const rr = A.SK2.rungFor(pc, k); if (rr && before[k] && rr.rank !== before[k]) jumped.push(k + ' ' + before[k] + '>' + rr.rank + ' talent ' + A.SK.talentOf(pc, k)); }
        return { L: pc.lv.L, gx: (pc.lv.gx || 0) - gx0, bt, jumped, card: A.S.queue.some(q => q.ev === 'lv_wall' || q.ev === 'lv_boost') };
      };
      out.free = [9871, 9872, 9873].map(s => run(s, null));
      out.again = run(9871, null);
      out.dull = [9871, 9872].map(s => run(s, 'F'));
      return out;
    });
    const TO = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SSS'];
    const okJump = r.free.every(x => x.jumped.length <= 1 && x.jumped.every(j => { const m = j.match(/(\w)>(\w) talent (\w+)$/); return m && TO.indexOf(m[3]) >= TO.indexOf(m[2]); }));
    const ok = r.free.every(x => x.L >= 100 && x.gx === 6 && x.bt && x.bt[2] === 6 && x.card) && okJump && JSON.stringify(r.again) === JSON.stringify(r.free[0]) && r.dull.every(x => !x.jumped.length && x.gx === 6);
    return { ok, detail: `${r.free.map((x, i) => `world ${9871 + i}: level ${x.L}, ${x.gx} points, jumped ${x.jumped.join(', ') || 'none'}, a card ${x.card}`).join('; ')}; the same on a replay ${JSON.stringify(r.again) === JSON.stringify(r.free[0])}; every talent F: jumped ${r.dull.map(x => x.jumped.length).join(', ')}` };
  },

  // training comes as single +1s (order 95): the player's stat rises only by whole points, the fractions kept toward the
  // next and never past the bound, the total what the fractions add to; anyone else still grows by the fraction
  async trainOnes(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9881, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const pc = A.pc(), s0 = pc.st.str, steps = []; let sum = 0, last = s0;
      for (let i = 0; i < 40; i++) { sum += A.train(pc, 'str', 0.6); const d = pc.st.str - last; if (d) steps.push(Math.round(d * 1000) / 1000); last = pc.st.str; }
      const npc = Object.values(A.S.people).find(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 18 && A.age(p) < 30 && p.st.str < p.pot.str - 5);
      const n0 = npc.st.str; A.train(npc, 'str', 0.6); const nd = npc.st.str - n0;
      return { s0, s1: pc.st.str, steps, sum, left: (pc.trn || {}).str || 0, cap: pc.pot.str * 1.02, nd };
    });
    const ok = r.steps.length > 0 && r.steps.every(d => d === 1) && Math.abs(r.s1 - r.s0 + r.left - r.sum) < 0.01 + (r.s1 + 1 > r.cap ? 1 : 0) && r.s1 <= r.cap + 1e-9 && r.nd > 0 && r.nd < 1;
    return { ok, detail: `strength ${r.s0} -> ${r.s1} in steps of ${[...new Set(r.steps)].join(', ')} (${r.steps.length} of them) from ${r.sum.toFixed(2)} of training, ${r.left} kept toward the next; an NPC's session +${r.nd.toFixed(3)}` };
  },
};
