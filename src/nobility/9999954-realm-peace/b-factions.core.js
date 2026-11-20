// W1-6 part b: factions (docs/design/war.md §13.3; D-098). The release's factions and W1-2's choice to join stay; what
// was a timer and dice is now the test of §13.3 and a ladder of decisions, each through A.WHY with named reasons:
//
//   joining           W1-2's A.WHY.factionChoice, with two more reasons: a tie to the houses already sworn (a shared
//                     liege, a shared border, kin, one faith), or none; and, for the first to raise the banner, the
//                     standing to lead (a great house, an ambitious head), or the want of it.
//   dissolving        a league of fewer than two houses breaks up after its first year (§13.3, point 1: two or more).
//   the anger         f.discontent is a reading, not a clock: the members' grievance and the league's share of the
//                     swords, with the anger events add fading by half a year.
//   1 murmur or       the leader decides each year whether to bring the petition (kind 'petition'): the league's
//     petition        swords, its anger, the throne's firmness, the crown's hand, its cause's urgency.
//   2 the king's      grant it, buy them off, arrest the leader, or refuse (kind 'facanswer'): the league's swords
//     answer          against his, the cost of what is asked, his chest, his authority and spymaster, his temper.
//                     (A ruling player answers on the release's card.)
//   3 their answer    back down, wait, withhold taxes, or rise (kind 'facrise'): their swords against the crown's, their
//                     anger, a foreign backer, an arrest attempted, the leader's temper.
//   an arrest         the leader, warned or not, flees to raise his banners or is taken (kind 'arrest'): the
//                     spymaster's skill keeps the warrant secret, the leader's own care and his friends at court.
// Retired: 20-ai-personality's A.aiFactionAnswer and A.aiRevolt (persona-weighted dice), the release's facRefuse roll
// and the purge's roll (archive/w1-6-faction-dice).
(function () {
  const PE = A.PAX, W = () => A.WHY;
  if (!PE) return;
  const { clamp, r1, live, short, cap } = PE;
  const r2 = x => Math.round(x * 100) / 100;
  const rs = (kind, weight, label, source, pub) => ({ kind, weight: r2(weight), label, source, pub: pub ? 1 : 0 });
  const FN = k => ((A.FACTIONS || {})[k] && A.FACTIONS[k].name) || 'faction';
  Object.assign(PE.T, {
    petBand: 1,      // the leader's petition
    ansBand: .8,     // the king's answer
    riseBand: .8,    // their answer
    angerFade: .5,   // the anger events add fades by this share a year
  });
  W().T.kindCap = Object.assign({ petition: 20, facanswer: 20, facrise: 20, arrest: 10 }, W().T.kindCap || {});

  // ---------------------------------------------------------------- the test of §13.3
  const seatNear = (a, b) => {
    const CM = A.CMD;
    if (!CM || !CM.seatProv) return false;
    const P = CM.seatProv(a), Q = CM.seatProv(b);
    if (!P || !Q) return false;
    return P.id === Q.id || (P.adj || []).includes(Q.id);
  };
  const headOf = h => (h && h.headPid != null ? A.P(h.headPid) : null);
  // a tie between a house and another: a liege, a border, kin, a faith
  PE.tieOf = function (h, o) {
    if (!h || !o || h === o) return null;
    if ((h.liege && h.liege === o.id) || (o.liege && o.liege === h.id) || (h.liege && h.liege === o.liege)) return 'the same liege';
    if (seatNear(h, o)) return 'a shared border';
    const a = headOf(h), b = headOf(o);
    if (live(a) && live(b)) {
      const kin = ['spouse', 'sibling', 'parent', 'child', 'cousin'];
      const ra = a.rel && a.rel[b.id];
      if (ra && kin.includes(ra.type)) return 'kinship';
      if (a.spouse && A.P(a.spouse) && A.P(a.spouse).house === o.id) return 'a marriage';
      if (b.spouse && A.P(b.spouse) && A.P(b.spouse).house === h.id) return 'a marriage';
    }
    return null;
  };
  // extra reasons for a house's choice to join (W1-2's A.WHY.factionChoice reads them)
  PE.joinExtra = function (r, h, want, fw) {
    const out = [];
    if (fw && fw.members.length) {
      let tie = null, with_ = null;
      for (const id of fw.members) { const o = A.S.houses[id]; const t = PE.tieOf(h, o); if (t) { tie = t; with_ = o; break; } }
      out.push(tie ? rs('kin', .6, `A tie to the houses sworn: ${tie} with ${with_.name}`, { t: 'tie', id: with_.id }, 1)
        : rs('kin', -.9, 'No tie binds him to the houses sworn', { t: 'tie' }, 1));
    } else {
      // the first to raise the banner needs the standing to lead it (§13.3, point 3)
      const great = h.great !== false && ['N01', 'N02', 'N03', 'N04'].includes(h.rung), T = W().houseMind(h).temper || {};
      out.push(great ? rs('ambition', .3 + .5 * Math.max(0, T.ambition || 0), 'A great house with the standing to lead', { t: 'standing', id: h.rung }, 1)
        : rs('ambition', -1.4, 'A small house: no one would follow his banner', { t: 'standing', id: h.rung || 'none' }, 1));
    }
    return out;
  };

  // the league's swords against the rest of the realm's (the crown's and every other house's): A.factionPower's measure
  PE.leagueRatio = f => { const p = clamp(f.power != null ? f.power : A.factionPower(f), 0, .95); return p / (1 - p); };
  // ---------------------------------------------------------------- a faction's year
  PE.grievance = function (f) {
    let n = 0, g = 0;
    for (const id of f.members) { const h = A.S.houses[id]; if (!h) continue; n++; g += 55 - (h.op != null ? h.op : 50); }
    return n ? g / n : 0;
  };
  // the anger: the members' grievance and the league's swords, with what events added fading
  PE.anger = function (f) {
    const reading = clamp(2 * Math.max(0, PE.grievance(f)) + 60 * (f.power || 0), 0, 100);
    return Math.round(clamp((f.discontent || 0) * (1 - PE.T.angerFade) + reading * PE.T.angerFade, 0, 100));
  };
  const URGENT = {
    peace: r => [(r.exhaustion || 0) / 30 - .8, 'The war bleeds the realm'],
    war: r => [((A.AGGRO && A.AGGRO[r.id]) || 1) - .6, 'The lords want a war'],
    liberty: r => [((r.laws && r.laws.authority) || 1) * .4 - .2, 'The crown\'s hand lies heavy'],
    claimant: r => [(50 - (r.legit || 50)) / 25, 'The crown sits on a doubtful right'],
    independence: r => [.2, 'Their lands could stand alone'],
  };
  // 1. the leader brings the petition or bides his time
  PE.petitionQ = function (r, f) {
    const lead = A.S.houses[f.leader];
    if (!lead) return null;
    const p = f.power || 0, stab = r.stability != null ? r.stability : 50, auth = r.laws && r.laws.authority != null ? r.laws.authority : 1;
    const u = (URGENT[f.kind] || (() => [0, '']))(r), young = A.S.year - (f.start || A.S.year) < 1;
    return W().decide(W().houseMind(lead), 'petition', [
      { id: 'petition', at: r.id, feeds: ['anger', 'pride'], reasons: [
        rs('reckoning', 6 * (p - .35), `${f.members.length} houses, ${p >= .4 ? 'a great part' : p >= .25 ? 'a fair part' : 'a small part'} of the realm's swords`, { t: 'power', r: r2(p) }, 1),
        rs('grudge', ((f.discontent || 0) - 50) / 20, (f.discontent || 0) >= 50 ? 'Their anger with the crown' : 'Their grievance is not yet hot', { t: 'anger', r: Math.round(f.discontent || 0) }, 1),
        rs('want', u[0], u[1], { t: 'cause', id: f.kind }, 1),
        rs('reckoning', (50 - stab) / 30, stab < 50 ? 'The throne is shaking' : 'The throne stands firm', { t: 'stability', r: Math.round(stab) }, 1),
      ] },
      { id: 'murmur', at: r.id, feeds: ['fear'], reasons: [
        rs('fear', 1.8 + .4 * (auth - 1), 'A petition to the crown is a dangerous thing', { t: 'auth', r: auth }, 0),
        young ? rs('reckoning', .8, 'The league is new and still gathering', { t: 'young', y: f.start }, 1) : null,
      ].filter(Boolean) },
    ], { band: PE.T.petBand, r: r.id, at: f.kind, logIf: rec => rec.chose === 'petition' });
  };
  // the faction's yearly turn (from the release's A.factionsYear): power, anger, and the petition
  PE.factionTurn = function (r, f) {
    f.power = A.factionPower(f);
    f.discontent = PE.anger(f);
    const rec = PE.petitionQ(r, f);
    if (!rec || rec.chose !== 'petition') return false;
    f.pet = { y: A.S.year, why: clean(W().tell(rec, true), 200) };
    PE.note(r, { k: 'petition', chose: 'petition', fac: f.kind, h: f.leader }, rec);
    A.factionDemand(r, f);
    return true;
  };
  const clean = (s, n) => String(s == null ? '' : s).replace(/[<>"{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 160);
  PE.clean = clean;

  // ---------------------------------------------------------------- 2. the king's answer
  const AGAINST = { liberty: 1, independence: 1, claimant: 1 };
  const DEMAND_COST = {
    war: (r, P) => [-.4 + .8 * ((P && P.warLog) || 0), 'A war he may or may not want'],
    peace: (r) => [-.6 + (r.exhaustion || 0) / 40, 'Peace at the price his enemy names'],
    liberty: () => [-1, 'His authority cut back'],
    claimant: () => [-4, 'His own crown'],
    independence: () => [-2.5, 'The realm cut in two'],
  };
  PE.answerOptions = function (r, f) {
    const p = f.power || 0, stab = r.stability != null ? r.stability : 50, lead = A.S.houses[f.leader];
    const P = A.rulerPersona ? A.rulerPersona(r.id) : null;
    const cost = (DEMAND_COST[f.kind] || (() => [-1, 'What they ask']))(r, P);
    const price = Math.round(r.income * .12 + 2e3);
    const auth = r.laws && r.laws.authority != null ? r.laws.authority : 1, spy = A.councilSkill ? A.councilSkill(r, 'spymaster') : 0;
    const ratio = PE.leagueRatio(f);
    const opts = [
      { id: 'grant', at: lead ? lead.id : null, feeds: ['fear'], reasons: [
        rs('fear', 4 * (p - .35), `The league holds ${p >= .4 ? 'a great part' : 'part'} of the realm's swords`, { t: 'power', r: r2(p) }, 1),
        rs('fear', (50 - stab) / 30, stab < 50 ? 'The throne is shaking' : 'The throne stands firm', { t: 'stability', r: Math.round(stab) }, 1),
        rs('cost', cost[0], cost[1], { t: 'demand', id: f.kind }, 1),
        rs('insult', -.6, 'Every lord would learn that asking works', { t: 'precedent' }, 0),
      ] },
      { id: 'buy', at: lead ? lead.id : null, feeds: ['fear', 'greed'], reasons: [
        rs('coin', r.treasury >= price ? -.3 - price / Math.max(1, r.income) : -4, r.treasury >= price ? `Pensions and offices cost the chest ${A.fmt ? A.fmt(price) : price} suns` : 'The chest cannot pay their price', { t: 'chest', r: Math.round(r.treasury || 0) }, 0),
        rs('fear', 2.5 * (p - .3), 'Their swords, bought rather than fought', { t: 'power', r: r2(p) }, 1),
        rs('reckoning', .3, 'Quiet bought for a while', { t: 'quiet' }, 0),
      ] },
      { id: 'arrest', at: lead ? lead.id : null, feeds: ['anger', 'pride'], reasons: [
        rs('reckoning', auth >= 2 && spy >= 30 ? .2 + (spy - 30) / 40 : -3, auth >= 2 && spy >= 30 ? 'His spymaster can take the leader quietly' : 'He has not the power to arrest a great lord', { t: 'arrest', r: Math.round(spy) }, 0),
        rs('reckoning', -1.5 * ratio, 'A failed arrest is the spark of a rising', { t: 'ratio', r: r2(ratio) }, 0),
        rs('grudge', .3, 'Strike first', { t: 'temper' }, 0),
      ] },
      { id: 'refuse', at: lead ? lead.id : null, feeds: ['pride', 'anger'], reasons: [
        rs('insult', .8, 'He will not be dictated to by his own lords', { t: 'pride' }, 0),
        AGAINST[f.kind] ? rs('duty', .8, 'The crown\'s right is not his to bargain away', { t: 'right', id: f.kind }, 1) : null,
        rs('reckoning', 2 * (1 - Math.min(2, ratio)), ratio < 1 ? 'His hosts outnumber theirs' : 'Their men are as many as his', { t: 'ratio', r: r2(ratio) }, 0),
        rs('reckoning', (stab - 50) / 40, stab >= 50 ? 'The realm is quiet behind him' : 'The realm is restless behind him', { t: 'stability', r: Math.round(stab) }, 1),
      ].filter(Boolean) },
    ];
    return { opts, price, ratio };
  };
  PE.crownAnswer = function (r, f) {
    const { opts } = PE.answerOptions(r, f);
    return W().decide(r.id, 'facanswer', opts, { band: PE.T.ansBand, r: r.id, at: f.kind });
  };

  // ---------------------------------------------------------------- 3. their answer
  PE.riseOptions = function (r, f, ctx) {
    ctx = ctx || {};
    const p = f.power || 0, stab = r.stability != null ? r.stability : 50, anger = f.discontent || 0;
    const ratio = PE.leagueRatio(f);
    const backer = A.neighbors(r.id).map(A.realm).filter(o => o && o.alive && !o.isRebel && A.relBetween(o.id, r.id) < -40)
      .sort((a, b) => A.realmPower(b) - A.realmPower(a))[0];
    const lead = A.S.houses[f.leader], hp = headOf(lead), seats = f.members.some(id => { const h = A.S.houses[id]; return h && h.seat && A.realmProvs(r.id).some(q => (q.name === h.seat || q.oname === h.seat) && q.id !== r.capitalProv); });
    const rise = [
      rs('reckoning', 2.4 * (Math.min(2, ratio) - .8), ratio >= 1 ? 'Their men are as many as the crown\'s' : 'The crown\'s hosts outnumber theirs', { t: 'ratio', r: r2(ratio) }, 0),
      rs('grudge', (anger - 40) / 20, 'Their anger with the crown', { t: 'anger', r: Math.round(anger) }, 1),
      rs('ambition', .4, `${lead ? lead.name : 'The leader'} would be his own master`, { t: 'ambition', id: f.leader }, 0),
      rs('reckoning', (40 - stab) / 30, stab < 40 ? 'The throne is shaking' : 'The throne stands firm', { t: 'stability', r: Math.round(stab) }, 1),
    ];
    if (backer) rise.push(rs('want', .8, `${short(backer.id)} would back them with men and silver`, { t: 'backer', at: backer.id }, 0));
    if (ctx.arrest) rise.push(rs('grudge', 2, 'The crown tried to seize their leader', { t: 'arrest' }, 1));
    if (!seats) rise.push(rs('reckoning', -3, 'They hold no castle to rise from', { t: 'castles' }, 0));
    return [
      { id: 'rise', at: r.id, feeds: ['anger', 'pride', 'grudge'], reasons: rise },
      { id: 'withhold', at: r.id, feeds: ['anger'], reasons: [
        rs('want', .2 + p, 'Withhold their taxes and their men', { t: 'withhold' }, 1),
        rs('fear', -.4, 'Half a rebellion is still a rebellion', { t: 'risk' }, 0),
      ] },
      { id: 'wait', at: r.id, feeds: ['fear'], reasons: [rs('reckoning', .7, 'Bide their time for a better season', { t: 'wait' }, 0), ctx.arrest ? rs('fear', -1.5, 'The crown has shown its hand', { t: 'arrest' }, 0) : null].filter(Boolean) },
      { id: 'back', at: r.id, feeds: ['fear'], reasons: [
        rs('fear', 1.6 * (1 - Math.min(2, ratio)), 'The crown is stronger', { t: 'ratio', r: r2(ratio) }, 0),
        rs('loyalty', live(hp) ? .5 : .3, 'An oath sworn to the crown', { t: 'oath' }, 1),
      ] },
    ];
  };
  PE.theirAnswer = function (r, f, ctx) {
    const lead = A.S.houses[f.leader];
    if (!lead) return null;
    const hp = headOf(lead);
    // a league led by the player's own house answers as he does (his faction card; not decided for him)
    if (hp && hp.id === A.S.pc) return null;
    f.power = f.power != null ? f.power : A.factionPower(f);
    return W().decide(W().houseMind(lead), 'facrise', PE.riseOptions(r, f, ctx), { band: PE.T.riseBand, r: r.id, at: f.kind });
  };
  // what their answer does
  PE.doAnswer = function (r, f, rec) {
    const S = A.S, F = FN(f.kind), lead = S.houses[f.leader];
    if (!rec) return;
    const told = clean(W().tell(rec, true), 200), name = lead ? lead.name : 'The league';
    if (A.aiLogAdd) A.aiLogAdd(rec.chose === 'rise' ? 'revolt' : rec.chose === 'back' ? 'backdown' : 'facwait', r.id, null, rec.chose === 'rise' ? `raises the banners of revolt against the crown of ${short(r.id)}.` : rec.chose === 'back' ? `backs down rather than rise against the crown of ${short(r.id)}; the ${F} breaks up.` : rec.chose === 'withhold' ? `withholds taxes and men from the crown of ${short(r.id)}.` : `bides its time against the crown of ${short(r.id)}.`, (rec.why || []).map(x => [x[0], x[1]]), `${F} leader ${name}`);
    PE.note(r, { k: 'facrise', chose: rec.chose, fac: f.kind, h: f.leader }, rec);
    if (rec.chose === 'rise') { A.factionRevolt(r, f); return; }
    if (rec.chose === 'back') {
      r.legit = Math.min(100, (r.legit || 0) + 5);
      for (const id of f.members) if (S.houses[id]) S.houses[id].op = Math.max(0, (S.houses[id].op || 40) - 10);
      S.factions = S.factions.filter(x => x !== f);
      PE.tell(r, `${name} and the ${F} back down before the crown of ${short(r.id)}.`, 'court', told);
      return;
    }
    if (rec.chose === 'withhold') {
      const share = clamp(f.power || 0, 0, .6), lost = Math.round((r.income || 0) * share * .5);
      r.treasury = (r.treasury || 0) - lost;
      r.stability = Math.max(0, (r.stability || 0) - 3);
      f.withhold = S.year;
      PE.tell(r, `The houses of the ${F} withhold their taxes and their men from the crown of ${short(r.id)}.`, 'realm', told);
      return;
    }
    // wait: the anger stays where it is, and the petition may come again
  };

  // ---------------------------------------------------------------- an arrest: the leader flees or is taken
  PE.arrestQ = function (r, f) {
    const lead = A.S.houses[f.leader], hp = headOf(lead);
    if (!lead) return null;
    const spy = A.councilSkill ? A.councilSkill(r, 'spymaster') : 0;
    const friends = Object.values(r.council || {}).filter(id => { const c = A.P(id); return live(c) && c.house && f.members.includes(c.house); }).length;
    return W().decide(live(hp) ? hp : W().houseMind(lead), 'arrest', [
      { id: 'flee', at: r.id, reasons: [
        rs('fear', 1 + (W().houseMind(lead).temper.caution || 0), 'Whispers of a warrant reach him', { t: 'care' }, 0),
        friends ? rs('kin', 1.2, 'A friend on the council warns him', { t: 'friend', r: friends }, 0) : null,
      ].filter(Boolean) },
      { id: 'taken', at: r.id, reasons: [
        rs('reckoning', (spy - 30) / 18, spy >= 50 ? 'The spymaster keeps the warrant secret' : 'The spymaster\'s men are clumsy', { t: 'spymaster', r: Math.round(spy) }, 0),
        rs('loyalty', .4, 'He answers the crown\'s summons to court', { t: 'summons' }, 1),
      ] },
    ], { band: 1, r: r.id, at: f.kind });
  };
  // the arrest done: the faction broken, or the spark of a rising
  PE.doArrest = function (r, f, o) {
    o = o || {};
    const S = A.S, lead = S.houses[f.leader], rec = PE.arrestQ(r, f);
    if (rec && rec.chose === 'taken') {
      S.factions = S.factions.filter(x => x !== f);
      if (lead) lead.op = 5;
      for (const h of A.realmHouses(r.id)) h.op = A.clamp((h.op || 50) - 4, 0, 100);
      r.legit = Math.max(0, (r.legit || 0) - 3);
      PE.note(r, { k: 'arrest', chose: 'taken', fac: f.kind, h: f.leader }, rec);
      PE.tell(r, `The crown of ${short(r.id)} seizes ${lead ? 'the head of ' + lead.name : 'the faction\'s leader'}. The ${FN(f.kind)} breaks apart.`, 'realm');
      return 'taken';
    }
    if (rec) PE.note(r, { k: 'arrest', chose: 'flee', fac: f.kind, h: f.leader }, rec);
    if (o.noRise) return 'fled';
    const ans = PE.theirAnswer(r, f, { arrest: true });
    if (ans) PE.doAnswer(r, f, ans); else A.factionRevolt(r, f);
    return 'fled';
  };

  // the AI crown's whole answer to a petition (the release's A.factionDemand calls this)
  PE.answer = function (r, f) {
    const S = A.S, rec = PE.crownAnswer(r, f), F = FN(f.kind);
    if (!rec) return;
    const told = clean(W().tell(rec, true), 200);
    PE.note(r, { k: 'facanswer', chose: rec.chose, fac: f.kind, h: f.leader }, rec);
    if (A.aiLogAdd) A.aiLogAdd(rec.chose === 'grant' ? 'yieldfac' : 'defyfac', r.id, null, rec.chose === 'grant' ? `yields to the ${F}: ${(A.FACTIONS[f.kind] || {}).demand || 'its demand'}.` : rec.chose === 'buy' ? `buys off the ${F} with pensions and offices.` : rec.chose === 'arrest' ? `moves to arrest the leader of the ${F}.` : `refuses the ${F}.`, (rec.why || []).map(x => [x[0], x[1]]));
    if (rec.chose === 'grant') { A.factionConcede(r, f); return; }
    if (rec.chose === 'buy') {
      const { price } = PE.answerOptions(r, f);
      r.treasury -= price;
      if (A.RI && A.RI.book) A.RI.book(r, 'bribes', price);
      for (const id of f.members) if (S.houses[id]) S.houses[id].op = clamp((S.houses[id].op || 40) + 15, 0, 100);
      f.discontent = 0;
      PE.tell(r, `The crown of ${short(r.id)} buys the quiet of the ${F} with pensions and offices.`, 'court', told);
      return;
    }
    if (rec.chose === 'arrest') { PE.doArrest(r, f); return; }
    PE.tell(r, `The crown of ${short(r.id)} refuses the ${F}.`, 'court', told);
    const ans = PE.theirAnswer(r, f);
    if (ans) PE.doAnswer(r, f, ans);
  };
})();
