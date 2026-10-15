// The court of people and the realm's inside loop (Road to Ten, Diplomacy 2 and 3). See README.md.
//
//   Diplomacy 2: "Councillors, vassals and claimants are named NPCs with goals; factions are groups of those
//                people, not a meter."
//   Diplomacy 3: "laws, taxes, vassal deals, and succession fights with named claimants. Civil wars come from
//                real factions."
//
// - Every realm's five council seats (A.COUNCIL) are held by named people: cast members whose titles fit the seat,
//   the heads of its great houses, the ruler's kin. In the release only the player's own realm had a council.
// - Every court person has a want and a fear (RI.aims): read from their traits, their house and, for the 573 cast
//   members, the wants and fears written for them in the lore.
// - Once a year the court meets (wrapper of A.factionsYear, which runs inside A.politicsYear for every realm). The
//   councillors and the heads of the four strongest houses each push the law or the spending their want calls
//   for; the crown weighs the pushers against the opposers with its own temper and the state of the treasury, and
//   at most one law changes (taxes, crown authority, levies). Houses remember who won.
// - Vassal deals: a faction that is close to rising is offered a pension or its leader a council seat, or refused.
// - Factions are people: house heads join the faction their want calls for, and councillors who share a faction's
//   aim lend it weight (A.factionPower).
// - Succession: claimants are chosen by blood and ambition (A.findClaimant); the army a claimant raises is what the
//   houses backing them bring (patch RI-CLAIM-ARMY); after the war the backers are rewarded or hunted.
// - A player-ruled realm hears the same pushes as a petition (event ri_court_push); a player at court sees who
//   pushes what and why (UI.riCourtCard), and may speak for or against the next item or send gifts.
//
// Engine paths (the yearly session, council filling, claimants) draw dice. RI.aims, RI.voices, RI.stance and the
// views only read.

const RI = A.RI = A.RI || {};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const r2 = x => Math.round(x * 100) / 100;
const cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const SEATS = () => Object.keys(A.COUNCIL || {});
const live = p => !!(p && p.alive);
const S = () => A.S;
RI.COURT_LOG = 10;   // decisions kept per realm

// ---------------------------------------------------------------- the persona, with or without 20-ai-personality

// A small fallback of the trait weights 20-ai-personality uses, so this feature runs on its own (--only builds).
const MINI = {
  greedy: { greed: .6, warmth: -.1, war: .25 }, generous: { greed: -.6, warmth: .2, war: -.25 },
  ambitious: { war: .55, greed: .25, pride: .2 }, content: { war: -.6, greed: -.25 },
  proud: { pride: .6, war: .3 }, humble: { pride: -.6, war: -.4 }, stubborn: { pride: .25 },
  cautious: { caution: .6, war: -.3 }, craven: { caution: .6, war: -.6, pride: -.2 }, paranoid: { caution: .4 },
  brave: { caution: -.5, war: .35, pride: .15 }, reckless: { caution: -.6, war: .3 }, impetuous: { war: .4, caution: -.3 },
  kind: { warmth: .6, war: -.5 }, cruel: { warmth: -.6, war: .4 }, forgiving: { wrath: -.6, warmth: .2 },
  wrathful: { wrath: .7, war: .55 }, calm: { wrath: -.6, war: -.45 }, vengeful: { wrath: .6, war: .2 },
  zealous: { zeal: .7 }, cynical: { zeal: -.6 }, patient: { war: -.4, caution: .15 },
  honest: { honor: .5 }, deceitful: { honor: -.55 }, loyal: { honor: .55 }, fickle: { honor: -.55 },
  just: { honor: .35 }, honorable: { honor: .6 }, arbitrary: { honor: -.3 },
};
const miniAxes = p => {
  const o = { greed: 0, caution: 0, pride: 0, warmth: 0, wrath: 0, honor: 0, zeal: 0, warLog: 0 };
  for (const t of (p && p.traits) || []) { const w = MINI[t]; if (!w) continue; for (const k in w) { if (k === 'war') o.warLog += w[k]; else o[k] += w[k]; } }
  for (const k in o) o[k] = clamp(o[k], k === 'warLog' ? -1.6 : -1, k === 'warLog' ? 1.6 : 1);
  return o;
};
RI.ax = p => (A.personPersona ? A.personPersona(p) : miniAxes(p));
RI.rax = r => (r && A.rulerPersona ? A.rulerPersona(r.id) : miniAxes(r && A.P(r.ruler)));

// ---------------------------------------------------------------- wants and fears

