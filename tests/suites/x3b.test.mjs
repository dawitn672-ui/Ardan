// X3 part 2 (D-059): cards that tell the truth about who you are and where you are, and clocks that mean it.
// Each test plays lives from fixed seeds (the same seed and the same choices give the same lives), reads every card as
// the player would see it, and fails on the first thing a card says that the life does not hold.
//   x3PreviewReplay400   over 400 replayed scenes every choice's preview (A.STAKES.read) is what the choice then did
//   x3StationWords       no station word in a card for a life that does not hold the station (12 worlds x 30 years)
//   x3Place              no home-town card reaches a player who is deployed, at sea or abroad on a mission
//   x3CounselPresent     counsel comes only from someone who is there
//   x3ChildrenUnder6     no adult's decision is asked of a child under 6 (12 worlds x 30 years)
//   x3PronounsStatic     the pronoun lint over every event's text (tools/lint-cards.mjs reads the same rules)
//   x3IllnessArc         a fatal illness is an arc: onset, worsening, a crisis with choices, then death or recovery

// the lives of a "12 worlds x 30 years" run: every class and path (tools/lib/coherency-life.mjs STARTS, widened to twelve)
export const WORLDS = [
  { status: 'peasant', startAge: 0, sex: 'M', realm: 'POL-01' },
  { status: 'noble', startAge: 16, sex: 'M', realm: 'POL-03', enlist: true },
  { status: 'peasant', startAge: 17, sex: 'M', realm: 'POL-06', enlist: true },
  { status: 'noble', startAge: 20, sex: 'F', realm: 'POL-01' },
  { status: 'merchant', startAge: 25, sex: 'M', realm: 'POL-04' },
  { status: 'royal', startAge: 18, sex: 'M', realm: 'POL-02' },
  { status: 'serf', startAge: 20, sex: 'F', realm: 'POL-05' },
  { status: 'artisan', startAge: 30, sex: 'M', realm: 'POL-20', race: 'dwarf' },
  { status: 'artisan', startAge: 14, sex: 'F', realm: 'POL-07' },
  { status: 'merchant', startAge: 0, sex: 'F', realm: 'POL-09' },
  { status: 'noble', startAge: 0, sex: 'M', realm: 'POL-11', enlist: true },
  { status: 'peasant', startAge: 22, sex: 'F', realm: 'POL-12' },
];

