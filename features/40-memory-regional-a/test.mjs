// Browser test for features/40-memory-regional-a (memory callbacks, chunk "regional-a").
//
// mraMemory checks, against the built page:
//   1. every mra_ event in regional-a.events.js is registered in A.EV;
//   2. every one of the chunk's 28 orphan flags is read by at least one mra_ event's cond, with C.flag(p, "x")
//      or p.flags.x, and every cond times its flag (A.S.year - p.flags.x >= N, N from 1 to 20);
//   3. every mra_ flag these events set is read again by another mra_ event (the two-step arcs; at least 5);
//   4. shape: weight 2 or 3, choice labels <= 12 words, outcome text <= 45 words, and at least one branch per
//      event that leaves a lasting mark (trait, flag, relation, wound, deed, job, debt, prison...);
//   5. a play-test of every event under forced history: for each event it builds characters that satisfy the
//      cond (the right realm, sex, stage and race, the flags set N years ago, rich and poor, literate and not,
//      each side of an "or" flag), checks the cond is false when the flag was set this year, renders the event
//      (no skip, no raw {token}, text <= 80 words) and takes every choice from the same saved state, forcing
//      each check to win and to lose, failing on engine errors, raw tokens, NaN/undefined or long results.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(here, 'regional-a.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid:\s*"(mra_[a-z0-9_]+)"/g)].map(m => m[1]);
// the chunk's orphan memories (from /tmp/ardan/content/chunk-regional-a.json, kept here so the test stands alone)
const CHUNK = ['ss_nw_yam', 'ss_nw_arrowfield', 'ss_nw_oilroad', 'ss_nw_hordeknife', 'ss_qd_pilot', 'ss_qd_qasimi', 'ss_qd_horn',
  'unfree', 'ss_tm_debt', 'runaway', 'ss_tm_lowfloods', 'ss_tm_mice', 'ss_tm_scribe', 'ss_tm_ibis', 'ss_tm_faruq',
  'ss_sc_blackveil', 'ss_sc_marad', 'ss_zn_hand', 'ss_zn_mask', 'ss_zn_runner', 'ss_zn_letter', 'ss_ks_swimmer',
  'ss_ks_holes', 'ss_ks_auger', 'ss_ks_wethands', 'ss_ks_storm', 'ss_ab_desta', 'ss_ab_monundi'];

