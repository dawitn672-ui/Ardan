// Dead clicks: every visible control on every screen, clicked one at a time from the same starting state. A control is
// dead when its click changes nothing: not the page, not the game, no dialog, no download, no new popover. A static pass
// also lists every data-a in the page that has no handler in UI.A.
//   node tools/deadclicks.mjs [built.html] [--screens=life,people] [--json=reports/deadclicks.json] [--max=400] [--phone]
// Exit code 1 if anything is dead or a click raised an error.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const opt = k => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const file = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(root, 'index.html'));
const MAX = +(opt('max') || 400);

// each screen: how to reach it from a fresh page, as code run in the page (deterministic: fixed seeds)
const LIFE = (o, then = '') => `A.newGame(Object.assign({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 }, ${JSON.stringify(o || {})}));
  UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; UI.tab = 'life'; if (UI.FOLD) UI.FOLD.allOpen = true; UI.render(); ${then}`;
const GROUP = (g, sub) => `(function(){ const b = document.querySelector('[data-a="group"][data-v="${g}"]'); if (b) b.click(); ${sub ? `const s = document.querySelector('[data-a="tab"][data-v="${sub}"]'); if (s) s.click();` : ''} })();`;
export const SCREENS = {
  title: `UI.ov = null; UI.screen = 'title'; UI.render(); UI.renderModal();`,
  create: `UI.ov = null; UI.screen = 'title'; UI.render(); UI.renderModal(); UI.A.newLife();`,
  life: LIFE(),
  goals: LIFE({}, GROUP('life', 'goals')),
  people: LIFE({}, GROUP('people')),
  path: LIFE({}, GROUP('pathwar', 'path')),
  war: LIFE({}, GROUP('pathwar', 'war')),
  holdings: LIFE({ status: 'merchant' }, GROUP('holdings')),
  realm: LIFE({}, GROUP('realm')),
  chronicle: LIFE({}, GROUP('chronicle')),
  nobleLife: LIFE({ status: 'noble', startAge: 30 }),
  nobleRealm: LIFE({ status: 'noble', startAge: 30 }, GROUP('realm')),
  child: LIFE({ startAge: 8 }),
  person: LIFE({}, `UI.ov = { type: 'person', id: A.pc().father || (A.pc().parents || [])[0] }; UI.renderModal();`),
  fullProfile: LIFE({}, `UI.ov = { type: 'person', id: A.S.pc }; UI.renderModal();`),
  menu: LIFE({}, `const m = document.querySelector('[data-a="menu"]'); if (m) m.click();`),
  warRoom: LIFE({}, `if (UI.warRoomOpen) UI.warRoomOpen();`),
  event: LIFE({}, `A.S.queue.unshift({ type: 'event', ev: 'av_wild_village_bounty', ctx: {} }); UI.refresh();`),
  map: LIFE({}, `UI.ov = { type: 'bigmap' }; UI.renderModal();`),
};

const browser = await pw.chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const PHONE = process.argv.includes('--phone');
const ctx = await browser.newContext({ viewport: PHONE ? { width: 390, height: 844 } : { width: 1366, height: 768 }, hasTouch: PHONE, acceptDownloads: true });
const pg = await ctx.newPage();
const errs = [];
let dialogs = 0, downloads = 0;
pg.on('pageerror', e => errs.push(String(e.message || e)));
pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
pg.on('dialog', d => { dialogs++; d.accept().catch(() => {}); });
pg.on('download', () => { downloads++; });
await pg.goto(pathToFileURL(file).href);
await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
await pg.evaluate(() => { try { localStorage.clear(); } catch (e) {} window.open = () => null; });

// the static pass: actions named in the page's own code that have no handler
const unhandled = await pg.evaluate(() => {
  const src = [...document.scripts].map(s => s.textContent).join('\n');
  const names = new Set([...src.matchAll(/data-a="([A-Za-z_$][\w$]*)"/g)].map(m => m[1]));
  return [...names].filter(n => !(UI.A && typeof UI.A[n] === 'function')).sort();
});

