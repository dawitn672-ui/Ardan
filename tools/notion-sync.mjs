#!/usr/bin/env node
// notion-sync: the bulk route to Notion (order 102, L-012, L-013). Node, no dependencies, global fetch.
// The environment's proxy adds the integration token to any HTTPS request to api.notion.com, so this script
// sends no Authorization header and never reads, prints or stores a token.
//
//   node tools/notion-sync.mjs whoami
//   node tools/notion-sync.mjs chronicle [--kind=Order|Decision|History|Version|Rule|Prompt] [--match=REGEX] [--dry]
//   node tools/notion-sync.mjs page <repo-md-path> <parent-page-id> [--title=...] [--dry]
//
// chronicle: parses docs/OWNER_ORDERS.md (orders, game rules), DECISIONS.md, HISTORY.md, VERSIONS.md and
// docs/prompts/*.md; finds each record's row in the Chronicle data source (by the Name's prefix: "H-164", "D-200",
// "Order 97", ...), sets its properties and a one-sentence Summary, writes the full text as the page body, and creates
// rows that are missing. tools/notion-sync.manifest.json maps each source to its page id and a content hash, so a
// re-run touches only what changed (no secrets in it). Paced at under 3 requests a second; 429 and 5xx are retried.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

// Node's fetch ignores HTTPS_PROXY unless NODE_USE_ENV_PROXY=1; behind the session's proxy (which adds the token) re-run with it.
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY && process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = spawnSync(process.execPath, ['--disable-warning=UNDICI-EHPA', ...process.argv.slice(1)], { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } });
  process.exit(r.status ?? 1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_MANIFEST = path.join(ROOT, 'tools/notion-sync.manifest.json');
// --manifest=<path> (or NOTION_SYNC_MANIFEST) keeps a bulk run's writes off the tracked file: copy it over at the end of the run
const MANIFEST = path.resolve(process.env.NOTION_SYNC_MANIFEST || (process.argv.find(a => a.startsWith('--manifest=')) || '').slice(11) || DEFAULT_MANIFEST);
const NOTION_VERSION = '2026-03-11'; // data sources + markdown API era; checked against developers.notion.com 2026-11-27
const CHRONICLE_DS = '425d84dd-d9e3-81a9-add3-000bae552746';
const MIN_GAP_MS = 360; // about 2.8 requests a second (limit: about 3)

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.length ? v.join('=') : true]; }));
const pos = args.filter(a => !a.startsWith('--'));
const DRY = !!flags.dry;

// ---------- HTTP ----------
let lastCall = 0;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let nreq = 0;
let blocksCreated = 0; // every block written counts against a Free workspace's limit; deleting never gives capacity back
async function api(method, url, body) {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    nreq++;
    let res;
    try {
      res = await fetch('https://api.notion.com' + url, { method, headers: { 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      if (attempt < 5) { await sleep(1000 * 2 ** attempt); continue; }
      throw new Error(`${method} ${url}: network ${e.message}`);
    }
    if (res.status === 429 || res.status >= 500) {
      if (attempt < 6) { const ra = +res.headers.get('retry-after'); await sleep((ra > 0 ? ra * 1000 : 1000 * 2 ** attempt) + 200); lastCall = Date.now(); continue; }
    }
    const txt = await res.text();
    let j; try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 300) }; }
    if (res.status === 403 && j.code === 'restricted_resource') { const e = new Error(`${method} ${url}: 403 restricted_resource ${JSON.stringify(j.additional_data || {})} ${j.message || ''}`); e.fatal = true; throw e; } // block limit: STOP everything
    if (!res.ok) throw new Error(`${method} ${url}: ${res.status} ${j.code || ''} ${(j.message || j.raw || '').slice(0, 300)}`);
    return j;
  }
}

// ---------- markdown to blocks ----------
const LANGS = new Set(['javascript', 'typescript', 'json', 'bash', 'shell', 'html', 'css', 'python', 'markdown', 'yaml', 'sql', 'diff', 'java', 'c', 'swift', 'xml', 'plain text']);
const LANG_ALIAS = { js: 'javascript', mjs: 'javascript', ts: 'typescript', sh: 'bash', zsh: 'bash', yml: 'yaml', md: 'markdown', text: 'plain text', txt: 'plain text', '': 'plain text' };
const validUrl = u => /^https?:\/\/[^\s]+$/.test(u);

