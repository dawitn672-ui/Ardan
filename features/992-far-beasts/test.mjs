// Tests for features/992-far-beasts: the Great Continent's 140 creatures as beasts the game knows, in their own lands,
// met in scenes, fought at honest odds, listed in the bestiary; and the Known World exactly as before.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { HELPERS } from '../../tests/helpers.mjs';
import { unpack, repack } from '../../tools/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = () => typeof A !== 'undefined' && !!A.FB && !!A.FB_DATA && !!A.FAR;
const SEP = '\u0001ARDAN-PACK\u0001';

// The same build without this feature: its code cut from the core blob, its scenes from the content blob, its patch
// undone. (The one-line hook in 26-belief-truth stays: with no A.BT.cardLine it adds nothing.)
async function beforeBuild(file) {
  const html = fs.readFileSync(file, 'utf8'), parts = unpack(html);
  let core = parts['ardan-core'];
  const MARK = '\n;(function(){ // features/', mine = MARK + '992-far-beasts/';
  for (let at = core.indexOf(mine); at >= 0; at = core.indexOf(mine)) { const next = core.indexOf(MARK, at + 1); core = core.slice(0, at) + (next >= 0 ? core.slice(next) : ''); }
  let content = parts['ardan-content'];
  const pack = SEP + '// features/992-far-beasts/';
  for (let at = content.indexOf(pack); at >= 0; at = content.indexOf(pack)) { const next = content.indexOf(SEP, at + 1); content = content.slice(0, at) + (next >= 0 ? content.slice(next) : ''); }
  const patches = (await import(pathToFileURL(path.join(HERE, 'patches.mjs')).href)).default;
  for (const p of patches.slice().reverse()) for (const [find, replace, want = 1] of p.edits.slice().reverse()) {
    const src = p.blob === 'ardan-core' ? core : p.blob === 'ardan-content' ? content : parts[p.blob];
    const n = src.split(replace).length - 1;
    if (n !== want) throw new Error(`${p.id}: ${n} copies of the patched text, expected ${want}`);
    const back = src.split(replace).join(find);
    if (p.blob === 'ardan-core') core = back; else if (p.blob === 'ardan-content') content = back; else parts[p.blob] = back;
  }
  parts['ardan-core'] = core; parts['ardan-content'] = content;
  const out = path.join(os.tmpdir(), `ardan-fb-before-${process.pid}.html`);
  fs.writeFileSync(out, repack(html, parts, 3));
  return out;
}
async function openPage(browser, file) {
  const ctx = await browser.newContext(), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
  await pg.goto(pathToFileURL(file).href);
  await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
  await pg.evaluate(HELPERS);
  return { pg, ctx, errs };
}

// a far life: the first far human realm of a land, a peasant of the given age
const FAR_LIFE = () => {
  window.FBT = {
    start(seed, realm, age) { A.newGame({ seed, race: 'human', realm, status: 'peasant', sex: 'M', startAge: age == null ? 24 : age, lands: 'great' }); return A.pc(); },
    sig() { return [T.hash(A.S.people), T.hash(A.S.realms), T.hash(A.S.prov), A.rngState, A.S.year, A.S.day].join('|'); },
  };
};

