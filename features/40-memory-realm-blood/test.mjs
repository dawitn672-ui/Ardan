// Browser test for features/40-memory-realm-blood (memory callbacks, chunk "realm-blood").
//
// mrbMemory checks, against the built page:
//   1. every mrb_ event in realm-blood.events.js is registered in A.EV;
//   2. every one of the chunk's 29 orphan flags is read by at least one event's cond (any A.EV value whose cond
//      source names it) and by at least one mrb_ cond with C.flag(p, "x"); at least 1.3 callbacks per flag;
//   3. every cond is timed (A.S.year - p.flags.x >= N, N from 2 to 20) and has a stage gate, and keeps the
//      setter's world: the realm (or faith) of a local custom, the blood of a bloodline test, the military
//      family of the family scenes; an arc's second step keeps the world of the step that opened it;
//   4. every mrb_ flag these events set is read again by a different mrb_ event (the two-step arcs; at least 5),
//      and the choice that opens an arc books its reckoning with A.schedule;
//   5. craft: weight 2 or 3, once, 2 to 4 choices, text <= 80 words, labels <= 12, outcomes <= 45, at least one
//      branch per event that leaves a lasting mark, no unknown trait/wound/career/skill/check, and none of the
//      release's tics ("looks at you a long time", "for the rest of your life", a sentence opening "Nobody");
//   6. a play-test of every event under forced history: characters built to satisfy the cond (the realm or the
//      faith, each race the cond allows, the blood shown, the military family, adult or old or young, children
//      of the right age, the person an arc marked years ago, each side of an "or" flag, rich and poor). The cond
//      must be false in the year its flag was set, and false again once the world gate is taken away. The event
//      must render (no skip, no raw {token}, text <= 80 words, labels <= 12) and every choice is taken from the
//      same saved state, forcing each check to win and to lose: no engine error, no raw token, NaN or
//      undefined, results <= 75 words, the flag a branch promises is set, and a booked copy of an arc's second
//      step drops itself once the player has seen it;
//   7. the arcs end to end: after a choice that opens an arc, the same character, years later, is eligible for
//      the second step and it renders with the same person (the marked relation) where the arc needs one.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.join(here, 'realm-blood.events.js'), 'utf8');
const IDS = [...SRC.matchAll(/\bid:\s*"(mrb_[a-z0-9_]+)"/g)].map(m => m[1]);
// the chunk's orphan memories (from /tmp/ardan/content/chunk-realm-blood.json, kept here so the test stands alone)
const CHUNK = ['rl_ald_sworn', 'rl_ald_lic', 'rl_id_thief', 'rl_id_petition', 'rl_gh_diver', 'rl_os_fled', 'rl_needle_doubt',
  'rl_va_wheel_sold', 'rl_rememberer', 'rl_sb_oil', 'rl_dv_listener', 'rl_st_oldtoll', 'rl_em_truetally', 'rl_em_dragon',
  'rl_tk_faced', 'rl_eg_dusk', 'rl_ashen', 'bd_greenglass', 'bd_doravelli_named', 'bd_harrow_match', 'bd_vitia',
  'bd_runners_camp', 'bd_quickened_school', 'bd_lightfoot_scout', 'rk_fm_promised', 'rk_fm_free', 'rk_fm_proved',
  'rk_fm_secret', 'bd_grand_story'];
