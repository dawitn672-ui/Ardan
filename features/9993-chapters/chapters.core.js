// 9993-chapters: a life told in chapters (design review cycle 1, #12, after Pentiment's acts and BitLife's challenges),
// and what a house carries from life to life (#20, after CK3's dynasty legacies).
//
// Chapters. Each stage of life opens one: childhood, youth, prime (a new one every eight years of it), age, and a
// reign. The chapter card (chp_card, queued by the month hook) gives a title drawn from your life so far and three
// short aims: two set, the third your choice of two. Aims are concrete and checkable each month: "Put by 120 suns",
// "Learn your letters", "Bring Swordsmanship to 34". A met aim says so and pays a small reward; a chapter closed with
// all three met writes a deed and a little renown. The Life tab shows the chapter and its ticks; the Book lists them.
//
// The aims are a registry: CH.AIMS.push({ k, stages, fit(p) -> score (0 = not offered), label(p, b), base(p) -> b,
// done(p, b), reward }). Path (job, soldier, ruler), ambition (97's p.amb) and world (war, coast, the realm) all feed it.
//
// State: pc.chap = { n, cur: { n, st, t, y0, a0, aims: [{ k, l, b, d }], alt: { k, l, b } }, past: [{ n, st, t, y0, y1, aims: [{ l, d }], full }] }
// Legacies: S.dynasty.legacies = [{ k, y, by }] (S.dynasty is the release's; a missing field is no legacies).
(function () {
  const CH = A.CH = A.CH || {};
  const esc = s => UI.esc(String(s == null ? '' : s));
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (arr, key) => arr[hash(key) % arr.length];
  const coin = n => (A.coin ? A.coin(Math.round(n)) : Math.round(n) + ' suns');
  const sk = (p, k) => { try { return A.skill(p, k); } catch (e) { return 0; } };
  const skn = k => String((GD.SKILLS && GD.SKILLS[k]) || k).split(/[:(]/)[0].trim();
  const C = () => A.C;
  const kids = p => (p.children || []).map(A.P).filter(x => x && x.alive).length;
  const grandkids = p => (p.children || []).map(A.P).filter(Boolean).reduce((n, k) => n + (k.children || []).length, 0);
  const friends = p => Object.values(p.rel || {}).filter(r => r && ['friend', 'bestfriend'].includes(r.type)).length;
  const lit = p => !!(p.literate || (p.flags && p.flags.literate));
  const realm = p => (p.ruler ? A.realm(p.ruler) : null);
  const seen = p => (A.realmsSeen ? A.realmsSeen(p) : 0);
  const battles = p => ((p.mil && p.mil.battles) || (p.veteran && p.veteran.battles) || 0);
  const named = p => (A.ID && A.ID.named ? Object.keys(A.ID.KINDS).filter(k => A.ID.named(p, k)).length : 0);
  const ripe = p => (p.thoughts && p.thoughts.ripe ? Object.keys(p.thoughts.ripe).length : 0);
  const bestSkill = p => { let b = null, v = -1; for (const k in (GD.SKILLS || {})) { const x = sk(p, k); if (x > v) { v = x; b = k; } } return b; };
  const pathOf = p => (p.job && A.pathOfCareer ? A.pathOfCareer(p.job.c) : '');

  CH.ORD = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen'];
  CH.STAGES = { child: 'Childhood', youth: 'Youth', prime: 'The prime of life', age: 'Age', reign: 'A reign' };
  CH.PRIME_YEARS = 8;
  // the stage a life is in now; a ruler's stage is the reign
  CH.stage = function (p) {
    if (!p || !p.alive) return null;
    if (p.ruler) return 'reign';
    const s = A.stage(p);
    return s === 'infant' ? null : s === 'child' ? 'child' : s === 'teen' ? 'youth' : s === 'old' ? 'age' : 'prime';
  };

  // ---- the aims -----------------------------------------------------------------------------------------------------
  CH.AIMS = [
    { k: 'letters', st: ['child', 'youth', 'prime'], fit: p => (lit(p) ? 0 : 5), label: () => 'Learn your letters', done: p => lit(p), reward: { int: 0.5 } },
    { k: 'friend', st: ['child', 'youth', 'prime', 'age'], fit: p => (friends(p) < 2 ? 4 : 1), base: p => ({ n: friends(p) }), label: () => 'Make a true friend', done: (p, b) => friends(p) > b.n, reward: { happy: 3 } },
    { k: 'skill', st: ['child', 'youth', 'prime', 'age', 'reign'], fit: () => 3,
      base: p => { const k = (p.job && GD.CAREERS[p.job.c] && GD.CAREERS[p.job.c].skill) || bestSkill(p); return { k, t: Math.round(sk(p, k)) + (A.isAdult(p) ? 10 : 6) }; },
      label: (p, b) => `Grow skilled at ${skn(b.k).toLowerCase()}`, detail: (p, b) => `${skn(b.k)} ${b.t}`, done: (p, b) => sk(p, b.k) >= b.t, reward: { wil: 0.5 } },
    { k: 'strong', st: ['child', 'youth'], fit: () => 2, base: p => ({ s: 'sta', t: Math.round(A.stat(p, 'sta')) + 3 }),
      label: () => 'Grow hardier', detail: (p, b) => `Stamina ${b.t}`, done: (p, b) => A.stat(p, b.s) >= b.t, reward: { health: 3 } },
    // a purse aim for a purse that can still feel it: none past 20,000 suns ("Have 1,247,334 suns" was cycle 2's), and
    // the sum rounded to two figures
    { k: 'coin', st: ['youth', 'prime', 'age'], fit: p => ((p.coin || 0) > 20000 ? 0 : C().unfree(p) ? 1 : 3),
      base: p => ({ t: CH.nice((p.coin || 0) + Math.max(20, (p.coin || 0) * 0.5 + 30)) }),
      label: (p, b) => `Put by ${coin(b.t)}`, done: (p, b) => (p.coin || 0) >= b.t, reward: { happy: 2 } },
    { k: 'fame', st: ['youth', 'prime', 'age', 'reign'], fit: () => 2, base: p => ({ t: Math.round(p.fame || 0) + 10 }),
      label: () => 'Be talked of beyond your own street', detail: (p, b) => `renown ${b.t}`, done: (p, b) => (p.fame || 0) >= b.t, reward: { happy: 2 } },
    { k: 'wed', st: ['youth', 'prime'], fit: p => (A.isAdult(p) && !C().married(p) && A.age(p) < 45 ? 4 : 0), label: () => 'Marry', done: p => C().married(p), reward: { happy: 3 } },
    { k: 'kid', st: ['prime', 'reign'], fit: p => (C().married(p) && kids(p) < 3 && A.age(p) < 42 ? 4 : 0), base: p => ({ n: kids(p) }),
      label: (p, b) => (b.n ? 'Have another child' : 'Have a child'), done: (p, b) => kids(p) > b.n, reward: { happy: 3 } },
    { k: 'travel', st: ['youth', 'prime', 'age'], fit: p => (C().unfree(p) || p.prison ? 0 : 2), base: p => ({ n: seen(p) }),
      label: () => 'See a realm you have never seen', done: (p, b) => seen(p) > b.n, reward: { ins: 0.5 } },
    { k: 'rank', st: ['youth', 'prime'], fit: p => (p.job && GD.CAREERS[p.job.c] && p.job.r < GD.CAREERS[p.job.c].ranks.length - 1 ? 4 : 0),
      base: p => ({ r: p.job ? p.job.r : 0 }), label: p => `Rise a rank in ${String((GD.CAREERS[p.job.c] || {}).name || 'your work').toLowerCase()}`,
      done: (p, b) => !!(p.job && p.job.r > b.r), reward: { fame: 1 } },
    { k: 'work', st: ['youth', 'prime'], fit: p => (!p.job && !p.mil && A.isAdult(p) && !C().noble(p) ? 4 : 0), label: () => 'Find steady work', done: p => !!(p.job || p.mil), reward: { happy: 2 } },
    { k: 'roof', st: ['prime', 'age'], fit: p => (C().unfree(p) ? 0 : (p.assets || []).length ? 1 : 3), base: p => ({ n: (p.assets || []).length }),
      label: p => ((p.assets || []).length ? 'Buy another property' : 'Own a roof of your own'), done: (p, b) => (p.assets || []).length > b.n, reward: { happy: 2 } },
    { k: 'free', st: ['youth', 'prime', 'age'], fit: p => (C().unfree(p) ? 8 : 0), label: () => 'Win your freedom', done: p => !C().unfree(p), reward: { happy: 6 } },
    { k: 'battle', st: ['youth', 'prime'], fit: p => (C().soldier(p) ? 4 : 0), base: p => ({ n: battles(p) }), label: () => 'Stand in a battle line and live', done: (p, b) => battles(p) > b.n, reward: { fame: 2 } },
    { k: 'warend', st: ['youth', 'prime', 'age', 'reign'], fit: p => (C().atWar(p) && (C().soldier(p) || p.ruler || C().noble(p)) ? 4 : 0), label: () => 'See the war through',
      done: p => !C().atWar(p), reward: { happy: 3 } },
    { k: 'sea', st: ['youth', 'prime'], fit: p => (C().coast(p) && !C().unfree(p) ? 2 : 0), base: p => ({ t: Math.round(sk(p, 'sea')) + 8 }),
      label: () => 'Learn the sea', detail: (p, b) => `Seamanship ${b.t}`, done: (p, b) => sk(p, 'sea') >= b.t, reward: { ins: 0.5 } },
    { k: 'pious', st: ['child', 'youth', 'prime', 'age'], fit: p => ((p.piety || 0) >= 30 || (p.job && p.job.c === 'clergy') ? 3 : 1), base: p => ({ t: Math.min(100, Math.round(p.piety || 0) + 12) }),
      label: () => 'Be known at the shrine', detail: (p, b) => `piety ${b.t}`, done: (p, b) => (p.piety || 0) >= b.t, reward: { happy: 2 } },
    { k: 'amb', st: ['youth', 'prime', 'age', 'reign'], fit: p => (A.LF && A.LF.ambOf && A.LF.ambOf(p) && !p.amb.done ? 6 : 0),
      base: p => { let pr = 0; try { pr = A.LF.AMB[p.amb.k].prog(p) || 0; } catch (e) {} return { k: p.amb.k, t: Math.min(1, Math.round((pr + 0.25) * 100) / 100) }; },
      label: (p, b) => `A long step toward your ambition: ${(A.LF && A.LF.AMB[b.k] ? A.LF.AMB[b.k].name : 'your ambition').toLowerCase()}`,
      done: (p, b) => { try { return !!(p.amb && p.amb.k === b.k && (p.amb.done || A.LF.AMB[b.k].prog(p) >= b.t)); } catch (e) { return false; } }, reward: { wil: 1 } },
    { k: 'mark', st: ['youth', 'prime'], fit: p => (A.ID && !p.mark && !(A.ID.ownHouse && A.ID.ownHouse(p)) ? 2 : 0), label: () => 'Design your arms (Your mark)', done: p => !!p.mark, reward: { happy: 1 } },
    { k: 'name', st: ['child', 'youth', 'prime'], fit: p => (A.ID && !named(p) ? 2 : 0), label: () => 'Give a name to something you love', done: p => named(p) > 0, reward: { happy: 2 } },
    { k: 'thought', st: ['youth', 'prime', 'age'], fit: p => (A.ID && p.thoughts && Object.keys(p.thoughts.held || {}).length ? 4 : 0), base: p => ({ n: ripe(p) }),
      label: () => 'Let a thought you hold ripen', done: (p, b) => ripe(p) > b.n, reward: { wil: 0.5 } },
    { k: 'grand', st: ['age'], fit: p => (kids(p) ? 3 : 0), base: p => ({ n: grandkids(p) }), label: () => 'Hold a grandchild', done: (p, b) => grandkids(p) > b.n, reward: { happy: 4 } },
    { k: 'live', st: ['age'], fit: () => 3, base: p => ({ t: A.age(p) + 5 }), label: (p, b) => `Live to see ${b.t}`, done: (p, b) => A.age(p) >= b.t, reward: { happy: 2 } },
    { k: 'kinwed', st: ['age'], fit: p => ((p.children || []).map(A.P).some(k => k && k.alive && A.isAdult(k) && !k.spouse) ? 3 : 0),
      base: p => ({ n: (p.children || []).map(A.P).filter(k => k && k.spouse).length }), label: () => 'See a child of yours married',
      done: (p, b) => (p.children || []).map(A.P).filter(k => k && k.spouse).length > b.n, reward: { happy: 3 } },
    { k: 'stab', st: ['reign'], fit: () => 4, base: p => { const r = realm(p); return { t: Math.min(95, Math.round(r ? r.stability : 50) + 10) }; },
      label: () => 'Steady the realm', detail: (p, b) => `stability ${b.t}`, done: (p, b) => { const r = realm(p); return !!(r && r.stability >= b.t); }, reward: { fame: 2 } },
    { k: 'gold', st: ['reign'], fit: p => { const r = realm(p); return r && r.treasury > 500000 ? 0 : 3; }, base: p => { const r = realm(p), t = r ? r.treasury : 0; return { t: CH.nice(t + Math.max(2000, t * 0.5)) }; },
      label: () => 'Fill the treasury', detail: (p, b) => coin(b.t), done: (p, b) => { const r = realm(p); return !!(r && r.treasury >= b.t); }, reward: { fame: 2 } },
    { k: 'heir', st: ['reign'], fit: p => (kids(p) ? 0 : 6), label: () => 'Get an heir', done: p => kids(p) > 0, reward: { happy: 3 } },
    { k: 'ally', st: ['reign'], fit: p => { const r = realm(p); return r && (r.allies || []).length < 3 ? 3 : 0; }, base: p => { const r = realm(p); return { n: r ? (r.allies || []).length : 0 }; },
      label: () => 'Bind a neighbour with an alliance', done: (p, b) => { const r = realm(p); return !!(r && (r.allies || []).length > b.n); }, reward: { fame: 2 } },
  ];
  CH.aim = k => CH.AIMS.find(a => a.k === k);
  CH.mk = function (p, A1) {
    const b = A1.base ? A1.base(p) : {};
    let l = '';
    try { l = A1.label(p, b); } catch (e) { l = A1.k; }
    const o = { k: A1.k, l: String(l).slice(0, 80), b, d: null };
    try { if (A1.detail) o.x = String(A1.detail(p, b)).slice(0, 40); } catch (e) {}
    return o;
  };
  // a round target: two significant figures, rounded up (1,247,334 -> 1,300,000; 137 -> 140)
  CH.nice = function (n) {
    n = Math.max(1, Math.round(+n || 0));
    if (n < 100) return Math.ceil(n / 5) * 5;
    const m = Math.pow(10, Math.floor(Math.log10(n)) - 1);
    return Math.ceil(n / m) * m;
  };
  // the aims for a chapter: the four best fits for the stage (ties broken by hash of the life and the chapter)
  CH.choose = function (p, st, n) {
    const out = [];
    // an aim the last chapter left unmet is not set again (cycle 2: "Learn your letters" in five chapters running)
    const L = p.chap && Array.isArray(p.chap.past) ? p.chap.past[p.chap.past.length - 1] : null;
    const failed = new Set(L && L.aims ? L.aims.filter(a => a.d == null && a.k).map(a => a.k) : []);
    for (const a of CH.AIMS) {
      if (!a.st.includes(st) || failed.has(a.k)) continue;
      let f = 0;
      try { f = a.fit(p) || 0; } catch (e) { f = 0; }
      if (f <= 0) continue;
      try { if (a.done(p, a.base ? a.base(p) : {})) continue; } catch (e) { continue; }
      out.push({ a, s: f + (hash(`${p.id}|${n}|${a.k}`) % 100) / 60 });
    }
    return out.sort((x, y) => y.s - x.s).slice(0, 4).map(x => x.a);
  };

  // ---- the title ----------------------------------------------------------------------------------------------------
  // a name from the life so far: what fits (war, hunger, a wedding, a crown, the sea), then by hash
  CH.TITLES = [
    [p => C().atWar(p), ['The Years of Smoke', 'Drums in the Valley', 'The Long Muster', 'Ash on the Wind']],
    [p => C().unfree(p), ['The Yoke', 'Other Men\'s Fields', 'The Price of a Name']],
    [p => p.prison, ['Stone and Straw', 'The Narrow Window']],
    [p => CH.stage(p) === 'reign', ['The Weight of the Crown', 'The High Seat', 'A Crown in Winter', 'The Throne and the Table']],
    [p => CH.stage(p) === 'child' && C().poor(p), ['The Hungry Years', 'Bread and Thin Soup', 'The Cold Hearth']],
    [p => CH.stage(p) === 'child' && C().noble(p), ['The Gilded Nursery', 'Banners Over the Cradle', 'The Long Gallery']],
    [p => CH.stage(p) === 'child', ['Mud and Apples', 'The Small Kingdom', 'Under the Table', 'The Lane and the Well']],
    [p => CH.stage(p) === 'youth' && C().noble(p), ['The Gilded Cage', 'Swords and Dancing Masters', 'The Season of Suitors']],
    [p => CH.stage(p) === 'youth', ['The Green Years', 'The First Road', 'Calluses', 'Wild Oats']],
    [p => CH.stage(p) === 'age', ['The Long Evening', 'Grey at the Temples', 'What Remains', 'The Last Harvest']],
    [p => C().soldier(p), ['The Muster Roll', 'Iron and Rain', 'Spear and Bread']],
    [p => C().coast(p) && sk(p, 'sea') >= 20, ['Salt', 'The Tide Table', 'Grey Water']],
    [p => lit(p) && sk(p, 'learning') >= 30, ['Ink and Candle', 'The Margins']],
    [p => C().married(p) && kids(p), ['The Full Table', 'A House of Small Voices', 'The Bright Kitchen']],
    [p => C().married(p), ['Two at the Hearth', 'The Shared Blanket']],
    [p => C().rich(p), ['Silver and Silk', 'The Counting House', 'Fat Years']],
    [p => C().poor(p), ['Lean Years', 'Mending and Making Do', 'The Hard Winter']],
    [() => true, ['The Middle of the Road', 'Steady Work', 'A Life of One\'s Own', 'The Turning Year']],
  ];
  CH.titleFor = function (p, n) {
    for (const [ok, names] of CH.TITLES) { let y = false; try { y = !!ok(p); } catch (e) {} if (y) return pick(names, `${p.id}|t|${n}`); }
    return 'A Chapter';
  };
  CH.heading = c => `Chapter ${CH.ORD[c.n - 1] || c.n}: ${c.t}`;

  // ---- opening and closing --------------------------------------------------------------------------------------------
  CH.open = function (p, st) {
    p.chap = p.chap && typeof p.chap === 'object' ? p.chap : { n: 0, past: [] };
    p.chap.past = Array.isArray(p.chap.past) ? p.chap.past : [];
    const n = (p.chap.n || 0) + 1, list = CH.choose(p, st, n);
    const aims = list.slice(0, 3).map(a => CH.mk(p, a)), alt = list[3] ? CH.mk(p, list[3]) : null;
    p.chap.n = n;
    p.chap.cur = { n, st, t: CH.titleFor(p, n), y0: A.S.year, a0: A.age(p), aims, alt };
    return p.chap.cur;
  };
  CH.close = function (p) {
    const c = p.chap && p.chap.cur;
    if (!c) return null;
    const met = c.aims.filter(a => a.d != null).length, full = c.aims.length >= 3 && met === c.aims.length;
    const rec = { n: c.n, st: c.st, t: c.t, y0: c.y0, y1: A.S.year, aims: c.aims.map(a => ({ k: a.k, l: a.l, d: a.d })), full };
    p.chap.past.push(rec);
    if (p.chap.past.length > 16) p.chap.past.shift();
    p.chap.cur = null;
    if (full) {
      if (p.deeds) p.deeds.push({ y: A.S.year, t: `Closed ${CH.heading(c)} with every aim met` });
      if (A.fame) A.fame(p, 2);
    }
    return rec;
  };
  CH.month = function (p) {
    if (CH.OFF || !p || !p.alive) return;
    const st = CH.stage(p);
    if (!st) return;
    const c = p.chap && p.chap.cur;
    // the aims, checked
    if (c) for (const a of c.aims) {
      if (a.d != null) continue;
      const D = CH.aim(a.k);
      let ok = false;
      try { ok = !!(D && D.done(p, a.b || {})); } catch (e) { ok = false; }
      if (ok) {
        a.d = A.S.year;
        if (D.reward) A.applyFx(p, D.reward, {});
        A.log(`Aim met: ${a.l}.`, 'good');
      }
    }
    // a chapter turns with the stage, after eight years of one stage (ten of a reign: an elf's youth is long), or
    // a year after its last aim is met
    const allMet = c && c.aims.length && c.aims.every(a => a.d != null) && A.S.year - Math.max(...c.aims.map(a => a.d)) >= 1;
    const turn = !c || c.st !== st || A.S.year - c.y0 >= (st === 'reign' ? 10 : CH.PRIME_YEARS) || allMet;
    if (!turn) return;
    // the card comes in a quiet month: never stacked behind another scene (cycle 2, design B3: on day one the
    // ambition's question, then the chapter's aims, back to back), and one at a time
    if (A.S.queue.some(q => q && q.type === 'event')) return;
    const last = c ? CH.close(p) : null;
    CH.open(p, st);
    if (A.EV.chp_card) A.queue({ type: 'event', ev: 'chp_card', ctx: { chN: p.chap.n, chLast: last ? last.n : 0 } });
  };
  A.onMonth.push(p => { try { CH.month(p); } catch (e) { console.error('chapters', e); } });

  // fx: chapter: 'alt' swaps the third aim for the other one offered
  (A.FX_EXTRA = A.FX_EXTRA || []).push('chapter');
  const ap = A.applyFx;
  A.applyFx = function (p, fx) {
    const r = ap.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.chapter === 'alt' && p && p.chap && p.chap.cur && p.chap.cur.alt) {
        const c = p.chap.cur, i = Math.min(2, c.aims.length - 1);
        const was = c.aims[i]; c.aims[i] = c.alt; c.alt = was;
      }
    } catch (e) { console.error('chapter fx', e); }
    return r;
  };

  // the card's words (chp_card reads these): what the last chapter came to, then the new one's aims
  CH.recap = function (p) {
    const L = p.chap && p.chap.past && p.chap.past[p.chap.past.length - 1];
    if (!L || L.n !== (p.chap.cur ? p.chap.cur.n - 1 : -1)) return '';
    const met = L.aims.filter(a => a.d != null);
    const k = met.length;
    return `${L.t} is closed: ${k === 0 ? 'none of its aims met' : k === L.aims.length ? 'every aim met' : `${k} of ${L.aims.length} aims met`}${L.full ? ', and set down among your deeds' : ''}.`;
  };
  CH.aimsText = c => c.aims.slice(0, 2).map((a, i) => (i ? a.l[0].toLowerCase() + a.l.slice(1) : a.l)).join('; ') + (c.aims[2] ? '; and either ' + c.aims[2].l.toLowerCase() + (c.alt ? ' or ' + c.alt.l.toLowerCase() : '') : '') + '.';

  // ---- the chapter card as a title card (cycle 2, design B6 and visual B12) ------------------------------------------
  // Not one more scene card: a chapter break. The stage's own print across the top (a toy and a hearth for childhood,
  // the road for youth, the work for the prime, the window for age, the court for a reign), "Chapter Two" small and the
  // title large and centred, the years, what the last chapter came to, the two set aims ticked off as a list, and the
  // third chosen from two. After the choice: the three aims and "Begin the chapter". Drawn from chp_card's view and
  // the person; pure, as 92's card is. The buttons keep the release's data-a (evChoose, evClose), so keys 1 and 2,
  // Enter and the focus rules still hold.
  CH.SHAPE = { child: 'play', youth: 'travel', prime: 'work', age: 'letter', reign: 'court' };
  CH.titleCard = function (q) {
    const p = A.pc(), c = p && p.chap && p.chap.cur, v = q.view || A.eventView(q) || {};
    if (!c || !v || v.skip) return null;
    let sky = '';
    try {
      const SK = UI.SKIES;
      if (SK && SK.svg && UI.set.skies !== false) { const o = SK.optsFor(q, v); sky = SK.svg(CH.SHAPE[c.st] || 'none', `chp|${p.id}|${c.n}`, o.month, Object.assign({}, o, { place: '' })); }
    } catch (e) { sky = ''; }
    const recap = CH.recap(p), done = !!q.result;
    const aim = (a, i) => `<li><span class="chp-tick" aria-hidden="true">${i + 1}</span><span>${esc(a.l)}${a.x ? ` <span class="chp-x">${esc(a.x)}</span>` : ''}</span></li>`;
    const set = c.aims.slice(0, done ? 3 : 2);
    let h = `<div class="panel mbox chp-title${done ? ' chp-done-card' : ''}" data-chp="${esc(c.st)}">` +
      (sky ? `<div class="chp-sky" aria-hidden="true">${sky}</div>` : '') +
      `<div class="chp-tc"><div class="chp-k">Chapter ${esc(CH.ORD[c.n - 1] || c.n)}</div><h2 class="chp-h">${esc(c.t)}</h2>` +
      `<div class="chp-yrs">${esc(CH.STAGES[c.st] || '')} · from ${esc(c.y0)}, aged ${esc(c.a0)}</div>` +
      (recap ? `<p class="chp-recap">${esc(recap)}</p>` : '') +
      `<div class="chp-aims-h">${done ? 'The aims of this chapter' : 'This chapter you mean to'}</div><ol class="chp-aimlist">${set.map(aim).join('')}</ol>`;
    if (!done) {
      h += `<div class="chp-aims-h">And one more, of your choosing</div><div class="choices chp-choices">` +
        (v.choices || []).map((ch, vi) => { const a = ch.i === 1 ? c.alt : c.aims[2]; return `<button data-a="evChoose" data-v="${vi}">${esc(a ? a.l : ch.t)}${a && a.x ? ` <span class="chp-x">${esc(a.x)}</span>` : ''}</button>`; }).join('') + '</div>';
    } else {
      h += `<div class="chp-foot"><button class="primary sc-cont" data-a="evClose">Begin the chapter</button></div>`;
    }
    return h + '</div></div>';
  };
  const qmc = UI.queueModal;
  if (typeof qmc === 'function') UI.queueModal = function (q) {
    if (q && q.type === 'event' && q.ev === 'chp_card' && !CH.CARD_OFF) {
      try { const h = CH.titleCard(q); if (h) return h; } catch (e) { console.error('chapter title card', e); }
    }
    return qmc.apply(this, arguments);
  };

  // ---- on screen (pure: reads the person, draws nothing) --------------------------------------------------------------
  CH.card = function (p) {
    const c = p && p.chap && p.chap.cur;
    if (CH.OFF || !c || !p.alive) return '';
    const done = c.aims.filter(a => a.d != null).length;
    return `<section class="card chp-card" aria-labelledby="chp-h" data-tt="${esc('Aims: ' + c.aims.map(a => (a.d != null ? '✓ ' : '') + a.l).join('; ') + '.')}"><div class="row"><span class="tag">Chapter ${esc(CH.ORD[c.n - 1] || c.n)}</span><b id="chp-h" class="grow chp-t">${esc(c.t)}</b><span class="tiny muted">since ${esc(c.y0)} · ${done} of ${c.aims.length}</span></div>` +
      (() => { const nx = c.aims.find(a => a.d == null); return nx ? `<div class="chp-next tiny">Next: ${esc(nx.l)}</div>` : ''; })() +
      `<ul class="chp-aims">${c.aims.map(a => `<li class="${a.d != null ? 'chp-done' : ''}"><span class="chp-tick" aria-hidden="true">${a.d != null ? '✓' : '○'}</span><span class="${a.d != null ? 'chp-met' : ''}">${esc(a.l)}</span>${a.x ? ` <span class="tiny muted chp-x">${esc(a.x)}</span>` : ''}${a.d != null ? `<span class="sc-vh"> (met in ${esc(a.d)})</span>` : ''}</li>`).join('')}</ul></section>`;
  };
  const life = UI.TAB && UI.TAB.life;
  if (typeof life === 'function') UI.TAB.life = function (pc) {
    const h = life.apply(this, arguments);
    try {
      if (typeof h !== 'string' || h.indexOf('chp-card') >= 0) return h;
      const s = CH.card(pc || A.pc());
      if (!s) return h;
      const at = h.indexOf('<section class="card lf-amb');
      // on a phone the Life page is one column under the thumb: the chapter rides inside the ambition card, which
      // 90-fold keeps folded to its title line there, so the page is no longer for it
      if (at >= 0 && UI.isPhone && UI.isPhone()) {
        const end = h.indexOf('</section>', at);
        if (end > at) return h.slice(0, end) + s.replace('<section class="card chp-card"', '<section class="chp-card chp-in-amb"') + h.slice(end);
      }
      if (at >= 0) return h.slice(0, at) + s + h.slice(at);
      const w = h.indexOf('<section class="card whatnow"');
      return w >= 0 ? h.slice(0, w) + s + h.slice(w) : s + h;
    } catch (e) { console.error('chapter card', e); return h; }
  };
  // the Book: the chapters of each life, by name, before the chronicler's pages
  CH.bookHtml = function () {
    const S = A.S, lives = [];
    const pids = [...new Set((S.log || []).map(e => e.pc))];
    for (const id of pids) { const p = A.P(id); if (p && p.chap && (p.chap.past.length || p.chap.cur)) lives.push(p); }
    if (!lives.length) return '';
    let h = '<section class="chp-book"><h4>The chapters</h4>';
    for (const p of lives) {
      const all = p.chap.past.concat(p.chap.cur ? [Object.assign({ open: true, y1: null }, p.chap.cur)] : []);
      h += `<div class="small"><b>${esc(A.fullName ? A.fullName(p, false) : p.given)}</b></div><ol class="chp-list">` + all.map(c => {
        const met = (c.aims || []).filter(a => a.d != null).length;
        return `<li><span class="chp-bt">${esc(CH.heading(c))}</span> <span class="tiny muted">${esc(c.y0)}${c.y1 ? '–' + esc(c.y1) : ', still being written'} · ${met} of ${(c.aims || []).length} aims${c.full ? ' · all met' : ''}</span></li>`;
      }).join('') + '</ol>';
    }
    return h + '</section>';
  };
  const book = UI.TAB && UI.TAB.book;
  if (typeof book === 'function') UI.TAB.book = function () {
    const h = book.apply(this, arguments);
    try {
      const s = CH.bookHtml();
      if (!s || typeof h !== 'string') return h;
      const at = h.indexOf('<section class="chron-life"');
      return at >= 0 ? h.slice(0, at) + s + h.slice(at) : h + s;
    } catch (e) { console.error('chapters book', e); return h; }
  };

  // ---- dynasty legacies (design #20) ----------------------------------------------------------------------------------
  // What a house earns, its heirs spend: when you go on as your heir, a scene (chp_legacy) lets the new head choose one
  // perk of the house from three of five tracks. Every perk chosen so far is given to each heir in turn.
  CH.LEGACY = {
    blood: { name: 'Strong blood', t: 'Strong blood: the house\'s children are hardy', give: p => { A.applyFx(p, { health: 5 }, {}); if (p.st) p.st.sta = (p.st.sta || 0) + 2; } },
    blade: { name: 'The house blade', t: 'The house blade: every heir is taught the sword', give: p => A.applyFx(p, { skill: { melee: 3, sword: 2 } }, {}) },
    coin: { name: 'The house purse', t: 'The house purse: a nest egg for every heir', give: p => A.applyFx(p, { coin: 60 }, {}) },
    word: { name: 'The house tutor', t: 'The house tutor: every heir learns letters and manners', give: p => { p.literate = true; A.applyFx(p, { skill: { learning: 3, etiquette: 2 } }, {}); } },
    faith: { name: 'The house chapel', t: 'The house chapel: the priests know the name', give: p => A.applyFx(p, { piety: 8, skill: { faith: 2 } }, {}) },
  };
  CH.legacies = () => (A.S.dynasty && Array.isArray(A.S.dynasty.legacies) ? A.S.dynasty.legacies : []);
  // renown of the house: the life scores (73) of its members, in thousands, and the deeds of the dead
  CH.renown = function () {
    const D = A.S.dynasty;
    if (!D || !Array.isArray(D.members)) return 0;
    let r = 0;
    for (const id of D.members) { const p = A.P(id); if (!p || p.alive) continue; try { r += Math.round((A.score ? A.score(p) : 0) / 1000); } catch (e) {} r += (p.deeds || []).length; }
    return r;
  };
  CH.legacyOffer = function (p) {
    const have = new Set(CH.legacies().map(x => x.k)), ks = Object.keys(CH.LEGACY).filter(k => !have.has(k));
    const h = hash(`${p.id}|legacy|${(A.S.dynasty && A.S.dynasty.gens) || 0}`);
    return ks.map((k, i) => ({ k, s: (h >> (i * 3)) & 7 })).sort((a, b) => a.s - b.s).slice(0, 3).map(x => x.k);
  };
  (A.FX_EXTRA = A.FX_EXTRA || []).push('legacy');
  const ap2 = A.applyFx;
  A.applyFx = function (p, fx, ctx) {
    const r = ap2.apply(this, arguments);
    try {
      if (fx && typeof fx === 'object' && fx.legacy != null && A.S.dynasty) {
        const k = typeof fx.legacy === 'number' ? ctx && ctx['lg' + fx.legacy] : fx.legacy;
        if (CH.LEGACY[k] && !CH.legacies().some(x => x.k === k)) {
          A.S.dynasty.legacies = CH.legacies().concat([{ k, y: A.S.year, by: p.id }]);
          CH.LEGACY[k].give(p);
          A.log(`The house will carry it: ${CH.LEGACY[k].name.toLowerCase()}.`, 'good');
        }
      }
    } catch (e) { console.error('legacy fx', e); }
    return r;
  };
  const cont = A.continueAs;
  if (typeof cont === 'function') A.continueAs = function (pid) {
    const r = cont.apply(this, arguments);
    try {
      const p = A.pc();
      if (r !== false && p && p.id === pid && A.S.dynasty) {
        for (const L of CH.legacies()) if (CH.LEGACY[L.k]) CH.LEGACY[L.k].give(p);
        if (CH.legacyOffer(p).length && CH.renown() >= 3 && A.EV.chp_legacy) A.queue({ type: 'event', ev: 'chp_legacy', ctx: {} });
      }
    } catch (e) { console.error('legacy', e); }
    return r;
  };

  const CSS = `.chp-card{padding:8px 12px;margin-bottom:8px;border-left:3px solid var(--accent)}
.chp-t{font-family:var(--f-display,inherit);letter-spacing:.02em}
.chp-aims{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:3px;font-size:var(--t-small,13px)}
.chp-aims li{display:flex;gap:8px;align-items:baseline}
.chp-tick{width:14px;color:var(--ink-3);text-align:center}
.chp-done .chp-tick{color:var(--ok)}
.chp-met{color:var(--ink-2);text-decoration:line-through;text-decoration-color:var(--ok)}
.chp-book{margin:8px 0 14px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.chp-book h4{margin:0 0 6px}
.chp-list{margin:2px 0 8px 18px;padding:0;font-size:var(--t-small,13px)}
.chp-bt{font-family:var(--f-display,inherit)}
.chp-next{display:none}
.chp-x{font-size:11px;color:var(--ink-3);font-variant-numeric:tabular-nums}
.chp-title{max-width:620px;padding:0;overflow:hidden;text-align:center}
.chp-sky svg{display:block;width:100%;height:auto;max-height:190px;object-fit:cover}
.chp-tc{padding:14px 24px 20px}
.chp-k{font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent)}
.chp-h{margin:4px 0 2px;font-family:var(--f-name,inherit);font-size:34px;line-height:1.15;letter-spacing:.02em}
.chp-yrs{font-size:13px;color:var(--ink-2)}
.chp-recap{margin:12px auto 0;max-width:46ch;font-family:var(--f-prose,inherit);font-style:italic;color:var(--ink-2)}
.chp-aims-h{margin:16px 0 6px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-3)}
.chp-aimlist{list-style:none;margin:0 auto;padding:0;max-width:420px;text-align:left;display:flex;flex-direction:column;gap:6px}
.chp-aimlist li{display:flex;gap:10px;align-items:baseline}
.chp-aimlist .chp-tick{flex:none;width:20px;height:20px;border-radius:50%;border:1px solid var(--accent-rule,var(--accent));font-size:11px;line-height:18px;text-align:center;color:var(--accent)}
.chp-choices{display:flex;flex-direction:column;gap:6px;max-width:420px;margin:0 auto}
.chp-choices button{display:flex;gap:10px;align-items:center;justify-content:flex-start;min-height:44px;text-align:left}
.chp-key{flex:none;width:20px;height:20px;border-radius:4px;background:var(--raised-hover,var(--raised));font-size:11px;line-height:20px;text-align:center}
.chp-foot{margin-top:16px}
@media (max-width:760px){.chp-title{max-width:none}.chp-h{font-size:28px}.chp-tc{padding:12px 16px 16px}.chp-choices button{min-height:52px}}
.chp-in-amb{margin:6px 0 0;padding:6px 0 0;border-left:0;border-top:1px solid var(--line)}
@media (max-width:760px),(max-height:860px){.chp-card{padding:4px 8px;margin-bottom:4px}.chp-aims{display:none}.chp-next{display:block;color:var(--ink-2);margin-top:2px}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('chp-style')) return; const s = document.createElement('style'); s.id = 'chp-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
