// War in the Far Lands, third part (cycle 1, world review B1, B2, I2; lives review B8). Far games only.
//   border wars    the lore's three wars of 1105 are limited wars: at most three provinces change hands at the peace
//                  (09-scale's W.capTreaty reads w.fwLimit), none is settled before eighteen months unless a capital
//                  falls (09-scale's checkPeace), and the defender's border holds are a step stronger (the Lamp's
//                  hills, Kethra's Gorge Gate, Nkara's lake shore)
//   the lore's     dated or conditional triggers for the conflicts that wait: Kemodari sails on the Strait in the
//   conflicts      spring of 1106 (or as soon after as it is at peace); the Spear-Marshal's term ends in 1106 and the
//                  forty households elect, or Kalvaro makes the staff his house's and the Harovi rise; Tegur, ill
//                  since the autumn camp of 1104, dies within about a year, the Felt Keepers' choice Ulgai succeeds,
//                  and Jagdet of the Right Wing claims the felt
//   lived wars     a ruler or general of a realm that goes to war gets a council of war (three stances, which set the
//                  orders of the armies that answer to him, A.wsSetOrder); a life whose home is taken by another
//                  realm gets a scene: swear to the new crown, or go
// State (far games only, optional): S.fw.due { k: absDay }, S.fw.kh { tegur, heir }, w.fwLimit { max, until },
// p.flags.fw_council_<war id>.
(function () {
  const FW = A.FW, FAR = A.FAR;
  if (!FW || !FAR) return;
  const hashStr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const great = () => !!(FW.on && A.S && A.S.fw);
  FW.LIMIT = { max: 3, days: 540 };
  FW.LAST_TRY = 1135;   // a conflict that cannot start (its realms at war elsewhere) is tried each month until then

  const alive = id => { const r = A.realm(id); return r && r.alive ? r : null; };
  const atWarWith = (a, b) => A.atWar(a).some(w => w.att.concat(w.def).includes(b));
  const loreP = k => { const S = A.S, id = S.fw && S.fw.p && S.fw.p[k]; const p = id ? A.P(id) : null; return p && p.alive ? p : null; };

  // ---- set up once, after the conflicts of 1105 are on the record
  const cf = FW.conflicts;
  FW.conflicts = function () {
    const S = A.S, first = S && S.fw && !S.fw.cfDone;
    const r = cf.apply(this, arguments);
    if (!first || !S.fw.cfDone || S.year > 1105) return r;
    try {
      const day = A.absDay(), fw = S.fw;
      fw.due = fw.due || {};
      for (const c of fw.cf || []) {
        if (c.mode !== 'war') continue;
        const w = S.wars.find(x => x.id === c.w); if (!w) continue;
        w.fwLimit = { max: FW.LIMIT.max, until: day + FW.LIMIT.days };
        // the defender's ground: its provinces on the attacker's border hold a step better
        const att = new Set(A.realmProvs(c.a).map(p => p.id));
        for (const p of A.realmProvs(c.b)) if (p.id === (A.realm(c.b) || {}).capitalProv || p.adj.concat(p.sea || []).some(j => att.has(j))) p.fort = Math.min(4, (p.fort || 0) + 1);
      }
      // the khagan: Tegur fell ill at the autumn camp of 1104; the Felt Keepers have chosen his grandson Ulgai
      const kh = alive('POL-58'), ul = loreP('LGD-08');
      if (kh && kh.ruler) {
        fw.kh = { tegur: kh.ruler, heir: ul ? ul.id : null };
        const t = A.P(kh.ruler); if (t) t.health = Math.min(t.health == null ? 100 : t.health, 35);
        fw.due.khagan = day + 120 + hashStr(S.seed + ':kh') % 300;
      }
      // the Strait: in the spring of 1106 Kemodari sails
      fw.due.strait = day + 365 + 60 + hashStr(S.seed + ':st') % 90;
      // the Sunrise election: the Spear-Marshal's nine-year term ends in 1106; the office is elective until then
      const me = alive('POL-136');
      if (me) { me.gov = 'elective'; fw.due.sunrise = day + 365 + 100 + hashStr(S.seed + ':su') % 180; }
    } catch (e) { console.error('far war lore', e); }
    return r;
  };

  // ---- a ruler the lore also counts among its Legends or Masters (Jagdet the Hawk of the Right Wing, the Stall-King
  // of Kethra, 19 in all) was two people: 99's ruler under the lore's name, and the seeded Legend. The Legend takes the
  // throne and the ruler's children; the stand-in keeps his life under another name of his people.
  FW.seatLore = function () {
    const S = A.S; let n = 0;
    for (const lid of Object.keys(S.fw.p || {}).sort()) {
      const p = A.P(S.fw.p[lid]), r = p && S.realms[p.realm], ru = r && A.P(r.ruler);
      if (!ru || ru.id === p.id || !p.alive || p.ruler || ru.given !== p.given || (ru.sur || '') !== (p.sur || '')) continue;
      for (const cid of ru.children || []) { const c = A.P(cid); if (c && c.parents) c.parents = c.parents.map(x => x === ru.id ? p.id : x); if (!p.children.includes(cid)) p.children.push(cid); }
      ru.children = [];
      // the realm's record is the lore's word on its ruler (two Masters were seeded men where far-lands.json has women)
      const L = FAR.D.realms[r.id];
      if (L && (L.rulerSex === 'M' || L.rulerSex === 'F')) p.sex = L.rulerSex;
      if (L && L.rulerBorn) p.born = L.rulerBorn;
      A.makeRuler(p, r.id, true);
      if (r.house && !p.house) p.house = r.house;
      p.status = ru.status || p.status;
      ru.status = 'noble'; ru.given = A.givenName(ru.cult, ru.sex); ru.epithet = null;
      A.pickHeir(r);
      n++;
    }
    FW.stats.seated = n;
  };
  // (after the whole world is built: 99 gives the rulers the lore's names last)
  const iw = A.initWorld;
  A.initWorld = function () {
    const r = iw.apply(this, arguments);
    try { if (FW.on && A.S && A.S.fw && A.S.year === 1105 && FAR.active) { FW.seatLore(); const k = A.S.fw.kh, kh = A.S.realms['POL-58']; if (k && kh) k.tegur = kh.ruler; } } catch (e) { console.error('far war seat', e); }
    return r;
  };
  // ---- the Felt Council names the Keepers' choice
  const er = A.electRuler;
  A.electRuler = function (r) {
    try {
      const S = A.S, k = great() && r && r.id === 'POL-58' && S.fw.kh;
      const h = k && k.heir ? A.P(k.heir) : null;
      if (h && h.alive && !h.ruler && h.id !== S.pc) { k.named = S.year; return h; }
    } catch (e) { console.error('felt council', e); }
    return er.apply(this, arguments);
  };
  // ---- the khagan's death, however it comes, opens the felt to Jagdet's claim
  const rd = A.rulerDies;
  A.rulerDies = function (r, cause) {
    const S = A.S, k = great() && r && r.id === 'POL-58' && S.fw.kh, was = r && r.ruler;
    const next = rd.apply(this, arguments);
    try { if (k && was === k.tegur && !k.done) { k.done = S.year; FW.feltClaim(r, next); } } catch (e) { console.error('felt claim', e); }
    return next;
  };
  FW.feltClaim = function (kh, next) {
    const rw = alive('POL-59'); if (!rw || !kh.alive) return;
    const jag = A.P(rw.ruler), nm = next ? A.fullName(next, false) : 'the new khagan';
    A.news(`The Felt Council raises ${nm} on the white felt. ${jag ? A.fullName(jag, false) : 'The Wing-Khan'} of the Right Wing will not kneel, and claims the felt for himself.`, 'war');
    if (rw.overlord === kh.id) rw.overlord = null;
    if (!atWarWith(rw.id, kh.id)) {
      if (rw.truce) delete rw.truce[kh.id];
      if (kh.truce) delete kh.truce[rw.id];
      const w = A.startWar(rw.id, kh.id, 'The War of the Felt', 'independence');
      if (w) w.fwLimit = { max: 4, until: A.absDay() + 365 };
      if (A.S.fw.kh) A.S.fw.kh.claim = w ? w.id : 0;
    } else if (A.S.fw.kh) A.S.fw.kh.claim = (A.atWar(rw.id).find(w => w.att.concat(w.def).includes(kh.id)) || {}).id || 0;
  };

  // ---- the dated conflicts, looked at once a month
  FW.dueCheck = function () {
    const S = A.S, fw = S.fw, due = fw && fw.due; if (!due) return;
    const day = A.absDay();
    if (due.khagan && day >= due.khagan) {
      delete due.khagan;
      const kh = alive('POL-58'), k = fw.kh;
      if (kh && k && kh.ruler === k.tegur) A.rulerDies(kh, 'the sickness of the autumn camp');
    }
    if (due.strait && day >= due.strait) {
      const a = alive('POL-111'), b = alive('POL-110');
      if (!a || !b || S.year > FW.LAST_TRY || a.overlord === b.id || b.overlord === a.id) delete due.strait;
      else if (!A.atWar(a.id).length && !a.playerRun) {
        delete due.strait;
        if (a.truce) delete a.truce[b.id];
        const w = A.startWar(a.id, b.id, 'The War of the Strait', 'conquest');
        if (w) {
          w.fwLimit = { max: FW.LIMIT.max, until: day + 365 };
          A.news(`Sixty Bonevari ships under ${A.realmShort(a.id)}'s banner come down on the Strait. ${A.realmShort(a.id)} means to take its tolls from ${A.realmShort(b.id)}.`, 'war');
        }
      }
    }
    if (due.sunrise && day >= due.sunrise) {
      delete due.sunrise;
      const me = alive('POL-136');
      if (me && me.ruler && !me.playerRun) FW.election(me);
    }
  };
  FW.election = function (me) {
    const S = A.S, ka = A.P(me.ruler);
    const h = A.genNoble(me.id, 'noble', null, A.ri(34, 56), 'M');
    h.sur = 'Harovi'; h.surMode = 'house';
    h.skills.command = Math.max(h.skills.command || 0, 45);
    const kname = ka ? A.fullName(ka, false) : 'The Spear-Marshal';
    // Kalvaro's marriage to the Ember Queen carries the forty households if his court holds; otherwise they elect
    if (A.chance(A.clamp(0.25 + (me.legit || 50) / 250 + (me.stability || 50) / 400, 0.3, 0.7))) {
      me.gov = 'hereditary';
      A.news(`${kname} marries the Ember Queen and keeps the Spear-Marshal's staff for his house. The Harovi household calls it theft.`, 'crown');
      if (A.successionWar) A.successionWar(me, h);
    } else {
      A.makeRuler(h, me.id);
      me.legit = 60;
      A.news(`The forty households of ${me.short} meet at the end of the Spear-Marshal's term and give the staff to ${A.fullName(h, false)}. ${kname} goes home to his estates.`, 'crown');
    }
  };
  A.onMonth.push(() => { try { if (great()) FW.dueCheck(); } catch (e) { console.error('far war dates', e); } });

  // ---- lived wars: a council of war for the ruler or general of a realm that goes to war; a scene when home falls
  FW.myArmies = pc => { try { const R = A.cmdRole(pc); return R && R.armies ? [...R.armies] : []; } catch (e) { return []; } };
  A.onMonth.push(pc => {
    try {
      if (!great() || !pc || !pc.alive || !A.isAdult(pc)) return;
      const S = A.S, rid = pc.ruler || (pc.mil && pc.mil.realm) || pc.realm;
      const lead = pc.ruler || (pc.mil && pc.mil.rank >= 6);
      if (lead) {
        const w = A.atWar(rid).find(x => !pc.flags['fw_council_' + x.id]);
        if (w) {
          pc.flags['fw_council_' + w.id] = S.year;
          const side = w.att.includes(rid) ? 'att' : 'def', foe = side === 'att' ? w.leadD : w.leadA;
          A.queue({ type: 'event', ev: 'fw_war_council', forced: true, ctx: { fwq: 1, war: w.name, foe: A.realmShort(foe), wid: w.id } });
        }
      }
      // home taken: the release says it in one log line; a life gets a scene
      const home = pc.home != null ? S.prov[pc.home] : null;
      if (home && !pc.ruler && pc.fwHomeOwner && pc.fwHomeOwner !== home.owner && home.owner && A.realm(home.owner) && pc.realm === pc.fwHomeOwner) {
        A.queue({ type: 'event', ev: 'fw_home_taken', forced: true, ctx: { fwq: 1, place: home.name, newr: A.realmShort(home.owner), oldr: A.realmShort(pc.realm), nid: home.owner, oid: pc.realm } });
      }
      if (home) pc.fwHomeOwner = home.owner;
    } catch (e) { console.error('far war lived', e); }
  });
  // the council's stances: what the armies that answer to you are told
  FW.stance = function (pc, k) {
    let n = 0;
    for (const aid of FW.myArmies(pc)) { try { const r = A.wsSetOrder(aid, k); if (r && r.ok) n++; } catch (e) {} }
    return n;
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('fwStance', 'fwSwear', 'fwLeave');
  const apply = A.applyFx;
  if (typeof apply === 'function') A.applyFx = function (p, fx, ctx) {
    const out = apply.apply(this, arguments);
    try {
      if (fx && p && fx.fwStance) {
        const n = FW.stance(p, fx.fwStance);
        if (n && p.mil) p.mil.merit = (p.mil.merit || 0) + 5;
      }
      if (fx && p && fx.fwSwear && ctx && ctx.nid && A.realm(ctx.nid) && !p.mil) { p.realm = ctx.nid; p.fwHomeOwner = ctx.nid; }
      if (fx && p && fx.fwLeave && ctx && ctx.oid) {
        const r = A.realm(ctx.oid);
        if (r && r.alive && r.capitalProv != null && A.prov(r.capitalProv) && A.prov(r.capitalProv).owner === r.id) { p.home = r.capitalProv; p.fwHomeOwner = r.id; }
      }
    } catch (e) { console.error('far war fx', e); }
    return out;
  };
})();
