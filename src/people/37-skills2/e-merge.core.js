// Skills rebuild, step 8 (docs/design/skills-v2.md §3.4, §10; the owner's answers §15.2, §15.8; D-182): merging and
// advancing, for the player.
//
// Merging. A recipe (data/skills/recipes.json) joins two level-10 skills of different families into one. Only a family's
// top rung at Lv 10 is a part (past Lv 10 a skill evolves or merges, not both); a known recipe is offered on a card
// (sk2_merge_offer) when a teacher or a school is in reach, at most once in SK2.OFFER_GAP years a recipe; a found recipe
// comes at a named moment (1 in 200, once a life, by a hash of the moment: no die). Taken, the result is held in pc.ks
// beside the ladders ({ lv, xp, via: 'merge', rc, of, fams, floor, y }), listed in pc.ke.m, and its parts are absorbed:
// they show nowhere, never evolve (the gate seals them: d-evolve) and their families read through the result, never below
// the better part's read (its floor). The ladders' entries stay in pc.ks as S1's working form under the rungs. The result
// levels by its rank's costs from what its families earn each month (the ledger's experience), and stops at Lv 10.
//
// Advancing (awakening). At a named moment (a fight won far above you: deed_above; a near death: near_death) a skill held
// at Lv 5 or more may jump to the next rank's Lv 1 without the rest of its levels: 1 in 100 a moment, by a hash of the
// moment, at most once a life, and only while D-163's breakthrough budget is open (an advance is a breakthrough and
// spends it). Its concepts are deemed grasped (SK.set's rule), its deed is the moment, and it always costs something
// named: a wound that stays. Recorded with its reason in pc.ke.ev, the skill's record, the log and the year's digest.
//
// Anyone else holds one number a skill and merges and advances nothing (deferred: the census of named skills, step 9).
(function () {
  const SK = A.SK, SK2 = A.SK2; if (!SK || !SK.DATA || !SK2 || !SK2.E || !SK2.ke) return;
  const E = () => SK2.E(), IX = () => SK2.IX();
  const isPC = p => !!(p && A.S && p.id === A.S.pc);
  SK2.OFFER_GAP = 3;          // years between two offers of one known recipe
  SK2.OFFER_FROM = 16;        // the age from which a merge is offered

  // ---- what a family reads through a merge (hot: every check of the player) -------------------------------------------
  SK2.mergedRead = function (p, c) {
    const K = p && p.ke; if (!K || !Array.isArray(K.m) || !K.m.length || !p.ks) return 0;
    const ix = IX(), Eng = E();
    let best = 0;
    for (const id of K.m) { const s = ix.BY[id], e = p.ks[id]; if (!s || !e || !(s.reads || []).includes(c)) continue; const v = Eng.entryRead(ix, id, e); if (v > best) best = v; }
    return best;
  };
  // the merged skill a family reads through (the best), or null
  SK2.mergedOf = function (p, c) {
    const K = p && p.ke; if (!K || !Array.isArray(K.m) || !K.m.length || !p.ks) return null;
    const ix = IX(), Eng = E();
    let best = null;
    for (const id of K.m) { const s = ix.BY[id], e = p.ks[id]; if (!s || !e || !(s.reads || []).includes(c)) continue; const v = Eng.entryRead(ix, id, e); if (!best || v > best.v) best = { id, e, s, v }; }
    return best;
  };
  SK2.absorbed = (p, id) => SK2.sealed(p).includes(id);

  // ---- what the player holds as cards: each family's top rung (unless absorbed) and his merged skills ---------------------
  SK2.tops = function (pc) {
    const out = {}, sealed = SK2.sealed(pc);
    if (!pc || !(pc.sk && typeof pc.sk === 'object')) return out;
    for (const c of SK.IDS) {
      const r = SK2.rungFor(pc, c); if (!r) continue;
      const id = E().rungOf(IX(), c, r.rank); if (!id || sealed.includes(id)) continue;
      out[id] = { lv: r.lv, c };
    }
    const K = pc.ke;
    if (K && Array.isArray(K.m)) for (const id of K.m) if (pc.ks && pc.ks[id]) out[id] = { lv: pc.ks[id].lv, merged: true };
    return out;
  };
  // someone who knows how they join: a school, or one of the people a life learns from (A.teacherFor's: a mentor, a
  // master, a comrade, a friend, kin, his lord) who stands at the result's rank or above in one of its families
  SK2.TEACH_RELS = ['mentor', 'master', 'comrade', 'friend', 'bestfriend', 'mother', 'father', 'sibling', 'spouse', 'lord'];
  SK2.knows = function (pc, r) {
    if (!r || r.kind !== 'known' || !pc) return false;
    if (pc.school) return true;
    const ix = IX(), res = ix.BY[r.result]; if (!res || !A.relsOf) return false;
    const bar = E().value(res.rank, 1);
    for (const { p } of A.relsOf(pc, SK2.TEACH_RELS)) {
      if (!p || !p.alive || !p.skills) continue;
      for (const f of res.reads || []) if (A.skill(p, f) >= bar) return true;
    }
    return false;
  };
  SK2.mergeFacts = (pc, moment) => ({ skills: SK2.tops(pc), knows: id => SK2.knows(pc, IX().RECIPE[id]), census: () => 0, age: A.age(pc), moment });
  // is this recipe open to the player now (its parts held at Lv 10, the result not yet his)? the card's own offer stands
  // for the knowing
  SK2.mergeOpen = function (pc, rc) {
    const ix = IX(), r = ix.RECIPE[rc]; if (!r || !pc || !pc.sk) return false;
    return E().canMerge(ix, r, Object.assign(SK2.mergeFacts(pc, r.moment), { knows: () => true })).ok;
  };
  SK2.doMerge = function (pc, rc, why) {
    const ix = IX(), Eng = E(), r = ix.RECIPE[rc];
    if (!r || !isPC(pc) || !SK2.mergeOpen(pc, rc)) return false;
    const tops = SK2.tops(pc), e = Eng.mergeEntry(ix, r, tops, A.S.year), res = ix.BY[r.result], K = SK2.ke(pc);
    pc.ks = pc.ks && typeof pc.ks === 'object' ? pc.ks : {};
    pc.ks[r.result] = e;
    K.m = Array.isArray(K.m) ? K.m : [];
    if (!K.m.includes(r.result)) K.m.push(r.result);
    for (const c of e.fams) if (pc.sk[c]) SK.mirror(pc, c);
    const names = r.parts.map(p => ix.BY[p.id].name), w = `${names.join(' and ')} become one (${why || 'a merge'})`;
    SK2.evNote(pc, { how: 'merge', rc, to: r.result, of: e.of.slice(), why: w.slice(0, 140), ok: 1 });
    SK.record(pc, e.fams[0] || '', 'merge', `${res.name}: ${w}`);
    A.log(`${names.join(' and ')} are one art now: ${res.name}, ${res.rank} · Lv 1. Neither will grow on its own again.`, 'big');
    if (SK.notable) SK.notable(pc, { text: `${res.name}: ${names.join(' and ').toLowerCase()} joined` });
    if (A.cacheResetAll) try { A.cacheResetAll(); } catch (err) {}
    return true;
  };

  // ---- the month (36-skills' SK.month calls it after the rungs are written) --------------------------------------------
  SK2.afterMonth = function (pc, v) {
    if (!isPC(pc) || !pc.alive || !(pc.sk && typeof pc.sk === 'object')) return;
    const K = pc.ke, ix = IX(), Eng = E();
    // a merged skill grows from what its families earned this month, their mean: one art, worked from either side, grows
    // as one ladder would (kin's carry-over left out)
    if (K && Array.isArray(K.m) && K.m.length && v && Array.isArray(v.ledger)) for (const id of K.m) {
      const e = pc.ks && pc.ks[id], s = ix.BY[id]; if (!e || !s) continue;
      const fams = e.fams || s.reads || [];
      let x = 0; for (const l of v.ledger) if (l.xp > 0 && fams.includes(l.k) && !(l.tags || []).includes('kin')) x += l.xp;
      x /= Math.max(1, fams.length);
      if (!(x > 0)) continue;
      const lv0 = e.lv, n = Eng.addXp(s.rank, e, x);
      if (n > 0) {
        for (const c of e.fams || s.reads || []) if (pc.sk[c]) SK.mirror(pc, c);
        SK.record(pc, (e.fams || [])[0] || '', 'merged', `${s.name} rises to ${s.rank} · Lv ${e.lv}`);
        if (Math.floor(e.lv / 5) > Math.floor(lv0 / 5)) A.log(`${s.name} rises to ${s.rank} · Lv ${e.lv}.`, 'good');
      }
    }
    // a known recipe offered, once in a while, when its parts are ready and someone can show it
    if (A.age(pc) >= SK2.OFFER_FROM && A.EV && A.EV.sk2_merge_offer && !A.S.queue.some(q => q && q.ev === 'sk2_merge_offer')) {
      const f = SK2.mergeFacts(pc);
      for (const r of ix.recipes) {
        if (r.kind !== 'known') continue;
        const off = K && K.off && K.off[r.id];
        if (off != null && A.S.year - off < SK2.OFFER_GAP) continue;
        // the parts first (cheap); who knows it is asked only then
        if (!r.parts.every(p => f.skills[p.id] && f.skills[p.id].lv >= p.lv) || !Eng.canMerge(ix, r, f).ok) continue;
        SK2.offer(pc, r, 'known');
        break;
      }
    }
    // a near death is a moment (36-skills' life marks the month it came: sk_neardeath)
    if (pc.flags && pc.flags.sk_neardeath === A.S.year && !(K && K.nd === A.S.year)) { SK2.ke(pc).nd = A.S.year; SK2.moment(pc, 'near_death', { why: 'a near death' }); }
  };
  SK2.offer = function (pc, r, how) {
    const ix = IX(), K = SK2.ke(pc), names = r.parts.map(p => ix.BY[p.id].name.toLowerCase());
    K.off = K.off && typeof K.off === 'object' ? K.off : {};
    K.off[r.id] = A.S.year;
    A.queue({ type: 'event', ev: 'sk2_merge_offer', forced: true, ctx: { rc: r.id, an: names[0], bn: names[1], rn: ix.BY[r.result].name, how: how === 'found' ? 'In the worst of it something comes clear.' : 'Someone who has seen it done tells you plainly.', kind: how } });
  };

  // ---- a named moment: a found merge, an advance -----------------------------------------------------------------------
  // the moment's own key: the world, the player, the moment's kind and how many moments his life has had
  SK2.moment = function (pc, kind, o) {
    if (!isPC(pc) || !pc.alive || !(pc.sk && typeof pc.sk === 'object')) return null;
    const K = SK2.ke(pc);
    K.n = (K.n || 0) + 1;
    const key = `${A.S.seed}|${pc.id}|${kind}|${K.n}`, out = {};
    out.found = SK2.foundAt(pc, kind, key);
    out.adv = SK2.advanceAt(pc, kind, o || {}, key);
    return out;
  };
  SK2.foundAt = function (pc, kind, key) {
    const K = SK2.ke(pc), ix = IX(), Eng = E();
    if (K.fd || A.age(pc) < SK2.OFFER_FROM) return null;
    const f = SK2.mergeFacts(pc, kind);
    const open = ix.recipes.filter(r => r.kind === 'found' && Eng.canMerge(ix, r, f).ok);
    if (!open.length || !(Eng.unitOf(key + '|found') < Eng.FOUND_CHANCE)) return null;
    K.fd = A.S.year;   // once a life it comes, taken or not
    SK2.offer(pc, open[0], 'found');
    return open[0].id;
  };
  // the family an advance takes: the moment's own (a duel's weapon) when it qualifies, else the highest held at Lv 5 or
  // more that has a next rank (by read, then by name)
  SK2.advanceAt = function (pc, kind, o, key) {
    const K = SK2.ke(pc), ix = IX(), Eng = E();
    if ((K.adv || 0) >= Eng.ADVANCES_A_LIFE) return null;
    if (A.breakthroughOpen && !A.breakthroughOpen(pc)) return null;
    if (!(Eng.unitOf(key + '|adv') < Eng.ADVANCE_CHANCE)) return null;
    const tops = SK2.tops(pc), facts = { skills: tops, moment: kind, advances: K.adv || 0 };
    const cand = [];
    for (const id in tops) {
      const t = tops[id]; if (!t.c) continue;
      const v = Eng.canAdvance(ix, { id, lv: t.lv }, facts);
      if (v.ok && Eng.HUMAN.includes(ix.BY[v.to].rank)) cand.push({ id, c: t.c, lv: t.lv, to: v.to, read: Eng.value(ix.BY[id].rank, t.lv) });
    }
    const own = o.k && SK.canon(o.k)[0];
    cand.sort((a, b) => (b.c === own) - (a.c === own) || b.read - a.read || (a.c < b.c ? -1 : 1));
    const pick = cand[0]; if (!pick) return null;
    return SK2.advance(pc, pick, kind, o.why || kind.replace(/_/g, ' '));
  };
  SK2.ADVANCE_COST = { deed_above: ['scar_arm', 'scar_face', 'scar_chest'], near_death: ['scar_chest', 'scar_face', 'scar_arm'] };
  SK2.advance = function (pc, pick, kind, why) {
    const ix = IX(), Eng = E(), K = SK2.ke(pc), to = ix.BY[pick.to], from = ix.BY[pick.id];
    // the next rank's first level, on S1's table under the rungs: its concepts deemed grasped (SK.set's rule)
    SK.set(pc, pick.c, Eng.s1OfRung(to.rank, 1), 'an advance: ' + why);
    if (pc.sk[pick.c]) pc.sk[pick.c].xp = 0;
    SK2.syncFam(pc, pick.c);
    // a breakthrough: it spends D-163's budget
    pc.btN = (pc.btN || 0) + 1; pc.btY = A.S.year;
    K.adv = (K.adv || 0) + 1;
    // the price, named: a wound that stays
    let cost = null;
    for (const w of SK2.ADVANCE_COST[kind] || SK2.ADVANCE_COST.near_death) { cost = A.addWound(pc, w); if (cost) break; }
    if (!cost) { pc.health = Math.max(5, (pc.health || 50) - 10); cost = 'ten years\' wear in a season'; }
    const w = `${why}; it cost you: ${String(cost).toLowerCase()}`;
    SK2.evNote(pc, { how: 'advance', k: pick.c, from: pick.id, to: pick.to, why: w.slice(0, 140), ok: 1, at: pick.lv });
    SK.record(pc, pick.c, 'advance', `${from.name} leaps to ${to.name}: ${w}`);
    A.log(`In ${why}, something gives way: ${from.name} leaps past its last levels to ${to.name}, ${to.rank} · Lv 1. It cost you: ${String(cost).toLowerCase()}.`, 'big');
    if (SK.notable) SK.notable(pc, { text: `${to.name}: an advance (${why})` });
    return `${to.name}: an advance. It cost you: ${String(cost).toLowerCase()}.`;
  };
})();
