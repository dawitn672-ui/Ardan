// Tests for src/world/9999970-powers (powers wave 1, docs/design/powers.md). Every test fails (never skips) when the feature
// is not in the build. World-robust (H-082): the ladder is read over several worlds, evolution and the legends' moves are
// pooled over years with a seed fallback, and the settled-lands bar is computed from the rule, not from one life's luck.

const GATE = () => typeof A !== 'undefined' && !!A.POWER && !!A.POWER.great && !!A.DATA && !!A.DATA.bestiary;
const NO = { ok: false, detail: 'A.POWER not in this build' };

export default {
  // the one scale: today's strongest human mid-ladder (B), the race masters at A to S, great monsters at S and above,
  // the legends at SS and SSS, the gods above every rank; an ordinary man near the bottom
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
      out.legends = PW.LD.legends.filter(l => l.home.type !== 'beyond').map(l => PW.level(l.id));
      out.gods = PW.LD.legends.filter(l => l.home.type === 'beyond').map(l => PW.level(l.id));
      out.great = PW.BD.species.filter(s => /^(Ancient|Elder) .*Dragon$/.test(s.n)).map(s => PW.level(s.id));
      out.bands = PW.D.bands.map(b => [b.r, b.from]);
      out.bandOfTop = out.tops.map(L => PW.band(L).r);
      out.ratio = PW.mightOf(60) / PW.mightOf(50);
      // a human master against a giant king, an elder dragon and a god, in words
      const best = Object.values(A.S.people).filter(p => p.alive && p.st && p.race === 'human').sort((a, b) => PW.might(b) - PW.might(a))[0];
      out.words = ['m-giant-king', 'elder-ash-dragon', 'vaskareth', 'velmorrow'].map(id => PW.compare(best, id).word);
      out.pcts = out.words.some(w => /%|\d/.test(w));
      return out;
    });
    const max = Math.max(...r.tops), min = Math.min(...r.tops);
    const ok = r.bands.length >= 11 && r.bands.some(b => b[0] === 'SSS') && r.bands[r.bands.length - 1][0] === 'divine' &&
      min >= 42 && max <= 55 && r.bandOfTop.every(b => b === 'B' || b === 'A') && Math.max(...r.meds) <= 25 &&
      r.masters.every(L => L >= 50 && L < 70) && Math.min(...r.masters) > max && r.great.every(L => L >= 60) &&
      r.legends.every(L => L >= 70) && r.gods.every(L => L >= 100) && Math.abs(r.ratio - 10) < 1e-6 && !r.pcts;
    return { ok, detail: `strongest human by world ${r.tops.join(', ')} (${r.bandOfTop.join(', ')}), median ${r.meds.join(', ')}; masters ${r.masters.join(', ')}; elder and ancient kinds ${Math.min(...r.great)}-${Math.max(...r.great)}; legends ${Math.min(...r.legends)}-${Math.max(...r.legends)}; gods ${r.gods.join(', ')}; the best man against them: ${r.words.join(' / ')}` };
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
        if (Math.abs(PW.levelOf(c * c) - s.level) > 1) bad.push(`${cre} ${s.n}: data ${s.level}, live ${PW.levelOf(c * c)}`);
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

  // the great beings: one holder each, a character sheet, a reason for every move (A.WHY), raids as news, and gods who
  // mostly sleep
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
          const rec = g.god ? PW.godYear(L, g, rng) : PW.legendSeason(L, g, rng);
          if (rec) { recs.push(rec); moves[rec.chose] = (moves[rec.chose] || 0) + 1; }
        }
      }
      const sheets = PW.LD.legends.every(L => L.history && L.traits && L.values && L.fears && L.desires && L.speech && L.habits && L.century && L.age && L.titles && L.titles.length && L.temper);
      const ids = PW.LD.legends.map(l => l.id), uniq = new Set(ids).size === ids.length;
      const reasoned = recs.every(r => r.why && r.why.length > 0);
      const shown = JSON.stringify(PW.great().map(x => PW.titlesShown(x))).includes('req');
      return { n: PW.LD.legends.length, gods: PW.LD.legends.filter(l => l.home.type === 'beyond').length, homes: [...new Set(PW.LD.legends.map(l => l.home.type))], uniq, sheets, reasoned, recs: recs.length, moves,
        raidWhy: (recs.find(r => r.chose === 'raid') || {}).why, slain: Object.values(st.leg).filter(g => g.slain).length, shown,
        logged: A.WHY.recent(150, x => x.k === 'legend').length };
    });
    const ok = r.n >= 10 && r.gods >= 2 && r.homes.length >= 5 && r.uniq && r.sheets && r.reasoned && r.recs > 500 && (r.moves.raid || 0) > 0 && (r.moves.sleep || 0) > 0 && !r.shown;
    return { ok, detail: `${r.n} great beings (${r.gods} gods; homes ${r.homes.join(', ')}); 40 years: ${JSON.stringify(r.moves)}, ${r.slain} slain by hosts; a raid because: ${JSON.stringify((r.raidWhy || []).map(x => x[0]))}` };
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
      const big = PW.BD.species.find(s => s.level >= me + 30 && s.beh.calmed.length);
      const v = card(big.id);
      out.words = v.text.split(/\s+/).length; out.text = v.text; out.labels = v.choices.map(c => c.t + ' (' + c.risk + ')');
      out.pct = /%/.test(v.text + v.choices.map(c => c.t).join(' '));
      out.longLabel = v.choices.some(c => c.t.split(/\s+/).length > 12);
      const h0 = pc.health; A.eventChoose(0); out.duelHuge = A.S.queue.some(q => q.type === 'duel'); out.hurt = !pc.alive || pc.health < h0;
      A.S.queue.length = 0;
      pc.alive = true; pc.health = 100;
      const close = PW.BD.species.find(s => Math.abs(s.level - me) <= 2 && !s.beh.nature);
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
