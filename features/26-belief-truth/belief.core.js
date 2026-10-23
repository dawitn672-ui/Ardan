// Belief versus truth (signature system 2; Road to Ten World 4 and Uniqueness 3). What you know of the world depends on
// how you came by it, and what the world knows can be wrong.
//
//   Beasts.  Each of the 64 creatures is, for you, unknown, heard of (you know what people believe), seen (you met one
//            and lived), or known (you killed one or read the truth). The bestiary shows only that much.
//   Secrets. Everyone knows the accepted story of the 71 secrets. The truth, and its proof, only if you found it.
//   News.    Word of far battles comes inflated, and a truer count follows months later. Near news is fact.
//   Legend.  The Chronicle sets down your deeds, and then the tale as the taverns tell it.
//
// State is flags (the year it happened): bt_h_<id> heard, bt_s_<id> seen, bt_k_<id> known, and the base game's own
// rl_k_<secret id>. All of it is optional, so old saves load. What you heard as a child is computed, never stored, so
// rendering stays pure. Learning happens only in engine commands.
(function () {
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const BT = A.BT = {};
  const creature = id => LORE.creatures.find(c => c.id === id);
  // the terrain words in a creature's habitat, for those without engine stats
  const TERR_RX = { mountains: /mountain|crag|peak|range|cliff|high valley/i, hills: /hill|upland|moor/i, forest: /forest|wood|grove|tree/i,
    marsh: /marsh|fen|swamp|delta|bog|reed/i, coast: /coast|sea|shore|reef|ocean|bay|island/i, plains: /plain|grass|steppe|meadow|field/i,
    desert: /desert|sand|dune|waste/i, tundra: /tundra|snow|ice|frost|glacier|north/i };
  const terrsOf = c => {
    const B = A.BEASTS && A.BEASTS[c.id];
    if (B && B.terr && B.terr.length) return B.terr;
    return Object.keys(TERR_RX).filter(k => TERR_RX[k].test(c.habitat || ''));
  };
  BT.terrsOf = terrsOf;
  const homeTerr = pc => { const P = pc && A.prov ? A.prov(pc.home) : null; return P ? [P.terr, P.coast ? 'coast' : null].filter(Boolean) : []; };
  // heard of as a child: beasts of your home ground, the great ones every child hears of, and a few more by family
  BT.childHeard = function (pc, c) {
    if (!pc || !c) return false;
    const home = homeTerr(pc);
    if (terrsOf(c).some(t => home.includes(t))) return true;
    if (/dragon|giant/i.test(c.cat || '')) return true;
    return hash(pc.id + '|' + c.id) % 5 === 0;
  };
  BT.level = function (pc, id) {
    if (!pc || !pc.flags) return 0;
    const f = pc.flags;
    if (f['bt_k_' + id] != null) return 3;
    if (f['bt_s_' + id] != null) return 2;
    if (f['bt_h_' + id] != null) return 1;
    return BT.childHeard(pc, creature(id)) ? 1 : 0;
  };
  BT.secretKnown = (pc, id) => !!(pc && pc.flags && pc.flags['rl_k_' + id] != null);
  // years since pc last found a secret's truth (99 if never): secrets should stay rare, one find in eight years at most
  BT.sinceSecret = pc => { let y = -1; for (const k in (pc && pc.flags) || {}) if (/^rl_k_/.test(k)) y = Math.max(y, pc.flags[k]); return y < 0 ? 99 : A.S.year - y; };

  const short = (t, n) => { t = String(t || '').replace(/;\s*$/, ''); if (t.length <= n) return t; const cut = t.slice(0, n); return cut.slice(0, Math.max(cut.lastIndexOf('; '), cut.lastIndexOf(', '), cut.lastIndexOf('. '), n - 20)).replace(/[;,.]?$/, '') + '…'; };
  // Engine only. Raises what pc knows of a creature to lvl (1 heard, 2 seen, 3 known) and says so in the story log.
  BT.learn = function (pc, id, lvl, how) {
    const c = creature(id); if (!pc || !c || !(lvl >= 1)) return false;
    const was = BT.level(pc, id); if (lvl <= was) return false;
    pc.flags['bt_' + ['', 'h', 's', 'k'][lvl] + '_' + id] = A.S.year;
    if (pc.id !== A.S.pc) return true;
    const name = c.name.replace(/^The /, 'the ');
    const line = lvl === 1 ? `${how || 'You hear tell of'} ${/^the /.test(name) ? name : 'the ' + name}. Folk say: ${short(c.belief, 150)}.`
      : lvl === 2 ? `You have seen ${/^the /.test(name) ? name : 'a ' + name} with your own eyes, and lived. The tales and the beast are not the same thing.`
      : `${how || 'You learn the truth of'} ${/^the /.test(name) ? name : 'the ' + name}: ${short(c.truth, 120)}.${c.weak && c.weak !== '–' ? ' Its weakness: ' + short(c.weak, 120) + '.' : ''}`;
    A.log(line + ' (Codex: Bestiary)', 'lore');
    return true;
  };
  // Engine only. pc learns the truth behind a secret (the base game's rl_k_ flag, and rl_secret for its own events).
  BT.learnSecret = function (pc, si) {
    const s = LORE.secrets[si]; if (!pc || !s || BT.secretKnown(pc, s.id)) return false;
    pc.flags['rl_k_' + s.id] = A.S.year; pc.flags.rl_secret = si + 1;
    return true;
  };
  // a secret pc does not yet know the truth of, picked with the engine's dice (engine only)
  BT.pickSecret = function (pc) {
    const open = LORE.secrets.map((s, i) => i).filter(i => !BT.secretKnown(pc, LORE.secrets[i].id));
    return open.length ? A.pick(open) : -1;
  };
  BT.pickCreature = function (pc, test) {
    const open = LORE.creatures.filter(c => test(BT.level(pc, c.id), c));
    return open.length ? A.pick(open) : null;
  };

  // ---- learning hooks (all engine commands)
  // a beast fight: survive it and you have seen one; win it and you know it
  const duelClose = A.duelClose;
  A.duelClose = function () {
    const q = A.S.queue[0], D = q && q.type === 'duel' ? q.d : null, pc = A.pc();
    const r = duelClose.apply(this, arguments);
    try {
      const cid = D && D.b && D.b.beast;
      if (cid && pc && pc.alive && D.result) BT.learn(pc, cid, D.result === 'win' ? 3 : 2, 'Over the carcass you learn the truth of');
    } catch (e) { console.error('belief-truth duel', e); }
    return r;
  };
  // reading: a literate person who studies sometimes finds a bestiary that tells the truth of a beast already heard of
  const wrapAct = (key, after) => {
    const f = A.ACT && A.ACT[key]; if (typeof f !== 'function' || f.bt) return;
    A.ACT[key] = function (pc) { const r = f.apply(this, arguments); try { if (!r || r.ok !== false) after(pc); } catch (e) { console.error('belief-truth ' + key, e); } return r; };
    A.ACT[key].bt = true;
  };
  wrapAct('study', pc => {
    if (!pc.literate || !A.chance(0.3)) return;
    const c = BT.pickCreature(pc, l => l >= 1 && l < 3);
    if (c) BT.learn(pc, c.id, 3, 'In a copied bestiary you read the truth of');
  });
  // exploring: the locals' beasts
  const local = pc => {
    if (!A.chance(0.5)) return;
    const here = A.prov ? A.prov(pc.home) : null, terr = here ? [here.terr, here.coast ? 'coast' : null] : [];
    const c = BT.pickCreature(pc, (l, c) => l === 0 && terrsOf(c).some(t => terr.includes(t)));
    if (c) BT.learn(pc, c.id, 1, 'At a fire on the road, the locals tell of');
  };
  wrapAct('explore', local);
  // an event that names a beast: you have heard of it now
  const choose = A.eventChoose;
  A.eventChoose = function () {
    const q = A.S.queue[0], pc = A.pc();
    try {
      if (q && q.type === 'event' && !q.result && pc) {
        const v = A.eventView(q), txt = String(v && v.text || '').toLowerCase();
        for (const c of LORE.creatures) if (txt.includes(c.name.toLowerCase().replace(/^the /, '')) && BT.level(pc, c.id) === 0) BT.learn(pc, c.id, 1, 'So that is what they call it:');
      }
    } catch (e) { console.error('belief-truth event', e); }
    return choose.apply(this, arguments);
  };
  if (choose.variety) A.eventChoose.variety = true;
  // tavern talk and travellers: about one new beast every three years; and the family's lore passes to an heir
  A.onMonth.push(pc => {
    if (!pc || !pc.alive || !pc.flags) return;
    const S = A.S;
    if (S.btPc !== pc.id) {
      const prev = S.btPc != null ? A.P(S.btPc) : null;
      if (prev && prev.flags) for (const k of Object.keys(prev.flags)) {
        const m = /^bt_([hsk])_(.+)$/.exec(k);
        if (m) { const lvl = m[1] === 'k' ? 'k' : 'h'; const key = 'bt_' + lvl + '_' + m[2]; if (pc.flags[key] == null) pc.flags[key] = S.year; }
        else if (/^rl_k_/.test(k) && pc.flags[k] == null) pc.flags[k] = S.year;
      }
      S.btPc = pc.id;
    }
    if (A.age(pc) >= 6 && A.chance(0.028)) {
      const c = BT.pickCreature(pc, l => l === 0);
      if (c) BT.learn(pc, c.id, 1, A.pick(['A traveller at the well tells of', 'An old soldier swears he once saw', 'The talk in the square is all of']));
    }
  });

  // ---- news from far away: inflated counts, corrected later
  const NUM = /\b\d{1,3}(?:,\d{3})+\b|\b\d{3,}\b/g;
  const toNum = s => +String(s).replace(/,/g, '');
  const round2 = n => { const p = Math.pow(10, Math.max(0, String(Math.round(n)).length - 2)); return Math.round(n / p) * p; };
  const near = text => {
    const pc = A.pc(); if (!pc) return true;
    const mine = new Set([pc.realm, pc.mil && pc.mil.realm].filter(Boolean));
    for (const id of (A.neighbors ? A.neighbors(pc.realm) : [])) mine.add(id);
    for (const w of A.S.wars || []) if (w.att.concat(w.def).some(x => mine.has(x))) for (const x of w.att.concat(w.def)) mine.add(x);
    for (const id of mine) { const R = A.realm(id); if (R && (text.includes(R.short) || text.includes(R.name))) return true; }
    return false;
  };
  BT.rumorOf = function (text, key) {
    const h = hash(key + '|' + text);
    if (h % 100 >= 45) return null;
    let any = false;
    const out = text.replace(NUM, m => { const n = toNum(m); if (n < 100) return m; any = true; const f = 1.6 + ((h >>> 8) % 15) / 10; return 'some ' + A.fmt(round2(n * f)); });
    return any ? out : null;
  };
  let correcting = false;
  const news = A.news;
  A.news = function (text, cls) {
    const r = news.apply(this, arguments);
    try {
      const e = A.S.news[0];
      if (!correcting && e && e.t === text && ['battle', 'war'].includes(cls) && !near(text)) {
        const rumor = BT.rumorOf(text, A.S.year + '|' + A.today());
        if (rumor) {
          // the news list keeps 220 lines, so a busy year can push the rumor out before the truth comes: pending
          // corrections live in their own list, and find their line again by its number if it is still there
          const S = A.S; S.rumorN = (S.rumorN || 0) + 1;
          e.t = rumor; e.truth = text; e.rid = S.rumorN;
          (S.rumors = S.rumors || []).push({ rid: S.rumorN, truth: text, due: A.absDay() + 45 + (hash(text) % 200), c: cls });
          if (S.rumors.length > 120) S.rumors.splice(0, S.rumors.length - 120);
        }
      }
    } catch (err) { console.error('belief-truth news', err); }
    return r;
  };
  A.onMonth.push(() => {
    const S = A.S, now = A.absDay();
    if (!S.rumors || !S.rumors.length) return;
    const due = S.rumors.filter(r => r.due <= now);
    if (!due.length) return;
    S.rumors = S.rumors.filter(r => r.due > now);
    for (const r of due) {
      const e = (S.news || []).find(x => x.rid === r.rid); if (e) e.fixed = S.year;
      correcting = true;
      try { A.news('A truer account reaches you, and the first tale ran high: ' + r.truth, r.c || 'battle'); } finally { correcting = false; }
    }
  });
  BT.newsNote = n => (n && n.truth ? (n.fixed ? ' (the count ran high, as later word showed)' : ' (hearsay)') : '');

  // ---- the codex: the bestiary and the secrets as far as you know them
  const KNOW = ['', 'heard tell', 'seen', 'known'];
  BT.bestiary = function (pc) {
    const counts = [0, 0, 0, 0];
    const lvl = c => BT.level(pc, c.id);
    for (const c of LORE.creatures) counts[lvl(c)]++;
    let h = `<p class="small muted">What you know of beasts comes from somewhere: tales, your own eyes, a book. ` +
      `You have heard tell of ${counts[1] + counts[2] + counts[3]} of the ${LORE.creatures.length} beasts in the old lists, seen ${counts[2] + counts[3]}, and know the truth of ${counts[3]}. ` +
      `Fight one and live, or read in a bestiary, to learn more.</p>`;
    const tierOf = c => GD.BEAST_TIER[c.id] || (/hoax|misunderstanding/i.test(c.cat) ? 'legend' : A.BEASTS[c.id] ? A.beastTier(c.id) : null);
    const groups = [['animal'], ['great'], ['titan'], ['legend'], [null]];
    for (const [tier] of groups) {
      const list = LORE.creatures.filter(c => tierOf(c) === tier && lvl(c) > 0);
      if (!list.length) continue;
      const I = tier && GD.TIER_INFO[tier];
      h += `<div class="group-h">${UI.esc(I ? I.name + 's' : 'Other creatures')}</div>` + (I ? `<p class="tiny muted" style="margin-top:-4px">${UI.esc(I.who)}</p>` : '');
      h += list.map(c => {
        const L = lvl(c);
        let x = `<div class="card beast-c"><b>${UI.esc(c.name)}</b> <span class="tag">${UI.esc(c.cat)}</span> <span class="chip bt-${L}">${UI.esc(KNOW[L])}</span>` +
          (GD.BEAST_FLYER[c.id] && L >= 2 ? ' <span class="chip">flies — needs bows or spears</span>' : '') +
          `<div class="small muted">${UI.esc(c.habitat)}${L >= 2 ? ' · ' + UI.esc(c.size) : ''}</div>` +
          `<div class="small"><b>Folk say:</b> ${UI.esc(c.belief)}</div>`;
        if (L >= 2 && c.behavior) x += `<div class="small"><b>What you saw:</b> ${UI.esc(c.behavior)}</div>`;
        if (L >= 3) x += `<div class="small"><b>The truth:</b> ${UI.esc(c.truth)}</div>` + (c.weak && c.weak !== '–' ? `<div class="small"><b>Weak points:</b> ${UI.esc(c.weak)}</div>` : '');
        else x += `<div class="tiny muted">${L === 1 ? 'Whether any of it is true, you cannot say.' : 'You have not seen it die, and no book you have read tells the rest.'}</div>`;
        return x + '</div>';
      }).join('');
    }
    const hidden = counts[0];
    if (hidden) h += `<p class="small muted">${hidden} more ${hidden === 1 ? 'beast is' : 'beasts are'} in the old lists that no one has told you of.</p>`;
    return h;
  };
  BT.secretsPage = function (pc) {
    const known = LORE.secrets.filter(s => BT.secretKnown(pc, s.id));
    let h = `<p class="small muted">Everyone knows the accepted story. The truth, and the proof of it, you have to find. ` +
      `You know the truth behind ${known.length} of the ${LORE.secrets.length} stories here.</p>`;
    for (const s of LORE.secrets) {
      const k = BT.secretKnown(pc, s.id);
      h += `<div class="card"><b>${UI.esc(s.title)}</b> ${k ? '<span class="chip bt-3">you know the truth</span>' : '<span class="chip bt-1">the accepted story</span>'}` +
        `<div class="small"><b>What is told:</b> ${UI.esc(s.pub)}</div>`;
      if (k) h += `<div class="small"><b>What is true:</b> ${UI.esc(s.truth)}</div>` + (s.who ? `<div class="small muted"><b>Who else knows:</b> ${UI.esc(s.who)}</div>` : '') +
        (s.proof ? `<div class="small muted"><b>The proof:</b> ${UI.esc(s.proof)}</div>` : '') + (s.ifr ? `<div class="small muted"><b>If it came out:</b> ${UI.esc(s.ifr)}</div>` : '');
      h += '</div>';
    }
    return h;
  };
  const codex = UI.TAB.codex;
  UI.TAB.codex = function (pc) {
    const v = UI.codex;
    if (v !== 'beasts' && v !== 'secrets') return codex.apply(this, arguments);
    const full = codex.apply(this, arguments), cut = full.indexOf('</div>');
    const head = cut >= 0 ? full.slice(0, cut + 6) : '';
    return head + (v === 'beasts' ? BT.bestiary(pc) : BT.secretsPage(pc));
  };

  // ---- the Chronicle: the tale as told
  const book = A.chronicleBook;
  if (typeof book === 'function') {
    BT.tale = function (deed, key) {
      const t = String(deed || '').trim(); if (!t) return null;
      const h = hash(key + t);
      let out = t.replace(/\b\d{1,3}(?:,\d{3})+\b|\b\d{2,}\b/g, m => A.fmt(round2(toNum(m) * (2 + (h % 3)))));
      const tags = [', and with half the men', ', and in the rain', ', single-handed, some swear', ', and laughed while doing it', ', though the priests say a god stood beside', ', before breakfast, the story goes'];
      out = out.replace(/[.]?$/, '') + tags[h % tags.length] + '.';
      return out[0].toUpperCase() + out.slice(1);
    };
    A.chronicleBook = function () {
      const lives = book.apply(this, arguments);
      for (const life of lives) {
        const p = A.P(life.who);
        const deeds = (p && p.deeds || []).slice().sort((a, b) => b.y - a.y).slice(0, 3);
        if (deeds.length && p.fame >= 20) life.tales = deeds.map(d => BT.tale(d.t, life.who + '|' + d.y)).filter(Boolean);
      }
      return lives;
    };
    const tab = UI.TAB.book;
    if (typeof tab === 'function') UI.TAB.book = function () {
      let h = tab.apply(this, arguments);
      for (const life of A.chronicleBook()) {
        if (!life.tales || !life.tales.length) continue;
        const sec = `<h4>As the tale is told</h4><p class="tiny muted">What the taverns say of ${UI.esc(life.name)}. The chronicle above is what happened.</p>` +
          life.tales.map(t => `<p class="chron-line"><em>${UI.esc(t)}</em></p>`).join('');
        const marker = `<h3>The Life of ${UI.esc(life.name)}</h3>`, at = h.indexOf(marker);
        if (at < 0) continue;
        const end = h.indexOf('</section>', at);
        if (end > 0) h = h.slice(0, end) + sec + h.slice(end);
      }
      return h;
    };
    const text = A.chronicleText;
    if (typeof text === 'function') A.chronicleText = function () {
      let out = text.apply(this, arguments);
      for (const life of A.chronicleBook()) if (life.tales && life.tales.length) out += `\nAS THE TALE IS TOLD OF ${life.name.toUpperCase()}\n\n` + life.tales.join('\n') + '\n';
      return out;
    };
  }

  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { beliefTruth: true });
})();
