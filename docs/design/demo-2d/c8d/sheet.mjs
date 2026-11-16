// C8d gate 1 · profile cards in the owner's manhwa reference style (owner orders 56, 57, 58; D-068).
// Everything on the sheet is drawn by code: src/ui/engine/figure/manhwa/ (a new layer of the figure library, used only here).
//   node docs/design/demo-2d/c8d/sheet.mjs             writes sheet.png, details.png, compare.png, one.png, measure.json
//   node docs/design/demo-2d/c8d/sheet.mjs --keep      also leaves the pages they were shot from (*.html)
//   node docs/design/demo-2d/c8d/sheet.mjs --only=sheet,one   some of them
//   node docs/design/demo-2d/c8d/sheet.mjs --measure   bytes and draw time per card (Chromium, 1x and 4x CPU)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..');
const M = await import(path.join(root, 'src/ui/engine/figure/manhwa/index.js'));
const { stream } = await import(path.join(root, 'src/ui/engine/figure/g.js'));
const NAMES = JSON.parse(fs.readFileSync(path.join(root, 'data/names.json'), 'utf8'));
const KEEP = process.argv.includes('--keep'), MEASURE = process.argv.includes('--measure');
const only = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- Ardan's own realms and peoples (src/core/release/core/00-lore.json; cultures: src/ui/engine/figure/cultures.js) ----
// the banner's colour and charge are this gate's proposal (the lore gives each realm a map colour, not arms): see c8d-gate1.md
export const REALMS = {
  Northreach: { name: 'Kingdom of Northreach', short: 'Northreach', title: 'King', cult: 'CUL-02', color: '#1f3f66', device: 'wolf', field: 'woad', field2: 'cream', where: 'Northfolk · the cold coast' },
  Qadir: { name: 'Sultanate of Qadir', short: 'Qadir', title: 'Sultan', cult: 'CUL-04', color: '#17595c', device: 'crescent', field: 'teal', where: 'Qadiri · the desert wells' },
  Ulun: { name: 'Khanate of Ulun', short: 'Ulun', title: 'Khan', cult: 'CUL-03', color: '#7d2a22', device: 'bow', lace: '#b8322a', where: 'Wind Riders · the steppe' },
  Zanara: { name: 'Empire of Zanara', short: 'Zanara', title: 'Emperor', cult: 'CUL-08', color: '#8a4a12', device: 'sun', field: 'madder', where: 'Zanari · the southern forest' },
  Sabra: { name: 'Emirate of Sabra', short: 'Sabra', title: 'Emir', cult: 'CUL-07', color: '#8e4a2c', device: 'anchor', field: 'russet', where: 'Sabrans · the pearl coast' },
  Aldmark: { name: 'Empire of Aldmark', short: 'Aldmark', title: 'Emperor', cult: 'CUL-02', color: '#7a1f24', device: 'eagle', field: 'madder', field2: 'cream', where: 'Northfolk · the ploughlands' },
};
const LOOKS = {
  'CUL-02': { skins: ['#f5dccb', '#f2d2bd', '#f8e6dd'], hair: ['copper', 'blond', 'flaxen', 'chestnut', 'auburn', 'darkblond', 'ginger'], eyes: ['blue', 'greyblue', 'grey', 'green', 'ice'] },
  'CUL-04': { skins: ['#c79670', '#d9b48c', '#b07a52'], hair: ['black', 'soot', 'darkbrown'], eyes: ['darkbrown', 'brown', 'hazel', 'amber'] },
  'CUL-07': { skins: ['#b07a52', '#c79670'], hair: ['black', 'soot'], eyes: ['darkbrown', 'hazel', 'sea'] },
  'CUL-03': { skins: ['#d9b48c', '#e9c5a4', '#c79670'], hair: ['black', 'soot'], eyes: ['darkbrown', 'brown', 'black'] },
  'CUL-08': { skins: ['#734731', '#54342a', '#93603f'], hair: ['black', 'soot'], eyes: ['darkbrown', 'black', 'brown'] },
};
const nameOf = (cid, male, r) => {
  const c = NAMES.cultures[cid] || {}, pool = c.uses && c.uses !== 'common' ? NAMES.pools[c.uses] : null, src = pool || c.accent || NAMES.common, k = male ? 'male' : 'female';
  const pick = a => a[Math.floor(r() * a.length) % a.length];
  return pick(src[k]) + ' ' + pick((pool || c.accent || NAMES.common).family);
};
// one person as the game's sheet would describe them (id, sex, age, appearance, station, people, realm, wealth)
export function person(realmKey, station, sex, o = {}) {
  const realm = REALMS[realmKey], cid = o.cult || realm.cult, id = 'c8d-' + realmKey + '-' + station + '-' + (o.k || 0), r = stream(id, 'cast'), L = LOOKS[cid], pick = a => a[Math.floor(r() * a.length) % a.length];
  const age = o.age ?? ({ serf: 24, peasant: 30, artisan: 34, merchant: 41, clergy: 52, soldier: 27, noble: 36, royal: 47 }[station] + Math.floor(r() * 9) - 4);
  return { id, name: o.name === false ? '' : nameOf(cid, sex === 'M', r), sex, age, station, cult: cid, realm, where: o.where === false ? null : (o.where || realm.where), wealth: o.wealth ?? 1,
    app: { skin: o.skin || pick(L.skins), hair: o.hair || pick(L.hair), eye: pick(L.eyes), build: o.build || pick(station === 'soldier' || station === 'artisan' ? ['sturdy', 'average'] : station === 'serf' ? ['lean', 'slight'] : ['average', 'lean', 'sturdy']) }, ...o.more };
}
const SEX = { Northreach: 'FFMMFMFM', Qadir: 'FMMMMMMM', Ulun: 'MMMFMMMM', Zanara: 'FFMFMMMM' };
const MAIN = ['Northreach', 'Qadir', 'Ulun', 'Zanara'];
export const cast = () => MAIN.flatMap(rk => M.STATIONS.map((st, i) => person(rk, st, SEX[rk][i])));

