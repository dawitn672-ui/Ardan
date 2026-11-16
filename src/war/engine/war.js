// War from the inside. You only see a war you are in. Inside it, you act at your own rank:
//   soldier  — your place in the line and your own fight each phase
//   sergeant — your squad of ten
//   captain  — your company's orders
//   commander— the army's plan, reserves and the moment to commit
// Campaigns run a day or a week at a time; battles stop the clock and run phase by phase.
// Frontage, morale and quality decide battles (Lanchester's linear law for melee): this is why a few
// hundred elite order knights can break thousands.
import { clamp } from '../../core/engine/rng.js';
import { attempt, oddsWords } from '../../people/engine/odds.js';

export const TACTICS = {
  hold: { name: 'Hold the line', atk: 0.8, def: 1.3, morale: 0.02 },
  advance: { name: 'Advance steadily', atk: 1.05, def: 1.0, morale: 0 },
  charge: { name: 'Charge', atk: 1.45, def: 0.75, morale: -0.02, shock: 0.12 },
  flank: { name: 'Swing round the flank', atk: 1.25, def: 0.85, morale: 0, flank: 0.1 },
  volley: { name: 'Loose volleys', atk: 0.9, def: 1.05, morale: 0, ranged: true },
  feint: { name: 'Feigned retreat', atk: 0.7, def: 0.9, morale: -0.04, lure: true },
  withdraw: { name: 'Fall back in order', atk: 0.4, def: 1.15, morale: -0.05, retreat: true },
};
// how a tactic fares against the enemy's (row = mine, col = theirs)
const COUNTER = {
  hold: { charge: 1.35, advance: 1.1, flank: 0.85, volley: 0.8, feint: 1, hold: 1, withdraw: 1 },
  charge: { volley: 1.35, advance: 1.15, hold: 0.7, feint: 0.65, flank: 1.1, charge: 1, withdraw: 1.3 },
  flank: { hold: 1.3, volley: 1.25, advance: 1, charge: 0.85, feint: 0.9, flank: 1, withdraw: 1.1 },
  volley: { advance: 1.25, hold: 1.15, charge: 0.7, flank: 0.8, feint: 1.1, volley: 1, withdraw: 1.2 },
  advance: { feint: 0.85, hold: 0.95, volley: 0.9, charge: 0.9, flank: 1, advance: 1, withdraw: 1.2 },
  feint: { charge: 1.45, advance: 1.25, hold: 0.8, volley: 0.85, flank: 1, feint: 1, withdraw: 1 },
  withdraw: { charge: 0.9, advance: 1, hold: 1.05, volley: 0.85, flank: 0.9, feint: 1, withdraw: 1 },
};
export const TERRAIN = {
  open: { name: 'open field', at: 'on an open field', frontage: 1400, cavalry: 1.2, ranged: 1.1 },
  hills: { name: 'broken hills', at: 'in the broken hills', frontage: 800, cavalry: 0.8, ranged: 1.15, defenderBonus: 1.15 },
  forest: { name: 'forest', at: 'in the forest', frontage: 500, cavalry: 0.55, ranged: 0.7 },
  ford: { name: 'river ford', at: 'at a river ford', frontage: 350, cavalry: 0.8, ranged: 1.2, defenderBonus: 1.3 },
  pass: { name: 'mountain pass', at: 'in a mountain pass', frontage: 250, cavalry: 0.5, ranged: 1.0, defenderBonus: 1.4 },
};
export const PHASES = ['Skirmish', 'Clash', 'Press', 'Decision'];
export const RANKS = ['soldier', 'sergeant', 'captain', 'commander'];

export function makeUnit(id, name, kind, count, worth, opts = {}) {
  return { id, name, kind, count, start: count, worth, morale: opts.morale ?? 0.75, fatigue: 0, terror: opts.terror ?? 0,
    drill: opts.drill ?? {}, cavalry: !!opts.cavalry, ranged: !!opts.ranged, routed: false, tactic: null, killed: 0 };
}
export function makeArmy(name, side, units, commander = { judgment: 100, will: 100, style: 'cautious' }) {
  return { name, side, units, commander, supplyDays: 30, sick: 0, tactic: 'advance', reserve: [] };
}
export const armyStrength = (a) => a.units.filter((u) => !u.routed).reduce((s, u) => s + u.count * u.worth, 0);
export const armyMen = (a) => a.units.reduce((s, u) => s + u.count, 0);

