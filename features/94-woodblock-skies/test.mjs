// Woodblock skies: every scene draws a valid colour print within budget, the hour follows the event, the land follows
// the player's home, drawing is pure and repeatable, the menu switches back to the woodcut, and axe finds nothing.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const dropFontCsp = errs => { for (let i = errs.length - 1; i >= 0; i--) if (/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1); };

// an event the player can see, queued at the head (the first ready one the world offers)
const EVENT = `(() => { A.S.queue = []; UI.ov = null; const pc = A.pc(); let q = null;
  for (let g = 0; g < 60 && !q; g++) { A.advance(30); const h = A.S.queue[0]; if (h && h.type === 'event') { const v = A.eventView(h); if (v && v.choices && v.choices.length >= 2 && !v.skip) { q = h; A.S.queue = [h]; break; } } A.S.queue = []; if (!pc.alive) { pc.alive = true; pc.health = 80; } }
  UI.tab = 'life'; UI.render(); return q ? q.ev : null; })()`;

// every one of the five far lands is some far province's
const SKOK = c => ['jungle', 'savanna', 'taiga', 'alpine', 'scrub'].every(t => (c[t] || 0) > 0);

export default {
  // 25 scenes x 6 hours x 8 lands x 4 seasons: valid SVG, the same input gives the same string, other events and years
  // give other pictures, and each print is at most 15 KB (6 to 12 on average)
  async skyEveryShape(pg) {
    const r = await pg.evaluate(() => {
      const SK = UI.SKIES, bad = [], sizes = [];
      const shapes = Object.keys(SK.SCENE);
      for (const sh of shapes) for (const h of SK.HOUR_KEYS) for (const t of SK.TERRAIN_KEYS) for (const mo of [0, 4, 7, 10]) {
        if ((sh.length + h.length + t.length + mo) % 3) continue;   // a third of the grid, spread evenly
        const o = { hour: h, terr: t, coast: mo === 7, place: 'Kingsmere' }, svg = SK.svg(sh, 'ev_test|1105', mo, o);
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror')) bad.push(`${sh}/${h}/${t} parse`);
        if (svg !== SK.svg(sh, 'ev_test|1105', mo, o)) bad.push(`${sh}/${h}/${t} unstable`);
        if (/NaN|undefined/.test(svg)) bad.push(`${sh}/${h}/${t} NaN`);
        sizes.push(svg.length);
      }
      const keys = Array.from({ length: 12 }, (_, i) => 'ev_' + i + '|' + (1105 + (i % 3)));
      const distinct = shapes.map(sh => new Set(keys.map(k => SK.svg(sh, k, 4, { hour: 'day', terr: 'hills' }))).size);
      return { shapes: shapes.length, n: sizes.length, bad, max: Math.max(...sizes), min: Math.min(...sizes), avg: Math.round(sizes.reduce((a, x) => a + x, 0) / sizes.length), minDistinct: Math.min(...distinct) };
    });
    const ok = r.shapes === 25 && !r.bad.length && r.max <= 15 * 1024 && r.avg >= 6 * 1024 && r.avg <= 12 * 1024 && r.minDistinct >= 10;
    return { ok, detail: `${r.shapes} scenes, ${r.n} prints (hours x lands x seasons): sizes ${(r.min / 1024).toFixed(1)} to ${(r.max / 1024).toFixed(1)} KB, average ${(r.avg / 1024).toFixed(1)} KB; at least ${r.minDistinct} distinct pictures of 12 events per scene${r.bad.length ? '; BAD ' + r.bad.slice(0, 6).join(', ') : ''}` };
  },

  // the brief's mood mapping by event shape and words, the terrain and coast of the player's home province, and the
  // place name in the cartouche
  async skyHoursAndLand(pg) {
    const r = await pg.evaluate(() => {
      const SK = UI.SKIES, H = (sh, w = '') => new Set(Array.from({ length: 16 }, (_, i) => SK.hourFor(sh, 'ev_' + i + '|1105', w)));
      const one = (sh, w) => [...H(sh, w)].join('/');
      const hours = { love: one('love'), death: one('death'), tavern: one('tavern'), crime: one('crime'), war: one('war'), fight: one('fight'), weather: one('weather'),
        birth: one('kin', 'Your wife is brought to bed and a son is born.'), newYear: one('street', 'The new year comes in with bells.'), wedding: one('court', 'The wedding feast runs late.'),
        funeral: one('faith', 'The funeral is short.'), battle: one('travel', 'The battle is joined at noon.') };
      const want = { love: 'golden', death: 'dusk', tavern: 'night', crime: 'night', weather: 'storm', birth: 'dawn', newYear: 'dawn', wedding: 'golden', funeral: 'dusk' };
      const wrong = Object.entries(want).filter(([k, v]) => hours[k] !== v).map(([k]) => `${k}=${hours[k]}`);
      for (const k of ['war', 'fight', 'battle']) if (!hours[k].split('/').every(h => h === 'storm' || h === 'golden')) wrong.push(`${k}=${hours[k]}`);
      // land: a game started in a coastal province and one inland; the print's terrain is the home province's
      const lands = [];
      for (const coast of [true, false]) {
        A.newGame({ seed: 9401 + (coast ? 0 : 1), race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 22 });
        const pc = A.pc(), pr = Object.values(A.S.prov).find(p => !!p.coast === coast && p.owner === pc.realm) || A.S.prov[pc.home];
        pc.home = pr.id;
        const q = { type: 'event', ev: Object.keys(A.EV).find(id => !A.EV[id].trigger && A.evShape && A.evShape(A.EV[id]) === 'kin'), ctx: {} };
        const html = UI.SKIES.forQueue(q), box = document.createElement('div'); box.innerHTML = html;
        const svg = box.querySelector('svg'), cart = box.querySelector('.sky-cart');
        lands.push({ coast, terr: pr.terr, drawn: svg.dataset.terr, sea: /id="sk\w+_v"/.test(html), place: cart && cart.textContent === pr.name, label: svg.getAttribute('aria-label') });
      }
      return { hours, wrong, lands };
    });
    const landOk = r.lands.every(l => l.terr === l.drawn && l.place && l.sea === l.coast);
    return { ok: !r.wrong.length && landOk, detail: `hours: love ${r.hours.love}, death ${r.hours.death}, tavern ${r.hours.tavern}, war ${r.hours.war}, a birth ${r.hours.birth}, the new year ${r.hours.newYear}, a wedding ${r.hours.wedding}, a funeral ${r.hours.funeral}, a battle ${r.hours.battle}${r.wrong.length ? ' WRONG ' + r.wrong.join(', ') : ''}; ` +
      r.lands.map(l => `${l.coast ? 'coast' : 'inland'} home: ${l.terr} drawn as ${l.drawn}, sea band ${l.sea}, cartouche ${l.place}`).join('; ') };
  },

  // drawing events with their prints, the Chronicle and the map leaves the state and the random stream unchanged, draws
  // no Math.random, and the same event in the same year draws the same print again
  async skyPure(pg) {
    const r = await pg.evaluate(`(() => {
      A.newGame({ seed: 9411, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 24 });
      UI.screen = 'game'; UI.set.hints = false;
      const ev = ${EVENT};
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      let calls = 0; const MR = Math.random; Math.random = function () { calls++; return MR(); };
      const prints = [];
      for (let i = 0; i < 3; i++) { UI.render(); const sv = document.querySelector('svg.woodcut[data-print=sky]'); prints.push(sv ? sv.outerHTML : ''); }
      for (const t of ['book', 'world', 'life']) { UI.tab = t; UI.render(); }
      const q = A.S.queue[0], other = UI.SKIES.svg('travel', 'ev_x|1105', 4, { hour: 'day', terr: 'hills' });
      for (const sh of Object.keys(UI.SKIES.SCENE)) for (const h of UI.SKIES.HOUR_KEYS) UI.SKIES.svg(sh, 'ev_p|1106', 2, { hour: h, terr: 'forest', coast: true, place: 'X' });
      Math.random = MR;
      const same = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      // the same event next year draws another picture; this year, the same one
      const y = A.S.year, a = UI.SKIES.forQueue(q); A.S.year = y + 1; const b = UI.SKIES.forQueue(q); A.S.year = y; const c = UI.SKIES.forQueue(q);
      const strip = s => s.replace(/ sky-in/, '');
      return { ev, same, calls, printed: !!prints[0], stable: prints[0] === prints[1] && prints[1] === prints[2], year: strip(a) !== strip(b) && strip(a) === strip(c), other: !!other };
    })()`);
    const ok = r.printed && r.same && r.calls === 0 && r.stable && r.year;
    return { ok, detail: `event ${r.ev} drawn with its print ${r.printed}: state and random stream unchanged ${r.same}, Math.random calls ${r.calls}, the same markup on three draws ${r.stable}; same event, same year, same picture (another year another) ${r.year}` };
  },

  // the menu switches the colour prints off and back to 61's ink woodcuts; turning pictures off removes both
  async skyToggle(pg) {
    const r = await pg.evaluate(`(() => {
      A.newGame({ seed: 9421, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      UI.screen = 'game'; UI.set.hints = false;
      ${EVENT};
      UI.ov = { type: 'menu' }; UI.render(); const menu = document.body.innerHTML.includes('data-c="setSkies"'); UI.ov = null;
      const look = () => { UI.render(); const s = document.querySelector('#modal svg.woodcut, .mbox svg.woodcut'); return s ? (s.dataset.print === 'sky' ? 'sky' : 'woodcut') : 'none'; };
      const on = look(); UI.set.skies = false; const off = look(); UI.set.skies = true; UI.set.woodcuts = false; const none = look(); UI.set.woodcuts = true; const back = look();
      return { menu, on, off, none, back, def: UI.SKIES && true };
    })()`);
    const ok = r.menu && r.on === 'sky' && r.off === 'woodcut' && r.none === 'none' && r.back === 'sky';
    return { ok, detail: `menu toggle ${r.menu}; on: ${r.on}, colour skies off: ${r.off}, pictures off: ${r.none}, back on: ${r.back}` };
  },

  // the print on a phone: 390 x 140 proportions, full width of the sheet, the cartouche inside the print
  async skyPhone(pg, errs, { browser, file }) {
    const { openPage } = await import('../71-phone/screens.mjs');
    const { ctx, pg: p } = await openPage(browser, file, 'se', errs);
    let r;
    try {
      await p.evaluate(() => { A.newGame({ seed: 9431, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 }); UI.screen = 'game'; UI.set.hints = false; });
      await p.evaluate(EVENT); await p.waitForTimeout(200);
      r = await p.evaluate(() => {
        const s = document.querySelector('svg.woodcut[data-print=sky]'), c = document.querySelector('.sky-cart');
        if (!s) return null;
        const b = s.getBoundingClientRect(), cb = c ? c.getBoundingClientRect() : null;
        return { w: Math.round(b.width), h: Math.round(b.height), scene: typeof UI !== 'undefined' && !!UI.SCENE, vw: innerWidth, cart: !!cb && cb.right <= b.right + 0.5 && cb.top >= b.top && cb.bottom <= b.bottom };
      });
    } finally { await ctx.close(); }
    // with 92-scene-card the phone sheet lets the print grow into the spare height (sliced, never stretched): then the print
    // is full width and at least the brief's height, not exactly its proportions
    const ok = !!r && r.cart && (r.scene ? r.w >= r.vw - 1 && r.w / r.h <= 390 / 140 + 0.08 : Math.abs(r.w / r.h - 390 / 140) < 0.08);
    return { ok, detail: r ? `at 375 px the print is ${r.w} x ${r.h} (${(r.w / r.h).toFixed(2)}:1, the brief's 390 x 140 is 2.79:1); cartouche inside ${r.cart}${r.scene ? '; 92-scene-card grows it to the sheet' : ''}` : 'no print on the phone' };
  },

  // 0 axe violations (WCAG 2.2 AA) with an event and its colour print on screen, in both themes
  async skyAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const found = [];
    for (const theme of ['dark', 'light']) {
      const ev = await pg.evaluate(`(() => { A.newGame({ seed: 9441, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 22 }); UI.screen = 'game'; UI.set.hints = false;
        UI.set.theme = ${JSON.stringify(theme)}; UI.applySettings && UI.applySettings(); return ${EVENT}; })()`);
      const v = await pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).slice(0, 2).join(';')})`));
      const has = await pg.evaluate(() => !!document.querySelector('svg.woodcut[data-print=sky]'));
      found.push(...v.map(x => theme + ':' + x)); if (!has) found.push(theme + ': no print on screen (' + ev + ')');
    }
    dropFontCsp(errs);
    return { ok: !found.length, detail: `${found.length} axe violations with an event and its print on screen, dark and light${found.length ? ': ' + found.slice(0, 6).join(', ') : ''}` };
  },
  // the Great Continent's climates: a far province's biome picks its land (jungle, savanna, taiga, alpine pasture,
  // scrub), each new land prints for every scene within budget, a life in the far lands gets its home's climate, and a
  // Known World province keeps its word
  async skyFarLands(pg) {
    const r = await pg.evaluate(() => {
      const SK = UI.SKIES, bad = [], sizes = [];
      for (const t of SK.FAR_TERR) for (const sh of Object.keys(SK.SCENE)) for (const h of ['day', 'night', 'dusk']) {
        const svg = SK.svg(sh, 'ev_far|1105', 5, { hour: h, terr: t, place: 'Venshai' });
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror') || /NaN|undefined/.test(svg) || !svg.includes(`data-terr="${t}"`)) bad.push(t + '/' + sh + '/' + h);
        sizes.push(svg.length);
      }
      // the far lands' buildings: every style in the scenes that show houses and towers, within budget
      const archBad = [], archSizes = [];
      for (const a of SK.ARCH) for (const sh of ['street', 'tavern', 'kin', 'crime', 'menace', 'subordinate', 'errand']) {
        if (!SK.SCENE[sh]) continue;
        const svg = SK.svg(sh, 'ev_arch|1105', 5, { hour: 'day', terr: 'hills', arch: a });
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        if (doc.querySelector('parsererror') || /NaN|undefined/.test(svg) || !svg.includes(`data-arch="${a}"`) || svg === SK.svg(sh, 'ev_arch|1105', 5, { hour: 'day', terr: 'hills' })) archBad.push(a + '/' + sh);
        archSizes.push(svg.length);
      }
      A.newGame({ seed: 7101, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const count = {}, arches = {};
      for (const pv of LORE.map.provinces) { if (!pv || pv.id < 306) continue; const a = SK.archOf(pv); arches[a] = (arches[a] || 0) + 1; }
      const kwArch = LORE.map.provinces.filter(pv => pv && pv.id < 306).every(pv => !SK.archOf(pv));
      for (const pv of LORE.map.provinces) { if (!pv || pv.id < 306) continue; const t = SK.terrOf(pv); count[t] = (count[t] || 0) + 1; }
      const kwSame = LORE.map.provinces.filter(pv => pv && pv.id < 306).every(pv => SK.terrOf(pv) === (SK.TERRAIN[pv.terr] ? pv.terr : 'hills'));
      // a home in the far south's monsoon forest: the event's print is a jungle
      const home = LORE.map.provinces.find(pv => pv && pv.id >= 306 && SK.terrOf(pv) === 'jungle' && pv.realm && pv.realm !== 'unclaimed');
      let drawn = null;
      if (home) {
        const pc = A.pc(); pc.home = home.id; pc.loc = home.id;
        A.S.queue = [{ type: 'event', ev: 'lf_love_potion', forced: true, ctx: {} }]; UI.screen = 'game'; UI.render();
        const svg = document.querySelector('#modal svg.woodcut'); drawn = svg && svg.dataset.terr + '/' + (svg.dataset.arch || 'none');
      }
      return { n: sizes.length, bad, max: Math.max(...sizes), avg: Math.round(sizes.reduce((a, x) => a + x, 0) / sizes.length), count, kwSame, drawn, archBad, archMax: Math.max(...archSizes), arches, kwArch };
    });
    const ok = !r.bad.length && r.max <= 15 * 1024 && SKOK(r.count) && r.kwSame && /^jungle\/(stilt|eaves|round)$/.test(r.drawn || '') && !r.archBad.length && r.archMax <= 15 * 1024 && Object.keys(r.arches).filter(k => k !== 'null').length === 6 && r.kwArch;
    return { ok, detail: `${r.n} prints of the five far lands: ${(r.avg / 1024).toFixed(1)} KB average, ${(r.max / 1024).toFixed(1)} KB at most${r.bad.length ? ', BAD ' + r.bad.slice(0, 4).join(', ') : ''}; far provinces by land ${JSON.stringify(r.count)}; Known World words kept ${r.kwSame}; a jungle home draws ${r.drawn}; buildings ${JSON.stringify(r.arches)}, ${r.archBad.length} bad, at most ${(r.archMax / 1024).toFixed(1)} KB, none in the Known World ${r.kwArch}` };
  },

  // cycle 1 visual B3: January snowed on every land but the desert, the Scent Isles' palms included. Snow now follows
  // the home's climate: temperate, boreal and alpine land gets it, the wet tropics get rain and the dry belts dust.
  async skyClimate(pg) {
    const r = await pg.evaluate(() => {
      const SK = UI.SKIES;
      A.newGame({ seed: 7101, lands: 'great', race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const provs = Object.values(A.S.prov);
      const pick = re => provs.find(pv => re.test(pv.biome || '') && pv.terr !== 'mountains');
      const out = {};
      for (const [k, re] of [['tropic', /Tropical (rainforest|monsoon)/], ['savanna', /Savanna/], ['dry', /Dry woodland/], ['temperate', /Temperate forest/], ['taiga', /Taiga/]]) {
        const pv = pick(re); if (!pv) { out[k] = 'none'; continue; }
        const pc = A.pc(); pc.home = pv.id;
        const q = { type: 'event', ev: 'lf_love_potion', ctx: {} };
        const o = SK.optsFor(q);
        const svgs = ['faith', 'road', 'beast', 'kin'].map(sh => SK.svg(sh, 'clim|1105', 0, Object.assign({}, o, { hour: 'day' })));
        out[k] = { terr: o.terr, clim: o.clim || '', pal: SK.palette('day', o.terr, 0, false, SK.climOf ? SK.climOf(pv) : undefined).snow, drawn: svgs.filter(x => x.includes('data-snow="1"')).length };
      }
      return out;
    });
    const ok = ['tropic', 'savanna', 'dry'].every(k => r[k] !== 'none' && !r[k].pal && !r[k].drawn) && ['temperate', 'taiga'].every(k => r[k] !== 'none' && r[k].pal && r[k].drawn === 4);
    return { ok, detail: JSON.stringify(r) };
  },
};
