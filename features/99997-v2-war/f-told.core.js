// 99997-v2-war, part 6: what each rank may know of a war, and what outsiders hear (playtest 2, findings 3, 4, 5 and
// playtest 1's 4; V2_SPEC complaint 10: "no view of a war you're not in, only delayed and sometimes wrong rumour ...
// soldiers see only estimates").
//
//   - The world record (57-world-chronicle) on the page: World > Annals and The Book's "The world in your time" read
//     each entry through WC.tellOf. A war, a battle, a siege, a fall or an order cut down that you saw from your door
//     or fought in is set down as it was, its counts as your rank would know them (W.told). Any other reaches you late
//     (10-80 days), as hearsay: the winner wrong at v2's rate (25%, and 5% more a month late), the place half heard,
//     the dead a guess (x0.4-3), no generals' names. Until it reaches you it is not in the annals at all.
//   - 64-npc-beliefs: a battle you were not part of is not one you "know" (NB.pcKnows), and the record's own line
//     where you do know it (NB.recordLine: the belief cards, the Tales, the Chronicle, a scene putting you right)
//     gives the counts as your rank would know them, not to the man.
//   - 72-two-scales' levy (its call to arms, the front's words, the standards, the day's tally) gives estimates: a
//     levy is a soldier (TS.told, read there).
//   - The commander's battle (the release's battle modal, 9997-companies' panel, 60-drill's tags): his own side
//     exactly, the enemy's as an estimate, morale and drill in words, not 0-100.
// Everything here is pure: the hearsay dice are v2's makeRng seeded from the game's seed and the entry, nothing is
// drawn from A.rand and nothing is written to A.S.
(function () {
  const W = A.V2W, V2 = A.V2;
  if (!W || !V2 || !V2.rng) return;
  const num = s => +String(s).replace(/[^\d]/g, '');
  // the band your rank reads a count in: a commander reads a field's whole count as a captain does
  W.band = pc => { const r = W.rank(pc) || 'soldier'; return r === 'commander' ? 'captain' : r; };

  // ---- whose entry --------------------------------------------------------------------------------------------------
  const WAR_K = { war: 1, peace: 1, battle: 1, siege: 1, fall: 1, order: 1 };
  W.entWar = function (e) {
    if (!e) return null;
    if (e.k === 'battle') return Array.isArray(e.x) ? e.x[2] || null : null;
    if (e.k === 'war' || e.k === 'peace') return Array.isArray(e.x) ? e.x[0] || null : null;
    return null;
  };
  const foughtId = id => W.fightsIn(id) || !!(A.S && A.S.v2w && Array.isArray(A.S.v2w.fought) && A.S.v2w.fought.includes(id));
  // two realms on opposite sides of a war you fight or fought (b null: a on either side)
  const sidesFought = function (a, b) {
    if (!a) return false;
    const rows = W.myWars().map(w => [w.id, w.att, w.def]).concat((A.S && A.S.v2w && Array.isArray(A.S.v2w.fw)) ? A.S.v2w.fw : []);
    for (const r of rows) {
      if (!Array.isArray(r) || !Array.isArray(r[1]) || !Array.isArray(r[2])) continue;
      const [, att, def] = r;
      if (b == null ? att.includes(a) || def.includes(a) : (att.includes(a) && def.includes(b)) || (def.includes(a) && att.includes(b))) return true;
    }
    return false;
  };
  let nearC = null;
  const nearProvs = pc => {
    const WC = A.WC; if (!WC || !WC.nearProvs || !pc) return new Set();
    const key = `${pc.id}|${pc.home}|${A.S && A.S.seed}`;
    if (!nearC || nearC.key !== key || nearC.S !== A.S) nearC = { key, S: A.S, set: WC.nearProvs(pc) };
    return nearC.set;
  };
  // an entry you saw or fought in: not of a war at all, one you stood in, one at your door, or one of your wars
  W.entMine = function (e, pc) {
    pc = pc || (A.pc && A.pc());
    if (!e || !pc || !WAR_K[e.k]) return true;
    if ((e.w || []).includes(pc.id)) return true;
    if (e.k !== 'war' && e.k !== 'peace' && e.p != null && nearProvs(pc).has(e.p)) return true;
    const wid = W.entWar(e);
    if (wid) return foughtId(wid);
    if (e.k === 'battle') return false;   // a battle of no war, away from home: hearsay
    return sidesFought(e.a, e.b);
  };
  // the dice of one entry's hearsay (pure; the same entry always reaches you the same way)
  const dice = e => V2.rng.makeRng(`${A.S ? A.S.seed : 0}:v2w-annal:${e.i}:${e.k}:${e.y}:${e.d || 0}`);
  // the lag is read for every entry each time the Annals filter their rows, so it is kept per entry (a cache of a pure
  // function of the seed and the entry, outside A.S; dropped when a new game or a load replaces A.S)
  let lagC = { S: null, m: new Map() };
  W.entLag = function (e) {
    if (lagC.S !== A.S) lagC = { S: A.S, m: new Map() };
    const key = `${e.i}:${e.k}:${e.y}:${e.d || 0}`;
    let v = lagC.m.get(key);
    if (v == null) { const r = dice(e); v = e.k === 'war' || e.k === 'peace' ? r.int(10, 40) : r.int(18, 80); lagC.m.set(key, v); }
    return v;
  };
  const dayOf = e => (e.y || 0) * 365 + (e.d || 0);
  W.entHeard = function (e, pc) { return W.entMine(e, pc) || !A.absDay || A.absDay() >= dayOf(e) + W.entLag(e); };

  // ---- the line as you know it ----------------------------------------------------------------------------------------
  const rs = id => (id ? (A.realm(id) ? A.realm(id).short : (A.WC && A.WC.name && A.WC.name(id)) || 'a realm now gone') : 'someone');
  const pin = i => (i != null && A.S.prov[i] ? String(A.S.prov[i].name).replace(/^The /, 'the ') : '');
  // the record's line with its counts as your rank knows them
  W.bandLine = function (e, pc) {
    const WC = A.WC, base = WC.line(e);
    if (e.k !== 'battle') return base;
    const band = W.band(pc), x = Array.isArray(e.x) ? e.x : [];
    const t = base.replace(/: ([\d,]+) men in the field, ([\d,]+) dead/, (m, a, b) => `: ${W.told(num(a), band, false)} men in the field, ${W.told(num(b), band, false)} dead`);
    if (t !== base || !/\d{3}/.test(base)) return t;
    return `In ${WC.month(e)} ${e.y}, at ${pin(e.p)}, ${rs(e.a)} beat ${rs(e.b)}: ${W.told(e.n || 0, band, false)} men in the field, ${W.told(x[0] || 0, band, false)} dead.`;
  };
  // hearsay: late, the place half heard, the winner sometimes wrong, the dead a guess
  W.hearsay = function (e) {
    const r = dice(e), lag = W.entLag(e); r.next();
    const yH = Math.floor((dayOf(e) + lag) / 365), months = Math.max(1, Math.round(lag / 30));
    const A1 = rs(e.a), B1 = rs(e.b), P = pin(e.p), lead = `In ${yH}, word came`;
    const WC = A.WC;
    switch (e.k) {
      case 'war': return `${lead} that ${A1} had gone to war with ${B1}.`;
      case 'peace': {
        const res = Array.isArray(e.x) ? e.x[1] : 'white', nm = WC.warName ? WC.warName(e).replace(/^The /, 'the ') : 'the war';
        return res === 'white' ? `${lead} that ${nm} was over, and nothing won by it.` : `${lead} that ${nm} was over, and that ${A1} had the better of it.`;
      }
      case 'battle': {
        const wrong = r.chance(0.25 + 0.05 * months), w = wrong ? B1 : A1, l = wrong ? A1 : B1;
        const where = r.chance(0.3) || !P ? 'somewhere past the hills' : `near ${P}`;
        const dead = Array.isArray(e.x) ? +e.x[0] || 0 : 0, guess = W.estimate(Math.max(100, dead * r.float(0.4, 3)), 'soldier');
        return `${lead} of a battle ${where}: ${w} beat ${l}, as it was told, and ${guess} lay dead, ${r.pick(['or so a carter said', 'which no one here could swear to', 'by one account'])}.`;
      }
      case 'siege': return `${lead} that ${A1} had laid siege to ${P || 'a walled town'}${e.x === 'fell' ? ', and that the town had fallen' : e.x === 'lifted' ? ', and given it up' : ''}.`;
      case 'fall': return `${lead} that ${P || 'a walled town'} had ${['opened its gates to', 'been stormed by', 'been sacked by', 'been burned by'][e.x || 0] || 'fallen to'} ${A1}${r.chance(0.4) ? ', though the tellers did not agree on how' : ''}.`;
      case 'order': return `${lead} that ${(WC.name && WC.name(e.x) ? WC.name(e.x) : 'an order of knights').replace(/^The /, 'the ')} of ${A1} had been cut down${P ? ` near ${P}` : ''}, though some said they were only scattered.`;
    }
    return WC.line(e);
  };
  // what the player knows of an entry: null while it has not reached them
  W.entTold = function (e, pc) {
    if (!e || !A.WC) return null;
    pc = pc || (A.pc && A.pc());
    // the line is a getter, made only when read: The Book asks of every entry whether it is known, and sets down few
    const told = (mine, f) => { let t = null; return { mine, get t() { return t == null ? (t = f()) : t; } }; };
    if (!WAR_K[e.k]) return told(true, () => A.WC.line(e));
    if (W.entMine(e, pc)) return told(true, () => W.bandLine(e, pc));
    if (!W.entHeard(e, pc)) return null;
    return told(false, () => W.hearsay(e));
  };
  if (A.WC) { A.WC.tellOf = W.entTold; A.WC.TOLD = true; }

  // ---- 64-npc-beliefs: what you can know of a battle, and the record where you do --------------------------------
  const NB = A.NPCB;
  if (NB && typeof NB.pcKnows === 'function') {
    const pk = NB.pcKnows;
    NB.pcKnows = function (pc, c) {
      const r = pk.apply(this, arguments);
      try {
        if (r && pc && c && c.k === 'B' && A.WC && A.WC.ent) { const e = A.WC.ent(c.o); if (e && !W.entMine(e, pc)) return null; }
      } catch (er) {}
      return r;
    };
  }
  if (NB && typeof NB.recordLine === 'function') {
    const rl = NB.recordLine;
    NB.recordLine = function (c) {
      try { const e = c && A.WC && A.WC.ent ? A.WC.ent(c.o) : null; if (e && e.k === 'battle') return W.bandLine(e, A.pc && A.pc()); } catch (er) {}
      return rl.apply(this, arguments);
    };
  }

  // ---- 72-two-scales' levy: a levy is a soldier (72 reads this when it is there) ------------------------------------
  W.levyCount = (n, mine) => (Math.round(n || 0) <= 0 ? 'none' : W.told(n, W.rank() || 'soldier', mine));

  // ---- the commander's battle: his own side exactly, the enemy's an estimate, morale and drill in words -------------
  W.moWord = mo => (mo >= 75 ? 'eager' : mo >= 60 ? 'steady' : mo >= 45 ? 'sullen' : mo >= 30 ? 'shaken' : 'near breaking');
  const D = A.DRILL;
  if (D && typeof D.word === 'function') {
    const dw = v => D.word(v || 0);
    if (typeof A.drillTag === 'function') {
      const tag = A.drillTag;
      A.drillTag = function () { const t = tag.apply(this, arguments); return typeof t === 'string' ? t.replace(/ (\d+)$/, '') : t; };
    }
    if (typeof A.drillWingNote === 'function') {
      const note = A.drillWingNote;
      const NAMES = Object.values(D.NAME || {}).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      const re = NAMES ? new RegExp(`(${NAMES}) (\\d+)`, 'g') : null;
      A.drillWingNote = function () {
        let h = note.apply(this, arguments);
        if (typeof h !== 'string' || !re) return h;
        h = h.replace(/ \(([a-z ]+) (\d+) needed\)/g, ' (needs $1)');
        return h.replace(re, (m, n, v) => `${n} (${dw(+v / 100)})`);
      };
    }
  }
  if (typeof UI !== 'undefined' && typeof UI.battleModalBasic === 'function') {
    const bm = UI.battleModalBasic;
    W.battleWords = function (h, B) {
      if (typeof h !== 'string' || !B || !B.sides) return h;
      const side = B.pcSide, me = B.sides[side], en = B.sides[side === 'A' ? 'B' : 'A'];
      if (!me || !en) return h;
      const rank = W.rank() || 'soldier', esc = UI.esc;
      // the two sides' line (59-tooltips may have wrapped the counts and the morale in its own spans)
      let k = 0;
      h = h.replace(/(<b>[^<]*<\/b> )((?:<span[^>]*>)?)([\d,]+) \/ ([\d,]+)((?:<\/span>)?) <span class="muted">\(((?:<span[^>]*>)?)morale (\d+)((?:<\/span>)?)\)<\/span>/g,
        (m, nm, o1, live, full, c1, o2, mo, c2) => {
          const mine = k++ === 0, w = W.moWord(+mo), sk = mine ? side : side === 'A' ? 'B' : 'A';
          // 59-tooltips draws its bSide and bMorale triggers after this (it wraps UI.battleModal, outside), and its
          // pattern wants "(morale N)": the triggers are put on here instead, as 59's own number triggers, and its
          // popovers are the ones redrawn below (the enemy's an estimate, morale a word)
          const tn = (key, label, o) => (!o1 && typeof UI.ttNum === 'function' ? UI.ttNum(key, sk, label, o) : label);
          if (mine) return `${nm}${o1}${tn('bSide', `${live} / ${full}`, { focus: true })}${c1} <span class="muted">(${o2}${tn('bMorale', esc(w))}${c2})</span>`;
          return `${nm}${tn('bSide', esc(W.told(num(live), rank, false)), { focus: true })} <span class="muted">(${tn('bMorale', esc(w))})</span>`;
        });
      // the log: a number beside the enemy's name is an estimate; the pulse's losses on either side by whose they are
      // (the names are matched as the page has them, escaped)
      const rx = t => String(UI.esc(t || '')).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const enN = rx(en.name), meN = rx(me.name);
      if (enN && meN) {
        const est = n => W.told(num(n), rank, false);
        h = h.replace(/<div class="blog">([\s\S]*?)<\/div>/, (m, body) => {
          // the release's closing line: "X hold the field. Y are beaten. Dead: n of A, m of B." (A's first, whichever
          // side is yours) or "Night falls on a drawn field. n dead for A, m for B."
          let b = body.replace(new RegExp(`Dead: ([\\d,]+) of (${meN}), ([\\d,]+) of (${enN})\\.`, 'g'), (x, a, ma, n, nm) => `Dead: ${a} of ${ma}, ${est(n)} of ${nm}.`)
            .replace(new RegExp(`Dead: ([\\d,]+) of (${enN}), ([\\d,]+) of (${meN})\\.`, 'g'), (x, n, nm, a, ma) => `Dead: ${est(n)} of ${nm}, ${a} of ${ma}.`)
            .replace(new RegExp(`([\\d,]+) dead for (${meN}), ([\\d,]+) for (${enN})\\.`, 'g'), (x, a, ma, n, nm) => `${a} dead for ${ma}, ${est(n)} for ${nm}.`)
            .replace(new RegExp(`([\\d,]+) dead for (${enN}), ([\\d,]+) for (${meN})\\.`, 'g'), (x, n, nm, a, ma) => `${A.cap(est(n))} dead for ${nm}, ${a} for ${ma}.`)
            .replace(new RegExp(`([\\d,]{2,}) (${enN})\\b`, 'g'), (x, n, nm) => `${est(n)} ${nm}`)
            .replace(new RegExp(`drop ([\\d,]+) of (${enN})\\b`, 'g'), (x, n, nm) => `drop ${est(n)} of ${nm}`)
            // "A drive into B: [B's dead] fall to [A's dead]" and "B push A back: [A's dead] fall to [B's dead]"
            .replace(new RegExp(`(${meN}) (drive into|push) (${enN})( back)?: ([\\d,]+) fall to ([\\d,]+)`, 'g'),
              (x, a, v, c, bk, n1, n2) => bk ? `${a} ${v} ${c}${bk}: ${est(n1)} fall to ${n2}` : `${a} ${v} ${c}: ${est(n1)} fall to ${n2}`)
            .replace(new RegExp(`(${enN}) (drive into|push) (${meN})( back)?: ([\\d,]+) fall to ([\\d,]+)`, 'g'),
              (x, a, v, c, bk, n1, n2) => `${a} ${v} ${c}${bk || ''}: ${n1} fall to ${est(n2)}`);
          b = W.retell(b, rank);
          return `<div class="blog">${b}</div>`;
        });
      }
      // the result line and 9997's panel: theirs as estimates, morale in words
      h = h.replace(/Dead: ([\d,]+) of yours, ([\d,]+) of theirs/g, (m, a, b) => `Dead: ${a} of yours, ${W.told(num(b), rank, false)} of theirs`);
      h = h.replace(/ · morale (\d+)/g, (m, mo) => ` · ${W.moWord(+mo)}`);
      return h;
    };
    UI.battleModalBasic = function (B) {
      const h = bm.apply(this, arguments);
      try { return W.battleWords(h, B); } catch (e) { console.error('v2 war battle words', e); return h; }
    };
  }
  // 59-tooltips' popovers on the same screen (the sides, a side's morale, a wing, the dead): the enemy's counts as an
  // estimate, morale in words. They draw from the battle on the screen, as 59's own do; nothing is drawn or written.
  const G = typeof UI !== 'undefined' && UI.TIPS, K = G && UI.TT && UI.TT.K;
  if (K && G.bDead) {
    const { esc, H, R, D, F, L } = K;
    const battle = () => { const q = A.S.queue[0]; return (UI.TT.cur && UI.TT.cur.battle) || (q && q.type === 'battle' ? q.b : null); };
    const live = s => s.units.filter(u => u.status === 'ok' || u.status === 'shaken');
    const WING = { L: 'Left wing', C: 'Center', R: 'Right wing', X: 'Reserve' };
    const n = (B, k, v) => esc(W.told(v || 0, W.rank() || 'soldier', B.pcSide === k));
    G.bSide = function (k) {
      const B = battle(); if (!B || !B.sides[k]) return '';
      const S = B.sides[k], us = live(S), men = us.reduce((a, u) => a + u.men, 0), mine = B.pcSide === k;
      if (!mine) return H(esc(S.name), n(B, k, men), 'the enemy') + D('What your scouts and the standards in the line tell you, not a muster of theirs.') +
        R(L('bMorale', k, 'Morale'), esc(W.moWord(A.avgMorale(B, k))), 'tt-sum');
      const out = S.units.filter(u => !(u.status === 'ok' || u.status === 'shaken')).reduce((a, u) => a + u.men, 0);
      const parts = Object.keys(WING).map(w => [L('bWing', k + '|' + w, WING[w]), us.filter(u => u.wing === w).reduce((a, u) => a + u.men, 0)]);
      return H(esc(S.name), n(B, k, men), `of ${n(B, k, S.men0)} · yours`) +
        `<div class="tip-row tt-sum"><span>Still in the line</span><b></b></div>` + parts.map(([l, v]) => R(l, n(B, k, v), 'tt-sub')).join('') +
        (out ? R('Routed or gone (not counted)', n(B, k, out), 'tt-sub') : '') + (B.dead && B.dead[k] ? R('Dead so far', n(B, k, B.dead[k]), 'tt-sub') : '') +
        R(L('bMorale', k, 'Morale'), esc(W.moWord(A.avgMorale(B, k))), 'tt-sum');
    };
    G.bMorale = function (k) {
      const B = battle(); if (!B || !B.sides[k]) return '';
      const us = live(B.sides[k]), mine = B.pcSide === k;
      return H('Morale', esc(W.moWord(A.avgMorale(B, k))), esc(B.sides[k].name)) + D('Each unit\'s heart for the fight, weighed by its men. Losses, flanks and a broken wing beside it pull it down; a line breaks long before it is dead.') +
        (mine ? us.map(u => R(`${esc(u.name)} (${n(B, k, u.men)})`, esc(W.moWord(u.morale)) + (u.status === 'shaken' ? ' · shaken' : ''), 'tt-sub')).join('') : '') +
        (us.length ? '' : D('Nobody is left standing.'));
    };
    G.bWing = function (arg) {
      const B = battle(); const [k, w] = String(arg).split('|'); if (!B || !B.sides[k]) return '';
      const us = B.sides[k].units.filter(u => u.wing === w && u.status !== 'gone');
      const T = GD.BATTLE_TACTICS[(us[0] || {}).tac] || {}, mine = B.pcSide === k;
      return H(WING[w] || w, n(B, k, us.reduce((a, u) => a + u.men, 0)), esc(B.sides[k].name)) +
        (mine ? us.map(u => R(`${esc(u.name)}${u.status === 'rout' ? ' (routing)' : u.status === 'shaken' ? ' (shaken)' : ''}`, `${n(B, k, u.men)} of ${n(B, k, u.men0 || u.men)} · ${esc(W.moWord(u.morale))}`, 'tt-sub')).join('') : '') +
        (mine && T.name ? F(`Orders: ${esc(T.name)}.`) : '');
    };
    const dead = G.bDead;
    G.bDead = function () {
      const B = battle(); if (!B || !B.dead) return '';
      const me = B.pcSide, en = me === 'A' ? 'B' : 'A';
      // 59's own popover, its header and two rows put back with the enemy's dead as an estimate (the rest, where they
      // fell, is kept as 59 draws it)
      const h = dead.apply(this, arguments);
      const rest = h.indexOf('<div class="tip-row tt-sum"><span>Where they fell'), tail = rest >= 0 ? h.slice(rest) : F('Most of the dead fall in the rout, not the clash.');
      return H('The dead', null, 'yours counted, theirs a guess') + R('Yours', n(B, me, B.dead[me])) + R('Theirs', n(B, en, B.dead[en])) + tail;
    };
  }
})();
