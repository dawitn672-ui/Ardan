// Title and creation, through the real UI. node title.cjs <w> <h> [touch]
const { chromium, open, shot } = require('./lib.cjs');
const [W, H, touch] = [+process.argv[2], +process.argv[3], process.argv[4] === 'touch'];
(async () => {
  const browser = await chromium.launch();
  const { ctx, page } = await open(browser, W, H, { touch, mobile: touch });
  const dump = async (label) => {
    const r = await page.evaluate(() => ({
      screen: UI.screen, text: document.body.innerText.replace(/\n+/g, ' / ').slice(0, 1800),
      ctl: [...document.querySelectorAll('button, a[href], [data-a], input, select, textarea, summary')].filter(e => e.getBoundingClientRect().width > 0).map(e => (e.getAttribute('data-a') || e.tagName.toLowerCase()) + (e.getAttribute('data-v') ? ':' + e.getAttribute('data-v') : '') + '=' + (e.innerText || e.value || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 40) + ' [' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + ']'),
    }));
    console.log('\n##', label, '\n', r.text, '\n  controls(' + r.ctl.length + '):', r.ctl.join(' | ').slice(0, 3500));
  };
  let m = await shot(page, 't01-title', { full: true }); console.log(JSON.stringify(m));
  await dump('title');
  await page.click('text=Begin a new life');
  await page.waitForTimeout(600);
  m = await shot(page, 't02-newlife', { full: true }); console.log(JSON.stringify(m));
  await dump('new life');
  console.log('errors', page.errs);
  await browser.close();
})();
