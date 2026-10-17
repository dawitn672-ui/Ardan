// Live numbers (Road to Ten, Character 7: "Cut dead numbers. Any stat or skill that changes fewer than 5 outcomes in a
// typical bot life is cut or merged"). 49-body-mind merged nine skills and left six under the line: axe, unarmed, bow,
// sea, music and gambling. This file gives each of them the places in a life where its words already are:
//
//   1. RETAG  event checks whose words are about the skill, but which roll something else (dice rolled on wits, a shot
//             at a hart rolled on stealth, a pavane danced on persuasion). The check's skill is set from a hand-checked
//             list; each entry names the word it must find in the label, so a rewritten event is skipped, not mangled.
//   2. RIDE   choices with no roll whose words are the skill ("Sing along", "Play for fun, small stakes", "Knock him
//             down"). After the choice resolves, how good you are at it adds a line and a small effect (fx.knack).
//   3. ENGINE the work and the year: fists in a brawl, a trade's second skill (the farmer's axe, the hunter's bow, the
//             innkeeper's fists, the keeper's chant), the lament at a wake, dice in winter quarters, the butts on feast
//             days, the herring boats on the coast, a lord's autumn hunt, a crossing by sea to a gathering abroad and
//             the host's hunt there.
//
//   4. MERGE  axe, which even so has too few places in the lives bots lead, is read as the spear's family (Hafts).
//
// Every draw is engine code (A.chance, A.ri, A.rf); rendering reads nothing here. New fields: none on people; a
// gathering's g.pc.lnSea and g.pc.lnHunt (missing on an old save is the same as not yet asked). The trade notes are on
// GD.CAREERS (data). New effect key: fx.knack, declared in A.FX_EXTRA.
const LN = A.LN = A.LN || {};
LN.SIX = ['axe', 'unarmed', 'bow', 'sea', 'music', 'gambling'];
const isPC = p => !!(p && A.S && p.id === A.S.pc);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const adult = p => A.isAdult(p);
const old = p => A.stage && A.stage(p) === 'old';
const rank = p => (GD.STATUS && GD.STATUS[p.status] ? GD.STATUS[p.status].rank : 2);
const coastal = p => { const pr = A.prov(p.home); return !!(pr && pr.coast); };
// what each mechanism did, for the tests and the README (not game state)
LN.stats = { retag: 0, ride: {}, knack: {}, brawl: 0, duty: {}, wake: 0, camp: 0, butts: 0, boats: 0, hunt: 0, crossing: 0, wood: 0, gathHunt: 0 };
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

// ---- fx.knack: how good you are at the thing you just did --------------------------------------------------------------
// { k: skill, hi, lo, good: { r, fx }, poor: { r, fx } }: at hi or above the good line and effect, below lo the poor
// one, between them nothing extra. The skill is read every time (it decided that nothing extra happened).
(A.FX_EXTRA = A.FX_EXTRA || []).push('knack');
LN.knack = function (pc, spec, ctx) {
  if (!pc || !spec || !GD.SKILLS[spec.k]) return '';
  const v = A.skill(pc, spec.k);
  bump(LN.stats.knack, spec.k);
  const b = v >= (spec.hi != null ? spec.hi : 30) ? spec.good : v < (spec.lo != null ? spec.lo : 8) ? spec.poor : null;
  if (!b) return '';
  let extra = '';
  if (b.fx) { const r = A.applyFx(pc, b.fx, ctx || {}); if (typeof r === 'string') extra = r; }
  const toks = A.ctxTokens ? A.ctxTokens(pc, ctx || {}) : {};
  return ((b.r ? A.T(b.r, toks) : '') + (extra ? ' ' + extra : '')).trim();
};
const applyFx = A.applyFx;
A.applyFx = function (pc, fx, ctx) {
  // a realm custom met for the first time, kept in its scene (47-realm-bible's fx.custom 'keep'), reads its skill too
  if (fx && typeof fx === 'object' && fx.custom === 'keep' && ctx && LN.CUSTOM && LN.CUSTOM[ctx.cid] && isPC(pc)) {
    const a = applyFx.apply(this, arguments), b = LN.knack(pc, LN.CUSTOM[ctx.cid], ctx);
    return [typeof a === 'string' ? a : '', b].filter(Boolean).join(' ');
  }
  if (!fx || typeof fx !== 'object' || !fx.knack) return applyFx.apply(this, arguments);
  const rest = Object.assign({}, fx); delete rest.knack;
  const a = Object.keys(rest).length ? applyFx.call(this, pc, rest, ctx) : '';
  const b = LN.knack(pc, fx.knack, ctx);
  return [typeof a === 'string' ? a : '', b].filter(Boolean).join(' ');
};

