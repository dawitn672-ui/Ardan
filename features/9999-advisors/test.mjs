// 9999-advisors: the ring of advisors. Real people, honest counsel, memory of whether you listened, pure drawing.
const firstWithCounsel = `(min) => {
  for (let k = 0; k < 4000; k++) {
    A.advance(400);
    let h, g = 0;
    while ((h = A.headReady()) && g++ < 60) {
      if (h.type === 'event') { const v = A.eventView(h); if (v.adv && v.adv.length >= (min || 1)) return h; A.eventAuto(); }
      else A.skipPrompt();
    }
    if (!A.pc().alive) return null;
  }
  return null;
}`;

export default {
  // who sits in the ring: a commoner's few, a ruler's council; every one a living person who knows you
  async advRing(pg) {
    const r = await pg.evaluate(() => {
      const ADV = A.ADV, look = pc => (pc.adv.ring || []).map(x => { const t = A.P(x.id); return { role: x.role, w: x.w, real: !!(t && t.alive && A.S.people[t.id] === t), knows: !!(t.rel[pc.id] && pc.rel[t.id]) }; });
      T.enter({ seed: 515, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 17 });
      let pc = A.pc(); ADV.refresh(pc);
      const young = look(pc);
      T.enter({ seed: 515, race: 'human', realm: 'POL-01', status: 'royal', startAge: 34 });
      pc = A.pc(); A.makeRuler(pc, pc.realm, true); ADV.refresh(pc);
      const ruler = look(pc);
      const seats = Object.keys(A.COUNCIL).filter(s => ruler.some(x => x.role === s)).length;
      // wants change over a life: the same mother wants you safe at 17 and wants grandchildren at 30
      T.enter({ seed: 515, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 17 });
      pc = A.pc();
      const momId = Object.keys(pc.rel).find(id => pc.rel[id].type === 'mother' && A.P(id).alive);
      const mom = A.P(momId), w17 = ADV.wantOf(mom, 'mother', pc);
      pc.born -= 13; const w30 = ADV.wantOf(mom, 'mother', pc); pc.born += 13;
      return { young, ruler, seats, w17, w30, tip: ADV.whoTip(pc, momId) };
    });
    const ok = r.young.length >= 2 && r.young.length <= 3 && r.young.every(x => x.real && x.knows) && r.young.some(x => /father|mother/.test(x.role)) &&
      r.seats === 5 && r.ruler.length <= 6 && r.ruler.every(x => x.real && x.knows) && r.w17 === 'safety' && r.w30 === 'kin';
    return { ok, detail: `a peasant of 17 hears ${r.young.map(x => x.role + ' (' + x.w + ')').join(', ')}; a ruler hears ${r.ruler.map(x => x.role + ' (' + x.w + ')').join(', ')} (${r.seats}/5 seats); a mother wants ${r.w17} at 17 and ${r.w30} at 30; "${r.tip.slice(0, 120)}"` };
  },

  // honest counsel: on 200 real scenes, one who knows the matter favours what is best for you by the engine's odds and
  // effects, one who does not favours their want, and one who hates you steers you away from your good
  async advHonest(pg) {
    const r = await pg.evaluate(() => {
      const ADV = A.ADV;
      T.enter({ seed: 909, race: 'human', realm: 'POL-01', status: 'noble', startAge: 30 });
      const pc = A.pc(), rng0 = A.rngState;
      const ids = Object.keys(A.EV).filter(id => { const e = A.EV[id]; return (e.choices || []).length >= 2 && (e.choices || []).some(c => c.check) && !/^adv_/.test(id); }).sort((a, b) => ADV.hash(a) - ADV.hash(b));
      let n = 0, sk = 0, unsk = 0, host = 0, hostN = 0, odds = 0, oddsN = 0;
      for (const id of ids) {
        if (n >= 200) break;
        const e = A.EV[id], q = { type: 'event', ev: id, ctx: {} };
        // a view as the engine builds it, without running the event's setup (no state is touched)
        const v = { choices: e.choices.map((c, i) => ({ t: String(typeof c.t === 'string' ? c.t : i), i, odds: c.check ? A.checkOdds(pc, c.check) : null })) };
        const W = ADV.biasOf('glory', 'ruin'), key = id;
        const a = ADV.pick(pc, e, v, { W, comp: 85, loyal: 40, key }), b = ADV.pick(pc, e, v, { W, comp: 10, loyal: 40, key }), c = ADV.pick(pc, e, v, { W, comp: 85, loyal: -60, key });
        if (!a || !b) continue;
        n++;
        if (a.j === a.trueBest) sk++;
        if (b.j === b.biasBest) unsk++;
        if (c && a.trueBest !== c.biasBest) { hostN++; if (c.j !== a.trueBest) host++; }
        // where the stakes of the checks are alike, the skilled pick is the better odds
        const chk = v.choices.filter(x => x.odds != null);
        if (chk.length === v.choices.length && chk.length >= 2) { oddsN++; const top = Math.max(...chk.map(x => x.odds)); if (v.choices[a.j].odds >= top - 15) odds++; }
      }
      return { n, sk, unsk, host, hostN, odds, oddsN, pure: A.rngState === rng0 };
    });
    const ok = r.n >= 150 && r.sk / r.n >= 0.9 && r.unsk / r.n >= 0.9 && (r.hostN === 0 || r.host / r.hostN >= 0.8) && r.pure;
    return { ok, detail: `${r.n} scenes: skilled favours your best ${r.sk}/${r.n}; unskilled favours their want ${r.unsk}/${r.n}; hostile steers away from your best ${r.host}/${r.hostN}; skilled within 15 points of the top odds where every choice is a check ${r.odds}/${r.oddsN}; no dice ${r.pure}` };
  },

  // memory: heeding warms them; ignoring three times running brings their scene; letting them go takes them out of the ring
  async advMemory(pg) {
    const r = await pg.evaluate(`(() => {
      const ADV = A.ADV, find = ${firstWithCounsel};
      T.enter({ seed: 515, race: 'human', realm: 'POL-01', status: 'artisan', startAge: 26 });
      const pc = A.pc();
      const q = find(1);
      if (!q) return { none: true };
      const x = q.view.adv[0], t = A.P(x.id), op0 = t.rel[pc.id].op;
      A.eventChoose(x.i); A.eventClose();
      const m = ADV.mem(pc, x.id), heeded = m.k, warmed = Math.round((t.rel[pc.id].op - op0) * 10) / 10;
      // three times against them, with 21's budget full
      let st = A.NPCI && A.NPCI.state ? A.NPCI.state(pc) : null;
      m.st = 2; if (st) { st.b = 2; st.hy = {}; }
      const e = A.EV[q.ev];
      ADV.st(pc).fy = {};
      const fol = ADV.book(pc, [{ id: x.id, r: x.role, i: 0, y: 'want', c: 50, l: 'x' }], 1, { good: false, bad: false }, q.ev);
      A.S.queue = A.S.queue.filter(z => !/^adv_/.test(z.ev || ''));
      ADV.follow(pc, fol);
      const sc = A.S.queue.find(z => z.ev === 'adv_unheeded');
      if (!sc) return { heeded, warmed, fol: fol.map(f => f.ev) };
      A.S.queue = [sc].concat(A.S.queue.filter(z => z !== sc));
      const v = A.eventView(sc);
      const k = v.choices.findIndex(c => /let/.test(c.t));
      A.eventChoose(k); A.eventClose();
      ADV.refresh(pc);
      return { heeded, warmed, scene: sc.ev, text: v.text, out: pc.adv.out[x.id] != null, inRing: ADV.ring(pc).some(z => z.id === x.id), past: pc.adv.past.slice(-1)[0] };
    })()`);
    const ok = !r.none && r.heeded === 1 && r.warmed > 0 && r.scene === 'adv_unheeded' && r.out && !r.inRing && !/\{/.test(r.text || '{');
    return { ok, detail: r.none ? 'no counsel met' : `heeded once (${r.heeded}), their opinion of you +${r.warmed}; after three times against them: ${r.scene}; let go: out ${r.out}, still in the ring ${r.inRing}, past ${JSON.stringify(r.past)}; "${(r.text || '').slice(0, 90)}"` };
  },

  // drawing reads only: the same counsel twice, no dice, no state change, names escaped; the People card too
  async advPure(pg) {
    const r = await pg.evaluate(`(() => {
      const ADV = A.ADV, find = ${firstWithCounsel};
      T.enter({ seed: 777, race: 'human', realm: 'POL-01', status: 'noble', startAge: 24 });
      const q = find(1);
      if (!q) return { none: true };
      const t = A.P(q.view.adv[0].id); t.given = '<img data-pwn>';
      const h0 = T.hash(A.S), r0 = A.rngState;
      UI.render(); const a = UI.queueModal(q); UI.render(); const b = UI.queueModal(q);
      UI.tab = 'people'; UI.ov = null; UI.render();
      const card = document.querySelector('.adv-card');
      const box = document.querySelector('#modal .adv-ring');
      return { same: a === b, has: a.includes('adv-ring'), raw: a.includes('<img data-pwn>'), esc: a.includes('&lt;img data-pwn&gt;'), pure: T.hash(A.S) === h0 && A.rngState === r0, card: !!card, cardRows: card ? card.querySelectorAll('.adv-person').length : 0, dom: !!box, words: box ? box.textContent.slice(0, 160) : '' };
    })()`);
    const ok = !r.none && r.same && r.has && !r.raw && r.esc && r.pure && r.card && r.cardRows >= 1;
    return { ok, detail: r.none ? 'no counsel met' : `drawn twice the same ${r.same}; escaped ${r.esc} (raw ${r.raw}); state and dice untouched ${r.pure}; People card with ${r.cardRows} advisors; "${r.words}"` };
  },

  // every scene of the ring renders with its people, no raw token, at 80 words or fewer, and each choice applies
  async advScenes(pg) {
    const r = await pg.evaluate(() => {
      const ADV = A.ADV, out = [];
      for (const ev of Object.keys(A.EV).filter(id => /^adv_/.test(id))) {
        const e = A.EV[ev];
        for (let k = 0; k < e.choices.length; k++) {
          T.enter({ seed: 515 + k, race: 'human', realm: 'POL-01', status: 'noble', startAge: 40 });
          const pc = A.pc(); ADV.refresh(pc);
          const ring = ADV.ring(pc);
          if (ring.length < 2) { out.push({ ev, bad: 'ring' }); continue; }
          ADV.st(pc).m[ring[0].id] = { h: 6, k: 4, kg: 3, kb: 1, ig: 2, igb: 1, st: 0 };
          const q = { type: 'event', ev, ctx: { pid: ring[0].id, foeId: ring[1].id, npcMove: true } };
          A.S.queue = [q];
          const v = A.eventView(q);
          const words = String(v.text).split(/\s+/).length;
          const raw = T.raw.test(v.text + v.title + v.choices.map(c => c.t).join(' '));
          A.eventChoose(k);
          out.push({ ev, k, words, raw, skip: !!v.skip, res: !!(q.result && q.result.text), rawR: T.raw.test(q.result ? q.result.text : '') });
        }
      }
      return out;
    });
    const bad = r.filter(x => x.bad || x.raw || x.rawR || x.skip || !x.res || x.words > 80);
    const evs = [...new Set(r.map(x => x.ev))];
    return { ok: evs.length >= 6 && !bad.length, detail: `${evs.length} scenes, ${r.length} choices played; longest ${Math.max(...r.map(x => x.words || 0))} words; problems ${JSON.stringify(bad.slice(0, 3))}` };
  },

  // an old save with no ring loads, draws and plays; the ruler's war declaration carries the council's counsel
  async advOldSaveAndWar(pg) {
    const r = await pg.evaluate(() => {
      const ADV = A.ADV;
      T.enter({ seed: 606, race: 'human', realm: 'POL-01', status: 'royal', startAge: 34 });
      const pc = A.pc(); A.makeRuler(pc, pc.realm, true);
      delete pc.adv;
      T.renderAll();
      const res = T.play(1);
      const filled = ADV.ring(A.pc()).length;
      // the war declaration
      const r0 = A.myRealm(), foe = Object.values(A.S.realms).find(x => x.alive && x.id !== r0.id && !A.hostile(r0.id, x.id));
      const h = UI.warDeclModal(foe.id), s0 = T.hash(A.S);
      UI.warDeclModal(foe.id);
      const pure = T.hash(A.S) === s0;
      const k0 = (pc.adv.n.k || 0) + (pc.adv.n.ig || 0);
      A.diplDo('war', foe.id);
      const booked = (pc.adv.n.k || 0) + (pc.adv.n.ig || 0) - k0;
      return { res, filled, counsel: (h.match(/adv-row/g) || []).length, pure, booked, at: A.hostile(r0.id, foe.id) };
    });
    const ok = r.res !== undefined && r.filled >= 5 && r.counsel >= 2 && r.pure && (!r.at || r.booked >= 2);
    return { ok, detail: `an old save fills the ring: ${r.filled}; the war declaration: ${r.counsel} councillors speak, drawn purely ${r.pure}; declared ${r.at}, counsel booked ${r.booked}` };
  },

  // over real bot lives: the share of big choices with counsel, how often heeding went well against ignoring, and how
  // many distinct people counselled each life
  async advLives(pg) {
    const r = await pg.evaluate(() => {
      const ADV = A.ADV, out = [];
      const runs = [['peasant', 16, 4141], ['artisan', 18, 4242], ['noble', 20, 4343], ['ruler', 34, 4444]];
      for (const [status, age, seed] of runs) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: status === 'ruler' ? 'royal' : status, startAge: age });
        if (status === 'ruler') A.makeRuler(A.pc(), A.pc().realm, true);
        let once = 0, onceAdv = 0; const y0 = A.S.year;
        T.play(10, { onEvent: v => { const q = A.S.queue[0], e = q && A.EV[q.ev]; if (e && e.once && !/^adv_/.test(e.id) && v.choices.length >= 2 && A.age(A.pc()) >= 10) { once++; if (v.adv) onceAdv++; } } });
        const pc = A.pc(), n = (pc.adv && pc.adv.n) || {};
        out.push({ status, years: A.S.year - y0, big: n.big || 0, adv: n.adv || 0, k: n.k || 0, kg: n.kg || 0, ig: n.ig || 0, igg: n.igg || 0, distinct: Object.keys((pc.adv && pc.adv.m) || {}).length, once, onceAdv });
      }
      return out;
    });
    const S = k => r.reduce((a, x) => a + x[k], 0);
    const share = S('adv') / Math.max(1, S('big')), onceShare = S('onceAdv') / Math.max(1, S('once'));
    const heedGood = S('kg') / Math.max(1, S('k')), ignGood = S('igg') / Math.max(1, S('ig'));
    const distinct = S('distinct') / r.length;
    const ok = share >= 0.8 && onceShare >= 0.8 && distinct >= 3;
    return { ok, data: r, detail: `${r.length} lives: big choices with counsel ${S('adv')}/${S('big')} (${Math.round(share * 100)}%), once-scenes ${S('onceAdv')}/${S('once')}; heeded went well ${Math.round(heedGood * 100)}% (${S('kg')}/${S('k')}), ignored went well ${Math.round(ignGood * 100)}% (${S('igg')}/${S('ig')}); distinct advisors a life ${distinct.toFixed(1)} (${r.map(x => x.status + ' ' + x.distinct).join(', ')})` };
  },
};
