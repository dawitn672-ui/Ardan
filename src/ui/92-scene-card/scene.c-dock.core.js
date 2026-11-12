// 92-scene-card, part 3: where the card sits, and the keys (brief §5.9, §4.1, §4.3, §4.4).
//
// - Desktop (three columns) and 761 to 1099 px (two columns): the card docks over the story, in the centre column, so the
//   rail's stats and needs and the panel stay in sight while the player chooses. It is as wide as the column (at most
//   720 px) and as tall as its content, up to the column's height; past that its inside scrolls.
// - Phone: a full-screen sheet with its own scroll (71-phone's sheet), the picture across its top, choices of 52 px.
//
// Everything a modal did, the card still does, because it is still the release's #modal: role dialog, aria-modal, the
// page behind inert, Tab kept inside (UI.trapFocus), focus back to where it was when it closes (UI.modalClosed), keys
// 1 to 6 choose (the release's handler, which counts .choices buttons), Escape closes a tooltip first (59) and never
// dismisses an event. Two keys are added: Enter on the result is Continue even when focus is not on the button, and a
// held-down Enter or Space (key repeat) does not fall through Continue into the next card's first choice.
(function () {
  const SC = UI.SCENE;
  const doc = typeof document !== 'undefined' ? document : null;
  SC.isPhone = () => !!(doc && (doc.querySelector('#game.phone') || (UI.isPhone && UI.isPhone())));

  // the centre column's box; the card is placed inside it
  SC.place = function () {
    const m = doc && doc.getElementById('modal');
    if (!m || !m.classList.contains('sc-dock')) return;
    const lw = doc.getElementById('logwrap'), r = lw && lw.getBoundingClientRect();
    if (!r || r.width < 240 || r.height < 240) { m.classList.add('sc-free'); return; }
    m.classList.remove('sc-free');
    const W = Math.min(720, Math.round(r.width - 16)), x = Math.round(r.left + (r.width - W) / 2);
    const set = (k, v) => m.style.setProperty(k, v + 'px');
    set('--sc-x', x); set('--sc-y', Math.round(r.top + 8)); set('--sc-w', W); set('--sc-h', Math.round(r.height - 16));
    set('--col-x', Math.round(r.left)); set('--col-y', Math.round(r.top)); set('--col-w', Math.round(r.width)); set('--col-h', Math.round(r.height));
  };

  // after every draw of the modal: dock or sheet, place, and focus on a new phase
  SC.last = null;      // the card last focused: { q, phase }
  SC.shownAt = 0;      // when the current card's choices appeared (performance.now), for the key-repeat guard
  SC.after = function () {
    if (!doc) return;
    const m = doc.getElementById('modal');
    if (!m) { SC.last = null; return; }
    const card = m.querySelector(':scope > .sc-card');
    m.classList.toggle('sc-on', !!card);
    m.classList.toggle('sc-dock', !!card && !SC.isPhone());
    m.classList.toggle('sc-sheet', !!card && SC.isPhone());
    if (!card) { for (const k of ['--sc-x', '--sc-y', '--sc-w', '--sc-h', '--col-x', '--col-y', '--col-w', '--col-h']) m.style.removeProperty(k); m.classList.remove('sc-free'); SC.last = null; return; }
    SC.place();
    // on the phone, 71-phone moves the report flag into the sheet's corner, where the picture's place name sits: it goes
    // to the end of the title row instead
    if (SC.isPhone()) { const flag = card.querySelector(':scope > .mreport'), head = card.querySelector('.sc-head'); if (flag && head) head.appendChild(flag); }
    const q = A.S && A.S.queue && A.S.queue[0], phase = card.dataset.sc;
    if (!SC.last || SC.last.q !== q || SC.last.phase !== phase) {
      SC.last = { q, phase };
      const ae = doc.activeElement, inPop = ae && ae.closest && ae.closest('.tt-pop');
      if (!inPop) {
        const target = phase === 'result' ? card.querySelector('button[data-a="evClose"]') : card.querySelector('.choices button:not(:disabled)');
        if (target && ae !== target) target.focus({ preventScroll: true });
      }
      if (phase === 'choose') SC.shownAt = performance.now();
      const sc = card.querySelector('.sc-in');
      if (sc) sc.scrollTop = 0;
    }
  };
  const rm = UI.renderModal;
  if (typeof rm === 'function') {
    UI.renderModal = function () {
      const r = rm.apply(this, arguments);
      try { SC.after(); } catch (e) { console.error('scene card dock', e); }
      return r;
    };
  }

  if (doc) {
    // the window or the columns change size: place the card again
    let raf = 0;
    const again = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; try { SC.place(); } catch (e) {} }); };
    window.addEventListener('resize', again);
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(again);
      let watched = null;
      const watch = () => { const lw = doc.getElementById('logwrap'); if (lw && lw !== watched) { if (watched) ro.unobserve(watched); ro.observe(lw); watched = lw; } };
      const render = UI.render;
      if (typeof render === 'function') UI.render = function () { const r = render.apply(this, arguments); try { watch(); } catch (e) {} return r; };
    }
    // keys, in the capture phase so they run before the release's own handler
    doc.addEventListener('keydown', e => {
      const m = doc.getElementById('modal'), card = m && m.querySelector(':scope > .sc-card');
      if (!card || e.defaultPrevented) return;
      const t = e.target, ctl = UI.isControl ? UI.isControl(t) : !!(t && t.closest && t.closest('button, a, input, select, textarea, summary, [tabindex]'));
      if ((e.key === 'Enter' || e.key === ' ') && e.repeat && card.dataset.sc === 'choose' && t && t.closest && t.closest('.choices') && performance.now() - SC.shownAt < 600) {
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (e.key === 'Enter' && card.dataset.sc === 'result' && !ctl && !(t && t.closest && t.closest('.tt-pop'))) {
        const b = card.querySelector('button[data-a="evClose"]');
        // spent here: the release's own Enter on the page (UI.A.age, when no dialog is open) must not also run after it
        if (b) { e.preventDefault(); e.stopPropagation(); b.click(); }
      }
    }, true);
  }
})();
