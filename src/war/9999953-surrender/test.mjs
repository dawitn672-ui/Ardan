// Tests for W1-5, "surrender or defeat" (docs/design/war.md §11.3, §11.4, §16; D-064 point 10; D-091 to D-096). See
// README.md. The engine's own tests (the two pans, defeat as a fact, the tempers' lab, a victor who asks everything
// fights longer) are tests/v2/surrender.test.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

// in the page: a war between two free AI realms (no player in it), and ways to tip it
const SETUP = () => {
  window.W5 = {
    free(id, me) { const x = A.realm(id); return x && x.alive && !x.isRebel && !x.playerRun && id !== me && !A.atWar(id).length && x.ruler != null && A.P(x.ruler) && A.realmProvs(id).length >= 3; },
    // two bordering AI realms at peace, the player's realm neither
    pair(me) {
      for (const a of Object.keys(A.S.realms).sort()) {
        if (!W5.free(a, me)) continue;
        const b = A.neighbors(a).find(o => W5.free(o, me) && o !== me);
        if (b) return [a, b];
      }
      return null;
    },
    // a war begun, its hosts counted at their full strength (the first reading of a real war does this within four weeks)
    war(a, b, cb) { const w = A.startWar(a, b, 'The Test War', cb || 'conquest', { noAllies: true, silent: true }); if (w) { A.WAR.init(w); A.WAR.facts(w, 'att'); A.WAR.facts(w, 'def'); } return w; },
    // the defender's land held by the attacker (a share of its provinces, the capital or not) and its host cut down
    beat(w, share, cap, kept) {
      const L = A.realm(w.leadD), provs = A.realmProvs(L.id).slice().sort((x, y) => y.pop - x.pop);
      let n = 0;
      for (const p of provs) { if (p.id === L.capitalProv && !cap) continue; if (n >= Math.ceil(provs.length * share)) break; p.occ = w.leadA; n++; }
      if (cap) { const P = A.prov(L.capitalProv); if (P) P.occ = w.leadA; }
      for (const d of L.forces ? L.forces.divs : []) d.men = Math.round(d.men * kept);
      A.forcesSync(L);
      return n;
    },
    lines: () => (A.S.log || []).flatMap(e => (e && e.lines ? e.lines.map(l => l[0]) : [])),
    temper(rid, traits) { const p = A.P(A.realm(rid).ruler); const was = p.traits; p.traits = traits.slice(); delete p.feel; return () => { p.traits = was; }; },
  };
};

export const limits = { w5TwoCenturies: 2700 };

