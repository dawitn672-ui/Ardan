// 99999-v2-content: regression tests for playtest 1's content findings (#9, #10, #11, #18, #19, the War Room numbers),
// and playtest 2's cards that lied about risk (new 1 and 2, old 18 and 19's remainders: v2cRisk*, v2cChipsDirection,
// v2cEveryChoiceTrue).
const SETUP = () => {
  window.V2CT = {
    // play a life, card by card, as the UI draws each one; fn(q, v, html) sees every card before it is chosen
    life(o, years, fn) {
      T.enter(Object.assign({ race: 'human', realm: 'POL-01', sex: 'M' }, o));
      const end = A.S.year + years;
      for (let g = 0; g < 5000 && A.S.year < end; g++) {
        const r = A.advance(30);
        let h, k = 0;
        while ((h = A.headReady()) && k++ < 300) {
          if (h.type === 'event') { const v = A.eventView(h); fn(h, v, UI.queueModal(h) || ''); A.eventAuto(); } else A.skipPrompt();
        }
        if (r.why === 'dead' || !A.pc() || !A.pc().alive) break;
      }
    },
    strip: h => String(h).replace(/<span class="sc-vh">[^<]*<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    // a scene staged at the head of the queue, as the card draws it: its choice rows in text
    rows(ev, ctx) {
      const q = { type: 'event', ev, ctx: ctx || {} };
      A.S.queue.unshift(q);
      const v = A.eventView(q), h = v.skip ? '' : UI.queueModal(q) || '';
      A.S.queue.shift();
      // ("If it fails : ..." in text: the chip's label and its words are separate spans)
      return { q, v, rows: [...h.matchAll(/<button data-a="evChoose"[^>]*>([\s\S]*?)<\/button>/g)].map(m => V2CT.strip(m[1]).replace(/ : /g, ': ')) };
    },
  };
};
const prep = pg => pg.evaluate(SETUP);

export default {
  // #9: the memory insert is rare (under 1 card in 8 over a played life), never from infancy, and reads as a past deed
  async v2cMemoryRare(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const MW = A.MW, out = { cards: 0, woven: 0, young: [], present: [], eg: [] };
      for (const [status, seed, age, years] of [['peasant', 9101, 0, 26], ['noble', 9102, 8, 20]]) {
        V2CT.life({ seed, status, startAge: age }, years, (q, v) => {
          out.cards++;
          const w = q.ctx && q.ctx.mw;
          if (!w || w.off || w.ev !== q.ev || !String(v.text).includes(String(w.y))) return;
          out.woven++;
          const pc = A.pc();
          if (w.y - pc.born < MW.MIN_AGE) out.young.push(q.ev + ': ' + w.long);
          const deed = w.ref ? (MW.lines(pc).find(m => m.y === w.ref[0] && m.e === w.ref[1] && m.c === w.ref[2]) || {}).d : null;
          // the deed is judged, not 67's own frame around it ("... and you have not forgotten how" is the frame's)
          if (/while you are/.test(w.long) || (deed && (!MW.pastDeed(deed) || /\byou (are|pay|sign|have)\b|\bshe says\b|\bit is\b/.test(deed)))) out.present.push(w.long);
          if (out.eg.length < 3) out.eg.push(w.long);
        });
      }
      // the complaint's own lines: an infant's milestone and a present-tense label are never cited
      out.walk = MW.pastDeed('you tried to walk, and failed');
      out.spy = MW.pastDeed('you tried to spy while you are there');
      out.pay = MW.pastDeed('you studied the map before you pay');
      out.ok = MW.pastDeed('you pulled him out of the millrace');
      return out;
    });
    const rate = r.woven / Math.max(1, r.cards);
    const ok = r.cards >= 150 && rate < 1 / 8 && !r.young.length && !r.present.length && !r.spy && !r.pay && r.ok;
    return { ok, detail: `${r.woven} memories in ${r.cards} cards (${(rate * 100).toFixed(1)}%, under 12.5%); from before ${7}: ${r.young.length}; not a past deed: ${r.present.length} ${r.present[0] || ''}; "while you are there" cited: ${r.spy}; e.g. ${r.eg.join(' / ')}` };
  },

  // #10: an inner voice or counsel only where it fits the scene, at most one such line a card
  async v2cExtraLinesFit(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const C2 = A.V2C, ID = A.ID, ADV = A.ADV, out = { cards: 0, voice: 0, adv: 0, two: [], offVoice: [], offAdv: [], child: [] };
      for (const [status, seed, age, years] of [['peasant', 9201, 6, 22], ['noble', 9202, 14, 18]]) {
        V2CT.life({ seed, status, startAge: age }, years, (q, v, html) => {
          out.cards++;
          const e = A.EV[q.ev], pc = A.pc();
          const vo = /idv-voice/.test(html), adv = !!(v.adv && v.adv.length);
          const advLines = adv ? v.adv.length : 0;
          const woven = !!(q.ctx && q.ctx.mw && !q.ctx.mw.off && q.ctx.mw.ev === q.ev);
          if (vo) out.voice++; if (adv) out.adv++;
          if ((vo ? 1 : 0) + advLines + (woven ? 1 : 0) + (/wc-recall/.test(html) ? 1 : 0) > 1) out.two.push(q.ev);
          if (vo) {
            const line = (/<span class="idv-line">([^<]*)</.exec(html) || [])[1] || '';
            const checks = (e.choices || []).some(c => c && c.check);
            if (!checks || A.age(pc) < 14) out.offVoice.push(q.ev + ': ' + line);
          }
          if (adv && (!C2.bigScene(e) || A.age(pc) < 15)) out.offAdv.push(q.ev);
        });
      }
      // the playtest's own cards
      const pc = A.pc();
      out.roof = C2.lineFits('Mend the roof before the baby comes, not after.', 'First arrows. The butts are set up behind the church. Draw and loose.');
      out.law = C2.lineFits('He quotes the law badly. The clause he wants is the next one.', 'The bully. A bigger girl takes your bread every day.');
      out.fever = C2.lineFits('Pale gums, sour breath. That is not grief, that is fever.', 'Fever. You burn for three days.');
      out.jug = ADV.isBig(A.EV.pf_dec_jug, { type: 'event', ev: 'pf_dec_jug', ctx: {} }, pc);
      out.arrows = ADV.isBig(A.EV.pf_bow_butts, { type: 'event', ev: 'pf_bow_butts', ctx: {} }, pc);
      return out;
    });
    const ok = r.cards >= 150 && !r.two.length && !r.offVoice.length && !r.offAdv.length && !r.roof && !r.law && r.fever && !r.jug && !r.arrows && r.voice + r.adv < r.cards / 4;
    return { ok, detail: `${r.cards} cards: a voice on ${r.voice}, counsel on ${r.adv}; two extra lines on one card ${r.two.length} ${r.two[0] || ''}; voice off its scene ${r.offVoice.length} ${r.offVoice[0] || ''}; counsel on a small choice ${r.offAdv.length} ${r.offAdv[0] || ''}; ` +
      `"Mend the roof" fits First arrows ${r.roof}; "quotes the law" fits a bully ${r.law}; "fever" fits a fever ${r.fever}; the broken jug is big ${r.jug}, first arrows ${r.arrows}` };
  },

  // #11: scenes that need a shop, a rank, letters or years reach only lives that have them; no Latin in Ardan
  async v2cClassGates(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      T.enter({ seed: 9301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 13 });
      const pc = A.pc();
      pc.job = { c: 'smith', r: 0, perf: 50, y: A.S.year };
      // the duty pool of a 13-year-old apprentice smith, drawn many times
      const seen = new Set();
      for (let i = 0; i < 300; i++) { A.S.evRecent = {}; const n0 = A.S.queue.length; A.dutyEvent(pc); const q = A.S.queue[A.S.queue.length - 1]; if (A.S.queue.length > n0 && q && q.ev) seen.add(q.ev); A.S.queue.length = n0; }
      out.apprenticeSees = [...seen].filter(id => ['lfx_du_gd_apprentice', 'du_gd_undercut', 'du_gd_commission', 'du_gd_election'].includes(id));
      // a scene of any pool whose words take a shop of your own (the new `shop` class): not for him, yes for a master
      if (!A.EV.v2ct_shop) A.defEvents([{ id: 'v2ct_shop', title: 'A slow week', cond: () => false, w: 0, text: 'Your customers have gone to the fair, and your apprentice sleeps on the bench.', choices: [{ t: 'Wake him', r: 'He wakes.' }, { t: 'Let him sleep', r: 'He sleeps.' }] }]);
      out.shopFit = A.evFit(A.EV.v2ct_shop, pc);
      pc.job.r = 2;
      out.masterFit = A.evFit(A.EV.v2ct_shop, pc);
      out.masterOk = out.masterFit > 0 && A.EV.lfx_du_gd_apprentice.minR <= pc.job.r && A.EV.du_gd_undercut.minR <= pc.job.r;
      // study scenes at 8
      pc.born = A.S.year - 8; pc.literate = true;
      out.at8 = Object.keys(A.EV).filter(id => /^(lfx_st_|fl_st_)/.test(id)).filter(id => { const e = A.EV[id]; try { return !e.cond || e.cond(pc, A.C); } catch (err) { return false; } })
        .filter(id => /disputation|cathedral|examination|College|inn\b|alehouse/i.test(String(A.EV[id].text)));
      // a penniless 14-year-old is not offered a round for the tavern
      pc.born = A.S.year - 14; pc.coin = 0;
      const lucky = A.EV.bd_lucky_escape.choices.find(c => /whole tavern/.test(c.t));
      out.roundOffered = !!lucky.req(pc, A.C);
      const q = { type: 'event', ev: 'bd_lucky_escape', ctx: {} };
      A.S.queue.unshift(q); const v = A.eventView(q); const html = UI.queueModal(q) || ''; A.S.queue.shift();
      out.roundShown = /whole tavern/.test(V2CT.strip(html)) && !v.skip;
      // Latin, anywhere in a scene
      out.latin = Object.keys(A.EV).filter(id => { const e = A.EV[id]; let s = ''; try { s = JSON.stringify(e, (k, x) => (typeof x === 'function' ? String(x) : x)); } catch (err) {} return /\bLatin\b/.test(s); });
      return out;
    });
    const ok = !r.apprenticeSees.length && r.shopFit === 0 && r.masterOk && !r.at8.length && !r.roundOffered && !r.roundShown && !r.latin.length;
    return { ok, detail: `a 13-year-old apprentice draws ${JSON.stringify(r.apprenticeSees)}; the apprentice scene fits him ${r.shopFit}; a master may have them ${r.masterOk}; study scenes for a child of 8 ${JSON.stringify(r.at8)}; a round offered at 14 with 0 suns ${r.roundOffered} (on the card ${r.roundShown}); Latin in ${JSON.stringify(r.latin)}` };
  },

  // CI run 88: the shop class hid scenes from the lives they were written for. A clerk is not a shop (a general's,
  // a ruler's, a reeve's); words shown only under the scene's own test are the writer's gate; "open your own shop" is
  // a shop to come; a scene that follows a flag follows a scene that put the life there (the dwarf partner's
  // workshop, the smith's apprentice, the royal bowyer's workshop). A plain "your customers" still needs a shop.
  async v2cShopGateReadsRight(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9311, race: 'dwarf', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 40 });
      const pc = A.pc(); pc.job = null;
      const mk = (id, text, cond) => { if (!A.EV[id]) A.defEvents([{ id, title: 'A test', cond: cond || (() => false), w: 0, text, choices: [{ t: 'One', r: 'One.' }, { t: 'Two', r: 'Two.' }] }]); return A.EV[id]; };
      const fake = {
        clerk: mk('v2ct_shop_clerk', 'Your clerk waits with the pen.'),
        cond: mk('v2ct_shop_if', p => `Smoke pours from the eaves${A.age(p) > 200 ? ' of your own workshop' : ''}.`),
        open: mk('v2ct_shop_open', 'Pay the fee, and you may open your own shop.'),
        flag: mk('v2ct_shop_flag', 'Your apprentice asks to learn the fold.', (p, C) => C.flag(p, 'v2ct_fold')),
        plain: mk('v2ct_shop', 'Your customers have gone to the fair, and your apprentice sleeps on the bench.'),
      };
      const real = ['mpe_dw_partner_clause', 'mpf_dwarf_apprentice', 'mat_royal_bow_order', 'mat_altar_donor', 'rk_gen_successors', 'pl_authority_push', 'po_graft', 'la_heirhouse_2', 'wk_craft_fire', 'pf_craft_masterpiece'].filter(id => A.EV[id]);
      const read = e => ({ gate: A.V2C.shopScene(e), txt: !!A.evAudience(e).txt.shop, fit: A.evFit(e, pc) });
      const out = { fake: {}, real: {} };
      for (const k in fake) out.fake[k] = read(fake[k]);
      for (const id of real) out.real[id] = read(A.EV[id]);
      return out;
    });
    const wrong = [];
    for (const k of ['clerk', 'cond', 'open', 'flag']) if (r.fake[k].gate || r.fake[k].txt || !(r.fake[k].fit > 0)) wrong.push(k);
    for (const id in r.real) if (r.real[id].gate || r.real[id].txt) wrong.push(id);
    const plain = r.fake.plain.gate && r.fake.plain.txt && r.fake.plain.fit === 0;
    const ok = !wrong.length && plain;
    return { ok, detail: `read as needing a shop, wrongly: ${JSON.stringify(wrong)} (of 4 made scenes and ${Object.keys(r.real).length} real ones); "your customers" still needs one: ${plain}` };
  },

  // playtest 2, old #11 and #15: a boy ran from "a betrothal to a man twice your age"; an orc crossbowman of rank 2 was
  // told at a tournament "Your horse is groomed and your lance is new"; a soldier's captain sat in the ring as "your
  // master" and said "Your name in the trade is your fortune."
  async v2cPlaytest2Class(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      // the runaway's reason, for a boy and for a girl
      const why = sex => {
        T.enter({ seed: sex === 'M' ? 9321 : 9322, race: 'human', realm: 'POL-01', status: 'peasant', sex, startAge: 14 });
        const pc = A.pc(), seen = new Set();
        for (let i = 0; i < 60; i++) { const ctx = {}; A.EV.lf_teen_runaway.setup(pc, ctx); seen.add(ctx.why); }
        return [...seen];
      };
      out.boy = why('M'); out.girl = why('F');
      // the tournament's opening line, for a soldier of rank 3 with no lance, and for a knight
      T.enter({ seed: 9323, race: 'orc', realm: 'POL-01', status: 'artisan', sex: 'M', startAge: 25 });
      const pc = A.pc();
      pc.mil = { rank: 3, realm: pc.realm };
      A.S.gath = (A.S.gath || []).concat([{ id: 'v2ct_g', kind: 'tournament', host: pc.realm, pc: { role: 'knight' } }]);
      const open = () => String(A.EV.ga_open.text(pc, { gid: 'v2ct_g', who: 'x' }));
      if (pc.skills) { pc.skills.lance = 0; }
      out.soldier = open();
      pc.job = { c: 'knight', r: 1, y: A.S.year, perf: 50 };
      out.knight = open();
      pc.job = null;
      // a soldier's officer in the ring: a captain, not a master; a craftsman's master stays a master
      const off = A.makeAcquaintance(pc, 'acquaint'); off.mil = { rank: 5, realm: pc.realm };
      A.link(pc, off, 'superior', 40, 'superior');
      out.officerRole = (A.ADV.candidates(pc).find(c => c.id === off.id) || {}).role || null;
      pc.mil = null; pc.job = { c: 'smith', r: 1, y: A.S.year, perf: 50 }; delete pc.rel[off.id];   // 9999 seats one master, the warmest
      const m = A.makeAcquaintance(pc, 'acquaint'); A.link(pc, m, 'master', 40, 'master');
      out.masterRole = (A.ADV.candidates(pc).find(c => c.id === m.id) || {}).role || null;
      return out;
    });
    const boyOk = r.boy.length > 1 && !r.boy.some(x => /a man twice/.test(x)), girlOk = r.girl.some(x => /a man twice/.test(x));
    const ok = boyOk && girlOk && !/lance|horse is groomed/.test(r.soldier) && /lance/.test(r.knight) && r.officerRole === 'captain' && r.masterRole === 'master';
    return { ok, detail: `a boy runs from ${JSON.stringify(r.boy.filter(x => /betrothal/.test(x)))}, a girl from a man twice her age ${girlOk}; a soldier at the tournament: "${r.soldier.slice(-110)}"; a knight hears of his lance ${/lance/.test(r.knight)}; a soldier's officer sits as ${r.officerRole}, a smith's master as ${r.masterRole}` };
  },

  // #18: who the person is stands on the card, not behind "Read more"; the creation screen's story blurbs are whole
  async v2cWhoOnCard(pg) {
    await prep(pg);
    await pg.setViewportSize({ width: 420, height: 900 });
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9401, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc(), t = A.makeAcquaintance(pc, 'acquaint');
      A.link(pc, t, 'friend', 40, 'friend');
      const out = { cards: [] };
      for (const ev of ['ni_gift', 'ni_confide', 'ni_invite']) {
        if (!A.EV[ev]) continue;
        const q = { type: 'event', ev, ctx: { pid: t.id, npcMove: true, nk: 'gift', niWhy: `Why ${t.given}: thinks well of you (66); your friend.` } };
        A.S.queue.unshift(q); const v = A.eventView(q); const h = v.skip ? '' : UI.queueModal(q) || ''; A.S.queue.shift();
        if (!h) continue;
        out.cards.push({ ev, hidden: /<summary>Read more<\/summary><div class="mtext">Why /.test(h), shown: (/<div class="ev-who[^"]*">([^<]*)</.exec(h) || [])[1] || '' });
      }
      // the creation screen at phone width: a story's blurb is not clamped
      UI.screen = 'title'; UI.render();
      const b = [...document.querySelectorAll('button')].find(x => /Begin a new life/.test(x.textContent)); if (b) b.click();
      const el = document.querySelector('.crq-story .small');
      out.blurb = el ? { clamp: getComputedStyle(el).webkitLineClamp, full: el.scrollHeight <= el.clientHeight + 2, text: el.textContent } : null;
      UI.screen = 'game'; UI.render();
      return out;
    });
    const ok = r.cards.length >= 2 && r.cards.every(c => !c.hidden && /your friend/.test(c.shown) && !/\d/.test(c.shown)) && r.blurb && r.blurb.full && r.blurb.clamp !== '2';
    return { ok, detail: `${r.cards.map(c => `${c.ev}: behind Read more ${c.hidden}, on the card "${c.shown}"`).join('; ')}; story blurb clamp ${r.blurb && r.blurb.clamp}, whole ${r.blurb && r.blurb.full}` };
  },

  // #19: over 200 scenes every live choice shows an effect or a consequence, and no scene is shown with one live choice
  async v2cEveryChoiceShows(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const C2 = A.V2C, out = { scenes: 0, choices: 0, bare: [], lone: [], vague: [] };
      const look = (q, v, html) => {
        const e = A.EV[q.ev];
        if (!e || v.skip) return;
        out.scenes++;
        const live = v.choices.filter(x => x.i >= 0);
        // a lone live choice is allowed when it does something (an arc's opening beside choices out of reach, a finale's
        // one ending for this path); a lone way out that changes nothing is what #19 forbids
        if ((e.choices || []).length >= 2 && (live.length === 0 || (live.length === 1 && C2.isWayOut(e.choices[live[0].i])))) out.lone.push(q.ev);
        for (const m of html.matchAll(/<button data-a="evChoose" data-v="\d+"[^>]*>([\s\S]*?)<\/button>/g)) {
          out.choices++;
          if (!/st-row/.test(m[1])) out.bare.push(q.ev + ': ' + V2CT.strip(m[1]).slice(0, 60));
          const s = V2CT.strip(m[1]);
          if (/• (their regard|standing)\b|\btheir regard\b/.test(s) && q.ctx && q.ctx.pid) out.vague.push(q.ev + ': ' + s.slice(0, 80));
        }
      };
      V2CT.life({ seed: 9501, status: 'peasant', startAge: 8 }, 20, look);
      V2CT.life({ seed: 9502, status: 'noble', startAge: 16 }, 18, look);
      // staged: the drill's fresh levy and the song, and the old scholar for a man with no coin (two live choices)
      T.enter({ seed: 9503, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const pc = A.pc(); pc.coin = 0;
      const stage = ev => { const q = { type: 'event', ev, ctx: {} }; A.S.queue.unshift(q); const v = A.eventView(q); const h = v.skip ? '' : UI.queueModal(q) || ''; A.S.queue.shift(); return { v, h }; };
      const lev = stage('dr_new_levy'), song = stage('dr_song'), sch = stage('fl_st_master');
      out.levy = [...lev.h.matchAll(/<button data-a="evChoose"[^>]*>([\s\S]*?)<\/button>/g)].map(m => V2CT.strip(m[1]));
      out.song = [...song.h.matchAll(/<button data-a="evChoose"[^>]*>([\s\S]*?)<\/button>/g)].map(m => V2CT.strip(m[1]))[0] || '';
      out.scholarLive = sch.v.skip ? 0 : sch.v.choices.filter(x => x.i >= 0).length;
      // any scene left with one live choice is dropped
      if (!A.EV.v2ct_lone) A.defEvents([{ id: 'v2ct_lone', title: 'A door', cond: () => false, w: 0, text: 'A door stands shut.', choices: [{ t: 'Pay the porter', req: p => p.coin >= 30, r: 'In.', fx: { coin: -30 } }, { t: 'Walk on', r: 'On.', fx: {} }] }]);
      out.loneSkipped = !!stage('v2ct_lone').v.skip;
      return out;
    });
    const ok = r.scenes >= 200 && !r.bare.length && !r.lone.length && !r.vague.length && r.levy.length === 2 && r.levy.every(s => /the unit's/.test(s)) && /the unit's/.test(r.song) && r.scholarLive >= 2 && r.loneSkipped;
    return { ok, detail: `${r.scenes} scenes, ${r.choices} choices: with nothing shown ${r.bare.length} ${r.bare[0] || ''}; one live choice ${r.lone.length} ${r.lone[0] || ''}; "their regard" without a name ${r.vague.length} ${r.vague[0] || ''}; fresh levy ${JSON.stringify(r.levy)}; "Let them sing": ${r.song}; the old scholar offers a man with no coin ${r.scholarLive} live choices; a scene left with one live choice is dropped ${r.loneSkipped}` };
  },

  // the War Room: a commander sees the enemy as estimates, his own men never above full; diplomacy and the realm in words
  async v2cWarRoomNumbers(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9601, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      const pc = A.pc(), me = pc.realm, en = A.neighbors(me)[0];
      A.startWar(me, en, null, 'conquest');
      if (!pc.mil) A.enlist(pc);
      pc.mil.rank = Math.max(pc.mil.rank || 0, 8);
      for (let i = 0; i < 4; i++) { A.advance(5); let h, g = 0; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
      const R2 = A.cmdRole(pc), myR = UI.wrMyR(pc), divs = A.allDivs();
      const foe = divs.filter(d => A.hostile(myR, d.r)), mine = divs.filter(d => d.r === myR);
      const out = {};
      const wi = UI.wrIntel; UI.wrIntel = () => true;   // a scout beside it: the panel shows what is known
      try {
        const h = UI.wrDivPanel([foe[0].id], R2), s = V2CT.strip(h);
        out.foeMen = (/Men ([^A-Z]*?) Equipment/.exec(s) || [])[1] || '';
        out.foeExact = s.includes(A.fmt(foe[0].men)) || /\d[\d,.k]*\/\d/.test(out.foeMen);
        out.multi = (/divisions ([^A-Z]*?) men/.exec(V2CT.strip(UI.wrDivPanel(foe.slice(0, 3).map(d => d.id), R2))) || [])[1] || '';
        out.multiExact = out.multi === A.fmt(foe.slice(0, 3).reduce((x, d) => x + d.men, 0));
      } finally { UI.wrIntel = wi; }
      const d = mine[0], men0 = d.men, full = A.divS(d).men;
      d.men = full + 1;
      out.mine = (/Men ([\d,.k]+\/[\d,.k]+)/.exec(V2CT.strip(UI.wrDivPanel([d.id], R2))) || [])[1] || '';
      d.men = men0;
      const n = s => { const m = /^([\d.,]+)(k?)$/.exec(s); return m ? +m[1].replace(/,/g, '') * (m[2] ? 1000 : 1) : NaN; };
      const [a, b] = out.mine.split('/');
      out.over = n(a) > n(b);
      // diplomacy's restless lords and the realm tab's army quality
      A.S.factions = (A.S.factions || []).concat([{ realm: pc.realm, kind: Object.keys(A.FACTIONS)[0], power: 0.45, discontent: 70 }]);
      UI.worldView = 'dipl'; const pol = V2CT.strip(UI.worldTabPolitics(pc));
      out.lords = (/Restless lords (.{0,80})/.exec(pol) || [])[1] || '';
      A.makeRuler(pc, pc.realm, true);
      out.quality = (/levy · ([a-z ]*?quality)/.exec(V2CT.strip(UI.realmTabBasic(pc))) || [])[1] || '';
      return out;
    });
    const ok = /^(some|about) /.test(r.foeMen) && !r.foeExact && /^(some|about) /.test(r.multi) && !r.multiExact && r.mine && !r.over && r.lords && !/\d/.test(r.lords) && r.quality && !/\d/.test(r.quality);
    return { ok, detail: `enemy division's men "${r.foeMen}" (exact shown ${r.foeExact}); three enemy divisions "${r.multi}"; own division over full reads "${r.mine}" (above full ${r.over}); restless lords "${r.lords}"; army "${r.quality}"` };
  },

  // playtest 2, new 1: "Join the plot ... Nothing lost if it fails" failed, queued the gallows, and the character hanged at
  // 20. The chip reads the queued chain (A.punish, fx.event, a scheduled scene, prison, death) and says the stake in
  // words; and the failure, played, does what the chip said.
  async v2cRiskChain(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = {};
      T.enter({ seed: 9711, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const pc = A.pc(), e = A.EV.ct_plot_invite;
      out.plot = V2CT.rows('ct_plot_invite').rows[0] || '';
      // planted: a failure that queues a scene whose failures kill, one that schedules it, one that sends you to prison,
      // and one that is truly free
      if (!A.EV.v2ct_chain) A.defEvents([
        { id: 'v2ct_end', title: 'The end', cond: () => false, w: 0, text: 'A cliff.', choices: [
          { t: 'Jump', check: { s: 'athletics', d: 45 }, win: { r: 'Over.', fx: { fame: 1 } }, lose: { r: 'Down.', fx: { die: 'a fall' } } },
          { t: 'Climb', check: { s: 'athletics', d: 45 }, win: { r: 'Up.', fx: { fame: 1 } }, lose: { r: 'Down.', fx: { die: 'a fall' } } }] },
        { id: 'v2ct_chain', title: 'A path', cond: () => false, w: 0, text: 'A path.', choices: [
          { t: 'Go on', check: { s: 'survival', d: 45 }, win: { r: 'Yes.', fx: { happy: 2 } }, lose: { r: 'Lost.', fx: { event: 'v2ct_end' } } },
          { t: 'Go later', check: { s: 'survival', d: 45 }, win: { r: 'Yes.', fx: { happy: 2 } }, lose: { r: 'Later.', fx: p => { A.schedule({ type: 'event', ev: 'v2ct_end', ctx: {} }, 30); } } },
          { t: 'Steal', check: { s: 'stealth', d: 45 }, win: { r: 'Yes.', fx: { coin: 5 } }, lose: { r: 'Caught.', fx: { prison: 2 } } },
          { t: 'Ask', check: { s: 'persuasion', d: 45 }, win: { r: 'Yes.', fx: { happy: 2 } }, lose: { r: 'No.' } }] }]);
      out.chain = V2CT.rows('v2ct_chain').rows;
      // played: the plot fails (the test forces the dice, as the odds' own tests do), and the queue holds what was said
      const q = { type: 'event', ev: 'ct_plot_invite', ctx: {} };
      A.S.queue = [q]; A.headReady();
      const ch = A.chance; A.chance = () => false;
      try { A.eventChoose(0); } finally { A.chance = ch; }
      out.result = (q.result && q.result.text) || '';
      out.after = { gallows: A.S.queue.some(x => x && x.ev === 'gallows'), prison: !!pc.prison };
      A.S.queue = [];
      return out;
    });
    const plotOk = /If it fails: a treason trial: the gallows or a deep cell/.test(r.plot) && !/Nothing lost/.test(r.plot);
    const [go, later, steal, ask] = r.chain;
    const chainOk = /If it fails: what follows can kill you/.test(go || '') && /what follows can kill you/.test(later || '') && /If it fails: prison/.test(steal || '') && /Nothing lost if it fails/.test(ask || '');
    const playedOk = r.after.gallows || r.after.prison;
    return { ok: plotOk && chainOk && playedOk, detail: `"${r.plot.slice(0, 120)}" ; planted: ${r.chain.map(x => '"' + x.slice(0, 70) + '"').join(' / ')}; played, failed: "${r.result.slice(0, 60)}" -> the gallows queued ${r.after.gallows}, a cell ${r.after.prison}` };
  },

  // playtest 2, new 2: "If it fails: a wound, hurt" killed a soldier at 18, near death after a lost fight. When the hurt
  // would bring this person's health to nothing the card says it could kill, in the body sheet's own word for health.
  async v2cRiskLethal(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9721, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const pc = A.pc(), out = {};
      pc.health = 90; out.hale = V2CT.rows('lf_nb_watch').rows[1] || '';
      pc.health = 3; out.low = V2CT.rows('lf_nb_watch').rows[1] || '';
      out.band = A.V2S.band('health', pc.health);
      out.sheet = V2CT.strip(UI.barRow('Health', pc.health, 100));
      // played: the failure takes the 12 health the card counted, and the month's mortal check reads nothing left
      const q = { type: 'event', ev: 'lf_nb_watch', ctx: {} };
      A.S.queue = [q]; A.headReady();
      const ch = A.chance; A.chance = () => false;
      try { A.eventChoose(1); } finally { A.chance = ch; }
      out.after = pc.health;
      A.S.queue = [];
      return out;
    });
    const ok = /If it fails: a wound, hurt/.test(r.hale) && !/kill/.test(r.hale) && r.low.includes('If it fails: hurt that could kill you, ' + r.band + ' as you are') &&
      r.sheet.includes(r.band) && r.after <= 0;
    return { ok, detail: `hale: "${r.hale.slice(0, 110)}"; at health 3: "${r.low.slice(0, 140)}"; the sheet's health "${r.sheet}"; played, failed: health ${r.after}` };
  },

  // playtest 2, old 18's remainder: "• changes regard" named nobody, "• changes coin" / "• changes willpower" gave no way.
  // The content's helpers (pay, hurt, hp, willGrow, bump, addOp, op2, both) are read; the person is named.
  // Named across the corpus too (the verifier's objection: 340 chips in the scenes, each staged with its own context, read
  // a bare "▲ regard" or "▲ their regard"): a person in another ctx key (wk_gen_parent's parId), kin (rel: { who },
  // A.relsOf roles, p.parents, p.spouse), the crown; a regard that reaches no one here is not shown.
  async v2cChipsDirection(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      const out = { staged: {} };
      T.enter({ seed: 9731, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 19 });
      const pc = A.pc();
      const fr = A.makeAcquaintance(pc, 'friend'); A.link(pc, fr, 'friend', 40, 'friend');
      out.staged.ice = V2CT.rows('lf_friend_drowning', { pid: fr.id }).rows;
      out.staged.melee = V2CT.rows('ct_melee').rows;
      out.staged.gift = V2CT.rows('ni_invite', { pid: fr.id }).rows;
      if (!pc.mil) A.enlist(pc);
      out.staged.brawl = V2CT.rows('camp_brawl').rows;
      const d = V2CT.rows('rk_loaded_dice');
      out.staged.dice = d.rows;
      const nm = id => { const t = id && A.P(id); return t ? (A.knownName ? A.knownName(t) : t.given) : '?'; };
      out.m2 = nm(d.q.ctx.m2); out.pid = nm(d.q.ctx.pid);
      // the verifier's cases, each staged with the scene's own context (its setup fills it)
      const gp = V2CT.rows('wk_gen_parent');
      out.named = { parent: gp.rows, parName: nm(gp.q.ctx.parId) };
      for (const id of ['wk_gen_windfall', 'sc_ss_family', 'pl_envoy_abroad', 'pa_court_scandal', 'ch_inf_steps', 'lf_teen_secret_practice', 'ch_dare_orchard', 'lf_friend_feud_pick', 'lf_friend_quarrel']) out.named[id] = V2CT.rows(id).rows;
      out.dad = (pc.parents || []).map(A.P).filter(t => t && t.sex === 'M').length === 1;
      // every scene, staged for this soldier: the chips that still give no way; and (here and again below, each scene
      // with its own context) no chip reads a bare regard, and no regard is shown without its way ("• Maren's regard")
      const BARE = /(^|[•▲▼,:] )(their )?regard\b/, NOWAY = /• [^,]*regard\b/;
      const bare = [], noway = [], judge = (id, ch) => { if (BARE.test(ch.t)) bare.push(id + ': ' + ch.t); if (NOWAY.test(ch.t)) noway.push(id + ': ' + ch.t); };
      let chips = 0, vague = 0; const eg = [];
      for (const id in A.EV) {
        const e = A.EV[id]; if (!Array.isArray(e.choices)) continue;
        const q = { type: 'event', ev: id, ctx: { pid: fr.id } };
        A.S.queue.unshift(q); let v = null; try { v = A.eventView(q); } catch (err) { v = null; } A.S.queue.shift();
        if (!v || v.skip) continue;
        for (const vc of v.choices) {
          if (!vc || vc.i < 0) continue;
          for (const ch of A.STAKES.choiceChips(e.choices[vc.i], e, q, pc, vc)) { chips++; judge(id, ch); if (/• (coin|willpower|health|honour|regard|spirits|renown|piety)\b/.test(ch.t)) { vague++; if (eg.length < 4) eg.push(id + ': ' + ch.t); } }
        }
      }
      Object.assign(out, { chips, vague, eg });
      // every scene again, each with its own context (its setup fills it; no friend put in ctx.pid)
      let own = 0;
      const sp = A.makeAcquaintance(pc, 'friend'); sp.sex = 'F'; A.link(pc, sp, 'spouse', 40, 'spouse'); pc.spouse = sp.id;
      out.named.ss_sc_saddle = V2CT.rows('ss_sc_saddle').rows;
      for (const id in A.EV) {
        const e = A.EV[id]; if (!Array.isArray(e.choices)) continue;
        const q = { type: 'event', ev: id, ctx: {} };
        A.S.queue.unshift(q); let v = null; try { v = A.eventView(q); } catch (err) { v = null; } A.S.queue.shift();
        if (!v || v.skip) continue;
        for (const vc of v.choices) {
          if (!vc || vc.i < 0) continue;
          for (const ch of A.STAKES.choiceChips(e.choices[vc.i], e, q, pc, vc)) { own++; judge(id, ch); }
        }
      }
      Object.assign(out, { own, bare: bare.length, bareEg: bare.slice(0, 3), noway: noway.length, nowayEg: noway.slice(0, 3) });
      return out;
    });
    const S = r.staged, all = Object.values(S).flat();
    const noWay = all.filter(x => /• (coin|willpower|health|regard)\b/.test(x));
    const ok = !noWay.length && /Run for help ▲ .*'s regard · ▲ willpower · ▼ spirits/.test(S.ice[2] || '') && /If it fails: ▼ health, ▼ coin/.test(S.melee[1] || '') &&
      /Go, and bring a gift ▼ coin/.test(S.gift[1] || '') && /your messmates' regard/.test(S.brawl[0] || '') &&
      (S.dice[1] || '').includes(`▼ ${r.m2}'s regard`) && r.chips > 3000 && r.vague / r.chips < 0.004;
    const N = r.named, row = (id, i) => (N[id] || [])[i] || '';
    const named = (N.parent[0] || '').includes(`▲ ${N.parName}'s regard`) && /▲ your (parents'|family's|father's|mother's) regard/.test(row('wk_gen_windfall', 1)) &&
      /▲ your father's regard/.test(row('sc_ss_family', 0)) && /▲ the crown's regard/.test(row('pl_envoy_abroad', 0)) && /▲ the crown's regard/.test(row('pa_court_scandal', 0)) &&
      /▲ your wife's regard/.test(row('ss_sc_saddle', 0)) && /If it works: ▲ Riding, ▲ your father's regard/.test(row('ch_inf_steps', 0)) &&
      /▲ your (father|mother)'s regard/.test(row('lf_teen_secret_practice', 1)) && (!r.dad || /If it fails: [^·]*▼ your father's regard/.test(row('ch_dare_orchard', 0))) &&
      /Side with .* ▲ [^,]+'s regard, ▼▼ [^,]+'s regard/.test(row('lf_friend_feud_pick', 1)) && /▲ or ▼ [^,]+'s regard/.test(row('lf_friend_quarrel', 1));
    const corpus = r.own > 3000 && r.bare === 0 && r.noway === 0;
    return { ok: ok && named && corpus, detail: `named: "${N.parent[0]}" / "${row('wk_gen_windfall', 1)}" / "${row('sc_ss_family', 0)}" / "${row('pl_envoy_abroad', 0).slice(0, 70)}" / "${row('ss_sc_saddle', 0)}" / "${row('ch_inf_steps', 0).slice(0, 60)}" / "${row('ch_dare_orchard', 0).slice(0, 110)}" / "${row('pa_court_scandal', 0).slice(0, 60)}" / "${row('lf_teen_secret_practice', 1).slice(0, 70)}" / "${row('lf_friend_feud_pick', 1)}" / "${row('lf_friend_quarrel', 1)}"; every scene, twice (with a friend in ctx.pid, and each with its own context, ${r.own} chips): a bare regard ${r.bare} ${r.bareEg.join(' | ')}, a regard with no way ${r.noway} ${r.nowayEg.join(' | ')}; staged: ${all.filter(x => /Run for help|Hang back|bring a gift|Step between|demand a cut/.test(x)).map(x => '"' + x.slice(0, 90) + '"').join(' / ')} (the second messmate ${r.m2}, the first ${r.pid}); with no way shown ${noWay.length} ${noWay[0] || ''}; every scene: ${r.vague} of ${r.chips} chips give no way (under 0.4%; 1.8% before) ${r.eg.join(' | ')}` };
  },

  // playtest 2, old 19's remainder: "The hearth mark" and "What you want" showed only "It will be remembered" on every
  // choice, and "The last night" said nothing of what it does. Each choice now shows its real effect.
  async v2cEveryChoiceTrue(pg) {
    await prep(pg);
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9741, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
      const pc = A.pc(), out = {};
      out.hearth = V2CT.rows('rb_custom', { cid: 'ald_hearth' }).rows;
      out.amb = V2CT.rows('lfx_amb_young').rows;
      A.S.gath = (A.S.gath || []).concat([{ id: 'v2ct_g', kind: 'tournament', host: pc.realm, pc: { role: 'servant', aim: null, inf: 2 } }]);
      pc.job = pc.job || { c: 'labor', r: 0, y: 0, perf: 55 };
      out.close = V2CT.rows('ga_close', { gid: 'v2ct_g' }).rows;
      A.S.gath = A.S.gath.filter(g => g.id !== 'v2ct_g');
      return out;
    });
    const vague = x => /It will be remembered|Nothing changes/.test(x);
    const ok = r.hearth.length === 2 && /Costs 3 suns/.test(r.hearth[0]) && /Costs 6 suns/.test(r.hearth[1]) && r.amb.length >= 2 && r.amb.slice(0, -1).every(x => /Your aim: /.test(x)) &&
      /No aim|Gives up your aim/.test(r.amb[r.amb.length - 1]) && r.close.length === 1 && /▲ renown/.test(r.close[0]) && ![...r.hearth, ...r.amb, ...r.close].some(vague);
    return { ok, detail: `the hearth mark: ${r.hearth.map(x => '"' + x + '"').join(' / ')}; what you want: ${r.amb.map(x => '"' + x.slice(0, 70) + '"').join(' / ')}; the last night: ${r.close.map(x => '"' + x + '"').join(' / ')}` };
  },
};
