// Shared Playwright driver for the design critique: one life, played a month at a time through the real UI.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

async function open(width) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: width || 1366, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e && e.stack || e).slice(0, 400)));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForTimeout(1200);
  return { b, page, errs };
}

async function createLife(page, o) {
  // through the creation screen, as a player would
  await page.click('[data-a="newLife"]'); await page.waitForTimeout(500);
  await page.click('[data-a="crStep"][data-v="0"]'); await page.waitForTimeout(400);
  if (o.race) await page.click(`[data-a="crSet"][data-v="race:${o.race}"]`);
  if (o.realm) { await page.selectOption('select[data-c="crRealm"]', o.realm).catch(() => {}); await page.waitForTimeout(300); }
  await page.click(`[data-a="crSet"][data-v="status:${o.status}"]`); await page.waitForTimeout(200);
  await page.click(`[data-a="crSet"][data-v="startAge:${o.startAge}"]`); await page.waitForTimeout(200);
  if (o.sex) { const s = await page.$(`[data-a="crSet"][data-v="sex:${o.sex}"]`); if (s) await s.click(); }
  await page.click('[data-a="crStep"][data-v="3"]'); await page.waitForTimeout(300);
  if (o.diff) await page.click(`[data-a="crSet"][data-v="diff:${o.diff}"]`);
  if (o.seed) {
    const inp = await page.$('input[data-c="crSeed"]') || await page.$('#crSeed') || await page.$('input');
    if (inp) { await inp.fill(String(o.seed)); await inp.dispatchEvent('change'); await inp.dispatchEvent('input'); }
  }
  await page.click('[data-a="startLife"]');
  await page.waitForTimeout(1500);
}

async function load(page, file) {
  const s = fs.readFileSync(file, 'utf8');
  await page.evaluate(s => { A.deserialize(s); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render(); }, s);
  await page.waitForTimeout(600);
}
async function save(page, file) {
  const s = await page.evaluate(() => A.serialize());
  fs.writeFileSync(file, s);
  return s.length;
}

const st = page => page.evaluate(() => {
  const pc = A.pc(), ST = UI.stepper, m = document.querySelector('#modal');
  return { run: !!(ST && ST.run), wait: !!(ST && ST.wait), modal: !!m, q: A.S.queue.length, qt: A.S.queue[0] && A.S.queue[0].type, ov: UI.ov && UI.ov.type, alive: !!(pc && pc.alive), date: A.dateStr(), year: A.S.year, age: pc ? A.age(pc) : null };
});

async function readModal(page) {
  return page.evaluate(() => {
    const m = document.querySelector('#modal'); if (!m) return null;
    const title = (m.querySelector('#modal-title') || {}).innerText || '';
    const ch = [...m.querySelectorAll('[data-a="evChoose"]')].map(b => ({ i: +b.getAttribute('data-v'), t: b.innerText.trim().replace(/\s*\n\s*/g, ' | '), dis: b.disabled || b.getAttribute('aria-disabled') === 'true' }));
    const acts = [...m.querySelectorAll('[data-a]')].map(b => ({ a: b.getAttribute('data-a'), v: b.getAttribute('data-v') || '', t: (b.innerText || '').trim().replace(/\s*\n\s*/g, ' | ').slice(0, 120), dis: b.disabled || b.getAttribute('aria-disabled') === 'true' }));
    const clone = m.cloneNode(true); clone.querySelectorAll('svg,[data-a="evChoose"]').forEach(n => n.remove());
    const text = clone.innerText.replace(/\n{2,}/g, '\n').trim();
    const q = A.S.queue[0];
    return { title: title.trim(), text, ch, acts, ev: q && q.ev, qtype: q && q.type, npc: !!(q && q.ctx && q.ctx.npcMove) };
  });
}

