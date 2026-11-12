// Both scales: a fight your division was in ends with a reckoning that shows it three ways, and the three disagree.
export default {
  async bothScalesReckoning(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 12, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 19 });
      const nb = A.neighbors('POL-01'); A.startWar('POL-01', nb[0] || 'POL-02', null, 'conquest');
      A.enlist(A.pc());
      let seen = null;
      for (let m = 0; m < 36 && A.pc().alive && !seen; m++) {
        A.advance(30);
        let g = 0, h;
        while ((h = A.headReady()) && g++ < 300) {
          if (h.type === 'event' && h.ev === 'bs_reckoning') { seen = h; break; }
          if (h.type === 'event') A.eventAuto();
          else if (h.type === 'choice') A.choiceChoose(0);
          else if (h.type === 'battle') A.battleClose();
          else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else A.S.queue.shift();
        }
      }
      if (!seen) return { seen: false };
      const c = seen.ctx;
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S);
      const html = UI.eventModal(seen);
      const pure = JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0;
      const div = document.createElement('div'); div.innerHTML = html; const txt = div.textContent;
      const panels = ['What you saw', 'The front', 'What the chronicle will say'].every(t => txt.includes(t));
      // the chronicle counts their dead high and ours low; the front has the true counts
      const disagree = c.theirsTold > c.deadTheirs && (c.deadOurs <= 1 || c.oursTold < c.deadOurs);
      const v = A.eventView(seen);
      return { seen: true, panels, pure, disagree, raw: /\{[a-z]/.test(txt), choices: v.choices.length, saw: c.saw, front: c.front, chron: c.chron };
    });
    if (!r.seen) return { ok: false, detail: 'no reckoning in three years of war as a soldier' };
    return { ok: r.panels && r.pure && r.disagree && !r.raw && r.choices >= 2,
      detail: `three panels ${r.panels}; render pure ${r.pure}; the chronicle disagrees with the front ${r.disagree}. Saw: "${r.saw}" Front: "${r.front}" Chronicle: ${r.chron}` };
  },
  async bothScalesRegistered(pg) {
    const r = await pg.evaluate(() => !!(A.SIGNATURE && A.SIGNATURE.bothScales));
    return { ok: r, detail: `A.SIGNATURE.bothScales ${r}` };
  },
};
