// 999998-goal-stack (B5 part 2, D-055; P3, order 54, D-062): one ordered stack of what the player has taken on (debts,
// favours owed, promises made in the open), and one card the Life page reads it from. Nothing is suggested.
export default {
  // the Life page has at most one card, in score order, at most five rows, only debts, favours and promises; no Coming
  // up strip, no ambition or chapter card; drawing it changes nothing
  async gsOneCard(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const [n, o, y] of [['noble', { seed: 8106, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 38 }, 3], ['peasant', { seed: 8107, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 25 }, 4],
        ['child', { seed: 8108, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 9 }, 1], ['newborn', { seed: 8109, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 }, 0]]) {
        T.enter(o); if (y) T.play(y);
        const pc = A.pc(); if (!pc.alive) { out.push({ n, dead: true }); continue; }
        A.S.queue = []; UI.ov = null;
        const h0 = T.hash(A.S), r0 = A.rngState;
        UI.tab = 'life'; UI.render();
        const L = UI.GOALS.stack(pc), q = s => document.querySelectorAll('#tabbody ' + s).length;
        const sc = L.map(x => x.score);
        out.push({ n, rows: L.length, cards: q('.whatnow'), li: q('.whatnow .wn-list > li'), strip: q('.cu-strip'), amb: q('.lf-amb'), chp: q('.chp-card'),
          kindsOk: L.every(x => ['debt', 'favour', 'promise'].includes(x.kind)), sorted: sc.every((v, i) => !i || sc[i - 1] >= v), pure: T.hash(A.S) === h0 && A.rngState === r0, kinds: L.map(x => x.kind).join(',') });
      }
      return out;
    });
    const bad = r.filter(x => !x.dead && (x.cards !== (x.rows ? 1 : 0) || x.rows > 5 || x.li !== x.rows || x.strip || x.amb || x.chp || !x.kindsOk || !x.sorted || !x.pure));
    return { ok: !bad.length, detail: bad.length ? JSON.stringify(bad) : r.map(x => x.dead ? x.n + ' dead' : `${x.n}: ${x.rows} rows (${x.kinds || 'nothing taken on'})`).join('; ') };
  },

  // what the player took on comes out in one order (a debt, a favour owed, a repayment promised, a source a feature
  // registers), said once; and none of What now's suggestions, no ambition, no custom or feast day is handed to him
  async gsSources(pg) {
    const r = await pg.evaluate(() => {
      for (let seed = 8200; seed < 8210; seed++) { T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }); T.play(1); if (A.pc() && A.pc().alive) break; }
      const pc = A.pc(), S = A.S, t = Object.values(S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p));
      S.sched = (S.sched || []).filter(s => !(s && s.item && UI.COMING.schedLine(s.item, pc)));
      A.schedule({ type: 'event', ev: 'ni_borrow_repaid', ctx: { pid: t.id, amt: '12 suns' }, forced: true }, 20);
      pc.debt = 40; pc.owes = { [t.id]: 1 };
      pc.amb = { k: 'wealth', y: S.year };          // an old save's ambition is not shown
      UI.GOALS.source('gsTest', () => [{ kind: 'promise', score: 99, t: 'A test goal', why: 'registered by a feature', cls: '', go: 'life', act: null }, { kind: 'promise', score: 98, t: 'A test goal', why: 'said twice', cls: '', go: 'life', act: null }]);
      const L = UI.GOALS.stack(pc);
      const kinds = L.map(x => x.kind), first = L[0], twice = L.filter(x => x.t === 'A test goal').length;
      const rows = L.map(x => x.kind + ':' + x.t);
      const wn = (A.whatNow ? A.whatNow(pc) : []).map(x => x.t);
      UI.tab = 'life'; UI.render();
      const txt = (document.querySelector('#tabbody .whatnow') || { textContent: '' }).textContent;
      return { kinds, first: first && first.t, twice, rows, wn, repay: txt.includes('is due to repay 12 suns'), debt: /owe .*moneylenders/.test(txt), favour: txt.includes('a favour'),
        handed: wn.filter(t => t && txt.includes(t)), amb: /fortune|ambition/i.test(txt), feast: /feast day|holy day/.test(txt) };
    });
    const ok = r.first === 'A test goal' && r.twice === 1 && r.repay && r.debt && r.favour && !r.handed.length && !r.amb && !r.feast && r.kinds.length <= 5;
    return { ok, detail: `${r.rows.join(' | ')}; What now would have handed: ${r.wn.join(' / ') || 'nothing'} (shown: ${r.handed.length}); ambition ${r.amb}, feast ${r.feast}` };
  },
};
