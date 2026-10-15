// Fights on the ladder: the audit finds no clash, fights roll on fighting worth, the odds shown are the odds rolled,
// the group resolver keeps the tier texts, wounds cost tiers, and the screens show the math (and only read).
import { FIGHTS_LAB } from '../../bench/fights-audit.mjs';

const fmtBins = b => b.bins.filter(x => x.n >= 30).map(x => `${x.bin}: ${x.shown}/${x.real} (${x.n})`).join(', ');

export default {
  async flAudit(pg) {
    // every fight and beast encounter tagged; after conversion no clash with the ladder is left
    const r = await pg.evaluate(() => {
      const a = A.FL.audit();
      let kept = 0, lost = [];
      for (const x of A.FL.CONVERTED) {
        const c = A.EV[x.id].choices[x.i];
        if (c.win && c.lose && (c.win.r || c.win.fx) && (c.lose.r || c.lose.fx)) kept++; else lost.push(x.id);
      }
      return { a: Object.assign({}, a, { list: undefined }), before: A.FL.BEFORE, kept, lost: lost.slice(0, 5), n: A.FL.CONVERTED.length };
    });
    const a = r.a, before = Object.values(r.before).reduce((s, x) => s + x, 0);
    const ok = a.clashTotal === 0 && r.n >= 100 && a.convertedDeadly >= 40 && r.kept === r.n && before > 0;
    return { ok, detail: `${a.events} events, ${a.fights} fight choices (${JSON.stringify(a.byScale)}); clashes as written ${before} (${JSON.stringify(r.before)}), after ${a.clashTotal}; ` +
      `${r.n} choices now roll on worth, ${a.convertedDeadly} of them can kill or maim; all keep their win and lose text: ${r.kept === r.n}` };
  },

  async flHonest(pg) {
    // converted choices: the odds on the button are the odds the roll uses, and come up that often
    await pg.evaluate(FIGHTS_LAB);
    const r = await pg.evaluate(() => FLAB.honest(3000, 4401));
    // exact: the roll is A.chance of the number shown. Sampled: each bin within 3.5 standard errors (plus a point)
    const within = r.bins.filter(b => b.n >= 60).every(b => { const p = b.shown / 100, se = 100 * Math.sqrt(p * (1 - p) / b.n); return Math.abs(b.shown - b.real) <= 3.5 * se + 1; });
    const ok = r && r.mismatch === 0 && within && r.meanErr <= 3 && r.n >= 2000;
    return { ok, detail: `${r.n} rolls, ${r.mismatch} where the roll used another number; by shown odds (shown/real): ${fmtBins(r)}; mean error ${r.meanErr}, worst bin ${r.maxErr} pts`, data: r };
  },

  async flDuelOdds(pg) {
    // the duel screen's chance against what duels do: foes who draw a weapon at the start, a hurt player, both rule sets;
    // and the profile's odds against the plain lethal duels they are fitted on
    await pg.evaluate(FIGHTS_LAB);
    const r = await pg.evaluate(() => {
      const out = FLAB.duels(2400, 4201);
      // the opening line reads the same chance as the number
      let agree = 0, n = 0;
      FLAB.quiet(() => { const ids = FLAB.pool(4211, 60); for (let k = 0; k < 120; k++) { const a = A.P(ids[k % 60]), b = A.P(ids[(k * 7 + 3) % 60]); if (a === b) continue;
        A.S.pc = a.id; A.S.queue = []; const D = A.startDuel(a, b, { kind: 'duel', lethal: true, toYield: true }); n++; if (D.log.includes(A.FL.weighLine(D))) agree++; A.S.queue = []; } });
      return Object.assign(out, { agree, n, honestOdds: typeof A.shownDuelOdds === 'function' });
    });
    const s = r.screen, p = r.profile;
    // the profile's number is 24-honest-odds' A.shownDuelOdds (with the drawn weapon and health added here); without
    // that feature in the build the person view shows the release's formula, which this feature does not touch
    const ok = s.meanErr <= 3 && s.maxErr <= 10 && (!r.honestOdds || p.meanErr <= 4) && r.agree === r.n;
    return { ok, detail: `duel screen ${s.n} duels, mean error ${s.meanErr}, worst bin ${s.maxErr} (${fmtBins(s)}); profile ${p.n} duels, mean error ${p.meanErr}, worst bin ${p.maxErr}; opening line agrees in ${r.agree}/${r.n}` };
  },

  async flBeastOdds(pg) {
    // the duel screen's chance against beasts, alone and with a hunting party, at health 60-100
    await pg.evaluate(FIGHTS_LAB);
    const r = await pg.evaluate(() => FLAB.beasts(3000, 4301));
    const ok = r.meanErr <= 4 && r.maxErr <= 14;
    return { ok, detail: `${r.n} beast duels, mean error ${r.meanErr}, worst bin ${r.maxErr} (${fmtBins(r)})` };
  },

  async flGroupTiers(pg) {
    // the group resolver (A.groupFight, rolled 3,000 times a matchup) against the sentences of GD.TIERS; and the plan's
    // "3 Trained beat 1 Elite about two times in three", which the game's own ladder (an Elite takes 7-10 regulars) refutes
    await pg.evaluate(FIGHTS_LAB);
    const r = await pg.evaluate(() => FLAB.group(3000));
    const C = Object.fromEntries(r.claims.map(c => [c.k, c]));
    const inBand = (k, lo, hi) => C[k].closed >= lo && C[k].closed <= hi;
    const rolledOk = r.claims.every(c => Math.abs(c.rolled - c.closed) <= 3.5);
    const ladder = inBand('Trained vs 2 Brawlers', 45, 60) && inBand('Trained vs 3 Brawlers', 25, 55) && inBand('Veteran vs 2 Trained', 45, 60) && inBand('Veteran vs 3 Trained', 25, 55) &&
      inBand('Elite vs 7 Trained', 45, 60) && inBand('Elite vs 10 Trained', 25, 55) && inBand('Elite vs 4 Veterans', 35, 60) && inBand('Master vs 20 Trained', 45, 60) &&
      inBand('Master vs 30 Trained', 20, 55) && inBand('Master vs 8 Veterans', 45, 60) && inBand('Master vs 10 Veterans', 25, 55);
    const plan = C['3 Trained vs Elite'];
    return { ok: rolledOk && ladder, detail: r.claims.map(c => `${c.k} ${c.closed}% (rolled ${c.rolled}%)`).join('; ') +
      `. Plan's 3 Trained vs 1 Elite: ${plan.closed}%, not 67%; ${r.trainedToBeatEliteTwoInThree} Trained beat an Elite two times in three` };
  },

  async flTierTexts(pg) {
    // GD.TIER_INFO's beast texts, as rewritten, against duels (500 a line)
    await pg.evaluate(FIGHTS_LAB);
    const r = await pg.evaluate(() => ({ t: FLAB.tiers(500, 4101), animal: GD.TIER_INFO.animal.who, great: GD.TIER_INFO.great.who }));
    const ok = r.t.every(x => x.real != null && (x.max != null ? x.real < x.claim : Math.abs(x.real - x.claim) <= 10)) && /one time in four/.test(r.animal);
    return { ok, detail: r.t.map(x => `${x.k}: ${x.real}% (text ${x.max != null ? 'under ' + x.claim : x.claim}%)`).join('; ') };
  },

  async flWounds(pg) {
    // a lost hand takes two tiers off every weapon; lost fingers cost every hand weapon; a bad knee cuts speed; the duel
    // fighter, the worth and its parts all see it
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4501, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 26 });
      const tiers = GD.TIERS.map(t => t.k), out = [], bad = [];
      const weapons = ['sword', 'axe', 'spear', 'mace', 'dagger', 'fists', 'halberd', 'longsword', 'warhammer'];
      for (const t of [3, 4, 5]) for (const w of weapons) {
        const p = A.makeFoe({ realm: 'POL-01', tier: t }); p.npcTemp = false; A.S.people[p.id] = p;
        p.gear = { weapon: w === 'fists' ? null : w, armor: 'padded', shield: null, helm: null, ranged: null, mount: null };
        const sk = GD.WEAPON_SKILL[(GD.GEAR[w] || GD.GEAR.fists).kind] || 'unarmed'; p.skills[sk] = Math.max(p.skills[sk] || 0, 30 + 10 * t);
        const w0 = A.fightWorth(p), t0 = tiers.indexOf(A.tierOf(w0).k);
        p.wounds = [{ k: 'lost_hand', until: 0 }];
        const w1 = A.fightWorth(p), t1 = tiers.indexOf(A.tierOf(w1).k);
        p.wounds = [{ k: 'lost_fingers', until: 0 }];
        const wf = A.fightWorth(p);
        p.wounds = [{ k: 'lost_hand', until: 0 }];
        const parts = A.worthParts(p), sum = parts.body + parts.skill + parts.gear;
        const f = A.fighterFrom(p, {});
        out.push([w, w0, w1, t0, t1]);
        if (!(t0 < 2 ? w0 - w1 >= 20 : t1 === t0 - 2) || wf >= w0 || sum !== parts.total || !f.oneHand) bad.push(`${w}: ${w0}->${w1} (tier ${t0}->${t1}), fingers ${wf}, parts ${sum}/${parts.total}`);
      }
      const p = A.pc(), s0 = A.stat(p, 'spd'), v0 = A.fightWorth(p); p.wounds.push({ k: 'bad_knee', until: 0 });
      return { out, bad, knee: [s0, A.stat(p, 'spd'), v0, A.fightWorth(p)] };
    });
    const ok = !r.bad.length && r.knee[1] === r.knee[0] - 7 && r.knee[3] < r.knee[2];
    const ex = r.out.filter((x, i) => i % 9 === 0 || x[0] === 'spear').slice(0, 5).map(x => `${x[0]} ${x[1]}→${x[2]}`).join(', ');
    return { ok, detail: `${r.out.length} fighters (3 tiers x 9 weapons): a lost hand drops each by two tiers (${ex}); ${r.bad.length} misses ${r.bad.slice(0, 2).join('; ')}; bad knee: speed ${r.knee[0]}→${r.knee[1]}, worth ${r.knee[2]}→${r.knee[3]}` };
  },

  async flScreens(pg) {
    // the math on screen: a measure under event fights, both tiers and the chance on the duel screen, the cost of each
    // wound on the profile; no digits on Realism; and rendering reads only
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4601, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 28 });
      const pc = A.pc(); pc.skills.melee = 40; pc.skills.unarmed = 35;
      const C = A.FL.CONVERTED.find(x => x.id === 'tavern_brawl') || A.FL.CONVERTED[0];
      const q = { type: 'event', ev: C.id, ctx: {} }; A.S.queue = [q]; A.eventView(q);
      const R = () => JSON.stringify([A.rngState, A.S.rng]);
      const rng0 = R(), h0 = T.hash(A.S);
      const ev = UI.eventModal(q);
      const evPure = R() === rng0 && T.hash(A.S) === h0;
      const foe = A.makeFoe({ realm: 'POL-01', tier: 2 }); foe.npcTemp = false; A.S.people[foe.id] = foe; foe.gear.weapon = null;
      A.S.queue = [];
      A.S.settings.diff = 'story';
      const D = A.startDuel(pc, foe, { kind: 'duel', lethal: true, toYield: true });
      const rng1 = R(), h1 = T.hash(A.S);
      const duelStory = UI.duelModal(D);
      A.S.settings.diff = 'realism';
      const duelReal = UI.duelModal(D), evReal = UI.eventModal(Object.assign({}, q));
      A.S.settings.diff = 'story';
      pc.wounds.push({ k: 'lost_hand', until: 0 }, { k: 'bad_knee', until: 0 });
      const prof = UI.profileModal(pc, '');
      const pure = R() === rng1;
      // the event modal is pure as well (measured before the duel changed state)
      return { ev: (ev.match(/Measured:[^<]*/) || [''])[0], duel: (duelStory.match(/The measure\.[^<]*<\/b>[^<]*/) || [''])[0],
        duelOdds: /times in 100/.test(duelStory), realDigits: /times in 100|\d+% · /.test(duelReal) || /Measured:[^<]*\d/.test(evReal), prof: (prof.match(/In a fight:[^<]*/) || [''])[0], pure, evPure,
        tiers: (duelStory.match(/class="chip tier/g) || []).length };
    });
    const ok = /^Measured: you, \w+/.test(r.ev) && /You: \w+ \d+/.test(r.duel) && r.duelOdds && !r.realDigits && /Lost a hand: \w+ \d+ to \w+ \d+/.test(r.prof) && /speed -7/.test(r.prof) && r.pure && r.evPure && r.tiers >= 2;
    return { ok, detail: `event: "${r.ev}"; duel: "${r.duel}" (${r.tiers} tier chips; realism hides digits: ${!r.realDigits}); profile: "${r.prof.slice(0, 160)}"; render pure: event ${r.evPure}, duel and profile ${r.pure}` };
  },

  async flLives(pg) {
    // real lives with the feature: fights met on the ladder, no errors
    const r = await pg.evaluate(() => {
      let met = 0, rolls = 0, lives = 0, dead = 0;
      const conv = new Set(A.FL.CONVERTED.map(x => x.id + ':' + x.i));
      for (const [seed, status] of [[4701, 'peasant'], [4702, 'noble'], [4703, 'serf'], [4704, 'artisan']]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: 16 }); lives++;
        const r0 = T.play(30, { onEvent: v => { const q = A.S.queue[0]; if (q && v && v.choices) for (const c of v.choices) if (conv.has(q.ev + ':' + c.i)) { met++; break; } } });
        if (r0 === 'dead') dead++;
        rolls += Object.keys((A.pc().flags || {}).ev || {}).length;
      }
      return { met, lives, dead };
    });
    return { ok: r.lives === 4, detail: `${r.lives} lives of up to 30 years: ${r.met} events offered a fight that rolls on worth; ${r.dead} died` };
  },
};
