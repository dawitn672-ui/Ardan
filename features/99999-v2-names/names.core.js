// 99999-v2-names: eight realms named like kingdoms (the owner, Nov 5). Ids, peoples, cultures, governments and
// histories stay; only the names change, everywhere the player reads them.
//
//   POL-32 Sultanate of the Amber Isles / Amber Isles  ->  Sultanate of Ambrel / Ambrel
//   POL-21 League of the Spice Coast / Kesh             ->  League of Kesh / Kesh
//   POL-33 Brotherhood of Blackreef / Blackreef         ->  Principality of Corvasse / Corvasse (its capital too)
//   POL-19 Confederacy of the Sand Clans / Sand Clans   ->  Confederacy of Sahrim / Sahrim
//   POL-12 Khanate of the Nine Winds / Nine Winds       ->  Khanate of Ulun / Ulun
//   POL-34 League of the Tusk Clans / Tusk Clans        ->  Dominion of Ughrak / Ughrak
//   POL-13 Highland League / Highland                   ->  Kingdom of Brannoch / Brannoch
//   POL-11 Horde of Gorath / the Horde                  ->  Horde of Gorath / Gorath
//
// How, in layers (each one pure: no draw from A.rand, nothing written to A.S while drawing):
//   1. NM.fix(text): ordered rules keyed to realm references, not to words ("the Kingsmere Amber Guild", "raw
//      amber", "highland" terrain, "the Highland March" of Ambrel, "the Old Horde" and "a horde" stay). A plural
//      name with a verb takes the singular ("the Sand Clans are" -> "Sahrim is"); used as an adjective it keeps its
//      article ("the Nine Winds envoy" -> "the Ulun envoy"). Markup is masked, so ids in data-* never change.
//   2. The lore: every string in LORE is rewritten once (the lazy tables on first read). Place names that are keys
//      (a province, a seat: "Blackreef") stay as data and are renamed where they are shown.
//   3. Text as it is made: A.T (every event title, text, choice and result), A.log and A.news.
//   4. Text as it is shown: innerHTML / insertAdjacentHTML / textContent / title / aria-label, and the canvas's
//      fillText / strokeText / measureText (the map's labels), so code that writes a literal name still reads right.
//   5. Saves: S.realms' names on every load (a step of 99998's upgrade, and after any load, since a v2 save of
//      before this change holds the old names too).
(function () {
  const NM = A.V2NAMES = A.V2NAMES || {};
  NM.REALMS = {
    'POL-32': { from: ['Sultanate of the Amber Isles', 'Amber Isles'], name: 'Sultanate of Ambrel', short: 'Ambrel' },
    'POL-21': { from: ['League of the Spice Coast', 'Kesh'], name: 'League of Kesh', short: 'Kesh' },
    'POL-33': { from: ['Brotherhood of Blackreef', 'Blackreef'], name: 'Principality of Corvasse', short: 'Corvasse' },
    'POL-19': { from: ['Confederacy of the Sand Clans', 'Sand Clans'], name: 'Confederacy of Sahrim', short: 'Sahrim' },
    'POL-12': { from: ['Khanate of the Nine Winds', 'Nine Winds'], name: 'Khanate of Ulun', short: 'Ulun' },
    'POL-34': { from: ['League of the Tusk Clans', 'Tusk Clans'], name: 'Dominion of Ughrak', short: 'Ughrak' },
    'POL-13': { from: ['Highland League', 'Highland'], name: 'Kingdom of Brannoch', short: 'Brannoch' },
    'POL-11': { from: ['Horde of Gorath', 'the Horde'], name: 'Horde of Gorath', short: 'Gorath' },
  };

  // ---- 1. the rules ------------------------------------------------------------------------------------------------
  const PRE = /Amber|Spice Coast|Blackreef|Sand Clan|Nine Winds|Tusk|Highland|Horde/;
  const TAG = '(?:\\uE000\\d+\\uE001)*';           // a masked tag between the article and the name
  const AP = "(?:'|’|&#39;)";
  // a plural name followed by its verb: the verb agrees with the singular name
  const PL2SG = { are: 'is', were: 'was', have: 'has', do: 'does', prove: 'proves', take: 'takes', ride: 'rides',
    know: 'knows', sell: 'sells', outshoot: 'outshoots', learn: 'learns', come: 'comes', lose: 'loses', want: 'wants',
    mean: 'means', hold: 'holds', keep: 'keeps', send: 'sends', fight: 'fights', win: 'wins', say: 'says',
    make: 'makes', give: 'gives', need: 'needs', think: 'thinks', owe: 'owes', pay: 'pays', burn: 'burns', live: 'lives',
    rule: 'rules', claim: 'claims', hate: 'hates', fear: 'fears', move: 'moves', march: 'marches', gather: 'gathers' };
  // words after the name that make it the subject or an object (the name stands alone, without "the")
  const FUNC = new Set(('and or nor but who whom which that whose where when while as at in on to for with from by of ' +
    'into onto over under across after before since until till without within about against among between through ' +
    'beyond near off up down out back apart again also still now then once ever never no not each every both all two ' +
    'three four a an the it he she they them him her his its their this these those you your we our us one herself ' +
    'himself itself themselves alone here there too so if than because though just only even yet more most less much ' +
    'very whether however rather first last soon already always often either neither unless upon along around behind ' +
    'below beside despite during except past per toward towards via is was has had does did can could will would ' +
    'shall should may might must says puts names matters shows shoots learns took lost sold made came gave held kept ' +
    'won paid sent fought rode knew told found let set sat stood went bought brought thinks talks pulls finds ' +
    'stumbles comes wants needs sells pays goes takes keeps holds owes rules lies swore wins loses gets got').split(' '));
  const ING_NOUN = /^(king|ring|wing|thing|sling|string|spring|morning|evening|wedding|building|gathering|meeting|crossing|landing|clothing|bedding|offering|herring|tiding)s?$/;
  const ED_NOUN = /^(bed|red|steed|seed|weed|creed|breed|shed|sled|speed|hundred|need|reed)s?$/;
  const verbish = w => FUNC.has(w) || (/^[a-z]{3,}ing$/.test(w) && !ING_NOUN.test(w)) || (/^[a-z]{3,}ed$/.test(w) && !ED_NOUN.test(w));
  const apo = ps => (/&#39;/.test(ps) ? '&#39;' : /’/.test(ps) ? '’' : "'") + 's';

  // "(among) (the) NAME('s) (next)": a realm's collective name (plural or not)
  const coll = (nameRx, NEW, { plural = false, needThe = false } = {}) => [
    new RegExp(`(\\b[Aa]mong\\s+)?(\\b[Tt]he\\s+)?(${TAG})\\b(?:${nameRx})(?![A-Za-z])(${AP}s${plural ? '?' : ''})?(-)?(?:(\\s+)([a-z][a-z’'-]*))?`, 'g'),
    (m, among, the, tags, ps, hy, sp, nx) => {
      if (needThe && !the) return m;
      let keepThe = false, nxOut = nx || '';
      if (ps) { /* a possessive: "Sahrim's" */ }
      else if (hy) keepThe = true;                         // "the Horde-held" -> "the Gorath-held"
      else if (nx) {
        if (PL2SG[nx]) nxOut = PL2SG[nx];
        else if (!verbish(nx)) keepThe = true;            // a noun follows: the name is an adjective
      }
      let pre = among || '';
      if (among && the && !keepThe) pre = among[0] === 'A' ? 'In ' : 'in ';
      return pre + (keepThe && the ? the : '') + tags + NEW + (ps ? apo(ps) : '') + (hy || '') + (sp || '') + nxOut;
    },
  ];
  const AMBER_N = 'fleets?|ships?|harbou?rs?|marines?|merchants?|house|houses|hill|captains?|cogs?|gold|flagships?|' +
    'sailors?|galleys?|tongue|highlands?|factors?|pilots?|loans?|alliance|mark|marks|clerks?|spice|sultans?|hunters?|' +
    'silver|squadrons?|boathook|pursers?|clove|coat|features|command|flags?|lenders?|manners|name|blockade|warships?|' +
    'sails|princess|prince|one|secret|needle|tax|ledgers|man|men|woman|women|envoys?|navy|crews?|traders?|lords?|' +
    'admirals?|agents?|governors?|garrisons?|soldiers?|spies|spy|court|sultanate|Sultan|Grand Vizier|wars?|raiders?';
  const TUSK_N = 'riders?|envoys?|toll|tolls|drummers?|clans|clan-mothers?|orcs?|dialect|war-bands?|marriages?|felt|' +
    'speech|raids?|raiders?|camps?|half-orcs?|silk|drums?|warriors?|chiefs?|herds?|horses?|lances?|spears?|scouts?';
  const RULES = [
    // full names first
    [/\bSultanate of the Amber Isles\b/g, 'Sultanate of Ambrel'],
    [/\bLeague of the Spice Coast\b/g, 'League of Kesh'],
    [/\bSpice Coast League\b/g, 'League of Kesh'],
    [/\bBrotherhood of Blackreef\b/g, 'Principality of Corvasse'],
    [/\bConfederacy of the Sand Clans\b/g, 'Confederacy of Sahrim'],
    [/\bKhanate of the Nine Winds\b/g, 'Khanate of Ulun'],
    [/\bLeague of the Tusk Clans\b/g, 'Dominion of Ughrak'],
    [/\bHighland League\b/g, 'Kingdom of Brannoch'],
    // the short names, said of the realm or its people
    coll('Amber Isles', 'Ambrel', { plural: true }),
    coll('Spice Coast', 'Kesh'),
    coll('Sand Clans', 'Sahrim', { plural: true }),
    coll('Nine Winds', 'Ulun', { plural: true }),
    coll('Tusk Clans', 'Ughrak', { plural: true }),
    coll('Horde(?! of Gorath\\b)(?!\\s+Wars?\\b)', 'Gorath', { needThe: true }),
    // as adjectives
    [/\bSand Clan(?![A-Za-z])/g, 'Sahrim'],
    [new RegExp(`\\bTusk(?=\\s+(?:${TUSK_N})\\b)`, 'g'), 'Ughrak'],
    [new RegExp(`(?<![Gg]reat\\s)\\bAmber(?=\\s+(?:${AMBER_N})\\b)`, 'g'), 'Ambrel'],
    [/\bHighlanders\b/g, 'Brannoch folk'],
    [/\b([Aa]) Highlander\b/g, '$1 Brannoch man'],
    [/\bHighlander\b/g, 'Brannoch man'],
    // "Highland" alone is the realm; Ambrel's Highland March and Highland Spears, Abara's Highland Javelins, the
    // Highveld's farmers and the plural "Highlands" are other places
    [/\bHighland(?![A-Za-z])(?!\s+(?:Spears?|March|Javelins|farmers|riding|custom holds)\b)/g, 'Brannoch'],
    // the capital shares the old name: every Blackreef is Corvasse now
    [/\bBlackreef(?![A-Za-z])/g, 'Corvasse'],
    // "a Nine Winds rider" -> "an Ulun rider"
    [new RegExp(`\\b([Aa])(\\s+${TAG})(Ulun|Ughrak|Ambrel)\\b`, 'g'), '$1n$2$3'],
  ];
  NM.RULES = RULES;
  const run = s => { for (const [rx, to] of RULES) s = s.replace(rx, to); return s; };
  const ATTR = /(\s(?:title|aria-label|alt|placeholder)=")([^"]*)(")/g;
  // plain text or markup; inside a tag only the attributes a reader sees are touched
  NM.fix = function (s) {
    if (typeof s !== 'string' || !PRE.test(s)) return s;
    if (s.indexOf('<') < 0) return run(s);
    const tags = [];
    const masked = s.replace(/<[^<>]*>/g, t => { tags.push(PRE.test(t) ? t.replace(ATTR, (m, a, v, b) => a + run(v) + b) : t); return '' + (tags.length - 1) + ''; });
    return run(masked).replace(/(\d+)/g, (m, i) => tags[+i]);
  };
  NM.PRE = PRE;

  // ---- 2. the lore -------------------------------------------------------------------------------------------------
  // a string that is a key (a province's name, a seat) stays: the game finds places by these names
  const keep = new Set();
  try { for (const p of (LORE.map && LORE.map.provinces) || []) if (p && p.name && NM.fix(p.name) !== p.name) keep.add(p.name); } catch (e) {}
  NM.KEEP = keep;
  const SKIP_KEY = new Set(['rle']);
  NM.fixDeep = function (o, depth = 0) {
    if (!o || typeof o !== 'object' || depth > 40) return o;
    const ks = Array.isArray(o) ? o.keys() : Object.keys(o);
    for (const k of ks) {
      const v = o[k];
      if (typeof v === 'string') { if (!SKIP_KEY.has(k) && !keep.has(v) && PRE.test(v) && !v.startsWith('data:')) { const w = NM.fix(v); if (w !== v) o[k] = w; } }
      else if (v && typeof v === 'object') NM.fixDeep(v, depth + 1);
    }
    return o;
  };
  const LAZY = ['cast', 'families', 'houseDeep', 'styles', 'academies'];
  for (const k of Object.keys(LORE)) {
    const d = Object.getOwnPropertyDescriptor(LORE, k);
    if (d && d.get) {
      let done = null;
      Object.defineProperty(LORE, k, {
        configurable: true, enumerable: d.enumerable !== false,
        get() { const v = d.get.call(this); if (v && done !== v) { done = v; NM.fixDeep(v); } return v; },
        set(x) { if (d.set) d.set.call(this, x); },
      });
    } else if (!LAZY.includes(k)) NM.fixDeep(LORE[k]);
  }
  // the realms' own names, exactly
  for (const id in NM.REALMS) { const L = LORE.realms && LORE.realms[id], R = NM.REALMS[id]; if (L) { L.name = R.name; L.short = R.short; } }

  // ---- 3. text as it is made ---------------------------------------------------------------------------------------
  const T0 = A.T;
  if (T0) A.T = function () { return NM.fix(T0.apply(this, arguments)); };
  const log0 = A.log;
  A.log = function (text) { if (typeof text === 'string') arguments[0] = NM.fix(text); return log0.apply(this, arguments); };
  const news0 = A.news;
  A.news = function (text) { if (typeof text === 'string') arguments[0] = NM.fix(text); return news0.apply(this, arguments); };

  // ---- 4. text as it is shown --------------------------------------------------------------------------------------
  const wrapSet = (proto, prop, skip) => {
    const d = proto && Object.getOwnPropertyDescriptor(proto, prop);
    if (!d || !d.set) return;
    Object.defineProperty(proto, prop, Object.assign({}, d, {
      set(v) { d.set.call(this, typeof v === 'string' && !(skip && skip(this)) ? NM.fix(v) : v); },
    }));
  };
  const code = el => el && (el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE' || el.nodeName === 'TEXTAREA');
  if (typeof Element !== 'undefined') {
    wrapSet(Element.prototype, 'innerHTML', code);
    wrapSet(Element.prototype, 'outerHTML', code);
    const iah = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function (pos, html) { return iah.call(this, pos, typeof html === 'string' ? NM.fix(html) : html); };
    const sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (k, v) { return sa.call(this, k, (k === 'title' || k === 'aria-label' || k === 'alt') && typeof v === 'string' ? NM.fix(v) : v); };
  }
  if (typeof Node !== 'undefined') wrapSet(Node.prototype, 'textContent', code);
  if (typeof HTMLElement !== 'undefined') { wrapSet(HTMLElement.prototype, 'title'); wrapSet(HTMLElement.prototype, 'innerText', code); }
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    const C2 = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText', 'measureText']) {
      const o = C2[f];
      if (typeof o === 'function') C2[f] = function (t) { if (typeof t === 'string' && PRE.test(t)) arguments[0] = NM.fix(t); return o.apply(this, arguments); };
    }
  }

  // ---- 5. saves ------------------------------------------------------------------------------------------------------
  // the eight realms by id; any other realm's name (one born in play from an old name) through the rules
  NM.renameState = function (S) {
    let n = 0;
    if (!S || !S.realms || typeof S.realms !== 'object') return n;
    for (const id of Object.keys(S.realms)) {
      const r = S.realms[id], R = NM.REALMS[id];
      if (!r || typeof r !== 'object') continue;
      const name = R && r.name === R.from[0] ? R.name : NM.fix(r.name), short = R && r.short === R.from[1] ? R.short : NM.fix(r.short);
      if (name !== r.name) { r.name = name; n++; }
      if (short !== r.short) { r.short = short; n++; }
    }
    return n;
  };
  const SV = A.V2SAVE;
  if (SV && Array.isArray(SV.STEPS)) SV.STEPS.push(['names', S => { NM.renameState(S); }]);
  const des = A.deserialize;
  A.deserialize = function () {
    const r = des.apply(this, arguments);
    try { if (A.S) NM.renameState(A.S); } catch (e) { console.error('v2 names', e); }
    return r;
  };
})();
