// M1 (order 71, D-151): the words the world says about itself, held to the one map's facts (data/map/one-continent.json).
// A text makes a claim about a realm when it names the realm (or is the realm's own text: its Codex entry, its customs) and,
// in the same sentence, says something the map decides:
//   coast    it is on the sea (coast, shore, harbour, port, galleys, fleet, lagoon, isle) -> the realm has a coastal province
//   sea      it is on a named water (the Middle Sea, the Grey Channel, the Strait of Hael, the Sea of X) -> it touches it
//   mountain it is high country (mountains, highlands, peaks, the Roof of the World) -> a quarter of its land is high
//   plains   it is open grass (plains, steppe, grassland) -> a fifth of its provinces are plains or steppe
//   desert   it is dry (desert, dunes, sands, the waste) -> a fifth of its provinces are desert or steppe
//   forest   it is wooded (forest, woods, woodland) -> a fifth of its provinces are forest
//   lake     it has lakes (lake, lakeland, mere) -> a province on a lake's shore
//   river    it is a river land (river, a named river) -> a named river runs through it, or its capital stands on one
//   compass  it lies north, south, east or west (the northern plains, the eastern steppe) -> its land's centre lies in that
//            part of the continent (within the outer 45%), or, for "north of <Realm>", north of that realm's centre
//   border   it lies beside a named realm (beside, borders, neighbour, next to) -> the two share a border
// A word another realm's name owns ("Aldmark's plains", "the hold beside Aldmark's plains") is that realm's claim, not the
// sentence's subject's. A sentence that names several realms is read word by word: each word goes to the nearest realm
// named before it in the sentence; with none before, to the text's own realm if it has one; else it is not read.
// Pure: no I/O. Used by tools/lint-lore-map.mjs and tests/v2/lore-map.test.js.

export const KINDS = {
  coast: /\b(coasts?|coastal|(?<=\b(?:the|a|its|their|his|her|on|along|from|to)\s)shores?|harbou?rs?|seaports?|ports?|galleys|longships|fleets?|lagoons?|isles?|islands?|seafar\w*)\b/gi,
  // a mountain land, not a mountain man: the plural, or "mountain" before a word of the land
  mountain: /\b(mountains|mountainous|highlands?|the peaks|alpine|roof of the world|mountain (?:valleys?|pass(?:es)?|holds?|kingdom|realm|state|clans?|folk|towns?|fortress(?:es)?))\b/gi,
  plains: /\b(plains|steppes?|grasslands?)\b/gi,
  desert: /\b(deserts?(?!\s+(?:the|his|her|their|him|its)\b)|dunes|the sands|red waste)\b/gi,
  forest: /\b(forests?|woodlands?)\b/gi,
  lake: /\b(lakes?|lakeland|meres)\b/gi,
  river: /\b(rivers?(?![ -](?:horses?|stairs|steps|gate|gods?|spirits?|party|god)\b)|river kingdom)\b/gi,
  // where a land lies, not which way a road runs: a compass word before a word of the land ("the northern plains", "the
  // far northern isle", "the eastern steppe"); "the northern border" is a side of a realm, not its place
  compass: /\b(?:far )?(north|south|east|west)ern (?:plains|steppes?|isles?|islands?|kingdoms?|realms?|empire|grass(?:lands?)?|lands?|waste|hills|highlands|mountains|forests?|frontier)\b/gi,
};
// the nouns a land word modifies when it names where a thing comes from, not the realm's own ground
export const MODIFIED = /^\s+(horses?|horsemen|pon(?:y|ies)|mares?|bred|blood|marches|march|roads?|edge|towers?|watch\w*|tribes?|clans?|riders?|lords?|folk|silver|crossbow\w*|spears?|men|archers|levies|price|trade|wool|furs?|fever|yellow|bows?|heat|castles?|soldiers|castellans?|herds?|wind|raiders?|scouts?|guards?|wardens?|outlaws?|nomads?|caravans?|ponies|dogs?|goats?|sheep|cattle)\b/i;
// a land word after these is a place over the border or a thing's origin ("horses from the steppe", "held against the desert")
export const TOWARD = /\b(from|against|toward|towards|across|beyond|facing|into|onto|off|over)\s+the\s+$/i;
// the lakes the design keeps under the map's grain (docs/design/m1/map-design.md 3.4): places, not water on the grid
export const UNDER_GRAIN = /^(Lake Nubako|Lake Bluespire|Lake Ostec|Stillhold Lakes|Crown Lakes)$/i;
// names of a region that is one realm's: read as that realm named
export const REGIONS = { Lakeland: 'POL-26', 'the Neck': 'POL-31', 'Red Waste': 'POL-19', 'Golden Plains': 'POL-20', 'Roof of the World': 'POL-27', Evenwood: 'POL-06',
  // the design's regions that are one realm's (docs/design/m1/map-design.md section 5)
  'Grass Sea': 'POL-11', 'Salt Steppe': 'POL-12', 'Elder Coast': 'POL-07', 'Holy Coast': 'POL-02', 'Crown Coast': 'POL-03', 'Santora March': 'POL-15',
  'Long Rift': 'POL-18', 'Monsoon Coast': 'POL-30', 'White Coast': 'POL-23', 'Amber Strand': 'POL-01', 'Silk Strand': 'POL-34', 'Northern Lakes': 'POL-03' };
