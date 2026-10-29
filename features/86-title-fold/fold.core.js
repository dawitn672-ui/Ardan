// The title screen's "Begin a new life" sits in sight on a laptop. The map strip is drawn 579 px tall whatever the
// window, so on 1280x800, 1366x768 and 1440x900 (the commonest laptop screens) the buttons began at 891 px, below the
// bottom edge: a new player saw a map and a paragraph and had to know to scroll. The strip now takes the height the
// window can spare (the window less about 430 px for the title, the lines under the map and both rows of buttons),
// never more than its own 579 or less than 220. Only its height is set, so the canvas keeps its shape and simply draws
// smaller.
(function () {
  // desktop only: on a phone the strip is already as narrow as the screen and short enough
  const css = '@media (min-width:761px){#title canvas.mapstrip{height:clamp(220px,calc(100vh - 430px),579px);width:auto;max-width:100%}}';
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tf-style')) return; const s = document.createElement('style'); s.id = 'tf-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();

// ---- Cycle 1 (first-hour B3, visual I4): the title pitches the Great Continent, under a dawn sky, with one primary
// button. It said "Thirty-four realms" and showed the old Known World strip while the default lands are the Great
// Continent; and its five buttons were all one weight. Now:
// - The sky is 94-woodblock-skies' dawn print (UI.SKIES.svg, the brief's hour table), full-bleed behind the screen.
// - The map is the whole continent, drawn once from 99-far-lands' own grid (A.FAR.D, every province's cell) in 62's
//   day-print colours: washi land with each realm's tint, its borders and coast in ink, a Prussian-blue sea. No world
//   is built for it, so the title costs about 40 ms more, not the second and a half a Great Continent world takes.
// - The text counts the realms and provinces from the same data the creation screen counts them from.
// - "Begin a new life" is the one primary button; Continue, Random life, Load, Mods and How to play are quiet.
// With the Known World as the default lands (no 99-far-lands) the release's strip and words stay.
(function () {
  const FAR = () => (typeof A !== 'undefined' && A.FAR && A.FAR.D && A.FAR.MENU_LANDS === 'great') ? A.FAR : null;
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const TF = UI.TITLE = UI.TITLE || {};
  TF.facts = function () {
    const F = FAR(); if (!F) return null;
    const D = F.D, nFar = Object.keys(D.realms).length, nKnown = Object.keys(LORE.realms).filter(id => !D.realms[id]).length;
    return { realms: nKnown + nFar, provinces: D.base + D.provinces.id.length, km: D.gw * D.cell, lands: Object.keys(D.lands || {}).length };
  };
  // the continent as a picture: one pixel for each 2 x 2 cells of the grid, the colours of 62's day print
  let pic = null;
  TF.mapCanvas = function () {
    if (pic) return pic;
    const F = FAR(); if (!F || typeof document === 'undefined' || !MAP.decodeRle) return null;
    const D = F.D, gw = D.gw, gh = D.gh, k = 2, W = Math.floor(gw / k), H = Math.floor(gh / k);
    const g = new Int16Array(gw * gh).fill(-1); MAP.decodeRle(D.rle, g);
    // the Known World's cells come from the map as written, set into the great grid as 99's MAP frame does
    const BG = LORE.map, bw = BG.gw, bh = BG.gh, bb = new Int16Array(bw * bh); MAP.decodeRle(BG.rle, bb);
    for (let y = 0; y < bh; y++) g.set(bb.subarray(y * bw, (y + 1) * bw), (y + (D.oy || 0)) * gw + (D.ox || 0));
    const base = LORE.map.provinces, nb = D.base, C = D.provinces;
    const rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h || '')); const v = m ? parseInt(m[1], 16) : 0xb0a080; return [v >> 16 & 255, v >> 8 & 255, v & 255]; };
    const WASHI = [239, 230, 210], INK = [59, 42, 23], SEA0 = [95, 143, 200], SEA1 = [23, 48, 99];
    const tint = {}, col = id => {
      if (tint[id]) return tint[id];
      const r = id < nb ? (base[id] && base[id].realm) : C.realm[id - nb], L = (LORE.realms[r] || (D.realms && D.realms[r]) || {}).color, c = rgb(L);
      return (tint[id] = WASHI.map((w, i) => Math.round(w + (c[i] - w) * 0.35)));
    };
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? -1 : g[(y * k) * gw + x * k];
    // cropped to the land, with a margin of sea
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) >= 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const m = 12; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
    const CW = x1 - x0 + 1, CH = y1 - y0 + 1;
    const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(CW, CH), px = img.data;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const id = at(x, y), o = ((y - y0) * CW + (x - x0)) * 4;
      let c;
      if (id < 0) {
        // the sea: light at the coast, deep offshore (a quick look a few cells around)
        let near = 0; for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [6, 0], [-6, 0], [0, 6], [0, -6]]) if (at(x + dx, y + dy) >= 0) near++;
        const t = Math.min(1, near / 3), v = (y - y0) / CH * 0.25;
        c = SEA1.map((d, i) => Math.round(d + (SEA0[i] - d) * Math.max(0, t * 0.8 - v)));
      } else {
        const r = at(x + 1, y), d = at(x, y + 1);
        if (r < 0 || d < 0 || at(x - 1, y) < 0 || at(x, y - 1) < 0) c = INK;                                // the coast
        else {
          const owner = i => i < nb ? (base[i] && base[i].realm) : C.realm[i - nb];
          c = (owner(r) !== owner(id) || owner(d) !== owner(id)) ? col(id).map(v => Math.round(v * 0.62)) : col(id); // a realm's border
        }
      }
      px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return (pic = cv);
  };
  TF.sky = function () {
    const SK = UI.SKIES; if (!SK || !SK.svg) return '';
    try { return `<div class="tt-sky" aria-hidden="true">${SK.svg('none', 'title|1105', 4, { hour: 'dawn', terr: 'hills' })}</div>`; } catch (e) { console.error('title sky', e); return ''; }
  };
  const render = UI.renderTitle;
  UI.renderTitle = function () {
    const h = render.apply(this, arguments);
    if (typeof document === 'undefined') return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const root = t.content.querySelector('#title'); if (!root) return h;
      root.classList.add('tt-dawn');
      const f = TF.facts();
      if (f) {
        const old = root.querySelector('#titlemap');
        if (old) {
          const src = TF.mapCanvas(), cv = document.createElement('canvas'); cv.id = 'titlegc'; cv.className = 'mapstrip gcstrip';
          cv.width = src ? src.width : Math.floor(FAR().D.gw / 2); cv.height = src ? src.height : Math.floor(FAR().D.gh / 2);
          cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', `A map of the Great Continent: ${fmt(f.realms)} realms and ${fmt(f.provinces)} provinces`);
          old.replaceWith(cv);
        }
        const b = root.querySelector('.blurb');
        if (b) b.textContent = `Dawn of 1 January 1105 AR. One continent, ${fmt(f.km)} km from the western sea to the Sunrise Isles: ${fmt(f.realms)} realms and ${fmt(f.provinces)} provinces. ` +
          'No magic, only blood, steel, coin and will. Be born a slave on a pearl-boat or a prince of the Iron Crown, and live it a week or a month at a time. Then go on as your child.';
      }
      // one primary button; the rest are quiet
      const btns = root.querySelector('.btns');
      if (btns) for (const x of btns.querySelectorAll('button')) { if (x.dataset.a === 'newLife') { x.classList.add('primary', 'tt-go'); } else { x.classList.remove('primary'); x.classList.add('ghost'); } }
      const go = btns && btns.querySelector('[data-a=newLife]');
      if (go && btns.firstElementChild !== go) btns.prepend(go);
      // the slot for 995-hall-of-lives' "Your lives" shelf (UI.hallShelf): under the buttons, before the small print
      if (btns && !root.querySelector('.hl-shelf')) btns.after(document.createComment('hall'));
      root.insertAdjacentHTML('afterbegin', TF.sky());
      return t.innerHTML;
    } catch (e) { console.error('title', e); return h; }
  };
  // cycle 2 (visual F1): the title is one composition with no map in it; the continent's map and the pitch open How to play
  TF.pitch = f => `Dawn of 1 January 1105 AR. One continent, ${fmt(f.km)} km from the western sea to the Sunrise Isles: ${fmt(f.realms)} realms and ${fmt(f.provinces)} provinces. ` +
    'No magic, only blood, steel, coin and will. Be born a slave on a pearl-boat or a prince of the Iron Crown, and live it a week or a month at a time. Then go on as your child.';
  const help = UI.helpModal;
  if (typeof help === 'function') UI.helpModal = function () {
    const h = help.apply(this, arguments);
    try {
      const f = TF.facts(), src = f && TF.mapCanvas();
      if (!f || !src || typeof h !== 'string') return h;
      const add = `<div class="tf-help"><canvas id="helpgc" class="gcstrip" width="${src.width}" height="${src.height}" role="img" aria-label="${UI.esc(`A map of the Great Continent: ${fmt(f.realms)} realms and ${fmt(f.provinces)} provinces`)}"></canvas><p class="tf-pitch">${UI.esc(TF.pitch(f))}</p></div>`;
      const m = /<h2[^>]*>[\s\S]*?<\/h2>/.exec(h);
      return m ? h.slice(0, m.index + m[0].length) + add + h.slice(m.index + m[0].length) : add + h;
    } catch (e) { return h; }
  };
  const drawHelp = () => { const cv = document.getElementById('helpgc'); if (cv && !cv.dataset.drawn) { const src = TF.mapCanvas(); if (src) { cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height); cv.dataset.drawn = '1'; } } };
  const rmod = UI.renderModal;
  if (typeof rmod === 'function') UI.renderModal = function () { const r = rmod.apply(this, arguments); try { drawHelp(); } catch (e) {} return r; };
  const after = UI.afterRender;
  UI.afterRender = function () {
    const r = after.apply(this, arguments);
    try {
      const cv = UI.screen === 'title' && document.getElementById('titlegc');
      if (cv) { const src = TF.mapCanvas(); if (src) cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height); }
    } catch (e) { console.error('title map', e); }
    return r;
  };
  const css = [
    '#title.tt-dawn{position:relative;isolation:isolate}',
    '#title .tt-sky{position:fixed;inset:0;z-index:-1;pointer-events:none;overflow:hidden}',
    '#title .tt-sky svg{position:absolute;inset:0;width:100%;height:100%;display:block}',
    // a veil from the sky's lower half down, so the words read on it in both themes
    '#title .tt-sky::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,30,.05) 0%,rgba(10,12,30,.35) 38%,rgba(10,12,30,.82) 70%,rgba(10,12,30,.92) 100%)}',
    '#title.tt-dawn .sub,#title.tt-dawn .blurb,#title.tt-dawn .muted{color:#e9e2d4}',
    '#title.tt-dawn .logo{font-size:clamp(48px,9vw,var(--t-display,84px));line-height:1}',
    '#title.tt-dawn .logo::after{content:"";display:block;width:min(240px,40%);height:2px;margin:12px auto 0;background:linear-gradient(90deg,transparent,var(--accent,#e8b04a),transparent)}',
    '#title canvas.gcstrip{border-radius:var(--r-m,8px);image-rendering:auto}',
    '.tf-help{margin:0 0 12px}.tf-help canvas{display:block;width:100%;height:auto;border-radius:var(--r-m,8px);border:1px solid var(--line-strong)}.tf-help .tf-pitch{margin:8px 0 0;font-family:var(--f-prose,serif)}',
    '@media (min-width:761px){#title canvas.gcstrip{height:clamp(150px,calc(100vh - 500px),420px);width:auto;max-width:100%}}',
    '#title .btns button.ghost{background:rgba(14,16,36,.55);border-color:rgba(233,226,212,.35);color:#f1ead9}',
    '#title .btns button.tt-go{min-width:280px;font-size:calc(20px * var(--tx,1));padding:14px 28px}',
    '@media (min-width:761px){#title .btns{row-gap:10px}#title .btns button:not(.tt-go){min-width:0;padding:8px 16px;font-size:calc(15px * var(--tx,1));min-height:40px}#title .btns .tt-go{flex-basis:100%;max-width:360px;margin:0 calc(50% - 180px)}}',
  ].join('');
  const put = () => { if (typeof document === 'undefined' || document.getElementById('tt-style')) return; const s = document.createElement('style'); s.id = 'tt-style'; s.textContent = css; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
