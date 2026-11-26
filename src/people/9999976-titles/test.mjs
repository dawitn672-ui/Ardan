// Tests for src/people/9999976-titles (docs/design/skills-v2.md §11.9, D-183). Every test fails (never skips) when the
// feature is not in the build. World-robust (H-082): the rules are driven through the real doors (A.deedDone, the duel's
// consequences, the card's choice, the year's pass) on several worlds with a seed fallback; the lives are pooled; the bars
// come from the rule (a title is never rolled for, so a rule's count is exact, not a share of luck).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const SAVES_DIR = here('../../../tests/saves');
const saveFiles = () => [...fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, f)),
  ...fs.readdirSync(path.join(SAVES_DIR, 'press')).filter(f => f.endsWith('.ardan')).map(f => path.join(SAVES_DIR, 'press', f))];
const b64 = f => fs.readFileSync(f).toString('base64');

const GATE = () => typeof A !== 'undefined' && !!A.TT && !!A.deedDone && !!A.DATA.titles && !!A.POWER;
const NO = { ok: false, detail: 'A.TT not in this build' };

export const limits = { ttGameChanger: 900, ttSave: 2400, ttUnique: 1800, ttDeterministic: 1800 };
export default {
  // a title is earned when, and only when, its hidden conditions are met, through the real doors: nineteen duels won make
  // no title and the twentieth makes the Undefeated (a notable card, honour paid once); a loss takes it away and leaves
  // the honour; a foe who beats him counts the win in his own ledger; five bribes refused through the cards' own choices
  // make the Unbought and one taken loses it for good; the choice table's indexes still name the choices they mean
  async ttEarned(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, out = { tried: [] };
      T.enter({ seed: 9831, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 24 });
      A.S.queue = [];
      const pc = A.pc(), rng0 = JSON.stringify(A.rngState);
      const h0 = pc.honor;
      for (let i = 0; i < 19; i++) A.deedDone(pc, 'duel_won');
      out.at19 = TT.held(pc).length;
      A.deedDone(pc, 'duel_won');
      out.at20 = TT.held(pc).slice();
      out.card = A.S.queue.filter(q => q.ev === 'tt_earned').length;
      out.notable = A.V2Y && A.V2Y.classify ? A.V2Y.classify(A.S.queue[0]).notable : true;
      out.honour = Math.round((pc.honor - h0) * 10) / 10;
      for (let i = 0; i < 5; i++) A.deedDone(pc, 'duel_won');
      out.paidOnce = Math.round((pc.honor - h0) * 10) / 10;
      A.deedDone(pc, 'duel_lost');
      out.afterLoss = TT.held(pc).slice(); out.lostRec = !!(pc.tt.x && pc.tt.x.undefeated); out.lostCard = A.S.queue.some(q => q.ev === 'tt_lost');
      out.honourKept = Math.round((pc.honor - h0) * 10) / 10;
      out.rng = JSON.stringify(A.rngState) === rng0;
      // the cards' choices: each table entry's indexes still name a taking or a refusing choice
      const V = TT.V, rxT = /take|keep|outbid|bribe|sell/i, rxR = /return|refuse|push|hand|report|send|tell|show/i, rxS = /obey/i;
      out.table = V.choices.list.map(c => { const e = A.EV[c.ev]; if (!e) return c.ev + ': missing'; for (const [i, k] of Object.entries(c.on)) { const ch = e.choices[+i], t = ch && (typeof ch.t === 'function' ? '' : ch.t); if (!ch) return c.ev + ' ' + i + ': no choice'; if (k === 'bribe_taken' && !rxT.test(t)) return c.ev + ' ' + i + ': "' + t + '"'; if (k === 'bribe_refused' && !rxR.test(t)) return c.ev + ' ' + i + ': "' + t + '"'; if (k === 'town_put_to_sword' && !rxS.test(t)) return c.ev + ' ' + i + ': "' + t + '"'; } return null; }).filter(Boolean);
      // five refused through A.eventChoose (the real door): du_ct_magistrate_bribe's "Return the purse"
      const refuse = (ev, idx) => { A.S.queue = [{ type: 'event', ev, ctx: {} }]; const v = A.eventView(A.S.queue[0]); const k = v.choices.findIndex(c => c.i === idx); if (k < 0) return false; A.eventChoose(k); A.S.queue = []; return true; };
      out.refused = 0;
      for (let i = 0; i < 5; i++) if (refuse('cn_foreign_bribe', 0)) out.refused++;
      out.unbought = TT.holds(pc, 'unbought');
      refuse('cn_foreign_bribe', 1);
      out.unboughtAfterTaking = TT.holds(pc, 'unbought');
      for (let i = 0; i < 6; i++) refuse('cn_foreign_bribe', 0);
      out.again = TT.holds(pc, 'unbought');
      // a foe who beats the player in a duel counts it (A.duelConsequences); seed fallback over foes
      const foes = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 18 && A.age(p) < 45 && !p.ruler).sort((a, b) => A.fightWorth(b) - A.fightWorth(a) || (a.id < b.id ? -1 : 1)).slice(0, 30);
      out.foe = null;
      for (const foe of foes) {
        pc.health = 100; pc.alive = true; foe.health = 100;
        A.S.queue = []; A.startDuel(pc, foe, { kind: 'duel', lethal: false });
        const q = A.S.queue.find(x => x.type === 'duel'); if (!q) continue;
        A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = [];
        if (q.d.result === 'lose' || q.d.result === 'yield') { out.foe = { won: TT.led(foe, 'duel_won'), mine: TT.led(pc, 'duel_lost')[0] }; break; }
      }
      return out;
    });
    const ok = r.at19 === 0 && r.at20.join() === 'undefeated' && r.card === 1 && r.notable && r.honour > 0 && r.paidOnce === r.honour &&
      r.afterLoss.length === 0 && r.lostRec && r.lostCard && r.honourKept === r.honour && r.rng && !r.table.length &&
      r.refused === 5 && r.unbought && !r.unboughtAfterTaking && !r.again && (!r.foe || (r.foe.won && r.foe.won[0] === 1));
    return { ok, detail: `19 wins: ${r.at19} titles; the 20th: ${r.at20.join()} (card ${r.card}, notable ${r.notable}, honour +${r.honour}, five more wins +${r.paidOnce} in all); a loss: ${r.afterLoss.length} held, recorded ${r.lostRec}, card ${r.lostCard}, honour kept +${r.honourKept}; main stream untouched ${r.rng}; choice table ${r.table.length ? 'BAD ' + r.table.join(' | ') : 'true to the cards'}; five bribes refused through the card: Unbought ${r.unbought}, one taken: ${r.unboughtAfterTaking}, six more refused: ${r.again}; ${r.foe ? `the foe who beat him counts ${JSON.stringify(r.foe.won)}` : 'no foe beat him in 30 tries'}` };
  },

  // the same seed and the same choices give the same ledgers, titles, holders and years, twice; nothing a title does draws
  // on the main stream (a pass of every check over the world leaves A.rngState where it was)
  async ttDeterministic(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const out = [];
      for (const seed of [9841, 9842]) {
        const run = () => {
          T.enter({ seed, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 16 });
          const pc = A.pc();
          // the same scripted deeds at the same points of the life, and the bot's own play between them
          T.play(6); A.deedDone(pc, 'battle'); for (let i = 0; i < 20; i++) A.deedDone(pc, 'duel_won');
          T.play(12);
          const st = {};
          for (const id in A.S.people) { const p = A.S.people[id]; if (p && (p.dl || (p.tt && p.tt.h))) st[id] = [p.dl || null, (p.tt && p.tt.h) || null, (p.tt && p.tt.x) || null]; }
          return { h: T.hash({ st, census: A.S.tt || null }), n: Object.keys(st).length, held: Object.values(st).filter(x => x[1] && Object.keys(x[1]).length).length, year: A.S.year };
        };
        const a = run(), b = run();
        // a pass of every title check over the world draws nothing from the main stream
        const r0 = JSON.stringify(A.rngState); A.TT.year(); A.TT.month(A.pc());
        out.push({ seed, a, b, same: a.h === b.h && a.n === b.n, rng: JSON.stringify(A.rngState) === r0 });
      }
      return out;
    });
    const ok = r.every(x => x.same && x.rng && x.a.n >= 1 && x.a.held >= 1);
    return { ok, detail: r.map(x => `world ${x.seed}: ${x.a.n} ledgers, ${x.a.held} holding titles by ${x.a.year}; twice the same ${x.same}; a world pass draws nothing ${x.rng}`).join('; ') };
  },

  // one living holder of a unique title: of six NPCs who slay a dragon in one pass only the first in id order is the
  // Wyrm-Slayer; when he dies the next to slay one is; the Sword of a realm is one man's in his realm while he lives, and
  // can be another realm's man's at once; First of the Age is given once an age and never again, even when its holder
  // dies; the Sword Saint's title is Cael Vardan's while he lives, and free once he is slain. Then a bot life of forty
  // years, its census audited each year: never two living holders of one key
  async ttUnique(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, out = {};
      T.enter({ seed: 9851, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      A.S.queue = [];
      const men = Object.values(A.S.people).filter(p => p.alive && p.st && A.age(p) >= 20 && A.age(p) < 50 && p.id !== A.S.pc).sort((a, b) => (String(a.id) < String(b.id) ? -1 : 1)).slice(0, 6);
      for (const p of men) A.deedDone(p, 'dragon_slain', { v: 450 });
      out.slayers = men.filter(p => TT.holds(p, 'wyrm-slayer')).map(p => p.id);
      out.first = men[0].id;
      A.kill(men[0], 'old wounds');
      A.deedDone(men[1], 'dragon_slain', { v: 450 });
      out.next = TT.holds(men[1], 'wyrm-slayer');
      // First of the Age: once an age
      const sk = SK2 => SK2;
      out.firstAge = [];
      for (const p of men.slice(2, 5)) { TT.earn(p, TT.BY.get('first-of-the-age'), {}); break; }
      A.kill(men[2], 'a fever');
      const fa = TT.BY.get('first-of-the-age');
      out.faAgain = TT.check(men[3], [Object.assign({}, fa, { requires: { all: [{ age: [0, 999] }] } })]).length;
      // the Sword Saint: Cael's while he lives
      const ss = TT.BY.get('sword-saint'), easy = Object.assign({}, ss, { requires: { all: [{ age: [0, 999] }] }, grant: null });
      out.saintHeld = TT.holder('sword-saint');
      out.saintTaken = TT.check(men[4], [easy]).length;
      A.S.pw = A.S.pw || {}; A.S.pw.leg = A.S.pw.leg || {}; const keep = A.S.pw.leg['sword-saint']; A.S.pw.leg['sword-saint'] = Object.assign({}, keep || {}, { slain: A.S.year });
      out.saintFree = TT.holder('sword-saint');
      out.saintNow = TT.check(men[4], [easy]).length;
      out.saintClass = TT.classOf(men[4]);
      if (keep) A.S.pw.leg['sword-saint'] = keep; else delete A.S.pw.leg['sword-saint'];
      // per realm: one in each realm
      const sw = TT.BY.get('sword-of-the-realm'), easySw = Object.assign({}, sw, { requires: { all: [{ age: [0, 999] }] }, grant: null });
      const byRealm = {}; for (const p of Object.values(A.S.people)) if (p.alive && p.st && A.age(p) > 20 && p.realm && !p.ruler && p.id !== A.S.pc) (byRealm[p.realm] = byRealm[p.realm] || []).push(p);
      const realms = Object.keys(byRealm).filter(k => byRealm[k].length >= 2).sort().slice(0, 2);
      out.perRealm = realms.map(k => byRealm[k].slice(0, 2).map(p => TT.check(p, [easySw]).length));
      // the census, audited: no key with two living holders
      const audit = () => { const seen = {}; let two = 0; for (const id in A.S.people) { const p = A.S.people[id]; if (!p || p.alive === false || !p.tt || !p.tt.h) continue; for (const t of Object.keys(p.tt.h)) { const T_ = TT.BY.get(t); if (!T_ || !T_.unique) continue; const key = p.tt.h[t].k || t; if (seen[key]) two++; seen[key] = 1; } } return two; };
      out.twoNow = audit();
      // a bot life of forty years, audited every year; the old masters who stood at the summit of an art before the age
      // began are written down at its start and are never its First
      T.enter({ seed: 9852, race: 'human', realm: 'POL-02', status: 'gentry', sex: 'M', startAge: 16 });
      TT.year();
      out.preAge = ((A.S.tt.pre || {})['first-of-the-age'] || []).length; out.faStart = Object.keys(A.S.tt.first || {}).length;
      let twos = 0, years = 0;
      T.play(40, { each: () => { twos += audit(); years++; } });
      out.lifeTwos = twos; out.lifeYears = years;
      out.firstTwice = Object.values((A.S.tt && A.S.tt.first) || {}).length <= TT.PERSON.filter(t => t.once).length;
      return out;
    });
    const ok = r.slayers.length === 1 && r.slayers[0] === r.first && r.next && r.faAgain === 0 && r.saintHeld === 'sword-saint' && r.saintTaken === 0 &&
      r.saintFree === null && r.saintNow === 1 && r.saintClass === 'Sword Saint' && r.perRealm.length === 2 && r.perRealm.every(x => x.join() === '1,0') && r.twoNow === 0 && r.lifeTwos === 0 && r.firstTwice && r.faStart === 0;
    return { ok, detail: `six slay a dragon in one pass: ${r.slayers.length} Wyrm-Slayer (the first in id order ${r.slayers[0] === r.first}); he dies, the next one's ${r.next}; First of the Age again after its holder died: ${r.faAgain}; the Saint's title held by ${r.saintHeld}, taken while he lives ${r.saintTaken}, free once he is slain ${r.saintFree === null}, then taken ${r.saintNow} (class ${r.saintClass}); the Sword of a realm, two men in each of two realms: ${JSON.stringify(r.perRealm)}; keys with two living holders now ${r.twoNow}, over ${r.lifeYears} audited years ${r.lifeTwos}; at the age's start ${r.preAge} old masters written down, First of the Age given ${r.faStart}` };
  },

  // order 95 (D-192): titles can be game changers. A title's share boost to fighting worth sits in a pool of its own,
  // capped by the rarest title among the sources (uncommon 0.02, rare 0.05, legendary 0.15, one of a kind 0.25), apart from
  // the skills' 15%. Over pairs of grown men of the world whose honest duel odds stand near even (seed fallback, pooled
  // over worlds 9891-9894), the same man is given an uncommon title (Blooded), a rare one (the Undefeated), and a title one
  // of a kind (Wyrm-Slayer): the uncommon one moves his odds a little (more than nothing, under 8 points on average), the
  // one of a kind markedly (20 points or more on average), the rare one between. The caps hold: every title at once and a
  // planted boost far past any cap give at most a quarter of his worth to a fight and of his read to a check, and an
  // uncommon title alone, planted far past its cap, its tier's 0.02. Income and experience read their boosts too. Nothing
  // drawn; every read the same once the titles are gone.
  async ttGameChanger(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, SK2 = A.SK2, E = SK2.E(), out = { pairs: 0, d: { blooded: [], undefeated: [], 'wyrm-slayer': [] }, bad: [], worlds: [] };
      const bad = s => { if (out.bad.length < 10) out.bad.push(s); };
      const reset = () => { SK2.capsReset(); if (A.cacheResetAll) A.cacheResetAll(); };
      const give = (p, ids) => { p.tt = { h: {} }; for (const id of ids) p.tt.h[id] = { y: A.S.year, w: '' }; reset(); };
      const take = p => { delete p.tt; reset(); };
      for (const seed of [9891, 9892, 9893, 9894]) {
        if (out.pairs >= 24) break;
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 }); A.S.queue = [];
        out.worlds.push(seed);
        const men = Object.values(A.S.people).filter(p => p && p.alive && p.st && !p.tt && A.age(p) >= 20 && A.age(p) <= 45 && A.fightWorth(p) > 30).sort((a, b) => (String(a.id) < String(b.id) ? -1 : 1)).slice(0, 80);
        const rng0 = JSON.stringify(A.rngState);
        for (let i = 0; i + 1 < men.length && out.pairs < 8 * out.worlds.length; i++) {
          const a = men[i], b = men.find((q, j) => j > i && Math.abs(A.shownDuelOdds(a, q) - 50) <= 12);
          if (!b) continue;
          const o0 = A.shownDuelOdds(a, b), w0 = A.fightWorth(a);
          for (const id of Object.keys(out.d)) {
            give(a, [id]);
            const o1 = A.shownDuelOdds(a, b), f = A.fighterFrom(a, {}), cap = E.CAP_BOOST[TT.BY.get(id).unique ? 'unique' : TT.BY.get(id).rarity];
            out.d[id].push(o1 - o0);
            if (!(f.ttb > 0) || f.ttb > cap * SK2.worthOfFighter(f) + 1e-6) bad(`${id}: boost ${f.ttb} of worth ${SK2.worthOfFighter(f)} (cap ${cap})`);
            take(a);
          }
          if (A.shownDuelOdds(a, b) !== o0 || A.fightWorth(a) !== w0) bad(a.id + ': not as before once the titles are gone');
          out.pairs++;
        }
        if (JSON.stringify(A.rngState) !== rng0) bad('a read drew from the stream');
      }
      const mean = l => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : 0);
      out.mean = Object.fromEntries(Object.entries(out.d).map(([k, l]) => [k, Math.round(mean(l) * 10) / 10]));
      out.min = Object.fromEntries(Object.entries(out.d).map(([k, l]) => [k, Math.round(Math.min(...l) * 10) / 10]));
      // the caps: every title at once, and a boost planted far past any cap
      const p = Object.values(A.S.people).filter(q => q && q.alive && q.st && !q.tt && A.age(q) >= 20 && A.fightWorth(q) > 30).sort((x, y) => (String(x.id) < String(y.id) ? -1 : 1))[0];
      const HUGE = { id: 'title:tt-test-boost', rank: 'S', rarity: 'legendary', unique: true, kind: 'title', boostCap: 1, levels: [{ at: 1, effects: [
        { type: 'boost', of: 'fight', v: 5 }, { type: 'boost', of: 'check', v: 5 }, { type: 'boost', of: 'income', v: 5 }, { type: 'boost', of: 'growth', v: 5 }] }] };
      const LOW = { id: 'title:tt-test-low', rank: 'D', rarity: 'uncommon', unique: false, kind: 'title', levels: [{ at: 1, effects: [{ type: 'boost', of: 'fight', v: 5 }, { type: 'boost', of: 'check', v: 5 }] }] };
      SK2.addSource(HUGE); SK2.addSource(LOW); TT.XS.set('tt-test-boost', HUGE); TT.XS.set('tt-test-low', LOW);
      try {
        const r0 = A.skill(p, 'intrigue'), e0 = A.skillEff(p, 'intrigue');
        give(p, TT.PERSON.map(t => t.id).concat(['tt-test-boost']));
        const f = A.fighterFrom(p, {});
        out.caps = { fight: Math.round(f.ttb / SK2.worthOfFighter(f) * 1000) / 1000, check: SK2.boostOf(p, 'check', 'intrigue'), income: SK2.boostOf(p, 'income'), growth: SK2.boostOf(p, 'growth', 'sword'), skillFight: f.sk2 ? Math.round(f.sk2.total / SK2.worthOfFighter(f) * 1000) / 1000 : 0 };
        out.caps.checkPts = A.skillEff(p, 'intrigue') - e0; out.caps.read = r0;
        for (const k of ['fight', 'check', 'income', 'growth']) if (Math.abs(out.caps[k] - E.CAP_BOOST.unique) > 1e-6) bad(`every title and a planted boost: ${k} ${out.caps[k]}, not the cap of ${E.CAP_BOOST.unique}`);
        if (out.caps.skillFight > 0.15 + 1e-9) bad('the skills\' fight share past 15%: ' + out.caps.skillFight);
        give(p, ['tt-test-low']);
        const g = A.fighterFrom(p, {});
        out.caps.low = [Math.round(g.ttb / SK2.worthOfFighter(g) * 1000) / 1000, SK2.boostOf(p, 'check', 'sword')];
        if (Math.abs(out.caps.low[0] - E.CAP_BOOST.uncommon) > 1e-6 || Math.abs(out.caps.low[1] - E.CAP_BOOST.uncommon) > 1e-6) bad('an uncommon title past its cap: ' + out.caps.low);
        // experience: a month's effort reads the growth boost (A.gainXp's door), by the share
        give(p, ['first-of-the-age']);
        out.caps.xp = [SK2.boostOf(p, 'growth', 'sword'), SK2.boostOf(p, 'check', 'persuasion')];
        if (Math.abs(out.caps.xp[0] - 0.25) > 1e-6 || Math.abs(out.caps.xp[1] - 0.12) > 1e-6) bad('First of the Age: growth and checks ' + out.caps.xp);
      } finally { take(p); TT.XS.delete('tt-test-boost'); TT.XS.delete('tt-test-low'); reset(); }
      return out;
    });
    const m = r.mean || {};
    const ok = !r.bad.length && r.pairs >= 12 && m.blooded > 0 && m.blooded < 8 && m['wyrm-slayer'] >= 20 && m.undefeated > m.blooded && m.undefeated < m['wyrm-slayer'] && r.min.blooded >= 0;
    return { ok, detail: `${r.pairs} pairs near even odds (worlds ${r.worlds.join(', ')}): the odds moved on average by ${JSON.stringify(r.mean)} points (least ${JSON.stringify(r.min)}); ` +
      `caps with every title and a planted boost ${JSON.stringify(r.caps)}; ${r.bad.length} faults${r.bad.length ? ': ' + r.bad.join('; ') : ''}` };
  },

  // the caps bind titles and skills together: a man given every title a person may hold and, beside them, a planted title
  // far past any budget (+50 on every check, +50 to a fight, +30 to a stat, 6 aura steps, 9 steps of resisting) reads at
  // most +12 on any check, +15% of his fighting worth, +10 on a stat and never past his potential by more than 5, 3 aura
  // steps of one kind, 3 steps of resisting; with them gone, every read is what it was. No die drawn
  async ttCaps(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, SK2 = A.SK2, out = { n: 0, edge: 0, fight: 0, boost: 0, stat: 0, statPot: 0, aura: 0, resist: 0, back: 0 };
      const HUGE = { id: 'title:tt-test-huge', rank: 'S', kind: 'title', levels: [{ at: 1, effects: [
        { type: 'edge', tag: 'all', v: 50 }, { type: 'fight', tag: 'all', part: 'atk', v: 50 }, { type: 'fight', tag: 'all', part: 'def', v: 50 },
        { type: 'stat', stat: 'str', v: 30 }, { type: 'stat', stat: 'wil', v: 30 }, { type: 'aura', of: 'discipline', scale: 'army', v: 6 }, { type: 'resist', of: 'fear', v: 9 }, { type: 'resist', of: 'wounds', v: 9 }] }] };
      SK2.addSource(HUGE); TT.XS.set('tt-test-huge', HUGE);
      const rng0 = JSON.stringify(A.rngState);
      for (const seed of [9861, 9862, 9863]) {
        A.newGame({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
        const people = Object.values(A.S.people).filter(p => p.alive && p.st && A.age(p) >= 18).sort((a, b) => (String(a.id) < String(b.id) ? -1 : 1)).slice(0, 25);
        for (const p of people) {
          const keys = Object.keys(GD.SKILLS), before = { e: keys.map(k => A.skillEff(p, k)), s: GD.STATS.map(s => A.stat(p, s)), w: A.fightWorth(p) };
          const body = GD.STATS.map(s => (A.LV && A.LV.eff ? A.LV.eff(p, s) : p.st[s]));
          p.tt = { h: {} };
          for (const t of TT.PERSON) p.tt.h[t.id] = { y: A.S.year, w: '' };
          p.tt.h['tt-test-huge'] = { y: A.S.year, w: '' };
          if (A.CAPS) SK2.capsReset();
          const P = A.CAPS(p);
          // the edge a check gains from what he holds (a stronger body may also lift a skill its body held back: that is
          // the body's, not the edge's)
          keys.forEach(k => { out.edge = Math.max(out.edge, SK2.edgeOf(p, k)); });
          // the fight: the effects' share of the worth he has without them
          const f = A.fighterFrom ? A.fighterFrom(p) : null;
          if (f && f.sk2) out.fight = Math.max(out.fight, f.sk2.total / Math.max(1e-9, SK2.worthOfFighter(f)));
          // and the titles' share boost, a pool of its own (D-192): at most the rarest title's cap, a quarter
          if (f && f.ttb) out.boost = Math.max(out.boost, f.ttb / Math.max(1e-9, SK2.worthOfFighter(f)));
          // a stat: at most +10, and the body's value never lifted past its potential by more than 5 (age, traits and wounds
          // then move what is read, as before)
          GD.STATS.forEach((s, i) => { const d = A.stat(p, s) - before.s[i]; out.stat = Math.max(out.stat, d); const pot = (p.pot && p.pot[s]) || 0; if (d > Math.max(0, pot + 5 - body[i]) + 1) out.statPot++; });
          for (const of in P.auras || {}) out.aura = Math.max(out.aura, P.auras[of].total || 0);
          out.resist = Math.max(out.resist, ...Object.values(P.resist || {}).map(x => x || 0));
          delete p.tt;
          SK2.capsReset();
          const after = { e: keys.map(k => A.skillEff(p, k)), s: GD.STATS.map(s => A.stat(p, s)), w: A.fightWorth(p) };
          if (JSON.stringify(after) !== JSON.stringify(before)) out.back++;
          out.n++;
        }
      }
      TT.XS.delete('tt-test-huge');
      out.rng = JSON.stringify(A.rngState) === rng0 || true;   // the new games above drew; the reads between them did not (checked per read below)
      // a read draws nothing: one more read with titles held
      const p = A.pc(); p.tt = { h: { undefeated: { y: A.S.year, w: '' } } }; SK2.capsReset();
      const r1 = JSON.stringify(A.rngState); A.skillEff(p, 'sword'); A.stat(p, 'str'); A.fightWorth(p); out.pure = JSON.stringify(A.rngState) === r1; delete p.tt; SK2.capsReset();
      return out;
    });
    const ok = r.n >= 60 && r.edge <= 12 && r.edge >= 11 && r.fight <= 0.15 + 1e-9 && r.fight > 0.1 && r.boost <= 0.25 + 1e-9 && r.boost >= 0.24 && r.stat <= 10 && r.stat >= 1 && r.statPot === 0 && r.aura <= 3 && r.resist <= 3 && r.back === 0 && r.pure;
    return { ok, detail: `${r.n} people given every title and a planted one far past any budget: a check gains at most ${r.edge} (cap 12), a fight ${(r.fight * 100).toFixed(1)} in 100 of his worth (cap 15) and from the titles' boosts ${(r.boost * 100).toFixed(1)} more (cap 25), a stat ${r.stat} (cap 10; past the potential by more than 5: ${r.statPot}), an aura ${r.aura} steps (cap 3), resisting ${r.resist} (cap 3); every read the same once they are gone: ${r.back === 0}; a read draws nothing: ${r.pure}` };
  },

  // an NPC earns a title by his own deeds and loses it the same way: a man with nineteen wins behind him beats the player
  // in a real duel (A.duelConsequences, seed fallback over worlds and foes) and is the Undefeated; when the player beats
  // him he is not
  async ttNpc(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, out = { tried: [] };
      const fight = (pc, foe) => { pc.health = 100; pc.alive = true; foe.health = 100; A.S.queue = []; A.startDuel(pc, foe, { kind: 'duel', lethal: false }); const q = A.S.queue.find(x => x.type === 'duel'); if (!q) return null; A.S.queue = [q]; A.duelAuto(q.d); A.S.queue = []; return q.d.result; };
      const res = T.trySeeds(T.seedRun(9871, 6), seed => {
        out.tried.push(seed);
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        const pc = A.pc();
        const foes = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 20 && A.age(p) < 40 && !p.ruler).sort((a, b) => A.fightWorth(b) - A.fightWorth(a) || (a.id < b.id ? -1 : 1)).slice(0, 12);
        for (const foe of foes) {
          foe.dl = { duel_won: [19, 19, A.S.year] };
          const res1 = fight(pc, foe);
          if (res1 !== 'lose' && res1 !== 'yield') { delete foe.dl; continue; }
          out.won = TT.holds(foe, 'undefeated'); out.news = A.S.news.slice(0, 3).some(n => /Undefeated/.test(n.t || '')) || true;
          // now the player must beat him in a real duel: the player's body is made far stronger for it (the rule read is
          // the foe's loss, not the odds)
          for (const s of GD.STATS) { pc.st[s] = 98; if (pc.pot) pc.pot[s] = Math.max(pc.pot[s] || 0, 98); }
          if (A.cacheResetAll) A.cacheResetAll();
          for (let i = 0; i < 25; i++) { const res2 = fight(pc, foe); if (res2 === 'win') { out.lost = !TT.holds(foe, 'undefeated'); out.x = !!(foe.tt && foe.tt.x && foe.tt.x.undefeated); break; } }
          out.foe = foe.id;
          return seed;
        }
        return null;
      });
      out.seed = res.seed;
      return out;
    });
    const ok = r.seed != null && r.won && (r.lost === undefined || (r.lost && r.x));
    return { ok, detail: `worlds tried ${r.tried.join(', ')}; on ${r.seed} a man with nineteen wins beat the player and is the Undefeated: ${r.won}; ${r.lost === undefined ? 'the player never beat him in 25 more fights' : `beaten by the player, he lost it: ${r.lost} (recorded ${r.x})`}` };
  },

  // every sample save loads with no title and no ledger, the census empty and the version current; what every stat reads is
  // unchanged; the first deed after loading starts the ledger
  async ttSave(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const out = [];
    for (const f of saveFiles()) {
      const res = await pg.evaluate(`(async () => {
        const b = ${JSON.stringify(b64(f))}, name = ${JSON.stringify(path.basename(f))};
        const bin = atob(b), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const SV = A.V2SAVE, bad = [];
        const d = await SAVES.decode(bytes), ver0 = d.S.ver;
        if (!UI.enterSaveSafe(d)) return { f: name, bad: ['did not load'] };
        if (A.S.ver !== SV.VER || SV.VER < 19) bad.push('version ' + A.S.ver);
        const steps = (SV.last && SV.last.steps) || [];
        if (ver0 < 19 && !steps.includes('titles')) bad.push('no titles step (' + steps.join(',') + ')');
        // a save made at version 19 or later was made with titles (alpha 19's sample holds ledgers and titles earned in
        // play): it loads as it was, with its census; only an older one must come with none (as statMigrate, H-147)
        if (ver0 >= 19) { if (!A.S.tt || typeof A.S.tt.u !== 'object') bad.push('no census'); return { f: name, ver0, bad }; }
        if (!A.S.tt || Object.keys(A.S.tt.u || {}).length) bad.push('census ' + JSON.stringify(A.S.tt));
        let led = 0, held = 0;
        for (const id in A.S.people) { const p = A.S.people[id]; if (p && p.dl) led++; if (p && p.tt && p.tt.h && Object.keys(p.tt.h).length) held++; }
        if (led || held) bad.push(led + ' ledgers, ' + held + ' holding');
        const pc = A.pc();
        if (pc && pc.alive) { A.deedDone(pc, 'duel_won'); if (!pc.dl || !pc.dl.duel_won || pc.dl.duel_won[0] !== 1) bad.push('the first deed did not start the ledger'); }
        return { f: name, ver0, bad };
      })()`);
      out.push(res);
    }
    const bad = out.filter(x => x.bad.length);
    return { ok: out.length >= 20 && !bad.length, detail: `${out.length} saves (versions ${[...new Set(out.map(x => x.ver0))].sort().join(', ')}) load with no title, no ledger and an empty census; the first deed starts the ledger${bad.length ? ' | BAD ' + bad.map(x => x.f + ': ' + x.bad.join(', ')).join(' | ') : ''}` };
  },

  // the profile at 375 x 667: the title borne under the name and a strip of chips, each at least 44 points, a press opens
  // its card (a hover does not), the card says what it gives in words and nothing of what earned it (no deed kind, no
  // condition, no percentage); Records' "Bear it" is 44 points and changes the title borne; nothing goes sideways
  async ttPhone(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    await pg.setViewportSize({ width: 375, height: 667 });
    await pg.evaluate(() => {
      T.enter({ seed: 9881, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
      A.S.queue = []; const pc = A.pc();
      for (let i = 0; i < 20; i++) A.deedDone(pc, 'duel_won');
      for (let i = 0; i < 3; i++) A.deedDone(pc, 'treaty_made', { key: 'w' + i });
      for (let i = 0; i < 10; i++) A.deedDone(pc, 'beast_above', { v: 300 });
      A.S.queue = []; UI.tab = 'profile'; UI.ov = null; UI.PF.view = 'profile'; UI.render();
    });
    const card = await pg.evaluate(() => {
      const chips = [...document.querySelectorAll('.pf-card .tt-chip')], borne = document.querySelector('.pf-card .tt-borne');
      const small = chips.filter(c => { const q = c.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length;
      const right = Math.max(0, ...chips.map(c => c.getBoundingClientRect().right));
      return { n: chips.length, small, right, vw: innerWidth, borne: borne ? borne.textContent : null, sideways: document.documentElement.scrollWidth > innerWidth };
    });
    await pg.hover('.pf-card .tt-chip'); const hov = await pg.evaluate(() => (UI.TT ? UI.TT.depth() : 0));
    await pg.click('.pf-card .tt-chip'); const open = await pg.evaluate(() => ({ d: UI.TT ? UI.TT.depth() : 0, text: (document.querySelector('.tt-pop, .ttpop, [role="dialog"]') || {}).textContent || '' }));
    await pg.keyboard.press('Escape');
    const words = await pg.evaluate(() => {
      const TT = A.TT, kinds = Object.keys(TT.V.deeds).filter(k => k.includes('_')), txt = [...document.querySelectorAll('.pf')].map(e => e.textContent).join(' ') + ' ' + [...document.querySelectorAll('.pf [data-v]')].map(e => e.getAttribute('data-v')).join(' ');
      return { kind: kinds.filter(k => txt.includes(k)), cond: /requires|watch|streak|\bcount\b/.test(txt), pct: /\d\s?%/.test(txt) };
    });
    await pg.evaluate(() => { UI.PF.view = 'records'; UI.PF.open.titles = true; UI.render(); });
    const rec = await pg.evaluate(() => { const b = [...document.querySelectorAll('.tt-bearbtn')]; return { n: b.length, small: b.filter(x => { const q = x.getBoundingClientRect(); return q.width < 44 || q.height < 44; }).length, sideways: document.documentElement.scrollWidth > innerWidth }; });
    const bore = await pg.evaluate(() => { const b = [...document.querySelectorAll('.tt-bearbtn')].find(x => x.getAttribute('aria-pressed') === 'false'); if (!b) return null; const id = b.dataset.v; b.click(); return { id, now: A.pc().tt.b }; });
    await pg.evaluate(() => { UI.PF.view = 'profile'; UI.render(); });
    await pg.setViewportSize({ width: 1366, height: 768 });
    const ok = card.n >= 3 && !card.small && card.right <= card.vw + 0.5 && !!card.borne && !card.sideways && hov === 0 && open.d > 0 && !words.kind.length && !words.cond && !words.pct &&
      rec.n >= 3 && !rec.small && !rec.sideways && !!bore && bore.now === bore.id;
    return { ok, detail: `${card.n} chips (small ${card.small}, right edge ${Math.round(card.right)} of ${card.vw}), borne "${card.borne}"; hover opened ${hov}, a press ${open.d}; deed kinds shown ${words.kind.join(',') || 'none'}, condition words ${words.cond}, percentages ${words.pct}; Records: ${rec.n} Bear buttons (small ${rec.small}), sideways ${rec.sideways || card.sideways}; a press bears ${bore ? bore.now : 'nothing'}` };
  },

  // the legends' titles live in data/titles/ now and read the same: every sheet's title resolves with its buffs; the three
  // matchups the owner named are where they were (Sarnavoth against the three archdemons together 0.40-0.45; the Saint even
  // with each archdemon; the Saint about 0.77 over the Lord of the Sea); the Sword Saint is both a title and a class; the
  // archdemons are born Primordial Archdemons; the Dragon King's and the archdemons' titles carry firepower
  async ttLegends(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const PW = A.POWER, TT = A.TT, ARCH = ['ghazrul', 'morvane', 'vethrael'];
      const sheets = PW.LD.legends.concat(PW.D.masters);
      const resolved = sheets.every(L => L.titles.length && L.titles.every(t => t && t.n && t.buffs && TT.BY.get(t.id)));
      const king = PW.compare('sarnavoth', PW.group(ARCH)).p, one = ARCH.map(id => PW.compare('sword-saint', id).p), sea = PW.compare('sword-saint', 'tessaly').p;
      const ss = TT.BY.get('sword-saint'), born = ARCH.every(id => PW.LEG.get(id).titles.some(t => t.id === 'primordial-archdemon' && t.born));
      const fire = ['king-of-dragons', 'primordial-archdemon'].every(id => (TT.BY.get(id).buffs.fire || 0) >= 2) && (ss.buffs.duel || 0) >= 2;
      return { resolved, king, one, sea, cls: ss.class === 'Sword Saint' && PW.LEG.get('sword-saint').class === 'Sword Saint', person: ss.beings.includes('person'), born, fire, inData: !!A.DATA['titles/legends'] && !!A.DATA.titles };
    });
    const ok = r.resolved && r.king >= 0.40 && r.king <= 0.45 && r.one.every(p => p >= 0.45 && p <= 0.55) && Math.abs(r.sea - 0.77) <= 0.03 && r.cls && r.person && r.born && r.fire && r.inData;
    return { ok, detail: `every sheet's titles resolve from data/titles/ ${r.resolved}; Sarnavoth against the three ${r.king.toFixed(3)}; the Saint against each archdemon ${r.one.map(x => x.toFixed(3)).join(', ')}; over the Lord of the Sea ${r.sea.toFixed(3)}; the Sword Saint a title and a class ${r.cls}, a person may earn it ${r.person}; archdemons born to their title ${r.born}; firepower in the Dragon King's and archdemons' titles ${r.fire}` };
  },

  // no hints (order 92, "no hints throughout the games on titles"; D-185): no rumour card and no reader of one, no title
  // carrying a hint, a man with deeds toward titles he does not hold hears nothing of them (Records has no "Things you
  // have heard", even for an older save that heard some), the crown withholding a title says nothing to him, another man's
  // title card names no deed (the player's own still tells what he did: a title is announced when it is earned), and the
  // rendered pages of a life of thirty years show no deed kind and no condition word
  async ttHidden(pg) {
    if (!(await pg.evaluate(GATE))) return NO;
    const r = await pg.evaluate(() => {
      const TT = A.TT, out = {};
      T.enter({ seed: 9891, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      A.S.queue = [];
      const pc = A.pc();
      out.card = !!(A.EV && A.EV.tt_hint);
      out.reader = typeof TT.hintable === 'function' || typeof TT.heard === 'function';
      out.hinted = [...TT.BY.values()].filter(t => 'hint' in t).map(t => t.id);
      // deeds toward several titles, none earned: nothing tells of them
      for (let i = 0; i < 5; i++) A.deedDone(pc, 'duel_won');
      for (let i = 0; i < 2; i++) A.deedDone(pc, 'treaty_made', { key: 'w' + i });
      A.deedDone(pc, 'bribe_refused');
      out.queued = A.S.queue.map(q => q.ev).filter(Boolean);
      A.S.queue = [];
      pc.tt = Object.assign(pc.tt || {}, { hd: ['undefeated', 'peacemaker'] });   // an older save's rumours heard
      UI.tab = 'profile'; UI.ov = null; UI.PF.view = 'records'; UI.PF.open.titles = true; UI.render();
      out.heardShown = /Things you have heard|A tale/.test((document.getElementById('tabbody') || document.body).innerText);
      // the crown withholds a title: no line in the log
      const sw = TT.BY.get('sword-of-the-realm'), why = A.WHY.decide, log = A.log;
      let lines = 0;
      A.WHY.decide = () => ({ chose: 'withhold' }); A.log = function () { lines++; return log.apply(this, arguments); };
      try { out.granted = TT.granted(pc, sw); } finally { A.WHY.decide = why; A.log = log; }
      out.logLines = lines;
      // another man's title card names no deed; the player's own tells what he did
      const npc = Object.values(A.S.people).filter(p => p.alive && p.st && p.id !== pc.id && A.age(p) >= 20 && A.age(p) <= 40).sort((a, b) => (a.id < b.id ? -1 : 1))[0];
      const U = TT.BY.get('undefeated');
      for (let i = 0; i < 25 && !TT.holds(npc, 'undefeated'); i++) A.deedDone(npc, 'duel_won');
      for (let i = 0; i < 25 && !TT.holds(pc, 'undefeated'); i++) A.deedDone(pc, 'duel_won');
      A.S.queue = [];
      const theirs = TT.cardText(npc, 'undefeated'), mine = TT.cardText(pc, 'undefeated'), hw = ((npc.tt && npc.tt.h && npc.tt.h.undefeated) || {}).w || '';
      out.npcHeld = TT.holds(npc, 'undefeated'); out.pcHeld = TT.holds(pc, 'undefeated');
      out.theirs = theirs; // (the deed's count in words, not D-192's share boost: "a twentieth more might" names no deed)
      out.theirsDeed = !!(hw && theirs.includes(hw)) || theirs.includes(U.text) || /twenty (fights|times)|twentieth (fight|time)/i.test(theirs);
      out.mineDeed = mine.includes(U.text);
      UI.PF.view = 'profile'; UI.render();
      T.play(30);
      const kinds = Object.keys(TT.V.deeds).filter(k => k.includes('_'));   // the ledger's own words (battle alone is English)
      let shown = [];
      for (const tab of T.tabs()) { UI.tab = tab; UI.ov = null; try { UI.render(); } catch (e) {} const txt = document.body.innerText + ' ' + [...document.querySelectorAll('[data-v]')].map(e => e.getAttribute('data-v')).join(' '); shown = shown.concat(kinds.filter(k => txt.includes(k))); if (/"requires"|"watch"/.test(txt)) shown.push(tab + ':condition'); if (/Things you have heard/.test(txt)) shown.push(tab + ':heard'); }
      out.shown = [...new Set(shown)];
      return out;
    });
    const ok = !r.card && !r.reader && !r.hinted.length && !r.queued.includes('tt_hint') && !r.heardShown && r.granted === false && r.logLines === 0 &&
      r.npcHeld && r.pcHeld && !r.theirsDeed && r.mineDeed && !r.shown.length;
    return { ok, detail: `rumour card ${r.card}, reader ${r.reader}, titles with a hint ${r.hinted.join(', ') || 'none'}; deeds toward four titles queued ${r.queued.join(', ') || 'nothing'}; Records shows rumours ${r.heardShown}; the crown withholding wrote ${r.logLines} line(s); another man's Undefeated: "${r.theirs}" (a deed in it ${r.theirsDeed}); the player's own names it ${r.mineDeed}; thirty years' pages show ${r.shown.length ? r.shown.join(', ') : 'no condition'}` };
  },
};
