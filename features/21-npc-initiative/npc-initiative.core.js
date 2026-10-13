// NPC initiative: the people you know act toward you without being asked.
// Aspect: Relationships and people. See README.md for the design and the games it learns from.
//
// Once a month every adult the player knows gets a desire score for 14 kinds of move (4 requests, 3 offers,
// 4 hostile acts, 3 warm gestures). The score reads their opinion of you, the kind of bond, their traits, their
// situation (debts, feuds, children, skills, trouble with the law) and, for the 573 named cast members, the wants
// and fears written for them in the lore. A budget decides whether anyone acts: it fills at RATE moves a year, banks
// at most BANK, and no calendar year ever holds more than CAP NPC-started events (moves plus the follow-ups they
// schedule). Cooldowns per person, per kind and per person-and-kind spread the moves around.
//
// A move is a trigger event queued with ctx.pid (who) and ctx.npcMove = true (the bench convention). Its choices
// write a shared bond history on pc.rel[pid].hist ([{y, t}], last 12), which the person view shows under
// "Between you" and which later events quote back at you. Get-to-know and the interaction buttons add to it too.
//
// Engine paths only (the monthly step, event setup and choices) touch A.rand or A.S. UI.bondHist is pure.

const NI = A.NPCI = Object.assign(A.NPCI || {}, {
  RATE: 1.5,        // moves a year the budget fills at
  BANK: 2,          // most budget that can be saved up
  CAP: 3,           // NPC-started events in one calendar year, follow-ups included: never more
  PERSON_COOL: 3,   // years before the same person makes another move
  KIND_COOL: 2,     // years before anyone makes the same kind of move
  PAIR_COOL: 8,     // years before the same person makes the same kind of move
  HIST: 12,         // bond history entries kept per person
  MIN_W: 0.15,      // desire below this is not a move
});

const KIN = new Set(['mother', 'father', 'sibling', 'child', 'grandparent', 'grandchild', 'uncle', 'nephew', 'cousin', 'inlaw']);
const CLOSE = new Set(['spouse', 'lover', 'betrothed', 'friend', 'bestfriend']);
const TEACH = new Set(['mentor', 'master', 'student']);
const FOE = new Set(['rival', 'enemy']);
NI.cat = ty => KIN.has(ty) ? 'kin' : CLOSE.has(ty) ? 'close' : TEACH.has(ty) ? 'teach' : FOE.has(ty) ? 'foe' : ty === 'ex' ? 'ex' : 'near';
// how much each kind of bond leans toward each group of moves
const BOND = {
  req: { kin: 1.5, close: 1.4, teach: 1.1, foe: 0, ex: .3, near: .8 },
  offer: { kin: 1, close: 1.2, teach: 1.6, foe: .1, ex: .3, near: 1 },
  hostile: { kin: .35, close: .3, teach: .5, foe: 2, ex: 1.4, near: 1 },
  warm: { kin: 1.3, close: 1.5, teach: 1.1, foe: 0, ex: .4, near: .8 },
};

// ---------------------------------------------------------------- small pure helpers

// a stable 0..1 number from any parts: lets setup pick wording without touching the random stream
NI.h = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100003) / 100003; };
NI.hp = (list, ...a) => list[Math.min(list.length - 1, Math.floor(NI.h(...a) * list.length))];
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const low = s => s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
const ageAdj = p => A.age(p) * 16 / GD.RACES[p.race].adult;
const alive = id => { const x = A.P(id); return x && x.alive ? x : null; };
// their opinion of you; a one-sided bond falls back to yours, damped the way A.addOp damps the other side
NI.opOf = (pc, t) => t.rel && t.rel[pc.id] ? t.rel[pc.id].op : pc.rel[t.id] ? pc.rel[t.id].op * .8 : 0;

// ---------------------------------------------------------------- the cast's written wants and fears

