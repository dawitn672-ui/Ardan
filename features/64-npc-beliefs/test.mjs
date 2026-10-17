// NPC beliefs: people hold beliefs of their own that can be false (about you, about each other, about battles and
// beasts); the far and the hostile believe worse; opinion follows belief; corrections travel the same roads as
// rumours; courts' beliefs weigh on realm opinion; your own knowledge can be wrong. Pure to draw, deterministic, saved.
import { BOT } from '../../bench/bot.mjs';

const SETUP = () => {
  window.NBT = {
    adult(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 34 }, o || {}));
      const pc = A.pc(); pc.coin = 400; pc.honor = 60; A.S.queue = [];
      A.NPCB.st(); A.S.npcb.y = A.S.year;      // the yearly step has run for this year
      return pc;
    },
    // a grown person who knows nobody, with the traits asked for, living where asked
    person(pc, o) {
      o = o || {};
      const keep = A.CIRCLES ? A.CIRCLES.TIE : null; if (A.CIRCLES) A.CIRCLES.TIE = 0;
      try {
        const p = A.makeAcquaintance(pc, 'acquaint'); p.born = A.S.year - 35; p.rel = p.rel || {}; p.health = 100;
        p.traits = (o.traits || []).slice(); p.sex = o.sex || 'M'; p.home = o.home != null ? o.home : pc.home; p.realm = o.realm || pc.realm;
        if (o.occ) p.occ = o.occ;
        for (const id of Object.keys(pc.rel)) if (id === String(p.id)) delete pc.rel[id];
        delete p.rel[pc.id];
        return p;
      } finally { if (A.CIRCLES) A.CIRCLES.TIE = keep; }
    },
    know(pc, t, op) { A.link(pc, t, 'acquaint', op || 0, 'acquaint'); pc.rel[t.id].op = op || 0; t.rel[pc.id].op = op || 0; return t; },
    friends(a, b) { A.link(a, b, 'friend', 60, 'friend'); a.rel[b.id].op = 60; b.rel[a.id].op = 60; },
    // a province of the realm other than home, a neighbouring realm and its province, a far realm and its province
    places(pc) {
      const S = A.S, own = S.prov.find(P => P.owner === pc.realm && P.id !== pc.home);
      const nb = (A.neighbors(pc.realm) || []).find(r => A.realm(r) && A.realm(r).alive);
      const nbs = new Set(A.neighbors(pc.realm) || []);
      const far = Object.keys(S.realms).find(r => S.realms[r].alive && r !== pc.realm && !nbs.has(r) && S.prov.some(P => P.owner === r));
      return { home: pc.home, own: own.id, nb, nbProv: S.prov.find(P => P.owner === nb).id, far, farProv: S.prov.find(P => P.owner === far).id };
    },
    choose(ev, ctx, idx, win) {
      A.S.queue = [{ type: 'event', ev, ctx: Object.assign({}, ctx), forced: true }];
      const q = A.S.queue[0], v = A.eventView(q);
      if (v.skip) return { skip: true, view: v };
      const vi = v.choices.findIndex(c => c.i === idx);
      if (vi < 0) return { missing: true, view: v };
      const ch = A.chance; if (win != null) A.chance = () => win;
      try { A.eventChoose(vi); } finally { A.chance = ch; }
      const res = q.result; A.eventClose();
      return { view: v, text: res && res.text, success: res && res.success, ctx: q.ctx };
    },
    words: s => (String(s || '').match(/\S+/g) || []).length,
    // everything the feature keeps, for comparing two runs
    state() { const out = { npcb: A.S.npcb || null, nb: {}, nbk: {} }; for (const id of Object.keys(A.S.people).sort()) { const p = A.S.people[id]; if (p.nb) out.nb[id] = p.nb; if (p.nbk) out.nbk[id] = p.nbk; } return out; },
  };
};