const WANT = {
  glory: { t: 'war, and land won by it', tr: { ambitious: 1, wrathful: .8, brave: .8, cruel: .6, reckless: .6, impetuous: .5, vengeful: .3, proud: .3 },
    rx: /\b(war|raid\w*|seize|retake|conquer|cross\w*|march|battle|lances|host|army|win back|avenge)\b/i },
  peace: { t: 'peace, and the roads open', tr: { content: 1, craven: .8, kind: .7, calm: .6, cautious: .5, patient: .4, humble: .4, forgiving: .4, lazy: .3 },
    rx: /\b(peace|truce|quiet|stay (home|across)|safe|harvest|lives? to see)\b/i },
  wealth: { t: 'gold for their own house', tr: { greedy: 1.2, gluttonous: .6, deceitful: .3, arbitrary: .2 },
    rx: /\b(gold|silver|coin|profit|rich|fortune|first claim|monopoly|contract|company|tolls?|debts? (paid|repaid))\b/i },
  order: { t: 'a strong crown and full coffers', tr: { just: .9, loyal: .8, diligent: .6, honorable: .5, paranoid: .4, stubborn: .3, stoic: .3 },
    rx: /\b(law|order|loyal|the (king|queen|crown|realm)('s)? (safe|secure|strong)|discipline|ready)\b/i },
  liberty: { t: 'the old liberties of the lords', tr: { proud: .7, fickle: .5, arbitrary: .5, stubborn: .3, deceitful: .3 },
    rx: /\b(liberties|charter|free of|his own lands|her own lands|rights of the|no king)\b/i },
  faith: { t: 'the faith honoured and the temples built', tr: { zealous: 1.3, temperate: .3, honest: .2 },
    rx: /\b(gods?|temple|faith|holy|shrine|priests?|rites?|saints?|sacred|pray\w*)\b/i },
  works: { t: 'roads, walls and granaries', tr: { diligent: .7, curious: .6, generous: .4, patient: .3, temperate: .3 },
    rx: /\b(build\w*|walls?|roads?|bridge|granar\w*|dykes?|canal|harbou?r|forts?|mill)\b/i },
  crown: { t: 'the throne', tr: { ambitious: .6, deceitful: .6, proud: .4, cruel: .2 },
    rx: /\b(throne|the crown for|be (king|queen)|rule (it|the realm)|succession)\b/i },
};
const FEAR = {
  war: { t: 'a war that eats the harvest', tr: { craven: 1, content: .6, cautious: .6, kind: .4, patient: .3 },
    rx: /\b(war|invade\w*|raid\w*|armies|army|host|crossbows|siege|open grass)\b/i },
  ruin: { t: 'debt and an empty treasury', tr: { greedy: .8, cautious: .5, gluttonous: .3, paranoid: .3 },
    rx: /\b(debts?|ruin\w*|poor|bankrupt\w*|lose (his|her|the) (land|seat|farm|fortune)|starv\w*)\b/i },
  tyranny: { t: 'a crown that rules alone', tr: { proud: .8, ambitious: .3, fickle: .3, arbitrary: .3 },
    rx: /\b(strip\w*|tyran\w*|crush\w*|take (his|her) (lands|seat)|the (king|queen|crown) will)\b/i },
  unrest: { t: 'the commons in arms', tr: { paranoid: .7, just: .4, loyal: .4, cautious: .3, stoic: .2 },
    rx: /\b(revolt|rising|mob|riot\w*|rebel\w*|peasants|unrest)\b/i },
  heresy: { t: 'the anger of the gods', tr: { zealous: 1, honest: .2 },
    rx: /\b(heres\w*|curse\w*|sacrileg\w*|the gods)\b/i },
  rival: { t: 'a rival house rising', tr: { vengeful: .8, wrathful: .5, proud: .3, paranoid: .3 },
    rx: /\b(rival|half-brother|enem(y|ies)|feud|never forgive\w*)\b/i },
};
RI.WANT = WANT; RI.FEAR = FEAR;

// a stable 0..1 number from parts: breaks ties without touching the random stream
const hash = (...a) => { let h = 2166136261; const s = a.join('|'); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10007) / 10007; };
const castOf = p => { try { return p && p.castId && LORE.cast ? LORE.cast[p.castId] || null : null; } catch (e) { return null; } };
const houseOf = p => (p && p.house && A.S.houses ? A.S.houses[p.house] : null);
const greatRung = h => !!h && ['N01', 'N02', 'N03'].includes(h.rung);

const aimCache = new Map();
// {want, fear, wantWhy: [..], fearWhy: [..], words: {wants, fears} | null}; a pure function of the person
RI.aims = function (p) {
  if (!p) return null;
  const h = houseOf(p), c = castOf(p);
  const key = p.id + '|' + (p.traits || []).join(',') + '|' + (h ? h.id + h.kind + (h.military ? 1 : 0) : '') + '|' + (p.ruler || '');
  const hit = aimCache.get(p.id);
  if (hit && hit.key === key) return hit.v;
  const score = (T, txt) => {
    const out = {};
    for (const k in T) {
      let v = 0; const why = [];
      for (const t of p.traits || []) if (T[k].tr[t]) { v += T[k].tr[t]; why.push(t); }
      if (txt && T[k].rx.test(txt)) { v += .9; why.push('in their own words'); }
      out[k] = { v, why };
    }
    return out;
  };
  const W = score(WANT, c && c.wants), F = score(FEAR, c && c.fears);
  if (h && h.military) { W.glory.v += .6; W.glory.why.push('a house of soldiers'); }
  if (h && /merchant|guild|bank/i.test(h.kind || '')) { W.wealth.v += .5; W.peace.v += .3; W.wealth.why.push('a house of trade'); }
  // only blood of a great house, or of the crown, may want the throne
  const royalBlood = !!(p.status === 'royal' || (h && h.kind === 'royal'));
  if (!royalBlood && !greatRung(h)) W.crown.v = -9;
  else if (royalBlood && !p.ruler) { W.crown.v += .3; W.crown.why.push('royal blood'); }
  if (p.ruler) W.crown.v = -9;
  const best = (o, ex) => Object.keys(o).filter(k => k !== ex).sort((a, b) => (o[b].v - o[a].v) || (hash(p.id, b) - hash(p.id, a)))[0];
  let want = best(W);
  if (W[want].v <= 0) want = ['order', 'peace', 'glory', 'wealth', 'works'][Math.floor(hash(p.id, 'want') * 5)];
  const opposed = { glory: 'war', peace: null, wealth: 'ruin', order: 'tyranny', liberty: null, faith: null, works: null, crown: null };
  let fear = best(F, want === 'glory' ? 'war' : null);
  if (F[fear].v <= 0) fear = ['ruin', 'unrest', 'rival', 'war', 'tyranny'][Math.floor(hash(p.id, 'fear') * 5)];
  if (opposed[want] === fear) fear = want === 'order' ? 'unrest' : 'rival';
  const v = Object.freeze({ want, fear, wantWhy: W[want].why.slice(0, 3), fearWhy: F[fear].why.slice(0, 3),
    words: c ? { wants: String(c.wants || '').replace(/[<>"{}]/g, ''), fears: String(c.fears || '').replace(/[<>"{}]/g, '') } : null });
  aimCache.set(p.id, { key, v });
  return v;
};
RI.wantText = k => (WANT[k] || {}).t || k;
RI.fearText = k => (FEAR[k] || {}).t || k;

// ---------------------------------------------------------------- pushes

// each push: what it is called, whether it is a law, and when the realm allows it
const TAXES = [.6, .85, 1, 1.2, 1.5];
const taxIdx = r => { const t = (r.laws && r.laws.tax) || 1; let b = 2, bd = 9; TAXES.forEach((x, i) => { if (Math.abs(x - t) < bd) { bd = Math.abs(x - t); b = i; } }); return b; };
RI.TAXES = TAXES; RI.taxIdx = taxIdx;
const PUSH = {
  taxUp: { t: 'heavier taxes', law: 'tax', ok: r => taxIdx(r) < 4 },
  taxDown: { t: 'lighter taxes', law: 'tax', ok: r => taxIdx(r) > 0 },
  authUp: { t: 'more power for the crown', law: 'authority', ok: r => (r.laws.authority || 0) < 3 && r.stability >= 40 && (r.legit || 50) >= 50 },
  authDown: { t: "the lords' liberties restored", law: 'authority', ok: r => (r.laws.authority || 0) > 0 },
  levyUp: { t: 'heavier levies', law: 'levy', ok: r => (r.laws.levy != null ? r.laws.levy : 1) < 2 },
  levyDown: { t: 'lighter levies', law: 'levy', ok: r => (r.laws.levy != null ? r.laws.levy : 1) > 0 },
  army: { t: 'gold for the host', ok: () => true },
  works: { t: 'gold for walls, roads and granaries', ok: () => true },
  temple: { t: 'gold for the temples', ok: () => true },
  grant: { t: 'a pension for their own house', ok: () => true, house: true },
};
RI.PUSH = PUSH;
// how each want and fear leans on each push (-1..1)
const W_ST = {
  glory: { levyUp: 1, army: .9, taxUp: .4, levyDown: -.8, taxDown: -.3 },
  peace: { levyDown: .8, taxDown: .4, levyUp: -.8, army: -.5 },
  wealth: { taxDown: .7, grant: 1, taxUp: -.6, works: -.3 },
  order: { authUp: 1, taxUp: .7, authDown: -1, grant: -.4, taxDown: -.5 },
  liberty: { authDown: 1, taxDown: .45, levyDown: .4, authUp: -1, taxUp: -.5, levyUp: -.4 },
  faith: { temple: 1, taxUp: .2 },
  works: { works: 1, taxUp: .5, taxDown: -.4 },
  crown: { authDown: .7, grant: .4, authUp: -.6 },
};
const F_ST = {
  war: { levyUp: -.6, army: -.4, levyDown: .4 },
  ruin: { taxUp: -.5, works: -.4, army: -.3, grant: .3 },
  tyranny: { authUp: -1, authDown: .6 },
  unrest: { taxUp: -.6, taxDown: .4, levyUp: -.3, authUp: .3 },
  heresy: { temple: .8 },
  rival: { grant: -.5, authUp: .2 },
};
const SEAT_ST = {
  treasurer: (k, r, Y) => k === 'taxUp' ? (Y < 1 || r.debt > 0 ? .5 : -.2) : k === 'taxDown' ? (Y > 2.5 ? .4 : -.3) : 0,
  marshal: (k, r) => k === 'army' ? .5 : k === 'levyUp' ? (A.atWar(r.id).length || (A.threatsTo && A.threatsTo(r.id).length) ? .5 : .1) : 0,
  chaplain: k => k === 'temple' ? .6 : 0,
  chancellor: k => k === 'works' ? .2 : 0,
  spymaster: k => k === 'authUp' ? .25 : 0,
};
const years = r => (r.treasury || 0) / Math.max(1, r.income || 1);
RI.years = years;
// the realm's own custom in each law (what it had when the court first met): pushes away from it lose force
RI.lawPos = (r, law) => law === 'tax' ? taxIdx(r) : law === 'authority' ? (r.laws.authority != null ? r.laws.authority : 1) : (r.laws.levy != null ? r.laws.levy : 1);
RI.trad = (r, law) => { const t = r.riLaw0 || {}; return law === 'tax' ? 2 : law === 'authority' ? (t.authority != null ? t.authority : 1) : 1; };
RI.awayMul = function (r, k) {
  const P = PUSH[k]; if (!P || !P.law) return 1;
  const cur = RI.lawPos(r, P.law), nv = cur + (/Up$/.test(k) ? 1 : -1), t = RI.trad(r, P.law);
  return Math.abs(nv - t) > Math.abs(cur - t) ? Math.pow(.55, Math.abs(nv - t) - 1) * (Math.abs(nv - t) >= 2 ? .8 : 1) : 1.15;
};
// a voice's stance on push k: positive pushes for it, negative against; pure
RI.stance = function (v, k, r) {
  const a = RI.aims(v.p);
  if (!a || !PUSH[k] || !PUSH[k].ok(r)) return 0;
  if (PUSH[k].house && !v.h) return 0;
  let s = ((W_ST[a.want] || {})[k] || 0) + .7 * ((F_ST[a.fear] || {})[k] || 0);
  if (v.seat && SEAT_ST[v.seat]) s += SEAT_ST[v.seat](k, r, years(r));
  const Y = years(r);
  // lords who already pay little care less for lighter taxes; a crown already taking much asks less for more
  const tx = (r.laws && r.laws.tax) || 1;
  if (k === 'taxUp') s *= (Y < .5 || r.debt > r.income ? 1.5 : Y > 2 ? .3 : 1) * (tx > 1 ? .6 : 1);
  if (k === 'taxDown') s *= (Y > 2.5 ? 1.4 : Y < 1 ? .2 : 1) * (tx < 1 ? .5 : 1);
  if ((k === 'levyUp' || k === 'army') && A.atWar(r.id).length) s *= s > 0 ? 1.5 : .6;
  if (k === 'grant' && v.h) s *= (v.h.op != null ? v.h.op : 50) < 40 ? 1.4 : .6;
  if (s > 0) s *= RI.awayMul(r, k);
  return clamp(s, -1.5, 1.5);
};

// the people who speak at court: the council, and the heads of the four strongest houses; pure (never makes a head)
RI.topHouses = rid => A.realmHouses(rid).slice().sort((a, b) => A.houseStrength(b) - A.houseStrength(a) || String(a.id).localeCompare(String(b.id))).slice(0, 4);
RI.voices = function (r) {
  if (!r) return [];
  const out = [], seen = new Set(), pcId = A.S.pc;
  const all = A.realmHouses(r.id).reduce((a, h) => a + A.houseStrength(h), 0) || 1;
  for (const seat of SEATS()) {
    const p = A.P((r.council || {})[seat]);
    if (!live(p) || seen.has(p.id) || p.id === pcId) continue;
    seen.add(p.id);
    const h = houseOf(p);
    out.push({ p, seat, h: h && h.realm === r.id && !h.extinct ? h : null, w: 1 + (h && h.realm === r.id ? .3 : 0) });
  }
  for (const h of RI.topHouses(r.id)) {
    const p = h.headPid ? A.P(h.headPid) : null;
    if (!live(p) || p.id === pcId || p.id === r.ruler) continue;
    const share = A.houseStrength(h) / all;
    if (seen.has(p.id)) { const v = out.find(x => x.p === p); v.h = h; v.w = r2(v.w + share * 2); continue; }
    seen.add(p.id);
    out.push({ p, h, w: r2(clamp(.4 + share * 2.5, .4, 1.5)) });
  }
  return out;
};
RI.voiceLabel = (v, r) => v.seat ? `${A.COUNCIL[v.seat].name}` : v.h ? `head of ${v.h.name}` : 'at court';

// the crown's own lean on a push, from the ruler's temper: [[label, value, fromTraits]]
RI.lean = function (r, k) {
  const P = RI.rax(r), out = [];
  const add = (l, v) => { if (Math.abs(v) >= .02) out.push([l, r2(v), 1]); };
  if (k === 'taxUp') { add('A greedy crown', .25 * Math.max(0, P.greed)); add('A generous crown', -.2 * Math.max(0, P.warmth)); }
  if (k === 'taxDown') { add('A generous crown', .25 * Math.max(0, P.warmth)); add('A greedy crown', -.25 * Math.max(0, P.greed)); }
  if (k === 'authUp') { add('A proud crown', .25 * Math.max(0, P.pride)); add('A cautious crown', -.15 * Math.max(0, P.caution)); }
  if (k === 'authDown') { add('A cautious crown', .2 * Math.max(0, P.caution)); add('A proud crown', -.3 * Math.max(0, P.pride)); }
  if (k === 'levyUp') add(P.warLog >= 0 ? 'A warlike crown' : 'A peaceable crown', .12 * P.warLog);
  if (k === 'levyDown') { add(P.warLog >= 0 ? 'A warlike crown' : 'A peaceable crown', -.12 * P.warLog); add('A kind crown', .1 * Math.max(0, P.warmth)); }
  return out;
};
RI.need = function (r, k) {
  const Y = years(r), out = [], m = Math.round(Y * 12);
  const tre = m < 24 ? `The treasury holds ${m} month${m === 1 ? '' : 's'}` : `The treasury holds ${Math.round(Y * 10) / 10} years`;
  if (k === 'taxUp') {
    if (Y < .5 || r.debt > r.income) out.push([r.debt > r.income ? 'The crown is deep in debt' : tre, .3]);
    else if (Y > 2) out.push([tre, -.3]);
    else if (RI.nextWork && Y < (RI.reserveYears ? RI.reserveYears(r) : 1.5) + .3 && RI.nextWork(r, RI.rax(r), null)) out.push(['The crown has works it cannot pay for', .1]);
  }
  if (k === 'taxDown') { if (Y > 2.5) out.push([tre, .25]); else if (Y < 1) out.push([tre, -.4]); else if (RI.nextWork && RI.nextWork(r, RI.rax(r), null)) out.push(['The crown has works to pay for', -.15]); }
  if (k === 'levyUp' && (A.atWar(r.id).length || (A.threatsTo && A.threatsTo(r.id).length))) out.push([A.atWar(r.id).length ? 'The realm is at war' : 'Strong, hungry neighbours', .15]);
  if (k === 'authUp' && r.stability < 50) out.push([`Stability ${Math.round(r.stability)}`, -.1]);
  return out;
};

// the tally of every voice on every push; pure
RI.tally = function (r, extra) {
  const V = RI.voices(r), T = {};
  for (const k in PUSH) {
    const t = { k, sup: 0, opp: 0, pro: [], con: [] };
    for (const v of V) {
      const s = RI.stance(v, k, r);
      if (s > .05) { t.sup += v.w * s; t.pro.push([v, r2(v.w * s)]); } else if (s < -.05) { t.opp += v.w * -s; t.con.push([v, r2(v.w * -s)]); }
    }
    t.pro.sort((a, b) => b[1] - a[1]); t.con.sort((a, b) => b[1] - a[1]);
    t.sup = r2(t.sup); t.opp = r2(t.opp);
    T[k] = t;
  }
  if (extra && extra.k && T[extra.k]) { if (extra.side === 'for') T[extra.k].sup = r2(T[extra.k].sup + extra.w); else T[extra.k].opp = r2(T[extra.k].opp + extra.w); }
  return T;
};
// the loudest law and the loudest spending push; what the realm plainly needs (an empty treasury, a war) is heard first
RI.agendaOf = function (T, laws, r) {
  const need = t => r && PUSH[t.k].law ? 3 * RI.need(r, t.k).reduce((a, x) => a + Math.max(0, x[1]), 0) : 0;
  const score = t => t.sup - t.opp * .5 + need(t);
  return Object.values(T).filter(t => !!PUSH[t.k].law === laws && t.pro.length && t.sup > .4).sort((a, b) => score(b) - score(a))[0] || null;
};
// the odds that the crown grants a law push, with its reasons
RI.odds = function (r, t) {
  const why = [], ln = RI.lean(r, t.k), nd = RI.need(r, t.k);
  const bal = .55 * (t.sup - t.opp) / (t.sup + t.opp + .5);
  const top = t.pro[0], foe = t.con[0];
  if (top) why.push([`${A.fullName(top[0].p, false)} (${RI.voiceLabel(top[0], r)}) wants ${RI.wantText(RI.aims(top[0].p).want)}`, r2(bal > 0 ? bal : .05)]);
  if (foe) why.push([`${A.fullName(foe[0].p, false)} (${RI.voiceLabel(foe[0], r)}) fears ${RI.fearText(RI.aims(foe[0].p).fear)}`, -r2(Math.max(.05, t.opp / (t.sup + t.opp + .5) * .55))]);
  const p = clamp(.2 + bal + ln.reduce((a, x) => a + x[1], 0) + nd.reduce((a, x) => a + x[1], 0), .03, .9);
  return { p: r2(p), why: why.concat(ln, nd) };
};

// ---------------------------------------------------------------- applying a law

const lawText = { taxUp: 'raises taxes', taxDown: 'lowers taxes', authUp: 'raises crown authority', authDown: 'lowers crown authority', levyUp: 'calls heavier levies', levyDown: 'lightens the levies' };
// effects on every house of the realm when the law passes (the release's own setLaw moves them -15 and +10)
const HOUSE_FX = { taxUp: -4, taxDown: 3, authUp: -8, authDown: 5, levyUp: -3, levyDown: 2 };
RI.applyLaw = function (r, k) {
  A.polInit && A.polInit(r);
  if (k === 'taxUp' || k === 'taxDown') r.laws.tax = TAXES[clamp(taxIdx(r) + (k === 'taxUp' ? 1 : -1), 0, 4)];
  if (k === 'authUp') { r.laws.authority = clamp((r.laws.authority || 0) + 1, 0, 3); r.legit = clamp((r.legit || 50) - 5, 0, 100); }
  if (k === 'authDown') { r.laws.authority = clamp((r.laws.authority || 0) - 1, 0, 3); r.legit = clamp((r.legit || 50) - 2, 0, 100); }
  if (k === 'levyUp' || k === 'levyDown') {
    const cur = r.laws.levy != null ? r.laws.levy : 1, nv = clamp(cur + (k === 'levyUp' ? 1 : -1), 0, 2);
    if (A.LEVY) r.levy = Math.round(r.levy * A.LEVY[nv][1] / A.LEVY[cur][1]);
    r.laws.levy = nv;
  }
  for (const h of A.realmHouses(r.id)) h.op = clamp((h.op != null ? h.op : 50) + (HOUSE_FX[k] || 0), 0, 100);
};
RI.lawNow = r => {
  const T = A.TAX && A.TAX[(r.laws && r.laws.tax) || 1], au = A.AUTH && A.AUTH[(r.laws && r.laws.authority) != null ? r.laws.authority : 1], lv = A.LEVY && A.LEVY[(r.laws && r.laws.levy) != null ? r.laws.levy : 1];
  return { tax: T ? T[0] : 'Customary', auth: au ? au[0] : 'Limited', levy: lv ? lv[0] : 'Customary levies' };
};

const logCourt = (r, e) => {
  if (!Array.isArray(r.riCourt)) r.riCourt = [];
  e.y = A.S.year;
  r.riCourt.unshift(e);
  if (r.riCourt.length > RI.COURT_LOG) r.riCourt.length = RI.COURT_LOG;
  return e;
};
RI.logCourt = logCourt;
const ids = list => list.slice(0, 3).map(x => x[0].p.id);
const aiLog = (k, r, text, why, who) => { if (A.aiLogAdd) try { A.aiLogAdd(k, r.id, null, text, why, who); } catch (e) {} };

// ---------------------------------------------------------------- the council: named people in every seat

const SEAT_RX = {
  chancellor: /chancellor|envoy|ambassador|speaker|vizier|herald|seneschal/i,
  marshal: /marshal|general|warlord|constable|commander|captain-general|war-?chief/i,
  treasurer: /treasurer|steward|exchequer|banker|master of coin|reeve|factor|purse/i,
  spymaster: /spymaster|spy|whisper|intelligencer|listener|watcher|eyes of/i,
  chaplain: /chaplain|bishop|abbot|abbess|priest|confessor|prior|mother of|keeper of the/i,
};
const ROLE_SEAT = { general: 'marshal', spy: 'spymaster', priest: 'chaplain', merchant: 'treasurer', scholar: 'chancellor', noble: 'chancellor', royal: 'chancellor' };
const castAgeOk = c => { const R = GD.RACES[A.CAST_RACE ? A.CAST_RACE[c.race] || 'human' : 'human'] || GD.RACES.human; const age = A.S.year - (c.born || A.S.year - 40); return age >= R.adult + 2 && age < R.old + 8; };
// candidates for the seats of realm r: [{cid | p, kind}]; pure apart from reading people
const candidates = function (r) {
  const out = [], taken = new Set(Object.values(r.council || {})), pcId = A.S.pc, ru = A.P(r.ruler);
  for (const c of Object.values(LORE.cast || {})) {
    if (c.realm !== r.id || c.ruler || c.role === 'ruler') continue;
    const pid = A.S.castMap && A.S.castMap[c.id], p = pid ? A.P(pid) : null;
    if (p ? (!p.alive || p.ruler || p.id === pcId || taken.has(p.id) || p.realm !== r.id) : !castAgeOk(c)) continue;
    out.push({ cid: c.id, p, c, kind: 'cast' });
  }
  for (const h of RI.topHouses(r.id)) { const p = h.headPid ? A.P(h.headPid) : null; if (live(p) && !p.ruler && p.id !== pcId && !taken.has(p.id) && !out.some(x => x.p === p)) out.push({ p, h, kind: 'house' }); }
  if (ru) for (const x of A.relsOf(ru, ['sibling', 'child'])) { const p = x.p; if (live(p) && A.isAdult(p) && !p.ruler && p.id !== pcId && !taken.has(p.id) && !out.some(y => y.p === p)) out.push({ p, kind: 'kin' }); }
  return out;
};
const fit = (seat, x, ru) => {
  const sk = A.COUNCIL[seat].skill;
  let v = x.p ? Math.min(60, A.skill(x.p, sk)) : 35;
  const title = x.c ? String(x.c.title || '') : x.p ? String(x.p.title || x.p.occ || '') : '';
  if (SEAT_RX[seat].test(title)) v += 60;
  if (x.c && ROLE_SEAT[x.c.role] === seat) v += 30;
  if (x.h) v += { N01: 20, N02: 15, N03: 10 }[x.h.rung] || 4;
  if (x.kind === 'kin') v += ru && (ru.traits || []).includes('paranoid') ? 30 : 6;
  return v;
};
RI.fillCouncil = function (r) {
  if (!r || !r.alive || r.landless || !A.COUNCIL) return [];
  const pc = A.pc();
  if (pc && pc.ruler === r.id) return [];        // a player ruler appoints their own
  r.council = r.council || {};
  const ru = A.P(r.ruler); if (!ru) return [];
  const named = [];
  // a new ruler brings favourites: each seat may change hands
  const fresh = r.riRulerSeen != null && r.riRulerSeen !== r.ruler;
  r.riRulerSeen = r.ruler;
  for (const seat of SEATS()) {
    const cur = A.P(r.council[seat]);
    if (cur && cur.id === A.S.pc) continue;      // the player's seat is the release's business
    const vacant = !live(cur) || cur.ruler || cur.realm !== r.id;
    if (!vacant && !(fresh && A.chance(.35))) continue;
    const C = candidates(r);
    if (!C.length) { if (vacant) delete r.council[seat]; continue; }
    const best = C.map(x => [x, fit(seat, x, ru) + A.rf(0, 15)]).sort((a, b) => b[1] - a[1])[0][0];
    const p = best.p || A.personFromCast(best.cid);
    if (!live(p)) continue;
    const sk = A.COUNCIL[seat].skill;
    p.skills = p.skills || {};
    p.skills[sk] = Math.max(p.skills[sk] || 0, A.ri(25, 55));   // nobody is made Marshal without knowing the trade
    if (!p.occ || /^(a lord of the realm|a general)$/.test(p.occ)) p.occ = `${A.COUNCIL[seat].name} of ${r.short}`;
    r.council[seat] = p.id;
    named.push([seat, p]);
    // the first filling of a council is not news; a seat changing hands is
    if (r.riSeated) logCourt(r, { k: 'seat', who: p.id, seat, out: cur && cur.id !== p.id ? cur.id : null, yes: true, why: [[vacant ? (cur && !cur.alive ? 'The last holder died' : 'The seat stood empty') : 'A new ruler names favourites', 1]] });
  }
  r.riSeated = true;
  return named;
};
// make sure the heads of the strongest houses exist as people (A.houseHead creates one when the lore has none)
RI.ensureHeads = r => { for (const h of RI.topHouses(r.id)) A.houseHead(h.id); };

// ---------------------------------------------------------------- vassal deals

// a faction close to rising is offered something: a pension (paid by the treasury), a seat for its leader, or nothing
RI.deal = function (r) {
  const fs = A.factionsOf(r.id).filter(f => (f.discontent || 0) >= 40 && (f.power != null ? f.power : A.factionPower(f)) >= .22);
  if (!fs.length) return null;
  const f = fs.sort((a, b) => (b.discontent || 0) - (a.discontent || 0))[0], P = RI.rax(r), F = (A.FACTIONS || {})[f.kind] || {};
  const lead = A.S.houses[f.leader], head = lead ? A.houseHead(lead.id) : null;
  if (!head || !live(head) || head.id === A.S.pc) return null;
  const why = [[`The ${F.name || 'faction'} holds ${Math.round((f.power || 0) * 100)}% of the swords`, .3], [`Discontent ${Math.round(f.discontent)}`, .2]];
  const pAct = clamp(.35 + .3 * P.caution + .2 * P.warmth - .35 * P.pride - .15 * P.wrath, .05, .85);
  for (const [l, v] of [['A cautious crown', .3 * P.caution], ['A proud crown', -.35 * P.pride], ['A generous crown', .2 * P.warmth]]) if (Math.abs(v) >= .03) why.push([l, r2(v), 1]);
  if (!A.chance(pAct)) {
    logCourt(r, { k: 'refuse', who: head.id, house: lead.id, fac: f.kind, yes: false, why });
    aiLog('court', r, `will not treat with the ${F.name || 'faction'} of ${lead.name}.`, why.map(x => [x[0], -x[1], x[2]]));
    return 'refuse';
  }
  const Y = years(r), cost = Math.round(clamp((f.power || .3) * .3, .05, .2) * Math.max(1, r.income));
  const seatFor = SEATS().find(s => { const c = A.P((r.council || {})[s]); return !live(c) || (c.id !== A.S.pc && !(houseOf(c) && f.members.includes(houseOf(c).id))); });
  const inCouncil = Object.values(r.council || {}).includes(head.id);
  // greedy crowns prefer a seat to gold; a crown short of gold has no choice
  const usePension = Y > .8 && r.treasury > cost * 1.5 && !(P.greed > .3 && seatFor && !inCouncil);
  if (usePension) {
    r.treasury -= cost;
    RI.book && RI.book(r, 'bribes', cost);
    f.discontent = clamp((f.discontent || 0) - 35, 0, 100);
    for (const id of f.members) if (A.S.houses[id]) A.S.houses[id].op = clamp((A.S.houses[id].op || 40) + 8, 0, 100);
    logCourt(r, { k: 'pension', who: head.id, house: lead.id, fac: f.kind, amt: cost, yes: true, why });
    aiLog('court', r, `pays a pension of ${A.fmt ? A.fmt(cost) : cost} to ${lead.name} to quiet the ${F.name || 'faction'}.`, why);
    return 'pension';
  }
  if (seatFor && !inCouncil) {
    const out = A.P(r.council[seatFor]);
    r.council[seatFor] = head.id;
    const sk = A.COUNCIL[seatFor].skill; head.skills = head.skills || {}; head.skills[sk] = Math.max(head.skills[sk] || 0, A.ri(20, 45));
    f.discontent = clamp((f.discontent || 0) - 25, 0, 100);
    lead.op = clamp((lead.op || 40) + 15, 0, 100);
    const oh = out && houseOf(out); if (oh && oh.realm === r.id) oh.op = clamp((oh.op || 50) - 10, 0, 100);
    logCourt(r, { k: 'seatdeal', who: head.id, house: lead.id, seat: seatFor, out: out && live(out) ? out.id : null, fac: f.kind, yes: true, why });
    aiLog('court', r, `gives the seat of ${A.COUNCIL[seatFor].name} to ${A.fullName(head, false)} of the ${F.name || 'faction'}.`, why);
    return 'seat';
  }
  logCourt(r, { k: 'refuse', who: head.id, house: lead.id, fac: f.kind, yes: false, why: why.concat([['Nothing left to offer', -.2]]) });
  return 'refuse';
};

// ---------------------------------------------------------------- the yearly session

RI.session = function (r) {
  if (!r || !r.alive || r.isRebel || !A.COUNCIL) return null;
  A.polInit && A.polInit(r);
  if (!r.riLaw0) r.riLaw0 = { authority: r.laws.authority != null ? r.laws.authority : 1 };
  RI.ensureHeads(r);
  RI.fillCouncil(r);
  const pc = A.pc(), playerRules = !!(pc && pc.ruler === r.id);
  const ag = r.riAgenda && r.riAgenda.y === A.S.year ? r.riAgenda : null;
  const pv = ag && ag.pc && ag.pc.y === A.S.year ? { k: ag.k, side: ag.pc.side, w: ag.pc.w } : null;
  const T = RI.tally(r, pv);
  let res = null;
  if (playerRules) {
    // the player hears the loudest push as a petition (event ri_court_push); the crown's choice is theirs
    const t = RI.agendaOf(T, true, r);
    if (t && t.pro[0] && A.chance(.6) && !A.S.queue.some(q => q.ev === 'ri_court_push')) {
      const top = t.pro[0][0], foe = t.con[0] ? t.con[0][0] : null;
      A.queue({ type: 'event', ev: 'ri_court_push', ctx: { pid: top.p.id, push: PUSH[t.k].t, riK: t.k, seatT: top.seat ? 'your ' + A.COUNCIL[top.seat].name : RI.voiceLabel(top, r), wantT: RI.wantText(RI.aims(top.p).want),
        foeName: foe ? A.fullName(foe.p, false) : 'nobody', foeT: foe ? RI.fearText(RI.aims(foe.p).fear) : 'nothing', foeId: foe ? foe.p.id : null, npcMove: true } });
    }
  } else {
    RI.deal(r);
    let t = ag && T[ag.k] && PUSH[ag.k].ok(r) && T[ag.k].pro.length ? T[ag.k] : RI.agendaOf(T, true, r);
    if (t) {
      const o = RI.odds(r, t), yes = A.chance(o.p), top = t.pro[0] ? t.pro[0][0] : null;
      if (yes) {
        RI.applyLaw(r, t.k);
        for (const [v, s] of t.pro) if (v.h) v.h.op = clamp((v.h.op != null ? v.h.op : 50) + Math.round(4 * s), 0, 100);
        for (const [v, s] of t.con) if (v.h) v.h.op = clamp((v.h.op != null ? v.h.op : 50) - Math.round(4 * s), 0, 100);
      } else if (top && top.h) top.h.op = clamp((top.h.op != null ? top.h.op : 50) - 3, 0, 100);
      res = logCourt(r, { k: t.k, who: top ? top.p.id : null, seat: top && top.seat || null, house: top && top.h ? top.h.id : null, sup: ids(t.pro), opp: ids(t.con), yes, p: Math.round(o.p * 100), Y: r2(years(r)), why: o.why.slice(0, 5), pcSide: pv ? pv.side : null });
      if (top) aiLog('court', r, `${yes ? lawText[t.k] : 'refuses ' + PUSH[t.k].t} at the urging of ${A.fullName(top.p, false)}.`, o.why.map(x => [x[0], yes ? x[1] : -x[1], x[2]]));
    }
    // the loudest spending push steers next year's treasury (RI.spend)
    const s = RI.agendaOf(T, false);
    r.riPri = s ? { k: s.k, y: A.S.year, who: s.pro[0][0].p.id, house: s.pro[0][0].h ? s.pro[0][0].h.id : null } : null;
  }
  // what the court will hear next year, for the player to see and sway
  const T2 = RI.tally(r), nx = RI.agendaOf(T2, true, r);
  r.riAgenda = nx ? { y: A.S.year + 1, k: nx.k, who: nx.pro[0][0].p.id } : null;
  return res;
};

// ---------------------------------------------------------------- factions made of people

// which faction a court person's want calls for, if the realm gives it a reason
RI.facFor = function (r, v) {
  const a = RI.aims(v.p), h = v.h, op = h && h.op != null ? h.op : 50, war = A.atWar(r.id).length > 0, auth = r.laws && r.laws.authority != null ? r.laws.authority : 1;
  if (!a || !h) return null;
  if (a.want === 'crown' && op < 55 && (r.legit < 60 || r.stability < 45) && r.gov === 'hereditary') return 'claimant';
  if ((a.want === 'liberty' || a.fear === 'tyranny') && auth >= 1 && op < 55) return 'liberty';
  if (a.want === 'glory' && !war && op > 30 && !r.isRebel) return 'war';
  if ((a.want === 'peace' || a.fear === 'war') && war && r.exhaustion > 25) return 'peace';
  return null;
};
RI.joinFactions = function (r) {
  const S0 = A.S;
  S0.factions = S0.factions || [];
  for (const v of RI.voices(r)) {
    if (!v.h) continue;
    const kind = RI.facFor(r, v);
    if (!kind || S0.factions.some(f => f.realm === r.id && f.members.includes(v.h.id)) || !A.chance(.3)) continue;
    let f = S0.factions.find(x => x.realm === r.id && x.kind === kind);
    if (!f) { f = { id: 'F' + (S0.nextFaction = (S0.nextFaction || 0) + 1), realm: r.id, kind, members: [], leader: v.h.id, start: S0.year, discontent: 0, riBy: v.p.id }; S0.factions.push(f); }
    f.members.push(v.h.id);
  }
};
// councillors who share a faction's aim; pure
RI.backers = function (f) {
  const r = A.realm(f.realm); if (!r) return [];
  return RI.voices(r).filter(v => v.seat && !(v.h && f.members.includes(v.h.id)) && RI.facFor(r, Object.assign({}, v, { h: v.h || { op: 40 } })) === f.kind).map(v => v.p);
};
const basePower = A.factionPower;
A.factionPower = function (f) {
  const v = basePower.apply(this, arguments);
  try {
    if (!f || !A.realm(f.realm)) return v;
    const r = A.realm(f.realm), lead = A.S.houses[f.leader], head = lead && lead.headPid ? A.P(lead.headPid) : null;
    let b = .04 * RI.backers(f).length;
    if (live(head) && RI.facFor(r, { p: head, h: lead }) === f.kind) b += .05;
    return v + Math.min(.15, b);
  } catch (e) { return v; }
};

// ---------------------------------------------------------------- taxes weigh on the lords of AI realms

const TAX_OP = { .6: 1.5, .85: .5, 1: 0, 1.2: -1.5, 1.5: -3 }, TAX_ST = { .6: .6, .85: .25, 1: 0, 1.2: -1, 1.5: -2.2 };
RI.TAX_OP = TAX_OP; RI.TAX_ST = TAX_ST;
const baseFactionsYear = A.factionsYear;
A.factionsYear = function (r) {
  const pc = A.pc(), mine = !!(r && pc && pc.ruler === r.id);
  if (r && r.alive && !r.isRebel && !mine) {
    try {
      // the release's AI realms never felt their taxes (A.vassalYear does this for the player's realm only)
      const t = (r.laws && r.laws.tax) || 1;
      if (TAX_OP[t]) for (const h of A.realmHouses(r.id)) h.op = clamp((h.op != null ? h.op : 50) + TAX_OP[t], 0, 100);
      if (TAX_ST[t]) r.stability = clamp(r.stability + TAX_ST[t], 0, 100);
    } catch (e) { console.error('[ri] tax drift', e); }
  }
  try { if (r && r.alive) RI.session(r); } catch (e) { console.error('[ri] court session', e); }
  const out = baseFactionsYear.apply(this, arguments);
  try { if (r && r.alive && !r.isRebel) RI.joinFactions(r); } catch (e) { console.error('[ri] factions', e); }
  return out;
};

// ---------------------------------------------------------------- claimants: blood, ambition and backers

// the houses that would back a claimant: their own house, the members of a claimant's faction, and houses that hate the crown
RI.backersOf = function (r, cl) {
  const out = new Set();
  if (cl && cl.house && A.S.houses[cl.house] && A.S.houses[cl.house].realm === r.id && A.S.houses[cl.house].kind !== 'royal') out.add(cl.house);
  for (const f of A.factionsOf(r.id)) if (f.kind === 'claimant') for (const id of f.members) out.add(id);
  for (const h of A.realmHouses(r.id)) if ((h.op != null ? h.op : 50) < 30) out.add(h.id);
  return [...out].filter(id => A.S.houses[id] && !A.S.houses[id].extinct);
};
RI.backShare = function (r, hs) {
  const all = A.realmHouses(r.id).reduce((a, h) => a + A.houseStrength(h), 0) || 1;
  return hs.reduce((a, id) => a + A.houseStrength(A.S.houses[id] || {}), 0) / all;
};
const baseFindClaimant = A.findClaimant;
A.findClaimant = function (r, heir, oldRuler) {
  try {
    if (!r || !heir) return baseFindClaimant.apply(this, arguments);
    const pc = A.pc(), cand = [];
    const adult = p => A.age(p) >= GD.RACES[p.race].adult;
    let pcKin = false;
    if (oldRuler) for (const x of A.relsOf(oldRuler, ['sibling', 'child'])) {
      if (!live(x.p) || x.p.id === heir.id || !adult(x.p)) continue;
      if (x.p.id === A.S.pc) { pcKin = true; continue; }
      cand.push({ p: x.p, blood: x.type === 'child' ? 3 : 2.5, rel: x.type === 'child' ? 'child of the late ruler' : 'sibling of the late ruler' });
    }
    // the player stands where the release put them: among the candidates, as likely as an average one of them
    const pcOk = pcKin || (pc && pc.alive && pc.realm === r.id && pc.id !== heir.id && (pc.house === r.house || (pc.noble && pc.noble.rung >= 6)) && adult(pc));
    if (!cand.length && !pcOk) {
      for (const h of A.realmHouses(r.id).filter(h => greatRung(h))) { const p = A.houseHead(h.id); if (live(p) && p.id !== heir.id && p.id !== A.S.pc && !p.ruler) cand.push({ p, blood: 1, rel: `head of ${h.name}` }); }
    }
    if (!cand.length && !pcOk) return null;
    const wOf = x => { const a = RI.aims(x.p), P = RI.ax(x.p), back = RI.backShare(r, RI.backersOf(r, x.p)); return x.blood * (1 + (a.want === 'crown' ? 1 : a.want === 'glory' ? .5 : 0) + .5 * Math.max(0, P.pride)) * (1 + 2 * back); };
    const W = cand.map(wOf);
    if (pcOk) { cand.push({ p: pc, blood: 1, rel: 'you' }); W.push(W.length ? W.reduce((a, b) => a + b, 0) / W.length : 1); }
    const i = A.wpick(cand.map((x, j) => j), j => W[j]);
    const x = cand[i];
    if (x.p.id !== A.S.pc) {
      const a = RI.aims(x.p), back = RI.backersOf(r, x.p);
      r.riClaim = { pid: x.p.id, y: A.S.year, rel: x.rel, want: a.want, back };
    }
    return x.p;
  } catch (e) { console.error('[ri] claimant', e); return baseFindClaimant.apply(this, arguments); }
};
// the share of the realm's army a claimant raises (patch RI-CLAIM-ARMY): what their backers bring
RI.claimShare = function (r, cl) {
  if (!r || !cl || cl.id === A.S.pc) return A.rf(.3, .6);
  const back = r.riClaim && r.riClaim.pid === cl.id ? r.riClaim.back : RI.backersOf(r, cl);
  return clamp(.22 + .9 * RI.backShare(r, back), .25, .65);
};
A.riClaimShare = RI.claimShare;
const baseSuccessionWar = A.successionWar;
A.successionWar = function (r, claimant) {
  const back = r && claimant && claimant.id !== A.S.pc ? (r.riClaim && r.riClaim.pid === claimant.id ? r.riClaim.back : RI.backersOf(r, claimant)) : [];
  const w = baseSuccessionWar.apply(this, arguments);
  try {
    if (w && back.length) {
      w.riBack = back.slice(0, 12);
      const names = back.map(id => A.S.houses[id]).filter(Boolean).sort((a, b) => A.houseStrength(b) - A.houseStrength(a)).slice(0, 3).map(h => h.name);
      if (names.length) A.news(`${names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0]} declare${names.length > 1 ? '' : 's'} for ${A.fullName(claimant, false)}.`, 'war');
      const a = RI.aims(claimant);
      logCourt(r, { k: 'claim', who: claimant.id, yes: true, back: back.slice(0, 6), why: [[r.riClaim && r.riClaim.pid === claimant.id ? cap(r.riClaim.rel) : 'A claim of blood', 1], [`Wants ${RI.wantText(a.want)}`, .5], [`${back.length} house${back.length === 1 ? '' : 's'} behind them (${Math.round(RI.backShare(r, back) * 100)}% of the swords)`, .5]] });
    }
  } catch (e) { console.error('[ri] succession', e); }
  return w;
};
// after a war of succession: the winners' backers are honoured, the losers' are hunted
A.on && A.on('warEnd', function (w, result, text, live0) {
  try {
    if (!w || w.cb !== 'throne' || !Array.isArray(w.riBack) || live0 === false) return;
    const r = A.realm(w.leadD); if (!r || !r.alive) return;
    const cl = A.P(w.claimant), won = result === 'att' && cl && r.ruler === cl.id;
    const hunted = [];
    for (const id of w.riBack) {
      const h = A.S.houses[id]; if (!h || h.extinct) continue;
      if (won) h.op = clamp((h.op || 40) + 25, 0, 100);
      else if (result === 'def') {
        h.op = clamp((h.op || 40) - 20, 0, 100);
        const head = h.headPid ? A.P(h.headPid) : null;
        if (live(head) && head.id !== A.S.pc && !head.ruler && A.chance(.35)) { A.kill(head, 'beheaded for treason', true); h.headPid = null; hunted.push(h.name); }
      } else h.op = clamp((h.op || 40) - 8, 0, 100);
    }
    if (won) for (const h of A.realmHouses(r.id)) if (!w.riBack.includes(h.id)) h.op = clamp((h.op || 50) - 10, 0, 100);
    if (hunted.length) A.news(`${r.short}: the heads of ${hunted.join(', ')} roll for backing the claimant.`, 'crown');
    logCourt(r, { k: won ? 'claimwon' : result === 'def' ? 'claimlost' : 'claimwhite', who: w.claimant, yes: !!won, back: w.riBack.slice(0, 6), hunted, why: [[won ? 'The claimant took the throne' : result === 'def' ? 'The crown crushed the claimant' : 'The war ended in a bargain', 1]] });
  } catch (e) { console.error('[ri] warEnd', e); }
});

// ---------------------------------------------------------------- the player at court

// may the player speak at this court? [ok, why]
RI.canSpeak = function (pc, r) {
  if (!pc || !r || !A.isAdult(pc)) return [false, 'Too young to be heard.'];
  if (pc.ruler) return [false, 'You are the crown.'];
  if ((pc.noble ? pc.noble.realm : pc.realm) !== r.id) return [false, 'Not your realm.'];
  if (pc.office || (pc.noble && pc.noble.rung >= 2) || (pc.job && pc.job.c === 'courtier' && pc.job.r >= 2) || A.classOf(pc) >= 5) return [true, ''];
  return [false, 'Only lords, knights, councillors and courtiers are heard at court.'];
};
RI.pcWeight = pc => r2(pc.office ? 1 : clamp(.25 + .1 * (pc.noble ? pc.noble.rung : 0) + (pc.fame || 0) / 200, .25, 1));
RI.giftCost = (pc, t) => Math.max(15, Math.round(6 * Math.pow(Math.max(2, A.classOf(t)), 2) * (pc.noble && pc.noble.rung >= 4 ? 2 : 1)));

Object.assign(UI.A, {
  riVoice(v) {
    const pc = A.pc(), rid = pc && (pc.noble ? pc.noble.realm : pc.realm), r = A.realm(rid);
    const ag = r && r.riAgenda;
    const [ok, why] = RI.canSpeak(pc, r);
    if (!ok || !ag || ag.y !== A.S.year + 1) { if (!ok) A.log(why, 'warn'); return; }
    if (A.S.time < 1) { A.log('Not enough initiative.', 'warn'); return; }
    if (A.S.yearActs.riVoice) { A.log('You have already spoken at court this year.', 'warn'); return; }
    A.S.time -= 1; A.S.yearActs.riVoice = 1;
    const side = v === 'against' ? 'against' : 'for';
    ag.pc = { y: ag.y, side, w: RI.pcWeight(pc) };
    const who = A.P(ag.who);
    if (who && who.alive) { if (pc.rel[who.id]) A.addOp(pc, who, side === 'for' ? 6 : -6); else A.link(pc, who, 'acquaint', side === 'for' ? 15 : -10, 'acquaint'); }
    A.log(`You speak ${side === 'for' ? 'for' : 'against'} ${PUSH[ag.k].t} before the court. ${who ? A.fullName(who, false) + ' marks it.' : ''}`, side === 'for' ? 'good' : 'warn');
    UI.refreshTab ? UI.refreshTab() : UI.refresh();
  },
  riGift(pid) {
    const pc = A.pc(), t = A.P(pid);
    if (!pc || !live(t) || !A.isAdult(pc)) return;
    const cost = RI.giftCost(pc, t);
    if (pc.coin < cost) { A.log(`A gift fit for ${A.fullName(t, false)} costs ${A.coin(cost)}.`, 'warn'); return; }
    const k = 'riGift_' + pid, n = A.S.yearActs[k] || 0;
    pc.coin -= cost;
    RI.purse && RI.purse(pc, 'gifts', -cost, 'Gifts and favours at court');
    A.S.yearActs[k] = n + 1;
    const d = n ? 3 : 10;
    if (pc.rel[t.id]) A.addOp(pc, t, d); else A.link(pc, t, 'acquaint', 10 + d, 'acquaint');
    if (t.rel && t.rel[pc.id]) t.rel[pc.id].op = clamp(t.rel[pc.id].op + d * .2, -100, 100);
    A.log(`You send ${A.fullName(t, false)} a gift worth ${A.coin(cost)}. ${n ? 'A second gift in a year buys less.' : 'It is received.'}`, 'good');
    UI.refreshTab ? UI.refreshTab() : UI.refresh();
  },
});

// the player's voice on next year's agenda, from a choice (fx riVoice) or the court card (UI.A.riVoice)
RI.voiceFx = function (pc, side) {
  const r = A.realm(pc.noble ? pc.noble.realm : pc.realm), ag = r && r.riAgenda;
  if (!ag || ag.y !== A.S.year + 1) return false;
  ag.pc = { y: ag.y, side: side === 'against' ? 'against' : 'for', w: RI.pcWeight(pc) };
  return true;
};
// an NPC move: whoever will press next year's law asks the player for their voice (shares 21-npc-initiative's budget)
RI.askMonth = function (pc) {
  if (!pc || !pc.alive || pc.id !== A.S.pc || pc.ruler || pc.prison) return;
  const r = A.realm(pc.noble ? pc.noble.realm : pc.realm), ag = r && r.riAgenda;
  if (!ag || ag.y !== A.S.year + 1 || ag.pc || !RI.canSpeak(pc, r)[0]) return;
  if (pc.flags.ri_ask && A.S.year - pc.flags.ri_ask < 3) return;
  const who = A.P(ag.who);
  if (!live(who) || who.id === pc.id || A.S.queue.some(q => q.ev === 'ri_court_ask')) return;
  const NI = A.NPCI, st = NI && NI.state ? NI.state(pc) : null;
  if (st && (st.b < 1 || !NI.room(pc, A.S.year))) return;
  if (!A.chance(.1)) return;
  const V = RI.voices(r), v = V.find(x => x.p === who), T = RI.tally(r)[ag.k], foe = T && T.con[0] ? T.con[0][0].p : null;
  if (!v) return;
  if (st) { st.hy[A.S.year] = (st.hy[A.S.year] || 0) + 1; st.b -= 1; }
  pc.flags.ri_ask = A.S.year;
  A.queue({ type: 'event', ev: 'ri_court_ask', ctx: { pid: who.id, npcMove: true, push: PUSH[ag.k].t, seatT: v.seat ? 'the ' + A.COUNCIL[v.seat].name : 'head of ' + v.h.name,
    wantLine: `${cap(A.he(who))} wants ${RI.wantText(RI.aims(who).want)}, and this is the road to it.`, foeName: foe ? A.fullName(foe, false) : 'Nobody' } });
};
A.onMonth.push(pc => { try { RI.askMonth(pc); } catch (e) { console.error('[ri] ask', e); } });
// councils are named from the first day of a new world
A.on && A.on('worldInit', function () { try { for (const id in A.S.realms) { const r = A.S.realms[id]; if (r.alive && !r.isRebel) { RI.ensureHeads(r); RI.fillCouncil(r); } } } catch (e) { console.error('[ri] init', e); } });