const MOT_W = {
  coin: /\b(coins?|gold|silver|debts?|money|pay|paid|wealth|fortune|poor|poverty|loans?|ruin(ed)?|profit|rich)\b/i,
  kin: /\b(sons?|daughters?|child|children|heirs?|grandchild\w*|wife|husband|marry|married|marriage|match|wed\w*|betroth\w*|family|brothers?|sisters?|nephew|niece|kin)\b/i,
  feud: /\b(revenge|avenge\w*|feud\w*|rivals?|enem(y|ies)|kill\w*|murder\w*|vengeance|grudge|wrong(ed)?|hated?)\b/i,
  hide: /\b(secrets?|hid(e|den|ing)|unseen|unnoticed|quiet(ly)?|forgotten|disappear\w*|escape\w*|flee\w*)\b/i,
  teach: /\b(teach\w*|taught|pupils?|students?|apprentice\w*|school|pass(ing)? on|successor|train\w*)\b/i,
  trade: /\b(trade|traders?|market|caravans?|cargo|ships?|merchants?|deal|contract|goods|wool|grain|salt|tolls?|harbou?r|guild|sell|buy|shop)\b/i,
  status: /\b(title|seat|lord|crown|throne|rank|name|hono(u)?r|office|council|post|knight\w*|recogni\w*|respect\w*|power|rise|command)\b/i,
  faith: /\b(gods?|temple|faith|shrine|priests?|pray\w*|holy|saints?|rites?|festival|sacred)\b/i,
  war: /\b(war|raids?|army|armies|battle|siege|march|invade\w*|soldiers?|fight\w*)\b/i,
};
const MOT_F = {
  coin: /\b(debts?|poverty|poor|ruin(ed)?|starv\w*|hunger|beggar\w*|lose (the|his|her) (land|farm|shop))\b/i,
  kin: MOT_W.kin,
  feud: MOT_W.feud,
  hide: /\b(found out|discover\w*|expos\w*|hang\w*|caught|hunt(ed|ers)?|arrest\w*|secrets?|accus\w*|trial|outlaw\w*|condemn\w*|informers?|learn(s|ing)? (what|that|of|the truth)|finding|talks?)\b/i,
  status: MOT_W.status,
  war: MOT_W.war,
  faith: MOT_W.faith,
};
const motCache = new Map();
NI.castOf = t => { if (!t || !t.castId) return null; try { return (typeof LORE !== 'undefined' && LORE.cast && LORE.cast[t.castId]) || null; } catch (e) { return null; } };
// {coin, kin, ... 0..1, fear: 1 when the lore gives a fear}; derived data, cached outside the save
NI.motives = t => {
  const c = NI.castOf(t);
  if (!c) return null;
  if (motCache.has(c.id)) return motCache.get(c.id);
  const m = {};
  for (const k in MOT_W) if (MOT_W[k].test(c.wants || '')) m[k] = 1;
  for (const k in MOT_F) if (MOT_F[k].test(c.fears || '')) m[k] = Math.max(m[k] || 0, k === 'hide' ? 1 : .7);
  if (c.fears) m.fear = 1;
  motCache.set(c.id, m);
  return m;
};
// the cast's own words, as a line that can stand in an event: "She fears that ..." / "He wants ..."
NI.castLine = (t, which) => {
  const c = NI.castOf(t); let s = c && c[which];
  if (!s) return '';
  s = String(s).replace(/[{}<>"]/g, '').replace(/…$/, '.').trim();
  if (/^(fears|wants)\b/i.test(s)) s = cap(A.he(t)) + ' ' + low(s);
  return /[.!?]$/.test(s) ? s : s + '.';
};

// ---------------------------------------------------------------- situations

// their worst living enemy who is not you or yours
NI.foeOf = (pc, t) => {
  let best = null, bo = 999;
  for (const id in t.rel || {}) {
    const r = t.rel[id]; if (!FOE.has(r.type) || id === pc.id || id === pc.spouse || (pc.children || []).includes(id)) continue;
    const f = alive(id); if (!f || !A.isAdult(f)) continue;
    if (r.op < bo) { bo = r.op; best = f; }
  }
  return best;
};
// in trouble with someone this year: reads their traits and the cast's fears, stable within a year
NI.trouble = t => {
  const m = NI.motives(t) || {};
  const ch = .04 + (A.has(t, 'deceitful') ? .08 : 0) + (A.has(t, 'wrathful') ? .06 : 0) + (A.has(t, 'impetuous') ? .05 : 0) +
    (A.has(t, 'greedy') ? .04 : 0) + (m.hide ? .25 : 0) + (['serf', 'slave'].includes(t.status) ? .05 : 0);
  return NI.h(t.id, A.S.year, 'trouble') < ch;
};
NI.trader = t => ['merchant', 'artisan'].includes(t.status) || !!(t.job && GD.CAREERS[t.job.c] && ['trade', 'craft'].includes(GD.CAREERS[t.job.c].skill)) ||
  A.skill(t, 'trade') >= 25 || !!(NI.motives(t) || {}).trade;
// the skill they could teach you, if they are older and clearly better at it
NI.teachSkill = (pc, t) => {
  if (ageAdj(t) < ageAdj(pc) + 4) return null;
  let best = null, bv = 0;
  for (const k of GD.SKILL_LIST) { const v = A.skill(t, k); if (v >= 40 && v > bv && A.skill(pc, k) <= v - 15) { bv = v; best = k; } }
  if (!best && t.job && GD.CAREERS[t.job.c] && t.job.r >= 1) { const k = GD.CAREERS[t.job.c].skill; if (k && GD.SKILLS[k] && A.skill(pc, k) < 45) best = k; }
  return best;
};
// your unmarried child of an age to be promised
NI.kidToMatch = pc => {
  for (const id of pc.children || []) { const c = alive(id); if (c && !c.spouse && ageAdj(c) >= 12 && ageAdj(c) <= 28 && !A.relsOf(c, ['betrothed', 'spouse']).some(x => x.p.alive)) return c; }
  return null;
};
// their own unmarried child of the other sex and a fitting age, if they have one
NI.mateOf = (t, kid) => {
  for (const id of t.children || []) { const m = alive(id); if (m && m.id !== kid.id && !m.spouse && m.sex !== kid.sex && Math.abs(ageAdj(m) - ageAdj(kid)) <= 6 && ageAdj(m) >= 12) return m; }
  return null;
};
NI.canMatch = (pc, t, r) => !KIN.has(r.type) && !['spouse', 'lover', 'betrothed', 'ex'].includes(r.type) && Math.abs(A.classOf(t) - A.classOf(pc)) <= 2 && !!NI.kidToMatch(pc);

// ---------------------------------------------------------------- the kinds of move
// g: group; base: how common; op: least opinion (most, for hostile); adult: the player must be grown (else teens too);
// near: weight when they live in another realm; tr: trait weights; mot: cast motive weights; sit: situation weight.

const KINDS = NI.KINDS = {
  borrow: { ev: 'ni_borrow', g: 'req', base: 1, op: 10, adult: 1, near: .7,
    tr: { greedy: 1.5, generous: .7, proud: .5, humble: 1.3, impetuous: 1.3, patient: .8, content: .7, ambitious: 1.2 },
    mot: { coin: 1.5, kin: .3 },
    sit: (pc, t, r) => pc.coin >= 15 && (t.coin || 0) < pc.coin * .4 && r.type !== 'spouse' ? (['serf', 'peasant', 'slave'].includes(t.status) ? 1.3 : 1) : 0 },
  feud: { ev: 'ni_feud', g: 'req', base: .8, op: 20, adult: 1, near: .3,
    tr: { wrathful: 1.8, calm: .5, proud: 1.4, humble: .7, impetuous: 1.3, brave: 1.2, craven: .6, stubborn: 1.3 },
    mot: { feud: 1.5, war: .5 },
    sit: (pc, t) => NI.foeOf(pc, t) ? 1 : 0 },
  vouch: { ev: 'ni_vouch', g: 'req', base: .7, op: 15, adult: 1, near: .6,
    tr: { ambitious: 1.8, content: .5, humble: 1.2, proud: .8 },
    mot: { status: 1.2, kin: .4, trade: .3 },
    sit: pc => pc.fame >= 8 || pc.honor >= 55 || A.classOf(pc) >= 4 || (pc.job && pc.job.r >= 1) || (pc.mil && pc.mil.rank >= 2) ? 1 : 0 },
  hide: { ev: 'ni_hide', g: 'req', base: .7, op: 30, adult: 1, near: .2,
    tr: {}, mot: { hide: .5 },
    sit: (pc, t) => NI.trouble(t) ? 1 : 0 },
  deal: { ev: 'ni_deal', g: 'offer', base: .8, op: 0, adult: 1, near: .7,
    tr: { greedy: 1.4, ambitious: 1.4, content: .7, impetuous: 1.2, patient: 1.1 },
    mot: { trade: 1.5, coin: .6 },
    sit: (pc, t) => pc.coin >= 30 ? (NI.trader(t) ? 1.2 : .35) : 0 },
  apprentice: { ev: 'ni_apprentice', g: 'offer', base: .8, op: 15, adult: 0, near: .5,
    tr: { kind: 1.4, generous: 1.3, patient: 1.4, impetuous: .7, proud: .8, gregarious: 1.2 },
    mot: { teach: 2 },
    sit: (pc, t) => { const a = ageAdj(pc); return a >= 13 && a <= 40 && NI.teachSkill(pc, t) ? 1 : 0; } },
  match: { ev: 'ni_match', g: 'offer', base: 1.1, op: 10, adult: 1, near: .6,
    tr: { ambitious: 1.5, gregarious: 1.2, proud: 1.1 },
    mot: { kin: 1.5, status: .5 },
    sit: (pc, t, r) => NI.canMatch(pc, t, r) ? (NI.mateOf(t, NI.kidToMatch(pc)) ? 1.5 : 1) : 0 },
  slander: { ev: 'ni_slander', g: 'hostile', base: .9, op: -15, adult: 0, near: .5,
    tr: { deceitful: 2, honest: .3, cruel: 1.5, kind: .5, fickle: 1.3, ambitious: 1.3, proud: 1.2, gregarious: 1.3, shy: .6 },
    mot: { status: 1, feud: .6 },
    sit: pc => pc.fame >= 3 || pc.job || A.classOf(pc) >= 3 ? 1 : .5 },
  challenge: { ev: 'ni_challenge', g: 'hostile', base: .6, op: -25, adult: 1, near: .15,
    tr: { wrathful: 2, calm: .4, brave: 1.6, craven: .2, proud: 1.6, humble: .5, impetuous: 1.4, patient: .7 },
    mot: { feud: 1, war: .8 },
    sit: (pc, t) => A.stage(t) === 'adult' && A.stage(pc) !== 'old' && (t.health || 0) > 50 && Math.abs(A.classOf(t) - A.classOf(pc)) <= 3 ? 1 : 0 },
  theft: { ev: 'ni_theft', g: 'hostile', base: .6, op: -10, adult: 1, near: .1,
    tr: { greedy: 2, generous: .3, deceitful: 1.6, honest: .2, cruel: 1.2 },
    mot: { coin: 1.2 },
    sit: (pc, t) => pc.coin >= 20 && (t.coin || 0) < pc.coin && A.classOf(t) <= A.classOf(pc) + 1 ? 1 : 0 },
  secret: { ev: 'ni_secret', g: 'hostile', base: .7, op: 5, adult: 1, near: .6,
    tr: { deceitful: 1.8, honest: .4, fickle: 2, loyal: .3, cruel: 1.3, gregarious: 1.2 },
    mot: { status: .5, hide: .5 },
    sit: (pc, t, r) => r.niTold ? 2 : A.S.year - (r.since || A.S.year) >= 5 && ['kin', 'close', 'ex'].includes(NI.cat(r.type)) ? .8 : 0 },
  invite: { ev: 'ni_invite', g: 'warm', base: 1, op: 25, adult: 0, near: .2,
    tr: { gregarious: 2, shy: .4, generous: 1.3, greedy: .8, proud: .9 },
    mot: { faith: .8, kin: .6, status: .3 },
    sit: () => 1 },
  confide: { ev: 'ni_confide', g: 'warm', base: .8, op: 40, adult: 0, near: .5,
    tr: { honest: 1.4, deceitful: .6, shy: 1.3, loyal: 1.4, proud: .7, craven: 1.2 },
    mot: { fear: 1.5, hide: .5 },
    sit: () => 1 },
  gift: { ev: 'ni_gift', g: 'warm', base: .8, op: 35, adult: 0, near: .6,
    tr: { generous: 2.2, greedy: .25, kind: 1.4, cruel: .5, gregarious: 1.1 },
    mot: { kin: .4, faith: .3 },
    sit: (pc, t) => (t.coin || 0) >= 10 || A.classOf(t) >= 3 ? 1 : .5 },
};

// opinion: the warmer (or, for hostile moves, the colder) the stronger the pull, from 0.35 at the threshold up to 1
const opPull = (K, o, c) => {
  if (K.g === 'hostile') return o > K.op ? (c === 'foe' && o < 25 ? .35 : 0) : .35 + .65 * Math.min(1, (K.op - o) / 50);
  return o < K.op ? 0 : .35 + .65 * Math.min(1, (o - K.op) / 50);
};

// desire of person t to make move k toward pc, with the reasons that carried it (for the "why" line)
NI.desire = function (pc, t, k, r) {
  const K = KINDS[k], c = NI.cat(r.type), o = NI.opOf(pc, t), why = [];
  let w = K.base * (BOND[K.g][c] || 1);
  if (!w) return { w: 0, why };
  const op = opPull(K, o, c); if (!op) return { w: 0, why };
  w *= op;
  let tr = 1;
  for (const x of t.traits || []) if (K.tr[x]) { tr *= K.tr[x]; if (K.tr[x] > 1) why.push(GD.TRAITS[x] ? GD.TRAITS[x].name.toLowerCase() : x); }
  w *= Math.max(.15, Math.min(4, tr));
  const sit = K.sit(pc, t, r, o); if (!sit) return { w: 0, why };
  w *= sit;
  const m = NI.motives(t);
  if (m) { let f = 1; for (const x in K.mot) if (m[x]) f += K.mot[x] * m[x]; w *= 1.2 * f; if (f > 1) why.push('cast'); }
  // people you have not seen in years rarely come knocking; family always can
  const seen = r.seen || r.since || 0, idle = A.S.year - seen;
  if (c !== 'kin' && c !== 'close') w *= idle <= 3 ? 1 : idle <= 8 ? .5 : .2;
  if (t.realm !== pc.realm && c !== 'kin') w *= K.near;
  // favours: someone you owe asks; someone who owes you offers
  if (A.owesTo(pc, t.id) && K.g === 'req') { w *= 1.5; why.push('you owe'); }
  if (A.favorsOf(pc, t.id) && (K.g === 'offer' || K.g === 'warm')) { w *= 1.3; why.push('owes you'); }
  return { w, why, o };
};

// everyone who might act this month, and what they would do
NI.candidates = function (pc, st) {
  const y = A.S.year, out = [], grown = A.isAdult(pc), teen = A.stage(pc) === 'teen';
  if (!grown && !teen) return out;
  for (const id in pc.rel) {
    const r = pc.rel[id], t = alive(id);
    if (!t || t.id === pc.id || !A.isAdult(t) || t.prison) continue;
    if (st && st.by[id] != null && y - st.by[id] < NI.PERSON_COOL) continue;
    for (const k in KINDS) {
      const K = KINDS[k];
      if (K.adult && !grown) continue;
      if (st && st.k[k] != null && y - st.k[k] < NI.KIND_COOL) continue;
      if (st && st.pk[id + ':' + k] != null && y - st.pk[id + ':' + k] < NI.PAIR_COOL) continue;
      const d = NI.desire(pc, t, k, r);
      if (d.w >= NI.MIN_W) out.push({ t, k, w: d.w, why: d.why, o: d.o });
    }
  }
  return out;
};

// ---------------------------------------------------------------- state and budget

// pc.npci: b budget, hy {year: NPC events planned}, by {pid: year}, k {kind: year}, pk {pid:kind: year}, log, tot.
// Created on first use, so old saves without it load as if the system had just started.
NI.state = pc => {
  const s = pc.npci && typeof pc.npci === 'object' ? pc.npci : (pc.npci = {});
  if (typeof s.b !== 'number' || !Number.isFinite(s.b)) s.b = .5;
  for (const k of ['hy', 'by', 'pk', 'k']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
  if (!Array.isArray(s.log)) s.log = [];
  if (typeof s.tot !== 'number') s.tot = 0;
  return s;
};
NI.prune = (st, y) => {
  for (const k in st.hy) if (+k < y - 25) delete st.hy[k];
  for (const k in st.by) if (st.by[k] < y - NI.PERSON_COOL) delete st.by[k];
  for (const k in st.pk) if (st.pk[k] < y - NI.PAIR_COOL) delete st.pk[k];
};
NI.room = (pc, y) => { const st = pc.npci; return !st || !st.hy || (st.hy[y] || 0) < NI.CAP; };

// the monthly step
NI.month = function (pc) {
  if (!pc || !pc.alive || pc.id !== A.S.pc || !pc.rel) return;
  const st = NI.state(pc), y = A.S.year;
  if (st.py !== y) { st.py = y; NI.prune(st, y); }
  st.b = Math.min(NI.BANK, st.b + NI.RATE / 12);
  if (st.b < 1 || (st.hy[y] || 0) >= NI.CAP || pc.prison) return;
  // one at a time: never stack a second move on one that is still waiting
  if (A.S.queue.some(q => q && q.ctx && q.ctx.npcMove && !q.result)) return;
  const list = NI.candidates(pc, st);
  if (!list.length) return;
  const sum = list.reduce((a, x) => a + x.w, 0);
  // a fuller budget and stronger desires make a move this month likelier
  if (!A.chance(Math.min(.9, (.3 + .3 * (st.b - 1)) * Math.min(1, sum / .8)))) return;
  const x = A.wpick(list, z => z.w);
  if (x) NI.launch(pc, x);
};

NI.whyLine = function (pc, x) {
  const t = x.t, r = pc.rel[t.id] || {}, bits = [];
  if (x.o >= 30) bits.push(`thinks well of you (${Math.round(x.o)})`);
  else if (x.o <= -15) bits.push(`bears you ill will (${Math.round(x.o)})`);
  const lab = A.relLabel ? A.relLabel(t, r) : r.type;
  if (lab && !['acquaint'].includes(r.type)) bits.push('your ' + String(lab).toLowerCase());
  for (const w of x.why) if (w !== 'cast') bits.push(w === 'you owe' ? `you owe ${A.him(t)} a favour` : w === 'owes you' ? `${A.he(t)} owes you a favour` : w);
  let s = bits.length ? `Why ${t.given}: ${bits.slice(0, 4).join('; ')}.` : '';
  if (x.why.includes('cast')) { const wl = NI.castLine(t, 'wants'); if (wl) s += (s ? ' ' : '') + wl; }
  return s.replace(/[{}<>"]/g, '');
};

NI.launch = function (pc, x) {
  const st = NI.state(pc), y = A.S.year, K = KINDS[x.k];
  st.b -= 1; st.hy[y] = (st.hy[y] || 0) + 1; st.tot++;
  st.by[x.t.id] = y; st.k[x.k] = y; st.pk[x.t.id + ':' + x.k] = y;
  st.log.push({ y, pid: x.t.id, k: x.k }); if (st.log.length > 40) st.log.splice(0, st.log.length - 40);
  const ctx = { pid: x.t.id, npcMove: true, nk: x.k, niWhy: NI.whyLine(pc, x) };
  A.queue({ type: 'event', ev: K.ev, ctx });
  return ctx;
};

// A follow-up years later, through A.schedule. It books a slot in its landing year so that year never holds more than
// CAP NPC events; a full year pushes it to the next. forced: the trigger checks its own person in setup instead of cond.
NI.follow = function (pc, ctx, ev, lo, hi, extra) {
  if (!A.EV[ev]) return false;
  const st = NI.state(pc), wc = A.S.warClock || 0;
  let days = A.ri(lo, hi);
  const doy = (wc + days) % 365; if (doy < 4) days += 4 - doy; else if (doy > 360) days -= doy - 360;
  let ty = A.S.year + Math.floor((wc + days) / 365);
  for (let g = 0; g < 5 && (st.hy[ty] || 0) >= NI.CAP; g++) { days += 365; ty++; }
  if ((st.hy[ty] || 0) >= NI.CAP) return false;
  st.hy[ty] = (st.hy[ty] || 0) + 1;
  const nc = {};
  for (const k in ctx) if (!['khe', 'khim', 'khis', 'past', 'niWhy', 'skip'].includes(k)) nc[k] = ctx[k];
  Object.assign(nc, extra || {}, { npcMove: true, follow: ev });
  A.schedule({ type: 'event', ev, ctx: nc, forced: true }, days);
  return true;
};

// ---------------------------------------------------------------- bond history (shared: any feature may call it)

A.bondNote = A.bondNote || function (pc, t, text, y) {
  if (!pc || !t || !pc.rel || !pc.rel[t.id] || !text) return;
  const r = pc.rel[t.id], h = Array.isArray(r.hist) ? r.hist : (r.hist = []);
  const yr = y != null ? y : A.S.year, s = String(text).replace(/[<>"{}]/g, '').trim().slice(0, 140);
  if (!s) return;
  const last = h[h.length - 1];
  if (last && last.y === yr && last.t === s) return;
  h.push({ y: yr, t: s });
  if (h.length > NI.HIST) h.splice(0, h.length - NI.HIST);
};
NI.histOf = (pc, t) => pc && t && pc.rel && pc.rel[t.id] && Array.isArray(pc.rel[t.id].hist) ? pc.rel[t.id].hist : [];
// the last thing between you, from an earlier year, as a sentence an event can carry
const TRIVIAL = /^(you spent a day together|a long talk|you trained together|you sparred|you asked (his|her) advice)$/i;
NI.pastLine = function (pc, t) {
  const h = NI.histOf(pc, t).filter(e => e && e.y < A.S.year && typeof e.t === 'string' && !TRIVIAL.test(e.t));
  if (!h.length) return '';
  const e = h[h.length - 1];
  return ` You both remember ${e.y}: ${low(e.t).replace(/[.!?]$/, '')}.`;
};

// get-to-know and the interaction buttons leave a line too, when it says something
const INT_NOTE = {
  time: 'You spent a day together', talk: 'A long talk', gift: 'You gave {khim} a gift', advice: 'You asked {khis} advice',
  train: 'You trained together', spar: 'You sparred', insult: 'You insulted {khim}', argue: 'You quarrelled',
  date: 'You courted {khim}', apologize: 'You apologised to {khim}', recruit: 'You asked {khim} to join your company',
  breakup: 'You broke it off', divorce: 'You set {khim} aside', duel: 'You challenged {khim} to a duel',
};
NI.noteText = (t, s) => s.replace(/\{khim\}/g, A.him(t)).replace(/\{khis\}/g, A.his(t)).replace(/\{khe\}/g, A.he(t));
if (typeof A.interact === 'function' && !A.interact._ni) {
  const base = A.interact;
  A.interact = function (tid, key, arg) {
    const res = base.apply(this, arguments);
    try {
      const pc = A.pc(), t = A.P(tid);
      if (res && res.ok !== false && pc && t && pc.rel[tid]) {
        let s = INT_NOTE[key];
        if (key === 'askmoney') s = res.cls === 'good' ? '{khe} gave you money when you asked' : '{khe} refused you money';
        if (key === 'propose') s = pc.spouse === tid ? 'You married' : pc.rel[tid].type === 'betrothed' ? 'You were betrothed' : 'You proposed';
        if (s) A.bondNote(pc, t, cap(NI.noteText(t, s)));
      }
    } catch (e) { if (A.S && A.S.debug) throw e; }
    return res;
  };
  A.interact._ni = 1;
}
if (typeof A.getToKnow === 'function' && !A.getToKnow._ni) {
  const base = A.getToKnow;
  A.getToKnow = function (pid) {
    const res = base.apply(this, arguments);
    try {
      const pc = A.pc(), t = A.P(pid);
      if (res && res.ok && pc && t && pc.rel[pid]) A.bondNote(pc, t, pc.rel[pid].op >= 15 ? 'You got to know each other' : `${cap(A.he(t))} kept you at arm's length`);
    } catch (e) { if (A.S && A.S.debug) throw e; }
    return res;
  };
  A.getToKnow._ni = 1;
}

// ---------------------------------------------------------------- event support: setup, choices, follow-ups

const FX_OK = new Set('str spd ins sta int wil health happy looks fame honor piety coin coinPct family skill rep masterwork promote style styleXp apt trait untrait wound flag unflag rel them newRel lover die prison punish free merit patronOp rulerOp realmStab realmGold armyXp secret epithet deed ach job perf lang literate gear asset duel beast event stability treasury legit realmRel favor mission cause why infamy authority houseOp factionDisc owed oweThem letter bossOp sworn claim pact ally warOn'.split(' '));
const CAPS = { slave: 20, serf: 30, peasant: 60, artisan: 150, merchant: 500, gentry: 800, noble: 2000, royal: 5000 };
// a sum that suits both purses: a share of yours, no more than their station would ask for
NI.sum = (pc, t, frac, lo) => {
  let v = Math.round(Math.max(lo, Math.min((pc.coin || 0) * frac, CAPS[t.status] || 100)));
  if ((pc.coin || 0) < v) v = Math.max(1, Math.floor((pc.coin || 0) * .5));
  return v;
};

// when a trigger arrives without a person (a test harness, an old queue), find the likeliest one for this kind
NI.fallback = function (pc, kind) {
  const K = KINDS[kind], pool = [];
  for (const id in pc.rel) { const t = alive(id); if (t && t.id !== pc.id && A.isAdult(t) && !t.prison) pool.push({ t, r: pc.rel[id] }); }
  if (!pool.length) return null;
  const score = x => { let s = 0; try { s = K && K.sit(pc, x.t, x.r, NI.opOf(pc, x.t)) ? 2 : 0; } catch (e) { s = 0; } return s + (K && K.g === 'hostile' ? -NI.opOf(pc, x.t) : NI.opOf(pc, x.t)) / 100; };
  pool.sort((a, b) => score(b) - score(a) || (a.t.id < b.t.id ? -1 : 1));
  return pool[0].t;
};

// fill what each kind's text needs; no random draws here, so it does not matter who asks for the view first
const FILL = {
  borrow(pc, t, ctx) {
    if (!ctx.amtN) ctx.amtN = NI.sum(pc, t, .12, 3);
    ctx.amt = A.coin(ctx.amtN);
    ctx.cause = ctx.cause || NI.hp(['roof fell in with the thaw', 'debts have come due all at once', 'mule died on the road', 'brother is in trouble with the court',
      'store of grain has gone to rot', 'shop lost a season to the flood'], t.id, A.S.year, 'cause');
  },
  feud(pc, t, ctx) {
    const f = alive(ctx.foePid) || NI.foeOf(pc, t);
    if (f) { ctx.foePid = f.id; ctx.foe = A.fullName ? A.fullName(f, false) : f.given; }
    else ctx.foe = ctx.foe || NI.hp(['the Marsh family', 'a neighbour with a long memory', 'the miller and his sons', 'a cousin over a field'], t.id, 'foe');
  },
  vouch(pc, t, ctx) {
    ctx.seek = ctx.seek || NI.hp(['a place in the guild', 'a post in the watch', 'the hand of a miller\'s daughter', 'a loan from the temple',
      'a berth on a trading ship', 'a lease on good land'], t.id, A.S.year, 'seek');
  },
  hide(pc, t, ctx) {
    ctx.hunt = ctx.hunt || NI.hp(['The sheriff\'s men', 'A creditor\'s hired bruisers', 'The watch', 'The dead man\'s brothers', 'The temple wardens'], t.id, A.S.year, 'hunt');
    ctx.huntLow = low(ctx.hunt);
  },
  hide_thanks(pc, t, ctx) { FILL.hide(pc, t, ctx); ctx.amtN = ctx.giftN || (ctx.giftN = NI.sum(pc, t, .06, 3)); ctx.amt = A.coin(ctx.amtN); },
  hide_caught(pc, t, ctx) { FILL.hide(pc, t, ctx); ctx.amtN = ctx.fineN || (ctx.fineN = NI.sum(pc, t, .1, 5)); ctx.amt = A.coin(ctx.amtN); },
  deal(pc, t, ctx) {
    if (!ctx.amtN) ctx.amtN = NI.sum(pc, t, .15, 10);
    ctx.amt = A.coin(ctx.amtN);
    ctx.venture = ctx.venture || NI.hp(['a share in a wool cart bound for the coast', 'half a boat of salt fish', 'a lease on a mill that has stood idle',
      'a load of tanned hides for the river towns', 'a winter\'s worth of iron nails'], t.id, A.S.year, 'venture');
  },
  deal_profit(pc, t, ctx) { FILL.deal(pc, t, ctx); NI.stake(ctx); ctx.retN = Math.round(ctx.stakeN * (ctx.share ? 1.9 : 1.6)); ctx.ret = A.coin(ctx.retN); },
  deal_loss(pc, t, ctx) {
    FILL.deal(pc, t, ctx); NI.stake(ctx); ctx.retN = Math.max(1, Math.round(ctx.stakeN * .4)); ctx.ret = A.coin(ctx.retN);
    ctx.cause2 = ctx.cause2 || NI.hp(['a wheel came off on the pass', 'the goods spoiled in the heat', 'the buyers had already bought from someone else', 'the river rose and took half of it'], t.id, 'loss');
  },
  deal_gone(pc, t, ctx) { FILL.deal(pc, t, ctx); NI.stake(ctx); },
  apprentice(pc, t, ctx) {
    const k = ctx.sk && GD.SKILLS[ctx.sk] ? ctx.sk : NI.teachSkill(pc, t) || (t.job && GD.CAREERS[t.job.c] && GD.CAREERS[t.job.c].skill) || 'craft';
    ctx.sk = GD.SKILLS[k] ? k : 'craft';
    ctx.skillName = String(GD.SKILLS[ctx.sk]).toLowerCase();
  },
  match(pc, t, ctx) {
    const kid = alive(ctx.kidPid) || NI.kidToMatch(pc) || (pc.children || []).map(alive).find(c => c && !c.spouse);
    if (!kid) { ctx.skip = 1; return; }
    ctx.kidPid = kid.id; ctx.kid = kid.given; ctx.kidRel = kid.sex === 'F' ? 'daughter' : 'son';
    const m = alive(ctx.matePid) || NI.mateOf(t, kid);
    const ms = m ? m.sex : kid.sex === 'F' ? 'M' : 'F';
    ctx.mateHim = ms === 'F' ? 'her' : 'him';
    if (m) { ctx.matePid = m.id; ctx.mateDesc = `${A.his(t)} ${m.sex === 'F' ? 'daughter' : 'son'} ${m.given}`; }
    else ctx.mateDesc = ctx.mateDesc || `${A.his(t)} ${NI.hp(['sister', 'brother', 'cousin'], t.id, 'kin')}'s ${ms === 'F' ? 'girl' : 'boy'}`;
  },
  slander(pc, t, ctx) {
    ctx.lie = ctx.lie || (pc.mil ? NI.hp(['that you ran at the last muster', 'that you sold your kit for drink'], t.id, A.S.year)
      : pc.job ? NI.hp(['that you cheat on your weights', 'that your work is done by others'], t.id, A.S.year)
      : NI.hp(['that your coin is stolen', 'that you are not who you say you are', 'that you beat your animals'], t.id, A.S.year));
  },
  challenge(pc, t, ctx) {
    ctx.wrong = ctx.wrong || NI.hp(['a word you said about his family', 'a debt of honour from years back', 'the way you looked at him in the hall'], t.id, 'wrong')
      .replace('his', A.his(t)).replace('him', A.him(t));
  },
  theft(pc, t, ctx) { if (!ctx.amtN) ctx.amtN = NI.sum(pc, t, .08, 2); ctx.amt = A.coin(ctx.amtN); },
  secret(pc, t, ctx) {
    const r = pc.rel[t.id] || {};
    ctx.secret = ctx.secret || (r.niTold ? `the thing you told ${A.him(t)} in ${r.niTold}` : NI.hp(['who your father really was', 'the debt you ran from', 'the night of the fire', 'the name you were born with'], pc.id, t.id));
  },
  invite(pc, t, ctx) {
    const m = NI.motives(t) || {};
    ctx.occasion = ctx.occasion || (m.faith ? 'a vigil at the shrine' : NI.hp([`the naming of ${A.his(t)} grandchild`, 'a harvest supper', 'a hunt on the high ground',
      `the raising of ${A.his(t)} new barn`, 'a wedding in the family'], t.id, A.S.year, 'occ'));
  },
  confide(pc, t, ctx) {
    ctx.fear = ctx.fear || NI.castLine(t, 'fears') || NI.hp([`${cap(A.he(t))} owes more than ${A.he(t)} can pay, to people who do not forgive.`,
      `${cap(A.he(t))} thinks ${A.his(t)} brother means to cheat ${A.him(t)} of the family land.`, `${cap(A.he(t))} has not slept a full night since the war.`,
      `${cap(A.he(t))} loved someone ${A.he(t)} should not have, and still does.`, `${cap(A.he(t))} is losing the sight in one eye and has told no one.`], t.id, 'fear');
  },
  confide_test(pc, t, ctx) { FILL.confide(pc, t, ctx); ctx.amtN = ctx.bribeN || (ctx.bribeN = NI.sum(pc, t, .1, 15)); ctx.amt = A.coin(ctx.amtN); },
  gift_favor(pc, t, ctx) {
    FILL.gift(pc, t, ctx);
    ctx.ask = ctx.ask || NI.hp([`speak for ${A.his(t)} boy to a master you know`, `lend ${A.him(t)} a cart for a week`, 'stand witness at a land sale',
      `put up a cousin of ${A.his(t)} for the winter`], t.id, 'ask');
  },
  match_wedding(pc, t, ctx) {
    FILL.match(pc, t, ctx);
    const kid = alive(ctx.kidPid), m = alive(ctx.matePid);
    if (!kid || !m || kid.spouse || m.spouse) { ctx.skip = 1; return; }
    ctx.mate = m.given;
  },
  gift(pc, t, ctx) {
    const rich = A.classOf(t) >= 4 || (t.coin || 0) > 200;
    ctx.gift = ctx.gift || NI.hp(rich ? ['a good knife with a horn handle', 'a cloak of oiled wool', `a silver ring that was ${A.his(t)} mother's`, 'a book of hours']
      : ['a ham and a jar of honey', 'a pair of well-made boots', 'a carved box', 'a hen that still lays'], t.id, A.S.year, 'gift');
  },
};

// setup for every NPC-initiative event: the person, pronouns, what has passed between you, and the kind's own tokens
NI.setup = function (pc, ctx, kind) {
  let t = alive(ctx.pid);
  if (!t || t.id === pc.id) {
    if (ctx.follow) { ctx.skip = 1; return; }   // a follow-up about someone who has died since
    t = NI.fallback(pc, kind);
    if (!t) { ctx.skip = 1; return; }
    ctx.pid = t.id;
  }
  ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);
  ctx.past = NI.pastLine(pc, t);
  const f = FILL[kind] || FILL[String(kind).split('_')[0]];
  if (f) f(pc, t, ctx);
};

// apply a choice: the engine's own effects, then a line of shared history, a mark on the bond, a follow-up
NI.act = function (pc, ctx, fx, o) {
  o = o || {};
  const t = alive(ctx.pid);
  let out = '';
  if (fx) {
    for (const k in fx) if (!FX_OK.has(k)) console.error('npc-initiative: unknown fx key ' + k);
    const r = A.applyFx(pc, fx, ctx); if (typeof r === 'string' && r) out += r;
  }
  if (t && pc.rel[t.id]) {
    if (o.note) A.bondNote(pc, t, cap(A.T(o.note, A.ctxTokens(pc, ctx))));
    if (o.mark) pc.rel[t.id][o.mark] = A.S.year;
  }
  if (t && o.next) { const ev = typeof o.next[0] === 'function' ? o.next[0](pc, ctx, t) : o.next[0]; if (ev) NI.follow(pc, ctx, ev, o.next[1], o.next[2], o.extra); }
  return out;
};

// which follow-up comes back: decided when you choose, from who they are (engine path, so it may roll)
const tr = (t, k) => A.has(t, k) ? 1 : 0;
NI.outcome = {
  repays: (pc, ctx, t) => A.chance(A.clamp(.55 + .25 * tr(t, 'honest') + .1 * tr(t, 'loyal') - .3 * tr(t, 'deceitful') - .15 * tr(t, 'greedy') + NI.opOf(pc, t) / 200, .1, .95)) ? 'ni_borrow_repaid' : 'ni_borrow_default',
  vouch: (pc, ctx, t) => A.chance(A.clamp(.6 + .2 * tr(t, 'honest') + .1 * tr(t, 'loyal') + .05 * tr(t, 'patient') - .3 * tr(t, 'deceitful') - .2 * tr(t, 'fickle') - .1 * tr(t, 'impetuous'), .1, .95)) ? 'ni_vouch_good' : 'ni_vouch_bad',
  hide: (pc, ctx, t, risk) => A.chance(risk) ? 'ni_hide_caught' : 'ni_hide_thanks',
  deal: (pc, ctx, t) => {
    if (A.chance(tr(t, 'deceitful') ? .25 : tr(t, 'greedy') ? .08 : .03)) return 'ni_deal_gone';
    return A.chance(A.clamp(.45 + A.skill(t, 'trade') / 200 + (NI.trader(t) ? .1 : 0) + .05 * tr(t, 'patient') - .1 * tr(t, 'impetuous'), .2, .9)) ? 'ni_deal_profit' : 'ni_deal_loss';
  },
  slander: (pc, ctx, t) => NI.opOf(pc, t) > -30 && !tr(t, 'cruel') && A.chance(.6) ? 'ni_slander_mend' : 'ni_slander_again',
  theft: (pc, ctx, t) => A.chance(tr(t, 'honest') || tr(t, 'kind') ? .6 : .25) ? 'ni_theft_return' : 'ni_theft_again',
};
// a NPC-side change between two other people (a feud cooling, a betrothal)
NI.bond = (a, b, d, type) => {
  if (!a || !b) return;
  if (!a.rel[b.id]) a.rel[b.id] = { type: type || 'acquaint', op: 0, since: A.S.year };
  if (!b.rel[a.id]) b.rel[a.id] = { type: type || 'acquaint', op: 0, since: A.S.year };
  a.rel[b.id].op = A.clamp(a.rel[b.id].op + d, -100, 100); b.rel[a.id].op = A.clamp(b.rel[a.id].op + d, -100, 100);
  if (type) { a.rel[b.id].type = type; b.rel[a.id].type = type; }
};
// promise your child to theirs; a match with a relative they spoke for creates that relative
NI.betroth = function (pc, ctx) {
  const t = alive(ctx.pid), kid = alive(ctx.kidPid);
  if (!t || !kid) return '';
  let m = alive(ctx.matePid);
  if (!m) {
    const sex = kid.sex === 'F' ? 'M' : 'F';
    m = A.newPerson({ given: A.givenName(t.cult, sex), sur: t.sur, surMode: t.surMode, sex, race: kid.race, realm: t.realm, cult: t.cult, faith: t.faith,
      born: kid.born + A.ri(-3, 3), status: t.status, home: t.home });
    m.occ = A.pick(A.OCC && A.OCC[m.status] || ['a farmer']);
    NI.bond(t, m, 40, 'nephew');
    ctx.matePid = m.id;
  }
  ctx.mate = m.given;
  NI.bond(kid, m, 30, 'betrothed');
  if (!pc.rel[m.id]) A.link(pc, m, 'acquaint', 15, 'acquaint');
  return '';
};
NI.wed = function (pc, ctx) {
  const kid = alive(ctx.kidPid), m = alive(ctx.matePid);
  if (!kid || !m || kid.spouse || m.spouse) return false;
  kid.spouse = m.id; m.spouse = kid.id;
  NI.bond(kid, m, 15, 'spouse');
  if (pc.rel[m.id]) pc.rel[m.id].type = 'inlaw'; else A.link(pc, m, 'inlaw', 25, 'inlaw');
  if (m.rel[pc.id]) m.rel[pc.id].type = 'inlaw';
  return true;
};
NI.stake = ctx => { ctx.stakeN = Math.max(1, Math.round(ctx.stake || ctx.amtN || 1)); ctx.stakeS = A.coin(ctx.stakeN); };
// your side of a feud: their enemy becomes yours
NI.sideWith = function (pc, ctx) {
  const f = alive(ctx.foePid);
  if (!f) return '';
  if (pc.rel[f.id]) { A.addOp(pc, f, -25); if (!FOE.has(pc.rel[f.id].type) && !KIN.has(pc.rel[f.id].type)) { pc.rel[f.id].type = 'rival'; if (f.rel[pc.id]) f.rel[pc.id].type = 'rival'; } }
  else A.link(pc, f, 'rival', -25, 'rival');
  A.bondNote(pc, f, `You stood against ${A.him(f)} with ${(A.P(ctx.pid) || {}).given || 'a friend'}`);
  return `(${f.given} is your rival now)`;
};
// a feud between two other people cools by d
NI.cool = (ctx, d) => { const t = alive(ctx.pid), f = alive(ctx.foePid); if (t && f) NI.bond(t, f, d); };
// settle the money a choice moves without going below zero
NI.pay = (pc, n) => { const v = Math.min(Math.max(0, Math.round(n)), Math.floor(pc.coin || 0)); pc.coin = (pc.coin || 0) - v; return v; };

// how a first-blood challenge ended, then a rematch or a gloat years later
A.DUEL_END = A.DUEL_END || {};
A.DUEL_END.niChallenge = function (D, pid) {
  const pc = A.pc(), t = A.P(pid);
  if (!pc || !t || !pc.rel[t.id]) return;
  const won = D.result === 'win' || D.result === 'beastfled';
  if (won) { A.fame(pc, 2); A.addOp(pc, t, -4); A.bondNote(pc, t, `You drew first blood from ${A.him(t)}`); }
  else if (D.result === 'lose' || D.result === 'yield') { A.fame(pc, -1); A.addOp(pc, t, 6); A.bondNote(pc, t, `${cap(A.he(t))} drew first blood from you`); }
  else if (D.result === 'fled') { A.fame(pc, -3); A.addOp(pc, t, -6); A.bondNote(pc, t, `You walked away from ${A.his(t)} challenge`); }
  else A.bondNote(pc, t, 'Your first-blood duel ended even');
  if (t.alive && pc.alive && (D.result === 'win' || D.result === 'lose' || D.result === 'yield')) NI.follow(pc, { pid: t.id, nk: 'challenge' }, 'ni_rematch', 300, 900, { won: won ? 1 : 0 });
};

// ---------------------------------------------------------------- the view: "Between you" (pure: reads only)

UI.bondHist = function (pc, t, r) {
  const h = r && Array.isArray(r.hist) ? r.hist.filter(e => e && typeof e.t === 'string') : [];
  if (!h.length) return '';
  return `<div class="bond-hist" style="margin-top:6px"><div class="tiny muted">What has passed between you</div>` +
    h.slice().reverse().map(e => `<div class="small prof-li"><span class="muted">${UI.esc(String(e.y))}</span> ${UI.esc(e.t)}</div>`).join('') + '</div>';
};

A.onMonth = A.onMonth || [];
A.onMonth.push(pc => NI.month(pc));