// ---------- campaign (day or week steps) ----------
export function campaignStep(rng, camp, days = 1, standing = 'steady') {
  const log = [];
  for (let d = 0; d < days; d++) {
    camp.day++;
    for (const a of [camp.armies[0], camp.armies[1]]) {
      const forage = standing === 'forage' && a === camp.armies[camp.playerSide] ? 2 : 0;
      a.supplyDays = Math.max(0, a.supplyDays - 1 + forage * 0.6);
      if (a.supplyDays === 0) { for (const u of a.units) u.morale = clamp(u.morale - 0.02, 0, 1); }
      // camp disease: worse when hungry
      const sickP = 0.002 + (a.supplyDays < 5 ? 0.004 : 0);
      for (const u of a.units) { const lost = Math.round(u.count * sickP * rng.next()); u.count -= lost; a.sick += lost; }
      for (const u of a.units) u.fatigue = clamp(u.fatigue + (standing === 'forced' ? 0.06 : -0.03), 0, 1);
    }
    camp.distance -= standing === 'forced' ? 22 : standing === 'cautious' ? 8 : 14;
    if (camp.distance <= 0 && !camp.battle) {
      const terr = rng.pick(Object.keys(TERRAIN));
      camp.battle = startBattle(camp, terr);
      log.push({ day: camp.day, text: `Scouts sight the enemy. Battle ${TERRAIN[terr].at}.`, battle: true });
      break;
    }
    if (rng.chance(0.12)) log.push({ day: camp.day, text: rng.pick(['A foraging party is ambushed; three men do not return.', 'Rain all day; the road turns to soup.', 'Deserters slip away in the night.', 'A scout reports enemy campfires to the east.', 'The quartermaster finds a granary the enemy missed.']) });
  }
  return log;
}

export function startBattle(camp, terrainKey) {
  return { terrain: terrainKey, phase: 0, over: false, winner: null, contrib: { terrain: 0, tactics: 0, numbers: 0, quality: 0, elites: 0, morale: 0, player: 0, fatigue: 0 }, log: [] };
}