// ---- 1. checks whose words name the skill ------------------------------------------------------------------------------
// [event, choice, word the label must hold, what to set, why]. Hand-checked against the label and the result text.
// Where the words also support a stat (wits at dice, an eye at the butts), the stat stays first and the skill goes
// second (40% of the check), so someone who never learned it loses at most about 15 points; where the old skill was the
// wrong one (trade for a bet, persuasion for a pavane), the skill replaces it.
// A choice that 48-fight-ladder routes through fighting worth is left alone (its odds come from the weapon in hand).
LN.RETAG = [
  ['tavern_dice', 0, /play/i, { s2: 'gambling' }, 'dice for money in the back room: wits, and the dice (was int/ins)'],
  ['camp_dice', 0, /^in$/i, { s2: 'gambling' }, 'soldiers throwing dice for their pay: wits, and the dice (was int/ins)'],
  ['dice_cheat', 0, /prove/i, { s2: 'gambling' }, 'you prove the bones honest by rolling them again and again: knowing how dice fall (was int/diplomacy)'],
  ['ch_fest_fair', 2, /cup-and-ball/i, { s2: 'gambling' }, 'the cup-and-ball man: a sharp eye, and knowing the game (was ins/int)'],
  ['rl_lu_seaopen', 2, /galley race/i, { s: 'gambling' }, 'a bet on a galley race: the odds, not the market (was trade/int)'],
  ['rl_ks_climb', 2, /bet/i, { s2: 'gambling' }, 'a bet on the climbers: reading the odds (was ins/trade)'],
  ['wk_hunt_poach', 0, /shot/i, { s: 'bow', s2: 'stealth' }, 'a shot at a hart at the forest edge (was stealth/survival)'],
  ['pf_bow_butts', 0, /loose/i, { s2: 'bow' }, 'drawing to the ear at the butts: an eye, and the bow (was ins/str)'],
  ['ch_peas_birds', 0, /sling/i, { s2: 'bow' }, 'the sling, which folds into the bow (49-body-mind): an eye, and the sling (was ins/spd)'],
  ['lf_serf_woods', 1, /deer/i, { s2: 'bow' }, 'a deer in the lord\'s wood is found by tracking and taken with a bow (was tracking/stealth)'],
  ['lf_ship_share', 1, /captain/i, { s2: 'sea' }, 'looking into a captain and his cog: a seaman knows a sound hull (was trade/intrigue)'],
  ['md_want_cold', 1, /gather/i, { s: 'axe' }, 'a week of firewood cut in the woods: the axe and the back (was survival/sta)'],
  ['gs_dance', 0, /dance/i, { s2: 'music' }, 'a pavane danced to the musicians\' measure (was etiquette/persuasion)'],
  ['festival_day', 0, /^dance$/i, { s2: 'music' }, 'dancing to the bonfire music (was spd/diplomacy)'],
  ['lf_harvest_dance', 2, /dance/i, { s: 'music' }, 'two dances to the pipes, one after the other: the measure and quick feet (was athletics/spd)'],
  ['rl_giant_chant', 0, /chant/i, { s2: 'music' }, 'chanting a line back in the deep voice: memory, and the voice (was int/wil)'],
];
LN.RETAGGED = [];   // { ev, i, before, after, why }
LN.labelOf = (e, i) => { const c = e && e.choices && e.choices[i]; return c ? (typeof c.t === 'function' ? '' : String(c.t || '')) : ''; };
LN.applyRetags = function () {
  for (const [ev, i, rx, set, why] of LN.RETAG) {
    const e = A.EV[ev], c = e && e.choices && e.choices[i];
    if (!c || !c.check || c.check.fight || c._ln || !rx.test(LN.labelOf(e, i))) continue;
    const before = { s: c.check.s, s2: c.check.s2 };
    c.check = Object.assign({}, c.check, set);
    c._ln = true;
    LN.RETAGGED.push({ ev, i, before, after: { s: c.check.s, s2: c.check.s2 }, why });
    LN.stats.retag++;
  }
};

