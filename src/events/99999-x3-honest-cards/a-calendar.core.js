// X3 (T6), the calendar: a feast comes on its own date and a dated scene only in its month.
//
// The release picked a feast with A.pick(GD.FESTIVALS) in any month, so Spring Equinox came in August, and "1 May: the hiring
// fair" was dealt on 24 November. GD.FESTIVALS already says which month each feast falls in (the number after its name).
//   - A.pick on GD.FESTIVALS, or on a list of feast names ("May Fair", "the Slaughter Feast"), gives the feast of this month.
//     The dice are drawn as before (the original pick runs first); only the answer is made true.
//   - A scene that opens on a date or a feast (its title, or the first words of its text, name a month or a feast) is a
//     dated scene: A.evFit gives it no weight in another month. A scene that picks any feast from the list is allowed in
//     every month that has one (all but July).
//   - The "Go to a feast" activity says so when no feast falls this month.
// Pure reading of the event and the date; nothing is drawn. Scenes that are queued by name (a letter, a chain, a scheduled
// promise) are not dealt by the roll and are not held back here.
(function () {
  const X3 = A.X3 = A.X3 || {};
  const norm = s => String(s || '').replace(/^the\s+/i, '').trim().toLowerCase();
  const FEST = new Map();                       // lower-case feast name -> month index
  for (const f of GD.FESTIVALS) FEST.set(norm(f[0]), f[1]);
  FEST.set('may fair', 4);
  X3.festivalMonths = new Set(GD.FESTIVALS.map(f => f[1]));
  const monthNow = () => { try { return A.monthOf(A.today()).m; } catch (e) { return -1; } };
  X3.festivalsIn = m => GD.FESTIVALS.filter(f => f[1] === m);

  // the feast of this month out of a pick: the original answer when it already fits (or when no feast falls now)
  const pick0 = A.pick;
  A.pick = function (arr) {
    const r = pick0.apply(this, arguments);
    try {
      if (!Array.isArray(arr) || !arr.length) return r;
      const m = monthNow();
      if (arr === GD.FESTIVALS) {
        const here = X3.festivalsIn(m);
        return here.length && !here.includes(r) ? here[Math.abs(arr.indexOf(r)) % here.length] : r;
      }
      if (typeof arr[0] === 'string' && arr.length <= 6 && arr.every(s => FEST.has(norm(s)))) {
        const here = arr.filter(s => FEST.get(norm(s)) === m);
        return here.length && !here.includes(r) ? here[0] : r;
      }
    } catch (e) {}
    return r;
  };

  // ---- dated scenes -------------------------------------------------------------------------------------------------
  const MONTH_RX = new RegExp('(?:\\b\\d{1,2}(?:st|nd|rd|th)?\\s+|\\b(?:in|of|last|next|every|this|until|by)\\s+)(' + GD.MONTHS.join('|') + ')\\b|\\b(' + GD.MONTHS.join('|') + ')\\s*:', 'g');
  const textOf = v => { try { return typeof v === 'function' ? String(v) : String(v == null ? '' : v); } catch (e) { return ''; } };
  const cache = new Map();
  // the months a scene is about, or null when it is not a dated scene
  X3.datedMonths = function (e) {
    if (!e || !e.id) return null;
    if (cache.has(e.id)) return cache.get(e.id);
    let out = null;
    try {
      const title = typeof e.title === 'string' ? e.title : '';
      const text = textOf(e.text), setup = textOf(e.setup);
      // only the opening sentence dates a scene: "She means to cross the passes in June" later on is a plan, not the
      // day the scene happens (CI 109: mpe_dw_rune_aud was held to June)
      const body = typeof e.text === 'string' ? text.slice(0, 140) : text.slice(0, 260);
      const first = body.replace(/^[^`'"]*=>\s*[`'"]/, '').split(/[.!?](?:\s|$)/)[0];
      const lead = (title + ' ' + first).trim();
      const set = new Set();
      for (const [name, m] of FEST) if (new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(lead)) set.add(m);
      for (const mm of lead.matchAll(MONTH_RX)) { const i = GD.MONTHS.indexOf(mm[1] || mm[2]); if (i >= 0) set.add(i); }
      for (let i = 0; i < GD.MONTHS.length; i++) if (title && new RegExp('\\b' + GD.MONTHS[i] + '\\b').test(title) && !/^\s*(March|May)\s+[a-z]/.test(title)) set.add(i);
      if (/GD\.FESTIVALS/.test(setup)) for (const m of X3.festivalMonths) set.add(m);
      if (set.size) out = [...set].sort((a, b) => a - b);
    } catch (err) { out = null; }
    cache.set(e.id, out);
    return out;
  };
  const fit0 = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit0.apply(this, arguments);
    try {
      if (w > 0 && !e.trigger) { const ms = X3.datedMonths(e); if (ms && !ms.includes(monthNow())) return 0; }
    } catch (err) {}
    return w;
  };

  // ---- the feast you go to ------------------------------------------------------------------------------------------
  const canAct0 = A.canAct;
  A.canAct = function (key) {
    const r = canAct0.apply(this, arguments);
    try { if (key === 'festival' && r && r[0] && !X3.festivalsIn(monthNow()).length) return [false, 'No feast falls this month.']; } catch (e) {}
    return r;
  };
})();
