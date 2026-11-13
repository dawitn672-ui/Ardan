// Gate 2 · the demo page: the lineup, the profile cards, the face and build maker, the ages, the gear by quality,
// and the measured cost. Everything on it is drawn by compose() from a look; the page only lays it out.
import { compose } from './figure.js';
import { SITTERS } from './sitters.js';
import { SKIN, HAIR, EYES, DYES } from './palette.js';
import { FACE } from './head.js';
import { HAIRS, BEARDS } from './hair.js';
import { OUTFITS, HEADWEAR, swordArt, pauldronArt } from './gear.js';
import { POSES, BUILD_KEYS } from './rig.js';
import { Scene } from './scene.js';
import { stream } from './g.js';
import { pack, unpack } from '../../../../src/people/engine/face.js';

const $ = (q, el = document) => el.querySelector(q), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
let uid = 0; const nid = () => 'g' + (uid++).toString(36) + '_';

// ------------------------------------------------------------------ the lineup --------------------------------------
// a pale keep, a curtain wall and two banners behind each row: place, kept quiet so the people lead
function backdrop(k) {
  const r = stream('backdrop', String(k)), far = '#dcd7e6', near = '#d0cadd', cloth = '#c2b8d8', gold = '#d8c69a';
  const cren = (x0, x1, y, c) => { let d = `M${x0} 720V${y}`; for (let x = x0; x < x1 - .1; x += c * 2) d += `h${c}v${-c * .8}h${c}v${c * .8}`; return d + 'V720Z'; };
  const roofed = (x, w, y) => `M${x} 720V${y}h${w}V720ZM${x - w * .14} ${y}L${x + w / 2} ${y - w * 1.7}L${x + w * 1.14} ${y}Z`;
  let d1 = cren(0, 1300, 372, 13) + cren(520 + k * 40, 760 + k * 40, 200, 12), d2 = cren(0, 1300, 452, 16);
  for (const [x, w, y] of [[150 + r() * 60, 64, 250], [400 + r() * 50, 46, 300], [900 + r() * 60, 70, 232], [1120 + r() * 40, 50, 290]]) d1 += roofed(x, w, y);
  for (const x of [300 + r() * 40, 1010 + r() * 40]) d2 += cren(x, x + 96, 388, 12);
  const banner = x => `<rect x="${x - 2.5}" y="96" width="5" height="470" fill="${near}"/><path d="M${x + 4} 112h78v236l-39 -34l-39 34Z" fill="${cloth}"/><path d="M${x + 4} 112h78v14h-78Z" fill="${gold}"/><circle cx="${x + 43}" cy="206" r="17" fill="${gold}"/><path d="${[...Array(8)].map((_, i) => { const a = i * Math.PI / 4, c = Math.cos(a), s2 = Math.sin(a); return `M${(x + 43 + c * 22).toFixed(1)} ${(206 + s2 * 22).toFixed(1)}L${(x + 43 + c * 31).toFixed(1)} ${(206 + s2 * 31).toFixed(1)}`; }).join('')}" stroke="${gold}" stroke-width="5" stroke-linecap="round"/>`;
  return `<svg class="bk" viewBox="0 0 1300 720" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bkg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfc8dc"/><stop offset="1" stop-color="#e8e5ee"/></linearGradient></defs><path d="${d1}" fill="${far}"/><path d="${d2}" fill="${near}"/>${banner(58)}${banner(1160)}<rect y="540" width="1300" height="180" fill="url(#bkg${k})"/><path d="M0 540h1300" stroke="#bfb7cf" stroke-width="1.5"/></svg>`;
}
function lineup() {
  const rows = [SITTERS.slice(0, 5), SITTERS.slice(5, 10)];
  $('#stage').innerHTML = rows.map((r, k) => { const top = Math.max(...r.map(s => (s.height || (s.sex === 'F' ? 165 : 178)) * 10 * (s.staff === 'spear' ? 1.13 : 1.05))) + 30;
    return `<div class="row">${backdrop(k)}${r.map(s => `<figure class="fig">${compose(s, { crop: 'figure', w: 880, top, below: 110, px: .29, id: nid() }).svg}<figcaption><b>${esc(s.name)}</b><span>${esc(s.estate)} · ${esc(POSES[s.pose].name.toLowerCase())}</span></figcaption></figure>`).join('')}</div>`; }).join('');
}
// ------------------------------------------------------------------ the cards ---------------------------------------
const SIGIL = { Serf: 'M0 -6L6 0L0 6L-6 0Z', Peasant: 'M0 -6L6 0L0 6L-6 0Z', Artisan: 'M-5 -5H5V5H-5Z', Merchant: 'M-5 -5H5V5H-5Z', Priest: 'M0 -6.5A6.5 6.5 0 1 0 .01 -6.5Z', Soldier: 'M0 -7L6 -3V3L0 7L-6 3V-3Z', Noble: 'M0 -7L6 -3V3L0 7L-6 3V-3Z', Royal: 'M-7 5L-7 -4L-3.5 0L0 -6L3.5 0L7 -4L7 5Z' };
export function card(s, o = {}) {
  const art = compose(s, { crop: o.crop || 'card', width: o.width || 250, id: nid() }).svg;
  return `<article class="card e-${esc(s.estate.toLowerCase())}"><div class="art">${art}</div><div class="plate">
    <p class="estate"><svg viewBox="-8 -8 16 16" width="12" height="12" aria-hidden="true"><path d="${SIGIL[s.estate] || SIGIL.Peasant}"/></svg>${esc(s.estate)}</p>
    <h3>${esc(s.name)}</h3><p class="rank">${esc(s.rank)}</p><p class="words">${esc(s.words)}</p>
    <dl>${(s.marks || []).map(m => `<div><dt>${esc(m[0])}</dt><dd>${esc(m[1])}</dd></div>`).join('')}</dl></div></article>`;
}
// ------------------------------------------------------------------ the maker ---------------------------------------
const PRE = {
  Face: [['Oval', {}], ['Long', { faceLen: .8, jawW: -.2, cheekbones: .2 }], ['Square', { jawW: .8, jawShape: .9, chinW: .7, faceLen: -.2 }], ['Heart', { jawW: -.6, chinW: -.8, cheekbones: .7, foreheadW: .6 }], ['Round', { faceLen: -.7, cheeks: .9, jawShape: -.6, chinW: .3 }], ['Diamond', { cheekbones: 1, jawW: -.4, foreheadW: -.7, chinW: -.3 }], ['V-line', { jawW: -.8, jawShape: -1, chinW: -1, chin: .4 }], ['Broad', { jawW: 1, cheekbones: .5, faceLen: -.4, chinW: 1 }], ['Lantern', { faceLen: .6, jawW: .5, jawShape: .7, chin: .9 }], ['Gaunt', { cheeks: -1, cheekbones: .8, faceLen: .4 }]],
  Eyes: [['Almond', {}], ['Narrow', { lids: -.9, eyeSize: .1 }], ['Round', { lids: .9, eyeSize: .5 }], ['Hooded', { lids: -.6, eyeDepth: -.7 }], ['Fox', { eyeTilt: 1, lids: -.4, lashes: .6 }], ['Downturned', { eyeTilt: -1 }], ['Wide-set', { eyeGap: 1 }], ['Close-set', { eyeGap: -1 }], ['Deep-set', { eyeDepth: -1, lids: -.2 }], ['Doe', { eyeSize: 1, irisSize: .8, lids: .6, lashes: 1 }]],
  Brows: [['Level', {}], ['Arched', { browShape: 1 }], ['Stern', { browTilt: 1, browWeight: .5, browRidge: .5 }], ['Gentle', { browTilt: -1, browShape: .4 }], ['Heavy', { browWeight: 1, browRidge: .8 }], ['Fine', { browWeight: -1 }], ['Knit', { browGap: 1, browTilt: .6 }]],
  Nose: [['Straight', {}], ['Aquiline', { noseBridge: 1, noseLen: .4, noseProj: .6 }], ['Snub', { noseTip: -1, noseLen: -.7, noseBridge: -.5 }], ['Broad', { noseW: 1, tipShape: .7, noseProj: -.4 }], ['Long', { noseLen: 1, noseTip: .5 }], ['Button', { noseLen: -1, tipShape: .5, noseW: -.3 }], ['Hawk', { noseBridge: 1, noseTip: 1, noseLen: .7, noseW: -.4 }], ['Fine', { noseW: -1, tipShape: -1 }]],
  Mouth: [['Even', {}], ['Thin', { lips: -1 }], ['Full', { lips: 1, lowerLip: .5 }], ['Wide', { mouthW: 1 }], ['Small', { mouthW: -1, lips: .3 }], ['Stern', { mouthCurve: -1, lips: -.5 }], ['Easy', { mouthCurve: 1 }], ['Heavy lower', { lowerLip: 1, bite: .6 }]],
  Ears: [['Plain', {}], ['Small', { earSize: -1 }], ['Large', { earSize: 1 }], ['Standing out', { earSet: 1 }], ['Pointed', { earPoint: 1 }], ['Long-lobed', { lobes: 1, earSize: .4 }]],
};
const BUILDS = [['Middling', {}], ['Slight', { weight: -.5, muscle: -.7, shoulders: -.6 }], ['Lean', { weight: -.8, muscle: .1 }], ['Athletic', { muscle: .6, shoulders: .4, weight: -.2, posture: .4 }], ['Brawny', { muscle: 1, shoulders: .9, neck: .7, weight: .3 }], ['Stout', { weight: .8, hips: .4, neck: .3 }], ['Heavy', { weight: 1, shoulders: .4, hips: .6, neck: .6 }], ['Rangy', { legs: 1, weight: -.5, shoulders: .2 }], ['Stooped', { posture: -1, weight: -.3, shoulders: -.3 }], ['Proud', { posture: 1, shoulders: .3 }]];
const SCARS = [['cheek', 'A cut on the cheek'], ['brow', 'A cut through the brow'], ['lip', 'A split lip, healed'], ['nose', 'A cut across the nose'], ['jaw', 'A cut along the jaw'], ['forehead', 'A cut on the forehead'], ['burn', 'A burn on the cheek'], ['eye', 'A blinded eye'], ['nosebreak', 'A broken nose']];
const HEIGHTS = [[150, 'very short'], [160, 'short'], [170, 'middling'], [180, 'tall'], [190, 'very tall'], [200, 'towering']];
const TABS = ['Face', 'Eyes', 'Nose & mouth', 'Hair', 'Skin & marks', 'Body', 'Dress'];
const M = { look: null, tab: 'Face', n: 0, thumbs: {} };

