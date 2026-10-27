// The far beasts: the Great Continent's 140 creatures (CRE-65 to CRE-204) as beasts the game knows, in their own lands.
//
// The data (a-data.core.js, made by gen.mjs from the lore) and the fitted duel curves (b-duel.core.js, made by fit.mjs)
// are put where the release and the features already read beasts, for as long as a game of the Great Continent is open,
// and taken out again for any other game (the way 99-far-lands' FL.install adds the far realms):
//   LORE.creatures     one record each in the release's shape (name, cat, habitat, size, behavior, weak, belief, truth)
//   A.BEASTS           the stat block of every creature that is not a legend (the lore's 49, the rest read from size)
//   GD.BEAST_TIER      animal, great, titan or legend; GD.BEAST_FLYER for the dragon; GD.BEAST_DUEL the fitted curves
// Where each lives: a creature is near a far province whose lore region is one of its regions (99 gives every far
// province its region) and whose ground word fits its terrain, the way 76-beast-habitats reads the canon ranges: in a
// region where no province carries a fitting ground word the whole region counts, and a sea creature keeps to the
// coast. Resolved from the far map as generated, never from the live state, so conquest never moves a beast.
//
// With lands: 'known' nothing is installed and every hook passes straight through, so the Known World plays as before.
// Engine side: the hunt's game and hoaxes, sightings (A.onMonth), the yield of a kill (A.duelClose), what a far child
// has heard of (A.BT.childHeard), what exploring teaches (A.BT.pickCreature). Rendering reads only (the codex line).
// State: flags only (bt_* of 26-belief-truth, fb_* of the scenes), so old saves load.
const D = A.FB_DATA, FAR = A.FAR;
if (!D || !FAR) return;
const FB = A.FB = { D, OFF: false, active: false, list: D.list, byId: {}, DUEL: A.FB_DUEL || {} };
for (const c of D.list) FB.byId[c.id] = c;
FB.isFar = P => !!(P && FAR.D && P.id >= FAR.D.base && typeof P.region === 'string');
FB.landOf = P => (FB.isFar(P) ? P.region[0] : null);
FB.landName = code => D.lands[code] || 'the Known World';
FB.regionName = id => D.regions[id] || id;
const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const an = n => (/^The /.test(n) ? n.replace(/^The /, 'the ') : /'s\b|^Old /.test(n) ? n : (/^[AEIOU]/.test(n) ? 'an ' : 'a ') + n);
FB.a = id => { const c = FB.byId[id]; return c ? (c.rarity === 'unique' ? c.name.replace(/^The /, 'the ') : an(c.name)) : 'a beast'; };
FB.the = id => { const c = FB.byId[id]; return c ? (/^The /.test(c.name) ? c.name.replace(/^The /, 'the ') : /'s\b|^Old /.test(c.name) ? c.name : 'the ' + c.name) : 'the beast'; };

// ---- the creature records in the release's shape (LORE.creatures), built once
const rec = c => ({
  id: c.id, name: c.name, cat: c.cat, far: true,
  habitat: `${c.lands.map(FB.landName).join(' and ')}: ${c.regions.map(r => FB.regionName(r).replace(/^The /, 'the ')).join(', ')}`,
  size: c.size || '–', behavior: c.habit || '', weak: c.weak || '–', belief: c.belief || '', truth: c.truth || '',
});
FB.records = D.list.map(rec);

// ---- install and uninstall with the far lands
const reg = [];
const put = (obj, k, v) => { if (!obj || v == null || Object.prototype.hasOwnProperty.call(obj, k)) return; obj[k] = v; reg.push([obj, k]); };
let pushed = [];
FB.install = function () {
  if (FB.active) return;
  for (const r of FB.records) if (!LORE.creatures.some(x => x.id === r.id)) { LORE.creatures.push(r); pushed.push(r); }
  for (const c of D.list) {
    if (c.stats) put(A.BEASTS, c.id, c.stats);
    put(GD.BEAST_TIER, c.id, c.tier);
    if (c.kind === 'dragon' && GD.BEAST_FLYER) put(GD.BEAST_FLYER, c.id, 1);
    if (GD.BEAST_DUEL && FB.DUEL[c.id]) put(GD.BEAST_DUEL, c.id, FB.DUEL[c.id]);
  }
  FB.active = true; FB._near = {};
};
FB.uninstall = function () {
  if (!FB.active) return;
  for (let i = reg.length - 1; i >= 0; i--) delete reg[i][0][reg[i][1]];
  reg.length = 0;
  const drop = new Set(pushed);
  for (let i = LORE.creatures.length - 1; i >= 0; i--) if (drop.has(LORE.creatures[i])) LORE.creatures.splice(i, 1);
  pushed = [];
  FB.active = false; FB._near = {};
};
const inst = FAR.install, uninst = FAR.uninstall;
FAR.install = function () { const r = inst.apply(this, arguments); if (FAR.active && !FB.OFF) FB.install(); return r; };
FAR.uninstall = function () { const r = uninst.apply(this, arguments); if (!FAR.active) FB.uninstall(); return r; };
if (FAR.active && !FB.OFF) FB.install();
FB.on = () => FB.active && !FB.OFF;

// ---- where each lives (static: the far provinces as generated)
const terrOk = (terr, t) => terr.includes(t) || (t === 'steppe' && terr.includes('plains')) || (t === 'plains' && (terr.includes('savanna') || terr.includes('steppe')));
let byRegion = null, waived = null;
const regions = () => {
  if (byRegion) return byRegion;
  byRegion = {}; waived = {};
  for (const q of FAR.provinces()) (byRegion[q.region] = byRegion[q.region] || []).push(q);
  // a lore region the far map holds no province of (the generator may fold a small one into its neighbours) is stood
  // in for by the nearest region of the same land that has provinces, by the lore's middles
  FB.standIn = {};
  const C0 = D.centres || {};
  for (const r in D.regions) {
    if (byRegion[r] || !C0[r]) continue;
    let best = null, bd = Infinity;
    for (const o in byRegion) if (o[0] === r[0] && C0[o]) { const d = Math.hypot(C0[o][0] - C0[r][0], C0[o][1] - C0[r][1]); if (d < bd) { bd = d; best = o; } }
    if (best) FB.standIn[r] = best;
  }
  for (const c of D.list) c.at = [...new Set(c.regions.map(r => (byRegion[r] ? r : FB.standIn[r])).filter(Boolean))];
  for (const c of D.list) for (const r of c.at) {
    const ps = byRegion[r] || [];
    // no province of this region fits its ground (or its coast, at sea): the whole region counts
    if (c.sea ? !ps.some(p => p.coast) : !ps.some(p => terrOk(c.terr, p.terr))) waived[c.id + '|' + r] = true;
  }
  return byRegion;
};
FB.suits = function (id, P) {
  const c = FB.byId[id]; if (!c || !P || !FB.isFar(P)) return false;
  regions();
  if (!c.at.includes(P.region)) return false;
  if (c.tier === 'legend' || c.kind === 'relic' || waived[c.id + '|' + P.region]) return true;
  return c.sea ? !!P.coast : terrOk(c.terr, P.terr);
};
// the far creatures near a province, by family: all, fight (land fights), sea, quarry, venom, legend, sight
FB.near = function (P) {
  if (!P || !FB.isFar(P)) return null;
  const memo = FB._near || (FB._near = {});
  if (memo[P.id]) return memo[P.id];
  const all = D.list.filter(c => FB.suits(c.id, P));
  const ids = f => all.filter(f).map(c => c.id);
  return (memo[P.id] = {
    all: ids(() => true), fight: ids(c => c.fight), sea: ids(c => c.sea && c.tier !== 'legend'), seaFight: ids(c => c.fightSea),
    quarry: ids(c => !!c.quarry && !c.sea), seaQuarry: ids(c => !!c.quarry && c.sea), venom: ids(c => c.venom), legend: ids(c => c.tier === 'legend' || c.kind === 'relic'),
    sight: ids(c => c.tier !== 'legend' && c.kind !== 'relic' && !c.venom && c.kind !== 'small'), named: ids(c => c.inds.length > 0 && c.tier !== 'legend'),
  });
};
FB.home = p => (p && p.home != null && A.prov ? A.prov(p.home) : null);
FB.nearHome = p => (FB.on() ? FB.near(FB.home(p)) : null);
FB.here = (p, id) => { const n = FB.nearHome(p); return !!n && n.all.includes(id); };
FB.has = (p, fam) => { const n = FB.nearHome(p); return !!n && n[fam].length > 0; };
const RW = { common: 1, uncommon: 0.6, rare: 0.3, unique: 0.2, legend: 0.5 };
// engine only: a creature of a family near p, weighted by rarity
FB.pick = function (p, fam, filter) {
  const n = FB.nearHome(p); if (!n) return null;
  const ids = n[fam].filter(id => !filter || filter(FB.byId[id]));
  if (!ids.length) return null;
  return FB.wpick(ids);
};
// fill an event's tokens for a creature: {beast} (from the engine, as ctx.beast), {fbA} "a Saiga", {fbThe}, {fbHabit},
// {fbLand}, {fbRegion}, {fbYield}, {fbCoin}
FB.fill = function (p, ctx, id) {
  const c = FB.byId[id]; if (!c) { ctx.skip = 1; return null; }
  const P = FB.home(p);
  ctx.beast = id; ctx.fbA = FB.a(id); ctx.fbThe = FB.the(id); ctx.fbHabit = c.habit || c.belief || 'It keeps to itself.';
  ctx.fbLand = FB.landName(FB.landOf(P) || c.lands[0]); ctx.fbRegion = FB.regionName(P && P.region || c.regions[0]).replace(/^The /, 'the ');
  ctx.fbYield = c.yield ? c.yield.what : 'nothing'; ctx.fbCoin = c.yield ? c.yield.coin : 0; ctx.fbBelief = c.belief || ''; ctx.fbTruth = c.truth || '';
  ctx.fbAc = A.cap(ctx.fbA); ctx.fbThec = A.cap(ctx.fbThe); ctx.fbGame = c.quarry || ctx.fbA;
  // the named one: the first still living, else the first; its note says how it died if it died in this game
  const nm = FB.NAMED.find(n => n.id === id && FB.nstate(n.key).alive) || FB.NAMED.find(n => n.id === id);
  if (nm) {
    const st = FB.nstate(nm.key);
    ctx.fbInd = nm.name.replace(/^The /, 'the '); ctx.fbIndc = A.cap(ctx.fbInd); ctx.fbIndKey = nm.key;
    ctx.fbIndNote = !st.alive && st.year ? `${st.gone ? 'taken away to' : 'killed by'} ${st.byName || 'hunters'} in ${st.year}, and still talked of` : nm.note;
  }
  return c;
};
FB.wpick = ids => A.wpick(ids, id => RW[FB.byId[id].rarity] || 1);

// ---- the release's beast list (A.beastsNear): a far province gets its own fighters; a far beast is never near a
// province of the Known World (76 lets an unmatched beast in by terrain word alone)
// 99-far-lands lets some Known World beasts run on into the far lands (FL.BEAST_LANDS); where the far land's own kin
// of that beast lives (the lore says "kin" of them), the kin takes its place.
FB.KIN = { 'CRE-34': ['CRE-70'], 'CRE-31': ['CRE-90'], 'CRE-45': ['CRE-182'], 'CRE-44': ['CRE-127', 'CRE-130', 'CRE-196', 'CRE-115', 'CRE-183'],
  'CRE-51': ['CRE-143'], 'CRE-49': ['CRE-114', 'CRE-100', 'CRE-108', 'CRE-146'], 'CRE-55': ['CRE-185'], 'CRE-35': ['CRE-180'] };
// 99 lets the Tiger of Ranpur (canon range E-13, E-12) run on into the Southern Peninsulas; the lore gives the
// peninsulas tigers of their own (the Twin Delta's mangrove tiger, the Southern Hills' and the White Head's next door),
// so in that land the Known World's tiger is not offered at all, kin or no kin in the province.
FB.DROP = { 'CRE-49': ['M'] };
const near0 = A.beastsNear;
A.beastsNear = function (pc) {
  const out = near0.apply(this, arguments);
  if (!FB.on()) return out;
  const kw = out.filter(id => !FB.byId[id]), P = FB.home(pc);
  if (!P || !FB.isFar(P)) return kw;
  const mine = FB.near(P).fight, L = FB.landOf(P);
  return kw.filter(id => !(FB.KIN[id] || []).some(k => mine.includes(k)) && !(FB.DROP[id] || []).includes(L)).concat(mine);
};

// ---- condition helpers for the scenes
A.C.fbFar = p => FB.on() && FB.isFar(FB.home(p));
A.C.fbNear = (p, id) => FB.here(p, id);
A.C.fbHas = (p, fam) => FB.has(p, fam);
A.C.fbLand = (p, ...L) => FB.on() && L.includes(FB.landOf(FB.home(p)));
A.C.fbAlive = (p, id) => FB.on() && !!FB.livingNamed(id);

// ---- the hunt: the far lands' own game for the pot, and their own tall tales for the famous hunt
const hunt = A.startHunt;
A.startHunt = function (pc) {
  const P = FB.on() ? FB.home(pc) : null, n = P && FB.near(P);
  if (!n || !n.quarry.length || !A.GAME_BEASTS) return hunt.apply(this, arguments);
  const t = P.terr, had = Object.prototype.hasOwnProperty.call(A.GAME_BEASTS, t), keep = A.GAME_BEASTS[t];
  A.GAME_BEASTS[t] = n.quarry.map(id => FB.byId[id].quarry);
  try { return hunt.apply(this, arguments); } finally { if (had) A.GAME_BEASTS[t] = keep; else delete A.GAME_BEASTS[t]; }
};
// the famous hunt's hoaxes (patch FB-HOAXES): in a far province its own legends, elsewhere the Known World's own
FB.hoaxes = function (pc) {
  if (!FB.on()) return null;
  const P = FB.home(pc), n = P && FB.near(P);
  const kw = LORE.creatures.filter(c => !c.far && /hoax|misunderstanding/.test(c.cat));
  if (!n) return kw;
  const mine = n.legend.map(id => LORE.creatures.find(c => c.id === id)).filter(c => c && /hoax|misunderstanding/.test(c.cat));
  return mine.length ? mine : kw;
};

// ---- the yield of a kill: hide, fur, ivory or horn, sold at the nearest market (engine side, at the duel's close)
const close = A.duelClose;
A.duelClose = function () {
  const q = A.S.queue[0], Dd = q && q.type === 'duel' ? q.d : null, pc = A.pc();
  const r = close.apply(this, arguments);
  try {
    const id = Dd && Dd.b && Dd.b.beast, c = id && FB.on() ? FB.byId[id] : null;
    if (c && c.yield && pc && pc.alive && Dd.result === 'win') {
      const coin = Math.max(1, Math.round(c.yield.coin * (Dd.party ? 0.5 : 1)));
      pc.coin += coin;
      pc.flags['fb_k_' + id] = A.S.year; pc.flags.fb_trophy = A.S.year;
      A.log(`You take the ${c.yield.what} of ${FB.the(id)}${Dd.party ? ' and share it with the hunters' : ''}: ${A.coin ? A.coin(coin) : coin + ' suns'} at the market.`, 'good');
    }
    // a named beast this fight was about (A.S.fbPend, set when the choice was taken): killed once, or got away
    let pend = A.S.fbPend;
    if (pend && A.S.year - (pend.y || 0) > 1) { delete A.S.fbPend; pend = null; }   // a fight not taken up (fled the titan's warning)
    if (pend && Dd && Dd.b && Dd.b.beast === pend.id) {
      delete A.S.fbPend;
      if (pc && pc.alive && Dd.result === 'win') FB.slay(pend.key, pc, !!Dd.party);
      else { const st = FB.nmut(pend.key); st.hunted = (st.hunted || 0) + 1; if (pc && pc.id === A.S.pc) A.log(`${A.cap(FB.nName(pend.key))} gets away. It will be talked of, and so will you.`, 'lore'); }
    }
  } catch (e) { console.error('far beasts duel', e); }
  return r;
};

// ---- sightings: the wilds are seen going about their business (about one a year), and a sighting counts as seen
const SIGHT = {
  grazer: ['grazing at the edge of {r}', 'crossing the track ahead at a trot', 'drinking at the ford at dusk'],
  cattle: ['standing in the reeds, watching you', 'grazing where the trees thin', 'crossing the track, unhurried'],
  cat: ['on a rock above the path, and then not', 'at the edge of the trees, tail moving', 'in the mud by the water: its tracks, fresh'],
  hound: ['trotting along a ridge, far off', 'circling the herd at dusk', 'calling across {r} at night'],
  bear: ['digging at a stump, its back to you', 'crossing the stream below the village', 'in the berry bushes, too close'],
  ape: ['in the canopy, watching', 'on the hillside, feeding', 'at the edge of the fields at first light'],
  titan: ['moving through the trees like weather', 'at the river, so big the bank looks small', 'far off, and the ground still shakes'],
  croc: ['lying on the bank like a log', 'sliding off a sandbar into the water', 'at the steps where the women wash'],
  bird: ['riding the wind over {r}', 'on a dead tree, watching the road', 'rising from the reeds all at once'],
  sea: ['rolling in the swell off the point', 'following the boats home', 'blowing beyond the reef'],
  seal: ['hauled out on the rocks', 'surfacing by the nets', 'in the shallows, watching the boats'],
  fish: ['rising in the shallows', 'turning silver under the boat', 'in the fishermen\'s baskets, still alive'],
  dragon: ['high over the peaks, a speck that is not an eagle', 'over the far ridge, with the herders running', 'circling the hot springs at noon'],
  serpent: ['across the path, warming itself', 'in the roof thatch of a barn', 'swimming the ditch with its head up'],
};
FB.sightLine = function (id, P, k) {
  const c = FB.byId[id], opts = SIGHT[c.kind] || SIGHT.grazer, r = FB.regionName(P.region).replace(/^The /, 'the ');
  return `You see ${FB.a(id)} ${opts[k % opts.length].replace('{r}', /^the /.test(r) ? r : 'the ' + r)}.`;
};
A.onMonth.push(pc => {
  if (!FB.on() || !pc || !pc.alive || !pc.flags || A.age(pc) < 5) return;
  const P = FB.home(pc), n = P && FB.near(P);
  if (!n || !n.sight.length || !A.chance(0.08)) return;
  const id = FB.wpick(n.sight), k = A.ri(0, 2);
  const BT = A.BT, was = BT ? BT.level(pc, id) : 0, S0 = A.S;
  if (BT && was < 2) pc.flags['bt_s_' + id] = A.S.year;
  // now and then it is the one with a name
  const nm = FB.livingNamed(id);
  if (nm && A.chance(0.3)) {
    const st = FB.nmut(nm.key); st.seen = (st.seen || 0) + 1; st.last = S0.year;
    if (pc.id === A.S.pc) A.log(`${FB.sightLine(id, P, k).replace(/\.$/, '')}, and the herders say it is ${FB.nName(nm.key)}.${BT && was < 2 ? ' (Codex: Bestiary)' : ''}`, 'lore');
    return;
  }
  if (pc.id === A.S.pc) A.log(FB.sightLine(id, P, k) + (BT && was < 2 ? ' (Codex: Bestiary)' : ''), 'lore');
});

// ---- Known World scenes that name a fixed beast of their own (a wolf pack in the hard winter, a hell boar in the
// lord's wood: `beast: { id: "CRE-21" }`, `beastId: "CRE-23"`, `ctx.beast = "CRE-21"`) are not rolled in a far
// province where that beast does not live, so an Evenwood wolf never turns up in the Deep Southland. Read from the
// scenes' own effects once, after the content has loaded; A.evFit (the roll's weight) is the gate, so no scene's
// cond is touched (A.evAudience reads cond as text). The Known World is untouched: the gate needs the far lands open.
let fixed = null;
FB.fixedScenes = function () {
  if (fixed) return fixed;
  fixed = {};
  const src = x => (typeof x === 'function' ? x.toString() : x ? JSON.stringify(x) : '');
  for (const id in A.EV) {
    const e = A.EV[id];
    if (id.slice(0, 3) === 'fb_' || e.trigger) continue;   // a trigger is queued by its caller, with the caller's beast
    const s = [src(e.setup)].concat((e.choices || []).map(c => src(c.fx) + src(c.win && c.win.fx) + src(c.lose && c.lose.fx))).join(' ');
    const ids = new Set();
    for (const m of s.matchAll(/(?:beast"?\s*:\s*\{\s*"?id"?\s*:|beastId"?\s*:|ctx\.beast\s*=)\s*["'](CRE-\d+)["']/g)) if (!FB.byId[m[1]]) ids.add(m[1]);
    if (ids.size) fixed[id] = [...ids];
  }
  return fixed;
};
if (typeof A.evFit === 'function') {
  const fit = A.evFit;
  A.evFit = function (e, pc) {
    const w = fit.apply(this, arguments);
    if (!(w > 0) || !FB.on() || !e || !pc) return w;
    const need = FB.fixedScenes()[e.id];
    if (!need) return w;
    const P = FB.home(pc);
    if (!P || !FB.isFar(P)) return w;
    const near = A.beastsNear(pc);
    return need.every(id => near.includes(id)) ? w : 0;
  };
}

// ---- the wilds come to you: random events are few in a year, and a far life spent at home would meet the land's
// beasts only by luck. A month with no beast scene for two years has a small chance to bring one (the scenes of
// beasts.events.js that fit, by their own weight, cooldown and once), so a decade holds a few of them.
FB.WILD = 0.035;
A.onMonth.push(pc => {
  if (!FB.on() || !pc || !pc.alive || !pc.flags || pc.prison || pc.id !== A.S.pc) return;
  const S = A.S, P = FB.home(pc);
  if (!P || !FB.isFar(P)) return;
  pc.flags.ev = pc.flags.ev || {}; S.evRecent = S.evRecent || {};
  let last = pc.flags.fb_wild != null ? pc.flags.fb_wild : -99;
  for (const k in pc.flags.ev) if (k.slice(0, 3) === 'fb_' && pc.flags.ev[k] > last) last = pc.flags.ev[k];
  if (S.year - last < 2 || !A.chance(FB.WILD)) return;
  const ok = [];
  for (const id in A.EV) {
    if (id.slice(0, 3) !== 'fb_') continue;
    const e = A.EV[id];
    if ((e.once && pc.flags.ev[id]) || (S.evRecent[id] && S.year - S.evRecent[id] < (e.cool || 6))) continue;
    let c = false; try { c = !e.cond || !!e.cond(pc, A.C); } catch (err) { c = false; }
    if (c) ok.push(e);
  }
  const e = ok.length ? A.wpick(ok, x => x.w || 1) : null;
  if (!e) return;
  pc.flags.fb_wild = S.year; S.evRecent[e.id] = S.year;
  A.queue({ type: 'event', ev: e.id, ctx: {} });
});

// ---- 26-belief-truth: what a far child has heard of, and what exploring teaches
const BT = A.BT;
if (BT && typeof BT.childHeard === 'function') {
  const heard = BT.childHeard;
  BT.childHeard = function (pc, c) {
    if (!FB.on() || !pc || !c) return heard.apply(this, arguments);
    const P = FB.home(pc), far = FB.byId[c.id], mine = FB.isFar(P);
    if (far) {
      if (!mine) return far.kind === 'dragon' || (far.tier === 'legend' && hash(pc.id + '|' + c.id) % 7 === 0);
      regions(); if (far.at.includes(P.region)) return true;
      // the land's great beasts and its tales, and a few more by family
      return far.lands.includes(P.region[0]) && (far.tier === 'titan' || far.tier === 'legend' || far.kind === 'dragon' || hash(pc.id + '|' + c.id) % 4 === 0);
    }
    if (mine) return /dragon|giant/i.test(c.cat || '') || hash(pc.id + '|' + c.id) % 9 === 0;
    return heard.apply(this, arguments);
  };
}
if (BT && typeof BT.pickCreature === 'function' && A.ACT && typeof A.ACT.explore === 'function') {
  const pick = BT.pickCreature, ex = A.ACT.explore;
  A.ACT.explore = function (pc) { FB._explore = pc; try { return ex.apply(this, arguments); } finally { FB._explore = null; } };
  if (ex.bt) A.ACT.explore.bt = true;
  BT.pickCreature = function (pc, test) {
    const P = FB.on() && FB._explore === pc ? FB.home(pc) : null;
    if (!P || !FB.isFar(P)) return pick.apply(this, arguments);
    const here = new Set(FB.near(P).all);
    return pick.call(this, pc, (l, c) => l === 0 && here.has(c.id));
  };
}

// ---- the named beasts: the Ash Mother of the Twin Teeth and the rest of the lore's 25 individuals, alive or dead in
// the game (A.S.fbNamed, made on first need; an old save has none and every one stands as the lore leaves it in 1105:
// the Man-Eater of the Nine Ridges and five more are already dead). Each is sighted, hunted and killed once; a death
// goes to the news and, at your hand, into your deeds (the chronicle, 26's tale as told) and the bestiary.
FB.NAMED = []; FB.NAMEDBY = {};
for (const c of D.list) c.inds.forEach((ind, i) => {
  const n = { key: c.id + '#' + i, id: c.id, name: ind.name, note: ind.note, dead0: /killed by|\btaken in\b|caught in|\bserved\b/i.test(ind.note) };
  FB.NAMED.push(n); FB.NAMEDBY[n.key] = n;
});
FB.nName = key => { const n = FB.NAMEDBY[key]; return n ? n.name.replace(/^The /, 'the ') : 'the beast'; };
// read only (rendering may call it): the stored record, or the lore's start
FB.nstate = key => { const S = A.S, s = S && S.fbNamed && S.fbNamed[key]; return s || { alive: !(FB.NAMEDBY[key] || {}).dead0, seen: 0, hunted: 0 }; };
// engine only: the record, made on first need
FB.nmut = key => { const S = A.S; S.fbNamed = S.fbNamed || {}; return S.fbNamed[key] || (S.fbNamed[key] = Object.assign({}, FB.nstate(key))); };
FB.livingNamed = id => !FB.on() ? null : FB.NAMED.find(n => n.id === id && FB.nstate(n.key).alive) || null;
FB.gone = function (key, where) { const st = FB.nmut(key); if (!st.alive) return; st.alive = false; st.year = A.S.year; st.byName = where; st.gone = true; };
FB.slay = function (key, pc, party) {
  const st = FB.nmut(key), n = FB.NAMEDBY[key]; if (!n || !st.alive) return;
  const who = pc ? A.fullName(pc) : 'hunters';
  st.alive = false; st.year = A.S.year; st.by = pc ? pc.id : null; st.byName = who;
  if (pc) {
    pc.flags.fb_slew = A.S.year; pc.fame += party ? 2 : 4;
    (pc.deeds = pc.deeds || []).push({ y: A.S.year, t: `Killed ${FB.nName(key)}${party ? ' with a hunting party' : ''}` });
    if (pc.id === A.S.pc) A.log(`${A.cap(FB.nName(key))} is dead. They will tell it at every fire in ${FB.landName(FB.byId[n.id].lands[0]).replace(/^The /, 'the ')}.`, 'good');
  }
  A.news(`${A.cap(FB.nName(key))} is dead, killed by ${who}.`, 'beast');
};
// the wilds go on without you: about one living named fighter in fifty a year falls to someone else's spear
A.onMonth.push(pc => {
  if (!FB.on() || !A.chance(0.02)) return;
  const live = FB.NAMED.filter(n => FB.byId[n.id].fight && FB.nstate(n.key).alive);
  if (!live.length || !A.chance(0.12)) return;
  const n = A.pick(live), st = FB.nmut(n.key), r = FB.regionName(FB.byId[n.id].regions[0]).replace(/^The /, 'the ');
  st.alive = false; st.year = A.S.year; st.by = null; st.byName = `the hunters of ${r}`;
  A.news(`${A.cap(FB.nName(n.key))} is dead, killed by the hunters of ${r}.`, 'beast');
});
// a choice about a named beast: it was seen; a fight with it is remembered until the duel closes. A choice marked
// fbSpare lets the scene's beast go (fb_spared, fb_sp_<id>), and a later scene brings it back.
const choose1 = A.eventChoose;
A.eventChoose = function (idx) {
  try {
    const q = A.S.queue[0], pc = A.pc();
    if (FB.on() && pc && q && q.type === 'event' && !q.result && q.ctx && q.view) {
      const e = A.EV[q.ev], vc = q.view.choices[idx], c = vc && e && e.choices ? e.choices[vc.i] : null;
      if (c && q.ctx.fbSeen && FB.NAMEDBY[q.ctx.fbSeen]) { const st = FB.nmut(q.ctx.fbSeen); st.seen = (st.seen || 0) + 1; st.last = A.S.year; }
      if (c && q.ctx.fbNamed && FB.NAMEDBY[q.ctx.fbNamed]) {
        const st = FB.nmut(q.ctx.fbNamed); st.seen = (st.seen || 0) + 1; st.last = A.S.year;
        const fx = c.fx;
        if (fx && typeof fx === 'object' && (fx.beast || fx.event === 'hunt_beast')) A.S.fbPend = { key: q.ctx.fbNamed, id: (fx.beast && fx.beast.id) || q.ctx.beast, y: A.S.year };
      }
      if (c && c.fbSpare && q.ctx.beast && FB.byId[q.ctx.beast]) { pc.flags.fb_spared = A.S.year; pc.flags['fb_sp_' + q.ctx.beast] = A.S.year; }
    }
  } catch (err) { console.error('far beasts choice', err); }
  return choose1.apply(this, arguments);
};
if (choose1.variety) A.eventChoose.variety = true;

// ---- Known World scenes whose beast is only a fallback ("… : 'CRE-21'" when nothing near fits): in a far province
// where that beast does not live the scene steps aside (its view is skipped, as a setup's ctx.skip does), so nobody
// meets an Evenwood wolf in the Deep Southland. Engine side: the view is built when the scene comes up.
const view1 = A.eventView;
A.eventView = function (q) {
  const fresh = !!q && !q.view;
  const v = view1.apply(this, arguments);
  try {
    const id = fresh && v && !v.skip && FB.on() && q.ctx ? q.ctx.beast : null;
    if (id && !FB.byId[id] && A.BEASTS[id]) {
      const pc = A.pc(), P = FB.home(pc);
      if (P && FB.isFar(P) && !A.beastsNear(pc).includes(id)) { q.ctx.skip = 1; v.skip = true; FB.stepped = (FB.stepped || 0) + 1; }
    }
  } catch (err) { console.error('far beasts view', err); }
  return v;
};

// ---- the bestiary's creature line (26-belief-truth's card calls BT.cardLine): id, land and regions, rarity; the tale
// once the truth is known. Only while the far lands are open; the Known World's bestiary is drawn as before. Pure.
const RAR = { common: ['t1', 'common'], uncommon: ['t2', 'uncommon'], rare: ['t3', 'rare'], unique: ['t5', 'one of a kind'], legend: ['t6', 'a tale'] };
const TALE = { true: 'the tale holds', rumoured: 'the beast is real; the tale is not', believed: 'no such beast', none: '' };
FB.css = '.fb-line{font-family:var(--f-ui,inherit);font-size:var(--t-cap,12px);color:var(--ink-3,inherit);font-variant-numeric:tabular-nums;letter-spacing:.02em;margin:2px 0 4px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
  '.fb-line .fb-id{font-weight:600;color:var(--ink-2,inherit)}.fb-line .chip{margin:0}';
FB.style = () => { if (typeof document === 'undefined' || document.getElementById('fb-style')) return; const s = document.createElement('style'); s.id = 'fb-style'; s.textContent = FB.css; document.head.appendChild(s); };
if (BT) BT.cardLine = function (c, L) {
  if (!FB.on() || !c) return '';
  FB.style();
  const far = FB.byId[c.id], esc = UI.esc;
  if (!far) return `<div class="fb-line"><span class="fb-id">${esc(c.id)}</span><span>· the Known World</span></div>`;
  const R = RAR[far.rarity] || RAR.common;
  const where = far.lands.map(FB.landName).join(', ');
  const tale = L >= 3 && TALE[far.tale] ? ` <span class="chip">${esc(TALE[far.tale])}</span>` : '';
  const yieldTxt = L >= 3 && far.yield ? ` <span>· yields ${esc(far.yield.what)}, about ${esc(String(far.yield.coin))} suns</span>` : '';
  const named = L >= 1 ? FB.NAMED.filter(n => n.id === far.id).map(n => {
    const st = FB.nstate(n.key);
    return `${n.name}: ${st.alive ? 'alive' + (st.seen ? `, seen ${st.seen} time${st.seen === 1 ? '' : 's'}` : '') + (st.hunted ? `, hunted ${st.hunted}` : '') : st.year ? `${st.gone ? 'taken away to' : 'killed by'} ${st.byName || 'hunters'} in ${st.year}` : n.note}`;
  }) : [];
  return `<div class="fb-line"><span class="fb-id">${esc(far.id)}</span><span>· ${esc(far.name)} · ${esc(where)}</span>` +
    ` <span class="chip tier ${R[0]}">${esc(R[1])}</span>${tale}${yieldTxt}</div>` +
    (named.length ? `<div class="small muted fb-named"><b>Known by name:</b> ${named.map(esc).join('; ')}</div>` : '');
};
// named beasts the lore knows, for the scenes ("{fbInd}")
FB.ind = id => { const c = FB.byId[id]; return c && c.inds.length ? c.inds[0] : null; };

// the scenes (*.events.js) and the bench count far encounters by these
FB.EVENT_PREFIX = 'fb_';