function chunkText(s, ann, link) {
  const out = [];
  for (let i = 0; i < s.length; i += 2000) {
    const t = { type: 'text', text: { content: s.slice(i, i + 2000) } };
    if (link && validUrl(link)) t.text.link = { url: link };
    if (ann && Object.keys(ann).length) t.annotations = ann;
    out.push(t);
  }
  return out;
}
const INLINE = [
  ['code', /`([^`]+)`/],
  ['link', /\[([^\]]+)\]\(([^)\s]+)\)/],
  ['bold', /(\*\*|__)(?=\S)(.+?)(?<=\S)\1/],
  ['strike', /~~(.+?)~~/],
  ['italic', /(?<![\w*])\*(?=\S)([^*]+?)(?<=\S)\*(?![\w*])|(?<![\w_])_(?=\S)([^_]+?)(?<=\S)_(?![\w_])/],
];
function inline(s, ann = {}, link = null) {
  let best = null;
  for (const [kind, re] of INLINE) { const m = re.exec(s); if (m && (!best || m.index < best.m.index)) best = { kind, m }; }
  if (!best) return s ? chunkText(s, ann, link) : [];
  const { kind, m } = best;
  const before = s.slice(0, m.index), after = s.slice(m.index + m[0].length);
  let mid;
  if (kind === 'code') mid = chunkText(m[1], { ...ann, code: true }, link);
  else if (kind === 'link') mid = inline(m[1], ann, validUrl(m[2]) ? m[2] : link);
  else if (kind === 'bold') mid = inline(m[2], { ...ann, bold: true }, link);
  else if (kind === 'strike') mid = inline(m[1], { ...ann, strikethrough: true }, link);
  else mid = inline(m[1] ?? m[2], { ...ann, italic: true }, link);
  return [...inline(before, ann, link), ...mid, ...inline(after, ann, link)];
}
const rt = s => { const r = inline(s); return r.length ? r : [{ type: 'text', text: { content: ' ' } }]; };
const splitRow = l => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
const isTableSep = l => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-');

export function mdToBlocks(md) {
  const lines = md.replace(/<!--[\s\S]*?-->/g, '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0, para = [];
  const flush = () => { if (para.length) { blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: rt(para.join(' ')) } }); para = []; } };
  const item = (type, text) => ({ object: 'block', type, [type]: { rich_text: rt(text) } });
  while (i < lines.length) {
    const l = lines[i];
    let m;
    if ((m = /^(\s*)(```|~~~)\s*([\w+-]*)/.exec(l))) { // fenced code
      flush();
      const fence = m[2], lang0 = m[3].toLowerCase(); const buf = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) buf.push(lines[i++]);
      i++;
      const ind = m[1].length; const code = buf.map(x => x.slice(Math.min(ind, x.length - x.trimStart().length))).join('\n');
      let lang = LANG_ALIAS[lang0] ?? lang0; if (!LANGS.has(lang)) lang = 'plain text';
      blocks.push({ object: 'block', type: 'code', code: { language: lang, rich_text: chunkText(code || ' ') } });
      continue;
    }
    if (!l.trim()) { flush(); i++; continue; }
    if ((m = /^(#{1,6})\s+(.*)$/.exec(l))) { flush(); const lv = Math.min(m[1].length, 3); blocks.push(item('heading_' + lv, m[2].replace(/\s*#+\s*$/, ''))); i++; continue; }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(l)) { flush(); blocks.push({ object: 'block', type: 'divider', divider: {} }); i++; continue; }
    if (l.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) { // table
      flush();
      const head = splitRow(l); const rows = []; i += 2;
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(splitRow(lines[i++]));
      const w = head.length;
      const mk = r => ({ object: 'block', type: 'table_row', table_row: { cells: Array.from({ length: w }, (_, k) => rt(r[k] ?? '')) } });
      for (let k = 0; k < Math.max(rows.length, 1); k += 98) // a table block holds at most 100 rows: split a longer one
        blocks.push({ object: 'block', type: 'table', table: { table_width: w, has_column_header: true, has_row_header: false, children: [mk(head), ...rows.slice(k, k + 98).map(mk)] } });
      continue;
    }
    if ((m = /^>\s?(.*)$/.exec(l))) { // quote
      flush(); const buf = [m[1]]; i++;
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      blocks.push(item('quote', buf.join(' ').trim() || ' ')); continue;
    }
    if ((m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(l))) { // list, one nested level
      flush();
      const base = m[1].length; const parents = []; // top-level items of this list
      while (i < lines.length) {
        const mm = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (mm) {
          const type = /^\d/.test(mm[2]) ? 'numbered_list_item' : 'bulleted_list_item';
          const b = item(type, mm[3].replace(/^\[[ xX]\]\s+/, ''));
          if (mm[1].length > base && parents.length) { const p = parents[parents.length - 1]; (p[p.type].children = p[p.type].children || []).push(b); b._last = b; parents._cur = b; }
          else { parents.push(b); blocks.push(b); parents._cur = b; }
          i++; continue;
        }
        if (lines[i].trim() && /^\s+\S/.test(lines[i]) && parents._cur) { // continuation line
          const c = parents._cur; const arr = c[c.type].rich_text; const extra = inline(' ' + lines[i].trim()); c[c.type].rich_text = arr.concat(extra); i++; continue;
        }
        break;
      }
      continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  // a rich_text array holds at most 100 elements: a very long paragraph becomes several blocks
  const fit = arr => arr.flatMap(b => {
    const c = b[b.type];
    if (c.children && b.type !== 'table') c.children = fit(c.children);
    if (!c.rich_text || c.rich_text.length <= 100) return [b];
    const parts = []; for (let k = 0; k < c.rich_text.length; k += 100) parts.push(c.rich_text.slice(k, k + 100));
    return parts.map((rtp, k) => ({ object: 'block', type: b.type, [b.type]: { ...c, rich_text: rtp, ...(k && c.children ? { children: undefined } : {}) } }));
  });
  blocks.splice(0, blocks.length, ...fit(blocks));
  const clean = b => { delete b._last; const c = b[b.type]?.children; if (c) c.forEach(clean); };
  blocks.forEach(clean);
  return blocks;
}
const countBlocks = b => 1 + ((b[b.type] && b[b.type].children) || []).reduce((n, c) => n + countBlocks(c), 0);
// request-sized batches: at most 100 top-level blocks and well under 1,000 in all
function batches(blocks) {
  const out = []; let cur = [], n = 0;
  for (const b of blocks) { const c = countBlocks(b); if (cur.length && (cur.length >= 100 || n + c > 600)) { out.push(cur); cur = []; n = 0; } cur.push(b); n += c; }
  if (cur.length) out.push(cur);
  return out;
}

// ---------- Notion page helpers ----------
async function clearChildren(pageId) {
  let n = 0;
  for (;;) {
    const r = await api('GET', `/v1/blocks/${pageId}/children?page_size=100`);
    if (!r.results.length) return n;
    for (const b of r.results) { await api('DELETE', `/v1/blocks/${b.id}`); n++; }
    if (!r.has_more) { const again = await api('GET', `/v1/blocks/${pageId}/children?page_size=1`); if (!again.results.length) return n; }
  }
}
async function appendBlocks(pageId, blocks) {
  for (const batch of batches(blocks)) { await api('PATCH', `/v1/blocks/${pageId}/children`, { children: batch }); blocksCreated += batch.reduce((n, b) => n + countBlocks(b), 0); }
}
async function createPage(parent, properties, blocks) {
  const bs = batches(blocks);
  const page = await api('POST', '/v1/pages', { parent, properties, children: bs[0] || [] });
  blocksCreated += (bs[0] || []).reduce((n, b) => n + countBlocks(b), 0);
  for (const b of bs.slice(1)) { await api('PATCH', `/v1/blocks/${page.id}/children`, { children: b }); blocksCreated += b.reduce((n, x) => n + countBlocks(x), 0); }
  return page.id;
}
async function replaceBody(pageId, blocks) { await clearChildren(pageId); await appendBlocks(pageId, blocks); }

// ---------- manifest ----------
const loadManifest = () => { for (const f of [MANIFEST, DEFAULT_MANIFEST]) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch {} } return { version: 1, records: {} }; };
const saveManifest = m => { const sorted = Object.fromEntries(Object.entries(m.records).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))); fs.writeFileSync(MANIFEST, JSON.stringify({ version: 1, records: sorted }, null, 1) + '\n'); };
const sha = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);

