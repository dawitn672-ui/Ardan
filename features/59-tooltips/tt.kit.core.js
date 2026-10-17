// Nested tooltips, part two: the kit the new glossary entries share (tt.more-*.core.js), and the deferred wiring.
//
// The entries of tt.glossary.core.js keep their helpers to themselves; these are the same, for the files that explain
// the war room, Holdings, the Path tab, the odds of a choice, the duel and battle screens, the Realm tab and the
// Codex. Everything here only reads.
(function () {
  const TT = UI.TT = UI.TT || {};
  // the entries of part one, as they stand before tt.more-*.core.js adds part two's (the tests tell them apart)
  const base = new Set(Object.keys(UI.TIPS || {}));
  TT.part2Keys = () => Object.keys(UI.TIPS).filter(k => !base.has(k));
  Object.defineProperty(TT, 'part2', { get: () => new Set(TT.part2Keys()), configurable: true });
  const esc = s => UI.esc(String(s == null ? '' : s));
  const r0 = v => Math.round(v || 0);
  const r1 = v => Math.round((v || 0) * 10) / 10;
  const r2 = v => Math.round((v || 0) * 100) / 100;
  const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
  const pct = v => Math.round(v * 100) + '%';
  const H = (title, val, sub) => `<div class="tip-h">${title}${val != null ? ` <b>${val}</b>` : ''}${sub ? ` <span class="muted">${sub}</span>` : ''}</div>`;
  const R = (label, val, cls) => `<div class="tip-row${cls ? ' ' + cls : ''}"><span>${label}</span><b>${val}</b></div>`;
  const D = t => `<div class="tip-d">${t}</div>`;
  const F = t => `<div class="tip-f">${t}</div>`;
  const L = (key, arg, label) => UI.tt(key, arg, label);
  const coin = v => esc(A.coin(Math.round(v)));
  // a sum in percentage points: parts [label, points]; the total is the number shown, and a rounding row closes any gap
  const pts = (parts, total, label) => TT.sumRows(parts.map(([l, v, c]) => [l, v, c]), total, label).replace(/<b>([+−±]?\d+)<\/b><\/div>$/, '<b>$1%</b></div>');
  // a product: a start and factors [label, ×f]; the rows show each step and the last is the number shown
  // `shown` is the number on screen (rounded as the screen rounds it); a "comes to" row gives the exact product
  const mul = (start, factors, shown, fmt = r1, exact = r2) => {
    let v = start[1], h = R(start[0], exact(v));
    for (const [l, f] of factors) { if (f == null || Math.abs(f - 1) < 0.0005) continue; v *= f; h += R(l, '×' + r2(f), 'tt-sub'); }
    if (exact(v) !== exact(shown)) h += R('Comes to', exact(v), 'tt-sub');
    return h + R(start[2] || 'Shown', fmt(shown), 'tt-sum');
  };
  TT.K = { esc, r0, r1, r2, sg, pct, H, R, D, F, L, coin, pts, mul };

  // the product of a list of factors, as mul() multiplies them (the tests check it against the number shown)
  TT.prodOf = (start, factors) => factors.reduce((v, [, f]) => v * (f == null ? 1 : f), start);

  // a trigger on a number inside an action (a card that opens, a row that selects): hover opens it; a tap or a click
  // goes to the action. With tap = true the number is its own tap target: a tap opens the popover and the action
  // waits (the odds of a choice: a tap on "38% · risky" explains it, a tap on the words chooses).
  UI.ttNum = (key, arg, label, o = {}) => `<span class="tt-n${o.cls ? ' ' + o.cls : ''}"${UI.ttAttrs(key, arg, !!o.focus)}${o.tap ? ' data-tt-tap="1"' : ''}>${label}</span>`;

  // ---- the wiring that has to wait: features after this one (60-drill to 71-phone) draw parts of these screens, so
  // their render functions are wrapped when the game starts (UI.init), after every feature's code has run
  TT.later = [];
  TT.wireLater = function (get, name, key) { TT.later.push([get, name, key]); };
  TT.wire2 = TT.wire2 || {};
  const safe = (key, f) => {
    const g = function () {
      const h = f.apply(this, arguments);
      if (!TT.wired || typeof h !== 'string' || !TT.wire2[key]) return h;
      try { return TT.wire2[key].call(this, h, ...arguments); } catch (e) { console.error('tooltips ' + key, e); return h; }
    };
    g.ttWired = key;
    return g;
  };
  TT.installLater = function () {
    if (TT.installed) return;
    TT.installed = true;
    for (const [get, name, key] of TT.later) {
      const o = get(); if (!o || typeof o[name] !== 'function' || o[name].ttWired === key) continue;
      o[name] = safe(key, o[name]);
    }
  };
  const init = UI.init;
  UI.init = function () { try { TT.installLater(); } catch (e) { console.error('tooltips install', e); } return init.apply(this, arguments); };

  // ---- string insertion on text only: fn(match, ...groups) for each match of re in the text between tags, never in a
  // tag or an attribute
  TT.inText = function (h, re, fn) {
    return h.replace(/(<[^>]*>)|([^<]+)/g, (m, tag, txt) => tag ? tag : txt.replace(re, fn));
  };
  // the piece of h between two markers (the first after `from`), passed through fn
  TT.within = function (h, start, end, fn) {
    const i = h.indexOf(start); if (i < 0) return h;
    const j = end ? h.indexOf(end, i + start.length) : h.length, k = j < 0 ? h.length : j;
    return h.slice(0, i) + fn(h.slice(i, k)) + h.slice(k);
  };

  TT.CSS2 = `
  .tt-n{cursor:help;border-bottom:1px dotted var(--accent-line)}
  .tt-n.tt-on{color:var(--accent-2)}
  [data-tt-tap]{border-bottom-style:solid}
  @media (pointer:coarse){.tt-n{display:inline-block;min-height:24px;line-height:24px}}
  `;
  const css = TT.css;
  TT.css = function () {
    if (css) css.apply(this, arguments);
    if (typeof document === 'undefined' || document.getElementById('tt-css2')) return;
    const st = document.createElement('style'); st.id = 'tt-css2'; st.textContent = TT.CSS2; document.head.appendChild(st);
  };
})();
