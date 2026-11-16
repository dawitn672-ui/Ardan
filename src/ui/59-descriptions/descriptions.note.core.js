// Nested tooltips, round 2 B4 (D-007): descriptions open on click, never on hover. This file is the half of that rule
// that is not the popover itself: where a description used to sit in a native title="..." (which a phone never shows
// and a mouse shows on hover) it now opens the same way every other description does.
//
//   UI.TIPS.note(text)     a popover holding one plain description (the text is escaped; no markup)
//   UI.note(text, label)   a trigger around a label: the underlined term as a button (for features that write HTML)
//   UI.noteBtn(text, about)  an info button, the glyph "ⓘ", that opens text
//   data-note="text"       the attribute a feature writes instead of title="text"; TT.sweepTitles lifts it
//   TT.sweepTitles(root)   every title of more than three words (and every data-note) under root is lifted
//
// What the sweeper does with an element that carries a description (the first rule that fits):
//   1. it is, or sits in, a trigger already: the popover explains it, the title goes;
//   2. it is an activity tile: the sheet that opens on a press explains it (src/ui/99998-click-open), the title goes;
//   3. it is an action itself (a button, a link, a select): an info button is put beside it, and the action stays one
//      (unless the description only says the action's name again: then it is a label, TT.sameAsName);
//   4. it is a part of an action: it explains itself when pressed, and the rest of the action still acts;
//   5. it is a table part or holds controls: an info button goes inside it (a row's goes in its last cell);
//   6. otherwise it becomes the trigger: a button by role, focusable, underlined when inline and followed by the glyph
//      when it is a block (the glyph follows the block's own words, TT.markHost: on its first child that holds words
//      when it has none of its own, so it never adds a cell or a row to a grid or flex layout).
// A short title (three words or fewer) is a label and stays. The sweeper only changes the page, never the game: it
// does not touch A.S and draws no random number, so it may run while a view is drawn.
(function () {
  const TT = UI.TT;
  const G = UI.TIPS = UI.TIPS || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const SEL = '[data-tt],[data-tip]';
  const INLINE = new Set(['SPAN', 'B', 'I', 'EM', 'STRONG', 'SMALL', 'A', 'LABEL', 'CODE', 'U', 'ABBR', 'BDI', 'KBD', 'SUP', 'SUB']);
  const FOCUS = 'a[href],button,input,select,textarea,[tabindex],[data-a]';
  const ACTION = 'button,[data-a],a[href],select,input,textarea,summary';

  G.note = text => String(text == null ? '' : text).split('\n').map(t => `<div class="tip-d">${esc(t)}</div>`).join('');
  UI.note = (text, label, o = {}) => UI.tt('note', text, label, o);
  UI.noteBtn = (text, about) => `<button type="button" class="tt-i" data-tt="note" data-v="${esc(text)}" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(about && !/\d/.test(about) ? 'About ' + about : 'More about this')}">ⓘ</button>`;
  TT.words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

  // the description an element carries: data-note always, title when it is more than a label
  TT.noteOf = el => {
    const n = el.getAttribute('data-note');
    if (n != null) return n.trim();
    const t = el.getAttribute('title');
    return t != null && TT.words(t) > 3 ? t.trim() : null;
  };
  const FILLER = new Set(['a', 'an', 'the', 'this', 'that', 'it', 'here', 'now', 'with', 'for', 'of', 'to', 'on', 'in']);
  const wordsOf = s => String(s || '').toLowerCase().match(/[a-z0-9']+/g) || [];
  TT.sameAsName = (text, el) => {
    const name = new Set(wordsOf(el.getAttribute('aria-label') || el.textContent));
    if (!name.size) return false;
    return wordsOf(text).every(w => name.has(w) || FILLER.has(w));
  };
  const nameOf = el => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);

  TT.liftOne = function (el) {
    let text = TT.noteOf(el);
    if (text == null) return false;
    el.removeAttribute('data-note');
    // the 0-100 numbers of a description are words, as 99993-v2-stats gives them in a title (when it is in the build)
    if (/\d/.test(text) && typeof A !== 'undefined' && A.V2S && typeof A.V2S.titleWords === 'function') { try { text = A.V2S.titleWords(text) || text; } catch (e) {} }
    if (el.hasAttribute('title') && TT.words(el.getAttribute('title')) > 3) el.removeAttribute('title');
    if (!text || el.closest('.tt-pop')) return true;
    if (/^(OPTION|OPTGROUP|HEAD|META|LINK|STYLE|SCRIPT)$/.test(el.tagName)) return true;
    // 1. already explained by a popover of the engine
    // (what the title said, if the popover does not say it, is kept on the anchor and shown as the popover's last lines)
    const own = el.closest(SEL);
    if (own) { const m = own.getAttribute('data-more') || ''; if (!m.includes(text)) own.setAttribute('data-more', m ? m + '\n' + text : text); }
    if (own) { if (el.getAttribute('role') === 'button' && !el.textContent.trim() && !el.getAttribute('aria-label')) el.setAttribute('aria-label', text.slice(0, 80)); return true; }
    // 2. an activity tile: pressing it opens the sheet that says what it is
    if (el.matches('[data-a="act"]')) return true;
    // 3. an action: an info button beside it
    if (el.matches(ACTION)) {
      if (el.closest('[aria-hidden="true"]')) return true;
      // the buttons of a segmented control (how hard to train): one info button after the control tells what each does
      const seg = el.parentElement;
      if (seg && seg.classList.contains('seg')) {
        const lines = [];
        for (const b of seg.children) {
          const t = TT.noteOf(b); if (t == null) continue;
          b.removeAttribute('data-note'); if (TT.words(b.getAttribute('title')) > 3) b.removeAttribute('title');
          if (t) { lines.push(`${nameOf(b)}: ${t}`); b.setAttribute('aria-description', t); }
        }
        const nx = seg.nextElementSibling;
        if (lines.length && !(nx && nx.classList.contains('tt-i'))) seg.insertAdjacentHTML('afterend', UI.noteBtn(lines.join('\n'), 'these choices'));
        return true;
      }
      // a description that only says the action's name again ("Report a problem with this" on the button named "Report a
      // problem") is a label: no info button (CI 98: the dialogs' report button is absolutely placed, so its info button
      // fell into the dialog's flex row and pushed the death screen 39 px off the edge)
      if (TT.sameAsName(text, el)) return true;
      if (el.parentNode && !(el.nextElementSibling && el.nextElementSibling.classList.contains('tt-i') && el.nextElementSibling.dataset.v === text)) el.insertAdjacentHTML('afterend', UI.noteBtn(text, nameOf(el)));
      return true;
    }
    // 4. a part of a choice or a tile keeps the tap for the choice: the words go to assistive technology, and the info
    //    glyph of the choice (TT.sweepChoices) opens what the page says about its odds
    if (el.closest(TT.ACT_KEEPS)) { el.setAttribute('aria-description', text); return true; }
    //    a part of any other action: pressed, it explains itself and the action waits
    if (el.closest(ACTION)) {
      el.setAttribute('data-tt', 'note'); el.setAttribute('data-v', text); el.setAttribute('data-tt-tap', '1'); el.classList.add('tt-n');
      return true;
    }
    // 5. a table part, or an element holding controls: an info button inside it
    const tag = el.tagName;
    if (/^(TR|TD|TH|THEAD|TBODY|TFOOT|TABLE)$/.test(tag) || el.querySelector(FOCUS)) {
      if (el.closest('[aria-hidden="true"]')) return true;
      const host = tag === 'TR' && el.lastElementChild ? el.lastElementChild : el;
      host.insertAdjacentHTML('beforeend', UI.noteBtn(text, nameOf(el)));
      return true;
    }
    // 6. the element is the trigger
    el.setAttribute('data-tt', 'note'); el.setAttribute('data-v', text);
    // (a part of something hidden from assistive technology, such as a folded card's summary, takes a press but no focus:
    // its full text is on the card when it is open)
    if (!el.closest('[aria-hidden="true"]')) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); el.setAttribute('aria-haspopup', 'dialog'); el.setAttribute('aria-expanded', 'false'); }
    if (el.getAttribute('role') === 'button' && !el.textContent.trim() && !el.getAttribute('aria-label')) el.setAttribute('aria-label', text.slice(0, 80));
    el.classList.add('tt-note', INLINE.has(tag) ? 'tt-note-i' : 'tt-note-b');
    if (!INLINE.has(tag)) { const m = TT.markHost(el); if (m !== el) { el.classList.add('tt-note-c'); m.classList.add('tt-note-m'); } }
    return true;
  };
  // where a block trigger's glyph goes. A ::after on the element itself is one more box in it: a cell (and so a whole
  // new row) when the element is a grid or a flex container, a line of its own when it holds only blocks (CI 98: every
  // v2 stat row of the profile grew a row and the page scrolled). The page is not asked how it is laid out (that would
  // be a style read in the middle of the sweep's writes); instead the glyph goes where the words are: on the element
  // when it holds text of its own, else on its first child that holds words, and down again, so it always follows text
  // inside an inline run and never adds a box to a grid or flex layout.
  const NOMARK = /^(IMG|SVG|svg|CANVAS|VIDEO|AUDIO|INPUT|SELECT|TEXTAREA|BUTTON|IFRAME|OBJECT|PROGRESS|METER|BR|HR|TEMPLATE)$/;
  const ownText = el => { for (const n of el.childNodes) if (n.nodeType === 3 && /\S/.test(n.nodeValue)) return true; return false; };
  const wordy = c => !NOMARK.test(c.tagName) && !c.hidden && c.getAttribute('aria-hidden') !== 'true' && !/\b(sr-only|visually-hidden|tt-i)\b/.test(c.className && c.className.baseVal == null ? c.className : '') && /\S/.test(c.textContent);
  TT.markHost = function (el) {
    let h = el;
    for (let d = 0; d < 6 && !ownText(h); d++) {
      let next = null;
      for (const c of h.children) if (wordy(c)) { next = c; break; }
      if (!next) break;
      h = next;
    }
    return h;
  };
  TT.sweepTitles = function (root) {
    root = root || (typeof document !== 'undefined' ? document.body : null);
    if (!root || !root.querySelectorAll) return 0;
    let n = 0;
    const list = [...root.querySelectorAll('[title],[data-note]')];
    if (root.matches && root.matches('[title],[data-note]')) list.unshift(root);
    for (const el of list) { try { if (TT.liftOne(el)) n++; } catch (e) { console.error('tooltips note', e); } }
    return n;
  };

  // a choice keeps its tap for the choice; the odds in it explain themselves through an info glyph kept inside the button
  TT.sweepChoices = function (root) {
    root = root || (typeof document !== 'undefined' ? document.body : null);
    if (!root || !root.querySelectorAll) return 0;
    let n = 0;
    for (const b of root.querySelectorAll('button[data-a="evChoose"]')) {
      if (b.querySelector('.tt-i')) continue;
      const o = b.querySelector('[data-tt="odds"]'); if (!o) continue;
      const g = document.createElement('span');
      g.className = 'tt-i tt-n'; g.setAttribute('data-tt', 'odds'); g.setAttribute('data-tt-tap', '1'); g.setAttribute('aria-hidden', 'true');
      if (o.dataset.v != null) g.setAttribute('data-v', o.dataset.v);
      g.textContent = 'ⓘ';
      o.after(g); n++;
    }
    return n;
  };
  // an action that is also an anchor (a button that opens a tip by hover once): the anchor moves to an info button beside it
  TT.sweepSelfAnchors = function (root) {
    root = root || (typeof document !== 'undefined' ? document.body : null);
    if (!root || !root.querySelectorAll) return 0;
    let n = 0;
    for (const a of root.querySelectorAll('button[data-a][data-tt],button[data-a][data-tip]')) {
      if (a.closest('.tt-pop') || a.matches('[data-a="act"],[data-a="evChoose"],[data-a="v2wChoose"]')) { if (a.matches('[data-a="act"]')) { a.removeAttribute('data-tt'); a.removeAttribute('data-tip'); } continue; }
      const k = a.dataset.tt, v = a.dataset.v;
      if (!k) continue;
      a.removeAttribute('data-tt');
      if (a.hasAttribute('data-tip')) a.removeAttribute('data-tip');
      a.removeAttribute('tabindex'); a.removeAttribute('aria-haspopup'); a.removeAttribute('aria-expanded');
      if (a.getAttribute('role') === 'button') a.removeAttribute('role');
      const nxt = a.nextElementSibling;
      if (nxt && nxt.classList.contains('tt-i') && nxt.dataset.tt === k) continue;
      a.insertAdjacentHTML('afterend', `<button type="button" class="tt-i" data-tt="${esc(k)}"${v != null ? ` data-v="${esc(v)}"` : ''} aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(/\d/.test(nameOf(a)) ? 'More about this' : 'About ' + nameOf(a))}">ⓘ</button>`);
      n++;
    }
    return n;
  };
  // a tile that cannot be done is still pressable: it opens its sheet, which says why not (a disabled button takes no
  // press at all, and its reason was a title)
  TT.sweepTiles = function (root) {
    root = root || (typeof document !== 'undefined' ? document.body : null);
    if (!root || !root.querySelectorAll) return 0;
    let n = 0;
    for (const t of root.querySelectorAll('button[data-a="act"][disabled]')) { t.removeAttribute('disabled'); t.setAttribute('aria-disabled', 'true'); n++; }
    return n;
  };
  TT.sweepAll = function (root) {
    let n = 0;
    try { n += TT.sweepTiles(root); } catch (e) { console.error('tooltips tiles', e); }
    try { n += TT.sweepSelfAnchors(root); } catch (e) { console.error('tooltips self', e); }
    try { n += TT.sweepTitles(root); } catch (e) { console.error('tooltips titles', e); }
    try { n += TT.sweepChoices(root); } catch (e) { console.error('tooltips choices', e); }
    return n;
  };

  // the War Room's key (edge colours, strip, bars, banner, number) was a paragraph under the map that had to be studied
  // (CRITIQUE U19): it opens behind an info button now. The key itself is still the release's (UI.wrLegend)
  const key = UI.wrLegend;
  if (typeof key === 'function') {
    G.warKey = () => `<div class="tip-h">What the marks mean</div><div class="legend wr-legend tt-key">${key.call(UI)}</div>`;
    UI.wrLegend = () => `<button type="button" class="tt-i" data-tt="warKey" aria-haspopup="dialog" aria-expanded="false" aria-label="Map key: what the marks on the war map mean">ⓘ</button> <span class="tiny muted">Map key</span>`;
  }

  // after a redraw, and after any change to the page that a feature makes on its own
  const init = TT.init;
  TT.init = function () {
    const r = init.apply(this, arguments);
    if (TT.mo || typeof MutationObserver === 'undefined' || typeof document === 'undefined') return r;
    let queued = false;
    TT.mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => { queued = false; TT.sweepAll(document.body); });
    });
    TT.mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['title', 'data-note'] });
    TT.sweepAll(document.body);
    return r;
  };
  UI.tipsInit = TT.init;

  TT.CSS3 = `
  .lk-acts > .act[aria-disabled=true]{color:var(--ink-3);background:var(--surface);box-shadow:none;cursor:pointer}
  .tt-note{cursor:pointer}
  .tt-note-i{border-bottom:1px dotted var(--accent-line)}
  .tt-note-b:not(.tt-note-c)::after,.tt-note-m::after{content:" \\24D8";color:var(--accent-2);font-size:.95em;opacity:.85}
  .tt-note.tt-on{color:var(--accent-2)}
  .tt-i{cursor:pointer;color:var(--accent-2)}
  :root button.tt-i{display:inline-flex;align-items:center;justify-content:center;min-width:24px;min-height:24px;width:auto;height:auto;margin:0 0 0 2px;padding:0 3px;border:0;border-radius:50%;background:none;box-shadow:none;color:var(--accent-2);font:inherit;font-size:16px;line-height:1;vertical-align:middle}
  :root button.tt-i:hover{background:none;color:var(--accent)}
  span.tt-i{display:inline-block;min-width:24px;height:20px;line-height:20px;text-align:center;font-size:16px;vertical-align:middle}
  .tt-i:focus-visible{outline:2px solid var(--focus);outline-offset:1px}
  @media (pointer:coarse){:root button.tt-i{min-width:44px;min-height:44px;display:inline-flex}span.tt-i{min-width:44px;padding:12px 0;margin:-12px 0}}
  /* B5 (H-014's open follow-up): an info button beside an action in a grid or a column of flex is out of the flow, at the
     parent's foot, so it is never one more cell or row (a decision card, a phone table cell, the plan grid). The
     test ttInfoNoCell holds every info button to this. */
  .card.dec,.plan-grid,td.ph-act{position:relative}
  :root :is(.card.dec,.plan-grid,td.ph-act) > button.tt-i{position:absolute;right:2px;bottom:2px;margin:0}
  `;
  const css = TT.css;
  TT.css = function () {
    if (css) css.apply(this, arguments);
    if (typeof document === 'undefined' || document.getElementById('tt-css3')) return;
    const st = document.createElement('style'); st.id = 'tt-css3'; st.textContent = TT.CSS3; document.head.appendChild(st);
  };
})();
