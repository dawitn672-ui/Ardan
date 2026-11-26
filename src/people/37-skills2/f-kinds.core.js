// Skills rebuild, step 11 (docs/design/skills-v2.md §3.5, §10, §16; the owner's order 92; D-186): the three kinds of skill
// in play. An ART (data/skills/kinds/, `art: true`) is an active, a passive or a buff; the engine (A.V2.skills2 §11) holds
// their arithmetic, pure; this file holds who has them, the month, the slots and the fight.
//
// - Who holds what. The player: pc.ka = { id: { lv, xp, y, via, n } }, learned at the month's turn by a route the data
//   names (practice: his family's read reaches the need; teacher: a school or someone he learns from at the rank; deed:
//   a deed counted in pc.kd; evolve: the art below at Lv 10), at most two a month, and grown by use (each use in a
//   fight) and by half his month's experience in the family it trains. Anyone else: the closed form (E.npcArts), from his
//   reads, nothing stored. A monster or a legend: what its kind is born with (E.beingArts), mana-based arts only for a
//   being with magic, its mana pool ten a step of its magic (E.manaOf). A person has no mana until magic (§17).
// - Slots (§3.5): the player readies his actives and buffs (pc.kr = [{ id, m }]); an art readied this month is ready to
//   use from the next (changing what is readied takes a month, and never in a fight). Anyone else readies by the pure
//   E.chooseReady; a beast readies all it has, up to five. Passives need no slot.
// - The fight (A.duelAct, release 07-duels): the player uses an art by its button ("k:<id>"), on the move it rides on;
//   anyone else (and the player when the fight runs by itself) by the pure E.plan, on the move he makes. A use spends
//   its wind or mana, keeps its cooldown (once a fight, every n exchanges; a month's in pc.kcd), and acts: a blow on an
//   exchange won (a share of his fighting worth), a foe's state (the release's own stun, knock, bleed), a heal, a raise or
//   a guard for its duration. Passives fire when their condition holds. Every bonus is capped (E.capOf: the fight's
//   share shared with the rungs' fight effects, the blow's share, what one fight heals, a guard, a raise, a stun).
// - The month: a buff that heals a wound or an illness, or raises a stat for a month, is used from the skills screen
//   (SK2.useOutside), with its time and its cooldown; a month's raise is read by A.stat through SK2.statOf (pc.kb).
// - Nothing here draws from A.rand; nothing a view calls writes A.S.
(function () {
  const SK = A.SK, SK2 = A.SK2; if (!SK || !SK.DATA || !SK2 || !SK2.E || !SK2.ke) return;
  const E = () => SK2.E(), IX = () => SK2.IX();
  const isPC = p => !!(p && A.S && p.id === A.S.pc);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  SK2.ART_LEARN_MAX = 2;      // arts learned in one month at most
  SK2.ART_USE_XP = 6;         // experience a use in a fight brings the art
  SK2.ART_SHARE = 0.5;        // of the month's experience in the family an art trains
  SK2.absMonth = () => { try { return A.S.year * 12 + A.monthOf(A.today()).m; } catch (e) { return (A.S && A.S.year * 12) || 0; } };

  // ---- the library ------------------------------------------------------------------------------------------------------
  let ARTS = null;
  SK2.arts = () => ARTS || (ARTS = IX().skills.filter(s => E().isArt(s)));
  SK2.art = id => { const s = IX().BY[id]; return s && E().isArt(s) ? s : null; };
  // used in a fight (a blow, a state, a heal of blood or wind, a raise or a guard for rounds or the fight), or in a month
  SK2.inFight = function (s) {
    if (!s) return false;
    if (s.kind === 'passive') return true;
    const d = s.spec && s.spec.duration, u0 = E().artUse(IX(), s, 1);
    if (d && /^(month|season|year)$/.test(d.unit)) return false;
    return !(u0 && u0.do.some(x => x.type === 'heal' && (x.of === 'wounds' || x.of === 'illness')));
  };

  // ---- who holds what ---------------------------------------------------------------------------------------------------
  SK2.ka = pc => (pc.ka && typeof pc.ka === 'object' && !Array.isArray(pc.ka) ? pc.ka : (pc.ka = {}));
  SK2.artsHeld = function (p) {
    if (!p || !p.alive) return [];
    if (isPC(p)) {
      const K = p.ka; if (!K || typeof K !== 'object') return [];
      return Object.keys(K).sort().filter(id => SK2.art(id) && K[id] && K[id].lv >= 1).map(id => ({ id, lv: Math.min(E().MAX_LV, K[id].lv | 0) }));
    }
    if (!p.st || !p.skills || (A.isAdult && !A.isAdult(p))) return [];
    return E().npcArts(IX(), f => A.skill(p, f), { age: A.age(p), stat: { str: A.stat(p, 'str'), wil: A.stat(p, 'wil') } });
  };
  // the highest rank a person reads in any family (the slots' rule)
  SK2.bestRank = function (p) {
    let best = 0;
    for (const k of SK.IDS || []) { const v = A.skill(p, k); if (v > best) best = v; }
    const r = E().rungOfValue(best); return r ? r.rank : 'D';
  };
  SK2.slotsOf = p => (p ? E().slots({ age: A.age(p), int: A.stat(p, 'int'), wil: A.stat(p, 'wil'), best: SK2.bestRank(p) }) : 0);
  // the player's readied arts: [{ id, m }] of held actives and buffs used in a fight, at most his slots
  SK2.kr = pc => (Array.isArray(pc.kr) ? pc.kr : (pc.kr = []));
  SK2.readiedOf = function (pc) {
    const K = pc && pc.ka; if (!K || !Array.isArray(pc.kr)) return [];
    const n = SK2.slotsOf(pc), out = [];
    for (const x of pc.kr) { const s = x && SK2.art(x.id); if (s && s.kind !== 'passive' && K[x.id] && SK2.inFight(s) && !out.some(y => y.id === x.id)) out.push(x); }
    return out.slice(0, n);
  };
  const inFightNow = () => { const q = A.S && A.S.queue && A.S.queue[0]; return !!(q && q.type === 'duel' && q.d && !q.d.over); };
  SK2.readyArt = function (pc, id) {
    const s = SK2.art(id);
    if (!isPC(pc) || !s || !SK2.ka(pc)[id]) return { ok: false, msg: 'You do not know it.' };
    if (s.kind === 'passive' || !SK2.inFight(s)) return { ok: false, msg: 'It needs no place: it is there when you need it.' };
    if (inFightNow()) return { ok: false, msg: 'Not in the middle of a fight.' };
    const R = SK2.readiedOf(pc);
    if (R.some(x => x.id === id)) return { ok: false, msg: 'It is ready already.' };
    if (R.length >= SK2.slotsOf(pc)) return { ok: false, msg: 'No place free: put one away first.' };
    pc.kr = R.concat([{ id, m: SK2.absMonth() }]);
    return { ok: true, msg: `${s.name} is in hand from next month.` };
  };
  SK2.unready = function (pc, id) {
    if (!isPC(pc) || !Array.isArray(pc.kr)) return { ok: false };
    if (inFightNow()) return { ok: false, msg: 'Not in the middle of a fight.' };
    pc.kr = pc.kr.filter(x => x && x.id !== id);
    return { ok: true };
  };
  // settled: readied before this month
  SK2.settled = x => !!(x && x.m != null && x.m < SK2.absMonth());

  // ---- the month (e-merge's SK2.afterMonth calls it) -------------------------------------------------------------------
  SK2.TEACH_RELS = SK2.TEACH_RELS || ['mentor', 'master', 'comrade', 'friend', 'bestfriend', 'mother', 'father', 'sibling', 'spouse', 'lord'];
  SK2.teacherFor = function (pc, need) {
    if (!need) return true;
    if (pc.school) return true;
    if (!A.relsOf) return false;
    const bar = E().value(need.rank || 'D', 1);
    for (const { p } of A.relsOf(pc, SK2.TEACH_RELS)) if (p && p.alive && p.skills && A.skill(p, need.reads) >= bar) return true;
    return false;
  };
  SK2.kd = pc => (pc.kd && typeof pc.kd === 'object' ? pc.kd : (pc.kd = {}));
  SK2.artFacts = function (pc) {
    const fam = {}, ix = IX();
    for (const f of ix.fams) fam[f.id] = A.skill(pc, f.id);
    const deeds = [], K = pc.kd || {};
    for (const k in K) if (K[k] > 0 && !/Y$/.test(k)) deeds.push({ kind: k, n: K[k] });
    const skills = {}; for (const h of SK2.artsHeld(pc)) skills[h.id] = { lv: h.lv };
    return { family: fam, stat: Object.fromEntries(GD.STATS.map(s => [s, A.stat(pc, s)])), age: A.age(pc), deeds, skills, teacher: need => SK2.teacherFor(pc, need) };
  };
  // the route by which an art is open to the player now, or null
  SK2.artRoute = function (pc, s, facts) {
    const Eng = E();
    if (Eng.usesMana(s)) return null;
    for (const r of s.acquire || []) {
      if (!['practice', 'teacher', 'school', 'deed', 'evolve'].includes(r.via)) continue;
      if (r.via === 'evolve' && !((facts.skills[r.from] || {}).lv >= Eng.MAX_LV)) continue;
      if (r.via === 'school' && !pc.school) continue;
      if (!Eng.missing(r.needs, facts).length) return r;
    }
    return null;
  };
  SK2.learnArt = function (pc, id, via) {
    const s = SK2.art(id); if (!s || !isPC(pc)) return false;
    const K = SK2.ka(pc); if (K[id]) return false;
    K[id] = { lv: 1, xp: 0, y: A.S.year, via };
    const kind = { active: 'an active art', passive: 'a passive art', buff: 'a buff' }[s.kind];
    const how = { practice: 'by doing it', teacher: 'from someone who knew it', school: 'at your school', deed: 'by what you went through', evolve: 'out of what you had' }[via] || '';
    A.log(`You have a new skill ${how}: ${s.name} (${s.rank} · Lv 1), ${kind}.`, 'good');
    if (SK.notable) SK.notable(pc, { text: `${s.name}: learned` });
    if (s.kind !== 'passive' && SK2.inFight(s) && SK2.readiedOf(pc).length < SK2.slotsOf(pc)) SK2.kr(pc).push({ id, m: SK2.absMonth() });
    return true;
  };
  SK2.artsMonth = function (pc, v) {
    if (!isPC(pc) || !pc.alive || A.age(pc) < 6) return;
    const ix = IX(), Eng = E(), K = SK2.ka(pc), now = SK2.absMonth();
    // a near death of this year is a deed (36-skills' life marks it)
    if (pc.flags && pc.flags.sk_neardeath === A.S.year) { const D = SK2.kd(pc); if (D.near_deathY !== A.S.year) { D.near_death = (D.near_death || 0) + 1; D.near_deathY = A.S.year; } }
    // grow: half the month's experience in the family each art trains
    if (v && Array.isArray(v.ledger)) for (const id of Object.keys(K).sort()) {
      const s = SK2.art(id), e = K[id]; if (!s || !e || !s.trains) continue;
      let x = 0; for (const l of v.ledger) if (l && l.xp > 0 && Eng.famOf(ix, l.k) === s.trains && !(l.tags || []).includes('kin')) x += l.xp;
      if (x > 0) SK2.artXp(pc, id, x * SK2.ART_SHARE);
    }
    // learn: what a route opens now, at most two a month (rank first, then the library's order)
    const facts = SK2.artFacts(pc), open = [];
    for (const s of SK2.arts()) { if (K[s.id]) continue; const r = SK2.artRoute(pc, s, facts); if (r) open.push([s, r]); }
    open.sort((a, b) => Eng.rankIx(a[0].rank) - Eng.rankIx(b[0].rank));
    for (const [s, r] of open.slice(0, SK2.ART_LEARN_MAX)) SK2.learnArt(pc, s.id, r.via);
    // a month's raise wears off; a month's cooldown long past is forgotten
    if (Array.isArray(pc.kb)) { pc.kb = pc.kb.filter(b => b && b.until > now); if (!pc.kb.length) delete pc.kb; }
    if (pc.kcd && typeof pc.kcd === 'object') { for (const id in pc.kcd) if (!(now - pc.kcd[id] < 36)) delete pc.kcd[id]; if (!Object.keys(pc.kcd).length) delete pc.kcd; }
  };
  SK2.artXp = function (pc, id, x) {
    const s = SK2.art(id), e = pc.ka && pc.ka[id]; if (!s || !e || !(x > 0)) return 0;
    const lv0 = e.lv, n = E().addXp(s.rank, e, x);
    if (n > 0 && Math.floor(e.lv / 5) > Math.floor(lv0 / 5)) A.log(`${s.name} rises to ${s.rank} · Lv ${e.lv}.`, 'good');
    // at Lv 10 an art evolves by its route at the month's turn (artsMonth: the evolve route reads the source at Lv 10)
    return n;
  };

  // ---- the month's buffs: a wound or an illness healed, a stat raised for a month (the player, from the skills screen) -
  SK2.outsideReady = function (pc, id) {
    const s = SK2.art(id), e = pc && pc.ka && pc.ka[id];
    if (!s || !e || s.kind !== 'buff' || SK2.inFight(s)) return { ok: false, why: 'not a month\'s buff' };
    const u = E().artUse(IX(), s, e.lv), now = SK2.absMonth();
    if (!E().ready(u, { last: pc.kcd || {} }, { month: now })) return { ok: false, why: 'not yet: ' + E().coolWord(u.cd) };
    const t = E().costOf(u, 'time');
    if (t > 0 && (A.S.time || 0) < t) return { ok: false, why: 'no time free this month' };
    const d = u.do[0] || {};
    if (d.type === 'heal' && d.of === 'wounds' && !(pc.wounds || []).some(w => w.until && w.until > A.S.year)) return { ok: false, why: 'no wound that will heal' };
    if (d.type === 'heal' && d.of === 'illness' && !(pc.ill && pc.ill.m > 0)) return { ok: false, why: 'you are not ill' };
    if (d.type === 'raise' && (pc.kb || []).some(b => b.id === id)) return { ok: false, why: 'in force already' };
    return { ok: true, u };
  };
  SK2.useOutside = function (pc, id) {
    const r = SK2.outsideReady(pc, id); if (!r.ok) return { ok: false, msg: 'Not now: ' + r.why + '.' };
    const u = r.u, s = SK2.art(id), now = SK2.absMonth(), t = E().costOf(u, 'time'), out = [];
    if (t > 0) A.S.time = Math.max(0, (A.S.time || 0) - t);
    (pc.kcd = pc.kcd && typeof pc.kcd === 'object' ? pc.kcd : {})[id] = now;
    for (const d of u.do) {
      if (d.type === 'heal' && d.of === 'wounds') {
        const ws = (pc.wounds || []).filter(w => w.until && w.until > A.S.year).sort((a, b) => a.until - b.until).slice(0, d.v | 0);
        for (const w of ws) w.until = A.S.year;
        if (A.healWounds) A.healWounds(pc);
        out.push(ws.length === 1 ? 'one wound closes' : 'the wounds close');
      } else if (d.type === 'heal' && d.of === 'illness' && pc.ill) {
        pc.ill.dmg = Math.round((pc.ill.dmg || 0) * (1 - clamp(d.share, 0, 1)));
        out.push('the sickness takes less of you');
      } else if (d.type === 'raise') {
        const dur = u.dur || { v: 1, unit: 'month' }, months = (E().MONTHS_OF[dur.unit] || 1) * Math.max(1, dur.v || 1);
        (pc.kb = Array.isArray(pc.kb) ? pc.kb : []).push({ id, stat: d.stat, v: d.v, until: now + months });
        out.push(`${(GD.STAT_NAMES && GD.STAT_NAMES[d.stat]) || d.stat} sharpens ${E().durWord(dur)}`);
      }
    }
    SK2.artXp(pc, id, SK2.ART_USE_XP);
    const e = pc.ka[id]; e.n = (e.n || 0) + 1;
    A.log(`${s.name}: ${out.join('; ')}.`, 'good');
    if (A.cacheResetAll) try { A.cacheResetAll(); } catch (err) {}
    return { ok: true, msg: `${s.name}: ${out.join('; ')}.` };
  };
  // A.stat reads it through SK2.statOf (c-effects): a month's raises, under the same cap as the skills' and titles' stat
  const statOf0 = SK2.statOf;
  if (statOf0) SK2.statOf = function (p, s) {
    const b = statOf0(p, s);
    if (!p || !Array.isArray(p.kb) || !p.kb.length) return b;
    const now = SK2.absMonth();
    let r = 0; for (const x of p.kb) if (x && x.stat === s && x.until > now) r += +x.v || 0;
    if (!r) return b;
    return Math.min(E().capOf(IX(), 'raise', 'S'), Math.max(0, b) + r) + Math.min(0, b);
  };

  // ---- the fight ----------------------------------------------------------------------------------------------------------
  // a beast's being: its bestiary species (A.POWER), for its family, its magic and its level
  SK2.beingOfBeast = function (cid) {
    const PW = A.POWER; if (!PW || !cid) return null;
    const sp = (PW.species && PW.species(cid)) || (PW.speciesOfCre && PW.speciesOfCre(cid));
    return sp ? { id: sp.id, fam: sp.fam, magic: (sp.prof && sp.prof.magic) || 0, level: sp.level || 1 } : null;
  };
  SK2.duelStart = function (D, pc, foe) {
    if (!D || !D.a || !D.b) return;
    SK2.fighterArts(D, D.a, pc);
    SK2.fighterArts(D, D.b, foe && !foe.beastId ? foe : null);
  };
  SK2.fighterArts = function (D, f, p) {
    const Eng = E(), ix = IX();
    let held = [], being = null;
    if (f.beast) { being = SK2.beingOfBeast(f.beast); if (being) held = Eng.beingArts(ix, being); }
    else if (p) held = SK2.artsHeld(p);
    if (!held.length) return;
    const mana = Eng.manaOf(being);
    const ctx = { ix, weapon: f.skillK, shield: f.shield > 0, mounted: !!f.mounted, ranged: f.rangedSkill >= 12, beast: f.beast || null, being, mana };
    const uses = held.map(h => Eng.artUse(ix, ix.BY[h.id], h.lv)).filter(u => u && Eng.condOk(ix, u, ctx));
    const fightable = uses.filter(u => u.kind !== 'passive' && SK2.inFight(ix.BY[u.id]));
    let ids;
    if (f.isPC && p) ids = SK2.readiedOf(p).filter(SK2.settled).map(x => x.id);
    else if (f.beast) ids = fightable.slice().sort((a, b) => b.value - a.value || (a.id < b.id ? -1 : 1)).slice(0, Eng.SLOTS_MAX).map(u => u.id);
    else ids = Eng.chooseReady(fightable, SK2.slotsOf(p), ctx);
    const arts = fightable.filter(u => ids.includes(u.id)), pas = uses.filter(u => u.kind === 'passive');
    if (!arts.length && !pas.length) return;
    f.st = f.st || { stun: 0, knock: 0, bleed: [], disarm: 0, hamstring: 0, fury: 0 };
    const top = Eng.topRank(arts.concat(pas).map(u => u.rank));
    f.k2 = { arts, pas, used: {}, next: {}, last: Object.assign({}, (p && p.kcd) || {}), inForce: [], fight: 0, guard: 0, healed: 0, raised: {},
      mana, mana0: mana, worth: SK2.worthOfFighter(f), top, won: false, lost: false, parried: false, uses: [] };
  };
  const shortOf = f => (f.isPC ? 'You' : f.beast ? A.cap(f.short) : f.short);
  const ctxOf = (D, f, o, act, oAct) => {
    const fs = f.maxHp > 0 ? f.hp / f.maxHp : 1, os = o.maxHp > 0 ? o.hp / o.maxHp : 1;
    return { round: D.round, month: SK2.absMonth(), act, foeAct: oAct, hp: fs, foeHp: os, light: D.light,
      outnumbered: !!(D.party && f === D.b), foeStronger: (D.cr0 ? (f === D.a ? D.cr0[1] - D.cr0[0] : D.cr0[0] - D.cr0[1]) : 0) > 3,
      won: !!f.k2.won, lost: !!f.k2.lost, parried: !!f.k2.parried, behind: fs < os - 0.1 };
  };
  const stOf = f => ({ used: f.k2.used, next: f.k2.next, last: f.k2.last, fat: f.fat || 0, mana: f.k2.mana, inForce: f.k2.inForce });
  // the art anyone uses this round, on the move he makes (pure)
  SK2.duelPlanFor = function (D, f, o, act, ahead) {
    if (!f || !f.k2 || !f.k2.arts.length || !act || act === 'yield' || act === 'flee') return null;
    const c = ctxOf(D, f, o, act, null); if (ahead) c.round = D.round + 1;
    return E().plan(f.k2.arts, stOf(f), c);
  };
  // the player's button: the art, if it is ready now (its own trigger read on the coming exchange)
  SK2.duelPick = function (D, f, id) {
    if (!f || !f.k2) return null;
    const u = f.k2.arts.find(x => x.id === id); if (!u) return null;
    const o = f === D.a ? D.b : D.a, c = ctxOf(D, f, o, u.base, null); c.round = D.round + 1;
    return E().ready(u, stOf(f), c) ? u : null;
  };
  SK2.duelReady = function (D, f, u) {
    if (!f || !f.k2 || !u) return false;
    const o = f === D.a ? D.b : D.a, c = ctxOf(D, f, o, u.base, null); c.round = D.round + 1;
    return E().ready(u, stOf(f), c);
  };
  const capOf = (f, what) => E().capOf(IX(), what, f.k2.top);
  // the round's start: the arts used (costs, cooldowns, what begins), the passives weighed, every bonus capped
  SK2.duelRound = function (D, a, b, artA, actA, bArtId, actB) {
    const artB = bArtId && b.k2 ? b.k2.arts.find(x => x.id === bArtId) : null;
    for (const [f, o, u, act, oAct] of [[a, b, artA, actA, actB], [b, a, artB, actB, actA]]) {
      if (!f.k2) continue;
      f.k2.now = null;
      if (u && u.base === act) SK2.duelBegin(D, f, o, u);
      const c = ctxOf(D, f, o, act, oAct);
      // passives: those whose condition holds this exchange; one with a duration starts it (once), one with a cooldown
      // fires once in it
      const fire = [];
      for (const p of f.k2.pas) {
        if (!E().fires(p.on, c)) continue;
        const whole = p.dur && /^(duel|battle)$/.test(p.dur.unit);
        if ((p.cd && f.k2.used[p.id]) || (whole && f.k2.inForce.some(x => x.id === p.id))) continue;
        const mana = E().costOf(p, 'mana'); if (mana > 0) { if (!(f.k2.mana >= mana)) continue; f.k2.mana -= mana; }
        if (p.cd) f.k2.used[p.id] = 1;
        if (whole) { SK2.duelBegin(D, f, o, p, true); continue; }
        fire.push(p);
        for (const d of p.do) if (d.type === 'heal') SK2.duelHeal(D, f, d, p);
      }
      f.k2.firing = fire.map(p => p.id);
      // the exchange's fight and guard: the passives firing and what is in force, weighed largest first, capped
      const fv = [], gv = [];
      for (const p of fire) for (const d of p.do) { if (d.type === 'fight') fv.push(+d.v || 0); else if (d.type === 'guard') gv.push(+d.share || 0); }
      for (const x of f.k2.inForce) { if (x.fight) fv.push(x.fight); if (x.guard) gv.push(x.guard); }
      const room = Math.max(0, f.k2.worth * capOf(f, 'fightShare') - (f.sk2 ? Math.max(0, f.sk2.total || 0) : 0));
      f.k2.fight = E().stack(fv, room);
      f.k2.guard = E().stack(gv, capOf(f, 'guardShare'));
    }
  };
  // an art begins: its cost and cooldown, its heal at once, its raise, guard or fight for its duration
  SK2.duelBegin = function (D, f, o, u, passive) {
    const k = f.k2, Eng = E();
    if (!passive) {
      const sta = Eng.costOf(u, 'stamina'), mana = Eng.costOf(u, 'mana');
      if (sta > 0) f.fat = clamp((f.fat || 0) + sta, 0, 100);
      if (mana > 0) k.mana = Math.max(0, k.mana - mana);
      k.used[u.id] = (k.used[u.id] || 0) + 1;
      const nr = Eng.nextRound(u, D.round); if (isFinite(nr)) k.next[u.id] = nr;
      if (u.cd && Eng.MONTHS_OF[u.cd.per]) k.last[u.id] = SK2.absMonth();
      k.now = u;
      k.uses.push({ r: D.round, id: u.id });
      D.log.push(`✧ ${shortOf(f)} ${f.isPC ? 'use' : 'uses'} ${u.name}.`);
    }
    const rounds = !u.dur ? 0 : /^(duel|battle|day)$/.test(u.dur.unit) ? Infinity : Math.max(1, +u.dur.v || 1);
    for (const d of u.do) {
      if (d.type === 'heal' && !passive) SK2.duelHeal(D, f, d, u);
      else if (rounds > 0 && (d.type === 'raise' || d.type === 'guard' || d.type === 'fight')) {
        const x = { id: u.id, left: rounds };
        if (d.type === 'guard') x.guard = +d.share || 0;
        else if (d.type === 'fight') x.fight = +d.v || 0;
        else if (d.type === 'raise' && typeof f[d.stat] === 'number') {
          const room = Math.max(0, capOf(f, 'raise') - (k.raised[d.stat] || 0)), v = Math.min(room, +d.v || 0);
          if (v > 0) { f[d.stat] += v; k.raised[d.stat] = (k.raised[d.stat] || 0) + v; x.stat = d.stat; x.v = v; }
        }
        if (x.guard || x.fight || x.v) k.inForce.push(x);
      }
    }
  };
  SK2.duelHeal = function (D, f, d, u) {
    const k = f.k2;
    if ((d.of || 'hp') === 'hp') {
      const room = Math.max(0, f.maxHp * capOf(f, 'healShare') - k.healed), h = Math.min(room, Math.round(f.maxHp * (+d.share || 0)), Math.max(0, f.maxHp - f.hp));
      if (h > 0) { f.hp += h; k.healed += h; D.log.push(`${shortOf(f)} ${f.isPC ? 'win' : 'wins'} back ${h} with ${u.name}.`); }
    } else if (d.of === 'wind') {
      const w = Math.min(f.fat || 0, Math.round(100 * (+d.share || 0)));
      if (w > 0) f.fat -= w;
    }
  };
  // after the exchange: an active's blow and the foe's state land only on an exchange won; the passives' moments are kept
  SK2.duelAfter = function (D, a, b, artA, actA, bArtId, actB, margin) {
    const artB = bArtId && b.k2 ? b.k2.arts.find(x => x.id === bArtId) : null;
    for (const [f, o, u, act, won] of [[a, b, artA, actA, margin > 0], [b, a, artB, actB, margin < 0]]) {
      if (!f.k2) continue;
      if (u && f.k2.now === u && won) SK2.duelLand(D, f, o, u);
      f.k2.won = won; f.k2.lost = margin !== 0 && !won; f.k2.parried = won && act === 'guard';
    }
  };
  SK2.duelLand = function (D, f, o, u) {
    const st = o.st || (o.st = { stun: 0, knock: 0, bleed: [], disarm: 0, hamstring: 0, fury: 0 }), whom = o.isPC ? 'you' : o.short;
    for (const d of u.do) {
      if (d.type === 'strike') {
        const share = Math.min(+d.share || 0, capOf(f, 'strikeShare'));
        let dmg = share * f.k2.worth - Math.max(0, (o.prot || 0) - (+d.pierce || 0)) * 0.8;
        if (o.k2 && o.k2.guard > 0) dmg *= 1 - o.k2.guard;
        dmg = Math.max(1, Math.round(dmg));
        o.hp -= dmg;
        D.log.push(`${u.name} lands on ${whom}: ${dmg} more.`);
      } else if (d.type === 'status') {
        const cap = capOf(f, 'status'), v = +d.v || 0;
        if (d.of === 'stun') st.stun = Math.max(st.stun || 0, Math.min(cap, v));
        else if (d.of === 'knock') st.knock = Math.max(st.knock || 0, Math.min(cap, v));
        else if (d.of === 'bleed') (st.bleed = st.bleed || []).push([v, 3]);
        else if (d.of === 'slow') { o.spd = Math.max(5, o.spd - v); st.hamstring = 1; }
        else if (d.of === 'disarm' && !o.beast) { o.skill = Math.max(5, o.skill - v); st.disarm = 1; }
        else if (d.of === 'tire') o.fat = Math.min(100, (o.fat || 0) + v);
      }
    }
  };
  // the round's end: what lasts for rounds runs down; a raise that ends gives its points back
  SK2.duelTick = function (D, f) {
    const k = f && f.k2; if (!k) return;
    const keep = [];
    for (const x of k.inForce) {
      if (x.left !== Infinity) x.left--;
      if (x.left > 0) { keep.push(x); continue; }
      if (x.stat && x.v) { f[x.stat] -= x.v; k.raised[x.stat] = Math.max(0, (k.raised[x.stat] || 0) - x.v); }
    }
    k.inForce = keep;
  };
  // the fight's end: the player's arts grow by their uses, a month's cooldown is kept, and the deeds a route may ask
  SK2.duelEnd = function (D) {
    const f = D && D.a, pc = A.pc && A.pc();
    if (!f || !f.isPC || !pc || !pc.alive) return;
    if (f.k2) {
      const n = {}; for (const x of f.k2.uses) n[x.id] = (n[x.id] || 0) + 1;
      for (const id of Object.keys(n).sort()) { if (!(pc.ka && pc.ka[id])) continue; pc.ka[id].n = (pc.ka[id].n || 0) + n[id]; SK2.artXp(pc, id, SK2.ART_USE_XP * n[id]); }
      const now = SK2.absMonth();
      for (const id in f.k2.last) if (f.k2.last[id] === now && pc.ka && pc.ka[id]) (pc.kcd = pc.kcd && typeof pc.kcd === 'object' ? pc.kcd : {})[id] = now;
    }
    const won = D.result === 'win' || D.result === 'beastfled';
    if (won && D.kind !== 'spar' && D.kind !== 'tourney' && D.gap > 3) { const K = SK2.kd(pc); K.won_vs = (K.won_vs || 0) + 1; }
    if (won && D.b && D.b.beast) { const K = SK2.kd(pc); K.survived_beast = (K.survived_beast || 0) + 1; }
  };

  // ---- what the arts are worth before a fight: the honest odds (24-honest-duel-odds, 48's measure) ---------------------
  // The odds a player sees read fighting worth; the arts change what a duel does, so they count in it. A fighter's arts
  // are worth ART_WORTH x the root of what they are worth at their levels (their budget's spend), counting every readied
  // active and buff and every passive whose condition a fight can bring (one that the fight's own facts rule out, the dark
  // by day, a party that is not there, a foe not stronger, does not count). Fitted on the duel engine (D-186: honestOddsCells'
  // setting with the foe's arts and none of the player's); a root, because the caps bind more as arts pile up.
  SK2.ART_WORTH = 0.41;
  SK2.ART_WORTH_BEAST = 0.8;   // a beast readies all it has and its moves are few: its arts come round more often (flBeastOdds)
  const STATIC = { outnumbered: c => c.outnumbered, dawn: c => c.light === 'dawn' || c.light === 'dusk', night: c => c.light === 'night' || c.light === 'torch', foe_stronger: c => c.foeStronger };
  SK2.artsWorth = function (D, f) {
    const k = f && f.k2; if (!k) return 0;
    const c = { outnumbered: !!(D && D.party && f === D.b), light: D && D.light, foeStronger: !!(D && D.cr0 && (f === D.a ? D.cr0[1] - D.cr0[0] : D.cr0[0] - D.cr0[1]) > 3) };
    // a passive whose condition holds for the whole fight (a party round a beast, the dark, a stronger foe) gives its fight
    // points in every exchange: they are worth points themselves (under the fight's cap); the rest by the root of their value
    let v = 0, flat = 0;
    // an active or a buff: what one use is worth (its spend without the cooldown's discount) times the uses a fight of ten
    // exchanges gives it (every v exchanges: ten over v, at most four; once a fight: one), as far as its mana lasts
    for (const u of k.arts) {
      let n = u.cd && (u.cd.per === 'round' || u.cd.per === 'turn') ? Math.min(4, 10 / Math.max(1, +u.cd.v || 1)) : 1;
      const m = E().costOf(u, 'mana'); if (m > 0) n = Math.min(n, Math.floor((k.mana0 || 0) / m));
      v += (u.value || 0) / (u.cd ? E().coolFactor(u.cd) : 1) * n;
    }
    for (const u of k.pas) {
      if (!STATIC[u.on]) { v += u.value || 0; continue; }
      if (!STATIC[u.on](c)) continue;
      for (const d of u.do) if (d.type === 'fight') flat += +d.v || 0; else v += E().effectCost(IX(), d, IX().BY[u.id]);
    }
    flat = Math.min(flat, Math.max(0, (k.worth || 0) * capOf(f, 'fightShare') - (f.sk2 ? Math.max(0, f.sk2.total || 0) : 0)));
    return flat + (v > 0 ? (f.beast ? SK2.ART_WORTH_BEAST : SK2.ART_WORTH) * Math.sqrt(v) : 0);
  };
  // the same for a person before any fight (a profile's odds): his fighter as A.fightWorth builds it, his arts readied as a
  // fight would ready them, by day, alone. Kept for the month by person, weapon and what he holds; pure.
  const AW = new Map();
  A.onMonth.push(() => { AW.clear(); });
  SK2.artsWorthReset = () => AW.clear();
  SK2.artsWorthOf = function (p) {
    if (!p || !p.alive || !p.st) return 0;
    const held = SK2.artsHeld(p); if (!held.length) return 0;
    const R = isPC(p) ? SK2.readiedOf(p).filter(SK2.settled).map(x => x.id).join(',') : '';
    const key = `${p.id}|${(p.gear && p.gear.weapon) || ''}|${(p.gear && p.gear.shield) || ''}|${held.map(h => h.id + h.lv).join(',')}|${R}`;
    let v = AW.get(key);
    if (v == null) {
      // (as A.fightWorth does: a style the fighter only imagined is not kept)
      const ns = p.styles === void 0, f = A.fighterFrom(p, {});
      if (ns) delete p.styles;
      SK2.fighterArts(null, f, p);
      v = SK2.artsWorth({ light: 'day' }, f);
      if (AW.size > 4096) AW.clear();
      AW.set(key, v);
    }
    return v;
  };

  // ---- the save step 'skills2arts' (save version 20): the player's stores, empty; nothing a check reads moves ------------
  SK2.migrateArts = function (S) {
    S = S || A.S; const pc = S && S.people && S.people[S.pc];
    if (!pc || !pc.alive) return 0;
    if (!pc.ka || typeof pc.ka !== 'object' || Array.isArray(pc.ka)) pc.ka = {};
    if (!Array.isArray(pc.kr)) pc.kr = [];
    return 1;
  };
})();
