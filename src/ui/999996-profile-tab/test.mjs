// 999996-profile-tab: the Profile page (work item P, D-038). It is the first page of the You place; draws the standing
// figure, the card, the body and mind in words on a scale of seven and folded sections; every number on it explains
// itself on a press; no percentages; drawing is pure and escapes what it is given; it fits a laptop and a phone; the
// figure is the same every time; an old save draws it; the posts a life leaves are kept; and it grows (a new stat row, a
// new section).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OLD_SAVE = path.join(root, 'tests/saves/v2-cycle2-1106.ardan');

const LIVES = [
  { seed: 4101, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 },
  { seed: 4102, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 28 },
  { seed: 4103, race: 'human', realm: 'POL-01', status: 'royal', sex: 'F', startAge: 34 },
  { seed: 4104, race: 'orc', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 12 },
];
const START = `(o => { A.newGame(o); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.ov = null; UI.tab = 'profile'; UI.render(); })`;
// numbers on the page: elements whose own text holds a digit; covered when they or an ancestor open a description
const COUNT = () => {
  const root = document.querySelector('.pf'); const out = { n: 0, covered: 0, miss: [], pct: 0 };
  if (!root) return out;
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('svg') || el.closest('[hidden]')) continue;
    const own = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent).join('');
    if (/\d\s?%/.test(own)) out.pct++;
    if (!/\d/.test(own)) continue;
    out.n++;
    if (el.closest('[data-tt],[data-tip],[title],[aria-description]')) out.covered++; else out.miss.push(own.trim().slice(0, 30));
  }
  return out;
};

