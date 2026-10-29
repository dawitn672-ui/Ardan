// 97-life-fixes, part 3: a chosen ambition, at coming of age and again at 35.
//
// The release dropped its ambition system (A.migrateV10 deletes p.amb from saves before version 11, and nothing set it
// again), so C.ambition always said no and the 30 scenes written for ambitions (pa_*, among them pa_freedom_buy,
// pa_freedom_kind_master, pa_expand_petition, pa_golden_harvest and pa_web_marriage) could never fire. Restoring it is
// sound: the migration only runs on saves older than version 11, and the field is the one the scenes already read.
// - When you come of age (A.isAdult), when you reach 35 (C.ageAdj, so an elf is asked at 35 in human years) and when
//   you first rule, a scene (lfx_amb_young, _mid, _reign: ambition.events.js) offers up to three ambitions that fit your life now,
//   and "Take life as it comes". At 35 your old one is offered first: hold to it, change it, or let it go.
// - The choice is kept as p.amb = { k, y } (the shape C.ambition reads), so the pa_* scenes come back to life.
// - The Life tab shows it under What now (UI.whatNowCard): its name, the next step and how far along you are.
// - Each month the engine checks whether it is done; if so it says so, writes a deed, and the ambition is marked
//   done (p.amb.done = year) until the next time you are asked.
(function () {
  const LF = A.LF = A.LF || {};
  const C = () => A.C;
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const sk = (p, k) => (A.skill ? A.skill(p, k) : 0);
  const kids = p => (p.children || []).map(A.P).filter(x => x && x.alive).length;
  const unfree = p => !!(p.flags && p.flags.unfree);
  const price = p => (p.flags && p.flags.unfree === 'slave' ? 120 : 60);
  const job = p => p.job && GD.CAREERS[p.job.c];
  const path = p => (p.job ? A.pathOfCareer(p.job.c) : '');
  const realm = p => (p.ruler ? A.realm(p.ruler) : null);
  const provs = p => { const r = realm(p); return r && A.realmProvs ? A.realmProvs(r.id).length : 0; };
  const allies = p => { const r = realm(p); return r && Array.isArray(r.allies) ? r.allies.length : 0; };
  const ratio = (a, b) => Math.max(0, Math.min(1, b > 0 ? a / b : 0));
  // k: name on the card, t: the choice's words (12 at most), fit: score when offered (0 = not offered),
  // done, step (the next step, in words), prog (0 to 1)
  // the golden age's treasury: twice what the crown held when the aim was taken, and a year's income on top, at least
  // 20,000 (cycle 2, design D4: "229,000 suns of 20,000 suns in the treasury", an aim met before it was set). Kept on
  // the ambition (p.amb.gt); an ambition from an older save keeps 20,000
  const goldT = p => (p && p.amb && p.amb.k === 'golden' && p.amb.gt > 0 ? p.amb.gt : 20000);
  LF.goldTarget = r => Math.max(20000, Math.round((2 * Math.max(0, r.treasury || 0) + Math.max(0, r.income || 0)) / 1000) * 1000);
  LF.AMB = {
    freedom: { name: 'Buy your freedom', t: 'Buy your freedom, whatever it costs',
      fit: p => (unfree(p) ? 10 : 0), done: p => !unfree(p),
      step: p => `Save ${coin(price(p))} for the price of your freedom; you have ${coin(p.coin)}.`, prog: p => ratio(p.coin, price(p)) },
    wealth: { name: 'Make a fortune', t: 'Make a fortune and never count coppers again',
      fit: p => (unfree(p) ? 0 : 3 + (p.status === 'merchant' ? 3 : 0) + (path(p) === 'guild' ? 2 : 0)), done: p => p.coin >= 5000,
      step: p => `Build a purse of ${coin(5000)}; you have ${coin(p.coin)}. Trade, a shop of your own, lending.`, prog: p => ratio(p.coin, 5000) },
    trade: { name: 'Master your trade', t: 'Become a master of your trade',
      fit: p => (p.job && ['guild', 'common', 'sea', 'learning'].includes(path(p)) ? 5 : p.status === 'artisan' ? 4 : 0),
      done: p => { const J = job(p); return !!(J && p.job.r >= Math.min(3, J.ranks.length - 1)); },
      step: p => { const J = job(p); return J ? `Rise in ${J.name.toLowerCase()}: rank ${p.job.r + 1} of ${Math.min(4, J.ranks.length)}. Good work, and the guild's eye.` : 'Take up a trade (Path tab).'; },
      prog: p => { const J = job(p); return J ? ratio(p.job.r, Math.min(3, J.ranks.length - 1)) : 0; } },
    family: { name: 'Raise a full house', t: 'A home, a spouse, and children at the table',
      fit: p => 3 + (C().married(p) ? 0 : 1), done: p => C().married(p) && kids(p) >= 3,
      step: p => (C().married(p) ? `Children at your table: ${kids(p)} of 3.` : 'Find someone to marry: court, a match, a festival.'),
      prog: p => (C().married(p) ? 0.25 : 0) + 0.75 * ratio(kids(p), 3) },
    renown: { name: 'Make a name', t: 'Be known by name in every market',
      fit: p => 2 + (p.fame >= 10 ? 2 : 0), done: p => (p.fame || 0) >= 60,
      step: p => `Renown ${Math.round(p.fame || 0)} of 60: tourneys, deeds done in public, the Seek renown plan.`, prog: p => ratio(p.fame || 0, 60) },
    faith: { name: 'Serve the gods', t: 'Give your life to the gods',
      fit: p => ((p.piety || 0) >= 40 || (p.job && p.job.c === 'clergy') ? 5 : (p.piety || 0) >= 25 ? 2 : 0),
      done: p => (p.piety || 0) >= 90 || !!(p.job && p.job.c === 'clergy' && p.job.r >= 2),
      step: p => `Piety ${Math.round(p.piety || 0)} of 90. Devotion, pilgrimage, or a priest's post.`, prog: p => ratio(p.piety || 0, 90) },
    scholar: { name: 'Master learning', t: 'Master the learning of the old books',
      fit: p => (p.literate || p.flags.literate ? 4 : 0) + (sk(p, 'learning') >= 15 ? 2 : 0), done: p => sk(p, 'learning') >= 60,
      step: p => `Learning ${Math.round(sk(p, 'learning'))} of 60: study, a teacher, the College.`, prog: p => ratio(sk(p, 'learning'), 60) },
    teacher: { name: 'Teach the young', t: 'Teach the young what you know',
      fit: p => (p.job && p.job.c === 'teacher' ? 5 : sk(p, 'learning') >= 25 ? 3 : 0), done: p => !!(p.job && p.job.c === 'teacher' && p.job.r >= 1),
      step: p => (p.job && p.job.c === 'teacher' ? 'Prove yourself as a teacher: a pupil who goes far, a school that keeps you.' : 'Take a teaching post (Path tab): letters first, then a school.'),
      prog: p => (p.job && p.job.c === 'teacher' ? 0.5 + 0.5 * ratio(p.job.r, 1) : ratio(sk(p, 'learning'), 40) * 0.5) },
    blade: { name: 'Master the sword', t: 'Become a sword nobody wants to face',
      fit: p => (sk(p, 'melee') >= 20 || p.mil ? 4 : 0) + (p.styles && Object.keys(p.styles).length ? 2 : 0),
      done: p => sk(p, 'melee') >= 70 || (A.bestStyleRank ? A.bestStyleRank(p) >= 3 : false),
      step: p => `Swordwork ${Math.round(sk(p, 'melee'))} of 70: a school of fence, a master, real fights.`, prog: p => ratio(sk(p, 'melee'), 70) },
    knight: { name: 'Win your spurs', t: 'Win your spurs and ride as a knight',
      fit: p => (['gentry', 'noble', 'royal'].includes(p.status) && !p.ruler ? 5 : p.mil ? 2 : 0),
      done: p => !!(p.job && p.job.c === 'knight') || !!(p.noble && p.noble.rung >= 2),
      step: () => 'Be knighted: a lord\'s service, the lists, a deed in war.', prog: p => (p.noble ? ratio(p.noble.rung, 2) : 0) },
    soldier: { name: 'Rise in the army', t: 'Rise to command men in the field',
      fit: p => (p.mil ? 5 : unfree(p) ? 0 : 2), done: p => !!(p.mil && p.mil.rank >= 4),
      step: p => (p.mil ? `Rank ${p.mil.rank} of 4, a captain: fight, be noticed, stay alive.` : 'Enlist: a sergeant\'s table, a lord\'s levy.'),
      prog: p => (p.mil ? ratio(p.mil.rank, 4) : 0) },
    explorer: { name: 'See the world', t: 'See the far realms before you die',
      fit: p => (unfree(p) ? 0 : 2 + (sk(p, 'survival') >= 20 ? 2 : 0)), done: p => (A.realmsSeen ? A.realmsSeen(p) : 0) >= 8,
      step: p => `Realms seen: ${A.realmsSeen ? A.realmsSeen(p) : 0} of 8. Travel, trade runs, an envoy's post.`, prog: p => ratio(A.realmsSeen ? A.realmsSeen(p) : 0, 8) },
    court: { name: 'Win a place at court', t: 'Sit at the council table',
      fit: p => (['noble', 'royal'].includes(p.status) || path(p) === 'court' ? 5 : A.classOf(p) >= 4 ? 2 : 0), done: p => !!p.office,
      step: () => 'A seat on the council: favour with the crown, a post at court, a vacancy.', prog: p => ratio(A.classOf(p), 6) },
    throne: { name: 'Take the throne', t: 'Sit on the throne itself',
      fit: p => (p.status === 'royal' && !p.ruler ? 6 : p.noble && p.noble.rung >= 4 && !p.ruler ? 2 : 0), done: p => !!p.ruler,
      step: () => 'Rule: by inheritance, a faction that wins, or a plot.', prog: p => ratio(A.classOf(p), 9) },
    expand: { name: 'Widen the realm', t: 'Leave the realm larger than you found it',
      fit: p => (p.ruler ? 5 : 0), done: p => !!(p.amb && p.amb.p0 != null && provs(p) >= p.amb.p0 + 3),
      step: p => `Provinces held: ${provs(p)}; ${p.amb && p.amb.p0 != null ? p.amb.p0 + 3 : provs(p) + 3} would do it.`,
      prog: p => (p.amb && p.amb.p0 != null ? ratio(provs(p) - p.amb.p0, 3) : 0) },
    golden: { name: 'Bring a golden age', t: 'Give the realm a golden age',
      fit: p => (p.ruler ? 5 : 0), done: p => { const r = realm(p); return !!(r && r.stability >= 85 && r.treasury >= goldT(p)); },
      step: p => { const r = realm(p); return r ? `Stability ${Math.round(r.stability)} of 85 and ${coin(r.treasury)} of ${coin(goldT(p))} in the treasury.` : ''; },
      prog: p => { const r = realm(p); return r ? (ratio(r.stability, 85) + ratio(r.treasury, goldT(p))) / 2 : 0; } },
    web: { name: 'Weave a web of alliances', t: 'Bind the crowns around you with alliances',
      fit: p => (p.ruler ? 4 : 0), done: p => allies(p) >= 3,
      step: p => `Allies: ${allies(p)} of 3. Marriages, summits, gifts.`, prog: p => ratio(allies(p), 3) },
    // for the second half of a life: what comes after the top (asked again when an ambition is met: lfx_amb_top)
    lord: { name: 'Hold land of your own', t: 'Hold land of your own, and men who answer to you',
      fit: p => (p.ruler ? 0 : p.noble && p.noble.rung >= 2 && p.noble.rung < 4 ? 6 : p.mil && p.mil.rank >= 5 ? 3 : (p.fame || 0) >= 40 ? 2 : 0),
      done: p => !!(p.noble && p.noble.rung >= 4),
      step: p => (p.noble && p.noble.rung >= 2 ? 'A fief from the crown: renown 50, a high command or a council seat, and the crown\'s good opinion.' : 'Be knighted first: renown, a captain\'s rank, the crown\'s eye. Or buy a patent (Decisions).'),
      prog: p => (p.noble ? ratio(p.noble.rung + 1, 5) : ratio(p.fame || 0, 100)) },
    legend: { name: 'Be named among the Legends', t: 'Be counted among the five best blades living',
      fit: p => { const w = A.fightWorth ? A.fightWorth(p) : 0; return w >= 95 && w < 118 ? 6 : w >= 85 ? 2 : 0; },
      done: p => (A.fightWorth ? A.fightWorth(p) : 0) >= 118,
      step: p => `Fighting worth ${Math.round(A.fightWorth ? A.fightWorth(p) : 0)} of 118: masters to learn from, real fights, a school's highest rank.`,
      prog: p => ratio((A.fightWorth ? A.fightWorth(p) : 0) - 60, 58) },
    work: { name: 'Leave something that lasts', t: 'Build something that outlasts you',
      fit: p => ((p.coin || 0) >= 20000 && !(Array.isArray(p.lfWorks) && p.lfWorks.length) ? 6 : (p.coin || 0) >= 8000 ? 2 : 0),
      done: p => Array.isArray(p.lfWorks) && p.lfWorks.some(w => w && w.k !== 'ransom'),
      step: p => `A great work (Decisions tab): a college, a ship, an almshouse, a patron's gift. You have ${coin(p.coin)}.`,
      prog: p => ratio(p.coin || 0, 30000) },
    house: { name: 'Found a house', t: 'Found a house your grandchildren will carry',
      fit: p => (p.ruler || (p.house && !(p.flags && p.flags.bastard)) ? 0 : (p.fame || 0) >= 20 && (p.coin || 0) >= 1000 ? 5 : 0),
      done: p => !!(p.house && A.S.houses && A.S.houses[p.house] && A.S.houses[p.house].founder === p.id),
      step: () => 'Found a house of your own (Decisions tab): renown 25 and 1,500 suns for the heralds.',
      prog: p => (ratio(p.fame || 0, 25) + ratio(p.coin || 0, 1500)) / 2 },
  };
  LF.ambOf = p => (p && p.amb && typeof p.amb === 'object' && LF.AMB[p.amb.k] ? p.amb : null);
  // a stable order between equal scores: no draw from the random stream, the same for anyone who looks
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };
  LF.ambOffer = function (p, when) {
    const cur = LF.ambOf(p), out = [];
    const ruling = when === 'reign';
    const all = Object.keys(LF.AMB).filter(k => !(cur && k === cur.k)).map(k => {
      let f = 0; try { f = LF.AMB[k].fit(p) || 0; } catch (e) { f = 0; }
      if (ruling && !['expand', 'golden', 'web'].includes(k)) f = 0;
      try { if (f && LF.AMB[k].done(p)) f = 0; } catch (e) {}
      return { k, f, h: hash(p.id + ':' + k + ':' + (when || '')) };
    }).filter(x => x.f > 0).sort((a, b) => b.f - a.f || a.h - b.h);
    if (cur && !cur.done && when === 'mid') out.push(cur.k);
    // after the top: the second-half ambitions first, where they fit
    if (when === 'top') all.sort((a, b) => (LF.LATE.includes(b.k) ? 1 : 0) - (LF.LATE.includes(a.k) ? 1 : 0) || b.f - a.f || a.h - b.h);
    for (const x of all) { if (out.length >= 3) break; out.push(x.k); }
    return out;
  };
  LF.LATE = ['lord', 'legend', 'work', 'house', 'court', 'throne', 'renown', 'teacher'];
  LF.setAmb = function (p, k) {
    if (!p) return '';
    if (!k || !LF.AMB[k]) { delete p.amb; return ''; }
    p.amb = { k, y: A.S.year };
    if (k === 'expand') p.amb.p0 = provs(p);
    if (k === 'golden') { const r = realm(p); if (r) p.amb.gt = LF.goldTarget(r); }
    return '';
  };
  // when to ask: coming of age, 35, and the first year of a reign
  LF.ambMonth = function (pc) {
    if (LF.OFF || LF.AMB_OFF || !pc || !pc.alive || pc.id !== A.S.pc || pc.prison || !A.isAdult(pc)) return;
    if (A.S.queue.some(q => q && /^lfx_amb_/.test(q.ev || ''))) return;
    const f = pc.flags, age = C().ageAdj(pc);
    let when = null;
    if (pc.ruler && f.lfx_amb_r == null && !(LF.ambOf(pc) && ['expand', 'golden', 'web'].includes(pc.amb.k))) when = 'reign';
    else if (f.lfx_amb_y == null && age < 33) when = 'young';
    else if (f.lfx_amb_m == null && age >= 35 && age < 60) when = 'mid';
    // an ambition met: a year on, a new one fitting the life it made (at most every 8 years, to 70)
    else if (LF.ambOf(pc) && pc.amb.done && A.S.year - pc.amb.done >= 1 && age < 70 && (f.lfx_amb_t == null || A.S.year - f.lfx_amb_t >= 8)) when = 'top';
    if (!when || !A.EV['lfx_amb_' + when]) return;
    f['lfx_amb_' + when[0]] = A.S.year;
    if (when === 'mid' || when === 'reign') f.lfx_amb_y = f.lfx_amb_y == null ? A.S.year : f.lfx_amb_y;
    A.queue({ type: 'event', ev: 'lfx_amb_' + when, forced: true, ctx: { when } });
  };
  // fulfilled: the engine notices, says so, and writes a deed
  LF.ambCheck = function (pc) {
    const a = LF.ambOf(pc);
    if (LF.OFF || !a || a.done || !pc.alive) return;
    let ok = false; try { ok = !!LF.AMB[a.k].done(pc); } catch (e) { ok = false; }
    if (!ok) return;
    a.done = A.S.year;
    const name = LF.AMB[a.k].name;
    A.log(`You set out at ${A.age(pc) - (A.S.year - a.y)} to ${name.charAt(0).toLowerCase() + name.slice(1)}. In ${A.S.year} it is done.`, 'big');
    (pc.deeds = pc.deeds || []).push({ y: A.S.year, t: `Set out to ${name.charAt(0).toLowerCase() + name.slice(1)}, and did` });
    pc.happy = Math.min(100, (pc.happy || 0) + 10);
    if (A.willGrow) A.willGrow(pc, 2, 'ambition');
    if (A.fame) A.fame(pc, 3);
  };
  A.onMonth.push(pc => { try { LF.ambMonth(pc); LF.ambCheck(pc); } catch (e) { console.error('ambition', e); } });

  // ---- the Life tab: the ambition under What now (pure: reads the person, draws nothing) -------------------------
  UI.lfAmbCard = function (pc) {
    if (LF.OFF || !pc || !pc.alive || !A.isAdult(pc)) return '';
    const a = LF.ambOf(pc);
    if (!a) return pc.flags && pc.flags.lfx_amb_y != null
      ? `<section class="card lf-amb small" aria-label="Ambition"><span class="tag">Ambition</span> <span class="muted">None: you take life as it comes.${pc.flags.lfx_amb_m == null ? ' You will be asked again at 35.' : ''}</span></section>` : '';
    const D = LF.AMB[a.k];
    let step = '', prog = 0;
    try { step = a.done ? `Done in ${a.done}.` : D.step(pc); prog = a.done ? 1 : D.prog(pc); } catch (e) {}
    const pct = Math.round(100 * Math.max(0, Math.min(1, prog || 0)));
    return `<section class="card lf-amb" aria-label="Ambition"><div class="row"><span class="tag">Ambition</span><b class="grow">${UI.esc(D.name)}</b><span class="tiny muted">since ${a.y}</span></div>` +
      `<div class="small">${a.done ? '' : '<b>Next:</b> '}${UI.esc(step)}</div>` +
      `<div class="lf-amb-bar" role="progressbar" aria-label="How far along" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></section>`;
  };
  // ---- What now points at the second half of a life (pure: reads the person, draws nothing) ------------------------
  // The release's list ended at "Look for love" and "Let time run": nothing pointed at the Decisions tab, the orders, a
  // scheme or a house, so a man with 254,000 suns never saw them (cycle 1, lives I5).
  LF.whatMore = function (pc) {
    const out = [], add = (score, t, why, go, act) => out.push({ score, t, why, go, act, cls: '' });
    if (LF.OFF || !pc || !pc.alive || !A.isAdult(pc) || pc.prison) return out;
    // a great work or a big decision the purse can bear
    if (A.decisionsFor && A.decisionState) {
      let best = null;
      for (const d of A.decisionsFor(pc)) {
        if (!d || !/^lfx_|found_house|seat|manor/.test(d.k || '')) continue;
        if (!A.decisionState(pc, d).ok) continue;
        const c = d.k && /^lfx_/.test(d.k) && LF.workCost ? LF.workCost(pc, d.k.slice(4)) : 0;
        if (c && (pc.coin || 0) < 2 * c) continue;
        if (!best || c > best.c || d.k === 'found_house') best = { d, c };
        if (d.k === 'found_house') break;
      }
      if (best) add(best.d.k === 'found_house' ? 52 : 46, best.d.k === 'found_house' ? 'Found your house' : `You can afford it: ${best.d.name.toLowerCase()}`,
        best.d.k === 'found_house' ? 'You have the renown and the silver. Your children would be born into a house of your making.' : `${coin(pc.coin)} in hand. The Decisions tab has what a fortune is for.`, 'goals', ['tab', 'goals']);
    }
    // an order that would have you, or would if you were knighted
    if (pc.mil && !pc.mil.merc && !pc.order && GD.ORDERS && A.orderReqs) {
      for (const id in GD.ORDERS) {
        const o = GD.ORDERS[id];
        if (!o || o.realm !== pc.mil.realm) continue;
        const rs = A.orderReqs(pc, id), miss = rs.filter(x => !x.ok);
        if (!miss.length) { add(54, `Ask to join ${o.name}`, 'You meet every one of the order\'s terms.', 'war', ['tab', 'war']); break; }
        if (miss.length === 1 && /knighted|birth/i.test(miss[0].label)) { add(42, `${A.cap ? A.cap(o.name) : o.name} would have you, if you were knighted`, 'Renown and a captain\'s rank bring the crown\'s sword; a patent of nobility (Decisions) is the dear way.', 'war', ['tab', 'war']); break; }
      }
    }
    // someone you hate, within reach of a scheme
    if (pc.rel) {
      for (const id in pc.rel) {
        const r = pc.rel[id], o = A.P(id);
        if (!r || !o || !o.alive || !['enemy', 'rival'].includes(r.type) || o.realm !== pc.realm || !(r.op <= -50)) continue;
        add(40, `${o.given} is within reach`, 'An enemy close at hand: a scheme can ruin them (their card on the People tab).', 'people', ['tab', 'people']);
        break;
      }
    }
    // ---- the cycle 1 systems, one pointer each (cycle 2, lives F2: What now never named any of them) ----------------
    const D = LF.wnDay(pc);
    // an office you could seek (9996): no bar, at fair odds, not sought this year
    if (D.office) add(56, `Seek the office: ${D.office.name}`, `${Math.round(D.office.p * 100)}% by your own count. ${D.office.who}`, 'realm', ['tab', 'realm']);
    // a cargo that would fetch more down a long road (9995)
    if (D.venture) add(50, `Your ${D.venture.good} would fetch more in ${D.venture.dest}`, `About ${coin(D.venture.gain)} more than at home, after freight. The long roads are on your market's card.`, 'holdings', ['tab', 'holdings']);
    // never been out of the realm (9990)
    if (D.journey) add(38, 'See another realm', 'You have never left the realm you were born in. A journey there and back takes a season.', 'life', ['act', 'travel']);
    // no arms of your own (9992): once, from 18
    if (D.arms) add(36, 'Make your mark', 'Arms of your own: a field, a charge and words to live by. Others will know your seal.', 'life', ['idArms', '']);
    return out;
  };
  // the heavier pointers, worked out once a day for each person (a view's cache: it reads the world and writes nothing
  // in it)
  const wnCache = { k: null, v: null };
  LF.wnDay = function (pc) {
    const k = pc.id + ':' + A.absDay();
    if (wnCache.k === k) return wnCache.v;
    const v = {};
    try {
      const POL = A.POL;
      if (POL && POL.seekable && !pc.ruler) {
        const best = POL.seekable(pc).filter(x => !x.bar.length && !x.cool && x.p >= 0.4 && !(x.price > (pc.coin || 0))).sort((a, b) => b.p - a.p)[0];
        if (best) {
          const r = POL.myRealm(pc), place = (A.S.prov[best.o.at] || {}).name;
          v.office = { name: `${POL.offName(best.o.k, r && r.id)}${place ? ' of ' + place : ''}`, p: best.p, who: best.holder ? `${best.holder.given} holds it now.` : 'It stands empty.' };
        }
      }
    } catch (e) { v.office = null; }
    try {
      const TR = A.TRADE;
      if (TR && TR.vOptions && TR.on && TR.on()) {
        const o = TR.vOptions(pc, 1).sort((a, b) => b.gain - a.gain)[0], G = TR.goods ? TR.goods() : (GD.GOODS || {});
        if (o && o.gain >= 50) v.venture = { good: String(((G && G[o.k]) || {}).name || o.k).toLowerCase(), dest: A.realmShort ? (A.realmShort(o.b) || o.b) : o.b, gain: o.gain };
      }
    } catch (e) { v.venture = null; }
    try {
      const seen = A.realmsSeen ? A.realmsSeen(pc) : 0;
      v.journey = seen <= 1 && A.age(pc) >= 18 && A.age(pc) <= 45 && !pc.mil && !pc.ruler && !(pc.flags && pc.flags.unfree) && GD.ACTIVITIES.travel && A.canAct('travel')[0];
    } catch (e) { v.journey = false; }
    v.arms = !!(A.ID || A.IDENT || UI.A.idArms) && UI.A && typeof UI.A.idArms === 'function' && !pc.mark && A.age(pc) >= 18;
    wnCache.k = k; wnCache.v = v;
    return v;
  };
  // ---- the ruler's desk (cycle 2, design D4): a crown 520,000 in debt was told to look for love ----------------------
  LF.desk = function (pc) {
    const out = [], add = (score, t, why, go, act, cls) => out.push({ score, t, why, go, act, cls: cls || '' });
    const r = pc && pc.ruler && A.realm(pc.ruler);
    if (!r || LF.OFF) return out;
    const inc = Math.max(1, r.income || 0), debt = r.debt || 0;
    if (debt > 0 && (debt > inc / 2 || debt > (r.treasury || 0))) add(89, `The crown owes ${coin(debt)}`, `${Math.round(10 * debt / inc) / 10} years of the realm's income. The Realm tab has the ledger and the council's remedies.`, 'realm', ['tab', 'realm'], 'bad');
    try {
      const POL = A.POL, pol = r.pol;
      if (POL && pol && POL.canPropose && POL.canPropose(pc, r)) {
        if (pol.bill) add(68, 'A bill is before the council', `It comes to a count ${pol.bill.next > A.absDay() ? 'in ' + Math.max(1, Math.round((pol.bill.next - A.absDay()) / 7)) + ' weeks' : 'soon'}: speak for it or against it.`, 'realm', ['tab', 'realm']);
        else add(66, 'Bring a bill to the council', 'Nothing is before the council. The crown may set the next law on the table.', 'realm', ['tab', 'realm']);
      }
    } catch (e) {}
    return out;
  };
  const what0 = A.whatNow;
  if (typeof what0 === 'function') A.whatNow = function (pc) {
    const base = what0.apply(this, arguments);
    try {
      if (!Array.isArray(base)) return base;
      let list = base;
      // no "train in an extra session" once the skill trained is at the top (100)
      const P = pc && pc.plan, k = P && P.train;
      if (k && GD.SKILLS && GD.SKILLS[k] && A.skill(pc, k) >= 100) list = list.filter(x => x.t !== 'Train in an extra session');
      const more = LF.whatMore(pc).concat(LF.desk(pc));
      // a ruler with the crown's business pressing is not told to look for love or to train
      if (pc.ruler && more.some(x => x.score >= 58)) list = list.filter(x => !['Look for love', 'Train in an extra session'].includes(x.t));
      if (!more.length && list === base) return base;
      return list.concat(more).sort((x, y) => y.score - x.score).slice(0, Math.max(3, base.length));
    } catch (e) { return base; }
  };

  const wn = UI.whatNowCard;
  if (typeof wn === 'function') UI.whatNowCard = function (pc) { const h = wn.apply(this, arguments); try { return h + UI.lfAmbCard(pc); } catch (e) { return h; } };
  try {
    const st = document.createElement('style'); st.id = 'lf-amb-css';
    st.textContent = '.lf-amb{margin-top:8px}.lf-amb .tag{margin-right:6px}.lf-amb-bar{height:5px;border-radius:3px;background:rgba(127,127,127,.25);margin-top:6px;overflow:hidden}.lf-amb-bar i{display:block;height:100%;background:currentColor;opacity:.55}';
    document.head.appendChild(st);
  } catch (e) {}
})();
