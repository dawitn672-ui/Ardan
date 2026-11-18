// W1-6 "the realm's peace" (docs/design/war.md §13, §9.4, §11.3 point 6; order 54, rule 18; D-097 to D-103).
// Part a: stability as a reading of named pressures, each lord's stance, and a house's loyalty from named terms.
//
//   A.PAX.press(r)        the pressures on a realm (war.md §13.1): the realm's old temper (its custom), the throne's
//                           right, the lords, the commons, the towns, the faith, the army and the king himself; each a
//                           term { k, v, label, src } in points of stability. Pure.
//   A.PAX.target(r)       their sum: where the realm's stability settles. The release's AI year moves stability 15% of
//                           the way each year (its old pull toward the lore's word, without the ±3 of luck); a ruling
//                           player's year adds the lords' and the king's push (A.PAX.yearPush) in place of that luck.
//   A.PAX.word(v)         firm, steady, uneasy, shaking, breaking (the player reads the word; its reasons open on a press)
//   A.PAX.houseTerms(h)   a house's loyalty to the crown as named terms (war.md §13.7: h.op as the sum of its reasons):
//                           the crown's hand (authority and conscription laws), the throne's firmness, his oath's weight
//                           and rights, a seat or office held, wrongs the crown did him (W1-3's grievances), his temper,
//                           another faith or people, a great house that could rule alone, the realm's lost wars, taxes.
//                           Pure; never stored (A.PAX.houseWhy reads them on demand).
//   A.PAX.housesYear(r)   each house's loyalty moves a quarter of the way to its terms' sum. No dice: the release's
//                           random walks of ±2 (every realm) and -4..+3 (a ruling player's) are gone.
//   A.PAX.stance(h)       loyal, content, cool, aggrieved or plotting (war.md §13.2), with the terms
(function () {
  const PE = A.PAX = A.PAX || {};
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const r1 = x => Math.round(x * 10) / 10;
  const live = p => !!(p && p.alive);
  const short = id => (A.realm(id) ? A.realmShort(id) : String(id || ''));
  PE.T = Object.assign({
    settle: .15,       // a realm's stability moves this share of the way to its pressures' sum each year (the release's)
    houseSettle: .25,  // a house's loyalty moves this share of the way to its terms' sum each year
    words: [[70, 'firm'], [52, 'steady'], [35, 'uneasy'], [18, 'shaking'], [0, 'breaking']],
    stances: [[75, 'loyal'], [55, 'content'], [40, 'cool'], [0, 'aggrieved']],
  }, PE.T || {});
  PE.clamp = clamp;
  PE.r1 = r1;
  PE.live = live;
  PE.short = short;
  PE.word = v => { for (const [at, w] of PE.T.words) if ((v || 0) >= at) return w; return 'breaking'; };
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  PE.hash = hash;

  // ---------------------------------------------------------------- the pressures on a realm (§13.1)
  const POL = () => A.POL;
  // an estate's approval as the Polity reads it, without its reading of unrest (which is stability itself)
  const estAp = (r, k) => {
    const P = POL();
    if (!P || !P.approvalParts || !r.pol) return { v: 0, top: null };
    let v = 0, top = null;
    for (const [label, x] of P.approvalParts(r, k)) {
      if (/^Unrest in the provinces/.test(label)) continue;
      v += x;
      if (!top || Math.abs(x) > Math.abs(top[1])) top = [label, x];
    }
    return { v: clamp(v, -10, 10), top };
  };
  const ESTW = { comm: .6, burg: .4, cler: .4, army: .4 };
  const ESTN = { comm: 'The commons', burg: 'The towns', cler: 'The faith', army: 'The army' };
  PE.press = function (r) {
    const out = [];
    if (!r) return out;
    const add = (k, v, label, src) => { if (isFinite(v) && Math.abs(v) >= .05) out.push({ k, v: r1(v), label, src: src || { t: k } }); };
    const L = LORE.realms && LORE.realms[r.id], word = L && A.STAB[L.stability] != null ? L.stability : 'steady';
    add('custom', A.STAB[word] || 55, `The realm's old temper: ${word}`, { t: 'lore', id: r.id });
    // the throne's right: legitimacy (the Polity's parts), a child on the throne, no heir to an ageing king
    const ru = r.ruler != null ? A.P(r.ruler) : null;
    add('throne', ((r.legit != null ? r.legit : 50) - 50) / 5, (r.legit || 0) >= 50 ? 'The throne\'s right is accepted' : 'The throne\'s right is doubted', { t: 'legit', r: Math.round(r.legit || 0) });
    if (live(ru) && !A.isAdult(ru)) add('throne', -5, 'A child on the throne', { t: 'child', id: ru.id });
    const heir = r.heir != null ? A.P(r.heir) : null, R = live(ru) && GD.RACES ? GD.RACES[ru.race] : null;
    if (r.gov === 'hereditary' && live(ru) && !live(heir) && R && A.age(ru) >= R.old * .8) add('throne', -4, 'No heir to an ageing ruler', { t: 'heir', id: ru.id });
    // the lords: every house's loyalty, weighed by its swords
    let sw = 0, sum = 0, plot = 0;
    for (const h of A.realmHouses(r.id)) { const s = A.houseStrength(h); sw += s; sum += s * ((h.op != null ? h.op : 50) - 50); }
    const lords = sw > 0 ? (sum / sw) / 50 * 12 : 0;
    if (!(sw > 0)) out.push({ k: 'lords', v: 0, label: 'No great lords of note', src: { t: 'lords' } });
    else if (Math.abs(lords) < .05) out.push({ k: 'lords', v: 0, label: 'The lords neither content nor sore', src: { t: 'lords', r: 50 } });
    add('lords', lords, lords >= 0 ? 'The lords are content with the crown' : 'The lords are sore with the crown', { t: 'lords', r: Math.round(sw > 0 ? 50 + sum / sw : 50) });
    for (const f of A.factionsOf(r.id)) if (f.kind !== 'war' && f.kind !== 'peace' && (f.power || 0) >= .2) plot++;
    if (plot) add('lords', -3 * plot, `${plot === 1 ? 'A league' : plot + ' leagues'} of lords against the crown`, { t: 'faction', r: plot });
    // the commons, the towns, the faith, the army: the Polity's estates as each reads the realm
    for (const k of ['comm', 'burg', 'cler', 'army']) {
      const e = estAp(r, k);
      if (e.v) add(k === 'comm' ? 'commons' : k === 'burg' ? 'towns' : k === 'cler' ? 'faith' : 'army', e.v * ESTW[k], `${ESTN[k]}${e.top ? ': ' + String(e.top[0]).toLowerCase() : ''}`, { t: 'estate', id: k, r: e.v });
    }
    if (r.exhaustion) add('commons', -(r.exhaustion || 0) * .25, 'Weariness of war: sons dead and fields unworked', { t: 'weary', r: Math.round(r.exhaustion) });
    if ((r.debt || 0) > (r.income || 0)) add('towns', -8, 'The crown\'s debts', { t: 'debt' });
    // the king himself
    if (live(ru)) {
      if ((ru.health != null ? ru.health : 100) < 35) add('king', -4, `${ru.sex === 'F' ? 'The queen' : 'The king'} is ill`, { t: 'ill', id: ru.id });
      if (R && A.age(ru) >= R.old * 1.1) add('king', -2, `${ru.sex === 'F' ? 'The queen' : 'The king'} is old`, { t: 'old', id: ru.id });
      if ((ru.piety || 0) >= 70) add('faith', 2, 'A pious ruler', { t: 'piety', id: ru.id });
      if ((ru.fame || 0) >= 75) add('king', 2, 'A ruler famed in the land', { t: 'fame', id: ru.id });
    } else add('king', -6, 'No one sits the throne', { t: 'none' });
    if (A.atWar(r.id).length) add('king', -2, 'The realm is at war', { t: 'war' });
    const law = r.ind && GD.ECON && GD.ECON[r.ind.law];
    if (law && law.stab) add('commons', law.stab * 4, `The economy law: ${law.name}`, { t: 'law' });
    return out;
  };
  PE.target = r => clamp(Math.round(PE.press(r).reduce((a, x) => a + x.v, 0)), 3, 100);
  // a ruling player's year: the release's own yearly terms (taxes, the Chaplain, weariness, debt, legitimacy, war) stand;
  // what the luck of ±3 stood for is now the lords' and the king's own push, a fifth of their pressure, at most ±3
  PE.yearPush = function (r) {
    const t = PE.press(r).filter(x => x.k === 'lords' || x.k === 'king').reduce((a, x) => a + x.v, 0);
    return clamp(r1(t / 5), -3, 3);
  };
  // the reading with what has happened lately: the gap between today's stability and its pressures' sum, fading
  PE.reasons = function (r) {
    const P = PE.press(r), tg = clamp(P.reduce((a, x) => a + x.v, 0), 3, 100), gap = (r.stability || 0) - tg;
    if (Math.abs(gap) >= 1) P.push({ k: 'lately', v: r1(gap), label: gap > 0 ? 'Good years lately, fading' : 'Troubles lately, fading', src: { t: 'lately' } });
    return P;
  };

  // ---------------------------------------------------------------- a house's loyalty from named terms (§13.2, §13.7)
  const AUTHW = [6, 0, -6, -14], CONSW = [2, 0, -4];
  PE.houseTerms = function (h, r) {
    r = r || A.realm(h && h.realm);
    const out = [];
    if (!h || !r) return out;
    const add = (k, v, label, src) => { if (isFinite(v) && Math.abs(v) >= .5) out.push({ k, v: r1(v), label, src: src || { t: k } }); };
    add('base', 52, 'An oath sworn to the crown', { t: 'oath' });
    const auth = r.laws && r.laws.authority != null ? r.laws.authority : 1, cons = r.laws && r.laws.conscript != null ? r.laws.conscript : 1;
    add('law', AUTHW[auth] || 0, `The crown's authority: ${(A.AUTH[auth] || ['Limited'])[0].toLowerCase()}`, { t: 'auth', r: auth });
    add('law', CONSW[cons] || 0, 'The crown\'s right to call men', { t: 'conscript', r: cons });
    const tax = r.laws && r.laws.tax ? r.laws.tax : 1;
    if (tax > 1) add('law', tax >= 1.5 ? -6 : -3, tax >= 1.5 ? 'Crushing taxes on his tenants' : 'Heavy taxes on his tenants', { t: 'tax' });
    else if (tax < 1) add('law', 2, 'Light taxes', { t: 'tax' });
    add('throne', ((r.stability != null ? r.stability : 50) - 50) / 6, (r.stability || 0) >= 50 ? 'The throne stands firm' : 'The throne is shaking', { t: 'stability', r: Math.round(r.stability || 0) });
    const c = h.contract;
    if (c && typeof c === 'object') {
      if (c.tax === 2) add('oath', -4, 'A heavy oath', { t: 'contract' }); else if (c.tax === 0) add('oath', 3, 'A light oath', { t: 'contract' });
      if (Array.isArray(c.rights) && c.rights.length) add('oath', 2 * Math.min(3, c.rights.length), 'Rights the crown granted his house', { t: 'rights', r: c.rights.length });
    }
    const hp = h.headPid != null ? A.P(h.headPid) : null;
    if (live(hp) && A.POSTS && A.POSTS.held) {
      const held = A.POSTS.held(hp.id);
      if (held.some(k => /^seat:/.test(k))) add('favour', 8, 'A seat on the king\'s council', { t: 'seat', id: hp.id });
      else if (held.some(k => /^(office|shire|pol):/.test(k))) add('favour', 4, 'An office from the crown', { t: 'office', id: hp.id });
    }
    for (const g of (A.CMD && A.CMD.griefs ? A.CMD.griefs(h) : [])) if (A.S.year - g[0] <= 12) add('wrong', -6 * (1 - (A.S.year - g[0]) / 15), cap(g[2] || 'A wrong from the crown'), { t: 'grief', y: g[0], id: g[1] });
    const m = A.WHY ? A.WHY.houseMind(h) : null, T = m ? m.temper : {};
    if (T.ambition) add('temper', -8 * T.ambition, T.ambition > 0 ? 'His ambition' : 'A man content with what he has', { t: 'temper' });
    if (T.honor) add('temper', 5 * T.honor, T.honor > 0 ? 'A man who keeps his oaths' : 'A man light with oaths', { t: 'temper' });
    if (live(hp) && hp.faith && r.faith && hp.faith !== r.faith) add('faith', -8, 'Of another faith than the crown\'s', { t: 'faith', id: hp.faith });
    if (live(hp) && hp.cult && r.cult && hp.cult !== r.cult) add('people', -3, 'Of another people than the crown\'s', { t: 'people', id: hp.cult });
    if (h.great !== false && (h.rung === 'N01' || h.rung === 'N02')) add('ambition', -3, 'A great house that could rule its own lands', { t: 'rung', id: h.rung });
    const lost = ((r.pol && r.pol.lost) || []).filter(y => A.S.year - y < 5).length;
    if (lost) add('war', -3 * Math.min(3, lost), `Sons dead in ${lost === 1 ? 'a lost war' : lost + ' lost wars'} of the crown's`, { t: 'lost', r: lost });
    if (r.pol && r.pol.won && A.S.year - r.pol.won < 5) add('war', 3, 'A war won with the crown', { t: 'won' });
    return out;
  };
  const cap = s => { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };
  PE.cap = cap;
  PE.houseTarget = (h, r) => clamp(Math.round(PE.houseTerms(h, r).reduce((a, x) => a + x.v, 0)), 0, 100);
  PE.housesYear = function (r, houses) {
    for (const h of houses || A.realmHouses(r.id)) {
      const op = h.op != null ? h.op : 50;
      h.op = clamp(Math.round((op + (PE.houseTarget(h, r) - op) * PE.T.houseSettle) * 10) / 10, 0, 100);
    }
  };
  // the terms with what has happened lately (the gap between his loyalty and its terms' sum, fading)
  PE.houseWhy = function (h) {
    const T = PE.houseTerms(h), tg = clamp(T.reduce((a, x) => a + x.v, 0), 0, 100), gap = (h.op != null ? h.op : 50) - tg;
    if (Math.abs(gap) >= 1) T.push({ k: 'lately', v: r1(gap), label: gap > 0 ? 'Favours lately, fading' : 'Slights lately, fading', src: { t: 'lately' } });
    return T;
  };
  // ---------------------------------------------------------------- the record of upheavals, and the news by rank
  // A.S.peace: the newest first, at most PE.T.logCap (rule 21). An entry: { y, d, r, k, chose, why (told), n (reasons
  // with a source behind the choice), ... }. The coherency check "an unreasoned upheaval" reads it.
  PE.T.logCap = 80;
  PE.log = () => (A.S && Array.isArray(A.S.peace) ? A.S.peace : []);
  PE.note = function (r, e, rec) {
    const S = A.S;
    if (!Array.isArray(S.peace)) S.peace = [];
    const o = Object.assign({ y: S.year, d: A.today ? A.today() : 0, r: r ? r.id : null }, e);
    if (rec) {
      o.n = (rec.why || []).filter(x => x && x[3]).length + (rec.not || []).filter(x => x && x[3]).length;
      if (!o.why) o.why = String(A.WHY.tell(rec, true) || '').replace(/[<>"{}]/g, '').slice(0, 200);
    }
    S.peace.unshift(o);
    if (S.peace.length > PE.T.logCap) S.peace.length = PE.T.logCap;
    return o;
  };
  // who hears: 'world' (everyone, the chronicle); 'realm' (anyone of the realm); 'court' (its ruler, councillors and
  // landed lords); 'party' (the houses or people named, and the crown). The reasons (told) go to the crown and parties.
  PE.place = function (rid) {
    const CM = A.CMD;
    if (CM && CM.place) return CM.place(rid);
    const pc = A.pc && A.pc();
    return pc && pc.alive && pc.realm === rid ? (pc.ruler === rid ? 'crown' : 'town') : null;
  };
  PE.isParty = function (parties) {
    const pc = A.pc && A.pc();
    if (!pc || !pc.alive || !parties) return false;
    return parties.some(x => x != null && (String(x) === String(pc.id) || (pc.house && String(x) === String(pc.house))));
  };
  PE.tell = function (r, text, level, told, parties) {
    const rid = r && r.id, place = rid ? PE.place(rid) : null, party = PE.isParty(parties);
    const why = told ? ' ' + told : '';
    if (level === 'world') A.news(text, 'crown');
    if (party || place === 'crown') { A.log(text + why, 'crown'); return; }
    if (level === 'party') return;
    if (place === 'lord' || (level !== 'court' && place)) A.log(text, 'crown');
  };
  const AGAINST = { liberty: 1, independence: 1, claimant: 1 };
  PE.factionOf = h => (A.S.factions || []).find(f => f && f.realm === h.realm && Array.isArray(f.members) && f.members.includes(h.id)) || null;
  PE.stance = function (h) {
    if (!h) return null;
    const f = PE.factionOf(h), op = h.op != null ? h.op : 50;
    let k = 'aggrieved';
    for (const [at, w] of PE.T.stances) if (op >= at) { k = w; break; }
    if ((f && AGAINST[f.kind]) || (PE.inPlot && PE.inPlot(h))) k = 'plotting';
    return { k, op, faction: f ? f.kind : null };
  };
})();