// ---- 2. choices with no roll whose words are the skill -----------------------------------------------------------------
LN.KNACK = {
  sing: { k: 'music', hi: 30, lo: 8,
    good: { r: 'Your voice carries the verse, and people turn to see who it is.', fx: { happy: 2, fame: 1 } },
    poor: { r: 'You lose the tune in the second verse and mouth the rest.', fx: { happy: -1 } } },
  singWork: { k: 'music', hi: 30, lo: 8,
    good: { r: 'The carts come and go to your singing, and the hours with them.', fx: { perf: 1 } },
    poor: { r: 'Your voice gives out before noon. The dark is long after that.', fx: { happy: -1 } } },
  lullaby: { k: 'music', hi: 25, lo: 6,
    good: { r: 'The old cradle song does it. Asleep before the third verse.', fx: { them: { op: 3 } } },
    poor: { r: 'You know two lines of the cradle song and hum the rest. It takes an hour.', fx: { happy: -1 } } },
  dance: { k: 'music', hi: 25, lo: 6,
    good: { r: 'You keep time with the pipes, and the green sees it.', fx: { happy: 2 } },
    poor: { r: 'You are a beat behind the pipes all the way down the line.', fx: { happy: -1 } } },
  feastSongs: { k: 'music', hi: 30, lo: 8,
    good: { r: 'You lead the songs yourself, and {them} sings the last one with you at the gate.', fx: { them: { op: 4 } } },
    poor: { r: 'You leave the singing to others and fill the cups.', fx: {} } },
  paidSong: { k: 'music', hi: 40, lo: 15,
    good: { r: 'He pays the full purse and a little over, and asks for it again at Midwinter.', fx: { coin: 6 } },
    poor: { r: 'He pays, and winces at the high notes, and pays a little less than he said.', fx: { coin: -6 } } },
  diceSmall: { k: 'gambling', hi: 25, lo: 6,
    good: { r: 'You know the odds of every throw, and you stop while you are ahead.', fx: { coin: 3 } },
    poor: { r: 'You chase a bad throw with a worse one.', fx: { coin: -3 } } },
  diceWinter: { k: 'gambling', hi: 25, lo: 6,
    good: { r: 'You know when to pick up the dice and when to leave them. Some of the purse is still there in spring.', fx: { coinPct: 0.15 } },
    poor: { r: 'The men from the other boats know the dice better than you. The purse is lighter by Lantern Night.', fx: { coinPct: -0.1 } } },
  watchDice: { k: 'gambling', hi: 25, lo: 6,
    good: { r: 'You know the game well enough to see the weighted bone go in and out. The man who palmed it buys your silence.', fx: { coin: 2 } },
    poor: { r: 'You watch the dice go round and cannot see what anyone is doing.', fx: {} } },
  bet: { k: 'gambling', hi: 20, lo: 4,
    good: { r: 'You picked the side the old men picked, and they are never wrong.', fx: { coin: 3 } },
    poor: { r: 'You bet on the side with the loudest boys. That is not how to bet.', fx: { coin: -1 } } },
  knockDown: { k: 'unarmed', hi: 30, lo: 8,
    good: { r: 'One clean blow, from the hip. He sits down on the flagstones.', fx: { fame: 1 } },
    poor: { r: 'It takes three swings, and he lands one of his own first.', fx: { health: -4 } } },
  teachShoot: { k: 'bow', hi: 30, lo: 8,
    good: { r: 'You put three arrows in the mark while you show how, and after that you are listened to.', fx: { happy: 2 } },
    poor: { r: 'You miss the mark twice while you show how. It is a good lesson, for both of you.', fx: { happy: -1 } } },
};
// [event, choice, word the label must hold, knack]
LN.RIDE = [
  ['tavern_song', 0, /sing/i, 'sing'],
  ['wc_battle_song', 0, /sing/i, 'sing'],
  ['hs_name_mud', 3, /sing/i, 'sing'],
  ['rl_fh_whale', 1, /chant/i, 'sing'],
  ['ss_tm_opening', 2, /sing/i, 'sing'],
  ['pp_elf_silentnight', 2, /singing/i, 'sing'],
  ['mpf_song_lineage', 0, /sing/i, 'sing'],
  ['mpf_song_lie_grown', 0, /sing/i, 'sing'],
  ['mrb_zn_line', 0, /sing/i, 'sing'],
  ['mrb_zn_false_heard', 0, /sing/i, 'sing'],
  ['mpe_dw_verse_sung', 0, /sing/i, 'sing'],
  ['ch_peas_birds', 1, /sing/i, 'sing'],
  ['tr_mine_door', 2, /sing/i, 'singWork'],
  ['ch_fam_baby', 0, /sing/i, 'lullaby'],
  ['lf_harvest_dance', 0, /dance/i, 'dance'],
  ['lf_harvest_dance', 1, /dance/i, 'dance'],
  ['lf_friend_moves', 0, /feast/i, 'feastSongs'],
  ['wk_minstrel_song', 0, /sing/i, 'paidSong'],
  ['lf_dice_night', 1, /play/i, 'diceSmall'],
  ['wk_sea_payoff', 0, /dice/i, 'diceWinter'],
  ['lf_teen_ballgame', 2, /bet/i, 'bet'],
  ['av_road_dice', 2, /watch/i, 'watchDice'],
  ['ln_threshing_dice', 2, /watch/i, 'watchDice'],
  ['gs_drunk', 2, /knock/i, 'knockDown'],
  ['tr_bow_d_last_bow', 1, /shoot/i, 'teachShoot'],
  ['ch_elf_human_friend', 1, /shoot/i, 'teachShoot'],
];
LN.rides = {};       // 'ev#i' -> knack name, filled when the events are in and the label still says it
LN.applyRides = function () {
  for (const [ev, i, rx, k] of LN.RIDE) {
    const e = A.EV[ev], c = e && e.choices && e.choices[i];
    if (!c || c.check || c.group || !rx.test(LN.labelOf(e, i)) || !LN.KNACK[k]) continue;
    LN.rides[ev + '#' + i] = k;
  }
};

