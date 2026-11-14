// Browser tests for event content fixes. Each test gets (page, pageErrors, {browser, file}).
export default {
  async tokens(pg) {
    // render every event's text and choices once, under a few different characters
    const r = await pg.evaluate(() => {
      const bad = new Map();
      for (const o of [{ race: 'human', realm: 'POL-01', status: 'noble', startAge: 30 }, { race: 'orc', realm: 'POL-11', status: 'peasant', startAge: 25 }, { race: 'human', realm: 'POL-05', status: 'merchant', startAge: 12 }]) {
        A.newGame(Object.assign({ seed: 99 }, o));
        for (const id of Object.keys(A.EV)) {
          let v; try { v = A.eventView({ type: 'event', ev: id }); } catch { continue; }
          if (!v || v.skip) continue; // the game drops these itself
          const s = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
          if (/\{[A-Za-z0-9_.]+\}/.test(s)) bad.set(id, s.match(/\{[A-Za-z0-9_.]+\}/)[0]);
        }
      }
      return [...bad].slice(0, 400);
    });
    return { ok: r.length === 0, detail: `${r.length} events would show an unfilled {token}` + (r.length ? ': ' + r.slice(0, 8).map(([i, t]) => `${i} ${t}`).join(', ') : '') };
  },

  // round 2 A0 (docs/CRITIQUE.md E10): the war room said "1 armies in the field · 1 battles raging"
  async warPlurals(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 5, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const pc = A.pc(), keep = { atWar: A.atWar, armiesOf: A.armiesOf }, f0 = A.S.fights, out = [];
      try {
        for (const [na, nf] of [[1, 1], [2, 3]]) {
          A.atWar = () => [{ id: 'w', leadA: 'x', leadD: 'y' }]; A.armiesOf = () => Array.from({ length: na }, (_, i) => ({ id: 'a' + i }));
          A.S.fights = Object.fromEntries(Array.from({ length: nf }, (_, i) => ['f' + i, { a: pc.realm, b: 'POL-02' }]));
          const h = UI.warTabClock(pc), d = document.createElement('div'); d.innerHTML = h;
          out.push({ line: (d.textContent.match(/\d+ arm\w+ in the field · \d+ battles? raging/) || [''])[0], tip: /warFront/.test(h) });
        }
      } finally { Object.assign(A, keep); A.S.fights = f0; }
      return { out, one: A.plural(1, 'army', 'armies'), many: A.plural(0, 'battle') };
    });
    const [a, b] = r.out;
    const ok = a.line === '1 army in the field · 1 battle raging' && b.line === '2 armies in the field · 3 battles raging' && a.tip && b.tip && r.one === '1 army' && r.many === '0 battles';
    return { ok, detail: `"${a.line}" (tooltip ${a.tip}); "${b.line}" (tooltip ${b.tip}); ${r.one}; ${r.many}` };
  },
};
