// X3 (honest cards and clocks), part 1: no initiative. B6 lifted the pool (D-019), so nothing a player can read may speak of
// it: no "initiative", no hourglass cost mark. The page is read at every tab of several lives, in the help, an activity's
// sheet, the glossary's popovers and the refusals the actions give; the source is read for the old phrases.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const walk = (d, out = [], rx = /\.js$/) => {
  if (!fs.existsSync(d)) return out;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out, rx); else if (rx.test(e.name)) out.push(p);
  }
  return out;
};

export default {
  async x3NoInitiativeOnPage(page) {
    const lives = [
      { seed: 11, race: 'human', realm: 'POL-04', status: 'peasant', sex: 'M', startAge: 30 },
      { seed: 12, race: 'human', realm: 'POL-05', status: 'noble', sex: 'M', startAge: 30 },
      { seed: 13, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'F', startAge: 30 },
      { seed: 14, race: 'human', realm: 'POL-05', status: 'royal', sex: 'M', startAge: 35 },
      { seed: 15, race: 'elf', realm: 'POL-03', status: 'artisan', sex: 'F', startAge: 12 },
    ];
    const found = [];
    for (const l of lives) {
      const r = await page.evaluate(l => {
        const out = [], RX = /initiative|⧗/i;
        T.enter(l);
        const scan = where => {
          for (const el of document.body.querySelectorAll('*')) {
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
            for (const a of el.attributes) if (RX.test(a.value)) out.push(`${where} @${a.name}: ${a.value.slice(0, 120)}`);
            for (const n of el.childNodes) if (n.nodeType === 3 && RX.test(n.nodeValue)) out.push(`${where}: ${n.nodeValue.trim().slice(0, 120)}`);
          }
        };
        const tag = l.status + ' ' + l.startAge;
        for (const t of T.tabs()) { UI.tab = t; UI.render(); scan(`${tag}/${t}`); }
        UI.tab = 'life';
        // the help, an activity's sheet, a person's page
        UI.A.help(); UI.render(); scan(tag + '/help'); UI.ov = null;
        for (const k of ['train_yard', 'practice', 'study', 'lift'].filter(k => GD.ACTIVITIES[k])) {
          UI.ov = { type: 'actSheet', id: k }; UI.render(); scan(`${tag}/sheet ${k}`);
        }
        UI.ov = null; UI.render();
        // every glossary popover that can be asked for, with the arguments the page gives them
        const pc = A.pc(), args = ['', pc.id, pc.realm, pc.home, 'str', 'coin'];
        for (const k of Object.keys(UI.TIPS || {})) for (const a of args) {
          try { const h = String(UI.TIPS[k](a)); if (RX.test(h)) out.push(`${tag}/tip ${k}(${a}): ${h.replace(/<[^>]+>/g, ' ').slice(0, 120)}`); } catch (e) {}
        }
        // every refusal the activities give, and What now
        for (const k of Object.keys(GD.ACTIVITIES)) { try { const c = A.canAct(k); if (RX.test(String(c[1] || ''))) out.push(`${tag}/canAct ${k}: ${c[1]}`); } catch (e) {} }
        try { for (const w of A.whatNow(pc)) if (RX.test(w.t + ' ' + w.why)) out.push(`${tag}/whatNow: ${w.t}`); } catch (e) {}
        // a quarter on, and the page after it
        for (let i = 0; i < 3; i++) { A.advance(30); let g = 0, h; while ((h = A.headReady()) && g++ < 50) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); } }
        UI.tab = 'life'; UI.render(); scan(tag + '/after');
        return out;
      }, l);
      for (const x of r) found.push(x);
    }
    const uniq = [...new Set(found)];
    return { ok: uniq.length === 0, detail: uniq.length ? uniq.slice(0, 8).join(' | ') : `${lives.length} lives, every tab, help, sheets, popovers: no initiative` };
  },

  // T6: a feast comes on its date. Every pick of a feast names this month's; a dated scene gets no weight in another month;
  // and over played lives no dealt dated scene shows outside its month
  async x3Calendar(page) {
    const r = await page.evaluate(() => {
      const out = { bad: [], dated: 0, dealt: 0, offDate: [] };
      T.enter({ seed: 61, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc();
      const inMonth = (m, f) => { A.S.warClock = A.MONTH_START[m] + 3; return f(); };
      for (let m = 0; m < 12; m++) {
        const here = GD.FESTIVALS.filter(f => f[1] === m);
        if (here.length) {
          for (let i = 0; i < 20; i++) { const f = inMonth(m, () => A.pick(GD.FESTIVALS)); if (f[1] !== m) out.bad.push(`pick ${f[0]} in ${GD.MONTHS[m]}`); }
          if (m === 4) for (let i = 0; i < 10; i++) { const f = inMonth(m, () => A.pick(['May Fair', 'the Slaughter Feast'])); if (f !== 'May Fair') out.bad.push(`pick ${f} in May`); }
          if (m === 10) for (let i = 0; i < 10; i++) { const f = inMonth(m, () => A.pick(['May Fair', 'the Slaughter Feast'])); if (f !== 'the Slaughter Feast') out.bad.push(`pick ${f} in November`); }
        } else if (inMonth(m, () => A.canAct('festival')[0])) out.bad.push('feast activity open in ' + GD.MONTHS[m]);
        for (const id in A.EV) {
          const e = A.EV[id], ms = A.X3.datedMonths(e);
          if (!ms || e.trigger) continue;
          if (m === 0) out.dated++;
          if (!ms.includes(m) && inMonth(m, () => A.evFit(e, pc)) > 0) out.bad.push(`${id} fits ${GD.MONTHS[m]}`);
        }
      }
      // played lives: every dealt scene that is dated is dealt in its month
      for (let s = 0; s < 3; s++) {
        T.enter({ seed: 900 + s, race: 'human', realm: ['POL-05', 'POL-04', 'POL-03'][s % 3], status: ['peasant', 'artisan', 'noble'][s % 3], sex: s % 2 ? 'F' : 'M', startAge: 14 + s * 4 });
        const y0 = A.S.year;
        for (let g = 0; g < 800 && A.S.year < y0 + 12; g++) {
          const rr = A.advance(400);
          let h, k = 0;
          while ((h = A.headReady()) && k++ < 100) {
            if (h.type === 'event') {
              const e = A.EV[h.ev], ms = e && !e.trigger && !h.forced && !h.ctx ? A.X3.datedMonths(e) : null;
              out.dealt++;
              if (ms) { const m = A.monthOf(A.today()).m; if (!ms.includes(m)) out.offDate.push(`${h.ev} in ${GD.MONTHS[m]} (${ms.map(i => GD.MONTHS[i]).join('/')})`); }
              A.eventAuto();
            } else A.skipPrompt();
          }
          if (rr.why === 'dead' || !A.pc().alive) break;
        }
      }
      return out;
    });
    const bad = r.bad.concat(r.offDate);
    return { ok: bad.length === 0 && r.dated > 20, detail: bad.length ? bad.slice(0, 6).join('; ') : `${r.dated} dated scenes held to their month, ${r.dealt} scenes dealt over three lives, none off its date` };
  },

  // E1: a choice that can open a fight to the death says so on its chip
  async x3FightStakes(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 62, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: 25 });
      const pc = A.pc(), ST = A.STAKES, out = { n: 0, lethal: 0, blows: 0, bad: [] };
      for (const id in A.EV) {
        const e = A.EV[id];
        (e.choices || []).forEach((c, i) => {
          let chips; try { chips = ST.choiceChips(c, e, null, pc, null); } catch (err) { return; }
          const R = c.fx ? ST.read(c.fx) : null, fight = R && R.fight, cf = c.check && c.check.fight;
          if (!fight && !cf) return;
          out.n++;
          const lethal = cf ? !!(typeof cf === 'object' && cf.lethal) : R.fightKind !== 'blows';
          const t = chips.map(x => x.t).join(' | ');
          if (lethal) { out.lethal++; if (!/to the death|end in your death/.test(t)) out.bad.push(`${id}:${i} "${t}"`); }
          else { out.blows++; if (/to the death|end in your death/.test(t) && !/not to the death/.test(t)) out.bad.push(`${id}:${i} wrongly lethal`); }
        });
      }
      return out;
    });
    return { ok: r.bad.length === 0 && r.n > 20, detail: r.bad.length ? r.bad.slice(0, 5).join('; ') : `${r.n} fight choices (${r.lethal} to the death, ${r.blows} not): each says which` };
  },

  // E6: the ending is the life lived. A merchant or a scribe of high rank is not a "Master of the Craft"; a smith is. A life that
  // began at 17 did not "live through a childhood".
  async x3Endings(page) {
    const r = await page.evaluate(() => {
      const end = (job, rank, flags) => {
        T.enter({ seed: 70, race: 'human', realm: 'POL-05', status: 'artisan', sex: 'M', startAge: 40 });
        const pc = A.pc(); pc.fame = 20; pc.coin = 100; pc.children = [{}].slice(1); pc.job = { c: job, r: rank, perf: 50 };
        for (const f of flags || []) pc.flags[f] = A.S.year;
        pc.cause = 'a fever'; return A.endingOf(pc).id;
      };
      const out = { smith: end('smith', 4), merchant: end('merchant', 4), scribe: end('scribe', 5), smithWork: end('smith', 2, ['masterwork_door']), merchantWork: end('merchant', 2, ['masterwork_ledger']) };
      const surv = age => { T.enter({ seed: 71, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: age }); A.S.ach = {}; const pc = A.pc(); pc.born = A.S.year - GD.RACES[pc.race].adult + 0; A.S.ach = {}; A.milestones(pc); return !!A.S.ach.survivor; };
      out.lateSurvivor = surv(17); out.birthSurvivor = surv(0);
      return out;
    });
    const ok = r.smith === 'master' && r.smithWork === 'master' && r.merchant !== 'master' && r.scribe !== 'master' && r.merchantWork !== 'master' && !r.lateSurvivor && r.birthSurvivor;
    return { ok, detail: JSON.stringify(r) };
  },

  // E12: one system of units. The map and the journeys speak kilometres, so the prose does not speak miles.
  async x3OneUnit() {
    const bad = [];
    const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'data'), [], /\.(js|json)$/)];
    for (const f of files) {
      const rel = path.relative(root, f);
      if (/99990-v2-engine\/a-v2\.core\.js$/.test(rel)) continue;
      fs.readFileSync(f, 'utf8').split('\n').forEach((ln, i) => { if (/\bmiles?\b/i.test(ln) && !/^\s*(\/\/|\*)/.test(ln)) bad.push(`${rel}:${i + 1}`); });
    }
    for (const f of walk(path.join(root, 'src/core/release/lore'), [], /\.json$/)) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((ln, i) => { if (/\bmiles?\b/i.test(ln)) bad.push(`${path.relative(root, f)}:${i + 1}`); });
    }
    return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8).join(', ') : 'no mile in any text a player reads: kilometres throughout' };
  },

  // E9: no quiet line twice in a year, for an infant, a child or an adult
  async x3QuietLines(page) {
    const r = await page.evaluate(() => {
      const out = [];
      for (const age of [1, 8, 30]) {
        T.enter({ seed: 80 + age, race: 'human', realm: 'POL-05', status: 'peasant', sex: 'M', startAge: age });
        const pc = A.pc(); let dup = 0, n = 0; const seen = [];
        for (let m = 0; m < 36; m++) {
          A.S.year = 1100 + Math.floor(m / 12); A.S.warClock = (m % 12) * 30;
          const t = A.V2T.quietLine(pc, m % 12);
          if (seen.slice(-11).includes(t)) dup++;
          seen.push(t); n++;
        }
        out.push({ age, dup, n });
      }
      return out;
    });
    return { ok: r.every(x => x.dup === 0), detail: r.map(x => `age ${x.age}: ${x.dup} repeats in ${x.n} quiet months`).join('; ') };
  },

  // T4: a sick body does not read "hale"
  async x3IllShows(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 91, race: 'human', realm: 'POL-05', status: 'artisan', sex: 'M', startAge: 41 });
      const pc = A.pc(); pc.health = 95;
      const read = () => { UI.tab = 'life'; UI.render(); return [...document.querySelectorAll('.barrow')].filter(e => /Health/.test(e.textContent)).map(e => e.textContent.replace(/\s+/g, ' ').trim()).join(' | '); };
      const well = read();
      pc.ill = { k: 'marsh', name: 'marsh fever', m: 3, tot: 3, dmg: 20, t: '', y: A.S.year, crisis: 0 };
      const sick = read();
      pc.health = 40; const worn = read();
      pc.ill = null; pc.health = 95;
      return { well, sick, worn };
    });
    return { ok: /hale/.test(r.well) && /ill with marsh fever/.test(r.sick) && !/hale/.test(r.sick) && !/ill with/.test(r.worn), detail: JSON.stringify(r) };
  },

  // E2: the card's promise is what happens. A choice that names or chips a price charges that price, for a plain effect and for a
  // function effect, over a sample of the scenes (applied to a rich merchant, read from the coin before and after)
  async x3PreviewEqualsEffect(page) {
    const r = await page.evaluate(() => {
      T.enter({ seed: 301, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'M', startAge: 35 });
      const out = { plain: 0, fn: 0, bad: [] };
      for (const id of Object.keys(A.EV)) {
        const e = A.EV[id];
        (e.choices || []).forEach((c, i) => {
          if (c.check || c.group || out.plain >= 80 && out.fn >= 40) return;
          const isPlain = c.fx && typeof c.fx === 'object' && typeof c.fx.coin === 'number' && c.fx.coin < 0 && !c.fx.coinPct;
          const isFn = typeof c.fx === 'function' && A.STAKES.read(c.fx).coin > 0;
          if (!(isPlain && out.plain < 80) && !(isFn && out.fn < 40)) return;
          const pc = A.pc(); pc.coin = 100000; pc.alive = true;
          const q = { type: 'event', ev: id, ctx: {}, forced: true }; A.S.queue = [q];
          let v; try { v = A.eventView(q); } catch (x) { return; }
          if (!v || v.skip) return;
          const vi = v.choices.findIndex(x => x.i === i); if (vi < 0) return;
          const chip = A.STAKES.choiceChips(c, e, q, pc, v.choices[vi]).find(x => x.coin && x.n);
          const label = String(v.choices[vi].t || '').replace(/,/g, '');
          const named = (/(\d+) suns?/.exec(label) || [])[1];
          const before = pc.coin;
          try { A.eventChoose(vi); } catch (x) { A.S.queue = []; return; }
          const spent = before - pc.coin;
          if (isPlain) { out.plain++; if (Math.abs(spent + c.fx.coin) > 0.5) out.bad.push(`${id}:${i} fx ${c.fx.coin}, charged ${spent}`); }
          else {
            out.fn++;
            const want = chip ? chip.n : named ? +named : null;
            if (want != null && spent > 0 && Math.abs(spent - want) > 0.5) out.bad.push(`${id}:${i} promised ${want}, charged ${spent}`);
          }
          A.S.queue = []; if (!A.pc().alive) T.enter({ seed: 301 + out.plain + out.fn, race: 'human', realm: 'POL-05', status: 'merchant', sex: 'M', startAge: 35 });
        });
      }
      return out;
    });
    return { ok: r.bad.length === 0 && r.plain >= 40 && r.fn >= 10, detail: r.bad.length ? r.bad.slice(0, 5).join('; ') : `${r.plain} plain and ${r.fn} function effects: each charged what it promised` };
  },

  // E3: no adult's decision is asked of a child under 6: every scene a small child is dealt asks its age in its own condition
  async x3ChildhoodGated(page) {
    const r = await page.evaluate(() => {
      const out = { shown: 0, odd: [] };
      const AGED = /\bAA\(|C\.(child|age|young|teen|ageAdj|infant)\(|\bage\(|A\.age|\.born|KID\(|TEEN\(|kid\(|\bchild\b/;
      let n = 0;
      for (const [st, rl] of [['serf', 'POL-05'], ['artisan', 'POL-11'], ['noble', 'POL-04']]) {
        T.enter({ seed: 600 + n++, race: 'human', realm: rl, status: st, sex: n % 2 ? 'M' : 'F', startAge: 0 });
        for (let g = 0; g < 400 && A.age(A.pc()) < 6 && A.pc().alive; g++) {
          A.advance(400);
          let h, k = 0;
          while ((h = A.headReady()) && k++ < 100) {
            if (h.type === 'event') {
              const age = A.age(A.pc()), e = A.EV[h.ev];
              if (age < 6 && e) {
                out.shown++;
                const cs = e.cond ? e.cond.toString() : '';
                if (!AGED.test(cs) && !h.forced && !(h.ctx && Object.keys(h.ctx).length) && h.lfFrom !== 'chain') out.odd.push(`${h.ev} at ${age} (${st})`);
              }
              A.eventAuto();
            } else A.skipPrompt();
          }
        }
      }
      return out;
    });
    return { ok: r.odd.length === 0 && r.shown >= 5, detail: r.odd.length ? r.odd.slice(0, 6).join('; ') : `${r.shown} scenes dealt to three small children, all asking their age` };
  },

  // the old words and the cost mark are not in any source a player can read; the one file that still names the cost mark is
  // the page pass that takes any stray one off (999995-next-year)
  async x3NoInitiativeInSource() {
    const bad = [];
    const RX = /Not enough initiative|initiative to spend|initiative waiting|Spend (?:your )?initiative|needs? \$?\{?[\w.]*\}? initiative|\d initiative['"`]|Initiative<|clk-ini"|⧗/;
    for (const f of walk(path.join(root, 'src'))) {
      const rel = path.relative(root, f);
      if (/999995-next-year\/next-year\.core\.js$/.test(rel)) continue;
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((ln, i) => { if (RX.test(ln) && !/^\s*(\/\/|\*)/.test(ln)) bad.push(`${rel}:${i + 1}`); });
    }
    return { ok: bad.length === 0, detail: bad.length ? bad.slice(0, 8).join(', ') : 'no initiative wording or cost mark in the source' };
  },
};
