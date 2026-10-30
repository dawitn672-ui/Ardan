// War in the Far Lands, third part: how the chronicle words a far war (cycle 1 fixes). Far games only: every helper
// returns the release's own words while A.FW.on is false, so a Known World game reads exactly as before.
//   names    the release's war namer draws "The Long War", "The Red War" ... from eight words, so a continent of 153
//            realms named three wars "The Long War" in one year. A name already borne by a live or recorded war takes
//            an ordinal ("The Second Long War"). The namer's own draws are made first, so the random stream is the same.
//   grammar  many far realms' short names are common nouns, often plural ("Frost Riders", "Ridges", "Khaganate"):
//            A.realmRef gives them their article ("the Frost Riders"), A.realmVerb the verb that agrees ("the Frost
//            Riders win"), A.realmNamePlural says whether a full name is plural ("The Ouro Hunters are no more").
//            Read by the patches FW-WAR-WORDS and FW-FALL-WORDS, and by 57-world-chronicle's echo lines.
(function () {
  const FW = A.FW;
  if (!FW) return;
  const FAR = A.FAR;
  const farR = id => !!(FAR && FAR.D && FAR.D.realms && FAR.D.realms[id]);
  const on = () => !!FW.on;
  const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // a short name that is a proper name stands after "of" in the full one ("Kingdom of Busimo", "Principality of Tirun
  // Isle", "The Salt Wells of Moi"); any other is a noun and takes "the" ("Khaganate of the Long Grass", "The Black
  // Lamp Commune", "Confederacy of the Southern Ridges")
  FW.shortNeedsThe = r => !!(r && r.short && r.name && !/^the /i.test(r.short) && !new RegExp('\\bof ' + reEsc(r.short) + '\\b').test(r.name));
  FW.shortPlural = r => FW.shortNeedsThe(r) && /[^s]s$/.test(r.short);
  FW.namePlural = r => { if (!r || !r.name) return false; const head = String(r.name).split(' of ')[0].replace(/^The /, '').trim().split(' ').pop(); return /[^s]s$/.test(head); };
  A.realmRef = function (id) {
    const r = A.realm(id);
    if (!on() || !r || !farR(r.id)) return A.realmShort(id);
    return FW.shortNeedsThe(r) ? 'the ' + r.short : r.short;
  };
  A.realmVerb = function (id, one, many) {
    const r = A.realm(id);
    return A.realmRef(id) + ' ' + (on() && r && farR(r.id) && FW.shortPlural(r) ? many : one);
  };
  A.realmNamePlural = r => !!(on() && r && farR(r.id) && FW.namePlural(r));

  // ---- war names: no two wars of one world under one name
  const ORD = ['', '', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
  const ORD_RX = new RegExp('^The (' + ORD.filter(Boolean).join('|') + '|\\d+(st|nd|rd|th)) ');
  FW.warBase = n => String(n || '').replace(ORD_RX, 'The ');
  FW.usedWarNames = function () {
    const S = A.S, out = new Set();
    for (const w of S.wars || []) if (w && w.name) out.add(w.name);
    for (const h of S.history || []) { const m = h && typeof h.t === 'string' && h.t.match(/^(.*?) \(-?\d/); if (m) out.add(m[1]); }
    return out;
  };
  FW.uniqueWarName = function (name) {
    if (!name || !/^The /.test(name)) return name;
    const used = FW.usedWarNames();
    if (!used.has(name)) return name;
    const base = FW.warBase(name);
    let n = 0;
    for (const u of used) if (FW.warBase(u) === base) n++;
    for (let k = n + 1; k < 99; k++) {
      const cand = base.replace(/^The /, 'The ' + (ORD[k] || A.ordinal(k)) + ' ');
      if (!used.has(cand)) return cand;
    }
    return name;
  };
  const warName = A.warName;
  if (typeof warName === 'function') A.warName = function () {
    const n = warName.apply(this, arguments);
    if (!on()) return n;
    try { return FW.uniqueWarName(n); } catch (e) { console.error('far war name', e); return n; }
  };
})();
