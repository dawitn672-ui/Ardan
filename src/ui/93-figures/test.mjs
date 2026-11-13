// 93-figures: every person is drawn by the figure library. The same person always gives the same picture and the same
// seed the same faces; no two people of a world look alike; drawing is pure (no dice, no state); markup in the state
// never reaches a drawing; every people, sex, age and station draws without a fault; an old save gets its faces, the
// same ones every time, made from the appearance it holds; the creation screen's maker keeps what was chosen; gear is
// drawn by item with its two measures; and the budgets hold (compose under 6 ms and paint within 16 ms for a list
// portrait, the page's own frame a few hundred bytes).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const OLD_SAVE = path.join(root, 'tests/saves/v2-cycle2-1106.ardan');

// in the page: people cloned from the player and changed, for drawing only (never added to the state)
const MAKE = () => {
  window.FGT = {
    mk(o = {}) {
      const base = A.pc(), p = JSON.parse(JSON.stringify(base)), R = GD.RACES[o.race || 'human'];
      p.id = o.id || 'fgt_' + (o.race || 'human') + (o.sex || 'M') + (o.age ?? 25) + (o.tag || '');
      p.race = o.race || 'human'; p.sex = o.sex || 'M'; p.born = A.S.year - (o.age ?? Math.round(R.grown * 1.25));
      p.status = o.status || 'peasant'; p.ruler = o.ruler || null; p.mil = o.mil || null; p.job = o.job || null; p.house = o.house || null; p.noble = null; p.prison = null;
      p.gear = Object.assign({ weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null }, o.gear || {});
      p.wounds = (o.wounds || []).map(k => ({ k })); p.quirks = o.quirks || []; p.alive = !o.dead; p.traits = o.traits || [];
      p.app = Object.assign({}, base.app, { g: null, g2: null, hs: null, bd: null }, o.app || {});
      if (o.cult) p.cult = o.cult;
      if (o.given) p.given = o.given;
      return p;
    },
    bands(race) { const r = GD.RACES[race]; return [0, 1, Math.round(r.grown * .3), Math.round(r.grown * .7), Math.round(r.grown * 1.25), Math.round((r.primeEnd + r.old) / 2), Math.round(r.old * 1.25)]; },
    parse(svg) { const d = new DOMParser().parseFromString(svg, 'image/svg+xml'); return !d.querySelector('parsererror') && d.documentElement.nodeName === 'svg'; },
    cast() {
      const out = [], realms = Object.keys(A.S.realms), house = Object.values(A.S.houses || {}).find(h => h.colors && h.charge);
      for (const race of Object.keys(GD.RACES)) for (const sex of ['M', 'F']) for (const age of FGT.bands(race)) out.push(FGT.mk({ race, sex, age }));
      GD.HAIRSTYLES.forEach((hstyle, i) => out.push(FGT.mk({ tag: 'h' + i, sex: i % 2 ? 'F' : 'M', app: { hstyle, hair: i % 11, eye: i % 8 } })));
      GD.BEARDS.forEach((beard, i) => out.push(FGT.mk({ tag: 'b' + i, app: { beard, build: GD.BUILDS[i % GD.BUILDS.length] } })));
      for (const status of ['slave', 'serf', 'peasant', 'artisan', 'merchant', 'gentry', 'noble', 'royal']) for (const sex of ['M', 'F']) out.push(FGT.mk({ tag: status, status, sex, house: status === 'noble' && house ? house.id : null }));
      out.push(FGT.mk({ tag: 'ruler', ruler: realms[0], status: 'royal' }), FGT.mk({ tag: 'priest', job: { c: 'clergy', k: 'priest' } }), FGT.mk({ tag: 'prison', prison: { until: A.S.year + 2 } }));
      Object.keys(GD.GEAR).filter(k => GD.GEAR[k].slot === 'armor').forEach((armor, i) => out.push(FGT.mk({ tag: 'a' + armor, mil: { rank: i % 9, troop: ['LI', 'HI', 'HC', 'AR'][i % 4], realm: realms[0] }, gear: { armor, weapon: Object.keys(GD.GEAR).filter(k => GD.GEAR[k].slot === 'weapon')[i * 2 % 26], shield: i % 2 ? 'heater' : null, helm: ['helm', 'kettle', 'bascinet', null][i % 4], cloak: ['cloak', 'furcloak', 'finecloak', 'tabard', null][i % 5] } })));
      out.push(FGT.mk({ tag: 'w1', wounds: Object.keys(GD.WOUNDS) }), FGT.mk({ tag: 'dead', dead: true, age: 70 }), FGT.mk({ tag: 'old', age: 95 }), FGT.mk({ tag: 'giantold', race: 'giant', age: 300 }));
      return out;
    },
    hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); },
  };
};
const START = { seed: 9310, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 };

