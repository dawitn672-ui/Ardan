// Player mods (65-mods), part one: the mod format, its checker, its compiler, and the example mod that ships built in.
//
// A player's mod is a JSON file: data, not code. The page's security policy forbids eval and new Function, and a
// file from a stranger must not run code anyway. So a mod's conditions are a small declarative language that maps
// onto the engine's own C.* helpers, its effects are a whitelist of the engine's own fx keys, and its words go through
// a token whitelist. The compiler turns checked data into ordinary event objects: cond and setup are closures over
// the data, fx are plain fx objects, and A.defEvents registers them like any other pack. Each compiled cond carries a
// toString written in the C.* helpers it calls, so A.CX_RX, A.evAudience, the linters and the bot's memory index
// classify a mod event exactly as they would a hand-written one.
//
// This file lives with the event packs, not with the core, because tools/lint-events.mjs and lint-choices.mjs read
// *.events.js: compiling the example here lets both play-test its events like any feature's. The core half
// (mods.core.js) keeps the player's library, decides which mods a game runs with, and draws the Mods panel.
(function () {
  const MC = {};
  MC.FORMAT = 'ardan-mod';
  MC.VERSION = 1;                       // formatVersion this game reads
  MC.MAX_BYTES = 512 * 1024;
  MC.MAX_EVENTS = 200;
  MC.MAX_CUSTOMS = 3;                   // per realm, per mod

  // ---- what a mod may say
  // tokens the engine fills for any event (A.T and A.ctxTokens). Left out on purpose: {town} {season} {festival}
  // {npcM} {npcF} {god}, which draw from the random stream while the event is shown.
  MC.TOKENS = ['name', 'full', 'sur', 'home', 'realm', 'realmShort', 'capital', 'ruler', 'rulerTitle', 'coinName', 'people',
    'race', 'he', 'his', 'year', 'age', 'manwoman', 'enemy', 'rival', 'friend', 'father', 'mother', 'spouse', 'faith',
    'family', 'familySeat', 'familyHead', 'liege', 'weapon', 'rank', 'boss', 'bossFull', 'bossTitle'];
  // tokens for the person an event is about ("with")
  MC.WITH_TOKENS = ['them', 'themFull', 'theyHe', 'theirHis', 'themHim', 'themAge', 'themRace', 'themOcc', 'khe', 'khim', 'khis'];
  MC.BIBLE_TOKENS = ['cw1', 'cw2', 'cw3'];            // the realm bible's culture words (47-realm-bible)
  MC.CUSTOM_TOKENS = ['w1', 'w2', 'w3', 'realm'];     // what a custom's own words may use, besides MC.TOKENS
  // a token's usual length in words, for the 80-word limit before rendering
  MC.TOKEN_WORDS = { realm: 4, ruler: 4, faith: 4, full: 3, themFull: 3, familyHead: 4, liege: 3, themOcc: 3, home: 2,
    capital: 2, familySeat: 2, family: 2, rank: 2, weapon: 2, people: 2, bossFull: 3, bossTitle: 2 };
  MC.RELS = ['friend', 'bestfriend', 'rival', 'enemy', 'lover', 'spouse', 'betrothed', 'sibling', 'father', 'mother', 'child',
    'cousin', 'grandparent', 'grandchild', 'inlaw', 'mentor', 'student', 'patron', 'lord', 'superior', 'subordinate',
    'councillor', 'ex', 'acquaint'];
  MC.TERRS = ['plains', 'forest', 'steppe', 'hills', 'marsh', 'desert', 'mountains', 'tundra'];
  MC.STATS = ['str', 'spd', 'ins', 'sta', 'int', 'wil'];
  // the condition language: every key is one C.* helper
  MC.COND_BOOL = ['adult', 'child', 'teen', 'young', 'old', 'noble', 'rich', 'poor', 'unfree', 'soldier', 'atWar', 'ruler',
    'married', 'hasKids', 'male', 'female', 'prison', 'literate', 'coast', 'town', 'family', 'famHead', 'parentsAlive',
    'sworn', 'owes', 'letter', 'superior', 'office', 'faction', 'ambition'];
  MC.COND_NUM = ['age', 'ageAdj', 'fame', 'rep', 'favors', 'allies'];
  MC.COND_LIST = ['realm', 'race', 'cult', 'faith', 'terr'];
  MC.COND_OTHER = ['all', 'any', 'not', 'stat', 'skill', 'since', 'flag', 'trait', 'hasRel', 'job', 'jobRank', 'apt'];
  MC.OPS = ['>=', '<=', '>', '<', '==', '!='];
  // the effects a mod may have, with their bounds
  MC.FX_NUM = { str: [-2, 3], spd: [-2, 3], ins: [-2, 3], sta: [-2, 3], int: [-2, 3], wil: [-2, 3], health: [-30, 30],
    happy: [-20, 20], looks: [-5, 5], fame: [-10, 10], honor: [-20, 20], piety: [-20, 20], coin: [-1000, 1000] };
  MC.FX_KEYS = Object.keys(MC.FX_NUM).concat(['skill', 'flag', 'unflag', 'trait', 'untrait', 'rel', 'them', 'event']);
  MC.CUSTOM_KINDS = ['year', 'rite', 'ward'];   // the kinds the bible runs from its month hook, needing nothing else

  // ---- small helpers (pure)
  const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const words = s => (String(s).match(/\S+/g) || []).length;
  const keysOf = o => Object.keys(o);
  const J = v => JSON.stringify(v);
  // a stable 56-bit hash (cyrb53), as 14 hex digits
  MC.hash = function (str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h2 >>> 0) & 0x1fffff).toString(16).padStart(6, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  };

  // what the running game knows: the lists a mod's names are checked against. Null outside the page (the linter's
  // stub engine), where only the shape of a mod is checked.
  MC.env = function () {
    if (typeof GD !== 'object' || !GD || typeof GD.SKILLS !== 'object' || typeof LORE !== 'object' || !LORE || typeof LORE.realms !== 'object') return null;
    const B = typeof A === 'object' && A && typeof A.BIBLE === 'object' && A.BIBLE ? A.BIBLE : null;
    return {
      skills: keysOf(GD.SKILLS), stats: (GD.STATS || MC.STATS).slice(), traits: keysOf(GD.TRAITS || {}), quirks: keysOf(GD.QUIRKS || {}),
      realms: keysOf(LORE.realms), cultures: keysOf(LORE.cultures || {}), faiths: keysOf(LORE.faiths || {}), races: keysOf(GD.RACES || {}),
      careers: keysOf(GD.CAREERS || {}),
      bible: B && B.WHO && B.WHEN ? { who: keysOf(B.WHO), when: keysOf(B.WHEN) } : null,
    };
  };

  // ---- the checker: strict, with a path on every message. Returns { errors, warnings, mod } where mod is a fresh
  // copy holding only known fields, its strings cleaned. A mod with any error loads nothing.
  MC.check = function (raw, env) {
    const errors = [], warnings = [];
    let stripped = 0;
    const E = (at, msg) => { if (errors.length < 60) errors.push(at + ': ' + msg); };
    const W = (at, msg) => { if (warnings.length < 30) warnings.push(at + ': ' + msg); };
    if (!isObj(raw)) return { errors: ['the file is not a JSON object'], warnings, mod: null };
    const only = (at, o, allowed) => { for (const k of keysOf(o)) if (!allowed.includes(k)) E(at, `unknown field "${String(k).slice(0, 30)}" (allowed: ${allowed.join(', ')})`); };
    only('mod', raw, ['format', 'formatVersion', 'id', 'name', 'version', 'author', 'about', 'words', 'events', 'customs']);
    if (raw.format !== MC.FORMAT) E('format', `must be "${MC.FORMAT}"`);
    if (raw.formatVersion !== MC.VERSION) {
      if (typeof raw.formatVersion === 'number' && raw.formatVersion > MC.VERSION) E('formatVersion', `${raw.formatVersion} is newer than this game reads (${MC.VERSION}); update the game`);
      else E('formatVersion', `must be ${MC.VERSION}`);
    }
    const modId = typeof raw.id === 'string' && /^[a-z][a-z0-9]{1,15}$/.test(raw.id) ? raw.id : null;
    if (!modId) E('id', 'must be 2 to 16 lowercase letters or digits, starting with a letter (for example "stones")');
    const prefix = 'mod_' + (modId || '?') + '_';

    // a string: control characters out; angle brackets out (no markup in a mod, as in a save; everything is escaped
    // when drawn as well); tokens checked against what this place may use
    const str = (at, v, o) => {
      if (typeof v !== 'string') { E(at, 'must be text'); return null; }
      let s = v.replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ');
      if (/[<>]/.test(s)) { stripped += (s.match(/[<>]/g) || []).length; s = s.replace(/[<>]/g, ''); }
      s = s.replace(/ {2,}/g, ' ').trim();
      if (!s && !o.empty) { E(at, 'is empty'); return null; }
      if (o.chars && s.length > o.chars) E(at, `is ${s.length} characters (at most ${o.chars})`);
      if (o.tokens) {
        const braces = s.replace(/\{[A-Za-z0-9_]+\}/g, '');
        if (/[{}]/.test(braces)) E(at, 'has a { or } that is not part of a {token}');
        for (const m of s.matchAll(/\{([A-Za-z0-9_]+)\}/g)) if (!o.tokens.includes(m[1])) E(at, `unknown token {${m[1]}}` + (MC.WITH_TOKENS.includes(m[1]) ? ' (needs "with" on this event)' : ''));
      } else if (/[{}]/.test(s)) E(at, 'may not hold { or }');
      if (o.words) {
        const n = words(s.replace(/\{([A-Za-z0-9_]+)\}/g, (m, k) => ' w'.repeat(MC.TOKEN_WORDS[k] || 1) + ' '));
        if (n > o.words) E(at, `is ${n} words${o.tokens && /\{/.test(s) ? ' counting tokens at their usual length' : ''} (at most ${o.words})`);
      }
      return s;
    };
    const intIn = (at, v, lo, hi) => { if (typeof v !== 'number' || !Number.isFinite(v) || Math.round(v) !== v) { E(at, 'must be a whole number'); return null; } if (v < lo || v > hi) { E(at, `${v} is out of range (${lo} to ${hi})`); return null; } return v; };
    const numIn = (at, v, lo, hi) => { if (typeof v !== 'number' || !Number.isFinite(v)) { E(at, 'must be a number'); return null; } if (v < lo || v > hi) { E(at, `${v} is out of range (${lo} to ${hi})`); return null; } return v; };
    const oneOf = (at, v, list, what) => { if (typeof v !== 'string' || (list && !list.includes(v))) { E(at, `"${String(v).slice(0, 30)}" is not a known ${what}`); return null; } return v; };
    const flagName = (at, v, own) => {
      if (typeof v !== 'string' || !/^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(v)) { E(at, 'a flag name is letters, digits and _'); return null; }
      if (own && !v.startsWith(prefix)) { E(at, `a flag a mod sets must start with "${prefix}"`); return null; }
      return v;
    };
    const mod = { format: MC.FORMAT, formatVersion: MC.VERSION, id: modId || '', name: '', version: '' };
    mod.name = str('name', raw.name, { chars: 40 }) || '';
    if (typeof raw.version !== 'string' || !/^[0-9][0-9A-Za-z.-]{0,15}$/.test(raw.version)) E('version', 'must be like "1.0" or "1.2.3"'); else mod.version = raw.version;
    if (raw.author != null) mod.author = str('author', raw.author, { chars: 40 }) || '';
    if (raw.about != null) mod.about = str('about', raw.about, { words: 60, chars: 400 }) || '';

    // words: a mod's own tokens, each culture's word for a thing, with a default for every culture without one
    const wordTokens = [];
    if (raw.words != null) {
      if (!isObj(raw.words)) E('words', 'must be an object of culture id to words');
      else {
        mod.words = {};
        if (!isObj(raw.words.default)) E('words.default', 'is needed: the word for every culture you do not name');
        const def = isObj(raw.words.default) ? raw.words.default : {};
        for (const cid of keysOf(raw.words)) {
          const at = `words.${String(cid).slice(0, 20)}`;
          if (cid !== 'default' && (typeof cid !== 'string' || !/^CUL-\d\d$/.test(cid) || (env && !env.cultures.includes(cid)))) { E(at, 'is not a culture id (CUL-01 .. CUL-24) or "default"'); continue; }
          const set = raw.words[cid];
          if (!isObj(set)) { E(at, 'must be an object of token to word'); continue; }
          const out = {};
          for (const tk of keysOf(set)) {
            if (!/^[a-z][A-Za-z0-9]{1,19}$/.test(tk)) { E(`${at}.${String(tk).slice(0, 20)}`, 'a token name is 2 to 20 letters or digits, starting lowercase'); continue; }
            if (MC.TOKENS.includes(tk) || MC.WITH_TOKENS.includes(tk) || MC.BIBLE_TOKENS.includes(tk) || MC.CUSTOM_TOKENS.includes(tk)) { E(`${at}.${tk}`, `{${tk}} is the game's own token`); continue; }
            if (cid !== 'default' && !(tk in def)) E(`${at}.${tk}`, 'has no default (add it to words.default)');
            const w = str(`${at}.${tk}`, set[tk], { words: 4, chars: 40 });
            if (w != null) out[tk] = w;
          }
          mod.words[cid] = out;
          if (cid === 'default') wordTokens.push(...keysOf(out));
        }
      }
    }
    const baseTokens = MC.TOKENS.concat(wordTokens, env ? (env.bible ? MC.BIBLE_TOKENS : []) : MC.BIBLE_TOKENS);

    // the condition language
    let nodes = 0;
    const cond = (at, c, depth) => {
      if (++nodes > 400) { if (nodes === 401) E(at, 'too many conditions in this mod'); return null; }
      if (depth > 6) { E(at, 'conditions nest at most 6 deep'); return null; }
      if (!isObj(c) || keysOf(c).length !== 1) { E(at, 'a condition is an object with exactly one key, like {"adult": true}'); return null; }
      const k = keysOf(c)[0], v = c[k], here = `${at}.${k}`;
      const cmp = (x, n0, lo, hi) => {
        if (!Array.isArray(x) || x.length !== n0) return false;
        const op = x[n0 - 2], n = x[n0 - 1];
        if (!MC.OPS.includes(op)) { E(here, `"${String(op).slice(0, 4)}" is not a comparison (${MC.OPS.join(' ')})`); return false; }
        return numIn(here, n, lo, hi) != null;
      };
      if (k === 'all' || k === 'any') {
        if (!Array.isArray(v) || !v.length || v.length > 20) { E(here, 'must be a list of 1 to 20 conditions'); return null; }
        const list = v.map((x, i) => cond(`${here}[${i}]`, x, depth + 1));
        return list.includes(null) ? null : { [k]: list };
      }
      if (k === 'not') { const x = cond(here, v, depth + 1); return x && { not: x }; }
      if (MC.COND_BOOL.includes(k)) { if (typeof v !== 'boolean') { E(here, 'must be true or false'); return null; } return { [k]: v }; }
      if (MC.COND_NUM.includes(k)) { if (!cmp(v, 2, -100000, 100000)) { E(here, 'must be like [">=", 30]'); return null; } return { [k]: v.slice() }; }
      if (MC.COND_LIST.includes(k)) {
        const list = typeof v === 'string' ? [v] : v;
        if (!Array.isArray(list) || !list.length || list.length > 40) { E(here, 'must be a name or a list of names'); return null; }
        const known = env ? { realm: env.realms, race: env.races, cult: env.cultures, faith: env.faiths, terr: MC.TERRS }[k] : (k === 'terr' ? MC.TERRS : null);
        const what = { realm: 'realm id (POL-01 ..)', race: 'race', cult: 'culture id (CUL-01 ..)', faith: 'faith id (REL-01 ..)', terr: 'terrain' }[k];
        const out = list.map((x, i) => oneOf(`${here}[${i}]`, x, known, what));
        return out.includes(null) ? null : { [k]: out };
      }
      if (k === 'stat' || k === 'skill') {
        const list = k === 'stat' ? (env ? env.stats : MC.STATS) : (env ? env.skills : null);
        if (!Array.isArray(v) || v.length !== 3) { E(here, `must be like ["${k === 'stat' ? 'str' : 'persuasion'}", ">=", 40]`); return null; }
        if (oneOf(here, v[0], list, k) == null || !cmp(v, 3, 0, 200)) return null;
        return { [k]: v.slice() };
      }
      if (k === 'since') {
        if (!Array.isArray(v) || v.length !== 3) { E(here, 'must be like ["mod_x_flag", ">=", 10]: years since a flag was set'); return null; }
        if (flagName(here, v[0], false) == null || !cmp(v, 3, 0, 1000)) return null;
        return { since: v.slice() };
      }
      if (k === 'flag') return flagName(here, v, false) == null ? null : { flag: v };
      if (k === 'trait') return oneOf(here, v, env ? env.traits.concat(env.quirks) : null, 'trait') == null ? null : { trait: v };
      if (k === 'apt') return oneOf(here, v, env ? env.skills : null, 'skill') == null ? null : { apt: v };
      if (k === 'hasRel') {
        const list = typeof v === 'string' ? [v] : v;
        if (!Array.isArray(list) || !list.length) { E(here, 'must be a relation or a list of them'); return null; }
        const out = list.map((x, i) => oneOf(`${here}[${i}]`, x, MC.RELS, 'relation'));
        return out.includes(null) ? null : { hasRel: out };
      }
      if (k === 'job') {
        if (typeof v === 'boolean') return { job: v };
        return oneOf(here, v, env ? env.careers : null, 'career') == null ? null : { job: v };
      }
      if (k === 'jobRank') return intIn(here, v, 0, 12) == null ? null : { jobRank: v };
      E(here, `unknown condition (known: ${MC.COND_BOOL.concat(MC.COND_NUM, MC.COND_LIST, MC.COND_OTHER).join(', ')})`);
      return null;
    };

    // effects
    const fx = (at, f, o) => {
      if (!isObj(f)) { E(at, 'must be an object of effects, like {"coin": 5}'); return null; }
      const out = {};
      for (const k of keysOf(f)) {
        const v = f[k], here = `${at}.${k}`;
        if (!MC.FX_KEYS.includes(k) || (o.custom && (k === 'them' || k === 'event'))) { E(here, `unknown effect (allowed: ${MC.FX_KEYS.filter(x => !o.custom || (x !== 'them' && x !== 'event')).join(', ')})`); continue; }
        if (MC.FX_NUM[k]) { const n = intIn(here, v, MC.FX_NUM[k][0], MC.FX_NUM[k][1]); if (n != null) out[k] = n; continue; }
        if (k === 'skill') {
          if (!isObj(v) || !keysOf(v).length || keysOf(v).length > 3) { E(here, 'must be like {"persuasion": 2}, at most 3 skills'); continue; }
          const s = {};
          for (const sk of keysOf(v)) if (oneOf(`${here}.${String(sk).slice(0, 20)}`, sk, env ? env.skills : null, 'skill') != null && numIn(`${here}.${sk}`, v[sk], 0.5, 5) != null) s[sk] = v[sk];
          out.skill = s; continue;
        }
        if (k === 'flag' || k === 'unflag') { if (flagName(here, v, true) != null) out[k] = v; continue; }
        if (k === 'trait' || k === 'untrait') { if (oneOf(here, v, env ? env.traits : null, 'trait') != null) out[k] = v; continue; }
        if (k === 'rel') {
          if (!isObj(v) || keysOf(v).some(x => x !== 'who' && x !== 'op')) { E(here, 'must be like {"who": "friend", "op": 10}'); continue; }
          if (oneOf(`${here}.who`, v.who, MC.RELS, 'relation') != null && intIn(`${here}.op`, v.op, -30, 30) != null) out.rel = { who: v.who, op: v.op };
          continue;
        }
        if (k === 'them') {
          if (!o.withOn) { E(here, 'needs "with" on this event (who "them" is)'); continue; }
          if (!isObj(v) || keysOf(v).some(x => x !== 'op')) { E(here, 'must be like {"op": 10}'); continue; }
          if (intIn(`${here}.op`, v.op, -40, 40) != null) out.them = { op: v.op };
          continue;
        }
        if (k === 'event') {
          if (typeof v !== 'string' || !v.startsWith(prefix)) { E(here, `must be the id of another event in this mod (starting "${prefix}")`); continue; }
          out.event = v; o.chains.push([at, v]); continue;
        }
      }
      return out;
    };

    // events
    const ids = new Set(), chains = [];
    if (!Array.isArray(raw.events) || !raw.events.length) { if (raw.events != null || raw.customs == null) E('events', 'must be a list of at least one event'); }
    else if (raw.events.length > MC.MAX_EVENTS) E('events', `has ${raw.events.length} events (at most ${MC.MAX_EVENTS})`);
    else {
      mod.events = [];
      raw.events.forEach((e, i) => {
        let at = `events[${i}]`;
        if (!isObj(e)) { E(at, 'must be an object'); return; }
        if (typeof e.id === 'string') at += ` (${e.id.slice(0, 40)})`;
        only(at, e, ['id', 'title', 'text', 'cond', 'with', 'w', 'cool', 'once', 'trigger', 'choices']);
        const ev = {};
        if (typeof e.id !== 'string' || !e.id.startsWith(prefix) || !/^mod_[a-z][a-z0-9]{1,15}_[a-z0-9_]{1,40}$/.test(e.id)) E(at + '.id', `must start with "${prefix}" and go on in lowercase letters, digits and _`);
        else if (ids.has(e.id)) E(at + '.id', 'is used twice');
        else { ids.add(e.id); ev.id = e.id; }
        if (e.with != null) {
          const list = typeof e.with === 'string' ? [e.with] : e.with;
          if (!Array.isArray(list) || !list.length || list.length > 6) E(at + '.with', 'must be a relation or a list of them');
          else { const out = list.map((x, j) => oneOf(`${at}.with[${j}]`, x, MC.RELS, 'relation')); if (!out.includes(null)) ev.with = out; }
        }
        const tokens = baseTokens.concat(e.with != null ? MC.WITH_TOKENS : []);
        ev.title = str(at + '.title', e.title, { words: 10, chars: 80, tokens });
        ev.text = str(at + '.text', e.text, { words: 80, chars: 900, tokens });
        if (e.trigger != null) { if (typeof e.trigger !== 'boolean') E(at + '.trigger', 'must be true or false'); else if (e.trigger) ev.trigger = true; }
        if (e.cond != null) { const c = cond(at + '.cond', e.cond, 0); if (c) ev.cond = c; }
        else if (!ev.trigger) E(at + '.cond', 'is needed (or "trigger": true for an event only another event leads to)');
        if (e.w != null) { const n = numIn(at + '.w', e.w, 0.05, 5); if (n != null) ev.w = n; }
        if (e.cool != null) { const n = intIn(at + '.cool', e.cool, 1, 100); if (n != null) ev.cool = n; }
        if (e.once != null) { if (typeof e.once !== 'boolean') E(at + '.once', 'must be true or false'); else if (e.once) ev.once = true; }
        const chs = e.choices;
        if (!Array.isArray(chs) || chs.length < 2 || chs.length > 4) { E(at + '.choices', `must be a list of 2 to 4 choices${Array.isArray(chs) ? ` (has ${chs.length})` : ''}`); }
        else {
          ev.choices = [];
          let free = 0;
          chs.forEach((c, j) => {
            const ca = `${at}.choices[${j}]`;
            if (!isObj(c)) { E(ca, 'must be an object'); return; }
            only(ca, c, ['t', 'r', 'fx', 'check', 'win', 'lose', 'if']);
            const ch = { t: str(ca + '.t', c.t, { words: 12, chars: 100, tokens }) };
            if (c.if != null) { const x = cond(ca + '.if', c.if, 0); if (x) ch.if = x; } else free++;
            const branch = (bat, b) => {
              if (!isObj(b)) { E(bat, 'must be an object like {"r": "...", "fx": {...}}'); return null; }
              only(bat, b, ['r', 'fx']);
              const out = { r: str(bat + '.r', b.r, { words: 80, chars: 900, tokens }) };
              if (b.fx != null) { const f = fx(bat + '.fx', b.fx, { withOn: !!ev.with, chains }); if (f) out.fx = f; }
              return out;
            };
            if (c.check != null) {
              const k = c.check;
              if (!isObj(k)) E(ca + '.check', 'must be like {"s": "persuasion", "d": 45}');
              else {
                only(ca + '.check', k, ['s', 's2', 'd']);
                const known = env ? env.skills.concat(env.stats) : null;
                const chk = { s: oneOf(ca + '.check.s', k.s, known, 'skill or stat') };
                if (k.s2 != null) chk.s2 = oneOf(ca + '.check.s2', k.s2, known, 'skill or stat');
                chk.d = intIn(ca + '.check.d', k.d, 5, 90);
                ch.check = chk;
              }
              if (c.r != null || c.fx != null) E(ca, 'a choice with a check puts its result in "win" and "lose", not "r" and "fx"');
              if (c.win == null || c.lose == null) E(ca, 'a choice with a check needs both "win" and "lose"');
              else { ch.win = branch(ca + '.win', c.win); ch.lose = branch(ca + '.lose', c.lose); }
            } else {
              if (c.win != null || c.lose != null) E(ca, '"win" and "lose" need a "check"');
              const b = branch(ca, { r: c.r, fx: c.fx === undefined ? undefined : c.fx });
              if (b) { ch.r = b.r; if (b.fx) ch.fx = b.fx; }
            }
            ev.choices.push(ch);
          });
          if (free < 2) E(at + '.choices', 'at least two choices must have no "if", so the event always offers a choice');
        }
        mod.events.push(ev);
      });
      // chains go to events of this mod, and never round in a circle
      const next = {};
      for (const [cat, to] of chains) {
        if (!ids.has(to)) E(cat + '.event', `no event "${to}" in this mod`);
        const from = (cat.match(/\((mod_[a-z0-9_]+)\)/) || [])[1];
        if (from) (next[from] = next[from] || []).push(to);
      }
      const seen = {}, loop = [];
      const dfs = (id, path) => { if (seen[id] === 1) { loop.push(path.concat(id).join(' -> ')); return; } if (seen[id] === 2) return; seen[id] = 1; for (const t of next[id] || []) dfs(t, path.concat(id)); seen[id] = 2; };
      for (const id of keysOf(next)) dfs(id, []);
      if (loop.length) E('events', `a chain of events leads back to itself: ${loop[0]}`);
      for (const ev of mod.events) if (ev.trigger && ev.id && !chains.some(c => c[1] === ev.id)) W(`events (${ev.id})`, 'is trigger-only and no event in this mod leads to it');
    }

    // customs: the realm bible's own data model (47-realm-bible), for the three kinds its month hook runs
    if (raw.customs != null) {
      if (env && !env.bible) W('customs', 'this build has no realm bible (47-realm-bible), so the customs stay unused');
      if (!isObj(raw.customs)) E('customs', 'must be an object of realm id to a list of customs');
      else {
        mod.customs = {};
        for (const rid of keysOf(raw.customs)) {
          const at = `customs.${String(rid).slice(0, 12)}`;
          if (!/^POL-\d\d$/.test(rid) || (env && !env.realms.includes(rid))) { E(at, 'is not a realm id (POL-01 .. POL-34)'); continue; }
          const list = raw.customs[rid];
          if (!Array.isArray(list) || !list.length || list.length > MC.MAX_CUSTOMS) { E(at, `must be a list of 1 to ${MC.MAX_CUSTOMS} customs`); continue; }
          const tokens = MC.TOKENS.concat(MC.CUSTOM_TOKENS);
          mod.customs[rid] = list.map((c, j) => {
            const ca = `${at}[${j}]`;
            if (!isObj(c)) { E(ca, 'must be an object'); return null; }
            only(ca, c, ['id', 'name', 'kind', 'm', 'who', 'age', 'when', 'every', 'rule', 'text', 'fx', 'keepT', 'keep', 'defy', 'log']);
            const out = {};
            if (typeof c.id !== 'string' || !c.id.startsWith(prefix) || !/^mod_[a-z][a-z0-9]{1,15}_[a-z0-9_]{1,40}$/.test(c.id)) E(ca + '.id', `must start with "${prefix}"`);
            else if (ids.has(c.id)) E(ca + '.id', 'is used twice'); else { ids.add(c.id); out.id = c.id; }
            out.name = str(ca + '.name', c.name, { words: 6, chars: 50, tokens });
            out.kind = oneOf(ca + '.kind', c.kind, MC.CUSTOM_KINDS, 'kind of custom a mod can add (year, rite, ward)');
            const wh = env && env.bible ? env.bible : { who: null, when: null };
            if (out.kind === 'year') { out.m = intIn(ca + '.m', c.m, 0, 11); if (c.who != null) out.who = oneOf(ca + '.who', c.who, wh.who, 'who'); }
            if (out.kind === 'rite') { out.age = intIn(ca + '.age', c.age, 12, 60); if (c.who != null) out.who = oneOf(ca + '.who', c.who, wh.who, 'who'); }
            if (out.kind === 'ward') { out.when = oneOf(ca + '.when', c.when, wh.when, 'when'); if (c.every != null) out.every = intIn(ca + '.every', c.every, 1, 10); }
            for (const k of ['m', 'who', 'age', 'when', 'every']) if (c[k] != null && !(k in out)) E(`${ca}.${k}`, `does not belong to a custom of kind ${out.kind || '?'}`);
            out.rule = str(ca + '.rule', c.rule, { words: 40, chars: 400, tokens });
            out.text = str(ca + '.text', c.text, { words: 80, chars: 900, tokens });
            if (c.fx != null) { const f = fx(ca + '.fx', c.fx, { custom: true, chains: [] }); if (f) out.fx = f; }
            out.keepT = str(ca + '.keepT', c.keepT, { words: 12, chars: 100, tokens });
            out.keep = str(ca + '.keep', c.keep, { words: 80, chars: 900, tokens });
            if (!isObj(c.defy)) E(ca + '.defy', 'must be like {"t": "label", "r": "result", "fx": {...}}');
            else {
              only(ca + '.defy', c.defy, ['t', 'r', 'fx']);
              out.defy = { t: str(ca + '.defy.t', c.defy.t, { words: 12, chars: 100, tokens }), r: str(ca + '.defy.r', c.defy.r, { words: 80, chars: 900, tokens }) };
              if (c.defy.fx != null) { const f = fx(ca + '.defy.fx', c.defy.fx, { custom: true, chains: [] }); if (f) out.defy.fx = f; }
            }
            out.log = str(ca + '.log', c.log, { words: 30, chars: 300, tokens });
            return out;
          });
        }
      }
    }
    if (stripped) W('text', `${stripped} angle bracket${stripped > 1 ? 's were' : ' was'} removed: a mod's words cannot hold markup`);
    const text = J(raw);
    if (text.length > MC.MAX_BYTES) E('mod', `is ${Math.round(text.length / 1024)} KB (at most ${MC.MAX_BYTES / 1024})`);
    return { errors, warnings, mod: errors.length ? null : mod };
  };

  // ---- the compiler: checked data into event objects. Pure: nothing here runs until the engine asks.
  const cmpOp = (a, op, b) => op === '>=' ? a >= b : op === '<=' ? a <= b : op === '>' ? a > b : op === '<' ? a < b : op === '==' ? a === b : a !== b;
  const srcOp = op => (op === '==' ? '===' : op === '!=' ? '!==' : op);
  const args = list => list.map(x => ',' + J(x)).join('');
  // one condition node -> { fn: (p, C) => bool, src: the same test written in C.* helpers }
  MC.cond = function cc(node) {
    const k = keysOf(node)[0], v = node[k];
    if (k === 'all' || k === 'any') {
      const parts = v.map(cc), all = k === 'all';
      return { fn: all ? (p, C) => parts.every(x => x.fn(p, C)) : (p, C) => parts.some(x => x.fn(p, C)), src: parts.length === 1 ? parts[0].src : '(' + parts.map(x => x.src).join(all ? '&&' : '||') + ')' };
    }
    if (k === 'not') { const x = cc(v); return { fn: (p, C) => !x.fn(p, C), src: '!' + x.src }; }
    if (MC.COND_BOOL.includes(k)) return v ? { fn: (p, C) => !!C[k](p), src: `C.${k}(p)` } : { fn: (p, C) => !C[k](p), src: `!C.${k}(p)` };
    if (MC.COND_NUM.includes(k)) { const [op, n] = v; return { fn: (p, C) => cmpOp(+C[k](p) || 0, op, n), src: `C.${k}(p)${srcOp(op)}${n}` }; }
    if (MC.COND_LIST.includes(k)) return { fn: (p, C) => !!C[k](p, ...v), src: `C.${k}(p${args(v)})` };
    if (k === 'stat' || k === 'skill') { const [s, op, n] = v; return { fn: (p, C) => cmpOp(+C[k](p, s) || 0, op, n), src: `C.${k}(p,${J(s)})${srcOp(op)}${n}` }; }
    if (k === 'since') {
      const [f, op, n] = v;
      return { fn: (p, C) => !!C.flag(p, f) && cmpOp(A.S.year - p.flags[f], op, n), src: `(C.flag(p,${J(f)})&&A.S.year-p.flags[${J(f)}]${srcOp(op)}${n})` };
    }
    if (k === 'flag') return { fn: (p, C) => !!C.flag(p, v), src: `C.flag(p,${J(v)})` };
    if (k === 'trait') return { fn: (p, C) => !!C.trait(p, v), src: `C.trait(p,${J(v)})` };
    if (k === 'apt') return { fn: (p, C) => !!C.apt(p, v), src: `C.apt(p,${J(v)})` };
    if (k === 'hasRel') return { fn: (p, C) => !!C.hasRel(p, ...v), src: `C.hasRel(p${args(v)})` };
    if (k === 'job') {
      if (v === true) return { fn: (p, C) => !!C.job(p), src: 'C.job(p)' };
      if (v === false) return { fn: (p, C) => !C.job(p), src: '!C.job(p)' };
      return { fn: (p, C) => !!C.job(p, v), src: `C.job(p,${J(v)})` };
    }
    if (k === 'jobRank') return { fn: (p, C) => !!C.jobRank(p, v), src: `C.jobRank(p,${v})` };
    throw new Error('unknown condition ' + k);
  };
  const withSrc = f => { const fn = (p, C) => f.fn(p, C); Object.defineProperty(fn, 'toString', { value: () => '(p,C)=>' + f.src, configurable: true }); return fn; };
  const copyFx = fx => JSON.parse(J(fx));
  // a mod's own word for its token, by the player's own people
  MC.word = (mod, p, k) => { const W = mod.words || {}, c = p && W[p.cult]; return c && c[k] != null ? c[k] : (W.default || {})[k]; };
  // the person an event is about: kept from the event that led here, else the closest living one of those relations
  MC.pickWith = function (p, types, ctx) {
    const cur = ctx.pid != null && p.rel && p.rel[ctx.pid] && A.P(ctx.pid);
    if (cur && cur.alive) return cur;
    const list = A.relsOf(p, types).filter(x => x.p && x.p.alive && x.p.id !== p.id);
    if (!list.length) return null;
    list.sort((a, b) => ((b.r.op || 0) - (a.r.op || 0)) || (String(a.p.id) < String(b.p.id) ? -1 : 1));
    return list[0].p;
  };
  MC.compile = function (mod) {
    const words = keysOf((mod.words || {}).default || {});
    const events = (mod.events || []).map(d => {
      const e = { id: d.id, title: d.title, text: d.text, w: d.w != null ? d.w : 1, cool: d.cool != null ? d.cool : 6 };
      if (d.once) e.once = true;
      if (d.trigger) e.trigger = true;
      const parts = [];
      if (d.cond) parts.push(MC.cond(d.cond));
      if (d.with) parts.push(MC.cond({ hasRel: d.with }));
      if (parts.length) e.cond = withSrc(parts.length === 1 ? parts[0] : { fn: (p, C) => parts.every(x => x.fn(p, C)), src: parts.map(x => x.src).join('&&') });
      const used = words.filter(k => [d.title, d.text].concat(...d.choices.map(c => [c.t, c.r, c.win && c.win.r, c.lose && c.lose.r])).some(s => s && s.includes('{' + k + '}')));
      if (d.with || used.length) e.setup = (p, ctx) => {
        if (d.with) {
          const t = MC.pickWith(p, d.with, ctx);
          if (!t) { ctx.skip = 1; return; }
          ctx.pid = t.id; ctx.khe = A.he(t); ctx.khim = A.him(t); ctx.khis = A.his(t);
        }
        for (const k of used) ctx[k] = MC.word(mod, p, k);
      };
      e.choices = d.choices.map(c => {
        const ch = { t: c.t };
        if (c.if) { const x = MC.cond(c.if); ch.req = (p, C) => x.fn(p, C); }
        if (c.check) {
          ch.check = { s: c.check.s, d: c.check.d };
          if (c.check.s2) ch.check.s2 = c.check.s2;
          ch.win = { r: c.win.r }; if (c.win.fx) ch.win.fx = copyFx(c.win.fx);
          ch.lose = { r: c.lose.r }; if (c.lose.fx) ch.lose.fx = copyFx(c.lose.fx);
        } else { ch.r = c.r; if (c.fx) ch.fx = copyFx(c.fx); }
        return ch;
      });
      // which mod it came from, and its own trigger mark (mods.core.js marks a mod's events trigger while it is off)
      Object.defineProperty(e, '_mod', { value: mod.id, enumerable: false, configurable: true, writable: true });
      Object.defineProperty(e, '_modTrigger', { value: !!d.trigger, enumerable: false, configurable: true, writable: true });
      return e;
    });
    const customs = {};
    for (const rid of keysOf(mod.customs || {})) customs[rid] = mod.customs[rid].map(c => {
      const o = JSON.parse(J(c));
      Object.defineProperty(o, '_mod', { value: mod.id, enumerable: false, configurable: true, writable: true });
      return o;
    });
    return { events, customs };
  };

  // ---- the example mod. The same data as features/65-mods/example-mod.json (test.mjs checks they match); it ships
  // built in, off until the player turns it on in Menu -> Mods.
  MC.EXAMPLE = {
    format: 'ardan-mod',
    formatVersion: 1,
    id: 'example',
    name: 'Stones and Debts',
    version: '1.0.0',
    author: 'Ardan',
    about: 'The example mod: a boundary stone that moves, a friend in debt, and a spring custom in Aldmark. Read MODDING.md to write your own.',
    words: {
      default: { bounds: 'beating of the bounds' },
      'CUL-02': { bounds: 'ring-walk' },
      'CUL-06': { bounds: 'dyke-walk' },
    },
    events: [
      {
        id: 'mod_example_stone',
        title: 'The boundary stone',
        cond: { all: [{ adult: true }, { any: [{ poor: true }, { job: 'farm' }, { job: 'herd' }] }] },
        once: true,
        text: 'The stones on your strip have stood since the last {bounds}. After the spring rain you walk the line and find the third one four paces into your barley. Your neighbour\'s plough was out early this week. The furrow behind the stone is fresh and very straight.',
        choices: [
          { t: 'Carry it back yourself after dark', check: { s: 'str', s2: 'stealth', d: 45 },
            win: { r: 'It is heavier than it looks. You set it in its old hole and tread the earth flat. In the morning your neighbour walks the line and says nothing at all.', fx: { str: 1, flag: 'mod_example_stone_back' } },
            lose: { r: 'You have it halfway when a dog starts up. A lamp is lit next door. You leave the stone where it fell and go home with mud to the knee.', fx: { happy: -3, flag: 'mod_example_stone_lost' } } },
          { t: 'Take it to the reeve', check: { s: 'persuasion', s2: 'int', d: 50 },
            win: { r: 'The reeve walks the line with a rod and two witnesses. The stone goes back, and your neighbour pays the lord a fine of two hens.', fx: { honor: 2, flag: 'mod_example_stone_back' } },
            lose: { r: 'The reeve has eaten at your neighbour\'s table all winter. He finds the stone exactly where the stone is.', fx: { happy: -4, flag: 'mod_example_stone_lost' } } },
          { t: 'Let it lie and plough around it',
            r: 'Four paces of barley a year is not much. You tell yourself so at every harvest.', fx: { happy: -2, flag: 'mod_example_stone_lost' } },
        ],
      },
      {
        id: 'mod_example_stone_son',
        title: 'The neighbour\'s son',
        cond: { all: [{ adult: true }, { any: [{ since: ['mod_example_stone_back', '>=', 8] }, { since: ['mod_example_stone_lost', '>=', 8] }] }] },
        once: true,
        w: 2,
        text: 'Your old neighbour is buried after the thaw. At the wake his son finds you by the door with a cup in each hand. He says his father talked about the boundary stone near the end, more than he talked about the farm. He wants to know what happened.',
        choices: [
          { t: 'Tell him the whole of it',
            r: 'You tell it plainly: the plough, the stone, the night after. He hears you out. Then he says his father told it differently, and drinks.', fx: { honor: 2, happy: -1 } },
          { t: 'Say it was a long time ago',
            r: 'He nods as if he expected that. You talk about the weather and the price of seed, and part well enough.', fx: { happy: 1 } },
          { t: 'Ask for your four paces back', if: { flag: 'mod_example_stone_lost' }, check: { s: 'persuasion', s2: 'wil', d: 40 },
            win: { r: 'He walks the line with you in the morning and moves the stone himself. The four paces of barley are yours again.', fx: { coin: 6, happy: 3 } },
            lose: { r: 'He says his father paid for that ground with his back, whatever the stones say. He does not stay for the second cup.', fx: { happy: -3 } } },
        ],
      },
      {
        id: 'mod_example_loan',
        title: 'A friend\'s purse',
        cond: { all: [{ adult: true }, { prison: false }] },
        with: ['friend', 'bestfriend'],
        cool: 12,
        text: '{them} comes by at dusk and stays past supper. A debt falls due at the quarter day, eleven coins, and {khe} is short every one of them. {khe} does not ask outright. {khe} talks about the harvest and the roads until it is clear that you will have to.',
        choices: [
          { t: 'Lend the eleven',
            r: '{them} counts it twice and promises it back by midsummer. You believe about half of that.', fx: { coin: -11, them: { op: 15 }, flag: 'mod_example_lent' } },
          { t: 'Ask what the debt is for',
            r: 'You ask. {them} turns the cup round once before {khe} answers.', fx: { event: 'mod_example_loan_why' } },
          { t: 'Say you have nothing to spare',
            r: '{them} says {khe} understands, and goes before the fire is banked.', fx: { them: { op: -10 } } },
        ],
      },
      {
        id: 'mod_example_loan_why',
        title: 'Dice, not cloth',
        with: ['friend', 'bestfriend'],
        trigger: true,
        text: 'It is not cloth. It is dice, in a back room by the river on market nights, and the man {khe} owes does not send letters. {them} says this was the last time. {khe} says it plainly, as if {khe} had practised it on the way over.',
        choices: [
          { t: 'Lend it, and say it is the last',
            r: '{them} takes the coins and your terms. Neither of you is sure about the terms.', fx: { coin: -11, them: { op: 8 }, flag: 'mod_example_lent' } },
          { t: 'Pay the dice-man yourself, face to face', check: { s: 'intimidation', s2: 'wil', d: 50 },
            win: { r: 'You pay him in the doorway with the river at your back. He counts it, and says he will not have {them} at his table again.', fx: { coin: -11, them: { op: 20 }, honor: 1 } },
            lose: { r: 'He takes the money and laughs. Next market night {them} is at the table again, and the debt starts over.', fx: { coin: -11, happy: -3 } } },
          { t: 'Refuse, and tell {khim} why',
            r: 'You say what you think of dice. {them} hears it out and goes home one friend poorer.', fx: { them: { op: -15 }, honor: 2 } },
        ],
      },
      {
        id: 'mod_example_repaid',
        title: 'A knotted cloth',
        cond: { all: [{ adult: true }, { since: ['mod_example_lent', '>=', 2] }] },
        once: true,
        w: 2,
        text: 'A boy brings a knotted cloth to your door and runs before you can ask him anything. Inside are eleven coins, two of them clipped, and no message. You know whose they are. The clipped ones are an apology, or a joke, or both.',
        choices: [
          { t: 'Keep the money',
            r: 'You put it in the box under the bed. It is the same money it was before you lent it.', fx: { coin: 11 } },
          { t: 'Send it back with a message',
            r: 'You send the cloth back with a message: keep it, and keep away from the river.', fx: { happy: 2, honor: 1 } },
          { t: 'Spend it on a feast for your neighbours',
            r: 'Eleven coins buy a roast, a cask and a fiddler. Half the lane comes. Your friend does not, which says enough.', fx: { happy: 3, fame: 1 } },
        ],
      },
    ],
    customs: {
      'POL-01': [
        { id: 'mod_example_ringwalk', name: 'The ring-walk', kind: 'year', m: 4, who: 'free',
          rule: 'In May each {w1} sends one walker to beat the bounds behind the reeve.',
          text: 'May, and the reeve\'s horn at first light. Each {w1} in the village sends one walker to beat the bounds, stone to stone, with willow wands. The boys are bumped on every stone so they will remember where it stands. The reeve has your name on his list.',
          fx: { happy: 1, sta: 1 },
          keepT: 'Walk the bounds',
          keep: 'You walk from first light to dusk, stone to stone. Your feet ache, and you know where every stone of the parish stands.',
          defy: { t: 'Send word that you are sick', r: 'The reeve marks you down as sick. On the way back your neighbours walk slowly past your door.', fx: { honor: -2 } },
          log: 'You walk the bounds of the parish with every {w1}.' },
      ],
    },
  };

  A.MODC = MC;
  // the example, checked and compiled like any player's mod, registered with the event packs
  const env = MC.env(), res = MC.check(MC.EXAMPLE, env);
  if (res.errors.length) { if (typeof console !== 'undefined') console.error('example mod: ' + res.errors.join('; ')); return; }
  const built = MC.compile(res.mod);
  A.defEvents(built.events);
  // in the page the core takes it into the library as the built-in mod (it starts off); the linter's stub has no core
  if (typeof A.MODS === 'object' && A.MODS && typeof A.MODS.builtIn === 'function') A.MODS.builtIn(res.mod, built, res.warnings);
})();
