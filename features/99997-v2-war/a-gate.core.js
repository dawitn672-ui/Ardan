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
// (a war's battle or war room), V2T.atWar (the War place), 96-moments' battle cut-in, and the war lists of the War tab
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
    if (A.S && A.S.armies && A.S.armies.some(a => a && a.gen === pc.id)) { const a = A.S.armies.find(x => x && x.gen === pc.id); return a.realm || null; }
    return null;
  };
  W.myWars = function (pc) {
    pc = pc || (A.S && A.pc && A.pc());
    const rid = W.side(pc);
    return rid && A.atWar ? A.atWar(rid) : [];
  };
  // a levy called out at home (72-two-scales) stands in the fight while the scene runs
  W.inLevy = () => !!(A.S && ((A.S.tsq && A.S.tsq.m && A.S.tsq.m.ts && A.S.tsq.m.ts.levy) || (A.S.queue || []).some(q => q && q.type === 'mission' && q.m && q.m.ts && q.m.ts.levy)));
  W.inWar = function (pc) { return W.myWars(pc).length > 0 || W.inLevy(); };
  // the War Room is the room of those who command or serve: a ruler, an enlisted man, an officer, a general, a
  // sell-sword under contract. In peace it plans your own forces; in war it shows only your wars (W.withMyWars).
  W.canRoom = function (pc) { pc = pc || (A.S && A.pc && A.pc()); return !!W.side(pc) || W.inLevy(); };
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
  A.onMonth.push(() => { try { W.deliver(); } catch (e) { console.error('v2 war rumours', e); } });

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
    return W.withMyWars(() => wrm.apply(this, arguments));
  };
  // 96-moments: no victory or defeat cut-in for a battle in a war that is not yours
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
        if (atWar) h = h.replace(/ is at peace\./g, ' is at war, but you are not in it.');
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
      const h = W.withMyWars(() => tw.apply(this, arguments));
      return typeof h === 'string' ? h + W.heardHtml() : h;
    };
  }
})();
