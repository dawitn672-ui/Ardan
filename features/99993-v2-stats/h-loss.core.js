// v2 stats, part 8: what a choice can cost you for good, read from the choice as written (playtest 2, new 1 and 2).
//
// Playtest 2 found two cards that lied about risk:
// - "Join the plot ... Nothing lost if it fails". The failure ran A.punish(p, "treason"), which queued the gallows scene,
//   and the character hanged at 20. 9998-stakes reads a function effect for the families it touches, and a call to
//   A.punish, a queued scene or a scheduled one is none of them, so the card said nothing was lost.
// - "If it fails: a wound, hurt" killed a soldier at 18. A lost fight had left him near death, and the 12 health the
//   failure took brought him to nothing; A.mortalCheck did the rest. The card said "hurt" as it would to a hale man.
//
// VS.lossOf(fx, pc, ctx) reads an effect (an object or a function's source) for the losses that last:
//   die       death, as written (die: ..., A.pcDeath)
//   gallows   the gallows scene, queued directly (ev: "gallows", a gallows() helper) or by the law (A.punish for treason,
//             murder or desertion where those hang)
//   law       the law's sentence for each crime named (A.punish(p, "treason"), punish: "theft"), in words, for this
//             person under the law of the realm they live in (the same tree A.punish follows)
//   prison    years in a cell (prison: ..., A.imprison)
//   exile     A.exile
//   hurt      the most health it can take at once (health: -12, p.health -= 6, hurt(p, 10, ...)), and lethal when that
//             would bring this person's health to nothing: A.mortalCheck then decides between death and a scar
//   chain     the scenes it queues or schedules (event: "id", A.queue / A.schedule with ev: "id"), read in turn, three deep:
//             a queued scene's own losses are what the choice can lead to ("what follows can kill you")
// It is pure: it reads the written choice, the person and the realm's law, and never draws or writes.
// VS.lossWords(L, pc) says it in words, worst first. The cards (99999-v2-content) and the odds (VS.stakesOf: a deadly loss
// raises the stakes) both read it, so the chip, the red check and the roll agree.
const VS = A.V2S;
const srcCache = new WeakMap();
const srcOf = f => { if (typeof f !== 'function') return ''; let s = srcCache.get(f); if (s == null) { try { s = String(f); } catch (e) { s = ''; } srcCache.set(f, s); } return s; };

// ---- the law, as A.punish applies it (punishNow in the release) ------------------------------------------------------------
// returns { w: words, gallows, prison, maim, exile, outlaw } for this person and crime
VS.lawFor = function (pc, crime) {
  const out = { w: '', gallows: false, prison: false, maim: false, exile: false, outlaw: false };
  if (!pc) return out;
  if (pc.ruler && pc.id === A.S.pc) { out.w = 'a scandal at court'; return out; }
  const law = A.lawOf ? A.lawOf(pc.realm) : 'other', R = pc.realm, repeat = (pc.flags && pc.flags.convictions) || 0, cr = String(crime || '');
  if (cr === 'treason') { Object.assign(out, { w: 'the gallows or a deep cell', gallows: true, prison: true }); if (pc.noble) out.w += ', and your titles'; }
  else if (cr === 'murder' || cr === 'attempted murder') {
    if ((law === 'north' && R === 'POL-01') || law === 'orc' || R === 'POL-08') {
      const price = cr === 'murder' ? 300 : 120;
      if ((pc.coin || 0) >= price) out.w = `a blood-price of ${A.coin ? A.coin(price) : price + ' suns'}`;
      else Object.assign(out, { w: 'outlawry: anyone may kill you', outlaw: true });
    } else if (law === 'elf') Object.assign(out, { w: 'exile from the forest', exile: true });
    else if (law === 'deep') Object.assign(out, { w: 'exile from the hold in winter', exile: true });
    else if (cr === 'murder') Object.assign(out, { w: 'the gallows or years in a cell', gallows: true, prison: true });
    else Object.assign(out, { w: 'years in a cell', prison: true });
  } else if (cr === 'desertion') {
    if (R === 'POL-05') Object.assign(out, { w: 'two fingers cut off', maim: true });
    else Object.assign(out, { w: 'the gallows or a flogging', gallows: true });
  } else if (cr === 'theft' || cr === 'smuggling') {
    if (law === 'sun' || law === 'north') out.w = repeat >= 1 ? 'a brand or a fine' : 'a fine';
    else if (law === 'well' && repeat >= 2) Object.assign(out, { w: 'the loss of a hand', maim: true });
    else if (law === 'east') out.w = 'a brand and a flogging';
    else if (law === 'orc' || law === 'deep') out.w = 'a fine';
    else if (law === 'pirate') out.w = 'a week marooned on a rock';
    else out.w = 'a flogging';
    if (cr === 'smuggling') { out.w += ', perhaps the cells'; out.prison = true; }
  } else if (cr === 'debt') {
    if (law === 'east') out.w = 'bondage to your creditor';
    else Object.assign(out, { w: 'debtors\' prison', prison: true });
  } else out.w = 'the law';
  return out;
};