// ---- 3a. a crossing by sea to a gathering abroad (the scene that opens it) ---------------------------------------------
// The release's gatherings (weddings, coronations, summits) are held in a host's capital. When home and host are both on
// the coast and close enough to trade by sea (45-economy's rule), you go by ship: a poor seaman arrives green and loses
// a little standing at the opening; a good one arrives fresh.
LN.bySea = function (a, b) {
  if (!a || !b || a === b) return false;
  if (A.ECON && typeof A.ECON.road === 'function') { try { return !!A.ECON.road(a, b).sea; } catch (e) {} }
  const ra = A.realm(a), rb = A.realm(b);
  if (!ra || !rb || ra.capitalProv == null || rb.capitalProv == null || !A.wsDist) return false;
  const coast = r => A.S.prov.some(P => P.owner === r.id && P.coast);
  return coast(ra) && coast(rb) && A.wsDist(ra.capitalProv, rb.capitalProv) <= 2400;
};
LN.crossing = function (pc, ctx) {
  const g = ctx && ctx.gid != null && A.gathById ? A.gathById(ctx.gid) : null;
  if (!g || !g.pc || g.pc.lnSea != null) return '';
  const me = pc.ruler || pc.realm;
  g.pc.lnSea = LN.bySea(me, g.host) ? 1 : 0;
  if (!g.pc.lnSea) return '';
  LN.stats.crossing++;
  const v = A.skill(pc, 'sea'), sick = Math.round(A.rf(0, 7) * clamp(1 - v / 50, 0, 1));
  if (sick >= 4) { pc.health = Math.max(5, pc.health - sick); g.pc.inf = (g.pc.inf || 0) - 1; return 'The crossing is rough, and you come ashore green and shaking. It is a poor way to meet a court.'; }
  if (v >= 35) { g.pc.inf = (g.pc.inf || 0) + 1; return 'You spend the crossing on deck with the master and come ashore fresh, while the others are still being sick.'; }
  return sick ? 'A grey crossing. You keep your breakfast, just.' : '';
};

