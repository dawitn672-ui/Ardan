// Tests for W1-4, "no levies" (docs/design/war.md §10, §16; D-064 points 7 and 8; D-086 to D-090). See README.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..', '..');
const SAVES = path.join(ROOT, 'tests', 'saves');

// ---- the lint: the word is gone from the game's source, its data and its tools -------------------------------------
// Every file the build or the tools read (src, data, tools, tests/v2), code and words alike. Allowed: this stage's old-save
// converter (it must name the fields an old save stores), feature notes (*.md), tests (this one names the word), the
// archive, and the tools' historical records (bench reports, critique probes, the rename map).
const WORD = new RegExp('\\ble' + 'v(y|ies|ied)\\b', 'i');
const ALLOW = [/9999952-men\/a-convert\.core\.js$/, /test\.mjs$/, /\.md$/, /critique-probes\//, /bench\/reports\//, /rename-map\.json$/, /test-times\.json$/];
function files() {
  const out = [];
  const walk = d => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!/^(node_modules|\.git|saves)$/.test(e.name)) walk(p); continue; }
      if (/\.(js|mjs|json)$/.test(e.name) && !ALLOW.some(rx => rx.test(p))) out.push(p);
    }
  };
  for (const d of ['src', 'data', 'tools', 'tests/v2']) walk(path.join(ROOT, d));
  return out;
}

export const limits = { w4CallsAndFields: 900 };

