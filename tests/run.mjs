// Browser tests for the built game.
//   node tests/run.mjs                  test index.html
//   node tests/run.mjs vendor/ardan-b593143.html   test another build (e.g. the original)
//   node tests/run.mjs --only=xss,tokens --lives=12
// Needs Playwright with Chromium (npm i). Exits non-zero if any test fails.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright'); }

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const file = path.resolve(root, args.find(a => !a.startsWith('--')) || 'index.html');
const only = opt('only') ? opt('only').split(',') : null;
const LIVES = +(opt('lives') || 6);

// shared in-page helpers, installed before each test
const HELPERS = () => {
  window.T = {
    play(years, opts = {}) {
      const end = A.S.year + years;
      for (let guard = 0; guard < 5000 && A.S.year < end; guard++) {
        const r = A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) {
          if (h.type === 'event') { opts.onEvent && opts.onEvent(A.eventView(h)); A.eventAuto(); }
          else A.S.queue.shift();
        }
        opts.each && opts.each();
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) return 'dead';
      }
      return 'ok';
    },
    canon(v) { return v && typeof v === 'object' ? (Array.isArray(v) ? v.map(T.canon) : Object.keys(v).sort().reduce((o, k) => (o[k] = T.canon(v[k]), o), {})) : v; },
    hash(s) { s = typeof s === 'string' ? s : JSON.stringify(T.canon(s)); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; },
    tabs() { return UI.GROUPS.flatMap(g => g.subs.map(s => s[0])); },
    enter(o) { A.newGame(o); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); },
    renderAll() {
      for (const t of T.tabs()) { UI.tab = t; UI.render(); }
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc).slice(0, 12);
      for (const p of ppl) { try { UI.A.ov && UI.A.ov(p.id); } catch (e) {} }
      UI.ov = null; UI.tab = 'life'; UI.render();
    },
    raw: /\{[A-Za-z0-9_.]+\}/,
  };
};