const NAMES = { faceLen: 'Face length', jawW: 'Jaw width', jawShape: 'Jaw line', chin: 'Chin', chinW: 'Chin width', cheekbones: 'Cheekbones', cheeks: 'Cheeks', forehead: 'Forehead', foreheadW: 'Temples', cleft: 'Chin cleft', eyeSize: 'Eye size', eyeGap: 'Eye spacing', eyeTilt: 'Eye slant', lids: 'Lids', eyeDepth: 'Eye depth', irisSize: 'Iris', lashes: 'Lashes', browRidge: 'Brow ridge', browShape: 'Brow shape', browWeight: 'Brow weight', browTilt: 'Brow set', browGap: 'Brow gap', noseLen: 'Nose length', noseBridge: 'Bridge', noseTip: 'Tip', noseW: 'Nose width', tipShape: 'Tip shape', noseProj: 'Projection', mouthW: 'Mouth width', lips: 'Lips', lowerLip: 'Lower lip', upperLip: 'Upper lip', bite: 'Bite', mouthCurve: 'Corners', earSize: 'Ear size', earSet: 'Ear set', earPoint: 'Ear tip', lobes: 'Lobes', weight: 'Weight', muscle: 'Muscle', shoulders: 'Shoulders', hips: 'Hips', legs: 'Legs', neck: 'Neck', posture: 'Posture', smile: 'Expression', grey: 'Grey', hairThick: 'Thickness', hairline: 'Hairline', freckles: 'Freckles', moles: 'Moles', yaw: 'Head' };
const slider = (key, lo, hi, v, path = 'g') => `<label class="sl"><span class="nm">${esc(NAMES[key] || key)}</span><span class="lo">${esc(lo)}</span><input type="range" min="-1" max="1" step="0.05" value="${v}" data-p="${path}" data-k="${key}" aria-label="${esc(lo + ' to ' + hi)}"><span class="hi">${esc(hi)}</span></label>`;
const chips = (kind, items, cur) => `<div class="chips">${items.map(([id, label, on]) => `<button type="button" class="chip${(on ?? id === cur) ? ' on' : ''}" data-c="${kind}" data-v="${esc(id)}">${esc(label)}</button>`).join('')}</div>`;
const swatches = (kind, pal, cur, col) => `<div class="sw">${Object.entries(pal).map(([id, v]) => `<button type="button" class="s${id === cur ? ' on' : ''}" data-c="${kind}" data-v="${id}" style="background:${col(v)}" aria-label="${esc(v.name || id)}"></button>`).join('')}</div>`;
const group = k => FACE.filter(f => f[3] === k).map(f => slider(f[0], f[1], f[2], M.look.g[f[0]] || 0)).join('');
const presets = k => `<div class="chips pre">${PRE[k].map(([n]) => `<button type="button" class="chip" data-c="pre" data-v="${k}|${esc(n)}">${esc(n)}</button>`).join('')}</div>`;

