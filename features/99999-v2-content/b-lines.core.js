// 99999-v2-content, part 2: the extra lines on a card, only when they fit the scene (playtest 1, #10).
//
// The playtest found filler on every card: an inner voice (9992-identity) unrelated to the scene ("CALLUSES: Mend the
// roof before the baby comes, not after." on "First arrows"; "LETTERS: He quotes the law badly ..." on a child's card),
// and stock parent counsel (9999-advisors) on small things ("I have buried enough. Do not make me bury you." on a
// broken jug). Now:
//   - an inner voice speaks only on a scene with a check, at 14 or older, and only the part of you that the check
//     tests (a thought you hold speaks only when the check tests what it changes); the trait voices (Nerve, Dread,
//     Pride ...) only on a fight or a talk with a check;
//   - a line that names a thing (a fever, a baby, the law, his hands, the dice, the grain) speaks only when the scene
//     has that thing in it, and a line about "him" only when there is a him;
//   - counsel only on the choices that are big as 9999's README promised (war, an office, life, liberty, a marriage,
//     a post, the realm, 100 suns or more), not on every once-a-life scene or every duty; never under 15;
//   - at most one such line on a card: one counsellor, and no inner voice on a card that has counsel or a memory.
// Pure: what speaks is read from the scene, the player and the view, never from A.rand.
(function () {
  const ID = A.ID, ADV = A.ADV;
  const C2 = A.V2C = A.V2C || {};
  const sceneText = (q, v, e) => {
    let t = `${(v && v.title) || ''} ${(v && typeof v.text === 'string') ? v.text : ''}`;
    if (e) for (const c of e.choices || []) if (c && typeof c.t === 'string') t += ' ' + c.t;
    return t;
  };
  const checksOf = e => (e && e.choices || []).map(c => c && c.check && typeof c.check.s === 'string' ? c.check.s : c && c.check && c.check.fight ? 'melee' : null).filter(Boolean)
    .concat((e && e.choices || []).map(c => c && c.check && typeof c.check.s2 === 'string' ? c.check.s2 : null).filter(Boolean));

  // ---- what a line names, and what the scene must have for it ----------------------------------------------------------
  // [what the line says, what the scene must say]
  C2.REF = [
    [/\bfever|\bsick|pale gums|willow bark/i, /\b(fever|sick|ill|illness|plague|pox|cough|wound|herb|healer|physician)/i],
    [/\bbaby\b/i, /\b(baby|babe|infant|born|birth|pregnan|with child|lying-in)/i],
    [/\broof\b/i, /\b(roof|thatch|house|cottage|home|storm)\b/i],
    [/\blaw\b|\bclause\b/i, /\b(law|laws|court|judge|reeve|bailiff|charter|clause|magistrate|sentence|trial)\b/i],
    [/scripture|older copies|\bmonks\b/i, /\b(scripture|book|books|priest|temple|monk|abbey|faith|prayer|holy)\b/i],
    [/\bboots?\b/i, /\b(boot|boots|road|walk|walked|travel|traveller|pilgrim|stranger)\b/i],
    [/\bhis hands\b|\btheir trade\b/i, /\b(he|him|his|man|stranger|trade|craft)\b/i],
    [/\bdice\b|\bhouse\b(?! of)/i, /\b(dice|gamble|gambling|wager|bet|game|house)\b/i],
    [/\bgrain\b|\bsacks\b|\bthird field\b|\bsoil\b|\bdrainage\b|\brust\b/i, /\b(grain|harvest|barley|wheat|oats|rye|field|fields|farm|crop|crops|soil|plough|blight|famine|mill)\b/i],
    [/\biron\b|quenched/i, /\b(iron|blade|sword|smith|forge|tool|tools|knife|axe|steel)\b/i],
    [/\bwool\b|\bdye\b/i, /\b(wool|cloth|weave|weaver|dye|fleece|sheep|market)\b/i],
    [/\bcargo\b/i, /\b(cargo|ship|goods|wagon|caravan|trade|merchant)\b/i],
    [/\btide\b|\bdeck\b|\brail\b|\bgulls\b|\bsailors?\b|\bland always\b/i, /\b(sea|ship|boat|tide|harbou?r|sail|sailor|deck|shore|coast|fish)/i],
    [/\bwedding\b/i, /\b(wedding|wed|marry|marriage|bride|betroth)/i],
    [/\bmother\b/i, /\bmother\b/i],
    [/\bfather\b/i, /\bfather\b/i],
    [/\bgrandmother\b/i, /\b(grandmother|remedy|remedies|herb|sick)/i],
    [/\bchildren\b|\bthe children\b/i, /\b(child|children|son|daughter|boy|girl|family)\b/i],
    [/\bpriests?\b|\brelic\b/i, /\b(priest|priests|temple|shrine|relic|church|chapel|pilgrim|faith)\b/i],
    [/\bsteward\b/i, /\b(steward|lord|lady|court|hall|castle|manor)\b/i],
    [/\btreasury\b|\brobes\b/i, /\b(treasury|crown|court|tax|taxes|council|throne)\b/i],
    [/\briver\b/i, /\b(river|ford|bridge|stream|flood)\b/i],
    [/\bdoe\b|\bslot\b|\bthe beast\b|\btrack is\b|\bthat track\b/i, /\b(deer|doe|hunt|hunting|track|tracks|beast|wolf|boar|forest|wood|woods|game)\b/i],
    [/\bsmoke\b|\bcamped\b/i, /\b(camp|smoke|fire|woods?|forest|road|outlaw|bandit)/i],
    [/\brain\b|\bswallows\b/i, /\b(rain|weather|storm|sky|cloud|harvest|field|road|journey)\b/i],
    [/\bmoss\b|walking in circles/i, /\b(lost|forest|woods?|path|trail|mist)\b/i],
    [/\btable\b|\beating\b|\bbless the bread\b|\bhungry\b|\bfeeding\b/i, /\b(table|feast|meal|supper|dinner|eat|eating|bread|hungry|hunger|food|kitchen)\b/i],
    [/\bseat\b/i, /\b(seat|council|court|throne|office|hall)\b/i],
    [/\bcouncil\b/i, /\b(council|court|lords|parliament|moot)\b/i],
    [/\binheritance\b/i, /\b(inherit|inheritance|will|estate|dying|death|heir)\b/i],
    [/\byew\b|\bforty paces\b|\bloose\b/i, /\b(bow|bows|arrow|arrows|archer|shoot|shot|target|butts)\b/i],
    [/\bbread first\b|\bcarts\b|march on/i, /\b(march|army|host|camp|supply|supplies|siege|company|levy|soldiers?)\b/i],
    [/\bgreen levies\b|\breserve\b|\bhigh ground\b|river at your back/i, /\b(battle|army|host|enemy|levy|levies|siege|field|soldiers?|war)\b/i],
    [/\bshoulder\b|\bswings?\b|\bguards his face\b|\bgrip\b|\bground slopes\b|\bsun behind you\b|\bwet deck\b/i, /\b(fight|fights|brawl|duel|blow|blows|swing|blade|sword|knife|fists?|axe|spear|bout|attack|ambush|thief|wolf)\b/i],
    [/\bdoors?\b.*\bmen by the doors\b|\bbow a hair\b/i, /\b(court|hall|lord|lady|king|queen|castle|feast)\b/i],
    [/\bring\b/i, /\bring\b/i],
    [/\bin writing\b/i, /\b(offer|deal|contract|bargain|price|sell|buy|loan|debt)\b/i],
  ];
  const HE = /^(He|His|Him)\b|\b(he|him|his)\b/, SHE = /\b(She|she|her|Her)\b/;
  C2.lineFits = function (line, text) {
    const l = String(line || ''), t = String(text || '');
    for (const [lr, sr] of C2.REF) if (lr.test(l) && !sr.test(t)) return false;
    if (HE.test(l) && !/\b(he|him|his|man|men|boy|lad|father|brother|son|husband|lord|king|master)\b/i.test(t)) return false;
    if (SHE.test(l) && !/\b(she|her|woman|girl|mother|sister|daughter|wife|lady|queen|mistress)\b/i.test(t)) return false;
    return true;
  };
  const TRAITV = new Set(['nerve', 'dread', 'pride', 'mercy', 'hunger', 'temper']);
  const woven = q => !!(q && q.ctx && q.ctx.mw && !q.ctx.mw.off && q.ctx.mw.ev === q.ev);
  C2.voiceFits = function (pc, q, vo) {
    if (!pc || !q || !vo) return false;
    const e = A.EV[q.ev], v = q.view || {};
    if (!e || A.age(pc) < 14) return false;
    if (v.adv && v.adv.length) return false;               // one extra line a card: the counsel speaks
    if (woven(q)) return false;                             // ... or the memory does
    if (v.recall) return false;                             // ... or the world's record (57-world-chronicle)
    const sk = checksOf(e);
    if (!sk.length) return false;                           // no stakes, no voice
    if (vo.thought) {
      const th = ID.THOUGHTS && ID.THOUGHTS[vo.thought];
      if (!th || !sk.some(s => (th.gain && s in th.gain) || (th.cost && s in th.cost))) return false;
    } else if (TRAITV.has(vo.key)) {
      if (vo.kind !== 'fight' && vo.kind !== 'talk') return false;
    } else {
      const V = ID.VOICES[vo.key];
      if (!V || !sk.some(s => (V.skills || []).includes(s))) return false;
    }
    return C2.lineFits(vo.line, sceneText(q, v, e));
  };
  if (ID && typeof ID.voiceCore === 'function') {
    const core0 = ID.voiceCore;
    // both the card and A.eventChoose (which remembers the line heard) ask through ID.voiceCore, so they agree
    ID.voiceCore = function (pc, q) {
      const vo = core0.apply(this, arguments);
      try { return vo && C2.voiceFits(pc, q, vo) ? vo : null; } catch (err) { return null; }
    };
  }

  // ---- counsel on the big choices only, one voice ----------------------------------------------------------------------
  if (ADV && Array.isArray(ADV.big)) {
    const COND = /(?<![!])(?:C\.ruler\(|C\.atWar\(|C\.office\(|C\.holds\(|myRealm\(|C\.claim|C\.sworn\(|C\.faction\()/;   // (not "!C.ruler(p)")
    const KEYS = 'warOn|claim|pact|ally|die|prison|spouse|marry|betroth|wedding|asset|promote|treasury|legit|realmStab|stability|authority|job|poBill|poOff|poVote|poCrown|poMuster|sworn|exile|realmRel';
    const FX = new RegExp(`"(?:${KEYS})"\\s*:|\\b(?:${KEYS})\\s*:|\\b(?:pcDeath|imprison|startWar)\\(`);   // (a bout or a spar is not big; a lethal fight is, below)
    const cache = new Map();
    C2.bigScene = function (e) {
      if (!e || !e.id) return false;
      if (cache.has(e.id)) return cache.get(e.id);
      let b = false;
      if (!/^(adv|cf)_/.test(e.id) && (e.choices || []).length >= 2) {
        let cs = '', ch = '';
        try { cs = e.cond ? String(e.cond) : ''; } catch (err) { cs = ''; }
        try { ch = JSON.stringify(e.choices, (k, x) => (k === 'r' || k === 't' ? undefined : typeof x === 'function' ? String(x) : x)); } catch (err) { ch = ''; }
        b = COND.test(cs) || FX.test(ch) || /"coin"\s*:\s*-\s*\d{3,}/.test(ch) || /"health"\s*:\s*-\s*(?:[2-9]\d|\d{3,})/.test(ch) || /"lethal"\s*:\s*true/.test(ch) || /^(po|ri|co|cb)_/.test(e.id);
      }
      cache.set(e.id, b);
      return b;
    };
    ADV.big.push((e, q, pc) => {
      if (!e) return false;
      if (pc && A.age(pc) < 15) return false;
      if (e.big === true || e.big === false) return e.big;
      return C2.bigScene(e);
    });
    if (typeof ADV.counselFor === 'function') {
      const counsel0 = ADV.counselFor;
      ADV.counselFor = function () {
        const out = counsel0.apply(this, arguments);
        return Array.isArray(out) && out.length ? out.slice(0, 1) : out;
      };
    }
  }
})();
