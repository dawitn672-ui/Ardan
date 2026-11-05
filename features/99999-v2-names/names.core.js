// 99999-v2-names: eight realms named like kingdoms (the owner, Nov 5). Ids, peoples, cultures, governments and
// histories stay; only the names change, everywhere the player reads them.
//
//   POL-32 Sultanate of the Amber Isles / Amber Isles  ->  Sultanate of Ambrel / Ambrel
//   POL-21 League of the Spice Coast / Kesh             ->  Kesh / Kesh
//   POL-33 Brotherhood of Blackreef / Blackreef         ->  Principality of Corvasse / Corvasse (its capital too)
//   POL-19 Confederacy of the Sand Clans / Sand Clans   ->  Sahrim Confederacy / Sahrim
//   POL-12 Khanate of the Nine Winds / Nine Winds       ->  Kingdom of Ulun / Ulun
//   POL-34 League of the Tusk Clans / Tusk Clans        ->  Ughrak Dominion / Ughrak
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
    'POL-21': { from: ['League of the Spice Coast', 'Kesh'], name: 'Kesh', short: 'Kesh' },
    'POL-33': { from: ['Brotherhood of Blackreef', 'Blackreef'], name: 'Principality of Corvasse', short: 'Corvasse' },
    'POL-19': { from: ['Confederacy of the Sand Clans', 'Sand Clans'], name: 'Sahrim Confederacy', short: 'Sahrim' },
    'POL-12': { from: ['Khanate of the Nine Winds', 'Nine Winds'], name: 'Kingdom of Ulun', short: 'Ulun' },
    'POL-34': { from: ['League of the Tusk Clans', 'Tusk Clans'], name: 'Ughrak Dominion', short: 'Ughrak' },
    'POL-13': { from: ['Highland League', 'Highland'], name: 'Kingdom of Brannoch', short: 'Brannoch' },
    'POL-11': { from: ['Horde of Gorath', 'the Horde'], name: 'Horde of Gorath', short: 'Gorath' },
  };

  // ---- 1. the rules ------------------------------------------------------------------------------------------------
  // the old words, and the new names after an article (text made from the new names in the state: "the Kesh", "a Ulun")
  const PRE = /Amber|Spice Coast|Blackreef|Sand Clan|Nine Winds|Tusk|Highland|Horde|[Kk]hanate|\b[Tt]he\s+(?:<[^<>]*>)*(?:Kesh|Sahrim|Ulun|Ughrak|Ambrel|Corvasse|Brannoch|Gorath)\b|\b[Aa]\s+(?:<[^<>]*>)*(?:Ulun|Ughrak|Ambrel)\b/;
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
  // "-ly" words are adverbs ("a war with the Amber Isles badly enough"), but for these nouns
  const LY_NOUN = /^(family|ally|belly|gully|holly|lily|folly|rally|assembly|monopoly|fly|jelly|bully|supply|tally)$/;
  const verbish = w => FUNC.has(w) || (/^[a-z]{3,}ing$/.test(w) && !ING_NOUN.test(w)) || (/^[a-z]{3,}ed$/.test(w) && !ED_NOUN.test(w)) ||
    (/^[a-z]{3,}ly$/.test(w) && !LY_NOUN.test(w));
  const apo = ps => (/&#39;/.test(ps) ? '&#39;' : /’/.test(ps) ? '’' : "'") + 's';
  // The verb after a plural name is the name's own only when the name is its subject. After a preposition it belongs
  // to the noun before ("Children of the Nine Winds ride", "horses from the Nine Winds come", "the ships promised to
  // the Amber Isles are"), and "Aldmark and the Sand Clans are" has two subjects: there the plural verb stays.
  const NOT_SUBJ = /(?:^|[^A-Za-z’'-])(?:of|from|to|in|on|at|with|by|for|into|onto|against|over|under|across|through|toward|towards|near|beyond|between|behind|past|around|upon|without|within|about|like|than|amid|amongst|beside|besides|via|outside|inside|throughout|along)\s+(?:\d+)*$/i;
  const AND_SUBJ = /\b[A-Z][\w’'-]*(?:\d+)*\s+(?:and|or|nor)\s+(?:\d+)*$/;
  const isSubject = (str, off) => !NOT_SUBJ.test(str.slice(Math.max(0, off - 40), off)) && !AND_SUBJ.test(str.slice(Math.max(0, off - 60), off));
  NM.isSubject = isSubject;

  // "(among) (the) NAME('s) (next)": a realm's collective name (plural or not). A closing tag may stand between the
  // name and the next word ("the <b>Sand Clans</b> win" -> "<b>Sahrim</b> wins").
  const coll = (nameRx, NEW, { plural = false, needThe = false } = {}) => [
    new RegExp(`(\\b[Aa]mong\\s+)?(\\b[Tt]he\\s+)?(${TAG})\\b(?:${nameRx})(?![A-Za-z])(${AP}s${plural ? '?' : ''})?(-)?(${TAG})(?:(\\s+)([a-z][a-z’'-]*))?`, 'g'),
    (m, among, the, tags, ps, hy, tags2, sp, nx, off, str) => {
      if (needThe && !the) return m;
      let keepThe = false, nxOut = nx || '';
      if (ps) { /* a possessive: "Sahrim's" */ }
      else if (hy) keepThe = true;                         // "the Horde-held" -> "the Gorath-held"
      else if (nx) {
        // a plural name's verb agrees with the singular name; a singular one's (the Horde's) never changes
        if (PL2SG[nx]) { if (plural && isSubject(str, off)) nxOut = PL2SG[nx]; }
        else if (!verbish(nx)) keepThe = true;            // a noun follows: the name is an adjective
      }
      let pre = among || '';
      if (among && the && !keepThe) pre = among[0] === 'A' ? 'In ' : 'in ';
      return pre + (keepThe && the ? the : '') + tags + NEW + (ps ? apo(ps) : '') + (hy || '') + (tags2 || '') + (sp || '') + nxOut;
    },
  ];
  // "the Nine Winds now breed them": an adverb between a plural name and its verb ("Ulun now breeds them")
  const ADV = 'now|still|also|never|always|often|already|once|soon|rarely|seldom|only|even|usually|sometimes';
  const ADV_VERB = Object.assign({ breed: 'breeds', believe: 'believes', build: 'builds', buy: 'buys', carry: 'carries',
    eat: 'eats', marry: 'marries', sing: 'sings', speak: 'speaks', tell: 'tells', wear: 'wears' }, PL2SG);
  const advVerb = [new RegExp(`\\b(Ambrel|Sahrim|Ulun|Ughrak)(${TAG})(\\s+)(${ADV})(\\s+)(${Object.keys(ADV_VERB).join('|')})\\b`, 'g'),
    (m, n, t, s1, adv, s2, v, off, str) => (isSubject(str, off) ? n + t + s1 + adv + s2 + ADV_VERB[v] : m)];
  // A new name is a proper name: no article before it when it stands for the realm ("the first lance of the {realm}"
  // in Kesh, code that writes "the " + a name). Before a noun it is an adjective and keeps it ("the Kesh fleet"), and
  // "the Sahrim Confederacy" and "the Ughrak Dominion" keep theirs.
  const NEWN = 'Kesh|Sahrim|Ulun|Ughrak|Ambrel|Corvasse|Brannoch|Gorath';
  const BARE_VERB = 'is|was|has|had|does|did|can|could|will|would|shall|should|may|might|must|says|sends|holds|keeps|' +
    'wants|needs|takes|makes|gives|pays|rules|wins|won|loses|lost|lies|stands|goes|comes|knows|itself';
  // (a dash joined to the name is a compound, as in a war's name: "The Sahrim–Aldmark War" keeps its article)
  const bare = [new RegExp(`\\b([Tt])he\\s+(${TAG})(${NEWN})\\b(?!\\s+(?:Confederacy|Dominion)\\b)(?![-–—])`, 'g'),
    (m, T, tags, n, off, str) => {
      const after = str.slice(off + m.length, off + m.length + 40).replace(/^(?:\d+)+/, '');
      const alone = /^(?:['’]s\b|\s*[,.;:!?)"”…]|\s+[–—]|\s*$)/.test(after) || /^\s+(?:and|or|nor)\s+(?:\d+)*[A-Z]/.test(after) ||
        new RegExp(`^\\s+(?:${BARE_VERB})\\b`).test(after);
      return alone ? tags + n : m;
    }];
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
    // Kesh is its own full name: "the League of the Spice Coast" is just "Kesh"
    [/\b(?:[Tt]he )?(?:League of the Spice Coast|Spice Coast League)\b/g, 'Kesh'],
    [/\bBrotherhood of Blackreef\b/g, 'Principality of Corvasse'],
    [/\bConfederacy of the Sand Clans\b/g, 'Sahrim Confederacy'],
    [/\bKhanate of the Nine Winds\b/g, 'Kingdom of Ulun'],
    // Ulun is a kingdom now: its own events' "the Khanate" is Ulun, the lore's "the khanate" the kingdom
    [/\b[Tt]he Khanate\b(?! of)/g, 'Ulun'],
    [/\bthe khanate\b(?! of)/g, 'the kingdom'],
    [/\bLeague of the Tusk Clans\b/g, 'Ughrak Dominion'],
    [/\bHighland League\b/g, 'Kingdom of Brannoch'],
    // Gorath the Great founded the Horde: there the realm keeps its full name ("Gorath founded the Horde of Gorath")
    [/\b(found(?:ed|er of|ing of|s)|[Uu]nit(?:ed|er of|es|ing)|[Uu]nification of|made|into|joined|join) the Horde(?! of Gorath)(?![A-Za-z'’-])/g, '$1 the Horde of Gorath'],
    // a coast is not a realm to land on
    [/\bon the Spice Coast\b/g, 'on the coast of Kesh'],
    // some of the clans, not the realm: "the southern Sand Clans' debts" -> "the southern Sahrim clans' debts"
    [/\b([Tt]he (?:northern|southern|eastern|western) )Sand Clans\b/g, '$1Sahrim clans'],
    [/\b([Tt]he (?:northern|southern|eastern|western) )Tusk Clans\b/g, '$1Ughrak clans'],
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
    advVerb,
    bare,
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
  // the canvas's own methods are kept in NM.raw (a test listens there to what reaches the canvas)
  NM.raw = NM.raw || {};
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    const C2 = CanvasRenderingContext2D.prototype;
    for (const f of ['fillText', 'strokeText', 'measureText']) {
      if (typeof C2[f] !== 'function' || NM.raw[f]) continue;
      NM.raw[f] = C2[f];
      C2[f] = function (t) { if (typeof t === 'string' && PRE.test(t)) arguments[0] = NM.fix(t); return NM.raw[f].apply(this, arguments); };
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
    // the prose the life has kept: its log, the news, an event still waiting on the screen, people's titles
    const fx = (o, k) => { if (o && typeof o[k] === 'string') { const w = NM.fix(o[k]); if (w !== o[k]) { o[k] = w; n++; } } };
    for (const e of Array.isArray(S.log) ? S.log : []) for (const l of (e && Array.isArray(e.lines) ? e.lines : [])) fx(l, 0);
    for (const k of ['news', 'newsFar']) for (const x of Array.isArray(S[k]) ? S[k] : []) fx(x, 't');
    for (const q of Array.isArray(S.queue) ? S.queue : []) {
      const v = q && q.view; if (!v || typeof v !== 'object') continue;
      fx(v, 'title'); fx(v, 'text'); fx(v, 'more');
      for (const c of Array.isArray(v.choices) ? v.choices : []) fx(c, 't');
    }
    for (const p of Object.values(S.people || {})) fx(p, 'title');
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
