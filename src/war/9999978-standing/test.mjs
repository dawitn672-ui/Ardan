// Tests for 9999978-standing, the standing military (the owner's order 95, D-194). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

export default {
  // order 95: regular soldiers in the tens to hundreds of thousands by the kingdom, knights 50 to 3,000, the elite as many as the level's difficulty lets rise;
  // order 93: soldiers 80-180, knights 230-299, the elite 300-420 by the realm. Three worlds at their birth.
  async msSizes(pg) {
    const r = await pg.evaluate(() => {
      const out = [], bad = [];
      for (const seed of [9781, 9782, 9783]) {
        T.enter({ seed, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
        let big = 0, small = 1e9;
        for (const r of Object.values(A.S.realms)) {
          if (!r.alive || r.isRebel) continue;
          const M = A.MIL, n = M.normal(r), kn = M.kn(r), lv = M.levels(r), E = M.elite(r), B = M.knightsBy(r), K = M.K(r);
          const pop = M.pop(r);
          if (r.race !== 'giant' && pop >= M.D.floorPop && n < Math.min(9000, M.income(r) * K.pay / M.D.upkeep * 0.95)) bad.push(`${seed} ${r.id}: ${n} regulars for ${pop} people`);
          // the world's first regiments are whole divisions (A.forcesInit), so its host is its normal one within a division
          const div = Math.max(0, ...Object.keys(r.forces ? r.forces.tpl : {}).map(t => (A.tplS(r.id, t) || {}).men || 0));
          if (Math.abs(r.army - n) > Math.max(div, n * 0.12)) bad.push(`${seed} ${r.id}: army ${r.army} against its normal host ${n}`);
          if (kn.t < K.kMin || kn.t > Math.max(K.kMax, kn.o + K.kMin)) bad.push(`${seed} ${r.id}: ${kn.t} knights`);
          if (B.c + B.o + B.houses.reduce((a, x) => a + x[1], 0) !== B.t) bad.push(`${seed} ${r.id}: knights dealt ${JSON.stringify(B)}`);
          if (kn.c + kn.o + Object.values(kn.h).reduce((a, x) => a + x, 0) !== kn.t) bad.push(`${seed} ${r.id}: knights by command`);
          if (r.race !== 'giant') {
            if (lv.soldier < 80 || lv.soldier > 180) bad.push(`${seed} ${r.id}: soldiers at ${lv.soldier}`);
            if (lv.knight < 230 || lv.knight > 299) bad.push(`${seed} ${r.id}: knights at ${lv.knight}`);
            if (lv.elite[0] < 300 || lv.elite[1] > 420) bad.push(`${seed} ${r.id}: the elite at ${lv.elite}`);
          }
          // the realm's own people at the elite's level first, then named champions up to the drawn count
          const real = E.filter(x => x.pid).length;
          if (E.length !== Math.max(real, M.eliteCount(r))) bad.push(`${seed} ${r.id}: ${E.length} of the elite (${real} real, ${M.eliteCount(r)} drawn)`);
          for (const x of E) if (x.level < lv.elite[0] || (!x.pid && x.level > lv.elite[1])) bad.push(`${seed} ${r.id}: ${x.name} at ${x.level}`);
          if (E.some(x => !x.name || /undefined|null/.test(x.name))) bad.push(`${seed} ${r.id}: an elite with no name`);
          big = Math.max(big, r.army); if (pop >= M.D.floorPop && r.race === 'human') small = Math.min(small, r.army);
        }
        out.push({ seed, big, small });
        if (big < 150000 || big > 400000) bad.push(`${seed}: the greatest host ${big}`);
      }
      return { out, bad };
    });
    return { ok: !r.bad.length, detail: JSON.stringify(r.out) + (r.bad.length ? ' bad: ' + r.bad.slice(0, 6).join('; ') : '') };
  },

  // the owner's correction to order 97: the elite have no set number. The count emerges from how hard the level is to reach
  // in the realm (its people, make, great houses, wealth, schools of war, orders, veterans), a seeded draw with a heavy tail
  // and no cap: pooled over 2,000 worlds' seeds a realm's count spreads wide (an empire can have 2, or 30, or 72), and each
  // factor moves the mean. (Measured on seed 9810's world, 2,000 seeds each: Aldmark expects 17.9, p5 5, p50 16, p95 37,
  // the most 91; Zanara 29.5, the most 133; Lucerna 0.7, Northreach 1.0; the bars are set outside that spread.)
  async msEliteEmerges(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9810, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const M = A.MIL, s0 = A.S.seed, bad = [], N = 2000;
      const pool = (r, n) => { const c = []; for (let s = 1; s <= n; s++) { A.S.seed = s; c.push(M.eliteCount(r)); } A.S.seed = s0; return c.sort((a, b) => a - b); };
      const mean = c => c.reduce((a, x) => a + x, 0) / c.length;
      const AL = A.realm('POL-01'), NR = A.realm('POL-08'), ZA = A.realm('POL-20');
      const al = pool(AL, N), nr = pool(NR, N), za = pool(ZA, N);
      const few = al.filter(x => x <= 3).length, many = al.filter(x => x >= 40).length, top = Math.max(al[N - 1], za[N - 1]);
      if (!(few >= 5)) bad.push(`an empire with three or fewer in ${few} of ${N} worlds`);
      if (!(many >= 20)) bad.push(`an empire with forty or more in ${many} of ${N} worlds`);
      if (!(top >= 70)) bad.push(`the most in any world ${top}: a cap?`);
      if (!(mean(al) > 4 * mean(nr))) bad.push(`Aldmark ${mean(al)} against Northreach ${mean(nr)}`);
      if (Math.abs(mean(al) - M.eliteMean(AL).mean) > M.eliteMean(AL).mean * 0.1) bad.push(`the draw's mean ${mean(al)} against the expected ${M.eliteMean(AL).mean}`);
      // each factor moves the mean (and the pooled draw follows): its make, its veterans, its wealth
      const keep = { type: AL.type, xp: AL.forces.xp, bi: AL.baseIncome }, base = M.eliteMean(AL).mean;
      AL.type = 'merchant republic'; const trade = M.eliteMean(AL).mean, tradeC = mean(pool(AL, 600)); AL.type = keep.type;
      AL.forces.xp = 180; const vet = M.eliteMean(AL).mean, vetC = mean(pool(AL, 600)); AL.forces.xp = keep.xp;
      AL.baseIncome = keep.bi * 3; const rich = M.eliteMean(AL).mean; AL.baseIncome = keep.bi;
      if (!(trade < base * 0.8 && tradeC < mean(al) * 0.85)) bad.push(`a merchants' make ${trade} (${tradeC}) against ${base}`);
      if (!(vet > base * 1.3 && vetC > mean(al) * 1.2)) bad.push(`veterans ${vet} (${vetC}) against ${base}`);
      if (!(rich > base * 1.1)) bad.push(`wealth ${rich} against ${base}`);
      const why = M.eliteMean(AL).why;
      if (!why.length || why.some(x => !x[0] || !(x[1] > 0))) bad.push('no reasons: ' + JSON.stringify(why));
      A.S.seed = 77; const d1 = M.eliteCount(AL), d2 = M.eliteCount(AL); A.S.seed = s0;
      if (d1 !== d2) bad.push('the draw is not deterministic');
      return { bad, al: [al[100], al[1000], al[1900], al[N - 1]], za: [za[100], za[1000], za[1900], za[N - 1]], nr: mean(nr).toFixed(2), few, many, base: base.toFixed(1), trade: trade.toFixed(1), vet: vet.toFixed(1), rich: rich.toFixed(1), why: why.slice(0, 3).map(x => x[0] + ' x' + x[1]).join('; ') };
    });
    return { ok: !r.bad.length, detail: `Aldmark p5/50/95/most ${r.al.join('/')}, Zanara ${r.za.join('/')}, Northreach mean ${r.nr}; three or fewer ${r.few}, forty or more ${r.many} of 2000; expected ${r.base}, as merchants ${r.trade}, with veterans ${r.vet}, three times as rich ${r.rich}; because ${r.why}` + (r.bad.length ? ' bad: ' + r.bad.join('; ') : '') };
  },

  // the knights count far above soldiers in a fight (the host rule on men counted at their worth), more in the lances
  // and the guard than in the line; an order's brethren and conscript foot carry no share of the crown's knights
  async msBattle(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9790, race: 'human', realm: 'POL-01', status: 'noble', sex: 'M', startAge: 20 });
      const M = A.MIL, bad = [], rows = [];
      for (const r of Object.values(A.S.realms)) {
        if (!r.alive || !r.forces) continue;
        for (const d of r.forces.divs) {
          const f = M.divFactor(d), k = M.divKnights(d);
          if (f < 1 || f > 1.6) bad.push(`${d.id}: factor ${f}`);
          if ((d.elite || d.call) && (k || f !== 1)) bad.push(`${d.id}: an order or a call with knights`);
          if (k > d.men) bad.push(`${d.id}: more knights than men`);
        }
      }
      // the crown of Aldmark: a horse division takes a larger share a man than a line division
      const R = A.realm('POL-01'), divs = R.forces.divs.filter(d => !d.own && !d.elite && !d.call);
      const per = d => M.divKnights(d) / Math.max(1, d.men), kind = d => (A.tplOf(d) || {}).kind;
      const horse = divs.find(d => kind(d) === 'horse'), line = divs.find(d => kind(d) === 'line');
      if (horse && line && !(per(horse) > per(line) * 2)) bad.push(`lances ${per(horse)} against the line ${per(line)}`);
      // divCombat carries the factor
      const d0 = divs.find(d => M.divFactor(d) > 1.001);
      if (!d0) bad.push('no division with knights in Aldmark');
      else { const c = A.divCombat(d0); if (!(c.kf > 1)) bad.push('divCombat ignores the knights'); rows.push(`${d0.name}: ${Math.round(M.divKnights(d0))} knights in ${d0.men}, x${c.kf.toFixed(3)}`); }
      // the host rule: twice the men is 2^1.35 the might; a knight is worth more than a soldier
      const h1 = M.host(R, 10000, 0), h2 = M.host(R, 20000, 0), h3 = M.host(R, 10000, 500);
      const ex = Math.log(h2.might / h1.might) / Math.log(2);
      if (Math.abs(ex - 1.35) > 0.01) bad.push(`host exponent ${ex}`);
      if (!(h3.might > h1.might * 1.05)) bad.push('knights add little to the host');
      const lv = M.levels(R); rows.push(`a knight worth ${(M.worth(lv.knight) / M.worth(lv.soldier)).toFixed(2)} soldiers`);
      return { bad, rows };
    });
    return { ok: !r.bad.length, detail: r.rows.join('; ') + (r.bad.length ? ' bad: ' + r.bad.slice(0, 6).join('; ') : '') };
  },

  // the crown's yearly choice goes through A.WHY (kind 'standing'): a realm far under its host raises toward it, one far
  // over it with an empty treasury cuts; each choice that moves the host leaves its reasons
  async msDecides(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9795, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const M = A.MIL, R = A.realm('POL-03'), bad = [];
      const keep = { army: R.army, tr: R.treasury, debt: R.debt };
      const n = M.normal(R);
      A.S.wars = A.S.wars.filter(w => !w.att.includes(R.id) && !w.def.includes(R.id));
      R.army = Math.round(n * 0.5); R.treasury = R.income * 3;
      const w1 = M.want(R), rec1 = A.WHY.log().find(x => x.k === 'standing' && x.r === R.id);
      if (w1 !== n) bad.push(`under its host it chose ${w1}, not ${n}`);
      if (!rec1 || !rec1.why || !rec1.why.length) bad.push('no record of the raising');
      R.army = Math.round(n * 2); R.treasury = -R.income; R.debt = R.income * 2;
      const w2 = M.want(R);
      if (!(w2 < R.army / 1.4)) bad.push(`over its host and poor it chose ${w2}`);
      Object.assign(R, { army: keep.army, treasury: keep.tr, debt: keep.debt });
      return { bad, why: rec1 ? A.WHY.tell(rec1, false) : '' };
    });
    return { ok: !r.bad.length, detail: r.why.slice(0, 200) + (r.bad.length ? ' bad: ' + r.bad.join('; ') : '') };
  },

  // what the player reads: round figures and words, never a percentage; by hearsay, coarser still; the realm card's line
  // with its best behind a click-to-open note at 44 points, at 375 px
  async msWords(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      T.enter({ seed: 9799, race: 'human', realm: 'POL-03', status: 'noble', sex: 'M', startAge: 20 });
      const M = A.MIL, bad = [], R = A.realm('POL-20');
      const ex = M.words(R, 'exact'), es = M.words(R, 'estimate'), hs = M.words(R, 'hearsay'), note = M.eliteNote(R);
      for (const s of [ex, es, hs, note]) if (/%|percent/.test(s)) bad.push('a percentage: ' + s);
      // order 97: soldiers, never "men under arms" or "men-at-arms"
      if (!/^\d{1,3}(,000)+ soldiers, some [\d,]+ knights$/.test(ex)) bad.push('exact: ' + ex);
      for (const t of [ex, es, hs, note]) if (/under arms|men-at-arms|men at arms/i.test(t)) bad.push('the old words: ' + t);
      if (!/Its soldiers: (about )?[\d,]+ infantry/.test(note)) bad.push('no soldiers by kind: ' + note.slice(0, 80));
      if (!/^about /.test(es)) bad.push('estimate: ' + es);
      if (!/^said to keep /.test(hs)) bad.push('hearsay: ' + hs);
      const html = UI.realmCard('POL-20');
      if (!/Might:/.test(html) || !/data-note=/.test(html)) bad.push('no line on the realm card');
      if (/ title="[^"]*\s\S+\s\S+\s/.test(html.match(/mil-might[\s\S]*?<\/div>/)[0])) bad.push('a long title=');
      const box = document.createElement('div'); box.innerHTML = html; document.body.appendChild(box);
      const b = box.querySelector('.mil-best'), rc = b && b.getBoundingClientRect();
      if (!rc || rc.height < 44 || rc.width < 44) bad.push(`the button is ${rc && Math.round(rc.width)}x${rc && Math.round(rc.height)}`);
      const wide = box.scrollWidth > 375; box.remove();
      if (wide) bad.push('wider than 375');
      return { bad, ex, es, hs, note: note.slice(0, 160) };
    });
    await pg.setViewportSize({ width: 1366, height: 900 });
    return { ok: !r.bad.length, detail: `${r.ex} | ${r.es} | ${r.hs} | ${r.note}` + (r.bad.length ? ' bad: ' + r.bad.join('; ') : '') };
  },

  // every sample save loads (the step 'standing' keeps each realm's reading), plays a year, and the year turn keeps it;
  // a world plays the same from the same seed
  async msOldSaves(pg) {
    const files = fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort();
    const out = [];
    for (const f of files) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      out.push(await pg.evaluate(async ([b64, f]) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try {
          const d = await SAVES.decode(bytes);
          UI.enterSaveSafe(d);
          const live = Object.values(A.S.realms).filter(r => r.alive && r.forces);
          const kept = live.every(r => r.kn && r.kn.h);
          const y0 = A.S.year;
          T.play(1);
          // each realm that stood at the load has its reading of a later year once a year has turned (a realm born after the
          // turn waits for the next)
          const had = new Set(live.map(r => r.id));
          const stale = A.S.year > y0 ? Object.values(A.S.realms).filter(r => r.alive && r.forces && had.has(r.id) && !(r.kn && r.kn.y > y0)).map(r => r.id + ':' + (r.kn && r.kn.y)) : [];
          return { f, ok: kept && !stale.length && A.S.ver === A.SAVE_VER, kept, stale, y: [y0, A.S.year] };
        } catch (e) { return { f, ok: false, err: String(e && e.message || e).slice(0, 120) }; }
      }, [b64, f]));
    }
    const bad = out.filter(r => !r.ok);
    return { ok: !bad.length && out.length >= 5, detail: `${out.length} saves${bad.length ? '; bad: ' + JSON.stringify(bad.slice(0, 3)) : ''}` };
  },

  async msDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 9801, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
        T.play(2);
        return Object.keys(A.S.realms).sort().map(id => { const r = A.S.realms[id]; return [id, r.army, r.kn ? r.kn.t : -1, A.MIL.elite(r).map(x => x.name + x.level).join(',')].join(':'); }).join('|');
      };
      const a = run(), b = run();
      return { same: a === b, n: a.length };
    });
    return { ok: r.same, detail: `two runs of two years ${r.same ? 'agree' : 'differ'} (${r.n} chars)` };
  },
};