const fontCss = () => [['Cinzel', 'cinzel-normal-600-700-latin.woff2', 'normal', '600 700'], ['Literata', 'literata-normal-400-700-latin.woff2', 'normal', '400 700'], ['Literata', 'literata-italic-400-600-latin.woff2', 'italic', '400 600']]
  .map(([f, file, st, w]) => `@font-face{font-family:"${f}";font-style:${st};font-weight:${w};src:url("file://${path.join(root, 'assets/fonts', file)}") format("woff2")}`).join('');
const page = (title, sub, body, w) => `<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>${fontCss()}
body{margin:0;padding:26px 30px 30px;background:radial-gradient(1200px 700px at 50% 0,#1b2a52,#0a1124 70%);color:#e8dcc0;font:14px/1.4 Literata,Georgia,serif;width:${w}px}
h1{font:600 26px Cinzel,Georgia,serif;letter-spacing:5px;text-align:center;margin:0 0 4px;color:#f0d890}h1 i{font-style:normal;color:#c9a24a;padding:0 10px}
.sub{text-align:center;color:#b8c0d8;margin:0 0 18px;font-size:13.5px}
.g{display:grid;gap:10px 10px}.c svg{display:block;box-shadow:0 3px 12px #0009;border-radius:6px}
h2{font:600 15px Cinzel,Georgia,serif;letter-spacing:2.5px;color:#f0d890;margin:22px 0 8px;border-bottom:1px solid #c9a24a55;padding-bottom:4px}
.c p{margin:6px 2px 0;font-size:11.6px;line-height:1.35;color:#cfd4e4}.c p b{color:#f0d890;font-weight:600}
.row{display:flex;gap:10px;align-items:flex-start}.row>div{flex:none}</style><h1>${title}</h1><p class="sub">${sub}</p>${body}`;
const CW = 226;
const cardHtml = (p, note, w = CW) => `<div class="c" style="width:${w}px">${M.card(p, { width: w }).svg}${note ? `<p>${note}</p>` : ''}</div>`;

