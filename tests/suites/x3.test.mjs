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
