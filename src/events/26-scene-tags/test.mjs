// 26-scene-tags: every event has a scene tag, the event's picture follows it, and the people on the card are dressed for
// it (C8c, D-060; CRITIQUE V17).
//
// LABELS is a sample of 59 events (every 83rd id of the sorted list from the 24th, less one whose text is made at run
// time), each with the scenes a reader would accept for it. It was labelled by hand after the reader's rules were
// written and was not used to tune them (two earlier samples were): the share right here is the honest measure of the
// tags. It is a floor, not a target: an event that reads wrong should say its own scene (`scene: "field"`).
const LABELS = {
  ak_dowry_4: ['home', 'feast', 'field'], ao_ruin_4: ['home'], av_crime_amber: ['sea', 'market'], av_road_kraoth: ['road'], av_wild_wolfwinter: ['wild', 'field', 'tavern'], bd_childhood_friend: ['street', 'home'],
  bd_runner_message: ['road'], bt_drunk_archivist: ['tavern'], cb_ao_portrait_sold: ['home'], cb_pl_doubleagent: ['court', 'home'], ch_fest_slaughter: ['field', 'home'], cm_explorer_pass: ['road', 'wild'],
  cm_land_purveyance: ['field', 'market', 'street'], court_poison: ['court', 'feast', 'home'], ct_tenants: ['field', 'home', 'court'], du_gd_masterpiece: ['workshop'], ec_copyist_job: ['school', 'workshop', 'home'],
  ec_hearth_saucer: ['grave', 'home'], ec_pay_home: ['war', 'home'], ec_teaching_child: ['home', 'workshop'], fm_dwarf_contract: ['home'], go_reckoning: ['war'], hs_h_foal: ['field'], hs_name_abroad: ['tavern'],
  jr_border: ['road'], lf_friend_feud_pick: ['home', 'court', 'street'], lf_moral_lost_child: ['road'], lfx_amb_reign: ['court'], ln_d_crt_friend: ['court'], ln_min_lament: ['church', 'grave', 'home'],
  mat_heirsword_war: ['workshop'], mch_tally_reckoning: ['field', 'home', 'street'], mpe_gi_hraldr_words: ['court', 'wild', 'sea'], mra_ks_holes_sunk: ['sea', 'workshop'], mrb_fm_letters: ['feast', 'home', 'court'],
  mwf_affair_basket: ['home'], ni_gift: ['home'], oa_kin_alone: ['home', 'church'], pa_knight_quest: ['wild', 'road', 'field', 'fight'], pf_gamb_fixed: ['fight', 'tavern', 'street'], pf_stew_steward_post: ['court', 'field', 'home'],
  pl_overlord_garrison: ['street', 'tavern', 'war'], pp_dw_tally: ['workshop'], pp_gi_walrus: ['wild', 'sea'], rk_gar_paper_men: ['war'], rk_underage: ['war'], rl_lu_cup: ['feast', 'court', 'home'],
  sc_ac_clerk: ['school', 'workshop', 'home'], sc_spd_name: ['market', 'street'], sch_win_choose: ['home'], ss_qd_horncup: ['tavern', 'court', 'sickbed', 'market'], ss_tm_ibis: ['war', 'field', 'school'],
  tr_art_altarpiece: ['church', 'workshop'], tr_labor_d_back: ['workshop', 'street', 'field', 'sickbed'], tr_weaver_warp: ['workshop'], wk_hunt_poach: ['wild'], wr_gamble_debt: ['war', 'tavern'],
  ww_ald_ojury: ['court', 'home'], ww_mh_santorariders: ['war'],
};

