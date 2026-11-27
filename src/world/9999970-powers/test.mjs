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
        // the median of the common folk (orders 95 and 96, D-184 addendum: an untrained noble stands 50-99 by upbringing, and
        // the named people of a world are mostly nobles and post-holders, so the average people's band is read among the
        // commoners who hold no post and never served)
        const posts = p => (A.POSTS && A.POSTS.held ? A.POSTS.held(p.id).length : 0);
        const cs = Object.values(A.S.people).filter(p => p.alive && p.st && p.race === 'human' && A.age(p) >= 16 && !['noble', 'royal', 'gentry'].includes(p.status) && !p.mil && !p.veteran && !posts(p)).map(p => PW.level(p)).sort((a, b) => a - b);
        out.tops.push(hs[hs.length - 1]); out.meds.push(cs.length ? cs[cs.length >> 1] : 0);
      }
      out.masters = PW.D.masters.map(m => PW.level(m.id));
      out.dragons = ['great-ash-dragon', 'frost-dragon', 'storm-dragon', 'brine-dragon'].map(id => PW.level(id));
      // the inferno and water ancients; the storm ancient is Vaskareth, a wide gap above them (order 97, D-198)
      out.ancient = ['ancient-inferno-dragon', 'ancient-water-dragon'].map(id => PW.level(id));
      out.storm = [PW.level('ancient-storm-dragon'), PW.level('vaskareth')];
      out.strong = ['elder-ash-dragon', 'elder-frost-dragon', 'elder-storm-dragon', 'elder-brine-dragon'].map(id => PW.level(id));
      // the demons by rank, not species (order 97, D-197)
      out.lower = ['imp', 'fiend', 'greater-fiend', 'demon-knight'].map(id => PW.level(id));   // Minor Demon, Lesser Demon, Demon Soldier (ids kept)
      out.great = ['baron-of-hell', 'count-of-hell', 'demon-lord'].map(id => PW.level(id));
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
    // the strongest human of a world, pooled (H-082): over twelve worlds (seeds 7, 11, 23, 41, 3, 5, 13, 17, 19, 29, 31, 37) the
    // trunk at 45911e45 read 488-551 (mean 511) and order 98's build 471-565 (mean 503): one world's best man falls under 480
    // by luck, so the four worlds' mean holds the band (480 up) and each world's best stays above 450
    const L = r.legends, max = Math.max(...r.tops), min = Math.min(...r.tops), avg = xs => xs.reduce((a, x) => a + x, 0) / xs.length, C = r.curve;
    const ok = r.bands.join() === 'G,F,E,D,C,B,A,S,SS,SSS' && !r.godBand && r.allTitled &&
      avg(r.tops) >= 480 && min >= 450 && max <= 700 && r.meds.every(m => m >= 25 && m <= 50) &&
      C.soldier[0] >= 80 && C.soldier[1] <= 180 && C.knight[0] >= 230 && C.knight[0] <= 299 && C.knight[1] > 299 && C.elite[0] >= 300 && C.elite[1] <= 420 && C.past > 300 &&
      r.masters.every(x => x > max && x <= 700) && Math.abs(avg(r.dragons) - 700) <= 20 && r.strong.every(x => x > Math.max(...r.dragons) && x < 800) && r.ancient.every(x => x >= 780 && x <= 800 && x > Math.max(...r.strong)) && r.storm[0] === r.storm[1] && r.storm[0] - Math.max(...r.ancient) >= 60 &&
      r.lower.every(x => x >= 300 && x <= 500) && Math.abs(avg(r.great) - 650) <= 25 &&
      L.every(x => x[1] >= 800) && L[0][0] === 'sarnavoth' && L[0][1] === 1000 &&
      r.arch.length === 3 && r.arch.every(x => x >= 955 && x <= 985) && Math.abs(r.saint - 875) <= 10 && r.saintHuman && !r.pcts;
    return { ok, detail: `strongest human by world ${r.tops.join(', ')}, median ${r.meds.join(', ')}; the curve: a soldier (might 1-2) ${C.soldier.join('-')}, a knight (9-25) ${C.knight.join('-')}, an elite (25-60) ${C.elite.join('-')}; masters ${r.masters.join(', ')}; grown dragons ${r.dragons.join(', ')}, elder ${r.strong.join(', ')}, the inferno and water ancients ${r.ancient.join(', ')}, the storm (Vaskareth) ${r.storm.join('/')}; lower demons ${r.lower.join(', ')}, great ${r.great.join(', ')}; legends ${L.map(x => x[0] + ' ' + x[1]).join(', ')}; the best man against a giant king, a grown dragon, the Saint, the Dragon King: ${r.words.join(' / ')}` };
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
      const beast = PW.BD.species.filter(sp => !sp.legend).reduce((m, sp) => Math.max(m, PW.power(sp.id)), 0), master = Math.max(...PW.D.masters.map(m => PW.power(m.id))), weakest = Math.min(...legs.map(id => PW.power(id)));
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
  // the archdemons 770-780 -> 963-975, the Saint 700 -> 875, the Lord of the Sea 690 -> 863). Order 95 (D-191): the band from
  // 600 up to the weakest legend holds only calamities by nature (dragons grown and older, great and ancient demons, the
  // giants of the first age, titans, liches, leviathans, the great spirits, the colossi of legend), no weak kind raised to
  // fill a gap: fewer kinds than D-185's 74, over many families, each a whole species, every one far below a legend; D-185's
  // new lines each reach it at their apex, and the dragons of the High Roost are gone (the owner's follow-up to order 95)
  async pwStretched(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER;
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const OLD = { sarnavoth: 800, ghazrul: 780, morvane: 775, vethrael: 770, 'sword-saint': 700, vaskareth: 692, tessaly: 690, hrimgala: 682, ulmavren: 680, orrun: 674, serrath: 672, kethra: 664, ommul: 658, saqqar: 650, 'pale-shepherd': 648, 'iron-warden': 640 };
      const wrong = PW.LD.legends.filter(l => OLD[l.id] == null || PW.level(l.id) !== Math.round(OLD[l.id] * 1000 / 800)).map(l => `${l.id} ${PW.level(l.id)}`);
      const legs = PW.LD.legends.map(l => PW.being(l.id)), low = Math.min(...legs.map(b => b.level)), weakest = Math.min(...legs.map(b => b.power));
      const NEW = ['hydra', 'titan', 'tempest', 'hive', 'lich', 'caldera', 'ranks', 'girdler', 'greyhunt', 'colossus'];   // ranks: Hell's, whose apex is a Demon Lord (D-197)
      const apexOut = NEW.filter(k => {
        const e = Object.entries(PW.BD.lines).find(([lk]) => lk.split('.')[1] === k), top = e && PW.level(e[1][e[1].length - 1]);
        return !(top >= 600 && top < low);
      });
      const roost = PW.BD.species.filter(s => /roost/i.test(s.id + s.line)).map(s => s.id);
      const CAL = ['grown dragon', 'elder dragon', 'ancient dragon', 'great demon', 'ancient demon', 'giant', 'calamity'];
      const band = PW.BD.species.filter(s => PW.level(s.id) >= 600 && PW.level(s.id) < low).sort((a, b) => PW.level(a.id) - PW.level(b.id));
      const lv = band.map(s => PW.level(s.id)), holes = lv.slice(1).map((x, i) => x - lv[i]);
      const notCal = band.filter(s => !CAL.includes(s.tier)).map(s => `${s.n} (${s.tier})`);
      const whole = band.every(s => s.beh && s.beh.drives.length && s.beh.social && s.beh.people && s.drops.length && s.seasons.length && (s.terr.length || s.coast || s.hell) && s.prof && PW.D.capabilities.every(c => s.prof[c.k] >= 0 && s.prof[c.k] <= 10));
      const strongestKind = Math.max(...band.map(s => PW.power(s.id)));
      // each level exponentially harder, and more so the higher: the step from 990 to 1000 is wider than from 800 to 810
      const wider = PW.mightOf(1000) / PW.mightOf(990) > PW.mightOf(810) / PW.mightOf(800);
      return { wrong, low, apexOut, roost, notCal, n: band.length, fams: [...new Set(band.map(s => s.fam))].length, lines: [...new Set(band.map(s => s.line))].length,
        top: lv[lv.length - 1], bottom: lv[0], hole: Math.max(0, ...holes), ints: [...new Set(band.map(s => s.int))], whole, below: weakest / strongestKind, wider,
        names: band.map(s => `${s.n} ${PW.level(s.id)}`) };
    });
    const ok = !r.wrong.length && r.low === 800 && !r.apexOut.length && !r.roost.length && !r.notCal.length && r.n >= 30 && r.n < 74 && r.fams >= 8 && r.lines >= 15 &&
      r.bottom <= 620 && r.top >= 780 && r.hole <= 30 && r.ints.length >= 2 && r.whole && r.below > 20 && r.wider;
    return { ok, detail: `legends off their stretched level: ${r.wrong.join(', ') || 'none'} (the weakest at ${r.low}); D-185's lines whose apex is not in the band: ${r.apexOut.join(', ') || 'none'}; the High Roost: ${r.roost.join(', ') || 'gone'}; not a calamity by nature: ${r.notCal.join(', ') || 'none'}; from 600 to the legends: ${r.n} kinds in ${r.fams} families and ${r.lines} lines, levels ${r.bottom} to ${r.top}, the widest hole ${r.hole} levels, minds ${r.ints.join('/')}; the weakest legend ${r.below.toFixed(0)} times its strongest; a level at 1000 worth more than one at 800 ${r.wider}: ${r.names.join(', ')}` };
  },

  // orders 95 and 96 (D-191): the bands by nature. Plain and apex animals far below the dragons (their kings and monstrous
  // apex forms at most 350, plain animals at most 250), trolls and ogres soldier to elite; exactly three ancient dragons
  // under the King (Ash, Frost, Storm: one each, 780-800 with the Old Blood, above every elder); few elder dragons (7 to 12
  // in the world) and at most 100 dragons in all; the ancient demons about the elder dragons (their mean within 25) and
  // exactly 33 of them; the great demons' mean 625-675. And the wilds never hold more of a counted kind than the world
  // does, nor more than 100 dragons, however full they are and however long they run (deterministic: counts, no draw)
  async pwBands(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, S = PW.BD.species, avg = xs => xs.reduce((a, x) => a + x, 0) / Math.max(1, xs.length);
      A.newGame({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const top = f => Math.max(...S.filter(f).map(s => PW.level(s.id)));
      const ANIMAL = ['vermin', 'hounds', 'cats', 'bears', 'hooved'];
      const animalTop = top(s => ANIMAL.includes(s.fam)), plainTop = top(s => s.tier === 'animal'), greatTop = top(s => s.tier === 'great beast');
      const brutes = top(s => ['trolls.troll', 'giants.ettin', 'ogres.ogre', 'ogres.marshogre'].includes(s.line)), young = top(s => s.tier === 'young dragon');
      const anc = S.filter(s => s.tier === 'ancient dragon'), elders = S.filter(s => s.tier === 'elder dragon');
      const ancL = anc.map(s => PW.level(s.id)), elderL = elders.map(s => PW.level(s.id));
      const dem = S.filter(s => s.tier === 'ancient demon'), great = S.filter(s => s.tier === 'great demon');
      const dragons = S.filter(s => s.fam === 'dragons'), cap = PW.BD.families.dragons.cap;
      // the wilds at their fullest: every counted dragon kind tracked to its world count, all fed and blooded past any rise;
      // then spawns and years: no kind past its count, the family never past its cap
      const st = PW.state(), P = A.S.prov.find(p => p.terr === 'mountains') || A.S.prov[0];
      st.wild.length = 0;
      let n = 0;
      for (const s of dragons) if (!s.unique) for (let k = 0; k < s.world; k++) st.wild.push({ id: 'tb' + (++n), sp: s.id, at: P.id, fed: 99, wins: 99, yrs: 99, born: A.S.year, key: 'tb' + n });
      const over = [];
      const check = when => {
        const by = {}; let fam = 0;
        for (const w of st.wild) { if (w.dead) continue; const s = PW.species(w.sp); if (s && s.fam === 'dragons') { fam++; by[s.id] = (by[s.id] || 0) + 1; } }
        if (fam > cap) over.push(`${when}: ${fam} dragons`);
        for (const id in by) if (by[id] > PW.species(id).world) over.push(`${when}: ${by[id]} ${id}`);
        return fam;
      };
      const full = check('full'), rng = PW.rng('bands');
      for (let i = 0; i < 300; i++) PW.spawnWild(st, rng);
      check('after 300 spawns');
      const room = PW.room(st, PW.species('frost-hatchling'));
      let most = 0;
      for (let y = 0; y < 40; y++) { A.S.year++; PW.wildYear(rng); most = Math.max(most, check('year ' + y)); }
      const stormL = PW.level('ancient-storm-dragon'), others = anc.filter(s => s.id !== 'ancient-storm-dragon').map(s => PW.level(s.id));
      const stormGap = stormL - Math.max(...others), doms = anc.map(s => s.dominion).sort().join(), kingDom = !!PW.LEG.get('sarnavoth').dominion && PW.LEG.get('vaskareth').dominion === 'storm';
      return { stormGap, doms, kingDom, animalTop, plainTop, greatTop, brutes, young, anc: anc.map(s => s.id), ancL, ancOk: anc.every(s => s.unique && s.world === 1 && !S.some(x => x.next === s.id)),
        elderL, elderWorld: elders.reduce((a, s) => a + s.world, 0), dragonWorld: dragons.reduce((a, s) => a + (s.world || 0), 0), cap, allCounted: dragons.every(s => s.world >= 1),
        dem: dem.map(s => `${s.n} ${PW.level(s.id)} x${s.world}`), demL: dem.map(s => PW.level(s.id)), demWorld: dem.reduce((a, s) => a + (s.world || 0), 0), great: great.map(s => PW.level(s.id)),
        demMean: avg(dem.map(s => PW.level(s.id))), elderMean: avg(elderL), greatMean: avg(great.map(s => PW.level(s.id))), full, most, over, room };
    });
    const ok = r.animalTop <= 350 && r.plainTop <= 250 && r.greatTop <= 350 && r.brutes <= 420 && r.young < 500 &&
      r.anc.length === 3 && ['ancient-inferno-dragon', 'ancient-water-dragon', 'ancient-storm-dragon'].every(id => r.anc.includes(id)) && r.ancOk && r.ancL.every(x => x > Math.max(...r.elderL)) &&
      r.ancL.filter((x, i) => r.anc[i] !== 'ancient-storm-dragon').every(x => x >= 780 && x <= 800) && r.stormGap >= 60 && r.doms === 'inferno,storm,water' && r.kingDom &&
      r.elderWorld >= 7 && r.elderWorld <= 12 && r.allCounted && r.cap === 100 && r.dragonWorld <= r.cap &&
      r.dem.length >= 3 && r.dem.length <= 6 && r.demWorld === 33 && Math.abs(r.demMean - r.elderMean) <= 25 && r.demL.every(x => x >= 725 && x <= 760) &&
      r.greatMean >= 625 && r.greatMean <= 675 && !r.over.length && r.full > 0 && !r.room;
    return { ok, detail: `animal families at most ${r.animalTop}, plain animals ${r.plainTop}, great beasts ${r.greatTop}, trolls and ogres ${r.brutes}, young dragons ${r.young}; ancient dragons ${r.anc.map((id, i) => id + ' ' + r.ancL[i]).join(', ')}; elder ${r.elderL.join(', ')} (mean ${r.elderMean.toFixed(1)}, ${r.elderWorld} in the world); dragons in the world ${r.dragonWorld} of a cap of ${r.cap}; ancient demons ${r.dem.join(', ')} (${r.demWorld} in all, mean ${r.demMean.toFixed(1)}); great demons ${r.great.join(', ')} (mean ${r.greatMean.toFixed(1)}); the wilds full at ${r.full} dragons, at most ${r.most} through 40 years${r.over.length ? ' OVER ' + r.over.slice(0, 5).join('; ') : ''}; room for another frost hatchling when full: ${r.room}` };
  },

  // the bestiary: countless kinds in families and evolution lines; the release's beasts mapped, their own duel rows recorded
  // (duelT) and checked against the live rows
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
        // the release's duel row, as the data records it (duelT; the level is the kind's nature since D-191)
        if (!(Math.abs(PW.tOf(c * c) - s.duelT) <= 1)) bad.push(`${cre} ${s.n}: data ${s.duelT}, live ${PW.tOf(c * c)}`);
      }
      const ints = {}; for (const s of B.species) ints[s.int] = (ints[s.int] || 0) + 1;
      const noCalm = B.species.filter(s => !s.beh.calmed.length && s.beh.nature && s.beh.nature.spec).length;
      const behOk = B.species.every(s => s.beh && s.beh.drives.length && s.beh.social && s.beh.people && s.beh.day && s.beh.year && s.drops.length && s.seasons.length);
      return { n: B.species.length, fams: Object.keys(B.families).length, evo: evo.length, apex: B.species.filter(s => s.apex).length, beasts: Object.keys(A.BEASTS).length, bad, ints, noCalm, behOk,
        fighter: (() => { const f = A.fighterBeast('thinking-ooze'); return f && f.beast === 'thinking-ooze' && f.name === 'Thinking Ooze' && f.maxHp > 0; })() };
    });
    const ok = r.n >= 150 && r.fams >= 15 && r.evo >= 40 && r.beasts === 25 && !r.bad.length && r.fighter && r.behOk && r.noCalm >= 10 && Object.keys(r.ints).length === 4;
    return { ok, detail: `${r.n} species, ${r.fams} families, ${r.evo} evolution lines, ${r.apex} apex forms; minds ${JSON.stringify(r.ints)}; ${r.noCalm} kinds nothing soothes; the release's 25 beasts mapped, their duel rows as recorded${r.bad.length ? ' BAD ' + r.bad.join('; ') : ''}` };
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
  // order 97 (D-197): no demon species. Demons are known by rank (lower: Minor Demon to Demon Knight, dumb; great: Baron of Hell to Demon Lord;
  // ancient: Marquis, Duke, Prince, thirty-three, their mean about ten below the old 750), each one of a kind and horned;
  // every demon lives in Hell, so the continent's wilds never bring one, on any ground, in any world. Trolls and ogres are
  // demonic creatures, 230-270 with their leaders higher; wild giants very few. World-robust: the wilds are drawn over four
  // worlds and every terrain, thousands of draws
  async pwDemonsByRank(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, S = PW.BD.species, dem = S.filter(s => s.fam === 'demons');
      const out = { bad: [], drawn: 0, demonsDrawn: [] };
      const RANK = /^(Minor Demon|Lesser Demon|Demon Soldier|Demon Knight|Demon Lord|(Baron|Count|Marquis|Duke|Prince) of Hell)$/;
      for (const s of dem) {
        if (!RANK.test(s.n)) out.bad.push(`${s.n}: not a rank`);
        if (!s.hell || s.terr.length || s.coast) out.bad.push(`${s.n}: a habitat on the continent`);
        if (s.tier === 'lower demon' && !['beast', 'cunning'].includes(s.int)) out.bad.push(`${s.n}: a lower demon that reasons`);
      }
      for (const seed of [7, 11, 23, 41]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        const st = PW.state(), rng = PW.rng('demons-test');
        for (const P of A.S.prov) for (const target of [30, 45, 60, 70]) { const s = PW.pickBeast(P, target, rng); out.drawn++; if (s && s.fam === 'demons') out.demonsDrawn.push(s.id); }
        st.wild.length = 0; for (let i = 0; i < 300; i++) { const w = PW.spawnWild(st, rng); if (w && PW.species(w.sp).fam === 'demons') out.demonsDrawn.push(w.sp); }
      }
      const F = A.FIG, ad = F.list('ancient-demons');
      out.mean = ad.reduce((a, p) => a + p.level, 0) / ad.length;
      out.horned = ad.filter(p => /horn/i.test(p.looks || '')).length; out.n = ad.length;
      out.looks = new Set(ad.map(p => p.looks)).size; out.pure = PW.demonLook('skarn') === PW.demonLook('skarn');
      out.ranks = [...new Set(ad.map(p => p.kindName))].sort();
      const lv = id => PW.level(id);
      out.common = ['bog-troll', 'hill-troll', 'cave-troll', 'stone-troll', 'ogre', 'ogre-brute', 'ogre-glutton', 'marsh-ogre'].map(lv);
      out.leaders = ['troll-grandsire', 'ogre-hetman', 'ogre-hedge-witch'].map(lv);
      out.brutesTier = S.filter(s => ['trolls', 'ogres'].includes(s.fam)).every(s => s.tier === 'demonic creature');
      out.giants = S.filter(s => s.tier === 'giant' || s.line === 'giants.titan').map(s => s.world);
      return out;
    });
    const ok = !r.bad.length && !r.demonsDrawn.length && r.drawn > 1000 && Math.abs(r.mean - 740) <= 5 && r.horned === r.n && r.n === 33 && r.looks >= 25 && r.pure &&
      r.ranks.join() === 'Duke of Hell,Marquis of Hell,Prince of Hell' && r.common.every(x => x >= 230 && x <= 270) && r.leaders.every(x => x > 270) && r.brutesTier &&
      r.giants.length >= 7 && r.giants.every(w => w >= 1 && w <= 10);
    return { ok, detail: `${r.bad.length ? 'faults: ' + r.bad.join('; ') + '. ' : ''}demons drawn on the continent ${r.demonsDrawn.length} of ${r.drawn} encounter draws and 1,200 spawns over four worlds; the ancient demons' mean ${r.mean.toFixed(1)}, ${r.horned} of ${r.n} horned, ${r.looks} looks, ranks ${r.ranks.join(', ')}; trolls and ogres ${r.common.join(', ')}, their leaders ${r.leaders.join(', ')}; wild giants in the world ${r.giants.join(', ')}` };
  },

  // order 98 (D-199): orcs are demonic creatures, not a people, and not playable. The creation screen and a random start
  // offer none and A.newGame makes a half-orc of one asked for; a world made since holds no orc person (its people, its
  // houses, a stranger an event asks for), while an old save's world keeps its orcs; Gorath and Ughrak are half-orc realms
  // of the five forms (a kingdom and a principality) whose half-orc royals are born to their house; the orcs are a kind of
  // the bestiary. Over four worlds
  async pwOrcsNotAPeople(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const out = { orcs: 0, people: 0, worlds: [] };
      for (const seed of [7, 11, 23, 41]) {
        A.newGame({ seed, race: 'orc', realm: 'POL-11', status: 'peasant', sex: 'M', startAge: 16 });
        const pc = A.pc();
        // the two realms' houses seated (their members are made on first reading)
        for (const rid of ['POL-11', 'POL-34']) Object.keys(A.S.houses || {}).filter(id => (A.famData(id) || {}).realm === rid).slice(0, 6).forEach(id => A.famMembers(id));
        for (let i = 0; i < 10; i++) A.makeAcquaintance(pc, 'friend');
        const stranger = A.newPerson({ race: 'orc', realm: 'POL-11' });
        const ppl = Object.values(A.S.people);
        out.orcs += ppl.filter(q => q.race === 'orc').length; out.people += ppl.length;
        const G = A.realm('POL-11'), U = A.realm('POL-34');
        out.worlds.push({ seed, pc: pc.race, stranger: stranger.race, realms: [G.race, U.race, G.name, U.name, LORE.realms['POL-11'].type, LORE.realms['POL-34'].type], rulers: [A.P(G.ruler), A.P(U.ruler)].map(q => q && q.race) });
      }
      A.newGame({ seed: 12, race: 'halforc', realm: 'POL-11', status: 'royal', sex: 'F', startAge: 16 });
      out.royal = [A.pc().race, A.pc().status, !!A.pc().house];
      delete A.S.noOrcs; out.oldSave = A.newPerson({ race: 'orc', realm: 'POL-11' }).race;
      UI.cr = UI.crDefaults(); out.offered = UI.crStepBirth().includes('race:orc'); UI.A.crSet && UI.A.crSet('race:orc'); out.setTo = UI.cr.race;
      let rand = 0; for (let i = 0; i < 60; i++) { UI.crRandomize(); if (UI.cr.race === 'orc') rand++; } out.rand = rand;
      const kind = A.POWER.BD.species.filter(s => s.fam === 'orcs');
      out.kind = kind.length && kind.every(s => s.tier === 'demonic creature' && s.terr.includes('steppe'));
      return out;
    });
    const ok = r.orcs === 0 && r.people > 1000 && r.worlds.every(w => w.pc === 'halforc' && w.stranger === 'halforc' && w.realms.slice(0, 2).join() === 'halforc,halforc' && w.realms[4] === 'kingdom' && w.realms[5] === 'principality' && w.rulers.every(x => x === 'halforc')) &&
      r.royal.join() === 'halforc,royal,true' && r.oldSave === 'orc' && !r.offered && r.setTo !== 'orc' && !r.rand && r.kind;
    return { ok, detail: `orc people in four new worlds ${r.orcs} of ${r.people}; ${r.worlds.map(w => `seed ${w.seed}: player ${w.pc}, a stranger asked as an orc ${w.stranger}, ${w.realms[2]} and ${w.realms[3]} (${w.realms[0]}, ${w.realms[1]}), rulers ${w.rulers.join('/')}`).join('; ')}; a half-orc royal of Gorath ${r.royal.join(' ')}; an old save's orc ${r.oldSave}; offered on the creation screen ${r.offered}, set by a tap ${r.setTo}, drawn by 60 random starts ${r.rand}; the orc a demonic creature of the bestiary ${r.kind}` };
  },

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
