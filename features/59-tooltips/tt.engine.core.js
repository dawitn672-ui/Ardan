// Nested tooltips (Road to Ten, UI and UX 2): the engine.
//
// Any element with data-tt="key" (and data-v="arg") opens a popover on hover, on tap or click, or on Enter or Space
// when it has focus. Inside a popover, keywords are data-tt links of their own and open the next popover, up to six
// deep. Esc closes the top one and gives focus back to what opened it, a click outside closes them all, and a click
// in a lower popover closes the ones above it. The release's own data-tip="key:arg" anchors (UI.tip, the tier chip)
// go through the same engine, so there is one stack and one set of listeners, not two.
//
// The content of key k is UI.TIPS[k](arg), a pure function that returns HTML (see tt.glossary.core.js). Showing a
// popover only reads the game: it never changes A.S and never draws a random number.
//
// ARIA: the trigger is role="button" with aria-haspopup="dialog", aria-expanded and aria-controls; the popover is a
// non-modal role="dialog" labelled by its heading. A tooltip proper may not hold links, and these do.
(function () {
  const TT = UI.TT = UI.TT || {};
  TT.MAX = 6;               // popovers open at once
  TT.HOVER_CLOSE = 320;     // ms after the pointer leaves before hover-opened popovers close
  TT.stack = [];            // [{ a: anchor, el: popover, how: 'hover' | 'click' | 'key', sel }]
  TT.wired = true;          // the wrappers in tt.wire.core.js add triggers only while this is on (the tests count both)

  const SEL = '[data-tt],[data-tip]';
  const esc = s => UI.esc(String(s));

  // a focusable trigger around a label (the label is HTML the caller built and escaped)
  UI.tt = (key, arg, label, o = {}) => `<span class="tt${o.cls ? ' ' + o.cls : ''}" data-tt="${esc(key)}"${arg != null ? ` data-v="${esc(arg)}"` : ''} tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false"${o.aria ? ` aria-label="${esc(o.aria)}"` : ''}>${label}</span>`;
  // the attributes that make an existing element a trigger; focusable unless it sits inside an action ([data-a])
  UI.ttAttrs = (key, arg, focus = true) => ` data-tt="${esc(key)}"${arg != null ? ` data-v="${esc(arg)}"` : ''}${focus ? ' tabindex="0" role="button" aria-haspopup="dialog" aria-expanded="false"' : ''}`;

  // what an anchor asks for: [key, arg]
  TT.spec = a => {
    if (a.dataset.tt) return [a.dataset.tt, a.dataset.v != null ? a.dataset.v : ''];
    const s = a.dataset.tip || '', i = s.indexOf(':');
    return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)];
  };
  TT.html = function (key, arg) {
    const f = UI.TIPS && UI.TIPS[key];
    if (typeof f !== 'function') return '';
    try { return f(arg) || ''; } catch (e) { console.error('tooltip ' + key, e); return ''; }
  };
  // a selector that finds the same anchor again after the view is redrawn
  TT.selOf = a => a.dataset.tt
    ? `[data-tt="${CSS.escape(a.dataset.tt)}"]` + (a.dataset.v != null ? `[data-v="${CSS.escape(a.dataset.v)}"]` : ':not([data-v])')
    : `[data-tip="${CSS.escape(a.dataset.tip)}"]`;

  // the level an anchor opens: one above the popover it sits in
  TT.levelOf = a => { const p = a.closest && a.closest('.tt-pop'); return p ? +p.dataset.lvl + 1 : 1; };
  const popOf = el => el && el.closest ? el.closest('.tt-pop') : null;

  TT.pop = function (lvl) {
    let el = document.getElementById('tt-pop-' + lvl);
    if (!el) {
      el = document.createElement('div');
      el.id = 'tt-pop-' + lvl;
      el.className = 'tip-pop tt-pop';
      el.dataset.lvl = lvl;
      el.setAttribute('role', 'dialog');
      el.setAttribute('tabindex', '-1');
      el.hidden = true;
      document.body.appendChild(el);
    }
    return el;
  };

  TT.open = function (a, lvl, how) {
    lvl = Math.min(lvl || TT.levelOf(a), TT.MAX);
    const [key, arg] = TT.spec(a), body = TT.html(key, arg);
    if (!body) return null;
    TT.close(lvl);
    const el = TT.pop(lvl);
    el.innerHTML = `<button type="button" class="tt-x" data-tt-close="${lvl}" aria-label="Close">×</button>` + body;
    const h = el.querySelector('.tip-h');
    if (h) { h.id = el.id + '-h'; el.setAttribute('aria-labelledby', h.id); el.removeAttribute('aria-label'); }
    else { el.removeAttribute('aria-labelledby'); el.setAttribute('aria-label', (a.textContent || key).trim().slice(0, 60)); }
    el.classList.toggle('tt-deep', lvl > 1);
    el.hidden = false;
    a.setAttribute('aria-expanded', 'true');
    a.setAttribute('aria-controls', el.id);
    a.classList.add('tt-on');
    TT.stack[lvl - 1] = { a, el, how, sel: TT.selOf(a) };
    TT.place(lvl);
    if (UI.hintUsed) UI.hintUsed.tip = 1;
    return el;
  };

  // close level lvl and everything above it
  TT.close = function (lvl = 1) {
    while (TT.stack.length >= lvl) {
      const s = TT.stack.pop();
      if (!s) continue;
      s.el.hidden = true;
      s.el.innerHTML = '';
      if (s.a) { s.a.setAttribute('aria-expanded', 'false'); s.a.removeAttribute('aria-controls'); s.a.classList.remove('tt-on'); }
    }
  };
  TT.closeAll = () => TT.close(1);
  TT.depth = () => TT.stack.length;

  // level 1 sits under its anchor (or over it); a deeper one sits beside the popover below it, or under its
  // anchor when the screen is too narrow for two side by side
  TT.place = function (lvl) {
    const s = TT.stack[lvl - 1]; if (!s) return;
    const el = s.el, W = window.innerWidth, H = window.innerHeight, w = Math.min(330, W - 16);
    el.style.width = w + 'px';
    el.style.left = '0px'; el.style.top = '0px';
    const r = s.a.getBoundingClientRect(), h = el.offsetHeight;
    let x, y;
    const below = TT.stack[lvl - 2];
    if (below && W >= 2 * w + 40) {
      const p = below.el.getBoundingClientRect();
      x = p.right + 6 + w <= W - 8 ? p.right + 6 : p.left - w - 6 >= 8 ? p.left - w - 6 : W - 8 - w;
      y = r.top - 10;
    } else {
      x = r.left;
      y = r.bottom + 6;
      if (y + h > H - 8 && r.top - 6 - h >= 8) y = r.top - 6 - h;
    }
    x = Math.max(8, Math.min(x, W - 8 - w));
    y = Math.max(8, Math.min(y, H - 8 - h));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  };

  // after the view is redrawn, point each open popover at the new copy of its anchor
  TT.relink = function () {
    for (let i = 0; i < TT.stack.length; i++) {
      const s = TT.stack[i];
      if (!s || s.a.isConnected) continue;
      const scope = i ? TT.stack[i - 1].el : document;
      let n = null;
      for (const c of scope.querySelectorAll(s.sel)) if (i || !popOf(c)) { n = c; break; }
      if (!n) continue;
      s.a = n;
      n.setAttribute('aria-expanded', 'true');
      n.setAttribute('aria-controls', s.el.id);
      n.classList.add('tt-on');
    }
  };

  const focusables = el => [...el.querySelectorAll('[data-tt][tabindex="0"],[data-tip][tabindex="0"],button,[href]')].filter(x => !x.disabled && !x.hidden);
  const isAnchor = t => t && t.closest ? t.closest(SEL) : null;

  // ---- the listeners (one of each, delegated from the window)
  let hoverT = 0;
  const trimHover = keep => {
    clearTimeout(hoverT);
    hoverT = setTimeout(() => {
      while (TT.stack.length > keep && TT.stack[TT.stack.length - 1].how === 'hover') TT.close(TT.stack.length);
    }, TT.HOVER_CLOSE);
  };
  TT.onOver = function (e) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    const t = e.target, a = isAnchor(t), pop = popOf(t), inLvl = pop ? +pop.dataset.lvl : 0;
    if (pop && inLvl > TT.stack.length) return;           // a popover that is closing
    if (a && !a.closest('[aria-disabled="true"]')) {
      const lvl = TT.levelOf(a);
      clearTimeout(hoverT);
      if (lvl > TT.MAX) return;
      const cur = TT.stack[lvl - 1];
      if (!cur || cur.a !== a) {
        if (cur && cur.how !== 'hover' && !pop) return;       // a pinned popover stays until it is dismissed
        TT.open(a, lvl, 'hover');
      }
      return;
    }
    if (!TT.stack.length) return;
    trimHover(inLvl);
  };
  TT.onClick = function (e) {
    const t = e.target;
    const x = t.closest && t.closest('[data-tt-close]');
    if (x) { const l = +x.dataset.ttClose, s = TT.stack[l - 1]; TT.close(l); s && s.a.isConnected && s.a.focus(); return; }
    const a = isAnchor(t), pop = popOf(t);
    if (a && !(a.closest('[data-a]') && !pop)) {
      const lvl = TT.levelOf(a), cur = TT.stack[lvl - 1];
      if (cur && cur.a === a && cur.how !== 'hover') { TT.close(lvl); return; }
      if (cur && cur.a === a) { cur.how = 'click'; TT.close(lvl + 1); return; }  // hovered, now pinned
      TT.open(a, lvl, 'click');
      return;
    }
    if (pop) { TT.close(+pop.dataset.lvl + 1); return; }
    if (TT.stack.length) TT.closeAll();
  };
  TT.onKey = function (e) {
    if (e.key === 'Escape' && TT.stack.length) {
      const s = TT.stack[TT.stack.length - 1];
      TT.close(TT.stack.length);
      if (s.a && s.a.isConnected) s.a.focus();
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    const t = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && t && t.matches && t.matches('[data-tt][tabindex],[data-tip][tabindex]') && !t.matches('[data-a]')) {
      e.preventDefault(); e.stopImmediatePropagation();
      const lvl = TT.levelOf(t), cur = TT.stack[lvl - 1];
      if (cur && cur.a === t && cur.how !== 'hover') { TT.close(lvl); return; }
      const el = TT.open(t, lvl, 'key');
      if (el) el.focus();
      return;
    }
    if (e.key === 'Tab' && TT.stack.length) {
      const top = TT.stack[TT.stack.length - 1].el;
      if (!top.contains(t)) return;
      // focus stays in the open popover (a dialog); Esc goes back down
      const L = [top, ...focusables(top)], i = L.indexOf(t);
      const n = L[(i + (e.shiftKey ? -1 : 1) + L.length) % L.length];
      e.preventDefault();
      n.focus();
    }
  };
  TT.onFocus = function (e) {
    const t = e.target;
    if (!TT.stack.length || popOf(t)) return;
    if (TT.stack.some(s => s.a === t)) return;
    TT.closeAll();
  };
  TT.onResize = () => { for (let l = 1; l <= TT.stack.length; l++) TT.place(l); };

  TT.init = function () {
    if (TT.ready || typeof window === 'undefined') return;
    TT.ready = true;
    window.addEventListener('pointerover', TT.onOver, true);
    window.addEventListener('click', TT.onClick, true);
    window.addEventListener('keydown', TT.onKey, true);
    window.addEventListener('focusin', TT.onFocus, true);
    window.addEventListener('resize', TT.onResize);
    TT.css();
  };

  // ---- the look: a small panel of the binding, tooled leather with gilt corners; vellum and ink in the light theme
  TT.CSS = `
  .tt-pop{position:fixed;z-index:130;max-width:330px;padding:12px 14px 10px;color:var(--tt-ink);font-family:var(--fb);font-size:var(--fs-2);line-height:var(--lh-ui);
    --tt-bg:#1d1610;--tt-ink:#f1e5c8;--tt-ink2:#d4c29c;--tt-ink3:#b9a77f;--tt-gold:#e9c877;--tt-line:rgba(216,174,85,.5);--tt-rule:rgba(216,174,85,.22);--tt-fit:rgba(222,182,96,.7);
    background:linear-gradient(var(--tt-fit),var(--tt-fit)) left 4px top 4px/10px 1.5px no-repeat,linear-gradient(var(--tt-fit),var(--tt-fit)) left 4px top 4px/1.5px 10px no-repeat,
      linear-gradient(var(--tt-fit),var(--tt-fit)) right 4px top 4px/10px 1.5px no-repeat,linear-gradient(var(--tt-fit),var(--tt-fit)) right 4px top 4px/1.5px 10px no-repeat,
      linear-gradient(var(--tt-fit),var(--tt-fit)) left 4px bottom 4px/10px 1.5px no-repeat,linear-gradient(var(--tt-fit),var(--tt-fit)) left 4px bottom 4px/1.5px 10px no-repeat,
      linear-gradient(var(--tt-fit),var(--tt-fit)) right 4px bottom 4px/10px 1.5px no-repeat,linear-gradient(var(--tt-fit),var(--tt-fit)) right 4px bottom 4px/1.5px 10px no-repeat,
      linear-gradient(180deg,rgba(255,236,196,.05),transparent 70px),var(--tt-bg);
    border:1px solid var(--tt-line);border-radius:6px;box-shadow:inset 0 0 0 2px var(--tt-bg),inset 0 0 0 3px var(--tt-rule),0 8px 22px rgba(0,0,0,.5),0 22px 50px rgba(0,0,0,.45)}
  .tt-pop.tt-deep{z-index:131;--tt-bg:#231a12}
  [data-theme=light] .tt-pop{--tt-bg:#f6ecd4;--tt-ink:#2b1d10;--tt-ink2:#4a3620;--tt-ink3:#5c4529;--tt-gold:#6b4410;--tt-line:#a98f63;--tt-rule:rgba(107,68,16,.25);--tt-fit:rgba(107,68,16,.65);box-shadow:inset 0 0 0 2px var(--tt-bg),inset 0 0 0 3px var(--tt-rule),0 6px 18px rgba(60,40,10,.3)}
  [data-theme=light] .tt-pop.tt-deep{--tt-bg:#efe2c3}
  .tt-pop:focus{outline:none}.tt-pop:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
  .tt-pop .tip-h{font-family:var(--fh);font-size:var(--fs-2);letter-spacing:.05em;color:var(--tt-gold);margin:0 22px 6px 0;line-height:1.25}
  .tt-pop .tip-h b{color:var(--tt-ink);font-weight:700}
  .tt-pop .tip-h .muted{color:var(--tt-ink3);font-family:var(--fb);letter-spacing:0}
  .tt-pop .tip-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:1px 0;color:var(--tt-ink)}
  .tt-pop .tip-row b{font-variant-numeric:tabular-nums;color:var(--tt-ink)}
  .tt-pop .tip-row.tt-sum{border-top:1px solid var(--tt-rule);margin-top:3px;padding-top:3px}
  .tt-pop .tip-row.tt-sum span{font-family:var(--fh);font-size:var(--fs-1);letter-spacing:.05em;color:var(--tt-ink2)}
  .tt-pop .tip-row.tt-sub{padding-left:10px;font-size:var(--fs-1);color:var(--tt-ink2)}
  .tt-pop .tip-row.tt-sub b{color:var(--tt-ink2);font-weight:600}
  .tt-pop .tip-d{color:var(--tt-ink2);font-size:var(--fs-1);margin:0 0 4px}
  .tt-pop .tip-f{color:var(--tt-ink3);font-size:var(--fs-1);margin-top:6px;border-top:1px solid var(--tt-rule);padding-top:5px}
  .tt-pop .tt-feeds{margin-top:5px;font-size:var(--fs-1);color:var(--tt-ink2)}
  .tt-pop .tt-feeds i{font-style:normal;font-family:var(--fh);letter-spacing:.05em;color:var(--tt-ink3)}
  .tt-pop .tt-on-row{color:var(--tt-gold)}
  .tt-pop .tt,.tt-pop .tipt{color:var(--tt-ink);border-bottom:1px solid var(--tt-line);cursor:pointer}
  .tt-pop .tt:hover,.tt-pop .tipt:hover,.tt-pop .tt.tt-on,.tt-pop .tipt.tt-on{color:var(--tt-gold);border-bottom-color:var(--tt-gold)}
  .tt-pop .tt-x{position:absolute;top:5px;right:6px;min-width:0;min-height:0;width:22px;height:22px;padding:0;border:0;background:none;box-shadow:none;color:var(--tt-ink3);font-size:16px;line-height:20px;cursor:pointer}
  .tt-pop .tt-x:hover{color:var(--tt-gold);background:none}
  @media (pointer:coarse){.tt-pop .tt-x{width:32px;height:32px;top:0;right:0;font-size:20px}.tt-pop .tt,.tt-pop .tipt{display:inline-block;padding:2px 0}}
  .tt{cursor:help;border-bottom:1px dotted var(--accent-line)}
  .tt:focus-visible,[data-tt][tabindex]:focus-visible{outline:2px solid var(--focus);outline-offset:2px;border-radius:3px}
  .tt.tt-on,.tipt.tt-on,[data-tt].tt-on{color:var(--accent-2)}
  .barrow .val[data-tt],.prow[data-tt],.opbar[data-tt]{cursor:help}
  .chip[data-tt]{cursor:help}
  `;
  TT.css = function () {
    if (typeof document === 'undefined' || document.getElementById('tt-css')) return;
    const st = document.createElement('style'); st.id = 'tt-css'; st.textContent = TT.CSS; document.head.appendChild(st);
  };

  // the release's two-level engine is replaced by this one; its names stay so old callers still work
  UI.tipsInit = TT.init;
  UI.tipShow = (a, lvl) => TT.open(a, lvl || TT.levelOf(a), 'click');
  UI.tipHide = lvl => TT.close(lvl || 1);

  // redraws keep the stack: each open popover is pointed at the redrawn anchor, and focus on a trigger comes back
  for (const k of ['render', 'refresh']) {
    const f = UI[k];
    if (typeof f !== 'function') continue;
    UI[k] = function () {
      const fe = document.activeElement, fsel = fe && fe.matches && fe.matches(SEL) && !popOf(fe) ? TT.selOf(fe) : null;
      const r = f.apply(this, arguments);
      try {
        if (UI.screen !== 'game') TT.closeAll(); else TT.relink();
        if (fsel && !fe.isConnected) { const n = document.querySelector(fsel); n && n.focus(); }
      } catch (e) { console.error('tooltips relink', e); }
      return r;
    };
  }
})();
