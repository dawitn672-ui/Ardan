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
      };
      // after each reload the people are new objects: the stage works on them, found by id
      const stage = {};
      for (const k of Object.keys(stage0)) stage[k] = () => { const P = { t: A.P(ID.t), u: A.P(ID.u), o: A.P(ID.o), foe: A.P(ID.foe), pc: A.pc() }; return stage0[k](P); };
      for (const ev of Object.keys(stage)) {
        const E = A.EV[ev]; if (!E) { out.raw.push(ev + ': missing'); continue; }
        let seen = false;
        for (let i = 0; i < E.choices.length; i++) for (const win of E.choices[i].check ? [1, 0] : [null]) {
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
        }
      }
      out.events = Object.keys(stage).length;
      return out;
    });
    const want = ['accusedCleared', 'believed', 'wasWrong', 'lie', 'toldTruth', 'probe', 'embellished', 'battleTruth', 'beastTaught'];
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
      let a = null, b = null;
      for (const x of live) { const n = A.neighbors(x.id).map(A.realm).find(y => y && y.alive && !y.isRebel && y.id !== A.pc().realm && A.realmProvs(x.id).length >= 3); if (n) { a = x; b = n; break; } }
      const rel0 = A.relBetween(a.id, b.id);
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
      A.setRelPair(a.id, b.id, -20);
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
      // an old save: none of it
      const o = JSON.parse(save);
      const strip = x => { if (!x || typeof x !== 'object') return; delete x.npcb; for (const id in x.people || {}) { delete x.people[id].nb; delete x.people[id].nbk; } };
      strip(o.S || o); strip(o);
      A.deserialize(o);
      const missing = !A.S.npcb && !Object.values(A.S.people).some(p => p.nb);
      const res = T.play(3);
      return { a, b, c, held, claims, missing, res, after: !!A.S.npcb, alive: !!A.pc() };
    });
    const ok = r.a === r.b && r.a === r.c && r.held > 0 && r.claims > 0 && r.missing && r.after;
    return { ok, detail: `14 years twice: ${r.a === r.b ? 'the same' : 'different'} beliefs with and without drawing the screens (${r.held} people hold ${r.claims} claims); after a save round trip ${r.a === r.c ? 'the same' : 'different'}; an old save without them loads and plays 3 years (${r.res}), state rebuilt ${r.after}` };
  },

  async nbInRealLives(pg) {
    // bot lives in the build: people hold beliefs, some false; scenes come; the state stays small
    await pg.evaluate(BOT);
    const r = await pg.evaluate(() => {
      const NB = A.NPCB; NB.resetStats();
      let scenes = 0, fScenes = 0, years = 0, held = 0, fals = 0, bytes = 0, people = 0;
      const ch = A.eventChoose;
      A.eventChoose = function () { const q = A.S.queue[0]; if (q && q.type === 'event' && !q.result && /^nb_/.test(q.ev)) { scenes++; if (q.ctx && q.ctx.nbFalse) fScenes++; } return ch.apply(this, arguments); };
      try {
        for (const [i, o] of [{ race: 'human', realm: 'POL-01', status: 'artisan' }, { race: 'human', realm: 'POL-03', status: 'noble' }, { race: 'dwarf', realm: 'POL-20', status: 'peasant' }].entries()) {
          const L = B.life(Object.assign({ seed: 6420 + i, sex: i % 2 ? 'F' : 'M', startAge: 18 }, o), 'careful', true, 30);
          years += L.years;
          for (const p of Object.values(A.S.people)) if (p.nb) { people++; bytes += JSON.stringify(p.nb).length; for (const x of NB.beliefs(p)) { held++; if (NB.isFalse(x.c, x.st)) fals++; } }
          bytes += JSON.stringify(A.S.npcb || {}).length;
        }
      } finally { A.eventChoose = ch; }
      return { years, scenes, fScenes, held, fals, pct: Math.round(100 * fals / Math.max(1, held)), people, bytes, perPerson: Math.round(bytes / Math.max(1, people)), stats: NB.stats };
    });
    const ok = r.held > 50 && r.pct >= 20 && r.pct <= 80 && r.scenes >= 1 && r.perPerson < 400;
    return { ok, detail: `3 bot lives, ${r.years} years: ${r.people} people hold ${r.held} beliefs at the end, ${r.pct}% false; ${r.scenes} belief scenes (${r.fScenes} driven by a false one); ${r.bytes} bytes of belief state in all (${r.perPerson} a holder, the shared table included)` };
  },
};