// The world each setter lives in, as its callbacks must gate it (source of the cond). null: no gate is right
// (rl_os_fled: you fled Ostra, and its bank agents find you anywhere; bd_grand_story: any family).
const WORLD = {
  rl_ald_sworn: 'C\\.realm\\(p, "POL-01"\\)', rl_ald_lic: 'C\\.realm\\(p, "POL-01"\\) && C\\.race\\(p, "halforc", "orc"\\)',
  rl_id_thief: 'C\\.realm\\(p, "POL-10"\\)', rl_id_petition: 'C\\.realm\\(p, "POL-10"\\)', rl_gh_diver: 'C\\.realm\\(p, "POL-14"\\)',
  rl_os_fled: null, rl_needle_doubt: '\\(C\\.realm\\(p, "POL-02"\\) \\|\\| C\\.faith\\(p, "REL-01"\\)\\)',
  rl_va_wheel_sold: 'C\\.realm\\(p, "POL-03"\\)', rl_rememberer: 'C\\.realm\\(p, "POL-20", "POL-22"\\)', rl_sb_oil: 'C\\.realm\\(p, "POL-24"\\)',
  rl_dv_listener: 'C\\.realm\\(p, "POL-26"\\)', rl_st_oldtoll: 'C\\.realm\\(p, "POL-28"\\)', rl_em_truetally: 'C\\.realm\\(p, "POL-29"\\)',
  rl_em_dragon: 'C\\.realm\\(p, "POL-29"\\)', rl_tk_faced: 'C\\.realm\\(p, "POL-34"\\)', rl_eg_dusk: 'C\\.realm\\(p, "POL-07"\\)',
  rl_ashen: '\\(C\\.realm\\(p, "POL-05"\\) \\|\\| C\\.faith\\(p, "REL-15"\\)\\)',
  bd_greenglass: 'C\\.blood\\(p, "falcon"\\)', bd_doravelli_named: 'C\\.blood\\(p, "taster"\\)', bd_harrow_match: 'line\\(p, "bull"\\)',
  bd_vitia: 'C\\.blood\\(p, "laughing"\\)', bd_runners_camp: 'line\\(p, "longwind"\\)', bd_quickened_school: 'C\\.blood\\(p, "quickened"\\)',
  bd_lightfoot_scout: 'line\\(p, "lightfoot"\\)',
  rk_fm_promised: '\\(C\\.famMil\\(p\\) \\|\\| C\\.famKind\\(p, "gentry_mil"\\)\\)', rk_fm_free: '\\(C\\.famMil\\(p\\) \\|\\| C\\.famKind\\(p, "gentry_mil"\\)\\)',
  rk_fm_proved: '\\(C\\.famMil\\(p\\) \\|\\| C\\.famKind\\(p, "gentry_mil"\\)\\)', rk_fm_secret: '\\(C\\.famMil\\(p\\) \\|\\| C\\.famKind\\(p, "gentry_mil"\\)\\)',
  bd_grand_story: null,
};

