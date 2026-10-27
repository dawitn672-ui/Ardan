// 96-moments, toasts (docs/design/brief.md §5.10): up to three stacked, newest on top, each with an icon and an edge in
// its kind's colour (ok, danger, info, accent); 4 s on screen, and a pause while the pointer or focus is on one.
//
// The release keeps one toast, #toast: each UI.toast(msg) overwrote the last, so two messages in a row (a purchase and
// what it unlocked, a refusal and its reason) showed only the second. Here #toast stays the newest message (role
// status, aria-live polite, read by tests and features as the newest text) and the ones it replaces move into a stack
// under it, #toast-stack (aria-hidden: they were read out when they came). Drawing only: nothing here reads A.rand or
// touches A.S.
(function () {
  if (typeof document === 'undefined' || typeof UI.toast !== 'function') return;
  const TS = UI.TOASTS = { MAX: 3, MS: 4000, log: [] };
  const orig = UI.toast;
  // the kind from the words, as the release gives none: a refusal or a loss is danger, a gain is ok, the rest accent
  TS.kind = function (msg) {
    const s = String(msg || '');
    if (/\b(can(?:no|')t|cannot|not enough|too (?:poor|weak|young|old|tired)|no longer|you need|needs? \d|fail(?:s|ed)?|refuses?d?|lost|dies|died|wounded|locked)\b/i.test(s)) return 'danger';
    if (/(\bgain(?:s|ed)?\b|\bwon\b|\bwins?\b|\bpromot|\blearn(?:s|ed)?\b|\bunlock|\bsaved\b|[+]\d)/i.test(s)) return 'ok';
    return 'accent';
  };
  const ICON = { danger: 'triangle-alert', ok: 'check', info: 'info', accent: 'info' };
  const icon = k => { try { return UI.icon ? UI.icon(ICON[k] || 'info', 's ts-ic') : ''; } catch (e) { return ''; } };
  const stackEl = () => {
    let s = document.getElementById('toast-stack');
    if (!s) { s = document.createElement('div'); s.id = 'toast-stack'; s.setAttribute('aria-hidden', 'true'); document.body.appendChild(s); }
    return s;
  };
  const shown = t => !!(t && t.textContent && t.classList.contains('ts-on'));
  // the newest toast sits above the stack: the stack is anchored where #toast was, and #toast rises by its height
  TS.place = function () {
    const t = document.getElementById('toast'), s = document.getElementById('toast-stack');
    if (!t) return;
    document.documentElement.style.setProperty('--ts-h', '0px');
    if (!s || !s.children.length) return;
    const base = parseFloat(getComputedStyle(t).bottom) || 16;
    s.style.bottom = base + 'px';
    document.documentElement.style.setProperty('--ts-h', (s.offsetHeight + 8) + 'px');
  };
  TS.push = function (text, kind) {
    const s = stackEl();
    const el = document.createElement('div');
    el.className = 'toast-old';
    el.dataset.kind = kind || 'accent';
    el.innerHTML = icon(el.dataset.kind) + '<span>' + UI.esc(text) + '</span>';
    s.insertBefore(el, s.firstChild);
    while (s.children.length > TS.MAX - 1) s.lastChild.remove();
    el._t = setTimeout(() => { el.remove(); TS.place(); }, 2600);
    TS.place();
  };
  const hide = t => { t.style.opacity = 0; t.classList.remove('ts-on'); };
  UI.toast = function (msg, ms) {
    if (!msg) return;
    const t0 = document.getElementById('toast');
    if (shown(t0) && t0.textContent !== String(msg)) TS.push(t0.textContent, t0.dataset.kind);
    const wait = Math.max(+ms || 0, TS.MS);
    const r = orig.call(this, msg, wait);
    const t = document.getElementById('toast');
    if (t) {
      const k = TS.kind(msg);
      t.dataset.kind = k;
      t.insertAdjacentHTML('afterbegin', icon(k));   // no text in an icon: textContent stays the message
      t.classList.add('ts-on');
      clearTimeout(UI.toastT);
      UI.toastT = setTimeout(() => hide(t), wait);
      if (!t._ts) {
        t._ts = 1;
        // a pause while the pointer or focus is on it; 1.5 s more once it leaves
        const hold = () => clearTimeout(UI.toastT);
        const go = () => { clearTimeout(UI.toastT); UI.toastT = setTimeout(() => hide(t), 1500); };
        t.addEventListener('mouseenter', hold); t.addEventListener('mouseleave', go);
        t.addEventListener('focusin', hold); t.addEventListener('focusout', go);
      }
      TS.log.push(String(msg).slice(0, 80)); if (TS.log.length > 20) TS.log.shift();
      TS.place();
    }
    return r;
  };
  const R = ':root[data-theme] body';
  const CSS = `
${R} #toast{bottom:calc(72px + var(--ts-h,0px));display:flex;align-items:flex-start;gap:8px;transition:opacity var(--m-exit,180ms) var(--ease-exit,ease-in)}
@media (max-width:760px){${R} #toast{bottom:calc(16px + var(--ts-h,0px))}}
${R} #toast.ts-on{pointer-events:auto}
${R} #toast > .ts-ic, ${R} #toast-stack .ts-ic{flex:none;width:16px;height:16px;margin-top:2px}
${R} #toast[data-kind=danger], ${R} #toast-stack [data-kind=danger]{border-left-color:var(--danger)}
${R} #toast[data-kind=ok], ${R} #toast-stack [data-kind=ok]{border-left-color:var(--ok)}
${R} #toast[data-kind=info], ${R} #toast-stack [data-kind=info]{border-left-color:var(--info)}
${R} #toast[data-kind=danger] > .ts-ic, ${R} #toast-stack [data-kind=danger] .ts-ic{color:var(--danger)}
${R} #toast[data-kind=ok] > .ts-ic, ${R} #toast-stack [data-kind=ok] .ts-ic{color:var(--ok)}
${R} #toast[data-kind=accent] > .ts-ic, ${R} #toast-stack [data-kind=accent] .ts-ic{color:var(--accent)}
${R} #toast-stack{position:fixed;right:16px;bottom:72px;z-index:79;display:flex;flex-direction:column;gap:8px;width:min(320px,calc(100vw - 32px));pointer-events:none}
${R} #toast-stack > .toast-old{display:flex;align-items:flex-start;gap:8px;padding:8px 14px;border-radius:var(--r-m,10px);border:1px solid var(--line-strong);border-left:3px solid var(--accent);
  background:var(--overlay);color:var(--ink-2);box-shadow:var(--e-2);font-family:var(--f-ui);font-size:var(--t-small,13px);line-height:1.35;opacity:.92;
  display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
${R} #toast-stack > .toast-old{display:flex}
${R} #toast-stack > .toast-old > span{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
${R} #toast-stack > .toast-old + .toast-old{opacity:.8}
@media (max-width:760px){${R} #toast-stack{left:16px;right:16px;width:auto}}
`;
  const install = () => {
    if (document.getElementById('ts-style')) return;
    const st = document.createElement('style'); st.id = 'ts-style'; st.textContent = CSS; document.head.appendChild(st);
  };
  if (document.head) install(); else document.addEventListener('DOMContentLoaded', install);
})();
