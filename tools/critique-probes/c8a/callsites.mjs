import fs from 'node:fs';
const src = fs.readFileSync(process.argv[2], 'utf8');
const needle = process.argv[3];
let i = -1; const out = [];
while ((i = src.indexOf(needle, i + 1)) >= 0) {
  // nearest preceding "X.name=function" or "X.name = function"
  const back = src.slice(Math.max(0, i - 6000), i);
  const m = [...back.matchAll(/([A-Za-z_$][\w$]*(?:\.[\w$]+)+)\s*=\s*(?:async\s+)?function/g)].pop();
  out.push((m ? m[1] : '?') + '  ::  ' + src.slice(i, i + 90).replace(/\n/g, ' '));
}
console.log(out.join('\n'));
