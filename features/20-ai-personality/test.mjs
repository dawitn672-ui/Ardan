// Browser tests for features/20-ai-personality. Each gets (page, pageErrors, {browser, file, lives}).
export default {
  async aiPersonalityMapping(pg) {
    // traits -> persona: directions, the A.AGGRO baseline, opposites cancelling, unknown traits ignored, cache refresh
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 11, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const bad = [];
      const want = (c, msg) => { if (!c) bad.push(msg); };
      const rid = Object.values(A.S.realms).find(x => x.alive && !x.isRebel && A.P(x.ruler) && x.id !== 'POL-01').id;
      const ru = A.P(A.realm(rid).ruler), keep = ru.traits.slice();
      const as = t => { ru.traits = t; return A.rulerPersona(rid); };
      const none = as([]), hawk = as(['wrathful', 'ambitious']), dove = as(['content', 'kind']);
      want(Math.abs(none.war - none.cult) < .01, `no traits: war ${none.war} should equal the realm baseline ${none.cult}`);
      want(hawk.war > none.war * 2, `wrathful+ambitious war ${hawk.war} vs baseline ${none.war}`);
      want(dove.war < none.war * .5, `content+kind war ${dove.war} vs baseline ${none.war}`);
      want(A.aiWarBar(rid) <= -40 && dove.warLog < 0, `a gentle ruler needs deep hatred before war (bar ${A.aiWarBar(rid)})`);
      as(['wrathful', 'ambitious']); want(A.aiWarBar(rid) >= -10, `a warlike ruler goes to war at milder hatred (bar ${A.aiWarBar(rid)})`);
      const pairs = [['brave', 'craven', 'caution'], ['honest', 'deceitful', 'honor'], ['loyal', 'fickle', 'honor'], ['greedy', 'generous', 'greed'], ['proud', 'humble', 'pride'],
        ['gregarious', 'shy', 'social'], ['zealous', 'cynical', 'zeal'], ['wrathful', 'calm', 'wrath'], ['patient', 'impetuous', 'patience'], ['kind', 'cruel', 'warmth']];
      for (const [a, b, ax] of pairs) {
        const pa = as([a]), pb = as([b]);
        want(Math.sign(pa[ax]) === -Math.sign(pb[ax]) && pa[ax] !== 0, `${a}/${b} should push ${ax} in opposite directions (${pa[ax]} vs ${pb[ax]})`);
        const both = as([a, b]);
        want(Math.abs(both[ax]) < Math.abs(pa[ax]), `${a}+${b} should mostly cancel on ${ax}`);
      }
      want(as(['honest', 'loyal']).honor > .8, 'honest+loyal should be near the top of honor');
      want(as(['fickle', 'deceitful']).honor < -.8, 'fickle+deceitful should be near the bottom of honor');
      want(as(['craven']).war < 1 && as(['brave']).war > as(['craven']).war, 'brave rulers declare war more readily than craven ones');
      const odd = as(['nonsense-trait', 'calm']);
      want(odd.traits.length === 1 && odd.traits[0] === 'calm', 'unknown traits are ignored');
      // the realm baseline: the same ruler in a warlike and a peaceable tradition
      ru.traits = ['proud'];
      const save = A.AGGRO[rid];
      A.AGGRO[rid] = 1.69; const hi = A.rulerPersona(rid).war;
      A.AGGRO[rid] = .25; const lo = A.rulerPersona(rid).war;
      if (save == null) delete A.AGGRO[rid]; else A.AGGRO[rid] = save;
      want(Math.abs(hi / lo - Math.sqrt(1.69 / .25)) < .05, `A.AGGRO stays the baseline (ratio ${(hi / lo).toFixed(2)})`);
      ru.traits = keep;
      // rulerless realm and a lone person
      const pp = A.personPersona({ id: 'x', traits: ['ambitious', 'brave'] });
      want(pp.war > 1.5 && pp.cult === 1, 'personPersona has no realm baseline');
      want(A.rulerPersona('POL-NOPE').war > 0, 'an unknown realm still gets a neutral persona');
      return { bad, sample: { hawk: hawk.war, dove: dove.war, none: none.war } };
    });
    return { ok: !r.bad.length, detail: r.bad.length ? r.bad.slice(0, 4).join('; ') : `war weight hawk ${r.sample.hawk}, none ${r.sample.none}, dove ${r.sample.dove}; 10 opposite pairs checked` };
  },

  async aiPersonalityReasons(pg) {
    // decisions land in A.S.aiLog, newest first, capped, each with at most 3 well-formed reasons; old saves without the log load
    const r = await pg.evaluate(async () => {
      A.newGame({ seed: 4321, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 18 });
      T.play(30);
      const L = A.S.aiLog || [], bad = [];
      for (let i = 0; i < L.length; i++) {
        const e = L[i];
        if (!e || typeof e.t !== 'string' || !e.t || typeof e.k !== 'string' || !A.realm(e.r)) { bad.push('malformed entry ' + JSON.stringify(e).slice(0, 120)); continue; }
        if (!Array.isArray(e.why) || !e.why.length || e.why.length > 3) bad.push(`entry ${e.k} has ${e.why && e.why.length} reasons`);
        for (const [l, w] of e.why || []) if (typeof l !== 'string' || !l || /[<>"]/.test(l) || !isFinite(w)) bad.push(`bad reason ${JSON.stringify([l, w])}`);
        if (i && (L[i - 1].y < e.y || (L[i - 1].y === e.y && L[i - 1].d < e.d))) bad.push(`not newest first at ${i}`);
        // reasons are the top three by size
        const ws = (e.why || []).map(x => Math.abs(x[1]));
        if (ws.some((w, j) => j && w > ws[j - 1] + 1e-9)) bad.push(`reasons out of order in ${e.k}`);
      }
      const kinds = {}; for (const e of L) kinds[e.k] = (kinds[e.k] || 0) + 1;
      // a declared war carries the ruler's own traits among its reasons when they matter
      const rid = Object.values(A.S.realms).find(x => x.alive && !x.isRebel && A.P(x.ruler) && !x.playerRun && A.neighbors(x.id).length).id;
      const ru = A.P(A.realm(rid).ruler), keep = ru.traits.slice(); ru.traits = ['wrathful', 'ambitious'];
      const tid = A.neighbors(rid)[0];
      const e = A.aiLogAdd('war', rid, tid, 'declares war on ' + A.realmShort(tid) + '.', A.aiWhyWar(rid, tid, { ratio: 1.8 }, -60, 'rivalry'));
      ru.traits = keep;
      const traitReason = e.why.some(x => /Wrathful ruler|Ambitious ruler/.test(x[0]));
      // the cap
      for (let i = 0; i < 320; i++) A.aiLogAdd('trade', rid, tid, 'test entry.', [['A', 1]]);
      const capped = A.S.aiLog.length === 300 && A.S.aiLog[0].t === 'test entry.';
      // an old save: no aiLog at all, then keep playing
      delete A.S.aiLog;
      const enc = await SAVES.encode(A.S, A.J), d = await SAVES.decode(enc.bytes);
      A.deserialize(d.S);
      let err = null;
      try {
        // keep the world running even if the heroine has died
        const end = A.S.year + 3;
        for (let k = 0; k < 400 && A.S.year < end; k++) {
          A.advance(30);
          let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
          if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
        }
      } catch (x) { err = String(x).slice(0, 200); }
      return { n: L.length, bad: bad.slice(0, 5), kinds, traitReason, capped, err, again: Array.isArray(A.S.aiLog) ? A.S.aiLog.length : -1 };
    });
    const ok = r.n >= 20 && !r.bad.length && r.traitReason && r.capped && !r.err && r.again > 0;
    return { ok, detail: `${r.n} decisions logged in 30 years (${Object.entries(r.kinds).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => k + ' ' + n).join(', ')}); ` +
      `${r.bad.length ? 'BAD: ' + r.bad.join('; ') : 'all well-formed'}; trait in war reasons ${r.traitReason}; capped ${r.capped}; old save ${r.err ? 'FAILED ' + r.err : 'ok, ' + r.again + ' new entries'}` };
  },

  async aiPersonalityWhy(pg) {
    // the diplomacy screen's "why" lists are the engine's own numbers
    const r = await pg.evaluate(() => {
      A.newGame({ seed: 99, race: 'human', realm: 'POL-02', status: 'noble', sex: 'M', startAge: 30 });
      T.play(5);
      const live = A.dLive(), bad = [];
      let n = 0;
      for (const a of live) for (const b of live) {
        if (a.id === b.id) continue;
        const iv = A.interest(a.id, b.id), parts = A.interestParts(a.id, b.id), sum = parts.reduce((s, x) => s + x[1], 0);
        if (Math.abs(iv - sum) > parts.length * .5 + 1) bad.push(`interest ${a.id}->${b.id} ${iv.toFixed(1)} vs shown ${sum}`);
        const pull = A.aiPullSum(a.id, b.id), shown = A.aiPullParts(a.id, b.id, false).reduce((s, x) => s + x[1], 0);
        if (Math.abs(pull - shown) > 1e-9) bad.push(`pull ${a.id}->${b.id}`);
        n++;
      }
      // the yearly drift really runs through A.aiPullSum
      const f = A.aiPullSum; let calls = 0;
      A.aiPullSum = function () { calls++; return f.apply(this, arguments); };
      A.politicsYear();
      A.aiPullSum = f;
      // a ruler's view of the card: no fictional list, a temperament line, reasons under offers
      const pc = A.pc(), rid = 'POL-02';
      A.makeRuler(pc, rid); A.realm(rid).playerRun = true;
      const o = live.find(x => x.id !== rid && A.P(x.ruler));
      UI.screen = 'game'; UI.tab = 'realm'; UI.realmView = 'dipl'; UI.diplSel = o.id; UI.render();
      const html = document.body.innerHTML;
      return { n, bad: bad.slice(0, 4), calls, live: live.length, fiction: html.includes('Slowly pulling them'), real: html.includes('Pulling them each year'),
        temper: html.includes('Their ruler:'), why: html.includes('ai-why'), log: html.includes('Recent decisions of rulers') };
    });
    const ok = !r.bad.length && r.calls >= r.live * (r.live - 1) - 2 && !r.fiction && r.real && r.temper && r.why && r.log;
    return { ok, detail: `${r.n} realm pairs: interest = sum of shown parts, pull = sum of shown pulls${r.bad.length ? ' — BAD: ' + r.bad.join('; ') : ''}; ` +
      `politicsYear drift used A.aiPullSum ${r.calls}x; card: fiction ${r.fiction}, real pulls ${r.real}, temperament ${r.temper}, offer reasons ${r.why}, decisions view ${r.log}` };
  },

  async aiPersonalityRenderPure(pg) {
    // drawing the diplomacy view, the decisions log and the court fold-out never touches the random stream or the state
    const r = await pg.evaluate(() => {
      T.enter({ seed: 5150, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 25 });
      T.play(12);
      const out = {};
      // as a commoner/noble: the court view's fold-out
      const h0 = T.hash(A.S), s0 = A.rngState;
      UI.tab = 'realm'; UI.aiLogOpen = true; UI.render(); UI.A.aiLogMode('us'); UI.A.aiLogMore(); UI.A.aiLogMode('all');
      out.court = document.body.innerHTML.includes('Recent decisions of rulers');
      out.courtPure = A.rngState === s0 && T.hash(A.S) === h0;
      // as a ruler: the diplomacy card for every realm, the log in both modes, the peace screen if at war
      const pc = A.pc(), rid = pc.realm;
      A.makeRuler(pc, rid); A.realm(rid).playerRun = true;
      const others = A.dLive().filter(x => x.id !== rid);
      const drawMine = () => {
        UI.tab = 'realm'; UI.realmView = 'dipl';
        for (const o of others) { UI.diplSel = o.id; UI.render(); }
        UI.aiLogMode = 'us'; UI.render(); UI.aiLogMode = 'all'; UI.aiLogN = 60; UI.render();
        return document.querySelectorAll('.ai-dec').length;
      };
      // the very first draw of this feature's views as a brand-new ruler must already leave the random stream alone
      const s1a = A.rngState;
      drawMine();
      out.firstRng = A.rngState === s1a;
      // the base game's own court view consumes randomness the first time a new ruler opens it (it creates house heads),
      // so draw everything once, then require every later draw to change nothing at all
      T.renderAll();
      const h1 = T.hash(A.S), s1 = A.rngState;
      out.entries = drawMine();
      T.renderAll();
      out.rulerPure = A.rngState === s1 && T.hash(A.S) === h1;
      // escaping: markup inside a logged entry is shown as text
      A.aiLogAdd('war', rid, null, '<img src=x id=pwn>', [['<b>bold</b>', 1]]);
      UI.tab = 'realm'; UI.realmView = 'dipl'; UI.render();
      out.escaped = !document.getElementById('pwn') && !document.querySelector('.ai-dec b b') && document.body.innerHTML.includes('&lt;img');
      return out;
    });
    const ok = r.court && r.courtPure && r.firstRng && r.rulerPure && r.entries > 0 && r.escaped;
    return { ok, detail: `court fold-out shown ${r.court}, pure ${r.courtPure}; ruler views: first draw of the diplomacy cards and log leaves the random stream alone ${r.firstRng}, every later draw changes nothing ${r.rulerPure} (${r.entries} decisions drawn); markup escaped ${r.escaped}` };
  },

  async aiPersonalityLongSim(pg, errs) {
    // a long world stays error-free, the log stays bounded, and warlike rulers really start more wars than gentle ones
    const r = await pg.evaluate(() => {
      const AGG = ['wrathful', 'ambitious', 'cruel', 'brave', 'greedy', 'proud', 'impetuous'], PEACE = ['content', 'kind', 'craven', 'patient', 'humble', 'calm', 'generous'];
      let aN = 0, pN = 0, aY = 0, pY = 0, err = null, wars = 0, maxLog = 0, years = 0;
      // four worlds pooled: one world's ratio swings from 1.5 to 6 with the random stream (any feature that draws one more
      // number moves it), four together hold steady
      for (const seed of [606, 4, 77, 1234]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16, diff: 'story' });
        const known = new Set(A.S.wars.map(w => w.id)), end = A.S.year + 50;
        const tr = rid => { const x = A.realm(rid), ru = x && A.P(x.ruler); return ru ? ru.traits : []; };
        try {
          for (let k = 0; k < 40000 && A.S.year < end; k++) {
            A.advance(30);
            let h, g = 0; while ((h = A.headReady()) && g++ < 300) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
            if (!A.pc().alive) { const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p)); if (!kid) break; A.S.pc = kid.id; }
            for (const w of A.S.wars) if (!known.has(w.id)) { known.add(w.id); wars++; const t = tr(w.leadA); if (t.some(x => AGG.includes(x))) aN++; if (t.some(x => PEACE.includes(x))) pN++; }
            for (const x of Object.values(A.S.realms)) if (x.alive && !x.isRebel) { const t = tr(x.id); aY += t.filter(y => AGG.includes(y)).length / 12; pY += t.filter(y => PEACE.includes(y)).length / 12; }
            maxLog = Math.max(maxLog, (A.S.aiLog || []).length);
          }
        } catch (e) { err = String(e.stack || e).slice(0, 300); }
        years += 50;
      }
      return { err, wars, aN, pN, aY: Math.round(aY), pY: Math.round(pY), ratio: aY && pY && pN ? (aN / aY) / (pN / pY) : null, maxLog, years };
    });
    const ok = !r.err && !errs.length && r.maxLog <= 300 && r.wars > 20 && r.ratio != null && r.ratio > 1.5;
    return { ok, detail: `${r.years} world-years, ${r.wars} wars, log peak ${r.maxLog}; wars per trait-year aggressive/peaceful ${r.ratio && r.ratio.toFixed(2)} ` +
      `(${r.aN}/${r.aY}y vs ${r.pN}/${r.pY}y)${r.err ? '; ERROR ' + r.err : ''}` };
  },
};
