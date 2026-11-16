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
};
