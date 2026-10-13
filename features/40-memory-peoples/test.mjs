// Browser test for features/40-memory-peoples (memory callbacks for the elder peoples, chunk "peoples").
//
// mpeMemory checks, against the built page:
//   1. registration: every mpe_ event in peoples.events.js is in A.EV;
//   2. coverage: every one of the chunk's 36 orphan flags is read by an mpe_ event's cond (C.flag(p, "x") or
//      p.flags.x) and appears in at least one A.EV cond;
//   3. timing: every flag a cond reads is timed (A.S.year - p.flags.x >= N, N from 2 to 20);
//   4. the setter's world: each callback keeps the race and realm gates of the event that set its flag (WORLD below),
//      a stage gate (C.adult), weight 2 or 3 and once: true; the second step of an arc keeps the world of the first;
//   5. arcs: every mpe_ flag an event sets is read by a different mpe_ event (at least 5 two-step arcs);
//   6. shape and voice: 2 to 4 choices, labels <= 12 words, outcomes <= 45 words, text <= 80 words, no house tics,
//      no text that trips A.EV_RX (which would hide a memory from whole classes), no class-only cond (A.CX_RX);
//   7. marks: at least one branch per event leaves a lasting mark (trait, flag, relation, wound, deed, debt, job...),
//      and every wound, trait, career, skill, gear key, relation type and check stat named is one the engine knows;
//   8. a play-test under forced history: for each event it builds characters that satisfy the cond (every race the
//      cond allows, an allowed realm, both sexes, rich and poor, each side of an "or" flag, and special histories:
//      kin, Quickened blood, a lore figure dead, a lore figure on the throne). For each it checks the cond is true,
//      false in the year the flag was set, false without the flag, false once a needed lore figure is dead, and that
//      the class filter (A.evFit) lets it through. Then it renders the event (no skip, no raw {token}, <= 80 words)
//      and takes every visible choice from the same saved state, forcing each check to win and to lose, failing on
//      engine errors, raw tokens, NaN/undefined, empty or overlong results.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(here, 'peoples.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid:\s*"(mpe_[a-z0-9_]+)"/g)].map(m => m[1]);

