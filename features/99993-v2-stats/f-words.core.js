// v2 stats, part 6: words, not numbers, for the player (V2_SPEC complaint 16; LANES.md "No percentages for the player").
//
// - Odds are shown as A.V2.odds.oddsWords plus a tipped balance: "in your favour" with the beam leaning your way. Every
//   feature that could print digits asks A.DIFF.showOdds (42-difficulty), and that now says no, whatever the setting.
// - A choice's odds badge (the release's, 92-scene-card's pips, 89-fight-odds' fight badge) shows the words and the scale.
// - Any other percentage that reaches the screen (a bill's chance, a faction's share of the swords, a toll, a siege) is
//   put in words where it lands: VS.dePct on the text, run on each render and on anything added to the page later
//   (tooltips, popovers). Odds become odds words; shares become "about a third". The numbers stay in the engine and in
//   the tests (LANES.md: "Tests and AI may keep numbers").
// Rendering only: nothing here reads A.rand or writes A.S.
const VS = A.V2S;
const esc = s => UI.esc(String(s == null ? '' : s));
if (A.DIFF) A.DIFF.showOdds = () => false;
if (UI.set) UI.set.odds = false;

// ---- odds words and the balance ---------------------------------------------------------------------------------------
VS.scaleSvg = function (tilt) {
  const deg = Math.round(-(Math.max(-1, Math.min(1, +tilt || 0))) * 22);
  return `<svg class="v2-scale" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5v15M7.5 21h9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` +
    `<g transform="rotate(${deg} 12 6)"><path d="M3 6h18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>` +
    `<path d="M3 6l-2.2 5.2h4.4zM21 6l-2.2 5.2h4.4z" fill="currentColor" fill-opacity=".35" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></g></svg>`;
};
VS.bandOf = pct => { const o = VS.oddsOf(pct); return o.edge >= 0.8 ? 'likely' : o.edge >= -0.8 ? 'even' : o.edge >= -1.9 ? 'risky' : 'long'; };
VS.oddsInner = pct => { const o = VS.oddsOf(pct); return `${VS.scaleSvg(o.tilt)}<span class="v2-ow">${esc(o.words)}</span>`; };
VS.oddsHtml = pct => `<span class="v2-odds v2-${VS.bandOf(pct)}" title="${esc(VS.oddsOf(pct).line)}">${VS.oddsInner(pct)}</span>`;
VS.oddsText = pct => VS.oddsOf(pct).words;

// ---- a percentage in words ----------------------------------------------------------------------------------------------
VS.FRAC = [[0, 'none'], [3, 'almost none'], [8, 'a little'], [13, 'about a tenth'], [18, 'about a sixth'], [23, 'about a fifth'], [29, 'about a quarter'],
  [37, 'about a third'], [45, 'about two in five'], [55, 'about half'], [62, 'about three in five'], [70, 'about two thirds'], [78, 'about three quarters'],
  [85, 'about four in five'], [94, 'about nine in ten'], [100, 'nearly all']];
