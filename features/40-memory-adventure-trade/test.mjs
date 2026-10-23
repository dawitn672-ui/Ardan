// Browser test for the adventure-and-trade memory pack (features/40-memory-adventure-trade). See README.md.
//
// matMemory checks, against the built page:
//   1. static: every one of the chunk's 33 orphan flags is read in some event's cond; every mat_ flag this pack sets is
//      read by a cond or setup (no new orphans); all 60 mat_ events are registered; every cond reads its flag through
//      C.flag and gates on years since (A.S.year - p.flags.x, or p.flags.ev for the one flag that stores a bounty);
//      weights are 2 or 3 and every event fires once; every event has a branch that leaves a lasting mark;
//   2. for each event, a fixture character who carries the memory:
//      - the cond is closed without the memory, closed the year the memory was made, and open N years later;
//      - A.evFit does not hide it from that character;
//      - the view renders with no raw {token}, text <= 80 words, labels <= 12, and recalls the original moment
//        (fixture keywords such as "pewter", "Ratrock", "third stone" must appear in the rendered text);
//      - rendering the same state twice gives the same view (setup is deterministic);
//      - every choice is offered and taken, checks forced to win and to lose, with no engine error, no raw token,
//        no non-finite stat, and at most 45 words of prose (engine notes in brackets are not counted);
//      - no text or result uses the house tics ("looks at you a long time", "for the rest of your life", "Nobody");
//   3. each 2-step arc: take the first event's arc choice, check the second step is still closed, let the years pass,
//      then the second event opens and renders for the same character, with the same person where one carries over.
// Fixtures live in one function so live-probe.mjs can reuse them: it runs in the page and sets window.__matFix.
export function installFixtures() {
  // ---- fixture helpers
  const H = {
    person(p, o) {
      o = o || {};
      const race = o.race || p.race, sex = o.sex || 'F';
      const k = A.newPerson({ given: A.givenName(p.cult, sex), sex, race, realm: p.realm, cult: p.cult, faith: p.faith, born: A.S.year - Math.round((o.age != null ? o.age : A.age(p))), status: o.status || 'peasant', home: p.home });
      k.occ = o.occ || 'a neighbor';
      return k;
    },
    kid(p, age, sex) {
      const k = H.person(p, { age, sex: sex || 'F', status: p.status });
      k.parents = [p.id]; p.children.push(k.id); A.link(p, k, 'child', 50, p.sex === 'M' ? 'father' : 'mother');
      return k;
    },
    link(p, k, type, year) { A.link(p, k, type, 30, type); p.rel[k.id].since = year; if (k.rel[p.id]) k.rel[p.id].since = year; return k; },
    prov(p, test) { const t = A.S.prov.find(x => x.owner === p.realm && test(x)); if (t) p.home = t.id; return !!t; },
    town(p) { return H.prov(p, x => x.town >= 8000); },
    coast(p) { return H.prov(p, x => x.coast); },
    terr(p, ...ts) { return H.prov(p, x => ts.includes(x.terr)); },
    move(p, realm) { p.realm = realm; H.prov(p, () => true); },
    job(p, c, rk) { p.job = { c, r: rk == null ? 1 : rk, y: 3, perf: 55, rep: 55 }; },
    mother(p) { if (!(p.parents[1] && A.P(p.parents[1]) && A.P(p.parents[1]).alive)) { const m = H.person(p, { sex: 'F', age: A.age(p) + 25 }); p.parents[1] = m.id; A.link(p, m, 'mother', 40, 'child'); } },
    work(p, Y, t) { p.works = p.works || []; p.works.push({ y: Y, t }); },
    who(p, key, o) { p.flags[key] = H.person(p, o).id; },
  };
  const SMITH = p => H.job(p, 'smith', 3);
  // [event id, fixture]: o = newGame options, f = { flag: years ago } (the first is the memory under test),
  // ev = { setter event id: years ago } (the seen-year that tells which setter made the memory),
  // gate = how to make the memory "this year" when the flag is not a year, prep = extra state, recall = words the view must show
  const FIX = [
    ['mat_reeve_list', { f: { av_secret: 6 }, recall: ['packet', 'reeve'] }],
    ['mat_reeve_men', { f: { mat_reeve_bled: 3 }, prep: p => H.who(p, 'mat_reeve_who', { status: 'gentry', age: 50 }), recall: ['purse', 'steward'] }],
    ['mat_neck_bales', { o: { realm: 'POL-14' }, f: { av_neckbribe: 3 }, recall: ['grey channel', 'toll-clerk'] }],
    ['mat_neck_box', { o: { realm: 'POL-14' }, f: { mat_neck_runner: 2 }, recall: ['station'] }],
    ['mat_forger_paper', { f: { av_forger: 5 }, ev: { av_lost_pass: 5 }, prep: p => { p.literate = true; }, recall: ['pewter', 'bridge-gate'] }],
    ['mat_forger_paper', { o: { realm: 'POL-16' }, f: { av_forger: 5 }, ev: { av_crime_exchange: 5 }, prep: p => { p.literate = true; }, recall: ['counting-house', 'sixty suns'] }],
    ['mat_forged_court', { f: { mat_forged_freedom: 3 }, prep: p => { H.who(p, 'mat_forged_who', { sex: 'F', age: 45 }); p.coin = 100; }, recall: ["freedman's paper"] }],
    ['mat_courier_bid', { f: { av_courier: 4 }, recall: ['four days', 'forty suns'] }],
    ['mat_courier_relay', { f: { mat_courier_trusted: 4 }, prep: p => { H.who(p, 'mat_courier_who', { sex: 'M', age: 55, status: 'merchant' }); p.coin = 150; }, recall: ['riders'] }],
    ['mat_road_child', { o: { startAge: 40 }, f: { av_traveled: 22 }, ev: { av_wanderjahr: 22 }, prep: p => H.kid(p, 15, 'M'), recall: ['tinker', 'your own son'] }],
    ['mat_road_child', { o: { startAge: 30 }, f: { av_traveled: 15 }, ev: { av_teen_runaway_sea: 15 }, recall: ["ship's boy", "neighbour's child"] }],
    ['mat_road_return', { f: { mat_sent_road: 3 }, prep: p => { H.who(p, 'mat_road_who', { sex: 'M', age: 19 }); p.coin = 50; }, recall: ['knife'] }],
    ['mat_note_home', { o: { startAge: 25 }, f: { av_traveled: 10 }, ev: { av_teen_runaway_sea: 10 }, prep: p => H.mother(p), recall: ['note', "ship's boy"] }],
    ['mat_delve_steel', { f: { av_opened_delve: 4 }, prep: p => { p.coin = 100; }, recall: ['ivy', 'ingots'] }],
    ['mat_bounty_goats', { f: { av_bounty_beast: 35 }, ev: { av_wild_village_bounty: 4 }, gate: (p, Y) => { p.flags.ev.av_wild_village_bounty = Y; }, recall: ['sheepfold', '35 suns'] }],
    ['mat_poacher_court', { f: { av_poacher: 4 }, prep: (p, Y) => { H.link(p, H.person(p, { sex: 'M', age: 35 }), 'friend', Y - 4); p.coin = 50; }, recall: ['stag', 'haunch'] }],
    ['mat_poacher_court', { f: { av_poacher: 4 }, prep: p => { p.coin = 50; }, recall: ['stag', "lord's chase"] }],
    ['mat_verderer_coat', { f: { av_poacher: 6 }, recall: ['haunch', 'first light'] }],
    ['mat_verderer_boy', { f: { mat_verderer: 2 }, recall: ['green coat', 'haunch'] }],
    ['mat_verderer_boy', { f: { mat_verderer_soft: 3 }, recall: ['looked away', 'haunch'] }],
    ['mat_aurochs_pit', { f: { av_aurochs_trail: 3 }, prep: p => H.terr(p, 'forest', 'plains'), recall: ['oak glade', 'black bulls'] }],
    ['mat_outlaw_notice', { f: { av_outlaw_known: 4 }, recall: ['charcoal', 'calluses'] }],
    ['mat_outlaw_repays', { f: { mat_outlaw_warned: 3 }, prep: p => H.who(p, 'mat_outlaw_who', { sex: 'M', age: 40 }), recall: ['notice on the church door'] }],
    ['mat_watch_staff', { f: { av_wetwatch: 5 }, prep: (p, Y) => { H.town(p); H.link(p, H.person(p, { sex: 'M', age: 30 }), 'friend', Y - 5); p.coin = 30; }, recall: ['five suns a month'] }],
    ['mat_watch_staff', { f: { av_wetwatch: 5 }, prep: p => { H.town(p); p.coin = 30; }, recall: ['crooked lamp', 'dice-master'] }],
    ['mat_castaway_boots', { f: { av_castaway: 3 }, prep: p => H.town(p), recall: ["dead man's boots", 'island'] }],
    ['mat_widow_son', { f: { mat_widow_told: 4 }, prep: p => H.who(p, 'mat_widow_who', { sex: 'F', age: 45 }), recall: ['boots', 'island'] }],
    ['mat_castaway_smoke', { f: { av_castaway: 6 }, prep: p => H.job(p, 'sailor', 1), recall: ["dead man's boots", 'hill'] }],
    ['mat_mutiny_captain', { f: { av_mutineer: 5 }, prep: (p, Y) => { H.job(p, 'sailor', 1); H.link(p, H.person(p, { sex: 'M', age: 30 }), 'friend', Y - 5); p.coin = 100; }, recall: ['cask of water', 'showed you the knife'] }],
    ['mat_mutiny_captain', { f: { av_mutineer: 5 }, prep: p => { H.coast(p); p.coin = 100; }, recall: ['cask of water', 'biscuit'] }],
    ['mat_old_name', { f: { mat_false_name: 3 }, recall: ['admiralty clerk'] }],
    ['mat_cripple_share', { o: { realm: 'POL-33' }, f: { av_corsair: 4 }, prep: p => H.job(p, 'pirate', 1), recall: ['six hundred', 'articles'] }],
    ['mat_corsair_dice', { o: { realm: 'POL-33' }, f: { av_corsair: 6 }, prep: p => H.job(p, 'pirate', 1), recall: ['drowned queen', 'articles'] }],
    ['mat_redsail_cove', { o: { realm: 'POL-33' }, f: { av_redsail: 3 }, prep: p => H.job(p, 'pirate', 1), recall: ['ratrock', 'ima redsail'] }],
    ['mat_redsail_price', { o: { realm: 'POL-33' }, f: { mat_redsail_sailed: 2 }, prep: p => { p.coin = 200; }, recall: ['ima redsail'] }],
    ['mat_turncoat_captain', { f: { av_turncoat: 5 }, ev: { av_merc_switch: 5 }, prep: (p, Y) => { H.link(p, H.person(p, { sex: 'M', age: 50 }), 'enemy', Y - 5); p.coin = 100; }, recall: ['double pay', 'across the lines'] }],
    ['mat_postern_pies', { f: { av_turncoat: 6 }, ev: { av_merc_postern: 6 }, prep: p => { p.coin = 100; }, recall: ['third stone', 'postern'] }],
    ['mat_hold_surety', { o: { realm: 'POL-10' }, f: { av_hold_book: 4 }, prep: p => { if (p.realm !== 'POL-10') H.move(p, 'POL-10'); }, recall: ['factor', 'three days'] }],
    ['mat_surety_due', { f: { mat_surety: 2 }, prep: p => { H.who(p, 'mat_surety_who', { sex: 'M', age: 35, status: 'merchant' }); p.coin = 200; }, recall: ['small mark'] }],
    ['mat_journeyman_door', { o: { status: 'artisan', startAge: 30 }, f: { tr_wandered: 6 }, prep: p => H.job(p, 'smith', 2), recall: ['hardest master'] }],
    ['mat_journeyman_master', { o: { status: 'artisan', startAge: 40 }, f: { mat_took_journeyman: 5 }, prep: p => { H.job(p, 'smith', 3); H.who(p, 'mat_journeyman_who', { age: 25, status: 'artisan' }); }, recall: ['loft'] }],
    ['mat_council_bread', { o: { status: 'artisan', startAge: 45 }, f: { tr_council: 3 }, prep: p => { SMITH(p); p.coin = 150; }, recall: ['council', 'craftsmen'] }],
    ['mat_bread_merchants', { o: { status: 'artisan', startAge: 45 }, f: { mat_bread_fixed: 2 }, prep: p => SMITH(p), recall: ['assize'] }],
    ['mat_council_rival', { o: { status: 'artisan', startAge: 45 }, f: { tr_council: 5 }, prep: (p, Y) => { SMITH(p); H.link(p, H.person(p, { sex: 'M', age: 55, status: 'merchant' }), 'rival', Y - 5); }, recall: ['guild seat'] }],
    ['mat_council_rival', { o: { status: 'artisan', startAge: 45 }, f: { tr_council: 5 }, prep: p => SMITH(p), recall: ['guild seat'] }],
    ['mat_heirsword_war', { o: { status: 'artisan', startAge: 45 }, f: { tr_smith_heirsword: 6 }, prep: (p, Y) => { SMITH(p); H.work(p, Y - 6, "the heir's sword of Aldmark"); }, recall: ["heir's girding", 'alone, over a winter'] }],
    ['mat_heirsword_war', { o: { status: 'artisan', startAge: 45 }, f: { tr_smith_heirsword: 6 }, prep: (p, Y) => { SMITH(p); H.work(p, Y - 6, "the heir's sword of Aldmark, made with a brother smith"); }, recall: ['brother smith'] }],
    ['mat_heirsword_war', { o: { status: 'artisan', startAge: 45 }, f: { tr_smith_heirsword: 6 }, prep: p => SMITH(p), recall: ["heir's girding"] }],
    ['mat_heirsword_mark', { o: { status: 'artisan', startAge: 45 }, f: { tr_smith_heirsword: 4 }, prep: p => SMITH(p), recall: ["heir's sword"] }],
    ['mat_mark_broke', { o: { status: 'artisan', startAge: 45 }, f: { mat_mark_sold: 2 }, prep: p => { SMITH(p); p.coin = 150; }, recall: ['great workshop'] }],
    ['mat_mark_culvert', { o: { status: 'artisan', startAge: 35 }, f: { tr_mason_marked: 7 }, prep: p => { H.job(p, 'mason', 2); p.coin = 60; }, recall: ['keystone', 'lodge'] }],
    ['mat_mark_passed', { o: { status: 'artisan', startAge: 50 }, f: { tr_mason_marked: 20 }, prep: p => H.job(p, 'mason', 3), recall: ['twenty years', 'mark'] }],
    ['mat_drawing_buyer', { o: { status: 'artisan', startAge: 35 }, f: { tr_mason_drawing: 4 }, prep: p => H.job(p, 'mason', 2), recall: ['loose stone', 'behind the wine'] }],
    ['mat_strongroom_empty', { o: { status: 'artisan', startAge: 35 }, f: { mat_drawing_sold: 2 }, prep: p => { H.job(p, 'mason', 2); p.coin = 200; }, recall: ['soft hands'] }],
    ['mat_drawing_attainder', { o: { status: 'artisan', startAge: 40 }, f: { tr_mason_drawing: 7 }, prep: p => H.job(p, 'mason', 2), recall: ['strongroom', 'behind the wine'] }],
    ['mat_banner_torn', { o: { status: 'artisan', startAge: 45 }, f: { tr_weaver_banner: 5 }, prep: p => H.job(p, 'weaver', 3), recall: ['great banner', 'rags'] }],
    ['mat_xbow_order', { o: { status: 'artisan', startAge: 30 }, f: { tr_bow_xbow: 4 }, prep: p => H.job(p, 'bowyer', 2), recall: ['trigger', 'journeyman'] }],
    ['mat_royal_bow_order', { o: { status: 'artisan', startAge: 45 }, f: { tr_bow_royal: 5 }, prep: p => H.job(p, 'bowyer', 3), recall: ['gift bow'] }],
    ['mat_royal_bow_order', { o: { status: 'artisan', startAge: 45 }, f: { tr_bow_royal: 5 }, prep: (p, Y) => { H.job(p, 'bowyer', 3); H.work(p, Y - 5, 'the twin bows of the two kings'); }, recall: ['twin bows'] }],
    ['mat_gruit_court', { o: { status: 'artisan', startAge: 30 }, f: { tr_brew_hopped: 4 }, prep: p => { H.job(p, 'brewer', 1); p.coin = 60; }, recall: ['gruit', 'hopped ale'] }],
    ['mat_hop_garden', { o: { status: 'artisan', startAge: 35 }, f: { mat_hops_free: 3 }, prep: p => { H.job(p, 'brewer', 2); p.coin = 100; }, recall: ['judgment'] }],
    ['mat_altar_donor', { o: { status: 'artisan', startAge: 40 }, f: { tr_art_altar: 6 }, prep: p => H.job(p, 'artist', 2), recall: ['donors', 'altarpiece'] }],
    ['mat_feast_letter', { o: { status: 'artisan', startAge: 45 }, f: { tr_cook_greatfeast: 4 }, prep: (p, Y) => { H.job(p, 'cook', 3); H.work(p, Y - 4, 'the smoking peacock of the feast of 1101'); }, recall: ['great feast', 'peacock'] }],
    ['mat_feast_letter', { o: { status: 'artisan', startAge: 45 }, f: { tr_cook_greatfeast: 4 }, prep: p => H.job(p, 'cook', 3), recall: ['great feast', 'what went wrong'] }],
    ['mat_fireoil_sweats', { o: { status: 'artisan', startAge: 40 }, f: { tr_eng_fireoil: 4 }, prep: p => H.job(p, 'engineer', 2), recall: ['fire-oil', 'engine store'] }],
    ['mat_greatwork_test', { o: { status: 'artisan', startAge: 50 }, f: { tr_eng_greatwork: 6 }, prep: (p, Y) => { H.job(p, 'engineer', 3); H.work(p, Y - 6, 'the harbor chain of Kingsmere'); }, recall: ['chain', 'merchantmen'] }],
    ['mat_greatwork_test', { o: { status: 'artisan', startAge: 50 }, f: { tr_eng_greatwork: 6 }, prep: (p, Y) => { H.job(p, 'engineer', 3); H.work(p, Y - 6, 'the great sluice of Kingsmere'); }, recall: ['sluices', 'dam'] }],
    ['mat_greatwork_audit', { o: { status: 'artisan', startAge: 50 }, f: { tr_eng_greatwork: 5 }, prep: p => { H.job(p, 'engineer', 3); p.coin = 300; }, recall: ['great work'] }],
    ['mat_serv_letter', { f: { tr_serv_knows: 4 }, ev: { tr_serv_letter: 4 }, prep: p => H.job(p, 'servant', 1), recall: ['plain wax', 'warm knife'] }],
    ['mat_serv_guest', { f: { tr_serv_knows: 3 }, ev: { tr_serv_great_guest: 3 }, prep: p => H.job(p, 'servant', 1), recall: ['high table', 'sweet course'] }],
    ['mat_loyal_debts', { f: { tr_serv_loyal: 4 }, prep: p => { H.job(p, 'servant', 1); p.coin = 50; }, recall: ['great house', 'will'] }],
    ['mat_cup_again', { f: { tr_serv_saved: 4 }, prep: p => H.job(p, 'servant', 1), recall: ['cup', 'stumbled'] }],
  ];
  // 2-step arcs: [first event, choice index, force win (true/false/null), second event, years later, person carries over]
  const ARCS = [
    ['mat_reeve_list', 0, true, 'mat_reeve_men', 3, true], ['mat_neck_bales', 0, true, 'mat_neck_box', 2, false],
    ['mat_forger_paper', 0, true, 'mat_forged_court', 3, true], ['mat_forger_paper', 1, true, 'mat_forged_court', 3, true],
    ['mat_courier_bid', 0, true, 'mat_courier_relay', 4, true], ['mat_road_child', 0, null, 'mat_road_return', 3, true],
    ['mat_road_child', 2, false, 'mat_road_return', 3, true], ['mat_verderer_coat', 0, null, 'mat_verderer_boy', 2, false],
    ['mat_verderer_coat', 1, null, 'mat_verderer_boy', 2, false], ['mat_outlaw_notice', 1, null, 'mat_outlaw_repays', 3, true],
    ['mat_castaway_boots', 0, null, 'mat_widow_son', 4, false], ['mat_mutiny_captain', 2, null, 'mat_old_name', 3, false],
    ['mat_redsail_cove', 0, true, 'mat_redsail_price', 2, false], ['mat_redsail_cove', 0, false, 'mat_redsail_price', 2, false],
    ['mat_hold_surety', 0, null, 'mat_surety_due', 2, true], ['mat_journeyman_door', 0, null, 'mat_journeyman_master', 5, true],
    ['mat_journeyman_door', 1, null, 'mat_journeyman_master', 5, true], ['mat_council_bread', 0, true, 'mat_bread_merchants', 2, false],
    ['mat_heirsword_mark', 1, null, 'mat_mark_broke', 2, false], ['mat_drawing_buyer', 0, null, 'mat_strongroom_empty', 2, false],
    ['mat_gruit_court', 0, true, 'mat_hop_garden', 3, false],
  ];

  window.__matFix = { H, FIX, ARCS, SMITH };
}