// ---- an effect's lasting losses ------------------------------------------------------------------------------------------
const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);
const RX = {
  die: /\bpcDeath\(|\bdie\s*:\s*["'`!\w]/,
  prison: /\bimprison\(|\bprison\s*:\s*[\w"'`]/,
  exile: /\bA\.exile\(/,
  gallows: /\bgallows\(\s*p\b|\bev\s*:\s*["']gallows["']|\bevent\s*:\s*["']gallows["']/,
  punish: [/\bpunish\(\s*\w+\s*,\s*["'`]([\w ]+)["'`]/g, /\bpunish\s*:\s*["'`]([\w ]+)["'`]/g],
  ev: [/\bev\s*:\s*["'](\w+)["']/g, /\bevent\s*:\s*["'](\w+)["']/g],
  // health it takes: health: -N, .health -= N, hurt(p, N, ...) (the content's own helper; hp() is spirits, not health)
  hurt: [/\bhealth\s*:\s*-\s*([\d.]+)/g, /\.health\s*-=\s*([\d.]+)/g, /\bhurt\(\s*\w+\s*,\s*([\d.]+)/g, /\.health\s*=\s*[\w.]*\(?\s*\w+\.health\s*-\s*([\d.]+)/g],
};
const empty = () => ({ die: false, gallows: false, prison: false, exile: false, maim: false, wound: false, law: [], hurt: 0, chain: [], via: [] });
// the kinds a later scene can end in ({ die, prison, maim, law, hurt } in L.via, with n: the most health it takes); death covers the gallows and an outlaw's life
const KINDS = ['die', 'prison', 'maim', 'law', 'hurt'];
const hit = (X, k) => !!X && (k === 'die' ? X.die || X.dieRisk || X.gallows || X.gallowsRisk || X.law.some(x => x.outlaw) : k === 'maim' ? X.maim || X.exile : k === 'law' ? X.law.length > 0 : k === 'hurt' ? X.hurt > 0 || X.wound || X.via.some(v => v.hurt) : X[k] || X[k + 'Risk']) || (X && X.via.some(v => v[k]));
VS.lossOf = function (fx, pc, ctx, depth, seen) {
  const L = empty();
  pc = pc || (A.pc ? A.pc() : null);   // the law and the body are the player's: a reading without a person reads theirs
  if (!fx || (typeof fx !== 'object' && typeof fx !== 'function')) return L;
  depth = depth || 0; seen = seen || new Set();
  const crimes = [], evs = [];
  if (typeof fx === 'object') {
    if (fx.die) L.die = true;
    if (fx.wound) L.wound = true;
    if (fx.prison) L.prison = true;
    if (fx.punish) crimes.push(String(fx.punish));
    if (fx.event === 'gallows') L.gallows = true; else if (typeof fx.event === 'string') evs.push(fx.event);
    if (num(fx.health) < 0) L.hurt = -fx.health;
  } else {
    const s = srcOf(fx);
    // code may hold a death or a cell behind a branch of its own: read as a risk, not a certainty
    if (RX.die.test(s)) L.dieRisk = true;
    if (RX.prison.test(s)) L.prisonRisk = true;
    if (RX.exile.test(s)) L.exile = true;
    if (/\baddWound\(|\bwound\s*:/.test(s)) L.wound = true;
    if (RX.gallows.test(s)) L.gallowsRisk = true;
    for (const rx of RX.punish) for (const m of s.matchAll(rx)) crimes.push(m[1]);
    for (const rx of RX.ev) for (const m of s.matchAll(rx)) if (m[1] !== 'gallows') evs.push(m[1]);
    for (const rx of RX.hurt) for (const m of s.matchAll(rx)) L.hurt = Math.max(L.hurt, +m[1] || 0);
  }
  for (const cr of [...new Set(crimes)]) {
    const w = VS.lawFor(pc, cr);
    L.law.push(Object.assign({ crime: cr }, w));
    L.gallows = L.gallows || w.gallows; L.prison = L.prison || w.prison; L.maim = L.maim || w.maim; L.exile = L.exile || w.exile;
  }
  // a queued or scheduled scene: what its choices can cost, read in turn (each scene once, three deep)
  for (const id of [...new Set(evs)]) {
    if (seen.has(id) || depth >= 3) continue;
    const e = A.EV && A.EV[id];
    if (!e || !Array.isArray(e.choices)) continue;
    seen.add(id); L.chain.push(id);
    // the scene can end in a loss when a failed check there brings it, or when every way out of it does; a choice that
    // walks into it on purpose ("Face it with dignity" beside three ways to try) is the player's own, not the scene's
    const fail = {}; let sure = null, failHurt = 0, sureHurt = null;
    for (const c of e.choices) {
      if (!c || typeof c !== 'object') continue;
      const S = VS.lossOf(c.fx, pc, ctx, depth + 1, seen), mine = {};
      for (const k of KINDS) if (hit(S, k)) mine[k] = 1;
      if (c.check || c.group) {
        // a failure's losses, and a risk the code keeps even on success (caught on the way out of a heist)
        const F = VS.lossOf(c.lose && c.lose.fx, pc, ctx, depth + 1, seen), W = VS.lossOf(c.win && c.win.fx, pc, ctx, depth + 1, seen);
        for (const k of KINDS) if (hit(F, k) || (k !== 'hurt' && hit(W, k))) fail[k] = 1;
        failHurt = Math.max(failHurt, F.hurt);
      }
      sure = sure == null ? mine : Object.fromEntries(Object.keys(sure).filter(k => mine[k]).map(k => [k, 1]));
      sureHurt = sureHurt == null ? S.hurt : Math.min(sureHurt, S.hurt);
    }
    const v = Object.assign({}, fail, sure || {});
    if (v.hurt) v.n = Math.max(failHurt, sureHurt || 0);
    if (Object.keys(v).length) L.via.push(v);
  }
  L.lethal = !!(pc && L.hurt > 0 && typeof pc.health === 'number' && pc.health - L.hurt <= 0);
  return L;
};
// the losses that last, as written in the effect itself (not through a later scene): a red check, high stakes
VS.lossSerious = L => !!(L && (L.die || L.dieRisk || L.gallows || L.gallowsRisk || L.prison || L.prisonRisk || L.exile || L.maim || L.law.some(x => x.outlaw)));
VS.lossDeadly = L => !!(L && (L.die || L.dieRisk || L.gallows || L.gallowsRisk || L.lethal || L.law.some(x => x.outlaw) || L.via.some(v => v.die)));
VS.healthWord = pc => (VS.band && pc && typeof pc.health === 'number' ? VS.band('health', pc.health) : '');
// in words, worst first: ["a treason trial: the gallows or a deep cell", "hurt that could kill you, near death as you are"]
VS.lossWords = function (L, pc) {
  const out = [];
  if (!L) return out;
  if (L.die) out.push('death');
  else if (L.dieRisk && !L.gallows && !L.gallowsRisk) out.push('a risk of death');
  for (const x of L.law) out.push(x.crime === 'treason' || x.crime === 'murder' || x.crime === 'desertion' ? `a ${x.crime} trial: ${x.w}` : x.w === 'the law' ? 'the law' : `the law: ${x.w}`);
  if (L.gallows && !L.law.some(x => x.gallows)) out.push('the gallows');
  else if (L.gallowsRisk && !L.law.some(x => x.gallows)) out.push('perhaps the gallows');
  if (L.lethal) { const hw = VS.healthWord(pc); out.push(hw ? `hurt that could kill you, ${hw} as you are` : 'hurt that could kill you'); }
  if (L.prison && !L.law.some(x => x.prison)) out.push('prison');
  else if (L.prisonRisk && !L.law.some(x => x.prison)) out.push('a risk of prison');
  if (L.exile && !L.law.some(x => x.exile)) out.push('exile');
  const via = L.via || [];
  if (!L.die && !L.dieRisk && !L.gallows && !L.gallowsRisk && via.some(v => v.die)) out.push('what follows can kill you');
  else if (!L.prison && !L.prisonRisk && via.some(v => v.prison)) out.push('what follows can mean prison');
  else if (!L.maim && !L.exile && via.some(v => v.maim)) out.push('what follows can cost you for good');
  else if (!L.law.length && via.some(v => v.law)) out.push('what follows can bring the law on you');
  else if (!L.hurt && via.some(v => v.hurt && (!v.n || v.n >= 10))) {   // a scratch later on is not a stake; a wound or a real hurt is
    // a later scene's hurt, against this person's health now: the body sheet's word when it could kill
    const n = Math.max(0, ...via.map(v => v.n || 0)), hw = VS.healthWord(pc);
    out.push(pc && n > 0 && typeof pc.health === 'number' && pc.health - n <= 0 ? `what follows could kill you${hw ? ', ' + hw + ' as you are' : ''}` : 'what follows can hurt you');
  }
  return out;
};
