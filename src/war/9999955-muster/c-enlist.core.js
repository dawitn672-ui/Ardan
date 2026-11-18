// D11-1: enlisting as scenes, the branch fixed at the muster, and roles (docs/design/war.md §14.1; D-110, D-112, D-113).
//
// Nothing is handed to you (order 54). The player goes to a muster himself (the War activity, or the Paths list's
// button): MU.go reads him and puts the muster-master's offers on a card (md_muster); he chooses one or walks away. The
// release's A.enlist takes the branch chosen (third argument { branch, cmd, company }); when a scene of the release's
// enlists him with no branch (a sergeant at the tavern, a call to the host), the muster-master decides where to write
// him and the same card follows, so he may ask for another place. A man taken by lot has no offers: conscript foot.
// The branch fixes his troop on the war map, his arm of service (the release's GD.ARMS: the old card that asked a
// sergeant a year on where he belonged is not asked), and his command: the muster's (the crown's or the lord's), in one
// of whose hosts he stands.
//
// Roles (data/military/roles.json): beside his rank a soldier or sergeant may hold one role in his company. His captain
// decides through A.WHY (kind 'role') whether to offer him one: at the muster, and every six months in service. A
// company has one holder of each role; a seed man holds it when the player does not (a captain is a seed, 9997).
(function () {
  const MU = A.MUSTER;
  const day = () => (A.absDay ? A.absDay() : 0);
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = s => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

  // ---------------------------------------------------------------- can he go to a muster (the release's own gates)
  MU.blocked = function (pc, merc) {
    const why = A.roleBlock ? A.roleBlock(pc, merc ? 'company' : 'army') : '';
    if (why) return why;
    if (pc.mil && (merc || !pc.mil.merc)) return 'You are under arms already.';
    const R = GD.RACES[pc.race] || { adult: 16 };
    if (A.age(pc) < R.adult - 1) return 'Too young for the rolls.';
    if (pc.flags && pc.flags.unfree === 'slave') return 'Slaves do not carry spears for the realm.';
    if (!merc) { const r = A.realm(pc.realm); if (!r || !r.alive) return 'There is no realm army here to join.'; }
    return '';
  };

  // ---------------------------------------------------------------- the player goes to a muster
  MU.go = function (pc, merc) {
    const why = MU.blocked(pc, merc);
    if (why) return { ok: false, msg: why };
    const company = merc ? (A.hpick ? A.hpick(A.COMPANY_NAMES || ['the Free Company'], 'co:' + pc.id + ':' + day()) : 'the Free Company') : null;
    const M = MU.offers(pc, { merc, company });
    if (!M || !M.offers.length) return A.enlist(pc, merc);
    MU.queueCard(pc, M, { merc, company, sworn: false });
    return { ok: true, msg: merc ? `You go to the table of ${company}, where the captain signs men.` : `You go to ${M.place.replace(/^The /, 'the ')}.` };
  };
  // the card: the reading, the offers, and (for a man not yet sworn) walking away
  MU.queueCard = function (pc, M, o) {
    const ctx = {
      merc: o.merc ? 1 : 0, company: o.company || '', sworn: o.sworn ? 1 : 0, cmd: M.c && M.c.k !== 'company' ? M.c.id : '',
      placeT: M.place, masterT: M.master, readT: MU.readWords(M), n: M.offers.length,
      swornT: o.sworn ? ` Your name is on the roll for ${low(M.offers[0].name)}; he will hear you if you would rather serve elsewhere.` : '',
      offers: M.offers.map(x => [x.b, x.name]),
    };
    for (let i = 0; i < 3; i++) {
      const x = M.offers[i];
      ctx['o' + (i + 1) + 'T'] = x ? MU.offerLabel(x) : '';
      ctx['o' + (i + 1) + 'R'] = x ? MU.offerResult(x, M, o, i) : '';
    }
    A.queue({ type: 'event', ev: 'md_muster', forced: true, ctx });
  };
  MU.offerResult = function (x, M, o, i) {
    const B = MU.B(x.b), nm = low(x.name);
    if (o.sworn && i === 0) return `You stay where he wrote you, with ${nm}. ${cap(B.desc.split('.')[0])}.`;
    if (o.merc) return `You put your mark on the articles. The captain writes you down with his ${B.short.replace(/^the /, '')}.`;
    return `He writes your name on the roll of ${nm}. ${cap(B.desc.split('.')[0])}.`;
  };

  // ---------------------------------------------------------------- the release's A.enlist asks these
  // the troop for his branch: the one chosen, else the muster-master's own choice (logged, and the card follows)
  MU._last = null;
  MU.troopIn2 = function (pc, b, rid) {
    const av = A.wsTroopsFor ? A.wsTroopsFor(rid || 'unclaimed') : [];
    if (pc.race === 'giant' && av.includes('GI') && (b === 'spears' || b === 'foot_men_at_arms')) return 'GI';
    return MU.troopIn(b, rid || 'unclaimed');
  };
  MU.troopFor = function (pc, realm, merc, opts) {
    opts = opts || {};
    let b = opts.branch && MU.B(opts.branch) ? opts.branch : null, M = null;
    if (!b) {
      M = pc.id === A.S.pc || opts.read ? MU.offers(pc, { merc, rid: realm, company: opts.company }) : null;
      b = M && M.offers[0] ? M.offers[0].b : 'spears';
    }
    MU._last = { pid: pc.id, b, M };
    return MU.troopIn2(pc, b, merc ? 'unclaimed' : realm);
  };
  // after the release has made pc.mil: the branch, the arm, the command, his place in one of its hosts
  MU.onEnlist = function (pc, merc, opts) {
    opts = opts || {};
    const m = pc && pc.mil;
    if (!m) return;
    const L = MU._last && MU._last.pid === pc.id ? MU._last : null;
    MU._last = null;
    const b = (opts.branch && MU.B(opts.branch) && opts.branch) || (L && L.b) || MU.branchOfTroop(m.troop);
    m.branch = b;
    if (b !== 'conscripts') m.arm = MU.armOf(b);
    m.mustered = A.S.year;
    if (!merc) {
      const c = (opts.cmd && A.CMD && A.CMD.get(opts.cmd)) || (L && L.M && L.M.c && L.M.c.k !== 'company' ? L.M.c : null) || MU.cmdFor(pc, m.realm);
      m.cmd = c ? c.id : null;
      if (pc.id === A.S.pc && b !== 'conscripts') MU.seat(pc);
    }
    if (pc.id === A.S.pc && L && L.M && !opts.branch && !opts.quiet && L.M.offers.length >= 2) MU.queueCard(pc, L.M, { merc, sworn: true, company: m.company });
  };
  // a host of his command for his troop, nearest his home; a command with no host leaves him to the crown's (the release)
  MU.seat = function (pc) {
    const m = pc.mil, c = m && m.cmd && A.CMD ? A.CMD.get(m.cmd) : null;
    if (!c) return;
    const divs = A.CMD.divs(c).filter(d => d && !d.elite && !d.call);
    if (!divs.length) return;
    const B = MU.B(m.branch) || {};
    const fit = divs.filter(d => { const t = A.tplOf && A.tplOf(d); return t && ((t.bns || []).includes(m.troop) || (t.sup || []).some(s => (B.sup || []).includes(s))); });
    const pool = fit.length ? fit : divs, home = A.prov && pc.home != null ? A.prov(pc.home) : null;
    const d = pool.slice().sort((x, y) => (home && A.wsDist ? A.wsDist(x.loc, home.id) - A.wsDist(y.loc, home.id) : 0) || (x.id < y.id ? -1 : 1))[0];
    m.div = d.id;
  };
  // the arms a branch's troop carries, where he lacks them (the release issues them at the oath; a change of branch after it)
  MU.issue = function (pc, t) {
    const g = GD.TROOP_GEAR[t];
    if (!g || !pc.gear) return;
    const lacks = s => !pc.gear[s] || pc.gear[s] === 'fists' || pc.gear[s] === 'none';
    if (g[4] && lacks('ranged')) pc.gear.ranged = g[4];
    if (g[0] && lacks('weapon')) pc.gear.weapon = g[0] === 'lance' && !pc.gear.mount ? 'spear' : g[0];
    if (['LC', 'MC', 'HA', 'OR', 'CM', 'HC'].includes(t) && !pc.gear.mount) pc.gear.mount = t === 'CM' ? 'camel' : 'horse';
  };
  // a man already sworn asks for another of the offers: his troop, arm and company change; his old company's post is left
  MU.assign = function (pc, b) {
    const m = pc && pc.mil, B = MU.B(b);
    if (!m || !B) return false;
    m.branch = b;
    m.arm = MU.armOf(b);
    const t = MU.troopIn2(pc, b, m.merc ? 'unclaimed' : m.realm);
    if (t !== m.troop) { m.troop = t; MU.issue(pc, t); }
    if (!m.merc && pc.id === A.S.pc) {
      if (A.POSTS && A.POSTS.held) for (const k of A.POSTS.held(pc.id)) if (k.startsWith('coy:') || k.startsWith('bn:')) A.POSTS.vacate(k, 'moved');
      const was = m.div;
      m.co = null;
      m.div = null;
      MU.seat(pc);
      if (!m.div) m.div = was;
      if (A.S.coOn && A.CO && A.CO.place) A.CO.place(pc);
    }
    return true;
  };

  // the card's answer (fx muster: 1, 2, 3 or 'no')
  MU.choose = function (pc, k, ctx) {
    if (k === 'no') { pc.flags.md_walked = A.S.year; return ''; }
    const pair = Array.isArray(ctx.offers) ? ctx.offers[(k | 0) - 1] : null;
    if (!pair || !MU.B(pair[0])) return '';
    const b = pair[0];
    if (ctx.sworn) {
      if (!pc.mil) return '';
      if (b !== pc.mil.branch) MU.assign(pc, b);
      MU.roleAsk(pc, { muster: true });
      return '';
    }
    const r = A.enlist(pc, !!ctx.merc, { branch: b, cmd: ctx.cmd || null, company: ctx.company || null });
    if (r && r.ok === false) return r.msg || '';
    MU.roleAsk(pc, { muster: true });
    return '';
  };

  // ---------------------------------------------------------------- roles
  const coKey = m => (m.co ? `${m.co.div}:${m.co.b}:${m.co.i}` : `u:${m.company || m.unit || ''}`);
  MU.coKey = coKey;
  // the company's own holder of a role, when not the player: a seed man, or nobody
  MU.holder = function (pc, k) {
    const m = pc.mil, key = coKey(m);
    if (m.role && m.role.k === k && m.role.co === key) return { pid: pc.id, name: 'you' };
    const h = A.hash ? A.hash('rl:' + key + ':' + k) : 0;
    if (h % 3 !== 0) return null;
    return { name: A.oobLeader ? A.oobLeader(m.realm || pc.realm, 'rl:' + key + ':' + k, 1).name : 'an old soldier', lvl: 20 + (h >>> 3) % 26 };
  };
  MU.captainOf = function (pc) {
    const M = A.CO && A.CO.mine ? A.CO.mine(pc) : null;
    const c = M && A.CO.cap ? A.CO.cap(M.d, M.b, M.i) : null;
    if (c && c.pid && c.pid !== pc.id) return { who: c.pid, name: `Captain ${c.name}` };
    return { who: 'cap:' + coKey(pc.mil), name: c && c.name && !c.pc ? `Captain ${c.name}` : 'Your captain' };
  };
  MU.roleOptions = function (pc, o) {
    o = o || {};
    const m = pc.mil, out = [], B = MU.B(MU.branchOf(pc)) || {};
    const war = A.atWar ? A.atWar(m.realm || pc.realm).length > 0 : false;
    const FIT = { farrier: ['lances', 'light_horse', 'household'], pathfinder: ['scouts', 'light_horse'], carpenter: ['engineers', 'train'], clerk: ['train', 'garrison'], forager: ['train', 'light_horse'], signaller: ['spears', 'foot_men_at_arms'] };
    for (const R of MU.roles()) {
      const lvl = A.skill(pc, R.skill) || 0;
      if (lvl < R.min) continue;
      const rs = [{ kind: 'merit', weight: Math.round((.4 + (lvl - R.min) / 15) * 100) / 100, label: R.say || MU.SAY[R.skill], source: { t: 'skill', id: R.skill, r: Math.round(lvl) }, pub: 1 }];
      const h = MU.holder(pc, R.id);
      if (h && h.pid === pc.id) continue;
      if (h) { if (h.lvl >= lvl) continue; rs.push({ kind: 'merit', weight: .3, label: `you are better at it than ${h.name}, who has it now`, source: { t: 'holder', id: R.id }, pub: 1 }); }
      else rs.push({ kind: 'want', weight: 1, label: `the company has no ${R.name}`, source: { t: 'gap', id: R.id }, pub: 1 });
      if (R.when === 'war' && war) rs.push({ kind: 'want', weight: .6, label: 'there is a war on', source: { t: 'war' }, pub: 1 });
      if (R.when === 'peace' && !war) rs.push({ kind: 'want', weight: .3, label: 'peace is a time for rolls and roads', source: { t: 'peace' }, pub: 1 });
      if ((FIT[R.id] || []).includes(B.id)) rs.push({ kind: 'want', weight: .4, label: `${B.short} have work for a ${R.name}`, source: { t: 'branch', id: B.id }, pub: 1 });
      out.push({ id: R.id, reasons: rs });
    }
    const none = [{ kind: 'cost', weight: 1.1, label: 'the line wants every man in it', source: { t: 'line' }, pub: 1 }];
    if ((m.rank | 0) >= 1) none.push({ kind: 'cost', weight: .4, label: 'a sergeant has his section to mind', source: { t: 'rank', r: m.rank }, pub: 1 });
    if (!o.muster && m.joinD != null && day() - m.joinD < 60) none.push({ kind: 'cost', weight: .5, label: 'he is new', source: { t: 'joined' }, pub: 1 });
    out.push({ id: 'none', reasons: none });
    return out;
  };
  // the captain decides whether to offer him a role; the card follows when he does
  MU.roleAsk = function (pc, o) {
    o = o || {};
    const m = pc && pc.mil;
    if (!m || m.role || (m.rank | 0) >= 3 || pc.id !== A.S.pc) return null;
    const opts = MU.roleOptions(pc, o);
    if (opts.length < 2) return null;
    const C = MU.captainOf(pc);
    const rec = A.WHY.decide(C.who, 'role', opts, { band: .3, at: pc.id, r: m.realm, rand: MU.rng('rl:' + pc.id + ':' + day()), logIf: x => x.chose !== 'none', log: o.log });
    m.rlAsk = day();
    if (!rec || rec.chose === 'none') return rec;
    const R = MU.R(rec.chose);
    if (!o.dry) A.queue({ type: 'event', ev: 'md_role', forced: true, ctx: { rk: R.id, roleT: R.name, captT: C.name, payT: A.coin ? A.coin(R.pay) : R.pay + ' suns', whyT: cap(rec.why.slice(0, 2).map(x => x[0]).join(', and ')) + '.', addsT: R.adds } });
    return rec;
  };
  MU.takeRole = function (pc, k) {
    const m = pc.mil, R = MU.R(k);
    if (!m || !R || m.role) return false;
    m.role = { k, co: coKey(m), y: A.S.year };
    A.log(`You are the company's ${R.name} now: ${R.adds}.`, 'good');
    return true;
  };
  MU.dropRole = function (pc, why) {
    const m = pc.mil, R = m && m.role ? MU.R(m.role.k) : null;
    if (!m || !m.role) return;
    delete m.role;
    if (R && why) A.log(`You hand the ${R.name}'s duties to another man: ${why}.`);
  };

  // ---------------------------------------------------------------- the month
  MU.month = function (pc) {
    const m = pc && pc.alive && pc.mil;
    if (!m) return;
    if (!m.branch) m.branch = MU.branchOf(pc);   // an old save's soldier: read once from what it left him
    if (m.role) {
      const R = MU.R(m.role.k);
      if (!R) { delete m.role; return; }
      if ((m.rank | 0) >= 3) return MU.dropRole(pc, 'an officer has other work');
      if (m.co && m.role.co !== coKey(m)) return MU.dropRole(pc, 'you are in another company now');
      pc.coin = (pc.coin || 0) + (R.pay || 0);
      if (A.gainXp) A.gainXp(pc, R.skill, .3, { q: 'practice', why: `the ${R.name}'s duties` });
      return;
    }
    if ((m.rank | 0) <= 2 && pc.id === A.S.pc && !(A.S.queue || []).some(q => q && q.ev === 'md_role')) {
      if (m.rlAsk == null) { m.rlAsk = day(); return; }
      if (day() - m.rlAsk >= 180) MU.roleAsk(pc);
    }
  };
  A.onMonth.push(pc => { try { MU.month(pc); } catch (e) { console.error('[muster] month', e); } });

  // ---------------------------------------------------------------- the cards' answers
  (A.FX_EXTRA = A.FX_EXTRA || []).push('muster', 'musterRole', 'musterDuty');
  A.addStage('A.applyFx', 'muster', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc || !ctx) return out;
      const say = s => { if (Array.isArray(out) && s) out.push(s); };
      if (fx.muster != null) say(MU.choose(pc, fx.muster, ctx));
      if (fx.musterRole === 'take') MU.takeRole(pc, ctx.rk);
      if (fx.musterDuty && pc.mil && pc.mil.role) {
        const R = MU.R(pc.mil.role.k);
        if (fx.musterDuty === 'well') { if (A.gainXp) A.gainXp(pc, R.skill, 1.5, { q: 'stretch', why: `the ${R.name}'s work done properly` }); pc.mil.merit = (pc.mil.merit || 0) + 2; }
        if (fx.musterDuty === 'fast' && A.gainXp) A.gainXp(pc, R.skill, .5, { q: 'practice', why: `the ${R.name}'s work` });
        if (fx.musterDuty === 'pass') MU.dropRole(pc, 'you asked to be let off');
      }
    } catch (e) { console.error('[muster] fx', e); }
    return out;
  });
})();