export default {
  // every creature resolves into the game's tables and lives in at least one far province, which is reachable; none
  // is near a province of the Known World; every fighter has its fitted curve
  async fbAllResolve(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      const pc = FBT.start(9801, 'POL-58');
      const L = A.FB.list, bad = [], cover = {}, S = A.S, base = A.FAR.D.base;
      for (const c of L) {
        const rec = LORE.creatures.find(x => x.id === c.id);
        if (!rec || !rec.name || !rec.cat || !rec.habitat || !rec.belief || !rec.truth) bad.push(c.id + ' record');
        if (!GD.BEAST_TIER[c.id]) bad.push(c.id + ' tier');
        if (c.tier !== 'legend' && c.kind !== 'relic' && !A.BEASTS[c.id]) bad.push(c.id + ' stats');
        if ((c.fight || c.fightSea) && !A.FB.DUEL[c.id]) bad.push(c.id + ' curve');
        if ((c.fight || c.fightSea) && GD.BEAST_DUEL[c.id] !== A.FB.DUEL[c.id]) bad.push(c.id + ' curve not installed');
        if (!c.rarity || !c.tale || (c.tier !== 'legend' && c.kind !== 'relic' && !c.yield)) bad.push(c.id + ' data');
      }
      // reachability: a walk over land and sea lanes from the first far capital
      const adj = id => { const P = S.prov[id]; return (P.adj || []).concat(P.sea || []); };
      const seen = new Set([pc.home]), stack = [pc.home];
      while (stack.length) for (const n of adj(stack.pop())) if (!seen.has(n)) { seen.add(n); stack.push(n); }
      const h0 = pc.home; let kwLeak = 0;
      for (const P of S.prov) {
        if (P.id < base) { pc.home = P.id; if (A.beastsNear(pc).some(id => A.FB.byId[id])) kwLeak++; continue; }
        const n = A.FB.near(P); if (!n) continue;
        for (const id of n.all) { const c = cover[id] || (cover[id] = { n: 0, reach: 0, born: 0 }); c.n++; if (seen.has(P.id)) c.reach++; if (P.owner) c.born++; }
        pc.home = P.id;
        const near = A.beastsNear(pc);
        for (const id of near) if (A.FB.byId[id] && !n.fight.includes(id)) bad.push(id + ' listed off its ground at ' + P.name);
      }
      pc.home = h0;
      const none = L.filter(c => !cover[c.id] || !cover[c.id].reach).map(c => c.id);
      const wild = L.filter(c => cover[c.id] && !cover[c.id].born).map(c => c.id);
      const ns = Object.values(cover).map(c => c.n).sort((a, b) => a - b);
      return { n: L.length, inLore: LORE.creatures.length, beasts: Object.keys(A.BEASTS).length, bad: bad.slice(0, 8), nBad: bad.length, none, wild,
        fighters: L.filter(c => c.fight).length, sea: L.filter(c => c.fightSea).length, legends: L.filter(c => c.tier === 'legend').length, kwLeak, minProv: ns[0], medProv: ns[ns.length >> 1], standIn: Object.entries(A.FB.standIn || {}).map(([a, b]) => a + ' by ' + b) };
    });
    const ok = r.n === 140 && r.nBad === 0 && !r.none.length && r.kwLeak === 0 && r.inLore >= 204;
    return { ok, detail: `${r.n} creatures, ${r.inLore} in LORE.creatures with the far lands open (${r.beasts} stat blocks); ${r.fighters} land fighters and ${r.sea} at sea with fitted curves, ${r.legends} legends; ` +
      `every creature near ${r.minProv} far provinces at least (median ${r.medProv}), ${r.none.length} without a reachable one${r.none.length ? ' ' + r.none.join(', ') : ''}; ` +
      `${r.wild.length} live only in unclaimed land${r.wild.length ? ' (' + r.wild.join(', ') + ')' : ''}; Known World provinces listing a far beast: ${r.kwLeak}; lore regions with no province of their own, stood in for: ${r.standIn.length ? r.standIn.join(', ') : 'none'}` + (r.nBad ? '; BAD ' + r.bad.join('; ') : '') };
  },

  // a Known World scene that names its own beast (the wolves of the hard winter) is not rolled in a far province where
  // that beast does not live; in the same game's Known World provinces, and in a Known World game, it weighs as before
  async fbFixedBeastGate(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      const pc = FBT.start(9841, 'POL-143'), fixed = A.FB.fixedScenes(), ids = Object.keys(fixed);
      const fit = (id, home) => { const h0 = pc.home; pc.home = home; try { return A.evFit(A.EV[id], pc); } finally { pc.home = h0; } };
      const farHome = pc.home, kwHome = A.S.prov.find(P => P.name === 'Evenglade').id;
      const gatedFar = ids.filter(id => fit(id, farHome) === 0 && A.FB.isFar(A.prov(farHome))).length;
      const wolvesFar = fit('av_wild_wolfwinter', farHome), wolvesKw = fit('av_wild_wolfwinter', kwHome);
      A.newGame({ seed: 9842, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pk = A.pc(), h1 = pk.home; pk.home = kwHome; const wolvesKnown = A.evFit(A.EV.av_wild_wolfwinter, pk); pk.home = h1;
      return { n: ids.length, gatedFar, wolvesFar, wolvesKw, wolvesKnown, sample: ids.slice(0, 6).map(id => id + ' ' + fixed[id].join(',')) };
    });
    const ok = r.n >= 20 && r.wolvesFar === 0 && r.wolvesKw > 0 && r.wolvesKw === r.wolvesKnown;
    return { ok, detail: `${r.n} Known World scenes name a beast of their own (${r.sample.join('; ')}...); in Busimo ${r.gatedFar} of them are not rolled; the wolves of the hard winter weigh ${r.wolvesFar} there, ` +
      `${r.wolvesKw} in Evenglade in the same game and ${r.wolvesKnown} in a Known World game` };
  },

  // every flag a scene sets is read by a later scene or by the code: no orphans
  async fbNoOrphanFlags() {
    const src = ['beasts.events.js', 'memory.events.js', 'c-beasts.core.js'].map(f => fs.readFileSync(path.join(HERE, f), 'utf8')).join('\n');
    const set = new Set();
    for (const m of src.matchAll(/flag:\s*'(fb_[a-z_]+)'/g)) set.add(m[1]);
    for (const m of src.matchAll(/flags\.(fb_[a-z_]+)\s*=(?!=)/g)) set.add(m[1]);
    for (const m of src.matchAll(/flags\['(fb_[a-z_]+)'\s*\+/g)) set.add(m[1] + '*');
    const read = f => f.endsWith('*') ? new RegExp(`'${f.slice(0, -1)}'\\)|latest\\(p, '${f.slice(0, -1)}'`).test(src)
      : new RegExp(`C\\.flag\\(p, '${f}'\\)|flags\\.${f}\\s*(?:!=|[-<>]|\\|\\||\\))|flags\\.${f} !=`).test(src);
    const orphans = [...set].filter(f => !read(f));
    return { ok: set.size >= 15 && !orphans.length, detail: `${set.size} flags set (${[...set].join(', ')}); never read: ${orphans.length ? orphans.join(', ') : 'none'}` };
  },

  // a named beast lives in A.S: seen when met, killed once (the news, your deeds, the bestiary, its scene no more), kept
  // by a save; an old save without the record has every one as the lore leaves it
  async fbNamedPersist(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(async () => {
      const pc = FBT.start(9851, 'POL-93', 30), out = {};
      const P = A.S.prov.find(Q => A.FB.isFar(Q) && A.FB.near(Q).fight.includes('CRE-114'));
      pc.home = P.id;
      out.n = A.FB.NAMED.length; out.deadAtStart = A.FB.NAMED.filter(n => !A.FB.nstate(n.key).alive).map(n => n.name);
      out.before = A.C.fbAlive(pc, 'CRE-114') && A.EV.fb_masked_one.cond(pc, A.C);
      A.S.queue = [{ type: 'event', ev: 'fb_masked_one' }];
      const v = A.eventView(A.S.queue[0]), fi = v.choices.findIndex(c => c.fight);
      A.eventChoose(fi); A.eventClose && A.eventClose();
      out.pend = JSON.stringify(A.S.fbPend || null);
      const dq = A.S.queue.find(q => q.type === 'duel');
      if (dq) { while (A.S.queue[0] !== dq) A.S.queue.shift(); dq.d.result = 'win'; dq.d.over = true; A.duelClose(); }
      const st = A.S.fbNamed && A.S.fbNamed['CRE-114#0'];
      out.dead = !!st && !st.alive && st.by === pc.id; out.seen = st && st.seen;
      out.deed = (pc.deeds || []).some(d => /Masked One/.test(d.t)); out.news = A.S.news.some(n => /Masked One/.test(n.t) && /dead/.test(n.t));
      out.after = A.EV.fb_masked_one.cond(pc, A.C);
      A.BT.learn(pc, 'CRE-114', 3, 'test'); UI.tab = 'codex'; UI.codex = 'beasts';
      out.codex = /Masked One: killed by/.test(UI.TAB.codex(pc));
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes); UI.enterSave(d);
      out.kept = !!(A.S.fbNamed && A.S.fbNamed['CRE-114#0'] && !A.S.fbNamed['CRE-114#0'].alive);
      delete A.S.fbNamed; out.oldSave = A.FB.nstate('CRE-114#0').alive && !A.FB.nstate('CRE-100#0').alive;
      return out;
    });
    const ok = r.n === 25 && r.before && r.dead && r.deed && r.news && !r.after && r.codex && r.kept && r.oldSave && r.deadAtStart.length >= 5;
    return { ok, detail: `${r.n} named beasts, ${r.deadAtStart.length} dead before 1105 (${r.deadAtStart.join(', ')}); the Masked One's scene ${r.before ? 'eligible' : 'NOT ELIGIBLE'}, fought (${r.pend}) and killed: ` +
      `${r.dead ? 'dead in A.S' : 'NOT DEAD'}, seen ${r.seen}, deed ${r.deed}, news ${r.news}, scene gone ${!r.after}, bestiary says so ${r.codex}; kept by a save ${r.kept}; with no record (an old save) she stands as the lore has her ${r.oldSave}` };
  },

  // a Known World scene whose beast is only a fallback steps aside in a far province where that beast does not live,
  // and the Southern Peninsulas offer no Tiger of Ranpur
  async fbFallbackStep(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      const pc = FBT.start(9861, 'POL-58', 30), out = { far: 0, farSkip: 0, kw: 0, kwSkip: 0, wolves: 0 };
      for (const P of A.S.prov) {
        if (out.far >= 40 && out.kw >= 10) break;
        const far = A.FB.isFar(P); if ((far && out.far >= 40) || (!far && out.kw >= 10)) continue;
        pc.home = P.id; A.S.queue = [{ type: 'event', ev: 'wk_hunt_beast' }];
        const v = A.eventView(A.S.queue[0]), b = A.S.queue[0].ctx.beast;
        if (far) { out.far++; if (v.skip) out.farSkip++; else if (b && !A.FB.byId[b] && !A.beastsNear(pc).includes(b)) out.wolves++; }
        else { out.kw++; if (v.skip) out.kwSkip++; }
      }
      A.S.queue = [];
      out.tiger = A.S.prov.filter(P => A.FB.isFar(P) && P.region[0] === 'M').filter(P => { pc.home = P.id; return A.beastsNear(pc).includes('CRE-49'); }).length;
      out.mTigers = [...new Set(A.S.prov.filter(P => A.FB.isFar(P) && P.region[0] === 'M').flatMap(P => A.FB.near(P).fight).filter(id => /Tiger/.test(A.FB.byId[id].name)))];
      return out;
    });
    const ok = r.wolves === 0 && r.farSkip > 0 && r.tiger === 0 && r.mTigers.length > 0;
    return { ok, detail: `the bounty scene in ${r.far} far provinces: ${r.farSkip} stepped aside, ${r.wolves} named a beast that does not live there; in ${r.kw} Known World provinces ${r.kwSkip} skipped (as before); ` +
      `Southern Peninsulas provinces offering the Tiger of Ranpur: ${r.tiger}; their own tigers: ${r.mTigers.join(', ')}` };
  },

  // every scene renders in every far region it can fire in: no raw token, text under 80 words, every choice taken
  // without an error; every notable creature's scene can fire somewhere
  async fbScenesRender(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      FBT.start(9802, 'POL-91', 30);
      const base = A.serialize(), ids = Object.keys(A.EV).filter(k => k.startsWith('fb_'));
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const elig = {}, probs = []; let checked = 0, maxW = 0;
      const seen = new Set(), provs = [];
      for (const P of A.S.prov) if (A.FB.isFar(P)) { const k = P.region + (P.coast ? 'c' : '') + P.terr; if (!seen.has(k)) { seen.add(k); provs.push(P.id); } }
      const ce = console.error; console.error = (...a) => probs.push('engine error ' + a.map(String).join(' ').slice(0, 160));
      try {
        const chosen = new Set();
        // the memories the follow-up scenes read (set 25 years ago, as lint-events does), and a creature of home to remember
        const MEM = new Set(); for (const id of ids) for (const m of String(A.EV[id].cond || '').matchAll(/C\.flag\(p,\s*["']([A-Za-z0-9_]+)["']\)/g)) MEM.add(m[1]);
        for (const pid of provs) for (const age of [9, 30]) {
          A.deserialize(JSON.parse(base)); const p0 = A.pc(); p0.home = pid; if (age === 9) p0.born = A.S.year - 9;
          for (const f of MEM) p0.flags[f] = A.S.year - 25;
          const nh = A.FB.near(A.prov(pid)); if (nh && nh.fight.length) { p0.flags['fb_sp_' + nh.fight[0]] = A.S.year - 25; p0.flags['fb_k_' + nh.fight[0]] = A.S.year - 25; }
          const st = A.FB.nmut('CRE-92#0'); st.by = p0.id; st.year = A.S.year - 20; st.byName = 'you';
          let atHome = null;
          for (const id of ids) {
            const e = A.EV[id]; let ok; try { ok = !e.cond || e.cond(A.pc(), A.C); } catch (err) { probs.push(id + ' cond ' + err.message); continue; }
            if (!ok) continue; elig[id] = (elig[id] || 0) + 1;
            // the view in every kind of province (setup draws, so the stream moves; nothing else does)
            A.S.queue = []; const q = { type: 'event', ev: id }; A.S.queue.unshift(q);
            const v = A.eventView(q); A.S.queue = [];
            if (v.skip) { if (!(q.ctx && q.ctx.skip)) probs.push(id + ' dropped: ' + String(v.text).slice(0, 120)); continue; }
            checked++; const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
            if (RAW.test(all)) probs.push(id + ' raw ' + all.match(RAW)[0]);
            maxW = Math.max(maxW, w(v.text)); if (w(v.text) > 80) probs.push(`${id} ${w(v.text)} words (${q.ctx.beast})`);
            for (const c of v.choices) if (w(c.t) > 12) probs.push(id + ' long choice ' + c.t);
            // every choice taken, from a fresh state, the first time the scene is met as a child and as an adult
            if (chosen.has(id + age)) continue; chosen.add(id + age);
            atHome = atHome || A.serialize();
            for (let i = 0; i < e.choices.length; i++) {
              A.deserialize(JSON.parse(atHome)); A.S.queue = [];
              const q2 = { type: 'event', ev: id }; A.S.queue.unshift(q2);
              const v2 = A.eventView(q2); if (v2.skip) break;
              const idx = v2.choices.findIndex(c => c.i === i); if (idx < 0) continue;
              try { A.eventChoose(idx); const res = A.S.queue[0] && A.S.queue[0].result; if (res && RAW.test(res.text || '')) probs.push(id + ' raw result'); A.eventClose(); }
              catch (err) { probs.push(`${id} choice ${i + 1}: ${err.message}`); }
            }
            A.deserialize(JSON.parse(atHome));
          }
        }
      } finally { console.error = ce; }
      // the notable creatures' scenes: eligible in at least one far province of their own
      A.deserialize(JSON.parse(base));
      const pc = A.pc(), never = [];
      for (const id of ids) {
        if (elig[id]) continue;
        let any = false;
        for (const P of A.S.prov) { if (!A.FB.isFar(P)) continue; pc.home = P.id; try { if (A.EV[id].cond(pc, A.C)) { any = true; break; } } catch (e) {} }
        if (!any) never.push(id);
      }
      return { events: ids.length, provs: provs.length, checked, maxW, probs: [...new Set(probs)].slice(0, 10), nProbs: new Set(probs).size, never };
    });
    const ok = r.events >= 45 && r.nProbs === 0 && !r.never.length && r.checked > 300;
    return { ok, detail: `${r.events} scenes, ${r.checked} renders over ${r.provs} kinds of far province (longest ${r.maxW} words), every choice taken; never eligible: ${r.never.length ? r.never.join(', ') : 'none'}` +
      (r.nProbs ? '; PROBLEMS ' + r.probs.join('; ') : '') };
  },

  // ten years from three far births: the land's beasts are met (scenes, sightings, what you have seen)
  async fbEncounters(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      const out = [];
      for (const [seed, realm] of [[9811, 'POL-58'], [9812, 'POL-91'], [9813, 'POL-143']]) {
        const pc = FBT.start(seed, realm, 18), scenes = {}, beastEv = [];
        let sights = 0;
        const log = A.log; A.log = function (t, c) { if (c === 'lore' && /^You see /.test(String(t))) sights++; return log.apply(this, arguments); };
        try {
          T.play(10, { onEvent: v => { const h = A.S.queue[0]; if (h && /^fb_/.test(h.ev)) scenes[h.ev] = (scenes[h.ev] || 0) + 1; else if (h && h.ctx && A.FB.byId[h.ctx.beast]) beastEv.push(h.ev + ':' + h.ctx.beast); } });
        } finally { A.log = log; }
        const p = A.pc() || pc, seen = Object.keys(p.flags).filter(k => { const m = /^bt_[hsk]_(CRE-\d+)$/.exec(k); return m && A.FB.byId[m[1]]; }).length;
        out.push({ realm, region: A.prov(pc.home).region, year: A.S.year, alive: p.alive, scenes, n: Object.values(scenes).reduce((a, b) => a + b, 0), beastEv: beastEv.length, sights, learned: seen });
      }
      return out;
    });
    const ok = r.every(x => x.n + x.sights >= 3 && x.n >= 1) && r.reduce((a, x) => a + x.n, 0) >= 6;
    return { ok, detail: r.map(x => `${x.realm} (${x.region}) to ${x.year}${x.alive ? '' : ' (died)'}: ${x.n} beast scenes (${Object.keys(x.scenes).join(', ')}), ${x.beastEv} other scenes with a far beast, ${x.sights} sightings, ${x.learned} far creatures learned of`).join('; ') };
  },

  // the odds shown for a far beast fight are the odds rolled: the duel screen's number against duels the engine plays
  // (a pool of the far lands' own people, unlike the fit's), and the choice's badge is the same curve
  async fbHonestOdds(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      const rng = (s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296)(9814);
      FBT.start(9814, 'POL-58');
      const pool = [];
      for (let i = 0; i < 240; i++) {
        const p = A.makeFoe({ realm: ['POL-58', 'POL-91', 'POL-143', 'POL-126'][i % 4], tier: 1 + i % 5 });
        if (i % 9 === 8) { for (const k in p.skills) p.skills[k] = Math.min(100, p.skills[k] + 25); for (const s of ['str', 'spd', 'ins', 'sta']) p.st[s] += 15; }
        p.npcTemp = false; A.S.people[p.id] = p; if (p.race === 'human') pool.push(p.id);
      }
      const ids = A.FB.list.filter(c => c.fight || c.fightSea).map(c => c.id), rows = [];
      const dc = A.duelConsequences; A.duelConsequences = () => []; const close = A.duelClose; A.duelClose = () => {};
      try {
        for (let k = 0; k < 4000; k++) {
          const a = A.P(pool[Math.floor(rng() * pool.length)]), bid = ids[k % ids.length], party = rng() < 0.5;
          a.health = [100, 100, 80, 60][Math.floor(rng() * 4)]; a.wounds = []; A.S.pc = a.id; A.S.queue = [];
          const D = A.startDuel(a, { beastId: bid, mod: 1 }, { kind: 'beast', forceSolo: true, grounded: true, party: party ? { n: 8 } : undefined });
          if (!D || !D.measure) continue;
          const shown = D.measure.pct; A.duelAuto(D); A.S.queue = [];
          rows.push([shown, D.result === 'win' || D.result === 'beastfled' ? 1 : 0]);
        }
      } finally { A.duelConsequences = dc; A.duelClose = close; A.S.queue = []; }
      // 48-fight-ladder's test of the Known World's beasts: the mean error at most 4 points, and every bin of 60 or more
      // within 3.5 standard errors (plus a point) of what was won
      const edges = [0, 10, 25, 40, 60, 75, 90, 101], bins = []; let maxErr = 0, wErr = 0, nAll = 0, seOk = true;
      for (let i = 0; i + 1 < edges.length; i++) {
        const b = rows.filter(x => x[0] >= edges[i] && x[0] < edges[i + 1]); if (b.length < 60) continue;
        const sh = b.reduce((a, x) => a + x[0], 0) / b.length, re = 100 * b.reduce((a, x) => a + x[1], 0) / b.length, p = Math.min(0.98, Math.max(0.02, sh / 100));
        if (Math.abs(sh - re) > 350 * Math.sqrt(p * (1 - p) / b.length) + 1) seOk = false;
        bins.push(`${edges[i]}-${edges[i + 1] - 1}: ${sh.toFixed(0)} shown, ${re.toFixed(0)} won (${b.length})`); maxErr = Math.max(maxErr, Math.abs(sh - re)); wErr += Math.abs(sh - re) * b.length; nAll += b.length;
      }
      const meanErr = nAll ? Math.round(wErr / nAll * 10) / 10 : 99;
      // the badge (89-fight-odds) on a far beast's fight choice reads the duel's own curve
      const pc = FBT.start(9815, 'POL-58'); let badge = null;
      const Pq = A.S.prov.find(P => A.FB.isFar(P) && A.FB.near(P).all.includes('CRE-67') && A.FB.near(P).fight.includes('CRE-67'));
      if (Pq) {
        pc.home = Pq.id; A.S.queue = [{ type: 'event', ev: 'fb_grey_ten' }];
        const v = A.eventView(A.S.queue[0]), c = v.choices.find(x => x.fight);
        const spec = { scale: 'beast', beast: 'CRE-67' }, want = Math.round(100 * A.clamp(A.FL.resolve(pc, spec, {}, null).p, 0.02, 0.98));
        badge = { has: !!c, pct: c && c.fight.pct, want };
        A.S.queue = [];
      }
      return { n: rows.length, maxErr: Math.round(maxErr * 10) / 10, meanErr, seOk, bins, badge, pool: pool.length };
    });
    const badgeOk = r.badge && r.badge.has && Math.abs(r.badge.pct - r.badge.want) <= 1;
    const ok = r.n > 3500 && r.meanErr <= 4 && r.seOk && badgeOk;
    return { ok, detail: `${r.n} duels against the 53 far fighters by ${r.pool} far-born fighters: mean error ${r.meanErr} points, worst bin ${r.maxErr}${r.seOk ? ', every bin within its sampling error' : ', A BIN OUTSIDE ITS SAMPLING ERROR'} (${r.bins.join('; ')}); ` +
      `badge on the Grey Ten's fight ${r.badge ? r.badge.pct + '% against the curve\'s ' + r.badge.want + '%' : 'NOT FOUND'}` };
  },

  // the Known World plays exactly as before: three lives of five years, their state, stream and drawn screens, and
  // the bestiary, against the build without this feature
  async fbKnownWorldSame(pg, errs, { browser, file }) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    let before; try { before = await beforeBuild(file); } catch (e) { return { ok: false, detail: 'could not derive the build without this feature: ' + e.message }; }
    const MEASURE = () => {
      const out = [];
      for (const [seed, realm, race] of [[9821, 'POL-01', 'human'], [9822, 'POL-14', 'human'], [9823, 'POL-11', 'orc']]) {
        T.enter({ seed, race, realm, status: 'peasant', sex: 'M', startAge: 16, lands: 'known' });
        T.play(5);
        T.renderAll();
        UI.tab = 'codex'; UI.codex = 'beasts'; let codex = ''; try { codex = UI.TAB.codex(A.pc()); } catch (e) { codex = 'error ' + e.message; }
        out.push({ hash: T.hash(A.S), rng: A.rngState, year: A.S.year, creatures: LORE.creatures.length, beasts: Object.keys(A.BEASTS).length, codex: T.hash(codex) });
      }
      return out;
    };
    const a = await pg.evaluate(MEASURE);
    const B = await openPage(browser, before);
    let b; try { b = await B.pg.evaluate(MEASURE); } finally { await B.ctx.close(); try { fs.unlinkSync(before); } catch (e) {} }
    const same = a.every((x, i) => JSON.stringify(x) === JSON.stringify(b[i]));
    return { ok: same && !B.errs.length, detail: `${a.length} Known World lives of 5 years: ${a.map((x, i) => `${x.hash}/${x.rng} ${JSON.stringify(x) === JSON.stringify(b[i]) ? 'same' : 'DIFFERENT from ' + b[i].hash + '/' + b[i].rng}`).join(', ')}; ` +
      `${a[0].creatures} creatures and ${a[0].beasts} stat blocks in both; the bestiary drawn the same` + (B.errs.length ? '; page errors without it: ' + B.errs.join(' | ') : '') };
  },

  // the bestiary lists the far creatures you know of, each with its line (CRE id, name, land, rarity), and a far
  // child has heard of its own land's beasts; drawing it, a scene and a far duel changes neither state nor stream
  async fbBestiaryPure(pg) {
    if (!(await pg.evaluate(GATE))) return { ok: false, detail: 'A.FB not in this build' };
    await pg.evaluate(FAR_LIFE);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9831, race: 'human', realm: 'POL-143', status: 'peasant', sex: 'F', startAge: 12, lands: 'great' });
      const pc = A.pc(), P = A.prov(pc.home), land = P.region[0];
      const heard = A.FB.list.filter(c => A.BT.level(pc, c.id) >= 1), mine = heard.filter(c => c.lands.includes(land)), other = heard.filter(c => !c.lands.includes(land));
      const kwHeard = LORE.creatures.filter(c => !c.far && A.BT.level(pc, c.id) >= 1).length;
      // learn one beast fully, then draw
      const known = A.FB.near(P).all.find(id => A.FB.byId[id].tale !== 'none') || A.FB.near(P).all[0]; A.BT.learn(pc, known, 3, 'test');
      A.S.queue = [{ type: 'event', ev: 'fb_shown_tracks' }]; A.eventView(A.S.queue[0]);
      const s0 = FBT.sig();
      UI.tab = 'codex'; UI.codex = 'beasts'; UI.render();
      const html = UI.TAB.codex(pc), lines = (html.match(/class="fb-line"/g) || []).length;
      const k = A.FB.byId[known], hasLine = html.includes(k.id) && html.includes(UI.esc(k.name)) && html.includes(UI.esc(A.FB.landName(k.lands[0]))), hasTale = html.includes('the tale holds') || html.includes('the tale is not') || html.includes('no such beast');
      // a scene and a duel drawn twice
      UI.render(); UI.render();
      const fighter = A.FB.near(P).fight[0] || 'CRE-182';
      A.S.queue = []; const s1 = FBT.sig();
      const D = A.startDuel(pc, { beastId: fighter, mod: 1 }, { kind: 'beast', forceSolo: true }); const s2 = FBT.sig(); UI.render(); UI.render(); const s3 = FBT.sig();
      A.S.queue = [];
      return { region: P.region, heard: heard.length, mine: mine.length, other: other.length, kwHeard, lines, hasLine, hasTale, pureCodex: s0 === s1, pureDuel: s2 === s3, duel: !!(D && D.measure), known: k.id + ' ' + k.name };
    });
    const ok = r.heard >= 3 && r.mine >= r.other && r.lines >= r.heard && r.hasLine && r.hasTale && r.pureCodex && r.pureDuel && r.duel;
    return { ok, detail: `a girl of 12 in ${r.region} has heard of ${r.heard} far creatures (${r.mine} of her own land, ${r.other} from elsewhere) and ${r.kwHeard} of the Known World's; ` +
      `the bestiary draws ${r.lines} creature lines, ${r.known} with its id, name, land and tale: ${r.hasLine && r.hasTale}; drawing the bestiary and a scene ${r.pureCodex ? 'changes nothing' : 'CHANGES THE GAME'}, the far duel ${r.pureDuel ? 'changes nothing' : 'CHANGES THE GAME'}` };
  },
  // cycle 1: the Codex said "You see a Bactrian Wild Camel": a real-world place in Ardan
  async fbNoRealWorld(pg) {
    const r = await pg.evaluate(() => { const all = JSON.stringify(A.FB_DATA); return { bactrian: /Bactria/i.test(all), camel: (A.FB_DATA.list || A.FB_DATA.creatures || []).map ? JSON.stringify(A.FB_DATA).match(/"name":"[^"]*Camel[^"]*"/g) : null }; });
    return { ok: !r.bactrian, detail: JSON.stringify(r) };
  },
  // cycle 2 (lives B4): "A CRE-35 has been killing stock", "Game is moving along the Elder Grass: CRE-65". The base
  // A.ctxTokens wrote ctx.beast back over the beast's name, and far beasts had no name entry
  async fbNoRawIds(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 9921, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
      const pc = A.pc(), known = A.ctxTokens(pc, { beast: 'CRE-21' }).beast, far = A.ctxTokens(pc, { beast: 'CRE-65', aBeast: 'CRE-87' });
      const views = [];
      for (const id of ['pf_spear_boar', 'wk_hunt_beast']) {
        if (!A.EV[id]) continue;
        const q = { type: 'event', ev: id, ctx: { beast: 'CRE-35' }, forced: true }; A.S.queue.unshift(q);
        try { const v = A.eventView(q); if (!v.skip) views.push(id + ': ' + String(v.text).replace(/<[^>]+>/g, '').slice(0, 80)); } catch (e) {}
        A.S.queue.shift();
      }
      return { known, far: [far.beast, far.aBeast], views };
    });
    const raw = [r.known].concat(r.far, r.views).filter(t => /CRE-\d/.test(t));
    return { ok: !raw.length && r.views.length > 0, detail: `{beast} for CRE-21: "${r.known}"; far CRE-65/CRE-87: "${r.far.join('", "')}"; ${r.views.join(' | ')}; raw ids left: ${raw.length}` };
  },
};
