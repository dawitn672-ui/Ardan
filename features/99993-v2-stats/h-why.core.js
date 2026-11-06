// v2 stats, part 8: the odds breakdown on a touch screen (cycle 3; 59-tooltips' ttPhone2).
//
// Playtest round 1 made a tap on a choice choose: the odds badge inside the choice lost its tap target, and its
// breakdown opens on hover, focus or the keyboard. A phone has no hover, so a phone player could not see why a
// choice's odds stand as they do at all. On a touch screen (no hover, or a coarse pointer):
//
// - The choice body still chooses. The badge inside it stays as it was, and takes no tap (71-phone's pointer-events).
// - Over the badge lies a separate target, a sibling of the choice button in `.choices` (never inside it, since a
//   control may not hold another), at least 44 × 44 px. A tap on it opens the breakdown, words only (the odds popover
//   of g-bands), and chooses nothing. A second tap on it closes the breakdown.
// - The breakdown is placed above the choices, so it never covers one, and the next tap on a choice is free: it
//   closes the breakdown and chooses. When there is no room above (the choices fill the screen), it may cover them,
//   and then a tap on it closes it; a covered choice is never taken by a tap meant for the breakdown.
// - The target is a span with role="button", not a <button>: the release's number keys and first focus pick
//   `.choices button`, so the target must not count as a choice.
//
// Nothing changes on a screen with hover and a fine pointer. Rendering only: nothing here reads A.rand or writes A.S.
const VS = A.V2S;
const TT = UI.TT;
VS.whyOn = () => typeof matchMedia === 'function' && (matchMedia('(hover: none)').matches || matchMedia('(pointer: coarse)').matches);

// the breakdown the target opens: the same popover as the badge's (a key of its own, so TT.relink finds the target
// again and not the check chip, which carries data-tt="odds" too)
if (UI.TIPS) UI.TIPS.oddsWhy = function (vi) { return UI.TIPS.odds ? UI.TIPS.odds(vi) : ''; };

// put each target over its badge: the badge's offset inside `.choices`, through the offset parents (transforms, such as
// 92-scene-card's entry animation, do not move it), grown to 44 px each way about the badge's centre
VS.placeWhys = function (ch) {
  if (!ch || !ch.isConnected) return;
  const cw = ch.clientWidth;
  for (const o of ch.querySelectorAll(':scope > .v2-why')) {
    const b = o.previousElementSibling, badge = b && b.querySelector('.v2-odds');
    if (!badge) continue;
    let x = 0, y = 0, n = badge;
    while (n && n !== ch) {
      x += n.offsetLeft; y += n.offsetTop;
      const p = n.offsetParent;
      if (p && p !== ch) { x += p.clientLeft; y += p.clientTop; }
      n = p;
    }
    if (n !== ch) continue;
    const w = badge.offsetWidth, h = badge.offsetHeight, W = Math.min(cw, Math.max(44, w + 12)), H = Math.max(44, h + 12);
    const left = Math.max(0, Math.min(cw - W, x - (W - w) / 2)), top = y - (H - h) / 2;
    o.style.left = Math.round(left) + 'px'; o.style.top = Math.round(top) + 'px';
    o.style.width = Math.round(W) + 'px'; o.style.height = Math.round(H) + 'px';
  }
};
VS.whyRO = typeof ResizeObserver === 'function' ? new ResizeObserver(list => {
  const seen = new Set();
  for (const e of list) { const ch = e.target.closest && e.target.closest('.choices'); if (ch && !seen.has(ch)) { seen.add(ch); VS.placeWhys(ch); } }
}) : null;

