// Order 99 (D-206): the five forms in play. A.realmForm(r) names a realm's form; an old save is carried over on load.
//
//   A.realmForm(r)        'kingdom', 'empire', 'principality', 'merchant republic' or 'free city': the realm's own r.form
//                         (the lore's, or the one a new realm was made with), else read from its name (pure)
//   A.REALM_FORMS.carry(S) an old save's realms, houses and people in the new words (rules.core.js), once per load: a realm's
//                         name, title, kind (r.type) and primer; a breakaway realm of an old kind (a duchy, a march, a hold,
//                         a priory, a clan, a khanate, an emirate, a league of towns, a lordship) becomes a principality or
//                         a free city, and its ruler a prince or a First Burgher; what a house or a person carries from the
//                         lore (a title, a post, a want, a note). Names of people are never touched, and the prose a life
//                         has kept (its log, its news, the world record) keeps the words it was written in (as C7 did).
// Draws nothing from the random stream; running it twice changes nothing.
(function () {
  const RF = A.REALM_FORMS;
  if (!RF) { console.error('[realm-forms] rules.core.js is missing'); return; }
  const J = RF.J;
  RF.FORMS = ['kingdom', 'empire', 'principality', 'merchant republic', 'free city'];
  A.realmForm = function (r) {
    if (!r) return null;
    if (RF.FORMS.includes(r.form)) return r.form;
    const n = String(r.name || '');
    if (/^Empire of /.test(n) || r.title === 'Emperor') return 'empire';
    if (/^Principality of /.test(n)) return 'principality';
    if (/^Merchant Republic of /.test(n)) return 'merchant republic';
    if (/^Free City of /.test(n)) return 'free city';
    return 'kingdom';
  };

  // the old kinds (r.type) and the ways of rule they keep under the five forms: the same numbers in
  // data/military/standing.json, the same estates, offices and laws in 9996-polity
  RF.OLD_TYPE = {
    theocracy: 'temple principality', [J('sul', 'tanate')]: 'well realm', [J('em', 'irate')]: 'well realm',
    [J('nomad confed', 'eration')]: 'nomad clans', [J('mountain confed', 'eration')]: 'mountain valleys',
    [J('city', '-state')]: 'free city', [J('city', ' league')]: 'merchant towns',
  };
  // a breakaway realm of an old kind (70-fresh-realms-and-tensions before order 99, a faction's breakaway, a realm founded
  // small): its name and its ruler's title under the new form
  const OLD_NAME = [
    [new RegExp(`^(?:Duchy|March|Priory|Hold|Princedom|Lordship|${J('Kh', 'anate')}|${J('Em', 'irate')}) of (.+)$`), 'Principality of $1', 'principality'],
    [/^Clan .+ of (.+)$/, 'Principality of $1', 'principality'],
    [new RegExp(`^${J('Lea', 'gue')} of (.+)$`), 'Free City of $1', 'free city'],
    [new RegExp(`^(.+) ${J('Lea', 'gue')}$`), 'Principality of $1', 'principality'],
  ];
  const OLD_TITLE = { Duke: 'Prince', Margrave: 'Prince', Thane: 'Prince', Chieftain: 'Prince', Lord: 'Prince', Abbot: 'Prince-Abbot',
    [J('Kh', 'an')]: 'Prince', [J('Em', 'ir')]: 'Prince', Speaker: 'First Burgher' };
  const fixAll = (o, rec, skip) => {
    if (!o || typeof o !== 'object') return 0;
    let n = 0;
    for (const k of Object.keys(o)) {
      if (skip && skip.has(k)) continue;
      const v = o[k];
      if (typeof v === 'string') { const w = RF.fix(v, rec); if (w !== v) { o[k] = w; n++; } }
    }
    return n;
  };
  const PERSON_NAMES = new Set(['id', 'given', 'sur', 'name', 'nick', 'birthSur', 'surMode', 'castId', 'house', 'realm', 'org', 'cult', 'faith', 'race', 'sex']);
  const HOUSE_NAMES = new Set(['id', 'name', 'realm', 'kind', 'rung', 'seatId']);
  RF.carry = function (S) {
    let n = 0;
    if (!S || !S.realms || typeof S.realms !== 'object') return n;
    const L = typeof LORE !== 'undefined' && LORE.realms ? LORE.realms : {};
    for (const id of Object.keys(S.realms)) {
      const r = S.realms[id];
      if (!r || typeof r !== 'object') continue;
      if (RF.OLD_TYPE[r.type]) { r.type = RF.OLD_TYPE[r.type]; n++; }
      const lo = L[id];
      if (lo) {
        // a realm of the lore: the words its lore has now, where the save holds the old ones
        if (id === 'POL-21' && r.name === 'Kesh') { r.name = lo.name; n++; }
        if (id === 'POL-27' && r.title === 'Abbot') { r.title = lo.title; n++; }
      } else if (r.fresh && typeof r.fresh === 'object' && !/^(Principality|Free City) of /.test(String(r.name || ''))) {
        // a breakaway of 70-fresh-realms-and-tensions: towns that bought their freedom are a free city, any other a principality
        const free = r.fresh.kind === 'league', cap = String(r.capital || r.short || '').replace(/^the /i, '');
        if (cap) {
          r.name = `${free ? 'Free City' : 'Principality'} of ${cap}`; r.form = free ? 'free city' : 'principality';
          r.title = free ? 'First Burgher' : /^Princess$/.test(r.title) ? 'Princess' : /Abbot|Luminar/.test(r.title || '') || r.type === 'temple principality' ? 'Prince-Abbot' : 'Prince';
          n++;
        }
      } else if (!r.isRebel) {
        for (const [rx, to, form] of OLD_NAME) {
          if (!rx.test(String(r.name || ''))) continue;
          r.name = String(r.name).replace(rx, to); r.form = form; n++;
          if (OLD_TITLE[r.title]) r.title = form === 'free city' ? 'First Burgher' : OLD_TITLE[r.title];
          if (r.title === 'First Burgher' && form !== 'free city') r.title = 'Prince';
          break;
        }
      }
      for (const k of ['name', 'short', 'title']) { const v = r[k]; if (typeof v === 'string') { const w = RF.fix(v, id); if (w !== v) { r[k] = w; n++; } } }
      if (r.primer && typeof r.primer === 'object') n += fixAll(r.primer, id);
      if (lo && !r.form && lo.form) { r.form = lo.form; n++; }
    }
    for (const h of Object.values(S.houses || {})) {
      if (!h || typeof h !== 'object') continue;
      n += fixAll(h, h.realm, HOUSE_NAMES);
      if (h.military && typeof h.military === 'object') n += fixAll(h.military, h.realm);
    }
    for (const p of Object.values(S.people || {})) if (p && typeof p === 'object') n += fixAll(p, p.realm, PERSON_NAMES);
    return n;
  };
  RF.lastCarry = 0;
  const des = A.deserialize;
  if (typeof des === 'function') A.deserialize = function () {
    const r = des.apply(this, arguments);
    try { if (A.S) RF.lastCarry = RF.carry(A.S); } catch (e) { console.error('realm-forms carry', e); }
    return r;
  };
})();
