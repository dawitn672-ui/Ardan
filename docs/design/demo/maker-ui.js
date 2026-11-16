// The live face maker (characters.md §10, §14): every feature of §3 by hand, colours, hair and body, with front,
// profile and an age strip. Painting runs in a worker made from the same bundle, so the page never waits. Inlined into
// characters.html after the bundle (window.ARDAN_PAINT) and its text (window.ARDAN_PAINT_SRC).
(function () {
  const AP = window.ARDAN_PAINT, root = document.getElementById('maker'); if (!AP || !root) return;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const st = { id: 'maker', sex: 'M', age: 30, race: 'human', g: AP.make('maker-1', { sex: 'M' }), skin: 2, hairColor: 4, eyes: 6, hair: 'sidepart', beard: 'none', station: 'shirt', role: '', height: 175, build: { muscle: 0, fat: 0, frame: 0 } };
  const TABS = [
    ['Start', null], ['Face', 'skull'], ['Eyes and brows', ['eyes', 'brows', 'ears']], ['Nose and mouth', ['nose', 'mouth']], ['Hair', 'hair'], ['Body and skin', 'body'], ['Dress', null],
  ];
  let tab = 0;
  // ---- the worker
  const src = window.ARDAN_PAINT_SRC + '\n;self.onmessage=function(e){var d=e.data;try{var r=ARDAN_PAINT.paint(d.look,d.opt);self.postMessage({k:d.k,rgba:r.rgba,W:r.W,H:r.H,ms:r.ms.total},[r.rgba.buffer]);}catch(err){self.postMessage({k:d.k,err:String(err)});}};';
  let worker = null; try { worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' }))); } catch (e) { worker = null; }
  const pending = {}; let seq = 0;
  const run = (look, opt, canvas) => new Promise(res => {
    const k = ++seq; pending[k] = { canvas, res };
    if (worker) worker.postMessage({ k, look, opt });
    else setTimeout(() => { const r = AP.paint(look, opt); done({ k, rgba: r.rgba, W: r.W, H: r.H, ms: r.ms.total }); }, 0);
  });
  const latest = {};
  function done(d) {
    const p = pending[d.k]; delete pending[d.k]; if (!p) return;
    if (d.err) { p.res(); return; }
    if (latest[p.canvas.id] !== undefined && latest[p.canvas.id] > d.k) { p.res(); return; }
    const c = p.canvas, ctx = c.getContext('2d'); c.width = d.W; c.height = d.H;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(d.rgba.buffer || d.rgba), d.W, d.H), 0, 0);
    if (c.id === 'mk-main') document.getElementById('mk-ms').textContent = Math.round(d.ms) + ' ms to paint at ' + d.W + ' px';
    p.res();
  }
  if (worker) worker.onmessage = e => done(e.data);
  // ---- layout
  root.innerHTML = `
    <div class="mk-pics"><canvas id="mk-main" width="384" height="384" aria-label="Your face, three-quarter"></canvas>
      <div class="mk-views"><canvas id="mk-front" width="192" height="192" aria-label="Front"></canvas><canvas id="mk-profile" width="192" height="192" aria-label="Profile"></canvas></div>
      <p class="mk-note" id="mk-ms"></p>
      <h4>The face you will grow into</h4><div class="mk-strip" id="mk-strip"></div></div>
    <div class="mk-ctl"><div class="mk-tabs" role="tablist">${TABS.map((t, i) => `<button type="button" data-tab="${i}" role="tab">${esc(t[0])}</button>`).join('')}</div><div id="mk-pane"></div>
      <div class="mk-code"><label>Face code <input id="mk-code" spellcheck="false" maxlength="23"></label> <button type="button" id="mk-paste">Use this code</button> <span id="mk-codemsg"></span></div></div>`;
  const AGES = [0, 6, 12, 18, 30, 50, 70];
  document.getElementById('mk-strip').innerHTML = AGES.map(a => `<figure><canvas id="mk-age-${a}" width="96" height="96"></canvas><figcaption>${a}</figcaption></figure>`).join('');
  const slider = (key, label, lo, hi, steps, val) => `<label class="mk-sl"><span class="mk-l">${esc(label)}</span><span class="mk-w">${esc(lo)}</span><input type="range" data-k="${esc(key)}" min="0" max="${steps - 1}" step="1" value="${Math.round((val + 1) / 2 * (steps - 1))}"><span class="mk-w">${esc(hi)}</span></label>`;
  const select = (key, label, opts, val) => `<label class="mk-sel"><span class="mk-l">${esc(label)}</span><select data-s="${esc(key)}">${opts.map(([v, n]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
  const range = (key, label, lo, hi, min, max, val, step = 1) => `<label class="mk-sl"><span class="mk-l">${esc(label)}</span><span class="mk-w">${esc(lo)}</span><input type="range" data-r="${esc(key)}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="mk-w">${esc(hi)}</span></label>`;
  function pane() {
    const [name, grp] = TABS[tab]; let h = '';
    if (name === 'Start') {
      h += select('sex', 'Sex', [['M', 'man'], ['F', 'woman']], st.sex) + select('race', 'People', [['human', 'human'], ['elf', 'elf'], ['dwarf', 'dwarf'], ['orc', 'orc']], st.race);
      h += range('age', 'Age (to see)', 'newborn', 'ninety', 0, 90, st.age);
      h += `<p><button type="button" id="mk-rand">Surprise me</button></p><p class="mk-note">Every feature below is yours to set. Nothing is rolled over your choices.</p>`;
    } else if (name === 'Dress') {
      h += select('station', 'Station', [['shirt', 'a plain shirt'], ...AP.STATIONS.map(s => [s, s])], st.station) + select('role', 'Role', [['', 'none'], ...AP.ROLES.map(s => [s, s])], st.role);
      h += select('view', 'Main view', [['three', 'three-quarter'], ['front', 'front'], ['profile', 'profile']], st.view || 'three');
    } else {
      const groups = Array.isArray(grp) ? grp : [grp];
      for (const f of AP.FEATURES) if (groups.includes(f[4])) h += slider(f[0], label(f[0]), f[2], f[3], f[1], st.g[f[0]] ?? 0);
      if (grp === 'skull') { }
      if (Array.isArray(grp) && grp.includes('eyes')) h += select('eyes', 'Eye colour', AP.EYE_NAMES.map((n, i) => [i, n]), st.eyes);
      if (grp === 'hair') {
        h += select('hair', 'Style', AP.STYLES.map(s => [s.id, s.name + ' (' + s.group + ')']), st.hair) + select('beard', 'Facial hair', AP.BEARDS.map(b => [b.id, b.name]), st.beard);
        h += select('hairColor', 'Colour', AP.HAIR_NAMES.map((n, i) => [i, n]), st.hairColor);
      }
      if (grp === 'body') {
        h += range('height', 'Height', '140 cm', '205 cm', 140, 205, st.height) + select('skin', 'Skin', AP.SKIN_NAMES.map((n, i) => [i, n]), st.skin);
        h += range('muscle', 'Muscle', 'soft', 'hard', -1, 1, st.build.muscle, 0.1) + range('fat', 'Flesh', 'gaunt', 'heavy', -1, 1.2, st.build.fat, 0.1);
      }
    }
    document.getElementById('mk-pane').innerHTML = h;
    root.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.tab === tab)));
    const r = document.getElementById('mk-rand'); if (r) r.addEventListener('click', () => { st.g = AP.make('maker-' + (++seq) + '-' + st.sex, { sex: st.sex }); st.hairColor = seq % 18; st.eyes = seq % 12; pane(); paintAll(); });
  }
  const NAMES = { faceLen: 'Face length', jawW: 'Jaw width', jawShape: 'Jaw shape', chin: 'Chin', chinW: 'Chin width', cheekbones: 'Cheekbones', forehead: 'Forehead', cheeks: 'Cheeks', eyeSize: 'Eye size', eyeGap: 'Eye spacing', eyeTilt: 'Eye tilt', lids: 'Lids', eyeDepth: 'Eye depth', browRidge: 'Brow ridge', browShape: 'Brow shape', browWeight: 'Brow weight', noseLen: 'Nose length', noseBridge: 'Nose bridge', noseTip: 'Nose tip', noseW: 'Nose width', tipShape: 'Tip shape', mouthW: 'Mouth width', lips: 'Lips', upperLip: 'Upper lip', bite: 'Bite', earSize: 'Ear size', earSet: 'Ear set', hairTex: 'Texture', hairThick: 'Thickness', hairline: 'Hairline', balding: 'Balding to come', greyOnset: 'Grey from', beardGrowth: 'Beard growth', frame: 'Frame', bulk: 'Bulk', legs: 'Legs', neck: 'Neck', freckles: 'Freckles', moles: 'Moles' };
  const label = k => NAMES[k] || k;
  root.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { tab = +t.dataset.tab; pane(); } });
  root.addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.k) { const f = AP.FEATURES.find(x => x[0] === el.dataset.k); st.g = { ...st.g, [f[0]]: -1 + 2 * (+el.value) / (f[1] - 1) }; paintMain(true); }
    if (el.dataset.r) { const k = el.dataset.r; if (k === 'muscle' || k === 'fat') st.build = { ...st.build, [k]: +el.value }; else st[k] = +el.value; paintMain(true); }
  });
  root.addEventListener('change', e => {
    const el = e.target;
    if (el.dataset.s) { const k = el.dataset.s, v = el.value; st[k] = ['skin', 'hairColor', 'eyes'].includes(k) ? +v : v; if (k === 'sex' && v === 'F' && st.beard !== 'none') st.beard = 'none'; paintAll(); }
    if (el.dataset.k || el.dataset.r) paintAll();
  });
  document.getElementById('mk-paste').addEventListener('click', () => {
    const v = document.getElementById('mk-code').value.trim(), g = AP.unpack(v), msg = document.getElementById('mk-codemsg');
    if (!g) { msg.textContent = 'That is not a face code.'; return; }
    st.g = g; msg.textContent = 'Taken.'; pane(); paintAll();
  });
  const look = (o = {}) => ({ ...st, role: st.role || undefined, ...o });
  let timer = 0;
  function paintMain(fast) {
    document.getElementById('mk-code').value = AP.pack(st.g);
    const c = document.getElementById('mk-main'); latest[c.id] = seq + 1;
    run(look(), { W: fast ? 192 : 384, H: fast ? 192 : 384, tier: fast ? 'M' : 'L', view: st.view || 'three' }, c);
    clearTimeout(timer); if (fast) timer = setTimeout(() => paintAll(), 450);
  }
  function paintAll() {
    paintMain(false);
    for (const [id, v] of [['mk-front', 'front'], ['mk-profile', 'profile']]) { const c = document.getElementById(id); latest[id] = seq + 1; run(look(), { W: 192, H: 192, tier: 'M', view: v }, c); }
    for (const a of AGES) { const c = document.getElementById('mk-age-' + a); latest[c.id] = seq + 1; run(look({ age: a, beard: a >= 18 ? st.beard : 'none' }), { W: 96, H: 96, tier: 'S', view: 'three' }, c); }
  }
  pane(); paintAll();
})();