// The chunk's orphan flags (from /tmp/ardan/content/chunk-peoples.json) with the world of the event that sets each
// one: the races its cond allows, the realms it requires (null: any) and the realms it excludes.
const WORLD = {
  pp_elf_torch: { races: ['elf', 'halfelf'], realms: ['POL-06'] },
  pp_elf_silent: { races: ['elf', 'halfelf'], realms: ['POL-06'] },
  pp_elf_exiled: { races: ['elf'], realms: ['POL-06'] },
  pp_elf_qrules: { races: ['elf', 'halfelf'], realms: null },
  pp_elf_taeron: { races: ['elf', 'halfelf'], realms: ['POL-07'] },
  pp_elf_yewcut: { races: ['elf', 'halfelf'], realms: ['POL-06'] },
  pp_elf_wandered: { races: ['elf'], realms: ['POL-06', 'POL-07'] },
  pp_dw_wall: { races: ['dwarf'], realms: null },
  pp_dw_warden: { races: ['dwarf'], realms: ['POL-28'] },
  pp_dw_door1084: { races: ['dwarf'], realms: ['POL-28'] },
  pp_dw_tofi: { races: ['dwarf'], realms: ['POL-10'] },
  pp_dw_rune: { races: ['dwarf'], realms: ['POL-28', 'POL-29'] },
  pp_dw_bairn: { races: ['dwarf'], realms: null, not: ['POL-28', 'POL-29'] },
  pp_dw_guildhuman: { races: ['dwarf'], realms: null, not: ['POL-10', 'POL-28', 'POL-29'] },
  pp_dw_stone: { races: ['dwarf'], realms: ['POL-28', 'POL-10'] },
  pp_dw_verse: { races: ['dwarf'], realms: ['POL-29'] },
  pp_dw_escape: { races: ['dwarf'], realms: ['POL-29'] },
  pp_dw_korrin: { races: ['dwarf'], realms: ['POL-10'] },
  pp_dw_partner: { races: ['dwarf'], realms: null },
  pp_orc_hyena: { races: ['orc', 'halforc'], realms: null },
  pp_orc_firstwave: { races: ['orc', 'halforc'], realms: null },
  pp_orc_tarnmet: { races: ['orc', 'halforc'], realms: ['POL-11'] },
  pp_orc_redhand: { races: ['orc', 'halforc'], realms: ['POL-11'] },
  pp_orc_merc: { races: ['orc', 'halforc'], realms: null },
  pp_orc_thardush: { races: ['orc', 'halforc'], realms: ['POL-34'] },
  pp_gi_ragvik: { races: ['giant'], realms: ['POL-09'] },
  pp_gi_bergthor: { races: ['giant'], realms: ['POL-09'] },
  pp_gi_harpoonborne: { races: ['giant'], realms: ['POL-09', 'POL-23'] },
  pp_gi_dobinstone: { races: ['giant'], realms: ['POL-23'] },
  pp_gi_hraldr: { races: ['giant'], realms: ['POL-23'] },
  // the setter is Sylvaran (POL-06), but its story walks you west to Eldergrove (POL-07), so both are home
  pp_he_westward: { races: ['halfelf'], realms: ['POL-06', 'POL-07'] },
  pp_he_thalion: { races: ['halfelf'], realms: ['POL-06', 'POL-07', 'POL-05', 'POL-01'] },
  pp_he_share: { races: ['halfelf'], realms: ['POL-07'] },
  pp_ho_seen: { races: ['halforc'], realms: ['POL-34', 'POL-12', 'POL-11', 'POL-26'] },
  pp_ho_filed: { races: ['halforc'], realms: null, not: ['POL-11', 'POL-34'] },
  pp_ho_east: { races: ['halforc'], realms: null, not: ['POL-11', 'POL-34', 'POL-12'] },
};
const CHUNK = Object.keys(WORLD);

