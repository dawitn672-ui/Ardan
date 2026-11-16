// Browser test for the work-family memory callbacks.
//
// mwfMemory checks, against the built page:
//   1. every mwf_ event in work-family.events.js is registered in A.EV;
//   2. every flag in this chunk (the 31 "orphan memories" the release set but never read) is read by the cond of
//      at least one event;
//   3. play: for every event, a fixture builds a character with the history the cond asks for, the cond holds,
//      evFit does not hide it, the engine renders it without skipping, and every choice runs (checks both won
//      and lost) with no engine error, no raw {token}, and within the word diet (text 80, label 12, outcome 45);
//   4. arcs: taking the choice that sets an mwf_ flag, then letting the years pass, makes the second event
//      eligible and renderable;
//   5. world: the same history in the wrong realm, race or station, or too soon, does not qualify;
//   6. craft: every random event reads a memory flag with C.flag and times it (A.S.year - p.flags.x), weighs 2-3,
//      fires once, offers 2-4 choices, and at least one choice leaves a lasting mark (trait, flag, relation, wound,
//      deed, title, debt, asset, job, marriage, freedom, death).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(HERE, 'work-family.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid: "(mwf_[a-z0-9_]+)"/g)].map(m => m[1]);

// the chunk: flags the release sets in its work, family, war and court packs and never reads
export const FLAGS = ['wk_favored', 'wk_price75', 'wk_good_horse', 'wk_commons', 'wk_wheel', 'wk_lodestone', 'wk_redsail',
  'wk_knows_secret', 'wk_washes', 'fm_asked_wait', 'fm_other_affair', 'clan', 'fm_my_line', 'fm_thing_wait', 'fm_affair',
  'tryChild', 'fm_promise', 'wr_capt_enemy', 'wr_merc_thoughts', 'wr_boy', 'wr_mutineer', 'wr_lifedebt', 'wr_traitor',
  'wr_boss_enemy', 'wr_informer', 'wr_marches', 'ct_refused', 'ct_faction', 'ct_party', 'disinherited', 'ct_charter'];

// [first event, choice index, forced check result (null = no check), flag it sets, second event, years to pass]
export const ARCS = [
  ['mwf_favored_widow', 0, true, 'mwf_fav_will', 'mwf_favored_will', 4],
  ['mwf_price_word', 2, null, 'mwf_price_wait', 'mwf_price_heir', 3],
  ['mwf_price_heir', 1, null, 'mwf_price_steward', 'mwf_price_free', 3],
  ['mwf_dun_offer', 1, null, 'mwf_dun_stud', 'mwf_dun_get', 4],
  ['mwf_commons_again', 0, true, 'mwf_commons_front', 'mwf_commons_seat', 3],
  ['mwf_wheel_spinners', 0, null, 'mwf_wheel_taught', 'mwf_wheel_blue', 3],
  ['mwf_needle_fog', 0, null, 'mwf_needle_shown', 'mwf_needle_guild', 3],
  ['mwf_wash_college', 1, null, 'mwf_wash_taught', 'mwf_wash_order', 4],
  ['mwf_affair_doors', 1, null, 'mwf_affair_promise', 'mwf_affair_breadstall', 2],
  ['mwf_promise_eldest', 0, null, 'mwf_promise_ward', 'mwf_promise_grown', 5],
  ['mwf_peddler_boots', 0, null, 'mwf_traitor_paid', 'mwf_peddler_friend', 2],
  ['mwf_writ_second', 1, null, 'mwf_refused_twice', 'mwf_writ_third', 2],
];

