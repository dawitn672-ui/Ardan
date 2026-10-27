// The real clock, in real time: a newborn reaches a first event within seconds at the default speed, the life is the
// same day for day as one run without the hurry, and from age five the clock keeps its ordinary rate.
const RUN = async (pg, seed, speed, x) => {
  await pg.evaluate(([seed, speed, x]) => {
    T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 0 });
    UI.EARLY.X = x; UI.clk.speed = speed; window.__t0 = Date.now(); UI.clkStart();
  }, [seed, speed, x]);
  await pg.waitForFunction(() => !UI.clk.run, null, { timeout: 120000, polling: 200 });
  return pg.evaluate(() => {
    const q = A.S.queue[0];
    return { secs: (Date.now() - window.__t0) / 1000, day: A.absDay(), age: A.age(A.pc()), ev: q && q.type === 'event' ? q.ev : q && q.type, hash: T.hash(A.S), rng: JSON.stringify(A.rngState), note: /early years ×10/.test(document.getElementById('clk') ? document.getElementById('clk').innerText : '') };
  });
};

export default {
  async eyFirstEventFast(pg) {
    const out = [];
    for (const seed of [7001, 7002, 7004]) {
      const fast = await RUN(pg, seed, 2, 10);   // the default speed, early years on
      const ctl = await RUN(pg, seed, 5, 1);     // the fastest ordinary speed, early years off: the same days, sooner
      out.push({ seed, fast, ctl, same: fast.day === ctl.day && fast.ev === ctl.ev && fast.hash === ctl.hash && fast.rng === ctl.rng });
    }
    const ok = out.every(o => o.same && o.fast.secs < 45);
    return { ok, detail: out.map(o => `seed ${o.seed}: first stop day ${o.fast.day - 0} at age ${o.fast.age} (${o.fast.ev}) after ${o.fast.secs.toFixed(1)}s at speed 2 (would be ${(o.fast.secs * 10).toFixed(0)}s); same life as without: ${o.same}`).join('; ') };
  },
  async eyBands(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7010, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 });
      UI.clk.speed = 2; const rows = [];
      const look = () => { const was = UI.clk.run; UI.clk.run = true; const n = UI.earlyNote(); UI.clk.run = was; rows.push([A.age(A.pc()), UI.clkRate(), (n.match(/>([^<]+)</) || [])[1] || '']); };
      look(); for (const to of [6, 11, 16]) { T.play(to - A.age(A.pc())); if (!A.pc().alive) break; look(); }
      return rows;
    });
    const want = [[40, 'early years ×10'], [12, 'childhood ×3'], [6, 'youth ×1.5'], [4, '']];
    const ok = r.length === 4 && r.every((x, i) => x[1] === want[i][0] && x[2] === want[i][1]);
    return { ok, detail: r.map(([a, v, n]) => `age ${a}: ${v} days a second${n ? ', "' + n + '"' : ', no note'}`).join('; ') };
  },

  // first-hour I9: "early years ×10" stood beside Week and Month, which it does not speed. It shows only while Play runs.
  async eyNoteOnlyPlaying(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7020, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 0 });
      const still = UI.earlyNote(), inBar = /early years/.test(UI.clkHtml());
      UI.clk.run = true; const running = UI.earlyNote(); UI.clk.run = false;
      return { still, inBar, running };
    });
    const ok = !r.still && !r.inBar && /early years ×10/.test(r.running);
    return { ok, detail: `clock still: note "${r.still}", in the bar ${r.inBar}; clock running: "${(r.running.match(/>([^<]+)</) || [])[1] || ''}"` };
  },
};
