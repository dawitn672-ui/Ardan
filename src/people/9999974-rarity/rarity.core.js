// The one rarity ladder (orders 97 and 98, D-200): basic, rare, epic, legendary, mythical, for skills, titles, classes
// and items alike. Data: data/rarity.json. Every screen that prints a rarity prints it through here; every system keeps
// its own figures by these words (a title's caps, a skill's budget bonus, a class's gifts), never a ladder of its own.
//
// A.RARITY
//   R.LADDER                 the five words, rarest last
//   R.of(w)                  a word read as the ladder's: an older word mapped (common and uncommon are basic), anything
//                            else null. Pure
//   R.rank(w)                its place on the ladder (0 basic .. 4 mythical; -1 for none)
//   R.word(w)                the word a player reads ('' for none)
//   R.rarest(list)           the rarest of a list of words (null for none)
//   R.oneHolder(w)           a class of this rarity has one living holder and cannot be advanced (legendary, mythical)
//   R.setOf(sheet, cat)      a great being's own arts, as one set: the rarest title it holds (ids or { id }), at least its
//                            category's (data/rarity.json beings); null for none
//   R.itemWords(i)           an item's make and rarity in words: 'masterwork', 'legendary', 'plain' (the make, then the
//                            rarity above basic; '' for a basic thing of no make)
// Nothing here draws on A.rand or writes A.S.
(function () {
  const D = (A.DATA && A.DATA.rarity) || null;
  if (!D || !Array.isArray(D.ladder)) { console.error('[rarity] data/rarity.json is missing'); return; }
  const LADDER = Object.freeze(D.ladder.slice()), IX = new Map(LADDER.map((w, i) => [w, i])), OLD = D.old || {};
  const R = A.RARITY = { D, LADDER };
  R.of = w => { const k = String(w == null ? '' : w).toLowerCase(); return IX.has(k) ? k : IX.has(OLD[k]) ? OLD[k] : null; };
  R.rank = w => { const k = R.of(w); return k ? IX.get(k) : -1; };
  R.word = w => { const k = R.of(w); return k ? (D.words && D.words[k]) || k : ''; };
  R.rarest = list => { let best = null; for (const w of list || []) if (R.rank(w) > R.rank(best)) best = R.of(w); return best; };
  R.oneHolder = w => (D.oneHolder || []).includes(R.of(w));
  R.setOf = function (sheet, cat) {
    const TT = A.TT, ws = [(D.beings || {})[cat] || null];
    for (const x of (sheet && sheet.titles) || []) { const id = x && typeof x === 'object' ? x.id : x, t = TT && TT.BY ? TT.BY.get(id) : null; if (t) ws.push(t.rarity); }
    return R.rarest(ws);
  };
  R.itemWords = function (i) {
    if (!i) return '';
    const r = R.of(i.rarity), make = (D.makes || []).includes(i.make) ? i.make : '';
    return [make, r && r !== 'basic' ? R.word(r) : ''].filter(Boolean).join(', ');
  };
})();
