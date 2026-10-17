// Player mods (65-mods): the example checks and loads; a bad mod is refused whole with precise errors; nothing a mod
// says can become markup; a mod's events come up in bot lives when it is on and never when it is off; a mod event is
// classified as a hand-written one would be; saves record their mods; drawing changes nothing; the panel passes axe.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { BOT } from '../../bench/bot.mjs';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE = fs.readFileSync(path.join(here, 'example-mod.json'), 'utf8');

// a small player mod; a copy of the example under another id; a mod full of mistakes; one full of markup
const PROBE = JSON.stringify({ format: 'ardan-mod', formatVersion: 1, id: 'probe', name: 'Probe', version: '1.0',
  events: [{ id: 'mod_probe_knock', title: 'A knock', text: 'Someone knocks at your door at dusk and is gone when you open it.', cond: { adult: true }, w: 5, cool: 1,
    choices: [{ t: 'Shut the door', r: 'You bar it.', fx: { happy: -1, flag: 'mod_probe_knocked' } }, { t: 'Look outside', r: 'Nobody.', fx: { wil: 1 } }] }] });
const COPY = EXAMPLE.replace(/mod_example_/g, 'mod_copy_').replace('"id": "example"', '"id": "copy"');
const BAD = JSON.stringify({ format: 'ardan-mod', formatVersion: 1, id: 'bad', name: 'Bad', version: '1.0', colour: 'red',
  events: [
    { id: 'bad_x', title: 'T', text: Array(81).fill('word').join(' '), cond: { adult: 'yes' }, choices: [{ t: 'one', r: 'r' }] },
    { id: 'mod_bad_two', title: 'T', text: 'Hello {nobody} and {them}.', cond: { age: ['>>', 3] },
      choices: [{ t: Array(13).fill('go').join(' '), r: 'x', fx: { coin: 5000, gold: 3, flag: 'nonsense' } }, { t: 'b', check: { s: 'cooking', d: 200 }, r: 'x' }] },
    { id: 'mod_bad_three', title: 'T', text: 'Fine.', cond: { realm: ['POL-99'] },
      choices: [{ t: 'a', r: 'a', fx: { event: 'mod_bad_four' } }, { t: 'b', r: 'b', fx: { trait: 'magical' } }] },
  ] });
const WANT_ERRORS = [
  'mod: unknown field "colour"',
  'events[0] (bad_x).id: must start with "mod_bad_"',
  'events[0] (bad_x).text: is 81 words',
  'events[0] (bad_x).cond.adult: must be true or false',
  'events[0] (bad_x).choices: must be a list of 2 to 4 choices (has 1)',
  'events[1] (mod_bad_two).text: unknown token {nobody}',
  'events[1] (mod_bad_two).text: unknown token {them} (needs "with" on this event)',
  'events[1] (mod_bad_two).cond.age: ">>" is not a comparison',
  'events[1] (mod_bad_two).choices[0].t: is 13 words',
  'events[1] (mod_bad_two).choices[0].fx.coin: 5000 is out of range (-1000 to 1000)',
  'events[1] (mod_bad_two).choices[0].fx.gold: unknown effect',
  'events[1] (mod_bad_two).choices[0].fx.flag: a flag a mod sets must start with "mod_bad_"',
  'events[1] (mod_bad_two).choices[1].check.s: "cooking" is not a known skill or stat',
  'events[1] (mod_bad_two).choices[1].check.d: 200 is out of range (5 to 90)',
  'events[1] (mod_bad_two).choices[1]: a choice with a check puts its result in "win" and "lose"',
  'events[2] (mod_bad_three).cond.realm[0]: "POL-99" is not a known realm id',
  'events[2] (mod_bad_three).choices[0].fx.event: no event "mod_bad_four" in this mod',
  'events[2] (mod_bad_three).choices[1].fx.trait: "magical" is not a known trait',
];
const PWN = '<img src=x data-pwn onerror="window.__pwned=1">';
const XSS = JSON.stringify({ format: 'ardan-mod', formatVersion: 1, id: 'xss', name: '<i data-pwn>X</i>', version: '1.0', author: '<b data-pwn>A</b>', about: 'About ' + PWN + ' "quoted" & ampersand',
  words: { default: { thing: 'thing<b data-pwn>' } },
  events: [{ id: 'mod_xss_one', title: 'Title ' + PWN, text: 'Text ' + PWN + ' {thing} "q" \' onmouseover=\'alert(1)\' &lt;b data-pwn&gt;', cond: { adult: true },
    choices: [{ t: 'Label ' + PWN, r: 'Result ' + PWN + ' "quoted"', fx: { happy: 1 } },
      { t: 'Check ' + PWN, check: { s: 'persuasion', d: 40 }, win: { r: 'Win ' + PWN }, lose: { r: 'Lose ' + PWN } }] }],
  customs: { 'POL-01': [{ id: 'mod_xss_custom', name: '<b data-pwn>Custom</b>', kind: 'year', m: 0, rule: 'Rule ' + PWN, text: 'Scene ' + PWN + ' {w1}', fx: { happy: 1 },
    keepT: 'Keep ' + PWN, keep: 'Kept ' + PWN, defy: { t: 'Defy ' + PWN, r: 'Defied ' + PWN, fx: { honor: -1 } }, log: 'Log ' + PWN }] } });