// ---- 3a'. the host's hunt at a gathering ------------------------------------------------------------------------------
// Between the feasts of a wedding, a coronation, a summit or a tournament the host rides out with hounds and guests
// (the guests' role, not the guard's or the servant's). A guest who brings down the stag is talked about at table: a
// point of standing at the gathering (g.pc.inf, which its closing reads for treaties and favour) and a little fame. A
// poor rider can come off in the chase.
LN.HUNT_KINDS = ['wedding', 'coronation', 'summit', 'tournament'];
LN.gathHunt = function (pc, ctx) {
  const g = ctx && ctx.gid != null && A.gathById ? A.gathById(ctx.gid) : null;
  if (!g || !g.pc || g.pc.lnHunt != null) return '';
  g.pc.lnHunt = LN.HUNT_KINDS.includes(g.kind) && ['ruler', 'envoy', 'noble', 'knight'].includes(g.pc.role) && adult(pc) && !old(pc) ? 1 : 0;
  if (!g.pc.lnHunt) return '';
  LN.stats.gathHunt = (LN.stats.gathHunt || 0) + 1;
  const bow = A.skill(pc, 'bow'), ride = A.skill(pc, 'riding');
  if (ride < 10 && A.chance(0.06)) { pc.health = Math.max(5, pc.health - A.ri(3, 8)); return 'At the host\'s hunt your horse refuses a ditch and you go over its head. You walk back.'; }
  if (A.chance(clamp(0.05 + (bow + ride * 0.5) / 150, 0.05, 0.6))) { g.pc.inf = (g.pc.inf || 0) + 1; A.fame(pc, 1); return 'At the host\'s hunt your arrow takes the stag before the hounds do, and it is talked about at supper.'; }
  return '';
};

// riders, the crossing and the hunt run after the release's choice, inside the same call
const choose = A.eventChoose;
A.eventChoose = function (idx) {
  const q = A.S && A.S.queue[0];
  let key = null, ga = false;
  try {
    if (q && q.type === 'event' && !q.result) {
      const v = A.eventView(q), c = v && v.choices && v.choices[idx];
      if (c && c.i >= 0) { key = q.ev + '#' + c.i; ga = q.ev === 'ga_open'; }
    }
  } catch (err) {}
  const r = choose.apply(this, arguments);
  try {
    const pc = A.pc();
    if (q && q.result && pc && pc.alive && key) {
      let line = '';
      if (LN.rides[key]) { line = A.applyFx(pc, { knack: LN.KNACK[LN.rides[key]] }, q.ctx || {}); bump(LN.stats.ride, key); }
      if (ga) line = [line, LN.crossing(pc, q.ctx || {}), LN.gathHunt(pc, q.ctx || {})].filter(Boolean).join(' ');
      if (line) { q.result.text = (String(q.result.text || '') + ' ' + line).trim(); A.log(line, ''); }
    }
  } catch (err) { console.error('live-numbers ride', err); }
  return r;
};
for (const k of Object.keys(choose)) A.eventChoose[k] = choose[k];

// ---- 3b. a brawl is fought with fists ----------------------------------------------------------------------------------
// The release starts a tavern or lane brawl (kind 'brawl', not lethal) with each fighter's own weapon in hand, so a
// knight brawls with his sword skill and nobody's fists are read. In a brawl both sides fight bare-handed; a brawl the
// event made lethal (a robbery gone wrong: "your victim draws steel") keeps its weapons.
const startDuel = A.startDuel;
A.startDuel = function (pc, foe, opts) {
  const o = opts || {};
  if (o.kind !== 'brawl' || o.lethal === true || o.armed || !pc || !foe || foe.beastId) return startDuel.apply(this, arguments);
  const keep = [];
  for (const p of [pc, foe]) if (p && p.gear) { keep.push([p, p.gear.weapon, p.gear.shield, p.gear.ranged]); p.gear.weapon = 'fists'; p.gear.shield = null; p.gear.ranged = null; }
  LN.stats.brawl++;
  try { return startDuel.apply(this, arguments); }
  finally { for (const [p, w, s, r] of keep) { p.gear.weapon = w; p.gear.shield = s; p.gear.ranged = r; } }
};
for (const k of Object.keys(startDuel)) A.startDuel[k] = startDuel[k];

// ---- 3b'. the grapple in a duel is wrestling ----------------------------------------------------------------------------
// The duel's "Close & grapple" ("get inside the reach and wrestle") weighs weight and strength and the weapon skill, and
// never the wrestling. When either fighter grapples, the better wrestler of the two takes up to 2 points of edge (the
// exchange is decided on 2d6 plus edge), named on the duel's line like the release's other edges.
LN.wrestle = f => { const p = f && !f.beast && f.pid != null ? A.P(f.pid) : null; return p && p.st ? A.skill(p, 'unarmed') : null; };
const situ = A.situEdges;
if (typeof situ === 'function') {
  A.situEdges = function (f, o, D, act) {
    const e = situ.apply(this, arguments);
    try {
      if (act === 'grapple' && Array.isArray(e)) {
        const w = LN.wrestle(f), v = LN.wrestle(o);
        if (w != null && v != null) {
          const d = clamp(Math.round((w - v) / 20), -2, 2);
          if (d > 0) e.push([d, 'a wrestler\'s grip']); else if (d < 0) e.push([d, 'outwrestled']);
        }
      }
    } catch (err) {}
    return e;
  };
}

