// Every sample save in tests/saves/ (one or more per milestone, made by tools/make-save.mjs) still opens in this build
// through the real load path, holds the v2 invariants (A.V2SAVE.check), and plays on for a year. A change that breaks
// an old save fails here.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'saves');
const SAVES_LIST = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.ardan')).sort() : [];

export default {
  async savesStillLoad(pg) {
    const res = [];
    for (const f of SAVES_LIST) {
      const b64 = fs.readFileSync(path.join(DIR, f)).toString('base64');
      const r = await pg.evaluate(async (b64) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const out = {};
        try {
          const d = await SAVES.decode(bytes);
          out.ver = d.S.ver; out.year0 = d.S.year;
          out.loaded = UI.enterSaveSafe(d);
          out.bad0 = A.V2SAVE && A.V2SAVE.check ? A.V2SAVE.check() : [];
          out.play = T.play(1); out.year1 = A.S.year;
          out.bad1 = A.V2SAVE && A.V2SAVE.check ? A.V2SAVE.check() : [];
          UI.tab = 'life'; UI.ov = null; UI.render();
        } catch (e) { out.err = String(e && e.message || e).slice(0, 200); }
        return out;
      }, b64);
      res.push({ f, ...r, ok: !r.err && r.loaded !== false && !r.bad0.length && (r.play === 'ok' || r.play === 'dead') && !r.bad1.length });
    }
    const ok = SAVES_LIST.length > 0 && res.every(r => r.ok);
    return { ok, detail: `${SAVES_LIST.length} saves: ` + res.map(r => `${r.f} ${r.ok ? 'ok' : 'FAILED'} (format ${r.ver}, ${r.year0} -> ${r.year1}${r.err ? ', ' + r.err : ''}` +
      `${(r.bad0 || []).length || (r.bad1 || []).length ? ', broken: ' + [...(r.bad0 || []), ...(r.bad1 || [])].slice(0, 3).join('; ') : ''})`).join('; ') };
  },
  // P3 (order 54, D-062): once a life is saved, "Start a new life" from the menu (or Begin on the title screen) must
  // start a different life. The confirm's yes used to clear its pass before the deferred start ran, so the question
  // came back for ever, and the menu stayed open over the creation screen. Real clicks, so the deferred start runs.
  async newLifeAfterSave(pg) {
    const born = () => pg.evaluate(() => { const b = document.querySelector('[data-a=crQuick][data-v=born]') || document.querySelector('[data-a=startLife]'); return b ? (b.dataset.v ? '[data-a=crQuick][data-v=born]' : '[data-a=startLife]') : null; });
    const wait = (f, a) => pg.waitForFunction(f, a, { timeout: 60000 });
    await pg.evaluate(() => { UI.screen = 'title'; UI.render(); });
    await pg.click('[data-a=newLife]');
    await pg.click(await born());
    await wait(() => UI.screen === 'game' && A.S && A.pc() && A.pc().alive);
    const first = await pg.evaluate(async () => { A.advance(40); A.S.queue.length = 0; await UI.save(true); await SAVES.init(); return { seed: A.S.seed, id: A.S.pc, name: A.pc().given, saved: (SAVES.listCache || []).some(x => x.slot === 'cur' && x.meta && x.meta.alive) }; });
    // the menu's "Start a new life": the menu closes, the creation screen is free to use
    await pg.evaluate(() => { UI.ov = { type: 'menu' }; UI.renderModal(); });
    await pg.click('#modal [data-a=newLife]');
    const menuGone = await pg.evaluate(() => UI.screen === 'create' && !UI.ov && !document.querySelector('#modal'));
    await pg.click(await born());
    await wait(() => UI.ov && UI.ov.type === 'confirm');
    await pg.click('#modal [data-a=cfYes]');
    let started = true;
    try { await wait(s => UI.screen === 'game' && A.S && A.S.seed !== s && A.pc() && A.pc().alive, first.seed); } catch (e) { started = false; }
    const second = await pg.evaluate(() => ({ seed: A.S.seed, name: A.pc() && A.pc().given, ov: UI.ov && UI.ov.type, screen: UI.screen }));
    const ok = first.saved && menuGone && started && second.seed !== first.seed && !second.ov;
    return { ok, detail: `first ${first.name} (seed ${first.seed}, saved ${first.saved}); menu closed on the creation screen: ${menuGone}; after "Start the new life": ${second.screen}, ${second.name} (seed ${second.seed})${second.ov ? ', a ' + second.ov + ' box still open' : ''}` };
  },
};
