// A calm score for each land (Road to Ten, Visual art 7: "Add sound: a calm score per region and UI sounds").
// The UI sounds are 61-illumination's (quill, paper, seal, bell, steel). This is the music: procedural, made in the
// page with Web Audio, no files and nothing fetched. Off until the player turns it on; no audio context exists before.
//
//   instruments  a plucked lute and harp (Karplus-Strong strings, computed once per pitch into a buffer), a bowed
//                vielle (two detuned saws through a low-pass, with a slow bow swell and vibrato), a breathy flute
//                (a soft periodic wave plus band-passed breath), a frame drum or tabor (a pitched thump and a rim),
//                a low bell (inharmonic partials), and a little room (a convolution reverb from an impulse response
//                generated once per context).
//   modes        modes.core.js: each culture hears one of 14 families, each with its mode, its war colour, its tempo,
//                its instruments and its drone. That table is the part a composer would retune.
//   phrases      a piece of 2 to 4 minutes: a drone on the tonic swells in; a lead plays phrases cut from two or three
//                short motifs (mostly stepwise, a leap now and then, rests between), a half cadence on the fifth then a
//                full one on the tonic; a second section answers on another instrument; drone-only gaps let it breathe;
//                then 30 to 90 seconds of silence before the next piece.
//   the game     read, never written: the culture of the land where you live, the season (winter thin, summer full),
//                your realm at war (a slow tabor, and the mode turns to its war colour), a battle or duel (the score
//                sinks under 61's steel), death (a bell and a lament), a scene at night (a tavern, a dark road: the
//                score goes softer and darker), a scene of faith or a funeral (a temple bell). Every change fades.
//
// Purity: the score never touches A.S or A.rand. Its randomness is a seeded PRNG keyed by the culture, the province,
// the year and the season, so the same place and date always compose the same piece (SC.compose is a pure function).
// CPU: a lookahead scheduler (a timer every 250 ms schedules what falls in the next 1.6 s on the audio clock);
// nodes are made per note or per phrase, never per sample; strings, bells and drums are buffers computed once.
(function () {
  const SC = UI.SCORE = UI.SCORE || {};
  if (UI.set.music == null) UI.set.music = false;
  if (UI.set.musicVol == null) UI.set.musicVol = 60;
  SC.LOOK = 1.6;        // seconds of music scheduled ahead
  SC.TICK = 250;        // ms between scheduler runs
  const SEASON = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0];   // month -> winter 0, spring 1, summer 2, autumn 3 (as the woodcuts)
  const NIGHT = new Set(['tavern', 'menace', 'crime', 'errand']);   // the scenes 61's woodcuts draw at night
  const LEGATO = new Set(['flute', 'vielle']);

  // ---------------------------------------------------------------- pure helpers
  const hash = s => { let h = 2166136261 >>> 0; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; };
  const prng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const wpick = (r, w) => { const ks = Object.keys(w); let tot = 0; for (const k of ks) tot += w[k]; let x = r() * tot; for (const k of ks) { x -= w[k]; if (x < 0) return k; } return ks[ks.length - 1]; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const r3 = x => Math.round(x * 1000) / 1000;
  SC.hash = hash; SC.prng = prng;

  // the family a culture hears, with its own retuning merged in
  SC.family = function (cult) {
    const c = SC.CULTURES[cult] || SC.CULTURES[SC.DEFAULT_CULT];
    const F = Object.assign({}, SC.FAMILIES[c.fam], c.over || {});
    F.id = c.fam; F.style = c.over ? c.fam + '/' + (SC.CULTURES[cult] ? cult : SC.DEFAULT_CULT) : c.fam;
    const n = F.mode.length; let five = 0;
    for (let i = 0; i < n; i++) if (Math.abs(F.mode[i] - 7) < Math.abs(F.mode[five] - 7)) five = i;
    F.n = n; F.five = five;
    return F;
  };
  // a scale degree (any integer; n degrees to the octave) as a MIDI pitch, in peace or in the war colour
  SC.pitch = function (F, g, war) {
    const m = war && F.warMode ? F.warMode : F.mode, n = m.length, o = Math.floor(g / n);
    return F.tonic + 12 * o + m[g - o * n];
  };

  // ---------------------------------------------------------------- composition (pure)
  // o: { cult, key, season (0 winter .. 3 autumn), lament }. Returns { style, bpm, dur, silence, notes: [...] }.
  // A note: t start (s), d length (s), k kind (lead fill drone bell drum), i instrument, g scale degree, v velocity,
  //         L layer (base fill pulse war temple), p phrase number (lead), c 1 on a cadence's last note.
  const STEP_W = { '-1': 4, '1': 4, '-2': 1.2, '2': 1.2, '0': 0.7, '3': 0.35, '-3': 0.35 };
  SC.compose = function (o) {
    const F = SC.family(o.cult), season = o.season == null ? 1 : o.season;
    const r = prng(hash(F.style + '|' + o.key + '|' + season + (o.lament ? '|lament' : '')));
    const n = F.n, five = F.five, notes = [];
    const bpm = F.bpm * [0.9, 1, 1.04, 0.97][season] * (o.lament ? 0.72 : 0.95 + r() * 0.1), B = 60 / bpm;
    const restMul = [1.5, 1, 0.8, 1.15][season];
    const add = x => { x.t = r3(x.t * B); x.d = r3(x.d * B); notes.push(x); return x; };
    const lo = -2, hi = n + 4;
    const reflect = g => g < lo ? lo + (lo - g) : g > hi ? hi - (g - hi) : g;
    let ph = 0;
    const motif = () => {
      const len = 3 + Math.floor(r() * 3), steps = [], rh = [];
      for (let i = 0; i < len; i++) { steps.push(i ? +wpick(r, STEP_W) : 0); rh.push(pick(r, F.rhythm)); }
      return { steps, rh };
    };
    const vel = first => r3((first ? 0.88 : 0.72) + r() * 0.12);
    // a phrase from b (beats): motif instances, then a stepwise approach to the cadence note, held long
    const phrase = (b, inst, mots, start, end, fills) => {
      const p = ++ph, out = []; let g = start;
      const reps = 2 + (r() < 0.4 ? 1 : 0);
      for (let k = 0; k < reps; k++) {
        const m = mots[k % mots.length], inv = r() < 0.2;
        if (k) g = reflect(g + pick(r, [0, 1, -1, 2, -2]));
        for (let i = 0; i < m.steps.length; i++) {
          if (i) g = reflect(g + m.steps[i] * (inv ? -1 : 1));
          out.push(add({ t: b, d: m.rh[i] * 0.97, k: 'lead', i: inst, g, v: vel(!i), L: 'base', p }));
          b += m.rh[i];
        }
        if (r() < 0.35 * restMul) b += pick(r, [0.5, 1, 1]);
      }
      let gap = end - g;
      if (Math.abs(gap) > 3) { g = end - Math.sign(gap) * 2; out.push(add({ t: b, d: 0.97, k: 'lead', i: inst, g, v: vel(0), L: 'base', p })); b += 1; }
      while (g !== end) { g += Math.sign(end - g); if (g === end) break; out.push(add({ t: b, d: 0.97, k: 'lead', i: inst, g, v: vel(0), L: 'base', p })); b += 1; }
      const hold = 3 + (r() < 0.5 ? 1 : 0);
      out.push(add({ t: b, d: hold, k: 'lead', i: inst, g: end, v: vel(0), L: 'base', p, c: 1 }));
      // the fill: a dyad at the phrase's start, and a plucked note under each long one (not with an ostinato)
      if (fills && !F.ostinato) {
        const t0 = out[0].t / B;
        add({ t: t0, d: 2, k: 'fill', i: F.fill, g: -n, v: 0.5, L: 'fill' });
        add({ t: t0 + 0.02, d: 2, k: 'fill', i: F.fill, g: five - n, v: 0.42, L: 'fill' });
        for (const x of out) if (x.d / B >= 1.9) add({ t: x.t / B, d: 2, k: 'fill', i: F.fill, g: pick(r, [0, five, x.g - 2]) - n, v: 0.42, L: 'fill' });
      }
      return b + hold;
    };
    const drone = (b, len, g) => { if (F.drone[0] === 'bowed') add({ t: b, d: len, k: 'drone', i: 'bowed', g, v: 1, L: 'base' }); else if (F.drone[0] === 'pluck') for (let x = b; x < b + len - 1; x += 2) add({ t: x, d: 2, k: 'drone', i: 'tanpura', g, s: Math.round(x / 2) % F.drone[1].length, v: 0.8, L: 'base' }); };
    const bell = (b, L) => add({ t: b, d: 7 / B, k: 'bell', i: 'bell', g: 0, v: 0.9, L });
    const drums = (from, to) => {
      for (const [pat, L] of [[F.pulse, 'pulse'], [F.warPulse, 'war']]) if (pat) {
        for (let b = Math.ceil(from), s = 0; b < to; b += 0.5, s++) {
          const x = pat[s % pat.length]; if (!x) continue;
          add({ t: b + (r() - 0.5) * 0.02, d: 1, k: 'drum', i: x === 1 ? 'dum' : 'tek', g: 0, v: r3((s % pat.length === 0 ? 0.8 : 0.6) + r() * 0.12), L });
        }
      }
    };

    if (o.lament) {
      // death: a single bell, a drone, and one slow phrase falling from the fifth to the tonic
      bell(0.3, 'base');
      const inst = F.lead.vielle ? 'vielle' : 'flute', p = ++ph;
      const line = [five, five + 1, five, five - 1, five - 2, five - 1, five - 3, 1, 0].filter(g => g >= -1);
      let b = 4;
      line.forEach((g, i) => { const d = i === line.length - 1 ? 5 : pick(r, [1.5, 2, 2]); add({ t: b, d: d * 0.97, k: 'lead', i: inst, g, v: 0.7, L: 'base', p, c: i === line.length - 1 ? 1 : 0 }); b += d; });
      drone(1.5, b + 4 - 1.5, 0);
      notes.sort((a, b2) => a.t - b2.t);
      return { style: F.style, key: o.key, bpm: r3(bpm), dur: r3((b + 6) * B), silence: null, notes };
    }

    const target = (135 + r() * 85) / B;   // the closing phrase and the tail come on top; 2 to 4 minutes in all
    const motA = [motif(), motif()], motB = [motif(), motif()];
    const leads = Object.keys(F.lead), leadA = wpick(r, F.lead);
    const leadB = leads.length > 1 ? (() => { let x = leadA, g = 0; while (x === leadA && g++ < 20) x = wpick(r, F.lead); return x; })() : leadA;
    let b = 0, droneAt = 0, droneG = 0;
    const moveDrone = (to, at) => { if (to === droneG) return; drone(droneAt, at + 2 - droneAt, droneG); droneAt = at; droneG = to; };
    if (F.bells >= 1) bell(0.5, 'base');
    b = 6 + Math.floor(r() * 4);   // the drone alone first
    const startDrums = b;
    const ostinato = (from, to, base) => {
      const fig = [0, five, n, five + 1, n + 1, five].map((x, i) => x + (i % 2 ? 0 : -n) + base);
      for (let x = from, i = 0; x < to - 0.5; x += 0.5, i++) add({ t: x, d: 1, k: 'fill', i: F.fill, g: fig[i % fig.length], v: i % 6 ? 0.34 : 0.46, L: 'fill' });
    };
    const order = ['A', 'B', 'gap', 'A2', 'B', 'gap'];
    let done = 0;
    for (let s = 0; ; s = (s + 1) % order.length) {
      const sec = order[s], from = b, mark = notes.length, keep = [droneAt, droneG, ph];
      if (F.bells >= 2 && sec !== 'gap') bell(b, 'base');
      if (sec !== 'gap') bell(b, 'temple');
      if (sec === 'A' || sec === 'A2') {
        const inst = sec === 'A' ? leadA : (r() < 0.5 ? leadA : leadB);
        b = phrase(b, inst, motA, pick(r, [0, 2, five]), five, true) + Math.round((2 + r() * 2) * restMul);
        b = phrase(b, inst, sec === 'A2' ? [motA[1], motA[0]] : motA, pick(r, [five, 2, n]), 0, true) + Math.round((2 + r() * 3) * restMul);
      } else if (sec === 'B') {
        if (F.droneMove != null) moveDrone(F.droneMove, b);
        b = phrase(b, leadB, motB, pick(r, [five, n, five + 1]), five, true) + Math.round((2 + r() * 2) * restMul);
        if (F.droneMove != null) moveDrone(0, b - 1);
        b = phrase(b, leadB, [motB[0], motA[0]], pick(r, [five, 2]), 0, true) + Math.round((2 + r() * 3) * restMul);
      } else {
        // a gap: the drone, and a slow rising figure on the fill instrument
        const len = Math.round((4 + r() * 4) * restMul);
        [0, five, n].forEach((g, i) => add({ t: b + i * 1.5, d: 2, k: 'fill', i: F.fill, g: g - n, v: 0.4, L: 'fill' }));
        b += len;
      }
      if (F.ostinato && sec !== 'gap') ostinato(from, b, 0);
      // a section that runs past the piece's length is taken back, and the piece closes instead
      if (done && (b + 30) * B > 224) { notes.length = mark; b = from; [droneAt, droneG, ph] = keep; break; }
      done++;
      if (b > target - 22) break;
    }
    // the last phrase comes home on the tonic; the drone dies away after it
    b = phrase(b, leadA, [motA[0]], pick(r, [2, five]), 0, true);
    drone(droneAt, b + 6 - droneAt, droneG);
    drums(startDrums, b - 2);
    notes.sort((a, b2) => a.t - b2.t);
    return { style: F.style, key: o.key, bpm: r3(bpm), dur: r3((b + 8) * B), silence: r3(30 + r() * 60), notes };
  };

  // what plays now: the base always; the fill by season (summer all, spring and autumn half, winter and night none);
  // a peaceful drum pulse outside winter and night; the war layer at war; the temple layer in a scene of faith
  SC.plays = (x, m, i) => x.L === 'base' || (x.L === 'fill' && !m.night && (m.season === 2 || (m.season !== 0 && i % 2 === 0))) ||
    (x.L === 'pulse' && !m.night && m.season !== 0) ||
    (x.L === 'war' && !!m.war) || (x.L === 'temple' && !!m.temple);

  // the notes of a piece that sound in a mood (by index): what the scheduler will play, worked out without audio
  SC.plan = (piece, m) => { const out = []; piece.notes.forEach((x, i) => { if (SC.plays(x, m, i)) out.push(i); }); return out; };

  // ---------------------------------------------------------------- the game, read only
  SC.mood = function () {
    const S = A.S;
    if (!S || !S.people || UI.screen !== 'game') return { scene: 'title', cult: SC.TITLE_CULT, prov: -1, year: 0, season: 1, war: false, night: false, temple: false, pid: 0 };
    const pc = A.pc(), q = S.queue && S.queue[0];
    const pv = pc && S.prov ? S.prov[pc.home] : null;
    const R = pv && S.realms ? (S.realms[pv.orig] || S.realms[pv.owner]) : null;
    const cult = (R && R.cult) || (pv && GD.REALM_CULTURE && GD.REALM_CULTURE[pv.orig]) || (pc && pc.cult) || SC.DEFAULT_CULT;
    let season = 1; try { season = SEASON[A.monthOf(A.today()).m]; } catch (e) {}
    let war = false; try { war = !!(pc && pc.realm && A.atWar(pc.realm).length); } catch (e) {}
    let shape = null;
    if (q && q.type === 'event' && A.evShape && A.EV && A.EV[q.ev]) try { shape = A.evShape(A.EV[q.ev]); } catch (e) {}
    const dead = !pc || !pc.alive || (q && q.type === 'death'), fight = !!q && (q.type === 'battle' || q.type === 'duel');
    return { scene: dead ? 'death' : fight ? 'fight' : 'calm', cult, prov: pv ? pv.id : -1, year: S.year, season, war,
      night: NIGHT.has(shape), temple: shape === 'faith' || shape === 'death', pid: pc ? pc.id : 0 };
  };

  // ---------------------------------------------------------------- sound: buffers computed once
  const cache = new Map();
  const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
  const toBuf = (c, data) => { const b = c.createBuffer(data.length, data[0].length, c.sampleRate); data.forEach((d, i) => b.copyToChannel ? b.copyToChannel(d, i) : b.getChannelData(i).set(d)); return b; };
  const finish = (y, sr, peak) => {   // remove DC, normalize, fade the tail
    let hp = 0, px = 0, mx = 0;
    for (let i = 0; i < y.length; i++) { const x = y[i]; hp = x - px + 0.995 * hp; px = x; y[i] = hp; if (Math.abs(hp) > mx) mx = Math.abs(hp); }
    const k = mx ? peak / mx : 0, fade = Math.min(y.length, Math.floor(sr * 0.05));
    for (let i = 0; i < y.length; i++) y[i] *= k * (i > y.length - fade ? (y.length - i) / fade : 1);
    return y;
  };
  // a plucked string (Karplus-Strong with a fractional delay, so it is in tune): bright 0..1, t60 seconds
  const string = (sr, midi, bright, t60, len) => memo(`ks|${sr}|${midi.toFixed(2)}|${bright}|${t60}`, () => {
    const f = mtof(midi), P = sr / f, N = Math.floor(sr * len), y = new Float32Array(N), r = prng(hash('ks' + midi.toFixed(2) + bright));
    const E = Math.ceil(P) + 2; let lp = 0;
    for (let i = 0; i < E; i++) { lp += bright * ((r() * 2 - 1) - lp); y[i] = lp; }
    const pos = Math.max(1, Math.round(P * 0.13)); for (let i = E - 1; i >= pos; i--) y[i] -= 0.8 * y[i - pos];   // where it is plucked
    const decay = Math.pow(0.001, 1 / (t60 * f));
    for (let i = E; i < N; i++) { const d = i - P + 0.5, j = Math.floor(d), fr = d - j; y[i] = decay * 0.5 * (y[j] * (1 - fr) + y[j + 1] * fr + y[j - 1] * (1 - fr) + y[j] * fr); }
    return [finish(y, sr, 1)];
  });
  // a low bell: a hum, a prime, a minor third, a fifth, a nominal and higher partials, each with its own decay
  const bellData = (sr, midi) => memo(`bell|${sr}|${midi}`, () => {
    const f = mtof(midi), N = Math.floor(sr * 7), y = new Float32Array(N);
    const P = [[0.5, 1, 1], [0.501, 0.5, 1], [1, 0.8, 0.7], [1.002, 0.4, 0.7], [1.19, 0.5, 0.5], [1.5, 0.3, 0.38], [2, 0.45, 0.3], [2.51, 0.18, 0.22], [2.66, 0.2, 0.2], [3.01, 0.1, 0.14], [4.2, 0.06, 0.09]];
    for (const [ratio, amp, life] of P) {
      const w = 2 * Math.PI * f * ratio / sr; if (w >= Math.PI) continue;
      const c2 = 2 * Math.cos(w), tau = 6.5 * life * sr / 6.9; let s1 = 0, s2 = -Math.sin(w);   // a sine by recurrence
      for (let i = 0; i < N; i++) { const s = c2 * s1 - s2; s2 = s1; s1 = s; y[i] += amp * s * Math.exp(-i / tau) * Math.min(1, i / (sr * 0.004)); }
    }
    return [finish(y, sr, 1)];
  });
  // the frame drum: a thump that falls in pitch, or a rim stroke
  const drumData = (sr, kind) => memo(`drum|${sr}|${kind}`, () => {
    const N = Math.floor(sr * (kind === 'dum' ? 0.6 : 0.25)), y = new Float32Array(N), r = prng(hash('drum' + kind));
    let ph = 0, lp = 0, lp2 = 0;
    for (let i = 0; i < N; i++) {
      const t = i / sr;
      if (kind === 'dum') { const f = 62 + 50 * Math.exp(-t / 0.04); ph += 2 * Math.PI * f / sr; lp += 0.08 * ((r() * 2 - 1) - lp); y[i] = Math.sin(ph) * Math.exp(-t / 0.16) + lp * 1.4 * Math.exp(-t / 0.02); }
      else { const w = r() * 2 - 1; lp += 0.5 * (w - lp); lp2 += 0.08 * (lp - lp2); ph += 2 * Math.PI * 330 / sr; y[i] = (lp - lp2) * Math.exp(-t / 0.045) + 0.4 * Math.sin(ph) * Math.exp(-t / 0.03); }
    }
    return [finish(y, sr, kind === 'dum' ? 1 : 0.7)];
  });
  const noiseData = sr => memo(`noise|${sr}`, () => { const N = sr * 2, y = new Float32Array(N), r = prng(7); for (let i = 0; i < N; i++) y[i] = r() * 2 - 1; return [y]; });
  // the room: two seconds of decaying noise that darkens as it fades, a few early reflections
  const roomData = sr => memo(`room|${sr}`, () => {
    const N = Math.floor(sr * 2.2), out = [];
    for (let ch = 0; ch < 2; ch++) {
      const y = new Float32Array(N), r = prng(hash('room' + ch)); let lp = 0;
      for (let i = Math.floor(sr * 0.012); i < N; i++) { const t = i / sr, a = 0.6 - 0.5 * (t / 2.2); lp += a * ((r() * 2 - 1) - lp); y[i] = lp * Math.exp(-6.9 * t / 2.1); }
      for (const [ms, g] of [[17, 0.5], [29, 0.35], [41, 0.3], [59, 0.22]]) y[Math.floor(sr * (ms + ch * 3) / 1000)] += g;
      out.push(y);
    }
    return out;
  });
  SC.SYNTH = { string, bell: bellData, drum: drumData, room: roomData };   // the raw sample data, for tests and a composer
  const bufs = new WeakMap();   // context -> its AudioBuffers
  const buf = (c, k, make) => { let m = bufs.get(c); if (!m) bufs.set(c, m = new Map()); if (!m.has(k)) m.set(k, toBuf(c, make())); return m.get(k); };

  // ---------------------------------------------------------------- the graph: one per audio context
  // voices -> piece -> tone (night) -> dry + room -> scene (fight fade) -> master (volume) -> limiter -> out
  const graph = c => {
    const g = { master: c.createGain(), lim: c.createDynamicsCompressor(), scene: c.createGain(), tone: c.createBiquadFilter(), dry: c.createGain(), wet: c.createGain(), room: c.createConvolver() };
    g.master.gain.value = 0;
    g.lim.threshold.value = -8; g.lim.knee.value = 8; g.lim.ratio.value = 6; g.lim.attack.value = 0.01; g.lim.release.value = 0.3;
    g.tone.type = 'lowpass'; g.tone.frequency.value = 9000; g.tone.Q.value = 0.5;
    g.room.buffer = buf(c, 'room', () => roomData(c.sampleRate));
    g.wet.gain.value = 0.3;
    g.tone.connect(g.dry); g.tone.connect(g.room); g.room.connect(g.wet); g.dry.connect(g.scene); g.wet.connect(g.scene);
    g.scene.connect(g.master); g.master.connect(g.lim); g.lim.connect(c.destination);
    return g;
  };
  const mkRT = c => ({ ctx: c, g: graph(c), live: new Set(), cur: null, style: null, next: 0, count: {}, m: null, made: 0, notes: 0, ticks: 0, ms: 0 });
  const track = (rt, node, at, end) => { rt.live.add(node); rt.made++; node.onended = () => rt.live.delete(node); node.start(at); if (end != null) node.stop(end); return node; };
  const G = (c, v) => { const g = c.createGain(); g.gain.value = v; return g; };

  // a buffer voice (string, bell, drum)
  const vBuf = (rt, dest, at, b, v, rate) => {
    const c = rt.ctx, s = c.createBufferSource(), g = G(c, v); s.buffer = b; if (rate) s.playbackRate.value = rate;
    s.connect(g); g.connect(dest); track(rt, s, at); return s;
  };
  const STR = { lute: [0.32, 1.8, 2.2, 0.26], harp: [0.55, 3.4, 3.6, 0.2], tanpura: [0.5, 3.6, 3.8, 0.12] };
  const vString = (rt, dest, at, inst, midi, v) => {
    const [br, t60, len, lvl] = STR[inst] || STR.lute;
    vBuf(rt, dest, at, buf(rt.ctx, `${inst}|${midi.toFixed(2)}`, () => string(rt.ctx.sampleRate, midi, br, t60, len)), lvl * v);
  };
  // a legato phrase on one voice: the flute (a soft wave with breath) or the vielle (two saws, a bow swell)
  const waves = new WeakMap();
  const fluteWave = c => { if (!waves.has(c)) waves.set(c, c.createPeriodicWave(new Float32Array([0, 1, 0.22, 0.09, 0.035, 0.012]), new Float32Array(6))); return waves.get(c); };
  const vLine = (rt, dest, at, inst, ns, F) => {
    const c = rt.ctx, flute = inst === 'flute', end = at + ns[ns.length - 1].t + ns[ns.length - 1].d + 0.6;
    const out = G(c, flute ? 0.16 : 0.1), env = G(c, 0); env.connect(out); out.connect(dest);
    const vib = c.createOscillator(), vd = G(c, 0); vib.frequency.value = flute ? 4.6 : 5.2; vib.connect(vd);
    const oscs = flute ? [c.createOscillator()] : [c.createOscillator(), c.createOscillator()];
    let lp = null;
    if (flute) oscs[0].setPeriodicWave(fluteWave(c));
    else { lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.9; lp.frequency.value = 1100 + 900 * ns.reduce((a, x) => a + x.v, 0) / ns.length; lp.connect(env); }   // fixed: an automated filter costs a coefficient per sample
    oscs.forEach((o, j) => { o.frequency.value = mtof(ns[0].midi); if (!flute) { o.type = 'sawtooth'; o.detune.value = j ? 7 : -7; } vd.connect(o.frequency); o.connect(flute ? env : lp); });
    let bp = null, ng = null;
    if (flute) {
      const nz = c.createBufferSource(); nz.buffer = buf(c, 'noise', () => noiseData(c.sampleRate)); nz.loop = true;
      bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.9; ng = G(c, 0);
      bp.frequency.value = Math.min(8000, 2.2 * mtof(ns.reduce((a, x) => a + x.midi, 0) / ns.length));
      nz.connect(bp); bp.connect(ng); ng.connect(out); track(rt, nz, at - 0.05, end);
    }
    ns.forEach((x, i) => {
      const t = at + x.t, f = mtof(x.midi), v = x.v, nx = ns[i + 1], tied = nx && nx.t - (x.t + x.d) < 0.08;
      for (const o of oscs) { if (!i) o.frequency.setValueAtTime(f, t); else o.frequency.setTargetAtTime(f, t - 0.015, 0.012); }
      env.gain.setTargetAtTime(v, t, flute ? 0.03 : 0.09);
      if (x.d > 1.2) env.gain.setTargetAtTime(v * (flute ? 0.82 : 1.1), t + 0.4, x.d * 0.4);   // a held note settles or swells
      env.gain.setTargetAtTime(tied ? v * 0.6 : 0, t + x.d - (tied ? 0.04 : 0.02), tied ? 0.02 : (flute ? 0.07 : 0.12));
      vd.gain.setValueAtTime(0, t); vd.gain.linearRampToValueAtTime(x.d > 0.5 ? f * (flute ? 0.0045 : 0.006) : 0, t + Math.min(0.7, x.d * 0.7));
      if (flute) { ng.gain.setTargetAtTime(0.22 * v, t, 0.008); ng.gain.setTargetAtTime(0.05 * v, t + 0.05, 0.08); if (!tied) ng.gain.setTargetAtTime(0, t + x.d, 0.05); }
    });
    for (const o of oscs) track(rt, o, at - 0.05, end);
    track(rt, vib, at - 0.05, end);
  };
  // the bowed drone: for each interval a saw and a triangle, through a low-pass that breathes slowly; a long swell
  const vDrone = (rt, dest, at, d, midis) => {
    const c = rt.ctx, end = at + d, rise = Math.min(6, d / 3);
    const env = G(c, 0), lp = c.createBiquadFilter(), saws = G(c, 0.5), lfo = c.createOscillator(), ld = G(c, 0.3);
    lp.type = 'lowpass'; lp.frequency.value = 560; lp.Q.value = 0.7; saws.connect(lp);
    lfo.frequency.value = 0.07; lfo.connect(ld); ld.connect(saws.gain);   // the bow's pressure: the saws breathe against the triangles
    lp.connect(env); env.connect(dest);
    env.gain.setValueAtTime(0, at); env.gain.linearRampToValueAtTime(0.05, at + rise); env.gain.setValueAtTime(0.05, end - rise); env.gain.linearRampToValueAtTime(0, end);
    midis.forEach((m, j) => {
      for (const [type, det, lvl] of [['sawtooth', j % 2 ? 5 : -5, 0.6], ['triangle', 0, 1]]) {
        const o = c.createOscillator(), g = G(c, lvl / Math.sqrt(midis.length)); o.type = type; o.frequency.value = mtof(m); o.detune.value = det;
        o.connect(g); g.connect(type === 'sawtooth' ? saws : lp); track(rt, o, at, end + 0.05);
      }
    });
    track(rt, lfo, at, end + 0.05);
  };

  // play one note of the piece (a lead note starts its whole phrase)
  const playNote = (rt, cur, x, m, at) => {
    const F = cur.F, war = !!m.war, P = g => SC.pitch(F, g, war);
    rt.notes++;
    if (x.k === 'lead') {
      if (LEGATO.has(x.i)) {
        if (cur.phrased.has(x.p)) return; cur.phrased.add(x.p);
        const ns = cur.phrases[x.p].map(y => ({ t: y.t - x.t, d: y.d, v: y.v, midi: P(y.g) + (x.i === 'flute' ? 12 : 0) }));
        vLine(rt, cur.gain, at, x.i, ns, F);
        if (F.parallel) vLine(rt, cur.gain, at, x.i, ns.map(y => Object.assign({}, y, { v: y.v * 0.6, midi: y.midi + F.parallel })), F);
      } else {
        vString(rt, cur.gain, at, x.i, P(x.g), x.v);
        if (F.parallel) vString(rt, cur.gain, at + 0.012, x.i, P(x.g) + F.parallel, x.v * 0.6);
      }
    } else if (x.k === 'fill') vString(rt, cur.gain, at, x.i, P(x.g), x.v);
    else if (x.k === 'drone') {
      const root = P(x.g) + F.drone[2];
      if (x.i === 'tanpura') vString(rt, cur.gain, at, 'tanpura', root + F.drone[1][x.s], x.v);
      else vDrone(rt, cur.gain, at, x.d, F.drone[1].map(s => root + s));
    } else if (x.k === 'bell') vBuf(rt, cur.gain, at, buf(rt.ctx, 'bell' + (F.tonic - 12), () => bellData(rt.ctx.sampleRate, F.tonic - 12)), 0.2 * x.v);
    else if (x.k === 'drum') vBuf(rt, x.L === 'war' ? cur.war : cur.gain, at, buf(rt.ctx, x.i, () => drumData(rt.ctx.sampleRate, x.i)), (x.i === 'dum' ? 0.34 : 0.16) * x.v);
  };
  // a piece starts: its own gain (so it can fade out under the next), and a war bus for the tabor
  const begin = (rt, piece, at, m) => {
    const c = rt.ctx, F = SC.family(m.cult), gain = G(c, 1), war = G(c, m.war ? 1 : 0);
    war.connect(gain); gain.connect(rt.g.tone);
    const phrases = {}; for (const x of piece.notes) if (x.k === 'lead') (phrases[x.p] = phrases[x.p] || []).push(x);
    rt.g.wet.gain.setTargetAtTime(F.wet * 1.4, c.currentTime, 1.5); rt.g.dry.gain.setTargetAtTime(1 - F.wet * 0.4, c.currentTime, 1.5);
    return { piece, F, at, idx: 0, gain, war, phrases, phrased: new Set(), warOn: !!m.war, played: [] };
  };
  // schedule what falls before `until`; a note more than 0.3 s late (a stalled tab) is dropped, never bunched
  const ahead = (rt, cur, until, m, now) => {
    const N = cur.piece.notes;
    while (cur.idx < N.length && cur.at + N[cur.idx].t < until) {
      const i = cur.idx++, x = N[i], at = cur.at + x.t;
      if (at < now - 0.3 || !SC.plays(x, m, i)) continue;
      cur.played.push(i);
      playNote(rt, cur, x, m, Math.max(at, now));
    }
  };
  const fadeOut = (rt, cur, now, secs) => {
    cur.gain.gain.cancelScheduledValues(now); cur.gain.gain.setValueAtTime(cur.gain.gain.value, now); cur.gain.gain.linearRampToValueAtTime(0, now + secs);
    cur.idx = cur.piece.notes.length;
    const g = cur.gain; setTimeout(() => { try { g.disconnect(); } catch (e) {} }, (secs + 7) * 1000);   // after the last tails
  };
  // the mix follows the mood: a fight sinks the score, night darkens it, war brings the tabor in slowly
  const ramp = (p, v, now, secs) => { p.cancelScheduledValues(now); if (!secs) { p.setValueAtTime(v, now); return; } p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(v, now + secs); };
  const shade = (rt, m, now, at) => {
    const g = rt.g, k = at ? 0 : 1;
    ramp(g.scene.gain, m.scene === 'fight' ? 0.12 : m.night ? 0.75 : 1, now, (m.scene === 'fight' ? 2 : 4) * k);
    ramp(g.tone.frequency, m.night ? 1700 : m.season === 0 ? 6000 : 9000, now, 4 * k);
    if (rt.cur && rt.cur.warOn !== !!m.war) { rt.cur.warOn = !!m.war; rt.cur.war.gain.setTargetAtTime(m.war ? 1 : 0, now, 2); }
  };
  const sameMood = (a, b) => a && b && a.scene === b.scene && a.night === b.night && a.war === b.war && a.season === b.season;
  const vol = () => Math.pow(Math.max(0, Math.min(100, +UI.set.musicVol || 0)) / 100, 2);

  // ---------------------------------------------------------------- the scheduler (a real context)
  let RT = null;
  SC.tick = function () {
    const rt = RT; if (!rt || rt.hidden) return;
    const t0 = performance.now(), c = rt.ctx, now = c.currentTime, m = SC.mood();
    if (!sameMood(rt.m, m)) shade(rt, m, now);
    rt.m = m;
    const F = SC.family(m.cult);
    const style = m.scene === 'death' ? 'lament|' + m.pid : m.scene === 'title' ? 'title' : F.style;
    if (style !== rt.style) {
      if (rt.cur) fadeOut(rt, rt.cur, now, 4);
      rt.cur = null; rt.next = now + (rt.style == null ? 0.2 : m.scene === 'death' ? 1.5 : 3); rt.style = style;
    }
    if (!rt.cur && now >= rt.next) {
      const base = m.scene === 'death' ? `${m.pid}|${m.year}` : m.scene === 'title' ? 'title' : `${m.prov}|${m.year}|${m.season}`;
      const n = rt.count[style + base] = (rt.count[style + base] || 0) + 1;
      const piece = SC.compose({ cult: m.cult, key: base + '|' + n, season: m.season, lament: m.scene === 'death' });
      rt.cur = begin(rt, piece, now + 0.1, m);
      rt.pieces = (rt.pieces || 0) + 1;
    }
    const cur = rt.cur;
    if (cur) {
      ahead(rt, cur, now + SC.LOOK, m, now);
      if (now > cur.at + cur.piece.dur) { rt.cur = null; rt.next = cur.piece.silence == null ? Infinity : now + cur.piece.silence; }
    }
    rt.ticks++; rt.ms += performance.now() - t0;
  };
  SC.start = function () {
    if (RT || !UI.set.music || typeof window === 'undefined') return false;
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return false;
    let c; try { c = new C({ latencyHint: 'playback' }); } catch (e) { return false; }
    RT = mkRT(c); RT.t0 = performance.now();
    if (c.state === 'suspended') c.resume().catch(() => {});
    RT.g.master.gain.setTargetAtTime(vol(), c.currentTime, 0.6);
    RT.timer = setInterval(SC.tick, SC.TICK);
    SC.tick();
    return true;
  };
  // off: a short fade, then every source is stopped and the context is closed (nothing is left running)
  SC.stop = function () {
    const rt = RT; if (!rt) return; RT = null; SC.last = rt;
    clearInterval(rt.timer);
    try { rt.g.master.gain.setTargetAtTime(0, rt.ctx.currentTime, 0.04); } catch (e) {}
    setTimeout(() => { for (const n of rt.live) { try { n.onended = null; n.stop(); } catch (e) {} } rt.live.clear(); try { rt.ctx.close(); } catch (e) {} }, 220);
  };
  SC.volume = function () { if (RT) RT.g.master.gain.setTargetAtTime(RT.hidden ? 0 : vol(), RT.ctx.currentTime, 0.08); };
  SC.peek = () => RT;
  SC.stats = () => { const rt = RT || SC.last; return rt ? { state: rt.ctx.state, live: rt.live.size, made: rt.made, notes: rt.notes, ticks: rt.ticks, ms: rt.ms, pieces: rt.pieces || 0, style: rt.style, gain: rt.g.master.gain.value } : null; };
  // the tab hidden: fade, suspend the context, stop the timer; shown again: carry on where it was
  SC.visibility = function (hidden) {
    const rt = RT; if (!rt) { if (!hidden) kick(); return; }
    if (hidden && !rt.hidden) {
      rt.hidden = true; clearInterval(rt.timer); rt.g.master.gain.setTargetAtTime(0, rt.ctx.currentTime, 0.03);
      setTimeout(() => { if (rt.hidden && RT === rt) rt.ctx.suspend().catch(() => {}); }, 150);
    } else if (!hidden && rt.hidden) {
      rt.hidden = false; rt.ctx.resume().catch(() => {}); SC.volume(); rt.timer = setInterval(SC.tick, SC.TICK);
    }
  };
  // a score left on from an earlier visit starts on the player's first touch (browsers start audio only on a gesture)
  const kick = () => { if (UI.set.music && !RT && !(typeof document !== 'undefined' && document.hidden)) SC.start(); };
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', kick, true);
    document.addEventListener('keydown', kick, true);
    document.addEventListener('visibilitychange', () => SC.visibility(document.visibilityState === 'hidden'));
  }

  // ---------------------------------------------------------------- an offline render (tests, and a composer's preview)
  // o: { cult, key, season, war, night, temple, scene, lament, seconds, vol (0-100), sampleRate, room (false: no reverb),
  //    solo (only these kinds: lead fill drone bell drum) }
  SC.renderOffline = async function (o) {
    const sr = o.sampleRate || 44100, secs = o.seconds || 20, C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const c = new C(2, Math.ceil(sr * secs), sr), rt = mkRT(c);
    const m = Object.assign({ scene: 'calm', season: 1, war: false, night: false, temple: false }, o);
    rt.g.master.gain.value = Math.pow((o.vol == null ? 100 : o.vol) / 100, 2);
    if (o.room === false) { rt.g.tone.disconnect(rt.g.room); rt.g.room.disconnect(); }   // to measure what the room costs
    const piece = SC.compose({ cult: o.cult, key: o.key || 'preview', season: m.season, lament: !!o.lament });
    if (o.solo) piece.notes = piece.notes.filter(x => o.solo.includes(x.k));   // hear one part alone
    rt.cur = begin(rt, piece, 0.05, m); shade(rt, m, 0, true);
    ahead(rt, rt.cur, secs, m, 0);
    const t0 = performance.now(), b = await c.startRendering();
    return { buffer: b, ms: performance.now() - t0, notes: rt.notes, nodes: rt.made, piece };
  };

  // ---------------------------------------------------------------- the settings (patch SCORE-MENU)
  SC.menu = () => `<label class="row"><input type="checkbox" data-c="setMusic" ${UI.set.music ? 'checked' : ''}> Music (a quiet score for each land)</label>` +
    `<label class="row">Music volume <input type="range" min="0" max="100" step="5" data-c="setMusicVol" aria-label="Music volume" value="${UI.esc(String(Math.round(+UI.set.musicVol || 0)))}"></label>`;
  Object.assign(UI.C, {
    setMusic(el) { UI.set.music = !!el.checked; UI.saveSettings(); if (UI.set.music) SC.start(); else SC.stop(); },
    setMusicVol(el) { UI.set.musicVol = Math.max(0, Math.min(100, Math.round(+el.value || 0))); UI.saveSettings(); SC.volume(); },
  });
})();
