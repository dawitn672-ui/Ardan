// Browser test for the childhood memory pack (features/40-memory-childhood). See README.md.
//
// mchMemory checks, against the built page:
//   1. every one of the chunk's 27 orphan flags is now read in some event's cond, and every mch_ flag this pack
//      sets is read by a cond too (no new orphans);
//   2. all 62 mch_ events are registered;
//   3. for each event, a fixture character who carries the memory: the cond is closed the year the memory was
//      made (timing gate) and open N years later; evFit does not hide it; the view renders with no raw {token},
//      text <= 80 words and labels <= 12; every choice is offered and taken, checks forced to win and to lose,
//      with no engine error, no raw token and a result of at most 70 words (45 of prose plus engine notes);
//   4. each 2-step arc: take the first event's arc choice, let the years pass, and the second event opens and
//      renders for the same character, with the same person.
export default {
  async mchMemory(pg) {
    const r = await pg.evaluate(() => {
      const CHUNK = ['ch_vow_freedom', 'ch_secret_reader', 'ch_hates_lord', 'ch_page', 'ch_betrothed', 'ch_hostage', 'ch_poison_enemy',
        'ch_first_love', 'ch_kept_toy', 'ch_short_friend', 'ch_own_tree', 'ch_named', 'ch_seaboy', 'ch_ring', 'ch_ring_failed', 'ch_arsenic',
        'ch_fits_secret', 'ch_fits_known', 'ch_vitia', 'ch_veil', 'lf_secret_love', 'lf_knows_ashen', 'lf_pawned', 'lf_gang',
        'sc_masters_pupil', 'tourneyWin', 'tourneyMelee'];
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const RAW = /\{[A-Za-z0-9_.]+\}/;
      const out = { problems: [], events: 0, fixtures: 0, gated: 0, branches: 0, arcs: 0, unread: [] };
      const bad = m => out.problems.push(m);

      // ---- 1, 2: static reads and registration
      const condSrc = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : ''));
      for (const f of CHUNK) if (!condSrc.some(s => s.includes(`"${f}"`) || s.includes(`'${f}'`) || s.includes('flags.' + f))) out.unread.push(f);
      const mine = Object.keys(A.EV).filter(k => k.startsWith('mch_'));
      out.events = mine.length;
      const setByMe = new Set();
      for (const id of mine) for (const c of A.EV[id].choices || []) for (const b of [c, c.win, c.lose]) {
        if (!b || !b.fx) continue;
        const s = typeof b.fx === 'function' ? b.fx.toString() : JSON.stringify(b.fx);
        for (const m of s.matchAll(/"flag":"(mch_[A-Za-z0-9_]+)"|flags\.(mch_[A-Za-z0-9_]+)\s*=(?!=)/g)) setByMe.add(m[1] || m[2]);
      }
      const readSrc = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : '') + (e.setup ? e.setup.toString() : '')).join('\n');
      for (const f of setByMe) if (!readSrc.includes(f)) bad(`arc flag ${f} is set but never read`);
      // every event leaves a mark on at least one branch: a trait, flag, relation, wound, deed, title, debt, claim or asset
      const MARK = /"?(trait|untrait|flag|them|newRel|wound|deed|epithet|owed|oweThem|claim|asset|secret|rel|merit|duel)"?\s*:|flags\.[a-z_]+\s*=(?!=)|A\.(link|addTrait)\(/;
      for (const id of mine) {
        const srcs = (A.EV[id].choices || []).flatMap(c => [c, c.win, c.lose]).filter(b => b && b.fx).map(b => (typeof b.fx === 'function' ? b.fx.toString() : JSON.stringify(b.fx)));
        if (!srcs.some(x => MARK.test(x))) bad(`${id}: no branch leaves a lasting mark`);
      }

      // ---- fixture helpers
      const H = {
        person(p, o) {
          o = o || {};
          const race = o.race || p.race, R = GD.RACES[race], sex = o.sex || 'F';
          const k = A.newPerson({ given: A.givenName(p.cult, sex), sex, race, realm: p.realm, cult: p.cult, faith: p.faith, born: A.S.year - Math.round((o.age != null ? o.age : A.age(p))), status: o.status || 'peasant', home: p.home, parents: o.parents });
          k.occ = o.occ || 'a neighbor';
          return k;
        },
        kid(p, age, sex) {
          const k = H.person(p, { age, sex: sex || 'F', status: p.status, parents: [p.id] });
          p.children.push(k.id); A.link(p, k, 'child', 50, p.sex === 'M' ? 'father' : 'mother');
          return k;
        },
        link(p, k, type, year) { A.link(p, k, type, 30, type); p.rel[k.id].since = year; return k; },
        blood(p, id) { p.blood = { id, show: true }; },
        slave(p) { p.status = 'slave'; p.flags.unfree = 'slave'; },
        town(p) { const t = A.S.prov.find(x => x.owner === p.realm && x.town >= 8000); if (t) p.home = t.id; },
      };
      const NOBLE = { status: 'noble', startAge: 30 };
      // [event id, fixture]: o = newGame options, f = { flag: years ago }, prep = extra state
      const FIX = [
        ['mch_vow_cart', { o: { startAge: 22 }, f: { ch_vow_freedom: 8 }, prep: p => H.slave(p) }],
        ['mch_cart_woman', { o: { startAge: 30 }, f: { mch_cart_girl: 11 }, prep: p => { p.coin = 100; } }],
        ['mch_vow_kept', { o: { startAge: 30 }, f: { ch_vow_freedom: 15 }, prep: p => { p.coin = 100; } }],
        ['mch_reader_will', { o: { startAge: 25 }, f: { ch_secret_reader: 10 }, prep: p => { H.slave(p); p.literate = true; } }],
        ['mch_reader_window', { o: { startAge: 30 }, f: { ch_secret_reader: 15 }, prep: p => { p.literate = true; p.coin = 60; } }],
        ['mch_slave_letter', { o: { startAge: 35 }, f: { mch_taught_slave: 9 }, prep: p => { p.literate = true; } }],
        ['mch_bailiff_ford', { o: { status: 'serf', startAge: 25 }, f: { ch_hates_lord: 12 }, prep: p => { p.coin = 10; } }],
        ['mch_tally_reckoning', { o: { status: 'serf', startAge: 28 }, f: { mch_tallies_drowned: 4 }, prep: p => { p.coin = 30; } }],
        ['mch_lord_mill', { o: { status: 'merchant', startAge: 35 }, f: { ch_hates_lord: 25 }, prep: p => { p.coin = 600; } }],
        ['mch_mill_toll', { o: { status: 'merchant', startAge: 38 }, f: { mch_holds_mill: 3 } }],
        ['mch_page_fellow', { o: { status: 'noble', startAge: 25 }, f: { ch_page: 16 }, prep: (p, Y) => H.link(p, H.person(p, { sex: 'M', status: 'gentry' }), 'friend', Y - 16) }],
        ['mch_page_fellow', { o: { status: 'gentry', startAge: 25 }, f: { ch_page: 16 } }],
        ['mch_page_child', { o: { status: 'noble', startAge: 40 }, f: { ch_page: 32 }, prep: p => H.kid(p, 8) }],
        ['mch_betrothal_due', { o: { status: 'noble', startAge: 20 }, f: { ch_betrothed: 12 }, prep: p => { p.coin = 500; } }],
        ['mch_feud_wakes', { o: NOBLE, f: { mch_broke_match: 4 }, prep: p => { p.coin = 500; } }],
        ['mch_ward_table', { o: NOBLE, f: { ch_hostage: 20 } }],
        ['mch_pledge_own', { o: { status: 'royal', startAge: 36 }, f: { ch_hostage: 26 }, prep: p => { A.makeRuler(p, p.realm, true); H.kid(p, 8, 'M'); } }],
        ['mch_pledge_home', { o: { status: 'royal', startAge: 40 }, f: { mch_sent_pledge: 4 }, prep: p => { A.makeRuler(p, p.realm, true); p.flags.mch_pledge_who = H.kid(p, 12, 'F').id; } }],
        ['mch_poison_cook', { o: { status: 'royal', startAge: 30 }, f: { ch_poison_enemy: 20 } }],
        ['mch_poison_lever', { o: NOBLE, f: { mch_poisoner_named: 5 }, prep: p => { p.flags.mch_poisoner_who = H.person(p, { sex: 'M', age: 50, status: 'noble' }).id; } }],
        ['mch_first_gift', { o: { startAge: 26 }, f: { ch_first_love: 12 }, prep: (p, Y) => H.link(p, H.person(p, { sex: 'F' }), 'friend', Y - 12) }],
        ['mch_old_flame', { o: { startAge: 28 }, f: { mch_old_flame: 3 }, prep: p => { p.flags.mch_flame_who = H.person(p, { sex: 'F' }).id; } }],
        ['mch_old_flame', { o: { startAge: 30 }, f: { mch_old_flame: 3 }, prep: p => { A.marry(p, H.person(p, { sex: 'F' })); p.flags.mch_flame_who = H.person(p, { sex: 'F' }).id; } }],
        ['mch_first_love_child', { o: { startAge: 40 }, f: { ch_first_love: 26 }, prep: p => H.kid(p, 14) }],
        ['mch_toy_chest', { o: { startAge: 25 }, f: { ch_kept_toy: 17 }, prep: p => H.kid(p, 6) }],
        ['mch_toy_lost', { o: { startAge: 35 }, f: { mch_toy_passed: 4 }, prep: p => H.kid(p, 8) }],
        ['mch_elf_wedding', { o: { race: 'elf', realm: 'POL-07', startAge: 35 }, f: { ch_short_friend: 15 } }],
        ['mch_elf_friend_child', { o: { race: 'elf', realm: 'POL-07', startAge: 60 }, f: { mch_elf_wedding: 10 } }],
        ['mch_tree_pond', { o: { race: 'halfelf', realm: 'POL-06', startAge: 22 }, f: { ch_own_tree: 12 } }],
        ['mch_tree_acorn', { o: { race: 'halfelf', realm: 'POL-06', startAge: 30 }, f: { mch_tree_kept: 7 } }],
        ['mch_name_flaw', { o: { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 45 }, f: { ch_named: 15 }, prep: (p, Y) => { p.deeds.push({ y: Y - 15, t: 'Passed the name-carving, with a flaw noted' }); p.coin = 100; } }],
        ['mch_name_apprentice', { o: { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 45 }, f: { ch_named: 15 } }],
        ['mch_apprentice_carving', { o: { race: 'dwarf', realm: 'POL-20', status: 'artisan', startAge: 60 }, f: { mch_dwarf_apprentice: 12 }, prep: (p, Y) => H.link(p, H.person(p, { sex: 'M', age: 30 }), 'student', Y - 12) }],
        ['mch_seaboy_son', { o: { realm: 'POL-14', startAge: 35 }, f: { ch_seaboy: 24 }, prep: p => H.kid(p, 10, 'M') }],
        ['mch_son_returns', { o: { realm: 'POL-14', startAge: 45 }, f: { mch_son_at_sea: 3 }, prep: p => { p.flags.mch_son_sea_who = H.kid(p, 13, 'M').id; p.coin = 200; } }],
        ['mch_ring_lords', { o: { realm: 'POL-14', status: 'royal', startAge: 20 }, f: { ch_ring: 13 } }],
        ['mch_ring_jetty', { o: { realm: 'POL-14', status: 'royal', startAge: 30 }, f: { ch_ring_failed: 23 }, prep: p => H.kid(p, 7) }],
        ['mch_ring_unringed', { o: { realm: 'POL-14', status: 'noble', startAge: 22 }, f: { ch_ring_failed: 15 } }],
        ['mch_arsenic_cup', { o: { realm: 'POL-30', status: 'royal', startAge: 25 }, f: { ch_arsenic: 20 } }],
        ['mch_arsenic_spoon', { o: { realm: 'POL-30', status: 'royal', startAge: 35 }, f: { ch_arsenic: 30 }, prep: p => H.kid(p, 5) }],
        ['mch_custom_reckoning', { o: { realm: 'POL-30', status: 'royal', startAge: 40 }, f: { mch_broke_custom: 6 }, prep: p => { p.flags.mch_custom_child = H.kid(p, 11).id; } }],
        ['mch_fits_torchlight', { o: { startAge: 20 }, f: { ch_fits_secret: 10 }, prep: p => { H.blood(p, 'BLD-36'); H.link(p, H.person(p, { sex: 'M' }), 'friend', A.S.year - 5); } }],
        ['mch_fits_confidant', { o: { startAge: 25 }, f: { mch_fits_told: 5 }, prep: p => { p.flags.mch_fits_confidant = H.person(p, { sex: 'M' }).id; p.coin = 100; } }],
        ['mch_fits_night_raid', { o: { startAge: 25 }, f: { ch_fits_known: 8 }, prep: p => { H.blood(p, 'BLD-36'); p.mil = { rank: 1, merit: 0, troop: 'SP', battles: 0 }; } }],
        ['mch_quickened_letter', { o: { startAge: 25 }, f: { ch_fits_known: 8 }, prep: p => { H.blood(p, 'BLD-36'); p.coin = 100; } }],
        ['mch_vitia_fester', { o: { realm: 'POL-03', startAge: 25 }, f: { ch_vitia: 18 }, prep: p => H.blood(p, 'BLD-14') }],
        ['mch_vitia_summons', { o: { realm: 'POL-03', startAge: 25 }, f: { ch_vitia: 18 }, prep: p => { H.blood(p, 'BLD-14'); p.coin = 100; } }],
        ['mch_veil_court', { o: { startAge: 25 }, f: { ch_veil: 15 }, prep: p => H.blood(p, 'BLD-13') }],
        ['mch_veil_search', { o: { startAge: 25 }, f: { ch_veil: 15 }, prep: p => H.blood(p, 'BLD-13') }],
        ['mch_knock', { o: { startAge: 28 }, f: { lf_secret_love: 5 }, prep: (p, Y) => { H.link(p, H.person(p, { sex: 'F', status: 'gentry' }), 'lover', Y - 5); p.coin = 50; } }],
        ['mch_knock_known', { o: { startAge: 30 }, f: { mch_knock_opened: 2 }, prep: p => { p.flags.mch_knock_who = H.person(p, { sex: 'F' }).id; p.coin = 100; } }],
        ['mch_ashen_questions', { o: { startAge: 30 }, f: { lf_knows_ashen: 4 }, prep: (p, Y) => { p.faith = 'REL-01'; H.link(p, H.person(p, { sex: 'M' }), 'bestfriend', Y - 4); } }],
        ['mch_ashen_repaid', { o: { startAge: 35 }, f: { mch_ashen_perjury: 5 }, prep: p => { p.flags.mch_ashen_who = H.person(p, { sex: 'M' }).id; } }],
        ['mch_pawn_window', { o: { startAge: 30 }, f: { lf_pawned: 3 }, prep: p => { p.coin = 100; } }],
        ['mch_pawn_asked', { o: { startAge: 25 }, f: { lf_pawned: 6 } }],
        ['mch_gang_crate', { o: { startAge: 22 }, f: { lf_gang: 6 }, prep: (p, Y) => { const k = H.person(p, { sex: 'M', occ: 'the leader of a gang of dock youths' }); H.link(p, k, 'friend', Y - 6); } }],
        ['mch_crate_reckoning', { o: { startAge: 26 }, f: { mch_gang_crate: 3 }, prep: p => { p.flags.mch_gang_who = H.person(p, { sex: 'M' }).id; p.coin = 100; } }],
        ['mch_gang_child', { o: { startAge: 35 }, f: { lf_gang: 20 }, prep: p => { H.town(p); H.kid(p, 13, 'M'); } }],
        ['mch_master_sends', { o: { startAge: 25 }, f: { sc_masters_pupil: 9 }, prep: p => { H.link(p, H.person(p, { sex: 'M', age: 60 }), 'mentor', A.S.year - 12); p.coin = 100; } }],
        ['mch_master_sends', { o: { startAge: 25 }, f: { sc_masters_pupil: 9 }, prep: p => { p.styles = { x: { rank: 2 } }; p.coin = 100; } }],
        ['mch_master_heir', { o: { startAge: 30 }, f: { mch_master_yard: 3 } }],
        ['mch_tourney_son', { o: { status: 'noble', startAge: 35 }, f: { tourneyWin: 7 }, prep: p => { p.coin = 200; } }],
        ['mch_squire_letter', { o: { status: 'noble', startAge: 40 }, f: { mch_took_squire: 5 }, prep: p => { p.flags.mch_squire_who = H.person(p, { sex: 'M', age: 25 }).id; } }],
        ['mch_tourney_old', { o: { status: 'noble', startAge: 55 }, f: { tourneyWin: 20 }, prep: p => H.kid(p, 25, 'M') }],
        ['mch_melee_custom', { o: { status: 'noble', startAge: 35 }, f: { tourneyMelee: 6 } }],
      ];
      // 2-step arcs: [first event, fixture index in FIX, choice index, force win (true/false/null), second event, years later]
      const ARCS = [
        ['mch_vow_cart', 0, true, 'mch_cart_woman', 10], ['mch_reader_window', 0, null, 'mch_slave_letter', 8],
        ['mch_bailiff_ford', 1, true, 'mch_tally_reckoning', 3], ['mch_lord_mill', 0, null, 'mch_mill_toll', 2],
        ['mch_betrothal_due', 1, null, 'mch_feud_wakes', 3], ['mch_pledge_own', 0, null, 'mch_pledge_home', 3],
        ['mch_poison_cook', 1, null, 'mch_poison_lever', 4], ['mch_first_gift', 0, null, 'mch_old_flame', 2],
        ['mch_toy_chest', 1, null, 'mch_toy_lost', 3], ['mch_elf_wedding', 0, null, 'mch_elf_friend_child', 8],
        ['mch_tree_pond', 0, true, 'mch_tree_acorn', 6], ['mch_name_apprentice', 0, null, 'mch_apprentice_carving', 11],
        ['mch_seaboy_son', 0, null, 'mch_son_returns', 3], ['mch_arsenic_spoon', 1, null, 'mch_custom_reckoning', 5],
        ['mch_fits_torchlight', 2, null, 'mch_fits_confidant', 4], ['mch_knock', 0, null, 'mch_knock_known', 2],
        ['mch_ashen_questions', 0, true, 'mch_ashen_repaid', 4], ['mch_gang_crate', 0, null, 'mch_crate_reckoning', 3],
        ['mch_master_sends', 0, null, 'mch_master_heir', 3], ['mch_tourney_son', 0, null, 'mch_squire_letter', 4],
      ];

      let cur = '';
      const ce = console.error;
      console.error = (...a) => bad(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`);
      const odds0 = A.checkOdds;
      const enter = F => {
        A.newGame(Object.assign({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', startAge: 25, sex: 'M' }, F.o));
        const p = A.pc(), Y = A.S.year;
        if (F.o && F.o.startAge != null) p.born = Y - F.o.startAge; // newGame caps the starting age
        for (const [f, ago] of Object.entries(F.f)) p.flags[f] = Y - ago;
        if (F.prep) F.prep(p, Y);
        A.S.queue = [];
        return p;
      };
      const view = id => { const q = { type: 'event', ev: id }; A.S.queue.unshift(q); return [q, A.eventView(q)]; };
      const checkView = (id, v, tag) => {
        if (v.skip) { bad(`${id}${tag}: skipped by the engine`); return false; }
        const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
        if (RAW.test(all)) bad(`${id}${tag}: raw token ${all.match(RAW)[0]}`);
        if (words(v.text) > 80) bad(`${id}${tag}: text ${words(v.text)} words`);
        for (const c of v.choices) if (words(c.t) > 12) bad(`${id}${tag}: label of ${words(c.t)} words`);
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
        if (words(t) > 70) bad(`${cur}: result ${words(t)} words`);
        const p = A.pc();
        for (const k of ['coin', 'health', 'happy', 'honor', 'piety', 'fame']) if (!Number.isFinite(p[k])) bad(`${cur}: ${k} is ${p[k]}`);
        if (A.S.queue[0] === q) A.eventClose();
        out.branches++;
        return t;
      };

      try {
        // ---- 3: each event under its fixture
        const covered = new Set();
        for (const [id, F] of FIX) {
          const e = A.EV[id];
          if (!e) { bad(`${id}: not registered`); continue; }
          covered.add(id); out.fixtures++;
          cur = id;
          let p = enter(F);
          const main = Object.keys(F.f)[0], keep = p.flags[main];
          p.flags[main] = A.S.year;
          if (e.cond(p, A.C)) bad(`${id}: open in the same year its memory was made`); else out.gated++;
          p.flags[main] = keep;
          if (!e.cond(p, A.C)) { bad(`${id}: fixture does not open the cond`); continue; }
          if (A.evFit && A.evFit(e, p) <= 0) bad(`${id}: evFit hides it from its own fixture`);
          const base = A.serialize();
          let first = true;
          for (let i = 0; i < (e.choices || []).length; i++) {
            for (const force of e.choices[i].check ? [true, false] : [null]) {
              A.deserialize(JSON.parse(base)); A.S.queue = [];
              const [q, v] = view(id);
              if (first) { first = false; if (!checkView(id, v, '')) { i = 99; break; } }
              if (v.skip) { i = 99; break; }
              choose(id, q, v, i, force);
            }
          }
        }
        for (const id of mine) if (!covered.has(id)) bad(`${id}: no fixture in test.mjs`);

        // ---- 4: arcs, played through with the years passing
        for (const [a, choice, force, b, yrs] of ARCS) {
          const F = (FIX.find(x => x[0] === a) || [])[1];
          if (!F || !A.EV[a] || !A.EV[b]) { bad(`arc ${a} -> ${b}: missing`); continue; }
          cur = `arc ${a} -> ${b}`;
          enter(F);
          const [q, v] = view(a);
          if (!checkView(a, v, ' (arc start)')) continue;
          choose(a, q, v, choice, force);
          A.S.queue = [];
          if (A.EV[b].cond(A.pc(), A.C)) bad(`${cur}: opens with no years passed`);
          A.S.year += yrs;
          const p = A.pc();
          if (!A.EV[b].cond(p, A.C)) { bad(`${cur}: second step does not open ${yrs} years later`); continue; }
          const [q2, v2] = view(b);
          if (!checkView(b, v2, ' (arc end)')) continue;
          choose(b, q2, v2, v2.choices[0].i, true);
          out.arcs++;
        }
      } finally {
        console.error = ce; A.checkOdds = odds0;
      }
      out.problems = [...new Set(out.problems)];
      return out;
    });
    const ok = r.unread.length === 0 && r.events === 62 && r.problems.length === 0 && r.arcs === 20;
    return {
      ok,
      detail: `${27 - r.unread.length}/27 chunk flags read, ${r.events} mch_ events, ${r.fixtures} fixtures (${r.gated} timing gates hold), ` +
        `${r.branches} branches played, ${r.arcs}/20 arcs carried through` +
        (r.unread.length ? `; unread: ${r.unread.join(', ')}` : '') + (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 6).join(' | ')}` : ''),
      data: r,
    };
  },
};
