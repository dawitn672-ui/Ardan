// Money sinks that matter for the player (Road to Ten, Economy 6): "upkeep, taxes, bribes, retainers, ransoms,
// rebuilding after raids". Each one is a line in the year's money breakdown (pc.riPurse, drawn by UI.riPurseCard in
// the Holdings tab), next to the release's own lines, which A.moneyYear now reports (patch RI-MONEY-BOOK).
//
//   upkeep     a horse eats (unless your household is rich enough to keep a stable); knights and lords keep
//              household knights and men-at-arms by rung; a steward, castellan or factor draws a wage
//   taxes      the crown's tax goes into your realm's treasury, at your realm's tax law (which its court now
//              changes): a hearth tax and a tallage on wages where the realm bible's customs do not already
//              tax you, and a tenth on the rents of your holdings everywhere
//   bribes     fines and bribes paid to the law (A.punish), gifts at court (UI.A.riGift)
//   ransoms    a lost battle can see you taken (event ri_taken); the price follows your station and rank
//   rebuilding an enemy that holds or raids the province of a holding can burn it (event ri_burned); a burned
//              holding pays nothing until you rebuild it (Holdings tab)
// Engine paths draw dice; UI.riPurseCard only reads.

const RI = A.RI = A.RI || {};
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
(A.FX_EXTRA = A.FX_EXTRA || []).push('riRansom', 'riRebuild', 'riCourt', 'riVoice');

// ---------------------------------------------------------------- the year's book