const TESTS = {
  async boot(pg, errs) {
    const r = await pg.evaluate(() => ({ events: Object.keys(A.EV).length, build: window.ARDAN_BUILD }));
    return { ok: r.events >= 3199 && errs.length === 0, detail: `${r.events} events, build ${r.build}, ${errs.length} page errors` };
  },

  async lives(pg, errs) {
    const r = await pg.evaluate(async (N) => {
      const mixes = [['human', 'POL-01', 'peasant'], ['human', 'POL-01', 'noble'], ['elf', 'POL-03', 'peasant'], ['dwarf', 'POL-20', 'artisan'],
        ['orc', 'POL-11', 'peasant'], ['human', 'POL-05', 'merchant'], ['human', 'POL-07', 'serf'], ['human', 'POL-02', 'royal']];
      const out = { lives: [], rawViews: [], rawLog: [] };
      for (let i = 0; i < N; i++) {
        const [race, realm, status] = mixes[i % mixes.length];
        A.newGame({ seed: 1000 + i * 7919, race, realm, status, sex: i % 2 ? 'F' : 'M' });
        let err = null;
        try {
          T.play(110, { onEvent: v => { const s = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | '); if (!v.skip && T.raw.test(s)) out.rawViews.push(s.slice(0, 160)); } });
        } catch (e) { err = String(e.stack || e).slice(0, 300); }
        for (const e of A.S.log) for (const l of e.lines) { const t = Array.isArray(l) ? l[0] : l; if (typeof t === 'string' && T.raw.test(t)) out.rawLog.push(t.slice(0, 160)); }
        const p = A.P(A.S.pc);
        out.lives.push({ race, status, age: A.S.year - p.born, alive: p.alive, err });
      }
      return out;
    }, LIVES);
    const bad = r.lives.filter(l => l.err);
    return {
      ok: !bad.length && !errs.length && !r.rawViews.length && !r.rawLog.length,
      detail: `${r.lives.length} lives, ${bad.length} crashed, ${r.rawViews.length} event views and ${r.rawLog.length} log lines with unfilled {tokens}` +
        (bad.length ? '\n    ' + bad[0].err : '') + (r.rawViews.length ? '\n    e.g. ' + r.rawViews[0] : '') + (r.rawLog.length ? '\n    e.g. ' + r.rawLog[0] : ''),
    };
  },

  async tokens(pg) {
    // render every event's text and choices once, under a few different characters
    const r = await pg.evaluate(() => {
      const bad = new Map();
      for (const o of [{ race: 'human', realm: 'POL-01', status: 'noble', startAge: 30 }, { race: 'orc', realm: 'POL-11', status: 'peasant', startAge: 25 }, { race: 'human', realm: 'POL-05', status: 'merchant', startAge: 12 }]) {
        A.newGame(Object.assign({ seed: 99 }, o));
        for (const id of Object.keys(A.EV)) {
          let v; try { v = A.eventView({ type: 'event', ev: id }); } catch { continue; }
          if (!v || v.skip) continue; // the game drops these itself
          const s = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
          if (/\{[A-Za-z0-9_.]+\}/.test(s)) bad.set(id, s.match(/\{[A-Za-z0-9_.]+\}/)[0]);
        }
      }
      return [...bad].slice(0, 400);
    });
    return { ok: r.length === 0, detail: `${r.length} events would show an unfilled {token}` + (r.length ? ': ' + r.slice(0, 8).map(([i, t]) => `${i} ${t}`).join(', ') : '') };
  },

  async renderRng(pg) {
    // drawing the screen must never touch the game's random stream
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      T.play(3);
      const before = A.rngState, h0 = T.hash(A.S);
      T.renderAll();
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.id !== A.S.pc);
      for (const p of ppl.slice(0, 60)) { A.fightWorth(p); UI.tierChip && UI.tierChip(p); }
      return { rngMoved: A.rngState !== before, stateChanged: T.hash(A.S) !== h0 };
    });
    return { ok: !r.rngMoved, detail: `random stream moved by rendering: ${r.rngMoved}; state changed by rendering: ${r.stateChanged}` };
  },

  async replayWithRender(pg) {
    // the same seed and choices must reach the same world whether or not the player looked at people
    const r = await pg.evaluate(() => {
      const run = (look) => {
        T.enter({ seed: 777, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 18 });
        T.play(6, { each: () => { if (look) T.renderAll(); } });
        T.renderAll(); // both runs draw once at the end, so harmless first-draw setup (an empty cargo hold) matches
        return T.hash(A.S.people) + ':' + T.hash(A.S.realms) + ':' + A.rngState;
      };
      return { a: run(false), b: run(true) };
    });
    return { ok: r.a === r.b, detail: r.a === r.b ? 'same world' : `worlds differ (${r.a} vs ${r.b})` };
  },

  async journalReplay(pg) {
    // the game's own replay (what problem reports use) must reach the same world even if the player looked around
    const r = await pg.evaluate(() => {
      A.J = null; A.journalStart();
      T.enter({ seed: 31337, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 17 });
      const end = A.S.year + 4;
      for (let k = 0; k < 3000 && A.S.year < end && A.pc().alive; k++) {
        A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
        T.renderAll();
      }
      const want = T.hash(JSON.parse(A.serialize())), J = JSON.parse(JSON.stringify(A.J));
      const res = A.replay(J);
      T.renderAll(); // the original run ended with a draw too
      const same = T.hash(JSON.parse(A.serialize())) === want;
      // a journal without a game start, saved and loaded: its base must be the state it can replay from
      A.journalResume(null); T.play(1);
      const d = { S: JSON.parse(A.serialize()), J: JSON.parse(JSON.stringify(A.J)) };
      T.play(1); A.deserialize(d.S); A.journalResume(d.J);
      const baseOk = !!(A.J.o || A.J.base === A.fingerprint(A.jBase));
      return { ok: res.ok, why: res.why, at: res.at, steps: J.e.length, same, baseOk };
    });
    return { ok: r.ok && r.same && r.baseOk, detail: (r.ok ? `${r.steps} journal entries replayed, world ${r.same ? 'identical' : 'DIFFERENT'}` : `replay stopped at entry ${r.at}: ${r.why}`) + `; reloaded journal's base matches: ${r.baseOk}` };
  },

  async engineRules(pg) {
    // small rule checks for fixed engine bugs
    const r = await pg.evaluate(() => {
      const out = {};
      A.newGame({ seed: 8, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' });
      // opposite traits never inherited together
      let both = 0;
      const pa = { traits: ['brave', 'cruel', 'honest'] }, pb = { traits: ['craven', 'kind', 'deceitful'] };
      for (let i = 0; i < 4000; i++) { const t = A.randomTraits([pa, pb]); if (t.some(x => GD.TRAITS[x] && t.includes(GD.TRAITS[x].opp))) both++; }
      out.oppositeTraits = both;
      // the automatic training plan follows the life; a player's choice sticks
      const pc = A.pc(), P = A.plan(pc);
      pc.born = A.S.year - 8; P.train = null; P.trainAuto = undefined; A.defaultPlanIfAuto(pc); const kid = P.train;
      pc.born = A.S.year - 20; pc.mil = { troop: Object.keys(GD.TROOP_SKILL)[0], rank: 0, squad: [] }; A.defaultPlanIfAuto(pc); const soldier = P.train;
      A.setPlan('train', 'learning'); A.defaultPlanIfAuto(pc); const chosen = P.train;
      pc.mil = null;
      out.plan = [kid, soldier, chosen];
      // a newborn noble cannot work the court
      A.newGame({ seed: 12, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 0 });
      A.S.time = 10; const t0 = A.S.time; const res = A.nobleAction('court');
      out.babyCourt = !!(res && res.ok) || A.S.time !== t0;
      return out;
    });
    const planOk = r.plan[0] === 'athletics' && r.plan[1] !== 'athletics' && r.plan[2] === 'learning';
    return { ok: r.oppositeTraits === 0 && planOk && !r.babyCourt, detail: `children with opposite traits: ${r.oppositeTraits}/4000; plan kid→soldier→player pick: ${r.plan.join(' → ')}; newborn can attend court: ${r.babyCourt}` };
  },

  async world(pg) {
    // 40 years of world: stability never negative; report debt and hoarding
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 2024, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
      const live = () => Object.values(A.S.realms).filter(x => x.alive);
      const debt0 = live().reduce((a, x) => a + (x.debt || 0), 0);
      let minStab = 100, negAt = null;
      const end = A.S.year + 40;
      for (let k = 0; k < 20000 && A.S.year < end; k++) {
        A.advance(30);
        let h, g = 0; while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.S.queue.shift(); }
        for (const x of live()) if (x.stability < minStab) { minStab = x.stability; if (x.stability < 0 && !negAt) negAt = `${x.short} ${x.stability} in ${A.S.year}`; }
        if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && p.realm === 'POL-01'); if (!kid) break; A.S.pc = kid.id; }
      }
      const L = live();
      return { years: A.S.year - (end - 40), minStab: Math.round(minStab * 10) / 10, negAt, realms: L.length,
        debtors: L.filter(x => x.debt > 0).length, debt0: Math.round(debt0), debt1: Math.round(L.reduce((a, x) => a + (x.debt || 0), 0)),
        hoard: L.filter(x => x.income > 0 && x.treasury > x.income * 6).length };
    });
    return { ok: r.minStab >= 0 && (r.debt0 === 0 || r.debt1 < r.debt0), detail: `${r.years} years: lowest stability ${r.minStab}${r.negAt ? ' (first negative: ' + r.negAt + ')' : ''}; ${r.debtors}/${r.realms} realms in debt, total debt ${r.debt0} → ${r.debt1}; ${r.hoard} realms over 6 years of income` };
  },

  async economy(pg) {
    // no buy-then-sell-back loop may make money, in the thinnest market, for a master trader
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 3, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'F', startAge: 30 });
      const pc = A.pc();
      const thin = Object.values(A.S.realms).filter(x => x.alive && A.mkt(x.id)).sort((a, b) => A.mktDepth(a.id) - A.mktDepth(b.id))[0];
      pc.realm = thin.id; pc.home = (A.S.prov.find(p => p.owner === thin.id) || {}).id ?? pc.home;
      pc.skills.trade = 100; pc.coin = 1e7;
      const rid = A.homeMkt(pc), goods = Object.keys(GD.GOODS);
      let best = { k: null, profit: -Infinity };
      for (const k of goods) {
        if (!A.mkt(rid).p[k]) continue;
        const c0 = pc.coin;
        for (let i = 0; i < 20; i++) { A.buyGood(k, 1); A.sellGood(k, 1); }
        const profit = pc.coin - c0;
        if (profit > best.profit) best = { k, profit };
      }
      return { market: thin.short, depth: Math.round(A.mktDepth(rid) * 10) / 10, spread: A.spread(pc), best };
    });
    return { ok: r.best.profit <= 0, detail: `${r.market} market (depth ${r.depth}), trade 100: best 20x buy+sell loop ${r.best.profit >= 0 ? '+' : ''}${Math.round(r.best.profit)} suns (${r.best.k})` };
  },

  async saveRoundTrip(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 5, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M' });
      T.play(8);
      const enc = await SAVES.encode(A.S, A.J);
      const a = JSON.stringify(A.packState ? A.packState(A.S) : A.S);
      const d = await SAVES.decode(enc.bytes);
      const b = JSON.stringify(A.packState ? A.packState(d.S) : d.S);
      return { same: a === b, kb: Math.round(enc.bytes.length / 1024) };
    });
    return { ok: r.same, detail: `round trip ${r.same ? 'exact' : 'DIFFERS'}, ${r.kb} KB gzipped after 8 years` };
  },

  async xssSave(pg) {
    // a hand-edited save must not be able to run script
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M' });
      T.play(1);
      const d = await SAVES.decode((await SAVES.encode(A.S, A.J)).bytes);
      const S2 = d.S, pay = n => `x"><img src=x data-pwn onerror="window.__pwned=(window.__pwned||0)+1;/*${n}*/">`;
      S2.log[S2.log.length - 1].lines.push(['harmless', pay('logclass'), null]);
      S2.log[S2.log.length - 1].year = pay('logyear');
      const r0 = Object.values(S2.realms)[0]; r0.color = `#fff;" data-x="${pay('color')}`;
      window.__pwned = 0;
      try { await UI.loadGame((await SAVES.encode(S2, null)).bytes); } catch (e) {}
      for (const t of T.tabs()) { UI.tab = t; try { UI.render(); } catch (e) {} }
      await new Promise(res => setTimeout(res, 800));
      return { pwned: window.__pwned, injected: document.querySelectorAll('img[data-pwn]').length, screen: UI.screen };
    });
    return { ok: !r.pwned && !r.injected, detail: `script ran ${r.pwned}x, ${r.injected} injected elements, screen ${r.screen}` };
  },

  async uiSmoke(pg, errs) {
    // click through the real interface like a player: new life, every tab, a person, the menu, export, the clock
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); });
    await pg.click('text=Random life');
    await pg.waitForTimeout(500);
    const seen = [];
    const tabs = await pg.$$eval('#tabs [data-a="tab"], #tabs [role="tab"]', els => els.map(e => e.getAttribute('data-v')).filter(Boolean));
    for (const t of [...new Set(tabs)]) {
      await pg.click(`#tabs [data-v="${t}"]`).catch(() => {});
      await pg.waitForTimeout(150);
      const subs = await pg.$$eval('#tabs [data-a="tab"]', els => els.map(e => e.getAttribute('data-v')));
      for (const s of subs) { await pg.click(`#tabs [data-a="tab"][data-v="${s}"]`).catch(() => {}); await pg.waitForTimeout(120); seen.push(s); }
    }
    const person = await pg.$('[data-a="ov"]');
    if (person) { await person.click().catch(() => {}); await pg.waitForTimeout(200); await pg.keyboard.press('Escape'); }
    await pg.click('button:has-text("Play")');
    await pg.waitForTimeout(3000);
    await pg.click('button:has-text("Pause")').catch(() => pg.click('button:has-text("Play")').catch(() => {}));
    await pg.click('button:has-text("Menu")');
    await pg.waitForTimeout(200);
    const exp = await pg.$('button:has-text("Export"), button:has-text("Save to file"), button:has-text("Download")');
    let download = false;
    if (exp) {
      const dl = pg.waitForEvent('download', { timeout: 8000 }).then(() => true).catch(() => false);
      await exp.click();
      download = await dl;
    }
    await pg.keyboard.press('Escape');
    const st = await pg.evaluate(() => ({ screen: UI.screen, year: A.S.year, fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i) }));
    return { ok: st.screen === 'game' && (!exp || download), detail: `${new Set(seen).size} tabs visited, export ${exp ? (download ? 'downloaded' : 'FAILED') : 'button not found'}, fonts loaded: ${st.fonts.join(', ') || 'none (offline?)'}` };
  },

  async keyboard(pg) {
    // every clickable thing is reachable by keyboard, Enter opens it, and focus survives the running clock
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); });
    await pg.click('text=Random life');
    await pg.waitForTimeout(300);
    await pg.evaluate(() => { UI.tab = 'people'; UI.refresh(); });
    await pg.waitForTimeout(100);
    const unreachable = await pg.$$eval('#app [data-a]:not(button):not(a):not(input):not(select):not(textarea):not(option)', els => els.filter(e => !e.hasAttribute('tabindex')).length);
    const card = await pg.$('#tabbody [data-a="ov"]');
    let opened = false;
    if (card) { await card.focus(); await pg.keyboard.press('Enter'); await pg.waitForTimeout(200); opened = await pg.evaluate(() => !!(UI.ov && document.querySelector('#modal'))); await pg.keyboard.press('Escape'); }
    // focus a control in the tab body, run the clock past several redraws, see where focus is
    await pg.evaluate(() => { UI.tab = 'life'; UI.refresh(); });
    const btn = await pg.$('#tabbody button');
    let kept = null;
    if (btn) {
      const key = await btn.evaluate(b => b.getAttribute('data-a') + '|' + b.getAttribute('data-v'));
      await btn.focus();
      await pg.evaluate(() => UI.clkToggle && UI.clkToggle());
      await pg.waitForTimeout(4000);
      await pg.evaluate(() => UI.clk && UI.clk.on && UI.clkToggle());
      kept = await pg.evaluate(k => { const a = document.activeElement; return a === document.body ? 'body' : (a.getAttribute('data-a') + '|' + a.getAttribute('data-v')) === k ? 'same' : (a.id || a.tagName); }, key);
    }
    return { ok: unreachable === 0 && (!card || opened) && kept !== 'body', detail: `${unreachable} clickable elements unreachable by Tab; Enter on a person card ${card ? (opened ? 'opens it' : 'does NOTHING') : '(no card)'}; focus after 4 s of clock: ${kept}` };
  },

  async saveSafety(pg) {
    // a failed autosave speaks up; a new life over a living save asks first
    const r = await pg.evaluate(async () => {
      UI.screen = 'title'; UI.render();
      UI.A.randomLife(); await UI.save(false); await new Promise(res => setTimeout(res, 300));
      SAVES.listCache = await SAVES.list();
      const toasts = [], t0 = UI.toast; UI.toast = (m) => { toasts.push(m); };
      const put = SAVES.put; SAVES.put = async () => { throw new Error('QuotaExceededError'); };
      UI._saveWarn = 0; await UI.save(true);
      SAVES.put = put; UI.toast = t0;
      UI.ov = null; UI.screen = 'title'; UI.render();
      const pcBefore = A.S.pc;
      UI.A.randomLife();
      const asked = !!(UI.ov && UI.ov.type === 'confirm'), started = A.S.pc !== pcBefore;
      UI.ov = null; UI.renderModal && UI.renderModal();
      return { warned: toasts.some(m => /would not keep|not saving/.test(m)), asked, started };
    });
    return { ok: r.warned && r.asked && !r.started, detail: `failed autosave warns: ${r.warned}; new life over a living save asks first: ${r.asked}${r.started ? ' (but STARTED without asking)' : ''}` };
  },

  async csp(pg, errs) {
    // defence in depth: even if markup slips through, inline handlers must not run
    const r = await pg.evaluate(async () => {
      window.__csp = 0;
      document.body.insertAdjacentHTML('beforeend', '<img src="x" onerror="window.__csp=1">');
      await new Promise(res => setTimeout(res, 500));
      return { ran: window.__csp, meta: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]') };
    });
    // the block we just provoked is the point of the test, not a failure
    for (let i = errs.length - 1; i >= 0; i--) if (/inline event handler/.test(errs[i])) errs.splice(i, 1);
    return { ok: r.meta && !r.ran, detail: `CSP meta present: ${r.meta}; injected inline handler ran: ${!!r.ran}` };
  },
};

