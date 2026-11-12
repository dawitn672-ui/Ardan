// 999999-one-redraw (round 2 A1, docs/CRITIQUE.md P2, P5, P7, P21, T3): one owner of redrawing while time moves.
//
// Before: a Next month press redrew the whole page three to six times (each slice's UI.clkLight redrew the tab when the
// story grew or 1.5 s of wall time had passed; each card refreshed the page when it opened and again when it closed),
// and every refresh rebuilt a story log of up to 40 years (1,600 nodes at year 50). Now:
//   - while a step runs, only the clock is painted, and only its progress bar unless what it says has changed;
//   - at a card, only the card (UI.renderModal) and the clock: the page behind it is marked dirty, not redrawn;
//   - when the step ends, one UI.refresh draws everything once (the step's own end(true), or this file's catch-up when
//     a step ended without one);
//   - the story log holds the last UI.LOG_YEARS years in the page (the rest behind "Show earlier years") and is
//     updated in place: years that left the window are removed, new lines are appended, nothing else is touched.
//
// The step itself (84-top-bar's slices, 99992-v2-time's month) is unchanged: the same days run in the same order, and
// nothing here reads A.rand or writes A.S. B6 (Next year) runs on the same stepper: a year is month turns one after
// another with this policy in force, so it costs one redraw at the end however many months it spans.
(function () {
  if (typeof UI === 'undefined' || !UI.A || typeof document === 'undefined') return;
  const ST = UI.stepper;
  if (!ST) return;
  const R = UI.REDRAW = { dirty: false, full: 0, lite: 0, ticks: 0, paints: 0, inFull: 0, clkKey: null, log: null };
  UI.LOG_YEARS = 2;
  // a step is under way on the game screen: the page behind waits for the step's end
  const live = () => !!(ST.run && UI.screen === 'game' && A.S);
  const sameLayout = () => { const g = document.getElementById('game'); return !!g && g.classList.contains('phone') === !!(UI.isPhone && UI.isPhone()); };
  R.live = live;

  // the page behind the dialog is as the last full draw left it: the page's post-draw passes (90's folds, 91's fitting)
  // have nothing new to do
  R.frozen = () => live() && !R.inFull;
  // how deep in draws we are: the post-draw passes (90, 91, 95, 96, 97, 9998) run once, after the outermost draw, not
  // after each refreshTab and renderModal that UI.refresh calls inside itself
  R.depth = 0;
  const counted = (k, full) => {
    const f = UI[k];
    if (typeof f !== 'function') return;
    UI[k] = function () {
      R.depth++; if (full) R.inFull++;
      try { return f.apply(this, arguments); } finally { R.depth--; if (full) R.inFull--; }
    };
  };
  counted('refreshTab', false); counted('renderModal', false);

  // ---- the page: one full refresh, at the end -----------------------------------------------------------------------
  const refresh0 = UI.refresh;
  UI.refresh = function () {
    if (live() && !R.depth && sameLayout() && !(UI.ov && UI.ov.type === 'warroom')) {
      // a card opens or closes while the step runs: the card and the clock, nothing else
      R.dirty = true; R.lite++;
      UI.renderModal();
      UI.clkPaint();
      return;
    }
    R.dirty = false; R.full++; R.inFull++; R.depth++;
    try { return refresh0.apply(this, arguments); } finally { R.inFull--; R.depth--; }
  };
  // UI.render (the whole screen) leaves nothing dirty
  const render0 = UI.render;
  UI.render = function () {
    R.dirty = false; R.inFull++; R.depth++;
    try { return render0.apply(this, arguments); } finally {
      R.inFull--; R.depth--;
      // the whole screen drew the story itself: the log is adopted as it stands, so the next refresh adds to it in place
      try { const lw = document.getElementById('logwrap'); R.log = lw && lw.firstChild ? { el: lw, html: null, shell: shell(lw), first: lw.firstChild } : null; } catch (e) { R.log = null; }
    }
  };

  // ---- the clock: its progress bar while the step runs ----------------------------------------------------------------
  // The clock's markup without its progress (the only part that moves every slice): when that is unchanged, the bars
  // are set in place and nothing else in the page is touched.
  const SCALE = /scaleX\([^)]*\)/g;
  // the day in the date's spoken label changes every tick of a month whose face shows only the month: the label is set in
  // place, the clock is not redrawn for it
  const TODAY = /aria-label="Today: [^"]*"/g;
  const keyOf = h => h.replace(SCALE, '').replace(TODAY, '');
  const bars = h => { const out = []; let m; const re = /scaleX\(([^)]*)\)/g; while ((m = re.exec(h))) out.push(m[1]); return out; };
  const paint0 = UI.clkPaint;
  UI.clkPaint = function () {
    if (!R.inFull && !ST.run && R.dirty && UI.screen === 'game' && A.S && A.pc && A.pc()) return UI.refresh();   // a step ended without its redraw
    // at a card the clock is painted whole: 99992-v2-time's watch on clkPaint carries the step on once it is answered
    if (!R.inFull && live() && !ST.wait) {
      const el = document.getElementById('clk');
      if (el) {
        const h = UI.clkHtml(), key = keyOf(h);
        if (key === R.clkKey) {
          const v = bars(h), I = el.querySelectorAll('.clk-prog > i');
          for (let i = 0; i < I.length && i < v.length; i++) { const t = `scaleX(${v[i]})`; if (I[i].style.transform !== t) I[i].style.transform = t; }
          const day = /aria-label="Today: ([^"]*)"/.exec(h), d = day && el.querySelector('[aria-label^="Today: "]');
          if (d && d.getAttribute('aria-label') !== 'Today: ' + day[1]) d.setAttribute('aria-label', 'Today: ' + day[1]);
          R.ticks++;
          return;
        }
        if (R.debug) (R.keys = R.keys || []).push([R.clkKey, key]);
        R.clkKey = key; R.paints++;
        return paint0.apply(this, arguments);
      }
    }
    R.clkKey = null; R.paints++;
    return paint0.apply(this, arguments);
  };
  // each slice of a step called UI.clkLight, which redrew the profile, the story and the tab: now the clock alone
  const light0 = UI.clkLight;
  UI.clkLight = function () {
    if (live() && !(UI.ov && UI.ov.type === 'warroom')) { R.dirty = true; return UI.clkPaint(); }
    return light0.apply(this, arguments);
  };

  // ---- the story log: a window of years, updated in place ------------------------------------------------------------
  // a year's key: its heading as drawn (kept on the node, since 99993-v2-stats' sweep may reword the text in the page)
  const yearKey = b => { if (b.dataset.rk != null) return b.dataset.rk; const y = b.querySelector(':scope > .yh'); return y ? y.textContent : ''; };
  const keyAll = frag => { for (const b of frag.querySelectorAll('#log > .ly')) b.dataset.rk = yearKey(b); };
  const lines = b => b.querySelectorAll(':scope > .ll');
  // everything in the wrap but the years themselves (the atlas bar, the "Show earlier years" button, the death bar)
  const shell = frag => {
    let s = '';
    for (const n of frag.childNodes) {
      if (n.nodeType !== 1) continue;
      if (n.id === 'log') { s += '<log ' + [...n.attributes].map(a => a.name + '=' + a.value).join(' ') + '>'; for (const c of n.children) if (!c.classList.contains('ly')) s += c.outerHTML; }
      else s += n.outerHTML;
    }
    return s;
  };
  // fit the page's years to the new ones: true when done in place, false when the wrap must be drawn whole
  const merge = (lw, frag) => {
    const nl = frag.getElementById ? frag.getElementById('log') : frag.querySelector('#log'), ol = lw.querySelector('#log');
    if (!nl || !ol) return false;
    const nb = [...nl.children].filter(b => b.classList.contains('ly')), nk = nb.map(yearKey);
    let ob = [...ol.children].filter(b => b.classList.contains('ly'));
    // years that left the window go; what is left must be the first of the new years, in order
    for (const b of ob) if (!nk.includes(yearKey(b))) b.remove();
    ob = [...ol.children].filter(b => b.classList.contains('ly'));
    if (ob.length > nb.length) return false;
    let added = 0;
    for (let i = 0; i < nb.length; i++) {
      const o = ob[i], n = nb[i];
      if (!o) { ol.appendChild(n); added++; continue; }
      if (yearKey(o) !== nk[i]) return false;
      // a year's lines only ever grow (the story is append-only): the new ones go after the old
      const a = lines(o), b = lines(n);
      if (b.length < a.length) return false;
      for (let j = a.length; j < b.length; j++) { o.appendChild(b[j]); added++; }
    }
    return added;
  };
  const scroll = () => {
    if (R.scrollAsked) return; R.scrollAsked = true;
    // the log's foot in view, read in the frame's own layout (never a forced one in the middle of a redraw)
    requestAnimationFrame(() => { R.scrollAsked = false; const lg = document.getElementById('log'); if (lg) lg.scrollTop = lg.scrollHeight; });
  };
  UI.paintLog = function (lw) {
    if (!lw) return;
    const h = UI.renderLogWrap();
    const mine = R.log && R.log.el === lw && R.log.first === lw.firstChild && lw.firstChild;   // nobody else redrew it
    if (mine && R.log.html === h) return;
    const t = document.createElement('template'); t.innerHTML = h;
    keyAll(t.content);
    const sh = shell(t.content);
    let done = false;
    if (mine && R.log.shell === sh && lw.querySelector('#log')) {
      try { const r = merge(lw, t.content); if (r !== false) { done = true; if (r) scroll(); } } catch (e) { console.error('story log', e); }
    }
    if (!done) { lw.replaceChildren(t.content); scroll(); }
    R.log = { el: lw, html: h, shell: sh, first: lw.firstChild };
  };
  // the years before the window, on demand (the release's "Show earlier years…")
  const all0 = UI.A.logAll;
  UI.A.logAll = function () { R.log = null; return all0.apply(this, arguments); };

  // ---- starting a life (docs/CRITIQUE.md P11): the world takes one to three seconds to make, in one piece. A press of
  // the button first puts up a line saying so and lets it be drawn, then makes the world. Called from code (tests, the
  // bots: no trusted event under way) it starts at once, as before.
  const start0 = UI.startLife;
  if (typeof start0 === 'function') UI.startLife = function () {
    const ev = typeof window !== 'undefined' ? window.event : null;
    if (!ev || !ev.isTrusted || R.starting) return start0.apply(this, arguments);
    const self = this, args = arguments;
    R.starting = true;
    let line = document.getElementById('rd-start');
    if (!line) { line = document.createElement('div'); line.id = 'rd-start'; line.setAttribute('role', 'status'); line.setAttribute('aria-live', 'polite'); document.body.appendChild(line); }
    line.textContent = 'Making the world: its realms, its houses and its people…';
    document.body.setAttribute('aria-busy', 'true');
    const go = () => {
      try { start0.apply(self, args); } finally {
        R.starting = false; document.body.removeAttribute('aria-busy');
        const l = document.getElementById('rd-start'); if (l) l.remove();
      }
    };
    // two frames: the line is painted before the long task begins
    requestAnimationFrame(() => setTimeout(go, 0));
  };
  const css = '#rd-start{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;padding:10px 18px;border-radius:var(--r-m,8px);' +
    'background:var(--raised,#2a2418);color:var(--ink,#f3e9d2);border:1px solid var(--line-strong,#6b5a3a);box-shadow:0 6px 24px rgba(0,0,0,.4);font:600 15px/1.3 var(--f-ui,inherit)}';
  const put = () => { if (document.getElementById('rd-style')) return; const s = document.createElement('style'); s.id = 'rd-style'; s.textContent = css; document.head.appendChild(s); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);

  // ---- a new life or a loaded save starts with nothing dirty ----------------------------------------------------------
  for (const k of ['newGame', 'deserialize']) {
    const f = A[k];
    if (typeof f === 'function') A[k] = function () { R.dirty = false; R.clkKey = null; R.log = null; UI.logAll = false; return f.apply(this, arguments); };
  }
})();
