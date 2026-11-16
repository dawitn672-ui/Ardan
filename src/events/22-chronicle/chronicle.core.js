// The Chronicle: signature system 1. The game writes each life as a book, in a chronicler's voice, from what actually
// happened (the story log, world history and news). Chapters run by decade of age; each keeps the entries that mattered
// most. News from far realms is set down as hearsay. Rendering is pure: no A.rand, no change to A.S. Wording varies by
// hashing ids and years.
(function () {
  const hash = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  const pick = (arr, key) => arr[hash(key) % arr.length];
  const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth', 'Eleventh', 'Twelfth'];
  const DECADE = ['childhood', 'youth', 'the third decade', 'the fourth decade', 'the fifth decade', 'the sixth decade', 'the seventh decade',
    'the eighth decade', 'the ninth decade', 'the tenth decade'];
  const MONTHS = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
  const SKIP = new Set(['yearstart', 'muted', 'ach']);
  // game-mechanics notices, not events of a life
  const NOISE = /: you unlock "|^Achievement:|^Work: \d|\(\w+ tab\)|^Siblings:/;
  const WORLD = new Set(['war', 'peace', 'crown']);
  const WEIGHT = { big: 5, death: 5, blood: 3, crown: 4, war: 4, peace: 3, good: 2, bad: 2, '': 1, warn: 1, lore: 1 };
  const OPEN = ['Here it is set down that', 'Let it be written that', 'It is recorded that', 'The chronicle notes that', 'In this year,'];

  function month(d, y) {
    if (d == null) return null;
    try { const s = A.dateStr(d, y, true) || ''; const m = s.split(' ')[1]; return MONTHS[m] || null; } catch (e) { return null; }
  }
  // one personal line in the chronicler's voice, addressed to its subject; a date only when the month changes
  function personal(text, y, d, key, state) {
    const t = String(text).trim();
    const when = month(d, y), stamp = when && `${when} ${y}`;
    const lead = stamp && stamp !== state.last ? pick([`In ${when} of ${y},`, `In the ${when} of ${y},`], key + 'w') : null;
    if (stamp) state.last = stamp;
    if (/^(You|Your)\b/.test(t)) {
      const rest = t[0].toLowerCase() + t.slice(1);
      return lead ? `${lead} ${rest}` : `${pick(OPEN, key)} ${rest}`;
    }
    return `${lead ? lead.replace(/,$/, ':') : pick(['Item:', 'Also:', 'Set down besides:'], key)} ${t}`;
  }
  // one world line; far-off news is hearsay, home news is fact (colon framing keeps the source's capitals right)
  function world(text, cls, homeShort, key) {
    let t = String(text).trim();
    if (/^War! /.test(t)) t = 'War was declared. ' + t.slice(5);
    if (homeShort && t.includes(homeShort)) return `In the realm: ${t}`;
    return `${pick(['Word came from abroad, and none here could swear to it:', 'It was said in the markets:', 'Travellers told it so:'], key)} ${t}`;
  }

  // Build the book as plain data: [{ who, name, chapters: [{ title, span, lines: [string] }], end }]
  A.chronicleBook = function () {
    const S = A.S; if (!S || !S.log) return [];
    const lives = [];
    let cur = null;
    for (const e of S.log) {
      if (!cur || cur.pc !== e.pc) { cur = { pc: e.pc, entries: [] }; lives.push(cur); }
      cur.entries.push(e);
    }
    return lives.map(L => {
      const p = A.P(L.pc), name = p ? (A.fullName ? A.fullName(p, false) : p.given) : 'one whose name is lost';
      const home = p && A.realm(p.realm), homeShort = home ? (home.short || '') : '';
      const groups = new Map();
      for (const e of L.entries) {
        const k = Math.max(0, Math.floor((+e.age || 0) / 10));
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(e);
      }
      const chapters = [];
      for (const [k, es] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
        const items = [];
        for (const e of es) for (const [i, l] of (e.lines || []).entries()) {
          if (!Array.isArray(l) || !l[0] || SKIP.has(l[1]) || NOISE.test(String(l[0]))) continue;
          const cls = l[1] || '', t = String(l[0]);
          const isWorld = WORLD.has(cls) || (cls === 'warn' && !/\b(you|your)\b/i.test(t));
          let w = WEIGHT[cls] || 1;
          if (/\b(born|marr|wed|dies|died|knight|promot|crown|heir|child|son|daughter|wound|prison|freed|war)\b/i.test(t)) w += 2;
          if (e === es[0] && i === 0 && k === 0) w += 6;   // the first line of a life
          items.push({ y: e.year, d: l[2], t, cls, w, world: isWorld, key: `${L.pc}|${e.year}|${i}` });
        }
        const mine = items.filter(x => !x.world).sort((a, b) => b.w - a.w).slice(0, 10);
        const abroad = items.filter(x => x.world).sort((a, b) => b.w - a.w).slice(0, 3);
        const keep = [...mine, ...abroad].sort((a, b) => a.y - b.y || (a.d || 0) - (b.d || 0));
        if (!keep.length) continue;
        const y0 = es[0].year, y1 = es[es.length - 1].year, a0 = es[0].age, a1 = es[es.length - 1].age;
        const state = { last: null };
        chapters.push({
          title: `The ${ORD[chapters.length] || (chapters.length + 1) + 'th'} Chapter: Of ${DECADE[k] || 'the later years'}`,
          span: y0 === y1 ? `The year ${y0}, aged ${a0}` : `The years ${y0} to ${y1}, from the age of ${a0} to ${a1}`,
          lines: keep.map(x => x.world ? world(x.t, x.cls, homeShort, x.key) : personal(x.t, x.y, x.d, x.key, state)),
        });
      }
      let end = null;
      if (p && !p.alive) {
        const cause = p.deathCause || p.cause || p.lastHurt;
        end = `Here ends the account of ${name}, who died in the year ${p.died || (L.entries[L.entries.length - 1] || {}).year}` +
          `${cause ? ', of ' + cause : ''}. May the earth lie light on ${A.him ? A.him(p) : 'them'}.`;
      }
      return { who: L.pc, name, chapters, end };
    }).filter(l => l.chapters.length);
  };

  A.chronicleText = function () {
    const out = ['THE CHRONICLE OF ARDAN', ''];
    for (const life of A.chronicleBook()) {
      out.push(`THE LIFE OF ${life.name.toUpperCase()}`, '');
      for (const c of life.chapters) { out.push(c.title, c.span, ''); for (const l of c.lines) out.push(l); out.push(''); }
      if (life.end) out.push(life.end, '');
    }
    return out.join('\n');
  };

  UI.TAB.book = function () {
    const book = A.chronicleBook();
    let h = '<div class="chronicle-book"><div class="row"><h3 style="flex:1">The Chronicle</h3>' +
      '<button class="small" data-a="chronicleExport">Save the chronicle as text</button></div>' +
      '<p class="muted small">What the chronicler set down of your life, chapter by chapter. News from far realms is written as it was heard, and hearsay can be wrong.</p>';
    if (!book.length) h += '<p class="muted">Nothing has been written yet. Live a little.</p>';
    for (const life of book) {
      h += `<section class="chron-life"><h3>The Life of ${UI.esc(life.name)}</h3>`;
      for (const c of life.chapters) {
        h += `<h4>${UI.esc(c.title)}</h4><p class="tiny muted">${UI.esc(c.span)}</p>`;
        h += c.lines.map(l => `<p class="chron-line">${UI.esc(l)}</p>`).join('');
      }
      if (life.end) h += `<p class="chron-end"><em>${UI.esc(life.end)}</em></p>`;
      h += '</section>';
    }
    return h + '</div>';
  };
  Object.assign(UI.A, {
    chronicleExport() {
      const p = A.pc(), name = p ? (p.given || 'life') : 'life';
      UI.download(new TextEncoder().encode(A.chronicleText()), `chronicle-of-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`, 'text/plain');
    },
  });
  // a sub-tab in the Chronicle group, first in line
  const g = UI.GROUPS.find(x => x.k === 'chronicle');
  if (g && !g.subs.some(s => s[0] === 'book')) g.subs.unshift(['book', 'The Book']);
  A.SIGNATURE = Object.assign(A.SIGNATURE || {}, { chronicle: true });
})();
