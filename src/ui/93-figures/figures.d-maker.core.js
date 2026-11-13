// 93-figures · the face and build maker, on the creation screen's "Body & face" step (owner orders 14, 30; D-020:
// "the player can customise every feature of the face by hand; customisation comes first").
//
// UI.crStepBody (src/core/release/core/23-ui-a.js) keeps its sex and name rows and hands the rest to UI.FIG.maker:
// six pages of controls (face, eyes and brows, nose and mouth, hair, skin, body), every one a slider with words at
// its ends (never a percentage) or a row of choices, named shapes to start from, "Surprise me", and the face code to
// copy or paste. What is chosen is kept in the creation state and goes to the new life with the rest of it:
//   app.g   the game's 23-character face code (39 features, src/people/engine/face.js)
//   app.g2  a second code of 11 characters: the eleven further features of the drawn head and the build's seven (D-036)
//   app.hs  the hair as drawn (one of the library's styles), app.bd the beard as drawn
// beside the release's own fields (skin, hair and eye colour, build, height), which the words of the game still read.
// The picture beside the controls is redrawn at every step of a drag. Creation state only: A.S is never touched.
(function () {
  if (typeof PORTRAIT === 'undefined' || !UI.FIG) return;
  const FG = UI.FIG, LIB = () => (A.V2 && A.V2.figure) || null, esc = s => UI.esc(s);
  const M = FG.M = { tab: 'Face', seed: 1 };
  // named shapes to start from (each sets a few features of its group)
  const PRE = {
    Face: [['Oval', {}], ['Long', { faceLen: .8, jawW: -.2, cheekbones: .2 }], ['Square', { jawW: .8, jawShape: .9, chinW: .7, faceLen: -.2 }], ['Heart', { jawW: -.6, chinW: -.8, cheekbones: .7, foreheadW: .6 }], ['Round', { faceLen: -.7, cheeks: .9, jawShape: -.6, chinW: .3 }], ['Diamond', { cheekbones: 1, jawW: -.4, foreheadW: -.7, chinW: -.3 }], ['V-line', { jawW: -.8, jawShape: -1, chinW: -1, chin: .4 }], ['Broad', { jawW: 1, cheekbones: .5, faceLen: -.4, chinW: 1 }], ['Lantern', { faceLen: .6, jawW: .5, jawShape: .7, chin: .9 }], ['Gaunt', { cheeks: -1, cheekbones: .8, faceLen: .4 }]],
    Eyes: [['Almond', {}], ['Narrow', { lids: -.9, eyeSize: .1 }], ['Round', { lids: .9, eyeSize: .5 }], ['Hooded', { lids: -.6, eyeDepth: -.7 }], ['Fox', { eyeTilt: 1, lids: -.4, lashes: .6 }], ['Downturned', { eyeTilt: -1 }], ['Wide-set', { eyeGap: 1 }], ['Close-set', { eyeGap: -1 }], ['Deep-set', { eyeDepth: -1, lids: -.2 }], ['Doe', { eyeSize: 1, irisSize: .8, lids: .6, lashes: 1 }]],
    Brows: [['Level', {}], ['Arched', { browShape: 1 }], ['Stern', { browTilt: 1, browWeight: .5, browRidge: .5 }], ['Gentle', { browTilt: -1, browShape: .4 }], ['Heavy', { browWeight: 1, browRidge: .8 }], ['Fine', { browWeight: -1 }], ['Knit', { browGap: 1, browTilt: .6 }]],
    Nose: [['Straight', {}], ['Aquiline', { noseBridge: 1, noseLen: .4, noseProj: .6 }], ['Snub', { noseTip: -1, noseLen: -.7, noseBridge: -.5 }], ['Broad', { noseW: 1, tipShape: .7, noseProj: -.4 }], ['Long', { noseLen: 1, noseTip: .5 }], ['Button', { noseLen: -1, tipShape: .5, noseW: -.3 }], ['Hawk', { noseBridge: 1, noseTip: 1, noseLen: .7, noseW: -.4 }], ['Fine', { noseW: -1, tipShape: -1 }]],
    Mouth: [['Even', {}], ['Thin', { lips: -1 }], ['Full', { lips: 1, lowerLip: .5 }], ['Wide', { mouthW: 1 }], ['Small', { mouthW: -1, lips: .3 }], ['Stern', { mouthCurve: -1, lips: -.5 }], ['Easy', { mouthCurve: 1 }], ['Heavy lower', { lowerLip: 1, bite: .6 }]],
    Ears: [['Plain', {}], ['Small', { earSize: -1 }], ['Large', { earSize: 1 }], ['Standing out', { earSet: 1 }], ['Pointed', { earPoint: 1 }], ['Long-lobed', { lobes: 1, earSize: .4 }]],
  };
  const BUILDS = [['Middling', {}], ['Slight', { weight: -.5, muscle: -.7, shoulders: -.6 }], ['Lean', { weight: -.8, muscle: .1 }], ['Athletic', { muscle: .6, shoulders: .4, weight: -.2, posture: .4 }], ['Brawny', { muscle: 1, shoulders: .9, neck: .7, weight: .3 }], ['Stout', { weight: .8, hips: .4, neck: .3 }], ['Heavy', { weight: 1, shoulders: .4, hips: .6, neck: .6 }], ['Rangy', { legs: 1, weight: -.5, shoulders: .2 }], ['Stooped', { posture: -1, weight: -.3, shoulders: -.3 }], ['Proud', { posture: 1, shoulders: .3 }]];
  const NAMES = { faceLen: 'Face length', jawW: 'Jaw width', jawShape: 'Jaw line', chin: 'Chin', chinW: 'Chin width', cheekbones: 'Cheekbones', cheeks: 'Cheeks', forehead: 'Forehead', foreheadW: 'Temples', cleft: 'Chin cleft', eyeSize: 'Eye size', eyeGap: 'Eye spacing', eyeTilt: 'Eye slant', lids: 'Lids', eyeDepth: 'Eye depth', irisSize: 'Iris', lashes: 'Lashes', browRidge: 'Brow ridge', browShape: 'Brow shape', browWeight: 'Brow weight', browTilt: 'Brow set', browGap: 'Brow gap', noseLen: 'Nose length', noseBridge: 'Bridge', noseTip: 'Tip', noseW: 'Nose width', tipShape: 'Tip shape', noseProj: 'Projection', mouthW: 'Mouth width', lips: 'Lips', lowerLip: 'Lower lip', upperLip: 'Upper lip', bite: 'Bite', mouthCurve: 'Corners', earSize: 'Ear size', earSet: 'Ear set', earPoint: 'Ear tip', lobes: 'Lobes', weight: 'Weight', muscle: 'Muscle', shoulders: 'Shoulders', hips: 'Hips', legs: 'Legs', neck: 'Neck', posture: 'Posture', smile: 'Expression', grey: 'Grey', hairThick: 'Thickness', hairline: 'Hairline', freckles: 'Freckles', moles: 'Moles', yaw: 'Head' };
  Object.assign(NAMES, { hairThick: 'Thickness', hairline: 'Hairline', greyOnset: 'Greying', beardGrowth: 'Beard growth', balding: 'Thinning', freckles: 'Freckles', moles: 'Moles', weight: 'Weight', muscle: 'Muscle', shoulders: 'Shoulders', hips: 'Hips', legs: 'Legs', neck: 'Neck', posture: 'Bearing' });
  const TABS = ['Face', 'Eyes', 'Nose & mouth', 'Hair', 'Skin', 'Body'];
  // the library's hair and beards as the game's own words (GD.HAIRSTYLES, GD.BEARDS), which its texts still use
  const HS_WORD = { bald: 'bald', stubble: 'shaved', cropped: 'cropped', messy: 'short', spiky: 'short', sidepart: 'short', swept: 'short', curtain: 'short', bowl: 'short', shoulder: 'long', tied: 'tied', topknot: 'topknot', tonsure: 'cropped', balding: 'cropped', crest: 'mohawk', coily: 'curly', coilyfull: 'curly', locs: 'locks', long: 'long', wavy: 'long', curls: 'curly', bob: 'short', braid: 'braided', braids: 'braided', crownbraid: 'braided', bun: 'tied', buns: 'tied', ponytail: 'ponytail', pigtails: 'ponytail' };
  const BD_WORD = { none: 'none', stubble: 'stubble', moustache: 'mustache', handlebar: 'mustache', goatee: 'goatee', chinstrap: 'short', short: 'short', full: 'full', long: 'long', forked: 'forked', chops: 'muttonchops' };
  const stepsOf = k => { const L = LIB(), f = L.face.FEATURES.find(x => x[0] === k), e = L.EXTRA.find(x => x[0] === k); return f ? f[1] : e ? e[1] : 16; };

  // ---- the state: the two codes, read and written whole -----------------------------------------------------------------
  M.g = c => { const L = LIB(); return L.face.unpack(c.app.g) || L.faceFor('cr|' + M.seed, { sex: c.sex, race: c.race, app: {} }); };
  M.x = c => { const L = LIB(); return L.unpack2(c.app.g2) || L.extraFor('cr|' + M.seed, {}); };
  M.ensure = function (c) {
    const L = LIB(); if (!L || !c || !c.app) return;
    if (!L.face.unpack(c.app.g)) c.app.g = L.face.pack(M.g(c));
    if (!L.unpack2(c.app.g2)) c.app.g2 = L.pack2(M.x(c));
    if (c.sex === 'F') { delete c.app.bd; }
    if (c.app.hs && !L.HAIRS[c.app.hs]) delete c.app.hs;
    if (c.app.bd && !L.BEARDS[c.app.bd]) delete c.app.bd;
  };
  M.set = function (c, k, v) {
    const L = LIB(); v = Math.max(-1, Math.min(1, +v || 0));
    if (L.EXTRA.some(e => e[0] === k)) { const x = M.x(c); x[k] = v; c.app.g2 = L.pack2(x); }
    else if (L.face.KEYS.includes(k)) { const g = M.g(c); g[k] = v; c.app.g = L.face.pack(g); }
  };
  M.val = (c, k) => { const L = LIB(); return L.EXTRA.some(e => e[0] === k) ? M.x(c)[k] || 0 : M.g(c)[k] || 0; };
  // a new face from a new seed (the creation screen's own dice: nothing of the world's)
  M.roll = function (c) {
    const L = LIB(); M.seed = ((M.seed * 1103515245 + 12345) >>> 0) ^ (Date.now() >>> 0);
    c.app.g = L.codeFor('cr|' + M.seed, { sex: c.sex, race: c.race, app: {} });
    c.app.g2 = L.pack2(L.extraFor('cr|' + M.seed, {}));
    const r = L.stream('cr|' + M.seed, 'roll'), male = c.sex !== 'F', hs = Object.keys(L.HAIRS);
    c.app.hs = male ? r.pick(hs.slice(1, 18)) : r.pick(hs.slice(15)); c.app.hstyle = HS_WORD[c.app.hs] || 'short';
    if (male && c.race !== 'elf') { c.app.bd = r() < .5 ? 'none' : r.pick(Object.keys(L.BEARDS)); c.app.beard = BD_WORD[c.app.bd] || 'none'; }
  };
  if (typeof UI.crFix === 'function') { const fix = UI.crFix; UI.crFix = function () { const r = fix.apply(this, arguments); try { M.ensure(UI.cr); } catch (e) {} return r; }; }

  // ---- the controls ---------------------------------------------------------------------------------------------------
  const words = k => { const L = LIB(), f = L.FACE.find(x => x[0] === k), f2 = L.face.FEATURES.find(x => x[0] === k); return f ? [f[1], f[2]] : f2 ? [f2[2], f2[3]] : (L.BUILD_KEYS.find(x => x[0] === k) || [k, 'less', 'more']).slice(1); };
  const slider = (c, k, lo, hi) => {
    const n = stepsOf(k), v = M.val(c, k), w = lo ? [lo, hi] : words(k), nm = NAMES[k] || k;
    return `<label class="fg-sl"><span class="nm">${esc(nm)}</span><span class="lo">${esc(w[0])}</span><input type="range" min="-1" max="1" step="${(2 / (n - 1)).toFixed(5)}" value="${v.toFixed(4)}" data-c="fgG" data-k="${esc(k)}" aria-label="${esc(nm + ': ' + w[0] + ' to ' + w[1])}"><span class="hi">${esc(w[1])}</span></label>`;
  };
  const group = (c, name) => LIB().FACE.filter(f => f[3] === name).map(f => slider(c, f[0])).join('');
  const presets = k => `<div class="row fg-pre">${PRE[k].map(([n]) => `<button type="button" class="small" data-a="fgPre" data-v="${esc(k + '|' + n)}">${esc(n)}</button>`).join('')}</div>`;
  const H = s => `<label>${esc(s)}</label>`;
  function panel(c) {
    const L = LIB(), t = M.tab, male = c.sex !== 'F', h = [];
    if (t === 'Face') h.push(H('Shape of the face'), presets('Face'), group(c, 'Face'));
    if (t === 'Eyes') h.push(H('Eyes'), presets('Eyes'), group(c, 'Eyes'), H('Colour'), `<div class="swatches">${GD.EYES.map((s, i) => `<div class="sw ${c.app.eye === i ? 'sel' : ''}" title="${esc(GD.EYE_NAMES[i])}" style="background:${esc(s)}" data-a="crApp" data-v="eye:${i}"></div>`).join('')}</div>`, H('Brows'), presets('Brows'), group(c, 'Brows'));
    if (t === 'Nose & mouth') h.push(H('Nose'), presets('Nose'), group(c, 'Nose'), H('Mouth'), presets('Mouth'), group(c, 'Mouth'), H('Ears'), presets('Ears'), group(c, 'Ears'));
    if (t === 'Hair') {
      const base = M.previewLook(c), cur = c.app.hs || base.hair;
      h.push(H('Style'), `<div class="fg-thumbs">${Object.entries(L.HAIRS).map(([id, v]) => `<button type="button" class="fg-th${id === cur ? ' primary' : ''}" data-a="fgSet" data-v="hs:${esc(id)}">${FG.lookSvg({ ...base, id: base.id, hair: id, beard: 'none', headwear: 'none', scars: [] }, 56, { kind: 'chip', label: v.name, who: 'th|' + id })}<span class="tiny">${esc(v.name)}</span></button>`).join('')}</div>`);
      h.push(H('Colour'), `<div class="swatches">${GD.HAIR.map((s, i) => `<div class="sw ${c.app.hair === i ? 'sel' : ''}" title="${esc(GD.HAIR_NAMES[i])}" style="background:${esc(s)}" data-a="crApp" data-v="hair:${i}"></div>`).join('')}</div>`, slider(c, 'hairThick'), slider(c, 'hairline'), slider(c, 'greyOnset'));
      if (male && c.race !== 'elf') { const bc = c.app.bd || base.beard || 'none'; h.push(H('Beard'), `<div class="row">${Object.entries(L.BEARDS).map(([id, v]) => `<button type="button" class="small ${id === bc ? 'primary' : ''}" data-a="fgSet" data-v="bd:${esc(id)}">${esc(v.name)}</button>`).join('')}</div>`, slider(c, 'beardGrowth'), slider(c, 'balding')); }
    }
    if (t === 'Skin') h.push(H('Skin'), `<div class="swatches">${(UI.crSkinSet ? UI.crSkinSet(c) : GD.SKIN[c.race]).map(s => `<div class="sw ${c.app.skin === s ? 'sel' : ''}" style="background:${esc(s)}" data-a="crApp" data-v="skin:${esc(s)}"></div>`).join('')}</div>`, H('Marks'), slider(c, 'freckles'), slider(c, 'moles'), `<p class="tiny muted">Scars are not chosen here. A life gives them.</p>`);
    if (t === 'Body') {
      const R2 = GD.RACES[c.race], base = c.sex === 'F' ? R2.height[0] : R2.height[1];
      h.push(`<label>Height (grown): <span id="hval">${esc(c.app.height)} cm</span></label><input type="range" min="${Math.round(base - R2.hsd * 3)}" max="${Math.round(base + R2.hsd * 3)}" value="${esc(c.app.height)}" data-c="crHeight" style="width:100%" aria-label="Height in centimetres">`);
      h.push(H('Build (it shapes your body as well as your look)'), `<div class="row">${GD.BUILDS.map(s => { const fx = GD.BUILD_FX[s] || {}, tx = Object.entries(fx).map(([k, v]) => (v > 0 ? '+' : '') + v + ' ' + GD.STAT_SHORT[k]).join(', '); return `<button type="button" class="small ${c.app.build === s ? 'primary' : ''}" data-a="crApp" data-v="build:${esc(s)}">${esc(s)}${tx ? ' <span class="tiny muted">' + esc(tx) + '</span>' : ''}</button>`; }).join('')}</div>`);
      h.push(H('Frame, by eye (the look only)'), `<div class="row fg-pre">${BUILDS.map(([n]) => `<button type="button" class="small" data-a="fgBuild" data-v="${esc(n)}">${esc(n)}</button>`).join('')}</div>`, L.BUILD_KEYS.map(b => slider(c, b[0], b[1], b[2])).join(''));
    }
    return h.join('');
  }
  // the look of the person being made (for the thumbnails and the ages), and the same face at other ages
  M.previewLook = function (c) { const L = LIB(), p = UI.crPreviewPerson(); p.id = p.id || 'preview'; return L.lookOf(FG.sheet(p)); };
  const AGES = [[8, 'At eight'], [18, 'At eighteen'], [36, 'At thirty-six'], [70, 'At seventy']];
  M.ages = function (c) {
    const L = LIB(), p = UI.crPreviewPerson(); p.id = p.id || 'preview';
    const sh = FG.sheet(p);
    return `<div class="fg-ages">${AGES.map(([a, n]) => { const s2 = { ...sh, age: a, gear: {}, estate: sh.estate === 'royal' ? 'noble' : sh.estate, ruler: false, wounds: [] }; const look = L.lookOf(s2); return `<figure>${FG.lookSvg(look, 76, { kind: 'list', label: n, who: 'age|' + a })}<figcaption class="tiny muted">${esc(n)}</figcaption></figure>`; }).join('')}</div>`;
  };
  // on a phone the summary's picture is a screen away from the sliders: a small one rides along with them
  M.mini = function (live) { const p = UI.crPreviewPerson(); p.id = p.id || 'preview'; return live ? FG.inline(p, 104, { bust: true }) : PORTRAIT.svg(p, 104, { bust: true }); };
  FG.maker = function (c) {
    const L = LIB(); if (!L) return '';
    M.ensure(c);
    return `<div class="fg-maker">
      <div class="row fg-top"><button type="button" data-a="fgRoll">Surprise me</button><span class="grow"></span><label class="fg-code">Face code <input data-c="fgCode" value="${esc(c.app.g)}" maxlength="23" size="25" spellcheck="false" autocomplete="off" aria-label="Face code: copy it to keep this face, paste one to bring a face back"></label></div>
      <div class="fg-mini" aria-hidden="true">${M.mini()}</div>
      <div class="fg-tabs" role="tablist">${TABS.map(t => `<button type="button" role="tab" aria-selected="${t === M.tab}" class="${t === M.tab ? 'primary' : ''}" data-a="fgTab" data-v="${esc(t)}">${esc(t)}</button>`).join('')}</div>
      <div class="field fg-panel">${panel(c)}</div>
      <div class="field"><label>The face you will grow into</label>${M.ages(c)}</div></div>`;
  };

  // ---- what the controls do -------------------------------------------------------------------------------------------
  const side = () => { const el = UI.$('.create-side'); if (el) el.innerHTML = UI.crSummary(); const mini = document.querySelector('.fg-mini'); if (mini) mini.innerHTML = M.mini(); };
  const code = () => { const el = document.querySelector('input[data-c="fgCode"]'); if (el && UI.cr) el.value = UI.cr.app.g; };
  const ages = () => { const el = document.querySelector('.fg-ages'); if (el && UI.cr) el.outerHTML = M.ages(UI.cr); };
  // while a slider is dragged the picture beside it is the whole drawing, plain (no light pass), redrawn at each step
  M.live = function () {
    const host = document.querySelector('.create-side .center'); if (!host || !UI.cr) return;
    const p = UI.crPreviewPerson(); p.id = p.id || 'preview';
    const s = FG.inline(p, 210, { plain: true }); if (s) host.innerHTML = s;
    const mini = document.querySelector('.fg-mini'); if (mini && mini.offsetParent !== null) { const m = M.mini(true); if (m) mini.innerHTML = m; }
  };
  Object.assign(UI.A, {
    fgTab(v) { if (TABS.includes(v)) M.tab = v; UI.render(); },
    fgRoll() { M.roll(UI.cr); UI.render(); },
    fgPre(v) {
      const [k, n] = String(v).split('|'), row = (PRE[k] || []).find(x => x[0] === n), c = UI.cr; if (!row) return;
      for (const f of LIB().FACE) if (f[3] === k) M.set(c, f[0], 0);
      for (const key in row[1]) M.set(c, key, row[1][key]);
      UI.render();
    },
    fgBuild(v) { const row = BUILDS.find(x => x[0] === v), c = UI.cr; if (!row) return; for (const b of LIB().BUILD_KEYS) M.set(c, b[0], row[1][b[0]] || 0); UI.render(); },
    fgSet(v) {
      const i = String(v).indexOf(':'), k = v.slice(0, i), val = v.slice(i + 1), c = UI.cr, L = LIB();
      if (k === 'hs' && L.HAIRS[val]) { c.app.hs = val; c.app.hstyle = HS_WORD[val] || c.app.hstyle; }
      if (k === 'bd' && L.BEARDS[val]) { c.app.bd = val; c.app.beard = BD_WORD[val] || 'none'; }
      UI.render();
    },
  });
  Object.assign(UI.C, {
    // a slider let go: the state is already set (the input listener below); the summary takes the finished picture
    fgG(el) { M.set(UI.cr, el.dataset.k, +el.value); side(); code(); ages(); },
    // a pasted code is checked character by character before it is used
    fgCode(el) {
      const L = LIB(), v = String(el.value || '').trim();
      if (L.face.unpack(v)) { UI.cr.app.g = v; UI.render(); }
      else { el.value = UI.cr.app.g; UI.toast('That is not a face code. A face code is 23 letters, digits, - or _.'); }
    },
  });
  // sex or people changed: the hair and beard as drawn go back to that people's own; a new people gets a new face
  if (typeof UI.A.crSet === 'function') {
    const cs = UI.A.crSet;
    UI.A.crSet = function (v) {
      const k = String(v).slice(0, String(v).indexOf(':'));
      if (UI.cr && UI.cr.app) { if (k === 'sex' || k === 'race') { delete UI.cr.app.hs; delete UI.cr.app.bd; } if (k === 'race') { UI.cr.app.g = null; } }
      return cs.apply(this, arguments);
    };
  }
  // the release's own hair and beard words are not shown beside the maker, so a choice made there never disagrees
  if (typeof UI.A.crApp === 'function') {
    const ca = UI.A.crApp;
    UI.A.crApp = function (v) { const k = String(v).split(':')[0]; if (UI.cr && UI.cr.app) { if (k === 'hstyle') delete UI.cr.app.hs; if (k === 'beard') delete UI.cr.app.bd; } return ca.apply(this, arguments); };
  }
  for (const k of ['crRandomize']) if (typeof UI[k] === 'function') { const f = UI[k]; UI[k] = function () { M.seed = ((M.seed * 1103515245 + 12345) >>> 0) ^ (Date.now() >>> 0); return f.apply(this, arguments); }; }
  if (typeof UI.A.newLife === 'function') { const nl = UI.A.newLife; UI.A.newLife = function () { M.seed = ((M.seed * 1103515245 + 12345) >>> 0) ^ (Date.now() >>> 0); M.tab = 'Face'; return nl.apply(this, arguments); }; }
  if (typeof document !== 'undefined') document.addEventListener('input', e => {
    const el = e.target; if (!el || !el.dataset || el.dataset.c !== 'fgG' || !UI.cr || UI.screen !== 'create') return;
    try { M.set(UI.cr, el.dataset.k, +el.value); M.live(); code(); } catch (x) {}
  });

  FG.MAKER_CSS = '.fg-maker .fg-top{align-items:center;gap:8px;margin-top:8px}.fg-maker .fg-code{display:flex;align-items:center;gap:6px;margin:0}.fg-maker .fg-code input{font-family:var(--fm,monospace);letter-spacing:.04em;max-width:100%}'
    + '.fg-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 4px}.fg-panel label{display:block;margin-top:10px}.fg-pre{margin:4px 0 8px}'
    + '.fg-sl{display:grid!important;grid-template-columns:8.5em 7em minmax(80px,1fr) 7em;align-items:center;gap:8px;margin:5px 0!important;text-transform:none;letter-spacing:0;font-size:inherit;color:inherit}'
    + '.fg-sl .nm{font-weight:600}.fg-sl .lo{text-align:right}.fg-sl .lo,.fg-sl .hi{font-size:.86em;opacity:.75}.fg-sl input{width:100%;min-width:0}'
    + '.fg-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:6px}.fg-th{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;min-height:44px;line-height:1.2}.fg-th svg{border-radius:4px}'
    + '.fg-ages{display:flex;flex-wrap:wrap;gap:10px}.fg-ages figure{margin:0;text-align:center}'
    + '.fg-mini{display:none}'
    + '@media (max-width:760px){.fg-sl{grid-template-columns:5.5em 1fr 5.5em}.fg-sl .nm{grid-column:1 / -1}.fg-mini{display:block;position:sticky;top:6px;z-index:3;width:104px;margin:8px 0 0 auto;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,.5)}.fg-mini svg{display:block}}';
  if (FG.putStyle && typeof document !== 'undefined') { const old = document.getElementById('fg-style'); if (old) old.remove(); FG.putStyle(); }
})();
