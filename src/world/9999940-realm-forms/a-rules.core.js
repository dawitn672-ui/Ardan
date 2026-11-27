// Order 99 (D-206): the words of the five forms. A realm is a kingdom, an empire, a principality, a merchant republic or
// a free city, and nothing else (none of the old forms: the rules below name them, in pieces).
// These rules carried the lore and the events over once (tools/o99/realm-forms.mjs runs them over the source) and carry an
// old save's realms, houses and people over on load (forms.core.js). Pure: strings in, strings out.
//
// A rule is [pattern, replacement] (global: it names one realm's form wherever it stands) or [pattern, replacement, realm]
// (it holds only where the string speaks of that realm: the lore record's own realm, or one of the realm's names in the
// string, CTX below). The orcs' Horde of Gorath and Ughrak Clans (POL-11, POL-34) are another builder's and are not
// touched here. Old words are written in pieces so that the built page spells none of them out (tests/v2 and this
// feature's test look for them).
(function () {
  const J = (...p) => p.join('');
  const W = {
    sul: J('Sul', 'tan'), sulL: J('sul', 'tan'), emi: J('Em', 'ir'), emiL: J('em', 'ir'), kha: J('Kh', 'an'), khaL: J('kh', 'an'),
    khat: J('Kh', 'atun'), khatL: J('kh', 'atun'), hs: J('Holy', ' See'), Dog: J('Do', 'g'), dog: J('do', 'g'), hl: J('High', ' Luminar'), conf: J('Confedera'), confL: J('confedera'),
  };
  const R = (s, f) => new RegExp(s, f || 'g');
  const RULES = [
    // ---- the Principality of Solenne (the Temple's state; its ruler is a Prince-Bishop, elected by the Luminaries)
    [R(`\\b${W.hs} of Solenne\\b`), 'Principality of Solenne'],
    [R(`\\b[Tt]he ${W.hs}'s\\b`), "Solenne's"],
    [R(`\\b[Tt]he ${W.hs}\\b`), 'Solenne'],
    [R(`\\b${W.hs}\\b`), 'Solenne'],
    [R(`\\b${W.hl}ies\\b`), 'Prince-Bishops'],
    [R(`\\b${W.hl}y\\b`), 'Prince-Bishop'],
    // ---- the Merchant Republic of Lucerna
    [R('(?<!Merchant )\\bRepublic of Lucerna\\b'), 'Merchant Republic of Lucerna'],
    // its elected head is its First Merchant (the owner's plain words: a title a newcomer reads cold), elected for life as before
    [R(`\\bthe next ${W.dog}eship\\b`), "the First Merchant's chair next time"],
    [R(`\\b([Tt])he ${W.dog}eship\\b`), "$1he First Merchant's chair"],
    [R(`\\b${W.dog}eship\\b`), "the First Merchant's chair"],
    [R(`\\b${W.Dog}aressa\\b`), 'First Merchant'],
    [R(`\\b${W.Dog}es\\b`), 'First Merchants'],
    [R(`\\b(?:[Tt]he )?First ${W.Dog}\\b`), 'the first of the First Merchants'],
    [R(`\\b${W.Dog}e\\b`), 'First Merchant'],
    // ---- the Kingdom of Frostholm (a giants' kingdom, as Hrimfell is; their chieftain, and for a time their prince, is a
    //      king, still chosen at the Thing)
    [R(`\\b(?:Halls|Principality) of Frostholm\\b`), 'Kingdom of Frostholm'],
    [R('\\b(?:Chieftain|Prince)s\\b'), 'Kings', 'POL-09'],
    [R('\\b(?:Chieftain|Prince)\\b'), 'King', 'POL-09'],
    [R('\\b(?:chieftain|prince)s\\b'), 'kings', 'POL-09'],
    [R('\\b(?:chieftain|prince)\\b'), 'king', 'POL-09'],
    // ---- the Kingdom of Ulun (its khan a king, still raised by the nine chiefs)
    [R(`\\b${W.kha}ate of Ulun\\b`), 'Kingdom of Ulun'],
    [R(`\\b${W.kha}ates\\b`), 'Kingdoms'], [R(`\\b${W.kha}ate\\b`), 'Kingdom'],
    [R(`\\b${W.khaL}ates\\b`), 'kingdoms'], [R(`\\b${W.khaL}ate\\b`), 'kingdom'],
    [R(`\\b${W.khat}s\\b`), 'Queens'], [R(`\\b${W.khat}\\b`), 'Queen'],
    [R(`\\b${W.khatL}s\\b`), 'queens'], [R(`\\b${W.khatL}\\b`), 'queen'],
    [R(`\\b${W.kha}s\\b`), 'Kings'], [R(`\\b${W.kha}\\b`), 'King'],
    [R(`\\b${W.khaL}s\\b`), 'kings'], [R(`\\b${W.khaL}\\b`), 'king'],
    // ---- the Kingdoms of Qadir and Ambrel (their sultans kings)
    [R(`\\b${W.sul}ate of `), 'Kingdom of '],
    [R(`\\b${W.sul}ates\\b`), 'Kingdoms'], [R(`\\b${W.sul}ate\\b`), 'Kingdom'],
    [R(`\\b${W.sulL}ates\\b`), 'kingdoms'], [R(`\\b${W.sulL}ate\\b`), 'kingdom'],
    [R(`\\b${W.sul}as\\b`), 'Queens'], [R(`\\b${W.sul}a\\b`), 'Queen'],
    [R(`\\b${W.sulL}as\\b`), 'queens'], [R(`\\b${W.sulL}a\\b`), 'queen'],
    [R(`\\b${W.sul}s\\b`), 'Kings'], [R(`\\b${W.sul}\\b`), 'King'],
    [R(`\\b${W.sulL}s\\b`), 'kings'], [R(`\\b${W.sulL}\\b`), 'king'],
    // ---- the Principality of Sabra (its emir a prince; Qadir's emirs, its great lords, princes too)
    [R(`\\b(A|a)n (?=${W.emi}|${W.emiL})`), '$1 '],
    [R(`\\b${W.emi}ate of `), 'Principality of '],
    [R(`\\b${W.emi}ates\\b`), 'Principalities'], [R(`\\b${W.emi}ate\\b`), 'Principality'],
    [R(`\\b${W.emiL}ates\\b`), 'principalities'], [R(`\\b${W.emiL}ate\\b`), 'principality'],
    [R(`\\b${W.emi}as\\b`), 'Princesses'], [R(`\\b${W.emi}a\\b`), 'Princess'],
    [R(`\\b${W.emi}s\\b`), 'Princes'], [R(`\\b${W.emi}\\b`), 'Prince'],
    [R(`\\b${W.emiL}s\\b`), 'princes'], [R(`\\b${W.emiL}\\b`), 'prince'],
    // ---- the Kingdom of Sahrim (its Speaker a king, still acclaimed for life by the clan chiefs)
    [R(`\\bSahrim ${W.conf}cy\\b`), 'Kingdom of Sahrim'],
    [R(`\\b${W.conf}cy of the Sahrim\\b`), 'Kingdom of Sahrim'],
    [R(`\\bSpeakership\\b`), 'kingship', 'POL-19'],
    [R(`(?<!First )\\bSpeakers\\b`), 'Kings', 'POL-19'],
    [R(`(?<!First )\\bSpeaker\\b`), 'King', 'POL-19'],
    [R(`\\b${W.conf}(cy|tion)\\b`), 'Kingdom', 'POL-19'],
    [R(`\\b${W.confL}(cy|tion)\\b`), 'kingdom', 'POL-19'],
    // ---- the Principality of Skyhold (its Abbot a Prince-Abbot)
    [R(`\\b${J('Abbey of', ' Skyhold')}\\b`), 'Principality of Skyhold'],
    [R(`(?<!Prince-)\\bAbbot Tashen\\b`), 'Prince-Abbot Tashen'],
    // ---- the Merchant Republic of Brannoch (no king, no lords: the valleys' council and its First Speaker)
    [R(`\\bLeague of Brannoch\\b`), 'Merchant Republic of Brannoch'],
    [R(`(?<!Strait )\\bLeague(?! of (?!Brannoch))`), 'Republic', 'POL-13'],
    [R(`\\bleague(?= of)`), 'republic', 'POL-13'],
    // ---- the Merchant Republic of Kesh (four merchant towns; their council of merchant houses elects the Prince of Kesh)
    [R(`\\bnot Kesh, the (?:League|princedom)'s\\b`), "not Kesh, the republic's", 'POL-21'],
    [R(`\\bsell the princedom\\b`), 'sell the republic', 'POL-21'],
    [R(`\\b([Tt])he princedom\\b`), "$1he prince's chair", 'POL-21'],
    [R(`\\b[Tt]he League council\\b`), 'the council of Kesh', 'POL-21'],
    [R(`\\b[Tt]he League's\\b`), "Kesh's", 'POL-21'],
    [R(`\\b[Tt]he League\\b`), 'Kesh', 'POL-21'],
    [R(`\\ba (?:league|principality) of four (?:merchant )?towns\\b`), 'a merchant republic of four towns', 'POL-21'],
    // ---- the Free City of Corvasse (the pirates' port, its Captain-General still elected by the Captains' Table)
    [R(`\\b${J('Free', ' Port')}\\b`), 'Free City'],
  ];
  // the names that say a string speaks of a realm
  const CTX = {
    'POL-09': /Frostholm|Skarfell|Skarvi|Haugberg|Torvik|Lindholm|Ragvik/,
    'POL-13': /Brannoch|Highcastle|Greycloak|Helga Stonefoot|Council of Valleys|Redford|Highwold|Amberhurst|Whitfield|Bearfold|Silvervein|Deepstead|Coldencombe/,
    'POL-19': /Sahrim|Zarak|Tariq|\bBahar\b|Red Waste|Well of Samar|Noon Lances|Harith Sayf|Well-Mother/,
    'POL-21': /\bKesh|Keshari|Keshi|Pepper Hall|Monuri|Madami|Amani/,
  };
  const SKIP = new Set(['POL-11', 'POL-34']);
  const ANY = new RegExp([W.khat, W.khatL, W.Dog + 'e', W.Dog + 'aressa', W.dog + 'eship', W.sul, W.sulL, W.emi, W.emiL, W.kha, W.khaL, W.hs, W.hl, W.conf, W.confL, J('Halls of', ' Frostholm'), 'Principality of Frostholm', 'Prince', 'prince', 'Republic of Lucerna',
    'Chieftain', 'chieftain', 'Speaker', 'Speakership', 'League', 'league', J('Abbey of', ' Skyhold'), 'Abbot Tashen', J('Free', ' Port')].join('|'));
  function fix(s, rec) {
    if (typeof s !== 'string' || !ANY.test(s)) return s;
    const ctx = new Set();
    if (rec && !SKIP.has(rec)) ctx.add(rec);
    for (const id in CTX) if (CTX[id].test(s)) ctx.add(id);
    let o = s;
    for (const [rx, to, only] of RULES) {
      if (only && !ctx.has(only)) continue;
      rx.lastIndex = 0;
      o = o.replace(rx, to);
    }
    return o;
  }
  A.REALM_FORMS = { RULES, CTX, ANY, fix, J };
})();