// ---- 3c. a trade's second skill ----------------------------------------------------------------------------------------
// The release rates a year's work on one skill and one stat. Some trades lean on a second one; it moves the year's work
// rating a little (skill 60: about +6 on the target; skill 0: about -3), so it moves the pay and the next promotion.
LN.DUTY = {
  farm: { k: 'axe', why: 'fencing, clearing and the winter\'s wood' },
  labor: { k: 'axe', why: 'the woodyard and the hewing gang' },
  carpenter: { k: 'axe', why: 'the axe and the adze: a shipwright hews before he planes' },
  pirate: { k: 'axe', why: 'the boarding axe' },
  herd: { k: 'bow', why: 'the sling against wolves and foxes' },
  hunter: { k: 'bow', why: 'what the snare misses' },
  bowyer: { k: 'bow', why: 'proving each stave by shooting it' },
  brewer: { k: 'unarmed', why: 'keeping the peace in your own house' },
  thief: { k: 'gambling', why: 'the dice and the cards in the back room' },
  clergy: { k: 'music', why: 'the chant: a keeper leads the hymns' },
  courtier: { k: 'music', why: 'a song at the right table' },
  merchant: { k: 'sea', coast: true, why: 'cargo shipped by sea, when you trade from a port' },
};
// the trade's description says so (data, set once when the numbers are merged; see 4.)
LN.describe = function () {
  for (const c in LN.DUTY) {
    const C = GD.CAREERS[c], k = A.BM && A.BM.canon ? A.BM.canon(LN.DUTY[c].k) : LN.DUTY[c].k;
    if (C && C.desc && !C._ln) { C.desc = `${C.desc} Second skill: ${GD.SKILLS[k]}, for ${LN.DUTY[c].why}.`; C._ln = true; }
  }
};
LN.W = 0.15;          // work target per point of the second skill above 20
LN.dutyOf = function (pc) {
  const j = pc && pc.job, D = j && LN.DUTY[j.c];
  if (!D || (D.coast && !coastal(pc))) return null;
  return D;
};
const careerYear = A.careerYear;
A.careerYear = function (pc) {
  try {
    const D = isPC(pc) && LN.dutyOf(pc);
    if (D && pc.job && GD.CAREERS[pc.job.c]) {
      // careerYear moves the rating 35% of the way to its target; this is the same as adding d to the target
      const d = (A.skill(pc, D.k) - 20) * LN.W;
      pc.job.perf = clamp((pc.job.perf || 0) + d * 0.35 / 0.65, 0, 100);
      A.trainSkill(pc, D.k, 1);
      bump(LN.stats.duty, D.k);
    }
  } catch (err) { console.error('live-numbers duty', err); }
  const r = careerYear.apply(this, arguments);
  try { if (isPC(pc) && pc.alive) LN.year(pc); } catch (err) { console.error('live-numbers year', err); }
  return r;
};

