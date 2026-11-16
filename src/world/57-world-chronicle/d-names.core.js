// No two wars of one world under one name, in both lands (world review cycle 2, B5).
//
// 991-far-war numbers far wars ("The Sixth Red War"), but only in a Great Continent game, and only for names that go
// through A.warName; a succession war is named by its caller and passed straight to A.startWar. The chronicle then
// read "The Long War" five times in one Known World century and "The War of the Tessaria Succession" seven. Now
// every war's name is made unique as it starts: the second "The Long War" is "The Second Long War". The chronicle's
// record (WC.warName) reads the war's own name, so it follows.
// Engine only; no dice.
(function () {
  const ORD = ['', '', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  const ORD_RX = new RegExp('^The (' + ORD.filter(Boolean).join('|') + '|\\d+(st|nd|rd|th)) ');
  const base = n => String(n || '').replace(ORD_RX, 'The ');
  const used = function () {
    const S = A.S, out = new Set();
    for (const w of S.wars || []) if (w && w.name) out.add(w.name);
    for (const h of S.history || []) { const m = h && typeof h.t === 'string' && h.t.match(/^(.*?) \(-?\d/); if (m) out.add(m[1]); }
    try { if (A.WC && A.WC.all) for (const e of A.WC.all()) if (e && e.k === 'war' && Array.isArray(e.x) && e.x[1]) out.add(e.x[1]); } catch (e) {}
    return out;
  };
  const unique = function (name) {
    if (!name || !/^The /.test(name)) return name;
    const U = used(); if (!U.has(name)) return name;
    const b = base(name);
    for (let k = 2; k < 99; k++) {
      const cand = b.replace(/^The /, 'The ' + (ORD[k] || A.ordinal(k)) + ' ');
      if (!U.has(cand)) return cand;
    }
    return name;
  };
  A.uniqueWarName = unique;
  // the release's namer (A.startWar asks it when no name is given; 991 wraps it again for far games)
  const wn = A.warName;
  if (typeof wn === 'function') A.warName = function () {
    const n = wn.apply(this, arguments);
    try { return unique(n); } catch (e) { console.error('war name', e); return n; }
  };
  const sw = A.startWar;
  if (typeof sw === 'function') A.startWar = function (att, def, name, cb, opts) {
    const args = Array.prototype.slice.call(arguments);
    try { if (typeof name === 'string') args[2] = unique(name); } catch (e) { console.error('war name', e); }
    return sw.apply(this, args);
  };
})();
