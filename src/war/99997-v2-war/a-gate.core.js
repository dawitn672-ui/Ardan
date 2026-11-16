// 99997-v2-war, part 1: you see only the war you fight in (V2_SPEC complaint 10, integration step 8).
//
// A war is yours when you fight in it: your realm (as its ruler) or your employer (enlisted, as an officer or a
// general, in an order, or as a sell-sword under contract) is one of its sides. Being born in a realm at war is not
// enough. For any other war the War Room, the War tab's war cards, a battle and the battle's cut-in stay shut, and its
// battles reach you only as rumour (A.V2.war.rumourOfBattle): late, and sometimes wrong.
//
// Engine side: A.fightEnd notes the fight it closes, A.news drops a battle report for a war that is not yours and keeps
// a rumour instead, A.onMonth hands out rumours that are due. The rumour's dice are v2's own makeRng, seeded from the
// game's seed and the fight, so nothing is drawn from A.rand. UI side: UI.warRoomOpen, A.warRoomView, A.queue
// (a war's battle or war room), V2T.atWar (the War place), 96-big-moments' battle cut-in, and the war lists of the War tab
// and the World's Wars view.
(function () {
  const V2 = A.V2 || {}, VW = V2.war;
  if (!VW) return;
  const W = A.V2W = A.V2W || {};
  W.SIGN = 'v2-war';

  // ---- whose war ----------------------------------------------------------------------------------------------------
  // the realm you fight for: a ruler's own, the realm you serve in, or a sell-sword's employer
  W.side = function (pc) {
    if (!pc || !pc.alive) return null;
    if (pc.ruler) return pc.ruler;
    if (pc.mil) {
      if (!pc.mil.merc) return pc.mil.realm || null;
      return pc.mil.contract || null;
    }
    if (pc.company && pc.company.contract) return pc.company.contract;
    // W1-3: a lord who rode to the muster with his men is in his crown's war until it ends or he goes home (A.CMD.ridesWith)
    if (A.CMD && A.CMD.ridesWith) { const rid = A.CMD.ridesWith(pc); if (rid) return rid; }
    if (A.S && A.S.armies && A.S.armies.some(a => a && a.gen === pc.id)) { const a = A.S.armies.find(x => x && x.gen === pc.id); return a.realm || null; }
    return null;
  };
  W.myWars = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    const rid = W.side(pc);
    return rid && A.atWar ? A.atWar(rid) : [];
  };
  // a levy called out at home (72-one-battle-two-scales) stands in the fight while the scene runs
  W.inLevy = () => !!(A.S && ((A.S.tsq && A.S.tsq.m && A.S.tsq.m.ts && A.S.tsq.m.ts.levy) || (A.S.queue || []).some(q => q && q.type === 'mission' && q.m && q.m.ts && q.m.ts.levy)));
  W.inWar = function (pc) { return W.myWars(pc).length > 0 || W.inLevy(); };
  // the War Room by post (D10, D-052; owner order 5, "war screens only when deployed, on a mission, or the situation
  // allows"). It was the room of anyone who served (a private in garrison, in peace, read the whole theatre). Now:
  //  - the crown keeps it in peace and war: the host is its to run (W1-1: there is no Marshal);
  //  - in a war of yours, a commander (rank 7 and up, an army's general) sees the theatre;
  //  - a captain (ranks 4-6, a sell-sword captain) only while deployed (his division with an army in the field, his
  //    company under contract), and then only his division's front (W.scope);
  //  - a soldier or a sergeant never: his war is his company, his orders and rumour (the War tab, the battle at his rank).
  W.canRoom = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    if (!pc || !pc.alive || !W.side(pc)) return false;
    if (pc.ruler) return true;
    const R2 = A.cmdRole ? A.cmdRole(pc) : null;
    if (R2 && (R2.recruit || R2.production)) return true;
    if (!W.myWars(pc).length) return false;
    const rk = W.rank(pc);
    return rk === 'commander' || (rk === 'captain' && W.deployed(pc));
  };
  // in the field: an army's general, a division that marches with an army, a free company under contract
  W.deployed = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    if (!pc || !A.S) return false;
    if (pc.ruler || (A.S.armies || []).some(a => a && a.gen === pc.id)) return true;
    if (pc.company && pc.company.contract) return true;
    if (pc.mil && pc.mil.merc) return !!pc.mil.contract;
    const d = pc.mil && pc.mil.div && A.divById ? A.divById(pc.mil.div) : null;
    return !!(d && d.army && A.army && A.army(d.army));
  };
  // your own divisions: the one you serve in, the armies you lead (a ruler's are all of his realm's)
  W.ownDivs = function (pc) {
    const out = new Set();
    if (!pc || !A.divById) return out;
    if (pc.mil && pc.mil.div) out.add(pc.mil.div);
    for (const a of (A.S && A.S.armies) || []) if (a && a.gen === pc.id) for (const id of a.divs || []) out.add(id);
    return out;
  };
  // how far you see in your war: a commander, the theatre (null: no bound); a captain, two provinces round his division;
  // a soldier or a sergeant, the province he stands in and the next. Out of every war, no bound (what you see then is
  // only your own realm's host, and only if you run it: W.seen)
  W.scope = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    if (!pc || !A.S || !W.myWars(pc).length || W.rank(pc) === 'commander') return null;
    const steps = W.rank(pc) === 'captain' ? 2 : 1, S = A.S, out = new Set();
    let edge = [];
    for (const id of W.ownDivs(pc)) { const d = A.divById(id); if (d && S.prov[d.loc]) { out.add(d.loc); edge.push(d.loc); } }
    for (let k = 0; k < steps; k++) {
      const next = [];
      for (const j of edge) for (const n of (S.prov[j] && S.prov[j].adj) || []) if (!out.has(n)) { out.add(n); next.push(n); }
      edge = next;
    }
    return out;
  };
  W.fightsIn = function (war, pc) {
    if (war == null) return true;  // a fight that belongs to no war (a brawl, a raid, a duel) is not spectating
    const id = typeof war === 'object' ? war.id : war;
    return W.myWars(pc).some(w => w.id === id);
  };
  // your rank in a war: soldier (ranks 0-1), sergeant (2-3: sergeant, squad captain), captain (4-6), commander (7 and
  // up, a ruler, a general of an army)
  W.rank = function (pc) {
    pc = pc || A.pc();
    if (!pc) return null;
    if (pc.ruler) return 'commander';
    if (pc.mil) { const r = pc.mil.rank || 0; return r >= 7 ? 'commander' : r >= 4 ? 'captain' : r >= 2 ? 'sergeant' : 'soldier'; }
    if (pc.company) return 'captain';
    return null;
  };

  // ---- rumours of battle ----------------------------------------------------------------------------------------------
  const st = () => { const S = A.S; if (!S.v2w || typeof S.v2w !== 'object') S.v2w = {}; if (!Array.isArray(S.v2w.rum)) S.v2w.rum = []; return S.v2w; };
  W.st = st;
  W.REGIONS = { north: 'the north', south: 'the south', east: 'the east', west: 'the west' };
  W.rumourFor = function (F, winner) {
    const S = A.S, P = S.prov[F.loc], atkW = winner === 'att';
    const Wn = A.realmShort(atkW ? F.a : F.b), Ln = A.realmShort(atkW ? F.b : F.a);
    const rng = V2.rng.makeRng(`${S.seed}:v2w-rumour:${F.key}:${F.start}`);
    const days = rng.int(18, 80), months = Math.max(1, Math.round(days / 30));
    const camp = { armies: [{ name: Wn }, { name: Ln }], battle: { winner: 0 } };
    let text = VW.rumourOfBattle(rng, camp, months);
    const wrong = !text.includes(Wn);
    // the place is heard, or half heard
    const where = rng.chance(0.3) ? 'somewhere past the hills' : `near ${P ? P.name : 'a river town'}`;
    text = text.replace(/ in the [a-z ]+\.$/, ` ${where}.`);
    const dead = F.deadA + F.deadD, guess = Math.max(100, Math.round(dead * rng.float(0.4, 3) / 100) * 100);
    text += ` ${rng.pick(['He says', 'They say', 'The carter says'])} ${A.fmt(guess)} lie dead, ${rng.pick(['though he was not there', 'which no one believes', 'or he heard so'])}.`;
    return { due: A.absDay() + days, t: text, wrong: wrong ? 1 : 0, war: F.war, y: S.year };
  };
  W.deliver = function () {
    const S = A.S, s = st(), now = A.absDay();
    const keep = [];
    for (const r of s.rum) {
      if (r.due > now) { keep.push(r); continue; }
      A.news(r.t, 'rumour');
      s.heard = (s.heard || []).concat([{ y: S.year, t: r.t }]).slice(-12);
    }
    s.rum = keep;
  };
  // the wars you have fought in stay yours to remember (a tavern tale of one is yours to correct)
  W.noteFought = function () {
    const s = st(); s.fought = Array.isArray(s.fought) ? s.fought : [];
    // and each such war's two sides, so its sieges and falls are yours to know after the peace (f-told)
    s.fw = Array.isArray(s.fw) ? s.fw : [];
    for (const w of W.myWars()) {
      if (!s.fought.includes(w.id)) s.fought.push(w.id);
      const row = s.fw.find(x => Array.isArray(x) && x[0] === w.id), sides = [w.id, w.att.slice(0, 12), w.def.slice(0, 12)];
      if (row) { row[1] = sides[1]; row[2] = sides[2]; } else s.fw.push(sides);
    }
    if (s.fought.length > 40) s.fought = s.fought.slice(-40);
    if (s.fw.length > 40) s.fw = s.fw.slice(-40);
  };
  W.fought = war => war == null || war === '' || W.fightsIn(war) || !!(A.S && A.S.v2w && (A.S.v2w.fought || []).includes(war));
  A.onMonth.push(() => { try { W.noteFought(); W.deliver(); } catch (e) { console.error('v2 war rumours', e); } });

  const fightEnd = A.fightEnd;
  A.fightEnd = function (pid, winner) {
    const F = A.S && A.S.fights && A.S.fights[pid];
    const prev = W._F;
    W._F = F ? { F, winner } : null;
    try {
      const r = fightEnd.apply(this, arguments);
      // a big fight in a war that is not yours: only a rumour, later
      if (F && !W.fightsIn(F.war) && F.menA + F.menD >= 3000 && (F.days >= 2 || F.menA + F.menD >= 9000)) {
        const s = st();
        if (s.rum.length < 24) s.rum.push(W.rumourFor(F, winner));
      }
      return r;
    } finally { W._F = prev; }
  };
  // other war news (a division cut off, an order destroyed, sell-swords marching off): outside every war, none; in
  // one, only what names a realm on either side of your wars (the realm's name is in every division's name)
  W.newsOk = function (text) {
    if (W._F) return W.fightsIn(W._F.F.war);
    const wars = W.myWars();
    if (!wars.length) return W.inLevy();
    const names = new Set();
    for (const w of wars) for (const r of w.att.concat(w.def)) { const n = A.realmShort(r); if (n) names.add(n); }
    const t = String(text || '');
    for (const n of names) if (t.includes(n)) return true;
    return false;
  };
  const news = A.news;
  A.news = function (text, cls) {
    // the release's "Battle of X: ... break through after N days. N fall." for a war you are not in
    if (cls === 'battle' && !W.newsOk(text)) return;
    return news.apply(this, arguments);
  };

  // ---- no view of a war that is not yours -----------------------------------------------------------------------------
  W.NOT_YOURS = 'You have no place in this war. What reaches you of it is rumour.';
  const q0 = A.queue;
  A.queue = function (item) {
    try {
      if (item && item.type === 'warroom' && !W.canRoom()) return;
      if (item && item.type === 'battle' && item.b && item.b.war != null && !W.fightsIn(item.b.war)) return;
    } catch (e) { console.error('v2 war gate', e); }
    return q0.apply(this, arguments);
  };
  const wrv = A.warRoomView;
  if (typeof wrv === 'function') A.warRoomView = function () { if (!W.canRoom()) return { ok: false, msg: W.NOT_YOURS }; return wrv.apply(this, arguments); };
  // the War place (99992-v2-time) is there only while you fight
  if (A.V2T) A.V2T.atWar = pc => W.inWar(pc);

  if (typeof UI === 'undefined') return;
  const wro = UI.warRoomOpen;
  if (typeof wro === 'function') UI.warRoomOpen = function () {
    if (!W.canRoom()) { if (A.S) delete A.S.wantWarRoom; try { UI.toast(W.NOT_YOURS); } catch (e) {} return; }
    return wro.apply(this, arguments);
  };
  // a war room asked for before the war ended (or before you left the army) stays shut
  const wrm = UI.warRoomModal;
  if (typeof wrm === 'function') UI.warRoomModal = function () {
    if (!W.canRoom()) return `<div class="panel mbox v2w-shut"><h2>No war of yours</h2><div class="mtext">${UI.esc(W.NOT_YOURS)}</div><div class="choices"><button data-a="wrLeave">Close</button></div></div>`;
    return W.withSeen(() => wrm.apply(this, arguments));
  };
  // 96-big-moments: no victory or defeat cut-in for a battle in a war that is not yours
  const MO = UI.MOMENTS;
  for (const k of ['battleWon', 'battleLost']) if (MO && typeof MO[k] === 'function') {
    const f = MO[k];
    MO[k] = function () { const q = A.S && A.S.queue && A.S.queue[0]; if (q && q.type === 'battle' && q.b && q.b.war != null && !W.fightsIn(q.b.war)) return null; return f.apply(this, arguments); };
  }

  // the war lists: your own wars in full; every other war only as what rumour has brought
  W.heardHtml = function () {
    const s = A.S && A.S.v2w, h = (s && s.heard) || [];
    return `<div class="group-h">Rumours of war</div>` + (h.length
      ? h.slice().reverse().slice(0, 6).map(r => `<div class="small v2w-rumour">${UI.esc(r.y + ': ' + r.t)}</div>`).join('')
      : `<p class="small muted">Nothing but talk in the market, and none of it about battles.</p>`);
  };
  // draw a page with only your own wars in A.S.wars (put back at once; drawing changes no state)
  W.withMyWars = function (fn) {
    const S = A.S; if (!S || !Array.isArray(S.wars)) return fn();
    const all = S.wars, mine = W.myWars();
    S.wars = all.filter(w => mine.includes(w));
    try { return fn(); } finally { S.wars = all; }
  };
  // the realms whose forces you can see: both sides of your wars, and your own realm's when you serve or rule
  W.seen = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    const out = new Set();
    for (const w of W.myWars(pc)) for (const r of w.att.concat(w.def)) out.add(r);
    if (W.canRoom(pc) && W.side(pc)) out.add(W.side(pc));
    return out;
  };
  // draw with only the divisions and fights you can see in A.allDivs and A.S.fights (both put back at once): the realms
  // you may see, within your rank's reach (W.scope, D10), and always your own division
  W.withSeen = function (fn) {
    const S = A.S; if (!S || !A.allDivs) return fn();
    const pc = A.pc && A.pc(), seen = W.seen(pc), near = W.scope(pc), own = W.ownDivs(pc), all = A.allDivs, fights = S.fights, wars = S.wars, mine = W.myWars(pc);
    A.allDivs = function () { return all.apply(this, arguments).filter(d => d && (own.has(d.id) || (seen.has(d.r) && (!near || near.has(d.loc))))); };
    const f2 = {};
    for (const k in fights || {}) { const F = fights[k]; if (F && seen.has(F.a) && seen.has(F.b) && (F.war == null || mine.some(w => w.id === F.war)) && (!near || near.has(F.loc != null ? F.loc : +k))) f2[k] = F; }
    // a world with no fight yet has no S.fights key: put back exactly that (no key, not an undefined one), or the
    // key's place in the save moves and the drawn world's fingerprint parts from the plain one (v2tSameWorld)
    // S.wars the same way: a save without the key gets none back (the filter below only writes it over an array)
    const had = Object.prototype.hasOwnProperty.call(S, 'fights'), hadWars = Object.prototype.hasOwnProperty.call(S, 'wars');
    S.fights = f2; if (Array.isArray(wars)) S.wars = wars.filter(w => mine.includes(w));
    try { return fn(); } finally {
      A.allDivs = all; if (had) S.fights = fights; else delete S.fights;
      if (hadWars) S.wars = wars; else delete S.wars;
    }
  };
  // the words for an empty list of wars: your realm's war without you, or no war of yours
  W.emptyWars = function (pc) {
    pc = pc || A.pc();
    const rid = pc && pc.realm;
    if (rid && A.atWar(rid).length) return 'Your realm is at war, but you are not in it. What reaches you of it is rumour.';
    return A.S && A.S.wars.length ? 'No war of yours. Of the others, only rumour reaches you.' : '';
  };
  // the war map, the full map's unit layer and 62's march arrows: only what you can see
  for (const [o, k] of [[UI, 'drawWar'], [UI, 'drawWarBasic'], [UI.INKMAP, 'moveArrows'], [typeof MAP !== 'undefined' ? MAP : null, 'draw']]) {
    if (!o || typeof o[k] !== 'function') continue;
    const f = o[k];
    o[k] = function () { return W.withSeen(() => f.apply(this, arguments)); };
  }
  if (UI.TAB && typeof UI.TAB.war === 'function') {
    const tw = UI.TAB.war;
    UI.TAB.war = function (pc) {
      let h = W.withMyWars(() => tw.apply(this, arguments));
      if (typeof h !== 'string') return h;
      if (!W.canRoom(pc)) {
        // no War Room button and no promise of one for a life outside the army
        h = h.replace(/<button[^>]*data-a="warRoomView"[^>]*>[\s\S]*?<\/button>/g, '').replace(/The War Room shows [^<.]*(?:, even in peace)?\./g, '');
      }
      if (!W.inWar(pc)) {
        const rid = pc && pc.realm, atWar = rid && A.atWar(rid).length;
        if (atWar) h = h.replace(/ is at peace(\.|<\/b>)/g, ' is at war, but you are not in it$1');
        h = h.replace('<p class="small muted">None. For now.</p>', atWar
          ? `<p class="small muted">Your realm is at war, but you are not in it: no orders, no maps, no word but what travellers bring.</p>`
          : '<p class="small muted">None. For now.</p>');
      }
      return h + W.heardHtml();
    };
  }
  if (UI.TAB && typeof UI.TAB.world === 'function') {
    const tw = UI.TAB.world;
    UI.TAB.world = function () {
      if (UI.worldView !== 'wars') return tw.apply(this, arguments);
      let h = W.withMyWars(() => tw.apply(this, arguments));
      if (typeof h !== 'string') return h;
      if (!W.myWars().length) { const t = W.emptyWars(); h = h.replace('<p class="muted">Ardan is, for once, at peace.</p>', t ? `<p class="muted">${UI.esc(t)}</p>` : '<p class="muted">Ardan is, for once, at peace.</p>'); }
      return h + W.heardHtml();
    };
  }
})();

// v2 step 8 at integration: the map's Wars colouring shows only your own wars (it coloured every war in the world, a
// view of wars you are not in). The overlay is drawn with A.S.wars narrowed, as the war pages are.
(function () {
  const W = A.V2W;
  if (!W || typeof MAP === 'undefined' || typeof MAP.modeInfo !== 'function') return;
  const mi = MAP.modeInfo;
  MAP.modeInfo = function (mode) { return mode === 'wars' ? W.withMyWars(() => mi.apply(this, arguments)) : mi.apply(this, arguments); };
  const ov = MAP.overlay;
  if (typeof ov === 'function') MAP.overlay = function (mode) {
    // the overlay caches by a key without the wars, so a Wars map keys on yours too
    if (mode === 'wars') { const k = W.myWars().map(w => w.id || w.name).join(','); if (MAP._v2wKey !== k) { MAP._v2wKey = k; MAP.overlayCache = null; MAP.ownerKey = null; } }
    return ov.apply(this, arguments);
  };
})();
