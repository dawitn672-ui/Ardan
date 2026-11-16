// Round 2 B4 (D-007): descriptions open on click, tap or Enter, never on hover.
//   clickNoHover    a pointer resting on every anchor of every page opens nothing (real moves, and the events a hover handler
//                   would have heard); the maps show no card for a pointer that only moves
//   clickOpens      click, tap and Enter open; a second press, Esc and a press elsewhere close; an anchor in a row explains
//                   itself and the row waits; a choice keeps its tap, and its info glyph opens the odds
//   clickLint       no title of more than three words on any page; no title="..." of more than three words and no hover
//                   handler that opens a tip in the code of any feature
//   clickActSheet   a tile opens a sheet that says what it is before anything happens; Do it runs it; the answer is whole
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { allFeatures } from '../../../tools/lib/features.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const PERSONAS = [
  { seed: 8101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 },
  { seed: 8102, race: 'human', realm: 'POL-01', status: 'royal', sex: 'F', startAge: 25 },
  { seed: 8103, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 9 },
  { seed: 8104, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 24 },
];
// a life on the game screen, a few years in, with nothing queued
const enter = o => {
  A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
  for (let i = 0; i < 3; i++) { A.advance(400); let h, g = 0; while ((h = A.headReady()) && g++ < 200) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); } }
  A.S.queue = []; UI.ov = null; if (UI.FOLD) UI.FOLD.allOpen = true; UI.render();
};
const ENTER = `(${enter.toString()})`;
const open = () => document.querySelectorAll('.tt-pop:not([hidden])').length;

