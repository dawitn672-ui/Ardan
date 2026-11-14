// Ten legendary arms: one offline page and its pictures.
//   node docs/design/legendaries/build.mjs             writes legendaries.html, legendaries.png, legend-01.png … legend-10.png
//   node docs/design/legendaries/build.mjs --no-shots  the page only
// The page is made from src/ here and the game's figure library (src/ui/engine/figure, read and not changed).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { decode, quantize } from './src/png.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const js = (await build({ entryPoints: [path.join(here, 'src/page.mjs')], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none' })).outputFiles[0].text;
const fonts = path.join(root, 'assets/fonts');
const font = (f, fam, w, st = 'normal') => `@font-face{font-family:${fam};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(fonts, f)).toString('base64')}) format('woff2');font-weight:${w};font-style:${st};font-display:block}`;

const css = `
${font('cinzel-normal-600-700-latin.woff2', 'Cinzel', '600 700')}
${font('literata-normal-400-700-latin.woff2', 'Literata', '400 700')}
${font('literata-italic-400-600-latin.woff2', 'Literata', '400 600', 'italic')}
:root{color-scheme:light;--paper:#efe8da;--ink:#2a2233;--muted:#665b57;--rule:#c8b99c;--gold:#8a6c22;--verm:#a8322a;--card:#f8f2e6}
*{box-sizing:border-box}html,body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.5 Literata,Georgia,serif}
main{width:1366px;margin:0 auto;padding:30px 24px 60px}
svg{display:block}
.kick{font:600 12px Cinzel,serif;letter-spacing:.24em;text-transform:uppercase;color:var(--verm);margin:0 0 6px}
h1{font:700 36px/1.08 Cinzel,serif;letter-spacing:.05em;margin:0}
.lede{max-width:980px;color:var(--muted);margin:10px 0 0;font-size:15.5px}
.lg{margin-top:44px}
.top{display:grid;grid-template-columns:800px 1fr;gap:16px}
.art{position:relative;min-height:800px;height:100%;border-radius:8px;overflow:hidden;background:radial-gradient(70% 62% at 36% 42%,var(--a),var(--b) 74%,#08080c 100%);box-shadow:inset 0 0 0 1px rgba(214,178,94,.55),inset 0 0 0 5px rgba(0,0,0,.28)}
.ttl{position:absolute;left:0;width:546px;top:24px;text-align:center}
.ttl h2{font:700 31px Cinzel,serif;letter-spacing:.13em;color:#ecdcae;text-transform:uppercase;margin:0;text-shadow:0 1px 0 rgba(0,0,0,.6)}
.ttl p{font:600 12.5px Cinzel,serif;letter-spacing:.2em;color:#c2a660;margin:7px 0 0;text-transform:uppercase}
.rule{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:8px}
.rule i{display:block;width:150px;height:1px;background:linear-gradient(90deg,transparent,#c2a660)}.rule i:last-child{transform:scaleX(-1)}
.rule b{display:block;width:7px;height:7px;background:#d8bd76;transform:rotate(45deg)}
.hero{position:absolute;left:0;top:104px;width:546px;height:690px;display:grid;place-items:center}
.dets{position:absolute;right:14px;top:14px;bottom:14px;width:240px;display:grid;grid-template-rows:1fr 1fr;gap:12px}
.dets figure{margin:0;position:relative;border-radius:5px;overflow:hidden;display:grid;place-items:center;padding-bottom:22px;background:radial-gradient(90% 80% at 40% 36%,var(--a),var(--b));box-shadow:inset 0 0 0 1px rgba(214,178,94,.6),inset 0 0 22px rgba(0,0,0,.35)}
.dets figcaption{position:absolute;left:6px;right:6px;bottom:7px;text-align:center;font:600 9.5px/1.25 Cinzel,serif;letter-spacing:.16em;color:#e2cf9c;text-transform:uppercase}
.plate{background:linear-gradient(180deg,#f8f1e0,#eee2c6);border-radius:8px;padding:22px 24px 16px;box-shadow:inset 0 0 0 1px #b89a55,inset 0 0 0 5px #f8f1e0,inset 0 0 0 6px #cdb77f,0 10px 22px -16px rgba(40,30,20,.7)}
.plate .no{font:600 11.5px Cinzel,serif;letter-spacing:.22em;text-transform:uppercase;color:var(--verm);margin:0}
.plate h3{font:700 31px/1.1 Cinzel,serif;letter-spacing:.03em;margin:4px 0 4px}
.plate .realm{font:600 12.5px Cinzel,serif;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:0}
.plate .people{font-style:italic;color:var(--muted);font-size:13.5px;margin:2px 0 0}
.plate h4{font:600 10.5px Cinzel,serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:11px 0 2px}
.plate p{margin:0 0 5px;font-size:13.6px;line-height:1.48}
.plate .legend{font-style:italic}
.plate .finish{margin-top:12px;padding-top:9px;border-top:1px solid var(--rule);font-size:12.5px;color:var(--muted)}
.under{display:grid;grid-template-columns:310px 410px 1fr;gap:16px;margin-top:14px;align-items:start}.zm{margin:0}.win{overflow:hidden}.zm figcaption{font-size:13px;line-height:1.45;color:var(--muted);font-style:italic;margin:9px 6px 0}
.pf{margin:0}.frame{border-radius:6px;overflow:hidden;box-shadow:0 0 0 1px #b89a55,0 0 0 4px #f8f1e0,0 0 0 5px #cdb77f;margin:5px}
.pf figcaption{font-size:13px;line-height:1.45;color:var(--muted);font-style:italic;margin:9px 6px 0}
.pf figcaption b,#small figcaption b{display:block;font:700 13.5px Cinzel,serif;letter-spacing:.03em;color:var(--ink);font-style:normal;margin-bottom:2px}
.who{margin:0;background:linear-gradient(180deg,#f8f1e0,#eee2c6);border-radius:8px;padding:8px 22px 16px;box-shadow:inset 0 0 0 1px #b89a55,inset 0 0 0 5px #f8f1e0,inset 0 0 0 6px #cdb77f;display:grid;grid-template-columns:1fr 1fr 1.25fr;gap:0 26px}
.who dd{margin:0;font-size:14px;line-height:1.5}
.cmp{background:#f6efe0;border:1px solid var(--rule);border-radius:8px;padding:14px 20px 16px;margin-top:5px}
.cmp .cap{font:600 10.5px Cinzel,serif;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin:0 0 6px}
.pair{display:grid;gap:14px}.pair figure{margin:0}.pair figcaption{font-size:12.5px;line-height:1.4;color:var(--muted);font-style:italic;margin-top:5px}.pair figcaption b{font-style:normal;color:var(--ink);font-weight:600}
h2.sec{font:700 19px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;margin:54px 0 3px;display:flex;align-items:center;gap:14px}h2.sec::after{content:"";flex:1;height:1px;background:var(--rule)}
.sub{color:var(--muted);font-style:italic;font-size:14px;margin:0 0 16px;max-width:1000px}
#small{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px}#small .frame{margin:4px}#small svg{width:100%;height:auto}#small figure{margin:0}#small figcaption{font-size:11px;line-height:1.3;color:var(--muted);font-style:italic;margin:6px 5px 0}#small figcaption b{font-size:11px}
#cost table{border-collapse:collapse;font-size:12.5px;width:100%}#cost th,#cost td{text-align:left;padding:5px 10px 5px 0;border-bottom:1px solid var(--rule)}#cost th{font:600 9.5px Cinzel,serif;letter-spacing:.1em;text-transform:uppercase;color:var(--gold)}
.foot{color:var(--muted);font-size:13px;max-width:1000px}.foot p{margin:8px 0}
`;
const body = `<main>
<header id="head"><p class="kick">Legendary arms · ten designs · for the owner’s eye</p><h1>Ardan · ten legendary arms</h1>
<p class="lede">Ten pieces from ten realms and peoples, each in its own people’s craft and no two alike. The first is drawn after the owner’s example of a legendary blade and is Aldmark’s. None of them glows: what marks a legend is its metal, its making and what has happened to it. For each, the piece itself with two closer looks; who made it and what it has done; who owns it, who bears it and why; the person who has it, drawn by the game’s figure library with the piece on the figure; and, to one scale, the ordinary arm of its kind. Nothing on this page is a picture file. Every piece is a record of parts, drawn when the page opens.</p></header>
<div id="sheet"></div>
<section id="sec-small"><h2 class="sec">The same ten at the size of a list</h2><p class="sub">The figure and the piece on it, drawn small and without the light pass, as a list of people would show them: outline, metal, one accent, enough to know the piece.</p><div id="small"></div></section>
<section id="sec-cost"><h2 class="sec">What they cost to draw</h2><p class="sub">Measured in this browser when the page opened. Compose is a record turned into SVG. Paint is the browser turning that SVG into pixels, timed by drawing it to a canvas at twice the size shown.</p><div id="cost"></div>
<div class="foot"><p>Source: <code>docs/design/legendaries/src/</code>. The same record draws the plate, the closer looks, the flat strip and the piece on the figure. Its dice are seeded by the piece’s id, so a piece never changes.</p></div></section>
</main>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1366"><title>Ardan · ten legendary arms</title>
<meta name="description" content="Ten legendary arms of Ardan, from ten realms and peoples: each drawn by code from a record of parts, with its history, its owner and bearer, and the piece on the figure.">
<style>${css}</style></head><body>${body}<script>${js}</script></body></html>`;
fs.writeFileSync(path.join(here, 'legendaries.html'), html);
console.log('legendaries.html', (html.length / 1024).toFixed(0), 'KB (script', (js.length / 1024).toFixed(0), 'KB)');

