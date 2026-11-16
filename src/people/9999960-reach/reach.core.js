// R2 "every relationship needs a base" (owner order 55, rule 19, D-065, D-080): A.REACH, the game's wiring of the v2
// engine's src/people/engine/reach.js (A.V2.reach) over A.WHY.
//
// "If I'm a peasant why would the king allow me to get to know him." Whether a higher man lets a lower one near, talks
// with him, befriends him, lets him court, hears him or does him a favour follows four things (D-065):
//   1. the gap in standing: estate, rank and office (A.classOf's steps; a lord's rung; a crown);
//   2. the higher one's pride and personality (A.WHY's temper: pride and warmth bend the gap and the sympathy) and his
//      origins: a baron risen from commoners sympathises, a duke born to gold does not (A.REACH.origin);
//   3. need: your sword, your skill, your silence, your coin, your voice in council, what you know;
//   4. circumstance: you serve him, stood in his line, shared his cell, his school, his company, his work.
// And the scales the lower man can shift: knighthood and honour, mastery and renown, fame, wealth, connections (an
// introduction from someone who knows both, a shared lord, kin, a guild), a deed seen. Each is a reason with a label,
// so the answer he is given names it ("Lord Aymer will hear you now: a knight of your name is worth an hour").
//
//   A.REACH.view(lo, hi, act)      pure: { state: equal | kin | open | try | closed, yes, top, nay, say }
//   A.REACH.decide(hi, lo, act)    the decision: none for equals and kin, none for a shut door (no draw), else
//                                  A.WHY.decide(hi, 'reach', ...) (A.rand only when it is close). Returns { ok, rec, msg }
//   A.REACH.case(lo, hi, act)      the plain case the engine judges (the reasons found in the world)
//   A.REACH.pull(lo, hi, act)      pure: how much the reasons lean to yes (0..1); 1 for near-equals (NPC weights)
// Near-equals (a gap of one step or none) keep what already worked: no decision, no record (T.near).
// State: pc.reachNo { id: year } (a refusal stands for the year; pruned, at most 40), p.orig (birth station, stamped
// when a crown or a company makes a man royal; read from p.status otherwise). Old saves load: both are optional.
(function () {
  const E = A.V2 && A.V2.reach;
  if (!E || !A.WHY) { console.error('[reach] the v2 engine has no reach module, or A.WHY is missing'); return; }
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r2 = x => Math.round(x * 100) / 100;
  const RE = A.REACH = {
    E,
    T: Object.assign({
      knight: .8,       // a knight's name
      honourAt: 70, honour: .8, dishonourAt: 25,
      fameAt: 30, famePer: 25, fameMax: 3,
      masterAt: 70, master: 1.2,
      coinAt: 2.7, coinPer: .8, coinMax: 1.6,   // log10 of coin
      deed: .7, deedYears: 3,
      intro: 1.6, introMax: 2.8,
      kinHouse: true,
      lord: .7, guild: .6, subject: 1,
      sword: .7, swordMax: 1.8, skill: .8, silence: 3.5, coin: .9, vote: 1.4, info: .6,
      serve: 2.4, saved: 3, line: 1, cell: 1.4, school: 1, company: 1.2, work: 1, scene: 2,
      noCap: 40,
    }, (A.REACH && A.REACH.T) || {}),
  };
  if (A.WHY.T && A.WHY.T.kindCap) A.WHY.T.kindCap.reach = 20;   // the player's own refusals and admissions, bounded (rule 21)

  // ---------------------------------------------------------------- standing and origin
  const ST_CLASS = { slave: 0, serf: 1, peasant: 2, artisan: 3, merchant: 3, gentry: 4, noble: 5, royal: 7 };
  const ST_WORD = { slave: 'slave', serf: 'serf', peasant: 'peasant', artisan: 'craftsman', merchant: 'merchant', gentry: 'gentleman', noble: 'lord', royal: 'prince' };
  const ORIG_WORD = { 0: 'a slave', 1: 'a serf', 2: 'a peasant', 3: 'a tradesman\'s child' };
  const rungClass = g => (g >= 8 ? 7 : g >= 6 ? 6.5 : g >= 4 ? 5.5 : g >= 2 ? 4 : g >= 1 ? 3 : 0);
  const houseRung = p => {
    const h = p && p.house && A.S.houses ? A.S.houses[p.house] : null;
    return h && h.headPid === p.id && h.rung && h.rung[0] === 'N' && A.rungIndex ? A.rungIndex(h.rung) : -1;
  };
  const rungOf = p => Math.max(p && p.noble ? +p.noble.rung || 0 : -1, houseRung(p));
  // the steps of estate, rank and office (not the scales a man shifts: those are reasons of their own)
  RE.standing = function (p) {
    if (!p) return 0;
    const g = rungOf(p);
    return Math.max(A.classOf(p), g >= 0 ? rungClass(g) : 0);
  };
  RE.word = function (p) {
    if (!p) return 'nobody';
    if (p.ruler) { const r = A.realm(p.ruler); const w = A.rulerStyle ? A.rulerStyle(p, r).split(' ')[0] : 'ruler'; return w.toLowerCase(); }
    const g = rungOf(p);
    if (g >= 2 && GD.NOBLE_RUNGS[g]) return (p.sex === 'F' ? GD.NOBLE_RUNGS[g].f : GD.NOBLE_RUNGS[g].title).toLowerCase();
    if (p.office) return 'officer of the crown';
    if (p.flags && p.flags.unfree) return p.flags.unfree;
    const w = ST_WORD[p.status] || 'commoner';
    return p.sex === 'F' ? ({ craftsman: 'craftswoman', gentleman: 'gentlewoman', lord: 'lady', prince: 'princess' }[w] || w) : w;
  };
  // his birth station: p.orig when it was stamped (a crown or a company made him royal), else his estate (the game
  // keeps a man's estate of birth in p.status; a knighthood or a lordship is p.noble, laid over it)
  RE.origin = p => (p && isFinite(p.orig) ? +p.orig : ST_CLASS[p && p.status] != null ? ST_CLASS[p.status] : 2);
  RE.stamp = function (p) { if (p && !isFinite(p.orig)) p.orig = RE.origin(p); };

  // ---------------------------------------------------------------- the reasons found in the world
  const FAM = () => A.FAMILY_RELS || [];
  const relOf = (a, b) => (a && b && a.rel ? a.rel[b.id] : null);
  RE.isKin = function (lo, hi) {
    const a = relOf(lo, hi), b = relOf(hi, lo);
    if ((a && (FAM().includes(a.type) || a.type === 'spouse')) || (b && (FAM().includes(b.type) || b.type === 'spouse'))) return true;
    return !!(lo.house && lo.house === hi.house && A.S.houses && A.S.houses[lo.house]);
  };
  const bestSkill = (p, keys) => {
    let k = null, v = 0;
    for (const s of keys || Object.keys(p.skills || {})) { if (!GD.SKILLS[s]) continue; const x = A.skill(p, s); if (x > v) { v = x; k = s; } }
    return { k, v };
  };
  const ARMS = ['melee', 'sword', 'axe', 'spear', 'lance', 'mounted', 'bow', 'xbow', 'shield'];
  const USEFUL = ['medicine', 'stewardship', 'learning', 'logistics', 'siegecraft', 'music', 'faith', 'tactics', 'command', 'sea'];
  const atWar = p => { const rid = p.ruler || p.realm; return !!(rid && A.atWar && A.atWar(rid).length); };
  const council = rid => { const r = rid && A.realm(rid); return r && r.council ? Object.values(r.council) : []; };

  // the scales the lower man shifts: knighthood, honour, renown, mastery, wealth, a deed seen
  RE.scales = function (lo, hi, out) {
    const T = RE.T, Y = A.S.year;
    const g = lo.noble ? +lo.noble.rung || 0 : -1;
    if (g >= 2) out.push({ kind: 'duty', weight: T.knight, label: `a ${g >= 4 ? 'lord' : 'knight'} of your name is worth an hour`, source: { t: 'knight', r: g }, pub: 1 });
    const hon = +lo.honor || 0;
    if (hon >= T.honourAt) out.push({ kind: 'duty', weight: r2(T.honour * (hon - 60) / 40), label: 'your word is known to be good', source: { t: 'honour' }, pub: 1 });
    else if (hon > 0 && hon <= T.dishonourAt) out.push({ kind: 'duty', weight: -r2(T.honour * (T.dishonourAt + 5 - hon) / 30), label: 'your name is not clean', source: { t: 'honour' }, pub: 1 });
    const f = +lo.fame || 0;
    if (f > T.fameAt + 5) out.push({ kind: 'merit', weight: r2(Math.min(T.fameMax, (f - T.fameAt) / T.famePer)), label: f >= 80 ? 'your name is in every hall' : f >= 55 ? 'your name is known across the realm' : `${A.he(hi)} has heard your name`, source: { t: 'fame' }, pub: 1 });
    const m = bestSkill(lo);
    if (m.k && m.v >= T.masterAt) out.push({ kind: 'merit', weight: r2(Math.min(T.master * 1.2, T.master * (m.v - 60) / 25)), label: `a master of ${GD.SKILLS[m.k].toLowerCase()} is worth knowing`, source: { t: 'master', k: m.k }, pub: 1 });
    const c = +lo.coin || 0;
    if (c > 0) { const w = clamp((Math.log10(c + 1) - T.coinAt) * T.coinPer, 0, T.coinMax); if (w > .05) out.push({ kind: 'coin', weight: r2(w), label: 'your purse speaks for you', source: { t: 'coin' }, pub: 1 }); }
    const dd = Array.isArray(lo.deeds) ? lo.deeds : [];
    const d = dd.length ? dd[dd.length - 1] : null;
    if (d && d.y >= Y - T.deedYears && d.t) out.push({ kind: 'merit', weight: T.deed, label: `word of your deed has reached ${A.him(hi)}: ${String(d.t).charAt(0).toLowerCase() + String(d.t).slice(1, 80)}`, source: { t: 'deed', y: d.y }, pub: 1 });
  };
  // connections: an introduction from someone who knows both, a shared lord, a guild
  RE.ties = function (lo, hi, out) {
    const T = RE.T;
    let best = null, bw = 0;
    for (const id in lo.rel || {}) {
      const r = lo.rel[id];
      if (!r || (r.op || 0) < 30 || id === String(hi.id)) continue;
      const x = A.P(id);
      if (!x || !x.alive || !x.rel) continue;
      const xr = x.rel[hi.id];
      if (!xr || (xr.op || 0) < 20) continue;
      // his word counts by how well the man above thinks of him, how near the man above he stands, and how close he is to you
      const w = T.intro * Math.min(1, (xr.op || 0) / 50) + .8 * clamp(1 - (RE.standing(hi) - RE.standing(x)) / 6, 0, 1) + Math.min(.4, (r.op - 30) / 100);
      if (w > bw) { bw = w; best = x; }
    }
    if (best) out.push({ kind: 'loyalty', weight: r2(Math.min(T.introMax, bw)), label: `${A.fullName(best, false)} speaks for you`, source: { t: 'intro', id: best.id }, pub: 1 });
    const sl = A.superior ? A.superior(lo) : null, sh = A.superior ? A.superior(hi) : null;
    if (sl && sh && sl.id === sh.id) out.push({ kind: 'duty', weight: T.lord, label: 'you serve the same lord', source: { t: 'lord', id: sl.id }, pub: 1 });
    if (lo.job && hi.job && lo.job.c === hi.job.c && GD.CAREERS[lo.job.c] && GD.CAREERS[lo.job.c].guild) out.push({ kind: 'duty', weight: T.guild, label: 'you are of the same guild', source: { t: 'guild' }, pub: 1 });
  };
  // need: what he wants of you
  RE.needs = function (lo, hi, act, out) {
    const T = RE.T, he = A.he(hi);
    const arms = bestSkill(lo, ARMS);
    if (atWar(hi) && (arms.v >= 40 || (lo.mil && !lo.mil.merc) || lo.company)) out.push({ kind: 'want', weight: r2(Math.min(T.swordMax, T.sword + Math.max(0, arms.v - 40) / 40 + (lo.company ? .6 : 0))), label: `${he} needs your sword`, source: { t: 'sword' } });
    const use = bestSkill(lo, USEFUL);
    if (RE.standing(hi) >= 5 && use.v >= 60) out.push({ kind: 'want', weight: T.skill, label: `${he} has use for your ${GD.SKILLS[use.k].toLowerCase()}`, source: { t: 'skill', k: use.k } });
    const SEC = A.BONDS && A.BONDS.SEC;
    try { if (SEC && SEC.known && lo.id === A.S.pc && SEC.known(lo, hi)) out.push({ kind: 'want', weight: T.silence, label: `${he} wants your silence`, source: { t: 'silence' } }); } catch (e) { /* a secret's lookup is never worth a refusal */ }
    if ((+lo.coin || 0) >= 500 && ((hi.traits || []).includes('greedy') || (+hi.coin || 0) < (+lo.coin || 0) / 4)) out.push({ kind: 'coin', weight: T.coin, label: `${he} wants your coin`, source: { t: 'coin' } });
    const rid = hi.ruler || hi.realm;
    if (rid && council(rid).includes(lo.id) && (hi.ruler || council(rid).includes(hi.id))) out.push({ kind: 'want', weight: T.vote, label: `${he} wants your voice in council`, source: { t: 'vote' } });
    if (A.skill(lo, 'intrigue') >= 55 && RE.standing(hi) >= 6) out.push({ kind: 'want', weight: T.info, label: `${he} wants what you know`, source: { t: 'info' } });
    // a lord hears his own people: an audience with the ruler of your realm, or your own lord
    if (act === 'audience' && ((hi.ruler && hi.ruler === lo.realm) || (lo.noble && hi.ruler === lo.noble.realm))) out.push({ kind: 'duty', weight: T.subject, label: `${he} hears ${A.his(hi)} own people`, source: { t: 'subject' }, pub: 1 });
  };
  // circumstance: you serve him, stood in his line, shared his cell, his lessons, his company, his work
  RE.circ = function (lo, hi, out) {
    const T = RE.T, he = A.he(hi);
    const sup = A.superior ? A.superior(lo) : null, pat = A.patronOf ? A.patronOf(lo) : null;
    let serve = (sup && sup.id === hi.id) || (pat && pat.id === hi.id) || (lo.mil && lo.mil.cmdr === hi.id);
    if (!serve && hi.staff) for (const k in hi.staff) if (hi.staff[k] === lo.id) serve = true;
    if (!serve && lo.office && hi.ruler && hi.ruler === lo.realm) serve = true;
    if (!serve && council(hi.ruler).includes(lo.id)) serve = true;
    if (serve) out.push({ kind: 'duty', weight: T.serve, label: `you serve ${A.him(hi)}`, source: { t: 'serve' }, pub: 1 });
    const hist = (relOf(lo, hi) && relOf(lo, hi).hist) || [];
    if (hist.some(h => h && /\bsaved\b/i.test(h.t || ''))) out.push({ kind: 'debt', weight: T.saved, label: `you saved ${A.his(hi)} life`, source: { t: 'saved' }, pub: 1 });
    if (lo.mil && hi.mil && lo.mil.div && lo.mil.div === hi.mil.div) out.push({ kind: 'loyalty', weight: T.line, label: 'you stood in the same line', source: { t: 'line' }, pub: 1 });
    if (lo.prison && hi.prison) out.push({ kind: 'loyalty', weight: T.cell, label: 'you shared a cell', source: { t: 'cell' }, pub: 1 });
    if (lo.school && hi.school && (lo.school.academy || lo.school.kind) === (hi.school.academy || hi.school.kind)) out.push({ kind: 'loyalty', weight: T.school, label: 'you sat at the same lessons', source: { t: 'school' }, pub: 1 });
    if (lo.company && Array.isArray(lo.company.officers) && lo.company.officers.some(o => (o && (o.id || o)) === hi.id)) out.push({ kind: 'loyalty', weight: T.company, label: 'you march in the same company', source: { t: 'company' }, pub: 1 });
    if (lo.job && (lo.job.mates || []).includes(hi.id)) out.push({ kind: 'duty', weight: T.work, label: `you work beside ${A.him(hi)}`, source: { t: 'work' }, pub: 1 });
    return he;
  };

  // the case: lo would reach hi for act
  RE.case = function (lo, hi, act, extra) {
    const sl = RE.standing(lo), sh = RE.standing(hi), o = RE.origin(hi);
    const c = { act: act || 'know', gap: r2(sh - sl), lowWord: RE.word(lo), highWord: RE.word(hi), traits: Array.isArray(hi.traits) ? hi.traits : [], she: hi.sex === 'F', yes: [], no: [] };
    if (c.gap <= E.T.near) return c;   // near-equals: nothing more to find
    if (RE.isKin(lo, hi)) { c.kin = true; return c; }
    const hr = relOf(hi, lo), lr = relOf(lo, hi);
    c.op = hr ? +hr.op || 0 : lr ? (+lr.op || 0) * .8 : 0;
    if (o <= 3 && sh - o >= 2 && sl <= o + 1) { c.born = 'low'; c.origWord = ORIG_WORD[Math.max(0, Math.min(3, Math.round(o)))] || 'low'; }
    else if (o >= 5) c.born = 'gold';
    RE.scales(lo, hi, c.yes);
    RE.ties(lo, hi, c.yes);
    RE.needs(lo, hi, c.act, c.yes);
    RE.circ(lo, hi, c.yes);
    if (extra && Array.isArray(extra.yes)) c.yes.push(...extra.yes);
    // a negative scale (a stained name) is a reason against
    for (let i = c.yes.length - 1; i >= 0; i--) if (c.yes[i].weight < 0) { const r = c.yes.splice(i, 1)[0]; c.no.push(Object.assign({}, r, { weight: -r.weight })); }
    return c;
  };

  const nameOf = p => A.fullName(p, false);
  RE.view = function (lo, hi, act, extra) {
    if (!lo || !hi || lo.id === hi.id) return { state: 'equal', yes: 1 };
    const c = RE.case(lo, hi, act, extra);
    const j = E.judge(A.WHY.mind(hi), c);
    j.act = c.act;
    if (j.state === 'open' || j.state === 'try') j.say = E.say(nameOf(hi), c.act, true, j.top, A.him(hi));
    if (j.state === 'closed' || j.state === 'try') j.sayNo = E.say(nameOf(hi), c.act, false, j.nay, A.him(hi));
    if (lo.id === A.S.pc && lo.reachNo && lo.reachNo[hi.id] === A.S.year && j.state === 'try') { j.state = 'closed'; j.refused = true; }
    return j;
  };
  RE.pull = function (lo, hi, act) {
    const j = RE.view(lo, hi, act);
    return j.state === 'equal' || j.state === 'kin' ? 1 : clamp(+j.yes || 0, 0, 1);
  };
  // what could change his mind, of what the lower man lacks
  RE.hintFor = function (lo) {
    const k = [];
    if (!(lo && lo.noble && lo.noble.rung >= 2)) k.push('a knighthood');
    if (!lo || (+lo.fame || 0) < 55) k.push('a name');
    if (!lo || (+lo.coin || 0) < 1000) k.push('a purse');
    k.push('a deed', 'a friend who knows you both');
    return A.cap(k.slice(0, -1).join(', ') + ' or ' + k[k.length - 1]) + ' could change that.';
  };
  RE.hint = RE.hintFor(null);
  // the note's button is a 44-point target on a phone (rule 21)
  const style = () => { if (typeof document === 'undefined' || document.getElementById('reach-style')) return; const s = document.createElement('style'); s.id = 'reach-style'; s.textContent = ':root .reach-line button.tt-i{min-width:44px;min-height:44px}'; (document.head || document.documentElement).appendChild(s); };
  style();

  // the decision. ctx: { extra, log }. A shut door draws nothing; a near-equal or kin decides nothing.
  RE.decide = function (hi, lo, act, ctx) {
    ctx = ctx || {};
    if (!lo || !hi || lo.id === hi.id) return { ok: true, state: 'equal' };
    const c = RE.case(lo, hi, act, ctx.extra);
    const mind = A.WHY.mind(hi), j = E.judge(mind, c);
    if (j.state === 'equal' || j.state === 'kin') return { ok: true, state: j.state };
    const isPc = lo.id === A.S.pc;
    if (isPc && lo.reachNo && lo.reachNo[hi.id] === A.S.year) j.state = 'closed';
    if (j.state === 'closed' && isPc && lo.reachNo && lo.reachNo[hi.id] === A.S.year) return { ok: false, state: 'closed', msg: E.say(nameOf(hi), c.act, false, j.nay, A.him(hi)) + ' ' + RE.hintFor(lo) };
    // a shut door is still his decision, recorded; it draws nothing (no option comes within the band of "no")
    const rec = A.WHY.decide(hi, 'reach', j.options, { at: lo.id, log: isPc && ctx.log !== false, r: hi.ruler || hi.realm });
    const ok = !!rec && rec.chose === 'yes';
    const top = rec && rec.why && rec.why[0] ? rec.why[0][0] : null;
    if (!ok && isPc) {
      const N = lo.reachNo = lo.reachNo && typeof lo.reachNo === 'object' ? lo.reachNo : {};
      for (const k in N) if (N[k] < A.S.year) delete N[k];
      N[hi.id] = A.S.year;
      const ks = Object.keys(N); if (ks.length > RE.T.noCap) delete N[ks[0]];
    }
    return { ok, state: j.state, rec, msg: E.say(nameOf(hi), c.act, ok, top, A.him(hi)) + (ok ? '' : ' ' + RE.hintFor(lo)) };
  };

  // ---------------------------------------------------------------- the player's paths
  // which act each interaction is (the rest are not gated: insults, quarrels, duels, family matters)
  RE.ACT_OF = { time: 'befriend', talk: 'befriend', compliment: 'know', train: 'befriend', spar: 'befriend', askmoney: 'favour', advice: 'audience', help: 'audience', recruit: 'favour', flirt: 'court', date: 'court', propose: 'wed' };
  const CLOSE = ['lover', 'betrothed', 'spouse'];
  const actFor = (key, r) => {
    const a = RE.ACT_OF[key];
    if (!a) return null;
    // a lover may still be courted; a spouse is family
    if ((a === 'court' || a === 'wed') && r && CLOSE.includes(r.type) && a !== 'wed') return null;
    return a;
  };
  // A.interactOptions' last step: an action out of reach is not offered (the person view's note says why)
  RE.filterOpts = function (pc, t, opts) {
    if (!pc || !t || pc.id !== A.S.pc) return opts;
    const r = pc.rel[t.id], seen = {}, out = [];
    for (const k of opts) {
      const a = actFor(k, r);
      if (!a) { out.push(k); continue; }
      const v = seen[a] || (seen[a] = RE.view(pc, t, a));
      if (v.state !== 'closed') out.push(k);
    }
    return out;
  };
  // the line under the actions: what is out of reach, and why (a click-to-open note)
  RE.closedLine = function (pc, t) {
    if (!pc || !t || !t.alive || !UI.noteBtn) return '';
    const r = pc.rel[t.id];
    const shut = [], why = [];
    const acts = {};
    for (const k in RE.ACT_OF) acts[RE.ACT_OF[k]] = 1;
    for (const a of Object.keys(acts)) {
      if ((a === 'court' || a === 'wed') && !(A.isAdult(pc) && A.isAdult(t))) continue;
      if ((a === 'court' || a === 'wed') && r && ['spouse', 'mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'uncle', 'nephew'].includes(r.type)) continue;
      const v = RE.view(pc, t, a);
      if (v.state === 'closed') { shut.push(WORDS[a]); if (v.sayNo && !why.includes(v.sayNo)) why.push(v.sayNo); }
    }
    if (!shut.length) return '';
    return `<div class="small muted reach-line" style="margin-top:6px">Out of your reach: ${UI.esc(shut.join(', '))}. ${UI.noteBtn(why.slice(0, 2).join(' ') + ' ' + RE.hintFor(pc), 'why not')}</div>`;
  };
  const WORDS = { know: 'small courtesies', befriend: 'friendship', audience: 'a hearing', favour: 'favours', court: 'courtship', wed: 'marriage', patron: 'patronage' };
  // A.interact's gate: an act within reach but not settled is an attempt he answers; a shut one is refused with why
  RE.interactGate = function (pc, t, key) {
    if (!pc || !t || pc.id !== A.S.pc) return null;
    const a = actFor(key, pc.rel[t.id]);
    if (!a) return null;
    const d = RE.decide(t, pc, a);
    if (d.ok) return null;
    if (pc.rel[t.id]) A.addOp(pc, t, -1);
    return { ok: true, msg: d.msg, cls: 'bad', reach: true };
  };
  // A.getToKnow's gate: null to go on; else the refusal (the time is spent: you went to find him)
  RE.knowGate = function (pc, t) {
    if (!pc || !t || pc.id !== A.S.pc) return null;
    const d = RE.decide(t, pc, 'know');
    if (d.ok) return null;
    A.S.time -= A.knowCost || 1;
    if (A.log) A.log(d.msg, 'muted');
    return { ok: true, msg: d.msg, reach: true };
  };
  // the "Get to know" button: offered, offered as an attempt, or shut with its note
  RE.knowBtn = function (pc, t, cls, label) {
    const v = RE.view(pc, t, 'know');
    const can = A.S.time >= (A.knowCost || 1);
    if (v.state === 'closed') return `<button class="${cls}" data-a="know" data-v="${UI.esc(t.id)}" disabled data-note="${UI.esc((v.sayNo || '') + ' ' + RE.hintFor(pc))}">${UI.esc(label)}</button>`;
    const note = v.state === 'try' ? ` data-note="${UI.esc('Not a sure thing. ' + (v.sayNo || ''))}"` : '';
    return `<button class="${cls}" data-a="know" data-v="${UI.esc(t.id)}" ${can ? '' : 'disabled'}${note}>${UI.esc(label)}</button>`;
  };
  // an event that makes a close bond with someone far above you: the scene itself is a circumstance (T.scene); if even
  // that is no base, the opinion moves but the bond stays what it was. Pure: returns the type to keep, or null
  const DEEP = ['friend', 'bestfriend', 'lover', 'betrothed', 'mentor'];
  RE.eventBond = function (pc, t, type) {
    if (!pc || !t || pc.id !== A.S.pc || !DEEP.includes(type)) return null;
    const act = type === 'lover' || type === 'betrothed' ? 'court' : 'befriend';
    const v = RE.view(pc, t, act, { yes: [{ kind: 'loyalty', weight: RE.T.scene, label: 'what passed between you', source: { t: 'scene' }, pub: 1 }] });
    if (v.state !== 'closed') return null;
    const cur = pc.rel[t.id] ? pc.rel[t.id].type : 'acquaint';
    return { keep: DEEP.includes(cur) ? cur : 'acquaint', msg: v.sayNo };
  };

  // ---------------------------------------------------------------- NPC to NPC: patronage, matches, circles
  // a patron: the candidate whose reasons lean furthest decides (A.WHY); the rest are never asked
  RE.pickPatron = function (pc, cands) {
    let best = null, bv = -1;
    for (const c of cands || []) {
      const v = RE.view(pc, c, 'patron');
      if (v.state === 'closed') continue;
      const y = v.state === 'equal' || v.state === 'kin' ? 1 : +v.yes || 0;
      if (y > bv) { bv = y; best = c; }
    }
    if (!best) return null;
    return RE.decide(best, pc, 'patron', { log: false }).ok ? best : null;
  };
  // a match for a child into a great house: the head of the house decides for it, by the child's standing and the
  // parent's (the match is the family's, and the dowry is a reason of its own)
  RE.pickHouse = function (pc, kid, houses, dowry) {
    const scored = [];
    for (const h of houses || []) {
      const hd = A.houseHead(h.id);
      if (!hd || !hd.alive) { scored.push({ h, y: .5, hd: null }); continue; }
      const extra = { yes: [{ kind: 'coin', weight: dowry ? .9 : 0, label: 'the dowry is good', source: { t: 'dowry' } }] };
      const lo = RE.standing(pc) >= RE.standing(kid) ? pc : kid;
      const v = RE.view(lo, hd, 'wed', extra);
      if (v.state === 'closed') continue;
      scored.push({ h, hd, lo, extra, y: v.state === 'equal' || v.state === 'kin' ? 1 : +v.yes || 0 });
    }
    scored.sort((a, b) => b.y - a.y || String(a.h.id).localeCompare(String(b.h.id)));
    for (const s of scored.slice(0, 3)) {
      if (!s.hd) return s.h;
      if (RE.decide(s.hd, s.lo, 'wed', { extra: s.extra, log: false }).ok) return s.h;
    }
    return null;
  };
})();
