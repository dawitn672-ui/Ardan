import { build } from 'esbuild';
import fs from 'node:fs';
const r = await build({ entryPoints: ['src/ui/app.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020' });
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = fs.readFileSync('src/ui/template.html', 'utf8').replace('/*APP*/', () => js);
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/ardan-demo.html', html);
// a standalone copy with a document skeleton for local testing
fs.writeFileSync('dist/ardan-demo.local.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${html}</body></html>`);
console.log('built', (html.length / 1024).toFixed(0), 'KB');
