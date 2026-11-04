// 9998-stakes, part 1: what a choice stakes, read from the choice as written, and the registry other screens add to.
//
// The design review (cycle 2, item 2) found the deep screens hiding their stakes: "Strip the dead for loot 94%" looks
// free, and the bills, oaths and road rows say nothing. Event choices already showed two things: 97-life-fixes' line
// (a coin cost, "If it fails: ...") and 92-scene-card's hints (at most two plain effects, object fx only, no checks).
// This reads every choice the same way, in one grammar of short chips:
//   gain   ▲ honour            a sure change for the better (no check)
//   cost   Costs 30 suns, ▼ honour, a wound    a sure change for the worse
//   win    If it works: ▲ renown              what a check brings when it succeeds
//   risk   If it fails: hurt, −5 suns         what it costs when it fails (97's words); "nothing lost" when nothing
//   touch  • coin                              an effect written as code: what it touches, never which way (Reigns)
// Large changes carry a double mark (▲▲), as Reigns' large dots. Hidden things stay hidden: flags, queued events,
// secrets, traits, deeds and the like are never shown, and a function effect shows only the families it touches.
//
// The reading is pure: it looks at the written choice and, for a locked choice's reason, the player and the scene's
// context; it never draws a number and never writes the state.
//
// The hook (A.STAKES), for the screens other lanes own (bills, oaths, the road, battle moves):
//   A.STAKES.add(kind, fn)      fn returns chips [{ k: 'gain'|'cost'|'win'|'risk'|'touch'|'note', t: 'text', big?, tip? }]
//                               kind 'choice' is an event choice: fn(c, e, q, pc, vc) adds to its chips;
//                               any other kind is a data-a action: fn(v, pc, el) gives the chips for <button data-a=kind data-v=v>
//   A.STAKES.why(kind, fn)      fn(v, pc, el) gives the reason a disabled <button data-a=kind> is out of reach
//   A.STAKES.fx(fx)             the chips an effect object (or function) reads as: the same grammar, for any screen
//   A.STAKES.html(chips)        the chips as markup, escaped
(function () {
  const ST = A.STAKES = A.STAKES || {};
  ST.OFF = false;
  ST.on = () => !ST.OFF && !(UI.set && UI.set.stakes === false);
  ST.reg = ST.reg || {};      // kind -> [fn]
  ST.whyReg = ST.whyReg || {};
  ST.add = function (kind, fn) { if (typeof fn === 'function') (ST.reg[kind] = ST.reg[kind] || []).push(fn); return ST; };
  ST.why = function (kind, fn) {
    if (typeof fn !== 'function') return ST;
    (ST.whyReg[kind] = ST.whyReg[kind] || []).push(fn);
    return ST;
  };
  // the chips the registry gives a kind (each fn guarded: a broken adder never breaks a screen)
  ST.run = function (kind, ...args) {
    const out = [];
    for (const f of ST.reg[kind] || []) {
      try { const r = f(...args); if (Array.isArray(r)) for (const c of r) if (c && c.t) out.push(c); } catch (e) { console.error('stakes ' + kind, e); }
    }
    return out;
  };
  ST.reason = function (kind, ...args) {
    for (const f of ST.whyReg[kind] || []) { try { const r = f(...args); if (r) return String(r); } catch (e) { console.error('stakes why ' + kind, e); } }
    return '';
  };

  const num = (o, k) => (o && typeof o === 'object' && typeof o[k] === 'number' && isFinite(o[k]) ? o[k] : 0);
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const src = f => (typeof f === 'function' ? String(f) : '');
  const s0 = src;

  // ---- the families: what a key of fx changes, in a word, and when the change is large ----------------------------
  // [key, word, large at, sense (+1: more is better; -1: more is worse), order (lower shows first)]
  ST.KEYS = [
    ['die', 'death', 1, -1, 0], ['prison', 'prison', 1, -1, 1], ['wound', 'a wound', 1, -1, 2], ['punish', 'punishment', 1, -1, 3],
    ['free', 'freedom', 1, 1, 4],
    ['health', 'health', 10, 1, 10], ['coinPct', 'coin', 20, 1, 12],
    ['them', 'their regard', 20, 1, 14], ['newRel', 'a new bond', 1, 1, 15], ['lover', 'a lover', 1, 1, 15],
    ['honor', 'honour', 5, 1, 20], ['fame', 'renown', 5, 1, 21], ['infamy', 'infamy', 5, -1, 22], ['piety', 'piety', 5, 1, 23],
    ['rep', 'your name', 5, 1, 24],
    ['merit', 'standing', 50, 1, 25], ['perf', 'standing', 10, 1, 25], ['bossOp', 'standing', 15, 1, 25], ['favor', 'favour at court', 10, 1, 25],
    ['patronOp', 'your patron', 15, 1, 26], ['rulerOp', 'the ruler\'s regard', 15, 1, 26], ['houseOp', 'your house', 15, 1, 26],
    ['authority', 'authority', 5, 1, 27], ['legit', 'legitimacy', 5, 1, 27], ['stability', 'stability', 5, 1, 28], ['realmStab', 'stability', 5, 1, 28],
    ['treasury', 'the treasury', 500, 1, 29], ['realmGold', 'the treasury', 500, 1, 29], ['realmRel', 'relations', 10, 1, 30], ['armyXp', 'the army', 10, 1, 31],
    ['happy', 'spirits', 8, 1, 40], ['looks', 'looks', 3, 1, 45],
    ['promote', 'rank', 1, 1, 18], ['job', 'a new post', 1, 1, 18], ['literate', 'letters', 1, 1, 46], ['lang', 'a tongue', 1, 1, 46],
  ];
  const KEY = {}; for (const r of ST.KEYS) KEY[r[0]] = { k: r[0], w: r[1], big: r[2], sense: r[3], o: r[4] };
  ST.KEY = KEY;
  const STATS = () => GD.STATS || ['str', 'spd', 'ins', 'sta', 'int', 'wil'];
  const statWord = k => String((GD.STAT_NAMES && GD.STAT_NAMES[k]) || k).toLowerCase();
  const skillWord = k => String((GD.SKILLS && GD.SKILLS[k]) || k).split(/[:&,(]/)[0].trim();
  ST.skillWord = skillWord;

  // A function effect's families, read once from its source (the way 89 reads a fight): what it touches, never which
  // way. Only what the player could see on the result anyway; flags, events and secrets are not families.
  const FN_RX = [
    ['die', /\bdie\s*:|pcDeath\(/], ['prison', /\bprison\s*:|imprison\(/], ['wound', /\bwound\s*:|addWound\(/],
    ['coin', /\bcoin\s*:|\.coin\s*[-+]=|coinPct\s*:|\b(?:pay|gain|earn|spend)\(\s*p\b/], ['health', /\bhealth\s*:|\.health\s*[-+]=|\bhp\(\s*p\b/],
    ['them', /\bthem\s*:\s*\{[^}]*\bop\b|\.op\s*[-+]=|\bop\s*:\s*-?\d/], ['honor', /\bhonor\s*:|\.honor\s*[-+]=|\bhon\(\s*p\b/],
    ['fame', /\bfame\s*:|\.fame\s*[-+]=/], ['piety', /\bpiety\s*:|\.piety\s*[-+]=/], ['happy', /\bhappy\s*:|\.happy\s*[-+]=/],
    ['treasury', /\btreasury\s*:|\.treasury\s*[-+]=/], ['stability', /\bstability\s*:|\.stability\s*[-+]=/],
    ['armyXp', /\.army\s*[-+]=|\barmyXp\s*:/], ['realmRel', /\baddRel\(|\brealmRel\s*:/], ['merit', /\.merit\s*[-+]=|\bmerit\s*:/],
    ['regard', /\baddOp\(|\bbump\(\s*p\b/], ['wil', /\bwillGrow\(/], ['fight', /\bstartDuel(?:Front)?\(|\bbeast\s*:\s*\{|\bduel\s*:/],
  ];
  const fnCache = new WeakMap();
  ST.fnFamilies = function (fx) {
    if (typeof fx !== 'function') return [];
    if (fnCache.has(fx)) return fnCache.get(fx);
    const s = src(fx), out = [];
    for (const [k, rx] of FN_RX) if (rx.test(s)) out.push(k);
    fnCache.set(fx, out);
    return out;
  };

  // ---- an effect as chips ------------------------------------------------------------------------------------------
  // fx: an object or a function. Returns { up: [...], down: [...], touch: [...], coin: n (a coin cost, positive) }
  // each part { k, w, big, o }. Pure, and cached per effect object.
  const fxCache = new WeakMap();
  ST.read = function (fx) {
    const R = { up: [], down: [], touch: [], coin: 0, gainCoin: 0 };
    if (!fx || (typeof fx !== 'object' && typeof fx !== 'function')) return R;
    if (fxCache.has(fx)) return fxCache.get(fx);
    const put = (arr, k, w, big, o) => { if (!arr.some(x => x.w === w)) arr.push({ k, w, big: !!big, o }); };
    if (typeof fx === 'function') {
      const c = A.LF && A.LF.coinCost ? A.LF.coinCost(fx) : 0;
      if (c) R.coin = c;
      const trained = [...new Set([...s0(fx).matchAll(/\btrainSkill\(\s*\w+\s*,\s*["'](\w+)["']/g)].map(m => m[1]).filter(k => GD.SKILLS && GD.SKILLS[k]))];
      if (trained.length) put(R.up, 'grow', trained.slice(0, 2).map(skillWord).join(', '), false, 35);
      for (const k of ST.fnFamilies(fx)) {
        const d = KEY[k] || { w: k === 'coin' ? 'coin' : k === 'regard' ? 'regard' : k === 'wil' ? 'willpower' : k, o: k === 'regard' ? 14 : k === 'wil' ? 36 : 11 };
        if (k === 'coin' && c) continue;
        if (k === 'fight') { R.fight = true; continue; }
        if (k === 'die' || k === 'prison' || k === 'wound') put(R.touch, k, 'risk of ' + d.w, false, d.o);
        else put(R.touch, k, d.w, false, d.o);
      }
    } else {
      const v = num(fx, 'coin');
      if (v < 0) R.coin = -v;
      else if (v > 0) R.gainCoin = v;
      if (fx.duel || fx.beast) R.fight = true;
      // 35-moods' four needs, as the profile names them ("How you are")
      if (fx.need && typeof fx.need === 'object') for (const k of ['rest', 'company', 'purpose', 'comfort']) { const n = num(fx.need, k); if (n) put(n > 0 ? R.up : R.down, 'need', k, Math.abs(n) >= 15, 41); }
      for (const k in fx) {
        const d = KEY[k];
        if (!d) continue;
        let n;
        // their regard; a relation's new name alone (type, no op) is not shown: "cousin" for a cousin changes nothing
        if (k === 'them') { const t = fx.them; n = t && typeof t === 'object' ? num(t, 'op') : 0; }
        else if (typeof fx[k] === 'number') n = fx[k];
        else n = fx[k] ? 1 : 0;   // a flag-like key: die, prison, wound, newRel, job ... (true, an object or a string)
        if (!n) continue;
        if (k === 'job' || k === 'newRel' || k === 'lover' || k === 'promote' || k === 'free' || k === 'literate' || k === 'lang') { put(R.up, k, d.w, false, d.o); continue; }
        if (k === 'die' || k === 'prison' || k === 'wound' || k === 'punish') { put(R.down, k, d.w, false, d.o); continue; }
        const good = n * d.sense > 0;
        put(good ? R.up : R.down, k, d.w, Math.abs(n) >= d.big, d.o);
      }
      // stats and skills: one chip for each side, naming what grows ("▲ Persuasion, Tactics")
      const ups = [], downs = [];
      for (const s of STATS()) { const n = num(fx, s); if (n > 0) ups.push([statWord(s), n >= 2]); else if (n < 0) downs.push([statWord(s), n <= -2]); }
      if (fx.skill && typeof fx.skill === 'object') for (const k in fx.skill) { const n = num(fx.skill, k); if (n > 0) ups.push([skillWord(k), n >= 3]); else if (n < 0) downs.push([skillWord(k), n <= -3]); }
      if (ups.length) put(R.up, 'grow', ups.slice(0, 2).map(x => x[0]).join(', '), ups.some(x => x[1]), 35);
      if (downs.length) put(R.down, 'grow', downs.slice(0, 2).map(x => x[0]).join(', '), downs.some(x => x[1]), 35);
    }
    for (const a of [R.up, R.down, R.touch]) a.sort((x, y) => x.o - y.o);
    fxCache.set(fx, R);
    return R;
  };
  const mark = (p, up) => (up ? (p.big ? '▲▲' : '▲') : (p.big ? '▼▼' : '▼'));
  // a list of parts in words, for "If it works: ..." and "If it fails: ..."
  ST.words = function (R, side) {
    const out = [];
    if (side === 'fail') {
      // 97's own words where they apply ("hurt", "−5 suns", "their regard"): one grammar with the line players know
      for (const p of R.down) out.push(p.k === 'health' ? 'hurt' : p.k === 'happy' && (R.down.length > 1 || R.coin) ? null : p.k === 'coinPct' ? (R.coin ? null : 'some coin') : p.k === 'happy' ? 'your spirits' : p.w);
      if (R.coin) out.splice(Math.min(out.length, R.down.filter(p => p.o <= 10).length), 0, '−' + coin(R.coin));
      if (R.fight) out.unshift('a fight');
      for (const p of R.touch) out.push('• ' + p.w);
      return out.filter(Boolean);
    }
    for (const p of R.up) out.push(mark(p, true) + ' ' + p.w);
    if (R.gainCoin) out.unshift('+' + coin(R.gainCoin));
    if (R.fight) out.push('a fight');
    for (const p of R.touch) out.push('• ' + p.w);
    return out;
  };

  // ---- white and red checks ----------------------------------------------------------------------------------------
  // The rule (Disco Elysium's, kept to what the written event says):
  //   red    a check with no second chance: the event comes once in a life (once: true), the choice is once, or failing
  //          it costs something that lasts: death, prison, a wound, exile or disowning (lose.fx, read as written, or
  //          the same words in a function effect). A failed red check is not offered again.
  //   white  every other check. A failed white check is locked in that scene until your value in it (A.checkVal, the
  //          number the roll is made from) has risen 5; then it says so: "Again: you are better at this now (+7 since 1112)".
  // A fight (check.fight) is a check of its own kind and is red when it is lethal (48's rule), else white.
  const LASTING_RX = /\bdie\s*:|pcDeath\(|\bprison\s*:|imprison\(|\bwound\s*:|addWound\(|\bexile|\bdisown/;
  ST.RETRY_GAIN = 5;
  const lasting = fx => !!fx && (typeof fx === 'function' ? LASTING_RX.test(src(fx)) : !!(fx.die || fx.prison || fx.wound || fx.exile || fx.disown));
  ST.checkKind = function (c, e) {
    if (!c || typeof c !== 'object' || !(c.check || c.group)) return null;
    if ((e && e.once) || c.once) return 'red';
    if (c.lose && lasting(c.lose.fx)) return 'red';
    if (c.check && c.check.fight && typeof c.check.fight === 'object' && c.check.fight.lethal) return 'red';
    return 'white';
  };
  ST.why_red = function (c, e) {
    if ((e && e.once) || c.once) return 'once';
    const fx = c.lose && c.lose.fx, s = src(fx);
    if (fx && (fx.die || /\bdie\s*:|pcDeath\(/.test(s))) return 'death';
    if (fx && (fx.prison || /\bprison\s*:|imprison\(/.test(s))) return 'prison';
    if (fx && (fx.wound || /\bwound\s*:|addWound\(/.test(s))) return 'a wound';
    if (fx && (fx.exile || fx.disown || /\bexile|\bdisown/.test(s))) return 'exile';
    return 'a lasting loss';
  };
  ST.key = (evId, i) => evId + ':' + i;

  // ---- the chips of one event choice -------------------------------------------------------------------------------
  // c: the written choice; e: the event; q: the queue item; pc: the player; vc: the view's choice
  // Returns chips in the order drawn. The label is read so a cost it already names ("Pay 30 suns") is not said twice.
  ST.choiceChips = function (c, e, q, pc, vc) {
    const chips = [];
    if (!c || typeof c !== 'object') return chips;
    const label = vc && typeof vc.t === 'string' ? vc.t : typeof c.t === 'string' ? c.t : '';
    const priced = /\bsuns?\b|\d/.test(label);
    if (c.check || c.group) {
      const W = ST.read(c.win && c.win.fx), L = ST.read(c.lose && c.lose.fx);
      const ww = ST.words(W, 'win').slice(0, 2);
      if (ww.length) chips.push({ k: 'win', t: 'If it works: ' + ww.join(', ') });
      const lw = ST.words(L, 'fail').slice(0, 3);
      if (lw.length) chips.push({ k: 'risk', t: 'If it fails: ' + lw.join(', '), fail: true });
      else chips.push({ k: 'safe', t: 'Nothing lost if it fails' });
    } else {
      const R = ST.read(c.fx);
      if (R.coin && !priced) chips.push({ k: 'cost', t: 'Costs ' + coin(R.coin), n: R.coin, coin: true });
      if (c.fx && typeof c.fx === 'object' && num(c.fx, 'treasury') < 0 && !/\btreasury\b/i.test(label)) chips.push({ k: 'cost', t: 'Treasury ' + coin(-c.fx.treasury), treasury: true });
      let room = 3;
      if (R.fight) { chips.push({ k: 'risk', t: 'Starts a fight', fight: true }); room--; }
      for (const p of R.down) { if (room <= 0) break; if (p.k === 'treasury' || (p.k === 'coinPct' && R.coin)) continue; chips.push({ k: 'cost', t: mark(p, false) + ' ' + p.w, part: p }); room--; }
      if (R.gainCoin && room > 0 && !priced) { chips.push({ k: 'gain', t: '+' + coin(R.gainCoin), n: R.gainCoin }); room--; }
      for (const p of R.up) { if (room <= 0) break; chips.push({ k: 'gain', t: mark(p, true) + ' ' + p.w, part: p }); room--; }
      for (const p of R.touch) { if (room <= 0) break; chips.push({ k: 'touch', t: '• ' + p.w, part: p }); room--; }
    }
    if (e) for (const x of ST.run('choice', c, e, q, pc, vc)) chips.push(x);
    return chips;
  };
  // any screen's own effect data in the same grammar: A.STAKES.fx({ coin: -200, stability: 5 }) -> chips
  // (a check: A.STAKES.fx(null, { check, win, lose })); label: the button's text, so a price it names is not said twice
  ST.fx = (fx, choice, label) => ST.choiceChips(Object.assign({ fx }, choice || {}), null, null, null, { t: label || '' });

  // the white/red state of a choice for this player: { kind, rec, gain, ready }
  ST.retryState = function (pc, e, i) {
    const c = e && e.choices && e.choices[i], kind = ST.checkKind(c, e);
    if (!kind || !pc) return { kind };
    const rec = pc.retry && typeof pc.retry === 'object' ? pc.retry[ST.key(e.id, i)] : null;
    if (!rec || typeof rec !== 'object') return { kind };
    if (kind === 'red' || rec.red) return { kind: 'red', rec, ready: false };
    let v = rec.v;
    try { if (c.check && !c.check.fight) v = A.checkVal(pc, c.check); } catch (err) { v = rec.v; }
    const gain = Math.round((v - rec.v) * 10) / 10;
    return { kind, rec, gain, ready: !(c.check && !c.check.fight) || gain >= ST.RETRY_GAIN };
  };

  // ---- why a choice is out of reach (a choice the release hides because its req fails) -----------------------------
  // Only a req written as a plain threshold the player can work towards is explained: coin, letters, a skill, renown,
  // a weapon, a horse, a rank in your work, the treasury, a nature (trait). Anything else (a flag, a kinsman, the scene's
  // own context, a marriage) stays hidden, as the release hides it: those are the story's, not a goal to reach.
  const P = String.raw`\s*`;
  const ATOMS = [
    // p.coin >= N, (p.coin || 0) >= N, p.coin >= ctx.x, p.coin >= (ctx.x || N), (... ) + M, p.coin >= (ctx && ctx.x || N)
    { rx: new RegExp(String.raw`^\(?${P}p\.coin(?:${P}\|\|${P}0${P}\))?${P}>=?${P}(?:(\d+(?:\.\d+)?(?:e\d+)?)|\(?${P}(?:ctx${P}&&${P})?ctx\.(\w+)(?:${P}\|\|${P}(\d+))?${P}\)?(?:${P}\+${P}(\d+))?)$`),
      make: m => ({ kind: 'coin', need: (pc, ctx) => { let n = m[1] != null ? +m[1] : ctx && typeof ctx[m[2]] === 'number' ? ctx[m[2]] : m[3] != null ? +m[3] : null; if (n == null || !isFinite(n)) return null; return n + (m[4] ? +m[4] : 0); } }) },
    { rx: /^(?:p\.literate|C\d?\.literate\(\s*p\s*\))$/, make: () => ({ kind: 'literate' }) },
    { rx: /^C\d?\.prof\(\s*p\s*,\s*["'](\w+)["']\s*,\s*(\d+)\s*\)$/, make: m => ({ kind: 'prof', s: m[1], n: +m[2] }) },
    { rx: /^C\d?\.gear\(\s*p\s*,\s*["'](ranged|weapon|armor|shield|mount)["'](?:\s*,\s*["'](\w+)["'])?\s*\)$|^!!p\.gear\.(ranged|weapon)$/, make: m => ({ kind: 'gear', slot: m[1] || m[3], sub: m[2] || null }) },
    { rx: /^C\d?\.mounted\(\s*p\s*\)$/, make: () => ({ kind: 'mounted' }) },
    { rx: /^C\d?\.jobRank\(\s*p\s*,\s*(\d+)\s*\)$/, make: m => ({ kind: 'rank', n: +m[1] }) },
    { rx: /^(?:C\d?\.fame\(\s*p\s*\)|p\.fame)\s*>=?\s*(\d+)$/, make: m => ({ kind: 'fame', n: +m[1] }) },
    { rx: /^\(\s*A\.realm\(\s*p\.ruler\s*\)\s*\|\|\s*\{\s*\}\s*\)\.treasury\s*>=?\s*(\d+(?:e\d+)?)$/, make: m => ({ kind: 'treasury', n: +m[1] }) },
    { rx: /^C\d?\.trait\(\s*p\s*,\s*["'](\w+)["']\s*\)$/, make: m => ({ kind: 'trait', t: m[1] }) },
  ];
  // split a body on a top-level operator (outside parentheses)
  const splitTop = (s, op) => {
    const out = []; let d = 0, last = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(' || ch === '{' || ch === '[') d++;
      else if (ch === ')' || ch === '}' || ch === ']') d--;
      else if (d === 0 && s.startsWith(op, i)) { out.push(s.slice(last, i)); last = i + op.length; i += op.length - 1; }
    }
    out.push(s.slice(last));
    return out.map(x => x.trim());
  };
  // the whole body sits in one pair of parentheses: "(a || b)", not "(a) || (b)"
  const wrapped = s => {
    if (s[0] !== '(' || s[s.length - 1] !== ')') return false;
    let d = 0;
    for (let i = 0; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')') { d--; if (d === 0 && i < s.length - 1) return false; } }
    return true;
  };
  const reqCache = new WeakMap();
  // a req function as { op: '&&'|'||', atoms: [...] }, or null when it is not a plain threshold
  ST.parseReq = function (req) {
    if (typeof req !== 'function') return null;
    if (reqCache.has(req)) return reqCache.get(req);
    let out = null;
    try {
      const s = src(req).replace(/\s+/g, ' ').trim();
      const m = /^(?:\(\s*)?p(?:\s*,\s*\w+)*(?:\s*\))?\s*=>\s*(.+)$/.exec(s);
      if (m && !/^\{/.test(m[1])) {
        let body = m[1].trim();
        while (wrapped(body)) body = body.slice(1, -1).trim();
        const ors = splitTop(body, '||'), ands = splitTop(body, '&&');
        let op = null, parts = null;   // a mix of || and && at the top level is not read
        if (ors.length > 1 && ands.length === 1) { op = '||'; parts = ors; }
        else if (ands.length > 1 && ors.length === 1) { op = '&&'; parts = ands; }
        else if (ors.length === 1 && ands.length === 1) { op = '&&'; parts = [body]; }
        if (op) {
          const atoms = [];
          for (const p of parts) {
            let a = null;
            for (const A0 of ATOMS) { const mm = A0.rx.exec(p); if (mm) { a = A0.make(mm); break; } }
            if (!a) { atoms.length = 0; break; }
            atoms.push(a);
          }
          if (atoms.length === parts.length) out = { op, atoms };
        }
      }
    } catch (e) { out = null; }
    reqCache.set(req, out);
    return out;
  };
  const GEAR_WORD = { ranged: 'a bow, sling or other missile weapon', weapon: 'a weapon', armor: 'armour', shield: 'a shield', mount: 'a horse' };
  // each atom: does the player meet it, and the words for what is missing
  ST.atom = function (a, pc, ctx) {
    const C = A.C || {};
    switch (a.kind) {
      case 'coin': { const n = a.need(pc, ctx); if (n == null) return null; return { ok: (pc.coin || 0) >= n, t: `${coin(n)} (you have ${coin(Math.max(0, pc.coin || 0))})`, n }; }
      case 'literate': return { ok: !!pc.literate, t: 'reading and writing' };
      case 'prof': { if (!C.prof || !GD.SKILLS || !GD.SKILLS[a.s]) return null; const have = Math.round(A.skill ? A.skill(pc, a.s) : 0); return { ok: !!C.prof(pc, a.s, a.n), t: `${skillWord(a.s)} ${a.n} (you have ${have})` }; }
      case 'gear': { if (!C.gear) return null; return { ok: !!C.gear(pc, a.slot, a.sub || undefined), t: GEAR_WORD[a.slot] || a.slot }; }
      case 'mounted': { if (!C.mounted) return null; return { ok: !!C.mounted(pc), t: 'a horse' }; }
      case 'rank': { if (!C.jobRank) return null; return { ok: !!C.jobRank(pc, a.n), t: `rank ${a.n} in your work` }; }
      case 'fame': return { ok: (C.fame ? C.fame(pc) : pc.fame || 0) >= a.n, t: `renown ${a.n} (you have ${Math.round(pc.fame || 0)})` };
      case 'treasury': { const r = A.realm && A.realm(pc.ruler); return { ok: !!r && r.treasury > a.n, t: `more than ${coin(a.n)} in the treasury` }; }
      case 'trait': { const T = GD.TRAITS && GD.TRAITS[a.t]; return { ok: !!(C.trait && C.trait(pc, a.t)), t: `a ${String((T && (T.name || T.n)) || a.t).toLowerCase()} nature` }; }
    }
    return null;
  };
  // the reason a hidden choice is out of reach, or '' when it must stay hidden (or is not out of reach at all)
  ST.reqWhy = function (c, pc, ctx) {
    if (!c || !c.req || !pc) return '';
    const R = ST.parseReq(c.req);
    if (!R) return '';
    const res = R.atoms.map(a => ST.atom(a, pc, ctx || {}));
    if (res.some(x => !x)) return '';
    if (R.op === '||') return res.some(x => x.ok) ? '' : 'Needs ' + res.map(x => x.t).join(', or ');
    const miss = res.filter(x => !x.ok);
    return miss.length ? 'Needs ' + miss.map(x => x.t).join(', and ') : '';
  };

  // ---- markup ------------------------------------------------------------------------------------------------------
  const MARK_SR = { '▲▲': 'much more ', '▲': 'more ', '▼▼': 'much less ', '▼': 'less ', '•': 'changes ' };
  // a chip's text with its marks hidden from screen readers and said in words instead
  ST.chipText = t => UI.esc(t).replace(/^If it (works|fails):/, (m, w) => `<span class="st-long" data-short="${w === 'works' ? 'Works' : 'Fails'}">If it ${w}</span>:`).replace(/(▲▲|▼▼|▲|▼|•)\s?/g, (m, g) => `<span aria-hidden="true">${g}</span> <span class="sc-vh">${MARK_SR[g]}</span>`);
  ST.chipHtml = (c, attrs) => `<span class="st-c st-${UI.esc(c.k || 'note')}"${attrs || ''}>${ST.chipText(c.t)}</span>`;
  ST.html = (chips, attrsOf) => (chips || []).map((c, i) => ST.chipHtml(c, attrsOf ? attrsOf(c, i) : '')).join('<span class="sc-vh">; </span><span class="st-sep" aria-hidden="true">·</span>');
})();