export default {
  async nbDistance(pg) {
    // a deed of yours as people believe it: the truth near home, the tale further off; the trusting and the hostile
    // believe worse
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6401); pc.fame = 30;
      const P = NBT.places(pc);
      const groups = { home: [], realm: [], neighbour: [], far: [], trusting: [], hostile: [] };
      for (let i = 0; i < 70; i++) {
        groups.home.push(NBT.know(pc, NBT.person(pc, { home: P.home }), 10));
        groups.realm.push(NBT.know(pc, NBT.person(pc, { home: P.own }), 10));
        groups.neighbour.push(NBT.know(pc, NBT.person(pc, { home: P.nbProv, realm: P.nb }), 10));
        groups.far.push(NBT.know(pc, NBT.person(pc, { home: P.farProv, realm: P.far }), 10));
        groups.trusting.push(NBT.know(pc, NBT.person(pc, { home: P.home, traits: ['trusting'] }), 10));
        groups.hostile.push(NBT.know(pc, NBT.person(pc, { home: P.home }), -45));
      }
      const web = Object.values(groups).flat();
      const deeds = ['Carried an old woman out of a burning house', 'Fought off 3 robbers alone', 'Won the tournament at Ashford', 'Pulled a drowning boy out of the river'];
      const ids = deeds.map((d, i) => NB.rumourDeed(pc, d, A.S.year - i, web));
      const out = {};
      for (const k in groups) {
        let heard = 0, fals = 0, tale = 0, twist = 0;
        for (const h of groups[k]) for (const x of ids) { const st = NB.held(h, x.D) ? x.D : NB.held(h, x.T) ? x.T : NB.held(h, x.W) ? x.W : null; if (!st) continue; heard++; if (st !== x.D) fals++; if (st === x.T) tale++; if (st === x.W) twist++; }
        out[k] = { heard, pct: Math.round(100 * fals / Math.max(1, heard)), tale, twist };
      }
      return out;
    });
    const d = ['home', 'realm', 'neighbour', 'far'].map(k => r[k].pct);
    const ok = d[0] < d[1] && d[1] < d[2] && d[2] <= d[3] + 5 && d[3] >= 50 && d[0] <= 25 && r.trusting.pct > r.home.pct && r.hostile.pct > r.home.pct && r.hostile.twist > r.home.twist &&
      r.home.heard > r.far.heard;
    return { ok, detail: `false share of a deed as believed: same town ${r.home.pct}% (${r.home.heard} heard), same realm ${r.realm.pct}% (${r.realm.heard}), a neighbour ${r.neighbour.pct}% (${r.neighbour.heard}), further ${r.far.pct}% (${r.far.heard}); ` +
      `the trusting at home ${r.trusting.pct}%, the hostile at home ${r.hostile.pct}% (${r.hostile.twist} believe the twist, against ${r.home.twist})` };
  },

  async nbOpinionFollowsBelief(pg) {
    // what they believe moves what they feel: the tale more than the truth, a false killing as much as a real one;
    // a correction takes it back; a stranger who believes the tale starts out warmer
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6402);
      const mk = () => NBT.know(pc, NBT.person(pc), 0);
      const a = mk(), b = mk(), c = mk(), d = mk(), e = NBT.person(pc);
      const ids = NB.rumourDeed(pc, 'Carried an old woman out of a burning house', A.S.year, []);
      NB.adopt(a, ids.D, 1); NB.adopt(b, ids.T, 1); NB.adopt(c, ids.W, 1);
      // d's brother died of a fever; d believes you killed him
      const bro = NBT.person(pc); A.link(d, bro, 'sibling', 60, 'sibling'); A.link(pc, bro, 'acquaint', -30, 'acquaint');
      const K = NB.make('K', pc.id, bro.id, 0, -10, bro.given);
      NB.adopt(d, K, 1);
      const op = t => Math.round(t.rel[pc.id].op), mine = t => Math.round(pc.rel[t.id].op);
      const before = { truth: op(a), tale: op(b), twist: op(c), kill: op(d), shown: mine(b) };
      // b is set right: the tale goes, the deed stays
      A.S.queue = [{ type: 'event', ev: 'nb_praised', ctx: { pid: b.id, cid: ids.T } }];
      NB.FX.fix(pc, 0, { pid: b.id, cid: ids.T });
      const corrected = op(b);
      NB.adopt(d, K, -1); const cleared = op(d);
      // a first meeting with someone who already believes the tale
      NB.adopt(e, ids.T, 1);
      A.link(pc, e, 'acquaint', 0, 'acquaint');
      return Object.assign(before, { corrected, cleared, meet: Math.round(pc.rel[e.id].op) });
    });
    const ok = r.tale > r.truth && r.truth > 0 && r.twist < 0 && r.kill <= -12 && r.shown === r.tale && r.corrected === r.truth && r.cleared === 0 && r.meet === r.tale;
    return { ok, detail: `opinion of you, from 0: believes the deed ${r.truth}, the tale ${r.tale} (shown in the person view as ${r.shown}), the twist ${r.twist}, a false killing of his brother ${r.kill}; ` +
      `the tale corrected ${r.corrected}; the killing cleared ${r.cleared}; a stranger who believes the tale meets you at ${r.meet}` };
  },

  async nbCorrectionsSpread(pg) {
    // a circle that believes you killed someone: with nobody to set it right only chance clears it; set one of them
    // right and the correction goes round the circle
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      // chance (a false belief about a neighbour seen through, A.NPCB.LEAK) is switched off, except in 'leak'
      const NB = A.NPCB, out = { ctl: 0, fix: 0, pub: 0, leak: 0, n: 0 }, LEAK = NB.LEAK;
      for (const seed of [6410, 6411, 6412]) for (const mode of ['ctl', 'fix', 'pub', 'leak']) {
        NB.LEAK = mode === 'leak' ? LEAK : 0;
        const pc = NBT.adult(seed), ring = [];
        for (let i = 0; i < 12; i++) ring.push(NBT.know(pc, NBT.person(pc), 10));
        for (const x of ring) for (const y of ring) if (x !== y && !x.rel[y.id]) NBT.friends(x, y);
        const v = NBT.person(pc), K = NB.make('K', pc.id, v.id, 0, -10, 'Odo Marsh');
        for (const x of ring) NB.adopt(x, K, 1);
        if (mode === 'fix') NB.FX.fix(pc, 0, { pid: ring[0].id, cid: K });
        if (mode === 'pub') { A.S.queue = []; NB.FX.fixAll(pc, 0.5, { cid: K }); }
        for (let y = 0; y < 8; y++) NB.spreadYear(pc, ring);
        out[mode] += ring.filter(x => NB.held(x, K) === -1).length;
        if (mode === 'ctl') out.n += ring.length;
      }
      NB.LEAK = LEAK; out.leakPct = Math.round(LEAK * 100);
      return out;
    });
    const ok = r.ctl === 0 && r.fix >= 9 && r.pub > r.fix;
    return { ok, detail: `after 8 years, of ${r.n} people (three circles of 12) who believed a false killing: ${r.ctl} cleared with nobody to set them right; ${r.fix} when one of each circle was set right (3 at the start); ${r.pub} after a public answer; ${r.leak} by chance alone, the truth seen through (${r.leakPct}% a year)` };
  },

  async nbEveryScene(pg) {
    // each scene staged with what it needs, every choice taken: no raw token, within the word diet, and the effects
    // that matter land
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, out = { scenes: 0, choices: 0, raw: [], long: [], checks: {} };
      const pc = NBT.adult(6403, { status: 'noble' });
      const P = NBT.places(pc);
      const t = NBT.know(pc, NBT.person(pc, { traits: ['trusting'] }), 20), u = NBT.know(pc, NBT.person(pc), 10), o = NBT.know(pc, NBT.person(pc), 10);
      const foe = NBT.know(pc, NBT.person(pc), -50); pc.rel[foe.id].type = 'enemy'; A.link(t, foe, 'acquaint', 0, 'acquaint');
      NBT.friends(t, u);
      const ids = NB.rumourDeed(pc, 'Carried an old woman out of a burning house', A.S.year - 2, []);
      const L = NB.make('L', pc.id, null, 0, -8, 'that you cheat on your weights');
      const Kf = NB.make('K', pc.id, o.id, 0, -10, 'Aldo Brenn');
      const So = NB.make('S', o.id, 'heresy', 0, -8);        // a false heresy of o
      const Su = NB.make('S', u.id, 'crime', 0, -12);
      // a parent with a tale told of them
      const par = NBT.person(pc); par.sex = 'F'; pc.parents = [par.id];
      const PD = NB.make('D', par.id, null, 1, 6, 'Drove the wolves off the upper pasture', A.S.year - 30), PT = NB.make('T', par.id, null, 0, 10, PD, A.S.year - 30);
      // a battle of the player's own realm, in the world record, and the winners' inflated account of it
      let B = null;
      if (A.WC && A.WC.put) { const i = A.WC.put('battle', { p: pc.home, a: pc.realm, b: P.nb, w: [], n: 30000, x: [4000, 3, ''] }); B = NB.battleClaim(i, 'V'); }
      // a far battle whose count ran high in the telling, for the scene in which you find out
      const iFar = A.WC && A.WC.put ? A.WC.put('battle', { p: P.farProv, a: P.far, b: (A.neighbors(P.far) || [])[0] || P.far, w: [], n: 40000, x: [6000, 2, ''] }) : null;
      // a court story about a neighbour's ruler
      const nr = A.realm(P.nb), CS = NB.make('S', nr.ruler, 'oath', 0, -10); NB.courtAdopt(pc.realm, CS, 1);
      const base = A.serialize();
      const ID = { t: t.id, u: u.id, o: o.id, foe: foe.id };
      const stage0 = {
        nb_accused: P => { NB.adopt(P.t, Kf, 1); return { pid: P.t.id }; },
        nb_praised: P => { NB.adopt(P.t, ids.T, 1); return { pid: P.t.id }; },
        nb_cleared: P => ({ pid: P.t.id, cid: L }),
        nb_slander_spread: P => { NB.adopt(P.t, L, 1); NB.adopt(P.u, L, 1); return {}; },
        nb_tale_outgrows: P => { NB.adopt(P.t, ids.T, 1); NB.adopt(P.u, ids.T, 1); return {}; },
        nb_parent_tale: P => { NB.adopt(P.t, PT, 1); return {}; },
        nb_gossip: P => { NB.adopt(P.t, So, 1); return { pid: P.t.id }; },
        nb_truth_out: P => { NB.pcState(P.pc)[So] = [1, t.id, A.S.year - 3]; return { cid: So }; },
        nb_lie_back: P => ({ pid: P.foe.id, cid: NB.make('S', P.foe.id, 'crime', 0, -12) }),
        nb_tell: P => { NB.adopt(P.t, Kf, 1); NB.adopt(P.t, Su, 1); NB.pcState(P.pc)[Su] = [-2, null, A.S.year]; return { pid: P.t.id }; },
        nb_battle_tale: P => { if (B) NB.adopt(P.t, B, 1); return {}; },
        nb_beast_wrong: P => {
          const home = NB.homeTerr(P.t), c = LORE.creatures.find(c => A.BT.terrsOf(c).some(x => home.includes(x)) && NB.beastLvl(P.t, c.id) >= 1 && NB.beastLvl(P.t, c.id) <= 2);
          if (c) A.BT.learn(P.pc, c.id, 3); return {};
        },
        nb_beast_right: P => {
          const home = NB.homeTerr(P.t), c = LORE.creatures.find(c => A.BT.terrsOf(c).some(x => home.includes(x)) && A.BT.level(P.pc, c.id) === 1);
          if (c) NB.adopt(P.t, NB.make('Z', null, c.id, 1, 0), 1); return {};
        },
        nb_court_word: P => ({}),
        nb_avenge: P => { NB.adopt(P.t, NB.make('K', P.o.id, P.u.id, 0, -10, P.u.given), 1); return { pid: P.t.id }; },
        nb_record_wrong: P => { const c = NB.battleClaim(iFar, 'F'); NB.pcState(P.pc)[c] = [1, P.pc.realm, A.S.year - 2]; return { cid: c }; },
      };
      // after each reload the people are new objects: the stage works on them, found by id
      const stage = {};
      for (const k of Object.keys(stage0)) stage[k] = () => { const P = { t: A.P(ID.t), u: A.P(ID.u), o: A.P(ID.o), foe: A.P(ID.foe), pc: A.pc() }; return stage0[k](P); };
      for (const ev of Object.keys(stage)) {
        const E = A.EV[ev]; if (!E) { out.raw.push(ev + ': missing'); continue; }
        let seen = false;
        for (let i = 0; i < E.choices.length; i++) for (const win of E.choices[i].check ? [1, 0] : [1]) {   // every roll in the choice goes its way
          A.deserialize(JSON.parse(base));
          const ctx = stage[ev]();
          const p = A.pc(); if (!E.trigger && !E.cond(p, A.C)) { out.raw.push(ev + ': cond false'); continue; }
          const res = NBT.choose(ev, ctx, i, win);
          if (res.skip) { out.raw.push(ev + ': skipped'); continue; }
          if (res.missing) continue;
          if (!seen) {
            seen = true; out.scenes++;
            const all = [res.view.title, res.view.text, ...res.view.choices.map(c => c.t)].join(' | ');
            if (T.raw.test(all)) out.raw.push(ev + ': ' + all.match(T.raw)[0]);
            if (NBT.words(res.view.text) > 80) out.long.push(ev + ' ' + NBT.words(res.view.text));
            for (const c of res.view.choices) if (NBT.words(c.t) > 12) out.long.push(ev + ' label');
          }
          out.choices++;
          if (T.raw.test(res.text || '')) out.raw.push(ev + ' result: ' + res.text);
          const q = A.pc();
          // the effects that matter
          if (ev === 'nb_accused' && i === 0 && win === 1) out.checks.accusedCleared = NB.held(A.P(t.id), Kf) === -1;
          if (ev === 'nb_gossip' && i === 0) out.checks.believed = NB.pcHeld(q, So) === 1 && (A.S.sched || []).some(x => x.item && x.item.ev === 'nb_truth_out');
          if (ev === 'nb_truth_out' && i === 2) out.checks.wasWrong = NB.pcHeld(q, So) === -2 && q.flags.nb_was_wrong === A.S.year;
          if (ev === 'nb_tell' && i === 2 && win === 1) out.checks.lie = NB.beliefs(A.P(t.id)).some(x => x.c.k === 'S' && x.c.s === foe.id) && q.flags.nb_lied === A.S.year;
          if (ev === 'nb_tell' && i === 1) out.checks.toldTruth = NB.held(A.P(t.id), Su) === -1;
          if (ev === 'nb_court_word' && i === 0 && win === 1) out.checks.probe = NB.pcHeld(q, CS) === -2 && A.S.npcb.ct[pc.realm][CS] === -1;
          if (ev === 'nb_praised' && i === 2) out.checks.embellished = q.flags.nb_embellished === A.S.year && NB.beliefs(A.P(u.id)).some(x => x.c.k === 'T');
          if (ev === 'nb_battle_tale' && i === 0) out.checks.battleTruth = NB.beliefs(A.P(t.id)).some(x => x.c.k === 'B' && x.c.t);
          if (ev === 'nb_beast_wrong' && i === 0) out.checks.beastTaught = NB.beliefs(A.P(res.ctx.pid)).some(x => x.c.k === 'Z');
          if (ev === 'nb_avenge' && i === 2) out.checks.warned = A.P(t.id).nbRv === A.S.year && A.P(o.id).alive;
          if (ev === 'nb_record_wrong' && i === 0) out.checks.recordFixed = Object.keys(q.nbk || {}).some(id => q.nbk[id][0] === -2 && NB.claim(id) && NB.claim(id).k === 'B');
        }
      }
      out.events = Object.keys(stage).length;
      return out;
    });
    const want = ['accusedCleared', 'believed', 'wasWrong', 'lie', 'toldTruth', 'probe', 'embellished', 'battleTruth', 'beastTaught', 'warned', 'recordFixed'];
    const ok = r.scenes === r.events && !r.raw.length && !r.long.length && want.every(k => r.checks[k]);
    return { ok, detail: `${r.scenes} of ${r.events} scenes, ${r.choices} choices taken; raw ${r.raw.slice(0, 3).join('; ') || 'none'}; over the diet ${r.long.join(', ') || 'none'}; ${want.map(k => k + ' ' + !!r.checks[k]).join(', ')}` };
  },

  async nbPersonView(pg) {
    // the person view: what they believe about you and what they say of others, marked only where you know the truth;
    // what you have heard of them; escaped; drawing it changes nothing
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6404);
      const t = NBT.know(pc, NBT.person(pc, { sex: 'F' }), 10), o = NBT.know(pc, NBT.person(pc), 10), w = NBT.know(pc, NBT.person(pc), 10);
      o.given = 'Odo<img src=x>';
      const ids = NB.rumourDeed(pc, 'Carried an old woman out of a burning house', A.S.year, []);
      NB.adopt(t, ids.D, 1); NB.adopt(t, ids.T, 1);
      const S1 = NB.make('S', o.id, 'heresy', 0, -8), S2 = NB.make('S', w.id, 'debt', 0, -5);
      NB.adopt(t, S1, 1); NB.adopt(t, S2, 1);
      NB.pcState(pc)[S1] = [-2, null, A.S.year];               // you know Odo's heresy is a lie
      const S3 = NB.make('S', t.id, 'affair', 0, -6); NB.pcState(pc)[S3] = [1, o.id, A.S.year];   // you believe a lie about her
      UI.screen = 'game'; UI.tab = 'life'; UI.render();
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S);
      A.S.queue = []; UI.A.ov('person:' + t.id);
      const m = document.getElementById('modal'), html = m ? m.innerHTML : '', text = m ? m.textContent : '';
      const pure = JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0;
      UI.ov = null; UI.render();
      return { pure, about: text.includes('What she believes about you'), others: text.includes('What she says of others'), heard: text.includes('What you have heard of her'),
        deedTrue: /burning house\.\s*true/.test(text), taleFalse: /burning house[^.]*\.\s*false/.test(text.replace(/burning house\.\s*true/, '')),
        odoFalse: /laughs at the faith\.\s*false/.test(text), debtUnmarked: /can ever pay\.(?!\s*(true|false))/.test(text), believeIt: text.includes('(you believe it)'),
        escaped: !html.includes('<img src=x>') && html.includes('Odo&lt;img') };
    });
    const ok = r.pure && r.about && r.others && r.heard && r.deedTrue && r.taleFalse && r.odoFalse && r.debtUnmarked && r.believeIt && r.escaped;
    return { ok, detail: JSON.stringify(r) };
  },

  async nbCourtWeighs(pg) {
    // a court that believes the neighbour's ruler broke his oath and has blood on his hands thinks less of that realm,
    // and its odds of war a month rise; switched off, nothing changes
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB; NBT.adult(6405, { realm: 'POL-05' });
      const live = Object.values(A.S.realms).filter(x => x.alive && !x.isRebel && x.id !== A.pc().realm);
      const pairs = [];
      for (const x of live) for (const n of A.neighbors(x.id).map(A.realm)) if (n && n.alive && !n.isRebel && n.id !== A.pc().realm && A.realmProvs(x.id).length >= 3) pairs.push([x, n]);
      let a = null, b = null;
      const odds = on => {
        NB.AI_ON = on;
        const S = A.S, keep = { wars: S.wars, chance: A.chance, preview: A.warPreview, shuffle: A.shuffle, rest: a.aiLastWar, ex: a.exhaustion, st: a.stability, tr: Object.assign({}, a.truce || {}) };
        S.wars = []; a.aiLastWar = null; a.exhaustion = 0; a.stability = 80; a.truce = {};
        let pair = null, p = null;
        A.shuffle = L => L.slice().sort((x, y) => (x === a.id || x === b.id || (x && x.id === a.id) ? -1 : 0) - (y === a.id || y === b.id || (y && y.id === a.id) ? -1 : 0));
        A.warPreview = function (x, y) { pair = x + '>' + y; return keep.preview.apply(this, arguments); };
        A.chance = q => { if (pair === a.id + '>' + b.id && p == null) p = q; return false; };
        try { A.aiWarCheck(); } finally { S.wars = keep.wars; A.chance = keep.chance; A.warPreview = keep.preview; A.shuffle = keep.shuffle; a.aiLastWar = keep.rest; a.exhaustion = keep.ex; a.stability = keep.st; a.truce = keep.tr; NB.AI_ON = true; }
        return p;
      };
      // a pair whose ruler would weigh a war at all this month (some builds rule most pairs out first)
      for (const [x, y] of pairs.slice(0, 40)) { a = x; b = y; A.setRelPair(a.id, b.id, -20); if (odds(true) > 0) break; }
      const pOff0 = odds(true);
      const s1 = NB.make('S', b.ruler, 'oath', 0, -10), s2 = NB.make('S', b.ruler, 'crime', 0, -12);
      NB.courtAdopt(a.id, s1, 1); NB.courtAdopt(a.id, s2, 1);
      const relOn = A.relBetween(a.id, b.id); NB.AI_ON = false; const relOff = A.relBetween(a.id, b.id); NB.AI_ON = true;
      const pOn = odds(true), pOff = odds(false);
      const parts = A.opinionParts(a.id, b.id).map(x => x[0] + ' ' + x[1]).filter(x => /Talk at court/.test(x));
      // the court sees through it: the weight goes
      A.S.npcb.ct[a.id][s1] = -1; A.S.npcb.ct[a.id][s2] = -1;
      const relFixed = A.relBetween(a.id, b.id);
      return { a: a.short, b: b.short, view: NB.courtView(a.id, b.id), relOn, relOff, relFixed, pOn, pOff, pOff0, parts };
    });
    const ok = r.relOn === r.relOff - 6 && r.relFixed === r.relOff && r.pOn != null && r.pOff != null && r.pOn > r.pOff && r.parts.length === 1;
    return { ok, detail: `${r.a}'s court believes two stories of ${r.b}'s ruler: opinion ${r.relOff} → ${r.relOn} (capped at ${-6}); odds of war a month ${r.pOff && r.pOff.toFixed(4)} → ${r.pOn && r.pOn.toFixed(4)}; tooltip "${r.parts[0]}"; once the court sees through them, ${r.relFixed}` };
  },

  async nbBattlesAndBeasts(pg) {
    // a battle as each side tells it: the winners count high, the losers may claim the field, the far hear it inflated;
    // you know the truth of your own realm's battles. A hunter of the hills knows its beasts better than a scribe.
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6406), P = NBT.places(pc), out = {};
      if (!A.WC || !A.WC.put) return { skip: true };
      const web = [];
      const side = { win: [], lose: [], far: [] };
      for (let i = 0; i < 30; i++) {
        side.win.push(NBT.know(pc, NBT.person(pc, { home: P.home }), 10));
        side.lose.push(NBT.know(pc, NBT.person(pc, { home: P.nbProv, realm: P.nb }), 10));
        side.far.push(NBT.know(pc, NBT.person(pc, { home: P.farProv, realm: P.far }), 10));
      }
      web.push(...side.win, ...side.lose, ...side.far);
      A.NPCB.st().wi = A.S.wrec.e.length;
      const ents = [];
      for (let k = 0; k < 6; k++) ents.push(A.WC.put('battle', { p: pc.home, a: pc.realm, b: P.nb, w: [], n: 30000 + k, x: [4000 + k * 300, 3, ''] }));
      NB.seedBattles(pc, web);
      for (const s in side) {
        let n = 0, f = 0, flip = 0, hi = 0;
        for (const h of side[s]) for (const x of NB.beliefs(h)) if (x.c.k === 'B') { n++; if (NB.isFalse(x.c, x.st)) f++; if (x.c.s !== pc.realm) flip++; const e = A.WC.ent(x.c.o); if (x.c.x[0] > e.x[0] * 1.25) hi++; }
        out[s] = { n, pct: Math.round(100 * f / Math.max(1, n)), flip, hi };
      }
      out.court = NB.court(pc.realm).filter(x => x.c.k === 'B').length;
      out.knows = NB.pcKnows(pc, NB.claim(NB.battleClaim(ents[0], 'V')));
      // beasts
      const hills = A.S.prov.find(P => P.terr === 'hills' || P.terr === 'mountains') || A.S.prov[pc.home];
      const beasts = LORE.creatures.filter(c => A.BT.terrsOf(c).includes(hills.terr));
      const count = occ => { let k = 0, s = 0; for (let i = 0; i < 40; i++) { const t = NBT.person(pc, { home: hills.id, occ }); for (const c of beasts) { const l = NB.beastLvl(t, c.id); if (l >= 3) k++; if (l >= 2) s++; } } return { k, s }; };
      out.hunter = count('hunter'); out.scribe = count('scribe'); out.beasts = beasts.length; out.terr = hills.terr;
      // the line in the person view: pure
      const t = NBT.know(pc, NBT.person(pc, { home: pc.home, occ: 'hunter' }), 10);
      const h0 = T.hash(A.S), line = NB.beastLine(pc, t);
      out.line = line.replace(/<[^>]+>/g, '').slice(0, 120); out.pure = T.hash(A.S) === h0;
      return out;
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const ok = r.win.pct >= 50 && r.lose.flip > 0 && r.far.hi > 0 && r.win.n > 0 && r.lose.n > 0 && r.court >= 1 && r.knows === true && r.hunter.k > r.scribe.k && r.hunter.s > r.scribe.s && r.pure && r.line.length > 10;
    return { ok, detail: `six battles your realm won: the winners' people believe a false account ${r.win.pct}% (${r.win.n} beliefs), the losers' ${r.lose.pct}% (${r.lose.flip} of ${r.lose.n} claim they won), the far ${r.far.pct}% (${r.far.hi} with the count run high); ` +
      `your court holds ${r.court}; you know the truth ${r.knows}. Of ${r.beasts} beasts of the ${r.terr}, 40 hunters know the truth of ${r.hunter.k} and have seen ${r.hunter.s}; 40 scribes ${r.scribe.k} and ${r.scribe.s}. "${r.line}"; pure ${r.pure}` };
  },

  async nbDeterminism(pg) {
    // the same seed makes the same beliefs, whether or not the screens are drawn along the way; a save carries them;
    // an old save without them loads and plays
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const run = draw => {
        A.newGame({ seed: 6407, race: 'human', realm: 'POL-03', status: 'merchant', sex: 'M', startAge: 22 });
        UI.screen = 'game';
        T.play(14, { each: draw ? () => { const pc = A.pc(); UI.tab = 'life'; UI.render(); for (const id of Object.keys(pc.rel).slice(0, 4)) { UI.A.ov('person:' + id); } UI.ov = null; UI.render(); } : null });
        return T.hash(NBT.state());
      };
      const a = run(false), b = run(true);
      const st = NBT.state(), held = Object.keys(st.nb).length, claims = Object.keys((st.npcb || {}).c || {}).length;
      // a save round trip
      const save = A.serialize(); A.deserialize(JSON.parse(save));
      const c = T.hash(NBT.state());
      // an old save: none of it (from a young life, so the 14 years above can't have ended it)
      for (let sd = 6407; sd < 6427; sd++) { A.newGame({ seed: sd, race: 'human', realm: 'POL-03', status: 'merchant', sex: 'M', startAge: 22 }); T.play(2); if (A.pc() && A.pc().alive) break; }
      const o = JSON.parse(A.serialize());
      const strip = x => { if (!x || typeof x !== 'object') return; delete x.npcb; for (const id in x.people || {}) { delete x.people[id].nb; delete x.people[id].nbk; } };
      strip(o.S || o); strip(o);
      A.deserialize(o);
      const missing = !A.S.npcb && !Object.values(A.S.people).some(p => p.nb);
      // the loaded life must live long enough to play (a shifted random stream can bring its death within the 3 years)
      const pc0 = A.pc(); if (pc0) { pc0.health = 100; pc0.wounds = []; }
      const res = T.play(3);
      return { a, b, c, held, claims, missing, res, after: !!A.S.npcb, alive: !!A.pc() };
    });
    const ok = r.a === r.b && r.a === r.c && r.held > 0 && r.claims > 0 && r.missing && r.after;
    return { ok, detail: `14 years twice: ${r.a === r.b ? 'the same' : 'different'} beliefs with and without drawing the screens (${r.held} people hold ${r.claims} claims); after a save round trip ${r.a === r.c ? 'the same' : 'different'}; an old save without them loads and plays 3 years (${r.res}), state rebuilt ${r.after}` };
  },

  async nbInRealLives(pg) {
    // bot lives in the build: people hold beliefs, some false; scenes come; every life of 15 years or more meets belief
    // against truth in play (a belief scene, or finding out it was wrong); the state stays small. A life cut short on a
    // shifted random stream is replaced by the next seed, up to three lives of 15 years or more.
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB; NB.resetStats();
      let scenes = 0, fScenes = 0, years = 0, held = 0, fals = 0, ownBytes = 0, shared = 0, people = 0, save = 0, lives = 0, long = 0, met = 0;
      const ch = A.eventChoose; let mine = 0;
      A.eventChoose = function () { const q = A.S.queue[0]; if (q && q.type === 'event' && !q.result && /^nb_/.test(q.ev)) { scenes++; mine++; if (q.ctx && q.ctx.nbFalse) fScenes++; } return ch.apply(this, arguments); };
      const starts = [{ race: 'human', realm: 'POL-01', status: 'artisan' }, { race: 'human', realm: 'POL-03', status: 'noble' }, { race: 'dwarf', realm: 'POL-20', status: 'peasant' }, { race: 'human', realm: 'POL-05', status: 'merchant' }, { race: 'orc', realm: 'POL-11', status: 'peasant' }, { race: 'human', realm: 'POL-02', status: 'gentry' }, { race: 'human', realm: 'POL-07', status: 'artisan' }, { race: 'human', realm: 'POL-06', status: 'peasant' }];
      try {
        for (let i = 0; i < starts.length && long < 3; i++) {
          mine = 0; const f0 = NB.stats.pcWorldFix;
          const L = B.life(Object.assign({ seed: 6420 + i, sex: i % 2 ? 'F' : 'M', startAge: 18 }, starts[i]), 'careful', true, 30);
          const pc = A.P(A.S.pc), found = NB.stats.pcWorldFix - f0 + (pc && pc.flags && pc.flags.nb_was_wrong ? 1 : 0);
          lives++; years += L.years;
          if (L.years >= 15) { long++; if (mine + found > 0) met++; }
          for (const p of Object.values(A.S.people)) if (p.nb) { people++; ownBytes += JSON.stringify(p.nb).length; for (const x of NB.beliefs(p)) { held++; if (NB.isFalse(x.c, x.st)) fals++; } }
          shared += JSON.stringify(A.S.npcb || {}).length; save += A.serialize().length;
        }
      } finally { A.eventChoose = ch; }
      return { lives, long, met, years, scenes, fScenes, held, fals, pct: Math.round(100 * fals / Math.max(1, held)), people, ownBytes, shared, perHolder: Math.round(ownBytes / Math.max(1, people)), sharePct: +(100 * (ownBytes + shared) / Math.max(1, save)).toFixed(2), stats: NB.stats };
    });
    const ok = r.long >= 3 && r.met === r.long && r.held > 50 && r.pct >= 20 && r.pct <= 80 && r.scenes >= 1 && r.perHolder < 150 && r.sharePct < 2;
    return { ok, detail: `${r.lives} bot lives, ${r.years} years (${r.long} of 15 years or more, ${r.met} of them met belief against truth in play): ${r.people} people hold ${r.held} beliefs at the end, ${r.pct}% false; ${r.scenes} belief scenes (${r.fScenes} driven by a false one); ` +
      `the player heard ${r.stats.pcWorldHeard} tales of the world and found ${r.stats.pcWorldFix} of them wrong; ${r.ownBytes} bytes on people (${r.perHolder} a holder) and ${r.shared} shared, ${r.sharePct}% of the saves` };
  },

  async nbWorldTellings(pg) {
    // every realm tells the great events of the record its own way: the winners count high, the losers claim the
    // field, the victims of a sack say the town was burned, the far hear it larger
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6430); if (!A.WC || !A.WC.put) return { skip: true };
      const S = A.S, live = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel).sort();
      const pairs = [];
      for (const a of live) for (const b of A.neighbors(a) || []) if (live.includes(b) && a < b && S.prov.some(P => P.owner === b)) pairs.push([a, b]);
      const G = () => ({ n: 0, f: 0, flip: 0, hi: 0, burn: 0, soft: 0 }), T = { B: { own: G(), other: G(), near: G(), far: G() }, X: { own: G(), other: G(), near: G(), far: G() } };
      for (const [a, b] of pairs.slice(0, 24)) {
        const P = S.prov.find(q => q.owner === b);
        const iB = A.WC.put('battle', { p: P.id, a, b, w: [], n: 30000, x: [5000, 2, ''] }), iX = A.WC.put('fall', { p: P.id, a, b, w: [], n: 20, x: 2 });
        for (const rid of live) for (const i of [iB, iX]) {
          const cid = NB.tellIn(rid, i), c = NB.claim(cid), e = A.WC.ent(i), g = T[c.k][NB.role(rid, e)];
          g.n++; if (!c.t) g.f++;
          if (c.k === 'B') { if (c.s !== a) g.flip++; if (c.x[0] > 5000 * 1.25) g.hi++; }
          else { if (c.x[1] === 3) g.burn++; if (c.x[1] < 2) g.soft++; }
        }
      }
      const pct = g => Math.round(100 * g.f / Math.max(1, g.n));
      const out = {};
      for (const k of ['B', 'X']) for (const role of ['own', 'other', 'near', 'far']) out[k + role] = Object.assign({ pct: pct(T[k][role]) }, T[k][role]);
      // the yearly step keeps a few a realm, its own affairs first, and a place for news from afar
      NB.st().ww = 0; S.npcb.pb = {}; NB.worldYear();
      const sizes = Object.values(S.npcb.pb).map(m => Object.keys(m).length);
      out.maxKept = Math.max(...sizes); out.realms = sizes.length; out.pairs = Math.min(24, pairs.length);
      out.sample = NB.tellings(pc.realm).slice(0, 3).map(x => NB.say(x.c, pc));
      return out;
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const ok = r.Bown.hi > r.Bown.n * 0.5 && r.Bother.flip > r.Bother.n * 0.2 && r.Bfar.pct > r.Bnear.pct && r.Bown.flip === 0 &&
      r.Xother.burn > r.Xother.n * 0.4 && r.Xown.soft > r.Xown.n * 0.3 && r.Xfar.pct > r.Xnear.pct && r.Xnear.pct > 0 && r.maxKept <= 6 && r.realms > 10;
    return { ok, detail: `${r.pairs} battles and ${r.pairs} sacks, told in every realm. Battles: the winners count the dead high ${r.Bown.hi} of ${r.Bown.n}, the losers claim the field ${r.Bother.flip} of ${r.Bother.n}, false near ${r.Bnear.pct}% (${r.Bnear.n}), far ${r.Bfar.pct}% (${r.Bfar.n}). ` +
      `Sacks: the victims say burned ${r.Xother.burn} of ${r.Xother.n}, the takers say it was less ${r.Xown.soft} of ${r.Xown.n}, false near ${r.Xnear.pct}%, far ${r.Xfar.pct}%. The yearly step keeps at most ${r.maxKept} in each of ${r.realms} realms. "${r.sample.join('"; "')}"` };
  },

  async nbWorldDrift(pg) {
    // tellings drift with time towards what flatters the realm, faster under a ruler with legitimacy and fame; a false
    // one is set right far more often after a peace with the realm it blames
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6431); if (!A.WC || !A.WC.put) return { skip: true };
      const P0 = NBT.places(pc), R = A.realm(pc.realm), ru = A.P(R.ruler), st = NB.st();
      const bats = []; for (let k = 0; k < 6; k++) bats.push(A.WC.put('battle', { p: pc.home, a: R.id, b: P0.nb, w: [], n: 30000, x: [5000, 1, ''] }));
      const run = (legit, fame) => {
        R.legit = legit; ru.fame = fame;
        let drifted = 0;
        for (let t = 0; t < 30; t++) { st.pb[R.id] = {}; for (const i of bats) NB.tellIn(R.id, i, 'T'); for (let y = 0; y < 10; y++) NB.driftIn(R.id, []); drifted += NB.tellings(R.id).filter(x => NB.acctOf(x.c) !== 'T').length; }
        return drifted;
      };
      const keep = [R.legit, ru.fame];
      const low = run(0, 0), high = run(100, 100), props = [NB.prop(R.id)];
      R.legit = 0; ru.fame = 0; props.unshift(NB.prop(R.id)); R.legit = keep[0]; ru.fame = keep[1];
      // a sack of one of our towns, told as a burning: set right after a peace, or not
      const nbP = A.S.prov.find(q => q.owner === R.id && q.id !== pc.home) || A.S.prov[pc.home];
      const iX = A.WC.put('fall', { p: nbP.id, a: P0.nb, b: R.id, w: [], n: 10, x: 2 });
      const fix = peace => { let n = 0; for (let t = 0; t < 40; t++) { st.pb[R.id] = {}; NB.tellIn(R.id, iX, 'L'); for (let y = 0; y < 3; y++) NB.driftIn(R.id, peace ? [[A.S.year, R.id, P0.nb]] : []); n += NB.tellings(R.id).filter(x => x.c.t).length; } return n; };
      return { low, high, of: 30 * 6, props, fixNone: fix(false), fixPeace: fix(true), trials: 40 };
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const ok = r.high > r.low * 1.3 && r.low > 0 && r.fixPeace > r.fixNone * 2;
    return { ok, detail: `${r.of} true tellings of victories, after 10 years: ${r.low} drifted to the flattering count under a ruler of no standing (propaganda ${r.props[0].toFixed(2)}), ${r.high} under one of full legitimacy and fame (${r.props[1].toFixed(2)}). ` +
      `A sack told as a burning, after 3 years: set right in ${r.fixNone} of ${r.trials} trials without a peace, ${r.fixPeace} after a peace with the realm it blames` };
  },

  async nbBelievedGrudge(pg) {
    // 68-casus-belli's grudges read the believed history: a sack told as a burning, and a king's death laid on the
    // neighbour, add to 55's ledger sum; a vengeful crown makes a plan of it; without the belief, none
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6432); if (!A.WC || !A.WC.put || !A.BONDS || !A.BONDS.FEUD) return { skip: true };
      const FE = A.BONDS.FEUD, CS = A.CASUS, S = A.S;
      const live = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel && id !== pc.realm).sort();
      let a = null, b = null;
      for (const x of live) { if (CS && CS.vengeance(x) < CS.T.temper) continue; const y = (A.neighbors(x) || []).find(n => live.includes(n) && Math.abs(NB.feudSum0(x, n)) < 1 && !(CS && CS.wantOf(x, n))); if (y) { a = x; b = y; break; } }
      if (!a) return { none: true };
      const town = S.prov.find(q => q.owner === a);
      const before = { sum: FE.sum(a, b), rel: A.relBetween(a, b), plan: CS ? CS.weigh(a, b) : null };
      // the record: b took the town by storm and sacked it (true); the telling in a: burned, and its people put to the sword
      const iX = A.WC.put('fall', { p: town.id, a: b, b: a, w: [], n: 12, x: 2 });
      NB.st().pb[a] = {}; NB.tellIn(a, iX, 'L');
      const one = { sum: FE.sum(a, b), rel: A.relBetween(a, b), plan: CS ? CS.weigh(a, b) : null, parts: A.opinionParts(a, b).filter(x => /What is said/.test(x[0])).map(x => x[0] + ' ' + x[1]) };
      NB.WG_ON = false; const off = { sum: FE.sum(a, b), plan: CS ? CS.weigh(a, b) : null }; NB.WG_ON = true;
      // the same sack told as it was: half weight, since a true wrong is mostly in the ledger already
      NB.st().pb[a] = {}; NB.tellIn(a, iX, 'T'); const truthSum = FE.sum(a, b);
      // and a king's death laid on b by a's own court, besides the burning: capped
      const iR = A.WC.put('ruler', { p: town.id, a, w: [S.realms[a].ruler, null], n: 61, x: 'a fever' });
      NB.st().pb[a] = {}; NB.tellIn(a, iX, 'L'); NB.st().pb[a][NB.worldClaim(iR, 'E', a, { foe: b })] = S.year;
      const both = FE.sum(a, b);
      return { a: S.realms[a].short, b: S.realms[b].short, before, one, off, truthSum, both, cap: NB.WG_CAP };
    });
    if (r.skip) return { ok: true, detail: 'no world record or ledger in this build' };
    if (r.none) return { ok: false, detail: 'no vengeful crown with a clean ledger found' };
    const plan = x => (x ? `${x.k} ${x.G != null ? x.G : ''}`.trim() : 'none');
    const ok = r.one.sum === r.before.sum - 8 && r.one.rel < r.before.rel && r.off.sum === r.before.sum && r.truthSum > r.one.sum && r.both === r.before.sum - r.cap &&
      (!r.before.plan || r.before.plan.k !== 'feud') && r.one.plan && r.one.plan.k === 'feud' && (!r.off.plan || r.off.plan.k !== 'feud') && r.one.parts.length === 1;
    return { ok, detail: `${r.a} believes ${r.b} burned one of its towns and put the people to the sword (the record: sacked). The grudge (55's ledger sum, as 68 reads it) ${r.before.sum} → ${r.one.sum}; opinion ${r.before.rel} → ${r.one.rel}; ` +
      `68's plan ${plan(r.before.plan)} → ${plan(r.one.plan)}; without the belief ${r.off.sum}, plan ${plan(r.off.plan)}. Told as it was: ${r.truthSum}. With a king's death laid on ${r.b} too: ${r.both} (capped at ${r.cap}). Tooltip "${r.one.parts[0]}"` };
  },

  async nbWary(pg) {
    // a realm that believes tales of a neighbour crown's cruelty is warier of it in diplomacy (A.interest), a little
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6433); if (!A.WC || !A.WC.put) return { skip: true };
      const S = A.S, live = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel && id !== pc.realm).sort();
      const a = live[0], b = (A.neighbors(a) || []).find(n => live.includes(n));
      const towns = S.prov.filter(q => q.owner === a).slice(0, 3);
      NB.st().pb[a] = {};
      const I = () => { NB.WG_ON = false; try { return Math.round(A.interest(a, b) * 10) / 10; } finally { NB.WG_ON = true; } };
      const out = [I()];
      for (const t of towns) { const i = A.WC.put('fall', { p: t.id, a: b, b: a, w: [], n: 9, x: 1 }); NB.tellIn(a, i, 'L'); out.push(I()); }
      NB.WARY_ON = false; const off = I(); NB.WARY_ON = true;
      // a tale of a sack told as a mere storming (the takers' account) is no tale of cruelty
      NB.st().pb[a] = {}; for (const t of towns) { const i = A.WC.put('fall', { p: t.id, a: b, b: a, w: [], n: 9, x: 1 }); NB.tellIn(a, i, 'T'); }
      const mild = I();
      return { a: S.realms[a].short, b: S.realms[b].short, steps: out, off, mild, false: NB.tellings(a).length };
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const d = r.steps.map(x => Math.round((r.steps[0] - x) * 10) / 10);
    const ok = d[1] === 3 && d[2] === 6 && d[3] === 6 && r.off === r.steps[0] && r.mild === r.steps[0];
    return { ok, detail: `${r.a}'s interest in ${r.b} (what its alliances and pacts read), with no tale, then one, two, three tales of towns burned by ${r.b}: ${r.steps.join(' → ')} (warier by ${d.slice(1).join(', ')}; capped at 6). Switched off: ${r.off}. Told as stormings, not burnings: ${r.mild}` };
  },

  async nbRevenge(pg) {
    // people act on what they believe: a killing believed turns the believer on the one blamed (an enemy now, found by
    // 21's feud move), brings the nb_avenge move to the player, or a plot (39-schemes) when the one blamed is the player
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6434), out = {};
      const mk = (tr, known, op) => { const me = A.pc(), p = NBT.person(me, { traits: tr || [] }); if (known) NBT.know(me, p, op || 20); return p; };
      // h believes X killed his brother v (it was a fever)
      const h = mk(['vengeful', 'brave'], true, 25), v = mk(), X = mk(), y = mk();
      A.link(h, v, 'sibling', 60, 'sibling'); A.link(X, y, 'sibling', 60, 'sibling');
      A.kill(v, 'a fever');
      const K = NB.make('K', X.id, v.id, 0, -10, v.given); NB.adopt(h, K, 1);
      out.found = !!NB.avengeOf(pc, h) && NB.avengeOf(pc, h).X.id === X.id;
      out.desire = A.NPCI && A.NPCI.desire ? Math.round(A.NPCI.desire(pc, h, 'nb_avenge', pc.rel[h.id]).w * 100) / 100 : null;
      out.inKinds = !!(A.NPCI && A.NPCI.KINDS && A.NPCI.KINDS.nb_avenge);
      const ch = A.chance;
      A.chance = () => false; try { NB.revengeYear(pc, [h]); } finally { A.chance = ch; }
      out.enemy = h.rel[X.id] && h.rel[X.id].type; out.foeOf = A.NPCI && A.NPCI.foeOf ? (A.NPCI.foeOf(pc, h) || {}).id === X.id : null;
      // the move: talked out of it (a check won), or the player walks with him
      const base = A.serialize();
      const talk = NBT.choose('nb_avenge', { pid: h.id }, 1, 1);
      out.talkText = talk.text; out.talked = NB.held(A.P(h.id), K) === -1 && A.P(h.id).nbRv === A.S.year && A.P(X.id).alive;
      A.deserialize(JSON.parse(base));
      const join = NBT.choose('nb_avenge', { pid: h.id }, 0, 0.01);
      const X2 = A.P(X.id);
      out.joinText = join.text; out.killed = !X2.alive && /killed by/.test(X2.cause || ''); out.wrongDoor = A.pc().flags.nb_wrong_door === A.S.year;
      out.chain = NB.beliefs(A.P(y.id)).some(x => x.c.k === 'K' && x.c.s === h.id && x.c.o === X.id && x.c.t);
      out.nbFalse = join.ctx && join.ctx.nbFalse;
      A.deserialize(JSON.parse(base));
      // the player blamed: a kinsman who believes it, and hates the player, starts a plot
      const pc2 = A.pc(), h2 = mk(['vengeful'], true, -60), v2 = mk(); A.link(h2, v2, 'child', 70, 'parent'); A.kill(v2, 'a fall');
      const K2 = NB.make('K', pc2.id, v2.id, 0, -10, v2.given); NB.adopt(h2, K2, 1); h2.rel[pc2.id].op = -60; pc2.rel[h2.id].op = -60;
      pc2.scAgainst = null; pc2.scLast = null;
      A.chance = () => true; try { NB.revengeYear(pc2, [h2]); } finally { A.chance = ch; }
      out.hasSchemes = !!A.SCHEMES;
      out.plot = pc2.scAgainst ? { by: pc2.scAgainst.by === h2.id, k: pc2.scAgainst.k, nb: pc2.scAgainst.nb === K2 } : null;
      // off-screen: someone the player does not know goes to the door alone
      const h3 = mk(['wrathful']), v3 = mk(), X3 = mk(); A.link(h3, v3, 'spouse', 70, 'spouse'); A.kill(v3, 'drowning');
      NB.adopt(h3, NB.make('K', X3.id, v3.id, 0, -10, v3.given), 1);
      NB.resetStats(); A.chance = () => true; try { NB.revengeYear(pc2, [h3]); } finally { A.chance = ch; }
      out.offscreen = { act: NB.stats.revAct, kill: NB.stats.revKill, falseBelief: NB.stats.revFalse, dead: !A.P(X3.id).alive };
      return out;
    });
    // without 21-npc-initiative the move runs on this feature's own budget; without 39-schemes there is no plot
    const ok = r.found && (r.desire == null || (r.inKinds && r.desire > 0)) && r.enemy === 'enemy' && r.foeOf !== false && r.talked && r.killed && r.wrongDoor && r.chain && r.nbFalse === 1 &&
      (r.hasSchemes ? r.plot && r.plot.by && r.plot.k === 'murder' && r.plot.nb : !r.plot) && r.offscreen.kill === 1 && r.offscreen.falseBelief === 1;
    return { ok, detail: `a vengeful man who believes X killed his brother (a fever): X is now his enemy (${r.enemy}; 21's feud move finds X: ${r.foeOf}); 21's nb_avenge desire ${r.desire}. Talked out of it: ${r.talked} ("${r.talkText}"). ` +
      `Walked with him: X dead ${r.killed}, the player marked as having gone to the wrong door ${r.wrongDoor}, X's brother now believes the true killing ${r.chain} ("${r.joinText}"). ` +
      `Blamed yourself by a vengeful father at -60: 39's plot ${JSON.stringify(r.plot)}. Off-screen, alone: ${JSON.stringify(r.offscreen)}` };
  },

  async nbCourtSidelines(pg) {
    // a court that believes a councillor is in the pay of its enemies puts him out of 56's council, names another, and
    // does not seat him again while it believes it
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6435); if (!A.RI || !A.RI.fillCouncil || !A.COUNCIL) return { skip: true };
      const S = A.S, rid = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel && id !== pc.realm && S.realms[id].council).sort().find(id => Object.keys(S.realms[id].council).filter(k => A.P(S.realms[id].council[k])).length >= 3);
      const rr = A.realm(rid), seat = Object.keys(rr.council).find(k => A.COUNCIL[k] && A.P(rr.council[k]) && A.P(rr.council[k]).alive), C = A.P(rr.council[seat]);
      const cid = NB.make('S', C.id, 'treason', NB.treasonTrue(rr, { p: C, h: null }) ? 1 : 0, -12); NB.courtAdopt(rid, cid, 1);
      const ch = A.chance; A.chance = q => q >= 0.39;   // no new whispers this year; the court acts on what it believes
      try { NB.councilYear(pc); } finally { A.chance = ch; }
      const now = rr.council[seat], L = (rr.riCourt || [])[0] || {};
      const out = { realm: rr.short, seat: A.COUNCIL[seat].name, out: now !== C.id, filled: !!A.P(now), log: L.out === C.id, why: ((L.why || [])[0] || [])[0] || '', t: NB.claim(cid).t };
      // while it believes it, he is not named again, whichever seat comes free
      let reSeated = 0;
      for (let k = 0; k < 8; k++) { const s2 = Object.keys(A.COUNCIL)[k % Object.keys(A.COUNCIL).length]; delete rr.council[s2]; A.RI.fillCouncil(rr); if (Object.values(rr.council).includes(C.id)) reSeated++; }
      out.reSeated = reSeated; out.keys = Object.keys(rr.council).filter(k => /^_nb/.test(k)).length;
      S.npcb.ct[rid][cid] = -1; out.cleared = NB.traitors(rid).length === 0;
      // the Realm tab names it when it is the player's own realm's court
      return out;
    });
    if (r.skip) return { ok: true, detail: 'no council in this build' };
    const ok = r.out && r.filled && r.log && /pay of the crown/.test(r.why) && r.reSeated === 0 && r.keys === 0 && r.cleared;
    return { ok, detail: `${r.realm}'s court believes its ${r.seat} is in the pay of the crown's enemies (${r.t ? 'true' : 'false'}): put out ${r.out}, the seat filled ${r.filled}, the court record says "${r.why}"; seats freed and filled 8 times since, re-seated ${r.reSeated}` };
  },

  async nbPlayerWorld(pg) {
    // the player takes on trust what is said in their realm of a far battle; it is wrong; years later they find out,
    // and the Chronicle sets what they were told beside the record. An old save without the world tellings plays on.
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6436); if (!A.WC || !A.WC.put) return { skip: true };
      const S = A.S, nbs = new Set([pc.realm].concat(A.neighbors(pc.realm) || []));
      const far = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel && !nbs.has(id) && !(A.neighbors(id) || []).some(n => nbs.has(n))).sort();
      const a = far[0], b = (A.neighbors(a) || []).find(n => far.includes(n)) || far[1];
      const P = S.prov.find(q => q.owner === b);
      const i1 = A.WC.put('battle', { p: P.id, a, b, w: [], n: 40000, x: [6000, 2, ''] });
      const iR = A.WC.put('ruler', { p: P.id, a: b, w: [S.realms[b].ruler, null], n: 58, x: 'a fever' });
      S.npcb.pb[pc.realm] = {}; const c1 = NB.tellIn(pc.realm, i1, 'F');
      const knows = NB.pcKnows(pc, NB.claim(c1));
      const log0 = S.log.length, ch = A.chance;
      A.chance = () => true; try { NB.pcWorldYear(pc); } finally { A.chance = ch; }
      const heard = NB.pcHeld(pc, c1) === 1 && NB.isFalse(NB.claim(c1), 1), heardLog = S.log.flatMap(e => (e && e.lines) || []).map(l => String(l[0] || '')).find(t => /^Word in/.test(t)) || '';
      // a year on: it comes out (a scene)
      S.year += 1; A.S.queue = [];
      A.chance = () => true; try { NB.pcWorldYear(pc); } finally { A.chance = ch; }
      const queued = A.S.queue.some(q => q.ev === 'nb_record_wrong');
      const res = NBT.choose('nb_record_wrong', { cid: (A.S.queue.find(q => q.ev === 'nb_record_wrong') || { ctx: { cid: c1 } }).ctx.cid }, 0);
      const fixed = NB.pcHeld(A.pc(), c1) === -2 && A.pc().flags.nb_was_wrong === S.year;
      // and a king's death heard since, told as a death in the saddle (it was a fever), still believed
      const c2 = NB.tellIn(pc.realm, iR, 'H'); NB.pcHear(A.pc(), c2, 1, pc.realm);
      // the Chronicle: on the page and in the export, pure to draw
      UI.screen = 'game';
      const h0 = T.hash(A.S), rng0 = JSON.stringify(A.S.rng);
      const book = UI.TAB.book ? UI.TAB.book(A.pc()) : '', text = A.chronicleText ? A.chronicleText() : '';
      const pure = T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === rng0;
      const sec = book.slice(book.indexOf('What the world told'));
      // an old save from before the world tellings
      const o = JSON.parse(A.serialize()); const strip = x => { if (x && x.npcb) { delete x.npcb.pb; delete x.npcb.ww; } }; strip(o.S || o); strip(o);
      A.deserialize(o); let err = null; try { NB.year(A.pc()); } catch (e) { err = String(e); }
      return { knows, heard, heardLog, queued, view: res.view && res.view.text, result: res.text, fixed, inBook: book.includes('What the world told'), learned: /learned otherwise/.test(sec), record: /beat/.test(sec), stillBelieved: /As far as/.test(sec), inText: /WHAT THE WORLD TOLD/.test(text), pure, oldSave: !err && !!A.S.npcb.pb, err };
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const ok = r.knows === null && r.heard && /^Word in/.test(r.heardLog) && r.queued && r.fixed && r.inBook && r.learned && r.record && r.stillBelieved && r.inText && r.pure && r.oldSave;
    return { ok, detail: `a far battle, told at home with the count run high: you cannot know it (${r.knows}), and take it on trust ${r.heard} ("${r.heardLog.slice(0, 110)}"). A year on it comes out: the scene ${r.queued} ("${String(r.view).slice(0, 120)}…"), set right ${r.fixed}. ` +
      `The Chronicle: section ${r.inBook}, "learned otherwise" with the record's line ${r.learned && r.record}, the king's death you still believe ${r.stillBelieved}; the export ${r.inText}; pure ${r.pure}. An old save without the tellings plays on ${r.oldSave}${r.err ? ' ' + r.err : ''}` };
  },

  async nbWorldViews(pg) {
    // the diplomacy card, the Realm tab and the World tab's Tales show what each realm says; the record only where the
    // player knows how it went; escaped; drawing changes nothing
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB, pc = NBT.adult(6437); if (!A.WC || !A.WC.put) return { skip: true };
      const S = A.S, P0 = NBT.places(pc), live = Object.keys(S.realms).filter(id => S.realms[id].alive && !S.realms[id].isRebel).sort();
      const iN = A.WC.put('battle', { p: pc.home, a: pc.realm, b: P0.nb, w: [], n: 30000, x: [4000, 1, ''] });
      const fb = (A.neighbors(P0.far) || []).find(n => live.includes(n) && n !== pc.realm && !(A.neighbors(pc.realm) || []).includes(n)) || P0.far;
      const iF = A.WC.put('battle', { p: P0.farProv, a: P0.far, b: fb, w: [], n: 50000, x: [9000, 3, ''] });
      for (const rid of live) { NB.tellIn(rid, iN); NB.tellIn(rid, iF); }
      NB.pcHear(pc, NB.tellIn(pc.realm, iF, 'F'), 1, pc.realm);
      const keep = S.realms[P0.far].short; S.realms[P0.far].short = 'Far<img src=x>';
      UI.screen = 'game';
      // once to warm the release's own views (its diplomacy reads set up fields the first time), then measured
      UI.diplCard(A.realm(pc.realm), A.realm(P0.nb)); UI.TAB.realm(pc); UI.worldView = 'history'; UI.TAB.world(pc); UI.worldView = 'nbtales'; UI.TAB.world(pc);
      const h0 = T.hash(A.S), rng0 = JSON.stringify(A.S.rng);
      const card = UI.diplCard(A.realm(pc.realm), A.realm(P0.nb));
      const realm = UI.TAB.realm(pc);
      UI.worldView = 'history'; const hist = UI.TAB.world(pc);
      UI.worldView = 'nbtales'; const tales = UI.TAB.world(pc);
      UI.worldView = 'map';
      const pure = T.hash(A.S) === h0 && JSON.stringify(A.S.rng) === rng0;
      S.realms[P0.far].short = keep;
      const t2 = tales.replace(/<[^>]+>/g, ' ');
      S.realms[P0.far].short = 'Far<img src=x>';
      const mine = NB.talesView(pc) + NB.realmBlock(pc, A.realm(P0.far)) + NB.realmBlock(pc, A.realm(P0.nb)) + NB.realmCard(pc);
      S.realms[P0.far].short = keep;
      return { card: card.includes('What is said in'), realm: realm.includes('What is said here'), button: hist.includes('data-v="nbtales"'), tales: tales.includes('Tales of the age'),
        record: /The record:/.test(t2), cannot: /cannot say from here/.test(t2), heard: /you heard it so/.test(t2), escaped: !mine.includes('<img src=x>') && mine.includes('Far&lt;img'), pure, n: (tales.match(/nb-tale/g) || []).length };
    });
    if (r.skip) return { ok: true, detail: 'no world record in this build' };
    const ok = r.card && r.realm && r.button && r.tales && r.record && r.cannot && r.heard && r.escaped && r.pure && r.n >= 2;
    return { ok, detail: JSON.stringify(r) };
  },
};