const out = {};
// ---- the sheet: 8 stations x 4 peoples
out.sheet = () => page('8 STATIONS <i>·</i> 4 PEOPLES <i>·</i> ONE CONTINENT', 'Ardan\'s own realms: Northreach (Northfolk), Qadir (Qadiri), Ulun (Wind Riders), Zanara (Zanari). Every card is drawn by code from the person\'s data: no image is used.',
  `<div class="g" style="grid-template-columns:repeat(8,${CW}px)">${cast().map(p => cardHtml(p)).join('')}</div>`, 8 * CW + 70);

// ---- the small differences: across one border, a border town, wealth in one station, taste
out.details = () => {
  const N = (rk, st, sex, o, note) => cardHtml(person(rk, st, sex, o), note);
  const border = [
    N('Qadir', 'soldier', 'M', { k: 'b' }, '<b>Qadir, a lancer.</b> Mail under cotton, the cloth-wound pointed helm, a steel buckler, the Sultan\'s sash: inland horse country, and copper and iron of its own.'),
    N('Sabra', 'soldier', 'M', { k: 'b' }, '<b>Sabra, a marine.</b> Same faith, same robe. No mail and no helm (a man in mail drowns): a quilted coat, a hide target, a boarding axe; a buckled belt, because a sash tail fouls rigging.'),
    N('Qadir', 'merchant', 'M', { k: 'b' }, '<b>Qadir, a merchant.</b> Indigo and teal, stars on the coat, the turban\'s end left hanging, a silver dagger in a saffron sash, a ledger: paper is Qadir\'s export.'),
    N('Sabra', 'merchant', 'M', { k: 'b' }, '<b>Sabra, a merchant.</b> Russet and ochre, waves for stars, a flat striped turban with no tail (sea wind), pearls for gold, a bone-hilted knife on a belt.'),
    N('Northreach', 'noble', 'M', { k: 'b' }, '<b>Northreach, a jarl.</b> Cloak pinned on one shoulder with a ring brooch (a seaman keeps his sword arm free), a wolf pelt, lobed hilt, silver rings, plaited hair and beard.'),
    N('Aldmark', 'noble', 'M', { k: 'b' }, '<b>Aldmark, a knight.</b> The same folk, richer ploughland, a mounted lord: a coat of arms over the mail, a kite shield, a cross hilt, the cloak clasped at the throat with a chain; cropped hair.'),
    N('Northreach', 'peasant', 'M', { k: 'b' }, '<b>Northreach, a freeholder.</b> Woad or russet wool, a dagged hood, knotwork, amber from his own shore.'),
    N('Aldmark', 'peasant', 'M', { k: 'b' }, '<b>Aldmark, a tenant.</b> Madder red (it grows there), a straw hat for the harvest sun, a linen apron, plain bars for knots, no amber.'),
  ];
  const town = { where: 'Scale Pact town · Qadir and Zanara meet' };
  const mixed = [
    N('Qadir', 'merchant', 'F', { k: 'm1', ...town, more: { border: { dress: 'south', take: ['neck', 'earrings'], cloth: true } } }, '<b>Qadiri by birth,</b> in the town where Zanari gold is weighed: the Qadiri robe and veil, but cut from Zanari strip-cloth, with a Zanari trade-bead collar and gold in the ears.'),
    N('Zanara', 'soldier', 'M', { k: 'm2', ...town, more: { border: { dress: 'desert', take: ['hat', 'hilt'] } } }, '<b>A Zanari of the town watch:</b> his own quilted coat, tall shield and broad spear, with a borrowed Qadiri helm and sabre (the watch is armed from both stores).'),
    N('Zanara', 'artisan', 'M', { k: 'm3', skin: '#93603f', ...town, more: { border: { dress: 'desert', take: ['hat', 'belt'] } } }, '<b>A caster, son of both:</b> his mother\'s people\'s wrap and locks with copper rings, his father\'s worked skullcap and sash.'),
    N('Qadir', 'peasant', 'M', { k: 'm4', skin: '#93603f', ...town, more: { border: { dress: 'south', take: ['neck', 'wrist'], cloth: true } } }, '<b>A grower outside the walls:</b> headcloth, sash and curved knife of Qadir; the robe woven in the bands of his wife\'s lineage, her beads at his neck.'),
  ];
  const wealth = [
    N('Northreach', 'artisan', 'M', { k: 'w', wealth: 0, hair: 'chestnut' }, '<b>A journeyman:</b> bare head, plain apron, iron buckle, nothing at the neck.'),
    N('Northreach', 'artisan', 'M', { k: 'w', wealth: 1, hair: 'chestnut' }, '<b>A shipwright with his own yard:</b> a pocketed apron, one silver ring at the wrist.'),
    N('Northreach', 'artisan', 'M', { k: 'w', wealth: 2, hair: 'chestnut' }, '<b>A master of the guild:</b> the dyed cap with knotwork, silver at the wrist, the guild\'s bronze token on a cord.'),
    N('Zanara', 'peasant', 'F', { k: 'w', wealth: 0 }, '<b>A poor compound:</b> one string of clay beads, a plain edge to the cloth.'),
  ];
  const taste = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((k, i) => N('Ulun', 'peasant', i % 3 === 1 ? 'F' : 'M', { k, wealth: i % 3, where: false }, ''));
  const grid = cards => `<div class="g" style="grid-template-columns:repeat(8,${CW}px)">${cards.join('')}</div>`;
  return page('THE SMALL DIFFERENCES', 'Neighbours across one border, a border town, wealth inside one station, and one people that is not one look.',
    `<h2>ACROSS ONE BORDER · THE SAME STATION, THE NEXT REALM</h2>${grid(border)}<h2>A BORDER TOWN · MIXED CLOTH, BORROWED ARMS, BOTH PEOPLES\' BUILDINGS BEHIND</h2>${grid([...mixed, ...wealth])}<h2>ONE NATION, NOT ONE LOOK · EIGHT FREE HERDERS OF ULUN (DYE, HAT, HAIR, WEALTH AND TASTE VARY; THE CUT DOES NOT)</h2>${grid(taste)}`, 8 * CW + 70);
};
// ---- one card large (what the Profile tab would show) and four at phone sizes
out.one = () => { const c = cast(); const big = [c[7], c[15], c[23], c[31], c[5], c[11], c[19], c[26]];
  return page('THE CARD, LARGE', 'At 420 px (a phone\'s width), the size of the Profile tab\'s card.', `<div class="g" style="grid-template-columns:repeat(4,420px)">${big.map(p => cardHtml(p, '', 420)).join('')}</div>`, 4 * 420 + 30); };
