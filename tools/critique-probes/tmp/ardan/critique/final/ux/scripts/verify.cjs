// Headline claims, checked live. node verify.cjs <w> <h> <touch|mouse>
const { chromium, open, shot, HELPERS } = require('./lib.cjs');
const [W, H, mode] = [+process.argv[2], +process.argv[3], process.argv[4]];
const touch = mode === 'touch';
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
  await page.evaluate(HELPERS);
  const P = (...a) => console.log(...a);
  // ---- 1. hover
  await page.evaluate(() => { T.enter({ seed: 5151, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); });
  await page.waitForTimeout(600);
  if (!touch) {
    const anchors = await page.$$('[data-tt]');
    let opened = 0, tried = 0; const sample = [];
    for (const a of anchors.slice(0, 40)) {
      if (!(await a.isVisible())) continue;
      tried++;
      await a.hover({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(250);
      const pop = await page.evaluate(() => { const p = [...document.querySelectorAll('.tt-pop')].filter(e => !e.hidden); return p.length ? p[p.length - 1].innerText.replace(/\n+/g, ' / ').slice(0, 90) : null; });
      if (pop) { opened++; if (sample.length < 3) sample.push((await a.innerText()).replace(/\s+/g, ' ').slice(0, 20) + ' => ' + pop); }
      await page.mouse.move(5, 5); await page.waitForTimeout(380);
      if (tried >= 12) break;
    }
    P('HOVER: anchors on Life', anchors.length, 'tried', tried, 'opened by hover alone', opened, sample);
    const a0 = await page.$('[data-tt="date"]');
    if (a0) { await a0.hover(); await page.waitForTimeout(400); await shot(page, 'v-hover-date', { nomeasure: true }); await page.mouse.move(5, 300); await page.waitForTimeout(400); }
  } else {
    const a0 = await page.$('[data-tt]'); await a0.tap(); await page.waitForTimeout(400);
    P('TAP: popover after one tap:', await page.evaluate(() => { const p = document.querySelector('.tt-pop:not([hidden])'); return p ? p.innerText.replace(/\n+/g, ' / ').slice(0, 120) : null; }));
    await page.evaluate(() => UI.TT && UI.TT.closeAll && UI.TT.closeAll());
  }
  // title= texts with real content on the main tabs
  const tl = await page.evaluate(() => {
    const out = {};
    for (const t of T.tabs()) {
      UI.tab = t; UI.render();
      const L = [...document.querySelectorAll('[title]')].filter(e => e.getBoundingClientRect().width > 0).map(e => e.getAttribute('title').trim());
      const long = L.filter(x => x.split(/\s+/).length >= 4);
      out[t] = [L.length, long.length, (long[0] || '').slice(0, 60)];
    }
    UI.tab = 'life'; UI.render(); return out;
  });
  P('TITLE= per tab [all, >=4 words, first]:', JSON.stringify(tl));
  // ---- 4. layout
  P('LAYOUT:', JSON.stringify(await page.evaluate(() => {
    const box = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
    const o = {};
    for (const s of ['#profile', '#logwrap', '#log', '#tabs', '#tabbody', '#topbar', 'header', '.v2-step.primary', '#dock', '.phone-nav', '#tabbar']) { const e = document.querySelector(s); if (e && e.getBoundingClientRect().width) o[s] = box(e); }
    o.cols = [...document.querySelectorAll('#game > *, .cols > *, main > *')].filter(e => e.getBoundingClientRect().width > 150).slice(0, 6).map(e => (e.id || String(e.className).slice(0, 20)) + ':' + box(e).join(','));
    return o;
  })));
  // ---- 2. second press while the month runs
  const SELB = '[data-a="v2Next"]:not([aria-disabled="true"])';
  let done2 = 0;
  for (let trial = 0; trial < 10 && done2 < 3; trial++) {
    for (let k = 0; k < 40; k++) { const st = await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); return UI.stepper.run || A.S.queue.length > 0; }); if (!st) break; await page.waitForTimeout(250); }
    await page.waitForTimeout(300);
    const d0 = await page.evaluate(() => A.absDay());
    if (touch) await page.tap(SELB, { timeout: 4000 }).catch(() => {}); else await page.click(SELB, { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(120);
    const mid = await page.evaluate(() => { const e = document.querySelector('.v2-step.primary'); return e.getAttribute('data-a') + ' "' + e.innerText.replace(/\s+/g, ' ').trim() + '" aria-label=' + e.getAttribute('aria-label'); });
    const s = await page.$('[data-a="stepStop"]');
    if (!s) { await page.waitForFunction(() => !UI.stepper.run || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {}); continue; }
    let ok = true;
    if (touch) await s.tap({ timeout: 3000 }).catch(() => { ok = false; }); else await s.click({ timeout: 3000 }).catch(() => { ok = false; });
    await page.waitForTimeout(1200);
    const aft = await page.evaluate(d0 => ({ days: A.absDay() - d0, date: (document.querySelector('[data-tt="date"]') || {}).innerText.replace(/\s+/g, ' '), btn: document.querySelector('.v2-step.primary').innerText.trim(), run: UI.stepper.run, toast: ((document.querySelector('#toast-stack') || {}).innerText || '').slice(0, 60) }), d0);
    done2++;
    P('SECOND PRESS trial', trial, 'second press landed', ok, '| while running:', mid, '| after:', JSON.stringify(aft));
    await page.waitForFunction(() => !UI.stepper.run || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {});
  }
  // ---- 3. "Go on" while a card waits
  await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); });
  for (let k = 0; k < 14; k++) {
    if (touch) await page.tap(SELB, { timeout: 4000 }).catch(() => {}); else await page.click(SELB, { timeout: 4000 }).catch(() => {});
    await page.waitForFunction(() => !UI.stepper.run || UI.stepper.wait, null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(500);
    const wait = await page.evaluate(() => UI.stepper.wait && !!document.querySelector('#modal [data-a="evChoose"]'));
    if (wait) break;
    await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); });
  }
  const go = await page.evaluate(() => {
    const b = document.querySelector('.v2-step.primary'); if (!b) return 'no button';
    const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const m = document.querySelector('#modal'); const mr = m.getBoundingClientRect();
    const before = m.innerText.length; const d = A.absDay(); b.click();
    return { label: b.innerText.trim(), dataA: b.getAttribute('data-a'), disabled: b.getAttribute('aria-disabled'), title: b.getAttribute('title'), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], covered_by: top ? (top.id || String(top.className) || top.tagName) : null, clickable: !!top && (top === b || b.contains(top)), modalRect: [Math.round(mr.x), Math.round(mr.y), Math.round(mr.width), Math.round(mr.height)], afterClick: { sameCard: document.querySelector('#modal').innerText.length === before, days: A.absDay() - d } };
  });
  P('GO ON while a card waits:', JSON.stringify(go));
  const cm = await shot(page, 'v-card-goon');
  P('card moment measure:', JSON.stringify({ wordsSeen: cm.wordsSeen, naive: cm.wordsViewNaive, controlsSeen: cm.controlsSeen }));
  P('card: words and choices [top,bottom,fullyVisible]:', JSON.stringify(await page.evaluate(() => ({ cardWords: document.querySelector('#modal').innerText.split(/\s+/).filter(Boolean).length, choices: [...document.querySelectorAll('#modal [data-a="evChoose"]')].map(e => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + 20, Math.min(innerHeight - 1, r.top + r.height / 2)); return [Math.round(r.top), Math.round(r.bottom), r.bottom <= innerHeight && !!t && (e.contains(t) || t.contains(e))]; }) }))));
  await page.evaluate(() => { T.drain(); UI.ov = null; UI.refresh(); });
  // ---- 5/6. help and the menu
  const help = await page.evaluate(() => { UI.A.help(); const m = document.querySelector('#modal'); const t = m.innerText; UI.ov = null; UI.render(); const d6 = [...m.querySelectorAll('details')].find(d => /Six tabs/.test(d.querySelector('summary').textContent)); const i = t.indexOf('Six tabs'); return { six: d6 ? d6.textContent.replace(/\s+/g, ' ').slice(0, 700) : null, sections: m.querySelectorAll('details').length, allWords: m.textContent.split(/\s+/).length, words: t.split(/\s+/).length, realmTab: (t.match(/Realm tab/g) || []).length, warTab: (t.match(/War tab/g) || []).length }; });
  P('HELP:', JSON.stringify(help));
  const menu = await page.evaluate(() => { UI.A.menu(); const m = document.querySelector('#modal'); const ts = [...m.querySelectorAll('select')].map(s => (s.getAttribute('aria-label') || s.getAttribute('data-c') || '') + ': ' + [...s.options].map(o => o.textContent.trim()).join(' | ')); const ctl = m.querySelectorAll('button, input, select').length; const txt = m.innerText.replace(/\n+/g, ' / '); UI.ov = null; UI.render(); return { ts, ctl, hasOdds: /exact odds/i.test(txt), txt: txt.slice(0, 700) }; });
  P('MENU:', JSON.stringify(menu));
  await page.evaluate(() => { UI.A.menu(); });
  await page.waitForTimeout(900);
  P('TEXT SIZE options as drawn after 0.9 s:', JSON.stringify(await page.evaluate(() => { const m = document.querySelector('#modal'); const s = [...m.querySelectorAll('select')].find(x => /100%|all/.test(x.textContent)); const lab = [...m.querySelectorAll('label, .row, div')].map(e => e.innerText).find(x => /exact odds/i.test(x) && x.length < 80); const r = s ? [...s.options].map(o => o.textContent.trim()) : null; UI.ov = null; UI.render(); return { r, showOdds: typeof A.DIFF !== 'undefined' && A.DIFF.showOdds ? String(A.DIFF.showOdds).slice(0, 60) : null, oddsLabel: lab }; })));
  P('errors', page.errs);
  await browser.close();
})();
