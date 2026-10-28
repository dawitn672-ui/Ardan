// 9992-identity: arms you design and see wherever your house shows, things you name and remember, the epithet's scene,
// inner voices that never change the world, and thoughts that cost while held and ripen into a trait.
export default {
  async idArms(pg) {
    const r = await pg.evaluate(() => {
      A.J = null; A.journalStart();
      T.enter({ seed: 91, race: 'human', realm: 'POL-01', status: 'merchant', sex: 'M', startAge: 24 });
      const pc = A.pc();
      UI.A.idArms();
      const designer = !!document.querySelector('#modal .id-designer'), swatches = document.querySelectorAll('#modal [data-a="idArm"]').length;
      document.querySelector('#modal [data-v="f:azure"]').click();
      document.querySelector('#modal [data-v="ord:chevron"]').click();
      document.querySelector('#modal [data-v="f2:argent"]').click();
      document.querySelector('#modal [data-v="ch:wolf"]').click();
      document.querySelector('#modal [data-v="c:or"]').click();
      const inp = document.getElementById('idWords'); inp.value = 'Hold <b>"Fast"</b> 1105'; document.querySelector('#modal [data-a="idWords"]').click();
      const prev = document.querySelector('#modal .id-d-prev svg');
      UI.A.closeOv();
      const m = JSON.parse(JSON.stringify(pc.mark));
      UI.tab = 'life'; UI.render();
      const card = document.querySelector('#tabbody .id-mark'), coat = card && card.querySelector('svg.id-coat[data-ord="chevron"]');
      // the journal replays the arms
      T.play(1);
      const want = T.hash(JSON.parse(A.serialize()));
      const J = JSON.parse(JSON.stringify(A.J));
      const rep = A.replay(J);
      const same = T.hash(JSON.parse(A.serialize())) === want;
      // found a house: the heralds register the device as the house's arms, and every house chip draws it
      const pc1 = A.pc(); pc1.fame = 30; pc1.coin = 2000;
      A.decide('found_house', 'Wolfmoor');
      const h = A.S.houses[pc1.house];
      UI.render();
      const chip = document.querySelector(`[data-v="house:${pc1.house}"] svg.id-coat`);
      // a change made now goes to the house
      A.idSetArms('ch', 'bear');
      return { designer, swatches, prevOrd: prev && prev.getAttribute('data-ord'), m, card: !!card, coat: !!coat, house: h && { colors: h.colors, charge: h.charge, ord: h.ord, f2: h.f2, words: h.words }, chip: !!chip, bear: (A.S.houses[pc1.house] || {}).charge, rep: rep && (rep.ok !== false), why: rep && (rep.why || rep.errors && rep.errors[0]), same };
    });
    const ok = r.designer && r.swatches > 40 && r.prevOrd === 'chevron' && r.m.f === 'azure' && r.m.ch === 'wolf' && r.m.ord === 'chevron' && r.m.words === 'Hold bFastb' &&
      r.card && r.coat && r.house && r.house.ord === 'chevron' && r.house.colors[0] === '#2f5aa8' && r.house.words === 'Hold bFastb' && r.chip && r.bear === 'bear' && r.same;
    return { ok, detail: `designer ${r.designer} (${r.swatches} options), mark ${JSON.stringify(r.m)}, Life card ${r.card}/${r.coat}, house ${JSON.stringify(r.house)}, house chip draws it ${r.chip}, replay same ${r.same} ${r.why || ''}` };
  },

  async idNamed(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 92, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 });
      const pc = A.pc(), ID = A.ID;
      // the pup: its choice names the dog with an offered name
      const q = { type: 'event', ev: 'ix_pup', ctx: {} }; A.S.queue.unshift(q);
      const v = A.eventView(q);
      A.eventChoose(v.choices[0].i); A.eventClose();
      const dog = ID.named(pc, 'dog'), offered = v.choices[0].t;
      const tok = A.T('{dog} sleeps by the door.', A.ctxTokens(pc, {}));
      // ten years on, the last winter: remembered in pc.named.past and in the deeds
      dog.y -= 11;
      const q2 = { type: 'event', ev: 'ix_dog_old', ctx: {} }; A.S.queue.unshift(q2);
      const ok2 = A.EV.ix_dog_old.cond(pc, A.C); const v2 = A.eventView(q2);
      A.eventChoose(v2.choices[0].i); A.eventClose();
      const past = pc.named.past[pc.named.past.length - 1], deed = (pc.deeds || []).some(d => /^Buried /.test(d.t));
      const gone = ID.named(pc, 'dog'), drop = A.T('{dog}', A.ctxTokens(pc, {}));
      // a horse named from the screen; sold, it is remembered as parted with
      pc.gear.mount = 'horse';
      const named = A.idName('horse', 'Ash<script>grey');
      const hn = ID.named(pc, 'horse').n;
      UI.tab = 'life'; UI.render();
      const shown = (document.querySelector('#tabbody .id-mark') || {}).textContent || '';
      pc.gear.mount = null; ID.month(pc);
      const hp = pc.named.past[pc.named.past.length - 1];
      return { offered, dog: dog && dog.n, tok, ok2, past, deed, gone: !!gone, drop, named, hn, shown: shown.includes('Ashscriptgrey'), hp };
    });
    const ok = r.dog && r.offered.includes(r.dog) && r.tok === `${r.dog} sleeps by the door.` && r.ok2 && r.past.kind === 'dog' && r.past.how === 'died' && r.deed && !r.gone && r.drop === '{dog}' &&
      r.named && r.hn === 'Ashscriptgrey' && r.shown && r.hp.n === 'Ashscriptgrey' && r.hp.how === 'parted with';
    return { ok, detail: `dog ${r.dog} ("${r.offered}"), token "${r.tok}", died: ${JSON.stringify(r.past)} deed ${r.deed}; horse ${r.hn} shown ${r.shown}, then ${r.hp && r.hp.how}` };
  },

  async idEpithet(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 93, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'M', startAge: 22 });
      const pc = A.pc();
      A.ID.month(pc);                       // the first look: nothing to say
      const quiet = !A.S.queue.some(q => q.ev === 'ix_epithet');
      pc.epithet = 'the Bold';
      A.ID.month(pc);
      const q = A.S.queue.find(q => q.ev === 'ix_epithet'), v = q && A.eventView(q);
      // an old save: a life already called something says nothing the first time it is seen
      const o = JSON.parse(A.serialize()), id = o.pc;
      delete o.people[id].idEp; o.people[id].epithet = 'the Old'; A.S.queue = [];
      A.deserialize(JSON.stringify(o)); const p2 = A.pc(); A.S.queue = A.S.queue.filter(x => x.ev !== 'ix_epithet'); A.ID.month(p2);
      return { quiet, queued: !!q, title: v && v.title, text: v && v.text, oldQuiet: !A.S.queue.some(q => q.ev === 'ix_epithet'), list: p2.idEp };
    });
    const ok = r.quiet && r.queued && /the Bold/.test(r.text) && !/\{/.test(r.text) && r.oldQuiet && r.list.length === 1;
    return { ok, detail: `queued ${r.queued}: "${r.text && r.text.slice(0, 80)}…"; old save quiet ${r.oldQuiet}` };
  },

  async idVoicePure(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 94, race: 'human', realm: 'POL-01', status: 'gentry', sex: 'F', startAge: 19 });
      T.play(2);
      const pc = A.pc();
      const ids = Object.keys(A.EV).filter(id => { const e = A.EV[id]; if (e.trigger || (pc.flags.ev && pc.flags.ev[id] != null)) return false; try { return e.cond(pc, A.C); } catch (x) { return false; } }).slice(0, 60);
      let voiced = 0, moved = 0, differ = 0, long = 0, raw = 0;
      const lines = new Set();
      for (const id of ids) {
        const q = { type: 'event', ev: id, ctx: {} };
        A.S.queue.unshift(q);
        const v = A.eventView(q);
        if (v.skip) { A.S.queue.shift(); continue; }
        const h0 = T.hash(A.S), r0 = A.rngState;
        const vt = () => { const x = document.querySelector('#modal .idv-voice'); return x ? x.textContent : ''; };
        UI.renderModal(); const a = vt();
        UI.renderModal(); const b = vt();
        if (T.hash(A.S) !== h0 || A.rngState !== r0) moved++;
        if (a !== b) differ++;
        const el = document.querySelector('#modal .idv-voice');
        if (el) { voiced++; const t = el.querySelector('.idv-line').textContent; lines.add(t); if (t.split(/\s+/).length > 14) long++; if (T.raw.test(t)) raw++; }
        A.S.queue.shift();
      }
      UI.renderModal();
      // a scene met before is quiet
      const id0 = ids.find(id => A.ID.voiceFor(pc, { type: 'event', ev: id, ctx: {}, view: {} }));
      pc.flags.ev[id0] = A.S.year - 1;
      const quiet = !A.ID.voiceFor(pc, { type: 'event', ev: id0, ctx: {}, view: {} });
      UI.set.innerVoice = false; const off = !A.ID.voiceFor(pc, { type: 'event', ev: ids[1], ctx: {}, view: {} }); UI.set.innerVoice = true;
      return { n: ids.length, voiced, moved, differ, long, raw, distinct: lines.size, quiet, off };
    });
    const ok = r.voiced >= 10 && r.voiced < r.n && !r.moved && !r.differ && !r.long && !r.raw && r.distinct >= 5 && r.quiet && r.off;
    return { ok, detail: `${r.voiced} of ${r.n} scenes voiced (${r.distinct} lines), draws that moved state or dice ${r.moved}, drawings that differed ${r.differ}, over 14 words ${r.long}; a seen scene quiet ${r.quiet}; setting off ${r.off}` };
  },

  async idThoughts(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 95, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), ID = A.ID;
      pc.traits = (pc.traits || []).filter(t => t !== 'wrathful' && t !== 'calm');
      const ck = { s: 'diplomacy', d: 45 }, ck2 = { s: 'melee', d: 45 };
      const d0 = A.checkVal(pc, ck), m0 = A.checkVal(pc, ck2);
      A.applyFx(pc, { thought: 'steel' }, {});
      const held = pc.thoughts && pc.thoughts.held.steel != null, d1 = A.checkVal(pc, ck);
      UI.tab = 'life'; UI.render();
      const shown = ((document.querySelector('#tabbody .id-thoughts') || {}).textContent || '').includes('Steel answers');
      // a third thought pushes the oldest out
      A.applyFx(pc, { thought: 'seed' }, {}); A.applyFx(pc, { thought: 'road' }, {});
      const slots = Object.keys(pc.thoughts.held).length, pushed = pc.thoughts.dropped.steel != null;
      A.thDrop('road'); A.applyFx(pc, { thought: 'steel' }, {});    // dropped once: may be taken up again only through a scene
      delete pc.thoughts.dropped.steel; A.ID.adopt(pc, 'steel');
      pc.thoughts.held.steel -= 13 * 30; ID.thoughtMonth(pc);
      const ripe = pc.thoughts.ripe.steel != null, trait = pc.traits.includes('wrathful');
      const d2 = A.checkVal(pc, ck), m2 = A.checkVal(pc, ck2);
      // an old save: no thoughts at all
      delete pc.thoughts; const d3 = A.checkVal(pc, ck); UI.render();
      return { d0, d1, d2, d3, m0, m2, held, shown, slots, pushed, ripe, trait };
    });
    const ok = r.held && r.d1 < r.d0 && r.shown && r.slots === 2 && r.pushed && r.ripe && r.trait && r.d2 < r.d1 && r.m2 > r.m0 + 2 && Math.abs(r.d3 - r.d0) < 0.5;
    return { ok, detail: `diplomacy check ${r.d0.toFixed(1)} -> held ${r.d1.toFixed(1)} -> ripe ${r.d2.toFixed(1)}; melee ${r.m0.toFixed(1)} -> ${r.m2.toFixed(1)}; two slots ${r.slots}; ripened ${r.ripe}, wrathful ${r.trait}` };
  },

  async idOldSave(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 96, race: 'dwarf', realm: 'POL-01', status: 'artisan', sex: 'F', startAge: 30 });
      T.play(1);
      const o = JSON.parse(A.serialize());
      for (const id in o.people) { const p = o.people[id]; delete p.mark; delete p.named; delete p.idEp; delete p.thoughts; delete p.chap; }
      A.deserialize(JSON.stringify(o));
      UI.screen = 'game';
      T.renderAll();
      const res = T.play(2);
      T.renderAll();
      return { res, alive: A.pc().alive, ep: Array.isArray(A.pc().idEp) };
    });
    return { ok: r.res !== undefined && r.ep, detail: `an old save without the new fields loads, plays two years and draws every tab (${r.res})` };
  },
};
