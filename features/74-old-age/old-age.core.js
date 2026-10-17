// Old age (Road to Ten, Character 6: "each life stage has its own play"). The scenes are in the *.events.js files of
// this folder; this file gives them what they read and what they leave:
//
//   who      the people of a long life, found without a dice roll: living children and grandchildren, the heir,
//            the dead among your friends, kin and enemies (with the year they died), the young around you
//   memory   the lines a scene can cite: 67-memory-weave's record (pc.mw: a wrong, a kindness, a hurt, years ago),
//            55-bonds' weighed lines (an old grudge, an old debt), the deeds of the life (pc.deeds, and 26-belief-
//            truth's tale of them), 57-world-chronicle's record (an entry 25 years old that few still remember)
//   C.*      condition helpers built on those, so a scene's cond and its setup always agree
//   fx.oa    { mark, later, hand, will, peace }: a lasting mark (pc.oa, read by the death screen's epilogue; the
//            scenes set an oa_* flag beside it with fx.flag, which later scenes read), a follow-up scene some years on (A.schedule), the sword or the
//            tools handed to the heir, the will, a peace made with someone
//   deathbed when the end is close (the engine's own death odds), the family is sent for: a scene, once in 8 years
//
// Engine side only. Picks are made in setups and hashed from ids and the year, never from A.rand, so a scene's cond
// and setup name the same person. The epilogue wrapper only reads. pc.oa is a new field: old saves have none.
(function () {
  const OA = A.OA = Object.assign(A.OA || {}, {});
  (A.FX_EXTRA = A.FX_EXTRA || []).push('oa');

  // ---------------------------------------------------------------- small pure helpers
  OA.h = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; };
  OA.hp = (list, ...key) => (list && list.length ? list[Math.min(list.length - 1, Math.floor(OA.h(...key) * list.length))] : null);
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const low = s => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const clean = s => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim();
  OA.cap = cap; OA.low = low; OA.clean = clean;
  const Y = () => A.S.year;
  const alive = p => !!(p && p.alive);
  const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  OA.num = n => (n >= 0 && n < NUM.length ? NUM[n] : String(n));
  OA.years = n => (n === 1 ? 'a year' : n < NUM.length ? NUM[n] + ' years' : n + ' years');
  // a key for hashing: the event, the person, the year (a scene's cond and its setup agree within the year)
  OA.key = (p, id) => `${id}|${p.id}|${Y()}`;

  // ---------------------------------------------------------------- the people of a long life
  OA.PEER = ['friend', 'bestfriend', 'sibling', 'rival', 'enemy', 'acquaint', 'lover', 'mentor', 'student', 'inlaw', 'spouse', 'lord', 'superior', 'subordinate', 'councillor'];
  OA.FOND = ['friend', 'bestfriend', 'sibling', 'lover', 'mentor', 'spouse'];
  const byAge = (a, b) => (a.born - b.born) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  OA.kids = p => (p.children || []).map(A.P).filter(alive).sort(byAge);
  OA.adultKids = p => OA.kids(p).filter(k => A.isAdult(k));
  OA.heir = p => OA.adultKids(p)[0] || null;
  OA.grandkids = p => {
    const m = new Map();
    for (const k of (p.children || []).map(A.P).filter(Boolean)) for (const g of (k.children || []).map(A.P).filter(alive)) m.set(g.id, g);
    for (const x of A.relsOf(p, ['grandchild'])) if (x.p.alive) m.set(x.p.id, x.p);
    return [...m.values()].sort(byAge);
  };
  // the dead you knew (not your parents: those are expected), newest first; within: died in the last n years
  OA.dead = (p, types, within) => A.relsOf(p, types || OA.PEER)
    .filter(x => !x.p.alive && x.p.died != null && x.p.id !== p.id && (within == null || Y() - x.p.died <= within))
    .map(x => x.p).sort((a, b) => (b.died - a.died) || byAge(a, b));
  // the living you have known long: of an age with you (within 15 years)
  OA.peers = (p, types) => A.relsOf(p, types || OA.PEER).filter(x => x.p.alive && x.p.id !== p.id && Math.abs(A.age(x.p) - A.age(p)) <= 15).map(x => x.p).sort(byAge);
  // the young around you, who are not your own blood: acquaintances and juniors under 30
  OA.young = p => A.relsOf(p, null).filter(x => x.p.alive && x.p.id !== p.id && A.isAdult(x.p) && A.age(x.p) <= 30).map(x => x.p).sort(byAge);
  OA.relOf = (p, t) => (p && t && p.rel && p.rel[t.id] ? p.rel[t.id].type : '');
  const KIN_WORD = { sibling: ['brother', 'sister'], friend: ['friend', 'friend'], bestfriend: ['oldest friend', 'oldest friend'], rival: ['old rival', 'old rival'],
    enemy: ['old enemy', 'old enemy'], acquaint: ['neighbour', 'neighbour'], lover: ['old love', 'old love'], mentor: ['old master', 'old mistress'], student: ['old pupil', 'old pupil'],
    inlaw: ['brother-in-law', 'sister-in-law'], spouse: ['husband', 'wife'], lord: ['old lord', 'old lady'], superior: ['old master', 'old mistress'], subordinate: ['old hand', 'old hand'],
    councillor: ['old colleague', 'old colleague'], child: ['son', 'daughter'], grandchild: ['grandson', 'granddaughter'] };
  OA.word = (p, t) => { const w = KIN_WORD[OA.relOf(p, t)] || ['neighbour', 'neighbour']; return w[t.sex === 'F' ? 1 : 0]; };

  // fill ctx with a person's tokens under a prefix: {oaX} name, {oaXhe} {oaXhim} {oaXhis}, {oaXHe}, {oaXw} what they are to you
  OA.put = function (p, ctx, t, pre, asPid) {
    pre = pre || 'oa';
    ctx[pre] = t.given; ctx[pre + 'full'] = A.fullName ? A.fullName(t, false) : t.given;
    ctx[pre + 'he'] = A.he(t); ctx[pre + 'him'] = A.him(t); ctx[pre + 'his'] = A.his(t); ctx[pre + 'He'] = cap(A.he(t)); ctx[pre + 'His'] = cap(A.his(t));
    ctx[pre + 'w'] = OA.word(p, t); ctx[pre + 'age'] = String(A.age(t));
    if (t.died != null) { ctx[pre + 'died'] = String(t.died); ctx[pre + 'ago'] = OA.years(Math.max(1, Y() - t.died)); }
    if (asPid) { ctx.pid = t.id; ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t); }
    return t;
  };
  // pick one of a list for this scene this year, or back out
  OA.choose = function (p, ctx, list, id, pre, asPid) {
    const t = OA.hp(list, id, p.id, Y());
    if (!t) { ctx.skip = true; return null; }
    return OA.put(p, ctx, t, pre, asPid);
  };

  // ---------------------------------------------------------------- memory: what this life did and saw
  // 67-memory-weave's record: a line of these kinds, at least minAge years old
  OA.mwLines = (p, kinds, minAge) => {
    const L = p && p.mw && Array.isArray(p.mw.m) ? p.mw.m : [];
    const ks = kinds ? (Array.isArray(kinds) ? kinds : String(kinds).split(',')) : null;
    return L.filter(x => x && typeof x.y === 'number' && typeof x.d === 'string' && x.d.length > 8 && Y() - x.y >= (minAge || 0) && (!ks || (Array.isArray(x.k) && x.k.some(k => ks.includes(k)))));
  };
  OA.putLine = function (p, ctx, x, pre) {
    pre = pre || 'oaM';
    ctx[pre + 'year'] = String(x.y); ctx[pre + 'deed'] = clean(x.d).replace(/[.]+$/, ''); ctx[pre + 'Deed'] = cap(ctx[pre + 'deed']);
    ctx[pre + 'ago'] = OA.years(Y() - x.y); ctx[pre + 'title'] = clean(x.t || 'that business').toLowerCase();
    const t = x.p && A.P(x.p);
    ctx[pre + 'who'] = t ? t.given : 'someone'; ctx[pre + 'whoAlive'] = t && t.alive ? '1' : '';
    return x;
  };
  OA.pickLine = function (p, ctx, kinds, minAge, id) {
    const x = OA.hp(OA.mwLines(p, kinds, minAge), id, p.id, Y());
    if (!x) { ctx.skip = true; return null; }
    return OA.putLine(p, ctx, x);
  };
  // 55-bonds: a living person you share a heavy line with, from at least minAge years ago (sign -1 a grudge, +1 a debt)
  OA.bondLines = function (p, sign, minAge, min) {
    const out = [];
    for (const id in p.rel || {}) {
      const r = p.rel[id], t = A.P(id);
      if (!t || !t.alive || t.id === p.id || !Array.isArray(r.hist)) continue;
      for (const e of r.hist) if (e && typeof e.w === 'number' && typeof e.t === 'string' && Math.sign(e.w) === sign && Math.abs(e.w) >= (min || 8) && Y() - e.y >= (minAge || 0)) out.push({ t, e });
    }
    return out.sort((a, b) => Math.abs(b.e.w) - Math.abs(a.e.w) || a.e.y - b.e.y || (a.t.id < b.t.id ? -1 : 1));
  };
  OA.pickBond = function (p, ctx, sign, minAge, id) {
    const L = OA.bondLines(p, sign, minAge);
    const x = OA.hp(L.slice(0, 3), id, p.id, Y());
    if (!x) { ctx.skip = true; return null; }
    OA.put(p, ctx, x.t, 'oa', true);
    ctx.oaByear = String(x.e.y); ctx.oaBdeed = clean((A.BONDS && A.BONDS.deedLine ? A.BONDS.deedLine(x.e) : x.e.d || low(x.e.t))).replace(/[.]+$/, '');
    ctx.oaBago = OA.years(Y() - x.e.y);
    // for 55-bonds' fx.bonds (settle, refresh): the line this scene is about
    ctx.hy = x.e.y; ctx.ht = x.e.t;
    return x;
  };
  // the deeds of the life (pc.deeds), at least minAge years old; 'outlived' lines are the funerals, not the deeds
  OA.deeds = (p, minAge) => (Array.isArray(p.deeds) ? p.deeds : []).filter(d => d && typeof d.t === 'string' && typeof d.y === 'number' && Y() - d.y >= (minAge || 0) && !/^(Outlived|Survived|Buried|Set down your memoirs)/.test(d.t));
  OA.pickDeed = function (p, ctx, minAge, id) {
    const d = OA.hp(OA.deeds(p, minAge), id, p.id, Y());
    if (!d) { ctx.skip = true; return null; }
    const t = clean(d.t).replace(/[.]+$/, '');
    // "you paid off Zagra" reads; "you champion of the tournament" does not: a deed that is not a verb is something you were
    const w0 = t.split(' ')[0];
    const verb = /ed$/i.test(w0) || /^(Wrote|Saw|Sold|Gave|Paid|Had|Made|Built|Won|Took|Led|Fought|Slew|Became|Taught|Held|Kept|Sent|Set|Got|Bought|Brought|Ran|Rode|Stood|Spoke|Swore|Broke|Drove|Threw|Beat|Bore|Struck|Sang|Hung|Dug|Found|Fed|Met|Left|Lost|Came|Went|Did|Told|Put|Cut|Shot|Hid|Bit|Wove|Forged|Freed)$/.test(w0);
    ctx.oaDeed = (verb ? '' : 'were ') + low(t); ctx.oaDeedYear = String(d.y); ctx.oaDeedAgo = OA.years(Y() - d.y);
    // as the tale is told (26-belief-truth): the numbers doubled and a flourish added; without it, a plain flourish
    const tale = A.BT && A.BT.tale ? A.BT.tale(t, p.id + '|' + d.y + '|oa') : t + ', single-handed, some swear.';
    ctx.oaTale = clean(tale).replace(/[.]+$/, '');
    return d;
  };
  // 57-world-chronicle: an entry near home at least `years` old that you were old enough (8) to see; else the canon
  const KIND_RANK = { fall: 6, fallen: 6, ruler: 5, famine: 5, plague: 5, revolt: 4, battle: 4, siege: 3, war: 3, peace: 3, founded: 4, legend: 4, crown: 3, cede: 2 };
  OA.oldEntries = function (p, kinds, years) {
    const W = A.WC; if (!W || !W.near) return [];
    const ks = kinds ? (Array.isArray(kinds) ? kinds : String(kinds).split(',')) : Object.keys(KIND_RANK);
    const from = (p.born || 0) + 8, to = Y() - (years || 25);
    const out = [];
    try {
      for (const e of W.near(p, ks, { max: 4000, minDays: (years || 25) * 365 })) if (e && e.y >= from && e.y <= to) out.push({ id: 'r' + e.i, y: e.y, k: e.k, e, ref: W.ref(e) });
      if (out.length < 2 && W.canonNear) for (const c of W.canonNear(p, ks, { since: from })) if (c.y <= to) { const ci = W.cite(c.id); if (ci) out.push(ci); }
    } catch (err) { return []; }
    return out.sort((a, b) => (KIND_RANK[b.k] || 1) - (KIND_RANK[a.k] || 1) || a.y - b.y).slice(0, 6);
  };
  OA.pickEntry = function (p, ctx, kinds, years, id) {
    const c = OA.hp(OA.oldEntries(p, kinds, years), id, p.id, Y());
    if (!c) { ctx.skip = true; return null; }
    const W = A.WC, x = W.words ? W.words(c) : {};
    ctx.oaRef = clean(c.ref); ctx.oaYear = String(c.y); ctx.oaAgo = OA.years(Y() - c.y); ctx.oaAge = String(c.y - (p.born || c.y));
    ctx.oaPlace = clean(x.P || x.A || A.provName(p.home)); ctx.oaWho = clean(x.who || 'the old ruler');
    try { W.mark && W.mark(c.id); } catch (err) {}
    return c;
  };

  // ---------------------------------------------------------------- condition helpers (pure)
  const C = A.C;
  C.grandkids = (p, n) => OA.grandkids(p).length >= (n || 1);
  C.widowed = p => !!p.widowed && !C.married(p);
  C.heir = p => !!OA.heir(p);
  C.mourns = (p, within, types) => OA.dead(p, types, within == null ? 2 : within).length > 0;
  C.outlived = (p, n, types) => OA.dead(p, types).length >= (n || 1);
  C.peers = (p, n, types) => OA.peers(p, types).length >= (n || 1);
  C.youngFolk = p => OA.young(p).length > 0;
  C.oldLine = (p, kinds, minAge) => OA.mwLines(p, kinds, minAge).length > 0;
  C.grudge = (p, minAge) => OA.bondLines(p, -1, minAge == null ? 8 : minAge).length > 0;
  C.debt = (p, minAge) => OA.bondLines(p, 1, minAge == null ? 8 : minAge).length > 0;
  C.deeds = (p, minAge) => OA.deeds(p, minAge).length > 0;
  C.remembers = (p, kinds, years) => OA.oldEntries(p, kinds, years).length > 0;
  C.youngRuler = p => { const r = A.realm(p.realm), ru = r && A.P(r.ruler); return !!(ru && ru.alive && ru.id !== p.id && A.age(ru) < 28); };
  C.pupil = p => !!(p.bmPupil && A.P(p.bmPupil.id) && A.P(p.bmPupil.id).alive);
  C.oaMark = (p, k) => !!(p.oa && p.oa.m && p.oa.m[k] != null);

  // ---------------------------------------------------------------- the lasting marks (fx.oa)
  OA.state = pc => {
    let s = pc.oa;
    if (!s || typeof s !== 'object' || Array.isArray(s)) s = pc.oa = { m: {} };
    if (!s.m || typeof s.m !== 'object' || Array.isArray(s.m)) s.m = {};
    return s;
  };
  // the follow-up scenes some years on (the scene's ctx goes with them: its person, its tokens)
  const carry = ctx => { const o = {}; for (const k in ctx || {}) if ((typeof ctx[k] === 'string' || typeof ctx[k] === 'number') && !/^_|^mw$/.test(k)) o[k] = ctx[k]; return o; };
  OA.later = function (pc, ev, lo, hi, ctx) {
    if (!A.EV[ev]) return;
    const days = Math.round(A.rf((lo || 1) * 365, (hi || lo || 1) * 365));
    A.schedule({ type: 'event', ev, ctx: carry(ctx) }, days);
  };
  const SLOT_WORD = { weapon: 'the sword', ranged: 'the bow', armor: 'the mail', mount: 'the horse' };
  OA.fx = function (pc, o, ctx) {
    if (!o || typeof o !== 'object') return '';
    const s = OA.state(pc), out = [];
    // a mark for the death screen: the year, and who the scene was about (the flag itself is set by fx.flag)
    if (o.mark) {
      s.m[o.mark] = Y();
      if (ctx && ctx.pid && A.P(ctx.pid)) s.m[o.mark + '_who'] = clean(A.P(ctx.pid).given);
    }
    if (o.will) { s.will = { k: String(o.will), y: Y() }; pc.flags.oa_will = Y(); }
    if (o.hand) {
      const h = OA.heir(pc) || OA.grandkids(pc).find(g => A.isAdult(g)) || (ctx && ctx.pid && A.P(ctx.pid));
      const slot = String(o.hand);
      if (SLOT_WORD[slot] && pc.gear && pc.gear[slot] && pc.gear[slot] !== 'fists' && pc.gear[slot] !== 'none') {
        const g = GD.GEAR[pc.gear[slot]];
        s.hand = { k: slot, what: clean(g ? g.name : SLOT_WORD[slot]), to: h ? clean(h.given) : '', y: Y() };
        if (h && h.gear) h.gear[slot] = pc.gear[slot];
        pc.gear[slot] = slot === 'weapon' ? 'fists' : slot === 'armor' ? 'none' : null;
        if (pc.gearQ) delete pc.gearQ[slot];
      } else if (!SLOT_WORD[slot]) s.hand = { k: slot, what: slot, to: h ? clean(h.given) : '', y: Y() };
      pc.flags.oa_handed = Y();
    }
    if (o.peace && ctx && ctx.pid && A.P(ctx.pid)) { s.peace = (s.peace || []).concat([clean(A.P(ctx.pid).given)]).slice(-4); pc.flags.oa_peace = Y(); }
    if (o.later) { const [ev, lo, hi] = Array.isArray(o.later) ? o.later : [o.later, 2, 5]; OA.later(pc, ev, lo, hi, ctx); }
    return out.join(' ');
  };
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    if (!fx || typeof fx !== 'object' || !pc || !fx.oa) return r;
    let extra = '';
    try { extra = OA.fx(pc, fx.oa, ctx || {}); } catch (e) { console.error('old age fx', e); }
    return [r, extra].filter(x => typeof x === 'string' && x).join(' ');
  };

  // ---------------------------------------------------------------- the deathbed: when the end is near, the family is sent for
  OA.DEATHBED_ODDS = 0.12;   // the engine's yearly death odds at which the priest is sent for (a human near 68)
  OA.nearEnd = pc => !!(pc && pc.alive && C.old(pc) && (A.deathChance(pc) >= OA.DEATHBED_ODDS || pc.health < 25));
  A.onYear.push(pc => {
    if (!OA.nearEnd(pc) || !A.EV.oa_deathbed) return;
    const last = pc.flags.oa_deathbed;
    if (last != null && Y() - last < 8) return;
    if ((A.S.sched || []).some(x => x && x.item && x.item.ev === 'oa_deathbed')) return;
    pc.flags.oa_deathbed = Y();
    A.schedule({ type: 'event', ev: 'oa_deathbed' }, A.ri(30, 300));
  });

  // ---------------------------------------------------------------- the death screen: what the old years left (pure)
  const EPI = {
    will_eldest: (pc, s) => `The will is read at the graveside: the eldest takes the house, as written in ${s.will ? s.will.y : 'your hand'}. Nobody contests it aloud.`,
    will_split: () => 'The will divides everything into equal parts, to the last spoon. The parts are smaller than anyone hoped, and fairer.',
    will_church: () => 'A third of what you leave goes to the altar, as the will says. The priest reads it out twice.',
    will_youngest: () => 'The will passes over the eldest. There is a quarrel at the wake, which you foresaw, and allowed for.',
    will_spouse: () => 'Everything goes to your widowed spouse for life, as you wrote, and to the children after.',
    will_none: () => 'You left no will, as you said you would not. The family works it out among themselves, loudly.',
  };
  OA.epilogue = function (pc) {
    if (!pc) return [];
    const s = pc.oa && typeof pc.oa === 'object' && !Array.isArray(pc.oa) ? pc.oa : {};
    const out = [], m = s.m || {};
    if (s.will && EPI['will_' + s.will.k]) out.push(EPI['will_' + s.will.k](pc, s));
    if (s.hand && s.hand.to) out.push(s.hand.k === 'weapon' ? `${s.hand.to} carries your ${String(s.hand.what).toLowerCase()} now, and is asked about it.` : `${s.hand.to} has your ${String(s.hand.what).toLowerCase()} now, and uses them your way for a while.`);
    if (s.peace && s.peace.length) out.push(`${s.peace[s.peace.length - 1]} comes to the burial. You made your peace in time.`);
    const f = pc.flags || {};
    if (f.oa_grave != null) out.push('You lie where you chose to, in the plot you paid for.');
    if (f.oa_words_kind != null) out.push('Your last words were kind ones. They are repeated for a while, and improved.');
    if (f.oa_words_true != null) out.push('Your last words were the truth. The family agrees never to repeat them.');
    if (f.oa_vow != null) out.push('The candle you paid for burns at the shrine for a year after you, as agreed.');
    if (f.oa_late_love != null && m.late_love_who) out.push(`${m.late_love_who} sits with the family at the front, whatever the cousins say.`);
    return out.slice(0, 4);
  };
  if (typeof A.epilogue === 'function') {
    const epi = A.epilogue;
    A.epilogue = function (p) {
      const base = epi.apply(this, arguments);
      try { const more = OA.epilogue(p); if (Array.isArray(base) && more.length) return base.concat(more); } catch (e) {}
      return base;
    };
  }
})();
