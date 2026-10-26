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
  LF.AMB = {
    freedom: { name: 'Buy your freedom', t: 'Buy your freedom, whatever it costs',
      fit: p => (unfree(p) ? 10 : 0), done: p => !unfree(p),
      step: p => `Save ${coin(price(p))} for the price of your freedom; you have ${coin(p.coin)}.`, prog: p => ratio(p.coin, price(p)) },
    wealth: { name: 'Make a fortune', t: 'Make a fortune and never count coppers again',
      fit: p => (unfree(p) ? 0 : 3 + (p.status === 'merchant' ? 3 : 0) + (path(p) === 'guild' ? 2 : 0)), done: p => p.coin >= 5000,
      step: p => `Build a purse of ${coin(5000)}; you have ${coin(p.coin)}. Trade, a shop of your own, lending.`, prog: p => ratio(p.coin, 5000) },
    trade: { name: 'A master of your trade', t: 'Become a master of your trade',
      fit: p => (p.job && ['guild', 'common', 'sea', 'learning'].includes(path(p)) ? 5 : p.status === 'artisan' ? 4 : 0),
      done: p => { const J = job(p); return !!(J && p.job.r >= Math.min(3, J.ranks.length - 1)); },
      step: p => { const J = job(p); return J ? `Rise in ${J.name.toLowerCase()}: rank ${p.job.r + 1} of ${Math.min(4, J.ranks.length)}. Good work, and the guild's eye.` : 'Take up a trade (Path tab).'; },
      prog: p => { const J = job(p); return J ? ratio(p.job.r, Math.min(3, J.ranks.length - 1)) : 0; } },
    family: { name: 'A full house', t: 'A home, a spouse, and children at the table',
      fit: p => 3 + (C().married(p) ? 0 : 1), done: p => C().married(p) && kids(p) >= 3,
      step: p => (C().married(p) ? `Children at your table: ${kids(p)} of 3.` : 'Find someone to marry: court, a match, a festival.'),
      prog: p => (C().married(p) ? 0.25 : 0) + 0.75 * ratio(kids(p), 3) },
    renown: { name: 'A name people know', t: 'Be known by name in every market',
      fit: p => 2 + (p.fame >= 10 ? 2 : 0), done: p => (p.fame || 0) >= 60,
      step: p => `Renown ${Math.round(p.fame || 0)} of 60: tourneys, deeds done in public, the Seek renown plan.`, prog: p => ratio(p.fame || 0, 60) },
    faith: { name: 'Serve the gods', t: 'Give your life to the gods',
      fit: p => ((p.piety || 0) >= 40 || (p.job && p.job.c === 'clergy') ? 5 : (p.piety || 0) >= 25 ? 2 : 0),
      done: p => (p.piety || 0) >= 90 || !!(p.job && p.job.c === 'clergy' && p.job.r >= 2),
      step: p => `Piety ${Math.round(p.piety || 0)} of 90. Devotion, pilgrimage, or a priest's post.`, prog: p => ratio(p.piety || 0, 90) },
    scholar: { name: 'Master learning', t: 'Master the learning of the old books',
      fit: p => (p.literate || p.flags.literate ? 4 : 0) + (sk(p, 'learning') >= 15 ? 2 : 0), done: p => sk(p, 'learning') >= 60,
      step: p => `Learning ${Math.round(sk(p, 'learning'))} of 60: study, a teacher, the College.`, prog: p => ratio(sk(p, 'learning'), 60) },
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
    court: { name: 'A place at court', t: 'Sit at the council table',
      fit: p => (['noble', 'royal'].includes(p.status) || path(p) === 'court' ? 5 : A.classOf(p) >= 4 ? 2 : 0), done: p => !!p.office,
      step: () => 'A seat on the council: favour with the crown, a post at court, a vacancy.', prog: p => ratio(A.classOf(p), 6) },
    throne: { name: 'The throne itself', t: 'Sit on the throne itself',
      fit: p => (p.status === 'royal' && !p.ruler ? 6 : p.noble && p.noble.rung >= 4 && !p.ruler ? 2 : 0), done: p => !!p.ruler,
      step: () => 'Rule: by inheritance, a faction that wins, or a plot.', prog: p => ratio(A.classOf(p), 9) },
    expand: { name: 'Widen the realm', t: 'Leave the realm larger than you found it',
      fit: p => (p.ruler ? 5 : 0), done: p => !!(p.amb && p.amb.p0 != null && provs(p) >= p.amb.p0 + 3),
      step: p => `Provinces held: ${provs(p)}; ${p.amb && p.amb.p0 != null ? p.amb.p0 + 3 : provs(p) + 3} would do it.`,
      prog: p => (p.amb && p.amb.p0 != null ? ratio(provs(p) - p.amb.p0, 3) : 0) },
    golden: { name: 'A golden age', t: 'Give the realm a golden age',
      fit: p => (p.ruler ? 5 : 0), done: p => { const r = realm(p); return !!(r && r.stability >= 85 && r.treasury >= 20000); },
      step: p => { const r = realm(p); return r ? `Stability ${Math.round(r.stability)} of 85 and ${coin(r.treasury)} of ${coin(20000)} in the treasury.` : ''; },
      prog: p => { const r = realm(p); return r ? (ratio(r.stability, 85) + ratio(r.treasury, 20000)) / 2 : 0; } },
    web: { name: 'A web of alliances', t: 'Bind the crowns around you with alliances',
      fit: p => (p.ruler ? 4 : 0), done: p => allies(p) >= 3,
      step: p => `Allies: ${allies(p)} of 3. Marriages, summits, gifts.`, prog: p => ratio(allies(p), 3) },
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
    for (const x of all) { if (out.length >= 3) break; out.push(x.k); }
    return out;
  };
  LF.setAmb = function (p, k) {
    if (!p) return '';
    if (!k || !LF.AMB[k]) { delete p.amb; return ''; }
    p.amb = { k, y: A.S.year };
    if (k === 'expand') p.amb.p0 = provs(p);
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
    A.log(`You have done what you set out to do at ${A.age(pc) - (A.S.year - a.y)}: ${name.toLowerCase()}. It does not feel the way you thought it would. It feels better.`, 'big');
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
      ? '<section class="card lf-amb small" aria-label="Ambition"><span class="tag">Ambition</span> <span class="muted">None: you take life as it comes. You will be asked again at 35.</span></section>' : '';
    const D = LF.AMB[a.k];
    let step = '', prog = 0;
    try { step = a.done ? `Done in ${a.done}.` : D.step(pc); prog = a.done ? 1 : D.prog(pc); } catch (e) {}
    const pct = Math.round(100 * Math.max(0, Math.min(1, prog || 0)));
    return `<section class="card lf-amb" aria-label="Ambition"><div class="row"><span class="tag">Ambition</span><b class="grow">${UI.esc(D.name)}</b><span class="tiny muted">since ${a.y}</span></div>` +
      `<div class="small">${a.done ? '' : '<b>Next:</b> '}${UI.esc(step)}</div>` +
      `<div class="lf-amb-bar" role="progressbar" aria-label="How far along" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div></section>`;
  };
  const wn = UI.whatNowCard;
  if (typeof wn === 'function') UI.whatNowCard = function (pc) { const h = wn.apply(this, arguments); try { return h + UI.lfAmbCard(pc); } catch (e) { return h; } };
  try {
    const st = document.createElement('style'); st.id = 'lf-amb-css';
    st.textContent = '.lf-amb{margin-top:8px}.lf-amb .tag{margin-right:6px}.lf-amb-bar{height:5px;border-radius:3px;background:rgba(127,127,127,.25);margin-top:6px;overflow:hidden}.lf-amb-bar i{display:block;height:100%;background:currentColor;opacity:.55}';
    document.head.appendChild(st);
  } catch (e) {}
})();