// one target after each choice that shows odds; none when the choice shows none
VS.whys = function (ch) {
  if (!ch || !ch.isConnected) return;
  let any = false;
  for (const b of ch.querySelectorAll(':scope > button[data-a="evChoose"]')) {
    const badge = b.querySelector('.v2-odds'), vi = b.dataset.v;
    let o = b.nextElementSibling;
    if (!(o && o.classList.contains('v2-why'))) o = null;
    if (!badge || vi == null) { if (o) o.remove(); b.classList.remove('v2-has-why'); continue; }
    if (!o) {
      o = document.createElement('span');
      o.className = 'v2-why';
      o.setAttribute('role', 'button');
      o.setAttribute('aria-haspopup', 'dialog');
      o.setAttribute('aria-expanded', 'false');
      o.tabIndex = 0;
      o.dataset.tt = 'oddsWhy';
      b.after(o);
    }
    o.dataset.v = vi;
    const words = (badge.textContent || '').replace(/\s+/g, ' ').trim();
    const label = `Why the odds are ${words || 'as they are'}`;
    if (o.getAttribute('aria-label') !== label) o.setAttribute('aria-label', label);
    b.classList.add('v2-has-why');
    any = true;
    if (VS.whyRO) VS.whyRO.observe(b);
  }
  if (!any) return;
  // the targets are placed inside `.choices`; it may be 71-phone's sticky block, which already holds them
  if (getComputedStyle(ch).position === 'static') ch.classList.add('v2-why-rel');
  if (VS.whyRO) VS.whyRO.observe(ch);
  VS.placeWhys(ch);
};

const badges = VS.badges;
VS.badges = function (root) {
  const r = badges.apply(this, arguments);
  try {
    if (!root || !root.querySelectorAll || !VS.whyOn()) return r;
    const lists = new Set();
    for (const b of root.querySelectorAll('.choices > button[data-a="evChoose"]')) lists.add(b.parentNode);
    if (root.matches && root.matches('.choices')) lists.add(root);
    for (const ch of lists) VS.whys(ch);
  } catch (e) { console.error('v2 odds target', e); }
  return r;
};

// the breakdown sits above the choices (59 placed it under its anchor, over the next choice)
if (TT && TT.place) {
  const place = TT.place;
  TT.place = function (lvl) {
    const r = place.apply(this, arguments);
    try {
      const s = TT.stack[lvl - 1], base = TT.stack[0];
      if (!s || !base || !base.a || !base.a.classList || !base.a.classList.contains('v2-why')) return r;
      const ch = base.a.closest('.choices');
      if (!ch) return r;
      const el = s.el, top = Math.min(ch.getBoundingClientRect().top, window.innerHeight), room = top - 6 - 8;
      el.style.maxHeight = ''; el.style.overflowY = '';
      s.tapClose = false;
      if (room >= 96) {
        let h = el.offsetHeight;
        if (h > room) { el.style.maxHeight = room + 'px'; el.style.overflowY = 'auto'; h = room; }
        el.style.top = Math.round(top - 6 - h) + 'px';
      } else s.tapClose = true;
    } catch (e) { console.error('v2 odds placement', e); }
    return r;
  };
}
// no room above the choices: the breakdown covers some of them, and a tap on it (not on a word inside it that opens
// another, nor its ×) closes it
if (typeof window !== 'undefined' && TT) window.addEventListener('click', e => {
  if (!TT.stack.length || !TT.stack.some(s => s && s.tapClose)) return;
  const t = e.target, pop = t && t.closest && t.closest('.tt-pop');
  if (!pop || t.closest('[data-tt],[data-tip],[data-tt-close]')) return;
  TT.closeAll();
}, true);

VS.css += '.v2-why-rel{position:relative}' +
  '#modal .choices > .v2-why{position:absolute;z-index:3;display:block;box-sizing:border-box;margin:0;padding:0;border-radius:8px;background:transparent;cursor:help;-webkit-tap-highlight-color:transparent;touch-action:manipulation}' +
  '#modal .choices > .v2-why:focus-visible,#modal .choices > .v2-why.tt-on{outline:2px solid var(--accent,#d8ae55);outline-offset:-3px}' +
  '#modal .choices > .v2-why:active{background:rgba(216,174,85,.12)}' +
  // the badge says it is a thing of its own: a dashed edge, like 59's tap targets
  '#modal .choices > button.v2-has-why .v2-odds{outline:1px dashed currentColor;outline-offset:1px;border-radius:4px}';