// RGB pixels to a PNG (rows unfiltered: it is only handed to quantize())
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function encode(W, H, rgb) {
  const raw = Buffer.alloc((W * 3 + 1) * H); for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; Buffer.from(rgb.buffer, rgb.byteOffset + y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 1 })), chunk('IEND', Buffer.alloc(0))]);
}

if (!process.argv.includes('--no-shots')) {
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH ? path.join(process.env.PLAYWRIGHT_PATH, 'index.mjs') : '/opt/node-tools/node_modules/playwright/index.mjs');
  const browser = await chromium.launch();
  try {
    const pg = await (await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light' })).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await pg.goto('file://' + path.join(here, 'legendaries.html'));
    await pg.waitForFunction(() => window.DONE === true, null, { timeout: 240000 });
    if (errs.length) { console.error('PAGE ERRORS\n' + errs.join('\n')); process.exitCode = 1; }
    const timing = await pg.evaluate(() => window.TIMING);
    fs.writeFileSync(path.join(here, 'timing.json'), JSON.stringify(timing, null, 1));
    console.log('TIMING', JSON.stringify(timing));
    // 256 colours with an ordered dither: a third of the lossless size, and the painted grounds keep their smooth turn
    const save = (file, png) => { const out = quantize(png, 256, -14); fs.writeFileSync(path.join(here, file), out); console.log(file, (out.length / 1024).toFixed(0), 'KB'); };
    // each piece's own block at twice the pixels
    for (let i = 1; i <= 10; i++) { const n = String(i).padStart(2, '0'); save(`legend-${n}.png`, await pg.locator('#lg-' + n).screenshot()); }
    // the whole sheet: the page in strips (a browser will not hand over a picture this tall in one piece), joined
    const total = await pg.evaluate(() => document.documentElement.scrollHeight), strips = [];
    for (let y = 0; y < total; y += 3000) strips.push(decode(await pg.screenshot({ fullPage: true, clip: { x: 0, y, width: 1366, height: Math.min(3000, total - y) } })));
    const W = strips[0].W, H = strips.reduce((a, s) => a + s.H, 0), rgb = new Uint8Array(W * H * 3); let off = 0;
    for (const s of strips) { rgb.set(s.rgb, off); off += s.rgb.length; }
    const sheet = quantize(encode(W, H, rgb), 256, -14);
    fs.writeFileSync(path.join(here, 'legendaries.png'), sheet); console.log('legendaries.png', W + 'x' + H, (sheet.length / 1024).toFixed(0), 'KB');
  } finally { await browser.close(); }
}
