// Plural realms agree with their verbs in both lands (world review cycle 2, B5: "The War of Zahira ends: Sand Clans
// wins"). 991-far-war's A.realmRef and A.realmVerb give a far realm whose short name is a plural noun its article and
// its verb, but only for far realms in a far game; the Known World's own plural realms (the Sand Clans, the Tusk
// Clans, the Amber Isles, the Nine Winds) kept the singular in both lands. Loaded after 991 (this folder sorts after
// it), so this wraps its helpers. Words only.
(function () {
  const FW = A.FW; if (!FW || typeof A.realmVerb !== 'function' || typeof FW.shortPlural !== 'function') return;
  const ref = A.realmRef, verb = A.realmVerb;
  const plural = r => { try { return !!(r && r.short && FW.shortPlural(r)); } catch (e) { return false; } };
  A.realmRef = function (id) {
    const out = ref.apply(this, arguments), r = A.realm(id);
    if (r && plural(r) && out === r.short) return 'the ' + r.short;
    return out;
  };
  A.realmVerb = function (id, one, many) {
    const r = A.realm(id);
    if (r && plural(r)) return A.realmRef(id) + ' ' + many;
    return verb.apply(this, arguments);
  };
})();
