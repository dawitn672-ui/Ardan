// Press the real Next month button N times from a newborn (or a given start) and log everything the player would see.
// node months.cjs <w> <h> <touch|mouse> <n> <startJSON> [tag]
const { chromium, open, shot, cpuClock, HELPERS } = require('./lib.cjs');
const [W, H, mode, N] = [+process.argv[2], +process.argv[3], process.argv[4], +process.argv[5]];
const start = JSON.parse(process.argv[6] || '{"seed":4242,"race":"human","realm":"POL-01","status":"peasant","sex":"M","startAge":0}');
const tag = process.argv[7] || 'm';
const pre = +(process.argv[8] || 0);
const touch = mode === 'touch';
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
  const clk = await cpuClock(page);
  await page.evaluate(HELPERS);
  await page.evaluate(o => { T.enter(o); }, start);
  if (pre) { const t0 = Date.now(); const st = await page.evaluate(y => { const r = T.play(y); T.show('life'); return { r, year: A.S.year, people: Object.keys(A.S.people).length, bytes: JSON.stringify(A.S).length, age: A.age(A.pc()), name: A.pc().name, logYears: (A.S.log || []).length }; }, pre); console.log('preplayed', pre, 'years in', Date.now() - t0, 'ms', JSON.stringify(st)); }
  await page.waitForTimeout(800);
  if (pre) {
    // whatever stands over the page after the bot years: read it, then answer it through the real UI
    for (let k = 0; k < 12; k++) {
      const mm = await page.evaluate(() => { const m = document.querySelector('#modal'); if (!m || !m.innerText.trim() || getComputedStyle(m).display === 'none') return null; return { text: m.innerText.replace(/\n+/g, ' / ').slice(0, 260), acts: [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a') + ':' + (e.getAttribute('data-v') || '') + '=' + e.innerText.replace(/\s+/g, ' ').trim().slice(0, 24)).slice(0, 12), ov: UI.ov && (UI.ov.type || String(UI.ov)), q: A.S.queue.slice(0, 3).map(x => x.type + ':' + (x.ev || x.title || '')) }; });
      if (!mm) break;
      console.log('  after preplay, modal', k, JSON.stringify(mm));
      const b = await page.$('#modal [data-a="evChoose"]:not([aria-disabled="true"]), #modal [data-a="qChoice"], #modal [data-a="evClose"], #modal [data-a="dead"], #modal [data-a="heir"], #modal [data-a="continueHeir"], #modal [data-a="closeOv"], #modal [data-a]');
      if (!b) break;
      await b.click({ timeout: 3000 }).catch(e => console.log('   click failed'));
      await page.waitForTimeout(400);
    }
    await shot(page, tag + '-after-preplay', { nomeasure: true });
  }
  if (process.env.THROTTLE) { await clk.cdp.send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE }); console.log('cpu throttle x' + process.env.THROTTLE); }
  const tap = async el => { if (touch) await el.tap(); else await el.click(); };
  const rows = [];
  for (let i = 0; i < N; i++) {
    const nb = await page.$('[data-a="v2Next"]:not([aria-disabled="true"]), [data-a="v2Week"]:not([aria-disabled="true"])');
    if (!nb) { console.log(i, 'no enabled time button:', await page.evaluate(() => [...document.querySelectorAll('.v2-step')].map(e => e.getAttribute('data-a') + '/' + e.innerText.trim() + '/' + e.getAttribute('aria-disabled')).join(' ; ') + ' q=' + A.S.queue.slice(0, 2).map(x => x.type).join(','))); break; }
    const before = await page.evaluate(() => ({ d: A.absDay(), date: (document.querySelector('[data-tt="date"]') || {}).innerText, log: A.S.log ? A.S.log.length : 0 }));
    // clear anything left over the button (a moment cut-in, a waiting card) before timing a press
    for (let k = 0; k < 30; k++) {
      const blocked = await page.evaluate(() => { const m = document.querySelector('#modal'); const cut = document.querySelector('#mo-cut'); return (m && m.innerText.trim().length > 0 && getComputedStyle(m).display !== 'none') || !!cut || A.S.queue.length > 0; });
      if (!blocked) break;
      await page.evaluate(() => { T.drain(); const c = document.querySelector('#mo-cut'); if (c) c.remove(); UI.ov = null; UI.refresh(); });
      await page.waitForTimeout(150);
    }
    const c0 = await clk.get(); const t0 = Date.now();
    const SELB = '[data-a="v2Next"]:not([aria-disabled="true"]), [data-a="v2Week"]:not([aria-disabled="true"])';
    try { if (touch) await page.tap(SELB, { timeout: 4000 }); else await page.click(SELB, { timeout: 4000 }); } catch (e) { console.log(i, 'press blocked:', String(e).split('\n').find(l => /intercepts/.test(l)) || String(e).slice(0, 120)); continue; }
    let cards = 0, labels = new Set(), firstCardAt = null, toast = '', stuck = 0;
    // loop: wait for either a card or the button to return to rest
    for (let g = 0; g < 600; g++) {
      const s = await page.evaluate(() => {
        const b = document.querySelector('.v2-step.primary') || document.querySelector('.v2-step');
        const m = document.querySelector('#modal');
        const modalOn = m && m.innerText.trim().length > 0 && getComputedStyle(m).display !== 'none';
        const t = document.querySelector('#toast-stack') ? document.querySelector('#toast-stack').innerText.trim() : '';
        const t2 = document.querySelector('#toast') && +getComputedStyle(document.querySelector('#toast')).opacity > 0 ? document.querySelector('#toast').innerText.trim() : '';
        return { btn: b ? b.getAttribute('data-a') + '|' + b.innerText.replace(/\s+/g, ' ').trim() + '|' + (b.getAttribute('aria-disabled') || '') : 'none', modalOn, run: !!(UI.stepper && UI.stepper.run), wait: !!(UI.stepper && UI.stepper.wait), q: A.S.queue.length, toast: t || t2,
          acts: modalOn ? [...m.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a')) : [] };
      });
      labels.add(s.btn); if (s.toast) toast = s.toast;
      if (s.modalOn) {
        if (firstCardAt == null) firstCardAt = Date.now() - t0;
        // answer through the real UI: first enabled choice, then close
        const ch = await page.$('#modal [data-a="evChoose"]:not([aria-disabled="true"]), #modal [data-a="qChoice"]:not([aria-disabled="true"])');
        if (ch) { cards++; await tap(ch).catch(() => {}); await page.waitForTimeout(120); continue; }
        const cl = await page.$('#modal [data-a="evClose"], #modal [data-a="qClose"], #modal [data-a="closeOv"], #modal [data-a="hintDone"], #modal [data-a="closeModal"], #modal [data-a="close"]');
        if (cl) { await tap(cl).catch(() => {}); await page.waitForTimeout(120); continue; }
        stuck++; if (stuck === 1) console.log('  unknown modal:', s.acts.join(','), '|', (await page.evaluate(() => document.querySelector('#modal').innerText.replace(/\n+/g, ' / ').slice(0, 300))));
        await page.evaluate(() => { const h = A.headReady(); if (h) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); } UI.ov = null; UI.refresh(); });
        if (stuck > 20) break;
      }
      if (!s.run && !s.modalOn && s.q === 0 && g > 0) break;
      if (!s.run && !s.modalOn && s.q > 0) { await page.evaluate(() => UI.refresh()); }
      await page.waitForTimeout(40);
    }
    const wall = Date.now() - t0; const c1 = await clk.get();
    const after = await page.evaluate(() => ({ d: A.absDay(), date: (document.querySelector('[data-tt="date"]') || {}).innerText, age: A.age(A.pc()), alive: A.pc().alive }));
    const row = { i, date: before.date, days: after.d - before.d, cards, wall, cpu: Math.round((c1.TaskDuration - c0.TaskDuration) * 1000), script: Math.round((c1.ScriptDuration - c0.ScriptDuration) * 1000), layout: Math.round((c1.LayoutDuration - c0.LayoutDuration) * 1000), layouts: c1.LayoutCount - c0.LayoutCount, firstCardAt, toast: toast.slice(0, 70), labels: [...labels].join(' >> ') };
    rows.push(row);
    console.log(JSON.stringify(row));
    if (!after.alive) { console.log('dead'); break; }
  }
  const quiet = rows.filter(r => !r.cards), busy = rows.filter(r => r.cards);
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  console.log(tag, 'SUMMARY presses', rows.length, 'quiet', quiet.length, 'quiet cpu med/max', med(quiet.map(r => r.cpu)), Math.max(...quiet.map(r => r.cpu)), 'quiet wall med/max', med(quiet.map(r => r.wall)), Math.max(...quiet.map(r => r.wall)), 'busy cpu med', med(busy.map(r => r.cpu)), 'layouts med', med(rows.map(r => r.layouts)));
  await shot(page, tag + '-end', { full: true });
  console.log('errors', page.errs);
  await browser.close();
})();