const browser = await pw.chromium.launch();
// two tabs of the same game must not both save
async function twoTabs() {
  const ctx = await browser.newContext();
  const open = async () => { const p = await ctx.newPage(); await p.goto('file://' + file); await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 }); await p.waitForTimeout(400); return p; };
  const a = await open(), b = await open();
  const sa = await a.evaluate(async () => { A.newGame({ seed: 1 }); return (await SAVES.save(A.S, null)).ok; });
  const sb = await b.evaluate(async () => { A.newGame({ seed: 2 }); return (await SAVES.save(A.S, null)).ok; });
  await a.close(); await b.waitForTimeout(500);
  const sb2 = await b.evaluate(async () => (await SAVES.save(A.S, null)).ok);
  await ctx.close();
  return { ok: sa && !sb && sb2, detail: `first tab saves: ${sa}; second tab saves while the first is open: ${sb}; after the first closes: ${sb2}` };
}
let failed = 0;
console.log('testing', path.relative(root, file));
for (const [name, fn] of Object.entries(TESTS)) {
  if (only && !only.includes(name)) continue;
  const ctx = await browser.newContext({ acceptDownloads: true }); // fresh storage per test
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  // anything the page's own security policy blocks is a bug in the policy or the page
  pg.on('console', m => { if (/Content.Security.Policy/i.test(m.text()) && !/__csp|data-pwn|\/x'/.test(m.text())) errs.push('CSP: ' + m.text().slice(0, 300)); });
  const t0 = Date.now();
  let res;
  try {
    await pg.goto('file://' + file);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await pg.evaluate(HELPERS);
    res = await fn(pg, errs);
    if (errs.length && res.ok) res = { ok: false, detail: res.detail + `; page error: ${errs[0]}` };
  } catch (e) { res = { ok: false, detail: String(e.message || e).slice(0, 400) }; }
  if (!res.ok) failed++;
  console.log(`${res.ok ? 'PASS' : 'FAIL'}  ${name.padEnd(17)} ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${res.detail}`);
  await ctx.close();
}
if (!only || only.includes('twoTabs')) {
  const t0 = Date.now(); let res;
  try { res = await twoTabs(); } catch (e) { res = { ok: false, detail: String(e.message || e).slice(0, 300) }; }
  if (!res.ok) failed++;
  console.log(`${res.ok ? 'PASS' : 'FAIL'}  ${'twoTabs'.padEnd(17)} ${((Date.now() - t0) / 1000).toFixed(1).padStart(5)}s  ${res.detail}`);
}
await browser.close();
console.log(failed ? `${failed} failed` : 'all passed');
process.exit(failed ? 1 : 0);
