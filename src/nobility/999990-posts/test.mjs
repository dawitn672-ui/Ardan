// Tests for the post registry (999990-posts, round 2 A2). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SAVE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'tests', 'saves', 'v2.1.0-alpha.2-noble.ardan');

// in the page: shared helpers (a noble of Aldmark at war with its strongest neighbour, as in posts-map.md 2.1)
const SETUP = () => {
  window.PT = {
    aldmark(seed) {
      T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 26 });
      const pc = A.pc(), r = A.realm('POL-01');
      const foes = A.neighbors('POL-01').map(A.realm).filter(x => x && x.alive && !x.isRebel).sort((a, b) => (b.army || 0) - (a.army || 0));
      if (!A.atWar('POL-01').some(w => A.warSide(w, foes[0].id))) A.startWar('POL-01', foes[0].id);
      A.enlist(pc, false);
      pc.mil.rank = 4; pc.mil.rankSince = A.absDay();
      A.S.armies = A.S.armies || []; A.wsMobilize && A.wsMobilize('POL-01');
      A.wsAttachPC();
      return { pc, r, foes };
    },
    // the court's roll, with the dice forced only for it (the scenario of posts-map.md 2.1): the seat wanted is won
    // when the court offers it; when the court leaves it out of its list, the roll is lost
    court(want) {
      const ch = A.chance, pk = A.pick;
      let offered = false;
      if (A.S.yearActs) delete A.S.yearActs.n_office;       // once a year: each roll here is its own scene
      A.S.time = Math.max(A.S.time || 0, 3);
      A.pick = l => { offered = l.includes(want); return offered ? want : l[0]; };
      A.chance = () => offered;
      try { return A.nobleAction('office'); } finally { A.chance = ch; A.pick = pk; }
    },
    marshals(r) {
      const out = [];
      for (const id in A.S.people) {
        const p = A.S.people[id];
        if (p && p.alive && p.realm === r.id && /^Marshal of /.test(A.mainRole(p))) out.push(p.id);
      }
      return out;
    },
    // n days on, every card answered as the bot does (A.advance stops at a card)
    days(n) {
      const end = A.absDay() + n;
      for (let g = 0; g < 400 && A.absDay() < end && A.pc() && A.pc().alive; g++) {
        A.advance(end - A.absDay());
        let h, k = 0;
        while ((h = A.headReady()) && k++ < 200) { if (h.type === 'event') { A.eventView(h); A.eventAuto(); } else A.skipPrompt(); }
      }
    },
    fieldOf(pid) { return A.POSTS.held(pid).filter(k => A.POSTS.cls(k) === 'FIELD'); },
  };
};

