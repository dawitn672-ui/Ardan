// 91-look, part 5: one <style id="look-style"> built from the parts above, kept last in <head> so that at equal
// weight its rules win over the release's and the other features' (some of which add their own styles at UI.init or on
// a first draw); and the reshaping of look.d-dom.core.js run after every draw, after 90-fold's.
(function () {
  const LOOK = UI.LOOK;
  LOOK.ORDER = ['tokens', 'base', 'layout'];
  LOOK.cssText = () => LOOK.ORDER.map(k => LOOK.css[k] || '').join('\n') + Object.keys(LOOK.css).filter(k => !LOOK.ORDER.includes(k)).map(k => LOOK.css[k]).join('\n');
  LOOK.keepLast = function () {
    if (typeof document === 'undefined' || !document.head) return;
    let st = document.getElementById('look-style');
    if (!st) { st = document.createElement('style'); st.id = 'look-style'; st.textContent = LOOK.cssText(); }
    if (document.head.lastElementChild !== st) document.head.appendChild(st);
  };
  if (typeof document !== 'undefined') { if (document.head) LOOK.keepLast(); else document.addEventListener('DOMContentLoaded', LOOK.keepLast); }
  for (const k of ['render', 'refresh', 'refreshTab', 'renderModal']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () { const r = f.apply(this, arguments); LOOK.apply(); return r; };
  }
  // a theme switch changes every colour at once: with the release's 1 ms transition floor (reduced motion) the change
  // rippled down the tree a frame per level, about 0.2 s, and a screen read in that time had old colours on new ones
  if (typeof UI.applySettings === 'function') {
    const apply = UI.applySettings;
    UI.applySettings = function () {
      const d = typeof document !== 'undefined' && document.documentElement, was = d && d.dataset.theme;
      const r = apply.apply(this, arguments);
      try {
        if (d && was && d.dataset.theme !== was) {
          d.classList.add('lk-theming');
          void d.offsetWidth;   // the new colours land with transitions off
          requestAnimationFrame(() => requestAnimationFrame(() => d.classList.remove('lk-theming')));
        }
      } catch (e) {}
      return r;
    };
  }
  // one first-run hint at a time (cycle 1 visual B2): while an event waits, its odds hint is the one shown, and the
  // panel's hint waits for the next draw. Reads the queue only, so drawing stays pure.
  if (typeof UI.hintBox === 'function') {
    const hb = UI.hintBox;
    UI.hintBox = function (where, pc, float) {
      if (where !== 'event') { const q = A.S && A.S.queue && A.S.queue[0]; if (q && q.type === 'event' && UI.hintFor && UI.hintFor('event', A.pc())) return ''; }
      return hb.apply(this, arguments);
    };
  }
  // test affordances only while a playtest runs (cycle 1 visual B11): the title's "Playtest mode" link and the floating
  // report flag (the Menu keeps both "Playtest mode" and "Report a problem"). <html data-pt> says a playtest is under
  // way: UI.pt.on, or ?playtest in the address for a usability session.
  LOOK.ptMark = function () {
    try {
      const d = document.documentElement, on = !!(UI.pt && UI.pt.on) || /[?&]playtest\b/.test(location.search || '');
      if (on) d.dataset.pt = '1'; else delete d.dataset.pt;
    } catch (e) {}
  };
  if (typeof UI.ptPaint === 'function') {
    const pp = UI.ptPaint;
    UI.ptPaint = function () { const r = pp.apply(this, arguments); LOOK.ptMark(); return r; };
  }
  if (typeof document !== 'undefined') LOOK.ptMark();
  if (typeof UI.init === 'function') {
    const init = UI.init;
    UI.init = function () { const r = init.apply(this, arguments); try { LOOK.keepLast(); } catch (e) {} return r; };
  }
})();
