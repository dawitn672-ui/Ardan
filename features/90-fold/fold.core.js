// Fold: every tab and the profile fit the screen. The release drew every section open, so the Life tab was 4.6 screens
// tall inside its panel at 1366x768, the profile 1.9, and the Holdings shop alone 1,780 px. After each draw, this
// layer reshapes the page (it reads layout and never touches the game or the random stream):
// - a header (.group-h) and the blocks under it become a section that folds, with a count in its header;
// - a tall card gets a fold button in its corner, and folds to its own first row;
// - the Life tab's activity groups become one Activities section: a single grid of tiles in the groups' fixed order,
//   each tile knowing its group (91-look draws the tiles and gives each its group's icon);
// - a header carries a count and, when its section is closed, a one-line summary, so a closed section still informs;
// - the profile gets a compact head (a small portrait beside the name) and its bars sit two to a row.
// What the player opens or closes is remembered in the browser (UI.store), per tab and section, not in the save.
const FOLD = UI.FOLD = UI.FOLD || {};
FOLD.KEY = 'ardan_fold_v1';
FOLD.state = (() => { try { return JSON.parse(UI.store.get(FOLD.KEY) || '{}') || {}; } catch (e) { return {}; } })();
FOLD.allOpen = false;                       // tests and the "Open all" control
FOLD.save = () => { try { UI.store.set(FOLD.KEY, JSON.stringify(FOLD.state)); } catch (e) {} };
const slug = t => String(t || '').toLowerCase().replace(/\(\d+\)|\d+/g, '').replace(/[^a-z& ]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 40);
// default open or closed for a section, before the player chooses: sections the player needs every visit stay open
FOLD.DEFAULT_CLOSED = {
  // Your days folds to its own summary line ("Push for advancement · training is fair") except on a tall screen
  life: ['how you are', 'your days'],
  profile: ['body'],
  holdings: ['the armorer', 'property', 'the trade roads'],
  realm: ['the council', 'the ladder', 'the ways of', 'how the', 'why wars begin', 'factions of'],
  path: ['how you live', 'schools & academies'],
  people: [],
};
FOLD.ACCORDION = {};                        // tabs whose activity sections open one at a time (none since one grid)
FOLD.TALL = 180;                            // a card taller than this gets a fold button
FOLD.ALWAYS = ['whatnow', 'plan-card', 'lf-amb'];   // cards that fold whatever their height (What now, Your days, Ambition)
// on a phone the Life page is one column under the thumb: the ambition (97-life-fixes) starts folded to its title line
FOLD.PHONE_CLOSED = { life: ['ambition'] };
// a tall window (1600 x 1000 and up) has room for Your days open (brief §4.2); reading the window is not game state
FOLD.roomy = () => typeof window !== 'undefined' && window.innerWidth >= 1600 && window.innerHeight >= 1000;
FOLD.isOpen = function (tab, key, fallback) {
  if (FOLD.allOpen) return true;
  const k = tab + '|' + key;
  if (k in FOLD.state) return !!FOLD.state[k];
  return fallback;
};
FOLD.defaultOpen = function (tab, key) {
  // Your days folds only where 91-look keeps its training select in the header (else the choice made most often would
  // hide behind a click), and not in a tall window
  if (tab === 'life' && key.startsWith('your days') && (FOLD.roomy() || !UI.LOOK)) return true;
  const list = (FOLD.DEFAULT_CLOSED[tab] || []).concat(UI.isPhone && UI.isPhone() ? FOLD.PHONE_CLOSED[tab] || [] : []);
  return !list.some(p => key.startsWith(p));
};
// ids for aria-controls, from the tab and the section's key, so the same screen always draws the same markup
const idFrom = (pre, tab, key) => {
  const base = pre + '-' + (tab + '-' + key).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  let id = base, n = 1;
  while (document.getElementById(id)) id = base + '-' + (++n);
  return id;
};
// the one-line summary a closed section shows in its header: the first words of what it holds
FOLD.summaryOf = function (box) {
  if (!box) return '';
  const first = box.firstElementChild;
  // a table says how many rows it holds; anything else gives its first words (text nodes joined with spaces)
  const tb = first && (first.matches('table') ? first : first.matches('.tscroll') ? first.querySelector('table') : null);
  if (tb) { const n = tb.querySelectorAll('tbody tr').length || Math.max(0, tb.querySelectorAll('tr').length - 1); return n ? n + (n === 1 ? ' row' : ' rows') : ''; }
  const parts = [], w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  let len = 0;
  for (let n = w.nextNode(); n && len < 80; n = w.nextNode()) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t) { parts.push(t); len += t.length + 1; } }
  const t = parts.join(' ').replace(/\s+([,.;:])/g, '$1');
  return t.length > 60 ? t.slice(0, 58).replace(/\s+\S*$/, '') + '…' : t;
};
const putSummary = (head, text) => {
  let s = head.querySelector(':scope > .fold-sum');
  if (!text) { if (s) s.remove(); return; }
  if (!s) { s = document.createElement('span'); s.className = 'fold-sum'; s.setAttribute('aria-hidden', 'true'); head.appendChild(s); }
  s.textContent = text;
};
FOLD.putSummary = putSummary;
// the Life tab's activities: every group (Only now, Body & mind, Social ...) into one grid, in the groups' order. Each
// tile keeps its group in data-g (a slug) and data-gn (the group's name, for its tooltip); the first of a group is marked.
FOLD.mergeActs = function (tb) {
  if (!tb || tb.querySelector(':scope > .lk-acts-h')) return;
  const kids = [...tb.children], groups = [];
  for (let i = 0; i < kids.length - 1; i++) {
    const h = kids[i], a = kids[i + 1];
    if (h.classList.contains('group-h') && a.classList.contains('acts') && a.querySelector(':scope > .act')) { groups.push([h, a]); i++; }
  }
  if (!groups.length) return;
  const head = document.createElement('div');
  head.className = 'group-h lk-acts-h';
  head.textContent = 'Activities';
  const grid = document.createElement('div');
  grid.className = 'acts lk-acts';
  groups[0][0].before(head);
  head.after(grid);
  for (const [h, a] of groups) {
    const name = h.textContent.trim(), g = /^only now/i.test(name) ? 'only now' : slug(name);
    let first = true;
    for (const t of [...a.children]) {
      t.dataset.g = g; t.dataset.gn = name;
      if (g === 'only now') t.classList.add('lk-now');
      if (first) { t.classList.add('lk-gstart'); first = false; }
      grid.appendChild(t);
    }
    h.remove(); a.remove();
  }
};
const isActs = el => el && el.classList && (el.classList.contains('acts'));

