// Anime portraits: the same person draws the same picture and no two people draw the same; drawing is pure; the size
// and time budgets hold; markup in the state never reaches the SVG; every people, sex and age draws without falling
// back; the setting switches to the woodcut miniatures; the screens with portraits pass axe.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// in the page: people cloned from the player and changed, for drawing only (never added to the state)
const MAKE = () => {
  window.APT = {
    mk(o = {}) {
      const base = A.pc(), p = JSON.parse(JSON.stringify(base)), R = GD.RACES[o.race || 'human'];
      p.id = o.id || 'apt_' + (o.race || 'human') + (o.sex || 'M') + (o.age ?? 25);
      p.race = o.race || 'human'; p.sex = o.sex || 'M'; p.born = A.S.year - (o.age ?? Math.round(R.grown * 1.25));
      p.status = o.status || 'peasant'; p.ruler = o.ruler || null; p.mil = o.mil || null; p.job = o.job || null; p.house = o.house || null; p.noble = null;
      p.gear = Object.assign({ weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null }, o.gear || {});
      p.wounds = (o.wounds || []).map(k => ({ k })); p.quirks = o.quirks || []; p.alive = !o.dead; p.traits = o.traits || [];
      p.app = Object.assign({}, base.app, o.app || {});
      if (o.cult) p.cult = o.cult;
      if (o.given) p.given = o.given;
      return p;
    },
    // the life stages of each people, scaled to how fast they grow and age: newborn, 6, 14, 25, 45, 70 in human years
    bands(race) { const r = GD.RACES[race]; return [0, Math.round(r.grown * .3), Math.round(r.grown * .7), Math.round(r.grown * 1.25), Math.round((r.primeEnd + r.old) / 2), Math.round(r.old * 1.25)]; },
    parse(svg) { const d = new DOMParser().parseFromString(svg, 'image/svg+xml'); return !d.querySelector('parsererror') && d.documentElement.nodeName === 'svg'; },
    // everyone the tests draw: every people, sex and age, plus rank, arms, wounds and the dead
    cast() {
      const out = [], realms = Object.keys(A.S.realms), house = Object.values(A.S.houses || {}).find(h => h.colors && h.charge);
      for (const race of Object.keys(GD.RACES)) for (const sex of ['M', 'F']) for (const age of APT.bands(race)) out.push(APT.mk({ race, sex, age }));
      const hs = ['short', 'long', 'braided', 'tied', 'ponytail', 'topknot', 'curly', 'locks', 'wild', 'shaved', 'bald', 'mohawk', 'cropped'];
      const beards = ['none', 'stubble', 'short', 'full', 'long', 'braided', 'forked', 'goatee', 'mustache', 'muttonchops'];
      const cults = Object.keys(UI.MINI && UI.MINI.CULT || {}).concat(['CUL-01']);
      hs.forEach((h, i) => out.push(APT.mk({ id: 'apt_h' + i, race: ['human', 'dwarf', 'elf', 'orc'][i % 4], sex: i % 3 ? 'M' : 'F', age: 30, app: { hstyle: h, beard: beards[i % beards.length], hair: i % 11 }, cult: cults[i % cults.length] })));
      out.push(APT.mk({ id: 'apt_king', ruler: realms[0], status: 'royal', age: 45, app: { beard: 'short' } }));
      out.push(APT.mk({ id: 'apt_queen', sex: 'F', ruler: realms[1], status: 'royal', age: 33 }));
      out.push(APT.mk({ id: 'apt_lord', status: 'noble', house: house && house.id, age: 35 }));
      out.push(APT.mk({ id: 'apt_priest', job: { c: 'clergy', k: 'priest', r: 2 }, age: 50 }));
      out.push(APT.mk({ id: 'apt_knight', house: house && house.id, mil: { rank: 6, troop: 'HC', realm: realms[0] }, gear: { weapon: 'longsword', armor: 'plate', cloak: 'tabard', helm: 'greathelm' }, age: 32 }));
      out.push(APT.mk({ id: 'apt_spear', mil: { rank: 2, troop: 'HI', realm: realms[0] }, gear: { weapon: 'spear', armor: 'mail', helm: 'helm', shield: 'kite', ranged: 'longbow' }, age: 28 }));
      out.push(APT.mk({ id: 'apt_dwarfwar', race: 'dwarf', mil: { rank: 3, troop: 'HI', realm: realms[0] }, gear: { weapon: 'greataxe', armor: 'dwarfplate', helm: 'horned', cloak: 'furcloak' }, app: { hstyle: 'braided', beard: 'braided' }, age: 60 }));
      out.push(APT.mk({ id: 'apt_scarred', wounds: ['lost_eye', 'scar_face', 'lost_hand', 'broken_nose', 'ear', 'burn', 'brand'], age: 40 }));
      out.push(APT.mk({ id: 'apt_dead', dead: true, age: 50 }));
      out.push(APT.mk({ id: 'apt_deadelf', race: 'elf', sex: 'F', dead: true, age: 90 }));
      return out;
    },
  };
};

