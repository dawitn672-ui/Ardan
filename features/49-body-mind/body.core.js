// Health as a body (Road to Ten, Character 4). The release kept 20 wounds in a list and struck a disease as one
// damage roll at the new year. Now:
//  - every wound sits on a part of the body (head, arms, hands, body, legs). A fresh wound hampers what that part does
//    (a broken arm costs the blade and the hammer, a bad leg the climb and the chase) until it mends; care decides
//    how soon it mends and whether it festers into something that stays;
//  - an illness lasts months: it strikes, then takes its toll month by month, costs free time and rest while it runs,
//    and ends in recovery or a mark. Treatment is a choice with a price: a physician (a fee; good for the flux, but he
//    bleeds a fever), herbs (cheap, if you or the wise woman know them), prayer (piety and comfort more than cure), or
//    bed (time and work lost). Your own medicine shortens every illness;
//  - each stat fades with age on its own clock: a person's speed may start to go at 41 and their strength at 49, and
//    the log says when each one turns. The profile shows the body, the illness and each stat's peak and decline.
// Engine side: the disease roll (patched in A.bodyYear), the month hook and the fx keys change state; rendering only
// reads it. New fields (pc.ill, pc.bmPeak, pc.bmFade, a wound's part and mend day) are optional: an old save loads.
(function () {
  const BM = A.BM = A.BM || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isPC = p => p && A.S && p.id === A.S.pc;

  // ---- parts of the body
  BM.PARTS = ['head', 'arms', 'hands', 'torso', 'legs'];
  BM.PART_NAME = { head: 'Head', arms: 'Arms', hands: 'Hands', torso: 'Body', legs: 'Legs' };
  // where each wound sits; the ones that can land anywhere are placed when they happen
  const PART = { scar_face: 'head', lost_eye: 'head', concussion: 'head', broken_nose: 'head', ear: 'head', brand: 'head',
    scar_arm: 'arms', lost_fingers: 'hands', lost_hand: 'hands', limp: 'legs', bad_knee: 'legs', frostbite: 'legs',
    scar_chest: 'torso', broken_ribs: 'torso', lungs: 'torso', back: 'torso' };
  BM.ANYWHERE = { deep_cut: ['arms', 'legs', 'torso', 'hands'], arrow_wound: ['arms', 'legs', 'torso'], burn: ['arms', 'hands', 'torso', 'head'], bite: ['arms', 'legs', 'hands'] };
  // new wounds: two breaks that mend in a year, and what a break or a cut becomes when it is not cared for
  Object.assign(GD.WOUNDS, {
    broken_arm: { name: 'Broken arm, splinted', fx: { str: -5 }, years: 1 },
    broken_leg: { name: 'Broken leg, splinted', fx: { spd: -8, sta: -2 }, years: 1 },
    crooked_arm: { name: 'An arm that knit crooked', fx: { str: -3 }, perm: true, skillPen: { sword: -6, axe: -4, bow: -8, craft: -6 } },
    stiff_hand: { name: 'Stiff fingers from a wound gone bad', fx: {}, perm: true, skillPen: { craft: -8, music: -10, sword: -4, bow: -6, medicine: -4 } },
  });
  Object.assign(PART, { broken_arm: 'arms', broken_leg: 'legs', crooked_arm: 'arms', stiff_hand: 'hands' });
  for (const k in PART) if (GD.WOUNDS[k]) GD.WOUNDS[k].part = PART[k];
  // what a lasting wound costs besides its stats (the release had this only for fingers and a hand)
  const PEN = { lost_eye: { bow: -15, throwing: -10, tracking: -6 }, limp: { athletics: -12, stealth: -6 }, bad_knee: { athletics: -10, riding: -4 },
    back: { husbandry: -8, craft: -6, athletics: -6 }, lungs: { athletics: -8, music: -6 }, frostbite: { athletics: -4 } };
  for (const k in PEN) if (GD.WOUNDS[k]) GD.WOUNDS[k].skillPen = Object.assign({}, GD.WOUNDS[k].skillPen || {}, PEN[k]);
  // what a fresh (not yet mended) wound on a part hampers
  BM.PART_SK = {
    head: { learning: -6, medicine: -6, tactics: -6, intrigue: -4, trade: -4 },
    arms: { sword: -8, axe: -8, spear: -8, shield: -8, bow: -8, unarmed: -6, craft: -6, husbandry: -6 },
    hands: { craft: -10, music: -8, sword: -6, dagger: -6, bow: -8, medicine: -4, gambling: -4 },
    torso: { athletics: -6, unarmed: -6, husbandry: -4, sea: -4 },
    legs: { athletics: -10, stealth: -6, riding: -4, survival: -4 },
  };
  BM.partOf = w => (w && (w.part || (GD.WOUNDS[w.k] || {}).part)) || 'torso';
  // a wound is fresh until it mends: care sets the mend day; left alone it mends when it heals
  BM.fresh = (w, day) => !!(w && w.until && (w.mend == null || w.mend > (day == null ? A.absDay() : day)));
  BM.partPen = function (p, k) {
    let v = 0; if (!p.wounds || !p.wounds.length) return 0;
    const day = A.absDay();
    for (const w of p.wounds) if (BM.fresh(w, day)) { const P = BM.PART_SK[BM.partOf(w)]; if (P && P[k]) v += P[k]; }
    return v;
  };
  const skill = A.skill;
  A.skill = function (p, k) {
    const v = skill.apply(this, arguments);
    if (!p || !p.wounds || !p.wounds.length) return v;
    const pen = BM.partPen(p, k);
    return pen ? clamp(v + pen, 0, 100) : v;
  };
  // a new wound lands on a part; a serious fresh one on the player asks how it is cared for (at most once a year)
  BM.SERIOUS = new Set(['broken_ribs', 'deep_cut', 'arrow_wound', 'concussion', 'broken_arm', 'broken_leg']);
  const addWound = A.addWound;
  A.addWound = function (p, k) {
    const n0 = p && p.wounds ? p.wounds.length : 0;
    const r = addWound.apply(this, arguments);
    try {
      if (r && p.wounds.length > n0) {
        const w = p.wounds[p.wounds.length - 1];
        if (BM.ANYWHERE[k]) w.part = A.pick(BM.ANYWHERE[k]);
        if (isPC(p) && BM.SERIOUS.has(k) && A.age(p) >= 6 && (p.flags.bm_wcare || 0) < A.S.year && A.EV.bm_wound_care) {
          p.flags.bm_wcare = A.S.year;
          A.queue({ type: 'event', ev: 'bm_wound_care', forced: true, now: true, ctx: { wound: (GD.WOUNDS[k].name || k).toLowerCase(), part: BM.PART_NAME[BM.partOf(w)].toLowerCase(), wk: k, wi: p.wounds.length - 1 } });
        }
      }
    } catch (e) { console.error('body wound', e); }
    return r;
  };
  // care of a wound (fx.care): how soon it mends, and whether it festers
  const FESTER = { arms: 'crooked_arm', hands: 'stiff_hand', legs: 'limp', torso: 'scar_chest', head: 'scar_face' };
  BM.CARE = {
    surgeon: { mend: 45, fester: 0.04 }, herbs: { mend: 75, fester: 0.08 }, herbs_bad: { mend: 200, fester: 0.45 },
    prayer: { mend: 150, fester: 0.15 }, bind: { mend: null, fester: 0.3 },
  };
  BM.care = function (pc, how, ctx) {
    const C = BM.CARE[how]; if (!C || !pc) return '';
    const w = pc.wounds[ctx && ctx.wi] && pc.wounds[ctx.wi].k === (ctx && ctx.wk) ? pc.wounds[ctx.wi] : pc.wounds.slice().reverse().find(x => BM.SERIOUS.has(x.k) && x.until);
    if (!w) return '';
    if (C.mend != null) w.mend = A.absDay() + C.mend;
    w.care = how;
    if (A.chance(C.fester)) {
      pc.health = clamp(pc.health - A.ri(8, 16), 0, A.maxHealth(pc)); pc.lastHurt = 'a wound gone bad'; pc._lhDay = A.absDay();
      w.mend = A.absDay() + 240;
      const part = BM.partOf(w);
      if (A.chance(0.45)) { const n = A.addWound(pc, FESTER[part] || 'scar_chest'); if (n) return `The wound festers. When the fever goes it leaves you with this: ${n.toLowerCase()}.`; }
      return 'The wound festers, and the fever from it is worse than the wound.';
    }
    return '';
  };

  // ---- illness that lasts months
  BM.LEN = { cough: [1, 2], flux: [2, 3], marsh: [3, 5], camp: [2, 4], lung: [3, 5], spotted: [2, 4], pox: [3, 6] };
  BM.FEVER = new Set(['marsh', 'camp', 'lung', 'spotted', 'pox']);
  // what each treatment does: months (x), the toll still to come (x), a cost to health now, the chance of a lasting mark
  BM.TREAT = {
    physician: { m: 0.6, dmg: 0.55, now: 0, mark: 0.6 },                // the flux and the cough: he knows these
    physician_fever: { m: 0.75, dmg: 0.95, now: 8, mark: 1 },          // a fever: he bleeds you, and it is shorter for it
    herbs: { m: 0.75, dmg: 0.7, now: 0, mark: 0.8 },
    herbs_bad: { m: 1.35, dmg: 1.1, now: 5, mark: 1.2 },
    prayer: { m: 1, dmg: 0.9, now: 0, mark: 1 },
    rest: { m: 0.85, dmg: 0.75, now: 0, mark: 0.8 },
    none: { m: 1, dmg: 1, now: 0, mark: 1 },
  };
  BM.TREAT_NAME = { physician: 'a physician', physician_fever: 'a physician', herbs: 'herbs', herbs_bad: 'the wrong herbs', prayer: 'prayer', rest: 'bed rest', none: 'nothing' };
  // "the marsh fever", "a winter cough", "the Harbor Pox"
  BM.the = n => /^(a|an|the) /i.test(n) ? n : 'the ' + n;
  // the onset: called from A.bodyYear in place of the release's one blow. Returns true when it has dealt with it.
  A.bmFallIll = function (pc, k, D, dmg, mh) {
    if (!isPC(pc) || !D) return false;
    if (pc.ill && pc.ill.m > 0) {   // a second sickness on a sick body: the first one drags on, and worse
      pc.ill.m += 1; pc.ill.dmg += Math.round(dmg * 0.5);
      A.log(`On top of ${BM.the(pc.ill.name)}, ${D.name}. It sets you back.`, 'bad');
      return true;
    }
    const len = BM.LEN[k] || [2, 3], m = A.ri(len[0], len[1]), first = Math.round(dmg * 0.35);
    pc.health = clamp(pc.health - first, 0, mh); pc.lastHurt = D.name; pc._lhDay = A.absDay();
    pc.ill = { k, name: D.name, m, tot: m, dmg: Math.max(0, Math.round(dmg - first)), t: '', y: A.S.year };
    A.log(`You fall ill with ${D.name}. It will not be quick: ${m} month${m > 1 ? 's' : ''}, perhaps more.` + (pc.health < 30 ? ' For a while the priests are sent for.' : ''), 'bad');
    if (A.age(pc) >= 4 && A.EV.bm_ill) { pc.ill.ask = 1; const t = BM.the(D.name); A.queue({ type: 'event', ev: 'bm_ill', forced: true, now: true, ctx: { ill: D.name, illThe: t[0].toUpperCase() + t.slice(1) } }); }
    else pc.ill.t = 'rest';   // a small child is put to bed
    return true;
  };
  // fx.treat: the treatment chosen
  BM.treat = function (pc, how) {
    const I = pc && pc.ill; if (!I || I.m <= 0 || I.t) return '';
    if (how === 'physician' && BM.FEVER.has(I.k)) how = 'physician_fever';
    const T = BM.TREAT[how]; if (!T) return '';
    I.t = how; I.m = Math.max(1, Math.round(I.m * T.m)); I.dmg = Math.round(I.dmg * T.dmg * (how === 'prayer' && A.has(pc, 'zealous') ? 0.85 : 1));
    if (T.now) { pc.health = clamp(pc.health - T.now, 0, A.maxHealth(pc)); pc.lastHurt = I.name; pc._lhDay = A.absDay(); }
    if (how === 'rest') { A.S.time = Math.max(0, (A.S.time || 0) - 1.5); if (pc.job) pc.job.perf = Math.max(0, (pc.job.perf || 50) - 6); }   // bed costs the days and the work
    return how === 'physician_fever' ? 'He opens a vein for the fever. You are weaker for it, and it is shorter.' : '';
  };
  // a month of illness: its toll, less what you know of medicine yourself; it costs free time and rest
  A.bmIllMonth = function (pc) {
    const I = pc.ill; if (!I) return;
    if (!(I.m > 0)) { delete pc.ill; return; }
    // the course waits on the choice of treatment, up to three months (the scene comes at once: `now` keeps A.yearTurn from spreading it over the year)
    if (I.ask && !I.t && (I.wait || 0) < 3) { I.wait = (I.wait || 0) + 1; return; }
    const D = GD.DISEASES[I.k] || { name: I.name }, med = A.skill(pc, 'medicine');
    const hit = I.dmg / I.m * (1 - Math.min(0.3, med / 300));
    I.dmg = Math.max(0, I.dmg - I.dmg / I.m); I.m -= 1;
    pc.health = clamp(pc.health - hit, 0, A.maxHealth(pc)); pc.lastHurt = D.name; pc._lhDay = A.absDay();
    A.S.time = Math.max(0, (A.S.time || 0) - 0.35);
    if (A.MOODS) A.MOODS.touch(pc, { rest: -12, comfort: -5 });
    if (I.m <= 0) {
      const T = BM.TREAT[I.t || 'none'] || BM.TREAT.none;
      delete pc.ill;
      if (pc.health > 0) {
        const t = BM.the(D.name);
        A.log(`${t[0].toUpperCase() + t.slice(1)} lets go of you at last${I.t ? `, after ${BM.TREAT_NAME[I.t]}` : ''}.`, 'good');
        if (D.wound && A.chance(0.25 * T.mark)) { const w = A.addWound(pc, D.wound); w && A.log(`It leaves its mark: ${w}.`, 'bad'); }
      }
    }
  };
  A.onMonth.push(pc => { if (pc && pc.alive && pc.ill) A.bmIllMonth(pc); });
  // the release's own physician and rest work on an illness too
  const doAct = A.doActivity;
  A.doActivity = function (key) {
    const pc = A.pc(), I = pc && pc.ill;
    const r = doAct.apply(this, arguments);
    try { if (I && r && r.ok !== false) { if (key === 'heal' && !I.t) BM.treat(pc, 'physician'); else if (key === 'rest') I.dmg = Math.round(I.dmg * 0.9); } } catch (e) {}
    return r;
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('treat', 'care');
  const apply = A.applyFx;
  A.applyFx = function (pc, fx, ctx) {
    const r = apply.apply(this, arguments);
    if (!fx || typeof fx !== 'object') return r;
    let extra = '';
    try {
      if (fx.treat) extra += BM.treat(pc, fx.treat);
      if (fx.care) extra += BM.care(pc, fx.care, ctx);
    } catch (e) { console.error('body fx', e); }
    return extra ? ((typeof r === 'string' ? r + ' ' : '') + extra).trim() : r;
  };

  // ---- a hurt body is sent home from the yard
  // The release let you spar at 3 health: each bout cost up to 18, the floor was 3, and a life that sparred every month
  // lived at single-digit health until the next cold killed it (bench/dominance.mjs: 6 of 6 dead by a median 24).
  // Now the activities that risk a hurt are refused below a health line, with the reason shown, and a practice bout
  // never takes you below a floor.
  BM.HURT_LINE = 35;
  BM.RISKY = new Set(['spar', 'train_yard', 'tournament', 'hunt', 'beast_hunt', 'explore', 'duel', 'school', 'bm_bloods']);
  BM.SPAR_FLOOR = 35;
  const can = A.canAct;
  A.canAct = function (key) {
    const pc = A.pc();
    if (pc && pc.alive && BM.RISKY.has(key) && GD.ACTIVITIES[key] && pc.health < BM.HURT_LINE) {
      const r = can.apply(this, arguments);
      if (!r[0] && /Too young|Too old/.test(r[1] || '')) return r;   // what the age rules say comes first
      return [false, key === 'spar' || key === 'train_yard' || key === 'school' ? `The yard master sends you home: health ${Math.round(pc.health)}, come back at ${BM.HURT_LINE}` : `Too hurt for that: health ${Math.round(pc.health)}, rest to ${BM.HURT_LINE} first`];
    }
    return can.apply(this, arguments);
  };
  const dc = A.duelConsequences;
  A.duelConsequences = function (D) {
    const pc = A.pc(), h0 = pc ? pc.health : 0;
    const r = dc.apply(this, arguments);
    try { if (pc && D && (D.kind === 'spar' || D.kind === 'tourney') && pc.health < h0) pc.health = Math.max(pc.health, Math.min(h0, BM.SPAR_FLOOR)); } catch (e) {}
    return r;
  };

  // ---- each stat fades on its own clock
  // a person's own offset for each stat, from their id: the same every time, and no draw
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10007) / 10006; };
  BM.SPREAD = 0.13;   // of the race's old age: a human's stats each start to go within about 6 years of the usual age
  const shiftCache = new Map();
  BM.shift = (p, s) => {
    const key = p.id + ':' + s;
    let v = shiftCache.get(key);
    if (v == null) { v = (hash(key) * 2 - 1); if (shiftCache.size > 50000) shiftCache.clear(); shiftCache.set(key, v); }
    return v;
  };
  const K = { str: 1, spd: 1.2, sta: 1, ins: 0.5 };
  BM.oldOf = p => { const R2 = GD.RACES[p.race], b = A.bloodDef(p); let old = R2.old; if (b && b.lifeMul && p.blood.show) old *= b.lifeMul[p.sex] || 1; return old; };
  // the age at which stat s starts to fade for this person
  BM.fadeStart = (p, s) => {
    const old = BM.oldOf(p), sh = BM.shift(p, s) * BM.SPREAD * old;
    if (s === 'wil') return Infinity;
    return (s === 'int' ? old * 1.15 : old * 0.85) + sh;
  };
  // the same curve as the release's A.ageFactor, started at the person's own age for each stat; care in old age
  // (pc.bmCare years) holds it back
  BM.factorAt = function (p, s, age) {
    if (s === 'wil' || !GD.RACES[p.race]) return 1;
    const R2 = GD.RACES[p.race], old = BM.oldOf(p), start = BM.fadeStart(p, s), a = age - (p.bmCare || 0);
    if (s === 'int') return a > start ? Math.max(0.6, 1 - (a - start) / (R2.maxLife * 0.6)) : 1;
    if (a < start) return 1;
    return Math.max(0.35, 1 - (K[s] || 1) * (a - start) / (R2.maxLife - old * 0.85) * 0.8);
  };
  A.ageFactor = function (p, s) { return BM.factorAt(p, s, A.age(p)); };
  // the month: note each stat's peak, and the year each one turns
  const FADE = {
    str: 'Your arms are not what they were. Strength has begun to leave you',
    spd: 'You are slower off the mark than you were. Speed has begun to go',
    sta: 'You tire sooner, and stay tired. Stamina has begun to fade',
    ins: 'A beat late, now and then, in a scuffle. Your instincts have begun to dull',
    int: 'Names slip from you, and sums take longer. Your mind has begun to tire',
  };
  A.onMonth.push(pc => {
    if (!pc || !pc.alive) return;
    const age = A.age(pc), pk = pc.bmPeak = pc.bmPeak && typeof pc.bmPeak === 'object' ? pc.bmPeak : {};
    for (const s of GD.STATS) {
      const v = Math.round((pc.st[s] || 0) * A.ageFactor(pc, s));
      if (!pk[s] || v > pk[s][0]) pk[s] = [v, age];
    }
    if (A.isAdult(pc)) {
      const fd = pc.bmFade = pc.bmFade && typeof pc.bmFade === 'object' ? pc.bmFade : {};
      for (const s in FADE) if (!fd[s] && BM.factorAt(pc, s, age) < 0.985) { fd[s] = A.S.year; A.log(`${FADE[s]}, at ${age}.`, 'warn'); }
    }
  });

  // ---- what the profile shows
  // the body: each part, what is on it, and the illness; pure
  BM.body = function (p) {
    const out = {}; for (const k of BM.PARTS) out[k] = [];
    const day = A.absDay();
    for (const w of p.wounds || []) {
      const W = GD.WOUNDS[w.k]; if (!W) continue;
      const fx = Object.entries(W.fx || {}).map(([s, v]) => `${v > 0 ? '+' : '−'}${Math.abs(v)} ${(GD.STAT_NAMES[s] || s).toLowerCase()}`);
      const sg = v => (v < 0 ? '−' : '+') + Math.abs(v);
      const pen = Object.entries(Object.assign({}, W.skillPen || {})).map(([s, v]) => `${GD.SKILLS[s] || s} ${sg(v)}`);
      if (BM.fresh(w, day)) for (const [s, v] of Object.entries(BM.PART_SK[BM.partOf(w)] || {})) pen.push(`${GD.SKILLS[s] || s} ${sg(v)}`);
      out[BM.partOf(w)].push({ k: w.k, name: W.name, fresh: BM.fresh(w, day), until: w.until || 0, lasting: !w.until, fx: fx.concat(pen.slice(0, 4)) });
    }
    return out;
  };
  BM.curve = function (p, s) {
    const start = BM.fadeStart(p, s), pk = p.bmPeak && p.bmPeak[s];
    const R2 = GD.RACES[p.race], at = Math.round(Math.min(R2.maxLife, BM.oldOf(p) * 1.4));
    return { peak: pk ? pk[0] : null, peakAge: pk ? pk[1] : null, start: isFinite(start) ? Math.round(start) : null, fading: A.age(p) - (p.bmCare || 0) >= start,
      at, atPct: Math.round(100 * BM.factorAt(p, s, at)) };
  };
  // a small figure: each part shaded by what it carries
  BM.figure = function (p) {
    const B = BM.body(p), col = k => B[k].some(w => w.fresh) ? 'var(--bad,#b5503c)' : B[k].some(w => w.lasting && (GD.WOUNDS[w.k].fx && Object.keys(GD.WOUNDS[w.k].fx).length || GD.WOUNDS[w.k].skillPen)) ? 'var(--gold,#b08a3e)' : B[k].length ? 'var(--ink2,#8a7f70)' : 'var(--line,#d8cfbf)';
    const ill = p.ill ? ' opacity="0.75"' : '';
    return `<svg viewBox="0 0 60 104" width="48" height="84" role="img" aria-label="Your body"${ill}>` +
      `<circle cx="30" cy="11" r="8" fill="${col('head')}"/>` +
      `<rect x="20" y="21" width="20" height="34" rx="5" fill="${col('torso')}"/>` +
      `<rect x="10" y="22" width="8" height="28" rx="4" fill="${col('arms')}"/><rect x="42" y="22" width="8" height="28" rx="4" fill="${col('arms')}"/>` +
      `<circle cx="14" cy="55" r="4" fill="${col('hands')}"/><circle cx="46" cy="55" r="4" fill="${col('hands')}"/>` +
      `<rect x="21" y="57" width="8" height="40" rx="4" fill="${col('legs')}"/><rect x="31" y="57" width="8" height="40" rx="4" fill="${col('legs')}"/></svg>`;
  };
  BM.bodyHtml = function (p, wide) {
    const B = BM.body(p), esc = UI.esc, rows = [];
    for (const k of BM.PARTS) {
      const L = B[k];
      if (!wide && !L.length) continue;
      rows.push(`<div class="small"><b>${esc(BM.PART_NAME[k])}</b> ${L.length ? L.map(w => `<span class="${w.fresh ? 'bad' : 'ink2'}">${esc(w.name)}${w.fresh ? ` (mending${w.until ? ', healed by ' + esc(w.until) : ''})` : ''}${wide && w.fx.length ? ` <span class="tiny muted">${esc(w.fx.join(', '))}</span>` : ''}</span>`).join('; ') : '<span class="muted">sound</span>'}</div>`);
    }
    const I = p.ill;
    const ill = I ? `<div class="small bad">Ill with ${esc(I.name)}: ${esc(I.m)} month${I.m === 1 ? '' : 's'} to go${I.t ? `, under ${esc(BM.TREAT_NAME[I.t] || I.t)}` : ', untreated'}.</div>` : '';
    if (!rows.length && !ill) rows.push('<div class="small muted">Sound in every part.</div>');
    return `<div class="row bm-body" style="gap:10px;align-items:flex-start">${BM.figure(p)}<div class="grow">${rows.join('')}${ill}</div></div>`;
  };
  BM.agingHtml = function (p) {
    const esc = UI.esc;
    if (!A.isAdult(p)) return '';
    const L = GD.STATS.filter(s => s !== 'wil').map(s => {
      const c = BM.curve(p, s), nm = GD.STAT_NAMES[s];
      return `<div class="tiny">${esc(nm)}: ${c.peak != null ? `best ${esc(c.peak)} at ${esc(c.peakAge)}` : ''}${c.start != null ? (c.fading ? ` · fading since about ${esc(c.start)}` : ` · holds until about ${esc(c.start)}`) : ''}</div>`;
    });
    return `<div class="group-h">Age, stat by stat</div>${L.join('')}<div class="tiny muted">Each stat turns at its own age. Willpower does not fade.</div>`;
  };
  // the side profile: the body under the stats
  const side = UI.renderProfile;
  UI.renderProfile = function () {
    const h = side.apply(this, arguments), pc = A.pc();
    if (!pc || !pc.alive) return h;
    try { return h + `<div class="sep"></div><div class="group-h">Body</div>${BM.bodyHtml(pc, false)}`; } catch (e) { console.error('body view', e); return h; }
  };
  // the full profile: the body with what each mark costs, and the aging curve, in place of the wound chips
  const prof = UI.profileModal;
  UI.profileModal = function (pc) {
    const h = prof.apply(this, arguments);
    try {
      const i = h.indexOf('<div class="group-h">Wounds & scars</div>');
      if (i < 0) return h;
      const j = h.indexOf('<div class="group-h">Deeds</div>', i), end = j > 0 ? j : h.lastIndexOf('</div>');
      return h.slice(0, i) + `<div class="group-h">Body</div>${BM.bodyHtml(pc, true)}${BM.agingHtml(pc)}` + h.slice(end);
    } catch (e) { console.error('profile body', e); return h; }
  };
  // the stat tooltip: when it peaked and when it turns
  const tipStat = UI.TIPS.stat;
  UI.TIPS.stat = function (k) {
    const h = tipStat.apply(this, arguments), pc = A.pc();
    if (!h || !pc || k === 'wil' || !A.isAdult(pc)) return h;
    const c = BM.curve(pc, k);
    return h + `<div class="tip-f">${c.peak != null ? `Best: ${UI.esc(c.peak)} at ${UI.esc(c.peakAge)}. ` : ''}${c.fading ? `Fading since about ${UI.esc(c.start)}` : `Holds until about ${UI.esc(c.start)}`}; at ${UI.esc(c.at)}, about ${UI.esc(c.atPct)}% of what it was.</div>`;
  };
  // for events
  A.C.wound = (p, x) => (p.wounds || []).some(w => w.k === x || BM.partOf(w) === x || (x === 'lasting' && !w.until) || (x === 'fresh' && BM.fresh(w)));
  A.C.ill = p => !!(p.ill && p.ill.m > 0);
})();
