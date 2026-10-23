// 89-fight-odds: a choice that starts a beast fight carries the fight's chance, on screen and nowhere else.
export default {
  async foBadge(pg) {
    const r = await pg.evaluate(async () => {
      const ids = ['bd_wild_boar', 'av_wild_village_bounty', 'av_wild_whitewyrm', 'bd_wild_hyenas', 'pf_bow_wolves'];
      const out = [];
      for (const id of ids) {
        A.newGame({ seed: 7103, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 17 });
        UI.screen = 'game';
        A.S.queue.unshift({ type: 'event', ev: id, ctx: {} });
        const v = A.eventView(A.S.queue[0]), e = A.EV[id];
        // which choices fight a beast, from the event itself
        const fights = v.choices.map(c => { const fx = e.choices[c.i] && e.choices[c.i].fx; return !!fx && (typeof fx === 'object' ? !!fx.beast : /\bbeast\s*:\s*\{/.test(String(fx))); });
        const s0 = JSON.stringify(A.S), g0 = JSON.stringify(A.rngState);
        UI.refresh(); await new Promise(res => setTimeout(res, 50));
        const pure = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === g0;
        const btn = [...document.querySelectorAll('.mbox button[data-a="evChoose"]')].map(b => (b.querySelector('.fo-fight') || {}).textContent || null);
        out.push({ id, fights, marked: v.choices.map(c => !!c.fight), pct: v.choices.map(c => c.fight ? c.fight.pct : null), oddsKept: v.choices.every((c, i) => !fights[i] || c.odds == null), btn, pure });
        A.S.queue.shift();
      }
      // with the numbers off, the badge still says it is a fight
      A.newGame({ seed: 7103, race: 'human', realm: 'POL-03', status: 'peasant', sex: 'M', startAge: 17 }); UI.screen = 'game';
      A.S.queue.unshift({ type: 'event', ev: 'bd_wild_boar', ctx: {} }); A.eventView(A.S.queue[0]);
      const was = UI.set.odds, dw = A.DIFF && A.DIFF.showOdds; UI.set.odds = false; if (A.DIFF) A.DIFF.showOdds = () => false;
      UI.refresh(); const plain = (document.querySelector('.mbox .fo-fight') || {}).textContent || null;
      UI.set.odds = was; if (A.DIFF) A.DIFF.showOdds = dw;
      // a strong fighter gets better odds against the same boar than a 17-year-old peasant
      const pc = A.pc(), weak = A.FL.resolve(pc, { scale: 'beast', beast: 'CRE-23' }, {}).pct;
      for (const k of ['str', 'spd', 'sta', 'ins', 'wil']) pc.st[k] = 95;
      for (const k of ['spear', 'melee', 'sword', 'athletics']) pc.skills[k] = 95;
      const strong = A.FL.resolve(pc, { scale: 'beast', beast: 'CRE-23' }, {}).pct;
      return { out, plain, weak, strong };
    });
    const bad = r.out.filter(o => o.fights.some((f, i) => f !== o.marked[i]) || !o.oddsKept || !o.pure ||
      o.marked.some((m, i) => m !== !!o.btn[i]) || o.pct.some(p => p != null && !(p >= 0 && p <= 100)));
    const ok = !bad.length && r.out.every(o => o.fights.some(Boolean)) && r.plain === 'a fight' && r.strong > r.weak;
    return { ok, detail: r.out.map(o => `${o.id}: ${o.btn.map(b => b || '-').join(' / ')}`).join('; ') +
      `; numbers off: "${r.plain}"; the boar for a peasant of 17 ${r.weak}%, for a strong fighter ${r.strong}%; checks untouched, drawing pure: ${!bad.length}${bad.length ? ' (bad: ' + bad.map(o => o.id).join(', ') + ')' : ''}` };
  },
  async foInLives(pg) {
    // every beast choice met in real bot lives is marked, and nothing else is
    const r = await pg.evaluate(() => {
      let seen = 0, marked = 0, wrong = 0, words = 0;
      const view = A.eventView;
      A.eventView = function (q) {
        const v = view.apply(this, arguments);
        try { const e = q && A.EV[q.ev]; if (e && v && v.choices) for (const c of v.choices) { const fx = e.choices[c.i] && e.choices[c.i].fx;
          const f = !!fx && (typeof fx === 'object' ? !!fx.beast : /\bbeast\s*:\s*\{/.test(String(fx)));
          if (f && c.odds == null) { seen++; if (c.fight) marked++; } else if (c.fight) wrong++;
          if (c.fight && c.fight.w !== A.FO.word(c.fight.pct)) words++; } } catch (err) {}
        return v;
      };
      try {
        for (let s = 0; s < 3; s++) {
          A.newGame({ seed: 8100 + s, race: 'human', realm: ['POL-03', 'POL-01', 'POL-18'][s], status: 'peasant', sex: 'M', startAge: 16 });
          for (let m = 0; m < 12 * 12 && A.pc().alive; m++) { A.advance(31); let g = 0, q; while ((q = A.headReady()) && g++ < 60) { if (q.type === 'event') { A.eventView(q); A.eventChoose(0); A.eventClose(); } else A.skipPrompt(); } }
        }
      } finally { A.eventView = view; }
      return { seen, marked, wrong, words };
    });
    return { ok: r.wrong === 0 && r.words === 0 && r.marked >= Math.ceil(r.seen * 0.8), detail: `${r.seen} beast-fight choices met in 36 years of three lives, ${r.marked} marked; marked without a fight ${r.wrong}; badge words off the scale ${r.words}` };
  },
};