// ---- 3d. the year: the butts, the boats, the hunt -----------------------------------------------------------------------
// Peoples who keep the bow (the release trains it for Ashmere's boys, the steppe and the elves): on feast days the grown
// shoot at the butts, a few pennies to the best and a fine for an idle bow. Ashmere's own custom (47-realm-bible,
// ash_butts) does the same in its years; this is for the others and for Ashmere in between.
LN.archer = p => p.race === 'elf' || p.race === 'orc' || p.cult === 'CUL-03' || (p.realm === 'POL-05' && p.sex === 'M');
LN.year = function (pc) {
  if (!adult(pc) || pc.prison || !pc.alive) return;
  const free = !(pc.flags && pc.flags.unfree);
  // the butts
  if (LN.archer(pc) && !old(pc) && !pc.mil && rank(pc) <= 4) {
    LN.stats.butts++;
    const v = A.skill(pc, 'bow');
    if (A.chance(clamp((v - 15) / 60, 0, 0.7))) { const g = A.ri(1, 4); pc.coin += g; if (v >= 45) A.fame(pc, 1); A.log(`At the butts on the feast days you shoot well enough to take ${A.coin(g)} off the others.`, 'good'); }
    else if (v < 6 && A.chance(0.5)) { pc.coin = Math.max(0, pc.coin - 1); A.log('The reeve fines you a penny: your bow hangs on its peg from one feast day to the next.', 'muted'); }
  }
  // the winter's wood: a household that does not pay a woodman fells and splits its own (the release's chores:
  // "You gather firewood until your arms ache"). A poor hand with an axe risks a foot; a good one has the pile to the eaves.
  if (rank(pc) <= 3 && pc.coin < 400 && !pc.mil && !old(pc)) {
    LN.stats.wood++;
    const v = A.skill(pc, 'axe');
    A.trainSkill(pc, 'axe', 0.5);
    if (v < 8 && A.chance(0.12)) { pc.health = Math.max(5, pc.health - A.ri(3, 7)); A.log('Splitting the winter\'s wood, the axe glances off a knot and into your boot.', 'bad'); }
    else if (v >= 30) A.applyFx(pc, { need: { comfort: 6 } }, {});
  }
  // the herring boats: a coastal commoner goes out with the boats in the season
  const j = pc.job && GD.CAREERS[pc.job.c];
  if (coastal(pc) && rank(pc) <= 3 && free && !pc.mil && !old(pc) && !(j && j.cat === 'sea') && (!j || ['land', 'town'].includes(j.cat))) {
    LN.stats.boats++;
    const v = A.skill(pc, 'sea');
    if (A.chance(0.06 * clamp(1 - v / 60, 0.1, 1))) {
      pc.health = Math.max(5, pc.health - A.ri(4, 10));
      A.log('In the herring season a squall swamps the boat you went out in. You are pulled out of the water half-drowned.', 'bad');
    } else {
      const g = Math.round(A.rf(1, 4) * (0.5 + v / 40));
      pc.coin += g; A.trainSkill(pc, 'sea', 1);
      if (v >= 30) A.log(`You take a share in the herring boats this season and come home with ${A.coin(g)}.`, 'good');
    }
  }
  // the autumn hunt: a lord rides out with hounds and bows
  if ((pc.noble || ['noble', 'royal', 'gentry'].includes(pc.status)) && !old(pc) && !pc.mil) {
    LN.stats.hunt++;
    const v = A.skill(pc, 'bow') + A.skill(pc, 'riding') * 0.5;
    if (A.chance(clamp(0.05 + v / 200, 0.05, 0.5))) {
      A.fame(pc, 1); pc.happy = clamp(pc.happy + 3, 0, 100);
      A.log('At the autumn hunt your arrow takes the hart before the hounds reach it. It is talked about at supper.', 'good');
    }
  }
};

// ---- 3e. dice in winter quarters ----------------------------------------------------------------------------------------
LN.camp = function (pc) {
  if (!pc.mil || !adult(pc) || pc.coin < 2) return 0;
  LN.stats.camp++;
  const v = A.skill(pc, 'gambling'), stake = clamp(Math.round(pc.coin * 0.03), 1, 40);
  A.trainSkill(pc, 'gambling', 0.5);
  if (A.chance(clamp(0.42 + (v - 20) / 250, 0.25, 0.65))) { pc.coin += stake; A.log(`In winter quarters the dice come out every night. You end the winter ${A.coin(stake)} up.`, 'muted'); return stake; }
  pc.coin = Math.max(0, pc.coin - stake); A.log(`In winter quarters the dice come out every night. You end the winter ${A.coin(stake)} down.`, 'muted'); return -stake;
};
const milYear = A.milYear;
if (typeof milYear === 'function') {
  A.milYear = function (pc) {
    const r = milYear.apply(this, arguments);
    try { if (isPC(pc) && pc.alive) LN.camp(pc); } catch (err) { console.error('live-numbers camp', err); }
    return r;
  };
}