export default {
  // war.md §16, W1-5's "done when": w.score, A.checkPeace and A.peaceOdds are gone from the build (and the war years and
  // the peace's white roll with them); no source of the game writes or reads a war's score
  async w5NoScore(pg) {
    const SRC = ['src/core/release', 'src/core', 'src/war', 'src/diplomacy', 'src/nobility', 'src/events', 'src/world', 'src/people', 'src/ui'];
    const bad = [];
    const RX = /\bw\.score\b|\bow\.score\b|\.bscore\b|\bA\.checkPeace\b|\bA\.peaceOdds\b|\bA\.warYear\s*=|\bA\.wsScore\b/;
    const seen = new Set();
    const walk = d => {
      if (!fs.existsSync(d)) return;
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
        if (seen.has(p) || !/\.js$/.test(e.name) || /a-v2\.core\.js$/.test(p)) continue;
        seen.add(p);
        // (the old-save converter names the fields it removes)
        fs.readFileSync(p, 'utf8').split('\n').forEach((l, i) => { if (RX.test(l) && !/^\s*\/\//.test(l) && !/delete w\.bscore/.test(l)) bad.push(`${path.relative(ROOT, p)}:${i + 1}`); });
      }
    };
    for (const d of SRC) walk(path.join(ROOT, d));
    const r = await pg.evaluate(() => ({ fresh: (() => { T.enter({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 }); const ids = Object.keys(A.S.realms).filter(id => A.S.realms[id].alive && !A.atWar(id).length); const w = A.startWar(ids[0], ids[1], 'The Test War', 'conquest', { noAllies: true, silent: true }); return w ? !('score' in w) && w.d0 != null : null; })(), check: typeof A.checkPeace, odds: typeof A.peaceOdds, year: typeof A.warYear, front: typeof A.warFront, ws: typeof A.wsScore, war: typeof A.WAR, will: typeof A.WAR.will }));
    const ok = !bad.length && seen.size > 300 && r.fresh === true && r.check === 'undefined' && r.odds === 'undefined' && r.year === 'undefined' && r.front === 'undefined' && r.ws === 'undefined' && r.will === 'function';
    return { ok, detail: `${seen.size} files read; score lines ${bad.length}${bad.length ? ': ' + bad.slice(0, 6).join(', ') : ''}; ${JSON.stringify(r)}` };
  },

  // three worlds of twenty years: every war that ended has its record (surrender or defeat, who yielded, a pathway, the
  // terms, reasons), none carries a score, the record of endings is bounded; pooled, both kinds and several pathways.
  // Readings (seeds 4401 to 4403): 10, 13 and 15 endings, 26 surrenders and 12 defeats, pathways 1, 2, 3, 6, 8 (W1-5);
  // 11, 19 and 14, 29 and 15, pathways 1, 2, 3, 4, 8 (H-085, the peace's border land restored).
  // The bar is 20 endings in all (a world of twenty years with fewer than five wars would read the world, not the rule)
  async w5WarsEnd(pg) {
    const per = [];
    for (const seed of [4401, 4402, 4403]) {
      per.push(await pg.evaluate(seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 18 });
        const ends = [], bad = [];
        const onEnd = (w, res, text, live) => {
          if (!live) return;
          const e = w.end;
          if (!e || typeof e !== 'object' || !['surrender', 'defeat'].includes(e.kind) || !(e.path >= 1 && e.path <= 8) || !Array.isArray(e.terms) || !Array.isArray(e.why) || !e.why.length || !['att', 'def'].includes(e.by)) bad.push(w.name + ' ' + JSON.stringify(e).slice(0, 160));
          if ('score' in w || 'bscore' in w) bad.push(w.name + ' kept a score');
          ends.push({ kind: e && e.kind, path: e && e.path, res, terms: e ? e.terms.map(t => t.k) : [], text: String(text || '').slice(0, 160) });
        };
        A.on('warEnd', onEnd);
        let scored = 0;
        try { T.play(20, { each: () => { for (const w of A.S.wars) if ('score' in w) scored++; } }); } finally { A.HOOKS.warEnd = A.HOOKS.warEnd.filter(f => f !== onEnd); }
        return { seed, ends, bad: bad.slice(0, 4), scored, kept: (A.S.warEnds || []).length, why: (A.S.why || []).filter(x => x.k === 'yield' || x.k === 'terms').length };
      }, seed));
    }
    const all = per.flatMap(x => x.ends), kinds = {}, paths = new Set();
    for (const e of all) { kinds[e.kind] = (kinds[e.kind] || 0) + 1; paths.add(e.path); }
    const bad = per.flatMap(x => x.bad), scored = per.reduce((a, x) => a + x.scored, 0);
    const ok = all.length >= 20 && !bad.length && !scored && per.every(x => x.kept <= 40) && kinds.surrender > 0 && kinds.defeat > 0 && paths.size >= 3 && per.some(x => x.why > 0);
    const ex = all.find(e => e.kind === 'surrender' && e.terms.length > 1) || all[0] || {};
    return { ok, detail: `${per.map(x => `seed ${x.seed}: ${x.ends.length} endings`).join('; ')}; ${JSON.stringify(kinds)}, pathways ${[...paths].sort().join(',')}; bad ${bad.length}${bad.length ? ': ' + bad.join(' | ') : ''}; scored ${scored}; e.g. "${ex.text}"` };
  },

  // the temper bends who asks first (war.md §11.3: a cautious man yields early, while he can bargain; a proud one holds
  // on): the same beaten defender, the same facts, two kings; the pull of his reasons toward asking, read without a die
  async w5Tempers(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const found = T.trySeeds(T.seedRun(5501, 4), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const pr = W5.pair(A.pc().realm);
        return pr ? { seed, pr } : null;
      });
      if (!found.res) return { skip: 'no free pair in ' + found.tried.join(', ') };
      const [a, b] = found.res.pr, w = W5.war(a, b, 'conquest'), WAR = A.WAR, W = A.WHY;
      W5.beat(w, .4, false, .5);
      w.battles.push({ y: A.S.year, name: 'Battle of the Test', win: 'att', lossW: 100, lossL: 900 });
      const k0 = A.rngState, h0 = T.hash(A.S.wars.map(x => x.id));
      const pull = traits => {
        const back = W5.temper(b, traits);
        try {
          const f = WAR.facts(w, 'def', { dry: true }), P = WAR.E.will(f);
          const x = W.E.odds(W.mind(b), [{ id: 'fight', at: a, reasons: P.fight }, { id: 'ask', at: a, reasons: P.ask }], { year: A.S.year, band: WAR.T.yieldBand, at: a });
          return { ask: Math.round(x.ask * 100) / 100, temper: f.temperLabel };
        } finally { back(); }
      };
      const out = { seed: found.seed, cautious: pull(['cautious', 'calm', 'patient']), proud: pull(['proud', 'wrathful', 'stubborn']) };
      out.pure = A.rngState === k0;
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = r.cautious.ask > r.proud.ask + .25 && r.cautious.ask >= .5 && r.pure;
    return { ok, detail: `world ${r.seed}: a beaten defender's pull toward asking, cautious ${r.cautious.ask} (${r.cautious.temper}), proud ${r.proud.ask} (${r.proud.temper}); no draw ${r.pure}` };
  },

  // an AI war to its end: a defender beaten in the field and on his land asks for terms; the envoys ride (the war goes on
  // while they do); the victor names terms; the asker takes them; land changes hands through A.transferProv; the record says
  // who asked, when, by which pathway and why. A defender with no host left and his capital taken is defeated.
  async w5AiEnding(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const found = T.trySeeds(T.seedRun(6601, 6), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 });
        const pr = W5.pair(A.pc().realm);
        return pr ? { seed, pr } : null;
      });
      if (!found.res) return { skip: 'no free pair in ' + found.tried.join(', ') };
      const [a, b] = found.res.pr, WAR = A.WAR, out = { seed: found.seed };
      // 1. surrender: the defender asks (a cautious king, his land half held)
      let w = W5.war(a, b, 'conquest');
      const back = W5.temper(b, ['cautious', 'calm']);
      W5.beat(w, .5, false, .4);
      for (let i = 0; i < 3; i++) w.battles.push({ y: A.S.year, name: 'Battle of Test ' + i, win: 'att', lossW: 100, lossL: 900 });
      let asked = false;
      for (let m = 0; m < 12 && !w.ask && WAR.live(w); m++) { w.quiet = 0; WAR.month(w); }
      asked = !!(w.ask && w.ask.s === 'def');
      out.asked = asked; out.ride = w.ask ? w.ask.due - w.ask.d0 : null;
      const provs0 = A.realmProvs(b).length;
      for (let g = 0; g < 8 && w.ask && WAR.live(w); g++) { w.ask.due = A.absDay(); WAR.day(); }
      back();
      out.ended = !WAR.live(w);
      out.end = w.end && typeof w.end === 'object' ? { kind: w.end.kind, by: w.end.by, path: w.end.path, terms: w.end.terms.map(t => t.k), why: w.end.why.map(x => x[0]).slice(0, 2), signed: w.end.signed.length } : null;
      out.lost = provs0 - A.realmProvs(b).length;
      out.news = (A.S.news.find(n => /The Test War ends/.test(n.t)) || {}).t || '';
      // 2. defeat: a second war, the defender's capital taken and his host gone
      const c = A.neighbors(a).find(o => W5.free(o, A.pc().realm) && o !== b) || A.neighbors(b).find(o => W5.free(o, A.pc().realm) && o !== a);
      if (c) {
        const w2 = W5.war(A.realm(c).id, A.neighbors(c).includes(a) ? a : b, 'insult');
        if (w2) {
          W5.beat(w2, .5, true, .02);
          WAR.month(w2);
          out.defeat = w2.end && typeof w2.end === 'object' ? { kind: w2.end.kind, path: w2.end.path, terms: w2.end.terms.map(t => t.k), why: (w2.end.why[0] || [])[0] } : (WAR.live(w2) ? 'still at war' : 'ended without a record');
        }
      }
      out.ends = (A.S.warEnds || []).length;
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const e = r.end || {}, d = r.defeat || {};
    const ok = r.asked && r.ride >= 2 && r.ended && e.kind === 'surrender' && e.by === 'def' && e.path >= 1 && e.path <= 8 && e.terms.includes('peace') && e.why.length >= 1 && e.signed === 2 &&
      /asks .* for terms/.test(r.news) && !/%/.test(r.news) && (!r.defeat || (d.kind === 'defeat' && [1, 3, 8].includes(d.path)));
    return { ok, detail: `world ${r.seed}: asked ${r.asked} (envoys ${r.ride} days on the road); ended ${r.ended}: ${JSON.stringify(e)}; ${r.lost} provinces passed; "${r.news.slice(0, 200)}"; defeat: ${JSON.stringify(r.defeat)}` };
  },

  // the player who rules a side: the peace table in words (no percentage, no number standing for the odds, a tipped scale,
  // the other crown's reasons), drawn without a die or a change to the world; his envoys ride and come back with an
  // answer; envoys asking him for terms are a card with real choices; a beaten foe's peace is his to dictate. 375 by 667.
  async w5Player(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const out = {};
      const found = T.trySeeds(T.seedRun(7701, 6), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
        const pc = A.pc(), me = pc.realm;
        A.makeRuler(pc, me, true); A.realm(me).playerRun = true;
        for (const w of A.atWar(me).slice()) A.endWar(w, 'white');
        const foe = A.neighbors(me).find(o => W5.free(o, me));
        return foe ? { seed, me, foe } : null;
      });
      if (!found.res) return { skip: 'no free neighbour in ' + found.tried.join(', ') };
      const { me, foe } = found.res, WAR = A.WAR;
      out.seed = found.seed;
      let w = W5.war(me, foe, 'conquest');
      // 1. the peace table: words and a scale, drawn purely
      UI.screen = 'game'; UI.ov = { type: 'peace', id: w.id }; A.S.queue = [];
      const k0 = A.rngState, h0 = T.hash(A.S);
      UI.render();
      const box = document.getElementById('modal') || document.body, txt = box.innerText;
      out.table = /How they would answer/.test(txt) && !!box.querySelector('.peace-scale');
      out.pct = /\d\s?%/.test(txt);
      out.willNum = /willingness/i.test(txt);
      out.pure = A.rngState === k0 && T.hash(A.S) === h0;
      UI.ov = null; UI.render();
      // 2. his envoys ride (asking peace with nothing changing hands) and come back
      const sent = A.peaceOffer(w.id, []);
      out.sent = sent.ok && /ride/.test(sent.msg);
      out.twice = A.peaceOffer(w.id, []).ok === false;
      w.ask.due = A.absDay(); WAR.day();
      out.back = W5.lines().slice(-4).some(l => /Your envoys come back/.test(l));
      // 3. the foe asks him for terms: a card, with his cause's terms and everything he holds
      if (!WAR.live(w)) w = W5.war(me, foe, 'conquest');
      w.ask = null; w.quiet = 0;
      W5.beat(w, .5, false, .5);
      WAR.ask(w, 'def', null, null, { path: 1, why: [['Battles lost', 1, 'reckoning', null, 1]] });
      w.ask.due = A.absDay(); WAR.day();
      const card = A.S.queue.find(q => q && q.warCard);
      out.card = card ? { title: card.title, n: card.options.length, opts: card.options.map(o => o.t.slice(0, 60)), pct: /%/.test(card.text + card.options.map(o => o.t).join(' ')) } : null;
      if (card) {
        A.S.queue = [card].concat(A.S.queue.filter(q => q !== card));
        UI.render();
        const btns = [...document.querySelectorAll('#modal button, .modal button')].filter(b => b.offsetParent);
        out.small = btns.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44; }).length;
        out.wide = document.documentElement.scrollWidth > 376;
        const provs0 = A.realmProvs(foe).length;
        A.choiceChoose(0);   // grant the terms of his cause
        for (let g = 0; g < 4 && w.ask && WAR.live(w); g++) { if (w.ask.leg === 'player') break; w.ask.due = A.absDay(); WAR.day(); }
        out.ended = !WAR.live(w);
        out.end = w.end && typeof w.end === 'object' ? { kind: w.end.kind, by: w.end.by, terms: w.end.terms.map(t => t.k) } : null;
        out.lost = provs0 - A.realmProvs(foe).length;
      }
      // 4. a beaten foe: his peace to dictate
      const foe2 = A.neighbors(me).find(o => W5.free(o, me));
      if (foe2) {
        const w2 = W5.war(me, foe2, 'conquest');
        A.S.queue = [];
        W5.beat(w2, .5, true, .02);
        WAR.month(w2);
        const c2 = A.S.queue.find(q => q && q.warCard);
        out.defeatCard = c2 ? c2.options.map(o => o.t.slice(0, 50)) : null;
        if (c2) { A.S.queue = [c2]; A.choiceChoose(1); out.defeat = w2.end && typeof w2.end === 'object' ? { kind: w2.end.kind, terms: w2.end.terms.map(t => t.k) } : null; }
      }
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const c = r.card || {};
    const ok = r.table && !r.pct && !r.willNum && r.pure && r.sent && r.twice && r.back && c.n >= 2 && !c.pct && /asks for terms/.test(c.title) && !r.small && !r.wide &&
      r.ended && r.end && r.end.kind === 'surrender' && r.end.by === 'def' && (!r.defeatCard || (r.defeat && r.defeat.kind === 'defeat'));
    return { ok, detail: `world ${r.seed}: table in words ${r.table}, a percentage ${r.pct}, a willingness number ${r.willNum}, drawn purely ${r.pure}; envoys ${r.sent}, a second refused ${r.twice}, came back ${r.back}; the card ${JSON.stringify(r.card)}, small buttons ${r.small}, too wide ${r.wide}; ended ${r.ended} ${JSON.stringify(r.end)}, ${r.lost} provinces; a beaten foe: ${JSON.stringify(r.defeatCard)} -> ${JSON.stringify(r.defeat)}` };
  },

  // news by rank (war.md §12.4): the ruler's council hears why its crown asks for terms; a commoner of the realm does not;
  // everyone in the war hears the peace
  async w5NewsByRank(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const found = T.trySeeds(T.seedRun(8801, 6), seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 25 });
        const me = A.pc().realm, R = A.realm(me);
        if (!R || R.playerRun) return null;
        for (const w of A.atWar(me).slice()) A.endWar(w, 'white');
        const foe = A.neighbors(me).find(o => W5.free(o, me));
        return foe ? { seed, me, foe } : null;
      });
      if (!found.res) return { skip: 'no free neighbour in ' + found.tried.join(', ') };
      const { me, foe } = found.res, WAR = A.WAR, pc = A.pc(), R = A.realm(me), out = { seed: found.seed };
      const run = asCouncil => {
        const w = W5.war(foe, me, 'conquest'), back = W5.temper(me, ['cautious', 'calm']);
        W5.beat(w, .5, false, .3);
        const seat = Object.keys(R.council || {})[0], was = seat ? R.council[seat] : null;
        if (asCouncil && seat) R.council[seat] = pc.id;
        const n0 = W5.lines().length;
        const rec = WAR.yieldQ(w, 'def', null, { log: false });
        back();
        WAR.ask(w, 'def', rec, null);
        const said = W5.lines().slice(n0).join(' | ');
        if (asCouncil && seat) R.council[seat] = was;
        A.settleWar(w, 'att');
        const end = W5.lines().slice(n0).join(' | ');
        return { said, end };
      };
      out.council = run(true);
      out.subject = run(false);
      return out;
    }).toString() + ')()');
    if (r.skip) return { ok: true, skip: r.skip };
    const ok = /sends envoys to .* to ask for terms\. Because: /.test(r.council.said) && !/sends envoys/.test(r.subject.said) && /Test War ends/.test(r.subject.end) && !/%/.test(r.council.said + r.council.end);
    return { ok, detail: `world ${r.seed}: council heard "${r.council.said.slice(0, 220)}"; a commoner heard "${r.subject.said.slice(0, 120)}", then "${r.subject.end.slice(0, 160)}"` };
  },

  // every sample save loads: a war in progress goes on, its score dropped; a year later every war that ended has its record
  async w5OldSaves(pg) {
    const list = fs.existsSync(SAVES) ? fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort() : [];
    const res = [];
    for (const f of list) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      res.push(await pg.evaluate(async ([b64, f]) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try {
          const d = await SAVES.decode(bytes);
          UI.enterSaveSafe(d);
          const wars = A.S.wars.length, scored = A.S.wars.filter(w => 'score' in w || 'bscore' in w).length, bad = [];
          let ended = 0;
          const on = (w, res, text, live) => { if (!live) return; ended++; if (!w.end || typeof w.end !== 'object' || !w.end.kind) bad.push(w.name); };
          A.on('warEnd', on);
          try { T.play(1); } finally { A.HOOKS.warEnd = (A.HOOKS.warEnd || []).filter(x => x !== on); }
          return { f, ok: !scored && !bad.length, wars, scored, ended, bad };
        } catch (e) { return { f, ok: false, err: String(e.message || e).slice(0, 160) }; }
      }, [b64, f]));
    }
    const ok = res.length > 5 && res.every(x => x.ok) && res.some(x => x.wars > 0);
    return { ok, detail: res.map(x => `${x.f}: ${x.ok ? 'ok' : 'FAILED ' + JSON.stringify(x)} (${x.wars} wars in progress, ${x.ended} ended in a year)`).join('; ') };
  },

  // the same seed and the same choices give the same endings
  async w5Deterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 3030, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
        T.play(8);
        return JSON.stringify([(A.S.warEnds || []).map(e => [e.id, e.kind, e.by, e.path, e.asked, e.terms.map(t => t.k)]), A.rngState]);
      };
      const a = run(), b = run();
      return { same: a === b, n: JSON.parse(a)[0].length };
    });
    return { ok: r.same && r.n > 0, detail: JSON.stringify(r) };
  },

  // war.md §11.4 over two centuries (long tier): on four worlds every war that ended has its record, by surrender or
  // defeat with a pathway and reasons, never a score; endings by every road but conquest's rarity; war lengths read
  async w5TwoCenturies(pg) {
    const per = [];
    for (const seed of [11, 23, 42, 7]) {
      per.push(await pg.evaluate(seed => {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 18 });
        const out = { seed, n: 0, bad: 0, scored: 0, kinds: {}, paths: {}, years: 0 };
        const sd = {}, months = [];
        const onStart = w => { sd[w.id] = A.absDay(); };
        const onEnd = (w, res, text, live) => {
          if (!live) return;
          const e = w.end; out.n++;
          if (!e || typeof e !== 'object' || !['surrender', 'defeat'].includes(e.kind) || !(e.path >= 1 && e.path <= 8) || !e.why || !e.why.length) out.bad++;
          else { out.kinds[e.kind] = (out.kinds[e.kind] || 0) + 1; out.paths[e.path] = (out.paths[e.path] || 0) + 1; }
          if (sd[w.id] != null) months.push(Math.round((A.absDay() - sd[w.id]) / 30.4));
        };
        A.on('warStart', onStart); A.on('warEnd', onEnd);
        const y0 = A.S.year;
        for (let k = 0; k < 400 && A.S.year < y0 + 200; k++) {
          const st = T.play(Math.min(10, y0 + 200 - A.S.year), { each: () => { for (const w of A.S.wars) if ('score' in w) out.scored++; } });
          if (st === 'dead' || !A.pc() || !A.pc().alive) {
            const kid = Object.values(A.S.people).find(p => p.alive && p.id !== A.S.pc && A.isAdult(p) && !p.ruler);
            if (!kid) break;
            A.S.pc = kid.id;
          }
        }
        A.HOOKS.warStart = A.HOOKS.warStart.filter(f => f !== onStart); A.HOOKS.warEnd = A.HOOKS.warEnd.filter(f => f !== onEnd);
        out.years = A.S.year - y0;
        months.sort((a, b) => a - b);
        out.med = months[Math.floor(months.length / 2)];
        out.p90 = months[Math.floor(months.length * .9)];
        out.open = A.S.wars.length;
        return out;
      }, seed));
    }
    const n = per.reduce((a, x) => a + x.n, 0), bad = per.reduce((a, x) => a + x.bad, 0), scored = per.reduce((a, x) => a + x.scored, 0);
    // H-082 pooled: more wars end in a surrender than a defeat over the worlds together, not in each one (CI after the power
    // scale, 4df64284: seed 11 read 39 to 39, seed 23 40 to 45, seeds 42 and 7 50 to 38 and 57 to 46; pooled 186 to 168)
    const sur = per.reduce((a, x) => a + (x.kinds.surrender || 0), 0), def = per.reduce((a, x) => a + (x.kinds.defeat || 0), 0);
    const ok = per.every(x => x.years >= 150 && x.n >= 30) && !bad && !scored && sur > def;
    return { ok, detail: per.map(x => `seed ${x.seed}: ${x.years} years, ${x.n} endings ${JSON.stringify(x.kinds)}, pathways ${JSON.stringify(x.paths)}, months median ${x.med} p90 ${x.p90}, ${x.open} open`).join('; ') + `; without a record ${bad}, scored ${scored} (of ${n})` };
  },
};
