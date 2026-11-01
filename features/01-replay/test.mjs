// Browser tests for deterministic replay. Each test gets (page, pageErrors, {browser, file}).
export default {
  async renderRng(pg) {
    // drawing the screen must never touch the game's random stream
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      T.play(3);
      const before = A.rngState, h0 = T.hash(A.S);
      T.renderAll();
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc);
      for (const p of ppl.slice(0, 60)) { A.fightWorth(p); UI.tierChip && UI.tierChip(p); }
      return { rngMoved: A.rngState !== before, stateChanged: T.hash(A.S) !== h0 };
    });
    return { ok: !r.rngMoved, detail: `random stream moved by rendering: ${r.rngMoved}; state changed by rendering: ${r.stateChanged}` };
  },

  async replayWithRender(pg) {
    // the same seed and choices must reach the same world whether or not the player looked at people
    const r = await pg.evaluate(() => {
      const run = (look) => {
        T.enter({ seed: 777, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 18 });
        T.play(6, { each: () => { if (look) T.renderAll(); } });
        T.renderAll(); // both runs draw once at the end, so harmless first-draw setup (an empty cargo hold) matches
        return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState;
      };
      return { a: run(false), b: run(true) };
    });
    return { ok: r.a === r.b, detail: r.a === r.b ? 'same world' : `worlds differ (${r.a} vs ${r.b})` };
  },

  async journalReplay(pg) {
    // the game's own replay (what problem reports use) must reach the same world even if the player looked around
    const r = await pg.evaluate(() => {
      A.J = null; A.journalStart();
      T.enter({ seed: 31337, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 17 });
      const end = A.S.year + 4;
      for (let k = 0; k < 3000 && A.S.year < end && A.pc().alive; k++) {
        A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        T.renderAll();
      }
      const want = T.hash(JSON.parse(A.serialize())), J = JSON.parse(JSON.stringify(A.J));
      const res = A.replay(J);
      T.renderAll(); // the original run ended with a draw too
      const same = T.hash(JSON.parse(A.serialize())) === want;
      // a journal without a game start, saved and loaded: its base must be the state it can replay from
      A.journalResume(null); T.play(1);
      const d = { S: JSON.parse(A.serialize()), J: JSON.parse(JSON.stringify(A.J)) };
      T.play(1); A.deserialize(d.S); A.journalResume(d.J);
      const baseOk = !!(A.J.o || A.J.base === A.fingerprint(A.jBase));
      return { ok: res.ok, why: res.why, at: res.at, steps: J.e.length, same, baseOk };
    });
    return { ok: r.ok && r.same && r.baseOk, detail: (r.ok ? `${r.steps} journal entries replayed, world ${r.same ? 'identical' : 'DIFFERENT'}` : `replay stopped at entry ${r.at}: ${r.why}`) + `; reloaded journal's base matches: ${r.baseOk}` };
  },
};
