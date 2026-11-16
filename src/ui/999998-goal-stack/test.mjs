// 999998-goal-stack (B5 part 2, D-055): one ordered stack of goals and one card the Life page reads it from.
export default {
  // the Life page has one goals card, in score order, at most five rows, the chapter's own card (folded) after it; no Coming up strip and no
  // ambition card of their own; drawing it changes nothing
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
        out.push({ n, rows: L.length, cards: q('.whatnow'), li: q('.whatnow .wn-list > li'), strip: q('.cu-strip'), amb: q('.lf-amb'), chp: q('.chp-card'), chpAfter: q('.whatnow + .chp-card'),
          sorted: sc.every((v, i) => !i || sc[i - 1] >= v), pure: T.hash(A.S) === h0 && A.rngState === r0, kinds: L.map(x => x.kind).join(',') });
      }
      return out;
    });
    const bad = r.filter(x => !x.dead && (x.cards !== 1 || x.rows < 1 || x.rows > 5 || x.li !== x.rows || x.strip || x.amb || x.chp !== x.chpAfter || !x.sorted || !x.pure));
    return { ok: !bad.length && r.some(x => x.chpAfter), detail: bad.length ? JSON.stringify(bad) : r.map(x => x.dead ? x.n + ' dead' : `${x.n}: ${x.rows} rows (${x.kinds}), chapter ${x.chpAfter ? 'folded after it' : 'none'}`).join('; ') };
  },

  // each system keeps its data and speaks through the stack: a promise made in the open, the ambition, the chapter's next aim, a
  // custom, and a source another feature registers all come out in one order, and the same thing is never said twice
  async gsSources(pg) {
    const r = await pg.evaluate(() => {
      for (let seed = 8200; seed < 8210; seed++) { T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }); T.play(1); if (A.pc() && A.pc().alive) break; }
      const pc = A.pc(), S = A.S, LF = A.LF, t = Object.values(S.people).find(p => p.alive && p.id !== pc.id && A.isAdult(p));
      S.sched = (S.sched || []).filter(s => !(s && s.item && UI.COMING.schedLine(s.item, pc)));
      A.schedule({ type: 'event', ev: 'ni_borrow_repaid', ctx: { pid: t.id, amt: '12 suns' }, forced: true }, 20);
      const k = Object.keys(LF.AMB)[0]; pc.amb = { k, y: S.year };
      UI.GOALS.source('gsTest', () => [{ kind: 'now', score: 99, t: 'A test goal', why: 'registered by a feature', cls: '', go: 'life', act: null }, { kind: 'now', score: 98, t: 'A test goal', why: 'said twice', cls: '', go: 'life', act: null }]);
      const L = UI.GOALS.stack(pc);
      const kinds = L.map(x => x.kind), first = L[0], twice = L.filter(x => x.t === 'A test goal').length;
      const rows = L.map(x => x.kind + ':' + x.t);
      // the ambition's name is on the card and the chapter is a row too (when there is one)
      UI.tab = 'life'; UI.render();
      const txt = (document.querySelector('#tabbody .whatnow') || { textContent: '' }).textContent;
      return { kinds, first: first && first.t, twice, rows, repay: txt.includes('is due to repay 12 suns'), amb: txt.includes(LF.AMB[k].name), chapter: !!(pc.chap && pc.chap.cur) };
    });
    const ok = r.first === 'A test goal' && r.twice === 1 && r.repay && r.amb && r.kinds.length <= 5 && r.kinds.includes('promise') && r.kinds.includes('ambition');
    return { ok, detail: `${r.rows.join(' | ')}; the repayment ${r.repay}, the ambition ${r.amb}, the test source first ${r.first === 'A test goal'}, said twice once ${r.twice === 1}` };
  },
};
