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

export const limits = { sk5Lives: 3600, sk2Migrate: 2400, sk2Caps: 900, sk6PerkSums: 1800, sk2Evolve: 2400, sk2Merge: 900, sk2Jump: 900, sk2Active: 900, sk2KindCaps: 900, sk2DuelReplay: 600, sk2ArtsMonth: 1200, sk2ArtsView: 600 };
// step 11 (D-186): the player holds these arts at these levels, every fightable one readied (settled: readied last month)
const ARTS = `((pc, list) => { pc.ka = {}; pc.kr = []; for (const [id, lv] of list) pc.ka[id] = { lv, xp: 0, y: A.S.year, via: 'planted' };
  for (const [id] of list) { const s = A.SK2.art(id); if (s && s.kind !== 'passive' && A.SK2.inFight(s)) pc.kr.push({ id, m: -1 }); } })`;
// a grown noble with a sword and a shield, the queue empty
const ARMED = `((seed, age) => { T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: age || 30 }); A.S.queue = [];
  const pc = A.pc(); pc.gear = pc.gear || {}; pc.gear.weapon = 'sword'; pc.gear.shield = 'shield'; pc.gear.ranged = null; return pc; })`;
// two foes of the world with a sword at C or better (the closed form gives them arts), by id
const FOES = `(pc => Object.values(A.S.people).filter(p => p && p.alive && p.id !== pc.id && p.st && A.isAdult(p) && A.skill(p, 'sword') >= 38).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 2))`;
// a grown player whose body carries rank B (C9 holds a skill to what its stats carry), and a family planted at an S1 step
// with its bar full (15: C · Lv 10)
const GROW = `(pc => { for (const st of GD.STATS) { pc.pot[st] = Math.max(pc.pot[st], 90); pc.st[st] = Math.max(pc.st[st], 85); } })`;
const PLANT = `((pc, c, step) => { A.SK.set(pc, c, step, 'planted'); pc.sk[c].xp = A.SK.E().cost(step) - 0.01; A.SK.mirror(pc, c); A.SK2.syncFam(pc, c); })`;
export default {
  // step 11 (D-186): a readied active is used at most once per its cooldown in a duel, on its own move; a buff raises or
  // guards for its rounds and then wears off, and a heal gives blood back; the foe uses his own arts (the closed form) by
  // the same rules. Pooled over the first worlds of a run that have two swordsmen at C or better (seed fallback, H-082).
  async sk2Active(pg) {
    const r = await pg.evaluate(({ ARTS, ARMED, FOES }) => {
      const SK2 = A.SK2; if (!SK2 || !SK2.duelStart || !SK2.duelPick) return { none: true };
      const arts = eval(ARTS), armed = eval(ARMED), foes = eval(FOES);
      const out = { duels: 0, uses: 0, npcUses: 0, raise: 0, wore: 0, guard: 0, guardOff: 0, heal: 0, bad: [], seeds: [], ends: 0 };
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      const LIST = [['quick_cut', 10], ['twin_cut', 6], ['shield_bash', 8], ['shell_of_oak', 6], ['second_wind', 10], ['war_cry', 10]];
      const slots0 = SK2.slotsOf; SK2.slotsOf = p => (p && p.id === A.S.pc ? 9 : slots0(p));
      const check = (f, who) => {
        const by = {};
        for (const x of f.k2.uses) (by[x.id] = by[x.id] || []).push(x.r);
        for (const id in by) {
          const u = f.k2.arts.find(a => a.id === id), rs = by[id];
          if (!u) { bad(`${who} used ${id}, not readied`); continue; }
          if (u.cd && u.cd.per === 'round') { for (let i = 1; i < rs.length; i++) if (rs[i] - rs[i - 1] < u.cd.v) bad(`${who} ${id} in rounds ${rs.join(',')}, cooldown ${u.cd.v}`); }
          else if (rs.length > 1) bad(`${who} ${id} ${rs.length} times in one fight`);
        }
      };
      try {
        for (const seed of T.seedRun(9861, 8)) {
          if (out.duels >= 8) break;
          const pc = armed(seed, 30), fs = foes(pc); if (fs.length < 2) continue;
          out.seeds.push(seed);
          for (const foe of fs) {
            arts(pc, LIST);
            A.S.queue = [];
            const D = A.startDuel(pc, foe, { kind: 'duel', lethal: false, light: 'day' });
            if (!D || !D.a || !D.a.k2) { bad('seed ' + seed + ': no arts in the fight'); continue; }
            out.duels++;
            const base = D.a.str, hist = [];
            for (let g = 0; !D.over && g < 40; g++) {
              const ready = id => { const u = D.a.k2.arts.find(x => x.id === id); return u && SK2.duelReady(D, D.a, u) ? u : null; };
              const hp = D.a.hp / D.a.maxHp, r1 = D.round + 1;
              const u = (r1 <= 2 && (ready('war_cry') || ready('shell_of_oak'))) || (hp < 0.6 && ready('second_wind')) || ready('twin_cut') || ready('quick_cut') || ready('shield_bash');
              const hp0 = D.a.hp;
              A.duelAct(u ? 'k:' + u.id : 'strike');
              hist.push({ r: r1, id: u ? u.id : null, str: D.a.str, guard: D.a.k2.guard, hp0, hp: D.a.hp, over: D.over });
            }
            check(D.a, 'player'); if (D.b.k2) { check(D.b, 'foe'); out.npcUses += D.b.k2.uses.length; }
            out.uses += D.a.k2.uses.length;
            // the cry: its strength for three exchanges, then gone; the shell: its guard for three, then none
            for (const id of ['war_cry', 'shell_of_oak']) {
              const at = D.a.k2.uses.find(x => x.id === id); if (!at) continue;
              const rows = hist.filter(h => h.r >= at.r && h.r <= at.r + 3);
              for (const h of rows) {
                // (seen after the exchange: the cry's strength is the next exchange's, the guard the one just fought)
                const on = h.r < at.r + (id === 'war_cry' ? 2 : 3);
                if (id === 'war_cry') { if (on && !(h.str > base)) bad(`round ${h.r}: the cry's strength is gone early`); if (!on && !h.over && h.str !== base) bad(`round ${h.r}: the cry's strength stays (${h.str} for ${base})`); if (on) out.raise++; else if (h.str === base) out.wore++; }
                else { if (on && !(h.guard > 0)) bad(`round ${h.r}: the shell's guard is gone early`); if (on) out.guard++; else if (h.guard === 0) out.guardOff++; }
              }
            }
            const sw = D.a.k2.uses.find(x => x.id === 'second_wind');
            if (sw) { const h = hist.find(x => x.r === sw.r); if (h && h.hp0 < D.a.maxHp * 0.6) out.heal++; }
            if (D.a.k2.healed > D.a.maxHp * 0.35 + 1e-9) bad('healed ' + D.a.k2.healed + ' of ' + D.a.maxHp);
            // nothing a buff did in the fight touched the person
            // at the end the fighter's strength is his own plus only what is still in force
            if (D.a.str !== base + (D.a.k2.raised.str || 0)) bad(`strength ${D.a.str} at the end for ${base} and ${D.a.k2.raised.str || 0} in force`); else out.ends++;
            if (!A.S.queue.length || A.S.queue[0].type !== 'duel') {} else A.duelClose();
          }
        }
      } finally { SK2.slotsOf = slots0; }
      return out;
    }, { ARTS, ARMED, FOES });
    if (r.none) return { ok: false, detail: 'no arts in the build (A.SK2.duelStart)' };
    const ok = !r.bad.length && r.duels >= 6 && r.uses >= 15 && r.npcUses >= 1 && r.raise >= 3 && r.wore >= 1 && r.guard >= 3 && r.guardOff >= 1 && r.ends === r.duels;
    return { ok, detail: `${r.duels} duels in worlds ${r.seeds.join(', ')}: the player used his arts ${r.uses} times, the foes theirs ${r.npcUses}; none oftener than its cooldown; the cry raised strength in ${r.raise} exchanges and wore off in ${r.wore}, the shell guarded ${r.guard} and was gone in ${r.guardOff}; a heal under half the blood ${r.heal}; the fighter's strength his own plus what is in force at every end (${r.ends})${r.bad.length ? '; ' + r.bad.join('; ') : ''}` };
  },

  // step 11 (D-186): the caps hold with every art readied. The player holds every person's art at Lv 10, every one readied
  // (the places lifted for the test); he fights swordsmen of the world and two monsters with mana (a spirit and a dragon,
  // whose SS hide rises the guard's cap). In every exchange each side's fight points from the arts stay inside the fight's
  // share less what the rungs already give, the guard inside its share, what one fight heals inside its share of the blood,
  // a raised stat at most +10, a stun at most two exchanges, and every blow at most the blow's share of the worth.
  async sk2KindCaps(pg) {
    const r = await pg.evaluate(({ ARTS, ARMED, FOES }) => {
      const SK2 = A.SK2; if (!SK2 || !SK2.duelStart) return { none: true };
      const E = SK2.E(), I = SK2.IX(), arts = eval(ARTS), armed = eval(ARMED), foes = eval(FOES);
      const out = { duels: 0, rounds: 0, seeds: [], bad: [], nBad: 0, maxFight: 0, maxGuard: 0, maxHeal: 0, blows: 0, mana: 0 };
      const bad = s => { out.nBad++; if (out.bad.length < 10) out.bad.push(s); };
      const ALL = SK2.arts().filter(s => s.trains).map(s => [s.id, 10]);
      const slots0 = SK2.slotsOf; SK2.slotsOf = p => (p && p.id === A.S.pc ? 99 : slots0(p));
      const look = (D, f, tag) => {
        const k = f.k2; if (!k) return;
        const room = k.worth * E.capOf(I, 'fightShare', k.top) - (f.sk2 ? Math.max(0, f.sk2.total || 0) : 0);
        if (k.fight > Math.max(0, room) + 1e-6) bad(`${tag}: fight ${k.fight} over ${room}`);
        if (k.guard > E.capOf(I, 'guardShare', k.top) + 1e-9) bad(`${tag}: guard ${k.guard}`);
        if (k.healed > f.maxHp * E.capOf(I, 'healShare', k.top) + 1e-6) bad(`${tag}: healed ${k.healed} of ${f.maxHp}`);
        for (const s in k.raised) if (k.raised[s] > E.capOf(I, 'raise', k.top) + 1e-9) bad(`${tag}: ${s} raised ${k.raised[s]}`);
        if (f.st && (f.st.stun > 2 || f.st.knock > 2)) bad(`${tag}: held ${f.st.stun}/${f.st.knock}`);
        out.maxFight = Math.max(out.maxFight, k.worth > 0 ? k.fight / k.worth : 0); out.maxGuard = Math.max(out.maxGuard, k.guard); out.maxHeal = Math.max(out.maxHeal, k.healed / f.maxHp);
      };
      const fight = (pc, foe, opts) => {
        A.S.queue = [];
        const D = A.startDuel(pc, foe, opts);
        if (!D || !D.a || !D.a.k2) { bad('no arts'); return; }
        out.duels++;
        const worth = { a: D.a.k2.worth, b: D.b.k2 ? D.b.k2.worth : 0 }, top = { a: D.a.k2.top, b: D.b.k2 ? D.b.k2.top : 'D' };
        for (let g = 0; !D.over && g < 40; g++) {
          const n0 = D.log.length;
          A.duelAuto ? (() => { let act = A.aiAction(D.a, D.b, D); const k = SK2.duelPlanFor(D, D.a, D.b, act, true); A.duelAct(k ? 'k:' + k : act); })() : A.duelAct('strike');
          out.rounds++;
          look(D, D.a, 'player r' + D.round); look(D, D.b, 'foe r' + D.round);
          // every blow of an art: "<name> lands on <whom>: N more."
          for (const l of D.log.slice(n0)) { const m = / lands on (you|.+): (\d+) more\.$/.exec(l); if (!m) continue; out.blows++; const w = m[1] === 'you' ? worth.b : worth.a, t = m[1] === 'you' ? top.b : top.a;
            if (+m[2] > Math.ceil(w * E.capOf(I, 'strikeShare', t)) + 1) bad(`a blow of ${m[2]} for a worth of ${Math.round(w)} (${l})`); }
        }
        if (D.b.k2 && D.b.k2.mana0 > 0) out.mana++;
        if (A.S.queue.length && A.S.queue[0].type === 'duel') A.duelClose();
      };
      try {
        for (const seed of T.seedRun(9871, 6)) {
          if (out.duels >= 16) break;
          const pc = armed(seed, 32), fs = foes(pc); if (!fs.length) continue;
          out.seeds.push(seed);
          for (const foe of fs) { arts(pc, ALL); fight(pc, foe, { kind: 'duel', lethal: false, light: 'dusk' }); }
          // two monsters with mana: a spirit and the oldest dragon the bestiary has
          const SP = [...A.POWER.SP.values()];
          const spirit = SP.filter(s => s.fam === 'spirits' && s.prof.magic >= 7).sort((a, b) => a.level - b.level)[0];
          const dragon = SP.filter(s => s.fam === 'dragons' && s.prof.magic >= 8).sort((a, b) => b.level - a.level)[0], first = out.seeds.length === 1;
          // (the dragon once, weakened, so the fight lasts more than an exchange)
          for (const [s, mod] of [[spirit, 1], [first ? dragon : null, 0.2]]) if (s && pc.alive) { arts(pc, ALL); fight(pc, { beastId: s.id, mod }, { kind: 'beast', forceSolo: true, grounded: true, lethal: false }); }
        }
      } finally { SK2.slotsOf = slots0; }
      return out;
    }, { ARTS, ARMED, FOES });
    if (r.none) return { ok: false, detail: 'no arts in the build' };
    const ok = r.nBad === 0 && r.duels >= 10 && r.rounds >= 30 && r.blows >= 5 && r.mana >= 2;
    return { ok, detail: `${r.duels} fights (worlds ${r.seeds.join(', ')}; ${r.mana} against a monster with mana), ${r.rounds} exchanges with every art at Lv 10 readied: fight points from the arts at most ${Math.round(r.maxFight * 1000) / 10} in 100 of the worth, a guard at most ${Math.round(r.maxGuard * 100) / 100}, a fight's heals at most ${Math.round(r.maxHeal * 100) / 100} of the blood, ${r.blows} blows of an art each inside its share; ${r.nBad} over a cap${r.nBad ? ': ' + r.bad.join('; ') : ''}` };
  },

  // step 11 (D-186): the duel is deterministic on replay, and drawing it changes nothing. The same world, the same arts
  // and the same foe give the same fight three times: once alone, once drawn on the duel screen at every exchange, once
  // more alone; the log, the result, the random stream after it and the state are the same.
  async sk2DuelReplay(pg) {
    const r = await pg.evaluate(({ ARTS, ARMED, FOES }) => {
      const SK2 = A.SK2; if (!SK2 || !SK2.duelStart) return { none: true };
      const arts = eval(ARTS), armed = eval(ARMED), foes = eval(FOES);
      const LIST = [['quick_cut', 10], ['twin_cut', 8], ['shield_bash', 8], ['shell_of_oak', 6], ['second_wind', 10], ['war_cry', 10], ['last_stand', 6], ['binding_parry', 8]];
      const run = (seed, draw) => {
        const pc = armed(seed, 30), foe = foes(pc)[0]; if (!foe) return null;
        arts(pc, LIST); pc.kr = pc.kr.slice(0, 3);
        A.S.queue = [];
        const D = A.startDuel(pc, foe, { kind: 'duel', lethal: false, light: 'dawn' });
        if (!D || !D.a) return null;
        for (let g = 0; !D.over && g < 40; g++) { if (draw) { UI.ov = null; UI.renderModal(); if (UI.duelArtsBar) UI.duelArtsBar(D); } A.duelAuto ? (() => { let act = A.aiAction(D.a, D.b, D); const k = SK2.duelPlanFor(D, D.a, D.b, act, true); A.duelAct(k ? 'k:' + k : act); })() : A.duelAct('strike'); }
        if (draw) UI.renderModal();
        const res = { log: D.log.join('\n'), result: D.result, uses: JSON.stringify([D.a.k2 && D.a.k2.uses, D.b.k2 && D.b.k2.uses]), rng: JSON.stringify(A.rngState), state: T.hash(A.S) };
        if (A.S.queue.length && A.S.queue[0].type === 'duel') A.duelClose();
        return res;
      };
      const f = T.trySeeds(T.seedRun(9881, 6), seed => { const a = run(seed, false); return a && a.uses !== '[[],[]]' ? { a, seed } : null; });
      if (!f.res) return { tried: f.tried };
      const b = run(f.res.seed, true), c = run(f.res.seed, false), a = f.res.a;
      return { seed: f.res.seed, len: a.log.split('\n').length, uses: a.uses, sameLog: a.log === b.log && a.log === c.log, sameRes: a.result === b.result && a.result === c.result, sameRng: a.rng === b.rng && a.rng === c.rng, sameState: a.state === b.state && a.state === c.state };
    }, { ARTS, ARMED, FOES });
    if (r.none) return { ok: false, detail: 'no arts in the build' };
    if (!r.seed) return { ok: false, detail: 'no world with an art used in a duel among ' + r.tried.join(', ') };
    const ok = r.sameLog && r.sameRes && r.sameRng && r.sameState;
    return { ok, detail: `world ${r.seed}: a duel of ${r.len} lines with arts used (${r.uses.slice(0, 120)}), alone, drawn at every exchange, and alone again: the same log ${r.sameLog}, result ${r.sameRes}, random stream ${r.sameRng}, state ${r.sameState}` };
  },

  // step 11 (D-186): the month (the long tier: three bot lives of five years). Over bot lives the player learns arts only by a route the data names, at most two a month,
  // never a mana-based one, and readies what he learns while a place is free; anyone else holds arts in the closed form by
  // the same routes, never a mana-based one. A month's buff heals a wound (and not twice a month), and a month's raise lifts
  // a stat for its month and is gone after it. No die is drawn by any of it.
  async sk2ArtsMonth(pg) {
    const r = await pg.evaluate(({ ARTS, ARMED }) => {
      const SK2 = A.SK2; if (!SK2 || !SK2.artsMonth) return { none: true };
      const E = SK2.E(), arts = eval(ARTS), armed = eval(ARMED);
      const out = { lives: 0, learned: 0, routes: {}, bad: [], npcs: 0, npcArts: 0, readied: 0 };
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      const learn0 = SK2.learnArt; let month = null, inMonth = 0;
      SK2.learnArt = function (pc, id, via) {
        const s = SK2.art(id), rt = s && SK2.artRoute(pc, s, SK2.artFacts(pc));
        if (!rt || rt.via !== via) bad(`${id} learned by ${via} with no route open`);
        if (E.usesMana(s)) bad(`${id}: a mana-based art for a person`);
        const m = SK2.absMonth(); if (m !== month) { month = m; inMonth = 0; } if (++inMonth > SK2.ART_LEARN_MAX) bad(`${inMonth} arts in one month`);
        const ok = learn0.apply(this, arguments); if (ok) { out.learned++; out.routes[via] = (out.routes[via] || 0) + 1; }
        return ok;
      };
      try {
        for (const [seed, status, age] of [[9891, 'noble', 14], [9892, 'peasant', 15], [9893, 'noble', 20]]) {
          T.enter({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: age }); T.play(5);
          const pc = A.pc(); if (!pc || !pc.alive) continue;
          out.lives++;
          out.readied += SK2.readiedOf(pc).length;
          for (const id in pc.ka || {}) { const e = pc.ka[id]; if (!(e.lv >= 1 && e.lv <= 10)) bad(`${id} at Lv ${e.lv}`); }
          if (SK2.readiedOf(pc).length > SK2.slotsOf(pc)) bad('more readied than places');
          // anyone else: the closed form
          for (const p of Object.values(A.S.people).filter(p => p && p.alive && p.id !== pc.id && p.st && A.isAdult(p)).slice(0, 300)) {
            const h = SK2.artsHeld(p); out.npcs++; if (h.length) out.npcArts++;
            for (const x of h) if (E.usesMana(SK2.art(x.id))) bad(`${p.id} holds the mana-based ${x.id}`);
          }
        }
      } finally { SK2.learnArt = learn0; }
      // a month's buffs, on a grown player: a wound healed, not twice in a month; a stat raised for its month only
      const pc = armed(9895, 30); arts(pc, [['field_dressing', 1], ['hunters_season', 10]]);
      // (a wound itself is placed on the body by the game's dice: only the buffs' uses are held to drawing nothing)
      let pure = true;
      const use = id => { const r0 = JSON.stringify(A.rngState), r1 = SK2.useOutside(pc, id); if (JSON.stringify(A.rngState) !== r0) pure = false; return r1; };
      A.addWound(pc, 'deep_cut'); A.S.time = 20;
      const w0 = pc.wounds.filter(w => w.until && w.until > A.S.year).length;
      const u1 = use('field_dressing'), w1 = pc.wounds.filter(w => w.until && w.until > A.S.year).length;
      A.addWound(pc, 'scar_arm'); const u2 = use('field_dressing');
      const ins0 = A.stat(pc, 'ins'), u3 = use('hunters_season'), ins1 = A.stat(pc, 'ins'), u4 = use('hunters_season');
      const y = A.S.year; A.S.year = y + 1; const ins2 = A.stat(pc, 'ins'); A.S.year = y;
      out.buffs = { w0, w1, healed: u1.ok, twice: u2.ok, ins0, ins1, ins2, again: u4.ok, raised: u3.ok, pure };
      return out;
    }, { ARTS, ARMED });
    if (r.none) return { ok: false, detail: 'no arts in the build' };
    const B = r.buffs;
    const ok = !r.bad.length && r.lives >= 2 && r.learned >= 3 && r.npcArts >= 10 && B.healed && B.w1 === B.w0 - 1 && !B.twice && B.raised && B.ins1 > B.ins0 && B.ins1 - B.ins0 <= 10 && B.ins2 === B.ins0 && !B.again && B.pure;
    return { ok, detail: `${r.lives} lives of five years: ${r.learned} arts learned (${Object.entries(r.routes).map(([k, v]) => k + ' ' + v).join(', ')}), every one by an open route, at most two a month, none mana-based; ${r.readied} readied at the end; ${r.npcArts} of ${r.npcs} grown people hold arts in the closed form, none mana-based; ` +
      `a month's buff healed a wound (${B.w0} -> ${B.w1}) and not twice (${B.twice ? 'twice!' : 'refused'}); insight ${B.ins0} -> ${B.ins1} for the month, ${B.ins2} after it; no die drawn ${B.pure}${r.bad.length ? '; ' + r.bad.join('; ') : ''}` };
  },

  // step 11 (D-186): the player's view at 375 x 667. The Skills sheet shows the arts with their kinds and what is in hand,
  // a button to put one away or ready one, a month's buff's Use; every control at least 44 points; nothing wider than the
  // screen; no percentage; a press on an art's name opens its description and a hover opens nothing. In a fight the bar
  // of readied arts fits too.
  async sk2ArtsView(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    try {
      await pg.evaluate(({ ARTS, ARMED }) => {
        const arts = eval(ARTS), armed = eval(ARMED), pc = armed(9901, 30);
        arts(pc, [['quick_cut', 4], ['twin_cut', 2], ['shell_of_oak', 3], ['war_cry', 5], ['last_stand', 2], ['field_dressing', 1], ['hunters_season', 2]]);
        pc.kr = pc.kr.slice(0, 2); A.S.time = 20;
        UI.ov = { type: 'profs' }; UI.renderModal();
      }, { ARTS, ARMED });
      const probe = () => pg.evaluate(sel => {
        const root = document.querySelector(sel); if (!root) return { none: true };
        const ctl = [...root.querySelectorAll('button, [role="button"], [data-a]')].filter(el => el.offsetParent !== null);
        const small = ctl.filter(el => { const b = el.getBoundingClientRect(); return b.height < 43.5 || b.width < 43.5; }).map(el => (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30));
        const wide = [...root.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).length;
        return { ctl: ctl.length, small, wide, pct: /%/.test(root.innerText), text: root.innerText.slice(0, 400), kinds: [...root.querySelectorAll('.art-k')].map(x => x.textContent), notes: root.querySelectorAll('.art-n[data-tt], .art-n[role="button"], .art-row .tt-i').length, rows: root.querySelectorAll('.art-row').length, hscroll: document.documentElement.scrollWidth > window.innerWidth + 1 };
      }, '.arts');
      const sheet = await probe();
      // a hover opens nothing; a press on a name opens its description
      await pg.hover('.arts .art-n'); const hov = await pg.evaluate(() => (UI.TT && UI.TT.depth ? UI.TT.depth() : 0));
      await pg.click('.arts .art-n'); const open = await pg.evaluate(() => (UI.TT && UI.TT.depth ? UI.TT.depth() : 0));
      const note = await pg.evaluate(() => { const p = document.querySelector('.tt-pop'); return p ? p.innerText : ''; });
      await pg.keyboard.press('Escape');
      // put one away and ready another, by their buttons
      await pg.click('.arts [data-a="artUnready"]');
      const after = await pg.evaluate(() => A.SK2.readiedOf(A.pc()).map(x => x.id));
      await pg.click('.arts [data-a="artReady"]');
      const after2 = await pg.evaluate(() => A.SK2.readiedOf(A.pc()).map(x => x.id));
      // the duel's bar
      const duel = await pg.evaluate(() => { const pc = A.pc(); pc.kr.forEach(x => { x.m = -1; }); const foe = Object.values(A.S.people).find(p => p && p.alive && p.id !== pc.id && p.st && A.isAdult(p));
        UI.ov = null; A.S.queue = []; A.startDuel(pc, foe, { kind: 'duel', lethal: false, light: 'day' }); UI.renderModal(); return !!document.querySelector('.artbar'); });
      const bar = await pg.evaluate(() => { const root = document.querySelector('.artbar'); if (!root) return null; const ctl = [...root.querySelectorAll('button')];
        return { n: ctl.length, small: ctl.filter(el => el.getBoundingClientRect().height < 43.5).length, wide: [...root.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).length, pct: /%/.test(root.innerText) }; });
      await pg.evaluate(() => { if (A.S.queue.length && A.S.queue[0].type === 'duel') { A.S.queue.shift(); } UI.ov = null; UI.renderModal(); });
      const ok = !sheet.none && sheet.rows >= 7 && sheet.small.length === 0 && sheet.wide === 0 && !sheet.hscroll && !sheet.pct && ['Active', 'Passive', 'Buff'].every(k => sheet.kinds.includes(k)) && sheet.notes >= 7 &&
        hov === 0 && open === 1 && note.length > 40 && !/%|\d/.test(note) && after.length === 1 && after2.length === 2 && duel && bar && bar.n >= 1 && bar.small === 0 && bar.wide === 0 && !bar.pct;
      return { ok, detail: `the sheet at 375: ${sheet.rows} arts (${[...new Set(sheet.kinds)].join(', ')}), ${sheet.ctl} controls, under 44 points ${sheet.small.length}${sheet.small.length ? ' (' + sheet.small.join(', ') + ')' : ''}, wider than the screen ${sheet.wide}, sideways ${sheet.hscroll}, percentages ${sheet.pct}; ` +
        `descriptions ${sheet.notes}, hover opens ${hov}, a press opens ${open} ("${note.slice(0, 80)}"); put away -> ${after.length} in hand, readied -> ${after2.length}; the duel's bar: ${bar ? bar.n + ' buttons, small ' + bar.small + ', too wide ' + bar.wide : 'none'}` };
    } finally { await pg.setViewportSize({ width: 1366, height: 768 }); }
  },

  // step 8 (D-182): merging. A grown player with a known recipe's two parts at C · Lv 10 and someone to show it (seed
  // fallback, H-082: the first world of the run whose planted player has a teacher or a school for one recipe) is offered
  // the merge at the month's turn; joined, the result is held at Lv 1, the parts are absorbed (shown nowhere, sealed: the
  // concepts and a deed bring no evolution) and both families read through it, never lower than before; the mirror holds;
  // it grows from what its families earn and stops at Lv 10; it is not offered again. A found recipe comes only at a named
  // moment, 1 in 200 by the moment's hash, once a life; no die is drawn for either.
  async sk2Merge(pg) {
    const r = await pg.evaluate(({ GROW, PLANT }) => {
      const SK = A.SK, SK2 = A.SK2, out = { bad: [] };
      if (!SK2 || !SK2.doMerge || !SK2.afterMonth || !SK2.moment) return { none: true };
      const grow = eval(GROW), plant = eval(PLANT), I = SK2.IX(), E = SK2.E();
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      const known = I.recipes.filter(x => x.kind === 'known');
      const f = T.trySeeds(T.seedRun(9821, 12), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 }); A.S.queue = [];
        const pc = A.pc(); SK.month(pc); grow(pc);
        for (const x of known) { const fams = x.parts.map(p => I.BY[p.id].family); for (const c of fams) plant(pc, c, 15); if (SK2.knows(pc, x)) return { rc: x.id, fams }; }
        return null;
      });
      out.seed = f.seed; out.tried = f.tried;
      if (!f.res) return out;
      const pc = A.pc(), R = I.RECIPE[f.res.rc], res = I.BY[R.result], [c1, c2] = f.res.fams;
      out.rc = R.id; out.parts = R.parts.map(p => I.BY[p.id].name);
      const before = [A.skill(pc, c1), A.skill(pc, c2)], rng0 = JSON.stringify(A.rngState);
      // the month offers it (only one offer stands at a time)
      A.S.queue = []; SK2.ke(pc).off = {};
      SK2.afterMonth(pc, { ledger: [] });
      out.pure = JSON.stringify(A.rngState) === rng0;
      const qi = A.S.queue.findIndex(q => q && q.ev === 'sk2_merge_offer');
      if (qi < 0) { bad('no offer'); return out; }
      A.S.queue.unshift(A.S.queue.splice(qi, 1)[0]);
      const v = A.eventView(A.S.queue[0]);
      out.words = String(v.text).split(/\s+/).length; out.choices = v.choices.map(c => c.t);
      if (out.words > 80 || v.choices.length < 2) bad('the card: ' + out.words + ' words');
      A.eventChoose(v.choices.findIndex(c => /Join/.test(c.t))); A.eventClose();
      const e = pc.ks[R.result], K = pc.ke || {};
      out.after = [A.skill(pc, c1), A.skill(pc, c2)]; out.before = before;
      out.label = SK2.label(pc, c1, { name: true });
      if (!e || e.lv !== 1 || !(K.m || []).includes(R.result)) bad('not held: ' + JSON.stringify(e));
      if (!(out.after[0] >= before[0] && out.after[1] >= before[1])) bad('a family reads lower: ' + JSON.stringify([before, out.after]));
      if (out.after[0] !== Math.round(E.value(res.rank, 1))) bad('the family does not read the result: ' + out.after[0]);
      if (!out.label.startsWith(res.name)) bad('the label: ' + out.label);
      const tops = SK2.tops(pc);
      for (const p of R.parts) { if (tops[p.id]) bad('the part ' + p.id + ' still shows'); if (!SK2.absorbed(pc, p.id)) bad('the part ' + p.id + ' not absorbed'); }
      if (!(K.ev || []).some(x => x.how === 'merge' && x.to === R.result && x.why)) bad('no record of the merge');
      if (!A.S.log.flatMap(x => x.lines.map(l => l[0])).some(t => t.includes(res.name + ', ' + res.rank + ' · Lv 1'))) bad('no log line');
      const chk = SK.checkPC(pc); if (chk.length) bad('the table: ' + chk.join(', '));
      // sealed: every concept and a deed for the B edge, and still no evolution
      const s1 = pc.sk[c1];
      for (const cn of SK.E().conceptsOf(c1, 3)) s1.got[cn.id] = 20;
      SK.proof(pc, c1, 'a planted deed'); SK.month(pc);
      out.sealedAt = SK2.rungFor(pc, c1);
      if (out.sealedAt.rank !== 'C') bad('an absorbed part evolved: ' + JSON.stringify(out.sealedAt));
      out.sealedWhy = (SK2.gate(pc)(c1, 3, pc.sk[c1], 30) || {}).other;
      // it grows from its families' work, and stops at Lv 10
      for (let m = 0; m < 30; m++) { A.gainXp(pc, c1, 3, { q: 'drill', why: 'planted drill' }); A.gainXp(pc, c2, 3, { q: 'drill', why: 'planted drill' }); SK.month(pc); }
      out.grown = pc.ks[R.result].lv; out.grownRead = A.skill(pc, c1);
      if (!(out.grown > 1) || !(out.grownRead > out.after[0])) bad('it did not grow: Lv ' + out.grown);
      pc.ks[R.result].lv = 10; pc.ks[R.result].xp = 0;
      for (let m = 0; m < 6; m++) { A.gainXp(pc, c1, 10, { q: 'drill', why: 'planted drill' }); SK.month(pc); }
      if (pc.ks[R.result].lv !== 10) bad('past Lv 10: ' + pc.ks[R.result].lv);
      const chk2 = SK.checkPC(pc); if (chk2.length) bad('the table after: ' + chk2.join(', '));
      // never offered again
      A.S.queue = []; SK2.ke(pc).off = {}; SK2.afterMonth(pc, { ledger: [] });
      if (A.S.queue.some(q => q && q.ev === 'sk2_merge_offer' && q.ctx.rc === R.id)) bad('offered again');
      // found: the parts of a found recipe at Lv 10; a moment's hash, 1 in 200, once a life (the advance's budget shut)
      A.S.queue = []; pc.btN = 99;
      const F = I.recipes.find(x => x.kind === 'found' && !x.moment) || I.recipes.find(x => x.kind === 'found');
      for (const p of F.parts) plant(pc, I.BY[p.id].family, 15);
      const kind = F.moment || 'near_death';
      let n = 0; const rng1 = JSON.stringify(A.rngState);
      while (!SK2.ke(pc).fd && n < 4000) { n++; SK2.moment(pc, kind, { why: 'a planted moment' }); }
      out.foundAfter = n;
      const q = A.S.queue.find(x => x && x.ev === 'sk2_merge_offer');
      if (!SK2.ke(pc).fd || !q || q.ctx.rc !== F.id || q.ctx.kind !== 'found') bad('no found offer in ' + n + ' moments');
      for (let i = 0; i < 2000; i++) SK2.moment(pc, kind, { why: 'a planted moment' });
      if (A.S.queue.filter(x => x && x.ev === 'sk2_merge_offer').length !== 1) bad('a found merge offered twice');
      out.pure2 = JSON.stringify(A.rngState) === rng1;
      // and the hash's rate over many moments: about 1 in 200
      let hits = 0; for (let i = 0; i < 40000; i++) if (E.unitOf('rate|' + i + '|found') < E.FOUND_CHANCE) hits++;
      out.rate = hits / 40000;
      if (!(out.rate > 0.004 && out.rate < 0.006)) bad('found rate ' + out.rate);
      return out;
    }, { GROW, PLANT });
    if (r.none) return { ok: false, detail: 'no merging on the page' };
    if (!r.seed) return { ok: false, detail: `no world of ${r.tried.join(', ')} gave a planted noble a teacher or a school for any known recipe` };
    const ok = !r.bad.length && r.pure && r.pure2;
    return { ok, detail: `world ${r.seed} (tried ${r.tried.join(', ')}): ${r.rc}, ${r.parts.join(' + ')}; offered at the month's turn (card ${r.words} words, ${JSON.stringify(r.choices)}); joined, the families read ${JSON.stringify(r.before)} -> ${JSON.stringify(r.after)} ("${r.label}"); ` +
      `a part given every concept and a deed stays ${r.sealedAt && r.sealedAt.rank + ' · Lv ' + r.sealedAt.lv} (${(r.sealedWhy || []).join('; ')}); thirty months of drill: Lv ${r.grown}, read ${r.grownRead}; capped at Lv 10; ` +
      `a found merge offered after ${r.foundAfter} moments and never again; hash rate ${r.rate}; no die drawn ${r.pure && r.pure2 ? 'yes' : 'NO'}; ${r.bad.length} faults${r.bad.length ? ': ' + r.bad.join('; ') : ''}` };
  },

  // order 95 (D-192): a rank's jump, the function the level's every hundredth wall calls (sk2Advance, the hash chance at a
  // named moment, is archived in archive/skills2-advance/). Planted on a grown player at C · Lv 5: nothing met, no jump;
  // three thousand fights won far above him move nothing (no advance); the concepts alone (one of three) no jump; the
  // concepts and the deed, a jump to B · Lv 1, the old rung gone, recorded and logged, the family read through the new
  // one; the concepts and talent jump too; rankJumps with max 1 jumps one family of two; no die drawn, D-163's budget and
  // the body untouched; an NPC with no post has no deed, with a post and talent S he jumps by his number.
  async sk2Jump(pg) {
    const r = await pg.evaluate(({ GROW, PLANT }) => {
      const SK = A.SK, SK2 = A.SK2, out = { bad: [] };
      if (!SK2 || !SK2.rankJump || !SK2.jumpVerdict) return { none: true };
      const grow = eval(GROW), plant = eval(PLANT), E = SK2.E(), B = ['the-measure', 'the-bind'];
      const bad = s => { if (out.bad.length < 12) out.bad.push(s); };
      T.enter({ seed: 9841, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 24 }); A.S.queue = [];
      const pc = A.pc(); SK.month(pc); grow(pc);
      const rng0 = JSON.stringify(A.rngState), bt0 = pc.btN || 0, w0 = pc.wounds.length;
      // sword at C · Lv 5 or 6 (S1 13), B's concepts not grasped, no deed, talent C: one condition of three at most
      const prep = c => { plant(pc, c, 13); const s = pc.sk[c]; for (const id of B) delete s.got[id]; s.proved = false; pc.tal = Object.assign({}, pc.tal || {}, { [c]: 'C' }); SK2.syncFam(pc, c); };
      prep('sword');
      out.at = SK2.rungFor(pc, 'sword');
      let v = SK2.jumpVerdict(pc, 'sword');
      out.nil = v && { ok: v.ok, met: v.met, missing: v.missing };
      if (!v || v.ok || v.met.length) bad('jumps with nothing met: ' + JSON.stringify(out.nil));
      // a moment no longer leaps (the advance is archived): three thousand fights won far above him change nothing
      for (let i = 0; i < 3000; i++) SK2.moment(pc, 'deed_above', { k: 'sword', why: 'a planted fight' });
      out.afterMoments = SK2.rungFor(pc, 'sword');
      if (out.afterMoments.rank !== 'C' || SK2.advance || SK2.advanceAt || (pc.ke.ev || []).some(e => e.how === 'advance' || e.how === 'jump')) bad('a moment moved a rank: ' + JSON.stringify(out.afterMoments));
      // the concepts alone: one of three, no jump; with the deed (S1's proof): two of three, it jumps
      for (const id of B) pc.sk.sword.got[id] = 24;
      v = SK2.rankJump(pc, 'sword', { why: 'the breakthrough at level 100' });
      if (!v || v.done || v.met.join() !== 'concepts') bad('jumped on the concepts alone: ' + JSON.stringify(v));
      pc.sk.sword.proved = true;
      const dry = SK2.rankJump(pc, 'sword', { why: 'x', dry: true });
      if (!dry.ok || dry.done || SK2.rungFor(pc, 'sword').rank !== 'C') bad('a dry verdict moved the rung');
      v = SK2.rankJump(pc, 'sword', { why: 'the breakthrough at level 100' });
      out.jump = v; out.after = SK2.rungFor(pc, 'sword');
      const e = (pc.ke.ev || []).filter(x => x.how === 'jump').slice(-1)[0];
      out.rec = e;
      if (!v.done || out.after.rank !== 'B' || out.after.lv !== 1) bad('no jump to B · Lv 1: ' + JSON.stringify(out.after));
      if (pc.ks.basic_swordsmanship || pc.ks.stick_and_lath || !pc.ks.measured_blade) bad('the old rung is not gone: ' + Object.keys(pc.ks).filter(k => /sword|blade|stick/.test(k)).join());
      if (!e || e.from !== 'basic_swordsmanship' || e.to !== 'measured_blade' || e.met.join() !== 'concepts,deed') bad('the record: ' + JSON.stringify(e));
      if (!A.S.log.flatMap(x => x.lines.map(l => l[0])).some(t => /jumps a rank and becomes Measured Blade/.test(t))) bad('no log line');
      out.read = [A.skill(pc, 'sword'), E.value('B', 1)];
      if (SK2.reads(pc, 'sword') < E.value('B', 1) - 1e-9) bad('the family does not read through the new rung: ' + out.read);
      // talent and the concepts, no deed: the bow jumps from C too
      prep('bow'); for (const id of SK.E().conceptsOf('bow', 3).map(c => c.id)) pc.sk.bow.got[id] = 24; pc.tal.bow = 'A';
      v = SK2.rankJump(pc, 'bow', { why: 'the breakthrough at level 100' });
      out.bow = [v && v.met, SK2.rungFor(pc, 'bow').rank];
      if (!v || !v.done || v.met.join() !== 'concepts,talent' || SK2.rungFor(pc, 'bow').rank !== 'B') bad('talent and concepts: ' + JSON.stringify(out.bow));
      // rankJumps: two families that may jump, at most one does (the better read first)
      prep('spear'); prep('melee');
      for (const c of ['spear', 'melee']) { for (const cn of SK.E().conceptsOf(c, 3)) pc.sk[c].got[cn.id] = 24; pc.sk[c].proved = true; }
      const js = SK2.rankJumps(pc, { why: 'the breakthrough at level 200', max: 1 });
      out.many = [js.map(x => x.k), SK2.rungFor(pc, 'spear').rank, SK2.rungFor(pc, 'melee').rank];
      if (js.length !== 1 || [SK2.rungFor(pc, 'spear').rank, SK2.rungFor(pc, 'melee').rank].filter(x => x === 'B').length !== 1) bad('rankJumps max 1: ' + JSON.stringify(out.many));
      // nothing drawn, D-163's budget untouched, no wound
      out.pure = JSON.stringify(A.rngState) === rng0;
      if ((pc.btN || 0) !== bt0) bad('the breakthrough budget moved');
      if (pc.wounds.length !== w0) bad('a jump cost a wound');
      // anyone else: his number, by the closed form's facts (his post is his deed, his talent a letter)
      // (no post of the registry's either: a councillor's seat is his deed, H-167)
      const npc = Object.values(A.S.people).filter(p => p && p.alive && p.id !== pc.id && p.st && A.age(p) >= 30 && !p.sk && !p.ruler && !(A.POSTS && A.POSTS.held(p.id).some(k => !/^(house|title):/.test(k)))).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
      if (!npc) bad('no NPC');
      else {
        npc.skills = npc.skills || {}; npc.skills.sword = SK.VALUES[13]; npc.tal = Object.assign({}, npc.tal || {}, { sword: 'C' });
        const job0 = npc.job; delete npc.job; const mil0 = npc.mil; delete npc.mil; const off0 = npc.office; delete npc.office;
        const v0 = SK2.jumpVerdict(npc, 'sword');
        npc.job = { c: 'smith', r: 1 }; npc.tal.sword = 'S';
        const v1 = SK2.rankJump(npc, 'sword', { why: 'the breakthrough at level 100' });
        out.npc = [v0 && v0.met, v1 && v1.met, npc.skills.sword];
        if (v0 && v0.met.includes('deed')) bad('an NPC with no post has a deed');
        if (!v1 || !v1.done || npc.skills.sword !== SK.VALUES[E.s1OfRung('B', 1)]) bad('the NPC did not jump with a post and talent S: ' + JSON.stringify(out.npc));
        npc.job = job0; if (mil0) npc.mil = mil0; if (off0) npc.office = off0;
      }
      return out;
    }, { GROW, PLANT });
    if (r.none) return { ok: false, detail: 'no rank jump on the page (A.SK2.rankJump)' };
    const ok = !r.bad.length && r.pure;
    return { ok, detail: `sword at ${r.at && r.at.rank + ' · Lv ' + r.at.lv}: nothing met ${JSON.stringify(r.nil)}; 3000 moments after: ${r.afterMoments && r.afterMoments.rank} (no advance); ` +
      `concepts and deed: ${r.after && r.after.rank + ' · Lv ' + r.after.lv} (record "${r.rec && r.rec.why}"), read ${JSON.stringify(r.read)}; concepts and talent (bow) ${JSON.stringify(r.bow)}; rankJumps max 1 ${JSON.stringify(r.many)}; ` +
      `NPC [no post met, post and talent S met, read] ${JSON.stringify(r.npc)}; no die drawn ${r.pure ? 'yes' : 'NO'}; ${r.bad.length} faults${r.bad.length ? ': ' + r.bad.join('; ') : ''}` };
  },
  // step 7 (D-182): evolution at Lv 10, gated by the rung's own route. (1) The rule, planted on a grown player at Basic
  // Swordsmanship C · Lv 10 with the bar full: two years of practice (no stretch, so no deed) with the B rung's concepts
  // taken away bring no evolution, and the stall names what is wanting; the concepts and a deed bring Measured Blade at
  // once, the old rung gone into it (D-192; an old save's rungs and arts beside their evolutions retired on load, every read
  // the same), the reason in the record, the log and pc.ke.ev, and the card (from rank B: a stat
  // point through A.LV among its choices). The S rung's route asks thirty years: a man of twenty with every concept and a
  // deed of renown stays at A. Anyone else (the closed form) at the B edge with no post and no stretch won stays; with a
  // post he crosses and gains a recorded point. (2) Bot lives (seed fallback, H-082): every rung the player gains above
  // his start is an evolution with its conditions met (its concepts grasped, a deed named from rank B) or a level set
  // outright, and pooled over the lives at least one evolution happens, its reason in the log.
  async sk2Evolve(pg) {
    const r1 = await pg.evaluate(() => {
      const SK = A.SK, SK2 = A.SK2, out = { bad: [] };
      if (!SK2 || !SK2.gate || !SK2.evolved || !A.LV || !A.LV.grant) return { none: true };
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      T.enter({ seed: 9811, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      A.S.queue = [];
      const pc = A.pc(), B = ['the-measure', 'the-bind'];
      SK.month(pc);
      // a body that carries rank B (C9 holds a skill to what its stats carry)
      for (const st of GD.STATS) { pc.pot[st] = Math.max(pc.pot[st], 90); pc.st[st] = Math.max(pc.st[st], 85); }
      SK.set(pc, 'sword', 15, 'planted');
      const s = pc.sk.sword;
      s.xp = SK.E().cost(15) - 0.01;
      for (const id of B) delete s.got[id];
      s.proved = false;
      SK2.syncFam(pc, 'sword');
      if ((SK2.rungFor(pc, 'sword') || {}).lv !== 10) bad('the plant is not at C · Lv 10: ' + JSON.stringify(SK2.rungFor(pc, 'sword')));
      const ev0 = ((pc.ke && pc.ke.ev) || []).length;
      for (let m = 0; m < 24; m++) { A.gainXp(pc, 'sword', 2, { q: 'practice', why: 'planted practice' }); SK.month(pc); }
      out.held = SK2.rungFor(pc, 'sword');
      if (out.held.rank !== 'C' || ((pc.ke && pc.ke.ev) || []).length !== ev0) bad('evolved without the deed: ' + JSON.stringify(out.held));
      const g0 = SK2.gate(pc)('sword', 3, pc.sk.sword, SK.ageF(pc)) || {};
      out.stall = (g0.v ? g0.v.missing : ['no verdict']).join(', ');
      if (!g0.deed) bad('the gate does not name the deed wanting');
      // the concepts and a deed: it evolves in that month
      for (const id of B) pc.sk.sword.got[id] = Math.floor(SK.ageF(pc));
      SK.proof(pc, 'sword', 'a planted bout before witnesses');
      SK.month(pc);
      out.after = SK2.rungFor(pc, 'sword');
      const e = ((pc.ke && pc.ke.ev) || []).slice(-1)[0] || null;
      out.ev = e;
      // (what was stored at the edge lands at once: Lv 1 or more)
      if (out.after.rank !== 'B' || !(out.after.lv >= 1)) bad('no evolution with the conditions met: ' + JSON.stringify(out.after));
      if (!e || e.to !== 'measured_blade' || e.from !== 'basic_swordsmanship' || !e.ok || !/the deed/.test(e.why) || !/measure/.test(e.why)) bad('the record: ' + JSON.stringify(e));
      // the old rung is gone into the new one (order 95, D-192), and the family reads through the new one
      out.kept = Object.keys(pc.ks).filter(k => ['stick_and_lath', 'basic_swordsmanship', 'measured_blade'].includes(k)).sort();
      if (out.kept.join() !== 'measured_blade' || !(pc.ks.measured_blade.lv >= 1)) bad('the old rungs are not gone: ' + out.kept.join());
      out.read = [SK2.reads(pc, 'sword'), SK2.E().value('B', out.after.lv), SK2.label(pc, 'sword', { name: true })];
      if (Math.abs(out.read[0] - out.read[1]) > 1e-9 || !/^Measured Blade · B/.test(out.read[2])) bad('the family does not read through the new rung: ' + JSON.stringify(out.read));
      out.line = SK2.E().heldOfRung(SK2.IX(), 'sword', 'B', out.after.lv);
      if (out.line.length !== 1 || out.line[0].line.join() !== 'stick_and_lath,basic_swordsmanship') bad('the held line: ' + JSON.stringify(out.line));
      const lines = A.S.log.flatMap(x => x.lines.map(l => l[0]));
      out.logLine = lines.filter(t => /becomes Measured Blade/.test(t)).slice(-1)[0] || '';
      if (!out.logLine) bad('no log line');
      if (!(pc.skr || []).some(x => x.t === 'evolve' && /becomes Measured Blade/.test(x.text))) bad('no record line');
      // a save of version 20 holds the old rungs at Lv 10 beside the new one, and an art beside its evolution: on load they
      // are retired (the step skills2line) and nothing any check reads moves
      if (!A.V2SAVE.STEPS.some(x => x[0] === 'skills2line')) bad('no save step skills2line');
      pc.ks.stick_and_lath = { lv: 10 }; pc.ks.basic_swordsmanship = { lv: 10 };
      const k0 = { ka: pc.ka, kr: pc.kr, kcd: pc.kcd };
      pc.ka = { quick_cut: { lv: 10, xp: 0, y: 1, via: 'practice' }, twin_cut: { lv: 2, xp: 0, y: 2, via: 'evolve' } }; pc.kr = [{ id: 'quick_cut', m: -1 }]; pc.kcd = { quick_cut: -1 };
      const reads = () => SK.IDS.map(c => A.skill(pc, c) + '/' + A.checkVal(pc, { s: c, d: 45 })).join() + '|' + A.fightWorth(pc) + '|' + JSON.stringify(A.CAPS(pc).held);
      const before = reads(), n1 = SK2.migrateLine(A.S), after = reads(), n2 = SK2.migrateLine(A.S);
      out.migrate = [n1, n2, before === after, Object.keys(pc.ka).sort().join(), JSON.stringify(pc.kr), (pc.ka.twin_cut || {}).fr];
      if (n1 !== 3 || n2 !== 0 || before !== after || pc.ks.stick_and_lath || pc.ks.basic_swordsmanship || !pc.ks.measured_blade) bad('the load: ' + JSON.stringify(out.migrate));
      if (pc.ka.quick_cut || !pc.ka.twin_cut || (pc.ka.twin_cut.fr || []).join() !== 'quick_cut' || pc.kr.some(x => x.id === 'quick_cut') || (pc.kcd && pc.kcd.quick_cut != null)) bad('the art beside its evolution: ' + JSON.stringify(out.migrate));
      if (A.SK2.inFight(A.SK2.art('twin_cut')) && !pc.kr.some(x => x.id === 'twin_cut' && x.m === -1)) bad('its place in hand did not pass on: ' + JSON.stringify(pc.kr));
      SK2.artsMonth(pc, { ledger: [] });
      if (pc.ka.quick_cut) bad('an art gone into its evolution was learned again');
      Object.assign(pc, k0);
      // the card, and its point
      const qi = A.S.queue.findIndex(q => q && q.ev === 'sk2_evolved');
      out.card = qi >= 0 ? A.S.queue[qi].ctx : null;
      if (!out.card || !out.card.big) bad('no card for the B rung');
      else {
        A.S.queue.unshift(A.S.queue.splice(qi, 1)[0]);
        const v = A.eventView(A.S.queue[0]);
        out.words = String(v.text).split(/\s+/).length; out.choices = v.choices.map(c => c.t);
        const pts0 = (pc.lv && pc.lv.pts) || 0, i = v.choices.findIndex(c => /body/.test(c.t));
        A.eventChoose(i); A.eventClose();
        out.pts = [pts0, pc.lv.pts];
        if (pc.lv.pts !== pts0 + 1 || !(pc.lv.gw || []).some(g => /Measured Blade/.test(g[2]))) bad('the card\'s point: ' + JSON.stringify(out.pts));
        if (out.words > 80 || v.choices.length < 2 || v.choices.length > 4) bad('the card: ' + out.words + ' words, ' + v.choices.length + ' choices');
      }
      // the S rung asks thirty years and a renowned deed: at twenty, with all of it, he stays at A
      A.S.queue = [];
      SK.set(pc, 'bow', 25, 'planted'); const b = pc.sk.bow; b.xp = SK.E().cost(25) - 0.01; pc.fame = 60;
      for (const c of SK.E().conceptsOf('bow', 5)) b.got[c.id] = 20;
      SK.proof(pc, 'bow', 'a planted shot before the court'); SK.month(pc);
      out.young = SK2.rungFor(pc, 'bow');
      if (out.young.rank !== 'A') bad('S at twenty: ' + JSON.stringify(out.young));
      out.youngStall = (SK2.gate(pc)('bow', 5, pc.sk.bow, 20) || {}).other || [];
      if (!out.youngStall.some(t => /30/.test(t))) bad('the S rung\'s age not named: ' + JSON.stringify(out.youngStall));
      // anyone else: at the B edge, no post and no stretch won, he stays; with a post he crosses, and gains a point
      const npc = Object.values(A.S.people).filter(p => p && p.alive && p.id !== pc.id && p.st && A.age(p) >= 30 && !SK.works(p)).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
      if (!npc) bad('no NPC without a post');
      else {
        npc.skills = npc.skills || {}; npc.skills.sword = SK.VALUES[15]; npc.skx = { sword: SK.E().cost(15) - 1 };
        const allOf = () => SK.E().conceptsOf('sword', 3).every(c => SK.E().graspedBy(SK.npcView(npc), 'sword', c, SK.effortYears(npc, 'sword'), false));
        const all0 = allOf();
        // the gate itself: no post and no stretch won, no deed; a stretch won or a post is one
        out.npcGate = [SK2.npcGate(npc, { q: 'practice' })('sword', 3), SK2.npcGate(npc, { q: 'stretch' })('sword', 3), SK2.npcGate(Object.assign({}, npc, { job: { c: 'smith', r: 1 } }), null)('sword', 3)];
        if (out.npcGate.join() !== 'false,true,true') bad('the closed form\'s gate at B [no post, a stretch won, a post]: ' + out.npcGate.join());
        SK.npcGain(npc, 'sword', { q: 'practice', eu: 3, why: 'planted' });
        out.npcNoPost = [all0, npc.skills.sword];
        if (npc.skills.sword > SK.VALUES[15]) bad('an NPC with no post evolved without a deed');
        npc.job = { c: 'smith', r: 1 }; const pts = (npc.lv && npc.lv.pts) || 0, all = allOf();
        SK.npcGain(npc, 'sword', { q: 'practice', eu: 3, why: 'planted' });
        out.npcPost = [all, npc.skills.sword, pts, npc.lv && npc.lv.pts];
        if (all && npc.skills.sword >= SK.VALUES[16] && !(npc.lv && npc.lv.pts === pts + 1 && (npc.lv.gw || []).length)) bad('the NPC crossed into B with no recorded point');
        if (all && npc.skills.sword < SK.VALUES[16]) bad('an NPC with a post and every concept did not cross');
        delete npc.job;
      }
      return out;
    });
    if (r1.none) return { ok: false, detail: 'no evolution on the page (A.SK2.gate, A.SK2.evolved, A.LV.grant)' };
    const lives = [
      { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 },
      { seed: 7, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'F', startAge: 14 },
      { seed: 2024, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M', startAge: 14 },
      { seed: 31, race: 'human', realm: 'POL-02', status: 'noble', sex: 'M', startAge: 16 },
    ];
    const r2 = await pg.evaluate((lives) => {
      const SK = A.SK, SK2 = A.SK2, E = SK2.E(), I = SK2.IX(), out = { lives: 0, ev: 0, byRank: {}, set: 0, bad: [], logs: 0, cards: 0, plays: [], sample: [] };
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      const set0 = SK.set; let sets = [];
      SK.set = function (p, k) { if (p && A.S && p.id === A.S.pc) sets.push(SK.canon(k)[0]); return set0.apply(this, arguments); };
      try {
        for (const o of lives) {
          if (out.ev >= 3 && out.lives >= 2) break;   // standbys only while the count falls short
          T.enter(o); sets = [];
          const pc = A.pc(), tops0 = {};
          for (const c of SK.IDS) { const t = SK2.rungFor(pc, c); tops0[c] = t ? E.rankIx(t.rank) : -1; }
          let cards = 0;
          out.plays.push(T.play(25, { onEvent: v => { if (v && v.title === 'Something more') cards++; } }));
          out.lives++; out.cards += cards;
          const K = pc.ke || { ev: [] };
          for (const e of K.ev) {
            if (!e.from) continue;
            out.ev++; const ts = I.BY[e.to]; out.byRank[ts.rank] = (out.byRank[ts.rank] || 0) + 1;
            if (out.sample.length < 4) out.sample.push(`${ts.name}: ${e.why}`);
            const route = E.edgeNeeds(I, e.k, { C: 2, B: 3, A: 4, S: 5 }[ts.rank]);
            const got = (pc.sk[e.k] && pc.sk[e.k].got) || {};
            for (const c of route.needs.concept || []) if (got[c.split(':')[1]] == null) bad(`${o.seed} ${e.to}: ${c} not grasped`);
            if (route.needs.deed && !/the deed/.test(e.why)) bad(`${o.seed} ${e.to}: no deed named (${e.why})`);
            if (!e.ok || !e.why) bad(`${o.seed} ${e.to}: ${JSON.stringify(e)}`);
          }
          const lines = A.S.log.flatMap(x => (x.pc === pc.id ? x.lines.map(l => l[0]) : []));
          out.logs += lines.filter(t => /has gone as far as it goes and becomes/.test(t)).length;
          // of each ladder only the top rung is held (D-192): no rung below it in pc.ks
          for (const c of SK.IDS) {
            const t = SK2.topOf(pc.ks, c); if (!t) continue;
            for (const rk of E.HUMAN) { if (E.rankIx(rk) >= E.rankIx(t.rank)) break; const id = E.rungOf(I, c, rk); if (id && pc.ks[id]) bad(`${o.seed} ${id} held below ${t.id}`); }
          }
          // every rung above his start's top is an evolution, or a level set outright (a seat's minimum, a card)
          for (const c of SK.IDS) {
            const t = SK2.rungFor(pc, c); if (!t) continue;
            for (let ri = Math.max(1, tops0[c] + 1); ri <= E.rankIx(t.rank); ri++) {
              const id = E.rungOf(I, c, E.RANKS[ri]);
              if (K.ev.some(e => e.to === id)) continue;
              if (sets.includes(c)) { out.set++; continue; }
              bad(`${o.seed} ${id}: held with no evolution and no level set`);
            }
          }
        }
      } finally { SK.set = set0; }
      return out;
    }, lives);
    const nb = r1.bad.length + r2.bad.length;
    const ok = !nb && r2.ev >= 1 && r2.logs >= r2.ev && r2.lives >= 2;
    return { ok, detail: `planted: two years of practice at C · Lv 10 without the deed left ${r1.held && r1.held.rank + ' · Lv ' + r1.held.lv} (wanting: ${r1.stall}); with the concepts and a deed, ${r1.after && r1.after.rank + ' · Lv ' + r1.after.lv} at once ("${r1.ev && r1.ev.why}"; log: "${r1.logLine}"); ` +
      `the sword rungs held after it ${JSON.stringify(r1.kept)}, read [rungs, B's value, label] ${JSON.stringify(r1.read)}; an old save's rungs and art beside their evolutions on load [retired, again, reads the same, arts, in hand, gone into]: ${JSON.stringify(r1.migrate)}; ` +
      `the card ${r1.words} words, choices ${JSON.stringify(r1.choices)}, the body's choice gave a point ${JSON.stringify(r1.pts)}; at twenty with every S concept and a renowned deed: ${r1.young && r1.young.rank} (${(r1.youngStall || []).join('; ')}); ` +
      `the closed form's gate at the B edge [no post, a stretch won, a post] ${JSON.stringify(r1.npcGate)}; an NPC there with no post [concepts, read]: ${JSON.stringify(r1.npcNoPost)}, with a post [concepts, read, points before, after]: ${JSON.stringify(r1.npcPost)}. ` +
      `Bot lives ${r2.lives} (${r2.plays.join(', ')}): ${r2.ev} evolutions ${JSON.stringify(r2.byRank)}, ${r2.cards} cards, ${r2.logs} log lines, ${r2.set} rungs from a level set outright; e.g. ${r2.sample.join(' | ')}. ` +
      `${nb} faults${nb ? ': ' + r1.bad.concat(r2.bad).join('; ') : ''}` };
  },
  // step 6 (D-180): the caps hold whatever the data says. Big edge, fight, blunder, surge and resist effects are planted
  // on the sword family's D, C and B rungs (many sources, some of a thousand points); for everyone who holds a sword rung
  // a check on sword gains at most +12 (exactly 12 here), the fighting worth at most +15% (and more than nothing), the
  // judgment and will at most 2 steps, each resisting at most 3. Before the plant and after it is taken away every
  // reader gives what it gave; working all of it out draws no die and writes nothing to the state.
  async sk2Caps(pg) {
    const r = await pg.evaluate(() => {
      const SK2 = A.SK2, VS = A.V2S, out = { people: 0, bad: [], nBad: 0 };
      if (!SK2 || !SK2.edgeOf || !A.CAPS) return { none: true };
      const I = SK2.IX(), E = SK2.E();
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 });
      T.play(1);
      const ids = ['stick_and_lath', 'basic_swordsmanship', 'measured_blade'], keep = ids.map(id => I.BY[id].levels);
      const ck = { s: 'sword', d: 45 }, ck2 = { s: 'sword', s2: 'dagger', d: 55 }, ckFar = { s: 'persuasion', d: 45 };
      const people = Object.values(A.S.people).filter(p => p && p.alive && p.st && A.skill(p, 'sword') >= 1).sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, 120);
      const look = () => people.map(p => ({ ev: A.skillEff(p, 'sword'), cv: A.checkVal(p, ck), cv2: A.checkVal(p, ck2), far: A.checkVal(p, ckFar), fw: A.fightWorth(p), m: VS.minds(p, ck), odds: A.checkOdds(p, ck), wr: SK2.resistSteps(p, 'wounds'), fr: SK2.resistSteps(p, 'fear'), ir: SK2.resistShare(p, 'illness'), caps: A.CAPS(p), held: SK2.held(p).length, top: (SK2.rungFor(p, 'sword') || {}).rank }));
      const rng0 = A.rngState, h0 = T.hash(A.S);
      const before = look();
      out.fastPath = before.every(x => x.held === 0 && x.caps.held.length === 0);
      // the plant: nine sources of every kind across three rungs, some far past any budget
      const big = [
        { type: 'edge', tag: 'sword', v: 10 }, { type: 'edge', tag: 'arms', v: 1000 }, { type: 'edge', tag: 'all', v: 10 },
        { type: 'fight', tag: 'all', part: 'atk', v: 40 }, { type: 'fight', tag: 'sword', part: 'def', v: 400 }, { type: 'fight', tag: 'all', part: 'burst', v: 20 }, { type: 'fight', tag: 'all', part: 'adapt', v: 10 },
        { type: 'blunder', tag: 'sword', v: 3 }, { type: 'surge', tag: 'all', v: 30 },
        { type: 'resist', of: 'wounds', v: 5 }, { type: 'resist', of: 'fear', v: 50 }, { type: 'resist', of: 'illness', v: 5 },
      ];
      ids.forEach((id, i) => { I.BY[id].levels = keep[i].map(b => (b.at === 1 ? { at: 1, effects: b.effects.concat(big) } : b)); if (!keep[i].some(b => b.at === 1)) I.BY[id].levels = [{ at: 1, effects: big.slice() }].concat(keep[i]); });
      let after;
      try { SK2.capsReset(); after = look(); } finally { ids.forEach((id, i) => { I.BY[id].levels = keep[i]; }); SK2.capsReset(); }
      const restored = look();
      out.pure = A.rngState === rng0 && T.hash(A.S) === h0;
      const bad = (p, s) => { out.nBad++; if (out.bad.length < 8) out.bad.push(p.id + ': ' + s); };
      let fwMax = 0, gained = 0;
      people.forEach((p, i) => {
        const b = before[i], a = after[i], z = restored[i];
        out.people++;
        if (JSON.stringify([b.ev, b.cv, b.cv2, b.far, b.fw, b.m, b.odds]) !== JSON.stringify([z.ev, z.cv, z.cv2, z.far, z.fw, z.m, z.odds])) bad(p, 'not as before once the plant is gone');
        if (!a.held) { bad(p, 'holds a sword rung (' + b.top + ') but nothing was gathered'); return; }
        if (a.ev - b.ev !== 12) bad(p, `edge on sword ${a.ev - b.ev}, not the cap of 12`);
        if (!(a.cv - b.cv <= 12 + 1e-9 && a.cv2 - b.cv2 <= 12 + 1e-9 && a.cv > b.cv)) bad(p, `a check gained ${a.cv - b.cv} / ${a.cv2 - b.cv2}`);
        if (a.far - b.far > 1e-9 + 12 || a.far - b.far < 0) bad(p, `a persuasion check moved ${a.far - b.far} (only 'all' reaches it)`);
        const share = (a.fw - b.fw) / Math.max(1, b.fw);
        if (b.fw >= 30) fwMax = Math.max(fwMax, share);
        // (the worth is rounded: a share of a very small worth can round to nothing)
        if (a.fw - b.fw > 0.15 * b.fw + 1.5 || a.fw < b.fw) bad(p, `fighting worth ${b.fw} -> ${a.fw}`);
        if (a.fw > b.fw) out.fwUp = (out.fwUp || 0) + 1;
        if (Math.abs(a.m.judgment - b.m.judgment - 2 * E.STEP_MIND) > 1e-9 || Math.abs(a.m.will - b.m.will - 2 * E.STEP_MIND) > 1e-9) bad(p, `judgment ${b.m.judgment} -> ${a.m.judgment}, will ${b.m.will} -> ${a.m.will} (2 steps each)`);
        if (a.wr !== 3 || a.fr !== 3 || Math.abs(a.ir - 0.3) > 1e-9) bad(p, `resist wounds ${a.wr}, fear ${a.fr}, illness ${a.ir}`);
        if (!Object.isFrozen(a.caps) || a.caps.edges.arms !== 12 || a.caps.resist.fear !== 3 || A.CAPS(p) === a.caps) bad(p, 'the profile (frozen, capped, forgotten after the reset)');
        if (a.odds < b.odds) bad(p, `odds fell ${b.odds} -> ${a.odds}`);
        gained++;
      });
      out.fwMax = Math.round(fwMax * 1000) / 1000; out.gained = gained;
      return out;
    });
    if (r.none) return { ok: false, detail: 'no A.SK2.edgeOf or A.CAPS on the page' };
    const ok = r.fastPath && r.pure && r.nBad === 0 && r.people >= 20 && (r.fwUp || 0) >= r.people * 0.8;
    return { ok, detail: `${r.people} people holding a sword rung; before the plant every profile empty ${r.fastPath ? 'yes' : 'NO'}; with it: every check on sword +12 exactly, fighting worth up for ${r.fwUp || 0} by at most ${Math.round(r.fwMax * 1000) / 10}% (the cap 15%), judgment and will 2 steps, resisting 3 steps; ` +
      `${r.nBad} faults${r.nBad ? ' (' + r.bad.join('; ') + ')' : ''}; no die drawn and the state untouched: ${r.pure ? 'yes' : 'NO'}` };
  },

  // step 6 (D-180): the knacks are the rungs' perk effects, served by A.SK2.perkRows. The rows are the release's GD.PERKS
  // rows (threshold, name, text, effects) for each of the 38 keys; and over three bot lives, month by month, A.perkSum of
  // every perk effect, A.perkOf of every key and effect and A.perksOf, for the player and for everyone with a skill at 35
  // or more (a sample of 120 a year), equal the release's reading of GD.PERKS on the same state.
  async sk6PerkSums(pg) {
    const lives = [
      { seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 16 },
      { seed: 7, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'M', startAge: 16 },
      { seed: 2024, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'F', startAge: 18 },
    ];
    const r = await pg.evaluate((lives) => {
      const out = { rows: 0, rowBad: [], sums: 0, nonzero: 0, nBad: 0, bad: [], months: 0, plays: [], served: false };
      if (!A.SK2 || !A.SK2.perkRows) return { none: true };
      const keys = Object.keys(GD.PERKS).sort();
      out.served = keys.every(k => A.perkRows(k) && A.perkRows(k) !== GD.PERKS[k]);
      for (const k of keys) {
        const a = GD.PERKS[k], b = A.perkRows(k) || [];
        out.rows += a.length;
        if (JSON.stringify(a) !== JSON.stringify(b.map(x => [x[0], x[1], x[2], x[3]]))) out.rowBad.push(k);
      }
      const fxKeys = [...new Set(keys.flatMap(k => GD.PERKS[k].flatMap(x => Object.keys(x[3]))))].sort();
      // the release's own reading (src/core/release/core/03-engine-base.js before step 6), on GD.PERKS
      const R = {
        perksOf: (p, k) => { const L = GD.PERKS[k]; if (!L) return []; const v = A.skill(p, k); return L.filter(x => v >= x[0]); },
        perkOf: (p, k, key) => { let t = 0; for (const x of R.perksOf(p, k)) if (x[3][key]) t += x[3][key]; return t; },
        perkSum: (p, key) => { let t = 0; if (!p || !p.skills) return 0; for (const k in p.skills) if (!(p.skills[k] < 35 || !GD.PERKS[k])) t += R.perkOf(p, k, key); return t; },
      };
      const cmp = p => {
        for (const key of fxKeys) {
          const a = A.perkSum(p, key), b = R.perkSum(p, key); out.sums++; if (a) out.nonzero++;
          if (a !== b) { out.nBad++; if (out.bad.length < 8) out.bad.push(`${A.S.year} ${p.id} perkSum ${key}: ${a} / ${b}`); }
        }
        for (const k of keys) {
          const a = A.perksOf(p, k).map(x => x[1]).join(), b = R.perksOf(p, k).map(x => x[1]).join();
          if (a !== b) { out.nBad++; if (out.bad.length < 8) out.bad.push(`${A.S.year} ${p.id} perksOf ${k}: ${a} / ${b}`); continue; }
          if (!a) continue;
          for (const key of fxKeys) if (A.perkOf(p, k, key) !== R.perkOf(p, k, key)) { out.nBad++; if (out.bad.length < 8) out.bad.push(`${A.S.year} ${p.id} perkOf ${k} ${key}`); }
        }
      };
      let n = 0;
      const look = () => {
        out.months++;
        const pc = A.pc(); if (pc && pc.alive) cmp(pc);
        if (n++ % 12) return;
        const ppl = Object.values(A.S.people).filter(p => p && p.alive && p !== pc && p.skills && Object.values(p.skills).some(v => v >= 35)).sort((a, b) => (a.id < b.id ? -1 : 1));
        const step = Math.max(1, Math.floor(ppl.length / 120));
        for (let i = 0; i < ppl.length; i += step) cmp(ppl[i]);
      };
      for (const o of lives) {
        T.enter(o); n = 0;
        A.onMonth.push(look);
        try { out.plays.push(T.play(4)); } finally { const i = A.onMonth.indexOf(look); if (i >= 0) A.onMonth.splice(i, 1); }
      }
      return out;
    }, lives);
    if (r.none) return { ok: false, detail: 'no A.SK2.perkRows on the page' };
    const ok = r.served && !r.rowBad.length && r.rows === 114 && r.nBad === 0 && r.months >= 100 && r.nonzero > 1000;
    return { ok, detail: `perks served from the rungs ${r.served ? 'yes' : 'NO'}; ${r.rows} rows against GD.PERKS${r.rowBad.length ? ', differing for ' + r.rowBad.join(', ') : ', every one the same'}; ` +
      `${r.months} months over three lives (${r.plays.join(', ')}): ${r.sums} perk sums compared (${r.nonzero} not zero), ${r.nBad} differ${r.nBad ? ' (' + r.bad.join('; ') + ')' : ''}` };
  },

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
        // (a save made at version 17 or later was born on the rungs: what it read is the rungs' read, H-144)
        const keep = SV.STEPS, on0 = SK2.on, born = ver0 >= 17; SV.STEPS = keep.filter(s => s[0] !== 'skills2'); if (!born) SK2.on = false;
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
          for (const c in pc.sk || {}) if (pc.sk[c].lv > 0 && top[c] !== A.SK.VALUES[pc.sk[c].lv] && !(born && E.s1LevelOfValue(top[c] + 1e-9) === E.s1LevelOfValue(A.SK.VALUES[pc.sk[c].lv] + 1e-9))) bad.push('rung of ' + c + ' reads ' + top[c] + ' for ' + A.SK.VALUES[pc.sk[c].lv]);
          const st = SK2.stale(pc); if (st.length) bad.push('stale ' + st.join(','));
          // the perks the release reads from the numbers are the perk effects the held rungs carry (§7), with their lines
          // (the rungs a top rung evolved from, gone into it: D-192)
          const want = new Set(A.perkNames(pc).map(x => x[1])), have = new Set();
          for (const id in pc.ks || {}) {
            const s = IX.BY[id], h = s.family && E.HUMAN.includes(s.rank) ? E.heldOfRung(IX, s.family, s.rank, pc.ks[id].lv)[0] : null;
            for (const j of ((h && h.id === id && h.line) || []).concat([id])) for (const b of IX.BY[j].levels) if (b.at <= (j === id ? pc.ks[id].lv : 10)) for (const e of b.effects) if (e.type === 'perk') have.add(e.name);
          }
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
