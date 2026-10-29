// 91-look, part 7 (cycle 2): the title screen as a vista (brief §6, §7.2; cycle 1 visual I4). Over 86-title-fold's dawn
// sky (94's woodblock, kept as the ground) it lays:
//   - three parallax layers in the brief's dawn colours: a cloud bank, a far ridge and a near ridge with a rim of light,
//     each drifting on its own slow cycle (60 s and more: the one looping motion the brief allows, and none at all under
//     reduced motion or Motion off);
//   - three busts of the continent's peoples along the bottom, from three realms of three different lands, each drawn by
//     93-anime-portraits at full size;
//   - the logotype in Dela Gothic One over an ink-brush stroke, with a vermilion seal.
// Everything is seeded from the world's seed through a hash: the same world, the same vista. It reads the world and
// never changes it: the busts are people made for the picture, never stored, and no random number is drawn.
(function () {
  if (typeof document === 'undefined' || typeof UI.renderTitle !== 'function') return;
  const TL = UI.LOOK.TITLE = {};
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const f1 = n => (Math.round(n * 10) / 10).toString();
  TL.seed = () => String((A.S && A.S.seed) || 1105);

  // ---- the layers ------------------------------------------------------------------------------------------------------
  // a ridge line by midpoint displacement, as a closed shape down to the bottom of a 2400 x 600 strip (twice as wide as
  // it is seen, so it can drift)
  TL.ridge = function (r, y0, rough, n) {
    const N = 1 << n, ys = new Array(N + 1);
    ys[0] = y0 + (r() - .5) * rough; ys[N] = ys[0];
    for (let step = N; step > 1; step >>= 1) {
      const amp = rough * step / N;
      for (let i = step / 2; i < N; i += step) ys[i] = (ys[i - step / 2] + ys[i + step / 2]) / 2 + (r() - .5) * amp;
    }
    let d = `M0 600L0 ${f1(ys[0])}`;
    for (let i = 1; i <= N; i++) d += `L${f1(i * 2400 / N)} ${f1(ys[i])}`;
    return { d: d + 'L2400 600Z', top: ys };
  };
  TL.layers = function (seedStr) {
    const r = rng(hash('title|' + seedStr));
    const far = TL.ridge(r, 280, 130, 6), mid = TL.ridge(r, 360, 100, 6), near = TL.ridge(r, 450, 60, 5);
    // the near ridge's lit edge: its own top line, a stroke in the dawn light
    const edge = near.d.replace(/L2400 600Z$/, '').replace(/^M0 600L/, 'M');
    let clouds = '';
    for (let i = 0; i < 9; i++) {
      const x = r() * 2400, y = 90 + r() * 170, w = 160 + r() * 340, h = 10 + r() * 16;
      clouds += `<path d="M${f1(x)} ${f1(y)}h${f1(w)}q${f1(h)} 0 ${f1(h)} ${f1(h * .6)}h-${f1(w + h * 2)}q0 -${f1(h * .6)} ${f1(h)} -${f1(h * .6)}z"/>`;
    }
    const svg = (cls, inner, extra) => `<svg class="tl-l ${cls}" viewBox="0 0 2400 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"${extra || ''}>${inner}</svg>`;
    // a band of morning mist at the foot of each ridge (bokashi: the light colour fading up into the land)
    const fog = (y, id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2a77a" stop-opacity="0"/><stop offset=".7" stop-color="#f2a77a" stop-opacity=".42"/><stop offset="1" stop-color="#f2a77a" stop-opacity="0"/></linearGradient></defs><rect x="0" y="${y}" width="2400" height="90" fill="url(#${id})"/>`;
    return svg('tl-clouds', `<g fill="#f6c7a6" fill-opacity=".55">${clouds}</g>`) +
      svg('tl-far', `<path d="${far.d}" fill="#6d6a9a" fill-opacity=".9"/>${fog(330, 'tlfog1')}`) +
      svg('tl-mid', `<path d="${mid.d}" fill="#463f6e"/>${fog(405, 'tlfog2')}`) +
      svg('tl-near', `<path d="${near.d}" fill="#2a2440"/><path d="${edge}" fill="none" stroke="#ffd9a0" stroke-width="2.4" stroke-opacity=".75"/>`);
  };

  // ---- the three peoples ---------------------------------------------------------------------------------------------
  // three living realms of three different lands of the Great Continent (the largest first, then a hashed pick), and one
  // person of each realm's culture, made for the picture
  TL.people = function (seedStr) {
    const S = A.S, D = A.FAR && A.FAR.D, Lore = typeof LORE !== 'undefined' && LORE.cultures;
    // the continent's peoples: the lore's while its lands are open, else the generated data's (read only)
    const Lc = Object.assign({}, D && D.cultures || {}, Lore || {});
    if (!S || !S.realms || !Lc || !GD.SKIN) return [];
    let realms = Object.values(S.realms).filter(r => r && r.alive && r.cult && Lc[r.cult] && Lc[r.cult].land)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0) || (a.id < b.id ? -1 : 1)).slice(0, 40);
    // before a life begins the world in memory may be the old one: then the continent's peoples come from the lore
    if (realms.length < 3) realms = Object.keys(Lc).filter(id => Lc[id] && Lc[id].land).sort().map(id => ({ id: null, cult: id }));
    const r = rng(hash('peoples|' + seedStr)), seen = new Set(), out = [];
    const pool = realms.slice().sort((a, b) => hash(seedStr + a.cult + a.id) - hash(seedStr + b.cult + b.id));
    for (const R of pool) {
      const land = Lc[R.cult].land;
      if (seen.has(land)) continue;
      seen.add(land);
      const i = out.length, F = r() < .5, age = [24, 19, 33][i];
      const skins = GD.SKIN.human, hairs = (GD.HAIR || []).length || 9;
      out.push({
        id: `title-${seedStr}-${i}`, given: '', sur: '', sex: F ? 'F' : 'M', race: 'human', cult: R.cult, realm: R.id, born: (S.year || 1105) - age,
        alive: true, status: i === 1 ? 'gentry' : 'commoner', house: null, ruler: null, noble: null, mil: null, job: null, traits: i === 0 ? ['gregarious'] : i === 2 ? ['proud'] : [],
        quirks: [], wounds: [], happy: [84, 62, 50][i], health: 90, rel: {}, flags: {}, gear: { weapon: 'fists', armor: 'none' },
        app: { skin: skins[Math.floor(r() * skins.length)], hair: Math.floor(r() * hairs), eye: Math.floor(r() * 8), hstyle: F ? ['long', 'braided', 'tied'][Math.floor(r() * 3)] : ['short', 'long', 'topknot'][Math.floor(r() * 3)],
          beard: 'none', build: 'average', face: Math.floor(r() * 3), eyeShape: Math.floor(r() * 3), brow: 0, mouth: 0, nose: 0 },
      });
      if (out.length === 3) break;
    }
    return out;
  };
  TL.busts = function (seedStr) {
    if (typeof PORTRAIT === 'undefined' || !PORTRAIT.svg) return '';
    let html = '';
    TL.people(seedStr).forEach((p, i) => {
      let s = '';
      try { s = PORTRAIT.svg(p, 200, { bust: true }); } catch (e) { s = ''; }
      if (s) html += `<div class="tl-bust tl-b${i}">${s}</div>`;
    });
    return html ? `<div class="tl-busts" aria-hidden="true">${html}</div>` : '';
  };

  // ---- the logotype: an ink-brush stroke and a seal ------------------------------------------------------------------
  TL.brush = function (seedStr) {
    const r = rng(hash('brush|' + seedStr)), n = 28, top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = 20 + t * 960, swell = Math.sin(Math.PI * Math.pow(t, .8)) * (1 - t * .25);
      const w = 8 + 62 * swell + (r() - .5) * 10;
      const y = 86 - t * 18 + (r() - .5) * 4;
      top.push([x, y - w / 2 + (r() - .5) * 5]); bot.push([x + (r() - .5) * 6, y + w / 2 + (r() - .5) * 7]);
    }
    const d = 'M' + top.map(p => p.map(f1).join(' ')).join('L') + 'L' + bot.reverse().map(p => p.map(f1).join(' ')).join('L') + 'Z';
    // dry-brush streaks where the bristles ran out of ink
    let dry = '';
    for (let k = 0; k < 7; k++) {
      const y = 60 + r() * 50, x0 = 520 + r() * 300, len = 80 + r() * 160;
      dry += `M${f1(x0)} ${f1(y)}l${f1(len)} ${f1(-len * .02)}l0 ${f1(1.2 + r() * 2)}l-${f1(len)} ${f1(len * .02)}z`;
    }
    return `<svg class="tl-brush" viewBox="0 0 1000 170" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="${d}" fill="#c23c27"/><path d="${dry}" fill="#2a2440" fill-opacity=".55"/></svg>`;
  };
  TL.seal = () => `<svg class="tl-seal" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><rect x="2" y="2" width="36" height="36" rx="4" fill="#c23c27"/><rect x="5.5" y="5.5" width="29" height="29" rx="2" fill="none" stroke="#f8f1e2" stroke-width="1.6"/><path d="M12 29L20 10L28 29M15 22H25" fill="none" stroke="#f8f1e2" stroke-width="2.6" stroke-linecap="square"/></svg>`;

  const render = UI.renderTitle;
  UI.renderTitle = function () {
    const h = render.apply(this, arguments);
    try {
      const t = document.createElement('template'); t.innerHTML = h;
      const root = t.content.querySelector('#title'); if (!root) return h;
      const seed = TL.seed();
      root.classList.add('tl-vista');
      const sky = root.querySelector('.tt-sky');
      if (sky) sky.insertAdjacentHTML('beforeend', `<div class="tl-par" aria-hidden="true">${TL.layers(seed)}</div>`);
      root.insertAdjacentHTML('beforeend', TL.busts(seed));
      // cycle 2 (visual F1): one composition. The map box leaves the title for How to play (86), and the pitch becomes
      // one line of counts under the logo
      const map = root.querySelector('#titlegc'); if (map) map.remove();
      const f = UI.TITLE && UI.TITLE.facts ? UI.TITLE.facts() : null, bl = root.querySelector('.blurb');
      if (bl && f) { bl.classList.add('tl-count'); bl.textContent = `${f.realms.toLocaleString('en')} realms · ${f.provinces.toLocaleString('en')} provinces · one life`; }
      const logo = root.querySelector('.logo');
      if (logo && !logo.querySelector('.tl-brush')) { logo.classList.add('tl-logo'); logo.insertAdjacentHTML('afterbegin', TL.brush(seed)); logo.insertAdjacentHTML('beforeend', TL.seal()); }
      return t.innerHTML;
    } catch (e) { console.error('title vista', e); return h; }
  };

  // ---- the look --------------------------------------------------------------------------------------------------------
  const MOVE = [':root:not([data-motion]) ', ':root[data-motion=full] '];
  const drift = css => `@media (prefers-reduced-motion:no-preference){${MOVE[0]}${css}}\n${MOVE[1]}${css}`;
  TL.CSS = `
#title.tl-vista .tt-sky .tl-par{position:absolute;inset:0;overflow:hidden}
#title.tl-vista .tt-sky svg.tl-l{position:absolute;inset:0 -10%;width:120%;max-width:none;height:100%;display:block}
@keyframes tlDrift{from{transform:translateX(-2%)}to{transform:translateX(2%)}}
@keyframes tlDriftC{from{transform:translateX(-5%)}to{transform:translateX(5%)}}
@keyframes tlBreathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes tlIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes tlStroke{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes tlSeal{0%{opacity:0;transform:scale(2.2) rotate(-24deg)}60%{opacity:1;transform:scale(.92) rotate(-6deg)}100%{opacity:1;transform:rotate(-8deg)}}
${drift(`#title.tl-vista .tt-sky .tl-clouds{animation:tlDriftC 90s ease-in-out infinite alternate}`)}
${drift(`#title.tl-vista .tt-sky .tl-far{animation:tlDrift 120s ease-in-out infinite alternate-reverse}`)}
${drift(`#title.tl-vista .tt-sky .tl-mid{animation:tlDrift 75s ease-in-out infinite alternate}`)}
${drift(`#title.tl-vista .tt-sky .tl-near{animation:tlDrift 60s ease-in-out infinite alternate-reverse}`)}
${drift(`#title.tl-vista .tl-bust{animation:tlIn 700ms cubic-bezier(.05,.7,.1,1) both,tlBreathe 7s ease-in-out 700ms infinite}`)}
${drift(`#title.tl-vista .tl-b1{animation-delay:120ms,820ms}`)}
${drift(`#title.tl-vista .tl-b2{animation-delay:240ms,940ms}`)}
${drift(`#title.tl-vista .tl-logo .tl-brush{animation:tlStroke 700ms cubic-bezier(.6,.05,.25,1) both}`)}
${drift(`#title.tl-vista .tl-logo .tl-seal{animation:tlSeal 420ms cubic-bezier(.3,1.4,.5,1) 600ms both}`)}
/* the busts: three peoples along the bottom, under the veil's darkest band, never over the buttons */
#title.tl-vista .tl-busts{position:fixed;left:0;right:0;bottom:0;height:0;z-index:-1;pointer-events:none}
#title.tl-vista .tl-bust{position:absolute;bottom:0;width:clamp(150px,17vw,300px);aspect-ratio:1;filter:drop-shadow(0 10px 24px rgba(4,6,14,.6))}
#title.tl-vista .tl-bust svg{width:100%;height:100%;display:block;-webkit-mask-image:linear-gradient(180deg,#000 62%,transparent 98%);mask-image:linear-gradient(180deg,#000 62%,transparent 98%)}
#title.tl-vista .tl-bust svg > use{display:none}
#title.tl-vista .tl-b0{left:max(1vw,8px);transform-origin:50% 100%}
#title.tl-vista .tl-b1{right:calc(max(1vw,8px) + clamp(120px,13vw,230px));bottom:0;width:clamp(120px,13vw,240px)}
#title.tl-vista .tl-b2{right:max(1vw,8px);width:clamp(140px,15vw,270px)}
@media (max-width:1180px){#title.tl-vista .tl-b1{display:none}}
/* cycle 2 (visual B1): the vista is always a dawn or night picture, so its words take Night's ink in both themes */
#title.tl-vista, :root[data-theme] #title.tl-vista{--ink:#eee8da;--ink-2:#bdb8cc;--ink-3:#a9a6bd;color-scheme:dark;color:#eee8da}
:root[data-theme] #title.tl-vista .sub, :root[data-theme] #title.tl-vista .blurb, :root[data-theme] #title.tl-vista .muted, :root[data-theme] #title.tl-vista .small, :root[data-theme] #title.tl-vista p{color:#e9e2d4}
:root[data-theme] #title.tl-vista .sub{color:#d9cfe8;text-shadow:0 1px 2px rgba(10,12,30,.8)}
:root[data-theme] #title.tl-vista .btns button.ghost{background:rgba(14,16,36,.62);border-color:rgba(233,226,212,.42);color:#f1ead9}
/* cycle 2 (visual F1): one composition. The logo at 38% of the height, one line of counts, the primary 64 px below */
#title.tl-vista{display:flex;flex-direction:column;align-items:center;min-height:100vh;box-sizing:border-box;padding-top:max(24px,calc(38vh - 96px))}
:root[data-theme] #title.tl-vista .logo.tl-logo{font-size:clamp(56px,calc(var(--t-display,44px) * 1.6 * var(--tx,1)),112px)}
#title.tl-vista .blurb.tl-count{max-width:none;margin:10px 0 0;font-family:var(--f-ui,sans-serif);font-size:calc(17px * var(--tx,1));letter-spacing:.08em;font-variant-numeric:tabular-nums;text-shadow:0 1px 3px rgba(10,12,30,.9)}
#title.tl-vista .btns{margin-top:64px;max-width:min(720px,94vw);display:flex;flex-wrap:wrap;justify-content:center}
@media (min-width:1600px){
  #title.tl-vista .tl-bust{width:clamp(320px,21vw,420px)}
  #title.tl-vista .tl-b0{left:4vw;bottom:-2vh}
  #title.tl-vista .tl-b1{right:calc(4vw + clamp(250px,17vw,340px));bottom:6vh;width:clamp(300px,19vw,380px)}
  #title.tl-vista .tl-b2{right:2vw;bottom:-3vh;width:clamp(320px,21vw,420px)}
}
/* the phone: the sky, two ridges and one bust behind the logo, faint, still */
@media (max-width:900px){
  #title.tl-vista .tl-busts{display:block;position:absolute;left:0;right:0;top:0;height:auto}
  #title.tl-vista .tl-bust{display:none;animation:none!important}
  #title.tl-vista .tl-b0{display:block;position:absolute;left:50%;top:max(4px,calc(38vh - 190px));bottom:auto;width:min(120px,32vw);transform:translateX(-50%);opacity:.4;filter:none}
  #title.tl-vista .tt-sky svg.tl-clouds{display:none}
  #title.tl-vista{padding-top:max(20px,calc(38vh - 70px))}
  #title.tl-vista .btns{margin-top:40px}
}

/* the logotype: Dela Gothic One over a vermilion brush stroke, a seal at its end */
#title.tl-vista .logo.tl-logo, :root[data-theme] #title.tl-vista .logo.tl-logo{position:relative;display:inline-block;font-family:var(--f-impact,"Dela Gothic One",sans-serif);font-weight:400;letter-spacing:.06em;color:#f8f1e2;
  padding:.08em .5em .14em;text-shadow:3px 3px 0 #1b1730,0 0 30px rgba(255,217,160,.35);background:none;-webkit-text-fill-color:currentColor;isolation:isolate}
#title.tl-vista .logo.tl-logo svg.tl-brush{position:absolute;left:-14%;top:34%;height:78%;width:128%;max-width:none;z-index:-1;opacity:.95;transform:rotate(-3deg)}
#title.tl-vista .logo.tl-logo svg.tl-seal{position:absolute;right:-.5em;bottom:-.05em;width:.5em;height:.5em;transform:rotate(-8deg)}
#title.tl-vista .logo.tl-logo::after{display:none}
`;
  const put = () => { if (document.getElementById('tl-style')) return; const s = document.createElement('style'); s.id = 'tl-style'; s.textContent = TL.CSS; document.head.appendChild(s); };
  if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
})();
