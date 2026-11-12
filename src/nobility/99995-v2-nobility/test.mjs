// v2 nobility (docs/V2_SPEC.md complaint 13, integration step 6): the pyramid's caps in every realm, one count per
// county, lower nobles the same each time they are met, one holder per title over ten seeds, and the court view.
export default {
  // caps hold in every realm over three seeds; each tier's numbers per the spec; a large realm has nobles by the hundred
  async v2nCaps(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], rows = [];
      for (const seed of [7, 31, 2024]) {
        T.enter({ seed, status: 'noble', realm: 'POL-01' });
        const N = A.V2N;
        for (const [rid, c] of Object.entries(A.S.court.realms)) {
          const s = c.summary, T2 = c.titles;
          if (s.dukes > 3) bad.push(`${seed} ${rid}: ${s.dukes} dukes`);
          if (s.marquises > 6) bad.push(`${seed} ${rid}: ${s.marquises} marquises`);
          if (s.dukes && s.marquises > 3 * s.dukes) bad.push(`${seed} ${rid}: ${s.marquises} marquises to ${s.dukes} dukes`);
          for (const m of T2.filter(t => t.rank === 'marquis')) {
            const prov = A.S.prov[m.seat], inR = q => A.S.prov[q] && A.S.prov[q].owner === rid;
            if (!(prov.adj || []).some(q => !inR(q))) bad.push(`${seed} ${rid}: the ${m.name} is not on the border`);
          }
          for (const ct of T2.filter(t => t.rank === 'count')) {
            if (ct.viscounts < 2 || ct.viscounts > 3) bad.push(`${seed} ${ct.name}: ${ct.viscounts} viscounts`);
            if (ct.barons < 2 * ct.viscounts || ct.barons > 4 * ct.viscounts) bad.push(`${seed} ${ct.name}: ${ct.barons} barons`);
            if (ct.lords < 3 * ct.barons || ct.lords > 6 * ct.barons) bad.push(`${seed} ${ct.name}: ${ct.lords} lords`);
          }
          const per = N.total(c) / Math.max(1, s.counts);
          if (s.counts >= 10 && (per < 30 || per > 60)) bad.push(`${seed} ${rid}: ${per.toFixed(1)} nobles a county`);
          if (s.counts >= 20) rows.push(`${seed} ${rid}: ${s.counts} counties, ${N.total(c)} nobles (${s.dukes} dukes, ${s.marquises} marquises)`);
          if (s.counts >= 24 && s.dukes < 2) bad.push(`${seed} ${rid}: ${s.counts} counties but ${s.dukes} dukes`);
        }
      }
      return { bad, rows };
    });
    return { ok: !r.bad.length, detail: r.bad.slice(0, 6).join('; ') || r.rows.slice(0, 4).join('; ') };
  },

  // one count per county (from A.S.prov owners at world start); dukes, marquises and counts are stored people with houses
  async v2nCounties(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      let named = 0, kept = 0;
      for (const seed of [7, 31]) {
        T.enter({ seed, status: 'peasant', realm: 'POL-03' });
        const N = A.V2N, S = A.S;
        for (const q of S.prov) {
          const c = N.court(q.owner);
          if (!A.realm(q.owner)) continue;
          const cs = c ? c.titles.filter(t => t.rank === 'count' && t.seat === q.id) : [];
          if (cs.length !== 1) { bad.push(`${seed} ${q.name}: ${cs.length} counts`); continue; }
          const t = cs[0], p = N.holderOf(t), r = A.realm(q.owner);
          if (!!t.crown !== (q.id === r.capitalProv) && !(t.crown && !S.prov.some(x => x.owner === r.id && x.id === r.capitalProv))) bad.push(`${seed} ${q.name}: crown ${t.crown}`);
          if (!p) { bad.push(`${seed} ${q.name}: no holder`); continue; }
          if (!t.crown) {
            named++;
            if (!p.noble || p.noble.rung < 6 || p.noble.holding !== q.id) bad.push(`${seed} ${q.name}: holder's rung ${JSON.stringify(p.noble)}`);
            const h = S.houses[p.house];
            if (!h || h.headPid !== p.id) bad.push(`${seed} ${q.name}: holder heads no house`);
            if (h && !h.v2court) kept++;
          }
        }
        for (const c of Object.values(S.court.realms)) for (const t of c.titles.filter(t => t.rank === 'duke' || t.rank === 'marquis')) {
          const p = N.holderOf(t);
          if (!p || !S.people[p.id] || p.noble.rung !== N.RUNG[t.rank] || !S.houses[p.house]) bad.push(`${seed} ${t.name}: no stored holder of rank`);
        }
        if (A.V2F.audit().length) bad.push(`${seed}: audit ${JSON.stringify(A.V2F.audit()[0])}`);
      }
      return { bad, named, kept };
    });
    return { ok: !r.bad.length && r.kept > 0, detail: r.bad.slice(0, 6).join('; ') || `${r.named} counties with a named lord, ${r.kept} of them the release's own great houses` };
  },

  // a lower noble is the same each time: read twice, read after a year, met twice, and a grant takes a free slot
  async v2nLowerSame(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      T.enter({ seed: 515, status: 'noble', realm: 'POL-01' });
      const N = A.V2N, S = A.S;
      const ct = S.court.realms['POL-01'].titles.filter(t => t.rank === 'count' && !t.crown)[3];
      const look = () => ['viscount', 'baron', 'lord'].map(rank => JSON.stringify(N.lower('POL-01', ct.seat, rank, 1))).join();
      const s0 = A.rngState, h0 = T.hash(S.court), a = look(), b = look();
      if (a !== b) bad.push('read twice, two nobles');
      if (A.rngState !== s0 || T.hash(S.court) !== h0) bad.push('reading a lower noble moved the stream or the court');
      T.play(1);
      if (look() !== a) bad.push('a year later, a different noble');
      const g = N.lower('POL-01', ct.seat, 'baron', 2);
      const p1 = N.meet('POL-01', ct.seat, 'baron', 2), p2 = N.meet('POL-01', ct.seat, 'baron', 2);
      if (!p1 || p1 !== p2) bad.push('met twice, two people');
      if (p1 && (p1.given !== g.given || A.nobleTitle(p1) !== g.title)) bad.push(`met: ${p1.given} ${A.nobleTitle(p1)}, read: ${g.given} ${g.title}`);
      const again = N.lower('POL-01', ct.seat, 'baron', 2);
      if (again.pid !== p1.id || again.given !== g.given) bad.push('after meeting, the slot names someone else');
      // a fresh barony with no county takes a free slot (a grant when every county has its count)
      const pc = A.pc(); pc.noble = { rung: 4, realm: 'POL-01', holding: A.V2F.freeHolding('POL-01', pc.home, pc) };
      if (pc.noble.holding != null) bad.push('a free county was left for a barony: ' + pc.noble.holding);
      const f = N.grantFief(pc);
      if (!f || !/^Baron(ess)? of /.test(A.nobleTitle(pc))) bad.push('the grant took no slot: ' + A.nobleTitle(pc));
      if (f && N.lower('POL-01', f.county, 'baron', f.i).pid !== pc.id) bad.push('the granted slot names someone else');
      return { bad, g: `${g.given} ${g.house}, ${g.title}; you: ${A.nobleTitle(pc)}` };
    });
    return { ok: !r.bad.length, detail: r.bad.join('; ') || r.g };
  },

  // one holder per title over ten seeds and ten years: the family lane's audit, and no title key on two living people
  async v2nOneHolder(pg) {
    const r = await pg.evaluate(() => {
      const bad = [];
      let moved = 0, vacant = 0, titles = 0;
      for (let seed = 101; seed <= 110; seed++) {
        T.enter({ seed, status: seed % 2 ? 'noble' : 'peasant', realm: seed % 3 ? 'POL-01' : 'POL-03', startAge: 16 });
        const N = A.V2N, S = A.S;
        const first = {};
        for (const c of Object.values(S.court.realms)) for (const t of c.titles) if (t.pid) first[t.k] = t.pid;
        T.play(10);
        if (!A.pc()) continue;
        const by = {};
        for (const p of Object.values(S.people)) if (p.alive && p.noble) for (const k of [p.noble.court, ...(p.noble.more || [])].filter(Boolean)) (by[k] = by[k] || []).push(p.id);
        for (const k in by) if (by[k].length > 1) bad.push(`${seed} ${k}: ${by[k].join(',')}`);
        for (const c of Object.values(S.court.realms)) for (const t of c.titles) {
          if (t.crown || t.heldWith || t.rank === 'king') continue;
          titles++;
          const p = N.holderOf(t);
          if (!p) vacant++; else if (p.id !== first[t.k]) moved++;
        }
        const au = A.V2F.audit();
        if (au.length) bad.push(`${seed}: ${JSON.stringify(au[0])}`);
      }
      return { bad, moved, vacant, titles };
    });
    return { ok: !r.bad.length && r.moved > 0 && r.vacant < r.titles * 0.1, detail: r.bad.slice(0, 5).join('; ') || `${r.titles} titles over 10 seeds: ${r.moved} passed by inheritance, ${r.vacant} vacant` };
  },

  // playtest 1 #25: vacant titles are regranted by the liege, so vacancies stay low over 20 years (3 seeds); one holder
  // per title throughout; the view says "vacant since …, the king's to give" and never "holds" for a vacant title
  async v2nRegrant(pg) {
    const r = await pg.evaluate(() => {
      const bad = [], rows = [];
      let grants = 0;
      for (const seed of [201, 202, 203]) {
        T.enter({ seed, status: 'noble', realm: 'POL-01', startAge: 16 });
        const N = A.V2N, S = A.S, all = () => Object.values(S.court.realms).flatMap(c => c.titles).filter(t => !t.crown && !t.heldWith && t.rank !== 'king');
        const g0 = N.regrant; N.regrant = function (t) { const x = g0.apply(this, arguments); if (x) grants++; return x; };
        let worst = 0;
        T.play(20, { each: () => { const v = all().filter(t => !N.holderOf(t)).length; worst = Math.max(worst, v); } });
        N.regrant = g0;
        if (!A.pc()) continue;
        const ts = all(), vac = ts.filter(t => !N.holderOf(t));
        rows.push(`${seed}: ${vac.length} of ${ts.length} vacant after 20 years (worst ${worst})`);
        if (worst > ts.length * 0.05) bad.push(`${seed}: ${worst} of ${ts.length} vacant at worst`);
        const by = {};
        for (const p of Object.values(S.people)) if (p.alive && p.noble) for (const k of [p.noble.court, ...(p.noble.more || [])].filter(Boolean)) (by[k] = by[k] || []).push(p.id);
        for (const k in by) if (by[k].length > 1) bad.push(`${seed} ${k}: two holders`);
        if (A.V2F.audit().length) bad.push(`${seed}: ${JSON.stringify(A.V2F.audit()[0])}`);
        // a vacant duchy in words: force one and draw the card
        const d = ts.find(t => t.rank === 'duke' && t.k.startsWith('POL-01:'));
        if (d) {
          const p = N.holderOf(d), keep = p.noble; p.noble = null; d.vacant = S.year;
          const html = UI.v2nCourtCard(A.realm('POL-01'), A.pc()), row = html.split('v2n-row').find(x => x.includes(d.name.replace('Duchy of ', '')) && /vacant since/.test(x)) || '';
          if (!/vacant since \d+, the \w[\w-]*(&#39;|&#x27;|')s to give/.test(row)) bad.push('no "vacant since …, the …\'s to give"');
          if (/Holds the duchy/.test(row)) bad.push('a vacant duchy "holds"');
          p.noble = keep; delete d.vacant;
        }
      }
      return { bad, rows, grants };
    });
    return { ok: !r.bad.length && r.grants > 0, detail: r.bad.slice(0, 5).join('; ') || `${r.grants} titles regranted; ` + r.rows.join('; ') };
  },

  // round 2 A0 (docs/CRITIQUE.md R5): a vacant county whose old house has no head, and no one to take it. N.regrant read
  // the headless house's head (null) after it had raised a new house: it threw, the new house sat in the county with
  // nobody seated, the month's pass stopped, and the audit found two lords of one seat for good (seed 7, 1159-60). Now
  // the new house is seated, the old one leaves the county and the audit stays empty; a failure while raising the
  // house takes back every person and house it made; and one title's failure does not stop the pass.
  async v2nRegrantHeadless(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, status: 'peasant', realm: 'POL-01', startAge: 16 });
      const N = A.V2N, F = A.V2F, S = A.S, bad = [], seen = [];
      const audit0 = F.audit().length;
      const ts = Object.values(S.court.realms).flatMap(c => c.titles).filter(t => {
        if (t.rank !== 'count' || t.crown || t.heldWith || !t.house || !S.houses[t.house]) return false;
        const p = N.holderOf(t); return p && p.id !== S.pc && !p.ruler && S.houses[t.house].headPid === p.id && F.seatProv(S.houses[t.house]) === t.seat;
      }).slice(0, 4);
      if (ts.length < 4) return { bad: [`only ${ts.length} counties to test`], seen };
      // the holder dies with no heir; his house is left without a head, still seated in the county
      const headless = t => { const p = N.holderOf(t), h = S.houses[t.house]; p.alive = false; p.noble.passed = null; h.headPid = null; return h; };
      const cf = N.candidateFor, gn = A.genNoble, rg = N.regrant, ce = console.error, logged = [];
      N.candidateFor = () => null;
      console.error = (...a) => logged.push(a.map(String).join(' ').slice(0, 120));
      try {
        // 1. the case that threw: a new house takes the county, the headless one leaves it
        const t1 = ts[0], h1 = headless(t1);
        let g = null; try { g = N.regrant(t1); } catch (e) { bad.push('regrant threw: ' + String(e).slice(0, 120)); }
        const p1 = N.holderOf(t1);
        if (!g || g.why !== 'new' || !p1) bad.push(`no new holder (${JSON.stringify(g)})`);
        else if (p1.house === h1.id) bad.push('the headless house kept the county');
        if (F.seatProv(h1) === t1.seat) bad.push('the headless house still sits in the county');
        if (t1.vacant) bad.push('the county is still marked vacant');
        seen.push(`1: ${t1.name} to ${p1 ? A.fullName(p1, false) : '-'} (${g && g.why}); old house's seat ${h1.seat}`);
        // 2. raising the new house fails: nothing it made is left behind, and the county waits
        const t2 = ts[1]; headless(t2);
        const nP = Object.keys(S.people).length, nH = Object.keys(S.houses).length, id0 = S.nextId;
        A.genNoble = function () { throw new Error('test: genNoble refused'); };
        let threw = false; try { N.regrant(t2); } catch (e) { threw = true; }
        A.genNoble = gn;
        if (!threw) bad.push('a failed raise did not report itself');
        if (Object.keys(S.people).length !== nP || Object.keys(S.houses).length !== nH || S.nextId !== id0) bad.push(`a failed raise left ${Object.keys(S.people).length - nP} people and ${Object.keys(S.houses).length - nH} houses (nextId ${id0} -> ${S.nextId})`);
        if (N.holderOf(t2)) bad.push('the failed county has a holder');
        seen.push(`2: failed raise left ${Object.keys(S.people).length - nP} people, ${Object.keys(S.houses).length - nH} houses`);
        // 3. one title throws in the monthly pass: the next one is still granted
        const t3 = ts[2], t4 = ts[3]; headless(t3); headless(t4);
        for (const t of [t2, t3, t4]) { t.vacant = S.year - 1; t.vacN = 30; }
        N.regrant = function (t) { if (t === t3) throw new Error('test: one title fails'); return rg.apply(this, arguments); };
        let pass = null; try { pass = N.regrantMonth(); } catch (e) { bad.push('the pass threw: ' + String(e).slice(0, 120)); }
        N.regrant = rg;
        if (!pass || !pass.some(x => x.t === t4.k)) bad.push('the pass stopped at the failing title');
        if (!N.holderOf(t2)) bad.push('the county whose raise failed was not granted next month');
        if (!logged.some(s => /v2-nobility regrant/.test(s))) bad.push('the failure was not logged');
        seen.push(`3: pass granted ${(pass || []).map(x => x.t).join(', ')}; logged ${logged.length}`);
      } finally { N.candidateFor = cf; A.genNoble = gn; N.regrant = rg; console.error = ce; }
      const au = F.audit();
      if (au.length > audit0) bad.push('audit: ' + JSON.stringify(au[0]).slice(0, 200));
      return { bad, seen };
    });
    return { ok: !r.bad.length, detail: r.bad.slice(0, 5).join('; ') || r.seen.join('; ') };
  },

  // the council's border office is not styled as a rank (playtest 1 #14)
  async v2nOneRankWord(pg) {
    const r = await pg.evaluate(() => { T.enter({ seed: 7, status: 'noble', realm: 'POL-01' }); return { n: A.POL && A.POL.offName ? A.POL.offName('warden', 'POL-01') : GD.POL_OFFICES.warden.n }; });
    return { ok: !/March|Duke|Marquis|Count/.test(r.n), detail: r.n };
  },

  // the court view lists the pyramid in words, without percentages, and fits 420 and 1366 px; calling on a viscount
  // stores that one person
  async v2nCourtView(pg) {
    const out = [];
    for (const w of [420, 1366]) {
      await pg.setViewportSize({ width: w, height: 900 });
      const r = await pg.evaluate(() => {
        T.enter({ seed: 7, status: 'noble', realm: 'POL-01', startAge: 20 });
        const s0 = A.rngState, h0 = T.hash(A.S);
        UI.tab = 'realm'; UI.render();
        const card = document.querySelector('.v2n-court');
        const st = { card: !!card, pure: A.rngState === s0 && T.hash(A.S) === h0 };
        if (card) {
          card.scrollIntoView();
          st.text = card.innerText;
          st.wide = card.getBoundingClientRect().right > window.innerWidth + 1;
          st.who = [card, ...card.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 3).map(el => el.tagName + '.' + el.className + ':' + Math.round(el.getBoundingClientRect().right) + '/' + window.innerWidth);
          st.rows = card.querySelectorAll('.v2n-row').length;
          const meet = card.querySelector('[data-a="v2nMeet"]');
          if (meet) { const n0 = Object.keys(A.S.people).length; meet.click(); st.met = Object.keys(A.S.people).length - n0; st.ov = String(UI.ov || ''); }
        }
        return st;
      });
      if (r.card) { await pg.evaluate(() => { UI.ov = null; UI.render(); document.querySelector('.v2n-court').scrollIntoView(); }); }
      try { const fs = await import('node:fs'); fs.mkdirSync('/tmp/ardan/nobility/shots', { recursive: true }); await pg.screenshot({ path: `/tmp/ardan/nobility/shots/court-${w}.png` }); } catch (e) { /* screenshots are for looking, not for passing */ }
      out.push({ w, ...r });
    }
    const bad = [];
    for (const r of out) {
      if (!r.card) { bad.push(`${r.w}px: no court card`); continue; }
      if (!r.pure) bad.push(`${r.w}px: drawing the court moved the stream or the state`);
      if (/%/.test(r.text)) bad.push(`${r.w}px: a percentage`);
      if (r.wide || (r.who || []).length) bad.push(`${r.w}px: wider than the screen (${(r.who || []).join(', ')})`);
      if (!/viscounts/.test(r.text) || !/barons/.test(r.text) || !/lords/.test(r.text)) bad.push(`${r.w}px: lower tiers not counted`);
      if (r.rows > 14) bad.push(`${r.w}px: ${r.rows} rows`);
      if (r.met !== 1 || !/^person:/.test(r.ov)) bad.push(`${r.w}px: calling on a viscount stored ${r.met} people`);
    }
    return { ok: !bad.length, detail: bad.join('; ') || out.map(r => `${r.w}px: ${r.rows} rows`).join(', ') + '; ' + out[0].text.split('\n')[0].slice(0, 160) };
  },
};