// ---------- chronicle records ----------
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/<!--[\s\S]*?-->/g, '').replace(/~~/g, '').replace(/\*\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*([^*\s][^*]*)\*/g, '$1').replace(/^[-> #]+/, '').replace(/\s+/g, ' ').trim();
const ABBR = /(?:e\.g|i\.e|vs|etc|approx|no|cf|St|Mr|Dr|Nov|Dec|Oct|Sep|Jan|Feb|Mar|Apr|Jun|Jul|Aug|v\d+)$/i;
// the first sentence, cut at a sentence boundary under max chars; else at a clause, else at a word (never mid-word)
export function firstSentence(s, max = 200) {
  s = strip(s);
  const re = /[.!?](?=\s+[A-Z0-9"'(])|\.$/g; let m, end = -1;
  while ((m = re.exec(s))) { const head = s.slice(0, m.index); if (ABBR.test(head) || (head.match(/\(/g) || []).length > (head.match(/\)/g) || []).length || (head.match(/"/g) || []).length % 2 || /\d$/.test(head) && /\b\d{1,2}$/.test(head) && s[m.index + 1] === ' ' && /^\s+\d/.test(s.slice(m.index + 1))) continue; end = m.index + 1; break; }
  if (end > 0 && end < 26 && s.length > end + 20) return firstSentence(s.slice(end), max); // a label such as "The conflict."
  if (end > 0 && end <= max) return s.slice(0, end);
  if (end < 0 && s.length <= max) return s;
  let lim = s.slice(0, max);
  const open = (t) => (t.match(/\(/g) || []).length > (t.match(/\)/g) || []).length;
  if (open(lim) && lim.lastIndexOf('(') > max * 0.4) lim = lim.slice(0, lim.lastIndexOf('(')).trimEnd();
  if ((lim.match(/"/g) || []).length % 2 && lim.lastIndexOf('"') > max * 0.4) lim = lim.slice(0, lim.lastIndexOf('"')).trimEnd();
  for (const sep of ['; ', ' - ', ': ', ', ']) { let k = lim.lastIndexOf(sep); if (k > max * 0.5) { let t = lim.slice(0, k); if (open(t) && t.lastIndexOf('(') > max * 0.4) t = t.slice(0, t.lastIndexOf('(')); return t.replace(/[,;:\s-]+$/, '') + '.'; } }
  const k = lim.lastIndexOf(' ');
  return lim.slice(0, k > 0 ? k : max).replace(/[,;:(\s-]+$/, '') + '…';
}
const cut = (s, n) => { if (s.length <= n) return s; const t = s.slice(0, n), i = t.lastIndexOf(' '); return t.slice(0, i > n * 0.6 ? i : n).replace(/[,;:(\s]+$/, '') + '…'; };
const firstPara = body => { for (const p of body.split(/\n\s*\n/)) { const c = strip(p.replace(/\n/g, ' ')); if (c.length > 15 && !/^\|/.test(c) && !/^[-=]+$/.test(c)) return c; } return ''; };
const refsOf = t => { const s = new Set(); for (const m of t.matchAll(/\border[s]?\s+(\d{1,3}(?:\s*(?:,|and|to|&)\s*\d{1,3})*)/gi)) for (const n of m[1].match(/\d+/g)) if (+n >= 1 && +n <= 200) s.add(+n); return [...s].sort((a, b) => a - b).join(', '); };
const dedent = (lines) => { const ind = Math.min(3, ...lines.filter(l => l.trim()).map(l => l.length - l.trimStart().length)); return lines.map(l => l.slice(Math.min(ind, l.length - l.trimStart().length))); };

export function parseRecords() {
  const recs = [];
  const add = r => recs.push({ ...r, key: r.kind + ':' + r.id });
  // orders and rules
  const secs = []; let cur = null;
  rd('docs/OWNER_ORDERS.md').split('\n').forEach(l => { if (/^## /.test(l)) { cur = { name: l.slice(3), lines: [] }; secs.push(cur); } else if (cur) cur.lines.push(l); });
  const promptMap = {};
  for (const sec of secs) {
    const kind = sec.name.startsWith('How to work') ? 'Order' : sec.name.startsWith('Game rules') ? 'Rule' : null; if (!kind) continue;
    const items = []; let it = null;
    for (const l of sec.lines) { const m = l.match(/^(\d+)\. (.*)/); if (m) { it = { n: +m[1], lines: [l] }; items.push(it); } else if (it) it.lines.push(l); }
    for (const x of items) {
      const text = x.lines.join('\n').replace(/\n+$/, '');
      const dm = text.match(/recorded\s+(\d{4}-\d\d-\d\d)/);
      const bm = x.lines[0].match(/\*\*(.+?)\*\*/);
      const title = cut(strip(bm ? bm[1] : x.lines[0].replace(/^\d+\. /, '')).replace(/[:.]+$/, ''), 80);
      for (const pm of text.matchAll(/docs\/prompts\/([\w.-]+\.md)/g)) promptMap[pm[1]] = promptMap[pm[1]] || x.n;
      const body = [x.lines[0].replace(/^\d+\. /, '').replace(/\s*·\s*recorded \d{4}-\d\d-\d\d(?: [\d:]+)?(?: ET)?\.?/, '.'), ...dedent(x.lines.slice(1))].join('\n').trim();
      add({ kind, id: String(x.n), num: x.n, date: dm ? dm[1] : null, name: `${kind} ${x.n} · ${title}`, sum: firstSentence(body), src: `docs/OWNER_ORDERS.md › ${sec.name.split(' (')[0]} #${x.n}`, refs: kind === 'Order' ? `Order ${x.n}` : '', md: body });
    }
  }
  // prompts
  let pi = 0;
  for (const f of fs.readdirSync(path.join(ROOT, 'docs/prompts')).filter(f => f.endsWith('.md')).sort()) {
    const t = rd('docs/prompts/' + f); pi++;
    const slug = f.replace(/^\d{4}-\d\d-\d\d-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
    const body = t.replace(/<!--[\s\S]*?-->/g, '').trim();
    const on = promptMap[f];
    add({ kind: 'Prompt', id: f, num: pi, date: /^\d{4}-\d\d-\d\d/.test(f) ? f.slice(0, 10) : null, name: `Prompt · ${slug[0].toUpperCase() + slug.slice(1)}`, sum: firstSentence(body.replace(/^#.*\n/, '').replace(/^>/gm, ''), 180), src: 'docs/prompts/' + f, refs: on ? `Order ${on}` : '', md: body });
  }
  // history and decisions
  const heads = (file, re) => { const L = rd(file).split('\n'), out = []; for (let k = 0; k < L.length; k++) if (re.test(L[k])) { let e = k + 1; while (e < L.length && !/^#{2,3} /.test(L[e])) e++; out.push({ head: L[k], body: L.slice(k + 1, e).join('\n').trim() }); } return out; };
  for (const h of heads('docs/HISTORY.md', /^### H-\d+/)) {
    const m = h.head.match(/^### H-(\d+)( addendum)? · (\d{4}-\d\d-\d\d)(?: [\d:]+)?(?: ET)? · (.*)$/); if (!m) { console.error('skip H head:', h.head.slice(0, 80)); continue; }
    add({ kind: 'History', id: m[1] + (m[2] ? '-addendum' : ''), num: +m[1], date: m[3], name: `H-${m[1]}${m[2] || ''} · ${cut(m[4], 110)}`, sum: firstSentence(firstPara(h.body)), src: `docs/HISTORY.md › H-${m[1]}`, refs: refsOf(h.head + '\n' + h.body), md: h.body });
  }
  for (const h of heads('docs/DECISIONS.md', /^### D-\d+/)) {
    const m = h.head.match(/^### D-(\d+) · (.*)$/); const d = (h.head.match(/\d{4}-\d\d-\d\d/) || [null])[0]; if (!m || !d) { console.error('skip D head:', h.head.slice(0, 80)); continue; }
    const title = m[2].replace(/\s*\((?:[^()]|\([^()]*\))*\)\s*$/, '');
    add({ kind: 'Decision', id: m[1], num: +m[1], date: d, name: `D-${m[1]} · ${cut(title, 110)}`, sum: firstSentence(firstPara(h.body)), src: `docs/DECISIONS.md › D-${m[1]}`, refs: refsOf(h.head), md: h.body });
  }
  // versions
  let vi = 0;
  for (const l of rd('docs/VERSIONS.md').split('\n')) {
    const m = l.match(/^\| (v[\w.-]+) \| (\d{4}-\d\d-\d\d) \| `?([0-9a-f]+)`? \| (.*) \|\s*$/); if (!m) continue; vi++;
    const desc = m[4].replace(/\s*·\s*build `?sha256:[0-9a-f]+`?.*$/, '');
    add({ kind: 'Version', id: m[1], num: vi, date: m[2], name: `${m[1]} · ${cut(desc.split(/[:(]/)[0].trim(), 80)}`, sum: firstSentence(desc), src: 'docs/VERSIONS.md › table', refs: '', md: `${m[1]} (${m[2]}), commit \`${m[3]}\`\n\n${m[4]}` });
  }
  const seen = new Set(); for (const r of recs) { if (seen.has(r.key)) { console.error('duplicate key', r.key); r.key += '#' + r.num; } seen.add(r.key); }
  return recs;
}
// the Name's prefix by which a row is matched: "H-164", "D-200", "Order 97", "v2.0.0", whole name for a prompt
const prefixOf = (name, kind) => kind === 'Prompt' ? name.trim() : name.split(' · ')[0].trim();
const props = r => {
  const p = { Name: { title: [{ type: 'text', text: { content: r.name.slice(0, 2000) } }] }, Kind: { select: { name: r.kind } }, Summary: { rich_text: r.sum ? [{ type: 'text', text: { content: r.sum.slice(0, 2000) } }] : [] }, Source: { rich_text: [{ type: 'text', text: { content: r.src.slice(0, 2000) } }] }, 'Order refs': { rich_text: r.refs ? [{ type: 'text', text: { content: r.refs.slice(0, 2000) } }] : [] }, Number: { number: r.num } };
  if (r.date) p.Date = { date: { start: r.date } };
  return p;
};

async function queryAll() {
  const rows = []; let cursor;
  do {
    const r = await api('POST', `/v1/data_sources/${CHRONICLE_DS}/query`, { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) });
    rows.push(...r.results); cursor = r.has_more ? r.next_cursor : null;
  } while (cursor);
  return rows;
}
const titleOf = pg => (pg.properties.Name?.title || []).map(t => t.plain_text).join('');

// ---------- commands ----------
async function whoami() { const u = await api('GET', '/v1/users/me'); console.log(`${u.type} "${u.name}" ${u.id}  (Notion-Version ${NOTION_VERSION})`); }

async function chronicle() {
  let recs = parseRecords();
  if (flags.kind) recs = recs.filter(r => r.kind.toLowerCase() === String(flags.kind).toLowerCase());
  if (flags.match) { const re = new RegExp(flags.match, 'i'); recs = recs.filter(r => re.test(r.name)); }
  console.log(`parsed ${recs.length} records`);
  const man = loadManifest();
  const existing = new Map(); let dupes = 0;
  if (true) { // the row index (reads are cheap, so a dry run shows the real create/update split): one paginated query
    for (const pg of await queryAll()) { const nm = titleOf(pg); const key = nm.split(' · ')[0].trim(); const k2 = nm.startsWith('Prompt') ? nm.trim() : key; if (existing.has(k2)) dupes++; else existing.set(k2, pg.id); }
    console.log(`chronicle has ${existing.size} rows${dupes ? ` (${dupes} duplicate names ignored)` : ''}`);
  }
  const tally = { created: 0, updated: 0, unchanged: 0, failed: 0 }; const fails = [];
  let done = 0;
  for (const r of recs) {
    const hash = sha(JSON.stringify([r.name, r.sum, r.date, r.refs, r.src, r.num, r.md]));
    const m = man.records[r.key];
    if (flags.limit && !DRY && done >= +flags.limit) break; // staged runs: --limit=25 writes at most 25 records
    try {
      if (m && m.hash === hash && m.pageId) { tally.unchanged++; continue; }
      const pid = (m && m.pageId) || existing.get(prefixOf(r.name, r.kind));
      const blocks = mdToBlocks(r.md);
      if (DRY) { console.log(`[dry] ${pid ? 'update' : 'create'} ${r.name}\n      sum: ${r.sum}\n      body: ${blocks.length} blocks, ${r.md.length} chars`); tally[pid ? 'updated' : 'created']++; continue; }
      let id = pid;
      if (pid) { await api('PATCH', `/v1/pages/${pid}`, { properties: props(r) }); await replaceBody(pid, blocks); tally.updated++; }
      else { id = await createPage({ type: 'data_source_id', data_source_id: CHRONICLE_DS }, props(r), blocks); tally.created++; }
      man.records[r.key] = { pageId: id, hash, name: r.name.slice(0, 60) };
      if (++done % 10 === 0) { saveManifest(man); process.stderr.write(`  ${done} written, ${nreq} requests, ${blocksCreated} blocks created\n`); }
    } catch (e) {
      if (e.fatal) { if (!DRY) saveManifest(man); console.error(`STOPPED (block limit): ${e.message}\nblocks created this run: ${blocksCreated}; written ${done} records; at ${r.name}`); process.exit(3); }
      tally.failed++; fails.push(`${r.name}: ${e.message}`); console.error('FAILED', r.name.slice(0, 50), e.message.slice(0, 160)); }
  }
  if (!DRY) saveManifest(man);
  console.log(`done: ${tally.created} created, ${tally.updated} updated, ${tally.unchanged} unchanged, ${tally.failed} failed (${nreq} requests, ${blocksCreated} blocks created)`);
  if (fails.length) { console.log('failures:'); fails.forEach(f => console.log(' - ' + f.slice(0, 220))); process.exitCode = 1; }
}

async function pageCmd() {
  const [file, parent] = pos.slice(1);
  if (!file || !parent) { console.error('usage: page <repo-md-path> <parent-page-id> [--title=...]'); process.exit(2); }
  const rel = path.relative(ROOT, path.resolve(file)).replace(/\\/g, '/');
  const md = fs.readFileSync(path.resolve(file), 'utf8');
  const h1 = md.match(/^#\s+(.+)$/m);
  const title = String(flags.title || (h1 ? strip(h1[1]) : path.basename(file, '.md'))).slice(0, 200);
  const body = flags.title || !h1 ? md : md.replace(h1[0], '');
  const blocks = mdToBlocks(body);
  const key = 'page:' + rel, hash = sha(JSON.stringify([title, parent, md]));
  const man = loadManifest(); const m = man.records[key];
  if (m && m.hash === hash) { console.log(`unchanged: ${rel} -> ${m.pageId}`); return; }
  if (DRY) { console.log(`[dry] ${m ? 'update' : 'create'} "${title}" from ${rel}: ${blocks.length} blocks`); return; }
  const properties = { title: { title: [{ type: 'text', text: { content: title } }] } };
  let id;
  if (m && m.pageId) { id = m.pageId; await api('PATCH', `/v1/pages/${id}`, { properties }); await replaceBody(id, blocks); console.log(`updated: ${rel} -> ${id}`); }
  else { id = await createPage({ type: 'page_id', page_id: parent }, properties, blocks); console.log(`created: ${rel} -> ${id}`); }
  console.log(`blocks created: ${blocksCreated}`);
  man.records[key] = { pageId: id, hash, parent, name: title };
  saveManifest(man);
}

const cmd = pos[0];
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const run = { whoami, chronicle, page: pageCmd }[cmd];
  if (!run) { console.error('commands: whoami | chronicle [--kind= --match= --dry] | page <md> <parent-id> [--title=]'); process.exit(2); }
  run().catch(e => { console.error('error:', e.message); process.exit(1); });
}
