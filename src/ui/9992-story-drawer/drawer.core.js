// 9992-story-drawer (B5, U3): from 1100 to 1599 px the story is a drawer, not a third column, so the open page gets the
// width (at 1366 the page had 36% of it; now about 80%). A "Story" button in the top bar opens the drawer over the page's
// right edge; the Life page carries the newest three lines itself, with a button that opens the rest. A neutral dot on the
// button says new lines have come in since the drawer was last open (red stays for danger). At 1600 px and up the story
// stays a column (460 px); at 761 to 1099 px it stays the strip-and-column of 91-visual-style.
// This layer reads the window and the story log and writes only to the page; it never touches the game or the random
// stream. Whether the drawer is open is the player's, kept in UI, not in the save.
(function () {
  const SD = UI.STORY = UI.STORY || {};
  const win = typeof window !== 'undefined' ? window : null;
  SD.open = false;
  SD.seenState = null; SD.seen = 0;
  // the drawer layout applies in this window range and never on a phone
  SD.on = () => !!win && win.innerWidth >= 1100 && win.innerWidth < 1600 && !(UI.isPhone && UI.isPhone());
  SD.lines = () => { let n = 0; for (const e of (A.S && A.S.log) || []) if (e && Array.isArray(e.lines)) n += e.lines.length; return n; };
  SD.fresh = () => { if (A.S && SD.seenState !== A.S) { SD.seenState = A.S; SD.seen = SD.lines(); } };
  SD.unread = () => { SD.fresh(); return !SD.open && SD.lines() > SD.seen; };
  // the newest n lines, from the state: [text, class]
  SD.latest = n => {
    const out = [], log = (A.S && A.S.log) || [];
    for (let i = log.length - 1; i >= 0 && out.length < n; i--) {
      const ls = (log[i].lines || []).filter(l => (Array.isArray(l) ? l[1] !== 'yearstart' && l[0] : l));
      for (let j = ls.length - 1; j >= 0 && out.length < n; j--) { const l = ls[j]; out.unshift(Array.isArray(l) ? [l[0], l[1] || ''] : [l, '']); }
    }
    return out;
  };

  // the top bar's button, before Save
  const top = UI.renderTop;
  if (typeof top === 'function') UI.renderTop = function () {
    const h = top.apply(this, arguments);
    try {
      if (typeof h !== 'string' || !h) return h;
      const at = h.indexOf('<button class="small" data-a="save"');
      if (at < 0) return h;
      const dot = SD.unread() ? '<span class="badge badge-new" aria-hidden="true"></span>' : '';
      const b = `<button class="small story-btn" data-a="storyDrawer" aria-expanded="${SD.open}" aria-controls="logwrap" aria-label="Story${SD.unread() ? ', new lines' : ''}">${UI.icon ? UI.icon('book', 's') : ''}<span class="st-t">Story</span>${dot}</button>`;
      return h.slice(0, at) + b + h.slice(at);
    } catch (e) { console.error('story drawer top bar', e); return h; }
  };
  // the open drawer is a class of #game, so every full draw keeps it
  const game = UI.renderGame;
  if (typeof game === 'function') UI.renderGame = function () {
    const h = game.apply(this, arguments);
    return SD.open && typeof h === 'string' ? h.replace('<div id="game" class="', '<div id="game" class="lk-story-open ') : h;
  };
  // the newest lines at the head of the Life page (drawer widths only)
  const tab = UI.renderTab;
  if (typeof tab === 'function') UI.renderTab = function () {
    const h = tab.apply(this, arguments);
    try {
      if (UI.tab !== 'life' || !SD.on() || typeof h !== 'string') return h;
      const ls = SD.latest(3);
      if (!ls.length) return h;
      return `<section class="card sd-feed" aria-label="The newest lines of your story">${ls.map(l => `<div class="ll ${UI.esc(l[1])}">${UI.esc(l[0])}</div>`).join('')}<button type="button" class="small ghost" data-a="storyDrawer">The whole story</button></section>` + h;
    } catch (e) { console.error('story drawer feed', e); return h; }
  };
  const set = open => {
    SD.open = !!open;
    if (open) SD.seen = SD.lines();
    const g = UI.$ ? UI.$('#game') : null;
    if (g) g.classList.toggle('lk-story-open', SD.open);
    for (const b of document.querySelectorAll('[data-a="storyDrawer"].story-btn')) { b.setAttribute('aria-expanded', String(SD.open)); const d = b.querySelector('.badge'); if (d) d.remove(); b.setAttribute('aria-label', 'Story'); }
    if (open) { const lg = UI.$('#log'); if (lg) lg.scrollTop = lg.scrollHeight; }
  };
  UI.A.storyDrawer = function () { set(!SD.open); };
  // the drawer closes when the window grows to the column layout or shrinks to a phone, so nothing is left hanging open
  SD.set = set;

  const css = `
  .story-btn{display:none;gap:6px;align-items:center}
  .story-btn .badge{position:static;margin-left:2px}
  @media (min-width:1100px) and (max-width:1599px){#game:not(.phone) #topbar .story-btn{display:inline-flex}
    #game:not(.phone) #topbar .top-right>button.story-btn .bt,#game:not(.phone) #topbar .top-right>button.story-btn .st-t{display:inline}}
  #game.lk-story-open .story-btn{box-shadow:inset 0 -2px 0 var(--accent)}
  .sd-feed{display:none;padding:8px 12px;margin:0 0 8px}
  .sd-feed .ll{font-size:var(--t-small,13px);line-height:1.4;margin:0 0 4px}
  .sd-feed button{margin-top:2px}
  @media (min-width:1100px) and (max-width:1599px){#game:not(.phone) .sd-feed{display:block}}
  `;
  if (typeof document !== 'undefined') {
    const put = () => { if (document.getElementById('sd-style')) return; const s = document.createElement('style'); s.id = 'sd-style'; s.textContent = css; document.head.appendChild(s); };
    if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
  }
})();
