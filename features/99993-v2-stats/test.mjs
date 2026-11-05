// v2 stats: the body adapter, attempt() rolls, v2 fighting worth, faith for those who take it up, and words, not numbers.
export default {
  // height follows the v2 growth curve from birth; an adult's stays put
  async v2sHeight(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 31, race: 'human', sex: 'M', startAge: 0 });
      const pc = A.pc(), out = [];
      for (const age of [0, 1, 3, 6, 10, 14, 18, 25, 40]) { const born = pc.born; pc.born = A.S.year - age; A.V2S.cache = new WeakMap(); out.push([age, A.V2S.height(pc)]); pc.born = born; }
      A.V2S.cache = new WeakMap();
      return { out, adult: pc.app.height };
    });
    const h = r.out.map(x => x[1]);
    const grows = h.slice(0, 7).every((v, i) => i === 0 || v > h[i - 1]);
    const ok = grows && h[0] < 0.35 * r.adult && Math.abs(h[7] - r.adult) <= 1 && h[8] === h[7];
    return { ok, detail: `height by age ${r.out.map(x => `${x[0]}:${x[1]}cm`).join(' ')} (adult ${r.adult})` };
  },

  // strength rises, peaks and declines; the old 0-100 stat is derived from the body and still read by C.stat
  async v2sDerive(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 32, race: 'human', sex: 'M', startAge: 0 });
      const pc = A.pc(), byAge = [];
      for (let y = 0; y < 30; y++) { T.play(1); if (!pc.alive) break; if ([5, 12, 18, 25].includes(A.age(pc))) byAge.push([A.age(pc), Math.round(A.stat(pc, 'str')), Math.round(A.V2S.stats(pc).lift)]); }
      // headroom under the old engine's cap (1.02 x potential), which fx and training both stop at
      if (pc.st.str >= pc.pot.str * 1.02 - 3) { pc.st.str -= 8; A.V2S.sync(pc); }
      const before = { c: pc.v2.c.lift, st: pc.st.str, cstat: A.C.stat(pc, 'str') };
      A.applyFx(pc, { str: 3 }, {});
      A.V2S.sync(pc);
      const after = { c: pc.v2.c.lift, st: pc.st.str, cstat: A.C.stat(pc, 'str') };
      // decline: the same body read at 70
      const born = pc.born; pc.born = A.S.year - 70; A.V2S.cache = new WeakMap(); const old = Math.round(A.V2S.stats(pc).lift); pc.born = born; A.V2S.cache = new WeakMap();
      return { byAge, before, after, old, peak: Math.round(A.V2S.stats(pc).lift), alive: pc.alive };
    });
    const s = r.byAge.map(x => x[1]), l = r.byAge.map(x => x[2]);
    const rises = s.every((v, i) => i === 0 || v >= s[i - 1]) && l.every((v, i) => i === 0 || v > l[i - 1]);
    const ok = r.alive && rises && r.after.c > r.before.c && r.after.st > r.before.st && r.after.cstat > r.before.cstat && r.old < r.peak;
    return { ok, detail: `str/lift by age ${r.byAge.map(x => `${x[0]}: ${x[1]}, ${x[2]} kg`).join('; ')}; fx str +3: cond ${r.before.c} -> ${r.after.c}, st ${r.before.st} -> ${r.after.st}, C.stat ${r.before.cstat} -> ${r.after.cstat}; lift ${r.peak} kg now, ${r.old} kg at 70` };
  },

  // races are different bodies: in levies a giant beats an orc beats a man beats an elf, and the old scale follows
  async v2sRaces(pg) {
    const r = await pg.evaluate(() => {
      const by = {};
      for (const seed of [33, 34]) {
        T.enter({ seed });
        for (const p of Object.values(A.S.people)) {
          if (!p.alive || !p.st || A.age(p) < (GD.RACES[p.race].grown || 20)) continue;
          const o = by[p.race] || (by[p.race] = { lv: [], w: [], lift: [], h: [] });
          o.lv.push(A.V2S.leviesOf(p)); o.w.push(A.fightWorth(p)); o.lift.push(A.V2S.stats(p).lift); o.h.push(A.V2S.height(p));
        }
      }
      const med = a => { a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; }, out = {};
      for (const k in by) out[k] = { n: by[k].lv.length, lv: +med(by[k].lv).toFixed(2), worth: med(by[k].w), lift: Math.round(med(by[k].lift)), h: Math.round(med(by[k].h)) };
      // v2's calibration (tests/v2 'fighting worth'): an ordinary adult giant, and a human master with a breakthrough in order gear
      const H = A.V2.body, avg = { lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1, liftCeil: 1, sprintCeil: 1, marchCeil: 1, reactionCeil: 1, toughnessCeil: 1, heightZ: 0, build: 1 };
      const mk = (race, age, sk, hrs, cond, gear) => ({ race, sex: 'male', age, genes: Object.assign(H.makeGenes(A.V2.rng.makeRng(5), race, 'male'), avg), body: Object.assign(H.newBody(), { skills: { [sk]: hrs }, cond: Object.assign({ lift: 1, sprint: 1, march: 1, reaction: 1, toughness: 1 }, cond) }), gear });
      const giant = H.fightingWorth(mk('ardan_giant', 60, 'axe', 30, {}, 'club'), 'axe', 'club').worth;
      const hero = H.fightingWorth(mk('ardan_human', 30, 'sword', 12000, { lift: 4, sprint: 1.6, reaction: 1.4, toughness: 3 }, 'order'), 'sword', 'order').worth;
      return { out, giant: +giant.toFixed(1), hero: +hero.toFixed(1) };
    });
    const o = r.out;
    const ok = o.giant.lv > 5 * o.human.lv && o.orc.lv > 1.5 * o.human.lv && o.dwarf.lv > o.human.lv && o.giant.worth > o.human.worth + 20 &&
      o.giant.h > 300 && o.dwarf.h < o.human.h && o.giant.lift > 10 * o.human.lift && r.giant > 12 && r.giant < 30 && r.hero >= r.giant * 0.8;
    return { ok, detail: Object.entries(o).map(([k, v]) => `${k} (${v.n}) ${v.lv} levies, worth ${v.worth}, lift ${v.lift} kg, ${v.h} cm`).join('; ') + `; an ordinary giant ${r.giant} levies, a master human with a breakthrough in order gear ${r.hero}` };
  },

  // every event check goes through A.V2.odds.attempt(): 200 events with checks, one check choice each
  async v2sAttempt(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 34, startAge: 25 });
      const pc = A.pc();
      const ids = Object.keys(A.EV).filter(id => (A.EV[id].choices || []).some(c => c && c.check)).sort();
      const step = Math.max(1, Math.floor(ids.length / 400));
      let tried = 0, routed = 0, missed = [];
      // A.V2.odds is a module namespace (read-only), so count the adapter's calls into it
      const N = A.V2S.N; let calls = 0;
      try {
        for (let i = 0; i < ids.length && tried < 200; i += step) {
          const id = ids[i], q = { type: 'event', ev: id, ctx: {} };
          A.S.queue.unshift(q);
          let v; try { v = A.eventView(q); } catch (e) { v = null; }
          const idx = v && !v.skip ? v.choices.findIndex(vc => vc.i >= 0 && A.EV[id].choices[vc.i] && A.EV[id].choices[vc.i].check) : -1;
          if (idx < 0) { A.S.queue = A.S.queue.filter(x => x !== q); continue; }
          const c0 = N.attempts; tried++;
          try { A.eventChoose(idx); } catch (e) {}
          if (N.attempts === c0 + 1) routed++; else missed.push(id);
          A.S.queue = A.S.queue.filter(x => x !== q);
          if (!pc.alive) { pc.alive = true; pc.health = 80; }
          if (pc.prison) pc.prison = null;
        }
      } finally { calls = N.attempts; }
      return { tried, routed, missed: missed.slice(0, 5), N: A.V2S.N };
    });
    return { ok: r.tried >= 200 && r.routed === r.tried, detail: `${r.routed} of ${r.tried} sampled event checks rolled by attempt()${r.missed.length ? '; missed ' + r.missed.join(', ') : ''}; blunders ${r.N.blunders}, surges ${r.N.surges}, breakthroughs ${r.N.breakthroughs} in ${r.N.attempts} attempts` };
  },

  // attempt() keeps the chance it is given (the first draw decides as A.chance did), and judgment and will matter
  async v2sOddsShape(pg) {
    const r = await pg.evaluate(() => {
      const V = A.V2S, n = 4000, at = (p, pct, m) => { let w = 0; const save = V.minds; V.minds = () => m; try { for (let i = 0; i < n; i++) w += V.attempt(null, pct / 100, { stakes: 0.8 }).success ? 1 : 0; } finally { V.minds = save; } return w / n; };
      const A0 = A.S.rngState;
      const avg = { judgment: 100, will: 100, fatigue: 0, mood: 0 };
      return { p50: at(null, 50, avg), p80: at(null, 80, avg), p20: at(null, 20, avg),
        fool: at(null, 85, { judgment: 60, will: 100, fatigue: 0.6, mood: 0 }), sage: at(null, 85, { judgment: 135, will: 100, fatigue: 0, mood: 0 }),
        weak: at(null, 10, { judgment: 100, will: 70, fatigue: 0, mood: 0 }), iron: at(null, 10, { judgment: 100, will: 140, fatigue: 0, mood: 0 }) };
    });
    const ok = Math.abs(r.p50 - 0.5) < 0.05 && Math.abs(r.p80 - 0.8) < 0.06 && Math.abs(r.p20 - 0.2) < 0.06 && r.fool < r.sage - 0.03 && r.iron > r.weak + 0.02;
    return { ok, detail: `won at 50/80/20: ${r.p50}/${r.p80}/${r.p20}; at 85 a tired fool ${r.fool}, a sage ${r.sage}; at 10 a weak will ${r.weak}, an iron will ${r.iron}` };
  },

  // an old save (no v2 body) migrates once, by percentile: the old stats come out of the body as they went in
  async v2sMigrate(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 35, race: 'dwarf', sex: 'F', startAge: 40, status: 'artisan' });
      T.play(2);
      const pc = A.pc();
      delete pc.v2; for (const k in pc.skills) pc.skills[k] = pc.skills[k];
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      const P = d.S.people[d.S.pc], before = {}; for (const s of GD.STATS) before[s] = P.st[s];
      const real = A.S; A.S = d.S;
      let after, v2, stats0 = {}, stats1 = {};
      try {
        for (const s of GD.STATS) stats0[s] = A.stat(P, s);
        A.V2S.sync(P);
        v2 = P.v2 && { v: P.v2.v, mig: P.v2.mig, lift: P.v2.c.lift };
        after = {}; for (const s of GD.STATS) { after[s] = P.st[s]; stats1[s] = A.stat(P, s); }
        A.V2S.sync(P); var again = GD.STATS.every(s => Math.abs(P.st[s] - after[s]) < 0.02);
      } finally { A.S = real; }
      return { before, after, stats0, stats1, v2, again, tier: A.V2S.tierOf(40).name };
    });
    const drift = Math.max(...Object.keys(r.before).map(s => Math.abs(r.stats1[s] - r.stats0[s])));
    return { ok: !!r.v2 && r.v2.v === 1 && drift <= 1 && r.again, detail: `migrated (v ${r.v2 && r.v2.v}, ${r.v2 && r.v2.mig}): the stats checks read moved by at most ${drift}; ${Object.keys(r.before).map(s => `${s} ${Math.round(r.stats0[s])}->${Math.round(r.stats1[s])}`).join(' ')}; a skill of 40 reads as ${r.tier}` };
  },

  // piety is not everyone's: a commoner has none on the sheet, pinned neutral; taking up the faith brings it back
  async v2sFaith(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 36, startAge: 18, status: 'peasant' });
      const pc = A.pc();
      const no = !A.V2S.hasFaith(pc);
      A.applyFx(pc, { piety: 6 }, {});
      const pinned = pc.piety, pull = A.V2S.pull(pc);
      UI.tab = 'life'; UI.render();
      const side = UI.renderProfile();
      const shows = /Piety/.test(side.replace(/<[^>]+>/g, ' '));
      A.V2S.takeFaith(pc);
      const after = pc.piety, has = A.V2S.hasFaith(pc), side2 = UI.renderProfile();
      return { no, pinned, pull, shows, after, has, shows2: /Piety/.test(side2.replace(/<[^>]+>/g, ' ')), ev: !!A.EV.v2s_seek_faith };
    });
    const ok = r.no && r.pinned === 30 && r.pull === 6 && !r.shows && r.has && r.after === 36 && r.shows2 && r.ev;
    return { ok, detail: `faithless by default ${r.no}; piety +6 kept at ${r.pinned}, pull ${r.pull}; piety on the sheet ${r.shows}; after taking up the faith piety ${r.after}, on the sheet ${r.shows2}` };
  },

  // the sheet speaks in units and words; minds as rarity; skills as tiers with hours
  async v2sSheet(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 37, startAge: 24 });
      T.play(3);
      UI.tab = 'life'; UI.render();
      const h = UI.renderProfile(), t = h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      // the playtest's two layout bugs: a second "Body" heading beside 49-body-mind's (the phone's "On this page" listed it
      // twice), and a skill row whose tier sat in the release's number column; each row now has exactly a tier and hours
      const heads = (h.match(/<div class="group-h">([^<]*)<\/div>/g) || []).map(x => x.replace(/<[^>]+>/g, ''));
      const full = UI.profBlock(A.pc());
      const rows = (full.match(/<div class="prow"[\s\S]*?<div class="bar"/g) || []);
      const rowsOk = rows.length > 0 && rows.every(x => /class="v2-tier"/.test(x) && /\d hours</.test(x) && !/<b>\d+<\/b>/.test(x));
      return { t: t.slice(0, 1600), kg: /lifts \d+ kg/.test(t), ms: /\d+(\.\d)? m\/s/.test(t), km: /km a day/.test(t), react: /\d+ ms/.test(t), mind: /Wits/.test(t), tier: /(Untrained|Novice|Apprentice|Journeyman|Adept|Expert|Master)/.test(t) && /hours/.test(t), oldBars: /Strength \d+|Combat Instincts/.test(t),
        dupHeads: heads.length !== new Set(heads).size, heads, rowsOk, rows: rows.length };
    });
    const ok = r.kg && r.ms && r.km && r.react && r.mind && r.tier && !r.oldBars && !r.dupHeads && r.rowsOk;
    return { ok, detail: ok ? r.t.slice(r.t.indexOf('Height'), r.t.indexOf('Height') + 520) : JSON.stringify(r).slice(0, 900) };
  },

  // no percentage reaches the player across a played life: events, results, every tab, the profile and skills
  async v2sNoPct(pg) {
    const r = await pg.evaluate(async () => {
      T.enter({ seed: 38, startAge: 16 });
      const found = [], tick = () => new Promise(res => setTimeout(res, 0));
      const scan = async where => {
        await tick();
        const t = document.body.innerText;
        for (const m of t.match(/[^\n]{0,40}\d\s?%[^\n]{0,20}/g) || []) found.push(where + ': ' + m);
        for (const el of document.querySelectorAll('[title],[aria-label]')) { const v = (el.getAttribute('title') || '') + ' ' + (el.getAttribute('aria-label') || ''); if (/\d\s?%/.test(v)) found.push(where + ' (attribute): ' + v.slice(0, 60)); }
      };
      let evs = 0;
      for (let y = 0; y < 12 && A.pc() && A.pc().alive; y++) {
        const end = A.S.year + 1;
        for (let g = 0; g < 100 && A.S.year < end; g++) {
          const rr = A.advance(400); let h, k = 0;
          while ((h = A.headReady()) && k++ < 60) {
            if (h.type === 'event') { UI.ov = null; UI.render(); if (evs < 120) await scan('event ' + h.ev); evs++; A.eventAuto(); UI.render(); if (evs < 120) await scan('result ' + h.ev); }
            else A.skipPrompt();
          }
          if (rr.why === 'dead' || !A.pc() || !A.pc().alive) break;
        }
        if (y % 4 === 3) { for (const tab of T.tabs()) { UI.tab = tab; UI.render(); await scan('tab ' + tab); } for (const ov of ['profile', 'profs']) { try { UI.A.ov(ov); UI.render(); await scan('ov ' + ov); } catch (e) {} } UI.ov = null; UI.tab = 'life'; UI.render(); }
      }
      return { evs, found: [...new Set(found)] };
    });
    return { ok: r.found.length === 0 && r.evs > 20, detail: `${r.evs} scenes and every tab over 12 years: ${r.found.length ? r.found.length + ' percentages, e.g. ' + r.found.slice(0, 6).join(' | ') : 'no percentage on screen'}` };
  },

  // playtest 2 (old 7, new 11, old 20, old 22): no bare 0-100 number beside a stat word on the pages a bot life visits.
  // Two lives (a commoner in a post, a noble captain) over 9 years: every tab, World's five views, the profile, the
  // proficiencies, the pages of family, the ruler and office holders, the War Room, and a duel. Three checks: a line of
  // text with a stat word and a bare number; an element whose tooltip key names a 0-100 measure (perf, rep, merit,
  // board, coMo, worth, fame, opinion, loyalty …) and still holds digits; a bar whose value is a bare number. Plus the
  // playtest's own lines, read through the same words. (35-moods' needs and the drill bars belong to other groups' fixes.)
  async v2sNoBareNumbers(pg) {
    const r = await pg.evaluate(async () => {
      const W = '(strength|speed|instincts?|stamina|wits|will|willpower|intelligence|renown|opinion(?: of you)?|command(?: skill)?|morale|performance|reputation|merit(?: in your post)?|blood|wind|health|happiness|looks|honou?r|piety|loyalty|discontent|infamy)';
      const LINE = new RegExp(`\\b${W}\\b[:\\s·—–-]{0,3}\\(?[+−-]?\\d{1,4}(?:\\.\\d)?(?:\\s*/\\s*\\d+)?\\b(?!\\s*(?:suns?|years?|days?|months?|men\\b|km|kg|cm|ms|m/s|hours?|levies|blows|AR\\b|of \\d|in \\d))`, 'i');
      const MORE = [/\b\d{1,3} damage\b/, /\bfighter \(\d/, /\+\d+(?:\.\d)?[,.] (?:[a-z]|all|about|nearly)/, /\bmore faster\b/, /(?:assault|attack|charge|defence|defense|march) about (?:a|two|three|half)[^.,]* (?:more|less)\b/, /\b(?!\d0*(?:,000)+\b)\d{1,3}(?:,\d{3})+ suns (?:to|from)\b/];
      const KEYS = new Set(['perf', 'rep', 'merit', 'coMo', 'coDivMo', 'worth', 'fame', 'opinion', 'rulerOp', 'loyalty', 'facDisc', 'feud']);
      const BOARD = /\|(merit|cmd|skill|rep)$/, NEEDS = /^(Rest|Company|Purpose|Comfort)$/;
      const found = [], tick = () => new Promise(res => setTimeout(res, 0));
      const scan = async where => {
        await tick();
        const root = document.querySelector('#modal') && document.querySelector('#modal').innerText.trim() ? document.querySelector('#modal') : document.querySelector('#tabbody');
        const roots = [root, document.querySelector('#profile')].filter(Boolean);
        for (const R of roots) {
          for (const line of R.innerText.split('\n')) if (/\d/.test(line) && (LINE.test(line) || MORE.some(x => x.test(line)))) found.push(`${where}: ${line.trim().slice(0, 90)}`);
          for (const el of R.querySelectorAll('[data-tt]')) {
            const k = el.getAttribute('data-tt'), v = el.getAttribute('data-v') || '';
            if (!(KEYS.has(k) || (k === 'board' && BOARD.test(v))) || el.children.length) continue;
            // a worth is said in levies, a real unit ("about 25 levies")
            if (/\d/.test(el.textContent) && !(k === 'worth' && /\blev(?:y|ies)$/.test(el.textContent.trim()))) found.push(`${where} [${k}]: ${el.textContent.trim().slice(0, 40)}`);
          }
          for (const el of R.querySelectorAll('.barrow > .val')) {
            const l = ((el.parentNode.querySelector('.lbl') || {}).textContent || '').trim();
            if (/^\s*[+−-]?\d{1,3}\s*$/.test(el.textContent) && !NEEDS.test(l)) found.push(`${where} [bar ${l.slice(0, 20)}]: ${el.textContent.trim()}`);
          }
        }
      };
      // the log: the story's own lines (a season's practice, merit, a battle's reckoning)
      const scanLog = where => { for (const line of (document.querySelector('#log') || { innerText: '' }).innerText.split('\n')) if (/\d/.test(line) && (LINE.test(line) || MORE.some(x => x.test(line)))) found.push(`${where} log: ${line.trim().slice(0, 90)}`); };
      let pages = 0;
      for (const st of [{ seed: 38, startAge: 16 }, { seed: 41, startAge: 17, status: 'noble' }]) {
        T.enter(st);
        for (let y = 0; y < 9 && A.pc() && A.pc().alive; y++) {
          T.play(1);
          if (y % 3 !== 2) continue;
          const at = `${st.seed}/${A.S.year}`;
          for (const tab of T.tabs()) { UI.ov = null; UI.tab = tab; UI.render(); await scan(`${at} ${tab}`); pages++; if (tab === 'life') scanLog(at); }
          for (const v of ['dipl', 'realms', 'wars', 'news', 'history']) { UI.ov = null; UI.tab = 'world'; UI.worldView = v; UI.render(); await scan(`${at} world ${v}`); pages++; }
          UI.worldView = 'map';
          for (const ov of ['profile', 'profs']) { UI.A.ov(ov); UI.render(); await scan(`${at} ${ov}`); pages++; }
          const pc = A.pc(), ids = new Set([pc.father, pc.mother, pc.spouse].filter(Boolean)), realm = A.realm(pc.realm);
          if (realm && realm.ruler) ids.add(realm.ruler);
          for (const q of Object.values(A.S.people).filter(q => q.alive && q.id !== pc.id && q.realm === pc.realm && (q.office || q.job)).slice(0, 5)) ids.add(q.id);
          for (const id of ids) { UI.A.ov('person:' + id); UI.render(); await scan(`${at} person ${id}`); pages++; }
          UI.ov = { type: 'warroom' }; UI.render(); await scan(`${at} warroom`); pages++;
          UI.ov = null; UI.tab = 'life'; UI.render();
        }
      }
      // a duel, four rounds in
      A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); UI.screen = 'game'; UI.ov = null; A.S.queue = []; UI.set.cutins = false; UI.render();
      const pc = A.pc(), foe = A.makeFoe({ realm: pc.realm, tier: 2 }); foe.npcTemp = false; A.S.people[foe.id] = foe; A.S.queue = [];
      A.startDuel(pc, foe, { kind: 'duel', lethal: false, toYield: true }); UI.render(); await tick();
      for (let i = 0; i < 4; i++) { const b = document.querySelector('#modal .actbtns > button'); if (!b) break; b.click(); await tick(); }
      await scan('duel'); pages++;
      // the playtest's own lines, through the same words
      const V = A.V2S, w = t => V.deNum(V.dePct(t));
      const lines = ['This season you got better at Farming & herding +2.3. 100% of it from doing, the rest from practice.',
        'This season you got better at Riding & the lance +4.7, Command +2.6, Tactics & siegecraft +2.3 and 2 more. 80% of it from doing, the rest from practice.',
        'After the battle, the captains reckon it: your counterattack countered their frontal assault +20%, drill, kit and experience −12%.',
        'Solenne sends 881,788 suns to the Horde for its war: the siege, in 1110.', 'Abara owes Zanara 402,000 suns from a loan of 1104, and has paid none of it back.',
        'You take a hit — 7 damage.', 'Your superiors notice the extra hours. (Merit +15)', 'For Senior Captain: merit 379/600, command skill 28/35, months at your present rank 1/16.',
        'In a fight: Crushed knee that never bends right: worth 45 to 43 (speed -7, stamina -3).', 'Captain Godric of Highwold (Cunning, command 56)'].map(w);
      const traits = Object.keys(GD.ORDERS || {}).flatMap(k => A.orderTraits(k));
      for (const l of lines.concat(traits)) if (LINE.test(l) || MORE.some(x => x.test(l)) || /%|\+\d/.test(l)) found.push('line: ' + l.slice(0, 90));
      return { pages, found: [...new Set(found)], lines, traits: traits.filter(t => /faster|Charge/.test(t)).slice(0, 2) };
    });
    const ok = r.pages > 60 && r.found.length === 0 && /\(some\)\. All of it came from doing\.$/.test(r.lines[0]) && /some 900,000 suns/.test(r.lines[3]) && /some 400,000 suns/.test(r.lines[4]) && /— a cut\.$/.test(r.lines[5]);
    return { ok, detail: `${r.pages} pages: ${r.found.length ? r.found.length + ' bare numbers, e.g. ' + r.found.slice(0, 30).join(' | ') : 'no bare 0-100 number by a stat word'}; ${r.lines.slice(0, 4).join(' | ')} | ${r.traits.join(' | ')}` };
  },

  // the odds badge on a check choice is words and a tipped balance
  async v2sBadge(pg) {
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 39, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 30 });
      const ev = Object.values(A.EV).find(e => !e.trigger && (e.choices || []).some(c => c.check) && typeof e.text === 'string' && !/\{/.test(e.text + e.title) && !('_mwOwnSetup' in e ? e._mwOwnSetup : e.setup));
      const q = { type: 'event', ev: ev.id, forced: true, ctx: {} };
      A.S.queue = [q];
      const html = String(UI.eventModal(q) || '');
      const box = document.createElement('div'); box.id = 'v2s-badge-test'; box.innerHTML = html; document.body.appendChild(box);
      await new Promise(res => setTimeout(res, 0));
      const b = [...box.querySelectorAll('button[data-a="evChoose"]')].map(x => x.innerText.replace(/\s+/g, ' ').trim());
      const svg = box.querySelectorAll('button[data-a="evChoose"] .v2-scale').length;
      box.remove(); A.S.queue = [];
      return { id: ev.id, b, svg, digits: /\d+\s?%/.test(html.replace(/<[^>]+>/g, ' ')) };
    });
    const words = /(a certainty|heavily in your favour|in your favour|evenly matched|against you|long odds|hopeless)/;
    const ok = r.svg >= 1 && r.b.some(t => words.test(t)) && !r.b.some(t => /\d\s?%/.test(t)) && !r.digits;
    return { ok, detail: `${r.id}: ${r.b.join(' | ')} (${r.svg} balance icon${r.svg === 1 ? '' : 's'}; digits in the HTML: ${r.digits})` };
  },

  // the levies agree with the release's worth for humans (the fit), a human's worth is unchanged, and the other races
  // carry the v2 difference of their bodies (a giant far above a man), in the duel engine's fighter as in A.fightWorth
  async v2sWorthFit(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 77 });
      const xs = [], ys = [], same = [], shift = {};
      for (const p of Object.values(A.S.people)) {
        if (!p.alive || A.age(p) < 16) continue;
        const old = A.V2S.oldWorth(p), now = A.fightWorth(p);
        if (p.race === 'human') { xs.push(Math.log(A.V2S.v2Levies(p))); ys.push(old); same.push(now === old); }
        else (shift[p.race] = shift[p.race] || []).push(now - old);
      }
      const m = a => a.reduce((x, y) => x + y, 0) / a.length, mx = m(xs), my = m(ys);
      let c = 0, vx = 0, vy = 0; for (let i = 0; i < xs.length; i++) { c += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
      const med = {}; for (const k in shift) { const a = shift[k].sort((x, y) => x - y); med[k] = a[a.length >> 1]; }
      return { n: xs.length, r: c / Math.sqrt(vx * vy), same: same.every(Boolean), med };
    });
    const ok = r.r > 0.75 && r.same && r.med.giant > 25 && r.med.orc > 4 && r.med.dwarf > 0 && r.med.elf <= 1;
    return { ok, detail: `${r.n} humans: r = ${r.r.toFixed(3)} between ln v2 levies and the release's worth; a human's worth unchanged: ${r.same}; median shift by race ${Object.entries(r.med).map(([k, v]) => k + ' ' + (v > 0 ? '+' : '') + v).join(', ')}` };
  },

  // playtest round 1: whole phrases in words, 0-100 scales as bands, no tap target on a choice, v2's levies for a
  // master, a small child not rated, piety for the faithless said as a pull, the odds popover words only
  async v2sPlaytest1(pg) {
    const r = await pg.evaluate(async () => {
      const V = A.V2S, w = t => V.deNum(V.dePct(t));
      const phrases = [w('+30% pay and +30% from your own house of trade'), w('your stats lend 4 + 30% of their average'), w('Each point of skill above it is worth 1.6%.'),
        w('100% of it from doing, the rest from practice.'), w('Health 97 · Happiness 66'), w('Master fighter (95), a steady officer'), w('Blood 76 / Wind 100')];
      T.enter({ seed: 41, startAge: 30 });
      const pc = A.pc();
      for (const k of ['sword', 'melee']) pc.skills[k] = 80;
      A.V2S.cache = new WeakMap();
      const master = V.shownLevies(pc), chip = UI.SCENE && UI.SCENE.chipHtml ? UI.SCENE.chipHtml({ k: 'them', d: 36, label: "Merewyn's regard" }) : '';
      const bar = UI.barRow('Health', 97, 100);
      const e = Object.values(A.EV).find(e => !e.trigger && (e.choices || []).some(c => c.check && !c.check.fight) && typeof e.text === 'string' && !/\{/.test(e.text + e.title) && !('_mwOwnSetup' in e ? e._mwOwnSetup : e.setup));
      A.S.queue = [{ type: 'event', ev: e.id, forced: true, ctx: {} }]; UI.ov = null; UI.render(); await new Promise(res => setTimeout(res, 0));
      const taps = document.querySelectorAll('button[data-a="evChoose"] [data-tt-tap], button[data-a="evChoose"][data-tt-tap]').length;
      const v = A.eventView(A.S.queue[0]), vi = v.choices.findIndex(c => c.odds != null), pop = vi >= 0 ? UI.TIPS.odds(vi) : '';
      A.S.queue = []; UI.render();
      T.enter({ seed: 42, startAge: 1 });
      const baby = V.statWord(A.pc(), 'spd', 6), faithless = !V.hasFaith(A.pc()), piety = V.dePiety('▲▲ much more piety');
      return { phrases, master, chip, bar, taps, pop, popWords: !/\d/.test(pop.replace(/<[^>]+>/g, '')), baby, faithless, piety };
    });
    const p = r.phrases;
    const ok = p[0] === 'about a third more pay and about a third more from your own house of trade' && p[1] === 'your stats lend 4 and about a third of their average' &&
      /worth a little/.test(p[2]) && p[3] === 'all of it from doing.' && p[4] === 'Health hale · Happiness content' && p[5] === 'Master fighter, a steady officer' && p[6] === 'Blood bloodied / Wind fresh' &&
      r.master > 1 && r.master < 40 && /a great deal more/.test(r.chip) && !/\+36/.test(r.chip) && />hale</.test(r.bar) && r.taps === 0 && r.popWords &&
      r.baby === 'too young to tell' && (!r.faithless || r.piety === '▲▲ a strong pull toward the faith');
    return { ok, detail: `${p.join(' | ')}; a sword master ${r.master.toFixed(1)} levies; chip ${r.chip.replace(/<[^>]+>/g, '')}; tap targets on choices ${r.taps}; popover words only ${r.popWords}; a 1-year-old's speed "${r.baby}"; piety for the faithless "${r.piety}"` };
  },

  // playtest 2, new 1 and 2: what a failed check costs, read as the engine will play it. A.punish for treason, a queued
  // gallows and a hurt that would kill this person now are deadly losses: the roll's stakes rise for them (will can
  // carry a lost check), and VS.lossOf says what they are. The reading draws nothing and writes nothing.
  async v2sLossStakes(pg) {
    const r = await pg.evaluate(() => {
      const VS = A.V2S, out = {};
      T.enter({ seed: 9751, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), hp0 = pc.health, rng0 = A.rngState, h0 = T.hash(A.S);
      // (watch: a blow on the night watch as written, 12 health and no wound, so only the health it takes can raise the stakes)
      const plot = A.EV.ct_plot_invite.choices[0], watch = { check: { s: 'melee', d: 40 }, lose: { fx: { health: -12, cause: 'a blow' } } }, ask = { check: { s: 'persuasion', d: 45 }, lose: { fx: { happy: -2 } } };
      out.plot = VS.stakesOf(plot.check, plot, pc);
      out.plotWords = VS.lossWords(VS.lossOf(plot.lose.fx, pc), pc);
      pc.health = 90; out.hale = VS.stakesOf(watch.check, watch, pc);
      pc.health = 5; out.low = VS.stakesOf(watch.check, watch, pc); out.lowWords = VS.lossWords(VS.lossOf(watch.lose.fx, pc), pc);
      pc.health = 90;
      out.ask = VS.stakesOf(ask.check, ask, pc);
      out.gallows = VS.lossWords(VS.lossOf({ event: 'gallows' }, pc), pc);
      out.desert = VS.lawFor(pc, 'desertion').w;
      pc.health = hp0;
      out.pure = A.rngState === rng0 && T.hash(A.S) === h0;
      return out;
    });
    const ok = r.plot === 0.8 && /treason trial: the gallows or a deep cell/.test(r.plotWords.join(', ')) && r.hale === 0.5 && r.low === 0.8 &&
      /could kill you/.test(r.lowWords.join(', ')) && r.ask === 0.5 && r.gallows.includes('the gallows') && /gallows|fingers/.test(r.desert) && r.pure;
    return { ok, detail: `Join the plot: stakes ${r.plot}, "${r.plotWords.join(', ')}"; a blow of 12: stakes ${r.hale} hale, ${r.low} near death, "${r.lowWords.join(', ')}"; a talk that costs spirits ${r.ask}; a queued gallows "${r.gallows.join(', ')}"; desertion in Aldmark "${r.desert}"; no draw ${r.pure}` };
  },

  // playtest 2 (new 8, old 13, old 17): the body by age. A child is measured against others of its age, an infant is not
  // measured at all, an untrained youth lifts what a youth lifts, and no row contradicts the one beside it.
  async v2sPlaytest2Body(pg) {
    const r = await pg.evaluate(() => {
      const V = A.V2S, txt = h => h.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
      const out = { rows: [], bad: [] };
      const BAD = [/grown m[ae]n/, /ordinary man/, /fells any man/, /toddler/, /as fast as a child/];
      for (const [seed, race] of [[32, 'human'], [42, 'orc']]) {
        T.enter({ seed, race, sex: 'M', startAge: 0 });
        const pc = A.pc();
        for (let y = 0; y < 26 && pc.alive; y++) {
          const a = A.age(pc), t = txt(V.sheetHtml(pc)), adult = a >= (GD.RACES[pc.race].grown || 20);
          if ([1, 6, 10, 13, 17, 25].includes(a)) out.rows.push(`${race} ${a}: ${t.slice(0, 150)}`);
          if (a < V.MEASURE_AGE && (!/too young to measure/.test(t) || /lifts|levy/i.test(t))) out.bad.push(`${race} ${a}: measured as a babe: ${t.slice(0, 120)}`);
          if (a < 6 && /A levy:/.test(t)) out.bad.push(`${race} ${a}: the levy legend with no fight row`);
          if (!adult) for (const re of BAD) if (re.test(t)) out.bad.push(`${race} ${a}: "${re.source}" in ${t.slice(0, 200)}`);
          if (a >= 6 && !adult && !/your age/.test(t)) out.bad.push(`${race} ${a}: no comparison with others of the same age`);
          // a lift that names a person ("about a grown man") read as a strength comparison
          if (/lifts \d+ kg about a (grown )?man/.test(t)) out.bad.push(`${race} ${a}: ${t.slice(0, 120)}`);
          // the mind word and its rarity agree
          for (const w of ['Wavering', 'Faint-hearted', 'Quick', 'Dull', 'Slow', 'Determined']) if (new RegExp(w + ' like most').test(t)) out.bad.push(`${race} ${a}: "${w} like most"`);
          if (race === 'human' && (a === 10 || a === 13 || a === 17)) out['kg' + a] = Math.round(V.stats(pc).lift);
          T.play(1);
        }
      }
      // the fight row's words and rank read the same bands
      for (let lv = 0.5; lv < 3.5; lv += 0.05) { const w = V.levyWords(lv), k = V.levyRank(lv); if (/one and a half|about [23] levies/.test(w) && /a levy's worth/.test(k)) out.bad.push(`${w}: ${k}`); }
      return out;
    });
    // an untrained human boy: 10 about 30-60 kg, 13 about 45-100, 17 about 80-170 (playtest 2 saw 92, 144 and 250 kg)
    const kgOk = r.kg10 < 65 && r.kg13 < 105 && r.kg17 < 180 && r.kg10 < r.kg13 && r.kg13 < r.kg17;
    const ok = !r.bad.length && kgOk;
    return { ok, detail: `${r.bad.length} contradictions${r.bad.length ? ' (' + r.bad.slice(0, 5).join(' | ') + ')' : ''}; human lifts ${r.kg10}, ${r.kg13}, ${r.kg17} kg at 10, 13, 17; ${r.rows.join(' || ').slice(0, 1400)}` };
  },

  // playtest 2 (new 14, the stats part): on a 420 px phone the vitals' band words are whole ("middling", "known to the
  // neighbours"), not "middlin", "know / neighb" in the 36 px number column; the label keeps its icon and tooltip
  async v2sPhoneBands(pg, errs, { browser, file }) {
    const { pathToFileURL } = await import('node:url');
    const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 300)));
    let r;
    try {
      await p.goto(pathToFileURL(file).href);
      await p.waitForFunction(() => window.ARDAN_CONTENT_READY === true, null, { timeout: 120000 });
      r = await p.evaluate(async () => {
        A.newGame({ seed: 77, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 }); UI.screen = 'game'; UI.ov = null; A.S.queue = []; UI.set.cutins = false; UI.set.hints = false;
        UI.tab = 'you'; UI.render();
        await new Promise(res => setTimeout(res, 100));
        const rows = [...document.querySelectorAll('.barrow')].filter(x => x.querySelector('.lbl [data-tt="health"],.lbl [data-tt="happy"],.lbl [data-tt="looks"],.lbl [data-tt="fame"],.lbl [data-tt="honor"]') && x.offsetParent);
        return { phone: !!document.querySelector('#game.phone'), rows: rows.map(x => {
          const v = x.querySelector('.val'), rb = x.getBoundingClientRect(), vb = v.getBoundingClientRect();
          return { word: v.textContent.trim(), clipped: v.scrollWidth > v.clientWidth + 1 || vb.right > rb.right + 1, lines: Math.round(vb.height / parseFloat(getComputedStyle(v).lineHeight || 20)) || 1, icon: !!x.querySelector('.lbl .ico-l') };
        }) };
      });
    } finally { await ctx.close(); }
    const ok = r.phone && r.rows.length >= 4 && r.rows.every(x => !x.clipped && !/\d/.test(x.word) && x.icon);
    return { ok, detail: `${r.phone ? 'phone' : 'not the phone layout'}: ${r.rows.map(x => `${x.word}${x.clipped ? ' (cut off)' : ''}${x.icon ? '' : ' (no icon)'}`).join(', ')}` };
  },
  // playtest 2 (old 17) without a new scale: the tier chip says v2's levies alone (the tier name was the release's worth,
  // which ranks people a little differently: "Elite · about one and a half levies"), the short chip the tier alone, and
  // the levies stay on v2's scale (V2_SPEC row 12: an order knight 15-25 levies, and only a Master with breakthroughs
  // stands level with a giant's 20; playtest 1, complaint 8, set orders at 18.8-23.6 a member). A verifier measured a
  // curve on the worth at 19.9 levies for a plain Elite and 30.4 for a Master: kept from coming back.
  async v2sLevyScale(pg) {
    const r = await pg.evaluate(() => {
      const V = A.V2S, txt = h => h.replace(/<[^>]+>/g, '').trim(), tiers = GD.TIERS.map(t => t.n);
      A.newGame({ seed: 4701, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const human = Object.keys(A.S.realms).filter(id => A.makeFoe({ realm: id, tier: 2 }).race === 'human');
      const med = {}, bad = [];
      for (const tier of [2, 4, 5, 6]) {
        const lv = [];
        for (let i = 0; lv.length < 30 && i < 120; i++) {
          const p = A.makeFoe({ realm: human[i % human.length], tier });
          if (p.race !== 'human') continue;
          const s = V.shownLevies(p);
          if (Math.abs(s - V.v2Levies(p)) > 1e-9) bad.push(`shown ${s} is not v2's ${V.v2Levies(p)}`);
          lv.push(s);
        }
        lv.sort((a, b) => a - b); med[tier] = +lv[lv.length >> 1].toFixed(1);
      }
      const chips = [];
      for (const p of Object.values(A.S.people).filter(p => p.alive && p.st && A.age(p) >= 16).slice(0, 40)) {
        const full = UI.tierChip(p), short = UI.tierChip(p, true), t = txt(full), ts = txt(short), lw = V.levyWords(V.shownLevies(p));
        if (t !== lw) bad.push(`chip "${t}" is not "${lw}"`);
        // a count of levies is a real unit; the worth (0-100) is not said, in the text or the label
        const al = h => (h.match(/aria-label="([^"]*)"/) || [])[1] || '';
        if (tiers.some(n => t.includes(n) || al(full).includes(n)) || /worth \d/.test(al(full))) bad.push(`chip "${t}" (${al(full)})`);
        if (!tiers.includes(ts) || /\d|lev/.test(al(short))) bad.push(`short chip "${ts}" (${al(short)})`);
        if (chips.length < 4) chips.push(t);
      }
      return { med, bad, chips };
    });
    // the release's tiers on v2's scale: an Elite a few knights' worth, a Master below an order member, a tier-6 at most
    // about a giant
    const ok = !r.bad.length && r.med[2] < 3 && r.med[4] < 10 && r.med[5] < 16 && r.med[6] < 25 && r.med[2] < r.med[4] && r.med[4] < r.med[5];
    return { ok, detail: `median levies of 30 humans by tier ${JSON.stringify(r.med)}; chips ${JSON.stringify(r.chips)}; ${r.bad.length} problems ${r.bad.slice(0, 4).join(' | ')}` };
  },
};