export default {
  // one person, one picture; one seed, the same faces and looks; no two people of a world drawn alike
  async fgDeterministic(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(START => {
      const world = () => {
        A.newGame(START);
        const ppl = Object.values(A.S.people).filter(p => p.app).slice(0, 320), L = A.V2.figure;
        return { ppl, codes: FGT.hash(ppl.map(p => p.id + ':' + p.app.g).join(',')), looks: FGT.hash(ppl.map(p => L.lookKey(UI.FIG.look(p))).join('\n')), noCode: ppl.filter(p => !A.LOOKS.valid(p.app.g)).length };
      };
      const W1 = world(), strip = s => s.replace(/ aria-label="[^"]*"/, '').replace(/\b[fi][0-9a-z]+_[0-9a-z]*/g, 'ID');
      let n = 0, same = 0; const pics = new Set(), faces = new Set();
      for (const p of W1.ppl.slice(0, 120)) { const a = UI.FIG.inline(p, 88, { bust: true }), b = UI.FIG.inline(p, 88, { bust: true }); n++; if (a && a === b) same++; pics.add(strip(a)); }
      for (const p of W1.ppl) faces.add(p.app.g);
      // children take after their parents: a child's face is nearer its parents' than a stranger's is
      const F = A.V2.figure.face, kids = Object.values(A.S.people).filter(p => p.app && (p.parents || []).length === 2 && p.parents.every(x => A.S.people[x] && A.S.people[x].app)).slice(0, 200);
      let near = 0, far = 0;
      kids.forEach((k, i) => { const g = F.unpack(k.app.g), pa = k.parents.map(x => F.unpack(A.S.people[x].app.g)), st = F.unpack(W1.ppl[(i * 7 + 3) % W1.ppl.length].app.g); near += (F.distance(g, pa[0]) + F.distance(g, pa[1])) / 2; far += F.distance(g, st); });
      const frame1 = PORTRAIT.svg(W1.ppl[0], 46), frame2 = PORTRAIT.svg(W1.ppl[0], 46);
      const W2 = world();
      return { n, same, people: W1.ppl.length, distinct: pics.size, faces: faces.size, noCode: W1.noCode, codesSame: W1.codes === W2.codes, looksSame: W1.looks === W2.looks, kids: kids.length, near: kids.length ? near / kids.length : 0, far: kids.length ? far / kids.length : 1, frameSame: frame1 === frame2 && /^<svg[^>]*class="portrait fig bust"/.test(frame1), errors: UI.FIG.errors };
    }, START));
    const ok = r.people >= 300 && r.same === r.n && r.distinct === r.n && r.faces === r.people && r.noCode === 0 && r.codesSame && r.looksSame && r.frameSame && r.errors === 0 && (r.kids < 5 || r.near < r.far);
    return { ok, detail: `${r.same} of ${r.n} drawings identical when drawn again; ${r.distinct} distinct pictures for ${r.n} people; ${r.faces} different face codes for ${r.people} people (${r.noCode} without one); the same seed again gives the same codes ${r.codesSame} and the same looks ${r.looksSame}; ${r.kids} children are nearer their parents' faces (${r.near.toFixed(2)}) than a stranger's (${r.far.toFixed(2)}); the page's frame is stable ${r.frameSame}; faults ${r.errors}` };
  },

  // drawing the screens with portraits changes nothing in the game and draws no random number, and neither does the
  // queue that makes the pictures afterwards
  async fgPure(pg) {
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 9311, race: 'elf', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 120 });
      UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.render();
      await UI.FIG.idle();
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      UI.FIG.clearCache();
      let frames = 0;
      const tabs = UI.GROUPS.flatMap(g => g.subs.map(s => s[0]));
      for (const t of tabs) { UI.tab = t; UI.render(); frames += document.querySelectorAll('svg.portrait.fig').length; }
      UI.ov = { type: 'profile' }; UI.render(); frames += document.querySelectorAll('svg.portrait.fig').length;
      const someone = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc);
      UI.ov = { type: 'person', id: someone.id }; UI.render(); frames += document.querySelectorAll('svg.portrait.fig').length;
      const drawnSync = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      await UI.FIG.idle();
      const filled = [...document.querySelectorAll('svg.portrait.fig image')].filter(im => /^blob:/.test(im.getAttribute('href') || '')).length, shown = document.querySelectorAll('svg.portrait.fig').length;
      const after = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      UI.ov = null; UI.tab = 'life'; UI.render();
      return { drawnSync, after, frames, filled, shown, errors: UI.FIG.errors, failed: UI.FIG.stats.failed, made: UI.FIG.stats.made };
    });
    const ok = r.drawnSync && r.after && r.frames >= 6 && r.shown > 0 && r.filled === r.shown && r.errors === 0 && r.failed === 0;
    return { ok, detail: `state and random stream unchanged by drawing every tab, the profile and a person's page: ${r.drawnSync}; still unchanged once the pictures were made: ${r.after}; ${r.frames} frames drawn; ${r.filled} of the ${r.shown} on the last screen hold their finished picture; ${r.made} pictures made, ${r.failed} not baked, faults ${r.errors}` };
  },

  // every people x sex x age band, every hair, beard, station, armour, weapon, wound, the dead: valid SVG, no bad number
  async fgEveryPeople(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 9312, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const cast = FGT.cast(), bad = []; let n = 0;
      for (const p of cast) for (const [size, o] of [[30, {}], [88, { bust: true }], [176, {}], [150, { figure: true }]]) {
        const s = UI.FIG.inline(p, size, o); n++;
        if (!s) bad.push(p.id + '@' + size + ' empty'); else if (/NaN|undefined|Infinity/.test(s)) bad.push(p.id + '@' + size + ' bad number'); else if (!FGT.parse(s)) bad.push(p.id + '@' + size + ' parse');
        else if ((s.match(/<path/g) || []).length < 12) bad.push(p.id + '@' + size + ' nearly empty');
      }
      const dead = UI.FIG.inline(cast.find(p => !p.alive), 88, { bust: true }), alive = UI.FIG.inline(cast[0], 88, { bust: true });
      return { n, people: cast.length, bad, errors: UI.FIG.errors, last: UI.FIG.lastError, deadClass: / dead"/.test(dead) && !/ dead"/.test(alive) };
    }));
    return { ok: !r.bad.length && r.errors === 0 && r.deadClass, detail: `${r.people} people drawn ${r.n} ways (30 px, an 88 px bust, 176 px two by three, the standing figure): ${r.bad.length ? 'FAILED ' + r.bad.slice(0, 5).join('; ') : 'all valid'}; faults ${r.errors}${r.last ? ' (' + r.last.slice(0, 120) + ')' : ''}; the dead are marked ${r.deadClass}` };
  },

  // markup in a name, an id, the colours, the appearance and the gear never reaches a drawing or the page's frame
  async fgEscaped(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 9313, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const realm = A.realm(A.pc().realm), keepC = realm.color;
      realm.color = 'red"/><script>alert(1)</script>';
      const house = Object.values(A.S.houses || {}).find(h => h.colors), keepH = house && house.colors.slice(), keepCh = house && house.charge;
      if (house) { house.colors = ['"><img src=x onerror=alert(1)>', 'url(javascript:1)']; house.charge = '"><b>'; }
      const evil = FGT.mk({ id: 'x"><script>', given: '<img src=x onerror=alert(1)>', status: 'noble', app: { skin: 'red"/><script>alert(1)</script>', hair: '"><b>', eye: '"><b>', hstyle: '"><i>', beard: '<b>', build: '<u>', height: '"><b>', g: '"><script>alert(1)</script>xx', g2: '<b>"', hs: '"><i>', bd: '<i>', paint: '"><b>', jewel: '<i>' }, cult: '"><i>', house: house && house.id, traits: ['"><b>'] });
      evil.sur = '"><svg onload=alert(1)>'; evil.gear.weapon = '"><i>'; evil.gear.armor = { id: '<b>', make: '"><b>', rarity: '<i>' }; evil.gear.cloak = '<b>'; evil.wounds = [{ k: '"><b>' }];
      const out = [];
      for (const [size, o] of [[200, {}], [88, { bust: true }], [32, { bust: true }], [150, { figure: true }]]) out.push(UI.FIG.inline(evil, size, o), PORTRAIT.svg(evil, size, o));
      realm.color = keepC; if (house) { house.colors = keepH; house.charge = keepCh; }
      const bad = [];
      for (const s of out) {
        if (!s) { bad.push('empty'); continue; }
        if (/<(script|img|b|i|u|svg onload|iframe)\b/i.test(s.slice(5))) bad.push('markup');
        const doc = new DOMParser().parseFromString(s, 'image/svg+xml');
        if (doc.querySelector('parsererror')) { bad.push('parse'); continue; }
        if (doc.querySelectorAll('script,img,b,i,u,foreignObject,a,iframe').length) bad.push('elements');
        for (const el of doc.querySelectorAll('*')) for (const a of el.attributes) {
          if (/^on/i.test(a.name)) bad.push('handler ' + a.name);
          if (a.name === 'href' && !/^(#[A-Za-z0-9_]+|blob:[A-Za-z0-9:\/.-]+)$/.test(a.value)) bad.push('href ' + a.value.slice(0, 20));
          if (['fill', 'stroke', 'stop-color', 'flood-color'].includes(a.name) && !/^(#[0-9a-f]{3}|#[0-9a-f]{6}|none|url\(#[A-Za-z0-9_]+\))$/i.test(a.value)) bad.push(`${el.nodeName}.${a.name}=${a.value.slice(0, 20)}`);
        }
      }
      return { bad: [...new Set(bad)], n: out.length, errors: UI.FIG.errors };
    }));
    return { ok: !r.bad.length && r.errors === 0, detail: `markup in a name, an id, a skin, hair, a face code, realm and house colours, a charge, a culture, gear and a wound, drawn ${r.n} ways: ${r.bad.length ? 'leaked ' + r.bad.slice(0, 5).join(', ') : 'none reaches the SVG or the frame, every paint is a checked colour'}; faults ${r.errors}` };
  },

  // the budgets: a list portrait composes in under 6 ms (CPU) and paints within 16 ms; the page's own frame is small and a
  // redrawn list is a lookup; large portraits are measured and reported
  async fgBudget(pg, errs, ctx) {
    await pg.evaluate(MAKE);
    await pg.evaluate(() => {
      A.newGame({ seed: 9314, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.app), seen = new Set(), pick = [];
      for (const p of ppl) { const k = (p.ruler ? 'r' : '') + p.status + (p.mil ? 'm' : '') + p.sex + (A.age(p) < 12 ? 'k' : ''); if (!seen.has(k) || pick.length < 30) { seen.add(k); pick.push(p); } if (pick.length >= 40) break; }
      window.FGB = { pick, looks: pick.map(p => UI.FIG.look(p)), run(crop, width, tier) { const L = A.V2.figure; let kb = 0; for (const look of FGB.looks) kb += L.compose(look, { crop, width, tier, id: 'b_' }).svg.length; return kb / FGB.looks.length / 1024; } };
      FGB.run('list', 46, 1);                      // warm
    });
    const n = await pg.evaluate(() => FGB.looks.length);
    const timed = async (crop, width, tier) => { const t0 = await ctx.cpu(); const kb = await pg.evaluate(([c, w, t]) => { let k = 0; for (let i = 0; i < 2; i++) k = FGB.run(c, w, t); return k; }, [crop, width, tier]); const t1 = await ctx.cpu(); return { ms: (t1 - t0) / (2 * n), kb }; };
    const c46 = await timed('list', 46, 1), c88 = await timed('list', 88, 1), c30 = await timed('chip', 30, 0), c176 = await timed('tall', 176, 2);
    // paint: the SVG as an image drawn on a canvas at twice the density, in CPU time (the images are decoded first)
    const paintOf = async (crop, width, tier, k, h) => {
      await pg.evaluate(async ([c, w, t, k2]) => {
        const L = A.V2.figure; FGB.imgs = [];
        for (const look of FGB.looks.slice(0, k2)) { const u = URL.createObjectURL(new Blob([L.compose(look, { crop: c, width: w, tier: t, id: 'b_' }).svg], { type: 'image/svg+xml' })), img = new Image(); img.src = u; await img.decode(); FGB.imgs.push(img); }
      }, [crop, width, tier, k]);
      const t0 = await ctx.cpu();
      await pg.evaluate(([w, h2]) => { for (const img of FGB.imgs) { const c = document.createElement('canvas'); c.width = w * 2; c.height = h2 * 2; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, c.width, c.height); x.getImageData(0, 0, 1, 1); } }, [width, h]);
      return ((await ctx.cpu()) - t0) / k;
    };
    const p46 = await paintOf('list', 46, 1, 20, 46), p88 = await paintOf('list', 88, 1, 20, 88), p176 = await paintOf('tall', 176, 2, 8, 264);
    const r = await pg.evaluate(async () => {
      // the page's frames
      UI.FIG.clearCache();
      const frames = FGB.pick.map(p => PORTRAIT.svg(p, 46)), frameMax = Math.max(...frames.map(s => s.length));
      const t0 = performance.now(); for (let k = 0; k < 20; k++) for (const p of FGB.pick) PORTRAIT.svg(p, 46); const lookup = (performance.now() - t0) / (20 * FGB.pick.length);
      await UI.FIG.idle();
      return { frameMax, lookup, made: UI.FIG.stats.made, errors: UI.FIG.errors };
    });
    const ok = c46.ms < 6 && c88.ms < 6 && c30.ms < 6 && p46 <= 16 && p88 <= 16 && r.frameMax < 1500 && r.lookup < .25 && r.errors === 0;
    return { ok, detail: `compose (CPU ms a portrait, ${n} people): 30 px ${c30.ms.toFixed(1)}, 46 px ${c46.ms.toFixed(1)}, 88 px ${c88.ms.toFixed(1)} (budget 6); the 176 px two-by-three ${c176.ms.toFixed(1)}; paint at twice the density (CPU ms a portrait): 46 px ${p46.toFixed(1)}, 88 px ${p88.toFixed(1)} (budget 16), the 176 px with its light and depth passes ${p176.toFixed(0)} (measured, made once off the press); SVG ${c46.kb.toFixed(0)} KB at 46 px, ${c176.kb.toFixed(0)} KB at 176; the page's frame at most ${r.frameMax} bytes; a redrawn portrait is a lookup of ${(r.lookup * 1000).toFixed(0)} microseconds; faults ${r.errors}`, data: { c30, c46, c88, c176, p46, p88, p176, ...r } };
  },

  // an old save (before faces): everyone gets a face on load, the same one every time, leaning the way the old fields say
  async fgOldSave(pg) {
    if (!fs.existsSync(OLD_SAVE)) return { ok: true, skip: 'tests/saves/v2-cycle2-1106.ardan is not here' };
    const b64 = fs.readFileSync(OLD_SAVE).toString('base64');
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(async b64 => {
      const bin = atob(b64), bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const load = async () => {
        const d = await SAVES.decode(bytes), had = Object.values(d.S.people).filter(p => p && p.app && p.app.g).length;
        UI.enterSaveSafe(d);
        const ppl = Object.values(A.S.people).filter(p => p && p.app);
        return { had, ppl, n: ppl.length, valid: ppl.filter(p => A.LOOKS.valid(p.app.g)).length, codes: FGT.hash(ppl.map(p => p.id + ':' + p.app.g).sort().join(',')), given: A.LOOKS.last, rng: JSON.stringify(A.rngState) };
      };
      const a = await load(), F = A.V2.figure.face, mean = (ppl, k) => ppl.length ? ppl.reduce((s, p) => s + F.unpack(p.app.g)[k], 0) / ppl.length : 0;
      const strong = mean(a.ppl.filter(p => p.app.nose === 2), 'noseLen'), small = mean(a.ppl.filter(p => p.app.nose === 0), 'noseLen');
      const narrow = mean(a.ppl.filter(p => p.app.eyeShape === 1), 'lids'), round = mean(a.ppl.filter(p => p.app.eyeShape === 0), 'lids');
      const pc = A.pc(), pcPic = UI.FIG.inline(pc, 88, { bust: true });
      // the state written by this build and read again keeps every face and is given none anew
      A.deserialize(A.serialize());
      const kept = FGT.hash(Object.values(A.S.people).filter(p => p && p.app).map(p => p.id + ':' + p.app.g).sort().join(',')) === a.codes && A.LOOKS.last === 0;
      const b = await load();
      UI.tab = 'life'; UI.ov = null; UI.render(); await UI.FIG.idle();
      return { had: a.had, n: a.n, valid: a.valid, given: a.given, kept, sameAgain: a.codes === b.codes, strong, small, narrow, round, drew: pcPic.length > 2000, errors: UI.FIG.errors };
    }, b64));
    const ok = r.had === 0 && r.n > 50 && r.valid === r.n && r.given > 50 && r.kept && r.sameAgain && r.strong > r.small && r.round > r.narrow && r.drew && r.errors === 0;
    return { ok, detail: `a save from before faces (${r.had} codes in it): ${r.valid} of ${r.n} people have a face after loading (${r.given} given on load, the rest as they were made); written and read again by this build nothing changes ${r.kept}; loading the old save again gives the same faces ${r.sameAgain}; a "strong" nose in the save is a longer nose (${r.strong.toFixed(2)} against ${r.small.toFixed(2)} for "small"), "round" eyes more open than "narrow" (${r.round.toFixed(2)} against ${r.narrow.toFixed(2)}); the player draws ${r.drew}; faults ${r.errors}` };
  },

  // the maker at creation: a slider and a named shape change the code, a pasted code is checked, and the life that
  // begins has the face that was made, through a save and back
  async fgMaker(pg) {
    const r = await pg.evaluate(async () => {
      const L = A.V2.figure, M = UI.FIG.M, out = {};
      UI.A.newLife(); UI.A.crStep(1);
      const c = UI.cr;
      out.maker = !!document.querySelector('.fg-maker') && document.querySelectorAll('.fg-sl input[type=range]').length >= 8;
      out.code0 = c.app.g; out.valid0 = !!L.face.unpack(c.app.g) && !!L.unpack2(c.app.g2);
      // a slider, dragged: the input event redraws the picture beside it at once, the change event settles it
      const sl = document.querySelector('.fg-sl input[data-k="jawW"]'); sl.value = '1'; sl.dispatchEvent(new Event('input', { bubbles: true }));
      out.live = !!document.querySelector('.create-side svg.portrait.fig path');
      sl.dispatchEvent(new Event('change', { bubbles: true }));
      out.jaw = L.face.unpack(c.app.g).jawW; out.codeShown = document.querySelector('input[data-c="fgCode"]').value === c.app.g;
      UI.A.fgPre('Nose|Aquiline'); out.nose = L.face.unpack(c.app.g).noseBridge;
      UI.A.fgTab('Body'); UI.A.fgBuild('Brawny'); out.muscle = L.unpack2(c.app.g2).muscle;
      UI.A.fgTab('Hair'); out.thumbs = document.querySelectorAll('.fg-th').length; UI.A.fgSet('hs:braid'); out.hs = c.app.hs + '/' + c.app.hstyle;
      for (const t of ['Face', 'Eyes', 'Nose & mouth', 'Hair', 'Skin', 'Body']) UI.A.fgTab(t);
      // a pasted code: a bad one is refused, a good one is taken
      const want = L.codeFor('someone else', { sex: 'M', race: 'human', app: {} });
      let inp = document.querySelector('input[data-c="fgCode"]'); inp.value = 'not a face <b>'; UI.C.fgCode(inp); out.refused = c.app.g !== 'not a face <b>' && inp.value === c.app.g;
      inp = document.querySelector('input[data-c="fgCode"]'); inp.value = want; UI.C.fgCode(inp); out.pasted = c.app.g === want;
      M.set(c, 'cleft', 1);
      const g = c.app.g, g2 = c.app.g2;
      // the life begins with it
      UI._newLifeOk = true; c.seed = 'fgmaker'; c.startAge = 25; UI.startLife(); UI._newLifeOk = false;
      const pc = A.pc(); out.born = pc.app.g === g && pc.app.g2 === g2 && pc.app.hs === 'braid';
      const look = UI.FIG.look(pc); out.look = look.hair === 'braid' && Math.abs(look.g.cleft - 1) < .01 && Math.abs(look.g.noseBridge - L.face.unpack(g).noseBridge) < .01;
      const text = A.serialize(); A.deserialize(text); const pc2 = A.pc(); out.kept = pc2.app.g === g && pc2.app.g2 === g2 && pc2.app.hs === 'braid';
      UI.screen = 'game'; UI.render(); await UI.FIG.idle();
      out.errors = UI.FIG.errors;
      return out;
    });
    const ok = r.maker && r.valid0 && r.live && r.jaw > .9 && r.codeShown && r.nose > .9 && r.muscle > .9 && r.thumbs >= 25 && r.hs === 'braid/braided' && r.refused && r.pasted && r.born && r.look && r.kept && r.errors === 0;
    return { ok, detail: `the maker is on the Body & face step ${r.maker}; a new life starts with both codes ${r.valid0}; dragging "jaw width" redraws the picture at once ${r.live} and sets the code (${r.jaw}), the field shows it ${r.codeShown}; a named nose sets its features (${r.nose}); a named build sets the frame (${r.muscle}); ${r.thumbs} hair styles shown, a choice is kept (${r.hs}); a bad pasted code is refused ${r.refused}, a good one taken ${r.pasted}; the life begins with the face that was made ${r.born} and is drawn with it ${r.look}; a save keeps it ${r.kept}; faults ${r.errors}` };
  },

  // gear on the figure is keyed by item: the item's own make and rarity are drawn, and a new item is one registration
  async fgGearByItem(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 9316, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 28 });
      const L = A.V2.figure, look = p => UI.FIG.look(p), item = (p, id) => look(p).gear.find(g => g.id === id);
      const plain = FGT.mk({ tag: 'g1', status: 'gentry', gear: { weapon: 'sword' } }), fine = FGT.mk({ tag: 'g1', status: 'gentry', gear: { weapon: { id: 'sword', make: 3, rarity: 3 } } });
      const a = item(plain, 'sword'), b = item(fine, 'sword');
      const drawnApart = UI.FIG.inline(plain, 176, { figure: true }) !== UI.FIG.inline(fine, 176, { figure: true });
      L.registerGear('e2_test_blade', { art: 'sword', q: 2, r: 1, long: 1 });
      const c = item(FGT.mk({ tag: 'g2', status: 'gentry', gear: { weapon: 'e2_test_blade' } }), 'sword');
      const plate = look(FGT.mk({ tag: 'g3', status: 'noble', gear: { armor: { id: 'plate', make: 3, rarity: 2 }, weapon: 'longsword', shield: 'heater' } })).gear;
      const pieces = ['cuisses', 'greaves', 'poleyns', 'sabatons', 'breastplate', 'fauld', 'tassets', 'rerebraces', 'vambraces', 'couters', 'gauntlets', 'besagews', 'pauldrons', 'gorget'].filter(id => plate.some(g => g.id === id && g.q === 3 && g.r === 2));
      const unknown = look(FGT.mk({ tag: 'g4', gear: { weapon: 'no_such_thing', armor: 'nor_this' } })).gear.length > 0;
      const everyId = Object.keys(GD.GEAR).filter(k => ['weapon', 'armor', 'shield', 'helm', 'cloak'].includes(GD.GEAR[k].slot)), noRow = everyId.filter(k => !Object.prototype.hasOwnProperty.call(L.GEAR_ART, k));
      return { a, b, drawnApart, c, pieces: pieces.length, shield: plate.some(g => g.id === 'shield'), unknown, ids: everyId.length, noRow, errors: UI.FIG.errors };
    }));
    const ok = r.a && r.b && r.a.q === 1 && r.b.q === 3 && r.b.r === 3 && r.drawnApart && r.c && r.c.q === 2 && r.c.r === 1 && r.pieces === 14 && r.shield && r.unknown && !r.noRow.length && r.errors === 0;
    return { ok, detail: `a plain sword is drawn plain (make ${r.a && r.a.q}), the same item carrying make 3 and rarity 3 is drawn so (${r.b && r.b.q}, ${r.b && r.b.r}) and the two pictures differ ${r.drawnApart}; an item registered at run time is drawn (${r.c ? 'sword, make ' + r.c.q + ', rarity ' + r.c.r : 'missing'}); a masterwork epic harness is ${r.pieces} of 14 pieces, each with its measures, and its shield ${r.shield}; an unknown item draws the person without it ${r.unknown}; ${r.ids} item ids of the game, ${r.noRow.length ? 'without a row: ' + r.noRow.join(', ') : 'each with a row'}; faults ${r.errors}` };
  },
};