function panel() {
  const L = M.look, t = M.tab, h = [];
  const H3 = s => h.push(`<h4>${s}</h4>`);
  if (t === 'Face') { H3('Shape of the face'); h.push(presets('Face'), group('Face')); }
  if (t === 'Eyes') { H3('Eyes'); h.push(presets('Eyes'), group('Eyes')); H3('Colour'); h.push(swatches('eyes', Object.fromEntries(Object.entries(EYES).filter(e => e[0] !== 'milky')), L.eyes, v => `radial-gradient(circle at 50% 62%, ${v.l}, ${v.b} 55%, ${v.ring})`)); H3('Brows'); h.push(presets('Brows'), group('Brows')); }
  if (t === 'Nose & mouth') { H3('Nose'); h.push(presets('Nose'), group('Nose')); H3('Mouth'); h.push(presets('Mouth'), group('Mouth'), slider('smile', 'set', 'smiling', L.smile || 0, '')); H3('Ears'); h.push(presets('Ears'), group('Ears')); }
  if (t === 'Hair') {
    H3('Style'); h.push(`<div class="thumbs">${Object.entries(HAIRS).map(([id, v]) => `<button type="button" class="th${id === L.hair ? ' on' : ''}" data-c="hair" data-v="${id}"><span class="tv" data-th="${id}"></span><span class="tn">${esc(v.name)}</span></button>`).join('')}</div>`);
    H3('Colour'); h.push(swatches('hairColor', HAIR, L.hairColor, v => `linear-gradient(135deg, ${v.l}, ${v.b} 45%, ${v.s})`), slider('grey', 'no grey', 'all grey', (L.grey || 0) * 2 - 1, 'grey01'), slider('hairThick', 'thin', 'thick', L.g.hairThick || 0), slider('hairline', 'low hairline', 'high hairline', L.g.hairline || 0));
    H3('Beard'); h.push(chips('beard', Object.entries(BEARDS).map(([id, v]) => [id, v.name]), L.beard || 'none'));
  }
  if (t === 'Skin & marks') { H3('Skin'); h.push(swatches('skin', SKIN, L.skin, v => `linear-gradient(135deg, ${v.l}, ${v.b} 50%, ${v.s})`), slider('freckles', 'no freckles', 'freckled', L.g.freckles ?? -1), slider('moles', 'no moles', 'several', L.g.moles ?? -1)); H3('Scars (press to add, again to move to the other side, again to remove)'); h.push(chips('scar', SCARS.map(([k, n]) => { const sc = (L.scars || []).find(x => x.k === k); return [k, n + (sc ? (sc.side < 0 ? ' · left' : ' · right') : ''), !!sc]; }))); h.push(chips('fresh', [['1', 'Fresh wounds', !!(L.scars || []).some(x => x.fresh)]])); }
  if (t === 'Body') {
    H3('Sex and age'); h.push(chips('sex', [['M', 'Man'], ['F', 'Woman']], L.sex), `<label class="sl age"><span class="nm">Age</span><span class="lo">child</span><input type="range" min="4" max="90" step="1" value="${L.age}" data-p="" data-k="age" aria-label="age"><span class="hi">old · <b id="ageN">${L.age}</b> years</span></label>`);
    H3('Height'); h.push(chips('height', HEIGHTS.map(([cm, w]) => [String(cm), w]), String(HEIGHTS.reduce((a, b) => Math.abs(b[0] - (L.height || 175)) < Math.abs(a[0] - (L.height || 175)) ? b : a)[0])));
    H3('Build'); h.push(`<div class="chips pre">${BUILDS.map(([n]) => `<button type="button" class="chip" data-c="build" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`, BUILD_KEYS.map(b => slider(b[0], b[1], b[2], (L.build || {})[b[0]] || 0, 'build')).join(''));
    H3('Stance'); h.push(chips('pose', Object.entries(POSES).map(([id, v]) => [id, v.name]), L.pose), slider('yaw', 'head turned left', 'turned right', -(L.yaw ?? 12) / 18, 'yaw'));
  }
  if (t === 'Dress') {
    H3('Outfit'); h.push(chips('outfit', Object.entries(OUTFITS).map(([id, v]) => [id, v.name.split(':')[0]]), L.outfit));
    H3('Dye of the main garment'); h.push(swatches('dye', Object.fromEntries(Object.entries(DYES).map(([k, v]) => [k, { name: k, b: v }])), L.dye, v => v.b));
    H3('On the head'); h.push(chips('headwear', Object.entries(HEADWEAR).map(([id, v]) => [id, v.name]), L.headwear || 'none'));
    H3('Cloak'); h.push(chips('cloak', [['', 'As the outfit'], ['none', 'None'], ['navy', 'Navy'], ['crimson', 'Crimson'], ['forest', 'Forest'], ['charcoal', 'Charcoal'], ['murrey', 'Murrey']], L.cloak || ''));
    H3('Make of arms and armour'); h.push(chips('quality', [['', 'As the outfit'], ['1', 'Plain'], ['2', 'Fine'], ['3', 'Masterwork']], String(L.quality || '')), chips('weapon', [['', 'As the outfit'], ['sword', 'Wear a sword'], ['none', 'Unarmed']], L.weapon || ''));
  }
  $('#panel').innerHTML = h.join('');
  if (t === 'Hair') thumbs();
}
function thumbs() {
  const base = { ...clone(M.look), headwear: 'none', scars: [] }, key = JSON.stringify([base.sex, base.age, base.skin, base.hairColor, base.g.hairThick, base.g.hairline, base.grey]);
  if (M.thumbs.key !== key) M.thumbs = { key };
  for (const el of document.querySelectorAll('[data-th]')) { const id = el.dataset.th; el.innerHTML = M.thumbs[id] || (M.thumbs[id] = compose({ ...base, hair: id, beard: 'none' }, { crop: 'face', width: 70, lod: 0, fx: false, id: nid() }).svg); }
}
function draw() {
  const L = M.look, t0 = performance.now();
  const bust = compose(L, { crop: 'portrait', width: 430, id: 'mb' + (M.n++ % 2) + '_' }), t1 = performance.now();
  const fig = compose(L, { crop: 'figure', w: 940, top: 2180, below: 110, px: .2, id: 'mf' + (M.n % 2) + '_' });
  $('#mBust').innerHTML = bust.svg; $('#mFig').innerHTML = fig.svg;
  $('#mNote').textContent = `Drawn in ${(t1 - t0).toFixed(0)} ms · ${bust.shapes} shapes · ${(bust.svg.length / 1024).toFixed(0)} KB of SVG`;
  $('#mCode').textContent = pack(L.g);
  clearTimeout(M.t); M.t = setTimeout(ages, 140);
}
const AGES = [[8, 'At eight'], [18, 'At eighteen'], [36, 'At thirty-six'], [70, 'At seventy']];
const SOFT = { knight: 1, soldier: 1, cuirassier: 1, royal: 1, merchant: 1, priest: 1, smith: 1 };
const atAge = (L, a) => ({ ...clone(L), age: a, grey: a < 40 ? 0 : Math.max(L.grey || 0, Math.min(1, (a - 42) / 28)), beard: a < 17 ? 'none' : L.beard, scars: a < 16 ? [] : L.scars, headwear: a < 14 ? 'none' : L.headwear, outfit: a < 12 && (SOFT[L.outfit] || L.outfit === 'lady' || L.outfit === 'kirtle') ? 'smock' : a < 21 && SOFT[L.outfit] ? 'squire' : L.outfit, gear: null, pose: 'ease' });
function ages() { $('#mAges').innerHTML = AGES.map(([a, n]) => `<figure>${compose(atAge(M.look, a), { crop: 'bust', width: 150, lod: 1, id: nid() }).svg}<figcaption>${n}</figcaption></figure>`).join(''); }
function load(s) { M.look = { build: {}, scars: [], ...clone(s) }; M.look.g = { ...(s.g || {}) }; panel(); draw(); document.querySelectorAll('#who .chip').forEach(b => b.classList.toggle('on', b.dataset.v === s.id)); }
function surprise() {
  const r = stream('surprise', String(++M.seed)), L = M.look, pick = o => r.pick(Object.keys(o)), gauss = () => Math.max(-1, Math.min(1, (r() + r() + r() - 1.5) * 1.1));
  L.g = {}; for (const f of FACE) L.g[f[0]] = Math.round(gauss() * 20) / 20;
  for (let i = 0; i < 4; i++) L.g[r.pick(FACE)[0]] = (r() < .5 ? -1 : 1) * (.7 + .3 * r());
  L.g.freckles = r() < .25 ? r.s() : -1; L.g.moles = r() < .3 ? r.s() : -1; L.g.cleft = Math.min(L.g.cleft, r() < .2 ? 1 : -1); L.g.earPoint = -1;
  L.skin = pick(SKIN); L.hairColor = pick(HAIR); L.eyes = r.pick(Object.keys(EYES).filter(k => k !== 'milky')); L.sex = r() < .5 ? 'M' : 'F'; L.age = r.i(16, 62); L.grey = Math.max(0, (L.age - 45) / 30);
  const hs = Object.keys(HAIRS); L.hair = L.sex === 'M' ? r.pick(hs.slice(1, 18)) : r.pick(hs.slice(15)); L.beard = L.sex === 'M' && r() < .55 ? r.pick(Object.keys(BEARDS)) : 'none';
  L.build = {}; for (const b of BUILD_KEYS) L.build[b[0]] = Math.round(gauss() * 10) / 10; L.height = r.pick(HEIGHTS)[0]; L.yaw = r.i(-14, 14); L.scars = r() < .2 ? [{ k: r.pick(SCARS)[0], side: r() < .5 ? -1 : 1 }] : [];
  L.outfit = pick(OUTFITS); L.pose = pick(POSES); L.headwear = 'none'; L.dye = null; L.id = 'roll' + M.seed; L.name = 'A stranger';
  panel(); draw();
}
function maker() {
  M.seed = 0;
  $('#who').innerHTML = SITTERS.map(s => `<button type="button" class="chip" data-c="who" data-v="${s.id}">${esc(s.name)}</button>`).join('') + '<button type="button" class="chip gold" data-c="roll" data-v="1">Surprise me</button>';
  $('#tabs').innerHTML = TABS.map(t => `<button type="button" role="tab" class="tab${t === M.tab ? ' on' : ''}" data-c="tab" data-v="${esc(t)}">${esc(t)}</button>`).join('');
  const root = $('#maker');
  root.addEventListener('input', e => {
    const el = e.target; if (el.type !== 'range') return; const L = M.look, k = el.dataset.k, v = +el.value, p = el.dataset.p;
    if (p === 'g') L.g[k] = v; else if (p === 'build') (L.build = L.build || {})[k] = v; else if (p === 'grey01') L.grey = (v + 1) / 2; else if (p === 'yaw') L.yaw = Math.round(-v * 18); else if (k === 'age') { L.age = v; const n = $('#ageN'); if (n) n.textContent = v; } else L[k] = v;
    draw(); if (M.tab === 'Hair' && (k === 'hairThick' || k === 'hairline' || p === 'grey01')) { clearTimeout(M.tt); M.tt = setTimeout(thumbs, 250); }
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return; const c = b.dataset.c, v = b.dataset.v, L = M.look;
    if (c === 'tab') { M.tab = v; document.querySelectorAll('#tabs .tab').forEach(x => x.classList.toggle('on', x.dataset.v === v)); panel(); return; }
    if (c === 'who') return load(SITTERS.find(s => s.id === v));
    if (c === 'roll') return surprise();
    if (c === 'pre') { const [k, n] = v.split('|'), set = PRE[k].find(x => x[0] === n)[1]; for (const f of FACE) if (f[3] === k || (k === 'Eyes' && false)) L.g[f[0]] = 0; Object.assign(L.g, set); }
    else if (c === 'build') L.build = { ...BUILDS.find(x => x[0] === v)[1] };
    else if (c === 'scar') { const sc = (L.scars = L.scars || []).find(x => x.k === v); if (!sc) L.scars.push({ k: v, side: 1 }); else if (sc.side > 0) sc.side = -1; else L.scars = L.scars.filter(x => x !== sc); }
    else if (c === 'fresh') { const on = !(L.scars || []).some(x => x.fresh); for (const sc of L.scars || []) sc.fresh = on; }
    else if (c === 'height') L.height = +v; else if (c === 'quality') L.quality = v ? +v : null;
    else if (c === 'outfit') { L.outfit = v; L.dye = null; L.gear = null; }
    else L[c] = v || null;
    if (c === 'sex' && v === 'F') L.beard = 'none';
    panel(); draw();
  });
  $('#mPaste').addEventListener('click', () => { const v = ($('#mIn').value || '').trim(), g = unpack(v); $('#mMsg').textContent = g ? 'Loaded.' : 'That is not a face code (23 letters, digits, - or _).'; if (g) { for (const k of Object.keys(g)) if (FACE.some(f => f[0] === k) || ['hairThick', 'hairline', 'freckles', 'moles'].includes(k)) M.look.g[k] = g[k]; panel(); draw(); } });
  load(SITTERS.find(s => s.id === 'edric'));
}
// ------------------------------------------------------------------ four ages, two people ---------------------------
function fourAges() {
  $('#ages').innerHTML = ['alys', 'wat'].map(id => { const s = SITTERS.find(x => x.id === id); return `<div class="agerow"><p class="who"><b>${esc(s.name.split(' ')[0])}</b><span>the same face code at four ages; only the years differ</span></p>${[[8, 'eight'], [17, 'seventeen'], [34, 'thirty-four'], [68, 'sixty-eight']].map(([a, n]) => `<figure>${compose({ ...atAge({ ...s, scars: a < 30 ? [] : s.scars, beard: a < 25 ? 'none' : a > 60 ? 'short' : s.beard }, a), outfit: a < 12 ? 'smock' : s.outfit === 'soldier' && a < 20 ? 'squire' : s.outfit, hair: a < 12 ? (s.sex === 'F' ? 'pigtails' : 'bowl') : s.hair, pose: 'ease', headwear: a > 60 && s.sex === 'F' ? 'veil' : 'none' }, { crop: 'bust', width: 190, id: nid() }).svg}<figcaption>At ${n}</figcaption></figure>`).join('')}</div>`; }).join('');
}
// ------------------------------------------------------------------ gear by quality ---------------------------------
function gearSheet() {
  const names = [['Plain', 'the levy\'s issue: iron fittings, a leather grip'], ['Fine', 'a knight\'s own: bronze mounts, a wired grip'], ['Masterwork', 'one of a kind: gilt, engraved, a garnet in the pommel']];
  const S = new Scene('sw_', { px: .62, lod: 2 }); S.layer('weapon');
  for (const q of [1, 2, 3]) swordArt(S, [q * 340 - 340, -330], 0, 620, q, { sheathed: false });
  for (const q of [1, 2, 3]) swordArt(S, [q * 340 - 170, -330], 0, 620, q, { sheathed: true });
  const sw = S.svg([-110, -470, 1130, 860], { order: ['weapon'] });
  const P = new Scene('pd_', { px: 1.5, lod: 2 }); P.layer('shoulder');
  for (const q of [1, 2, 3]) pauldronArt(P, [-200 + q * 200, 0], 62, 1, q);
  const pd = P.svg([-90, -60, 620, 190], { order: ['shoulder'] });
  const wat = SITTERS.find(s => s.id === 'wat'), kits = [['soldier', 'Levy kit'], ['cuirassier', 'A sergeant\'s harness'], ['knight', 'A knight\'s harness']];
  $('#gear').innerHTML = `<div class="gcol"><h4>One sword, three makes</h4><div class="gart">${sw}</div><ol class="glist">${names.map(n => `<li><b>${n[0]}</b> ${esc(n[1])}</li>`).join('')}</ol><p class="gnote">Each drawn bare and in its scabbard. The item is one function of its make; the hand, belt and body it hangs from never change.</p></div>
  <div class="gcol"><h4>One shoulder piece, three makes</h4><div class="gart">${pd}</div><h4>One man, three kits</h4><div class="kits">${kits.map(([o, n]) => `<figure>${compose({ ...wat, outfit: o, pose: 'pommel', staff: null }, { crop: 'half', width: 190, id: nid() }).svg}<figcaption>${esc(n)}</figcaption></figure>`).join('')}</div><p class="gnote">The same Wat Hollin; only the list of items on him differs.</p></div>`;
}
// ------------------------------------------------------------------ what it costs -----------------------------------
async function measure() {
  const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1], tiers = [['figure', 'Lineup figure', { crop: 'figure', w: 880, top: 2150, below: 110, px: .29 }, 255, 655], ['card', 'Card', { crop: 'card', width: 250 }, 250, 306], ['cardflat', 'Card, without the light pass', { crop: 'card', width: 250, fx: false }, 250, 306], ['portrait', 'Maker portrait', { crop: 'portrait', width: 430 }, 430, 532], ['small', 'List portrait, plain', { crop: 'face', width: 64, lod: 0, fx: false }, 64, 79]];
  const out = {}, cv = document.createElement('canvas');
  for (const [key, name, opt, w, h] of tiers) {
    const c = [], kb = [], sh = [], ra = [];
    for (const s of SITTERS) { let r; for (let i = 0; i < 3; i++) { const t0 = performance.now(); r = compose(s, { ...opt, id: 'tm_' }); c.push(performance.now() - t0); } kb.push(r.svg.length / 1024); sh.push(r.shapes);
      const url = URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' })), img = new Image(); img.src = url;
      try { await img.decode(); cv.width = w * 2; cv.height = h * 2; const g = cv.getContext('2d'), t0 = performance.now(); g.drawImage(img, 0, 0, w * 2, h * 2); g.getImageData(0, 0, 1, 1); ra.push(performance.now() - t0); } catch (e) { /* an image that will not decode is left out */ }
      URL.revokeObjectURL(url); }
    out[key] = { name, compose: +med(c).toFixed(1), raster: ra.length ? +med(ra).toFixed(1) : null, kb: Math.round(med(kb)), kbMax: Math.round(Math.max(...kb)), shapes: Math.round(med(sh)), px: `${w * 2} x ${h * 2}` };
  }
  $('#cost').innerHTML = `<table><thead><tr><th>Drawn as</th><th>Pixels (at 2x)</th><th>Compose (look to SVG)</th><th>Paint (SVG to pixels)</th><th>SVG size, median (largest)</th><th>Shapes</th></tr></thead><tbody>${Object.values(out).map(v => `<tr><td>${v.name}</td><td>${v.px}</td><td>${v.compose} ms</td><td>${v.raster ?? 'n/a'} ms</td><td>${v.kb} KB (${v.kbMax})</td><td>${v.shapes}</td></tr>`).join('')}</tbody></table>`;
  window.TIMING = out;
}

function boot() {
  lineup();
  $('#cards').innerHTML = SITTERS.map(s => card(s)).join('');
  maker(); fourAges(); gearSheet();
  requestAnimationFrame(() => setTimeout(() => measure().then(() => { window.DONE = true; }), 60));
}
boot();
