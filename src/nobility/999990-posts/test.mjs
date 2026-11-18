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
    // W1-1: who is styled the realm's senior General (one man, the General of the first host)
    seniors(r) {
      const out = [];
      for (const id in A.S.people) {
        const p = A.S.people[id];
        if (p && p.alive && p.realm === r.id && /^Senior General of /.test(A.mainRole(p))) out.push(p.id);
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
  // the owner's report (posts-map.md 2.1, road 1): a Captain named to the army's council seat kept his company, got no
  // army, and another man held the title. W1-1 (D-064): there is no Marshal; the army's place at council is the senior
  // General's, the General of the crown's first host. The court's roll never gives it to a Captain; a General given it
  // takes the first host and the council's place, no army, and only one man holds it; resigning leaves nothing behind.
  async postsSeniorGeneralCourt(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, r } = PT.aldmark(11);
      const out = { steps: [] };
      const step = name => out.steps.push({ name, rank: pc.mil ? pc.mil.rank : null, senior: A.POSTS.isSeniorGeneral(pc.id), seat: r.council.general === pc.id, office: pc.office || null, role: A.cmdRole(pc).key, seniors: PT.seniors(r).length, audit: A.POSTS.audit().length });
      step('captain at war');
      out.captainCan = A.POSTS.can(A.POSTS.seatKey('POL-01', 'general'), pc.id);
      PT.court('general'); A.advance(2);
      step('court roll as Captain');
      pc.mil.rank = 6; A.wsAttachPC();
      step('general');
      PT.court('general'); A.advance(2);
      step('court roll as General');
      out.army = A.armiesOf('POL-01').some(a => a.gen === pc.id);
      pc.mil.rank = 7; A.wsAttachPC();
      step('second step');
      out.army2 = A.armiesOf('POL-01').some(a => a.gen === pc.id);
      A.POSTS.sync('month');
      out.strict = A.POSTS.audit({ strict: true });
      out.resign = A.resign();
      A.POSTS.sync('month');
      step('resigned');
      out.afterResign = { posts: A.POSTS.held(pc.id), seat: r.council.general === pc.id, gen: A.armiesOf('POL-01').some(a => a.gen === pc.id), div: A.divsOf('POL-01').some(d => d.cmd === pc.id) };
      out.strict2 = A.POSTS.audit({ strict: true });
      return out;
    }).toString() + ')()');
    const s = n => r.steps.find(x => x.name === n) || {};
    const checks = {
      captainRefused: /General/.test(r.captainCan || '') && !s('court roll as Captain').seat && s('court roll as Captain').rank === 4,
      generalSeated: s('court roll as General').senior && s('court roll as General').seat && s('court roll as General').office === 'general' && s('court roll as General').rank === 6,
      noArmy: !r.army && !r.army2 && s('second step').senior,
      oneSenior: r.steps.every(x => x.seniors <= 1),
      strictAudit: !r.strict.length && !r.strict2.length,
      resignLeavesNothing: r.resign && r.resign.ok && !r.afterResign.posts.length && !r.afterResign.seat && !r.afterResign.gen && !r.afterResign.div,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | ` + r.steps.map(x => `${x.name}: rank ${x.rank} senior ${x.senior} role ${x.role} seniors ${x.seniors}`).join('; ') + (r.strict.length ? ' | ' + r.strict.slice(0, 3).join('; ') : '') };
  },

  // D-049, W1-1: the lore's sitting army chiefs start as their realms' senior Generals (Aldmark's Leofric Stane); the
  // crown fills every realm's first host within a month; a ruler may name a General or a proven commander, not just
  // anyone; nobody holds the old Marshal's seat
  async postsSeniorGeneralFill(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      T.enter({ seed: 23, race: 'human', realm: 'POL-02', status: 'noble', sex: 'M', startAge: 26 });
      const out = {}, P = A.POSTS;
      const ald = A.realm('POL-01'), m = A.P(P.seniorGeneral(ald));
      out.lore = m ? { name: A.fullName(m, false), cast: m.castId, role: A.mainRole(m) } : null;
      out.seeded = Object.keys(A.S.realms).filter(id => { const x = A.S.realms[id]; return x && x.alive && P.seniorGeneral(x); }).length;
      PT.days(40);
      const pc = A.pc();
      const live = Object.values(A.S.realms).filter(x => x && x.alive && !x.landless && !(x.isRebel && !x.isNew) && x.ruler && P.firstHost(x) && !(pc && pc.ruler === x.id));
      out.firsts = live.length;
      out.filled = live.filter(x => P.seniorGeneral(x)).length;
      const r = live.find(x => x.id !== pc.realm && x.id !== 'POL-01');
      out.realm = r && r.id;
      if (r) {
        const key = P.seatKey(r.id, 'general');
        const men = Object.values(A.S.people).filter(p => p.alive && p.realm === r.id && !p.ruler && A.isAdult(p) && !p.prison && !P.held(p.id).some(k => ['SEAT', 'OFFICE', 'FIELD', 'STAFF'].includes(P.cls(k))) && p.id !== A.S.pc && (p.milRank || 0) < 6);
        const weak = men.slice().sort((a, b) => A.skill(a, 'command') - A.skill(b, 'command') || (a.id < b.id ? -1 : 1))[0];
        const strong = men.slice().sort((a, b) => A.skill(b, 'command') - A.skill(a, 'command') || (a.id < b.id ? -1 : 1))[0];
        out.men = men.length;
        if (strong) strong.skills.command = Math.max(A.skill(strong, 'command'), 70);
        out.weakCmd = weak && A.skill(weak, 'command');
        out.weakRuler = weak ? P.can(key, weak.id, { ruler: true }) : 'none';
        out.strongRuler = strong ? P.can(key, strong.id, { ruler: true }) : 'none';
        const was = P.seniorGeneral(r);
        const res = strong ? P.appoint(key, strong.id, { why: 'ruler', by: r.ruler }) : { ok: false };
        out.appointed = res.ok && P.seniorGeneral(r) === strong.id && r.council.general === strong.id;
        out.wasHolds = was ? P.held(was).filter(k => P.cls(k) === 'FIELD').length : 0;
        P.sync('month');
        out.audit1 = P.audit({ strict: true });
      }
      out.marshalKeys = Object.keys(A.S.posts.h).filter(k => /:marshal$/.test(k)).length + Object.values(A.S.realms).filter(x => x.council && x.council.marshal).length;
      return out;
    }).toString() + ')()');
    const checks = {
      loreSenior: !!r.lore && r.lore.cast === 'CHR-0005' && /^Senior General of /.test(r.lore.role),
      seededSome: r.seeded >= 3,
      crownFills: r.filled >= r.firsts - 1 && r.firsts > 10,
      weakRefused: /proven commander/.test(r.weakRuler || ''),
      rulerMay: r.strongRuler === '' && r.appointed,
      audit: !r.audit1 || !r.audit1.length,
      noMarshal: !r.marshalKeys,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | Aldmark's senior General at the start: ${r.lore ? r.lore.name + ' (' + r.lore.role + ')' : 'none'}; ${r.seeded} seeded from the lore, ${r.filled} of ${r.firsts} first hosts led a month on; in ${r.realm} (${r.men} men without a post): a man of command ${r.weakCmd} "${r.weakRuler}", the ruler's choice "${r.strongRuler}", the man replaced keeps ${r.wasHolds} field post${r.audit1 && r.audit1.length ? ' | ' + r.audit1.slice(0, 3).join('; ') : ''}` };
  },

  // A2 stage 2: the new posts, each with one holder, handed over and left with consequences, with nothing adopted
  // behind the registry's back: a company and a battalion (9997), an order's Grand Master, a place on the staff, a free
  // company, the head of a house and a court title
  async postsStage2Kinds(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      T.enter({ seed: 31, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 24 });
      const P = A.POSTS, pc = A.pc(), r = A.realm('POL-01'), out = {};
      P.stats.adopted = {};
      A.enlist(pc, false);
      pc.mil.rank = 2; A.pcDivAttach(pc); A.CO.place(pc);
      const m = pc.mil.co, d = A.divById(m.div), capKey = P.coyKey(m.div, m.b, m.i), bnKey = P.coyKey(m.div, m.b, 4);
      const capId = P.holder(capKey), senId = P.holder(bnKey);
      out.made = !!capId && !!senId;
      // Captain: he takes the company; the man he replaces leaves it with a past style, and no seed in the battalion
      // bears his name (a seed is spent when it becomes a person)
      pc.mil.rank = 4; A.CO.place(pc);
      const old = A.P(capId);
      out.captain = { pc: P.holder(capKey) === pc.id, oldStyle: old && old.occ, oldHolds: old ? P.held(old.id) : [] };
      out.twin = [0, 1, 2, 3, 4].some(s => { const c = A.CO.cap(d, m.b, s); return c && !c.pid && old && c.name === `${old.given} ${old.sur}`; });
      // Commander: the division and his own battalion; the senior captain he replaces takes his old company
      pc.mil.rank = 6; A.pcDivAttach(pc); P.sync('month'); A.CO.place(pc);
      out.commander = { div: P.holder(P.divKey(m.div)) === pc.id, bn: P.holder(bnKey) === pc.id, senTook: P.holder(capKey) === senId, field: PT.fieldOf(pc.id).length };
      // a Grand Master dies: the chapter names another at once, who leads the order's division
      const oid = Object.keys(r.orders || {}).find(k => A.P(r.orders[k]) && A.P(r.orders[k]).alive && A.orderDiv(k));
      if (oid) {
        const gm = r.orders[oid];
        A.kill(A.P(gm), 'a test', true);
        const now = A.P(r.orders[oid]);
        out.order = { replaced: !!now && now.alive && now.id !== gm, leads: A.orderDiv(oid).cmd === (now && now.id), rec: P.holder(P.orderKey('POL-01', oid)) === (now && now.id) };
      }
      // the staff: no councillor; a pick holds the place; his death leaves it
      const slot = A.staffSlots(pc).find(x => x.type === 'qm');
      const councillor = A.P(Object.values(r.council).find(id => A.P(id) && A.P(id).alive && id !== pc.id));
      const man = Object.values(A.S.people).find(p => p.alive && p.realm === 'POL-01' && A.isAdult(p) && !p.ruler && !p.prison && !P.held(p.id).length && p.id !== pc.id);
      if (slot && man) {
        out.staffNo = councillor ? A.staffAppoint(slot.key, councillor.id) : { ok: false, msg: 'no councillor' };
        out.staffYes = A.staffAppoint(slot.key, man.id).ok && P.holder(P.staffKey(pc.id, slot.key)) === man.id;
        A.kill(man, 'a test', true);
        out.staffLeft = !P.holder(P.staffKey(pc.id, slot.key)) && !(pc.staff || {})[slot.key];
      }
      // a house head dies: his heir heads the house, the record says why the last one left
      const h = Object.values(A.S.houses).find(x => !x.extinct && x.great !== false && A.P(x.headPid) && A.P(x.headPid).alive && x.headPid !== pc.id && !A.P(x.headPid).ruler && (A.P(x.headPid).children || []).some(c => A.P(c) && A.P(c).alive && !A.P(c).flags.bastard));
      if (h) {
        const head = h.headPid;
        A.kill(A.P(head), 'a test', false);
        const rec = A.S.posts.h[P.houseKey(h.id)], last = rec && rec.prev && rec.prev[rec.prev.length - 1];
        out.house = { heir: !!h.headPid && h.headPid !== head && A.P(h.headPid).alive, rec: rec && rec.p === h.headPid, why: last && last[3] };
      }
      // a count dies: his title passes by the law and the registry hears of it
      const count = Object.values(A.S.people).find(p => p.alive && p.realm === 'POL-01' && p.noble && p.noble.court && !p.ruler && p.id !== pc.id && (p.children || []).some(c => A.P(c) && A.P(c).alive));
      if (count) {
        const ck = count.noble.court;
        A.kill(count, 'a test', false);
        // his heir by the law carries it, or (no heir the law takes: CI 140's count after D9 left only a daughter) the
        // title stands vacant for the crown to regrant, and the registry says so at once, naming the dead man as its last
        const to = P.holder(P.titleKey(ck)), rec = A.S.posts.h[P.titleKey(ck)], last = rec && rec.prev && rec.prev[rec.prev.length - 1];
        out.title = { moved: to !== count.id, carries: to ? !!(A.P(to).noble && (A.P(to).noble.court === ck || (A.P(to).noble.more || []).includes(ck))) : !!(last && last[0] === count.id && last[3] === 'died'), vacant: !to };
      }
      // a free company: resigning the commission leaves every field post; the company's captaincy is a post kept in prison
      if (A.atWar('POL-01').length) for (const w of A.atWar('POL-01').slice()) A.S.wars = A.S.wars.filter(x => x !== w);
      out.resign = A.resign().ok;
      out.afterResign = P.held(pc.id).filter(k => P.cls(k) === 'FIELD');
      pc.coin = 5000; pc.fame = Math.max(pc.fame, 30);
      out.found = A.foundCompany(pc).ok && P.holder(P.freeKey(pc.id)) === pc.id;
      A.imprison(pc, 1, 'a test');
      out.freeInPrison = P.holder(P.freeKey(pc.id)) === pc.id && !!pc.company;
      P.sync('month');
      out.strict = P.audit({ strict: true });
      out.adopted = Object.assign({}, P.stats.adopted);
      return out;
    }).toString() + ')()');
    const ad = r.adopted || {}, stage2 = ['coy', 'bn', 'order', 'staff', 'free', 'house', 'title'].filter(k => ad[k]);
    const checks = {
      madeCaptains: r.made,
      captainTakesCompany: r.captain.pc && !r.captain.oldHolds.length && /^once Captain/.test(r.captain.oldStyle || ''),
      noTwin: !r.twin,
      commanderBoth: r.commander.div && r.commander.bn && r.commander.field === 2,
      seniorSwaps: r.commander.senTook,
      grandMaster: !r.order || (r.order.replaced && r.order.leads && r.order.rec),
      staff: r.staffYes && r.staffLeft && !(r.staffNo && r.staffNo.ok),
      house: !r.house || (r.house.heir && r.house.rec && r.house.why === 'died'),
      title: !r.title || (r.title.moved && r.title.carries),
      resignLeaves: r.resign && !r.afterResign.length,
      freeCompany: r.found && r.freeInPrison,
      strict: !r.strict.length,
      nothingAdopted: !stage2.length,
    };
    const ok = Object.values(checks).every(Boolean);
    return { ok, detail: `${Object.entries(checks).filter(x => !x[1]).map(x => 'FAILED ' + x[0]).join(', ') || 'all held'} | the old captain: "${r.captain.oldStyle}"; Commander holds ${r.commander.field} field posts; order ${JSON.stringify(r.order)}; staff refused a councillor: "${r.staffNo && r.staffNo.msg}"; house ${JSON.stringify(r.house)}; title ${JSON.stringify(r.title)}; adopted ${JSON.stringify(ad)}${r.strict.length ? ' | ' + r.strict.slice(0, 3).join('; ') : ''}` };
  },

  // A2 stage 2 (step 3): every writer goes through the registry, so the month's sync adopts nothing and the strict
  // audit (every old field equal to its record) holds at any moment, not only at the month's end: a soldier's life and
  // a noble's, at war, checked at every stop of the clock
  async postsNothingAdopted(pg) {
    const r = await pg.evaluate(() => {
      const out = [];
      for (const [seed, status] of [[5, 'peasant'], [9, 'noble']]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status, sex: 'M', startAge: 19 });
        const pc = A.pc();
        if (status === 'peasant') A.enlist(pc, false);
        const foe = A.neighbors('POL-01').map(A.realm).filter(x => x && x.alive && !x.isRebel)[0];
        if (foe && !A.atWar('POL-01').length) A.startWar('POL-01', foe.id);
        A.POSTS.stats.adopted = {};
        const bad = []; let stops = 0;
        T.play(6, { each: () => { stops++; if (bad.length < 4) for (const b of A.POSTS.audit({ strict: true }).slice(0, 2)) bad.push(A.S.year + ': ' + b); } });
        out.push({ seed, status, stops, adopted: Object.assign({}, A.POSTS.stats.adopted), bad, records: Object.keys(A.S.posts.h).length });
      }
      return out;
    });
    const ok = r.every(x => !Object.keys(x.adopted).length && !x.bad.length);
    return { ok, detail: r.map(x => `${x.status} ${x.seed}: ${x.records} posts, ${x.stops} stops checked, adopted ${JSON.stringify(x.adopted)}${x.bad.length ? ', ' + x.bad.join('; ') : ''}`).join(' | ') };
  },

  // a Commander made General hands his division over: he takes an army without a living general or the one whose
  // general is the weakest, that general takes the Commander's old division (posts-map.md 5.5), and nobody holds two
  // field commands
  async postsHandover(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, r } = PT.aldmark(23);
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
      // (H-082: the three to kill (a councillor, an officer, an army's general, three different living men) are the world's
      // to have; a world without all three is read again on the next seed, up to six)
      let r, seatK, cId, off, army, seed;
      for (seed = 37; seed < 43; seed++) {
        ({ r } = PT.aldmark(seed));
        A.advance(40);
        seatK = Object.keys(r.council).find(k => k !== 'general' && A.P(r.council[k]) && A.P(r.council[k]).alive && r.council[k] !== A.S.pc);
        cId = r.council[seatK];
        off = (r.pol.off || []).find(o => o.pid && o.pid !== cId && A.P(o.pid) && A.P(o.pid).alive);
        army = A.armiesOf('POL-01').find(a => a.gen && a.gen !== A.S.pc && a.gen !== cId && (!off || a.gen !== off.pid));
        if (cId && off && army) break;
      }
      const victims = [cId, off && off.pid, army && army.gen].filter(Boolean);
      for (const id of victims) A.kill(A.P(id), 'a test', true);
      const out = {
        n: victims.length, seed,
        seat: r.council[seatK] || null, seatRec: A.S.posts.h[A.POSTS.seatKey('POL-01', seatK)],
        off: off ? off.pid : 'none', army: army ? army.gen : 'none', armyOk: !!army && army.gen !== victims[2] && !!A.P(army.gen) && A.P(army.gen).alive,
        // a court title passes by the realm's law at its own pass (99995; the registry's year sync), not at the death:
        // W1-1 made the army's general a great house's head (no Marshal leads the first army), who may carry one
        held: victims.map(id => A.POSTS.held(id).filter(k => !k.startsWith('title:')).length),
      };
      out.audit = A.POSTS.audit();
      return out;
    }).toString() + ')()');
    const prev = r.seatRec && r.seatRec.prev && r.seatRec.prev[r.seatRec.prev.length - 1];
    const ok = r.n === 3 && !r.seat && prev && prev[3] === 'died' && r.off === null && r.armyOk && r.held.every(n => n === 0) && !r.audit.length;
    return { ok, detail: `world ${r.seed}: ${r.n} killed: seat now ${r.seat}, last holder left for "${prev && prev[3]}"; office ${r.off}; army general now ${r.army} (a living deputy: ${r.armyOk}); posts left ${r.held.join('/')}${r.audit.length ? '; ' + r.audit.slice(0, 3).join('; ') : ''}` };
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
        // a living player: the repairs of his grade and seat are for the living (C6/C7's world: seed 41's noble dies in
        // his first year, and a dead player's grade is nobody's to repair)
        for (const seed of [41, 43, 47, 53]) {
          T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 30 });
          if (T.play(1) !== 'dead' && A.pc().alive) break;
        }
        const pc = A.pc(), r = A.realm('POL-01');
        A.enlist(pc, false); pc.mil.rank = 9;                     // W1-1: an old save's Marshal's grade, without the seat
        const seats = Object.keys(A.COUNCIL).filter(k => k !== 'general');
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
          audit: A.POSTS.audit({ strict: true }), lines: (A.POSTS.lastLoad && A.POSTS.lastLoad.lines) || [],
          hash: T.hash(A.S), rng: A.rngState,
        };
      };
      out.a = runOnce(); out.b = runOnce();
      return out;
    }, [b64, SETUP.toString()]);
    const a = r.a, real = r.real;
    const okReal = !b64 || (!r.hadPosts && r.loaded !== false && real.posts > 0 && !real.audit.length && real.rng && (r.realPlay === 'ok' || r.realPlay === 'dead') && !r.realAudit.length);
    const okFix = a.rank === 7 && a.twoSeats === 1 && !a.deadSeat && !a.kidOff && !a.audit.length && a.lines.length >= 3 && a.hash === r.b.hash && a.rng === r.b.rng;
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
