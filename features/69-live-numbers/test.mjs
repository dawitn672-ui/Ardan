// 69-live-numbers: the six numbers 49-body-mind left under the line (axe, unarmed, bow, sea, music, gambling) touch
// outcomes in a typical life, through checks and choices whose words are about them, and through work and the year.
// Every test reports what it measured.
import { BOT } from '../../bench/bot.mjs';
import { TARGETS } from '../../bench/targets.mjs';
import { COUNTER } from './counter.mjs';

const SIX = ['axe', 'unarmed', 'bow', 'sea', 'music', 'gambling', 'athletics', 'craft', 'husbandry'];
const median = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

export default {
  // the gate: in bot lives of the six balance paths, counted the way bench/dead-numbers.mjs counts, each of the nine
  // (49-body-mind's six left over, and the second pass's athletics, craft and husbandry)
  // reaches 5 outcomes in the median life (a smaller league than the bench's 24: 18 lives of up to 45 years, those that
  // last 25; a 10-life league of 40 years put the median gambling life at 3 and at 7 on two trees, so it is too small)
  async lnNineLive(pg) {
    await pg.evaluate(BOT);
    await pg.evaluate(COUNTER);
    const paths = Object.entries(TARGETS.paths).map(([name, P]) => [name, P.start]);
    const lives = await pg.evaluate(([paths]) => {
      const out = [];
      paths.forEach(([name, start], pi) => {
        // three lives a path, all four personalities across the league; a life shorter than 25 years is replaced
        for (const base of [0, 1, 2].map(j => (pi + j) % 4)) {
          for (let t = 0; t < 3; t++) {
            const i = base + t * 4, pers = ['careful', 'reckless', 'greedy', 'random'][i % 4], engaged = i % 2 === 0;
            const o = Object.assign({ seed: 5101 + i * 7919 + name.length * 131, sex: i % 2 ? 'F' : 'M' }, start);
            DN.reset(); DN.on = true;
            let L; try { L = B.life(o, pers, engaged, 45); } finally { DN.on = false; }
            if (L.years < 25) continue;
            const n = {};
            // a merged number is counted under its family, as the bench counts it (axe under Hafts, the spear's row)
            for (const k0 of ['axe', 'unarmed', 'bow', 'sea', 'music', 'gambling', 'athletics', 'craft', 'husbandry']) { const k = A.BM && A.BM.canon ? A.BM.canon(k0) : k0; n[k0] = (DN.life.decided[k] || 0) + (DN.life.gated[k] || 0) + (DN.life.engine[k] || 0); }
            out.push({ name, pers, engaged, years: L.years, n });
            break;
          }
        }
      });
      return out;
    }, [paths]);
    const fam = await pg.evaluate(() => (A.BM && A.BM.MERGE) || {});
    const rows = SIX.map(k => { const v = lives.map(l => l.n[k]); return { k: fam[k] ? `${k} (→ ${fam[k]})` : k, med: median(v), min: Math.min(...v), max: Math.max(...v), under: v.filter(x => x < 5).length }; });
    const ok = lives.length >= 15 && rows.every(r => r.med >= 5);
    return { ok, detail: `${lives.length} lives (median ${median(lives.map(l => l.years))} years); median outcomes (range, lives under 5): ` +
      rows.map(r => `${r.k} ${r.med} (${r.min}-${r.max}, ${r.under})`).join(', '), data: { lives, rows } };
  },

  // the spot-check: every retagged check and every rider, with what its words are and what it does to the odds and the
  // outcome. A retag may lower the odds of someone who never learned the skill a little (the words were always about
  // it), never by more than 16 points (a stat the words support is kept first, the skill second at 40%), and must raise them for someone who has (skill 50).
  async lnHonestOdds(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 6901, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const pc = A.pc(); A.S.queue = [];
      for (const k in GD.SKILLS) pc.skills[k] = 5;
      for (const s of GD.STATS) pc.st[s] = 40;
      const L = A.LN, rows = [];
      for (const x of L.RETAGGED) {
        const c = A.EV[x.ev].choices[x.i], d = c.check.d;
        const was = { s: x.before.s, s2: x.before.s2, d }, now = { s: c.check.s, s2: c.check.s2, d };
        const odds = ck => A.checkOdds(pc, ck);
        const u0 = odds(was), u1 = odds(now);
        const cn = k => (A.BM && A.BM.canon ? A.BM.canon(k) : k);
        for (const k of new Set([x.after.s, x.after.s2])) if (k && k !== x.before.s && k !== x.before.s2 && GD.SKILLS[k]) pc.skills[cn(k)] = 50;
        const t0 = odds(was), t1 = odds(now);
        for (const k in GD.SKILLS) pc.skills[k] = 5;
        rows.push({ ev: x.ev, i: x.i, label: L.labelOf(A.EV[x.ev], x.i), was: `${x.before.s}/${x.before.s2 || '-'}`, now: `${c.check.s}/${c.check.s2 || '-'}`, u0, u1, t0, t1, why: x.why });
      }
      const knacks = Object.entries(L.KNACK).map(([n, K]) => {
        const big = b => { const f = (b && b.fx) || {}; return Math.max(Math.abs(f.happy || 0) / 4, Math.abs(f.coin || 0) / 6, Math.abs(f.coinPct || 0) / 0.15, Math.abs(f.fame || 0), Math.abs(f.health || 0) / 4, Math.abs((f.them && f.them.op) || 0) / 4, Math.abs(f.perf || 0)); };
        return { n, k: K.k, max: Math.max(big(K.good), big(K.poor)) };
      });
      const duty = { at0: Math.round((0 - 20) * L.W * 10) / 10, at60: Math.round((60 - 20) * L.W * 10) / 10 };
      return { rows, knacks, retags: L.RETAG.length, applied: L.RETAGGED.length, rides: L.RIDE.length, ridesOn: Object.keys(L.rides).length, duty };
    });
    const bad = r.rows.filter(x => x.u0 - x.u1 > 16 || x.t1 <= x.t0);
    const badK = r.knacks.filter(k => k.max > 1);
    const ok = r.applied === r.retags && r.ridesOn === r.rides && !bad.length && !badK.length && r.duty.at0 >= -3 && r.duty.at60 <= 6;
    return { ok, detail: `${r.applied} of ${r.retags} retags applied, ${r.ridesOn} of ${r.rides} riders; odds for an untrained adult (skills 5, stats 40) before → after, and with the new skill at 50: ` +
      r.rows.map(x => `${x.ev}#${x.i} "${x.label}" ${x.was}→${x.now} ${x.u0}→${x.u1}% (trained ${x.t0}→${x.t1}%)`).join('; ') +
      `; riders within bounds (happy 4, coin 6, coin 15%, fame 1, health 4, opinion 4): ${r.knacks.length - badK.length} of ${r.knacks.length}; a trade's second skill moves the work target ${r.duty.at0} at skill 0 and +${r.duty.at60} at 60` +
      (bad.length ? `; TOO FAR: ${bad.map(x => x.ev).join(', ')}` : '') + (badK.length ? `; RIDER TOO BIG: ${badK.map(k => k.n).join(', ')}` : ''), data: r };
  },

  // a brawl is fought with fists on both sides, and the weapons are back on the belt afterwards; a robbery that turned
  // to steel keeps them
  async lnBrawlFists(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 6902, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
      const pc = A.pc(); A.S.queue = [];
      pc.gear.weapon = 'sword'; pc.skills.sword = 60; pc.skills.unarmed = 10;
      const foe = A.makeOpponent(pc, 'duel'); foe.gear = foe.gear || {}; foe.gear.weapon = 'axe';
      const D = A.startDuel(pc, foe, { kind: 'brawl', place: 'the alehouse', lethal: false, toYield: true });
      const brawl = { a: D && D.a && D.a.skillK, b: D && D.b && D.b.skillK, aSkill: D && D.a && Math.round(D.a.skill), back: pc.gear.weapon + '/' + foe.gear.weapon };
      A.S.queue = [];
      const D2 = A.startDuel(pc, foe, { kind: 'brawl', place: 'a lonely road', lethal: true, toYield: true });
      const steel = { a: D2 && D2.a && D2.a.skillK, b: D2 && D2.b && D2.b.skillK };
      A.S.queue = [];
      const D3 = A.startDuel(pc, foe, { kind: 'duel', place: 'a meadow', lethal: false, toYield: true });
      const duel = { a: D3 && D3.a && D3.a.skillK };
      A.S.queue = [];
      return { brawl, steel, duel };
    });
    const ok = r.brawl.a === 'unarmed' && r.brawl.b === 'unarmed' && r.brawl.back === 'sword/axe' && r.steel.a === 'sword' && r.steel.b === 'axe' && r.duel.a === 'sword';
    return { ok, detail: `a brawl: you fight on ${r.brawl.a} (worth skill ${r.brawl.aSkill}, not your sword 60), the foe on ${r.brawl.b}; weapons afterwards ${r.brawl.back}; a brawl gone to steel: ${r.steel.a} against ${r.steel.b}; a duel: ${r.duel.a}` };
  },

  // the work and the year: each hook moves its outcome the way its words say, measured against the same life with the
  // skill at 0 and at 60 (the same seed, so the same draws)
  async lnWorkAndYear(pg) {
    const r = await pg.evaluate(() => {
      const L = A.LN;
      const cn = k => (A.BM && A.BM.canon ? A.BM.canon(k) : k);
      const fresh = (o, k, v) => { A.newGame(Object.assign({ seed: 6903, race: 'human', sex: 'M', startAge: 25 }, o)); const pc = A.pc(); A.S.queue = []; pc.skills[cn(k)] = v; return pc; };
      // a farmer's axe: 8 years of work
      const farm = v => { const pc = fresh({ realm: 'POL-01', status: 'peasant' }, 'axe', v); pc.job = { c: 'farm', r: 1, y: 3, perf: 50, merit: 0 }; let pay = 0; for (let y = 0; y < 8; y++) { pc.skills[cn('axe')] = v; pc.coin = 100; pc.job.r = 1; A.careerYear(pc); pay += pc.coin - 100; } return { perf: Math.round(pc.job.perf), pay }; };
      const f0 = farm(0), f60 = farm(60);
      // the wake: a mother's death with music 0 and 60
      const wake = v => { const pc = fresh({ realm: 'POL-01', status: 'peasant' }, 'music', v); const m = { given: 'Agna' }; pc.happy = 60; L.wake(pc, m, 'mother'); return pc.happy - 60; };
      // the butts in Ashmere: 40 years at bow 0 and 60 (a man of Ashmere outside the custom's years)
      const butts = v => { const pc = fresh({ realm: 'POL-05', status: 'peasant' }, 'bow', v); let c = 0, f = 0; for (let y = 0; y < 40; y++) { pc.skills.bow = v; pc.coin = 50; const f0 = pc.fame || 0; L.year(pc); c += pc.coin - 50; f += (pc.fame || 0) - f0; } return { coin: c, fame: f }; };
      const b0 = butts(0), b60 = butts(60);
      // the herring boats on a coast: 40 seasons at sea 0 and 60
      const boats = v => {
        A.newGame({ seed: 6904, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        const pc = A.pc(); A.S.queue = [];
        const P = A.S.prov.find(x => x.coast && x.owner === pc.realm) || A.S.prov.find(x => x.coast);
        pc.home = P.id; pc.realm = P.owner; pc.job = null;
        let c = 0, ducked = 0;
        for (let y = 0; y < 40; y++) { pc.skills.sea = v; pc.coin = 50; pc.health = 100; L.year(pc); c += pc.coin - 50; if (pc.health < 100) ducked++; }
        return { coin: c, ducked };
      };
      const s0 = boats(0), s60 = boats(60);
      // a lord's autumn hunt: 40 years at bow 0 and 60
      const hunt = v => { const pc = fresh({ realm: 'POL-01', status: 'noble' }, 'bow', v); let f = 0; for (let y = 0; y < 40; y++) { pc.skills.bow = v; const f0 = pc.fame || 0; L.year(pc); f += (pc.fame || 0) - f0; } return f; };
      const h0 = hunt(0), h60 = hunt(60);
      // dice in winter quarters: 200 winters at gambling 0 and 60
      const camp = v => { const pc = fresh({ realm: 'POL-01', status: 'peasant' }, 'gambling', v); pc.mil = pc.mil || { rank: 0, merit: 0 }; let won = 0; for (let y = 0; y < 200; y++) { pc.skills.gambling = v; pc.coin = 300; if (L.camp(pc) > 0) won++; } return won; };
      const c0 = camp(0), c60 = camp(60);
      // a crossing by sea to a gathering: 200 crossings at sea 0 and 60
      const cross = v => {
        A.newGame({ seed: 6905, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
        const pc = A.pc(); A.S.queue = [];
        const me = pc.realm, host = Object.keys(A.S.realms).find(id => L.bySea(me, id));
        if (!host) return null;
        A.S.gath = A.S.gath || []; const g = { id: 'ln_test', host, kind: 'wedding', pc: {} }; A.S.gath.push(g);
        let sick = 0, fresh2 = 0;
        for (let i = 0; i < 200; i++) { pc.skills.sea = v; pc.health = 100; g.pc = { inf: 0 }; L.crossing(pc, { gid: 'ln_test' }); if (pc.health < 100) sick++; if (g.pc.inf > 0) fresh2++; }
        A.S.gath = A.S.gath.filter(x => x !== g);
        return { host, sick, fresh: fresh2 };
      };
      const x0 = cross(0), x60 = cross(60);
      // holdings: a cottage and a farm worked at farming 0 / 60, a workshop at craft 0 / 60, a townsfolk household
      // mending its own roof at craft 0 / 60, and a horse kept at farming 0 / 60 (the money each year, net of the release)
      const hold = (k, s, v, extra) => { A.newGame({ seed: 6908, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 }); const pc = A.pc(); A.S.queue = [];
        pc.assets = k ? [{ k }] : []; pc.gear.mount = extra || null; for (const x of ['husbandry', 'craft', 'sea', 'athletics']) pc.skills[x] = 20; pc.skills[cn(s)] = v; pc.coin = 500; pc.health = 100;
        let d = 0; for (let y = 0; y < 20; y++) d += L.holdings(pc); return d; };
      const farm2 = [hold('farm', 'husbandry', 0), hold('farm', 'husbandry', 60)], shop = [hold('workshop', 'craft', 0), hold('workshop', 'craft', 60)];
      const roof = [hold('cottage', 'craft', 0), hold('cottage', 'craft', 60)], horse = [hold(null, 'husbandry', 0, 'palfrey'), hold(null, 'husbandry', 60, 'palfrey')];
      // the season's marches: 200 seasons of a soldier at athletics 0 / 60
      const march = v => { const pc = fresh({ realm: 'POL-01', status: 'peasant' }, 'athletics', v); pc.mil = { rank: 0, merit: 0 }; let sore = 0, noted = 0; for (let y = 0; y < 200; y++) { pc.skills.athletics = v; pc.health = 100; const r = L.march(pc); if (r < 0) sore++; if (r > 0) noted++; } return { sore, noted }; };
      const m0 = march(0), m60 = march(60);
      return { f0, f60, w0: wake(0), w60: wake(60), b0, b60, s0, s60, h0, h60, c0, c60, x0, x60, farm2, shop, roof, horse, m0, m60 };
    });
    const ok = r.f60.perf > r.f0.perf && r.f60.pay > r.f0.pay && r.w60 > r.w0 && r.b60.coin > r.b0.coin && r.b60.fame > r.b0.fame &&
      r.s60.coin > r.s0.coin && r.s60.ducked <= r.s0.ducked && r.h60 > r.h0 && r.c60 > r.c0 + 10 && r.x0 && r.x60 && r.x0.sick > r.x60.sick && r.x60.fresh > r.x0.fresh &&
      r.farm2[1] > r.farm2[0] && r.shop[1] > r.shop[0] && r.roof[1] > r.roof[0] && r.horse[1] > r.horse[0] && r.m0.sore > r.m60.sore && r.m60.noted > r.m0.noted;
    return { ok, detail: `a farmer's 8 years at axe 0 / 60: work rating ${r.f0.perf} / ${r.f60.perf}, pay ${r.f0.pay} / ${r.f60.pay}; the lament at a mother's wake gives back ${r.w0} / ${r.w60} of the 25 happiness her death takes, at music 0 / 60; ` +
      `40 years at the Ashmere butts at bow 0 / 60: ${r.b0.coin} / ${r.b60.coin} suns and fame ${Math.round(r.b0.fame)} / ${Math.round(r.b60.fame)}; 40 herring seasons at sea 0 / 60: ${r.s0.coin} / ${r.s60.coin} suns, ducked ${r.s0.ducked} / ${r.s60.ducked}; ` +
      `40 autumn hunts at bow 0 / 60: fame ${Math.round(r.h0)} / ${Math.round(r.h60)}; 200 winters of camp dice at gambling 0 / 60: won ${r.c0} / ${r.c60}; ` +
      `20 years of a farm at farming 0 / 60: ${r.farm2[0]} / ${r.farm2[1]} suns over the release; a workshop at craft 0 / 60: ${r.shop[0]} / ${r.shop[1]}; a cottage mended at craft 0 / 60: ${r.roof[0]} / ${r.roof[1]}; a horse kept at farming 0 / 60: ${r.horse[0]} / ${r.horse[1]}; 200 seasons of marches at athletics 0 / 60: footsore ${r.m0.sore} / ${r.m60.sore}, noted ${r.m0.noted} / ${r.m60.noted}; ` +
      (r.x0 ? `200 crossings to ${r.x0.host} at sea 0 / 60: sick ${r.x0.sick} / ${r.x60.sick}, came ashore fresh ${r.x0.fresh} / ${r.x60.fresh}` : 'no sea route found') };
  },

  // the eleven scenes: each choice plays, no raw tokens, the text in its word limit
  async lnScenesPlay(pg) {
    const r = await pg.evaluate(() => {
      const ids = Object.keys(A.EV).filter(k => /^ln_(wedding_song|fair_ring|butts|threshing_dice|winter_wood|crossing|collared|lambing|thatch|greasy_pole)$/.test(k));
      let played = 0, raw = 0, long = 0, elig = 0; const bad = [];
      for (const id of ids) {
        A.newGame({ seed: 6906, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 25 });
        const pc = A.pc(); A.S.queue = []; pc.coin = 200;
        if (id === 'ln_crossing') { const P = A.S.prov.find(x => x.coast && x.owner === pc.realm) || A.S.prov.find(x => x.coast); pc.home = P.id; pc.realm = P.owner; }
        if (A.EV[id].cond(pc, A.C)) elig++;
        for (let i = 0; i < A.EV[id].choices.length; i++) {
          A.S.queue = [{ type: 'event', ev: id, ctx: {} }];
          const v = A.eventView(A.S.queue[0]);
          if (T.raw.test(v.text) || v.choices.some(c => T.raw.test(c.t))) { raw++; bad.push(id); }
          if ((String(v.text).match(/\S+/g) || []).length > 80) long++;
          const vi = v.choices.findIndex(c => c.i === i);
          if (vi < 0) continue;
          A.eventChoose(vi);
          const q = A.S.queue[0];
          if (q && q.result) { played++; if (T.raw.test(q.result.text)) { raw++; bad.push(id + '#' + i); } }
          A.S.queue = [];
        }
      }
      // the tables after supper: a scene of the gathering pool, played inside a gathering, and it moves the gathering on
      let tables = 0, onward = 0;
      for (let i = 0; i < 3; i++) {
        A.newGame({ seed: 6906, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
        const pc = A.pc(); A.S.queue = []; pc.coin = 500;
        const host = Object.keys(A.S.realms).find(r => r !== pc.realm && A.realm(r) && A.realm(r).alive);
        A.S.gath = (A.S.gath || []).concat([{ id: 'ln_t', host, kind: 'wedding', guests: [host], at: A.absDay(), pc: { role: 'noble', seen: [], sc: 0, inf: 0 } }]);
        A.S.queue = [{ type: 'event', ev: 'ln_tables', forced: true, ctx: { gid: 'ln_t' } }];
        const v = A.eventView(A.S.queue[0]);
        if (v.skip || T.raw.test(v.text)) { raw++; bad.push('ln_tables view'); continue; }
        const vi = v.choices.findIndex(c => c.i === i); if (vi < 0) continue;
        A.eventChoose(vi);
        const q = A.S.queue[0];
        if (q && q.result) { tables++; if (q.after) onward++; if (T.raw.test(q.result.text)) { raw++; bad.push('ln_tables#' + i); } }
        A.S.queue = [];
      }
      return { n: ids.length, elig, played, raw, long, bad, tables, onward };
    });
    const ok = r.n === 10 && r.elig === 10 && r.played >= 30 && r.tables === 3 && r.onward === 3 && !r.raw && !r.long;
    return { ok, detail: `${r.n} scenes, ${r.elig} eligible for a 25-year-old peasant (on the coast for the crossing), ${r.played} choices played, ${r.raw} raw tokens${r.bad.length ? ' ' + r.bad.join(',') : ''}, ${r.long} texts over 80 words; the tables after supper played ${r.tables} of 3 inside a gathering, ${r.onward} moved it on to its next scene` };
  },

  // drawing the game (every tab, a job card with the second skill, a scene) changes neither A.S nor the random stream
  async lnRenderPure(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 6907, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const pc = A.pc(); A.S.queue = [{ type: 'event', ev: 'ln_wedding_song', ctx: {} }];
      pc.job = { c: 'farm', r: 1, y: 3, perf: 50, merit: 0, since: A.absDay() - 400, rep: 30 };
      A.eventView(A.S.queue[0]);   // the scene's first view is the engine's (its setup may draw); drawing it again is not
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S), r0 = A.rngState;
      T.renderAll();
      const html = document.body.innerHTML;
      return { pure: JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0 && A.rngState === r0, desc: /Second skill: Hafts/.test(GD.CAREERS.farm.desc), scene: /song for the bride|A song for the bride/i.test(html) };
    });
    return { ok: r.pure && r.desc, detail: `render pure ${r.pure}; the farm's description names its second skill ${r.desc}; the scene drawn ${r.scene}` };
  },
};