export default {
  // the same person always draws the same string; 400 people of a world draw 400 different pictures
  async apDeterministic(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 931, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 });
      const ppl = Object.values(A.S.people).filter(p => p.app).slice(0, 400);
      let same = 0, n = 0, viaCache = 0;
      const pics = new Set(), strip = s => s.replace(/ aria-label="[^"]*"/, '');
      for (const p of ppl) for (const size of [88, 32, 176]) {
        const a = UI.ANIME.svg(p, size, size === 176 ? {} : { bust: true }), b = UI.ANIME.svg(p, size, size === 176 ? {} : { bust: true });
        n++; if (a === b) same++;
        if (PORTRAIT.svg(p, size, size === 176 ? {} : { bust: true }) === a) viaCache++;
        if (size === 88) pics.add(strip(a));
      }
      const poses = {};
      for (const p of ppl) { const m = /data-pose="(\w+)"/.exec(UI.ANIME.svg(p, 176)); poses[m ? m[1] : '?'] = (poses[m ? m[1] : '?'] || 0) + 1; }
      return { n, same, viaCache, people: ppl.length, distinct: pics.size, poses };
    }));
    const ok = r.people >= 400 && r.same === r.n && r.viaCache === r.n && r.distinct === r.people;
    return { ok, detail: `${r.same} of ${r.n} drawings identical when drawn again (88 and 32 px busts, the 176 px full figure), ${r.viaCache} identical through the cache; ${r.distinct} distinct 88 px busts for ${r.people} people (names left out of the comparison); poses ${JSON.stringify(r.poses)}` };
  },

  // drawing six screens with portraits changes nothing in the game and draws no random number
  async apPure(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 934, race: 'elf', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 120 });
      UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.render();
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      UI.ANIME.clearCache();
      let anime = 0;
      for (const t of ['life', 'people', 'realm', 'legacy']) { UI.tab = t; UI.render(); anime += document.querySelectorAll('svg.portrait.anime').length; }
      UI.ov = { type: 'profile' }; UI.render(); anime += document.querySelectorAll('svg.portrait.anime').length;
      const someone = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc);
      UI.ov = { type: 'person', id: someone.id }; UI.render(); anime += document.querySelectorAll('svg.portrait.anime').length;
      UI.ov = null; UI.render();
      const same = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      return { same, anime, errors: UI.ANIME.errors };
    }));
    return { ok: r.same && r.anime >= 6 && r.errors === 0, detail: `state and random stream unchanged by drawing the life, people, realm and legacy tabs, the profile and a person's page: ${r.same}; anime portraits drawn on those screens: ${r.anime}; fallbacks ${r.errors}` };
  },

  // a bust is at most 8 KB at every size, a full figure at most 18 KB, and a portrait builds in at most 1 ms
  async apBudget(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 935, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const cast = APT.cast(), sizes = {}, over = [];
      for (const size of [20, 32, 48, 72, 88, 120]) {
        const L = cast.map(p => UI.ANIME.svg(p, size, { bust: true }).length);
        sizes[size] = { avg: Math.round(L.reduce((a, b) => a + b, 0) / L.length), max: Math.max(...L) };
        L.forEach((n, i) => { if (n > UI.ANIME.BUDGET.bust) over.push(`${cast[i].id}@${size}:${n}`); });
      }
      const F = cast.map(p => UI.ANIME.svg(p, 200).length);
      sizes.full = { avg: Math.round(F.reduce((a, b) => a + b, 0) / F.length), max: Math.max(...F) };
      F.forEach((n, i) => { if (n > UI.ANIME.BUDGET.full) over.push(`${cast[i].id}@full:${n}`); });
      // time: warm, then build everyone again without the cache; the best of three batches' averages (the machine may be
      // busy with other work, which is not the portrait's cost)
      const time = (size, opts) => { for (const p of cast) UI.ANIME.svg(p, size, opts); let best = Infinity; for (let b = 0; b < 3; b++) { const t0 = performance.now(); let n = 0; for (let k = 0; k < 2; k++) for (const p of cast) { UI.ANIME.svg(p, size, opts); n++; } best = Math.min(best, (performance.now() - t0) / n); } return best; };
      const t = { b32: time(32, { bust: true }), b88: time(88, { bust: true }), b120: time(120, { bust: true }), full: time(200, {}) };
      // and through the cache, as a page that draws the same people again
      for (const p of cast) PORTRAIT.svg(p, 88);
      const t0 = performance.now(); for (let k = 0; k < 4; k++) for (const p of cast) PORTRAIT.svg(p, 88); const cached = (performance.now() - t0) / (4 * cast.length);
      return { n: cast.length, sizes, over, t, cached };
    }));
    const worst = Math.max(r.t.b32, r.t.b88, r.t.b120, r.t.full);
    const ok = !r.over.length && worst <= 1;
    const kb = n => (n / 1024).toFixed(1);
    return { ok, detail: `${r.n} people; bust KB avg/max ${Object.entries(r.sizes).filter(([k]) => k !== 'full').map(([k, v]) => `${k}px ${kb(v.avg)}/${kb(v.max)}`).join(', ')}; full figure ${kb(r.sizes.full.avg)}/${kb(r.sizes.full.max)}; over budget: ${r.over.length ? r.over.slice(0, 4).join(', ') : 'none'}; build ms (uncached) 32px ${r.t.b32.toFixed(2)}, 88px ${r.t.b88.toFixed(2)}, 120px ${r.t.b120.toFixed(2)}, full ${r.t.full.toFixed(2)}; through the cache ${r.cached.toFixed(3)}` };
  },

  // markup in a name, an id, the colours and the gear never reaches the SVG; every paint is a checked colour
  async apEscaped(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 936, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const realm = A.realm(A.pc().realm), keepC = realm.color;
      realm.color = 'red"/><script>alert(1)</script>';
      const house = Object.values(A.S.houses || {}).find(h => h.colors), keepH = house && house.colors.slice(), keepCh = house && house.charge;
      if (house) { house.colors = ['"><img src=x onerror=alert(1)>', 'url(javascript:1)']; house.charge = '"><b>'; }
      const evil = APT.mk({ id: 'x"><script>', given: '<img src=x onerror=alert(1)>', app: { skin: 'red"/><script>alert(1)</script>', hair: '"><b>', hstyle: '"><i>', beard: '<b>', paint: '"><b>', jewel: '<i>' }, cult: '"><i>', house: house && house.id, traits: ['"><b>'] });
      evil.sur = '"><svg onload=alert(1)>'; evil.gear.weapon = '"><i>'; evil.gear.armor = '<b>'; evil.wounds = [{ k: '"><b>' }];
      const out = [];
      for (const [size, o] of [[200, {}], [88, { bust: true }], [32, { bust: true }]]) out.push(UI.ANIME.svg(evil, size, o));
      realm.color = keepC; if (house) { house.colors = keepH; house.charge = keepCh; }
      const bad = [];
      for (const s of out) {
        if (/<(script|img|b|i|svg onload|iframe)\b/i.test(s.slice(5))) bad.push('markup');
        if (!APT.parse(s)) bad.push('parse');
        const doc = new DOMParser().parseFromString(s, 'image/svg+xml');
        if (doc.querySelectorAll('script,img,b,i,foreignObject,a,iframe').length) bad.push('elements');
        for (const el of doc.querySelectorAll('*')) for (const a of el.attributes) {
          if (/^on/i.test(a.name)) bad.push('handler ' + a.name);
          if (a.name === 'href' && !/^#[A-Za-z0-9_]+$/.test(a.value)) bad.push('href ' + a.value.slice(0, 20));
        }
        for (const el of doc.querySelectorAll('*')) for (const at of ['fill', 'stroke', 'stop-color', 'flood-color']) {
          const v = el.getAttribute(at);
          if (v != null && !/^(#[0-9a-f]{3}|#[0-9a-f]{6}|none|url\(#[A-Za-z0-9_]+\))$/.test(v)) bad.push(`${el.nodeName}.${at}=${v.slice(0, 20)}`);
        }
      }
      return { bad: [...new Set(bad)], n: out.length };
    }));
    return { ok: !r.bad.length, detail: `markup in a name, an id, a skin, hair, realm and house colour, a charge, a culture, gear and a wound, drawn ${r.n} ways: ${r.bad.length ? 'leaked ' + r.bad.slice(0, 5).join(', ') : 'none reaches the SVG, every paint is a checked colour'}` };
  },

  // every people x sex x age band draws (busts and the full figure), as valid SVG, without falling back
  async apEveryPeople(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 937, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const e0 = UI.ANIME.errors, bad = [], poses = {}, expr = {};
      let n = 0;
      for (const race of Object.keys(GD.RACES)) for (const sex of ['M', 'F']) for (const age of APT.bands(race)) {
        const p = APT.mk({ race, sex, age });
        n++;
        for (const [size, o] of [[200, {}], [88, { bust: true }], [32, { bust: true }], [20, { bust: true }]]) {
          const s = PORTRAIT.svg(p, size, o);
          if (!/class="portrait mini anime/.test(s) || !APT.parse(s)) bad.push(`${race} ${sex} ${age} @${size}`);
          if (size === 200) { const m = /data-pose="(\w+)"/.exec(s); poses[m ? m[1] : '?'] = (poses[m ? m[1] : '?'] || 0) + 1; }
        }
        const k = UI.ANIME.look(p).expr.k; expr[k] = (expr[k] || 0) + 1;
      }
      // the special cast too: rulers, arms and armour, wounds, the dead
      for (const p of APT.cast().slice(84)) for (const [size, o] of [[200, {}], [88, { bust: true }]]) { const s = PORTRAIT.svg(p, size, o); if (!/class="portrait mini anime/.test(s) || !APT.parse(s)) bad.push(`${p.id} @${size}`); }
      return { n, races: Object.keys(GD.RACES).length, bad, errors: UI.ANIME.errors - e0, last: UI.ANIME.lastError, poses, expr };
    }));
    const ok = r.n === r.races * 12 && !r.bad.length && r.errors === 0;
    return { ok, detail: `${r.n} people (${r.races} peoples x 2 sexes x 6 ages) at 200 (full), 88, 32 and 20 px, and the special cast: ${r.bad.length} invalid${r.bad.length ? ' (' + r.bad.slice(0, 4).join(', ') + ')' : ''}, ${r.errors} fallbacks${r.last ? ' ' + r.last : ''}; full-figure poses ${JSON.stringify(r.poses)}` };
  },

  // the menu setting switches to the woodcut miniatures and back; the dead, rulers and nobles get their frames
  async apToggle(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 938, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      UI.screen = 'game'; UI.ov = { type: 'menu' }; UI.render();
      const box = document.querySelector('input[data-c="setAnime"]'), has = !!box, on = !!(box && box.checked);
      box.checked = false; UI.C.setAnime(box);
      UI.ov = null; UI.tab = 'life'; UI.render();
      const wood = !!document.querySelector('svg.portrait.mini') && !document.querySelector('svg.portrait.anime');
      UI.set.anime = true; UI.render();
      const back = !!document.querySelector('svg.portrait.anime');
      const king = UI.ANIME.svg(APT.mk({ id: 'apt_k', ruler: A.pc().realm, status: 'royal' }), 88, { bust: true });
      const dead = UI.ANIME.svg(APT.mk({ id: 'apt_d', dead: true }), 88, { bust: true });
      const T = UI.set.theme === 'light' ? { legend: '#8a4f00', ink3: '#565a70' } : { legend: '#ffb648', ink3: '#9a9cb8' };
      return { has, on, wood, back, kingFrame: king.includes(`stroke="${T.legend}"`), crown: /<circle r="13"/.test(king), deadFrame: dead.includes(`stroke="${T.ink3}"`) };
    }));
    const ok = r.has && r.on && r.wood && r.back && r.kingFrame && r.crown && r.deadFrame;
    return { ok, detail: `setting in the menu ${r.has}, on by default ${r.on}; off shows the woodcut miniatures ${r.wood}; on again ${r.back}; a ruler's gold frame and crown badge ${r.kingFrame && r.crown}; the dead's --ink-3 frame ${r.deadFrame}` };
  },

  // accessibility with portraits on screen: the people tab, the profile and a person's page
  async apAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).slice(0, 2).join(';')})`));
    const found = [];
    let shown = 0;
    await pg.evaluate(() => { A.newGame({ seed: 939, race: 'orc', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 }); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.tab = 'people'; UI.ov = null; UI.render(); });
    shown += await pg.evaluate(() => document.querySelectorAll('svg.portrait.anime').length);
    found.push(...(await scan()).map(v => 'people:' + v));
    await pg.evaluate(() => { UI.tab = 'life'; UI.ov = { type: 'profile' }; UI.render(); });
    shown += await pg.evaluate(() => document.querySelectorAll('svg.portrait.anime').length);
    found.push(...(await scan()).map(v => 'profile:' + v));
    await pg.evaluate(() => { const p = Object.values(A.S.people).find(x => x.alive && x.id !== A.S.pc); UI.ov = { type: 'person', id: p.id }; UI.render(); });
    shown += await pg.evaluate(() => document.querySelectorAll('svg.portrait.anime').length);
    found.push(...(await scan()).map(v => 'person:' + v));
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length && shown >= 3, detail: `${found.length} axe violations on the people tab, the profile and a person's page, with ${shown} anime portraits on those screens${found.length ? ': ' + found.slice(0, 5).join(', ') : ''}` };
  },
  // the Great Continent's peoples: every far culture draws (bust and full figure) in its land's dress and in skin, hair
  // and eye tones of its land's range, kin keep their order of tones, and a Known World person is drawn as before.
  // And the young are not drawn bald: the love interest of "A love philtre" (a man of 21 the release gave 'bald') came
  // out as an old, balding man.
  async apFarPeoples(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 7101, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      UI.screen = 'game'; UI.render();
      const e0 = UI.ANIME.errors, bad = [], byLand = {}, outRange = [];
      const S = GD.SKIN.human;
      const far = Object.values(LORE.cultures).filter(c => c.land && UI.ANIME.FAR_LAND[c.land] && c.race === 'human');
      for (const c of far) for (const sex of ['M', 'F']) for (const sk of [0, 7]) {
        const p = APT.mk({ id: 'apf_' + c.id + sex + sk, sex, age: 28, cult: c.id, app: { skin: S[sk], hair: 8, eye: 5 } });
        const L = UI.ANIME.look(p), F = UI.ANIME.farOf(c.id);
        for (const [size, o] of [[88, { bust: true }], [176, {}]]) { const s = PORTRAIT.svg(p, size, o); if (!/class="portrait mini anime/.test(s) || !APT.parse(s)) bad.push(c.id + '@' + size); }
        (byLand[c.land] = byLand[c.land] || new Set()).add(L.cult.cut);
        // the drawn skin is the land's own tone, run through the cel tune: compare by the tone it came from
        const want = S[sk === 0 ? F.sk[0] : F.sk[1]];
        const p2 = APT.mk({ id: p.id + 'x', sex, age: 28, cult: 'CUL-01', app: { skin: want, hair: 0, eye: 0 } });
        if (L.skin.b !== UI.ANIME.look(p2).skin.b) outRange.push(c.id + ':' + sk);
      }
      // the state itself: everyone the far world was made with has a look in their land's range (A.genAppearance is
      // wrapped), so the profile's words and the picture agree
      let farPeople = 0, outState = 0;
      for (const q of Object.values(A.S.people)) {
        const F = UI.ANIME.farOf(q.cult); if (!F || !(q.race === 'human' || q.race === 'halfelf') || !q.app) continue;
        farPeople++;
        const i = S.indexOf(String(q.app.skin).toLowerCase());
        if ((i >= 0 && (i < F.sk[0] || i > F.sk[1])) || (q.app.hair <= 8 && q.app.hair > F.hr[1]) || q.app.eye > F.ey[1]) outState++;
      }
      // a Known World person is untouched by the far table
      const kw = APT.mk({ id: 'apf_kw', cult: 'CUL-02', age: 30, app: { skin: S[0], hair: 8 } });
      const kwOk = !UI.ANIME.farOf('CUL-02') && UI.ANIME.look(kw).hair.b !== UI.ANIME.look(APT.mk({ id: 'apf_kw', cult: 'CUL-02', age: 30, app: { skin: S[0], hair: 0 } })).hair.b;
      // the young and 'bald'
      const ages = [18, 21, 26, 34, 52, 70].map(age => { const p = APT.mk({ id: 'apf_bald' + age, sex: 'M', age, app: { hstyle: 'bald' } }); const L = UI.ANIME.look(p); return [age, L.bald, L.st]; });
      return { cultures: far.length, lands: Object.keys(byLand).length, cuts: Object.fromEntries(Object.entries(byLand).map(([k, v]) => [k, [...v].join('/')])), bad, outRange, errors: UI.ANIME.errors - e0, kwOk, ages, farPeople, outState };
    }));
    const young = r.ages.filter(([a]) => a < 30), old = r.ages.filter(([a]) => a >= 45);
    const ok = r.cultures >= 90 && r.lands === 10 && !r.bad.length && !r.outRange.length && r.errors === 0 && r.kwOk && r.farPeople > 100 && r.outState === 0 && young.every(x => !x[1]) && old.every(x => x[1]);
    return { ok, detail: `${r.cultures} far cultures in ${r.lands} lands, M and F, palest and darkest stored skin, bust and full figure: ${r.bad.length} invalid, ${r.errors} fallbacks, ${r.outRange.length} out of their land's range; ` +
      `dress by land ${JSON.stringify(r.cuts)}; Known World untouched ${r.kwOk}; in the state, ${r.outState} of ${r.farPeople} far people outside their land's range; 'bald' drawn as ${r.ages.map(([a, b, st]) => a + ':' + (b ? 'bald' : st)).join(' ')}` };
  },

  // cycle 1 visual B4: the skin picked in creation is the skin the game draws. For a far people the swatch row offers
  // only their land's range, a pick outside it is pressed as the portrait presses it, and the preview carries the
  // culture; the Known World keeps all eight swatches.
  async apCreateSkin(pg) {
    const r = await pg.evaluate(() => {
      UI.A.newLife();
      const rid = Object.keys(LORE.realms).find(k => /Busimo/.test(LORE.realms[k].name));
      const row = () => { if ("crQuick" in UI) UI.crQuick = false; for (let st = 0; st < 6; st++) { UI.step = st; UI.render(); const sw = [...document.querySelectorAll('[data-v^="skin:"]')]; if (sw.length) return sw.map(e => e.dataset.v.slice(5)); } return []; };
      Object.assign(UI.cr, { race: 'human', realm: rid, sex: 'F', home: null, house: null });
      const far = row();
      UI.A.crApp('skin:' + GD.SKIN.human[0]); row();
      const pv = UI.crPreviewPerson(), chosen = UI.cr.app.skin, drawn = UI.ANIME.drawnApp(Object.assign({}, pv, { cult: UI.crCult() }), pv.app).skin;
      const hairShown = [...document.querySelectorAll('[data-v^="hair:"]')].filter(e => e.style.display !== 'none').length;
      Object.assign(UI.cr, { realm: 'POL-01', home: null, house: null });
      const kw = row();
      return { rid, far, chosen, drawn, previewCult: pv.cult || null, hairShown, kw: kw.length };
    });
    const ok = !!r.rid && r.far.length >= 2 && r.far.length < 8 && r.far.includes(r.chosen) && r.chosen === r.drawn && !!r.previewCult && r.hairShown < 11 && r.kw === 8;
    return { ok, detail: `${r.rid}: ${r.far.length} skin swatches offered (${r.far.join(' ')}); palest picked -> stored ${r.chosen}, drawn ${r.drawn}, preview culture ${r.previewCult}; ${r.hairShown} hair swatches shown; Known World ${r.kw} swatches` };
  },

  // cycle 1 visual I1: busts (the rail, rows, cut-ins) show no helmet, which covered the brow and the eyes at 88 px; the
  // full figure keeps it. A grown figure is 6 heads tall, and the features sit a quarter turned.
  async apBustNoHelm(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      // a grown person who wears a helm the full figure draws (it differs with the helm taken off)
      let p = null, fullH = '', fullN = '', bustH = '', bustN = '';
      for (const x of Object.values(A.S.people)) {
        if (!x.alive || A.age(x) < 20 || x.race !== 'human' || !x.gear || !x.gear.helm || x.ruler) continue;
        const save = JSON.stringify(x.gear);
        const fh = UI.ANIME.buildAt(x, 200, {}, 0), bh = UI.ANIME.buildAt(x, 88, { bust: true }, 0);
        x.gear.helm = null;
        const fn = UI.ANIME.buildAt(x, 200, {}, 0), bn = UI.ANIME.buildAt(x, 88, { bust: true }, 0);
        x.gear = JSON.parse(save);
        if (fh !== fn) { p = x; fullH = fh; fullN = fn; bustH = bh; bustN = bn; break; }
      }
      if (!p) return { none: true };
      const front = UI.ANIME.buildAt(p, 88, { bust: true, front: true }, 0), turned = UI.ANIME.buildAt(p, 88, { bust: true }, 0);
      return { bustSame: bustH === bustN, fullDiffers: fullH !== fullN, turned: front !== turned && /translate\(-[\d.]+ 0\)/.test(turned) };
    });
    const ok = r.bustSame && r.fullDiffers && r.turned;
    return { ok, detail: `a worn helm: in the bust ${r.bustSame ? 'not drawn' : 'DRAWN'}, in the full figure ${r.fullDiffers ? 'drawn' : 'missing'}; features a quarter turned ${r.turned}` };
  },
};
