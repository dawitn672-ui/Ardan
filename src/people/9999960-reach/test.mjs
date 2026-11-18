// Tests for R2 "every relationship needs a base" (9999960-reach, A.REACH; order 55, rule 19, D-065, D-080). See
// README.md. The engine's own unit tests (the owner's cases as pure decisions) are tests/v2/reach.test.js.

// in the page: a peasant player, his realm's ruler as a stranger with an even temper, and ways to shift the scales
const SETUP = () => {
  window.RH = {
    start(seed) {
      T.enter({ seed: seed || 551, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      const pc = A.pc(), r = A.realm(pc.realm), k = A.P(r.ruler);
      delete pc.rel[k.id]; delete k.rel[pc.id];
      k.traits = []; pc.fame = 5; pc.honor = 50; pc.coin = 20; pc.deeds = []; pc.noble = null; pc.mil = null;
      A.S.time = 9; A.S.queue = [];
      return { pc, k };
    },
    // a stranger noble of the realm for the origin cases: a lord of the given rung and birth, no traits
    lord(rung, status) {
      const pc = A.pc();
      const p = A.newPerson({ given: 'Aymer', sex: 'M', race: 'human', realm: pc.realm, cult: pc.cult, faith: pc.faith, born: A.S.year - 45, status, home: pc.home });
      p.noble = { rung, realm: pc.realm, holding: pc.home }; p.traits = [];
      return p;
    },
    share(lo, hi, act) { const v = A.REACH.view(lo, hi, act); return v.state === 'equal' || v.state === 'kin' ? 1 : v.yes; },
  };
};

export default {
  // a peasant cannot befriend the king, or even be known to him, without a base: the button is shut with its note, the
  // attempt (from anywhere) is refused with his reason, and the deeper acts are not offered
  async reachPeasantAndKing(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, k } = RH.start(551);
      const v = A.REACH.view(pc, k, 'know');
      UI.A.ov('person:' + k.id);
      const btn = [...document.querySelectorAll('button[data-a="know"]')].find(b => b.getAttribute('data-v') === String(k.id));
      const shut = !!btn && btn.disabled;
      UI.A.closeOv();
      const t0 = A.S.time, res = A.getToKnow(k.id);
      const opts = A.interactOptions(pc, k);
      return { state: v.state, nay: v.nay, shut, msg: res.msg, linked: !!pc.rel[k.id], spent: A.S.time === t0 - A.knowCost, court: opts.includes('date') || opts.includes('time') };
    }).toString() + ')()');
    const ok = r.state === 'closed' && /far beneath/.test(r.nay) && r.shut && /will not know you/.test(r.msg) && !r.linked && r.spent && !r.court;
    return { ok, detail: `state ${r.state}; the button shut ${r.shut}; "${r.msg}"; linked ${r.linked}; time spent ${r.spent}; friendship offered ${r.court}` };
  },

  // the same peasant, knighted (with a good name), renowned, or introduced by a friend at court, can sometimes:
  // the door is an attempt, and over many seeded tries some succeed and some fail; the reason names the shift
  async reachScalesShift(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const out = {};
      const trial = (name, shift) => {
        const { pc, k } = RH.start(552);
        shift(pc, k);
        const v = A.REACH.view(pc, k, 'know');
        let yes = 0, line = '';
        for (let s = 0; s < 40; s++) { delete pc.reachNo; const d = A.REACH.decide(k, pc, 'know', { log: false }); if (d.ok) { yes++; line = line || d.msg; } }
        out[name] = { state: v.state, yes, line };
      };
      trial('none', () => {});
      trial('knight', pc => { pc.noble = { rung: 2, realm: pc.realm, holding: pc.home }; pc.honor = 85; });
      trial('renown', pc => { pc.fame = 92; });
      trial('intro', (pc, k) => {
        const x = Object.values(A.S.people).find(p => p.alive && p.id !== pc.id && p.id !== k.id && A.isAdult(p) && A.classOf(p) >= 5);
        A.link(pc, x, 'friend', 70, 'friend'); A.link(x, k, 'friend', 70, 'friend');
      });
      return out;
    }).toString() + ')()');
    const some = x => x.state === 'try' && x.yes > 0 && x.yes < 40;
    const ok = r.none.yes === 0 && r.none.state === 'closed' && some(r.knight) && some(r.renown) && some(r.intro) && /knight of your name/.test(r.knight.line) && /speaks for you/.test(r.intro.line);
    return { ok, detail: Object.entries(r).map(([k, v]) => `${k}: ${v.state}, ${v.yes}/40${v.line ? ` ("${v.line}")` : ''}`).join('; ') };
  },

  // the owner's example: a baron risen from commoners sympathises more than a duke born to gold; and at one rank,
  // the risen man more than the born one
  async reachRisenAndBorn(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc } = RH.start(553);
      const risen = RH.lord(4, 'peasant'), born = RH.lord(4, 'noble'), duke = RH.lord(8, 'noble');
      duke.traits = ['proud'];
      return { risen: RH.share(pc, risen, 'know'), born: RH.share(pc, born, 'know'), duke: RH.share(pc, duke, 'know'), why: A.REACH.view(pc, risen, 'know').top, dukeWhy: A.REACH.view(pc, duke, 'know').nay };
    }).toString() + ')()');
    const ok = r.risen > r.born && r.born > r.duke && r.risen > .3 && r.duke < .05 && /born a peasant himself/.test(r.why);
    return { ok, detail: `the risen baron ${r.risen.toFixed(2)} ("${r.why}"), a born baron ${r.born.toFixed(2)}, the proud duke born to gold ${r.duke.toFixed(3)} ("${r.dukeWhy}")` };
  },

  // need opens doors: a count at war hears a peasant who is a fine swordsman ("he needs your sword") where he would not
  // hear a peasant with nothing he wants
  async reachNeedOpens(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc } = RH.start(554);
      const count = RH.lord(6, 'noble');
      const before = A.REACH.view(pc, count, 'audience');
      const atWar = A.atWar; A.atWar = rid => (rid === count.realm ? [{ id: 'test' }] : atWar(rid));
      // S1 (D-072): the player's skills live in pc.sk and p.skills is only their mirror, so a level is set through A.SK
      if (A.SK && A.SK.set) A.SK.set(pc, 'sword', A.SK.lvOfValue(75), 'test'); else pc.skills.sword = 75;
      // C9 (D-040): a skill works only at the level the body holds up, and this fresh peasant's body holds a sword at 30
      // (below the 40 a lord counts as a sword worth having). The test is about need, not the body: the cap is lifted
      // for the question and put back after
      const cap = A.skillCap; A.skillCap = null;
      try { const after = A.REACH.view(pc, count, 'audience'); return { before: before.state, after: after.state, why: after.top, yes: after.yes, arm: A.skill(pc, 'sword') }; } finally { A.atWar = atWar; A.skillCap = cap; }
    }).toString() + ')()');
    const ok = r.before === 'closed' && r.after !== 'closed' && /needs your sword/.test(r.why);
    return { ok, detail: `without need: ${r.before}; with a war and a sword arm (${r.arm}): ${r.after} ("${r.why}")` };
  },

  // NPC to NPC: the pull of a bond across a wide gap is small and below the pull across a narrow one; patronage and a
  // great house's match follow the same base
  async reachNpcBonds(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc } = RH.start(555);
      const ppl = Object.values(A.S.people).filter(p => p.alive && A.isAdult(p) && p.id !== pc.id);
      const low = ppl.filter(p => A.REACH.standing(p) <= 3).slice(0, 40), high = ppl.filter(p => A.REACH.standing(p) >= 6).slice(0, 20);
      let wide = 0, nw = 0, near = 0, nn = 0;
      for (const a of low) { for (const b of high) { wide += A.REACH.pull(a, b, 'befriend'); nw++; } for (const b of low) if (a !== b) { near += A.REACH.pull(a, b, 'befriend'); nn++; } }
      const patron = A.REACH.pickPatron(pc, high.slice(0, 8));
      return { wide: wide / Math.max(1, nw), near: near / Math.max(1, nn), nw, patron: patron ? A.REACH.standing(patron) : null };
    }).toString() + ')()');
    const ok = r.nw > 20 && r.wide < r.near / 3 && r.near > .9 && r.patron == null;
    return { ok, detail: `a friendship's pull across a wide gap ${r.wide.toFixed(3)} (${r.nw} pairs), across a narrow one ${r.near.toFixed(2)}; a great patron for a peasant: ${r.patron == null ? 'none' : r.patron}` };
  },

  // a record of the player's refusal is kept (bounded), a refusal stands for the year, and the reach state of an old save
  // (no reachNo, no orig) is read without error; the view draws nothing
  async reachStateAndPurity(pg) {
    const r = await pg.evaluate('(' + SETUP.toString() + ')();(' + (() => {
      const { pc, k } = RH.start(556);
      pc.noble = { rung: 2, realm: pc.realm, holding: pc.home }; pc.honor = 85;
      const s0 = A.rngState, h0 = T.hash(A.S);
      for (let i = 0; i < 20; i++) A.REACH.view(pc, k, 'know');
      UI.A.ov('person:' + k.id); UI.A.closeOv();
      const pure = A.rngState === s0 && T.hash(A.S) === h0;
      let refused = null;
      for (let i = 0; i < 60 && !refused; i++) { delete pc.reachNo; const d = A.REACH.decide(k, pc, 'know'); if (!d.ok) refused = d; }
      const stands = refused ? A.REACH.view(pc, k, 'know').state === 'closed' : false;
      const recs = A.WHY.log().filter(x => x.k === 'reach').length;
      for (let i = 0; i < 80; i++) { delete pc.reachNo; A.REACH.decide(k, pc, 'know'); }
      const capped = A.WHY.log().filter(x => x.k === 'reach').length <= 20;
      delete pc.reachNo; delete k.orig;
      const oldSave = A.REACH.view(pc, k, 'befriend').state;   // no reachNo, no orig: read as an old save would be
      return { pure, refused: !!refused, stands, recs, capped, oldSave };
    }).toString() + ')()');
    const ok = r.pure && r.refused && r.stands && r.recs >= 1 && r.capped && !!r.oldSave;
    return { ok, detail: JSON.stringify(r) };
  },
};
