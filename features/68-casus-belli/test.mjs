// Casus belli: every war records why it began, in words, and shows it; grudges and wants start wars patiently; debts
// are honoured across a ruler's death; rulers act in line with their traits; AI treasuries do not hoard.
const SETUP = () => {
  window.CBT = {
    game(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' }, o || {}));
      A.S.queue = [];
      return A.pc();
    },
    // a world played the way bench.mjs plays it: a peasant player, swapped for another adult when he dies
    world(seed, years, on) {
      const CS = A.CASUS; CS.ON = on; CS.TEMPER.ON = on;
      CBT.game(seed); CS.resetStats();
      const o = { seed, ry: 0, wars: [], ai: 0, civil: 0, cited: 0, shownNews: 0, shownLog: 0, aiChecked: 0, inc: 0, ag: 0, hoard: [] };
      const me = () => (A.pc() || {}).ruler || null;
      const onWar = (w, opts) => {
        if (opts && opts.silent) return;
        const ra = A.realm(w.leadA);
        if (!ra || ra.playerRun || w.leadA === me()) return;
        o.ai++;
        const civ = w.cb === 'throne' || w.cb === 'liberty' || ra.isRebel;
        if (civ) o.civil++;
        const c = w.casus;
        o.wars.push({ id: w.id, t: c ? c.t : null, cites: c ? c.cites.map(x => x.k) : [] });
        if (c && (CS.hasMemory(c) || CS.hasWant(c))) o.cited++;
        if (c && A.S.news.slice(0, 6).some(n => (n.truth || n.t).includes('casus belli: ' + c.t.slice(0, 30)))) o.shownNews++;
      };
      const lg = A.aiLogAdd;
      A.aiLogAdd = function (k, rid) {
        const e = lg.apply(this, arguments), r = A.realm(rid);
        if (e && r && !r.playerRun && rid !== me() && !e.forced) { if (e.lean >= .05) o.inc++; else if (e.lean <= -.05) o.ag++; }
        if (e && k === 'war') { o.aiChecked++; if (e.cb) o.shownLog++; }
        return e;
      };
      A.on('warStart', onWar);
      const end = A.S.year + years;
      let lastY = A.S.year;
      try {
        for (let k = 0; k < 100000 && A.S.year < end; k++) {
          A.advance(30);
          let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
          if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && !p.ruler); if (!kid) break; A.S.pc = kid.id; }
          if (A.S.year === lastY) continue;
          lastY = A.S.year;
          for (const x of Object.values(A.S.realms)) {
            if (!x.alive || x.isRebel || x.playerRun || x.id === me()) continue;
            o.ry++;
            if (x.treasury > Math.max(1, x.income) * 6) o.hoard.push(`${x.short} ${A.S.year}: ${Math.round(x.treasury / x.income * 10) / 10} years`);
          }
        }
      } finally { A.aiLogAdd = lg; A.HOOKS.warStart = A.HOOKS.warStart.filter(f => f !== onWar); CS.ON = true; CS.TEMPER.ON = true; }
      o.struck = CS.stats.struck;
      return o;
    },
    // two neighbours of a third realm, none of them the player's, with no treaties between them
    trio(pred) {
      const me = A.pc().realm, ok = id => { const r = A.realm(id); return r && r.alive && !r.isRebel && id !== me && !r.playerRun; };
      for (const D of Object.keys(A.S.realms).filter(ok)) {
        const nb = A.neighbors(D).filter(ok);
        for (const X of nb) for (const Y of nb) {
          if (X === Y || A.realm(Y).allies.includes(X) || A.realm(X).allies.includes(Y) || A.realm(D).allies.includes(Y) || A.realm(D).allies.includes(X)) continue;
          if (A.hostile(X, Y) || A.hostile(X, D) || A.hostile(Y, D) || A.atWar(X).length || A.atWar(Y).length || A.atWar(D).length) continue;
          if (A.realm(X).overlord || A.realm(Y).overlord || A.realm(D).overlord) continue;
          if (pred && !pred({ D, X, Y })) continue;
          return { D, X, Y };
        }
      }
      return null;
    },
  };
};