// ---- side by side against the owner's reference
out.compare = () => { const ref = 'file://' + path.join(root, 'docs/design/reference/owner-manhwa-cards.webp');
  return `<!doctype html><meta charset="utf-8"><style>${fontCss()}body{margin:0;padding:20px;background:#0a1124;color:#f0d890;font:600 15px Cinzel,Georgia,serif;letter-spacing:2px;width:2860px}.r{display:flex;gap:20px;align-items:flex-start}h2{font-size:15px;margin:0 0 8px}.g{display:grid;gap:5px;grid-template-columns:repeat(8,170px)}svg{display:block}</style>
<div class="r"><div><h2>THE OWNER'S REFERENCE (PAINTED BY AN IMAGE MODEL)</h2><img src="${ref}" width="1407"></div><div><h2>C8D GATE 1 (DRAWN BY CODE, ONE SVG A CARD)</h2><div class="g">${cast().map(p => M.card(p, { width: 170 }).svg).join('')}</div></div></div>`; };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const require = createRequire(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/');
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const jobs = [['sheet', 2], ['details', 2], ['one', 2], ['compare', 1]].filter(j => !only.length || only.includes(j[0]));
  for (const [name, dpr] of MEASURE && !only.length ? [] : jobs) {
    const html = path.join(here, name + '.html'); fs.writeFileSync(html, out[name]());
    const pg = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: dpr });
    const errs = []; pg.on('console', m => m.type() === 'error' && errs.push(m.text())); pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto('file://' + html); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    const w = await pg.evaluate(() => document.body.scrollWidth); await pg.setViewportSize({ width: w, height: 800 });
    await pg.screenshot({ path: path.join(here, name + '.png'), fullPage: true }); await pg.close();
    if (!KEEP) fs.unlinkSync(html);
    console.log('wrote', name + '.png', errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : '');
  }
  if (MEASURE) {
    // bytes: each card's SVG, raw and gzipped; the scene's share. time: making the string (node), and parse + layout + paint
    // in Chromium for 32 cards put on a page at once, at full speed and with the CPU slowed four times (a mid phone)
    const c = cast(), svgs = c.map(p => M.card(p, { width: 360 }).svg), bare = c.map(p => M.card(p, { width: 360, scene: false }).svg), gz = s => zlib.gzipSync(s, { level: 9 }).length;
    const t0 = performance.now(); for (let k = 0; k < 5; k++) for (const p of c) M.card(p, { width: 360 }); const make = (performance.now() - t0) / (5 * c.length);
    const lib = fs.readdirSync(path.join(root, 'src/ui/engine/figure/manhwa')).filter(f => f.endsWith('.js')).map(f => fs.readFileSync(path.join(root, 'src/ui/engine/figure/manhwa', f), 'utf8')).join('\n');
    const res = { cards: c.length, svgBytes: { mean: Math.round(svgs.reduce((a, s) => a + s.length, 0) / c.length), min: Math.min(...svgs.map(s => s.length)), max: Math.max(...svgs.map(s => s.length)) }, svgGzip: { mean: Math.round(svgs.reduce((a, s) => a + gz(s), 0) / c.length) },
      withoutScene: { mean: Math.round(bare.reduce((a, s) => a + s.length, 0) / c.length), gzipMean: Math.round(bare.reduce((a, s) => a + gz(s), 0) / c.length) }, makeMsNode: +make.toFixed(2), librarySource: { bytes: lib.length, gzip: gz(lib) } };
    for (const [label, rate, list] of [['paint1x', 1, svgs], ['paint4x', 4, svgs], ['paint4xNoScene', 4, bare], ['paint4xNoBlur', 4, c.map(p => M.card(p, { width: 360, blur: false }).svg)]]) {
      const pg = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6 }); const cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await pg.setContent('<body style="margin:0;background:#111"><div id="h" style="display:flex;flex-wrap:wrap;width:412px"></div>');
      // eight cards set at once, all in view (4 x 2 at 100 px): the time from setting them to the second frame after,
      // less the same wait with nothing set, over eight. Main thread: parse, style, layout, paint record.
      const runs = [];
      for (let k = 0; k < 4; k++) runs.push(await pg.evaluate(async list2 => { const h = document.getElementById('h'), two = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); h.innerHTML = ''; await two(); const b0 = performance.now(); await two(); const base = performance.now() - b0;
        const t = performance.now(); h.innerHTML = list2.slice(0, 8).join(''); h.getBoundingClientRect(); const sync = performance.now() - t; await two(); return [(performance.now() - t - base) / 8, sync / 8]; }, list.map(s => s.replace(/ width="\d+" height="\d+"/, ' width="100" height="160"'))));
      runs.sort((x, y) => x[0] - y[0]); res[label + 'ParseLayoutMsPerCard'] = +runs[0][1].toFixed(1);
      res[label + 'MsPerCard'] = +Math.max(runs[0][0], runs[0][1]).toFixed(1); await pg.close();
    }
    fs.writeFileSync(path.join(here, 'measure.json'), JSON.stringify(res, null, 1) + '\n'); console.log(JSON.stringify(res, null, 1));
  }
  await browser.close();
}
