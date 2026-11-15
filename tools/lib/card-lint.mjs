// In-page lints over every event of the built page (A.EV), shared by tools/lint-cards.mjs and tests/suites/x3b.test.mjs (X3 part 2,
// D-059). Each is a function of no arguments that is run inside the page (page.evaluate), reads A.EV as text and returns findings.
//
// pronounLint: E8. A scene's person is named by the token {them} (or {themFull}) and spoken of by a pronoun token ({khe}, {khim},
// {khis}, {theyHe}, {themHim}, {theirHis}, which are filled from the person's sex). A hard-coded "he" or "she" after {them} is right
// for one sex only. A finding is a sentence where {them} is the subject (no other person comes between it and the pronoun), or the
// sentence after one, that says he/she/his/her/him/himself/herself in plain words. A scene whose setup pins one sex ("F") is held to
// the pronoun of that sex (a slip only when it says the other).
export const pronounLint = () => {
  const out = [];
  const PRON = /\b(he|she|his|her|hers|him|himself|herself)\b/gi;
  const MALE = /^(he|his|him|himself)$/i;
  const OTHER = /\{(?:boss|bossFull|mate\d*|rival|friend|father|mother|spouse|name|full|ruler|otherRuler|npc[MF]|npc|who|owner|lord|lady|master|wife|husband|son|daughter|child|kid|sib|brother|sister|uncle|aunt|cousin|cz|hb|sd|vic|old|[a-z]*Name)\}/i;
  const strsOf = v => {
    if (typeof v === 'string') return [v];
    if (typeof v !== 'function') return [];
    const s = String(v);
    return [...s.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map(m => m[2]);
  };
  // the sex a scene's setup pins, if exactly one
  const pinOf = e => {
    const s = String(e.setup || '') + ' ' + String(e.cond || '');
    const f = /sex\s*[:=!]=*\s*["']F["']|\bfemale\b|\bwoman\b|\bgirl\b|\bwidow\b/i.test(s), m = /sex\s*[:=!]=*\s*["']M["']|\bmale\b|\bman\b|\bboy\b/i.test(s);
    return f && !m ? 'F' : m && !f ? 'M' : null;
  };
  const check = (id, where, s, pin) => {
    const sents = s.split(/(?<=[.!?])["”']?\s+|;\s+/);
    sents.forEach((sent, i) => {
      const tm = /\{(?:them|themFull)\}/.exec(sent);
      if (!tm) return;
      // from the first {them} to a pronoun, nothing that names another person, no sentence end between
      const rest = sent.slice(tm.index + tm[0].length);
      PRON.lastIndex = 0;
      let m;
      while ((m = PRON.exec(rest))) {
        const gap = rest.slice(0, m.index);
        if (OTHER.test(gap) || /\b(your|a|an|the|his|her|their)\s+[a-z]+(?:[ ,]|$)/.test(gap.replace(/^['’]s\b/, '')) && /\b(wife|husband|mother|father|son|daughter|brother|sister|master|lord|lady|child|steward|friend|neighbou?r|man|woman|boy|girl|priest|guard|servant|teacher|apprentice)\b/.test(gap)) break;
        if (/[A-Z][a-z]+/.test(gap.replace(/^\s*[A-Z]/, ''))) break;           // another name
        if (/"|“|”/.test(gap)) break;                                            // speech: someone else speaks
        const male = MALE.test(m[1]);
        if (pin && (pin === 'M') === male) break;                                // the pinned sex says it right
        out.push({ id, where, sent: sent.slice(0, 150), word: m[0], pin });
        return;
      }
      // the next sentence opens on a pronoun, with no other person in it
      const nx = sents[i + 1];
      if (nx && !OTHER.test(sent) && !OTHER.test(nx) && /^["“]?(He|She)\b/.test(nx) && !/\b(a|the|your|an) [a-z]+/i.test(sent.replace(/\{[^}]*\}/g, '').slice(0, tm.index))) {
        const male = /^["“]?He\b/.test(nx);
        if (!(pin && (pin === 'M') === male)) out.push({ id, where: where + '+1', sent: (sent + ' ' + nx).slice(0, 150), word: nx.match(/^["“]?(He|She)/)[1], pin });
      }
    });
  };
  for (const id of Object.keys(A.EV)) {
    const e = A.EV[id], pin = pinOf(e);
    for (const s of strsOf(e.text)) check(id, 'text', s, pin);
    (e.choices || []).forEach((c, i) => {
      for (const s of strsOf(c.r)) check(id, `c${i}.r`, s, pin);
      for (const k of ['win', 'lose']) if (c[k]) for (const s of strsOf(c[k].r)) check(id, `c${i}.${k}`, s, pin);
    });
  }
  return out;
};
