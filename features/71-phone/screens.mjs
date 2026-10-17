// The screens of the phone audit, the in-page probe that measures one, and the page runner. Shared by audit.mjs and
// test.mjs.
import { pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';

export const DEVICES = {
  se: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },        // iPhone SE (2nd/3rd gen)
  pixel: { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }, // Pixel 7
  desk: { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
// a booted game in a context of its own for one device (motion reduced, so fades do not hide what is measured)
export async function openPage(browser, file, dev, errs = []) {
  const ctx = await browser.newContext({ ...DEVICES[dev], reducedMotion: 'reduce' });
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { ctx, pg };
}
// draw each screen in turn and measure it; each(name, page, metrics) may screenshot
export async function measureScreens(pg, { touch, only, each } = {}) {
  const out = {};
  for (const s of SCREENS) {
    if (only && !only.includes(s.name) && s.name !== 'life') continue;
    try {
      await pg.evaluate(() => { try { UI.TT && UI.TT.closeAll(); } catch (e) {} });
      await pg.evaluate(s.js);
      if (s.tap) { const el = await pg.$(s.tap); if (el) { if (touch) await el.tap(); else await el.click(); } }
      await pg.evaluate(SETTLE);
      const m = await pg.evaluate(PROBE);
      out[s.name] = m;
      if (each && (!only || only.includes(s.name))) await each(s.name, pg, m);
    } catch (e) { out[s.name] = { error: String(e.message || e).slice(0, 300) }; }
  }
  return out;
}
//
// Each screen is { name, js, tap?, main? }: `js` runs in the page and leaves the screen drawn; `tap` (optional) is a
// selector Playwright taps afterwards (a real touch, for tooltips); `main` marks the screens the tests hold to the
// strictest bar (axe, tap targets).

// a fresh adult life in Aldmark, the queue empty, on the Life tab; a few years played so the story and people exist
export const LIFE = (seed = 7101, o = {}) => `(() => {
  A.newGame(Object.assign({ seed: ${seed}, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 }, ${JSON.stringify(o)}));
  UI.screen = 'game'; UI.ov = null; UI.tab = 'life';
  for (let y = 0; y < 2; y++) { A.advance(365); let h, g = 0; while ((h = A.S.queue[0]) && g++ < 400) { if (h.type === 'event') { try { A.eventAuto(); } catch (e) { A.S.queue.shift(); } } else A.S.queue.shift(); } const pc = A.pc(); if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  A.S.queue = []; UI.ov = null; UI.tab = 'life'; UI.render(); window.scrollTo(0, 0);
})()`;

const tab = (t, extra = '') => `(() => { UI.ov = null; A.S.queue = []; UI.tab = ${JSON.stringify(t)}; ${extra} UI.render(); window.scrollTo(0, 0); })()`;
const world = v => tab('world', `UI.worldView = ${JSON.stringify(v)};`);

// a war with the player enlisted (for the war room, missions and battles)
const WAR = `(() => { const pc = A.pc(); if (!pc.mil || !A.S.wars.some(w => w.active !== false && (w.a === pc.realm || w.b === pc.realm || w.att === pc.realm || w.def === pc.realm))) {
  const en = A.neighbors(pc.realm)[0]; A.startWar(pc.realm, en, null, 'conquest'); A.enlist(pc); A._idIdx = null; A.advance(2); A._idIdx = null; }
  A.S.queue = []; UI.ov = null; })()`;

// an event the player can see, queued and shown (the first ready one the world offers, else a known one)
const EVENT = `(() => { A.S.queue = []; UI.ov = null; const pc = A.pc();
  let id = null;
  for (let g = 0; g < 60 && !id; g++) { A.advance(30); const h = A.S.queue[0]; if (h && h.type === 'event') { const v = A.eventView(h); if (v && v.choices && v.choices.length >= 2) { id = h.ev; A.S.queue = [h]; break; } } A.S.queue = []; if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  UI.tab = 'life'; UI.render(); window.scrollTo(0, 0); })()`;

export const SCREENS = [
  { name: 'title', main: true, js: `(() => { A.S.queue = []; UI.ov = null; UI.screen = 'title'; UI.render(); })()` },
  { name: 'create', main: true, js: `(() => { UI.ov = null; UI.A.newLife(); window.scrollTo(0, 0); })()` },
  { name: 'life', main: true, js: LIFE() },
  { name: 'story', main: true, js: tab('story') },
  { name: 'you', main: true, js: tab('you') },
  { name: 'decisions', js: tab('goals') },
  { name: 'people', main: true, js: tab('people') },
  { name: 'path', main: true, js: tab('path') },
  { name: 'war', js: tab('war') },
  { name: 'holdings', main: true, js: tab('holdings') },
  { name: 'realm', main: true, js: tab('realm') },
  { name: 'dynasty', js: tab('legacy') },
  { name: 'world-map', main: true, js: world('map') },
  { name: 'world-dipl', js: world('dipl') },
  { name: 'world-realms', js: world('realms') },
  { name: 'world-wars', js: world('wars') },
  { name: 'world-news', js: world('news') },
  { name: 'world-history', js: world('history') },
  { name: 'codex', js: tab('codex') },
  { name: 'chronicle', main: true, js: world('annals') },
  { name: 'person', main: true, js: `(() => { A.S.queue = []; UI.tab = 'people'; UI.ov = null; UI.render(); const pc = A.pc(); const id = Object.keys(pc.rel || {}).find(i => A.P(i) && A.P(i).alive) || Object.values(A.S.people).find(p => p.alive && p.id !== pc.id).id; UI.A.ov('person:' + id); })()` },
  { name: 'profile', js: `(() => { A.S.queue = []; UI.ov = { type: 'profile' }; UI.render(); })()` },
  { name: 'event', main: true, js: EVENT },
  { name: 'siege', js: `(() => { A.S.queue = []; UI.ov = null; const pc = A.pc(); A.queue({ type: 'event', ev: 'sg_camp', forced: true, ctx: { loc: pc.home, siege: 1 } }); UI.render(); })()` },
  { name: 'duel', main: true, js: `(() => { A.S.queue = []; UI.ov = null; const pc = A.pc(); const foe = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && A.age(p) >= 18 && A.age(p) < 40); A.startDuel(pc, foe, { kind: 'spar', place: 'the yard', lethal: false }); UI.render(); })()` },
  { name: 'fullmap', main: true, js: `(() => { A.S.queue = []; UI.tab = 'world'; UI.worldView = 'map'; UI.ov = null; UI.render(); UI.A.ov('bigmap'); })()` },
  { name: 'warroom', js: `(() => { ${WAR}; UI.tab = 'war'; UI.render(); UI.warRoomOpen(); })()` },
  { name: 'mission', js: `(() => { ${WAR}; const pc = A.pc(); const w = A.S.wars[A.S.wars.length - 1]; const en = A.neighbors(pc.realm)[0]; const m = A.newMission(pc, en, w); A.S.queue = [{ type: 'mission', m }]; A.missionView && A.missionView(m); UI.render(); })()` },
  { name: 'linebattle', js: `(() => { ${WAR}; const pc = A.pc(); const w = A.S.wars[A.S.wars.length - 1]; const en = A.neighbors(pc.realm)[0]; const m = A.newLineBattle(pc, w.id, en); A.S.queue = [{ type: 'mission', m }]; A.missionView && A.missionView(m); UI.render(); })()` },
  { name: 'battle', js: `(() => { const pc = A.pc(); const B = A.newBattle({ title: 'Battle of the Ford', terr: 'plains', weather: 'clear', sideA: { realm: pc.realm, men: 3000, q: 0.9, cmdSkill: 45 }, sideB: { realm: A.neighbors(pc.realm)[0], men: 2800, q: 0.9, cmdSkill: 40 } }); B.pcSide = 'A'; A.S.queue = [{ type: 'battle', b: B }]; UI.ov = null; UI.render(); })()` },
  { name: 'menu', main: true, js: `(() => { A.S.queue = []; UI.ov = { type: 'menu' }; UI.render(); })()` },
  { name: 'mods', js: `(() => { A.S.queue = []; UI.ov = { type: 'menu' }; UI.render(); UI.A.mods(); })()` },
  { name: 'tooltip', main: true, js: tab('you'), tap: '.phone-profile .barrow .lbl [data-tt="health"], #profile .barrow .lbl [data-tt="health"]' },
  { name: 'market', js: `(() => { A.S.queue = []; UI.ov = null; const pc = A.pc(); for (const t of ['holdings', 'path', 'realm', 'life']) { UI.tab = t; UI.render(); if (document.querySelector('.mkt-t')) break; } const m = document.querySelector('.mkt-t'); if (m) m.scrollIntoView({ block: 'start' }); })()` },
  { name: 'death', main: true, js: `(() => { A.S.queue = []; UI.ov = null; A.pcDeath('a fever'); UI.render(); })()` },
];

// let the fonts load and the fades and ink-ins finish (or 1.5 s pass) before measuring
export const SETTLE = () => (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => Promise.race([Promise.all(document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 1500))])).then(() => new Promise(r => requestAnimationFrame(() => r())));

// The probe: run in the page, returns what the audit reports for the screen as drawn.
export const PROBE = () => {
  const W = innerWidth, H = innerHeight;
  const visible = el => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; }
    return true;
  };
  const scroller = el => { for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) { const ox = getComputedStyle(a).overflowX; if (/auto|scroll|hidden|clip/.test(ox)) return a; } return null; };
  const label = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.dataset && el.dataset.a) s += `[data-a=${el.dataset.a}${el.dataset.v != null ? ':' + String(el.dataset.v).slice(0, 18) : ''}]`; else if (el.dataset && el.dataset.tt) s += `[data-tt=${el.dataset.tt}]`; else if (el.className && typeof el.className === 'string') s += '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.'); const t = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24); return t ? `${s} "${t}"` : s; };
  const modal = document.querySelector('#modal');
  const root = modal || document.body;
  // what is on top: a modal covers the page, so measure the modal alone when one is open
  const all = [...root.querySelectorAll('*')].filter(e => !e.closest('svg') || e.tagName.toLowerCase() === 'svg');
  // 1. overflow: the page wider than the screen, and anything sticking past the edge that no scroller holds
  const docW = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const off = [];
  for (const el of all) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > W + 1 || r.left < -1) && !scroller(el)) off.push(label(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
  }
  // horizontal scrollers inside the page (a table that scrolls sideways is a squeezed desktop)
  const hscroll = [];
  for (const el of all) { if (!visible(el)) continue; const cs = getComputedStyle(el); if (/auto|scroll/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 && el.tagName !== 'CANVAS' && !el.classList.contains('ph-pan')) hscroll.push(label(el) + ` ${el.scrollWidth}>${el.clientWidth}`); }
  // 2. tap targets under 44 x 44 CSS px (a word inside running text is the WCAG inline exception, counted apart)
  const SEL = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [data-a], [data-tt], label[for]';
  const small = [], inline = [], glossary = []; let targets = 0;
  const seenT = new Set();
  for (let el of root.querySelectorAll(SEL)) {
    if (el.tagName === 'INPUT' && (el.closest('label') || el.labels && el.labels.length)) el = el.closest('label') || el.labels[0]; // a box with its label: the label is the target
    if (seenT.has(el) || !visible(el)) continue; seenT.add(el);
    if (el.closest('[data-a], button, a[href], summary') !== el && el.parentElement && el.parentElement.closest('button, a[href], summary, [data-a]')) continue; // part of a bigger target
    targets++;
    const r = el.getBoundingClientRect();
    if (r.width >= 43.5 && r.height >= 43.5) continue;
    const cs = getComputedStyle(el);
    const inText = cs.display === 'inline' && el.parentElement && /\S/.test([...el.parentElement.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''));
    const lab = label(el) + ` ${Math.round(r.width)}x${Math.round(r.height)}`;
    // a glossary word (59-tooltips) only explains; it is held to WCAG 2.5.8's 24 px, actions to 44
    const gloss = el.matches('[data-tt], .tipt') && !el.matches('[data-a], button, a[href], summary, select, input, label');
    if (inText) inline.push(lab); else if (gloss) { if (r.width < 23.5 || r.height < 23.5) small.push(lab); else glossary.push(lab); } else small.push(lab);
  }
  // 3. text under 14 px
  const tinyText = []; let textEls = 0;
  for (const el of all) {
    if (el.tagName === 'svg' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!own || !visible(el)) continue;
    textEls++;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 13.95) tinyText.push(`${Math.round(fs * 10) / 10}px ${label(el).slice(0, 60)}`);
  }
  // 4. fixed and sticky elements, and whether the page leaves room under the bottom bar
  const fixed = [];
  for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && visible(el)) { const r = el.getBoundingClientRect(); fixed.push({ el: label(el).slice(0, 40), pos: cs.position, top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }); } }
  let covered = null;
  const bnav = document.querySelector('#bnav');
  if (bnav && visible(bnav) && !modal) {
    const se = document.scrollingElement; const y0 = se.scrollTop; se.scrollTop = se.scrollHeight;
    const tb = document.querySelector('#tabbody'); const kids = tb ? [...tb.querySelectorAll('*')].filter(visible) : [];
    // the bottom of what can be seen: an element inside a clipping box ends where the box does
    const seenBottom = k => { let b = k.getBoundingClientRect().bottom; for (let a = k.parentElement; a && a !== tb; a = a.parentElement) { const cs = getComputedStyle(a); if (cs.overflowY !== 'visible' || a.tagName === 'DETAILS' && !a.open) b = Math.min(b, a.getBoundingClientRect().bottom); } return b; };
    const lastBottom = Math.max(0, ...kids.map(seenBottom));
    const barTop = bnav.getBoundingClientRect().top;
    covered = Math.max(0, Math.round(lastBottom - barTop));
    se.scrollTop = y0;
  }
  // 5. a modal taller than the screen must scroll
  let modalInfo = null;
  if (modal) {
    const box = modal.querySelector('.mbox') || modal.firstElementChild;
    if (box) {
      const r = box.getBoundingClientRect();
      const sc = el => { for (let a = el; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (/auto|scroll/.test(cs.overflowY) && a.scrollHeight > a.clientHeight + 1) return a; } return null; };
      const s = sc(box) || ([...box.querySelectorAll('*')].find(e => { const cs = getComputedStyle(e); return /auto|scroll/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1; }));
      const tall = r.height > H + 1 || (box.scrollHeight > box.clientHeight + 1);
      modalInfo = { h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), scrolls: !!s, stuck: tall && !s && r.height > H + 1 };
      const choices = [...modal.querySelectorAll('[data-a=evChoose], [data-a=qChoice], [data-a=mChoose]')].filter(visible);
      if (choices.length) modalInfo.choiceTop = Math.round(Math.min(...choices.map(c => c.getBoundingClientRect().top)));
    }
  }
  return { W, H, docW, overflow: docW > W + 1, off: off.slice(0, 30), nOff: off.length, hscroll: hscroll.slice(0, 10), targets, small, inline, glossary, textEls, tinyText, fixed, covered, modal: modalInfo, scrollH: document.scrollingElement.scrollHeight };
};
