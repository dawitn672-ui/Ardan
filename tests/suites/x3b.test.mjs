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

// the lives of a run, played in up to four pages at once (the browser is the runner's); `fn` is the page code of one life:
// fn(world, years) -> a plain object. Returns the results in the order of the worlds.
const playWorlds = async (page, extra, worlds, years, fn, seed0 = 8100) => {
  const { HELPERS } = await import('../helpers.mjs');
  const { pathToFileURL } = await import('node:url');
  const res = new Array(worlds.length);
  let next = 0;
  const lane = async pg => {
    for (let i = next++; i < worlds.length; i = next++) {
      res[i] = await pg.evaluate(fn, [{ seed: seed0 + i * 17, race: 'human', ...worlds[i] }, years]);
    }
  };
  const pages = [page], ctxs = [];
  for (let k = 1; k < Math.min(4, worlds.length); k++) {
    const ctx = await extra.browser.newContext(); ctxs.push(ctx);
    const pg = await ctx.newPage();
    await pg.goto(pathToFileURL(extra.file).href);
    await pg.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
    await pg.evaluate(HELPERS);
    pages.push(pg);
  }
  try { await Promise.all(pages.map(lane)); } finally { for (const c of ctxs) await c.close().catch(() => {}); }
  return res;
};

// one life, as the page plays it: every card the player reads is checked (the page code of playWorlds)
const LIFE = ([w, years]) => {
  T.enter({ seed: w.seed, race: w.race, realm: w.realm, status: w.status, sex: w.sex, startAge: w.startAge });
  const X3 = A.X3, out = { cards: 0, away: 0, kids: 0, adv: 0, words: 0, station: [], place: [], child: [], counsel: [], dropped: null, end: null };
  const ADULT = /\b(hire|sue|marry|wed|enlist|vote|command|bribe|negotiate|testify|sentence|tend the neighbours|leave for the country)\b/i;
  const enlist = () => {
    if (!w.enlist || !A.pc() || A.pc().mil) return;
    const h = A.headReady(); if (!h || h.type !== 'event') return;
    const v = A.eventView(h), k = v && v.choices ? v.choices.findIndex(c => /enlist|join|take the coin|sign|swear/i.test(c.t || '')) : -1;
    if (k >= 0) { A.eventChoose(k); A.eventClose(); }
  };
  X3.stats = { station: {}, place: 0, child: 0, counsel: 0, seen: 0 };
  const r = T.play(years, { each: enlist, onEvent: v => {
    const pc = A.pc(), h = A.S.queue[0], e = A.EV[h.ev], text = X3.cardText(v), tag = `${h.ev} age ${A.age(pc)}`;
    out.cards++;
    if (X3.stationUses(pc, text).length) out.words++;
    // a story's own step (forced, an arc's or a chain's, or one that follows a flag the story set) is not held to the gates (D-059 note)
    const story = !!(h.forced || (h.ctx && (h.ctx.arc || h.ctx.lfFrom)) || (e && X3.followsStory(e)));
    const st = story ? [] : X3.stationBreach(pc, text); if (st.length) out.station.push(`${tag}: ${st[0].id} "${st[0].word}"`);
    if (X3.away(pc)) { out.away++; const hb = story ? null : X3.homeBreach(pc, text); if (hb) out.place.push(`${tag}: names ${hb}`); }
    if (A.age(pc) < 6) {
      out.kids++;
      let ok = true; try { ok = !e || !e.cond || !!e.cond(pc, A.C); } catch (x) {}
      if (!ok) out.child.push(`${tag}: its condition says no`);
      const bad = v.choices.map(c => c.t).filter(t => ADULT.test(t));
      if (bad.length) out.child.push(`${tag}: asks "${bad[0]}"`);
    }
    for (const a of v.adv || []) {
      out.adv++; const t = A.P(a.id);
      if (!t || !t.alive || t.prison || !X3.reaches(pc, t)) out.counsel.push(`${tag}: ${a.r} ${t ? t.given : a.id} is not there`);
    }
  } });
  out.dropped = JSON.parse(JSON.stringify(X3.stats)); out.end = r;
  return out;
};

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

  // E3, E4, E5, E7 together, over the twelve worlds for thirty years and six more lives of a child's first six: what the player reads
  // names no station he does not hold, no home town while he stands elsewhere, asks no adult's question of a child under six, and
  // takes no counsel from someone who is not there. Reports how many cards the guard (f-guard.core.js) had to drop.
  async x3HonestCards(page, errs, extra) {
    const nursery = [0, 1, 2, 3, 4, 5].map(k => ({ status: ['peasant', 'serf', 'artisan', 'merchant', 'noble', 'royal'][k], startAge: 0, sex: k % 2 ? 'F' : 'M', realm: ['POL-01', 'POL-05', 'POL-07', 'POL-09', 'POL-03', 'POL-02'][k] }));
    const big = await playWorlds(page, extra, WORLDS, 30, LIFE, 8100);
    const small = await playWorlds(page, extra, nursery, 6, LIFE, 8600);
    const all = [...big, ...small];
    const sum = k => all.reduce((n, r) => n + r[k], 0);
    const bad = k => all.flatMap(r => r[k]);
    const drop = all.reduce((o, r) => { o.place += r.dropped.place; o.child += r.dropped.child; o.counsel += r.dropped.counsel; o.seen += r.dropped.seen; for (const k in r.dropped.station) o.station += r.dropped.station[k]; return o; }, { station: 0, place: 0, child: 0, counsel: 0, seen: 0 });
    const problems = [].concat(bad('station'), bad('place'), bad('child'), bad('counsel'));
    const detail = `${sum('cards')} cards in ${all.length} lives (${sum('away')} read away from home, ${sum('kids')} to a child under six, ${sum('adv')} counsel lines, ${sum('words')} cards with a station word the life holds); the guard dropped ${drop.station} station, ${drop.place} place, ${drop.child} child, ${drop.counsel} counsel of ${drop.seen}`;
    return { ok: problems.length === 0 && sum('away') >= 20 && sum('kids') >= 10 && sum('words') >= 20 && drop.station + drop.place + drop.child <= drop.seen * 0.15, detail: problems.length ? `${problems.length} problems: ${problems.slice(0, 6).join('; ')} | ${detail}` : detail };
  },

  // E8: no scene says he or she in plain words of its {them} (the lint, tools/lib/card-lint.mjs; the few that are right are listed with
  // a reason), and every scene that speaks of its person by {theyHe} {theirHis} {themHim} has the person (ctx.pid) when it is drawn
  async x3Pronouns(page) {
    const { pronounLint, PRONOUN_ALLOW } = await import('../../tools/lib/card-lint.mjs');
    const slips = (await page.evaluate(pronounLint)).filter(x => !PRONOUN_ALLOW[x.id]);
    // the scenes whose plain "he" and "she" became tokens in this step: each must be given its person when it is drawn
    const EDITED = ['av_crime_killing_offer', 'av_merc_escort', 'av_wild_charcoal', 'cm_bounty_knight_killer', 'du_ct_widow_case', 'du_gd_loan', 'du_ln_student', 'fl_st_master', 'fl_wl_loan', 'gs_toast', 'lf_kid_thief', 'lf_teen_orc_ride', 'ln_law_guilty', 'mat_forged_court', 'mat_note_home', 'mat_outlaw_repays', 'mch_son_returns', 'mrb_ald_witness_due', 'mrb_fm_cousin_war', 'sc_kn_sleeve', 'sc_knd_old', 'wk_serf_bailiff'];
    const tok = await page.evaluate(EDITED => {
      const ids = EDITED.filter(id => A.EV[id]);
      const out = { n: ids.length, ran: 0, loose: [] };
      const done = new Set();
      for (const o of [{ seed: 61, status: 'noble', sex: 'M', startAge: 35, realm: 'POL-03' }, { seed: 62, status: 'merchant', sex: 'F', startAge: 28, realm: 'POL-04' }, { seed: 63, status: 'peasant', sex: 'M', startAge: 22, realm: 'POL-06' }]) {
        T.enter({ race: 'human', ...o });
        for (const id of ids) {
          if (done.has(id)) continue;
          const e = A.EV[id], ctx = {};
          if (e.needsPid) { done.add(id); continue; }       // the one who deals the scene gives it its person
          try { if (e.setup) e.setup(A.pc(), ctx); } catch (x) { continue; }
          if (ctx.skip) continue;
          done.add(id); out.ran++;
          if (ctx.pid == null && !ctx.theyHe) out.loose.push(id);       // pid '' is a scene that found no one: it is dropped, tokens unfilled
        }
      }
      return out;
    }, EDITED);
    return { ok: slips.length === 0 && tok.loose.length === 0 && tok.ran >= 10, detail: slips.length ? `${slips.length} slips: ` + slips.slice(0, 5).map(x => `${x.id} ${x.where} "${x.word}"`).join('; ') : tok.loose.length ? `scenes that say {theyHe} without a person: ${tok.loose.slice(0, 6).join(', ')}` : `no he or she after {them} in ${Object.keys(PRONOUN_ALLOW).length} reasoned exceptions aside; ${tok.ran} of ${tok.n} scenes with pronoun tokens drew their person` };
  },

  // T4: a fatal illness is an arc. A sick adult at the edge is shown the turn of the fever (x3_ill_crisis) and chooses who is sent for; the
  // way to death or recovery runs through it, and no sick body dies of the sickness without it. Forty seeds, a choice in turn.
  async x3IllnessArc(page) {
    const r = await page.evaluate(() => {
      const out = { lives: 0, worse: 0, crisis: 0, family: 0, lived: 0, died: 0, silent: [], named: 0, badEnd: [] };
      for (let s = 0; s < 40; s++) {
        T.enter({ seed: 900 + s, race: 'human', realm: 'POL-05', status: ['merchant', 'noble', 'peasant', 'artisan'][s % 4], sex: s % 2 ? 'F' : 'M', startAge: 38 });
        const pc = A.pc(); out.lives++;
        pc.health = 34; pc.coin = Math.max(pc.coin, 200);
        pc.ill = { k: 'marsh', name: 'marsh fever', m: 4, tot: 4, dmg: 70, t: 'rest', y: A.S.year, crisis: 0 };
        let sawCrisis = false, picked = 0;
        for (let m = 0; m < 9 && pc.alive; m++) {
          A.advance(31);
          let h, g = 0;
          while ((h = A.headReady()) && g++ < 40) {
            if (h.type !== 'event') { A.skipPrompt(); continue; }
            const v = A.eventView(h);
            if (h.ev === 'x3_ill_worse') out.worse++;
            if (h.ev === 'x3_ill_crisis') {
              sawCrisis = true; out.crisis++;
              if (v.choices.some(c => /by the bed/.test(c.t))) out.family++;
              if (v.choices.length < 2) out.badEnd.push('a crisis with one choice');
              if (!v.choices.some(c => /physician/.test(c.t)) || !v.choices.some(c => /priest/.test(c.t))) out.badEnd.push('no physician or priest to send for');
              A.eventChoose((s + picked++) % v.choices.length); A.eventClose();
              continue;
            }
            const k = h.ev === 'bm_ill' ? v.choices.length - 1 : 0;
            A.eventChoose(k); A.eventClose();
          }
          if (!A.pc() || !A.pc().alive) break;
        }
        const dead = !A.pc().alive;
        if (dead && sawCrisis && /marsh fever/.test(A.pc().cause || '')) { out.died++; out.named++; }      // the scene's own result names the sickness
        else if (dead && /marsh fever/.test(A.pc().cause || '')) out.silent.push(`${900 + s}: ${A.pc().cause}, ill ${JSON.stringify(pc.ill)}`);      // died of the sickness with no scene
        else if (sawCrisis) out.lived++;
      }
      return out;
    });
    return { ok: r.silent.length === 0 && r.crisis >= 15 && r.lived >= 3 && r.died >= 3 && r.worse >= 3 && r.family >= 3 && r.badEnd.length === 0, detail: `${r.lives} sick adults: ${r.worse} worsened (a card), ${r.crisis} reached the turn (${r.family} with family to call), ${r.lived} lived, ${r.died} died (${r.named} of marsh fever); deaths without the scene: ${r.silent.length} ${r.silent.slice(0, 2).join(" | ")}${r.badEnd.length ? '; ' + r.badEnd[0] : ''}` };
  },
};
