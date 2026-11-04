// 99998-v2-saves: a v2 save round-trips exactly; an old save (the release's, cycle 2's) migrates once into a consistent
// v2 world and plays on; migrating twice changes nothing; a newer save is refused.
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const VENDOR = here('../../vendor/ardan-b593143.html');
const CYCLE2 = here('./cycle2-1106.ardan');

// in a page of any build: a life of `years` years by code, and its save as base64
const MAKE = async ([o, years]) => {
  A.newGame(o); UI.screen = 'game'; UI.render();
  const end = A.S.year + years;
  for (let g = 0; g < 5000 && A.S.year < end; g++) {
    A.advance(400); let h, k = 0;
    while ((h = A.headReady()) && k++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
    if (!A.pc() || !A.pc().alive) break;
  }
  const B = (await SAVES.encode(A.S, A.J)).bytes;
  let s = ''; for (let i = 0; i < B.length; i += 8192) s += String.fromCharCode.apply(null, B.subarray(i, i + 8192));
  return btoa(s);
};
async function releaseSave(browser) {
  const ctx = await browser.newContext(), pg = await ctx.newPage();
  try {
    await pg.goto(pathToFileURL(VENDOR).href);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true || (typeof A !== 'undefined' && typeof UI !== 'undefined' && typeof SAVES !== 'undefined' && A.newGame && A.EV && Object.keys(A.EV).length > 100), null, { timeout: 120000 });
    return await pg.evaluate(MAKE, [{ seed: 77, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 }, 3]);
  } finally { await ctx.close(); }
}

// in the v2 page: load an old save through the real load path, check it, migrate again, play two years, check again
const MIGRATE = async (b64) => {
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const SV = A.V2SAVE, out = {};
  const d = await SAVES.decode(bytes);
  out.ver0 = d.S.ver; out.rng0 = d.S.rng; out.people0 = Object.keys(d.S.people).length;
  out.loaded = UI.enterSaveSafe(d);
  out.last = SV.last; out.rng1 = A.rngState; out.people1 = Object.keys(A.S.people).length;
  out.bad0 = SV.check();
  // the same save again gives the same world, and an upgrade of the upgraded state changes nothing
  const one = JSON.stringify(A.S);
  const d2 = await SAVES.decode(bytes); UI.enterSaveSafe(d2);
  out.sameTwice = JSON.stringify(A.S) === one;
  SV.upgrade(A.S); A.deserialize(JSON.parse(JSON.stringify(A.S)));
  out.idempotent = JSON.stringify(A.S) === one && SV.last === null;
  // through a save of its own: exact, and no second migration
  const e = await SAVES.encode(A.S, A.J), d3 = await SAVES.decode(e.bytes);
  out.reSaved = JSON.stringify(d3.S) === JSON.stringify(A.S);
  // a fresh journal, based on the migrated state (not a replay of the old world from its start)
  out.journal = !!(A.J && A.J.o === null && A.J.base === A.fingerprint(A.jBase));
  out.play = T.play(2);
  out.year = A.S.year;
  out.bad1 = SV.check();
  // no percentage on any screen
  const pct = [];
  for (const t of T.tabs()) { UI.tab = t; UI.ov = null; UI.render(); const m = (document.body.innerText || '').match(/[^\n]{0,30}\d\s?%[^\n]{0,20}/); if (m) pct.push(t + ': ' + m[0]); }
  UI.tab = 'life'; UI.render();
  out.pct = pct;
  out.facts = { v2map: A.S.v2map, court: Object.keys((A.S.court || {}).realms || {}).length, kin: (A.pc().flags || {}).v2_family, body: !!A.pc().v2 };
  return out;
};
const verdict = (r, label) => {
  const ok = r.loaded && r.ver0 === 13 && r.last && r.last.from === 13 && r.last.steps.length === 8 && r.rng1 === r.rng0
    && !r.bad0.length && r.sameTwice && r.idempotent && r.reSaved && r.journal && r.play === 'ok' && !r.bad1.length && !r.pct.length;
  return {
    ok, detail: `${label}: version ${r.ver0} migrated once (${r.last && r.last.steps.join(', ')}), ${r.people0} -> ${r.people1} people, stream kept ${r.rng1 === r.rng0}; ` +
      `invariants after load [${r.bad0.join('; ') || 'all hold'}], after 2 years to ${r.year} [${r.bad1.join('; ') || 'all hold'}]; the same twice ${r.sameTwice}, ` +
      `migrating again changes nothing ${r.idempotent}, its own save exact ${r.reSaved}, fresh journal ${r.journal}; ${r.facts.court} courts, map ${r.facts.v2map && r.facts.v2map.seed}; ` +
      `percentages on screen: ${r.pct.length ? r.pct.join(' | ') : 'none'}`,
  };
};

