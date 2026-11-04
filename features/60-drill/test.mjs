// Drill linked to battle tactics: the counters in the resolver, the gate for the player and the AI, the month in camp,
// saves old and new, the report in words, and the screens.
import { DRILL_LAB } from './lab.mjs';

const fresh = () => A.newGame({ seed: 23, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });

export default {
  // A drilled shield wall against couched lances, over many seeded fights at odds that vary with the seed. The other
  // arm is the same spearmen with the wall never drilled (so not offered: they hold), on the same seeds.
  async drillWallVsCharge(pg) {
    await pg.evaluate(DRILL_LAB);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 23, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const L = DRLAB.line, R = DRLAB.rec, n = 100;
      const wall = (tac, v) => ({ a: L('SP', 0, tac), b: L('HC', 300, 'lance'), dlA: v == null ? null : R(v), dlB: R(0.4) });
      const arm = (tac, v) => { const blocks = []; let w = 0, dA = 0, dB = 0;
        for (let b = 0; b < 5; b++) { let bw = 0, bA = 0;
          for (let j = 0; j < n / 5; j++) { const i = b * n / 5 + j, o = wall(tac, v); o.a = L('SP', 450 + (i * 37) % 350, tac);
            const B = DRLAB.fight(o, 7000 + i); if (B.winner === 'A') { w++; bw++; } dA += B.dead.A; dB += B.dead.B; bA += B.dead.A; }
          blocks.push({ win: bw / (n / 5), dA: bA / (n / 5) }); }
        return { win: w / n, dA: dA / n, dB: dB / n, blocks }; };
      const D = arm('shieldwall', 0.7), N = arm('hold', 0.05), H = arm('shieldwall', 0.25);
      const gaps = D.blocks.map((x, i) => [Math.round(100 * (x.win - N.blocks[i].win)), Math.round(100 * (x.dA / N.blocks[i].dA - 1))]);
      // the lances against the drilled wall, in the report
      const B = DRLAB.fight({ a: L('SP', 600, 'shieldwall'), b: L('HC', 300, 'lance'), dlA: R(0.7), dlB: R(0.4) }, 4242);
      return { dWin: Math.round(100 * D.win), nWin: Math.round(100 * N.win), hWin: Math.round(100 * H.win), dA: Math.round(D.dA), nA: Math.round(N.dA), hA: Math.round(H.dA), gaps, text: B.aar ? B.aar.text : '' };
    });
    const win = r.dWin - r.nWin, dead = Math.round(100 * (r.dA / r.nA - 1));
    const ok = win >= 10 && win <= 35 && dead <= -10 && dead >= -45 && r.gaps.every(g => g[0] > 0 && g[1] < 0) && r.hWin >= r.nWin && r.hWin <= r.dWin;
    return { ok, detail: `100 fights: drilled wall wins ${r.dWin}%, half-drilled ${r.hWin}%, never drilled ${r.nWin}% (gap ${win} points); spearmen lost ${r.dA} / ${r.hA} / ${r.nA} (${dead}%); ` +
      `per block of 20 [win points, dead %]: ${r.gaps.map(g => g.join('/')).join(' ')}; report: "${r.text.slice(-160)}"` };
  },

  // The gate: a formation the men never drilled is not offered to the player and not chosen by the AI, on the line and on the map.
  async drillGate(pg) {
    await pg.evaluate(DRILL_LAB);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const R = DRLAB.rec, mk = v => {
        const B = A.newBattle({ title: 'Battle of the Gate', terr: 'plains', sideA: { realm: 'POL-01', men: 6000, dr: R(v) }, sideB: { realm: 'POL-22', men: 6000, dr: R(v) } });
        return B; };
      // the player: the menu and A.battleSetTactic
      const raw = mk(0.05), good = mk(0.5), wingOf = (B, s) => ['L', 'C', 'R'].find(w => D0(B, s, w).some(k => A.DRILL.LINE[k] === 'shields')) || 'C';
      const D0 = (B, s, w) => A.DRILL.allTactics(B, s, w);
      const wr = wingOf(raw, 'A'), wg = wingOf(good, 'A');
      const rawOpts = A.tacticsFor(raw, 'A', wr), goodOpts = A.tacticsFor(good, 'A', wg), allOpts = D0(raw, 'A', wr);
      const lockedTac = allOpts.find(k => A.DRILL.LINE[k] === 'shields');
      raw.pcSide = 'A'; A.S.queue.unshift({ type: 'battle', b: raw });
      A.battleSetTactic(wr, lockedTac);
      const refused = raw.sides.A.units.filter(u => u.wing === wr).every(u => u.tac !== lockedTac);
      A.S.queue.shift();
      // the AI: 40 deployments each way; count drill-gated picks
      let aiRaw = 0, aiGood = 0;
      for (let i = 0; i < 40; i++) {
        for (const [v, inc] of [[0.05, x => aiRaw += x], [0.6, x => aiGood += x]]) {
          const B = mk(v); A.aiDeploy(B, 'A');
          inc(B.sides.A.units.concat(B.sides.B.units).filter(u => A.DRILL.LINE[u.tac]).length);
        }
      }
      // the war map: the same divisions, never drilled and drilled
      const divs = A.realm('POL-01').forces.divs.slice(0, 3);
      const save = divs.map(d => d.dr);
      const P = A.S.prov.find(p => p.terr === 'plains') || A.S.prov[0], F = { days: 1 };
      const availD = v => { for (const d of divs) { d.dr = R(v); } const c = A.sideMake(divs); return A.WTAC_KEYS.d.filter(k => A.WTAC[k].ok(c, P, F, false, 0, 0)); };
      const mapRaw = availD(0.05), mapGood = availD(0.5);
      divs.forEach((d, i) => { d.dr = save[i]; });
      return { wr, lockedTac, rawOpts, goodOpts, refused, aiRaw, aiGood, mapRaw, mapGood };
    });
    const gatedLine = r.lockedTac && !r.rawOpts.some(k => ['shieldwall', 'spearwall', 'setspear', 'pikehedge'].includes(k)) && r.goodOpts.includes(r.lockedTac);
    const gatedMap = !r.mapRaw.includes('spearwall') && !r.mapRaw.includes('shieldwall') && r.mapGood.includes('spearwall') && r.mapGood.includes('shieldwall');
    return { ok: gatedLine && r.refused && r.aiRaw === 0 && r.aiGood > 0 && gatedMap,
      detail: `line, wing ${r.wr}: never drilled offers ${r.rawOpts.join(',')}; drilled offers ${r.goodOpts.join(',')}; the player's order for ${r.lockedTac} refused ${r.refused}; ` +
        `AI units on drill-gated tactics in 40 deployments: never drilled ${r.aiRaw}, drilled ${r.aiGood}; map defences never drilled ${r.mapRaw.join(',')} / drilled ${r.mapGood.join(',')}` };
  },

  // AI divisions drill in camp by what they are and their general's temper, the player's army by his focus, and all fades.
  async drillMonthInCamp(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 41, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const all = () => Object.values(A.S.realms).flatMap(r => (r.forces && r.forces.divs) || []);
      const noRec = all().filter(d => !d.dr).length;
      const foot = all().find(d => A.DRILL.doctrine(d, null)[0] === 'shields'), horse = all().find(d => ['charge', 'feint'].includes(A.DRILL.doctrine(d, null)[0]));
      const s0 = A.DRILL.of(foot).shields, f0 = A.DRILL.of(foot).charge;
      for (let m = 0; m < 24; m++) A.DRILL.month(null);
      const s1 = foot.dr.shields, f1 = foot.dr.charge;
      // temper (38-orders): the same division under a bold and a cautious general
      const temp = !!(A.GENERALS && A.GENERALS.of);
      const bold = A.DRILL.doctrine(foot, { gtForce: 'bold' }), caut = A.DRILL.doctrine(foot, { gtForce: 'cautious' });
      return { noRec, s0, s1, f0, f1, horse: horse ? A.DRILL.doctrine(horse, null) : null, temp, bold, caut };
    });
    const ok = r.s1 > r.s0 + 0.05 && r.f1 <= r.f0 && (!r.temp || r.bold.join() !== r.caut.join());
    return { ok, detail: `${r.noRec} divisions start with no record (read as their kind's default); a foot division's shield walls ${r.s0} -> ${r.s1} in two years in camp, its charge ${r.f0} -> ${r.f1}; ` +
      `horse doctrine ${r.horse}; 38-orders present ${r.temp}: bold ${r.bold}, cautious ${r.caut}` };
  },

  // A save keeps every drill record; a save from before (no d.dr, no u.dl) loads and plays.
  async drillSaves(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      T.play(1);
      const B = A.newBattle({ title: 'Battle of the Ledger', terr: 'plains', sideA: { realm: 'POL-01', men: 4000 }, sideB: { realm: 'POL-02', men: 4000 } });
      A.S.queue.push({ type: 'battle', b: B });
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      const recs = S => JSON.stringify(Object.values(S.realms).map(r => ((r.forces && r.forces.divs) || []).map(x => x.dr)));
      const same = recs(A.S) === recs(d.S) && JSON.stringify(d.S.queue.find(q => q.type === 'battle').b.sides.A.units[0].dl) === JSON.stringify(B.sides.A.units[0].dl);
      // an old save: no records anywhere
      const old = JSON.parse(JSON.stringify(A.S));
      for (const r of Object.values(old.realms)) for (const x of (r.forces && r.forces.divs) || []) delete x.dr;
      for (const q of old.queue) if (q.type === 'battle') for (const k of ['A', 'B']) for (const u of q.b.sides[k].units) delete u.dl;
      const enc2 = await SAVES.encode(old, A.J), d2 = await SAVES.decode(enc2.bytes);
      A.S = d2.S; A.rngState = A.S.rng | 0; A._idIdx = null;
      const ob = A.S.queue.find(q => q.type === 'battle').b;
      const ungated = ['L', 'C', 'R'].every(w => A.tacticsFor(ob, 'A', w).join() === A.DRILL.allTactics(ob, 'A', w).join());
      const div = A.realm('POL-01').forces.divs[0], read = A.DRILL.of(div);
      A.S.queue = A.S.queue.filter(q => q.type !== 'battle');
      const res = T.play(1);
      return { same, ungated, read: read.shields, after: div.dr ? div.dr.shields : null, res };
    });
    return { ok: r.same && r.ungated && r.read > 0 && r.after != null && r.res !== 'error',
      detail: `round trip keeps records ${r.same}; old save: a battle without unit drill is ungated (the release) ${r.ungated}, a division without a record reads its default ${r.read} and has a record ${r.after} after a year` };
  },

  // The report says what the drill did, in words, with the same number as the tactic's cause.
  async drillReportSaysIt(pg) {
    if (!(await pg.evaluate(() => typeof A.aarBuild === 'function'))) return { ok: true, detail: 'skipped: the report is 23-after-action\'s, not in this build' };
    await pg.evaluate(DRILL_LAB);
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 23, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const L = DRLAB.line, R = DRLAB.rec;
      let said = 0, n = 0, sample = '', match = 0, raw = '';
      for (let i = 0; i < 12; i++) {
        const B = DRLAB.fight({ a: L('PK', 500, 'pikehedge'), b: L('HC', 300, 'lance'), dlA: R(0.7), dlB: R(0.4) }, 900 + i);
        if (!B.aar) continue; n++;
        const d = (B.aar.drill || [])[0];
        if (d && /Their lances broke on a hard-drilled hedge/.test(B.aar.text)) { said++; sample = sample || d.label + ' ' + d.pct; }
        const c = B.aar.causes.find(x => x.label === 'Your pike hedge');
        if (c && d && c.pct === d.pct) match++;
      }
      // raw foot met by a charge
      const B2 = DRLAB.fight({ a: L('SP', 600, 'hold'), b: L('HC', 300, 'lance'), dlA: R(0.05), dlB: R(0.6) }, 77);
      raw = B2.aar ? B2.aar.text : '';
      return { said, n, sample, match, raw };
    });
    return { ok: r.n > 0 && r.said === r.n && r.match >= r.n - 1 && /never drilled a wall against horse/.test(r.raw),
      detail: `${r.said} of ${r.n} reports say "Their lances broke on a hard-drilled hedge" (${r.match} with the tactic's own figure), e.g. ${r.sample}; raw foot: "${r.raw.slice(-150)}"` };
  },

  // The battle screen, the drill yard and the war room show the drill; drawing them changes nothing; all escaped.
  async drillOnScreen(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc();
      A.enlist(pc); pc.mil.rank = 5; A.pcDivAttach && A.pcDivAttach(pc);
      const R = v => { const o = {}; for (const k of A.DRILL.FAMS) o[k] = v; return o; };
      const B = A.newBattle({ title: 'Battle of <i>Ink</i>', terr: 'plains', sideA: { realm: 'POL-01', men: 5000, dr: R(0.05) }, sideB: { realm: 'POL-22', men: 5000 } });
      B.pcSide = 'A'; A.S.queue.unshift({ type: 'battle', b: B });
      const div = A.myUnit(pc); if (div) div.name = 'The <b>Bold</b> Foot';
      // a first draw: the release's drill card fills pc.staff lazily (A.staffHolder) the first time it is drawn
      UI.battleModal(B); UI.drillCard(pc); UI.wrTacOrders(pc);
      const rng0 = A.rngState, h0 = T.hash(A.S);
      const bm = UI.battleModal(B), card = UI.drillCard(pc), orders = UI.wrTacOrders(pc);
      UI.render();
      const pure = A.rngState === rng0 && T.hash(A.S) === h0;
      A.S.queue.shift();
      return { pure, note: /Never drilled, so not offered/.test(bm), tag: / · (drilled|half-drilled|hard-drilled) \d+/.test(bm) || /Drill: /.test(bm), card: /What the drill opens/.test(card),
        escaped: !card.includes('<b>Bold</b>') && !bm.includes('<i>Ink</i>'), orders: orders.length > 0, hasDiv: !!div };
    });
    return { ok: r.pure && r.note && r.tag && r.card && r.escaped && r.hasDiv, detail: JSON.stringify(r) };
  },
};
