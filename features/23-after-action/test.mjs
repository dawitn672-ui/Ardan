// After-action reports: every battle gets one, its causes point the right way, and the screen shows it.
const SETUP = () => {
  A.newGame({ seed: 23, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
  // a battle with hand-set troops: lines = [[code, men, wing, tactic]]
  window.AARB = (o) => {
    const B = A.newBattle({ title: o.title || 'Battle of the Test Field', terr: o.terr || 'plains', weather: o.weather || 'clear',
      sideA: { realm: 'POL-01', men: 1000, q: o.qA || 0.9, cmdSkill: o.cA || 45 }, sideB: { realm: 'POL-03', men: 1000, q: o.qB || 0.9, cmdSkill: o.cB || 45 } });
    if (o.cA) B.sides.A.cmdSkill = o.cA; if (o.cB) B.sides.B.cmdSkill = o.cB;
    for (const [k, lines] of [['A', o.a], ['B', o.b]]) if (lines) {
      const T = c => GD.TROOPS[c];
      B.sides[k].units = lines.map(([code, men, wing, tac], i) => ({ id: k + i, code, name: T(code).name, men, men0: men, q: k === 'A' ? (o.qA || 0.9) : (o.qB || 0.9),
        morale: T(code).morale + 30, fat: 0, wing, tac: tac || 'hold', status: 'ok', once: {}, killed: 0 }));
      B.sides[k].men0 = lines.reduce((a, l) => a + l[1], 0);
    }
    B.deployDone = true; B.phase = 'press';
    A.S.queue.unshift({ type: 'battle', b: B });
    // keep the hand-set tactics: fight pulse by pulse without redeploying
    for (let g = 0; B.phase !== 'end' && g < 20; g++) A.battleStep();
    A.S.queue.shift();
    return B;
  };
  window.AARC = (B, label) => { const c = B.aar.causes.find(x => x.label === label); return c ? c.pct : 0; };
};

export default {
  async aarEveryBattle(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const terrs = ['plains', 'hills', 'forest', 'marsh', 'mountains'], wx = ['clear', 'rain', 'fog', 'wind', 'overcast'];
      const foes = ['POL-03', 'POL-11', 'POL-13', 'POL-20', 'POL-22', 'POL-05'];
      let n = 0, bad = [], withThree = 0;
      for (let i = 0; i < 48; i++) {
        const B = A.newBattle({ title: 'Battle of Field ' + i, terr: terrs[i % 5], weather: wx[(i * 3) % 5],
          sideA: { realm: 'POL-01', men: 800 + (i * 937) % 9000, q: 0.7 + (i % 5) * 0.1 }, sideB: { realm: foes[i % 6], men: 800 + (i * 613) % 9000, q: 0.9 } });
        B.pcSide = i % 2 ? 'A' : 'B';
        A.S.queue.unshift({ type: 'battle', b: B }); A.battleAuto(B); A.S.queue.shift();
        n++;
        const R = B.aar;
        const ok = R && Array.isArray(R.causes) && R.causes.length >= 1 && R.causes.length <= 3 && typeof R.text === 'string' && R.text.length > 20 &&
          R.causes.every(c => typeof c.label === 'string' && Number.isInteger(c.pct) && c.pct !== 0 && Math.abs(c.pct) <= 300) && !/NaN|undefined|Infinity/.test(JSON.stringify(R));
        if (!ok) bad.push(B.title + ' ' + JSON.stringify(R));
        if (R && R.causes.length === 3) withThree++;
      }
      return { n, bad: bad.slice(0, 3), withThree };
    });
    return { ok: r.bad.length === 0 && r.withThree >= r.n * 0.8, detail: `${r.n} battles, ${r.withThree} with three causes; bad: ${r.bad.join(' / ') || 'none'}` };
  },

  // Each measured cause moves with its lever: numbers, the ground, tactics, the weather, command.
  async aarCausesPointRight(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const L = (code, men) => [[code, men, 'L'], [code, men, 'C'], [code, men, 'R']];
      const avg = (f, n = 12) => { let s = 0; for (let i = 0; i < n; i++) s += f(i); return s / n; };
      const out = {};
      // numbers: twice the men is a big plus, equal men is near zero
      out.numbers2x = avg(() => AARC(AARB({ a: L('SP', 1200), b: L('SP', 600) }), 'Numbers'));
      out.numbersEq = avg(() => AARC(AARB({ a: L('SP', 800), b: L('SP', 800) }), 'Numbers'));
      // the ground: horse in the forest is slowed (a minus for the rider), on open plain it is not named
      out.groundForest = avg(() => AARC(AARB({ terr: 'forest', a: L('HC', 400), b: L('SP', 700) }), 'The ground'));
      out.groundPlain = avg(() => AARC(AARB({ terr: 'plains', a: L('HC', 400), b: L('SP', 700) }), 'The ground'));
      // drill meets the charge: a pike hedge against couched lances shows as a plus for the pikes
      out.pikes = avg(() => { const B = AARB({ a: [['PK', 900, 'L', 'pikehedge'], ['PK', 900, 'C', 'pikehedge'], ['PK', 900, 'R', 'pikehedge']], b: [['HC', 300, 'L', 'lance'], ['HC', 300, 'C', 'lance'], ['HC', 300, 'R', 'lance']] });
        return AARC(B, 'Your pike hedge'); });
      // rain spoils archers (a minus for the side with bows)
      out.rain = avg(() => { const B = AARB({ weather: 'rain', a: [['AR', 600, 'L'], ['SP', 600, 'C'], ['AR', 600, 'R']], b: L('SP', 600) });
        return (B.aarT.A.weather - B.aarT.B.weather); });
      // command: a far better general is a plus
      out.command = avg(() => AARC(AARB({ cA: 95, cB: 10, a: L('SP', 800), b: L('SP', 800) }), 'Command'));
      return out;
    });
    const ok = r.numbers2x >= 10 && Math.abs(r.numbersEq) < 2 && r.groundForest <= -5 && r.groundPlain === 0 && r.pikes >= 5 && r.rain < 0 && r.command >= 5;
    return { ok, detail: Object.entries(r).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(', ') };
  },

  // The report's shares track what really happens when a lever is pulled, within a factor of two.
  async aarCalibrated(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const L = (code, men) => [[code, men, 'L'], [code, men, 'C'], [code, men, 'R']];
      // the ground: what the report says the forest cost the riders, against the kills they really lost moving from plain to forest
      let said = 0, plainK = 0, forestK = 0, n = 30;
      for (let i = 0; i < n; i++) {
        const F = AARB({ terr: 'forest', a: L('HC', 300), b: L('SP', 900) }), P = AARB({ terr: 'plains', a: L('HC', 300), b: L('SP', 900) });
        said += -F.aarT.A.ground; forestK += F.aarT.A.melee; plainK += P.aarT.A.melee;
      }
      // a pike hedge: what the report credits it with, against the swing in kills when the same pikes just hold
      let tSaid = 0, tReal = 0;
      const pk = tac => [['PK', 900, 'L', tac], ['PK', 900, 'C', tac], ['PK', 900, 'R', tac]], hc = [['HC', 300, 'L', 'lance'], ['HC', 300, 'C', 'lance'], ['HC', 300, 'R', 'lance']];
      for (let i = 0; i < n; i++) {
        const H = AARB({ a: pk('pikehedge'), b: hc }), N = AARB({ a: pk('hold'), b: hc });
        tSaid += Object.values(H.aarT.A.tac).reduce((x, e) => x + e.v, 0);
        tReal += (H.aarT.A.melee - N.aarT.A.melee) + (N.aarT.B.melee - H.aarT.B.melee);
      }
      return { said: said / n, lost: (plainK - forestK) / n, tSaid: tSaid / n, tReal: tReal / n };
    });
    // the report counts the first-order cost only; the real loss compounds over pulses (fewer kills, so less morale damage)
    const ratio = r.lost > 0 ? r.said / r.lost : 0, tRatio = r.tReal > 0 ? r.tSaid / r.tReal : 0;
    return { ok: ratio >= 0.5 && ratio <= 2 && tRatio >= 0.5 && tRatio <= 2,
      detail: `forest cost: said ${Math.round(r.said)} kills, measured ${Math.round(r.lost)} (ratio ${Math.round(ratio * 100) / 100}); ` +
        `pike hedge against lances: said ${Math.round(r.tSaid)}, measured ${Math.round(r.tReal)} (ratio ${Math.round(tRatio * 100) / 100})` };
  },

  async aarScreenAndLog(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const B = A.newBattle({ title: 'Battle of <b>Ash</b> Ford', terr: 'hills', weather: 'rain', sideA: { realm: 'POL-01', men: 4000, q: 0.9 }, sideB: { realm: 'POL-03', men: 3000, q: 0.9 } });
      A.S.queue.unshift({ type: 'battle', b: B }); A.battleAuto(B);
      const before = JSON.stringify(A.S.rng), hash0 = T.hash(A.S);
      UI.renderModal ? UI.renderModal() : UI.render();
      const html = UI.battleModal(B);
      const pure = JSON.stringify(A.S.rng) === before && T.hash(A.S) === hash0;
      const shown = html.includes('After-action report') && B.aar.causes.every(c => html.includes(UI.esc(c.label))) && !html.includes('<b>Ash</b>');
      A.battleClose();
      const logged = JSON.stringify(A.S.log.slice(-3)).includes('the captains reckon it');
      return { pure, shown, logged, causes: B.aar.causes };
    });
    return { ok: r.pure && r.shown && r.logged, detail: `render pure ${r.pure}; on screen ${r.shown}; in the story log ${r.logged}; ${JSON.stringify(r.causes)}` };
  },

  // The war map: multi-day division fights get a report on the war's record, and the war view says what decided them.
  async aarWarMap(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const nb = A.realm('POL-01').neighbors || []; A.startWar('POL-01', nb[0] || 'POL-02', null, 'conquest');
      const seen = new Map();
      for (let m = 0; m < 18; m++) {
        A.advance(30);
        let g = 0, h; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        for (const w of A.S.wars) for (const bt of w.battles) seen.set(w.id + bt.name + bt.y + bt.lossW, bt);
      }
      const all = [...seen.values()], fights = all.filter(b => b.days && b.lossW + b.lossL > 0);
      const good = fights.filter(b => Array.isArray(b.aar) && b.aar.every(c => c.label && Number.isInteger(c.pct))), named = good.filter(b => b.aar.length).length;
      const why = fights.filter(b => A.aarWhy(b)).length;
      // one side's report is the other's, mirrored
      const F = { loc: 0, aarT: { ground: -50, winter: 0, walls: -30, qual: 10, dead: 400, tac: { 'shock|spearwall|countered': -60 }, caught: 1, rout: 'att' } };
      const ra = A.aarFight(F, true), rd = A.aarFight(F, false);
      const mirrored = ra.causes.every(c => rd.causes.some(d => d.pct === -c.pct));
      return { named, fights: fights.length, good: good.length, why, mirrored, sample: good.slice(0, 2).map(b => b.name + A.aarWhy(b)), text: ra.text };
    });
    return { ok: r.fights >= 10 && r.good === r.fights && r.named >= r.fights * 0.9 && r.why >= r.fights * 0.5 && r.mirrored,
      detail: `${r.fights} war-map fights, ${r.good} with a report (${r.named} naming a cause), ${r.why} with a deciding cause; mirrored ${r.mirrored}; e.g. ${r.sample.join(' / ')}` };
  },

  // A soldier in the war gets the reckoning in the story log, for line battles and war-map fights alike.
  async aarSoldierLog(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 12, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 19 });
      const nb = A.realm('POL-01').neighbors || []; A.startWar('POL-01', nb[0] || 'POL-02', null, 'conquest');
      A.enlist(A.pc());
      let lines = [];
      for (let m = 0; m < 30 && A.pc().alive; m++) {
        A.advance(30);
        let g = 0, h;
        while ((h = A.headReady()) && g++ < 300) {
          if (h.type === 'event') A.eventAuto();
          else if (h.type === 'battle') A.battleClose();
          else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else A.S.queue.shift();
        }
      }
      for (const e of A.S.log) for (const l of e.lines || []) if (/the captains reckon it/.test(l[0])) lines.push(l[0]);
      return { mil: !!A.pc().mil, n: lines.length, sample: lines.slice(0, 2) };
    });
    return { ok: r.mil && r.n >= 1, detail: `soldier ${r.mil}; ${r.n} reckonings in the story log; e.g. ${r.sample.join(' / ')}` };
  },

  async aarDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => { A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        const B = A.newBattle({ title: 'Battle of Same', terr: 'forest', sideA: { realm: 'POL-01', men: 3000 }, sideB: { realm: 'POL-11', men: 3500 } });
        A.S.queue.unshift({ type: 'battle', b: B }); A.battleAuto(B); return JSON.stringify([B.aar, A.S.rng, B.dead]); };
      return run() === run();
    });
    return { ok: r, detail: r ? 'same seed, same battle, same report' : 'reports differ between identical runs' };
  },
};
