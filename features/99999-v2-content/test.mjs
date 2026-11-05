// 99999-v2-content: regression tests for playtest 1's content findings (#9, #10, #11, #18, #19, the War Room numbers).
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
          if (/\byou (are|pay|sign|have)\b|\bshe says\b|\bit is\b|while you are/.test(w.long) || (deed && !MW.pastDeed(deed))) out.present.push(w.long);
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
        if ((e.choices || []).length >= 2 && live.length < 2) out.lone.push(q.ev);
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
};
