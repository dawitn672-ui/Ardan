// The sheet: ten legendary arms, each drawn when the page opens from its record (nothing on the page is a picture
// file). For each: the piece on a dark ground with two closer looks; its plate; the person who has it, drawn by the
// game's figure library with the piece on the figure; who owns it, who bears it and why; and, to one scale, the
// ordinary arm of its kind.
import { LEGENDS, CARRY } from './index.mjs';
import { render } from './compose.mjs';
import { portrait, closer } from './figure.mjs';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sheet = document.getElementById('sheet'), small = document.getElementById('small'), cost = document.getElementById('cost');
const rows = [], now = () => performance.now();

LEGENDS.forEach((def, i) => {
  const c = CARRY[def.id], id = 'lg-' + String(i + 1).padStart(2, '0'), T = {};
  let t = now(); const hero = render(def, def.hero || def.box, { fit: [530, 684], tag: 'h', pad: 6 }); T.hero = now() - t;
  const dets = def.details.map((d, k) => render(def, d.box, { fit: [228, 338], deg: d.deg ?? def.upright ?? -90, tag: 'd' + k }));
  const len = Math.max(def.box[1] - def.box[0], def.plain.box[1] - def.plain.box[0]), vv = Math.max(def.box[3] - def.box[2], def.plain.box[3] - def.plain.box[2]), k = Math.min(1.1, 500 / len, 150 / vv);
  const flatP = render(def.plain, def.plain.box, { px: k, flat: true, tag: 'p', id: def.id + 'pl' }), flatL = render(def, def.box, { px: k, flat: true, tag: 'f' });
  t = now(); const pf = portrait(def, { width: 300 }); T.pf = now() - t;
  const zm = closer(def, 400);
  t = now(); const tiny = render(def, def.box, { px: .41, lod: 1, tag: 't', shadow: false }); T.tiny = now() - t;
  rows.push({ def, hero, tiny, pf, T });
  const sec = document.createElement('section'); sec.className = 'lg'; sec.id = id; sec.style.setProperty('--a', def.ground[0]); sec.style.setProperty('--b', def.ground[1]);
  sec.innerHTML = `
<div class="top">
  <div class="art">
    <div class="ttl"><h2>${esc(def.name)}</h2><div class="rule"><i></i><b></b><i></i></div><p>(${esc(def.cat)}) · ${esc(def.realm)}</p></div>
    <div class="hero">${hero.svg}</div>
    <div class="dets">${dets.map((d, k2) => `<figure>${d.svg}<figcaption>${esc(def.details[k2].t)}</figcaption></figure>`).join('')}</div>
  </div>
  <aside class="plate">
    <p class="no">${esc(def.no)} · ${esc(def.cat)}</p>
    <h3>${esc(def.name)}</h3>
    <p class="realm">${esc(def.realm)}</p>
    <p class="people">${esc(def.people)}</p>
    <h4>Its making</h4><p>${esc(def.made)}</p>
    <h4>Its history</h4>${def.legend.map(l => `<p class="legend">${esc(l)}</p>`).join('')}
    <h4>Who owns it</h4><p>${esc(def.owner)}</p>
    <h4>Who bears it</h4><p>${esc(def.wielder)}</p>
    <h4>Why</h4><p>${esc(def.why)}</p>
    <h4>In the hand</h4><p>${esc(def.hand)}</p>
    <h4>Its art</h4><p><b>${esc(def.art)}</b>, a Legendary art: ${esc(def.artNote)}.</p>
    <p class="finish">${esc(def.finish)}. ${esc(String(def.len))} mm.</p>
  </aside>
</div>
<div class="under">
  <figure class="pf"><div class="frame">${pf.svg}</div><figcaption><b>${esc(c.who)}</b>${esc(c.note)}</figcaption></figure>
  <figure class="zm"><div class="frame"><div class="win" style="width:${zm.size}px;height:${zm.size}px"><div style="margin-left:${-zm.dx}px">${zm.svg}</div></div></div><figcaption>The same drawing, closer. The piece is one more item on the figure’s list of gear, drawn by the same hand and under the same light as the person.</figcaption></figure>
  <div class="cmp">
    <p class="cap">To one scale</p>
    <div class="pair"><figure>${flatP.svg}<figcaption><b>${esc(def.plainName)}</b>, Plain make. Sound work and nothing more: what a journeyman makes and a man-at-arms is issued.</figcaption></figure><figure>${flatL.svg}<figcaption><b>${esc(def.name)}</b>. ${esc(def.finish)}.</figcaption></figure></div>
  </div>
</div>`;
  sheet.appendChild(sec);
});

// the same ten at the size of a list: outline, metal, one accent
for (const { def } of rows) {
  const c = CARRY[def.id], p = portrait(def, { width: 124, tier: 1, id: 'sm' });
  const f = document.createElement('figure'); f.innerHTML = `<div class="frame">${p.svg}</div><figcaption><b>${esc(def.name)}</b>${esc(c.who.split(',')[0])}</figcaption>`; small.appendChild(f);
}

// what it costs: compose is the record turned into SVG; paint is the browser turning that SVG into pixels (a canvas, twice the size shown)
const paint = svg => new Promise(res => { const img = new Image(), m = /width="(\d+)" height="(\d+)"/.exec(svg) || [0, 300, 300]; img.onload = () => { const cv = document.createElement('canvas'); cv.width = m[1] * 2; cv.height = m[2] * 2; const cx = cv.getContext('2d'), t = now(); cx.drawImage(img, 0, 0, cv.width, cv.height); cx.getImageData(0, 0, 1, 1); res(now() - t); }; img.onerror = () => res(-1); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
(async () => {
  const out = [];
  for (const r of rows) {
    const p1 = await paint(r.hero.svg), p2 = await paint(r.tiny.svg), p3 = await paint(r.pf.svg);
    out.push({ id: r.def.id, name: r.def.name, plateShapes: r.hero.shapes, plateKB: Math.round(r.hero.svg.length / 1024), plateCompose: +r.T.hero.toFixed(1), platePaint: +p1.toFixed(1), figShapes: r.tiny.shapes, figKB: Math.round(r.tiny.svg.length / 1024), figCompose: +r.T.tiny.toFixed(1), figPaint: +p2.toFixed(1), cardShapes: r.pf.shapes, cardCompose: +r.T.pf.toFixed(1), cardPaint: +p3.toFixed(1) });
  }
  cost.innerHTML = '<table><thead><tr><th>Piece</th><th>On its plate: shapes</th><th>compose</th><th>paint</th><th>On the figure: shapes</th><th>compose</th><th>paint</th><th>The whole card: shapes</th><th>compose</th><th>paint</th></tr></thead><tbody>'
    + out.map(o => `<tr><td>${esc(o.name)}</td><td>${o.plateShapes}</td><td>${o.plateCompose} ms</td><td>${o.platePaint} ms</td><td>${o.figShapes}</td><td>${o.figCompose} ms</td><td>${o.figPaint} ms</td><td>${o.cardShapes}</td><td>${o.cardCompose} ms</td><td>${o.cardPaint} ms</td></tr>`).join('') + '</tbody></table>';
  window.TIMING = out; window.DONE = true;
})();
