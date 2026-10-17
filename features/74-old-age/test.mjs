// Tests for features/74-old-age: the scorecard's count, every scene played in old lives of every kind (no raw token,
// no text over 80 words, every choice resolves), the scenes firing in old age, the chains and marks, the deathbed,
// the death screen, render purity, old saves, and the un-retired events of 58-event-cut.
const SETUP = () => {
  window.OAT = {
    RX: /(^|[^!])C\.old\(|(^|[^!])stage\(p\)\s*===?\s*["']old|C\.age\(p\)\s*>=?\s*(5[5-9]|[6-9]\d)/,
    isOld: e => !!(e && e.cond && OAT.RX.test(e.cond.toString())),
    ids: () => Object.keys(A.EV).filter(id => /^oa_/.test(id)),
    // a person of the world, linked to pc
    person(pc, type, born, sex, back) {
      let t = A.makeAcquaintance(pc, type);
      for (let i = 0; sex && t.sex !== sex && i < 30; i++) t = A.makeAcquaintance(pc, type);   // names follow sex: draw again
      t.born = born;
      A.link(pc, t, type, 40, back || type);
      return t;
    },
    // an old life with a history: a life played from 26, then aged 32 years, its memories made old with it
    base(o, years) {
      A.newGame(Object.assign({ seed: 7400, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 26 }, o));
      T.play(years == null ? 12 : years);
      const pc = A.pc(); if (!pc.alive) return null;
      const R = GD.RACES[pc.race], shift = Math.max(0, R.old + 20 - A.age(pc));
      pc.born -= shift;
      for (const id in pc.rel) { const t = A.P(id); if (t && t.alive && t.id !== pc.id && !['child', 'grandchild'].includes(pc.rel[id].type)) t.born -= shift; }
      for (const l of (pc.mw && pc.mw.m) || []) l.y -= 25;
      for (const d of pc.deeds || []) d.y -= 25;
      for (const id in pc.rel) for (const e of pc.rel[id].hist || []) e.y -= 25;
      A.S.queue = [];
      return pc;
    },
    family(pc) {
      const y = A.S.year, other = pc.sex === 'M' ? 'F' : 'M';
      const sp = OAT.person(pc, 'spouse', pc.born + 2, other); pc.spouse = sp.id; sp.spouse = pc.id;
      const kids = [0, 1, 2].map(i => { const k = OAT.person(pc, 'child', y - 42 + i * 4, null, 'parent'); k.parents = [pc.id, sp.id]; pc.children.push(k.id); sp.children = (sp.children || []).concat(k.id); return k; });
      kids[0].rel[pc.id].op = 60; kids[2].rel[pc.id].op = 5;
      for (const [k, age] of [[0, 2], [0, 9], [1, 15], [1, 21], [2, 13]]) { const g = A.makeAcquaintance(pc, 'grandchild'); g.born = y - age; g.parents = [kids[k].id]; kids[k].children = (kids[k].children || []).concat(g.id); A.link(pc, g, 'grandchild', 40, 'grandparent'); }
      const gg = A.makeAcquaintance(pc, 'acquaint'); gg.born = y; const g20 = A.P(kids[1].children[1]); g20.children = (g20.children || []).concat(gg.id);
      return pc;
    },
    // the people an old life has lost and kept: a friend dead this year, an old friend and an old enemy still living, the young
    circle(pc) {
      const y = A.S.year, b = pc.born;
      const f = OAT.person(pc, 'friend', b + 1); A.kill(f, 'old age');
      const s = OAT.person(pc, 'sibling', b - 2); A.kill(s, 'a winter cough');
      OAT.person(pc, 'bestfriend', b + 2); OAT.person(pc, 'friend', b + 3); OAT.person(pc, 'enemy', b - 1); OAT.person(pc, 'rival', b + 4);
      const foe = OAT.person(pc, 'rival', b - 3); A.kill(foe, 'a fall');
      OAT.person(pc, 'acquaint', y - 24); OAT.person(pc, 'acquaint', y - 20, pc.sex === 'M' ? 'F' : 'M');
      OAT.person(pc, 'acquaint', b + 5, pc.sex === 'M' ? 'F' : 'M');
      const m = OAT.person(pc, 'mentor', b - 20); A.kill(m, 'old age');
      // memories of every kind, from long ago
      const MW = A.MW && A.MW.state(pc);
      if (MW) for (const [k, d] of [['wrong', 'you took the money and said nothing'], ['shame', 'you ran from the fight'], ['kill', 'you struck him down by the ford'], ['hurt', 'you fell from the barn roof'], ['kind', 'you carried the widow\'s grain'], ['loss', 'you lost the cargo to the storm'], ['gain', 'you won the purse at the fair']])
        MW.m.push({ y: y - 30, e: 'oat_' + k, c: 0, ok: -1, sh: '', k: [k], d, t: 'An old matter' });
      pc.deeds = (pc.deeds || []).concat([{ y: y - 30, t: 'Held the bridge against the raiders' }, { y: y - 20, t: 'Champion of the harvest games' }]);
      // a heavy line on two living bonds, one good and one bad
      const L = A.relsOf(pc, ['enemy']).find(x => x.p.alive), F = A.relsOf(pc, ['friend']).find(x => x.p.alive);
      if (L) (L.r.hist = L.r.hist || []).push({ y: y - 20, t: 'You burned his barn', v: -30, w: -20, h: 12, d: 'you burned his barn' });
      if (F) (F.r.hist = F.r.hist || []).push({ y: y - 20, t: 'You paid her debt', v: 25, w: 18, h: 12, d: 'you paid her debt' });
      return pc;
    },
    FLAGS: ['ao_kestrel', 'la_hold_bought', 'la_cmd_held', 'la_house_charter', 'la_shr_hosp', 'ao_bridge_name', 'bm_memoir', 'bm_surpassed', 'ak_feud_open', 'la_book_true'],
    flags(pc) { for (const f of OAT.FLAGS) pc.flags[f] = A.S.year - 20; return pc; },
    pupil(pc) { const t = OAT.person(pc, 'student', A.S.year - 22); pc.bmPupil = { id: t.id, k: 'craft', n: 6, passed: A.S.year - 1 }; return pc; },
    // the fixtures: each a saved state of an old life of some kind
    fixtures(only) {
      const out = {}, want = k => !only || only.includes(k);
      const save = (k, pc) => { if (pc && pc.alive) out[k] = A.serialize(); };
      let pc = want('family') && OAT.base({ seed: 7401 }); if (pc) { OAT.circle(pc); OAT.flags(pc); OAT.pupil(pc); OAT.family(pc); pc.job = pc.job || { c: 'smith', r: 2, rep: 10, own: true }; pc.job.own = true; pc.coin = 90; const ru = A.P(A.realm(pc.realm).ruler); if (ru) ru.born = A.S.year - 15; pc.gear.weapon = 'sword'; pc.gear.mount = 'horse'; pc.literate = true; pc.piety = 50; pc.bmCare = 1; save('family', pc); }
      pc = want('alone') && OAT.base({ seed: 7402, status: 'serf', realm: 'POL-07', sex: 'F' }); if (pc) { OAT.circle(pc); pc.flags.unfree = A.S.year - 60; pc.literate = false; pc.coin = 20; const d = OAT.person(pc, 'spouse', pc.born); A.kill(d, 'a fever'); pc.widowed = A.S.year - 4; pc.spouse = null; save('alone', pc); }
      pc = want('noble') && OAT.base({ seed: 7403, status: 'noble' }); if (pc) { OAT.circle(pc); OAT.family(pc); pc.office = pc.office || 'steward'; const r = A.realm(pc.realm); const ru = A.P(r.ruler); if (ru) ru.born = A.S.year - 15; pc.coin = Math.max(pc.coin, 2000); pc.health = 60; const f = A.family(pc); if (f) f.headPid = pc.id; save('noble', pc); }
      pc = want('ruler') && OAT.base({ seed: 7404, status: 'royal', realm: 'POL-02' }); if (pc) { OAT.circle(pc); const r = A.realm(pc.realm); if (A.makeRuler && r) { A.makeRuler(pc, r.id); const h = OAT.person(pc, 'child', A.S.year - 6, null, 'parent'); h.parents = [pc.id]; pc.children.push(h.id); r.heir = h.id; } save('ruler', pc); }
      for (const [k, race, realm] of [['elf', 'elf', 'POL-03'], ['dwarf', 'dwarf', 'POL-20'], ['orc', 'orc', 'POL-11']]) { pc = want(k) && OAT.base({ seed: 7405, race, realm }, 4); if (pc) { OAT.circle(pc); save(k, pc); } }
      pc = want('merchant') && OAT.base({ seed: 7406, status: 'merchant', realm: 'POL-05' }); if (pc) { OAT.circle(pc); pc.job = { c: 'merchant', r: 3, rep: 20 }; pc.coin = Math.max(pc.coin, 900); save('merchant', pc); }
      pc = want('priest') && OAT.base({ seed: 7407, sex: 'F' }); if (pc) { OAT.circle(pc); pc.job = { c: 'clergy', r: 2, rep: 10 }; pc.literate = true; pc.piety = 45; save('priest', pc); }
      return out;
    },
    // every oa_ event under every fixture: cond, view, every choice from the same saved state
    playAll(fx, ids) {
      const RAW = /\{[A-Za-z0-9_.]+\}/, w = s => (String(s || '').match(/\S+/g) || []).length;
      const res = { eligible: {}, shown: {}, problems: [], declined: {}, views: 0 };
      const ce = console.error; let cur = '';
      console.error = (...a) => { res.problems.push(`${cur}: engine error: ${a.map(x => String(x && x.message || x)).join(' ').slice(0, 160)}`); };
      try {
        for (const [k, base] of Object.entries(fx)) {
          for (const id of ids) {
            const e = A.EV[id]; A.deserialize(JSON.parse(base));
            let ok = false; try { ok = !e.cond || !!e.cond(A.pc(), A.C); } catch (err) { res.problems.push(`${id}@${k}: cond throws ${err.message}`); continue; }
            if (!ok) continue;
            res.eligible[id] = (res.eligible[id] || 0) + 1;
            for (let i = 0; i < (e.choices || []).length; i++) {
              A.deserialize(JSON.parse(base)); A.S.queue = [];
              const q = { type: 'event', ev: id }; A.S.queue.unshift(q);
              cur = `${id}@${k} choice ${i + 1}`;
              let v; try { v = A.eventView(q); } catch (err) { res.problems.push(`${id}@${k}: view throws ${err.message}`); break; }
              if (v.skip) { if (i === 0) { if (q.ctx && q.ctx.skip) res.declined[id] = (res.declined[id] || 0) + 1; else res.problems.push(`${id}@${k}: dropped: ${([v.title, v.text].join(' ').match(RAW) || ['?'])[0]}`); } break; }
              if (i === 0) {
                res.views++; res.shown[id] = (res.shown[id] || 0) + 1;
                const all = [v.title, v.text, ...v.choices.map(c => c.t)].join(' | ');
                if (RAW.test(all)) res.problems.push(`${id}@${k}: raw token ${all.match(RAW)[0]}`);
                if (w(v.text) > 80) res.problems.push(`${id}@${k}: text ${w(v.text)} words`);
                for (const c of v.choices) if (w(c.t) > 12) res.problems.push(`${id}@${k}: label ${w(c.t)} words`);
              }
              const idx = v.choices.findIndex(c => c.i === i); if (idx < 0) continue;
              try { A.eventChoose(idx); const r = A.S.queue[0] && A.S.queue[0].result; const rt = r ? String(r.text || r.r || '') : ''; if (RAW.test(rt)) res.problems.push(`${id}@${k} choice ${i + 1}: raw token in result ${rt.match(RAW)[0]}`); A.eventClose(); }
              catch (err) { res.problems.push(`${id}@${k} choice ${i + 1}: throws ${err.message}`); }
            }
          }
        }
      } finally { console.error = ce; }
      res.problems = [...new Set(res.problems)];
      return res;
    },
  };
};

export default {
  async oaScorecardCount(pg) {
    // the scorecard's own count (bench/run.mjs, events module): events whose cond requires old age, retired ones left out
    const r = await pg.evaluate(() => {
      const RX = /(^|[^!])C\.old\(|(^|[^!])stage\(p\)\s*===?\s*["']old|C\.age\(p\)\s*>=?\s*(5[5-9]|[6-9]\d)/;
      const E = Object.values(A.EV).filter(e => !(A.EV_RETIRED && A.EV_RETIRED.has(e.id)));
      const old = E.filter(e => RX.test(e.cond ? e.cond.toString() : ''));
      const mine = Object.keys(A.EV).filter(id => /^oa_/.test(id));
      return { old: old.length, mine: mine.length, mineOld: old.filter(e => /^oa_/.test(e.id)).length, cut: !!A.EV_RETIRED };
    });
    const ok = r.old >= 150 && r.mineOld === r.mine && r.mine >= 100;
    return { ok, detail: `${r.old} old-age events counted by the scorecard (target 150; cut ${r.cut ? 'on' : 'absent'}); ${r.mineOld} of this feature's ${r.mine} scenes among them` };
  },

  async oaPlayEverything(pg) {
    // every scene, under nine old lives (a family, a widowed serf, a noble, a ruler with a child heir, an elf, a dwarf, an
    // orc, a merchant), every choice taken from the same state: no error, no raw token, no text over 80 words
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fx = OAT.fixtures(), ids = OAT.ids();
      const res = OAT.playAll(fx, ids);
      const never = ids.filter(id => !res.shown[id] && !A.EV[id].trigger);
      return { fixtures: Object.keys(fx), n: ids.filter(id => !A.EV[id].trigger).length, shown: Object.keys(res.shown).filter(id => !A.EV[id].trigger).length, views: res.views, never, problems: res.problems.slice(0, 8), nProblems: res.problems.length };
    });
    // scenes only ever queued (a chain's later step, the deathbed) are played in oaChains; of the rest, 95% must be drawn here
    const ok = r.fixtures.length >= 7 && r.nProblems === 0 && r.shown >= Math.ceil(r.n * 0.95);
    return { ok, detail: `${r.fixtures.length} old lives (${r.fixtures.join(', ')}); ${r.shown} of ${r.n} scenes drawn (${r.views} drawings, every choice taken)${r.never.length ? '; not drawn: ' + r.never.join(', ') : ''}${r.nProblems ? `; ${r.nProblems} problems: ${r.problems.join(' / ')}` : ''}` };
  },
  async oaChains(pg) {
    // the marks other scenes read: the retirement contract and the will come back years later with the same person,
    // the corrody and the late love have their sequels, the blade goes to the heir, and the death screen names it all
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fx = OAT.fixtures(['family', 'alone']), out = { steps: [], problems: [] }, RAW = /\{[A-Za-z0-9_.]+\}/;
      const take = (id, i) => { A.S.queue = []; const q = { type: 'event', ev: id }; A.S.queue.unshift(q); const v = A.eventView(q); if (v.skip) return null; A.eventChoose(v.choices.findIndex(c => c.i === i)); A.eventClose(); return q; };
      const later = ev => { const x = (A.S.sched || []).find(s => s.item && s.item.ev === ev); return x || null; };
      const fire = (ev) => { const x = later(ev); if (!x) return null; A.S.sched = A.S.sched.filter(s => s !== x); A.S.queue = []; if (!A.stillValid(x.item)) return 'invalid'; A.S.queue.push(x.item); const v = A.eventView(x.item); if (RAW.test(v.text) || v.skip) out.problems.push(ev + ': ' + (v.skip ? 'dropped' : v.text.match(RAW)[0])); return v; };
      // the contract, sworn before the court, with the heir
      A.deserialize(JSON.parse(fx.family));
      const q1 = take('oa_kin_contract', 0), pid = q1 && q1.ctx.pid, x1 = later('oa_kin_contract_after');
      const yrs = x1 ? Math.round((x1.at - A.absDay()) / 365) : null;
      const v1 = fire('oa_kin_contract_after');
      out.steps.push(['contract', !!x1 && x1.item.ctx.pid === pid, yrs, v1 && v1.text && v1.text.includes(A.P(pid).given), v1 && v1.choices.length]);
      // the will, then someone who has seen it
      A.deserialize(JSON.parse(fx.family));
      take('oa_hand_will', 2); const v2 = fire('oa_hand_will_after');
      out.steps.push(['will', !!(A.pc().oa && A.pc().oa.will && A.pc().oa.will.k === 'church'), !!A.pc().flags.oa_will, !!(v2 && v2.text && /altar/.test(v2.text))]);
      const epi = A.epilogue(A.pc()).join(' ');
      out.steps.push(['epilogue-will', /altar/.test(epi)]);
      // the corrody, then life on the abbey
      A.deserialize(JSON.parse(fx.family)); A.pc().coin = 500;
      take('oa_kin_corrody', 0); const v3 = fire('oa_kin_corrody_life');
      out.steps.push(['corrody', A.pc().coin < 500, !!(v3 && v3.text && /abbey/.test(v3.text))]);
      // a late love, then the family's council
      A.deserialize(JSON.parse(fx.alone));
      let q4 = null; for (let i = 0; i < 6 && !(q4 && q4.result && q4.result.success); i++) { A.deserialize(JSON.parse(fx.alone)); A.pc().skills.persuasion = 90; A.pc().stats && (A.pc().stats.ins = 90); q4 = take('oa_late_love', 0); }
      const v4 = A.pc().flags.oa_late_love != null ? fire('oa_late_love_family') : null;
      out.steps.push(['late-love', A.pc().flags.oa_late_love != null, !!(v4 && v4.text && v4.text.includes(q4.ctx.oa))]);
      // the blade to the heir
      A.deserialize(JSON.parse(fx.family));
      const pc = A.pc(), heir = A.OA.heir(pc), w0 = pc.gear.weapon;
      take('oa_hand_sword', 0);
      out.steps.push(['sword', w0 !== 'fists' && pc.gear.weapon === 'fists' && heir.gear && heir.gear.weapon === w0, /carries your/.test(A.epilogue(pc).join(' '))]);
      return out;
    });
    const s = Object.fromEntries(r.steps.map(x => [x[0], x.slice(1)]));
    const ok = s.contract[0] && s.contract[1] >= 2 && s.contract[1] <= 5 && s.contract[2] && s.will.every(Boolean) && s['epilogue-will'][0] && s.corrody.every(Boolean) && s['late-love'].every(Boolean) && s.sword.every(Boolean) && !r.problems.length;
    return { ok, detail: r.steps.map(x => `${x[0]}: ${x.slice(1).join('/')}`).join('; ') + (r.problems.length ? '; ' + r.problems.join('; ') : '') };
  },

  async oaDeathbed(pg) {
    // when the engine's own death odds pass 12% a year, the family is sent for (once in 8 years); the last words are on
    // the death screen
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fx = OAT.fixtures(['family']);
      A.deserialize(JSON.parse(fx.family));
      const pc = A.pc(), hooks = () => { for (const f of A.onYear) try { f(pc); } catch (e) {} };
      pc.born = A.S.year - 66; pc.health = 90; A.S.sched = [];
      const odds66 = A.deathChance(pc); hooks();
      const at66 = (A.S.sched || []).filter(x => x.item.ev === 'oa_deathbed').length;
      pc.born = A.S.year - 72; const odds72 = A.deathChance(pc); hooks(); hooks();
      const at72 = (A.S.sched || []).filter(x => x.item.ev === 'oa_deathbed').length;
      const x = A.S.sched.find(s => s.item.ev === 'oa_deathbed'), valid = A.stillValid(x.item);
      A.S.queue = [x.item]; const v = A.eventView(x.item);
      A.eventChoose(v.choices.findIndex(c => c.i === 0)); A.eventClose();
      const epi = A.epilogue(pc).join(' ');
      return { odds66: Math.round(odds66 * 1000) / 10, odds72: Math.round(odds72 * 1000) / 10, at66, at72, valid, text: v.text.slice(0, 90), kind: pc.flags.oa_words_kind != null, epi: /last words were kind/.test(epi) };
    });
    const ok = r.at66 === 0 && r.at72 === 1 && r.valid && r.kind && r.epi;
    return { ok, detail: `death odds at 66: ${r.odds66}% (no deathbed), at 72: ${r.odds72}% (${r.at72} deathbed scheduled after two year-turns); "${r.text}…"; kind last words on the death screen ${r.epi}` };
  },

  async oaFireRate(pg) {
    // old age has its own play: lives aged to 55 and played on (passive, the engine's own choices) meet old-age scenes
    // at a steady rate, with variety, despite 25-variety-guard and the 58-event-cut roll
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const RX = OAT.RX, lives = [];
      for (const [seed, status, realm, sex] of [[7411, 'peasant', 'POL-01', 'M'], [7412, 'artisan', 'POL-05', 'F'], [7413, 'noble', 'POL-01', 'F'], [7414, 'serf', 'POL-07', 'M'], [7415, 'merchant', 'POL-14', 'M'], [7416, 'peasant', 'POL-25', 'F']]) {
        A.newGame({ seed, race: 'human', realm, status, sex, startAge: 26 });
        T.play(4);
        const pc = A.pc(); if (!pc.alive) continue;
        pc.born = A.S.year - 55; pc.health = Math.max(pc.health, 80);
        const L = { years: 0, ev: 0, old: 0, ids: {} }, y0 = A.S.year;
        T.play(22, { onEvent: v => {} , each: () => {} });
        // T.play answers with A.eventAuto; count what the player was shown, from the seen-events record
        const p = A.pc();
        for (const [id, y] of Object.entries(p.flags.ev || {})) if (y >= y0) { L.ev++; if (RX.test(A.EV[id] && A.EV[id].cond ? A.EV[id].cond.toString() : '')) { L.old++; L.ids[id] = 1; } }
        L.years = (p.alive ? A.S.year : p.died) - y0;
        lives.push(L);
      }
      const years = lives.reduce((a, l) => a + l.years, 0), old = lives.reduce((a, l) => a + l.old, 0), ev = lives.reduce((a, l) => a + l.ev, 0);
      const distinct = new Set(lives.flatMap(l => Object.keys(l.ids))).size;
      return { lives: lives.length, years, old, ev, distinct, perDecade: Math.round(100 * old / Math.max(1, years)) / 10, per: lives.map(l => `${l.years}y:${l.old}`) };
    });
    // distinct events per decade from flags.ev (the last sighting of each), a floor under the true rate
    const ok = r.years >= 50 && r.perDecade >= 5 && r.distinct >= 20;
    return { ok, detail: `${r.lives} lives, ${r.years} years from 55: ${r.old} distinct old-age scenes met (${r.perDecade} a decade, of ${r.ev} distinct events), ${r.distinct} different ones; per life ${r.per.join(', ')}` };
  },

  async oaRenderPure(pg) {
    // drawing an old-age scene, every tab, and the death screen's epilogue moves neither the random stream nor the state
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fx = OAT.fixtures(['family']);
      A.deserialize(JSON.parse(fx.family)); UI.screen = 'game'; UI.tab = 'life'; UI.ov = null;
      const pc = A.pc(); pc.flags.oa_will = A.S.year; pc.oa = { m: {}, will: { k: 'split', y: A.S.year } }; pc.flags.oa_grave = A.S.year;
      const q = { type: 'event', ev: 'oa_gen_funeral' }; A.S.queue = [q];
      const v0 = A.eventView(q);
      T.renderAll();
      const before = A.rngState, h0 = T.hash(A.S);
      UI.render(); T.renderAll(); A.eventView(q); const e1 = A.epilogue(pc); const e2 = A.epilogue(pc); UI.render();
      return { shown: !v0.skip && /bury/.test(v0.text), rng: A.rngState === before, same: T.hash(A.S) === h0, epi: e1.join('|') === e2.join('|') && e1.some(l => /equal parts/.test(l)) };
    });
    const ok = r.shown && r.rng && r.same && r.epi;
    return { ok, detail: `scene on screen ${r.shown}; random stream untouched ${r.rng}; state untouched ${r.same}; epilogue stable and names the will ${r.epi}` };
  },

  async oaOldSave(pg) {
    // a save from before this feature (no pc.oa, no oa_ flags) loads, plays on, and the first mark makes the field
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const fx = OAT.fixtures(['family']);
      A.deserialize(JSON.parse(fx.family));
      const pc = A.pc(); delete pc.oa; for (const k of Object.keys(pc.flags)) if (/^oa_/.test(k)) delete pc.flags[k];
      const s = A.serialize(); A.deserialize(JSON.parse(s));
      const epi0 = A.epilogue(A.pc()).length;
      const res = T.play(2);
      A.S.queue = []; const q = { type: 'event', ev: 'oa_hand_will' }; A.S.queue.unshift(q); const v = A.eventView(q);
      if (!v.skip) { A.eventChoose(v.choices.findIndex(c => c.i === 1)); A.eventClose(); }
      return { epi0, res, made: !!(A.pc().oa && A.pc().oa.will), skip: !!v.skip };
    });
    const ok = r.epi0 > 0 && r.made && !r.skip;
    return { ok, detail: `old save: death screen draws (${r.epi0} lines), two years played (${r.res}), the will makes pc.oa ${r.made}` };
  },

  async oaUnretired(pg) {
    // the old-age events 58-event-cut had retired that are real choices are back in the roll; the rest stay retired
    const r = await pg.evaluate(() => {
      const BACK = ['bd_failing_eyes', 'bd_old_dignity', 'ct_ruler_health', 'ct_old_ruler', 'ww_sol_grave', 'ww_os_will', 'lf_health_chest', 'lf_old_last_wish', 'lf_old_grandchild_secret', 'lf_old_dwarf_vault'];
      const STAY = ['fm_old_together', 'rk_vt_grandchildren', 'ww_ald_hartgate', 'lf_old_stories', 'lf_old_elf_fade', 'lf_old_burial_wish'];
      const RX = /(^|[^!])C\.old\(/;
      return { cut: !!A.EV_RETIRED, n: A.EV_RETIRED ? A.EV_RETIRED.size : 0, back: BACK.filter(id => A.EV[id] && !A.EV_RETIRED.has(id) && !A.EV[id].trigger && RX.test(A.EV[id].cond.toString())).length, stay: STAY.filter(id => A.EV_RETIRED.has(id)).length };
    });
    const ok = r.cut && r.back === 10 && r.stay === 6 && r.n >= 800;
    return { ok, detail: `${r.back} of 10 un-retired old-age events back in the roll; ${r.stay} of 6 weak ones still retired; ${r.n} retired in all` };
  },
};
