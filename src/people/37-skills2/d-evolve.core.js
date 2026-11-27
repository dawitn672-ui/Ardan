// Skills rebuild, step 7 (docs/design/skills-v2.md §3.2, §3.3, §10; the owner's answers §15.2, §15.5, §15.8; D-182):
// evolution at Lv 10, gated by the rung's own route.
//
// A family's ladder still runs on S1's table under the rungs (D-179), and its rank edges are where an evolution stands:
// at C, B, A or S's Lv 10 the bar fills and stops, and the next rung is added only when its `evolve` route's conditions
// hold. Since this step the conditions are read from the data, not from S1's tables: S1's engine asks the game at every
// edge (`p.gate`, A.V2.skills's settle), and the answer is the rung's route (`E.edgeVerdict`): its concepts (S1's own,
// so the insight engine still grasps them; tools/lint-skills.mjs holds the two the same), its deed (S1's proof, read as
// the deed `proved`; for S, a `renowned_deed`: the proof done by someone the realm knows, fame SK2.RENOWN or more), its
// age, and anything later data adds. A rung absorbed by a merge (step 8) never evolves.
//
// - The old rung becomes the new one at Lv 1 and is gone (order 95, D-192, replacing §15.2's "the old one stays"): the
//   ladder's entries in pc.ks keep only the top rung (SK2.fromS1), the family reads through it, and what the old rung gave
//   passes on through its line (E.heldOfRung, E.lineEffects). An older save's rungs below the top are retired on load
//   (SK2.migrateLine, save version 21), and so is an art whose evolution is held (SK2.artGone).
// - Every evolution is recorded with its reason (pc.ke.ev, at most SK2.EVO_MAX; the skill's record; the log; the year's
//   digest), and brings something (§15.5): for the player, a card from rank B up and for his first evolution (a stat point
//   through A.LV, the new rung's first months of experience, renown, or rest: sk2_evolved); else, and for a child, the
//   first months of experience. Anyone else (the closed form) evolves by the same route, his deed being his post's (S1
//   asked none of him) or a stretch won; from rank B up he gains a stat point through A.LV, recorded on his level.
// - Deterministic: the concepts come by S1's insight (its draws of the month, as before); nothing else here draws.
(function () {
  const SK = A.SK, SK2 = A.SK2; if (!SK || !SK.DATA || !SK2 || !SK2.E) return;
  const E = () => SK2.E(), IX = () => SK2.IX();
  const isPC = p => !!(p && A.S && p.id === A.S.pc);
  SK2.RENOWN = 30;        // the fame of someone whose deed the realm knows (the S rung's renowned_deed)
  SK2.EVO_MAX = 24;       // evolutions, merges and rank jumps kept in pc.ke.ev (the skill's record keeps more)
  SK2.EVO_CARD_FROM = 'B';

  // ---- the store (pc.ke): { v, ev: [{ y, k, from, to, why, how }], m: [merged ids], adv, n, fd, nd, off: { rc: year }, pre }
  SK2.ke = function (pc) {
    let K = pc.ke; if (!K || typeof K !== 'object') K = pc.ke = { v: 1, ev: [] };
    if (!Array.isArray(K.ev)) K.ev = [];
    return K;
  };
  SK2.evNote = function (pc, o) {
    const K = SK2.ke(pc);
    K.ev.push(Object.assign({ y: A.S.year }, o));
    if (K.ev.length > SK2.EVO_MAX) K.ev.splice(0, K.ev.length - SK2.EVO_MAX);
  };
  // the rungs a merge absorbed (step 8): sealed, they never evolve
  SK2.sealed = function (p) {
    const K = p && p.ke; if (!K || !Array.isArray(K.m) || !K.m.length || !p.ks) return [];
    const out = [];
    for (const id of K.m) { const e = p.ks[id]; if (e && Array.isArray(e.of)) out.push(...e.of); }
    return out;
  };

  // ---- the facts of a life at an edge, for the engine's route (E.missing) ----------------------------------------------
  // concepts: the family's grasped (S1's table, "fam:id"); deeds: S1's proof as `proved` at the target's rank, and, held by
  // someone of renown, `renowned_deed`; age; fame; the rungs a merge sealed
  SK2.factsAt = function (p, c, s, age, rank) {
    const got = [];
    if (s && s.got) for (const id in s.got) if (s.got[id] != null) got.push(c + ':' + id);
    const deeds = [];
    if (s && s.proved) { deeds.push({ kind: 'proved', rank }); if ((+p.fame || 0) >= SK2.RENOWN) deeds.push({ kind: 'renowned_deed', rank }); }
    return { concepts: got, deeds, age: Math.floor(age != null ? age : SK.ageF(p)), fame: +p.fame || 0, sealed: SK2.sealed(p) };
  };
  // what is missing, in words (a stall's line)
  SK2.missWord = function (m, v) {
    if (m === 'age') { const a = v.needs.age || []; return `not before the age of ${a[0]}`; }
    if (m === 'absorbed') return 'it has gone into another art';
    if (m === 'fame') return 'too little known';
    return m.replace(/^[a-z]+:/, '').replace(/[_-]/g, ' ');
  };
  // S1's engine asks this at every edge of the player's table (SK.view's gate): the rung's route, as S1's arithmetic reads it
  SK2.gate = p => function (k, w, s, age) {
    const Eng = E(), ix = IX();
    const v = Eng.edgeVerdict(ix, k, w, SK2.factsAt(p, k, s, age, Eng.EDGE_RANK[w] || (Eng.EDGE_GATE[w] || [])[0]));
    if (!v) return null;   // no rung stands here: S1's own conditions
    const S1c = SK.E().conceptsOf(k, w);
    const concepts = [], other = [];
    let deed = false;
    for (const m of v.missing) {
      if (m.startsWith('concept:')) { const id = m.split(':')[2]; concepts.push(S1c.find(c => c.id === id) || { id, name: id.replace(/-/g, ' ') }); }
      else if (m.startsWith('deed:')) deed = true;
      else other.push(SK2.missWord(m, v));
    }
    return { concepts, deed, deedAsked: !!v.needs.deed, other, v };
  };
  // anyone else's edge in the closed form (S1's npcGain): the concepts are the closed form's; the rest of the route here.
  // His deed is his post's (a man who works at it daily is tried by it; S1 asked none of him) or a stretch won; a renowned
  // deed asks his post and renown (fame SK2.RENOWN, an office or a crown)
  SK2.npcGate = (p, cause) => function (k, w) {
    const Eng = E(), ix = IX(), e = Eng.edgeNeeds(ix, k, w);
    if (!e) return true;
    const n = Object.assign({}, e.needs); delete n.concept;
    if (!Object.keys(n).length) return true;
    // a post is the registry's or a crown as much as the player's own fields (SK.works, SK.highPost: H-167); p.office
    // alone is the player's mirror and was never true of anyone else, so no councillor or General was tried by his post
    const post = SK.works ? SK.works(p) : !!(p.job || p.mil || p.office || p.ruler), won = !!(cause && cause.q === 'stretch' && !cause.failed);
    const deeds = [];
    if (post || won) { deeds.push({ kind: 'proved', rank: e.rank }); if (post && ((+p.fame || 0) >= SK2.RENOWN || (SK.highPost ? SK.highPost(p) : p.office || p.ruler))) deeds.push({ kind: 'renowned_deed', rank: e.rank }); }
    return !Eng.missing(n, { deeds, age: A.age(p), fame: +p.fame || 0 }).length;
  };

  // ---- the moment: S1's table crossed a rank's edge (SK.drain hands the record here) ---------------------------------------
  // r = { k, kind: 'word', w, by (the moment's cause), deedBy (the deed's), g: { v: the verdict } }. Returns true when the
  // crossing was an evolution (and so logged here, not as a plain word).
  SK2.metWords = function (c, v, r) {
    const out = [], F = IX().FAM[c];
    for (const id of v.needs.concept || []) { const cn = F && (F.concepts || []).find(x => c + ':' + x.id === id); out.push('you see ' + (cn ? cn.name : id.split(':')[1].replace(/-/g, ' '))); }
    if (v.needs.deed) out.push('the deed: ' + SK.untoken(r.deedBy || r.by || 'a deed done'));
    if (v.needs.age) out.push('past ' + v.needs.age[0]);
    return out;
  };
  SK2.evolved = function (pc, r) {
    const Eng = E(), ix = IX();
    if (!r || r.kind !== 'word' || !Eng.EDGE_RANK[r.w] || !r.g || !r.g.v || r.g.v.kind !== 'evolve' || !isPC(pc)) return false;
    const v = r.g.v, fs = ix.BY[v.from], ts = ix.BY[v.to]; if (!fs || !ts) return false;
    const met = SK2.metWords(r.k, v, r), why = met.join('; ') || SK.untoken(r.by || 'the work');
    SK2.evNote(pc, { k: r.k, from: v.from, to: v.to, why: why.slice(0, 140), ok: v.ok ? 1 : 0, need: Object.keys(v.needs).sort().join(',') });
    SK.record(pc, r.k, 'evolve', `${fs.name} evolves: it becomes ${ts.name} (${why})`);
    A.log(`${fs.name} has gone as far as it goes and becomes ${ts.name}, ${ts.rank} · Lv 1 (${why}).`, 'big');
    if (SK.notable) SK.notable(pc, { text: `${ts.name}: ${fs.name.toLowerCase()} evolved` });
    SK2.evoGift(pc, r.k, v);
    return true;
  };
  // what an evolution brings (§15.5): the card where it matters, else the new rung's first months
  SK2.evoGift = function (pc, c, v) {
    const Eng = E(), ix = IX(), K = SK2.ke(pc), ts = ix.BY[v.to], fs = ix.BY[v.from];
    const big = Eng.rankIx(v.rank) >= Eng.rankIx(SK2.EVO_CARD_FROM), first = K.ev.filter(x => x.from && !x.how).length === 1;
    const mk = A.S.year * 12 + Math.floor(Math.min(364, A.S.warClock || 0) / 30.42);
    if (A.age(pc) >= 12 && (big || first) && K.cm !== mk && A.EV && A.EV.sk2_evolved && !A.S.queue.some(q => q && q.ev === 'sk2_evolved')) {
      K.cm = mk;
      A.queue({ type: 'event', ev: 'sk2_evolved', forced: true, ctx: { sk: c, from: v.from, to: v.to, fn: fs.name, fnl: fs.name.toLowerCase(), tn: ts.name, big: big ? 1 : 0 } });
      return 'card';
    }
    SK2.cardFx(pc, 'growth', { sk: c, to: v.to });
    return 'growth';
  };
  // the card keys (fx.skTurn, read by 36-skills' applyFx stage): 'point' a stat point through A.LV, 'growth' the new rung's
  // first months, 'merge' the merge a card offered (step 8)
  SK2.GROWTH_EU = 4;   // months of drill's effort: the first months of a new rank, worked while it is fresh
  SK2.cardFx = function (pc, what, ctx) {
    if (!pc || !ctx) return '';
    const ix = IX(), ts = ctx.to && ix.BY[ctx.to];
    if (what === 'point') {
      if (!A.LV || !A.LV.grant) return '';
      const n = A.LV.grant(pc, 1, ts ? ts.name : 'an evolution');
      if (n) SK.record(pc, ctx.sk || '', 'gift', `${ts ? ts.name : 'An evolution'}: a point for the body`);
      return n ? 'A point to place (Profile).' : '';
    }
    if (what === 'growth') {
      if (ctx.sk) A.gainXp(pc, ctx.sk, SK2.GROWTH_EU, { q: 'drill', why: `the first months of ${ts ? ts.name : 'a new rank'}` });
      return '';
    }
    if (what === 'merge' && SK2.doMerge) return SK2.doMerge(pc, ctx.rc, ctx.how === 'found' ? 'it came to you' : 'it was shown you') ? '' : '';
    return '';
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('skTurn');

  // ---- the save (version 21, D-192): an evolved rung is gone into its evolution. A save of an older version holds every
  // rung below a family's top at Lv 10; they are retired, the top kept, so every read is what it was (the family reads its
  // top rung, and what the rungs below gave passes on through its line); an art whose evolution is held goes the same way.
  // Idempotent: a state with nothing to retire is left alone. Returns the count retired.
  SK2.migrateLine = function (S) {
    S = S || A.S;
    const pc = S && S.people && S.people[S.pc];
    if (!pc || !(pc.ks && typeof pc.ks === 'object')) return 0;
    const Eng = E(), ix = IX();
    let n = 0;
    for (const c of SK.IDS) {
      let top = -1;
      for (const rank of Eng.HUMAN) { const id = Eng.rungOf(ix, c, rank); if (id && pc.ks[id]) top = Eng.rankIx(rank); }
      for (const rank of Eng.HUMAN) { if (Eng.rankIx(rank) >= top) break; const id = Eng.rungOf(ix, c, rank); if (id && pc.ks[id]) { delete pc.ks[id]; n++; } }
    }
    if (SK2.artGone && pc.ka && typeof pc.ka === 'object') for (const id of Object.keys(pc.ka).sort()) n += SK2.artGone(pc, id, true);
    return n;
  };

  // ---- the save (version 19): a player's evolutions before this step are noted as made before their reasons were kept ------
  SK2.migrateEvo = function (S) {
    S = S || A.S;
    const pc = S && S.people && S.people[S.pc];
    if (!pc || !pc.alive || !(pc.sk && typeof pc.sk === 'object') || (pc.ke && pc.ke.v)) return 0;
    const Eng = E(), ix = IX(), pre = [];
    for (const c of SK.IDS) {
      const s = pc.sk[c]; if (!s || !(s.lv > 0)) continue;
      const r = SK2.rungNow(s); if (!r) continue;
      for (const rank of Eng.HUMAN) { if (Eng.rankIx(rank) < 1 || Eng.rankIx(rank) > Eng.rankIx(r.rank)) continue; const id = Eng.rungOf(ix, c, rank); if (id) pre.push(id); }
    }
    pc.ke = { v: 1, ev: [], pre: pre.sort() };
    return pre.length;
  };

  // ---- anyone else: the closed form crossed an edge (36-skills' npcGain and the yearly pass) -------------------------------
  // from rank B up an evolution brings a stat point through A.LV (placed by his post's reasons at the year's turn), recorded
  // on his level (A.LV.grant); D to C, the commonest step of a working life, brings nothing more
  SK2.npcEvolved = function (p, c, lv0, lv1) {
    if (!p || isPC(p) || !A.LV || !A.LV.grant) return 0;
    const Eng = E();
    let n = 0;
    for (let w = SK.wordOf(lv0) + 1; w <= SK.wordOf(lv1); w++) {
      const rank = Eng.EDGE_RANK[w];
      if (rank && Eng.rankIx(rank) >= Eng.rankIx(SK2.EVO_CARD_FROM)) n += A.LV.grant(p, 1, SK2.rungName(c, rank)) || 0;
    }
    return n;
  };
})();