export default {
  async mpeMemory(pg) {
    const r = await pg.evaluate(({ ids, world }) => {
      const chunk = Object.keys(world);
      const problems = [], stats = { events: ids.length, firsts: 0, seconds: 0, histories: 0, outcomes: 0, flags: {}, arcs: [], share: {} };
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const RAW = /\{[A-Za-z0-9_.]+\}/, BAD = /\bNaN\b|\bundefined\b|\[object |\bnull\b/;
      const TICS = /looks at you a long time|for the rest of your life|\bNobody\b/;
      const src = f => (typeof f === 'function' ? f.toString() : JSON.stringify(f || ''));
      const fxSrc = c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].map(src).join(' ');
      const reads = (cs, f) => new RegExp(`C\\.flag\\(p,\\s*"${f}"\\)|p\\.flags\\.${f}\\b`).test(cs);
      const calls = (cs, fn) => [...cs.matchAll(new RegExp(`(!?)C\\.${fn}\\(p,\\s*([^)]*)\\)`, 'g'))]
        .map(m => ({ neg: m[1] === '!', vals: [...m[2].matchAll(/"([^"]+)"/g)].map(x => x[1]) }));
      const timers = cs => [...cs.matchAll(/A\.S\.year\s*-\s*(\(([^)]*)\)|p\.flags\.(\w+))\s*>=\s*(\d+)/g)]
        .map(m => ({ flags: m[3] ? [m[3]] : [...m[2].matchAll(/p\.flags\.(\w+)/g)].map(x => x[1]), n: +m[4] }));
      const posFlags = cs => [...new Set(calls(cs, 'flag').filter(c => !c.neg).map(c => c.vals[0]))];

      // ---------------------------------------------------------------- 1. registered
      for (const id of ids) if (!A.EV[id]) problems.push(`${id}: not registered`);
      const evs = ids.map(id => A.EV[id]).filter(Boolean);
      const cond = e => e.cond.toString();

      // ---------------------------------------------------------------- 2. coverage
      for (const f of chunk) {
        const mine = evs.filter(e => reads(cond(e), f)).map(e => e.id);
        const any = Object.values(A.EV).filter(e => e.cond && e.cond.toString().includes(f)).length;
        stats.flags[f] = mine;
        if (!mine.length) problems.push(`flag ${f}: no mpe_ event reads it`);
        if (!any) problems.push(`flag ${f}: no event's cond mentions it`);
      }

      // ---------------------------------------------------------------- 5. arcs (needed for the world check)
      const setters = {};
      for (const e of evs) for (const c of e.choices || []) {
        for (const m of fxSrc(c).matchAll(/(?<![A-Za-z])["']?flag["']?\s*:\s*["'](mpe_\w+)["']/g)) (setters[m[1]] = setters[m[1]] || new Set()).add(e.id);
      }
      const worldOf = {}; // flag -> world of the chunk flag behind it
      for (const f of chunk) worldOf[f] = world[f];
      for (let pass = 0; pass < 3; pass++) for (const f in setters) for (const sid of setters[f]) {
        const cs = cond(A.EV[sid]), base = posFlags(cs).map(x => worldOf[x]).find(Boolean);
        if (base) worldOf[f] = base;
      }
      for (const f in setters) {
        const rd = evs.filter(e => reads(cond(e), f) && !setters[f].has(e.id)).map(e => e.id);
        if (!rd.length) problems.push(`arc flag ${f} is set but never read`);
        for (const s of setters[f]) for (const x of rd) stats.arcs.push(`${s} -> ${f} -> ${x}`);
      }
      const arcPairs = new Set(stats.arcs.map(a => a.replace(/ -> \w+ -> /, '>')));
      if (arcPairs.size < 5) problems.push(`only ${arcPairs.size} two-step arcs`);

      // ---------------------------------------------------------------- 3, 4, 6, 7. static checks per event
      const LASTING = /["']?(trait|flag|unflag|them|newRel|wound|deed|epithet|job|sworn|owed|oweThem|prison|punish|gear|apt|letter|lang|duel)["']?\s*:|addDebt\(|castFx\(|A\.link\(|p\.flags\.\w+\s*=/;
      const KNOWN = { wound: GD.WOUNDS, trait: GD.TRAITS, untrait: GD.TRAITS, job: GD.CAREERS };
      for (const e of evs) {
        const cs = cond(e), pf = posFlags(cs), ts = timers(cs);
        const isFirst = pf.some(f => chunk.includes(f));
        if (isFirst) stats.firsts++; else stats.seconds++;
        if (!/^\s*\(p,\s*C\)\s*=>/.test(cs)) problems.push(`${e.id}: cond is not (p, C) => ...`);
        if (!pf.length) problems.push(`${e.id}: cond reads no flag with C.flag(...)`);
        for (const f of pf) {
          const t = ts.find(x => x.flags.includes(f));
          if (!t) problems.push(`${e.id}: flag ${f} is read but not timed`);
          else if (t.n < 2 || t.n > 20) problems.push(`${e.id}: odd delay ${t.n} for ${f}`);
        }
        if (!/(^|[^!])C\.(adult|old)\(p\)/.test(cs)) problems.push(`${e.id}: cond has no stage gate`);
        if (e.w !== 2 && e.w !== 3) problems.push(`${e.id}: weight ${e.w}`);
        if (!e.once) problems.push(`${e.id}: not once`);
        // the setter's world
        const W = pf.map(f => worldOf[f]).find(Boolean);
        if (!W) problems.push(`${e.id}: reads no flag of this chunk or of its arcs`);
        else {
          const race = calls(cs, 'race').filter(c => !c.neg)[0];
          if (!race) problems.push(`${e.id}: no race gate`);
          else for (const x of race.vals) if (!W.races.includes(x)) problems.push(`${e.id}: race ${x} is outside the setter's world`);
          const realmPos = calls(cs, 'realm').filter(c => !c.neg), realmNeg = calls(cs, 'realm').filter(c => c.neg).flatMap(c => c.vals);
          if (W.realms) {
            if (!realmPos.length) problems.push(`${e.id}: no realm gate (setter needs ${W.realms.join('/')})`);
            for (const c of realmPos) for (const x of c.vals) if (!W.realms.includes(x)) problems.push(`${e.id}: realm ${x} is outside the setter's world`);
          }
          if (W.not) for (const x of W.not) if (!realmNeg.includes(x) && !realmPos.length) problems.push(`${e.id}: does not exclude ${x}, as its setter does`);
        }
        // shape and voice
        const ch = e.choices || [];
        if (ch.length < 2 || ch.length > 4) problems.push(`${e.id}: ${ch.length} choices`);
        if (typeof e.text === 'string' && words(e.text) > 80) problems.push(`${e.id}: text over 80 words`);
        if (TICS.test(src(e.text))) problems.push(`${e.id}: text has a house tic`);
        const aud = A.evAudience(e);
        for (const k in aud.txt) if (aud.txt[k]) problems.push(`${e.id}: text trips the ${k} classifier`);
        for (const k in aud.cond) if (aud.cond[k]) problems.push(`${e.id}: cond trips the ${k} class filter`);
        for (const c of ch) {
          if (typeof c.t === 'string' && words(c.t) > 12) problems.push(`${e.id}: label "${c.t}" over 12 words`);
          for (const b of [c, c.win, c.lose]) if (b && typeof b.r === 'string') {
            if (words(b.r) > 45) problems.push(`${e.id}: outcome over 45 words: ${b.r.slice(0, 40)}`);
            if (TICS.test(b.r)) problems.push(`${e.id}: outcome has a house tic: ${b.r.slice(0, 40)}`);
          }
          if (c.check && (!c.win || !c.lose)) problems.push(`${e.id}: check without win and lose`);
          const s = fxSrc(c);
          for (const m of s.matchAll(/["']?(wound|trait|untrait|job)["']?\s*:\s*["'](\w+)["']/g)) if (!KNOWN[m[1]][m[2]]) problems.push(`${e.id}: unknown ${m[1]} ${m[2]}`);
          for (const m of s.matchAll(/["']?skill["']?\s*:\s*\{([^}]*)\}/g)) for (const k of [...m[1].matchAll(/["']?(\w+)["']?\s*:/g)].map(x => x[1])) if (!GD.SKILLS[k]) problems.push(`${e.id}: unknown skill ${k}`);
          for (const m of s.matchAll(/["']?gear["']?\s*:\s*\{\s*(\w+)\s*:\s*("(\w+)"|null)/g)) if (!['weapon', 'ranged', 'armor', 'shield', 'helm', 'mount', 'cloak'].includes(m[1]) || (m[3] && !GD.GEAR[m[3]])) problems.push(`${e.id}: unknown gear ${m[1]} ${m[3]}`);
          for (const m of s.matchAll(/type:\s*"(\w+)"/g)) if (!A.REL_LABEL[m[1]]) problems.push(`${e.id}: unknown relation type ${m[1]}`);
          for (const m of s.matchAll(/deed:\s*"([^"]*)"/g)) if (/[{}]/.test(m[1])) problems.push(`${e.id}: a deed with a token (deeds are not tokenized)`);
          for (const k of c.check ? [c.check.s, c.check.s2] : []) if (k && !GD.SKILLS[k] && !GD.STATS.includes(k)) problems.push(`${e.id}: unknown check ${k}`);
          if (c.check && (c.check.d < 30 || c.check.d > 70)) problems.push(`${e.id}: check difficulty ${c.check.d}`);
        }
        if (!ch.some(c => LASTING.test(fxSrc(c)))) problems.push(`${e.id}: no branch leaves a lasting mark`);
      }

      // ---------------------------------------------------------------- 8. play-test under forced history
      let cur = '';
      const ce = console.error;
      console.error = (...a) => { problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const odds = A.checkOdds;
      const H = {
        kid: (p, h) => {
          const R = GD.RACES[p.race];
          const q = A.newPerson({ given: 'Kesi', sex: 'F', race: p.race, realm: p.realm, cult: p.cult, faith: p.faith, born: A.S.year - Math.round(h * R.adult / 16), parents: [p.id], home: p.home });
          p.children.push(q.id); A.link(p, q, 'child', 50, p.sex === 'M' ? 'father' : 'mother');
          return q;
        },
        spouse: p => {
          const q = A.newPerson({ given: 'Tarin', sex: p.sex === 'M' ? 'F' : 'M', race: p.race, realm: p.realm, cult: p.cult, faith: p.faith, born: p.born, home: p.home });
          p.spouse = q.id; q.spouse = p.id; A.link(p, q, 'spouse', 50, 'spouse');
        },
        blood: p => { p.blood = { id: 'BLD-36', show: true }; },
        dead: cid => { const q = A.personFromCast(cid); if (q) { q.alive = false; q.died = A.S.year - 1; } },
        crown: (realm, cid) => { const rr = A.realm(realm), q = A.personFromCast(cid); if (rr && q) { q.alive = true; rr.ruler = q.id; } },
        student: p => { const q = A.newPerson({ given: 'Wren', sex: 'F', race: 'human', realm: p.realm, born: A.S.year - 19, home: p.home }); A.link(p, q, 'student', 40, 'mentor'); },
        partner: p => { const q = A.newPerson({ given: 'Brokk', sex: 'M', race: 'dwarf', realm: p.realm, born: A.S.year - 90, home: p.home }); q.occ = 'a gem-cutter'; A.link(p, q, 'friend', 35, 'friend'); },
        ylva: p => { const q = A.newPerson({ given: 'Ylva', sex: 'F', race: 'dwarf', realm: p.realm, born: A.S.year - 45, home: p.home }); A.link(p, q, 'friend', 30, 'friend'); },
        mount: p => { p.gear.mount = 'horse'; },
      };
      // special histories a plain character cannot have (null = the plain character)
      const PREP = {
        mpe_elf_exile_kin: [p => H.kid(p, 18), p => H.spouse(p)],
        mpe_elf_exile_room: [p => H.kid(p, 20)],
        mpe_elf_qrules_watch: [H.blood],
        mpe_elf_qrules_child: [p => { H.blood(p); H.kid(p, 8); }],
        mpe_elf_taeron_reckoning: [null, () => H.dead('CHR-0287')],
        mpe_elf_ward_grown: [H.student],
        mpe_dw_wall_heir: [null, p => H.kid(p, 14)],
        mpe_dw_partner_clause: [null, H.partner],
        mpe_dw_partner_debt: [null, H.partner],
        mpe_dw_korrin_stone: [null, () => H.crown('POL-10', 'CHR-0088')],
        mpe_dw_tofi_carver: [null, () => H.dead('CHR-0087')],
        mpe_dw_stone_second: [null, () => { H.dead('CHR-0087'); H.dead('CHR-0414'); }],
        mpe_dw_tofi_founding: [null, H.ylva],
        mpe_orc_redhand_voice: [null, () => H.crown('POL-11', 'CHR-0295')],
        mpe_orc_thardush_ferry: [null, () => H.dead('CHR-0384')],
        mpe_gi_ragvik_thing: [null, () => H.crown('POL-09', 'CHR-0073')],
        mpe_gi_bergthor_voice: [null, () => H.crown('POL-09', 'CHR-0073')],
        mpe_ho_filed_child: [p => H.kid(p, 11)],
        mpe_ho_cord_child: [null, H.mount],
      };
      const REALMS = ['POL-06', 'POL-07', 'POL-05', 'POL-01', 'POL-10', 'POL-28', 'POL-29', 'POL-11', 'POL-34', 'POL-12', 'POL-26', 'POL-09', 'POL-23'];
      const bases = {};
      const baseFor = (realm, race, sex) => {
        const k = [realm, race, sex].join('|');
        if (!bases[k]) {
          const R = GD.RACES[race], age = Math.round(R.adult + (R.old - R.adult) * 0.3);
          A.newGame({ seed: 4041, race, realm, status: 'peasant', startAge: age, sex });
          const p = A.pc();
          p.mil = p.mil || null;
          if (A.age(p) !== age) p.born = A.S.year - age; // newGame caps the starting age
          bases[k] = A.serialize();
        }
        return bases[k];
      };
      const eligibleShare = (e, p) => {
        let tot = 0, mine = 0;
        for (const x of Object.values(A.EV)) {
          if (x.trigger || (x.once && p.flags.ev && p.flags.ev[x.id])) continue;
          let ok = false; try { ok = x.cond ? !!x.cond(p, A.C) : true; } catch (err) { ok = false; }
          if (!ok) continue;
          const fit = A.evFit ? A.evFit(x, p) : 1;
          if (fit <= 0) continue;
          tot += (x.w || 1) * fit; if (x === e) mine = (x.w || 1) * fit;
        }
        return tot ? mine / tot : 0;
      };
      for (const e of evs) {
        const cs = cond(e);
        const races = (calls(cs, 'race').filter(c => !c.neg)[0] || { vals: ['human'] }).vals;
        const pos = calls(cs, 'realm').filter(c => !c.neg)[0], neg = calls(cs, 'realm').filter(c => c.neg).flatMap(c => c.vals);
        const pf = posFlags(cs), ts = timers(cs);
        const delay = f => { const t = ts.find(x => x.flags.includes(f)); return t ? t.n : 3; };
        const orGroup = cs.match(/\(C\.flag\(p,\s*"(\w+)"\)\s*\|\|\s*C\.flag\(p,\s*"(\w+)"\)\)/);
        const sets = orGroup ? [pf.filter(f => f !== orGroup[2]), pf.filter(f => f !== orGroup[1])] : [pf];
        const figs = [...cs.matchAll(/(?<!!)fine\("(CHR-\d+)"\)/g)].map(m => m[1]);
        const preps = PREP[e.id] || [null];
        let eligibleOnce = false;
        for (const race of races) {
          const realms = (pos ? pos.vals : REALMS.filter(x => !neg.includes(x))).filter(x => A.raceAllowed(race, x)).slice(0, pos ? 4 : 2);
          if (!realms.length) { problems.push(`${e.id}: no realm lets a ${race} live there`); continue; }
          for (const realm of realms) for (const fl of sets) for (const prep of preps) for (const rich of [true, false]) {
            const sex = rich ? 'F' : 'M';
            A.deserialize(JSON.parse(baseFor(realm, race, sex)));
            const p = A.pc();
            const vtag = `${e.id} [${race} ${sex} ${realm} ${rich ? 'rich' : 'poor'} ${fl.join('+')}${prep ? ' prep' + preps.indexOf(prep) : ''}]`;
            cur = vtag;
            for (const f of fl) p.flags[f] = A.S.year - delay(f) - 1;
            p.coin = rich ? 500 : 0; p.literate = rich;
            if (prep) prep(p);
            let ok = false;
            try { ok = !!e.cond(p, A.C); } catch (err) { problems.push(`${vtag}: cond throws ${err.message}`); continue; }
            if (!ok) { problems.push(`${vtag}: not eligible under its own probe`); continue; }
            eligibleOnce = true;
            const hist = A.serialize();
            // the time gate: the flag set this year must not fire the callback yet
            fl.forEach(f => { p.flags[f] = A.S.year; });
            if (e.cond(p, A.C)) problems.push(`${vtag}: fires in the same year as its flag`);
            fl.forEach(f => { delete p.flags[f]; });
            if (e.cond(p, A.C)) problems.push(`${vtag}: fires without its flag`);
            // a lore figure the cond needs alive: dead, the callback must stay away
            for (const cid of figs) {
              A.deserialize(JSON.parse(hist)); H.dead(cid);
              if (e.cond(A.pc(), A.C)) problems.push(`${vtag}: fires with ${cid} dead`);
            }
            A.deserialize(JSON.parse(hist));
            const pc = A.pc();
            const fit = A.evFit ? A.evFit(e, pc) : 1;
            if (!(fit > 0)) problems.push(`${vtag}: the class filter hides it (evFit ${fit})`);
            if (stats.share[e.id] == null) stats.share[e.id] = eligibleShare(e, pc);
            stats.histories++;
            const base = A.serialize();
            const plan = [];
            (e.choices || []).forEach((c, i) => { if (c.check) plan.push([i, 100], [i, 0]); else plan.push([i, null]); });
            let viewed = false;
            for (const [i, force] of plan) {
              A.deserialize(JSON.parse(base)); A.S.queue = [];
              const q = { type: 'event', ev: e.id }; A.S.queue.unshift(q);
              let v;
              try { v = A.eventView(q); } catch (err) { problems.push(`${vtag}: view throws ${err.message}`); break; }
              if (v.skip) { problems.push(`${vtag}: skipped by the engine`); break; }
              if (!viewed) {
                viewed = true;
                const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
                if (RAW.test(all)) problems.push(`${vtag}: raw token ${all.match(RAW)[0]}`);
                if (BAD.test(all)) problems.push(`${vtag}: bad text ${all.match(BAD)[0]}`);
                if (TICS.test(all)) problems.push(`${vtag}: house tic in ${all.match(TICS)[0]}`);
                if (words(v.text) > 80) problems.push(`${vtag}: rendered text ${words(v.text)} words`);
                for (const c of v.choices) if (words(c.t) > 12) problems.push(`${vtag}: rendered label ${words(c.t)} words`);
                const vis = v.choices.filter(c => c.i >= 0).length;
                if (vis < 2 || vis > 4) problems.push(`${vtag}: ${vis} choices shown`);
              }
              const idx = v.choices.findIndex(c => c.i === i);
              if (idx < 0) continue; // a req hid this choice for this character
              cur = `${vtag} choice ${i + 1}${force === null ? '' : force ? ' win' : ' lose'}`;
              if (force !== null) A.checkOdds = () => force;
              try {
                A.eventChoose(idx);
                const res = q.result; // a duel can be queued in front of the event, so read the event's own item
                const rt = res ? String(res.text || '') : '';
                if (RAW.test(rt)) problems.push(`${cur}: raw token in result ${rt.match(RAW)[0]}`);
                if (BAD.test(rt)) problems.push(`${cur}: bad result text ${rt.match(BAD)[0]}`);
                if (TICS.test(rt)) problems.push(`${cur}: house tic in result`);
                if (words(rt) > 75) problems.push(`${cur}: result ${words(rt)} words`);
                if (!rt.trim()) problems.push(`${cur}: empty result`);
                if (force !== null && res && res.success !== !!force) problems.push(`${cur}: check not forced`);
                A.eventClose();
                stats.outcomes++;
              } catch (err) { problems.push(`${cur}: throws ${err.message}`); }
              finally { A.checkOdds = odds; }
            }
          }
        }
        if (!eligibleOnce) problems.push(`${e.id}: never eligible`);
      }
      console.error = ce;
      A.checkOdds = odds;
      return { problems: [...new Set(problems)], stats };
    }, { ids: IDS, world: WORLD });

    const s = r.stats, read = Object.values(s.flags).filter(x => x.length).length;
    const reads = Object.values(s.flags).reduce((a, x) => a + x.length, 0);
    const arcs = new Set(s.arcs.map(a => a.replace(/ -> \w+ -> /, '>'))).size;
    const shares = Object.values(s.share).sort((a, b) => a - b), med = shares.length ? shares[Math.floor(shares.length / 2)] : 0;
    return {
      ok: r.problems.length === 0 && IDS.length > 0 && read === CHUNK.length,
      detail: `${IDS.length} events (${s.firsts} callbacks, ${s.seconds} second steps), ${read}/${CHUNK.length} flags read ` +
        `(${(reads / CHUNK.length).toFixed(2)} per flag), ${arcs} arcs, ${s.histories} histories, ${s.outcomes} outcomes taken, ` +
        `median share of a year's draw ${(med * 100).toFixed(1)}%` + (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 8).join('; ')}` : ''),
      data: Object.assign(s, { problems: r.problems }),
    };
  },
};
