// X3 part 2 (E5, E7): where you are, and who is there.
//
// The playtest: a company in Gorath got cards headed "Yewmarch" (its home town); a general at a siege got "Stolen hours by the river";
// counsel came from a wife at home and a brother in prison. The release knows where a man was born (p.home) and the war knows where
// his division stands (d.loc); nothing joined the two for a card.
//
//   A.X3.whereIs(p)      the province a person stands in: the road (pc.journey.at), his division's ground, else his home
//   A.X3.away(pc)        he is not at home: on the road, or with a division that stands elsewhere
//   A.X3.homeScene(e)    a scene set in the player's home town: its words say {home} (or the code reads p.home) and it is not news
//                        from home (a letter, a messenger, a rumour: those are about the place being away)
//   A.X3.homeBreach(pc, text)   the text names the home town as the place the scene is in
//   A.X3.present(pc, t)  t could speak to the player now: alive, free, and on the same ground (a prisoner is with prisoners)
// A scene set at home gets no weight in a month the player is away (A.evFit); one that is queued by name, or whose text names the home
// town through a token the source does not show, is dropped as it is drawn (e-guard). A person's name with a home ("Isabella of
// Aurora") is a name, not a place.
(function () {
  const X3 = A.X3 = A.X3 || {};
  const prov = id => (A.S && A.S.prov ? A.S.prov[id] : null);
  X3.whereIs = function (p) {
    try {
      if (!p) return null;
      if (p.journey && p.journey.at != null && prov(p.journey.at)) return p.journey.at;
      const d = p.mil && p.mil.div && A.divById ? A.divById(p.mil.div) : null;
      if (d && d.loc != null && prov(d.loc)) return d.loc;
      // a ruler and his council sit at the capital
      const home = A.realm(p.ruler || p.realm);
      if (home && home.capitalProv != null && prov(home.capitalProv)) {
        if (p.ruler) return home.capitalProv;
        if (home.council && Object.values(home.council).includes(p.id)) return home.capitalProv;
      }
    } catch (e) {}
    return p ? p.home : null;
  };
  X3.away = function (pc) { const w = X3.whereIs(pc); return !!(pc && w != null && pc.home != null && w !== pc.home); };

  const NEWS = /\b(letters?|word (?:comes|reaches|has come|from)|news|messenger|courier|carter|going back|homesick|far from home|away from home|back home|from home|rumou?rs?|heard that|writes|written)\b/i;
  const srcOf = v => { try { return typeof v === 'function' ? String(v) : String(v == null ? '' : v); } catch (e) { return ''; } };
  const memo = new Map();
  X3.homeScene = function (e) {
    if (!e || !e.id) return false;
    if (memo.has(e.id)) return memo.get(e.id);
    let out = false;
    try {
      const say = X3.sayings(e);
      const code = [e.setup, e.text, e.title, ...(e.choices || []).flatMap(c => [c.t, c.fx, c.req, c.win && c.win.fx, c.lose && c.lose.fx])].map(srcOf).join(' ');
      out = (/\{home\}/.test(say) || /\b(?:p|pc|A\.pc\(\))\.home\b/.test(code)) && !NEWS.test(say);
    } catch (err) { out = false; }
    memo.set(e.id, out);
    return out;
  };
  const nameOf = pc => { try { return A.provName(pc.home); } catch (e) { return ''; } };
  X3.homeBreach = function (pc, text) {
    if (!pc || !text || !X3.away(pc)) return null;
    const home = nameOf(pc);
    if (!home || home.length < 3 || NEWS.test(text)) return null;
    const rx = new RegExp('\\b' + home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
    let m;
    while ((m = rx.exec(text))) {
      const before = text.slice(Math.max(0, m.index - 14), m.index);
      if (/[A-Z][a-z'’-]+\s+of\s+$/.test(before) || /(?:Lord|Lady|Bishop|Duke|Duchess|Count|Countess|Earl|Prince|Princess|King|Queen|Baron|Abbot|Prior)\s+of\s+$/i.test(before)) continue;
      return home;
    }
    return null;
  };
  const fit0 = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit0.apply(this, arguments);
    try { if (w > 0 && pc && !e.trigger && X3.away(pc) && X3.homeScene(e)) return 0; } catch (err) {}
    return w;
  };

  // who is there
  X3.present = function (pc, t) {
    try {
      if (!pc || !t || !t.alive || t.id === pc.id) return false;
      if (pc.prison) return !!t.prison;
      if (t.prison) return false;
      return X3.whereIs(t) === X3.whereIs(pc);
    } catch (e) { return true; }
  };
})();
