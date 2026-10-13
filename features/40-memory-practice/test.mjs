// Browser test for the practice memory callbacks (features/40-memory-practice). See README.md.
//
// mpfMemory checks, against the built page:
//   1. registry: every mpf_ event in practice.events.js is registered in A.EV, and every flag in the chunk (the 29
//      "orphan memories" the release's practice events set and never read) is read by the cond of at least one event;
//   2. craft: every event reads a memory flag with C.flag and times it (A.S.year - p.flags.x >= N, N 2..20), weighs
//      2-3, fires once, offers 2-4 choices, and at least one choice leaves a lasting mark (trait, flag, relation,
//      wound, deed, epithet, debt, asset, gear, prison, death, a move); no text uses the house tics;
//   3. play: for every event, a fixture builds a character with the history the cond asks for; the cond holds,
//      evFit does not hide it, the engine renders it without skipping, every choice is offered to some fixture, and
//      every choice runs (checks both won and lost) with no engine error, no raw {token}, within the word diet
//      (text 80, label 12, outcome 45) and without overwriting a kinship relation;
//   4. timing: the same fixture one year too soon does not qualify (for every event);
//   5. world: the same history in the wrong realm, race, stage or place does not qualify;
//   6. arcs: taking the choice that sets an mpf_ flag, then letting the years pass, makes the second event eligible
//      and renderable, and the second event finds the same person again where the arc has one;
//   7. backtest: for each of the 29 flags, the release's own setter event is played (the choice the chunk lists),
//      the years pass, and the callback becomes eligible; where the release only kept a person's name in the life
//      log (the bout-master, the agent, the cog's master, the steward, the host, the keeper, the engineer, the
//      priest, the merchant) the callback names the same person; where the release linked a person, the callback
//      finds that person; where two of the setter's paths set the same flag (honest or skimming steward, honest or
//      crooked dice-house, teaching against the priest or with him, the price named or not), the callback tells
//      them apart;
//   8. surfacing: a life with every chunk flag set six years back plays twelve years, and the callbacks fire on
//      their own through the normal event roll with no engine error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(HERE, 'practice.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid: "(mpf_[a-z0-9_]+)"/g)].map(m => m[1]);

// the chunk: flags the release's practice (pf_) events set and never read
export const FLAGS = ['pf_threw_bout', 'pf_quiet_school', 'pf_hired_knife', 'pf_rim_trick', 'pf_backward_shot',
  'pf_smuggler_contact', 'pf_hold_steel', 'pf_spy_work', 'pf_knows_secret', 'pf_crew', 'pf_pilot', 'pf_court_door',
  'pf_blackmailer', 'pf_steward_secret', 'pf_knows_poisoner', 'pf_informer', 'pf_watched', 'pf_sold_secret',
  'pf_holds_secret', 'pf_song_keeper', 'pf_engineer', 'pf_mill', 'pf_steward', 'pf_school', 'pf_partner_crook',
  'pf_dwarf_eye', 'pf_dicehouse_man', 'pf_corsair_favor', 'pf_dicehouse'];

// [first event, choice index, forced check result (null = no check), flag it sets, second event, years, same person?]
export const ARCS = [
  ['mpf_bout_pupil', 1, null, 'mpf_bout_fixer', 'mpf_bout_ring', 3, false],
  ['mpf_quiet_sign', 0, true, 'mpf_quiet_ears', 'mpf_quiet_throat', 3, true],
  ['mpf_crates_bolt', 1, null, 'mpf_smug_owes', 'mpf_smug_cargo', 3, true],
  ['mpf_gloves_plant', 0, true, 'mpf_gloves_planted', 'mpf_gloves_trial', 2, true],
  ['mpf_pilot_storm', 1, null, 'mpf_pilot_chart', 'mpf_pilot_chart_buyer', 3, false],
  ['mpf_purse_quarter', 1, true, 'mpf_purse_doubled', 'mpf_purse_last', 2, true],
  ['mpf_poisoner_face', 1, null, 'mpf_poisoner_paid', 'mpf_poisoner_cup', 3, true],
  ['mpf_chest_damp', 0, null, 'mpf_chest_kept', 'mpf_chest_will', 5, false],
  ['mpf_song_lineage', 1, null, 'mpf_song_lie', 'mpf_song_lie_grown', 4, true],
  ['mpf_mill_weir', 0, null, 'mpf_mill_shared', 'mpf_mill_famine', 3, true],
  ['mpf_school_pupil', 0, null, 'mpf_school_sponsor', 'mpf_school_return', 5, true],
  ['mpf_dwarf_fold', 2, null, 'mpf_dwarf_oath', 'mpf_dwarf_apprentice', 4, false],
  // a cross-link into the chunk itself: warning a friend away from the listeners gets you watched
  ['mpf_listener_name', 2, null, 'pf_watched', 'mpf_watched_shadow', 2, false],
];

