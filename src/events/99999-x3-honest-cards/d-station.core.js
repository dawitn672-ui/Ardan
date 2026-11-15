// X3 part 2 (E4): no station word in a card for a life that does not hold the station.
//
// The playtest: a captain of 17 asked for his voice at the council; a pedlar told "your journeyman"; a serf's field "Ride out with your
// men". A card that speaks to the player as a lord, a captain, a master or a commander says what he is; a life that is not that is
// being told a lie. A.X3.STATION lists the words that address the player by a station ("your men", "my lord," as a vocative, "Master
// <you>", "your journeyman", "you are a journeyman") and the gate each one needs. Other people's titles ("Captain Hobart", "the
// sergeant at the gate") name someone else and are not touched.
//
//   A.X3.stationBreach(pc, text)  the rules the text breaks for this life: [{ id, word }] (pure)
//   A.X3.stationNeeds(e)          the rules a scene's own text uses (read once from its source, tokens and all)
// The scene is held back where it is dealt (A.evFit gives it no weight for a life that fails a gate it needs), and a scene that is
// queued by name, or whose words are built at run time, is dropped as it is drawn if the card it made breaks a gate (e-guard).
// tools/lint-cards.mjs lists the scenes whose own condition lets such a life in, so they can be gated at the source.
(function () {
  const X3 = A.X3 = A.X3 || {};
  const sc = pc => { try { return UI.scope(pc); } catch (e) { return null; } };
  const mil = pc => (pc && pc.mil && !pc.mil.merc ? pc.mil.rank | 0 : -1);
  const rankName = pc => { try { const C = pc.job && GD.CAREERS[pc.job.c]; return C ? String(C.ranks[Math.min(pc.job.r | 0, C.ranks.length - 1)]).split(',')[0] : ''; } catch (e) { return ''; } };
  // the release's own reading of a noble's rung (08-ct): a noble of a house has at least a rung of 2, and a house keeps men and land
  const rung = pc => (pc.noble ? pc.noble.rung | 0 : pc.status === 'royal' || pc.status === 'noble' ? 4 : pc.status === 'gentry' ? 1 : 0);
  const H = X3.HOLDS = {
    gentle: pc => !!(pc.ruler || pc.noble || A.classOf(pc) >= 5 || (sc(pc) && sc(pc).post.any) || (pc.job && pc.job.c === 'knight')),
    landed: pc => !!(pc.ruler || rung(pc) >= 2 || A.classOf(pc) >= 6 || (sc(pc) && sc(pc).post.any)),
    ruling: pc => !!(pc.ruler || (sc(pc) && (sc(pc).post.seat || sc(pc).post.ruler)) || A.classOf(pc) >= 7),
    holdings: pc => !!(pc.ruler || pc.noble || A.classOf(pc) >= 5 || (pc.assets || []).some(x => /manor|farm|estate|mill|land|house|hall/i.test(x && x.k || ''))),
    soldier: pc => !!(pc.mil || pc.company),
    sergeant: pc => mil(pc) >= 2 || !!pc.company,
    officer: pc => mil(pc) >= 4 || !!pc.company || !!(pc.job && /^(sailor|pirate|mercenary)$/.test(pc.job.c) && (pc.job.r | 0) >= 3),
    commands: pc => !!(pc.ruler || rung(pc) >= 2 || pc.company || mil(pc) >= 2 || (pc.mil && pc.mil.merc && (pc.mil.rank | 0) >= 2) || A.classOf(pc) >= 6 || (sc(pc) && sc(pc).post.any)),
    master: pc => !!(pc.ruler || (pc.job && ((pc.job.r | 0) >= 2 || pc.job.own)) || A.classOf(pc) >= 5),
    crew: pc => !!(pc.job && /^(sailor|pirate|fish)$/.test(pc.job.c)) || !!pc.ruler,
    trade: pc => !!(pc.job || pc.ruler),
  };
  const RANK = w => pc => new RegExp('\\b' + w + '\\b', 'i').test(rankName(pc));

  // [id, regexp on the text, gate]; a function in place of the regexp is given (pc or null) and returns one
  const person = pc => (pc ? [pc.given, pc.sur, pc.name].filter(Boolean).map(s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') : '');
  const titled = (words, gate, id) => [id, pc => new RegExp('\\b(?:' + words + ')\\s+' + (pc ? '(?:' + (person(pc) || '(?!)') + ')\\b' : '\\{(?:name|full|sur)\\}'), 'g'), gate];
  X3.STATION = [
    ['vocative-lord', /(?:^|[“"'(]|[,.!?]\s)\s*my (?:lord|lady)\s*[,.!?;:”"]|,\s*my (?:lord|lady)\b(?!['’]s)|\bmilord\b|\bmilady\b/i, H.gentle],
    ['honorific', /\byour (?:lordship|ladyship|grace|majesty|highness|excellency|eminence|worship)\b/i, H.gentle],
    ['sir', /\b(?:sir|ser)\s+\{(?:name|full|sur)\}|(?:^|[“"]\s*)(?:sir|ser)\s*,/i, pc => H.gentle(pc)],
    titled('lord|lady|dame|my lord|my lady', H.gentle, 'title-lord'),
    titled('master|mistress', H.master, 'title-master'),
    titled('captain', H.officer, 'title-captain'),
    titled('sergeant', H.sergeant, 'title-sergeant'),
    ['your-men', /\byour (?:men|soldiers|troops|garrison|lieutenants?|squad|banner|riders|archers|footmen|battalion|division|regiment|levy)\b/i, H.commands],
    ['your-company', /\byour (?:company|comrades-in-arms)\b/i, H.soldier],
    ['your-retinue', /\byour (?:retinue|retainers|knights|household knights|bannermen)\b/i, H.gentle],
    ['your-crew', /\byour (?:crew|deckhands)\b/i, H.crew],
    ['your-domain', /\byour (?:vassals|subjects|fief|castle|council|councillors|chancellor|treasurer|marshal|seneschal)\b/i, H.landed],
    ['your-holdings', /\byour (?:tenants|manor|estate|steward|servants|bailiff|reeve)\b/i, H.holdings],
    ['your-apprentice', /\byour (?:journeymen|journeyman|apprentices?)\b/i, H.master],
    ['your-shop', /\byour (?:workshop|forge|loom|shop|stall|customers)\b/i, H.trade],
    ['you-journeyman', /\byou (?:are|were|have been|remain) (?:still )?a journeyman\b/i, RANK('journeyman')],
    ['you-apprentice', /\byou (?:are|were|have been|remain) (?:still )?(?:an? )?apprentice\b/i, pc => /apprentice/i.test(rankName(pc)) || (pc.job && (pc.job.r | 0) === 0)],
  ];
  const rxOf = (rule, pc) => { const r = rule[1]; return typeof r === 'function' ? r(pc) : r; };
  const holds = (rule, pc) => { try { return !!rule[2](pc); } catch (e) { return true; } };

  X3.stationBreach = function (pc, text) {
    const out = [];
    if (!pc || !text) return out;
    for (const rule of X3.STATION) {
      const rx = rxOf(rule, pc); rx.lastIndex = 0;
      const m = rx.exec(text);
      if (m && !holds(rule, pc)) out.push({ id: rule[0], word: m[0].trim().slice(0, 40) });
    }
    return out;
  };

  // the rules a text uses at all, held or not (for the tests: a check that no word turns up would pass for nothing)
  X3.stationUses = function (pc, text) {
    const out = [];
    for (const rule of X3.STATION) { const rx = rxOf(rule, pc); rx.lastIndex = 0; if (rx.test(text || '')) out.push(rule[0]); }
    return out;
  };

  // the strings a scene can say to the player, read from its source: the function texts' literals included
  const strsOf = v => {
    if (typeof v === 'string') return [v];
    if (typeof v !== 'function') return [];
    const s = String(v);
    return [...s.matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g)].map(m => m[2]);
  };
  X3.sayings = function (e) {
    const out = [...strsOf(e.title), ...strsOf(e.text), ...strsOf(e.more)];
    for (const c of e.choices || []) {
      out.push(...strsOf(c.t), ...strsOf(c.r));
      for (const k of ['win', 'lose']) if (c[k]) out.push(...strsOf(c[k].r));
    }
    return out.join(' \u0001 ');
  };
  const needs = new Map();
  X3.stationNeeds = function (e) {
    if (!e || !e.id) return [];
    if (needs.has(e.id)) return needs.get(e.id);
    let out = [];
    try {
      const s = X3.sayings(e);
      for (const rule of X3.STATION) { const rx = rxOf(rule, null); rx.lastIndex = 0; if (rx.test(s)) out.push(rule[0]); }
    } catch (err) { out = []; }
    needs.set(e.id, out);
    return out;
  };
  X3.stationFits = function (e, pc) {
    const ids = X3.stationNeeds(e);
    for (const id of ids) { const rule = X3.STATION.find(r => r[0] === id); if (rule && !holds(rule, pc)) return false; }
    return true;
  };
  const fit0 = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit0.apply(this, arguments);
    try { if (w > 0 && pc && !X3.stationFits(e, pc)) return 0; } catch (err) {}
    return w;
  };
})();