export default {
  // the tags against a reader's: at least 80 in 100 of a held-out sample (measured 83), every event has one, an
  // event's own `scene` and a queued card's `ctx.scene` come first, and reading is pure and the same twice
  async stTags(pg) {
    const r = await pg.evaluate(LABELS => {
      const SC = A.SCENE, st = JSON.stringify(A.S || null), rng = A.rngState; let right = 0, n = 0; const wrong = [], missing = [];
      for (const id in LABELS) { const e = A.EV[id]; if (!e) { missing.push(id); continue; } n++; const t = SC.tagOf(e); if (LABELS[id].includes(t)) right++; else wrong.push(id + '=' + t); }
      const ids = Object.keys(A.EV), bad = ids.filter(id => !SC.TAGS.includes(SC.tagOf(A.EV[id]))), census = SC.census();
      const again = ids.slice(0, 400).every(id => SC.tagOf(A.EV[id]) === SC.tagOf(A.EV[id]));
      const own = SC.tagOf({ id: 'x', title: 'A day at the forge', text: 'The anvil rings.', scene: 'sea' }), read = SC.tagOf({ id: 'y', title: 'A day at the forge', text: 'The anvil rings in the workshop.' });
      const queued = SC.of({ type: 'event', ev: ids[0], ctx: { scene: 'prison' } }), hostile = SC.of({ type: 'event', ev: ids[0], ctx: { scene: '"><b>' } });
      const fits = ids.every(id => { const e = A.EV[id], t = SC.tagOf(e), s = SC.shapeFor(e); return s === SC.PRINT[t] || SC.FITS[t].includes(s); });
      return { right, n, wrong, missing, total: ids.length, bad: bad.length, census, again, own, read, queued, hostile: SC.TAGS.includes(hostile), fits, pure: JSON.stringify(A.S || null) === st && A.rngState === rng, largest: Math.max(...Object.values(census)) };
    }, LABELS);
    const share = r.n ? r.right / r.n : 0;
    const ok = r.n >= 50 && share >= .8 && r.bad === 0 && r.again && r.own === 'sea' && r.read === 'workshop' && r.queued === 'prison' && r.hostile && r.fits && r.pure && r.largest < r.total * .4 && Object.keys(r.census).length >= 17;
    return { ok, detail: `${r.right} of ${r.n} labelled events tagged as a reader would (${Math.round(share * 100)} in 100; floor 80)${r.missing.length ? ', ' + r.missing.length + ' of the sample are not in this build' : ''}; misread: ${r.wrong.join(', ') || 'none'}; all ${r.total} events have a tag (${r.bad} without); ${Object.entries(r.census).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', ')}; an event's own scene comes first ${r.own === 'sea'}, a card's ${r.queued === 'prison'}; every print fits its tag ${r.fits}; pure ${r.pure}` };
  },

  // each event's picture matches its scene tag: a 60-card sample, each drawn as the game draws it. The print is the
  // tag's own or one that can stand in the scene, the print says its scene, a scene at sea is at sea, and the player's
  // bust on the card is dressed for the scene (best at court, a cloak on the road, working clothes in the fields)
  async stPictures(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 2601, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const SC = A.SCENE, ids = Object.keys(A.EV).sort(), step = Math.floor(ids.length / 60), pc = A.pc(), bad = [], seen = {}, wears = {}; let n = 0, sea = 0, own = 0;
      const st = JSON.stringify(A.S), rng = A.rngState;
      for (let i = 0; i < 60; i++) {
        const e = A.EV[ids[i * step + 5]], q = { type: 'event', ev: e.id, ctx: {} }, tag = SC.of(q); n++;
        const view = { title: typeof e.title === 'string' ? e.title : '', text: typeof e.text === 'string' ? e.text : '' };
        const shape = UI.WOODCUT.shapeOf(q, view), o = UI.SKIES.optsFor(q, view), svg = UI.SKIES.svg(o.shape, o.key, o.month, o);
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
        seen[tag] = (seen[tag] || 0) + 1;
        if (!(shape === SC.PRINT[tag] || SC.FITS[tag].includes(shape))) bad.push(e.id + ': ' + tag + ' drawn as ' + shape);
        if (o.shape !== shape || doc.getAttribute('data-shape') !== (UI.SKIES.SCENE[shape] ? shape : 'none') || doc.getAttribute('data-scene') !== tag) bad.push(e.id + ': the print says ' + doc.getAttribute('data-shape') + '/' + doc.getAttribute('data-scene'));
        if (shape === (A.evShape(e) || '')) own++;
        if (tag === 'sea') { sea++; if (o.sea !== true) bad.push(e.id + ': the sea not at sea'); }
        // the bust on the card
        const keep = UI.FIG.ev; UI.FIG.ev = q;
        try { const L = UI.FIG.look(pc, 'list'); wears[L.wear] = (wears[L.wear] || 0) + 1; if (L.wear !== SC.wearFor(tag)) bad.push(e.id + ': dressed for ' + L.wear + ' in ' + tag); if (!SC.outdoors(tag) && L.headwear === 'hood') bad.push(e.id + ': a hood indoors'); } finally { UI.FIG.ev = keep; }
      }
      // the two the critique named: a farming offer and a cow in a ditch show the fields, not a forge or a bedroom
      const farm = SC.shapeFor({ id: 'f1', title: 'An offer of land', text: 'A farmer offers you a strip of his field for the ploughing.' }), cow = SC.shapeFor({ id: 'f2', title: 'A cow in the ditch', text: 'The cow is down in the ditch by the pasture.' });
      return { n, bad, seen, wears, sea, own, farm, cow, pure: JSON.stringify(A.S) === st && A.rngState === rng, shapes: Object.keys(UI.SKIES.SCENE).length, errors: UI.FIG.errors };
    });
    const ok = r.n === 60 && !r.bad.length && r.farm === 'field' && r.cow === 'field' && r.pure && Object.keys(r.seen).length >= 10 && Object.keys(r.wears).length >= 4 && r.errors === 0;
    return { ok, detail: `${r.n} cards: ${r.bad.length ? 'MISMATCH ' + r.bad.slice(0, 6).join('; ') : 'every print matches its scene tag and every bust is dressed for it'}; scenes ${Object.entries(r.seen).map(([k, v]) => k + ' ' + v).join(', ')}; dress ${Object.entries(r.wears).map(([k, v]) => k + ' ' + v).join(', ')}; ${r.own} keep their own shape's print; a farming offer shows "${r.farm}", a cow in a ditch "${r.cow}"; ${r.shapes} prints; pure ${r.pure}; faults ${r.errors}` };
  },
};
