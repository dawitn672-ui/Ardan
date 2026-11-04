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
};