export default {
  async mwfMemory(pg) {
    const r = await pg.evaluate(({ FLAGS, IDS, ARCS }) => {
      const out = { missing: [], unread: [], problems: [], played: 0, branches: 0, arcs: 0, samples: {} };   // samples: what a player reads, for review
      out.missing = IDS.filter(id => !A.EV[id]);
      const conds = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : ''));
      out.unread = FLAGS.filter(f => !conds.some(s => s.includes(`"${f}"`) || s.includes(`'${f}'`)));

      // ---------- craft rules from the brief
      const LASTING = /\b(trait|flag|unflag|them|newRel|rel|wound|deed|deeds|epithet|owed|oweThem|asset|job|prison|sworn|letter|setFree|runaway|wed|leaveFor|divorce|addChild|marryOff|kill|comradeDies|moveHome|schedule|mkFoe)\b/;
      const src = x => (typeof x === 'function' ? x.toString() : JSON.stringify(x || {}));
      for (const id of IDS) {
        const e = A.EV[id]; if (!e || e.trigger) continue;
        const cs = e.cond ? e.cond.toString() : '';
        const reads = [...cs.matchAll(/C\.flag\(p, "([A-Za-z0-9_]+)"\)/g)].map(m => m[1]);
        if (!reads.some(f => FLAGS.includes(f) || /^mwf_/.test(f))) out.problems.push(`${id}: craft: cond reads no memory flag`);
        if (!/A\.S\.year - /.test(cs)) out.problems.push(`${id}: craft: cond is not timed`);
        if (!(e.w >= 2 && e.w <= 3)) out.problems.push(`${id}: craft: weight ${e.w}`);
        if (e.once !== true) out.problems.push(`${id}: craft: not once`);
        const ch = e.choices || [];
        if (ch.length < 2 || ch.length > 4) out.problems.push(`${id}: craft: ${ch.length} choices`);
        if (!ch.some(c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].some(f => f && LASTING.test(src(f))))) out.problems.push(`${id}: craft: no choice leaves a lasting mark`);
      }

      // ---------- fixtures: a character with the history each event needs
      const Y = () => A.S.year;
      const ago = (pc, f, n) => { pc.flags[f] = Y() - n; };
      const rel = (pc, t, type, op, n) => { A.link(pc, t, type, op, type); pc.rel[t.id].since = Y() - (n || 0); return t; };
      const npc = (pc, o = {}) => { const t = A.makeAcquaintance(pc, 'acquaint'); Object.assign(t, o.set || {}); if (o.role) t.flags.mwf_role = o.role; return t; };
      const wife = pc => { const s = A.makeLoveInterest(pc); A.marry(pc, s); pc.rel[s.id].since = Y() - 8; return s; };
      const child = (pc, age) => {
        const c = A.newPerson({ given: A.givenName(pc.cult, 'F'), sex: 'F', race: pc.race, realm: pc.realm, cult: pc.cult, faith: pc.faith, born: Y() - age, status: pc.status, home: pc.home });
        pc.children.push(c.id); A.link(pc, c, 'child', 50, pc.sex === 'M' ? 'father' : 'mother'); return c;
      };
      const job = (pc, c) => { pc.job = { c, r: 2, y: 3, perf: 60 }; };
      const war = pc => {
        if (A.atWar(pc.realm).length) return;
        const o = Object.values(A.S.realms).filter(r => r.alive && r.id !== pc.realm && !r.isRebel && r.ruler);
        for (const x of o) { A.declareWar(x.id, pc.realm); if (A.atWar(pc.realm).length) return; }
      };
      const squad = pc => { for (const m of A.squad(pc)) rel(pc, m, 'comrade', 50, 6); };
      const SLAVE = { status: 'slave', realm: 'POL-21' }, NOBLE = { status: 'noble', startAge: 30 };
      const aged = (pc, n) => { pc.born = Y() - Math.round(n * GD.RACES[pc.race].adult / 16); };   // newGame caps startAge
      const FIX = {
        mwf_favored_widow: [SLAVE, pc => ago(pc, 'wk_favored', 3)],
        mwf_favored_will: [SLAVE, pc => { ago(pc, 'mwf_fav_will', 4); rel(pc, npc(pc, { role: 'mistress' }), 'acquaint', 25, 4); }],
        mwf_price_word: [SLAVE, pc => { ago(pc, 'wk_price75', 2); pc.coin = 150; }],
        mwf_price_heir: [SLAVE, pc => { ago(pc, 'mwf_price_wait', 3); pc.coin = 150; }],
        mwf_price_free: [SLAVE, pc => ago(pc, 'mwf_price_steward', 3)],
        mwf_dun_offer: [{ realm: 'POL-04' }, pc => { ago(pc, 'wk_good_horse', 3); job(pc, 'herd'); }],
        mwf_dun_get: [{}, pc => ago(pc, 'mwf_dun_stud', 4)],
        mwf_commons_again: [{ realm: 'POL-16' }, pc => { ago(pc, 'wk_commons', 2); pc.coin = 50; }],
        mwf_commons_seat: [{ realm: 'POL-16' }, pc => ago(pc, 'mwf_commons_front', 3)],
        mwf_wheel_spinners: [{ sex: 'F' }, pc => { ago(pc, 'wk_wheel', 2); job(pc, 'weaver'); }],
        mwf_wheel_blue: [{ sex: 'F' }, pc => { ago(pc, 'mwf_wheel_taught', 3); pc.coin = 60; }],
        mwf_needle_fog: [{}, pc => { ago(pc, 'wk_lodestone', 2); job(pc, 'sailor'); rel(pc, npc(pc, { set: { occ: 'an old pilot' } }), 'mentor', 35, 2); }],
        mwf_needle_guild: [{}, pc => { ago(pc, 'mwf_needle_shown', 3); job(pc, 'sailor'); pc.coin = 100; }],
        mwf_needle_heir: [{}, pc => { aged(pc, 52); ago(pc, 'wk_lodestone', 12); job(pc, 'sailor'); child(pc, 15); rel(pc, npc(pc, { set: { occ: 'an old pilot' } }), 'mentor', 35, 12); }],
        mwf_redsail_names: [{}, pc => { ago(pc, 'wk_redsail', 2); job(pc, 'pirate'); }],
        mwf_redsail_page: [{}, pc => { ago(pc, 'wk_redsail', 5); job(pc, 'sailor'); pc.coin = 60; }],
        mwf_linen_lawyer: [{}, pc => { ago(pc, 'wk_knows_secret', 3); job(pc, 'servant'); }],
        mwf_wash_college: [{}, pc => { ago(pc, 'wk_washes', 2); job(pc, 'healer'); pc.coin = 30; }],
        mwf_wash_order: [{}, pc => { ago(pc, 'mwf_wash_taught', 4); job(pc, 'healer'); }],
        mwf_wait_ribbon: [{ startAge: 24 }, pc => { ago(pc, 'fm_asked_wait', 2); rel(pc, A.makeLoveInterest(pc), 'lover', 60, 3); }],
        mwf_wait_banns: [{ startAge: 26 }, pc => { ago(pc, 'fm_asked_wait', 4); rel(pc, A.makeLoveInterest(pc), 'ex', 20, 5); }],
        mwf_affair_basket: [{ startAge: 28 }, pc => {
          ago(pc, 'fm_other_affair', 2); const t = rel(pc, A.makeLoveInterest(pc), 'lover', 55, 4);
          const s = A.newPerson({ given: A.givenName(t.cult, t.sex === 'M' ? 'F' : 'M'), sex: t.sex === 'M' ? 'F' : 'M', race: t.race, realm: t.realm, cult: t.cult, faith: t.faith, born: t.born, status: t.status, home: t.home });
          t.spouse = s.id; s.spouse = t.id; pc.coin = 40;
        }],
        mwf_clan_spring: [{ race: 'orc', realm: 'POL-11', startAge: 24 }, pc => { pc.flags.clan = 'the Red Wolf'; pc.flags.ev = Object.assign(pc.flags.ev || {}, { fm_orc_clan: Y() - 3 }); wife(pc); }],
        mwf_elf_last_line: [{ race: 'elf', realm: 'POL-06', startAge: 120 }, pc => { ago(pc, 'fm_my_line', 12); wife(pc); child(pc, 8); }],
        mwf_thing_second: [{ race: 'giant', startAge: 40 }, pc => ago(pc, 'fm_thing_wait', 2)],
        mwf_affair_doors: [{ startAge: 32 }, pc => { wife(pc); ago(pc, 'fm_affair', 2); rel(pc, A.makeLoveInterest(pc), 'lover', 60, 2); }],
        mwf_affair_breadstall: [{ startAge: 34 }, pc => { wife(pc); ago(pc, 'fm_affair', 4); ago(pc, 'mwf_affair_promise', 2); rel(pc, A.makeLoveInterest(pc), 'lover', 50, 4); }],
        mwf_shrine_tithe: [{ startAge: 30 }, pc => { wife(pc); ago(pc, 'tryChild', 3); child(pc, 1); pc.coin = 60; }],
        mwf_shrine_empty: [{ startAge: 30 }, pc => { wife(pc); ago(pc, 'tryChild', 3); }],
        mwf_promise_eldest: [{}, pc => { aged(pc, 38); ago(pc, 'fm_promise', 2); const f = rel(pc, npc(pc), 'friend', 60, 10); A.kill(f, 'a lung fever'); f.died = Y() - 2; pc.coin = 40; }],
        mwf_promise_grown: [{}, pc => { aged(pc, 44); ago(pc, 'mwf_promise_ward', 5); rel(pc, npc(pc, { role: 'ward' }), 'student', 40, 5); pc.coin = 60; }],
        mwf_capt_ladder: [{ startAge: 24 }, pc => { A.enlist(pc, false); war(pc); ago(pc, 'wr_capt_enemy', 2); pc.coin = 30; }],
        mwf_capt_drummer: [{}, pc => { aged(pc, 34); ago(pc, 'wr_capt_enemy', 7); }],
        mwf_plough_sergeant: [{ startAge: 24 }, pc => { A.enlist(pc, false); ago(pc, 'wr_merc_thoughts', 2); }],
        mwf_plough_inspection: [{ startAge: 26, sex: 'F' }, pc => { A.enlist(pc, true); ago(pc, 'wr_merc_thoughts', 3); }],
        mwf_camp_boy_purse: [{ startAge: 28 }, pc => { A.enlist(pc, false); ago(pc, 'wr_boy', 5); pc.coin = 30; }],
        mwf_camp_boy_naming: [{}, pc => { aged(pc, 40); ago(pc, 'wr_boy', 9); pc.coin = 20; }],
        mwf_mutiny_rolls: [{ startAge: 26 }, pc => { A.enlist(pc, true); ago(pc, 'wr_mutineer', 2); pc.coin = 30; }],
        mwf_lifedebt_oath: [{ startAge: 30 }, pc => { ago(pc, 'wr_lifedebt', 2); rel(pc, npc(pc), 'comrade', 60, 5); }],
        mwf_lifedebt_river: [{ startAge: 26 }, pc => { A.enlist(pc, false); squad(pc); ago(pc, 'wr_lifedebt', 3); }],
        mwf_peddler_boots: [{}, pc => { ago(pc, 'wr_traitor', 2); pc.coin = 50; }],
        mwf_peddler_friend: [{}, pc => { ago(pc, 'mwf_traitor_paid', 2); pc.coin = 80; }],
        mwf_boss_cellars: [{}, pc => { ago(pc, 'wr_boss_enemy', 2); job(pc, 'thief'); pc.coin = 60; }],
        mwf_lamp_branded: [{}, pc => { ago(pc, 'wr_informer', 3); job(pc, 'thief'); }],
        mwf_marches_reeve: [{}, pc => ago(pc, 'wr_marches', 3)],
        mwf_writ_second: [NOBLE, pc => { ago(pc, 'ct_refused', 2); pc.coin = 5000; }],
        mwf_writ_third: [NOBLE, pc => { ago(pc, 'mwf_refused_twice', 2); pc.coin = 5000; }],
        mwf_faction_vote: [NOBLE, pc => ago(pc, 'ct_faction', 2)],
        mwf_faction_suit: [NOBLE, pc => { ago(pc, 'ct_faction', 3); rel(pc, npc(pc), 'rival', -25, 3); pc.coin = 5000; }],
        mwf_party_cell: [{ status: 'royal', realm: 'POL-01', startAge: 40 }, pc => { ago(pc, 'ct_party', 3); pc.flags.ev = Object.assign(pc.flags.ev || {}, { ct_claim_throne: Y() - 3 }); pc.coin = 50000; }],
        mwf_disinherit_stairs: [{ status: 'noble', startAge: 22 }, pc => ago(pc, 'disinherited', 3)],
        mwf_disinherit_heir: [{ status: 'gentry' }, pc => { aged(pc, 40); ago(pc, 'disinherited', 9); pc.coin = 2000; if (!A.relsOf(pc, ['sibling']).some(x => x.p.alive)) rel(pc, npc(pc), 'sibling', 20, 40); }],
        mwf_charter_price: [NOBLE, pc => { ago(pc, 'ct_charter', 3); pc.literate = true; }],
      };

      const RAW = /\{[A-Za-z0-9_.]+\}/, words = s => (String(s || '').match(/\S+/g) || []).length;
      let cur = '';
      const ce = console.error;
      console.error = (...a) => { out.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const chance = A.chance;
      const fixture = id => {
        const f = FIX[id];
        A.newGame(Object.assign({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 }, f[0]));
        f[1](A.pc());
        return A.pc();
      };
      const view = id => { A.S.queue = []; const q = { type: 'event', ev: id }; A.S.queue.unshift(q); return [q, A.eventView(q)]; };
      try {
        for (const id of IDS) {
          const e = A.EV[id];
          if (!e) continue;
          if (!FIX[id]) { out.problems.push(`${id}: no fixture`); continue; }
          cur = id;
          let pc;
          try { pc = fixture(id); } catch (err) { out.problems.push(`${id}: fixture throws: ${err.message}`); continue; }
          let ok = false;
          try { ok = !e.cond || !!e.cond(pc, A.C); } catch (err) { out.problems.push(`${id}: cond throws: ${err.message}`); continue; }
          if (!ok) { out.problems.push(`${id}: fixture does not satisfy cond`); continue; }
          if (!e.trigger && A.evFit && A.evFit(e, pc) <= 0) out.problems.push(`${id}: evFit hides it from its own fixture`);
          const base = A.serialize();
          for (let i = 0; i < e.choices.length; i++) {
            for (const forced of e.choices[i].check ? [true, false] : [null]) {
              A.deserialize(JSON.parse(base));
              const [q, v] = view(id);
              if (v.skip) { out.problems.push(`${id}: skipped by the engine for its fixture`); i = 99; break; }
              if (i === 0 && forced !== false) {
                out.played++;
                out.samples[id] = { title: v.title, text: v.text, choices: v.choices.map(c => c.t), fit: A.evFit ? +A.evFit(e, A.pc()).toFixed(2) : 1, results: [] };
                const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
                if (RAW.test(all)) out.problems.push(`${id}: raw token ${all.match(RAW)[0]}`);
                if (words(v.text) > 80) out.problems.push(`${id}: text ${words(v.text)} words`);
                for (const c of v.choices) if (words(c.t) > 12) out.problems.push(`${id}: label ${words(c.t)} words`);
              }
              const idx = v.choices.findIndex(c => c.i === i);
              if (idx < 0) { out.problems.push(`${id} choice ${i + 1}: hidden by req for its fixture`); continue; }
              cur = `${id} choice ${i + 1}${forced === null ? '' : forced ? ' won' : ' lost'}`;
              const c = e.choices[i], br = forced === null ? c : forced ? c.win : c.lose;
              if (forced !== null) A.chance = () => forced;
              const KIN = ['mother', 'father', 'sibling', 'child'];
              const kin = Object.entries(A.pc().rel).filter(([, x]) => KIN.includes(x.type)).map(([k, x]) => [k, x.type]);
              try {
                const ctxT = A.ctxTokens(A.pc(), q.ctx || {});
                const rr = typeof br.r === 'string' ? A.T(br.r, ctxT) : '';
                A.eventChoose(idx);
                const res = A.S.queue[0] && A.S.queue[0].result;
                out.branches++;
                if (out.samples[id]) out.samples[id].results.push(`${i + 1}${forced === null ? '' : forced ? 'w' : 'l'}: ${res ? res.text : ''}`);
                if (words(rr) > 45) out.problems.push(`${cur}: outcome ${words(rr)} words`);
                if (res && RAW.test(res.text || '')) out.problems.push(`${cur}: raw token in result: ${res.text.slice(0, 120)}`);
                for (const [k, type] of kin) if (!A.pc().rel[k] || A.pc().rel[k].type !== type) out.problems.push(`${cur}: overwrote a ${type} relation`);
                A.eventClose();
              } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
              finally { A.chance = chance; }
            }
          }
        }

        // ---------- the setter's world: the same history in the wrong place, race or station must not qualify
        const NEG = {
          'mwf_clan_spring (birth clan, not a wife\'s)': ['mwf_clan_spring', { race: 'orc', realm: 'POL-11', startAge: 24 }, pc => { pc.flags.clan = 'Ughrak'; pc.flags.ev = Object.assign(pc.flags.ev || {}, { fm_orc_clan: Y() - 5 }); wife(pc); }],
          'mwf_wheel_spinners (in Varenna, where the wheel is no secret)': ['mwf_wheel_spinners', { realm: 'POL-03', sex: 'F' }, pc => { ago(pc, 'wk_wheel', 3); job(pc, 'weaver'); }],
          'mwf_commons_again (outside Sabena)': ['mwf_commons_again', { realm: 'POL-01' }, pc => ago(pc, 'wk_commons', 3)],
          'mwf_price_word (a free peasant)': ['mwf_price_word', { realm: 'POL-01' }, pc => { ago(pc, 'wk_price75', 3); pc.coin = 150; }],
          'mwf_capt_ladder (at peace)': ['mwf_capt_ladder', { startAge: 24 }, pc => { A.enlist(pc, false); for (const w of A.S.wars.slice()) A.S.wars.splice(A.S.wars.indexOf(w), 1); ago(pc, 'wr_capt_enemy', 3); }],
          'mwf_dun_offer (too soon)': ['mwf_dun_offer', {}, pc => ago(pc, 'wk_good_horse', 1)],
        };
        for (const [label, [id, o, prep]] of Object.entries(NEG)) {
          cur = `negative ${label}`;
          try {
            A.newGame(Object.assign({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 }, o));
            prep(A.pc());
            if (A.EV[id].cond(A.pc(), A.C)) out.problems.push(`${cur}: eligible`);
            else out.negatives = (out.negatives || 0) + 1;
          } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
        }

        // ---------- arcs: the first event's choice sets the flag the second event reads, years later
        for (const [from, ci, forced, flag, to, years] of ARCS) {
          cur = `arc ${from} -> ${to}`;
          try {
            const pc0 = fixture(from);
            const [, v] = view(from);
            const idx = v.choices.findIndex(c => c.i === ci);
            if (v.skip || idx < 0) { out.problems.push(`${cur}: first event cannot be played`); continue; }
            if (forced !== null) A.chance = () => forced;
            try { A.eventChoose(idx); } finally { A.chance = chance; }
            A.eventClose();
            const pc = A.pc();
            if (!pc.flags[flag]) { out.problems.push(`${cur}: choice did not set ${flag}`); continue; }
            if (to === 'mwf_price_free' && !(A.S.sched || []).some(s => s.item && s.item.ev === to)) out.problems.push(`${cur}: nothing scheduled`);
            for (const k of Object.keys(pc.flags)) if (typeof pc.flags[k] === 'number' && k !== 'ev') pc.flags[k] -= years;
            for (const x of Object.values(pc.rel)) if (typeof x.since === 'number') x.since -= years;
            const e2 = A.EV[to];
            if (!e2.cond(pc, A.C)) { out.problems.push(`${cur}: second event not eligible ${years} years on`); continue; }
            const [, v2] = view(to);
            if (v2.skip) { out.problems.push(`${cur}: second event skipped by the engine`); continue; }
            if (pc0 !== pc) out.problems.push(`${cur}: player changed`);
            out.arcs++;
          } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
        }
      } finally { console.error = ce; A.chance = chance; }
      out.problems = [...new Set(out.problems)];
      return out;
    }, { FLAGS, IDS, ARCS });
    const ok = IDS.length > 0 && !r.missing.length && !r.unread.length && !r.problems.length && r.arcs === ARCS.length;
    return {
      ok,
      detail: `${IDS.length} events, ${FLAGS.length - r.unread.length}/${FLAGS.length} flags read, ${r.played} played, ${r.branches} branches, ${r.arcs}/${ARCS.length} arcs, ${r.negatives || 0} wrong-world fixtures refused` +
        (r.missing.length ? `; not registered: ${r.missing.join(', ')}` : '') +
        (r.unread.length ? `; unread: ${r.unread.join(', ')}` : '') +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },
};
