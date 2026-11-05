// v2 stats, part 10 (playtest 2: old 7's remainder, new 11, old 20, old 22): the 0-100 numbers still on the page.
//
// The owner's rule: no 0-100 number and no percentage the player sees; words, real units, a tipped scale. g-bands
// (part 7) put most of the page in words. Playtest 2 still read, among others: Path "Performance 64 / Reputation 38",
// "Command skill 28 / 35", "Morale 58", "merit 1448"; the duel's "Blood 86 / Wind 100" and "7 damage"; another
// person's "Body: strength 38 · speed 32 …", "Renown 59", "Opinion of you 39", "Command: 0 — no commander"; the orders'
// "Master fighter (107)"; diplomacy's "MOST FEARED Aldmark 21" and "Solenne sends 881,788 suns"; and three garbled
// de-percented lines ("countered their frontal assault about a fifth more", "Moves about a quarter more faster",
// "+2.3. all of it from doing").
//
// Most of these survived because 59-tooltips wraps the number in an element of its own ("Master fighter (<span
// data-tt="worth">101</span>)"), so a rule on one text node never saw the label beside it. Here:
//   - an element whose tooltip key says what its number measures (data-tt="perf", "merit", "board", "coMo", "worth",
//     "fame", "opinion", "loyalty" …) has the number put in words for that measure (VS.keyWords);
//   - views whose numbers sit in markup of the release's own are rewritten where they are made (another person's page,
//     the "Most feared" list, the orders' traits, the duel's bars);
//   - whole lines in the story and the reports get rules of their own (VS.NUMRULES, VS.RULES), ahead of the general ones.
// The numbers stay in the engine, the state, the tests and the tooltips' sums. Rendering only: nothing here reads
// A.rand or writes A.S.
(function () {
  const VS = A.V2S;
  if (!VS || !VS.NUMRULES) return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const pick = (bands, v) => { for (const [t, w] of bands) if (v >= t) return w; return bands[bands.length - 1][1]; };
  const num = s => +String(s).replace(/[,\s]/g, '').replace(/[−–]/g, '-');
  const tier = v => VS.tierOf(+v || 0).name;
  const pc = () => (A.S && A.pc ? A.pc() : null);

  // ---- the bands -----------------------------------------------------------------------------------------------------------
  const B2 = VS.BANDS2 = {
    perf: [[80, 'excellent'], [60, 'good'], [40, 'adequate'], [20, 'poor'], [-1e9, 'failing']],
    rep: [[80, 'famed in the trade'], [60, 'well regarded'], [40, 'known'], [20, 'little known'], [-1e9, 'unknown']],
    morale: [[80, 'eager'], [60, 'steady'], [40, 'grumbling'], [20, 'shaken'], [-1e9, 'near breaking']],
    // -100..100, the same words as 59-tooltips' glossary ("Yours of them … warm")
    opinion: [[70, 'devoted'], [40, 'warm'], [10, 'friendly'], [-9, 'indifferent'], [-39, 'cool'], [-69, 'hostile'], [-1e9, 'hateful']],
    loyalty: [[80, 'devoted'], [60, 'loyal'], [40, 'dutiful'], [25, 'restless'], [-1e9, 'disloyal']],
    discontent: [[75, 'near revolt'], [50, 'angry'], [25, 'grumbling'], [-1e9, 'quiet']],
    feud: [[-29, 'a grudge'], [-59, 'a bitter feud'], [-1e9, 'a blood feud']],
    infamy: [[80, 'a byword for terror'], [60, 'dreaded'], [40, 'feared'], [20, 'mistrusted'], [-1e9, 'watched']],
    fit: [[70, 'well suited'], [50, 'suited'], [30, 'could serve'], [-1e9, 'ill suited']],
  };
  const band = VS.band2 = (k, v) => pick(B2[k], +v);
  const feudWord = v => (+v > -30 ? 'a grudge' : +v > -60 ? 'a bitter feud' : 'a blood feud');
  // how much a change is: a 0-100 scale's step, a skill's season, a merit award, a fight's blow
  const amount = a => (a < 3 ? 'a little' : a < 8 ? 'somewhat' : a < 20 ? 'a good deal' : 'a great deal');
  const gain = a => (a < 1 ? 'a little' : a < 3 ? 'some' : 'a good deal');
  const meritGain = n => (n < 8 ? 'a little merit' : n < 25 ? 'some merit' : n < 60 ? 'a good deal of merit' : 'a great deal of merit');
  const hurt = n => (n < 6 ? 'a graze' : n < 12 ? 'a cut' : n < 20 ? 'a hard blow' : n < 35 ? 'a deep wound' : 'a terrible wound');
  const cause = n => (n >= 40 ? 'above all' : n >= 20 ? 'a great deal' : n >= 8 ? 'a good deal' : 'a little');
  VS.hurtWord = hurt;
  // merit against what the next board asks
  VS.meritWords = function (have, need) {
    have = +have || 0;
    if (!(need > 0)) return have < 50 ? 'a little' : have < 200 ? 'some' : have < 600 ? 'a good deal' : 'a great deal';
    const f = have / need;
    return f >= 1.5 ? 'well past what the board asks' : f >= 1 ? 'enough for the board' : f >= 0.85 ? 'nearly enough for the board'
      : `${VS.fracWords(100 * f)} of what the board asks`;
  };
  const meritNeed = p => {
    try { const b = p && (p.mil ? A.promoBoard(p) : A.jobBoard && p.job ? A.jobBoard(p) : null), r = b && b.find(x => x.k === 'merit'); return r ? r.need : 0; } catch (e) { return 0; }
  };
  // a requirement with what you have: the words for both, or "enough"
  const short = (have, need, w) => {
    const a = w(have), b = w(need);
    return +have >= +need ? `${a}, enough` : a === b ? `${a}, a little short` : `${a}; the board asks ${b}`;
  };
  const statKey = name => { for (const k in GD.STAT_NAMES || {}) if (GD.STAT_NAMES[k] === name) return k; return null; };
  const skillKey = name => {
    if (!name) return null;
    for (const k in GD.SKILLS || {}) { const n = String(GD.SKILLS[k]); if (n === name || k === name.toLowerCase() || n.split(/[:&,(]/)[0].trim() === name) return k; }
    return null;
  };
  const isNum = t => /^[+−–-]?\d[\d,]*(\.\d+)?$/.test(t);

  // ---- a number its tooltip key names -----------------------------------------------------------------------------------
  // (el, its text) -> the words, or null to leave it
  VS.keyWords = {
    perf: t => (isNum(t) ? band('perf', num(t)) : null),
    rep: t => (isNum(t) ? band('rep', num(t)) : null),
    fame: t => (isNum(t) ? VS.band('renown', num(t)) : null),
    opinion: t => (isNum(t) ? band('opinion', num(t)) : null),
    rulerOp: t => (isNum(t) ? band('opinion', num(t)) : null),
    loyalty: t => (isNum(t) ? band('loyalty', num(t)) : null),
    facDisc: t => (isNum(t) ? band('discontent', num(t)) : null),
    feud: t => (isNum(t) ? feudWord(num(t)) : null),
    merit: t => (isNum(t) ? VS.meritWords(num(t), meritNeed(pc())) : null),
    // "Morale 66" (9997-companies' company card)
    coMo: t => { const m = /^Morale (\d{1,3}(?:\.\d+)?)$/.exec(t); return m ? `Morale: ${band('morale', +m[1])}` : null; },
    coDivMo: t => { const m = /^Morale (\d{1,3}(?:\.\d+)?)$/.exec(t); return m ? `Morale: ${band('morale', +m[1])}` : null; },
    // the fighter's worth beside a tier ("Master fighter (101)"): in levies, as the sheet says it
    worth: (t, el) => {
      if (!isNum(t)) return null;
      const id = el.getAttribute('data-v'), P = id ? A.P(id) : pc();
      return P && VS.shownLevies && VS.levyWords ? VS.levyWords(VS.shownLevies(P)) : null;
    },
    // a promotion board's row: "379 / 600", "28 / 35"
    board: (t, el) => {
      const m = /^(\d[\d,]*(?:\.\d+)?)\s*\/\s*(\d[\d,]*(?:\.\d+)?)$/.exec(t); if (!m) return null;
      const k = String(el.getAttribute('data-v') || '').split('|')[1], a = num(m[1]), b = num(m[2]);
      if (k === 'merit') return VS.meritWords(a, b);
      if (k === 'cmd' || k === 'skill') return short(a, b, tier);
      if (k === 'rep') return short(a, b, v => band('rep', v));
      return null;   // months, battles: real counts
    },
  };
  VS.deKeyed = function (root) {
    if (!root || !root.querySelectorAll) return;
    const els = root.matches && root.matches('[data-tt]') ? [root, ...root.querySelectorAll('[data-tt]')] : root.querySelectorAll('[data-tt]');
    for (const el of els) {
      const f = VS.keyWords[el.getAttribute('data-tt')];
      if (!f || el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (!/\d/.test(t)) continue;
      let w = null; try { w = f(t, el); } catch (e) {}
      if (w != null && w !== t) { el.textContent = w; if (el.classList.contains('val') && el.parentNode && el.parentNode.classList) el.parentNode.classList.add('v2-wb'); }
    }
    // the release's bars: Blood and Wind in a duel, an opinion, the "Most feared" list (see the wrappers below)
    for (const v of root.querySelectorAll('.barrow > .val')) {
      const t = (v.textContent || '').trim(); if (!isNum(t)) continue;
      const l = ((v.parentNode.querySelector('.lbl') || {}).textContent || '').trim();
      if (/^(Their )?[Oo]pinion( of you)?$/.test(l)) { v.textContent = band('opinion', num(t)); v.parentNode.classList.add('v2-wb'); }
    }
  };
  const sweep = VS.sweep;
  VS.sweep = function (root) {
    const r = sweep.apply(this, arguments);
    try { if (root && root.nodeType === 1) VS.deKeyed(root); else if (root && root.nodeType === 3 && root.parentNode) VS.deKeyed(root.parentNode); } catch (e) { console.error('v2 keyed words', e); }
    return r;
  };

  // a word is wider than the number the release's columns were sized for ("mistrus", "Journe" at 420 px): the value
  // column takes the word's width and the bar gives way
  const CSS = '.barrow.v2-wb{grid-template-columns:minmax(0,96px) minmax(24px,1fr) auto}.barrow.v2-wb>.val{width:auto;min-width:0;max-width:none;overflow:visible;white-space:nowrap}' +
    '.skrow.v2-skw{grid-template-columns:minmax(0,1fr) minmax(24px,90px) auto}.skrow.v2-skw b{white-space:nowrap}';
  const style = () => { if (typeof document === 'undefined' || !document.head || document.getElementById('v2s-num-style')) return; const el = document.createElement('style'); el.id = 'v2s-num-style'; el.textContent = CSS; document.head.appendChild(el); };
  const render = UI.render;
  UI.render = function () { try { style(); } catch (e) {} return render.apply(this, arguments); };

  // ---- the bars the release draws with a number --------------------------------------------------------------------------
  const barRow0 = UI.barRow, wb = h => (typeof h === 'string' ? h.replace('<div class="barrow">', '<div class="barrow v2-wb">') : h);
  const barRow = function () { return wb(barRow0.apply(this, arguments)); };
  UI.barRow = function (label, v, max, cls, pot, valTxt) {
    try {
      const l = String(label || '').replace(/<[^>]*>/g, '').trim();
      if (typeof v === 'number' && max > 0) {
        // a duel: Blood is the hurt against this fighter's whole, Wind what breath is left
        if (l === 'Blood') return barRow.call(this, label, v, max, cls, pot, VS.band('blood', 100 * v / max));
        if (l === 'Wind') return barRow.call(this, label, v, max, cls, pot, VS.band('wind', 100 * v / max));
        if (/^(Their )?[Oo]pinion( of you)?$/.test(l) && typeof valTxt === 'number') return barRow.call(this, label, v, max, cls, pot, band('opinion', valTxt));
        if (/^Morale$/.test(l)) return barRow.call(this, label, v, max, cls, pot, band('morale', 100 * v / max));
      }
    } catch (e) {}
    return barRow0.apply(this, arguments);
  };

  // ---- another person's page --------------------------------------------------------------------------------------------
  // "Renown 59 — known in the realm", "Command: 48 — a steady officer", the skill rows' 0-100 values, "Body: strength 38 ·
  // speed 32 …", and "No real skills yet" on a grown watch captain
  const BODY = { strength: 'str', speed: 'spd', instinct: 'ins', stamina: 'sta', wits: 'int', will: 'wil' };
  VS.personWords = function (h, t) {
    if (typeof h !== 'string' || !t) return h;
    const adult = A.age(t) >= ((GD.RACES[t.race] || {}).adult || 16);
    return h
      .replace(/(<div>Renown<\/div><div>)(\d{1,3})(?: — [^<]*)?(<\/div>)/, (m, a, n, b) => `${a}${esc(VS.band('renown', +n))}${b}`)
      .replace(/(<b>Command:<\/b> )\d{1,3} — /, '$1')
      .replace(/(<div class="skrow"><span>)([^<]*)(<\/span>[\s\S]*?)<b>(\d{1,3})<\/b><i>[^<]*<\/i>/g, (m, a, n, mid, v) => `${a}${n}${mid}<b>${esc(tier(+v))}</b>`.replace('<div class="skrow">', '<div class="skrow v2-skw">'))
      .replace(/Body: strength \d+ · speed \d+ · instinct \d+ · stamina \d+ · wits \d+ · will \d+/, () =>
        'Body: ' + Object.entries(BODY).map(([w, k]) => `${w} ${esc(VS.statWord(t, k, A.stat(t, k)))}`).join(' · '))
      // 55-bonds' history: "you preached on obedience +4, fading"
      .replace(/<span class="tiny (good|bad)">([+−-])(\d{1,3})(, fading)?<\/span>/g, (m, c, s, n, f) => `<span class="tiny ${c}">${amount(+n)} ${c === 'good' ? 'warmer' : 'colder'}${f || ''}</span>`)
      .replace('<div class="small muted">No real skills yet.</div>', adult ? '<div class="small muted">No skill above the common run.</div>' : '<div class="small muted">No real skills yet.</div>');
  };
  if (UI.personModal) {
    const pm = UI.personModal;
    UI.personModal = function (t) {
      const h = pm.apply(this, arguments);
      try { return VS.personWords(h, t); } catch (e) { console.error('v2 person words', e); return h; }
    };
  }

  // ---- World › Diplomacy: "Most feared" is infamy on a 0-100 bar -----------------------------------------------------------
  if (UI.worldTabPolitics) {
    const wt = UI.worldTabPolitics;
    UI.worldTabPolitics = function () {
      const h = wt.apply(this, arguments);
      try {
        if (typeof h !== 'string') return h;
        return h.replace(/(<div class="group-h">Most feared<\/div>)([\s\S]*?)(?=<div class="group-h">|$)/, (m, head, body) =>
          head + body.replace(/<div class="barrow"><span class="lbl">([^<]*)<\/span>([\s\S]*?)<span class="val">(\d{1,3})<\/span><\/div>/g,
            (x, l, bar, n) => `<div class="barrow v2-wb"><span class="lbl">${l}</span>${bar}<span class="val">${esc(band('infamy', +n))}</span></div>`));
      } catch (e) { return h; }
    };
  }

  // ---- the orders' traits: "Moves +25% faster" read "Moves about a quarter more faster" -------------------------------------
  if (A.orderTraits) {
    const ot = A.orderTraits;
    const FX = [[/^Charge \+(\d+)%$/, n => `Charge: ${VS.fracWords(n)} stronger`], [/^Killing power \+(\d+)%$/, n => `Killing power: ${VS.fracWords(n)} more`],
      [/^Breaks armor \+(\d+)%$/, n => `Breaks armor: ${VS.fracWords(n)} better`], [/^Holds ground \+(\d+)%$/, n => `Holds ground: ${VS.fracWords(n)} better`],
      [/^Moves \+(\d+)% faster$/, n => `Moves ${VS.fracWords(n)} faster`]];
    A.orderTraits = function () {
      const out = ot.apply(this, arguments);
      try { if (Array.isArray(out)) return out.map(s => { for (const [re, f] of FX) { const m = re.exec(s); if (m) return f(+m[1]); } return s; }); } catch (e) {}
      return out;
    };
  }

  // ---- whole lines: percentages (VS.RULES, before the general ones) -------------------------------------------------------
  const sgn = s => (s === '+' ? 1 : -1);
  VS.RULES.unshift(
    // 23-after-action's line in the story: "the captains reckon it: your counterattack countered their frontal assault +20%, …"
    [/(the captains reckon it: )((?:[^.]|\.\d)*?%)\./g, (m, a, list) => {
      const items = [...list.matchAll(/(.*?) ([+−-])(\d{1,3})%(?:, |$)/g)].map(c => `${c[1]} (${sgn(c[2]) > 0 ? 'for you' : 'against you'}, ${cause(+c[3])})`);
      return items.length ? a + items.join(', ') + '.' : m;
    }],
    // its report: "What won it: more men in the line (+18%) and …"
    [/\(([+−-])(\d{1,3})%\)/g, (m, s, n, off, str) => (/\bWhat (won it|helped you|held it for you|lost it|cost you)\b/.test(str) ? `(${cause(+n)})` : m)],
  );

  // ---- 23-after-action's card: "+20%" before each cause, and a footnote about shares ------------------------------------
  if (UI.battleModalBasic) {
    const bm = UI.battleModalBasic, tag = bm.aar;
    UI.battleModalBasic = function () {
      const h = bm.apply(this, arguments);
      try {
        if (typeof h !== 'string' || h.indexOf('aar-causes') < 0) return h;
        return h.replace(/<span class="(good|bad)">([+−-])(\d{1,3})%<\/span>/g, (m, c, s, n) => `<span class="${c}">${sgn(s) > 0 ? '▲' : '▼'} ${esc(cause(+n))}</span>`)
          .replace('Each figure is the dead that cause added or spared, as a share of those who fell in the fighting before the rout.', 'Each cause is weighed by the dead it added or spared before the rout.');
      } catch (e) { return h; }
    };
    UI.battleModalBasic.aar = tag;
  }

  // ---- whole lines: numbers (VS.NUMRULES) ---------------------------------------------------------------------------------
  const STAT_W = '(strength|speed|instinct|instincts|combat instincts|stamina|wits|will|willpower|intelligence)';
  const skillNames = () => Object.values(GD.SKILLS || {}).map(String).sort((a, b) => b.length - a.length).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const down = (s, n) => `${sgn(s) > 0 ? 'up' : 'down'} ${amount(+n)}`;
  const capF = s => s.charAt(0).toUpperCase() + s.slice(1);
  const RULES = [
    // 31-learn-by-doing's season: "…better at Farming & herding +4.2, Persuasion +2.6. about half of it from doing, the rest from practice."
    [/This season you got better at ((?:[^.]|\.\d)*?\+\d+(?:\.\d+)?(?:[^.]|\.\d)*?)\.\s+([a-z][^.]*?) of it from doing((?:, the rest from practice)?)\./g, (m, list, share, rest) => {
      const more = /,? and (\d+) more$/.exec(list), items = (more ? list.slice(0, more.index) : list).split(/, (?=[A-Z])/).map(x => {
        const c = /^(.*?) \+(\d+(?:\.\d+)?)$/.exec(x.trim()); return c ? `${c[1]} (${gain(+c[2])})` : x.trim();
      });
      if (more) items.push(`${more[1] === '1' ? 'one thing' : 'a few things'} more`);
      const l = items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
      const s = /^all$/.test(share) ? 'All of it came from doing' : /^none$/.test(share) ? 'All of it came from practice' : `${capF(share)} of it came from doing${rest}`;
      return `This season you got better at ${l}. ${s}.`;
    }],
    // merit in the story and the battle reports: "(Merit +15)", "Merit +44.", "(merit +24)"
    [/\((merit) ([+−-])(\d+(?:\.\d+)?)\)/gi, (m, w, s, n) => `(${sgn(s) > 0 ? meritGain(+n) : 'merit lost'})`],
    [/\bMerit ([+−-])(\d+(?:\.\d+)?)\./g, (m, s, n) => `${capF(sgn(s) > 0 ? meritGain(+n) : 'merit lost')}.`],
    // the board in a sentence: "merit 379/600, command skill 28/35", "Merit 378/240"
    [/\b([Mm]erit) (\d{1,3}(?:,\d{3})*)\s?\/\s?(\d{1,3}(?:,\d{3})*)/g, (m, w, a, b) => `${w} (${VS.meritWords(num(a), num(b))})`],
    [/\b(command skill|[Cc]ommand) (\d{1,3})\s?\/\s?(\d{1,3})\b/g, (m, w, a, b) => `${w} (${short(+a, +b, tier)})`],
    // a vital or the merit as it changes: "(health −7)", "happiness +3"
    [/\b(health|happiness|renown|honou?r|looks)\s?([+−-])(\d{1,3})\b(?!\s*(?:suns?|years?|%))/gi, (m, k, s, n) => `${k} ${down(s, n)}`],
    // a body's stats as a wound changes them: "(speed -7, stamina -3)", "−6 stamina"
    [new RegExp(`\\b${STAT_W} ([+−-])(\\d{1,2})\\b`, 'gi'), (m, k, s, n) => `${k} ${down(s, n)}`],
    [new RegExp(`([+−-])(\\d{1,2}) ${STAT_W}\\b`, 'gi'), (m, s, n, k) => `${k} ${down(s, n)}`],
    // the fighting worth a wound costs: "worth 45 to 43"
    [/\bworth (\d{1,3}) to (\d{1,3})\b/g, (m, a, b) => { const d = +a - +b; return d <= 0 ? 'no cost to your fighting worth' : `costs ${d < 3 ? 'a little' : d < 8 ? 'some' : 'a good deal'} of your fighting worth`; }],
    // 49-body-mind's peaks: "Strength: best 35 at 19"
    [/\bbest (\d{1,3}) at (\d{1,3})\b/g, (m, v, a) => `at its best at ${a}`],
    // the person page's command line if another feature drew it: "Command: 48 — a steady officer"
    [/^(\s*)\d{1,3} — (a great commander|a capable commander|a steady officer|a raw officer|no commander)/, (m, sp, w) => `${sp}${w}`],
    [/\bCommand: \d{1,3} — /g, () => 'Command: '],
    // a captain or a general by his skills: "(Cunning, command 56)", "command 45 · tactics 30", "(command 60)"
    [/\b(command|tactics|logistics) (\d{1,3})\b(?!\s*(?:÷|\(÷|×|\/|%))/g, (m, k, v) => `${k} ${tier(+v)}`],
    // 55-bonds: "holds his opinion of you up (+4)"
    [/(opinion of you (?:up|down)) \([+−-]\d{1,3}\)/g, '$1'],
    // the duel's blows: "You take a hit — 7 damage."
    [/— (\d{1,3}) damage\./g, (m, n) => `— ${hurt(+n)}.`],
    // decisions: "A proficiency at 50 (best: Lance 57)", "Learning 55, or a diploma", "Spymaster with Intrigue 30+"
    [/A proficiency at (\d{1,3}) \(best: (.+?) (\d{1,3})\)/g, (m, a, n, b) => `A proficiency at ${tier(+a)} or better (best: ${n}, ${tier(+b)})`],
    [/\b(Learning|Intrigue|Command|Diplomacy|Persuasion|Stewardship|Trade|Medicine|Faith lore|Letters & learning) (\d{1,3})(\+|, or)/g, (m, n, v, tail) => `${n} at ${tier(+v)}${tail === '+' ? ' or better' : ' or better, or'}`],
    [/\bThe court's odds for it \((\d{1,3})\)/g, (m, n) => `The court's odds for it: ${VS.oddsText(+n)}`],
    // 20-ai-personality's "Opinion of you 39" in a reason list
    [/\bOpinion of you (-?\d{1,3})\b/g, (m, n) => `Opinion of you: ${band('opinion', +n)}`],
    // the old 0-100 skill in a picker's option: "Melee (9)", and a companion's fitness: "— fit 42 · Brawler"
    [/ — fit (\d{1,3}) · /g, (m, n) => ` — ${band('fit', +n)} · `],
  ];
  // "Riding & the lance −4" (a wound's cost to a skill), after the season's line is read
  RULES.push([new RegExp(`(${skillNames()}) ([+−-])(\\d{1,2}(?:\\.\\d)?)(?!\\d|[.,/]\\d|\\s*(?:%|suns?|years?))`, 'g'), (m, k, s, n) => `${k} ${down(s, n)}`]);
  VS.NUMRULES.unshift(...RULES);

  // ---- foreign sums are hearsay (old 22): "Solenne sends 881,788 suns to the Horde" ------------------------------------------
  // A realm's books are exact only to the one who keeps them: a sum between two crowns, told to someone who rules neither,
  // is what the road says ("some 900,000 suns").
  VS.hearsaySum = n => {
    if (n < 1000) return `${n}`;
    const e = Math.pow(10, Math.floor(Math.log10(n))), r = Math.round(n / e) * e;
    return r >= 1e6 ? (r === 1e6 ? 'a million' : `${A.fmt ? A.fmt(r / 1e6) : r / 1e6} million`) : (A.fmt ? A.fmt(r) : String(r));
  };
  const SUMVERB = /\b(sends|owes|pays|paid|lends|lent|borrowed|gives|gave|subsidy|tribute|ransom|loan)\b/;
  VS.NUMRULES.push([/\b(\d{1,3}(?:,\d{3})+|\d{4,}) suns\b/g, (m, n, off, str) => {
    const p = pc(); if (!p || !SUMVERB.test(str)) return m;
    // the player's own crown's books are their own
    const mine = p.ruler && A.realm(p.ruler), names = mine ? [mine.short, mine.name].filter(Boolean) : [];
    if (names.some(x => str.indexOf(x) >= 0)) return m;
    const v = num(n); return v >= 1000 ? `some ${VS.hearsaySum(v)} suns` : m;
  }]);

  // ---- the old 0-100 skill in a picker's option: "Melee (9)" --------------------------------------------------------------
  const dn = VS.deNum;
  VS.deNum = function (t, node) {
    const par = node && node.parentNode;
    if (par && par.nodeName === 'OPTION' && typeof t === 'string') {
      const m = /^(.+?) \((\d{1,3})\)$/.exec(t.trim());
      if (m && (skillKey(m[1]) || statKey(m[1]))) return `${m[1]} (${statKey(m[1]) && pc() ? VS.statWord(pc(), statKey(m[1]), +m[2]) : tier(+m[2])})`;
    }
    return dn.apply(this, arguments);
  };
})();