// sections from the flat run of a container's children: a .group-h and everything after it up to the next one
FOLD.sections = function (root, tab) {
  if (!root) return;
  const kids = [...root.children];
  for (let i = 0; i < kids.length; i++) {
    const h = kids[i];
    if (!h.classList || !h.classList.contains('group-h') || h.closest('.fold')) continue;
    const body = [];
    for (let j = i + 1; j < kids.length && !(kids[j].classList && kids[j].classList.contains('group-h')); j++) body.push(kids[j]);
    if (!body.length) continue;
    const label = h.textContent.trim(), key = slug(label);
    if (!key) continue;
    const acts = body.some(isActs);
    const n = body.reduce((a, b) => a + (isActs(b) ? b.querySelectorAll(':scope > *').length : b.classList && b.classList.contains('card') ? 1 : 0), 0);
    const open = FOLD.isOpen(tab, key, FOLD.defaultOpen(tab, key) || /^only now/.test(key));
    const sec = document.createElement('section');
    sec.className = 'fold' + (acts ? ' fold-acts' : '') + (open ? ' open' : '');
    sec.dataset.fk = key;
    // the header stays as it was drawn (its tooltips and links included); a toggle goes in front of it, and a click on
    // its plain text toggles too (see the listener below). The chevron and the count are drawn by CSS, not text.
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold-h';
    btn.dataset.a = 'fold';
    btn.dataset.v = key;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', label + (n && !/\(\d+\)/.test(label) ? ', ' + n : ''));
    h.classList.add('fold-head');
    h.prepend(btn);
    if (n && !/\(\d+\)/.test(label)) { const c = document.createElement('span'); c.className = 'fold-n'; c.dataset.n = String(n); c.setAttribute('aria-hidden', 'true'); h.appendChild(c); }
    const box = document.createElement('div');
    box.className = 'fold-b';
    if (!open) box.hidden = true;
    h.before(sec);
    sec.append(h, box);
    for (const b of body) box.appendChild(b);
    box.id = idFrom('fold-b', tab, key);
    btn.setAttribute('aria-controls', box.id);
    if (!open) putSummary(h, FOLD.summaryOf(box));
    i += body.length;
  }
};
// a tall card folds to its first row; the button sits in the corner so a first row with its own controls keeps them
FOLD.cards = function (root, tab) {
  if (!root) return;
  for (const c of root.querySelectorAll(':scope > .card, :scope > section.card, .fold-b > .card')) {
    if (c.dataset.fc || c.tagName === 'DETAILS' || c.classList.contains('person') || c.children.length < 2) continue;
    if (c.offsetHeight < FOLD.TALL && !FOLD.ALWAYS.some(k => c.classList.contains(k))) continue;
    const first = c.firstElementChild, label = (first.textContent || '').trim().split('\n')[0];
    const key = 'card ' + slug((c.className.toString().split(/\s+/).filter(x => x !== 'card' && x !== 'small')[0] || '') + ' ' + label.slice(0, 24));
    const open = FOLD.isOpen(tab, key, FOLD.defaultOpen(tab, slug(label)));
    c.dataset.fc = key;
    c.classList.add('fold-card');
    c.classList.toggle('folded', !open);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fold-x';
    btn.dataset.a = 'fold';
    btn.dataset.v = key;
    btn.setAttribute('aria-expanded', String(open));
    btn.dataset.label = label.slice(0, 40) || 'this card';
    btn.setAttribute('aria-label', (open ? 'Fold ' : 'Open ') + btn.dataset.label);
    if (!c.id) c.id = idFrom('fold-c', tab, key);
    btn.setAttribute('aria-controls', c.id);
    c.insertBefore(btn, first);
    // What now: its count in the header, and when folded, its first step
    if (c.classList.contains('whatnow')) {
      const items = c.querySelectorAll('.wn-item'), n = items.length;
      if (n && !first.querySelector('.fold-n')) { const k = document.createElement('span'); k.className = 'fold-n'; k.dataset.n = String(n); k.setAttribute('aria-hidden', 'true'); first.appendChild(k); }
      const b = items[0] && items[0].querySelector('.wn-t b');
      if (!open && b) putSummary(first, 'first: ' + b.textContent.trim());
    }
  }
};
// the profile: a compact head, and the bars two to a row
FOLD.profile = function (root) {
  if (!root || root.querySelector(':scope > .fold-pid, :scope > .fold-bars')) return;
  const p = root.querySelector(':scope > .portrait-wrap'), n = root.querySelector(':scope > .pname');
  if (p && n) {
    const head = document.createElement('div');
    head.className = 'fold-pid';
    const side = document.createElement('div');
    side.className = 'fold-pid-t';
    p.before(head);
    head.append(p, side);
    for (const k of ['.pname', '.ptitle', '.center']) { const e = root.querySelector(':scope > ' + k); if (e) side.appendChild(e); }
  }
  let run = [];
  const flush = () => {
    if (run.length > 2) { const g = document.createElement('div'); g.className = 'fold-bars'; run[0].before(g); for (const r of run) g.appendChild(r); }
    run = [];
  };
  for (const k of [...root.children]) { if (k.classList && k.classList.contains('barrow')) run.push(k); else flush(); }
  flush();
};
FOLD.tabOf = () => (UI.isPhone && UI.isPhone() ? 'p-' : '') + (UI.tab || '');
FOLD.apply = function () {
  if (FOLD.OFF || typeof document === 'undefined') return;
  try {
    const tb = document.getElementById('tabbody'), pr = document.getElementById('profile'), tab = UI.tab || '';
    const t = tab === 'goals' ? 'life' : tab === 'war' ? 'path' : tab;
    if (tb && t === 'life' && tab === 'life') FOLD.mergeActs(tb);
    if (tb) { FOLD.sections(tb, t); FOLD.cards(tb, t); FOLD.tools(tb); }
    if (pr) { FOLD.profile(pr); FOLD.sections(pr, 'profile'); }
  } catch (e) { console.error('fold', e); }
};
// "Open all / Fold all" at the head of a tab that has sections
FOLD.tools = function (tb) {
  if (!tb || tb.querySelector(':scope > .fold-tools') || !tb.querySelector('.fold, .fold-card')) return;
  const bar = document.createElement('div');
  bar.className = 'fold-tools';
  bar.innerHTML = `<button type="button" class="ghost tiny" data-a="foldAll" data-v="${FOLD.allOpen ? 'close' : 'open'}">${FOLD.allOpen ? 'Fold sections' : 'Open every section'}</button>`;
  tb.prepend(bar);
};
const set = (el, open) => {
  const sec = el.closest('.fold'), card = el.closest('.fold-card');
  if (sec && el.classList.contains('fold-h')) {
    sec.classList.toggle('open', open);
    sec.classList.toggle('fold-anim', open);   // the body fades in when the player opens it, not on every redraw
    const b = sec.querySelector(':scope > .fold-b'); if (b) b.hidden = !open;
    el.setAttribute('aria-expanded', String(open));
    const head = el.parentElement;
    if (head && !head.querySelector(':scope > .fold-sum.lk-keep')) putSummary(head, open ? '' : FOLD.summaryOf(b));
  } else if (card) {
    card.classList.toggle('folded', !open);
    card.classList.toggle('fold-anim', open);
    el.setAttribute('aria-expanded', String(open));
    el.setAttribute('aria-label', (open ? 'Fold ' : 'Open ') + (el.dataset.label || 'this card'));
    const first = el.nextElementSibling;
    if (card.classList.contains('whatnow') && first) { const b = card.querySelector('.wn-item .wn-t b'); putSummary(first, !open && b ? 'first: ' + b.textContent.trim() : ''); }
  }
};
Object.assign(UI.A, {
  fold(v, el) {
    if (!el) return;
    const tab = el.closest('#profile') ? 'profile' : (UI.tab === 'goals' ? 'life' : UI.tab === 'war' ? 'path' : UI.tab || '');
    const open = el.getAttribute('aria-expanded') !== 'true';
    set(el, open);
    FOLD.state[tab + '|' + v] = open;
    // the accordion: opening one activity group closes the others
    const sec = el.closest('.fold');
    if (open && sec && sec.classList.contains('fold-acts') && FOLD.ACCORDION[tab]) {
      for (const o of sec.parentElement.querySelectorAll(':scope > .fold.fold-acts.open')) {
        if (o === sec) continue;
        const h = o.querySelector(':scope > .fold-head > .fold-h'); set(h, false); FOLD.state[tab + '|' + o.dataset.fk] = false;
      }
    }
    FOLD.save();
  },
  foldAll(v) { FOLD.allOpen = v === 'open'; if (UI.refreshTab) UI.refreshTab(); else UI.render(); },
});
// Reveal: open the folds around an element, bring it to the middle of its panel, focus it and flash it
FOLD.reveal = function (el) {
  if (!el) return false;
  for (let s = el.closest('.fold'); s; s = s.parentElement && s.parentElement.closest('.fold')) {
    const h = s.querySelector(':scope > .fold-head > .fold-h'); if (h && h.getAttribute('aria-expanded') !== 'true') h.click();
  }
  const card = el.closest('.fold-card.folded'); if (card) { const x = card.querySelector(':scope > .fold-x'); if (x) x.click(); }
  try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { el.scrollIntoView(); }
  const f = el.matches('button,select,input,a,[tabindex]') ? el : el.querySelector('button:not([disabled]),select,input,[tabindex]');
  if (f && f.focus) f.focus({ preventScroll: true });
  el.classList.remove('fold-flash'); void el.offsetWidth; el.classList.add('fold-flash');
  setTimeout(() => el.classList.remove('fold-flash'), 1400);
  return true;
};
// What now: two of its three usual steps ("Choose what to train", "Spend your initiative") sent the player to the tab
// they were already on, so the click did nothing. Each step now also brings its own control into view.
FOLD.WN_TARGET = [
  [/train/i, () => document.querySelector('#tabbody .plan-card select') || document.querySelector('#tabbody .plan-card')],
  [/initiative|spend/i, () => document.querySelector('#tabbody .fold-acts') || document.querySelector('#tabbody .acts')],
  [/path|post|job|work/i, () => document.querySelector('#tabbody .spec.pending, #tabbody .jobcard, #tabbody .path-role')],
];
if (UI.A.wn) {
  const wn = UI.A.wn;
  UI.A.wn = function (v) {
    const x = UI.wnItems && UI.wnItems[+v];
    const r = wn.apply(this, arguments);
    try {
      if (x && (!x.act || x.act[0] === 'tab')) {
        const rule = FOLD.WN_TARGET.find(([rx]) => rx.test(x.t || ''));
        const el = rule && rule[1]();
        if (el) FOLD.reveal(el);
        else { const t = document.querySelector('#tabbody .fold, #tabbody .card'); if (t) FOLD.reveal(t); }
      }
    } catch (e) { console.error('what now', e); }
    return r;
  };
}
if (typeof document !== 'undefined') document.addEventListener('click', e => {
  const head = e.target.closest && e.target.closest('.fold > .fold-head');
  if (!head || e.target.closest('[data-a],[data-tip],[data-tt],a,button,select,input,textarea,summary')) return;
  const b = head.querySelector(':scope > .fold-h'); if (b) b.click();
});
for (const k of ['render', 'refresh', 'refreshTab', 'renderModal']) {
  const f = UI[k];
  if (typeof f !== 'function') continue;
  UI[k] = function () { const r = f.apply(this, arguments); FOLD.apply(); return r; };
}