const SETUP = () => {
  window.MT = {
    reset() { try { localStorage.removeItem(A.MODS.KEY); } catch (e) {} A.MODS._lib = null; A.MODS.last = null; },
    life(seed, o) {
      A.newGame(Object.assign({ seed, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 30 }, o || {}));
      const pc = A.pc(); pc.prison = null; A.S.queue = []; return pc;
    },
    // a living friend, for the events that are about one
    friend(pc) { const t = A.makeAcquaintance(pc, 'friend'); A.link(pc, t, 'friend', 60, 'friend'); return t; },
    // play on like the journal's own test (01-replay): every prompt answered through a journaled command
    play(years) {
      const end = A.S.year + years;
      for (let k = 0; k < 3000 && A.S.year < end && A.pc().alive; k++) {
        A.advance(400);
        let h, g = 0;
        while ((h = A.headReady()) && g++ < 500) { if (h.type === 'event') A.eventAuto(); else A.skipPrompt(); }
      }
    },
    words: s => (String(s || '').match(/\S+/g) || []).length,
    raw: /\{[A-Za-z0-9_.]+\}/,
  };
};

export default {
  // the example: the shipped file is the built-in mod, it checks clean, it compiles, a copy loads as a player's mod,
  // and every choice of every event plays for a character who fits it
  async modsExample(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(([text, copy]) => {
      MT.reset();
      const file = JSON.parse(text), same = JSON.stringify(file) === JSON.stringify(A.MODC.EXAMPLE);
      const chk = A.MODC.check(file, A.MODC.env()), built = A.MODC.compile(chk.mod);
      const listed = A.MODS.list().find(m => m.id === 'example');
      const add = A.MODS.add(copy, 'copy.json');
      A.MODS.setOn('copy', true);
      const pc = MT.life(77);
      const copyOn = A.S.mods.map(m => m.id), copyEvents = Object.keys(A.EV).filter(k => k.startsWith('mod_copy_')).length;
      // play every choice of every example event: no raw token, text at most 80 words, labels at most 12
      A.MODS.setOn('copy', false); A.MODS.setOn('example', true);
      const bad = []; let played = 0;
      for (const e of built.events) {
        for (let i = 0; i < e.choices.length; i++) {
          const p = MT.life(500 + played);
          MT.friend(p); p.coin = 50;
          p.flags.mod_example_stone_lost = A.S.year - 9; p.flags.mod_example_lent = A.S.year - 3;
          const q = { type: 'event', ev: e.id }; A.S.queue = [q];
          const v = A.eventView(q);
          if (v.skip) { bad.push(e.id + ' skipped'); break; }
          const all = [v.title, v.text].concat(v.choices.map(c => c.t));
          if (all.some(x => MT.raw.test(x))) bad.push(e.id + ' token: ' + all.join(' | ').slice(0, 120));
          if (MT.words(v.text) > 80) bad.push(e.id + ' long');
          if (v.choices.some(c => MT.words(c.t) > 12)) bad.push(e.id + ' label');
          const idx = v.choices.findIndex(c => c.i === i); if (idx < 0) continue;
          A.eventChoose(idx); const res = A.S.queue[0].result.text;
          if (!res || MT.raw.test(res)) bad.push(`${e.id} choice ${i + 1} result: ${res}`);
          played++;
        }
      }
      MT.reset();
      return { same, errors: chk.errors, warnings: chk.warnings, events: built.events.length, customs: Object.values(built.customs).flat().length,
        listed: listed && { events: listed.events, customs: listed.customs, on: listed.on, builtIn: listed.builtIn }, add: { ok: add.ok, events: add.events, errors: add.errors }, copyOn, copyEvents, played, bad };
    }, [EXAMPLE, COPY]);
    const ok = r.same && !r.errors.length && r.events === 5 && r.customs === 1 && r.listed && r.listed.builtIn && !r.listed.on && r.add.ok && r.copyEvents === 5 &&
      r.copyOn.includes('copy') && r.played >= 14 && !r.bad.length;
    return { ok, detail: `example-mod.json ${r.same ? 'is' : 'IS NOT'} the built-in mod; ${r.errors.length} errors${r.warnings.length ? ` (warnings: ${r.warnings.join('; ')})` : ''}; ${r.events} events and ${r.customs} custom compiled; built in and off by default: ${!!(r.listed && r.listed.builtIn && !r.listed.on)}; a copy under another id loads (${r.add.ok}, ${r.add.events} events) and its 5 events are registered once a life starts with it; ${r.played} choices played: ${r.bad.length ? 'BAD ' + r.bad.slice(0, 4).join('; ') : 'no raw token, nothing over the word limits'}` };
  },

  // a bad mod: every mistake reported where it is, and nothing from the file added
  async modsBadMod(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(([bad, want]) => {
      MT.reset();
      const before = Object.keys(A.EV).length, lib0 = JSON.stringify(A.MODS.read());
      const res = A.MODS.add(bad, 'bad.json');
      const missing = want.filter(w => !res.errors.some(e => e.startsWith(w)));
      const json = A.MODS.add('{"format": "ardan-mod", ', 'broken.json');
      const newer = A.MODS.add(JSON.stringify({ format: 'ardan-mod', formatVersion: 2, id: 'later', name: 'Later', version: '1', events: [] }), 'later.json');
      const loop = A.MODC.check({ format: 'ardan-mod', formatVersion: 1, id: 'loop', name: 'L', version: '1', events: [
        { id: 'mod_loop_a', title: 'A', text: 'A.', cond: { adult: true }, choices: [{ t: 'x', r: 'x', fx: { event: 'mod_loop_b' } }, { t: 'y', r: 'y' }] },
        { id: 'mod_loop_b', title: 'B', text: 'B.', trigger: true, choices: [{ t: 'x', r: 'x', fx: { event: 'mod_loop_a' } }, { t: 'y', r: 'y' }] }] }, A.MODC.env());
      const proto = A.MODC.check(JSON.parse('{"format":"ardan-mod","formatVersion":1,"id":"proto","name":"P","version":"1","__proto__":{"polluted":1},"events":[{"id":"mod_proto_a","title":"{constructor}","text":"{__proto__}","cond":{"adult":true},"choices":[{"t":"x","r":"x"},{"t":"y","r":"y"}]}]}'), A.MODC.env());
      return { ok: res.ok, n: res.errors.length, missing, errors: res.errors, json: json.errors[0], newer: newer.errors[0], loop: loop.errors, proto: proto.errors,
        polluted: ({}).polluted, added: Object.keys(A.EV).length - before, libSame: JSON.stringify(A.MODS.read()) === lib0, evs: Object.keys(A.EV).filter(k => k.startsWith('mod_bad_')).length };
    }, [BAD, WANT_ERRORS]);
    const ok = !r.ok && !r.missing.length && r.added === 0 && r.libSame && !r.evs && /not valid JSON/.test(r.json) && /newer than this game reads/.test(r.newer) &&
      r.loop.some(e => /leads back to itself: mod_loop_a -> mod_loop_b -> mod_loop_a/.test(e)) && r.proto.some(e => /unknown field "__proto__"/.test(e)) &&
      r.proto.some(e => /unknown token \{constructor\}/.test(e)) && r.proto.some(e => /unknown token \{__proto__\}/.test(e)) && r.polluted === undefined;
    return { ok, detail: `refused whole: ${r.n} errors, all ${WANT_ERRORS.length - r.missing.length} of the ${WANT_ERRORS.length} expected ones with their place${r.missing.length ? '; MISSING ' + r.missing.slice(0, 3).join(' / ') + ' GOT ' + r.errors.slice(0, 4).join(' / ') : ''}; ${r.added} events registered, library ${r.libSame ? 'unchanged' : 'CHANGED'}; broken JSON: "${r.json}"; format 2: "${r.newer}"; a chain loop: "${(r.loop[0] || '').slice(0, 90)}"; __proto__ and {constructor} refused (${r.proto.length} errors), nothing polluted` };
  },

  // markup in every field: angle brackets are taken out on load, and everything left is drawn as text. Then the
  // drawing is tested on its own: markup put straight into a compiled event (as if the checker were bypassed) stays text.
  async modsXss(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(xss => {
      MT.reset();
      const res = A.MODS.add(xss, 'xss.json');
      A.MODS.setOn('xss', true);
      UI.screen = 'game';
      const pc = MT.life(31, { startAge: 30 });
      const found = [], texts = [];
      const scan = where => { if (document.querySelector('[data-pwn], img[src="x"]') || window.__pwned) found.push(where); };
      // the panel shows the name, author and about
      UI.MODS.open(); scan('panel'); texts.push(document.querySelector('#modal').textContent);
      UI.ov = null;
      // the event, its choices and both kinds of result
      for (const i of [0, 1]) {
        A.S.queue = [{ type: 'event', ev: 'mod_xss_one' }]; UI.renderModal(); scan('event'); texts.push(document.querySelector('#modal').textContent);
        document.querySelectorAll('#modal [data-a="evChoose"]')[i].click(); scan('result'); texts.push(document.querySelector('#modal').textContent);
        A.S.queue = []; UI.renderModal();
      }
      // the custom's scene and the realm card, where the realm bible is built
      let custom = 'no realm bible in this build';
      if (A.BIBLE && A.BIBLE.custom('mod_xss_custom')) {
        A.S.queue = [{ type: 'event', ev: 'rb_custom', forced: true, ctx: { cid: 'mod_xss_custom' } }]; UI.renderModal(); scan('custom'); texts.push(document.querySelector('#modal').textContent);
        A.S.queue = []; UI.renderModal(); UI.tab = 'realm'; UI.render(); scan('realm tab'); custom = /data-pwnCustom/.test(document.body.textContent) ? 'on the realm card, as text' : 'NOT on the realm card';
      }
      T.renderAll(); scan('every tab');
      const all = texts.join(' ');
      // straight into the compiled event: the drawing escapes it
      const e = A.EV.mod_xss_one; e.title = 'T ' + '<b data-pwn>bold</b>'; e.text = '<img src=x data-pwn onerror="window.__pwned=1">'; e.choices[0].t = '<svg data-pwn onload="window.__pwned=1"></svg>';
      A.S.queue = [{ type: 'event', ev: 'mod_xss_one' }]; UI.renderModal(); scan('bypass');
      const shown = document.querySelector('#modal').textContent;
      A.S.queue = []; UI.renderModal(); UI.screen = 'title';
      MT.reset();
      return { ok: res.ok, warnings: res.warnings, found, quotes: /"quoted"/.test(all) && /onmouseover='alert\(1\)'/.test(all), entity: all.includes('&lt;b data-pwn&gt;'), stripped: !/[<>]/.test(texts.join('')),
        bypass: shown.includes('<img src=x data-pwn') && shown.includes('<svg data-pwn'), custom };
    }, XSS);
    const ok = r.ok && r.warnings.some(w => /angle brackets? (was|were) removed/.test(w)) && !r.found.length && r.quotes && r.entity && r.stripped && r.bypass && !/NOT/.test(r.custom);
    return { ok, detail: `markup in 19 fields: loaded with "${(r.warnings.find(w => /angle/.test(w)) || 'NO WARNING').slice(0, 70)}"; injected elements in ${r.found.length ? r.found.join(', ') : 'none of panel, event, results, custom scene, every tab'}; quotes and "&lt;" shown as written: ${r.quotes && r.entity}; markup put straight into the event drawn as text: ${r.bypass}; custom ${r.custom}` };
  },

  // bot lives (bench/bot.mjs): with the mods on, their events come up; with them off, never, on the same seeds
  async modsFireInLives(pg) {
    await pg.evaluate(SETUP);
    await pg.evaluate(BOT);
    const r = await pg.evaluate(probe => {
      MT.reset();
      A.MODS.add(probe, 'probe.json');
      const run = on => {
        A.MODS.setOn('example', on); A.MODS.setOn('probe', on);
        const out = [];
        const mixes = [['human', 'POL-01', 'peasant'], ['human', 'POL-05', 'artisan'], ['dwarf', 'POL-20', 'peasant'], ['human', 'POL-01', 'serf'], ['orc', 'POL-11', 'peasant'], ['human', 'POL-03', 'peasant']];
        for (let i = 0; i < 6; i++) {
          const [race, realm, status] = mixes[i];
          const L = B.life({ seed: 6500 + i * 131, race, realm, status, sex: i % 2 ? 'F' : 'M', startAge: 16 }, ['careful', 'greedy', 'random'][i % 3], false, 35);
          const pc = A.P(A.S.pc), ev = pc.flags.ev || {}, rb = pc.rb || {};
          out.push({ years: L.years, probe: ev.mod_probe_knock ? 1 : 0, example: Object.keys(ev).filter(k => k.startsWith('mod_example_')), custom: Object.keys(rb).filter(k => k.startsWith('mod_')).length,
            flags: Object.keys(pc.flags).filter(k => k.startsWith('mod_')).length, mods: (A.S.mods || []).map(m => m.id).join(',') });
        }
        return out;
      };
      const on = run(true), off = run(false);
      MT.reset();
      return { on, off, bible: !!A.BIBLE };
    }, PROBE);
    const sum = (L, f) => L.reduce((a, x) => a + f(x), 0);
    const onProbe = sum(r.on, x => x.probe), onEx = sum(r.on, x => x.example.length ? 1 : 0), onCustom = sum(r.on, x => x.custom ? 1 : 0);
    const offAny = sum(r.off, x => x.probe + x.example.length + x.custom + x.flags);
    // a dwarf of 16 is a child for the whole run (grown at 40), so the probe's adult event cannot come in that life
    // the probe mod (weight 5, any adult) is the firm signal; how often the example's own events come up turns on the
    // random stream, so it is reported, not asserted (README: pooled over more lives)
    // judged on lives long enough to meet a scene: a shifted random stream can end a life at 2 or 4 years
    const long = r.on.filter(x => x.years >= 10), onProbeLong = long.filter(x => x.probe).length;
    const ok = long.length >= 3 && onProbeLong >= Math.ceil(long.length * 2 / 3) && offAny === 0 && r.off.every(x => x.mods === '') && r.on.every(x => x.mods === 'example,probe');
    return { ok, detail: `6 bot lives each way (16 to 51, same seeds; years ${r.on.map(x => x.years).join('/')}): on, the probe mod's event came up in ${onProbe} of 6 lives (${onProbeLong} of the ${long.length} of 10+ years), the example's in ${onEx} (${[...new Set(r.on.flatMap(x => x.example))].join(', ') || 'none'}), its Aldmark custom met in ${r.bible ? onCustom : 'none (no realm bible in this build)'}; off, mod events, customs or flags in ${offAny} lives` };
  },

  // A.CX_RX reads the condition's text: a mod's condition reads as the hand-written one would, so A.evFit draws it alike
  async modsClassify(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      const cases = [
        [{ all: [{ ruler: true }, { atWar: true }] }, (p, C) => C.ruler(p) && C.atWar(p)],
        [{ noble: true }, (p, C) => C.noble(p)],
        [{ not: { noble: true } }, (p, C) => !C.noble(p)],
        [{ all: [{ adult: true }, { poor: true }] }, (p, C) => C.adult(p) && C.poor(p)],
        [{ job: 'smith' }, (p, C) => C.job(p, 'smith')],
        [{ jobRank: 2 }, (p, C) => C.jobRank(p, 2)],
        [{ soldier: true }, (p, C) => C.soldier(p)],
        [{ child: true }, (p, C) => C.child(p)],
        [{ any: [{ rich: true }, { office: true }] }, (p, C) => C.rich(p) || C.office(p)],
        [{ allies: ['>', 0] }, (p, C) => C.allies(p) > 0],
        [{ unfree: true }, (p, C) => C.unfree(p)],
        [{ all: [{ adult: true }, { realm: ['POL-01'] }, { flag: 'x' }] }, (p, C) => C.adult(p) && C.realm(p, 'POL-01') && C.flag(p, 'x')],
        [{ ageAdj: ['<', 14] }, (p, C) => C.ageAdj(p) < 14],
      ];
      const mod = { format: 'ardan-mod', formatVersion: 1, id: 'cls', name: 'C', version: '1', events: cases.map(([c], i) => ({ id: 'mod_cls_' + i, title: 'T', text: 'Your master pays you a day\'s wage.', cond: c, choices: [{ t: 'a', r: 'a' }, { t: 'b', r: 'b' }] })) };
      const chk = A.MODC.check(mod, A.MODC.env());
      if (chk.errors.length) return { errors: chk.errors };
      const built = A.MODC.compile(chk.mod).events;
      const pcs = [['human', 'POL-01', 'peasant', 30], ['human', 'POL-01', 'noble', 30], ['human', 'POL-02', 'royal', 40], ['human', 'POL-01', 'peasant', 9]].map(([race, realm, status, startAge], i) => {
        A.newGame({ seed: 90 + i, race, realm, status, startAge, sex: 'M' }); return JSON.parse(A.serialize());
      });
      const diff = [], classes = {};
      cases.forEach(([c, fn], i) => {
        const m = built[i], h = { id: 'hand_' + i, title: 'T', text: m.text, cond: fn, choices: m.choices };
        const am = A.evAudience(m), ah = A.evAudience(h);
        for (const k of Object.keys(A.CX_RX)) if (am.cond[k]) classes[k] = (classes[k] || 0) + 1;
        if (JSON.stringify(am) !== JSON.stringify(ah)) diff.push(`${m.cond.toString()} vs ${fn.toString()}`);
        for (const S of pcs) { A.deserialize(JSON.parse(JSON.stringify(S))); const pc = A.pc(); if (A.evFit(m, pc) !== A.evFit(h, pc)) diff.push('evFit ' + i); if (!!m.cond(pc, A.C) !== !!fn(pc, A.C)) diff.push('cond ' + i); }
      });
      return { n: cases.length, diff, classes, sample: built[0].cond.toString() };
    });
    if (r.errors) return { ok: false, detail: 'mod did not check: ' + r.errors.join('; ') };
    return { ok: !r.diff.length && Object.keys(r.classes).length >= 5, detail: `${r.n} conditions, each beside the hand-written (p, C) => ... it stands for: ${r.diff.length ? 'DIFFER ' + r.diff.slice(0, 3).join('; ') : 'same audience (A.CX_RX and A.EV_RX), same A.evFit for 4 characters and the same answer'}; classes met ${JSON.stringify(r.classes)}; e.g. ${r.sample}` };
  },

  // a save records the mods its life began with; loading brings them back, warns about one that is gone, and an
  // old save without the record loads with none. The same mods and seed play the same, whatever else is in the library.
  async modsSaveLoad(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(async probe => {
      MT.reset();
      A.MODS.setOn('example', true);
      const out = {};
      // the same seed with the same mods twice, with another mod loaded (off) in between
      const play = () => { T.enter({ seed: 4242, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 18 }); MT.play(6); return T.hash(A.S.people) + ':' + A.rngState; };
      const h1 = play();
      A.MODS.add(probe, 'probe.json'); A.MODS.setOn('probe', false);
      const h2 = play();
      out.sameWorld = h1 === h2;
      out.journal = A.J && A.J.o && (A.J.o.mods || []).map(m => m.id).join(',');
      // the journal's replay starts with the journal's mods, even with them off in the library now
      const want = T.hash(JSON.parse(A.serialize())), J = JSON.parse(JSON.stringify(A.J));
      A.MODS.setOn('example', false);
      const rep = A.replay(J);
      out.replay = rep.ok && T.hash(JSON.parse(A.serialize())) === want;
      out.recorded = (A.S.mods || []).map(m => `${m.id} ${m.v} ${m.hash}`).join(',');
      // a save and a reload with the example now off in the library: it comes back on for this life
      const enc = await SAVES.encode(A.S, A.J); const d = await SAVES.decode(enc.bytes); UI.enterSave(d);
      out.back = A.MODS.isOn('example') && !A.EV.mod_example_stone.trigger;
      // a player's mod, saved, then removed from the library
      A.MODS.setOn('probe', true);
      T.enter({ seed: 5, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'F', startAge: 20 }); MT.play(1);
      const logLine = 'A "quoted" line from a mod & co';
      A.log(logLine);
      const enc2 = await SAVES.encode(A.S, A.J);
      A.MODS.remove('probe');
      const d2 = await SAVES.decode(enc2.bytes);
      UI.enterSave(d2);
      out.missing = (A.MODS.note && A.MODS.note.missing || []).map(m => m.id).join(',');
      out.toast = (document.querySelector('#toast') || {}).textContent || '';
      out.probeOff = !!A.EV.mod_probe_knock && A.EV.mod_probe_knock.trigger === true;
      out.stillRecorded = (A.S.mods || []).map(m => m.id).join(',');
      out.prose = A.S.log.flatMap(e => e.lines || []).some(l => (Array.isArray(l) ? l[0] : l) === logLine);
      // an old save, without A.S.mods
      const S0 = JSON.parse(A.serialize()); delete S0.mods; A.deserialize(S0);
      out.old = A.MODS.active.length === 0 && !A.MODS.note && A.EV.mod_example_stone.trigger === true;
      UI.ov = null; UI.screen = 'title';
      MT.reset();
      return out;
    }, PROBE);
    const ok = r.sameWorld && r.journal === 'example' && r.replay && /^example 1\.0\.0 [0-9a-f]{14}$/.test(r.recorded) && r.back && r.missing === 'probe' &&
      /not loaded here: Probe 1\.0/.test(r.toast) && r.probeOff && r.stillRecorded === 'probe' && r.prose && r.old;
    return { ok, detail: `same seed and mods, another mod loaded between: ${r.sameWorld ? 'same world' : 'WORLDS DIFFER'}; journal records mods "${r.journal}", its replay ${r.replay ? 'reaches the same world' : 'DIFFERS'} with the mod off in the library; save records "${r.recorded}" and brings it back: ${r.back}; a removed mod is reported missing ("${r.toast.slice(0, 80)}...") and its events stay off: ${r.probeOff}, the save keeps "${r.stillRecorded}"; a quoted log line survives the save: ${r.prose}; an old save loads with no mods: ${r.old}` };
  },

  // drawing every tab and the Mods panel, with mods in play, neither moves the random stream nor changes the state
  async modsRenderPure(pg) {
    await pg.evaluate(SETUP);
    const r = await pg.evaluate(() => {
      MT.reset();
      A.MODS.setOn('example', true);
      T.enter({ seed: 8181, race: 'human', realm: 'POL-01', status: 'peasant', sex: 'M', startAge: 20 });
      T.play(3);
      T.renderAll();   // as in 01-replay: the first draw may do harmless setup (an empty cargo hold), so measure from after it
      const rng = A.rngState, h = T.hash(A.S), lib = localStorage.getItem(A.MODS.KEY);
      T.renderAll();
      UI.ov = { type: 'menu' }; UI.renderModal(); UI.A.mods(); UI.MODS.html(); UI.A.modBack(); UI.ov = null; UI.renderModal();
      const out = { rngMoved: A.rngState !== rng, stateChanged: T.hash(A.S) !== h, libChanged: localStorage.getItem(A.MODS.KEY) !== lib, active: A.MODS.active.map(m => m.id).join(',') };
      MT.reset();
      return out;
    });
    return { ok: !r.rngMoved && !r.stateChanged && !r.libChanged && r.active === 'example', detail: `with "${r.active}" in play, every tab, the Menu and the Mods panel drawn: random stream moved ${r.rngMoved}, state changed ${r.stateChanged}, library changed ${r.libChanged}` };
  },

  // the panel as a player uses it: title screen, Mods, load a file through the file chooser, a bad file's errors,
  // tick and untick, remove; axe-core (WCAG 2.2 AA and best practice) on it at the title and in a game
  async modsPanelAxe(pg, errs) {
    await pg.evaluate(SETUP);
    await pg.evaluate(() => { MT.reset(); UI.screen = 'title'; UI.ov = null; UI.render(); });
    await pg.evaluate(fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'));
    const scan = () => pg.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => `${v.id}(${v.nodes.length})`));
    const found = [];
    await pg.click('#title [data-a="mods"]');
    const opened = await pg.evaluate(() => !!document.querySelector('#modal .mods-panel'));
    found.push(...(await scan()).map(v => 'empty:' + v));
    const upload = async (name, text) => {
      const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.click('#modal [data-a="modLoad"]')]);
      await fc.setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
      await pg.waitForFunction(n => A.MODS.last && A.MODS.last.file === n, name);
    };
    await upload('probe.json', PROBE);
    const listed = await pg.evaluate(() => ({ probe: !!document.querySelector('#modal #mod-on-probe:checked'), focus: document.activeElement && document.activeElement.id }));
    await upload('bad.json', BAD);
    const badShown = await pg.evaluate(() => document.querySelectorAll('#modal .mods-last li').length);
    found.push(...(await scan()).map(v => 'errors:' + v));
    await pg.click('#modal label[for="mod-on-example"]');
    const ticked = await pg.evaluate(() => A.MODS.list().find(m => m.id === 'example').on);
    await pg.click('#modal [data-a="modRemove"][data-v="probe"]');
    const removed = await pg.evaluate(() => !A.MODS.list().some(m => m.id === 'probe'));
    // in a game, from the Menu
    await pg.evaluate(() => { UI.ov = null; UI.renderModal(); UI.crRandomize(); UI._newLifeOk = true; UI.startLife(); UI._newLifeOk = false; A.S.queue = []; UI.render(); });
    await pg.click('button:has-text("Menu")');
    await pg.click('#modal [data-a="mods"]');
    const inGame = await pg.evaluate(() => ({ life: /This life began with Stones and Debts/.test(document.querySelector('#modal').textContent), back: !!document.querySelector('#modal [data-a="modBack"]'), mods: A.S.mods.map(m => m.id).join(',') }));
    found.push(...(await scan()).map(v => 'game:' + v));
    await pg.click('#modal [data-a="modBack"]');
    const backToMenu = await pg.evaluate(() => UI.ov && UI.ov.type === 'menu');
    await pg.evaluate(() => { UI.ov = null; UI.renderModal(); MT.reset(); });
    for (let i = errs.length - 1; i >= 0; i--) if (/Refused to connect to 'https:\/\/fonts\.googleapis\.com/.test(errs[i])) errs.splice(i, 1);
    const ok = opened && listed.probe && badShown >= 12 && ticked && removed && inGame.life && inGame.back && inGame.mods === 'example' && backToMenu && !found.length;
    return { ok, detail: `title, Mods: ${opened}; a file through the file chooser is listed and ticked: ${listed.probe} (focus on ${listed.focus}); a bad file lists ${badShown} problems; tick by its label: ${ticked}; remove: ${removed}; in a game the panel says "This life began with Stones and Debts": ${inGame.life}, back to the Menu: ${backToMenu}; axe: ${found.length} violations${found.length ? ': ' + found.slice(0, 6).join(', ') : ''}` };
  },
};
