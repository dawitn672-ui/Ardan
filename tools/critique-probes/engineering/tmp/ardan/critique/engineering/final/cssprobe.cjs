// Deciding critic: what the style engine has to match: rules, selector kinds, root-level state.
const fs = require('fs');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage(); page.setDefaultTimeout(3600000);
  await page.goto('file:///tmp/ardan/snap/index.html');
  await page.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 3600000 });
  const s = fs.readFileSync('/tmp/ardan/critique/engineering/out/noble-y50-state.json', 'utf8');
  const r = await page.evaluate(s => {
    A.deserialize(JSON.parse(s)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
    const out = { sheets: document.styleSheets.length, styleEls: document.querySelectorAll('style').length, cssBytes: [...document.querySelectorAll('style')].reduce((a, s) => a + s.textContent.length, 0) };
    let rules = 0, sels = 0, has = 0, hasRoot = 0, rootAttr = 0, universal = 0, important = 0, media = 0, keyframes = 0, container = 0, notSel = 0, attrSel = 0, nth = 0, sibling = 0;
    const hasEx = [];
    const walk = list => { for (const r of list) {
      if (r.type === 1) { rules++; const st = r.selectorText || ''; for (const s of st.split(',')) { sels++; if (s.includes(':has(')) { has++; if (hasEx.length < 12) hasEx.push(s.trim().slice(0, 120)); } if (/^\s*(:root|html)\b[^ ]*\[/.test(s) || /:root\[/.test(s)) rootAttr++; if (/(^|[\s>+~])\*/.test(s)) universal++; if (s.includes(':not(')) notSel++; if (/\[[a-z-]+/.test(s)) attrSel++; if (/:nth-|:first-child|:last-child|:only-child/.test(s)) nth++; if (/[+~]/.test(s.replace(/\([^)]*\)/g, ''))) sibling++; }
        important += (r.cssText.match(/!important/g) || []).length; }
      else if (r.type === 4) { media++; walk(r.cssRules); }
      else if (r.type === 7) keyframes++;
      else if (r.cssRules) { if (/CSSContainerRule/.test(r.constructor.name)) container++; walk(r.cssRules); }
    } };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
    Object.assign(out, { rules, selectors: sels, has, rootAttr, universal, important, media, keyframes, container, notSel, attrSel, nth, sibling, hasEx });
    const de = document.documentElement;
    out.root = { attrs: [...de.attributes].map(a => a.name + '=' + (a.value.length > 60 ? a.value.length + ' chars' : a.value)), bodyClass: document.body.className, gameClass: (document.querySelector('#game') || {}).className };
    out.rootVars = (de.getAttribute('style') || '').split(';').map(x => x.split(':')[0].trim()).filter(Boolean).map(k => k + ':' + (de.style.getPropertyValue(k) || '').length);
    out.doc = { elements: document.getElementsByTagName('*').length, log: (document.getElementById('logwrap') || document.body).getElementsByTagName('*').length, tab: (document.getElementById('tabbody') || document.body).getElementsByTagName('*').length, profile: (document.getElementById('profile') || document.body).getElementsByTagName('*').length, topbar: (document.getElementById('topbar') || document.body).getElementsByTagName('*').length, svg: document.querySelectorAll('svg').length, svgNodes: [...document.querySelectorAll('svg')].reduce((a, s) => a + s.getElementsByTagName('*').length, 0), scripts: document.querySelectorAll('script').length, scriptBytes: [...document.querySelectorAll('script')].reduce((a, s) => a + s.textContent.length, 0), animations: document.getAnimations().length };
    out.anim = document.getAnimations().slice(0, 8).map(a => (a.animationName || a.transitionProperty || '?') + ' on ' + (a.effect && a.effect.target ? (a.effect.target.id || a.effect.target.className || a.effect.target.tagName) : '?') + ' ' + a.playState + ' iter ' + (a.effect ? a.effect.getTiming().iterations : ''));
    return out;
  }, s);
  console.log(JSON.stringify(r, null, 1));
  fs.writeFileSync('/tmp/ardan/critique/engineering/final/out/cssprobe.json', JSON.stringify(r, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e.stack || e); process.exit(1); });
