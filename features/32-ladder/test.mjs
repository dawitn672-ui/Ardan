// The ladder census: a long world stays within the lore's caps, and the Codex shows the living ladder.
export default {
  async ladderCensus(pg) {
    const r = await pg.evaluate(() => {
      let peakL = 0, peakM = 0, worst = '';
      for (const seed of [77, 78]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
        const end = A.S.year + 40;
        for (let k = 0; k < 40000 && A.S.year < end; k++) {
          A.advance(60); let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
          if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
          if (k % 6 === 0) { const C = A.ladderCensus(); peakL = Math.max(peakL, C.legends.length);
            for (const [rid, l] of Object.entries(C.masters)) if (l.length > peakM) { peakM = l.length; worst = rid; } }
        }
      }
      return { peakL, peakM, worst, capL: GD.LEGEND_CAP, capM: GD.MASTER_CAP };
    });
    return { ok: r.peakL <= r.capL && r.peakM <= r.capM, detail: `two 40-year worlds: at most ${r.peakL} Legends alive (cap ${r.capL}), at most ${r.peakM} Masters in one realm (${r.worst}; cap ${r.capM})` };
  },

  async ladderCap(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 79, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      // fill a realm to the cap with Masters, then raise another order there
      const rid = 'POL-01', R = A.realm(rid);
      const keep = A.ladderCensus; let fake = GD.MASTER_CAP;
      A.ladderCensus = () => { const C = keep(); C.masters[rid] = Array(fake).fill('x'); return C; };
      const ids = Object.keys(GD.ORDERS).filter(k => !(R.orders || {})[k]);
      let worths = [];
      try { for (const id of ids.slice(0, 3)) { const d = A.orderRaise(R, id); if (d) { const L = A.P(d.cmd); if (L) worths.push(A.fightWorth(L)); } } }
      finally { A.ladderCensus = keep; }
      return { worths, room: A.ladderRoom(rid) };
    });
    return { ok: r.worths.length > 0 && r.worths.every(w => w < 91), detail: `order leaders raised in a full realm have worth ${r.worths.join(', ')} (Master is 91+)` };
  },

  async ladderPage(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 80, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 25 });
      UI.tab = 'codex'; UI.codex = 'power';
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S);
      UI.render(); const txt = document.getElementById('app').textContent;
      return { shown: /Legends alive in Ardan: \d+ of a possible/.test(txt), pure: JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0 };
    });
    return { ok: r.shown && r.pure, detail: `living ladder shown ${r.shown}; render pure ${r.pure}` };
  },
};
