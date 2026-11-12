// 99998-v2-saves: the v2 state is a versioned part of the release's save (V2_SPEC step 9).
//
// - A.SAVE_VER 13 -> 14: a state of version 13 or older was made before v2, or by a v2 build that made its fields
//   lazily. A.V2SAVE.upgrade runs every lane's own upgrade once, in a fixed order (map, bodies, faith, family, court,
//   diplomacy, war, time), right after the release's A.migrate chain. Each step only fills what is missing, so an
//   upgrade of a v2 state changes nothing.
// - SAVES.FMT 2 -> 3: people are stored without the fields that hold their default value (A.packState / unpackState,
//   the release's packing of houses extended to people). An older build refuses a format-3 save by the release's own
//   "made by a newer version" path; this build refuses a state of a newer version the same way, and a save made on the
//   Great Continent of the Far Lands (gone from this build) with a sentence that says so.
// Nothing here draws from A.rand: the lanes' upgrades are seeded from the game's seed, and the stream is put back.
(function () {
  const SV = A.V2SAVE = A.V2SAVE || {};
  SV.VER = 14;
  SV.FMT = 3;
  SV.FROM = A.SAVE_VER;            // the release's version (13): a state at or below it is pre-v2
  A.SAVE_VER = SV.VER;
  SAVES.FMT = SV.FMT;

  // ---- the upgrade, old save -> v2 --------------------------------------------------------------------------------
  const pcOf = S => S && S.people && S.people[S.pc];
  // the generated continent replaces the map as written only for the release's own province list
  const releaseProv = S => {
    const VM = A.V2MAP; if (!VM || !VM.on() || !Array.isArray(S.prov)) return false;
    const R = VM.release(); return S.prov.length === R.n && S.prov.every((p, i) => p && p.id === i);
  };
  SV.STEPS = [
    // 1. the map: the provinces take the generated continent's geometry from the seed (99991's A.V2MAP.onProv)
    ['map', S => { if (!S.v2map && releaseProv(S)) A.V2MAP.onProv(S); }],
    // 2. the player's body, read from the old stats by percentile (99993's A.V2S.migrate)
    ['body', S => { const pc = pcOf(S), VS = A.V2S; if (VS && pc && pc.alive && pc.st && pc.pot && !(pc.v2 && pc.v2.v === VS.VERSION)) VS.migrate(pc); }],
    // 3. faith: a player who lived devout under the old rules keeps the faith; anyone else's piety turns to pull on the
    //    first month (99993's monthly rule), so nothing is lost
    ['faith', S => {
      const pc = pcOf(S), VS = A.V2S; if (!VS || !pc || !pc.alive || !pc.flags || VS.hasFaith(pc)) return;
      if ((+pc.piety || 0) >= VS.PIETY0 + 20) pc.flags.v2_faith = pc.flags.v2_faith || S.year;
    }],
    // 4. three generations of kin and the house laws (99994's A.V2F.extendFamily; the laws are derived, not stored)
    ['family', S => { const pc = pcOf(S), F = A.V2F; if (F && F.extendFamily && pc && pc.alive && pc.flags && !pc.flags.v2_family) F.extendFamily(pc); }],
    // 5. every realm's court, from the counts up and down (99995's A.V2N.build)
    ['court', S => { if (!S.court && A.V2N && A.V2N.build) A.V2N.build(); }],
    // 6. diplomacy: v2's own reasons start empty, each ruler is known as of old (99996's store)
    ['diplomacy', S => {
      if (!A.V2DIP) return;
      const V = S.v2dip = S.v2dip && typeof S.v2dip === 'object' ? S.v2dip : {};
      if (!V.f || typeof V.f !== 'object') V.f = {};
      if (!V.p || typeof V.p !== 'object') V.p = {};
      if (!V.ruler || typeof V.ruler !== 'object') V.ruler = {};
      if (!Array.isArray(V.h)) V.h = [];
      for (const id of Object.keys(S.realms || {}).sort()) { const r = S.realms[id]; if (r && r.alive !== false && !V.ruler[id]) V.ruler[id] = [r.ruler != null ? String(r.ruler) : '', -99]; }
    }],
    // 7. war: no rumours yet (99997's store)
    ['war', S => {
      if (!A.V2W && !A.V2.war) return;
      const W = S.v2w = S.v2w && typeof S.v2w === 'object' ? S.v2w : {};
      if (!Array.isArray(W.rum)) W.rum = [];
      if (!Array.isArray(W.heard)) W.heard = [];
    }],
    // 8. the clock (99992's store)
    ['time', S => { if (A.V2T && A.V2T.st) A.V2T.st(); }],
  ];
  SV.last = null;
  // runs on A.S (the lanes read it); the game's random stream stands where it was
  SV.upgrade = function (S) {
    S = S || A.S; if (!S || !S.people) return [];
    const keepS = A.S, keepR = A.rngState, ran = [];
    A.S = S;
    try {
      for (const [k, f] of SV.STEPS) {
        try { f(S); ran.push(k); } catch (e) { console.error('v2 save upgrade: ' + k, e); }
      }
    } finally { A.rngState = keepR; A.S = keepS; }
    if (A.cacheResetAll) A.cacheResetAll();
    S.ver = SV.VER;
    return ran;
  };

  // the release's A.migrate (and the features' wrappers) first, then the v2 step, once, for a state made before it
  let from = null;
  const mig = A.migrate;
  A.migrate = function (S) {
    from = null;
    // a state of a newer version is refused before it replaces the game's (A.deserialize assigns what this returns)
    if (S && +S.ver > SV.VER) throw new Error('the save was made by a newer version of the game');
    from = S ? (S.ver || 8) : null;
    return mig.apply(this, arguments);
  };
  const des = A.deserialize;
  A.deserialize = function () {
    const r = des.apply(this, arguments);
    SV.last = null;
    if (from != null && from < SV.VER && A.S) {
      const f = from; from = null;
      SV.last = { from: f, steps: SV.upgrade(A.S) };
      A.S.rng = A.rngState;
    }
    return r;
  };
  // a migrated life cannot be replayed from its journal (its start was another world): it starts a fresh one here
  const jr = A.journalResume;
  if (jr) A.journalResume = function (J) { if (SV.last) arguments[0] = null; return jr.apply(this, arguments); };

  // ---- refusing what this build cannot read ---------------------------------------------------------------------------
  const dec = SAVES.decode;
  SAVES.decode = async function () {
    const d = await dec.apply(this, arguments);
    const S = d && d.S, v = Math.max(+(S && S.ver) || 0, +(d && d.meta && d.meta.ver) || 0);
    if (v > SV.VER) throw new Error('the save was made by a newer version of the game');
    const parts = S && S.world && Array.isArray(S.world.parts) ? S.world.parts.filter(x => x !== 'ardan') : [];
    if (parts.length) throw new Error('it was made on the Great Continent, whose far lands this version of the game no longer has');
    return d;
  };

  // ---- people without their defaults ----------------------------------------------------------------------------------
  // the value most people hold for a field; a person stores only the fields that differ, and the order of their keys is
  // kept as a shape shared by everyone with the same keys (19 shapes for ~1,200 people after 8 years)
  SV.PDEF = {
    dyn: null, piety: 30, assets: [], school: null, exSpouses: [], deeds: [], kills: 0, happy: 60, honor: 50, wounds: [],
    mil: null, npc: true, blood: null, job: null, spouse: null, flags: {}, epithet: '', alive: true, died: null, cause: null,
    ruler: null, surMode: 'house', health: 100, title: '', children: [], literate: false, noble: null, castId: null,
    coin: 0, fame: 0, home: 0, parents: [], rel: {}, quirks: [], skills: {}, occ: '', house: null,
    gear: { weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null },
  };
  const DJ = {}; for (const k in SV.PDEF) DJ[k] = JSON.stringify(SV.PDEF[k]);
  const plain = p => p && typeof p === 'object' && !Array.isArray(p);
  const pack = A.packState, unpack = A.unpackState;
  A.packState = function (S) {
    const out = pack.apply(this, arguments);
    if (!S || !plain(S.people) || out.ppl) return out;
    const shapes = [], idx = new Map(), P = {};
    for (const id in S.people) {
      const p = S.people[id];
      if (!plain(p) || '_s' in p) { P[id] = p; continue; }
      const keys = Object.keys(p).filter(k => p[k] !== undefined), sk = keys.join(',');
      let si = idx.get(sk); if (si == null) { si = shapes.length; shapes.push(keys); idx.set(sk, si); }
      const d = { _s: si };
      for (const k of keys) { const v = p[k]; if (k in DJ && JSON.stringify(v) === DJ[k]) continue; d[k] = v; }
      P[id] = d;
    }
    out.people = P; out.ppl = { v: 1, shapes };
    return out;
  };
  A.unpackState = function (S) {
    if (S && S.packed && S.ppl && plain(S.people)) {
      const shapes = S.ppl.shapes || [];
      for (const id in S.people) {
        const d = S.people[id]; if (!plain(d) || typeof d._s !== 'number' || !shapes[d._s]) continue;
        const o = {};
        for (const k of shapes[d._s]) { if (k in d) o[k] = d[k]; else if (k in DJ) o[k] = JSON.parse(DJ[k]); }
        S.people[id] = o;
      }
      delete S.ppl;
    }
    return unpack.apply(this, arguments);
  };

  // ---- the v2 invariants, for the tests --------------------------------------------------------------------------------
  SV.check = function () {
    const S = A.S, bad = [], P = S.prov || [];
    // one continent: v2's map, every province reached by land from the first, no far lands, no sea links
    if (!S.v2map) bad.push('no v2 map');
    const seen = new Set([0]), q = [0];
    while (q.length) { const i = q.pop(); for (const j of (P[i] && P[i].adj) || []) if (!seen.has(j)) { seen.add(j); q.push(j); } }
    if (seen.size !== P.length) bad.push(`${P.length - seen.size} provinces cut off`);
    if (P.some(p => p.sea && p.sea.length)) bad.push('sea links');
    if (S.world && (S.world.parts || []).some(x => x !== 'ardan')) bad.push('far lands');
    // one holder per title (99994's audit)
    const au = A.V2F && A.V2F.audit ? A.V2F.audit() : [];
    if (au.length) bad.push('titles: ' + au.slice(0, 3).map(b => b.k + ' ' + b.id + ' ' + (b.holders || []).join('/')).join(', '));
    // caps: the player's body within its ceilings, the mind's training within v2's range
    const pc = A.pc(), VS = A.V2S;
    if (pc && pc.alive && VS) {
      if (!(pc.v2 && pc.v2.v === VS.VERSION)) bad.push('no body');
      else {
        const v = VS.vperson(pc);
        for (const a in pc.v2.c) { const cap = A.V2.body.ceiling(v, a); if (!(pc.v2.c[a] >= 0.5 - 1e-6 && pc.v2.c[a] <= cap + 1e-3)) bad.push(`${a} ${pc.v2.c[a]} over ${cap}`); }
        for (const s in pc.v2.mt) if (!(pc.v2.mt[s] >= 0.5 - 1e-6 && pc.v2.mt[s] <= 3 + 1e-6)) bad.push(`mind ${s} ${pc.v2.mt[s]}`);
        if ((pc.v2.bt || []).length > 24) bad.push('breakthroughs');
      }
      for (const s of GD.STATS) if (!isFinite(pc.st[s])) bad.push('stat ' + s);
    }
    // the stores are there
    for (const k of ['court', 'v2dip', 'v2w', 'v2t']) if (!S[k]) bad.push('no ' + k);
    if (S.ver !== SV.VER) bad.push('version ' + S.ver);
    return bad;
  };
})();