VS.fracWords = function (n) {
  n = +n;
  if (!isFinite(n)) return 'some';
  if (n <= 0) return 'none';
  if (n >= 100) return n === 100 ? 'all' : n < 150 ? 'more than all' : `${Math.round(n / 50) / 2} times over`;
  for (const [t, w] of VS.FRAC) if (n < t) return w;
  return 'nearly all';
};
VS.sureWords = n => (n >= 90 ? 'all but certain' : n >= 75 ? 'fairly sure' : n >= 55 ? 'half sure' : 'unsure');
const third = (w, who) => w.replace(/\byour\b/, who === 'her' ? 'her' : who === 'them' ? 'their' : 'his');
const NUM = '(\\d{1,3}(?:\\.\\d+)?)\\s?%';
VS.RULES = [
  [new RegExp(`If it came to the crown today: ${NUM} it passes`, 'g'), (m, n) => `If it came to the crown today, its chances: ${VS.oddsText(+n)}`],
  [new RegExp(`In the end it passes ${NUM} of the time`, 'g'), (m, n) => `In the end, its chances: ${VS.oddsText(+n)}`],
  [new RegExp(`passes ${NUM} in the end`, 'g'), (m, n) => `in the end its chances: ${VS.oddsText(+n)}`],
  [new RegExp(`Never below ${NUM} or above ${NUM}`, 'g'), () => 'Never hopeless, never certain'],
  [new RegExp(`\\(${NUM} for (him|her|them)\\)`, 'g'), (m, n, who) => `(${third(VS.oddsText(+n), who)})`],
  [new RegExp(`\\(?${NUM} sure\\)?`, 'g'), (m, n) => (m[0] === '(' ? `(${VS.sureWords(+n)})` : VS.sureWords(+n))],
  [new RegExp(`\\(${NUM} (?:chance|odds)\\)`, 'g'), (m, n) => `(${VS.oddsText(+n)})`],
  [new RegExp(`${NUM} (?:chance|odds)`, 'g'), (m, n) => `${VS.oddsText(+n)}`],
  [new RegExp(`${NUM} by your own count`, 'g'), (m, n) => `${VS.oddsText(+n)}, by your own count`],
  // "worth 1.6%" (a rate, not a chance), "4 + 30% of their average" (a sum), "+30% pay" (more of something)
  [new RegExp(`worth ${NUM}`, 'g'), (m, n) => `worth ${VS.fracWords(+n).replace(/^about /, '')}`],
  [new RegExp(`(\\d)\\s*\\+\\s*${NUM}`, 'g'), (m, d, n) => `${d} and ${VS.fracWords(+n)}`],
  [new RegExp(`\\+\\s?${NUM}(\\s+(?:to|on|in)\\b)?`, 'g'), (m, n, prep) => `${VS.fracWords(+n)} more${prep || ''}`],
  [new RegExp(`[\\u2212\\-]\\s?${NUM}(\\s+(?:to|on|in)\\b)?`, 'g'), (m, n, prep) => `${VS.fracWords(+n)} less${prep || ''}`],
  [new RegExp(`×\\s?${NUM}`, 'g'), (m, n) => `× ${VS.fracWords(+n)}`],
];
// does the text speak of chances? then a bare percentage is odds, not a share
const ODDSY = /\b(chance|odds|likely|succeed|passes)\b/i;
VS.dePct = function (t) {
  if (typeof t !== 'string' || t.indexOf('%') < 0) return t;
  let s = t;
  for (const [re, fn] of VS.RULES) s = s.replace(re, fn);
  const oddsy = ODDSY.test(s) && !/\b(worth|of the|of its|of their|share)\b/i.test(s);
  s = s.replace(new RegExp(NUM, 'g'), (m, n) => (oddsy ? VS.oddsText(+n) : VS.fracWords(+n)));
  // a percent sign left alone after a number in another element
  return s.replace(/(^|\s)%(?=\s|$)/g, '$1').replace(/^%/, '');
};

