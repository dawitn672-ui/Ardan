// Voices: each culture speaks in its own words, and each person in their own manner.
//   Road to Ten, Events 6: "Give each culture its own event voice (word choice, sayings), and let NPC lines match
//                          their personality."
//   Road to Ten, World 7:  "Give each culture naming rules and 2 or 3 of its own words that show up in titles and
//                          events." (the words are 47-realm-bible's A.BIBLE_WORDS; the naming rules are GD.NAMING)
//   Benchmark W12: "≥30% of each culture's local events use ≥1 of its words; every culture has a naming generator".
//
// The voice banks are data (voices.*.data.core.js): for each of the 24 cultures its words for a lord, its ruler and
// its council, how it names the year, a greeting, an oath, a curse, sayings and knowledge lines; for each of the 40
// traits the manner of a speaker. This file puts them into play when an event is first drawn:
//   1. Local events (gated to a realm or a culture in their cond) end with a voice line of that culture on the
//      event's own subject (money, law, an oath, a death ...), and a plain English word the culture has its own word
//      for is swapped for it ("household" becomes "hald" in Aldmark).
//   2. A title that names a lord or the ruler uses the place's word ("The lord's days" becomes "The haldern's days").
//   3. When the person of the event (ctx.pid) speaks, their line takes the manner of one of their traits: a tag after
//      "she says", a beat after an untagged line, or, for a move they make toward you, a greeting in their culture's
//      words with their manner.
// Nothing is added that would take the text past 80 words. Every choice is a hash of ids, never a draw from A.rand, so
// a view reads the same every time it is built and the random stream is untouched. The Realm tab gets a card of the
// culture's speech; tokens {saying} {oath} {greet} {curse} {lordWord} {rulerWord} {councilWord} {yearName}, and for
// ctx.pid {themSaying} {themOath} {themGreet} {themCurse} {theySay} (also {they_say}), are there for writers.
(function () {
  const V = A.VOICE = {
    MAX_WORDS: 80,
    LINE_RATE: 75,    // percent of eligible local events that end with a voice line (by hash)
    REPEAT_YEARS: 5,  // a voice line is not shown again to the same life within this many years (pc.vo)
    VERBS: 'says|asks|adds|replies|answers|whispers|mutters|tells you',
    // what an event is about, read from its own words
    TOPICS: {
      money: /\b(coins?|silver|gold|tax(es)?|tolls?|tithes?|debts?|owe[sd]?|pay(s|ing)?|paid|prices?|rent|dues|market|merchants?|trade(rs?)?|sells?|selling|sold|buy(s|ing)?|bought|bargain|purse|wages?|fees?)\b|\d[\d,]* suns?\b/g,
      law: /\b(laws?|judge[sd]?|court|trial|crimes?|thief|thieves|theft|steal|stole|stolen|punish\w*|flog\w*|hang(ed|s)?|guilty|witness\w*|accus\w*|reeve|magistrate|sentence|quarrel\w*|dispute|claims?)\b/g,
      oath: /\b(oaths?|swears?|sworn|swore|vows?|promis\w*|pledge\w*)\b/g,
      death: /\b(dead|death|dies|died|dying|graves?|funeral|buried|burial|bury|mourn\w*|corpse|tomb|widow\w*|killed|kills?)\b/g,
      war: /\b(wars?|army|armies|battle\w*|siege|levy|soldiers?|raid\w*|swords?|spears?|enemy|enemies|muster|fight\w*)\b/g,
      kin: /\b(marr(y|ies|ied|iage)|wedding|bride|groom|husband|wife|child(ren)?|sons?|daughters?|mother|father|birth|born|baby|brothers?|sisters?|family|kin|names?|named|grand(mother|father)|heirs?)\b/g,
      faith: /\b(temples?|priests?|gods?|prayers?|pray\w*|shrines?|holy|faith|monks?|monaster\w*|church|sacred|bless\w*|shamans?)\b/g,
      land: /\b(fields?|harvest|crops?|plough\w*|flood\w*|rain|herds?|cattle|horses?|camels?|sheep|goats?|wells?|water|river|trees?|forest|grass|terraces?|rice|wheat|rye|farm\w*)\b/g,
      sea: /\b(sea|ships?|boats?|sail\w*|harbou?r|fish\w*|whales?|pearls?|divers?|diving|tide|longships?|galleys?|crew)\b/g,
      feast: /\b(feasts?|festival|drink\w*|wine|ale|beer|danc\w*|songs?|sing\w*|supper|toast)\b/g,
      guest: /\b(guests?|strangers?|foreigners?|travell?ers?|outsiders?|visitors?|hospitality)\b/g,
      work: /\b(work\w*|labou?r|apprentice\w*|craft\w*|master|forge|smith|mines?|miners?|tools?)\b/g,
      power: /\b(lords?|king|queen|emperor|sultan|khan|emir|raja|prince|princess|chiefs?|throne|crown|council|ruler|steward|nobles?)\b/g,
      travel: /\b(roads?|journey|caravans?|travel\w*|pass|path|ride|rode|riders?|post)\b/g,
    },
  };
  const words = V.words = s => (String(s || '').match(/\S+/g) || []).length;
  const rx = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  // a stable hash (FNV-1a) of the ids given: every pick here comes from one, never from the random stream
  V.hash = function () {
    const s = Array.prototype.join.call(arguments, '|');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const pick = (list, ...k) => (list && list.length ? list[V.hash(...k) % list.length] : null);

  // ---- a culture's words
  V.data = cid => (A.VOICE_DATA || {})[cid] || null;
  V.bible = cid => (A.BIBLE_WORDS || {})[cid] || [];
  // its own word for a lord, its ruler or its council: [word, gloss], from its bank or one of its realm-bible words
  V.term = function (cid, k) {
    const D = V.data(cid);
    let t = D && D[k];
    if (typeof t === 'string') { const W = V.bible(cid)[+t.slice(1) - 1]; t = W ? [W[0], W[1]] : null; }
    return Array.isArray(t) ? t : null;
  };
  V.word = (cid, k) => { const t = V.term(cid, k); return t ? t[0] : null; };
  V.wordsOf = function (cid) {
    const out = V.bible(cid).map(w => w[0]);
    for (const k of ['lord', 'ruler', 'council']) { const w = V.word(cid, k); if (w && !out.includes(w)) out.push(w); }
    return out;
  };
  V.wordRx = cid => { const W = V.wordsOf(cid); return W.length ? new RegExp('(^|[^A-Za-z])(' + W.map(rx).join('|') + ')(?![A-Za-z])', 'i') : null; };
  V.has = (cid, s) => { const r = V.wordRx(cid); return !!r && r.test(String(s || '')); };
  // fill a bank string; a token the culture cannot fill drops the string (returns null)
  V.fill = function (cid, s, extra) {
    const W = V.bible(cid);
    const map = Object.assign({ w1: W[0] && W[0][0], w2: W[1] && W[1][0], w3: W[2] && W[2][0],
      lord: V.word(cid, 'lord'), ruler: V.word(cid, 'ruler'), council: V.word(cid, 'council') }, extra || {});
    let bad = false;
    const out = String(s || '').replace(/\{(\w+)\}/g, (m, k) => (map[k] != null ? String(map[k]) : (bad = true, m)));
    return bad ? null : out;
  };

  // the culture of a place: the realm's own people (as 47-realm-bible reads it)
  V.realmCult = function (rid) {
    const R = A.realm(rid);
    if (!R) return rid === 'unclaimed' ? (GD.REALM_CULTURE.unclaimed || null) : null;
    return A.cultureFor(R.race === 'human' ? 'human' : R.race, R.id);
  };
  V.ownCult = pc => (pc && V.data(pc.cult) ? pc.cult : V.realmCult(pc && pc.realm));

  // which realms, cultures and races an event is written for, read from its cond (negated tests left out); cached
  V.gate = function (e) {
    if (!e) return null;
    if (Object.prototype.hasOwnProperty.call(e, '_vg')) return e._vg;
    let s = '';
    try { s = e.cond ? e.cond.toString() : ''; } catch (err) { s = ''; }
    s = s.replace(/!\s*C\.(realm|cult|race)\([^)]*\)/g, '').replace(/\.(realm|cult|race)\s*!==?\s*["'][^"']*["']/g, '');
    const realms = new Set(), cults = new Set(), races = new Set();
    for (const m of s.matchAll(/C\.realm\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/POL-\d\d/g)) realms.add(r[0]);
    for (const m of s.matchAll(/\.realm\s*===?\s*["'](POL-\d\d)["']/g)) realms.add(m[1]);
    for (const m of s.matchAll(/\[([^\]]*)\]\s*\.includes\(\s*p\.realm\s*\)/g)) for (const r of m[1].matchAll(/POL-\d\d/g)) realms.add(r[0]);
    for (const m of s.matchAll(/C\.cult\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/CUL-\d\d/g)) cults.add(r[0]);
    for (const m of s.matchAll(/\.cult\s*===?\s*["'](CUL-\d\d)["']/g)) cults.add(m[1]);
    for (const m of s.matchAll(/C\.race\(\s*p\s*,([^)]*)\)/g)) for (const r of m[1].matchAll(/["'](\w+)["']/g)) races.add(r[1]);
    for (const m of s.matchAll(/\.race\s*===?\s*["'](\w+)["']/g)) races.add(m[1]);
    const g = realms.size || cults.size || races.size ? { realms: [...realms], cults: [...cults], races: [...races] } : null;
    try { Object.defineProperty(e, '_vg', { value: g, enumerable: false, configurable: true, writable: true }); } catch (err) {}
    return g;
  };
  // the cultures an event is local to (realm- or culture-gated): what W12 counts as "that culture's local events"
  V.localTo = function (e) {
    const g = V.gate(e), out = new Set();
    if (!g) return [];
    for (const r of g.realms) { const c = V.realmCult(r) || GD.REALM_CULTURE[r]; if (c) out.add(c); }
    for (const c of g.cults) out.add(c);
    return [...out];
  };
  // whose voice an event speaks in, for this life: its culture if the event is gated to the culture, the realm or the
  // elder race the character belongs to; null for an event written for anyone
  V.eventCult = function (pc, e) {
    const g = V.gate(e);
    if (!g || !pc) return null;
    if (g.cults.includes(pc.cult) && V.data(pc.cult)) return pc.cult;
    if (g.realms.includes(pc.realm)) { const c = V.realmCult(pc.realm); return V.data(c) ? c : null; }
    if (g.races.includes(pc.race) && ['dwarf', 'elf', 'orc', 'giant'].includes(pc.race) && V.data(pc.cult)) return pc.cult;
    return null;
  };

  // ---- voice lines
  V.topicsOf = function (s) {
    const t = String(s || '').toLowerCase(), out = {};
    for (const k in V.TOPICS) { const m = t.match(V.TOPICS[k]); if (m) out[k] = m.length; }
    return out;
  };
  V.sayingLine = function (cid, i, extra) {
    const D = V.data(cid), sy = D && (D.sayings || [])[i];
    if (!sy) return null;
    const who = pick(D.who || ['they'], cid, 'who', i) || 'they';
    const s = String(sy[0]).replace(/[.]$/, '');
    return V.fill(cid, /[?!]$/.test(s) ? `"${s}" ${who} say.` : `"${s}," ${who} say.`, extra);
  };
  V.lines = function (cid, extra) {
    const D = V.data(cid), out = [];
    if (!D) return out;
    (D.sayings || []).forEach((sy, i) => { const text = V.sayingLine(cid, i, extra); if (text) out.push({ key: cid + ':s' + i, text, topics: String(sy[1] || '').split(' '), kind: 'saying' }); });
    (D.lines || []).forEach((ln, i) => { const text = V.fill(cid, ln[0], extra); if (text) out.push({ key: cid + ':l' + i, text: cap(text), topics: String(ln[1] || '').split(' '), kind: 'line' }); });
    return out;
  };
  // the line for this event: on its strongest subject that the culture has a line for and this life has not heard in
  // the last few years; none if it has nothing fresh to say. A line in the culture's words comes up three times as often
  // as a plain saying.
  V.fresh = (pc, key) => { const y = pc && pc.vo && pc.vo[key]; return y == null || A.S.year - y >= V.REPEAT_YEARS; };
  V.lineFor = function (pc, e, text, cid) {
    const T = V.topicsOf(text), ranked = Object.keys(T).sort((a, b) => T[b] - T[a]);
    const all = V.lines(cid, { realm: (A.realm(pc.realm) || {}).short || '' }).filter(l => V.fresh(pc, l.key));
    for (const top of ranked) {
      const c = all.filter(l => l.topics.includes(top));
      if (c.length) return Object.assign({ topic: top }, pick(c.flatMap(l => (l.kind === 'line' ? [l, l, l] : [l])), pc.id, e.id, top));
    }
    return null;
  };
  // a plain English word the culture has its own word for, swapped on its first use
  V.swap = function (text, cid) {
    const D = V.data(cid);
    for (const [en, ref] of (D && D.swap) || []) {
      const w = V.fill(cid, '{' + ref + '}');
      const re = new RegExp('\\b' + rx(en) + '\\b(?![-\\w])', 'i');
      if (w && re.test(text)) return text.replace(re, m => (/^[A-Z]/.test(m) ? cap(w) : w));
    }
    return text;
  };

  // ---- titles: the place's word for a lord, or for its ruler
  const PAIR = { King: 'Queen', Queen: 'King', Emperor: 'Empress', Empress: 'Emperor', Sultan: 'Sultana', Sultana: 'Sultan',
    Prince: 'Princess', Princess: 'Prince', Raja: 'Rani', Rani: 'Raja', Khan: 'Khatun', Khatun: 'Khan', Emir: 'Emira', Emira: 'Emir',
    Abbot: 'Abbess', Abbess: 'Abbot', Doge: 'Dogaressa', 'Forge-Queen': 'Forge-King', 'Forge-King': 'Forge-Queen',
    'War-Mother': 'War-Father', 'War-Father': 'War-Mother', 'War-Chief': 'War-Chief' };
  V.rulerTitles = function (rid) {
    const R = A.realm(rid), out = [];
    for (const t of String((R && R.title) || '').split(' / ').map(x => x.trim()).filter(Boolean)) { out.push(t); if (PAIR[t] && !out.includes(PAIR[t])) out.push(PAIR[t]); }
    return out;
  };
  V.retitle = function (pc, title, cid) {
    let t = String(title || '');
    // a title about some other people's lord keeps the plain word
    if (!t || !cid || /\b(foreign|human|enemy|elven|elf|dwarf|dwarven|orc|orcish|giant|other|rival)\b/i.test(t)) return t;
    const lord = V.word(cid, 'lord'), ruler = V.word(cid, 'ruler');
    const t1 = lord ? t.replace(/\b(the|a|your|The|A|Your) lord\b(?!s|ly)/, (m, a) => a + ' ' + lord) : t;
    if (t1 !== t) return t1;
    if (ruler && V.realmCult(pc.realm) === cid) for (const w of V.rulerTitles(pc.realm)) {
      const re = new RegExp('\\b(The|the|Your|your) ' + rx(w) + '\\b(?! [A-Z])');
      if (re.test(t)) return t.replace(re, (m, a) => a + ' ' + ruler);
    }
    return t;
  };

  // ---- a person's manner, by trait
  V.traitOf = function (t, key) {
    const T = A.VOICE_TRAITS || {}, tr = (t.traits || []).filter(x => T[x]);
    return tr.length ? tr[V.hash(t.id, key) % tr.length] : null;
  };
  V.pron = (t, s) => String(s).replace(/\{(He|he|His|his|him|himself)\}/g, (m, k) => {
    const f = t.sex === 'F';
    return { He: f ? 'She' : 'He', he: f ? 'she' : 'he', His: f ? 'Her' : 'His', his: f ? 'her' : 'his', him: f ? 'her' : 'him', himself: f ? 'herself' : 'himself' }[k];
  });
  V.npcLine = function (t, key, kind) {
    const tr = V.traitOf(t, key), B = tr && A.VOICE_TRAITS[tr][kind];
    return B && B.length ? { trait: tr, text: V.pron(t, pick(B, t.id, key, kind)) } : null;
  };
  // a greeting in their culture's words, said in their manner: "Fire on your hearth," she says quietly.
  V.greeting = function (t, key) {
    const D = V.data(t.cult), g = D && V.fill(t.cult, D.greet), L = V.npcLine(t, key, 'tag');
    if (!g || !L) return null;
    const s = g.trim().replace(/\.$/, '');
    return { trait: L.trait, text: `"${s}${/[?!]$/.test(s) ? '' : ','}" ${A.he(t)} says${L.text}.` };
  };
  const OBJ = /^(is|was|of|to|for|about|with|from|at|by|named|called|sends|send|tells|asks|find|finds|meet|meets|see|sees|than|on|in|into|over|under|behind|like|against)$/i;
  const VISIT = /\b(comes (by|round|to)|turns up|is at your door|at your door|finds you|arrives|calls on you|stops you|walks in|knocks|sits down|draws you aside)\b/;
  // give the person's line their manner; returns { text, trait, kind } or null. A line is taken to be theirs only when
  // they are named (or are the "he"/"she" of a sentence) in the sentence of the line or the one before it.
  V.speak = function (text, t, key, opt) {
    if (!t || !t.given || !text) return null;
    const name = rx(t.given), he = A.he(t), He = cap(he), who = `(?:${name}|${he}|${He})`;
    // named as the one acting, not as the one spoken of ("It is Ivo, your friend", "a letter from Ivo")
    const acts = x => [...x.matchAll(new RegExp(`\\b${name}\\b`, 'g'))].some(m => !OBJ.test((x.slice(0, m.index).match(/(\w+)\W*$/) || [])[1] || ''));
    const near = i => {
      const s = text.slice(0, i).split(/(?<=[.!?]"?)\s+/).filter(x => x.trim()).slice(-2);
      return s.some(x => acts(x) || new RegExp(`^${He}\\b`).test(x));
    };
    const quotes = [...text.matchAll(/"([^"]{2,}?)"/g)];
    let other = false;   // the last line was somebody else's, so an untagged line after it is theirs too
    for (const q of quotes) {
      const end = q.index + q[0].length, after = text.slice(end, end + 60), before = text.slice(Math.max(0, q.index - 70), q.index);
      const here = near(q.index);
      // their line with its speaker named after it: "Count it," she says.  ->  "Count it," she says, not looking up.
      const m = after.match(new RegExp(`^\\s+${who}\\s+(?:${V.VERBS})(?=[.,;:!?])`));
      if (m && (here || new RegExp(`^\\s+${name}\\b`).test(after))) {
        const L = V.npcLine(t, key, 'tag');
        if (!L) return null;
        const at = end + m[0].length;
        return { text: text.slice(0, at) + L.text + text.slice(at), trait: L.trait, kind: 'tag' };
      }
      if (m) { other = true; continue; }
      // their line, already given a manner by its writer ("she says quietly"): leave it
      if (new RegExp(`^\\s+${who}\\s+(?:${V.VERBS})\\b`).test(after) && here) return null;
      // somebody else's line
      if (/^\s+(the |a |an |his |her |your |someone|somebody|everyone|nobody|one |[A-Z][a-z]+ )[^.!?"]{0,25}?\b(says|asks|adds|replies|answers|whispers|mutters|tells|calls|shouts|cries)\b/.test(after)) { other = true; continue; }
      if (other) { other = false; continue; }
      const said = new RegExp(`\\b${who}\\b[^.!?"]{0,40}\\b(?:says|asks|whispers|mutters|calls|tells you|adds)\\b[^.!?"]{0,12}[:,]?\\s*$`).test(before);
      // their line with nobody named after it, ending a sentence:  "Come with me."  ->  "Come with me." She says it to the floor.
      if ((said || here) && /[.!?]$/.test(q[1]) && /^(\s|$)/.test(after)) {
        const L = V.npcLine(t, key, 'beat');
        if (!L) return null;
        return { text: text.slice(0, end) + ' ' + L.text + text.slice(end), trait: L.trait, kind: 'beat' };
      }
      if (said || here) return null;
    }
    // a move they make toward you, with no line quoted: if the first sentence that names them has them come to you,
    // they greet you in their culture's words and their manner (or, with no greeting, show their bearing)
    if (!quotes.length && opt && opt.npc) {
      const i = text.search(new RegExp(`\\b${name}\\b`)), stop = i < 0 ? null : text.slice(i).match(/[.!?](?=\s|$)/);
      if (!stop) return null;
      const at = i + stop.index + 1, from = Math.max(0, text.slice(0, i).search(/[^.!?]*$/));
      if (!VISIT.test(text.slice(from, at))) return null;
      const L = V.greeting(t, key), B = L || V.npcLine(t, key, 'bear');
      if (!B) return null;
      return { text: text.slice(0, at) + ' ' + B.text + text.slice(at), trait: B.trait, kind: L ? 'greet' : 'bear' };
    }
    return null;
  };

  // ---- the whole decoration of a freshly drawn view (pure: reads the state, changes nothing)
  V.decorate = function (pc, e, q, view) {
    let title = String(view.title || ''), text = String(view.text || ''), line = null;
    const added = [], over = s => words(s) > V.MAX_WORDS;
    if (!pc || !e) return { title, text, added };
    const cid = V.eventCult(pc, e);
    // 1. the person of the event speaks in their manner
    const t = q && q.ctx && q.ctx.pid ? A.P(q.ctx.pid) : null;
    if (t && t.id !== pc.id && t.alive !== false && Array.isArray(t.traits)) {
      const r = V.speak(text, t, e.id, { npc: !!e.npc || /^ni_/.test(e.id) });
      if (r && !over(r.text)) { text = r.text; added.push(r.kind + ':' + r.trait); }
    }
    // 2. the place's word for a lord or its ruler, in the title
    const tc = cid || V.realmCult(pc.realm);
    if (V.data(tc)) { const t2 = V.retitle(pc, title, tc); if (t2 !== title) { title = t2; added.push('title'); } }
    // 3. a local event: a plain word in the culture's own, and a line in its voice
    if (cid) {
      const s = V.swap(text, cid);
      if (s !== text && !over(s)) { text = s; added.push('swap'); }
      if (!V.has(cid, title + ' ' + text) && V.hash(pc.id, e.id, 'rate') % 100 < V.LINE_RATE) {
        const L = V.lineFor(pc, e, title + ' ' + text, cid);
        if (L && !over(text + ' ' + L.text)) { text = text + '\n\n' + L.text; added.push('line:' + L.key); line = L.key; }
      }
    }
    return { title, text, added, cult: cid, line };
  };
  const view = V.raw = A.eventView;   // V.raw draws a view as it was before voices (for measuring)
  A.eventView = function (q) {
    const fresh = !!q && !q.view;
    const v = view.apply(this, arguments);
    try {
      if (fresh && v && !v.skip && q.view === v) {
        const pc = A.pc(), e = A.EV[q.ev];
        if (pc && e) {
          const d = V.decorate(pc, e, q, v);
          v.title = d.title; v.text = d.text;
          // the life remembers the line, so it is not heard again for a while (a new field: old saves have none)
          if (d.line) { pc.vo = pc.vo && typeof pc.vo === 'object' ? pc.vo : {}; pc.vo[d.line] = A.S.year; }
        }
      }
    } catch (err) { if (A.S && A.S.debug) console.error('voices', err); }
    return v;
  };

  // ---- the year, as the place names it
  const ORD = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh',
    'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  V.ordinal = function (n) {
    n = Math.max(1, Math.floor(n));
    if (n < 20) return ORD[n];
    if (n < 100) return n % 10 ? TENS[Math.floor(n / 10)] + '-' + ORD[n % 10] : TENS[n / 10].replace(/y$/, 'ieth');
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  // the year the ruler came to the throne: from the realm's own history in play, or the lore's list of rulers
  V.reignStart = function (R) {
    const ru = R && A.P(R.ruler);
    if (!ru) return null;
    const h = (R.history || []).filter(x => Array.isArray(x) && String(x[1] || '').indexOf(ru.given) === 0).pop();
    if (h) return h[0];
    const L = ((LORE.rulerHistory || {})[R.id] || []).filter(x => Array.isArray(x) && x[3] == null && String(x[0] || '').indexOf(ru.given) === 0).pop();
    return L ? L[2] : null;
  };
  V.yearName = function (rid, cid) {
    const y = A.S.year, D = V.data(cid), R = A.realm(rid), ru = R && A.P(R.ruler), start = V.reignStart(R);
    const plain = `the year ${y}`;
    if (!D || !D.year) return plain;
    const needs = /\{(n|ru)\}/.test(D.year);
    if (needs && (!ru || start == null || start > y)) return plain;
    return V.fill(cid, D.year, { n: V.ordinal(y - (start || y) + 1), ru: ru ? ru.given : '', y }) || plain;
  };

  // ---- tokens for writers
  V.saying = (cid, ...k) => { const D = V.data(cid), i = D && D.sayings && D.sayings.length ? V.hash(cid, ...k) % D.sayings.length : -1; return i >= 0 ? V.fill(cid, D.sayings[i][0].replace(/[.]$/, '')) : null; };
  V.tokens = function (pc, ctx) {
    const o = {}, own = V.ownCult(pc), place = V.realmCult(pc.realm) || own, D = V.data(own);
    if (D) {
      const s = V.saying(own, pc.id, A.S.year);
      if (s) o.saying = s;
      for (const k of ['oath', 'greet', 'curse']) { const v = D[k] && V.fill(own, D[k]); if (v) o[k] = v; }
    }
    if (V.data(place)) {
      for (const [k, tk] of [['lord', 'lordWord'], ['ruler', 'rulerWord'], ['council', 'councilWord']]) { const w = V.word(place, k); if (w) o[tk] = w; }
      o.yearName = V.yearName(pc.realm, place);
    }
    const t = ctx && ctx.pid ? A.P(ctx.pid) : null;
    if (t) {
      const TD = V.data(t.cult);
      if (TD) {
        const s = V.saying(t.cult, t.id);
        if (s) o.themSaying = s;
        for (const [k, tk] of [['oath', 'themOath'], ['greet', 'themGreet'], ['curse', 'themCurse']]) { const v = TD[k] && V.fill(t.cult, TD[k]); if (v) o[tk] = v; }
      }
      const L = Array.isArray(t.traits) ? V.npcLine(t, 'say', 'tag') : null;
      o.theySay = o.they_say = 'says' + (L ? L.text : '');
    }
    return o;
  };
  const tokens = A.ctxTokens;
  if (typeof tokens === 'function') A.ctxTokens = function (pc, ctx) {
    const o = tokens.apply(this, arguments);
    try { if (o && pc) { const v = V.tokens(pc, ctx || {}); for (const k in v) if (o[k] == null) o[k] = v[k]; } } catch (e) {}
    return o;
  };

  // ---- the Realm tab: how the place speaks (pure)
  V.card = function (pc) {
    const R = A.realm(pc.realm), cid = R && V.realmCult(R.id), D = cid && V.data(cid);
    if (!D) return '';
    const esc = UI.esc, C = LORE.cultures[cid] || { name: 'people' }, ru = A.P(R.ruler);
    const term = (label, k) => { const t = V.term(cid, k); return t ? `<div class="tiny"><b>${label}</b> <i>${esc(t[0])}</i>: ${esc(t[1])}</div>` : ''; };
    const says = (D.sayings || []).slice(0, 5).map((s, i) => V.sayingLine(cid, i)).filter(Boolean);
    const rul = V.term(cid, 'ruler');
    return `<div class="card small vo" aria-label="How the ${esc(C.name)} speak"><b>How the ${esc(C.name)} speak</b>` +
      (ru && rul ? `<div class="tiny">${esc(A.rulerStyle(ru, R))} is the <i>${esc(rul[0])}</i> here.</div>` : '') +
      term('A lord', 'lord') + term('The ruler', 'ruler') + term('The council', 'council') +
      `<div class="tiny"><b>The year</b> ${esc(cap(V.yearName(R.id, cid)))}</div>` +
      (D.greet ? `<div class="tiny"><b>Greeting</b> "${esc(V.fill(cid, D.greet) || '')}"</div>` : '') +
      (D.oath ? `<div class="tiny"><b>Oath</b> "${esc(V.fill(cid, D.oath) || '')}"</div>` : '') +
      (D.curse ? `<div class="tiny"><b>Curse</b> "${esc(V.fill(cid, D.curse) || '')}"</div>` : '') +
      (says.length ? `<div class="tiny muted" style="margin-top:4px">${says.map(esc).join(' ')}</div>` : '') +
      `</div>`;
  };
  const realmTab = UI.TAB && UI.TAB.realm;
  if (typeof realmTab === 'function') UI.TAB.realm = function (pc) {
    const h = realmTab.apply(this, arguments);
    try { const c = pc && pc.alive ? V.card(pc) : ''; return c ? h + c : h; } catch (e) { return h; }
  };
})();
