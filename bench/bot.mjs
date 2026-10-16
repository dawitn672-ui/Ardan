// In-page bot, installed as window.B. Plays whole lives with a personality and records what happened.
// Personalities choose event options: careful (best odds), reckless (worst odds), greedy (coin/fame/rank effects),
// random. "engaged" bots also spend initiative on the game's own top "What now" suggestion each month, like an
// attentive player; passive bots only answer what the game puts in front of them.
export const BOT = () => {
  const words = s => (String(s || '').match(/\S+/g) || []).length;

  // which events read a memory: a flag some other event sets, or the seen-events record
  function memoryIndex() {
    if (B._mem) return B._mem;
    const setters = {};
    // a flag set directly, or an arc's mark (fx.arc { mark: 'x' } sets the flag la_x; 46-life-arcs and the story arcs)
    const flagsIn = src => [...src.matchAll(/["']?flag["']?\s*:\s*["']([A-Za-z0-9_]+)["']|flags(?:\.|\[["'])([A-Za-z0-9_]+)["']?\]?\s*=(?!=)|["']?mark["']?\s*:\s*["']([A-Za-z0-9_]+)["']/g)].map(m => m[1] || m[2] || 'la_' + m[3]);
    // the event's own setup: 67-memory-weave wraps every setup to weave in a memory, which says nothing about the event
    const ownSetup = e => (e._mwWrapped ? e._mwOwnSetup : e.setup);
    for (const e of Object.values(A.EV)) {
      for (const fx of [ownSetup(e)]) if (fx) for (const f of flagsIn(fx.toString())) (setters[f] = setters[f] || new Set()).add(e.id);
      for (const c of e.choices || []) for (const fx of [c.fx, c.win && c.win.fx, c.lose && c.lose.fx]) {
        if (!fx) continue;
        const src = typeof fx === 'function' ? fx.toString() : JSON.stringify(fx);
        for (const f of flagsIn(src)) (setters[f] = setters[f] || new Set()).add(e.id);
      }
    }
    const reads = {}, memory = new Set();
    for (const e of Object.values(A.EV)) {
      // a memory is read where it decides whether the event comes (cond), how it is set up, or what it says
      const src = (e.cond ? e.cond.toString() : '') + ' ' + (ownSetup(e) ? ownSetup(e).toString() : '') + ' ' + (typeof e.text === 'function' ? e.text.toString() : '');
      // ... or an arc's mark read back: M(p, 'x') or C.arcMark(p, 'x') read the flag la_x
      const fl = [...src.matchAll(/C\.flag\(p,\s*["']([A-Za-z0-9_]+)["']|flags(?:\.|\[["'])([A-Za-z0-9_]+)|\b(?:M|arcMark)\(p,\s*["']([A-Za-z0-9_]+)["']/g)].map(m => m[1] || m[2] || 'la_' + m[3]).filter(f => f !== 'ev' && f !== 'unfree' && f !== 'patron' && f !== 'chain');
      reads[e.id] = fl;
      if (/flags\.ev\b|flags\[["']ev["']\]/.test(src) || fl.some(f => setters[f] && [...setters[f]].some(s => s !== e.id))) memory.add(e.id);
    }
    const orphan = Object.keys(setters).filter(f => !Object.values(reads).some(r => r.includes(f)));
    return (B._mem = { memory, setters, orphan });
  }

  function pick(v, e, personality) {
    const ch = v.choices.filter(c => c.i >= 0);
    if (!ch.length) return 0;
    const odds = c => c.odds == null ? 100 : c.odds;
    const gain = c => {
      const src = e && e.choices[c.i] ? e.choices[c.i] : {};
      const s = JSON.stringify([src.fx, src.win && src.win.fx].map(x => typeof x === 'function' ? x.toString() : x));
      return (/coin|realmGold|treasury/.test(s) ? 2 : 0) + (/fame|promote|merit|rep/.test(s) ? 1 : 0);
    };
    let best;
    if (personality === 'careful') best = ch.reduce((a, c) => odds(c) > odds(a) ? c : a);
    else if (personality === 'reckless') best = ch.reduce((a, c) => odds(c) < odds(a) ? c : a);
    else if (personality === 'greedy') best = ch.reduce((a, c) => gain(c) * 100 + odds(c) > gain(a) * 100 + odds(a) ? c : a);
    else best = A.pick(ch);
    return v.choices.indexOf(best);
  }

  function sample(pc) {
    return {
      y: A.S.year, age: A.age(pc), coin: Math.round(pc.coin), fame: Math.round(pc.fame || 0), health: Math.round(pc.health),
      cls: A.classOf(pc), mil: pc.mil ? pc.mil.rank : -1, merc: !!(pc.mil && pc.mil.merc), job: pc.job ? pc.job.c + ':' + pc.job.r : '',
      rung: pc.noble ? pc.noble.rung : -1, ruler: !!pc.ruler, office: pc.office || '', prison: !!pc.prison, unfree: pc.flags.unfree || '',
      married: !!(pc.spouse && A.P(pc.spouse) && A.P(pc.spouse).alive), kids: (pc.children || []).filter(c => A.P(c) && A.P(c).alive).length,
      traits: pc.traits.length, wil: Math.round(pc.st.wil), str: Math.round(pc.st.str), styled: pc.styles ? Object.keys(pc.styles).length : 0,
    };
  }

  function arc(L) {
    const S = L.samples, last = S[S.length - 1] || {}, ever = k => S.some(s => s[k] && s[k] !== -1 && s[k] !== '');
    const maxOf = k => Math.max(-1, ...S.map(s => typeof s[k] === 'number' ? s[k] : -1));
    if (L.deathAge != null && L.deathAge < 20) return 'cut short';
    if (ever('ruler')) return 'ruler';
    if (maxOf('mil') >= 7) return 'general';
    if (S.some(s => s.office)) return 'officer of state';
    if (maxOf('mil') >= 4) return 'captain';
    if (S.some(s => s.prison)) return 'outlaw';
    if (S[0] && S[0].unfree && !last.unfree) return 'freed';
    if (S[0] && S[0].unfree) return 'bound for life';
    if (maxOf('rung') - (S[0] ? S[0].rung : -1) >= 2) return 'risen noble';
    if (maxOf('mil') >= 0) return S.some(s => s.merc) ? 'sellsword' : 'soldier';
    if (maxOf('coin') > 20000) return 'fortune made';
    if (S.some(s => /:([3-9])$/.test(s.job))) return 'master of a trade';
    if (S.some(s => s.job)) return 'working life';
    if (maxOf('fame') >= 50) return 'local legend';
    return 'quiet life';
  }

  window.B = {
    memoryIndex, arc,
    life(o, personality, engaged, maxYears = 90) {
      const M = memoryIndex();
      A.newGame(o);
      const L = { o, personality, engaged, samples: [], events: 0, memEvents: 0, distinct: new Set(), checks: 0, wins: 0, items: {},
        gaps: [], lastDay: A.absDay(), actions: 0, deathAge: null, cause: null, choicesSeen: 0, words: 0, npcMoves: 0, battles: 0, battlesWithReport: 0 };
      const start = A.S.year;
      let lastSampleYear = -1;
      for (let guard = 0; guard < 20000; guard++) {
        const pc = A.pc();
        if (!pc || !pc.alive || A.S.year - start > maxYears) break;
        if (A.S.year !== lastSampleYear) { L.samples.push(sample(pc)); lastSampleYear = A.S.year; }
        if (engaged) {
          // spend initiative like an attentive player: the game's own top suggestion if it is an action,
          // otherwise the first available activity this personality would choose
          const w = (A.whatNow(pc) || []).find(x => x.act && x.act[0] === 'act' && A.canAct(x.act[1])[0]);
          const PLAN = { careful: ['heal', 'rest', 'study', 'practice', 'pray', 'make_friend', 'train_yard'], greedy: ['trade_venture', 'moneylend', 'chores', 'gamble', 'practice', 'study'],
            reckless: ['duel', 'tournament', 'beast_hunt', 'crime_rob', 'hunt', 'spar', 'tavern'], random: Object.keys(GD.ACTIVITIES) };
          const list = personality === 'random' ? [A.pick(PLAN.random)] : PLAN[personality] || [];
          const k = w ? w.act[1] : list.find(a => GD.ACTIVITIES[a] && A.canAct(a)[0]);
          if (k) { let r = null; try { r = A.doActivity(k); } catch (err) {} if (r && r.ok !== false) L.actions++; }
        }
        const r = A.advance(engaged ? 31 : 400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 300) {
          const day = A.absDay();
          L.gaps.push(day - L.lastDay); L.lastDay = day;
          L.items[h.type] = (L.items[h.type] || 0) + 1;
          if (h.type === 'event') {
            const v = A.eventView(h), e = A.EV[h.ev];
            L.events++; L.distinct.add(h.ev); if (M.memory.has(h.ev)) L.memEvents++;
            if (e && (e.npc || (h.ctx && h.ctx.npcMove))) L.npcMoves++;   // convention: NPC-started events carry npc: true
            L.choicesSeen += v.choices.length; L.words += words(v.text);
            const i = pick(v, e, personality), c = v.choices[i];
            if (c && c.odds != null) L.checks++;
            A.eventChoose(i);
            const q = A.S.queue[0];
            if (c && c.odds != null && q && q.result && q.result.success) L.wins++;
            A.eventClose();
          } else if (h.type === 'choice') A.choiceChoose(personality === 'random' ? A.ri(0, Math.max(0, h.options.length - 1)) : 0);
          else if (h.type === 'duel') { A.duelAuto(h.d); A.duelClose(); }
          else if (h.type === 'mission') { A.missionAuto(h.m); if (A.S.queue[0] === h) A.missionClose ? A.missionClose() : A.S.queue.shift(); }
          else if (h.type === 'battle') { A.battleAuto(h.b); L.battles++; if (h.b.aar) L.battlesWithReport++;   // convention: b.aar holds the after-action report
            if (A.S.queue[0] === h) A.battleClose ? A.battleClose() : A.S.queue.shift(); }
          else A.skipPrompt();
        }
        if (r.why === 'dead') break;
      }
      const pc = A.P(A.S.pc);
      if (pc && !pc.alive) { L.deathAge = A.age(pc); L.cause = pc.deathCause || pc.cause || pc.lastHurt || '?'; }
      L.years = A.S.year - start;
      L.distinct = L.distinct.size;
      L.arc = arc(L);
      return L;
    },
  };
};
