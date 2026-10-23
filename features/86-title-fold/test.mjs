// On the commonest laptop screens the title's "Begin a new life" is on screen without scrolling, and the map keeps its
// shape (on desktop; a phone crops it on purpose); the full-HD and phone layouts are as they were.
export default {
  async tfInSight(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const out = [];
    for (const [w, h] of [[1280, 800], [1366, 768], [1440, 900], [1920, 1080], [390, 844]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } }), p = await ctx.newPage();
      p.on('pageerror', e => errs.push(String(e)));
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      out.push(Object.assign({ w, h }, await p.evaluate(() => {
        const b = document.querySelector('[data-a="newLife"]').getBoundingClientRect(), cv = document.querySelector('#title canvas.mapstrip'), r = cv.getBoundingClientRect();
        return { bottom: Math.round(b.bottom), vh: innerHeight, mapH: Math.round(r.height), shape: Math.abs((r.width / r.height) / (cv.width / cv.height) - 1) };
      })));
      await ctx.close();
    }
    // on a phone 71-phone crops the strip on purpose (object-fit: cover), so its box is not the map's shape
    const ok = out.every(o => o.bottom <= o.vh && (o.w < 761 || o.shape < 0.02));
    return { ok, detail: out.map(o => `${o.w}x${o.h}: button ends at ${o.bottom} of ${o.vh}, map ${o.mapH}px tall, shape off by ${(o.shape * 100).toFixed(1)}%`).join('; ') };
  },
};