// [flag, the release's setter, its choice label, forced check result, callback that must follow, what it must recall]
// recall, '&'-separated: a ctx key of the setter whose value must appear in the callback's text; 'rel:<type>' for a
// person the setter linked that the callback must find again (as ctx.pid, or as the ctx key after a second colon);
// 'text:<words>' the callback must say; '!text:<words>' it must not say (where two setter paths set one flag)
export const BACK = [
  ['pf_threw_bout', 'pf_sword_stumble', 'Take the money and slip', null, 'mpf_bout_rematch', 'bm'],
  ['pf_threw_bout', 'pf_unarmed_paid_to_lose', 'Take the money', null, 'mpf_bout_rematch', 'text:second hold'],
  ['pf_quiet_school', 'pf_dagger_still_hall', 'Go and train with them for a season', null, 'mpf_quiet_sign', 'rel:mentor&text:No one named a price&!text:Not throats'],
  ['pf_quiet_school', 'pf_dagger_still_hall', 'Ask what they want in return', true, 'mpf_quiet_sign', 'text:Ears, later. Not throats.'],
  ['pf_hired_knife', 'pf_dagger_hire', 'Do the job', true, 'mpf_knife_client', 'text:fifteen suns'],
  ['pf_rim_trick', 'pf_lance_inside_rim', 'Spend a season at the quintain chasing it', true, 'mpf_rim_ashby', 'text:forty-first day'],
  ['pf_backward_shot', 'pf_mounted_backward_shot', 'Practise until you have it', true, 'mpf_shot_road', 'text:over the tail'],
  ['pf_smuggler_contact', 'pf_xbow_crates', 'Test them, take the coin', null, 'mpf_crates_bolt', 'text:cracked prods'],
  ['pf_hold_steel', 'pf_xbow_lever', 'Buy it (90 suns)', null, 'mpf_steel_reckoners', 'text:ninety suns'],
  ['pf_spy_work', 'pf_stealth_letter', 'Do it', true, 'mpf_gloves_plant', 'agent'],
  ['pf_knows_secret', 'pf_stealth_letter', 'Do it, and read the letter yourself', true, 'mpf_letter_copy', 'agent'],
  ['pf_crew', 'pf_stealth_crew', 'Do the job', true, 'mpf_crew_gallows', 'rel:friend'],
  ['pf_pilot', 'pf_sea_pilot', 'Take her in', true, 'mpf_pilot_storm', 'mst'],
  ['pf_pilot', 'pf_sea_pilot', 'Take her in', true, 'mpf_pilot_cog', 'rel:friend'],
  ['pf_court_door', 'pf_etiq_upstart', 'Teach her, and use her to get into court yourself', null, 'mpf_court_goose', 'text:eating with her knife'],
  ['pf_blackmailer', 'pf_intr_steward', 'Make {stew} pay you to keep quiet', true, 'mpf_purse_quarter', 'stew'],
  ['pf_steward_secret', 'pf_intr_steward', 'Keep it in your pocket for later', null, 'mpf_secret_later', 'text:in your pocket for later'],
  ['pf_knows_poisoner', 'pf_intr_cup', 'Follow the cook after the feast', true, 'mpf_poisoner_face', 'host'],
  ['pf_informer', 'pf_intr_listener', 'Become an informer', null, 'mpf_listener_ledger', 'text:a sun a month'],
  ['pf_watched', 'pf_intr_listener', 'Agree, and feed them what suits you', false, 'mpf_watched_shadow', 'text:shading your reports'],
  ['pf_sold_secret', 'pf_intr_secret', 'Sell it to the people it would hurt', true, 'mpf_sold_scholar', 'rel:enemy:hid'],
  ['pf_holds_secret', 'pf_intr_secret', 'Hide it well and keep it', null, 'mpf_chest_damp', 'text:into the lining'],
  ['pf_song_keeper', 'pf_music_old_songs', "Sit at {keeper}'s bed every evening until the end", null, 'mpf_song_lineage', 'keeper'],
  ['pf_engineer', 'pf_siege_engineer', 'Go with him for a season', true, 'mpf_engine_notes', 'eng'],
  ['pf_engineer', 'pf_siege_engineer', 'Go with him for a season', true, 'mpf_engine_breach', 'eng'],
  ['pf_mill', 'pf_stew_improve', 'Build a mill on the stream (80 suns)', true, 'mpf_mill_weir', 'text:mill you built on the stream'],
  ['pf_steward', 'pf_stew_steward_post', 'Accept, and run it honestly', null, 'mpf_steward_heir', 'text:forty suns a year&!text:your tenth'],
  ['pf_steward', 'pf_stew_steward_post', 'Accept, and skim a little like everyone', true, 'mpf_steward_heir', 'text:found your tenth'],
  ['pf_school', 'pf_learn_teach', 'Teach them anyway', null, 'mpf_school_pupil', 'pr&text:objections'],
  ['pf_school', 'pf_learn_teach', 'Ask {pr} to teach with you', true, 'mpf_school_pupil', 'pr&text:blessing'],
  ['pf_partner_crook', 'pf_trade_scales', 'Show {mer} privately that you know', true, 'mpf_scale_wardens', 'mer'],
  ['pf_dwarf_eye', 'pf_craft_dwarf', 'Watch every day, and copy', true, 'mpf_dwarf_fold', 'text:crack'],
  ['pf_dicehouse_man', 'pf_gamb_debt', 'Work it off for {lender}', null, 'mpf_collector_door', 'text:other people\'s doors'],
  ['pf_corsair_favor', 'pf_gamb_corsairs', 'Throw, and lose on purpose to the captain', true, 'mpf_corsair_sails', 'rel:friend'],
  ['pf_dicehouse', 'pf_gamb_house', 'Open an honest house', true, 'mpf_house_farm', 'text:The dice were honest'],
  ['pf_dicehouse', 'pf_gamb_house', 'Open a crooked house', true, 'mpf_house_farm', 'text:loaded pair'],
];

