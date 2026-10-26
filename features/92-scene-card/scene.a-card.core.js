// 92-scene-card, part 1: the card (docs/design/brief.md §5.9). Every event is drawn as a scene card: the vignette across
// the top, the subject's bust overlapping its lower edge, the title, the text, and the choices as rows that carry a
// check chip (the stat's icon and colour, with your value), an odds badge (the percentage, the band word and four
// pips) and, where the written choice says so plainly, an effect hint. After a choice the result lands in the same
// card (part 2).
//
// The card is built from the release's event markup, after every feature has added its part (the woodcut or colour
// print, the portrait, the asides of 55 and 57, 48's measure, 89's fight badge, 97's stakes line, 59's odds wiring):
// UI.queueModal is wrapped, the markup is parsed in an inert <template>, its pieces are moved into the card's frame, and
// the markup goes back out as a string. Nothing is dropped: a piece the card does not know goes into its body.
//
// Drawing is pure: it reads the event's view, the written choice and the player, never A.rand, never writes A.S. The
// one memory it keeps (which phase of which event was last drawn, for the entrance motion) is UI state in a WeakMap.
(function () {
  const SC = UI.SCENE = UI.SCENE || {};
  SC.OFF = false;
  SC.off = () => !!SC.OFF || (UI.set && UI.set.sceneCard === false);
  const esc = s => UI.esc(String(s == null ? '' : s));
  const STATS = () => (GD.STATS || ['str', 'spd', 'ins', 'sta', 'int', 'wil']);
  const isStat = k => STATS().includes(k);

  // ---- the vocabulary: bands, stats, skills, icons ---------------------------------------------------------------
  // the engine's bands, kept exactly: likely 75 and up, even 50 to 74, risky 30 to 49, long under 30
  SC.band = pct => pct >= 75 ? 'likely' : pct >= 50 ? 'even' : pct >= 30 ? 'risky' : 'long';
  SC.PIPS = { likely: 4, even: 3, risky: 2, long: 1 };
  SC.WORD = { likely: 'likely', even: 'even odds', risky: 'risky', long: 'long odds' };
  SC.bandOfWord = w => /long/.test(w) ? 'long' : /risky/.test(w) ? 'risky' : /likely/.test(w) ? 'likely' : /even/.test(w) ? 'even' : '';
  SC.short = k => isStat(k) ? ((GD.STAT_SHORT && GD.STAT_SHORT[k]) || k.toUpperCase()) : String((GD.SKILLS && GD.SKILLS[k]) || k).split(/[:&,(]/)[0].trim();
  SC.longName = k => isStat(k) ? ((GD.STAT_NAMES && GD.STAT_NAMES[k]) || k) : String((GD.SKILLS && GD.SKILLS[k]) || k);
  // the stat a skill rests on (GD.SKILL_STAT's first), whose colour and icon its check chip wears
  SC.statOf = k => isStat(k) ? k : (GD.SKILL_STAT && GD.SKILL_STAT[k] && GD.SKILL_STAT[k][0]) || 'int';
  SC.icon = (name, cls) => (UI.iconOf && name ? UI.iconOf(name, cls || 's') : '');
  SC.statIcon = s => SC.icon(UI.ICON_STAT && UI.ICON_STAT[s]);
  // your value in a check, as 59-tooltips' odds popover counts it (untrained floors, synergies, perks)
  SC.valueOf = function (pc, k) {
    try { if (UI.TT && UI.TT.checkValue) return Math.round(UI.TT.checkValue(pc, k).v); } catch (e) {}
    return isStat(k) ? A.stat(pc, k) : A.skill(pc, k);
  };

  // ---- what a written choice is: a check, a one-time act, a known effect -------------------------------------------
  const src = f => (typeof f === 'function' ? String(f) : '');
  const IRREVERSIBLE = /\bdie\s*:|pcDeath\(|\bdisown|\babdicat/;
  SC.isOnce = function (c) {
    if (!c || typeof c !== 'object') return false;
    if (c.once) return true;
    for (const b of [c, c.win, c.lose]) {
      const fx = b && b.fx;
      if (!fx) continue;
      if (typeof fx === 'object' && (fx.die || fx.disown || fx.abdicate)) return true;
      if (typeof fx === 'function' && IRREVERSIBLE.test(src(fx))) return true;
    }
    return false;
  };
  // an effect the written choice states plainly (an object fx, no check): at most two, the largest first. Costs in
  // coin are left to 97-life-fixes' stake line ("Costs 30 suns"), which already says them.
  const HINT = [['coin', 'coin', 'coin'], ['honor', 'honour', 'honour'], ['fame', 'renown', 'renown'], ['piety', 'piety', 'piety'],
    ['happy', 'spirits', 'spirits'], ['health', 'health', 'health']];
  SC.hints = function (c) {
    if (!c || c.check || c.group || !c.fx || typeof c.fx !== 'object') return [];
    const out = [];
    for (const [k, up, down] of HINT) {
      const v = c.fx[k];
      if (typeof v !== 'number' || !v || (k === 'coin' && v < 0)) continue;
      out.push({ k, d: v, w: v > 0 ? up : down });
    }
    const t = c.fx.them;
    if (t && typeof t === 'object' && typeof t.op === 'number' && t.op) out.push({ k: 'them', d: t.op, w: 'their regard' });
    if (c.fx.wound) out.push({ k: 'wound', d: -10, w: 'a wound' });
    if (c.fx.prison) out.push({ k: 'prison', d: -10, w: 'prison' });
    return out.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 2);
  };

  // ---- the pieces of a choice row --------------------------------------------------------------------------------
  // the check chip: the stat's icon and short name (a skill: its own short name, in the colour of the stat it rests on),
  // and your value; a second stat in the check is named after it
  // With 59-tooltips the chip explains its value: a plain check opens the choice's odds (where the value is counted as
  // the check counts it, against the difficulty); a fight, or a choice with no odds shown, opens the stat or skill.
  SC.chipTip = function (ck, vi, vc) {
    if (!UI.ttAttrs || !ck || !ck.s) return '';
    if (vi != null && vc && vc.odds != null && !ck.fight) return UI.ttAttrs('odds', vi, false);
    return isStat(ck.s) ? UI.ttAttrs('stat', ck.s, false) : GD.SKILLS && GD.SKILLS[ck.s] ? UI.ttAttrs('skill', ck.s, false) : '';
  };
  SC.chip = function (pc, ck, vi, vc) {
    if (!ck || !ck.s) return '';
    const s = SC.statOf(ck.s), v = SC.valueOf(pc, ck.s);
    const two = ck.s2 ? `<span class="sc-chk-2">+${esc(SC.short(ck.s2))}</span>` : '';
    return `<span class="sc-chk" data-st="${esc(s)}"${SC.chipTip(ck, vi, vc)}><span class="sc-vh">Check: </span>${SC.statIcon(s)}<span class="sc-chk-n">${esc(SC.short(ck.s))}</span>` +
      `<b class="sc-chk-v">${esc(v)}</b>${two}</span>`;
  };
  // the odds badge restyled in place: the release's "40% · risky" (or 89's "40% · a fight") is split into the number,
  // the separator and the word, so its text (and 59-tooltips' tap target on it) is unchanged; the four pips are an
  // empty span drawn by CSS, so they add no text
  SC.oddsBadge = function (el, band) {
    const doc = el.ownerDocument, txt = el.textContent || '', m = /^\s*(\d+)%\s*·\s*([\s\S]+)$/.exec(txt);
    while (el.firstChild) el.removeChild(el.firstChild);
    const span = (cls, t) => { const s = doc.createElement('span'); s.className = cls; if (t != null) s.textContent = t; el.appendChild(s); return s; };
    if (m) { span('sc-pct', m[1] + '%'); span('sc-sep', ' · '); span('sc-w', m[2].trim()); }
    else span('sc-w', txt.trim());
    const pips = span('sc-pips'); pips.setAttribute('aria-hidden', 'true'); pips.dataset.n = String(SC.PIPS[band] || 0);
    el.classList.add('sc-odds');
    if (band) { el.classList.add('sc-b-' + band); if (band === 'even') el.classList.add('even'); }
  };
  SC.hintHtml = h => `<span class="sc-hint ${h.d > 0 ? 'sc-up' : 'sc-down'}"><span aria-hidden="true">${h.d > 0 ? '▲' : '▼'}</span> ${esc(h.w)}</span>`;

  // ---- the card --------------------------------------------------------------------------------------------------
  SC.seen = new WeakMap();   // q -> the phase last drawn ('c' choosing, 'r' the result): the entrance motion runs once
  SC.chosen = new WeakMap(); // q -> { vi, label, odds, band } of the choice made (part 2 writes it)
  const el = (doc, tag, cls, html) => { const x = doc.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; };

  SC.card = function (h, q) {
    if (typeof h !== 'string' || !h || typeof document === 'undefined') return h;
    const tpl = document.createElement('template');
    tpl.innerHTML = h;
    const doc = tpl.content.ownerDocument;
    const box = tpl.content.querySelector('.mbox');
    if (!box) return h;
    const pc = A.pc(), e = A.EV[q.ev] || {}, v = q.view || A.eventView(q) || {};
    const phase = q.result ? 'r' : 'c', was = SC.seen.get(q);
    SC.seen.set(q, phase);

    // the pieces the release and the features drew
    const vig = box.querySelector(':scope > .woodcut-wrap');
    const row = [...box.children].find(x => x.classList.contains('row') && x.querySelector('h2'));
    const grow = row && row.querySelector(':scope > .grow');
    const por = row && [...row.children].find(x => x !== grow);
    const h2 = grow && grow.querySelector('h2');
    const choices = box.querySelector(':scope > .choices');
    const result = box.querySelector(':scope > .result');
    const cont = box.querySelector(':scope > button[data-a="evClose"]');

    // the frame: the card keeps its .mbox (every selector that finds the event box still does), its inside scrolls
    box.classList.add('sc-card');
    box.dataset.sc = phase === 'r' ? 'result' : 'choose';
    if (was == null) box.classList.add('sc-enter');
    else if (was === 'c' && phase === 'r') box.classList.add('sc-land');
    const inner = el(doc, 'div', 'sc-in');
    const head = el(doc, 'div', 'sc-head'), body = el(doc, 'div', 'sc-body');
    if (vig) { const wrap = el(doc, 'div', 'sc-vig'); wrap.appendChild(vig); inner.appendChild(wrap); box.classList.add('sc-has-vig'); }
    if (por && por.querySelector('svg')) { por.className = 'sc-bust'; head.appendChild(por); box.classList.add('sc-has-bust'); }
    const ttl = el(doc, 'div', 'sc-ttl');
    if (h2) ttl.appendChild(h2);
    if (e.once) {
      const t = el(doc, 'span', 'sc-tier', '<span class="sc-gem" aria-hidden="true">◆◆</span> once in a life');
      ttl.appendChild(t);
    }
    head.appendChild(ttl);
    inner.appendChild(head);
    if (grow) for (const x of [...grow.children]) body.appendChild(x);
    inner.appendChild(body);
    if (row) row.remove();

    if (phase === 'c' && choices) SC.rows(choices, q, v, e, pc);
    if (choices) inner.appendChild(choices);
    if (phase === 'r') inner.appendChild(SC.resultBlock(doc, q, result, cont));
    else { if (result) result.remove(); if (cont) cont.remove(); }
    // anything else a feature put in the box (after the choices, or a piece the card does not know): into the body
    for (const x of [...box.children]) if (x !== inner) body.appendChild(x);
    box.appendChild(inner);
    return tpl.innerHTML;
  };

  // the choice rows: number key (the release's counter), the label and its sub-lines, then the tags on the right
  SC.rows = function (choices, q, v, e, pc) {
    const doc = choices.ownerDocument;
    for (const b of choices.querySelectorAll(':scope > button[data-a="evChoose"]')) {
      const vi = +b.dataset.v, vc = v.choices && v.choices[vi], c = vc && vc.i >= 0 && e.choices ? e.choices[vc.i] : null;
      b.classList.add('sc-ch');
      const tags = el(doc, 'span', 'sc-tags');
      if (c && c.check && pc) tags.insertAdjacentHTML('beforeend', SC.chip(pc, c.check, vi, vc));
      const odds = b.querySelector(':scope > .risk, :scope > .fo-fight');
      if (odds) {
        const pct = vc && vc.odds != null ? vc.odds : vc && vc.fight ? vc.fight.pct : null;
        SC.oddsBadge(odds, pct != null ? SC.band(pct) : SC.bandOfWord(odds.textContent || ''));
        tags.appendChild(odds);
      }
      for (const hn of SC.hints(c)) tags.insertAdjacentHTML('beforeend', SC.hintHtml(hn));
      if (SC.isOnce(c)) { b.classList.add('sc-once'); tags.insertAdjacentHTML('beforeend', '<span class="sc-oncew">once</span>'); }
      if (tags.firstChild) b.appendChild(tags); else b.classList.add('sc-plain');
    }
  };

  // the result in place: what you chose, how it went, what it said, what changed (part 2), and Continue
  SC.resultBlock = function (doc, q, result, cont) {
    const wrap = el(doc, 'div', 'sc-result');
    const ch = SC.chosen.get(q), ok = q.result ? q.result.success : null;
    if (ch && ch.label) {
      const line = el(doc, 'div', 'sc-chose');
      line.innerHTML = `<span class="sc-key" aria-hidden="true">${esc(ch.vi + 1)}</span><span class="sc-chose-t"><span class="sc-vh">You chose: </span>${esc(ch.label)}</span>` +
        (ok === true || ok === false ? `<span class="sc-verdict ${ok ? 'sc-ok' : 'sc-fail'}">${ok ? 'Success' : 'Failed'}${ch.odds != null && SC.digits() ? ` <span class="sc-verdict-n">at ${esc(ch.odds)}%</span>` : ''}</span>` : '');
      wrap.appendChild(line);
    } else if (ok === true || ok === false) {
      wrap.appendChild(el(doc, 'div', 'sc-chose', `<span class="sc-verdict ${ok ? 'sc-ok' : 'sc-fail'}">${ok ? 'Success' : 'Failed'}</span>`));
    }
    if (result) { result.id = 'sc-res-t'; wrap.appendChild(result); }
    const d = SC.deltasHtml ? SC.deltasHtml(q) : '';
    if (d) wrap.insertAdjacentHTML('beforeend', d);
    const foot = el(doc, 'div', 'sc-foot');
    const btn = cont || el(doc, 'button', 'primary', 'Continue');
    if (!cont) btn.dataset.a = 'evClose';
    btn.classList.add('sc-cont');
    if (result) btn.setAttribute('aria-describedby', 'sc-res-t');
    if (!btn.querySelector('kbd')) btn.insertAdjacentHTML('beforeend', ' <kbd class="sc-kbd" aria-hidden="true">Enter</kbd>');
    foot.appendChild(btn);
    wrap.appendChild(foot);
    return wrap;
  };
  SC.digits = () => (A.DIFF && A.DIFF.showOdds ? !!A.DIFF.showOdds() : !!(UI.set && UI.set.odds !== false));

  // ---- the hook: every event drawn as a queue prompt -----------------------------------------------------------------
  const qm = UI.queueModal;
  if (typeof qm === 'function') {
    UI.queueModal = function (q) {
      const h = qm.apply(this, arguments);
      if (!q || q.type !== 'event' || SC.off()) return h;
      try { return SC.card(h, q); } catch (err) { console.error('scene card', err); return h; }
    };
  }
})();
