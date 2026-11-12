// Casus belli (Road to Ten, Diplomacy 6 "grudges and debts that last generations", with Diplomacy 1 and 5).
//
// 55-bonds keeps a feud ledger per realm (r.feud[other]) that outlives rulers and weighs on A.relBetween, but a
// revenge war stayed rare: the wronged realm is usually the weaker one, and A.aiWarCheck wants an edge in strength.
// 47-realm-bible gives each realm a want, which no AI decision read. This feature makes both start wars, patiently:
//
//   1. A plan (r.csPlan). Once a year every AI crown looks at its neighbours for a grudge from the ledger (weighed by
//      its ruler's vengefulness: wrath, pride, war, against warmth) or for the realm its want is aimed at (weighed by
//      appetite: war, greed, pride). The strongest above a bar becomes its plan. Nothing is drawn: the plan follows
//      from the ledger, the want and the ruler, so a new ruler can take it up or let it drop.
//   2. Building up. While it plans, the crown keeps more gold in reserve (56-realm-inside's RI.reserveYears, +0.7
//      years), looks for allies among its target's enemies, and holds back from other wars (x0.5).
//   3. Striking when the odds are good (patch CB-WAR-ODDS, three hooks in A.aiWarCheck): the plan's target counts at
//      60% of its strength while its host is away at another war (A.cbPreview), the odds rise with the plan's weight
//      (up to x9) when the target is at war, exhausted, tottering or outmatched, and fall to half otherwise; a want
//      presses on the opinion bar the way a claim does (A.cbPress). The day it declares, the saved gold hires
//      sellswords. A crown with no plan still turns first on a neighbour it remembers a wrong from, or wants
//      something of (x1 to x4 by its temper, CS.remembered).
//   4. A casus belli for every war (w.casus): the reasons in words, each with its kind (feud, relmem, want, debt,
//      claim, cause, trait, chance), led by the weightiest. It goes into the news, 20-ai-personality's log entry, the
//      war room (patch CB-WAR-ROOM), the diplomacy card and the Realm tab.
//   5. Debts (debts.core.js) and trait consistency (temper.core.js) are in their own files.
//
// Determinism: the plan, the factors and the casus belli draw nothing. Only the allies sought (A.chance, once a year
// for a planning crown) and the existing dice draw. State: r.csPlan, w.casus, r.csHist (all optional for old saves).
(function () {
  const BD = A.BONDS, FE = BD && BD.FEUD;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const clean = s => String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 260);
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  // "Velgrad's", "the Nine Winds'"
  const poss = s => (/s$/.test(s) ? s + "'" : s + "'s");
  const persona = rid => (A.rulerPersona ? A.rulerPersona(rid) : { warLog: 0, wrath: 0, pride: 0, warmth: 0, greed: 0, honor: 0, patience: 0, caution: 0, parts: {}, traits: [] });
  const feudOn = () => !!(FE && FE.ON !== false);

  const CS = A.CASUS = A.CASUS || {};
  CS.ON = true;
  CS.T = Object.assign({
    planBar: .45,      // a plan forms when its weight passes this
    grudgeMin: 8,      // the ledger must hold at least this much against a neighbour
    saveYears: .7,     // extra years of income kept in reserve while planning
    away: .6,          // a target fighting another war counts at this share of its strength
    strike: 5,         // odds factor per unit of plan weight when the moment is good
    wait: .5,          // odds factor against the plan's target when it is not
    elsewhere: .5,     // odds factor against any other neighbour while a plan stands
    remember: 1.5,     // odds factor per unit of temper on a neighbour remembered or wanted, with no plan
    temper: .75,       // a plan needs a ruler who carries grudges (vengeance) or wants land (appetite) at least this much
    press: 15,         // a want presses on the opinion bar like a claim (12 a province in the release)
    allyP: .3,         // a planning crown looks for a friend against its target with these odds a year
  }, CS.T || {});
  CS.resetStats = () => { for (const k in CS.stats) CS.stats[k] = 0; };
  CS.stats = { plans: 0, planYears: 0, struck: 0, wars: 0, cited: 0, debtJoin: 0, debtGold: 0, debtStay: 0, relief: 0, grain: 0, windfall: 0, allies: 0 };

  // ---------------------------------------------------------------- wants (47-realm-bible), aimed at a realm
  // Seven of the 34 wants name a neighbour to take something from. The rest want to keep, sell or survive: those
  // do not start wars. The words are the bible's own, shortened.
  CS.WANT = {
    'POL-01': { t: ['POL-11'], s: 'to push the Horde back over the Gordush and plough the steppe edge' },
    'POL-11': { t: ['POL-12'], s: 'to take the grass back to the Salt Shore from the Nine Winds' },
    'POL-14': { t: ['POL-25'], s: 'to take the other half of the Grey Channel tolls from Velgrad' },
    'POL-25': { t: ['POL-14'], s: 'to take the whole Grey Channel toll from Greyhaven' },
    'POL-17': { t: ['POL-24'], s: "to bring Sabra's pearl coast back under the Sultan" },
    'POL-20': { t: ['POL-22'], s: "to push the Road Promise through Abara's claim" },
    'POL-28': { t: ['POL-30'], s: 'to take back the Nagora Pass from Ranpur' },
  };
  CS.wantOf = (a, b) => { const W = CS.WANT[a]; return W && W.t.includes(b) ? W : null; };

  // ---------------------------------------------------------------- tempers
  // how hard a ruler carries a grudge, and how hungry a ruler is for what the realm wants (0.15 .. 4)
  CS.vengeance = rid => { const P = persona(rid); return clamp(Math.exp(1.1 * P.wrath + .5 * P.pride + .5 * P.warLog - .7 * P.warmth), .15, 4); };
  CS.appetite = rid => { const P = persona(rid); return clamp(Math.exp(.9 * P.warLog + .6 * P.greed + .4 * P.pride - .3 * P.warmth), .15, 4); };
  // the traits behind a temper, as log reasons [label, weight, 1] (the 1 marks the ruler's own temper for the log's lean)
  const AX = { v: [['wrath', 1.1], ['pride', .5], ['war', .5], ['warmth', -.7]], w: [['war', .9], ['greed', .6], ['pride', .4], ['warmth', -.3]] };
  CS.temperWhy = function (rid, kind, k, tail) {
    const P = persona(rid), out = [];
    for (const [ax, c] of AX[kind] || []) for (const [t, w] of (P.parts && P.parts[ax]) || []) out.push([`${cap(t)} ruler${tail ? ': ' + tail : ''}`, r2(w * c * k), 1]);
    return out;
  };

  // ---------------------------------------------------------------- the plan
  const grudge = (a, b) => (feudOn() ? -FE.sum(a, b) : 0);
  CS.weigh = function (a, b) {
    const ra = A.realm(a), rb = A.realm(b);
    if (!ra || !rb || !rb.alive || rb.isRebel || a === b) return null;
    let best = null;
    const G = grudge(a, b);
    const V = CS.vengeance(a), Ap = CS.appetite(a);
    if (G >= CS.T.grudgeMin && V >= CS.T.temper) { const s = r2(G / 35 * V); best = { k: 'feud', s, G }; }
    const W = CS.wantOf(a, b);
    if (W && Ap >= CS.T.temper) { const s = r2(.6 * Ap); if (!best || s > best.s) best = { k: 'want', s }; }
    return best;
  };
  CS.planYear = function () {
    const S = A.S, pc = A.pc();
    for (const id of Object.keys(S.realms || {})) {
      const r = S.realms[id];
      if (!r.alive || r.isRebel) { if (r.csPlan) delete r.csPlan; continue; }
      if (r.playerRun || (pc && pc.ruler === id)) { if (r.csPlan) delete r.csPlan; continue; }
      let best = null;
      for (const o of A.neighbors(id)) {
        const x = CS.weigh(id, o);
        if (!x || x.s < CS.T.planBar) continue;
        const ro = A.realm(o);
        if (r.overlord === o || ro.overlord === id || (r.allies || []).includes(o)) continue;
        if (!best || x.s > best.s) best = Object.assign({ t: o }, x);
      }
      const old = r.csPlan;
      if (!best) { if (old) { delete r.csPlan; } continue; }
      if (old && old.t === best.t && old.k === best.k) { old.s = best.s; old.n = (old.n || 0) + 1; }
      else {
        r.csPlan = { t: best.t, k: best.k, s: best.s, y: S.year, by: r.ruler || null, n: 1 };
        CS.stats.plans++;
      }
      CS.stats.planYears++;
      if (CS.ON) CS.seekAlly(r, r.csPlan);
    }
  };
  // a friend against the target: a realm that hates it, or holds its own grudge, and would have us
  CS.seekAlly = function (r, plan) {
    if (!plan || A.atWar(r.id).length || (r.allies || []).length >= 3 || !A.chance(CS.T.allyP)) return false;
    const t = plan.t;
    let best = null, bv = 0;
    for (const id of Object.keys(A.S.realms)) {
      const o = A.S.realms[id];
      if (!o.alive || o.isRebel || o.playerRun || id === r.id || id === t || (r.allies || []).includes(id) || A.hostile(r.id, id)) continue;
      if (o.overlord === t || (o.allies || []).includes(t)) continue;
      const hate = -A.relBetween(id, t) + (feudOn() && FE.sum(id, t) <= -CS.T.grudgeMin ? 20 : 0) + ((o.rivals || []).includes(t) ? 20 : 0);
      if (hate < 30) continue;
      const iv = Math.min(A.interest(r.id, id), A.interest(id, r.id));
      if (iv < 10) continue;
      const v = hate + iv;
      if (v > bv) { bv = v; best = id; }
    }
    if (!best) return false;
    const ok = A.sign('ally', r.id, best);
    if (ok) {
      CS.stats.allies++;
      A.aiLogAdd && A.aiLogAdd('ally', r.id, best, `swears an alliance with ${short(best)}, a friend against ${short(t)}.`,
        [[`A friend against ${short(t)} (their opinion of ${short(t)} ${A.relBetween(best, t)})`, .8]].concat(CS.temperWhy(r.id, plan.k === 'feud' ? 'v' : 'w', .3, `means to settle with ${short(t)}`)));
    }
    return ok;
  };
  const planOn = (a, b) => { const r = A.realm(a); return CS.ON && r && r.csPlan && r.csPlan.t === b ? r.csPlan : null; };
  // the target is busy: at war with someone else, worn out, or tottering
  CS.moment = function (a, b, P) {
    const rb = A.realm(b); if (!rb) return null;
    const other = A.atWar(b).find(w => !w.att.includes(a) && !w.def.includes(a));
    // (said so that a name like "the Nine Winds" needs no verb to agree with it)
    if (other) return { k: 'away', t: `the host of ${short(b)} is away, at war with ${short(other.leadA === b || other.att.includes(b) ? other.leadD : other.leadA)}` };
    if ((rb.exhaustion || 0) >= 45) return { k: 'worn', t: `the war has worn ${short(b)} thin (weariness ${Math.round(rb.exhaustion)})` };
    if ((rb.stability || 50) < 30) return { k: 'weak', t: `there is turmoil in ${short(b)} (stability ${Math.round(rb.stability)})` };
    if (P && P.ratio >= 1.15) return { k: 'strong', t: `${P.ratio.toFixed(1)} times their strength, with friends counted` };
    return null;
  };

  // patch CB-WAR-ODDS: the three hooks inside A.aiWarCheck
  A.cbPreview = function (a, b) {
    const P = A.warPreview(a, b);
    try {
      if (!P || !planOn(a, b)) return P;
      const other = A.atWar(b).find(w => !w.att.includes(a) && !w.def.includes(a));
      if (other) { P.powD = Math.round(P.powD * CS.T.away); P.ratio = P.powA / Math.max(1, P.powD); P.csAway = 1; }
    } catch (e) {}
    return P;
  };
  A.cbPress = function (a, b) {
    const pl = planOn(a, b);
    return pl && pl.k === 'want' ? Math.round(CS.T.press * Math.min(1.5, pl.s / .6)) : 0;
  };
  CS.mul = function (a, b, P) {
    if (!CS.ON) return 1;
    const debt = CS.owes ? CS.owes(a, b) : 0;
    if (debt) return 0;                                   // debts.core.js: an honourable crown will not attack its benefactor
    const r = A.realm(a), pl = r && r.csPlan;
    if (!pl) { const x = CS.remembered(a, b); return x ? x.m : 1; }
    if (pl.t !== b) return CS.T.elsewhere;
    return CS.moment(a, b, P) ? 1 + CS.T.strike * Math.min(1.6, pl.s) : CS.T.wait;
  };
  // with no plan, a crown that remembers an old wrong from this neighbour, or wants something of it, still turns to it
  // first: x(1 + 0.8 x its temper, at most 2), vengeance for a wrong, appetite for a want
  CS.remembered = function (a, b) {
    const G = grudge(a, b), W = CS.wantOf(a, b);
    let k = null;
    if (G >= 8 || CS.relMem(a, b)) k = 'v'; else if (W) k = 'w';
    if (!k) return null;
    const t = k === 'v' ? CS.vengeance(a) : CS.appetite(a);
    return { k, m: 1 + CS.T.remember * Math.min(2, t) };
  };
  A.cbWarMul = function (a, b, P) { try { return CS.mul(a, b, P); } catch (e) { return 1; } };

  // the war log (20-ai-personality): the plan's own factor, with the temper behind it
  if (typeof A.aiWhyWar === 'function') {
    const why = A.aiWhyWar;
    A.aiWhyWar = function (a, b, P) {
      const out = why.apply(this, arguments);
      try {
        const pl = planOn(a, b), m = CS.mul(a, b, P);
        if (pl && m > 1.01) {
          const mo = CS.moment(a, b, P);
          out.push([mo ? `The moment has come: ${mo.t}` : 'The moment has come', r2(Math.log(m) * .6)]);
          out.push(...CS.temperWhy(a, pl.k === 'feud' ? 'v' : 'w', .5, pl.k === 'feud' ? 'carries the grudge' : 'hungry for it'));
          if (pl.k === 'want') { const W = CS.wantOf(a, b); W && out.push([`An old want: ${W.s}`, .5]); }
        } else if (!pl && m > 1.01) {
          const x = CS.remembered(a, b);
          out.push([x.k === 'v' ? 'An old wrong remembered' : `An old want: ${(CS.wantOf(a, b) || {}).s || ''}`, r2(Math.log(m) * .6)]);
          out.push(...CS.temperWhy(a, x.k, .3, x.k === 'v' ? 'does not forget' : 'hungry for it'));
        }
      } catch (e) {}
      return out;
    };
  }

  // ---------------------------------------------------------------- the casus belli of a war
  // the release's memories (A.DMEM): the lasting wrongs (half-lives of 14 to 30 years) count as memories; the
  // passing ones (an insult, an incident, a war fought) are cited as the war's recent cause, not as a memory
  // past tenses, so a name of either number reads: "the Nine Winds took our land", "Velgrad took our land"
  const MEMK = { took_land: 'took our land', betrayal: 'betrayed us', broke_pact: 'broke a pact sworn with us', abandoned: 'left us alone in a war' };
  const RECK = { enemy_war: 'fought against us', insult: 'insulted our crown', hostage: 'kept one of ours as a hostage', embargo: 'shut its markets to our goods', justify: 'had its clerks forge claims on us', spies: 'had spies taken in our halls', incident: 'stirred up trouble on our border' };
  const CBT = { justified: 'a claim its clerks forged', reconquest: 'land of its own to take back', rivalry: 'an old rivalry', holy: 'a holy war', incident: 'a quarrel on the border',
    insult: 'an insult to avenge', tribute: 'tribute refused', betrayal: 'appetite alone, against its own ally', conquest: 'conquest', coalition: 'a league against an aggressor',
    throne: 'a claim to the throne', liberty: 'the old liberties of the lords', none: 'none the world accepts' };
  // the strongest wrong of the given kinds in the release's memories, at least 10: "took our land, in 1104"
  const memOf = (a, b, K) => {
    const r = A.realm(a), L = r && r.mem && r.mem[b];
    if (!L) return null;
    let best = null;
    for (const m of L) if (m && K[m.k] && m.v <= -10 && (!best || m.v < best.v)) best = m;
    return best ? { k: best.k, v: best.v, y: best.y, t: `${short(b)} ${K[best.k]}, in ${best.y}` } : null;
  };
  CS.relMem = (a, b) => memOf(a, b, MEMK);
  CS.recentMem = (a, b) => memOf(a, b, RECK);
  CS.compose = function (w) {
    const a = w.leadA, b = w.leadD, ra = A.realm(a), rb = A.realm(b);
    if (!ra || !rb) return null;
    const cites = [], P = persona(a), add = (k, t, v) => cites.push({ k, t: clean(t), v: r2(v) });
    const civil = w.cb === 'throne' || w.cb === 'liberty' || ra.isRebel;
    if (feudOn() && !civil) {
      const G = -FE.sum(a, b), e = FE.top(a, b, -1);
      if (e && G >= 8) add('feud', `An old grudge: ${FE.origin(e)}`, 1 + G / 20);
    }
    const W = !civil && CS.wantOf(a, b);
    if (W) add('want', `${cap(poss(short(a)))} old want: ${W.s}`, .9 + .3 * CS.appetite(a));
    if (!civil) {
      const m = CS.relMem(a, b); if (m) add('relmem', `A memory: ${m.t}`, .6 - m.v / 40);
      const q = CS.recentMem(a, b); if (q) add('recent', `Lately: ${q.t}`, .3 - q.v / 60);
    }
    const pl = ra.csPlan && ra.csPlan.t === b ? ra.csPlan : null;
    if (pl) add('plan', `Prepared since ${pl.y}`, .3);
    const claims = A.claimsOn(a, b);
    if (claims.length && !civil) add('claim', `A claim on ${claims.slice(0, 2).map(p => p.name).join(' and ')}${claims.length > 2 ? ` and ${claims.length - 2} more` : ''}`, .7 + .1 * claims.length);
    const cb = w.cbReal && w.cbReal !== 'none' ? w.cbReal : w.cb;
    if (cb && cb !== 'conquest') add('cause', `The cause given: ${CBT[cb] || cb}`, cb === 'throne' || cb === 'liberty' || cb === 'coalition' || cb === 'tribute' ? 1.2 : .5);
    else add('cause', `The cause given: ${CBT.none}`, .2);
    if (!civil && ra.ruler != null) {
      const top = ((P.parts && P.parts.war) || []).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).slice(0, 2).map(x => x[0]);
      if (top.length) add('trait', `${A.rulerStyle && A.P(ra.ruler) ? A.rulerStyle(A.P(ra.ruler), ra) : 'Its ruler'} is ${top.join(' and ')}`, .3 + P.warLog * .6);
    }
    if (!civil) { const mo = CS.moment(a, b, null); if (mo) add('chance', cap(mo.t), .4); }
    cites.sort((x, y) => y.v - x.v);
    const lead = cites[0] || { k: 'cause', t: 'No reason given' };
    const rest = cites.slice(1, 3).map(c => c.t.replace(/^The cause given: /, 'the cause given, ').replace(/^An old grudge: (\w)/, (m, x) => 'an old grudge, ' + x.toLowerCase()).replace(/^A memory: /, '').replace(/^Lately: /, 'lately, ')
      .replace(/^(A claim on|The host of|The war has|There is turmoil) /, m => m.toLowerCase()));
    const t = clean(`${lead.t}${rest.length ? `. Also: ${rest.join('; ')}` : ''}.`);
    return { y: A.S.year, by: ra.ruler || null, lead: lead.k, t, cites: cites.map(c => ({ k: c.k, t: c.t })), ai: !(ra.playerRun || (A.pc() && A.pc().ruler === a)) };
  };
  CS.hasMemory = c => !!(c && (c.cites || []).some(x => x.k === 'feud' || x.k === 'relmem' || x.k === 'debt'));
  CS.hasWant = c => !!(c && (c.cites || []).some(x => x.k === 'want'));
  A.on('warStart', (w, opts) => {
    try {
      if (!w || w.casus) return;
      const c = CS.compose(w);
      if (!c) return;
      w.casus = c;
      CS.stats.wars++;
      if (CS.hasMemory(c) || CS.hasWant(c)) CS.stats.cited++;
      const ra = A.realm(w.leadA);
      // a realm's record of why it went to war (the Realm tab and the diplomacy card read it after the war is over)
      if (ra) { ra.csHist = (Array.isArray(ra.csHist) ? ra.csHist : []).concat([{ y: A.S.year, w: clean(w.name), o: w.leadD, t: c.t }]).slice(-6); }
      if (!(opts && opts.silent)) A.news(`War declared by ${short(w.leadA)}. ${c.t}`, 'war');
      const pl = ra && ra.csPlan;
      if (pl && pl.t === w.leadD && CS.ON) {
        CS.stats.struck++;
        pl.struck = A.S.year;
        // the war chest opens: the gold saved for this day hires sellswords at once (56-realm-inside)
        if (A.RI && A.RI.hireMercs && A.RI.rax && c.ai) A.RI.hireMercs(ra, A.RI.rax(ra));
      }
    } catch (e) { console.error('casus belli', e); }
  });
  // the log entry for a declared war carries its casus belli
  if (typeof A.aiNoteWar === 'function') {
    const note = A.aiNoteWar;
    A.aiNoteWar = function (a, b, P, rel, cb, res) {
      const n = A.S && Array.isArray(A.S.aiLog) ? A.S.aiLog.length : 0, top = A.S && A.S.aiLog && A.S.aiLog[0];
      const out = note.apply(this, arguments);
      try {
        const e = A.S.aiLog && A.S.aiLog[0], w = res && res.w;
        if (e && e !== top && e.k === 'war' && w && w.casus) { e.cb = w.casus.t; e.t = clean(`${e.t} Casus belli: ${w.casus.t}`); }
      } catch (x) {}
      return out;
    };
  }

  // saving for the day: a planning crown keeps more in reserve (56-realm-inside's ladder spends above it)
  if (A.RI && typeof A.RI.reserveYears === 'function') {
    const rv = A.RI.reserveYears;
    A.RI.reserveYears = function (r) {
      const v = rv.apply(this, arguments);
      return CS.ON && r && r.csPlan && !A.atWar(r.id).length ? r2(v + CS.T.saveYears) : v;
    };
  }

  A.on('worldYear', () => { try { CS.planYear(); } catch (e) { console.error('casus plan', e); } });

})();
