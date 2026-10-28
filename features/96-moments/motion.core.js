// 96-moments, the motion system (docs/design/brief.md §6): one small library of easings, durations and stagger, and the
// passes that use it after every draw, wherever the state changed:
//   - tab and panel changes: the new panel slides in from the side of the tab you came from, its sections in sequence;
//   - bars that tween from the old value to the new one (the rail's vitals, stats and needs, the step's progress);
//   - numbers that count from the old value to the new one (the rail, the purse in the top bar);
//   - toasts that slide in, and an older toast that steps down the stack;
//   - the map's zoom and jumps, eased (UI.gmDraw and UI.drawWar draw an eased view; the real view is set at once).
// The event card's page turn, its result stamp and the cut-ins' ink are styled in 92-scene-card and moments.core.js on
// the same tokens.
//
// Motion explains a change, so nothing moves on a first draw, a new life or a loaded game, and nothing loops while you
// read. It honours the Motion setting (<html data-motion>, see moments.core.js) and the system's reduced motion: under
// Reduced every move becomes a fade of 120 ms or less (numbers and bars land at once), under Off nothing animates.
//
// Rendering stays pure: this file only reads the game and the page. The values it compares with are UI state here
// (MOT.mem), reset with each life, never in A.S, and it never draws a random number. Animations are CSS on the DOM, or
// requestAnimationFrame on a canvas view; the text and the inline values the game drew are never changed, so tests and
// screen readers read the real numbers at once (a counting number is drawn by a pseudo-element over its own text).
(function () {
  if (typeof document === 'undefined') return;
  const MOT = UI.MOTION = UI.MOTION || {};
  const doc = document;

  // ---- tokens: the brief's table, in milliseconds, and its easings ---------------------------------------------------
  MOT.T = { press: 80, quick: 140, base: 200, enter: 280, exit: 180, snap: 240, moment: 1200, ink: 700, tween: 520, count: 640, view: 260, step: 36, max: 10 };
  MOT.EASE = { std: [0.2, 0.8, 0.2, 1], enter: [0.05, 0.7, 0.1, 1], exit: [0.3, 0, 0.8, 0.15], snap: [0.3, 1.4, 0.5, 1], press: [0.2, 0, 0, 1] };
  MOT.cssEase = k => `cubic-bezier(${(MOT.EASE[k] || MOT.EASE.std).join(',')})`;
  // a cubic Bezier easing as a function of t in [0, 1] (for frames drawn by script)
  MOT.bezier = function (x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 6; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-4 || !d) break; t -= e / d; }
      return Y(Math.max(0, Math.min(1, t)));
    };
  };
  MOT.ease = {};
  for (const k of Object.keys(MOT.EASE)) MOT.ease[k] = MOT.bezier(...MOT.EASE[k]);

  // ---- the mode in force: full, reduced or off ------------------------------------------------------------------------
  MOT.mode = function () {
    const M = UI.MOMENTS;
    if (M && M.mode) return M.mode();
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'full'; } catch (e) { return 'full'; }
  };
  MOT.full = () => MOT.mode() === 'full';

  // ---- primitives -----------------------------------------------------------------------------------------------------
  // play a CSS animation class once: restart it if it is running, and take it off when it ends
  MOT.play = function (el, cls, ms) {
    if (!el || !cls) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    const off = () => el.classList.remove(cls);
    clearTimeout(el['_mo_' + cls]);
    el['_mo_' + cls] = setTimeout(off, (ms || 900) + 200);
  };
  // stagger: each node gets its place in the sequence (--mo-i, at most MOT.T.max) and the class that moves it
  MOT.stagger = function (nodes, cls, opts) {
    const o = opts || {}, max = o.max != null ? o.max : MOT.T.max;
    let i = 0;
    for (const el of nodes) {
      if (!el || !el.style) continue;
      el.style.setProperty('--mo-i', String(Math.min(i, max)));
      MOT.play(el, cls || 'mo-rise', (o.ms || 400) + Math.min(i, max) * MOT.T.step);
      i++;
    }
    return i;
  };
  // a frame-by-frame tween (for a canvas). Under reduced or off it lands at once.
  MOT.animate = function (o) {
    const dur = o.dur || MOT.T.base, ease = MOT.ease[o.ease || 'std'] || MOT.ease.std;
    if (!MOT.full() || typeof requestAnimationFrame !== 'function') { o.step(1); if (o.done) o.done(); return () => {}; }
    let t0 = null, stop = false;
    const frame = now => {
      if (stop) return;
      if (t0 == null) t0 = now;
      const k = Math.min(1, (now - t0) / dur);
      o.step(ease(k));
      if (k < 1) requestAnimationFrame(frame); else if (o.done) o.done();
    };
    requestAnimationFrame(frame);
    return () => { stop = true; };
  };

  // ---- memory of the last values (UI state, one life at a time) ------------------------------------------------------
  MOT.mem = new Map();
  MOT.owner = null;
  const life = () => (A.S ? A.S.pc : null);
  MOT.fresh = function () {
    // a new world, a load or another heir: forget, so nothing moves on the first draw
    if (MOT.owner && MOT.owner.S === A.S && MOT.owner.pc === life()) return false;
    MOT.owner = { S: A.S, pc: life() };
    MOT.mem.clear();
    MOT.lastTab = null;
    return true;
  };

  // ---- bars: from the old width (or scale) to the new -----------------------------------------------------------------
  // each entry names a selector and how to key the bar; other features can push their own
  const rowKey = el => {
    const row = el.closest('.barrow, .lk-need');
    if (!row) return null;
    const lbl = row.querySelector('.lbl');
    return (row.closest('#profile') ? 'p:' : 'b:') + (lbl ? lbl.textContent.trim() : row.className);
  };
  MOT.BARS = [
    { sel: '#profile .barrow > .bar > i, #profile .lk-need > .bar > i', key: rowKey },
    { sel: '#tabbody .phone-profile .barrow > .bar > i', key: rowKey },
    { sel: '#clk .clk-prog > i', key: () => 'clk-prog', scale: true },
  ];
  const fracOf = (el, scale) => {
    if (scale) { const m = /scaleX\(([-\d.]+)\)/.exec(el.style.transform || ''); return m ? +m[1] : null; }
    const w = el.style.width; if (!w || !/%$/.test(w)) return null;
    return parseFloat(w) / 100;
  };
  MOT.bars = function (animate) {
    for (const B of MOT.BARS) {
      for (const el of doc.querySelectorAll(B.sel)) {
        const k = B.key(el); if (!k) continue;
        const v = fracOf(el, B.scale); if (v == null || isNaN(v)) continue;
        const key = 'bar|' + k, was = MOT.mem.get(key);
        MOT.mem.set(key, v);
        if (!animate || was == null || Math.abs(was - v) < 0.004) continue;
        if (B.scale) { el.style.setProperty('--mo-s0', String(was)); el.style.setProperty('--mo-s1', String(v)); MOT.play(el, 'mo-twx', MOT.T.base); continue; }
        if (v <= 0.001) continue;
        el.style.setProperty('--mo-s0', String(Math.max(0, Math.min(4, was / v))));
        MOT.play(el, 'mo-tw', MOT.T.tween);
        // the part gained or lost glows once at the end of the bar
        const row = el.closest('.barrow, .lk-need');
        if (row) { row.dataset.moDir = v > was ? 'up' : 'down'; row.style.setProperty('--mo-w', (v * 100).toFixed(1) + '%'); MOT.play(row, 'mo-twg', MOT.T.tween); }
      }
    }
  };

  // ---- numbers: count from the old value to the new ------------------------------------------------------------------
  MOT.NUMS = [
    { sel: '#profile .barrow > .val, #profile .lk-need > .val', key: el => rowKey(el) },
    { sel: '#topbar .top-coin > b', key: () => 'coin' },
  ];
  // a whole number, optionally followed by a unit ("23 suns"); thousands separators and fractions are left alone
  const NUM_RX = /^\s*(-?\d{1,6})(\s+[A-Za-z]+)?\s*$/;
  MOT.numbers = function (animate) {
    for (const N of MOT.NUMS) {
      for (const el of doc.querySelectorAll(N.sel)) {
        const k = N.key(el); if (!k) continue;
        const m = NUM_RX.exec(el.textContent || ''); if (!m) continue;
        const v = +m[1], key = 'num|' + k, was = MOT.mem.get(key);
        MOT.mem.set(key, v);
        if (!animate || was == null || was === v || Math.abs(was - v) > 99999) continue;
        let c = '';
        try { c = getComputedStyle(el).color; } catch (e) {}
        el.style.setProperty('--mo-n0', String(was));
        el.style.setProperty('--mo-n1', String(v));
        el.style.setProperty('--mo-c', c || 'currentColor');
        el.style.setProperty('--mo-sfx', JSON.stringify(m[2] || ''));
        el.dataset.moDir = v > was ? 'up' : 'down';
        MOT.play(el, 'mo-cnt', MOT.T.count);
      }
    }
  };

  // ---- tabs and panels -------------------------------------------------------------------------------------------------
  MOT.lastTab = null;
  const tabPos = t => {
    try {
      const g = UI.groupOf(t), gi = UI.GROUPS.findIndex(x => x.k === g.k), subs = UI.subsOf(g) || [];
      const si = subs.findIndex(s => (Array.isArray(s) ? s[0] : s.k || s) === t);
      return gi * 10 + Math.max(0, si);
    } catch (e) { return 0; }
  };
  // what enters in sequence in a new panel: its sections, then the tiles and rows inside the first ones
  MOT.SEQ = ['#tabbody > section, #tabbody > .card, #tabbody > .fold', '#tabbody .lk-acts > .act', '#tabbody .card.person.lk-row'];
  MOT.tab = function (animate) {
    const t = UI.screen === 'game' ? UI.tab : null, was = MOT.lastTab;
    MOT.lastTab = t;
    const tb = doc.getElementById('tabbody');
    if (!animate || !tb || t == null || was == null || was === t) return false;
    const dir = Math.sign(tabPos(t) - tabPos(was)) || 1;
    tb.style.setProperty('--mo-dx', (dir * 18) + 'px');
    MOT.play(tb, 'mo-tabin', MOT.T.enter);
    MOT.stagger(doc.querySelectorAll(MOT.SEQ[0]), 'mo-rise', { max: 6 });
    MOT.stagger([...doc.querySelectorAll(MOT.SEQ[1])].slice(0, 36), 'mo-pop', { max: 14, ms: 300 });
    MOT.stagger([...doc.querySelectorAll(MOT.SEQ[2])].slice(0, 24), 'mo-rise', { max: 12 });
    return true;
  };

  // ---- beats: one call for a feature to play a registered move on an element (lane R's backtests §3.1) ----------------
  // UI.MOTION.beat({ kind, el, to, delay, dur }) plays a Web Animation of a registered kind and returns it (or null when
  // motion is not full: the end state is the element as it is). Kinds only touch transform and opacity (stroke-dashoffset
  // for 'draw'); UI.MOTION.KINDS is open for features to add their own.
  MOT.KINDS = {
    enter: () => ({ k: [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], dur: MOT.T.enter, ease: 'enter' }),
    exit: () => ({ k: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(8px)' }], dur: MOT.T.exit, ease: 'exit' }),
    stamp: () => ({ k: [{ opacity: 0, transform: 'scale(1.25)' }, { opacity: 1, transform: 'scale(.96)', offset: .7 }, { opacity: 1, transform: 'none' }], dur: MOT.T.snap, ease: 'snap' }),
    flash: () => ({ k: [{ opacity: 1 }, { opacity: .35 }, { opacity: 1 }], dur: 160, ease: 'std' }),
    wipe: () => ({ k: [{ opacity: 0, transform: 'translateX(-24px) skewX(-8deg)' }, { opacity: 1, transform: 'none' }], dur: 180, ease: 'enter' }),
    draw: o => ({ k: [{ strokeDashoffset: o.len || 120 }, { strokeDashoffset: 0 }], dur: MOT.T.ink, ease: 'std' }),
    // fly: from where the element is to a point o.to = { x, y } (viewport), shrinking and fading as it lands
    fly: o => { const r = o.el.getBoundingClientRect(), dx = o.to.x - (r.left + r.width / 2), dy = o.to.y - (r.top + r.height / 2);
      return { k: [{ opacity: 1, transform: 'none' }, { opacity: 1, transform: `translate(${dx * .55}px, ${dy * .55 - 24}px) scale(.9)`, offset: .55 }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(.5)` }], dur: 620, ease: 'std' }; },
  };
  MOT.beat = function (o) {
    if (!o || !o.el || !o.el.animate || !MOT.full()) return null;
    const K = MOT.KINDS[o.kind]; if (!K) return null;
    const d = K(o);
    return o.el.animate(d.k, { duration: o.dur || d.dur, delay: o.delay || 0, easing: MOT.cssEase(d.ease), fill: 'both' });
  };
  // the result's chips fly to what they changed: a stat to its tile, a vital to its row, coin to the purse
  MOT.flyChips = function (animate) {
    const card = doc.querySelector('#modal .sc-card.sc-land');
    if (!animate || !card || card._moFly) return;
    card._moFly = 1;
    const target = ch => {
      const k = ch.dataset.k || '', st = ch.dataset.st;
      const sel = st ? `#profile .lk-stats .st-${st}` : /^v\./.test(k) ? `#profile .lk-v-${({ happy: 'happiness', fame: 'renown' })[k.slice(2)] || k.slice(2)}` : k === 'coin' ? '#topbar .top-coin' : null;
      const t = sel && doc.querySelector(sel); if (!t) return null;
      const r = t.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    };
    [...card.querySelectorAll('.sc-deltas .sc-d')].slice(0, 6).forEach((ch, i) => {
      const to = target(ch); if (!to) return;
      const r = ch.getBoundingClientRect(); if (!r.width) return;
      const g = ch.cloneNode(true);
      g.classList.add('mo-ghost'); g.setAttribute('aria-hidden', 'true'); g.removeAttribute('id');
      Object.assign(g.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: '0', zIndex: '90', pointerEvents: 'none' });
      doc.body.appendChild(g);
      const a = MOT.beat({ kind: 'fly', el: g, to, delay: 520 + i * 70 });
      if (!a) { g.remove(); return; }
      a.onfinish = a.oncancel = () => g.remove();
    });
  };

  // ---- the passes after each draw --------------------------------------------------------------------------------------
  // other features add their own: UI.MOTION.passes.push({ name, run(animate) })
  MOT.passes = [
    { name: 'tab', run: a => MOT.tab(a) },
    { name: 'bars', run: a => MOT.bars(a) },
    { name: 'numbers', run: a => MOT.numbers(a) },
    { name: 'fly', run: a => MOT.flyChips(a) },
  ];
  MOT.log = [];
  MOT.after = function () {
    if (UI.screen !== 'game' || !A.S) { MOT.owner = null; MOT.lastTab = null; return; }
    const first = MOT.fresh();
    const animate = !first && MOT.mode() === 'full';
    for (const p of MOT.passes) { try { p.run(animate); } catch (e) { console.error('motion ' + p.name, e); } }
  };
  for (const k of ['render', 'refresh', 'refreshTab', 'renderModal', 'clkLight']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () { const r = f.apply(this, arguments); try { MOT.after(); } catch (e) { console.error('motion', e); } return r; };
  }

  // ---- toasts ---------------------------------------------------------------------------------------------------------
  if (typeof UI.toast === 'function') {
    const toast = UI.toast;
    UI.toast = function () {
      const r = toast.apply(this, arguments);
      // after the toast's other wrappers have shown it (the stack, the kind)
      const go = () => {
        try {
          if (MOT.mode() !== 'full') return;
          const t = doc.getElementById('toast');
          if (t && t.textContent) MOT.play(t, 'mo-toast', MOT.T.enter + 120);
          const s = doc.getElementById('toast-stack'), o = s && s.firstElementChild;
          if (o && !o._mo) { o._mo = 1; MOT.play(o, 'mo-drop', MOT.T.enter); }
        } catch (e) {}
      };
      if (typeof queueMicrotask === 'function') queueMicrotask(go); else go();
      return r;
    };
  }

  // ---- the map: zooms and jumps eased --------------------------------------------------------------------------------
  // The view is set at once (the game, the tests and a click read it); only the drawing follows it over 260 ms. A drag
  // keeps the scale, so it is drawn as it goes, with no lag under the hand.
  MOT.views = {};
  const copy = v => ({ x0: v.x0, y0: v.y0, w: v.w, h: v.h });
  const lerpV = (a, b, k) => ({ x0: a.x0 + (b.x0 - a.x0) * k, y0: a.y0 + (b.y0 - a.y0) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });
  MOT.easeMap = function (name, holder, draw) {
    const fn = UI[draw];
    if (typeof fn !== 'function') return;
    UI[draw] = function () {
      const H = holder(), real = H && H.view, st = MOT.views[name] || (MOT.views[name] = { shown: null, anim: null, inFrame: false });
      if (!real || st.inFrame) return fn.apply(this, arguments);
      const last = st.shown;
      const zoomed = last && Math.abs(last.w - real.w) > real.w * 1e-4;
      const moved = last && (Math.abs(last.x0 - real.x0) > real.w * 0.02 || Math.abs(last.y0 - real.y0) > real.h * 0.02);
      // only a zoom or a jump the player asked for (the wheel, a zoom button) is eased; a view set by code is drawn at once
      const asked = st.user && (performance.now() - st.user) < 450;
      if (!last || !asked || !MOT.full() || (!zoomed && !moved) || (!zoomed && st.drag)) {
        if (st.anim) { st.anim(); st.anim = null; }
        st.shown = copy(real);
        return fn.apply(this, arguments);
      }
      if (st.anim) st.anim();
      const from = copy(last), to = copy(real), self = this, args = arguments;
      const frame = k => {
        const H2 = holder(); if (!H2 || !H2.view) return;
        const keep = H2.view, v = lerpV(from, to, k);
        st.shown = v;
        H2.view = v; st.inFrame = true;
        try { fn.apply(self, args); } finally { st.inFrame = false; H2.view = keep; }
      };
      frame(0);
      st.anim = MOT.animate({ dur: MOT.T.view, ease: 'std', step: frame, done: () => { st.anim = null; st.shown = copy(to); } });
      return undefined;
    };
  };
  MOT.easeMap('gm', () => UI.gm, 'gmDraw');
  MOT.easeMap('wr', () => UI.wr, 'drawWar');
  // a drag pans at once: the pointer marks it
  doc.addEventListener('pointerdown', e => { const id = e.target && e.target.id; if (id === 'gmap' && MOT.views.gm) MOT.views.gm.drag = true; if (id === 'warmap' && MOT.views.wr) MOT.views.wr.drag = true; }, true);
  doc.addEventListener('pointerup', () => { for (const k in MOT.views) MOT.views[k].drag = false; }, true);
  const asked = () => { const t = performance.now(); for (const k of ['gm', 'wr']) (MOT.views[k] || (MOT.views[k] = { shown: null, anim: null, inFrame: false })).user = t; };
  doc.addEventListener('wheel', e => { const id = e.target && e.target.id; if (id === 'gmap' || id === 'warmap') asked(); }, { capture: true, passive: true });
  doc.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('[data-a=gmZoom], [data-a=wrZoom], .mapzoom button, .wr-zoom button'); if (b) asked(); }, true);
  doc.addEventListener('keydown', e => { if (['+', '-', '=', '_'].includes(e.key) && doc.querySelector('#gmap, #warmap')) asked(); }, true);

  // ---- the look -------------------------------------------------------------------------------------------------------
  // full(css): only when motion is full (the system's, or the setting's); the !important beats the release's 1 ms
  // floor under a reduced system when the setting says Full. reduced(css): the fades that stand in.
  const FULL_ON = [':root:not([data-motion])', ':root[data-motion=full]'];
  const full = css => `@media (prefers-reduced-motion:no-preference){${css.replace(/@@/g, FULL_ON[0])}}\n${css.replace(/@@/g, FULL_ON[1])}`;
  const reduced = css => `@media (prefers-reduced-motion:reduce){${css.replace(/@@/g, ':root:not([data-motion])')}}\n${css.replace(/@@/g, ':root[data-motion=reduced]')}`;
  const E = MOT.cssEase;
  MOT.CSS = `
@property --mo-n{syntax:'<integer>';inherits:false;initial-value:0}
:root{--mo-press:${MOT.T.press}ms;--mo-quick:${MOT.T.quick}ms;--mo-base:${MOT.T.base}ms;--mo-enter:${MOT.T.enter}ms;--mo-exit:${MOT.T.exit}ms;--mo-snap:${MOT.T.snap}ms;--mo-step:${MOT.T.step}ms;
  --mo-e-std:${E('std')};--mo-e-enter:${E('enter')};--mo-e-exit:${E('exit')};--mo-e-snap:${E('snap')};--mo-e-press:${E('press')}}
.mo-ghost{display:inline-flex;align-items:center;gap:4px;padding:0 8px;box-sizing:border-box;border-radius:999px;background:var(--raised);border:1px solid var(--line-strong);
  font:600 12px/1 var(--f-ui,sans-serif);color:var(--ink);list-style:none;white-space:nowrap;overflow:hidden;box-shadow:0 0 14px rgba(240,192,98,.45)}
.mo-ghost.sc-up{color:var(--ok)} .mo-ghost.sc-down{color:var(--danger)} .mo-ghost svg{width:14px;height:14px;flex:none}
@keyframes moTabIn{from{opacity:0;transform:translateX(var(--mo-dx,18px))}to{opacity:1;transform:none}}
@keyframes moRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes moPop{0%{opacity:0;transform:translateY(6px) scale(.94)}100%{opacity:1;transform:none}}
@keyframes moFadeIn{from{opacity:0}to{opacity:1}}
@keyframes moTween{from{transform:scaleX(var(--mo-s0,1))}to{transform:scaleX(1)}}
@keyframes moTweenX{from{transform:scaleX(var(--mo-s0,0))}to{transform:scaleX(var(--mo-s1,1))}}
@keyframes moGlowUp{0%,40%{opacity:0}60%{opacity:.9}100%{opacity:0}}
@keyframes moCount{from{--mo-n:var(--mo-n0)}to{--mo-n:var(--mo-n1)}}
@keyframes moNumPop{0%{transform:none}55%{transform:translateY(-2px) scale(1.12)}100%{transform:none}}
@keyframes moToast{0%{opacity:0;transform:translateX(28px) skewX(-6deg)}60%{opacity:1;transform:translateX(-4px)}100%{opacity:1;transform:none}}
@keyframes moDrop{from{transform:translateY(-100%);opacity:.4}to{transform:none}}
${full(`
@@ #tabbody.mo-tabin{animation:moTabIn ${MOT.T.enter}ms ${E('enter')} both!important}
@@ .mo-rise{animation:moRise ${MOT.T.enter}ms ${E('enter')} calc(var(--mo-i,0) * ${MOT.T.step}ms + 40ms) both!important}
@@ .mo-pop{animation:moPop 240ms ${E('enter')} calc(var(--mo-i,0) * 18ms + 80ms) both!important}
@@ .bar > i.mo-tw{transform-origin:left center;animation:moTween ${MOT.T.tween}ms ${E('std')} both!important}
@@ .clk-prog > i.mo-twx{animation:moTweenX ${MOT.T.base}ms linear both!important}
@@ .mo-twg > .bar{position:relative}
@@ .mo-twg > .bar::after{content:"";position:absolute;right:auto;top:-1px;bottom:-1px;width:8px;border-radius:3px;pointer-events:none;
  left:calc(var(--mo-w,100%) - 4px);background:var(--ok);box-shadow:0 0 8px var(--ok);animation:moGlowUp ${MOT.T.tween + 200}ms ease-out both!important}
@@ .mo-twg[data-mo-dir=down] > .bar::after{background:var(--danger);box-shadow:0 0 8px var(--danger)}
@@ .mo-cnt{position:relative;color:transparent!important}
@@ .mo-cnt::after{content:counter(mo-n) var(--mo-sfx,"");counter-reset:mo-n var(--mo-n);position:absolute;inset:0;color:var(--mo-c,currentColor);white-space:nowrap;text-align:inherit;
  font:inherit;font-variant-numeric:tabular-nums;animation:moCount ${MOT.T.count}ms ${E('std')} both,moNumPop ${MOT.T.count}ms ${E('snap')} both!important}
@@ #profile .barrow > .val.mo-cnt::after, @@ #profile .lk-need > .val.mo-cnt::after{text-align:right}
@@ #toast.mo-toast{animation:moToast ${MOT.T.enter + 100}ms ${E('snap')} both!important}
@@ #toast-stack > .toast-old.mo-drop{animation:moDrop ${MOT.T.enter}ms ${E('enter')} both!important}
`)}
${reduced(`
@@ #tabbody.mo-tabin, @@ .mo-rise, @@ .mo-pop, @@ #toast.mo-toast{animation:moFadeIn 120ms linear both}
`)}
:root[data-motion=off] .mo-tabin, :root[data-motion=off] .mo-rise, :root[data-motion=off] .mo-pop, :root[data-motion=off] .mo-tw, :root[data-motion=off] .mo-twx,
:root[data-motion=off] .mo-toast, :root[data-motion=off] .mo-drop{animation:none!important}
`;
  MOT.install = function () {
    if (!doc.head || doc.getElementById('mot-style')) return;
    const st = doc.createElement('style'); st.id = 'mot-style'; st.textContent = MOT.CSS; doc.head.appendChild(st);
  };
  if (doc.head) MOT.install(); else doc.addEventListener('DOMContentLoaded', MOT.install);
})();
