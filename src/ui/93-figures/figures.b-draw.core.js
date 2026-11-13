// 93-figures · every person drawn by the figure library (C8b; the owner approved gate 2 of the 2D character art, D-035).
//
// PORTRAIT.svg(person, size, opts) (edited in src/core/release/core/20-portraits.js) hands every portrait in the game
// to UI.FIG.svg. The library itself is the v2 engine module src/ui/engine/figure/ (on the page as A.V2.figure): pure
// functions from a LOOK to one SVG. This file is the game's side of it:
//
//   UI.FIG.sheet(p)        what the picture needs to know about a person, read once from the state (read only)
//   UI.FIG.look(p)         the sheet as a look (A.V2.figure.lookOf): face, body, hair, scars, dress, gear, stance
//   UI.FIG.svg(p, n, o)    the picture: a square for lists and chips, two by three (n wide) for the profile, a person's
//                          sheet and the obituary; o.bust forces the square, o.figure the whole standing figure
//
//   UI.FIG.inline(p, n, o) the same picture as one whole SVG, made at once (the share card, sheets, tests)
//
// Drawing is pure: it reads the person and writes nothing (no A.rand, no A.S). Everything that looks random is hashed
// from the person's id inside the library. Pictures are kept by look: the same look at the same size is drawn once,
// off the press, and kept as one image (see "the pictures" below).
(function () {
  if (typeof PORTRAIT === 'undefined' || typeof PORTRAIT.svg !== 'function') return;
  const FG = UI.FIG = UI.FIG || {};
  const LIB = () => (A.V2 && A.V2.figure) || null;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const HEX = /^#[0-9a-fA-F]{6}$/, hexOk = c => (typeof c === 'string' && HEX.test(c) ? c.toLowerCase() : null);
  const hash = s => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mix = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), m = s => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return '#' + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1); };

  // a people's years as a human's: its milestones (grown, prime's end, old, the oldest) laid on a human life
  FG.humanYears = function (age, R2) {
    const ms = [0, R2.grown || 20, R2.primeEnd || 34, R2.old || 50, Math.max((R2.old || 50) + 1, R2.maxLife || 100)], hm = [0, 20, 34, 50, 100];
    for (let i = 1; i < ms.length; i++) if (age <= ms[i]) return lerp(hm[i - 1], hm[i], (age - ms[i - 1]) / Math.max(1, ms[i] - ms[i - 1]));
    return 100;
  };
  // the age a picture is drawn at: every year for the young, every third year in the prime, every second after, so a
  // portrait is not drawn anew each new year for nothing the eye could see
  const drawnAge = h => (h < 20 ? Math.round(h * 2) / 2 : h < 46 ? 20 + 3 * Math.floor((h - 20) / 3) : 46 + 2 * Math.floor((h - 46) / 2));

  // ---- the face at rest, from the state at draw time (never stored): -1 grim .. 0 .. +1 glad
  const EV_TONE = [
    [/love|court|kiss|wed|marr|lover|flirt|romance|betroth|suitor|sweetheart|bride|dance|victory|triumph|promot|prize|harvest|blessing|gift|feast|festival|born|birth/, .9],
    [/death|dies|died|funeral|grave|mourn|plague|sick|fever|wound|loss|lost|bury|debt|famine|drought|flood|ruin|exile|prison|chains/, -.8],
    [/quarrel|insult|duel|rival|feud|betray|accus|threat|battle|raid|siege|ambush|bandit/, -.6],
  ];
  const evSubject = q => (q && q.type === 'event' ? (q.ctx && q.ctx.pid != null ? q.ctx.pid : A.S && A.S.pc) : q && q.ctx ? q.ctx.pid : null);
  const evKey = q => { let t = ''; try { const e = A.EV && A.EV[q.ev]; t = (q.view && q.view.title) || (e && typeof e.title === 'string' ? e.title : '') || ''; } catch (x) {} return String(q.ev || q.id || '') + ' ' + String(t); };
  FG.mood = function (p) {
    try {
      if (!p.alive) return 0;
      const q = FG.ev || (A.S && Array.isArray(A.S.queue) ? A.S.queue[0] : null);
      if (q && evSubject(q) === p.id) { const key = evKey(q).toLowerCase(); for (const [rx, v] of EV_TONE) if (rx.test(key)) return v; }
      const pcId = A.S && A.S.pc, tr = new Set(p.traits || []);
      let m = typeof p.happy === 'number' ? (p.happy - 55) / 45 : 0;
      const r = pcId && pcId !== p.id && p.rel ? p.rel[pcId] : null;
      if (r && typeof r.op === 'number') m = m * .4 + clamp(r.op / 60, -1, 1) * .6;
      if (pcId === p.id && A.MOODS && A.MOODS.mood) { const md = A.MOODS.mood(p); if (md && md.k === 'rest') m -= .5; else if (md && md.k === 'content') m += .3; else if (md && (md.k === 'company' || md.k === 'comfort')) m -= .3; }
      if (typeof p.health === 'number' && p.health < 30) m -= .6;
      if (tr.has('stern') || tr.has('stoic') || tr.has('cruel') || tr.has('proud') || tr.has('wrathful')) m -= .25;
      if (tr.has('kind') || tr.has('gregarious') || tr.has('witty')) m += .25;
      return Math.round(clamp(m, -1, 1) * 4) / 4;        // five steps each way are all a face shows
    } catch (e) { return 0; }
  };

  // ---- one carried thing as the library wants it: { id, kind, make, rarity }. The game stores an id today; the items
  // of E2 may store { id, make, rarity } and are read the same way
  const item = v => {
    if (!v) return null;
    const o = typeof v === 'object' ? v : { id: v }, id = typeof o.id === 'string' ? o.id : null; if (!id) return null;
    const G = GD.GEAR && GD.GEAR[id];
    return { id, kind: G && typeof G.kind === 'string' ? G.kind : null, make: o.make ?? (G && G.make), rarity: o.rarity ?? (G && G.rarity) };
  };
  // ---- what the picture needs to know about a person (read only)
  FG.sheet = function (p) {
    const race = GD.RACES[p.race] ? p.race : 'human', R2 = GD.RACES[race], raw = Math.max(0, +A.age(p) || 0);
    const fl = p.flags || {}, nb = p.noble || null, job = p.job || null, mil = p.mil || null;
    const estate = p.ruler ? 'royal' : p.prison ? 'prisoner' : job && job.c === 'clergy' ? 'priest' : p.status === 'royal' ? 'royal'
      : p.status === 'noble' || (nb && nb.rung >= 4) ? 'noble' : p.status === 'gentry' || (nb && nb.rung >= 2) ? 'gentry'
      : p.status === 'merchant' || (job && job.c === 'merchant') ? 'merchant' : p.status === 'slave' ? 'slave' : p.status === 'serf' || fl.unfree ? 'serf' : p.status === 'artisan' ? 'artisan' : 'peasant';
    const g0 = p.gear || {}, gear = { weapon: item(g0.weapon), armor: item(g0.armor), shield: item(g0.shield), helm: item(g0.helm), cloak: item(g0.cloak) };
    const officer = !!(mil && mil.rank >= 6);
    // a soldier with no arms of their own stands in what their company is issued
    if (mil && !gear.armor) gear.armor = item(officer ? 'mailplate' : ['HI', 'HC', 'MC'].includes(mil.troop) ? 'mail' : 'padded');
    if (mil && gear.armor && gear.armor.id === 'none') gear.armor = item(officer ? 'mailplate' : ['HI', 'HC', 'MC'].includes(mil.troop) ? 'mail' : 'padded');
    if (mil && (!gear.weapon || gear.weapon.id === 'fists')) gear.weapon = item(officer || ['HI', 'HC', 'MC'].includes(mil.troop) ? 'sword' : 'spear');
    let arms = null, realm = null;
    try { arms = PORTRAIT.arms(p); } catch (e) {}
    try { realm = A.realm(p.ruler || (mil && mil.realm) || (nb && nb.realm) || p.realm); } catch (e) {}
    const ch = arms && arms.h && typeof arms.ch === 'string' && Object.prototype.hasOwnProperty.call(PORTRAIT.charges, arms.ch) ? PORTRAIT.charges[arms.ch] : '';
    const rc = hexOk(realm && (UI.realmHex ? UI.realmHex(realm) : realm.color)) || '#8a7a60';
    let st = 0; try { st = clamp(((p.st && +p.st.str) || 45) / 45 - 1, -1, 1); } catch (e) {}
    return {
      id: p.id, name: A.fullName ? A.fullName(p, false) : p.given || '', sex: p.sex === 'F' ? 'F' : 'M', race, age: drawnAge(FG.humanYears(raw, R2)), alive: p.alive !== false,
      app: p.app || {}, estate, ruler: !!p.ruler, rung: (nb && +nb.rung) || (job && +job.rank) || 0, officer, gear,
      wounds: (p.wounds || []).filter(w => w && typeof w.k === 'string').map(w => ({ k: w.k, fresh: !!w.until })),
      traits: p.traits || [], quirks: p.quirks || [], married: !!p.spouse, pc: !!(A.S && A.S.pc === p.id), strength: st,
      colors: { realm: rc, field: hexOk(arms && arms.f) || rc, charge: hexOk(arms && arms.c) || '#d8c48a', device: ch && ch[0] === 'M' ? ch : null },
      cult: FG.cultOf ? FG.cultOf(p.cult) : null, mood: FG.mood(p),
    };
  };
  FG.look = function (p) { const L = LIB(); return L ? L.lookOf(FG.sheet(p)) : null; };

  // ---- the ground behind a sitter and the frame's line: the realm's colour, quiet; gold for a ruler, the accent for the
  // high-born; the dead on a grey wash
  FG.ground = function (sh) {
    if (!sh.alive) return { a: '#8e8f9c', b: '#3b3c48', frame: '#8a8c9c', w: 1.2 };
    const rc = sh.colors.realm, a = mix(mix(rc, '#aab2cf', .55), '#ffffff', .08), b = mix(rc, '#161a2a', .74);
    return { a, b, frame: sh.ruler ? '#e3b54a' : sh.estate === 'noble' || sh.estate === 'royal' ? '#c9a15a' : '#6e7bab', w: sh.ruler ? 2 : sh.estate === 'noble' || sh.estate === 'royal' ? 1.6 : 1.2 };
  };

  // ---- the pictures -------------------------------------------------------------------------------------------------
  // A figure is some hundreds of shapes. Sixty of them written into the page as SVG cost the page a third of a second
  // at every redraw, so the page never holds one: PORTRAIT.svg returns a small frame (one <svg> with one <image>), and
  // the picture behind it is made once, off the press:
  //   the look -> compose (about 5 ms) -> the SVG as an image -> a canvas at the screen's density -> one PNG, kept.
  // A queue makes one picture per turn of the event loop, newest request first, so a press never waits for a
  // portrait. Until its picture is ready a frame shows a stand-in in the sitter's own colours (or the picture the same
  // person had a moment ago), and the frames on the page take the picture the moment it is done. Nothing drawn is read
  // back into the world; no game state is written; no dice are used.
  const BY_PERSON = new Map(), ENT = new Map(), LAST = new Map(), MAX = 600;
  FG.stats = { made: 0, hits: 0, composeMs: 0, lastComposeMs: 0, bakeMs: 0, failed: 0 };
  FG.errors = 0; FG.lastError = '';
  const fail = e => { FG.errors++; FG.lastError = String((e && e.stack) || e).slice(0, 400); try { console.error('figures: a portrait could not be drawn: ' + FG.lastError); } catch (x) {} };
  const revokeLater = urls => { if (urls.length) setTimeout(() => { for (const u of urls) { try { URL.revokeObjectURL(u); } catch (e) {} } }, 30000); };
  FG.clearCache = () => { const urls = []; for (const e of ENT.values()) if (e.url && e.url.startsWith('blob:')) urls.push(e.url); BY_PERSON.clear(); ENT.clear(); LAST.clear(); QUEUE.length = 0; revokeLater(urls); };
  FG.personKey = function (p, size, kind) {
    const mil = p.mil, nb = p.noble, job = p.job;
    return [p.id, p.given, p.sur, p.epithet || '', Math.floor(+A.age(p) || 0), p.alive ? 1 : 0, p.race, p.sex, p.cult, p.realm, p.status, p.ruler || '', p.house || '', p.prison ? 1 : 0, p.spouse ? 1 : 0,
      JSON.stringify(p.app || {}), JSON.stringify(p.gear || {}), (p.wounds || []).map(w => w && w.k + (w.until ? '!' : '')).join(','), (p.quirks || []).join(','),
      job ? job.c + ':' + job.k + ':' + (job.rank || 0) : '', mil ? mil.rank + ':' + mil.troop + ':' + mil.realm : '', nb ? nb.rung + ':' + nb.realm : '', p.flags && p.flags.unfree ? 1 : 0,
      FG.mood(p), Math.round(((p.st && +p.st.str) || 45) / 9), A.S && A.S.pc === p.id ? 1 : 0, size, kind].join('|');
  };
  const SIZES = n => clamp(Math.round(+n || 200), 12, 720);
  const kindOf = (size, opts) => (opts.figure ? 'figure' : size < 120 || opts.bust ? (size <= 40 ? 'chip' : size < 120 ? 'list' : 'square') : 'tall');
  // the options compose() is given for one look at one size
  FG.composeOpts = function (look, sh, size, kind, G, id) {
    const h = kind === 'tall' ? Math.round(size * 1.5) : kind === 'figure' ? Math.round(size * 2) : size, tier = kind === 'chip' ? 0 : kind === 'list' ? 1 : 2;
    const o = { width: size, height: h, tier, id, label: '', tint: sh.alive ? null : 'dead', ground: { a: G.a, b: G.b }, frame: { c: G.frame, w: kind === 'chip' ? 1 : G.w } };
    if (kind === 'figure') { const H = look.height * 10 * 1.14, w = H / 2; Object.assign(o, { crop: 'figure', w, top: H * .96, below: H * .04, px: size / w }); } else o.crop = kind;
    return o;
  };
  // the whole drawing as one SVG, made at once (the share card, the sheets, the tests): the page itself never mounts it
  FG.inline = function (p, size = 200, opts = {}) {
    const L = LIB(); if (!L || !p || !p.app) return '';
    try {
      size = SIZES(size); const kind = kindOf(size, opts), sh = FG.sheet(p), look = L.lookOf(sh), G = FG.ground(sh);
      const o = FG.composeOpts(look, sh, size, kind, G, 'i' + hash(L.lookKey(look) + size + kind).toString(36) + '_');
      if (opts.plain) o.fx = false;
      o.label = sh.name || 'A portrait'; o.cls = 'portrait fig ' + (kind === 'tall' || kind === 'figure' ? 'full' : 'bust') + (sh.alive ? '' : ' dead');
      return L.compose(look, o).svg;
    } catch (e) { fail(e); return ''; }
  };
  // a stand-in: the ground, and the sitter as three flat shapes in their own skin, hair and cloth
  const standIn = (look, G, tall) => {
    const L = LIB(); let skin = '#c9a184', hair = '#3a2a22', cloth = '#6b5a4a';
    try {
      skin = L.skinOf(look.skin).b; const hc = L.HAIR[look.hairColor]; hair = look.grey > .55 ? '#b9b9c2' : (hc && hc.b) || hair;
      const main = (look.gear || []).slice().reverse().find(g => g.id === 'tabard' || g.id === 'tunic' || g.id === 'breastplate');
      cloth = main ? (main.id === 'breastplate' ? '#a9b1bd' : L.cloth(main.id === 'tabard' ? main.field : main.dye || 'russet').b) : cloth;
    } catch (e) {}
    const y = tall ? 38 : 46, bald = look.hair === 'bald';
    return `<rect width="100" height="${tall ? 150 : 100}" fill="${G.b}"/><path d="M${tall ? 14 : 4} ${tall ? 150 : 100}C${tall ? 14 : 4} ${y + 30} 30 ${y + 22} 50 ${y + 22}S${tall ? 86 : 96} ${y + 30} ${tall ? 86 : 96} ${tall ? 150 : 100}Z" fill="${cloth}"/><ellipse cx="50" cy="${y}" rx="${tall ? 12 : 17}" ry="${tall ? 15 : 21}" fill="${skin}"/>${bald ? '' : `<path d="M${tall ? 37 : 32} ${y - 2}C${tall ? 36 : 30} ${y - (tall ? 22 : 30)} ${tall ? 64 : 70} ${y - (tall ? 22 : 30)} ${tall ? 63 : 68} ${y - 2}C${tall ? 58 : 60} ${y - (tall ? 12 : 16)} ${tall ? 42 : 40} ${y - (tall ? 12 : 16)} ${tall ? 37 : 32} ${y - 2}Z" fill="${hair}"/>`}`;
  };
  const frameOf = (e, label, cls) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 ${e.tall ? 150 : 100}" width="${e.w}" height="${e.h}" class="${cls}" role="img" aria-label="${UI.esc(label || 'A portrait')}" data-fg="${e.id}">${e.url ? '' : e.stand}<image${e.url || e.prev ? ` href="${e.url || e.prev}"` : ''} width="100" height="${e.tall ? 150 : 100}" preserveAspectRatio="none"/></svg>`;

  // ---- the queue: one picture per turn
  const QUEUE = [];
  let busy = false, batch = 0, batchOpen = false, waiters = [];
  const dpr = () => { try { return clamp(Math.ceil((window.devicePixelRatio || 1) - .01), 1, 2); } catch (e) { return 1; } };
  const enqueue = e => {
    if (!batchOpen) { batchOpen = true; batch++; Promise.resolve().then(() => { batchOpen = false; }); }
    e.batch = batch; e.queued = true; QUEUE.push(e);
    if (!busy) { busy = true; setTimeout(step, 0); }
  };
  const done = () => { busy = false; const w = waiters; waiters = []; for (const f of w) f(); };
  // the frames on the page take a finished picture
  const show = e => {
    try {
      for (const el of document.querySelectorAll('svg[data-fg="' + e.id + '"]')) {
        const im = el.querySelector('image'); if (im) im.setAttribute('href', e.url);
        for (const ch of [...el.children]) if (ch !== im) ch.remove();
      }
    } catch (x) {}
  };
  function step() {
    // the newest batch first (what the page shows now), in the order it was asked for
    let at = -1, top = -1;
    for (let i = 0; i < QUEUE.length; i++) if (QUEUE[i].batch > top) { top = QUEUE[i].batch; at = i; }
    if (at < 0) return done();
    const e = QUEUE.splice(at, 1)[0], L = LIB();
    e.queued = false;
    if (!L || e.url || !ENT.has(e.key)) return setTimeout(step, 0);
    let svg = '';
    try { const t0 = performance.now(); svg = L.compose(e.look, e.opts).svg; FG.stats.lastComposeMs = performance.now() - t0; FG.stats.composeMs += FG.stats.lastComposeMs; FG.stats.made++; } catch (x) { fail(x); e.failed = true; return setTimeout(step, 0); }
    e.look = e.opts = null;
    const t1 = performance.now(), next = () => { FG.stats.bakeMs += performance.now() - t1; setTimeout(step, 0); };
    const asSvg = () => { try { e.url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); LAST.set(e.who, e.url); show(e); } catch (x) { fail(x); } next(); };
    try {
      const src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), img = new Image(), k = dpr();
      const bad = () => { FG.stats.failed++; try { URL.revokeObjectURL(src); } catch (x) {} asSvg(); };
      img.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = e.w * k; c.height = e.h * k;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(b => {
            try { URL.revokeObjectURL(src); } catch (x) {}
            if (!b) return asSvg();
            e.url = URL.createObjectURL(b); LAST.set(e.who, e.url); show(e); next();
          }, 'image/png');
        } catch (x) { bad(); }
      };
      img.onerror = bad;
      img.src = src;
    } catch (x) { asSvg(); }
  }
  // resolves when every picture asked for has been made (the tests and the screenshots wait on it)
  FG.idle = () => new Promise(r => { if (!busy && !QUEUE.length) r(); else waiters.push(r); });
  FG.pending = () => QUEUE.length + (busy ? 1 : 0);

  // the picture of one look at one size: found among those kept, or begun
  function entryFor(look, sh, G, size, kind, who) {
    const L = LIB(), tall = kind === 'tall' || kind === 'figure', key = L.lookKey(look) + '|' + size + kind + G.a + G.b + G.frame + dpr();
    let e = ENT.get(key);
    if (e) return e;
    const id = 'f' + hash(key).toString(36);
    e = { key, id, w: size, h: kind === 'tall' ? Math.round(size * 1.5) : kind === 'figure' ? size * 2 : size, tall, url: '', prev: '', stand: standIn(look, G, tall), look, opts: FG.composeOpts(look, sh, size, kind, G, id + '_'), who, queued: false, batch: 0 };
    if (kind === 'figure') e.tall = false, e.stand = `<rect width="100" height="100" fill="${G.b}"/>`;
    e.prev = LAST.get(who) || '';
    if (ENT.size >= MAX) {                         // the oldest pictures go; their PNGs are freed a little later
      const urls = []; let n = 0;
      for (const [k, v] of ENT) { if (n++ >= MAX / 3) break; if (!v.queued) { ENT.delete(k); if (v.url) urls.push(v.url); } }
      BY_PERSON.clear(); for (const [k, v] of LAST) if (urls.includes(v)) LAST.delete(k);
      revokeLater(urls);
    }
    ENT.set(key, e);
    return e;
  }
  // a look that is no one in the world (the creation screen's hair thumbnails and ages): the same frames and queue
  FG.lookSvg = function (look, size, o = {}) {
    const L = LIB(); if (!L || !look) return '';
    try {
      size = SIZES(size); const kind = o.kind || (size <= 40 ? 'chip' : size < 120 ? 'list' : 'square');
      const sh = { alive: true, name: o.label || '', colors: { realm: '#56618a' }, ruler: false, estate: 'peasant' }, G = FG.ground(sh);
      const e = entryFor(look, sh, G, size, kind, 'look|' + (o.who || look.id) + '|' + size + kind);
      if (!e.url && !e.queued && !e.failed && e.look) enqueue(e);
      return frameOf(e, o.label || '', 'portrait fig bust');
    } catch (x) { fail(x); return ''; }
  };
  FG.svg = function (p, size = 200, opts = {}) {
    const L = LIB(); if (!L || !p || !p.app) return '';
    opts = opts || {};
    if (opts.inline || typeof document === 'undefined' || typeof Blob === 'undefined') return FG.inline(p, size, opts);
    size = SIZES(size);
    const kind = kindOf(size, opts);
    try {
      const pk = FG.personKey(p, size, kind);
      let hit = BY_PERSON.get(pk);
      if (hit === undefined) {
        const sh = FG.sheet(p), look = L.lookOf(sh), G = FG.ground(sh);
        const e = entryFor(look, sh, G, size, kind, p.id + '|' + size + kind);
        hit = { e, label: sh.name, cls: 'portrait fig ' + (kind === 'tall' || kind === 'figure' ? 'full' : 'bust') + (sh.alive ? '' : ' dead') };
        if (BY_PERSON.size > MAX * 3) BY_PERSON.clear();
        BY_PERSON.set(pk, hit);
      } else FG.stats.hits++;
      const e = hit.e;
      if (!e.url && !e.queued && !e.failed && e.look) enqueue(e);
      if (kind === 'figure') return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200" width="${e.w}" height="${e.h}" class="${hit.cls}" role="img" aria-label="${UI.esc(hit.label || 'A portrait')}" data-fg="${e.id}"><image${e.url || e.prev ? ` href="${e.url || e.prev}"` : ''} width="100" height="200" preserveAspectRatio="none"/></svg>`;
      return frameOf(e, hit.label, hit.cls);
    } catch (x) { fail(x); return ''; }
  };

  // the event card says whose scene it is, so that face can wear the scene's tone
  if (typeof UI.eventModal === 'function') {
    const em = UI.eventModal;
    UI.eventModal = function (q) { const prev = FG.ev; FG.ev = q || null; try { return em.apply(this, arguments); } finally { FG.ev = prev; } };
  }
  // the profile (the only caller of UI.portrait): a bust at 88 px beside the name in the 1366 layout, the two-by-three
  // picture on the wide rail (the layout 91-visual-style and 90-collapsible-sections were built round)
  if (typeof UI.portrait === 'function') {
    const up = UI.portrait;
    FG.wide = () => { try { return window.innerWidth >= 1600; } catch (e) { return true; } };
    UI.portrait = function (p, size) {
      if (p && p.app && size >= 120 && !FG.wide()) return PORTRAIT.svg(p, 88, { bust: true });
      return up.apply(this, arguments);
    };
  }
  FG.CSS = 'svg.portrait.fig{border-radius:4px}';
  const put = () => { if (typeof document === 'undefined' || document.getElementById('fg-style')) return; const s = document.createElement('style'); s.id = 'fg-style'; s.textContent = FG.CSS + (FG.MAKER_CSS || ''); document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
  FG.putStyle = put;
})();