FOLD.CSS = `
.fold{margin:0 0 var(--s-2,8px)}
.fold > .fold-head{cursor:pointer;user-select:none;margin:var(--s-3,10px) 0 var(--s-1,4px)}
.fold > .fold-head:hover{color:var(--accent-2)}
.fold-h{flex:none;width:22px;height:22px;margin:0 -2px 0 -4px;padding:0;border:0;border-radius:4px;background:none;cursor:pointer;display:inline-grid;place-items:center;order:-1}
.fold-h::before{content:"";width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--accent);transition:transform .15s ease}
.fold-h[aria-expanded="false"]::before{transform:rotate(-90deg)}
.fold-h:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.fold > .fold-head::before{display:none}
.fold-n{flex:none;border:1px solid var(--border-2);border-radius:999px;padding:0 7px;line-height:1.5;letter-spacing:0;color:var(--text-3)}
.fold-n::before{content:attr(data-n);font-size:var(--fs-1)}
@media (prefers-reduced-motion:reduce){.fold-h::before{transition:none}}
.fold-card{position:relative}
.fold-card.folded > :not(:first-child):not(.fold-x){display:none}
.fold-card.folded > .fold-x + *{display:block}
.fold-x{float:right;position:relative;z-index:2;width:28px;height:28px;margin:0 0 4px 8px;border-radius:6px;border:1px solid var(--border-2);background:var(--surface-2);cursor:pointer;display:grid;place-items:center;padding:0}
.fold-x::before{content:"";width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid var(--accent);transition:transform .15s ease}
.fold-x[aria-expanded="false"]::before{transform:rotate(-90deg)}
.fold-x:hover{border-color:var(--accent-line)}
.fold-tools{display:flex;justify-content:flex-end;margin:-2px 0 4px;max-width:100%;overflow:hidden}
.fold-tools .ghost{background:none;border:0;color:var(--text-3);cursor:pointer;font-size:var(--fs-1);padding:2px 4px;text-decoration:underline dotted}
.fold-tools .ghost:hover{color:var(--accent-2)}
.fold-pid{display:grid;grid-template-columns:84px 1fr;gap:10px;align-items:center;margin-bottom:6px}
.fold-pid .portrait-wrap{width:84px;margin:0}
.fold-pid .portrait-wrap svg,.fold-pid .portrait-wrap img,.fold-pid .portrait-wrap canvas{max-width:84px;height:auto}
.fold-pid-t{min-width:0}
.fold-pid-t .pname{text-align:left;font-size:calc(18px * var(--tx, 1))}
.fold-pid-t .ptitle{text-align:left}
.fold-pid-t .center{text-align:left;justify-content:flex-start}
.fold-bars{display:grid;grid-template-columns:1fr 1fr;column-gap:14px}
.fold-bars .barrow{min-width:0;grid-template-columns:1fr auto;grid-template-areas:'l v' 'b b';row-gap:2px;margin:2px 0 5px}
.fold-bars .barrow > .lbl{grid-area:l;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fold-bars .barrow > .val{grid-area:v}
.fold-bars .barrow > :nth-child(2){grid-area:b}
@media (max-width:760px){.fold-bars{grid-template-columns:1fr}}
.fold-flash{animation:fold-flash 1.3s ease-out}
@keyframes fold-flash{0%,30%{box-shadow:0 0 0 3px var(--accent-2),0 0 18px var(--accent-line)}100%{box-shadow:0 0 0 0 transparent}}
@media (prefers-reduced-motion:reduce){.fold-flash{animation:none;outline:3px solid var(--accent-2)}}
`;
{
  const put = () => { if (typeof document === 'undefined' || document.getElementById('fold-style')) return; const s = document.createElement('style'); s.id = 'fold-style'; s.textContent = FOLD.CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
}
