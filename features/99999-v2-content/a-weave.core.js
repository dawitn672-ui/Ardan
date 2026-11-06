// 99999-v2-content, part 1: the memory insert (67-memory-weave) only when it truly bears on the scene (playtest 1, #9).
//
// The playtest found the insert on about half of all cards, often wrong: "In 1106 you tried to walk, and failed. You
// have not forgotten it, and it makes you slow." on a knife fight at 12 (a check of the same stat, from infancy), and
// "you tried to spy while you are there" (a label in the present tense, put in the past). Now:
//   - a memory is only cited when it is about the same person, the same scene, the same kind of place, or the same
//     kind of act: a check of the same skill in the same kind of scene (67's skill rule allowed any scene);
//   - a memory with a person must have weighed: a real change of regard, or something that lasted (hurt, law, loss ...);
//   - nothing from before the age of MIN_AGE is remembered, so no infancy milestone;
//   - a deed that does not read as a past deed ("... while you are there", "... before you pay", "... she says") or
//     needs the scene's title to say what "it" was, is never cited;
//   - at most one memory in GAP cards: the count of cards is kept on the record (pc.mw.n, pc.mw.lw), written by the
//     engine when a choice is made, never when a card is drawn.
// Engine side only: everything here runs in an event's setup or in A.eventChoose.
(function () {
  const MW = A.MW;
  if (!MW || !MW.rules) return;
  MW.GAP = 10;          // cards between two memories: under 1 card in 8
  MW.MIN_AGE = 7;       // nothing remembered from before this age
  MW.PERSON_OP = 8;     // a change of regard this large makes a memory of a person worth citing
  const words = s => (String(s || '').match(/\S+/g) || []).length;
  const LASTING = ['law', 'kill', 'hurt', 'loss', 'gain', 'shame', 'name'];

  // a deed that reads as a past deed: no second clause in the present ("while you are there", "before you pay",
  // "every name she says", "that it is a good law", "the question that keeps you awake")
  const BASE = 'are|am|is|be|pay|sign|go|do|have|want|need|know|keep|say|can|will|must|get|make|take|see|come|give|ask|tell|think|try|stay|leave|find|hold|buy|sell|win|lose|fight|wait|walk|run|read|write|speak|look|help|owe|mean|like|love|hate|live|die|work|eat|drink|sleep|play|learn|wish|hope|own|stand|sit';
  const PRESENT = new RegExp(`\\b(?:you|we|they|i)\\s+(?:${BASE})\\b|\\b(?:he|she|it|that|who|which|this)\\s+(?:is|are|has|does|says|keeps|wants|needs|knows|thinks|goes|comes|lives|owns|holds|means|stands|can|will|must)\\b|\\b(?:is|are|am)\\b|\\b\\w+'(?:s|re|ll|ve)\\s+(?:not\\s+)?\\w+ing\\b|\\byou're\\b`, 'i');
  // ... and a third person's verb in the present ("you tried to wait until she sleeps", playtest 2 old #9; "until he
  // goes", "the debt she owes"): he, she or it, then a word in -s that is not "was" or an adverb
  const PRESENT3 = /\b(?:he|she|it)\s+(?!was\b|always\b|perhaps\b|thus\b|less\b|unless\b|towards?\b)[a-z]{2,}s\b/i;
  MW.pastDeed = d => {
    const s = String(d || '').replace(/^you\s+/i, '');
    return !!s && !PRESENT.test(s) && !PRESENT3.test(s);
  };
  const born = p => (p && typeof p.born === 'number' ? p.born : null);
  const grownAt = (p, y) => born(p) == null || y - born(p) >= MW.MIN_AGE;
  // the deed must say enough by itself: 67 put the scene's title in brackets after a bare "it" ("(the ford)")
  const deedOk = d => typeof d === 'string' && words(d) >= 4 && !MW.BARE_OBJ.test(d) && MW.pastDeed(d) && !/[:;]/.test(d);
  MW.lineFits = (p, m) => !!m && grownAt(p, m.y) && deedOk(m.d);
  // the same rules for a deed another feature quotes (55-bonds' "Between you", 21-npc-initiative's "You both
  // remember"): a past deed of three words or more, from 7 on, that says enough without a title before a colon
  MW.grownAt = grownAt;
  MW.deedReads = d => typeof d === 'string' && words(d) >= 3 && MW.pastDeed(d.replace(/\s*\([^)]*\)\s*$/, '')) && !/[:;?]/.test(d);

  // the record as the rules read it: only lines fit to be cited
  const lines0 = MW.lines;
  MW.lines = pc => lines0(pc).filter(m => MW.lineFits(pc, m));
  const last0 = MW.lastOf;
  MW.lastOf = (pc, id) => { const L = last0(pc, id); return L && grownAt(pc, L[0]) && deedOk(L[3]) ? L : null; };
  const lineOf = (p, ref) => (ref ? lines0(p).find(x => x.y === ref[0] && x.e === ref[1] && x.c === ref[2]) : null);

  // a sum that cannot be the scene's own ("it cost you 225,000 suns" for a scutage: the record caught a legacy or a
  // wage in the same step) is not quoted
  MW.COIN_MAX = 2000;
  const tail0 = MW.tail;
  MW.tail = function (m, bad) {
    if (m && Math.abs(+m.n || 0) > MW.COIN_MAX && (m.k || []).some(k => k === 'loss' || k === 'gain')) {
      const k = (m.k || []).filter(x => x !== 'loss' && x !== 'gain');
      return tail0.call(this, Object.assign({}, m, { k, n: 0 }), bad);
    }
    return tail0.apply(this, arguments);
  };
  const R = MW.rules;
  // "Isobel keeps in mind that you asked to court Isobel": a deed that names its own person twice is not cited
  const twice = (s, t) => {
    if (!t || typeof s !== 'string') return false;
    const nm = String(t.given || '');
    return !!nm && s.split(nm).length > 2;
  };
  // person: a memory that weighed (a real change of regard, or something that lasted); 55-bonds' own history line
  // (no ref) is checked by the same deed rules
  const person0 = R.person;
  R.person = function (p, ctx, e, now) {
    const w = person0.apply(this, arguments);
    if (!w) return null;
    if (twice(w.long, A.P(ctx.pid))) return null;
    if (w.ref) {
      const m = lineOf(p, w.ref);
      if (!m || !(Math.abs(m.o || 0) >= MW.PERSON_OP || (m.k || []).some(k => LASTING.includes(k)))) return null;
      return w;
    }
    const H = p.rel && ctx.pid && p.rel[ctx.pid] && Array.isArray(p.rel[ctx.pid].hist) ? p.rel[ctx.pid].hist : [];
    const x = H.find(h => h && h.y === w.y && typeof h.d === 'string' && /^you /.test(h.d) && Math.abs(h.w || 0) >= 6);
    return x && grownAt(p, x.y) && deedOk(x.d) ? w : null;
  };
  // skill: the same skill in the same kind of scene (the same kind of act), not any check of the same stat
  const skill0 = R.skill;
  R.skill = function (p, ctx, e, now) {
    const w = skill0.apply(this, arguments);
    if (!w) return null;
    const sh = MW.shapeOf(e), m = lineOf(p, w.ref);
    return sh && m && m.sh === sh ? w : null;
  };

  // one memory in GAP cards
  const weave0 = MW.weave;
  MW.weave = function (p, ctx, e) {
    if (!ctx || !e || (ctx.mw && ctx.mw.ev === e.id) || !MW.ON || ctx.skip || !MW.isPc(p) || !p.mw) return weave0.apply(this, arguments);
    const n = +p.mw.n || 0, lw = p.mw.lw;
    if (typeof lw === 'number' && n - lw < MW.GAP) { if (ctx.mw !== undefined) delete ctx.mw; return null; }
    const w = weave0.apply(this, arguments);
    if (w) p.mw.lw = n;
    return w;
  };
  // the count of cards: one each time a scene's choice is made (an engine command; replays make the same choices)
  const choose0 = A.eventChoose;
  A.eventChoose = function () {
    const q = A.S && A.S.queue[0], pc = A.pc(), fresh = !!(q && q.type === 'event' && !q.result && pc);
    const r = choose0.apply(this, arguments);
    try { if (fresh && q.result && pc.mw && typeof pc.mw === 'object') pc.mw.n = (+pc.mw.n || 0) + 1; } catch (err) {}
    return r;
  };
  for (const k of Object.keys(choose0)) A.eventChoose[k] = choose0[k];
})();