// ---------- one battle phase ----------
// orders: { armyTactic: [t0,t1], unitTactics: {unitId: tactic}, player: { rank, choice, person } }
export function battlePhase(rng, camp, orders = {}) {
  const b = camp.battle, T = TERRAIN[b.terrain];
  const [A, B] = camp.armies;
  A.tactic = orders.armyTactic?.[0] ?? A.tactic; B.tactic = orders.armyTactic?.[1] ?? aiTactic(rng, B, A, b);
  const phaseIntensity = [0.35, 1, 1.1, 0.8][b.phase];
  const res = {};
  const power = (me, foe, side) => {
    const alive = me.units.filter((u) => !u.routed && u.count > 0);
    const men = alive.reduce((s, u) => s + u.count, 0) || 1;
    const front = Math.min(1, T.frontage / men); // share of men who can actually fight
    let p = 0; const parts = [];
    for (const u of alive) {
      const tac = orders.unitTactics?.[u.id] ?? me.tactic;
      const foeTac = foe.tactic;
      const t = TACTICS[tac];
      let mod = t.atk * (COUNTER[tac]?.[foeTac] ?? 1);
      if (u.cavalry) mod *= T.cavalry; if (u.ranged) mod *= T.ranged * (b.phase === 0 ? 1.6 : 0.7);
      if (!u.ranged && b.phase === 0) mod *= 0.35; // skirmish phase is for missiles
      if (u.drill?.[tac]) mod *= 1 + u.drill[tac]; // drill pays off when the tactic matches it
      const defender = side === 1 && T.defenderBonus ? T.defenderBonus : 1;
      // elites fight in full (small units fit the front); masses only partly
      const engaged = u.count * (u.count < 400 ? Math.max(front, 0.9) : front);
      const morale = 0.5 + u.morale * 0.7, fat = 1 - u.fatigue * 0.35;
      const up = engaged * u.worth * mod * morale * fat * defender;
      parts.push({ u, up, mod }); p += up;
    }
    return { p, parts, front };
  };
  const pa = power(A, B, 0), pb = power(B, A, 1);
  // the fortunes of war: confusion, a gust of wind, a horse that bolts
  pa.p *= Math.exp(rng.normal(0, 0.18)); pb.p *= Math.exp(rng.normal(0, 0.18));
  // the player's own act at their rank
  const pl = orders.player ? playerAct(rng, camp, orders.player, pa, pb) : null;
  if (pl) { pa.p *= pl.armyMult; }
  const lethality = 0.045 * phaseIntensity;
  const deal = (from, to, toArmy) => {
    const total = to.parts.reduce((s, x) => s + x.u.count, 0) || 1;
    let killed = 0;
    for (const x of to.parts) {
      const share = x.u.count / total;
      const def = TACTICS[orders.unitTactics?.[x.u.id] ?? toArmy.tactic].def;
      const loss = Math.min(x.u.count, Math.round(from.p * lethality * share / (Math.pow(x.u.worth, 0.75) * def)));
      x.u.count -= loss; killed += loss;
    }
    return killed;
  };
  const lossB = deal(pa, pb, B), lossA = deal(pb, pa, A);
  // morale: losses, elites' terror, flanks, shock
  const shake = (me, foe, lossesThis, theirTac) => {
    const menBefore = me.units.reduce((s, u) => s + u.count, 0) + lossesThis || 1;
    const terror = foe.units.filter((u) => !u.routed && u.terror > 0).reduce((s, u) => s + u.terror * Math.min(1, u.count / 150), 0);
    for (const u of me.units) {
      if (u.routed) continue;
      let drop = (lossesThis / menBefore) * 3.2 + terror * 0.06 * phaseIntensity + (TACTICS[theirTac].flank ?? 0) + (TACTICS[theirTac].shock ?? 0) * 0.5;
      drop -= TACTICS[me.tactic].morale; drop *= 1.3 - (u.worth > 8 ? 0.6 : u.worth > 3 ? 0.25 : 0);
      u.morale = clamp(u.morale - drop, 0, 1);
      u.fatigue = clamp(u.fatigue + 0.08 * phaseIntensity, 0, 1);
      if (u.morale < 0.18 || u.count < u.start * 0.25) { u.routed = true; b.log.push(`${u.name} breaks and runs.`); }
    }
  };
  shake(A, B, lossA, B.tactic); shake(B, A, lossB, A.tactic);
  if (pl) for (const u of A.units) if (!u.routed) u.morale = clamp(u.morale + pl.moraleBoost, 0, 1);
  // contributions (for the after-action report), signed toward side A
  const ratio = Math.log((pa.p + 1) / (pb.p + 1));
  b.contrib.numbers += Math.log((armyMen(A) + 1) / (armyMen(B) + 1)) * 0.3;
  b.contrib.tactics += Math.log((COUNTER[A.tactic]?.[B.tactic] ?? 1) / (COUNTER[B.tactic]?.[A.tactic] ?? 1));
  b.contrib.terrain += T.defenderBonus ? -Math.log(T.defenderBonus) * 0.5 : 0;
  b.contrib.elites += (A.units.filter((u) => u.terror).length - B.units.filter((u) => u.terror).length) * 0.3;
  b.contrib.quality += Math.log(avgWorth(A) / avgWorth(B)) * 0.6;
  if (pl) b.contrib.player += Math.log(pl.armyMult) + pl.moraleBoost * 3;
  res.lossA = lossA; res.lossB = lossB; res.ratio = ratio; res.player = pl; res.tactics = [A.tactic, B.tactic];
  b.log.push(`${PHASES[b.phase]}: ${A.name} ${TACTICS[A.tactic].name.toLowerCase()}, ${B.name} ${TACTICS[B.tactic].name.toLowerCase()}. Losses ${lossA} to ${lossB}.`);
  b.phase++;
  const brokeA = A.units.every((u) => u.routed || u.count === 0), brokeB = B.units.every((u) => u.routed || u.count === 0);
  if (brokeA || brokeB || b.phase >= PHASES.length) {
    b.over = true;
    b.winner = brokeA && !brokeB ? 1 : brokeB && !brokeA ? 0 : armyStrength(A) * avgMorale(A) >= armyStrength(B) * avgMorale(B) ? 0 : 1;
    // pursuit: routers die in the chase
    const loser = camp.armies[1 - b.winner];
    for (const u of loser.units) { if (!u.routed && u.morale < 0.55) { u.routed = true; b.log.push(`${u.name} gives way as the line collapses.`); } if (u.routed) { const chase = Math.round(u.count * 0.25); u.count -= chase; } }
  }
  return res;
}
const avgWorth = (a) => { const m = armyMen(a) || 1; return a.units.reduce((s, u) => s + u.count * u.worth, 0) / m; };
const avgMorale = (a) => { const al = a.units.filter((u) => !u.routed); return al.length ? al.reduce((s, u) => s + u.morale, 0) / al.length : 0; };