export default {
  async mrbMemory(pg) {
    const r = await pg.evaluate(({ ids, chunk, world }) => {
      const problems = [], stats = { events: ids.length, variants: 0, choicesTaken: 0, booked: 0, chained: 0, flags: {}, arcs: [] };
      const words = s => (String(s || '').match(/\S+/g) || []).length;
      const RAW = /\{[A-Za-z0-9_.]+\}/, BAD = /\bNaN\b|\bundefined\b|\[object /;
      const TIC = /looks at you a long time|for the rest of your life|(^|[.!?]["']?\s+|")Nobody\b/i;
      const src = f => (typeof f === 'function' ? f.toString() : JSON.stringify(f || ''));
      const fxSrc = c => [c.fx, c.win && c.win.fx, c.lose && c.lose.fx].map(src).join(' ');
      const reads = (cs, f) => new RegExp(`C\\.flag\\(p,\\s*"${f}"\\)`).test(cs);
      const sets = s => [...s.matchAll(/(?<![A-Za-z])["']?flag["']?\s*:\s*["'](mrb_\w+)["']/g)].map(m => m[1]);

      // 1. registered
      for (const id of ids) if (!A.EV[id]) problems.push(`${id}: not registered`);
      const evs = ids.map(id => A.EV[id]).filter(Boolean);

      // 2. every chunk flag is read
      let reads1 = 0;
      for (const f of chunk) {
        const mine = evs.filter(e => reads(e.cond.toString(), f)).map(e => e.id);
        const any = Object.values(A.EV).filter(e => e.cond && e.cond.toString().includes(f)).length;
        stats.flags[f] = mine;
        reads1 += mine.length;
        if (!mine.length) problems.push(`flag ${f}: no mrb_ event reads it with C.flag`);
        if (!any) problems.push(`flag ${f}: no event's cond mentions it`);
      }
      if (reads1 / chunk.length < 1.3) problems.push(`only ${(reads1 / chunk.length).toFixed(2)} callbacks per flag`);

      // 4. arcs: every mrb_ flag set here is read again by a different mrb_ event (and its world is kept)
      const setters = {};
      for (const e of evs) for (const c of e.choices || []) for (const f of sets(fxSrc(c))) (setters[f] = setters[f] || new Set()).add(e.id);
      const worldOf = e => {
        const cs = e.cond.toString();
        const own = chunk.filter(f => reads(cs, f));
        if (own.length) return own.map(f => world[f]);
        const parents = Object.keys(setters).filter(f => reads(cs, f)).flatMap(f => [...setters[f]]).map(id => A.EV[id]).filter(Boolean);
        return parents.length ? worldOf(parents[0]) : [];
      };
      for (const f in setters) {
        const rd = evs.filter(e => reads(e.cond.toString(), f) && !setters[f].has(e.id)).map(e => e.id);
        // a chunk flag re-set by a callback (rk_fm_free from a broken promise) is a cross-link, not an arc
        if (!rd.length && !chunk.includes(f)) problems.push(`arc flag ${f} is set but never read`);
        for (const s of setters[f]) for (const x of rd) stats.arcs.push(`${s} -> ${f} -> ${x}`);
      }
      const arcPairs = new Set(stats.arcs.map(a => a.replace(/ -> \w+ -> /, '>')));
      if (arcPairs.size < 5) problems.push(`only ${arcPairs.size} two-step arcs`);
      // the choice that opens an arc books the second step
      for (const e of evs) for (const c of e.choices || []) for (const b of [c, c.win, c.lose]) {
        if (!b || !b.fx) continue;
        const s = src(b.fx), fl = sets(s).filter(f => setters[f] && evs.some(x => reads(x.cond.toString(), f) && !setters[f].has(x.id)));
        const bk = [...s.matchAll(/later\("(mrb_\w+)"/g)].map(m => m[1]);
        for (const f of fl) {
          const second = evs.filter(x => reads(x.cond.toString(), f) && x.id !== e.id).map(x => x.id);
          if (!bk.some(x => second.includes(x)) && !/C\.old\(p\)/.test(second.map(x => A.EV[x].cond.toString()).join(' '))) problems.push(`${e.id}: sets ${f} but does not book ${second.join('/')}`);
        }
      }

      // 3 and 5. timing, gates, craft
      const LASTING = /["']?(trait|untrait|flag|unflag|them|newRel|wound|deed|epithet|job|sworn|owed|oweThem|prison|punish|rel|letter)["']?\s*:|addDebt|A\.marry|kill\(|bond\(|enlistFam|headPid|mark\(|delete p\.flags/;
      const KNOWN = { wound: GD.WOUNDS, trait: GD.TRAITS, untrait: GD.TRAITS, job: GD.CAREERS };
      for (const e of evs) {
        const cs = e.cond.toString();
        const t = [...cs.matchAll(/A\.S\.year\s*-\s*\(?p\.flags\.(\w+)[^>]*?>=\s*(\d+)/g)];
        if (!t.length) problems.push(`${e.id}: cond does not time its flag`);
        for (const m of t) if (+m[2] < 2 || +m[2] > 20) problems.push(`${e.id}: odd delay ${m[2]}`);
        if (!/C\.flag\(p,/.test(cs)) problems.push(`${e.id}: cond has no C.flag(...)`);
        if (!/C\.(adult|old|teen|young|child)\(p\)/.test(cs)) problems.push(`${e.id}: cond has no stage gate`);
        for (const w of worldOf(e)) if (w && !new RegExp(w).test(cs)) problems.push(`${e.id}: cond does not keep the setter's world (${w})`);
        if (e.w !== 2 && e.w !== 3) problems.push(`${e.id}: weight ${e.w}`);
        if (!e.once) problems.push(`${e.id}: not once`);
        const ch = e.choices || [];
        if (ch.length < 2 || ch.length > 4) problems.push(`${e.id}: ${ch.length} choices`);
        if (!ch.some(c => LASTING.test(fxSrc(c)))) problems.push(`${e.id}: no branch leaves a lasting mark`);
        const strs = [e.title, src(e.text), ...ch.flatMap(c => [c.t, src(c.r), c.win && src(c.win.r), c.lose && src(c.lose.r), src(c.fx)])].filter(Boolean).join(' | ');
        if (TIC.test(strs)) problems.push(`${e.id}: a release tic: ${strs.match(TIC)[0]}`);
        if (typeof e.text === 'string' && words(e.text) > 80) problems.push(`${e.id}: text over 80 words`);
        for (const c of ch) {
          if (typeof c.t === 'string' && words(c.t) > 12) problems.push(`${e.id}: label "${c.t}" over 12 words`);
          for (const b of [c, c.win, c.lose]) if (b && typeof b.r === 'string' && words(b.r) > 45) problems.push(`${e.id}: outcome over 45 words: ${b.r.slice(0, 40)}`);
          const s = fxSrc(c);
          for (const m of s.matchAll(/["']?(wound|trait|untrait|job)["']?\s*:\s*["'](\w+)["']/g)) if (!KNOWN[m[1]][m[2]]) problems.push(`${e.id}: unknown ${m[1]} ${m[2]}`);
          for (const m of s.matchAll(/["']?skill["']?\s*:\s*\{([^}]*)\}/g)) for (const k of [...m[1].matchAll(/["']?(\w+)["']?\s*:/g)].map(x => x[1])) if (!GD.SKILLS[k]) problems.push(`${e.id}: unknown skill ${k}`);
          for (const k of c.check ? [c.check.s, c.check.s2] : []) if (k && !GD.SKILLS[k] && !GD.STATS.includes(k)) problems.push(`${e.id}: unknown check ${k}`);
          if (c.check && (!c.win || !c.lose)) problems.push(`${e.id}: check without win and lose`);
        }
      }

      // 6. play-test under forced history
      let cur = '';
      const ce = console.error;
      console.error = (...a) => { problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      const odds = A.checkOdds;
      const BLOOD = {}; for (const [k, v] of Object.entries(GD.BLOOD)) BLOOD[v.tag] = k;
      const BREALM = { falcon: 'POL-15', taster: 'POL-04', bull: 'POL-01', laughing: 'POL-03', longwind: 'POL-11', quickened: 'POL-06', lightfoot: 'POL-06' };
      const BRACE = { falcon: 'human', taster: 'human', bull: 'human', laughing: 'human', longwind: 'orc', quickened: 'elf', lightfoot: 'elf' };
      const bases = {};
      const ageFor = (race, stage) => { const R = GD.RACES[race]; return stage === 'old' ? R.old + Math.ceil(R.adult / 3) : stage === 'teen' ? Math.round(R.adult * 0.9) : stage === 'young' ? Math.round(R.adult * 0.5) : Math.round(R.adult + (R.old - R.adult) * 0.3); };
      const baseFor = (realm, race, sex, stage) => {
        const k = [realm, race, sex, stage].join('|');
        if (!bases[k]) {
          const age = ageFor(race, stage);
          A.newGame({ seed: 4040, race, realm, status: 'peasant', startAge: age, sex });
          const p = A.pc();
          if (p.realm !== realm || p.race !== race) problems.push(`probe ${k}: newGame gave ${p.race} in ${p.realm}`);
          p.mil = null; p.house = null;
          if (A.age(p) !== age) p.born = A.S.year - age; // newGame caps the starting age
          bases[k] = A.serialize();
        }
        return bases[k];
      };
      const person = (p, o) => {
        const q = A.newPerson(Object.assign({ given: o.given || 'Probe', sex: o.sex || 'M', race: o.race || p.race, realm: p.realm, cult: p.cult, faith: p.faith, born: A.S.year - (o.age || 30), home: p.home }, o.extra || {}));
        return q;
      };
      const addKid = (p, age, blood) => {
        const k = person(p, { given: 'Kid', sex: 'F', age, extra: { parents: [p.id] } });
        if (blood) k.blood = blood;
        p.children.push(k.id);
        A.link(p, k, 'child', 40, p.sex === 'F' ? 'mother' : 'father');
        return k;
      };
      // everything a cond can ask for besides flags: stage-independent world, kids, family, marked people
      const furnish = (e, p, v, withMarks) => {
        const cs = e.cond.toString(), ss = e.setup ? e.setup.toString() : '';
        if (v.blood) p.blood = { id: BLOOD[v.blood], show: true };
        if (v.faith) p.faith = v.faith;
        if (/C\.famMil\(p\)/.test(cs)) {
          const hs = Object.values(A.S.houses).filter(h => h.military && h.headPid !== p.id);
          const h = hs.find(x => x.realm === p.realm) || hs[0];
          if (h) p.house = h.id; else problems.push(`${e.id}: no military family to probe with`);
        }
        if (/!C\.married\(p\)/.test(cs)) p.spouse = null;
        if (/!C\.soldier\(p\)/.test(cs)) p.mil = null;
        if (/grownKid\(p\)/.test(cs) && !A.relsOf(p, ['child']).some(x => x.p.alive && A.isAdult(x.p))) addKid(p, GD.RACES[p.race].adult + 2);
        const ka = cs.match(/kidAged\(p, (\d+), (\d+)\)/);
        if (ka && !A.relsOf(p, ['child']).some(x => x.p.alive && A.age(x.p) >= +ka[1] && A.age(x.p) <= +ka[2])) {
          const tag = (ss.match(/shows\(k, "(\w+)"\)/) || [])[1];
          addKid(p, +ka[1] + 1, tag && v.kidShows != null ? { id: BLOOD[tag], show: v.kidShows } : null);
        }
        if (/C\.parentsAlive\(p\)/.test(cs) && !A.relsOf(p, ['father', 'mother']).some(x => x.p.alive)) {
          const par = person(p, { given: 'Parent', sex: 'F', age: A.age(p) + 25 }); A.link(p, par, 'mother', 30, 'child');
        }
        if (withMarks) for (const m of ss.matchAll(/marked\(p, ctx, "(\w+)"\)/g)) {
          const q = person(p, { given: 'Marked', sex: 'M', age: 30 });
          A.link(p, q, 'friend', 20, 'friend'); p.rel[q.id].mrb = m[1];
        }
        if (v.grand) { // a dead grandparent who is the father's parent: the "own child" line
          const par = A.relsOf(p, ['father', 'mother']).map(x => x.p).find(q => q.alive);
          const g = person(p, { given: 'Grand', sex: 'F', age: A.age(p) + 50 });
          if (par) g.children = [par.id];
          A.link(p, g, 'grandparent', 50, 'grandchild'); A.kill(g, 'old age', true);
        }
      };
      const variantsFor = e => {
        const cs = e.cond.toString(), ss = e.setup ? e.setup.toString() : '';
        const realms = [...(cs.match(/C\.realm\(p, ([^)]*)\)/) || [, ''])[1].matchAll(/"(POL-\d+)"/g)].map(m => m[1]);
        const faith = (cs.match(/C\.faith\(p, "(REL-\d+)"\)/) || [])[1];
        const btag = (cs.match(/(?:C\.blood|line)\(p, "(\w+)"\)/) || [])[1];
        const raceArg = cs.match(/C\.race\(p, ([^)]*)\)/);
        const stage = /(^|[^!])C\.old\(p\)/.test(cs) ? 'old' : 'adult';
        const out = [];
        const worlds = [];
        if (btag) worlds.push({ realm: BREALM[btag], blood: btag, races: [BRACE[btag]] });
        else if (realms.length) for (const rl of realms) worlds.push({ realm: rl });
        else worlds.push({ realm: /C\.famMil/.test(cs) ? 'POL-03' : 'POL-01' });
        if (faith) worlds.push({ realm: 'POL-01', faith }); // the faith side of a realm-or-faith gate, outside the realm
        for (const w of worlds) {
          let races = w.races || (raceArg ? [...raceArg[1].matchAll(/"(\w+)"/g)].map(m => m[1]) : ['human']);
          if (!w.races && !raceArg) { const alt = GD.RACE_LIST.find(x => x !== 'human' && A.raceAllowed(x, w.realm)); if (alt) races = races.concat(alt); }
          const stages = [stage];
          if (/C\.teen\(p\)/.test(cs) && stage !== 'old') stages.push('teen');
          if (/C\.young\(p\)/.test(cs) && stage !== 'old') stages.push('young');
          const kidShows = /shows\(k, "\w+"\)/.test(ss) ? [true, false] : [null];
          const grand = e.id === 'mrb_bd_grand_ask' ? [true, false] : [false];
          for (const race of races) for (const st of stages) for (const ks of kidShows) for (const gr of grand)
            out.push(Object.assign({}, w, { race, stage: st, kidShows: ks, grand: gr }));
        }
        return out;
      };
      const flagsOf = cs => [...new Set([...cs.matchAll(/C\.flag\(p, "(\w+)"\)/g)].map(m => m[1]))];
      const delayOf = (cs, f) => { const i = cs.indexOf(`p.flags.${f}`); const m = i >= 0 ? cs.slice(i).match(/>=\s*(\d+)/) : null; return m ? +m[1] : 3; };
      // take one choice from a saved state; returns false when the choice is hidden for this character
      const take = (e, base, i, force, vtag, after) => {
        A.deserialize(JSON.parse(base)); A.S.queue = [];
        const q = { type: 'event', ev: e.id }; A.S.queue.unshift(q);
        const v = A.eventView(q);
        const idx = v.choices.findIndex(c => c.i === i);
        if (idx < 0) return false;
        cur = `${vtag} choice ${i + 1}${force === null ? '' : force ? ' win' : ' lose'}`;
        if (force !== null) A.checkOdds = () => force;
        const c = e.choices[i], taken = c.check ? (force ? c.win : c.lose) : c;
        const s = src(taken && taken.fx), books = [...s.matchAll(/later\("(mrb_\w+)"/g)].map(m => m[1]), promised = sets(s);
        try {
          A.eventChoose(idx);
          const res = A.S.queue[0] && A.S.queue[0].result;
          const rt = res ? String(res.text || '') : '';
          if (RAW.test(rt)) problems.push(`${cur}: raw token in result ${rt.match(RAW)[0]}`);
          if (BAD.test(rt)) problems.push(`${cur}: bad result text ${rt.match(BAD)[0]}`);
          if (words(rt) > 75) problems.push(`${cur}: result ${words(rt)} words`);
          if (!rt.trim()) problems.push(`${cur}: empty result`);
          if (TIC.test(rt)) problems.push(`${cur}: a release tic in the result`);
          if (force !== null && res && res.success !== !!force) problems.push(`${cur}: check not forced`);
          const p = A.pc();
          for (const f of promised) if (p.flags[f] !== A.S.year) problems.push(`${cur}: flag ${f} not set`);
          const booked = (A.S.sched || []).filter(x => x.item && /^mrb_/.test(x.item.ev || '')).map(x => x.item.ev);
          for (const b of books) if (!booked.includes(b)) problems.push(`${cur}: did not book ${b}`);
          if (!books.length && booked.length) problems.push(`${cur}: booked ${booked[0]} without opening an arc`);
          stats.booked += books.length;
          A.eventClose();
          stats.choicesTaken++;
          if (after) after(books, promised);
        } catch (err) { problems.push(`${cur}: throws ${err.message}`); }
        finally { A.checkOdds = odds; }
        return true;
      };
      // 7. the arc, end to end: years pass, and the same character meets the second step
      const chain = (vtag, books) => {
        for (const ev of books) {
          const e2 = A.EV[ev], p = A.pc();
          if (!e2) { problems.push(`${vtag}: books missing event ${ev}`); continue; }
          for (const f in p.flags) if (typeof p.flags[f] === 'number' && p.flags[f] >= A.S.year - 1) p.flags[f] -= 15;
          if (/(^|[^!])C\.old\(p\)/.test(e2.cond.toString())) { const R = GD.RACES[p.race]; p.born = A.S.year - R.old - 2; }
          furnish(e2, p, {}, false);
          let ok = false; try { ok = !!e2.cond(p, A.C); } catch (err) { problems.push(`${vtag} -> ${ev}: cond throws ${err.message}`); }
          if (!ok) { problems.push(`${vtag} -> ${ev}: the second step is not eligible years later`); continue; }
          A.S.queue = []; const q = { type: 'event', ev }; A.S.queue.unshift(q);
          const v = A.eventView(q);
          if (v.skip) problems.push(`${vtag} -> ${ev}: the second step skips itself (lost its person?)`);
          else if (RAW.test(v.text)) problems.push(`${vtag} -> ${ev}: raw token`);
          else stats.chained++;
        }
      };
      for (const e of evs) {
        const cs = e.cond.toString(), ss = e.setup ? e.setup.toString() : '';
        const flags = flagsOf(cs);
        const orGroup = cs.match(/\(C\.flag\(p, "(\w+)"\) \|\| C\.flag\(p, "(\w+)"\)\)/);
        const flagSets = orGroup ? [flags.filter(f => f !== orGroup[2]), flags.filter(f => f !== orGroup[1])] : [flags];
        let eligibleOnce = false;
        for (const v of variantsFor(e)) for (const fl of flagSets) for (const rich of [true, false]) {
          const sex = rich ? 'F' : 'M';
          A.deserialize(JSON.parse(baseFor(v.realm, v.race, sex, v.stage)));
          const p = A.pc();
          const vtag = `${e.id} [${v.race} ${sex} ${v.stage} ${v.realm}${v.faith ? ' ' + v.faith : ''} ${rich ? 'rich' : 'poor'} ${fl.join('+')}${v.kidShows != null ? ' kid ' + v.kidShows : ''}${v.grand ? ' grand' : ''}]`;
          cur = vtag;
          for (const f of fl) p.flags[f] = A.S.year - delayOf(cs, f) - 1;
          p.coin = rich ? 800 : 0; p.literate = rich;
          furnish(e, p, v, true);
          let ok = false;
          try { ok = !!e.cond(p, A.C); } catch (err) { problems.push(`${vtag}: cond throws ${err.message}`); continue; }
          if (!ok) { problems.push(`${vtag}: not eligible under its own probe`); continue; }
          eligibleOnce = true;
          // the time gate: a flag set this year must not fire the callback yet
          const keep = fl.map(f => p.flags[f]);
          fl.forEach(f => { p.flags[f] = A.S.year; });
          if (e.cond(p, A.C)) problems.push(`${vtag}: fires in the same year as its flag`);
          fl.forEach((f, i) => { p.flags[f] = keep[i]; });
          // the world gate: take the world away and the callback must not fire
          const saved = { realm: p.realm, faith: p.faith, blood: p.blood, house: p.house };
          if (v.blood) p.blood = null;
          else if (/C\.famMil/.test(cs)) p.house = null;
          else if (/C\.realm\(/.test(cs)) { p.realm = 'POL-08'; if (v.faith || /C\.faith\(/.test(cs)) p.faith = 'REL-18'; }
          if ((v.blood || /C\.famMil|C\.realm\(/.test(cs)) && e.cond(p, A.C)) problems.push(`${vtag}: fires outside the setter's world`);
          Object.assign(p, saved);
          const base = A.serialize();
          stats.variants++;
          // a booked copy of an arc's second step drops itself once the scene was seen
          if (/fresh\(p, "/.test(ss)) {
            p.flags.ev = p.flags.ev || {}; p.flags.ev[e.id] = A.S.year - 1;
            let sk = false; try { sk = A.eventView({ type: 'event', ev: e.id }).skip; } catch (err) { problems.push(`${vtag}: guard view throws ${err.message}`); }
            if (!sk) problems.push(`${vtag}: a booked copy would fire after the scene was seen`);
            A.deserialize(JSON.parse(base));
          }
          // render once
          A.S.queue = []; const q0 = { type: 'event', ev: e.id }; A.S.queue.unshift(q0);
          let v0;
          try { v0 = A.eventView(q0); } catch (err) { problems.push(`${vtag}: view throws ${err.message}`); continue; }
          if (v0.skip) { problems.push(`${vtag}: skipped by the engine`); continue; }
          const all = [v0.title, v0.text, ...v0.choices.map(c => c.t)].join(' | ');
          if (RAW.test(all)) problems.push(`${vtag}: raw token ${all.match(RAW)[0]}`);
          if (BAD.test(all)) problems.push(`${vtag}: bad text ${all.match(BAD)[0]}`);
          if (words(v0.text) > 80) problems.push(`${vtag}: rendered text ${words(v0.text)} words`);
          for (const c of v0.choices) if (words(c.t) > 12) problems.push(`${vtag}: rendered label ${words(c.t)} words`);
          if (v0.choices.filter(c => c.i >= 0).length < 2) problems.push(`${vtag}: fewer than two choices open`);
          // every choice, every check both ways, from the same state
          (e.choices || []).forEach((c, i) => {
            for (const force of c.check ? [100, 0] : [null]) take(e, base, i, force, vtag, books => { if (books.length) chain(cur, books); });
          });
        }
        if (!eligibleOnce) problems.push(`${e.id}: never eligible`);
      }
      console.error = ce;
      A.checkOdds = odds;
      return { problems: [...new Set(problems)], stats };
    }, { ids: IDS, chunk: CHUNK, world: WORLD });
    const read = Object.values(r.stats.flags).filter(x => x.length).length;
    const reads = Object.values(r.stats.flags).reduce((a, x) => a + x.length, 0);
    const arcs = new Set(r.stats.arcs.map(a => a.replace(/ -> \w+ -> /, '>'))).size;
    return {
      ok: r.problems.length === 0 && IDS.length > 0,
      detail: `${IDS.length} events, ${read}/${CHUNK.length} flags read (${(reads / CHUNK.length).toFixed(2)} per flag), ${arcs} arcs, ` +
        `${r.stats.variants} histories, ${r.stats.choicesTaken} outcomes taken, ${r.stats.booked} reckonings booked, ${r.stats.chained} arcs followed to the second step` +
        (r.problems.length ? `; ${r.problems.length} problems: ${r.problems.slice(0, 6).join('; ')}` : ''),
      data: Object.assign(r.stats, { problems: r.problems }),
    };
  },
};
