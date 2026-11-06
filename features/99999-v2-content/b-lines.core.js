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
    if (v.bdAside) return false;                            // ... or what passed between you (55-bonds, below)
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
      ADV.counselFor = function (pc, q) {
        // one extra line a card: a memory woven into the scene's text (67-memory-weave, set in the scene's setup,
        // before the view) speaks, and counsel keeps its peace (CI run 88: a memory and counsel together on a muster)
        if (woven(q)) return null;
        const out = counsel0.apply(this, arguments);
        if (!Array.isArray(out) || !out.length) return out;
        const one = out.slice(0, 1);
        try { one[0] = C2.counselWords(pc, q, arguments[2], one[0]); } catch (err) {}
        return one;
      };
    }
    // the words fit the matter (playtest 2, old #10: "Your name in the trade is your fortune" on raiders, "Good work
    // speaks louder than a good speech" on hiring a killer). Who speaks and which way they lean stay as 9999 chose; a
    // line of the trade (craft) is for a matter of work, a builder's line (works) for work, money or the court, and a
    // line that names a thing (C2.REF) needs that thing in the scene. A line that does not fit gives way to a plain one.
    const PLAIN = ['I have weighed it. This is the better way.', 'This one, I think. The rest only look easier.', 'Think it through. Then choose this.'];
    const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const linesOf = want => [].concat((ADV.LINES.want || {})[want] || [], ((ADV.LINES.byGroup || {}).work || {})[want] || []);
    C2.counselFits = function (line, dom, text) {
      if (linesOf('craft').includes(line) && dom !== 'work') return false;
      if (linesOf('works').includes(line) && !['work', 'money', 'court'].includes(dom)) return false;
      return C2.lineFits(line, text);
    };
    C2.counselWords = function (pc, q, v, o) {
      const e = q && A.EV[q.ev];
      if (!o || typeof o.l !== 'string' || !e || !v) return o;
      const dom = ADV.domOf ? ADV.domOf(q, v, e) : 'any';
      if (C2.counselFits(o.l, dom, sceneText(q, v, e))) return o;
      const pool = (ADV.ROLE_GROUP && ADV.ROLE_GROUP[o.r] === 'work' && Array.isArray(ADV.LINES.workOff) && dom !== 'work' ? ADV.LINES.workOff : (ADV.LINES.sense && ADV.LINES.sense[dom]) || PLAIN)
        .filter(l => C2.counselFits(l, dom, sceneText(q, v, e)));
      const L = pool.length ? pool : PLAIN;
      return Object.assign({}, o, { l: L[hash(`${q.ev}|${o.id}|${A.S.year}|fit`) % L.length] });
    };
  }

  // ---- what passed between you: 55-bonds' "Between you" and 21-npc-initiative's "You both remember" ---------------------
  // Playtest 2 (old #9, new #13): 18% of cards carried a personal line besides the scene's own text, and some were garbled
  // or from the wrong side: "Between you: 1126, you applied and dazzle them in the disputation", "You both remember 1118:
  // an ordinary person: you told Maren it is hopeless", "Between you: 1119, you asked what the debt is". Now:
  //   - the line is chosen once, when the scene is drawn up (A.eventView, an engine step, as 57's recalled line), and
  //     kept on the view (v.bdAside), so the card, the choice and a replay see the same;
  //   - it shares the memory insert's spacing (a-weave: MW.GAP cards between two, pc.mw.lw), so a memory, a "Between
  //     you" line and a "You both remember" line together come under one card in MW.GAP;
  //   - it is one extra line: none on a card with counsel, a woven memory or a scene that already quotes the past; the
  //     world's recalled line gives way to it, and the inner voice does;
  //   - the deed must read as a past deed of its own (MW.deedReads: no "is", no "she sleeps", no "title: deed"), from
  //     the age of 7 on, and must not name the person it is said to.
  const MW = A.MW, BD = A.BONDS, NI = A.NPCI;
  // (a life with no record of cards, pc.mw, from a build or a save without 67-memory-weave, is not spaced)
  const gapOk = pc => !!pc && !(pc.mw && typeof pc.mw === 'object' && typeof pc.mw.lw === 'number' && (+pc.mw.n || 0) - pc.mw.lw < ((MW && MW.GAP) || 10));
  const spend = pc => { if (pc.mw && typeof pc.mw === 'object') pc.mw.lw = +pc.mw.n || 0; };
  C2.deedFor = function (pc, t, y, d) {
    if (typeof d !== 'string' || !MW || typeof MW.deedReads !== 'function') return false;
    if (MW.grownAt && !MW.grownAt(pc, y)) return false;
    if (t && t.given && String(t.given).length > 2 && d.includes(t.given)) return false;
    return MW.deedReads(d);
  };
  if (BD && typeof BD.aside === 'function' && typeof BD.deedLine === 'function') {
    const aside0 = BD.aside;
    C2.asideFor = function (pc, t, v) {
      const line = aside0(pc, t, v);
      if (!line) return '';
      const e = BD.cite(pc, t, { min: BD.CITE });
      return e && C2.deedFor(pc, t, e.y, BD.deedLine(e)) ? line : '';
    };
    // the card shows the line the view kept, and only that
    BD.aside = (pc, t, v) => (v && typeof v.bdAside === 'string' ? v.bdAside : '');
    const view1 = A.eventView;
    A.eventView = function (q) {
      const fresh = !!q && q.type === 'event' && !q.view;
      const v = view1.apply(this, arguments);
      try {
        if (fresh && v && !v.skip && q.view === v && !q.result) {
          const pc = A.pc(), pid = q.ctx && q.ctx.pid, t = pid && A.P(pid);
          if (pc && t && t.id !== pc.id && pc.rel && pc.rel[t.id] && gapOk(pc) && !(v.adv && v.adv.length) && !woven(q) && !BD.citesInText(q, v)) {
            const line = C2.asideFor(pc, t, v);
            if (line) {
              v.bdAside = line; spend(pc);
              if (v.recall) { delete v.recall; delete v.recallId; }
            }
          }
        }
      } catch (err) { console.error('v2 content aside', err); }
      return v;
    };
  }
  if (NI && typeof NI.pastLine === 'function' && typeof NI.histOf === 'function') {
    const TRIVIAL = /^(you spent a day together|a long talk|you trained together|you sparred|you asked (his|her) advice)$/i;
    const low = s => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
    // "An ordinary person: you told Maren ..." is a title and a deed; "Can you help? You helped" a question and a deed
    C2.histDeed = e => {
      if (!e || typeof e.t !== 'string') return '';
      if (typeof e.d === 'string' && e.d) return e.d;
      const m = /^[^:?!]{2,60}[:?!]\s+((?:you|she|he)\b.*)$/i.exec(e.t);
      return low(m ? m[1] : e.t).replace(/[.!?]$/, '');
    };
    // called from the scene's setup (an engine step): it spends the spacing when it speaks
    NI.pastLine = function (pc, t) {
      if (!gapOk(pc)) return '';
      const h = NI.histOf(pc, t).filter(e => e && e.y < A.S.year && typeof e.t === 'string' && !TRIVIAL.test(e.t));
      for (let i = h.length - 1; i >= 0; i--) {
        const d = C2.histDeed(h[i]);
        if (C2.deedFor(pc, t, h[i].y, d)) { spend(pc); return ` You both remember ${h[i].y}: ${d}.`; }
      }
      return '';
    };
  }

  // ---- token grammar (playtest 2, new #19) --------------------------------------------------------------------------------
  // A token filled with its own article after one the text already has: "Keep the a slingshot", "of the the Lantern
  // Company", "of the The Greyfeathers". When a word that takes a noun ("the", "your", "his" ...) stands right before a
  // token whose value starts with an article, the value's article goes. The template is read, not the filled text, so a
  // sentence the writer wrote is never touched.
  const T0 = A.T;
  if (typeof T0 === 'function') {
    const DET = /\b(the|The|your|Your|his|His|her|Her|their|Their|my|My|our|Our)\s+\{(\w+)\}/g;
    C2.tidyTemplate = function (str, ctx) {
      if (typeof str !== 'string' || str.indexOf('{') < 0 || !ctx || typeof ctx !== 'object') return str;
      return str.replace(DET, (m, det, k) => {
        let x;
        try { x = ctx[k]; } catch (err) { return m; }
        if (typeof x !== 'string' || !/^(?:a|an|the|The)\s+\S/.test(x)) return m;
        return `${det} ${x.replace(/^(?:a|an|the|The)\s+/, '')}`;
      });
    };
    A.T = function (str, ctx) {
      if (typeof str === 'string' && str.indexOf('{') >= 0 && ctx && typeof ctx === 'object') {
        try { arguments[0] = C2.tidyTemplate(str, ctx); } catch (err) {}
      }
      return T0.apply(this, arguments);
    };
  }
})();