export default {
  // a v2 life of 8 years: the save holds every v2 field and comes back exactly, key order included; SAVES.clean leaves it
  // alone; no state string holds markup; loading it runs no migration; and its size against the release's packing
  async v2svRoundTrip(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 5, race: 'dwarf', realm: 'POL-20', status: 'artisan', sex: 'M' });
      T.play(8);
      const SV = A.V2SAVE, enc = await SAVES.encode(A.S, A.J), a = JSON.stringify(A.S);
      const d = await SAVES.decode(enc.bytes), b = JSON.stringify(d.S);
      const c = JSON.parse(b); SAVES.clean({ S: c, meta: {} });
      const markup = []; (function walk(v, p) { if (typeof v === 'string') { if (/[<>]/.test(v)) markup.push(p); return; } if (v && typeof v === 'object') for (const k in v) walk(v[k], p + '.' + k); })(A.S, 'S');
      const fields = { v2map: !!A.S.v2map, v2t: !!A.S.v2t, body: !!A.pc().v2, court: !!A.S.court, v2dip: !!A.S.v2dip, v2w: !!A.S.v2w, kin: !!A.pc().flags.v2_family };
      // sizes: this build's packing, and the release's (houses only)
      const packed = JSON.stringify(A.packState(A.S)), rel = JSON.parse(packed); delete rel.ppl; rel.people = A.S.people;
      const relS = JSON.stringify(rel), gz = async s => (await SAVES.gzip(s)).length;
      d.slot = 'file'; UI.enterSave(d);
      return { same: a === b, clean: JSON.stringify(c) === b, markup, fields, noMig: SV.last === null, after: JSON.stringify(A.S) === a,
        ver: d.S.ver, raw: [relS.length, packed.length], gz: [await gz(relS), await gz(packed)], kb: enc.bytes.length, bad: SV.check() };
    });
    const k = n => Math.round(n / 1024);
    const ok = r.same && r.clean && !r.markup.length && Object.values(r.fields).every(Boolean) && r.noMig && r.after && r.ver === 14 && !r.bad.length && r.gz[1] <= r.gz[0];
    return { ok, detail: `round trip ${r.same ? 'exact' : 'DIFFERS'}; clean leaves it ${r.clean}; markup in ${r.markup.slice(0, 3).join(', ') || 'no string'}; v2 fields ${JSON.stringify(r.fields)}; ` +
      `no migration on load ${r.noMig}, state after load the same ${r.after}; invariants [${r.bad.join('; ') || 'all hold'}]; ` +
      `size raw ${k(r.raw[0])} -> ${k(r.raw[1])} KB, gzipped ${k(r.gz[0])} -> ${k(r.gz[1])} KB (release packing -> v2), save ${k(r.kb)} KB` };
  },

  // the release's own save (vendor, 3 years) opens in v2
  async v2svOldRelease(pg, errs, { browser }) {
    const b64 = await releaseSave(browser);
    const r = await pg.evaluate(MIGRATE, b64);
    return verdict(r, 'release save');
  },

  // a save of the cycle-2 build (origin/claude/dreamy-sagan-anwszt, a Known World life by code, a year) opens in v2
  async v2svOldCycle2(pg) {
    const b64 = fs.readFileSync(CYCLE2).toString('base64');
    const r = await pg.evaluate(MIGRATE, b64);
    return verdict(r, 'cycle-2 save');
  },

  // a save from a newer version, a newer format, or the Great Continent is refused with a sentence, and the game goes on
  async v2svRefused(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 9, realm: 'POL-01', status: 'peasant' });
      const keep = JSON.stringify(A.S), out = {};
      const tryDecode = async bytes => { try { await SAVES.decode(bytes); return 'opened'; } catch (e) { return e.message; } };
      const S1 = JSON.parse(keep); S1.ver = A.SAVE_VER + 1;
      out.ver = await tryDecode((await SAVES.encode(S1, null)).bytes);
      const fmt = SAVES.FMT; SAVES.FMT = fmt + 1; const b2 = (await SAVES.encode(JSON.parse(keep), null)).bytes; SAVES.FMT = fmt;
      out.fmt = await tryDecode(b2);
      const S3 = JSON.parse(keep); S3.world = { v: 1, parts: ['ardan', 'far@2'] };
      out.far = await tryDecode((await SAVES.encode(S3, null)).bytes);
      const toasts = [], t = UI.toast; UI.toast = m => toasts.push(m);
      try { out.ui = UI.enterSaveSafe({ S: S1, J: null, meta: {}, fmt: 3 }); } finally { UI.toast = t; }
      out.toasts = toasts; out.kept = JSON.stringify(A.S) === keep;
      return out;
    });
    const ok = /newer version/.test(r.ver) && /newer version/.test(r.fmt) && /Great Continent/.test(r.far) && r.ui === false && /newer version/.test(r.toasts.join(' ')) && r.kept;
    return { ok, detail: `newer state: "${r.ver}"; newer format: "${r.fmt}"; far lands: "${r.far}"; loading it says "${r.toasts.join(' ')}", the game in play untouched ${r.kept}` };
  },
};
