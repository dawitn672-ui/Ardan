// The look and sound of the chronicle (Road to Ten, Visual art 1, 5, 6, 7; docs/art/style-guide.md).
//   - a woodcut at the head of every event (woodcut.core.js), inked in once when the scene first opens;
//   - the Chronicle tab set as a vellum page: ink on parchment, rubricated headings, an illuminated initial;
//   - small motion: new lines of the story ink in, a new year turns in like a page, steel flashes across a fight as it
//     opens; nothing moves for a player who asks the system for reduced motion;
//   - sound, off until the player turns it on: a quill when you choose, a wax seal when you save, a bell at the new
//     year, steel when a battle opens. All synthesized with Web Audio: no files, nothing fetched.
// Everything here is the UI's: no random draws, no change to the game state. Settings live in UI.set (saved with the
// player's other settings in this browser).
(function () {
  const IL = UI.ILLUM = {};
  if (UI.set.woodcuts == null) UI.set.woodcuts = true;
  if (UI.set.sound == null) UI.set.sound = false;
  if (UI.set.vellum == null) UI.set.vellum = true;
  const reduced = () => { try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  // ---- styles (style-src allows inline styles)
  IL.CSS = `
  .woodcut-wrap{margin:-4px -4px 12px;}
  .woodcut-wrap svg.woodcut{display:block;width:100%;height:auto;aspect-ratio:600/180;max-height:190px;border-radius:2px;box-shadow:0 2px 0 rgba(0,0,0,.35),0 6px 18px rgba(0,0,0,.35)}
  .ink-in{animation:ilInk .7s ease-out both}
  @keyframes ilInk{from{opacity:0;filter:blur(3px) contrast(1.6)}60%{opacity:1;filter:blur(.6px)}to{opacity:1;filter:none}}
  .il-new{animation:ilLine .9s ease-out both}
  @keyframes ilLine{from{opacity:0;letter-spacing:.02em;filter:blur(1.5px)}to{opacity:1;letter-spacing:normal;filter:none}}
  [data-vellum="1"] .il-vellum{background:radial-gradient(ellipse at 50% 40%,#f1e6cc 55%,#e2d0a8 100%);color:#2b1d10;border-radius:3px;padding:14px 18px;box-shadow:inset 0 0 40px rgba(120,90,40,.25),0 4px 14px rgba(0,0,0,.4)}
  [data-vellum="1"] .il-vellum h1,[data-vellum="1"] .il-vellum h2,[data-vellum="1"] .il-vellum h3{color:#8e2414}
  [data-vellum="1"] .il-vellum h4,[data-vellum="1"] .il-vellum h5,[data-vellum="1"] .il-vellum .gold,[data-vellum="1"] .il-vellum [class*="chap"]{color:#6b4410}
  [data-vellum="1"] .il-vellum a{color:#8e2414}
  [data-vellum="1"] .il-vellum .muted,[data-vellum="1"] .il-vellum .tiny{color:#5b4630}
  [data-vellum="1"] .il-vellum p:first-of-type::first-letter{float:left;font-family:'Cinzel Decorative',serif;font-size:3.2em;line-height:.9;margin:.06em .12em 0 0;color:#8e2414;text-shadow:1px 1px 0 #b98a2a}
  [data-vellum="1"] .il-vellum button{color:#2b1d10;border-color:#8a6a3a;background:#e9dcbc}
  [data-vellum="1"] .mapwrap,[data-vellum="1"] .mapstrip{position:relative}
  [data-vellum="1"]:not([data-inkmap="1"]) canvas.worldmap,[data-vellum="1"]:not([data-inkmap="1"]) canvas.mapstrip{filter:sepia(.28) saturate(.85) contrast(1.04)}
  [data-vellum="1"] .mapwrap::after{content:"";position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 62%,rgba(70,45,15,.38) 100%);mix-blend-mode:multiply}
  [data-vellum="1"][data-inkmap="1"] .mapwrap::after{background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 66%,rgba(70,45,15,.2) 100%)}
  .il-compass{position:absolute;right:10px;bottom:10px;width:84px;height:84px;pointer-events:none;opacity:.92;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))}
  [data-vellum="0"] .il-compass{display:none}
  @media (max-width:700px){.il-compass{width:54px;height:54px}}
  .il-turn{animation:ilTurn .8s ease-out both;transform-origin:0 50%}
  @keyframes ilTurn{from{opacity:0;transform:perspective(900px) rotateY(-28deg);filter:brightness(1.15)}to{opacity:1;transform:none;filter:none}}
  .il-steel{position:absolute;inset:0;pointer-events:none;border-radius:inherit;overflow:hidden;z-index:3}
  .il-steel::before{content:"";position:absolute;top:-20%;bottom:-20%;width:38%;left:-45%;transform:skewX(-22deg);background:linear-gradient(90deg,rgba(255,250,235,0) 0%,rgba(255,248,225,.55) 45%,rgba(185,138,42,.35) 55%,rgba(255,250,235,0) 100%);animation:ilSteel .75s cubic-bezier(.2,.7,.2,1) .05s both}
  @keyframes ilSteel{from{left:-45%}to{left:120%}}
  .mbox.il-fight{position:relative}
  @media (prefers-reduced-motion: reduce){.ink-in,.il-new,.il-turn,.il-steel::before{animation:none}.il-steel{display:none}}
  `;
  IL.install = function () {
    if (typeof document === 'undefined' || document.getElementById('il-css')) return;
    const st = document.createElement('style'); st.id = 'il-css'; st.textContent = IL.CSS; document.head.appendChild(st);
  };
  // the map's sepia tint is for the release's painted relief; an inked map (62-inked-map) is already on vellum
  IL.applyVellum = function () {
    try { const d = document.documentElement.dataset; d.vellum = UI.set.vellum ? '1' : '0'; d.inkmap = UI.INKMAP && UI.set.inkMap !== false ? '1' : '0'; } catch (e) {}
  };

  // ---- the woodcut at the head of each event; it inks in the first time that scene is drawn
  const inked = new WeakSet();
  IL.woodcutFor = function (q) {
    if (!UI.set.woodcuts || !q || q.type !== 'event' || !UI.WOODCUT) return '';
    const shape = UI.WOODCUT.shapeOf(q, A.eventView(q)), mo = A.monthOf(A.today()).m;
    const svg = UI.WOODCUT.svg(shape, q.ev + '|' + A.S.year, mo);
    const fresh = !inked.has(q); inked.add(q);
    return `<div class="woodcut-wrap${fresh && !reduced() ? ' ink-in' : ''}">${svg}</div>`;
  };
  const modal = UI.eventModal;
  UI.eventModal = function (q) {
    const h = modal.apply(this, arguments);
    try {
      const wc = IL.woodcutFor(q);
      if (!wc) return h;
      const at = '<div class="panel mbox">';
      return h.startsWith(at) ? at + wc + h.slice(at.length) : wc + h;
    } catch (e) { return h; }
  };

  // ---- the Chronicle on vellum: wrap the book tab's page
  const book = UI.TAB && UI.TAB.book;
  if (typeof book === 'function') UI.TAB.book = function () {
    const h = book.apply(this, arguments);
    return UI.set.vellum ? `<div class="il-vellum">${h}</div>` : h;
  };

  // ---- the map: an inked compass rose on the world map (the canvas itself is the release's)
  IL.compass = () => {
    const I = '#2b1d10', P = '#ece0c4', R = '#9e2b1b', G = '#b98a2a';
    const pt = (a, l, w) => { const c = Math.cos, s = Math.sin, x = 50 + c(a) * l, y = 50 + s(a) * l, x1 = 50 + c(a + Math.PI / 2) * w, y1 = 50 + s(a + Math.PI / 2) * w, x2 = 50 + c(a - Math.PI / 2) * w, y2 = 50 + s(a - Math.PI / 2) * w;
      return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L50 50 Z" fill="${I}"/><path d="M${x2.toFixed(1)} ${y2.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L50 50 Z" fill="${P}" stroke="${I}" stroke-width="0.8"/>`; };
    let s = `<svg class="il-compass" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="34" fill="${P}" fill-opacity="0.85" stroke="${I}" stroke-width="1.6"/><circle cx="50" cy="50" r="30" fill="none" stroke="${I}" stroke-width="0.6"/>`;
    for (let i = 0; i < 8; i++) s += pt(-Math.PI / 2 + i * Math.PI / 4, i % 2 ? 22 : 40, i % 2 ? 4 : 6);
    s += `<path d="M50 4 L46 14 L54 14 Z" fill="${R}" stroke="${I}" stroke-width="0.8"/><circle cx="50" cy="50" r="3.4" fill="${G}" stroke="${I}" stroke-width="0.8"/><text x="50" y="98" text-anchor="middle" font-family="Cinzel, serif" font-size="11" fill="${I}" stroke="${P}" stroke-width="2.5" paint-order="stroke">N</text></svg>`;
    return s;
  };
  const world = UI.TAB && UI.TAB.world;
  if (typeof world === 'function') UI.TAB.world = function () {
    const h = world.apply(this, arguments);
    try { const at = h.indexOf('<div class="mapwrap"'); if (at < 0) return h; const end = h.indexOf('>', at) + 1; return h.slice(0, end) + IL.compass() + h.slice(end); } catch (e) { return h; }
  };

  // ---- motion in the story log: the lines written since the last drawing ink in, and a new year's block turns in
  //      like a page. Only counts are kept here (in this closure, not in the state).
  const shown = l => (Array.isArray(l) ? l[1] !== 'yearstart' : true) && (Array.isArray(l) ? l[0] : l);
  let seen = null;
  const logWrap = UI.renderLogWrap;
  if (typeof logWrap === 'function') UI.renderLogWrap = function () {
    let h = logWrap.apply(this, arguments);
    try {
      const S = A.S, log = (S && S.log) || [], last = log[log.length - 1];
      const now = { pc: S && S.pc, n: log.length, k: last ? last.lines.length : 0 };
      const prev = seen; seen = now;
      if (!prev || prev.pc !== now.pc || now.n < prev.n || reduced()) return h;
      let fresh = 0;
      for (let i = Math.max(0, prev.n - 1); i < log.length; i++) {
        const L = log[i].lines || [], from = i === prev.n - 1 ? prev.k : 0;
        for (let j = from; j < L.length; j++) if (shown(L[j])) fresh++;
      }
      if (now.n > prev.n) { const at = h.lastIndexOf('<div class="ly">'); if (at >= 0) h = h.slice(0, at) + '<div class="ly il-turn">' + h.slice(at + 16); }
      fresh = Math.min(fresh, 12);
      for (let at = h.length; fresh > 0; fresh--) {
        at = h.lastIndexOf('<div class="ll ', at - 1); if (at < 0) break;
        h = h.slice(0, at) + '<div class="ll il-new ' + h.slice(at + 15);
      }
    } catch (e) {}
    return h;
  };

  // ---- steel: a flash of light across a duel or battle the first time it opens
  const struck = new WeakSet();
  const fight = (k, key) => {
    const f = UI[k];
    if (typeof f === 'function') UI[k] = function (o) {
      const h = f.apply(this, arguments);
      try {
        const id = key(o, arguments); if (!id || typeof id !== 'object' || struck.has(id)) return h;
        struck.add(id); if (reduced()) return h;
        const m = /^(\s*<div class="panel mbox)([^"]*)(">)/.exec(h); if (!m) return h;
        return m[1] + m[2] + ' il-fight' + m[3] + '<div class="il-steel" aria-hidden="true"></div>' + h.slice(m[0].length);
      } catch (e) { return h; }
    };
  };
  fight('duelModal', o => o);
  fight('battleModal', o => o);

  // ---- sound: a tiny synthesizer, made on the first sound after the player turns it on
  let ctx = null;
  const ac = () => {
    if (!UI.set.sound) return null;
    try { if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; ctx = new C(); } if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch (e) { return null; }
  };
  // a burst of filtered noise (quill, paper, wax)
  const noise = (c, dur, freq, q, gain, t0 = 0) => {
    const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let s = 22222; for (let i = 0; i < n; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647 * 2 - 1) * (1 - i / n); }   // a fixed sequence: the same sound each time
    const src = c.createBufferSource(); src.buffer = b;
    const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = q;
    const g = c.createGain(); g.gain.value = gain;
    src.connect(fl); fl.connect(g); g.connect(c.destination); src.start(c.currentTime + t0);
  };
  // a struck partial (bell, steel)
  const tone = (c, f, dur, gain, t0 = 0, type = 'sine') => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  };
  IL.SOUNDS = {
    quill: c => { noise(c, 0.09, 3200, 2.5, 0.25); noise(c, 0.07, 2600, 3, 0.18, 0.11); },
    page: c => { noise(c, 0.35, 1200, 0.7, 0.18); },
    seal: c => { tone(c, 90, 0.18, 0.5, 0, 'triangle'); noise(c, 0.12, 600, 1, 0.3); },
    bell: c => { [[220, 1], [440, 0.5], [528, 0.35], [660, 0.3], [880, 0.18]].forEach(([f, g]) => tone(c, f, 2.6, 0.12 * g)); },
    steel: c => { [[1180, 1], [1730, 0.7], [2610, 0.5], [3120, 0.3]].forEach(([f, g]) => tone(c, f, 0.9, 0.08 * g)); noise(c, 0.05, 5000, 1, 0.25); },
  };
  IL.play = function (name) { const c = ac(); const fn = IL.SOUNDS[name]; if (c && fn) { try { fn(c); } catch (e) {} } };

  // hook the sounds to what the player does (UI actions only)
  const wrapAct = (k, snd) => { const f = UI.A && UI.A[k]; if (typeof f === 'function') UI.A[k] = function () { IL.play(snd); return f.apply(this, arguments); }; };
  wrapAct('evChoose', 'quill'); wrapAct('evClose', 'page'); wrapAct('save', 'seal');
  // the new year's bell and a battle's steel: noticed when the screen is drawn, so the engine is not touched
  let lastYear = null, lastHead = null;
  const render = UI.render;
  UI.render = function () {
    const r = render.apply(this, arguments);
    try { IL.applyVellum(); } catch (e) {}
    try {
      if (A.S && UI.screen === 'game') {
        if (lastYear != null && A.S.year > lastYear) IL.play('bell');
        lastYear = A.S.year;
        const q = A.S.queue && A.S.queue[0];
        if (q && q !== lastHead && (q.type === 'battle' || q.type === 'duel')) IL.play('steel');
        lastHead = q || null;
      }
    } catch (e) {}
    return r;
  };

  // ---- the settings: three toggles in the menu (patch IL-MENU)
  IL.menu = () => `<label class="row"><input type="checkbox" data-c="setWoodcuts" ${UI.set.woodcuts ? 'checked' : ''}> Woodcuts on events</label>` +
    `<label class="row"><input type="checkbox" data-c="setVellum" ${UI.set.vellum ? 'checked' : ''}> The Chronicle on vellum</label>` +
    `<label class="row"><input type="checkbox" data-c="setSound" ${UI.set.sound ? 'checked' : ''}> Sound (quill, seal, bell, steel)</label>`;
  Object.assign(UI.C, {
    setWoodcuts(el) { UI.set.woodcuts = el.checked; UI.saveSettings(); UI.renderModal ? UI.renderModal() : UI.render(); },
    setVellum(el) { UI.set.vellum = el.checked; UI.saveSettings(); IL.applyVellum(); UI.render(); },
    setSound(el) { UI.set.sound = el.checked; UI.saveSettings(); if (el.checked) IL.play('seal'); },
  });
  const apply = UI.applySettings;
  UI.applySettings = function () { const r = apply.apply(this, arguments); try { IL.applyVellum(); } catch (e) {} return r; };
  IL.install(); IL.applyVellum();
})();