export default {
  async csWorlds(pg) {
    // 3 worlds x 50 years, played with this feature on and again off: every AI war records a casus belli and shows it
    // in the news and the war log; the share citing a memory or a want, by world; the total war rate before and after;
    // rulers in line with their traits; no treasury over six years of income
    await pg.evaluate(SETUP);
    const seeds = [606, 2424, 7], on = [], off = [];
    for (const s of seeds) on.push(await pg.evaluate(([s]) => CBT.world(s, 50, true), [s]));
    for (const s of seeds) off.push(await pg.evaluate(([s]) => CBT.world(s, 50, false), [s]));
    const sum = (L, k) => L.reduce((a, x) => a + x[k], 0);
    const ai = sum(on, 'ai'), recorded = on.reduce((a, x) => a + x.wars.filter(w => w.t).length, 0), cited = sum(on, 'cited'), offCited = sum(off, 'cited');
    const share = 100 * cited / Math.max(1, ai), offShare = 100 * offCited / Math.max(1, sum(off, 'ai'));
    const rateOn = sum(on, 'ai') / sum(on, 'ry'), rateOff = sum(off, 'ai') / sum(off, 'ry');
    const per = on.map(x => Math.round(100 * x.cited / Math.max(1, x.ai)));
    const inChar = 100 * sum(on, 'inc') / Math.max(1, sum(on, 'inc') + sum(on, 'ag')), inCharOff = 100 * sum(off, 'inc') / Math.max(1, sum(off, 'inc') + sum(off, 'ag'));
    const hoard = on.flatMap(x => x.hoard).concat(off.flatMap(x => x.hoard));
    const news = sum(on, 'shownNews'), logs = sum(on, 'shownLog'), checked = sum(on, 'aiChecked');
    const struck = sum(on, 'struck');
    const ok = ai >= 40 && recorded === ai && news >= ai * .9 && logs === checked && share >= 18 && struck >= 3 && rateOn <= rateOff * 1.3 &&
      inChar >= 78 && inChar >= inCharOff + 8 && hoard.length === 0;
    return { ok, detail: `${ai} AI wars in 150 world-years, ${recorded} with a casus belli, ${news} of them in the news, ${logs} of ${checked} declared wars carry it in the war log; ` +
      `citing a memory or a want ${share.toFixed(1)}% (by world ${per.join(', ')}%; off ${offShare.toFixed(1)}%), ${struck} struck by a crown that had planned it; AI wars per realm-year ${rateOn.toFixed(4)} on, ${rateOff.toFixed(4)} off (${(100 * (rateOn / rateOff - 1)).toFixed(0)}%); ` +
      `decisions in character ${inChar.toFixed(1)}% (off ${inCharOff.toFixed(1)}%, ${sum(on, 'inc') + sum(on, 'ag')} with a trait say); hoarding flags ${hoard.length}${hoard.length ? ': ' + hoard.slice(0, 3).join('; ') : ''}; e.g. "${(on.flatMap(x => x.wars).find(w => w.cites.includes('feud')) || {}).t}"`,
      data: { share, offShare, rateOn, rateOff, per, inChar, inCharOff } };
  },

  async csShownEverywhere(pg) {
    // a war's casus belli in the war room, the diplomacy card and the Realm tab; escaped; drawn without a die or a
    // change of state
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CBT.game(6801), FE = A.BONDS.FEUD, t = CBT.trio();
      const { D, X } = t;
      FE.add(X, D, 'capital', { place: '<b>Old Seat</b>' });
      const w = A.declareWar(X, D).w;
      // the player is a subject of the attacker
      pc.realm = X; pc.home = (A.realmProvs(X)[0] || {}).id;
      UI.screen = 'game';
      const rng0 = JSON.stringify(A.rngState), s0 = JSON.stringify(A.S);
      const room = UI.wrWars(), card = UI.diplCard(A.realm(X), A.realm(D)), tab = UI.TAB.realm(pc), card2 = UI.diplCard(A.realm(D), A.realm(X));
      const pure = JSON.stringify(A.rngState) === rng0 && JSON.stringify(A.S) === s0;
      return { c: w.casus, room: /Why it began/.test(room) && room.includes('Took our capital'), card: /Grudges, wants and debts/.test(card2) && /cause/.test(card2), tab: /Why wars begin/.test(tab) && tab.includes(w.name),
        raw: /<b>Old Seat/.test(room + card + tab + card2), pure, news: A.S.news.slice(0, 5).map(n => n.truth || n.t).find(t => /casus belli/.test(t)) };
    });
    return { ok: !!r.c && r.c.lead === 'feud' && r.room && r.card && r.tab && !r.raw && r.pure && !!r.news,
      detail: `casus belli "${r.c && r.c.t}" (lead ${r.c && r.c.lead}); news "${r.news}"; war room ${r.room}; diplomacy card ${r.card}; Realm tab ${r.tab}; escaped ${!r.raw}; render pure ${r.pure}` };
  },

  async csRevengeIsPatient(pg) {
    // a crown wronged by a neighbour plans: it keeps more gold, it waits while the neighbour is at peace and strikes
    // when the neighbour's host is away; a forgiving ruler lets it go
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      CBT.game(6802);
      const CS = A.CASUS, FE = A.BONDS.FEUD, t = CBT.trio(q => A.warPreview(q.Y, q.D).ratio < 1.1), { D: b, Y: a, X: z } = t, ra = A.realm(a);
      const rb = A.realm(b); rb.exhaustion = 0; rb.stability = 60;
      const ru = A.P(ra.ruler);
      FE.add(a, b, 'capital', { place: 'Old Seat' }).y = A.S.year - 30;
      ru.traits = ['vengeful', 'proud']; CS.planYear();
      const plan = ra.csPlan ? Object.assign({}, ra.csPlan) : null;
      const res0 = A.RI ? (CS.ON = false, A.RI.reserveYears(ra)) : 0; CS.ON = true;
      const res1 = A.RI ? A.RI.reserveYears(ra) : 0;
      const P0 = A.warPreview(a, b), quiet = A.cbWarMul(a, b, P0), other = A.neighbors(a).find(o => o !== b && A.realm(o) && A.realm(o).alive);
      const elsewhere = other ? A.cbWarMul(a, other, A.warPreview(a, other)) : null;
      // b goes to war with someone else: its host is away
      A.startWar(z, b, null, 'conquest', { noAllies: true, silent: true });
      const P1 = A.cbPreview(a, b), away = A.cbWarMul(a, b, P1), why = A.aiWhyWar(a, b, P1, -40, null).map(x => x[0]);
      // a forgiving, kind successor lets the grudge lie: no plan
      ru.traits = ['forgiving', 'kind']; CS.planYear();
      return { plan, res0, res1, quiet, elsewhere, away, r0: P0.ratio, r1: P1.ratio, why: why.filter(x => /moment|Vengeful|Proud/.test(x)), after: ra.csPlan || null };
    });
    const ok = r.plan && r.plan.k === 'feud' && r.res1 > r.res0 && r.quiet < 1 && r.away > 2 && r.r1 > r.r0 * 1.3 && r.elsewhere != null && r.elsewhere < 1 && r.why.length >= 2 && !r.after;
    return { ok, detail: `plan ${JSON.stringify(r.plan)}; reserve ${r.res0} -> ${r.res1} years; odds factor on the target at peace x${r.quiet}, on another neighbour x${r.elsewhere}, with the target at war elsewhere x${r.away.toFixed(2)} ` +
      `(strength ratio ${r.r0.toFixed(2)} -> ${r.r1.toFixed(2)}); war log "${r.why.join(' / ')}"; a forgiving, kind ruler keeps no plan: ${!r.after}` };
  },

  async csDebtAfterDeath(pg) {
    // Y owes D: D stood by Y in a war. Y's ruler dies. Under a successor who keeps faith, Y will not attack D, marches
    // when D is attacked (with no treaty), and sends gold; the debt is half repaid and D owes Y in turn. Under one who
    // breaks faith, it does none of this
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      CBT.game(6803);
      const CS = A.CASUS, FE = A.BONDS.FEUD, { D, X, Y } = CBT.trio(), ry = A.realm(Y), rd = A.realm(D);
      ry.exhaustion = 0; ry.stability = 60;
      const e = FE.add(Y, D, 'aid', { foe: 'the Horde' }); e.y = A.S.year - 25;
      const ruler0 = A.P(ry.ruler).given;
      A.rulerDies(ry, 'old age');
      const succ = A.P(ry.ruler); succ.traits = ['loyal', 'brave'];
      const save = A.serialize();
      const origin = FE.origin(e), owes = CS.owes(Y, D), mul = A.cbWarMul(Y, D, A.warPreview(Y, D));
      const res = A.declareWar(X, D), w = res.w;
      const joined = w.def.includes(Y), news = A.S.news.slice(0, 8).map(n => n.truth || n.t).find(t => /has not forgotten/.test(t)) || '';
      const log = (A.S.aiLog || []).find(x => x.k === 'debt' && x.r === Y);
      const paid = e.paid, w1 = e.w, back = FE.sum(D, Y);
      rd.treasury = 0; ry.treasury = ry.income * 3; const t0 = ry.treasury; CS.debtGold(); const gold = t0 - ry.treasury;
      // the same, under a ruler who breaks faith
      A.deserialize(JSON.parse(save));
      const succ2 = A.P(A.realm(Y).ruler); succ2.traits = ['fickle', 'deceitful'];
      const owes2 = CS.owes(Y, D), w2 = A.declareWar(X, D).w, joined2 = w2.def.includes(Y);
      return { ruler0, ruler1: succ.given, origin, owes, mul, joined, news, log: log && log.t, lean: log && log.lean, paid, w1, back, gold, owes2, joined2 };
    });
    const ok = r.ruler0 !== r.ruler1 && /carried by/.test(r.origin) && r.owes >= 12 && r.mul === 0 && r.joined && /has not forgotten/.test(r.news) && !!r.log && r.lean > 0 && r.paid && r.w1 < 16 && r.back > 0 && r.gold > 0 && r.owes2 === 0 && !r.joined2;
    return { ok, detail: `"${r.origin}"; owed ${r.owes}; odds factor of attacking the benefactor x${r.mul}; attacked, the debtor joins: ${r.joined} ("${r.news}"); log "${r.log}" (lean ${r.lean}); ` +
      `the line half repaid (${r.w1}, honoured ${r.paid}), the benefactor now owes ${r.back}; gold sent ${r.gold}; under a fickle, deceitful successor owed ${r.owes2}, joins ${r.joined2}` };
  },

  async csNewDebts(pg) {
    // two more debts: grain ships in a famine, and a capital saved in a war that ended without defeat
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      CBT.game(6804);
      const FE = A.BONDS.FEUD, { D, X, Y } = CBT.trio();
      A.remember(Y, D, 'aid', 12);
      const grain = FE.list(Y, D).find(e => e.k === 'grain');
      const w = A.startWar(X, D, null, 'conquest', { noAllies: true, silent: true });
      w.def.push(Y);
      const cap = A.prov(A.realm(D).capitalProv); cap.occ = X; FE.month(); cap.occ = null;
      A.endWar(w, 'white');
      const relief = FE.list(D, Y).find(e => e.k === 'relief');
      return { grain: grain && FE.origin(grain), relief: relief && FE.origin(relief), w: relief && relief.w };
    });
    return { ok: !!r.grain && !!r.relief && r.w === 22, detail: `"${r.grain}"; "${r.relief}" (+${r.w})` };
  },

  async csSaveAndOld(pg) {
    // plans, casus belli and records survive a save; a save without them loads, plays five years and is drawn
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const pc = CBT.game(6805), FE = A.BONDS.FEUD, CS = A.CASUS, { D, X, Y } = CBT.trio();
      FE.add(Y, D, 'capital', { place: 'Old Seat' });
      A.P(A.realm(Y).ruler).traits = ['wrathful'];
      CS.planYear();
      const w = A.declareWar(X, D).w;
      const raw = A.serialize();
      A.deserialize(JSON.parse(raw));
      const w2 = A.S.wars.find(x => x.id === w.id), kept = !!(w2 && w2.casus && w2.casus.t === w.casus.t) && !!(A.realm(Y).csPlan && A.realm(Y).csPlan.t === D) && (A.realm(X).csHist || []).length > 0;
      const old = JSON.parse(raw);
      for (const x of Object.values(old.realms || {})) { delete x.csPlan; delete x.csHist; }
      for (const x of old.wars || []) delete x.casus;
      A.deserialize(old);
      pc.realm = X;
      const h = UI.wrWars() + UI.TAB.realm(A.pc()) + UI.diplCard(A.realm(X), A.realm(D));
      const st = T.play(5);
      return { kept, drawn: h.length > 0, st, year: A.S.year };
    });
    return { ok: r.kept && r.drawn && !!r.year, detail: `round trip keeps the casus belli, the plan and the record: ${r.kept}; an old save draws and plays on to ${r.year} (${r.st})` };
  },
};
