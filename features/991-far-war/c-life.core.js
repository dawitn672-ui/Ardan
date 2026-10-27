// War in the Far Lands, second part: a life inside it. Far games only (every hook passes through while A.FW.on is
// false).
//   organisations  the 18 bodies that are not field orders (spy services, censors, schools, rings, councils, temple
//                  orders, judges) each take the right kind of person, give a duty every few months (an event of
//                  their kind) and raise members through their ranks on merit
//   the cast       more named people per far realm at 1105: instructors at its schools, officers, a retired champion,
//                  each taught the realm's styles, none above Elite (the 32-ladder caps are untouched)
//   soldiering     a recruit scene and rank-up scenes in the template's own terms; a soldier of a horse people without
//                  a horse is offered one (a levy horse on a debt to the hundred, or bought), and with it a horse troop
//   the 1105 wars  declared in the news, shown on the Wars map, and a recruiter comes to a grown subject of either side
// State (far games only, optional): p.fwOrg { id, rank, merit, since, next }, p.flags.fw_* , p.fwRank, p.fwDebt.
(function () {
  const FW = A.FW;
  if (!FW) return;
  const D = FW.D, FAR = A.FAR;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const hashStr = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
  const farR = id => FAR.D.realms[id] || null;
  const isPc = p => p && A.S && p.id === A.S.pc;

  // ---- organisations: which kind of body each is, and who it takes
  FW.ORG_KIND = {
    'ORD-073': 'censor', 'ORD-101': 'censor', 'ORD-074': 'school', 'ORD-102': 'school', 'ORD-108': 'school',
    'ORD-076': 'spy', 'ORD-083': 'spy', 'ORD-086': 'spy', 'ORD-077': 'ring', 'ORD-085': 'ring', 'ORD-100': 'ring',
    'ORD-087': 'council', 'ORD-091': 'temple', 'ORD-107': 'temple', 'ORD-116': 'temple', 'ORD-118': 'temple',
    'ORD-114': 'judge', 'ORD-099': 'judge',
  };
  FW.ORG_EVENT = { censor: 'fw_duty_censor', school: 'fw_duty_school', spy: 'fw_duty_spy', ring: 'fw_duty_ring', council: 'fw_duty_council', temple: 'fw_duty_temple', judge: 'fw_duty_judge' };
  FW.ORG_RANKS = ['Novice', 'Sworn', 'Senior', 'Elder'];
  FW.ORG_MERIT = [0, 20, 55, 120];
  FW.orgKind = id => FW.ORG_KIND[id] || 'council';
  FW.orgRank = p => { const o = p && p.fwOrg && FW.org(p.fwOrg.id); if (!o) return ''; const r = (o.ranks && o.ranks[p.fwOrg.rank]) || FW.ORG_RANKS[p.fwOrg.rank]; return `${r} of ${o.name}`; };
  FW.orgReqs = function (pc, id) {
    const o = FW.org(id), out = [], R2 = (label, ok) => out.push({ label, ok: !!ok });
    if (!o || o.field) return out;
    const k = FW.orgKind(id), st = o.style && A.style(o.style), r = A.realm(o.realm), F = pc.sex === 'F';
    R2(`Of ${r ? r.short : 'its realm'}`, pc.realm === o.realm);
    R2('Grown', A.isAdult(pc));
    R2('Free', !(pc.flags && pc.flags.unfree) && !pc.prison);
    if (k === 'censor') { R2('Reads and writes', pc.literate); R2('Wits 50+', A.stat(pc, 'int') >= 50); R2('Honor 50+', (pc.honor || 0) >= 50); }
    if (k === 'school') { const sk = st ? st.prof : 'melee'; R2(`${GD.SKILLS[sk] || sk} 30+`, A.skill(pc, sk) >= 30); R2('40 coin for the first year', pc.coin >= 40); }
    if (k === 'spy') { R2('Intrigue or stealth 30+', Math.max(A.skill(pc, 'intrigue'), A.skill(pc, 'stealth')) >= 30); if (id === 'ORD-083') R2('Not of the court', !['noble', 'royal'].includes(pc.status)); }
    if (k === 'ring') { R2('Unarmed 30+', A.skill(pc, 'unarmed') >= 30); R2('Strength 50+', A.stat(pc, 'str') >= 50); }
    if (k === 'council') { R2('Of a ruling house or a captain', ['noble', 'royal', 'gentry'].includes(pc.status) || (pc.mil && pc.mil.rank >= 5)); R2('Command 40+', A.skill(pc, 'command') >= 40); }
    if (k === 'temple') { R2(`Faith of ${r ? r.short : 'the realm'}`, r && pc.faith === r.faith); R2('Piety 50+', (pc.piety || 0) >= 50); if (id === 'ORD-107' || id === 'ORD-116') R2('A woman', F); }
    if (k === 'judge') { R2(id === 'ORD-099' ? 'Riding or athletics 30+' : 'Honor 55+', id === 'ORD-099' ? Math.max(A.skill(pc, 'riding'), A.skill(pc, 'athletics')) >= 30 : (pc.honor || 0) >= 55); R2('Will 45+', A.stat(pc, 'wil') >= 45); }
    if (pc.fwOrg) R2('Not sworn to another body', false);
    return out;
  };
  FW.orgJoin = function (id) {
    const pc = A.pc(), o = FW.org(id);
    if (!pc || !o || o.field) return { ok: false, msg: 'No such body.' };
    const miss = FW.orgReqs(pc, id).filter(x => !x.ok);
    if (miss.length) return { ok: false, msg: 'Not yet: ' + miss.map(x => x.label).join('; ') + '.' };
    const k = FW.orgKind(id);
    if (k === 'school') pc.coin -= 40;
    pc.fwOrg = { id, rank: 0, merit: 0, since: A.S.year, next: A.absDay() + 60 };
    pc.flags['fw_org_' + k] = A.S.year;
    if (o.style && A.style(o.style)) A.learnStyle(pc, o.style, 1);
    const H = A.P((A.S.fw && A.S.fw.heads || {})[id]);
    if (H && H.alive && !pc.rel[H.id]) A.link(pc, H, 'superior', 20, 'subordinate');
    pc.deeds.push({ y: A.S.year, t: `Taken into ${o.name}` });
    A.log(`You are taken into ${o.name}, at ${o.seat}. ${H ? A.fullName(H, false) + ' looks you over and says nothing.' : 'Nobody shakes your hand.'}`, 'big');
    return { ok: true, msg: `One of ${o.name}.` };
  };
  FW.orgLeave = function () {
    const pc = A.pc(); if (!pc || !pc.fwOrg) return { ok: false };
    const o = FW.org(pc.fwOrg.id), k = FW.orgKind(pc.fwOrg.id);
    delete pc.flags['fw_org_' + k]; pc.fwOrg = null;
    A.log(`You leave ${o ? o.name : 'the body you served'}. They do not ask you back.`);
    return { ok: true, msg: 'You leave.' };
  };
  FW.orgMerit = function (pc, n) {
    const m = pc && pc.fwOrg; if (!m) return '';
    m.merit = Math.max(0, m.merit + n);
    const need = FW.ORG_MERIT[m.rank + 1];
    if (need != null && m.merit >= need) { m.rank++; A.fame(pc, 2); const s = `They raise you: ${FW.orgRank(pc)}.`; A.log(s, 'big'); return s; }
    return '';
  };

  // ---- effects of this feature's events: fwOrg (merit in your body), fwHorse ('levy' | 'buy'), fwEnlist (join the war)
  (A.FX_EXTRA = A.FX_EXTRA || []).push('fwOrg', 'fwHorse', 'fwEnlist');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    if (!fx || typeof fx !== 'object' || !(fx.fwOrg || fx.fwHorse || fx.fwEnlist) || !isPc(pc)) return r;
    let extra = '';
    try {
      if (fx.fwOrg) extra = FW.orgMerit(pc, fx.fwOrg);
      if (fx.fwHorse) extra = FW.giveHorse(pc, fx.fwHorse);
      if (fx.fwEnlist && !pc.mil) { A.enlist(pc); extra = pc.mil ? `You are on the rolls of the ${A.realmShort(pc.mil.realm)} host.` : ''; }
    } catch (e) { console.error('far war fx', e); }
    return [r, extra].filter(x => typeof x === 'string' && x).join(' ');
  };

  // ---- soldiering in the template's terms
  FW.CLASS = {
    'MT-01': 'horse', 'MT-03': 'horse', 'MT-05': 'horse', 'MT-14': 'horse', 'MT-16': 'horse', 'MT-20': 'horse', 'MT-23': 'horse',
    'MT-02': 'rolls', 'MT-10': 'rolls', 'MT-21': 'rolls', 'MT-09': 'rolls', 'MT-04': 'elephant', 'MT-06': 'sea', 'MT-13': 'sea', 'MT-19': 'sea',
    'MT-07': 'hill', 'MT-11': 'hill', 'MT-17': 'hill', 'MT-08': 'wild', 'MT-12': 'wild', 'MT-18': 'wild', 'MT-22': 'wild', 'MT-15': 'ageset',
  };
  FW.classOf = rid => { const a = FW.armyOf(rid); return a ? FW.CLASS[a.t] || 'rolls' : null; };
  // a far soldier's ctx for the scenes: his host, his unit's word, and the template's class
  FW.soldierCtx = function (pc) {
    const rid = pc.mil && pc.mil.realm, cls = rid && FW.classOf(rid);
    if (!cls) return null;
    const T = FW.tplOf(rid) || {}, tr = GD.TROOPS[pc.mil.troop];
    return { cls, host: A.realmShort(rid), unitWord: cls === 'horse' ? (T.horse || 'Horse').toLowerCase() : (T.line || 'company').toLowerCase(), troop: tr ? tr.name.toLowerCase() : 'soldiers' };
  };
  // a horse for a soldier of a horse people: the hundred lends one against his pay, or he buys one
  FW.horseSlot = rid => { const d = GD.DOCTRINE[rid] || []; return d[1] || d[0] || null; };
  FW.giveHorse = function (pc, how) {
    if (!pc.mil) return '';
    if (how === 'buy') { if (pc.coin < 60) return 'You cannot find the coin.'; pc.coin -= 60; }
    if (how === 'levy') pc.fwDebt = (pc.fwDebt || 0) + 60;
    pc.gear.mount = GD.GEAR.horse ? 'horse' : pc.gear.mount;
    pc.skills.riding = Math.max(pc.skills.riding || 0, 20);
    const t = FW.horseSlot(pc.mil.realm);
    if (t && GD.TROOPS[t]) pc.mil.troop = t;
    return `You ride with the ${GD.TROOPS[pc.mil.troop] ? GD.TROOPS[pc.mil.troop].name.toLowerCase() : 'horse'} now${how === 'levy' ? ', and owe the hundred for the horse' : ''}.`;
  };

  const en = A.enlist;
  A.enlist = function (pc) {
    const r = en.apply(this, arguments);
    try {
      if (FW.on && isPc(pc) && pc.mil && !pc.mil.merc && FW.classOf(pc.mil.realm)) {
        pc.fwRank = pc.mil.rank || 0;
        pc.flags.fw_recruit = A.S.year;
        A.queue({ type: 'event', ev: 'fw_recruit', forced: true, ctx: Object.assign({ fwq: 1 }, FW.soldierCtx(pc)) });
      }
    } catch (e) { console.error('far war enlist', e); }
    return r;
  };

  A.onMonth = A.onMonth || [];
  A.onMonth.push(pc => {
    if (!FW.on || !pc || !pc.alive || !A.S || !A.S.fw) return;
    try {
      const S = A.S, busy = () => S.queue.some(q => q && q.ctx && q.ctx.fwq);
      // the horse debt comes out of pay
      if (pc.fwDebt > 0) { const v = Math.min(pc.fwDebt, 5, pc.coin); pc.coin -= v; pc.fwDebt -= v; if (pc.fwDebt <= 0) { pc.fwDebt = 0; A.log('The horse is paid for. It is yours now, not the hundred\'s.', 'good'); } }
      // rank-up scenes
      if (pc.mil && !pc.mil.merc && FW.classOf(pc.mil.realm)) {
        if (pc.fwRank == null) pc.fwRank = pc.mil.rank || 0;
        if ((pc.mil.rank || 0) > pc.fwRank && !busy()) {
          pc.fwRank = pc.mil.rank;
          pc.flags.fw_rankup = S.year;
          A.queue({ type: 'event', ev: 'fw_rankup', forced: true, ctx: Object.assign({ fwq: 1, rankName: A.milTitle(pc) || 'a file leader' }, FW.soldierCtx(pc)) });
        } else if ((pc.mil.rank || 0) < pc.fwRank) pc.fwRank = pc.mil.rank || 0;
        // a horse for a soldier of a horse people who has none (once a year at most)
        if (FW.classOf(pc.mil.realm) === 'horse' && !pc.gear.mount && !busy() && (!pc.flags.fw_horse_asked || S.year - pc.flags.fw_horse_asked >= 1) && pc.mil.troop !== FW.horseSlot(pc.mil.realm)) {
          pc.flags.fw_horse_asked = S.year;
          A.queue({ type: 'event', ev: 'fw_horse', forced: true, ctx: Object.assign({ fwq: 1 }, FW.soldierCtx(pc)) });
        }
      }
      // duties of an organisation
      const m = pc.fwOrg, o = m && FW.org(m.id);
      if (o) {
        m.merit += 1;
        if (A.absDay() >= (m.next || 0) && !busy()) {
          m.next = A.absDay() + 110 + hashStr(pc.id + ':' + S.year) % 40;
          const H = A.P((S.fw.heads || {})[m.id]);
          A.queue({ type: 'event', ev: FW.ORG_EVENT[FW.orgKind(m.id)], forced: true, ctx: { fwq: 1, org: o.name, seat: /^[a-z]/.test(o.seat) ? 'a safe house' : o.seat, head: H ? A.fullName(H, false) : `the head of ${o.name}` } });
        }
      }
      // a recruiter for the wars of 1105 comes to a grown subject of either side
      if (!pc.mil && A.isAdult(pc) && !pc.flags.fw_war_recruit && !busy()) {
        const c = (S.fw.cf || []).find(x => x.mode === 'war' && (x.a === pc.realm || x.b === pc.realm));
        const w = c && S.wars.find(x => x.id === c.w);
        if (w && A.atWar(pc.realm).includes(w)) {
          pc.flags.fw_war_recruit = S.year;
          const foe = c.a === pc.realm ? c.b : c.a;
          A.queue({ type: 'event', ev: 'fw_war_recruit', forced: true, ctx: { fwq: 1, war: w.name, foe: A.realmShort(foe), host: A.realmShort(pc.realm) } });
        }
      }
    } catch (e) { console.error('far war month', e); }
  });

  // ---- the 1105 wars on the record: the player of either side hears of it and is pointed to the Wars map
  const cf = FW.conflicts;
  FW.conflicts = function () {
    const r = cf.apply(this, arguments);
    try {
      const S = A.S, pc = A.pc();
      for (const c of (S.fw && S.fw.cf) || []) {
        if (c.mode !== 'war') continue;
        const w = S.wars.find(x => x.id === c.w); if (!w) continue;
        A.news(`In the far lands: ${w.name}. ${A.realmShort(c.a)} and ${A.realmShort(c.b)} are at war from the first day of 1105.`, 'war');
        if (pc && (pc.realm === c.a || pc.realm === c.b)) A.log(`Your realm is at war: ${w.name}. The Wars map shows the front.`, 'warn');
      }
    } catch (e) { console.error('far war news', e); }
    return r;
  };

  // ---- more named people per realm at 1105: instructors, officers, a retired champion
  FW.seedCast = function () {
    const S = A.S, sty = Object.values(FW.styles());
    let n = 0;
    for (const rid in D.armies) {
      const r = S.realms[rid]; if (!r || !r.alive) continue;
      const mine = sty.filter(s => s.realm === rid), nat = mine.filter(s => s.kind === 'national'), schools = mine.filter(s => s.school && s.kind !== 'household').slice(0, 2);
      const big = (r.army || 0) > 100000;
      const roles = schools.map(s => ['instructor', s]).concat([['officer', nat[0] || mine[0]], ['officer', nat[1] || nat[0] || mine[0]]]).concat(big ? [['officer', nat[0] || mine[0]]] : []).concat([['champion', nat[0] || mine[0]]]);
      roles.forEach(([role, st], i) => {
        if (!st) return;
        const h = hashStr(rid + ':' + role + ':' + i), age = role === 'champion' ? 54 + h % 14 : role === 'instructor' ? 32 + h % 22 : 26 + h % 18;
        const p = A.genNoble(rid, 'gentry', null, age, h % 5 === 0 ? 'F' : 'M');
        const T = FW.tplOf(rid) || {};
        p.occ = role === 'instructor' ? `instructor at ${st.school.name}` : role === 'champion' ? `a retired champion of ${r.short}` : `a captain of the ${(T.line || 'line').toLowerCase()}`;
        const home = role === 'instructor' ? FW.provNamed(st.school.seat) : null;
        p.home = home != null ? home : r.capitalProv;
        p.styles = {}; p.styles[st.id] = { rank: role === 'champion' ? 4 : 3, xp: 0 }; p.styleMain = st.id;
        for (const s2 of nat) if (!p.styles[s2.id]) p.styles[s2.id] = { rank: 2, xp: 0 };
        const G = FW.PROF_GEAR[st.prof] || FW.PROF_GEAR.sword;
        for (const s of ['weapon', 'armor', 'shield', 'helm', 'mount', 'ranged']) p.gear[s] = G[s] && GD.GEAR[G[s]] ? G[s] : null;
        if (!p.gear.weapon) p.gear.weapon = 'spear';
        const base = role === 'champion' ? 70 : role === 'instructor' ? 62 : 55;
        for (const k of [st.prof].concat(st.weapons)) if (GD.SKILLS[k]) p.skills[k] = Math.max(p.skills[k] || 0, base + h % 12);
        try { const k0 = A.weaponSkillOf(p); if (GD.SKILLS[k0]) p.skills[k0] = Math.max(p.skills[k0] || 0, base + h % 12); } catch (e) {}
        p.skills.melee = Math.max(p.skills.melee || 0, base);
        if (role === 'officer') { p.skills.command = Math.max(p.skills.command || 0, 45 + h % 20); p.skills.tactics = Math.max(p.skills.tactics || 0, 35 + h % 20); }
        for (const s of ['str', 'spd', 'sta', 'wil', 'ins']) p.st[s] = Math.max(p.st[s] || 0, 50 + (h >> 3) % 14);
        p.fame = role === 'champion' ? 30 + h % 20 : 8 + h % 15;
        p.fwc = role;
        if (A.fightWorth(p) >= 91) FW.trim(p, 88);   // a lesser name, never a Master
        n++;
      });
    }
    FW.stats.cast = n;
  };

  // ---- the view: the far bodies of your realm, after the orders
  Object.assign(UI.A, {
    fwOrgJoin(v) { const r = FW.orgJoin(v); r.msg && UI.toast(r.msg); UI.refresh(); },
    fwOrgLeave() { const r = FW.orgLeave(); r.msg && UI.toast(r.msg); UI.refresh(); },
  });
  FW.orgsCard = function (pc) {
    const O = FW.orders().orgs, ids = Object.keys(O).filter(id => O[id].realm === pc.realm || (pc.fwOrg && pc.fwOrg.id === id));
    if (!ids.length) return '';
    let h = `<div class="card orders"><div class="row"><span class="tag">Other bodies of ${UI.esc(A.realmShort(pc.realm))}</span><span class="tiny muted grow">Not soldiers: they watch, judge, teach and pray, and take whom they choose.</span></div>`;
    for (const id of ids) {
      const o = O[id], mine = pc.fwOrg && pc.fwOrg.id === id, H = A.P((A.S.fw && A.S.fw.heads || {})[id]), reqs = !pc.fwOrg ? FW.orgReqs(pc, id) : null;
      h += `<div class="ord ${mine ? 'mine' : ''}"><div class="grow"><div class="row" style="gap:6px"><b class="ord-name">${UI.esc(A.cap(o.name))}</b><span class="chip">${UI.esc(o.kind)}</span><span class="tiny muted">${UI.esc(o.seat)} · ${UI.esc(o.group)}</span></div>`;
      h += `<div class="tiny">Led by ${H ? `<span class="click u" data-a="ov" data-v="person:${H.id}">${UI.esc(A.fullName(H, false))}</span>` : UI.esc(o.head || 'no one who gives a name')}.</div>`;
      if (reqs) h += `<div class="reqs">${reqs.map(x => `<span class="req ${x.ok ? 'ok' : 'no'}">${x.ok ? '✓' : '✗'} ${UI.esc(x.label)}</span>`).join('')}</div><button class="small ${reqs.every(x => x.ok) ? 'primary' : ''}" data-a="fwOrgJoin" data-v="${UI.esc(id)}" ${reqs.every(x => x.ok) ? '' : 'disabled'}>Ask to be taken in</button>`;
      if (mine) h += `<div class="tiny">You are ${UI.esc(FW.orgRank(pc))}. Merit: ${Math.round(pc.fwOrg.merit)}.</div><button class="small danger" data-a="fwOrgLeave">Leave them</button>`;
      h += '</div></div>';
    }
    return h + '</div>';
  };
  const oc = UI.ordersCard;
  if (typeof oc === 'function') UI.ordersCard = function (pc) {
    const h = oc.apply(this, arguments);
    try { if (FW.on && pc && A.S && A.S.fw) return (h || '') + FW.orgsCard(pc); } catch (e) {}
    return h;
  };
})();
