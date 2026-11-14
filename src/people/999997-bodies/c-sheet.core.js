// C9 "Bodies that make sense" (D-040), part 3: the body and mind in words only.
//
// The owner: "I hate the values that say 66kg can pick up 120kg or reactions speed is 170ms. Remove those entirely."
// D-039 item 12 replaces that part of V2_SPEC's stats rule. The v2 sheet (99993-v2-stats e-sheet: the side profile, the
// phone's You page, the full profile and the Profile page's Body fold) showed height and weight in cm and kg, lift in
// kg, sprint in m/s, march in km a day and reaction in ms. Now every row is a word on the measured scale (b-scale), with
// where it stands among one's people; a click on the row opens the same line (data-note, 59-descriptions). Height is a
// word for one's place among one's own people and sex ("tall", "a little short"), weight goes, the build stays a word.
// The character maker's height slider says the word too, not centimetres. Toughness keeps its words (blows a body takes
// are a count, not a unit) and the fight row its levies. The mind keeps v2's words for memory, judgment, presence and
// cunning; wits and will read the measured scale like the body, so the sheet and the Profile page say the same word.
// Rendering only: pure, reads A.stat and A.V2S.view, draws nothing, writes no state.
(function () {
  const VS = A.V2S, B = A.V2 && A.V2.body;
  if (!VS || !VS.sheetHtml || !B) return;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const RC = A.V2.races;

  // ---- height in words ----------------------------------------------------------------------------------------------
  VS.HEIGHT_WORDS = ['very short', 'short', 'a little short', 'middle height', 'a little tall', 'tall', 'very tall'];
  VS.heightBand = function (race, sex, cm) {
    const R = RC && RC.RACES[VS.raceKey ? VS.raceKey(race) : race];
    const hs = R && R.height ? R.height[sex === 'F' || sex === 'female' ? 'female' : 'male'] : [170, 7];
    const z = (+cm - hs[0]) / Math.max(1, hs[1]);
    return z < -2 ? 0 : z < -1 ? 1 : z < -0.4 ? 2 : z < 0.4 ? 3 : z < 1 ? 4 : z < 2 ? 5 : 6;
  };
  // a person's height as a word: the grown height's place among their people and sex (a child's place among children
  // is the same, for the genes set it), and a child says so
  VS.heightWord = function (p) {
    const v = VS.view(p); if (!v) return '';
    const R = GD.RACES[p.race] || GD.RACES.human, age = A.age(p);
    const w = VS.HEIGHT_WORDS[VS.heightBand(p.race, p.sex, v.genes.adultHeight)];
    if (age < (R.grown || 20)) return `${w} for ${VS.youngOf(p, age)}`;
    return w;
  };
  VS.heightNote = function (p) {
    return `Against the grown ${p.sex === 'F' ? 'women' : 'men'} of your own people; a child by the height it will reach.`;
  };

  // ---- the sheet ---------------------------------------------------------------------------------------------------------
  const row = (lbl, val, words, note) => `<div class="v2-row tt" data-tt="note" data-v="${esc(note || '')}" tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false"><span class="v2-l">${esc(lbl)}</span><span class="v2-v">${esc(val)}</span><span class="v2-w">${esc(words)}</span></div>`;
  const statRow = (p, lbl, s) => {
    const b = VS.statBand(p, s);
    return row(lbl, b.word, b.note.replace(/\.$/, '') + (b.men && !b.child ? '. ' + b.men.replace(/\.$/, '') : ''), VS.scaleNote(p, s));
  };
  VS.BODY_ROWS = [['Strength', 'str'], ['Speed', 'spd'], ['Endurance', 'sta'], ['Reflexes', 'ins']];
  VS.sheetHtml = function (p, opts = {}) {
    if (!p || !p.st) return '';
    const v = VS.view(p), d = VS.describe(p);
    if (!v || !d) return '';
    const R = GD.RACES[p.race] || GD.RACES.human, age = A.age(p);
    const growing = age < (R.grown || 20) ? 'still growing' : '';
    let h = '<div class="v2-sheet">';
    h += `<div class="group-h">Build and strength</div>`;
    h += row('Height', VS.heightWord(p), [(p.app && p.app.build) || '', growing].filter(Boolean).join(', '), VS.heightNote(p));
    if (age < VS.MEASURE_AGE) return h + row('Body', 'too young to measure', 'strength and speed come with the years', 'A small child is not rated.') + '</div>';
    for (const [lbl, s] of VS.BODY_ROWS) h += statRow(p, lbl, s);
    // toughness: blows that would fell an ordinary man are a count, not a unit; a child's is against children
    const st = VS.stats(p), tw = /^takes \d+ blows/.test(d.toughness.words) && st && Math.round(st.toughness) < 2 ? 'stands up to a blow that would fell an ordinary man' : d.toughness.words;
    h += row('Toughness', d.toughness.value, tw, 'How hard a blow or a fever you can take.');
    const fights = age >= 6;
    if (fights) {
      const lv = VS.shownLevies(p);
      h += row('In a fight', VS.levyWords(lv), VS.levyRank(lv), 'Your worth in a fight, counted in levies: untrained spearmen in padded coats.');
    }
    h += `<div class="group-h">Mind</div>`;
    for (const k of B.MENTAL) {
      if (k === 'wits') { h += statRow(p, 'Wits', 'int'); continue; }
      if (k === 'will') { h += statRow(p, 'Will', 'wil'); continue; }
      const m = d[k];
      h += row(VS.MIND_NAME[k], cap(m.words), m.rarity || '', `${VS.MIND_NAME[k]}: against your people${age < (R.grown || 20) ? ' of your age' : ''}.`);
    }
    const bt = (v.body.breakthroughs || []);
    // a click says what a breakthrough is (every number on the Profile page carries a description: pfNumbers)
    if (bt.length) h += `<div class="tiny muted v2-bt tt" data-tt="note" data-v="${esc('A breakthrough: a surge of will against long odds, with something real at stake, raised how far this body or mind can go. The number is the age it came.')}" tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false">Broke through: ${esc(bt.slice(-3).map(b => `${b.attr === 'lift' ? 'strength' : b.attr} at ${b.age}${b.note ? ' (' + b.note + ')' : ''}`).join('; '))}.</div>`;
    if (!opts.noLegend && fights) h += `<div class="tiny muted v2-legend">A levy: an untrained spearman in a padded coat.</div>`;
    return h + '</div>';
  };
  VS.css = (VS.css || '') + '.v2-row.tt{cursor:pointer}';

  // ---- the full profile's own height line: "178 cm, sturdy" -> "tall, sturdy" -----------------------------------------
  if (UI.profileModal) {
    const pm = UI.profileModal;
    UI.profileModal = function (p) {
      const h = pm.apply(this, arguments);
      try {
        if (typeof h !== 'string' || !p) return h;
        return h.replace(/<div>Height<\/div><div>\d+ cm( and growing)?, /, (m, g) => `<div>Height</div><div>${esc(VS.heightWord(p))}${g && !/ for a (child|youth)/.test(VS.heightWord(p)) ? ' and growing' : ''}, `);
      } catch (e) { console.error('bodies height', e); return h; }
    };
  }

  // ---- the character maker: the height slider says a word ------------------------------------------------------------
  const crWord = () => { const c = UI.cr; return c && c.app ? VS.HEIGHT_WORDS[VS.heightBand(c.race || 'human', c.sex, c.app.height)] : ''; };
  VS.crHeightText = h => (typeof h === 'string' && h.indexOf('id="hval"') >= 0 ? h.replace(/<span id="hval">\d+ cm<\/span>/, () => `<span id="hval">${esc(crWord())}</span>`).replace(/aria-label="Height in centimetres"/, 'aria-label="Height when grown"') : h);
  if (UI.C && UI.C.crHeight) {
    const ch = UI.C.crHeight;
    UI.C.crHeight = function (el) {
      const r = ch.apply(this, arguments);
      try { const hv = UI.$ && UI.$('#hval'); if (hv) hv.textContent = crWord(); } catch (e) {}
      return r;
    };
  }
  // the maker draws through UI.render; its markup is fixed after (the release's 23-ui-a and 93-figures' tabs)
  for (const k of ['renderCreate', 'crBody', 'fgTab', 'renderMaker']) {
    if (typeof UI[k] !== 'function') continue;
    const f = UI[k];
    UI[k] = function () { return VS.crHeightText(f.apply(this, arguments)); };
  }
  if (typeof document !== 'undefined') {
    const render = UI.render;
    UI.render = function () {
      const r = render.apply(this, arguments);
      try { const hv = document.getElementById('hval'); if (hv && /\d\s*cm/.test(hv.textContent)) hv.textContent = crWord(); const inp = hv && hv.closest('label') && hv.closest('label').nextElementSibling; if (inp && inp.getAttribute('aria-label') === 'Height in centimetres') inp.setAttribute('aria-label', 'Height when grown'); } catch (e) {}
      return r;
    };
  }

  // ---- the Profile page's six rows: the measured word, its place on seven pips -----------------------------------------
  const PF = UI.PF;
  if (PF && PF.STATS) {
    for (const r of PF.STATS) {
      if (!GD.STATS.includes(r.k)) continue;
      const k = r.k;
      r.read = function (p) {
        const b = VS.statBand(p, k);
        if (!b || b.band < 0) return { word: 'too young to tell', at: 0, pot: 0, tip: ['stat', k], young: true };
        // what the potential would read: the old engine's cap (1.02 x potential) with today's age
        const pv = p.pot && p.pot[k] ? p.pot[k] * 1.02 * (A.ageFactor ? A.ageFactor(p, k) : 1) : 0;
        const pb = pv > A.stat(p, k) ? VS.statBand(p, k, pv).band : b.band;
        return { word: b.word, at: Math.min(6, b.band), pot: Math.min(6, Math.max(b.band, pb)), tip: ['stat', k], young: false, off: b.band >= 7 };
      };
    }
  }

  // ---- the stat popover: what the word is read against (a click, 59-descriptions) --------------------------------------
  if (UI.TIPS && UI.TIPS.stat) {
    const tip = UI.TIPS.stat;
    UI.TIPS.stat = function (k) {
      const h = tip.apply(this, arguments), p = A.pc();
      try {
        if (typeof h !== 'string' || !p || !GD.STATS.includes(k)) return h;
        const b = VS.statBand(p, k), add = `<div class="tip-d"><b>${esc(cap(b.word))}.</b> ${esc(VS.scaleNote(p, k))}</div>`;
        const i = h.indexOf('</div>');
        return i > 0 ? h.slice(0, i + 6) + add + h.slice(i + 6) : add + h;
      } catch (e) { return h; }
    };
  }
})();