export default {
  async mpfMemory(pg) {
    const r = await pg.evaluate(({ FLAGS, IDS, ARCS, BACK }) => {
      const out = { missing: [], unread: [], problems: [], played: 0, branches: 0, arcs: 0, back: 0, soon: 0, negatives: 0, perFlag: {}, samples: {} };
      out.missing = IDS.filter(id => !A.EV[id]);
      const conds = Object.values(A.EV).map(e => (e.cond ? e.cond.toString() : ''));
      out.unread = FLAGS.filter(f => !conds.some(s => s.includes(`"${f}"`) || s.includes(`'${f}'`)));
      for (const f of FLAGS) out.perFlag[f] = IDS.filter(id => A.EV[id] && A.EV[id].cond.toString().includes(`"${f}"`)).length;

      // ---------- craft rules from the brief
      const LASTING = /\b(trait|flag|unflag|them|newRel|wound|deed|epithet|owed|oweThem|asset|gear|prison|punish|sworn|kill|moveHome)\b/;
      const TICS = /looks at you a long time|for the rest of your life|(^|[.!?]["']?\s+)Nobody\b/;
      const src = x => (typeof x === 'function' ? x.toString() : JSON.stringify(x || {}));
      const timing = id => { const m = /A\.S\.year - p\.flags\.([A-Za-z0-9_]+) >= (\d+)/.exec(A.EV[id].cond.toString()); return m ? [m[1], +m[2]] : null; };
      for (const id of IDS) {
        const e = A.EV[id]; if (!e) continue;
        const cs = e.cond ? e.cond.toString() : '';
        const reads = [...cs.matchAll(/C\.flag\(p, "([A-Za-z0-9_]+)"\)/g)].map(m => m[1]);
        if (!reads.some(f => FLAGS.includes(f) || /^mpf_/.test(f))) out.problems.push(`${id}: craft: cond reads no memory flag`);
        const tm = timing(id);
        if (!tm) out.problems.push(`${id}: craft: cond is not timed`);
        else if (!reads.includes(tm[0]) || tm[1] < 2 || tm[1] > 20) out.problems.push(`${id}: craft: timing ${tm[0]} >= ${tm[1]}`);
        if (!(e.w >= 2 && e.w <= 3)) out.problems.push(`${id}: craft: weight ${e.w}`);
        if (e.once !== true) out.problems.push(`${id}: craft: not once`);
        const ch = e.choices || [];
        if (ch.length < 2 || ch.length > 4) out.problems.push(`${id}: craft: ${ch.length} choices`);
        if (!ch.some(c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].some(f => f && LASTING.test(src(f))))) out.problems.push(`${id}: craft: no choice leaves a lasting mark`);
        const prose = [src(e.text), ...ch.flatMap(c => [c.t, c.r, c.win && c.win.r, c.lose && c.lose.r])].filter(Boolean).join(' | ');
        if (TICS.test(prose)) out.problems.push(`${id}: craft: house tic "${prose.match(TICS)[0]}"`);
      }

      // ---------- fixtures: a character with the history each event needs
      const Y = () => A.S.year;
      const ago = (pc, f, n) => { pc.flags[f] = Y() - n; };
      const rel = (pc, t, type, op, n) => { A.link(pc, t, type, op, type); pc.rel[t.id].since = Y() - (n || 0); return t; };
      const npc = (pc, o = {}) => { const t = A.makeAcquaintance(pc, 'acquaint'); t.born = Math.min(t.born, Y() - 20); Object.assign(t, o); return t; };
      const sk = (pc, o) => { for (const k in o) pc.skills[k] = o[k]; };
      const aged = (pc, n) => { pc.born = Y() - Math.round(n * GD.RACES[pc.race].adult / 16); };   // newGame caps startAge
      const place = (pc, test) => { const l = A.S.prov.filter(x => x.owner === pc.realm && test(x)); if (l.length) pc.home = l[0].id; return !!l.length; };
      const town = pc => place(pc, x => x.town >= 8000);
      const coastTown = pc => place(pc, x => x.town >= 8000 && x.coast);
      const inland = pc => place(pc, x => !x.coast);
      const war = pc => {
        if (A.atWar(pc.realm).length) return;
        const o = Object.values(A.S.realms).filter(r => r.alive && r.id !== pc.realm && !r.isRebel && r.ruler);
        for (const x of o) { A.declareWar(x.id, pc.realm); if (A.atWar(pc.realm).length) return; }
      };
      const peace = pc => { for (const w of (A.S.wars || []).slice()) A.S.wars.splice(A.S.wars.indexOf(w), 1); };
      const child = (pc, age) => {
        const c = A.newPerson({ given: A.givenName(pc.cult, 'F'), sex: 'F', race: pc.race, realm: pc.realm, cult: pc.cult, faith: pc.faith, born: Y() - age, status: pc.status, home: pc.home });
        pc.children.push(c.id); A.link(pc, c, 'child', 50, pc.sex === 'M' ? 'father' : 'mother'); return c;
      };
      const V = (o, world, hist) => [o, world || (() => {}), hist || (() => {})];
      // a line in the life log n years back, the way a setter's result lands there
      const logLine = (pc, n, text) => {
        const y = Y() - n;
        let e = A.S.log.find(x => x.year === y && x.pc === A.S.pc);
        if (!e) { e = { year: y, age: 0, pc: A.S.pc, lines: [] }; A.S.log.push(e); }
        e.lines.push([text, '', 0]);
      };
      const SOLDIER = pc => { A.enlist(pc, false); war(pc); };
      // FIX[id]: a list of [newGame options, world (place, stage, skills, kit), history (the flags)]
      const FIX = {
        mpf_bout_rematch: [
          V({}, pc => sk(pc, { sword: 60 }), pc => { ago(pc, 'pf_threw_bout', 4); pc.flags.ev = { pf_sword_stumble: Y() - 4 }; }),
          V({}, pc => sk(pc, { unarmed: 60 }), pc => { ago(pc, 'pf_threw_bout', 4); pc.flags.ev = { pf_unarmed_paid_to_lose: Y() - 4 }; }),
        ],
        mpf_bout_pupil: [V({}, null, pc => ago(pc, 'pf_threw_bout', 6))],
        mpf_bout_ring: [V({}, null, pc => ago(pc, 'mpf_bout_fixer', 3))],
        mpf_quiet_sign: [
          V({ startAge: 24 }, null, pc => ago(pc, 'pf_quiet_school', 3)),
          V({ startAge: 24 }, null, pc => { ago(pc, 'pf_quiet_school', 3); rel(pc, npc(pc), 'mentor', 25, 3); }),
          V({ startAge: 24 }, null, pc => { ago(pc, 'pf_quiet_school', 3); logLine(pc, 3, 'Wynn smiles. "Ears, later. Not throats." You understand the price, and decide it is fair.'); }),
        ],
        mpf_quiet_throat: [
          V({}, null, pc => ago(pc, 'mpf_quiet_ears', 3)),
          V({}, null, pc => { ago(pc, 'mpf_quiet_ears', 3); ago(pc, 'pf_quiet_school', 6); logLine(pc, 6, 'Wynn smiles. "Ears, later. Not throats."'); }),
        ],
        mpf_knife_client: [V({}, pc => { pc.coin = 100; }, pc => ago(pc, 'pf_hired_knife', 2))],
        mpf_knife_son: [V({}, pc => { aged(pc, 40); pc.coin = 80; }, pc => ago(pc, 'pf_hired_knife', 10))],
        mpf_rim_ashby: [V({}, pc => sk(pc, { lance: 70 }), pc => ago(pc, 'pf_rim_trick', 2))],
        mpf_shot_road: [V({}, pc => { pc.gear.mount = 'horse'; sk(pc, { bow: 50, mounted: 50 }); }, pc => ago(pc, 'pf_backward_shot', 2))],
        mpf_shot_kharsa: [V({ realm: 'POL-12' }, pc => sk(pc, { bow: 50, mounted: 50 }), pc => ago(pc, 'pf_backward_shot', 3))],
        mpf_crates_bolt: [V({}, pc => { pc.coin = 30; }, pc => ago(pc, 'pf_smuggler_contact', 2))],
        mpf_smug_cargo: [V({}, null, pc => ago(pc, 'mpf_smug_owes', 3))],
        mpf_steel_reckoners: [V({}, pc => { pc.gear.ranged = 'xbow'; pc.coin = 200; }, pc => ago(pc, 'pf_hold_steel', 2))],
        mpf_steel_war: [V({ startAge: 24 }, pc => { SOLDIER(pc); pc.gear.ranged = 'xbow'; }, pc => ago(pc, 'pf_hold_steel', 2))],
        mpf_gloves_plant: [V({}, null, pc => ago(pc, 'pf_spy_work', 2))],
        mpf_gloves_trial: [V({}, null, pc => ago(pc, 'mpf_gloves_planted', 2))],
        mpf_letter_copy: [V({}, pc => { pc.literate = true; }, pc => ago(pc, 'pf_knows_secret', 3))],
        mpf_crew_gallows: [
          V({}, pc => { town(pc); pc.coin = 30; }, pc => ago(pc, 'pf_crew', 2)),
          V({}, pc => { town(pc); pc.coin = 30; }, pc => { ago(pc, 'pf_crew', 2); rel(pc, npc(pc), 'friend', 20, 2); }),
        ],
        mpf_pilot_storm: [V({}, pc => coastTown(pc), pc => ago(pc, 'pf_pilot', 2))],
        mpf_pilot_chart_buyer: [V({}, null, pc => ago(pc, 'mpf_pilot_chart', 3))],
        mpf_pilot_cog: [
          V({}, pc => coastTown(pc), pc => ago(pc, 'pf_pilot', 4)),
          V({}, pc => coastTown(pc), pc => { ago(pc, 'pf_pilot', 4); rel(pc, npc(pc), 'friend', 25, 4); }),
        ],
        mpf_court_goose: [V({}, null, pc => ago(pc, 'pf_court_door', 3))],
        mpf_purse_quarter: [V({}, null, pc => ago(pc, 'pf_blackmailer', 2))],
        mpf_purse_last: [V({}, pc => { pc.coin = 100; }, pc => ago(pc, 'mpf_purse_doubled', 2))],
        mpf_secret_later: [V({}, null, pc => ago(pc, 'pf_steward_secret', 3))],
        mpf_poisoner_face: [V({}, null, pc => ago(pc, 'pf_knows_poisoner', 3))],
        mpf_poisoner_cup: [V({}, null, pc => ago(pc, 'mpf_poisoner_paid', 3))],
        mpf_listener_name: [V({}, pc => rel(pc, npc(pc), 'friend', 40, 6), pc => ago(pc, 'pf_informer', 2))],
        mpf_listener_ledger: [V({ realm: 'POL-26' }, pc => { pc.coin = 60; }, pc => ago(pc, 'pf_informer', 8))],
        mpf_watched_shadow: [
          V({}, null, pc => { ago(pc, 'pf_watched', 2); pc.flags.ev = { pf_intr_listener: Y() - 2 }; }),
          V({}, null, pc => { ago(pc, 'pf_watched', 2); ago(pc, 'pf_informer', 6); pc.flags.ev = { mpf_listener_name: Y() - 2 }; }),
        ],
        mpf_sold_scholar: [
          V({}, null, pc => ago(pc, 'pf_sold_secret', 3)),
          V({}, null, pc => { ago(pc, 'pf_sold_secret', 3); rel(pc, npc(pc), 'enemy', -20, 3); }),
        ],
        mpf_chest_damp: [V({}, pc => aged(pc, 46), pc => ago(pc, 'pf_holds_secret', 3))],
        mpf_chest_will: [
          V({}, pc => { aged(pc, 56); pc.coin = 20; }, pc => ago(pc, 'mpf_chest_kept', 5)),
          V({}, pc => { aged(pc, 56); pc.coin = 20; child(pc, 25); }, pc => ago(pc, 'mpf_chest_kept', 5)),
        ],
        mpf_song_lineage: [
          V({}, null, pc => ago(pc, 'pf_song_keeper', 3)),
          V({ realm: 'POL-20' }, null, pc => ago(pc, 'pf_song_keeper', 3)),
        ],
        mpf_song_lie_grown: [V({}, null, pc => ago(pc, 'mpf_song_lie', 4))],
        mpf_song_last: [V({}, pc => { aged(pc, 52); pc.literate = true; }, pc => ago(pc, 'pf_song_keeper', 12))],
        mpf_engine_notes: [V({}, null, pc => ago(pc, 'pf_engineer', 2))],
        mpf_engine_breach: [
          V({}, pc => war(pc), pc => ago(pc, 'pf_engineer', 3)),
          V({}, pc => war(pc), pc => { ago(pc, 'pf_engineer', 3); rel(pc, npc(pc), 'mentor', 30, 3); }),
        ],
        mpf_mill_weir: [V({}, pc => { pc.coin = 60; }, pc => ago(pc, 'pf_mill', 2))],
        mpf_mill_famine: [V({}, null, pc => ago(pc, 'mpf_mill_shared', 3))],
        mpf_steward_heir: [
          V({}, null, pc => ago(pc, 'pf_steward', 3)),
          V({}, pc => { pc.coin = 200; }, pc => { ago(pc, 'pf_steward', 3); logLine(pc, 3, 'You make the land pay twice what it did, and keep a tenth of the difference. The lord is delighted.'); }),
        ],
        mpf_school_pupil: [
          V({}, pc => { pc.coin = 30; pc.literate = true; }, pc => ago(pc, 'pf_school', 5)),
          V({}, pc => { pc.coin = 30; pc.literate = true; }, pc => { ago(pc, 'pf_school', 5); logLine(pc, 5, 'You offer to read scripture with them first. Osric agrees, warily, and then enthusiastically.'); }),
        ],
        mpf_school_return: [V({}, null, pc => ago(pc, 'mpf_school_sponsor', 5))],
        mpf_scale_wardens: [V({}, pc => town(pc), pc => ago(pc, 'pf_partner_crook', 2))],
        mpf_dwarf_fold: [V({}, null, pc => ago(pc, 'pf_dwarf_eye', 2))],
        mpf_dwarf_apprentice: [V({}, null, pc => { ago(pc, 'pf_dwarf_eye', 8); ago(pc, 'mpf_dwarf_oath', 4); })],
        mpf_collector_door: [V({}, pc => { pc.coin = 50; }, pc => ago(pc, 'pf_dicehouse_man', 2))],
        mpf_corsair_sails: [
          V({}, pc => coastTown(pc), pc => ago(pc, 'pf_corsair_favor', 2)),
          V({}, pc => coastTown(pc), pc => { ago(pc, 'pf_corsair_favor', 2); rel(pc, npc(pc), 'friend', 30, 2); }),
        ],
        mpf_corsair_reef: [
          V({ realm: 'POL-33' }, null, pc => ago(pc, 'pf_corsair_favor', 3)),
          V({}, pc => { pc.job = { c: 'pirate', r: 1, y: 2, perf: 60 }; }, pc => ago(pc, 'pf_corsair_favor', 3)),
        ],
        mpf_house_farm: [
          V({}, pc => town(pc), pc => ago(pc, 'pf_dicehouse', 2)),
          V({}, pc => town(pc), pc => { ago(pc, 'pf_dicehouse', 2); logLine(pc, 2, 'Loaded dice for the strangers, honest dice for the regulars. The money pours in. So does the risk.'); }),
        ],
      };

      const RAW = /\{[A-Za-z0-9_.]+\}/, words = s => (String(s || '').match(/\S+/g) || []).length;
      let cur = '';
      const ce = console.error, cw = console.warn;
      console.error = (...a) => { out.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const chance = A.chance;
      const BASE = { seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 };
      const build = ([o, world, hist], withHistory = true) => {
        A.newGame(Object.assign({}, BASE, o));
        world(A.pc());
        if (withHistory) hist(A.pc());
        return A.pc();
      };
      const view = (id, ctx) => { A.S.queue = []; const q = { type: 'event', ev: id, ctx: ctx || {} }; A.S.queue.unshift(q); return [q, A.eventView(q)]; };
      // let n years pass for the memory: every year stamp the player carries moves back (flags, seen events, the log, relations)
      const pass = (pc, n) => {
        for (const k of Object.keys(pc.flags)) if (typeof pc.flags[k] === 'number') pc.flags[k] -= n;
        for (const k of Object.keys(pc.flags.ev || {})) pc.flags.ev[k] -= n;
        for (const e of A.S.log || []) if (e.pc === A.S.pc) e.year -= n;
        for (const x of Object.values(pc.rel)) if (typeof x.since === 'number') x.since -= n;
      };
      const KIN = ['mother', 'father', 'sibling', 'child', 'spouse'];
      try {
        // ---------- play every event, every choice, every check outcome
        for (const id of IDS) {
          const e = A.EV[id];
          if (!e) continue;
          if (!FIX[id]) { out.problems.push(`${id}: no fixture`); continue; }
          const seenChoice = new Set();
          FIX[id].forEach((fx, vi) => {
            cur = `${id} fixture ${vi + 1}`;
            let pc;
            try { pc = build(fx); } catch (err) { out.problems.push(`${cur}: fixture throws: ${err.message}`); return; }
            let ok = false;
            try { ok = !!e.cond(pc, A.C); } catch (err) { out.problems.push(`${cur}: cond throws: ${err.message}`); return; }
            if (!ok) { out.problems.push(`${cur}: fixture does not satisfy cond`); return; }
            if (A.evFit && A.evFit(e, pc) <= 0) out.problems.push(`${cur}: evFit hides it from its own fixture`);
            // timing: one year too soon must not qualify
            const tm = timing(id);
            if (tm && typeof pc.flags[tm[0]] === 'number') {
              const keep = pc.flags[tm[0]];
              pc.flags[tm[0]] = Y() - (tm[1] - 1);
              if (e.cond(pc, A.C)) out.problems.push(`${cur}: eligible one year too soon`); else out.soon++;
              pc.flags[tm[0]] = keep;
            }
            const base = A.serialize();
            for (let i = 0; i < e.choices.length; i++) {
              for (const forced of e.choices[i].check ? [true, false] : [null]) {
                A.deserialize(JSON.parse(base));
                const [q, v] = view(id);
                if (v.skip) { out.problems.push(`${cur}: skipped by the engine`); i = 99; break; }
                if (i === 0 && forced !== false) {
                  out.played++;
                  if (!out.samples[id]) out.samples[id] = { title: v.title, text: v.text, words: words(v.text), choices: v.choices.map(c => c.t), fit: A.evFit ? +A.evFit(e, A.pc()).toFixed(2) : 1, results: [] };
                  const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
                  if (RAW.test(all)) out.problems.push(`${cur}: raw token ${all.match(RAW)[0]}`);
                  if (words(v.text) > 80) out.problems.push(`${cur}: text ${words(v.text)} words`);
                  for (const c of v.choices) if (words(c.t) > 12) out.problems.push(`${cur}: label ${words(c.t)} words`);
                  if (TICS.test(v.text)) out.problems.push(`${cur}: house tic in rendered text`);
                }
                const idx = v.choices.findIndex(c => c.i === i);
                if (idx < 0) continue;            // hidden by req for this fixture; another fixture must offer it
                seenChoice.add(i);
                const lab = `${id} choice ${i + 1}${forced === null ? '' : forced ? ' won' : ' lost'}`;
                cur = lab;
                const c = e.choices[i], br = forced === null ? c : forced ? c.win : c.lose;
                if (forced !== null) A.chance = () => forced;
                const kin = Object.entries(A.pc().rel).filter(([, x]) => KIN.includes(x.type)).map(([k, x]) => [k, x.type]);
                try {
                  const ctxT = A.ctxTokens(A.pc(), q.ctx || {});
                  const rr = typeof br.r === 'string' ? A.T(br.r, ctxT) : '';
                  A.eventChoose(idx);
                  const res = A.S.queue[0] && A.S.queue[0].result;
                  out.branches++;
                  if (vi === 0 || !out.samples[id].results.some(x => x.startsWith(`${i + 1}${forced === null ? '' : forced ? 'w' : 'l'}:`)))
                    out.samples[id].results.push(`${i + 1}${forced === null ? '' : forced ? 'w' : 'l'}: ${res ? res.text : ''}`);
                  if (words(rr) > 45) out.problems.push(`${lab}: outcome ${words(rr)} words`);
                  if (res && RAW.test(res.text || '')) out.problems.push(`${lab}: raw token in result: ${res.text.slice(0, 120)}`);
                  if (res && TICS.test(res.text || '')) out.problems.push(`${lab}: house tic in result`);
                  for (const [k, type] of kin) if (!A.pc().rel[k] || A.pc().rel[k].type !== type) out.problems.push(`${lab}: overwrote a ${type} relation`);
                  A.eventClose();
                } catch (err) { out.problems.push(`${lab}: throws: ${err.message}`); }
                finally { A.chance = chance; }
              }
            }
          });
          for (let i = 0; i < e.choices.length; i++) if (!seenChoice.has(i)) out.problems.push(`${id} choice ${i + 1}: no fixture is offered it`);
        }

        // ---------- the setter's world: the same history in the wrong place, race, stage or station must not qualify
        const NEG = {
          'mpf_shot_kharsa outside the Nine Winds': ['mpf_shot_kharsa', { realm: 'POL-01' }, pc => { sk(pc, { bow: 50, mounted: 50 }); ago(pc, 'pf_backward_shot', 5); }],
          'mpf_corsair_sails in Blackreef itself': ['mpf_corsair_sails', { realm: 'POL-33' }, pc => { coastTown(pc); ago(pc, 'pf_corsair_favor', 5); }],
          'mpf_corsair_reef for a landsman outside Blackreef': ['mpf_corsair_reef', {}, pc => ago(pc, 'pf_corsair_favor', 5)],
          'mpf_steel_reckoners for a dwarf': ['mpf_steel_reckoners', { race: 'dwarf', realm: 'POL-29', startAge: 60 }, pc => { pc.gear.ranged = 'xbow'; ago(pc, 'pf_hold_steel', 5); }],
          'mpf_dwarf_fold for a dwarf': ['mpf_dwarf_fold', { race: 'dwarf', realm: 'POL-10', startAge: 60 }, pc => ago(pc, 'pf_dwarf_eye', 5)],
          'mpf_pilot_storm inland': ['mpf_pilot_storm', {}, pc => { inland(pc); ago(pc, 'pf_pilot', 5); }],
          'mpf_house_farm in a village': ['mpf_house_farm', {}, pc => { place(pc, x => x.town < 8000); ago(pc, 'pf_dicehouse', 5); }],
          'mpf_steel_war at peace, not a soldier': ['mpf_steel_war', {}, pc => { peace(pc); pc.gear.ranged = 'xbow'; ago(pc, 'pf_hold_steel', 5); }],
          'mpf_steel_war after the bow is gone': ['mpf_steel_war', { startAge: 24 }, pc => { SOLDIER(pc); pc.gear.ranged = null; ago(pc, 'pf_hold_steel', 5); }],
          'mpf_letter_copy, unlettered': ['mpf_letter_copy', {}, pc => { pc.literate = false; ago(pc, 'pf_knows_secret', 5); }],
          'mpf_rim_ashby, lance gone rusty': ['mpf_rim_ashby', {}, pc => { sk(pc, { lance: 20 }); ago(pc, 'pf_rim_trick', 5); }],
          'mpf_rim_ashby, too old for the lists': ['mpf_rim_ashby', {}, pc => { aged(pc, 60); sk(pc, { lance: 70 }); ago(pc, 'pf_rim_trick', 5); }],
          'mpf_chest_will, still young': ['mpf_chest_will', { startAge: 30 }, pc => ago(pc, 'mpf_chest_kept', 8)],
          'mpf_bout_rematch, too old to fight': ['mpf_bout_rematch', {}, pc => { aged(pc, 60); sk(pc, { sword: 60 }); ago(pc, 'pf_threw_bout', 5); }],
          'mpf_listener_name with no friend to name': ['mpf_listener_name', {}, pc => { for (const [k, x] of Object.entries(pc.rel)) if (['friend', 'bestfriend'].includes(x.type)) delete pc.rel[k]; ago(pc, 'pf_informer', 5); }],
          'mpf_crew_gallows in a village': ['mpf_crew_gallows', {}, pc => { place(pc, x => x.town < 8000 && !x.coast); ago(pc, 'pf_crew', 5); }],
          'mpf_engine_breach at peace': ['mpf_engine_breach', {}, pc => { peace(pc); ago(pc, 'pf_engineer', 5); }],
          'mpf_song_last, still young': ['mpf_song_last', { startAge: 28 }, pc => ago(pc, 'pf_song_keeper', 12)],
          'mpf_shot_road on foot': ['mpf_shot_road', {}, pc => { pc.gear.mount = null; ago(pc, 'pf_backward_shot', 5); }],
        };
        for (const [label, [id, o, prep]] of Object.entries(NEG)) {
          cur = `negative ${label}`;
          try {
            A.newGame(Object.assign({}, BASE, o));
            prep(A.pc());
            if (A.EV[id].cond(A.pc(), A.C)) out.problems.push(`${cur}: eligible`);
            else out.negatives++;
          } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
        }

        // ---------- arcs: the first event's choice sets the flag the second event reads, years later
        for (const [from, ci, forced, flag, to, years, same] of ARCS) {
          cur = `arc ${from} -> ${to}`;
          try {
            const pc0 = build(FIX[from][0]);
            const [q1, v] = view(from);
            const idx = v.choices.findIndex(c => c.i === ci);
            if (v.skip || idx < 0) { out.problems.push(`${cur}: first event cannot be played`); continue; }
            if (forced !== null) A.chance = () => forced;
            try { A.eventChoose(idx); } finally { A.chance = chance; }
            A.eventClose();
            const pc = A.pc();
            if (!pc.flags[flag]) { out.problems.push(`${cur}: choice did not set ${flag}`); continue; }
            pass(pc, years - 1);
            if (A.EV[to].cond(pc, A.C)) { out.problems.push(`${cur}: second event eligible a year early`); continue; }
            pass(pc, 1);
            if (!A.EV[to].cond(pc, A.C)) { out.problems.push(`${cur}: second event not eligible ${years} years on`); continue; }
            if (A.evFit && A.evFit(A.EV[to], pc) <= 0) out.problems.push(`${cur}: evFit hides the second event`);
            const [q2, v2] = view(to);
            if (v2.skip) { out.problems.push(`${cur}: second event skipped by the engine`); continue; }
            if (RAW.test(v2.text)) out.problems.push(`${cur}: raw token in second event`);
            if (same && q1.ctx.pid !== q2.ctx.pid) out.problems.push(`${cur}: second event lost the person (${q1.ctx.pid} -> ${q2.ctx.pid})`);
            if (pc0 !== pc) out.problems.push(`${cur}: player changed`);
            out.arcs++;
          } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
        }

        // ---------- backtest against the release: play the real setter, let the years pass, and the callback must follow
        out.recall = {};
        for (const [flag, setter, label, forced, cb, recall] of BACK) {
          cur = `backtest ${flag} (${setter}) -> ${cb}`;
          try {
            const S = A.EV[setter];
            if (!S) { out.problems.push(`${cur}: setter missing from the release`); continue; }
            const ci = S.choices.findIndex(c => c.t === label);
            if (ci < 0) { out.problems.push(`${cur}: setter has no choice "${label}"`); continue; }
            const pc = build(FIX[cb][0], false);
            delete pc.flags[flag];
            pass(pc, 3);                       // the setter happens a few years into the life, apart from the start's own ties
            pc.coin = Math.max(pc.coin, 400); pc.literate = true; pc.fame = Math.max(pc.fame, 20);
            for (const k of ['sword', 'unarmed', 'dagger', 'stealth', 'lance', 'mounted', 'bow', 'xbow', 'sea', 'etiquette', 'intrigue', 'music', 'siegecraft', 'craft', 'learning', 'stewardship', 'trade', 'gambling'])
              pc.skills[k] = Math.max(pc.skills[k] || 0, 70);
            const [q, v] = view(setter);
            const idx = v.choices.findIndex(c => c.i === ci);
            if (v.skip || idx < 0) { out.problems.push(`${cur}: setter choice not offered`); continue; }
            if (forced !== null) A.chance = () => forced;
            try { A.eventChoose(idx); } finally { A.chance = chance; }
            A.eventClose();
            if (pc.flags[flag] !== Y()) { out.problems.push(`${cur}: the setter did not set ${flag}`); continue; }
            const relSpec = recall.split('&').find(x => x.startsWith('rel:'));
            const [, relType, relKey] = (relSpec || '').split(':');
            const linkedP = relSpec ? (A.relsOf(pc, [relType]).find(x => x.r.since === Y()) || {}).p : null;
            const n = timing(cb)[1];
            pass(pc, n);
            if (!A.EV[cb].cond(pc, A.C)) { out.problems.push(`${cur}: callback not eligible ${n} years on`); continue; }
            const [q2, v2] = view(cb);
            if (v2.skip) { out.problems.push(`${cur}: callback skipped by the engine`); continue; }
            for (const want of recall.split('&')) {
              if (want.startsWith('text:')) {
                if (!v2.text.includes(want.slice(5))) out.problems.push(`${cur}: callback does not recall "${want.slice(5)}": ${v2.text.slice(0, 120)}`);
              } else if (want.startsWith('!text:')) {
                if (v2.text.includes(want.slice(6))) out.problems.push(`${cur}: callback says "${want.slice(6)}", which belongs to the setter's other path`);
              } else if (want.startsWith('rel:')) {
                if (!linkedP) out.problems.push(`${cur}: setter linked no ${relType}`);
                else if (q2.ctx[relKey || 'pid'] !== linkedP.id) out.problems.push(`${cur}: callback did not find the ${relType} the setter linked (${linkedP.given})`);
                else if (!v2.text.includes(linkedP.given)) out.problems.push(`${cur}: callback found the ${relType} but does not name ${linkedP.given}`);
                else out.recall[`${flag}/${setter}/${cb}`] = linkedP.given;
              } else {
                const name = q.ctx[want];
                if (!name || !v2.text.includes(name)) out.problems.push(`${cur}: callback does not name ${want} "${name}": ${v2.text.slice(0, 120)}`);
                else out.recall[`${flag}/${setter}/${cb}`] = name;
              }
            }
            out.back++;
          } catch (err) { out.problems.push(`${cur}: throws: ${err.message}`); }
        }

        // ---------- surfacing: every chunk flag set six years back, twelve years of an ordinary life
        cur = 'surfacing';
        A.newGame(Object.assign({}, BASE, { seed: 777 }));
        const pc = A.pc();
        coastTown(pc); pc.literate = true; pc.coin = 300; pc.gear.mount = 'horse'; pc.gear.ranged = 'xbow';
        sk(pc, { sword: 55, lance: 60 });
        rel(pc, npc(pc), 'friend', 40, 8);
        for (const f of FLAGS) ago(pc, f, 6);
        console.warn = () => {};
        const fired = new Set();
        T.play(12, { onEvent: v => { const q = A.S.queue[0]; if (q && /^mpf_/.test(q.ev)) fired.add(q.ev); } });
        out.surfaced = [...fired];
        if (fired.size < 3) out.problems.push(`surfacing: only ${fired.size} callbacks fired in twelve years with every flag set`);
      } finally { console.error = ce; console.warn = cw; A.chance = chance; }
      out.problems = [...new Set(out.problems)];
      return out;
    }, { FLAGS, IDS, ARCS, BACK });
    const ok = IDS.length > 0 && !r.missing.length && !r.unread.length && !r.problems.length && r.arcs === ARCS.length && r.back === BACK.length;
    const perFlag = Object.values(r.perFlag);
    return {
      ok,
      detail: `${IDS.length} events, ${FLAGS.length - r.unread.length}/${FLAGS.length} flags read (${(perFlag.reduce((a, b) => a + b, 0) / FLAGS.length).toFixed(2)} callbacks per flag), ` +
        `${r.played} played, ${r.branches} branches, ${r.soon} too-soon refusals, ${r.negatives} wrong-world refusals, ${r.arcs}/${ARCS.length} arcs, ` +
        `${r.back}/${BACK.length} release backtests, ${(r.surfaced || []).length} callbacks surfaced in a 12-year life` +
        (r.missing.length ? `; not registered: ${r.missing.join(', ')}` : '') +
        (r.unread.length ? `; unread: ${r.unread.join(', ')}` : '') +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join(' | ')}` : ''),
      data: r,
    };
  },
};
