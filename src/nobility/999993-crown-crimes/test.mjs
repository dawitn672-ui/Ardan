// 999993-crown-crimes (P3, order 54, D-062 addendum): crimes against a ruler have reasoned consequences.
const SETUP = () => {
  window.__cc = {
    life(o) { A.newGame(Object.assign({ race: 'human', realm: 'POL-01', sex: 'M', startAge: 30 }, o)); A.S.queue = []; return A.pc(); },
    king(rid) { const R = A.realm(rid || 'POL-01'); return A.P(R.ruler); },
    traits(p, ts) { p.traits = ts.slice(); p.quirks = []; },
    drain() { let g = 0, h; const seen = []; while ((h = A.headReady()) && g++ < 40) { seen.push(h.ev || h.type); if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } return seen; },
  };
};
export const limits = { ccAttempts: 900, ccRegicide: 900 };
export default {
  // a serf cannot knife an emperor from his field: the attempt is refused, with the reason, and nothing happens
  async ccReach(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = __cc.life({ seed: 9931, status: 'peasant' }), k = __cc.king(), h0 = pc.honor;
      const res = A.interact(k.id, 'murder');
      const rec = (A.S.crown && A.S.crown.rec) || [];
      return { msg: res.msg, ok: res.ok, alive: k.alive, honor: pc.honor === h0, recs: rec.length, reach: A.CROWN.reach(pc, k) };
    });
    const ok = r.ok === false && /cannot get near/.test(r.msg) && r.alive && r.honor && r.recs === 0 && !r.reach;
    return { ok, detail: `refused ${r.ok === false}: "${r.msg}"; the king alive ${r.alive}, nothing recorded ${r.recs === 0}` };
  },

  // attempts by a clumsy noble: found out, remembered, sentenced by law and nature; the guard doubles; the verdicts name
  // their reasons; a death sentence is carried out
  async ccAttempts(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = { found: 0, tries: 0, verdicts: {}, why: [], hate: 0, executed: 0, guard: [], recs: 0 };
      for (let seed = 9940; seed < 9952; seed++) {
        const pc = __cc.life({ seed, status: 'noble' }); pc.skills.intrigue = 0; pc.skills.stealth = 0;
        const k = __cc.king(); __cc.traits(k, seed % 3 === 0 ? ['cruel'] : seed % 3 === 1 ? ['just'] : ['calm']);
        out.tries++;
        A.interact(k.id, 'murder');
        const rec = A.S.crown.rec[A.S.crown.rec.length - 1]; out.recs += A.S.crown.rec.length;
        out.guard.push(A.CROWN.guardOf('POL-01'));
        if (rec.known) {
          out.found++; out.verdicts[rec.verdict] = (out.verdicts[rec.verdict] || 0) + 1; if (out.why.length < 4) out.why.push(rec.verdict + ': ' + rec.vwhy);
          if (k.rel[pc.id] && k.rel[pc.id].op <= -100) out.hate++;
          const q = A.S.queue.find(x => x.ev === 'cc_scaffold');
          if (q) { A.S.queue.splice(A.S.queue.indexOf(q), 1); A.S.queue.unshift(q); A.eventView(q); A.eventChoose(2); if (!A.pc().alive) out.executed++; }
        }
      }
      // the verdict follows the judge: a table of natures for one known attempt
      const pc = __cc.life({ seed: 9960, status: 'noble' }), k = __cc.king(), rec = { k: 'attempt', rid: 'POL-01', vic: k.id, op0: 0 };
      const v = ts => { __cc.traits(k, ts); return A.CROWN.verdict(pc, k, rec); };
      out.table = { cruel: v(['cruel']).k, forgivingLiked: (rec.op0 = 50, v(['forgiving']).k), forgiving: (rec.op0 = 0, v(['forgiving']).k), greedy: (pc.coin = 2000, v(['greedy']).k), calm: v(['calm']).k, plain: v([]).k };
      k.rel[pc.id] = { type: 'child', op: 50 }; out.table.kin = v(['just']).k; delete k.rel[pc.id];
      pc.ruler = 'POL-02'; out.table.prince = v(['proud']).k; pc.ruler = null;
      return out;
    });
    const t = r.table;
    const ok = r.found >= 4 && r.hate === r.found && r.verdicts.death >= 1 && r.executed >= 1 && r.why.every(w => w.split(': ')[1] && w.split(': ')[1].length > 10) &&
      r.guard.every(g => g >= 1) && t.cruel === 'death' && t.forgivingLiked === 'mercy' && t.forgiving === 'prison' && t.greedy === 'fine' && t.calm === 'prison' && t.plain === 'death' && t.kin === 'exile' && t.prince === 'war';
    return { ok, detail: `${r.found} of ${r.tries} attempts found out (all hated: ${r.hate === r.found}); verdicts ${JSON.stringify(r.verdicts)}, executed ${r.executed}; e.g. ${r.why.join(' | ')}; by nature: ${JSON.stringify(t)}` };
  },

  // a murdered king is dead: the succession runs, the realm is shaken, the chronicle says so; once known, his kin hate
  // you, a price is set, and in his realm you are taken and sentenced; an unknown hand is hunted by an inquiry
  async ccRegicide(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const out = {};
      let pc = __cc.life({ seed: 9971, status: 'noble' }); pc.skills.intrigue = 100; pc.skills.stealth = 100;
      let k = __cc.king(); const R = A.realm('POL-01'), st0 = R.stability, kin = A.CROWN.kinOfDead(k).map(x => x.id);
      // a king with no spymaster and no fear in him, and a killer at the top of his craft: the knife gets through, in time
      if (R.council) R.council.spymaster = null; __cc.traits(k, (k.traits || []).filter(t => t !== 'paranoid'));
      // (S1b CI 137: in some worlds the inquiry names the hand while the knife is still being tried, and the scaffold's card is
      // queued then, with the loop's queue cleared after it; every cc_ card queued from here on counts)
      const q0 = A.queue; let ccSeen = false; A.queue = function (it) { if (it && /^cc_/.test(it.ev || '')) ccSeen = true; return q0.apply(this, arguments); };
      let res, g = 0; const home = pc.home; while (k.alive && pc.alive && g++ < 40) { pc.flags.ints = {}; A.S.time = 60; pc.prison = null; pc.realm = 'POL-01'; pc.home = home; A.S.queue = []; res = A.interact(k.id, 'murder'); if (k.alive && A.S.crown) A.S.crown.guard = {}; }
      A.S.queue = [];
      const rec = A.S.crown.rec.find(x => x.k === 'regicide');
      out.dead = !k.alive; out.newKing = R.ruler && R.ruler !== k.id && A.P(R.ruler).alive; out.heirSet = !!(rec && rec.heir === R.ruler);
      out.stab = R.stability < st0; out.news = JSON.stringify(A.S.news || []).includes('murdered');
      // make the hand known (as the inquiry would) and see the realm answer
      if (rec && !rec.known) { rec.why = 'the test'; A.CROWN.known(pc, rec, false); }
      out.kinHate = kin.filter(id => { const p = A.P(id); return p && p.alive && p.rel[pc.id] && p.rel[pc.id].op <= -100; }).length; out.kin = kin.length;
      out.bounty = !!(A.S.crown.bounty[pc.id] && A.S.crown.bounty[pc.id].amt > 0);
      out.sentenced = rec && rec.verdict; out.card = ccSeen || A.S.queue.some(q => /^cc_/.test(q.ev || '')); A.queue = q0;
      // an unknown hand: the inquiry finds it within its two years, often enough
      let solved = 0, tries = 0;
      for (let seed = 9980; seed < 9986; seed++) {
        pc = __cc.life({ seed, status: 'noble' }); k = __cc.king(); tries++;
        const rr = A.CROWN.schemeKill(pc, k, 'poison in the wine');
        for (let m = 0; m < 24 && !rr.known && A.pc().alive; m++) { A.S.queue = []; for (const f of A.onMonth) try { f(A.pc()); } catch (e) {} }
        if (rr.known) solved++;
      }
      out.solved = solved; out.tries = tries;
      return out;
    });
    const ok = r.dead && r.newKing && r.heirSet && r.stab && r.news && r.kinHate === r.kin && r.bounty && !!r.sentenced && r.card && r.solved >= 1;
    return { ok, detail: `king dead ${r.dead}, a new king ${r.newKing} (the heir on record ${r.heirSet}), the realm shaken ${r.stab}, in the chronicle ${r.news}; known: ${r.kinHate} of ${r.kin} kin swear vengeance, a price ${r.bounty}, sentenced "${r.sentenced}", card ${r.card}; the inquiry solved ${r.solved} of ${r.tries} hidden murders in two years` };
  },

  // forgiveness is never automatic: after an attempt on his life a king who hates you will not be talked round; the
  // odds follow his nature, your gifts since and how often you have begged; every answer says why
  async ccForgive(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = __cc.life({ seed: 9990, status: 'noble' }); const k = __cc.king();
      __cc.traits(k, ['just']);
      A.S.crown = { rec: [{ y: A.S.year, by: pc.id, vic: k.id, rid: 'POL-01', k: 'attempt', known: A.S.year, why: 'x' }], guard: {}, sus: {}, bounty: {} };
      k.rel[pc.id] = { type: 'enemy', op: -100 }; pc.rel[k.id] = { type: 'enemy', op: -80 };
      const hated = A.CROWN.forgiveOdds(pc, k, pc.rel[k.id]);
      let yes = 0; for (let i = 0; i < 20; i++) { pc.flags.ints = {}; const m = A.interact(k.id, 'apologize'); if (/accepts/.test(m.msg)) yes++; k.rel[pc.id].op = -100; }
      const msg = (pc.flags.ints = {}, A.interact(k.id, 'apologize').msg);
      // a slight, not a crime: a forgiving man, with gifts since, against a vengeful one; and begging again counts against you
      A.S.crown.rec = []; pc.flags.ccSorry = {};
      k.rel[pc.id].op = -20; pc.rel[k.id].op = -20;
      __cc.traits(k, ['forgiving']); const fo = A.CROWN.forgiveOdds(pc, k, pc.rel[k.id]).p;
      pc.rel[k.id].ccGifts = 300; const gifts = A.CROWN.forgiveOdds(pc, k, pc.rel[k.id]).p; pc.rel[k.id].ccGifts = 0;
      __cc.traits(k, ['vengeful']); const ve = A.CROWN.forgiveOdds(pc, k, pc.rel[k.id]).p;
      __cc.traits(k, ['forgiving']); pc.flags.ccSorry = { [k.id]: { n: 3, y: A.S.year } }; const begged = A.CROWN.forgiveOdds(pc, k, pc.rel[k.id]);
      return { hated, yes, msg, fo, gifts, ve, begged };
    });
    const ok = r.hated.p <= 0.03 && /hatred/.test(r.hated.why) && r.yes <= 2 && /will not forgive you: /.test(r.msg) && r.fo > r.ve + 0.2 && r.gifts > r.fo && r.begged.p < r.fo && /begged/.test(r.begged.why);
    return { ok, detail: `after an attempt, hated: odds ${r.hated.p} ("${r.hated.why}"), ${r.yes} of 20 apologies accepted, "${r.msg}"; a slight: forgiving ${r.fo.toFixed(2)}, with gifts ${r.gifts.toFixed(2)}, vengeful ${r.ve.toFixed(2)}, forgiving after three pleas ${r.begged.p.toFixed(2)} ("${r.begged.why}")` };
  },
};