export default {
  // the owner's report (posts-map.md 2.1, road 1): a Captain named Marshal kept his company, got no army, and another
  // man held the title. Now: no Marshal in a war one army can hold; never a Captain; a General named Marshal for a war
  // that needs one takes the seat, grade 9, every army, the main host in person; its general takes his old army; one
  // Marshal; resigning leaves nothing behind.
  async postsMarshalRepro(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, r, foes } = PT.aldmark(11);
      const out = { steps: [] };
      const step = name => out.steps.push({ name, rank: pc.mil ? pc.mil.rank : null, seat: r.council.marshal === pc.id, office: pc.office || null, role: A.cmdRole(pc).key, marshals: PT.marshals(r).length, audit: A.POSTS.audit().length });
      step('captain at war');
      out.needed1 = A.POSTS.marshalNeeded(r);
      PT.court('marshal'); A.advance(2);
      step('court roll, one war');
      // a second enemy: a war the generals cannot hold together
      const f2 = foes.find(f => f.id !== foes[0].id && !A.atWar('POL-01').some(w => A.warSide(w, f.id)));
      if (f2) A.startWar('POL-01', f2.id);
      A.S.armies = A.S.armies || []; A.wsMobilize && A.wsMobilize('POL-01');
      out.needed2 = A.POSTS.marshalNeeded(r);
      out.captainCan = A.POSTS.can(A.POSTS.seatKey('POL-01', 'marshal'), pc.id);
      // the crown's own pick for the seat is made at the month's end; take it out of the way to test the court's road
      if (r.council.marshal) A.POSTS.vacate(A.POSTS.seatKey('POL-01', 'marshal'), 'test');
      PT.court('marshal'); A.advance(2);
      step('court roll as Captain, great war');
      // promoted General: an army of his own
      pc.mil.rank = 7; A.wsAttachPC();
      out.armyAsGeneral = (A.armiesOf('POL-01').find(a => a.gen === pc.id) || {}).id || null;
      step('general');
      if (r.council.marshal && r.council.marshal !== pc.id) A.POSTS.vacate(A.POSTS.seatKey('POL-01', 'marshal'), 'test');
      const mine = A.armiesOf('POL-01').slice().sort((x, y) => y.divs.length - x.divs.length);
      out.mainBefore = mine[0] ? { id: mine[0].id, gen: mine[0].gen } : null;
      PT.court('marshal');
      step('named Marshal as General');
      const main = A.army(out.mainBefore.id);
      out.leadsMain = !!main && main.gen === pc.id;
      out.oldMainGen = out.mainBefore.gen && out.mainBefore.gen !== pc.id ? { id: out.mainBefore.gen, holds: A.POSTS.held(out.mainBefore.gen) } : null;
      out.allArmies = A.armiesOf('POL-01').every(a => A.cmdRole(pc).armies.has(a.id));
      A.POSTS.sync('month');
      out.strict = A.POSTS.audit({ strict: true });
      A.advance(30);
      step('a month on');
      // he resigns: nothing stays his
      out.resign = A.resign();
      A.POSTS.sync('month');
      step('resigned');
      out.afterResign = { posts: A.POSTS.held(pc.id), seat: r.council.marshal === pc.id, gen: A.armiesOf('POL-01').some(a => a.gen === pc.id), div: A.divsOf('POL-01').some(d => d.cmd === pc.id), war: !!(A.V2W && A.V2W.canRoom && A.V2W.canRoom()) };
      out.strict2 = A.POSTS.audit({ strict: true });
      return out;
    }).toString() + ')()');
    const s = n => r.steps.find(x => x.name === n) || {};
    const checks = {
      oneWarNoMarshal: !r.needed1 && !s('court roll, one war').seat && s('court roll, one war').rank === 4,
      greatWarNeedsOne: r.needed2,
      captainRefused: /General/.test(r.captainCan || '') && !s('court roll as Captain, great war').seat && s('court roll as Captain, great war').rank === 4,
      generalHasArmy: !!r.armyAsGeneral,
      marshalSeated: s('named Marshal as General').seat && s('named Marshal as General').rank === 9 && s('named Marshal as General').role === 'marshal' && s('named Marshal as General').office === 'marshal',
      leadsMainHost: r.leadsMain && r.allArmies,
      oldGeneralMoved: !r.oldMainGen || r.oldMainGen.holds.some(k => k.startsWith('army:')),
      oneMarshal: r.steps.every(x => x.marshals <= 1),
      strictAudit: !r.strict.length && !r.strict2.length,
      resignLeavesNothing: r.resign && r.resign.ok && !r.afterResign.posts.length && !r.afterResign.seat && !r.afterResign.gen && !r.afterResign.div,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | ` + r.steps.map(x => `${x.name}: rank ${x.rank} seat ${x.seat} role ${x.role} marshals ${x.marshals}`).join('; ') + (r.strict.length ? ' | ' + r.strict.slice(0, 3).join('; ') : '') };
  },

  // D-049 (owner order 51): the Marshal's seat is optional. The lore's sitting Marshals start in their seats (Aldmark's
  // Leofric Stane) and keep them in peace; a ruler may name a General or a proven commander in peace, not just anyone;
  // the court's roll cannot give the seat in peace; a Marshal the crown named for a war stands down at peace, one of the
  // ruler's own choice does not; nothing in the audit asks the seat to be filled or empty
  async postsMarshalOptional(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      T.enter({ seed: 23, race: 'human', realm: 'POL-02', status: 'noble', sex: 'M', startAge: 26 });
      const out = {};
      const ald = A.realm('POL-01'), m = A.P(ald.council.marshal);
      out.lore = m ? { name: A.fullName(m, false), cast: m.castId, role: A.mainRole(m), own: (A.S.posts.h[A.POSTS.seatKey('POL-01', 'marshal')] || {}).own } : null;
      const seeded = Object.keys(A.S.realms).filter(id => { const x = A.S.realms[id]; return x && x.alive && x.council && x.council.marshal; });
      out.seeded = seeded.length;
      T.play(2);
      out.kept = seeded.filter(id => { const x = A.realm(id), h = A.P(x.council.marshal); return h && h.alive; }).length;
      out.keptOrDead = seeded.every(id => { const x = A.realm(id), rec = A.S.posts.h[A.POSTS.seatKey(id, 'marshal')]; return x.council.marshal || (rec && rec.prev && /died|crowned|under age|imprisoned|left/.test(rec.prev[rec.prev.length - 1][3])); });
      // a realm at peace with its seat empty: who may the ruler name?
      const r = Object.values(A.S.realms).find(x => x && x.alive && !x.isRebel && !x.landless && x.council && !x.council.marshal && !A.atWar(x.id).length && x.id !== A.pc().realm);
      out.realm = r && r.id;
      if (r) {
        const key = A.POSTS.seatKey(r.id, 'marshal');
        const men = Object.values(A.S.people).filter(p => p.alive && p.realm === r.id && !p.ruler && A.isAdult(p) && !p.prison && !A.POSTS.held(p.id).length && p.id !== A.S.pc);
        const weak = men.slice().sort((a, b) => A.skill(a, 'command') - A.skill(b, 'command'))[0];
        const strong = men.slice().sort((a, b) => A.skill(b, 'command') - A.skill(a, 'command'))[0];
        if (strong) strong.skills.command = Math.max(A.skill(strong, 'command'), 60);
        out.weakCmd = weak && A.skill(weak, 'command');
        out.weakRuler = weak ? A.POSTS.can(key, weak.id, { ruler: true }) : 'none';
        out.strongCourt = strong ? A.POSTS.can(key, strong.id, { by: 'court' }) : 'none';
        out.strongRuler = strong ? A.POSTS.can(key, strong.id, { ruler: true }) : 'none';
        const res = strong ? A.POSTS.appoint(key, strong.id, { why: 'ruler', by: r.ruler }) : { ok: false };
        out.appointed = res.ok;
        PT.days(40);
        out.ownKept = r.council.marshal === (strong && strong.id);
        A.POSTS.sync('month');
        out.audit1 = A.POSTS.audit({ strict: true });
        // the same man named by the crown for a war: at peace he stands down
        A.POSTS.vacate(key, 'test');
        A.POSTS.appoint(key, strong.id, { why: 'war', by: r.ruler, force: true });
        PT.days(40);
        out.warStoodDown = !r.council.marshal || A.atWar(r.id).length > 0;
        A.POSTS.sync('month');
        out.audit2 = A.POSTS.audit({ strict: true });
      }
      return out;
    }).toString() + ')()');
    const checks = {
      loreMarshal: !!r.lore && r.lore.cast === 'CHR-0005' && /^Marshal of /.test(r.lore.role) && r.lore.own === 1,
      seededSome: r.seeded >= 3,
      keptInPeace: r.keptOrDead && r.kept >= r.seeded - 1,
      weakRefused: /proven commander/.test(r.weakRuler || ''),
      courtRefusedInPeace: /needs no Marshal/.test(r.strongCourt || ''),
      rulerMayInPeace: r.strongRuler === '' && r.appointed,
      ownStays: r.ownKept && !r.audit1.length,
      warMarshalStandsDown: r.warStoodDown && !r.audit2.length,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | Aldmark's Marshal at the start: ${r.lore ? r.lore.name + ' (' + r.lore.role + ')' : 'none'}; ${r.seeded} lore Marshals, ${r.kept} alive in their seats two years on; in ${r.realm} at peace: a man of command ${r.weakCmd} "${r.weakRuler}", the court "${r.strongCourt}", the ruler's choice "${r.strongRuler}"; his own Marshal kept ${r.ownKept}, a war's Marshal stood down ${r.warStoodDown}${r.audit1.length || r.audit2.length ? ' | ' + r.audit1.concat(r.audit2).slice(0, 3).join('; ') : ''}` };
  },

  // a Commander made General hands his division over: he takes an army without a living general or the one whose
  // general is the weakest, that general takes the Commander's old division (posts-map.md 5.5), and nobody holds two
  // field commands
  async postsHandover(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, r } = PT.aldmark(23);
      // the lore's sitting Marshal (D-049) leads an army in person, which a General does not take: out of the way here
      if (r.council.marshal) A.POSTS.vacate(A.POSTS.seatKey('POL-01', 'marshal'), 'test');
      // every army led by a living general, so the new General must displace one
      for (const a of A.armiesOf('POL-01')) if (!a.gen || !A.P(a.gen) || !A.P(a.gen).alive) a.gen = A.wsGeneralFor('POL-01');
      A.POSTS.sync('month');
      pc.mil.rank = 6; A.wsAttachPC();
      const div = A.divById(pc.mil.div), out = { divCmd: div && div.cmd === pc.id, div: div && div.id };
      const gens = A.armiesOf('POL-01').map(a => [a.id, a.gen, A.skill(A.P(a.gen), 'command')]);
      const weakest = gens.slice().sort((x, y) => x[2] - y[2] || A.army(y[0]).divs.length - A.army(x[0]).divs.length)[0];
      pc.mil.rank = 7; A.wsAttachPC();
      const a = A.armiesOf('POL-01').find(x => x.gen === pc.id);
      out.army = a && a.id; out.weakest = weakest && weakest[0];
      out.displaced = weakest ? weakest[1] : null;
      out.displacedHolds = out.displaced ? A.POSTS.held(out.displaced) : [];
      out.divNow = div ? div.cmd : null;
      out.pcField = PT.fieldOf(pc.id);
      A.POSTS.sync('month');
      out.strict = A.POSTS.audit({ strict: true });
      return out;
    }).toString() + ')()');
    const ok = r.divCmd && r.army && r.army === r.weakest && r.displacedHolds.includes('div:' + r.div) && r.divNow === r.displaced && r.pcField.length === 1 && !r.strict.length;
    return { ok, detail: `commander of ${r.div}: ${r.divCmd}; as General leads ${r.army} (weakest general's army ${r.weakest}); the man replaced holds ${r.displacedHolds.join(', ') || 'nothing'}; the division's commander now ${r.divNow}; the player's field posts ${r.pcField.join(', ')}${r.strict.length ? '; ' + r.strict.slice(0, 3).join('; ') : ''}` };
  },

  // death vacates every post at once (R6): a councillor, a shire officer and a general, each left with no dead holder
  async postsDeathVacates(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { r } = PT.aldmark(37);
      A.advance(40);
      const seatK = Object.keys(r.council).find(k => k !== 'marshal' && A.P(r.council[k]) && A.P(r.council[k]).alive && r.council[k] !== A.S.pc);
      const cId = r.council[seatK];
      const off = (r.pol.off || []).find(o => o.pid && o.pid !== cId && A.P(o.pid) && A.P(o.pid).alive);
      const army = A.armiesOf('POL-01').find(a => a.gen && a.gen !== A.S.pc && a.gen !== cId && (!off || a.gen !== off.pid));
      const victims = [cId, off && off.pid, army && army.gen].filter(Boolean);
      for (const id of victims) A.kill(A.P(id), 'a test', true);
      const out = {
        n: victims.length,
        seat: r.council[seatK] || null, seatRec: A.S.posts.h[A.POSTS.seatKey('POL-01', seatK)],
        off: off ? off.pid : 'none', army: army ? army.gen : 'none', armyOk: !!army && army.gen !== victims[2] && !!A.P(army.gen) && A.P(army.gen).alive,
        held: victims.map(id => A.POSTS.held(id).length),
      };
      out.audit = A.POSTS.audit();
      return out;
    }).toString() + ')()');
    const prev = r.seatRec && r.seatRec.prev && r.seatRec.prev[r.seatRec.prev.length - 1];
    const ok = r.n === 3 && !r.seat && prev && prev[3] === 'died' && r.off === null && r.armyOk && r.held.every(n => n === 0) && !r.audit.length;
    return { ok, detail: `${r.n} killed: seat now ${r.seat}, last holder left for "${prev && prev[3]}"; office ${r.off}; army general now ${r.army} (a living deputy: ${r.armyOk}); posts left ${r.held.join('/')}${r.audit.length ? '; ' + r.audit.slice(0, 3).join('; ') : ''}` };
  },

  // an older save: a real alpha.2 save (made before the registry) loads with the registry built and no rule broken,
  // without a draw from the stream; and a state with every old fault is repaired the same way twice (deterministic)
  async postsSaveMigration(pg) {
    const b64 = fs.existsSync(SAVE) ? fs.readFileSync(SAVE).toString('base64') : null;
    const r = await pg.evaluate(async ([b64, setup]) => {
      (0, eval)('(' + setup + ')()');
      const out = {};
      if (b64) {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const d = await SAVES.decode(bytes);
        out.hadPosts = !!d.S.posts;
        const rng0 = d.S.rng;
        out.loaded = UI.enterSaveSafe(d);
        out.real = { posts: Object.keys(A.S.posts.h).length, audit: A.POSTS.audit({ strict: true }), rng: A.rngState === (rng0 | 0) };
        out.realPlay = T.play(1);
        out.realAudit = A.POSTS.audit();
      }
      // every old fault at once, in a state with no registry
      const make = () => {
        T.enter({ seed: 41, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
        T.play(1);
        const pc = A.pc(), r = A.realm('POL-01');
        A.enlist(pc, false); pc.mil.rank = 9;                     // a Marshal's grade in peace, without the seat
        const seats = Object.keys(A.COUNCIL).filter(k => k !== 'marshal');
        const two = A.P(r.council[seats[0]]);
        r.council[seats[1]] = two.id;                            // one man in two seats
        const dead = A.P(r.council[seats[2]]); dead.alive = false; dead.died = A.S.year;   // a dead councillor
        const off = r.pol.off.find(o => o.pid && o.pid !== two.id && o.pid !== dead.id);
        const kid = A.genNoble('POL-01', 'gentry', null, 6); off.pid = kid.id;            // a child in an office
        delete A.S.posts;
        return { text: A.serialize(), two: two.id, seats, dead: dead.id, off: off.id, kid: kid.id };
      };
      const m = make();
      const runOnce = () => {
        A.deserialize(m.text);
        const pc = A.pc(), r = A.realm('POL-01');
        return {
          rank: pc.mil.rank, twoSeats: Object.values(r.council).filter(x => x === m.two).length,
          deadSeat: Object.values(r.council).includes(m.dead), kidOff: r.pol.off.find(o => o.id === m.off).pid === m.kid,
          need: A.POSTS.marshalNeeded(r), audit: A.POSTS.audit({ strict: true }), lines: (A.POSTS.lastLoad && A.POSTS.lastLoad.lines) || [],
          hash: T.hash(A.S), rng: A.rngState,
        };
      };
      out.a = runOnce(); out.b = runOnce();
      return out;
    }, [b64, SETUP.toString()]);
    const a = r.a, real = r.real;
    const okReal = !b64 || (!r.hadPosts && r.loaded !== false && real.posts > 0 && !real.audit.length && real.rng && (r.realPlay === 'ok' || r.realPlay === 'dead') && !r.realAudit.length);
    const okFix = a.rank === (a.need ? 9 : 8) && a.twoSeats === 1 && !a.deadSeat && !a.kidOff && !a.audit.length && a.lines.length >= 3 && a.hash === r.b.hash && a.rng === r.b.rng;
    return { ok: okReal && okFix, detail: `${b64 ? `alpha.2 save: registry ${real.posts} posts, audit ${real.audit.length}, stream kept ${real.rng}, a year on ${r.realPlay} audit ${r.realAudit.length}` : 'no sample save'} | faults: grade ${a.rank}, seats of one man ${a.twoSeats}, dead seat ${a.deadSeat}, child office ${a.kidOff}, audit ${a.audit.length}, ${a.lines.length} lines (${a.lines.slice(0, 4).join('; ')}); same twice ${a.hash === r.b.hash && a.rng === r.b.rng}${a.audit.length ? ' | ' + a.audit.slice(0, 3).join('; ') : ''}` };
  },

  // the registry is pure where it should be: a check or a view never changes the state or draws, and the same seed
  // gives the same registry
  async postsPure(pg) {
    const r = await pg.evaluate(() => {
      const run = () => { T.enter({ seed: 59, race: 'human', realm: 'POL-03', status: 'noble', sex: 'M', startAge: 20 }); T.play(3); return { h: T.hash(A.S.posts), rng: A.rngState }; };
      const a = run(), b = run();
      const k0 = A.rngState, h0 = T.hash(A.S);
      A.POSTS.audit({ strict: true }); A.COHERENCY.run(['one holder per post']);
      for (const id in A.S.people) { const p = A.S.people[id]; if (p.alive) { A.mainRole(p); A.POSTS.title(p); } }
      return { same: a.h === b.h && a.rng === b.rng, pure: A.rngState === k0 && T.hash(A.S) === h0 };
    });
    return { ok: r.same && r.pure, detail: `same seed same registry ${r.same}; audit and views pure ${r.pure}` };
  },
};