const CLICKABLE = 'button, [data-a], [role="button"], [role="tab"], summary, [data-tt], [data-tip]';
const want = (opt('screens') || Object.keys(SCREENS).join(',')).split(',');
const dead = [], broke = [], perScreen = {};
for (const name of want) {
  const setup = SCREENS[name];
  if (!setup) continue;
  // enumerate once
  await pg.evaluate(setup).catch(e => errs.push(name + ' setup: ' + e.message));
  await pg.waitForTimeout(80);
  const list = await pg.evaluate(sel => {
    const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]'); };
    return [...document.querySelectorAll(sel)].filter(vis).map((e, i) => ({ i, a: e.dataset.a || '', v: e.dataset.v || '', tag: e.tagName.toLowerCase(), text: (e.innerText || e.getAttribute('aria-label') || e.title || '').trim().replace(/\s+/g, ' ').slice(0, 48),
      disabled: !!(e.disabled || e.getAttribute('aria-disabled') === 'true' || e.classList.contains('disabled') || e.classList.contains('off')),
      current: e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-current') === 'page' || e.classList.contains('on') || e.classList.contains('sel') || e.classList.contains('selected') || e.classList.contains('active') || e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-checked') === 'true' }));
  }, CLICKABLE);
  perScreen[name] = { controls: list.length, dead: 0 };
  for (const c of list.slice(0, MAX)) {
    if (c.disabled || c.current) continue;
    await pg.evaluate(setup).catch(() => {});
    const e0 = errs.length, d0 = dialogs, dl0 = downloads;
    const r = await pg.evaluate(async ({ sel, i }) => {
      const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden]'); };
      const el = [...document.querySelectorAll(sel)].filter(vis)[i];
      if (!el) return { gone: true };
      const hash = s => { let h = 0; for (let k = 0; k < s.length; k++) h = (h * 31 + s.charCodeAt(k)) | 0; return h; };
      const ui = () => { try { return JSON.stringify({ wr: UI.wr, run: UI.run, map: UI.map, ov: UI.ov, sub: UI.sub, set: UI.set }, (k, v) => (v && typeof v === 'object' && v.nodeType) ? undefined : v); } catch (e) { return ''; } };
      const scrolls = () => [...document.querySelectorAll('#tabbody,#log,#profile,#modal .mbox,#modal .scroll')].map(e => e.scrollTop).join(',');
      const look = () => hash(document.body.innerHTML) + ':' + (A.S ? hash(JSON.stringify(A.S)) : 0) + ':' + hash(ui()) + ':' + scrolls() + ':' + (document.activeElement ? document.activeElement.outerHTML.slice(0, 80) : '') + ':' + [UI.screen, UI.tab, document.querySelectorAll('.tt-pop:not([hidden])').length].join('|');
      const before = look();
      const open0 = window.__opened || 0;
      el.click();
      await new Promise(res => setTimeout(res, 300));
      return { changed: look() !== before };
    }, { sel: CLICKABLE, i: c.i }).catch(e => ({ err: e.message }));
    if (r.err) { broke.push({ screen: name, ...c, err: r.err }); continue; }
    if (r.gone) continue;
    const raised = errs.slice(e0);
    if (raised.length) broke.push({ screen: name, ...c, err: raised.join(' | ').slice(0, 300) });
    if (!r.changed && dialogs === d0 && downloads === dl0) { dead.push({ screen: name, ...c }); perScreen[name].dead++; }
  }
}
await browser.close();
const out = { file: path.relative(root, file), unhandled, dead, broke, perScreen };
if (opt('json')) fs.writeFileSync(path.resolve(root, opt('json')), JSON.stringify(out, null, 1));
console.log(`actions with no handler: ${unhandled.length ? unhandled.join(', ') : 'none'}`);
for (const [k, v] of Object.entries(perScreen)) console.log(`${k.padEnd(12)} ${String(v.controls).padStart(4)} controls, ${v.dead} dead`);
for (const d of dead) console.log(`DEAD  ${d.screen.padEnd(11)} ${d.tag}${d.a ? ' data-a=' + d.a : ''}${d.v ? ' v=' + d.v : ''}  "${d.text}"`);
for (const d of broke) console.log(`ERROR ${d.screen.padEnd(11)} ${d.tag}${d.a ? ' data-a=' + d.a : ''}  "${d.text}": ${d.err}`);
process.exit(dead.length || broke.length || unhandled.length ? 1 : 0);
