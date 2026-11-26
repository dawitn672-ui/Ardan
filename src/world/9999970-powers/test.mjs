// Tests for src/world/9999970-powers (powers wave 1, docs/design/powers.md). Every test fails (never skips) when the feature
// is not in the build. World-robust (H-082): the ladder is read over several worlds, evolution and the legends' moves are
// pooled over years with a seed fallback, and the settled-lands bar is computed from the rule, not from one life's luck.

const GATE = () => typeof A !== 'undefined' && !!A.POWER && !!A.POWER.great && !!A.DATA && !!A.DATA.bestiary;
const NO = { ok: false, detail: 'A.POWER not in this build' };

export default {
  // the owner's anchors of order 93 (D-185, replacing order 84's): an average person 20-50, a soldier 80-180 (might 1-2), an
  // ordinary knight 230-299 and past it more than an ordinary knight (order 94: no cap at 299; might 9-25), a kingdom's
  // elite 300-420 (might 25-60), the strongest of the peoples 500-700 and very few (the best man of a world; the masters
  // of the races), an average grown dragon about 700, an average great demon about 650, the lower demons 300-500; and the
  // top of order 92: every legend from 800 up, the Sword Saint about 875, three Primordial Archdemons 963-975 and the
  // Dragon King at 1000, by far the strongest single being
  async pwLadder(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, out = { tops: [], meds: [] };
      for (const seed of [7, 11, 23, 41]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
        const hs = Object.values(A.S.people).filter(p => p.alive && p.st && p.race === 'human' && A.age(p) >= 16).map(p => PW.level(p)).sort((a, b) => a - b);
        out.tops.push(hs[hs.length - 1]); out.meds.push(hs[hs.length >> 1]);
      }
      out.masters = PW.D.masters.map(m => PW.level(m.id));
      out.dragons = ['frost-dragon', 'storm-dragon', 'brine-dragon'].map(id => PW.level(id));
      out.strong = ['elder-ash-dragon', 'elder-frost-dragon', 'elder-storm-dragon', 'elder-brine-dragon'].map(id => PW.level(id));
      out.lower = ['imp', 'fiend', 'greater-fiend', 'cinder-hound', 'brimstone-hound', 'whisperer', 'soul-broker'].map(id => PW.level(id));
      out.great = ['pit-prince', 'gate-horror', 'gate-tyrant', 'gate-duke', 'duke-of-cinders'].map(id => PW.level(id));
      out.curve = { soldier: [1, 2].map(m => PW.levelOf(m)), knight: [9, 25].map(m => PW.levelOf(m)), elite: [25, 60].map(m => PW.levelOf(m)), past: PW.levelOf(40) };
      const L = PW.LD.legends.map(l => [l.id, PW.level(l.id)]).sort((a, b) => b[1] - a[1]);
      out.legends = L;
      out.arch = PW.LD.legends.filter(l => l.titles.some(t => t.n === 'Primordial Archdemon')).map(l => PW.level(l.id));
      out.saint = PW.level('sword-saint'); out.saintHuman = PW.LEG.get('sword-saint').fam === 'human';
      out.bands = PW.D.bands.map(b => b.r);
      out.godBand = PW.D.bands.some(b => /god|divine/i.test(b.r + b.w));
      out.allTitled = PW.LD.legends.every(l => l.titles && l.titles.length);
      const best = Object.values(A.S.people).filter(p => p.alive && p.st && p.race === 'human').sort((a, b) => PW.might(b) - PW.might(a))[0];
      out.words = ['m-giant-king', 'storm-dragon', 'sword-saint', 'sarnavoth'].map(id => PW.compare(best, id).word);
      out.pcts = out.words.some(w => /%|\d/.test(w));
      return out;
    });
    const L = r.legends, max = Math.max(...r.tops), min = Math.min(...r.tops), avg = xs => xs.reduce((a, x) => a + x, 0) / xs.length, C = r.curve;
    const ok = r.bands.join() === 'G,F,E,D,C,B,A,S,SS,SSS' && !r.godBand && r.allTitled &&
      min >= 480 && max <= 700 && r.meds.every(m => m >= 25 && m <= 50) &&
      C.soldier[0] >= 80 && C.soldier[1] <= 180 && C.knight[0] >= 230 && C.knight[0] <= 299 && C.knight[1] > 299 && C.elite[0] >= 300 && C.elite[1] <= 420 && C.past > 300 &&
      r.masters.every(x => x > max && x <= 700) && Math.abs(avg(r.dragons) - 700) <= 20 && r.strong.every(x => x > Math.max(...r.dragons) && x < 800) &&
      r.lower.every(x => x >= 300 && x <= 500) && Math.abs(avg(r.great) - 650) <= 25 &&
      L.every(x => x[1] >= 800) && L[0][0] === 'sarnavoth' && L[0][1] === 1000 &&
      r.arch.length === 3 && r.arch.every(x => x >= 955 && x <= 985) && Math.abs(r.saint - 875) <= 10 && r.saintHuman && !r.pcts;
    return { ok, detail: `strongest human by world ${r.tops.join(', ')}, median ${r.meds.join(', ')}; the curve: a soldier (might 1-2) ${C.soldier.join('-')}, a knight (9-25) ${C.knight.join('-')}, an elite (25-60) ${C.elite.join('-')}; masters ${r.masters.join(', ')}; grown dragons ${r.dragons.join(', ')}, strong ${r.strong.join(', ')}; lower demons ${r.lower.join(', ')}, great ${r.great.join(', ')}; legends ${L.map(x => x[0] + ' ' + x[1]).join(', ')}; the best man against a giant king, a grown dragon, the Saint, the Dragon King: ${r.words.join(' / ')}` };
  },

  // the level is not everything (the owner, 2026-11-25 and 26): each level multiplies the might by more than the one before,
  // and fighting power is the level's might times titles, items and art (skills of rank D-S, level at most 10). The three
  // matchups he named: Sarnavoth (1000 since order 92) at a slight disadvantage against the three Primordial Archdemons
  // together (wins 40-45%); the Sword Saint (about 875) even with ONE archdemon (963-975) through his class, titles, skills
  // and sword; the Lord of the Sea (about 863) below the Saint. The might per level keeps rising all the way to 1000
  async pwPowerNotLevel(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, ARCH = ['ghazrul', 'morvane', 'vethrael'];
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const ratio = L => PW.mightOf(L + 1) / PW.mightOf(L);
      const steps = [25, 100, 300, 600, 800, 999].map(ratio);
      const convex = steps.every((x, i) => i === 0 || x > steps[i - 1]);
      const king = PW.compare('sarnavoth', PW.group(ARCH));
      const one = ARCH.map(id => [id, PW.level(id), PW.compare('sword-saint', id).p]);
      const sea = PW.compare('sword-saint', 'tessaly');
      const rank = PW.great().map(x => x.id), single = ARCH.concat(['sword-saint']).map(id => PW.power(id)), archAvg = ARCH.reduce((a, id) => a + PW.power(id), 0) / 3;
      // the coordinator's rework (2026-11-26): a compressed top, neighbours within a few times, several near-even pairs
      const legs = PW.LD.legends.map(l => l.id).sort((a, b) => PW.power(b) - PW.power(a));
      const gaps = legs.slice(1).map((id, i) => PW.power(legs[i]) / PW.power(id)), even = legs.slice(1).filter((id, i) => { const q = PW.compare(legs[i], id).p; return q >= 0.4 && q <= 0.6; }).length;
      const beast = PW.BD.species.reduce((m, sp) => Math.max(m, PW.power(sp.id)), 0), master = Math.max(...PW.D.masters.map(m => PW.power(m.id))), weakest = Math.min(...legs.map(id => PW.power(id)));
      const sheets = PW.LD.legends.concat(PW.D.masters);
      const over10 = sheets.flatMap(l => (l.skills || []).filter(k => !(k.lvl >= 1 && k.lvl <= 10) || !PW.D.power.rankW[k.rank]).map(k => l.id + ' ' + k.n));
      const complete = sheets.filter(l => !(l.skills && l.skills.length && Array.isArray(l.items) && l.titles && l.titles.length && l.d)).map(l => l.id);
      return { steps, convex, far: PW.mightOf(650) / PW.mightOf(600), king: king.p, kingEdges: king.edges.map(e => e.t), one, sea: sea.p, saintL: PW.level('sword-saint'), seaL: PW.level('tessaly'),
        seaPow: PW.power('sword-saint') / PW.power('tessaly'), top: rank[0], topGap: PW.power('sarnavoth') / Math.max(...single), kingArch: PW.power('sarnavoth') / archAvg, maxStep: Math.max(...gaps), even, farAbove: weakest / Math.max(beast, master), over10, complete, saintClass: PW.LEG.get('sword-saint').class };
    });
    const ok = r.convex && r.far > 2 && r.king >= 0.38 && r.king <= 0.47 && r.one.every(x => x[2] >= 0.4 && x[2] <= 0.6 && x[1] > r.saintL) &&
      r.sea >= 0.65 && r.sea <= 0.8 && r.seaL < r.saintL && r.top === 'sarnavoth' && r.topGap > 1.5 && r.kingArch >= 3.2 && r.kingArch <= 3.6 && r.maxStep <= 4 && r.even >= 3 && r.farAbove > 20 && !r.over10.length && !r.complete.length && r.saintClass === 'Sword Saint';
    return { ok, detail: `might per level ${r.steps.map(x => x.toFixed(4)).join(' < ')}; 650 is ${r.far.toFixed(1)} times 600. Sarnavoth against the three archdemons together: p ${r.king.toFixed(2)} (${r.kingEdges.join('; ')}); the Sword Saint (level ${r.saintL}) against one: ${r.one.map(x => `${x[0]} (${x[1]}) ${x[2].toFixed(2)}`).join(', ')}; against the Lord of the Sea (${r.seaL}): ${r.sea.toFixed(2)}, ${r.seaPow.toFixed(0)} times her power; Sarnavoth ${r.topGap.toFixed(1)} times the next single being and ${r.kingArch.toFixed(2)} times an archdemon on average; neighbours at most ${r.maxStep.toFixed(2)} times apart, ${r.even} neighbour pairs near even; the weakest legend ${r.farAbove.toFixed(0)} times the strongest beast or master; skills over level 10: ${r.over10.length}; incomplete sheets: ${r.complete.join(', ') || 'none'}` };
  },

  // orders 92 and 93 (D-185): the scale stretched. Every legend stands at its old level x 1000/800 (Sarnavoth 800 -> 1000,
  // the archdemons 770-780 -> 963-975, the Saint 700 -> 875, the Lord of the Sea 690 -> 863); the band from the strongest of
  // the peoples (600) up to the weakest legend holds the great demons, the grown and strong dragons and the calamities of
  // order 92's eleven new lines: many kinds over many families, spread with no wide hole, each a whole species, every one
  // far below a legend
  async pwStretched(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const OLD = { sarnavoth: 800, ghazrul: 780, morvane: 775, vethrael: 770, 'sword-saint': 700, vaskareth: 692, tessaly: 690, hrimgala: 682, ulmavren: 680, orrun: 674, serrath: 672, kethra: 664, ommul: 658, saqqar: 650, 'pale-shepherd': 648, 'iron-warden': 640 };
      const wrong = PW.LD.legends.filter(l => OLD[l.id] == null || PW.level(l.id) !== Math.round(OLD[l.id] * 1000 / 800)).map(l => `${l.id} ${PW.level(l.id)}`);
      const legs = PW.LD.legends.map(l => PW.being(l.id)), low = Math.min(...legs.map(b => b.level)), weakest = Math.min(...legs.map(b => b.power));
      const NEW = ['hydra', 'highroost', 'titan', 'tempest', 'hive', 'lich', 'caldera', 'gateduke', 'girdler', 'greyhunt', 'colossus'];
      const fresh = PW.BD.species.filter(s => NEW.includes(s.line.split('.')[1])), freshOut = fresh.filter(s => !(PW.level(s.id) >= 580 && PW.level(s.id) < low)).map(s => s.id);
      const band = PW.BD.species.filter(s => PW.level(s.id) >= 600 && PW.level(s.id) < low).sort((a, b) => PW.level(a.id) - PW.level(b.id));
      const lv = band.map(s => PW.level(s.id)), holes = lv.slice(1).map((x, i) => x - lv[i]);
      const whole = band.every(s => s.beh && s.beh.drives.length && s.beh.social && s.beh.people && s.drops.length && s.seasons.length && (s.terr.length || s.coast) && s.prof && PW.D.capabilities.every(c => s.prof[c.k] >= 0 && s.prof[c.k] <= 10));
      const strongestKind = Math.max(...band.map(s => PW.power(s.id)));
      // each level exponentially harder, and more so the higher: the step from 990 to 1000 is wider than from 800 to 810
      const wider = PW.mightOf(1000) / PW.mightOf(990) > PW.mightOf(810) / PW.mightOf(800);
      return { wrong, low, fresh: fresh.length, freshOut, n: band.length, fams: [...new Set(band.map(s => s.fam))].length, lines: [...new Set(band.map(s => s.line))].length,
        top: lv[lv.length - 1], bottom: lv[0], hole: Math.max(0, ...holes), ints: [...new Set(band.map(s => s.int))], whole, below: weakest / strongestKind, wider,
        names: band.map(s => `${s.n} ${PW.level(s.id)}`) };
    });
    const ok = !r.wrong.length && r.low === 800 && r.fresh >= 25 && !r.freshOut.length && r.n >= 40 && r.fams >= 8 && r.lines >= 15 && r.bottom <= 620 && r.top >= 780 && r.hole <= 20 && r.ints.length >= 3 && r.whole && r.below > 20 && r.wider;
    return { ok, detail: `legends off their stretched level: ${r.wrong.join(', ') || 'none'} (the weakest at ${r.low}); order 92's ${r.fresh} new kinds all in the band (outside: ${r.freshOut.join(', ') || 'none'}); from 600 to the legends: ${r.n} kinds in ${r.fams} families and ${r.lines} lines, levels ${r.bottom} to ${r.top}, the widest hole ${r.hole} levels, minds ${r.ints.join('/')}; the weakest legend ${r.below.toFixed(0)} times its strongest; a level at 1000 worth more than one at 800 ${r.wider}: ${r.names.join(', ')}` };
  },

  // the bestiary: countless kinds in families and evolution lines; the release's beasts placed by their own duel rows
  async pwBestiary(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, B = PW.BD;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const lines = Object.values(B.lines), evo = lines.filter(l => l.length > 1);
      const worth = f => A.CR(Object.assign({ fat: 0, burst: 0, fury: 0, adapt: 0 }, f), { round: 5 }) + f.wdmg * 0.9 + f.prot * 1.1;
      const bad = [];
      for (const cre of Object.keys(A.BEASTS)) {
        const s = PW.speciesOfCre(cre);
        if (!s) { bad.push(cre + ' unmapped'); continue; }
        const f = A.fighterBeast(cre), c = Math.exp(PW.D.people.lnA + PW.D.people.lnB * worth(f)) * Math.sqrt(f.maxHp / 100);
        if (Math.abs(PW.tOf(c * c) - s.t) > 1) bad.push(`${cre} ${s.n}: data ${s.t}, live ${PW.tOf(c * c)}`);
      }
      const ints = {}; for (const s of B.species) ints[s.int] = (ints[s.int] || 0) + 1;
      const noCalm = B.species.filter(s => !s.beh.calmed.length && s.beh.nature && s.beh.nature.spec).length;
      const behOk = B.species.every(s => s.beh && s.beh.drives.length && s.beh.social && s.beh.people && s.beh.day && s.beh.year && s.drops.length && s.seasons.length);
      return { n: B.species.length, fams: Object.keys(B.families).length, evo: evo.length, apex: B.species.filter(s => s.apex).length, beasts: Object.keys(A.BEASTS).length, bad, ints, noCalm, behOk,
        fighter: (() => { const f = A.fighterBeast('thinking-ooze'); return f && f.beast === 'thinking-ooze' && f.name === 'Thinking Ooze' && f.maxHp > 0; })() };
    });
    const ok = r.n >= 150 && r.fams >= 15 && r.evo >= 40 && r.beasts === 25 && !r.bad.length && r.fighter && r.behOk && r.noCalm >= 10 && Object.keys(r.ints).length === 4;
    return { ok, detail: `${r.n} species, ${r.fams} families, ${r.evo} evolution lines, ${r.apex} apex forms; minds ${JSON.stringify(r.ints)}; ${r.noCalm} kinds nothing soothes; the release's 25 beasts on the scale by their own rows${r.bad.length ? ' BAD ' + r.bad.join('; ') : ''}` };
  },

  // the level is not the whole: two beings of one level fight differently, and the reasons are in words
  async pwProfiles(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(); pc.gear.ranged = null;
      const by = {};
      for (const s of PW.BD.species) (by[s.level] = by[s.level] || []).push(s);
      let pair = null;
      for (const L in by) { const a = by[L].find(s => s.prof.flight >= 8), b = by[L].find(s => s.prof.flight === 0 && s.prof.hide <= 4); if (a && b) { pair = [a.id, b.id, +L]; break; } }
      const ca = PW.compare(pc, pair[0]), cb = PW.compare(pc, pair[1]);
      return { pair, pa: ca.p, pb: cb.p, edgesA: ca.edges.map(e => e.t), flyEdge: ca.edges.some(e => /flies/.test(e.t)) };
    });
    const ok = r.pair && Math.abs(r.pa - r.pb) > 0.02 && r.pa < r.pb && r.flyEdge;
    return { ok, detail: `${r.pair && r.pair.join(' / ')}: the flyer gives ${r.pa.toFixed(3)}, the ground beast ${r.pb.toFixed(3)}; the flyer's edges: ${r.edgesA.join('; ')}` };
  },

  // monsters rise: one that feeds, fights and lives long enough becomes the next form, and the log says why; at the top it
  // takes a name and a mind (seed fallback over worlds; pooled over years)
  async pwEvolution(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, tried = [];
      for (const seed of [8101, 8102, 8103, 8104]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        tried.push(seed);
        PW.state();
        for (let y = 0; y < 40; y++) { A.S.year++; PW.wildYear(PW.rng('wild')); }
        const st = A.S.pw, rec = st.evo.find(e => /fed \d+ times/.test(e.why) && /won \d+ fight/.test(e.why));
        const legal = st.evo.every(e => PW.species(e.from).next === e.to);
        if (rec) return { seed, tried, n: st.evo.length, rec, legal, named: st.wild.filter(w => w.name).length + st.evo.filter(e => e.named).length, wild: st.wild.length, cap: PW.T.WILD_CAP };
      }
      return { tried, n: 0 };
    });
    const ok = r.n > 0 && r.legal && r.wild <= r.cap;
    return { ok, detail: r.n ? `world ${r.seed} (tried ${r.tried.join(', ')}): ${r.n} rises in 40 years, ${r.named} named; e.g. ${r.rec.from} -> ${r.rec.to}: ${r.rec.why}` : `no rise in worlds ${r.tried.join(', ')}` };
  },

  // the great beings: one holder each, a character sheet, a reason for every move (A.WHY), raids as news, and the
  // sleepers of the summit who mostly sleep
  async pwLegends(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const st = PW.state(), recs = [], moves = {};
      for (let i = 0; i < 160; i++) {
        if (i % 4 === 0) A.S.year++;
        const rng = PW.rng('t' + i);
        for (const L of PW.LD.legends) {
          const g = st.leg[L.id]; if (!g || g.slain) continue;
          const rec = L.sleeper && !(g.wokeUntil >= A.S.year) ? (i % 4 === 0 ? PW.sleeperYear(L, g, rng) : null) : PW.legendSeason(L, g, rng);
          if (rec) { recs.push(rec); moves[rec.chose] = (moves[rec.chose] || 0) + 1; }
        }
      }
      const sheets = PW.LD.legends.every(L => L.history && L.traits && L.values && L.fears && L.desires && L.speech && L.habits && L.century && L.age && L.titles && L.titles.length && L.temper);
      const ids = PW.LD.legends.map(l => l.id), uniq = new Set(ids).size === ids.length;
      const reasoned = recs.every(r => r.why && r.why.length > 0);
      const shown = JSON.stringify(PW.great().map(x => PW.titlesShown(x))).includes('req');
      return { n: PW.LD.legends.length, sleepers: PW.LD.legends.filter(l => l.sleeper).length, saintKnown: A.S.pw.known['sword-saint'] != null, saintSheet: !!(PW.LEG.get('sword-saint').tellings && PW.LEG.get('sword-saint').sword && PW.LEG.get('sword-saint').sayings && PW.LEG.get('sword-saint').places && PW.LEG.get('sword-saint').rivals && PW.LEG.get('sword-saint').end), homes: [...new Set(PW.LD.legends.map(l => l.home.type))], uniq, sheets, reasoned, recs: recs.length, moves,
        raidWhy: (recs.find(r => r.chose === 'raid') || {}).why, slain: Object.values(st.leg).filter(g => g.slain).length, shown,
        logged: A.WHY.recent(150, x => x.k === 'legend').length };
    });
    const ok = r.n >= 10 && r.sleepers >= 2 && r.saintKnown && r.saintSheet && r.homes.length >= 5 && r.uniq && r.sheets && r.reasoned && r.recs > 500 && (r.moves.raid || 0) > 0 && (r.moves.sleep || 0) > 0 && !r.shown;
    return { ok, detail: `${r.n} great beings (${r.sleepers} sleepers at the summit, the Sword Saint known from the start; homes ${r.homes.join(', ')}); 40 years: ${JSON.stringify(r.moves)}, ${r.slain} slain by hosts; a raid because: ${JSON.stringify((r.raidWhy || []).map(x => x[0]))}` };
  },

  // a card from the wilds: words not numbers, at most 80 words; a fight far above is settled at once (death or flight, no
  // duel), a close one goes to the duel engine; a beast nothing soothes offers no calming choice
  async pwEncounter(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, out = {};
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), me = PW.being(pc).level, P = A.prov(pc.home);
      const card = sp => { A.S.queue.length = 0; A.queue({ type: 'event', ev: 'pw_encounter', ctx: { sp, key: 'k', cause: 'a test', place: P.name } }); return A.eventView(A.S.queue[0]); };
      const big = PW.BD.species.find(s => s.t >= PW.being(pc).t + 30 && s.beh.calmed.length);
      const v = card(big.id);
      out.words = v.text.split(/\s+/).length; out.text = v.text; out.labels = v.choices.map(c => c.t + ' (' + c.risk + ')');
      out.pct = /%/.test(v.text + v.choices.map(c => c.t).join(' '));
      out.longLabel = v.choices.some(c => c.t.split(/\s+/).length > 12);
      const h0 = pc.health; A.eventChoose(0); out.duelHuge = A.S.queue.some(q => q.type === 'duel'); out.hurt = !pc.alive || pc.health < h0;
      A.S.queue.length = 0;
      pc.alive = true; pc.health = 100;
      const close = PW.BD.species.find(s => Math.abs(s.t - PW.being(pc).t) <= 2 && !s.beh.nature);
      card(close.id); A.eventChoose(0); out.duelClose = A.S.queue.some(q => q.type === 'duel');
      A.S.queue.length = 0;
      const wild = PW.BD.species.find(s => s.beh.nature && !s.beh.calmed.length);
      const v3 = card(wild.id); out.noCalm = !v3.choices.some(c => /turns its kind/.test(c.t)); out.natureText = v3.text;
      A.S.queue.length = 0;
      return out;
    });
    const ok = r.words <= 80 && !r.pct && !r.longLabel && !r.duelHuge && r.hurt && r.duelClose && r.noCalm;
    return { ok, detail: `${r.words} words: "${r.text}" [${r.labels.join(' | ')}]; far above: no duel, ${r.hurt ? 'hurt or dead' : 'unhurt'}; close: duel ${r.duelClose}; nature: "${r.natureText}"` };
  },

  // danger rises with choices: a life in a settled town meets the wilds rarely; the frontier, the road and the hunt far more
  async pwSettledSafe(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), towns = A.S.prov.filter(P => P.town >= 20000), wild = A.S.prov.filter(P => !P.town || P.town < 3000);
      const avg = (ps, doing) => ps.reduce((a, P) => a + PW.exposure(pc, P, doing), 0) / ps.length;
      return { town: avg(towns, false) * 12 * 40, wild: avg(wild, false) * 12 * 40, wildDoing: avg(wild, true) * 12 * 40, townLevel: PW.placeLevel(towns[0], false), wildLevel: PW.placeLevel(wild[0], true) };
    });
    const ok = r.town < 1.5 && r.wildDoing > 4 * r.town && r.wildLevel > r.townLevel;
    return { ok, detail: `cards in 40 years: a city ${r.town.toFixed(2)}, the wild ${r.wild.toFixed(2)}, the wild while travelling or exploring ${r.wildDoing.toFixed(2)}; the beasts a city brings centre on level ${r.townLevel}, the wild road on ${r.wildLevel}` };
  },

  // what the player reads is pure (no draw, no change) and old saves start the state the first month
  async pwPureAndOldSave(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      PW.state(); PW.know('vaskareth'); PW.meet('hill-wolf');
      const before = JSON.stringify([A.S.rng, A.S.pw]);
      const html = UI.powersPage(A.pc());
      PW.compare(A.pc(), 'vaskareth'); PW.great();
      const same = before === JSON.stringify([A.S.rng, A.S.pw]);
      delete A.S.pw;
      PW.month(A.pc());
      return { same, pct: /\d%/.test(html), vask: /Vaskareth/.test(html), wolf: /Hill Wolf/.test(html), notes: (html.match(/data-note=/g) || []).length, title: /title=/.test(html), back: !!(A.S.pw && A.S.pw.leg && A.S.pw.leg.vaskareth), req: /hidden|req/.test(html) };
    });
    const ok = r.same && !r.pct && r.vask && r.wolf && r.notes > 5 && !r.title && r.back && !r.req;
    return { ok, detail: `pure ${r.same}; page lists the known being and the beast met, ${r.notes} click notes, no hover titles, no percentages; an old save's state rebuilt ${r.back}` };
  },
};