// ---- 3f. the lament at a wake ------------------------------------------------------------------------------------------
// The release takes a fixed share of happiness when someone close dies (a child 35, a spouse 30 ... a friend 6). At the
// wake the old lament is sung; someone who can sing it gets back up to two fifths of that.
LN.GRIEF = { mother: 25, father: 22, spouse: 30, child: 35, sibling: 15, bestfriend: 15, lover: 15, grandparent: 8, friend: 6 };
LN.wake = function (pc, p, t) {
  LN.stats.wake++;
  const v = A.skill(pc, 'music'), back = Math.round((LN.GRIEF[t] || 0) * Math.min(0.4, v / 150));
  if (back > 0) pc.happy = clamp(pc.happy + back, 0, 100);
  A.trainSkill(pc, 'music', 0.5);
  if (v >= 25) A.log(`At the wake for ${p.given} you sing the old lament through, and the room sings the last verse with you. It helps.`, 'muted');
  return back;
};
const familyYear = A.familyYear;
A.familyYear = function (pc) {
  if (!isPC(pc)) return familyYear.apply(this, arguments);
  const close = [];
  try { for (const id in pc.rel) { const p = A.P(id), t = pc.rel[id] && pc.rel[id].type; if (p && p.alive && LN.GRIEF[t]) close.push([p, t]); } } catch (err) {}
  const r = familyYear.apply(this, arguments);
  try { for (const [p, t] of close) if (!p.alive && pc.alive) LN.wake(pc, p, t); } catch (err) { console.error('live-numbers wake', err); }
  return r;
};

// ---- 3g. the feast-day butts of Ashmere's custom (47-realm-bible) --------------------------------------------------------
// ash_draw (the draw at seventeen) and ash_butts, which sends someone from each household to shoot "and the reeve notes who still reaches the far one": the custom
// applied in its years now reads the bow.
LN.CUSTOM = {
  ash_draw: { k: 'bow', hi: 25, lo: 6,
    good: { r: 'Your arrow reaches the far butt with a yard to spare. The reeve writes your name with a flourish.', fx: { fame: 1 } },
    poor: { r: 'Your arrow drops well short. The reeve writes you down all the same, and the green remembers.', fx: { honor: -1 } } },
  ash_butts: { k: 'bow', hi: 30, lo: 8,
    good: { r: 'You reach the far butt every end, and the reeve writes your name first.', fx: { fame: 1 } },
    poor: { r: 'Your arrows drop short of the far butt, and the reeve writes that down too.', fx: { honor: -1 } } },
};
const wrapBible = function () {
  const B = A.BIBLE;
  if (!B || typeof B.hit !== 'function' || B.hit._ln) return;
  const hit = B.hit;
  B.hit = function (pc, c) {
    const r = hit.apply(this, arguments);
    try {
      const K = c && LN.CUSTOM[c.id];
      if (K && r === 'log' && isPC(pc) && pc.alive) { const line = A.applyFx(pc, { knack: K }, {}); if (line) A.log(line, 'muted'); }
    } catch (err) { console.error('live-numbers custom', err); }
    return r;
  };
  B.hit._ln = true;
};
wrapBible();

// ---- 4. axe and spear are one number for the player: Hafts ------------------------------------------------------------
// Measured (README): with every hook above, axe still changes 2 outcomes in the median bot life. Its places are real but
// narrow (the wood axe, the farmer's and carpenter's year, a commoner's cudgel), and the lives the bots lead, which rise
// into office, trade and command, rarely fight. Spear sits at 4 for the same reason. A cudgel, a wood axe, a staff and a
// spear are the common man's weapons, and the release already files the staff under spear and the club under axe; a
// bill or a halberd is both at once. So, as 49-body-mind did for the blades and the bows, the player's axe is read and
// trained as the spear's family, shown as one row, and an old save's higher number folds in. NPCs keep both numbers, so
// troops, duels between other people and the war layer are as they were.
LN.MERGE = { axe: 'spear' };
LN.merge = function () {
  const BM = A.BM;
  if (!BM || !BM.MERGE) return false;
  Object.assign(BM.MERGE, LN.MERGE);
  if (BM.MERGED_NAME) BM.MERGED_NAME.spear = 'Hafts: axe, mace & spear';
  if (BM.MERGED_DESC) BM.MERGED_DESC.spear = 'Axes, maces, cudgels, spears, staves and bills: anything swung or thrust on a haft.';
  GD.SKILLS.spear = 'Hafts: axe, mace & spear';
  if (GD.SKILL_DESC) GD.SKILL_DESC.spear = 'Axes, maces, cudgels, spears, staves and bills: anything swung or thrust on a haft.';
  return true;
};
LN.merged = LN.merge();

// ---- when the content is in --------------------------------------------------------------------------------------------
LN.onContent = function () { LN.describe(); LN.applyRetags(); LN.applyRides(); wrapBible(); };
LN.onContent();
if (typeof window !== 'undefined') window.addEventListener('ardan-content', () => LN.onContent());