// a named water: "the Middle Sea", "the Salt Sea", "the Grey Channel", "the Strait of Hael", "Cold Bay", "the Sea of Oakden"
export const NAMED_WATER = /\b(?:the )?(?:(?:Sea|Strait|Straits|Gulf|Bay|Lake) of [A-Z][a-z]+(?: [A-Z][a-z]+)?|Lake [A-Z][a-z]+|(?!(?:The|A|An|Its|His|Her|Their|Our|Your|This|That|Every|No|Each) )(?:[A-Z][a-z]+ ){1,2}(?:Sea|Channel|Strait|Straits|Gulf|Bay|Sound|Lake|Lakes|Mere))\b(?!-)/g;
export const NAMED_RIVER = /\b(?:the )?River [A-Z][a-z]+\b|\bthe [A-Z][a-z]+ River\b/g;
export const REL_COMPASS = /\b(north|south|east|west)(?:ern)? of (?:the )?([A-Z][A-Za-z]+)/g;

// the forms a realm is named by: its full name, its short name, "the Kingdom of X" and the like
export function realmForms(lore) {
  const out = [];
  for (const id of Object.keys(lore.realms)) {
    const R = lore.realms[id], forms = new Set([R.name, R.short].filter(Boolean));
    if (R.short) forms.add(R.short + "'s");
    out.push({ id, forms: [...forms].sort((a, b) => b.length - a.length) });
  }
  return out;
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function realmMatcher(lore) {
  const forms = realmForms(lore), map = new Map();
  for (const r of forms) for (const f of r.forms) map.set(f.replace(/'s$/, ''), r.id);
  for (const k of Object.keys(REGIONS)) if (lore.realms[REGIONS[k]]) map.set(k, REGIONS[k]);
  const names = [...map.keys()].sort((a, b) => b.length - a.length);
  const rx = new RegExp('\\b(' + names.map(esc).join('|') + ')(\'s)?\\b', 'g');
  return { rx, idOf: n => map.get(n) };
}

// the sentences of a text (a sentence ends at . ! ? ; or a line break)
export const sentences = t => String(t).split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim()).filter(Boolean);

// the claims one sentence makes: [{ realm, kind, word, arg, at }]
export function claimsIn(sentence, owner, M, opts) {
  opts = opts || {};
  const s = String(sentence), mentions = [];
  M.rx.lastIndex = 0; let m;
  while ((m = M.rx.exec(s))) { const id = M.idOf(m[1]); if (id) mentions.push({ id, at: m.index, end: m.index + m[0].length, poss: !!m[2] }); }
  const ids = [...new Set(mentions.map(x => x.id))];
  // the realm a word at position i belongs to
  const whose = i => {
    // a possessive ("Aldmark's plains") owns the words right after it; past them the sentence's subject takes them back
    let best = null;
    const near = x => { const gap = s.slice(x.end, i); return !/[,;:()]/.test(gap) && gap.trim().split(/\s+/).filter(Boolean).length <= 2; };
    for (const x of mentions) if (x.end <= i && (!x.poss || near(x))) best = x;
    if (best) return best.id;
    // a word before any realm is named, in a text that is no realm's own, is not read ("took highland silver from Aldmark")
    return owner || null;
  };
  const out = [];
  const waters = []; { const W0 = new RegExp(NAMED_WATER.source, 'g'); let w0; while ((w0 = W0.exec(s))) waters.push([w0.index, w0.index + w0[0].length]); }
  for (const kind of Object.keys(KINDS)) {
    // where a realm lies on the compass is the Codex's to say: elsewhere "the eastern hills" are a side of a realm
    if (kind === 'compass' && !opts.codex) continue;
    const rx = new RegExp(KINDS[kind].source, 'gi'); let k;
    while ((k = rx.exec(s))) {
      // a word inside a realm's or region's own name ("the Lakeland"), or a named water's ("Lake Bluespire"), is that name
      if (mentions.some(x => k.index < x.end && k.index + k[0].length > x.at)) continue;
      if (waters.some(([a, b]) => k.index < b && k.index + k[0].length > a)) continue;
      // a dry lake is a salt flat; "no fleet", "without a harbour" deny, not claim
      if (kind === 'lake' && /\b(dry|salt)\s+$/i.test(s.slice(Math.max(0, k.index - 6), k.index))) continue;
      if (/\b(no|without|not|never|nor|cannot)\s+(?:\w+\s+){0,2}$/i.test(s.slice(Math.max(0, k.index - 24), k.index))) continue;
      const realm = whose(k.index); if (!realm) continue;
      // a word of the land used of something else ("steppe horses", "highland silver", "the Steppe March"): the realm or a
      // neighbour has that ground
      // outside the Codex a land word may name the land just over the border (a march's hills, the steppe a raid comes from)
      const next = s.slice(k.index + k[0].length, k.index + k[0].length + 16), prev = s.slice(Math.max(0, k.index - 16), k.index);
      const near = /^(plains|mountain|desert|forest|lake)$/.test(kind) && (!opts.codex || /^-/.test(next) || MODIFIED.test(next) || TOWARD.test(prev));
      out.push({ realm, kind: near ? 'near ' + kind : kind, word: k[0], arg: kind === 'compass' ? k[1].toLowerCase() : null, at: k.index });
    }
  }
  const W = new RegExp(NAMED_WATER.source, 'g'); let w;
  while ((w = W.exec(s))) { if (mentions.some(x => w.index < x.end && w.index + w[0].length > x.at)) continue; const realm = whose(w.index) || (ids.length === 1 ? ids[0] : null); if (realm) out.push({ realm, kind: 'sea', word: w[0], arg: w[0].replace(/^the /, ''), at: w.index }); }
  const V = new RegExp(NAMED_RIVER.source, 'g'); let v;
  while ((v = V.exec(s))) { const realm = whose(v.index); if (realm) out.push({ realm, kind: 'named river', word: v[0], arg: v[0].replace(/^the /, ''), at: v.index }); }
  const C = new RegExp(REL_COMPASS.source, 'g'); let c;
  while ((c = C.exec(s))) { const other = M.idOf(c[2]); const realm = whose(c.index); if (other && realm && other !== realm) out.push({ realm, kind: 'compass of', word: c[0], arg: [c[1].toLowerCase(), other], at: c.index }); }
  // a border: "beside X", "borders X", "the border with X", "X's border", "the X border", "X's neighbour"; the subject is the
  // text's own realm, else the realm named before X
  for (const x of mentions) {
    const before = s.slice(Math.max(0, x.at - 40), x.at), after = s.slice(x.end, x.end + 24);
    if (!(/\b(beside|bordering|borders|border with|neighbou?r(?:s|ing)?(?: of| to)?|next to|marches with)\s+(?:the\s+)?$/i.test(before) || /^\s+(?:border|frontier)\b/i.test(after))) continue;
    const prev = mentions.filter(y => y.end <= x.at && y.id !== x.id).pop();
    const subj = owner && owner !== x.id ? owner : prev ? prev.id : null;
    if (subj && subj !== x.id) out.push({ realm: subj, kind: 'border', word: (before.match(/\b(beside|bordering|borders|border with|neighbou?r\w*|next to|marches with)\b/i) || after.match(/border|frontier/i) || [''])[0], arg: x.id, at: x.at });
  }
  return out;
}

// is a claim true of the map? null when it is, else why not
export function judge(c, F) {
  const R = F.realms[c.realm]; if (!R) return null;
  const n = R.provinces || 1, share = (...ws) => ws.reduce((a, w) => a + (R.terr[w] || 0), 0) / n;
  const has = (o, name) => Object.keys(o || {}).some(k => k.replace(/^the /i, '').toLowerCase() === String(name).replace(/^the /i, '').toLowerCase());
  switch (c.kind) {
    // a coast, an inland sea or lake the map counts as one, or ship water (a river galleys use)
    case 'coast': return R.coastal > 0 || R.capital.coast || (R.shipWater || []).length ? null : `${R.short} has no coast on the map`;
    case 'sea': {
      const nm = c.arg.toLowerCase();
      if (has(R.seas, c.arg) || has(R.lakes, c.arg) || UNDER_GRAIN.test(c.arg)) return null;
      // a water the map makes a river (the design's Grey Channel)
      if ((R.rivers || []).some(x => x.replace(/^the /i, '').toLowerCase() === nm)) return null;
      const known = (F.waters || []).some(w => w.name.replace(/^the /i, '').toLowerCase() === nm) || (F.rivers || []).some(w => w.name.replace(/^the /i, '').toLowerCase() === nm);
      // a water of the open sea is reached by any realm with a sea coast or ship water to the ocean; an enclosed one only
      // from its shores (Lucerna cannot sail to the Strait of Hael)
      const wat = (F.waters || []).find(w => w.name.replace(/^the /i, '').toLowerCase() === nm);
      const toSea = Object.keys(R.seas || {}).length > 0 || (R.shipWater || []).length > 0;
      if (wat && !/lake|inland sea|lagoon/.test(wat.kind) && toSea) return null;
      if (known) return `${R.short} is not on ${c.arg}`;
      // a bay, a sound, a harbour or a lake too small for the map is the realm's own if it has that water
      if (/\b(bay|sound|cove|harbou?r)\b/i.test(c.arg)) return R.coastal > 0 || R.capital.coast ? null : `${R.short} has no coast for ${c.arg}`;
      if (/\b(lake|mere)\b/i.test(c.arg)) return Object.keys(R.lakes || {}).length || R.capital.lake ? null : `${R.short} has no lake for ${c.arg}`;
      return `the map has no ${c.arg}`;
    }
    case 'mountain': return R.high >= 0.25 || share('mountains', 'hills') >= 0.25 || (R.ranges || []).length ? null : `${R.short} has little high ground (${Math.round(R.high * 100)}% above 1,000 m)`;
    case 'plains': return share('plains', 'steppe') >= 0.2 ? null : `${R.short} has no plains or steppe to speak of`;
    case 'near plains': case 'near mountain': case 'near desert': case 'near forest': case 'near lake': {
      const k = c.kind.slice(5), all = [c.realm].concat(R.neighbours || []), N = R.near || { terr: {} }, t = N.terr || {};
      if (all.some(r => F.realms[r] && judge({ realm: r, kind: k }, F) === null)) return null;
      // the land just over the border, a wild's as well as a realm's
      const over = { plains: t.plains || t.steppe, mountain: N.high || t.mountains || t.hills, desert: t.desert || t.steppe, forest: t.forest, lake: N.lake }[k];
      return over ? null : `neither ${R.short} nor the land beside it has that ${k} ground`;
    }
    case 'desert': return share('desert', 'steppe') >= 0.2 ? null : `${R.short} is not dry country`;
    case 'forest': return share('forest') >= 0.2 || (R.forests || []).length ? null : `${R.short} is not wooded`;
    case 'lake': return Object.keys(R.lakes || {}).length || R.capital.lake ? null : `${R.short} has no lake`;
    // "the river" may be the one at the border: a river through the realm, at its capital, or through a neighbour
    case 'river': return (R.rivers || []).length || R.capital.river || (R.neighbours || []).some(r => F.realms[r] && (F.realms[r].rivers || []).length) ? null : `${R.short} has no river of note`;
    // a river the map names must run through the realm; one too small for the map to name needs a river or stream there
    case 'named river': return (R.rivers || []).some(x => x.replace(/^the /i, '') === c.arg) ? null : (F.rivers || []).some(x => x.name.replace(/^the /i, '') === c.arg) ? `${c.arg} does not run through ${R.short}` : (R.rivers || []).length || R.capital.river || R.capital.stream ? null : `${R.short} has no river for ${c.arg}`;
    case 'compass': {
      const { u, v } = R.compass, d = c.arg;
      const ok = d === 'north' ? v <= 0.45 : d === 'south' ? v >= 0.55 : d === 'east' ? u >= 0.55 : u <= 0.45;
      return ok ? null : `${R.short} does not lie ${d} (u ${u}, v ${v})`;
    }
    case 'compass of': {
      const [d, other] = c.arg, O = F.realms[other]; if (!O) return null;
      const ok = d === 'north' ? R.compass.v < O.compass.v : d === 'south' ? R.compass.v > O.compass.v : d === 'east' ? R.compass.u > O.compass.u : R.compass.u < O.compass.u;
      return ok ? null : `${R.short} is not ${d} of ${O.short}`;
    }
    case 'border': return (R.neighbours || []).includes(c.arg) ? null : `${R.short} does not border ${(F.realms[c.arg] || {}).short || c.arg}`;
  }
  return null;
}

// every claim of a text, judged: [{ realm, kind, word, why, sentence }]
export function check(text, owner, M, F, opts) {
  const out = [];
  for (const s of sentences(text)) for (const c of claimsIn(s, owner, M, opts)) {
    const why = judge(c, F);
    out.push(Object.assign(c, { why, sentence: s.length > 220 ? s.slice(0, 217) + '...' : s }));
  }
  return out;
}
