// Accessibility pass for WCAG 2.2 AA (axe-core: target-size, landmark-one-main, page-has-heading-one, region).
// - Title and creation screens get a main landmark (the game screen already has <main id="side">, so it gets none here).
// - Every screen has exactly one h1; the game screen's is visually hidden and names the life being played.
// - Tooltip triggers (.tipt) are at least 24px tall, WCAG 2.2's minimum target size.
(function () {
  const css = '.tipt{display:inline-flex;align-items:center;min-height:24px}' +
    '.a11y-vh{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}';
  const addStyle = () => { if (document.getElementById('a11y-style')) return; const s = document.createElement('style'); s.id = 'a11y-style'; s.textContent = css; document.head.appendChild(s); };
  UI.a11yLandmarks = function () {
    addStyle();
    const root = UI.$('#app'); if (!root) return;
    if (UI.screen === 'game') root.removeAttribute('role'); else root.setAttribute('role', 'main');
    // one h1 per screen; on the game screen it and a tab-name h2 live inside <main id="side"> (visually hidden),
    // so the outline reads h1 (the life) > h2 (the tab) > h3 (sections) and nothing sits outside a landmark
    const host = UI.screen === 'game' ? (UI.$('#side') || root) : root;
    let h = root.querySelector('h1');
    if (!h) { h = document.createElement('h1'); h.className = 'a11y-vh'; h.id = 'a11y-h1'; host.insertBefore(h, host.firstChild); }
    if (h.id === 'a11y-h1') {
      const pc = A.S && A.pc && A.pc();
      h.textContent = UI.screen === 'game' && pc ? `Ardan: the life of ${A.fullName ? A.fullName(pc, false) : pc.given}` : 'Ardan';
    }
    UI.a11yTabHeading();
  };
  UI.a11yTabHeading = function () {
    const side = UI.screen === 'game' && UI.$('#side'); if (!side) return;
    let h2 = document.getElementById('a11y-h2');
    if (!h2) { h2 = document.createElement('h2'); h2.className = 'a11y-vh'; h2.id = 'a11y-h2'; const h1 = document.getElementById('a11y-h1'); side.insertBefore(h2, h1 && h1.parentNode === side ? h1.nextSibling : side.firstChild); }
    const g = UI.groupOf ? UI.groupOf(UI.tab) : null, sub = g && UI.subsOf ? (UI.subsOf(g).find(x => x[0] === UI.tab) || [])[1] : null;
    h2.textContent = g ? (sub && sub !== g.name ? `${g.name}: ${sub}` : g.name) : String(UI.tab || '');
  };
  const render0 = UI.render;
  UI.render = function () { const r = render0.apply(this, arguments); UI.a11yLandmarks(); return r; };
  const refreshTab0 = UI.refreshTab;
  UI.refreshTab = function () { const r = refreshTab0.apply(this, arguments); UI.a11yTabHeading(); return r; };
})();
