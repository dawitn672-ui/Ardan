// Bonds, part 2 of 3: secrets and leverage (Road to Ten, Relationships 5).
//
// The release keeps one bare counter, pc.flags.secrets, and its one blackmail scene has to invent "a lord with a past"
// to blackmail. Here secrets belong to someone:
//   - NPCs hide personal secrets drawn from who they are: a debt (the greedy, the lavish), an affair (the married and
//     fickle), a child nobody knows of, a heresy (the cynical, the curious), a crime (the deceitful, the cruel, thieves),
//     skimmed accounts (stewards and officials), desertion (craven soldiers). About two in five grown people have one.
//     What someone hides is a pure function of who they are (a hash of their id and traits): nothing is stored until it
//     is found, so drawing the person view never rolls a die;
//   - you uncover them by events (a glimpse of something), by a scheme (39-schemes' plot "dig into their past"), through
//     your circle (41-circles: a friend close to them tells you), and by events that grant the release's secret
//     with someone in them. A lore secret you know (26-belief-truth) is a hold on the ruler of the realm it shames;
//   - you can use one: a favour, money, their silence or their good word, each at a cost to your honour; a criminal
//     secret is a strong hold (it also stops their hostile moves for ten years), a shunned one a weak hold (five).
//     They may refuse, and then you expose them or back down;
//   - and they can do the same to you. Your own secrets (pc.bonds.mine) come from a murder nobody saw, an affair while
//     married, a shameful choice an event marks as a secret. The people who know may blackmail you (an NPC move);
//   - the person view shows what you know of them, and what they know of you, once known.
// State: pc.bonds.sec {pid: {k, sev, t, y, how, used, out}}, pc.bonds.hook {pid: {until, k}}, pc.bonds.mine [...].
(function () {
  const BD = A.BONDS, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), cap = BD.cap, low = BD.low, has = BD.has;
  const SEC = BD.SEC = {
    KINDS: {
      debt: { sev: 'shunned', name: 'a debt' }, affair: { sev: 'shunned', name: 'an affair' }, bastard: { sev: 'shunned', name: 'a hidden child' },
      heresy: { sev: 'shunned', name: 'a heresy' }, crime: { sev: 'criminal', name: 'a crime' }, embezzle: { sev: 'criminal', name: 'skimmed accounts' },
      desert: { sev: 'criminal', name: 'a desertion' }, lore: { sev: 'criminal', name: 'an old crime of state' }, deed: { sev: 'shunned', name: 'something done in the dark' },
    },
    HOLD: { criminal: 10, shunned: 5 },     // years a hold keeps their hostile moves off you
    AGAIN: 3,                               // years between uses of the same secret
    SEEN: 0.25,                             // chance someone you know saw a murder that the law did not
  };
  const H = BD.h, HP = BD.hp;
  const towns = t => { const p = A.prov(t.home); return p ? p.name : (A.realm(t.realm) || {}).capital || 'the town'; };
  const STATUS_DEBT = { slave: 10, serf: 15, peasant: 40, artisan: 120, merchant: 400, gentry: 600, noble: 1500, royal: 4000 };
  const OFFICE_JOBS = new Set(['steward', 'courtier', 'envoy', 'lawyer', 'merchant', 'scribe']);
  const married = t => { const s = t.spouse && A.P(t.spouse); return s && s.alive ? s : null; };

  // what a person hides, if anything (pure: a hash of who they are)
  SEC.weights = function (t) {
    const tr = k => has(t, k) ? 1 : 0, job = t.job && t.job.c, w = {};
    const sp = married(t), age = A.age(t);
    w.debt = .5 + 1.5 * tr('greedy') + 1 * tr('gluttonous') + .8 * tr('impetuous') + .8 * tr('reckless') + (['merchant', 'gentry', 'noble'].includes(t.status) ? .5 : 0);
    w.affair = sp ? .5 + 1.5 * tr('fickle') + 1 * tr('romantic') + .5 * tr('gregarious') - .4 * tr('loyal') : 0;
    w.bastard = age >= 24 ? .3 + .8 * tr('fickle') + .6 * tr('romantic') + (['gentry', 'noble', 'royal'].includes(t.status) ? .5 : 0) : 0;
    w.heresy = .3 + 1.5 * tr('cynical') + .8 * tr('curious') + .3 * tr('zealous') + (job === 'clergy' ? .8 : 0);
    w.crime = .3 + 1.4 * tr('deceitful') + .8 * tr('greedy') + 1 * tr('cruel') + .8 * tr('wrathful') + (['thief', 'pirate', 'pitfighter', 'bounty'].includes(job) ? 2 : 0);
    w.embezzle = OFFICE_JOBS.has(job) || t.office ? .3 + 1.5 * tr('greedy') + 1 * tr('deceitful') : 0;
    w.desert = t.mil || t.veteran ? .2 + 2.5 * tr('craven') : 0;
    const clean = 1 - .35 * (tr('honest') + tr('honorable') + tr('just'));
    for (const k in w) w[k] = Math.max(0, w[k] * clean);
    return w;
  };
  SEC.of = function (t) {
    if (!t || !A.isAdult(t) || !Array.isArray(t.traits)) return null;
    const w = SEC.weights(t), sum = Object.values(w).reduce((a, b) => a + b, 0);
    const p = clamp(0.22 + 0.07 * sum, 0.2, 0.7);
    if (H(t.id, 'sec') > p) return null;
    let x = H(t.id, 'seck') * sum, k = null;
    for (const key of Object.keys(w)) { x -= w[key]; if (x <= 0 && w[key] > 0) { k = key; break; } }
    k = k || Object.keys(w).find(key => w[key] > 0) || 'debt';
    return { k, sev: SEC.KINDS[k].sev, t: SEC.text(t, k) };
  };
  SEC.text = function (t, k) {
    const He = cap(A.he(t)), he = A.he(t), his = A.his(t), town = towns(t), id = t.id;
    if (k === 'debt') { const n = Math.round((STATUS_DEBT[t.status] || 60) * (1.5 + 2.5 * H(id, 'amt')) / 5) * 5; return `${He} owes ${BD.coin(n)} to a moneylender in ${town}, and has paid none of it back.`; }
    if (k === 'affair') { const sp = married(t); return `${He} has been meeting ${HP(['a miller\'s wife', 'a widowed weaver', 'a brewer\'s husband', 'a young clerk', 'a soldier\'s wife', 'a dyer\'s widow'], id, 'who')} in ${town}, behind ${sp ? sp.given + '\'s' : 'a spouse\'s'} back.`; }
    if (k === 'bastard') return `${He} has a child of ${4 + Math.floor(H(id, 'kid') * 12)} in ${town}, raised by a farmer's family, and sends money twice a year.`;
    if (k === 'heresy') { let f = (A.faith(t.faith) || {}).name || 'the faith'; if (!/^the\b/i.test(f)) f = 'the ' + f; return HP([`${He} keeps the old rites at night, and does not believe a word of what ${f} teaches.`, `${He} has said, in writing, that ${f} is a tale for children.`], id, 'her'); }
    if (k === 'crime') return HP([`${He} killed a man in a tavern brawl in ${town}, years ago, and let another hang for it.`, `${He} sold stolen horses through ${town} for three summers.`, `${He} set the fire that took a granary in ${town}, and was paid to.`], id, 'cr');
    if (k === 'embezzle') return `${He} has been skimming the accounts ${he} keeps, a little every quarter, for years.`;
    if (k === 'desert') return `${He} ran from a fight ${he} swears ${he} stood in, and others died for ${his} lie.`;
    return `${He} has something to hide.`;
  };
  // a lore secret you know that shames the realm this person rules (26-belief-truth): a hold on a crown (pure)
  SEC.lore = function (pc, t) {
    if (!pc || !t || !t.ruler || typeof LORE === 'undefined' || !Array.isArray(LORE.secrets) || !A.BT || !A.BT.secretKnown) return null;
    const r = A.realm(t.ruler); if (!r || r.ruler !== t.id) return null;
    const names = [r.short, r.name].filter(Boolean);
    for (const s of LORE.secrets) {
      if (!A.BT.secretKnown(pc, s.id)) continue;
      const txt = (s.ifr || '') + ' ' + (s.truth || '');
      if (names.some(n => n.length > 3 && txt.includes(n))) return { k: 'lore', sev: 'criminal', t: `You know the truth of "${s.title}", and what it would do to ${r.short}.`, y: pc.flags['rl_k_' + s.id], how: 'lore', lore: s.id };
    }
    return null;
  };
  SEC.known = (pc, t) => {
    if (!pc || !t) return null;
    const st = pc.bonds && pc.bonds.sec, s = st && st[t.id];
    return s && typeof s === 'object' ? s : SEC.lore(pc, t);
  };
  SEC.hidden = (pc, t) => !!(t && t.alive && pc.rel && pc.rel[t.id] && !SEC.known(pc, t) && SEC.of(t));

  // ---------------------------------------------------------------- finding out (engine only)

  SEC.learn = function (pc, t, how, alt) {
    if (!pc || !t) return null;
    const st = BD.state(pc);
    if (st.sec[t.id]) return st.sec[t.id];
    const s = SEC.of(t) || alt;
    if (!s) return null;
    const e = st.sec[t.id] = { k: s.k, sev: s.sev, t: BD.clean(s.t), y: A.S.year, how: String(how || 'chance').slice(0, 12) };
    if (pc.rel[t.id]) A.bondNote(pc, t, `You learned ${A.his(t)} secret: ${SEC.KINDS[s.k] ? SEC.KINDS[s.k].name : 'something hidden'}`);
    A.log(`You know something about ${t.given} now. ${e.t}`, 'muted');
    return e;
  };

  // C.bondSecret(p): someone you know hides something you have not found
  A.C.bondSecret = p => { if (!p || !p.rel) return false; for (const id in p.rel) { const t = A.P(id); if (t && SEC.hidden(p, t) && A.isAdult(t)) return true; } return false; };
  SEC.someHidden = (pc, notId) => Object.keys(pc.rel || {}).map(A.P).filter(t => t && t.id !== notId && A.isAdult(t) && SEC.hidden(pc, t)).sort((a, b) => String(a.id).localeCompare(String(b.id)));

  // ---------------------------------------------------------------- holds and their use

  SEC.hook = (pc, t) => { const h = pc && pc.bonds && pc.bonds.hook && t ? pc.bonds.hook[t.id] : null; return h && h.until >= A.S.year ? h : null; };
  BD.hooked = SEC.hook;
  SEC.canLever = (pc, t) => {
    if (!pc || !t || !t.alive || !A.isAdult(pc) || !A.isAdult(t) || pc.prison || !pc.rel[t.id]) return false;
    const s = SEC.known(pc, t);
    return !!s && !s.out && (s.used == null || A.S.year - s.used >= SEC.AGAIN);
  };
  // how hard they push back, in check points: pride and courage against fear of the gallows and of rank (pure)
  SEC.guard = function (pc, t) {
    const s = SEC.known(pc, t) || {};
    let g = 0;
    for (const [k, v] of [['proud', 8], ['brave', 6], ['stubborn', 6], ['wrathful', 4], ['craven', -8], ['paranoid', -4], ['humble', -3]]) if (has(t, k)) g += v;
    if (s.sev === 'criminal') g -= 10;
    g += Math.max(0, A.classOf(t) - A.classOf(pc)) * 4;
    return g;
  };
  // check bonus for the scene in progress (the release's check.bonus(pc)): the person in the scene at the head of the queue
  SEC.bonus = pc => { const q = A.S.queue[0], t = q && q.ctx && A.P(q.ctx.pid); return t ? -SEC.guard(pc, t) : 0; };

  const COST = { favor: 3, coin: 6, silence: 2, support: 3 };
  // what silence is worth to them: by their station, more for a crime (pure)
  SEC.price = (t, crim) => Math.max(5, Math.round((STATUS_DEBT[t.status] || 60) * (crim ? 1.2 : 0.6) * (0.7 + 0.6 * H(t.id, 'pay')) / 5) * 5);
  BD.FX.lever = function (pc, how, ctx) {
    const t = A.P(ctx.pid), s = t && SEC.known(pc, t);
    if (!t || !s) return '';
    const st = BD.state(pc), crim = s.sev === 'criminal';
    if (st.sec[t.id]) st.sec[t.id].used = A.S.year;
    else st.sec[t.id] = Object.assign({}, s, { used: A.S.year });
    pc.honor = clamp((pc.honor || 0) - (COST[how] || 3) - (crim ? 1 : 0), 0, 100);
    let out = '';
    if (how === 'favor') { A.addFavor(pc, t.id, crim ? 2 : 1); A.addOp(pc, t, -10); out = `(${t.given} owes you ${crim ? 'two favours' : 'a favour'})`; }
    if (how === 'coin') { const n = SEC.price(t, crim); t.coin = Math.max(0, (t.coin || 0) - n); pc.coin = (pc.coin || 0) + n; A.addOp(pc, t, -22); out = `(+${BD.coin(n)})`; }
    if (how === 'support') { A.addOp(pc, t, -6); if (A.classOf(t) >= 3 && A.giveLetter) { const L = A.giveLetter(pc, t, 'any'); out = `(a letter from ${t.given}, weight ${L.power})`; } else { A.fame(pc, 2); out = `(${t.given} speaks well of you)`; } }
    if (how === 'silence' || crim) { st.hook[t.id] = { until: A.S.year + SEC.HOLD[crim ? 'criminal' : 'shunned'], k: how, y: A.S.year }; if (how === 'silence') A.addOp(pc, t, -8); }
    A.bondNote(pc, t, `You held ${A.his(t)} secret over ${A.him(t)}`, null, { s: 'you' });
    return out;
  };
  // they refused: what comes next is a choice of its own
  BD.FX.refused = (pc, v, ctx) => { A.S.queue.splice(1, 0, { type: 'event', ev: 'bd_lever_refused', ctx: { pid: ctx.pid } }); return ''; };
  // expose them: their name suffers in their own circle; a criminal secret ends a career
  BD.FX.expose = function (pc, v, ctx) {
    const t = A.P(ctx.pid), s = t && SEC.known(pc, t);
    if (!t || !s) return '';
    const st = BD.state(pc), crim = s.sev === 'criminal';
    st.sec[t.id] = Object.assign({}, s, { out: A.S.year });
    delete st.hook[t.id];
    t.fame = clamp((t.fame || 0) - (crim ? 12 : 6), 0, 100);
    for (const id of Object.keys(t.rel || {})) { const o = A.P(id); if (o && o.alive && o.rel && o.rel[t.id] && o.id !== pc.id) o.rel[t.id].op = clamp((o.rel[t.id].op || 0) - (crim ? 12 : 6), -100, 100); }
    t.deeds = Array.isArray(t.deeds) ? t.deeds : [];
    t.deeds.push({ y: A.S.year, t: `Exposed: ${BD.clean(s.t)}` });
    if (crim && t.job) { t.job = null; t.occ = 'disgraced'; }
    pc.honor = clamp((pc.honor || 0) + (crim ? 1 : -3), 0, 100);
    A.addOp(pc, t, -30);
    if (pc.rel[t.id] && !['enemy'].includes(pc.rel[t.id].type) && !A.FAMILY_RELS.includes(pc.rel[t.id].type)) { pc.rel[t.id].type = 'enemy'; if (t.rel[pc.id]) t.rel[pc.id].type = 'enemy'; }
    A.bondNote(pc, t, `You told the world ${A.his(t)} secret`, null, { s: 'you' });
    return `(${t.given}'s secret is out)`;
  };
  // learn: the secret of ctx.pid (true) or of ctx.oid ('oid'); a search that finds nothing says so
  BD.FX.learn = function (pc, v, ctx) {
    const t = A.P(v === 'oid' ? ctx.oid : ctx.pid);
    if (!t) return '';
    const e = SEC.learn(pc, t, ctx.how || (v === 'oid' ? 'told' : 'seen'));
    return e ? '' : `(${t.given} hides nothing worth knowing)`;
  };

  // warn: you tell the person a secret is about (ctx.oid) that people are talking
  BD.FX.warn = (pc, v, ctx) => { const o = A.P(ctx.oid); if (o && o.alive && pc.rel[o.id]) A.addOp(pc, o, 10); return ''; };

  // ---------------------------------------------------------------- your own secrets, and the people who know them

  SEC.mine = pc => (pc && pc.bonds && Array.isArray(pc.bonds.mine) ? pc.bonds.mine : []);
  SEC.addMine = function (pc, k, text, know, sev) {
    const st = BD.state(pc), t = BD.clean(text);
    if (!t || st.mine.some(s => s.t === t)) return null;
    const s = { k, sev: sev || (SEC.KINDS[k] || {}).sev || 'shunned', t, y: A.S.year, know: (know || []).filter(Boolean).map(String).slice(0, 6) };
    st.mine.push(s);
    if (st.mine.length > 8) st.mine.splice(0, st.mine.length - 8);
    return s;
  };
  SEC.theyKnow = (pc, t) => t ? SEC.mine(pc).find(s => !s.out && s.know.includes(String(t.id))) || null : null;
  BD.knowsMine = SEC.theyKnow;
  // a secret of yours comes out: renown and honour suffer; a killing brings the law
  SEC.outMine = function (pc, s, by) {
    if (!s || s.out) return '';
    s.out = A.S.year;
    const crim = s.sev === 'criminal';
    A.fame(pc, crim ? -6 : -3);
    pc.honor = clamp((pc.honor || 0) - (crim ? 8 : 4), 0, 100);
    A.log(`It is out: ${s.t}${by ? ` ${by.given} saw to that.` : ''}`, 'bad');
    if (crim && s.k === 'crime' && A.punish) return String(A.punish(pc, 'murder') || '');
    return '';
  };
  // fx.bonds.mine: 'pay' | 'out' | 'turn' | 'cow' (the blackmail scenes)
  BD.FX.mine = function (pc, how, ctx) {
    const t = A.P(ctx.pid), s = SEC.mine(pc).find(x => x.t === ctx.mt) || (t && SEC.theyKnow(pc, t));
    if (!t || !s) return '';
    if (how === 'pay') { const n = Math.min(pc.coin || 0, +ctx.amtN || 0); pc.coin = (pc.coin || 0) - n; t.coin = (t.coin || 0) + n; if (A.chance(has(t, 'greedy') ? .6 : .35)) BD.again(pc, ctx); return `(−${BD.coin(n)})`; }
    if (how === 'out') return SEC.outMine(pc, s, t);
    if (how === 'blunt') { s.out = A.S.year; return ''; }   // it came out, and you laughed it off
    if (how === 'turn') { const st = BD.state(pc); st.hook[t.id] = { until: A.S.year + SEC.HOLD.criminal, k: 'standoff', y: A.S.year }; return `(${t.given} will keep quiet while you do)`; }
    if (how === 'cow') { s.know = s.know.filter(x => x !== String(t.id)); BD.state(pc).hook[t.id] = { until: A.S.year + SEC.HOLD.shunned, k: 'fear', y: A.S.year }; return `(${t.given} will not speak of it again)`; }
    return '';
  };
  // a blackmailer who was paid may come back (booked through 21-npc-initiative's budget when it is there)
  BD.again = function (pc, ctx) {
    const nc = { pid: ctx.pid, mt: ctx.mt, npcMove: true, follow: 'bd_blackmail_again' };
    if (A.NPCI && A.NPCI.follow) A.NPCI.follow(pc, nc, 'bd_blackmail_again', 500, 1300);
    else A.schedule({ type: 'event', ev: 'bd_blackmail_again', ctx: nc, forced: true }, A.ri(500, 1300));
  };

  // where your secrets come from: a murder nobody saw (the release's one-click murder); a scheme's poison or knife;
  // a lover while you are married; an event choice that marks a shameful secret with someone there to see it
  BD.killHooks = BD.killHooks || [];
  BD.killHooks.push(function (pc, t, how) {
    if (how !== 'murder' && how !== 'scheme') return;
    const witness = [];
    if (how === 'scheme' && A.SCHEMES && A.SCHEMES.agents) for (const a of A.SCHEMES.agents(pc, t)) witness.push(a.id);
    // someone may have seen: one in four (SEC.SEEN), someone from your own circle
    if (SEC.SEEN >= 1 || A.chance(SEC.SEEN)) { const pool = Object.keys(pc.rel || {}).map(A.P).filter(p => p && p.alive && p.id !== t.id && A.isAdult(p) && !A.FAMILY_RELS.includes(pc.rel[p.id].type)); const w = pool.length ? A.pick(pool) : null; if (w) witness.push(w.id); }
    SEC.addMine(pc, 'crime', `The death of ${t.given} ${t.sur || ''} in ${A.S.year} was your doing.`, witness, 'criminal');
  });
  BD.onFx.push(function (pc, fx, ctx) {
    if (!(fx.secret > 0)) return;
    const q = A.S.queue[0], title = q && q.view ? BD.clean(q.view.title || '') : '';
    const t = ctx.pid ? A.P(ctx.pid) : null;
    // the release's +1 secret with someone in the scene: something you learned about them, or saw them do
    if (t && t.alive && t.id !== pc.id && pc.rel[t.id]) SEC.learn(pc, t, 'seen', { k: 'deed', sev: 'shunned', t: `What ${A.he(t)} did, in the matter of ${low(title || 'that year')}, would cost ${A.him(t)} dear if it were known.` });
    // a shameful choice is your secret too, and whoever was there knows it
    if ((fx.honor || 0) < 0) SEC.addMine(pc, 'deed', `What you did in the matter of ${low(title || 'that year')}, in ${A.S.year}.`, t ? [t.id] : [], (fx.honor || 0) <= -10 ? 'criminal' : 'shunned');
  });
  // once a year: an affair while you are married is a secret your lover keeps; what one person knows, a friend of theirs
  // may come to know (one in ten a year)
  SEC.year = function (pc) {
    const sp = pc.spouse && A.P(pc.spouse);
    if (sp && sp.alive) for (const x of A.relsOf(pc, ['lover'])) if (x.p.alive && x.p.id !== sp.id) SEC.addMine(pc, 'affair', `You have taken ${x.p.given} as a lover behind ${sp.given}'s back.`, [x.p.id], 'shunned');
    for (const s of SEC.mine(pc)) {
      if (s.out) continue;
      for (const kid of s.know.slice()) {
        const k = A.P(kid);
        if (!k || !k.alive || !A.chance(0.1)) continue;
        const fr = Object.keys(k.rel || {}).filter(id => ['friend', 'bestfriend', 'spouse', 'lover'].includes(k.rel[id].type) && pc.rel[id] && !s.know.includes(id) && id !== String(pc.id));
        if (fr.length) s.know.push(A.pick(fr));
      }
      if (s.know.length > 6) s.know.splice(0, s.know.length - 6);
    }
  };

  // ---------------------------------------------------------------- NPC moves: blackmail, and a friend's gossip

  BD.kind('bd_blackmail', { ev: 'bd_blackmail', g: 'hostile', base: 1.3, op: 10, near: .4,
    tr: { greedy: 2, deceitful: 1.6, cruel: 1.3, ambitious: 1.2, honest: .2, kind: .3, loyal: .3, honorable: .2, just: .4 }, mot: { coin: 1, status: .4 },
    sit: (pc, t) => SEC.theyKnow(pc, t) ? 1.5 : 0 });
  BD.kind('bd_tell', { ev: 'bd_sec_told', g: 'warm', base: .6, op: 30, near: .2,
    tr: { gregarious: 1.8, deceitful: 1.3, fickle: 1.3, shy: .5, loyal: .6, honest: .8, honorable: .5 }, mot: { status: .3 },
    sit: (pc, t) => SEC.gossipOf(pc, t) ? 1 : 0 });
  // who a friend of yours could tell you about: someone close to them, whom you know, with something hidden (pure)
  SEC.gossipOf = function (pc, t) {
    const close = A.CIRCLES && A.CIRCLES.close ? A.CIRCLES.close(t) : Object.keys(t.rel || {}).filter(id => ['friend', 'bestfriend', 'spouse', 'sibling', 'lover'].includes(t.rel[id].type)).map(A.P).filter(x => x && x.alive);
    return close.filter(x => x.id !== pc.id && SEC.hidden(pc, x)).sort((a, b) => String(a.id).localeCompare(String(b.id)))[0] || null;
  };
  // a hold stops their hostile moves (21-npc-initiative's desire, 39-schemes' plots against you)
  if (A.NPCI && typeof A.NPCI.desire === 'function') {
    const desire = A.NPCI.desire;
    A.NPCI.desire = function (pc, t, k) {
      const K = A.NPCI.KINDS[k];
      if (K && K.g === 'hostile' && SEC.hook(pc, t)) return { w: 0, why: [] };
      return desire.apply(this, arguments);
    };
  }
  if (A.SCHEMES && typeof A.SCHEMES.enemies === 'function') {
    const en = A.SCHEMES.enemies;
    A.SCHEMES.enemies = function (pc) { return en.apply(this, arguments).filter(x => !SEC.hook(pc, x.p)); };
  }

  // ---------------------------------------------------------------- the person view: "Use what you know", "Dig"

  A.INTERACT.bd_lever = { name: 'Use what you know', cost: 0 };
  A.INTERACT.bd_dig = { name: 'Dig into their past', cost: 1 };
  const SC = A.SCHEMES;
  if (SC && SC.KINDS && SC.MENUS) {
    // a scheme of its own in 39-schemes: months of questions, an opening, a chance each month of being noticed
    SC.KINDS.dig = { name: 'Dig into their past', verb: 'digging into the past of', skills: ['intrigue', 'deception'], base: 14, risk: 0.03 };
    SC.MENUS.sc_dig = ['dig'];
    A.INTERACT.sc_dig = { name: 'Plot: dig into their past', cost: 0 };
    const can = SC.can;
    SC.can = function (pc, t, k) {
      if (k !== 'dig') return can.apply(this, arguments);
      if (!pc || !t || !t.alive || t.id === pc.id || !A.isAdult(pc) || !A.isAdult(t) || pc.prison) return false;
      if (SC.list(pc).some(s => s.t === t.id) || SC.list(pc).length >= SC.MAX) return false;
      return !SEC.known(pc, t);
    };
    // its scenes are this feature's: the last move and being found out
    const queue = A.queue;
    A.queue = function (item) {
      if (item && item.type === 'event' && item.ctx && item.ctx.k === 'dig') {
        if (item.ev === 'sch_done_dig') item.ev = 'bd_dig_done';
        else if (item.ev === 'sch_found') item.ev = 'bd_dig_found';
      }
      return queue.apply(this, arguments);
    };
  }
  const opts = A.interactOptions;
  A.interactOptions = function (pc, t) {
    const o = opts.apply(this, arguments);
    try {
      if (SEC.canLever(pc, t)) o.push('bd_lever');
      if (!(SC && SC.KINDS && SC.KINDS.dig) && A.isAdult(pc) && t.alive && A.isAdult(t) && !SEC.known(pc, t)) o.push('bd_dig');
    } catch (e) {}
    return o;
  };
  const interact = A.interact;
  A.interact = function (tid, key) {
    const pc = A.pc(), t = A.P(tid);
    if (key === 'bd_lever') {
      if (!SEC.canLever(pc, t)) return { ok: false, msg: 'You have nothing to hold over them.' };
      A.queue({ type: 'event', ev: 'bd_lever', forced: true, ctx: { pid: t.id } });
      return { ok: true, msg: '' };
    }
    if (key === 'bd_dig') {
      if (!pc || !t || !t.alive) return { ok: false, msg: 'They are not here.' };
      if (A.S.time < 1) return { ok: false, msg: 'Not enough initiative (⧗) yet.' };
      A.S.time -= 1;
      A.queue({ type: 'event', ev: 'bd_dig_try', forced: true, ctx: { pid: t.id } });
      return { ok: true, msg: '' };
    }
    if (key === 'sc_dig' && SC && SC.start) {
      if (!SC.can(pc, t, 'dig')) return { ok: false, msg: 'Not now.' };
      const s = SC.start(pc, t, 'dig');
      return s ? { ok: true, msg: '' } : { ok: false, msg: 'Not now.' };
    }
    const before = key === 'murder' && t ? t.alive : false;
    const res = key === 'murder' ? BD.blaming(tid, 'murder', () => interact.apply(this, arguments)) : interact.apply(this, arguments);
    // the release's murder: if nobody was seen, it is your secret now (BD.killHooks also ran, from A.kill)
    try { if (key === 'murder' && before && t && !t.alive && res && /or so you hoped/.test(res.msg || '')) { const s = SEC.mine(pc).find(x => x.t.includes(t.given) && x.y === A.S.year); if (s) s.out = A.S.year; } } catch (e) {}
    return res;
  };

  // what you know of them, what they know of you, and any hold (pure)
  BD.personExtra.push(function (pc, t) {
    if (!pc || !t || t.id === pc.id) return '';
    const s = SEC.known(pc, t), mine = SEC.theyKnow(pc, t), hk = SEC.hook(pc, t), bits = [];
    if (s) bits.push(`<div class="small${s.out ? ' muted' : ''}"><b>What you know of ${UI.esc(A.him(t))}:</b> ${UI.esc(s.t)} <span class="tiny muted">(${UI.esc(s.out ? 'out since ' + s.out : (s.sev === 'criminal' ? 'a strong hold' : 'a weak hold') + (s.y ? ', since ' + s.y : ''))})</span></div>`);
    if (hk) bits.push(`<div class="tiny good">${UI.esc(cap(A.he(t)))} will not move against you until ${UI.esc(String(hk.until))}.</div>`);
    if (mine) bits.push(`<div class="small bad"><b>${UI.esc(cap(A.he(t)))} knows:</b> ${UI.esc(mine.t)}</div>`);
    return bits.length ? `<div class="bd-sec" style="margin-top:6px">${bits.join('')}</div>` : '';
  });

  A.onMonth.push(pc => { if (!pc || !pc.alive || !BD.isPc(pc)) return; const st = BD.state(pc); if (st.sy !== A.S.year) { st.sy = A.S.year; SEC.year(pc); } });
})();