// Answer whatever is on screen (cards, result screens, battles) until the step is over.
async function settle(page, policy, log, opt = {}, btnSel) {
  let cards = 0, other = 0, guard = 0, lastKey = '', same = 0;
  while (guard++ < 500) {
    await page.waitForTimeout(60);
    const s = await st(page);
    if (!s.alive) { log({ k: 'dead', date: s.date, age: s.age }); return { dead: true, cards, other }; }
    if (s.modal) {
      const md = await readModal(page);
      const key = (md.title || '') + '|' + md.acts.map(a => a.a + a.v).join(',') + '|' + md.text.length + '|' + md.text.slice(-120);
      if (key === lastKey) { same++; } else { same = 0; lastKey = key; }
      if (same > 6) { log({ k: 'stuck', title: md.title, acts: md.acts.map(a => a.a + ':' + a.v) }); await page.keyboard.press('Escape'); await page.waitForTimeout(200); if (same > 12) return { stuck: true, cards, other }; }
      const choices = md.ch.filter(c => !c.dis);
      if (choices.length) {
        const idx = policy(md, s);
        const pick = choices.find(c => c.i === idx) || choices[0];
        await page.click(`#modal [data-a="evChoose"][data-v="${pick.i}"]`, { timeout: 5000 }).catch(e => log({ k: 'choosefail', e: String(e).slice(0, 200) }));
        await page.waitForTimeout(150);
        const after = await readModal(page);
        log({ k: 'card', date: s.date, age: s.age, ev: md.ev, npc: md.npc, title: md.title, text: md.text, ch: md.ch.map(c => c.t), dis: md.ch.filter(c => c.dis).map(c => c.i), pick: pick.i, result: after ? after.text : null });
        cards++;
        if (opt.onCard) await opt.onCard(cards, md);
        continue;
      }
      const prefer = ['evClose', 'bClose', 'mClose', 'qClose', 'hintDone', 'closeModal', 'close', 'ok', 'battleNext', 'duelNext'];
      let act = null;
      if (opt.otherModal) act = opt.otherModal(md, s);
      if (!act) for (const p of prefer) { act = md.acts.find(a => a.a === p && !a.dis); if (act) break; }
      if (!act) act = md.acts.find(a => !a.dis && !/^(report|tt|ttOpen|fold|ov|lookChips)$/.test(a.a));
      log({ k: 'modal', date: s.date, age: s.age, title: md.title, text: md.text.slice(0, 2500), acts: md.acts.filter(a => !/^(tt|ttOpen|fold)$/.test(a.a)).map(a => a.a + ':' + a.v + ':' + a.t).slice(0, 30), did: act && (act.a + ':' + act.v) });
      other++;
      if (opt.onModal) await opt.onModal(other, md);
      if (act) {
        const sel = `#modal [data-a="${act.a}"]` + (act.v ? `[data-v="${String(act.v).replace(/"/g, '\\"')}"]` : '');
        await page.click(sel, { timeout: 5000 }).catch(async e => { log({ k: 'modalclickfail', sel, e: String(e).slice(0, 200) }); await page.keyboard.press('Escape'); });
      } else await page.keyboard.press('Escape');
      await page.waitForTimeout(120);
      continue;
    }
    if (s.ov && s.ov !== 'person' && s.ov !== 'profile' && s.ov !== 'tree') {
      const ovd = await page.evaluate(() => { const o = document.querySelector('#ov') || document.querySelector('.ov'); return o ? { text: o.innerText.slice(0, 2500), acts: [...o.querySelectorAll('[data-a]')].map(b => b.getAttribute('data-a') + ':' + (b.getAttribute('data-v') || '') + ':' + (b.innerText || '').trim().slice(0, 60)) } : null; });
      log({ k: 'overlay', date: s.date, ov: s.ov, d: ovd });
      if (opt.overlay) { const done = await opt.overlay(page, s, ovd); if (done) continue; }
      await page.evaluate(() => { UI.ov = null; UI.render(); });
      continue;
    }
    if (s.run && s.wait) { await page.click('[data-a="v2Next"], [data-a="v2Week"], [data-a="v2Day"]', { timeout: 3000 }).catch(() => {}); continue; }
    if (!s.run) {
      if (btnSel && s.q && s.qt !== 'warroom' && guard < 200) { await page.click(btnSel, { timeout: 3000 }).catch(() => {}); continue; }
      break;
    }
  }
  return { cards, other, guard };
}

// One Next month (or Next week on campaign), through the button.
async function month(page, policy, log, opt = {}) {
  const t0 = Date.now();
  const before = await st(page);
  if (!before.alive) return { dead: true };
  const camp = await page.$('[data-a="v2Week"]');
  const btnSel = camp ? '[data-a="v2Week"]' : '[data-a="v2Next"]';
  const tIn0 = await page.evaluate(() => performance.now());
  await page.click(btnSel, { timeout: 8000 }).catch(e => log({ k: 'clickfail', e: String(e).slice(0, 200) }));
  const r = await settle(page, policy, log, opt, btnSel);
  const toast = await page.evaluate(() => (A.V2T && A.V2T.ui && A.V2T.ui.toasts.slice(-1)[0]) || '');
  const after = await st(page);
  return Object.assign(r, { ms: Date.now() - t0, camp: !!camp, from: before.date, to: after.date, toast });
}

// Spend initiative on an activity, as a player does from the Now tab; answer what it brings.
async function act(page, key, policy, log, opt = {}) {
  const ok = await page.evaluate(k => { if (UI.tab !== 'life') { UI.tab = 'life'; UI.render(); } const b = document.querySelector(`[data-a="act"][data-v="${k}"]`); return b ? !(b.disabled || b.getAttribute('aria-disabled') === 'true') : null; }, key);
  if (!ok) return { ok };
  // a first life shows six tiles; the rest sit behind "More activities", which a player opens
  const vis = await page.isVisible(`[data-a="act"][data-v="${key}"]`).catch(() => false);
  if (!vis) { const more = await page.$('[data-a="actsMore"]'); if (more) { await more.click().catch(() => {}); await page.waitForTimeout(200); } }
  await page.click(`[data-a="act"][data-v="${key}"]`, { timeout: 5000 }).catch(e => log({ k: 'actfail', key, e: String(e).slice(0, 160) }));
  await page.waitForTimeout(150);
  const toast = await page.evaluate(() => { const t = document.getElementById('toast'); return t ? t.innerText : ''; });
  log({ k: 'act', key, toast });
  const r = await settle(page, policy, log, opt, null);
  return Object.assign({ ok: true, toast }, r);
}

module.exports = { open, createLife, load, save, month, settle, act, readModal, st, hash };
