// 999-confidants: a bond with enough shared history and regard offers its next rank as a scene; each rank gives its thing.
export default {
  async confidantRanks(pg) {
    const r = await pg.evaluate(() => {
      const CF = A.CONFIDANTS, BD = A.BONDS;
      T.enter({ seed: 515, race: 'human', realm: 'POL-01', status: 'artisan', startAge: 24 });
      const pc = A.pc(), S = A.S;
      const t = Object.values(S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p) && !pc.rel[p.id]);
      A.link(pc, t, 'friend', 45, 'friend');
      t.rel[pc.id].op = 45;
      const before = CF.rank(pc, t.id);
      // too little history: nothing offered
      S.queue = []; A.NPCI.state(pc).b = 2; CF.month(pc);
      const early = S.queue.some(q => /^cf_/.test(q.ev || ''));
      // a weight of shared history (55's ledger)
      BD.add(pc, t, 'You pulled each other out of the river', { v: 20, k: 'cf_test' });
      const memNow = BD.mem(pc, t);
      const b0 = A.NPCI.state(pc).b;
      CF.month(pc);
      const q = S.queue.find(x => /^cf_/.test(x.ev || ''));
      const spent = b0 - A.NPCI.state(pc).b;
      // answer it
      S.queue = [q].concat(S.queue.filter(x => x !== q));
      const v = A.eventView(q);
      A.eventChoose(0);
      const rank1 = CF.rank(pc, t.id);
      // the floor: their opinion of you does not fade below 10 x rank
      t.rel[pc.id].op = 2; CF.month(pc);
      const floor = t.rel[pc.id].op;
      // a second rank is not offered in the same year
      S.queue = []; A.NPCI.state(pc).b = 2; BD.add(pc, t, 'You stood godparent to the child', { v: 20, k: 'cf_test2' }); t.rel[pc.id].op = 60; CF.month(pc);
      const sameYear = S.queue.some(x => /^cf_/.test(x.ev || ''));
      // rank 2: the yearly gift comes in the bond's month
      pc.rel[t.id].cf = 2; pc.rel[t.id].cfY = S.year - 1;
      const coin0 = pc.coin, m = A.monthOf(A.today()).m, H = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
      const gm = H('cf|' + t.id) % 12;
      // in the bond's month the month hook gives it once; here it is given directly
      CF.gift(pc, t, pc.rel[t.id], 2);
      const gift = pc.coin - coin0;
      // pips on the People tab and in the person view, drawn purely
      const h0 = T.hash(S), r0 = A.rngState;
      UI.tab = 'people'; UI.render();
      const pips = !!document.querySelector('#tabbody .cf-pips');
      const modal = UI.personModal(t, '').includes('cf-line');
      return { before, early, memNow, ev: q && q.ev, text: v && v.text, spent, rank1, floor, sameYear, gift, gm, m, pips, modal, pure: T.hash(S) === h0 && A.rngState === r0 };
    });
    const ok = r.before === 0 && !r.early && r.ev === 'cf_friend_1' && !/\{/.test(r.text) && r.spent === 1 && r.rank1 === 1 && r.floor >= 10 && !r.sameYear && r.gift === 8 && r.pips && r.modal && r.pure;
    return { ok, detail: `history ${Math.round(r.memNow)}: ${r.ev} offered (none before the history: ${!r.early}), 21's budget spent ${r.spent}; rank after answering ${r.rank1}; opinion floor ${r.floor}; another rank the same year ${r.sameYear}; ` +
      `a rank-2 friend's yearly gift ${r.gift} suns (in month ${r.gm}); pips ${r.pips}, in the person view ${r.modal}; pure ${r.pure}; "${(r.text || '').slice(0, 80)}"` };
  },
};
