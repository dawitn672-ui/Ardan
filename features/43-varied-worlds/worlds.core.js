// A different world each run (Road to Ten, Replay 3: "vary the world each run: different starting tensions, history
// branching differently"). The release rolls 13 scripted branches of history at the start (A.rollBranches: a war
// that comes or doesn't, a wedding, a fall) and plays them out in the first year, but every run starts from the same
// map: the same borders, the same treasuries to the coin, the same stability, the same 40 alliances. Now a game
// started from the menu (o.world 'varied', the default there) also rolls:
//   fortunes:    each realm's treasury ×0.6–1.4 and stability ±15;
//   old wars:    two to four borders where an older war went the other way: one or two frontier provinces changed
//                hands some years before, and the loser still claims them;
//   feuds:       up to two rival neighbours already at war;
//   falling-out: up to three alliances broken.
// What was rolled is written into the world's history and told at birth. Games started by code (tests, the bot league)
// default to the world as written, so measurements stay comparable.
//
// Engine side: A.newGame and A.initWorld are wrapped; everything is drawn from the game's own seed.
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const W = A.WORLDS = { pending: false, BORDERS: [2, 4], FEUDS: 2, BREAKS: 3 };

  const ng = A.newGame;
  A.newGame = function (o) {
    W.pending = !!(o && o.world === 'varied');
    try { return ng.apply(this, arguments); } finally { W.pending = false; }
  };

  // the realms that can take part: alive, not rebels, with a capital
  const realms = () => Object.values(A.S.realms).filter(r => r && r.alive && !r.isRebel && r.capitalProv != null);
  const name = id => (A.realmShort ? A.realmShort(id) : (A.realm(id) || {}).short || id);
  const at = (a, b) => (A.S.wars || []).some(w => (w.att.includes(a) && w.def.includes(b)) || (w.att.includes(b) && w.def.includes(a)));

  W.vary = function () {
    const S = A.S, notes = [];
    // fortunes
    for (const r of realms()) {
      r.treasury = Math.round((r.treasury || 0) * A.rf(0.6, 1.4));
      r.stability = clamp(Math.round((r.stability || 50) + A.ri(-15, 15)), 10, 90);
    }
    // old wars that went the other way: frontier provinces with no garrison change hands
    const nB = A.ri(W.BORDERS[0], W.BORDERS[1]);
    const caps = new Set(realms().map(r => r.capitalProv));
    for (let k = 0, guard = 0; k < nB && guard < 40; guard++) {
      const P = A.pick(S.prov);
      if (!P || caps.has(P.id) || !A.realm(P.owner) || A.realm(P.owner).isRebel) continue;
      if (A.divsAt && A.divsAt(P.id).length) continue;
      const nbrs = [...new Set(P.adj.map(j => S.prov[j] && S.prov[j].owner).filter(o => o && o !== P.owner && A.realm(o) && A.realm(o).alive && !A.realm(o).isRebel))];
      if (!nbrs.length) continue;
      const win = A.pick(nbrs), lose = P.owner, ago = A.ri(4, 30);
      const take = [P];
      const Q = S.prov[A.pick(P.adj)];
      if (Q && Q.owner === lose && !caps.has(Q.id) && !(A.divsAt && A.divsAt(Q.id).length) && A.chance(0.4)) take.push(Q);
      for (const T of take) { T.owner = win; T.occ = null; }
      const what = take.map(T => T.name).join(' and ');
      S.history.push({ y: S.year - ago, t: `${what} passed from ${name(lose)} to ${name(win)} in a border war.` });
      notes.push(`${what} ${take.length > 1 ? 'are' : 'is'} ${name(win)}'s, won from ${name(lose)} ${ago} years ago, and ${name(lose)} still claims ${take.length > 1 ? 'them' : 'it'}`);
      k++;
    }
    // falling-out: alliances broken
    const pairs = [];
    for (const r of realms()) for (const b of r.allies || []) if (r.id < b && A.realm(b) && A.realm(b).alive) pairs.push([r.id, b]);
    for (let k = A.ri(0, W.BREAKS); k > 0 && pairs.length; k--) {
      const [a, b] = pairs.splice(A.ri(0, pairs.length - 1), 1)[0];
      const ra = A.realm(a), rb = A.realm(b);
      ra.allies = ra.allies.filter(x => x !== b); rb.allies = rb.allies.filter(x => x !== a);
      if (A.setRelPair) A.setRelPair(a, b, A.ri(-30, 0));
      notes.push(`${name(a)} and ${name(b)} are no longer allies`);
    }
    // feuds: rival neighbours already at war
    const feuds = [];
    for (const r of realms()) for (const b of r.rivals || []) {
      const rb = A.realm(b);
      if (!rb || !rb.alive || rb.isRebel || r.id > b || at(r.id, b)) continue;
      const touch = S.prov.some(P => P.owner === r.id && P.adj.some(j => S.prov[j] && S.prov[j].owner === b));
      if (touch) feuds.push([r.id, b]);
    }
    for (let k = A.ri(0, W.FEUDS); k > 0 && feuds.length; k--) {
      const [a, b] = feuds.splice(A.ri(0, feuds.length - 1), 1)[0];
      if (at(a, b) || !A.startWar) continue;
      A.startWar(a, b, null, 'conquest', { silent: true });
      notes.push(`${name(a)} and ${name(b)}, old rivals, are at war again`);
    }
    if (A.updateRealmPops) A.updateRealmPops();
    if (A.locDirty) A.locDirty();
    S.worldNotes = notes;
    return notes;
  };

  const init = A.initWorld;
  A.initWorld = function () {
    const r = init.apply(this, arguments);
    if (W.pending) { try { W.vary(); } catch (e) { console.error('worlds', e); } }
    return r;
  };

  // told at birth, after the life begins
  A.onMonth.push(pc => {
    const S = A.S;
    if (!pc || !Array.isArray(S.worldNotes) || S.worldTold) return;
    const N = S.worldNotes.slice(0, 4);
    S.worldTold = 1;
    if (N.length) A.log(`The world you are born into is not quite the one the old maps show. ${N.map(s => s[0].toUpperCase() + s.slice(1)).join('. ')}.`, 'muted');
  });
})();