export default {
  // the page is the first of the You place, on a laptop and on a phone, with the figure, the card, six stats and three vitals
  async pfPlace(pg) {
    const r = await pg.evaluate(`(async () => { const out = {}; for (const o of ${JSON.stringify(LIVES.slice(0, 3))}) {
      (${START})(o);
      const g = UI.GROUPS.find(x => x.k === 'you'), subs = UI.subsOf(g).map(s => s[0]);
      const hero = !!document.querySelector('.pf .pf-fig svg.portrait.full, .pf .pf-fig svg'), name = (document.querySelector('.pf .pf-name') || {}).textContent;
      const rows = document.querySelectorAll('.pf .pf-stat').length, vit = document.querySelectorAll('.pf .pf-vital').length, ms = document.querySelectorAll('.pf .pf-m').length;
      const tab = document.querySelector('#sub-profile'), on = tab && tab.getAttribute('aria-selected') === 'true';
      // the rail's button opens the page from another place; the old overlay still opens
      UI.tab = 'life'; UI.render(); const btn = document.querySelector('#profile button[data-v="profile"]'); const btnOk = !!btn && btn.dataset.a === 'tab';
      if (btn) btn.click();
      const opened = UI.tab === 'profile' && !!document.querySelector('.pf');
      UI.A.ov('profile'); const modal = !!document.querySelector('#modal .mbox'); UI.ov = null; UI.render();
      (out[o.status] = { subs, hero, name, rows, vit, ms, on, btnOk, opened, modal, group: UI.groupOf('profile').k });
    } return out; })()`);
    const all = Object.values(r);
    const ok = all.length === 3 && all.every(x => x.subs[0] === 'profile' && x.hero && x.name && x.rows >= 6 && x.vit === 3 && x.ms >= 4 && x.on && x.btnOk && x.opened && x.modal && x.group === 'you');
    return { ok, detail: Object.entries(r).map(([k, x]) => `${k}: first page of ${x.group} (${x.subs.join(', ')}), ${x.rows} stat rows, ${x.vit} vitals, ${x.ms} measures, rail button opens it ${x.opened}, old overlay ${x.modal}`).join('; ') };
  },

  // the phone: the page leads the You place and the old glance stays beside it
  async pfPhone(pg) {
    await pg.setViewportSize({ width: 420, height: 860 });
    const r = await pg.evaluate(`(async () => { (${START})(${JSON.stringify(LIVES[1])}); const g = UI.GROUPS.find(x => x.k === 'you'), subs = UI.subsOf(g).map(s => s.join(':'));
      UI.tab = 'you'; UI.render(); const glance = !!document.querySelector('.phone-profile'); UI.tab = 'profile'; UI.render(); return { subs, glance, phone: UI.isPhone() }; })()`);
    const ok = r.phone && r.subs[0].startsWith('profile') && r.subs.some(s => s.startsWith('you')) && r.glance;
    return { ok, detail: `phone You place pages: ${r.subs.join(', ')}; the glance page still draws the old sheet: ${r.glance}` };
  },

  // drawing, with every section open, writes nothing to the game and draws no random number; twice gives the same markup
  async pfPure(pg) {
    const r = await pg.evaluate(`(() => { const out = []; for (const o of ${JSON.stringify(LIVES)}) {
      T.enter(o); T.play(2); UI.tab = 'profile'; UI.PF.forceOpen = true;
      const rng = A.rngState, h0 = T.hash(A.S);
      UI.render(); const a = document.querySelector('.pf').innerHTML.replace(/ id="[^"]*"/g, ''); UI.render(); const b = document.querySelector('.pf').innerHTML.replace(/ id="[^"]*"/g, '');
      const text = document.querySelector('.pf').innerText;
      UI.PF.forceOpen = false;
      out.push({ who: o.status, rngMoved: A.rngState !== rng, stateChanged: T.hash(A.S) !== h0, same: a === b, len: a.length, sections: document.querySelectorAll('.pf-sec').length });
    } return out; })()`);
    return { ok: r.every(x => !x.rngMoved && !x.stateChanged && x.same && x.len > 3000 && x.sections >= 8), detail: r.map(x => `${x.who}: random stream moved ${x.rngMoved}; state changed ${x.stateChanged}; same markup twice ${x.same}`).join('; ') };
  },

  // what a person is called, and what they carry, never reaches the page as markup
  async pfEscaped(pg, errs) {
    const r = await pg.evaluate(`(() => { (${START})(${JSON.stringify(LIVES[1])});
      const X = '<img src=x onerror=window.PFX=1>', pc = A.pc(), h = A.house(pc.house);
      pc.given = X; pc.sur = X; pc.epithet = X; if (h) { h.name = X; h.words = X; h.arms = X; h.seat = X; }
      pc.named = { blade: { n: X, y: A.S.year - 2, deeds: [] } }; pc.heirlooms = [{ n: X, from: X, y: 1100 }]; pc.deeds = [{ y: A.S.year, t: X }];
      pc.pf = { cur: { 'job:x:1': { t: X, k: 'Trade', y: 1100 } }, past: [{ t: X, k: X, y0: 1100, y1: 1101 }] };
      pc.langs = [X]; for (const q of Object.values(A.S.people)) if (q.id !== pc.id) { q.given = X; q.sur = X; }
      UI.PF.forceOpen = true; UI.render(); const root = document.querySelector('.pf'); const imgs = root.querySelectorAll('img[src="x"]').length, scripts = root.querySelectorAll('script').length;
      const raw = root.innerHTML.includes(X); const shown = root.innerText.includes('<img'); UI.PF.forceOpen = false; return { imgs, scripts, raw, shown, ran: !!window.PFX }; })()`);
    return { ok: !r.imgs && !r.scripts && !r.raw && r.shown && !r.ran, detail: `injected markup in names, house, motto, deeds, heirlooms and posts: ${r.imgs} real images made, markup left raw ${r.raw}, shown as plain text ${r.shown}, script ran ${r.ran}` };
  },

  // every number explains itself on a press (B4), and there are no percentages for the player
  async pfNumbers(pg) {
    const r = await pg.evaluate(`(() => { const out = []; const count = ${COUNT.toString()};
      for (const o of ${JSON.stringify(LIVES)}) { T.enter(o); T.play(3); UI.tab = 'profile'; UI.PF.forceOpen = true; UI.render();
        const c = count(); // a second look with the deeds and heirlooms a late life holds
        const pc = A.pc(); pc.heirlooms = [{ n: 'The Grey Cup', from: 'your grandfather', y: 1100 }]; pc.deeds = (pc.deeds || []).concat([{ y: A.S.year - 3, t: 'Held the ford for 3 days against 40 riders' }]); UI.render(); const d = count();
        UI.PF.forceOpen = false; out.push({ who: o.status, n: c.n, covered: c.covered, miss: c.miss.concat(d.miss), pct: c.pct + d.pct, hover: document.querySelectorAll('.pf [onmouseover],.pf [onmouseenter]').length, title: document.querySelectorAll('.pf [title]').length }); }
      return out; })()`);
    const ok = r.every(x => x.miss.length === 0 && x.pct === 0 && x.hover === 0 && x.n >= 3);
    return { ok, detail: r.map(x => `${x.who}: ${x.covered} of ${x.n} numbers carry a description${x.miss.length ? ', missing ' + x.miss.slice(0, 4).join(' | ') : ''}; percentages ${x.pct}`).join('; ') };
  },

  // a press on a measure, a stat row, a skill and a section opens a description or the section; nothing opens by hover
  async pfClicks(pg) {
    await pg.setViewportSize({ width: 1366, height: 768 });
    await pg.evaluate(`(${START})(${JSON.stringify(LIVES[1])})`);
    await pg.evaluate(() => UI.FIG.idle());
    await pg.hover('.pf .pf-stat'); const hov = await pg.evaluate(() => UI.TT.depth());
    await pg.click('.pf .pf-stat'); const stat = await pg.evaluate(() => UI.TT.depth()); await pg.keyboard.press('Escape');
    await pg.click('.pf .pf-m dd .tt'); const meas = await pg.evaluate(() => UI.TT.depth()); await pg.keyboard.press('Escape');
    await pg.click('.pf-fold[data-v="skills"]');
    const skills = await pg.evaluate(() => ({ open: document.querySelector('.pf-fold[data-v="skills"]').getAttribute('aria-expanded'), rows: document.querySelectorAll('.pf-sk').length, hidden: document.querySelector('#pf-b-skills').hidden }));
    await pg.click('.pf-sk .tt'); const sk = await pg.evaluate(() => UI.TT.depth()); await pg.keyboard.press('Escape');
    // the open section survives a redraw (a month), and a second press folds it
    await pg.evaluate(() => UI.render()); const kept = await pg.evaluate(() => document.querySelector('.pf-fold[data-v="skills"]').getAttribute('aria-expanded'));
    await pg.click('.pf-fold[data-v="skills"]'); const shut = await pg.evaluate(() => ({ ex: document.querySelector('.pf-fold[data-v="skills"]').getAttribute('aria-expanded'), hidden: document.querySelector('#pf-b-skills').hidden, empty: document.querySelector('#pf-b-skills').innerHTML === '' }));
    const ok = hov === 0 && stat === 1 && meas === 1 && skills.open === 'true' && skills.rows >= 1 && !skills.hidden && sk === 1 && kept === 'true' && shut.ex === 'false' && shut.hidden && shut.empty;
    return { ok, detail: `hover opens ${hov}; a stat row opens ${stat}; a measure ${meas}; a skill ${sk}; the Skills section opens with ${skills.rows} rows, stays open through a redraw (${kept}) and folds again (${shut.ex})` };
  },

  // it fits a laptop's 1366 x 768 (D-033's budgets: no more words and controls than B5 holds every page to; at most three screens even with every section open)
  // and a phone's 420 and 360 with no sideways scroll
  async pfFits(pg) {
    const BUDGET = { desk: { all: { words: 270, controls: 50 }, page: { words: 230, controls: 40 }, screens: 3 }, phone: { all: { words: 200, controls: 40 }, page: { words: 150, controls: 30 }, screens: 3 } };
    const probe = (await import('../../../tools/lib/clutter.mjs'));
    const out = [];
    for (const [vw, vh, kind] of [[1366, 768, 'desk'], [420, 900, 'phone'], [360, 740, 'phone']]) {
      await pg.setViewportSize({ width: vw, height: vh });
      for (const o of LIVES) {
        await pg.evaluate(`(${START})(${JSON.stringify(o)})`); await pg.evaluate(() => UI.FIG.idle());
        await pg.evaluate(probe.SETTLE);
        const m = await pg.evaluate(probe.PROBE);
        const zone = m.zones[kind === 'desk' ? 'side' : 'phone-profile'] || m.zones.side || { words: 0, controls: 0 };
        // every section open: still on screens and nothing wider than the window
        await pg.evaluate(() => { UI.PF.forceOpen = true; UI.render(); }); await pg.evaluate(probe.SETTLE);
        const full = await pg.evaluate(probe.PROBE); await pg.evaluate(() => { UI.PF.forceOpen = false; UI.render(); });
        const B = BUDGET[kind];
        out.push({ vw, who: o.status + '/' + o.race, words: m.words, controls: m.controls, page: zone, screens: m.screens, openScreens: full.screens, hscroll: Math.max(m.hscroll, full.hscroll), out: full.nOut,
          ok: m.words <= B.all.words && m.controls <= B.all.controls && zone.words <= B.page.words && zone.controls <= B.page.controls && m.screens <= B.screens && full.screens <= 6 && m.hscroll === 0 && full.hscroll === 0 && full.nOut === 0 });
      }
    }
    return { ok: out.every(x => x.ok), detail: out.map(x => `${x.vw} ${x.who}: ${x.words} words, ${x.controls} controls (page ${x.page.words}/${x.page.controls}), ${x.screens} screens (${x.openScreens} all open), sideways ${x.hscroll}${x.ok ? '' : ' FAIL'}`).join('; ') };
  },

  // the same life draws the same figure, and the figure shown is the one the library draws for the whole person
  async pfFigureSame(pg) {
    const r = await pg.evaluate(`(async () => { const out = []; const strip = s => s.replace(/ id="[^"]*"/g, '').replace(/data-fg="[^"]*"/g, '').replace(/[fi][0-9a-z]+_[0-9a-z]*/g, 'ID');
      for (const o of ${JSON.stringify(LIVES)}) { (${START})(o); const a = document.querySelector('.pf-fig').innerHTML; const ka = A.V2.figure.lookKey(UI.FIG.look(A.pc()));
        (${START})(o); const b = document.querySelector('.pf-fig').innerHTML; const kb = A.V2.figure.lookKey(UI.FIG.look(A.pc()));
        const whole = UI.FIG.inline(A.pc(), 168, { figure: true }); const again = UI.FIG.inline(A.pc(), 168, { figure: true });
        const svg = document.querySelector('.pf-fig svg'); const vb = svg && svg.getAttribute('viewBox');
        out.push({ who: o.status, same: strip(a) === strip(b), key: ka === kb, whole: whole === again && whole.length > 5000, tall: vb === '0 0 100 200', label: !!(svg && svg.getAttribute('aria-label')) }); }
      await UI.FIG.idle(); return out; })()`);
    return { ok: r.every(x => x.same && x.key && x.whole && x.tall && x.label), detail: r.map(x => `${x.who}: same frame ${x.same}, same look ${x.key}, whole figure drawn alike twice ${x.whole}, one by two ${x.tall}, named ${x.label}`).join('; ') };
  },

  // an old save draws the page (no pf record, no faces from the start) and starts its record the next month
  async pfOldSave(pg) {
    if (!fs.existsSync(OLD_SAVE)) return { ok: true, skip: 'tests/saves/v2-cycle2-1106.ardan is not here' };
    const b64 = fs.readFileSync(OLD_SAVE).toString('base64');
    const r = await pg.evaluate(async b64 => {
      const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const d = await SAVES.decode(bytes); UI.enterSaveSafe(d); A.S.queue = []; UI.set.hints = false;
      const had = !!A.pc().pf; UI.tab = 'profile'; UI.ov = null; UI.PF.forceOpen = true; UI.render(); await UI.FIG.idle();
      const html = document.querySelector('.pf') && document.querySelector('.pf').innerText; UI.PF.forceOpen = false;
      const name = A.fullName(A.pc());
      T.play(1); UI.render(); const has = !!A.pc().pf && !!A.pc().pf.cur;
      return { had, drew: !!html && html.toLowerCase().includes(A.pc().given.toLowerCase()), fe: UI.FIG.lastError, len: (html || '').length, has, name, errors: UI.FIG.errors };
    }, b64);
    return { ok: !r.had && r.drew && r.len > 400 && r.has && r.errors === 0, detail: `${r.name}: no record before (${!r.had}), page drawn with ${r.len} characters (names them ${r.drew}), the record begins after a year (${r.has}); figure faults ${r.errors} ${r.fe || ''}` };
  },

  // the posts held and left: one holder, a post that goes is written to the past with its years
  async pfPosts(pg) {
    const r = await pg.evaluate(`(() => { T.enter(${JSON.stringify(LIVES[1])}); const pc = A.pc(); const PF = UI.PF;
      PF.sync(pc); const first = Object.keys(pc.pf.cur); const had = PF.heldNow(pc).map(x => x.label);
      const old = pc.job; pc.job = null; A.S.year += 2; PF.sync(pc);
      const past = PF.pastPosts(pc); const gone = !Object.keys(pc.pf.cur).some(k => k.startsWith('job:'));
      pc.job = old; PF.sync(pc);
      // one holder: no two posts of a kind share a key
      const keys = PF.heldNow(pc).map(x => x.key), dup = keys.length !== new Set(keys).size;
      UI.PF.forceOpen = true; UI.tab = 'profile'; UI.render(); const text = document.querySelector('#pf-b-posts').innerText; UI.PF.forceOpen = false;
      return { first: first.length, had, past: past.map(x => x.t + ' ' + x.y0 + '-' + x.y1), gone, dup, shows: /held before/i.test(text) && past.length > 0 && text.includes(past[0].t) }; })()`);
    return { ok: r.first >= 1 && r.past.length === 1 && r.gone && !r.dup && r.shows, detail: `held: ${r.had.join(', ')}; after leaving the trade the past list reads: ${r.past.join(', ')}; the page shows it ${r.shows}` };
  },

  // the page grows: a new stat row and a new section (G, E2) appear with no change to the layout code
  async pfGrows(pg) {
    const r = await pg.evaluate(`(() => { (${START})(${JSON.stringify(LIVES[1])}); const PF = UI.PF; const rows0 = document.querySelectorAll('.pf-stat').length, secs0 = document.querySelectorAll('.pf-sec').length;
      PF.addStat({ k: 'cha', label: 'Charm', group: 'Mind', read: () => ({ word: 'fine', at: 4, pot: 5, tip: ['note', 'How well you are liked.'] }) });
      PF.addSection({ k: 'testsec', title: 'A new part', sum: () => 'something new', body: () => '<p>New</p>' });
      PF.open.testsec = true; UI.render(); const rows1 = document.querySelectorAll('.pf-stat').length, secs1 = document.querySelectorAll('.pf-sec').length, shown = !!document.querySelector('#pf-b-testsec p');
      const dup = PF.addStat({ k: 'cha', label: 'X', read: () => null }) || PF.addSection({ k: 'testsec', title: 'Y', body: () => '' });
      PF.STATS.pop(); PF.SECTIONS.pop(); delete PF.open.testsec; UI.render(); return { rows0, rows1, secs0, secs1, shown, dup }; })()`);
    return { ok: r.rows1 === r.rows0 + 1 && r.secs1 === r.secs0 + 1 && r.shown && !r.dup, detail: `stat rows ${r.rows0} to ${r.rows1}, sections ${r.secs0} to ${r.secs1}, the new section's body drawn ${r.shown}, a repeated key is refused ${!r.dup}` };
  },

  // the wording: a child, an old person and a dead-young life draw without a fault and with no stat rows of numbers
  async pfEveryAge(pg) {
    const r = await pg.evaluate(`(() => { const out = []; for (const age of [1, 4, 9, 15, 30, 60, 90]) { T.enter({ seed: 4200 + age, race: 'human', realm: 'POL-01', status: 'peasant', sex: age % 2 ? 'F' : 'M', startAge: age });
      UI.tab = 'profile'; UI.PF.forceOpen = true; let err = null; try { UI.render(); } catch (e) { err = String(e); } UI.PF.forceOpen = false;
      const t = (document.querySelector('.pf') || { innerText: '' }).innerText; out.push({ age: A.age(A.pc()), err, name: !!document.querySelector('.pf-name'), about: !!document.querySelector('.pf-about') && document.querySelector('.pf-about').textContent.length > 8, bad: /undefined|NaN|\\[object/.test(t) }); } return out; })()`);
    return { ok: r.every(x => !x.err && x.name && x.about && !x.bad), detail: r.map(x => `age ${x.age}: ${x.err || (x.bad ? 'BAD WORD' : 'drawn')}`).join('; ') };
  },
};
