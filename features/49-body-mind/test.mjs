// 49-body-mind: health as a body, personality from deeds, each stage its own play, children shown only what they can
// do, and merged skills. Every test reports the numbers it measured.
const NAV = new Set(['tab', 'group', 'ov', 'sub', 'clkSpeed', 'clkPlay', 'clkSkip', 'clkQuiet', 'save', 'wn', 'menu', 'closeOv', 'hintDone', 'theme', 'zoom',
  'wview', 'mapMode', 'codex', 'aiLogOpen', 'chronicleExport', 'warRoomView', 'openSchools', 'book', 'ovClose', 'close']);
export default {
  async bodyWoundsOnParts(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4901, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const pc = A.pc(); pc.skills.craft = 40; pc.skills.sword = 40; pc.skills.athletics = 40;
      const chk = s => A.checkOdds(pc, { s, d: 45 });
      const before = { craft: chk('craft'), sword: chk('sword'), athletics: chk('athletics') };
      A.addWound(pc, 'broken_arm'); A.S.queue = [];
      const arm = { craft: chk('craft'), sword: chk('sword'), athletics: chk('athletics') };
      // care: the surgeon mends it in 45 days, binding it leaves it fresh until it heals at the new year
      const w = pc.wounds.find(x => x.k === 'broken_arm');
      const day = A.absDay();
      A.BM.care(pc, 'surgeon', { wk: 'broken_arm', wi: pc.wounds.indexOf(w) });
      const mendSurgeon = w.mend - day;
      const freshAfter60 = A.BM.fresh(w, day + 60);
      // festering over many wounds: bind against the surgeon
      const fester = how => { let n = 0; for (let i = 0; i < 400; i++) { pc.wounds = [{ k: 'deep_cut', until: A.S.year + 1, part: 'arms' }]; pc.health = 90; const t = A.BM.care(pc, how, { wk: 'deep_cut', wi: 0 }); if (/festers/.test(t)) n++; } return n / 4; };
      const parts = {}; for (const k of ['scar_face', 'lost_hand', 'limp', 'broken_ribs', 'scar_arm']) parts[k] = GD.WOUNDS[k].part;
      const placed = {}; for (let i = 0; i < 40; i++) { pc.wounds = []; A.addWound(pc, 'deep_cut'); placed[pc.wounds[0].part] = (placed[pc.wounds[0].part] || 0) + 1; }
      A.S.queue = [];
      return { before, arm, mendSurgeon, freshAfter60, bind: fester('bind'), surgeon: fester('surgeon'), parts, placed };
    });
    const ok = r.arm.craft <= r.before.craft - 8 && r.arm.sword <= r.before.sword - 8 && r.arm.athletics === r.before.athletics && r.mendSurgeon === 45 && !r.freshAfter60 &&
      r.bind > r.surgeon * 3 && r.parts.lost_hand === 'hands' && r.parts.limp === 'legs' && Object.keys(r.placed).length >= 3;
    return { ok, detail: `odds at d45 with skill 40: craft ${r.before.craft}% → ${r.arm.craft}% and sword ${r.before.sword}% → ${r.arm.sword}% with a broken arm, athletics ${r.before.athletics}% → ${r.arm.athletics}% (not the legs); ` +
      `the surgeon mends it in ${r.mendSurgeon} days; festering: bound ${r.bind}% vs surgeon ${r.surgeon}% (400 wounds each); a deep cut landed on ${JSON.stringify(r.placed)}` };
  },

  async illnessLastsMonths(pg) {
    const r = await pg.evaluate(() => {
      // the same onset (marsh fever, 30 damage, a 30-year-old with medicine 0) under each treatment, 300 times each
      const run = (how, k) => {
        let months = 0, lost = 0, n = 0;
        A.newGame({ seed: 4902, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 30 });
        const pc = A.pc(); pc.skills.medicine = 0;
        for (let i = 0; i < 300; i++) {
          pc.health = 100; pc.ill = null; A.S.queue = [];
          A.bmFallIll(pc, k, GD.DISEASES[k], 30, 100);
          if (how) A.BM.treat(pc, how);
          let m = 0; while (pc.ill && m < 20) { A.bmIllMonth(pc); m++; }
          months += m; lost += 100 - pc.health; n++;
        }
        return { months: Math.round(months / n * 100) / 100, lost: Math.round(lost / n * 10) / 10 };
      };
      const out = {};
      for (const how of ['', 'physician', 'herbs', 'herbs_bad', 'prayer', 'rest']) out[how || 'none'] = run(how, 'marsh');
      out.fluxPhysician = run('physician', 'flux'); out.fluxNone = run('', 'flux');
      // every onset in a life of 4 years asks for a treatment
      A.newGame({ seed: 4903, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 20 });
      let onsets = 0, asked = 0;
      const f = A.bmFallIll;
      A.bmFallIll = function (pc) { const was = !!(pc.ill && pc.ill.m > 0); const q0 = A.S.queue.length; const res = f.apply(this, arguments); if (!was) { onsets++; if (A.S.queue.slice(q0).some(q => q.ev === 'bm_ill')) asked++; } return res; };
      for (let i = 0; i < 40; i++) { const pc = A.pc(); if (!pc.alive) break; pc.health = 100; pc.ill = null; A.bodyYear(pc); A.S.queue = []; }
      A.bmFallIll = f;
      return { out, onsets, asked };
    });
    const o = r.out;
    const ok = o.physician.months <= o.none.months * 0.8 && o.herbs.lost <= o.none.lost * 0.8 && o.herbs_bad.months > o.none.months && o.rest.lost < o.none.lost &&
      o.fluxPhysician.lost <= o.fluxNone.lost * 0.7 && o.none.months >= 3 && r.onsets >= 3 && r.asked === r.onsets;
    return { ok, detail: `marsh fever, 300 onsets each (months / health lost): untreated ${o.none.months}/${o.none.lost}, physician ${o.physician.months}/${o.physician.lost} (he bleeds a fever), ` +
      `herbs ${o.herbs.months}/${o.herbs.lost}, wrong herbs ${o.herbs_bad.months}/${o.herbs_bad.lost}, prayer ${o.prayer.months}/${o.prayer.lost}, bed ${o.rest.months}/${o.rest.lost}; ` +
      `summer flux: physician ${o.fluxPhysician.lost} lost vs ${o.fluxNone.lost} untreated; ${r.asked} of ${r.onsets} onsets in 40 sick years asked for a treatment` };
  },

  async illnessInLives(pg) {
    const r = await pg.evaluate(() => {
      let onsets = 0, treated = 0, deaths = 0, months = 0, lives = 0;
      const tally = {};
      const f = A.bmFallIll; A.bmFallIll = function (pc) { const was = !!(pc.ill && pc.ill.m > 0); const res = f.apply(this, arguments); if (!was && pc.ill) { onsets++; months += pc.ill.m; } return res; };
      const tr = A.BM.treat; A.BM.treat = function (pc, how) { const res = tr.apply(this, arguments); if (pc.ill && pc.ill.t) { treated++; tally[pc.ill.t] = (tally[pc.ill.t] || 0) + 1; } return res; };
      for (const seed of [4911, 4912, 4913, 4914, 4915, 4916]) {
        const L = B.life({ seed, race: 'human', realm: 'POL-01', status: ['peasant', 'artisan', 'serf'][seed % 3], sex: seed % 2 ? 'F' : 'M', startAge: 16 }, ['careful', 'random', 'greedy'][seed % 3], seed % 2 === 0, 50);
        lives++; const pc = A.P(A.S.pc); if (pc && !pc.alive && GD.DISEASES && Object.values(GD.DISEASES).some(d => d.name === pc.cause)) deaths++;
      }
      A.bmFallIll = f; A.BM.treat = tr;
      return { onsets, treated, deaths, lives, avgMonths: onsets ? Math.round(months / onsets * 10) / 10 : 0, tally };
    }).catch(e => ({ err: String(e) }));
    if (r.err) return { ok: false, detail: r.err };
    return { ok: r.onsets >= 6 && r.treated >= r.onsets * 0.8 && r.avgMonths >= 2, detail: `${r.lives} bot lives: ${r.onsets} illnesses, ${r.avgMonths} months on average, ${r.treated} treated (${JSON.stringify(r.tally)}), ${r.deaths} lives ended by one` };
  },

  async agingStatByStat(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4904, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const people = Object.values(A.S.people).filter(p => p.race === 'human' && p.st).slice(0, 300);
      const first = {}, spread = [];
      let sumNew = 0, sumOld = 0, n = 0;
      const old = (p, s, age) => { const R2 = GD.RACES[p.race]; const o = A.BM.oldOf(p); if (s === 'wil') return 1; if (s === 'int') return age > o * 1.15 ? Math.max(0.6, 1 - (age - o * 1.15) / (R2.maxLife * 0.6)) : 1; if (age < o * 0.85) return 1; const k = { str: 1, spd: 1.2, sta: 1, ins: 0.5 }[s]; return Math.max(0.35, 1 - k * (age - o * 0.85) / (R2.maxLife - o * 0.85) * 0.8); };
      for (const p of people) {
        const st = ['str', 'spd', 'sta', 'ins'].map(s => [s, A.BM.fadeStart(p, s)]).sort((a, b) => a[1] - b[1]);
        first[st[0][0]] = (first[st[0][0]] || 0) + 1; spread.push(st[3][1] - st[0][1]);
        for (const s of ['str', 'spd', 'sta', 'ins', 'int']) for (const age of [50, 60, 70]) { sumNew += A.BM.factorAt(p, s, age); sumOld += old(p, s, age); n++; }
      }
      // one life: each stat turns in its own year, and the log says so
      A.newGame({ seed: 4905, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'F', startAge: 36 });
      const pc = A.pc(); pc.health = 100;
      const turns = {};
      for (let y = 0; y < 30 && pc.alive; y++) { A.S.year++; for (let m = 0; m < 12; m++) A.onMonth.forEach(f => { try { f(pc); } catch (e) {} }); pc.health = 100; }
      const log = JSON.stringify(A.S.log.slice(-40));
      for (const s in (pc.bmFade || {})) turns[s] = pc.bmFade[s] - pc.born;
      const care = A.BM.factorAt(Object.assign({}, pc, { bmCare: 4 }), 'spd', 70) - A.BM.factorAt(Object.assign({}, pc, { bmCare: 0 }), 'spd', 70);
      return { first, medianSpread: spread.sort((a, b) => a - b)[Math.floor(spread.length / 2)], meanNew: sumNew / n, meanOld: sumOld / n, turns, logged: /Speed has begun to go/.test(log), care };
    });
    const ages = Object.values(r.turns);
    const ok = Object.keys(r.first).length >= 3 && r.medianSpread >= 4 && Math.abs(r.meanNew - r.meanOld) < 0.02 && new Set(ages).size >= 3 && r.logged && r.care > 0.05;
    return { ok, detail: `first stat to fade across 300 people: ${JSON.stringify(r.first)}; median gap between a person's first and last fading body stat ${Math.round(r.medianSpread * 10) / 10} years; ` +
      `mean age factor at 50/60/70 ${r.meanNew.toFixed(3)} vs the release's ${r.meanOld.toFixed(3)}; one woman's stats turned at ${JSON.stringify(r.turns)}; four years of care at 70 leave speed ${Math.round(r.care * 100)} points of 100 higher` };
  },

  async deedsMakeTraits(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4906, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const pc = A.pc(); pc.traits = ['shy']; pc.deedLog = {}; pc.traitWhy = {};
      const BM = A.BM, steps = [];
      // an event's own trait mark is a strong deed (2), but alone it does not make the trait
      BM.cur = { title: 'The poacher', label: 'Hang him. The law is the law', seen: new Set() };
      A.applyFx(pc, { trait: 'cruel', honor: -2 }, {}); steps.push(pc.traits.includes('cruel'));
      BM.cur = { title: 'After the ford', label: 'Kill them. You cannot feed them', seen: new Set() };
      A.applyFx(pc, { trait: 'cruel' }, {}); steps.push(pc.traits.includes('cruel'));
      BM.cur = null;
      const why = BM.reasonOf(pc, 'cruel'), log = JSON.stringify(A.S.log.slice(-2));
      // the opposite's deeds take it away: three kind deeds against four cruel ones is not enough, seven is
      for (let i = 0; i < 3; i++) BM.deed(pc, 'kind', 1, `kind ${i}`); const still = pc.traits.includes('cruel');
      for (let i = 0; i < 4; i++) BM.deed(pc, 'kind', 1, `kind ${i + 3}`);
      const turned = pc.traits.includes('kind') && !pc.traits.includes('cruel');
      // the cap: deeds for eight traits leave five
      for (const t of ['brave', 'honest', 'zealous', 'greedy', 'patient', 'curious', 'proud']) for (let i = 0; i < 3; i++) BM.deed(pc, t, 1, `${t} deed`);
      const capped = pc.traits.filter(t => GD.TRAITS[t]).length;
      // the words of a choice count, through a real event
      A.newGame({ seed: 4907, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 30 });
      const p2 = A.pc(); p2.deedLog = {};
      A.defEvents([{ id: 'bm_test_words', trigger: true, title: 'A test', text: 'A test.', choices: [{ t: 'Spare the boy', r: 'You do.', fx: { happy: 1 } }, { t: 'Walk on', r: 'You do.', fx: { happy: 1 } }] }]);
      A.S.queue = [{ type: 'event', ev: 'bm_test_words', ctx: {} }]; A.eventView(A.S.queue[0]); A.eventChoose(0); A.eventClose();
      return { steps, why, log, still, turned, capped, traits: pc.traits, words: p2.deedLog.kind && p2.deedLog.kind[0] };
    });
    const ok = !r.steps[0] && r.steps[1] && /Hang him/.test(r.why) && /Kill them/.test(r.why) && /You have become cruel/.test(r.log) && r.still && r.turned && r.capped === 5 && r.words && /Spare the boy/.test(r.words[2]);
    return { ok, detail: `one marked choice: cruel ${r.steps[0]}; two: ${r.steps[1]}, shown as "${r.why.slice(0, 120)}"; three kind deeds against four cruel: still cruel ${r.still}, seven: turned kind ${r.turned}; ` +
      `deeds for 9 traits leave ${r.capped} (${r.traits.join(', ')}); a label "Spare the boy" counts as ${JSON.stringify(r.words)}` };
  },

  async traitsInLives(pg) {
    const r = await pg.evaluate(() => {
      const lives = [];
      for (const seed of [4921, 4922, 4923, 4924, 4925, 4926, 4927, 4928]) {
        const st = ['peasant', 'noble', 'artisan', 'merchant'][seed % 4];
        let silent = 0, changes = 0, maxT = 0;
        const L = B.life({ seed, race: 'human', realm: 'POL-01', status: st, sex: seed % 2 ? 'F' : 'M', startAge: 16 }, ['careful', 'reckless', 'greedy', 'random'][seed % 4], seed % 2 === 0, 45);
        const pc = A.P(A.S.pc);
        changes = (pc.traitLog || []).length;
        // every trait the player holds has a reason: from deeds, or from birth
        for (const t of pc.traits) if (GD.TRAITS[t] && !/from what you did|deeds bear it out|as long as anyone/.test(A.BM.reasonOf(pc, t))) silent++;
        maxT = Math.max(maxT, pc.traits.filter(t => GD.TRAITS[t]).length);
        lives.push({ seed, years: L.years, changes, silent, maxT, withReceipts: (pc.traitLog || []).filter(x => x[3] && x[3].length).length });
      }
      return lives;
    });
    const ch = r.map(l => l.changes).sort((a, b) => a - b), med = ch[Math.floor(ch.length / 2)];
    const ok = r.every(l => l.maxT <= 5 && l.silent === 0 && l.withReceipts === l.changes) && med >= 1 && med <= 6;
    return { ok, detail: `8 bot lives: trait changes per life ${ch.join(', ')} (median ${med}); most traits held ${Math.max(...r.map(l => l.maxT))}; changes logged with their deeds ${r.reduce((a, l) => a + l.withReceipts, 0)} of ${r.reduce((a, l) => a + l.changes, 0)}; traits without a reason ${r.reduce((a, l) => a + l.silent, 0)}` };
  },

  async stagesHaveTheirOwnPlay(pg) {
    const r = await pg.evaluate(() => {
      const seen = {};
      for (const [age, st] of [[8, 'child'], [15, 'youth'], [19, 'youth'], [35, 'prime'], [62, 'old']]) {
        T.enter({ seed: 4930 + age, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: age });
        A.S.time = 6; UI.tab = 'life'; UI.render();
        const btns = [...document.querySelectorAll('#app [data-a="act"]')].map(b => b.getAttribute('data-v')).filter(k => GD.ACTIVITIES[k] && GD.ACTIVITIES[k].stage);
        seen[age] = { stage: A.BM.stageOf(A.pc()), acts: btns, header: /Only now/.test(document.getElementById('app').textContent) };
      }
      // what they do, in numbers
      const out = {};
      A.newGame({ seed: 4940, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 14 });
      let pc = A.pc(); const k0 = pc.skills.craft || 0;
      for (let i = 0; i < 6; i++) { A.S.time = 5; A.S.yearActs = {}; A.doActivity('bm_apprentice'); }
      const m = A.P(pc.bmMaster.id);
      out.apprentice = { skill: Math.round(((pc.skills[pc.bmMaster.k] || 0) - (pc.bmMaster.k === 'craft' ? k0 : 0)) * 10) / 10, k: pc.bmMaster.k, apt: pc.apt[pc.bmMaster.k], master: m && A.fullName(m), journeyman: !!pc.flags.bm_journeyman };
      A.newGame({ seed: 4941, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'F', startAge: 40 });
      pc = A.pc(); pc.coin = 1000; A.S.time = 5; A.doActivity('bm_putby'); const stored = pc.bmStore, coinAfter = pc.coin;
      while (A.BM.stageOf(pc) !== 'old') A.S.year++;
      A.onMonth.forEach(f => { try { f(pc); } catch (e) {} });
      out.putby = { stored, back: pc.coin - coinAfter };
      A.newGame({ seed: 4942, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 64 });
      pc = A.pc(); pc.skills.craft = 30; pc.literate = true;
      let passed = null;
      for (let i = 0; i < 12 && !passed; i++) { A.S.time = 5; A.S.yearActs = {}; const res = A.doActivity('bm_teach'); if (/better at/.test(res.msg || '')) passed = i + 1; }
      const P = A.P(pc.bmPupil.id);
      out.teach = { k: pc.bmPupil.k, pupil: P && Math.round(P.skills[pc.bmPupil.k]), mine: A.skill(pc, pc.bmPupil.k), passedAfter: passed };
      for (let i = 0; i < 3; i++) { A.S.time = 5; A.S.yearActs = {}; A.doActivity('bm_memoir'); }
      out.memoir = { chapters: pc.bmMemoir.ch, book: (pc.works || []).some(w => /memoirs/.test(w.t)) };
      pc.coin = 500; const f0 = A.BM.factorAt(pc, 'spd', 75);
      for (let i = 0; i < 6; i++) { A.S.time = 5; A.S.yearActs = {}; A.doActivity('bm_tend'); }
      out.tend = { care: pc.bmCare, spdAt75: Math.round(f0 * 100) + '→' + Math.round(A.BM.factorAt(pc, 'spd', 75) * 100) };
      A.newGame({ seed: 4943, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 9 });
      pc = A.pc(); pc.deedLog = {};
      for (let i = 0; i < 4; i++) { A.S.time = 5; A.S.yearActs = {}; A.doActivity('bm_mischief'); A.doActivity('bm_tales'); A.doActivity('bm_tagalong'); }
      out.child = { deeds: Object.fromEntries(Object.entries(pc.deedLog).map(([k, v]) => [k, v.length])), trade: pc.bmTrade, husbandry: Math.round(pc.skills.husbandry * 10) / 10 };
      return { seen, out };
    });
    const S = r.seen, own = a => S[a].acts.every(k => GD_STAGE[k] === S[a].stage);
    const GD_STAGE = { bm_mischief: 'child', bm_tales: 'child', bm_tagalong: 'child', bm_apprentice: 'youth', bm_bloods: 'youth', bm_hire: 'youth', bm_double: 'prime', bm_moot: 'prime', bm_putby: 'prime', bm_teach: 'old', bm_memoir: 'old', bm_tend: 'old' };
    const o = r.out;
    const ok = [8, 15, 19, 35, 62].every(a => S[a].acts.length === 3 && own(a) && S[a].header) && o.apprentice.journeyman && o.apprentice.apt >= 1.2 && o.putby.back === Math.round(o.putby.stored * 1.5) &&
      o.teach.passedAfter && o.memoir.book && o.tend.care > 2 && Object.keys(o.child.deeds).length >= 2;
    return { ok, detail: `actions shown: ${[8, 15, 19, 35, 62].map(a => `${a} (${S[a].stage}) ${S[a].acts.join('/')}`).join('; ')}. Six seasons under ${o.apprentice.master}: +${o.apprentice.skill} ${o.apprentice.k}, a journeyman with talent ×${o.apprentice.apt}; ` +
      `${o.putby.stored} suns put by at 40 came back as ${o.putby.back} at old age; a pupil passed a craftsman of ${o.teach.mine} after ${o.teach.passedAfter} lessons; ${o.memoir.chapters} chapters made a book ${o.memoir.book}; ` +
      `six seasons of care: speed at 75 ${o.tend.spdAt75}% of its best; a child's four years of play left deeds ${JSON.stringify(o.child.deeds)} and husbandry ${o.child.husbandry}` };
  },

  async childrenSeeOnlyWhatTheyCan(pg) {
    const r = await pg.evaluate(([NAV]) => {
      NAV = new Set(NAV);
      const toasts = []; const t0 = UI.toast; UI.toast = m => toasts.push(String(m));
      const out = {}; let refusals = 0, buttons = 0;
      for (const [status, age] of [['noble', 8], ['royal', 10], ['gentry', 6], ['peasant', 9], ['merchant', 12], ['serf', 11], ['artisan', 14]]) {
        T.enter({ seed: 4950 + age, race: 'human', realm: 'POL-01', status, sex: age % 2 ? 'F' : 'M', startAge: age });
        A.S.time = 6;
        const snap = A.serialize(), bad = [];
        for (const t of T.tabs()) {
          A.deserialize(snap); UI.tab = t; UI.ov = null; UI.render();
          const btns = [...document.querySelectorAll('#app [data-a]')].filter(b => !b.disabled && !NAV.has(b.getAttribute('data-a'))).map(b => [b.getAttribute('data-a'), b.getAttribute('data-v')]);
          for (const [a, v] of btns) {
            buttons++;
            A.deserialize(snap); UI.tab = t; UI.render(); toasts.length = 0;
            try { UI.A[a] && UI.A[a](v); } catch (e) {}
            if (toasts.some(m => /too young|grown-ups|young for/i.test(m))) { refusals++; bad.push(`${t}:${a}=${v}`); }
          }
        }
        // and what a child is offered on the plan card and the court
        A.deserialize(snap); UI.tab = 'life'; UI.render();
        const html = document.getElementById('app').innerHTML;
        out[status + age] = { bad, brutal: /data-v="brutal"/.test(html), tooYoungAims: (html.match(/Too young\./g) || []).length };
      }
      UI.toast = t0;
      return { out, refusals, buttons };
    }, [[...NAV]]);
    const ok = r.refusals === 0 && Object.values(r.out).every(x => !x.brutal && x.tooYoungAims === 0);
    return { ok, detail: `7 children (noble 8, royal 10, gentry 6, peasant 9, merchant 12, serf 11, artisan 14): ${r.buttons} enabled buttons pressed, ${r.refusals} refused for age` +
      `${r.refusals ? ': ' + JSON.stringify(Object.fromEntries(Object.entries(r.out).filter(([, x]) => x.bad.length).map(([k, x]) => [k, x.bad]))) : ''}; brutal training offered ${Object.values(r.out).filter(x => x.brutal).length}, "Too young" pursuits listed ${Object.values(r.out).reduce((a, x) => a + x.tooYoungAims, 0)}` };
  },

  async mergedSkills(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4960, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
      const pc = A.pc(); pc.skills.bow = 10; pc.skills.xbow = 0;
      const g = A.trainSkill(pc, 'xbow', 3);
      const read = [A.skill(pc, 'xbow'), A.skill(pc, 'bow')];
      // an old save: points in a merged skill fold into the family's
      const S = JSON.parse(A.serialize()); S.people[S.pc].skills.lance = 44; S.people[S.pc].skills.riding = 12; delete S.people[S.pc].ill;
      A.deserialize(JSON.stringify(S));
      const p2 = A.pc(), fold = [p2.skills.riding, A.skill(p2, 'lance')];
      // an NPC keeps its own numbers
      const npc = Object.values(A.S.people).find(p => p.id !== A.S.pc && p.skills); npc.skills.dagger = 33; npc.skills.sword = 5;
      const npcRead = [A.skill(npc, 'dagger'), A.skill(npc, 'sword')];
      UI.ov = null; T.enter({ seed: 4961, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 25 });
      const p3 = A.pc(); p3.skills.dagger = 20; p3.skills.sword = 20; p3.skills.xbow = 15; p3.skills.bow = 15;
      const block = UI.profBlock(p3), shows = { dagger: block.includes('>' + GD.SKILLS.dagger + ' ') || block.includes(GD.SKILLS.dagger + '</span>'), blades: block.includes('Blades') };
      const picker = (A.trainTargets(p3) || []).map(x => x.k);
      return { g, read, fold, npcRead, shows, pickerHasAlias: picker.some(k => A.BM.MERGE[k]), merged: Object.keys(A.BM.MERGE).length };
    });
    const ok = r.g > 0 && r.read[0] === r.read[1] && r.read[1] > 10 && r.fold[0] === 44 && r.fold[1] === 44 && r.npcRead[0] === 33 && r.npcRead[1] === 5 && !r.shows.dagger && r.shows.blades && !r.pickerHasAlias;
    return { ok, detail: `${r.merged} skills merged; training crossbow raised bow to ${r.read[1]} (crossbow reads ${r.read[0]}); an old save's lance 44 over riding 12 folds to riding ${r.fold[0]}; an NPC's dagger stays ${r.npcRead[0]} beside sword ${r.npcRead[1]}; ` +
      `the sheet shows Blades ${r.shows.blades} and no dagger row ${!r.shows.dagger}; merged skills in the training picker ${r.pickerHasAlias}` };
  },

  async bodyMindRenderPure(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 4970, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 40 });
      const pc = A.pc();
      A.addWound(pc, 'broken_leg'); A.addWound(pc, 'lost_eye'); A.S.queue = [];
      A.bmFallIll(pc, 'camp', GD.DISEASES.camp, 25, 100); A.S.queue = [];
      pc.traits = ['cruel', 'shy']; pc.deedLog = { cruel: [[A.S.year, 2, '“Hang him” (The poacher, 1105)']], brave: [[A.S.year, 1, '“Fight back” (A brawl, 1105)']] }; pc.traitWhy = { cruel: { y: A.S.year, by: 'deeds', r: ['“Hang him” (The poacher, 1105)'] } };
      pc.bmPeak = { str: [40, 27] };
      const rng0 = JSON.stringify(A.S.rng), h0 = T.hash(A.S), r0 = A.rngState;
      UI.tab = 'life'; UI.render();
      const side = document.getElementById('app').innerHTML;
      UI.ov = { type: 'profile' }; UI.render();
      const prof = document.body.innerHTML;
      const tip = UI.TIPS.stat('spd');
      UI.ov = null; UI.render();
      return { pure: JSON.stringify(A.S.rng) === rng0 && T.hash(A.S) === h0 && A.rngState === r0,
        side: { body: /Broken leg/.test(side) && /Ill with camp fever/.test(side), chip: /Hang him/.test(side) },
        prof: { body: /Lost an eye/.test(prof) && /bow −15|Bows &amp; throwing −15|throwing −15/.test(prof), who: /Who you are/.test(prof) && /Leaning brave/.test(prof), aging: /Age, stat by stat/.test(prof) },
        tip: /Holds until about|Fading since/.test(tip) };
    });
    const ok = r.pure && r.side.body && r.side.chip && r.prof.body && r.prof.who && r.prof.aging && r.tip;
    return { ok, detail: `render pure ${r.pure}; side profile shows the body ${r.side.body} and a trait's reason ${r.side.chip}; full profile: body with costs ${r.prof.body}, who you are ${r.prof.who}, aging ${r.prof.aging}; stat tooltip has the curve ${r.tip}` };
  },

  async bodyMindOldSave(pg) {
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 4980, race: 'human', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 30 });
      const S = JSON.parse(A.serialize()), p = S.people[S.pc];
      for (const k of ['ill', 'bmPeak', 'bmFade', 'deedLog', 'traitWhy', 'traitLog', 'bmMaster', 'bmStore', 'bmMemoir', 'bmCare', 'bmPupil', 'bmTrade']) delete p[k];
      p.wounds = [{ k: 'deep_cut', until: S.year + 1 }, { k: 'limp', until: 0 }];
      A.deserialize(JSON.stringify(S)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
      let err = null; try { UI.render(); UI.ov = { type: 'profile' }; UI.render(); UI.ov = null; T.play(2); UI.render(); } catch (e) { err = String(e); }
      return { err, alive: A.pc().alive, year: A.S.year };
    });
    return { ok: !r.err, detail: `a save without the new fields and with unplaced wounds loads, draws and plays two years: ${r.err || 'no error'} (alive ${r.alive}, ${r.year})` };
  },
};
