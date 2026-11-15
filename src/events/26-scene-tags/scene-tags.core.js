// 26-scene-tags · every event has a scene tag: where it happens (C8c, D-060; CRITIQUE V17: "a farming offer shows a
// forge; a cow in a ditch shows a bedroom").
//
// A tag is one of A.SCENE.TAGS. An event may say its own (`scene: "field"` on the event); the rest are read once from
// the event's own words (a hit in the title counts twice), its shape (25-variety-guard's A.evShape) and who it is for (A.evAudience), and kept. The tag is
// for pictures only: the event's print is chosen from it (61-illuminated-chronicle, 94-woodblock-skies) and the people
// on the card are dressed for it (93-figures). It changes no weight, no roll and no state: A.evShape still guards the
// variety of the roll as it did.
//
//   A.SCENE.tagOf(e)        the tag of an event definition
//   A.SCENE.of(q)           the tag of a queued event (its ctx.scene if a feature set one, else its definition's)
//   A.SCENE.shapeFor(e)     the print that fits: the event's own shape when that shape can stand in the scene, else the
//                           scene's own print
//   A.SCENE.wearFor(tag)    how people dress there (an occasion of the figure library's WEARS)
//   A.SCENE.outdoors(tag)   whether the scene is under the sky (hoods and straw hats are for out of doors)
(function () {
  const SC = A.SCENE = {};
  SC.TAGS = ['court', 'home', 'church', 'market', 'field', 'workshop', 'road', 'sea', 'wild', 'war', 'fight', 'tavern', 'street', 'sickbed', 'school', 'prison', 'grave', 'feast'];
  SC.NAME = { court: 'a court', home: 'a house', church: 'a church', market: 'a market', field: 'the fields', workshop: 'a workshop', road: 'the road', sea: 'the sea', wild: 'the wild', war: 'a camp of war', fight: 'a fight',
    tavern: 'a tavern', street: 'a street', sickbed: 'a sickbed', school: 'a schoolroom', prison: 'a prison', grave: 'a graveside', feast: 'a feast' };
  // the words that place a scene. A hit in the title counts three times a hit in the text.
  SC.WORDS = {
    sea: /\b(ships?|deck|sails?|sailors?|harbou?rs?|tide|oars?|voyage|at sea|shipmaster|quay|docks?|boats?|nets?|wharf|strand|galley|the port|crews)\b/gi,
    prison: /\b(cell|dungeon|gaol|gaoler|jail|jailer|chains|prison|shackles?|the stocks)\b/gi,
    grave: /\b(funeral|graves?|graveside|graveyard|burial|buried|bury|pyre|mourners?|coffin|bier)\b/gi,
    war: /\b(battle|siege|army|armies|muster|war camp|the camp|the host|levy|levies|banners?|campaign|soldiers?|garrison|sergeant|recruiter|recruiting|the line|sentry|picket|squad|rations?|the mess|column|general|march(?:es|ed|ing)?|the lists|captain|drill(?:s|ed|ing)?|the section|spearmen)\b/gi,
    fight: /\b(duel|brawl|ambush|bandits?|cutthroats?|draws? (?:a|his|her) (?:knife|blade|sword)|fists?|bouts?)\b/gi,
    church: /\b(priests?|temple|shrine|chapel|abbey|abbot|bishop|monks?|nuns?|pray(?:s|er|ers|ing)?|altar|sermon|church(?:es)?|pilgrims?|relic|confess\w*|tithe|vigil)\b/gi,
    court: /\b(court|throne|council|king|queen|emperor|audience|herald|duke|duchess|chancellor|courtiers?|envoys?|petition|the lord's hall|great hall|liege|vassals?|homage|tapestry|conspirators)\b/gi,
    sickbed: /\b(fever|sickbed|physician|plague|midwife|illness|sickness|pox|bedside|birthing|labour pains|healer|dying|deathbed)\b/gi,
    field: /\b(plough\w*|harvest(?:ing|ers)|furrows?|fields?|reap\w*|sow(?:s|ing)?|seed|sheaves|flocks?|herds?|pasture|barn|cows?|sheep|ox|oxen|hay|orchard|thresh\w*|crops?|farm\w*|shepherds?|lambing|scythe|strips?|foals?|barley|acres|dykes?|ditch(?:es)?|fen|byres?|hedge)\b/gi,
    workshop: /\b(forge|anvil|workshop|loom|workbench|kiln|apprentices?|journeym[ae]n|the shop|guild|masterwork|bellows|lathe|the mine|tannery|brewhouse|mill|master of works)\b/gi,
    market: /\b(market|bazaar|stalls?|haggl\w*|the fair|wares|bargain|traders?|pedlars?|customers?|buyers?|brokers?|dealers?|price|merchants?|counting-house|moneylender)\b/gi,
    tavern: /\b(taverns?|inn|alehouse|ale|dice|drunk\w*|taproom|innkeeper|cups)\b/gi,
    school: /\b(tutor|lessons?|school|schoolroom|slate|scholars?|study|studies|library|archive|copyist|copying|master of letters|pupils?|the class)\b/gi,
    feast: /\b(feast|banquet|wedding|revel|toast|high table|minstrels?|festival|garland\w*)\b/gi,
    wild: /\b(forest|woods?|wolf|wolves|boar|hunt(?:s|ing)?|bear|moor|mountains?|marsh|cave|thicket|tracks|oaks?|deer|stag|clearing|the trees|hounds)\b/gi,
    road: /\b(road|journey|caravan|riding|travell?ers?|wagon|carts?|bridge|ford|crossroads|milestone|waystation|toll)\b/gi,
    street: /\b(streets?|alley|square|crowd|town gate|lane|beggars?|watchmen|the watch|gutter|pickpockets?|neighbou?rs?|process(?:ion|es)?|curfew)\b/gi,
    home: /\b(hearth|home|kitchen|cradle|supper|the house|your house|your door|doorstep|bedchamber|nursery|cottage|roof|your hall)\b/gi,
  };
  // a tie goes to the scene that is the rarer and the more particular place
  SC.ORDER = ['sea', 'prison', 'grave', 'war', 'fight', 'church', 'court', 'sickbed', 'field', 'workshop', 'market', 'tavern', 'school', 'feast', 'wild', 'road', 'street', 'home'];
  // the scene a shape most often is, when the words do not say
  SC.OF_SHAPE = { travel: 'road', tavern: 'tavern', court: 'court', war: 'war', fight: 'fight', money: 'home', kin: 'home', work: 'workshop', faith: 'church', food: 'home', sickness: 'sickbed', letter: 'home',
    learning: 'school', subordinate: 'court', beast: 'wild', death: 'grave', play: 'home', love: 'home', weather: 'field', menace: 'street', errand: 'road', favor: 'court', crime: 'street', street: 'street' };
  SC.OF_JOB = { farm: 'field', herd: 'field', fish: 'sea', labor: 'street', servant: 'home', smith: 'workshop', mason: 'workshop', weaver: 'workshop', bowyer: 'workshop', carpenter: 'workshop', brewer: 'workshop', merchant: 'market',
    scribe: 'school', healer: 'sickbed', clergy: 'church', sailor: 'sea', pirate: 'sea', thief: 'street', hunter: 'wild', minstrel: 'tavern', miner: 'workshop', courtier: 'court', mercenary: 'war' };
  // the scene's own print, and the prints that can stand in it (the event keeps its own shape when it is one of these)
  SC.PRINT = { court: 'court', home: 'kin', church: 'faith', market: 'market', field: 'field', workshop: 'work', road: 'travel', sea: 'travel', wild: 'beast', war: 'war', fight: 'fight', tavern: 'tavern', street: 'street',
    sickbed: 'sickness', school: 'learning', prison: 'menace', grave: 'death', feast: 'food' };
  SC.FITS = {
    court: ['court', 'favor', 'subordinate', 'letter'], home: ['kin', 'letter', 'love', 'food', 'play', 'learning', 'sickness', 'death', 'money'], church: ['faith', 'death', 'love'], market: ['market', 'money', 'street', 'crime'],
    field: ['field', 'weather', 'beast'], workshop: ['work', 'money'], road: ['travel', 'errand', 'weather', 'menace', 'beast'], sea: ['travel', 'weather'], wild: ['beast', 'weather', 'none'], war: ['war', 'fight', 'subordinate', 'death'],
    fight: ['fight', 'menace', 'crime'], tavern: ['tavern', 'play', 'food'], street: ['street', 'menace', 'crime', 'errand'], sickbed: ['sickness', 'death'], school: ['learning', 'letter'], prison: ['menace'], grave: ['death', 'faith'],
    feast: ['food', 'love', 'play', 'court'],
  };
  SC.WEAR = { court: 'best', church: 'best', feast: 'best', grave: 'mourning', road: 'travel', sea: 'travel', wild: 'travel', war: 'arms', fight: 'arms', field: 'work', workshop: 'work' };
  SC.OUT = new Set(['road', 'sea', 'wild', 'war', 'field', 'street', 'market', 'grave', 'fight']);
  SC.wearFor = tag => SC.WEAR[tag] || 'day';
  SC.outdoors = tag => SC.OUT.has(tag);

  const src = v => { try { return typeof v === 'function' ? v.toString() : String(v || ''); } catch (e) { return ''; } };
  const count = (rx, s) => { rx.lastIndex = 0; const m = s.match(rx); return m ? m.length : 0; };
  const KEPT = new WeakMap();
  SC.scoreOf = function (e) {
    const title = typeof e.title === 'function' ? '' : String(e.title || ''), text = src(e.text).slice(0, 4000).replace(/\{[A-Za-z0-9_]+\}/g, ' '), sc = {};      // a token ({home}) is not a word of the scene
    for (const t of SC.TAGS) { const n = count(SC.WORDS[t], title) * 2 + Math.min(4, count(SC.WORDS[t], text)); if (n) sc[t] = n; }
    let shape = null, aud = null;
    try { shape = A.evShape ? A.evShape(e) : null; } catch (x) {}
    try { aud = A.evAudience ? A.evAudience(e) : null; } catch (x) {}
    if (shape && SC.OF_SHAPE[shape]) sc[SC.OF_SHAPE[shape]] = (sc[SC.OF_SHAPE[shape]] || 0) + .9;        // the shape counts for a little less than one word of place
    // who the event is for leans it (read from its condition, as A.CX_RX reads it): a soldier's event to the camp, a
    // ruler's to the court, a smith's to the workshop
    const c = (aud && aud.cond) || {}, cs = src(e.cond).slice(0, 1500).replace(/!\s*(?:C\.\w+\([^)]*\)|p\.[\w.]+)/g, ' '), add       // what the condition rules out is not who it is for
      = (t, v) => { sc[t] = (sc[t] || 0) + v; };
    if (c.soldier || /\bp\.mil\b|C\.soldier\(|C\.atWar\(/.test(cs)) add('war', 1.5);
    if (c.ruler || /C\.ruler\(|\bp\.ruler\b/.test(cs)) add('court', 1.5);
    if (c.child || /C\.child\(/.test(cs)) add('home', 1);
    if (/C\.prison\(|\bp\.prison\b/.test(cs)) add('prison', 3);
    if (/C\.atSchool\(/.test(cs)) add('school', 1.5);
    const jm = cs.match(/["'](farm|herd|fish|labor|servant|smith|mason|weaver|bowyer|carpenter|brewer|merchant|scribe|healer|clergy|sailor|pirate|thief|hunter|minstrel|miner|courtier|mercenary)["']/);
    if (jm && /\.job\b|C\.job\(/.test(cs)) add(SC.OF_JOB[jm[1]], 1.5);
    return sc;
  };
  SC.tagOf = function (e) {
    if (!e || typeof e !== 'object') return 'home';
    if (typeof e.scene === 'string' && SC.TAGS.includes(e.scene)) return e.scene;
    let t = KEPT.get(e);
    if (t) return t;
    const sc = SC.scoreOf(e); let best = 0; t = 'home';
    for (const k of SC.ORDER) if ((sc[k] || 0) > best) { best = sc[k]; t = k; }
    KEPT.set(e, t);
    return t;
  };
  SC.of = function (q) {
    if (!q) return null;
    if (q.ctx && typeof q.ctx.scene === 'string' && SC.TAGS.includes(q.ctx.scene)) return q.ctx.scene;
    const e = q.type === 'event' && A.EV ? A.EV[q.ev] : null;
    return e ? SC.tagOf(e) : null;
  };
  SC.shapeFor = function (e, tag0) {
    const tag = tag0 && SC.TAGS.includes(tag0) ? tag0 : SC.tagOf(e); let shape = null;
    try { shape = A.evShape ? A.evShape(e) : null; } catch (x) {}
    return shape && (SC.FITS[tag] || []).includes(shape) ? shape : SC.PRINT[tag] || 'none';
  };
  // how many events wear each tag (tools and tests)
  SC.census = function () { const n = {}; for (const id in A.EV) { const t = SC.tagOf(A.EV[id]); n[t] = (n[t] || 0) + 1; } return n; };
})();