function aiTactic(rng, me, foe, b) {
  const style = me.commander.style;
  if (b.phase === 0) return me.units.some((u) => u.ranged) ? 'volley' : 'hold';
  if (style === 'bold') return rng.pick(['charge', 'advance', 'flank']);
  if (style === 'cunning') return rng.pick(['feint', 'flank', 'hold']);
  return armyStrength(me) > armyStrength(foe) ? 'advance' : 'hold';
}

// ---------- the player's own part ----------
export const CHOICES = {
  soldier: [
    { id: 'line', name: 'Keep your place in the line', risk: 0.4, reward: 0.4, army: 1.0, morale: 0.005 },
    { id: 'push', name: 'Push forward with the front rank', risk: 1.0, reward: 1.2, army: 1.003, morale: 0.01 },
    { id: 'shield', name: 'Cover the man beside you', risk: 0.6, reward: 0.6, army: 1.0, morale: 0.015, save: true },
    { id: 'banner', name: 'Go for their standard-bearer', risk: 1.8, reward: 3, army: 1.0, morale: 0.0, banner: true },
    { id: 'back', name: 'Drift to the rear ranks', risk: 0.15, reward: 0, army: 0.999, morale: -0.01 },
  ],
  sergeant: [
    { id: 'tight', name: 'Keep the squad tight', risk: 0.4, reward: 0.5, army: 1.01, morale: 0.01 },
    { id: 'gap', name: 'Plug the gap in the line', risk: 0.9, reward: 1.2, army: 1.06, morale: 0.03 },
    { id: 'hunt', name: 'Pick off stragglers', risk: 0.7, reward: 0.9, army: 1.03, morale: 0 },
  ],
  captain: [
    { id: 'follow', name: 'Follow the army\'s orders', risk: 0.4, reward: 0.5, army: 1.0, morale: 0 },
    { id: 'counter', name: 'Counter-charge where they press', risk: 1.0, reward: 1.5, army: 1.08, morale: 0.02 },
    { id: 'rally', name: 'Ride the line and rally your men', risk: 0.6, reward: 0.8, army: 1.03, morale: 0.06 },
    { id: 'hide', name: 'Keep your company back', risk: 0.1, reward: 0, army: 0.95, morale: -0.02 },
  ],
  commander: [
    { id: 'reserve', name: 'Commit the reserve now', risk: 0.5, reward: 1.5, army: 1.18, morale: 0.03 },
    { id: 'hold-res', name: 'Hold the reserve back', risk: 0.2, reward: 0.4, army: 1.0, morale: 0.01 },
    { id: 'lead', name: 'Lead the charge yourself', risk: 1.5, reward: 3, army: 1.12, morale: 0.1 },
  ],
};