export default {
  async mraMemory(pg) {
    const r = await pg.evaluate(({ ids, chunk }) => {
      const problems = [], stats = { events: ids.length, variants: 0, choicesTaken: 0, flags: {}, arcs: [] };
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const RAW = /\{[A-Za-z0-9_.]+\}/, BAD = /\bNaN\b|\bundefined\b|\[object /;
      const src = f => (typeof f === 'function' ? f.toString() : JSON.stringify(f || ''));
      const fxSrc = c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].map(src).join(' ');
      const reads = (cs, f) => new RegExp(`C\\.flag\\(p,\\s*"${f}"\\)|p\\.flags\\.${f}\\b`).test(cs);

      // 1. registered
      for (const id of ids) if (!A.EV[id]) problems.push(`${id}: not registered`);
      const evs = ids.map(id => A.EV[id]).filter(Boolean);

      // 2. every chunk flag is read, and every cond is timed
      for (const f of chunk) {
        const mine = evs.filter(e => reads(e.cond.toString(), f)).map(e => e.id);
        const any = Object.values(A.EV).filter(e => e.cond && e.cond.toString().includes(f)).length;
        stats.flags[f] = mine;
        if (!mine.length) problems.push(`flag ${f}: no mra_ event reads it`);
        if (!any) problems.push(`flag ${f}: no event's cond mentions it`);
      }
      for (const e of evs) {
        const cs = e.cond.toString();
        const t = [...cs.matchAll(/A\.S\.year\s*-\s*\(?p\.flags\.(\w+)[^>]*?>=\s*(\d+)/g)];
        if (!t.length) problems.push(`${e.id}: cond does not time its flag`);
        for (const m of t) if (+m[2] < 1 || +m[2] > 20) problems.push(`${e.id}: odd delay ${m[2]}`);
        if (!/C\.flag\(p,/.test(cs)) problems.push(`${e.id}: cond has no C.flag(...)`);
        if (!/C\.realm\(p,\s*"POL-\d+"\)/.test(cs)) problems.push(`${e.id}: cond has no realm gate`);
        if (!/C\.(adult|old)\(p\)/.test(cs)) problems.push(`${e.id}: cond has no stage gate`);
        if (e.w !== 2 && e.w !== 3) problems.push(`${e.id}: weight ${e.w}`);
        if (!e.once) problems.push(`${e.id}: not once`);
      }

      // 3. arcs: every mra_ flag set here is read again by a different mra_ event
      const setters = {};
      for (const e of evs) for (const c of e.choices || []) for (const m of fxSrc(c).matchAll(/(?<![A-Za-z])["']?flag["']?\s*:\s*["'](mra_\w+)["']/g)) (setters[m[1]] = setters[m[1]] || new Set()).add(e.id);
      for (const f in setters) {
        const rd = evs.filter(e => reads(e.cond.toString(), f) && !setters[f].has(e.id)).map(e => e.id);
        if (!rd.length) problems.push(`arc flag ${f} is set but never read`);
        for (const s of setters[f]) for (const x of rd) stats.arcs.push(`${s} -> ${f} -> ${x}`);
      }
      const arcPairs = new Set(stats.arcs.map(a => a.replace(/ -> \w+ -> /, '>')));
      if (arcPairs.size < 5) problems.push(`only ${arcPairs.size} two-step arcs`);

      // 4. shape and lasting marks
      const LASTING = /["']?(trait|flag|unflag|them|newRel|wound|deed|epithet|job|sworn|owed|oweThem|prison|punish|gear|apt|letter)["']?\s*:|addDebt|p\.flags\.\w+\s*=/;
      for (const e of evs) {
        if (!(e.choices || []).some(c => LASTING.test(fxSrc(c)))) problems.push(`${e.id}: no branch leaves a lasting mark`);
        for (const c of e.choices || []) {
          if (typeof c.t === 'string' && words(c.t) > 12) problems.push(`${e.id}: label "${c.t}" over 12 words`);
          for (const b of [c, c.win, c.lose]) if (b && typeof b.r === 'string' && words(b.r) > 45) problems.push(`${e.id}: outcome over 45 words: ${b.r.slice(0, 40)}`);
        }
        if (typeof e.text === 'string' && words(e.text) > 80) problems.push(`${e.id}: text over 80 words`);
        // effect values the engine would silently ignore: unknown wounds, traits, careers, skills, check stats
        const KNOWN = { wound: GD.WOUNDS, trait: GD.TRAITS, untrait: GD.TRAITS, job: GD.CAREERS };
        for (const c of e.choices || []) {
          const s = fxSrc(c);
          for (const m of s.matchAll(/["']?(wound|trait|untrait|job)["']?\s*:\s*["'](\w+)["']/g)) if (!KNOWN[m[1]][m[2]]) problems.push(`${e.id}: unknown ${m[1]} ${m[2]}`);
          for (const m of s.matchAll(/["']?skill["']?\s*:\s*\{([^}]*)\}/g)) for (const k of [...m[1].matchAll(/["']?(\w+)["']?\s*:/g)].map(x => x[1])) if (!GD.SKILLS[k]) problems.push(`${e.id}: unknown skill ${k}`);
          for (const k of c.check ? [c.check.s, c.check.s2] : []) if (k && !GD.SKILLS[k] && !GD.STATS.includes(k)) problems.push(`${e.id}: unknown check ${k}`);
        }
      }

      // 5. play-test under forced history
      let cur = '';
      const ce = console.error;
      console.error = (...a) => { problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const odds = A.checkOdds;
      const bases = {};
      const baseFor = (realm, race, sex, old) => {
        const R = GD.RACES[race], age = old ? R.old + Math.ceil(R.adult / 3) : Math.round(R.adult + (R.old - R.adult) * 0.3);
        const k = [realm, race, sex, old].join('|');
        if (!bases[k]) {
          A.newGame({ seed: 4040, race, realm, status: 'peasant', startAge: age, sex });
          const p = A.pc();
          p.mil = p.mil || null;
          if (A.age(p) !== age) p.born = A.S.year - age; // newGame caps the starting age; an old probe needs an old body
          bases[k] = A.serialize();
        }
        return bases[k];
      };
      // special histories that a plain character cannot have
      const PREP = {
        mra_ks_storm_prince: [p => { const q = A.personFromCast('CHR-0559'); q.born = A.S.year - 9; }, p => { const q = A.personFromCast('CHR-0559'); q.born = A.S.year - 22; }],
        mra_nw_dorin_staff: [null, p => { const q = A.personFromCast('CHR-0316'); q.alive = false; q.died = A.S.year - 1; }],
        mra_nw_knife_raid: [null, p => { const q = A.newPerson({ given: 'Grath', sex: 'M', race: 'orc', realm: 'POL-11', born: A.S.year - 30 }); A.link(p, q, 'friend', 40, 'friend'); }],
        mra_tm_runaway_again: [null, p => { const q = A.newPerson({ given: 'Nakht', sex: 'M', race: 'human', realm: p.realm, born: A.S.year - 47, occ: 'a temple tally-man' }); A.link(p, q, 'acquaint', -10, 'acquaint'); }],
        mra_zn_mask_night: [null, p => { const q = A.newPerson({ given: 'Kato', sex: 'M', race: 'human', realm: p.realm, born: A.S.year - 35 }); A.link(p, q, 'rival', -30, 'rival'); }],
        mra_zn_hand_heir: [null, p => { const r = A.realm('POL-20'), ru = r && A.P(r.ruler); if (ru) ru.given = 'Juma'; }],
      };
      for (const e of evs) {
        const cs = e.cond.toString();
        const realm = (cs.match(/C\.realm\(p,\s*"(POL-\d+)"\)/) || [])[1];
        const male = /C\.male\(p\)/.test(cs), old = /(^|[^!])C\.old\(p\)/.test(cs);
        const raceArg = cs.match(/C\.race\(p,\s*([^)]*)\)/);
        let races = raceArg ? [...raceArg[1].matchAll(/"(\w+)"/g)].map(m => m[1]) : ['human'];
        if (!raceArg) { const alt = GD.RACE_LIST.find(x => x !== 'human' && A.raceAllowed(x, realm)); if (alt) races.push(alt); }
        const flagsRead = [...new Set([...cs.matchAll(/C\.flag\(p,\s*"(\w+)"\)/g)].map(m => m[1]))];
        const orGroup = cs.match(/\(C\.flag\(p,\s*"(\w+)"\)\s*\|\|\s*C\.flag\(p,\s*"(\w+)"\)\)/);
        const delay = f => { const m = cs.match(new RegExp(`p\\.flags\\.${f}[^>]*?>=\\s*(\\d+)`)) || cs.match(/>=\s*(\d+)/); return m ? +m[1] : 3; };
        const sets = orGroup ? [flagsRead.filter(f => f !== orGroup[2]), flagsRead.filter(f => f !== orGroup[1])] : [flagsRead];
        const preps = PREP[e.id] || [null];
        let eligibleOnce = false;
        for (const race of races) for (const fl of sets) for (const prep of preps) for (const rich of [true, false]) {
          const sex = male ? 'M' : (rich ? 'F' : 'M');
          A.deserialize(JSON.parse(baseFor(realm, race, sex, old)));
          const p = A.pc();
          const vtag = `${e.id} [${race} ${sex}${old ? ' old' : ''} ${rich ? 'rich' : 'poor'} ${fl.join('+')}${prep ? ' prep' : ''}]`;
          cur = vtag;
          for (const f of fl) p.flags[f] = A.S.year - delay(f) - 1;
          if (/p\.flags\.unfree\s*===\s*"debt"/.test(cs)) { p.flags.unfree = 'debt'; p.status = 'serf'; }
          p.coin = rich ? 500 : 0; p.literate = rich;
          if (prep) prep(p);
          let ok = false;
          try { ok = !!e.cond(p, A.C); } catch (err) { problems.push(`${vtag}: cond throws ${err.message}`); continue; }
          if (!ok) { problems.push(`${vtag}: not eligible under its own probe`); continue; }
          eligibleOnce = true;
          // the time gate: a flag set this year must not fire the callback yet
          const keep = fl.map(f => p.flags[f]);
          fl.forEach(f => { p.flags[f] = A.S.year; });
          if (e.cond(p, A.C)) problems.push(`${vtag}: fires in the same year as its flag`);
          fl.forEach((f, i) => { p.flags[f] = keep[i]; });
          const base = A.serialize();
          stats.variants++;
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
              if (words(v.text) > 80) problems.push(`${vtag}: rendered text ${words(v.text)} words`);
              for (const c of v.choices) if (words(c.t) > 12) problems.push(`${vtag}: rendered label ${words(c.t)} words`);
              if (v.choices.filter(c => c.i >= 0).length < 1) problems.push(`${vtag}: no choice available`);
            }
            const idx = v.choices.findIndex(c => c.i === i);
            if (idx < 0) continue; // a req hid this choice for this character
            cur = `${vtag} choice ${i + 1}${force === null ? '' : force ? ' win' : ' lose'}`;
            if (force !== null) A.checkOdds = () => force;
            try {
              A.eventChoose(idx);
              const res = A.S.queue[0] && A.S.queue[0].result;
              const rt = res ? String(res.text || '') : '';
              if (RAW.test(rt)) problems.push(`${cur}: raw token in result ${rt.match(RAW)[0]}`);
              if (BAD.test(rt)) problems.push(`${cur}: bad result text ${rt.match(BAD)[0]}`);
              if (words(rt) > 75) problems.push(`${cur}: result ${words(rt)} words`);
              if (!rt.trim()) problems.push(`${cur}: empty result`);
              if (force !== null && res && res.success !== !!force) problems.push(`${cur}: check not forced`);
              A.eventClose();
              stats.choicesTaken++;
            } catch (err) { problems.push(`${cur}: throws ${err.message}`); }
            finally { A.checkOdds = odds; }
          }
        }
        if (!eligibleOnce) problems.push(`${e.id}: never eligible`);
      }
      console.error = ce;
      A.checkOdds = odds;
      return { problems: [...new Set(problems)], stats };
    }, { ids: IDS, chunk: CHUNK });
    const read = Object.values(r.stats.flags).filter(x => x.length).length;
    const reads = Object.values(r.stats.flags).reduce((a, x) => a + x.length, 0);
    const arcs = new Set(r.stats.arcs.map(a => a.replace(/ -> \w+ -> /, '>'))).size;
    return {
      ok: r.problems.length === 0 && IDS.length > 0,
      detail: `${IDS.length} events, ${read}/${CHUNK.length} flags read (${(reads / CHUNK.length).toFixed(2)} per flag), ${arcs} arcs, ` +
        `${r.stats.variants} histories, ${r.stats.choicesTaken} outcomes taken` + (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 6).join('; ')}` : ''),
      data: Object.assign(r.stats, { problems: r.problems }),
    };
  },
};
