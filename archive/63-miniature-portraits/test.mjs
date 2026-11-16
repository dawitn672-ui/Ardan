// Painted miniatures: every people, sex and age draws; the same person draws the same picture; age and wounds show;
// children are smaller; drawing is pure; the setting works; the profile passes axe.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// in the page: a person cloned from the player and changed, for drawing only (never added to the state)
const MAKE = () => {
  window.MNT = {
    mk(o = {}) {
      const base = A.pc(), p = JSON.parse(JSON.stringify(base)), R = GD.RACES[o.race || 'human'];
      p.id = o.id || 'mnt_' + (o.race || 'human') + (o.sex || 'M') + (o.age ?? 25);
      p.race = o.race || 'human'; p.sex = o.sex || 'M'; p.born = A.S.year - (o.age ?? Math.round(R.grown * 1.25));
      p.status = o.status || 'peasant'; p.ruler = o.ruler || null; p.mil = o.mil || null; p.job = o.job || null; p.house = o.house || null; p.noble = null;
      p.gear = Object.assign({ weapon: 'fists', ranged: null, armor: 'none', shield: null, helm: null, mount: null, cloak: null }, o.gear || {});
      p.wounds = (o.wounds || []).map(k => ({ k })); p.quirks = []; p.alive = o.dead ? false : true;
      p.app = Object.assign({}, base.app, o.app || {});
      if (o.given) p.given = o.given;
      return p;
    },
    // the life stages of each people, scaled to how fast they grow and age
    bands(race) { const r = GD.RACES[race]; return [0, Math.round(r.grown * .3), Math.round(r.grown * .7), Math.round(r.grown * 1.25), Math.round((r.primeEnd + r.old) / 2), Math.round(r.old * 1.25)]; },
    parse(svg) { const d = new DOMParser().parseFromString(svg, 'image/svg+xml'); return !d.querySelector('parsererror') && d.documentElement.nodeName === 'svg'; },
    // the height of the drawn figure, measured by the browser
    figH(svg) { const box = document.createElement('div'); box.innerHTML = svg; document.body.appendChild(box); const g = box.querySelector('.mn-fig'); const h = g ? g.getBBox().height : 0; box.remove(); return h; },
  };
};