export default {
  async w4NoLevyLint() {
    const bad = [];
    const L = files();
    for (const f of L) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((l, i) => { const m = l.match(WORD); if (m) bad.push(`${path.relative(ROOT, f)}:${i + 1}: ${l.slice(Math.max(0, m.index - 30), m.index + 40).trim()}`); });
    }
    return { ok: !bad.length && L.length > 300, detail: `${L.length} files read; ${bad.length} with the old word${bad.length ? ': ' + bad.slice(0, 8).join(' | ') : ''}` };
  },

  // the three kinds of men in a new world: the roll one in a hundred, the sworn about one in four hundred, no conscript
  // under arms in a realm with no open call
  async w4ThreeKinds(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
      const out = { realms: 0, rollOk: 0, swornOk: 0, consc: 0, law: 0, tpl: 0 };
      for (const id in A.S.realms) {
        const r = A.S.realms[id]; if (!r || r.alive === false || r.isRebel) continue;
        out.realms++;
        const pop = A.MEN.pop(r), k = A.MEN.of(r);
        if (r.roll <= pop / 100 * 1.25 + 1 && r.roll >= pop / 100 * 0.75) out.rollOk++;
        if (k.sworn <= pop / 400 + 1 && k.sworn + k.enlisted === k.standing) out.swornOk++;
        out.consc += r.forces.divs.filter(d => d.call).length;
        if (r.laws && r.laws.conscript != null && r.laws.levy == null) out.law++;
        out.tpl += Object.values(r.forces.tpl).filter(t => t.call).length;
      }
      out.train = (() => { const r = A.realm('POL-01'), t = A.CALLS.tpl(r); return A.trainDiv(r, t.id).ok; })();
      return out;
    });
    const ok = r.realms > 20 && r.rollOk === r.realms && r.swornOk === r.realms && r.consc === 0 && r.law === r.realms && !r.train;
    return { ok, detail: JSON.stringify(r) };
  },

  // a call comes only with a named need; the hearth share matches the call; the fields lose hands and the harvest shows it
  async w4CallsAndFields(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 11, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 30 });
      const CA = A.CALLS, out = {};
      const id = 'POL-01', R = A.realm(id);
      out.peace = CA.need(R);   // at peace: no need
      const foe = A.neighbors(id).map(A.realm).filter(x => x && x.alive && !x.isRebel).sort((a, b) => (b.army || 0) - (a.army || 0))[0];
      A.startWar(foe.id, id, null, 'conquest');
      // an enemy host on home soil: put one of the foe's divisions in the realm's capital province
      const d = foe.forces.divs[0]; d.loc = R.capitalProv; A.locDirty();
      const need = CA.need(R);
      out.need = need && { t: need.t, deg: need.deg, label: need.label };
      const rec = CA.decide(R, need, { log: false });
      out.opts = rec ? [rec.chose, rec.why.map(x => x[0]).slice(0, 2)] : null;
      // the share each call takes, against the hearths of the provinces it reached
      out.calls = [];
      for (const deg of [1, 2, 3]) {
        const call = CA.proclaim(R, deg, need, null, { rand: () => 0.5 });
        let exp = 0;
        for (const [hid, ans] of call.cmds) for (const p of call.provs.filter(x => (x[3] || null) === (hid || null))) exp += 0;
        const full = call.provs.reduce((a, p) => a + Math.round(A.S.prov[p[0]].pop / A.MEN.T.HEARTH / CA.DEG[deg - 1].of), 0);
        const allPop = call.provs.reduce((a, p) => a + A.S.prov[p[0]].pop, 0);
        out.calls.push({ deg, men: call.men, full, shareOfWorking: +(call.men / (allPop * A.MEN.T.WORK)).toFixed(4), half: call.cmds.filter(c => c[1] === 'half').length, need: call.need.l });
        if (deg < 3) CA.release(call, 'test');
      }
      const open = CA.open(id)[0];
      out.share = +CA.share(id).toFixed(4);
      out.fieldsMarch = +CA.fields(id, 2).toFixed(4);
      out.fieldsAug = +CA.fields(id, 7).toFixed(4);
      // the economy: what the realm's land made this month is cut by the fields' share (iron is made every month)
      const m = A.mkt ? A.mkt(id) : null;
      if (m && A.ECON) {
        const mo0 = A.monthOf(A.today()).m, f0 = CA.fields(id, mo0), f1 = CA.fields(id, (mo0 + 1) % 12);
        A.advance(31);
        const made = m.why && m.why.iron ? m.why.iron.made : null, pr = m.pr.iron || 0;
        const occ = 1 - 0.5 * A.realmProvs(id).filter(P => P.occ || P.sgBy).length / Math.max(1, A.realmProvs(id).length);
        out.ironMade = made; out.ironExpect = [Math.round(pr * f0 * occ), Math.round(pr * f1 * occ)]; out.ironFull = Math.round(pr * occ);
      }
      if (open.end) out.released = open.how;
      if (!open.end) { open.stage = 'form'; CA.form(open); }
      // the call forms conscript foot in the lords' contingents after its drill, and goes home when the need ends
      A.advance(70);
      out.divs = CA.divs(open).length || (open.formed > 0 ? -1 : 0); out.owned = CA.divs(open).filter(x => x.own).length; out.wait = open.wait; out.stage = [open.stage, open.end ? open.how : 'open', open.formed || 0];
      for (const w of A.atWar(id)) A.endWar ? A.endWar(w, 'white') : null;
      out.after = A.S.wars.filter(w => w.att.includes(id) || w.def.includes(id)).length;
      return out;
    });
    const C = r.calls || [];
    const shareOk = C.length === 3 && C.every(c => Math.abs(c.shareOfWorking - [0.03, 0.06, 0.12][c.deg - 1] * (c.half ? c.men / c.full : 1)) < 0.006 && c.men <= c.full);
    const fieldsOk = r.share > 0 && Math.abs(r.fieldsMarch - (1 - r.share)) < 1e-3 && Math.abs(r.fieldsAug - (1 - 2 * r.share)) < 1e-3;
    const ecoOk = r.ironMade != null && r.ironExpect.some(x => Math.abs(r.ironMade - x) <= Math.max(2, x * 0.02)) && r.ironMade < r.ironFull;
    const ok = r.peace == null && r.need && r.need.t === 'home' && r.need.deg === 3 && shareOk && fieldsOk && ecoOk && (r.divs !== 0 || !!r.released);
    return { ok, detail: `at peace: ${r.peace ? 'a need!' : 'no need'}; ${JSON.stringify(r.need)}; the crown: ${JSON.stringify(r.opts)}; calls ${C.map(c => `${c.deg}: ${c.men} of ${c.full} at full (${(c.shareOfWorking * 100).toFixed(2)} in 100 working men; ${c.half} lords half)`).join(', ')}; fields: share ${r.share}, March ${r.fieldsMarch}, August ${r.fieldsAug}; iron made ${r.ironMade} (expected one of ${r.ironExpect}; ${r.ironFull} with every hand at home);${r.released ? ' the call released when its need passed: ' + r.released + ';' : ''} conscript divisions ${r.divs} (${r.owned} in a lord's contingent), waiting ${r.wait}, ${JSON.stringify(r.stage)}` };
  },

  // the company's ledger: conscripts desert more than sworn men, each desertion with its reasons; the design's lab
  async w4Desertion(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 30 });
      const L = A.LEDGER, CA = A.CALLS, id = 'POL-01', R = A.realm(id);
      const foe = A.neighbors(id).map(A.realm).find(x => x && x.alive && !x.isRebel);
      A.startWar(id, foe.id, null, 'conquest');
      const need = { t: 'few', deg: 1, label: 'Fewer spears than the enemy', w: 1, pub: 0 };
      const call = CA.proclaim(R, 1, need, null, { rand: () => .5 }); call.stage = 'form'; CA.form(call);
      const cons = CA.divs(call)[0], sworn = R.forces.divs.find(d => !d.call && A.MEN.kindOf(d) === 'sworn') || R.forces.divs.find(d => !d.call);
      if (sworn && A.MEN.kindOf(sworn) !== 'sworn') sworn.elite = sworn.elite || null;
      const same = d => { d.sr = 0.4; d.loc = R.capitalProv; d.losses = 2; d.wins = 0; d.army = d.army || 'X'; };
      const out = {};
      for (const [k, d] of [['conscript', cons], ['other', sworn]]) {
        same(d); const men0 = d.men; const res = L.month(d, { unpaid: 3 });
        out[k] = { kind: res.led.kind, lost: men0 - d.men, share: +((men0 - d.men) / men0).toFixed(3), pulls: res.led.pulls.length, holds: res.led.holds.length };
      }
      out.records = (A.S.deserts || []).slice(0, 6).map(x => x.why.length);
      // the lab (war.md §10.5): ten companies three months unpaid; the same ten paid, fed and winning
      const lab = (unpaid) => {
        let hit = 0;
        for (let i = 0; i < 10; i++) {
          const d = Object.assign(JSON.parse(JSON.stringify(cons)), { id: cons.id + 'L' + i + (unpaid ? 'u' : 'p'), men: 6000, exp: 5 + i * 3, born: A.S.year - (i % 3), mut: null });
          if (unpaid) { d.sr = 0.5; d.losses = 1 + (i % 2); d.wins = 0; } else { d.sr = 1; d.wins = 3; d.losses = 0; d.loc = R.capitalProv; }
          let lost = 0, mut = 0;
          for (let mth = 0; mth < 3; mth++) { const m0 = d.men; const res = L.month(Object.assign(d, { army: 'X' }), unpaid ? { unpaid: mth + 1, occasion: mth === 2 ? 'pay day missed' : null } : { occasion: null }); lost += m0 - d.men; if (res && res.mut >= 2) mut = 1; }
          if (lost / 6000 >= 0.05 || mut) hit++;
        }
        return hit;
      };
      // the lab's companies are copies standing outside any real army: L.month reads them without touching the world's
      const real = L.leave; L.leave = () => {};
      out.unpaid = lab(true); out.paid = lab(false);
      L.leave = real;
      return out;
    });
    const ok = r.conscript.share > r.other.share * 3 && r.conscript.lost > 0 && r.records.length > 0 && r.records.every(n => n >= 2) && r.unpaid >= 8 && r.paid <= 1;
    return { ok, detail: JSON.stringify(r) };
  },

  // a mutiny needs a grievance, a voice and an occasion: any two are not enough
  async w4MutinyThree(pg) {
    const r = await pg.evaluate(() => {
      T.enter({ seed: 7, race: 'human', realm: 'POL-02', status: 'peasant', sex: 'M', startAge: 30 });
      const L = A.LEDGER, R = A.realm('POL-01');
      const base = R.forces.divs.find(d => !d.elite);
      const parts = L.parts;
      const out = {};
      for (const [k, g, v, o] of [['all', 1, 1, 1], ['noGrievance', 0, 1, 1], ['noVoice', 1, 0, 1], ['noOccasion', 1, 1, 0], ['onlyOne', 1, 0, 0]]) {
        const d = Object.assign(JSON.parse(JSON.stringify(base)), { id: base.id + 'M' + k, mut: null, army: 'X', men: 5000 });
        L.parts = () => ({ grievance: g ? 'Pay in arrears 3 months' : null, voice: v ? 'Sergeant Hale' : null, occasion: o ? 'pay day missed' : null });
        L.month(d); out[k] = d.mut ? d.mut.lv : 0;
      }
      L.parts = parts;
      return out;
    });
    const ok = r.all === 1 && !r.noGrievance && !r.noVoice && !r.noOccasion && !r.onlyOne;
    return { ok, detail: JSON.stringify(r) };
  },

  // every sample save loads: the old pool becomes the roll, the old law the conscription law, no old field is left
  async w4OldSaves(pg) {
    const list = fs.existsSync(SAVES) ? fs.readdirSync(SAVES).filter(f => f.endsWith('.ardan')).sort() : [];
    const res = [];
    for (const f of list) {
      const b64 = fs.readFileSync(path.join(SAVES, f)).toString('base64');
      res.push(await pg.evaluate(async ([b64, f]) => {
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        try {
          const d = await SAVES.decode(bytes);
          const old = new RegExp('"le' + 'vy[A-Za-z0]*":'), wasOld = old.test(JSON.stringify(d.S.realms));
          UI.enterSaveSafe(d);
          const realms = Object.values(A.S.realms).filter(r => r && r.alive !== false);
          // the cap is the conversion's (an old pool becomes at most one in a hundred). A save made since keeps its roll as
          // play left it: when a realm's people fall (D-107's deaths), a roll above the new cap drains a tenth of the
          // excess a year (A.forcesYear), so the alpha.15 sample (year 1140) has eight realms above it, as it should
          const bad = realms.filter(r => !(r.roll >= 0) || r.laws.conscript == null || (wasOld && r.roll > A.MEN.rollCap(r) * 1.01)).length;
          const left = old.test(JSON.stringify(A.S.realms)) || old.test(JSON.stringify(A.S.houses));
          const cons = realms.reduce((a, r) => a + r.forces.divs.filter(d => d.call && !(A.CALLS.byId(d.call) && !A.CALLS.byId(d.call).end)).length, 0);
          return { f, ok: !bad && !left && !cons, bad, left, cons, conv: A.MEN.lastConvert || null };
        } catch (e) { return { f, ok: false, err: String(e.message || e).slice(0, 120) }; }
      }, [b64, f]));
    }
    const ok = res.length > 5 && res.every(x => x.ok);
    return { ok, detail: res.map(x => `${x.f} ${x.ok ? 'ok' : 'FAILED ' + JSON.stringify(x)}${x.conv && (x.conv.home || x.conv.kept) ? ` (a host in the field: ${x.conv.kept} kept as conscripts, ${x.conv.home} men home)` : ''}`).join('; ') };
  },

  // the player: the lot's four choices at 375 by 667, 44-point targets; the ruler's proclamation; the ledger in words
  async w4Player(pg) {
    await pg.setViewportSize({ width: 375, height: 667 });
    const r = await pg.evaluate(() => {
      const out = {};
      T.enter({ seed: 7, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      const pc = A.pc(), R = A.realm('POL-01'), CA = A.CALLS;
      delete pc.mil; pc.spouse = null; pc.coin = 500;
      const foe = A.neighbors('POL-01').map(A.realm).find(x => x && x.alive && !x.isRebel);
      A.startWar(foe.id, 'POL-01', null, 'conquest');
      A.S.queue = [];
      const call = CA.proclaim(R, 3, { t: 'home', deg: 3, label: 'An enemy host stands on our own soil', w: 2, pub: 1, by: foe.id }, null, { rand: () => .5 });
      out.odds = +CA.lotOdds(pc, call).toFixed(3);
      if (!A.S.queue.some(q => q.ev === 'mn_lot')) A.queue({ type: 'event', ev: 'mn_lot', ctx: { cid: call.id, callT: 'the last call', hearthT: 'one hearth in five', termT: 'while the enemy stands on home soil', needT: call.need.l, subN: 105, subT: '105 suns' } });
      const q = A.S.queue.find(x => x.ev === 'mn_lot');
      A.S.queue = [q].concat(A.S.queue.filter(x => x !== q));
      UI.screen = 'game'; UI.tab = 'life'; UI.ov = null; UI.render();
      const v = A.eventView(q);
      out.n = v.choices.length; out.text = (v.text || '').slice(0, 90);
      const btns = [...document.querySelectorAll('[data-a="evChoose"]')];
      out.btns = btns.length; out.small = btns.filter(b => { const x = b.getBoundingClientRect(); return x.height < 44 || x.width < 44; }).length;
      out.pct = /\d+\s?%/.test(document.body.innerText);
      A.eventChoose(0);
      out.mil = !!pc.mil && pc.mil.call === call.id;
      // the War tab: the call and the company's ledger in words
      call.stage = 'form'; CA.form(call);
      UI.tab = 'war'; UI.render();
      const card = document.querySelector('.mn-card');
      out.card = !!card; out.cardText = card ? card.innerText.replace(/\s+/g, ' ').slice(0, 220) : '';
      out.cardPct = card ? /\d+\s?%/.test(card.innerText) : false;
      const why = card && card.querySelector('.mn-why');
      out.whyBox = why ? (r => [Math.round(r.width), Math.round(r.height)])(why.getBoundingClientRect()) : null;
      out.wide = document.documentElement.scrollWidth > 376;
      UI.tab = 'life'; UI.render();
      // a ruler is asked to proclaim
      T.enter({ seed: 8, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 });
      const p2 = A.pc(); A.makeRuler(p2, 'POL-01', true);
      A.S.queue = [];
      CA.askProclaim(A.realm('POL-01'), { t: 'home', deg: 3, label: 'An enemy host stands on our own soil', w: 2, pub: 1, by: foe.id, at: A.realm('POL-01').capitalProv });
      const q2 = A.S.queue.find(x => x.ev === 'mn_proclaim');
      out.proclaim = q2 ? A.eventView(q2).choices.map(c => c.t).length : 0;
      return out;
    });
    const ok = r.n === 4 && r.btns >= 4 && !r.small && !r.pct && r.mil && r.card && !r.cardPct && r.whyBox && r.whyBox[1] >= 44 && !r.wide && r.proclaim >= 2 && r.odds > 0;
    return { ok, detail: JSON.stringify(r) };
  },

  // the same seed and the same choices give the same calls, deserters and mutinies
  async w4Deterministic(pg) {
    const r = await pg.evaluate(() => {
      const run = () => {
        T.enter({ seed: 2024, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 16 });
        T.play(6);
        return JSON.stringify([(A.S.calls || []).map(c => [c.id, c.men, c.dead, c.home, c.how]), A.S.desertTally || {}, (A.S.mutinies || []).length, A.rngState]);
      };
      const a = run(), b = run();
      return { same: a === b, calls: JSON.parse(a)[0].length, tally: JSON.parse(a)[1] };
    });
    return { ok: r.same, detail: JSON.stringify(r) };
  },
};
