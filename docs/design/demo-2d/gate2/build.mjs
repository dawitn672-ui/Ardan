// Gate 2 of the 2D character plan: one offline page and its screenshots.
//   node docs/design/demo-2d/gate2/build.mjs            writes ../gate2.html, ../gate2-lineup.png, ../gate2-cards.png, ../gate2-customiser.png
//   node docs/design/demo-2d/gate2/build.mjs --no-shots  the page only
// The page is made from this folder's modules alone (and reads the game's face code, src/people/engine/face.js, without changing it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { quantize, recompress } from '../pngq.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../../..'), out = path.resolve(here, '..');
const js = (await build({ entryPoints: [path.join(here, 'page.js')], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none' })).outputFiles[0].text;
const fonts = path.join(root, 'assets/fonts');
const font = (f, fam, w, st = 'normal') => `@font-face{font-family:${fam};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts, f)).toString('base64')}) format('woff2');font-weight:${w};font-style:${st};font-display:block}`;

const css = `
${font('cinzel-normal-600-700-latin.woff2', 'Cinzel', '600 700')}
${font('literata-normal-400-700-latin.woff2', 'Literata', '400 700')}
${font('literata-italic-400-600-latin.woff2', 'Literata', '400 600', 'italic')}
${font('atkinson-hyperlegible-next-normal-400-700-latin.woff2', 'Atkinson', '400 700')}
:root{color-scheme:light;--paper:#efe8da;--ink:#2a2233;--muted:#665b57;--rule:#c8b99c;--gold:#8a6c22;--verm:#a8322a;--card:#f8f2e6;--chip:#fffaf0}
*{box-sizing:border-box}html,body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 Literata,Georgia,serif}
[hidden]{display:none!important}
main{max-width:1326px;margin:0 auto;padding:30px 20px 64px}
.kick{font:600 12px Cinzel,serif;letter-spacing:.24em;text-transform:uppercase;color:var(--verm);margin:0 0 6px}
h1{font:700 36px/1.08 Cinzel,serif;letter-spacing:.05em;margin:0}
.lede{max-width:900px;color:var(--muted);margin:10px 0 0;font-size:15.5px}
section{margin-top:46px}
h2{font:700 19px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;margin:0 0 3px;display:flex;align-items:center;gap:14px}
h2::after{content:"";flex:1;height:1px;background:var(--rule)}
.sub{color:var(--muted);font-style:italic;font-size:14px;margin:0 0 16px;max-width:980px}
svg{display:block}
/* the lineup */
#stage .row{display:grid;grid-template-columns:repeat(5,1fr);align-items:end;background:radial-gradient(90% 70% at 50% 100%,#dedae6 0%,#eeecf3 55%,#f5f3f8 100%);border-radius:8px;margin-bottom:14px;padding:8px 10px 12px;box-shadow:inset 0 0 0 1px #d9d2c2}
.fig{margin:0;text-align:center}.fig svg{width:100%;height:auto}
.fig figcaption b{font:700 13.5px Cinzel,serif;letter-spacing:.04em;display:block;margin-top:2px}
.fig figcaption span{font-size:12px;color:var(--muted);font-style:italic}
/* the cards */
#cards{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
.card{background:var(--card);border:1px solid var(--rule);border-radius:7px;box-shadow:0 1px 0 #fff inset,0 10px 22px -14px rgba(40,30,20,.6);overflow:hidden;display:flex;flex-direction:column}
.card .art{margin:8px 8px 0;border-radius:4px;overflow:hidden;position:relative;background:radial-gradient(120% 90% at 26% 16%,var(--b1),var(--b2));box-shadow:inset 0 0 0 1px rgba(20,14,26,.35)}
.card .art svg{width:100%;height:auto;position:relative}
.card .art::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 46% at 36% 30%,rgba(255,250,235,.4),transparent 70%)}
.card .art::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 66%,rgba(22,14,30,.38));box-shadow:inset 0 0 0 3px rgba(255,255,255,.1),inset 0 0 0 4px rgba(138,108,34,.55);pointer-events:none;border-radius:4px}
.plate{padding:10px 14px 14px}
.estate{font:600 10.5px Cinzel,serif;letter-spacing:.22em;text-transform:uppercase;color:var(--verm);margin:0;display:flex;gap:6px;align-items:center}
.estate svg{fill:var(--verm)}
.card h3{font:700 17.5px/1.15 Cinzel,serif;margin:3px 0 1px;letter-spacing:.02em}
.rank{font-style:italic;color:var(--muted);font-size:12.5px;line-height:1.35;margin:0 0 8px}
.words{font-size:13px;line-height:1.45;margin:0 0 9px;border-top:1px solid var(--rule);padding-top:8px}
.card dl{margin:0;display:grid;gap:3px}
.card dl div{display:grid;grid-template-columns:62px 1fr;gap:8px;font-size:12.5px;line-height:1.35}
.card dt{font:600 9.5px Cinzel,serif;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);padding-top:3px}
.card dd{margin:0}
.e-serf{--b1:#b9ae98;--b2:#6c6355}.e-peasant{--b1:#aeb592;--b2:#5c684a}.e-artisan{--b1:#c8ab80;--b2:#775b3a}.e-merchant{--b1:#93b5ae;--b2:#3c655f}.e-priest{--b1:#aaa2bc;--b2:#564e6c}.e-soldier{--b1:#aab0bc;--b2:#525a69}.e-noble{--b1:#97a6c8;--b2:#3a476f}.e-royal{--b1:#bba0c4;--b2:#5a3a68}
/* the maker */
#maker{display:grid;grid-template-columns:646px minmax(0,1fr);gap:20px;align-items:start}
.view{display:grid;grid-template-columns:430px 1fr;gap:10px;background:var(--card);border:1px solid var(--rule);border-radius:7px;padding:10px}
#mBust{border-radius:4px;overflow:hidden;background:radial-gradient(120% 90% at 26% 16%,#a9b3c8,#47516a);box-shadow:inset 0 0 0 1px rgba(20,14,26,.35)}
#mFig{background:radial-gradient(120% 60% at 50% 100%,#dcd8e4,#f3f1f7);border-radius:4px;display:flex;align-items:flex-end}
#mBust svg,#mFig svg{width:100%;height:auto}
.meta{grid-column:1/-1;font:12px Atkinson,system-ui,sans-serif;color:var(--muted);display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center}
.meta code{font:12px ui-monospace,Menlo,monospace;background:#efe6d2;padding:2px 6px;border-radius:3px;color:var(--ink)}
.meta input{font:12px ui-monospace,Menlo,monospace;width:200px;padding:4px 6px;border:1px solid var(--rule);border-radius:4px;background:#fff}
#mAges{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#mAges figure{margin:0;text-align:center;font-size:12px;color:var(--muted);font-style:italic}
#mAges svg{width:100%;height:auto;border-radius:4px;background:radial-gradient(120% 90% at 26% 16%,#bdb6a6,#6a6457)}
.ctl{background:var(--card);border:1px solid var(--rule);border-radius:7px;padding:12px 14px 16px}
#who{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
#tabs{display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid var(--rule);margin-bottom:6px}
.tab{font:600 12px Cinzel,serif;letter-spacing:.08em;text-transform:uppercase;background:none;border:0;border-bottom:2px solid transparent;padding:9px 10px;color:var(--muted);cursor:pointer}
.tab.on{color:var(--ink);border-bottom-color:var(--verm)}
#panel h4,.gcol h4{font:600 11px Cinzel,serif;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:13px 0 6px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:7px}
.chip{font:13px Atkinson,system-ui,sans-serif;background:var(--chip);border:1px solid var(--rule);border-radius:999px;padding:5px 11px;min-height:32px;cursor:pointer;color:var(--ink)}
.chip.on{background:var(--ink);color:#fff8e8;border-color:var(--ink)}
.chip.gold{border-color:var(--gold);color:#6b5217;font-weight:700}
.sl{display:grid;grid-template-columns:128px 1fr 128px;gap:10px;align-items:center;font:12.5px Atkinson,system-ui,sans-serif;color:var(--muted);margin:1px 0;min-height:26px}
.sl .lo{text-align:right}.sl.age .hi b{color:var(--ink)}
input[type=range]{accent-color:var(--verm);width:100%;margin:0}
.sw{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:8px}
.s{width:30px;height:30px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px var(--rule);cursor:pointer;padding:0}
.s.on{box-shadow:0 0 0 2.5px var(--verm)}
.thumbs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.th{background:var(--chip);border:1px solid var(--rule);border-radius:6px;padding:2px 2px 5px;cursor:pointer;font:10.5px/1.15 Atkinson,system-ui,sans-serif;color:var(--muted)}
.th.on{border-color:var(--verm);box-shadow:0 0 0 1px var(--verm);color:var(--ink)}
.th svg{width:100%;height:auto}.tn{display:block;min-height:24px}
/* ages, gear, cost */
.agerow{display:grid;grid-template-columns:150px repeat(4,190px);gap:16px;align-items:end;margin-bottom:16px}
.agerow .who{margin:0 0 30px}.agerow .who b{font:700 18px Cinzel,serif;display:block}.agerow .who span{font-size:12.5px;color:var(--muted);font-style:italic}
.agerow figure,.kits figure{margin:0;text-align:center;font-size:12.5px;color:var(--muted);font-style:italic}
.agerow svg,.kits svg{width:100%;height:auto;border-radius:4px;background:radial-gradient(120% 90% at 26% 16%,#bdb6a6,#6a6457);margin-bottom:3px}
#gear{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.gart{background:radial-gradient(120% 80% at 50% 40%,#f4f1f6,#dedae6);border-radius:6px;box-shadow:inset 0 0 0 1px #d9d2c2}.gart svg{width:100%;height:auto}
.glist{margin:8px 0 0;padding-left:20px;font-size:13.5px}.glist b{font-family:Cinzel,serif;letter-spacing:.04em;margin-right:6px}
.gnote{font-size:12.5px;color:var(--muted);font-style:italic;margin:8px 0 0}
.kits{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
#cost table{border-collapse:collapse;font:13px Atkinson,system-ui,sans-serif;width:100%;max-width:980px}
#cost th,#cost td{text-align:left;padding:6px 12px 6px 0;border-bottom:1px solid var(--rule)}#cost th{font:600 10.5px Cinzel,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}
.foot{color:var(--muted);font-size:13px;max-width:980px}.foot p{margin:8px 0}
@media (max-width:1100px){#cards,#stage .row{grid-template-columns:repeat(2,1fr)}#maker,#gear{grid-template-columns:1fr}.view{grid-template-columns:1fr}.agerow{grid-template-columns:repeat(2,1fr)}.thumbs{grid-template-columns:repeat(4,1fr)}}
`;
const body = `<main>
<header><p class="kick">Gate 2 · character art · for the owner's eye</p><h1>Ardan · the people</h1>
<p class="lede">Clean line with soft tone, after the owner's two reference sheets: full figures with their own stance and build, every piece of dress and armour its own drawn layer, and faces set by hand. Nothing here is a picture file. Each person is a short list of numbers and items, drawn by the parts library when the page opens.</p></header>
<section id="sec-lineup"><h2>The lineup</h2><p class="sub">Ten people across the estates, drawn to one scale: a bondman, a cottar's child, a tenant's wife, a smith, a wool factor, a priest, a man-at-arms, a knight, an earl's daughter and the king.</p><div id="stage"></div></section>
<section id="sec-cards"><h2>Profile cards</h2><p class="sub">The same drawings, closer, on the card the game would show: name, estate and rank, a line about the person, and plain measures in words.</p><div id="cards"></div></section>
<section id="sec-maker"><h2>The face and build maker</h2><p class="sub">Every feature is set by hand and the picture redraws as you drag. Start from anyone in the lineup, or roll a stranger. Sliders carry words at their ends, never numbers.</p>
<div id="maker"><div class="view"><div id="mBust"></div><div id="mFig"></div>
<div class="meta"><span id="mNote"></span><span>Face code <code id="mCode"></code></span><span><input id="mIn" aria-label="Paste a face code" placeholder="paste a face code" maxlength="23"> <button type="button" class="chip" id="mPaste">Load code</button> <span id="mMsg" role="status"></span></span></div>
<div id="mAges"></div></div>
<div class="ctl"><div id="who"></div><div id="tabs" role="tablist"></div><div id="panel"></div></div></div></section>
<section id="sec-ages"><h2>One face, four ages</h2><p class="sub">Growth and age are part of the drawing, not a filter: a child's large skull and short face, the jaw and brow that come in with the years, then lines, hollows, thinner lips, grey, and a little lost height.</p><div id="ages"></div></section>
<section id="sec-gear"><h2>Gear as layers, by make</h2><p class="sub">Dress, armour and arms are separate items put on in order, each keyed by what it is and how well it is made. A library of hundreds of weapons would be more rows of the same data.</p><div id="gear"></div></section>
<section id="sec-cost"><h2>What it costs to draw</h2><p class="sub">Measured in this browser when the page opened, across the ten people of the lineup.</p><div id="cost"></div>
<div class="foot"><p>Compose is the parts library turning a look into SVG. Paint is the browser turning that SVG into pixels, timed by drawing it to a canvas at twice the size shown. In the game a portrait would be painted once and kept as an image.</p>
<p>Source: <code>docs/design/demo-2d/gate2/</code>. The same look always gives the same drawing: the parts take their dice from a seeded stream named by the person's id, never from the clock.</p></div></section>
</main>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ardan · Gate 2 · the people</title>
<meta name="description" content="Gate 2 of Ardan's 2D character art: a lineup of full figures, profile cards, a face and build maker, four ages and gear by quality, all drawn by code.">
<style>${css}</style></head><body>${body}<script>${js}</script></body></html>`;
fs.writeFileSync(path.join(out, 'gate2.html'), html);
console.log('gate2.html', (html.length / 1024).toFixed(0), 'KB (script', (js.length / 1024).toFixed(0), 'KB)');

if (!process.argv.includes('--no-shots')) {
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await pg.goto('file://' + path.join(out, 'gate2.html'));
    await pg.waitForFunction(() => window.DONE === true, null, { timeout: 120000 });
    if (errs.length) { console.error('PAGE ERRORS\n' + errs.join('\n')); process.exitCode = 1; }
    const shot = async (sel, file, tab) => {
      if (tab) { await pg.click(`#tabs [data-v="${tab}"]`); await pg.waitForTimeout(400); }
      let png = await pg.locator(sel).screenshot();
      png = recompress(png); if (png.length > 1.6 * 1048576) png = quantize(png, 256);
      fs.writeFileSync(path.join(out, file), png); console.log(file, (png.length / 1024).toFixed(0), 'KB');
    };
    await shot('#sec-lineup', 'gate2-lineup.png');
    await shot('#sec-cards', 'gate2-cards.png');
    await shot('#sec-maker', 'gate2-customiser.png', process.argv.find(a => a.startsWith('--tab='))?.slice(6) || 'Hair');
    if (process.argv.includes('--more')) { await shot('#sec-ages', 'gate2-ages.png'); await shot('#sec-gear', 'gate2-gear.png'); }
    console.log('TIMING', JSON.stringify(await pg.evaluate(() => window.TIMING)));
  } finally { await browser.close(); }
}
