// X3 (honest cards and clocks), part 1: no initiative. B6 lifted the pool (D-019), so nothing a player can read may speak of
// it: no "initiative", no hourglass cost mark. The page is read at every tab of several lives, in the help, an activity's
// sheet, the glossary's popovers and the refusals the actions give; the source is read for the old phrases.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.js$/.test(e.name)) out.push(p);
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
      for (let s = 0; s < 6; s++) {
        T.enter({ seed: 900 + s, race: 'human', realm: ['POL-05', 'POL-04', 'POL-03'][s % 3], status: ['peasant', 'artisan', 'noble'][s % 3], sex: s % 2 ? 'F' : 'M', startAge: 14 + s * 4 });
        const y0 = A.S.year;
        for (let g = 0; g < 800 && A.S.year < y0 + 24; g++) {
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
    return { ok: bad.length === 0 && r.dated > 20, detail: bad.length ? bad.slice(0, 6).join('; ') : `${r.dated} dated scenes held to their month, ${r.dealt} scenes dealt over six lives, none off its date` };
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