function playerAct(rng, camp, { rank, choice, person }, pa, pb) {
  const c = CHOICES[rank].find((x) => x.id === choice) ?? CHOICES[rank][0];
  const { capability, difficulty, foe } = playerOdds(camp, rank, person, c);
  const res = attempt(rng, { capability, difficulty, judgment: person.judgment, will: person.will, fatigue: person.fatigue ?? 0, stakes: 0.6 + c.risk * 0.3, label: c.name });
  const odds = oddsWords(capability, difficulty);
  let wound = null;
  if (!res.success && rng.chance(0.15 * c.risk + (res.tier === 'disaster' ? 0.35 : 0))) wound = rng.pick(['arm', 'leg', 'hand', 'knee', 'face', 'side']);
  const kills = res.success ? Math.max(0, Math.round(c.reward * (res.tier === 'triumph' ? 3 : 1) * rng.next() * 2)) : 0;
  const capturedBanner = c.banner && res.tier === 'triumph';
  const scale = { soldier: 1, sergeant: 1, captain: 1, commander: 1 }[rank];
  const armyMult = (res.success ? c.army : 1 - (c.army - 1) * 0.5) * (capturedBanner ? 1.1 : 1) * scale;
  const moraleBoost = (res.success ? c.morale : -Math.abs(c.morale) * 0.5) + (capturedBanner ? 0.12 : 0);
  return { choice: c, res, odds, wound, kills, capturedBanner, armyMult, moraleBoost,
    deedWeight: res.deedWeight * c.reward * (capturedBanner ? 4 : 1), witnesses: rank === 'commander' ? 'army' : rank === 'captain' ? 'company' : 'comrades' };
}

// Who you are actually up against at your rank: a soldier faces the enemy unit across from him (the best
// troops guard the standard); officers match wits with the enemy commander.
export function facing(camp) {
  const alive = camp.armies[1].units.filter((u) => !u.routed && u.count > 0);
  if (!alive.length) return camp.armies[1].units[0];
  const i = (camp.battle.phase * 7 + (camp.day ?? 0)) % alive.length;
  return alive[i];
}
export function playerOdds(camp, rank, person, c) {
  const foe = facing(camp);
  if (rank === 'soldier' || rank === 'sergeant') {
    const best = Math.max(...camp.armies[1].units.filter((u) => !u.routed).map((u) => u.worth), 1);
    const target = c.banner ? best * 1.6 : foe.worth;
    return { capability: person.worth * (rank === 'sergeant' ? 1.2 : 1), difficulty: target * (0.7 + c.risk * 0.6), foe };
  }
  const enemyCmd = 1 + (camp.armies[1].commander.judgment ?? 100) / 100 + 0.5;
  if (rank === 'captain') {
    // a captain fights the unit across from his company, under their general: his command and his men's worth against
    // theirs and their general's; a bold order is far harder to carry than holding back
    const mine = camp.armies[0].units.find((u) => u.id === 'coy') ?? camp.armies[0].units[0];
    const q = Math.sqrt(Math.max(0.1, foe.worth) / Math.max(0.1, mine?.worth ?? 1));
    return { capability: person.command ?? 2, difficulty: enemyCmd * q * (0.35 + c.risk * 0.9), foe };
  }
  return { capability: person.command ?? 2, difficulty: enemyCmd * (0.6 + c.risk * 0.5), foe };
}

// ---------- after-action report: three biggest causes, in words ----------
export function afterAction(camp) {
  const b = camp.battle, [A, B] = camp.armies;
  const names = { terrain: 'the ground', tactics: 'the choice of tactics', numbers: 'sheer numbers', quality: 'the quality of the troops', elites: 'the elite orders on the field', morale: 'nerve', player: 'your own part', fatigue: 'tiredness' };
  const top = Object.entries(b.contrib).filter(([, v]) => Math.abs(v) > 0.02).sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 3);
  const won = b.winner === 0;
  return { won, headline: won ? `Victory for ${A.name}.` : `Defeat. ${B.name} holds the field.`,
    causes: top.map(([k, v]) => `${names[k]} ${v > 0 ? 'favoured us' : 'favoured them'}${Math.abs(v) > 0.6 ? ' heavily' : ''}`),
    losses: [A.units.reduce((s, u) => s + (u.start - u.count), 0), B.units.reduce((s, u) => s + (u.start - u.count), 0)], log: b.log };
}

// ---------- outside the war: no view, only rumour ----------
export function rumourOfBattle(rng, camp, monthsLater = 1) {
  const truth = camp.battle?.winner === 0 ? camp.armies[0].name : camp.armies[1].name;
  const wrong = rng.chance(0.25 + monthsLater * 0.05);
  const who = wrong ? (truth === camp.armies[0].name ? camp.armies[1].name : camp.armies[0].name) : truth;
  return `A pedlar swears ${who} won a great battle in the ${rng.pick(['east', 'south', 'hills', 'river country'])}. ${wrong ? '' : ''}`.trim();
}
