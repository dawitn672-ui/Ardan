// The score: silent until asked, composed the same way for the same place and date, a mode for every culture,
// shaped by the game without touching it, its menu settings, clean stops, sane audio (WAVs a person can listen to),
// and its cost in CPU.
import fs from 'node:fs';

const WAV_DIR = '/tmp/ardan/score';
const sleep = ms => new Promise(r => setTimeout(r, ms));

export default {
  // no audio context of any kind is made until the player turns the music on; a setting saved "on" waits for a touch
  async scoreSilentUntilAsked(pg) {
    const r = await pg.evaluate(async () => {
      const made = { rt: 0, off: 0 }, AC = window.AudioContext, OC = window.OfflineAudioContext;
      window.AudioContext = function (o) { made.rt++; return new AC(o); };
      window.OfflineAudioContext = function (a, b, c) { made.off++; return new OC(a, b, c); };
      A.newGame({ seed: 7301, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 22 });
      UI.screen = 'game'; UI.tab = 'life'; UI.set.hints = false; UI.render();
      T.renderAll(); T.play(1);
      A.S.queue = []; UI.ov = { type: 'menu' }; UI.render();
      const menu = !!document.querySelector('[data-c="setMusic"]');
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
      for (let i = 0; i < 4; i++) UI.SCORE.tick();
      const before = made.rt + made.off, idle = UI.SCORE.peek() === null;
      // the setting left on from an earlier visit: still nothing until the player touches the page
      UI.set.music = true; UI.render();
      const waiting = made.rt === 0;
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      const touched = made.rt;
      UI.SCORE.stop(); UI.set.music = false;
      window.AudioContext = AC; window.OfflineAudioContext = OC;
      await new Promise(res => setTimeout(res, 400));
      return { menu, before, idle, waiting, touched, closed: UI.SCORE.stats().state };
    });
    const ok = r.menu && r.before === 0 && r.idle && r.waiting && r.touched === 1 && r.closed === 'closed';
    return { ok, detail: `a year played, every tab drawn, the menu opened, a click and a key with the music off: ${r.before} audio contexts; saved on, none until a touch (${r.waiting}), then ${r.touched}; turned off it is ${r.closed}` };
  },

  // the same place and date compose the same piece; other places and dates compose others; the pieces have the shape
  // asked for (2-4 minutes, 30-90 s of silence after, phrases ending on the tonic or the fifth, mostly stepwise, rests)
  async scoreDeterministic(pg) {
    const r = await pg.evaluate(() => {
      const SC = UI.SCORE, cults = Object.keys(LORE.cultures), seen = new Set(), bad = [];
      let n = 0, durs = [], sils = [], cad = 0, cadOk = 0, steps = 0, small = 0, restShare = [], same = 0;
      for (const c of cults) for (let k = 0; k < 10; k++) {
        const o = { cult: c, key: `${100 + k}|${1090 + k}|${k % 4}|1`, season: k % 4 };
        const p = SC.compose(o), q = SC.compose(Object.assign({}, o));
        if (JSON.stringify(p) === JSON.stringify(q)) same++;
        seen.add(T.hash(JSON.stringify(p.notes))); n++;
        durs.push(p.dur); sils.push(p.silence);
        const F = SC.family(c), lead = p.notes.filter(x => x.k === 'lead');
        for (const x of lead) if (x.c) { cad++; const d = ((x.g % F.n) + F.n) % F.n; if (d === 0 || d === F.five) cadOk++; }
        for (let i = 1; i < lead.length; i++) if (lead[i].p === lead[i - 1].p) { steps++; if (Math.abs(lead[i].g - lead[i - 1].g) <= 1) small++; }
        let sound = 0, last = 0;
        for (const x of lead) { const s = Math.max(x.t, last), e = x.t + x.d; if (e > s) sound += e - s; last = Math.max(last, e); }
        restShare.push(1 - sound / p.dur);
        if (p.dur < 120 || p.dur > 245 || p.silence < 30 || p.silence > 90) bad.push(`${c}:${p.dur}/${p.silence}`);
      }
      // the date matters: the same place a season and a year on
      const a = SC.compose({ cult: 'CUL-02', key: '7|1100|1|1', season: 1 }), b = SC.compose({ cult: 'CUL-02', key: '7|1100|2|1', season: 2 }), c2 = SC.compose({ cult: 'CUL-02', key: '7|1101|1|1', season: 1 });
      const dateMatters = JSON.stringify(a.notes) !== JSON.stringify(b.notes) && JSON.stringify(a.notes) !== JSON.stringify(c2.notes);
      durs.sort((x, y) => x - y);
      return { n, same, distinct: seen.size, bad: bad.slice(0, 5), nbad: bad.length, durMin: durs[0], durMed: durs[durs.length >> 1], durMax: durs[durs.length - 1], silMin: Math.min(...sils), silMax: Math.max(...sils),
        cad, cadOk, stepShare: small / steps, rest: restShare.reduce((x, y) => x + y, 0) / restShare.length, dateMatters };
    });
    const ok = r.n >= 240 && r.same === r.n && r.distinct === r.n && r.nbad <= r.n * 0.01 && r.cad > 500 && r.cadOk === r.cad && r.stepShare >= 0.6 && r.rest >= 0.2 && r.dateMatters;
    return { ok, detail: `${r.n} pieces (24 cultures x 10 dates): each composed twice the same (${r.same}), all ${r.distinct} different; length ${r.durMin}-${r.durMax} s (median ${r.durMed}), ${r.nbad} outside 120-245 s${r.nbad ? ' ' + r.bad.join(' ') : ''}; silence after ${r.silMin.toFixed(0)}-${r.silMax.toFixed(0)} s; ${r.cadOk}/${r.cad} phrases end on the tonic or the fifth; ${Math.round(100 * r.stepShare)}% of melodic moves are steps or repeats; the melody rests ${Math.round(100 * r.rest)}% of the time; a season or a year on gives another piece: ${r.dateMatters}` };
  },

  // every culture maps to a family and a mode, the families sound in their own modes (and war colours), and the
  // ones the brief names are tuned as named
  async scoreModes(pg) {
    const r = await pg.evaluate(() => {
      const SC = UI.SCORE, M = SC.MODES, eq = (a, b) => JSON.stringify(a) === JSON.stringify(b), bad = [], fams = new Set();
      let checked = 0;
      for (const c of Object.keys(LORE.cultures)) {
        if (!SC.CULTURES[c]) { bad.push(c + ' unmapped'); continue; }
        const F = SC.family(c); fams.add(F.id);
        if (!F.mode || !F.warMode || F.mode.length !== F.warMode.length) bad.push(c + ' mode');
        for (const war of [false, true]) {
          const set = new Set((war ? F.warMode : F.mode).map(x => Math.round(x * 100)));
          const p = SC.compose({ cult: c, key: 'modes|1', season: 2 });
          for (const x of p.notes) if (x.k === 'lead' || x.k === 'fill') { checked++; const pc = Math.round((((SC.pitch(F, x.g, war) - F.tonic) % 12) + 12) % 12 * 100); if (!set.has(pc)) { bad.push(`${c} ${war ? 'war' : 'peace'} ${pc / 100}`); break; } }
        }
      }
      const f = c => SC.family(c);
      const named = {
        'Northfolk Dorian': eq(f('CUL-02').mode, M.dorian), 'Hall-giants Mixolydian': eq(f('CUL-24').mode, M.mixolydian),
        'desert hijaz': ['CUL-04', 'CUL-05', 'CUL-07'].every(c => eq(f(c).mode, M.hijaz)), 'Tamari Phrygian': eq(f('CUL-06').mode, M.phrygian),
        'steppe and sky pentatonic': ['CUL-03', 'CUL-12'].every(c => f(c).mode.length === 5), 'Sylvari Lydian': eq(f('CUL-19').mode, M.lydian),
        'Grovers Ionian': eq(f('CUL-20').mode, M.ionian), 'dwarves: drone of fifths, melody in fifths': f('CUL-21').drone[1].includes(7) && f('CUL-21').parallel === -7,
        'orcs: raw fourths': ['CUL-22', 'CUL-23'].every(c => eq(f(c).mode, M.fourths) && f(c).parallel === 5 && f(c).drone[1].includes(5)),
        'war turns minor': Object.keys(LORE.cultures).every(c => { const F = f(c); return F.warMode.reduce((a, x) => a + x, 0) < F.mode.reduce((a, x) => a + x, 0) || eq(F.warMode, M.phrygian); }),
      };
      return { n: Object.keys(LORE.cultures).length, fams: fams.size, bad: bad.slice(0, 6), checked, named };
    });
    const miss = Object.entries(r.named).filter(([, v]) => !v).map(([k]) => k);
    const ok = r.n === 24 && !r.bad.length && r.fams >= 12 && !miss.length && r.checked > 5000;
    return { ok, detail: `${r.n} cultures in ${r.fams} families, each with a mode and a war colour; ${r.checked} notes checked, all in their mode${r.bad.length ? '; BAD ' + r.bad.join(', ') : ''}; as named: ${Object.keys(r.named).length - miss.length}/${Object.keys(r.named).length}${miss.length ? ' (missing ' + miss.join(', ') + ')' : ''}` };
  },

  // the game shapes the score (read only): the land, the season, war, a fight, death, night and faith; the live
  // scheduler plays exactly the planned notes; a move to another land crossfades to its music
  async scoreMood(pg) {
    const r = await pg.evaluate(async () => {
      const SC = UI.SCORE, wait = ms => new Promise(res => setTimeout(res, ms));
      A.newGame({ seed: 7302, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 24 });
      UI.screen = 'game'; UI.tab = 'life'; UI.set.hints = false; A.S.queue = []; UI.render();
      const m0 = SC.mood();
      // the season and war, by plan (no audio)
      const p = SC.compose({ cult: m0.cult, key: 'mood|1', season: 2 });
      const at = s => SC.plan(p, Object.assign({}, m0, s));
      const winter = at({ season: 0 }).length, spring = at({ season: 1 }).length, summer = at({ season: 2 }).length, night = at({ season: 2, night: true }).length;
      const peaceDrums = at({ war: false }).filter(i => p.notes[i].L === 'war').length, warDrums = at({ war: true }).filter(i => p.notes[i].L === 'war').length;
      const F = SC.family(m0.cult), lead = p.notes.filter(x => x.k === 'lead');
      const minor = lead.filter(x => SC.pitch(F, x.g, true) < SC.pitch(F, x.g, false)).length;
      // the scenes, read from the state
      const pc = A.pc();
      A.S.queue = [{ type: 'duel', forced: true }]; const fight = SC.mood().scene;
      A.S.queue = [{ type: 'death', forced: true }]; const death = SC.mood().scene;
      let nightScene = null, faith = null;
      if (A.evShape) {
        const find = sh => Object.keys(A.EV).find(id => A.evShape(A.EV[id]) === sh);
        const tav = find('tavern'), fa = find('faith');
        if (tav) { A.S.queue = [{ type: 'event', ev: tav, ctx: {} }]; nightScene = SC.mood().night; }
        if (fa) { A.S.queue = [{ type: 'event', ev: fa, ctx: {} }]; faith = SC.mood().temple; }
      }
      A.S.queue = [];
      // live: the scheduler plays the plan; a duel sinks the score; a move crossfades; death brings the lament
      UI.set.music = true; SC.start(); const rt = SC.peek();
      await wait(11000);   // past the drone's opening
      const cur = rt.cur, plan = SC.plan(cur.piece, SC.mood()), elapsed = rt.ctx.currentTime - cur.at;
      const due = plan.filter(i => cur.piece.notes[i].t < elapsed + SC.LOOK - 0.3);
      const expect = SC.compose({ cult: m0.cult, key: `${m0.prov}|${m0.year}|${m0.season}|1`, season: m0.season });
      const live = { sameAsCompose: JSON.stringify(expect.notes) === JSON.stringify(cur.piece.notes), played: cur.played.length, due: due.length, prefix: due.every((i, k) => cur.played[k] === i) };
      A.S.queue = [{ type: 'duel', forced: true }]; SC.tick(); await wait(2600);
      const sunk = rt.g.scene.gain.value;
      A.S.queue = []; SC.tick(); await wait(4300);
      const back = rt.g.scene.gain.value;
      // move to an elven province: the old piece fades out over 4 s, the elves' music begins
      const elf = A.S.prov.find(x => x.orig === 'POL-06');
      const home = pc.home, before = rt.style, old = rt.cur;
      pc.home = elf.id; SC.tick();
      const fading = old.gain.gain.value; await wait(1500); const mid = old.gain.gain.value;
      await wait(2500); SC.tick(); const after = rt.style, newPiece = rt.cur && rt.cur !== old;
      // death: a bell and a lament, then silence
      A.S.queue = [{ type: 'death', forced: true }]; SC.tick(); await wait(1800); SC.tick();
      const lam = rt.cur && rt.cur.piece, lament = !!lam && lam.silence === null && lam.notes[0].k === 'bell' && lam.notes.filter(x => x.k === 'lead').slice(-1)[0].g === 0;
      A.S.queue = []; pc.home = home;
      SC.stop(); UI.set.music = false;
      return { winter, spring, summer, night, peaceDrums, warDrums, minor, lead: lead.length, fight, death, nightScene, faith, live, sunk, back, before, after, fading, mid, newPiece, lament, evShape: !!A.evShape };
    });
    const L = r.live;
    const ok = r.winter < r.spring && r.spring < r.summer && r.night < r.summer && r.peaceDrums === 0 && r.warDrums > 20 && r.minor > 0 &&
      r.fight === 'fight' && r.death === 'death' && (!r.evShape || (r.nightScene === true && r.faith === true)) &&
      L.sameAsCompose && L.due >= 3 && L.played >= L.due && L.prefix && r.sunk < 0.3 && r.back > 0.9 &&
      r.before !== r.after && /elf/.test(r.after) && r.mid < r.fading && r.newPiece && r.lament;
    return { ok, detail: `notes sounding in winter ${r.winter}, spring ${r.spring}, summer ${r.summer}, a summer night ${r.night}; tabor hits in peace ${r.peaceDrums}, at war ${r.warDrums}, ${r.minor}/${r.lead} melody notes lowered at war; scenes: duel=${r.fight}, death=${r.death}, tavern at night=${r.evShape ? r.nightScene : 'n/a (no event shapes in this build)'}, faith rings the temple bell=${r.evShape ? r.faith : 'n/a'}; live: the piece is the composed one ${L.sameAsCompose}, ${L.played} notes scheduled in 11 s, the plan's first ${L.due} in order ${L.prefix}; a duel sinks the score to ${r.sunk.toFixed(2)} and it comes back to ${r.back.toFixed(2)}; a move from ${r.before} to ${r.after}: the old piece fades ${r.fading.toFixed(2)} -> ${r.mid.toFixed(2)} and a new one starts ${r.newPiece}; death brings a bell and a lament ending on the tonic, then silence: ${r.lament}` };
  },

  // the score changes nothing: no random number drawn, no state written, by the scheduler or by drawing the screen;
  // a life played with the score ticking every step ends exactly as one played without it
  async scorePure(pg) {
    const r = await pg.evaluate(async () => {
      const SC = UI.SCORE, life = tick => {
        A.newGame({ seed: 7303, race: 'human', realm: 'POL-02', status: 'artisan', sex: 'M', startAge: 20 });
        UI.screen = 'game'; UI.tab = 'life'; UI.set.hints = false; A.S.queue = [];
        const out = T.play(3, { each: () => { if (tick) { SC.tick(); UI.render(); } }, onEvent: () => { if (tick) SC.tick(); } });
        return { out, h: T.hash(JSON.stringify(A.S)), rng: JSON.stringify(A.rngState) };
      };
      const off = life(false);
      UI.set.music = true; SC.start();
      const on = life(true);
      // and with the state still, the scheduler and the drawing touch nothing
      const s0 = JSON.stringify(A.S), r0 = JSON.stringify(A.rngState); let draws = 0; const R = A.rand; A.rand = function () { draws++; return R.apply(this, arguments); };
      for (let i = 0; i < 20; i++) { SC.tick(); UI.render(); }
      UI.ov = { type: 'menu' }; UI.render(); UI.ov = null; UI.render();
      await new Promise(res => setTimeout(res, 10000)); SC.tick();   // the timer runs about forty more ticks, past the drone's opening
      A.rand = R;
      const still = JSON.stringify(A.S) === s0 && JSON.stringify(A.rngState) === r0;
      const notes = SC.stats().notes;
      SC.stop(); UI.set.music = false;
      return { off, on, still, draws, notes };
    });
    const ok = r.off.h === r.on.h && r.off.rng === r.on.rng && r.still && r.draws === 0 && r.notes >= 3;
    return { ok, detail: `three years played with the score ticking and the screen drawn each step end in the same state (${r.off.h === r.on.h}) and random stream (${r.off.rng === r.on.rng}) as without; ${r.notes} notes scheduled; twenty more ticks and drawings, the menu, then 10 s of the score playing: state unchanged ${r.still}, ${r.draws} random draws` };
  },

  // the menu: the toggle starts and stops the score, the slider sets its volume and is saved; turned off, every node
  // stops and the context closes; a hidden tab suspends it and a shown one resumes it
  async scoreMenu(pg) {
    const r = await pg.evaluate(async () => {
      const SC = UI.SCORE, wait = ms => new Promise(res => setTimeout(res, ms));
      A.newGame({ seed: 7304, race: 'human', realm: 'POL-01', status: 'noble', sex: 'F', startAge: 26 });
      UI.screen = 'game'; UI.tab = 'life'; UI.set.hints = false; A.S.queue = []; UI.render();
      A.S.queue = []; UI.ov = { type: 'menu' }; UI.render();
      const box = document.querySelector('[data-c="setMusic"]'), vol = document.querySelector('[data-c="setMusicVol"]');
      const has = !!box && !!vol && vol.type === 'range' && !box.checked;
      box.checked = true; box.dispatchEvent(new Event('change', { bubbles: true }));
      const started = !!SC.peek() && UI.set.music === true;
      await wait(3000);
      const live1 = SC.stats().live, g1 = SC.peek().g.master.gain.value;
      vol.value = '20'; vol.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(600);
      const g2 = SC.peek().g.master.gain.value, saved = JSON.parse(localStorage.getItem(UI.SET_KEY) || '{}');
      // hidden: suspended, the timer stops; shown: running again
      const vis = v => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); };
      vis('hidden'); await wait(500);
      const rt = SC.peek(), hid = rt.ctx.state, t1 = rt.ticks; await wait(700); const frozen = rt.ticks === t1;
      vis('visible'); await wait(600);
      const shown = rt.ctx.state, ticking = rt.ticks > t1;
      delete document.visibilityState; delete document.hidden;
      A.S.queue = []; UI.ov = { type: 'menu' }; UI.render();
      const box2 = document.querySelector('[data-c="setMusic"]'), checkedNow = box2.checked;
      box2.checked = false; box2.dispatchEvent(new Event('change', { bubbles: true }));
      await wait(500);
      const st = SC.stats();
      UI.ov = null;
      return { has, started, live1, g1, g2, saved: { music: saved.music, vol: saved.musicVol }, hid, frozen, shown, ticking, checkedNow, after: st, peek: SC.peek() === null };
    });
    const ok = r.has && r.started && r.live1 > 0 && r.g1 > 0.3 && Math.abs(r.g2 - 0.04) < 0.01 && r.saved.music === true && r.saved.vol === 20 &&
      r.hid === 'suspended' && r.frozen && r.shown === 'running' && r.ticking && r.checkedNow && r.peek && r.after.live === 0 && r.after.state === 'closed';
    return { ok, detail: `menu has the toggle and slider ${r.has}; on: ${r.live1} sources playing at gain ${r.g1.toFixed(2)}; slider to 20: gain ${r.g2.toFixed(3)}, saved ${JSON.stringify(r.saved)}; hidden tab ${r.hid}, scheduler stopped ${r.frozen}; shown ${r.shown}, ticking ${r.ticking}; off: ${r.after.live} sources left, context ${r.after.state}` };
  },

  // 20 s rendered offline for three lands (and the lament, and the dwarves at war): never silent, never clipping;
  // written as WAV files for a person to hear
  async scoreRender(pg) {
    const cases = [['north-spring', { cult: 'CUL-02', season: 1 }], ['desert-summer', { cult: 'CUL-04', season: 2 }], ['elves-autumn', { cult: 'CUL-19', season: 3 }],
      ['holds-at-war', { cult: 'CUL-21', season: 0, war: true }], ['lament', { cult: 'CUL-02', lament: true }]];
    const res = [];
    for (const [name, o] of cases) {
      const r = await pg.evaluate(async o => {
        const out = await UI.SCORE.renderOffline(Object.assign({ key: 'wav|1', seconds: 20, vol: 100 }, o)), b = out.buffer, sr = b.sampleRate;
        const L = b.getChannelData(0), R = b.getChannelData(1), n = L.length;
        let pk = 0, ss = 0, nan = 0, quiet = 0, wins = 0;
        for (let i = 0; i < n; i++) { const a = L[i], c = R[i]; if (a !== a || c !== c) nan++; pk = Math.max(pk, Math.abs(a), Math.abs(c)); ss += a * a + c * c; }
        for (let s = 2 * sr; s + sr <= n; s += sr) { let q = 0; for (let i = s; i < s + sr; i++) q += L[i] * L[i]; wins++; if (Math.sqrt(q / sr) < 0.003) quiet++; }
        // 16-bit stereo WAV, base64
        const bytes = new Uint8Array(44 + n * 4), dv = new DataView(bytes.buffer), w = (o2, s) => { for (let i = 0; i < s.length; i++) bytes[o2 + i] = s.charCodeAt(i); };
        w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
        dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
        for (let i = 0, p = 44; i < n; i++, p += 4) { dv.setInt16(p, Math.max(-1, Math.min(1, L[i])) * 32767, true); dv.setInt16(p + 2, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
        let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        return { peak: pk, rms: Math.sqrt(ss / n / 2), nan, quiet, wins, notes: out.notes, ms: out.ms, wav: btoa(bin) };
      }, o);
      fs.mkdirSync(WAV_DIR, { recursive: true });
      const file = `${WAV_DIR}/score-${name}.wav`; fs.writeFileSync(file, Buffer.from(r.wav, 'base64'));
      res.push(Object.assign({ name, file }, r, { wav: undefined }));
    }
    const ok = res.every(x => x.nan === 0 && x.peak < 0.9 && x.peak > 0.05 && x.rms > 0.01 && x.rms < 0.2 && x.quiet <= 2);
    return { ok, detail: res.map(x => `${x.name}: peak ${x.peak.toFixed(2)}, RMS ${x.rms.toFixed(3)} (${(20 * Math.log10(x.rms)).toFixed(0)} dBFS), ${x.quiet}/${x.wins} quiet seconds, ${x.notes} notes`).join('; ') + ` (full volume; WAVs in ${WAV_DIR}/score-*.wav)` };
  },

  // the instruments: the plucked strings are in tune (autocorrelation, within 3 cents from 50 to 1000 Hz), the bell's
  // partials sit where a bell's do, the drum thumps low; every buffer is finite and normalized
  async scoreInstruments(pg) {
    const r = await pg.evaluate(() => {
      const S = UI.SCORE.SYNTH, sr = 24000, out = [];
      const pitch = (y, f) => {   // the autocorrelation peak near the expected period, refined by a parabola
        const a = Math.floor(sr * 0.1), n = Math.floor(sr * 0.25), P = sr / f, ac = l => { let s = 0; for (let i = a; i < a + n; i++) s += y[i] * y[i + l]; return s; };
        let best = 0, bl = 0; for (let l = Math.floor(P * 0.94); l <= Math.ceil(P * 1.06); l++) { const v = ac(l); if (v > best) { best = v; bl = l; } }
        const y0 = ac(bl - 1), y1 = best, y2 = ac(bl + 1), d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2));
        return sr / (bl + d);
      };
      for (const m of [43, 50, 55, 62, 69, 74, 81, 84]) for (const [br, t] of [[0.32, 1.8], [0.55, 3.4]]) {
        const [y] = S.string(sr, m, br, t, 1.2), f = 440 * Math.pow(2, (m - 69) / 12), g = pitch(y, f);
        out.push(Math.abs(1200 * Math.log2(g / f)));
      }
      const [b] = S.bell(sr, 50), [d] = S.drum(sr, 'dum'), [k] = S.drum(sr, 'tek');
      const peak = y => y.reduce((a, x) => Math.max(a, Math.abs(x)), 0), finite = y => y.every(Number.isFinite);
      // the drum's energy is low: zero crossings in its first 0.1 s
      let zc = 0; for (let i = 1; i < sr * 0.1; i++) if (d[i - 1] < 0 && d[i] >= 0) zc++;
      return { cents: Math.max(...out), n: out.length, bellPeak: peak(b), drumPeak: peak(d), tekPeak: peak(k), finite: finite(b) && finite(d) && finite(k), drumHz: zc * 10 };
    });
    const ok = r.n === 16 && r.cents < 3 && Math.abs(r.bellPeak - 1) < 0.01 && Math.abs(r.drumPeak - 1) < 0.01 && r.finite && r.drumHz < 160;
    return { ok, detail: `${r.n} plucked strings (lute and harp, G2 to C6) in tune within ${r.cents.toFixed(2)} cents; bell and drum normalized (${r.bellPeak.toFixed(2)}, ${r.drumPeak.toFixed(2)}, rim ${r.tekPeak.toFixed(2)}); the thump sits near ${r.drumHz} Hz` };
  },

  // what it costs: the audio graph's render time against real time (offline, the busiest family at war in summer,
  // and the same without the room), the audio thread's render time in a 8 s Chrome trace of the live score, and the
  // main thread's scheduler time
  async scoreCpu(pg, errs, { browser }) {
    const off = await pg.evaluate(async () => {
      const SC = UI.SCORE, o = { cult: 'CUL-22', key: 'cpu|1', season: 2, war: true, seconds: 60 }, long = await SC.renderOffline({ cult: 'CUL-08', key: 'mem|1', season: 2, seconds: 200 });
      await SC.renderOffline(Object.assign({}, o, { seconds: 5 }));   // warm the string and drum buffers
      const a = await SC.renderOffline(o), b = await SC.renderOffline(Object.assign({}, o, { room: false })), q = await SC.renderOffline(Object.assign({}, o, { cult: 'CUL-02', season: 1, war: false }));
      return { busy: a.ms / 600, dry: b.ms / 600, calm: q.ms / 600, nodes: a.nodes / 60, memKb: long.kb, memN: long.buffers };
    });
    await pg.evaluate(() => { A.newGame({ seed: 7305, race: 'orc', realm: 'POL-11', status: 'peasant', sex: 'M', startAge: 24 }); UI.screen = 'game'; UI.set.hints = false; A.S.queue = []; UI.render(); UI.set.music = true; UI.SCORE.start(); });
    await sleep(6000);
    let audio = null;
    const s0 = await pg.evaluate(() => { const s = UI.SCORE.stats(); return { ms: s.ms, ticks: s.ticks, made: s.made, t: performance.now() }; });
    try {
      await browser.startTracing(pg, { categories: ['audio', 'webaudio'] });
      await sleep(8000);
      const tr = JSON.parse((await browser.stopTracing()).toString()), ev = tr.traceEvents || tr;
      // the thread's own time (tdur) where the trace has it: wall time (dur) counts the waits of a shared CI runner, where
      // four test pages run at once (it read 17% there against 12% here)
      let us = 0; for (const e of ev) if (e.ph === 'X' && e.name === 'AudioOutputDevice::FireRenderCallback') us += (e.tdur != null ? e.tdur : e.dur) || 0;
      audio = us / 1000 / 8000 * 100;
    } catch (e) { await sleep(8000); }
    const s1 = await pg.evaluate(() => { const s = UI.SCORE.stats(); UI.SCORE.stop(); UI.set.music = false; return { ms: s.ms, ticks: s.ticks, made: s.made, t: performance.now(), kb: s.kb, buffers: s.buffers }; });
    const cost = await pg.evaluate(() => {   // the main thread's one-off work: composing a piece, computing a string
      const SC = UI.SCORE; let t = performance.now(); for (let i = 0; i < 20; i++) SC.compose({ cult: 'CUL-08', key: 'c|' + i, season: 2 }); const compose = (performance.now() - t) / 20;
      t = performance.now(); for (let i = 0; i < 10; i++) SC.SYNTH.string(24000, 50 + i, 0.55, 3.4, 2.9); const str = (performance.now() - t) / 10;
      let bell = Infinity; for (let i = 0; i < 3; i++) { t = performance.now(); SC.SYNTH.bell(24000, 50 + i); bell = Math.min(bell, performance.now() - t); }   // the best of three: one try read another page's work
      return { compose, str, bell };
    });
    const secs = (s1.t - s0.t) / 1000, main = (s1.ms - s0.ms) / secs / 10, perSec = (s1.made - s0.made) / secs;
    const ok = off.busy < 15 && off.calm < 15 && main < 1 && (audio == null || audio < 15) && off.memKb < 16000 && cost.compose < 50 && cost.bell < 40;
    return { ok, detail: `offline render (one thread, as a share of real time): the clans at war in summer ${off.busy.toFixed(1)}% of a core (${off.dry.toFixed(1)}% without the room), the north in spring ${off.calm.toFixed(1)}%; live: audio thread ${audio == null ? 'n/a (no trace)' : audio.toFixed(1) + '%'} of a core over an 8 s trace, main-thread scheduler ${main.toFixed(2)}% (${s1.ticks - s0.ticks} ticks), ${perSec.toFixed(1)} sources started per second; buffers kept after 200 s of the Golden Plains in summer: ${off.memN} (${(off.memKb / 1024).toFixed(1)} MB); one-off work: a piece composed in ${cost.compose.toFixed(1)} ms, a harp string computed in ${cost.str.toFixed(1)} ms, a bell in ${cost.bell.toFixed(1)} ms` };
  },
};