export default {
  async matMemory(pg) {
    await pg.evaluate(installFixtures);
    const r = await pg.evaluate(() => {
      const CHUNK = ['av_secret', 'av_neckbribe', 'av_forger', 'av_courier', 'av_traveled', 'av_opened_delve', 'av_bounty_beast', 'av_poacher',
        'av_aurochs_trail', 'av_outlaw_known', 'av_wetwatch', 'av_castaway', 'av_mutineer', 'av_corsair', 'av_redsail', 'av_turncoat',
        'av_hold_book', 'tr_wandered', 'tr_council', 'tr_smith_heirsword', 'tr_mason_marked', 'tr_mason_drawing', 'tr_weaver_banner',
        'tr_bow_xbow', 'tr_bow_royal', 'tr_brew_hopped', 'tr_art_altar', 'tr_cook_greatfeast', 'tr_eng_fireoil', 'tr_eng_greatwork',
        'tr_serv_knows', 'tr_serv_loyal', 'tr_serv_saved'];
      const EXPECT_EVENTS = 60;
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const prose = s => String(s || '').replace(/\([^)]*\)/g, ' ').replace(/They call you [^.]*now\./g, ' ');
      const RAW = /\{[A-Za-z0-9_.]+\}/;
      const TICS = /looks at you a long time|for the rest of your life|(^|[.!?]\s+)Nobody\b/i;
      const out = { dump: {}, problems: [], events: 0, fixtures: 0, gated: 0, needMemory: 0, recalled: 0, deterministic: 0, branches: 0, arcs: 0, unread: [] };
      const bad = m => out.problems.push(m);
      const src = f => (typeof f === 'function' ? f.toString() : JSON.stringify(f || ''));

      // ---- 1: static reads, registration, shape
      const condSrc = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : ''));
      for (const f of CHUNK) if (!condSrc.some(s => s.includes(`"${f}"`) || s.includes(`'${f}'`) || s.includes('flags.' + f))) out.unread.push(f);
      const mine = Object.keys(A.EV).filter(k => k.startsWith('mat_'));
      out.events = mine.length;
      const setByMe = new Set();
      for (const id of mine) for (const c of A.EV[id].choices || []) for (const b of [c, c.win, c.lose]) {
        if (!b || !b.fx) continue;
        for (const m of src(b.fx).matchAll(/"?flag"?\s*:\s*"(mat_[A-Za-z0-9_]+)"|flags\.(mat_[A-Za-z0-9_]+)\s*=(?!=)/g)) setByMe.add(m[1] || m[2]);
      }
      const readSrc = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : '') + (e.setup ? e.setup.toString() : '')).join('\n');
      for (const f of setByMe) if (!readSrc.includes(f)) bad(`arc flag ${f} is set but never read`);
      const MARK = /"?(trait|untrait|flag|them|newRel|wound|deed|epithet|owed|oweThem|claim|asset|secret|masterwork|bossOp|duel|beast)"?\s*:|flags\.[a-z_]+\s*=(?!=)|A\.(link|addTrait|kill)\(/;
      for (const id of mine) {
        const e = A.EV[id], cs = e.cond ? e.cond.toString() : '';
        if (!/C\.flag\(p, "(av_|tr_|mat_)/.test(cs)) bad(`${id}: cond does not read its memory through C.flag`);
        if (!/A\.S\.year - p\.flags\.(ev\.)?[a-z_]+ >= ([2-9]|1\d|20)\b/.test(cs)) bad(`${id}: cond has no years-since gate between 2 and 20`);
        if (![2, 3].includes(e.w)) bad(`${id}: weight ${e.w}`);
        if (e.once !== true) bad(`${id}: not once`);
        if ((e.choices || []).length < 2 || e.choices.length > 4) bad(`${id}: ${(e.choices || []).length} choices`);
        const srcs = (e.choices || []).flatMap(c => [c, c.win, c.lose]).filter(b => b && b.fx).map(b => src(b.fx));
        if (!srcs.some(x => MARK.test(x))) bad(`${id}: no branch leaves a lasting mark`);
      }

      const { H, FIX, ARCS } = window.__matFix;

      let cur = '';
      const ce = console.error;
      console.error = (...a) => bad(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`);
      const odds0 = A.checkOdds;
      const enter = F => {
        A.newGame(Object.assign({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 25, sex: 'M' }, F.o));
        const p = A.pc(), Y = A.S.year;
        if (F.o && F.o.startAge != null) p.born = Y - F.o.startAge; // newGame caps the starting age
        for (const [f, ago] of Object.entries(F.f)) p.flags[f] = f === 'av_bounty_beast' ? ago : Y - ago;
        p.flags.ev = p.flags.ev || {};
        for (const [id, ago] of Object.entries(F.ev || {})) p.flags.ev[id] = Y - ago;
        if (F.prep) F.prep(p, Y);
        A.S.queue = [];
        return p;
      };
      const view = id => { const q = { type: 'event', ev: id }; A.S.queue.unshift(q); return [q, A.eventView(q)]; };
      const flat = v => [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
      const checkView = (id, v, tag, recall) => {
        if (v.skip) { bad(`${id}${tag}: skipped by the engine`); return false; }
        const all = flat(v);
        if (RAW.test(all)) bad(`${id}${tag}: raw token ${all.match(RAW)[0]}`);
        if (TICS.test(all)) bad(`${id}${tag}: house tic in text: ${all.match(TICS)[0]}`);
        if (words(v.text) > 80) bad(`${id}${tag}: text ${words(v.text)} words`);
        for (const c of v.choices) if (words(c.t) > 12) bad(`${id}${tag}: label of ${words(c.t)} words`);
        out.dump[id + tag] = out.dump[id + tag] || { text: v.text, words: words(v.text), choices: v.choices.map(c => c.t), results: [] };
        if (recall) {
          const low = v.text.toLowerCase(), miss = recall.filter(w => !low.includes(w.toLowerCase()));
          if (miss.length) bad(`${id}${tag}: does not recall ${miss.join(', ')}`); else out.recalled++;
        }
        return true;
      };
      const choose = (id, q, v, i, force) => {
        const idx = v.choices.findIndex(c => c.i === i);
        if (idx < 0) { bad(`${id} choice ${i + 1}: not offered`); return null; }
        cur = `${id} choice ${i + 1}${force == null ? '' : force ? ' (win)' : ' (lose)'}`;
        if (force != null) A.checkOdds = () => (force ? 100 : 0);
        try { A.eventChoose(idx); } catch (err) { bad(`${cur}: throws ${err.message}`); return null; } finally { A.checkOdds = odds0; }
        const t = q.result ? q.result.text : '';
        if (!t) bad(`${cur}: no result text`);
        if (RAW.test(t)) bad(`${cur}: raw token in result: ${t.match(RAW)[0]}`);
        if (TICS.test(t)) bad(`${cur}: house tic in result`);
        if (words(prose(t)) > 45) bad(`${cur}: result ${words(prose(t))} words of prose`);
        const p = A.pc();
        for (const k of ['coin', 'health', 'happy', 'honor', 'piety', 'fame']) if (!Number.isFinite(p[k])) bad(`${cur}: ${k} is ${p[k]}`);
        const d = out.dump[id] || out.dump[id + ' (arc end)'];
        if (d) d.results.push(`${cur.replace(id + ' ', '')} [${words(prose(t))}w]: ${t}`);
        if (A.S.queue[0] === q) A.eventClose();
        out.branches++;
        return t;
      };

      try {
        // ---- 2: each event under its fixture
        const covered = new Set();
        for (const [id, F] of FIX) {
          const e = A.EV[id];
          if (!e) { bad(`${id}: not registered`); continue; }
          covered.add(id); out.fixtures++;
          cur = id;
          let p = enter(F);
          const Y = A.S.year, main = Object.keys(F.f)[0], keep = p.flags[main], ago = F.f[main];
          // closed without the memory
          delete p.flags[main];
          if (e.cond(p, A.C)) bad(`${id}: open without its memory flag`); else out.needMemory++;
          p.flags[main] = keep;
          // closed in the year the memory was made
          const evKeep = Object.assign({}, p.flags.ev);
          if (F.gate) F.gate(p, Y);
          else { p.flags[main] = Y; for (const [eid, a] of Object.entries(F.ev || {})) if (a === ago) p.flags.ev[eid] = Y; }
          if (e.cond(p, A.C)) bad(`${id}: open in the same year its memory was made`); else out.gated++;
          p.flags[main] = keep; p.flags.ev = evKeep;
          if (!e.cond(p, A.C)) { bad(`${id}: fixture does not open the cond`); continue; }
          if (A.evFit && A.evFit(e, p) <= 0) bad(`${id}: evFit hides it from its own fixture`);
          const base = A.serialize();
          // determinism: the same state renders the same view
          A.deserialize(JSON.parse(base)); A.S.queue = [];
          const v1 = flat(view(id)[1]);
          A.deserialize(JSON.parse(base)); A.S.queue = [];
          const v2 = flat(view(id)[1]);
          if (v1 !== v2) bad(`${id}: renders differently from the same state`); else out.deterministic++;
          let first = true;
          for (let i = 0; i < (e.choices || []).length; i++) {
            for (const force of e.choices[i].check ? [true, false] : [null]) {
              A.deserialize(JSON.parse(base)); A.S.queue = [];
              const [q, v] = view(id);
              if (first) { first = false; if (!checkView(id, v, '', F.recall)) { i = 99; break; } }
              if (v.skip) { i = 99; break; }
              if (e.choices[i].req && !v.choices.some(c => c.i === i)) { bad(`${id} choice ${i + 1}: req not met by fixture`); continue; }
              choose(id, q, v, i, force);
            }
          }
        }
        for (const id of mine) if (!covered.has(id)) bad(`${id}: no fixture in test.mjs`);

        // ---- 3: arcs, played through with the years passing
        const arcFlags = { mat_reeve_men: 'mat_reeve_who', mat_forged_court: 'mat_forged_who', mat_courier_relay: 'mat_courier_who', mat_road_return: 'mat_road_who',
          mat_outlaw_repays: 'mat_outlaw_who', mat_surety_due: 'mat_surety_who', mat_journeyman_master: 'mat_journeyman_who' };
        for (const [a, choice, force, b, yrs, samePerson] of ARCS) {
          const F = (FIX.find(x => x[0] === a) || [])[1];
          if (!F || !A.EV[a] || !A.EV[b]) { bad(`arc ${a} -> ${b}: missing`); continue; }
          cur = `arc ${a} -> ${b}`;
          enter(F);
          const [q, v] = view(a);
          if (!checkView(a, v, ' (arc start)')) continue;
          const pidA = q.ctx && q.ctx.pid;
          choose(a, q, v, choice, force);
          A.S.queue = [];
          if (A.EV[b].cond(A.pc(), A.C)) bad(`${cur}: opens with no years passed`);
          A.S.year += yrs;
          const p = A.pc();
          if (!A.EV[b].cond(p, A.C)) { bad(`${cur}: second step does not open ${yrs} years later`); continue; }
          const [q2, v2] = view(b);
          if (!checkView(b, v2, ' (arc end)')) continue;
          if (samePerson) {
            if (!pidA || q2.ctx.pid !== pidA) bad(`${cur}: the second step is about someone else`);
            if (arcFlags[b] && p.flags[arcFlags[b]] !== pidA) bad(`${cur}: ${arcFlags[b]} does not hold the person`);
          }
          choose(b, q2, v2, v2.choices[0].i, true);
          out.arcs++;
        }
      } finally {
        console.error = ce; A.checkOdds = odds0;
      }
      out.problems = [...new Set(out.problems)];
      out.arcTotal = ARCS.length; out.fixTotal = FIX.length; out.expect = EXPECT_EVENTS; out.chunk = CHUNK.length;
      return out;
    });
    const ok = r.unread.length === 0 && r.events === r.expect && r.problems.length === 0 && r.arcs === r.arcTotal;
    return {
      ok,
      detail: `${r.chunk - r.unread.length}/${r.chunk} chunk flags read, ${r.events} mat_ events, ${r.fixtures} fixtures (${r.needMemory} need the memory, ${r.gated} timing gates hold, ` +
        `${r.recalled} views recall the original, ${r.deterministic} render deterministically), ${r.branches} branches played, ${r.arcs}/${r.arcTotal} arcs carried through` +
        (r.unread.length ? `; unread: ${r.unread.join(', ')}` : '') + (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },
};
