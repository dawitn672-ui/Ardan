// W1-3: what the player sees and decides, by rank (docs/design/war.md §9.3, §12; D-081). No war screens unless he is in
// the war: a lord is summoned (cm_summons, six answers) and judged if he refuses (cm_sentence); a man serving in a great
// house's command answers to its lord; the news of the muster is what his place would let him hear.
(function () {
  const CM = A.CMD;
  if (!CM || !CM.on) return;
  const live = p => !!(p && p.alive);
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  const W = () => A.WHY;
  (A.FX_EXTRA = A.FX_EXTRA || []).push('cmAnswer', 'cmSubmit');

  // ---------------------------------------------------------------- the player's place
  // what the player may know of a realm's muster: 'crown' (ruler, councillor), 'lord' (a landed lord of it), 'camp' (a
  // soldier of its host), 'town' (anyone else of the realm), or null (another realm's business)
  CM.place = function (rid) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive) return null;
    if (W() && W().knows(rid)) return 'crown';
    if (pc.noble && (pc.noble.realm || pc.realm) === rid) return 'lord';
    if (pc.mil && !pc.mil.merc && pc.mil.realm === rid) return 'camp';
    return pc.realm === rid ? 'town' : null;
  };
  // the player reads a lord's true reason when he rules with a spymaster worth the name, or knows the man himself
  CM.seesTruth = function (rid, e) {
    const pc = A.pc && A.pc();
    if (!pc || !e || e.p == null) return false;
    if (e.p === pc.id) return true;
    if (pc.rel && pc.rel[e.p]) return true;
    const r = A.realm(rid);
    return !!(r && pc.ruler === rid && A.councilSkill && A.councilSkill(r, 'spymaster') >= 50);
  };
  // the house command the player's host is in, and its lord
  CM.myHouse = function (pc) {
    pc = pc || A.pc();
    const d = pc && pc.mil && !pc.mil.merc && pc.mil.div ? A.divById(pc.mil.div) : null;
    return d ? CM.houseOf(d) : null;
  };
  // a General's superior: the lord whose command his host is in (sworn to him), else the crown (W1-1)
  CM.chiefOf = function (pc) {
    const h = CM.myHouse(pc), p = h && h.headPid != null ? A.P(h.headPid) : null;
    return live(p) && p.id !== pc.id ? p : null;
  };
  // the words for the force an officer serves in: a house's command, or the realm's
  CM.occOf = function (pc) {
    const h = CM.myHouse(pc);
    return h ? ` of ${h.name}'s host` : ` of ${A.realmShort(pc.mil.realm)}`;
  };
  // the realm whose war a lord rides in: he answered in full or with part (or came late and is there), he has not gone
  // home, and the war has not ended (m.end; never S.wars, which a view may have narrowed)
  CM.ridesWith = function (pc) {
    if (!pc || !pc.alive || pc.ruler) return null;
    for (const m of CM.musters()) {
      if (m.end) continue;
      const e = m.e.find(x => x.p === pc.id);
      if (e && !e.gone && (e.a === 'full' || e.a === 'part' || (e.a === 'late' && e.came))) return m.r;
    }
    return null;
  };
  // was the player summoned for this war (the release's yearly summons then waits)
  CM.summonedPc = function (pc, w) {
    if (!pc || !w) return false;
    return CM.musters().some(m => m.w === w.id && m.e.some(e => e.p === pc.id));
  };

  // ---------------------------------------------------------------- the summons, as a card
  const lordName = (e, h) => { const p = e.p != null ? A.P(e.p) : null; return p ? A.fullName(p, false) : h ? h.name : 'a lord'; };
  CM.pcSummons = function (w) {
    const pc = A.pc(), POL = A.POL;
    if (!pc || !pc.alive || pc.ruler || !pc.noble || pc.mil || pc.company || !A.isAdult(pc) || !POL || !POL.pcOath) return null;
    const o = POL.pcOath(pc);
    if (!o || !o.men || o.men < 1 || !(w.att.includes(o.r.id) || w.def.includes(o.r.id))) return null;
    const m = CM.musterOf(w.id, o.r.id);
    if (!m) return null;   // the realm was already in the field: his men are out with the host
    let e = m.e.find(x => x.p === pc.id);
    if (!e) { e = { h: o.h ? o.h.id : null, p: pc.id, a: 'ask', m: 0, n: o.men, g: '', t: '', tp: 0, d: CM.now(), s: 0, why: [] }; m.e.push(e); }
    e.pc = 1;
    if (A.S.queue.some(q => q.ev === 'cm_summons')) return e;
    // after the first, a summons within the quiet (the polity's six years, doubling with each card: 97's A.lfSpaced) is
    // answered as the last one was, if that was the men, a deputy or the shield money, with a line in the log; a lord
    // who refused, came late or held men back is asked again (the polity's rule, lfRepeats)
    const last = pc.cmLast, scutN0 = Math.round(o.men * CM.T.scutPerMan);
    if ((last === 'full' || last === 'deputy' || (last === 'coin' && pc.coin >= scutN0)) && A.lfSpaced && !A.lfSpaced(pc, 'cm_summons', POL.MUSTER_QUIET || 6)) {
      const ctx0 = { rid: o.r.id, wid: w.id, menN: o.men, scutN: scutN0, quiet: 1 };
      CM.pcAnswer(pc, last, ctx0, () => {});
      if (last === 'full') { pc.fame = (pc.fame || 0) + 1; pc.honor = clamp((pc.honor || 50) + 1, 0, 100); }
      A.log(last === 'coin' ? `${o.r.short} is at war. You pay the shield money, ${A.coin(scutN0)}, as last time, and the men stay at home.` : `${o.r.short} is at war, and your ${A.fmt(o.men)} men go to the muster under your colours, as last time.`, '');
      return e;
    }
    const side = A.warSide(w, o.r.id), foe = (side === 'att' ? w.def : w.att)[0];
    const son = Object.keys(pc.rel || {}).map(id => A.P(id)).find(p => live(p) && pc.rel[p.id] && pc.rel[p.id].type === 'child' && A.isAdult(p));
    const scutN = Math.round(o.men * CM.T.scutPerMan);
    A.queue({ type: 'event', ev: 'cm_summons', ctx: {
      pid: o.r.ruler, rid: o.r.id, wid: w.id, men: A.fmt(o.men), menN: o.men, scut: A.coin(scutN), scutN,
      realmT: o.r.short, enemyT: short(foe), depT: son ? A.fullName(son, false).split(' ')[0] : 'your captain', depPid: son ? son.id : null,
      homeLine: POL.pcHouse && POL.pcHouse(pc) ? 'Your steward counts the harvest and looks at you.' : 'You have no harvest to count, only the men who follow you.',
    } });
    return e;
  };
  // the player's own answer, from the card
  const PC_GIVEN = { part: 'your border must be held', late: 'the harvest', deputy: 'your affairs at home', coin: 'coin serves the crown as well as men', refuse: '' };
  CM.pcAnswer = function (pc, a, ctx, say) {
    const m = CM.musterOf(ctx.wid, ctx.rid), r = A.realm(ctx.rid), w = (A.S.wars || []).find(x => x.id === ctx.wid);
    if (!m || !r) return;
    let e = m.e.find(x => x.p === pc.id);
    if (!e) { e = { h: null, p: pc.id, a: 'ask', m: 0, n: ctx.menN || 0, d: CM.now(), s: 0, why: [] }; m.e.push(e); }
    e.a = a; e.g = PC_GIVEN[a] || ''; e.t = 'your own choice'; e.tp = 0; e.d = CM.now(); e.pc = 1;
    const h = e.h && A.S.houses[e.h] && CM.isTic(A.S.houses[e.h], r.id) ? A.S.houses[e.h] : null;
    const ru = r.ruler != null ? A.P(r.ruler) : null;
    if (h && w) CM.apply(e, h, r, w, CM.divs(CM.house(h)));
    else if (a === 'late') e.arr = CM.now() + 45;
    const kOp = d => { if (live(ru) && ru.rel[pc.id]) ru.rel[pc.id].op = clamp(ru.rel[pc.id].op + d, -100, 100); };
    const men = ctx.menN || 0, foe = w ? (A.warSide(w, r.id) === 'att' ? w.def : w.att)[0] : null;
    // a lord who rides with his men meets the enemy (the release's muster battle); an answer given as last time does not stop
    const battle = n => { if (!ctx.quiet && w && foe && A.CHOICE_FN && A.CHOICE_FN.summonsBattle && n > 0) A.CHOICE_FN.summonsBattle({ war: w.id, enemy: foe, men: Math.max(40, Math.round(n)) }); };
    if (a === 'full') { kOp(4); battle(men); }
    if (a === 'part') {
      battle(men / 2);
      const P = A.prov(pc.home), threat = P && [P.id].concat(P.adj || []).some(j => { const q = A.S.prov[j]; return q && q.owner && q.owner !== r.id && A.relBetween(r.id, q.owner) < -40; });
      if (!threat) { kOp(-6); say('(the crown does not believe the excuse)'); } else say('(the crown accepts it: your border is truly threatened)');
    }
    if (a === 'late') kOp(-4);
    if (a === 'deputy') { kOp(-1); if (ctx.depPid && A.P(ctx.depPid)) { const s = A.P(ctx.depPid); if (pc.rel[s.id]) pc.rel[s.id].op = clamp(pc.rel[s.id].op + 3, -100, 100); } }
    if (a === 'coin') {
      const n = ctx.scutN || 0, paid = Math.min(pc.coin, n);
      pc.coin -= paid; r.treasury = (r.treasury || 0) + paid; e.c = paid;
      if (A.RI && A.RI.purse) A.RI.purse(pc, 'taxes', -paid, 'Shield money instead of your men');
    }
    if (a === 'refuse') {
      kOp(-15);
      pc.cmRef = (Array.isArray(pc.cmRef) ? pc.cmRef : []).concat([A.S.year]).slice(-4);
      if (live(ru)) W().feel(ru, 'anger', { t: 'refusal', y: A.S.year, at: pc.id, label: `${A.fullName(pc, false)} refused his summons`, pub: 1 }, .6);
      CM.pcJudge(pc, m, e);
    }
    pc.cmLast = a;
    if (A.POL && A.POL.pcPol) pc.poMusterLast = a === 'full' || a === 'part' || a === 'deputy' ? 'send' : a === 'coin' ? 'scutage' : a === 'refuse' ? 'refuse' : 'late';
  };
  // the crown's judgment on the player's refusal (the same ladder as a great lord's): decided now, told on a card
  const pseudo = pc => {
    const R = GD.NOBLE_RUNGS[clamp(pc.noble ? pc.noble.rung || 0 : 0, 0, GD.NOBLE_RUNGS.length - 1)] || {};
    const r = A.realm(pc.noble ? pc.noble.realm : pc.realm), ru = r && A.P(r.ruler);
    return { id: 'pc:' + pc.id, name: A.fullName(pc, false), realm: r ? r.id : null, rung: R.code, op: 50 + (live(ru) ? A.opinion(pc, ru) / 2 : 0), cmRef: pc.cmRef, contract: (A.POL && A.POL.pcOath && (A.POL.pcOath(pc) || {}).c) || {} };
  };
  CM.pcJudge = function (pc, m, e) {
    const r = A.realm(m ? m.r : (pc.noble ? pc.noble.realm : pc.realm));
    if (!r) return null;
    if (!m) { m = { w: (A.atWar(r.id)[0] || {}).id, r: r.id, y: A.S.year, d: CM.now(), side: null, e: [] }; }
    e = e || { h: null, p: pc.id, a: 'refuse', m: 0, n: 0, d: CM.now() };
    const h = e.h && A.S.houses[e.h] ? A.S.houses[e.h] : pseudo(pc);
    e.sen = null;
    const rec = CM.sentence(m, e, { pc: true, h });
    if (!rec) return null;
    const sen = e.sen, unf = e.unf;
    // what the sentence does to the player
    if (!unf) {
      if (sen === 'fine') { const f = Math.min(pc.coin, Math.round((e.n || 100) * CM.T.scutPerMan * 1.5)); pc.coin -= f; r.treasury = (r.treasury || 0) + f; e.fine = f; }
      if (sen === 'hostages') pc.flags.cm_hostage = A.S.year;
      if (sen === 'strip' && pc.noble) pc.noble.rung = Math.max(0, pc.noble.rung - 1);
      if (sen === 'forsworn') { pc.honor = clamp((pc.honor || 50) - 10, 0, 100); pc.flags.cm_forsworn = A.S.year; }
      if (sen === 'attaint' && pc.noble) { pc.noble.rung = Math.max(0, pc.noble.rung - 2); pc.flags.cm_attaint = A.S.year; }
    }
    if (sen !== 'accept' && A.EV.cm_sentence && !A.S.queue.some(q => q.ev === 'cm_sentence'))
      A.queue({ type: 'event', ev: 'cm_sentence', ctx: { pid: r.ruler, rid: r.id, wid: m.w, sentT: (unf ? 'tried to ' : '') + CM.SENT_WORDS[sen].replace(/\bhim\b/g, 'you').replace(/\bhis\b/g, 'your'), whyT: unf ? 'The crown has not the strength to enforce it, and every lord knows it.' : 'The sentence is read out in the hall.' } });
    else if (sen === 'accept') A.log('The crown lets your refusal pass, this time. The clerks write it down all the same.', 'warn');
    return rec;
  };

  // the player's answer to a sentence
  CM.pcSubmit = function (pc, k, ctx, say) {
    const r = A.realm(ctx.rid), ru = r && A.P(r.ruler);
    const kOp = d => { if (live(ru) && ru.rel[pc.id]) ru.rel[pc.id].op = clamp(ru.rel[pc.id].op + d, -100, 100); };
    if (k === 'submit') kOp(5);
    if (k === 'sulk') kOp(-4);
    if (k === 'league') {
      kOp(-8);
      pc.flags.cm_league = A.S.year;
      const others = CM.musters().filter(m => m.r === ctx.rid && m.w === ctx.wid).flatMap(m => m.e).filter(e => e.a === 'refuse' && e.p !== pc.id && e.p != null && live(A.P(e.p)));
      if (others.length) { const o = A.P(others[0].p); if (!pc.rel[o.id]) A.link(pc, o, 'acquaint', 25, 'acquaint'); say(`(${A.fullName(o, false)} writes back)`); }
      else say('(no one answers your letters)');
    }
  };

  A.addStage('A.applyFx', 'commands', baseFx => function (pc, fx, ctx) {
    const out = baseFx.apply(this, arguments);
    try {
      if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc || !ctx) return out;
      const say = s => { if (Array.isArray(out) && s) out.push(s); };
      if (fx.cmAnswer) CM.pcAnswer(pc, fx.cmAnswer, ctx, say);
      if (fx.cmSubmit) CM.pcSubmit(pc, fx.cmSubmit, ctx, say);
    } catch (e) { console.error('[commands] fx', e); }
    return out;
  });

  // ---------------------------------------------------------------- the news, by rank
  const counts = m => { const c = {}; for (const e of m.e) c[e.a] = (c[e.a] || 0) + 1; return c; };
  const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
  CM.summary = function (m) {
    const c = counts(m), n = m.e.length, bits = [];
    if (c.full) bits.push(`${c.full} came in full`);
    if (c.part) bits.push(`${c.part} with part of their men`);
    if (c.late) bits.push(`${c.late} late`);
    if (c.deputy) bits.push(`${c.deputy} by a deputy`);
    if (c.coin) bits.push(`${c.coin} with coin`);
    if (c.refuse) bits.push(`${c.refuse} not at all`);
    return n ? `Of ${plural(n, 'great lord', 'great lords')} summoned, ${bits.join(', ')}.` : '';
  };
  CM.lineFor = function (m, e, truth) {
    const h = A.S.houses[e.h], who = lordName(e, h);
    const said = e.g ? `, saying ${e.g}` : '';
    // (every label of the reasons begins with a common word, never a name: lowered for the middle of a sentence)
    const real = truth && e.t && e.a !== 'full' ? `; in truth: ${e.t.charAt(0).toLowerCase() + e.t.slice(1)}` : '';
    return `${who} ${CM.WORDS[e.a] || e.a}${said}${real}.`;
  };
  CM.tellMuster = function (m) {
    const pc = A.pc && A.pc(), place = CM.place(m.r);
    if (!pc || !place || !m.e.length) return;
    const w = (A.S.wars || []).find(x => x.id === m.w), wn = w ? w.name : 'the war';
    const notFull = m.e.filter(e => e.a !== 'full' && e.a !== 'ask' && e.p !== pc.id);
    if (place === 'crown') {
      const lines = notFull.slice(0, 4).map(e => CM.lineFor(m, e, CM.seesTruth(m.r, e)));
      A.log(`The muster for ${wn}. ${CM.summary(m)} ${lines.join(' ')}`.trim(), 'war');
    } else if (place === 'lord') {
      const lines = notFull.filter(e => e.a === 'refuse' || e.a === 'coin').slice(0, 3).map(e => CM.lineFor(m, e, CM.seesTruth(m.r, e)));
      A.log(`The muster for ${wn}. ${CM.summary(m)} ${lines.join(' ')}`.trim(), 'war');
    } else if (place === 'camp') {
      const h = CM.myHouse(pc), mine = h ? m.e.find(e => e.h === h.id) : null;
      const c = counts(m);
      A.log((mine ? `Your lord, ${lordName(mine, h)}, ${CM.WORDS[mine.a] || mine.a}. ` : '') + (c.refuse ? `In camp they count the banners: ${plural(c.refuse, 'great lord', 'great lords')} did not come.` : 'In camp they count the banners: the great lords have come.'), 'war');
    } else if (place === 'town') {
      const c = counts(m);
      if (c.refuse) A.log(`Talk in the market: ${plural(c.refuse, 'great lord', 'great lords')} would not answer the king's summons for ${wn}.`, '');
    }
  };
  CM.tellLine = function (m, text, h) {
    const pc = A.pc && A.pc(), place = CM.place(m.r);
    if (!pc || !place || place === 'town') return;
    if (place === 'camp') { const mh = CM.myHouse(pc); if (!mh || !h || mh.id !== h.id) return; }
    A.log(text, 'war');
  };

  // ---------------------------------------------------------------- the muster page (the War tab)
  const esc = s => (UI.esc ? UI.esc(String(s == null ? '' : s)) : String(s));
  UI.musterCard = function (pc) {
    if (!pc || !pc.alive) return '';
    const rid = pc.ruler || (pc.mil && !pc.mil.merc ? pc.mil.realm : pc.noble ? pc.noble.realm || pc.realm : null);
    if (!rid) return '';
    const place = CM.place(rid);
    if (!place || place === 'town') return '';
    // the newest muster of a war not yet ended (m.end: the wars a view sees may be narrowed to the player's own)
    const m = CM.musters().find(x => x.r === rid && !x.end);
    if (!m) return '';
    let h = `<div class="card cm-muster"><div class="row">${UI.icon ? UI.icon('flag', 's') : ''}<span class="tag">The muster roll</span><span class="tiny muted grow">${esc(m.name || '')}</span></div>`;
    // (the counts open a note on a tap, as every number on the War tab does: ttCov2War)
    h += `<p class="small" data-note="How the great lords answered the crown's summons: in full, with part of their men, late, by a deputy, with shield money, or not at all.">${esc(CM.summary(m))}</p>`;
    const rows = place === 'camp' ? m.e.filter(e => { const mh = CM.myHouse(pc); return mh && e.h === mh.id; }) : m.e;
    if (rows.length) {
      h += '<div class="cm-roll">';
      for (const e of rows.slice(0, 24)) {
        const hh = A.S.houses[e.h], who = e.p === pc.id ? 'You' : lordName(e, hh);
        const truth = CM.seesTruth(m.r, e) && e.t && e.a !== 'full';
        const note = [e.g ? `He says: ${e.g}.` : '', truth ? `The truth: ${e.t}.` : '', e.sen ? `The crown ${CM.SENT_WORDS[e.sen]}${e.unf ? ', and could not enforce it' : ''}.` : '', e.bf ? 'He raised his men for his border, unsummoned.' : '', e.gone ? 'He took his men home when the crown would not pay.' : '', e.pay ? 'The crown pays his men now.' : ''].filter(Boolean).join(' ');
        h += `<div class="cm-row"><b>${esc(who)}</b> <span class="chip${e.a === 'refuse' ? ' red' : e.a === 'full' ? ' gold' : ''}">${esc(CM.WORDS[e.a] || e.a)}</span>${e.m ? ` <span class="tiny muted" data-note="The men of his hosts on the war map: what his answer sends, or keeps at home.">${A.fmt(e.m)} men</span>` : ''}${note ? ` <span class="tiny ink2" data-note="${esc(note)}">why</span>` : ''}</div>`;
      }
      h += '</div>';
    }
    if (place !== 'town') {
      const arms = (A.armiesOf ? A.armiesOf(rid) : []).filter(a => A.HOSTS && A.HOSTS.armyHosts(a).length >= 2);
      for (const a of arms.slice(0, 4)) {
        const words = A.HOSTS.commandWords(a);
        h += `<div class="tiny cm-cmd">${esc(a.name)}: led by ${esc(words)}${a.cmdWhy && place === 'crown' ? ` <span class="ink2" data-note="${esc(a.cmdWhy)}">why</span>` : ''}</div>`;
      }
    }
    return h + '</div>';
  };
})();
