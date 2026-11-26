// The walls and their reward: a class or a stat boost at each hundredth level (orders 91 and 92, D-184). Data:
// data/classes.json. The level's own file (a-level.core.js) makes the step into each hundredth level a wall and calls
// LV.atWall when a person reaches one by experience; this file decides what he takes there and what it gives him.
//
// A.LV.CL: the class tree.
//   CL.options(p)          the classes open to him at his next wall (pure): those that follow the class he holds (or the
//                          first classes on a road, if he holds none), whose skills he has (the best level of the class's
//                          families at need[step]), whose title he bears (the Sword Saint), best first by his skills, his
//                          way of life and his deeds; at most three
//   CL.answer(p, id, put)  the player's answer at the wall's card (lv_wall, lv_boost): a class, or 'boost' (points to place;
//                          put: the stats he puts them into at once)
//   CL.npcWall(p)          anyone else at a wall: a class or the boost through A.WHY.decide (his skills, his post, his deeds
//                          and his temper), on a stream of its own from the seed, the person and the level
//   CL.shown(p)            the class a person is known by: his own, or for someone whose level was never recorded, the one
//                          his road would give (pure, for the profile)
// A class adds things to do (order 92): a technique for duels (A.techsOf reads LV.classTechs, under the style id
// "class:<id>": A.style reads LV.classStyle), a passive that fires under its condition in a duel (A.styleFighter calls
// LV.fighterClass; A.techEdge reads LV.passiveEdge), a buff and a way to earn (activities: GD.ACTIVITIES[key].lvCls, which
// A.canAct holds to those who have the class: LV.hasAct). Every class on his road keeps its parts; the class he holds now
// gives its effects in the skills adapter (SK2.xClass), so the caps bind it with his skills and titles. A class read at
// seeding (worn: on load, at the first month, at an NPC's first fight) has its parts and no effects, honour or points.
// State (optional, old saves load; the save step 'classes', version 21): p.lv.ct (the walls settled), p.lv.cr ([[class,
// year, earned 1 or worn 0]], his road), p.lv.wp (the player's walls waiting for an answer), p.lv.bf ([stat, v, months]:
// a buff running). Nothing here draws on render.
(function () {
  const LV = A.LV, D = A.DATA && A.DATA.classes;
  if (!LV || !D || !Array.isArray(D.classes)) { if (LV) console.error('[level] data/classes.json is missing'); return; }
  // ---------------------------------------------------------------- the tree: the hand-made classes and the generated
  // branches (order 95: hundreds in the end, as in Overgeared). Each template makes, on every road, a class following the
  // road's base (step 2, with its advancement at step 3 on the same line and rarity) or following any step-2 class off it
  // (step 3); parts of their own, a technique named for the road, hidden conditions (req). Pure, at load
  const generate = function (D) {
    const G = D.generator; if (!G) return [];
    const out = [], hand = D.classes, slug = s => String(s).toLowerCase().replace(/[^a-z]+/g, '-');
    const fx = (r, t) => Object.assign({}, t, { weapon: t.weapon || r.weapon });
    for (const r of G.roads) {
      const fam = [r.fam], step2 = [];
      for (const t of G.templates) {
        const id = `${t.key}-${slug(r.noun)}${r.fam === 'melee' ? '-m' : ''}`, name = `${t.prefix} ${r.noun}`, line = id;
        const sv = G.rarityStat[t.rarity] || 1, fv = G.rarityFight[t.rarity] || 1;
        const tag = r.fam === 'any' ? 'all' : r.fam;
        const base = {
          id, name, step: t.step, rarity: t.rarity, line, gen: t.key, fam, req: t.req || null, ways: [], deeds: t.req && t.req.deed ? [t.req.deed[0]] : [],
          rank: t.rarity === 'legendary' ? 'S' : t.step >= 3 ? 'A' : 'B', honour: G.rarityHonour[t.rarity] || 2,
          effects: [{ type: 'fight', tag, part: t.part || 'atk', v: fv }, { type: 'stat', stat: t.stat || 'str', v: sv }],
          hook: t.hook, text: String(t.text || '').replace('{noun}', r.noun.toLowerCase()),
        };
        if (t.tech) base.tech = fx(r, Object.assign({ id: 'cl-' + id, name: `${t.prefix} ${r.move}` }, t.tech));
        if (t.passive) base.passive = t.passive;
        if (t.buff) base.buff = Object.assign({ key: 'lvc_' + id.replace(/-/g, '_') + '_b' }, t.buff);
        if (t.act) base.act = Object.assign({ key: 'lvc_' + id.replace(/-/g, '_') + '_a' }, t.act);
        if (t.step === 2) {
          base.from = [r.base];
          out.push(base); step2.push(id);
          if (t.master) {
            const m = Object.assign({}, base, { id: id + '-master', name: name + ' Master', step: 3, from: [id], rank: 'A', honour: (G.rarityHonour[t.rarity] || 2) + 2,
              hook: t.hook, text: `${base.text} Mastered: what the road taught him is his to teach.` });
            delete m.tech; delete m.passive; delete m.buff; delete m.act;
            if (t.master.tech) m.tech = fx(r, Object.assign({ id: 'cl-' + id + '-master' }, t.master.tech));
            if (t.master.passive) m.passive = t.master.passive;
            if (t.master.buff) m.buff = Object.assign({ key: 'lvc_' + id.replace(/-/g, '_') + '_mb' }, t.master.buff);
            if (t.master.act) m.act = Object.assign({ key: 'lvc_' + id.replace(/-/g, '_') + '_ma' }, t.master.act);
            m.effects = base.effects.map(e => Object.assign({}, e, { v: e.type === 'stat' ? Math.min(3, e.v + 1) : e.v + 1 }));
            out.push(m);
          }
        } else {
          base.from = hand.filter(c => c.step === 2 && (c.from || []).includes(r.base)).map(c => c.id).concat(step2);
          out.push(base);
        }
      }
    }
    return out;
  };
  const ALL = D.classes.concat(generate(D));
  const CL = LV.CL = { D, LIST: ALL, BY: new Map(ALL.map(c => [c.id, c])) };
  const WALL = (LV.D.xp.wall && LV.D.xp.wall.every) || 100;
  const isPc = p => !!(p && A.S && p.id === A.S.pc);
  const clean = s => String(s == null ? '' : s).replace(/[<>"]/g, '');
  const byId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  // ---------------------------------------------------------------- what a person can do, read from his skills
  const value = (p, k) => {
    const SK2 = A.SK2;
    if (SK2 && SK2.rungFor && SK2.E) { const r = SK2.rungFor(p, k); return r ? SK2.E().value(r.rank, r.lv) : 0; }
    return (p.skills && p.skills[k]) || 0;
  };
  CL.famValue = function (p, c) { let v = 0; for (const k of D.keys[c] || [c]) v = Math.max(v, value(p, k)); return v; };
  CL.fitValue = function (p, cls) { let v = 0; for (const c of cls.fam[0] === 'any' ? D.arms : cls.fam) v = Math.max(v, CL.famValue(p, c)); return v; };
  CL.road = p => (p && p.lv && Array.isArray(p.lv.cr) ? p.lv.cr : []);
  CL.current = p => { const r = CL.road(p); return r.length ? r[r.length - 1][0] : null; };
  CL.held = p => { const c = CL.current(p); return c ? CL.BY.get(c) || null : null; };
  const deedCount = (p, kinds) => { let n = 0; for (const k of kinds || []) { const e = p.dl && p.dl[k]; if (Array.isArray(e)) n += e[0] || 0; } return n; };
  // the reasons that speak for a class (pure): how far his skill stands past the class's need, his way of life, his deeds
  CL.fit = function (p, cls) {
    const v = CL.fitValue(p, cls), need = D.need[cls.step] || 0;
    const way = LV.wayOf ? LV.wayOf(p) : 'common', d = deedCount(p, cls.deeds);
    return { v, need, way: (cls.ways || []).includes(way), deeds: d, score: (v - need) / 10 + ((cls.ways || []).includes(way) ? 1 : 0) + Math.min(1, d / 10) };
  };
  // a hidden branch's conditions (pure): a skill's level, a deed done often enough, a birth and a house's rank
  CL.reqMet = function (p, r) {
    if (r.skill && CL.famValue(p, r.skill[0]) < r.skill[1]) return false;
    if (r.deed && deedCount(p, [r.deed[0]]) < r.deed[1]) return false;
    if (r.status && !r.status.includes(p.status)) return false;
    if (r.rung && !(((p.noble && p.noble.rung) || 0) >= r.rung || p.status === 'royal' || p.ruler)) return false;
    return true;
  };
  CL.open = function (p, cls, cur, shown) {
    if (!(cls.from || []).includes(cur === undefined ? CL.current(p) : cur)) return false;
    if (CL.road(p).some(x => x[0] === cls.id)) return false;
    if (cls.title && (shown || !(A.TT && A.TT.holds(p, cls.title)))) return false;
    if (cls.unique && shown) return false;
    if (cls.req && !CL.reqMet(p, cls.req)) return false;
    return CL.fitValue(p, cls) >= (D.need[cls.step] || 0);
  };
  CL.options = function (p, cur, shown) {
    return CL.LIST.filter(c => CL.open(p, c, cur, shown)).map(c => ({ c, f: CL.fit(p, c) }))
      .sort((a, b) => b.f.score - a.f.score || byId(a.c.id, b.c.id)).slice(0, 3);
  };
  // the road his skills would give him over n walls, each step the best open class (pure; never a unique one)
  CL.chain = function (p, n) {
    const out = []; let cur = null;
    for (let i = 0; i < n; i++) { const o = CL.options(p, cur, true)[0]; if (!o) break; out.push(o.c.id); cur = o.c.id; }
    return out;
  };
  CL.shown = function (p) {
    if (!p || !p.st) return null;
    if (p.lv && p.lv.L != null) return CL.held(p);
    const L = LV.level(p); if (L < WALL) return null;
    const ch = CL.chain(p, Math.floor(L / WALL)); return ch.length ? CL.BY.get(ch[ch.length - 1]) : null;
  };
  LV.className = p => { const c = CL.held(p); return c ? c.name : null; };
  LV.classShown = p => { const c = CL.shown(p); return c ? c.name : null; };

  // ---------------------------------------------------------------- the walls
  CL.pointsAt = t => D.boost.points[Math.min(D.boost.points.length, Math.max(1, t)) - 1];
  // a person given his held level (LV.seed, the save step): the walls he stands past are settled with the road his skills
  // give, worn: nothing paid, no effects, so nothing a check reads moves
  LV.settleSeeded = function (p) {
    const lv = p && p.lv; if (!lv || lv.L == null || lv.ct != null || !p.st) return;
    lv.ct = Math.floor(lv.L / WALL);
    if (lv.ct > 0 && !Array.isArray(lv.cr)) { const ch = CL.chain(p, lv.ct); if (ch.length) lv.cr = ch.map(id => [id, A.S ? A.S.year : 0, 0]); }
  };
  // LV.up calls this at each hundredth level reached by experience: the breakthrough (order 95). Every wall crossed boosts
  // the stats (points to place, LV.grant), lets a skill jump a rank where several conditions allow it (CL.jump), and
  // opens the class branch (the player's card; anyone else by his reasons)
  LV.atWall = function (p, lv) {
    const t = Math.floor(lv.L / WALL);
    if (t <= (lv.ct || 0)) return;
    lv.ct = t;
    const n = CL.boost(p, t), jump = CL.jump(p, t);
    lv.bt = (lv.bt || []).concat([[A.S.year, t, n, jump ? jump.to : '']]).slice(-5);
    if (isPc(p)) {
      lv.wp = (lv.wp || 0) + 1;
      if (A.log) A.log(`You break through at level ${t * WALL}: ${CL.pointWords(n).toLowerCase()} for the body${jump ? `, and ${jump.text}` : ''}.`, 'big');
      CL.queue(p);
    } else CL.npcWall(p);
  };
  CL.take = function (p, id) {
    const cls = CL.BY.get(id), lv = p.lv; if (!cls || !lv) return false;
    lv.cr = CL.road(p).concat([[id, A.S.year, 1]]);
    if (cls.honour) p.honor = Math.max(0, Math.min(100, (p.honor || 0) + cls.honour));
    (p.deeds = p.deeds || []).push({ y: A.S.year, t: `Became a ${cls.name}` });
    if (A.cacheResetAll && isPc(p)) try { A.cacheResetAll(); } catch (e) {}
    if (!isPc(p) && (cls.step >= 3 || ['epic', 'legendary', 'unique'].includes(cls.rarity)) && A.news) A.news(`${A.fullName ? A.fullName(p, false) : 'Someone'} is a ${cls.name} now.`, 'crown');
    return true;
  };
  CL.boost = function (p, t) { return LV.grant(p, CL.pointsAt(t), `the breakthrough at level ${t * WALL}`); };

  // a skill's jump at the breakthrough (order 95; the skills engine, 37-skills2): one family, the best read that holds at
  // least Lv 5 of its rank and has a next rank, when several conditions allow it: the next rung's route wants no deed,
  // age or renown he lacks, at most one of its concepts is still to be grasped, and his talent in it reaches the next
  // rank's letter. The jump sets the next rank's first level (its concepts deemed grasped, SK.set's rule). The player
  // only: anyone else's skills are one number each (deferred with the census of named skills)
  CL.TALENT_FOR = { C: 'C', B: 'B', A: 'A', S: 'S' };
  CL.jump = function (p, t) {
    const SK = A.SK, SK2 = A.SK2;
    if (!isPc(p) || !SK || !SK2 || !SK2.tops || !SK2.E || !(p.sk && typeof p.sk === 'object')) return null;
    const Eng = SK2.E(), ix = SK2.IX(), tops = SK2.tops(p), W_ = { C: 2, B: 3, A: 4, S: 5 }, cand = [];
    for (const id in tops) {
      const h = tops[id]; if (!h.c || h.merged) continue;
      const s0 = ix.BY[id]; if (!s0 || !(h.lv >= Eng.ADVANCE_FROM)) continue;
      const to = (s0.evolvesTo || []).map(x => ix.BY[x.id]).find(x => x && Eng.HUMAN.includes(x.rank) && Eng.HUMAN.indexOf(x.rank) === Eng.HUMAN.indexOf(s0.rank) + 1);
      if (!to || tops[to.id]) continue;
      const v = Eng.edgeVerdict(ix, h.c, W_[to.rank], SK2.factsAt(p, h.c, p.sk[h.c], null, to.rank));
      if (!v) continue;
      const concepts = v.missing.filter(m => m.startsWith('concept:')).length, other = v.missing.filter(m => !m.startsWith('concept:'));
      const tal = SK.talentOf ? SK.talentOf(p, h.c) : 'C', TO = SK.TALENT_ORDER || ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SSS'];
      if (other.length || concepts > 1 || TO.indexOf(tal) < TO.indexOf(CL.TALENT_FOR[to.rank] || 'S')) continue;
      cand.push({ id, c: h.c, lv: h.lv, to: to.id, rank: to.rank, name: to.name, from: s0.name, read: Eng.value(s0.rank, h.lv) });
    }
    cand.sort((a, b) => b.read - a.read || (a.c < b.c ? -1 : 1));
    const pick = cand[0]; if (!pick) return null;
    SK.set(p, pick.c, Eng.s1OfRung(pick.rank, 1), `the breakthrough at level ${t * WALL}`);
    if (p.sk[pick.c]) p.sk[pick.c].xp = 0;
    if (SK2.syncFam) SK2.syncFam(p, pick.c);
    const text = `${pick.from} breaks through to ${pick.name}, ${pick.rank} · Lv 1`;
    if (SK2.evNote) SK2.evNote(p, { how: 'breakthrough', k: pick.c, from: pick.id, to: pick.to, why: `the breakthrough at level ${t * WALL}`, ok: 1, at: pick.lv });
    if (SK.record) SK.record(p, pick.c, 'breakthrough', `${text}: the breakthrough at level ${t * WALL}`);
    return { c: pick.c, to: pick.to, text };
  };

  // anyone but the player: the class branch by his reasons (A.WHY.decide), on a stream of his own; or none yet
  CL.reasons = function (p) {
    const RW = { common: 0, uncommon: 0.15, rare: 0.3, epic: 0.45, legendary: 0.6, unique: 0.8 };
    const out = CL.options(p).map(({ c, f }) => {
      const rs = [{ kind: 'merit', weight: 0.6 + Math.max(0, f.v - f.need) / 20, label: `his skill fits a ${c.name}`, source: { t: 'class', id: c.id }, pub: true }];
      if (f.way) rs.push({ kind: 'duty', weight: 0.8, label: `a ${c.name} suits his life`, source: { t: 'way', id: c.id }, pub: true });
      if (f.deeds) rs.push({ kind: 'pride', weight: Math.min(0.8, f.deeds / 15), label: 'what he has done points that way', source: { t: 'deeds', id: c.id }, pub: true });
      rs.push({ kind: 'ambition', weight: 0.2 * c.step + (RW[c.rarity] || 0), label: 'a new art of arms', source: null, pub: true });
      return { id: c.id, reasons: rs };
    });
    out.push({ id: 'none', reasons: [
      { kind: 'reckoning', weight: out.length ? 0.5 : 2, label: out.length ? 'the road he is on serves him' : 'no art of arms has claimed him', source: null, pub: true },
      { kind: 'fear', weight: 0.25, label: 'a new art is a gamble at his age', source: null, pub: true },
    ] });
    return out;
  };
  CL.npcWall = function (p) {
    const lv = p.lv; if (!lv || !A.WHY || !A.WHY.decide) return null;
    const rand = LV.stream(`${A.S.seed != null ? A.S.seed : 'ardan'}|cls|${p.id}|${lv.L}`);
    const rec = A.WHY.decide(p, 'class', CL.reasons(p), { log: false, rand });
    const ch = rec ? rec.chose : 'none';
    return ch !== 'none' && CL.take(p, ch) ? ch : 'none';
  };

  // ---------------------------------------------------------------- the player's card at the wall
  const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  CL.pointWords = n => (n === 1 ? 'A point' : (n <= 20 ? WORDS[n][0].toUpperCase() + WORDS[n].slice(1) : 'Many') + ' points');
  CL.pending = p => !!(p && p.lv && p.lv.wp > 0);
  CL.queued = () => (A.S.queue || []).some(q => q && q.type === 'event' && (q.ev === 'lv_wall' || q.ev === 'lv_boost'));
  CL.queue = function (pc) {
    const lv = pc.lv; if (!lv || !(lv.wp > 0) || CL.queued()) return false;
    const t = (lv.ct || 1) - lv.wp + 1, opts = CL.options(pc), bt = (lv.bt || []).find(x => x[1] === t);
    const ctx = { lvl: String(t * WALL), t: String(t), pts: CL.pointWords(bt ? bt[2] : CL.pointsAt(t)) };
    const sk = bt && bt[3] && A.SK2 && A.SK2.IX ? (A.SK2.IX().BY[bt[3]] || {}).name : '';
    ctx.jump = sk ? `${sk} breaks through with you.` : '';
    if (opts.length) {
      opts.forEach(({ c }, i) => { ctx['o' + (i + 1)] = c.id; ctx['n' + (i + 1)] = c.name; });
      ctx.roads = opts.map(({ c }) => `A ${c.name}: ${c.hook}.`).join(' ');
      A.S.queue.push({ type: 'event', ev: 'lv_wall', ctx, forced: true });
    } else A.S.queue.push({ type: 'event', ev: 'lv_boost', ctx, forced: true });
    return true;
  };
  // the answer: a class (one the card offered), 'none' (keep to his road), or the breakthrough's points placed into the
  // stats in put, in turn (lv_boost); the points themselves came with the breakthrough
  CL.answer = function (p, id, put) {
    const lv = p && p.lv; if (!lv || !(lv.wp > 0)) return '';
    lv.wp--; if (!lv.wp) delete lv.wp;
    const cls = id && id !== 'none' && id !== 'boost' ? CL.BY.get(id) : null;
    if (cls && CL.open(p, cls) && CL.take(p, id)) return CL.gifts(cls);
    let placed = 0;
    if (put && put.length) for (let i = 0; i < 60 && lv.pts > 0; i++) { if (LV.place(p, put[i % put.length], 'at the breakthrough')) placed++; else if (!put.some(s => LV.canPlace(p, s))) break; }
    if (A.cacheResetAll) try { A.cacheResetAll(); } catch (e) {}
    return placed || !(lv.pts > 0) ? '' : `${CL.pointWords(lv.pts)} to place (Profile).`;
  };

  // ---------------------------------------------------------------- what a class gives, in words (no numbers)
  const PW_ = D.passiveWords || {};
  CL.parts = function (cls) {
    const out = [];
    if (cls.tech) out.push(`a technique in a duel, ${cls.tech.name}`);
    if (cls.passive) out.push(`${cls.passive.name}, ${PW_[cls.passive.on] || 'in a fight'}`);
    if (cls.buff) out.push(`a way to ready the body: ${cls.buff.name.toLowerCase()}`);
    if (cls.act) out.push(`a new way to earn: ${cls.act.name.toLowerCase()}`);
    return out;
  };
  CL.gifts = cls => { const g = CL.parts(cls); return g.length ? `It gives you ${g.join('; ')}.` : ''; };
  CL.note = function (p) {
    const cls = CL.shown(p); if (!cls) return '';
    const road = CL.road(p), mine = road.length && road[road.length - 1][0] === cls.id ? road[road.length - 1] : null;
    const how = mine ? (mine[2] ? `Taken at a wall of the level, in ${mine[1]}.` : 'What a life like this is called; no wall was crossed for it in the record.') : 'What a life like this is called.';
    const prev = road.slice(0, -1).map(x => (CL.BY.get(x[0]) || {}).name).filter(Boolean);
    return `${cls.name}, a ${cls.rarity || 'common'} class. ${cls.text} ${how}${prev.length ? ` Before it: ${prev.join(', then ')}; their arts are kept.` : ''} ${CL.gifts(cls)}`.replace(/\s+/g, ' ').trim();
  };

  // ---------------------------------------------------------------- the parts in play
  // techniques: one style per class ("class:<id>"), built once from the data
  const STYLE = new Map();
  for (const c of CL.LIST) if (c.tech) {
    const sid = 'class:' + c.id, t = Object.freeze(Object.assign({}, c.tech, { rank: 0, sid }));
    STYLE.set(sid, Object.freeze({ id: sid, name: `the ${c.name}'s art`, kind: 'class', techniques: Object.freeze([t]), ranks: [] }));
  }
  LV.classStyle = sid => STYLE.get(sid) || null;
  LV.classTechs = function (p) {
    const out = [];
    for (const x of CL.road(p)) { const s = STYLE.get('class:' + x[0]); if (s) out.push({ t: s.techniques[0], sid: s.id }); }
    return out;
  };
  // passives: the fighter carries his classes' (shared, read only); the first time one fires in a duel it says so
  LV.fighterClass = function (f, p) {
    const road = CL.road(p); if (!road.length) return;
    const ps = road.map(x => (CL.BY.get(x[0]) || {}).passive).filter(Boolean);
    if (ps.length) f.lvp = ps;
  };
  const COND = {
    lowHp: (D_, f) => f.hp < (f.maxHp || 100) * 0.35, beast: (D_, f, o) => !!o.beast, first: D_ => D_.round <= 1, mounted: (D_, f) => !!f.mounted,
    shieldGuard: (D_, f, o, act) => act === 'guard' && (f.shield || 0) > 0, foeGuard: (D_, f, o, act, oact) => oact === 'guard', late: D_ => D_.round >= 4,
  };
  LV.passiveEdge = function (D_, f, o, act, oact) {
    let e = 0;
    for (const ps of f.lvp) {
      const c = COND[ps.on]; if (!c || !c(D_, f, o || {}, act, oact)) continue;
      e += ps.edge || 0;
      const fired = f.lvpOn || (f.lvpOn = {});
      if (!fired[ps.name]) {
        fired[ps.name] = 1;
        if (ps.fury && f.st) f.st.fury = Math.max(f.st.fury || 0, 2);
        if (ps.heal) f.hp = Math.min(f.maxHp || 100, f.hp + ps.heal);
        if (Array.isArray(D_.log)) D_.log.push(`✦ ${f.isPC ? 'Your' : (f.short || 'His') + "'s"} ${ps.name}.`);
      }
    }
    return e;
  };
  // activities: a buff and a way to earn, held to those who have the class (A.canAct reads LV.hasAct)
  const ACTS = new Map();
  for (const c of CL.LIST) for (const a of [c.act, c.buff]) if (a && a.key) {
    ACTS.set(a.key, c.id);
    GD.ACTIVITIES[a.key] = { name: a.name, cost: 1, minAge: 16, cat: a.cat || 'Glory', desc: a.desc, lvCls: c.id };
  }
  LV.hasAct = (p, key) => { const id = ACTS.get(key); return !!id && CL.road(p).some(x => x[0] === id); };
  const earn = (a, c) => function (pc, arg, dim) {
    const odds = A.checkOdds(pc, { s: a.s, s2: a.s2, d: a.d });
    const won = A.rand() * 100 < odds;
    if (A.gainXp) A.gainXp(pc, a.s, 2, { q: 'stretch', why: a.name.toLowerCase() });
    if (won) {
      const coin = Math.max(1, Math.round((a.coin[0] + (a.coin[1] - a.coin[0]) * A.rand()) * (dim || 1)));
      pc.coin = (pc.coin || 0) + coin;
      if (a.deed && A.deedDone) A.deedDone(pc, a.deed, {});
      return { ok: true, msg: `${a.name}: it goes well, and you come home with ${A.coin ? A.coin(coin) : coin + ' suns'}.`, cls: 'good' };
    }
    if (a.hurt) pc.health = Math.max(1, (pc.health || 100) - a.hurt);
    pc.happy = Math.max(0, (pc.happy || 50) - 2);
    return { ok: true, msg: `${a.name}: it goes badly${a.hurt ? ', and you come home hurt' : ''}. Nothing for your trouble this time.`, cls: 'bad' };
  };
  const buff = a => function (pc) {
    if (a.heal) { pc.health = Math.min(100, (pc.health || 0) + a.heal); return { ok: true, msg: `${a.name}: the blood comes back, and the aches go.`, cls: 'good' }; }
    pc.lv.bf = [a.stat, a.v, a.months];
    if (A.cacheResetAll) try { A.cacheResetAll(); } catch (e) {}
    return { ok: true, msg: `${a.name}: you feel it in the body, and it will last a season.`, cls: 'good' };
  };
  for (const c of CL.LIST) { if (c.act && c.act.key) A.ACT[c.act.key] = earn(c.act, c); if (c.buff && c.buff.key) A.ACT[c.buff.key] = buff(c.buff); }
  LV.buffOn = (p, s) => { const b = p.lv.bf; return Array.isArray(b) && b[0] === s && b[2] > 0 ? b[1] : 0; };

  // ---------------------------------------------------------------- the skills adapter: the class he holds, earned
  const XS = new Map();
  for (const c of CL.LIST) if (Array.isArray(c.effects) && c.effects.length) XS.set(c.id, { id: 'class:' + c.id, rank: c.rank || 'C', kind: 'title', levels: [{ at: 1, effects: c.effects }] });
  if (A.SK2 && A.SK2.addSource) for (const s of XS.values()) A.SK2.addSource(s);
  if (A.SK2) A.SK2.xClass = function (p) {
    const r = p && p.lv && p.lv.cr; if (!Array.isArray(r) || !r.length) return null;
    const last = r[r.length - 1]; if (!last[2] || !XS.has(last[0])) return null;
    return [{ id: 'class:' + last[0], lv: 1 }];
  };

  // ---------------------------------------------------------------- the month (the player), the save
  CL.month = function (pc) {
    const lv = pc && pc.lv; if (!lv || !pc.alive) return;
    if (lv.wp > 0) CL.queue(pc);
    if (Array.isArray(lv.bf)) { lv.bf[2]--; if (!(lv.bf[2] > 0)) { delete lv.bf; if (A.cacheResetAll) try { A.cacheResetAll(); } catch (e) {} } }
  };
  A.onMonth.push(pc => { try { CL.month(pc); } catch (e) { console.error('[level] classes month', e); } });
  // save version 21: everyone with a held level has his walls settled (worn classes: nothing paid, no effects)
  CL.migrate = function (S) {
    S = S || A.S; let n = 0;
    for (const id in (S && S.people) || {}) { const p = S.people[id]; if (p && p.lv && p.lv.L != null && p.lv.ct == null) { LV.settleSeeded(p); n++; } }
    return n;
  };
  const SV = A.V2SAVE;
  if (SV && Array.isArray(SV.STEPS) && !SV.STEPS.some(x => x[0] === 'classes')) SV.STEPS.push(['classes', S => CL.migrate(S)]);
  CL.clean = clean;
})();
