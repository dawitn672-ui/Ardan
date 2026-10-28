// 9994-share: keep a moment as a picture (design review cycle 1, #4, after BitLife's shared lives and Wordle's grid).
// "Keep this" on a scene's result, "Keep this life" on the death screen and "Keep this page" on the Book each draw a
// 1080 x 1350 card on a canvas: 94's woodblock sky, 93's bust, the title, the line, the epitaph, your arms (9992) and
// "Ardan · seed 48213 · Jade City of Marast · 1105 AR". The card opens in an overlay with three ways out:
//   - Save the picture: a PNG through the release's own UI.download (a Blob URL and <a download>, as the save export
//     does; the page's CSP allows img-src blob: and data:, and the canvas is never tainted: every picture on it is an
//     SVG data URL we drew);
//   - Copy the seed: the world seed, so a friend can start in the same world (the creation screen's World seed field);
//   - Share: the Web Share API with the PNG, where the browser has one.
// Pure: it reads the state and never writes it, draws no random numbers; the card's memory (the last PNG) is UI state.
// Registry: UI.SHARE.KINDS[k] = () => data | null lets a feature add a kind of card (data: see UI.SHARE.draw).
(function () {
  const SH = UI.SHARE = UI.SHARE || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  SH.W = 1080; SH.H = 1350;
  SH.FONT = { name: '"Cinzel", Georgia, serif', prose: '"Literata", Georgia, serif', ui: '"Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif' };
  SH.INK = '#1b1730'; SH.PAPER = '#f1e7d0'; SH.GOLD = '#e2ad45';

  // an SVG string as an image at a given size (xmlns added; width and height set so it has an intrinsic size)
  SH.svgImage = function (svg, w, h) {
    return new Promise((res, rej) => {
      if (!svg || typeof svg !== 'string' || svg.indexOf('<svg') < 0) return res(null);
      let s = svg.slice(svg.indexOf('<svg'));
      s = s.replace(/^<svg([^>]*)>/, (all, attrs) => {
        let a = attrs.replace(/\s(width|height)="[^"]*"/g, '');
        if (!/xmlns=/.test(a)) a = ' xmlns="http://www.w3.org/2000/svg"' + a;
        if (!/xmlns:xlink=/.test(a) && /xlink:/.test(s)) a = ' xmlns:xlink="http://www.w3.org/1999/xlink"' + a;
        return `<svg${a} width="${w}" height="${h}">`;
      });
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  };
  const wrap = (ctx, text, maxW) => {
    const words = String(text || '').split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    return lines;
  };
  const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const c = s.slice(0, n); return c.slice(0, Math.max(c.lastIndexOf(' '), n - 20)).replace(/[,;:]$/, '') + '…'; };

  // ---- what goes on a card --------------------------------------------------------------------------------------------
  SH.footer = function () {
    const S = A.S, pc = A.pc();
    const where = pc ? (A.realmName ? A.realmName(pc.realm) : pc.realm) : '';
    return `Ardan · seed ${S && S.seed != null ? S.seed : '?'}${where ? ' · ' + where : ''} · ${S ? S.year : ''} AR`;
  };
  SH.bust = function (p) {
    try { if (UI.ANIME && UI.ANIME.svg && UI.set.anime !== false) return UI.ANIME.svg(p, 200, { bust: true }); } catch (e) {}
    try { return PORTRAIT.svg(p, 200, { bust: true }); } catch (e) { return ''; }
  };
  SH.arms = function (p) {
    try { if (A.ID && A.ID.coatSvg) { const s = A.ID.coatSvg(p, 120); if (s) return s; } } catch (e) {}
    try { const h = p && p.house && A.S.houses[p.house]; return h ? PORTRAIT.coat(h, 120) : ''; } catch (e) { return ''; }
  };
  SH.skyAt = function (shape, key, hour) {
    const SK = UI.SKIES, pc = A.pc();
    if (!SK || !SK.svg) return '';
    const pr = pc && A.S.prov ? A.S.prov[pc.home] : null;
    let m = 0; try { m = A.monthOf(A.today()).m; } catch (e) {}
    const o = { terr: SK.terrOf ? SK.terrOf(pr) : 'hills', coast: !!(pr && pr.coast), place: '' };
    if (hour) o.hour = hour;
    try { const c = SK.climOf && SK.climOf(pr); if (c) o.clim = c; } catch (e) {}
    try { return SK.svg(shape, key, m, o); } catch (e) { return ''; }
  };
  SH.place = function () { const pc = A.pc(); try { return pc ? `${A.provName(pc.home)}, ${A.monthOf ? (A.dateStr ? A.dateStr(A.today(), A.S.year, true) : A.S.year) : A.S.year}` : ''; } catch (e) { return ''; } };
  SH.KINDS = {
    // the scene on screen, once it has a result
    scene() {
      const q = A.S && A.S.queue && A.S.queue[0], pc = A.pc();
      if (!q || q.type !== 'event' || !q.result || !pc) return null;
      const v = q.view || A.eventView(q) || {};
      let sky = '';
      try { const SK = UI.SKIES, o = SK.optsFor(q, v); sky = SK.svg(o.shape, o.key, o.month, o); } catch (e) { sky = SH.skyAt('none', q.ev + '|' + A.S.year); }
      const ch = UI.SCENE && UI.SCENE.chosen ? UI.SCENE.chosen.get(q) : null;
      const who = q.ctx && q.ctx.pid ? A.P(q.ctx.pid) : null;
      const place = SH.place();
      return { kind: 'scene', place, title: v.title || 'A moment', line: clip(q.result.text, 360), sub: ch && ch.label ? 'You chose: ' + ch.label : '', tag: `${pc.given}, ${A.age(pc)}`,
        epitaph: pc.epithet ? `${A.fullName ? A.fullName(pc, false) : pc.given}, called ${pc.epithet}` : (A.fullName ? A.fullName(pc, false) : pc.given), sky, bust: SH.bust(who && who.app ? who : pc), arms: SH.arms(pc), file: `ardan-${q.ev}-${A.S.year}` };
    },
    // the life, on the death screen
    life() {
      const pc = A.pc();
      if (!pc || pc.alive) return null;
      let end = null; try { end = pc.ending || (A.endingOf ? A.endingOf(pc) : null); } catch (e) {}
      const E = end && A.ENDINGS ? A.ENDINGS.find(x => x.id === end.id) : null;
      let epi = []; try { epi = A.epilogue ? A.epilogue(pc) : []; } catch (e) {}
      const deeds = (pc.deeds || []).slice(-2).map(d => d.t).join('. ');
      return { kind: 'life', place: (() => { try { return A.provName(pc.home); } catch (e) { return ''; } })(), title: A.fullName ? A.fullName(pc, false) : pc.given, sub: `${pc.born} – ${pc.died || A.S.year} AR${E ? ' · ' + E.name : ''}`,
        line: clip(E ? E.t : `Died aged ${A.age(pc)}, of ${pc.cause || 'unknown causes'}.`, 260), epitaph: clip(epi[0] || deeds || '', 200), tag: `Died aged ${A.age(pc)}`,
        sky: SH.skyAt('death', 'death|' + pc.id, 'dusk'), bust: SH.bust(pc), arms: SH.arms(pc), file: `ardan-life-of-${String(pc.given).toLowerCase().replace(/[^a-z0-9]+/g, '-')}` };
    },
    // a page of the Book: the chapter in progress and the last lines the chronicler wrote
    book() {
      const pc = A.pc();
      if (!pc || !A.chronicleBook) return null;
      const book = A.chronicleBook(), life = book.find(l => l.who === pc.id) || book[book.length - 1];
      if (!life || !life.chapters.length) return null;
      const ch = life.chapters[life.chapters.length - 1];
      const cur = pc.chap && pc.chap.cur && A.CH ? A.CH.heading(pc.chap.cur) : ch.title;
      return { kind: 'book', place: SH.place(), title: `The Chronicle of ${pc.given}`, sub: cur, line: clip(ch.lines.slice(-3).join(' '), 380), epitaph: ch.span, tag: `${A.age(pc)} years`,
        sky: SH.skyAt('letter', 'book|' + pc.id + '|' + A.S.year), bust: SH.bust(pc), arms: SH.arms(pc), file: `ardan-chronicle-${String(pc.given).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${A.S.year}` };
    },
  };

  // ---- the drawing --------------------------------------------------------------------------------------------------
  SH.draw = async function (d, canvas) {
    const W = SH.W, H = SH.H;
    const cv = canvas || document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    try { if (document.fonts && document.fonts.load) await Promise.all([document.fonts.load(`600 64px ${SH.FONT.name}`), document.fonts.load(`32px ${SH.FONT.prose}`), document.fonts.load(`italic 30px ${SH.FONT.prose}`), document.fonts.load(`24px ${SH.FONT.ui}`)]); } catch (e) {}
    const [sky, bust, arms] = await Promise.all([SH.svgImage(d.sky, 1728, 540), SH.svgImage(d.bust, 400, 400), SH.svgImage(d.arms, 150, 172)]);
    // paper, then the print across the top (cropped from the middle of its 16:5)
    g.fillStyle = SH.PAPER; g.fillRect(0, 0, W, H);
    const top = 600;
    if (sky) g.drawImage(sky, (1728 - W) / 2, 0, W, top * (1728 / 1728), 0, 0, W, top);
    else { const gr = g.createLinearGradient(0, 0, 0, top); gr.addColorStop(0, '#2f5aa8'); gr.addColorStop(1, '#e9b54e'); g.fillStyle = gr; g.fillRect(0, 0, W, top); }
    g.fillStyle = 'rgba(27,23,48,.18)'; g.fillRect(0, top - 6, W, 6);
    // the bust in a round frame overlapping the print's lower edge
    const bx = 84, by = top - 230, br = 200;
    g.save(); g.beginPath(); g.arc(bx + br, by + br, br, 0, Math.PI * 2); g.closePath();
    g.fillStyle = '#efe6d2'; g.fill(); g.clip();
    if (bust) g.drawImage(bust, bx, by, br * 2, br * 2);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = SH.INK; g.beginPath(); g.arc(bx + br, by + br, br, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4; g.strokeStyle = SH.GOLD; g.beginPath(); g.arc(bx + br, by + br, br - 9, 0, Math.PI * 2); g.stroke();
    // the arms, right
    if (arms) { g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.drawImage(arms, W - 84 - 150, top - 120, 150, 172); g.restore(); }
    // the words
    let y = top + 290;
    const left = 84, maxW = W - 168;
    g.fillStyle = SH.INK; g.textBaseline = 'alphabetic';
    // beside the bust: who, and where
    if (d.tag) { g.font = `600 28px ${SH.FONT.ui}`; g.fillStyle = '#8a5a00'; g.fillText(String(d.tag).toUpperCase(), bx + br * 2 + 36, top + 62); }
    if (d.place) { g.font = `24px ${SH.FONT.ui}`; g.fillStyle = '#4a4560'; g.fillText(String(d.place), bx + br * 2 + 36, top + 98); }
    g.fillStyle = SH.INK;
    g.font = `600 64px ${SH.FONT.name}`;
    for (const l of wrap(g, d.title, maxW).slice(0, 2)) { g.fillText(l, left, y); y += 74; }
    if (d.sub) { g.font = `26px ${SH.FONT.ui}`; g.fillStyle = '#4a4560'; for (const l of wrap(g, d.sub, maxW).slice(0, 2)) { g.fillText(l, left, y); y += 36; } y += 6; }
    g.fillStyle = SH.GOLD; g.fillRect(left, y, 120, 5); y += 52;
    g.fillStyle = SH.INK; g.font = `34px ${SH.FONT.prose}`;
    for (const l of wrap(g, d.line, maxW).slice(0, 8)) { g.fillText(l, left, y); y += 48; }
    if (d.epitaph) { y += 16; g.font = `italic 30px ${SH.FONT.prose}`; g.fillStyle = '#3a3e55'; for (const l of wrap(g, d.epitaph, maxW).slice(0, 3)) { g.fillText(l, left, y); y += 42; } }
    // the footer band
    g.fillStyle = SH.INK; g.fillRect(0, H - 92, W, 92);
    g.fillStyle = SH.GOLD; g.font = `600 30px ${SH.FONT.name}`; g.fillText('ARDAN', left, H - 36);
    g.fillStyle = '#eee8da'; g.font = `24px ${SH.FONT.ui}`;
    const ft = String(SH.footer()).replace(/^Ardan · /, '');
    g.textAlign = 'right'; g.fillText(ft.length > 70 ? ft.slice(0, 69) + '…' : ft, W - left, H - 38); g.textAlign = 'left';
    g.strokeStyle = SH.INK; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
    return cv;
  };
  SH.png = cv => new Promise(res => {
    if (cv.toBlob) cv.toBlob(b => { if (!b) return res(null); b.arrayBuffer().then(ab => res(new Uint8Array(ab))); }, 'image/png');
    else res(null);
  });

  // ---- keeping it ---------------------------------------------------------------------------------------------------
  SH.last = null;   // { kind, bytes, url, name, seed, title } (UI state; never saved)
  SH.make = async function (kind) {
    const f = SH.KINDS[kind];
    const d = f ? f() : null;
    if (!d) return null;
    const cv = await SH.draw(d);
    const bytes = await SH.png(cv);
    if (!bytes) return null;
    if (SH.last && SH.last.url) try { URL.revokeObjectURL(SH.last.url); } catch (e) {}
    const url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    SH.last = { kind, bytes, url, name: d.file.replace(/[^a-z0-9-]+/gi, '-').toLowerCase() + '.png', seed: A.S && A.S.seed != null ? String(A.S.seed) : '', title: d.title, footer: SH.footer() };
    return SH.last;
  };
  SH.keep = async function (kind) {
    UI.ov = { type: 'shCard', kind, wait: true }; UI.renderModal();
    let r = null;
    try { r = await SH.make(kind); } catch (e) { console.error('share card', e); }
    if (!UI.ov || UI.ov.type !== 'shCard') return r;
    UI.ov = { type: 'shCard', kind, fail: !r }; UI.renderModal();
    const b = document.querySelector('#modal [data-a="shSave"]'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {}
    return r;
  };
  SH.overlay = function (ov) {
    const L = SH.last;
    const head = `<div class="panel mbox sh-box" role="document"><button class="ghost closex" data-a="closeOv" aria-label="Close">${UI.icon ? UI.icon('x', 'm') : '×'}</button><h2>Keep this</h2>`;
    if (ov.wait) return head + '<p class="muted">Drawing the card…</p></div>';
    if (ov.fail || !L) return head + '<p class="muted">The card could not be drawn here.</p><div class="choices"><button data-a="closeOv">Close</button></div></div>';
    const share = typeof navigator !== 'undefined' && navigator.canShare && typeof File !== 'undefined';
    return head + `<div class="sh-prev"><img src="${esc(L.url)}" alt="${esc('A card: ' + L.title)}" width="270" height="338"></div>` +
      `<div class="small muted sh-foot">${esc(L.footer)}</div>` +
      `<div class="field"><label for="shSeed">World seed: a friend can start in the same world with it</label><div class="row"><input id="shSeed" readonly value="${esc(L.seed)}" style="flex:1"><button class="small" data-a="shCopy">Copy the seed</button></div></div>` +
      `<div class="choices sh-acts"><button class="primary" data-a="shSave">Save the picture (PNG)</button>${share ? '<button data-a="shShare">Share…</button>' : ''}<button data-a="closeOv">Back</button></div></div>`;
  };
  UI.SYS_OV = UI.SYS_OV || [];
  if (!UI.SYS_OV.includes('shCard')) UI.SYS_OV.push('shCard');
  const ov0 = UI.ovModal;
  UI.ovModal = function (ov) { return ov && ov.type === 'shCard' ? SH.overlay(ov) : ov0.apply(this, arguments); };
  Object.assign(UI.A, {
    shKeep(v) { SH.keep(String(v || 'scene')); },
    shSave() { const L = SH.last; if (!L) return; UI.download(L.bytes, L.name, 'image/png'); UI.toast && UI.toast(`Picture saved (${Math.round(L.bytes.length / 1024)} KB).`); },
    shCopy() {
      const L = SH.last, el = document.getElementById('shSeed');
      if (!L) return;
      const text = L.seed;
      const ok = () => UI.toast && UI.toast('Seed copied.');
      const fallback = () => { if (el) { el.focus(); el.select(); try { document.execCommand && document.execCommand('copy'); } catch (e) {} } ok(); };
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fallback); else fallback(); } catch (e) { fallback(); }
    },
    shShare() {
      const L = SH.last;
      if (!L || !navigator.canShare) return;
      try {
        const file = new File([L.bytes], L.name, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: L.title, text: L.footer }).catch(() => {});
      } catch (e) {}
    },
  });

  // ---- the three buttons --------------------------------------------------------------------------------------------
  // a scene's result: beside Continue (92's .sc-foot, or the release's result box)
  SH.btn = (kind, label) => `<button class="ghost sh-keep" data-a="shKeep" data-v="${kind}">${UI.icon ? UI.icon('image', 's') : ''}${esc(label)}</button>`;
  const qm = UI.queueModal;
  if (typeof qm === 'function') UI.queueModal = function (q) {
    const h = qm.apply(this, arguments);
    try {
      if (typeof h !== 'string' || !q || q.type !== 'event' || !q.result || h.indexOf('sh-keep') >= 0 || SH.OFF) return h;
      const foot = h.indexOf('<div class="sc-foot">');
      if (foot >= 0) return h.slice(0, foot + 21) + SH.btn('scene', 'Keep this') + h.slice(foot + 21);
      const at = h.indexOf('<button data-a="evClose"');
      return at >= 0 ? h.slice(0, at) + SH.btn('scene', 'Keep this') + h.slice(at) : h;
    } catch (e) { return h; }
  };
  // the death screen: with A new life
  const dm = UI.deathModal;
  if (typeof dm === 'function') UI.deathModal = function () {
    const h = dm.apply(this, arguments);
    try {
      if (typeof h !== 'string' || h.indexOf('sh-keep') >= 0 || SH.OFF) return h;
      const at = h.indexOf('<button class="primary" data-a="newLife">');
      return at >= 0 ? h.slice(0, at) + SH.btn('life', 'Keep this life') + h.slice(at) : h;
    } catch (e) { return h; }
  };
  // the Book: beside "Save the chronicle as text"
  const bk = UI.TAB && UI.TAB.book;
  if (typeof bk === 'function') UI.TAB.book = function () {
    const h = bk.apply(this, arguments);
    try {
      if (typeof h !== 'string' || h.indexOf('sh-keep') >= 0 || SH.OFF) return h;
      const k = '<button class="small" data-a="chronicleExport">';
      const at = h.indexOf(k);
      return at >= 0 ? h.slice(0, at) + SH.btn('book', 'Keep this page').replace('class="ghost sh-keep"', 'class="small ghost sh-keep"') + h.slice(at) : h;
    } catch (e) { return h; }
  };
  for (const k of ['shKeep', 'shSave', 'shCopy', 'shShare']) if (Array.isArray(UI.NEEDS_CONTENT) && UI.NEEDS_CONTENT.includes(k)) UI.NEEDS_CONTENT.splice(UI.NEEDS_CONTENT.indexOf(k), 1);

  const CSS = `.sh-box{max-width:420px;text-align:center}
.sh-prev img{display:block;margin:6px auto 8px;width:270px;max-width:100%;height:auto;border-radius:6px;box-shadow:var(--e-2)}
.sh-foot{margin-bottom:8px}
.sh-box .field{text-align:left}
.sh-acts{justify-content:center}
.sh-keep .ic{width:14px;height:14px;vertical-align:-2px;margin-right:6px}
.sc-foot .sh-keep{margin-right:auto}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('sh-style')) return; const s = document.createElement('style'); s.id = 'sh-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
