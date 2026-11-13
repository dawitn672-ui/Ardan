// B5: what one drawn screen holds, shared by tools/bench/clutter.mjs and the tests of 9992-story-drawer.
export const VIEWS = {
  desk: { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  phone: { viewport: { width: 420, height: 900 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
};
export const PERSONAS = {
  peasant: { o: { seed: 7101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 } },
  noble: { o: { seed: 7102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 32 } },
  ruler: { o: { seed: 7103, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 40 }, ruler: true },
};
// the pages: [name, tab, extra js]
export const PAGES = [
  ['life', 'life', ''], ['story', 'story', ''], ['decisions', 'goals', ''],
  ['you', 'you', ''], ['path', 'path', ''], ['holdings', 'holdings', ''], ['arms', 'war', ''],
  ['people', 'people', ''], ['dynasty', 'legacy', ''],
  ['realm', 'realm', ''], ['world', 'world', "UI.worldView='map';"], ['book', 'book', ''],
];
export const START = (o, ruler) => `(() => {
  A.newGame(${JSON.stringify(o)});
  UI.screen = 'game'; UI.set.hints = false; UI.ov = null;
  ${ruler ? 'try { const pc = A.pc(); A.makeRuler(pc, pc.realm, true); } catch (e) {}' : ''}
  for (let y = 0; y < 2; y++) { A.advance(365); let h, g = 0; while ((h = A.S.queue[0]) && g++ < 400) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  A.S.queue = []; UI.ov = null; UI.render();
})()`;

export const PROBE = () => {
  const W = innerWidth, H = innerHeight;
  const vis = el => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const inView = r => r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
  const zoneOf = el => { const z = el.closest('#topbar,#profile,#logwrap,#side,#bnav,#modal,.phone-profile'); return z ? (z.id || 'phone-profile') : 'other'; };
  const zones = {}, add = (z, k, n = 1) => { (zones[z] = zones[z] || { words: 0, controls: 0 })[k] += n; };
  const tw = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
  let words = 0, n;
  while ((n = tw.nextNode())) {
    const t = n.nodeValue.trim(); if (!t) continue; const el = n.parentElement; if (!el || /^(SCRIPT|STYLE)$/.test(el.tagName) || !vis(el)) continue;
    const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); if (!r.width || !inView(r)) continue;
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    if (!top || !(el.contains(top) || top.contains(el))) continue;
    const c = t.split(/\s+/).length; words += c; add(zoneOf(el), 'words', c);
  }
  let controls = 0;
  for (const el of document.querySelectorAll('#app button, #app a[href], #app [data-a], #app input, #app select, #app summary, #app [role=button], #app [role=tab]')) {
    if (el.disabled || !vis(el)) continue; const r = el.getBoundingClientRect(); if (!inView(r)) continue;
    const top = document.elementFromPoint(Math.min(W - 1, Math.max(0, r.left + r.width / 2)), Math.min(H - 1, Math.max(0, r.top + r.height / 2)));
    if (!top || !(el.contains(top) || top.contains(el))) continue;
    controls++; add(zoneOf(el), 'controls');
  }
  const body = document.getElementById('tabbody') || document.getElementById('side') || document.body;
  const real = [...body.querySelectorAll('*')].filter(e => !/^(SCRIPT|STYLE|PATH|G|CIRCLE|RECT|LINE|POLYGON|POLYLINE|DEFS|USE|TEXT|TSPAN)$/i.test(e.tagName) && !e.closest('svg'));
  const dom = real.length, elements = real.filter(e => e.checkVisibility ? e.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true }) : true).length;
  const chips = body.querySelectorAll('.chip, .pill, .tag, .badge, .lk-chip, .cost, .eff, [class*=chip]').length;
  const infos = body.querySelectorAll('[data-note], [data-tt], .info, .ib').length;
  const folds = body.querySelectorAll('.fold').length, foldsClosed = body.querySelectorAll('.fold > .fold-b[hidden]').length;
  // the screens of scroll: the page's own scroller, or the window
  const sc = document.getElementById('tabbody'), scrollers = [];
  const scrollEl = (() => { for (let a = sc; a; a = a.parentElement) { if (a.scrollHeight > a.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(a).overflowY)) return a; } return document.scrollingElement; })();
  const screens = +(scrollEl.scrollHeight / (scrollEl === document.scrollingElement ? H : scrollEl.clientHeight)).toFixed(2);
  const side = document.getElementById('side'), sr = side ? side.getBoundingClientRect() : null;
  const hover = [...document.querySelectorAll('#app [onmouseover],#app [onmouseenter]')].length;
  // sideways scroll: the page wider than the screen, or an element sticking out that no scroller holds
  let hs = document.documentElement.scrollWidth - W; const out = [];
  for (const el of document.querySelectorAll('#app *')) {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.right <= W + 1 || !vis(el)) continue;
    let held = false; for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { if (/auto|scroll|hidden|clip/.test(getComputedStyle(a).overflowX) && a.getBoundingClientRect().right <= W + 1) { held = true; break; } }
    if (!held) out.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).trim().split(/\s+/)[0]) + '+' + Math.round(r.right - W));
  }
  return { words, controls, elements, dom, chips, infos, folds, foldsClosed, screens, zones, pageShare: sr ? +(sr.width / W).toFixed(2) : 1, hscroll: Math.max(0, hs), sticksOut: out.slice(0, 4), nOut: out.length, hover };
};


export const SETTLE = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => new Promise(r => setTimeout(r, 120))).then(() => new Promise(r => requestAnimationFrame(() => r())));
