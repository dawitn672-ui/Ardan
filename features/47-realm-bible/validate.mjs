// Static check of the realm bibles (47-realm-bible): node features/47-realm-bible/validate.mjs [file ...]
// With no files it checks every bible.*.data.core.js in this folder, and that all 34 realms and their cultures are there.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => /^bible\..+\.data\.core\.js$/.test(f)).map(f => path.join(dir, f));
const A = {};
for (const f of files) new Function('A', fs.readFileSync(f, 'utf8'))(A);   // the data files only fill A.BIBLE_DATA and A.BIBLE_WORDS
const D = A.BIBLE_DATA || {}, W = A.BIBLE_WORDS || {};
const KINDS = { year: ['m', 'who'], rite: ['age', 'who'], wed: ['dowry'], mourn: ['share'], name: ['rule'], levy: ['who'], law: [], ward: ['when', 'every'], market: ['cut'], grave: [] };
const WHO = ['all', 'adult', 'free', 'commoner', 'unfree', 'noble', 'rich', 'poor', 'male', 'female', 'married', 'parent'];
const WHEN = ['armed', 'mounted', 'rich', 'poor', 'unwed', 'childless', 'old', 'sick', 'foreignFaith', 'soldier', 'landed', 'any'];
const SHARE = ['eldest', 'eldestSon', 'youngest', 'daughters', 'equal', 'temple', 'lord', 'clan', 'none'];
const NAMES = ['grandparent', 'parent', 'keep'];
const FX = ['str', 'spd', 'ins', 'sta', 'int', 'wil', 'health', 'happy', 'looks', 'fame', 'honor', 'piety', 'coin', 'coinPct', 'skill', 'flag', 'rep'];
// tokens a custom's words may use: the culture words and the realm everywhere, and what each moment adds
const TOK = { all: ['w1', 'w2', 'w3', 'realm'], wed: ['dowry', 'paid'], mourn: ['got', 'estate', 'parent'], name: ['child'], market: ['cut'] };
// moments nearly every life passes through
const COMMON = ['year', 'rite', 'mourn', 'wed', 'ward', 'grave'];
const words = s => (String(s).match(/\S+/g) || []).length;
const err = [], warn = [], ids = new Set();
for (const [rid, R] of Object.entries(D)) {
  const at = m => err.push(`${rid}: ${m}`);
  for (const k of ['want', 'fear']) if (typeof R[k] !== 'string' || words(R[k]) < 6 || words(R[k]) > 40) at(`${k} must be 6-40 words`);
  if (!R.place || !R.place.name || !R.place.text || words(R.place.text) > 40) at('place needs a name and a text of at most 40 words');
  const C = R.customs || [];
  if (C.length !== 3) at(`3 customs, not ${C.length}`);
  const kinds = C.map(c => c.kind);
  if (new Set(kinds).size !== kinds.length) at(`each custom a different kind (${kinds.join(', ')})`);
  if (kinds.filter(k => COMMON.includes(k)).length < 2) at(`at least 2 customs of ${COMMON.join('/')} kinds, so a typical life meets them`);
  for (const c of C) {
    const cat = m => at(`${c.id || '?'}: ${m}`);
    if (!/^[a-z]{2,4}_[a-z_]+$/.test(c.id || '')) cat('id like "ald_hearth"');
    if (ids.has(c.id)) cat('duplicate id'); ids.add(c.id);
    if (!KINDS[c.kind]) { cat(`unknown kind ${c.kind}`); continue; }
    for (const k of Object.keys(c)) if (!['id', 'name', 'kind', 'rule', 'text', 'fx', 'keepT', 'keep', 'defy', 'log', ...KINDS[c.kind]].includes(k)) cat(`unknown field ${k}`);
    if (c.who != null && !WHO.includes(c.who)) cat(`who must be one of ${WHO.join(' ')}`);
    if (c.kind === 'ward' && !WHEN.includes(c.when)) cat(`when must be one of ${WHEN.join(' ')}`);
    if (c.kind === 'mourn' && !SHARE.includes(c.share)) cat(`share must be one of ${SHARE.join(' ')}`);
    if (c.kind === 'name' && !NAMES.includes(c.rule)) cat(`rule must be one of ${NAMES.join(' ')}`);
    if (c.kind === 'year' && !(Number.isInteger(c.m) && c.m >= 0 && c.m <= 11)) cat('m is the month, 0-11');
    if (c.kind === 'rite' && !(c.age >= 17 && c.age <= 40)) cat('age 17-40 (bot lives start at 16)');
    if (c.kind === 'wed' && typeof c.dowry !== 'number') cat('dowry is a number (0 none, 2 double, -1 a bride price)');
    if (c.kind === 'market' && !(c.cut > 0 && c.cut <= 0.2)) cat('cut 0-0.2');
    if (!c.name || words(c.name) > 6) cat('name of at most 6 words');
    if (!c.rule || words(c.rule) > 25) cat('rule: one sentence of at most 25 words');
    if (!c.log || words(c.log) > 25) cat('log of at most 25 words');
    if (c.kind !== 'grave') {
      if (!c.text || words(c.text) > 60) cat(`text of at most 60 words (${words(c.text || '')})`);
      if (!c.keepT || words(c.keepT) > 12) cat('keepT: a choice label of at most 12 words');
      if (!c.keep || words(c.keep) > 30) cat('keep: a result of at most 30 words');
      if (!c.defy || !c.defy.t || words(c.defy.t) > 12 || !c.defy.r || words(c.defy.r) > 30 || !c.defy.fx) cat('defy: { t (<=12 words), r (<=30 words), fx }');
      if (!c.fx || typeof c.fx !== 'object') cat('fx: what the custom does each time it touches you');
    }
    for (const fx of [c.fx, c.defy && c.defy.fx]) for (const k of Object.keys(fx || {})) if (!FX.includes(k)) cat(`fx key ${k} not allowed (${FX.join(' ')})`);
    if (c.fx && typeof c.fx.coin === 'number' && Math.abs(c.fx.coin) > 40) cat('fx.coin at most 40 either way: these come again every time');
    const allowed = TOK.all.concat(TOK[c.kind] || []);
    for (const s of [c.rule, c.text, c.keep, c.log, c.keepT, c.defy && c.defy.r, c.defy && c.defy.t]) for (const m of String(s || '').matchAll(/\{(\w+)\}/g)) if (!allowed.includes(m[1])) cat(`token {${m[1]}} not allowed here (${allowed.join(' ')})`);
    for (const s of [c.text, c.keep, c.log, c.defy && c.defy.r]) if (/[<>"]/.test(String(s || ''))) cat('no < > or " in prose (use “ ”)');
  }
}
for (const [cid, L] of Object.entries(W)) {
  if (!Array.isArray(L) || L.length < 2 || L.length > 3 || L.some(x => !Array.isArray(x) || x.length !== 2 || !x[0] || !x[1] || words(x[0]) > 2)) err.push(`${cid}: 2-3 words, each [word, meaning], the word at most 2 words`);
}
if (!process.argv.slice(2).length) {
  for (let i = 1; i <= 34; i++) { const rid = 'POL-' + String(i).padStart(2, '0'); if (!D[rid]) err.push(`${rid} missing`); }
  for (let i = 1; i <= 24; i++) { const cid = 'CUL-' + String(i).padStart(2, '0'); if (!W[cid]) err.push(`${cid} words missing`); }
}
console.log(`${Object.keys(D).length} realms, ${ids.size} customs, ${Object.keys(W).length} cultures with words`);
if (err.length) { console.log(err.join('\n')); process.exit(1); }
console.log('ok');
