// 995-hall-of-lives: every life you finish, kept in this browser (design review cycle 1, #1).
//
// The store is a browser record next to the settings (UI.store, the way 97-life-fixes keeps UI.set.lfLives). It never
// goes into A.S, a save or the journal, and the engine never reads it. It holds:
//   lives     the last HALL.KEEP lives: name, people, realm, years, ending and manner, epitaph, score, the
//             achievements that life earned, the world seed, the start story and the lands
//   endings, manners, ach   how many lives found each, for ever (so a collection survives the list being trimmed)
//   n         every life ever finished here
// Where it shows: a "Your lives" shelf on the title screen (UI.hallShelf, placed by a wrap of UI.renderTitle or by
// whoever owns the title, see README), a "New for the Hall" line on the death screen, and the Hall's counts on the
// Dynasty tab next to 28-endings' collection.
// Unlocks: three new start stories (hall.events.js) open on the creation screen when the whole Hall has enough
// lives, endings or achievements. The choice travels in the newGame options as any 29-starts story does (o.story), so a
// journal replays it without reading the Hall.
// Writing: once, when a life ends (a wrap of A.pcDeath, outside A.replay, keyed so a life is never counted twice).
// Rendering only reads the store. Every string drawn from it is escaped.
(function () {
  const HALL = UI.HALL = UI.HALL || {};
  HALL.KEY = 'ardan.hall.v1';
  HALL.KEEP = 60;
  HALL.SHELF = 12;
  const esc = s => UI.esc(String(s == null ? '' : s));
  const str = (s, n) => String(s == null ? '' : s).replace(/[<>"{}]/g, '').slice(0, n || 120);
  const num = x => (Number.isFinite(+x) ? +x : 0);
  const empty = () => ({ v: 1, n: 0, lives: [], endings: {}, manners: {}, ach: {} });

  // ---- the store --------------------------------------------------------------------------------------------------
  // read: always a well-formed hall, whatever the browser holds (nothing, junk, an old shape, a hand-edited one)
  HALL.read = function () {
    let raw = null;
    try { raw = UI.store && UI.store.get(HALL.KEY); } catch (e) { raw = null; }
    if (!raw) return empty();
    let o;
    try { o = JSON.parse(raw); } catch (e) { return empty(); }
    if (!o || typeof o !== 'object') return empty();
    const h = empty();
    h.n = Math.max(0, Math.floor(num(o.n)));
    const counts = src => { const out = {}; if (src && typeof src === 'object') for (const k in src) if (/^[a-z0-9_]{1,40}$/i.test(k)) out[k] = Math.max(0, Math.floor(num(src[k]))); return out; };
    h.endings = counts(o.endings); h.manners = counts(o.manners); h.ach = counts(o.ach);
    if (Array.isArray(o.lives)) for (const L of o.lives.slice(-HALL.KEEP)) {
      if (!L || typeof L !== 'object') continue;
      h.lives.push({
        k: str(L.k, 80), name: str(L.name, 80), race: str(L.race, 20), realm: str(L.realm, 20), realmName: str(L.realmName, 80),
        color: /^#[0-9a-f]{6}$/i.test(L.color || '') ? L.color : '', born: Math.floor(num(L.born)), died: Math.floor(num(L.died)), age: Math.floor(num(L.age)),
        ending: str(L.ending, 40), manner: str(L.manner, 40), cause: str(L.cause, 120), score: Math.floor(num(L.score)),
        ach: Array.isArray(L.ach) ? L.ach.map(x => str(x, 40)).filter(x => /^[a-z0-9_]+$/i.test(x)).slice(0, 80) : [],
        seed: Math.floor(num(L.seed)), story: str(L.story, 40), lands: str(L.lands, 12), newE: !!L.newE, newM: !!L.newM, newA: Array.isArray(L.newA) ? L.newA.map(x => str(x, 40)).slice(0, 40) : [],
      });
    }
    h.n = Math.max(h.n, h.lives.length);
    return h;
  };
  HALL.write = function (h) {
    try { return !!(UI.store && UI.store.set(HALL.KEY, JSON.stringify(h))); } catch (e) { return false; }
  };
  // a key for one life: the same world, the same person, the same year of death
  HALL.keyOf = (S, pc) => `${S.seed}:${pc.id}:${pc.died || S.year}:${pc.born}`;

  const E = id => (A.ENDINGS || []).find(x => x.id === id);
  const M = id => (A.MANNERS || []).find(x => x.id === id);
  HALL.endingName = id => { const e = E(id); return e ? e.name : ''; };
  HALL.mannerName = id => { const m = M(id); return m ? m.name : ''; };
  HALL.epitaph = id => { const e = E(id); return e ? e.t : ''; };

  // the entry for a life that has just ended (reads the state, writes nothing)
  HALL.entryOf = function (pc) {
    const S = A.S, R = A.realm ? A.realm(pc.realm) : null, end = pc.ending || (A.endingOf ? A.endingOf(pc) : {});
    // the achievements of this life: the save's achievements since the life before it ended (an heir's game carries its
    // parents' achievements too)
    const dl = S.deadList || [], prev = dl.length >= 2 ? dl[dl.length - 2] : null;
    const since = prev ? num(prev.died) : -1e9;
    const ach = Object.keys(S.ach || {}).filter(k => S.ach[k] != null && S.ach[k] >= since);
    let color = '';
    try { color = R && /^#[0-9a-f]{6}$/i.test(R.color || '') ? R.color : (LORE.realms[pc.realm] && /^#[0-9a-f]{6}$/i.test(LORE.realms[pc.realm].color || '') ? LORE.realms[pc.realm].color : ''); } catch (e) {}
    return {
      k: HALL.keyOf(S, pc), name: str(A.fullName ? A.fullName(pc, false) : pc.given, 80), race: str(pc.race, 20), realm: str(pc.realm, 20),
      realmName: str(R ? R.name : '', 80), color, born: pc.born, died: pc.died || S.year, age: A.age(pc), ending: str(end.id, 40), manner: str(end.manner, 40),
      cause: str(pc.cause, 120), score: Math.round(num(A.score ? A.score(pc) : 0)), ach, seed: num(S.seed), story: str(S.story && S.story.id, 40),
      lands: A.FAR && A.FAR.active ? 'great' : 'known',
    };
  };
  // engine side, once per life: add it to the Hall. Never during A.replay (a problem report or a test replaying a
  // journal); a key already in the Hall is not counted again.
  HALL.record = function (pc) {
    if (!pc || pc.alive || A.jPaused || HALL.OFF) return null;
    const h = HALL.read(), L = HALL.entryOf(pc);
    if (h.lives.some(x => x.k === L.k)) return null;
    L.newE = !!L.ending && !h.endings[L.ending];
    L.newM = !!L.manner && !h.manners[L.manner];
    L.newA = L.ach.filter(k => !h.ach[k]);
    if (L.ending) h.endings[L.ending] = (h.endings[L.ending] || 0) + 1;
    if (L.manner) h.manners[L.manner] = (h.manners[L.manner] || 0) + 1;
    for (const k of L.ach) h.ach[k] = (h.ach[k] || 0) + 1;
    h.n += 1;
    h.lives.push(L);
    if (h.lives.length > HALL.KEEP) h.lives.splice(0, h.lives.length - HALL.KEEP);
    HALL.write(h);
    return L;
  };
  const pcDeath = A.pcDeath;
  A.pcDeath = function () {
    const pc = A.pc(), was = !!(pc && pc.alive);
    const r = pcDeath.apply(this, arguments);
    try { if (was && pc && !pc.alive) HALL.record(pc); } catch (e) { console.error('hall of lives', e); }
    return r;
  };

  // ---- what the whole Hall adds up to (pure) -----------------------------------------------------------------------
  HALL.totals = function (h) {
    h = h || HALL.read();
    const nE = (A.ENDINGS || []).filter(e => h.endings[e.id]).length, nM = (A.MANNERS || []).filter(m => h.manners[m.id]).length;
    const nA = Object.keys(GD.ACH || {}).filter(k => h.ach[k]).length;
    return { lives: h.n, endings: nE, manners: nM, ach: nA, ofE: (A.ENDINGS || []).length, ofM: (A.MANNERS || []).length, ofA: Object.keys(GD.ACH || {}).length };
  };

  // ---- unlocked start stories ----------------------------------------------------------------------------------------
  // each of the Hall's stories (HALL.STARTS) with a gate: { need: totals => bool, says: what opens it }
  HALL.GATES = {
    hl_beggar: { need: t => t.lives >= 3, says: 'three lives lived' },
    hl_gravedigger: { need: t => t.endings >= 5, says: 'five different endings found' },
    hl_fallen: { need: t => t.ach >= 10, says: 'ten achievements earned across your lives' },
  };
  // the stories themselves (their opening scenes and callbacks are in hall.events.js)
  const NEW_STARTS = [
    { id: 'hl_beggar', title: "The Beggar's Heir", blurb: 'A beggar of Solenne, fifteen. Old Ansel, who kept you, died on the temple steps and left you his pitch, his cup and his debt to the beggar-king.',
      cr: { race: 'human', realm: 'POL-02', status: 'peasant', startAge: 15 }, setup: pc => { pc.coin = Math.min(pc.coin || 0, 3); } },
    { id: 'hl_gravedigger', title: "The Sexton's Book", blurb: 'A gravedigger of Morhaven, eighteen. You keep the book of who lies where, and one grave in it was filled last spring with nobody in it.',
      cr: { race: 'human', realm: 'POL-15', status: 'peasant', startAge: 18 }, setup: pc => { pc.literate = true; } },
    { id: 'hl_fallen', title: 'What Is Left of the House', blurb: 'Gentry of Varenna, twenty. The house backed the wrong claimant. The land is gone, the silver is gone, and the name is all the bailiffs left.',
      cr: { race: 'human', realm: 'POL-03', status: 'gentry', startAge: 20 }, setup: pc => { pc.coin = Math.min(pc.coin || 0, 15); } },
  ];
  // kept beside 29's twenty (A.STARTS), not in them: 29 counts its own list, and this feature applies its own stories
  HALL.STARTS = NEW_STARTS;
  const hallStory = id => NEW_STARTS.find(s => s.id === id) || null;
  HALL.story = hallStory;
  HALL.open = (id, t) => { const g = HALL.GATES[id]; return !g || !!g.need(t || HALL.totals()); };
  HALL.locked = t => Object.keys(HALL.GATES).filter(id => !HALL.open(id, t));

  // ---- the title screen: "Your lives" ------------------------------------------------------------------------------
  const yrs = L => `${L.born}–${L.died}`;
  const initial = s => esc((String(s || '?').trim()[0] || '?').toUpperCase());
  HALL.card = function (L) {
    const en = HALL.endingName(L.ending), mn = HALL.mannerName(L.manner), ep = HALL.epitaph(L.ending);
    const dot = L.color ? ` style="--hl-c:${L.color}"` : '';
    return `<li class="hl-life"${dot}><span class="hl-seal" aria-hidden="true">${initial(L.name)}</span><div class="hl-life-t">` +
      `<b class="hl-name">${esc(L.name)}</b><span class="hl-meta">${esc(yrs(L))} AR · ${esc(L.realmName || L.realm)}</span>` +
      (en ? `<span class="hl-end">${esc(en)}${mn ? ', ' + esc(mn) : ''}</span>` : '') +
      (ep ? `<span class="hl-ep">${esc(ep)}</span>` : '') +
      `<span class="hl-seed">seed ${esc(L.seed)}${L.lands === 'known' ? ' · Known World' : ''}</span></div></li>`;
  };
  UI.hallShelf = function () {
    const h = HALL.read();
    if (!h.lives.length) return '';
    const t = HALL.totals(h), last = h.lives.slice(-HALL.SHELF).reverse();
    const lock = HALL.locked(t).map(hallStory).filter(Boolean);
    return `<section class="hl-shelf" aria-label="Your lives"><div class="hl-head"><h2 class="hl-h">Your lives</h2>` +
      `<span class="hl-count">${esc(t.lives)} lived · endings ${esc(t.endings)}/${esc(t.ofE)} · ways to go ${esc(t.manners)}/${esc(t.ofM)} · achievements ${esc(t.ach)}/${esc(t.ofA)}</span></div>` +
      `<ol class="hl-lives">${last.map(HALL.card).join('')}</ol>` +
      (lock.length ? `<p class="hl-next">${lock.map(s => `<span>${UI.icon ? UI.icon('lock', 's') : ''}${esc(s.title)}: opens after ${esc(HALL.GATES[s.id].says)}.</span>`).join(' ')}</p>` : '') +
      `</section>`;
  };
  const title = UI.renderTitle;
  if (typeof title === 'function') UI.renderTitle = function () {
    const out = title.apply(this, arguments);
    try {
      if (typeof out !== 'string' || out.indexOf('hl-shelf') >= 0) return out;   // the title's owner placed it already
      const shelf = UI.hallShelf();
      if (!shelf) return out;
      // a slot the title's owner may leave for it, else under the buttons, else at the end
      if (out.indexOf('<!--hall-->') >= 0) return out.replace('<!--hall-->', shelf);
      const at = out.indexOf('<p class="small" style="margin-top:10px">');
      if (at > 0) return out.slice(0, at) + shelf + out.slice(at);
      const end = out.lastIndexOf('</div>');
      return end > 0 ? out.slice(0, end) + shelf + out.slice(end) : out + shelf;
    } catch (e) { console.error('hall shelf', e); return out; }
  };

  // ---- the death screen: what this life added -------------------------------------------------------------------------
  HALL.newLine = function (pc) {
    if (!pc || pc.alive) return '';
    const h = HALL.read(), k = HALL.keyOf(A.S, pc), L = h.lives.find(x => x.k === k);
    if (!L) return '';
    const t = HALL.totals(h), bits = [];
    if (L.newE) bits.push(`<b>${esc(HALL.endingName(L.ending))}</b> (${esc(t.endings)} of ${esc(t.ofE)} endings)`);
    if (L.newM) bits.push(`${esc(HALL.mannerName(L.manner))} (${esc(t.manners)} of ${esc(t.ofM)} ways to go)`);
    for (const a of L.newA.slice(0, 4)) if (GD.ACH && GD.ACH[a]) bits.push(esc(GD.ACH[a][0]));
    const opened = Object.keys(HALL.GATES).filter(id => HALL.open(id, t) && !HALL.open(id, HALL.totalsBefore(h, L)))
      .map(hallStory).filter(Boolean);
    return `<div class="hl-new"><div class="tag">The Hall of Lives</div><p class="small">` +
      (bits.length ? `New: ${bits.join(' · ')}.` : `Life ${esc(t.lives)} in this browser. Nothing new for the Hall this time.`) + '</p>' +
      (opened.length ? `<p class="small">A new story opens on the creation screen: ${opened.map(s => `<b>${esc(s.title)}</b>`).join(', ')}.</p>` : '') + '</div>';
  };
  // the Hall's totals as they stood before life L was added
  HALL.totalsBefore = function (h, L) {
    const b = JSON.parse(JSON.stringify(h));
    b.n -= 1; b.lives = b.lives.filter(x => x.k !== L.k);
    if (L.ending && b.endings[L.ending]) b.endings[L.ending]--;
    if (L.manner && b.manners[L.manner]) b.manners[L.manner]--;
    for (const a of L.ach) if (b.ach[a]) b.ach[a]--;
    for (const o of [b.endings, b.manners, b.ach]) for (const k in o) if (!o[k]) delete o[k];
    return HALL.totals(b);
  };
  const death = UI.deathModal;
  if (typeof death === 'function') UI.deathModal = function () {
    const h = death.apply(this, arguments);
    try {
      const line = HALL.newLine(A.pc());
      if (!line) return h;
      const at = h.indexOf('<div class="score">');
      return at > 0 ? h.slice(0, at) + line + h.slice(at) : h + line;
    } catch (e) { console.error('hall death', e); return h; }
  };

  // ---- the Dynasty tab: the Hall's counts next to this save's -------------------------------------------------------------
  const legacy = UI.TAB && UI.TAB.legacy;
  if (typeof legacy === 'function') UI.TAB.legacy = function () {
    let out = legacy.apply(this, arguments);
    try {
      const h = HALL.read();
      if (!h.n) return out;
      const t = HALL.totals(h);
      const line = `<p class="small muted hl-legacy">Across your ${esc(t.lives)} li${t.lives === 1 ? 'fe' : 'ves'} in this browser: ${esc(t.endings)}/${esc(t.ofE)} endings, ` +
        `${esc(t.manners)}/${esc(t.ofM)} ways to go, ${esc(t.ach)}/${esc(t.ofA)} achievements. Cards marked "an earlier life" were found in another game.</p>`;
      // endings this save has not found but the Hall has
      for (const e of A.ENDINGS || []) if (h.endings[e.id]) {
        const lockRx = `<div class="card ach lock"><b>${UI.esc(e.name)}</b>Not yet.`;
        out = out.split(lockRx).join(`<div class="card ach lock hl-past"><b>${UI.esc(e.name)}</b>${UI.esc(e.t)}<div class="tiny muted">In an earlier life (${esc(h.endings[e.id])}×)</div>`);
      }
      for (const k in GD.ACH || {}) if (h.ach[k] && !(A.S.ach || {})[k]) {
        const [n, d] = GD.ACH[k];
        out = out.split(`<div class="card ach lock"><b>${UI.esc(n)}</b>${UI.esc(d)}`).join(`<div class="card ach lock hl-past"><b>${UI.esc(n)}</b>${UI.esc(d)}<div class="tiny muted">In an earlier life</div>`);
      }
      const at = out.indexOf('<div class="group-h">Endings found');
      return at >= 0 ? out.slice(0, at) + line + out.slice(at) : out + line;
    } catch (e) { console.error('hall legacy', e); return out; }
  };

  // ---- the stories: chosen like 29's, carried in the options, applied after the world is made ------------------------------------
  // the story holds only if the birth still matches it (29's rule)
  const storyFor = A.storyFor;
  A.storyFor = function (c) {
    const s = c && c.story && hallStory(c.story);
    if (!s) return typeof storyFor === 'function' ? storyFor.apply(this, arguments) : null;
    for (const k of ['race', 'realm', 'status']) if (s.cr[k] && c[k] !== s.cr[k]) return null;
    return s.id;
  };
  // engine: o.story is in the journal's options, so a replay starts the same way whatever the Hall holds
  const newGame = A.newGame;
  A.newGame = function (o) {
    const r = newGame.apply(this, arguments);
    const s = o && o.story && hallStory(o.story), pc = A.pc();
    if (s && pc) {
      A.S.story = { id: s.id, y: A.S.year };
      try { s.setup && s.setup(pc); } catch (e) { console.error('hall story', s.id, e); }
      pc.flags['st_' + s.id] = A.S.year;
      A.queue({ type: 'event', ev: 'st_' + s.id + '_open', forced: true });
    }
    return r;
  };
  // the creation screen: an open story is a card beside 29's, tagged New; a shut one is named with what opens it
  const crStory = UI.A && UI.A.crStory;
  if (typeof crStory === 'function') UI.A.crStory = function (v) {
    const s = v && hallStory(v);
    if (!s) return crStory.apply(this, arguments);
    const c = UI.cr; if (!c || !HALL.open(s.id)) return;
    Object.assign(c, s.cr); c.story = s.id;
    if (!s.cr.sex && !c.sex) c.sex = 'M';
    try {
      UI.crFix && UI.crFix();
      const cult = UI.crCult && LORE.cultures[UI.crCult()], names = cult && (c.sex === 'F' ? cult.f : cult.m);
      if (names && names.length) { let h = 2166136261; for (const ch of s.id + c.sex) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); c.given = names[(h >>> 0) % names.length]; }
      UI.crFix && UI.crFix();
    } catch (e) { console.error('hall story pick', e); }
    UI.render();
  };
  const birth = UI.crStepBirth;
  if (typeof birth === 'function') UI.crStepBirth = function () {
    let out = birth.apply(this, arguments);
    try {
      const t = HALL.totals(), c = UI.cr || {}, cur = A.storyFor(c);
      const open = NEW_STARTS.filter(s => HALL.open(s.id, t)), shut = NEW_STARTS.filter(s => !HALL.open(s.id, t));
      const card = s => `<button class="opt ${cur === s.id ? 'on' : ''}" data-a="crStory" data-v="${esc(s.id)}" aria-pressed="${cur === s.id}"><b><span class="hl-tag">New</span> ${esc(s.title)}</b><span class="tiny muted">${esc(s.blurb)}</span></button>`;
      const g = out.indexOf('<div class="opt-grid">'), end = g >= 0 ? out.indexOf('</div>', g) : -1;
      if (open.length && end > 0) out = out.slice(0, end) + open.map(card).join('') + out.slice(end);
      if (shut.length) {
        const note = `<p class="tiny muted hl-shut">${shut.map(s => `<span>${UI.icon ? UI.icon('lock', 's') : ''}${esc(s.title)} opens after ${esc(HALL.GATES[s.id].says)}.</span>`).join(' ')}</p>`;
        const at = out.indexOf('</details>');
        if (at > 0) out = out.slice(0, at) + note + out.slice(at);
      }
    } catch (e) { console.error('hall stories', e); }
    return out;
  };
  const summary = UI.crSummary;
  if (typeof summary === 'function') UI.crSummary = function () {
    const h = summary.apply(this, arguments);
    try {
      const s = hallStory(A.storyFor(UI.cr || {}));
      return s ? `<div class="card small"><span class="tag">Story</span> <b>${esc(s.title)}</b><div class="tiny muted">${esc(s.blurb)}</div></div>` + h : h;
    } catch (e) { return h; }
  };

  // ---- the look (91-look's tokens) -------------------------------------------------------------------------------------
  const CSS = `.hl-shelf{max-width:900px;margin:var(--s-5,20px) auto 0;text-align:left}
.hl-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px;border-bottom:1px solid var(--line);padding-bottom:6px}
.hl-h{font-family:var(--f-name,serif);font-size:var(--t-h3,16px);letter-spacing:.06em;margin:0;color:var(--accent-strong,inherit)}
.hl-count{font-size:var(--t-small,13px);color:var(--ink-2,inherit)}
.hl-lives{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px}
.hl-life{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r-m,8px);background:var(--raised);box-shadow:var(--e-1)}
.hl-seal{flex:0 0 32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--f-name,serif);font-weight:700;color:var(--on-accent,#000);background:var(--hl-c,var(--accent-fill));border:1px solid var(--line-strong)}
.hl-life-t{display:flex;flex-direction:column;min-width:0;gap:1px}
.hl-name{font-family:var(--f-name,serif);font-size:var(--t-ui,14px);color:var(--ink)}
.hl-meta,.hl-seed{font-size:var(--t-cap,12px);color:var(--ink-3)}
.hl-end{font-size:var(--t-small,13px);color:var(--accent)}
.hl-ep{font-family:var(--f-prose,serif);font-style:italic;font-size:var(--t-small,13px);color:var(--ink-2);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hl-next,.hl-shut{font-size:var(--t-cap,12px);color:var(--ink-3);margin:8px 0 0;display:flex;flex-wrap:wrap;gap:4px 14px}
.hl-next .ic,.hl-shut .ic{width:12px;height:12px;vertical-align:-2px;margin-right:3px}
.hl-new{margin:10px auto;max-width:520px;padding:8px 12px;border:1px solid var(--accent-rule,var(--line));border-radius:var(--r-m,8px);background:var(--accent-tint,transparent)}
.hl-tag{display:inline-block;margin-right:4px;padding:0 5px;border-radius:var(--r-pill,99px);font-size:var(--t-cap,12px);font-family:var(--f-ui,sans-serif);letter-spacing:.04em;text-transform:uppercase;color:var(--on-accent,#000);background:var(--accent-fill);vertical-align:1px}
.card.ach.hl-past{opacity:.85;border-style:dashed}
@media (max-width:760px){.hl-shelf{margin:16px 0 0}.hl-lives{grid-template-columns:1fr}}`;
  const put = () => { if (typeof document === 'undefined' || document.getElementById('hl-style')) return; const s = document.createElement('style'); s.id = 'hl-style'; s.textContent = CSS; document.head.appendChild(s); };
  if (typeof document !== 'undefined') { if (document.head) put(); else document.addEventListener('DOMContentLoaded', put); }
})();