// pc.riPurse = { cur: { y, lines: { key: [label, amount] } }, last: { ... } }; a save without it starts empty
RI.purseOf = pc => {
  const P = pc.riPurse && typeof pc.riPurse === 'object' ? pc.riPurse : (pc.riPurse = {});
  if (!P.cur || typeof P.cur !== 'object' || !P.cur.lines) P.cur = { y: A.S.year, lines: {} };
  return P;
};
RI.purse = function (pc, k, amt, label) {
  if (!pc || pc.id !== A.S.pc || !amt) return;
  const L = RI.purseOf(pc).cur.lines, cur = L[k];
  L[k] = [String(label || (cur && cur[0]) || k).replace(/[<>"]/g, ''), Math.round(((cur && cur[1]) || 0) + amt)];
};
RI.rollPurse = pc => { const P = RI.purseOf(pc); if (P.cur.y !== A.S.year) { P.last = P.cur; P.cur = { y: A.S.year, lines: {} }; } };

// ---------------------------------------------------------------- what a life costs

RI.HORSE_KEEP = { mule: 4, horse: 8, camel: 6, rouncey: 10, palfrey: 20, courser: 40, destrier: 60, barded: 90 };
RI.horseKeep = pc => {
  const m = pc.gear && pc.gear.mount, k = RI.HORSE_KEEP[m];
  if (!k || ['rich', 'lavish'].includes(pc.lifestyle || A.lifestyleDefault(pc))) return 0;   // a rich household keeps a stable
  return Math.round(k * (pc.mil && !pc.mil.merc ? .5 : 1));                                  // the army feeds a soldier's horse
};
// household knights and men-at-arms by rung, a squire and a groom for gentry, a household for a royal
RI.retainers = pc => {
  if (pc.ruler) return [0, ''];
  if (pc.noble && pc.noble.rung >= 2) { const R = GD.NOBLE_RUNGS[pc.noble.rung]; return [Math.round((R ? R.income : 0) * .12), 'Household knights and men-at-arms']; }
  if (pc.status === 'gentry') return [20, 'A squire and a groom'];
  if (pc.status === 'royal') return [150, 'Your household'];
  return [0, ''];
};
const CIVIL_STAFF = ['steward', 'castellan', 'factor'];
RI.staffWages = pc => {
  let n = 0;
  for (const k in pc.staff || {}) {
    const type = k.replace(/\d+$/, '').split(':')[0], id = pc.staff[k];
    if (!CIVIL_STAFF.includes(type) || !id || id === 'deleg') continue;
    const p = A.P(id); if (!p || !p.alive) continue;
    n += Math.round(25 + A.skill(p, (A.STAFF[type] || {}).skill || 'stewardship') / 2);
  }
  return n;
};
// does a custom of the realm bible already tax this life every year? (47-realm-bible)
RI.bibleTaxes = pc => {
  try {
    const B = A.BIBLE; if (!B || !B.mine) return null;
    return B.mine(pc).find(c => c.kind === 'year' && c.fx && ((c.fx.coin || 0) < 0 || (c.fx.coinPct || 0) < 0) && (B.WHO[c.who || 'adult'] || B.WHO.adult)(pc)) || null;
  } catch (e) { return null; }
};
const HEARTH = { peasant: 2, artisan: 4, merchant: 8, gentry: 6, noble: 10 };
const TALLAGE = { peasant: .03, artisan: .04, merchant: .05, gentry: .03, noble: .02 };
// [[key, label, amount], ...] the crown's taxes on this life this year; hold = this year's holdings income
RI.taxes = function (pc, hold) {
  const r = A.realm(pc.realm);
  if (!r || !r.alive || pc.ruler || pc.prison || (pc.flags && pc.flags.unfree) || pc.status === 'royal' || pc.status === 'slave' || pc.status === 'serf') return [];
  if (pc.job && pc.job.c === 'clergy') return [];
  const law = (r.laws && r.laws.tax) || 1, out = [], TN = A.TAX && A.TAX[law] ? A.TAX[law][0].toLowerCase() : 'customary';
  const custom = RI.bibleTaxes(pc);
  if (!custom && HEARTH[pc.status] != null) {
    const wage = pc.job && pc.job.lastPay ? pc.job.lastPay : 0;
    const v = Math.round(law * (HEARTH[pc.status] + TALLAGE[pc.status] * wage));
    if (v > 0) out.push(['tax', `The crown's hearth tax and tallage (${TN})`, v]);
  }
  const last = (RI.purseOf(pc).last || { lines: {} }).lines, rents = last.rents ? Math.max(0, last.rents[1]) : 0;
  const land = Math.round(law * (.08 * Math.max(0, hold || 0) + .03 * rents));
  if (land > 0) out.push(['landtax', `The crown's tenth on rents (${TN})`, land]);
  return out;
};

// ---------------------------------------------------------------- A.moneyYear: the release's lines, then the new ones

RI._m = null;
// called from inside A.moneyYear (patch RI-MONEY-BOOK) with its own totals, before the purse is touched
A.riMoneyParts = function (pc, inc, out, life, kids) { if (RI._m) Object.assign(RI._m, { inc, out, life, kids }); };
A.riAssetLine = function (inc, keep) { if (RI._m) { RI._m.hold += inc || 0; RI._m.keep += keep || 0; } };
const baseMoneyYear = A.moneyYear;
A.moneyYear = function (pc) {
  if (!pc || pc.id !== A.S.pc) return baseMoneyYear.apply(this, arguments);
  RI.rollPurse(pc);
  // a burned holding yields nothing and costs nothing until it is rebuilt
  const all = pc.assets, burnt = (all || []).filter(a => a && a.burnt);
  if (burnt.length) pc.assets = all.filter(a => !(a && a.burnt));
  RI._m = { hold: 0, keep: 0 };
  const c0 = pc.coin;
  let res;
  try { res = baseMoneyYear.apply(this, arguments); }
  finally { if (burnt.length) { const now = pc.assets; pc.assets = all.filter(a => a && (a.burnt || now.includes(a))); } }
  const m = RI._m; RI._m = null;
  try {
    if (m && m.inc != null) {
      const ls = A.LIFESTYLE[pc.lifestyle || A.lifestyleDefault(pc)] || { name: '' };
      if (m.hold) RI.purse(pc, 'hold', m.hold, 'Your holdings yield');
      if (m.inc - m.hold) RI.purse(pc, 'allow', m.inc - m.hold, pc.status === 'royal' ? "A royal's stipend from the crown" : pc.flags.famAllow ? 'An allowance from your house' : "A noble's portion");
      if (m.keep) RI.purse(pc, 'keep', -m.keep, 'Upkeep of your holdings');
      if (m.life) RI.purse(pc, 'life', -m.life, `How you live (${ls.name})`);
      if (m.kids) RI.purse(pc, 'kids', -m.kids, 'Your children');
      const resid = Math.round((pc.coin - c0) - (m.inc - m.out));
      if (resid) RI.purse(pc, 'debt', resid, resid < 0 ? 'Paid to the moneylenders' : 'Borrowed from the moneylenders');
      if (A.isAdult(pc) && pc.alive && !pc.prison && !(pc.flags && pc.flags.unfree)) RI.sinks(pc, m.hold);
    }
  } catch (e) { console.error('[ri] purse', e); }
  return res;
};
// the new sinks; money owed but not in the purse becomes debt, the way A.moneyYear handles a short year
RI.sinks = function (pc, hold) {
  const pay = (k, v, label, to) => {
    if (!(v > 0)) return 0;
    pc.coin -= v; RI.purse(pc, k, -v, label);
    if (to && to.alive) to.treasury += v;
    return v;
  };
  const horse = RI.horseKeep(pc);
  if (horse) pay('horse', horse, `Keep of your ${((GD.GEAR[pc.gear.mount] || {}).name || 'horse').toLowerCase()}`);
  const [ret, retT] = RI.retainers(pc);
  if (ret) pay('retain', ret, retT);
  const sw = RI.staffWages(pc);
  if (sw) pay('staff', sw, 'Wages of your steward, castellan and factor');
  const r = A.realm(pc.realm);
  for (const [k, label, v] of RI.taxes(pc, hold)) pay(k, v, label, r);
  if (pc.coin < 0) { pc.debt = (pc.debt || 0) + Math.round(-pc.coin); pc.coin = 0; }
};

// ---------------------------------------------------------------- the release's other money, booked by line

const wrapGain = (name, k, label) => {
  const base = A[name];
  if (typeof base !== 'function') return;
  A[name] = function (pc) {
    const me = pc && pc.id === A.S.pc ? pc : null, c0 = me ? me.coin : 0;
    const res = base.apply(this, arguments);
    try { if (me && me.coin !== c0) RI.purse(me, k, me.coin - c0, typeof label === 'function' ? label(me) : label); } catch (e) {}
    return res;
  };
};
wrapGain('careerYear', 'wage', pc => pc.job && GD.CAREERS[pc.job.c] ? `Wages (${GD.CAREERS[pc.job.c].ranks[pc.job.r][0].toLowerCase()})` : 'Wages');
wrapGain('milYear', 'pay', "A soldier's pay");
wrapGain('nobleYear', 'rents', 'Rents of your lands');
wrapGain('rulerYear', 'crown', "Your share of the crown's income");
wrapGain('companyYear', 'company', 'Your share of the company chest');
wrapGain('councilMonth', 'council', "A councillor's stipend");
const basePunish = A.punish;
A.punish = function (pc) {
  const me = pc && pc.id === A.S.pc ? pc : null, c0 = me ? me.coin : 0;
  const res = basePunish.apply(this, arguments);
  try { if (me && me.coin < c0) RI.purse(me, 'fines', me.coin - c0, 'Fines and bribes to the law'); } catch (e) {}
  return res;
};

// ---------------------------------------------------------------- taken in battle, held for ransom

RI.RANSOM_BASE = { slave: 0, serf: 6, peasant: 10, artisan: 25, merchant: 80, gentry: 150, noble: 400, royal: 2500 };
RI.ransomOf = pc => {
  const rank = pc.mil ? pc.mil.rank || 0 : 0, R = pc.noble ? GD.NOBLE_RUNGS[pc.noble.rung] : null;
  return Math.round((RI.RANSOM_BASE[pc.status] != null ? RI.RANSOM_BASE[pc.status] : 10) + rank * rank * 15 + (R && pc.noble.rung >= 2 ? R.income * .6 : 0));
};
// the odds of being taken alive when your side loses: officers and the well-born are worth keeping
RI.takenOdds = (pc, kind) => {
  const rank = pc.mil ? pc.mil.rank || 0 : 0, born = ['gentry', 'noble', 'royal'].includes(pc.status) || !!(pc.noble && pc.noble.rung >= 2);
  let p = rank >= 4 || born ? .2 : rank >= 2 ? .1 : .05;
  if (kind === 'command') p *= .6;
  if (pc.health < 30) p *= .5;
  return p;
};
RI.maybeTaken = function (pc, enemy, kind) {
  if (!pc || !pc.alive || pc.id !== A.S.pc || !A.isAdult(pc) || pc.ruler || pc.prison || (pc.flags && pc.flags.unfree)) return false;
  if (pc.flags.ri_taken && A.S.year - pc.flags.ri_taken < 4) return false;
  if (A.S.queue.some(q => q.ev === 'ri_taken')) return false;
  if (!A.chance(RI.takenOdds(pc, kind))) return false;
  const er = A.realm(enemy), n = RI.ransomOf(pc);
  const patron = (() => {
    const h = pc.house && A.S.houses && A.S.houses[pc.house], hd = h && h.headPid ? A.P(h.headPid) : null;
    if (hd && hd.alive && hd.id !== pc.id) return hd;
    const sup = A.superior && A.superior(pc); if (sup && sup.alive) return sup;
    const par = (pc.parents || []).map(A.P).find(x => x && x.alive); if (par) return par;
    const sp = pc.spouse && A.P(pc.spouse); return sp && sp.alive ? sp : null;
  })();
  pc.flags.ri_taken = A.S.year;
  A.queue({ type: 'event', ev: 'ri_taken', forced: true, ctx: { captor: er ? er.short : 'the enemy', captorId: er ? er.id : null, ransomN: n, ransom: A.coin(n), half: A.coin(Math.round(n / 2)),
    pid: patron ? patron.id : null, patron: patron ? A.fullName(patron, false) : 'nobody' } });
  return true;
};
const baseMissionFinish = A.missionFinish;
A.missionFinish = function (m) {
  const res = baseMissionFinish.apply(this, arguments);
  try { if (m && m.isBattle && m.result === 'failure') RI.maybeTaken(A.pc(), m.enemy, 'line'); } catch (e) { console.error('[ri] taken', e); }
  return res;
};
const baseBattleClose = A.battleClose;
A.battleClose = function () {
  const q = A.S.queue[0], B = q && q.type === 'battle' ? q.b : null;
  const res = baseBattleClose.apply(this, arguments);
  try {
    if (B && B.winner && B.pcSide && B.winner !== 'draw' && B.winner !== B.pcSide) {
      const theirs = B.pcSide === 'A' ? 'B' : 'A';
      RI.maybeTaken(A.pc(), B.sides[theirs] && B.sides[theirs].realm, 'command');
    }
  } catch (e) { console.error('[ri] taken', e); }
  return res;
};

// ---------------------------------------------------------------- holdings burned in a raid

const provByName = name => { if (!name) return null; for (const p of A.S.prov) if (p.name === name) return p; return null; };
RI.rebuildCost = a => Math.round(((GD.PROPERTY[a.k] || {}).price || 0) * .4);
RI.raidMonth = function (pc) {
  if (!pc || !pc.alive || pc.id !== A.S.pc || !Array.isArray(pc.assets) || !pc.assets.length) return;
  if (pc.flags.ri_raid === A.S.year || A.S.queue.some(q => q.ev === 'ri_burned')) return;
  let divs = null;
  for (let i = 0; i < pc.assets.length; i++) {
    const a = pc.assets[i], D = a && GD.PROPERTY[a.k];
    if (!D || a.burnt) continue;
    const P = provByName(a.where) || A.prov(pc.home);
    if (!P || !P.owner || P.owner === 'unclaimed') continue;
    let by = P.occ && P.occ !== P.owner && A.hostile(P.occ, P.owner) ? P.occ : null, held = !!by;
    if (!by && A.atWar(P.owner).length) {
      divs = divs || A.allDivs();
      const d = divs.find(x => x.loc === P.id && x.r !== P.owner && A.hostile(x.r, P.owner));
      if (d) by = d.r;
    }
    if (!by) continue;
    const p = (held ? .08 : .04) * (1 - .12 * Math.min(5, P.fort || 0)) * (D.fort ? .3 : 1);
    if (!A.chance(p)) continue;
    a.burnt = A.S.year; a.burntBy = by;
    pc.flags.ri_raid = A.S.year;
    const n = RI.rebuildCost(a);
    A.queue({ type: 'event', ev: 'ri_burned', forced: true, ctx: { idx: i, asset: String(a.name || D.name).toLowerCase(), where: P.name, by: A.realmShort(by), costN: n, cost: A.coin(n),
      handsN: Math.round(n * .4), hands: A.coin(Math.round(n * .4)), ruinN: Math.round(D.price * .2), ruin: A.coin(Math.round(D.price * .2)) } });
    return;
  }
};
A.onMonth.push(pc => { try { RI.raidMonth(pc); } catch (e) { console.error('[ri] raid', e); } });
RI.rebuild = function (pc, i, frac) {
  const a = pc.assets[i]; if (!a || !a.burnt) return { ok: false };
  const n = Math.round(RI.rebuildCost(a) * (frac || 1));
  if (pc.coin < n) return { ok: false, msg: `Rebuilding costs ${A.coin(n)}.` };
  pc.coin -= n; RI.purse(pc, 'rebuild', -n, 'Rebuilding after the raids');
  delete a.burnt; delete a.burntBy;
  return { ok: true, n };
};
Object.assign(UI.A, {
  riRebuild(v) {
    const pc = A.pc(), r = RI.rebuild(pc, +v);
    A.log(r.ok ? `You rebuild your ${String(pc.assets[+v].name).toLowerCase()} (${A.coin(r.n)}).` : r.msg || 'Nothing to rebuild.', r.ok ? 'good' : 'warn');
    UI.refreshTab ? UI.refreshTab() : UI.refresh();
  },
});

// ---------------------------------------------------------------- the effects the events use

const baseApplyFx = A.applyFx;
A.applyFx = function (pc, fx, ctx) {
  const out = baseApplyFx.apply(this, arguments);
  try {
    if (!fx || typeof fx !== 'object' || !pc || pc.id !== A.S.pc) return out;
    const say = s => { if (Array.isArray(out)) out.push(s); };
    if (fx.riRansom && ctx) {
      const n = +ctx.ransomN || 0, er = A.realm(ctx.captorId), give = v => { if (er && er.alive) er.treasury += v; };
      if (fx.riRansom === 'pay') { const v = Math.min(n, pc.coin); pc.coin -= v; RI.purse(pc, 'ransom', -v, 'Your ransom'); give(v); if (v < n) { pc.debt = (pc.debt || 0) + (n - v); say(`(${A.coin(n - v)} of it borrowed)`); } }
      if (fx.riRansom === 'half') { const v = Math.min(Math.round(n / 2), pc.coin); pc.coin -= v; RI.purse(pc, 'ransom', -v, 'Your ransom'); give(v); }
      if (fx.riRansom === 'patron') give(n);
      if (fx.riRansom === 'wait') A.S.time = Math.max(0, (A.S.time || 0) - 3);
    }
    if (fx.riRebuild && ctx && ctx.idx != null) {
      const a = pc.assets[ctx.idx];
      if (a && a.burnt) {
        if (fx.riRebuild === 'now') { const r = RI.rebuild(pc, ctx.idx, 1); if (!r.ok) say('(You cannot pay for it yet.)'); }
        if (fx.riRebuild === 'hands' || fx.riRebuild === 'handsFail') {
          const v = Math.min(pc.coin, +ctx.handsN || 0); pc.coin -= v; RI.purse(pc, 'rebuild', -v, 'Rebuilding after the raids');
          if (fx.riRebuild === 'hands') { delete a.burnt; delete a.burntBy; }
        }
        if (fx.riRebuild === 'sell') { const v = +ctx.ruinN || 0; pc.coin += v; RI.purse(pc, 'ruin', v, 'A burned holding sold'); pc.assets.splice(ctx.idx, 1); }
      }
    }
    if (fx.riCourt && ctx && ctx.riK) RI.courtAnswer(pc, ctx, fx.riCourt);
    if (fx.riVoice && RI.voiceFx) RI.voiceFx(pc, fx.riVoice);
  } catch (e) { console.error('[ri] fx', e); }
  return out;
};
// the player-ruler's answer to a court push (event ri_court_push)
RI.courtAnswer = function (pc, ctx, how) {
  const r = A.realm(pc.ruler); if (!r || !RI.PUSH) return;
  const P = RI.PUSH[ctx.riK], who = A.P(ctx.pid), foe = A.P(ctx.foeId);
  if (how === 'yes') {
    if (P && P.law && P.ok(r)) { RI.applyLaw(r, ctx.riK); A.updateRealmPops && A.updateRealmPops(); }
    else if (P) { r.riPri = { k: ctx.riK, y: A.S.year, who: ctx.pid }; if (ctx.riK === 'grant' && who) { const h = who.house && A.S.houses[who.house]; if (h) h.op = clamp((h.op || 50) + 12, 0, 100); } }
    if (foe && foe.alive && foe.house && A.S.houses[foe.house]) A.S.houses[foe.house].op = clamp((A.S.houses[foe.house].op || 50) - 6, 0, 100);
  }
  if (how === 'gift') {
    const n = Math.round(Math.max(40, (r.income || 0) * .002));
    const v = Math.min(n, pc.coin); pc.coin -= v; RI.purse(pc, 'gifts', -v, 'Gifts and favours at court');
    if (who && who.alive) who.coin = Math.min(20000, (who.coin || 0) + v);
  }
  RI.logCourt && RI.logCourt(r, { k: ctx.riK, who: ctx.pid, yes: how === 'yes', ruler: true, why: [[`${how === 'yes' ? 'You granted it' : how === 'gift' ? 'You bought them off' : 'You refused'}`, 1]] });
};