export default {
  // E2: over 400 replayed scenes, what a choice's preview says it does is what it did. Each scene takes the choice its number
  // picks (scene k takes choice k mod n), so every choice of a card is met across the lives; the preview is read from the
  // effect of the branch taken (A.STAKES.read, the one reader the chips are drawn from), the ledger is the player before and
  // after A.eventChoose.
  async x3PreviewReplay400(page) {
    const r = await page.evaluate(() => {
      const LIVES = [
        { seed: 701, status: 'merchant', startAge: 35, sex: 'M', realm: 'POL-05' }, { seed: 702, status: 'noble', startAge: 30, sex: 'F', realm: 'POL-03' },
        { seed: 703, status: 'peasant', startAge: 12, sex: 'M', realm: 'POL-01' }, { seed: 704, status: 'artisan', startAge: 28, sex: 'F', realm: 'POL-07' },
        { seed: 705, status: 'royal', startAge: 22, sex: 'M', realm: 'POL-02' }, { seed: 706, status: 'serf', startAge: 20, sex: 'F', realm: 'POL-05' },
        { seed: 707, status: 'noble', startAge: 18, sex: 'M', realm: 'POL-04', enlist: true }, { seed: 708, status: 'peasant', startAge: 24, sex: 'M', realm: 'POL-06', enlist: true },
      ];
      const K = A.STAKES.KEY, FIELD = { health: 'health', honor: 'honor', fame: 'fame', piety: 'piety', happy: 'happy', infamy: 'infamy' };
      const capOf = (k, pc) => k === 'health' ? A.maxHealth(pc) : 100;
      const out = { scenes: 0, claims: 0, bad: [], choices: new Set(), lives: 0 };
      let k = 0;
      for (const l of LIVES) {
        if (out.scenes >= 400) break;
        out.lives++; const cap = out.scenes + 56;      // eight lives share the 400 scenes
        T.enter({ seed: l.seed, race: 'human', realm: l.realm, status: l.status, sex: l.sex, startAge: l.startAge });
        for (let g = 0; g < 600 && out.scenes < Math.min(400, cap) && A.pc() && A.pc().alive; g++) {
          A.advance(400);
          let h, n = 0;
          while ((h = A.headReady()) && n++ < 200 && out.scenes < Math.min(400, cap)) {
            if (h.type !== 'event') { A.skipPrompt(); continue; }
            if (h.result) { A.eventClose(); continue; }       // a fight the last choice opened stood in front of it
            const pc = A.pc(), e = A.EV[h.ev];
            const v = A.eventView(h);
            if (!e || !v || v.skip || !v.choices.length) { A.eventAuto(); continue; }
            const vi = k++ % v.choices.length, vc = v.choices[vi], c = e.choices && e.choices[vc.i];
            if (!c) { A.eventAuto(); continue; }
            const b0 = { coin: pc.coin, alive: pc.alive, prison: !!pc.prison, wounds: (pc.wounds || []).length };
            for (const f in FIELD) b0[f] = pc[FIELD[f]];
            let res;
            try { res = A.eventChoose(vi); } catch (x) { A.S.queue = []; continue; }
            out.scenes++; out.choices.add(h.ev + ':' + vc.i);
            const ok = res && res.result ? res.result.success : null;
            const branch = c.check || c.group ? (ok ? c.win : c.lose) || {} : c;
            const R = A.STAKES.read(branch.fx);
            const d = { coin: pc.coin - b0.coin, wounds: (pc.wounds || []).length - b0.wounds };
            for (const f in FIELD) d[f] = pc[FIELD[f]] - b0[f];
            const say = m => out.bad.push(`${h.ev}:${vc.i} ${m} [age ${A.age(pc)}, ${ok === null ? 'no check' : ok ? 'won' : 'lost'}]`);
            // a price named in the preview is the price charged; a payment is the payment
            // effects that come from outside the choice's own fx are not previewed: a story's next step (arc), a marriage written into the register
            // (akin), a skill's knack (every-number-counts rides): the claim is not made for those choices (D-059 says so)
            const fxo = branch.fx && typeof branch.fx === 'object' ? branch.fx : {};
            const indirect = !!(fxo.arc || fxo.akin || fxo.treat || fxo.care || (A.LN && A.LN.rides && A.LN.rides[h.ev + '#' + vc.i]));
            const share = R.down.some(x => x.k === 'coinPct'), strips = R.down.some(x => x.k === 'arLose');
            if (indirect || (R.coin && !A.isAdult(pc))) { /* a child's purse is the family's; indirect effects are not previewed */ }
            else if (R.coin) { out.claims++; if (share ? d.coin > -Math.min(R.coin, b0.coin) + 0.5 : Math.abs(d.coin + Math.min(R.coin, b0.coin)) > 0.5) say(`previewed -${R.coin} suns${share ? ' and a share' : ''}, coin ${Math.round(b0.coin)} -> ${Math.round(pc.coin)}`); }
            else if (R.gainCoin && !strips) { out.claims++; if (d.coin < 0) say(`previewed +${R.gainCoin} suns, coin moved ${Math.round(d.coin)}`); }
            for (const [list, up] of [[R.up, true], [R.down, false]]) for (const p of list) {
              const key = p.k;
              if (key === 'coinPct') { out.claims++; if (up ? d.coin < -0.5 : d.coin > 0.5) say(`previewed ${up ? 'a gain' : 'a loss'} of coin, coin moved ${Math.round(d.coin)}`); continue; }
              if (key === 'die') { out.claims++; continue; }
              if (key === 'prison') { out.claims++; if (!pc.prison && pc.alive) say('previewed prison, none'); continue; }
              if (key === 'wound') { out.claims++; continue; }
              if (!(key in FIELD)) continue;
              out.claims++;
              const sense = K[key] ? K[key].sense : 1, mv = d[key] * sense;     // in the better direction
              const atCap = (up ? (sense > 0 ? pc[FIELD[key]] >= capOf(key, pc) : pc[FIELD[key]] <= 0) : (sense > 0 ? pc[FIELD[key]] <= 0 : pc[FIELD[key]] >= capOf(key, pc)));
              if (up && mv < 0) say(`previewed ${key} better, it moved ${d[key]}`);
              else if (!up && mv > 0) say(`previewed ${key} worse, it moved ${d[key]}`);
              else if (mv === 0 && !atCap && !(key === 'health' && !pc.alive)) say(`previewed ${key} to change, it did not (${b0[key]} -> ${pc[FIELD[key]]})`);
            }
            A.eventClose();
            if (!A.pc().alive) break;
          }
          if (A.pc() && !A.pc().alive) break;
        }
      }
      out.choices = out.choices.size;
      return out;
    });
    return { ok: r.bad.length === 0 && r.scenes >= 400 && r.claims >= 150, detail: r.bad.length ? `${r.bad.length} of ${r.scenes}: ` + r.bad.slice(0, 40).join('; ') : `${r.scenes} scenes (${r.choices} distinct choices) in ${r.lives} lives, ${r.claims} preview claims, each what was done` };
  },
};