// ---- the page: odds badges, then every percentage in text ---------------------------------------------------------------
VS.headView = function () {
  const q = A.S && A.S.queue && A.S.queue[0];
  return q && q.type === 'event' && q.view ? q.view : null;
};
VS.badges = function (root) {
  const v = VS.headView();
  if (!v || !root.querySelectorAll) return;
  for (const b of root.querySelectorAll('button[data-a="evChoose"]')) {
    const vc = v.choices && v.choices[+b.dataset.v];
    if (!vc) continue;
    const pct = vc.odds != null ? vc.odds : vc.fight && vc.fight.pct != null ? vc.fight.pct : null;
    if (pct == null) continue;
    const el = b.querySelector('.risk:not(.fo-fight):not(.v2-fo), .sc-odds:not(.fo-fight):not(.v2-fo)') || b.querySelector('.fo-fight');
    if (!el || el.dataset.v2o === String(pct)) continue;
    el.dataset.v2o = String(pct);
    // a tap on a choice chooses (playtest round 1): the breakdown opens on hover, focus or the keyboard, not a tap
    for (const t of [el, ...el.querySelectorAll('[data-tt-tap]')]) t.removeAttribute('data-tt-tap');
    el.classList.add('v2-odds');
    if (el.classList.contains('fo-fight')) {
      // 89-fight-odds' badge keeps what the fight is ("a fight"); the balance and the words go just before it
      el.classList.remove('v2-odds');
      const prev = el.previousElementSibling;
      if (prev && prev.classList.contains('v2-fo')) prev.remove();
      el.insertAdjacentHTML('beforebegin', `<span class="risk v2-odds v2-fo" title="${esc(VS.oddsOf(pct).line)}">${VS.oddsInner(pct)}</span>`);
    } else {
      // 59-tooltips' tap target (data-tt="odds") may sit on a part 92 split out: keep that element as the wrapper
      const tap = el.querySelector('[data-tt],[data-tip]');
      if (tap) { const w = tap.cloneNode(false); w.innerHTML = VS.oddsInner(pct); el.replaceChildren(w); }
      else el.innerHTML = VS.oddsInner(pct);
      el.title = VS.oddsOf(pct).line;
    }
  }
  // 92-scene-card's four pips counted the odds: the balance says it now
  for (const p of root.querySelectorAll('.sc-pips')) p.remove();
  for (const t of root.querySelectorAll('button[data-a="evChoose"] [data-tt-tap]')) t.removeAttribute('data-tt-tap');
};
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT']);
VS.sweep = function (root) {
  if (!root || typeof document === 'undefined') return;
  try { VS.badges(root.nodeType === 1 ? root : document.body); } catch (e) { console.error('v2 odds badge', e); }
  const doText = n => {
    const v = n.nodeValue;
    if (!v || !(/\d/.test(v) || /piety/i.test(v))) return;
    let t = v.indexOf('%') >= 0 ? VS.dePct(v) : v;
    if (VS.deNum) t = VS.deNum(t, n);
    if (t !== v) n.nodeValue = t;
  };
  if (root.nodeType === 3) { if (!SKIP.has(root.parentNode && root.parentNode.nodeName)) doText(root); return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (SKIP.has(n.parentNode && n.parentNode.nodeName) ? 2 : 1) });
  for (let n = w.nextNode(); n; n = w.nextNode()) doText(n);
  const els = root.querySelectorAll('[title*="%"],[aria-label*="%"],[data-tip-text*="%"]');
  for (const el of [root, ...els]) for (const a of ['title', 'aria-label']) {
    const v = el.getAttribute && el.getAttribute(a);
    if (v && v.indexOf('%') >= 0) el.setAttribute(a, VS.dePct(v));
  }
};
const render = UI.render;
UI.render = function () {
  const r = render.apply(this, arguments);
  try { VS.style && VS.style(); if (typeof document !== 'undefined' && document.body) { VS.sweep(document.body); if (VS.mo) VS.mo.takeRecords(); } } catch (e) { console.error('v2 words', e); }
  return r;
};
// anything put on the page later (popovers, tooltips, toasts, the duel screen's rounds)
if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
  VS.mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') { if (m.target.nodeValue && m.target.nodeValue.indexOf('%') >= 0) VS.sweep(m.target); continue; }
      if (m.type === 'attributes') { const v = m.target.getAttribute(m.attributeName); if (v && v.indexOf('%') >= 0) m.target.setAttribute(m.attributeName, VS.dePct(v)); continue; }
      for (const n of m.addedNodes) if (n.isConnected) VS.sweep(n);
    }
    VS.mo.takeRecords();   // our own edits are not new content
  });
  const start = () => VS.mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label'] });
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
}