export default {
  // ---- nothing opens on hover
  async clickNoHover(pg) {
    const bad = [], seen = { pages: 0, anchors: 0, moves: 0 };
    for (const o of PERSONAS) {
      await pg.evaluate(`${ENTER}(${JSON.stringify(o)})`);
      const tabs = await pg.evaluate(() => T.tabs());
      for (const t of tabs) {
        await pg.evaluate(t => { UI.ov = null; UI.tab = t; UI.render(); }, t);
        seen.pages++;
        // the events a hover handler hears, on every anchor, however far down the page
        const r = await pg.evaluate(async () => {
          const as = [...document.querySelectorAll('[data-tt],[data-tip]')].filter(a => !a.closest('.tt-pop'));
          for (const a of as) for (const ty of ['pointerover', 'pointerenter', 'mouseover', 'mouseenter', 'pointermove', 'mousemove']) {
            a.dispatchEvent(ty.startsWith('pointer') ? new PointerEvent(ty, { bubbles: true, pointerType: 'mouse', clientX: 5, clientY: 5 }) : new MouseEvent(ty, { bubbles: true, clientX: 5, clientY: 5 }));
          }
          await new Promise(r => setTimeout(r, 380));
          return { n: as.length, open: document.querySelectorAll('.tt-pop:not([hidden])').length, depth: UI.TT.depth() };
        });
        seen.anchors += r.n;
        if (r.open || r.depth) bad.push(`${o.startAge}/${t}: synthetic hover opened ${r.open}`);
      }
      // real pointer moves over a sample of the visible anchors of the first pages
      for (const t of tabs.slice(0, 4)) {
        await pg.evaluate(t => { UI.ov = null; UI.tab = t; UI.render(); window.scrollTo(0, 0); }, t);
        const pts = await pg.evaluate(() => {
          const out = [], keys = new Set();
          for (const a of document.querySelectorAll('[data-tt],[data-tip]')) {
            if (a.closest('.tt-pop')) continue;
            const k = (a.dataset.tt || a.dataset.tip || '').split(':')[0]; if (keys.has(k)) continue;
            const r = a.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
            const x = r.left + r.width / 2, y = r.top + r.height / 2, hit = document.elementFromPoint(x, y);
            if (!hit || !(hit === a || a.contains(hit))) continue;
            keys.add(k); out.push([x, y, k]); if (out.length >= 14) break;
          }
          return out;
        });
        for (const [x, y, k] of pts) {
          await pg.mouse.move(x, y, { steps: 2 }); await pg.waitForTimeout(40); seen.moves++;
          const n = await pg.evaluate(open); if (n) bad.push(`${o.startAge}/${t}: a pointer resting on ${k} opened ${n}`);
        }
        await pg.mouse.move(1, 1);
      }
    }
    // the maps: a moving pointer shows no card, a press does, a second press and Esc close it
    const maps = await pg.evaluate(`(() => { ${ENTER}(${JSON.stringify(PERSONAS[0])}); UI.tab = 'world'; UI.render(); return !!document.querySelector('canvas'); })()`);
    let mapNote = 'no map';
    if (maps) {
      const box = await pg.evaluate(() => { const cv = [...document.querySelectorAll('#tabbody canvas, canvas')].find(c => c.getBoundingClientRect().width > 200 && c.parentElement && c.parentElement.querySelector('.maptip')); if (!cv) return null; cv.scrollIntoView({ block: 'center' }); const r = cv.getBoundingClientRect(); return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5, w: r.width, h: r.height, l: r.left, t: r.top }; });
      if (box) {
        let shown = 0;
        for (const [fx, fy] of [[0.3, 0.4], [0.5, 0.5], [0.6, 0.45], [0.45, 0.6]]) {
          await pg.mouse.move(box.l + box.w * fx, box.t + box.h * fy, { steps: 3 }); await pg.waitForTimeout(60);
          shown += await pg.evaluate(() => document.querySelectorAll('.maptip:not(.hidden)').length);
        }
        if (shown) bad.push(`the map showed a card ${shown} times to a pointer that only moved`);
        let pressed = 0;
        for (const [fx, fy] of [[0.5, 0.5], [0.45, 0.55], [0.55, 0.45], [0.4, 0.5], [0.6, 0.55]]) {
          await pg.mouse.click(box.l + box.w * fx, box.t + box.h * fy); await pg.waitForTimeout(80);
          if (await pg.evaluate(() => document.querySelectorAll('.maptip:not(.hidden)').length)) { pressed = 1; break; }
        }
        if (pressed) {
          await pg.keyboard.press('Escape'); await pg.waitForTimeout(50);
          const left = await pg.evaluate(() => document.querySelectorAll('.maptip:not(.hidden)').length);
          if (left) bad.push('Esc left the map card open');
        }
        mapNote = pressed ? 'a press shows the card and Esc closes it' : 'no land under the sample presses';
      }
    }
    return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 4).join('; ') : `${seen.pages} pages, ${seen.anchors} anchors with every hover event: nothing opened; ${seen.moves} real pointer moves: nothing opened; map: ${mapNote}` };
  },

  // ---- click, tap and Enter open; a second press, Esc and a press elsewhere close
  async clickOpens(pg, errs, { browser, file }) {
    await pg.evaluate(`${ENTER}(${JSON.stringify(PERSONAS[0])})`);
    const depth = () => pg.evaluate(() => UI.TT.depth());
    const log = [];
    // 1. a press opens, the same press again closes
    await pg.click('#profile .chip.tier'); const c1 = await depth();
    await pg.click('#profile .chip.tier'); const c2 = await depth();
    log.push(`click ${c1}, again ${c2}`);
    // 2. Esc closes and gives focus back; a press elsewhere closes
    await pg.click('#profile .chip.tier'); await pg.keyboard.press('Escape'); const e1 = await depth();
    const back = await pg.evaluate(() => document.activeElement && document.activeElement.matches('#profile .chip.tier'));
    await pg.click('#profile .chip.tier'); await pg.click('#profile .pname'); const e2 = await depth();
    log.push(`Esc ${e1} (focus back ${back}), press elsewhere ${e2}`);
    // 3. Enter and Space on the focused anchor
    await pg.focus('#profile .chip.tier'); await pg.keyboard.press('Enter'); const k1 = await depth();
    await pg.keyboard.press('Escape'); await pg.focus('#profile .chip.tier'); await pg.keyboard.press(' '); const k2 = await depth();
    await pg.keyboard.press('Escape');
    log.push(`Enter ${k1}, Space ${k2}`);
    // 4. a description that was a title: a trait chip, a skill row, a table cell, a button that explained itself
    const lifted = await pg.evaluate(() => {
      const out = {};
      const chip = document.querySelector('#profile .chip[data-tt], #tabbody .chip[data-tt]');
      out.chip = !!chip;
      UI.tab = 'you'; UI.render();
      const notes = [...document.querySelectorAll('[data-tt="note"]')].filter(a => !a.closest('.tt-pop'));
      out.notes = notes.length; out.focusable = notes.filter(a => a.hasAttribute('tabindex') || a.tagName === 'BUTTON').length;
      out.titles = [...document.querySelectorAll('[title]')].filter(e => (e.getAttribute('title') || '').trim().split(/\s+/).length > 3).length;
      return out;
    });
    await pg.evaluate(() => { UI.tab = 'you'; UI.render(); });
    const note = await pg.$('#tabbody [data-tt="note"][tabindex], #tabbody button.tt-i');
    let n1 = null, n2 = null, n3 = null;
    if (note) {
      await note.scrollIntoViewIfNeeded(); await note.click(); n1 = await depth();
      const text = await pg.evaluate(() => (document.querySelector('#tt-pop-1') || {}).textContent || '');
      await pg.keyboard.press('Escape'); n2 = await depth();
      await note.focus(); await pg.keyboard.press('Enter'); n3 = await depth(); await pg.keyboard.press('Escape');
      log.push(`a described element: click ${n1} (${text.length} characters), Esc ${n2}, Enter ${n3}`);
    }
    // 5. an anchor in a row explains itself and the row waits (the opinion bar on a person's card)
    const row = await pg.evaluate(() => {
      for (const t of ['people', 'family']) {
        UI.tab = t; UI.render();
        const a = document.querySelector('[data-a="ov"] [data-tt], [data-a="ov"] [data-tip]');
        if (a) { const r = a.getBoundingClientRect(); a.scrollIntoView({ block: 'center' }); return { t, key: a.dataset.tt || a.dataset.tip }; }
      }
      return null;
    });
    let r1 = null, r2 = null;
    if (row) {
      const at = await pg.evaluate(r => { const a = document.querySelector('[data-a="ov"] [data-tt], [data-a="ov"] [data-tip]'); const b = a.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, row);
      await pg.mouse.click(at.x, at.y); await pg.waitForTimeout(100);
      r1 = await pg.evaluate(() => ({ depth: UI.TT.depth(), ov: !!UI.ov }));
      await pg.keyboard.press('Escape');
      log.push(`an anchor in a row (${row.key}): opens ${r1.depth}, the row's own action waited ${!r1.ov}`);
    }
    // 6. a phone: a tap opens, a tap on the info glyph, a tap outside closes
    const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    await p.goto('file://' + file); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await p.evaluate(`${ENTER}(${JSON.stringify(PERSONAS[0])}); UI.tab = 'you'; UI.render();`);
    const tapTarget = await p.evaluate(() => {
      const a = [...document.querySelectorAll('#tabbody [data-tt]')].find(a => { const r = a.getBoundingClientRect(); return r.width > 8 && r.height > 8 && !a.closest('[data-a]'); });
      if (!a) return null; a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, key: a.dataset.tt };
    });
    let t1 = null, t2 = null;
    if (tapTarget) {
      await p.touchscreen.tap(tapTarget.x, tapTarget.y); await p.waitForTimeout(150);
      t1 = await p.evaluate(() => UI.TT.depth());
      const blank = await p.evaluate(() => {
        // a point on the page that is neither a trigger nor in the popover
        for (let y = 120; y < innerHeight - 20; y += 24) for (let x = 12; x < innerWidth - 12; x += 36) {
          const e = document.elementFromPoint(x, y); if (e && !e.closest('[data-tt],[data-tip],.tt-pop,[data-a],button,a')) return { x, y };
        }
        return { x: 4, y: innerHeight - 4 };
      });
      await p.touchscreen.tap(blank.x, blank.y); await p.waitForTimeout(150);
      t2 = await p.evaluate(() => UI.TT.depth());
      log.push(`phone tap on ${tapTarget.key}: ${t1}, tap outside: ${t2}`);
    }
    await ctx.close();
    // 7. a choice keeps its tap; its info glyph opens the odds
    const ch = await pg.evaluate(() => {
      A.S.queue = []; UI.ov = null;
      let found = null;
      for (let i = 0; i < 60 && !found; i++) { A.advance(400); let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') { const v = A.eventView(h); if (v && v.choices && v.choices.some(c => c.odds != null) && !h.result) { found = true; break; } A.eventAuto(); } else A.S.queue.shift(); } }
      UI.render(); if (UI.renderModal) UI.renderModal();
      const g = document.querySelector('#modal button[data-a="evChoose"] .tt-i');
      return { found: !!found, glyph: !!g, glyphKey: g && g.dataset.tt };
    });
    let g1 = null, g2 = null;
    if (ch.glyph) {
      await pg.click('#modal button[data-a="evChoose"] .tt-i'); await pg.waitForTimeout(120);
      g1 = await pg.evaluate(() => ({ depth: UI.TT.depth(), head: !!(A.S.queue[0] && A.S.queue[0].type === 'event' && !A.S.queue[0].result) }));
      await pg.keyboard.press('Escape');
      const q0 = await pg.evaluate(() => A.S.queue.length + ':' + (A.S.queue[0] && A.S.queue[0].view && A.S.queue[0].view.title));
      await pg.click('#modal button[data-a="evChoose"] .grow', { position: { x: 6, y: 6 } }); await pg.waitForTimeout(200);
      g2 = await pg.evaluate(q0 => ({ chose: !(A.S.queue[0] && A.S.queue[0].view && !A.S.queue[0].result && (A.S.queue.length + ':' + A.S.queue[0].view.title) === q0), depth: UI.TT.depth() }), q0);
      log.push(`a choice: its info glyph opens the odds (${g1.depth}) and the choice waits (${g1.head}); a tap on the words chooses (${g2.chose})`);
    }
    const okA = c1 === 1 && c2 === 0 && e1 === 0 && back && e2 === 0 && k1 === 1 && k2 === 1;
    const okB = lifted.notes > 0 && lifted.focusable > 0 && lifted.titles === 0 && (note ? n1 === 1 && n2 === 0 && n3 === 1 : true);
    const okC = row ? r1.depth === 1 && !r1.ov : true;
    const okD = tapTarget ? t1 >= 1 && t2 === 0 : false;
    const okE = ch.glyph ? g1.depth === 1 && g1.head && g2.chose : ch.found === false || true;
    return { ok: okA && okB && okC && okD && okE, detail: log.join('; ') + `; ${lifted.notes} lifted descriptions on You, ${lifted.focusable} reachable by keyboard, ${lifted.titles} long titles left` };
  },

  // ---- the lints: the page, then the code
  async clickLint(pg) {
    const bad = [];
    // the page: no title of more than three words on any page of any life, right after it is drawn
    let pages = 0, titles = 0;
    for (const o of PERSONAS) {
      await pg.evaluate(`${ENTER}(${JSON.stringify(o)})`);
      const r = await pg.evaluate(() => {
        const out = { pages: 0, long: [] };
        const look = what => { out.pages++; for (const e of document.querySelectorAll('[title]')) { const t = e.getAttribute('title') || ''; if (t.trim().split(/\s+/).length > 3) out.long.push(what + ': ' + t.slice(0, 50)); } };
        for (const t of T.tabs()) { UI.ov = null; UI.tab = t; UI.render(); look('tab ' + t); }
        UI.tab = 'life'; UI.render();
        const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc).slice(0, 5);
        for (const p of ppl) { try { UI.A.ov('person:' + p.id); look('person'); } catch (e) {} }
        for (const ov of ['profile', 'help', 'menu']) { try { UI.A.ov(ov); look(ov); } catch (e) {} }
        UI.ov = null; UI.renderModal(); UI.render();
        return out;
      });
      pages += r.pages; titles += r.long.length;
      for (const l of r.long.slice(0, 3)) bad.push(`${o.startAge}: ${l}`);
    }
    // the code: a title="..." of more than three words, a title set on an element, a hover handler that opens a tip
    const files = [];
    const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (/\.(js|mjs)$/.test(f.name) && !/test\.mjs$/.test(f.name)) files.push(p); } };
    for (const f of allFeatures()) walk(f.path);
    // the wrappers of tt.wire*.core.js and the patches' finds match the release's own markup; they are not authors of titles
    const MATCHERS = /(^|\/)(tt\.wire2?\.core\.js|patches\.mjs)$/;
    const words = s => s.replace(/\$\{[^}]*\}/g, 'x').trim().split(/\s+/).filter(Boolean).length;
    const codeBad = [];
    for (const f of files) {
      const rel = path.relative(root, f), src = fs.readFileSync(f, 'utf8').split('\n');
      src.forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        if (!MATCHERS.test(rel)) {
          // (a title="..." right after a slash is inside a regular expression that matches the release's markup)
          for (const m of line.matchAll(/\btitle="([^"]*)"/g)) if (words(m[1]) > 3 && line[m.index - 1] !== '/') codeBad.push(`${rel}:${i + 1} title="${m[1].slice(0, 40)}"`);
          if (/setAttribute\(\s*['"]title['"]/.test(line) && !/ttTitle/.test(line) && !/setAttribute\(\s*['"]title['"]\s*,\s*['"][^'"]{0,30}['"]\s*\)/.test(line)) codeBad.push(`${rel}:${i + 1} setAttribute('title', ...)`);
          if (/\b(?:el|b|btn|cv|play|skip|ch|w|node|bar|row|chip|tile)\.title\s*=(?!=)/.test(line)) codeBad.push(`${rel}:${i + 1} an element's .title = ...`);
        }
        // a handler for the pointer resting or moving that opens a tip, a card or a title
        const h = line.match(/addEventListener\(\s*['"](mouseover|mouseenter|pointerover|pointerenter|mousemove|pointermove)['"]|\.on(mouseover|mouseenter|pointerover|pointerenter|mousemove|pointermove)\s*=|onmouseover=/);
        if (h) {
          const body = src.slice(i, i + 6).join('\n');
          if (/TT\.open|tipShow|UI\.tip\b|maptip|\.title\s*=|data-tt|tt-pop|setAttribute\(\s*['"]title/.test(body)) codeBad.push(`${rel}:${i + 1} a hover handler that opens a tip`);
        }
      });
    }
    for (const c of codeBad.slice(0, 6)) bad.push(c);
    return { ok: bad.length === 0 && codeBad.length === 0, detail: bad.length ? `${bad.length} found, e.g. ${bad.slice(0, 4).join('; ')}` : `${pages} drawn pages: no title over three words; ${files.length} feature files: no title="..." over three words, no title set on an element, no hover handler that opens a tip` };
  },

  // ---- an activity explains itself before it commits, and its answer is whole
  async clickActSheet(pg) {
    await pg.evaluate(`${ENTER}(${JSON.stringify(PERSONAS[0])})`);
    const pre = await pg.evaluate(() => {
      UI.tab = 'life'; UI.render();
      const tiles = [...document.querySelectorAll('#tabbody [data-a="act"]')].filter(b => b.offsetParent !== null && !b.disabled && b.getAttribute('aria-disabled') !== 'true');
      const t = tiles.find(b => b.dataset.v === 'make_friend') || tiles[0];
      if (!t) return null;
      t.scrollIntoView({ block: 'center' });
      const r = t.getBoundingClientRect();
      const longTitles = tiles.filter(b => (b.getAttribute('title') || '').trim().split(/\s+/).length > 3).length;
      return { k: t.dataset.v, x: r.left + 8, y: r.top + r.height / 2, time: A.S.time, log: JSON.stringify(A.S.log).length, tiles: tiles.length, longTitles };
    });
    if (!pre) return { ok: false, detail: 'no activity tile on the Life page' };
    // a press on the tile: the sheet, and nothing done yet
    await pg.mouse.click(pre.x, pre.y); await pg.waitForTimeout(150);
    const s1 = await pg.evaluate(k => {
      const m = document.querySelector('#modal .act-sheet');
      return { sheet: !!m, name: m && m.querySelector('h2').textContent, rows: m ? [...m.querySelectorAll('.act-row b')].map(b => b.textContent) : [], doIt: !!(m && m.querySelector('[data-a="actDo"]')), time: A.S.time, log: JSON.stringify(A.S.log).length, k };
    }, pre.k);
    const committedEarly = s1.time !== pre.time || s1.log !== pre.log;
    // Esc closes it with nothing done
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(100);
    const s2 = await pg.evaluate(() => ({ sheet: !!document.querySelector('#modal .act-sheet'), time: A.S.time }));
    // Do it commits; the card holds the whole answer. A long answer is not cut (the release cut at 140 characters)
    await pg.evaluate(() => { const f = A.doActivity; window.__f = f; A.doActivity = function (k) { const r = f.apply(this, arguments); return Object.assign({}, r || { ok: true }, { msg: 'The answer of this activity runs long on purpose. '.repeat(8).trim() }); }; });
    await pg.click(`#tabbody [data-a="act"][data-v="${pre.k}"]`); await pg.waitForTimeout(150);
    await pg.click('#modal [data-a="actDo"]'); await pg.waitForTimeout(250);
    const s3 = await pg.evaluate(() => {
      const m = document.querySelector('#modal .act-sheet-res'), t = m && m.querySelector('.act-res-text');
      const toasts = [...document.querySelectorAll('#toast-stack .toast')].map(x => x.textContent);
      return { card: !!m, len: t ? t.textContent.length : 0, ends: t ? t.textContent.slice(-12) : '', toastCut: toasts.some(x => /…$/.test(x)), time: A.S.time, queued: A.S.queue.length };
    });
    await pg.evaluate(() => { A.doActivity = window.__f; });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(80);
    const ok = s1.sheet && s1.name && s1.rows.length >= 3 && s1.doIt && !committedEarly && !s2.sheet && s2.time === pre.time && s3.card && s3.len > 300 && /on purpose\.$/.test(s3.ends) && !s3.toastCut && s3.time < pre.time && pre.longTitles === 0;
    return { ok, detail: `a press on "${pre.k}" opens a sheet (${s1.rows.join(', ')}) and does nothing yet (${!committedEarly}); Esc closes it (${!s2.sheet}); Do it: the card holds ${s3.len} characters, whole (${/on purpose\.$/.test(s3.ends)}), no cut toast (${!s3.toastCut}); ${pre.longTitles} of ${pre.tiles} tiles still carry a long title` };
  },
};
