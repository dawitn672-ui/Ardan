// Variety guard (Road to Ten, Events 5): no event again within 10 years unless its author set a shorter cooldown, and
// no two events of the same shape back to back. A shape is the scene's setting or theme (a tavern, a street, a fight,
// a beast, a sickness, love, faith, money, kin, a letter, the weather, learning), read once from the title and text.
// Engine side only: it changes the weights the event roll already draws with, and keeps the last shapes the player saw.
(function () {
  A.EV_COOL = 10;   // the default cooldown in years (the release used 6)
  const THEMES = [
    ['tavern', null], ['street', null], ['menace', null], ['favor', null], ['errand', null], ['subordinate', null],
    ['fight', /\b(duel|duels|brawl|brawls|fight|fights|blade|sword|swords|ambush|bandits?|raid|raiders|cutthroat)\b/i],
    ['beast', /\b(wolf|wolves|bear|bears|boar|boars|beast|beasts|serpent|wyrm|dragon|hounds?)\b/i],
    ['sickness', /\b(fever|sick|sickness|plague|pox|cough|illness|ill|wound|wounds|wounded|healer)\b/i],
    ['love', /\b(kiss|kisses|love|lover|lovers|courting|courtship|betrothal|betrothed|wedding|flirts?|sweetheart)\b/i],
    ['faith', /\b(priests?|temple|temples|shrine|shrines|prayers?|gods?|saints?|monks?|nuns?|heresy|heretic|pilgrims?)\b/i],
    ['money', /\b(coins?|debts?|purse|silver|prices?|merchants?|loan|loans|wages?|taxes|tax)\b/i],
    ['kin', /\b(mother|father|sister|brother|son|daughter|cousin|uncle|aunt|grandmother|grandfather|nephew|niece)\b/i],
    ['letter', /\b(letter|letters|message|courier|sealed)\b/i],
    ['weather', /\b(storm|storms|snow|flood|floods|drought|frost|hail|gale)\b/i],
    ['learning', /\b(book|books|scroll|scrolls|lesson|lessons|tutor|school|schooling|letters and numbers)\b/i],
    ['death', /\b(funeral|funerals|grave|graves|graveyard|dies|died|dying|death|deathbed|corpse|buried|burial|mourning)\b/i],
    ['war', /\b(army|armies|soldiers?|war|siege|levy|levies|camp|muster|sergeant|captain|company|garrison|deserters?)\b/i],
    ['crime', /\b(thief|thieves|steal|stolen|stole|smugglers?|smuggling|bribe|bribes|forgery|forged|poach|poacher|outlaws?)\b/i],
    ['court', /\b(court|courtiers?|council|councillors?|king|queen|crown|throne|steward|chancellor|audience|envoy|petition)\b/i],
    ['travel', /\b(road|roads|journey|travell?ers?|travel|ship|ships|sea|river|ferry|bridge|pass|caravan|inn yard|crossing)\b/i],
    ['food', /\b(feast|feasts|bread|harvest|hunger|famine|grain|cook|cooking|kitchen|supper|meal)\b/i],
    ['work', /\b(work|workshop|craft|guild|apprentice|journeyman|master|shop|forge|field|fields|plough|mill|loom|market|trade)\b/i],
    ['play', /\b(play|plays|game|games|toy|toys|children|friends|race|races|swim|climb|dare)\b/i],
  ];
  const src = v => { try { return typeof v === 'function' ? v.toString() : String(v || ''); } catch (e) { return ''; } };
  // the shape of an event; cached, non-enumerable, like A.evAudience's
  A.evShape = function (e) {
    if (!e) return null;
    if (e._shape !== undefined) return e._shape;
    const a = A.evAudience ? A.evAudience(e) : { txt: {} };
    const title = typeof e.title === 'function' ? '' : String(e.title || ''), text = src(e.text);
    let s = null;
    for (const [k, rx] of THEMES) if (!rx && a.txt && a.txt[k]) { s = k; break; }
    if (!s) for (const part of [title, text]) { for (const [k, rx] of THEMES) if (rx && rx.test(part)) { s = k; break; } if (s) break; }
    Object.defineProperty(e, '_shape', { value: s, enumerable: false, configurable: true, writable: true });
    return s;
  };
  // the weight multiplier for an event about to be rolled: a shape just seen is rare, the same shape a third time is out
  A.evVariety = function (e, pc) {
    const s = A.evShape(e); if (!s) return 1;
    const last = (A.S.evShapes || []).slice(-2);
    for (const q of A.S.queue || []) if (q && q.type === 'event' && A.EV[q.ev]) last.push(A.evShape(A.EV[q.ev]));   // already queued this roll
    const n = last.length;
    if (n >= 2 && last[n - 1] === s && last[n - 2] === s) return 0;
    return last[n - 1] === s ? 0.15 : 1;
  };
  // Events picked from small pools (job duties, path flows) and NPC moves skip the roll and its cooldown, and come back
  // every 2 to 4 years. A hard 10-year ban would empty those pools, so they get a preference instead: an event seen in
  // the last 10 years weighs a quarter, times the shape guard.
  A.EV_RECENT_W = 0.25;
  A.EV_RECENT_NPC_W = 0.1;   // an NPC move of a kind made in the last 10 years (by anyone)
  A.evRecency = function (e, pc) {
    if (!e) return 1;
    const seen = pc && pc.flags && pc.flags.ev && pc.flags.ev[e.id];
    return (seen != null && A.S.year - seen < (A.EV_COOL || 10) ? A.EV_RECENT_W : 1) * (A.evVariety ? A.evVariety(e, pc) : 1);
  };
  const NI = A.NPCI;
  if (NI && typeof NI.choose === 'function' && !NI.choose.variety) {
    const choose = NI.choose;
    NI.choose = function (list) {
      const pc = A.pc(), st = pc && pc.npci, y = A.S.year;
      const w = x => { const K = NI.KINDS[x.k], e = K && A.EV[K.ev];
        const kindSeen = st && st.k && st.k[x.k] != null && y - st.k[x.k] < (A.EV_COOL || 10);
        return (kindSeen ? A.EV_RECENT_NPC_W : 1) * (A.evVariety && e ? A.evVariety(e, pc) : 1); };
      return choose.call(this, A.evRecency ? list.map(x => Object.assign({}, x, { w: x.w * w(x) })) : list);
    };
    NI.choose.variety = true;
  }

  // the shapes the player actually saw, in order (the last 6)
  const seen = q => {
    if (!q || q.type !== 'event' || q._shapeSeen) return;
    Object.defineProperty(q, '_shapeSeen', { value: true, enumerable: false, configurable: true });
    const e = A.EV[q.ev], s = e ? A.evShape(e) : null;
    const S = A.S; S.evShapes = (S.evShapes || []).concat([s || '']).slice(-6);
  };
  for (const name of ['eventChoose', 'eventAuto']) {
    const f = A[name]; if (typeof f !== 'function' || f.variety) continue;
    A[name] = function () { seen(A.S.queue[0]); return f.apply(this, arguments); };
    A[name].variety = true;
  }
})();