export default {
  // 7 peoples x 2 sexes x 6 ages (newborn, 6, 14, 25, 45, 70 in human years) x full figure and small bust
  async miniEveryRace(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 631, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const bad = [], full = [], small = [], poses = {};
      const e0 = UI.MINI.errors;
      for (const race of Object.keys(GD.RACES)) for (const sex of ['M', 'F']) for (const age of MNT.bands(race)) {
        const p = MNT.mk({ race, sex, age });
        for (const [size, list] of [[200, full], [46, small]]) {
          const s = PORTRAIT.svg(p, size);
          if (!/class="portrait mini/.test(s) || !MNT.parse(s)) bad.push(`${race} ${sex} ${age} @${size}`);
          list.push(s.length);
          if (size === 200) { const m = /data-pose="(\w+)"/.exec(s); poses[m ? m[1] : '?'] = (poses[m ? m[1] : '?'] || 0) + 1; }
        }
      }
      const kb = a => (a.reduce((x, y) => x + y, 0) / a.length / 1024).toFixed(1);
      return { n: full.length, bad, errors: UI.MINI.errors - e0, last: UI.MINI.lastError, full: kb(full), fullMax: (Math.max(...full) / 1024).toFixed(1), small: kb(small), smallMax: (Math.max(...small) / 1024).toFixed(1), poses };
    }));
    const ok = r.n === 84 && !r.bad.length && r.errors === 0;
    return { ok, detail: `${r.n} people (7 peoples x 2 sexes x 6 ages), each as a full figure and a 46 px bust: ${r.bad.length} invalid${r.bad.length ? ' (' + r.bad.slice(0, 4).join(', ') + ')' : ''}, ${r.errors} fallbacks${r.last ? ' ' + r.last : ''}; size full ${r.full} KB (max ${r.fullMax}), bust ${r.small} KB (max ${r.smallMax}); poses ${JSON.stringify(r.poses)}` };
  },

  // the same person draws the same SVG every time; real people of a world spread over the poses
  async miniDeterministic(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 632, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 30 });
      const ppl = Object.values(A.S.people).filter(p => p.alive && p.app);
      let same = 0, n = 0; const poses = {}, pics = new Set();
      for (const p of ppl) for (const size of [176, 46]) { const a = PORTRAIT.svg(p, size), b = PORTRAIT.svg(p, size); n++; if (a === b) same++; if (size === 176) { pics.add(a); const m = /data-pose="(\w+)"/.exec(a); poses[m[1]] = (poses[m[1]] || 0) + 1; } }
      return { n, same, people: ppl.length, distinct: pics.size, poses };
    }));
    const ok = r.same === r.n && r.distinct === r.people && Object.keys(r.poses).filter(k => k !== 'swaddled').length >= 4;
    return { ok, detail: `${r.same} of ${r.n} drawings identical when drawn again; ${r.distinct} distinct pictures for ${r.people} people; poses in this world ${JSON.stringify(r.poses)}` };
  },

  // age changes the face and hair; each visible wound changes the picture; children are drawn smaller
  async miniAgeWoundsChildren(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 633, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const id = 'mnt_same', app = { hstyle: 'short', beard: 'short', hair: 2 };
      const at = age => PORTRAIT.svg(MNT.mk({ id, age, app }), 200);
      const ageDiff = [25, 45, 70].map(at), ageOk = new Set(ageDiff).size === 3;
      const plain = PORTRAIT.svg(MNT.mk({ id, age: 40, app }), 200);
      const wounds = ['lost_eye', 'scar_face', 'lost_hand', 'broken_nose', 'ear', 'burn', 'brand'];
      const changed = wounds.filter(k => PORTRAIT.svg(MNT.mk({ id, age: 40, app, wounds: [k] }), 200) !== plain);
      const h = {}; for (const age of [0, 6, 14, 25]) h[age] = Math.round(MNT.figH(PORTRAIT.svg(MNT.mk({ id: 'mnt_h', age, app }), 200)));
      const hD = { dwarf: Math.round(MNT.figH(PORTRAIT.svg(MNT.mk({ id: 'mnt_h', race: 'dwarf', age: 40, app }), 200))), giant: Math.round(MNT.figH(PORTRAIT.svg(MNT.mk({ id: 'mnt_h', race: 'giant', age: 40, app }), 200))) };
      // a giant against men of the same age: one man drawn from the stream can be tall, so take six
      const men = [1, 2, 3, 4, 5, 6].map(i => MNT.figH(PORTRAIT.svg(MNT.mk({ id: 'mnt_m' + i, age: 40, app }), 200)));
      hD.man = Math.round(men.reduce((a, x) => a + x, 0) / men.length);
      const baby = /data-pose="swaddled"/.test(PORTRAIT.svg(MNT.mk({ id, age: 0, app }), 200));
      return { ageOk, changed, wounds: wounds.length, h, hD, baby };
    }));
    const ok = r.ageOk && r.changed.length === r.wounds && r.baby && r.h[6] < r.h[25] * .75 && r.h[14] < r.h[25] && r.h[0] < r.h[6] && r.hD.dwarf < r.hD.man && r.hD.giant > r.hD.man;
    return { ok, detail: `25, 45 and 70 draw three different faces: ${r.ageOk}; ${r.changed.length} of ${r.wounds} wounds change the picture (${r.changed.join(', ')}); figure heights in a 340-unit frame: newborn in its cradle ${r.h[0]}, 6 years ${r.h[6]}, 14 years ${r.h[14]}, grown ${r.h[25]}, a dwarf ${r.hD.dwarf}, a giant ${r.hD.giant}, men of 40 on average ${r.hD.man}; the newborn is swaddled: ${r.baby}` };
  },

  // drawing every screen with portraits changes nothing in the game and draws no random number; the state's
  // strings never reach the SVG raw
  async miniPure(pg) {
    const r = await pg.evaluate(MAKE).then(() => pg.evaluate(() => {
      A.newGame({ seed: 634, race: 'human', realm: 'POL-03', status: 'noble', sex: 'F', startAge: 30 });
      UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.render();
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState);
      for (const t of ['life', 'people', 'realm', 'legacy']) { UI.tab = t; UI.render(); }
      UI.ov = { type: 'profile' }; UI.render();
      const someone = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc);
      UI.ov = { type: 'person', id: someone.id }; UI.render();
      const minis = document.querySelectorAll('svg.portrait.mini').length;
      UI.ov = null; UI.render();
      const same = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      const evil = MNT.mk({ id: 'x"><script>', given: '<img src=x onerror=alert(1)>', app: { skin: 'red"/><script>alert(1)</script>', hair: '"><b>' } });
      evil.house = null; evil.gear.weapon = '"><i>';
      const s = PORTRAIT.svg(evil, 200);
      const clean = !/<script|<img|<b>|<i>/.test(s) && MNT.parse(s) && new DOMParser().parseFromString(s, 'image/svg+xml').querySelectorAll('script,img,b,i,foreignObject').length === 0;
      return { same, minis, clean };
    }));
    return { ok: r.same && r.minis >= 2 && r.clean, detail: `state and random stream unchanged by drawing six screens: ${r.same}; miniatures on screen with a person's page open: ${r.minis}; markup in a name, a colour and a gear key never reaches the SVG: ${r.clean}` };
  },

  // the menu setting switches between the miniatures and the release's portraits
  async miniToggle(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 635, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      UI.screen = 'game'; UI.ov = { type: 'menu' }; UI.render();
      const box = document.querySelector('input[data-c="setMiniatures"]');
      const has = !!box, on = box && box.checked;
      box.checked = false; UI.C.setMiniatures(box);
      UI.ov = null; UI.tab = 'life'; UI.render();
      const off = !document.querySelector('svg.portrait.mini') && !!document.querySelector('svg.portrait');
      UI.set.miniatures = true; UI.render();
      const back = !!document.querySelector('svg.portrait.mini');
      return { has, on, off, back };
    });
    return { ok: r.has && r.on && r.off && r.back, detail: `setting in the menu ${r.has}, on by default ${r.on}; off shows the release's portraits ${r.off}; on again ${r.back}` };
  },

  // accessibility: the game screen (portrait in the side panel), the profile and a person's page
  async miniAxe(pg, errs) {
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(v => `${v.id}(${v.nodes.map(n => n.target.join(' ')).slice(0, 2).join(';')})`));
    const found = [];
    await pg.evaluate(() => { A.newGame({ seed: 636, race: 'dwarf', realm: 'POL-10', status: 'noble', sex: 'M', startAge: 60 }); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.tab = 'life'; UI.ov = null; UI.render(); });
    found.push(...(await scan()).map(v => 'game:' + v));
    await pg.evaluate(() => { UI.ov = { type: 'profile' }; UI.render(); });
    found.push(...(await scan()).map(v => 'profile:' + v));
    await pg.evaluate(() => { const p = Object.values(A.S.people).find(x => x.alive && x.id !== A.S.pc); UI.ov = { type: 'person', id: p.id }; UI.render(); });
    found.push(...(await scan()).map(v => 'person:' + v));
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    return { ok: !found.length, detail: `${found.length} axe violations on the game screen, the profile and a person's page${found.length ? ': ' + found.slice(0, 5).join(', ') : ''}` };
  },
};
